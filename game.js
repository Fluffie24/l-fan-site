(() => {
    'use strict';

    const VIRTUAL_W = 480;
    const VIRTUAL_H = 270;
    const LANE_Y = [74, 138, 202];
    const PLAYER_X = 96;
    const CHAPTER_DURATION = 22;
    const FEVER_DURATION = 7.0;
    const INVULN_DURATION = 1.8;

    const PB_STORAGE_KEY = 'wataridori_pb_v1';
    const LOCAL_LB_KEY = 'wataridori_local_lb_v1';
    const AUDIO_PREF_KEY = 'wataridori_audio_v1';
    const LAST_NAME_KEY = 'wataridori_name_v1';

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const CHAPTERS = [
        {
            name: 'Midnight Station',
            skyTop: [9, 17, 40],
            skyMid: [18, 35, 74],
            skyBot: [28, 52, 98],
            lyric: '「暗闇の中で汽車を待つステーション」',
            endLyric: '「どこまで行けば 夜明けが見える？」',
            accent: '#38BDF8',
        },
        {
            name: 'Rough Ocean',
            skyTop: [10, 31, 56],
            skyMid: [15, 62, 88],
            skyBot: [20, 94, 118],
            lyric: '「いくつもの海流 荒波を越えて」',
            endLyric: '「渡り鳥たちに地図なんてない」',
            accent: '#22D3EE',
        },
        {
            name: 'Golden Sunset',
            skyTop: [54, 26, 87],
            skyMid: [185, 58, 128],
            skyBot: [245, 158, 11],
            lyric: '「故郷を覚えている 夕焼けの美しさ」',
            endLyric: '「今になってわかることがある」',
            accent: '#F472B6',
        },
        {
            name: 'Spring Dawn',
            skyTop: [3, 105, 161],
            skyMid: [56, 189, 248],
            skyBot: [251, 207, 232],
            lyric: '「僕たちは ずっと夢を見続ける」',
            endLyric: '「心の羽根 決してやめはしない」',
            accent: '#FBBF24',
        },
    ];

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
            h: '#161522', // hair dark
            d: '#2A2840', // hair highlight
            f: '#F8FAFC', // feather / white collar
            c: '#BAE6FD', // feather / sky tint
            s: '#FDE1CE', // skin
            b: '#FDA4AF', // blush
            e: '#0F172A', // eyes
            w: '#FFFFFF', // eye glint / dress
            n: '#1E3A8A', // navy collar
            g: '#FBBF24', // gold trim
            k: '#38BDF8', // sky wing
            p: '#A78BFA', // purple wing
            v: '#7C3AED', // deep purple wing
            r: '#F43F5E', // hurt tint
        };

        // 24x24 Chibi L with 4 wing frames (up, mid, down, mid)
        const lHead = [
            '........hhhhhh..........',
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
        ];

        const lBodyMid = [
            '...kww..nwwgwwn..hh.....',
            '..kkww..nwwwwwm..hh.....',
            '..ppww..wwwwwww..hh.....',
            '...pp...nwwgwwn.........',
            '........wwwwwww.........',
            '........nwwwwwm.........',
            '.........ss.ss..........',
            '.........nn.nn..........',
        ].map((r) => r.replace(/m/g, 'n'));

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

        void lHead;
        void lBodyMid;

        // Tiny Black Cat (14x12) + Fever Cat-Bunny (14x16)
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

        // Collectibles
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

        // Hazards
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

        const bat0 = bakeSprite([
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
        ], { d: '#312E81', r: '#FB7185' });

        const bat1 = bakeSprite([
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
        ], { d: '#312E81', r: '#FB7185' });

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
            catfish: [catfish0, catfish1],
        };
    }

    const SPRITES = createSpriteAtlas();

    /* ============ SYNTHESIZED CHIPTUNE SFX ============ */
    let audioCtx = null;
    let sfxEnabled = true;

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

    function playSfx(kind) {
        if (!sfxEnabled) return;
        switch (kind) {
            case 'move':
                playTone(420, 0.06, 'triangle', 0.05, 580);
                break;
            case 'ring':
                playTone(660, 0.07, 'square', 0.055, null, 0);
                playTone(880, 0.09, 'square', 0.055, null, 0.05);
                break;
            case 'potato':
                playTone(523, 0.07, 'square', 0.06, null, 0);
                playTone(659, 0.07, 'square', 0.06, null, 0.05);
                playTone(784, 0.11, 'square', 0.065, null, 0.1);
                break;
            case 'heal':
                playTone(587, 0.08, 'triangle', 0.08, null, 0);
                playTone(784, 0.09, 'triangle', 0.08, null, 0.07);
                playTone(1046, 0.15, 'triangle', 0.08, null, 0.14);
                break;
            case 'hit':
                playTone(180, 0.18, 'sawtooth', 0.08, 70);
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
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    const hudBar = document.querySelector('.hud-bar');
    const hudHearts = document.getElementById('hud-hearts');
    const hudScore = document.getElementById('hud-score');
    const hudCombo = document.getElementById('hud-combo');
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

    /* ============ RENDER SPRITE PREVIEWS ============ */
    function renderStaticPreviews() {
        const heroPreview = document.getElementById('hero-sprite-preview');
        if (heroPreview) {
            const pctx = heroPreview.getContext('2d');
            pctx.imageSmoothingEnabled = false;
            pctx.clearRect(0, 0, heroPreview.width, heroPreview.height);
            pctx.drawImage(SPRITES.l[1], 18, 6, 60, 60);
            pctx.drawImage(SPRITES.cat[0], 82, 24, 36, 30);
            pctx.drawImage(SPRITES.ringSky, 118, 12, 20, 20);
        }

        const spriteMap = {
            hero: SPRITES.l[1],
            ring: SPRITES.ringSky,
            potato: SPRITES.potato,
            feather: SPRITES.feather,
            cloud: SPRITES.cloud,
            gust: SPRITES.gust,
            bat: SPRITES.bat[0],
            catfish: SPRITES.catfish[0],
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
        invulnTimer: 0,
        shakeTimer: 0,
        season: 1,
        chapterIdx: 0,
        prevChapterIdx: 0,
        chapterLerp: 1,
        playerLane: 1,
        playerY: LANE_Y[1],
        playerTilt: 0,
        catY: LANE_Y[1] + 8,
        scrollSpeed: 148,
        spawnTimer: 1.0,
        lastFeatherAt: -20,
        bannerText: '',
        bannerTimer: 0,
        bannerColor: '#38BDF8',
        afterimages: [],
        items: [],
        telegraphs: [],
        particles: [],
        popups: [],
        stars: Array.from({ length: 44 }, (_, i) => ({
            x: (i * 53) % VIRTUAL_W,
            y: 12 + ((i * 29) % 140),
            size: i % 5 === 0 ? 2 : 1,
            phase: i * 0.7,
        })),
        petals: Array.from({ length: 18 }, (_, i) => ({
            x: (i * 37) % VIRTUAL_W,
            y: (i * 19) % VIRTUAL_H,
            vx: -28 - (i % 4) * 9,
            vy: 14 + (i % 3) * 7,
        })),
        trainX: VIRTUAL_W + 40,
        waveOffset: 0,
        lastSubmittedRun: false,
        personalBest: 0,
        lastSubmittedId: null,
    };

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

    /* ============ GAME HELPERS & SPAWNER ============ */
    function setBanner(text, color = '#38BDF8', duration = 3.6) {
        state.bannerText = text;
        state.bannerColor = color;
        state.bannerTimer = duration;
    }

    function spawnParticles(x, y, color, count = 8, speed = 75) {
        const total = prefersReducedMotion ? Math.min(4, count) : count;
        for (let i = 0; i < total; i += 1) {
            const angle = (Math.PI * 2 * i) / total + (Math.random() - 0.5) * 0.4;
            const mag = speed * (0.45 + Math.random() * 0.65);
            state.particles.push({
                x,
                y,
                vx: Math.cos(angle) * mag,
                vy: Math.sin(angle) * mag,
                life: 0.42 + Math.random() * 0.25,
                maxLife: 0.65,
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

    function pushItem(kind, lane, offsetX = 0, extra = {}) {
        const sizes = {
            ring: { w: 14, h: 14 },
            potato: { w: 16, h: 16 },
            feather: { w: 14, h: 14 },
            cloud: { w: 28, h: 20 },
            gust: { w: 28, h: 14 },
            bat: { w: 20, h: 14 },
            catfish: { w: 22, h: 14 },
        };
        const box = sizes[kind] || { w: 16, h: 16 };
        state.items.push({
            kind,
            lane,
            x: VIRTUAL_W + 24 + offsetX,
            y: LANE_Y[lane],
            w: box.w,
            h: box.h,
            speedMul: extra.speedMul || 1,
            colorVariant: extra.colorVariant || (lane % 2),
            baseY: LANE_Y[lane],
            phase: Math.random() * Math.PI * 2,
            collected: false,
            jumpTimer: extra.jumpTimer || 0,
        });
    }

    function pickHazardForChapter(chIdx) {
        if (chIdx === 0) return Math.random() < 0.55 ? 'bat' : 'cloud';
        if (chIdx === 1) return Math.random() < 0.5 ? 'cloud' : 'bat';
        if (chIdx === 2) return Math.random() < 0.6 ? 'cloud' : 'bat';
        return Math.random() < 0.5 ? 'cloud' : 'bat';
    }

    function spawnWave() {
        const ch = state.chapterIdx;
        const speedRatio = (state.scrollSpeed - 148) / 140;
        const roll = Math.random();

        // Occasional Heart-Wing Feather if damaged
        const needsHeal = state.hp < state.maxHp && state.elapsed - state.lastFeatherAt >= 18;

        if (roll < 0.28) {
            // Pattern A: 1 hazard lane + 4 guiding Dream Rings in a safe lane
            const hazardLane = Math.floor(Math.random() * 3);
            const safeLanes = [0, 1, 2].filter((l) => l !== hazardLane);
            const ringLane = safeLanes[Math.floor(Math.random() * safeLanes.length)];

            pushItem(pickHazardForChapter(ch), hazardLane, 0);
            for (let i = 0; i < 4; i += 1) {
                pushItem('ring', ringLane, i * 28, { colorVariant: i % 2 });
            }
            if (needsHeal) {
                pushItem('feather', safeLanes[0], 112);
                state.lastFeatherAt = state.elapsed;
            }
            state.spawnTimer = Math.max(0.85, 1.32 - speedRatio * 0.34);
        } else if (roll < 0.56) {
            // Pattern B: Double Gate (2 hazards, 1 guaranteed safe lane) + Tornado Potato reward
            const safeLane = Math.floor(Math.random() * 3);
            const blocked = [0, 1, 2].filter((l) => l !== safeLane);
            pushItem(pickHazardForChapter(ch), blocked[0], 0);
            pushItem(pickHazardForChapter(ch), blocked[1], 10);
            pushItem('potato', safeLane, 12);
            pushItem('ring', safeLane, 44);
            if (needsHeal) {
                pushItem('feather', safeLane, 76);
                state.lastFeatherAt = state.elapsed;
            }
            state.spawnTimer = Math.max(0.95, 1.42 - speedRatio * 0.35);
        } else if (roll < 0.78) {
            // Pattern C: 3-Beat Slalom Wave across lanes
            const dir = Math.random() < 0.5 ? 1 : -1;
            const order = dir > 0 ? [0, 1, 2] : [2, 1, 0];
            order.forEach((safe, step) => {
                const off = step * 94;
                const hazardLane = (safe + 1) % 3;
                pushItem(pickHazardForChapter(ch), hazardLane, off);
                pushItem('ring', safe, off + 6, { colorVariant: step % 2 });
            });
            pushItem('potato', order[2], 2 * 94 + 34);
            state.spawnTimer = Math.max(1.25, 1.85 - speedRatio * 0.4);
        } else if (roll < 0.9 || ch !== 1) {
            // Pattern D: Fast Headwind Gust with fair 0.55s edge telegraph
            const gustLane = Math.floor(Math.random() * 3);
            const safeLane = (gustLane + 1 + Math.floor(Math.random() * 2)) % 3;
            state.telegraphs.push({
                lane: gustLane,
                timer: 0.55,
                kind: 'gust',
            });
            for (let i = 0; i < 3; i += 1) {
                pushItem('ring', safeLane, i * 30, { colorVariant: i % 2 });
            }
            state.spawnTimer = Math.max(0.9, 1.38 - speedRatio * 0.32);
        } else {
            // Pattern E: Rough Ocean Leaping Catfish into Lower Lane (Ch.2)
            state.telegraphs.push({
                lane: 2,
                timer: 0.55,
                kind: 'catfish',
            });
            pushItem('ring', 0, 10, { colorVariant: 0 });
            pushItem('ring', 1, 42, { colorVariant: 1 });
            pushItem('potato', 1, 76);
            state.spawnTimer = Math.max(0.95, 1.4 - speedRatio * 0.32);
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
        if (hudHearts) {
            const pips = hudHearts.querySelectorAll('.heart-pip');
            pips.forEach((pip, idx) => {
                pip.classList.toggle('is-full', idx < state.hp);
            });
            hudHearts.setAttribute('aria-label', `${state.hp} of ${state.maxHp} wings remaining`);
        }

        const isFever = state.feverTimer > 0;
        const pct = isFever
            ? Math.ceil((state.feverTimer / FEVER_DURATION) * 100)
            : Math.min(100, Math.floor(state.fever));

        if (hudFeverFill) hudFeverFill.style.width = `${pct}%`;
        if (hudFeverLabel) hudFeverLabel.textContent = isFever ? `FEVER ${state.feverTimer.toFixed(1)}s` : `${pct}%`;
        if (hudFeverBar) hudFeverBar.setAttribute('aria-valuenow', String(pct));
        if (hudBar) hudBar.classList.toggle('is-fever', isFever);

        if (hudChapter) {
            hudChapter.textContent = `S${state.season} · ${CHAPTERS[state.chapterIdx].name}`;
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
        state.invulnTimer = 0;
        state.shakeTimer = 0;
        state.season = 1;
        state.chapterIdx = 0;
        state.prevChapterIdx = 0;
        state.chapterLerp = 1;
        state.playerLane = 1;
        state.playerY = LANE_Y[1];
        state.playerTilt = 0;
        state.catY = LANE_Y[1] + 8;
        state.scrollSpeed = 148;
        state.spawnTimer = 0.75;
        state.lastFeatherAt = -20;
        state.afterimages = [];
        state.items = [];
        state.telegraphs = [];
        state.particles = [];
        state.popups = [];
        state.lastSubmittedRun = false;

        setBanner(CHAPTERS[0].lyric, CHAPTERS[0].accent, 3.8);
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
        if (finalChapterEl) finalChapterEl.textContent = CHAPTERS[state.chapterIdx].name;
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
            state.playerLane = nextLane;
            state.playerTilt = delta * 0.25;
            playSfx('move');
        }
    }

    function setLaneDirect(targetLane) {
        if (state.mode !== 'playing') return;
        const clamped = Math.max(0, Math.min(2, targetLane));
        if (clamped !== state.playerLane) {
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
        state.waveOffset += dt * 48;

        // Escalate scroll speed gently over time
        state.scrollSpeed = Math.min(290, 148 + state.elapsed * 1.45 + (state.season - 1) * 18);

        // Chapter progression every 22s
        const totalChaptersPassed = Math.floor(state.elapsed / CHAPTER_DURATION);
        const nextSeason = Math.floor(totalChaptersPassed / CHAPTERS.length) + 1;
        const nextChapterIdx = totalChaptersPassed % CHAPTERS.length;

        if (nextSeason !== state.season) {
            state.season = nextSeason;
            const bonus = 500 * (state.season - 1);
            state.score += bonus;
            spawnPopup(PLAYER_X + 20, state.playerY - 24, `CONTINENT +${bonus}`, '#FDE047');
        }

        if (nextChapterIdx !== state.chapterIdx) {
            state.prevChapterIdx = state.chapterIdx;
            state.chapterIdx = nextChapterIdx;
            state.chapterLerp = 0;
            playSfx('chapter');
            setBanner(CHAPTERS[nextChapterIdx].lyric, CHAPTERS[nextChapterIdx].accent, 3.8);
        }

        if (state.chapterLerp < 1) {
            state.chapterLerp = Math.min(1, state.chapterLerp + dt / 2.4);
        }

        if (state.bannerTimer > 0) {
            state.bannerTimer = Math.max(0, state.bannerTimer - dt);
        }

        if (state.invulnTimer > 0) {
            state.invulnTimer = Math.max(0, state.invulnTimer - dt);
        }

        if (state.shakeTimer > 0) {
            state.shakeTimer = Math.max(0, state.shakeTimer - dt);
        }

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
        state.distanceScoreAcc += dt * (28 + state.season * 4) * feverMult;
        if (state.distanceScoreAcc >= 1) {
            const pts = Math.floor(state.distanceScoreAcc);
            state.score += pts;
            state.distanceScoreAcc -= pts;
        }

        // Smooth lane movement & Black Cat spring follow
        const targetY = LANE_Y[state.playerLane];
        const yDiff = targetY - state.playerY;
        state.playerY += yDiff * Math.min(1, dt * 16);
        state.playerTilt *= Math.pow(0.05, dt);
        state.catY += (state.playerY + 8 - state.catY) * Math.min(1, dt * 8);

        // Afterimages during Dream Fever
        if (isFever && !prefersReducedMotion && Math.random() < 0.45) {
            state.afterimages.push({
                x: PLAYER_X,
                y: state.playerY,
                life: 0.24,
            });
        }
        state.afterimages = state.afterimages.filter((a) => {
            a.x -= state.scrollSpeed * 0.45 * dt;
            a.life -= dt;
            return a.life > 0;
        });

        // Background train & sakura petals
        state.trainX -= 46 * dt;
        if (state.trainX < -160) {
            state.trainX = VIRTUAL_W + 60;
        }
        for (const petal of state.petals) {
            petal.x += petal.vx * dt;
            petal.y += petal.vy * dt;
            if (petal.x < -8 || petal.y > VIRTUAL_H + 8) {
                petal.x = VIRTUAL_W + Math.random() * 40;
                petal.y = Math.random() * 180;
            }
        }

        // Spawn waves & resolve telegraphs
        state.spawnTimer -= dt;
        if (state.spawnTimer <= 0) {
            spawnWave();
        }

        const nextTelegraphs = [];
        for (const tel of state.telegraphs) {
            tel.timer -= dt;
            if (tel.timer <= 0) {
                if (tel.kind === 'gust') {
                    pushItem('gust', tel.lane, 0, { speedMul: 1.48 });
                } else if (tel.kind === 'catfish') {
                    pushItem('catfish', 2, 0, { speedMul: 1.12, jumpTimer: 0.1 });
                }
            } else {
                nextTelegraphs.push(tel);
            }
        }
        state.telegraphs = nextTelegraphs;

        // Move items & resolve collisions
        const playerBox = { x: PLAYER_X - 9, y: state.playerY - 9, w: 18, h: 18 };
        const surviving = [];

        for (const item of state.items) {
            item.x -= state.scrollSpeed * item.speedMul * dt;

            if (item.kind === 'bat') {
                item.y = item.baseY + Math.sin(state.elapsed * 7 + item.phase) * 7;
            } else if (item.kind === 'catfish') {
                item.jumpTimer += dt;
                const arc = Math.abs(Math.sin(item.jumpTimer * 4.2)) * 26;
                item.y = LANE_Y[2] + 18 - arc;
            } else if (isFever && (item.kind === 'ring' || item.kind === 'potato')) {
                const dx = PLAYER_X - item.x;
                const dy = state.playerY - item.y;
                if (Math.abs(dx) < 110 && Math.abs(dy) < 95) {
                    item.x += dx * Math.min(1, dt * 6);
                    item.y += dy * Math.min(1, dt * 6);
                }
            }

            if (item.x < -48) continue;

            const isCollectible = item.kind === 'ring' || item.kind === 'potato' || item.kind === 'feather';
            const pad = isCollectible ? 4 : -4;
            const halfW = item.w / 2 + pad;
            const halfH = item.h / 2 + pad;

            const hit =
                playerBox.x < item.x + halfW &&
                playerBox.x + playerBox.w > item.x - halfW &&
                playerBox.y < item.y + halfH &&
                playerBox.y + playerBox.h > item.y - halfH;

            if (!hit) {
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
                    if (!isFever) state.fever = Math.min(100, state.fever + 10);
                    spawnParticles(item.x, item.y, item.colorVariant === 0 ? '#38BDF8' : '#A78BFA', 7);
                    spawnPopup(item.x, item.y - 10, `+${pts}`, '#7DD3FC');
                    playSfx('ring');
                } else if (item.kind === 'potato') {
                    const pts = 300 * comboMult * feverMult;
                    state.score += pts;
                    if (!isFever) state.fever = Math.min(100, state.fever + 22);
                    spawnParticles(item.x, item.y, '#FBBF24', 10);
                    spawnPopup(item.x, item.y - 12, `POTATO +${pts}`, '#FDE047');
                    playSfx('potato');
                } else if (item.kind === 'feather') {
                    if (state.hp < state.maxHp) {
                        state.hp += 1;
                        spawnPopup(item.x, item.y - 12, '+1 WING HP', '#F472B6');
                    } else {
                        const pts = 400 * feverMult;
                        state.score += pts;
                        spawnPopup(item.x, item.y - 12, `+${pts}`, '#F472B6');
                    }
                    spawnParticles(item.x, item.y, '#F472B6', 10);
                    playSfx('heal');
                }

                if (!isFever && state.fever >= 100) {
                    state.fever = 100;
                    state.feverTimer = FEVER_DURATION;
                    playSfx('fever');
                    setBanner('DREAM FEVER! CAT-BUNNY POWER x2', '#F472B6', 2.8);
                    spawnParticles(PLAYER_X, state.playerY, '#FDE047', 16, 110);
                }
            } else if (isFever) {
                const pts = 100;
                state.score += pts;
                spawnParticles(item.x, item.y, '#38BDF8', 10, 95);
                spawnPopup(item.x, item.y - 10, `CLEAR +${pts}`, '#FDE047');
                playSfx('ring');
            } else if (state.invulnTimer <= 0) {
                state.hp -= 1;
                state.combo = 0;
                state.invulnTimer = INVULN_DURATION;
                state.shakeTimer = prefersReducedMotion ? 0 : 0.25;
                spawnParticles(PLAYER_X, state.playerY, '#FB7185', 12, 95);
                spawnPopup(PLAYER_X, state.playerY - 14, 'OUCH!', '#FB7185');
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
            pop.y -= 24 * dt;
            pop.life -= dt;
            return pop.life > 0;
        });

        updateHud();
    }

    /* ============ RENDERER ============ */
    function lerpColor(a, b, t) {
        const r = Math.round(a[0] + (b[0] - a[0]) * t);
        const g = Math.round(a[1] + (b[1] - a[1]) * t);
        const bl = Math.round(a[2] + (b[2] - a[2]) * t);
        return `rgb(${r}, ${g}, ${bl})`;
    }

    function drawBackground() {
        const prevCh = CHAPTERS[state.prevChapterIdx];
        const currCh = CHAPTERS[state.chapterIdx];
        const t = state.chapterLerp;

        const topCol = lerpColor(prevCh.skyTop, currCh.skyTop, t);
        const midCol = lerpColor(prevCh.skyMid, currCh.skyMid, t);
        const botCol = lerpColor(prevCh.skyBot, currCh.skyBot, t);

        const grad = ctx.createLinearGradient(0, 0, 0, VIRTUAL_H);
        grad.addColorStop(0, topCol);
        grad.addColorStop(0.58, midCol);
        grad.addColorStop(1, botCol);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, VIRTUAL_W, VIRTUAL_H);

        // Stars (stronger in Midnight Station & Sunset)
        const starAlpha = state.chapterIdx === 0 ? 0.9 : state.chapterIdx === 2 ? 0.45 : 0.25;
        for (const s of state.stars) {
            const twinkle = prefersReducedMotion ? 1 : 0.65 + 0.35 * Math.sin(state.elapsed * 3 + s.phase);
            ctx.fillStyle = `rgba(240, 249, 255, ${(starAlpha * twinkle).toFixed(2)})`;
            ctx.fillRect(Math.floor(s.x), Math.floor(s.y), s.size, s.size);
        }

        // Chapter-specific pixel scenery
        if (state.chapterIdx === 0) {
            // Distant station platform & passing night train
            ctx.fillStyle = '#0A1228';
            ctx.fillRect(0, 238, VIRTUAL_W, 32);
            ctx.fillStyle = '#1E293B';
            ctx.fillRect(0, 236, VIRTUAL_W, 2);

            const tx = Math.floor(state.trainX);
            ctx.fillStyle = '#172554';
            ctx.fillRect(tx, 242, 132, 18);
            ctx.fillStyle = '#38BDF8';
            ctx.fillRect(tx, 244, 132, 2);
            ctx.fillStyle = '#FDE047';
            for (let wx = 8; wx < 120; wx += 14) {
                ctx.fillRect(tx + wx, 248, 8, 6);
            }
        } else if (state.chapterIdx === 1) {
            // Rough Ocean waves + diagonal rain
            ctx.fillStyle = 'rgba(186, 230, 253, 0.25)';
            for (let i = 0; i < 14; i += 1) {
                const rx = ((i * 41 - state.elapsed * 160) % VIRTUAL_W + VIRTUAL_W) % VIRTUAL_W;
                const ry = ((i * 29 + state.elapsed * 180) % 210);
                ctx.fillRect(Math.floor(rx), Math.floor(ry), 2, 7);
            }
            ctx.fillStyle = '#0C4A6E';
            ctx.fillRect(0, 242, VIRTUAL_W, 28);
            ctx.fillStyle = '#38BDF8';
            for (let wx = 0; wx < VIRTUAL_W; wx += 16) {
                const crest = Math.round(Math.sin(wx * 0.08 + state.waveOffset * 0.14) * 3);
                ctx.fillRect(wx, 240 + crest, 10, 3);
            }
        } else if (state.chapterIdx === 2) {
            // Golden Sunset pixel disc + distant V-birds
            ctx.fillStyle = '#FCD34D';
            ctx.fillRect(356, 152, 44, 44);
            ctx.fillStyle = '#F97316';
            ctx.fillRect(352, 174, 52, 12);
            ctx.fillStyle = 'rgba(254, 240, 138, 0.28)';
            ctx.fillRect(0, 232, VIRTUAL_W, 38);

            ctx.fillStyle = '#1E1B4B';
            for (let b = 0; b < 4; b += 1) {
                const bx = Math.floor(((340 + b * 24 - state.elapsed * 14) % VIRTUAL_W + VIRTUAL_W) % VIRTUAL_W);
                const by = 56 + b * 11;
                ctx.fillRect(bx, by, 3, 1);
                ctx.fillRect(bx + 3, by + 1, 2, 1);
                ctx.fillRect(bx + 5, by, 3, 1);
            }
        } else {
            // Spring Dawn continent cliffs + drifting sakura petals
            ctx.fillStyle = '#1E3A8A';
            ctx.fillRect(0, 246, VIRTUAL_W, 24);
            ctx.fillStyle = '#3B82F6';
            ctx.fillRect(310, 234, 170, 16);
            ctx.fillStyle = '#FBCFE8';
            for (const p of state.petals) {
                ctx.fillRect(Math.floor(p.x), Math.floor(p.y), 3, 2);
            }
        }

        // Subtle 3-lane dotted flight paths
        for (let lane = 0; lane < 3; lane += 1) {
            const ly = LANE_Y[lane];
            const isActive = state.mode === 'playing' && lane === state.playerLane;
            ctx.fillStyle = isActive ? 'rgba(125, 211, 252, 0.34)' : 'rgba(224, 242, 254, 0.14)';
            for (let dx = 12; dx < VIRTUAL_W; dx += 20) {
                ctx.fillRect(dx, ly, isActive ? 8 : 5, 1);
            }
        }
    }

    function drawGame() {
        ctx.save();
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
            ctx.drawImage(SPRITES.l[1], Math.round(ghost.x - 12), Math.round(ghost.y - 12));
        }
        ctx.globalAlpha = 1;

        // Telegraphs (edge warning markers)
        for (const tel of state.telegraphs) {
            const pulse = Math.floor(tel.timer * 8) % 2 === 0;
            const ty = LANE_Y[tel.lane];
            ctx.fillStyle = pulse ? '#FB7185' : '#FDE047';
            ctx.fillRect(VIRTUAL_W - 22, ty - 9, 16, 18);
            ctx.fillStyle = '#081024';
            ctx.font = 'bold 12px Silkscreen, monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('!', VIRTUAL_W - 14, ty);
        }

        // Items & hazards
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
            } else if (item.kind === 'catfish') {
                sprite = SPRITES.catfish[animTick % 2];
            }

            ctx.drawImage(sprite, Math.round(item.x - sprite.width / 2), Math.round(item.y - sprite.height / 2));
        }

        // Tiny Black Cat Companion (wears Cat-Bunny ears in Fever!)
        const catSprite = isFever ? SPRITES.catBunny[animTick % 2] : SPRITES.cat[animTick % 2];
        ctx.drawImage(catSprite, PLAYER_X - 30, Math.round(state.catY - catSprite.height / 2));

        // Pixel Chibi L
        const invulnFlash = state.invulnTimer > 0 && Math.floor(state.invulnTimer * 4) % 2 === 0;
        if (!invulnFlash) {
            const lSprite = state.invulnTimer > INVULN_DURATION - 0.3
                ? SPRITES.lHurt
                : SPRITES.l[animTick % 4];
            ctx.save();
            ctx.translate(PLAYER_X, Math.round(state.playerY));
            ctx.rotate(state.playerTilt);
            if (isFever) {
                ctx.strokeStyle = 'rgba(253, 224, 71, 0.75)';
                ctx.lineWidth = 1.5;
                ctx.strokeRect(-14, -14, 28, 28);
            }
            ctx.drawImage(lSprite, -12, -12);
            ctx.restore();
        } else {
            ctx.globalAlpha = 0.45;
            ctx.drawImage(SPRITES.lHurt, PLAYER_X - 12, Math.round(state.playerY - 12));
            ctx.globalAlpha = 1;
        }

        // Particles
        for (const p of state.particles) {
            ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
            ctx.fillStyle = p.color;
            ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);
        }
        ctx.globalAlpha = 1;

        // Floating Score Popups
        ctx.font = 'bold 9px Silkscreen, monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        for (const pop of state.popups) {
            ctx.globalAlpha = Math.max(0, pop.life / pop.maxLife);
            ctx.fillStyle = '#081024';
            ctx.fillText(pop.text, Math.round(pop.x) + 1, Math.round(pop.y) + 1);
            ctx.fillStyle = pop.color;
            ctx.fillText(pop.text, Math.round(pop.x), Math.round(pop.y));
        }
        ctx.globalAlpha = 1;

        // Chapter Lyric Banner
        if (state.bannerTimer > 0 && state.bannerText) {
            const alpha = Math.min(1, state.bannerTimer * 1.4);
            ctx.globalAlpha = alpha;
            ctx.fillStyle = 'rgba(8, 16, 36, 0.78)';
            ctx.fillRect(58, 10, VIRTUAL_W - 116, 22);
            ctx.strokeStyle = state.bannerColor;
            ctx.lineWidth = 1;
            ctx.strokeRect(58.5, 10.5, VIRTUAL_W - 117, 21);
            ctx.fillStyle = '#F0F9FF';
            ctx.font = '600 10px Prompt, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(state.bannerText, VIRTUAL_W / 2, 21);
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
            state.playerY = LANE_Y[1] + Math.sin(state.elapsed * 2.4) * 4;
            state.catY = state.playerY + 8;
        } else {
            updateGame(dt);
        }

        drawGame();
        requestAnimationFrame(frameLoop);
    }
    requestAnimationFrame(frameLoop);

    /* ============ INPUT & CONTROLS ============ */
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

    // Canvas pointer tap / swipe
    let pointerStartY = null;
    let swipedThisGesture = false;

    canvas.addEventListener('pointerdown', (event) => {
        if (state.mode !== 'playing') return;
        pointerStartY = event.clientY;
        swipedThisGesture = false;
    });

    canvas.addEventListener('pointermove', (event) => {
        if (state.mode !== 'playing' || pointerStartY === null || swipedThisGesture) return;
        const dy = event.clientY - pointerStartY;
        if (Math.abs(dy) >= 20) {
            swipedThisGesture = true;
            moveLane(dy < 0 ? -1 : 1);
        }
    });

    canvas.addEventListener('pointerup', (event) => {
        if (state.mode !== 'playing') {
            pointerStartY = null;
            return;
        }
        if (!swipedThisGesture) {
            const rect = canvas.getBoundingClientRect();
            const scale = Math.min(rect.width / VIRTUAL_W, rect.height / VIRTUAL_H);
            const drawnH = VIRTUAL_H * scale;
            const offsetY = (rect.height - drawnH) / 2;
            const relY = (event.clientY - rect.top - offsetY) / Math.max(1, drawnH);
            if (relY < 0.36) setLaneDirect(0);
            else if (relY < 0.68) setLaneDirect(1);
            else setLaneDirect(2);
        }
        pointerStartY = null;
        swipedThisGesture = false;
    });

    canvas.addEventListener('pointercancel', () => {
        pointerStartY = null;
        swipedThisGesture = false;
    });

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

    /* ============ FORM VALIDATION (VALIDATE-INPUT-AFTER-INTERACTION) ============ */
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
                playerNameInput.setCustomValidity('Please enter a name (1–18 characters).');
            } else if (/[<>]/.test(playerNameInput.value)) {
                playerNameInput.setCustomValidity('Name cannot contain < or >.');
            } else if (Array.from(cleaned).length > 18) {
                playerNameInput.setCustomValidity('Maximum 18 characters.');
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
            lbModeBadge.textContent = 'LIVE GLOBAL';
            lbModeBadge.className = 'lb-mode-badge is-global';
            if (lbSetupNote) lbSetupNote.hidden = true;
        } else {
            lbModeBadge.textContent = 'LOCAL DEVICE';
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
            if (lbStatusMsg) lbStatusMsg.textContent = 'No flights recorded yet. Be the first to soar!';
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
            nameEl.textContent = entry.name || 'Pilot';

            const metaEl = document.createElement('span');
            metaEl.className = 'lb-meta';
            const seasonTag = entry.season ? `S${entry.season}` : 'S1';
            const chapterTag = entry.chapter || 'Midnight Station';
            const comboTag = Number(entry.maxCombo) > 0 ? ` · ${entry.maxCombo} combo` : '';
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
                submitStatus.textContent = 'Saving your flight...';
                submitStatus.className = 'submit-status';
            }

            const payload = {
                name: cleanName,
                score: Math.max(1, Math.floor(state.score)),
                maxCombo: state.maxCombo,
                season: state.season,
                chapter: CHAPTERS[state.chapterIdx].name,
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
                        const rankLabel = data.rank ? ` (Global Rank #${data.rank})` : '';
                        submitStatus.textContent = `Score saved for ${cleanName}!${rankLabel}`;
                        submitStatus.className = 'submit-status is-success';
                    }
                    return;
                }

                if (res.status === 400 || res.status === 429) {
                    if (submitScoreBtn) submitScoreBtn.disabled = false;
                    if (submitStatus) {
                        submitStatus.textContent = data?.error || 'Could not save score. Please check your name.';
                        submitStatus.className = 'submit-status is-error';
                    }
                    return;
                }

                // Fallback to local device storage when API isn't configured or offline
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
                    const rankText = savedLocal.rank ? ` (Device Rank #${savedLocal.rank})` : '';
                    submitStatus.textContent = `Saved on this device for ${cleanName}!${rankText}`;
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
                    const rankText = savedLocal.rank ? ` (Device Rank #${savedLocal.rank})` : '';
                    submitStatus.textContent = `Saved on this device for ${cleanName}!${rankText}`;
                    submitStatus.className = 'submit-status is-success';
                }
            }
        });
    }

    loadLeaderboard();
})();
