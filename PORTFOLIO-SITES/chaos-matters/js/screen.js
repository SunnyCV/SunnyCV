/* ==========================================================
   Chaos Matters — the screen
   One WebGL fragment shader carries everything after impact:
   the shockwave through the drawing, the tear into static,
   the colour-bar test card and its melt into the dream.
   ========================================================== */

const Screen = (() => {
    const VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main() { vUv = aPos * 0.5 + 0.5; gl_Position = vec4(aPos, 0.0, 1.0); }`;

    const FRAG = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uScene;
uniform vec2  uRes;
uniform float uTime;     // running clock
uniform float uT;        // seconds since impact
uniform vec2  uCenter;   // ground zero (uv)
uniform float uZoom;     // camera push at the moment of impact
uniform float uStatic;   // 0..1 raw static
uniform float uTv;       // 0..1 CRT curvature
uniform float uBars;     // 0..1 colour bars
uniform float uRoll;     // vertical hold slipping
uniform float uPsy;      // 0..1 the melt
uniform float uMenu;     // 0..1 dimming behind the menu
uniform vec2  uMouse;
uniform float uHover;
uniform vec3  uRipple;   // xy = where, z = seconds since

float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float hash1(float n) { return fract(sin(n) * 43758.5453); }

vec3 bars(vec2 uv) {
    float x = fract(uv.x), y = 1.0 - fract(uv.y);
    float i = floor(x * 7.0);
    if (y < 0.67) {
        if (i < 0.5) return vec3(0.75);
        if (i < 1.5) return vec3(0.75, 0.75, 0.0);
        if (i < 2.5) return vec3(0.0, 0.75, 0.75);
        if (i < 3.5) return vec3(0.0, 0.75, 0.0);
        if (i < 4.5) return vec3(0.75, 0.0, 0.75);
        if (i < 5.5) return vec3(0.75, 0.0, 0.0);
        return vec3(0.0, 0.0, 0.75);
    }
    if (y < 0.75) {
        if (i < 0.5) return vec3(0.0, 0.0, 0.75);
        if (i < 1.5) return vec3(0.075);
        if (i < 2.5) return vec3(0.75, 0.0, 0.75);
        if (i < 3.5) return vec3(0.075);
        if (i < 4.5) return vec3(0.0, 0.75, 0.75);
        if (i < 5.5) return vec3(0.075);
        return vec3(0.75);
    }
    float b = x * 7.0;
    if (b < 1.25) return vec3(0.0, 0.13, 0.3);
    if (b < 2.5)  return vec3(1.0);
    if (b < 3.75) return vec3(0.2, 0.0, 0.42);
    if (b < 5.0)  return vec3(0.075);
    if (b < 5.333) return vec3(0.03);
    if (b < 5.667) return vec3(0.075);
    if (b < 6.0)  return vec3(0.11);
    return vec3(0.075);
}

vec3 hueShift(vec3 c, float a) {
    const vec3 k = vec3(0.57735);
    float ca = cos(a);
    return c * ca + cross(k, c) * sin(a) + k * dot(k, c) * (1.0 - ca);
}

mat2 rot(float a) { float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }

void main() {
    vec2 uv = vUv;
    float asp = uRes.x / uRes.y;
    vec2 A = vec2(asp, 1.0);
    float t = uTime;
    vec3 col = vec3(0.0);

    /* ---- 1. the drawing, hit by the blast ---- */
    if (uStatic < 0.999 && uBars < 0.999) {
        vec2 su = uv;
        float shake = 0.024 * exp(-uT * 2.2);
        su += (vec2(hash1(floor(t * 45.0)), hash1(floor(t * 45.0) + 7.0)) - 0.5) * shake;
        vec2 d = (su - uCenter) * A;
        float r = length(d);
        float R = uT * 0.85;
        float ring = exp(-pow((r - R) * 8.0, 2.0)) * 0.11 * exp(-uT * 0.6);
        su -= normalize(d + 1e-5) / A * ring;
        // heat: the air near the blast keeps rippling
        su += vec2(sin(su.y * 60.0 + t * 9.0), cos(su.x * 50.0 + t * 7.0)) * 0.004 * exp(-r * 3.0) * smoothstep(0.0, 0.3, uT);
        // horizontal tearing grows as the signal fails
        float tear = smoothstep(0.4, 2.0, uT);
        float row = floor(su.y * 46.0);
        float h = hash(vec2(row, floor(t * 16.0)));
        su.x += step(1.0 - tear * 0.55, h) * (hash(vec2(row, floor(t * 16.0) + 3.0)) - 0.5) * 0.3 * tear;
        // and finally it breaks into blocks
        float px = mix(1.0, 70.0, smoothstep(1.3, 2.4, uT));
        if (px > 1.5) { vec2 g = uRes / px; su = (floor(su * g) + 0.5) / g; }
        vec2 zu = uCenter + (su - uCenter) / uZoom;
        float ab = 0.002 + 0.028 * smoothstep(0.0, 2.0, uT);
        vec3 s = vec3(texture2D(uScene, zu + vec2(ab, 0.0)).r, texture2D(uScene, zu).g, texture2D(uScene, zu - vec2(ab, 0.0)).b);
        // flash, fireball, and a scorched inverted frame now and then
        s += vec3(1.0, 0.92, 0.75) * exp(-uT * 5.0) * 1.6;
        s += vec3(1.0, 0.55, 0.2) * exp(-r * r * 30.0) * exp(-uT * 1.5) * 1.5;
        // the shock front itself, a bright travelling ring
        s += vec3(1.0, 0.86, 0.62) * exp(-pow((r - R) * 16.0, 2.0)) * 0.45 * exp(-uT * 1.1);
        if (uT > 0.5 && hash1(floor(t * 20.0)) > 0.86) s = 1.0 - s;
        col = s;
    }

    /* the TV glass: curvature, scanlines, grain */
    vec2 cu = uv * 2.0 - 1.0;
    cu *= 1.0 + 0.07 * uTv * dot(cu, cu);
    cu = cu * 0.5 + 0.5;
    float inside = step(0.0, cu.x) * step(cu.x, 1.0) * step(0.0, cu.y) * step(cu.y, 1.0);
    float scan = 0.84 + 0.16 * sin(cu.y * uRes.y * 1.4);
    float grain = hash(floor(cu * uRes / 2.0) + fract(t * 13.0) * vec2(91.0, 37.0));

    /* ---- 2. static ---- */
    if (uStatic > 0.001) {
        float band = 0.65 + 0.35 * smoothstep(0.0, 0.12, abs(fract(cu.y - t * 0.33) - 0.5));
        vec3 st = vec3(grain) * scan * band;
        col = mix(col, st * inside, uStatic);
    }

    /* ---- 3. colour bars, buzzing ---- */
    if (uBars > 0.001) {
        vec2 bu = cu;
        float line = floor(bu.y * uRes.y / 2.0);
        bu.x += (hash(vec2(line, floor(t * 30.0))) - 0.5) * 0.006;
        bu.x += sin(bu.y * 28.0 + t * 22.0) * 0.003;
        float tearBand = step(0.93, hash1(floor(t * 7.0))) * step(abs(bu.y - hash1(floor(t * 7.0) + 2.0)), 0.06);
        bu.x += tearBand * 0.06;
        bu.y += uRoll;
        vec3 b = vec3(bars(bu + vec2(0.004, 0.0)).r, bars(bu).g, bars(bu - vec2(0.004, 0.0)).b);
        b = mix(b, vec3(grain), 0.2 * (1.0 - uPsy));
        b *= mix(scan, 1.0, uPsy) * mix(inside, 1.0, uPsy);
        col = mix(col, b, uBars);
    }

    /* ---- 4. the melt ---- */
    if (uPsy > 0.001) {
        vec2 p = uv;
        // the cursor stirs the paint
        vec2 md = (p - uMouse) * A;
        float sw = (0.8 + 2.2 * uHover) * exp(-dot(md, md) * 5.0) * uPsy;
        p = uMouse + (rot(sw) * md) / A;
        // a click sends rings out
        vec2 rd = (p - uRipple.xy) * A;
        float rr = length(rd), rf = uRipple.z * 0.9;
        p += normalize(rd + 1e-5) / A * sin((rr - rf) * 38.0) * 0.025 * exp(-uRipple.z * 1.3) * exp(-abs(rr - rf) * 7.0);
        float amt = uPsy;
        // the whole dream breathes and slowly turns
        p = (rot(sin(t * 0.07) * 0.5 * amt) * ((p - 0.5) * A * (1.0 + 0.07 * sin(t * 0.55) * amt))) / A + 0.5;
        vec2 q = p;
        for (int i = 0; i < 5; i++) {
            float fi = float(i);
            q += amt * 0.21 * vec2(sin(q.y * 3.4 + t * 0.42 + fi * 1.7), cos(q.x * 3.0 - t * 0.37 + fi * 2.3));
        }
        vec2 m = 1.0 - abs(1.0 - mod(q, 2.0));
        vec3 pc = vec3(bars(m + vec2(0.006, 0.0)).r, bars(m).g, bars(m - vec2(0.006, 0.0)).b);
        pc = hueShift(pc, (t * 0.32 + length(q - p) * 2.2) * amt);
        float l = dot(pc, vec3(0.333));
        pc = clamp(mix(vec3(l), pc, 1.0 + 0.6 * amt), 0.0, 1.0);
        pc += 0.05 * amt * sin(vec3(0.0, 2.1, 4.2) + t + q.x * 3.0);
        // op-art contour lines flowing through the paint
        float c = abs(fract(length(q - p) * 6.0 - t * 0.25) - 0.5);
        pc *= 1.0 - 0.22 * amt * (1.0 - smoothstep(0.0, 0.07, c));
        col = mix(col, pc, smoothstep(0.0, 0.25, uPsy));
    }

    /* the menu needs a calmer, darker stage */
    vec2 vc = (uv - 0.5) * A;
    col *= 1.0 - uMenu * (0.32 + 0.3 * smoothstep(0.2, 1.1, length(vc)));
    col += (grain - 0.5) * 0.045;
    gl_FragColor = vec4(col, 1.0);
}`;

    let gl, prog, tex, canvas, U = {}, ok = false;

    function init(c) {
        canvas = c;
        gl = c.getContext('webgl', { antialias: false, preserveDrawingBuffer: true }) || c.getContext('experimental-webgl');
        if (!gl) return false;
        const sh = (type, src) => {
            const s = gl.createShader(type);
            gl.shaderSource(s, src);
            gl.compileShader(s);
            if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
            return s;
        };
        try {
            prog = gl.createProgram();
            gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
            gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
            gl.linkProgram(prog);
            if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
        } catch (e) {
            console.warn('Chaos Matters: shader failed', e);
            return false;
        }
        gl.useProgram(prog);
        const buf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
        const loc = gl.getAttribLocation(prog, 'aPos');
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
        ['uScene', 'uRes', 'uTime', 'uT', 'uCenter', 'uZoom', 'uStatic', 'uTv', 'uBars', 'uRoll', 'uPsy', 'uMenu', 'uMouse', 'uHover', 'uRipple']
            .forEach(n => U[n] = gl.getUniformLocation(prog, n));

        tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([243, 239, 230, 255]));
        ok = true;
        return true;
    }

    function setScene(source) {
        if (!ok) return;
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
    }

    function resize(scale) {
        if (!ok) return;
        const w = Math.round(innerWidth * scale), h = Math.round(innerHeight * scale);
        if (canvas.width !== w || canvas.height !== h) {
            canvas.width = w; canvas.height = h;
            gl.viewport(0, 0, w, h);
        }
    }

    function render(u) {
        if (!ok) return;
        gl.uniform1i(U.uScene, 0);
        gl.uniform2f(U.uRes, canvas.width, canvas.height);
        gl.uniform1f(U.uTime, u.time);
        gl.uniform1f(U.uT, u.T);
        gl.uniform2f(U.uCenter, u.center[0], u.center[1]);
        gl.uniform1f(U.uZoom, u.zoom);
        gl.uniform1f(U.uStatic, u.static);
        gl.uniform1f(U.uTv, u.tv);
        gl.uniform1f(U.uBars, u.bars);
        gl.uniform1f(U.uRoll, u.roll);
        gl.uniform1f(U.uPsy, u.psy);
        gl.uniform1f(U.uMenu, u.menu);
        gl.uniform2f(U.uMouse, u.mouse[0], u.mouse[1]);
        gl.uniform1f(U.uHover, u.hover);
        gl.uniform3f(U.uRipple, u.ripple[0], u.ripple[1], u.ripple[2]);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    return { init, setScene, resize, render, get ok() { return ok; } };
})();
