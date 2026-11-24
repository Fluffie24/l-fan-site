const crypto = require('node:crypto');

const ZSET_KEY = 'wataridori:lb:v1:zset';
const META_KEY = 'wataridori:lb:v1:meta';
const RL_PREFIX = 'wataridori:lb:v1:rl:';
const TOP_LIMIT = 25;
const MAX_STORED_ENTRIES = 100;
const RATE_LIMIT_PER_MIN = 15;
const MAX_BODY_BYTES = 8192;
const UPSTREAM_TIMEOUT_MS = 7000;

const ALLOWED_CHAPTERS = new Set([
    'Midnight Station',
    'Rough Ocean',
    'Golden Sunset',
    'Spring Dawn',
]);

function getRedisConfig() {
    const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || '';
    const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || '';
    const trimmedUrl = typeof url === 'string' ? url.trim().replace(/\/+$/, '') : '';
    const trimmedToken = typeof token === 'string' ? token.trim() : '';
    if (!trimmedUrl || !trimmedToken) return null;
    return { url: trimmedUrl, token: trimmedToken };
}

async function redisPipeline(config, commands) {
    const response = await fetch(`${config.url}/pipeline`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${config.token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(commands),
        signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });

    if (!response.ok) {
        throw new Error(`Redis pipeline HTTP ${response.status}`);
    }

    const payload = await response.json();
    if (!Array.isArray(payload)) {
        throw new Error('Unexpected Redis pipeline response');
    }

    for (const item of payload) {
        if (item && item.error) {
            throw new Error(`Redis command error: ${item.error}`);
        }
    }

    return payload.map((item) => (item ? item.result : null));
}

function sanitizeName(raw) {
    if (typeof raw !== 'string') return null;
    if (/[<>]/.test(raw)) return null;
    const cleaned = raw
        .replace(/[\u0000-\u001F\u007F\u200B-\u200D\uFEFF]/g, '')
        .replace(/\s+/g, ' ')
        .trim();

    const len = Array.from(cleaned).length;
    if (len < 1 || len > 18) return null;
    return cleaned;
}

function validateSubmission(body) {
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
        return { errorCode: 'INVALID_PAYLOAD', error: 'Invalid request payload.' };
    }

    const name = sanitizeName(body.name);
    if (!name) {
        return {
            errorCode: 'INVALID_NAME',
            error: 'Player name must be 1 to 18 valid characters (no < or >).',
        };
    }

    const score = Number(body.score);
    if (!Number.isInteger(score) || score < 1 || score > 10000000) {
        return {
            errorCode: 'INVALID_SCORE',
            error: 'Score must be an integer between 1 and 10,000,000.',
        };
    }

    const maxCombo = Number(body.maxCombo);
    if (!Number.isInteger(maxCombo) || maxCombo < 0 || maxCombo > 99999) {
        return { errorCode: 'INVALID_PAYLOAD', error: 'Invalid maxCombo value.' };
    }

    const season = Number(body.season);
    if (!Number.isInteger(season) || season < 1 || season > 999) {
        return { errorCode: 'INVALID_PAYLOAD', error: 'Invalid season value.' };
    }

    const chapter = typeof body.chapter === 'string' ? body.chapter.trim() : '';
    if (!ALLOWED_CHAPTERS.has(chapter)) {
        return { errorCode: 'INVALID_PAYLOAD', error: 'Invalid chapter name.' };
    }

    const durationSec = Number(body.durationSec);
    if (!Number.isFinite(durationSec) || durationSec < 1 || durationSec > 21600) {
        return { errorCode: 'INVALID_DURATION', error: 'Invalid flight duration.' };
    }

    // Allows sustained x5 combo + Dream Fever streaks while blocking fabricated bursts
    const maxPlausibleScore = Math.ceil(durationSec * 4500) + 20000;
    if (score > maxPlausibleScore) {
        return {
            errorCode: 'SCORE_RATE_LIMIT',
            error: 'Score exceeds plausible flight rate.',
        };
    }

    return {
        data: {
            name,
            score,
            maxCombo,
            season,
            chapter,
        },
    };
}

function parseEntryMeta(raw) {
    if (!raw || typeof raw !== 'string') return null;
    try {
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object') return null;
        return {
            id: String(parsed.id || ''),
            name: String(parsed.name || 'Pilot'),
            score: Number(parsed.score) || 0,
            maxCombo: Number(parsed.maxCombo) || 0,
            season: Number(parsed.season) || 1,
            chapter: ALLOWED_CHAPTERS.has(parsed.chapter) ? parsed.chapter : 'Midnight Station',
            createdAt: typeof parsed.createdAt === 'string' ? parsed.createdAt : '',
        };
    } catch {
        return null;
    }
}

async function fetchTopEntries(config, ids) {
    if (!Array.isArray(ids) || ids.length === 0) return [];
    const [rawMetas] = await redisPipeline(config, [['HMGET', META_KEY, ...ids]]);
    if (!Array.isArray(rawMetas)) return [];

    const entries = [];
    for (let i = 0; i < rawMetas.length; i += 1) {
        const meta = parseEntryMeta(rawMetas[i]);
        if (!meta) continue;
        entries.push({
            rank: entries.length + 1,
            ...meta,
        });
    }
    return entries;
}

