// Run: node dev/exercises.test.mjs — exits non-zero on any failure.
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

const Theory = require('../js/theory.js');
const Exercises = require('../js/exercises.js');

let failures = 0;
let checks = 0;
function ok(cond, msg) {
  checks++;
  if (!cond) {
    failures++;
    console.error('FAIL:', msg);
  }
}
function eq(a, b, msg) {
  ok(JSON.stringify(a) === JSON.stringify(b), msg + ' — got ' + JSON.stringify(a) + ', want ' + JSON.stringify(b));
}

/* ---------- 1. full schema self-test (every skill x level x 60) ---------- */

const problems = Exercises.selfTest();
if (problems.length) {
  problems.forEach((p) => console.error('selfTest:', p));
}
ok(problems.length === 0, 'selfTest reported ' + problems.length + ' problems');

/* ---------- 2. tiles ---------- */

eq(Exercises.tileItems('w', 60), [{ midi: 60, beats: 4 }], 'tile w');
eq(Exercises.tileItems('hd', 60), [{ midi: 60, beats: 3 }], 'tile hd');
eq(Exercises.tileItems('h', 60), [{ midi: 60, beats: 2 }], 'tile h');
eq(Exercises.tileItems('q', 60), [{ midi: 60, beats: 1 }], 'tile q');
eq(Exercises.tileItems('ee', 60), [{ midi: 60, beats: 0.5 }, { midi: 60, beats: 0.5 }], 'tile ee');
eq(Exercises.tileItems('qr', 60), [{ rest: true, beats: 1 }], 'tile qr');
eq(Exercises.tileItems('hr', 60), [{ rest: true, beats: 2 }], 'tile hr');
eq(Exercises.tileItems('dqe', 60), [{ midi: 60, beats: 1.5 }, { midi: 60, beats: 0.5 }], 'tile dqe');
eq(Exercises.tileItems('eqe', 60), [{ midi: 60, beats: 0.5 }, { midi: 60, beats: 1 }, { midi: 60, beats: 0.5 }], 'tile eqe');
const tileBeats = { w: 4, hd: 3, h: 2, q: 1, ee: 1, qr: 1, hr: 2, dqe: 2, eqe: 2 };
ok(Object.keys(Exercises.TILES).length === 9, 'TILES has 9 entries');
for (const [t, beats] of Object.entries(tileBeats)) {
  ok(Exercises.TILES[t] && Exercises.TILES[t].beats === beats, 'TILES.' + t + '.beats === ' + beats);
  ok(typeof Exercises.TILES[t].label === 'string' && Exercises.TILES[t].label.length > 0, 'TILES.' + t + ' label');
  const sum = Exercises.tileItems(t, 60).reduce((a, it) => a + it.beats, 0);
  ok(sum === beats, 'tileItems(' + t + ') beats sum to ' + beats);
}

/* ---------- 3. levels API ---------- */

ok(Exercises.maxLevel('ear-interval-mel') === 5, 'ear-interval-mel has 5 levels');
ok(Exercises.maxLevel('kb-find-note') === 4, 'kb-find-note has 4 levels');
ok(Exercises.maxLevel('step-id') === 3, 'step-id has 3 levels');
ok(typeof Exercises.levelDesc('kb-find-note', 1) === 'string' && Exercises.levelDesc('kb-find-note', 1).length > 0,
  'levelDesc returns text');

/* ---------- 4. interval-quality: answer matches Theory on the staff notes ---------- */

for (let i = 0; i < 40; i++) {
  const q = Exercises.generate('interval-quality', 1 + (i % 4));
  const [n1, n2] = q.stimulus.staff.notes;
  const iv = Theory.interval(n1, n2);
  ok(iv.name === q.answer, 'interval-quality answer ' + q.answer + ' matches staff interval ' + iv.name);
  const c = q.choices.find((x) => x.id === q.answer);
  ok(c && c.label === Theory.intervalLabel(q.answer), 'interval-quality label matches Theory.intervalLabel');
}

/* ---------- 5. interval-size: staff letters agree with answer ---------- */

