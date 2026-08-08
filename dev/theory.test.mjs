import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const T = require('../js/theory.js');

let pass = 0;
let fail = 0;

function ok(cond, msg) {
  if (cond) {
    pass++;
  } else {
    fail++;
    console.error('FAIL: ' + msg);
  }
}

function eq(actual, expected, msg) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  ok(a === e, msg + ' — expected ' + e + ', got ' + a);
}

function throws(fn, msg) {
  let threw = false;
  try { fn(); } catch (e) { threw = true; }
  ok(threw, msg + ' — expected a throw');
}

const asciis = (notes) => notes.map((n) => T.ascii(n));

// ---------- parsing & round trips ----------
eq(T.N('C4'), { l: 'C', a: 0, o: 4 }, 'N(C4)');
eq(T.N('F#3'), { l: 'F', a: 1, o: 3 }, 'N(F#3)');
eq(T.N('Bb5'), { l: 'B', a: -1, o: 5 }, 'N(Bb5)');
eq(T.N('Cbb2'), { l: 'C', a: -2, o: 2 }, 'N(Cbb2)');
eq(T.N('Fx4'), { l: 'F', a: 2, o: 4 }, 'N(Fx4)');
eq(T.N('F##4'), { l: 'F', a: 2, o: 4 }, 'N(F##4)');
eq(T.ascii(T.N('F#3')), 'F#3', 'ascii round-trip F#3');
eq(T.ascii(T.N('Fx4')), 'F##4', 'ascii of double sharp parses back');
eq(T.N(T.ascii(T.N('Cbb2'))), { l: 'C', a: -2, o: 2 }, 'ascii round-trip Cbb2');
throws(() => T.N('H4'), 'N rejects H4');
throws(() => T.N('C#'), 'N rejects missing octave');
throws(() => T.N('hello'), 'N rejects garbage');
throws(() => T.N('C###4'), 'N rejects triple sharp');

eq(T.name(T.N('C#4')), 'C♯4', 'name C#4');
eq(T.name(T.N('Bb3')), 'B♭3', 'name Bb3');
eq(T.name(T.N('C4')), 'C4', 'name natural has no glyph');
eq(T.name(T.N('Fx4')), 'F𝄪4', 'name double sharp');
eq(T.name(T.N('Cbb2')), 'C𝄫2', 'name double flat');
eq(T.nameNoOct(T.N('C#4')), 'C♯', 'nameNoOct C#');
eq(T.nameNoOct(T.N('Eb5')), 'E♭', 'nameNoOct Eb');

// ---------- midi ----------
eq(T.midi(T.N('C4')), 60, 'midi C4=60');
eq(T.midi(T.N('A4')), 69, 'midi A4=69');
eq(T.midi(T.N('Bb3')), 58, 'midi Bb3=58');
eq(T.midi(T.N('C#4')), 61, 'midi C#4=61');
eq(T.midi(T.N('A0')), 21, 'midi A0=21');
eq(T.midi(T.N('C8')), 108, 'midi C8=108');
eq(T.midi(T.N('E#4')), 65, 'midi E#4=65');
eq(T.midi(T.N('Cb5')), 71, 'midi Cb5=71 (octave belongs to letter)');
eq(T.midi(T.N('B#3')), 60, 'midi B#3=60');

// ---------- fromMidi ----------
eq(T.ascii(T.fromMidi(61)), 'C#4', 'fromMidi 61 default sharp');
eq(T.ascii(T.fromMidi(61, 'flat')), 'Db4', 'fromMidi 61 flat');
eq(T.ascii(T.fromMidi(60)), 'C4', 'fromMidi 60 sharp');
eq(T.ascii(T.fromMidi(60, 'flat')), 'C4', 'fromMidi 60 flat');
eq(T.ascii(T.fromMidi(63, 'flat')), 'Eb4', 'fromMidi 63 flat');
eq(T.ascii(T.fromMidi(66)), 'F#4', 'fromMidi 66 sharp');
eq(T.ascii(T.fromMidi(70, 'flat')), 'Bb4', 'fromMidi 70 flat');
eq(T.ascii(T.fromMidi(59)), 'B3', 'fromMidi 59 octave');
eq(T.ascii(T.fromMidi(72)), 'C5', 'fromMidi 72 octave');
{
  let clean = true;
  for (let m = 21; m <= 108; m++) {
    for (const pref of ['sharp', 'flat']) {
      const n = T.fromMidi(m, pref);
      if (Math.abs(n.a) > 1 || T.midi(n) !== m) clean = false;
    }
  }
  ok(clean, 'fromMidi 21..108 never double accidentals and always round-trips');
}

