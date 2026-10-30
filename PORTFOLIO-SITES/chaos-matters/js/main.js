/* ==========================================================
   Chaos Matters — the conductor
   Runs the timeline: gate → sketch → plane → bomb → static
   → test card → the dream menu.
   ========================================================== */

(() => {
    const ROOMS = [
        'Velvet Gravity', 'Teeth of the Moon', 'Static Lullaby', 'Inside the Inkwell',
        'Seventeen Suns', 'The Weight of Feathers', 'Echoes for Rent', 'Paper Thunder'
    ];

    // the score, in seconds from the moment the visitor enters
    const T = { draw: 0.9, wash: 7.0, birds: 7.4, engine: 8.4, enter: 9.6, release: 13.0, fall: 2.4 };
    T.impact = T.release + T.fall;
    // after impact
    const A = { static: 0.9, bars: 4.6, standby: 5.4, melt: 8.2, menu: 9.8, done: 11.4 };

    const $ = s => document.querySelector(s);
    const body = document.body;
    const stage = $('#stage'), glCanvas = $('#gl'), gate = $('#gate'), menu = $('#menu');
    const standby = $('#standby'), skipBtn = $('#skip'), toast = $('#toast');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

    let svg, paper, snapshot = null;
    let phase = 'gate', t0 = 0, last = 0, clock = 0;
    let cues = [], state = {}, impactAt = Infinity, center = [0.5, 0.5], zoom = 1;
    const mouse = [0.5, 0.5], mouseTarget = [0.5, 0.5];
    let hover = 0, hoverTarget = 0, ripple = [0.5, 0.5, 99];
    let glScale = 1;

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

    /* ---------- the menu ---------- */
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
            a.addEventListener('mouseenter', () => { hoverTarget = 1; Sound.hover(i); scramble(label, name, 380); });
            a.addEventListener('mouseleave', () => { hoverTarget = 0; });
            a.addEventListener('focus', () => { hoverTarget = 1; });
            a.addEventListener('blur', () => { hoverTarget = 0; });
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

    // on wide screens the rooms orbit the title; on phones they stack
    function placeMenu() {
        const items = [...menu.querySelectorAll('.m-item')];
        const wide = innerWidth > 760;
        items.forEach((li, i) => {
            if (!wide) { li.style.left = li.style.top = ''; return; }
            const a = -Math.PI / 2 + (i + 0.5) / items.length * Math.PI * 2;
            li.style.left = (50 + Math.cos(a) * 35) + '%';
            li.style.top = (50 + Math.sin(a) * 34) + '%';
        });
    }

    function revealMenu() {
        menu.classList.add('on');
        menu.querySelectorAll('.m-item').forEach((li, i) => {
            setTimeout(() => {
                li.classList.add('in');
                const label = li.querySelector('.m-label');
                scramble(label, ROOMS[i], 900);
            }, 250 + i * 140);
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

    function score() {
        cues = [];
        cue(0.25, () => Sound.nature());
        cue(T.wash, () => Scene.paint());
        cue(T.wash + 0.6, () => Scene.finishDrawing());
        cue(T.birds, () => { state.birds = clock; });
        cue(T.engine, () => { Sound.planeStart(); state.plane = { enter: T.enter, release: T.release }; });
        cue(T.release - 2.2, async () => {
            try { snapshot = await Scene.snapshot(paper, glScale); } catch (e) { snapshot = null; }
        });
        cue(T.release, () => {
            const P = state.plane;
            state.bomb = { t0: clock, dur: T.fall, x0: P.x + 8 * P.s, y0: P.y + 16 * P.s, s: P.s * 1.4 };
            Sound.whistle(T.fall);
            const gz = Scene.groundZero();
            svg.style.transformOrigin = `${gz.x}px ${gz.y}px`;
            center = [gz.x / innerWidth, 1 - gz.y / innerHeight];
        });
        cue(T.impact - 0.55, () => Sound.hush(0.45));
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
        cue(T.impact + A.static, () => Sound.staticRush());
        cue(T.impact + A.bars, () => Sound.tuneIn());
        cue(T.impact + A.standby, () => standby.classList.add('on'));
        cue(T.impact + A.melt, () => { Sound.melt(3.2); standby.classList.remove('on'); });
        cue(T.impact + A.menu, () => revealMenu());
        cue(T.impact + A.done, () => arrive());
    }

    function arrive() {
        phase = 'menu';
        body.classList.add('in-menu');
        skipBtn.hidden = true;
        try { localStorage.setItem('cm-visited', '1'); } catch (e) { /* storage blocked */ }
    }

    /* ---------- frame loop ---------- */
    const smooth = (a, b, x) => { const k = Math.min(1, Math.max(0, (x - a) / (b - a))); return k * k * (3 - 2 * k); };

    function frame(now) {
        const dt = Math.min(0.05, (now - last) / 1000 || 0);
        last = now;
        clock = (now - t0) / 1000;

        if (phase === 'intro' || phase === 'menu') {
            cues.forEach(c => { if (!c.done && clock >= c.at) { c.done = true; c.fn(); } });
        }

        if (phase === 'intro' && clock < T.impact) {
            Scene.tick(clock, dt, state);
            const P = state.plane;
            if (P && P.x != null) Sound.planeUpdate(P.pan, P.near, P.x < Scene.HOUSE.x);
            if (state.bomb) {
                const p = smooth(T.release, T.impact, clock);
                zoom = 1 + 0.16 * p * p;
                svg.style.transform = `scale(${zoom.toFixed(4)})`;
            }
        }

        if (clock >= T.impact || phase === 'menu') {
            const u = clock - impactAt;
            mouse[0] += (mouseTarget[0] - mouse[0]) * 0.08;
            mouse[1] += (mouseTarget[1] - mouse[1]) * 0.08;
            hover += (hoverTarget - hover) * 0.06;
            ripple[2] += dt;
            const bars = u < A.bars ? 0 : u < A.bars + 0.6 ? (Math.floor(u * 14) % 3 ? 1 : 0) : 1;
            const k = 1 - smooth(A.bars, A.bars + 1.6, u);
            const psy = smooth(A.melt, A.done, u);
            Screen.render({
                time: reduced ? clock * 0.25 : clock,
                T: u, center, zoom,
                static: smooth(1.3, 2.5, u) * (u < A.bars + 0.6 ? 1 : 0),
                tv: smooth(1.6, 2.6, u) * (1 - psy),
                bars, roll: k * k * (u - A.bars) * 1.7, psy,
                menu: smooth(A.menu - 0.6, A.done, u),
                mouse, hover, ripple
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
        if (reduced) { jumpToMenu(); return; }
        phase = 'intro';
        t0 = performance.now();
        state = {}; impactAt = Infinity; zoom = 1; snapshot = null;
        score();
        Scene.startDrawing(T.draw);
    }

    function jumpToMenu() {
        Sound.stopAll();
        Sound.init();
        Sound.pad(1.5);
        t0 = performance.now();
        clock = 0;
        impactAt = -A.done;           // as if the bomb fell long ago
        cues = [];
        phase = 'menu';
        if (svg) svg.style.visibility = 'hidden';
        standby.classList.remove('on');
        body.classList.add('tv', 'playing');
        if (Screen.ok) glCanvas.classList.add('on'); else body.classList.add('no-gl');
        gate.classList.add('gone');
        revealMenu();
        arrive();
    }

    function replay() {
        Sound.stopAll();
        menu.classList.remove('on');
        menu.querySelectorAll('.m-item').forEach(li => li.classList.remove('in'));
        glCanvas.classList.remove('on');
        body.classList.remove('tv', 'in-menu', 'no-gl');
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
        $('#gateSkip').addEventListener('click', () => { Sound.init(); jumpToMenu(); });
        skipBtn.addEventListener('click', jumpToMenu);
        $('#replay').addEventListener('click', replay);
        const soundBtn = $('#sound');
        soundBtn.addEventListener('click', () => {
            Sound.setMuted(!Sound.muted);
            soundBtn.textContent = Sound.muted ? 'Sound off' : 'Sound on';
            soundBtn.setAttribute('aria-pressed', String(!Sound.muted));
        });

        addEventListener('pointermove', e => {
            mouseTarget[0] = e.clientX / innerWidth;
            mouseTarget[1] = 1 - e.clientY / innerHeight;
        });
        addEventListener('pointerdown', e => {
            if (phase !== 'menu' || e.target.closest('a,button')) return;
            ripple = [e.clientX / innerWidth, 1 - e.clientY / innerHeight, 0];
        });
        addEventListener('resize', () => { pickGlScale(); placeMenu(); });

        // let tests and curious visitors jump straight in: index.html#menu
        if (location.hash === '#menu') { $('#gateSkip').hidden = false; }

        requestAnimationFrame(t => { last = t; frame(t); });
    }

    setup();
})();
