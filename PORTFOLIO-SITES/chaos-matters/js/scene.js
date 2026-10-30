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

    let svg, land, washes, sunG, grassG, sunRays, blades, clouds, birds, plane, prop, bomb, shadow;
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
        return el('path', {
            d, fill: 'none', stroke: INK, 'stroke-width': s.w, 'stroke-opacity': s.o,
            'stroke-linecap': 'round', 'stroke-linejoin': 'round'
        }, parent);
    }

    /* draw(): queue strokes to be drawn one after another inside [t0, t0 + dur] */
    function draw(parent, ds, t0, dur, s = STYLE.main) {
        const list = (Array.isArray(ds) ? ds : [ds]).filter(Boolean);
        batches.push({ els: list.map(d => path(parent, d, s)), t0, dur });
    }

    /* ---------- build ---------- */
    function defs() {
        const d = el('defs', {}, svg);
        // the "line boil": a displacement whose noise seed flips a few times a second
        const boil = el('filter', { id: 'boil', x: '-5%', y: '-5%', width: '110%', height: '110%' }, d);
        el('feTurbulence', { id: 'boilNoise', type: 'fractalNoise', baseFrequency: '0.035', numOctaves: '2', seed: '1', result: 'n' }, boil);
        el('feDisplacementMap', { in: 'SourceGraphic', in2: 'n', scale: '3.2', xChannelSelector: 'R', yChannelSelector: 'G' }, boil);

        // watercolour: wobbly bleeding edges and a soft blur
        const wash = el('filter', { id: 'wash', x: '-10%', y: '-10%', width: '120%', height: '120%' }, d);
        el('feTurbulence', { type: 'fractalNoise', baseFrequency: '0.012', numOctaves: '3', seed: '4', result: 'n' }, wash);
        el('feDisplacementMap', { in: 'SourceGraphic', in2: 'n', scale: '34', xChannelSelector: 'R', yChannelSelector: 'G', result: 'd' }, wash);
        el('feGaussianBlur', { in: 'd', stdDeviation: '1.4' }, wash);

        const soft = el('filter', { id: 'soft', x: '-50%', y: '-200%', width: '200%', height: '500%' }, d);
        el('feGaussianBlur', { stdDeviation: '5' }, soft);

        const sky = el('linearGradient', { id: 'skyG', x1: '0', y1: '0', x2: '0', y2: '1' }, d);
        el('stop', { offset: '0', 'stop-color': '#6fa8d6' }, sky);
        el('stop', { offset: '1', 'stop-color': '#cfe6f1' }, sky);
        const field = el('linearGradient', { id: 'fieldG', x1: '0', y1: '0', x2: '0', y2: '1' }, d);
        el('stop', { offset: '0', 'stop-color': '#c8cf86' }, field);
        el('stop', { offset: '1', 'stop-color': '#94b35a' }, field);
        const sun = el('radialGradient', { id: 'sunG' }, d);
        el('stop', { offset: '0', 'stop-color': '#ffe08a', 'stop-opacity': '1' }, sun);
        el('stop', { offset: '0.45', 'stop-color': '#ffd766', 'stop-opacity': '0.75' }, sun);
        el('stop', { offset: '1', 'stop-color': '#ffd766', 'stop-opacity': '0' }, sun);
    }

    function buildWashes() {
        washes = el('g', { id: 'washes', filter: 'url(#wash)' }, svg);
        el('rect', { x: -100, y: -100, width: 1800, height: 640, fill: 'url(#skyG)', opacity: 0.5 }, washes);
        el('path', { d: 'M-100 520 C 300 500 640 492 900 510 S 1400 490 1700 500 L1700 1000 L-100 1000 Z', fill: 'url(#fieldG)', opacity: 0.5 }, washes);
        el('path', { d: 'M-100 520 C200 500 420 512 640 494 C 900 512 1150 488 1400 506 L1700 498 L1700 560 L-100 562 Z', fill: '#8fb08a', opacity: 0.42 }, washes);
        el('path', { d: 'M640 900 C 700 780 770 680 793 590 L808 590 C 840 680 900 780 1010 900 Z', fill: '#d6b27c', opacity: 0.55 }, washes);
        el('path', { d: 'M800 506 L861 503 L890 531 L834 539 Z', fill: '#b5523b', opacity: 0.6 }, washes);
        el('path', { d: 'M766 540 L800 506 L834 538 Z', fill: '#b5523b', opacity: 0.35 }, washes);
        el('path', { d: 'M770 540 L830 538 L830 588 L770 588 Z', fill: '#f6efe0', opacity: 0.7 }, washes);
        el('path', { d: 'M830 538 L885 532 L885 580 L830 588 Z', fill: '#c9b48e', opacity: 0.55 }, washes);
        el('ellipse', { cx: 936, cy: 512, rx: 42, ry: 38, fill: '#6f9a52', opacity: 0.55 }, washes);
        el('ellipse', { cx: 312, cy: 540, rx: 34, ry: 14, fill: '#6f9a52', opacity: 0.4 }, washes);
        el('ellipse', { cx: 1330, cy: 545, rx: 22, ry: 10, fill: '#6f9a52', opacity: 0.4 }, washes);
    }

    function buildLand() {
        land = el('g', { id: 'land', filter: 'url(#boil)' }, svg);

        // rolling ridges on the horizon
        draw(land, curve([[-60, 520], [200, 500], [420, 514], [640, 494], [900, 512], [1150, 488], [1400, 506], [1660, 496]], 1.5), 0, 1.3, STYLE.light);
        draw(land, curve([[-60, 562], [260, 546], [560, 560], [900, 549], [1200, 562], [1660, 550]], 1.2), 0.35, 1.2, STYLE.main);
        // hatching that thins out toward its ends instead of stopping in a box
        draw(land, hatch([[-60, 524], [200, 505], [420, 518], [560, 506], [500, 532], [380, 548], [160, 552], [-60, 556]], 18, 7), 1.2, 0.7, STYLE.faint);
        draw(land, hatch([[1240, 498], [1400, 510], [1660, 500], [1660, 548], [1420, 552], [1300, 534]], -16, 7), 1.3, 0.7, STYLE.faint);

        // far trees on the ridge
        draw(land, scribble(312, 538, 32, 13, 40), 1.4, 0.6, STYLE.light);
        draw(land, scribble(352, 542, 18, 9, 26), 1.6, 0.4, STYLE.light);
        draw(land, scribble(1330, 545, 22, 10, 30), 1.5, 0.5, STYLE.light);

        // the dirt path leading home
        draw(land, curve([[640, 900], [720, 780], [770, 680], [793, 592]], 1), 1.0, 0.8, STYLE.main);
        draw(land, curve([[1010, 900], [900, 780], [840, 680], [808, 592]], 1), 1.15, 0.8, STYLE.main);

        // the farmhouse — gable end facing us, side wall receding
        const front = [[770, 540], [830, 538], [830, 588], [770, 588]];
        const side = [[830, 538], [885, 532], [885, 580], [830, 588]];
        draw(land, poly(front, 0.5), 1.7, 0.6, STYLE.bold);
        draw(land, poly(side, 0.5), 2.1, 0.5, STYLE.bold);
        draw(land, [rline(764, 542, 800, 505, 0.4), rline(800, 505, 836, 540, 0.4)], 2.4, 0.4, STYLE.bold);
        draw(land, [rline(800, 505, 862, 502, 0.4), rline(862, 502, 891, 531, 0.4), rline(891, 531, 836, 540, 0.4)], 2.65, 0.45, STYLE.bold);
        draw(land, poly([[846, 512], [846, 492], [855, 491], [855, 509]], 0.3, false), 2.95, 0.25, STYLE.main);
        draw(land, poly([[793, 588], [793, 562], [807, 562], [807, 588]], 0.3, false), 3.05, 0.25, STYLE.main);
        draw(land, [...poly([[776, 552], [788, 552], [788, 566], [776, 566]], 0.3), rline(782, 552, 782, 566, 0.2), rline(776, 559, 788, 559, 0.2)], 3.2, 0.3, STYLE.light);
        draw(land, [...poly([[812, 552], [824, 552], [824, 566], [812, 566]], 0.3), rline(818, 552, 818, 566, 0.2), rline(812, 559, 824, 559, 0.2)], 3.35, 0.3, STYLE.light);
        draw(land, [...poly([[796, 519], [804, 519], [804, 529], [796, 529]], 0.2)], 3.45, 0.2, STYLE.light);
        draw(land, [...poly([[842, 550], [853, 549], [853, 563], [842, 564]], 0.3), ...poly([[864, 547], [874, 546], [874, 559], [864, 560]], 0.3)], 3.55, 0.35, STYLE.light);
        draw(land, hatch(side, 62, 3.4, 0.3), 3.6, 0.5, STYLE.hatch);
        draw(land, hatch([[800, 505], [862, 502], [891, 531], [836, 540]], -24, 3.2, 0.3), 3.7, 0.5, STYLE.hatch);
        draw(land, hatch([[885, 580], [930, 586], [900, 592], [830, 592], [830, 588]], 8, 2.6, 0.3), 3.85, 0.3, STYLE.hatch);

        // the shade tree beside the house
        draw(land, [rline(931, 590, 933, 540, 0.6), rline(940, 590, 938, 542, 0.6)], 2.8, 0.4, STYLE.main);
        draw(land, scribble(936, 512, 40, 36, 70), 3.0, 1.0, STYLE.light);

        // windmill: tapered lattice tower
        const legs = [rline(686, 592, 698, 478, 0.4), rline(714, 592, 704, 478, 0.4)];
        const braces = [];
        for (let i = 0; i < 4; i++) {
            const y1 = 592 - i * 28, y2 = y1 - 28;
            const w1 = 14 - i * 2.6, w2 = 14 - (i + 1) * 2.6;
            braces.push(rline(700 - w1, y1, 700 + w2, y2, 0.3), rline(700 + w1, y1, 700 - w2, y2, 0.3));
        }
        draw(land, legs, 2.4, 0.4, STYLE.main);
        draw(land, braces, 2.75, 0.6, STYLE.faint);
        draw(land, [rline(701, 472, 738, 470, 0.3), ...poly([[730, 462], [744, 458], [744, 480], [730, 477]], 0.3)], 3.3, 0.3, STYLE.main);

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
        draw(land, posts, 3.2, 1.1, STYLE.main);
        draw(land, rails, 3.9, 0.8, STYLE.light);

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
        sunG = el('g', { id: 'sun', filter: 'url(#boil)' }, svg);
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
        blades = el('g', { id: 'blades', filter: 'url(#boil)' }, svg);
        const bl = [];
        for (let i = 0; i < 12; i++) {
            const a = i / 12 * Math.PI * 2;
            bl.push(rline(701, 472, 701 + Math.cos(a) * 30, 472 + Math.sin(a) * 30, 0.3));
        }
        bl.push(curve(Array.from({ length: 17 }, (_, i) => [701 + Math.cos(i / 16 * 6.3) * 31, 472 + Math.sin(i / 16 * 6.3) * 31]), 0.6));
        draw(blades, bl, 3.4, 0.6, STYLE.light);
        el('circle', { id: 'groundZero', cx: HOUSE.x, cy: HOUSE.y, r: 0.5, fill: 'none' }, svg);
    }

    function buildClouds() {
        clouds = [];
        [[320, 210, 270, 4.6], [1000, 140, 200, 4.9], [1480, 280, 230, 5.2]].forEach(([cx, cy, w, t]) => {
            const g = el('g', { class: 'cloud', filter: 'url(#boil)' }, svg);
            const pts = cloudPts(cx, cy, w);
            el('path', { class: 'cfill', d: curve(pts, 0) + 'Z', fill: '#fbf9f3', opacity: 0 }, g);
            draw(g, curve(pts, 1.5), t, 1.0, STYLE.light);
            draw(g, hatch(pts.filter((_, i) => i > 20), -10, 4, 0.3), t + 0.8, 0.4, STYLE.faint);
            clouds.push({ g, x: 0, speed: r(5, 9) });
        });
    }

    function buildGrass() {
        grassG = el('g', { id: 'grass' }, svg);
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
        birds = el('g', { id: 'birds', opacity: 0 }, svg);
        for (let i = 0; i < 3; i++) path(birds, '', STYLE.main).dataset.off = i;
    }

    function buildPlane() {
        plane = el('g', { id: 'plane', opacity: 0 }, svg);
        const body = el('g', { filter: 'url(#boil)' }, plane);
        const s = STYLE.main;
        const strokes = [
            curve([[108, -4], [80, -14], [30, -17], [-40, -12], [-100, -6]], 0.6),
            curve([[108, 6], [70, 14], [0, 15], [-60, 8], [-104, 2]], 0.6),
            rline(-100, -6, -104, 2, 0.3),
            curve([[108, -4], [114, 1], [108, 6]], 0.3),
            curve([[40, -16], [48, -27], [68, -27], [78, -15]], 0.5),
            rline(58, -27, 60, -16, 0.3),
            curve([[-14, 3], [20, -1], [58, 3]], 0.4),
            curve([[-14, 3], [20, 8], [58, 3]], 0.4),
            curve([[-70, -11], [-88, -40], [-104, -42], [-100, -6]], 0.5),
            curve([[-112, -1], [-92, -5], [-72, -1]], 0.3),
            curve([[-112, -1], [-92, 2], [-72, -1]], 0.3),
            curve(Array.from({ length: 9 }, (_, k) => [-90 + Math.cos(k / 8 * 6.4) * 5, -24 + Math.sin(k / 8 * 6.4) * 5]), 0.3),
            rline(-8, 14, 24, 15, 0.3),
        ];
        strokes.forEach(d => path(body, d, s));
        for (let k = 0; k < 4; k++) path(body, curve(Array.from({ length: 7 }, (_, q) => [-32 + k * 15 + Math.cos(q / 6 * 6.4) * 2.2, -5 + Math.sin(q / 6 * 6.4) * 2.2]), 0.1), STYLE.light);
        path(body, hatch([[108, 6], [70, 14], [0, 15], [-60, 8], [-104, 2], [-100, 0], [108, 1]], 72, 3.5, 0.2), STYLE.hatch);
        prop = el('ellipse', { cx: 117, cy: 1, rx: 2.5, ry: 25, fill: 'rgba(52,50,45,0.12)', stroke: INK, 'stroke-width': 1, 'stroke-opacity': 0.6 }, plane);
        el('circle', { cx: 115, cy: 1, r: 3, fill: INK }, plane);

        shadow = el('ellipse', { id: 'planeShadow', cx: 0, cy: 712, rx: 80, ry: 7, fill: '#3b3a2c', opacity: 0, filter: 'url(#soft)' }, svg);

        bomb = el('g', { id: 'bomb', opacity: 0 }, svg);
        const bb = el('g', { filter: 'url(#boil)' }, bomb);
        [curve([[-14, 0], [-9, -5.5], [5, -6], [15, 0]], 0.2), curve([[-14, 0], [-9, 5.5], [5, 6], [15, 0]], 0.2),
         poly([[-13, -2], [-21, -8], [-18, 0], [-21, 8], [-13, 2]], 0.2, false).join(''), rline(-5, -6, -5, 6, 0.1)]
            .forEach(d => path(bb, d, STYLE.main));
        path(bb, hatch([[-14, 0], [15, 0], [5, 6], [-9, 5.5]], 70, 2.2, 0.1), STYLE.hatch);
    }

    function build(host) {
        rand = seeded(7);
        batches = [];
        svg = el('svg', {
            id: 'scene', viewBox: `0 0 ${VB_W} ${VB_H}`, preserveAspectRatio: 'xMidYMid slice',
            xmlns: NS, 'aria-hidden': 'true'
        });
        defs();
        buildWashes();
        buildClouds();
        buildLand();
        buildBirds();
        buildPlane();
        buildGrass();
        host.appendChild(svg);

        // every queued stroke starts hidden behind its own dash
        batches.forEach(b => {
            b.lens = b.els.map(e => e.getTotalLength() || 1);
            b.els.forEach((e, i) => {
                e.style.strokeDasharray = `${b.lens[i] + 1} ${b.lens[i] + 1}`;
                e.style.strokeDashoffset = b.lens[i] + 1;
            });
        });
        return svg;
    }

    /* Animate every stroke in. Returns the time (s) the last stroke finishes. */
    function startDrawing(offset) {
        let end = 0;
        batches.forEach(b => {
            const total = b.lens.reduce((s, l) => s + l, 0);
            let cum = 0;
            b.els.forEach((e, i) => {
                const start = b.t0 + b.dur * (cum / total);
                const dur = Math.max(0.1, b.dur * (b.lens[i] / total) * 1.5);
                cum += b.lens[i];
                e.animate(
                    [{ strokeDashoffset: b.lens[i] + 1 }, { strokeDashoffset: 0 }],
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
        svg.classList.add('washed');
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
            seed = seed % 5 + 1;
            svg.querySelector('#boilNoise').setAttribute('seed', seed);
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
                const x = v.left - 80 + bt * 34 + i * 38 - (i === 1 ? 20 : 0);
                const y = 330 - bt * 6 + i * 16 + Math.sin(bt * 0.8 + i) * 6;
                const flap = Math.sin(bt * 7 + i * 1.9), s = 1 - i * 0.12;
                p.setAttribute('d', `M${f(x - 11 * s)} ${f(y)}Q${f(x - 5 * s)} ${f(y - 7 * flap * s)} ${f(x)} ${f(y)}Q${f(x + 5 * s)} ${f(y - 7 * flap * s)} ${f(x + 11 * s)} ${f(y)}`);
            });
        }

        // the plane: flies left to right, passing ahead of ground zero when the bomb leaves
        const P = state.plane;
        if (P) {
            const s = v.width < 900 ? 0.72 : 1;
            const releaseX = HOUSE.x - 230 * s;
            const speed = Math.max(170, (releaseX - (v.left - 200)) / (P.release - P.enter));
            const x = releaseX + (t - P.release) * speed;
            const y = 250 + Math.sin(t * 1.3) * 4;
            P.x = x; P.y = y; P.s = s; P.speed = speed;
            plane.setAttribute('opacity', t > P.enter - 0.2 ? 1 : 0);
            plane.setAttribute('transform', `translate(${f(x)} ${f(y)}) rotate(${f(Math.sin(t * 1.1) * 1.5)}) scale(${s})`);
            prop.setAttribute('ry', f(25 * Math.abs(Math.cos(t * 42)) + 2));
            shadow.setAttribute('cx', f(x + 20));
            shadow.setAttribute('opacity', 0.14);
            P.pan = Math.max(-1, Math.min(1, (x - (v.left + v.width / 2)) / (v.width / 2)));
            P.near = Math.max(0, 1 - Math.abs(x - (v.left + v.width / 2)) / (v.width * 0.9 + 300));
        }

        // the bomb: tumbles nose-down and shrinks into the distance
        const B = state.bomb;
        if (B) {
            const p = Math.min(1, (t - B.t0) / B.dur);
            const x = B.x0 + (HOUSE.x - B.x0) * (1 - Math.pow(1 - p, 1.7));
            const y = B.y0 + (HOUSE.y - B.y0) * p * p;
            const vx = (HOUSE.x - B.x0) * 1.7 * Math.pow(1 - p, 0.7), vy = (HOUSE.y - B.y0) * 2 * p + 1;
            const ang = Math.atan2(vy, vx) * 180 / Math.PI;
            bomb.setAttribute('opacity', p < 1 ? 1 : 0);
            bomb.setAttribute('transform', `translate(${f(x)} ${f(y)}) rotate(${f(ang)}) scale(${f(B.s * (1 - p * 0.55))})`);
        }
    }

    function groundZero() {
        const b = svg.querySelector('#groundZero').getBoundingClientRect();
        return { x: b.left + b.width / 2, y: b.top + b.height / 2 };
    }

    /* Render the finished drawing (without plane or bomb) into a canvas for the shader. */
    async function snapshot(paperCanvas, scale) {
        const W = Math.round(innerWidth * scale), H = Math.round(innerHeight * scale);
        const clone = svg.cloneNode(true);
        ['#plane', '#bomb', '#planeShadow', '#birds'].forEach(q => clone.querySelector(q)?.remove());
        clone.removeAttribute('style');
        clone.setAttribute('width', W);
        clone.setAttribute('height', H);
        clone.querySelector('#washes').setAttribute('opacity', '1');
        clone.querySelectorAll('.cfill').forEach(c => c.setAttribute('opacity', '0.85'));
        const src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(new XMLSerializer().serializeToString(clone));
        const img = new Image();
        img.src = src;
        await img.decode();
        const c = document.createElement('canvas');
        c.width = W; c.height = H;
        const x = c.getContext('2d');
        x.fillStyle = x.createPattern(paperCanvas, 'repeat');
        x.fillRect(0, 0, W, H);
        x.drawImage(img, 0, 0, W, H);
        const v = x.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75);
        v.addColorStop(0, 'rgba(80,60,30,0)');
        v.addColorStop(1, 'rgba(80,60,30,0.2)');
        x.fillStyle = v;
        x.fillRect(0, 0, W, H);
        return c;
    }

    return { build, startDrawing, finishDrawing, paint, tick, groundZero, snapshot, visible, HOUSE, get plane() { return plane; } };
})();
