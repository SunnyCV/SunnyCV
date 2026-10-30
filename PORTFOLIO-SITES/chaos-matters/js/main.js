/* ==========================================================
   Chaos Matters — the conductor
   Runs the timeline: loading bar → sketch → eagle → nuclear
   blast → static → test card → the oil-slick dream, where the
   title drifts with its rooms circling it.
   ========================================================== */

(() => {
    const ROOMS = [
        'Velvet Gravity', 'Teeth of the Moon', 'Static Lullaby', 'Inside the Inkwell',
        'Seventeen Suns', 'The Weight of Feathers', 'Echoes for Rent', 'Paper Thunder'
    ];

    // the score, in seconds from the moment the loading bar finishes
    const T = { draw: 0.6, slow: 1.7, birds: 2.2, smoke: 6.0, flutters: 8.1, wash: 10.6,
                eagle: 12.4, enter: 13.0, release: 15.8, fall: 2.4 };
    T.impact = T.release + T.fall;
    // after impact
    const A = { loss: 8.4, static: 8.6, bars: 12.0, standby: 12.7, melt: 14.8, title: 18.6, rooms: 20.2, done: 22.8 };

    const $ = s => document.querySelector(s);
    const body = document.body;
    const stage = $('#stage'), glCanvas = $('#gl'), loader = $('#loader'), menu = $('#menu');
    const standby = $('#standby'), skipBtn = $('#skip'), toast = $('#toast');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

    let svg, paper, snapshot = null;
    let phase = 'loading', t0 = 0, last = 0, clock = 0;
    let cues = [], state = {}, impactAt = Infinity, center = [0.5, 0.5], zoom = 1;
    const mouse = [0.5, 0.5], pointer = [0.5, 0.5], lastPointer = [0.5, 0.5];
    let pointerActive = false, ripple = [0.5, 0.5, 99];
    let glScale = 1, roomsOn = false, hot = -1, hotAmt = 0;
    const hotPos = [0.5, 0.5];

    const title = { pos: [0.5, 0.5], vel: [0, 0], size: [0.5, 0.2], aspect: 0.5, drag: false, grab: [0, 0], hist: [] };
    const rooms = [];   // { li, a, label, x, y, w, h }

    /* ---------- paper ---------- */
    function makePaper() {
        const c = document.createElement('canvas');
        c.width = c.height = 360;
        const x = c.getContext('2d');
        x.fillStyle = '#f3efe6';
        x.fillRect(0, 0, 360, 360);
        for (let i = 0; i < 9000; i++) {
            const d = Math.random() < 0.5;
            x.fillStyle = d ? `rgba(90,70,40,${Math.random() * 0.07})` : `rgba(255,255,255,${Math.random() * 0.25})`;
            x.fillRect(Math.random() * 360, Math.random() * 360, 1, 1);
        }
        x.lineWidth = 0.6;
        for (let i = 0; i < 120; i++) {
            const px = Math.random() * 360, py = Math.random() * 360, a = Math.random() * Math.PI;
            x.strokeStyle = `rgba(120,100,70,${0.03 + Math.random() * 0.04})`;
            x.beginPath();
            x.moveTo(px, py);
            x.quadraticCurveTo(px + Math.cos(a) * 8, py + Math.sin(a) * 8 + 3, px + Math.cos(a) * 16, py + Math.sin(a) * 16);
            x.stroke();
        }
        document.documentElement.style.setProperty('--grain', `url(${c.toDataURL()})`);
        return c;
    }

    /* a tile of TV static that the room names are filled with when they glitch */
    function makeStatic() {
        const c = document.createElement('canvas');
        c.width = c.height = 96;
        const x = c.getContext('2d'), img = x.createImageData(96, 96);
        for (let i = 0; i < img.data.length; i += 4) {
            const v = 120 + Math.random() * 135;
            img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
            img.data[i + 3] = 255;
        }
        x.putImageData(img, 0, 0);
        document.documentElement.style.setProperty('--static', `url(${c.toDataURL()})`);
    }

    function pickGlScale() {
        const dpr = Math.min(devicePixelRatio || 1, 1.5);
        const budget = 2.4e6, px = innerWidth * innerHeight * dpr * dpr;
        glScale = px > budget ? dpr * Math.sqrt(budget / px) : dpr;
        Screen.resize(glScale);
    }

    /* ---------- the title, painted into a texture for the shader ---------- */
    function makeTitle() {
        const fs = 220, lh = fs * 0.86, pad = 40;
        const c = document.createElement('canvas'), x = c.getContext('2d');
        const font = `800 ${fs}px Syne, 'Helvetica Neue', Arial, sans-serif`;
        x.font = font;
        if ('letterSpacing' in x) x.letterSpacing = '-4px';
        const w = Math.max(x.measureText('CHAOS').width, x.measureText('MATTERS').width);
        c.width = Math.ceil(w + pad * 2);
        c.height = Math.ceil(lh * 2 + pad * 2);
        x.font = font;
        if ('letterSpacing' in x) x.letterSpacing = '-4px';
        x.fillStyle = '#fff';
        x.textAlign = 'center';
        x.textBaseline = 'middle';
        x.fillText('CHAOS', c.width / 2, pad + lh * 0.5 + 8);
        x.fillText('MATTERS', c.width / 2, pad + lh * 1.5 + 4);
        title.aspect = c.height / c.width;
        Screen.setTitle(c);
        sizeTitle();
    }

    const wide = () => innerWidth > 760;

    function sizeTitle() {
        const wPx = wide() ? Math.min(innerWidth * 0.42, 760) : innerWidth * 0.7;
        title.size = [wPx / innerWidth, wPx * title.aspect / innerHeight];
    }

    // where the title would like to drift: a slow loop that leaves room for its orbit of rooms
    function wander(t) {
        const mx = wide() ? 0.2 : 0.05, my = wide() ? 0.17 : 0.24;
        const ax = Math.max(0, 0.5 - title.size[0] / 2 - mx), ay = Math.max(0, 0.5 - title.size[1] / 2 - my);
        return [0.5 + ax * (0.7 * Math.sin(t * 0.13) + 0.3 * Math.sin(t * 0.31 + 1)),
                0.5 + ay * (0.6 * Math.sin(t * 0.17 + 2) + 0.4 * Math.sin(t * 0.23))];
    }

    function moveTitle(u) {
        const target = title.drag ? [pointer[0] - title.grab[0], pointer[1] - title.grab[1]] : wander(u - A.title);
        const k = title.drag ? 0.22 : 0.0022, damp = title.drag ? 0.62 : 0.975;
        for (let i = 0; i < 2; i++) {
            title.vel[i] = (title.vel[i] + (target[i] - title.pos[i]) * k) * damp;
            title.pos[i] += title.vel[i];
            const half = title.size[i] / 2, lo = Math.min(0.5, half - 0.04), hi = Math.max(0.5, 1 - half + 0.04);
            if (title.pos[i] < lo) { title.pos[i] = lo; title.vel[i] *= -0.5; }
            if (title.pos[i] > hi) { title.pos[i] = hi; title.vel[i] *= -0.5; }
        }
        title.hist.push([title.pos[0], title.pos[1], u]);
        while (title.hist.length > 2 && u - title.hist[1][2] > 0.32) title.hist.shift();
    }

    function overTitle(p) {
        return Math.abs(p[0] - title.pos[0]) < title.size[0] * 0.46 && Math.abs(p[1] - title.pos[1]) < title.size[1] * 0.44;
    }

    /* ---------- the rooms: they circle the title and travel with it ---------- */
    const GLYPHS = '▓▒░#%&@$*+=/\\<>?!~^';
    function scramble(node, text, dur = 700) {
        const start = performance.now();
        clearInterval(node._scr);
        node._scr = setInterval(() => {
            const p = Math.min(1, (performance.now() - start) / dur);
            const settled = Math.floor(p * text.length);
            node.textContent = text.slice(0, settled) + [...text.slice(settled)].map(ch => ch === ' ' ? ' ' : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]).join('');
            if (p >= 1) clearInterval(node._scr);
        }, 40);
    }

    function buildMenu() {
        const list = menu.querySelector('.m-list');
        list.innerHTML = '';
        ROOMS.forEach((name, i) => {
            const li = document.createElement('li');
            li.className = 'm-item';
            li.innerHTML = `<a href="#room-${i + 1}"><span class="m-num">${String(i + 1).padStart(2, '0')}</span><span class="m-label" data-text="${name}">${name}</span></a>`;
            list.appendChild(li);
            const a = li.querySelector('a'), label = li.querySelector('.m-label');
            const room = { li, a, label, x: innerWidth / 2, y: innerHeight / 2, w: 0, h: 0 };
            rooms.push(room);
            const heat = on => {
                li.classList.toggle('hot', on);
                if (on) { hot = i; Sound.hover(i); Sound.glitch(2, 0.15); scramble(label, name, 380); }
                else if (hot === i) hot = -1;
            };
            a.addEventListener('mouseenter', () => heat(true));
            a.addEventListener('mouseleave', () => heat(false));
            a.addEventListener('focus', () => heat(true));
            a.addEventListener('blur', () => heat(false));
            a.addEventListener('click', e => {
                e.preventDefault();
                Sound.select();
                ripple = [room.x / innerWidth, 1 - room.y / innerHeight, 0];
                showToast(`Room ${String(i + 1).padStart(2, '0')} · “${name}” is still being dreamed up.`);
            });
        });
    }

    function measureRooms() {
        rooms.forEach(r => { r.w = r.li.offsetWidth; r.h = r.li.offsetHeight; });
    }

    function placeRooms(dt, u) {
        const W = innerWidth, H = innerHeight;
        const cx = title.pos[0] * W, cy = (1 - title.pos[1]) * H;
        const tw = title.size[0] * W, th = title.size[1] * H;
        const spin = u * 0.035;
        rooms.forEach((r, i) => {
            if (!r.shown && u >= roomsAt + 0.12 + i * 0.12) {
                r.shown = true;
                r.li.classList.add('in');
                scramble(r.label, ROOMS[i], 900);
            }
            let tx, ty;
            if (wide()) {
                const a = -Math.PI / 2 + (i + 0.5) / rooms.length * Math.PI * 2 + spin;
                tx = cx + Math.cos(a) * (tw * 0.5 + 175);
                ty = cy + Math.sin(a) * (th * 0.5 + 110);
            } else {
                // phones: two columns above the title and two below
                const row = i % 4, col = i < 4 ? 0 : 1;
                tx = cx + (col ? 0.25 : -0.25) * W;
                const up = row < 2;
                ty = cy + (up ? -1 : 1) * (th * 0.5 + 56 + (up ? 1 - row : row - 2) * 58);
            }
            // each room trails the title a little differently, so the group moves like one loose body
            tx += Math.sin(u * 0.7 + i * 1.7) * 6;
            ty += Math.cos(u * 0.9 + i * 2.3) * 6;
            tx = Math.max(r.w / 2 + 8, Math.min(W - r.w / 2 - 8, tx));
            ty = Math.max(r.h / 2 + 8, Math.min(H - r.h / 2 - 40, ty));
            const k = Math.min(1, dt * (2.2 + i * 0.35));
            r.x += (tx - r.x) * k;
            r.y += (ty - r.y) * k;
            r.li.style.transform = `translate3d(${(r.x - r.w / 2).toFixed(1)}px, ${(r.y - r.h / 2).toFixed(1)}px, 0)`;
        });
        if (hot >= 0) { hotPos[0] = rooms[hot].x / W; hotPos[1] = 1 - rooms[hot].y / H; }
    }

    let roomsAt = 0;
    function revealRooms() {
        roomsOn = true;
        roomsAt = clock - impactAt;
        menu.classList.add('on');
        measureRooms();
        rooms.forEach(r => { r.x = title.pos[0] * innerWidth; r.y = (1 - title.pos[1]) * innerHeight; r.shown = false; });  // burst out from the title
        Sound.glitch(6, 1.2);
    }

    let toastTimer;
    function showToast(msg) {
        toast.textContent = msg;
        toast.classList.add('on');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toast.classList.remove('on'), 2600);
    }

    /* ---------- the score ---------- */
    function cue(at, fn) { cues.push({ at, fn, done: false }); }

    function score(drawEnd) {
        cues = [];
        cue(0.1, () => Sound.nature());
        cue(T.birds, () => { state.birds = clock; });
        cue(T.smoke, () => { state.smoke = clock; });
        cue(T.flutters, () => { state.flutters = clock; });
        cue(T.wash, () => Scene.paint());
        cue(drawEnd + 0.3, () => Scene.finishDrawing());
        cue(T.eagle, () => { state.plane = { enter: T.enter, release: T.release }; });
        cue(T.enter + 0.2, () => { Sound.cry(-0.8, 0.8); Sound.swoop(T.release - T.enter + 1.4); });
        cue(T.release + 0.1, () => Sound.cry(state.plane ? state.plane.pan : 0, 1));
        cue(T.release - 2.0, async () => {
            try { snapshot = await Scene.snapshot(paper, glScale, true); } catch (e) { snapshot = null; }
        });
        cue(T.release, () => {
            const P = state.plane;
            state.bomb = { t0: clock, dur: T.fall, x0: P.x + P.bx * P.s, y0: P.y + P.by * P.s, s: P.s * 0.8 };
            Sound.whistle(T.fall);
            const gz = Scene.groundZero();
            svg.style.transformOrigin = `${gz.x}px ${gz.y}px`;
            center = [gz.x / innerWidth, 1 - gz.y / innerHeight];
        });
        cue(T.impact - 0.45, () => Sound.hush(0.4));
        cue(T.impact, () => {
            impactAt = clock;
            Sound.boom();
            if (snapshot) Screen.setScene(snapshot);
            if (Screen.ok) {
                glCanvas.classList.add('on');
                svg.style.visibility = 'hidden';
            } else {
                body.classList.add('no-gl');
            }
            body.classList.add('tv');
        });
        cue(T.impact + A.loss, () => Sound.signalLoss());
        cue(T.impact + A.static, () => Sound.staticRush());
        cue(T.impact + A.bars, () => Sound.tuneIn());
        cue(T.impact + A.standby, () => standby.classList.add('on'));
        cue(T.impact + A.melt, () => { Sound.melt(8); standby.classList.remove('on'); });
        cue(T.impact + A.title, () => { Sound.glitch(9, 1.8); if (!Screen.ok) body.classList.add('show-title'); });
        cue(T.impact + A.rooms, () => revealRooms());
        cue(T.impact + A.done, () => arrive());
    }

    function arrive() {
        phase = 'home';
        body.classList.add('home');
        skipBtn.hidden = true;
    }

    /* where are we, for sound that starts late (browsers keep audio silent until the first tap or key) */
    function soundCatchUp() {
        const u = clock - impactAt;
        if (clock < T.impact - 0.5) Sound.nature();
        else if (u < A.bars) Sound.staticRush();
        else if (u < A.melt) Sound.tuneIn();
        else Sound.pad(2);
    }

    /* ---------- frame loop ---------- */
    const smooth = (a, b, x) => { const k = Math.min(1, Math.max(0, (x - a) / (b - a))); return k * k * (3 - 2 * k); };

    function frame(now) {
        const dt = Math.min(0.05, (now - last) / 1000 || 0);
        last = now;
        clock = (now - t0) / 1000;

        if (phase === 'intro' || phase === 'home') {
            cues.forEach(c => { if (!c.done && clock >= c.at) { c.done = true; c.fn(); } });
        }

        if (phase === 'intro' && clock < T.impact) {
            Scene.tick(clock, dt, state);
            const P = state.plane;
            if (P && P.beat) Sound.wingbeat(P.pan, P.near);
            if (state.bomb) {
                const p = smooth(T.release, T.impact, clock);
                zoom = 1 + 0.16 * p * p;
                svg.style.transform = `scale(${zoom.toFixed(4)})`;
            }
        }

        if (clock >= T.impact || phase === 'home') {
            const u = clock - impactAt;
            mouse[0] += (pointer[0] - mouse[0]) * 0.08;
            mouse[1] += (pointer[1] - mouse[1]) * 0.08;
            ripple[2] += dt;
            hotAmt += ((hot >= 0 ? 1 : 0) - hotAmt) * Math.min(1, dt * 6);
            const bars = u < A.bars ? 0 : u < A.bars + 0.6 ? (Math.floor(u * 14) % 3 ? 1 : 0) : 1;
            const k = 1 - smooth(A.bars, A.bars + 1.6, u);
            const psy = Math.pow(smooth(A.melt, A.done, u), 1.5);
            const tAmt = smooth(A.title, A.title + 2.2, u);
            if (tAmt > 0) moveTitle(u);
            if (roomsOn) placeRooms(dt, u);

            // stir the oil: the pointer pushes and tints it, the drifting title drags it along
            let field = null;
            if (psy > 0) {
                const dx = pointer[0] - lastPointer[0], dy = pointer[1] - lastPointer[1];
                const moving = Math.abs(dx) + Math.abs(dy) > 0.0004;
                const cl = v => Math.max(-1, Math.min(1, v));
                field = {
                    p1: [pointer[0], pointer[1], pointerActive ? (moving ? 1 : 0.25) * psy : 0],
                    v1: [cl(dx * 66), cl(dy * 66)],
                    p2: [title.pos[0], title.pos[1], tAmt],
                    v2: [cl(title.vel[0] * 80), cl(title.vel[1] * 80)]
                };
            }
            lastPointer[0] = pointer[0]; lastPointer[1] = pointer[1];

            // afterimages from about 0.12s and 0.3s ago, whatever the frame rate
            const h = title.hist, ago = d => h.find(p => u - p[2] <= d) || title.pos;
            Screen.render({
                time: reduced ? clock * 0.25 : clock,
                T: u, center, zoom,
                static: smooth(8.8, 9.5, u) * (u < A.bars + 0.6 ? 1 : 0),
                bars, roll: k * k * (u - A.bars) * 1.7, psy, dim: 0, field,
                mouse, ripple, hot: [hotPos[0], hotPos[1], hotAmt],
                title: { pos: title.pos, size: title.size, amt: tAmt, fade: 1, g1: ago(0.12), g2: ago(0.3) }
            });
        }
        requestAnimationFrame(frame);
    }

    /* ---------- loading, then straight into it ---------- */
    function load() {
        const bar = loader.querySelector('.ld-fill'), pct = loader.querySelector('.ld-pct');
        const start = performance.now(), minTime = 2600;
        let ready = false;
        Promise.all([
            document.fonts.load('800 220px Syne').catch(() => {}),
            document.fonts.ready,
            new Promise(r => setTimeout(r, 50)),
        ]).then(() => { makeTitle(); ready = true; });
        // the bar stutters forward like something being pulled off a slow disk
        let shown = 0;
        const tick = () => {
            const k = Math.min(1, (performance.now() - start) / minTime);
            const target = ready ? k : Math.min(k, 0.9);
            if (Math.random() < 0.35) shown += (target - shown) * (0.25 + Math.random() * 0.5);
            if (k >= 1 && ready) shown = 1;
            bar.style.transform = `scaleX(${shown.toFixed(3)})`;
            pct.textContent = String(Math.floor(shown * 100)).padStart(3, '0');
            if (shown >= 1) { setTimeout(begin, 250); return; }
            setTimeout(tick, 60 + Math.random() * 90);
        };
        tick();
    }

    function begin() {
        loader.classList.add('gone');
        body.classList.add('playing');
        skipBtn.hidden = false;
        if (reduced) { jumpHome(); return; }
        phase = 'intro';
        t0 = performance.now();
        state = {}; impactAt = Infinity; zoom = 1; snapshot = null;
        const drawEnd = Scene.startDrawing(T.draw, T.slow);
        score(drawEnd);
    }

    function jumpHome() {
        Sound.stopAll();
        Sound.pad(1.5);
        t0 = performance.now();
        clock = 0;
        impactAt = -A.done;           // as if the bomb fell long ago
        cues = [];
        if (svg) svg.style.visibility = 'hidden';
        standby.classList.remove('on');
        body.classList.add('tv', 'playing');
        if (Screen.ok) glCanvas.classList.add('on'); else body.classList.add('no-gl', 'show-title');
        loader.classList.add('gone');
        if (!roomsOn) revealRooms();
        arrive();
    }

    /* ---------- wiring ---------- */
    function setup() {
        paper = makePaper();
        makeStatic();
        svg = Scene.build(stage);
        Screen.init(glCanvas);
        Sound.init();
        pickGlScale();
        buildMenu();

        skipBtn.addEventListener('click', jumpHome);

        // sound is always on, but a browser only lets it play after the first tap, click or key
        const unlock = () => { if (Sound.unlock()) Sound.whenRunning(soundCatchUp); };
        ['pointerdown', 'keydown', 'touchend'].forEach(ev => addEventListener(ev, unlock, { capture: true }));

        const toUv = e => [e.clientX / innerWidth, 1 - e.clientY / innerHeight];
        addEventListener('pointermove', e => {
            [pointer[0], pointer[1]] = toUv(e);
            pointerActive = true;
            if (phase === 'home') body.style.cursor = title.drag ? 'grabbing' : overTitle(pointer) ? 'grab' : '';
        });
        addEventListener('pointerdown', e => {
            if (phase !== 'home' || e.target.closest('a,button')) return;
            [pointer[0], pointer[1]] = toUv(e);
            lastPointer[0] = pointer[0]; lastPointer[1] = pointer[1];
            pointerActive = true;
            if (overTitle(pointer)) {
                title.drag = true;
                title.grab = [pointer[0] - title.pos[0], pointer[1] - title.pos[1]];
                body.style.cursor = 'grabbing';
                Sound.glitch(3, 0.3);
            } else {
                ripple = [pointer[0], pointer[1], 0];
            }
        });
        addEventListener('pointerup', () => { if (title.drag) { title.drag = false; body.style.cursor = ''; } });
        addEventListener('pointercancel', () => { title.drag = false; });
        addEventListener('resize', () => { pickGlScale(); sizeTitle(); measureRooms(); });

        window.__chaosTitle = title;   // read by the test scripts
        requestAnimationFrame(t => { last = t; frame(t); });
        load();
    }

    setup();
})();