for (let i = 0; i < 20; i++) {
  const q = Exercises.generate('interval-size', 1 + (i % 3));
  const [n1, n2] = q.stimulus.staff.notes;
  const iv = Theory.interval(n1, n2);
  ok(String(iv.number) === q.answer, 'interval-size answer matches letter count');
}

/* ---------- 6. melodic-dictation L1: stepwise C major from C4 ---------- */

const cMajorMidis = Theory.scale(Theory.N('C4'), 'major').map(Theory.midi);
for (let i = 0; i < 40; i++) {
  const q = Exercises.generate('melodic-dictation', 1);
  ok(q.answer.length === 3, 'dictation L1 has 3 notes');
  ok(q.answer[0] === 60, 'dictation L1 starts on C4');
  ok(q.answer[0] >= 55, 'dictation tonic stays at/above G3 so treble staves have ledger room');
  ok(q.answer.every((m) => m >= 60 && m <= 67), 'dictation L1 stays within C4–G4');
  ok(q.answer.every((m) => cMajorMidis.includes(m)), 'dictation L1 all diatonic in C');
  for (let k = 1; k < q.answer.length; k++) {
    const d = Math.abs(q.answer[k] - q.answer[k - 1]);
    ok(d >= 1 && d <= 2, 'dictation L1 stepwise (got leap of ' + d + ')');
  }
  ok(q.meta && q.meta.clef === 'treble' && Number.isInteger(q.meta.keySig), 'dictation meta clef/keySig');
  ok(q.meta.answerNotes.length === 3, 'dictation meta.answerNotes length');
  q.meta.answerNotes.forEach((n, k) => ok(Theory.midi(n) === q.answer[k], 'dictation answerNotes midi match'));
  eq(q.stimulus.audio.replayItems, q.meta.melodyItems, 'dictation replayItems === melodyItems');
  const melNotes = q.meta.melodyItems.filter((it) => it.midi !== undefined);
  ok(melNotes.length === q.answer.length, 'dictation melodyItems note count');
  ok(melNotes[melNotes.length - 1].beats === 2, 'dictation final note held 2 beats');
  // cadence prefix: 4 chords, rest, tonic, rest
  const pre = q.stimulus.audio.items.slice(0, 7);
  ok(pre[0].midis && pre[1].midis && pre[2].midis && pre[3].midis, 'cadence: four chords first');
  ok(pre[4].rest === true && pre[6].rest === true, 'cadence: rests around lone tonic');
  ok(pre[5].midi === 60, 'cadence: lone tonic is the tonic midi');
  eq(pre[0].midis, [60, 64, 67], 'cadence I voicing [T,T+4,T+7]');
  eq(pre[1].midis, [60, 65, 69], 'cadence IV voicing [T,T+5,T+9]');
  eq(pre[2].midis, [59, 62, 67], 'cadence V voicing [T-1,T+2,T+7]');
}

/* ---------- 7. melodic-dictation L4 minor voicing ---------- */

{
  let sawMinor = false;
  for (let i = 0; i < 80 && !sawMinor; i++) {
    const q = Exercises.generate('melodic-dictation', 4);
    if (q.meta.tonicName.indexOf('minor') !== -1) {
      sawMinor = true;
      const T = q.answer[0];
      eq(q.stimulus.audio.items[0].midis, [T, T + 3, T + 7], 'minor cadence i voicing [T,T+3,T+7]');
      eq(q.stimulus.audio.items[1].midis, [T, T + 5, T + 8], 'minor cadence iv voicing [T,T+5,T+8]');
    }
  }
  ok(sawMinor, 'melodic-dictation L4 produces A minor sometimes');
}

/* ---------- 8. scale builds agree with Theory ---------- */

