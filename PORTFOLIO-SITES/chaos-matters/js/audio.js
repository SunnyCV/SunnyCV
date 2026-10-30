/* ==========================================================
   Chaos Matters — sound
   Every sound is synthesised live with the Web Audio API:
   no audio files. Wind, birds, an engine, a falling bomb,
   the blast, TV static, the test-card tone and the dream pad.
   ========================================================== */

const Sound = (() => {
    let ctx, master, noiseBuf, natureBus, fxBus, echoIn;
    let muted = false;
    let birdTimer = null;
    let live = new Set();          // everything that is playing, so it can all be stopped
    const N = {};                  // named nodes we keep adjusting

    function init() {
        if (ctx) { ctx.resume(); return; }
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        ctx = new AC();
        const comp = ctx.createDynamicsCompressor();
        comp.threshold.value = -10;
        comp.ratio.value = 6;
        master = ctx.createGain();
        master.gain.value = muted ? 0 : 0.9;
        master.connect(comp).connect(ctx.destination);

        noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 3, ctx.sampleRate);
        const d = noiseBuf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;

        natureBus = gain(1, master);
        fxBus = gain(1, master);

        // a long, soft echo that the dream world sings through
        echoIn = gain(1);
        const delay = ctx.createDelay(2);
        delay.delayTime.value = 0.38;
        const fb = gain(0.42);
        const tone = filter('lowpass', 2200);
        echoIn.connect(delay).connect(tone).connect(fb).connect(delay);
        tone.connect(gain(0.6, fxBus));
        echoIn.connect(fxBus);
    }

    /* ---------- building blocks ---------- */
    const now = () => ctx.currentTime;
    function gain(v, to) { const g = ctx.createGain(); g.gain.value = v; if (to) g.connect(to); return g; }
    function filter(type, freq, q) {
        const b = ctx.createBiquadFilter();
        b.type = type; b.frequency.value = freq;
        if (q != null) b.Q.value = q;
        return b;
    }
    function track(src) { live.add(src); src.onended = () => live.delete(src); return src; }
    function noise() { const s = ctx.createBufferSource(); s.buffer = noiseBuf; s.loop = true; return track(s); }
    function osc(type, freq) { const o = ctx.createOscillator(); o.type = type; o.frequency.value = freq; return track(o); }
    function lfo(freq, depth, param) {
        const o = osc('sine', freq), g = gain(depth);
        o.connect(g).connect(param); o.start();
        return o;
    }
    function shaper(amount) {
        const s = ctx.createWaveShaper(), n = 1024, c = new Float32Array(n);
        for (let i = 0; i < n; i++) { const x = i / n * 2 - 1; c[i] = Math.tanh(x * amount); }
        s.curve = c;
        return s;
    }
    function ok() { return !!ctx; }

    /* ---------- Act 1: a sunny day ---------- */
    function nature() {
        if (!ok()) return;
        const t = now();
        natureBus.gain.cancelScheduledValues(t);
        natureBus.gain.setValueAtTime(1, t);

        // wind: band-passed noise whose pitch and loudness drift in gusts
        const w = noise(), bp = filter('bandpass', 480, 0.8), lp = filter('lowpass', 1400);
        const g = gain(0, natureBus);
        lfo(0.11, 260, bp.frequency);
        const gust = gain(0.09);
        lfo(0.07, 1, gust.gain);
        w.connect(bp).connect(lp).connect(g);
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.32, t + 3);
        w.start();

        // leaves: a quieter, brighter rustle
        const l = noise(), hp = filter('highpass', 3800), lg = gain(0, natureBus);
        lfo(0.31, 0.02, lg.gain);
        l.connect(hp).connect(lg);
        lg.gain.linearRampToValueAtTime(0.035, t + 4);
        l.start();

        scheduleBird(1.8);
    }

    function chirp(delay) {
        const t = now() + delay, pan = ctx.createStereoPanner();
        pan.pan.value = Math.random() * 1.6 - 0.8;
        pan.connect(natureBus);
        const calls = 2 + Math.floor(Math.random() * 3), base = 2400 + Math.random() * 1400;
        for (let i = 0; i < calls; i++) {
            const s = t + i * (0.11 + Math.random() * 0.05);
            const o = osc('sine', base), g = gain(0, pan);
            o.frequency.setValueAtTime(base, s);
            o.frequency.exponentialRampToValueAtTime(base * 1.55, s + 0.045);
            o.frequency.exponentialRampToValueAtTime(base * 1.1, s + 0.09);
            g.gain.setValueAtTime(0, s);
            g.gain.linearRampToValueAtTime(0.035, s + 0.015);
            g.gain.exponentialRampToValueAtTime(0.0008, s + 0.1);
            o.connect(g);
            o.start(s); o.stop(s + 0.12);
        }
    }
    function scheduleBird(after) {
        clearTimeout(birdTimer);
        birdTimer = setTimeout(() => { chirp(0); scheduleBird(1.4 + Math.random() * 3); }, after * 1000);
    }

    /* ---------- Act 2: the eagle ---------- */
    /* the cry: a raspy, falling "kee-eeee-arr", echoing across the prairie */
    function cry(pan = 0, loud = 1) {
        if (!ok()) return;
        const t = now(), p = ctx.createStereoPanner();
        p.pan.value = pan;
        const g = gain(0), bp = filter('bandpass', 2600, 2.5);
        p.connect(fxBus); g.connect(p); g.connect(echoIn);
        const o = osc('sawtooth', 2400), n = noise(), ng = gain(0.25);
        o.frequency.setValueAtTime(2300, t);
        o.frequency.linearRampToValueAtTime(3100, t + 0.12);
        o.frequency.setValueAtTime(3050, t + 0.3);
        o.frequency.exponentialRampToValueAtTime(1700, t + 1.25);
        const rasp = lfo(38, 90, o.frequency);
        bp.frequency.setValueAtTime(2600, t);
        bp.frequency.exponentialRampToValueAtTime(1900, t + 1.25);
        o.connect(bp); n.connect(ng).connect(bp);
        bp.connect(g);
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.12 * loud, t + 0.06);
        g.gain.setValueAtTime(0.1 * loud, t + 0.9);
        g.gain.exponentialRampToValueAtTime(0.0005, t + 1.35);
        o.start(t); o.stop(t + 1.4); n.start(t); n.stop(t + 1.4); rasp.stop(t + 1.4);
    }

    /* one wing beat: a soft whoosh of air */
    function wingbeat(pan, near) {
        if (!ok() || near < 0.05) return;
        const t = now(), p = ctx.createStereoPanner();
        p.pan.value = pan;
        p.connect(fxBus);
        const n = noise(), bp = filter('bandpass', 380, 1.1), g = gain(0, p);
        bp.frequency.setValueAtTime(260, t);
        bp.frequency.linearRampToValueAtTime(600, t + 0.18);
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.22 * near * near, t + 0.08);
        g.gain.linearRampToValueAtTime(0, t + 0.3);
        n.connect(bp).connect(g); n.start(t); n.stop(t + 0.32);
    }

    /* the falling whistle — higher and quieter far away, deeper and louder as it arrives */
    function whistle(dur) {
        if (!ok()) return;
        const t = now();
        const g = gain(0, fxBus), o1 = osc('sine', 1900), o2 = osc('triangle', 1912);
        const vib = lfo(6.5, 14, o1.frequency);
        [o1, o2].forEach(o => {
            o.frequency.setValueAtTime(o === o1 ? 1900 : 1912, t);
            o.frequency.exponentialRampToValueAtTime(380, t + dur);
            o.connect(g); o.start(t); o.stop(t + dur + 0.05);
        });
        vib.stop(t + dur);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.22, t + dur * 0.95);
        g.gain.linearRampToValueAtTime(0, t + dur + 0.04);
    }

    /* the held breath: the world goes quiet just before impact */
    function hush(fade = 0.5) {
        if (!ok()) return;
        const t = now();
        clearTimeout(birdTimer);
        natureBus.gain.cancelScheduledValues(t);
        natureBus.gain.setValueAtTime(natureBus.gain.value, t);
        natureBus.gain.linearRampToValueAtTime(0, t + fade);
    }

    /* ---------- Act 3: impact ---------- */
    function boom() {
        if (!ok()) return;
        const t = now();
        // body of the blast: noise that darkens as it rolls away
        const n = noise(), lp = filter('lowpass', 7000), sh = shaper(3), g = gain(1, fxBus);
        lp.frequency.setValueAtTime(7000, t);
        lp.frequency.exponentialRampToValueAtTime(70, t + 2.8);
        g.gain.setValueAtTime(1.1, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 3.4);
        n.connect(lp).connect(sh).connect(g);
        n.start(t); n.stop(t + 3.5);
        // the thump you feel
        const o = osc('sine', 95), og = gain(1, fxBus);
        o.frequency.setValueAtTime(95, t);
        o.frequency.exponentialRampToValueAtTime(26, t + 1.4);
        og.gain.setValueAtTime(1.2, t);
        og.gain.exponentialRampToValueAtTime(0.001, t + 1.8);
        o.connect(og); o.start(t); o.stop(t + 1.9);
        // the long rumble of the cloud climbing
        const ru = noise(), rlp = filter('lowpass', 160, 0.9), rg = gain(0, fxBus);
        rg.gain.setValueAtTime(0, t);
        rg.gain.linearRampToValueAtTime(0.9, t + 0.6);
        rg.gain.linearRampToValueAtTime(0.8, t + 5);
        rg.gain.linearRampToValueAtTime(0.95, t + 8);
        rg.gain.exponentialRampToValueAtTime(0.001, t + 9.5);
        lfo(0.6, 0.15, rg.gain);
        ru.connect(rlp).connect(rg); ru.start(t); ru.stop(t + 9.6);
        // the roar of the fireball boiling upward, swelling as the smoke closes in
        const ro = noise(), rbp = filter('bandpass', 320, 0.7), rog = gain(0, fxBus);
        rbp.frequency.setValueAtTime(900, t);
        rbp.frequency.exponentialRampToValueAtTime(220, t + 8);
        rog.gain.setValueAtTime(0, t);
        rog.gain.linearRampToValueAtTime(0.35, t + 1);
        rog.gain.linearRampToValueAtTime(0.25, t + 4);
        rog.gain.linearRampToValueAtTime(0.5, t + 8.2);
        rog.gain.linearRampToValueAtTime(0, t + 8.6);
        ro.connect(rbp).connect(rog); ro.start(t); ro.stop(t + 8.7);
        // the crack
        const c = noise(), hp = filter('highpass', 2200), cg = gain(0.7, fxBus);
        cg.gain.setValueAtTime(0.7, t);
        cg.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
        c.connect(hp).connect(cg); c.start(t); c.stop(t + 0.3);
    }

    /* the cloud takes the screen: a crushed, overloaded burst as the signal dies */
    function signalLoss() {
        if (!ok()) return;
        const t = now();
        const n = noise(), sh = shaper(12), bp = filter('bandpass', 900, 0.6), g = gain(0, fxBus);
        bp.frequency.setValueAtTime(400, t);
        bp.frequency.exponentialRampToValueAtTime(3000, t + 0.8);
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.5, t + 0.15);
        g.gain.exponentialRampToValueAtTime(0.001, t + 1.4);
        n.connect(bp).connect(sh).connect(g); n.start(t); n.stop(t + 1.5);
    }

    /* little bursts of static as the title flickers into being */
    function glitch(count = 7, spread = 1.6) {
        if (!ok()) return;
        const t = now();
        for (let i = 0; i < count; i++) {
            const st = t + Math.random() * spread, len = 0.03 + Math.random() * 0.09;
            const n = noise(), hp = filter('bandpass', 1500 + Math.random() * 4000, 1.2), g = gain(0, fxBus);
            g.gain.setValueAtTime(0.18 + Math.random() * 0.2, st);
            g.gain.setValueAtTime(0, st + len);
            n.connect(hp).connect(g); n.start(st); n.stop(st + len + 0.02);
        }
    }

    /* the screen gives way to raw static */
    function staticRush() {
        if (!ok()) return;
        const t = now();
        const n = noise(), hp = filter('highpass', 350), peak = filter('peaking', 3200, 0.8);
        peak.gain.value = 6;
        const g = gain(0, fxBus), crackle = gain(1);
        n.connect(hp).connect(peak).connect(crackle).connect(g);
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.42, t + 0.9);
        for (let i = 0; i < 160; i++) crackle.gain.setValueAtTime(0.65 + Math.random() * 0.55, t + i * 0.035);
        n.start(t);
        N.static = { g, n };
    }

    /* ---------- Act 4: the test card and the dream ---------- */
    function tuneIn() {
        if (!ok()) return;
        const t = now();
        if (N.static) N.static.g.gain.setTargetAtTime(0.05, t, 0.25);
        const o = osc('sine', 1000), sh = shaper(1.6), g = gain(0, fxBus);
        const flutter = lfo(5.5, 6, o.frequency);
        const am = gain(1);
        lfo(9, 0.12, am.gain);
        o.connect(sh).connect(am).connect(g);
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.085, t + 0.15);
        o.start(t);
        N.tone = { o, g, flutter };
    }

    /* the tone melts down into the dream pad */
    function melt(dur) {
        if (!ok()) return;
        const t = now();
        if (N.tone) {
            N.tone.o.frequency.cancelScheduledValues(t);
            N.tone.o.frequency.setValueAtTime(1000, t);
            N.tone.o.frequency.exponentialRampToValueAtTime(220, t + dur);
            lfo(0.9, 40, N.tone.o.frequency);
            N.tone.g.gain.setValueAtTime(0.085, t + dur * 0.4);
            N.tone.g.gain.linearRampToValueAtTime(0, t + dur);
            N.tone.o.stop(t + dur + 0.1);
        }
        if (N.static) {
            N.static.g.gain.setTargetAtTime(0, t, dur / 4);
            N.static.n.stop(t + dur);
        }
        pad(dur * 0.6);
    }

    function pad(fadeIn = 3) {
        if (!ok() || N.pad) return;
        const t = now();
        const g = gain(0), lp = filter('lowpass', 900, 2);
        lfo(0.045, 650, lp.frequency);
        lp.connect(g);
        g.connect(fxBus);
        g.connect(echoIn);
        [110, 164.8, 220, 246.9, 329.6, 493.9].forEach((fq, i) => {
            const o = osc(i % 2 ? 'sine' : 'triangle', fq);
            lfo(0.08 + i * 0.03, fq * 0.004, o.frequency);
            const og = gain(i > 3 ? 0.35 : 0.6);
            o.connect(og).connect(lp);
            o.start(t);
        });
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.16, t + fadeIn);
        N.pad = g;
    }

    const SCALE = [392, 440, 523.3, 587.3, 659.3, 784, 880, 1046.5];
    function hover(i) {
        if (!ok()) return;
        const t = now(), o = osc('sine', SCALE[i % SCALE.length]), g = gain(0);
        g.connect(echoIn);
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.07, t + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0005, t + 0.5);
        o.connect(g); o.start(t); o.stop(t + 0.55);
    }

    function select() {
        if (!ok()) return;
        const t = now();
        const n = noise(), bp = filter('bandpass', 300, 3), g = gain(0, fxBus);
        bp.frequency.setValueAtTime(300, t);
        bp.frequency.exponentialRampToValueAtTime(4000, t + 0.45);
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.25, t + 0.2);
        g.gain.linearRampToValueAtTime(0, t + 0.6);
        n.connect(bp).connect(g); n.start(t); n.stop(t + 0.65);
        const o = osc('sine', 330), og = gain(0.12);
        og.connect(echoIn);
        o.frequency.setValueAtTime(330, t);
        o.frequency.exponentialRampToValueAtTime(110, t + 0.6);
        og.gain.exponentialRampToValueAtTime(0.0005, t + 0.8);
        o.connect(og); o.start(t); o.stop(t + 0.85);
    }

    /* ---------- control ---------- */
    function stopAll() {
        if (!ok()) return;
        clearTimeout(birdTimer);
        live.forEach(s => { try { s.stop(); } catch (e) { /* already stopped */ } });
        live.clear();
        for (const k in N) delete N[k];
    }

    function setMuted(m) {
        muted = m;
        if (ok()) master.gain.setTargetAtTime(m ? 0 : 0.9, now(), 0.05);
    }

    return { init, signalLoss, glitch, nature, cry, wingbeat, whistle, hush, boom, staticRush, tuneIn, melt, pad, hover, select, stopAll, setMuted, get muted() { return muted; } };
})();
