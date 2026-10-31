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
        if (ctx) return;
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
    // nothing is scheduled while the browser is holding the audio back
    function ok() { return !!ctx && ctx.state === 'running'; }

    /* call from a tap/click/key: lets the sound out; true if it was being held back */
    function unlock() {
        if (!ctx || ctx.state === 'running') return false;
        ctx.resume();
        return true;
    }
    function whenRunning(fn) {
        if (!ctx) return;
        if (ctx.state === 'running') fn();
        else ctx.addEventListener('statechange', function go() { if (ctx.state === 'running') { ctx.removeEventListener('statechange', go); fn(); } });
    }

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

    /* the eagle tearing past like a jet: a rising, panning rush of air */
    function swoop(dur) {
        if (!ok()) return;
        const t = now(), p = ctx.createStereoPanner();
        p.pan.setValueAtTime(-1, t);
        p.pan.linearRampToValueAtTime(1, t + dur);
        p.connect(fxBus);
        const n = noise(), bp = filter('bandpass', 500, 1.4), g = gain(0, p);
        bp.frequency.setValueAtTime(500, t);
        bp.frequency.exponentialRampToValueAtTime(2600, t + dur * 0.55);
        bp.frequency.exponentialRampToValueAtTime(700, t + dur);
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.32, t + dur * 0.55);
        g.gain.linearRampToValueAtTime(0, t + dur);
        n.connect(bp).connect(g); n.start(t); n.stop(t + dur + 0.05);
        const lo = noise(), lp = filter('lowpass', 140), lg = gain(0, p);
        lg.gain.setValueAtTime(0, t);
        lg.gain.linearRampToValueAtTime(0.35, t + dur * 0.5);
        lg.gain.linearRampToValueAtTime(0, t + dur);
        lo.connect(lp).connect(lg); lo.start(t); lo.stop(t + dur + 0.05);
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

    /* ---------- SPACE ---------- */
    /* everything winds down: the dream drone sinks and fades */
    function calm(dur) {
        if (!ok()) return;
        const t = now();
        if (N.pad) {
            N.pad.gain.cancelScheduledValues(t);
            N.pad.gain.setValueAtTime(N.pad.gain.value, t);
            N.pad.gain.linearRampToValueAtTime(0, t + dur * 1.6);
            delete N.pad;
        }
        // a tape-stop groan as the world slows
        const o = osc('sawtooth', 160), lp = filter('lowpass', 900), g = gain(0, fxBus);
        o.frequency.setValueAtTime(160, t);
        o.frequency.exponentialRampToValueAtTime(30, t + dur);
        lp.frequency.exponentialRampToValueAtTime(120, t + dur);
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.06, t + 0.3);
        g.gain.linearRampToValueAtTime(0, t + dur);
        o.connect(lp).connect(g); o.start(t); o.stop(t + dur + 0.1);
    }

    /* the black hole: a sub rumble that climbs in pitch and weight */
    function hole(dur) {
        if (!ok()) return;
        const t = now();
        const g = gain(0, fxBus);
        const n = noise(), lp = filter('lowpass', 70, 1.5);
        lp.frequency.setValueAtTime(70, t);
        lp.frequency.exponentialRampToValueAtTime(600, t + dur);
        const sub = osc('sine', 28), sg = gain(0.6);
        sub.frequency.setValueAtTime(28, t);
        sub.frequency.exponentialRampToValueAtTime(90, t + dur);
        const wob = gain(1);
        const l = lfo(0.6, 0.4, wob.gain);
        l.frequency.setValueAtTime(0.6, t);
        l.frequency.exponentialRampToValueAtTime(9, t + dur);
        n.connect(lp).connect(wob); sub.connect(sg).connect(wob); wob.connect(g);
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.9, t + dur);
        n.start(t); sub.start(t);
        N.hole = { g, n, sub, l };
    }

    /* one beat of the collapsing seed */
    function pulse(k) {
        if (!ok()) return;
        const t = now();
        const o = osc('sine', 90 + 700 * k * k), g = gain(0, fxBus);
        g.gain.setValueAtTime(0.35, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
        o.connect(g); o.start(t); o.stop(t + 0.1);
        const c = noise(), hp = filter('highpass', 3000), cg = gain(0.15 + 0.2 * k, fxBus);
        cg.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
        c.connect(hp).connect(cg); c.start(t); c.stop(t + 0.04);
    }

    /* the big bang */
    function bang() {
        if (!ok()) return;
        const t = now();
        if (N.hole) {
            const H = N.hole;
            H.g.gain.cancelScheduledValues(t);
            H.g.gain.setValueAtTime(0, t);
            [H.n, H.sub, H.l].forEach(s => { try { s.stop(t + 0.05); } catch (e) { /* already stopped */ } });
            delete N.hole;
        }
        const n = noise(), lp = filter('lowpass', 12000), sh = shaper(2.5), g = gain(1.2, fxBus);
        lp.frequency.setValueAtTime(12000, t);
        lp.frequency.exponentialRampToValueAtTime(50, t + 5);
        g.gain.setValueAtTime(1.2, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 6);
        n.connect(lp).connect(sh).connect(g);
        g.connect(echoIn);
        n.start(t); n.stop(t + 6.2);
        const o = osc('sine', 120), og = gain(1.3, fxBus);
        o.frequency.setValueAtTime(120, t);
        o.frequency.exponentialRampToValueAtTime(22, t + 3);
        og.gain.exponentialRampToValueAtTime(0.001, t + 3.5);
        o.connect(og); o.start(t); o.stop(t + 3.6);
        // a shimmer of new light rising out of it
        const s1 = osc('triangle', 300), s1g = gain(0);
        s1.frequency.setValueAtTime(300, t + 0.3);
        s1.frequency.exponentialRampToValueAtTime(2400, t + 5);
        s1g.gain.setValueAtTime(0, t + 0.3);
        s1g.gain.linearRampToValueAtTime(0.05, t + 1.5);
        s1g.gain.linearRampToValueAtTime(0, t + 5);
        s1.connect(s1g).connect(echoIn); s1.start(t); s1.stop(t + 5.1);
    }

    /* drifting through space: a deep drone and slow, cool jazz chords on an electric piano */
    const CHORDS = [
        [146.8, 185.0, 220.0, 277.2, 329.6],   // Dmaj9
        [123.5, 146.8, 185.0, 220.0, 277.2],   // Bm9
        [98.0, 123.5, 146.8, 185.0, 277.2],    // Gmaj7#11-ish
        [110.0, 146.8, 196.0, 246.9, 370.0],   // A13sus
    ];
    function keys(freqs, at) {
        freqs.forEach((fq, i) => {
            const st = at + i * 0.045 + Math.random() * 0.02;
            const o = osc('sine', fq), b = osc('sine', fq * 2.01), g = gain(0), bg = gain(0.25);
            g.connect(echoIn); g.connect(fxBus);
            g.gain.setValueAtTime(0, st);
            g.gain.linearRampToValueAtTime(0.045, st + 0.02);
            g.gain.exponentialRampToValueAtTime(0.012, st + 1.5);
            g.gain.exponentialRampToValueAtTime(0.0005, st + 6.5);
            bg.gain.setValueAtTime(0.25, st);
            bg.gain.exponentialRampToValueAtTime(0.001, st + 0.6);
            const trem = lfo(4.5, 0.012, g.gain);
            o.connect(g); b.connect(bg).connect(g);
            o.start(st); b.start(st); o.stop(st + 6.6); b.stop(st + 6.6); trem.stop(st + 6.6);
        });
    }
    function brush(at, loud) {
        const n = noise(), hp = filter('bandpass', 7000, 0.7), g = gain(0, fxBus);
        g.gain.setValueAtTime(0, at);
        g.gain.linearRampToValueAtTime(0.025 * loud, at + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0005, at + 0.18);
        n.connect(hp).connect(g); n.start(at); n.stop(at + 0.2);
    }
    function spaceMusic() {
        if (!ok() || N.space) return;
        const t = now();
        const g = gain(0, fxBus), lp = filter('lowpass', 400);
        [55, 82.4, 110].forEach((fq, i) => {
            const o = osc(i ? 'sine' : 'triangle', fq);
            lfo(0.05 + i * 0.02, fq * 0.003, o.frequency);
            o.connect(lp); o.start(t);
        });
        lp.connect(g);
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.12, t + 6);
        let bar = 0;
        const play = () => {
            const at = now() + 0.05;
            keys(CHORDS[bar % CHORDS.length], at);
            // brushed ride in a lazy swing, coming and going
            if (bar > 1) for (let b = 0; b < 4; b++) { brush(at + b * 1.75, 0.7); brush(at + b * 1.75 + 1.17, 0.4); }
            bar++;
        };
        play();
        N.space = { g, timer: setInterval(play, 7000) };
    }
    function spaceStop(fade = 0.6) {
        if (!N.space) return;
        clearInterval(N.space.timer);
        if (ok()) N.space.g.gain.setTargetAtTime(0, now(), fade / 3);
        delete N.space;
    }

    /* the VHS rewind: the motor whines up, the tape slips, then drops */
    function rewind() {
        if (!ok()) return;
        const t = now();
        const o = osc('sawtooth', 180), lp = filter('lowpass', 2400), g = gain(0, fxBus);
        o.frequency.setValueAtTime(180, t);
        o.frequency.exponentialRampToValueAtTime(1300, t + 1.2);
        o.frequency.exponentialRampToValueAtTime(90, t + 1.45);
        lfo(13, 25, o.frequency);
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.09, t + 0.15);
        g.gain.setValueAtTime(0.09, t + 1.2);
        g.gain.linearRampToValueAtTime(0, t + 1.45);
        o.connect(lp).connect(g); o.start(t); o.stop(t + 1.5);
        const n = noise(), hp = filter('highpass', 2500), ng = gain(0, fxBus);
        ng.gain.linearRampToValueAtTime(0.08, t + 0.2);
        ng.gain.linearRampToValueAtTime(0, t + 1.45);
        n.connect(hp).connect(ng); n.start(t); n.stop(t + 1.5);
        // the clunk of the tape dropping
        const c = osc('sine', 85), cg = gain(0, fxBus);
        cg.gain.setValueAtTime(0.7, t + 1.42);
        cg.gain.exponentialRampToValueAtTime(0.001, t + 1.7);
        c.connect(cg); c.start(t + 1.42); c.stop(t + 1.75);
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

    return { init, calm, hole, pulse, bang, spaceMusic, spaceStop, rewind, unlock, whenRunning, signalLoss, glitch, nature, cry, swoop, wingbeat, whistle, hush, boom, staticRush, tuneIn, melt, pad, hover, select, stopAll, setMuted, get muted() { return muted; } };
})();
