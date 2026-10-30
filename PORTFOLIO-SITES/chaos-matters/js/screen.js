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
uniform sampler2D uNoise;   // 256px value noise; G is R shifted, for cheap 3D noise
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
uniform vec3  uHot;      // hovered room: xy, strength
uniform vec2  uTP;       // title centre (uv)
uniform vec2  uTS;       // title size (uv)
uniform float uTA;       // title presence 0..1 (flickers in)
uniform float uTF;       // title fade (when the doors are open)
uniform vec2  uG1;       // title ghosts (where it was)
uniform vec2  uG2;

float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float hash1(float n) { return fract(sin(n) * 43758.5453); }
float sq(float x) { return x * x; }
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

float noise3(vec3 x) {
    vec3 p = floor(x), f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    vec2 uv = (p.xy + vec2(37.0, 17.0) * p.z) + f.xy;
    vec2 rg = texture2D(uNoise, (uv + 0.5) / 256.0).yx;
    return mix(rg.x, rg.y, f.z);
}
float fbm3(vec3 p) {
    return (0.5 * noise3(p) + 0.25 * noise3(p * 2.03 + 1.7) + 0.125 * noise3(p * 4.01 + 3.1)) / 0.875;
}
float fbm2(vec2 p, float z) { return fbm3(vec3(p, z)); }

/* ---- the mushroom cloud, as a volume ---- */
float cH, cRt, cRr, cRs, cRb, cRbr, cHeat;
float sdTorus(vec3 p, float R, float r) { return length(vec2(length(p.xz) - R, p.y)) - r; }
float smin(float a, float b, float k) { float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0); return mix(b, a, h) - k * h * (1.0 - h); }
float cloudSDF(vec3 p) {
    float cap = sdTorus(p - vec3(0.0, cH, 0.0), cRt, cRr);
    float dome = length((p - vec3(0.0, cH + cRr * 0.3, 0.0)) * vec3(1.0, 1.4, 1.0)) - cRt * 0.95;
    cap = smin(cap, dome, 0.05);
    float stem = length(p.xz) - cRs * (1.0 + 2.0 * smoothstep(cH * 0.5, cH, p.y));
    stem = max(stem, max(-p.y, p.y - cH));
    float base = sdTorus(p - vec3(0.0, cRbr * 0.5, 0.0), cRb, cRbr);
    return smin(smin(cap, stem, 0.05), base, 0.04);
}

