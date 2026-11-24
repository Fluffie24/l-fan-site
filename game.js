(() => {
    'use strict';

    /* ============ DYNAMIC VIEWPORT GEOMETRY (CROSS-BROWSER ZERO LETTERBOX) ============ */
    const VIRTUAL_H = 276;
    const BASE_VIRTUAL_W = 480;
    const BASE_PLAYER_X = 88;
    const BASE_TRAVEL_DIST = BASE_VIRTUAL_W - BASE_PLAYER_X; // 392
    const LANE_Y = [70, 140, 210];

    const CHAPTER_DURATION = 22;
    const INVULN_DURATION = 1.35;
    const DYING_DELAY_SEC = 0.85;
    const GAMEOVER_GUARD_MS = 550;

    const PB_STORAGE_KEY = 'wataridori_pb_v1';
    const LOCAL_LB_KEY = 'wataridori_local_lb_v1';
    const AUDIO_PREF_KEY = 'wataridori_audio_v2'; // v2: BGM off by default & quieter volume
    const LAST_NAME_KEY = 'wataridori_name_v1';

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const view = {
        w: BASE_VIRTUAL_W,
        h: VIRTUAL_H,
        playerX: BASE_PLAYER_X,
        spriteScale: 1.34,
        speedScale: 1,
        isCompact: false,
        lastCssW: 0,
        lastCssH: 0,
        lastDpr: 0,
    };

    const CHAPTERS = [
        {
            apiName: 'Midnight Station',
            nameTh: 'สถานียามค่ำคืน',
            skyTop: [9, 17, 40],
            skyMid: [18, 35, 74],
            skyBot: [28, 52, 98],
            lyric: 'ด่าน 1 · สถานียามค่ำคืน',
            endLyric: '「どこまで行けば 夜明けが見える？」 — อีกไกลแค่ไหนกว่าจะเห็นรุ่งอรุณ',
            accent: '#38BDF8',
        },
        {
            apiName: 'Rough Ocean',
            nameTh: 'ฝ่าคลื่นทะเลคลั่ง',
            skyTop: [10, 31, 56],
            skyMid: [15, 62, 88],
            skyBot: [20, 94, 118],
            lyric: 'ด่าน 2 · ฝ่าคลื่นทะเลคลั่ง',
            endLyric: '「渡り鳥たちに地図なんてない」 — นกอพยพไม่มีแผนที่นำทาง',
            accent: '#22D3EE',
        },
        {
            apiName: 'Golden Sunset',
            nameTh: 'ตะวันลับขอบฟ้า',
            skyTop: [54, 26, 87],
            skyMid: [185, 58, 128],
            skyBot: [245, 158, 11],
            lyric: 'ด่าน 3 · ตะวันลับขอบฟ้า',
            endLyric: '「今になってわかることがある」 — สิ่งที่เพิ่งเข้าใจในตอนนี้',
            accent: '#F472B6',
        },
        {
            apiName: 'Spring Dawn',
            nameTh: 'รุ่งอรุณฤดูใบไม้ผลิ',
            skyTop: [3, 105, 161],
            skyMid: [56, 189, 248],
            skyBot: [251, 207, 232],
            lyric: 'ด่าน 4 · รุ่งอรุณฤดูใบไม้ผลิ',
            endLyric: '「心の羽根 決してやめはしない」 — ปีกแห่งหัวใจจะไม่หยุดโบยบิน',
            accent: '#FBBF24',
        },
    ];

    const CHAPTER_TH_BY_API = Object.fromEntries(CHAPTERS.map((ch) => [ch.apiName, ch.nameTh]));

    function getThaiChapterName(apiName) {
        return CHAPTER_TH_BY_API[apiName] || apiName || CHAPTERS[0].nameTh;
    }

    /* ============ PIXEL SPRITE ATLAS ============ */
    function bakeSprite(rows, palette) {
        const h = rows.length;
        const w = rows[0].length;
        const c = document.createElement('canvas');
        c.width = w;
        c.height = h;
        const g = c.getContext('2d');
        g.imageSmoothingEnabled = false;

        for (let y = 0; y < h; y += 1) {
            const row = rows[y];
            for (let x = 0; x < w; x += 1) {
                const ch = row[x];
                if (ch === '.' || !palette[ch]) continue;
                g.fillStyle = palette[ch];
                g.fillRect(x, y, 1, 1);
            }
        }
        return c;
    }

    function createSpriteAtlas() {
        const pL = {
            h: '#161522',
            d: '#2A2840',
            f: '#F8FAFC',
            c: '#BAE6FD',
            s: '#FDE1CE',
            b: '#FDA4AF',
            e: '#0F172A',
            w: '#FFFFFF',
            n: '#1E3A8A',
            g: '#FBBF24',
            k: '#38BDF8',
            p: '#A78BFA',
            v: '#7C3AED',
            r: '#F43F5E',
        };

        const lUp = [
            '.kk.....................',
            'kkww....................',
            'ppww..hhhhhhhhhh........',
            '.pp..hhddhhhhddhh..f....',
            '....hhhddhhhhddhh.fc....',
            '....hhhhhhhhhhhhhff.....',
            '....hhhhhhhhhhhhhh......',
            '....hhsssehhsssehh......',
            '....hhssswshssswsh......',
            '....hhsbsssssssbsh......',
            '....hhhssssssssshh......',
            '....hhh.nnnnnnn.hh......',
            '....hh..nwwgwwn..hh.....',
            '....hh..nwwwwwm..hh.....',
            '........wwwwwww.........',
            '........nwwgwwn.........',
            '........wwwwwww.........',
            '.........nn.nn..........',
            '.........ss.ss..........',
            '.........nn.nn..........',
            '........................',
            '........................',
            '........................',
            '........................',
        ].map((r) => r.replace(/m/g, 'n'));

        const lMid = [
            '........................',
            '......hhhhhhhhhh........',
            '.....hhddhhhhddhh..f....',
            '....hhhddhhhhddhh.fc....',
            '....hhhhhhhhhhhhhff.....',
            '....hhhhhhhhhhhhhh......',
            '....hhsssehhsssehh......',
            '....hhssswshssswsh......',
            '....hhsbsssssssbsh......',
            '....hhhssssssssshh......',
            '....hhh.nnnnnnn.hh......',
            '...kww..nwwgwwn..hh.....',
            '..kkww..nwwwwwm..hh.....',
            '..ppww..wwwwwww..hh.....',
            '...pp...nwwgwwn.........',
            '........wwwwwww.........',
            '.........nn.nn..........',
            '.........ss.ss..........',
            '.........nn.nn..........',
            '........................',
            '........................',
            '........................',
            '........................',
            '........................',
        ].map((r) => r.replace(/m/g, 'n'));

        const lDown = [
            '........................',
            '......hhhhhhhhhh........',
            '.....hhddhhhhddhh..f....',
            '....hhhddhhhhddhh.fc....',
            '....hhhhhhhhhhhhhff.....',
            '....hhhhhhhhhhhhhh......',
            '....hhsssehhsssehh......',
            '....hhssswshssswsh......',
            '....hhsbsssssssbsh......',
            '....hhhssssssssshh......',
            '....hhh.nnnnnnn.hh......',
            '....hh..nwwgwwn..hh.....',
            '....hh..nwwwwwm..hh.....',
            '...kww..wwwwwww.........',
            '..kkww..nwwgwwn.........',
            '..ppvv..wwwwwww.........',
            '...pp....nn.nn..........',
            '.........ss.ss..........',
            '.........nn.nn..........',
            '........................',
            '........................',
            '........................',
            '........................',
            '........................',
        ].map((r) => r.replace(/m/g, 'n'));

        const lHurt = lMid.map((row) => row.replace(/g/g, 'r').replace(/k/g, 'r'));

        const pCat = {
            b: '#0F172A',
            d: '#334155',
            y: '#FDE047',
            p: '#F472B6',
            w: '#F8FAFC',
            l: '#C4B5FD',
            k: '#38BDF8',
        };

        const cat0 = [
            '..b......b....',
            '.bpb....bpb...',
            '.bbbbbbbbbb...',
            '.bbybbbbybb...',
            '.bbbbpbbbbb...',
            '..bbbbbbbb..b.',
            '.wwbbbbbbbbb..',
            'llbbbbbbbb....',
            '..bbbbbbbb....',
            '...bb..bb.....',
            '..............',
            '..............',
        ];

        const cat1 = [
            '..b......b....',
            '.bpb....bpb...',
            '.bbbbbbbbbb...',
            '.bbybbbbybb...',
            '.bbbbpbbbbb...',
            'wwbbbbbbbb..b.',
            'llbbbbbbbbbb..',
            '..bbbbbbbb....',
            '..bbbbbbbb....',
            '...bb..bb.....',
            '..............',
            '..............',
        ];

        const catBunny0 = [
            '..ww....ww....',
            '.wpw....wpw...',
            '.wpw....wpw...',
            '.wwb....bww...',
            '.bpb....bpb...',
            '.bbbbbbbbbb...',
            '.bbybbbbybb...',
            '.bbbbpbbbbb...',
            '..bbbbbbbb..b.',
            'kkbbbbbbbbbb..',
            '.llbbbbbbb....',
            '..bbbbbbbb....',
            '...bb..bb.....',
            '..............',
            '..............',
            '..............',
        ];

        const catBunny1 = [
            '..ww....ww....',
            '.wpw....wpw...',
            '.wpw....wpw...',
            '.wwb....bww...',
            '.bpb....bpb...',
            '.bbbbbbbbbb...',
            '.bbybbbbybb...',
            '.bbbbpbbbbb...',
            'kkbbbbbbbb..b.',
            '.llbbbbbbbbb..',
            '..bbbbbbbb....',
            '..bbbbbbbb....',
            '...bb..bb.....',
            '..............',
            '..............',
            '..............',
        ];

        const ringSky = bakeSprite([
            '....cccccc....',
            '..ccwwwwwwcc..',
            '.cwcc....ccwc.',
            '.cw........wc.',
            'cw..........wc',
            'cw....ww....wc',
            'cw...wccw...wc',
            'cw...wccw...wc',
            'cw....ww....wc',
            'cw..........wc',
            '.cw........wc.',
            '.cwcc....ccwc.',
            '..ccwwwwwwcc..',
            '....cccccc....',
        ], { c: '#38BDF8', w: '#E0F2FE' });

        const ringPurple = bakeSprite([
            '....pppppp....',
            '..ppwwwwwwpp..',
            '.pwpp....ppwp.',
            '.pw........wp.',
            'pw..........wp',
            'pw....ww....wp',
            'pw...wppw...wp',
            'pw...wppw...wp',
            'pw....ww....wp',
            'pw..........wp',
            '.pw........wp.',
            '.pwpp....ppwp.',
            '..ppwwwwwwpp..',
            '....pppppp....',
        ], { p: '#A78BFA', w: '#F5F3FF' });

        const potato = bakeSprite([
            '.......gg.......',
            '......gyyg......',
            '.....goooog.....',
            '......gggg......',
            '....ggyyyygg....',
            '...goooooooog...',
            '....gggggggg....',
            '...ggyyyyyygg...',
            '..goooooooooog..',
            '...gggggggggg...',
            '....gyyyyyyg....',
            '.....goooog.....',
            '.......ww.......',
            '.......ww.......',
            '.......ww.......',
            '.......ww.......',
        ], { g: '#F59E0B', y: '#FDE047', o: '#D97706', w: '#FDE68A' });

        const feather = bakeSprite([
            '.........ppp..',
            '.......ppwwwp.',
            '......pwwwwggp',
            '.....pwwwgggp.',
            '....pwwwggp...',
            '...pwwwgp.....',
            '..pwwwp.......',
            '..pwwp........',
            '.pwwp.........',
            '.pwp..........',
            'pwp...........',
            'pp............',
            'p.............',
            '..............',
        ], { p: '#F472B6', w: '#FFF1F2', g: '#FDE047' });

        const cloud = bakeSprite([
            '.........ddddddddd..........',
            '.......ddbbbbbbbbbdd........',
            '......dbbbbbbbbbbbbbd.......',
            '....ddbbbbllbbbbbbbbbd......',
            '...dbbbbbllllbbbbbbbbbd.....',
            '..dbbbbbbbbbbbbbbbbbbbbd....',
            '.dbbbbbbbbbbbbbbbbbbbbbbd...',
            '.dbbbbbbbbbbbbbbbbbbbbbbd...',
            'dbbbbbbbbbbbbbbbbbbbbbbbbd..',
            'dbbbbbbbbbbbbbbbbbbbbbbbbd..',
            '.dddddddddddddddddddddddd...',
            '.......yy.....yy............',
            '......yy.....yy.............',
            '.....yyy....yyy.............',
            '......yy.....yy.............',
            '.....yy.......y.............',
            '....y.......................',
            '............................',
            '............................',
            '............................',
        ], { d: '#1E293B', b: '#475569', l: '#64748B', y: '#FACC15' });

        const gust = bakeSprite([
            '......cccccccccccc..........',
            '....ccwwwwwwwwwwwwcc........',
            '..ccww..........ccwwc.......',
            '.cw................wc.......',
            '....................c.......',
            '..cccccccccccccccc..........',
            'wwwwwwwwwwwwwwwwwwcc........',
            '...................cc.......',
            '....cccccccccccccccc........',
            '..ccwwwwwwwwwwwwwwwcc.......',
            '.cw................ww.......',
            '..cc...............c........',
            '....ccc.....................',
            '............................',
        ], { c: '#38BDF8', w: '#E0F2FE' });

        const bat0Rows = [
            '.dd..............dd.',
            'dddd............dddd',
            'ddddd..dddddd..ddddd',
            '.dddddddddddddddddd.',
            '..ddddrrddddrrdddd..',
            '...dddddddddddddd...',
            '....dddddddddddd....',
            '.....dddddddddd.....',
            '......dddddddd......',
            '.......dd..dd.......',
            '....................',
            '....................',
            '....................',
            '....................',
        ];

        const bat1Rows = [
            '....................',
            '....................',
            '......dddddddd......',
            '....ddddrrddrrdd....',
            '...dddddddddddddd...',
            '..dddddddddddddddd..',
            '.dddd..dddddd..dddd.',
            'ddd....dddddd....ddd',
            'dd......dddd......dd',
            '.........dd.........',
            '....................',
            '....................',
            '....................',
            '....................',
        ];

        const bat0 = bakeSprite(bat0Rows, { d: '#312E81', r: '#FB7185' });
        const bat1 = bakeSprite(bat1Rows, { d: '#312E81', r: '#FB7185' });
        const batSwoop0 = bakeSprite(bat0Rows, { d: '#701A75', r: '#FDE047' });
        const batSwoop1 = bakeSprite(bat1Rows, { d: '#701A75', r: '#FDE047' });

        const catfish0 = bakeSprite([
            '.......bbbbbb.........',
            '.....bbssssssbb.......',
            '....bsssysssyssb......',
            '.bb.bssssssssssbbb..bb',
            'bbwbssssssssssssssbbbb',
            'bb..bssssssssssssssbbb',
            '....bssssssssssbbb..bb',
            '.....bbssssssbb.......',
            '.......bbbbbb.........',
            '...w....w.............',
            '..w......w............',
            '......................',
            '......................',
            '......................',
        ], { b: '#1E293B', s: '#64748B', y: '#FDE047', w: '#CBD5E1' });

        const catfish1 = bakeSprite([
            '.......bbbbbb.........',
            '.....bbssssssbb.......',
            '....bsssysssyssb......',
            '..b.bssssssssssbbb.bb.',
            '.bwbssssssssssssssbbb.',
            '..b.bssssssssssssssbb.',
            '....bssssssssssbbb.bb.',
            '.....bbssssssbb.......',
            '.......bbbbbb.........',
            '..w.....w.............',
            '.w.......w............',
            '......................',
            '......................',
            '......................',
        ], { b: '#1E293B', s: '#64748B', y: '#FDE047', w: '#CBD5E1' });

        const bolt = bakeSprite([
            '..............gggggg........',
            '...........gggyyyyyyggg.....',
            '......gggggyyywwwwwwyyyg....',
            '..ggggyyyyywwwwwwwwwwyyyg...',
            'ggyyyywwwwwwwwwwwwwwwwyygg..',
            'yywwwwwwwwwwwwwwwwwwyyyyggg.',
            '..ggggyyyywwwwwwwwyyyyygggg.',
            '......ggggyyyyyyyygggg......',
            '..........gggggggg..........',
            '............................',
            '............................',
            '............................',
        ], { g: '#F59E0B', y: '#FDE047', w: '#FEFCE8' });

        return {
            l: [bakeSprite(lUp, pL), bakeSprite(lMid, pL), bakeSprite(lDown, pL), bakeSprite(lMid, pL)],
            lHurt: bakeSprite(lHurt, pL),
            cat: [bakeSprite(cat0, pCat), bakeSprite(cat1, pCat)],
            catBunny: [bakeSprite(catBunny0, pCat), bakeSprite(catBunny1, pCat)],
            ringSky,
            ringPurple,
            potato,
            feather,
            cloud,
            gust,
            bat: [bat0, bat1],
            batSwoop: [batSwoop0, batSwoop1],
            catfish: [catfish0, catfish1],
            bolt,
        };
    }

    const SPRITES = createSpriteAtlas();

    const ITEM_SPRITE_BASE = {
        ring: SPRITES.ringSky,
        potato: SPRITES.potato,
        feather: SPRITES.feather,
        cloud: SPRITES.cloud,
        gust: SPRITES.gust,
        bat: SPRITES.bat[0],
        batSwoop: SPRITES.batSwoop[0],
        catfish: SPRITES.catfish[0],
        bolt: SPRITES.bolt,
    };

    /* ============ SYNTHESIZED CHIPTUNE SFX ============ */
    let audioCtx = null;
    let sfxEnabled = true;

    const RING_PENTATONIC = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5];

    function ensureAudioCtx() {
        if (!sfxEnabled) return null;
        if (!audioCtx && (window.AudioContext || window.webkitAudioContext)) {
            const Ctx = window.AudioContext || window.webkitAudioContext;
            audioCtx = new Ctx();
        }
        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume().catch(() => {});
        }
        return audioCtx;
    }

    function playTone(freq, duration, type = 'square', gainPeak = 0.08, slideTo = null, delay = 0) {
        const ctx = ensureAudioCtx();
        if (!ctx) return;
        const now = ctx.currentTime + delay;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, now);
        if (slideTo) {
            osc.frequency.exponentialRampToValueAtTime(slideTo, now + duration);
        }
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(gainPeak, now + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + duration + 0.02);
    }

    function playSfx(kind, comboCount = 0) {
        if (!sfxEnabled) return;
        switch (kind) {
            case 'move':
                playTone(420, 0.055, 'triangle', 0.048, 590);
                break;
            case 'ring': {
                const base = RING_PENTATONIC[Math.min(RING_PENTATONIC.length - 1, Math.floor(comboCount / 3))];
                playTone(base, 0.065, 'square', 0.05, null, 0);
                playTone(base * 1.25, 0.085, 'square', 0.05, null, 0.045);
                break;
            }
            case 'potato':
                playTone(523, 0.07, 'square', 0.06, null, 0);
                playTone(659, 0.07, 'square', 0.06, null, 0.05);
                playTone(784, 0.11, 'square', 0.065, null, 0.1);
                break;
            case 'nearmiss':
                playTone(740, 0.06, 'triangle', 0.065, 1180, 0);
                playTone(1180, 0.08, 'triangle', 0.055, 1480, 0.04);
                break;
            case 'warn':
                playTone(880, 0.045, 'square', 0.032, 660, 0);
                break;
            case 'bolt':
                playTone(980, 0.12, 'sawtooth', 0.055, 260, 0);
                break;
            case 'heal':
                playTone(587, 0.08, 'triangle', 0.08, null, 0);
                playTone(784, 0.09, 'triangle', 0.08, null, 0.07);
                playTone(1046, 0.15, 'triangle', 0.08, null, 0.14);
                break;
            case 'hit':
                playTone(180, 0.18, 'sawtooth', 0.085, 65);
                break;
            case 'fever':
                playTone(523, 0.08, 'square', 0.07, null, 0);
                playTone(659, 0.08, 'square', 0.07, null, 0.06);
                playTone(784, 0.08, 'square', 0.07, null, 0.12);
                playTone(1046, 0.22, 'square', 0.08, null, 0.18);
                break;
            case 'chapter':
                playTone(440, 0.09, 'triangle', 0.06, null, 0);
                playTone(554, 0.09, 'triangle', 0.06, null, 0.08);
                playTone(659, 0.16, 'triangle', 0.07, null, 0.16);
                break;
            case 'gameover':
                playTone(392, 0.14, 'triangle', 0.07, null, 0);
                playTone(330, 0.14, 'triangle', 0.07, null, 0.13);
                playTone(262, 0.28, 'triangle', 0.08, null, 0.26);
                break;
            default:
                break;
        }
    }

    /* ============ DOM REFERENCES ============ */
    const canvasFrame = document.getElementById('canvas-frame');
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');

    const hudBar = document.querySelector('.hud-bar');
    const hudHearts = document.getElementById('hud-hearts');
    const hudScore = document.getElementById('hud-score');
    const hudCombo = document.getElementById('hud-combo');
    const hudLevel = document.getElementById('hud-level');
    const hudFeverBar = document.getElementById('hud-fever-bar');
    const hudFeverFill = document.getElementById('hud-fever-fill');
    const hudFeverLabel = document.getElementById('hud-fever-label');
    const hudChapter = document.getElementById('hud-chapter');

    const startOverlay = document.getElementById('start-overlay');
    const pauseOverlay = document.getElementById('pause-overlay');
    const gameoverDialog = document.getElementById('gameover-dialog');
    const gameoverCloseBtn = document.getElementById('gameover-close-btn');

    const startBtn = document.getElementById('start-btn');
    const resumeBtn = document.getElementById('resume-btn');
    const pauseRestartBtn = document.getElementById('pause-restart-btn');
    const playAgainBtn = document.getElementById('play-again-btn');
    const pauseBtn = document.getElementById('pause-btn');

    const laneUpBtn = document.getElementById('lane-up-btn');
    const laneDownBtn = document.getElementById('lane-down-btn');

    const bgmAudio = document.getElementById('game-bgm');
    const bgmToggle = document.getElementById('bgm-toggle');
    const bgmVolume = document.getElementById('bgm-volume');
    const sfxToggle = document.getElementById('sfx-toggle');

    const finalScoreEl = document.getElementById('final-score');
    const finalComboEl = document.getElementById('final-combo');
    const finalChapterEl = document.getElementById('final-chapter');
    const newBestPill = document.getElementById('new-best-pill');
    const gameoverLyric = document.getElementById('gameover-lyric');

    const scoreForm = document.getElementById('score-form');
    const playerNameInput = document.getElementById('player-name');
    const submitScoreBtn = document.getElementById('submit-score-btn');
    const submitStatus = document.getElementById('submit-status');

    const lbList = document.getElementById('leaderboard-list');
    const lbModeBadge = document.getElementById('lb-mode-badge');
    const lbRefreshBtn = document.getElementById('lb-refresh-btn');
    const lbStatus = document.getElementById('lb-status');
    const lbStatusMsg = document.getElementById('lb-status-msg');
    const lbRetryBtn = document.getElementById('lb-retry-btn');
    const lbSetupNote = document.getElementById('lb-setup-note');
    const personalBestEl = document.getElementById('personal-best-val');

    const guideDialog = document.getElementById('guide-dialog');
    const guideOpenBtn = document.getElementById('guide-open-btn');
    const guideCloseBtn = document.getElementById('guide-close-btn');
    const guideDoneBtn = document.getElementById('guide-done-btn');

    /* ============ COLLAPSE FIELD GUIDE BY DEFAULT ON COMPACT MOBILE ============ */
    const fieldGuideDetails = document.querySelector('.field-guide-details');
    if (fieldGuideDetails && window.innerWidth < 720) {
        fieldGuideDetails.open = false;
    }

    /* ============ RESPONSIVE CANVAS SIZING (CONTENT-BOX SAFE FOR FIREFOX/SAFARI) ============ */
    function resizeCanvasStage() {
        if (!canvasFrame || !canvas) return;
        // Measure inner content box (clientWidth/clientHeight) so border never creates ResizeObserver loops
        const cssW = Math.max(240, Math.round(canvasFrame.clientWidth));
        const cssH = Math.max(180, Math.round(canvasFrame.clientHeight));
        const dpr = Math.min(2, window.devicePixelRatio || 2);

        if (
            Math.abs(cssW - view.lastCssW) < 1 &&
            Math.abs(cssH - view.lastCssH) < 1 &&
            dpr === view.lastDpr
        ) {
            return;
        }

        view.lastCssW = cssW;
        view.lastCssH = cssH;
        view.lastDpr = dpr;

        const targetBackW = Math.round(cssW * dpr);
        const targetBackH = Math.round(cssH * dpr);
        if (canvas.width !== targetBackW || canvas.height !== targetBackH) {
            canvas.width = targetBackW;
            canvas.height = targetBackH;
        }

        const prevW = view.w;
        const aspect = cssW / cssH;
        view.h = VIRTUAL_H;
        view.w = Math.round(Math.max(276, Math.min(BASE_VIRTUAL_W, view.h * aspect)));
        view.isCompact = view.w < 380;
        view.playerX = Math.round(view.w * (view.isCompact ? 0.21 : 0.185));
        view.spriteScale = view.isCompact ? 1.48 : 1.34;
        view.speedScale = (view.w - view.playerX) / BASE_TRAVEL_DIST;

        if (prevW > 0 && state && state.items) {
            const ratio = prevW !== view.w ? view.w / prevW : 1;
            for (const item of state.items) {
                item.x *= ratio;
                const sp = ITEM_SPRITE_BASE[item.kind];
                if (sp) {
                    item.w = sp.width * view.spriteScale;
                    item.h = sp.height * view.spriteScale;
                }
            }
            if (ratio !== 1) {
                for (const star of state.stars) {
                    star.x = (star.x * ratio) % view.w;
                }
            }
        }
    }

    /* ============ RENDER SPRITE PREVIEWS ============ */
    function renderStaticPreviews() {
        const heroPreview = document.getElementById('hero-sprite-preview');
        if (heroPreview) {
            const pctx = heroPreview.getContext('2d');
            pctx.imageSmoothingEnabled = false;
            pctx.clearRect(0, 0, heroPreview.width, heroPreview.height);
            pctx.drawImage(SPRITES.l[1], 24, 4, 64, 64);
            pctx.drawImage(SPRITES.cat[0], 92, 24, 38, 32);
            pctx.drawImage(SPRITES.ringSky, 130, 12, 22, 22);
        }

        const spriteMap = {
            hero: SPRITES.l[1],
            ring: SPRITES.ringSky,
            potato: SPRITES.potato,
            feather: SPRITES.feather,
            cloud: SPRITES.cloud,
            gust: SPRITES.gust,
            bat: SPRITES.batSwoop[0],
            catfish: SPRITES.catfish[0],
            bolt: SPRITES.bolt,
        };

        document.querySelectorAll('.guide-sprite-canvas[data-sprite]').forEach((el) => {
            const sprite = spriteMap[el.dataset.sprite];
            if (!sprite) return;
            const g = el.getContext('2d');
            g.imageSmoothingEnabled = false;
            g.clearRect(0, 0, el.width, el.height);
            const scale = Math.min((el.width - 8) / sprite.width, (el.height - 8) / sprite.height);
            const dw = Math.round(sprite.width * scale);
            const dh = Math.round(sprite.height * scale);
            const dx = Math.round((el.width - dw) / 2);
            const dy = Math.round((el.height - dh) / 2);
            g.drawImage(sprite, dx, dy, dw, dh);
        });
    }

    renderStaticPreviews();

    /* ============ BGM & AUDIO PREFERENCES (SFX-ONLY DEFAULT, GENTLE BGM) ============ */
    const BGM_MAX_GAIN = 0.55; // Keeps mastered idol track comfortable even if slider goes higher
    const audioState = {
        bgmEnabled: false, // Off by default; player opts in manually
        volume: 0.2, // 20% slider => ~0.11 actual output gain
    };

    try {
        const saved = JSON.parse(localStorage.getItem(AUDIO_PREF_KEY) || 'null');
        if (saved && typeof saved === 'object') {
            if (typeof saved.bgmEnabled === 'boolean') audioState.bgmEnabled = saved.bgmEnabled;
            if (typeof saved.sfxEnabled === 'boolean') sfxEnabled = saved.sfxEnabled;
            if (typeof saved.volume === 'number' && saved.volume >= 0 && saved.volume <= 1) {
                audioState.volume = saved.volume;
            }
        }
    } catch {
        // ignore storage errors
    }

    function applyBgmVolume() {
        if (!bgmAudio) return;
        bgmAudio.volume = Math.max(0, Math.min(BGM_MAX_GAIN, audioState.volume * BGM_MAX_GAIN));
    }

    function persistAudioPrefs() {
        try {
            localStorage.setItem(AUDIO_PREF_KEY, JSON.stringify({
                bgmEnabled: audioState.bgmEnabled,
                sfxEnabled,
                volume: audioState.volume,
            }));
        } catch {
            // ignore
        }
    }

    function syncAudioControls() {
        const isPlaying = bgmAudio && !bgmAudio.paused;
        if (bgmToggle) {
            bgmToggle.setAttribute('aria-pressed', String(isPlaying));
        }
        if (bgmVolume) {
            bgmVolume.value = String(Math.round(audioState.volume * 100));
        }
        if (sfxToggle) {
            sfxToggle.setAttribute('aria-pressed', String(sfxEnabled));
            sfxToggle.classList.toggle('is-on', sfxEnabled);
            const icon = sfxToggle.querySelector('i');
            if (icon) {
                icon.className = sfxEnabled ? 'fas fa-volume-high' : 'fas fa-volume-xmark';
            }
        }
    }

    if (bgmAudio) {
        applyBgmVolume();
        bgmAudio.addEventListener('play', syncAudioControls);
        bgmAudio.addEventListener('pause', syncAudioControls);
    }

    function tryStartBgm() {
        if (!bgmAudio || !audioState.bgmEnabled) return;
        applyBgmVolume();
        if (bgmAudio.paused) {
            bgmAudio.play().catch(() => {
                syncAudioControls();
            });
        }
    }

    if (bgmToggle && bgmAudio) {
        bgmToggle.addEventListener('click', () => {
            if (bgmAudio.paused) {
                audioState.bgmEnabled = true;
                persistAudioPrefs();
                tryStartBgm();
            } else {
                audioState.bgmEnabled = false;
                persistAudioPrefs();
                bgmAudio.pause();
            }
            syncAudioControls();
        });
    }

    if (bgmVolume && bgmAudio) {
        bgmVolume.addEventListener('input', () => {
            const val = Number(bgmVolume.value) / 100;
            audioState.volume = Math.max(0, Math.min(1, val));
            applyBgmVolume();
            persistAudioPrefs();
        });
    }

    if (sfxToggle) {
        sfxToggle.addEventListener('click', () => {
            sfxEnabled = !sfxEnabled;
            persistAudioPrefs();
            syncAudioControls();
            if (sfxEnabled) playSfx('move');
        });
    }

    syncAudioControls();

    /* ============ GAME STATE ============ */
    const state = {
        mode: 'start', // 'start' | 'playing' | 'paused' | 'dying' | 'gameover'
        elapsed: 0,
        dyingTimer: 0,
        gameoverGuardUntil: 0,
        score: 0,
        distanceScoreAcc: 0,
        hp: 3,
        maxHp: 3,
        combo: 0,
        maxCombo: 0,
        fever: 0,
        feverTimer: 0,
        feverDurationCurrent: 4.5,
        invulnTimer: 0,
        hitFlashTimer: 0,
        shakeTimer: 0,
        season: 1,
        chapterIdx: 0,
        prevChapterIdx: 0,
        chapterLerp: 1,
        diffLevel: 1,
        playerLane: 1,
        playerY: LANE_Y[1],
        playerTilt: 0,
        catY: LANE_Y[1] + 9,
        lastLaneLeft: -1,
        lastLaneSwitchAt: -10,
        scrollSpeed: 156,
        spawnTimer: 0.78,
        lastFeatherAt: -30,
        lastPattern: -1,
        bannerText: '',
        bannerTimer: 0,
        bannerColor: '#38BDF8',
        afterimages: [],
        items: [],
        telegraphs: [],
        particles: [],
        popups: [],
        speedLines: Array.from({ length: 14 }, (_, i) => ({
            x: (i * 43) % BASE_VIRTUAL_W,
            y: 26 + ((i * 37) % 215),
            len: 12 + (i % 4) * 7,
            speed: 1.5 + (i % 3) * 0.35,
        })),
        stars: Array.from({ length: 42 }, (_, i) => ({
            x: (i * 53) % BASE_VIRTUAL_W,
            y: 12 + ((i * 29) % 165),
            size: i % 5 === 0 ? 2 : 1,
            phase: i * 0.7,
        })),
        petals: Array.from({ length: 18 }, (_, i) => ({
            x: (i * 37) % BASE_VIRTUAL_W,
            y: (i * 19) % VIRTUAL_H,
            vx: -34 - (i % 4) * 10,
            vy: 15 + (i % 3) * 7,
        })),
        trainX: BASE_VIRTUAL_W + 40,
        waveOffset: 0,
        lastSubmittedRun: false,
        personalBest: 0,
        lastSubmittedId: null,
    };

    resizeCanvasStage();
    if ('ResizeObserver' in window && canvasFrame) {
        const ro = new ResizeObserver(() => resizeCanvasStage());
        ro.observe(canvasFrame);
    } else {
        window.addEventListener('resize', resizeCanvasStage, { passive: true });
    }

    try {
        const storedPb = Number.parseInt(localStorage.getItem(PB_STORAGE_KEY) || '0', 10);
        if (Number.isFinite(storedPb) && storedPb > 0) {
            state.personalBest = storedPb;
        }
    } catch {
        // ignore
    }

    if (personalBestEl) {
        personalBestEl.textContent = state.personalBest.toLocaleString('en');
    }

    /* ============ FAIR PROGRESSIVE DIFFICULTY & TOA VALIDATION ============ */
    function getDifficultyTier() {
        return Math.min(6, Math.floor(state.elapsed / CHAPTER_DURATION) + 1);
    }

    function getFeverDuration() {
        return state.season >= 2 ? 4.0 : 4.5;
    }

    function getBaseScrollSpeed() {
        // Gentle approachable opening (156) ramping smoothly across chapters up to 418
        const linear = 156 + state.elapsed * 1.85 + (state.season - 1) * 20;
        if (linear <= 336) return linear;
        return Math.min(418, 336 + (linear - 336) * 0.38);
    }

    function getTelegraphDuration() {
        const tier = state.diffLevel;
        return Math.max(0.4, 0.56 - (tier - 1) * 0.032);
    }

    function getWorldSpeed() {
        return state.scrollSpeed * view.speedScale;
    }

    function isHazardKind(kind) {
        return kind !== 'ring' && kind !== 'potato' && kind !== 'feather';
    }

    // Estimates arrival time (in seconds from now) of a newly spawned hazard at playerX
    function estimateArrivalSec(offsetBaseX, speedMul = 1, telegraphSec = 0) {
        const worldSpeed = Math.max(60, getWorldSpeed() * speedMul);
        const startX = view.w + 22 + offsetBaseX * view.speedScale;
        const dist = Math.max(0, startX - view.playerX);
        return telegraphSec + dist / worldSpeed;
    }

    // Returns set of lanes occupied by existing hazards/telegraphs within ±marginSec of arrivalSec
    function getOccupiedLanesAt(arrivalSec, marginSec = 0.34) {
        const blocked = new Set();
        const baseWorldSpeed = Math.max(60, getWorldSpeed());

        for (const item of state.items) {
            if (!isHazardKind(item.kind)) continue;
            const speed = baseWorldSpeed * (item.speedMul || 1);
            const eta = (item.x - view.playerX) / speed;
            if (Math.abs(eta - arrivalSec) <= marginSec) {
                blocked.add(item.lane);
                if (item.targetLane !== undefined) blocked.add(item.targetLane);
            }
        }

        for (const tel of state.telegraphs) {
            const mul = tel.kind === 'bolt' ? 1.72 : tel.kind === 'gust' ? 1.44 : 1.14;
            const eta = estimateArrivalSec(0, mul, tel.timer);
            if (Math.abs(eta - arrivalSec) <= marginSec) {
                blocked.add(tel.lane);
            }
        }

        return blocked;
    }

    function getClearLanesAt(arrivalSec, marginSec = 0.34) {
        const blocked = getOccupiedLanesAt(arrivalSec, marginSec);
        return [0, 1, 2].filter((l) => !blocked.has(l));
    }

    // Guarantees Wave N+1 waits until Wave N's tail finishes spawning PLUS reaction breathing room!
    function setWaveCooldown(maxOffsetBaseX, baseGapSec) {
        const tailSec = Math.max(0, maxOffsetBaseX) / Math.max(120, state.scrollSpeed);
        const speedNorm = Math.min(1.2, (state.scrollSpeed - 156) / 210);
        const gapSec = Math.max(0.46, baseGapSec - speedNorm * 0.36);
        state.spawnTimer = tailSec + gapSec;
    }

    /* ============ GAME HELPERS & FAIR WAVE SPAWNER ============ */
    function setBanner(text, color = '#38BDF8', duration = 3.0) {
        state.bannerText = text;
        state.bannerColor = color;
        state.bannerTimer = duration;
    }

    function spawnParticles(x, y, color, count = 8, speed = 82) {
        const total = prefersReducedMotion ? Math.min(4, count) : count;
        for (let i = 0; i < total; i += 1) {
            const angle = (Math.PI * 2 * i) / total + (Math.random() - 0.5) * 0.45;
            const mag = speed * (0.45 + Math.random() * 0.65);
            state.particles.push({
                x,
                y,
                vx: Math.cos(angle) * mag,
                vy: Math.sin(angle) * mag,
                life: 0.38 + Math.random() * 0.22,
                maxLife: 0.6,
                size: i % 2 === 0 ? 3 : 2,
                color,
            });
        }
    }

    function spawnPopup(x, y, text, color = '#FDE047') {
        state.popups.push({
            x,
            y,
            text,
            color,
            life: 0.85,
            maxLife: 0.85,
        });
    }

    function pushItem(kind, lane, offsetBaseX = 0, extra = {}) {
        const sp = ITEM_SPRITE_BASE[kind] || SPRITES.ringSky;
        const scaledOffset = offsetBaseX * view.speedScale;

        state.items.push({
            kind,
            lane,
            targetLane: extra.targetLane ?? lane,
            x: view.w + 22 + scaledOffset,
            y: LANE_Y[lane],
            w: sp.width * view.spriteScale,
            h: sp.height * view.spriteScale,
            speedMul: extra.speedMul || 1,
            colorVariant: extra.colorVariant ?? (lane % 2),
            baseY: LANE_Y[lane],
            phase: Math.random() * Math.PI * 2,
            jumpTimer: extra.jumpTimer || 0,
            swoopState: kind === 'batSwoop' ? 'armed' : 'none',
            swoopWarnTimer: 0,
            nearMissed: false,
        });
    }

    function pickStandardHazard(chIdx, tier) {
        if (tier >= 2 && Math.random() < Math.min(0.4, 0.16 + (tier - 2) * 0.06)) {
            return 'bat';
        }
        if (chIdx === 0) return Math.random() < 0.45 ? 'bat' : 'cloud';
        return Math.random() < 0.6 ? 'cloud' : 'bat';
    }

    function spawnWave() {
        const ch = state.chapterIdx;
        const tier = state.diffLevel;
        const telDur = getTelegraphDuration();

        const featherCooldown = state.season >= 2 ? 32 : 26;
        const needsHeal = state.hp < state.maxHp && state.elapsed - state.lastFeatherAt >= featherCooldown;

        // Smooth tier-by-tier unlock deck (easy warm-up -> rich fair challenge)
        const pool = [];
        if (tier === 1) {
            pool.push({ id: 0, w: 54 }); // Single hazard + guiding rings
            pool.push({ id: 1, w: 30 }); // Clean single Double Gate
            pool.push({ id: 3, w: 16 }); // Single Headwind Gale (wide telegraph)
        } else if (tier === 2) {
            pool.push({ id: 0, w: 22 });
            pool.push({ id: 1, w: 28 }); // Double Gate
            pool.push({ id: 2, w: 22 }); // 3-beat Slalom
            pool.push({ id: 3, w: 14 }); // Single Gale
            pool.push({ id: 7, w: ch === 1 ? 24 : 10 }); // Ocean Catfish (strictly Lane 2)
        } else if (tier === 3) {
            pool.push({ id: 1, w: 26 }); // Double Gate (+ occasional chained gate)
            pool.push({ id: 2, w: 24 }); // 3-4 Beat Slalom
            pool.push({ id: 3, w: 18 }); // Gale (+ occasional Double Gale)
            pool.push({ id: 4, w: 18 }); // Swooping Bat (early clear warning)
            pool.push({ id: 5, w: 14 }); // Risk-Reward Potato Bait
        } else {
            // LV.4+ & Endless Seasons: Full thrilling deck (all TOA-verified fair!)
            pool.push({ id: 1, w: 22 }); // Chained Double Gates
            pool.push({ id: 2, w: 22 }); // 4-5 Beat Rapid Slalom
            pool.push({ id: 3, w: 20 }); // Double Gale
            pool.push({ id: 4, w: 16 }); // Swooping Bat
            pool.push({ id: 5, w: 12 }); // Risk-Reward Bait
            pool.push({ id: 6, w: 20 }); // Targeted Thunder Bolt
            if (ch === 1 || state.season >= 2) pool.push({ id: 7, w: 12 });
        }

        const filtered = pool.length > 1 ? pool.filter((p) => p.id !== state.lastPattern) : pool;
        const totalW = filtered.reduce((acc, p) => acc + p.w, 0);
        let r = Math.random() * totalW;
        let chosen = filtered[0].id;
        for (const p of filtered) {
            r -= p.w;
            if (r <= 0) {
                chosen = p.id;
                break;
            }
        }
        state.lastPattern = chosen;

        if (chosen === 0) {
            // Pattern 0: Friendly single hazard + 3 guiding rings
            const eta = estimateArrivalSec(0, 1);
            const clear = getClearLanesAt(eta);
            const safePool = clear.length > 0 ? clear : [0, 1, 2];
            const ringLane = safePool[Math.floor(Math.random() * safePool.length)];
            const hazardChoices = [0, 1, 2].filter((l) => l !== ringLane);
            const hazardLane = hazardChoices[Math.floor(Math.random() * hazardChoices.length)];

            pushItem(pickStandardHazard(ch, tier), hazardLane, 0);
            for (let i = 0; i < 3; i += 1) {
                pushItem('ring', ringLane, i * 32, { colorVariant: i % 2 });
            }
            if (needsHeal) {
                pushItem('feather', ringLane, 96);
                state.lastFeatherAt = state.elapsed;
            }
            setWaveCooldown(96, 0.96);
        } else if (chosen === 1) {
            // Pattern 1: Fair Double Gate (TOA-verified safe lane; chained only from LV.3+ with fair switch gap)
            const eta1 = estimateArrivalSec(0, 1);
            const clear1 = getClearLanesAt(eta1);
            const safe1 = clear1.length > 0
                ? clear1[Math.floor(Math.random() * clear1.length)]
                : Math.floor(Math.random() * 3);
            const blocked1 = [0, 1, 2].filter((l) => l !== safe1);

            pushItem(pickStandardHazard(ch, tier), blocked1[0], 0);
            pushItem(pickStandardHazard(ch, tier), blocked1[1], 8);
            pushItem('ring', safe1, 14, { colorVariant: 0 });
            pushItem('ring', safe1, 46, { colorVariant: 1 });

            if (tier >= 3 && Math.random() < (tier >= 4 ? 0.65 : 0.42)) {
                // Only jump 1 adjacent lane (or wide gap if 2 lanes) so switching is always fair & readable!
                const adjLanes = [0, 1, 2].filter((l) => Math.abs(l - safe1) === 1);
                const safe2 = adjLanes[Math.floor(Math.random() * adjLanes.length)];
                const blocked2 = [0, 1, 2].filter((l) => l !== safe2);
                const gapX = Math.max(146, 174 - tier * 5);
                pushItem(pickStandardHazard(ch, tier), blocked2[0], gapX);
                pushItem(pickStandardHazard(ch, tier), blocked2[1], gapX + 8);
                pushItem('potato', safe2, gapX + 16);
                if (needsHeal) {
                    pushItem('feather', safe2, gapX + 54);
                    state.lastFeatherAt = state.elapsed;
                }
                setWaveCooldown(gapX + 54, 0.92);
            } else {
                if (Math.random() < 0.5) {
                    pushItem('potato', safe1, 78);
                }
                if (needsHeal) {
                    pushItem('feather', safe1, 108);
                    state.lastFeatherAt = state.elapsed;
                }
                setWaveCooldown(82, tier === 1 ? 1.0 : 0.86);
            }
        } else if (chosen === 2) {
            // Pattern 2: Fair Escalating Slalom Weave (strictly 1-lane step per beat, full wave-tail cooldown!)
            const beats = tier >= 5 ? 5 : tier >= 4 ? 4 : 3;
            const stepX = Math.max(96, 118 - tier * 4);
            let safe = Math.random() < 0.5 ? 0 : 2;
            let dir = safe === 0 ? 1 : -1;

            for (let step = 0; step < beats; step += 1) {
                const off = step * stepX;
                const blockedA = (safe + 1) % 3;
                const blockedB = (safe + 2) % 3;
                pushItem(pickStandardHazard(ch, tier), blockedA, off);
                if (tier >= 3 && step % 2 === 1) {
                    pushItem(pickStandardHazard(ch, tier), blockedB, off + 6);
                }
                pushItem('ring', safe, off + 8, { colorVariant: step % 2 });

                if (safe === 2) dir = -1;
                else if (safe === 0) dir = 1;
                safe += dir;
            }
            const lastSafe = Math.max(0, Math.min(2, safe - dir));
            const tailX = (beats - 1) * stepX + 36;
            pushItem('potato', lastSafe, tailX);
            setWaveCooldown(tailX, 0.95);
        } else if (chosen === 3) {
            // Pattern 3: Fast Headwind Gale — TOA-verified so 1 escape lane is ALWAYS 100% open!
            const gustEta = estimateArrivalSec(0, 1.44, telDur);
            const clearAtGust = getClearLanesAt(gustEta, 0.38);

            if (clearAtGust.length === 0) {
                // Rare overlap guard: pause briefly and spawn a safe ring line instead of an unfair pinch
                pushItem('ring', state.playerLane, 10, { colorVariant: 0 });
                setWaveCooldown(20, 0.55);
                return;
            }

            const wantDouble = tier >= 3 && clearAtGust.length >= 2 && Math.random() < (tier >= 4 ? 0.68 : 0.4);
            const safeLane = clearAtGust[Math.floor(Math.random() * clearAtGust.length)];

            if (wantDouble) {
                const gustLanes = [0, 1, 2].filter((l) => l !== safeLane);
                gustLanes.forEach((lane) => {
                    state.telegraphs.push({ lane, timer: telDur, kind: 'gust', locked: true });
                });
                playSfx('warn');
                pushItem('ring', safeLane, 18, { colorVariant: 0 });
                pushItem('potato', safeLane, 54);
                setWaveCooldown(60, 0.96);
            } else {
                const otherLanes = [0, 1, 2].filter((l) => l !== safeLane);
                const gustLane = otherLanes[Math.floor(Math.random() * otherLanes.length)];
                state.telegraphs.push({ lane: gustLane, timer: telDur, kind: 'gust', locked: true });
                playSfx('warn');

                // Only add a companion cloud in the 3rd lane at LV.3+ when safeLane is confirmed clear
                if (tier >= 3) {
                    const cloudLane = otherLanes.find((l) => l !== gustLane);
                    const cloudEta = estimateArrivalSec(26, 1);
                    if (cloudLane !== undefined && getClearLanesAt(cloudEta, 0.34).includes(safeLane)) {
                        pushItem('cloud', cloudLane, 26);
                    }
                }
                for (let i = 0; i < 2; i += 1) {
                    pushItem('ring', safeLane, i * 32, { colorVariant: i % 2 });
                }
                setWaveCooldown(56, tier === 1 ? 1.05 : 0.88);
            }
        } else if (chosen === 4) {
            // Pattern 4: Swooping Bat (early clear telegraph, leaves outer lane cleanly open!)
            const startLane = Math.random() < 0.5 ? 0 : 2;
            const targetLane = 1;
            const safeLane = startLane === 0 ? 2 : 0;

            pushItem('batSwoop', startLane, 0, { targetLane, speedMul: 1.02 });
            pushItem('ring', safeLane, 18, { colorVariant: 0 });
            pushItem('potato', safeLane, 58);
            if (needsHeal) {
                pushItem('feather', safeLane, 96);
                state.lastFeatherAt = state.elapsed;
            }
            setWaveCooldown(96, 0.96);
        } else if (chosen === 5) {
            // Pattern 5: Risk-Reward Potato Bait (wide, fair gap between staggered clouds + safe outer lane)
            const baitLane = 1;
            const safeLane = Math.random() < 0.5 ? 0 : 2;
            const guardLane = safeLane === 0 ? 2 : 0;

            pushItem('cloud', baitLane, 0);
            pushItem('cloud', guardLane, 24);
            pushItem('potato', baitLane, 76); // Generous opening right behind cloud!
            pushItem('cloud', baitLane, 152);
            pushItem('ring', safeLane, 32, { colorVariant: 0 });
            pushItem('ring', safeLane, 72, { colorVariant: 1 });
            setWaveCooldown(156, 0.92);
        } else if (chosen === 6) {
            // Pattern 6: Targeted Thunder Bolt Surge (tracks briefly, locks with clear laser warning, TOA-fair!)
            const boltTel = telDur + 0.08;
            const boltEta = estimateArrivalSec(0, 1.72, boltTel);
            const clearAtBolt = getClearLanesAt(boltEta, 0.38);

            // Must leave at least 1 other lane free for the player to dodge into!
            const escapeLanes = clearAtBolt.filter((l) => l !== state.playerLane);
            if (escapeLanes.length === 0) {
                // Fallback to single fair cloud if screen is busy
                const safeFallback = clearAtBolt[0] ?? 1;
                const haz = (safeFallback + 1) % 3;
                pushItem('cloud', haz, 0);
                pushItem('ring', safeFallback, 16, { colorVariant: 0 });
                setWaveCooldown(40, 0.78);
                return;
            }

            const safeLane = escapeLanes[Math.floor(Math.random() * escapeLanes.length)];
            state.telegraphs.push({
                lane: state.playerLane,
                timer: boltTel,
                trackTimer: 0.12,
                kind: 'bolt',
                locked: false,
            });
            playSfx('warn');
            pushItem('ring', safeLane, 18, { colorVariant: 0 });
            pushItem('ring', safeLane, 50, { colorVariant: 1 });
            if (needsHeal) {
                pushItem('feather', safeLane, 86);
                state.lastFeatherAt = state.elapsed;
            }
            setWaveCooldown(80, 0.94);
        } else {
            // Pattern 7: Ocean Catfish (strictly Lane 2!) + optional upper cloud (leaving ≥1 upper lane open)
            const catEta = estimateArrivalSec(0, 1.14, telDur);
            const clearAtCat = getClearLanesAt(catEta, 0.36).filter((l) => l !== 2);
            const safeLane = clearAtCat.length > 0 ? clearAtCat[0] : 1;
            const cloudLane = safeLane === 0 ? 1 : 0;

            state.telegraphs.push({ lane: 2, timer: telDur, kind: 'catfish', locked: true });
            playSfx('warn');
            if (tier >= 2) {
                pushItem('cloud', cloudLane, 24);
            }
            pushItem('ring', safeLane, 14, { colorVariant: 0 });
            pushItem('ring', safeLane, 46, { colorVariant: 1 });
            pushItem('potato', safeLane, 80);
            setWaveCooldown(84, 0.94);
        }
    }

    function updateHud() {
        if (hudScore) {
            hudScore.textContent = Math.floor(state.score).toLocaleString('en');
        }
        if (hudCombo) {
            const mult = Math.min(5, 1 + Math.floor(state.combo / 5));
            hudCombo.textContent = state.combo > 0 ? `x${mult} (${state.combo})` : 'x1';
        }
        if (hudLevel) {
            const isMax = state.diffLevel >= 6;
            hudLevel.textContent = isMax ? 'MAX' : `LV.${state.diffLevel}`;
            hudLevel.classList.toggle('is-hot', state.diffLevel >= 3 && !isMax);
            hudLevel.classList.toggle('is-max', isMax);
        }
        if (hudHearts) {
            const pips = hudHearts.querySelectorAll('.heart-pip');
            pips.forEach((pip, idx) => {
                pip.classList.toggle('is-full', idx < state.hp);
            });
            hudHearts.setAttribute('aria-label', `พลังปีกคงเหลือ ${state.hp} จาก ${state.maxHp}`);
        }

        const isFever = state.feverTimer > 0;
        const pct = isFever
            ? Math.ceil((state.feverTimer / state.feverDurationCurrent) * 100)
            : Math.min(100, Math.floor(state.fever));

        if (hudFeverFill) hudFeverFill.style.width = `${pct}%`;
        if (hudFeverLabel) hudFeverLabel.textContent = isFever ? `ฟีเวอร์ ${state.feverTimer.toFixed(1)} วิ` : `${pct}%`;
        if (hudFeverBar) hudFeverBar.setAttribute('aria-valuenow', String(pct));
        if (hudBar) hudBar.classList.toggle('is-fever', isFever);

        if (hudChapter) {
            hudChapter.textContent = `รอบ ${state.season} · ${CHAPTERS[state.chapterIdx].nameTh}`;
        }
    }

    function resetGameState() {
        state.elapsed = 0;
        state.dyingTimer = 0;
        state.score = 0;
        state.distanceScoreAcc = 0;
        state.hp = 3;
        state.combo = 0;
        state.maxCombo = 0;
        state.fever = 0;
        state.feverTimer = 0;
        state.feverDurationCurrent = 4.5;
        state.invulnTimer = 0;
        state.hitFlashTimer = 0;
        state.shakeTimer = 0;
        state.season = 1;
        state.chapterIdx = 0;
        state.prevChapterIdx = 0;
        state.chapterLerp = 1;
        state.diffLevel = 1;
        state.playerLane = 1;
        state.playerY = LANE_Y[1];
        state.playerTilt = 0;
        state.catY = LANE_Y[1] + 9;
        state.lastLaneLeft = -1;
        state.lastLaneSwitchAt = -10;
        state.scrollSpeed = 156;
        state.spawnTimer = 0.78;
        state.lastFeatherAt = -30;
        state.lastPattern = -1;
        state.afterimages = [];
        state.items = [];
        state.telegraphs = [];
        state.particles = [];
        state.popups = [];
        state.lastSubmittedRun = false;

        setBanner(CHAPTERS[0].lyric, CHAPTERS[0].accent, 2.8);
        updateHud();
    }

    function startGame() {
        if (gameoverDialog && gameoverDialog.open) {
            gameoverDialog.close();
        }
        resetGameState();
        state.mode = 'playing';
        startOverlay.hidden = true;
        pauseOverlay.hidden = true;
        if (pauseBtn) pauseBtn.disabled = false;
        ensureAudioCtx();
        tryStartBgm(); // Only starts if user explicitly enabled BGM
        playSfx('chapter');
    }

    function pauseGame() {
        if (state.mode !== 'playing') return;
        state.mode = 'paused';
        pauseOverlay.hidden = false;
    }

    function resumeGame() {
        if (state.mode !== 'paused') return;
        state.mode = 'playing';
        pauseOverlay.hidden = true;
    }

    function beginDyingSequence() {
        state.mode = 'dying';
        state.dyingTimer = DYING_DELAY_SEC;
        state.hitFlashTimer = 0.3;
        state.shakeTimer = prefersReducedMotion ? 0 : 0.35;
        if (pauseBtn) pauseBtn.disabled = true;
        playSfx('gameover');
        setBanner('พลังปีกหมดแล้ว!', '#FB7185', 1.2);
        spawnParticles(view.playerX, state.playerY, '#FB7185', 16, 110);
        spawnParticles(view.playerX, state.playerY, '#F0F9FF', 10, 75);
        updateHud();
    }

    function openGameOverDialog() {
        state.mode = 'gameover';

        const finalScore = Math.max(1, Math.floor(state.score));
        state.score = finalScore;

        const isNewBest = finalScore > state.personalBest;
        if (isNewBest) {
            state.personalBest = finalScore;
            try {
                localStorage.setItem(PB_STORAGE_KEY, String(finalScore));
            } catch {
                // ignore
            }
            if (personalBestEl) {
                personalBestEl.textContent = finalScore.toLocaleString('en');
            }
        }

        if (finalScoreEl) finalScoreEl.textContent = finalScore.toLocaleString('en');
        if (finalComboEl) finalComboEl.textContent = String(state.maxCombo);
        if (finalChapterEl) finalChapterEl.textContent = `รอบ ${state.season} · ${CHAPTERS[state.chapterIdx].nameTh}`;
        if (newBestPill) newBestPill.hidden = !isNewBest;
        if (gameoverLyric) gameoverLyric.textContent = CHAPTERS[state.chapterIdx].endLyric;

        if (submitScoreBtn) submitScoreBtn.disabled = false;
        if (submitStatus) {
            submitStatus.textContent = '';
            submitStatus.className = 'submit-status';
        }

        if (playerNameInput) {
            playerNameInput.classList.remove('user-invalid-fallback', 'user-valid-fallback');
            playerNameInput.setAttribute('aria-invalid', 'false');
            try {
                const savedName = localStorage.getItem(LAST_NAME_KEY);
                if (savedName && !playerNameInput.value) {
                    playerNameInput.value = savedName;
                }
            } catch {
                // ignore
            }
        }

        // Guard buttons briefly so rapid taps right at death never trigger accidental restart/close
        state.gameoverGuardUntil = performance.now() + GAMEOVER_GUARD_MS;
        if (gameoverDialog) {
            gameoverDialog.classList.add('is-guarded');
            if (!gameoverDialog.open) {
                gameoverDialog.showModal();
            }
            setTimeout(() => {
                gameoverDialog.classList.remove('is-guarded');
            }, GAMEOVER_GUARD_MS);
        }

        updateHud();
    }

    function closeGameOverToIdle() {
        if (gameoverDialog && gameoverDialog.open) {
            gameoverDialog.close();
        }
        resetGameState();
        state.mode = 'start';
        state.bannerText = '';
        state.bannerTimer = 0;
        startOverlay.hidden = false;
        pauseOverlay.hidden = true;
        if (pauseBtn) pauseBtn.disabled = true;
    }

    function isGameOverGuarded() {
        return performance.now() < state.gameoverGuardUntil;
    }

    function moveLane(delta) {
        if (state.mode !== 'playing') return;
        const nextLane = Math.max(0, Math.min(2, state.playerLane + delta));
        if (nextLane !== state.playerLane) {
            state.lastLaneLeft = state.playerLane;
            state.lastLaneSwitchAt = state.elapsed;
            state.playerLane = nextLane;
            state.playerTilt = delta * 0.25;
            playSfx('move');
        }
    }

    function setLaneDirect(targetLane) {
        if (state.mode !== 'playing') return;
        const clamped = Math.max(0, Math.min(2, targetLane));
        if (clamped !== state.playerLane) {
            state.lastLaneLeft = state.playerLane;
            state.lastLaneSwitchAt = state.elapsed;
            state.playerTilt = (clamped - state.playerLane) * 0.22;
            state.playerLane = clamped;
            playSfx('move');
        }
    }

    /* ============ SIMULATION STEP ============ */
    function updateDying(dt) {
        state.dyingTimer = Math.max(0, state.dyingTimer - dt);
        if (state.hitFlashTimer > 0) state.hitFlashTimer = Math.max(0, state.hitFlashTimer - dt);
        if (state.shakeTimer > 0) state.shakeTimer = Math.max(0, state.shakeTimer - dt);

        // Gentle slow-mo drift during the 0.85s defeat beat
        const slowDt = dt * 0.22;
        const worldSpeed = getWorldSpeed();
        for (const item of state.items) {
            item.x -= worldSpeed * item.speedMul * slowDt;
        }
        state.playerY = Math.min(view.h - 24, state.playerY + 26 * dt);
        state.playerTilt = Math.min(0.45, state.playerTilt + 0.65 * dt);

        state.particles = state.particles.filter((p) => {
            p.x += p.vx * dt * 0.7;
            p.y += p.vy * dt * 0.7;
            p.life -= dt;
            return p.life > 0;
        });

        state.popups = state.popups.filter((pop) => {
            pop.y -= 20 * dt;
            pop.life -= dt;
            return pop.life > 0;
        });

        if (state.dyingTimer <= 0) {
            openGameOverDialog();
        }
    }

    function updateGame(dt) {
        if (state.mode === 'dying') {
            updateDying(dt);
            return;
        }
        if (state.mode !== 'playing') {
            return;
        }

        state.elapsed += dt;
        state.waveOffset += dt * 52;

        // Progressive speed & difficulty tier
        state.scrollSpeed = getBaseScrollSpeed();
        const nextTier = getDifficultyTier();
        if (nextTier !== state.diffLevel) {
            state.diffLevel = nextTier;
            const lvTag = nextTier >= 6 ? 'MAX' : `LV.${nextTier}`;
            spawnPopup(view.playerX + 22, state.playerY - 28, `สปีดอัป ${lvTag}!`, '#FDE047');
        }

        // Chapter progression every 22s
        const totalChaptersPassed = Math.floor(state.elapsed / CHAPTER_DURATION);
        const nextSeason = Math.floor(totalChaptersPassed / CHAPTERS.length) + 1;
        const nextChapterIdx = totalChaptersPassed % CHAPTERS.length;

        if (nextSeason !== state.season) {
            state.season = nextSeason;
            const bonus = 600 * (state.season - 1);
            state.score += bonus;
            spawnPopup(view.playerX + 24, state.playerY - 34, `ผ่านครบ 4 ด่าน! +${bonus}`, '#FDE047');
        }

        if (nextChapterIdx !== state.chapterIdx) {
            state.prevChapterIdx = state.chapterIdx;
            state.chapterIdx = nextChapterIdx;
            state.chapterLerp = 0;
            playSfx('chapter');
            const chObj = CHAPTERS[nextChapterIdx];
            setBanner(`รอบ ${state.season} · ${chObj.lyric}`, chObj.accent, 3.0);
        }

        if (state.chapterLerp < 1) state.chapterLerp = Math.min(1, state.chapterLerp + dt / 2.2);
        if (state.bannerTimer > 0) state.bannerTimer = Math.max(0, state.bannerTimer - dt);
        if (state.invulnTimer > 0) state.invulnTimer = Math.max(0, state.invulnTimer - dt);
        if (state.hitFlashTimer > 0) state.hitFlashTimer = Math.max(0, state.hitFlashTimer - dt);
        if (state.shakeTimer > 0) state.shakeTimer = Math.max(0, state.shakeTimer - dt);

        // Dream Fever countdown
        const isFever = state.feverTimer > 0;
        if (isFever) {
            state.feverTimer = Math.max(0, state.feverTimer - dt);
            if (state.feverTimer === 0) {
                state.fever = 0;
            }
        }

        // Distance score
        const feverMult = isFever ? 2 : 1;
        state.distanceScoreAcc += dt * (28 + state.diffLevel * 5) * feverMult;
        if (state.distanceScoreAcc >= 1) {
            const pts = Math.floor(state.distanceScoreAcc);
            state.score += pts;
            state.distanceScoreAcc -= pts;
        }

        // Snappy lane interpolation
        const targetY = LANE_Y[state.playerLane];
        state.playerY += (targetY - state.playerY) * Math.min(1, dt * 20);
        state.playerTilt *= Math.pow(0.03, dt);
        state.catY += (state.playerY + 9 - state.catY) * Math.min(1, dt * 10);

        const worldSpeed = getWorldSpeed();
        for (const sl of state.speedLines) {
            sl.x -= worldSpeed * sl.speed * dt;
            if (sl.x + sl.len < 0) {
                sl.x = view.w + Math.random() * 40;
                sl.y = 24 + Math.random() * 218;
            }
        }

        // Fever afterimages
        if (isFever && !prefersReducedMotion && Math.random() < 0.45) {
            state.afterimages.push({
                x: view.playerX,
                y: state.playerY,
                life: 0.22,
            });
        }
        state.afterimages = state.afterimages.filter((a) => {
            a.x -= worldSpeed * 0.45 * dt;
            a.life -= dt;
            return a.life > 0;
        });

        // Background train & petals
        state.trainX -= 50 * view.speedScale * dt;
        if (state.trainX < -160) {
            state.trainX = view.w + 50;
        }
        for (const petal of state.petals) {
            petal.x += petal.vx * view.speedScale * dt;
            petal.y += petal.vy * dt;
            if (petal.x < -8 || petal.y > view.h + 8) {
                petal.x = view.w + Math.random() * 36;
                petal.y = Math.random() * 190;
            }
        }

        // Wave spawner & telegraph resolution
        state.spawnTimer -= dt;
        if (state.spawnTimer <= 0) {
            spawnWave();
        }

        const nextTelegraphs = [];
        for (const tel of state.telegraphs) {
            if (tel.kind === 'bolt' && !tel.locked) {
                tel.trackTimer -= dt;
                tel.lane = state.playerLane;
                if (tel.trackTimer <= 0) {
                    tel.locked = true;
                }
            }
            tel.timer -= dt;
            if (tel.timer <= 0) {
                if (tel.kind === 'gust') {
                    pushItem('gust', tel.lane, 0, { speedMul: 1.44 });
                } else if (tel.kind === 'catfish') {
                    pushItem('catfish', 2, 0, { speedMul: 1.14, jumpTimer: 0.1 });
                } else if (tel.kind === 'bolt') {
                    pushItem('bolt', tel.lane, 0, { speedMul: 1.72 });
                    playSfx('bolt');
                }
            } else {
                nextTelegraphs.push(tel);
            }
        }
        state.telegraphs = nextTelegraphs;

        // Honest forgiving hurtbox for hazards + generous pickup box for collectibles
        const hurtHalf = 7.2 * view.spriteScale;
        const pickHalf = 10 * view.spriteScale;
        const hurtBox = {
            x: view.playerX - hurtHalf,
            y: state.playerY - hurtHalf,
            w: hurtHalf * 2,
            h: hurtHalf * 2,
        };
        const pickBox = {
            x: view.playerX - pickHalf,
            y: state.playerY - pickHalf,
            w: pickHalf * 2,
            h: pickHalf * 2,
        };

        const surviving = [];

        for (const item of state.items) {
            const prevX = item.x;
            item.x -= worldSpeed * item.speedMul * dt;

            if (item.kind === 'bat') {
                item.y = item.baseY + Math.sin(state.elapsed * 7 + item.phase) * 6;
            } else if (item.kind === 'batSwoop') {
                // Early, clear swoop telegraph at 68% travel distance with 0.38s warning
                const triggerX = view.playerX + (view.w - view.playerX) * 0.68;
                if (item.swoopState === 'armed' && item.x <= triggerX) {
                    item.swoopState = 'warning';
                    item.swoopWarnTimer = 0.38;
                    playSfx('warn');
                } else if (item.swoopState === 'warning') {
                    item.swoopWarnTimer -= dt;
                    if (item.swoopWarnTimer <= 0) {
                        item.swoopState = 'swooping';
                        item.lane = item.targetLane;
                        item.baseY = LANE_Y[item.targetLane];
                    }
                } else if (item.swoopState === 'swooping') {
                    item.y += (item.baseY - item.y) * Math.min(1, dt * 11);
                }
            } else if (item.kind === 'catfish') {
                // Strictly bounded within lower lane (Lane 2) so Lane 1 stays 100% safe!
                item.jumpTimer += dt;
                const arc = Math.abs(Math.sin(item.jumpTimer * 4.2)) * 16;
                item.y = LANE_Y[2] + 8 - arc;
            } else if (isFever && (item.kind === 'ring' || item.kind === 'potato')) {
                // Subtle close-range Fever magnetism ONLY (no screen-wide vacuum)
                const dx = view.playerX - item.x;
                const dy = state.playerY - item.y;
                if (Math.abs(dx) < 46 * view.speedScale && Math.abs(dy) < 28) {
                    item.x += dx * Math.min(1, dt * 4.2);
                    item.y += dy * Math.min(1, dt * 4.2);
                }
            }

            if (item.x < -56) continue;

            const isCollectible = !isHazardKind(item.kind);
            const pad = isCollectible ? 4 : -4.5;
            const halfW = Math.max(4, item.w / 2 + pad);
            const halfH = Math.max(4, item.h / 2 + pad);
            const pBox = isCollectible ? pickBox : hurtBox;

            const hit =
                pBox.x < item.x + halfW &&
                pBox.x + pBox.w > item.x - halfW &&
                pBox.y < item.y + halfH &&
                pBox.y + pBox.h > item.y - halfH;

            if (!hit) {
                // Skillful Near-Miss bonus when dodging out of a hazard's lane right before impact
                if (
                    !isCollectible &&
                    !item.nearMissed &&
                    !isFever &&
                    state.invulnTimer <= 0 &&
                    prevX >= view.playerX &&
                    item.x < view.playerX &&
                    item.lane === state.lastLaneLeft &&
                    state.elapsed - state.lastLaneSwitchAt <= 0.55
                ) {
                    item.nearMissed = true;
                    state.combo += 1;
                    if (state.combo > state.maxCombo) state.maxCombo = state.combo;
                    const comboMult = Math.min(5, 1 + Math.floor(state.combo / 5));
                    const pts = 75 * comboMult;
                    state.score += pts;
                    state.fever = Math.min(100, state.fever + 5);
                    spawnParticles(view.playerX, state.playerY, '#FDE047', 6, 70);
                    spawnPopup(view.playerX + 18, state.playerY - 22, `เฉียดฉิว! +${pts}`, '#FDE047');
                    playSfx('nearmiss');
                    checkFeverTrigger();
                }

                surviving.push(item);
                continue;
            }

            if (isCollectible) {
                state.combo += 1;
                if (state.combo > state.maxCombo) state.maxCombo = state.combo;
                const comboMult = Math.min(5, 1 + Math.floor(state.combo / 5));

                if (item.kind === 'ring') {
                    const pts = 100 * comboMult * feverMult;
                    state.score += pts;
                    if (!isFever) state.fever = Math.min(100, state.fever + 4.5);
                    spawnParticles(item.x, item.y, item.colorVariant === 0 ? '#38BDF8' : '#A78BFA', 7);
                    spawnPopup(item.x, item.y - 12, `+${pts}`, '#7DD3FC');
                    playSfx('ring', state.combo);
                } else if (item.kind === 'potato') {
                    const pts = 300 * comboMult * feverMult;
                    state.score += pts;
                    if (!isFever) state.fever = Math.min(100, state.fever + 10);
                    spawnParticles(item.x, item.y, '#FBBF24', 10);
                    spawnPopup(item.x, item.y - 14, `มันเกลียว +${pts}`, '#FDE047');
                    playSfx('potato');
                } else if (item.kind === 'feather') {
                    if (state.hp < state.maxHp) {
                        state.hp += 1;
                        spawnPopup(item.x, item.y - 14, '+1 พลังปีก', '#F472B6');
                    } else {
                        const pts = 400 * feverMult;
                        state.score += pts;
                        spawnPopup(item.x, item.y - 14, `+${pts}`, '#F472B6');
                    }
                    spawnParticles(item.x, item.y, '#F472B6', 10);
                    playSfx('heal');
                }

                checkFeverTrigger();
            } else if (isFever) {
                const pts = 150;
                state.score += pts;
                spawnParticles(item.x, item.y, '#38BDF8', 10, 95);
                spawnPopup(item.x, item.y - 12, `ทำลาย +${pts}`, '#FDE047');
                playSfx('ring', state.combo);
            } else if (state.invulnTimer <= 0) {
                state.hp -= 1;
                state.combo = 0;
                state.fever = Math.max(0, state.fever - 20);
                state.invulnTimer = INVULN_DURATION;
                state.hitFlashTimer = 0.16;
                state.shakeTimer = prefersReducedMotion ? 0 : 0.24;
                spawnParticles(view.playerX, state.playerY, '#FB7185', 14, 100);
                spawnPopup(view.playerX + 10, state.playerY - 18, 'โอ๊ย!', '#FB7185');
                playSfx('hit');
                if (state.hp <= 0) {
                    beginDyingSequence();
                    return;
                }
            }
        }
        state.items = surviving;

        state.particles = state.particles.filter((p) => {
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.life -= dt;
            return p.life > 0;
        });

        state.popups = state.popups.filter((pop) => {
            pop.y -= 28 * dt;
            pop.life -= dt;
            return pop.life > 0;
        });

        updateHud();
    }

    function checkFeverTrigger() {
        if (state.feverTimer <= 0 && state.fever >= 100) {
            state.fever = 100;
            state.feverDurationCurrent = getFeverDuration();
            state.feverTimer = state.feverDurationCurrent;
            playSfx('fever');
            setBanner('ดรีมฟีเวอร์! พลังแมวกระต่าย x2', '#F472B6', 2.6);
            spawnParticles(view.playerX, state.playerY, '#FDE047', 16, 115);
        }
    }

    /* ============ HIGH-DPI PIXEL RENDERER ============ */
    function lerpColor(a, b, t) {
        const r = Math.round(a[0] + (b[0] - a[0]) * t);
        const g = Math.round(a[1] + (b[1] - a[1]) * t);
        const bl = Math.round(a[2] + (b[2] - a[2]) * t);
        return `rgb(${r}, ${g}, ${bl})`;
    }

    function drawSpriteScaled(sprite, centerX, centerY, scale = view.spriteScale) {
        const dw = Math.round(sprite.width * scale);
        const dh = Math.round(sprite.height * scale);
        ctx.drawImage(sprite, Math.round(centerX - dw / 2), Math.round(centerY - dh / 2), dw, dh);
    }

    function drawPixelBoltGlyph(cx, cy) {
        // Cross-browser crisp vector lightning icon (avoids inconsistent emoji glyphs)
        ctx.fillStyle = '#071024';
        ctx.beginPath();
        ctx.moveTo(cx + 2, cy - 7);
        ctx.lineTo(cx - 4, cy + 1);
        ctx.lineTo(cx, cy + 1);
        ctx.lineTo(cx - 2, cy + 7);
        ctx.lineTo(cx + 4, cy - 1);
        ctx.lineTo(cx, cy - 1);
        ctx.closePath();
        ctx.fill();
    }

    function drawBackground() {
        const prevCh = CHAPTERS[state.prevChapterIdx];
        const currCh = CHAPTERS[state.chapterIdx];
        const t = state.chapterLerp;

        const topCol = lerpColor(prevCh.skyTop, currCh.skyTop, t);
        const midCol = lerpColor(prevCh.skyMid, currCh.skyMid, t);
        const botCol = lerpColor(prevCh.skyBot, currCh.skyBot, t);

        const grad = ctx.createLinearGradient(0, 0, 0, view.h);
        grad.addColorStop(0, topCol);
        grad.addColorStop(0.58, midCol);
        grad.addColorStop(1, botCol);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, view.w, view.h);

        // Twinkling Stars
        const starAlpha = state.chapterIdx === 0 ? 0.9 : state.chapterIdx === 2 ? 0.45 : 0.25;
        for (const s of state.stars) {
            const sx = ((s.x % view.w) + view.w) % view.w;
            const twinkle = prefersReducedMotion ? 1 : 0.65 + 0.35 * Math.sin(state.elapsed * 3 + s.phase);
            ctx.fillStyle = `rgba(240, 249, 255, ${(starAlpha * twinkle).toFixed(2)})`;
            ctx.fillRect(Math.floor(sx), Math.floor(s.y), s.size, s.size);
        }

        // Chapter-specific pixel scenery
        if (state.chapterIdx === 0) {
            ctx.fillStyle = '#0A1228';
            ctx.fillRect(0, view.h - 32, view.w, 32);
            ctx.fillStyle = '#1E293B';
            ctx.fillRect(0, view.h - 34, view.w, 2);

            const tx = Math.floor(state.trainX);
            ctx.fillStyle = '#172554';
            ctx.fillRect(tx, view.h - 28, 132, 18);
            ctx.fillStyle = '#38BDF8';
            ctx.fillRect(tx, view.h - 26, 132, 2);
            ctx.fillStyle = '#FDE047';
            for (let wx = 8; wx < 120; wx += 14) {
                ctx.fillRect(tx + wx, view.h - 22, 8, 6);
            }
        } else if (state.chapterIdx === 1) {
            ctx.fillStyle = 'rgba(186, 230, 253, 0.24)';
            for (let i = 0; i < 14; i += 1) {
                const rx = ((i * 41 - state.elapsed * 165) % view.w + view.w) % view.w;
                const ry = (i * 29 + state.elapsed * 185) % (view.h - 46);
                ctx.fillRect(Math.floor(rx), Math.floor(ry), 2, 7);
            }
            ctx.fillStyle = '#0C4A6E';
            ctx.fillRect(0, view.h - 28, view.w, 28);
            ctx.fillStyle = '#38BDF8';
            for (let wx = 0; wx < view.w; wx += 16) {
                const crest = Math.round(Math.sin(wx * 0.08 + state.waveOffset * 0.14) * 3);
                ctx.fillRect(wx, view.h - 30 + crest, 10, 3);
            }
        } else if (state.chapterIdx === 2) {
            const sunX = Math.round(view.w * 0.74);
            ctx.fillStyle = '#FCD34D';
            ctx.fillRect(sunX, 152, 44, 44);
            ctx.fillStyle = '#F97316';
            ctx.fillRect(sunX - 4, 174, 52, 12);
            ctx.fillStyle = 'rgba(254, 240, 138, 0.26)';
            ctx.fillRect(0, view.h - 38, view.w, 38);

            ctx.fillStyle = '#1E1B4B';
            for (let b = 0; b < 4; b += 1) {
                const bx = Math.floor(((view.w * 0.7 + b * 24 - state.elapsed * 14) % view.w + view.w) % view.w);
                const by = 56 + b * 11;
                ctx.fillRect(bx, by, 3, 1);
                ctx.fillRect(bx + 3, by + 1, 2, 1);
                ctx.fillRect(bx + 5, by, 3, 1);
            }
        } else {
            ctx.fillStyle = '#1E3A8A';
            ctx.fillRect(0, view.h - 24, view.w, 24);
            ctx.fillStyle = '#3B82F6';
            ctx.fillRect(Math.round(view.w * 0.62), view.h - 36, Math.round(view.w * 0.4), 16);
            ctx.fillStyle = '#FBCFE8';
            for (const p of state.petals) {
                ctx.fillRect(Math.floor(p.x), Math.floor(p.y), 3, 2);
            }
        }

        // High-speed wind streaks (intensifies from LV.2+)
        if (state.mode === 'playing' && state.diffLevel >= 2 && !prefersReducedMotion) {
            const lineAlpha = Math.min(0.28, 0.08 + (state.diffLevel - 1) * 0.045);
            ctx.fillStyle = `rgba(224, 242, 254, ${lineAlpha.toFixed(2)})`;
            for (const sl of state.speedLines) {
                ctx.fillRect(Math.floor(sl.x), Math.floor(sl.y), sl.len, 1);
            }
        }

        // 3 Touch-Friendly Sky Lane Bands & Dotted Flight Rails
        for (let lane = 0; lane < 3; lane += 1) {
            const ly = LANE_Y[lane];
            const isActive = state.mode === 'playing' && lane === state.playerLane;
            const hasDanger = state.telegraphs.some((tel) => tel.lane === lane);

            if (hasDanger) {
                ctx.fillStyle = 'rgba(251, 113, 133, 0.13)';
                ctx.fillRect(0, ly - 30, view.w, 60);
            } else if (isActive) {
                ctx.fillStyle = 'rgba(56, 189, 248, 0.09)';
                ctx.fillRect(0, ly - 28, view.w, 56);
            }

            ctx.fillStyle = isActive ? 'rgba(125, 211, 252, 0.45)' : 'rgba(224, 242, 254, 0.16)';
            for (let dx = 10; dx < view.w; dx += 18) {
                ctx.fillRect(dx, ly, isActive ? 8 : 5, 1.5);
            }
        }
    }

    function drawGame() {
        const scaleX = canvas.width / view.w;
        const scaleY = canvas.height / view.h;

        ctx.save();
        ctx.setTransform(scaleX, 0, 0, scaleY, 0, 0);
        ctx.imageSmoothingEnabled = false;

        if (state.shakeTimer > 0 && !prefersReducedMotion) {
            const sx = Math.round((Math.random() - 0.5) * 6);
            const sy = Math.round((Math.random() - 0.5) * 6);
            ctx.translate(sx, sy);
        }

        drawBackground();

        const isFever = state.feverTimer > 0;
        const animTick = Math.floor(state.elapsed * 9);

        // Fever afterimages
        for (const ghost of state.afterimages) {
            ctx.globalAlpha = Math.max(0.1, ghost.life * 2);
            drawSpriteScaled(SPRITES.l[1], ghost.x, ghost.y);
        }
        ctx.globalAlpha = 1;

        // Edge Telegraphs
        for (const tel of state.telegraphs) {
            const pulse = Math.floor(tel.timer * 10) % 2 === 0;
            const ty = LANE_Y[tel.lane];
            const isBolt = tel.kind === 'bolt';

            if (isBolt) {
                ctx.fillStyle = pulse ? 'rgba(253, 224, 71, 0.34)' : 'rgba(245, 158, 11, 0.18)';
                ctx.fillRect(0, ty - 2, view.w - 26, 4);
            }

            ctx.fillStyle = isBolt
                ? (pulse ? '#FDE047' : '#F59E0B')
                : (pulse ? '#FB7185' : '#FDE047');
            ctx.fillRect(view.w - 26, ty - 12, 20, 24);
            ctx.strokeStyle = '#071024';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(view.w - 26, ty - 12, 20, 24);

            if (isBolt) {
                drawPixelBoltGlyph(view.w - 16, ty);
            } else {
                ctx.fillStyle = '#071024';
                ctx.font = '700 13px Mitr, Prompt, sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('!', view.w - 16, ty + 0.5);
            }
        }

        // Items & Hazards
        for (const item of state.items) {
            let sprite = SPRITES.ringSky;
            if (item.kind === 'ring') {
                sprite = item.colorVariant === 0 ? SPRITES.ringSky : SPRITES.ringPurple;
            } else if (item.kind === 'potato') {
                sprite = SPRITES.potato;
            } else if (item.kind === 'feather') {
                sprite = SPRITES.feather;
            } else if (item.kind === 'cloud') {
                sprite = SPRITES.cloud;
            } else if (item.kind === 'gust') {
                sprite = SPRITES.gust;
            } else if (item.kind === 'bat') {
                sprite = SPRITES.bat[animTick % 2];
            } else if (item.kind === 'batSwoop') {
                sprite = SPRITES.batSwoop[animTick % 2];
            } else if (item.kind === 'catfish') {
                sprite = SPRITES.catfish[animTick % 2];
            } else if (item.kind === 'bolt') {
                sprite = SPRITES.bolt;
            }

            drawSpriteScaled(sprite, item.x, item.y);

            // Swooping bat lane-change warning arrow + subtle target band
            if (item.kind === 'batSwoop' && item.swoopState === 'warning') {
                const dirDown = item.targetLane > item.lane;
                const arrowY = item.y + (dirDown ? 20 : -20);
                ctx.fillStyle = '#FDE047';
                ctx.font = '700 14px Mitr, sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(dirDown ? '▼' : '▲', item.x, arrowY);
            }
        }

        // Tiny Black Cat Companion
        const catSprite = isFever ? SPRITES.catBunny[animTick % 2] : SPRITES.cat[animTick % 2];
        const catOffset = Math.round(24 * view.spriteScale);
        drawSpriteScaled(catSprite, view.playerX - catOffset, state.catY);

        // Pixel Chibi L
        const isDying = state.mode === 'dying';
        const invulnFlash = !isDying && state.invulnTimer > 0 && Math.floor(state.invulnTimer * 10) % 2 === 0;
        const lW = Math.round(24 * view.spriteScale);
        const lH = Math.round(24 * view.spriteScale);

        if (!invulnFlash) {
            const lSprite = isDying || state.invulnTimer > INVULN_DURATION - 0.25
                ? SPRITES.lHurt
                : SPRITES.l[animTick % 4];
            ctx.save();
            if (isDying) {
                ctx.globalAlpha = Math.max(0.25, state.dyingTimer / DYING_DELAY_SEC);
            }
            ctx.translate(view.playerX, Math.round(state.playerY));
            ctx.rotate(state.playerTilt);
            if (isFever) {
                ctx.strokeStyle = 'rgba(253, 224, 71, 0.85)';
                ctx.lineWidth = 2;
                ctx.strokeRect(-lW / 2 - 3, -lH / 2 - 3, lW + 6, lH + 6);
            }
            ctx.drawImage(lSprite, Math.round(-lW / 2), Math.round(-lH / 2), lW, lH);
            ctx.restore();
        } else {
            ctx.globalAlpha = 0.45;
            drawSpriteScaled(SPRITES.lHurt, view.playerX, state.playerY);
            ctx.globalAlpha = 1;
        }

        // Hit Red Vignette Flash
        if (state.hitFlashTimer > 0) {
            ctx.fillStyle = `rgba(251, 113, 133, ${(state.hitFlashTimer * 1.2).toFixed(2)})`;
            ctx.fillRect(0, 0, view.w, view.h);
        }

        // Particles
        for (const p of state.particles) {
            ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
            ctx.fillStyle = p.color;
            ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);
        }
        ctx.globalAlpha = 1;

        // Crisp Thai Floating Popups
        ctx.font = '600 11px Mitr, Prompt, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        for (const pop of state.popups) {
            ctx.globalAlpha = Math.max(0, pop.life / pop.maxLife);
            const px = Math.max(36, Math.min(view.w - 36, Math.round(pop.x)));
            const py = Math.max(16, Math.round(pop.y));
            ctx.fillStyle = '#061024';
            ctx.fillText(pop.text, px + 1, py + 1);
            ctx.fillStyle = pop.color;
            ctx.fillText(pop.text, px, py);
        }
        ctx.globalAlpha = 1;

        // Crisp Thai Chapter / Fever / Defeat Banner
        if (state.bannerTimer > 0 && state.bannerText) {
            const alpha = Math.min(1, state.bannerTimer * 1.5);
            const padX = view.isCompact ? 14 : 44;
            const bw = view.w - padX * 2;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = 'rgba(7, 16, 36, 0.88)';
            ctx.fillRect(padX, 8, bw, 24);
            ctx.strokeStyle = state.bannerColor;
            ctx.lineWidth = 1.5;
            ctx.strokeRect(padX, 8, bw, 24);
            ctx.fillStyle = '#F0F9FF';
            ctx.font = '600 11px Mitr, Prompt, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(state.bannerText, view.w / 2, 20.5);
            ctx.globalAlpha = 1;
        }

        ctx.restore();
    }

    /* ============ MAIN ANIMATION LOOP ============ */
    let lastTimestamp = performance.now();
    function frameLoop(now) {
        const dt = Math.min(0.05, Math.max(0.001, (now - lastTimestamp) / 1000));
        lastTimestamp = now;

        if (state.mode === 'start') {
            state.elapsed += dt;
            state.playerY = LANE_Y[1] + Math.sin(state.elapsed * 2.4) * 5;
            state.catY = state.playerY + 9;
        } else {
            updateGame(dt);
        }

        drawGame();
        requestAnimationFrame(frameLoop);
    }
    requestAnimationFrame(frameLoop);

    /* ============ INSTANT MOBILE TOUCH & KEYBOARD CONTROLS ============ */
    const mobileMenuEl = document.getElementById('mobile-menu');

    document.addEventListener('keydown', (event) => {
        const activeTag = document.activeElement?.tagName;
        if (activeTag === 'INPUT' || activeTag === 'TEXTAREA') {
            return;
        }
        if ((guideDialog && guideDialog.open) || (gameoverDialog && gameoverDialog.open)) {
            return;
        }
        if (mobileMenuEl && mobileMenuEl.classList.contains('active')) {
            return;
        }

        if (event.code === 'ArrowUp' || event.code === 'KeyW') {
            if (state.mode === 'playing') {
                event.preventDefault();
                moveLane(-1);
            }
        } else if (event.code === 'ArrowDown' || event.code === 'KeyS') {
            if (state.mode === 'playing') {
                event.preventDefault();
                moveLane(1);
            }
        } else if (event.code === 'Digit1') {
            setLaneDirect(0);
        } else if (event.code === 'Digit2') {
            setLaneDirect(1);
        } else if (event.code === 'Digit3') {
            setLaneDirect(2);
        } else if (event.code === 'KeyP' || event.code === 'Escape') {
            if (state.mode === 'playing') {
                event.preventDefault();
                pauseGame();
            } else if (state.mode === 'paused') {
                event.preventDefault();
                resumeGame();
            }
        } else if ((event.code === 'Space' || event.code === 'Enter') && state.mode === 'start') {
            event.preventDefault();
            startGame();
        }
    });

    // Zero-latency direct lane tap + continuous finger glide on canvas
    let activePointerId = null;

    function getLaneFromClientY(clientY) {
        const rect = canvas.getBoundingClientRect();
        const relY = (clientY - rect.top) / Math.max(1, rect.height);
        if (relY < 0.35) return 0;
        if (relY < 0.67) return 1;
        return 2;
    }

    canvas.addEventListener('pointerdown', (event) => {
        if (state.mode !== 'playing') return;
        event.preventDefault();
        activePointerId = event.pointerId;
        if (canvas.setPointerCapture) {
            try {
                canvas.setPointerCapture(event.pointerId);
            } catch {
                // ignore
            }
        }
        setLaneDirect(getLaneFromClientY(event.clientY));
    });

    canvas.addEventListener('pointermove', (event) => {
        if (state.mode !== 'playing' || event.pointerId !== activePointerId) return;
        setLaneDirect(getLaneFromClientY(event.clientY));
    });

    // Prevent rubber-band scroll on iOS Safari while dragging across canvas lanes
    canvas.addEventListener('touchmove', (event) => {
        if (state.mode === 'playing') {
            event.preventDefault();
        }
    }, { passive: false });

    function clearCanvasPointer(event) {
        if (event.pointerId === activePointerId) {
            activePointerId = null;
        }
    }

    canvas.addEventListener('pointerup', clearCanvasPointer);
    canvas.addEventListener('pointercancel', clearCanvasPointer);

    function bindLaneButton(btn, delta) {
        if (!btn) return;
        let usedPointer = false;
        btn.addEventListener('pointerdown', (event) => {
            event.preventDefault();
            usedPointer = true;
            btn.classList.add('is-pressed');
            moveLane(delta);
        });
        btn.addEventListener('pointerup', () => btn.classList.remove('is-pressed'));
        btn.addEventListener('pointercancel', () => btn.classList.remove('is-pressed'));
        btn.addEventListener('pointerleave', () => btn.classList.remove('is-pressed'));
        btn.addEventListener('click', () => {
            if (usedPointer) {
                usedPointer = false;
                return;
            }
            moveLane(delta);
        });
    }

    bindLaneButton(laneUpBtn, -1);
    bindLaneButton(laneDownBtn, 1);

    if (startBtn) startBtn.addEventListener('click', startGame);
    if (resumeBtn) resumeBtn.addEventListener('click', resumeGame);
    if (pauseRestartBtn) pauseRestartBtn.addEventListener('click', startGame);
    if (playAgainBtn) {
        playAgainBtn.addEventListener('click', () => {
            if (isGameOverGuarded()) return;
            startGame();
        });
    }
    if (gameoverCloseBtn) {
        gameoverCloseBtn.addEventListener('click', () => {
            if (isGameOverGuarded()) return;
            closeGameOverToIdle();
        });
    }
    if (gameoverDialog) {
        gameoverDialog.addEventListener('cancel', (event) => {
            event.preventDefault();
            if (isGameOverGuarded()) return;
            closeGameOverToIdle();
        });
        // Light-dismiss backdrop click after safety guard expires
        gameoverDialog.addEventListener('click', (event) => {
            if (event.target !== gameoverDialog || isGameOverGuarded()) return;
            const rect = gameoverDialog.getBoundingClientRect();
            const inside =
                rect.top <= event.clientY &&
                event.clientY <= rect.top + rect.height &&
                rect.left <= event.clientX &&
                event.clientX <= rect.left + rect.width;
            if (!inside) {
                closeGameOverToIdle();
            }
        });
    }

    if (pauseBtn) {
        pauseBtn.addEventListener('click', () => {
            if (state.mode === 'playing') pauseGame();
            else if (state.mode === 'paused') resumeGame();
        });
    }

    document.addEventListener('visibilitychange', () => {
        if (document.hidden && state.mode === 'playing') {
            pauseGame();
        }
    });

    /* ============ ACCESSIBLE <DIALOG> GUIDE (WITH LIGHT-DISMISS FALLBACK) ============ */
    if (guideDialog) {
        if (guideOpenBtn) {
            guideOpenBtn.addEventListener('click', () => {
                if (state.mode === 'playing') pauseGame();
                if (!guideDialog.open) guideDialog.showModal();
            });
        }
        if (guideCloseBtn) {
            guideCloseBtn.addEventListener('click', () => guideDialog.close());
        }
        if (guideDoneBtn) {
            guideDoneBtn.addEventListener('click', () => guideDialog.close());
        }

        if (!('closedBy' in HTMLDialogElement.prototype)) {
            guideDialog.addEventListener('click', (event) => {
                if (event.target !== guideDialog) return;
                const rect = guideDialog.getBoundingClientRect();
                const isDialogContent =
                    rect.top <= event.clientY &&
                    event.clientY <= rect.top + rect.height &&
                    rect.left <= event.clientX &&
                    event.clientX <= rect.left + rect.width;
                if (!isDialogContent) {
                    guideDialog.close();
                }
            });
        }
    }

    /* ============ FORM VALIDATION (THAI MESSAGES + SYNCED SANITIZER) ============ */
    function sanitizeClientName(raw) {
        return String(raw || '')
            .replace(/[\u0000-\u001F\u007F\u200B-\u200D\uFEFF]/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    }

    function initFormValidation() {
        if (!scoreForm || !playerNameInput) return;

        const linkError = (el, shown) => {
            const errorId = el.dataset.error;
            if (!errorId) return;
            const ids = (el.getAttribute('aria-describedby') || '')
                .split(/\s+/)
                .filter((id) => id && id !== errorId);
            if (shown) ids.push(errorId);
            if (ids.length) el.setAttribute('aria-describedby', ids.join(' '));
            else el.removeAttribute('aria-describedby');
        };

        const announcer = document.createElement('div');
        announcer.setAttribute('aria-live', 'polite');
        announcer.classList.add('visually-hidden');
        document.body.append(announcer);
        let announceTimer;
        let announcedField;

        const spokenText = (node) => {
            const copy = node.cloneNode(true);
            copy.querySelectorAll('[aria-hidden="true"]').forEach((n) => n.remove());
            copy.querySelectorAll('[role="img"][aria-label]').forEach((n) => n.replaceWith(`${n.getAttribute('aria-label')}: `));
            return copy.textContent.replace(/\s+/g, ' ').trim();
        };

        const announceError = (el) => {
            const error = document.getElementById(el.dataset.error);
            if (!error) return;
            const label = el.labels?.[0] ? `${spokenText(el.labels[0])}: ` : '';
            clearTimeout(announceTimer);
            announcer.textContent = '';
            announcedField = el;
            announceTimer = setTimeout(() => {
                announcer.textContent = label + spokenText(error);
            }, 500);
        };

        const syncCustomValidity = () => {
            const cleaned = sanitizeClientName(playerNameInput.value);
            if (!cleaned) {
                playerNameInput.setCustomValidity('กรุณาใส่ชื่อ 1–18 ตัวอักษร');
            } else if (/[<>]/.test(playerNameInput.value)) {
                playerNameInput.setCustomValidity('ชื่อห้ามมีเครื่องหมาย < หรือ >');
            } else if (Array.from(cleaned).length > 18) {
                playerNameInput.setCustomValidity('ชื่อยาวได้สูงสุด 18 ตัวอักษร');
            } else {
                playerNameInput.setCustomValidity('');
            }
        };

        const supportsUserInvalid = CSS.supports('selector(:user-invalid)');
        const flagged = new WeakSet();
        const announced = new WeakSet();
        const dirtyState = new WeakMap();

        const syncAria = (el, announce = false) => {
            if (!el.matches?.('input, select, textarea')) return;
            syncCustomValidity();
            const invalid = supportsUserInvalid
                ? el.matches(':user-invalid')
                : el.classList.contains('user-invalid-fallback');
            if (invalid) {
                if (announce && !announced.has(el)) {
                    announceError(el);
                    announced.add(el);
                }
                el.setAttribute('aria-invalid', 'true');
                linkError(el, true);
                flagged.add(el);
            } else if (flagged.has(el) || el.getAttribute('aria-invalid') !== 'true') {
                el.setAttribute('aria-invalid', 'false');
                linkError(el, false);
                flagged.delete(el);
                announced.delete(el);
                if (announcedField === el) {
                    clearTimeout(announceTimer);
                    announcer.textContent = '';
                }
            }
        };

        syncAria(playerNameInput);

        if (!supportsUserInvalid) {
            const updateFallbackState = (input, announce = false) => {
                syncCustomValidity();
                const isValid = input.validity.valid;
                input.classList.toggle('user-invalid-fallback', !isValid);
                input.classList.toggle('user-valid-fallback', isValid);
                syncAria(input, announce);
            };

            playerNameInput.addEventListener('input', () => {
                const st = dirtyState.get(playerNameInput) || { hasInteracted: false, hasBlurred: false };
                st.hasInteracted = true;
                dirtyState.set(playerNameInput, st);
                if (st.hasBlurred) updateFallbackState(playerNameInput);
            });

            playerNameInput.addEventListener('blur', () => {
                const st = dirtyState.get(playerNameInput) || { hasInteracted: false, hasBlurred: false };
                st.hasBlurred = true;
                dirtyState.set(playerNameInput, st);
                if (st.hasInteracted) updateFallbackState(playerNameInput, true);
            });

            playerNameInput.addEventListener('invalid', () => {
                dirtyState.set(playerNameInput, { hasInteracted: true, hasBlurred: true });
                announced.add(playerNameInput);
                updateFallbackState(playerNameInput);
            });
        } else {
            scoreForm.addEventListener('blur', (e) => syncAria(e.target, true), true);
            scoreForm.addEventListener('input', (e) => {
                if (e.target.hasAttribute('aria-invalid')) syncAria(e.target);
            });
            scoreForm.addEventListener('invalid', (e) => {
                announced.add(e.target);
                syncAria(e.target);
            }, true);
        }

        scoreForm.syncValidityAndAria = () => {
            syncCustomValidity();
            if (!supportsUserInvalid && !playerNameInput.validity.valid) {
                playerNameInput.classList.add('user-invalid-fallback');
                playerNameInput.classList.remove('user-valid-fallback');
            }
            syncAria(playerNameInput);
        };
    }

    initFormValidation();

    /* ============ LEADERBOARD CLIENT & DEDUPLICATED LOCAL FALLBACK ============ */
    function normalizeLocalPlayerKey(name) {
        return sanitizeClientName(name).normalize('NFC').toLowerCase();
    }

    function consolidateLocalEntries(rawList) {
        const groups = new Map();
        for (const item of rawList) {
            if (!item || typeof item !== 'object') continue;
            const cleanName = sanitizeClientName(item.name || 'นักบินนิรนาม');
            const normKey = normalizeLocalPlayerKey(cleanName);
            if (!normKey) continue;

            const plays = Math.max(1, Number.parseInt(item.plays, 10) || 1);
            const score = Number(item.score) || 0;
            const maxCombo = Number(item.maxCombo) || 0;
            const existing = groups.get(normKey);

            if (!existing) {
                groups.set(normKey, {
                    ...item,
                    id: `loc:${normKey}`,
                    name: cleanName,
                    score,
                    maxCombo,
                    plays,
                });
                continue;
            }

            const totalPlays = existing.plays + plays;
            const itemIsBetter =
                score > existing.score ||
                (score === existing.score && maxCombo > existing.maxCombo);

            if (itemIsBetter) {
                groups.set(normKey, {
                    ...item,
                    id: `loc:${normKey}`,
                    name: cleanName,
                    score,
                    maxCombo,
                    plays: totalPlays,
                });
            } else {
                existing.plays = totalPlays;
                existing.name = cleanName;
            }
        }

        return Array.from(groups.values())
            .sort((a, b) => (b.score - a.score) || (b.maxCombo - a.maxCombo))
            .slice(0, 25)
            .map((item, idx) => ({
                ...item,
                rank: idx + 1,
            }));
    }

    function readLocalEntries() {
        try {
            const raw = JSON.parse(localStorage.getItem(LOCAL_LB_KEY) || '[]');
            if (!Array.isArray(raw)) return [];
            const consolidated = consolidateLocalEntries(raw);
            if (consolidated.length !== raw.length) {
                writeLocalEntries(consolidated);
            }
            return consolidated;
        } catch {
            return [];
        }
    }

    function writeLocalEntries(entries) {
        try {
            localStorage.setItem(LOCAL_LB_KEY, JSON.stringify(entries.slice(0, 25)));
        } catch {
            // ignore
        }
    }

    function saveLocalEntry(entry) {
        const list = readLocalEntries();
        const normKey = normalizeLocalPlayerKey(entry.name);
        const canonicalId = `loc:${normKey}`;
        const prev = list.find((item) => normalizeLocalPlayerKey(item.name) === normKey) || null;
        const improved = !prev || entry.score > prev.score;

        const merged = prev
            ? (improved
                ? {
                    ...entry,
                    id: canonicalId,
                    plays: (Number(prev.plays) || 1) + 1,
                }
                : {
                    ...prev,
                    id: canonicalId,
                    name: entry.name,
                    plays: (Number(prev.plays) || 1) + 1,
                    updatedAt: entry.createdAt,
                })
            : {
                ...entry,
                id: canonicalId,
                plays: 1,
            };

        const nextList = list.filter((item) => normalizeLocalPlayerKey(item.name) !== normKey);
        nextList.push(merged);
        nextList.sort((a, b) => (b.score - a.score) || (b.maxCombo - a.maxCombo));

        const ranked = nextList.slice(0, 25).map((item, idx) => ({
            ...item,
            rank: idx + 1,
        }));
        writeLocalEntries(ranked);
        const found = ranked.find((item) => item.id === canonicalId);
        return {
            entries: ranked,
            rank: found ? found.rank : null,
            entry: found || merged,
            improved,
        };
    }

    function formatSaveSuccessThai(cleanName, rank, savedEntry, improved, isGlobal) {
        const plays = Math.max(1, Number(savedEntry?.plays) || 1);
        const bestScore = Number(savedEntry?.score || 0).toLocaleString('en');
        const scope = isGlobal ? 'ออนไลน์' : 'ในเครื่องนี้';
        const rankText = rank ? `อันดับ #${rank} ${scope}` : scope;

        if (plays <= 1) {
            return `บันทึกคะแนนของ ${cleanName} เรียบร้อยแล้ว! (${rankText})`;
        }
        if (improved) {
            return `ทุบสถิติเดิมของ ${cleanName} แล้ว! (${rankText} · เล่นสะสม ${plays} ครั้ง)`;
        }
        return `อัปเดตจำนวนรอบของ ${cleanName} แล้ว (เล่นสะสม ${plays} ครั้ง · คงสถิติสูงสุด ${bestScore} · ${rankText})`;
    }

    function setLeaderboardMode(mode) {
        if (!lbModeBadge) return;
        if (mode === 'global') {
            lbModeBadge.textContent = 'อันดับออนไลน์';
            lbModeBadge.className = 'lb-mode-badge is-global';
            if (lbSetupNote) lbSetupNote.hidden = true;
        } else {
            lbModeBadge.textContent = 'ในเครื่องนี้';
            lbModeBadge.className = 'lb-mode-badge is-local';
            if (lbSetupNote) lbSetupNote.hidden = false;
        }
    }

    function renderLeaderboard(entries) {
        if (!lbList) return;
        lbList.setAttribute('aria-busy', 'false');

        if (!Array.isArray(entries) || entries.length === 0) {
            lbList.replaceChildren();
            if (lbStatus) lbStatus.hidden = false;
            if (lbStatusMsg) lbStatusMsg.textContent = 'ยังไม่มีสถิติการบิน มาเป็นคนแรกที่ขึ้นตารางกันเถอะ!';
            if (lbRetryBtn) lbRetryBtn.hidden = true;
            return;
        }

        if (lbStatus) lbStatus.hidden = true;

        const nodes = entries.map((entry, idx) => {
            const rank = Number(entry.rank) || idx + 1;
            const li = document.createElement('li');
            li.className = 'lb-row';
            if (rank <= 3) li.classList.add(`rank-${rank}`);
            if (state.lastSubmittedId && entry.id === state.lastSubmittedId) {
                li.classList.add('is-highlight');
            }

            const rankEl = document.createElement('span');
            rankEl.className = 'lb-rank';
            rankEl.textContent = `#${rank}`;

            const pilotEl = document.createElement('div');
            pilotEl.className = 'lb-pilot';

            const nameRowEl = document.createElement('div');
            nameRowEl.className = 'lb-name-row';

            const nameEl = document.createElement('span');
            nameEl.className = 'lb-name';
            nameEl.textContent = entry.name || 'นักบินนิรนาม';

            const playsCount = Math.max(1, Number(entry.plays) || 1);
            const playsEl = document.createElement('span');
            playsEl.className = 'lb-plays-pill';
            playsEl.textContent = `เล่น ${playsCount} ครั้ง`;

            nameRowEl.append(nameEl, playsEl);

            const metaEl = document.createElement('span');
            metaEl.className = 'lb-meta';
            const seasonTag = entry.season ? `รอบ ${entry.season}` : 'รอบ 1';
            const chapterTag = getThaiChapterName(entry.chapter);
            const comboTag = Number(entry.maxCombo) > 0 ? ` · คอมโบ ${entry.maxCombo}` : '';
            metaEl.textContent = `${seasonTag} ${chapterTag}${comboTag}`;

            pilotEl.append(nameRowEl, metaEl);

            const scoreEl = document.createElement('span');
            scoreEl.className = 'lb-score';
            scoreEl.textContent = Number(entry.score || 0).toLocaleString('en');

            li.append(rankEl, pilotEl, scoreEl);
            return li;
        });

        lbList.replaceChildren(...nodes);
    }

    function formatServerErrorThai(status, data) {
        const code = data?.errorCode || '';
        const msg = String(data?.error || '');

        if (status === 429 || code === 'RATE_LIMITED') {
            return 'ส่งคะแนนถี่เกินไป กรุณารอสักครู่แล้วลองใหม่';
        }
        if (code === 'INVALID_NAME' || /name/i.test(msg)) {
            return 'ชื่อไม่ถูกต้อง กรุณาใส่ 1–18 ตัวอักษร และห้ามใช้เครื่องหมาย < หรือ >';
        }
        if (code === 'SCORE_RATE_LIMIT' || code === 'INVALID_SCORE' || /score|rate/i.test(msg)) {
            return 'คะแนนรอบนี้ไม่ผ่านเงื่อนไขการตรวจสอบของระบบ กรุณาลองเล่นรอบใหม่';
        }
        if (code === 'INVALID_DURATION' || /duration/i.test(msg)) {
            return 'ระยะเวลาการบินสั้นเกินไป กรุณาลองเล่นอีกครั้ง';
        }
        return 'ไม่สามารถบันทึกคะแนนได้ในขณะนี้ กรุณาลองกดบันทึกอีกครั้ง';
    }

    async function loadLeaderboard() {
        if (lbList) lbList.setAttribute('aria-busy', 'true');
        if (lbStatus) lbStatus.hidden = true;

        try {
            const res = await fetch('/api/leaderboard', {
                headers: { Accept: 'application/json' },
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();

            if (data && data.storageConfigured) {
                setLeaderboardMode('global');
                renderLeaderboard(data.entries || []);
            } else {
                setLeaderboardMode('local');
                renderLeaderboard(readLocalEntries());
            }
        } catch {
            setLeaderboardMode('local');
            renderLeaderboard(readLocalEntries());
        }
    }

    if (lbRefreshBtn) {
        lbRefreshBtn.addEventListener('click', loadLeaderboard);
    }
    if (lbRetryBtn) {
        lbRetryBtn.addEventListener('click', loadLeaderboard);
    }

    if (scoreForm && playerNameInput) {
        scoreForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            if (isGameOverGuarded() || state.lastSubmittedRun) return;

            if (typeof scoreForm.syncValidityAndAria === 'function') {
                scoreForm.syncValidityAndAria();
            }

            if (!playerNameInput.checkValidity()) {
                playerNameInput.focus();
                return;
            }

            const cleanName = sanitizeClientName(playerNameInput.value).replace(/[<>]/g, '');

            try {
                localStorage.setItem(LAST_NAME_KEY, cleanName);
            } catch {
                // ignore
            }

            if (submitScoreBtn) submitScoreBtn.disabled = true;
            if (submitStatus) {
                submitStatus.textContent = 'กำลังบันทึกคะแนน...';
                submitStatus.className = 'submit-status';
            }

            const payload = {
                name: cleanName,
                score: Math.max(1, Math.floor(state.score)),
                maxCombo: state.maxCombo,
                season: state.season,
                chapter: CHAPTERS[state.chapterIdx].apiName,
                durationSec: Math.max(2, Math.round(state.elapsed)),
            };

            try {
                const res = await fetch('/api/leaderboard', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                    },
                    body: JSON.stringify(payload),
                });

                const data = await res.json().catch(() => null);

                if (res.ok && data && data.storageConfigured && data.saved) {
                    state.lastSubmittedRun = true;
                    state.lastSubmittedId = data.entry?.id || null;
                    setLeaderboardMode('global');
                    renderLeaderboard(data.entries || []);
                    if (submitStatus) {
                        submitStatus.textContent = formatSaveSuccessThai(
                            cleanName,
                            data.rank,
                            data.entry,
                            data.improved !== false,
                            true
                        );
                        submitStatus.className = 'submit-status is-success';
                    }
                    return;
                }

                if (res.status === 400 || res.status === 429) {
                    if (submitScoreBtn) submitScoreBtn.disabled = false;
                    if (submitStatus) {
                        submitStatus.textContent = formatServerErrorThai(res.status, data);
                        submitStatus.className = 'submit-status is-error';
                    }
                    return;
                }

                const fallbackEntry = data?.entry || {
                    id: `loc-${Date.now().toString(36)}`,
                    ...payload,
                    createdAt: new Date().toISOString(),
                };
                const savedLocal = saveLocalEntry(fallbackEntry);
                state.lastSubmittedRun = true;
                state.lastSubmittedId = savedLocal.entry?.id || fallbackEntry.id;
                setLeaderboardMode('local');
                renderLeaderboard(savedLocal.entries);
                if (submitStatus) {
                    submitStatus.textContent = formatSaveSuccessThai(
                        cleanName,
                        savedLocal.rank,
                        savedLocal.entry,
                        savedLocal.improved,
                        false
                    );
                    submitStatus.className = 'submit-status is-success';
                }
            } catch {
                const fallbackEntry = {
                    id: `loc-${Date.now().toString(36)}`,
                    ...payload,
                    createdAt: new Date().toISOString(),
                };
                const savedLocal = saveLocalEntry(fallbackEntry);
                state.lastSubmittedRun = true;
                state.lastSubmittedId = savedLocal.entry?.id || fallbackEntry.id;
                setLeaderboardMode('local');
                renderLeaderboard(savedLocal.entries);
                if (submitStatus) {
                    submitStatus.textContent = formatSaveSuccessThai(
                        cleanName,
                        savedLocal.rank,
                        savedLocal.entry,
                        savedLocal.improved,
                        false
                    );
                    submitStatus.className = 'submit-status is-success';
                }
            }
        });
    }

    loadLeaderboard();
})();