for (let i = 0; i < 20; i++) {
  const q = Exercises.generate('scale-build-major', 1 + (i % 4));
  ok(q.answer.length === 8, 'scale-build answer has 8 midis');
  const tonicMidi = q.stimulus.keyboard.highlights[0].midi;
  ok(q.answer[0] === tonicMidi, 'scale starts on highlighted tonic');
  ok(q.answer[7] === tonicMidi + 12, 'scale spans exactly an octave');
  const steps = q.answer.slice(1).map((m, k) => m - q.answer[k]);
  eq(steps, [2, 2, 1, 2, 2, 2, 1], 'major scale step pattern W W H W W W H');
}
{
  const q = Exercises.generate('scale-build-minor', 3);
  const steps = q.answer.slice(1).map((m, k) => m - q.answer[k]);
  eq(steps, [2, 1, 2, 2, 1, 3, 1], 'harmonic minor step pattern');
}
{
  const q = Exercises.generate('scale-build-minor', 4);
  const steps = q.answer.slice(1).map((m, k) => m - q.answer[k]);
  eq(steps, [2, 1, 2, 2, 2, 2, 1], 'melodic minor (asc) step pattern');
}

/* ---------- 9. keysig-id: stimulus matches answer key ---------- */

for (let i = 0; i < 20; i++) {
  const L = 1 + (i % 4);
  const q = Exercises.generate('keysig-id', L);
  const count = q.stimulus.keySigOnly.keySig;
  const expected = Theory.keySig(q.answer, 'major').count;
  ok(count === expected, 'keysig-id stimulus count ' + count + ' matches answer ' + q.answer);
  if (L === 4) ok(q.choices.length === 6, 'keysig-id L4 offers 6 choices');
  ok(q.choices.every((c) => /major/.test(c.label)), 'keysig-id only asks major keys (minors arrive in U7)');
}

/* ---------- 10. staff-to-key: answer is the staff note's midi ---------- */

for (let i = 0; i < 20; i++) {
  const q = Exercises.generate('staff-to-key', 1 + (i % 4));
  ok(Theory.midi(q.stimulus.staff.notes[0]) === q.answer, 'staff-to-key answer midi matches staff note');
}

/* ---------- 11. ear-interval-mel: audio matches answer ---------- */

for (let i = 0; i < 30; i++) {
  const L = 1 + (i % 5);
  const q = Exercises.generate('ear-interval-mel', L);
  const [a, b] = q.stimulus.audio.items;
  const semis = Math.abs(b.midi - a.midi);
  ok(semis === Theory.intervalSemitones(q.answer), 'ear-interval-mel semitones match answer');
  if (L < 5) ok(b.midi > a.midi, 'ear-interval-mel L1–4 ascending');
  ok(q.choices.some((c) => c.id === q.answer), 'ear-interval-mel answer in choices');
}
for (let i = 0; i < 20; i++) {
  const q = Exercises.generate('ear-interval-harm', 1 + (i % 4));
  const it = q.stimulus.audio.items[0];
  ok(it.midis.length === 2 && it.midis[1] - it.midis[0] === Theory.intervalSemitones(q.answer),
    'ear-interval-harm dyad matches answer');
}

/* ---------- 12. ear-degree: played note is the answered degree ---------- */

for (let i = 0; i < 30; i++) {
  const L = 1 + (i % 4);
  const q = Exercises.generate('ear-degree', L);
  const items = q.stimulus.audio.items;
  const noteItem = items[items.length - 1];
  const T = items[5].midi; // lone tonic in cadence
  const offset = noteItem.midi - T;
  const majorOffsets = { 0: 1, 2: 2, 4: 3, 5: 4, 7: 5, 9: 6, 11: 7, 12: 1 };
  ok(String(majorOffsets[offset]) === q.answer, 'ear-degree answer matches played degree (offset ' + offset + ')');
}

/* ---------- 13. triads ---------- */

