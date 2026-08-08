# audio.js self-review (spec requirement → where satisfied)

1. Voice recipe (6 partials 1/.45/.28/.16/.09/.05, stretched detune, 4ms attack, pitch-scaled tau 1.05–1.8s, pitch-scaled lowpass): `PARTIALS`/`ATTACK` consts + `scheduleVoice()`.
2. No clicks/pops: every gain change is a ramp; release ramp pins the analytic decay value at note-end for continuity; nothing ever jumps to 0 (floor 0.0001) — `scheduleVoice()`, `stop()`, `setVolume()` (setTargetAtTime).
3. Master chain voices → master gain → gentle compressor (−18dB/2.5:1) → dry + generated 1.1s stereo noise-burst convolution reverb at 0.18 wet → destination: `buildGraph()` + `makeImpulse()`.
4. Chord normalization: per-voice gain scaled by `1/Math.sqrt(midis.length)` in `playSeq()`.
5. `playSeq` schedules on the AudioContext clock in one pass (beat cursor × 60/bpm from a fixed `t0`), handles midi/midis/rest/click items, returns a Promise resolved at sequence end via a timer measured against `ctx.currentTime`.
6. `stop()` resolves all pending playSeq promises, clears onNote timers, cancels each tracked voice's automation, ramps its gain to silence in 40ms, and stops all sources (voices tracked in `liveVoices`, removed via `onended`).
7. `onNote(cb)` fires per sounding note including every chord member, via `setTimeout` aligned to `(when − ctx.currentTime)`, and returns an unsubscribe function — `notify()`/`onNote()`.
8. `ensure()` lazily creates and resumes the context, safe to call repeatedly, resolves when running (resume rejection caught for strict autoplay policies); `isReady()` reports `state === 'running'`.
9. Guards: every public call is a no-throw no-op with no context (node-verified); metronome clicks are quiet 5ms sine blips at 1800Hz (hi) / 1100Hz (lo) — `scheduleClick()`.
10. Standards: IIFE assigning single global `AudioEngine` with dual node/browser export, ES2020, 2-space indent, single quotes; `node --check js/audio.js` passes.
