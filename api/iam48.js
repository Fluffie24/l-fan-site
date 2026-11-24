const MEMBER_SLUG_URL = 'https://app.bnk48.com/members/bnk48/l';
const MEMBER_ID = 112;
const VIDEO_CONTENT_BASE = `https://app.bnk48.com/member/${MEMBER_ID}/videocontent`;
const ALLOWED_IMAGE_HOSTS = new Set(['img.bnk48cdn.net', 'app.bnk48.com']);
const UPSTREAM_TIMEOUT_MS = 8000;

function decodeHtmlEntities(str) {
    if (!str) return '';
    return str
        .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
        .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&#39;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .trim();
}

function sanitizeHttpsUrl(rawUrl, allowedHosts) {
    if (typeof rawUrl !== 'string' || !rawUrl.trim()) return null;
    try {
        const parsed = new URL(rawUrl, 'https://app.bnk48.com');
        if (parsed.protocol !== 'https:') return null;
        if (allowedHosts && !allowedHosts.has(parsed.hostname)) return null;
        return parsed.toString();
    } catch {
        return null;
    }
}

function parseProfileHtml(html) {
    const coverMatch = html.match(/class="profile"[^>]*style="background-image:\s*url\('([^']+)'\)"/i);
    const avatarMatch = html.match(/<img[^>]*class="avatar"[^>]*src="([^"]+)"/i);
    const nameMatch = html.match(/<p[^>]*class="displayName"[^>]*>([\s\S]*?)<\/p>/i);
    const captionMatch = html.match(/<p[^>]*class="caption"[^>]*>([\s\S]*?)<\/p>/i);

    const giftsMatch = html.match(/icon-gift\.png[\s\S]*?data-value="(\d+)"/i);
    const starsMatch = html.match(/icon-like\.png[\s\S]*?data-value="(\d+)"/i);
    const oshiMatch = html.match(/data-value="(\d+)"[^>]*>\s*0?\s*<\/span>\s*<span[^>]*>\s*Oshi\s*<\/span>/i);
    const kamiOshiMatch = html.match(/data-value="(\d+)"[^>]*>\s*0?\s*<\/span>\s*<span[^>]*>\s*Kami-Oshi\s*<\/span>/i);

    return {
        displayName: decodeHtmlEntities(nameMatch?.[1] || 'L'),
        caption: decodeHtmlEntities(captionMatch?.[1] || ''),
        avatar: sanitizeHttpsUrl(avatarMatch?.[1], ALLOWED_IMAGE_HOSTS),
        cover: sanitizeHttpsUrl(coverMatch?.[1], ALLOWED_IMAGE_HOSTS),
        profileUrl: MEMBER_SLUG_URL,
        stats: {
            gifts: giftsMatch ? Number(giftsMatch[1]) : null,
            stars: starsMatch ? Number(starsMatch[1]) : null,
            oshi: oshiMatch ? Number(oshiMatch[1]) : null,
            kamiOshi: kamiOshiMatch ? Number(kamiOshiMatch[1]) : null,
        },
    };
}

function normalizeVideos(rawList) {
    if (!Array.isArray(rawList)) return [];
    const results = [];
    for (const entry of rawList) {
        const vc = entry?.videoContent;
        if (!vc || !vc.id) continue;
        const playbackUrl = sanitizeHttpsUrl(entry.url || `/member-playback/${vc.id}`, new Set(['app.bnk48.com']));
        const thumbnail = sanitizeHttpsUrl(vc.thumbnailImageUrl, ALLOWED_IMAGE_HOSTS);
        if (!playbackUrl) continue;
        results.push({
            id: Number(vc.id),
            title: typeof vc.content === 'string' ? vc.content.trim() : '',
            isLive: Boolean(vc.isLive),
            thumbnail,
            publishedAt: typeof vc.publishedAt === 'string' ? vc.publishedAt : null,
            url: playbackUrl,
        });
    }
    return results;
}

async function fetchUpstream(url, acceptHeader) {
    const response = await fetch(url, {
        headers: {
            Accept: acceptHeader,
            'User-Agent': 'Mozilla/5.0 (compatible; LFanSiteWidget/1.0)',
        },
        signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
    if (!response.ok) {
        throw new Error(`Upstream HTTP ${response.status} for ${url}`);
    }
    return response;
}

module.exports = async function handler(req, res) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', 'GET');
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const requestUrl = new URL(req.url || '/api/iam48', 'https://lsfansite.vercel.app');
    const rawSkip = Number.parseInt(requestUrl.searchParams.get('skip') || '0', 10);
    const rawTake = Number.parseInt(requestUrl.searchParams.get('take') || '8', 10);

    const skip = Number.isFinite(rawSkip) ? Math.max(0, Math.min(rawSkip, 200)) : 0;
    const take = Number.isFinite(rawTake) ? Math.max(1, Math.min(rawTake, 24)) : 8;

    const videoEndpoint = new URL(VIDEO_CONTENT_BASE);
    videoEndpoint.searchParams.set('skip', String(skip));
    videoEndpoint.searchParams.set('take', String(take));

    try {
        const tasks = [
            fetchUpstream(videoEndpoint.toString(), 'application/json').then((r) => r.json()),
        ];
        if (skip === 0) {
            tasks.push(
                fetchUpstream(MEMBER_SLUG_URL, 'text/html; charset=utf-8').then((r) => r.text())
            );
        }

        const [videoResult, profileResult] = await Promise.allSettled(tasks);

        if (videoResult.status === 'rejected' && (!profileResult || profileResult.status === 'rejected')) {
            const err = new Error('Failed to fetch iAM48 upstream data', {
                cause: videoResult.reason,
            });
            console.error(err);
            return res.status(502).json({ error: 'Unable to load iAM48 data right now.' });
        }

        const videos = videoResult.status === 'fulfilled' ? normalizeVideos(videoResult.value) : [];
        const profile =
            profileResult && profileResult.status === 'fulfilled'
                ? parseProfileHtml(profileResult.value)
                : null;

        res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
        return res.status(200).json({
            profile,
            videos,
            hasMore: videos.length >= take,
            fetchedAt: new Date().toISOString(),
        });
    } catch (err) {
        console.error(new Error('Unexpected error in /api/iam48', { cause: err }));
        return res.status(500).json({ error: 'Unable to load iAM48 data right now.' });
    }
};