for (let i = 0; i < 30; i++) {
  const q = Exercises.generate('triad-build', 1 + (i % 4));
  const root = q.stimulus.keyboard.highlights[0].midi;
  ok(q.answer[0] === root, 'triad-build starts on highlighted root');
  const iv = [q.answer[1] - q.answer[0], q.answer[2] - q.answer[0]];
  const shapes = { 'maj': [4, 7], 'min': [3, 7], 'dim': [3, 6], 'aug': [4, 8] };
  ok(Object.values(shapes).some((s) => s[0] === iv[0] && s[1] === iv[1]),
    'triad-build shape is a real triad: ' + iv);
}
for (let i = 0; i < 30; i++) {
  const q = Exercises.generate('triad-id', 1 + (i % 4));
  const midis = q.stimulus.staff.notes.map(Theory.midi);
  const shapes = { maj: [4, 7], min: [3, 7], dim: [3, 6], aug: [4, 8] };
  const s = shapes[q.answer];
  ok(midis[1] - midis[0] === s[0] && midis[2] - midis[0] === s[1],
    'triad-id staff matches answered quality ' + q.answer);
}
for (let i = 0; i < 30; i++) {
  const q = Exercises.generate('inversion-id', 1 + (i % 3));
  const midis = q.stimulus.staff.notes.map(Theory.midi);
  const gaps = [midis[1] - midis[0], midis[2] - midis[1]];
  const expect = { root: [[3, 4]], inv1: [[3, 5], [4, 5]], inv2: [[5, 6], [5, 5]] };
  const okShape =
    (q.answer === 'root' && gaps.every((g) => g === 3 || g === 4)) ||
    (q.answer === 'inv1' && (gaps[1] === 5 || gaps[1] === 6) && (gaps[0] === 3 || gaps[0] === 4)) ||
    (q.answer === 'inv2' && (gaps[0] === 5 || gaps[0] === 6) && (gaps[1] === 3 || gaps[1] === 4));
  ok(okShape, 'inversion-id gaps ' + gaps + ' match ' + q.answer);
}

/* ---------- 14. ear chords ---------- */

for (let i = 0; i < 20; i++) {
  const L = 1 + (i % 4);
  const q = Exercises.generate('ear-triad', L);
  const block = q.stimulus.audio.items[0];
  const shapes = { maj: [4, 7], min: [3, 7], dim: [3, 6], aug: [4, 8] };
  const s = shapes[q.answer];
  ok(block.midis[1] - block.midis[0] === s[0] && block.midis[2] - block.midis[0] === s[1],
    'ear-triad chord matches ' + q.answer);
  if (L === 4) ok(q.stimulus.audio.items.length === 1, 'ear-triad L4 block only');
  else ok(q.stimulus.audio.items.length > 1, 'ear-triad L<4 includes arpeggio');
}
for (let i = 0; i < 15; i++) {
  const q = Exercises.generate('ear-seventh', 1 + (i % 3));
  ok(q.stimulus.audio.items[0].midis.length === 4, 'ear-seventh plays 4-note chord');
}

/* ---------- 15. cadence and progression structure ---------- */

{
  const lengths = { authentic: 4, plagal: 3, half: 3, deceptive: 4 };
  const seen = new Set();
  for (let i = 0; i < 120; i++) {
    const q = Exercises.generate('ear-cadence', 3);
    seen.add(q.answer);
    ok(q.stimulus.audio.items.length === lengths[q.answer],
      'ear-cadence ' + q.answer + ' has ' + lengths[q.answer] + ' chords');
    ok(q.stimulus.audio.items.every((it) => it.midis && it.midis.length === 3), 'ear-cadence all block triads');
  }
  ok(seen.size === 4, 'ear-cadence L3 produces all four types over 120 runs');
}
for (let i = 0; i < 20; i++) {
  const q = Exercises.generate('ear-progression', 1 + (i % 3));
  ok(q.stimulus.audio.items.length === 4, 'ear-progression plays 4 chords');
  ok(q.choices.length >= 3, 'ear-progression has >= 3 choices');
}

/* ---------- 16. rhythm generators ---------- */