// ---------- intervals: constants, semitones, labels ----------
eq(T.INTERVALS, ['P1', 'm2', 'M2', 'm3', 'M3', 'P4', 'A4', 'd5', 'P5', 'm6', 'M6', 'm7', 'M7', 'P8'], 'INTERVALS list');
const SEMIS = { P1: 0, m2: 1, M2: 2, m3: 3, M3: 4, P4: 5, A4: 6, d5: 6, P5: 7, m6: 8, M6: 9, m7: 10, M7: 11, P8: 12 };
{
  let good = true;
  for (const iv of T.INTERVALS) {
    if (T.intervalSemitones(iv) !== SEMIS[iv]) { good = false; console.error('  bad semitones for ' + iv); }
  }
  ok(good, 'intervalSemitones for all 14');
}
eq(T.intervalSemitones('M3'), 4, 'intervalSemitones M3');
eq(T.intervalLabel('m3'), 'Minor 3rd', 'label m3');
eq(T.intervalLabel('P4'), 'Perfect 4th', 'label P4');
eq(T.intervalLabel('A4'), 'Augmented 4th (tritone)', 'label A4');
eq(T.intervalLabel('d5'), 'Diminished 5th (tritone)', 'label d5');
eq(T.intervalLabel('P8'), 'Octave', 'label P8');
eq(T.intervalLabel('P1'), 'Unison', 'label P1');
eq(T.intervalLabel('M7'), 'Major 7th', 'label M7');

// ---------- transpose spelling ----------
eq(T.ascii(T.transpose(T.N('E4'), 'M3', 1)), 'G#4', 'E4 + M3 = G#4 not Ab4');
eq(T.ascii(T.transpose(T.N('C4'), 'M3', 1)), 'E4', 'C4 + M3 = E4');
eq(T.ascii(T.transpose(T.N('D4'), 'm3', 1)), 'F4', 'D4 + m3 = F4');
eq(T.ascii(T.transpose(T.N('B3'), 'm3', 1)), 'D4', 'B3 + m3 = D4 (octave crossing)');
eq(T.ascii(T.transpose(T.N('F#4'), 'P5', 1)), 'C#5', 'F#4 + P5 = C#5');
eq(T.ascii(T.transpose(T.N('Eb4'), 'P4', 1)), 'Ab4', 'Eb4 + P4 = Ab4');
eq(T.ascii(T.transpose(T.N('C4'), 'A4', 1)), 'F#4', 'C4 + A4 = F#4');
eq(T.ascii(T.transpose(T.N('C4'), 'd5', 1)), 'Gb4', 'C4 + d5 = Gb4');
eq(T.ascii(T.transpose(T.N('B3'), 'm2', 1)), 'C4', 'B3 + m2 = C4');
eq(T.ascii(T.transpose(T.N('C4'), 'P8', 1)), 'C5', 'C4 + P8 = C5');
eq(T.ascii(T.transpose(T.N('C5'), 'M3', -1)), 'Ab4', 'C5 - M3 = Ab4');
eq(T.ascii(T.transpose(T.N('A4'), 'M2', -1)), 'G4', 'A4 - M2 = G4');
eq(T.ascii(T.transpose(T.N('F4'), 'P4', -1)), 'C4', 'F4 - P4 = C4');
eq(T.ascii(T.transpose(T.N('C4'), 'm2', -1)), 'B3', 'C4 - m2 = B3');
eq(T.ascii(T.transpose(T.N('G4'), 'A4', -1)), 'Db4', 'G4 - A4 = Db4');
eq(T.ascii(T.transpose(T.N('C#4'), 'M3', 1)), 'E#4', 'C#4 + M3 = E#4');
eq(T.ascii(T.transpose(T.N('C4'), 'M3')), 'E4', 'transpose default dir is up');

