(function (global) {
  'use strict';

  // Additive piano-like synth + sample-accurate sequencer. Browser-only at
  // runtime; every public call is a safe no-op until ensure() creates the
  // AudioContext. All gain changes are ramped — never an instant drop to 0.

  const PARTIALS = [1, 0.45, 0.28, 0.16, 0.09, 0.05];
  const ATTACK = 0.004;
  const RELEASE = 0.09;

  let ctx = null;
  let master = null;
  let comp = null;
  let dryGain = null;
  let wetGain = null;
  let convolver = null;
  let volume = 0.8;

  const listeners = new Set();
  const liveVoices = new Set();
  const pendingSeqs = new Set();
  const noteTimers = new Set();

  function isFiniteMidi(m) {
    return typeof m === 'number' && isFinite(m) && m >= 0 && m <= 127;
  }

  function makeImpulse() {
    // Stereo noise burst, ~1.1s, power-curve decay: a small warm room.
    const secs = 1.1;
    const rate = ctx.sampleRate;
    const len = Math.floor(secs * rate);
    const buf = ctx.createBuffer(2, len, rate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) {
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6);
      }
    }
    return buf;
  }

  function buildGraph() {
    master = ctx.createGain();
    master.gain.value = volume;
    comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18;
    comp.knee.value = 24;
    comp.ratio.value = 2.5;
    comp.attack.value = 0.005;
    comp.release.value = 0.25;
    dryGain = ctx.createGain();
    dryGain.gain.value = 1;
    wetGain = ctx.createGain();
    wetGain.gain.value = 0.18;
    convolver = ctx.createConvolver();
    convolver.buffer = makeImpulse();
    master.connect(comp);
    comp.connect(dryGain);
    dryGain.connect(ctx.destination);
    comp.connect(convolver);
    convolver.connect(wetGain);
    wetGain.connect(ctx.destination);
  }

  function ensure() {
    if (!ctx) {
      const AC = global.AudioContext || global.webkitAudioContext;
      if (!AC) return Promise.resolve();
      ctx = new AC();
      buildGraph();
    }
    if (ctx.state === 'running') return Promise.resolve();
    let p = null;
    try { p = ctx.resume(); } catch (e) { p = null; }
    if (p && typeof p.then === 'function') return p.catch(function () {});
    return Promise.resolve();
  }

  function isReady() {
    return !!ctx && ctx.state === 'running';
  }

  function tryResume() {
    if (ctx && ctx.state !== 'running') {
      try { ctx.resume().catch(function () {}); } catch (e) { /* ignore */ }
    }
  }

  function notify(midi, when, beats) {
    if (listeners.size === 0) return;
    const ms = Math.max(0, (when - ctx.currentTime) * 1000);
    const id = setTimeout(function () {
      noteTimers.delete(id);
      listeners.forEach(function (cb) {
        try { cb(midi, when, beats); } catch (e) { /* listener errors are not ours */ }
      });
    }, ms);
    noteTimers.add(id);
  }

  function scheduleVoice(midi, when, dur, vel, chordScale) {
    const freq = 440 * Math.pow(2, (midi - 69) / 12);
    // Pitch-scaled exponential decay: ~1.8s in the bass down to ~1.05s at C7.
    const tau = Math.min(1.8, Math.max(0.4, 1.55 - (midi - 60) * 0.014));
    const peak = 0.17 * vel * chordScale;
    const tEnd = when + Math.max(dur, ATTACK + 0.01);

    const env = ctx.createGain();
    env.gain.value = 0.0001;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = Math.min(9000, Math.max(1200, 600 + freq * 5.5));
    lp.Q.value = 0.5;
    env.connect(lp);
    lp.connect(master);

    env.gain.setValueAtTime(0.0001, when);
    env.gain.linearRampToValueAtTime(peak, when + ATTACK);
    env.gain.setTargetAtTime(0.0001, when + ATTACK, tau);
    // Continuous hand-off into the release ramp: pin the analytic decay value
    // at note-end, then ramp to silence.
    const sustain = Math.max(0.0001, peak * Math.exp(-(tEnd - when - ATTACK) / tau));
    env.gain.setValueAtTime(sustain, tEnd);
    env.gain.linearRampToValueAtTime(0.0001, tEnd + RELEASE);

    const srcs = [];
    const nyq = ctx.sampleRate * 0.45;
    for (let n = 1; n <= PARTIALS.length; n++) {
      const f = freq * n;
      if (f >= nyq) break;
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = f;
      if (n > 1) osc.detune.value = n * n * 0.4; // slight stretched-partial warmth
      const pg = ctx.createGain();
      pg.gain.value = PARTIALS[n - 1];
      osc.connect(pg);
      pg.connect(env);
      osc.start(when);
      osc.stop(tEnd + RELEASE + 0.05);
      srcs.push(osc);
    }
    if (srcs.length === 0) {
      try { env.disconnect(); lp.disconnect(); } catch (e) { /* ignore */ }
      return;
    }
    const voice = { g: env, srcs: srcs };
    liveVoices.add(voice);
    srcs[0].onended = function () {
      liveVoices.delete(voice);
      try { env.disconnect(); lp.disconnect(); } catch (e) { /* ignore */ }
    };
  }

  function scheduleClick(kind, when) {
    const hi = kind === 'hi';
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = hi ? 1800 : 1100;
    const g = ctx.createGain();
    g.gain.value = 0.0001;
    osc.connect(g);
    g.connect(master);
    const peak = hi ? 0.1 : 0.12;
    g.gain.setValueAtTime(0.0001, when);
    g.gain.linearRampToValueAtTime(peak, when + 0.0012);
    g.gain.setTargetAtTime(0.0001, when + 0.005, 0.012);
    osc.start(when);
    osc.stop(when + 0.09);
    const voice = { g: g, srcs: [osc] };
    liveVoices.add(voice);
    osc.onended = function () {
      liveVoices.delete(voice);
      try { g.disconnect(); } catch (e) { /* ignore */ }
    };
  }

  function playNote(midi, opts) {
    if (!ctx || !isFiniteMidi(midi)) return;
    tryResume();
    const o = opts || {};
    const dur = (typeof o.dur === 'number' && o.dur > 0) ? o.dur : 0.9;
    const vel = (typeof o.vel === 'number') ? Math.max(0, Math.min(1, o.vel)) : 0.9;
    const when = (typeof o.when === 'number' && o.when > 0) ? o.when : 0;
    const start = ctx.currentTime + when + 0.01;
    scheduleVoice(midi, start, dur, vel, 1);
    notify(midi, start, 0);
  }

  function finishSeq(rec) {
    if (rec.done) return;
    rec.done = true;
    clearTimeout(rec.timer);
    pendingSeqs.delete(rec);
    rec.resolve();
  }

  function playSeq(items, opts) {
    if (!ctx || !Array.isArray(items) || items.length === 0) return Promise.resolve();
    tryResume();
    const bpm = (opts && typeof opts.bpm === 'number' && opts.bpm > 0) ? opts.bpm : 90;
    const spb = 60 / bpm;
    const t0 = ctx.currentTime + 0.08;
    let beat = 0;
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (!it) continue;
      // Zero-advance items (beats: 0 with an absolute `at` beat) let clicks land
      // UNDER sustained notes — the sequential cursor alone can't express that.
      const zero = it.beats === 0 && typeof it.at === 'number';
      const beats = zero ? 0 : ((typeof it.beats === 'number' && it.beats > 0) ? it.beats : 1);
      const when = t0 + (zero ? it.at : beat) * spb;
      const dur = Math.max(0.09, beats * spb - 0.05);
      if (it.rest) {
        // silence: cursor still advances
      } else if (it.click === 'hi' || it.click === 'lo') {
        scheduleClick(it.click, when);
      } else if (Array.isArray(it.midis) && it.midis.length > 0) {
        const scale = 1 / Math.sqrt(it.midis.length);
        for (let k = 0; k < it.midis.length; k++) {
          if (isFiniteMidi(it.midis[k])) {
            scheduleVoice(it.midis[k], when, dur, 0.9, scale);
            notify(it.midis[k], when, beats);
          }
        }
      } else if (isFiniteMidi(it.midi)) {
        scheduleVoice(it.midi, when, dur, 0.9, 1);
        notify(it.midi, when, beats);
      }
      beat += beats;
    }
    const endTime = t0 + beat * spb;
    return new Promise(function (resolve) {
      const rec = { resolve: resolve, timer: 0, done: false };
      const ms = Math.max(0, (endTime - ctx.currentTime) * 1000) + 30;
      rec.timer = setTimeout(function () { finishSeq(rec); }, ms);
      pendingSeqs.add(rec);
    });
  }

  function seqDuration(items, bpm) {
    if (!Array.isArray(items)) return 0;
    const spb = 60 / ((typeof bpm === 'number' && bpm > 0) ? bpm : 90);
    let beats = 0;
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (!it) continue;
      if (it.beats === 0 && typeof it.at === 'number') continue;
      beats += (typeof it.beats === 'number' && it.beats > 0) ? it.beats : 1;
    }
    return beats * spb;
  }

  function stop() {
    pendingSeqs.forEach(function (rec) { finishSeq(rec); });
    noteTimers.forEach(function (id) { clearTimeout(id); });
    noteTimers.clear();
    if (!ctx) return;
    const now = ctx.currentTime;
    liveVoices.forEach(function (v) {
      try {
        v.g.gain.cancelScheduledValues(now);
        v.g.gain.setValueAtTime(Math.max(v.g.gain.value, 0.0001), now);
        v.g.gain.linearRampToValueAtTime(0.0001, now + 0.04);
      } catch (e) { /* ignore */ }
      for (let i = 0; i < v.srcs.length; i++) {
        try { v.srcs[i].stop(now + 0.06); } catch (e) { /* ignore */ }
      }
    });
  }

  function setVolume(v) {
    if (typeof v !== 'number' || !isFinite(v)) return;
    volume = Math.max(0, Math.min(1, v));
    if (ctx && master) master.gain.setTargetAtTime(volume, ctx.currentTime, 0.02);
  }

  function onNote(cb) {
    if (typeof cb !== 'function') return function () {};
    listeners.add(cb);
    return function () { listeners.delete(cb); };
  }

  const AudioEngine = {
    ensure: ensure,
    isReady: isReady,
    playNote: playNote,
    playSeq: playSeq,
    seqDuration: seqDuration,
    stop: stop,
    setVolume: setVolume,
    onNote: onNote
  };

  global.AudioEngine = AudioEngine;
  if (typeof module !== 'undefined' && module.exports) module.exports = AudioEngine;
})(typeof window !== 'undefined' ? window : globalThis);
