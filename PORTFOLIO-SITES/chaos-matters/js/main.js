/* ==========================================================
   Chaos Matters — the conductor
   Runs the timeline: loading bar → sketch → eagle → nuclear
   blast → static → test card → the oil-slick dream, where the
   title drifts with its rooms circling it.
   ========================================================== */

(() => {
    const ROOMS = [
        'Space', 'Teeth of the Moon', 'Static Lullaby', 'Inside the Inkwell',
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
    // ?render: full-quality frames for the intro video (no controls, no adaptive resolution)
    const RENDER = /[?&]render/.test(location.search);
    // the intro plays as a pre-rendered film (two cuts + one soundtrack); ?live draws it in real time instead
    const FILM = !RENDER && !/[?&]live/.test(location.search);
    const FILM_END = 30.6;          // the film ends on the colour bars, this far after impact: u = 12.4
    const FILM_U = 12.4;
    const film = { el: $('#film'), wide: $('#filmWide'), tall: $('#filmTall'), sound: $('#filmSound'), ok: false, on: false };

    let svg, paper, snapshot = null;
    let phase = 'loading', t0 = 0, last = 0, clock = 0;
    let cues = [], state = {}, impactAt = Infinity, center = [0.5, 0.5], zoom = 1;
    const mouse = [0.5, 0.5], pointer = [0.5, 0.5], lastPointer = [0.5, 0.5];
    let pointerActive = false, ripple = [0.5, 0.5, 99];
    let glScale = 1, roomsOn = false, hot = -1, hotAmt = 0;
    const hotPos = [0.5, 0.5];

    // SPACE: the home page winds down (homeRate → 0) while the black hole takes it
    let homeRate = 1, shaderT = 0, returning = null, spaceMusicOn = false;
    const rewindBtn = $('#rewind'), osd = $('#osd'), spaceCanvas = $('#space'), grainEl = $('#grain');
    const fpsEl = /[?&]fps/.test(location.search) ? $('#fps') : null;   // ?fps shows a live frame counter

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

    let staticTile = null;
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
        staticTile = c;
        document.documentElement.style.setProperty('--static', `url(${c.toDataURL()})`);
        // film grain for the dream: centred on mid-grey so the overlay blend only adds grit, never tints
        const g = document.createElement('canvas');
        g.width = g.height = 128;
        const gx = g.getContext('2d'), gi = gx.createImageData(128, 128);
        for (let i = 0; i < gi.data.length; i += 4) {
            const v = 128 + (Math.random() + Math.random() - 1) * 127;
            gi.data[i] = gi.data[i + 1] = gi.data[i + 2] = v;
            gi.data[i + 3] = 255;
        }
        gx.putImageData(gi, 0, 0);
        document.documentElement.style.setProperty('--filmgrain', `url(${g.toDataURL()})`);
    }

    /* Resolution follows the device: start from a pixel budget, then step down while frames
       run slow and back up when there is headroom. The canvas is scaled up smoothly by CSS. */
    const pinQ = (location.search.match(/[?&]q=([\d.]+)/) || [])[1];
    const perf = { q: pinQ ? +pinQ : 1, acc: 0, n: 0, good: 0, hold: 0 };
    function pickGlScale() {
        const dpr = RENDER ? devicePixelRatio : Math.min(devicePixelRatio || 1, 2);
        const budget = RENDER ? 1e9 : 5.0e6 * perf.q * perf.q, px = innerWidth * innerHeight * dpr * dpr;
        glScale = px > budget ? dpr * Math.sqrt(budget / px) : dpr;
        Screen.resize(glScale);
        Space.setQuality(perf.q);
    }
    function adapt(raw) {
        if (RENDER || pinQ) return;
        if (perf.hold > 0) { perf.hold -= raw; return; }     // ignore the spike right after a scene change
        perf.acc += raw; perf.n++;
        if (perf.acc < 0.5) return;
        const avg = perf.acc / perf.n;
        perf.acc = perf.n = 0;
        if (avg > 1 / 40 && perf.q > 0.35) {
            perf.q = Math.max(0.35, perf.q * 0.8); perf.good = 0; perf.hold = 0.4; pickGlScale();
        } else if (avg < 1 / 55 && perf.q < 1) {
            if (++perf.good >= 4) { perf.q = Math.min(1, perf.q * 1.12); perf.good = 0; perf.hold = 0.4; pickGlScale(); }
        } else perf.good = 0;
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
        title.aspect = c.height / c.width;
        title.canvasW = c.width;
        buildTitle();
        sizeTitle();
    }

    /* ---------- the title as live text: always sharp, glitched with CSS ----------
       Layers (back to front): shadow + dark rim, red and blue fringes, the static-filled
       letters and a few displaced slices. Two afterimages trail behind where it has been. */
    const titleEls = {};
    function buildTitle() {
        const words = '<span>Chaos</span><span>Matters</span>';
        const box = $('#title');
        box.innerHTML = ['t-shadow', 't-red', 't-blue', 't-main', 't-slice', 't-slice', 't-slice', 't-slice', 't-slice']
            .map(c => `<div class="t-layer ${c}">${words}</div>`).join('');
        titleEls.box = box;
        titleEls.slices = [...box.querySelectorAll('.t-slice')];
        titleEls.g1 = $('#tg1'); titleEls.g2 = $('#tg2');
        titleEls.g1.innerHTML = titleEls.g2.innerHTML = `<div class="t-layer">${words}</div>`;
        titleEls.lastGlitch = 0;
        titleEls.size = 0;
    }

    function styleTitle() {
        const wPx = title.size[0] * innerWidth, k = wPx / title.canvasW;
        const css = `--tw:${wPx.toFixed(1)}px;--th:${(wPx * title.aspect).toFixed(1)}px;--fs:${(220 * k).toFixed(2)}px;--pad:${(40 * k).toFixed(2)}px;--ls:${(-4 * k).toFixed(2)}px;--fx:${(0.005 * innerWidth).toFixed(1)}px;--rim:${Math.max(1.5, 0.0035 * innerWidth).toFixed(1)}px;--sx:${(0.004 * innerWidth).toFixed(1)}px;--sy:${(0.009 * innerHeight).toFixed(1)}px`;
        [titleEls.box, titleEls.g1, titleEls.g2].forEach(e => e.style.cssText = css);
        titleEls.size = wPx;
    }

    const place = (e, p) => {
        const x = p[0] * innerWidth, y = (1 - p[1]) * innerHeight;
        e.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -50%)`;
    };
    function drawTitle(amt, g1, g2) {
        if (!titleEls.box) return;
        if (Math.abs(titleEls.size - title.size[0] * innerWidth) > 0.5) styleTitle();
        const show = amt > 0;
        body.classList.toggle('titled', show);
        if (!show || Space.active) return;     // inside SPACE the black hole moves it
        place(titleEls.box, title.pos);
        place(titleEls.g1, g1);
        place(titleEls.g2, g2);
        // glitch at 14 frames a second, like the shader did: it flickers on, and slices of it jump sideways
        if (shaderT - titleEls.lastGlitch > 1 / 14) {
            titleEls.lastGlitch = shaderT;
            const on = amt >= 1 || Math.random() < amt;
            titleEls.box.style.opacity = titleEls.g1.style.opacity = titleEls.g2.style.opacity = on ? '' : '0';
            const p = 0.32 + 0.45 * (1 - amt);
            const w = title.size[0] * innerWidth;
            titleEls.slices.forEach(sl => {
                if (Math.random() < p) {
                    // a torn band of the picture, pushed sideways; some carry a colour cast
                    const top = Math.random() * 92, h = 1.5 + Math.random() * 8;
                    sl.style.clipPath = `inset(${top.toFixed(1)}% 0 ${(100 - top - h).toFixed(1)}% 0)`;
                    sl.style.transform = `translateX(${((Math.random() - 0.5) * 0.32 * w).toFixed(1)}px)`;
                    sl.className = 't-layer t-slice' + (Math.random() < 0.35 ? (Math.random() < 0.5 ? ' warm' : ' cold') : '');
                    sl.style.opacity = '1';
                } else sl.style.opacity = '0';
            });
        }
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
        const k = (title.drag ? 0.22 : 0.0022) * homeRate, damp = title.drag ? 0.62 : 0.975;
        for (let i = 0; i < 2; i++) {
            title.vel[i] = (title.vel[i] + (target[i] - title.pos[i]) * k) * damp;
            title.pos[i] += title.vel[i] * homeRate;
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
                if (i === 0) { enterSpace(room); return; }
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
        const spin = shaderT * 0.035;
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
            tx += Math.sin(shaderT * 0.7 + i * 1.7) * 6;
            ty += Math.cos(shaderT * 0.9 + i * 2.3) * 6;
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
    function revealRooms(uNow = clock - impactAt) {
        roomsOn = true;
        roomsAt = uNow;
        menu.classList.add('on');
        measureRooms();
        rooms.forEach(r => { r.x = title.pos[0] * innerWidth; r.y = (1 - title.pos[1]) * innerHeight; r.shown = false; });  // burst out from the title
        Sound.glitch(6, 1.2);
    }

    /* ---------- SPACE: black hole → big bang → a universe to drift through ---------- */
    function enterSpace(room) {
        if (phase !== 'home' || !Space.ok) {
            if (!Space.ok) showToast('Space needs WebGL, which this browser has turned off.');
            return;
        }
        phase = 'space';
        hot = -1;
        rooms.forEach(r => r.li.classList.remove('hot'));
        body.classList.add('space-on');
        body.style.cursor = '';
        Sound.select();
        Sound.calm(Space.K.calm);
        perf.hold = 1;
        spaceMusicOn = false;
        Space.start({
            hole: [room.x / innerWidth, 1 - room.y / innerHeight],
            frameSource: composeFrame,
            onSwallow() {
                Sound.hole(Space.K.bang - Space.K.form);
                rooms.forEach(r => { r.sx = r.x; r.sy = r.y; });
                title.sx = title.pos[0] * innerWidth; title.sy = (1 - title.pos[1]) * innerHeight;
                body.classList.add('swallow');
            },
            onConsumed() { menu.classList.remove('on'); },
            onPulse: k => Sound.pulse(k),
            onBang() { Sound.bang(); body.classList.add('cosmos'); perf.hold = 1; },
            onReturn: returnHome,
        });
    }

    /* The moment the hole forms, the backdrop, the title and the room names are painted into one picture,
       so the black hole bends and swirls the words together with everything else. */
    function composeFrame() {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const sc = Math.min(dpr, 2048 / Math.max(innerWidth, innerHeight));
        const c = document.createElement('canvas');
        c.width = Math.round(innerWidth * sc); c.height = Math.round(innerHeight * sc);
        const x = c.getContext('2d');
        x.drawImage(glCanvas, 0, 0, c.width, c.height);
        x.scale(sc, sc);
        try { drawTitleInto(x, sc); } catch (e) {}
        try { drawRoomsInto(x); } catch (e) {}
        return c;
    }

    function drawTitleInto(x, sc) {
        if (!titleEls.box || !body.classList.contains('titled')) return;
        const main = titleEls.box.querySelector('.t-main');
        if (!main) return;
        const cs = getComputedStyle(main), box = titleEls.box;
        const fs = parseFloat(cs.fontSize), ls = parseFloat(cs.letterSpacing) || 0, pad = parseFloat(cs.paddingTop) || 0;
        const W = box.offsetWidth, cx = title.pos[0] * innerWidth, top = (1 - title.pos[1]) * innerHeight - box.offsetHeight / 2;
        const v = getComputedStyle(box), num = n => parseFloat(v.getPropertyValue(n)) || 0;
        const fx = num('--fx'), rim = num('--rim'), sx = num('--sx'), sy = num('--sy');
        const lines = ['CHAOS', 'MATTERS'], lh = fs * 0.86;
        const font = `${cs.fontWeight} ${fs}px ${cs.fontFamily}`;
        const setup = ctx => { ctx.font = font; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; if ('letterSpacing' in ctx) ctx.letterSpacing = ls + 'px'; };
        const base = i => top + pad + lh * i + fs * 0.78;
        const each = (ctx, dx, fn) => lines.forEach((t, i) => fn(t, cx + dx, base(i)));
        setup(x);
        // dark rim and drop shadow
        x.fillStyle = 'rgba(0,0,0,0.45)'; each(x, sx, (t, X, Y) => x.fillText(t, X, Y + sy));
        x.strokeStyle = 'rgba(0,0,0,0.72)'; x.lineWidth = rim * 2; x.lineJoin = 'round';
        each(x, 0, (t, X, Y) => x.strokeText(t, X, Y));
        x.fillStyle = 'rgba(0,0,0,0.72)'; each(x, 0, (t, X, Y) => x.fillText(t, X, Y));
        // the colour fringes
        x.fillStyle = '#ffe01a'; each(x, fx * 0.8, (t, X, Y) => x.fillText(t, X, Y));
        x.fillStyle = '#ff2a1a'; each(x, fx * 1.3, (t, X, Y) => x.fillText(t, X, Y));
        x.fillStyle = '#1ae8ff'; each(x, -fx * 0.8, (t, X, Y) => x.fillText(t, X, Y));
        x.fillStyle = '#1a46ff'; each(x, -fx * 1.3, (t, X, Y) => x.fillText(t, X, Y));
        // the letters, made of static with a light veil and scanlines
        const t = document.createElement('canvas');
        t.width = Math.ceil(innerWidth * sc); t.height = Math.ceil(innerHeight * sc);
        const y = t.getContext('2d'); y.scale(sc, sc); setup(y);
        y.fillStyle = staticTile ? y.createPattern(staticTile, 'repeat') : '#cfcfcf';
        each(y, 0, (s, X, Y) => y.fillText(s, X, Y));
        y.globalCompositeOperation = 'source-atop';
        y.fillStyle = 'rgba(255,255,255,0.34)'; y.fillRect(0, 0, innerWidth, innerHeight);
        y.fillStyle = 'rgba(0,0,0,0.16)';
        for (let yy = Math.floor(top); yy < top + box.offsetHeight; yy += 3) y.fillRect(cx - W, yy, W * 2, 1);
        x.save(); x.setTransform(1, 0, 0, 1, 0, 0); x.drawImage(t, 0, 0); x.restore();
    }

    function drawRoomsInto(x) {
        if (!roomsOn) return;
        rooms.forEach(r => {
            if (!r.li.classList.contains('in')) return;
            [r.li.querySelector('.m-num'), r.label].forEach(el => {
                if (!el) return;
                const cs = getComputedStyle(el), b = el.getBoundingClientRect();
                x.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
                if ('letterSpacing' in x) x.letterSpacing = cs.letterSpacing === 'normal' ? '0px' : cs.letterSpacing;
                x.textAlign = 'center'; x.textBaseline = 'middle';
                x.shadowColor = 'rgba(0,0,0,0.75)'; x.shadowBlur = 12; x.shadowOffsetY = 2;
                x.fillStyle = cs.color; x.globalAlpha = parseFloat(cs.opacity) || 1;
                x.fillText(el.textContent, b.left + b.width / 2, b.top + b.height / 2);
                x.shadowColor = 'transparent'; x.globalAlpha = 1;
            });
        });
        if ('letterSpacing' in x) x.letterSpacing = '0px';
    }

    // the rooms spiral into the hole one by one, stretched and dimmed as they fall
    function suckRooms(o) {
        const hx = o.hole[0] * innerWidth, hy = (1 - o.hole[1]) * innerHeight;
        if (titleEls.box) {
            const p = smooth(Space.K.form + 0.2, Space.K.form + 3.4, o.t);
            const dx = title.sx - hx, dy = title.sy - hy;
            const rad = Math.hypot(dx, dy) * Math.pow(1 - p, 1.5), ang = Math.atan2(dy, dx) + p * p * 4;
            titleEls.box.style.transform = `translate3d(${(hx + Math.cos(ang) * rad).toFixed(1)}px, ${(hy + Math.sin(ang) * rad).toFixed(1)}px, 0) translate(-50%, -50%) rotate(${(ang * 57.3 * p).toFixed(1)}deg) scale(${(1 - p * 0.95).toFixed(3)})`;
            titleEls.box.style.opacity = (1 - Math.pow(p, 3)).toFixed(3);
            titleEls.box.style.filter = p > 0 ? `blur(${(p * 4).toFixed(1)}px)` : '';
        }
        rooms.forEach((r, i) => {
            const ts = Space.K.form + 0.4 + i * 0.42;
            const p = smooth(ts, ts + 2.6, o.t);
            const dx = r.sx - hx, dy = r.sy - hy;
            const rad = Math.hypot(dx, dy) * Math.pow(1 - p, 1.6);
            const ang = Math.atan2(dy, dx) + p * p * 5;
            const x = hx + Math.cos(ang) * rad, y = hy + Math.sin(ang) * rad;
            r.li.style.transform = `translate3d(${(x - r.w / 2).toFixed(1)}px, ${(y - r.h / 2).toFixed(1)}px, 0) rotate(${(ang * 57.3 + 90 * p).toFixed(1)}deg) scale(${(1 + p * 1.6).toFixed(3)}, ${Math.max(0.02, 1 - p).toFixed(3)})`;
            r.li.style.opacity = (1 - Math.pow(p, 3)).toFixed(3);
            r.li.style.filter = p > 0 ? `blur(${(p * 3).toFixed(1)}px)` : '';
        });
    }

    function rewindSpace() {
        if (phase !== 'space') return;
        rewindBtn.hidden = true;
        osd.classList.add('on');
        Sound.rewind();
        Sound.spaceStop(0.4);
        Space.rewind();
    }

    // the tape drops back to the broadcast: static, the colour bars, then the menu builds itself again
    function returnHome() {
        Space.stop();
        Sound.spaceStop(0.1);
        osd.classList.remove('on');
        body.classList.remove('space-on', 'cosmos', 'exploring');
        rewindBtn.hidden = true;
        phase = 'home';
        homeRate = 1;
        title.pos = [0.5, 0.5]; title.vel = [0, 0]; title.hist = [];
        body.classList.remove('swallow');
        if (titleEls.box) {
            titleEls.box.style.filter = titleEls.box.style.opacity = titleEls.box.style.transform = '';
            titleEls.lastGlitch = -1;
        }
        hot = -1; hotAmt = 0;
        roomsOn = false;
        menu.classList.remove('on');
        rooms.forEach(r => {
            r.li.classList.remove('in');
            r.li.style.opacity = r.li.style.filter = '';
            r.shown = false;
        });
        returning = { u: A.bars - 0.9, cued: {} };
        Sound.staticRush();
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
        cue(drawEnd + 0.8, async () => {
            try {
                snapshot = await Scene.snapshot(paper, RENDER ? glScale : Math.min(glScale, 1), true);
                Screen.setScene(snapshot);
            } catch (e) { snapshot = null; }
        });
        cue(T.release, () => {
            const P = state.plane;
            state.bomb = { t0: clock, dur: T.fall, x0: P.x + P.bx * P.s, y0: P.y + P.by * P.s, s: P.s * 0.8 };
            Sound.whistle(T.fall);
            const gz = Scene.groundZero();
            stage.style.transformOrigin = `${gz.x}px ${gz.y}px`;
            center = [gz.x / innerWidth, 1 - gz.y / innerHeight];
        });
        cue(T.impact - 0.45, () => Sound.hush(0.4));
        cue(T.impact, () => {
            impactAt = clock;
            perf.hold = 1;
            Sound.boom();
            if (Screen.ok) {
                glCanvas.classList.add('on');
                stage.style.visibility = 'hidden';
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
        cue(T.impact + A.title, () => { Sound.glitch(9, 1.8); });
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
        if (film.ok && (phase === 'loading' || phase === 'film')) return;   // the film carries its own sound
        const u = clock - impactAt;
        if (clock < T.impact - 0.5) Sound.nature();
        else if (u < A.bars) Sound.staticRush();
        else if (u < A.melt) Sound.tuneIn();
        else Sound.pad(2);
    }

    /* ---------- frame loop ---------- */
    const smooth = (a, b, x) => { const k = Math.min(1, Math.max(0, (x - a) / (b - a))); return k * k * (3 - 2 * k); };

    let fpsN = 0, fpsT = 0;
    function frame(now) {
        const raw = (now - last) / 1000 || 0;
        if (fpsEl && (fpsN++, (fpsT += raw) >= 0.5)) {
            fpsEl.textContent = `${Math.round(fpsN / fpsT)} fps · quality ${Math.round(perf.q * 100)}%`;
            fpsN = 0; fpsT = 0;
        }
        const dt = Math.min(0.05, raw);
        last = now;
        clock = (now - t0) / 1000;

        if (phase === 'intro' || phase === 'home') {
            cues.forEach(c => { if (!c.done && clock >= c.at) { c.done = true; c.fn(); } });
        }

        if (phase === 'film') syncFilm();

        if (phase === 'intro' && clock < T.impact && svg) {
            Scene.tick(clock, dt, state);
            const P = state.plane;
            if (P && P.beat) Sound.wingbeat(P.pan, P.near);
            if (state.bomb) {
                const p = smooth(T.release, T.impact, clock);
                zoom = 1 + 0.16 * p * p;
                stage.style.transform = `scale(${zoom.toFixed(4)})`;
            }
        }

        let swallowed = false;
        if (Space.active) {
            const o = Space.step(dt);
            if (Space.active) homeRate = 1 - o.calm;      // after the rewind has ended the show, returnHome has already set it back
            swallowed = o.t >= Space.K.form;

            if (o.t > Space.K.bang + 2.2 && !spaceMusicOn) { spaceMusicOn = true; Sound.spaceMusic(); }
            if (o.explore && Space.active && rewindBtn.hidden && !osd.classList.contains('on')) { rewindBtn.hidden = false; body.classList.add('exploring'); }
            if (osd.classList.contains('on') && o.rew != null) osd.querySelector('.osd-time').textContent = tape(o.rew);
        }

        if ((clock >= T.impact || phase === 'home' || phase === 'space') && phase !== 'film') adapt(raw);

        if (returning) {
            const R = returning, c = R.cued;
            R.u += dt * (R.u < A.bars + 1.4 ? 1 : R.u < A.done ? 3 : 1);
            if (R.u >= A.bars && !c.bars) { c.bars = true; Sound.tuneIn(); }
            if (R.u >= A.bars + 1.4 && !c.melt) { c.melt = true; Sound.melt(2.8); }
            if (R.u >= A.title && !c.title) { c.title = true; Sound.glitch(9, 1.2); }
            if (R.u >= A.rooms && !roomsOn) revealRooms(R.u);
            if (R.u >= A.done) { impactAt = clock - R.u; returning = null; }
        }

        if ((clock >= T.impact || phase === 'home' || phase === 'space') && phase !== 'film' && !swallowed) {
            const u = returning ? returning.u : clock - impactAt;
            shaderT += dt * homeRate;
            mouse[0] += (pointer[0] - mouse[0]) * 0.08;
            mouse[1] += (pointer[1] - mouse[1]) * 0.08;
            ripple[2] += dt;
            hotAmt += ((hot >= 0 ? 1 : 0) - hotAmt) * Math.min(1, dt * 6);
            const bars = u < A.bars ? 0 : u < A.bars + 0.6 ? (Math.floor(u * 14) % 3 ? 1 : 0) : 1;
            const k = 1 - smooth(A.bars, A.bars + 1.6, u);
            const psy = Math.pow(smooth(A.melt, A.done, u), 1.5);
            const tAmt = smooth(A.title, A.title + 2.2, u);
            if (tAmt > 0) moveTitle(u);
            if (roomsOn && !Space.active) placeRooms(dt, u);

            // stir the oil: the pointer pushes and tints it, the drifting title drags it along
            let field = null;
            if (psy > 0 && homeRate > 0.05) {
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
                time: reduced ? shaderT * 0.25 : shaderT,
                T: u, center, zoom,
                static: smooth(8.8, 9.5, u) * (u < A.bars + 0.6 ? 1 : 0),
                bars, roll: k * k * (u - A.bars) * 1.7, psy, dim: 0, field,
                mouse, ripple, hot: [hotPos[0], hotPos[1], hotAmt],
                title: { pos: title.pos, size: title.size, amt: 0, fade: 1, g1: title.pos, g2: title.pos },
                grain: 1 - psy
            });
            drawTitle(tAmt, ago(0.12), ago(0.3));
            grainEl.style.opacity = (psy * 0.3).toFixed(3);
        }
        requestAnimationFrame(frame);
    }

    // a VHS tape counter running backwards
    function tape(t) {
        const s = Math.max(0, 4997 - t * 1400);
        const p = n => String(Math.floor(n)).padStart(2, '0');
        return `${p(s / 3600)}:${p((s / 60) % 60)}:${p(s % 60)}`;
    }

    /* ---------- the intro film ---------- */
    // download both cuts and the soundtrack in full during the loading bar, so turning a phone never waits
    function fetchWithProgress(url, onBytes) {
        return fetch(url).then(res => {
            if (!res.ok) throw new Error(url + ' ' + res.status);
            const total = +res.headers.get('content-length') || 0;
            if (!res.body || !res.body.getReader) return res.blob().then(b => { onBytes(b.size, b.size); return b; });
            const reader = res.body.getReader(), parts = [];
            let got = 0;
            const pump = () => reader.read().then(({ done, value }) => {
                if (done) return new Blob(parts, { type: res.headers.get('content-type') || '' });
                parts.push(value); got += value.length; onBytes(got, total);
                return pump();
            });
            return pump();
        });
    }

    function loadFilm(progress) {
        const files = [['media/intro-wide.mp4', film.wide], ['media/intro-tall.mp4', film.tall], ['media/intro.m4a', film.sound]];
        const got = files.map(() => 0), tot = files.map(() => 0);
        const report = () => { const T = tot.reduce((a, b) => a + b, 0); progress(T ? got.reduce((a, b) => a + b, 0) / T : 0); };
        return Promise.all(files.map(([url, el], i) => fetchWithProgress(url, (g, t) => { got[i] = g; tot[i] = t || g; report(); })
            .then(blob => new Promise((res, rej) => {
                el.src = URL.createObjectURL(blob);
                el.addEventListener('canplaythrough', res, { once: true });
                el.addEventListener('error', rej, { once: true });
                el.load();
            }))))
            .then(() => { film.ok = true; });
    }

    // portrait screens get the tall cut; both keep playing so the swap is instant
    function pickCut() {
        film.el.classList.toggle('tall', innerHeight > innerWidth);
    }

    function playFilm() {
        film.on = true;
        pickCut();
        film.el.classList.add('on');
        film.sound.currentTime = 0;
        [film.wide, film.tall].forEach(v => { v.currentTime = 0; v.play().catch(() => {}); });
        film.sound.play().catch(() => {});
    }

    // the soundtrack is the clock: keep both pictures locked to it
    function syncFilm() {
        const t = film.sound.currentTime;
        [film.wide, film.tall].forEach(v => {
            if (v.paused && !film.sound.paused) v.play().catch(() => {});
            if (Math.abs(v.currentTime - t) > 0.12) v.currentTime = t;
        });
        if (t >= FILM_END || film.sound.ended) filmToHome();
    }

    function stopFilm() {
        film.on = false;
        [film.wide, film.tall, film.sound].forEach(m => m.pause());
        film.el.classList.remove('on');
    }

    // the film's last frame is the colour bars; the live screen picks up from exactly there
    function filmToHome() {
        stopFilm();
        phase = 'intro';
        impactAt = clock - FILM_U;
        body.classList.add('tv');
        if (Screen.ok) glCanvas.classList.add('on'); else body.classList.add('no-gl');
        Sound.tuneIn();
        cues = [];
        cue(clock + A.standby - FILM_U, () => standby.classList.add('on'));
        cue(clock + A.melt - FILM_U, () => { Sound.melt(8); standby.classList.remove('on'); });
        cue(clock + A.title - FILM_U, () => { Sound.glitch(9, 1.8); });
        cue(clock + A.rooms - FILM_U, () => revealRooms());
        cue(clock + A.done - FILM_U, () => arrive());
        perf.hold = 1;
    }

    /* ---------- loading, then straight into it ---------- */
    function load() {
        const bar = loader.querySelector('.ld-fill'), pct = loader.querySelector('.ld-pct');
        const start = performance.now(), minTime = 2600;
        let ready = false, filmDone = 0;
        const intro = FILM
            ? loadFilm(k => { filmDone = k; }).catch(e => {
                console.warn('Chaos Matters: intro film unavailable, drawing it live', e);
                svg = Scene.build(stage);
                return Scene.prepare();
            })
            : (svg = Scene.build(stage), Scene.prepare());
        Promise.all([
            document.fonts.load('800 220px Syne').catch(() => {}),
            document.fonts.ready,
            new Promise(r => setTimeout(r, 50)),
            intro.catch(() => {}),
            Screen.ready.then(() => Screen.warm()),
            Space.ready.then(() => Space.warm()),
        ]).then(() => { makeTitle(); pickGlScale(); ready = true; });
        // the bar stutters forward like something being pulled off a slow disk
        let shown = 0;
        const tick = () => {
            // the bar follows the real download when there is one, never faster than the minimum time
            const k = Math.min(1, (performance.now() - start) / minTime);
            const target = ready ? k : Math.min(k, FILM ? Math.min(0.97, filmDone) : 0.9);
            if (Math.random() < 0.35) shown += (target - shown) * (0.25 + Math.random() * 0.5);
            if (k >= 1 && ready) shown = 1;
            bar.style.transform = `scaleX(${shown.toFixed(3)})`;
            pct.textContent = String(Math.floor(shown * 100)).padStart(3, '0');
            if (shown >= 1) { setTimeout(offerEntry, 250); return; }
            setTimeout(tick, 60 + Math.random() * 90);
        };
        tick();
    }

    /* the bar is full: one click lets the visitor in and switches the sound on */
    function offerEntry() {
        const btn = $('#enter');
        if (matchMedia('(hover: none)').matches) btn.firstChild.textContent = 'Tap to enter';
        btn.hidden = false;
        loader.classList.add('ready');
        btn.addEventListener('click', () => {
            btn.disabled = true;
            Sound.unlock();
            let started = false;
            const go = () => { if (!started) { started = true; begin(); } };
            Sound.whenRunning(go);
            setTimeout(go, 400);      // never wait long on a browser that is slow to hand over audio
        }, { once: true });
    }

    function begin() {
        loader.classList.add('gone');
        body.classList.add('playing');
        skipBtn.hidden = RENDER;
        if (reduced) { jumpHome(); return; }
        t0 = performance.now();
        state = {}; impactAt = Infinity; zoom = 1; snapshot = null;
        if (film.ok) {
            phase = 'film';
            playFilm();
            return;
        }
        phase = 'intro';
        const drawEnd = Scene.startDrawing(T.draw, T.slow);
        score(drawEnd);
    }

    function jumpHome() {
        if (film.on) stopFilm();
        Sound.stopAll();
        Sound.pad(1.5);
        t0 = performance.now();
        clock = 0;
        impactAt = -A.done;           // as if the bomb fell long ago
        cues = [];
        stage.style.visibility = 'hidden';
        standby.classList.remove('on');
        body.classList.add('tv', 'playing');
        if (Screen.ok) glCanvas.classList.add('on'); else body.classList.add('no-gl');
        loader.classList.add('gone');
        if (!roomsOn) revealRooms();
        arrive();
    }

    /* ---------- wiring ---------- */
    function setup() {
        paper = makePaper();
        makeStatic();
        Screen.init(glCanvas);
        Sound.init();
        pickGlScale();
        buildMenu();

        skipBtn.addEventListener('click', jumpHome);
        rewindBtn.addEventListener('click', rewindSpace);
        Space.init(spaceCanvas);

        // the enter click turns the sound on; this is a fallback if the browser still held it back
        const unlock = () => { if (Sound.unlock()) Sound.whenRunning(soundCatchUp); };
        ['pointerdown', 'keydown', 'touchend'].forEach(ev => addEventListener(ev, unlock, { capture: true }));

        const toUv = e => [e.clientX / innerWidth, 1 - e.clientY / innerHeight];
        addEventListener('pointermove', e => {
            [pointer[0], pointer[1]] = toUv(e);
            pointerActive = true;
            if (phase === 'home' && !returning) body.style.cursor = title.drag ? 'grabbing' : overTitle(pointer) ? 'grab' : '';
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
        addEventListener('resize', () => { pickGlScale(); sizeTitle(); measureRooms(); if (film.on) pickCut(); });

        window.__chaosTitle = title;   // read by the test scripts
        requestAnimationFrame(t => { last = t; frame(t); });
        load();
    }

    setup();
})();