// every interval, up and down, from varied roots; spelling verified via interval()
for (const rootStr of ['C4', 'E4', 'F#3', 'Bb3', 'G4', 'Db4']) {
  const root = T.N(rootStr);
  let good = true;
  for (const iv of T.INTERVALS) {
    const up = T.transpose(root, iv, 1);
    const dn = T.transpose(root, iv, -1);
    if (T.midi(up) - T.midi(root) !== SEMIS[iv]) { good = false; console.error('  midi up ' + iv + ' from ' + rootStr); }
    if (T.midi(root) - T.midi(dn) !== SEMIS[iv]) { good = false; console.error('  midi down ' + iv + ' from ' + rootStr); }
    if (T.interval(root, up).name !== iv) { good = false; console.error('  spelling up ' + iv + ' from ' + rootStr + ' → ' + T.ascii(up)); }
    if (T.interval(dn, root).name !== iv) { good = false; console.error('  spelling down ' + iv + ' from ' + rootStr + ' → ' + T.ascii(dn)); }
  }
  ok(good, 'all 14 intervals up & down from ' + rootStr + ' keep semitones and spelling');
}

// ---------- interval() ----------
eq(T.interval(T.N('C4'), T.N('E4')), { name: 'M3', number: 3, quality: 'M', semitones: 4 }, 'interval C4–E4');
eq(T.interval(T.N('E4'), T.N('C4')).name, 'M3', 'interval order-agnostic');
eq(T.interval(T.N('C4'), T.N('Gb4')).name, 'd5', 'interval C4–Gb4 = d5');
eq(T.interval(T.N('C4'), T.N('F#4')).name, 'A4', 'interval C4–F#4 = A4');
eq(T.interval(T.N('B3'), T.N('C4')).name, 'm2', 'interval B3–C4 = m2');
eq(T.interval(T.N('C4'), T.N('C5')).name, 'P8', 'interval C4–C5 = P8');
eq(T.interval(T.N('C4'), T.N('C4')).name, 'P1', 'interval C4–C4 = P1');
eq(T.interval(T.N('E4'), T.N('Eb4')).name, null, 'chromatic semitone is not one of the 14');
{
  const wide = T.interval(T.N('C4'), T.N('D5'));
  eq(wide.name, null, 'M9 falls back to name null');
  eq(wide.number, 9, 'M9 number');
  eq(wide.semitones, 14, 'M9 semitones');
}

