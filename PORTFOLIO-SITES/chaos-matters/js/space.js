/* ==========================================================
   Chaos Matters — SPACE
   A black hole forms on the button, drinks the whole page,
   collapses to a strobing seed and bursts into a universe
   that is generated fresh for every visit: nebulae, galaxies,
   ringed planets and their moons, suns, comets, asteroids.
   One fragment shader draws all of it.
   ========================================================== */

const Space = (() => {
    const VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main() { vUv = aPos * 0.5 + 0.5; gl_Position = vec4(aPos, 0.0, 1.0); }`;

    const FRAG = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uNoise;
uniform sampler2D uFrame;     // the home page at the moment it was swallowed
uniform vec2  uRes;
uniform float uTime;
uniform float uMode;          // 0 = black hole over the page, 1 = the universe
uniform vec2  uHole;          // black hole centre (uv)
uniform float uRs;            // its shadow radius (screen heights)
uniform float uPull;          // how far the page has been sucked in
uniform float uSwirl;
uniform float uDisk;          // accretion disk brightness
uniform float uBall;          // 0..1 collapse into the seed
uniform float uStrobe;        // the seed's pulse
uniform float uBang;          // seconds since the big bang (< 0 before)
uniform vec3  uCam;
uniform mat3  uRot;
uniform vec3  uSeed;
uniform vec3  uSpawn;         // the visitor starts in a clear patch of sky
uniform vec3  uAura;          // xy = pointer, z = strength
uniform float uVhs;           // rewind: tape distortion
uniform float uRoll;          // rewind: vertical roll
uniform float uStatic;        // rewind: the signal gives out

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
float fbm3(vec3 p) { return (0.5 * noise3(p) + 0.25 * noise3(p * 2.03 + 1.7) + 0.125 * noise3(p * 4.01 + 3.1)) / 0.875; }
vec3 hueShift(vec3 c, float a) { const vec3 k = vec3(0.57735); float ca = cos(a); return c * ca + cross(k, c) * sin(a) + k * dot(k, c) * (1.0 - ca); }
mat2 rot(float a) { float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }

/* ---------------- the black hole ---------------- */
vec3 blackHole(vec2 uv, vec2 A) {
    float t = uTime;
    vec2 p = (uv - uHole) * A;
    float r = length(p);
    float a = atan(p.y, p.x);
    float Rs = uRs * (1.0 - uBall);
    // light bends around the hole: each pixel sees a point further out (Einstein lens)
    float src = r - (Rs * Rs * 2.2) / max(r, 1e-4);
    // and the page spirals inward: we sample from further out as the pull grows
    float rs = max(src, 0.0) * exp(uPull) + uPull * 0.02;
    float aa = a + uSwirl / (max(src, 0.0) * 5.0 + 0.12);
    vec2 sp = uHole + vec2(cos(aa), sin(aa)) * rs / A;
    vec3 bg = vec3(0.0);
    if (sp.x > 0.0 && sp.x < 1.0 && sp.y > 0.0 && sp.y < 1.0) {
        float ca = 0.004 * uPull;
        bg = vec3(texture2D(uFrame, sp + vec2(ca, 0.0)).r, texture2D(uFrame, sp).g, texture2D(uFrame, sp - vec2(ca, 0.0)).b);
        // light climbing out of the well is reddened and dimmed
        float well = smoothstep(Rs * 1.0, Rs * 3.5, r);
        bg *= smoothstep(0.0, 0.06, min(sp.x, 1.0 - sp.x)) * smoothstep(0.0, 0.06, min(sp.y, 1.0 - sp.y));
        bg *= mix(vec3(0.9, 0.35, 0.15), vec3(1.0), well) * (0.25 + 0.75 * well);
    }
    vec3 col = bg;

    // accretion disk, almost edge-on, with the lensed far side arching over and under the shadow
    float tilt = 0.12;
    vec2 dp = rot(-0.18) * p;
    float rr = length(vec2(dp.x, dp.y / tilt));
    float Rin = Rs * 1.6, Rout = Rs * (5.5 + 2.0 * uBall);
    float spin = t * 3.0 / max(rr / max(Rs, 1e-3), 1.0);
    float swirl = fbm3(vec3(rr / max(Rs, 1e-3) * 2.4, (atan(dp.y / tilt, dp.x) - spin) * 2.0, t * 0.3));
    float band = smoothstep(Rin, Rin * 1.25, rr) * (1.0 - smoothstep(Rout * 0.6, Rout, rr));
    float beam = 1.0 + 0.75 * dp.x / max(rr, 1e-4);                 // the side spinning toward us is brighter
    float front = step(0.0, -dp.y) + step(Rs * 1.05, abs(dp.x));     // the far half hides behind the shadow
    vec3 hot = mix(vec3(1.0, 0.45, 0.12), vec3(1.0, 0.92, 0.75), smoothstep(Rout, Rin, rr));
    hot = mix(hot, hueShift(hot, 0.6 * sin(t * 0.3 + rr * 30.0)), 0.18);   // a breath of the page's colour
    float disk = band * (0.35 + 0.9 * swirl) * beam * min(front, 1.0);
    // the lensed image of the disk's far side: a halo hugging the shadow, brightest top and bottom
    float halo = exp(-sq((r - Rs * 1.55) / (Rs * 0.32))) * (0.35 + 0.65 * sq(sin(a))) * (0.6 + 0.6 * swirl);
    col += hot * (disk * 2.4 + halo * 1.6) * uDisk;
    // the photon ring and the shadow
    col += vec3(1.0, 0.85, 0.65) * exp(-sq((r - Rs * 1.04) / (Rs * 0.035))) * 1.2 * uDisk;
    col *= smoothstep(Rs * 0.98, Rs * 1.01, r);

    // the seed: everything compressed to a pulsing point of light
    float ball = uBall;
    float core = exp(-r * r / sq(0.004 + 0.012 * ball)) * ball;
    vec3 seedCol = mix(vec3(1.0, 0.75, 0.45), vec3(0.8, 0.9, 1.0), uStrobe);
    col += seedCol * core * (0.6 + 3.0 * uStrobe);
    col += seedCol * exp(-r * r * 60.0) * ball * uStrobe * 0.8;
    // an anamorphic streak and rays on every pulse
    col += vec3(0.6, 0.75, 1.0) * exp(-abs(p.y) * 160.0) * exp(-abs(p.x) * 2.5) * ball * uStrobe * 1.6;
    float rays = pow(0.5 + 0.5 * sin(a * 9.0 + t * 2.0), 8.0) + pow(0.5 + 0.5 * sin(a * 5.0 - t * 3.0), 12.0);
    col += seedCol * rays * exp(-r * 6.0) * ball * uStrobe * 0.6;
    return col;
}

/* ---------------- the universe ---------------- */
vec3 nebulaColor(float k, float w) {
    vec3 teal = vec3(0.05, 0.42, 0.55), violet = vec3(0.32, 0.16, 0.8), magenta = vec3(0.78, 0.14, 0.46), amber = vec3(1.0, 0.56, 0.2);
    vec3 c = mix(teal, violet, smoothstep(0.0, 0.35, k));
    c = mix(c, magenta, smoothstep(0.35, 0.65, k));
    return mix(c, amber, smoothstep(0.68, 0.95, k) * (0.4 + 0.6 * w));
}

float sphereHit(vec3 ro, vec3 rd, vec3 c, float r) {
    vec3 oc = ro - c;
    float b = dot(oc, rd), h = b * b - dot(oc, oc) + r * r;
    if (h < 0.0) return -1.0;
    return -b - sqrt(h);
}

vec3 starField(vec3 rd) {
    vec3 col = vec3(0.0);
    for (int i = 0; i < 3; i++) {
        float sc = 160.0 + float(i) * 230.0;
        vec3 q = rd * sc + uSeed * 31.0;
        vec3 id = floor(q), f = fract(q) - 0.5;
        vec3 h = hash33(id);
        vec3 o = (h - 0.5) * 0.7;
        float d = length(f - o);
        float on = step(0.8 - float(i) * 0.05, h.x);
        float tw = 0.75 + 0.25 * sin(uTime * (1.0 + h.z * 3.0) + h.y * 40.0);
        vec3 c = mix(vec3(0.65, 0.78, 1.0), vec3(1.0, 0.82, 0.6), h.y);
        col += c * on * tw * (exp(-d * d * (260.0 + float(i) * 200.0)) * (3.0 - float(i) * 0.7) + exp(-d * d * 40.0) * 0.08);
    }
    return col;
}

vec3 milkyWay(vec3 rd) {
    vec3 n = normalize(vec3(0.25, 1.0, 0.35) + (uSeed - 0.5) * 0.6);
    float b = dot(rd, n);
    float lane = exp(-b * b * 14.0);
    float f = fbm3(rd * 3.0 + uSeed * 9.0), g = fbm3(rd * 9.0 + 4.0);
    vec3 c = mix(vec3(0.25, 0.22, 0.45), vec3(0.75, 0.5, 0.35), f) * lane * (0.12 + 0.25 * g);
    c *= 1.0 - smoothstep(0.5, 0.7, fbm3(rd * 6.0 + 8.0)) * exp(-b * b * 60.0) * 0.8;   // dark rift
    return c;
}

vec3 galaxies(vec3 rd) {
    vec3 col = vec3(0.0);
    for (int i = 0; i < 4; i++) {
        float fi = float(i);
        vec3 h = hash33(uSeed * 13.0 + fi * 7.1);
        vec3 g = normalize(h * 2.0 - 1.0 + vec3(0.0, 0.0, 0.001));
        float cg = dot(rd, g);
        if (cg < 0.96) continue;
        vec3 n = normalize(hash33(h * 5.0 + 1.3) - 0.5);
        vec3 e1 = normalize(cross(n, g)), e2 = cross(g, e1);
        vec2 q = vec2(dot(rd, e1), dot(rd, e2));
        q.y /= 0.3 + 0.7 * h.y;                    // inclination
        float size = 0.05 + 0.08 * h.z;
        float r = length(q) / size, th = atan(q.y, q.x);
        float arms = 0.5 + 0.5 * cos(2.0 * th - log(r + 0.02) * 4.5 + fi * 2.0);
        float disk = exp(-r * 3.2) * (0.25 + 0.75 * pow(arms, 2.0) * smoothstep(0.03, 0.25, r));
        float core = exp(-r * r * 90.0);
        vec3 armCol = mix(vec3(0.55, 0.65, 1.0), vec3(1.0, 0.45, 0.7), step(0.8, hash(floor(q * 900.0))) * arms);
        col += armCol * disk * 0.9 + vec3(1.0, 0.85, 0.6) * core * 1.4;
    }
    return col;
}

vec4 nebula(vec3 ro, vec3 rd, float maxT, float expand) {
    vec3 acc = vec3(0.0);
    float T = 1.0, t = 2.0;
    for (int i = 0; i < 13; i++) {
        if (t > maxT) break;
        vec3 p = ro + rd * t;
        vec3 q = p * 0.03 / expand + uSeed * 10.0;
        float n = fbm3(q);
        float d = smoothstep(0.56, 0.84, n);
        float stepLen = t * 0.3;
        if (d > 0.001) {
            float w = fbm3(q * 3.1 + 7.0);
            float dust = smoothstep(0.55, 0.72, fbm3(q * 1.7 + 11.0));
            float dens = d * (0.3 + 0.9 * w) * stepLen * 0.011;
            float k = fract(noise3(q * 0.45 + 3.0) * 1.6 + uSeed.x * 0.37);
            vec3 c = nebulaColor(k, w) * (0.3 + 1.4 * w * w);
            acc += T * c * dens * 2.6 * (1.0 - dust * 0.9);
            T *= 1.0 - clamp(dens * (0.6 + dust * 2.5), 0.0, 1.0);
        }
        t *= 1.3;
    }
    return vec4(acc, T);
}

vec3 planetSurface(vec3 N, vec3 h, float kind) {
    float lat = N.y, lon = atan(N.z, N.x) + uTime * 0.015 * (0.5 + h.y);
    vec3 c1, c2;
    if (kind < 0.45) {        // gas giant: banded
        float b = noise3(vec3(lat * 9.0, lon * 0.7, h.x * 20.0)) * 0.7 + noise3(vec3(lat * 25.0, lon * 2.0, h.y * 9.0)) * 0.3;
        c1 = mix(vec3(0.85, 0.62, 0.38), vec3(0.3, 0.55, 0.75), step(0.5, h.z));
        c2 = mix(vec3(0.55, 0.3, 0.2), vec3(0.75, 0.35, 0.6), h.x);
        vec3 c = mix(c1, c2, smoothstep(0.35, 0.65, b));
        float storm = exp(-sq((lat - (h.y - 0.5) * 0.8) * 9.0) - sq(sin((lon - h.z * 6.0) * 0.5) * 6.0));
        return mix(c, vec3(0.9, 0.45, 0.3), storm * 0.7);
    }
    if (kind < 0.8) {         // rocky world with seas and ice
        float n = fbm3(N * 2.4 + h * 30.0);
        vec3 sea = mix(vec3(0.05, 0.16, 0.35), vec3(0.1, 0.35, 0.45), h.y);
        vec3 land = mix(vec3(0.42, 0.3, 0.2), vec3(0.3, 0.42, 0.25), h.z);
        vec3 c = mix(sea, land, smoothstep(0.5, 0.53, n));
        c = mix(c, vec3(0.92), smoothstep(0.72, 0.8, abs(lat) + n * 0.15));
        float cloud = smoothstep(0.55, 0.75, fbm3(N * 4.0 + vec3(uTime * 0.01, 0.0, 0.0) + h * 7.0));
        return mix(c, vec3(0.95), cloud * 0.7);
    }
    // barren moon-like
    float n = fbm3(N * 5.0 + h * 11.0);
    float crater = smoothstep(0.62, 0.66, noise3(N * 11.0 + h * 3.0));
    return mix(vec3(0.45, 0.42, 0.4), vec3(0.75, 0.72, 0.68), n) * (1.0 - crater * 0.35);
}

vec3 universe(vec3 ro, vec3 rd, vec2 uv, vec2 A) {
    vec3 L = normalize(vec3(0.6, 0.35, -0.5) + (uSeed - 0.5));
    float expand = 1.0 + 3.0 * exp(-max(uBang, 0.0) * 0.6);

    vec3 col = vec3(0.004, 0.006, 0.014) + vec3(0.01, 0.0, 0.02) * (rd.y * 0.5 + 0.5);
    col += milkyWay(rd) + starField(rd) + galaxies(rd);

    // planets, moons and suns live in cells around us
    const float C = 46.0;
    vec3 cc = floor(ro / C);
    float tHit = 1e9; vec3 hitCol = vec3(0.0);
    float ringT = 1e9; vec4 ringCol = vec4(0.0);
    vec3 glow = vec3(0.0);
    for (int x = -1; x <= 1; x++)
    for (int y = -1; y <= 1; y++)
    for (int z = -1; z <= 1; z++) {
        vec3 id = cc + vec3(float(x), float(y), float(z));
        vec3 h = hash33(id + uSeed * 17.0);
        vec3 c = (id + 0.25 + 0.5 * hash33(id + 3.1 + uSeed)) * C;
        if (length(c - uSpawn) < 70.0) continue;
        if (h.x < 0.3) {
            float R = 2.5 + 7.5 * h.y * h.y;
            // drift right up to a world and it thins away rather than filling the screen
            float near = smoothstep(R * 1.6, R * 3.2, length(ro - c));
            if (near < 0.01) continue;
            float kind = hash33(id + 9.9).x;
            if (length(ro - c) > R * 1.2) {
                float t = sphereHit(ro, rd, c, R);
                if (t > 0.0 && t < tHit) {
                    vec3 N = normalize(ro + rd * t - c);
                    float diff = smoothstep(-0.08, 0.5, dot(N, L));
                    vec3 alb = planetSurface(N, h, kind);
                    vec3 atm = mix(vec3(0.35, 0.6, 1.0), vec3(1.0, 0.55, 0.35), h.z);
                    float rim = pow(1.0 - max(dot(N, -rd), 0.0), 3.0);
                    vec3 pc = alb * (diff * 1.25 + 0.015) + atm * rim * (0.15 + diff * 0.9);
                    float fade = (1.0 - smoothstep(55.0, 85.0, t)) * near;
                    tHit = t; hitCol = pc * fade + col * (1.0 - fade);
                }
                // atmosphere glow just outside the limb
                vec3 oc = c - ro; float tc = dot(oc, rd);
                if (tc > 0.0) {
                    float dm = length(oc - rd * tc);
                    glow += mix(vec3(0.35, 0.6, 1.0), vec3(1.0, 0.55, 0.35), h.z) * exp(-max(dm - R, 0.0) / (R * 0.08)) * step(R, dm) * 0.25 * (1.0 - smoothstep(55.0, 85.0, tc));
                }
            }
            // rings on the giants
            vec3 hr = hash33(id + 5.5);
            if (kind < 0.45 && hr.x > 0.4) {
                vec3 n = normalize(hr - 0.5 + vec3(0.0, 1.2, 0.0));
                float dn = dot(rd, n);
                if (abs(dn) > 1e-3) {
                    float tp = dot(c - ro, n) / dn;
                    if (tp > 0.0 && tp < ringT) {
                        float rr = length(ro + rd * tp - c) / R;
                        if (rr > 1.35 && rr < 2.4) {
                            float bands = 0.5 + 0.5 * sin(rr * 40.0 + hr.y * 9.0) * sin(rr * 13.0);
                            float a = (0.25 + 0.6 * bands) * smoothstep(1.35, 1.45, rr) * (1.0 - smoothstep(2.25, 2.4, rr));
                            vec3 rc = mix(vec3(0.85, 0.75, 0.6), vec3(0.6, 0.65, 0.8), hr.z) * (0.35 + 0.9 * max(dot(n, L) * sign(-dn), 0.15));
                            ringT = tp; ringCol = vec4(rc, a * (1.0 - smoothstep(55.0, 85.0, tp)) * near);
                        }
                    }
                }
            }
            // moons
            if (h.z > 0.4) {
                float ang = uTime * 0.05 * (0.6 + h.y) + h.x * 40.0;
                vec3 mc = c + vec3(cos(ang), sin(ang) * 0.25, sin(ang)) * R * 2.6;
                float mr = R * 0.22;
                float t = sphereHit(ro, rd, mc, mr);
                if (t > 0.0 && t < tHit) {
                    vec3 N = normalize(ro + rd * t - mc);
                    tHit = t;
                    hitCol = mix(col, planetSurface(N, h.zxy, 0.9) * (smoothstep(-0.05, 0.4, dot(N, L)) * 1.2 + 0.01), (1.0 - smoothstep(55.0, 85.0, t)) * smoothstep(mr * 2.0, mr * 5.0, t));
                }
            }
        } else if (h.x > 0.95) {
            // a sun
            float R = 3.0 + 3.0 * h.y;
            vec3 sc = mix(vec3(1.0, 0.8, 0.5), vec3(0.75, 0.85, 1.0), h.z);
            vec3 oc = c - ro; float tc = dot(oc, rd);
            if (tc > 0.0) {
                float dm = length(oc - rd * tc);
                glow += sc * (R * R / (dm * dm + R * 0.3)) * 0.12 * (1.0 - smoothstep(60.0, 90.0, tc));
                float t = sphereHit(ro, rd, c, R);
                if (t > 0.0 && t < tHit) {
                    vec3 N = normalize(ro + rd * t - c);
                    float gran = fbm3(N * 8.0 + uTime * 0.05);
                    tHit = t; hitCol = sc * (2.2 + 1.2 * gran) * (0.6 + 0.4 * pow(max(dot(N, -rd), 0.0), 0.5));
                }
            }
        }
    }

    // asteroids and drifting stardust in a finer grid
    const float S = 7.0;
    vec3 sc0 = floor(ro / S);
    for (int x = -1; x <= 1; x++)
    for (int y = -1; y <= 1; y++)
    for (int z = -1; z <= 1; z++) {
        vec3 id = sc0 + vec3(float(x), float(y), float(z));
        vec3 h = hash33(id * 1.7 + uSeed * 5.0);
        vec3 p = (id + 0.2 + 0.6 * h) * S;
        // a point of dust: parallax as we drift
        vec3 op = p - ro; float tp = dot(op, rd);
        if (tp > 0.2) {
            float dm = length(op - rd * tp);
            glow += mix(vec3(0.7, 0.8, 1.0), vec3(1.0, 0.8, 0.6), h.y) * exp(-sq(dm / (0.012 * tp))) * 0.5 * (1.0 - smoothstep(8.0, 14.0, tp));
        }
        // rocks, only inside belts
        if (noise3(id * 0.08 + uSeed * 3.0) > 0.6 && h.z > 0.45) {
            float R = 0.15 + 0.6 * h.x * h.x;
            float t = sphereHit(ro, rd, p + vec3(0.0, 1.5, 0.0), R);
            if (t > 0.0 && t < tHit) {
                vec3 N = normalize(ro + rd * t - p - vec3(0.0, 1.5, 0.0));
                N = normalize(N + (vec3(noise3(N * 6.0 + h * 9.0), noise3(N * 6.0 + 3.0), noise3(N * 6.0 + 7.0)) - 0.5) * 0.9);
                tHit = t;
                hitCol = vec3(0.32, 0.28, 0.25) * (smoothstep(-0.1, 0.6, dot(N, L)) * 1.3 + 0.02) * (1.0 - smoothstep(10.0, 16.0, t));
            }
        }
    }

    // gas: the nebulae, thinned by whatever stands in front
    vec4 neb = nebula(ro, rd, min(tHit, 80.0), expand);
    if (tHit < 1e8) col = hitCol;
    col = col * neb.a + neb.rgb;
    if (ringT < tHit) col = mix(col, ringCol.rgb, ringCol.a);
    col += glow;

    // comets slipping past
    for (int i = 0; i < 2; i++) {
        float fi = float(i);
        vec3 hc = hash33(uSeed * 3.0 + fi * 4.7);
        float w = 0.025 + 0.02 * hc.x;
        vec3 head = ro + vec3(sin(uTime * w + fi * 3.0) * 34.0, (hc.y - 0.5) * 18.0 + sin(uTime * w * 0.7) * 6.0, cos(uTime * w + fi * 3.0) * 34.0);
        vec3 vel = normalize(vec3(cos(uTime * w + fi * 3.0), 0.0, -sin(uTime * w + fi * 3.0)));
        for (int k = 0; k < 2; k++) {
            vec3 tail = normalize(-vel + (k == 0 ? -L * 0.35 : vec3(0.0, 0.25, 0.0)));
            vec3 B = head + tail * (k == 0 ? 9.0 : 12.0);
            vec3 v = B - head, w0 = ro - head;
            float b = dot(rd, v), c = dot(v, v), d = dot(rd, w0), e = dot(v, w0);
            float den = c - b * b;
            float tc = clamp((e - b * d) / max(den, 1e-4), 0.0, 1.0);
            vec3 q = head + v * tc;
            float sc = max(dot(q - ro, rd), 0.0);
            float dist = length(ro + rd * sc - q);
            float wid = 0.06 + tc * (k == 0 ? 0.9 : 0.5);
            vec3 tc0 = k == 0 ? vec3(1.0, 0.9, 0.75) : vec3(0.45, 0.7, 1.0);
            col += tc0 * exp(-sq(dist / wid)) * pow(1.0 - tc, 1.6) * 0.55;
        }
        vec3 oh = head - ro; float th = dot(oh, rd);
        if (th > 0.0) col += vec3(0.9, 0.95, 1.0) * exp(-sq(length(oh - rd * th) / 0.12)) * 1.4;
    }
    return col;
}

void main() {
    vec2 uv = vUv;
    vec2 A = vec2(uRes.x / uRes.y, 1.0);
    float t = uTime;

    // rewind: the tape wobbles, tracking breaks and the picture rolls away
    if (uVhs > 0.0) {
        float line = floor(uv.y * uRes.y / 3.0);
        uv.x += (sin(uv.y * 35.0 + t * 50.0) * 0.004 + (hash(vec2(line, floor(t * 24.0))) - 0.5) * 0.01) * uVhs;
        float band = step(0.94, hash(vec2(floor(uv.y * 14.0 - t * 9.0), floor(t * 12.0))));
        uv.x += band * 0.06 * uVhs;
        uv.y = fract(uv.y + uRoll);
        uv.y = 0.5 + (uv.y - 0.5) * (1.0 + 0.35 * uVhs * smoothstep(0.3, 1.0, fract(uRoll)));
    }

    vec3 col;
    if (uMode < 0.5) {
        col = blackHole(uv, A);
    } else {
        vec2 sc = (uv - 0.5) * A;
        vec3 rd = normalize(uRot * vec3(sc, 1.25));
        col = universe(uCam, rd, uv, A);

        // the big bang: a white burst, a ring of plasma, light streaking outward
        float bang = max(uBang, 0.0);
        float r = length(sc);
        float R = bang * 1.1;
        float ang = atan(sc.y, sc.x);
        col *= smoothstep(R, R - 0.25, r) * (1.0 - exp(-bang * 1.5)) + (1.0 - step(0.0, uBang));
        col += hueShift(vec3(1.0, 0.45, 0.2), ang * 2.0 + bang * 2.0) * exp(-sq((r - R) / (0.05 + bang * 0.05))) * 1.6 * exp(-bang * 0.7);
        float warp = exp(-bang * 0.9);
        float streak = step(0.93, hash(vec2(floor(ang * 260.0), 1.0))) * fract(r * 2.0 - bang * 3.0 + hash(vec2(floor(ang * 260.0), 2.0)));
        col += vec3(0.75, 0.85, 1.0) * pow(streak, 6.0) * warp * smoothstep(0.0, 0.1, r) * 1.5;
        col += vec3(1.0, 0.97, 0.92) * exp(-bang * 3.2) * 2.5;
    }

    // the visitor's light: a soft, shifting aura wherever the pointer drifts
    if (uAura.z > 0.0) {
        vec2 ap = (vUv - uAura.xy) * A;
        float ad = length(ap);
        float wisps = fbm3(vec3(atan(ap.y, ap.x) * 1.6, ad * 9.0 - t * 0.9, t * 0.2));
        vec3 ac = hueShift(vec3(0.55, 0.35, 1.0), t * 0.4 + ad * 5.0);
        col *= 1.0 + exp(-ad * ad * 22.0) * 0.6 * uAura.z;                     // it lights what it passes
        col += ac * (exp(-ad * ad * 900.0) * 0.5 + wisps * exp(-ad * 10.0) * 0.32 + exp(-ad * ad * 70.0) * 0.12) * uAura.z;
    }

    // filmic response, vignette, grain
    col = 1.0 - exp(-col * 1.25);
    col *= 1.0 - 0.35 * dot((vUv - 0.5) * A, (vUv - 0.5) * A);
    float grain = hash(floor(vUv * uRes) + fract(t * 7.0) * 91.0);
    col += (grain - 0.5) * 0.025;

    if (uVhs > 0.0) {
        float scan = 0.85 + 0.15 * sin(vUv.y * uRes.y * 1.5);
        col = mix(col, vec3(dot(col, vec3(0.33))), 0.25 * uVhs) * mix(1.0, scan, uVhs);
        col += vec3(0.9) * step(0.985, hash(vec2(floor(vUv.y * 90.0), floor(t * 30.0)))) * 0.35 * uVhs;
    }
    col = mix(col, vec3(grain), uStatic);
    gl_FragColor = vec4(col, 1.0);
}`;

    let canvas, gl, prog, U = {}, frameTex, noiseTex, ok = false, scale = 1;
    let S = null;                       // the running show
    const cam = { pos: [0, 0, 0], yaw: 0, pitch: 0, yawV: 0, pitchV: 0, speed: 0, boost: 0 };
    const aim = { x: 0.5, y: 0.5, on: false };
    let drag = null;

    const smooth = (a, b, x) => { const k = Math.min(1, Math.max(0, (x - a) / (b - a))); return k * k * (3 - 2 * k); };
    const mix = (a, b, k) => a + (b - a) * k;

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
        try { prog = compile(VERT, FRAG); } catch (e) { console.warn('Chaos Matters: space shader failed', e); return false; }
        gl.useProgram(prog);
        const buf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
        ['uNoise', 'uFrame', 'uRes', 'uTime', 'uMode', 'uHole', 'uRs', 'uPull', 'uSwirl', 'uDisk', 'uBall', 'uStrobe', 'uBang',
         'uCam', 'uRot', 'uSeed', 'uSpawn', 'uAura', 'uVhs', 'uRoll', 'uStatic'].forEach(n => U[n] = gl.getUniformLocation(prog, n));
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
        ok = true;
        wire();
        return true;
    }

    function resize() {
        if (!ok) return;
        // space is costly: render at a reduced size and let the browser scale it up smoothly
        const dpr = Math.min(devicePixelRatio || 1, 1.5);
        const budget = 1.1e6, px = innerWidth * innerHeight * dpr * dpr;
        scale = px > budget ? dpr * Math.sqrt(budget / px) : dpr;
        const w = Math.round(innerWidth * scale), h = Math.round(innerHeight * scale);
        if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    }

    /* ---------- the show ---------- */
    // seconds from the click
    const K = { calm: 2.2, form: 2.2, grown: 4.4, travel: [3.4, 8.2], consumed: 9.4, ball: [9.6, 11.0], bang: 12.0, explore: 15.0 };

    function start(opts) {
        resize();
        S = { t: 0, opts, hole0: opts.hole, strobePh: 0, lastPulse: 0, mode: 0, consumed: false, banged: false,
              rewind: null, roll: 0, seed: [Math.random(), Math.random(), Math.random()], captured: false };
        cam.pos = [Math.random() * 400 - 200, Math.random() * 60 - 30, Math.random() * 400 - 200];
        S.spawn = cam.pos.slice();
        cam.yaw = Math.random() * Math.PI * 2; cam.pitch = 0; cam.yawV = cam.pitchV = 0; cam.boost = 0;
        aim.on = false;
    }

    function capture(source) {
        gl.bindTexture(gl.TEXTURE_2D, frameTex);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
        gl.bindTexture(gl.TEXTURE_2D, frameTex);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    }

    function holeUv(t) {
        const k = smooth(K.travel[0], K.travel[1], t);
        return [mix(S.hole0[0], 0.5, k), mix(S.hole0[1], 0.5, k)];
    }

    /* advance the show by dt; returns what the page around it needs to know */
    function step(dt) {
        if (!S) return null;
        S.t += dt;
        const t = S.t, o = S.opts;
        const out = { t, calm: smooth(0, K.calm, t), hole: holeUv(t), rs: 0, consumed: false, explore: false };

        if (!S.captured && t >= K.form) {
            S.captured = true;
            capture(o.frameSource);
            canvas.classList.add('on');
            o.onSwallow && o.onSwallow();
        }
        if (!S.captured) return out;

        const rs = 0.075 * smooth(K.form, K.grown, t);
        const pull = 2.6 * Math.pow(smooth(K.form + 0.4, K.consumed, t), 1.7);
        const swirl = 2.5 * smooth(K.form, K.consumed, t) + t * 0.15;
        const disk = smooth(K.form + 0.6, K.form + 3.5, t);
        const ball = smooth(K.ball[0], K.ball[1], t);
        // the seed beats faster and faster until it can't hold
        let strobe = 0;
        if (t > K.ball[0] && t < K.bang) {
            const k = smooth(K.ball[0], K.bang, t);
            S.strobePh += dt * (1.2 + 24 * k * k);
            strobe = Math.pow(0.5 + 0.5 * Math.cos(S.strobePh * Math.PI * 2), 6);
            if (Math.floor(S.strobePh) !== S.lastPulse) { S.lastPulse = Math.floor(S.strobePh); o.onPulse && o.onPulse(k); }
        }
        if (!S.consumed && t >= K.consumed) { S.consumed = true; o.onConsumed && o.onConsumed(); }
        if (!S.banged && t >= K.bang) { S.banged = true; S.mode = 1; o.onBang && o.onBang(); }
        out.rs = rs; out.consumed = S.consumed; out.explore = t >= K.explore;
        const bang = t - K.bang;

        // drifting: forward always, steered gently toward wherever the pointer rests
        if (S.mode === 1) {
            const warp = Math.exp(-Math.max(bang, 0) * 1.1);
            if (aim.on && !drag) {
                const ax = (aim.x - 0.5) * 2, ay = (aim.y - 0.5) * 2;
                const dz = v => Math.sign(v) * Math.max(0, Math.abs(v) - 0.12);   // a calm centre
                cam.yawV += (dz(ax) * 0.32 - cam.yawV) * Math.min(1, dt * 1.5);
                cam.pitchV += (dz(ay) * 0.22 - cam.pitchV) * Math.min(1, dt * 1.5);
            } else if (!drag) {
                cam.yawV *= 1 - Math.min(1, dt * 0.8);
                cam.pitchV *= 1 - Math.min(1, dt * 0.8);
            }
            cam.yaw += cam.yawV * dt;
            cam.pitch = Math.max(-1.2, Math.min(1.2, cam.pitch + cam.pitchV * dt));
            cam.boost *= 1 - Math.min(1, dt * 0.7);
            const speed = 1.4 + cam.boost + 70 * warp;
            const f = forward();
            for (let i = 0; i < 3; i++) cam.pos[i] += f[i] * speed * dt;
        }

        // rewind: the tape drags, rolls and drops, then the signal goes
        let vhs = 0, stat = 0;
        if (S.rewind != null) {
            const r = t - S.rewind;
            vhs = smooth(0, 0.25, r);
            S.roll += dt * (0.35 + 7 * Math.pow(smooth(0.5, 1.5, r), 2));
            stat = smooth(1.35, 1.75, r);
            if (r >= 1.85 && !S.returned) { S.returned = true; o.onReturn && o.onReturn(); }
        }

        render({ t, rs, pull, swirl, disk, ball, strobe, bang: S.mode === 1 ? bang : -1, vhs, roll: S.roll, stat });
        return out;
    }

    function forward() {
        const cp = Math.cos(cam.pitch);
        return [Math.sin(cam.yaw) * cp, Math.sin(cam.pitch), Math.cos(cam.yaw) * cp];
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
        gl.uniform1f(U.uMode, S.mode);
        const h = holeUv(u.t);
        gl.uniform2f(U.uHole, h[0], h[1]);
        gl.uniform1f(U.uRs, u.rs);
        gl.uniform1f(U.uPull, u.pull);
        gl.uniform1f(U.uSwirl, u.swirl);
        gl.uniform1f(U.uDisk, u.disk);
        gl.uniform1f(U.uBall, u.ball);
        gl.uniform1f(U.uStrobe, u.strobe);
        gl.uniform1f(U.uBang, u.bang);
        gl.uniform3f(U.uCam, cam.pos[0], cam.pos[1], cam.pos[2]);
        const f = forward();
        const right = [Math.cos(cam.yaw), 0, -Math.sin(cam.yaw)];
        const up = [f[1] * right[2] - f[2] * right[1], f[2] * right[0] - f[0] * right[2], f[0] * right[1] - f[1] * right[0]];
        gl.uniformMatrix3fv(U.uRot, false, [right[0], right[1], right[2], up[0], up[1], up[2], f[0], f[1], f[2]]);
        gl.uniform3f(U.uSeed, S.seed[0], S.seed[1], S.seed[2]);
        gl.uniform3f(U.uSpawn, S.spawn[0], S.spawn[1], S.spawn[2]);
        const auraOn = S.mode === 1 ? smooth(1.5, 3.5, u.bang) : 0;
        gl.uniform3f(U.uAura, aim.x, aim.y, aim.on ? auraOn : 0);
        gl.uniform1f(U.uVhs, u.vhs);
        gl.uniform1f(U.uRoll, u.roll);
        gl.uniform1f(U.uStatic, u.stat);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    function rewind() {
        if (S && S.rewind == null) S.rewind = S.t;
    }

    function stop() {
        S = null;
        canvas.classList.remove('on');
    }

    /* pointer: the mouse steers by resting; a finger swipes to look and fly */
    function wire() {
        addEventListener('pointermove', e => {
            aim.x = e.clientX / innerWidth; aim.y = 1 - e.clientY / innerHeight; aim.on = true;
            if (drag && S && S.mode === 1) {
                const dx = e.clientX - drag.x, dy = e.clientY - drag.y, now = performance.now();
                const dtm = Math.max(16, now - drag.at) / 1000;
                cam.yaw -= dx * 0.004;
                cam.pitch = Math.max(-1.2, Math.min(1.2, cam.pitch + dy * 0.003));
                cam.boost = Math.min(14, cam.boost + Math.hypot(dx, dy) / dtm * 0.004);   // a quick swipe flies you forward
                drag.x = e.clientX; drag.y = e.clientY; drag.at = now;
            }
        });
        addEventListener('pointerdown', e => {
            if (!S || S.mode !== 1 || e.pointerType === 'mouse' || e.target.closest('button')) return;
            drag = { x: e.clientX, y: e.clientY, at: performance.now() };
            cam.yawV = cam.pitchV = 0;
        });
        const end = () => { drag = null; };
        addEventListener('pointerup', end);
        addEventListener('pointercancel', end);
        addEventListener('pointerleave', () => { aim.on = false; });
        addEventListener('resize', () => { if (S) resize(); });
    }

    return { init, start, step, rewind, stop, capture, K, get active() { return !!S; }, get ok() { return ok; } };
})();
