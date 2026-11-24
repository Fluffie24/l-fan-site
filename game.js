(() => {
    'use strict';

    /* ============ DYNAMIC VIEWPORT GEOMETRY (ZERO LETTERBOXING) ============ */
    const VIRTUAL_H = 276;
    const BASE_VIRTUAL_W = 480;
    const BASE_PLAYER_X = 88;
    const BASE_TRAVEL_DIST = BASE_VIRTUAL_W - BASE_PLAYER_X; // 392
    const LANE_Y = [70, 140, 210];

    const CHAPTER_DURATION = 22;
    const INVULN_DURATION = 1.25;

    const PB_STORAGE_KEY = 'wataridori_pb_v1';
    const LOCAL_LB_KEY = 'wataridori_local_lb_v1';
    const AUDIO_PREF_KEY = 'wataridori_audio_v1';
    const LAST_NAME_KEY = 'wataridori_name_v1';

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const view = {
        w: BASE_VIRTUAL_W,
        h: VIRTUAL_H,
        playerX: BASE_PLAYER_X,
        spriteScale: 1.35,
        speedScale: 1,
        isCompact: false,
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

        // Fast Thunder Bolt Surge (28x12)
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
                playTone(880, 0.045, 'square', 0.035, 660, 0);
                break;
            case 'bolt':
                playTone(980, 0.12, 'sawtooth', 0.06, 260, 0);
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
    const gameoverOverlay = document.getElementById('gameover-overlay');

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

    /* ============ RESPONSIVE CANVAS SIZING (CRISP 2X BACKING + ZERO LETTERBOX) ============ */
    function resizeCanvasStage() {
        if (!canvasFrame || !canvas) return;
        const rect = canvasFrame.getBoundingClientRect();
        const cssW = Math.max(240, Math.round(rect.width));
        const cssH = Math.max(200, Math.round(rect.height));
        const dpr = Math.min(2, window.devicePixelRatio || 2);

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
        view.spriteScale = view.isCompact ? 1.52 : 1.36;
        view.speedScale = (view.w - view.playerX) / BASE_TRAVEL_DIST;

        // Remap active item x-positions and hitbox dimensions smoothly if viewport size changed
        if (prevW > 0 && state && state.items) {
            const ratio = prevW !== view.w ? view.w / prevW : 1;
            const spriteMap = {
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
            for (const item of state.items) {
                item.x *= ratio;
                const sp = spriteMap[item.kind];
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

    /* ============ BGM & AUDIO PREFERENCES ============ */
    const audioState = {
        bgmEnabled: true,
        volume: 0.35,
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
        bgmAudio.volume = audioState.volume;
        bgmAudio.addEventListener('play', syncAudioControls);
        bgmAudio.addEventListener('pause', syncAudioControls);
    }

    function tryStartBgm() {
        if (!bgmAudio || !audioState.bgmEnabled) return;
        bgmAudio.volume = audioState.volume;
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
            bgmAudio.volume = audioState.volume;
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
        mode: 'start', // 'start' | 'playing' | 'paused' | 'gameover'
        elapsed: 0,
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
        scrollSpeed: 182,
        spawnTimer: 0.72,
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

    /* ============ PROGRESSIVE DIFFICULTY HELPERS ============ */
    function getDifficultyTier() {
        // 0..3 within Season 1, 4+ in Season 2+
        return Math.min(6, Math.floor(state.elapsed / CHAPTER_DURATION) + 1);
    }

    function getFeverDuration() {
        return state.season >= 2 ? 4.0 : 4.5;
    }

    function getBaseScrollSpeed() {
        // Starts brisk at 182, ramps smoothly through 350 by end of S1, up to 440 in endless
        const linear = 182 + state.elapsed * 2.15 + (state.season - 1) * 24;
        if (linear <= 360) return linear;
        return Math.min(445, 360 + (linear - 360) * 0.42);
    }

    function getTelegraphDuration() {
        // Fair warning window that tightens as difficulty grows (0.50s -> 0.34s)
        const tier = state.diffLevel;
        return Math.max(0.34, 0.51 - (tier - 1) * 0.032);
    }

    /* ============ GAME HELPERS & PROGRESSIVE WAVE SPAWNER ============ */
    function setBanner(text, color = '#38BDF8', duration = 3.2) {
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
        const spriteMap = {
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
        const sp = spriteMap[kind] || SPRITES.ringSky;
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
        if (tier >= 2 && Math.random() < Math.min(0.42, 0.18 + (tier - 2) * 0.07)) {
            return 'bat';
        }
        if (chIdx === 0) return Math.random() < 0.5 ? 'bat' : 'cloud';
        return Math.random() < 0.58 ? 'cloud' : 'bat';
    }

    function getSpawnCooldown(baseSec) {
        // Compresses smoothly as speed rises while staying fair
        const speedNorm = Math.min(1.3, (state.scrollSpeed - 182) / 210);
        return Math.max(0.4, baseSec - speedNorm * 0.42);
    }

    function pickFairSafeLane() {
        // Avoid picking a "safe" lane that already has a hazard entering the right half of the screen
        const incomingHazardLanes = new Set();
        const thresholdX = view.w * 0.58;
        for (const item of state.items) {
            const isHaz = item.kind !== 'ring' && item.kind !== 'potato' && item.kind !== 'feather';
            if (isHaz && item.x >= thresholdX) {
                incomingHazardLanes.add(item.targetLane ?? item.lane);
            }
        }
        for (const tel of state.telegraphs) {
            incomingHazardLanes.add(tel.lane);
        }
        const clearLanes = [0, 1, 2].filter((l) => !incomingHazardLanes.has(l));
        const candidates = clearLanes.length > 0 ? clearLanes : [0, 1, 2];
        return candidates[Math.floor(Math.random() * candidates.length)];
    }

    function spawnWave() {
        const ch = state.chapterIdx;
        const tier = state.diffLevel;
        const telDur = getTelegraphDuration();

        // Rarer healing feather — requires longer wait and appears in trickier lanes
        const featherCooldown = state.season >= 2 ? 34 : 28;
        const needsHeal = state.hp < state.maxHp && state.elapsed - state.lastFeatherAt >= featherCooldown;

        // Build weighted pattern deck based on current progression tier
        const pool = [];
        // 0: Single hazard warm-up (fades out after LV.2 so late game is never dull)
        if (tier <= 2) pool.push({ id: 0, w: tier === 1 ? 18 : 6 });
        // 1: Double Gate (2 lanes blocked, 1 safe) — chained at LV.3+
        pool.push({ id: 1, w: 26 });
        // 2: Slalom Weave (3 -> 4 -> 5 beats!)
        pool.push({ id: 2, w: 22 + Math.min(8, tier * 2) });
        // 3: Headwind Gale (single early, DOUBLE gale from LV.3+)
        pool.push({ id: 3, w: 18 + Math.min(10, tier * 2) });
        // 4: Swooping Lane-Shift Bat (unlocks LV.2+)
        if (tier >= 2) pool.push({ id: 4, w: 14 + Math.min(10, (tier - 1) * 3) });
        // 5: Risk-Reward Potato Bait (unlocks LV.2+)
        if (tier >= 2) pool.push({ id: 5, w: 14 });
        // 6: Targeted Thunder Bolt Surge (unlocks LV.3+)
        if (tier >= 3) pool.push({ id: 6, w: 16 + Math.min(10, (tier - 2) * 3) });
        // 7: Leaping Catfish Ambush (Chapter 2 or Season 2+)
        if (ch === 1 || state.season >= 2) pool.push({ id: 7, w: ch === 1 ? 22 : 12 });

        // Avoid repeating the exact same pattern twice in a row
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
            // Pattern 0: Brisk warm-up gate (1 hazard + rings)
            const hazardLane = Math.floor(Math.random() * 3);
            const safeLanes = [0, 1, 2].filter((l) => l !== hazardLane);
            const ringLane = safeLanes[Math.floor(Math.random() * safeLanes.length)];
            pushItem(pickStandardHazard(ch, tier), hazardLane, 0);
            for (let i = 0; i < 3; i += 1) {
                pushItem('ring', ringLane, i * 32, { colorVariant: i % 2 });
            }
            if (needsHeal) {
                pushItem('feather', safeLanes[0], 98);
                state.lastFeatherAt = state.elapsed;
            }
            state.spawnTimer = getSpawnCooldown(0.95);
        } else if (chosen === 1) {
            // Pattern 1: Double Gate — chains into a 2nd shifted Double Gate at LV.3+!
            const safe1 = pickFairSafeLane();
            const blocked1 = [0, 1, 2].filter((l) => l !== safe1);
            pushItem(pickStandardHazard(ch, tier), blocked1[0], 0);
            pushItem(pickStandardHazard(ch, tier), blocked1[1], 10);
            pushItem('ring', safe1, 14, { colorVariant: 0 });
            pushItem('ring', safe1, 46, { colorVariant: 1 });

            if (tier >= 3 && Math.random() < 0.68) {
                // Chained 2nd gate in a different lane!
                const otherLanes = [0, 1, 2].filter((l) => l !== safe1);
                const safe2 = otherLanes[Math.floor(Math.random() * otherLanes.length)];
                const blocked2 = [0, 1, 2].filter((l) => l !== safe2);
                const gapX = Math.max(126, 152 - tier * 5);
                pushItem(pickStandardHazard(ch, tier), blocked2[0], gapX);
                pushItem(pickStandardHazard(ch, tier), blocked2[1], gapX + 10);
                pushItem('potato', safe2, gapX + 16);
                if (needsHeal) {
                    pushItem('feather', safe2, gapX + 56);
                    state.lastFeatherAt = state.elapsed;
                }
                state.spawnTimer = getSpawnCooldown(1.48);
            } else {
                if (Math.random() < 0.55) {
                    pushItem('potato', safe1, 78);
                }
                if (needsHeal) {
                    pushItem('feather', safe1, 108);
                    state.lastFeatherAt = state.elapsed;
                }
                state.spawnTimer = getSpawnCooldown(1.02);
            }
        } else if (chosen === 2) {
            // Pattern 2: Escalating Slalom Weave (3 beats -> 4 beats -> 5 beats)
            const beats = tier >= 5 ? 5 : tier >= 3 ? 4 : 3;
            const stepX = Math.max(82, 102 - tier * 4);
            let safe = Math.random() < 0.5 ? 0 : 2;
            let dir = safe === 0 ? 1 : -1;

            for (let step = 0; step < beats; step += 1) {
                const off = step * stepX;
                const blockedA = (safe + 1) % 3;
                const blockedB = (safe + 2) % 3;
                pushItem(pickStandardHazard(ch, tier), blockedA, off);
                // From LV.2+, block both non-safe lanes on alternate beats for tighter precision
                if (tier >= 2 && step % 2 === 1) {
                    pushItem(pickStandardHazard(ch, tier), blockedB, off + 8);
                }
                pushItem('ring', safe, off + 8, { colorVariant: step % 2 });

                if (safe === 2) dir = -1;
                else if (safe === 0) dir = 1;
                safe += dir;
            }
            const lastSafe = Math.max(0, Math.min(2, safe - dir));
            pushItem('potato', lastSafe, (beats - 1) * stepX + 38);
            state.spawnTimer = getSpawnCooldown(1.15 + beats * 0.22);
        } else if (chosen === 3) {
            // Pattern 3: Fast Headwind Gale — SINGLE early, DOUBLE GALE from LV.3+!
            const isDoubleGale = tier >= 3 && Math.random() < (tier >= 4 ? 0.78 : 0.55);
            if (isDoubleGale) {
                const safeLane = pickFairSafeLane();
                const gustLanes = [0, 1, 2].filter((l) => l !== safeLane);
                gustLanes.forEach((lane) => {
                    state.telegraphs.push({ lane, timer: telDur, kind: 'gust', locked: true });
                });
                playSfx('warn');
                pushItem('ring', safeLane, 20, { colorVariant: 0 });
                pushItem('potato', safeLane, 56);
                state.spawnTimer = getSpawnCooldown(1.08);
            } else {
                const gustLane = Math.floor(Math.random() * 3);
                const otherLanes = [0, 1, 2].filter((l) => l !== gustLane);
                const safeLane = otherLanes[Math.floor(Math.random() * otherLanes.length)];
                const cloudLane = otherLanes.find((l) => l !== safeLane);

                state.telegraphs.push({ lane: gustLane, timer: telDur, kind: 'gust', locked: true });
                playSfx('warn');
                // From LV.2+, pair the gust with a cloud in another lane so timing matters!
                if (tier >= 2 && cloudLane !== undefined) {
                    pushItem('cloud', cloudLane, 32);
                }
                for (let i = 0; i < 2; i += 1) {
                    pushItem('ring', safeLane, i * 34, { colorVariant: i % 2 });
                }
                state.spawnTimer = getSpawnCooldown(1.0);
            }
        } else if (chosen === 4) {
            // Pattern 4: Swooping Lane-Shift Bat + Guard Cloud (forces reading movement!)
            const startLane = Math.random() < 0.5 ? 0 : 2;
            const targetLane = 1;
            const safeLane = startLane === 0 ? 2 : 0;

            pushItem('batSwoop', startLane, 0, { targetLane, speedMul: 1.08 });
            // Guard cloud arrives slightly after in startLane, leaving safeLane clean
            pushItem('cloud', startLane, 92);
            pushItem('ring', targetLane, 10, { colorVariant: 0 });
            pushItem('potato', safeLane, 68);
            if (needsHeal) {
                pushItem('feather', safeLane, 106);
                state.lastFeatherAt = state.elapsed;
            }
            state.spawnTimer = getSpawnCooldown(1.18);
        } else if (chosen === 5) {
            // Pattern 5: Risk-Reward Bait (easy outer ring vs daring Tornado Potato thread-the-needle)
            const baitLane = 1;
            const safeLane = Math.random() < 0.5 ? 0 : 2;
            const guardLane = safeLane === 0 ? 2 : 0;

            pushItem('cloud', baitLane, 0);
            pushItem('cloud', guardLane, 28);
            pushItem('potato', baitLane, 64); // Thread right behind the cloud!
            pushItem('cloud', baitLane, 122);
            pushItem('ring', safeLane, 30, { colorVariant: 0 });
            pushItem('ring', safeLane, 64, { colorVariant: 1 });
            state.spawnTimer = getSpawnCooldown(1.26);
        } else if (chosen === 6) {
            // Pattern 6: Targeted Thunder Bolt Surge (tracks current lane briefly, then locks!)
            const trackedLane = state.playerLane;
            const otherLanes = [0, 1, 2].filter((l) => l !== trackedLane);
            const safeLane = otherLanes[Math.floor(Math.random() * otherLanes.length)];
            const cloudLane = otherLanes.find((l) => l !== safeLane);

            state.telegraphs.push({
                lane: trackedLane,
                timer: telDur + 0.08,
                trackTimer: 0.14,
                kind: 'bolt',
                locked: false,
            });
            playSfx('warn');
            if (cloudLane !== undefined && tier >= 4) {
                pushItem('cloud', cloudLane, 36);
            }
            pushItem('ring', safeLane, 18, { colorVariant: 0 });
            pushItem('ring', safeLane, 50, { colorVariant: 1 });
            if (needsHeal) {
                pushItem('feather', safeLane, 86);
                state.lastFeatherAt = state.elapsed;
            }
            state.spawnTimer = getSpawnCooldown(1.04);
        } else {
            // Pattern 7: Rough Ocean Leaping Catfish + Upper Cloud
            state.telegraphs.push({ lane: 2, timer: telDur, kind: 'catfish', locked: true });
            playSfx('warn');
            const cloudLane = Math.random() < 0.55 ? 0 : 1;
            const safeLane = cloudLane === 0 ? 1 : 0;
            pushItem('cloud', cloudLane, 28);
            pushItem('ring', safeLane, 12, { colorVariant: 0 });
            pushItem('ring', safeLane, 44, { colorVariant: 1 });
            pushItem('potato', safeLane, 78);
            state.spawnTimer = getSpawnCooldown(1.08);
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
        state.scrollSpeed = 182;
        state.spawnTimer = 0.65;
        state.lastFeatherAt = -30;
        state.lastPattern = -1;
        state.afterimages = [];
        state.items = [];
        state.telegraphs = [];
        state.particles = [];
        state.popups = [];
        state.lastSubmittedRun = false;

        setBanner(CHAPTERS[0].lyric, CHAPTERS[0].accent, 3.0);
        updateHud();
    }

    function startGame() {
        resetGameState();
        state.mode = 'playing';
        startOverlay.hidden = true;
        pauseOverlay.hidden = true;
        gameoverOverlay.hidden = true;
        if (pauseBtn) pauseBtn.disabled = false;
        ensureAudioCtx();
        tryStartBgm();
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

    function triggerGameOver() {
        state.mode = 'gameover';
        if (pauseBtn) pauseBtn.disabled = true;
        playSfx('gameover');

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

        try {
            const savedName = localStorage.getItem(LAST_NAME_KEY);
            if (savedName && playerNameInput && !playerNameInput.value) {
                playerNameInput.value = savedName;
            }
        } catch {
            // ignore
        }

        gameoverOverlay.hidden = false;
        updateHud();
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
    function updateGame(dt) {
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
            setBanner(`รอบ ${state.season} · ${chObj.lyric}`, chObj.accent, 3.2);
        }

        if (state.chapterLerp < 1) {
            state.chapterLerp = Math.min(1, state.chapterLerp + dt / 2.2);
        }

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

        // Snappy lane interpolation (feels ultra-responsive on mobile & fast waves!)
        const targetY = LANE_Y[state.playerLane];
        state.playerY += (targetY - state.playerY) * Math.min(1, dt * 20);
        state.playerTilt *= Math.pow(0.03, dt);
        state.catY += (state.playerY + 9 - state.catY) * Math.min(1, dt * 10);

        // Speed lines movement
        const worldSpeed = state.scrollSpeed * view.speedScale;
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
                    pushItem('gust', tel.lane, 0, { speedMul: 1.54 });
                } else if (tel.kind === 'catfish') {
                    pushItem('catfish', 2, 0, { speedMul: 1.18, jumpTimer: 0.1 });
                } else if (tel.kind === 'bolt') {
                    pushItem('bolt', tel.lane, 0, { speedMul: 1.88 });
                    playSfx('bolt');
                }
            } else {
                nextTelegraphs.push(tel);
            }
        }
        state.telegraphs = nextTelegraphs;

        // Player hitbox (scales cleanly with spriteScale)
        const pHalf = 9.5 * view.spriteScale;
        const playerBox = {
            x: view.playerX - pHalf,
            y: state.playerY - pHalf,
            w: pHalf * 2,
            h: pHalf * 2,
        };

        const surviving = [];

        for (const item of state.items) {
            const prevX = item.x;
            item.x -= worldSpeed * item.speedMul * dt;

            if (item.kind === 'bat') {
                item.y = item.baseY + Math.sin(state.elapsed * 7.5 + item.phase) * 7.5;
            } else if (item.kind === 'batSwoop') {
                // Swooping bat warns then switches to targetLane mid-flight!
                const triggerX = view.playerX + (view.w - view.playerX) * 0.56;
                if (item.swoopState === 'armed' && item.x <= triggerX) {
                    item.swoopState = 'warning';
                    item.swoopWarnTimer = 0.24;
                    playSfx('warn');
                } else if (item.swoopState === 'warning') {
                    item.swoopWarnTimer -= dt;
                    if (item.swoopWarnTimer <= 0) {
                        item.swoopState = 'swooping';
                        item.lane = item.targetLane;
                        item.baseY = LANE_Y[item.targetLane];
                    }
                } else if (item.swoopState === 'swooping') {
                    item.y += (item.baseY - item.y) * Math.min(1, dt * 13);
                }
            } else if (item.kind === 'catfish') {
                item.jumpTimer += dt;
                const arc = Math.abs(Math.sin(item.jumpTimer * 4.5)) * 34;
                item.y = LANE_Y[2] + 18 - arc;
            } else if (isFever && (item.kind === 'ring' || item.kind === 'potato')) {
                // Subtle close-range Fever magnetism ONLY (no screen-wide vacuum!)
                const dx = view.playerX - item.x;
                const dy = state.playerY - item.y;
                if (Math.abs(dx) < 48 * view.speedScale && Math.abs(dy) < 30) {
                    item.x += dx * Math.min(1, dt * 4.2);
                    item.y += dy * Math.min(1, dt * 4.2);
                }
            }

            if (item.x < -56) continue;

            const isCollectible = item.kind === 'ring' || item.kind === 'potato' || item.kind === 'feather';
            const pad = isCollectible ? 3.5 : -3.5;
            const halfW = item.w / 2 + pad;
            const halfH = item.h / 2 + pad;

            const hit =
                playerBox.x < item.x + halfW &&
                playerBox.x + playerBox.w > item.x - halfW &&
                playerBox.y < item.y + halfH &&
                playerBox.y + playerBox.h > item.y - halfH;

            if (!hit) {
                // Skillful Near-Miss ("หลบเฉียด!") bonus when dodging out of a hazard's lane at the last moment
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
                state.shakeTimer = prefersReducedMotion ? 0 : 0.26;
                spawnParticles(view.playerX, state.playerY, '#FB7185', 14, 100);
                spawnPopup(view.playerX + 10, state.playerY - 18, 'โอ๊ย!', '#FB7185');
                playSfx('hit');
                if (state.hp <= 0) {
                    triggerGameOver();
                    return;
                }
            }
        }
        state.items = surviving;

        // Particles & floating score popups
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
                ctx.fillStyle = 'rgba(251, 113, 133, 0.12)';
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

        // Edge Telegraphs ("!" for gusts/catfish, "⚡" for targeted lightning bolt)
        for (const tel of state.telegraphs) {
            const pulse = Math.floor(tel.timer * 10) % 2 === 0;
            const ty = LANE_Y[tel.lane];
            const isBolt = tel.kind === 'bolt';

            if (isBolt) {
                // Horizontal laser sightline for incoming thunder bolt
                ctx.fillStyle = pulse ? 'rgba(253, 224, 71, 0.32)' : 'rgba(245, 158, 11, 0.18)';
                ctx.fillRect(0, ty - 2, view.w - 24, 4);
            }

            ctx.fillStyle = isBolt
                ? (pulse ? '#FDE047' : '#F59E0B')
                : (pulse ? '#FB7185' : '#FDE047');
            ctx.fillRect(view.w - 26, ty - 12, 20, 24);
            ctx.strokeStyle = '#071024';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(view.w - 26, ty - 12, 20, 24);

            ctx.fillStyle = '#071024';
            ctx.font = '700 13px Mitr, Prompt, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(isBolt ? '⚡' : '!', view.w - 16, ty + 0.5);
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

            // Swooping bat lane-change telegraph arrow!
            if (item.kind === 'batSwoop' && item.swoopState === 'warning') {
                const dirDown = item.targetLane > item.lane;
                const arrowY = item.y + (dirDown ? 18 : -18);
                ctx.fillStyle = '#FDE047';
                ctx.font = '700 13px Mitr, sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(dirDown ? '▼' : '▲', item.x, arrowY);
            }
        }

        // Tiny Black Cat Companion (wears Cat-Bunny ears during Dream Fever!)
        const catSprite = isFever ? SPRITES.catBunny[animTick % 2] : SPRITES.cat[animTick % 2];
        const catOffset = Math.round(24 * view.spriteScale);
        drawSpriteScaled(catSprite, view.playerX - catOffset, state.catY);

        // Pixel Chibi L
        const invulnFlash = state.invulnTimer > 0 && Math.floor(state.invulnTimer * 10) % 2 === 0;
        const lW = Math.round(24 * view.spriteScale);
        const lH = Math.round(24 * view.spriteScale);

        if (!invulnFlash) {
            const lSprite = state.invulnTimer > INVULN_DURATION - 0.25
                ? SPRITES.lHurt
                : SPRITES.l[animTick % 4];
            ctx.save();
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
            ctx.fillStyle = `rgba(251, 113, 133, ${(state.hitFlashTimer * 1.4).toFixed(2)})`;
            ctx.fillRect(0, 0, view.w, view.h);
        }

        // Particles
        for (const p of state.particles) {
            ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
            ctx.fillStyle = p.color;
            ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);
        }
        ctx.globalAlpha = 1;

        // Crisp Thai Floating Popups (high-DPI rendered!)
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

        // Crisp Thai Chapter / Fever Banner
        if (state.bannerTimer > 0 && state.bannerText) {
            const alpha = Math.min(1, state.bannerTimer * 1.5);
            const padX = view.isCompact ? 14 : 44;
            const bw = view.w - padX * 2;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = 'rgba(7, 16, 36, 0.86)';
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
        if (guideDialog && guideDialog.open) {
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
    if (playAgainBtn) playAgainBtn.addEventListener('click', startGame);
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

    /* ============ FORM VALIDATION (THAI MESSAGES) ============ */
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
            const cleaned = playerNameInput.value
                .replace(/[\u0000-\u001F\u007F]/g, '')
                .replace(/\s+/g, ' ')
                .trim();
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

    /* ============ LEADERBOARD CLIENT & LOCAL FALLBACK ============ */
    function readLocalEntries() {
        try {
            const raw = JSON.parse(localStorage.getItem(LOCAL_LB_KEY) || '[]');
            return Array.isArray(raw) ? raw : [];
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
        list.push(entry);
        list.sort((a, b) => b.score - a.score);
        const ranked = list.slice(0, 25).map((item, idx) => ({
            ...item,
            rank: idx + 1,
        }));
        writeLocalEntries(ranked);
        const found = ranked.find((item) => item.id === entry.id);
        return {
            entries: ranked,
            rank: found ? found.rank : null,
        };
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

            const nameEl = document.createElement('span');
            nameEl.className = 'lb-name';
            nameEl.textContent = entry.name || 'นักบินนิรนาม';

            const metaEl = document.createElement('span');
            metaEl.className = 'lb-meta';
            const seasonTag = entry.season ? `รอบ ${entry.season}` : 'รอบ 1';
            const chapterTag = getThaiChapterName(entry.chapter);
            const comboTag = Number(entry.maxCombo) > 0 ? ` · คอมโบ ${entry.maxCombo}` : '';
            metaEl.textContent = `${seasonTag} ${chapterTag}${comboTag}`;

            pilotEl.append(nameEl, metaEl);

            const scoreEl = document.createElement('span');
            scoreEl.className = 'lb-score';
            scoreEl.textContent = Number(entry.score || 0).toLocaleString('en');

            li.append(rankEl, pilotEl, scoreEl);
            return li;
        });

        lbList.replaceChildren(...nodes);
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
            if (state.lastSubmittedRun) return;

            if (typeof scoreForm.syncValidityAndAria === 'function') {
                scoreForm.syncValidityAndAria();
            }

            if (!playerNameInput.checkValidity()) {
                playerNameInput.focus();
                return;
            }

            const cleanName = playerNameInput.value
                .replace(/[\u0000-\u001F\u007F]/g, '')
                .replace(/[<>]/g, '')
                .replace(/\s+/g, ' ')
                .trim();

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
                chapter: CHAPTERS[state.chapterIdx].apiName, // Keeps API compatibility
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
                        const rankLabel = data.rank ? ` (อันดับที่ #${data.rank} ออนไลน์)` : '';
                        submitStatus.textContent = `บันทึกคะแนนของ ${cleanName} เรียบร้อยแล้ว!${rankLabel}`;
                        submitStatus.className = 'submit-status is-success';
                    }
                    return;
                }

                if (res.status === 400 || res.status === 429) {
                    if (submitScoreBtn) submitScoreBtn.disabled = false;
                    if (submitStatus) {
                        submitStatus.textContent = res.status === 429
                            ? 'ส่งคะแนนถี่เกินไป กรุณารอสักครู่แล้วลองใหม่'
                            : 'ไม่สามารถบันทึกคะแนนได้ กรุณาตรวจสอบชื่ออีกครั้ง';
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
                state.lastSubmittedId = fallbackEntry.id;
                setLeaderboardMode('local');
                renderLeaderboard(savedLocal.entries);
                if (submitStatus) {
                    const rankText = savedLocal.rank ? ` (อันดับ #${savedLocal.rank} ในเครื่องนี้)` : '';
                    submitStatus.textContent = `บันทึกคะแนนของ ${cleanName} ในเครื่องนี้แล้ว!${rankText}`;
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
                state.lastSubmittedId = fallbackEntry.id;
                setLeaderboardMode('local');
                renderLeaderboard(savedLocal.entries);
                if (submitStatus) {
                    const rankText = savedLocal.rank ? ` (อันดับ #${savedLocal.rank} ในเครื่องนี้)` : '';
                    submitStatus.textContent = `บันทึกคะแนนของ ${cleanName} ในเครื่องนี้แล้ว!${rankText}`;
                    submitStatus.className = 'submit-status is-success';
                }
            }
        });
    }

    loadLeaderboard();
})();