// ---------- scales ----------
eq(asciis(T.scale('C', 'major')), ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'], 'C major');
eq(asciis(T.scale('G', 'major')), ['G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F#5', 'G5'], 'G major has F#');
eq(asciis(T.scale('F', 'major')), ['F4', 'G4', 'A4', 'Bb4', 'C5', 'D5', 'E5', 'F5'], 'F major has Bb');
eq(asciis(T.scale('C#', 'major')), ['C#4', 'D#4', 'E#4', 'F#4', 'G#4', 'A#4', 'B#4', 'C#5'], 'C# major has E# and B#');
eq(asciis(T.scale('Eb', 'natural_minor')), ['Eb4', 'F4', 'Gb4', 'Ab4', 'Bb4', 'Cb5', 'Db5', 'Eb5'], 'Eb natural minor has Cb');
eq(asciis(T.scale('A', 'natural_minor')), ['A4', 'B4', 'C5', 'D5', 'E5', 'F5', 'G5', 'A5'], 'A natural minor');
eq(asciis(T.scale('A', 'harmonic_minor')), ['A4', 'B4', 'C5', 'D5', 'E5', 'F5', 'G#5', 'A5'], 'A harmonic minor has G#');
eq(asciis(T.scale('C', 'melodic_minor')), ['C4', 'D4', 'Eb4', 'F4', 'G4', 'A4', 'B4', 'C5'], 'C melodic minor asc has A and B natural');
eq(asciis(T.scale('F#', 'harmonic_minor')), ['F#4', 'G#4', 'A4', 'B4', 'C#5', 'D5', 'E#5', 'F#5'], 'F# harmonic minor has E#');
eq(asciis(T.scale(T.N('D3'), 'major')), ['D3', 'E3', 'F#3', 'G3', 'A3', 'B3', 'C#4', 'D4'], 'scale accepts a note object with octave');

// every major key: scale spelling agrees exactly with its key signature
for (const k of T.MAJOR_KEYS) {
  const sig = T.keySig(k, 'major');
  const altered = T.scale(k, 'major')
    .slice(0, 7)
    .filter((n) => n.a !== 0)
    .map((n) => n.l + (n.a === 1 ? '#' : n.a === -1 ? 'b' : '?'));
  eq([...altered].sort(), [...sig.accs].sort(), k + ' major scale accidentals match its key signature');
}
// every minor key: natural minor spelling agrees with its key signature
for (const k of T.MINOR_KEYS) {
  const sig = T.keySig(k, 'minor');
  const altered = T.scale(k, 'natural_minor')
    .slice(0, 7)
    .filter((n) => n.a !== 0)
    .map((n) => n.l + (n.a === 1 ? '#' : n.a === -1 ? 'b' : '?'));
  eq([...altered].sort(), [...sig.accs].sort(), k + ' natural minor accidentals match its key signature');
}

// ---------- key signatures ----------
eq(T.keySig('D', 'major'), { count: 2, accs: ['F#', 'C#'] }, 'D major = 2 sharps F# C#');
eq(T.keySig('C', 'major'), { count: 0, accs: [] }, 'C major empty');
eq(T.keySig('F', 'major'), { count: -1, accs: ['Bb'] }, 'F major = 1 flat');
eq(T.keySig('Eb', 'major'), { count: -3, accs: ['Bb', 'Eb', 'Ab'] }, 'Eb major = 3 flats in order');
eq(T.keySig('B', 'major'), { count: 5, accs: ['F#', 'C#', 'G#', 'D#', 'A#'] }, 'B major = 5 sharps in order');
eq(T.keySig('Gb', 'major'), { count: -6, accs: ['Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Cb'] }, 'Gb major = 6 flats ending Cb');
eq(T.keySig('F#', 'major').count, 6, 'F# major = 6 sharps');
eq(T.keySig('A', 'minor'), { count: 0, accs: [] }, 'A minor empty');
eq(T.keySig('B', 'minor'), { count: 2, accs: ['F#', 'C#'] }, 'B minor = 2 sharps');
eq(T.keySig('C#', 'minor').count, 4, 'C# minor = 4 sharps');
eq(T.keySig('G#', 'minor').count, 5, 'G# minor = 5 sharps');
eq(T.keySig('Eb', 'minor'), { count: -6, accs: ['Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Cb'] }, 'Eb minor = 6 flats');
eq(T.keySig('F', 'minor').count, -4, 'F minor = 4 flats');
const MAJ_COUNTS = { C: 0, G: 1, D: 2, A: 3, E: 4, B: 5, 'F#': 6, F: -1, Bb: -2, Eb: -3, Ab: -4, Db: -5, Gb: -6 };
{
  let good = true;
  for (const k of T.MAJOR_KEYS) {
    if (T.keySig(k, 'major').count !== MAJ_COUNTS[k]) { good = false; console.error('  wrong sig count for ' + k + ' major'); }
  }
  ok(good, 'all 13 major key signature counts match circle of fifths');
}
const MIN_COUNTS = { A: 0, E: 1, B: 2, 'F#': 3, 'C#': 4, 'G#': 5, D: -1, G: -2, C: -3, F: -4, Bb: -5, Eb: -6 };
{
  let good = true;
  for (const k of T.MINOR_KEYS) {
    if (T.keySig(k, 'minor').count !== MIN_COUNTS[k]) { good = false; console.error('  wrong sig count for ' + k + ' minor'); }
  }
  ok(good, 'all 12 minor key signature counts match circle of fifths');
}
throws(() => T.keySig('H', 'major'), 'keySig rejects unknown tonic');

eq(T.MAJOR_KEYS, ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb'], 'MAJOR_KEYS');
eq(T.MINOR_KEYS, ['A', 'E', 'B', 'F#', 'C#', 'G#', 'D', 'G', 'C', 'F', 'Bb', 'Eb'], 'MINOR_KEYS');

// ---------- relative keys ----------
eq(T.relativeMinor('Eb'), 'C', 'relative minor of Eb is C');
eq(T.relativeMinor('C'), 'A', 'relative minor of C is A');
eq(T.relativeMinor('G'), 'E', 'relative minor of G is E');
eq(T.relativeMinor('B'), 'G#', 'relative minor of B is G#');
eq(T.relativeMinor('Gb'), 'Eb', 'relative minor of Gb is Eb');
eq(T.relativeMajor('F#'), 'A', 'relative major of F# is A');
eq(T.relativeMajor('A'), 'C', 'relative major of A is C');
eq(T.relativeMajor('Bb'), 'Db', 'relative major of Bb is Db');
eq(T.relativeMajor('G#'), 'B', 'relative major of G# is B');
{
  let good = true;
  for (const k of T.MAJOR_KEYS) {
    if (T.relativeMajor(T.relativeMinor(k)) !== k) { good = false; console.error('  relative round-trip failed for ' + k); }
  }
  ok(good, 'relativeMajor(relativeMinor(k)) round-trips for all 13 major keys');
}
{
  let good = true;
  for (const k of T.MINOR_KEYS) {
    if (T.keySig(k, 'minor').count !== T.keySig(T.relativeMajor(k), 'major').count) {
      good = false; console.error('  relative keys disagree on signature for ' + k + ' minor');
    }
  }
  ok(good, 'relative major and minor share a key signature (all 12 minor keys)');
}

// ---------- triads ----------
eq(T.TRIADS, ['maj', 'min', 'dim', 'aug'], 'TRIADS');
eq(asciis(T.triad('C', 'maj')), ['C4', 'E4', 'G4'], 'C maj');
eq(asciis(T.triad('C', 'aug')), ['C4', 'E4', 'G#4'], 'C aug = C E G#');
eq(asciis(T.triad('F', 'min')), ['F4', 'Ab4', 'C5'], 'F min = F Ab C');
eq(asciis(T.triad('B', 'dim')), ['B4', 'D5', 'F5'], 'B dim = B D F');
eq(asciis(T.triad('Eb', 'maj')), ['Eb4', 'G4', 'Bb4'], 'Eb maj = Eb G Bb');
eq(asciis(T.triad('A', 'min')), ['A4', 'C5', 'E5'], 'A min = A C E');
eq(asciis(T.triad('F#', 'maj')), ['F#4', 'A#4', 'C#5'], 'F# maj = F# A# C#');
eq(asciis(T.triad(T.N('G3'), 'maj')), ['G3', 'B3', 'D4'], 'triad accepts note object root');

// ---------- sevenths ----------
eq(T.SEVENTHS, ['maj7', 'dom7', 'min7', 'm7b5', 'dim7'], 'SEVENTHS');
eq(asciis(T.seventh('F#', 'dom7')), ['F#4', 'A#4', 'C#5', 'E5'], 'F# dom7 = F# A# C# E');
eq(asciis(T.seventh('C', 'maj7')), ['C4', 'E4', 'G4', 'B4'], 'C maj7');
eq(asciis(T.seventh('G', 'dom7')), ['G4', 'B4', 'D5', 'F5'], 'G dom7');
eq(asciis(T.seventh('B', 'm7b5')), ['B4', 'D5', 'F5', 'A5'], 'B m7b5 = B D F A');
eq(asciis(T.seventh('C#', 'dim7')), ['C#4', 'E4', 'G4', 'Bb4'], 'C# dim7 = C# E G Bb');
eq(asciis(T.seventh('D', 'min7')), ['D4', 'F4', 'A4', 'C5'], 'D min7');

// ---------- inversions ----------
{
  const c = T.triad(T.N('C4'), 'maj');
  eq(asciis(T.invert(c, 1)), ['E4', 'G4', 'C5'], 'C maj 1st inversion');
  eq(asciis(T.invert(c, 2)), ['G4', 'C5', 'E5'], 'C maj 2nd inversion');
  eq(asciis(T.invert(c, 0)), ['C4', 'E4', 'G4'], 'inversion 0 unchanged');
  eq(asciis(c), ['C4', 'E4', 'G4'], 'invert does not mutate its input');
}
eq(asciis(T.invert(T.seventh('G', 'dom7'), 3)), ['F5', 'G5', 'B5', 'D6'], 'G dom7 3rd inversion');
eq(asciis(T.invert(T.triad('F', 'min'), 2)), ['C5', 'F5', 'Ab5'], 'F min 2nd inversion');

// ---------- chord labels ----------
eq(T.chordLabel('maj'), 'Major', 'label maj');
eq(T.chordLabel('min'), 'Minor', 'label min');
eq(T.chordLabel('dim'), 'Diminished', 'label dim');
eq(T.chordLabel('aug'), 'Augmented', 'label aug');
eq(T.chordLabel('maj7'), 'Major 7th', 'label maj7');
eq(T.chordLabel('dom7'), 'Dominant 7th', 'label dom7');
eq(T.chordLabel('min7'), 'Minor 7th', 'label min7');
eq(T.chordLabel('m7b5'), 'Half-diminished 7th', 'label m7b5');
eq(T.chordLabel('dim7'), 'Diminished 7th', 'label dim7');

// ---------- diatonic triads ----------
{
  const dc = T.diatonicTriads('C');
  eq(dc.length, 7, 'diatonicTriads returns 7 entries');
  eq(dc.map((d) => d.roman), ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'], 'romans in C');
  eq(dc.map((d) => d.quality), ['maj', 'min', 'min', 'maj', 'maj', 'min', 'dim'], 'qualities in C');
  eq(dc.map((d) => d.degree), [1, 2, 3, 4, 5, 6, 7], 'degrees 1..7');
  eq(T.ascii(dc[4].root), 'G4', 'V of C roots on G');
  eq(asciis(dc[4].notes), ['G4', 'B4', 'D5'], 'V of C = G B D');
  eq(asciis(dc[6].notes), ['B4', 'D5', 'F5'], 'vii° of C = B D F');
}
{
  const dg = T.diatonicTriads('G');
  eq(asciis(dg[3].notes), ['C5', 'E5', 'G5'], 'IV of G = C E G');
  eq(asciis(dg[6].notes), ['F#5', 'A5', 'C6'], 'vii° of G = F# A C');
  eq(dg[1].quality, 'min', 'ii of G is minor');
  eq(T.ascii(dg[1].root), 'A4', 'ii of G roots on A');
  eq(dg[6].roman, 'vii°', 'vii° roman in G');
}
{
  const dd = T.diatonicTriads('D');
  eq(asciis(dd[2].notes), ['F#4', 'A4', 'C#5'], 'iii of D = F# A C#');
}

// ---------- degree names ----------
eq([1, 2, 3, 4, 5, 6, 7].map(T.degreeName),
  ['Tonic', 'Supertonic', 'Mediant', 'Subdominant', 'Dominant', 'Submediant', 'Leading tone'],
  'degreeName 1..7');

// ---------- enharmonics ----------
eq(T.enharmonics(T.N('C#4')).map((n) => T.ascii(n)), ['Db4'], 'C#4 ↔ Db4');
eq(T.enharmonics(T.N('E4')).map((n) => T.ascii(n)), ['Fb4'], 'E4 ↔ Fb4');
eq(T.enharmonics(T.N('F4')).map((n) => T.ascii(n)), ['E#4'], 'F4 ↔ E#4');
eq(T.enharmonics(T.N('B4')).map((n) => T.ascii(n)), ['Cb5'], 'B4 ↔ Cb5 (octave lifts at C)');
eq(T.enharmonics(T.N('C4')).map((n) => T.ascii(n)), ['B#3'], 'C4 ↔ B#3 (octave drops)');
eq(T.enharmonics(T.N('Eb4')).map((n) => T.ascii(n)), ['D#4'], 'Eb4 ↔ D#4');
eq(T.enharmonics(T.N('G4')).map((n) => T.ascii(n)), [], 'G4 has no adjacent-letter enharmonic');
eq(T.enharmonics(T.N('D4')).map((n) => T.ascii(n)), [], 'D4 has no adjacent-letter enharmonic');
{
  let good = true;
  for (let m = 36; m <= 96; m++) {
    for (const pref of ['sharp', 'flat']) {
      for (const e of T.enharmonics(T.fromMidi(m, pref))) {
        if (Math.abs(e.a) > 1 || T.midi(e) !== m) { good = false; }
      }
    }
  }
  ok(good, 'enharmonics keep the midi and never use double accidentals');
}

// ---------- steps ----------
eq(T.step(T.N('E4'), T.N('F4')), 'half', 'E–F is a half step');
eq(T.step(T.N('C4'), T.N('D4')), 'whole', 'C–D is a whole step');
eq(T.step(T.N('F4'), T.N('E4')), 'half', 'step is direction-agnostic');
eq(T.step(T.N('B3'), T.N('C#4')), 'whole', 'B–C# is a whole step');
eq(T.step(T.N('C4'), T.N('E4')), null, 'a third is not a step');
eq(T.step(T.N('C4'), T.N('C4')), null, 'unison is not a step');

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail === 0 ? 0 : 1);
