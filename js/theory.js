(function (global) {
  'use strict';

  const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  const LETTER_SEMIS = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  const LETTER_INDEX = { C: 0, D: 1, E: 2, F: 3, G: 4, A: 5, B: 6 };

  const SHARP = '♯';
  const FLAT = '♭';
  const DSHARP = '\u{1D12A}';
  const DFLAT = '\u{1D12B}';

  const ACC_GLYPH = { '-2': DFLAT, '-1': FLAT, '0': '', '1': SHARP, '2': DSHARP };
  const ACC_ASCII = { '-2': 'bb', '-1': 'b', '0': '', '1': '#', '2': '##' };
  const ACC_VALUE = { '': 0, '#': 1, '##': 2, 'x': 2, 'b': -1, 'bb': -2 };

  const NOTE_RE = /^([A-Ga-g])(##|#|x|bb|b)?(-?\d+)$/;
  const PC_RE = /^([A-Ga-g])(##|#|x|bb|b)?$/;

  const INTERVALS = ['P1', 'm2', 'M2', 'm3', 'M3', 'P4', 'A4', 'd5', 'P5', 'm6', 'M6', 'm7', 'M7', 'P8'];
  const MAJOR_BASE_SEMIS = { 1: 0, 2: 2, 3: 4, 4: 5, 5: 7, 6: 9, 7: 11, 8: 12 };
  const PERFECT_NUMBERS = { 1: true, 4: true, 5: true, 8: true };

  const INTERVAL_LABELS = {
    P1: 'Unison',
    m2: 'Minor 2nd',
    M2: 'Major 2nd',
    m3: 'Minor 3rd',
    M3: 'Major 3rd',
    P4: 'Perfect 4th',
    A4: 'Augmented 4th (tritone)',
    d5: 'Diminished 5th (tritone)',
    P5: 'Perfect 5th',
    m6: 'Minor 6th',
    M6: 'Major 6th',
    m7: 'Minor 7th',
    M7: 'Major 7th',
    P8: 'Octave'
  };

  const SCALE_DEGREES = {
    major: ['P1', 'M2', 'M3', 'P4', 'P5', 'M6', 'M7', 'P8'],
    natural_minor: ['P1', 'M2', 'm3', 'P4', 'P5', 'm6', 'm7', 'P8'],
    harmonic_minor: ['P1', 'M2', 'm3', 'P4', 'P5', 'm6', 'M7', 'P8'],
    melodic_minor: ['P1', 'M2', 'm3', 'P4', 'P5', 'M6', 'M7', 'P8']
  };

  const MAJOR_SIG = {
    C: 0, G: 1, D: 2, A: 3, E: 4, B: 5, 'F#': 6, 'C#': 7,
    F: -1, Bb: -2, Eb: -3, Ab: -4, Db: -5, Gb: -6, Cb: -7
  };
  const MINOR_SIG = {
    A: 0, E: 1, B: 2, 'F#': 3, 'C#': 4, 'G#': 5, 'D#': 6, 'A#': 7,
    D: -1, G: -2, C: -3, F: -4, Bb: -5, Eb: -6, Ab: -7
  };

  const SHARP_ORDER = ['F', 'C', 'G', 'D', 'A', 'E', 'B'];
  const FLAT_ORDER = ['B', 'E', 'A', 'D', 'G', 'C', 'F'];

  const MAJOR_KEYS = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb'];
  const MINOR_KEYS = ['A', 'E', 'B', 'F#', 'C#', 'G#', 'D', 'G', 'C', 'F', 'Bb', 'Eb'];

  const TRIADS = ['maj', 'min', 'dim', 'aug'];
  const TRIAD_INTERVALS = {
    maj: ['P1', 'M3', 'P5'],
    min: ['P1', 'm3', 'P5'],
    dim: ['P1', 'm3', 'd5'],
    aug: ['P1', 'M3', 'A5']
  };

  const SEVENTHS = ['maj7', 'dom7', 'min7', 'm7b5', 'dim7'];
  const SEVENTH_INTERVALS = {
    maj7: ['P1', 'M3', 'P5', 'M7'],
    dom7: ['P1', 'M3', 'P5', 'm7'],
    min7: ['P1', 'm3', 'P5', 'm7'],
    m7b5: ['P1', 'm3', 'd5', 'm7'],
    dim7: ['P1', 'm3', 'd5', 'd7']
  };

  const CHORD_LABELS = {
    maj: 'Major',
    min: 'Minor',
    dim: 'Diminished',
    aug: 'Augmented',
    maj7: 'Major 7th',
    dom7: 'Dominant 7th',
    min7: 'Minor 7th',
    m7b5: 'Half-diminished 7th',
    dim7: 'Diminished 7th'
  };

  const DEGREE_NAMES = ['Tonic', 'Supertonic', 'Mediant', 'Subdominant', 'Dominant', 'Submediant', 'Leading tone'];
  const MAJOR_TRIAD_QUALITIES = ['maj', 'min', 'min', 'maj', 'maj', 'min', 'dim'];
  const MAJOR_ROMANS = ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'];

  const SHARP_PCS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const FLAT_PCS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

  function N(str) {
    if (typeof str !== 'string') throw new Error('Theory.N expects a string, got ' + typeof str);
    const m = NOTE_RE.exec(str.trim());
    if (!m) throw new Error('Cannot parse note: "' + str + '"');
    return { l: m[1].toUpperCase(), a: ACC_VALUE[m[2] || ''], o: parseInt(m[3], 10) };
  }

  // Accepts a note object, 'C#4', or an octave-less name like 'Eb' (octave defaults to 4).
  function toNote(x, defaultOctave) {
    if (x && typeof x === 'object' && typeof x.l === 'string') {
      return { l: x.l, a: x.a | 0, o: x.o | 0 };
    }
    if (typeof x === 'string') {
      const pc = PC_RE.exec(x.trim());
      if (pc) {
        return { l: pc[1].toUpperCase(), a: ACC_VALUE[pc[2] || ''], o: defaultOctave == null ? 4 : defaultOctave };
      }
      return N(x);
    }
    throw new Error('Cannot interpret note: ' + JSON.stringify(x));
  }

  function name(note) {
    const n = toNote(note);
    return n.l + ACC_GLYPH[String(n.a)] + n.o;
  }

  function nameNoOct(note) {
    const n = toNote(note);
    return n.l + ACC_GLYPH[String(n.a)];
  }

  function ascii(note) {
    const n = toNote(note);
    return n.l + ACC_ASCII[String(n.a)] + n.o;
  }

  function asciiNoOct(note) {
    const n = toNote(note);
    return n.l + ACC_ASCII[String(n.a)];
  }

  function midi(note) {
    const n = toNote(note);
    return (n.o + 1) * 12 + LETTER_SEMIS[n.l] + n.a;
  }

  function fromMidi(m, prefer) {
    if (!Number.isInteger(m)) throw new Error('fromMidi expects an integer, got ' + m);
    const table = prefer === 'flat' ? FLAT_PCS : SHARP_PCS;
    const pc = ((m % 12) + 12) % 12;
    const spelled = table[pc];
    return {
      l: spelled[0],
      a: ACC_VALUE[spelled.slice(1)],
      o: Math.floor(m / 12) - 1
    };
  }

  function parseInterval(ivName) {
    const m = /^([PMmAd])(\d+)$/.exec(String(ivName));
    if (!m) throw new Error('Bad interval name: "' + ivName + '"');
    const quality = m[1];
    const number = parseInt(m[2], 10);
    const base = MAJOR_BASE_SEMIS[number];
    if (base === undefined) throw new Error('Interval number out of range: "' + ivName + '"');
    const perfect = !!PERFECT_NUMBERS[number];
    let semis;
    if (quality === 'P') {
      if (!perfect) throw new Error('Interval ' + number + ' has no perfect form');
      semis = base;
    } else if (quality === 'M') {
      if (perfect) throw new Error('Interval ' + number + ' has no major form');
      semis = base;
    } else if (quality === 'm') {
      if (perfect) throw new Error('Interval ' + number + ' has no minor form');
      semis = base - 1;
    } else if (quality === 'A') {
      semis = base + 1;
    } else {
      semis = perfect ? base - 1 : base - 2;
    }
    return { quality: quality, number: number, semitones: semis };
  }

  function intervalSemitones(ivName) {
    return parseInterval(ivName).semitones;
  }

  function intervalLabel(ivName) {
    return INTERVAL_LABELS[ivName] || ivName;
  }

  function transpose(note, ivName, dir) {
    const n = toNote(note);
    const d = dir === -1 ? -1 : 1;
    const iv = parseInterval(ivName);
    const rawIndex = LETTER_INDEX[n.l] + d * (iv.number - 1);
    const letter = LETTERS[((rawIndex % 7) + 7) % 7];
    const octave = n.o + Math.floor(rawIndex / 7);
    const targetMidi = midi(n) + d * iv.semitones;
    const naturalMidi = (octave + 1) * 12 + LETTER_SEMIS[letter];
    return { l: letter, a: targetMidi - naturalMidi, o: octave };
  }

  function diatonicPosition(n) {
    return n.o * 7 + LETTER_INDEX[n.l];
  }

  function interval(a, b) {
    let lo = toNote(a);
    let hi = toNote(b);
    if (midi(hi) < midi(lo) || (midi(hi) === midi(lo) && diatonicPosition(hi) < diatonicPosition(lo))) {
      const t = lo; lo = hi; hi = t;
    }
    const number = diatonicPosition(hi) - diatonicPosition(lo) + 1;
    const semitones = midi(hi) - midi(lo);
    for (let i = 0; i < INTERVALS.length; i++) {
      const iv = parseInterval(INTERVALS[i]);
      if (iv.number === number && iv.semitones === semitones) {
        return { name: INTERVALS[i], number: number, quality: iv.quality, semitones: semitones };
      }
    }
    return { name: null, number: number, semitones: semitones };
  }

  function scale(tonic, type) {
    const degrees = SCALE_DEGREES[type];
    if (!degrees) throw new Error('Unknown scale type: "' + type + '"');
    const root = toNote(tonic);
    return degrees.map(function (iv) { return transpose(root, iv, 1); });
  }

  function keySig(tonicName, mode) {
    const key = asciiNoOct(toNote(tonicName));
    const table = mode === 'major' ? MAJOR_SIG : MINOR_SIG;
    const count = table[key];
    if (count === undefined) {
      throw new Error('No standard key signature for ' + key + ' ' + mode);
    }
    let accs;
    if (count > 0) {
      accs = SHARP_ORDER.slice(0, count).map(function (l) { return l + '#'; });
    } else if (count < 0) {
      accs = FLAT_ORDER.slice(0, -count).map(function (l) { return l + 'b'; });
    } else {
      accs = [];
    }
    return { count: count, accs: accs };
  }

  function relativeMinor(majorTonic) {
    return asciiNoOct(transpose(toNote(majorTonic), 'm3', -1));
  }

  function relativeMajor(minorTonic) {
    return asciiNoOct(transpose(toNote(minorTonic), 'm3', 1));
  }

  function buildChord(root, intervals) {
    const r = toNote(root);
    return intervals.map(function (iv) { return transpose(r, iv, 1); });
  }

  function triad(root, kind) {
    const ivs = TRIAD_INTERVALS[kind];
    if (!ivs) throw new Error('Unknown triad kind: "' + kind + '"');
    return buildChord(root, ivs);
  }

  function seventh(root, kind) {
    const ivs = SEVENTH_INTERVALS[kind];
    if (!ivs) throw new Error('Unknown seventh kind: "' + kind + '"');
    return buildChord(root, ivs);
  }

  function invert(notes, inv) {
    const out = notes.map(function (n) { return toNote(n); });
    const times = ((inv | 0) % out.length + out.length) % out.length;
    for (let i = 0; i < times; i++) {
      const moved = out.shift();
      out.push({ l: moved.l, a: moved.a, o: moved.o + 1 });
    }
    return out;
  }

  function chordLabel(kind) {
    return CHORD_LABELS[kind] || kind;
  }

  function diatonicTriads(tonicName) {
    const notes = scale(tonicName, 'major');
    const out = [];
    for (let i = 0; i < 7; i++) {
      const quality = MAJOR_TRIAD_QUALITIES[i];
      out.push({
        degree: i + 1,
        roman: MAJOR_ROMANS[i],
        quality: quality,
        root: notes[i],
        notes: triad(notes[i], quality)
      });
    }
    return out;
  }

  function degreeName(degree) {
    return DEGREE_NAMES[degree - 1];
  }

  function enharmonics(note) {
    const n = toNote(note);
    const m = midi(n);
    const idx = LETTER_INDEX[n.l];
    const out = [];
    const candidates = [
      { l: LETTERS[(idx + 6) % 7], o: idx === 0 ? n.o - 1 : n.o },
      { l: LETTERS[(idx + 1) % 7], o: idx === 6 ? n.o + 1 : n.o }
    ];
    for (let i = 0; i < candidates.length; i++) {
      const c = candidates[i];
      const a = m - ((c.o + 1) * 12 + LETTER_SEMIS[c.l]);
      if (a >= -1 && a <= 1) out.push({ l: c.l, a: a, o: c.o });
    }
    return out;
  }

  function step(n1, n2) {
    const d = Math.abs(midi(n1) - midi(n2));
    if (d === 1) return 'half';
    if (d === 2) return 'whole';
    return null;
  }

  const Theory = {
    N: N,
    name: name,
    nameNoOct: nameNoOct,
    ascii: ascii,
    midi: midi,
    fromMidi: fromMidi,
    INTERVALS: INTERVALS,
    intervalSemitones: intervalSemitones,
    intervalLabel: intervalLabel,
    transpose: transpose,
    interval: interval,
    scale: scale,
    keySig: keySig,
    MAJOR_KEYS: MAJOR_KEYS,
    MINOR_KEYS: MINOR_KEYS,
    relativeMinor: relativeMinor,
    relativeMajor: relativeMajor,
    TRIADS: TRIADS,
    triad: triad,
    SEVENTHS: SEVENTHS,
    seventh: seventh,
    invert: invert,
    chordLabel: chordLabel,
    diatonicTriads: diatonicTriads,
    degreeName: degreeName,
    enharmonics: enharmonics,
    step: step
  };

  global.Theory = Theory;
  if (typeof module !== 'undefined' && module.exports) module.exports = Theory;
})(typeof window !== 'undefined' ? window : globalThis);
