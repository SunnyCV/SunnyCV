/* ==========================================================
   Chaos Matters — the sketch
   A prairie farmhouse drawn in pencil, built stroke by stroke
   in SVG. Every line is generated with a slight human wobble,
   then "drawn" on screen with an animated dash.
   ========================================================== */

const Scene = (() => {
    const NS = 'http://www.w3.org/2000/svg';
    const VB_W = 1600, VB_H = 900;
    const HOUSE = { x: 820, y: 560 };   // ground zero
    const INK = '#34322d';

    let svg, fxSvg, fgSvg, washCanvas, ruinCanvas, boilEls = [], land, washes, sunG, smoke, flutters, wingNear, wingFar, trails, ruins, grassG, sunRays, blades, clouds, birds, plane, prop, bomb, shadow;
    let batches = [];
    let rand;

    /* ---------- tiny helpers ---------- */
    function seeded(a) {
        return function () {
            a |= 0; a = a + 0x6D2B79F5 | 0;
            let t = Math.imul(a ^ a >>> 15, 1 | a);
            t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
            return ((t ^ t >>> 14) >>> 0) / 4294967296;
        };
    }
    const r = (a, b) => a + (b - a) * rand();
    const f = n => Math.round(n * 10) / 10;

    function el(tag, attrs, parent) {
        const e = document.createElementNS(NS, tag);
        for (const k in attrs) e.setAttribute(k, attrs[k]);
        if (parent) parent.appendChild(e);
        return e;
    }

    /* One hand-drawn stroke: overshoots its ends a little and bows slightly. */
    function rline(x1, y1, x2, y2, j = 1) {
        const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1;
        const ux = dx / len, uy = dy / len, nx = -uy, ny = ux;
        const o = Math.min(len * 0.05, 4) * j;
        const bow = Math.min(len * 0.025, 3) * j;
        const a = [x1 - ux * r(0, o) + nx * r(-0.8, 0.8) * j, y1 - uy * r(0, o) + ny * r(-0.8, 0.8) * j];
        const b = [x2 + ux * r(0, o) + nx * r(-0.8, 0.8) * j, y2 + uy * r(0, o) + ny * r(-0.8, 0.8) * j];
        const k1 = r(0.2, 0.4), k2 = r(0.6, 0.8), b1 = r(-bow, bow), b2 = r(-bow, bow);
        return `M${f(a[0])} ${f(a[1])}C${f(x1 + dx * k1 + nx * b1)} ${f(y1 + dy * k1 + ny * b1)} ${f(x1 + dx * k2 + nx * b2)} ${f(y1 + dy * k2 + ny * b2)} ${f(b[0])} ${f(b[1])}`;
    }

    /* Smooth curve through points (Catmull-Rom), each point nudged by hand. */
    function curve(pts, j = 1) {
        const P = pts.map(([x, y]) => [x + r(-j, j), y + r(-j, j)]);
        let d = `M${f(P[0][0])} ${f(P[0][1])}`;
        for (let i = 0; i < P.length - 1; i++) {
            const p0 = P[i - 1] || P[i], p1 = P[i], p2 = P[i + 1], p3 = P[i + 2] || p2;
            d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])} ${f(p2[1])}`;
        }
        return d;
    }

    /* A polygon as separate rough edges, so each edge draws in turn. */
    function poly(pts, j = 1, closed = true) {
        const out = [];
        const n = closed ? pts.length : pts.length - 1;
        for (let i = 0; i < n; i++) {
            const a = pts[i], b = pts[(i + 1) % pts.length];
            out.push(rline(a[0], a[1], b[0], b[1], j));
        }
        return out;
    }

    /* Parallel pencil hatching clipped to a polygon, merged into one path. */
    function hatch(pts, angleDeg, gap, j = 0.5) {
        const a = angleDeg * Math.PI / 180, ca = Math.cos(a), sa = Math.sin(a);
        const rp = pts.map(([x, y]) => [x * ca + y * sa, -x * sa + y * ca]);
        const ys = rp.map(p => p[1]);
        let d = '';
        for (let y = Math.min(...ys) + gap * 0.5; y < Math.max(...ys); y += gap * r(0.85, 1.15)) {
            const xs = [];
            for (let i = 0; i < rp.length; i++) {
                const p = rp[i], q = rp[(i + 1) % rp.length];
                if ((p[1] <= y && q[1] > y) || (q[1] <= y && p[1] > y)) xs.push(p[0] + (y - p[1]) * (q[0] - p[0]) / (q[1] - p[1]));
            }
            xs.sort((m, n) => m - n);
            for (let i = 0; i + 1 < xs.length; i += 2) {
                const x1 = xs[i] + r(0, 1.5), x2 = xs[i + 1] - r(0, 1.5);
                if (x2 - x1 < 2) continue;
                d += rline(x1 * ca - y * sa, x1 * sa + y * ca, x2 * ca - y * sa, x2 * sa + y * ca, j);
            }
        }
        return d;
    }

    function scribble(cx, cy, rx, ry, n = 60) {
        const pts = [];
        for (let i = 0; i < n; i++) {
            const a = i * 0.52 + r(-0.15, 0.15), k = r(0.35, 1);
            pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
        }
        return curve(pts, 1.5);
    }

    function cloudPts(cx, cy, w) {
        const pts = [], h = w * 0.34, ph = r(0, 6);
        for (let i = 0; i <= 36; i++) {
            const a = Math.PI + (i / 36) * Math.PI * 2;
            let x = cx + Math.cos(a) * w / 2;
            let y = cy + Math.sin(a) * h / 2;
            if (Math.sin(a) < 0) y -= Math.abs(Math.sin(a * 3.5 + ph)) * h * 0.45 * -Math.sin(a);
            else y = Math.min(y, cy + h * 0.18);
            pts.push([x, y]);
        }
        return pts;
    }

    /* ---------- drawing schedule ---------- */
    const STYLE = {
        bold:  { w: 2.2, o: 0.92 },
        main:  { w: 1.7, o: 0.88 },
        light: { w: 1.15, o: 0.6 },
        faint: { w: 0.9, o: 0.42 },
        hatch: { w: 0.85, o: 0.5 },
    };

    function path(parent, d, s) {
        const e = el('path', {
            d, fill: 'none', stroke: INK, 'stroke-width': s.w, 'stroke-opacity': s.o,
            'stroke-linecap': 'round', 'stroke-linejoin': 'round'
        }, parent);
        if (d) boilEls.push(e);
        return e;
    }

    /* "Line boil" the cheap way: each stroke is pushed around by a smooth noise field,
       three times over, and the drawing flips between those takes a few times a second.
       (A live SVG turbulence filter does the same but costs the browser far too much.) */
    function vnoise(x, y, k) {
        const h = (i, j) => { const s = Math.sin(i * 127.1 + j * 311.7 + k * 74.7) * 43758.5453; return s - Math.floor(s); };
        const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
        const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
        const a = h(xi, yi), b = h(xi + 1, yi), c = h(xi, yi + 1), dd = h(xi + 1, yi + 1);
        return a + (b - a) * u + (c - a) * v + (a - b - c + dd) * u * v;
    }
    function prepareBoil() {
        boilEls.forEach(e => {
            const d0 = e.getAttribute('d');
            const amp = e.closest('#plane, #bomb') ? 1.4 : 3.2;
            e._takes = [d0, wobbleD(d0, 1, amp), wobbleD(d0, 2, amp)];
        });
    }
    // rewrite every "x y" coordinate pair of an absolute path (M, L, C, Q, Z only)
    function wobbleD(d, k, amp) {
        const nums = d.match(/-?\d*\.?\d+/g) || [];
        const out = [];
        for (let i = 0; i + 1 < nums.length; i += 2) {
            const x = +nums[i], y = +nums[i + 1], fx = 0.035;
            out.push(f(x + (vnoise(x * fx, y * fx, k) - 0.5) * amp), f(y + (vnoise(x * fx + 9.2, y * fx + 3.7, k) - 0.5) * amp));
        }
        let j = 0;
        return d.replace(/-?\d*\.?\d+/g, () => out[j++] ?? '0');
    }

    /* draw(): queue strokes to be drawn one after another inside [t0, t0 + dur] */
    function draw(parent, ds, t0, dur, s = STYLE.main) {
        const list = (Array.isArray(ds) ? ds : [ds]).filter(Boolean);
        batches.push({ els: list.map(d => path(parent, d, s)), t0, dur });
    }

    /* ---------- build ---------- */
    function defs() {
        const d = el('defs', {}, svg);
        // watercolour: wobbly bleeding edges and a soft blur
        const wash = el('filter', { id: 'wash', x: '-10%', y: '-10%', width: '120%', height: '120%' }, d);
        el('feTurbulence', { type: 'fractalNoise', baseFrequency: '0.012', numOctaves: '3', seed: '4', result: 'n' }, wash);
        el('feDisplacementMap', { in: 'SourceGraphic', in2: 'n', scale: '34', xChannelSelector: 'R', yChannelSelector: 'G', result: 'd' }, wash);
        el('feGaussianBlur', { in: 'd', stdDeviation: '1.4' }, wash);

        // the house and the tree are solid: hills and hatching behind them stop at their outlines
        const occ = el('mask', { id: 'behindHouse', maskUnits: 'userSpaceOnUse', x: -200, y: -200, width: 2000, height: 1300 }, d);
        el('rect', { x: -200, y: -200, width: 2000, height: 1300, fill: '#fff' }, occ);
        el('path', { d: 'M762 543 L800 503 L863 500 L893 531 L887 533 L887 582 L830 590 L768 590 Z', fill: '#000' }, occ);
        el('rect', { x: 844, y: 489, width: 13, height: 24, fill: '#000' }, occ);
        el('ellipse', { cx: 936, cy: 512, rx: 44, ry: 40, fill: '#000' }, occ);
        el('rect', { x: 928, y: 538, width: 15, height: 54, fill: '#000' }, occ);

        const sh = el('radialGradient', { id: 'shadowG' }, d);
        el('stop', { offset: '0', 'stop-color': '#3b3a2c', 'stop-opacity': '1' }, sh);
        el('stop', { offset: '1', 'stop-color': '#3b3a2c', 'stop-opacity': '0' }, sh);

        const soft = el('filter', { id: 'soft', x: '-50%', y: '-200%', width: '200%', height: '500%' }, d);
        el('feGaussianBlur', { stdDeviation: '5' }, soft);

        const sky = el('linearGradient', { id: 'skyG', x1: '0', y1: '0', x2: '0', y2: '1' }, d);
        el('stop', { offset: '0', 'stop-color': '#6fa8d6' }, sky);
        el('stop', { offset: '1', 'stop-color': '#cfe6f1' }, sky);
        const field = el('linearGradient', { id: 'fieldG', x1: '0', y1: '0', x2: '0', y2: '1' }, d);
        el('stop', { offset: '0', 'stop-color': '#c8cf86' }, field);
        el('stop', { offset: '1', 'stop-color': '#94b35a' }, field);
        const apo = el('linearGradient', { id: 'apoSky', x1: '0', y1: '0', x2: '0', y2: '1' }, d);
        el('stop', { offset: '0', 'stop-color': '#140b09' }, apo);
        el('stop', { offset: '0.55', 'stop-color': '#4a1c10' }, apo);
        el('stop', { offset: '1', 'stop-color': '#d0581e' }, apo);
        const sun = el('radialGradient', { id: 'sunG' }, d);
        el('stop', { offset: '0', 'stop-color': '#ffe08a', 'stop-opacity': '1' }, sun);
        el('stop', { offset: '0.45', 'stop-color': '#ffd766', 'stop-opacity': '0.75' }, sun);
        el('stop', { offset: '1', 'stop-color': '#ffd766', 'stop-opacity': '0' }, sun);
    }

    function buildWashes() {
        washes = el('g', { id: 'washes', filter: 'url(#wash)', display: 'none' }, svg);
        el('rect', { id: 'skyWash', x: -100, y: -100, width: 1800, height: 640, fill: 'url(#skyG)', opacity: 0.5 }, washes);
        el('path', { id: 'fieldWash', d: 'M-100 520 C 300 500 640 492 900 510 S 1400 490 1700 500 L1700 1000 L-100 1000 Z', fill: 'url(#fieldG)', opacity: 0.5 }, washes);
        el('path', { id: 'hillWash', mask: 'url(#behindHouse)', d: 'M-100 520 C200 500 420 512 640 494 C 900 512 1150 488 1400 506 L1700 498 L1700 560 L-100 562 Z', fill: '#8fb08a', opacity: 0.42 }, washes);
        el('path', { id: 'pathWash', d: 'M640 900 C 700 780 770 680 793 590 L808 590 C 840 680 900 780 1010 900 Z', fill: '#d6b27c', opacity: 0.55 }, washes);
        const hw = el('g', { id: 'houseWash' }, washes);
        el('path', { d: 'M800 506 L861 503 L890 531 L834 539 Z', fill: '#b5523b', opacity: 0.6 }, hw);
        el('path', { d: 'M766 540 L800 506 L834 538 Z', fill: '#b5523b', opacity: 0.35 }, hw);
        el('path', { d: 'M770 540 L830 538 L830 588 L770 588 Z', fill: '#f6efe0', opacity: 0.7 }, hw);
        el('path', { d: 'M830 538 L885 532 L885 580 L830 588 Z', fill: '#c9b48e', opacity: 0.55 }, hw);
        el('ellipse', { id: 'treeWash', cx: 936, cy: 512, rx: 42, ry: 38, fill: '#6f9a52', opacity: 0.55 }, washes);
        el('ellipse', { cx: 312, cy: 540, rx: 34, ry: 14, fill: '#6f9a52', opacity: 0.4 }, washes);
        el('ellipse', { cx: 1330, cy: 545, rx: 22, ry: 10, fill: '#6f9a52', opacity: 0.4 }, washes);
    }

    function buildLand() {
        land = el('g', { id: 'land' }, svg);

        // rolling ridges on the horizon (behind the house)
        const far = el('g', { id: 'far', mask: 'url(#behindHouse)' }, land);
        draw(far, curve([[-60, 520], [200, 500], [420, 514], [640, 494], [900, 512], [1150, 488], [1400, 506], [1660, 496]], 1.5), 0, 1.3, STYLE.light);
        draw(far, curve([[-60, 562], [260, 546], [560, 560], [900, 549], [1200, 562], [1660, 550]], 1.2), 0.35, 1.2, STYLE.main);
        // hatching that thins out toward its ends instead of stopping in a box
        draw(far, hatch([[-60, 524], [200, 505], [420, 518], [560, 506], [500, 532], [380, 548], [160, 552], [-60, 556]], 18, 7), 1.2, 0.7, STYLE.faint);
        draw(far, hatch([[1240, 498], [1400, 510], [1660, 500], [1660, 548], [1420, 552], [1300, 534]], -16, 7), 1.3, 0.7, STYLE.faint);

        // far trees on the ridge
        draw(land, scribble(312, 538, 32, 13, 40), 1.4, 0.6, STYLE.light);
        draw(land, scribble(352, 542, 18, 9, 26), 1.6, 0.4, STYLE.light);
        draw(land, scribble(1330, 545, 22, 10, 30), 1.5, 0.5, STYLE.light);

        // the dirt path leading home
        draw(land, curve([[640, 900], [720, 780], [770, 680], [793, 592]], 1), 1.0, 0.8, STYLE.main);
        draw(land, curve([[1010, 900], [900, 780], [840, 680], [808, 592]], 1), 1.15, 0.8, STYLE.main);

        // the farmhouse — gable end facing us, side wall receding
        const house = el('g', { id: 'house' }, land);
        const front = [[770, 540], [830, 538], [830, 588], [770, 588]];
        const side = [[830, 538], [885, 532], [885, 580], [830, 588]];
        draw(house, poly(front, 0.5), 1.7, 0.6, STYLE.bold);
        draw(house, poly(side, 0.5), 2.1, 0.5, STYLE.bold);
        draw(house, [rline(764, 542, 800, 505, 0.4), rline(800, 505, 836, 540, 0.4)], 2.4, 0.4, STYLE.bold);
        draw(house, [rline(800, 505, 862, 502, 0.4), rline(862, 502, 891, 531, 0.4), rline(891, 531, 836, 540, 0.4)], 2.65, 0.45, STYLE.bold);
        draw(house, poly([[846, 512], [846, 492], [855, 491], [855, 509]], 0.3, false), 2.95, 0.25, STYLE.main);
        draw(house, poly([[793, 588], [793, 562], [807, 562], [807, 588]], 0.3, false), 3.05, 0.25, STYLE.main);
        draw(house, [...poly([[776, 552], [788, 552], [788, 566], [776, 566]], 0.3), rline(782, 552, 782, 566, 0.2), rline(776, 559, 788, 559, 0.2)], 3.2, 0.3, STYLE.light);
        draw(house, [...poly([[812, 552], [824, 552], [824, 566], [812, 566]], 0.3), rline(818, 552, 818, 566, 0.2), rline(812, 559, 824, 559, 0.2)], 3.35, 0.3, STYLE.light);
        draw(house, [...poly([[796, 519], [804, 519], [804, 529], [796, 529]], 0.2)], 3.45, 0.2, STYLE.light);
        draw(house, [...poly([[842, 550], [853, 549], [853, 563], [842, 564]], 0.3), ...poly([[864, 547], [874, 546], [874, 559], [864, 560]], 0.3)], 3.55, 0.35, STYLE.light);
        draw(house, hatch(side, 62, 3.4, 0.3), 3.6, 0.5, STYLE.hatch);
        draw(house, hatch([[800, 505], [862, 502], [891, 531], [836, 540]], -24, 3.2, 0.3), 3.7, 0.5, STYLE.hatch);
        draw(house, hatch([[885, 580], [930, 586], [900, 592], [830, 592], [830, 588]], 8, 2.6, 0.3), 3.85, 0.3, STYLE.hatch);

        // the shade tree beside the house
        draw(land, [rline(931, 590, 933, 540, 0.6), rline(940, 590, 938, 542, 0.6)], 2.8, 0.4, STYLE.main);
        draw(el('g', { id: 'treeTop' }, land), scribble(936, 512, 40, 36, 70), 3.0, 1.0, STYLE.light);

        // windmill: tapered lattice tower
        const legs = [rline(686, 592, 698, 478, 0.4), rline(714, 592, 704, 478, 0.4)];
        const braces = [];
        for (let i = 0; i < 4; i++) {
            const y1 = 592 - i * 28, y2 = y1 - 28;
            const w1 = 14 - i * 2.6, w2 = 14 - (i + 1) * 2.6;
            braces.push(rline(700 - w1, y1, 700 + w2, y2, 0.3), rline(700 + w1, y1, 700 - w2, y2, 0.3));
        }
        const mill = el('g', { id: 'windmill' }, land);
        draw(mill, legs, 2.4, 0.4, STYLE.main);
        draw(mill, braces, 2.75, 0.6, STYLE.faint);
        draw(mill, [rline(701, 472, 738, 470, 0.3), ...poly([[730, 462], [744, 458], [744, 480], [730, 477]], 0.3)], 3.3, 0.3, STYLE.main);

        // fence posts receding toward the house
        const posts = [], rails = [];
        let prev = null;
        for (let i = 0; i < 9; i++) {
            const k = Math.pow(i / 8, 0.62);
            const x = 60 + (680 - 60) * k, y = 860 + (600 - 860) * k;
            const h = 130 * (1 - k) + 14 * k, w = 9 * (1 - k) + 2 * k;
            posts.push(...poly([[x - w / 2, y], [x - w / 2, y - h], [x + w / 2, y - h * 1.02], [x + w / 2, y]], 0.5, false));
            if (prev) rails.push(rline(prev.x, prev.y - prev.h * 0.85, x, y - h * 0.85, 0.6), rline(prev.x, prev.y - prev.h * 0.45, x, y - h * 0.45, 0.6));
            prev = { x, y, h };
        }
        const fence = el('g', { id: 'fence' }, land);
        draw(fence, posts, 3.2, 1.1, STYLE.main);
        draw(fence, rails, 3.9, 0.8, STYLE.light);

        // field marks: sparse far away, longer up close
        let marks = '';
        for (let i = 0; i < 260; i++) {
            const y = 575 + Math.pow(rand(), 1.6) * 260;
            const x = r(-60, 1660);
            if (y < 600 && Math.abs(x - 820) < 90) continue;
            const s = 2 + (y - 570) * 0.05;
            marks += rline(x, y, x + r(-0.4, 0.4) * s, y - s * r(0.8, 1.6), 0.3);
        }
        draw(land, marks, 3.8, 1.0, STYLE.faint);

        // the sun and its rays — in their own group so the sun stays in view on narrow screens
        sunG = el('g', { id: 'sun' }, fxSvg);
        el('circle', { class: 'cfill', cx: 1270, cy: 190, r: 140, fill: 'url(#sunG)', opacity: 0 }, sunG);
        draw(sunG, [curve(Array.from({ length: 21 }, (_, i) => [1270 + Math.cos(i / 20 * 6.4) * 44, 190 + Math.sin(i / 20 * 6.4) * 44]), 1.2)], 4.3, 0.8, STYLE.main);
        sunRays = el('g', { id: 'sunRays' }, sunG);
        const rays = [];
        for (let i = 0; i < 14; i++) {
            const a = i / 14 * Math.PI * 2;
            rays.push(rline(1270 + Math.cos(a) * 60, 190 + Math.sin(a) * 60, 1270 + Math.cos(a) * r(80, 92), 190 + Math.sin(a) * r(80, 92), 0.4));
        }
        draw(sunRays, rays, 4.7, 0.7, STYLE.light);

        // windmill blades live in their own group so they can turn
        blades = el('g', { id: 'blades' }, fxSvg);
        const bl = [];
        for (let i = 0; i < 12; i++) {
            const a = i / 12 * Math.PI * 2;
            bl.push(rline(701, 472, 701 + Math.cos(a) * 30, 472 + Math.sin(a) * 30, 0.3));
        }
        bl.push(curve(Array.from({ length: 17 }, (_, i) => [701 + Math.cos(i / 16 * 6.3) * 31, 472 + Math.sin(i / 16 * 6.3) * 31]), 0.6));
        draw(blades, bl, 3.4, 0.6, STYLE.light);
        buildRuins();
        el('circle', { id: 'groundZero', cx: HOUSE.x, cy: HOUSE.y, r: 0.5, fill: 'none' }, svg);
    }

    /* what is left afterwards: wall stumps, a fallen roof, planks, a stripped tree */
    function buildRuins() {
        ruins = el('g', { id: 'ruins', style: 'display:none' }, svg);
        el('ellipse', { cx: 820, cy: 594, rx: 150, ry: 16, fill: '#140c08', opacity: 0.55 }, ruins);
        const st = [
            ...poly([[770, 588], [770, 566], [776, 573], [781, 559], [786, 571], [791, 588]], 0.5, false),
            ...poly([[838, 587], [841, 568], [849, 575], [856, 561], [864, 574], [872, 567], [881, 580]], 0.5, false),
            ...poly([[846, 581], [846, 566], [854, 568], [855, 582]], 0.4, false),
            ...poly([[795, 587], [830, 571], [862, 585], [824, 593]], 0.5),
        ];
        st.forEach(d => path(ruins, d, STYLE.bold));
        path(ruins, hatch([[795, 587], [830, 571], [862, 585], [824, 593]], -20, 2.6, 0.3), STYLE.hatch);
        let planks = '';
        for (let i = 0; i < 26; i++) {
            const x = r(700, 950), y = r(586, 604), a = r(-0.6, 0.6), l = r(6, 20);
            planks += rline(x, y, x + Math.cos(a) * l, y + Math.sin(a) * l * 0.4, 0.3);
        }
        path(ruins, planks, STYLE.main);
        [[933, 545, 958, 518], [935, 556, 962, 548], [933, 538, 946, 506], [944, 526, 960, 520]].forEach(([a, b, c, e]) => path(ruins, rline(a, b, c, e, 0.4), STYLE.main));
    }

    function buildClouds() {
        clouds = [];
        [[320, 210, 270, 4.6], [1000, 140, 200, 4.9], [1480, 280, 230, 5.2]].forEach(([cx, cy, w, t]) => {
            const g = el('g', { class: 'cloud' }, fxSvg);
            const pts = cloudPts(cx, cy, w);
            el('path', { class: 'cfill', d: curve(pts, 0) + 'Z', fill: '#fbf9f3', opacity: 0 }, g);
            draw(g, curve(pts, 1.5), t, 1.0, STYLE.light);
            draw(g, hatch(pts.filter((_, i) => i > 20), -10, 4, 0.3), t + 0.8, 0.4, STYLE.faint);
            clouds.push({ g, x: 0, speed: r(5, 9) });
        });
    }

    function buildGrass() {
        grassG = el('g', { id: 'grass' }, fgSvg);
        for (let i = 0; i < 30; i++) {
            const bx = -40 + i * 57 + r(-18, 18), by = 905;
            if (bx > 640 && bx < 1000 && rand() < 0.7) continue;  // keep the path mostly clear
            const g = el('g', { class: 'tuft', style: `animation-duration:${f(r(2.6, 4.2))}s;animation-delay:-${f(r(0, 3))}s` }, grassG);
            let d = '';
            const n = 6 + Math.floor(r(0, 6)), h = r(55, 120);
            for (let k = 0; k < n; k++) {
                const x = bx + r(-16, 16), hh = h * r(0.5, 1), lean = r(-26, 26);
                d += `M${f(x)} ${by}Q${f(x + lean * 0.2)} ${f(by - hh * 0.6)} ${f(x + lean)} ${f(by - hh)}`;
            }
            draw(g, d, 5.0 + rand() * 0.6, 0.6, STYLE.main);
            if (rand() < 0.35) {
                const fx = bx + r(-10, 10), fy = by - h * r(0.8, 1.1);
                draw(g, [`M${f(fx)} ${by}Q${f(fx + 4)} ${f(fy + 30)} ${f(fx)} ${f(fy)}`, curve(Array.from({ length: 9 }, (_, k) => [fx + Math.cos(k / 8 * 6.4) * 5, fy + Math.sin(k / 8 * 6.4) * 5]), 0.5)], 5.5, 0.4, STYLE.light);
            }
        }
    }

    function buildBirds() {
        birds = el('g', { id: 'birds', opacity: 0 }, fxSvg);
        for (let i = 0; i < 6; i++) path(birds, '', STYLE.main);
    }

    /* chimney smoke: little pencil curls that rise, swell and fade */
    function buildSmoke() {
        smoke = el('g', { id: 'smoke', opacity: 0 }, fxSvg);
        for (let i = 0; i < 6; i++) {
            const pts = Array.from({ length: 14 }, (_, k) => {
                const a = k / 13 * Math.PI * 2.6, rr = 3 + k * 0.45;
                return [Math.cos(a) * rr, Math.sin(a) * rr * 0.8];
            });
            path(smoke, curve(pts, 0.4), STYLE.light);
        }
    }

    /* two butterflies over the grass */
    function buildFlutters() {
        flutters = el('g', { id: 'flutters', opacity: 0 }, fxSvg);
        for (let i = 0; i < 2; i++) {
            const g = el('g', {}, flutters);
            const w = el('g', {}, g);
            path(w, curve([[0, 0], [-5, -7], [-9, -4], [-6, 1], [0, 0]], 0.2) + curve([[0, 0], [-6, 3], [-4, 6], [0, 1]], 0.2), STYLE.main);
            path(w, curve([[0, 0], [5, -7], [9, -4], [6, 1], [0, 0]], 0.2) + curve([[0, 0], [6, 3], [4, 6], [0, 1]], 0.2), STYLE.main);
            el('path', { d: 'M-5 -3 L-3 -5 L-7 -4 Z M5 -3 L3 -5 L7 -4 Z', fill: i ? '#e0a03a' : '#6aa8d8', opacity: 0.8 }, w);
        }
    }

    /* a war eagle built like a Concorde: needle body, drooping hooked beak,
       swept delta wings, the bomb clamped in its talons */
    function buildPlane() {
        plane = el('g', { id: 'plane', opacity: 0 }, fxSvg);
        // contrails and speed lines are redrawn every frame behind the bird
        trails = el('g', {}, plane);
        for (let i = 0; i < 6; i++) path(trails, '', i < 2 ? STYLE.light : STYLE.faint);
        const body = el('g', {}, plane);

        const farWing = [[22, -6], [0, -13], [-28, -25], [-60, -38], [-74, -32], [-80, -18], [-82, -6]];
        const nearWing = [[24, 3], [4, 8], [-22, 17], [-50, 31], [-74, 44], [-86, 33], [-84, 18], [-86, 6]];
        wingFar = el('g', {}, body);
        el('path', { d: curve(farWing, 0) + 'Z', fill: '#6b4a30', opacity: 0.6 }, wingFar);
        path(wingFar, curve(farWing.slice(0, 4), 0.4), STYLE.light);
        path(wingFar, poly(farWing.slice(3), 0.3, false).join(''), STYLE.light);
        [[-60, -38, -82, -44], [-64, -35, -85, -38], [-68, -31, -86, -31]].forEach(([a, b, c, d]) => path(wingFar, rline(a, b, c, d, 0.2), STYLE.light));

        const bodyPts = [[28, -8], [0, -8], [-40, -6], [-80, -3], [-80, 3], [-40, 9], [0, 11], [28, 8]];
        el('path', { d: curve(bodyPts, 0) + 'Z', fill: '#3d2414', opacity: 0.85 }, body);
        const head = [[28, -8], [40, -9], [52, -6], [66, -4], [56, 3], [44, 7], [28, 8], [25, 4], [29, 1], [24, -2], [28, -5]];
        el('path', { d: curve(head, 0) + 'Z', fill: '#fbf8f0' }, body);
        const tail = [[-80, -3], [-112, -6], [-120, 0], [-112, 5], [-80, 3]];
        el('path', { d: curve(tail, 0) + 'Z', fill: '#fbf8f0', opacity: 0.95 }, body);
        el('path', { d: 'M52 -6 C 62 -5 74 -2 80 1 C 80 4 77 5 75 4 C 70 3 62 3 56 3 Z', fill: '#f0b429' }, body);
        el('path', { d: 'M41 -5.5 L52 -7.5 L54.5 -4.2 L44 -3 Z', fill: '#ffb21a' }, body);
        el('circle', { cx: 49.5, cy: -5.3, r: 1.6, fill: '#111' }, body);
        [
            curve([[28, -8], [0, -8], [-40, -6], [-80, -3]], 0.5),
            curve([[28, 8], [0, 11], [-40, 9], [-80, 3]], 0.5),
            curve([[28, -8], [40, -9], [52, -6]], 0.3),
            curve([[52, -6], [66, -4], [80, 1], [76, 4.5]], 0.2),
            curve([[76, 4.5], [66, 3], [56, 3]], 0.2),
            curve([[56, 3], [44, 7], [28, 8]], 0.3),
            poly([[28, -8], [25, -4], [29, -1], [24, 2], [28, 8]], 0.3, false).join(''),
            curve(tail, 0.4),
            rline(-82, -1, -114, -3, 0.2) + rline(-82, 1, -114, 3, 0.2),
            // talons gripping the bomb
            rline(8, 10, 12, 21, 0.2) + rline(-3, 10, 0, 21, 0.2),
            curve([[8, 21], [13, 20], [15, 24]], 0.1) + curve([[-4, 21], [1, 20], [3, 24]], 0.1),
        ].forEach(d => path(body, d, STYLE.main));
        // the scowl: a heavy brow cut down over the eye
        path(body, rline(36, -11.5, 56, -5.6, 0.15), { w: 3.6, o: 0.95 });
        path(body, hatch([[28, 8], [0, 11], [-40, 9], [-80, 3], [-80, 1], [28, 1]], 70, 3, 0.2), STYLE.hatch);

        wingNear = el('g', {}, body);
        el('path', { d: curve(nearWing, 0) + 'Z', fill: '#4a2c18', opacity: 0.88 }, wingNear);
        path(wingNear, curve(nearWing.slice(0, 5), 0.4), STYLE.main);
        let edge = '';                                   // a feathered, saw-toothed trailing edge
        for (let i = 0; i < 7; i++) {
            const k = i / 7, x = -74 - k * 12 + (i % 2) * 4, y = 44 - k * 38;
            edge += rline(x, y, -84 - (k + 1 / 7) * 2 + ((i + 1) % 2) * 4, 44 - (k + 1 / 7) * 38, 0.2);
        }
        path(wingNear, edge, STYLE.main);
        path(wingNear, hatch(nearWing, 35, 3.4, 0.2), STYLE.hatch);
        // primary feathers splayed off the wingtip like fingers
        [[-74, 44, -98, 50], [-77, 41, -100, 44], [-80, 37, -101, 38], [-82, 33, -100, 32]].forEach(([a, b, c, d]) => {
            el('path', { d: `M${a} ${b} L${c} ${d} L${a - 4} ${b - 3} Z`, fill: '#3d2414', opacity: 0.9 }, wingNear);
            path(wingNear, rline(a, b, c, d, 0.2), STYLE.main);
        });
        path(wingNear, curve([[18, 4], [-20, 20], [-60, 38]], 0.3), STYLE.light);
        prop = null;

        shadow = el('ellipse', { id: 'planeShadow', cx: 0, cy: 712, rx: 52, ry: 7, fill: 'url(#shadowG)', opacity: 0 }, fxSvg);

        bomb = el('g', { id: 'bomb', opacity: 0 }, fxSvg);
        const bb = el('g', {}, bomb);
        // a fat, rounded bomb with a box tail
        const egg = Array.from({ length: 25 }, (_, i) => {
            const a = i / 24 * Math.PI * 2;
            return [Math.cos(a) * (Math.cos(a) > 0 ? 15 : 12), Math.sin(a) * 9.5];
        });
        [curve(egg, 0.2), ...poly([[-11, -6], [-24, -7], [-24, 7], [-11, 6]], 0.2, false), rline(-24, -7, -24, 7, 0.1),
         rline(-18, -6.5, -18, 6.5, 0.1), rline(2, -9.3, 2, 9.3, 0.1), rline(7, -8.5, 7, 8.5, 0.1)]
            .forEach(d => path(bb, d, STYLE.main));
        path(bb, hatch([[-12, 1], [15, 1], [12, 6], [0, 9.5], [-10, 7]], 70, 2.2, 0.1), STYLE.hatch);
    }

    function build(host) {
        rand = seeded(7);
        batches = [];
        // three stacked layers, so whatever moves only repaints itself:
        // the landscape, the things in the air, and the grass in front
        const layer = id => el('svg', {
            id, class: 'layer', viewBox: `0 0 ${VB_W} ${VB_H}`, preserveAspectRatio: 'xMidYMid slice',
            xmlns: NS, 'aria-hidden': 'true'
        });
        svg = layer('scene');
        fxSvg = layer('sceneFx');
        fgSvg = layer('sceneFg');
        defs();
        buildWashes();
        buildClouds();
        buildLand();
        buildBirds();
        buildSmoke();
        buildPlane();
        buildFlutters();
        buildGrass();
        host.appendChild(svg);
        host.appendChild(fxSvg);
        host.appendChild(fgSvg);

        // every queued stroke starts hidden behind its own dash; pathLength=1 keeps the dash
        // right whichever wobbled take of the line is showing
        batches.forEach(b => {
            b.lens = b.els.map(e => e.getTotalLength() || 1);
            b.els.forEach(e => {
                e.setAttribute('pathLength', '1');
                e.style.strokeDasharray = '1.01 1.01';
                e.style.strokeDashoffset = '1.01';
            });
        });
        prepareBoil();

        washCanvas = document.createElement('canvas');
        washCanvas.className = 'washes';
        host.insertBefore(washCanvas, svg);
        return svg;
    }

    /* Paint the watercolour once into canvases (the day and the burnt aftermath), so the
       expensive wash filter never runs while anything is moving. */
    async function rasterWashes(ruined) {
        const k = Math.min(devicePixelRatio || 1, 1.5) * 0.6;          // soft paint needs few pixels
        const W = Math.max(2, Math.round(innerWidth * k)), H = Math.max(2, Math.round(innerHeight * k));
        const s = svg.cloneNode(false);
        s.setAttribute('width', W);
        s.setAttribute('height', H);
        s.appendChild(svg.querySelector('defs').cloneNode(true));
        const w = washes.cloneNode(true);
        w.removeAttribute('display');
        s.appendChild(w);
        if (ruined) ruin(s, true);
        const img = new Image();
        img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(new XMLSerializer().serializeToString(s));
        await img.decode();
        const c = document.createElement('canvas');
        c.width = W; c.height = H;
        c.getContext('2d').drawImage(img, 0, 0, W, H);
        return c;
    }

    async function prepare() {
        const day = await rasterWashes(false);
        washCanvas.width = day.width; washCanvas.height = day.height;
        washCanvas.getContext('2d').drawImage(day, 0, 0);
        ruinCanvas = await rasterWashes(true);
    }

    /* Animate every stroke in. Returns the time (s) the last stroke finishes. */
    function startDrawing(offset, slow = 1) {
        let end = 0;
        batches.forEach(b => {
            const b0 = b.t0 * slow, bd = b.dur * slow;
            const total = b.lens.reduce((s, l) => s + l, 0);
            let cum = 0;
            b.els.forEach((e, i) => {
                const start = b0 + bd * (cum / total);
                const dur = Math.max(0.12, bd * (b.lens[i] / total) * 1.5);
                cum += b.lens[i];
                e.animate(
                    [{ strokeDashoffset: 1.01 }, { strokeDashoffset: 0 }],
                    { duration: dur * 1000, delay: (offset + start) * 1000, easing: 'cubic-bezier(.45,.05,.55,.95)', fill: 'forwards' }
                );
                end = Math.max(end, offset + start + dur);
            });
        });
        return end;
    }

    /* Lock the finished drawing in place (and make it serialisable as an image). */
    function finishDrawing() {
        batches.forEach(b => b.els.forEach(e => {
            e.style.strokeDasharray = 'none';
            e.style.strokeDashoffset = '0';
            e.getAnimations().forEach(a => a.cancel());
        }));
    }

    function paint() {
        svg.parentNode.classList.add('washed');
        washCanvas.classList.add('on');
    }

    /* ---------- per-frame life ---------- */
    let seedClock = 0, seed = 1;
    function visible() {
        const W = innerWidth, H = innerHeight, s = Math.max(W / VB_W, H / VB_H);
        const w = W / s;
        return { left: (VB_W - w) / 2, right: (VB_W + w) / 2, width: w, scale: s };
    }

    function tick(t, dt, state) {
        // line boil — about 7 new hand-drawn "takes" per second
        seedClock += dt;
        if (seedClock > 0.14) {
            seedClock = 0;
            seed = (seed + 1) % 3;
            for (let i = 0; i < boilEls.length; i++) { const e = boilEls[i]; if (e._takes) e.setAttribute('d', e._takes[seed]); }
        }
        blades.setAttribute('transform', `rotate(${f(t * 40)} 701 472)`);
        sunRays.setAttribute('transform', `rotate(${f(t * 3)} 1270 190)`);
        const v = visible();
        sunG.setAttribute('transform', `translate(${f(Math.min(1270, v.right - 120) - 1270)} 0)`);
        clouds.forEach(c => {
            c.x += c.speed * dt;
            c.g.setAttribute('transform', `translate(${f(c.x)} 0)`);
        });

        if (state.birds != null) {
            const bt = t - state.birds;
            birds.setAttribute('opacity', Math.min(1, bt));
            [...birds.children].forEach((p, i) => {
                const flock = i < 3 ? 0 : 1, j = i % 3;
                const x = flock ? v.right + 80 - (bt - 6) * 28 - j * 30 : v.left - 80 + bt * 34 + j * 38 - (j === 1 ? 20 : 0);
                const y = (flock ? 260 : 330) - bt * (flock ? 2 : 6) + j * 16 + Math.sin(bt * 0.8 + i) * 6;
                const flap = Math.sin(bt * 7 + i * 1.9), s = (1 - j * 0.12) * (flock ? 0.8 : 1);
                p.setAttribute('d', `M${f(x - 11 * s)} ${f(y)}Q${f(x - 5 * s)} ${f(y - 7 * flap * s)} ${f(x)} ${f(y)}Q${f(x + 5 * s)} ${f(y - 7 * flap * s)} ${f(x + 11 * s)} ${f(y)}`);
            });
        }

        if (state.smoke != null) {
            const st = t - state.smoke;
            smoke.setAttribute('opacity', Math.min(1, st * 0.5));
            [...smoke.children].forEach((p, i) => {
                const ph = (st * 0.16 + i / 6) % 1;
                const x = 851 + ph * 46 + Math.sin(ph * 7 + i) * 5, y = 488 - ph * 95;
                p.setAttribute('transform', `translate(${f(x)} ${f(y)}) rotate(${f(st * 40 + i * 60)}) scale(${f(0.5 + ph * 1.6)})`);
                p.setAttribute('stroke-opacity', f(Math.sin(ph * Math.PI) * 0.55 * 10) / 10);
            });
        }

        if (state.flutters != null) {
            const ft = t - state.flutters;
            flutters.setAttribute('opacity', Math.min(1, ft));
            [...flutters.children].forEach((g, i) => {
                const cx = i ? Math.min(1180, v.right - 140) : Math.max(420, v.left + 120);
                const x = cx + Math.sin(ft * 0.5 + i * 2) * 60 + Math.sin(ft * 1.3 + i) * 18;
                const y = 760 + Math.sin(ft * 0.7 + i * 3) * 40 + Math.sin(ft * 2.1) * 8;
                g.setAttribute('transform', `translate(${f(x)} ${f(y)}) scale(${i ? 1.1 : 1.3})`);
                g.firstChild.setAttribute('transform', `scale(${f(0.25 + 0.75 * Math.abs(Math.sin(ft * 11 + i)))} 1)`);
            });
        }

        // the eagle: flies straight and level across the sky, beating its wings hard the whole way
        const P = state.plane;
        if (P) {
            const s = v.width < 900 ? 0.75 : 0.95;
            const releaseX = HOUSE.x - 40 * s;
            const speed = Math.max(220, (releaseX - (v.left - 200)) / (P.release - P.enter));
            const x = releaseX + (t - P.release) * speed;
            P.phase = (P.phase || 0) + dt * 2.3;                     // wing beats per second
            const ph = P.phase * Math.PI * 2;
            // a quick, powerful downstroke and a slower recovery
            const flap = Math.sin(ph) * 0.75 + Math.sin(ph * 2) * 0.25;   // +1 wings up, -1 wings down
            const y = 172 - Math.cos(ph) * 5;                         // the body lifts on each downstroke
            const pitch = Math.sin(ph + 0.6) * 2.5;
            P.x = x; P.y = y; P.s = s; P.speed = speed; P.bx = 6; P.by = 27;
            P.beat = Math.floor(P.phase) !== P.lastBeat;
            P.lastBeat = Math.floor(P.phase);
            plane.setAttribute('opacity', t > P.enter - 0.2 ? 1 : 0);
            plane.setAttribute('transform', `translate(${f(x)} ${f(y)}) rotate(${f(pitch)}) scale(${s})`);
            // the near wing is drawn hanging down and the far wing raised: flipping them through the body line flaps them together
            // big, full strokes: at the top the wings tower over the body, at the bottom they hang below it
            const near = -flap * 1.55, farK = flap * 1.4;
            const edge = v => Math.sign(v || 1) * Math.max(0.22, Math.abs(v));   // never fully edge-on
            wingNear.setAttribute('transform', `translate(20 2) rotate(${f(flap * 14)}) scale(${f(1 - Math.abs(flap) * 0.12)} ${f(edge(near))}) translate(-20 -2)`);
            wingFar.setAttribute('transform', `translate(20 -4) rotate(${f(-flap * 10)}) scale(${f(1 - Math.abs(flap) * 0.15)} ${f(edge(farK))}) translate(-20 4)`);
            const flex = flap;
            const len = 120 + Math.min(260, (t - P.enter) * 160);
            const tr = [...trails.children];
            // contrails stream from the body as the wings sweep
            tr[0].setAttribute('d', `M-84 6 L${f(-84 - len)} ${f(6 + flex * 2)}`);
            tr[1].setAttribute('d', `M-84 -4 L${f(-84 - len * 0.8)} ${f(-4 - flex * 2)}`);
            for (let i = 2; i < 6; i++) {
                const yy = -18 + (i - 2) * 12, ph = (t * 3 + i * 0.37) % 1;
                tr[i].setAttribute('d', `M${f(-95 - ph * 60)} ${yy} L${f(-130 - ph * 90)} ${yy}`);
                tr[i].setAttribute('stroke-opacity', f((1 - ph) * 0.5 * 10) / 10);
            }
            shadow.setAttribute('cx', f(x + 10));
            shadow.setAttribute('opacity', 0.08);
            P.pan = Math.max(-1, Math.min(1, (x - (v.left + v.width / 2)) / (v.width / 2)));
            P.near = Math.max(0, 1 - Math.abs(x - (v.left + v.width / 2)) / (v.width * 0.9 + 300));
            if (!state.bomb) {
                bomb.setAttribute('opacity', t > P.enter - 0.2 ? 1 : 0);
                const cr = Math.cos(pitch * Math.PI / 180), sr = Math.sin(pitch * Math.PI / 180);
                bomb.setAttribute('transform', `translate(${f(x + (P.bx * cr - P.by * sr) * s)} ${f(y + (P.bx * sr + P.by * cr) * s)}) rotate(${f(pitch)}) scale(${f(s * 0.8)})`);
            }
        }

        // the bomb: tumbles nose-down and shrinks into the distance
        const B = state.bomb;
        if (B) {
            const p = Math.min(1, (t - B.t0) / B.dur);
            // nice and easy: it eases down, swaying a little as it goes
            const x = B.x0 + (HOUSE.x - B.x0) * (1 - Math.pow(1 - p, 2));
            const y = B.y0 + (HOUSE.y - B.y0) * Math.pow(p, 1.7);
            const vx = (HOUSE.x - B.x0) * 2 * (1 - p), vy = (HOUSE.y - B.y0) * 1.7 * Math.pow(p + 0.02, 0.7);
            const ang = Math.atan2(vy, vx) * 180 / Math.PI;
            bomb.setAttribute('opacity', p < 1 ? 1 : 0);
            bomb.setAttribute('transform', `translate(${f(x)} ${f(y)}) rotate(${f(ang * Math.min(1, p * 3))}) scale(${f(B.s * (1 - p * 0.55))})`);
        }
    }

    function groundZero() {
        const b = svg.querySelector('#groundZero').getBoundingClientRect();
        return { x: b.left + b.width / 2, y: b.top + b.height / 2 };
    }

    /* Render the finished drawing (without plane or bomb) into a canvas for the shader. */
    async function snapshot(paperCanvas, scale, ruined = false) {
        const W = Math.round(innerWidth * scale), H = Math.round(innerHeight * scale);
        const clone = svg.cloneNode(true);
        [fxSvg, fgSvg].forEach(l => [...l.childNodes].forEach(n => clone.appendChild(n.cloneNode(true))));
        ['#plane', '#bomb', '#planeShadow', '#birds', '#smoke', '#flutters', '#washes'].forEach(q => clone.querySelector(q)?.remove());
        clone.removeAttribute('style');
        clone.setAttribute('width', W);
        clone.setAttribute('height', H);
        clone.querySelectorAll('.cfill').forEach(c => c.setAttribute('opacity', '0.85'));
        if (ruined) ruin(clone);
        const src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(new XMLSerializer().serializeToString(clone));
        const img = new Image();
        img.src = src;
        await img.decode();
        const c = document.createElement('canvas');
        c.width = W; c.height = H;
        const x = c.getContext('2d');
        x.fillStyle = x.createPattern(paperCanvas, 'repeat');
        x.fillRect(0, 0, W, H);
        const wc = ruined ? ruinCanvas : washCanvas;
        if (wc && wc.width > 2) x.drawImage(wc, 0, 0, W, H);
        x.drawImage(img, 0, 0, W, H);
        if (ruined) {
            // everything burns: darken through a red-brown filter, then light it from ground zero
            const gz = svg.querySelector('#groundZero').getBoundingClientRect();
            const zx = (gz.left + gz.width / 2) / innerWidth * W, zy = (gz.top + gz.height / 2) / innerHeight * H;
            x.globalCompositeOperation = 'multiply';
            const m = x.createLinearGradient(0, 0, 0, H);
            m.addColorStop(0, '#5a2a1c'); m.addColorStop(0.55, '#c8703c'); m.addColorStop(1, '#9a6646');
            x.fillStyle = m;
            x.fillRect(0, 0, W, H);
            x.globalCompositeOperation = 'screen';
            const g = x.createRadialGradient(zx, zy, 0, zx, zy, Math.max(W, H) * 0.6);
            g.addColorStop(0, 'rgba(255,120,40,0.55)'); g.addColorStop(0.4, 'rgba(160,50,15,0.25)'); g.addColorStop(1, 'rgba(0,0,0,0)');
            x.fillStyle = g;
            x.fillRect(0, 0, W, H);
            x.globalCompositeOperation = 'source-over';
        }
        const v = x.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75);
        v.addColorStop(0, 'rgba(80,60,30,0)');
        v.addColorStop(1, 'rgba(80,60,30,0.2)');
        x.fillStyle = v;
        x.fillRect(0, 0, W, H);
        return c;
    }

    /* turn a clone of the lovely day into its aftermath */
    function ruin(c, washesOnly) {
        const set = (q, fill, op) => { const n = c.querySelector(q); n.setAttribute('fill', fill); n.setAttribute('opacity', op); };
        if (washesOnly) {
            ['#houseWash', '#treeWash'].forEach(q => c.querySelector(q)?.remove());
            c.querySelector('#hillWash').removeAttribute('mask');
            set('#skyWash', 'url(#apoSky)', 1);
            set('#fieldWash', '#6b5038', 0.7);
            set('#hillWash', '#3a2418', 0.8);
            set('#pathWash', '#8a6a48', 0.7);
            return;
        }
        ['#house', '#houseWash', '#treeTop', '#treeWash', '#blades', '#sun', '#smoke'].forEach(q => c.querySelector(q)?.remove());
        c.querySelectorAll('.cloud').forEach(n => n.remove());
        c.querySelector('#ruins').removeAttribute('style');
        // with the house gone, the hills behind it show again
        ['#far', '#hillWash'].forEach(q => c.querySelector(q)?.removeAttribute('mask'));
        c.querySelector('#windmill').setAttribute('transform', 'rotate(-17 700 592)');
        c.querySelector('#fence').setAttribute('transform', 'translate(0 860) skewX(-9) translate(0 -860)');
        c.querySelector('#grass').setAttribute('transform', 'translate(0 905) skewX(-16) translate(0 -905)');
        c.querySelectorAll('.tuft').forEach(n => n.removeAttribute('style'));
        c.querySelector('#ruins').removeAttribute('filter');
    }

    return { build, prepare, startDrawing, finishDrawing, paint, tick, groundZero, snapshot, visible, HOUSE, get plane() { return plane; } };
})();
