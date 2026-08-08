# Cadenza — learn music theory from zero 🎼

**Live site: https://valerocar.github.io/cadenza/**

Cadenza is a self-contained web app that teaches music theory from the very
beginning: note names, staff reading, accidentals, scales and key signatures,
intervals, chords, rhythm — and real **ear training**: interval recognition,
chord quality, and melodic & rhythmic **dictation**.

No accounts, no dependencies, no build step, no network calls. Progress is
saved in your browser (localStorage).

## Run it

```sh
cd musedu
python3 -m http.server 8000
# open http://localhost:8000
```

(Opening `index.html` directly also works in most browsers.)

## How learning is structured

- **12 progressive units**, each unlocked by passing the previous unit's
  mastery quiz (8/10). Every unit has:
  - **Learn** — a short lesson with interactive demos (play the keyboard, hear
    examples, see them on the staff).
  - **Practice** — adaptive drills per skill. Five correct in a row levels you
    up; repeated misses gently step you back down.
  - **Mastery Quiz** — 10 mixed questions to complete the unit.
- **Daily Review** mixes every skill from completed units — spaced practice
  keeps mastery from fading.
- Ear training uses a built-in Web Audio piano synth: melodic/harmonic
  intervals, chord qualities and inversions, scale-degree hearing, and full
  melodic dictation anchored by a I–IV–V–I cadence, plus rhythmic dictation
  with a tile-based rhythm builder.

## Curriculum

1. The Keyboard & Note Names
2. Reading the Staff (treble & bass)
3. Accidentals & Steps
4. Major Scales & Key Signatures
5. Intervals (size & quality)
6. Hearing Intervals
7. Minor Scales & Relative Keys
8. Triads & Inversions
9. Hearing Chords
10. Rhythm & Meter
11. Melodic Dictation
12. Diatonic Harmony

## Code layout

| File | Role |
|---|---|
| `js/theory.js` | Pure music-theory engine (notes, intervals, scales, keys, chords) — node-testable |
| `js/audio.js` | Web Audio piano synth + sample-accurate sequencer |
| `js/notation.js` | SVG staff renderer (clefs, key signatures, ledger lines, chords) |
| `js/keyboard.js` | Interactive piano keyboard component |
| `js/curriculum.js` | Units & skills definitions |
| `js/lessons-a.js` / `js/lessons-b.js` | Lesson content |
| `js/exercises.js` | Question generators for every skill & level |
| `js/state.js` | Progress store (localStorage) |
| `js/session.js` | Practice/quiz session engine and answer inputs |
| `js/app.js` | Router, dashboard, unit/lesson views, settings |

## Tests

```sh
node dev/theory.test.mjs
node dev/exercises.test.mjs
node dev/notation.test.mjs
node dev/keyboard.test.mjs
node dev/lessons-a.test.mjs
node dev/lessons-b.test.mjs
```
