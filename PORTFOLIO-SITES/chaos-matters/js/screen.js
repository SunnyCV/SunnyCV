/* ==========================================================
   Chaos Matters — the screen
   WebGL carries everything after impact: the mushroom cloud
   rising out of the drawing, the white-out, full-screen
   static, the colour bars and their slow melt into an oily,
   iridescent dream that the visitor can stir — and the
   staticky title that drifts through it.
   ========================================================== */

const Screen = (() => {
    const VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main() { vUv = aPos * 0.5 + 0.5; gl_Position = vec4(aPos, 0.0, 1.0); }`;

    /* ---- the "oil" field: velocity (rg) and dye (b), advected and smeared each frame ---- */
    const FIELD = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uPrev;
uniform vec2  uTexel;
uniform float uAsp;
uniform vec3  uP1;   // pointer: xy, strength
uniform vec2  uV1;
uniform vec3  uP2;   // title: xy, strength
uniform vec2  uV2;
vec2 dec(vec4 c) { return (c.xy - 0.5) * 2.0; }
void main() {
    vec2 v0 = dec(texture2D(uPrev, vUv));
    vec2 back = vUv - v0 * uTexel * 3.0;
    vec4 c = texture2D(uPrev, back);
    vec4 n = texture2D(uPrev, back + vec2(uTexel.x, 0.0)) + texture2D(uPrev, back - vec2(uTexel.x, 0.0))
           + texture2D(uPrev, back + vec2(0.0, uTexel.y)) + texture2D(uPrev, back - vec2(0.0, uTexel.y));
    c = mix(c, n * 0.25, 0.3);
    vec2 v = dec(c);
    float dye = c.z;
    vec2 d1 = (vUv - uP1.xy) * vec2(uAsp, 1.0);
    float g1 = exp(-dot(d1, d1) / 0.004) * uP1.z;
    v += uV1 * g1;
    dye += g1 * 0.12;
    vec2 d2 = (vUv - uP2.xy) * vec2(uAsp, 1.0);
    float g2 = exp(-dot(d2, d2) / 0.012) * uP2.z;
    v += uV2 * g2;
    dye += g2 * 0.03;
    // bytes can't hold tiny values, so fade by a fixed step toward rest
    v -= sign(v) * min(abs(v), 0.006);
    v *= 0.992;
    dye = max(0.0, dye - 0.0024);
    gl_FragColor = vec4(clamp(v * 0.5 + 0.5, 0.0, 1.0), clamp(dye, 0.0, 1.0), 1.0);
}`;

    const FRAG = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uScene;
uniform sampler2D uField;
uniform sampler2D uTitle;
uniform vec2  uRes;
uniform float uTime;     // running clock
uniform float uT;        // seconds since impact
uniform vec2  uCenter;   // ground zero (uv)
uniform float uZoom;     // camera push at the moment of impact
uniform float uStatic;   // 0..1 raw static
uniform float uBars;     // 0..1 colour bars
uniform float uRoll;     // vertical hold slipping
uniform float uPsy;      // 0..1 the melt
uniform float uDim;      // 0..1 darkening when the doors are open
uniform vec2  uMouse;
uniform vec3  uRipple;   // xy = where, z = seconds since
uniform vec2  uTP;       // title centre (uv)
uniform vec2  uTS;       // title size (uv)
uniform float uTA;       // title presence 0..1 (flickers in)
uniform float uTF;       // title fade (when the doors are open)
uniform vec2  uG1;       // title ghosts (where it was)
uniform vec2  uG2;

float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float hash1(float n) { return fract(sin(n) * 43758.5453); }
float vnoise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}
float fbm(vec2 p) {
    float s = 0.0, a = 0.5;
    for (int i = 0; i < 5; i++) { s += a * vnoise(p); p = p * 2.03 + vec2(1.7, 9.2); a *= 0.5; }
    return s;
}

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

float titleA(vec2 pos, vec2 p) {
    vec2 tu = (p - pos) / uTS + 0.5;
    if (tu.x < 0.0 || tu.x > 1.0 || tu.y < 0.0 || tu.y > 1.0) return 0.0;
    return texture2D(uTitle, tu).a;
}

void main() {
    vec2 uv = vUv;
    float asp = uRes.x / uRes.y;
    vec2 A = vec2(asp, 1.0);
    float t = uTime;
    float s = uT;
    vec3 col = vec3(0.0);
    float grain = hash(floor(uv * uRes / 2.0) + fract(t * 13.0) * vec2(91.0, 37.0));
    float scan = 0.88 + 0.12 * sin(uv.y * uRes.y * 1.4);

    /* ---- 1. the drawing, and the cloud that swallows it ---- */
    if (uStatic < 0.999 && uBars < 0.999) {
        vec2 su = uv;
        float shake = 0.022 * exp(-s * 1.8) + 0.005 * smoothstep(0.0, 1.0, s) * (1.0 - smoothstep(4.0, 5.5, s));
        su += (vec2(hash1(floor(t * 45.0)), hash1(floor(t * 45.0) + 7.0)) - 0.5) * shake;
        vec2 d = (su - uCenter) * A;
        float r = length(d);
        float R = s * 0.75;
        su -= normalize(d + 1e-5) / A * exp(-pow((r - R) * 8.0, 2.0)) * 0.1 * exp(-s * 0.6);
        // the signal fails once the cloud has taken everything
        float fail = smoothstep(4.7, 6.0, s);
        float row = floor(su.y * 46.0);
        su.x += step(1.0 - fail * 0.6, hash(vec2(row, floor(t * 16.0)))) * (hash(vec2(row, floor(t * 16.0) + 3.0)) - 0.5) * 0.3 * fail;
        float px = mix(1.0, 70.0, smoothstep(5.2, 6.1, s));
        if (px > 1.5) { vec2 g = uRes / px; su = (floor(su * g) + 0.5) / g; }
        vec2 zu = uCenter + (su - uCenter) / uZoom;
        float ab = 0.002 + 0.03 * fail;
        vec3 sc = vec3(texture2D(uScene, zu + vec2(ab, 0.0)).r, texture2D(uScene, zu).g, texture2D(uScene, zu - vec2(ab, 0.0)).b);
        // the land glows in the light of the blast
        sc += vec3(1.0, 0.55, 0.25) * 0.45 * exp(-s * 0.7) * exp(-r * 2.0);
        sc += vec3(1.0, 0.86, 0.62) * exp(-pow((r - R) * 16.0, 2.0)) * 0.4 * exp(-s * 1.1);

        // the mushroom cloud, drawn in the same pencil-and-wash hand as the scene
        float grow = 1.0 - exp(-s * 0.9);
        float H  = 0.03 + 0.34 * grow + 0.01 * s;
        float Rc = 0.025 + 0.15 * grow + 0.01 * s;
        float ws = 0.01 + 0.028 * grow;
        float Rb = 0.02 + 0.16 * grow;
        // then it comes for us: the cap swells toward the viewer and drifts to the centre of the frame
        float e = smoothstep(2.4, 5.0, s);
        vec2 capUv = uCenter + vec2(0.0, H);
        vec2 m = vec2(0.0, H) + (su - mix(capUv, vec2(0.5), e)) * A / (1.0 + 7.0 * e * e);
        vec2 cp = (m - vec2(0.0, H)) / vec2(Rc * 1.2, Rc * 0.62);
        float capD = length(cp) - 1.0;
        float flare = 1.0 + 0.7 * smoothstep(H * 0.55, H, m.y);
        float stemD = (abs(m.x + 0.008 * sin(m.y * 28.0 + t * 2.0)) - ws * flare) / (ws * 3.0);
        stemD = max(stemD, -m.y * 30.0);
        stemD = max(stemD, (m.y - H) * 30.0);
        float skirtD = length(m / vec2(Rb, Rb * 0.2)) - 1.0;
        float dd = min(capD, min(stemD, skirtD));
        // rolling billows: the noise churns upward and around the cap
        vec2 bp = m * 9.0 / (0.35 + grow);
        bp = rot(0.4 * sin(t * 0.3)) * bp;
        float n = fbm(bp + vec2(0.0, -t * 0.55)) ;
        dd += (n - 0.5) * 0.95;
        float cloud = smoothstep(0.08, -0.08, dd) * step(0.0, s);
        if (cloud > 0.001) {
            float heat = clamp(1.0 - length(cp) * 0.75, 0.0, 1.0) * exp(-s * 0.4)
                       + exp(-s * 1.1) * smoothstep(0.25, 0.0, length(m));
            float lit = clamp((m.y - H + Rc * 0.7) / (Rc * 1.3), 0.0, 1.0) * 0.6 + n * 0.5;
            vec3 smoke = mix(vec3(0.36, 0.3, 0.26), vec3(0.93, 0.86, 0.76), clamp(lit, 0.0, 1.0));
            vec3 fire = mix(vec3(1.0, 0.42, 0.1), vec3(1.0, 0.96, 0.78), clamp(heat * 1.2, 0.0, 1.0));
            vec3 cc = mix(smoke, fire, clamp(heat * 1.5, 0.0, 1.0));
            // pencil hatching in the shadows, ink on the billow lines and the outline
            float hl = abs(fract((gl_FragCoord.x + gl_FragCoord.y) / 7.0) - 0.5);
            cc *= 1.0 - 0.4 * (1.0 - clamp(lit, 0.0, 1.0)) * smoothstep(0.14, 0.04, hl) * (1.0 - heat);
            float bl = abs(fract(n * 5.0 - t * 0.15) - 0.5);
            cc *= 1.0 - 0.3 * smoothstep(0.07, 0.0, bl) * (1.0 - heat);
            cc = mix(cc, vec3(0.2, 0.19, 0.17), (1.0 - smoothstep(0.0, 0.06, abs(dd))) * 0.65 * (1.0 - heat));
            sc = mix(sc, cc, cloud);
        }
        // flashes: one at detonation, a greater one as the cloud swallows the screen
        sc += vec3(1.0, 0.95, 0.85) * exp(-s * 4.0) * 1.7;
        sc = mix(sc, vec3(1.15, 1.12, 1.05), smoothstep(4.0, 5.0, s) * (1.0 - smoothstep(5.3, 6.0, s) * 0.6));
        if (s > 5.0 && hash1(floor(t * 20.0)) > 0.8) sc = 1.0 - sc;
        col = sc;
    }

    /* ---- 2. full-screen static ---- */
    if (uStatic > 0.001) {
        float band = 0.7 + 0.3 * smoothstep(0.0, 0.12, abs(fract(uv.y - t * 0.33) - 0.5));
        col = mix(col, vec3(grain) * scan * band, uStatic);
    }

    /* ---- 3. colour bars, buzzing ---- */
    if (uBars > 0.001) {
        vec2 bu = uv;
        float line = floor(bu.y * uRes.y / 2.0);
        bu.x += (hash(vec2(line, floor(t * 30.0))) - 0.5) * 0.006 * (1.0 - uPsy);
        bu.x += sin(bu.y * 28.0 + t * 22.0) * 0.003 * (1.0 - uPsy);
        float tearBand = step(0.93, hash1(floor(t * 7.0))) * step(abs(bu.y - hash1(floor(t * 7.0) + 2.0)), 0.06);
        bu.x += tearBand * 0.06 * (1.0 - uPsy);
        bu.y += uRoll;
        vec3 b = vec3(bars(bu + vec2(0.004, 0.0)).r, bars(bu).g, bars(bu - vec2(0.004, 0.0)).b);
        b = mix(b, vec3(grain), 0.2 * (1.0 - uPsy));
        b *= mix(scan, 1.0, uPsy);
        col = mix(col, b, uBars);
    }

    /* ---- 4. the melt: oil on water ---- */
    if (uPsy > 0.001) {
        float amt = uPsy;
        vec4 F = texture2D(uField, uv);
        vec2 fv = (F.xy - 0.5) * 2.0;
        float dye = F.z;
        vec2 p = uv - fv * 0.07 * amt;
        vec2 md = (p - uMouse) * A;
        p = uMouse + (rot(0.9 * exp(-dot(md, md) * 6.0) * amt) * md) / A;
        vec2 rd = (p - uRipple.xy) * A;
        float rr = length(rd), rf = uRipple.z * 0.9;
        p += normalize(rd + 1e-5) / A * sin((rr - rf) * 38.0) * 0.025 * exp(-uRipple.z * 1.3) * exp(-abs(rr - rf) * 7.0);
        p = (rot(sin(t * 0.07) * 0.5 * amt) * ((p - 0.5) * A * (1.0 + 0.07 * sin(t * 0.55) * amt))) / A + 0.5;
        vec2 q = p;
        for (int i = 0; i < 5; i++) {
            float fi = float(i);
            q += amt * 0.21 * vec2(sin(q.y * 3.4 + t * 0.32 + fi * 1.7), cos(q.x * 3.0 - t * 0.29 + fi * 2.3));
        }
        vec2 mm = 1.0 - abs(1.0 - mod(q, 2.0));
        vec3 pc = vec3(bars(mm + vec2(0.006, 0.0)).r, bars(mm).g, bars(mm - vec2(0.006, 0.0)).b);
        // wherever the visitor has been, the colours turn
        pc = hueShift(pc, (t * 0.3 + length(q - p) * 2.2) * amt + dye * 4.5);
        float l = dot(pc, vec3(0.333));
        pc = clamp(mix(vec3(l), pc, 1.0 + 0.6 * amt), 0.0, 1.0);
        // petroleum sheen: thin-film rainbows where the paint has been pushed
        vec3 film = 0.5 + 0.5 * cos(6.2831 * (dye * 1.8 + length(fv) * 1.4 + length(q - p) * 0.6 + t * 0.05 + vec3(0.0, 0.33, 0.67)));
        pc = mix(pc, film, clamp(dye * 0.85 + length(fv) * 0.4, 0.0, 0.7) * amt);
        float c = abs(fract(length(q - p) * 6.0 - t * 0.25) - 0.5);
        pc *= 1.0 - 0.18 * amt * (1.0 - smoothstep(0.0, 0.07, c));
        // and it glows
        pc = pc * (1.0 + 0.18 * amt) + 0.05 * amt;
        col = mix(col, pc, smoothstep(0.0, 0.2, uPsy));
    }

    col *= 1.0 - uDim * 0.45;

    /* ---- 5. the title: static in the shape of words ---- */
    if (uTA > 0.001) {
        float k = floor(t * 14.0);
        float row = floor(uv.y * 70.0);
        float slice = step(0.9 - 0.4 * (1.0 - uTA), hash(vec2(row, k)));
        vec2 tp = uv + vec2((hash(vec2(row, k + 1.0)) - 0.5) * 0.06 * slice, 0.0);
        float aR = titleA(uTP + vec2(0.005, 0.0), tp);
        float aG = titleA(uTP, tp);
        float aB = titleA(uTP - vec2(0.005, 0.0), tp);
        float on = uTA >= 0.999 ? 1.0 : step(hash1(k * 1.3), uTA);
        // a dark rim and soft shadow keep it legible; two afterimages show where it's been
        float rim = 0.0;
        for (int i = 0; i < 8; i++) {
            float a = float(i) * 0.785;
            rim = max(rim, titleA(uTP + vec2(cos(a), sin(a) * asp) * 0.0035, tp));
        }
        on *= uTF;
        col *= 1.0 - 0.75 * rim * on;
        col *= 1.0 - 0.45 * titleA(uTP + vec2(0.004, -0.009), uv) * on;
        col += hueShift(vec3(1.0, 0.2, 0.75), t) * titleA(uG1, uv) * 0.22 * on;
        col += hueShift(vec3(0.2, 0.9, 1.0), t * 1.3) * titleA(uG2, uv) * 0.14 * on;
        float tg = hash(floor(uv * uRes / 1.6) + fract(t * 23.0) * vec2(13.0, 71.0));
        float fill = mix(1.0, tg, 0.32) * (0.9 + 0.1 * sin(uv.y * uRes.y * 1.3 - t * 40.0));
        vec3 tc = vec3(aR, aG, aB) * fill * 1.08;
        col = mix(col, tc, max(aR, max(aG, aB)) * on);
    }

    col += (grain - 0.5) * 0.04;
    gl_FragColor = vec4(col, 1.0);
}`;

    let gl, prog, fprog, tex, titleTex, canvas, U = {}, FU = {}, ok = false;
    let fieldTex = [], fieldFb = [], fw = 0, fh = 0, ping = 0;

    function compile(vs, fs) {
        const sh = (type, src) => {
            const s = gl.createShader(type);
            gl.shaderSource(s, src);
            gl.compileShader(s);
            if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
            return s;
        };
        const p = gl.createProgram();
        gl.attachShader(p, sh(gl.VERTEX_SHADER, vs));
        gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs));
        gl.bindAttribLocation(p, 0, 'aPos');
        gl.linkProgram(p);
        if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
        return p;
    }

    function makeTex(w, h, data) {
        const tx = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, tx);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
        return tx;
    }

    function init(c) {
        canvas = c;
        gl = c.getContext('webgl', { antialias: false, preserveDrawingBuffer: true }) || c.getContext('experimental-webgl');
        if (!gl) return false;
        try {
            prog = compile(VERT, FRAG);
            fprog = compile(VERT, FIELD);
        } catch (e) {
            console.warn('Chaos Matters: shader failed', e);
            return false;
        }
        const buf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
        ['uScene', 'uField', 'uTitle', 'uRes', 'uTime', 'uT', 'uCenter', 'uZoom', 'uStatic', 'uBars', 'uRoll', 'uPsy', 'uDim',
         'uMouse', 'uRipple', 'uTP', 'uTS', 'uTA', 'uTF', 'uG1', 'uG2'].forEach(n => U[n] = gl.getUniformLocation(prog, n));
        ['uPrev', 'uTexel', 'uAsp', 'uP1', 'uV1', 'uP2', 'uV2'].forEach(n => FU[n] = gl.getUniformLocation(fprog, n));

        tex = makeTex(1, 1, new Uint8Array([243, 239, 230, 255]));
        titleTex = makeTex(1, 1, new Uint8Array([0, 0, 0, 0]));
        ok = true;
        return true;
    }

    function setScene(source) {
        if (!ok) return;
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
    }

    function setTitle(source) {
        if (!ok) return;
        gl.bindTexture(gl.TEXTURE_2D, titleTex);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
    }

    /* the field is small (about 200px wide); it is smeared up to full screen */
    function makeField() {
        fw = 200;
        fh = Math.max(60, Math.min(420, Math.round(200 * innerHeight / innerWidth)));
        const rest = new Uint8Array(fw * fh * 4);
        for (let i = 0; i < rest.length; i += 4) { rest[i] = 128; rest[i + 1] = 128; rest[i + 2] = 0; rest[i + 3] = 255; }
        fieldTex.forEach(t => gl.deleteTexture(t));
        fieldFb.forEach(f => gl.deleteFramebuffer(f));
        fieldTex = [makeTex(fw, fh, rest), makeTex(fw, fh, rest)];
        fieldFb = fieldTex.map(t => {
            const fb = gl.createFramebuffer();
            gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
            return fb;
        });
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    function resize(scale) {
        if (!ok) return;
        const w = Math.round(innerWidth * scale), h = Math.round(innerHeight * scale);
        if (canvas.width !== w || canvas.height !== h) {
            canvas.width = w; canvas.height = h;
            makeField();
        }
    }

    function stepField(f) {
        gl.useProgram(fprog);
        gl.bindFramebuffer(gl.FRAMEBUFFER, fieldFb[1 - ping]);
        gl.viewport(0, 0, fw, fh);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, fieldTex[ping]);
        gl.uniform1i(FU.uPrev, 0);
        gl.uniform2f(FU.uTexel, 1 / fw, 1 / fh);
        gl.uniform1f(FU.uAsp, innerWidth / innerHeight);
        gl.uniform3f(FU.uP1, f.p1[0], f.p1[1], f.p1[2]);
        gl.uniform2f(FU.uV1, f.v1[0], f.v1[1]);
        gl.uniform3f(FU.uP2, f.p2[0], f.p2[1], f.p2[2]);
        gl.uniform2f(FU.uV2, f.v2[0], f.v2[1]);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        ping = 1 - ping;
    }

    function render(u) {
        if (!ok) return;
        if (u.field) stepField(u.field);
        gl.useProgram(prog);
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, fieldTex[ping]);
        gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, titleTex);
        gl.activeTexture(gl.TEXTURE0);
        gl.uniform1i(U.uScene, 0);
        gl.uniform1i(U.uField, 1);
        gl.uniform1i(U.uTitle, 2);
        gl.uniform2f(U.uRes, canvas.width, canvas.height);
        gl.uniform1f(U.uTime, u.time);
        gl.uniform1f(U.uT, u.T);
        gl.uniform2f(U.uCenter, u.center[0], u.center[1]);
        gl.uniform1f(U.uZoom, u.zoom);
        gl.uniform1f(U.uStatic, u.static);
        gl.uniform1f(U.uBars, u.bars);
        gl.uniform1f(U.uRoll, u.roll);
        gl.uniform1f(U.uPsy, u.psy);
        gl.uniform1f(U.uDim, u.dim);
        gl.uniform2f(U.uMouse, u.mouse[0], u.mouse[1]);
        gl.uniform3f(U.uRipple, u.ripple[0], u.ripple[1], u.ripple[2]);
        gl.uniform2f(U.uTP, u.title.pos[0], u.title.pos[1]);
        gl.uniform2f(U.uTS, u.title.size[0], u.title.size[1]);
        gl.uniform1f(U.uTA, u.title.amt);
        gl.uniform1f(U.uTF, u.title.fade);
        gl.uniform2f(U.uG1, u.title.g1[0], u.title.g1[1]);
        gl.uniform2f(U.uG2, u.title.g2[0], u.title.g2[1]);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    return { init, setScene, setTitle, resize, render, get ok() { return ok; } };
})();
