/* ==========================================================
   Chaos Matters — the conductor
   Runs the timeline: gate → sketch → bomber → mushroom cloud
   → static → test card → the oil-slick dream and its title.
   ========================================================== */

(() => {
    const ROOMS = [
        'Velvet Gravity', 'Teeth of the Moon', 'Static Lullaby', 'Inside the Inkwell',
        'Seventeen Suns', 'The Weight of Feathers', 'Echoes for Rent', 'Paper Thunder'
    ];

    // the score, in seconds from the moment the visitor enters
    const T = { draw: 1.0, slow: 1.7, birds: 2.6, smoke: 6.4, flutters: 8.5, wash: 11.0,
                eagle: 12.4, enter: 13.4, release: 17.6, fall: 4.2 };
    T.impact = T.release + T.fall;
    // after impact
    const A = { loss: 8.4, static: 8.6, bars: 12.0, standby: 12.7, melt: 14.8, title: 18.6, done: 22.8 };

    const $ = s => document.querySelector(s);
    const body = document.body;
    const stage = $('#stage'), glCanvas = $('#gl'), gate = $('#gate'), menu = $('#menu');
    const standby = $('#standby'), skipBtn = $('#skip'), toast = $('#toast');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

    let svg, paper, snapshot = null;
    let phase = 'gate', t0 = 0, last = 0, clock = 0;
    let cues = [], state = {}, impactAt = Infinity, center = [0.5, 0.5], zoom = 1;
    const mouse = [0.5, 0.5], pointer = [0.5, 0.5], lastPointer = [0.5, 0.5];
    let pointerActive = false, ripple = [0.5, 0.5, 99];
    let dim = 0, doorsOpen = false;
    let glScale = 1;

    const title = { pos: [0.5, 0.5], vel: [0, 0], size: [0.5, 0.2], aspect: 0.5, drag: false, grab: [0, 0], hist: [], down: null };

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

    function sizeTitle() {
        const wPx = innerWidth > 760 ? Math.min(innerWidth * 0.56, 960) : innerWidth * 0.9;
        title.size = [wPx / innerWidth, wPx * title.aspect / innerHeight];
    }

    // where the title would like to drift: a slow, looping wander that stays on screen
    function wander(t) {
        const ax = Math.max(0, 0.5 - title.size[0] / 2 - 0.03), ay = Math.max(0, 0.5 - title.size[1] / 2 - 0.08);
        return [0.5 + ax * (0.7 * Math.sin(t * 0.13) + 0.3 * Math.sin(t * 0.31 + 1)),
                0.5 + ay * (0.6 * Math.sin(t * 0.17 + 2) + 0.4 * Math.sin(t * 0.23))];
    }

    function moveTitle(u) {
        // with the doors open (on wide screens) the title settles in the middle and the rooms circle it
        const settle = doorsOpen && innerWidth > 760;
        const target = title.drag ? [pointer[0] - title.grab[0], pointer[1] - title.grab[1]] : settle ? [0.5, 0.5] : wander(u - A.title);
        const k = title.drag ? 0.22 : settle ? 0.012 : 0.0022, damp = title.drag ? 0.62 : settle ? 0.88 : 0.975;
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

    /* ---------- the doors (rooms), behind the title ---------- */
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
            li.style.setProperty('--bob', `${(4 + (i % 3)).toFixed(1)}s`);
            li.style.setProperty('--delay', `${-i * 0.7}s`);
            li.innerHTML = `<a href="#room-${i + 1}" data-i="${i}"><span class="m-num">${String(i + 1).padStart(2, '0')}</span><span class="m-label">${name}</span></a>`;
            list.appendChild(li);
            const a = li.querySelector('a'), label = li.querySelector('.m-label');
            a.addEventListener('mouseenter', () => { Sound.hover(i); scramble(label, name, 380); });
            a.addEventListener('click', e => {
                e.preventDefault();
                Sound.select();
                const r = a.getBoundingClientRect();
                ripple = [(r.left + r.width / 2) / innerWidth, 1 - (r.top + r.height / 2) / innerHeight, 0];
                showToast(`Room ${String(i + 1).padStart(2, '0')} · “${name}” is still being dreamed up.`);
            });
        });
        placeMenu();
    }

    function placeMenu() {
        const items = [...menu.querySelectorAll('.m-item')];
        const wide = innerWidth > 760;
        items.forEach((li, i) => {
            if (!wide) { li.style.left = li.style.top = ''; return; }
            const a = -Math.PI / 2 + (i + 0.5) / items.length * Math.PI * 2;
            li.style.left = (50 + Math.cos(a) * 36) + '%';
            li.style.top = (50 + Math.sin(a) * 36) + '%';
        });
    }

    function setDoors(open) {
        doorsOpen = open;
        menu.classList.toggle('on', open);
        body.classList.toggle('doors', open);
        Sound.glitch(4, 0.4);
        menu.querySelectorAll('.m-item').forEach((li, i) => {
            li.classList.remove('in');
            if (!open) return;
            setTimeout(() => {
                li.classList.add('in');
                scramble(li.querySelector('.m-label'), ROOMS[i], 800);
            }, 120 + i * 110);
        });
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
        cue(0.25, () => Sound.nature());
        cue(T.birds, () => { state.birds = clock; });
        cue(T.smoke, () => { state.smoke = clock; });
        cue(T.flutters, () => { state.flutters = clock; });
        cue(T.wash, () => Scene.paint());
        cue(drawEnd + 0.3, () => Scene.finishDrawing());
        cue(T.eagle, () => { state.plane = { enter: T.enter, release: T.release }; });
        cue(T.enter + 0.4, () => Sound.cry(-0.7, 0.7));
        cue(T.release + 0.2, () => Sound.cry(state.plane ? state.plane.pan : 0, 1));
        cue(T.release - 2.2, async () => {
            try { snapshot = await Scene.snapshot(paper, glScale, true); } catch (e) { snapshot = null; }
        });
        cue(T.release, () => {
            const P = state.plane;
            state.bomb = { t0: clock, dur: T.fall, x0: P.x + 1 * P.s, y0: P.y + 31 * P.s, s: P.s * 0.8 };
            Sound.whistle(T.fall);
            const gz = Scene.groundZero();
            svg.style.transformOrigin = `${gz.x}px ${gz.y}px`;
            center = [gz.x / innerWidth, 1 - gz.y / innerHeight];
        });
        cue(T.impact - 0.6, () => Sound.hush(0.5));
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
        cue(T.impact + A.done, () => arrive());
    }

    function arrive() {
        phase = 'home';
        body.classList.add('home');
        skipBtn.hidden = true;
        try { localStorage.setItem('cm-visited', '1'); } catch (e) { /* storage blocked */ }
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
            dim += ((doorsOpen ? 1 : 0) - dim) * Math.min(1, dt * 5);
            ripple[2] += dt;
            const bars = u < A.bars ? 0 : u < A.bars + 0.6 ? (Math.floor(u * 14) % 3 ? 1 : 0) : 1;
            const k = 1 - smooth(A.bars, A.bars + 1.6, u);
            const psy = Math.pow(smooth(A.melt, A.done, u), 1.5);
            const tAmt = smooth(A.title, A.title + 2.2, u);
            if (tAmt > 0) moveTitle(u);

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
            const wide = innerWidth > 760;
            const h = title.hist, ago = d => h.find(p => u - p[2] <= d) || title.pos;
            Screen.render({
                time: reduced ? clock * 0.25 : clock,
                T: u, center, zoom,
                static: smooth(8.8, 9.5, u) * (u < A.bars + 0.6 ? 1 : 0),
                bars, roll: k * k * (u - A.bars) * 1.7, psy, dim, field,
                mouse, ripple,
                title: { pos: title.pos, amt: tAmt,
                         size: wide ? [title.size[0] * (1 - 0.32 * dim), title.size[1] * (1 - 0.32 * dim)] : title.size,
                         fade: wide ? 1 : 1 - 0.88 * dim,
                         g1: ago(0.12), g2: ago(0.3) }
            });
        }
        requestAnimationFrame(frame);
    }

    /* ---------- entering, skipping, replaying ---------- */
    function begin() {
        Sound.init();
        gate.classList.add('gone');
        body.classList.add('playing');
        skipBtn.hidden = false;
        if (reduced) { jumpHome(); return; }
        phase = 'intro';
        t0 = performance.now();
        state = {}; impactAt = Infinity; zoom = 1; snapshot = null;
        resetTitle();
        const drawEnd = Scene.startDrawing(T.draw, T.slow);
        score(drawEnd);
    }

    function resetTitle() {
        title.pos = [0.5, 0.5]; title.vel = [0, 0]; title.hist = []; title.drag = false;
    }

    function jumpHome() {
        Sound.stopAll();
        Sound.init();
        Sound.pad(1.5);
        t0 = performance.now();
        clock = 0;
        impactAt = -A.done;           // as if the bomb fell long ago
        cues = [];
        resetTitle();
        if (svg) svg.style.visibility = 'hidden';
        standby.classList.remove('on');
        body.classList.add('tv', 'playing');
        if (Screen.ok) glCanvas.classList.add('on'); else body.classList.add('no-gl', 'show-title');
        gate.classList.add('gone');
        arrive();
    }

    function replay() {
        Sound.stopAll();
        setDoors(false);
        glCanvas.classList.remove('on');
        body.classList.remove('tv', 'home', 'no-gl', 'show-title');
        standby.classList.remove('on');
        svg.remove();
        svg = Scene.build(stage);
        begin();
    }

    /* ---------- wiring ---------- */
    function setup() {
        paper = makePaper();
        svg = Scene.build(stage);
        Screen.init(glCanvas);
        pickGlScale();
        buildMenu();
        document.fonts.load('800 220px Syne').catch(() => {}).then(makeTitle);

        let visited = false;
        try { visited = localStorage.getItem('cm-visited') === '1'; } catch (e) { /* storage blocked */ }
        $('#gateSkip').hidden = !visited;

        gate.addEventListener('click', e => {
            if (e.target.closest('#gateSkip')) return;
            if (phase === 'gate') begin();
        });
        gate.addEventListener('keydown', e => {
            if ((e.key === 'Enter' || e.key === ' ') && phase === 'gate') { e.preventDefault(); begin(); }
        });
        $('#gateSkip').addEventListener('click', () => { Sound.init(); jumpHome(); });
        skipBtn.addEventListener('click', jumpHome);
        $('#replay').addEventListener('click', replay);
        const soundBtn = $('#sound');
        soundBtn.addEventListener('click', () => {
            Sound.setMuted(!Sound.muted);
            soundBtn.textContent = Sound.muted ? 'Sound off' : 'Sound on';
            soundBtn.setAttribute('aria-pressed', String(!Sound.muted));
        });
        $('#titleBtn').addEventListener('click', () => { if (phase === 'home') setDoors(!doorsOpen); });

        const toUv = e => [e.clientX / innerWidth, 1 - e.clientY / innerHeight];
        addEventListener('pointermove', e => {
            [pointer[0], pointer[1]] = toUv(e);
            pointerActive = true;
            if (phase === 'home' && !doorsOpen) body.style.cursor = title.drag ? 'grabbing' : overTitle(pointer) ? 'grab' : '';
        });
        addEventListener('pointerdown', e => {
            if (phase !== 'home' || e.target.closest('a,button')) return;
            [pointer[0], pointer[1]] = toUv(e);
            lastPointer[0] = pointer[0]; lastPointer[1] = pointer[1];
            pointerActive = true;
            if (!doorsOpen && overTitle(pointer)) {
                title.drag = true;
                title.grab = [pointer[0] - title.pos[0], pointer[1] - title.pos[1]];
                title.down = { x: pointer[0], y: pointer[1], at: performance.now() };
                body.style.cursor = 'grabbing';
            } else if (doorsOpen && !e.target.closest('.m-item')) {
                setDoors(false);
            } else {
                ripple = [pointer[0], pointer[1], 0];
            }
        });
        addEventListener('pointerup', () => {
            if (!title.drag) return;
            title.drag = false;
            const d = title.down;
            // a tap (not a drag) on the title opens the doors
            if (d && Math.hypot(pointer[0] - d.x, pointer[1] - d.y) < 0.012 && performance.now() - d.at < 350) setDoors(true);
            body.style.cursor = '';
        });
        addEventListener('pointercancel', () => { title.drag = false; });
        addEventListener('resize', () => { pickGlScale(); placeMenu(); sizeTitle(); });

        window.__chaosTitle = title;   // read by the test scripts
        requestAnimationFrame(t => { last = t; frame(t); });
    }

    setup();
})();
