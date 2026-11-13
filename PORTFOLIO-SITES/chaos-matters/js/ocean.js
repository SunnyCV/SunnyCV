/* ==========================================================
   Chaos Matters — ATLANTIS
   The screen floods slowly from the bottom. What's on it bobs
   and floats as the water reaches it, then drowns in blue as
   the water carries the visitor down into an endless ocean:
   sunlit reefs, kelp forests, schools of fish, jellyfish in the
   deep, a whale now and then, eroded stone, and once in a long
   while the wreck of a ship or a plane. Light pours down from
   the surface in shifting beams and caustics.
   One fragment shader draws all of it.
   ========================================================== */

const Ocean = (() => {
    const VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main() { vUv = aPos * 0.5 + 0.5; gl_Position = vec4(aPos, 0.0, 1.0); }`;

    const FRAG = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uNoise;
uniform sampler2D uFrame;     // the home page at the moment the water came in
uniform vec2  uRes;
uniform float uTime;
uniform float uLevel;         // flood: the waterline, in screen heights from the bottom
uniform float uDrown;         // flood: how far the page has sunk into the blue (0..1)
uniform float uMix;           // 0 = the flooding page, 1 = the open ocean
uniform vec3  uCam;
uniform mat3  uRot;
uniform vec3  uSeed;
uniform vec4  uObj[6];        // stone and wrecks: position, size (0 = none)
uniform vec4  uObjQ[6];       // kind, hash, yaw, tilt
uniform vec4  uJelly[4];      // jellyfish: position, size
uniform vec4  uWhale;         // the big one: position, size
uniform vec4  uWhaleD;        // its heading (xyz) and stroke phase
uniform vec3  uAura;
uniform float uVhs;
uniform float uRoll;
uniform float uStatic;

float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
vec3 hash33(vec3 p) { p = fract(p * vec3(0.1031, 0.1030, 0.0973)); p += dot(p, p.yxz + 33.33); return fract((p.xxy + p.yxx) * p.zyx); }
float sq(float x) { return x * x; }
float noise3(vec3 x) {
    vec3 p = floor(x), f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    vec2 uv = (p.xy + vec2(37.0, 17.0) * p.z) + f.xy;
    vec2 rg = texture2D(uNoise, (uv + 0.5) / 256.0).yx;
    return mix(rg.x, rg.y, f.z);
}
float fbm2o(vec3 p) { return (0.5 * noise3(p) + 0.25 * noise3(p * 2.03 + 1.7)) / 0.75; }
float fbm3(vec3 p) { return (0.5 * noise3(p) + 0.25 * noise3(p * 2.03 + 1.7) + 0.125 * noise3(p * 4.01 + 3.1)) / 0.875; }
mat2 rot(float a) { float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }

/* ---------------- light in water ---------------- */
const vec3 ABS = vec3(0.042, 0.02, 0.015);           // red goes first, then green; blue travels furthest
const vec3 SUN = vec3(0.32, 0.92, 0.22);               // towards the sun (normalised below)
vec3 sunAt(float y) { return exp(min(y, 0.0) * vec3(0.015, 0.0085, 0.0065)) * 1.3; }   // dreamier than real water: warm light reaches the reef   // daylight left at depth y
vec3 waterTint(float y) {
    float k = exp(min(y, 0.0) * 0.012);
    vec3 deep = vec3(0.004, 0.02, 0.08), mid = vec3(0.015, 0.16, 0.42), shallow = vec3(0.10, 0.58, 0.72);
    return mix(deep, mix(mid, shallow, k * k), k);
}
// bright, shifting lines of light thrown by the waves above
float caustic(vec2 q, float t) {
    float a = noise3(vec3(q * 0.42, t * 0.35)), b = noise3(vec3(q * 0.42 * 1.31 + 5.0, t * 0.29 + 3.0));
    float l = 1.0 - smoothstep(0.0, 0.035, abs(a - b));
    float c = noise3(vec3(q * 0.9 + 9.0, t * 0.5)), d = noise3(vec3(q * 0.9 * 1.27 + 2.0, t * 0.43 + 7.0));
    return l * 0.55 + (1.0 - smoothstep(0.0, 0.03, abs(c - d))) * 0.35;
}

/* ---------------- the seabed ---------------- */
float sharedFloor(vec2 p) {     // the same sums of waves run in the page script, so we never swim through it
    float s = 0.5 + 0.5 * sin(p.x * 0.0041 + 1.7) * sin(p.y * 0.0036 + 0.4);
    return -40.0 + 10.0 * sin(p.x * 0.031 + 2.0 * sin(p.y * 0.017)) + 8.0 * sin(p.y * 0.027 + 1.3)
           + 14.0 * sin(p.x * 0.011) * sin(p.y * 0.013) - 70.0 * smoothstep(0.55, 0.95, s);
}
float floorH(vec2 p) { return sharedFloor(p) + (fbm2o(vec3(p * 0.09, 1.0)) - 0.5) * 5.0; }

/* ---------------- shapes for stone and wrecks ---------------- */
float sdBox(vec3 p, vec3 b) { vec3 q = abs(p) - b; return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0); }
float sdCyl(vec3 p, float h, float r) { vec2 d = abs(vec2(length(p.xz), p.y)) - vec2(r, h); return min(max(d.x, d.y), 0.0) + length(max(d, 0.0)); }
float sdCap(vec3 p, vec3 a, vec3 b, float r) { vec3 pa = p - a, ba = b - a; float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0); return length(pa - ba * h) - r; }
float objSDF(vec3 p, vec4 Q) {
    float k = Q.x;
    if (k < 0.5) {                                      // a worn boulder, sometimes an arch
        float d = length(p * vec3(1.0, 1.35, 1.0)) - 1.0;
        d += (fbm2o(p * 2.2 + Q.y * 10.0) - 0.5) * 0.45;
        float hole = length(p.xy * vec2(1.0, 1.1) - vec2(0.0, -0.25)) - 0.52;
        if (Q.y > 0.5) d = max(d, -hole);
        return d * 0.7;
    }
    if (k < 1.5) {                                      // broken columns of a drowned temple
        float d = sdBox(p - vec3(0.0, -0.9, 0.0), vec3(1.3, 0.12, 0.8));
        d = min(d, sdCyl(p - vec3(-0.85, -0.25, 0.35), 0.62, 0.16));
        d = min(d, sdCyl(p - vec3(0.2, -0.55, 0.4), 0.32, 0.16));
        d = min(d, sdCyl(p - vec3(0.95, 0.05, -0.3), 0.92, 0.16));
        vec2 fl = rot(0.5) * (p.xy - vec2(0.2, -0.68));                    // a fallen drum of stone
        d = min(d, sdBox(vec3(fl, p.z + 0.35), vec3(0.75, 0.13, 0.13)));
        d += (noise3(p * 6.0) - 0.5) * 0.05;
        return d;
    }
    if (k < 2.5) {                                      // the wreck of a wooden ship, listing in the sand
        vec3 q = p;
        float w = 0.32 * (1.0 - sq(q.x / 1.05));
        float hull = sdBox(q - vec3(0.0, -0.05, 0.0), vec3(1.05, 0.22, max(w, 0.02)));
        hull = max(hull, -sdBox(q - vec3(0.0, 0.18, 0.0), vec3(0.98, 0.12, max(w - 0.05, 0.01))));   // open deck
        hull = max(hull, -(length(q - vec3(0.45, 0.0, 0.32)) - 0.22));                              // the hole that sank her
        float mast = sdCyl(q - vec3(-0.2, 0.5, 0.0), 0.55, 0.025);
        float mast2 = sdCap(q, vec3(0.45, 0.15, 0.0), vec3(0.95, 0.45, 0.25), 0.02);                // a snapped mast
        return min(hull, min(mast, mast2)) + (noise3(p * 9.0) - 0.5) * 0.02;
    }
    // a plane that ditched long ago, half in the sand
    float body = sdCap(p, vec3(-1.0, 0.0, 0.0), vec3(0.95, 0.05, 0.0), 0.13);
    float wing = sdBox(p - vec3(0.05, -0.02, 0.0), vec3(0.17, 0.025, 1.05));
    wing = max(wing, -(length(p - vec3(0.05, 0.0, 0.85)) - 0.2));                                    // a wing tip torn away
    float tail = sdBox(p - vec3(-0.92, 0.12, 0.0), vec3(0.08, 0.17, 0.02));
    float stab = sdBox(p - vec3(-0.92, 0.04, 0.0), vec3(0.07, 0.015, 0.32));
    return min(min(body, wing), min(tail, stab)) + (noise3(p * 10.0) - 0.5) * 0.015;
}

/* ---------------- the ocean ---------------- */
vec3 ocean(vec3 ro, vec3 rd, vec2 uv) {
    float t = uTime;
    vec3 L = normalize(SUN);
    const float TMAX = 110.0;

    // the water itself, brighter looking up toward the light
    float up = rd.y * 0.5 + 0.5;
    vec3 bgW = waterTint(ro.y + rd.y * 25.0) * (0.5 + 1.1 * up * up) * mix(vec3(1.0), sunAt(ro.y), 0.4);
    bgW += vec3(0.25, 0.55, 0.5) * pow(max(dot(rd, L), 0.0), 6.0) * sunAt(ro.y) * 0.6;          // the glow toward the sun

    // seabed: march the height field
    float tHit = TMAX, kind = 0.0;
    float tt = 0.6;
    for (int i = 0; i < 44; i++) {
        vec3 p = ro + rd * tt;
        float h = p.y - floorH(p.xz);
        if (h < 0.02 * tt) { kind = 1.0; tHit = tt; break; }
        tt += max(h * 0.55, 0.12 + tt * 0.012);
        if (tt > TMAX) break;
    }

    // kelp: one stalk per 9-unit cell where forests grow, found by stepping through the cells the ray crosses
    const float KC = 9.0;
    vec2 cell = floor(ro.xz / KC), stp = sign(rd.xz + 1e-6);
    vec2 rdz = abs(rd.xz) + 1e-5;
    vec2 tNext = ((cell + max(stp, 0.0)) * KC - ro.xz) / (rd.xz + stp * 1e-5);
    vec2 tDel = KC / rdz;
    float kelpT = 1e9; vec3 kelpN = vec3(0.0); float kelpH = 0.0, kelpY = 0.0;
    for (int i = 0; i < 12; i++) {
        vec3 hh = hash33(vec3(cell, 3.0) + uSeed * 7.0);
        float forest = smoothstep(0.58, 0.74, noise3(vec3(cell * 0.07, 2.0)));
        if (hh.x < forest * 0.7) {
            vec2 c = (cell + 0.2 + 0.6 * hh.yz) * KC;
            float base = sharedFloor(c) - 1.0, height = 14.0 + 22.0 * hh.y;
            for (int k = 0; k < 2; k++) {               // a second pass corrects for the sway at the height we hit
                vec2 o2 = ro.xz - c;
                float yG = k == 0 ? ro.y : kelpY;
                float rel = clamp((yG - base) / height, 0.0, 1.0);
                vec2 sway = vec2(sin(t * 0.7 + hh.z * 9.0 + yG * 0.18), cos(t * 0.55 + hh.y * 7.0 + yG * 0.14)) * 1.1 * rel;
                o2 -= sway;
                float r = 0.12 + 0.24 * smoothstep(0.05, 0.3, rel) * (0.55 + 0.45 * sin(yG * 1.9 + hh.x * 20.0));
                float a = dot(rd.xz, rd.xz), b = dot(o2, rd.xz), cc = dot(o2, o2) - r * r;
                float disc = b * b - a * cc;
                if (disc < 0.0) { kelpY = -1e4; break; }
                float th = (-b - sqrt(disc)) / a;
                kelpY = ro.y + rd.y * th;
                if (k == 1 && th > 0.0 && th < kelpT && kelpY > base && kelpY < base + height) {
                    kelpT = th; kelpH = hh.x; kelpN = normalize(vec3(o2 + rd.xz * th, 0.0).xzy);
                }
            }
        }
        if (min(tNext.x, tNext.y) > min(tHit, kelpT)) break;
        if (tNext.x < tNext.y) { tNext.x += tDel.x; cell.x += stp.x; } else { tNext.y += tDel.y; cell.y += stp.y; }
    }
    if (kelpT < tHit) { tHit = kelpT; kind = 2.0; }

    // stone, temples and the rare wreck: sphere-traced only where the ray meets their bounds
    vec3 objP = vec3(0.0); vec4 objQ = vec4(0.0); float objS = 1.0;
    for (int i = 0; i < 6; i++) {
        vec4 O = uObj[i];
        if (O.w <= 0.0) continue;
        vec3 oc = ro - O.xyz;
        float bR = O.w * 1.6, b = dot(oc, rd), c = dot(oc, oc) - bR * bR, h = b * b - c;
        if (h < 0.0) continue;
        float t0 = max(-b - sqrt(h), 0.0), t1 = -b + sqrt(h);
        if (t0 > tHit) continue;
        vec4 Q = uObjQ[i];
        mat2 yr = rot(Q.z);
        float s = t0;
        for (int j = 0; j < 28; j++) {
            vec3 lp = (ro + rd * s - O.xyz) / O.w;
            lp.xz = yr * lp.xz;
            lp.xy = rot(Q.w) * lp.xy;
            float d = objSDF(lp, Q) * O.w;
            if (d < 0.004 * s) {
                if (s < tHit) { tHit = s; kind = 3.0; objP = O.xyz; objQ = Q; objS = O.w; }
                break;
            }
            s += d;
            if (s > t1 || s > tHit) break;
        }
    }

    // shade what we hit
    vec3 p = ro + rd * tHit;
    vec3 col = bgW;
    if (kind > 0.5) {
        vec3 N, base;
        float e = 0.08 + tHit * 0.004;
        if (kind < 1.5) {
            N = normalize(vec3(floorH(p.xz - vec2(e, 0.0)) - floorH(p.xz + vec2(e, 0.0)), 2.0 * e, floorH(p.xz - vec2(0.0, e)) - floorH(p.xz + vec2(0.0, e))));
            // sand, rock, sea grass and coral gardens
            float n1 = fbm3(vec3(p.xz * 0.12, 4.0)), n2 = fbm2o(vec3(p.xz * 0.5, 9.0)), n3 = noise3(vec3(p.xz * 2.2, 1.0));
            vec3 sand = mix(vec3(0.62, 0.55, 0.42), vec3(0.78, 0.70, 0.55), n2);
            vec3 rock = mix(vec3(0.24, 0.24, 0.26), vec3(0.36, 0.33, 0.30), n3);
            base = mix(sand, rock, smoothstep(0.55, 0.7, n1) * smoothstep(0.75, 0.4, N.y));
            float reef = smoothstep(0.40, 0.58, noise3(vec3(p.xz * 0.045, 6.0))) * smoothstep(-85.0, -30.0, p.y);
            float blob = smoothstep(0.55, 0.72, noise3(vec3(p.xz * 0.7, 2.0)) + n3 * 0.25);
            // each clump of coral takes one colour from the reef's palette, blended softly at the edges
            float c1 = noise3(vec3(p.xz * 0.28, 8.0)), c2 = noise3(vec3(p.xz * 0.28 + 31.0, 5.0));
            vec3 pinkC = mix(vec3(1.0, 0.36, 0.46), vec3(1.0, 0.58, 0.36), n3);
            vec3 violetC = mix(vec3(0.6, 0.38, 0.95), vec3(0.88, 0.5, 0.9), n1);
            vec3 tealC = mix(vec3(0.2, 0.82, 0.72), vec3(0.45, 0.9, 0.55), n3);
            vec3 goldC = mix(vec3(1.0, 0.8, 0.32), vec3(1.0, 0.55, 0.22), n1);
            vec3 coral = mix(mix(pinkC, violetC, smoothstep(0.42, 0.58, c1)), mix(goldC, tealC, smoothstep(0.42, 0.58, c1)), smoothstep(0.45, 0.6, c2));
            coral *= 1.55;
            float cm = reef * blob;
            base = mix(base, coral, cm);
            if (cm > 0.05) {
                float knob = noise3(vec3(p.xz * 3.5, p.y * 3.5));
                N = normalize(N + vec3(knob - 0.5, 0.0, noise3(vec3(p.zx * 3.5, 7.0)) - 0.5) * 1.4 * cm);
                base *= 0.75 + 0.5 * knob;
            }
            float grass = smoothstep(0.55, 0.7, noise3(vec3(p.xz * 0.06, 12.0))) * (1.0 - reef) * smoothstep(0.85, 0.95, N.y);
            base = mix(base, mix(vec3(0.15, 0.38, 0.12), vec3(0.32, 0.48, 0.16), n3), grass * smoothstep(0.35, 0.7, n2));
            base *= 0.85 + 0.3 * n3;
        } else if (kind < 2.5) {
            N = normalize(kelpN + vec3(0.0, 0.6, 0.0));
            float vein = noise3(p * vec3(1.5, 4.0, 1.5));
            base = mix(vec3(0.35, 0.42, 0.08), vec3(0.62, 0.48, 0.12), kelpH) * (0.7 + 0.6 * vein);
        } else {
            vec3 lp = (p - objP) / objS;
            lp.xz = rot(objQ.z) * lp.xz; lp.xy = rot(objQ.w) * lp.xy;
            vec2 ee = vec2(0.01, 0.0);
            vec3 nl = normalize(vec3(objSDF(lp + ee.xyy, objQ) - objSDF(lp - ee.xyy, objQ), objSDF(lp + ee.yxy, objQ) - objSDF(lp - ee.yxy, objQ), objSDF(lp + ee.yyx, objQ) - objSDF(lp - ee.yyx, objQ)));
            nl.xy = rot(-objQ.w) * nl.xy; nl.xz = rot(-objQ.z) * nl.xz;
            N = nl;
            float m = fbm3(p * 1.3);
            vec3 mat = objQ.x < 0.5 ? vec3(0.36, 0.33, 0.30) : objQ.x < 1.5 ? vec3(0.72, 0.68, 0.58) : objQ.x < 2.5 ? vec3(0.30, 0.20, 0.12) : vec3(0.42, 0.44, 0.46);
            // moss and weed take over everything facing up, and rust and coral creep over the rest
            vec3 moss = mix(vec3(0.16, 0.32, 0.12), vec3(0.32, 0.42, 0.14), m);
            base = mix(mat * (0.7 + 0.5 * m), moss, smoothstep(0.1, 0.7, N.y + m * 0.5 - 0.2));
            base = mix(base, vec3(0.62, 0.30, 0.16), smoothstep(0.62, 0.72, m) * step(2.5, objQ.x));
            base = mix(base, vec3(0.9, 0.45, 0.5), smoothstep(0.7, 0.78, noise3(p * 3.0)) * 0.7);
        }
        // daylight from above, scattered and patterned by the waves
        float diff = max(dot(N, L), 0.0) * 0.8 + 0.25 * (N.y * 0.5 + 0.5);
        vec2 cq = p.xz + L.xz / L.y * (-p.y);
        float cau = caustic(cq, t) * smoothstep(-95.0, -8.0, p.y) * max(N.y, 0.0);
        vec3 lit = base * sunAt(p.y) * (diff * 1.15 + cau * 1.3) + base * waterTint(p.y) * 0.5;
        if (kind > 1.5 && kind < 2.5) lit += base * vec3(1.1, 1.2, 0.5) * (0.35 + 0.9 * pow(max(dot(rd, L), 0.0), 2.0)) * sunAt(p.y) * 0.8;   // light glowing through the blades   // light through the blades
        // the water between us and it
        vec3 tr = exp(-ABS * tHit * (1.0 + 0.6 * smoothstep(-20.0, -140.0, ro.y)));
        col = lit * tr + bgW * (1.0 - tr);
        if (kind < 1.5) col = mix(col, bgW, smoothstep(TMAX * 0.7, TMAX, tHit));
    }

    // the surface seen from below: a bright window to the sky, a silver mirror around it
    if (rd.y > 0.0) {
        float ts = -ro.y / rd.y;
        if (ts < tHit) {
            vec2 sp = ro.xz + rd.xz * ts;
            vec2 wv = vec2(noise3(vec3(sp * 0.25, t * 0.5)), noise3(vec3(sp * 0.25 + 7.0, t * 0.45))) - 0.5;
            float cw = rd.y + (wv.x + wv.y) * 0.12;
            float window = smoothstep(0.62, 0.72, cw);
            vec3 sky = mix(vec3(0.55, 0.85, 0.95), vec3(1.0, 0.98, 0.9), pow(max(dot(normalize(rd + vec3(wv.x, 0.0, wv.y) * 0.25), L), 0.0), 24.0));
            vec3 mirror = waterTint(-8.0) * (0.7 + 0.35 * caustic(sp * 0.6, t));
            vec3 sc = mix(mirror, sky * 1.6, window);
            vec3 tr = exp(-ABS * ts);
            col = sc * tr + col * 0.15 * (1.0 - tr) + bgW * (1.0 - tr) * 0.85;
        }
    }

    // shafts of sunlight: the wave pattern above, projected down through the water
    {
        float shafts = 0.0;
        float lim = min(tHit, 46.0);
        for (int i = 0; i < 7; i++) {
            float s = (float(i) + 0.5) / 7.0 * lim;
            vec3 q = ro + rd * s;
            vec2 sq2 = q.xz + L.xz / L.y * (-q.y);
            float beam = smoothstep(0.35, 0.85, noise3(vec3(sq2 * 0.09, t * 0.08)) * 0.7 + noise3(vec3(sq2 * 0.23, t * 0.15 + 4.0)) * 0.5);
            shafts += beam * exp(min(q.y, 0.0) * 0.03) * exp(-s * 0.03);
        }
        col += vec3(0.6, 0.9, 0.92) * shafts / 7.0 * (0.3 + 0.9 * pow(max(dot(rd, L), 0.0), 2.0)) * 0.9;
    }

    // schools of fish in the nearest cells, each a sleek little body turning together
    {
        const float FC = 12.0;
        vec3 fc0 = floor(ro / FC - 0.5);
        for (int x = 0; x <= 1; x++)
        for (int y = 0; y <= 1; y++)
        for (int z = 0; z <= 1; z++) {
            vec3 id = fc0 + vec3(float(x), float(y), float(z));
            vec3 h = hash33(id * 1.3 + uSeed * 3.0);
            if (h.x < 0.3) continue;
            vec3 cen = (id + 0.5) * FC + (h - 0.5) * 5.0;
            if (cen.y > -2.0 || cen.y < sharedFloor(cen.xz) + 3.0) continue;
            { vec3 oc = ro - cen; float b = dot(oc, rd), c = dot(oc, oc) - 36.0; if (b * b - c < 0.0 || -b - sqrt(max(b * b - c, 0.0)) > tHit) continue; }
            float spd = 0.25 + 0.2 * h.y, ph = h.z * 6.28;
            // a few kinds of fish: silver shoals, yellow tangs, blue chromis, orange clownish ones with white bands
            float kindF = floor(h.y * 4.0);
            vec3 back = kindF < 1.0 ? vec3(0.25, 0.38, 0.5) : kindF < 2.0 ? vec3(1.0, 0.82, 0.18) : kindF < 3.0 ? vec3(0.18, 0.45, 1.0) : vec3(1.0, 0.45, 0.12);
            vec3 belly = kindF < 1.0 ? vec3(0.85, 0.9, 0.95) : mix(back, vec3(1.0), 0.35);
            float scale = kindF < 1.0 ? 0.75 : 1.0 + 0.4 * h.x;
            for (int f = 0; f < 7; f++) {
                float ff = float(f);
                vec3 o = hash33(id + ff * 17.3) - 0.5;
                float a = t * spd + ph + ff * 0.35 + o.x * 2.0;
                float rr = 2.2 + 1.6 * o.y;
                vec3 fp = cen + vec3(cos(a) * rr, o.z * 2.0 + sin(a * 1.7) * 0.4, sin(a) * rr);
                vec3 fw = normalize(vec3(-sin(a), 0.1 * cos(a * 1.7), cos(a)));
                vec3 fr = normalize(cross(vec3(0.0, 1.0, 0.0), fw)), fu = cross(fw, fr);
                vec3 oc = ro - fp;
                vec3 lo0 = vec3(dot(oc, fr), dot(oc, fu), dot(oc, fw)), ld0 = vec3(dot(rd, fr), dot(rd, fu), dot(rd, fw));
                float wag = sin(t * 9.0 + ff * 1.7 + h.z * 6.0);
                float best = 1e9; vec3 bn = vec3(0.0); float part = 0.0;
                for (int k = 0; k < 3; k++) {
                    vec3 sz = (k == 0 ? vec3(0.10, 0.15, 0.36) : vec3(0.012, 0.03, 0.12)) * scale;
                    vec3 off = k == 0 ? vec3(wag * 0.02, 0.0, 0.0) : vec3(wag * 0.08 * scale, (k == 1 ? 0.07 : -0.07) * scale, -0.43 * scale);
                    vec3 lo = lo0 - off, ld = ld0;
                    if (k > 0) {                                     // each lobe angles away from the other
                        float ang = k == 1 ? 0.65 : -0.65;
                        lo.yz = rot(ang) * lo.yz; ld.yz = rot(ang) * ld.yz;
                    }
                    lo /= sz; ld /= sz;
                    float A2 = dot(ld, ld), B = dot(lo, ld), C = dot(lo, lo) - 1.0, D = B * B - A2 * C;
                    if (D < 0.0) continue;
                    float th = (-B - sqrt(D)) / A2;
                    if (th > 0.0 && th < best) { best = th; bn = normalize(lo + ld * th); part = float(k); }
                }
                if (best > tHit) continue;
                float stripe = kindF > 2.5 ? step(0.82, fract((lo0.z + ld0.z * best) / scale * 3.2 + 0.3)) : 0.0;
                vec3 bodyC = mix(belly, back, smoothstep(-0.3, 0.5, bn.y));
                bodyC = mix(bodyC, vec3(1.0), stripe);
                if (part > 0.5) bodyC = back * 0.9;
                vec3 body = bodyC * (0.45 + 0.6 * max(bn.y, 0.0) + 0.2 * abs(bn.x));
                body += vec3(1.0) * pow(max(bn.y, 0.0), 8.0) * (kindF < 1.0 ? 0.6 : 0.25);     // the flash of scales in the light
                body *= sunAt(fp.y) * 1.05 + waterTint(fp.y) * 0.45;
                vec3 tr = exp(-ABS * best);
                col = body * tr + bgW * (1.0 - tr);
                tHit = best;
            }
        }
    }

    // the big one: a whale gliding through the haze
    if (uWhale.w > 0.0) {
        vec3 fw = normalize(uWhaleD.xyz), fr = normalize(cross(vec3(0.0, 1.0, 0.0), fw)), fu = cross(fw, fr);
        vec3 oc = ro - uWhale.xyz;
        vec3 lo = vec3(dot(oc, fr), dot(oc, fu), dot(oc, fw));
        vec3 ld = vec3(dot(rd, fr), dot(rd, fu), dot(rd, fw));
        float best = 1e9;
        for (int k = 0; k < 2; k++) {
            vec3 sz = k == 0 ? vec3(0.22, 0.2, 1.0) * uWhale.w : vec3(0.55, 0.035, 0.12) * uWhale.w;   // body, then the flukes
            vec3 off = k == 0 ? vec3(0.0) : vec3(0.0, sin(uWhaleD.w) * 0.08 * uWhale.w, -1.02 * uWhale.w);
            vec3 a = (lo - off) / sz, b = ld / sz;
            float A2 = dot(b, b), B = dot(a, b), C = dot(a, a) - 1.0, D = B * B - A2 * C;
            if (D > 0.0) { float th = (-B - sqrt(D)) / A2; if (th > 0.0) best = min(best, th); }
        }
        if (best < tHit) {
            vec3 q = ro + rd * best;
            vec3 body = vec3(0.16, 0.2, 0.26) * (sunAt(q.y) * 0.9 + 0.2);
            vec3 tr = exp(-ABS * best * 0.8);
            col = body * tr + bgW * (1.0 - tr);
            tHit = best;
        }
    }

    // jellyfish: soft glowing bells trailing light, mostly in the deep
    for (int i = 0; i < 4; i++) {
        vec4 J = uJelly[i];
        if (J.w <= 0.0) continue;
        vec3 oc = J.xyz - ro;
        float tc = dot(oc, rd);
        if (tc < 0.0 || tc > tHit) continue;
        float dm = length(oc - rd * tc);
        float pulse = 0.85 + 0.15 * sin(t * 1.6 + float(i) * 2.0);
        vec3 jc = mix(vec3(0.45, 0.75, 1.0), vec3(1.0, 0.5, 0.85), fract(J.w * 7.3));
        float bell = exp(-sq(dm / (J.w * pulse))) ;
        // trailing tentacles below the bell
        vec3 below = ro + rd * tc - J.xyz;
        float tent = exp(-sq(length(below.xz) / (J.w * 0.35))) * smoothstep(0.0, -J.w * 0.3, below.y) * smoothstep(-J.w * 4.0, -J.w * 0.5, below.y);
        tent *= 0.6 + 0.4 * sin(below.y * 6.0 / J.w + t * 2.0);
        float deep = 0.35 + 0.65 * smoothstep(-20.0, -90.0, J.y);
        col += jc * (bell * 0.7 + tent * 0.35) * exp(-tc * 0.035) * deep;
    }

    // drifting marine snow, which glows in the deep
    {
        const float S = 5.0;
        vec3 sc0 = floor(ro / S - 0.5);
        float glowDeep = smoothstep(-45.0, -110.0, ro.y);
        for (int x = 0; x <= 1; x++)
        for (int y = 0; y <= 1; y++)
        for (int z = 0; z <= 1; z++) {
            vec3 id = sc0 + vec3(float(x), float(y), float(z));
            vec3 h = hash33(id * 1.7 + uSeed * 5.0);
            vec3 op = (id + 0.2 + 0.6 * h) * S - ro;
            op.y -= mod(t * 0.15 + h.x * 5.0, S) - S * 0.5;
            float tp = dot(op, rd);
            if (tp < 0.2 || tp > tHit) continue;
            float dm2 = dot(op, op) - tp * tp;
            float w = max(0.01, 1.2 / (1.25 * uRes.y));
            vec3 c = mix(vec3(0.75, 0.85, 0.8) * (sunAt(ro.y) + 0.15), vec3(0.3, 0.9, 1.0) * 1.4, glowDeep * step(0.6, h.z));
            col += c * exp(-dm2 / sq(w * tp)) * 0.35 * (0.01 / w) * (1.0 - smoothstep(4.0, 9.0, tp));
        }
    }
    return col;
}

/* ---------------- the flood ---------------- */
vec3 flood(vec2 uv, vec2 A) {
    float t = uTime;
    // the waterline, rolling as it rises
    float line = uLevel + 0.010 * sin(uv.x * 7.0 * A.x + t * 1.9) + 0.006 * sin(uv.x * 19.0 * A.x - t * 2.7) + 0.003 * sin(uv.x * 43.0 - t * 4.1);
    float below = line - uv.y;                                  // how far under water this point is
    vec3 page = texture2D(uFrame, uv).rgb;
    if (below <= 0.0) {
        // dry, but the water's glow climbs the wall just above it
        page += vec3(0.25, 0.55, 0.6) * exp(below * 60.0) * 0.12 * step(0.0, uLevel);
        return page;
    }
    // under water: things lift and bob as the water takes them, then slowly sink into the blue
    float sub = smoothstep(0.0, 0.18, below);
    vec2 q = uv;
    q.y -= 0.05 * sub * (1.0 - uDrown) - 0.12 * uDrown * uDrown;              // float up, then go down
    q.x += sin(t * 1.3 + uv.y * 18.0) * 0.008 * sub + sin(t * 0.7 + uv.y * 7.0) * 0.006 * sub;
    vec2 ref = vec2(noise3(vec3(uv * 9.0 * A, t * 0.7)), noise3(vec3(uv * 9.0 * A + 5.0, t * 0.6))) - 0.5;
    q += ref * (0.012 + 0.02 * uDrown) * sub;
    float blur = (0.002 + 0.012 * uDrown) * sub;
    vec3 seen = (texture2D(uFrame, q).rgb + texture2D(uFrame, q + vec2(blur, 0.0)).rgb + texture2D(uFrame, q - vec2(0.0, blur)).rgb) / 3.0;
    // water colour: absorbing red first, deeper below the line and as the drowning goes on
    float d = below * 6.0 + uDrown * 9.0;
    vec3 tr = exp(-ABS * d * 6.0);
    vec3 water = mix(vec3(0.08, 0.42, 0.52), vec3(0.01, 0.08, 0.16), smoothstep(0.0, 1.0, below * 1.2 + uDrown));
    vec3 col = seen * tr * mix(vec3(0.75, 0.95, 1.0), vec3(1.0), 0.0) + water * (1.0 - tr);
    // caustics dancing over whatever is under water
    float cau = caustic(uv * vec2(A.x, 1.0) * 30.0, t * 1.4);
    col += vec3(0.55, 0.9, 0.95) * cau * 0.18 * (1.0 - uDrown) * exp(-below * 2.0);
    // light rays slanting down from the surface
    float rays = smoothstep(0.55, 0.9, noise3(vec3((uv.x * A.x + uv.y * 0.35) * 6.0, 1.0, t * 0.15)));
    col += vec3(0.5, 0.85, 0.9) * rays * 0.16 * exp(-below * 3.0) * (0.4 + 0.6 * (1.0 - uDrown));
    // the underside of the surface shines like silver, and a bright line where water meets air
    col += vec3(0.7, 0.95, 1.0) * exp(-below * 70.0) * 0.55;
    col += vec3(1.0) * exp(-sq(below * 260.0)) * 0.6;
    // bubbles rising through it
    vec2 bq = vec2(uv.x * A.x * 26.0, uv.y * 26.0 - t * 2.2);
    vec2 bi = floor(bq), bf = fract(bq) - 0.5;
    float bh = hash(bi + floor(uSeed.xy * 50.0));
    bf.x += sin(t * 3.0 + bh * 40.0) * 0.18;
    float br = 0.08 + 0.18 * hash(bi + 3.1);
    float ring = smoothstep(br, br * 0.7, length(bf)) - smoothstep(br * 0.7, br * 0.35, length(bf)) * 0.6;
    col += vec3(0.75, 0.95, 1.0) * ring * step(0.86, bh) * 0.5 * sub * (1.0 - uDrown * 0.6);
    return col;
}

void main() {
    vec2 uv = vUv;
    vec2 A = vec2(uRes.x / uRes.y, 1.0);
    float t = uTime;

    if (uVhs > 0.0) {
        float line = floor(uv.y * uRes.y / 3.0);
        uv.x += (sin(uv.y * 35.0 + t * 50.0) * 0.004 + (hash(vec2(line, floor(t * 24.0))) - 0.5) * 0.01) * uVhs;
        float band = step(0.94, hash(vec2(floor(uv.y * 14.0 - t * 9.0), floor(t * 12.0))));
        uv.x += band * 0.06 * uVhs;
        uv.y = fract(uv.y + uRoll);
        uv.y = 0.5 + (uv.y - 0.5) * (1.0 + 0.35 * uVhs * smoothstep(0.3, 1.0, fract(uRoll)));
    }

    vec3 col = vec3(0.0);
    if (uMix < 1.0) col = flood(uv, A);
    if (uMix > 0.0) {
        vec2 sc = (uv - 0.5) * A;
        // a gentle wobble, as if seen through moving water
        sc += vec2(sin(sc.y * 6.0 + t * 0.9), cos(sc.x * 5.0 + t * 0.7)) * 0.0025;
        vec3 rd = normalize(uRot * vec3(sc, 1.2));
        vec3 oc = ocean(uCam, rd, uv);
        col = mix(col, oc, uMix);
    }

    // the visitor's light: a soft shimmer wherever the pointer drifts
    if (uAura.z > 0.0) {
        vec2 ap = (vUv - uAura.xy) * A;
        float ad = length(ap);
        col *= 1.0 + exp(-ad * ad * 18.0) * 0.35 * uAura.z;
        col += vec3(0.5, 0.95, 1.0) * (exp(-ad * ad * 700.0) * 0.35 + exp(-ad * ad * 60.0) * 0.06) * uAura.z;
    }

    // filmic response, vignette, a whisper of grain
    col = 1.0 - exp(-col * 1.3);
    col *= 1.0 - 0.32 * dot((vUv - 0.5) * A, (vUv - 0.5) * A);
    float grain = hash(floor(vUv * uRes) + fract(t * 7.0) * 91.0);
    col += (grain - 0.5) * 0.007;
    if (uVhs > 0.0) {
        float scan = 0.85 + 0.15 * sin(vUv.y * uRes.y * 1.5);
        col = mix(col, vec3(dot(col, vec3(0.33))), 0.25 * uVhs) * mix(1.0, scan, uVhs);
        col += vec3(0.9) * step(0.985, hash(vec2(floor(vUv.y * 90.0), floor(t * 30.0)))) * 0.35 * uVhs;
    }
    col = mix(col, vec3(grain), uStatic);
    gl_FragColor = vec4(col, 1.0);
}`;

    let ready = Promise.resolve(false);
    let canvas, gl, prog, U = {}, frameTex, noiseTex, ok = false, scale = 1;
    let S = null;
    const cam = { pos: [0, -12, 0], yaw: 0, pitch: -0.12, yawV: 0, pitchV: 0, boost: 0 };
    const aim = { x: 0.5, y: 0.5, on: false };
    let drag = null;

    const smooth = (a, b, x) => { const k = Math.min(1, Math.max(0, (x - a) / (b - a))); return k * k * (3 - 2 * k); };

    // the same seabed the shader draws (without its fine detail), so the visitor never swims through it
    function sharedFloor(x, z) {
        const s = 0.5 + 0.5 * Math.sin(x * 0.0041 + 1.7) * Math.sin(z * 0.0036 + 0.4);
        const k = Math.min(1, Math.max(0, (s - 0.55) / 0.4)), st = k * k * (3 - 2 * k);
        return -40 + 10 * Math.sin(x * 0.031 + 2 * Math.sin(z * 0.017)) + 8 * Math.sin(z * 0.027 + 1.3)
               + 14 * Math.sin(x * 0.011) * Math.sin(z * 0.013) - 70 * st;
    }

    function compile(vs, fs) {
        const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
        const p = gl.createProgram();
        p._sh = [sh(gl.VERTEX_SHADER, vs), sh(gl.FRAGMENT_SHADER, fs)];
        p._sh.forEach(s => gl.attachShader(p, s));
        gl.bindAttribLocation(p, 0, 'aPos');
        gl.linkProgram(p);
        return p;
    }

    function tex(w, h, data, repeat) {
        const t = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, t);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, repeat ? gl.REPEAT : gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, repeat ? gl.REPEAT : gl.CLAMP_TO_EDGE);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
        return t;
    }

    function init(c) {
        canvas = c;
        gl = c.getContext('webgl', { antialias: false }) || c.getContext('experimental-webgl');
        if (!gl) return false;
        prog = compile(VERT, FRAG);
        const nz = new Uint8Array(256 * 256 * 4), R = new Uint8Array(256 * 256);
        for (let i = 0; i < R.length; i++) R[i] = Math.random() * 256;
        for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) {
            const i = (y * 256 + x) * 4;
            nz[i] = R[y * 256 + x];
            nz[i + 1] = R[((y - 17) & 255) * 256 + ((x - 37) & 255)];
            nz[i + 3] = 255;
        }
        noiseTex = tex(256, 256, nz, true);
        frameTex = tex(1, 1, new Uint8Array([0, 0, 0, 255]), false);
        const buf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
        const ext = gl.getExtension('KHR_parallel_shader_compile');
        ready = new Promise(res => {
            const poll = () => { if (!ext || gl.getProgramParameter(prog, ext.COMPLETION_STATUS_KHR)) res(); else setTimeout(poll, 25); };
            poll();
        }).then(() => {
            if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
                console.warn('Chaos Matters: ocean shader failed', gl.getProgramInfoLog(prog), prog._sh.map(s => gl.getShaderInfoLog(s)).join(' '));
                return false;
            }
            gl.useProgram(prog);
            ['uNoise', 'uFrame', 'uRes', 'uTime', 'uLevel', 'uDrown', 'uMix', 'uCam', 'uRot', 'uSeed', 'uObj', 'uObjQ', 'uJelly',
             'uWhale', 'uWhaleD', 'uAura', 'uVhs', 'uRoll', 'uStatic'].forEach(n => U[n] = gl.getUniformLocation(prog, n));
            ok = true;
            return true;
        });
        wire();
        return true;
    }

    function warm() {
        if (!ok) return;
        gl.useProgram(prog);
        gl.viewport(0, 0, 1, 1);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4));
    }

    let quality = 1;
    function setQuality(q) { quality = q; if (S) resize(); }
    function resize() {
        if (!ok) return;
        // the flood is cheap; the open ocean is the costliest scene on the site, so it gets a smaller budget
        const dpr = Math.min(devicePixelRatio || 1, 2);
        const base = S && S.under ? 1.05e6 : 1.8e6;
        const budget = base * quality * quality, px = innerWidth * innerHeight * dpr * dpr;
        scale = px > budget ? dpr * Math.sqrt(budget / px) : dpr;
        const w = Math.round(innerWidth * scale), h = Math.round(innerHeight * scale);
        if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    }

    /* ---------- the show ---------- */
    // seconds from the click
    const K = { calm: 1.8, flood: [0.9, 8.2], drown: [7.4, 10.4], under: [9.6, 11.8], explore: 12.6 };

    function capture(source) {
        gl.bindTexture(gl.TEXTURE_2D, frameTex);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    }

    function start(opts) {
        S = { t: 0, opts, captured: false, consumed: false, under: false, rewind: null, roll: 0, returned: false,
              seed: [Math.random(), Math.random(), Math.random()] };
        // somewhere over a reef, a little below the surface
        for (let tries = 0; tries < 40; tries++) {
            const x = Math.random() * 4000 - 2000, z = Math.random() * 4000 - 2000;
            const f = sharedFloor(x, z);
            cam.pos = [x, Math.max(f + 16, -14), z];
            if (f > -55 && f < -28) break;
        }
        cam.yaw = Math.random() * Math.PI * 2; cam.pitch = -0.16; cam.yawV = cam.pitchV = 0; cam.boost = 0;
        aim.on = false;
        resize();
    }

    function forward() {
        const cp = Math.cos(cam.pitch);
        return [Math.sin(cam.yaw) * cp, Math.sin(cam.pitch), Math.cos(cam.yaw) * cp];
    }

    /* what's near: stone and wrecks on the seabed, jellyfish in the water, perhaps a whale */
    const bodies = { obj: new Float32Array(24), objQ: new Float32Array(24), jelly: new Float32Array(16), whale: new Float32Array(4), whaleD: new Float32Array(4) };
    function h3(x, y, z, k) {
        let h = Math.sin(x * 127.1 + y * 311.7 + z * 74.7 + k * 53.3) * 43758.5453;
        const a = h - Math.floor(h);
        h = Math.sin(x * 269.5 + y * 183.3 + z * 246.1 + k * 91.7) * 43758.5453;
        const b = h - Math.floor(h);
        h = Math.sin(x * 113.5 + y * 271.9 + z * 124.6 + k * 17.1) * 43758.5453;
        return [a, b, h - Math.floor(h)];
    }
    function listBodies(t) {
        const B = bodies, P = cam.pos;
        B.obj.fill(0); B.objQ.fill(0); B.jelly.fill(0); B.whale.fill(0);
        // the seabed in 34-unit cells: mostly stone, sometimes a temple, rarely a wreck
        const C = 34, cx = Math.floor(P[0] / C), cz = Math.floor(P[2] / C), found = [];
        for (let x = -3; x <= 3; x++) for (let z = -3; z <= 3; z++) {
            const ix = cx + x, iz = cz + z, h = h3(ix, 0, iz, 21);
            let kind;
            if (h[0] < 0.30) kind = 0;          // stone
            else if (h[0] < 0.38) kind = 1;     // ruins
            else if (h[0] < 0.395) kind = 2;    // a ship, rarely
            else if (h[0] < 0.405) kind = 3;    // a plane, more rarely still
            else continue;
            const o = h3(ix, 1, iz, 22);
            const px = (ix + 0.2 + 0.6 * o[0]) * C, pz = (iz + 0.2 + 0.6 * o[1]) * C;
            const size = kind === 0 ? 2.5 + 5 * o[2] : kind === 1 ? 5 + 3 * o[2] : kind === 2 ? 11 + 4 * o[2] : 7 + 2 * o[2];
            const sink = kind === 0 ? 0.35 : kind === 1 ? 0.75 : kind === 2 ? 0.05 : 0.02;
            const py = sharedFloor(px, pz) + size * sink;
            const d = Math.hypot(px - P[0], py - P[1], pz - P[2]);
            if (d > 140) continue;
            found.push({ p: [px, py, pz, size], q: [kind, o[2], o[0] * 6.283, kind >= 2 ? (o[1] - 0.5) * 0.5 : 0], d });
        }
        found.sort((a, b) => a.d - b.d).slice(0, 6).forEach((f, i) => { B.obj.set(f.p, i * 4); B.objQ.set(f.q, i * 4); });
        // jellyfish drift in 26-unit cells, mostly well below the sunlight
        const J = 26, jx = Math.floor(P[0] / J), jy = Math.floor(P[1] / J), jz = Math.floor(P[2] / J), jl = [];
        for (let x = -2; x <= 2; x++) for (let y = -2; y <= 2; y++) for (let z = -2; z <= 2; z++) {
            const h = h3(jx + x, jy + y, jz + z, 31);
            const py = (jy + y + 0.5) * J + Math.sin(t * 0.3 + h[1] * 9) * 2;
            if (h[0] > 0.12 + 0.5 * Math.min(1, Math.max(0, (-py - 30) / 80))) continue;
            if (py > -6 || py < sharedFloor((jx + x) * J, (jz + z) * J) + 4) continue;
            const p = [(jx + x + 0.25 + 0.5 * h[1]) * J + Math.sin(t * 0.1 + h[2] * 7) * 3, py, (jz + z + 0.25 + 0.5 * h[2]) * J];
            jl.push({ p: [...p, 0.6 + 1.4 * h[2]], d: Math.hypot(p[0] - P[0], p[1] - P[1], p[2] - P[2]) });
        }
        jl.sort((a, b) => a.d - b.d).slice(0, 4).forEach((j, i) => B.jelly.set(j.p, i * 4));
        // now and then a whale passes on a long, slow circle
        const W = 420, wx = Math.floor(P[0] / W), wz = Math.floor(P[2] / W);
        let best = null;
        for (let x = -1; x <= 1; x++) for (let z = -1; z <= 1; z++) {
            const h = h3(wx + x, 0, wz + z, 41);
            if (h[0] > 0.6) continue;
            const ang = t * 0.012 * (0.6 + h[1]) + h[2] * 6.283, R = 90 + 60 * h[1];
            const c = [(wx + x + 0.5) * W, -22 - 30 * h[2], (wz + z + 0.5) * W];
            const p = [c[0] + Math.cos(ang) * R, c[1] + Math.sin(ang * 0.7) * 4, c[2] + Math.sin(ang) * R];
            const d = Math.hypot(p[0] - P[0], p[1] - P[1], p[2] - P[2]);
            if (!best || d < best.d) best = { p, dir: [-Math.sin(ang), 0, Math.cos(ang)], d };
        }
        if (best && best.d < 170) { B.whale.set([...best.p, 14]); B.whaleD.set([...best.dir, t * 0.9]); }
    }

    function step(dt) {
        if (!S) return null;
        S.t += dt;
        const t = S.t, o = S.opts;
        const out = { t, calm: smooth(0, K.calm, t), swallowed: false, consumed: false, explore: t >= K.explore, music: t >= K.under[1] };

        if (!S.captured && t >= K.flood[0]) {
            S.captured = true;
            capture(typeof o.frameSource === 'function' ? o.frameSource() : o.frameSource);
            canvas.classList.add('on');
            o.onSwallow && o.onSwallow();
        }
        out.swallowed = S.captured;
        if (!S.captured) return out;
        if (!S.consumed && t >= K.drown[0] + 0.6) { S.consumed = true; o.onConsumed && o.onConsumed(); }
        out.consumed = S.consumed;
        const level = -0.04 + 1.12 * Math.pow(smooth(K.flood[0], K.flood[1], t), 1.15);
        const drown = smooth(K.drown[0], K.drown[1], t);
        const mixU = smooth(K.under[0], K.under[1], t);
        if (!S.under && mixU > 0) { S.under = true; resize(); o.onUnder && o.onUnder(); }

        // swimming: always gently forward, steered by where the pointer rests or by a swipe
        if (mixU > 0) {
            if (aim.on && !drag) {
                const ax = (aim.x - 0.5) * 2, ay = (aim.y - 0.5) * 2;
                const dz = v => Math.sign(v) * Math.max(0, Math.abs(v) - 0.12);
                cam.yawV += (dz(ax) * 0.3 - cam.yawV) * Math.min(1, dt * 1.5);
                cam.pitchV += (dz(ay) * 0.22 - cam.pitchV) * Math.min(1, dt * 1.5);
            } else if (!drag) {
                cam.yawV *= 1 - Math.min(1, dt * 0.8);
                cam.pitchV *= 1 - Math.min(1, dt * 0.8);
            }
            cam.yaw += cam.yawV * dt;
            cam.pitch = Math.max(-1.25, Math.min(1.1, cam.pitch + cam.pitchV * dt));
            cam.boost *= 1 - Math.min(1, dt * 0.7);
            const speed = (1.1 + cam.boost) * mixU;
            const f = forward();
            for (let i = 0; i < 3; i++) cam.pos[i] += f[i] * speed * dt;
            // stay under the surface and above the seabed, easing off rather than bumping
            const fl = sharedFloor(cam.pos[0], cam.pos[2]) + 5;
            if (cam.pos[1] < fl) { cam.pos[1] += (fl - cam.pos[1]) * Math.min(1, dt * 3); if (cam.pitch < 0) cam.pitch *= 1 - Math.min(1, dt * 2); }
            if (cam.pos[1] > -1.5) { cam.pos[1] += (-1.5 - cam.pos[1]) * Math.min(1, dt * 3); if (cam.pitch > 0) cam.pitch *= 1 - Math.min(1, dt * 2); }
            cam.pos[1] = Math.max(cam.pos[1], -260);
        }

        let vhs = 0, stat = 0;
        if (S.rewind != null) {
            const r = t - S.rewind;
            vhs = smooth(0, 0.25, r);
            S.roll += dt * (0.35 + 7 * Math.pow(smooth(0.5, 1.5, r), 2));
            stat = smooth(1.35, 1.75, r);
            out.rew = r;
            if (r >= 1.85 && !S.returned) {
                S.returned = true;
                o.onReturn && o.onReturn();
                return out;
            }
        }
        if (mixU > 0) listBodies(t);
        render({ t, level, drown, mixU, vhs, roll: S.roll, stat });
        return out;
    }

    function render(u) {
        if (!ok) return;
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.useProgram(prog);
        gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, noiseTex);
        gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, frameTex);
        gl.uniform1i(U.uNoise, 0);
        gl.uniform1i(U.uFrame, 1);
        gl.uniform2f(U.uRes, canvas.width, canvas.height);
        gl.uniform1f(U.uTime, u.t);
        gl.uniform1f(U.uLevel, u.level);
        gl.uniform1f(U.uDrown, u.drown);
        gl.uniform1f(U.uMix, u.mixU);
        gl.uniform3f(U.uCam, cam.pos[0], cam.pos[1], cam.pos[2]);
        const f = forward(), right = [Math.cos(cam.yaw), 0, -Math.sin(cam.yaw)];
        const up = [f[1] * right[2] - f[2] * right[1], f[2] * right[0] - f[0] * right[2], f[0] * right[1] - f[1] * right[0]];
        gl.uniformMatrix3fv(U.uRot, false, [right[0], right[1], right[2], up[0], up[1], up[2], f[0], f[1], f[2]]);
        gl.uniform3f(U.uSeed, S.seed[0], S.seed[1], S.seed[2]);
        const B = bodies;
        gl.uniform4fv(U.uObj, B.obj); gl.uniform4fv(U.uObjQ, B.objQ); gl.uniform4fv(U.uJelly, B.jelly);
        gl.uniform4fv(U.uWhale, B.whale); gl.uniform4fv(U.uWhaleD, B.whaleD);
        gl.uniform3f(U.uAura, aim.x, aim.y, aim.on && u.mixU > 0.5 ? u.mixU : 0);
        gl.uniform1f(U.uVhs, u.vhs);
        gl.uniform1f(U.uRoll, u.roll);
        gl.uniform1f(U.uStatic, u.stat);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    function rewind() { if (S && S.rewind == null) S.rewind = S.t; }
    function stop() { S = null; canvas.classList.remove('on'); }

    function wire() {
        addEventListener('pointermove', e => {
            aim.x = e.clientX / innerWidth; aim.y = 1 - e.clientY / innerHeight; aim.on = true;
            if (drag && S && S.under) {
                const dx = e.clientX - drag.x, dy = e.clientY - drag.y, now = performance.now();
                const dtm = Math.max(16, now - drag.at) / 1000;
                cam.yaw -= dx * 0.004;
                cam.pitch = Math.max(-1.25, Math.min(1.1, cam.pitch + dy * 0.003));
                cam.boost = Math.min(6, cam.boost + Math.hypot(dx, dy) / dtm * 0.002);   // a quick swipe swims you forward
                drag.x = e.clientX; drag.y = e.clientY; drag.at = now;
            }
        });
        addEventListener('pointerdown', e => {
            if (!S || !S.under || e.pointerType === 'mouse' || e.target.closest('button')) return;
            drag = { x: e.clientX, y: e.clientY, at: performance.now() };
            cam.yawV = cam.pitchV = 0;
        });
        const end = () => { drag = null; };
        addEventListener('pointerup', end);
        addEventListener('pointercancel', end);
        addEventListener('pointerleave', () => { aim.on = false; });
        addEventListener('resize', () => { if (S) resize(); });
    }

    return { _cam: cam, init, warm, setQuality, get ready() { return ready; }, start, step, rewind, stop, K, get active() { return !!S; }, get ok() { return ok; } };
})();