async function readJsonBody(req) {
    if (req.body && typeof req.body === 'object') {
        return req.body;
    }
    if (typeof req.body === 'string') {
        if (Buffer.byteLength(req.body, 'utf8') > MAX_BODY_BYTES) {
            throw new Error('BODY_TOO_LARGE');
        }
        return JSON.parse(req.body);
    }

    const chunks = [];
    let totalBytes = 0;
    for await (const chunk of req) {
        const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        totalBytes += buf.length;
        if (totalBytes > MAX_BODY_BYTES) {
            throw new Error('BODY_TOO_LARGE');
        }
        chunks.push(buf);
    }

    const text = Buffer.concat(chunks).toString('utf8').trim();
    if (!text) return null;
    return JSON.parse(text);
}

function getClientIpHash(req) {
    const forwarded = req.headers?.['x-forwarded-for'];
    const firstIp = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : '';
    const ip = firstIp || req.socket?.remoteAddress || 'unknown';
    return crypto.createHash('sha256').update(ip).digest('hex').slice(0, 16);
}

module.exports = async function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store');

    const config = getRedisConfig();

    if (req.method === 'GET') {
        if (!config) {
            return res.status(200).json({
                storageConfigured: false,
                mode: 'local',
                entries: [],
                total: 0,
            });
        }

        try {
            const [ids, total] = await redisPipeline(config, [
                ['ZREVRANGE', ZSET_KEY, 0, TOP_LIMIT - 1],
                ['ZCARD', ZSET_KEY],
            ]);
            const entries = await fetchTopEntries(config, ids);
            return res.status(200).json({
                storageConfigured: true,
                mode: 'global',
                entries,
                total: typeof total === 'number' ? total : entries.length,
            });
        } catch (err) {
            console.error(new Error('GET /api/leaderboard failed', { cause: err }));
            return res.status(502).json({ error: 'Unable to load leaderboard right now.' });
        }
    }

    if (req.method === 'POST') {
        let rawBody;
        try {
            rawBody = await readJsonBody(req);
        } catch (err) {
            const status = err.message === 'BODY_TOO_LARGE' ? 413 : 400;
            return res.status(status).json({ error: 'Invalid JSON submission.' });
        }

        const validated = validateSubmission(rawBody);
        if (validated.error) {
            return res.status(400).json({
                errorCode: validated.errorCode || 'INVALID_PAYLOAD',
                error: validated.error,
            });
        }

        const entry = {
            id: `${Date.now().toString(36)}-${crypto.randomBytes(4).toString('hex')}`,
            name: validated.data.name,
            score: validated.data.score,
            maxCombo: validated.data.maxCombo,
            season: validated.data.season,
            chapter: validated.data.chapter,
            createdAt: new Date().toISOString(),
        };

        if (!config) {
            return res.status(200).json({
                storageConfigured: false,
                mode: 'local',
                saved: false,
                entry,
            });
        }

        try {
            const ipHash = getClientIpHash(req);
            const rlKey = `${RL_PREFIX}${ipHash}`;
            const [hitCount] = await redisPipeline(config, [
                ['INCR', rlKey],
                ['EXPIRE', rlKey, 60],
            ]);

            if (typeof hitCount === 'number' && hitCount > RATE_LIMIT_PER_MIN) {
                return res.status(429).json({
                    errorCode: 'RATE_LIMITED',
                    error: 'Too many score submissions. Please wait a minute and try again.',
                });
            }

            const [, , rankRes, topIds, overflowIds] = await redisPipeline(config, [
                ['ZADD', ZSET_KEY, entry.score, entry.id],
                ['HSET', META_KEY, entry.id, JSON.stringify(entry)],
                ['ZREVRANK', ZSET_KEY, entry.id],
                ['ZREVRANGE', ZSET_KEY, 0, TOP_LIMIT - 1],
                ['ZREVRANGE', ZSET_KEY, MAX_STORED_ENTRIES, -1],
            ]);

            const cleanupCommands = [];
            if (Array.isArray(topIds) && topIds.length > 0) {
                cleanupCommands.push(['HMGET', META_KEY, ...topIds]);
            }
            if (Array.isArray(overflowIds) && overflowIds.length > 0) {
                cleanupCommands.push(['ZREM', ZSET_KEY, ...overflowIds]);
                cleanupCommands.push(['HDEL', META_KEY, ...overflowIds]);
            }

            let entries = [];
            if (cleanupCommands.length > 0) {
                const postResults = await redisPipeline(config, cleanupCommands);
                if (Array.isArray(topIds) && topIds.length > 0 && Array.isArray(postResults[0])) {
                    for (const rawMeta of postResults[0]) {
                        const meta = parseEntryMeta(rawMeta);
                        if (!meta) continue;
                        entries.push({
                            rank: entries.length + 1,
                            ...meta,
                        });
                    }
                }
            }

            const rank = typeof rankRes === 'number' ? rankRes + 1 : null;

            return res.status(201).json({
                storageConfigured: true,
                mode: 'global',
                saved: true,
                rank,
                entry,
                entries,
            });
        } catch (err) {
            console.error(new Error('POST /api/leaderboard failed', { cause: err }));
            return res.status(502).json({ error: 'Unable to save score right now.' });
        }
    }

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed' });
};