function mergedSignature(tiles) {
  const merged = [];
  tiles.forEach((t) => {
    Exercises.tileItems(t, 60).forEach((it) => {
      const last = merged[merged.length - 1];
      if (it.rest && last && last.rest) last.beats += it.beats;
      else merged.push({ n: !it.rest, beats: it.beats });
    });
  });
  return JSON.stringify(merged);
}
for (let i = 0; i < 40; i++) {
  const L = 1 + (i % 4);
  const q = Exercises.generate('rhythm-read', L);
  const bars = L === 4 ? 2 : 1;
  const answerChoice = q.choices.find((c) => c.id === q.answer);
  ok(!!answerChoice, 'rhythm-read answer id present');
  const sums = q.choices.map((c) => c.tiles.reduce((a, t) => a + Exercises.TILES[t].beats, 0));
  ok(sums.every((s) => s === 4 * bars), 'rhythm-read all choices fill ' + 4 * bars + ' beats');
  const sigs = q.choices.map((c) => mergedSignature(c.tiles));
  ok(new Set(sigs).size === q.choices.length, 'rhythm-read choices sound distinct');
  // audio = 4 count-in clicks, the answer tiles, then a continuing beat grid
  // (zero-advance clicks at absolute beats) under the rhythm
  const items = q.stimulus.audio.items;
  ok(items.slice(0, 4).every((it) => it.click), 'rhythm-read 4-click count-in');
  const expected = [];
  answerChoice.tiles.forEach((t) => Exercises.tileItems(t, 67).forEach((it) => expected.push(it)));
  eq(items.slice(4, 4 + expected.length), expected, 'rhythm-read audio matches answer tiles');
  const grid = items.slice(4 + expected.length);
  ok(grid.length === 4 * bars, 'rhythm-read beat grid covers every beat of the bar(s)');
  grid.forEach((g, k) => {
    ok(g.click && g.beats === 0 && g.at === 4 + k, 'rhythm-read grid click ' + k + ' is zero-advance at beat ' + (4 + k));
  });
}
for (let i = 0; i < 40; i++) {
  const L = 1 + (i % 4);
  const q = Exercises.generate('rhythm-dictation', L);
  ok(q.answer.every((t) => q.input.tiles.includes(t)), 'rhythm-dictation answer uses palette tiles');
  for (let k = 1; k < q.answer.length; k++) {
    const rests = ['qr', 'hr'];
    ok(!(rests.includes(q.answer[k]) && rests.includes(q.answer[k - 1])),
      'rhythm-dictation avoids ambiguous adjacent rests');
  }
  ok(!['qr', 'hr'].includes(q.answer[0]), 'rhythm-dictation bar starts with a note');
}

/* ---------- 17. anti-repeat ---------- */

{
  const seen = [];
  for (let i = 0; i < 20; i++) seen.push(Exercises.generate('kb-find-note', 1).answer);
  ok(new Set(seen).size >= 5, 'anti-repeat: variety across 20 generations');
  let immediateRepeats = 0;
  for (let i = 1; i < seen.length; i++) if (seen[i] === seen[i - 1]) immediateRepeats++;
  ok(immediateRepeats === 0, 'anti-repeat: no immediate repeats in kb-find-note L1');
}

/* ---------- 18. enharmonic-match: answer really is enharmonic ---------- */

for (let i = 0; i < 30; i++) {
  const q = Exercises.generate('enharmonic-match', 1 + (i % 3));
  const m = (s) => ((Theory.midi(Theory.N(s + '4')) % 12) + 12) % 12;
  const given = /same as <b>(.+?)<\/b>/.exec(q.prompt)[1]
    .replace(/♯/g, '#').replace(/♭/g, 'b');
  ok(m(given) === m(q.answer), 'enharmonic-match ' + given + ' ~ ' + q.answer);
  q.choices.forEach((c) => {
    if (c.id !== q.answer) ok(m(c.id) !== m(given), 'enharmonic-match decoy ' + c.id + ' not enharmonic');
  });
}

/* ---------- 19. roman-numeral L4 uses natural-minor numerals ---------- */

for (let i = 0; i < 40; i++) {
  const q = Exercises.generate('roman-numeral', 4);
  const deg = parseInt(/degree <b>(\d)<\/b>/.exec(q.prompt)[1], 10);
  const expected = ['i', 'ii°', 'III', 'iv', 'v', 'VI', 'VII'][deg - 1];
  ok(q.answer === expected, 'roman-numeral L4 degree ' + deg + ' -> ' + expected + ' (got ' + q.answer + ')');
}

/* ---------- report ---------- */

console.log(checks + ' checks, ' + failures + ' failures');
if (failures > 0) process.exit(1);
console.log('exercises.test.mjs: ALL PASS');