/* march straight through the cloud at this point of the screen; returns colour + transmittance */
vec4 marchCloud(vec2 w, float s, float jit) {
    float zr = cRt + cRr + 0.04;
    if (abs(w.x) > max(zr, cRb + cRbr) + 0.06 || w.y < -0.06 || w.y > cH + cRr + cRt * 0.6 + 0.1) return vec4(0.0, 0.0, 0.0, 1.0);
    const int STEPS = 30;
    float dz = 2.0 * zr / float(STEPS);
    vec3 acc = vec3(0.0);
    float T = 1.0;
    for (int i = 0; i < STEPS; i++) {
        vec3 p = vec3(w.x, w.y, -zr + (float(i) + jit) * dz);
        float d = cloudSDF(p);
        if (d > 0.09) continue;
        // billows roll upward and outward over time
        vec3 np = p * 9.0 + vec3(0.0, -s * 0.45, s * 0.12);
        float n = fbm3(np);
        float dens = clamp((-d + (n - 0.5) * (0.09 + 0.03 * s * 0.1)) / 0.025, 0.0, 1.0);
        if (dens <= 0.0) continue;
        // heat lives in the rolling ring of the cap and the root of the stem, and cools with time
        float ring = length(vec2(length(p.xz) - cRt, p.y - cH)) / max(cRr, 1e-3);
        float core = max(1.0 - ring, 0.0) * 0.9 + max(0.0, 1.0 - p.y / (cH * 0.35)) * 0.5;
        float temp = clamp(cHeat * (0.25 + core) * (0.55 + 0.9 * n), 0.0, 1.2);
        vec3 fire = vec3(1.0, 0.28 + 0.55 * temp, 0.05 + 0.35 * temp * temp) * temp * 3.2;
        float top = clamp((p.y - cH) / (cRr + cRt * 0.4) + 0.5, 0.0, 1.0);
        vec3 smoke = mix(vec3(0.17, 0.12, 0.1), vec3(0.66, 0.44, 0.32), clamp(top * 0.7 + n * 0.6 - 0.2, 0.0, 1.0));
        smoke += vec3(0.9, 0.35, 0.1) * 0.35 * cHeat * (1.0 - top);
        vec3 c = smoke + fire;
        float a = 1.0 - exp(-dens * dz * 55.0);
        acc += T * a * c;
        T *= 1.0 - a;
        if (T < 0.02) break;
    }
    return vec4(acc, T);
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

    /* ---- 1. the blast: a white-out, then the same land in ruins under the cloud ---- */
    if (uStatic < 0.999 && uBars < 0.999) {
        // the cloud's shape over time
        float grow = 1.0 - exp(-s * 0.45);
        cH  = 0.04 + 0.4 * grow;
        cRt = 0.04 + 0.15 * (1.0 - exp(-s * 0.5));
        cRr = 0.04 + 0.08 * (1.0 - exp(-s * 0.5));
        cRs = 0.022 + 0.022 * (1.0 - exp(-s * 0.7));
        cRb = 0.02 + 0.07 * s;
        cRbr = 0.018 + 0.01 * s;
        cHeat = 1.15 * exp(-s * 0.28);

        // in the last seconds the camera is swallowed: we push into the cap
        float e = smoothstep(4.6, 8.4, s);
        vec2 capUv = uCenter + vec2(0.0, cH);
        float Z = 1.0 + 1.4 * e * e;
        vec2 su = mix(capUv, vec2(0.5, 0.55), e) + (uv - capUv) / Z;

        float shake = 0.02 * exp(-s * 1.6) + 0.004 * (1.0 - smoothstep(6.0, 8.5, s));
        su += (vec2(hash1(floor(t * 40.0)), hash1(floor(t * 40.0) + 7.0)) - 0.5) * shake;
        vec2 d = (su - uCenter) * A;
        float r = length(d);
        float R = s * 0.7;
        su -= normalize(d + 1e-5) / A * exp(-sq((r - R) * 8.0)) * 0.06 * exp(-s * 0.6);
        // heat shimmer above the fire
        su.x += sin(su.y * 90.0 + t * 12.0) * 0.0018 * smoothstep(0.5, 0.0, abs(su.y - uCenter.y - 0.05));
        // the signal starts to fail as the smoke closes in
        float fail = smoothstep(8.1, 9.2, s);
        float row = floor(su.y * 46.0);
        su.x += step(1.0 - fail * 0.6, hash(vec2(row, floor(t * 16.0)))) * (hash(vec2(row, floor(t * 16.0) + 3.0)) - 0.5) * 0.3 * fail;
        float px = mix(1.0, 70.0, smoothstep(8.6, 9.4, s));
        if (px > 1.5) { vec2 g = uRes / px; su = (floor(su * g) + 0.5) / g; }

        vec2 zu = uCenter + (su - uCenter) / uZoom;
        float ab = 0.0015 + 0.03 * fail;
        vec3 sc = vec3(texture2D(uScene, zu + vec2(ab, 0.0)).r, texture2D(uScene, zu).g, texture2D(uScene, zu - vec2(ab, 0.0)).b);

        // drifting smoke across the burning sky
        float above = smoothstep(uCenter.y - 0.02, uCenter.y + 0.12, su.y);
        float wisps = fbm2(su * A * 3.0 + vec2(t * 0.04, -t * 0.02), t * 0.05);
        sc = mix(sc, vec3(0.07, 0.04, 0.035), smoothstep(0.45, 0.75, wisps) * 0.6 * above);

        // fires among the ruins, and their light
        float fl = 0.0;
        for (int i = 0; i < 7; i++) {
            float fi = float(i);
            vec2 fp = uCenter + vec2((hash1(fi * 3.1) - 0.5) * 0.3 / asp * 1.6, -0.004 - hash1(fi * 7.7) * 0.05);
            vec2 q = (su - fp) * A;
            float hgt = (0.018 + 0.03 * hash1(fi)) * (0.75 + 0.5 * noise3(vec3(fi * 5.0, t * 7.0, 0.0)));
            float along = clamp(q.y / hgt, 0.0, 1.0);
            float width = 0.006 * (1.0 - along) + 0.0008;
            fl += exp(-sq(q.x / width + sin(q.y * 140.0 + t * 15.0 + fi) * 0.5)) * step(0.0, q.y) * (1.0 - along);
            sc *= 1.0 + 0.6 * exp(-dot(q, q) * 300.0) * smoothstep(0.4, 1.2, s);
        }
        sc += vec3(1.0, 0.5, 0.12) * fl * 1.4 * smoothstep(0.4, 1.2, s);

        // embers rising, ash drifting down
        vec2 eg = su * A * 16.0;
        eg.y -= t * 0.9;
        vec2 eid = floor(eg);
        vec2 ef = fract(eg) - 0.5 - (vec2(hash(eid), hash(eid + 5.0)) - 0.5) * 0.7;
        float ember = smoothstep(0.07, 0.0, length(ef)) * step(0.82, hash(eid + 2.0)) * (0.5 + 0.5 * sin(t * 9.0 + hash(eid) * 20.0));
        sc += vec3(1.0, 0.45, 0.1) * ember * 1.3 * smoothstep(0.6, 1.6, s);

        // the cloud itself
        vec2 w = (su - uCenter) * A;
        vec4 cl = marchCloud(w, s, hash(gl_FragCoord.xy + fract(t)));
        // its glow lights the sky around it
        float gd = length((w - vec2(0.0, cH)) / vec2(1.0, 0.8));
        sc += vec3(1.0, 0.45, 0.15) * 0.55 * cHeat * exp(-gd * gd * 9.0);
        sc = sc * cl.a + cl.rgb;

        // the surge: a churning wall of dust and smoke rushes out from ground zero and swallows the frame
        vec2 dq = (su - uCenter) * A;
        vec2 sq2 = vec2(dq.x, max(dq.y + 0.02, 0.0) * mix(3.2, 0.85, e) + min(dq.y + 0.02, 0.0) * 0.6);
        float rr = length(sq2);
        float rf = sq(smoothstep(4.3, 8.2, s)) * 1.8;
        // billows churn in place and boil upward; no radial streaking
        vec3 bp = vec3(dq * vec2(4.0, 5.0) + vec2(0.0, -s * 0.35), t * 0.1 + s * 0.15);
        float bn = fbm3(bp);
        float bd = fbm3(bp + vec3(0.03, 0.05, 0.0));
        float bf = fbm3(bp * 2.7 + 9.0);
        float edge = rr - rf + (bn - 0.5) * 0.45 + (bf - 0.5) * 0.12;
        float inside = smoothstep(0.03, -0.04, edge) * step(4.3, s);
        float lit = clamp((bn - bd) * 9.0 + 0.5, 0.0, 1.0);
        vec3 dust = mix(vec3(0.13, 0.07, 0.05), vec3(0.85, 0.46, 0.22), clamp(lit * (0.4 + bn) + bf * 0.25 - 0.1, 0.0, 1.0));
        dust += vec3(1.0, 0.42, 0.1) * 0.7 * smoothstep(-0.18, 0.0, edge) * (1.0 - e * 0.5);
        dust *= 0.65 + 0.55 * bn;
        dust *= 1.0 - 0.35 * smoothstep(7.2, 8.6, s);
        sc = mix(sc, dust, inside);

        // white-out at detonation, fading into the aftermath
        sc = mix(sc, vec3(1.0, 0.97, 0.9), s < 0.12 ? 1.0 : exp(-(s - 0.12) * 2.4));
        if (s > 8.4 && hash1(floor(t * 20.0)) > 0.8) sc = 1.0 - sc;
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
        // a hovered room twists the paint around itself
        vec2 hd0 = (p - uHot.xy) * A;
        p = uHot.xy + (rot(2.2 * uHot.z * exp(-dot(hd0, hd0) * 14.0) * sin(t * 1.7)) * hd0) / A;
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
        // the hovered room radiates: a hot core and turning rays of colour
        vec2 hd = (uv - uHot.xy) * A;
        float hr = length(hd);
        float rays = pow(0.5 + 0.5 * sin(atan(hd.y, hd.x) * 12.0 + t * 3.0 - hr * 20.0), 3.0);
        pc += hueShift(vec3(1.0, 0.25, 0.8), t * 2.0 + hr * 8.0) * uHot.z * (exp(-hr * hr * 70.0) * 0.7 + rays * exp(-hr * 4.5) * 0.35);
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

    let gl, prog, fprog, tex, titleTex, noiseTex, canvas, U = {}, FU = {}, ok = false;
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
        ['uScene', 'uField', 'uTitle', 'uNoise', 'uRes', 'uTime', 'uT', 'uCenter', 'uZoom', 'uStatic', 'uBars', 'uRoll', 'uPsy', 'uDim',
         'uMouse', 'uRipple', 'uHot', 'uTP', 'uTS', 'uTA', 'uTF', 'uG1', 'uG2'].forEach(n => U[n] = gl.getUniformLocation(prog, n));
        ['uPrev', 'uTexel', 'uAsp', 'uP1', 'uV1', 'uP2', 'uV2'].forEach(n => FU[n] = gl.getUniformLocation(fprog, n));

        tex = makeTex(1, 1, new Uint8Array([243, 239, 230, 255]));
        titleTex = makeTex(1, 1, new Uint8Array([0, 0, 0, 0]));
        // value noise; G holds R shifted by (37,17) so one fetch gives two z-slices
        const nz = new Uint8Array(256 * 256 * 4), R = new Uint8Array(256 * 256);
        for (let i = 0; i < R.length; i++) R[i] = Math.random() * 256;
        for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) {
            const i = (y * 256 + x) * 4;
            nz[i] = R[y * 256 + x];
            nz[i + 1] = R[((y - 17) & 255) * 256 + ((x - 37) & 255)];
            nz[i + 3] = 255;
        }
        noiseTex = makeTex(256, 256, nz);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
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
        gl.activeTexture(gl.TEXTURE3); gl.bindTexture(gl.TEXTURE_2D, noiseTex);
        gl.activeTexture(gl.TEXTURE0);
        gl.uniform1i(U.uScene, 0);
        gl.uniform1i(U.uField, 1);
        gl.uniform1i(U.uTitle, 2);
        gl.uniform1i(U.uNoise, 3);
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
        gl.uniform3f(U.uHot, u.hot[0], u.hot[1], u.hot[2]);
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
