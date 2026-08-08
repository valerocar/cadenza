(function (global) {
  'use strict';

  const Theory = (typeof window !== 'undefined') ? window.Theory : require('./theory.js');

  /* ================= small utilities ================= */

  function ri(n) { return Math.floor(Math.random() * n); }
  function pick(arr) { return arr[ri(arr.length)]; }
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = ri(i + 1);
      const t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function b(s) { return '<b>' + s + '</b>'; }

  const WHITE_PCS = [0, 2, 4, 5, 7, 9, 11];
  function isWhite(m) { return WHITE_PCS.indexOf(((m % 12) + 12) % 12) !== -1; }
  function whiteMidis(lo, hi) {
    const out = [];
    for (let m = lo; m <= hi; m++) if (isWhite(m)) out.push(m);
    return out;
  }
  function blackMidis(lo, hi) {
    const out = [];
    for (let m = lo; m <= hi; m++) if (!isWhite(m)) out.push(m);
    return out;
  }

  const LETTER_SEQ = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  function letterUp(n) {
    const i = LETTER_SEQ.indexOf(n.l);
    const l = LETTER_SEQ[(i + 1) % 7];
    return { l: l, a: 0, o: l === 'C' ? n.o + 1 : n.o };
  }
  function whiteNotesBetween(loAscii, hiAscii) {
    let cur = Theory.N(loAscii);
    const hiMidi = Theory.midi(Theory.N(hiAscii));
    const out = [];
    while (Theory.midi(cur) <= hiMidi) {
      out.push(cur);
      cur = letterUp(cur);
    }
    return out;
  }
  function sn(note, extra) {
    const o = { l: note.l, a: note.a, o: note.o };
    if (extra) Object.keys(extra).forEach(function (k) { o[k] = extra[k]; });
    return o;
  }
  function midiName(m, prefer) { return Theory.name(Theory.fromMidi(m, prefer || 'sharp')); }

  // answerObj/decoys: {id, label}. Returns {choices, answer} with unique ids/labels.
  function buildChoices(answerObj, decoys, count) {
    const ids = {}; const labels = {};
    ids[answerObj.id] = true; labels[answerObj.label] = true;
    const out = [answerObj];
    const pool = shuffle(decoys);
    for (let i = 0; i < pool.length && out.length < count; i++) {
      const d = pool[i];
      if (ids[d.id] || labels[d.label]) continue;
      ids[d.id] = true; labels[d.label] = true;
      out.push(d);
    }
    return { choices: shuffle(out), answer: answerObj.id };
  }

  /* ================= rhythm tiles ================= */

  const TILES = {
    w: { beats: 4, label: 'Whole note' },
    hd: { beats: 3, label: 'Dotted half note' },
    h: { beats: 2, label: 'Half note' },
    q: { beats: 1, label: 'Quarter note' },
    ee: { beats: 1, label: 'Two eighth notes' },
    qr: { beats: 1, label: 'Quarter rest' },
    hr: { beats: 2, label: 'Half rest' },
    dqe: { beats: 2, label: 'Dotted quarter + eighth' },
    eqe: { beats: 2, label: 'Eighth–quarter–eighth' }
  };

  function tileItems(tileId, midi) {
    switch (tileId) {
      case 'w': return [{ midi: midi, beats: 4 }];
      case 'hd': return [{ midi: midi, beats: 3 }];
      case 'h': return [{ midi: midi, beats: 2 }];
      case 'q': return [{ midi: midi, beats: 1 }];
      case 'ee': return [{ midi: midi, beats: 0.5 }, { midi: midi, beats: 0.5 }];
      case 'qr': return [{ rest: true, beats: 1 }];
      case 'hr': return [{ rest: true, beats: 2 }];
      case 'dqe': return [{ midi: midi, beats: 1.5 }, { midi: midi, beats: 0.5 }];
      case 'eqe': return [{ midi: midi, beats: 0.5 }, { midi: midi, beats: 1 }, { midi: midi, beats: 0.5 }];
      default: throw new Error('Unknown tile: ' + tileId);
    }
  }

  function isRestTile(t) { return t === 'qr' || t === 'hr'; }

  function genBar(palette, beats, maxRests) {
    for (let attempt = 0; attempt < 60; attempt++) {
      const tiles = [];
      let left = beats;
      let rests = 0;
      let stuck = false;
      while (left > 0) {
        const options = palette.filter(function (t) {
          if (TILES[t].beats > left) return false;
          if (!isRestTile(t)) return true;
          if (rests >= maxRests) return false;
          if (tiles.length === 0) return false;
          if (isRestTile(tiles[tiles.length - 1])) return false;
          return true;
        });
        if (!options.length) { stuck = true; break; }
        const t = pick(options);
        tiles.push(t);
        if (isRestTile(t)) rests++;
        left -= TILES[t].beats;
      }
      if (stuck || left !== 0) continue;
      if (!tiles.some(function (t) { return !isRestTile(t); })) continue;
      return tiles;
    }
    return ['q', 'q', 'h'];
  }

  // Aural signature: expanded items with consecutive rests merged, so two tile
  // sequences that SOUND identical share a signature.
  function rhythmSignature(tiles) {
    const merged = [];
    tiles.forEach(function (t) {
      tileItems(t, 60).forEach(function (it) {
        const last = merged[merged.length - 1];
        if (it.rest && last && !last.n) last.beats += it.beats;
        else merged.push({ n: !it.rest, beats: it.beats });
      });
    });
    return JSON.stringify(merged);
  }

  function rhythmAudio(tiles, bpm) {
    const items = [
      { click: 'hi', beats: 1 }, { click: 'lo', beats: 1 },
      { click: 'lo', beats: 1 }, { click: 'lo', beats: 1 }
    ];
    let barBeats = 0;
    tiles.forEach(function (t) {
      tileItems(t, 67).forEach(function (it) { items.push(it); });
      barBeats += TILES[t].beats;
    });
    // The beat grid continues under the rhythm (zero-advance clicks at absolute
    // positions) so rests and long notes can be placed against the count.
    for (let k = 0; k < barBeats; k++) {
      items.push({ click: k % 4 === 0 ? 'hi' : 'lo', beats: 0, at: 4 + k });
    }
    return { items: items, bpm: bpm, autoplay: true };
  }

  function rhythmWords(tiles, barBeats) {
    const parts = [];
    let acc = 0;
    tiles.forEach(function (t) {
      if (barBeats && acc > 0 && acc % barBeats === 0) parts.push('|');
      parts.push(TILES[t].label.toLowerCase() + ' (' + TILES[t].beats + ')');
      acc += TILES[t].beats;
    });
    return parts.join(' · ').replace(/ · \| · /g, ' | ');
  }

  /* ================= canonical cadence (U11/U12) ================= */

  // T = tonic midi. Chords: I, IV(64-ish), V(leading tone below), I — then
  // rest, tonic alone, rest. All tones within T-1 .. T+12.
  function cadenceItems(T, mode) {
    const third = mode === 'minor' ? 3 : 4;
    const iv = mode === 'minor' ? [T, T + 5, T + 8] : [T, T + 5, T + 9];
    const one = [T, T + third, T + 7];
    return [
      { midis: one.slice(), beats: 1 },
      { midis: iv, beats: 1 },
      { midis: [T - 1, T + 2, T + 7], beats: 1 },
      { midis: one.slice(), beats: 1 },
      { rest: true, beats: 1 },
      { midi: T, beats: 1 },
      { rest: true, beats: 1 }
    ];
  }

  /* ================= shared vocab ================= */

  const SOLFEGE = ['Do', 'Re', 'Mi', 'Fa', 'Sol', 'La', 'Ti'];

  const WHITE_HINT = {
    C: 'just left of the two-black-key group',
    D: 'between the two black keys',
    E: 'just right of the two-black-key group',
    F: 'just left of the three-black-key group',
    G: 'between the first and second of the three black keys',
    A: 'between the second and third of the three black keys',
    B: 'just right of the three-black-key group'
  };

  const IV_CHAR = {
    m2: 'the tight, crunchy half step', M2: 'a plain whole step',
    m3: 'small and dark', M3: 'small and bright',
    P4: 'open, with a slight pull home', A4: 'the restless tritone',
    d5: 'the restless tritone', P5: 'wide open and stable',
    m6: 'wide and bittersweet', M6: 'wide and warm',
    m7: 'a big reach that wants to fall back', M7: 'a sharp lean into the octave',
    P8: 'the same note, an octave apart', P1: 'the same note repeated'
  };

  const CHORD_CHAR = {
    maj: 'bright and settled', min: 'dark but settled',
    dim: 'tight and tense — two stacked minor 3rds',
    aug: 'dreamlike and unresolved — two equal major 3rds',
    maj7: 'lush and floating', dom7: 'bluesy, pulling toward resolution',
    min7: 'mellow and rounded', m7b5: 'shadowy, unstable tension',
    dim7: 'maximum tension, evenly stacked minor 3rds'
  };

  const CLEF_INFO = {
    treble: { bottom: 'E4', lines: 'E–G–B–D–F', spaces: 'F–A–C–E' },
    bass: { bottom: 'G2', lines: 'G–B–D–F–A', spaces: 'A–C–E–G' }
  };
  function diatonicIndex(n) { return n.o * 7 + LETTER_SEQ.indexOf(n.l); }
  function staffPosDesc(note, clef) {
    const info = CLEF_INFO[clef];
    const pos = diatonicIndex(note) - diatonicIndex(Theory.N(info.bottom));
    let where;
    if (pos < -1) {
      where = pos % 2 === 0
        ? 'below the staff on a ledger line'
        : 'below the staff, in the space between ledger lines';
    } else if (pos === -1) where = 'just below the bottom line';
    else if (pos > 9) {
      where = pos % 2 === 0
        ? 'above the staff on a ledger line'
        : 'above the staff, in the space between ledger lines';
    } else if (pos === 9) where = 'just above the top line';
    else if (pos % 2 === 0) where = 'on line ' + (pos / 2 + 1) + ' (lines: ' + info.lines + ')';
    else where = 'in space ' + ((pos + 1) / 2) + ' (spaces: ' + info.spaces + ')';
    if (Theory.midi(note) === 60 && note.a === 0) where += ' — middle C';
    return where;
  }

  /* ================= levels ================= */

  const LEVELS = {
    'kb-find-note': ['white keys, one octave', 'white keys, C3–C6', 'sharps', 'flats'],
    'kb-name-note': ['white keys, one octave', 'adds octave numbers', 'black keys as sharps', 'sharp or flat spelling'],
    'staff-id-treble': ['inside the staff', 'adds ledger notes', 'more ledger lines'],
    'staff-id-bass': ['inside the staff', 'adds ledger notes', 'more ledger lines'],
    'staff-to-key': ['treble, in-staff', 'bass, in-staff', 'both clefs + ledger', 'adds accidentals'],
    'step-id': ['natural notes', 'adds accidentals', 'on the keyboard'],
    'accidental-apply': ['half steps', 'named sharps & flats', 'flat-side neighbors', 'whole steps'],
    'enharmonic-match': ['black keys', 'adds E♯, F♭, B♯, C♭', 'both directions'],
    'scale-build-major': ['C, G, F', 'adds D, A, B♭, E♭', 'adds E, B, A♭, D♭', 'adds F♯, C♯, G♭'],
    'keysig-id': ['0–2 accidentals', '3–4 accidentals', '5–6 accidentals', 'the full circle'],
    'scale-degree-id': ['degree → note', 'note → degree', 'degree names'],
    'interval-size': ['treble clef', 'adds bass clef', 'stacked (harmonic)'],
    'interval-quality': ['perfect vs major', 'adds minor', 'adds tritones', 'all intervals'],
    'interval-build': ['2nds & 3rds up', 'adds 4ths, 5ths, tritone', 'adds 6ths to octave', 'up or down'],
    'ear-interval-mel': ['M2, M3, P5, P8', 'adds m2, m3, P4', 'adds 6ths', 'adds 7ths & tritone', 'up or down'],
    'ear-interval-harm': ['four distinct colors', 'adds four more', 'adds 6ths, 7ths, tritone', 'all intervals'],
    'scale-build-minor': ['natural: A, E, D', 'natural: six keys', 'harmonic minor', 'melodic minor (asc.)'],
    'relative-keys': ['0–2 accidentals', 'all keys', 'from the key signature'],
    'ear-major-minor': ['full scale', 'chord', 'short melody', 'harmonic-minor twists'],
    'triad-id': ['maj vs min, white roots', 'any root', 'adds diminished', 'adds augmented'],
    'triad-build': ['major, white roots', 'minor, white roots', 'any root', 'dim & aug'],
    'inversion-id': ['major: C, F, G', 'any major or minor', 'wider range'],
    'ear-triad': ['major vs minor', 'adds diminished', 'adds augmented', 'block chord only'],
    'ear-inversion': ['major triads', 'adds minor', 'block chord only'],
    'ear-seventh': ['dom7, maj7, min7', 'adds half-diminished', 'adds diminished 7th'],
    'rhythm-math': ['whole, half, quarter', 'dotted notes', 'time signatures', 'mixed values'],
    'rhythm-read': ['whole, half, quarter', 'adds eighth pairs', 'adds rests', 'two bars'],
    'rhythm-dictation': ['whole, half, quarter', 'adds eighth pairs', 'adds rests', 'dots & syncopation'],
    'ear-degree': ['Do, Mi, Sol', 'degrees 1–5', 'all degrees', 'any key'],
    'melodic-dictation': ['3 notes, stepwise', '4–5 notes, adds 3rds', '5–6 notes, triad leaps', '7–8 notes, minor too'],
    'roman-numeral': ['degree → chord', 'from the staff', 'numeral → chord', 'minor keys'],
    'ear-cadence': ['authentic, plagal, half', 'minor keys too', 'adds deceptive'],
    'ear-progression': ['two classics', 'four progressions', 'minor progressions']
  };

  const GEN = {};

  /* ================= U1 — keyboard geography ================= */

  function whiteKeyExplain(note, withOctave) {
    const base = Theory.nameNoOct(note) + ' sits ' + WHITE_HINT[note.l];
    return withOctave
      ? base + '; octave numbers change at each C, and C4 is middle C.'
      : base + '.';
  }
  function blackKeyExplain(note) {
    if (note.a === 1) {
      return Theory.name(note) + ' is the black key just right of ' + note.l + note.o +
        ' — a sharp raises a note by a half step.';
    }
    return Theory.name(note) + ' is the black key just left of ' + note.l + note.o +
      ' — a flat lowers a note by a half step.';
  }

  GEN['kb-find-note'] = function (L) {
    let m, range;
    if (L === 1) { range = ['C4', 'C5']; m = pick(whiteMidis(60, 71)); }
    else if (L === 2) { range = ['C3', 'C6']; m = pick(whiteMidis(48, 83)); }
    else { range = ['C3', 'C6']; m = pick(blackMidis(49, 83)); }
    const prefer = L === 4 ? 'flat' : 'sharp';
    const note = Theory.fromMidi(m, prefer);
    const explain = L <= 2 ? whiteKeyExplain(note, L === 2) : blackKeyExplain(note);
    return {
      prompt: 'Find ' + b(Theory.name(note)) + ' on the keyboard.',
      input: { kind: 'key', range: range },
      answer: m,
      explain: explain,
      antiKey: 'm' + m
    };
  };

  GEN['kb-name-note'] = function (L) {
    let m, kbRange, answerObj, decoys, prompt, explain;
    if (L === 1 || L === 2) {
      if (L === 1) { kbRange = ['C4', 'C5']; m = pick(whiteMidis(60, 71)); }
      else {
        // L2 shows octave-numbered choices; the session labels the C keys as
        // anchors, so C itself is never the target (the label would answer it).
        kbRange = ['C3', 'C6'];
        m = pick(whiteMidis(48, 83).filter(function (w) { return w % 12 !== 0; }));
      }
      const note = Theory.fromMidi(m, 'sharp');
      const label = L === 1 ? note.l : Theory.name(note);
      answerObj = { id: label, label: label };
      decoys = [];
      if (L === 1) {
        LETTER_SEQ.forEach(function (l) { if (l !== note.l) decoys.push({ id: l, label: l }); });
      } else {
        LETTER_SEQ.forEach(function (l) {
          [note.o - 1, note.o, note.o + 1].forEach(function (o) {
            if (o < 2 || o > 6) return;
            const nm = l + o;
            if (nm !== label) decoys.push({ id: nm, label: nm });
          });
        });
      }
      prompt = 'Which note is the highlighted key?';
      explain = whiteKeyExplain(note, L === 2);
    } else {
      kbRange = ['C3', 'C6'];
      m = pick(blackMidis(49, 83));
      const prefer = L === 3 ? 'sharp' : pick(['sharp', 'flat']);
      const note = Theory.fromMidi(m, prefer);
      const label = Theory.name(note);
      answerObj = { id: Theory.ascii(note), label: label };
      decoys = [];
      blackMidis(Math.max(37, m - 14), Math.min(95, m + 14)).forEach(function (bm) {
        if (bm === m) return;
        const spellings = L === 3 ? ['sharp'] : ['sharp', 'flat'];
        spellings.forEach(function (p) {
          const dn = Theory.fromMidi(bm, p);
          decoys.push({ id: Theory.ascii(dn), label: Theory.name(dn) });
        });
      });
      if (L === 3) {
        prompt = 'Which note is the highlighted key? (sharp names)';
        explain = blackKeyExplain(note);
      } else {
        const word = prefer === 'flat' ? 'flat' : 'sharp';
        const other = Theory.fromMidi(m, prefer === 'flat' ? 'sharp' : 'flat');
        prompt = 'Name the highlighted key, spelled as a ' + b(word) + '.';
        explain = 'Spelled as a ' + word + ', this key is ' + label +
          ' — the same key can also be written ' + Theory.name(other) + '.';
      }
    }
    const built = buildChoices(answerObj, decoys, 4);
    return {
      prompt: prompt,
      stimulus: { keyboard: { range: kbRange, highlights: [{ midi: m, cls: 'target' }] } },
      input: { kind: 'choices' },
      choices: built.choices,
      answer: built.answer,
      explain: explain,
      antiKey: 'm' + m + '-' + built.answer
    };
  };

  /* ================= U2 — reading the staff ================= */

  const STAFF_POOLS = {
    treble: { 1: ['E4', 'F5'], 2: ['C4', 'A5'], 3: ['A3', 'C6'] },
    bass: { 1: ['G2', 'A3'], 2: ['E2', 'C4'], 3: ['C2', 'E4'] }
  };

  function staffIdGen(clef) {
    return function (L) {
      const span = STAFF_POOLS[clef][L];
      const note = pick(whiteNotesBetween(span[0], span[1]));
      const withOct = L >= 2;
      const label = withOct ? Theory.name(note) : note.l;
      const decoys = [];
      if (withOct) {
        LETTER_SEQ.forEach(function (l) {
          [note.o - 1, note.o, note.o + 1].forEach(function (o) {
            const nm = l + o;
            if (nm !== label) decoys.push({ id: nm, label: nm });
          });
        });
      } else {
        LETTER_SEQ.forEach(function (l) { if (l !== note.l) decoys.push({ id: l, label: l }); });
      }
      const answerObj = { id: label, label: label };
      const built = buildChoices(answerObj, decoys, 4);
      return {
        prompt: 'Name the note on the ' + clef + ' staff.',
        stimulus: { staff: { clef: clef, notes: [sn(note, { dur: 'q' })] } },
        input: { kind: 'choices' },
        choices: built.choices,
        answer: built.answer,
        explain: Theory.name(note) + ' sits ' + staffPosDesc(note, clef) + '.',
        antiKey: clef + Theory.ascii(note)
      };
    };
  }
  GEN['staff-id-treble'] = staffIdGen('treble');
  GEN['staff-id-bass'] = staffIdGen('bass');

  GEN['staff-to-key'] = function (L) {
    let clef, span, range;
    if (L === 1) { clef = 'treble'; span = STAFF_POOLS.treble[1]; range = ['C4', 'C6']; }
    else if (L === 2) { clef = 'bass'; span = STAFF_POOLS.bass[1]; range = ['C2', 'C4']; }
    else {
      clef = pick(['treble', 'bass']);
      span = STAFF_POOLS[clef][3];
      range = ['C2', 'C6'];
    }
    let note = pick(whiteNotesBetween(span[0], span[1]));
    if (L === 4) {
      for (let tries = 0; tries < 12; tries++) {
        const cand = sn(pick(whiteNotesBetween(span[0], span[1])));
        cand.a = pick([-1, 1]);
        const m = Theory.midi(cand);
        if (m >= 36 && m <= 84) { note = cand; break; }
      }
      if (note.a === 0) { note = sn(note); note.a = 1; }
    }
    const m = Theory.midi(note);
    return {
      prompt: 'Press the key that matches the written note.',
      stimulus: { staff: { clef: clef, notes: [sn(note, { dur: 'q' })] } },
      input: { kind: 'key', range: range },
      answer: m,
      explain: 'The note is ' + Theory.name(note) + ' — ' + staffPosDesc(note, clef) +
        ' in the ' + clef + ' clef.',
      antiKey: clef + Theory.ascii(note)
    };
  };

  /* ================= U3 — accidentals & steps ================= */

  const STEP_CHOICES = [
    { id: 'half', label: 'Half step' },
    { id: 'whole', label: 'Whole step' }
  ];

  GEN['step-id'] = function (L) {
    if (L === 3) {
      const m1 = 50 + ri(30);
      const d = pick([1, 2]);
      const m2 = m1 + d;
      const step = d === 1 ? 'half' : 'whole';
      return {
        prompt: 'The two highlighted keys are how far apart?',
        stimulus: { keyboard: { range: ['C3', 'C6'], highlights: [
          { midi: m1, cls: 'accent' }, { midi: m2, cls: 'accent' }
        ] } },
        input: { kind: 'choices' },
        choices: STEP_CHOICES,
        answer: step,
        explain: step === 'half'
          ? 'They are neighbors with no key between them — a half step.'
          : 'One key sits between them — two half steps make a whole step.',
        antiKey: 'k' + m1 + '-' + m2
      };
    }
    let n1, n2, step;
    for (let tries = 0; tries < 40; tries++) {
      n1 = sn(pick(whiteNotesBetween('E4', 'E5')));
      n2 = letterUp(n1);
      if (L === 2) {
        if (ri(2) === 0) n1.a = pick([-1, 1]); else n2.a = pick([-1, 1]);
      }
      step = Theory.step(n1, n2);
      if (step) break;
    }
    if (!step) { n1 = Theory.N('E4'); n2 = Theory.N('F4'); step = 'half'; }
    const names = Theory.nameNoOct(n1) + ' to ' + Theory.nameNoOct(n2);
    return {
      prompt: 'Is this a half step or a whole step?',
      stimulus: { staff: { clef: 'treble', notes: [sn(n1, { dur: 'q' }), sn(n2, { dur: 'q' })], gap: 'wide' } },
      input: { kind: 'choices' },
      choices: STEP_CHOICES,
      answer: step,
      explain: step === 'half'
        ? names + ' is one half step — the smallest distance in Western music.'
        : names + ' is a whole step — two half steps.',
      antiKey: Theory.ascii(n1) + Theory.ascii(n2)
    };
  };

  GEN['accidental-apply'] = function (L) {
    const range = ['C3', 'C6'];
    if (L === 1 || L === 4) {
      const size = L === 1 ? 1 : 2;
      const word = size === 1 ? 'half step' : 'whole step';
      const dir = pick([1, -1]);
      const m = 50 + ri(31);
      const answer = m + dir * size;
      return {
        prompt: 'Press the key one ' + b(word) + ' ' + b(dir === 1 ? 'above' : 'below') +
          ' the highlighted key.',
        stimulus: { keyboard: { range: range, highlights: [{ midi: m, cls: 'target' }] } },
        input: { kind: 'key', range: range },
        answer: answer,
        explain: size === 1
          ? 'A half step is the very next key in that direction — ' + midiName(answer) + '.'
          : 'A whole step skips exactly one key: two half steps ' +
            (dir === 1 ? 'up' : 'down') + ' lands on ' + midiName(answer) + '.',
        antiKey: 'm' + m + 'd' + (dir * size)
      };
    }
    if (L === 2) {
      let note;
      for (let tries = 0; tries < 30; tries++) {
        note = { l: pick(LETTER_SEQ), a: pick([-1, 1]), o: pick([3, 4, 5]) };
        const m = Theory.midi(note);
        if (m >= 48 && m <= 84) break;
      }
      const m = Theory.midi(note);
      const base = note.l + note.o;
      return {
        prompt: 'Press ' + b(Theory.name(note)) + '.',
        input: { kind: 'key', range: range },
        answer: m,
        meta: { answerNames: [Theory.name(note)], preferAcc: note.a < 0 ? 'flat' : 'sharp' },
        explain: note.a === 1
          ? Theory.name(note) + ' is one half step above ' + base +
            (isWhite(m) ? ' — here that lands on a white key.' : ' — the black key just to its right.')
          : Theory.name(note) + ' is one half step below ' + base +
            (isWhite(m) ? ' — here that lands on a white key.' : ' — the black key just to its left.'),
        antiKey: Theory.ascii(note)
      };
    }
    const bm = pick(blackMidis(50, 82));
    const note = Theory.fromMidi(bm, 'flat');
    const dir = pick([1, -1]);
    const answer = bm + dir;
    return {
      prompt: 'Press the key one half step ' + b(dir === 1 ? 'above' : 'below') + ' ' +
        b(Theory.name(note)) + '.',
      input: { kind: 'key', range: range },
      answer: answer,
      explain: Theory.name(note) + ' is a black key; its half-step neighbor ' +
        (dir === 1 ? 'above' : 'below') + ' is ' + midiName(answer, 'flat') + '.',
      antiKey: 'b' + bm + 'd' + dir
    };
  };

  const ENH_PAIRS_BLACK = [['C#', 'Db'], ['D#', 'Eb'], ['F#', 'Gb'], ['G#', 'Ab'], ['A#', 'Bb']];
  const ENH_PAIRS_NAT = [['E#', 'F'], ['Fb', 'E'], ['B#', 'C'], ['Cb', 'B']];

  GEN['enharmonic-match'] = function (L) {
    let pairs = ENH_PAIRS_BLACK.map(function (p) { return pick([p, [p[1], p[0]]]); });
    if (L >= 2) pairs = pairs.concat(ENH_PAIRS_NAT);
    if (L === 3) pairs = pairs.concat(ENH_PAIRS_NAT.map(function (p) { return [p[1], p[0]]; }));
    const pair = pick(pairs);
    const given = Theory.N(pair[0] + '4');
    const ans = Theory.N(pair[1] + '4');
    const answerObj = { id: pair[1], label: Theory.nameNoOct(ans) };
    const givenMidiPc = ((Theory.midi(given) % 12) + 12) % 12;
    const decoys = [];
    LETTER_SEQ.forEach(function (l) {
      [-1, 0, 1].forEach(function (a) {
        const n = { l: l, a: a, o: 4 };
        if (((Theory.midi(n) % 12) + 12) % 12 === givenMidiPc) return;
        decoys.push({ id: Theory.ascii(n).slice(0, -1), label: Theory.nameNoOct(n) });
      });
    });
    const built = buildChoices(answerObj, decoys, 4);
    const isNatPair = pair.some(function (x) { return x.length === 1; });
    return {
      prompt: 'Which note is enharmonically the same as ' + b(Theory.nameNoOct(given)) + '?',
      input: { kind: 'choices' },
      choices: built.choices,
      answer: built.answer,
      explain: isNatPair
        ? Theory.nameNoOct(given) + ' and ' + Theory.nameNoOct(ans) +
          ' share one key: those two letters sit a half step apart with no black key between.'
        : Theory.nameNoOct(given) + ' and ' + Theory.nameNoOct(ans) +
          ' name the same black key — one approaches from below, the other from above.',
      antiKey: pair[0]
    };
  };

  /* ================= U4 — major scales & key signatures ================= */

  function tonicMidiFor(pcName, lo, hi) {
    const opts = [];
    for (let o = 2; o <= 6; o++) {
      const m = Theory.midi(Theory.N(pcName + o));
      if (m >= lo && m <= hi) opts.push(m);
    }
    return opts.length ? pick(opts) : null;
  }
  function noteAt(pcName, midi) {
    const probe = Theory.N(pcName + '4');
    const o = 4 + Math.round((midi - Theory.midi(probe)) / 12);
    return Theory.N(pcName + o);
  }
  function scaleExplain(tonicPc, type, notes) {
    const pattern = {
      major: 'W–W–H–W–W–W–H',
      natural_minor: 'W–H–W–W–H–W–W',
      harmonic_minor: 'W–H–W–W–H–W½–H',
      melodic_minor: 'W–H–W–W–W–W–H'
    }[type];
    const names = notes.map(function (n) { return Theory.nameNoOct(n); }).join('–');
    const typeName = {
      major: 'major', natural_minor: 'natural minor',
      harmonic_minor: 'harmonic minor', melodic_minor: 'melodic minor (ascending)'
    }[type];
    return tonicPc + ' ' + typeName + ' = ' + names + ' — the step pattern ' + pattern + '.';
  }

  function scaleBuildGen(minor) {
    return function (L) {
      let tonicPc, type;
      if (minor) {
        tonicPc = pick(L === 1 ? ['A', 'E', 'D'] : ['A', 'E', 'B', 'D', 'G', 'C']);
        type = L <= 2 ? 'natural_minor' : (L === 3 ? 'harmonic_minor' : 'melodic_minor');
      } else {
        tonicPc = pick([['C', 'G', 'F'], ['D', 'A', 'Bb', 'Eb'], ['E', 'B', 'Ab', 'Db'], ['F#', 'C#', 'Gb']][L - 1]);
        type = 'major';
      }
      const T = tonicMidiFor(tonicPc, 48, 72);
      const tonic = noteAt(tonicPc, T);
      const notes = Theory.scale(tonic, type);
      const midis = notes.map(Theory.midi);
      const pretty = Theory.nameNoOct(tonic);
      const typeWord = minor
        ? { natural_minor: 'natural minor', harmonic_minor: 'harmonic minor', melodic_minor: 'melodic minor (ascending)' }[type]
        : 'major';
      return {
        prompt: 'Build the ' + b(pretty + ' ' + typeWord) + ' scale, tonic to tonic, starting on the highlighted key.',
        stimulus: { keyboard: { range: ['C3', 'C6'], highlights: [{ midi: T, cls: 'target' }] } },
        input: { kind: 'keys', count: 8, ordered: true, range: ['C3', 'C6'] },
        answer: midis,
        explain: scaleExplain(pretty, type, notes),
        meta: {
          answerNames: notes.map(function (n) { return Theory.name(n); }),
          preferAcc: notes.some(function (n) { return n.a < 0; }) ? 'flat' : 'sharp'
        },
        antiKey: tonicPc + type + T
      };
    };
  }
  GEN['scale-build-major'] = scaleBuildGen(false);
  GEN['scale-build-minor'] = scaleBuildGen(true);

  function keysigPool(L) {
    const bySize = function (lo, hi) {
      return Theory.MAJOR_KEYS.filter(function (k) {
        const c = Math.abs(Theory.keySig(k, 'major').count);
        return c >= lo && c <= hi;
      });
    };
    if (L === 1) return bySize(0, 2);
    if (L === 2) return bySize(3, 4);
    if (L === 3) return bySize(5, 6);
    return Theory.MAJOR_KEYS.slice();
  }
  function sigWord(count) {
    if (count === 0) return 'no sharps or flats';
    const n = Math.abs(count);
    return n + ' ' + (count > 0 ? (n === 1 ? 'sharp' : 'sharps') : (n === 1 ? 'flat' : 'flats'));
  }
  function prettyKey(asciiPc) { return Theory.nameNoOct(Theory.N(asciiPc + '4')); }

  GEN['keysig-id'] = function (L) {
    const key = pick(keysigPool(L));
    const sig = Theory.keySig(key, 'major');
    const clef = pick(['treble', 'bass']);
    let answerObj, decoys, prompt, explain;
    {
      answerObj = { id: key, label: prettyKey(key) + ' major' };
      decoys = Theory.MAJOR_KEYS.filter(function (k) {
        if (L === 4) return true;
        return Math.abs(Theory.keySig(k, 'major').count - sig.count) <= 3;
      }).map(function (k) { return { id: k, label: prettyKey(k) + ' major' }; });
      prompt = 'Which ' + b('major') + ' key has this signature?';
      if (sig.count > 0) {
        const last = sig.accs[sig.accs.length - 1];
        explain = sigWord(sig.count) + ' — a half step up from the last sharp (' +
          prettyKey(last) + ') names the key: ' + prettyKey(key) + ' major.';
      } else if (sig.count < -1) {
        const secondLast = sig.accs[sig.accs.length - 2];
        explain = sigWord(sig.count) + ' — the second-to-last flat names the key: ' +
          prettyKey(secondLast) + ' major.';
      } else if (sig.count === -1) {
        explain = 'One flat (B♭) is F major — the one flat key to memorize.';
      } else {
        explain = 'No sharps or flats — that is C major.';
      }
    }
    const built = buildChoices(answerObj, decoys, L === 4 ? 6 : 4);
    return {
      prompt: prompt,
      stimulus: { keySigOnly: { clef: clef, keySig: sig.count } },
      input: { kind: 'choices' },
      choices: built.choices,
      answer: built.answer,
      explain: explain,
      antiKey: key + 'M' + clef
    };
  };

  GEN['scale-degree-id'] = function (L) {
    const key = pick(Theory.MAJOR_KEYS);
    const tonic = Theory.N(key + '4');
    const scaleNotes = Theory.scale(tonic, 'major');
    const d = 2 + ri(6);
    const target = scaleNotes[d - 1];
    const pcOf = function (n) { return Theory.nameNoOct(n); };
    const idOf = function (n) { return Theory.ascii(n).slice(0, -String(n.o).length); };
    const walk = scaleNotes.slice(0, d).map(pcOf).join('–');
    const explain = 'Count up ' + prettyKey(key) + ' major from ' + pcOf(tonic) + ': ' + walk +
      ' — degree ' + d + ' is ' + pcOf(target) + ', the ' + Theory.degreeName(d).toLowerCase() + '.';
    let prompt, answerObj, decoys;
    if (L === 2) {
      prompt = 'In ' + b(prettyKey(key) + ' major') + ', ' + b(pcOf(target)) + ' is which scale degree?';
      answerObj = { id: String(d), label: d + ' — ' + Theory.degreeName(d) };
      decoys = [];
      for (let i = 1; i <= 7; i++) {
        if (i !== d) decoys.push({ id: String(i), label: i + ' — ' + Theory.degreeName(i) });
      }
    } else {
      prompt = L === 1
        ? 'In ' + b(prettyKey(key) + ' major') + ', which note is degree ' + b(String(d)) + '?'
        : 'Which note is the ' + b(Theory.degreeName(d).toLowerCase()) + ' of ' + b(prettyKey(key) + ' major') + '?';
      answerObj = { id: idOf(target), label: pcOf(target) };
      decoys = scaleNotes.slice(0, 7).map(function (n) { return { id: idOf(n), label: pcOf(n) }; });
    }
    const built = buildChoices(answerObj, decoys, 4);
    return {
      prompt: prompt,
      input: { kind: 'choices' },
      choices: built.choices,
      answer: built.answer,
      explain: explain,
      antiKey: key + 'd' + d + 'L' + L
    };
  };

  /* ================= U5 — intervals ================= */

  const SIZE_LABELS = { 2: '2nd', 3: '3rd', 4: '4th', 5: '5th', 6: '6th', 7: '7th', 8: 'Octave' };

  GEN['interval-size'] = function (L) {
    const clef = L >= 2 ? pick(['treble', 'bass']) : 'treble';
    const size = 2 + ri(7);
    const pool = clef === 'treble' ? whiteNotesBetween('E4', 'F5') : whiteNotesBetween('G2', 'A3');
    const low = pool[ri(Math.max(1, pool.length - (size - 1)))];
    let high = low;
    for (let i = 1; i < size; i++) high = letterUp(high);
    const harmonic = L === 3;
    const answerObj = { id: String(size), label: SIZE_LABELS[size] };
    const decoys = [];
    for (let s = 2; s <= 8; s++) if (s !== size) decoys.push({ id: String(s), label: SIZE_LABELS[s] });
    const built = buildChoices(answerObj, decoys, 4);
    const letters = [];
    let cur = low;
    for (let i = 0; i < size; i++) { letters.push(cur.l); cur = letterUp(cur); }
    return {
      prompt: harmonic ? 'What is the size of this harmonic interval?' : 'What is the size of this interval?',
      stimulus: { staff: { clef: clef, notes: [sn(low, { dur: harmonic ? 'h' : 'q' }), sn(high, { dur: harmonic ? 'h' : 'q' })], chord: harmonic, gap: 'wide' } },
      input: { kind: 'choices' },
      choices: built.choices,
      answer: built.answer,
      explain: 'Count every letter name, both ends included: ' + letters.join('–') + ' — ' +
        size + ' names, so a ' + SIZE_LABELS[size].toLowerCase() + '. Size ignores accidentals.',
      antiKey: clef + Theory.ascii(low) + 's' + size
    };
  };

  const IVQ_SETS = {
    1: ['P1', 'P4', 'P5', 'P8', 'M2', 'M3', 'M6', 'M7'],
    2: ['P1', 'P4', 'P5', 'P8', 'M2', 'M3', 'M6', 'M7', 'm2', 'm3', 'm6', 'm7'],
    3: ['P1', 'P4', 'P5', 'P8', 'M2', 'M3', 'M6', 'M7', 'm2', 'm3', 'm6', 'm7', 'A4', 'd5'],
    4: Theory.INTERVALS.slice()
  };

  GEN['interval-quality'] = function (L) {
    const set = IVQ_SETS[L];
    let root, iv, upper;
    for (let tries = 0; tries < 40; tries++) {
      iv = pick(set);
      if (L === 1) root = Theory.N(pick(['C4', 'F4', 'G4']));
      else if (L === 2) root = sn(pick(whiteNotesBetween('C4', 'B4')));
      else {
        root = sn(pick(whiteNotesBetween('C4', 'B4')));
        root.a = pick([-1, 0, 1]);
      }
      upper = Theory.transpose(root, iv, 1);
      if (Math.abs(upper.a) <= 1 && Math.abs(root.a) <= 1) break;
      upper = null;
    }
    if (!upper) { root = Theory.N('C4'); iv = 'P5'; upper = Theory.transpose(root, iv, 1); }
    const parsed = Theory.interval(root, upper);
    const answerObj = { id: iv, label: Theory.intervalLabel(iv) };
    const decoys = set.filter(function (x) { return x !== iv; })
      .map(function (x) { return { id: x, label: Theory.intervalLabel(x) }; });
    // prefer confusable decoys: same number or same quality
    decoys.sort(function (a, b2) {
      const an = parseInt(a.id.slice(1), 10) === parsed.number ? 0 : 1;
      const bn = parseInt(b2.id.slice(1), 10) === parsed.number ? 0 : 1;
      return (an - bn) || (Math.random() - 0.5);
    });
    const nChoices = L >= 3 ? 5 : 4;
    const built = buildChoices(answerObj, decoys.slice(0, 3).concat(shuffle(decoys.slice(3))), nChoices);
    return {
      prompt: 'Name this interval — quality and size.',
      stimulus: { staff: { clef: 'treble', notes: [sn(root, { dur: 'h' }), sn(upper, { dur: 'h' })], chord: iv !== 'P1', gap: 'wide' } },
      input: { kind: 'choices' },
      choices: built.choices,
      answer: built.answer,
      explain: Theory.nameNoOct(root) + ' to ' + Theory.nameNoOct(upper) + ' spans ' +
        parsed.number + ' letter name' + (parsed.number === 1 ? '' : 's') + ' and ' +
        parsed.semitones + ' half step' + (parsed.semitones === 1 ? '' : 's') + ' — ' +
        Theory.intervalLabel(iv).toLowerCase() + '.',
      antiKey: Theory.ascii(root) + iv
    };
  };

  const IVB_SETS = {
    1: ['m2', 'M2', 'm3', 'M3'],
    2: ['m2', 'M2', 'm3', 'M3', 'P4', 'A4', 'P5'],
    3: ['m2', 'M2', 'm3', 'M3', 'P4', 'A4', 'P5', 'm6', 'M6', 'm7', 'M7', 'P8'],
    4: Theory.INTERVALS.filter(function (x) { return x !== 'P1'; })
  };

  function ivArticle(label) {
    return /^(Octave|Augmented|Unison)/.test(label) ? 'an' : 'a';
  }

  GEN['interval-build'] = function (L) {
    const iv = pick(IVB_SETS[L]);
    const semis = Theory.intervalSemitones(iv);
    const dir = L === 4 ? pick([1, -1]) : 1;
    // Spell both notes properly (the explain teaches spelling, so F + m2 must
    // read G♭, never F♯): pick a root whose transposed spelling stays simple.
    let root = null, upper = null;
    for (let tries = 0; tries < 80 && !root; tries++) {
      const rm = 48 + ri(37);
      if (L === 1 && !isWhite(rm)) continue;
      const tm = rm + dir * semis;
      if (tm < 48 || tm > 84) continue;
      const cands = [Theory.fromMidi(rm, 'sharp'), Theory.fromMidi(rm, 'flat')];
      for (let c = 0; c < cands.length; c++) {
        const u = Theory.transpose(cands[c], iv, dir);
        if (Math.abs(u.a) <= 1) { root = cands[c]; upper = u; break; }
      }
    }
    if (!root) { root = Theory.N('C4'); upper = Theory.transpose(root, iv, dir); }
    const rootMidi = Theory.midi(root);
    const answer = Theory.midi(upper);
    const label = Theory.intervalLabel(iv);
    return {
      prompt: 'Press the note ' + ivArticle(label) + ' ' + b(label) + ' ' +
        b(dir === 1 ? 'above' : 'below') + ' the highlighted key.',
      stimulus: { keyboard: { range: ['C3', 'C6'], highlights: [{ midi: rootMidi, cls: 'target' }] } },
      input: { kind: 'key', range: ['C3', 'C6'] },
      answer: answer,
      explain: (ivArticle(label) === 'an' ? 'An ' : 'A ') + label.toLowerCase() + ' spans ' + semis +
        ' half step' + (semis === 1 ? '' : 's') + ': counting ' +
        (dir === 1 ? 'up' : 'down') + ' from ' + Theory.name(root) + ' lands on ' + Theory.name(upper) + '.',
      meta: { answerNames: [Theory.name(upper)], preferAcc: upper.a < 0 ? 'flat' : 'sharp' },
      antiKey: 'r' + rootMidi + iv + dir
    };
  };

  /* ================= U6 — hearing intervals ================= */

  // Ear sets exclude d5 (aurally identical to A4) so exactly one choice is correct.
  const EAR_MEL_SETS = {
    1: ['M2', 'M3', 'P5', 'P8'],
    2: ['m2', 'M2', 'm3', 'M3', 'P4', 'P5', 'P8'],
    3: ['m2', 'M2', 'm3', 'M3', 'P4', 'P5', 'm6', 'M6', 'P8'],
    4: ['m2', 'M2', 'm3', 'M3', 'P4', 'A4', 'P5', 'm6', 'M6', 'm7', 'M7', 'P8'],
    5: ['m2', 'M2', 'm3', 'M3', 'P4', 'A4', 'P5', 'm6', 'M6', 'm7', 'M7', 'P8']
  };
  const EAR_HARM_SETS = {
    1: ['m2', 'M3', 'P5', 'P8'],
    2: ['m2', 'M2', 'm3', 'M3', 'P4', 'P5', 'M6', 'P8'],
    3: ['m2', 'M2', 'm3', 'M3', 'P4', 'A4', 'P5', 'm6', 'M6', 'm7', 'M7', 'P8'],
    4: ['m2', 'M2', 'm3', 'M3', 'P4', 'A4', 'P5', 'm6', 'M6', 'm7', 'M7', 'P8']
  };

  function intervalChoiceSet(set, answerIv) {
    let list = set;
    if (list.length > 7) {
      const aS = Theory.intervalSemitones(answerIv);
      list = set.slice().sort(function (x, y) {
        return Math.abs(Theory.intervalSemitones(x) - aS) - Math.abs(Theory.intervalSemitones(y) - aS);
      }).slice(0, 7);
    }
    list = list.slice().sort(function (x, y) {
      return Theory.intervalSemitones(x) - Theory.intervalSemitones(y);
    });
    return list.map(function (x) { return { id: x, label: Theory.intervalLabel(x) }; });
  }

  GEN['ear-interval-mel'] = function (L) {
    const set = EAR_MEL_SETS[L];
    const iv = pick(set);
    const semis = Theory.intervalSemitones(iv);
    const desc = L === 5 && ri(2) === 0;
    const root = 48 + ri(25);
    const second = desc ? root - semis : root + semis;
    return {
      prompt: 'Two notes, ' + b(desc ? 'descending' : 'ascending') + '. Which interval do you hear?',
      stimulus: {
        audio: { items: [{ midi: root, beats: 0.75 }, { midi: second, beats: 0.75 }], bpm: 84 },
        autoplay: true
      },
      input: { kind: 'choices' },
      choices: intervalChoiceSet(set, iv),
      answer: iv,
      explain: Theory.intervalLabel(iv) + ' — ' + semis + ' half steps: ' + IV_CHAR[iv] + '.',
      antiKey: iv + (desc ? 'd' : 'a')
    };
  };

  GEN['ear-interval-harm'] = function (L) {
    const set = EAR_HARM_SETS[L];
    const iv = pick(set);
    const semis = Theory.intervalSemitones(iv);
    const root = 48 + ri(25);
    return {
      prompt: 'Two notes together. Which interval do you hear?',
      stimulus: {
        audio: { items: [{ midis: [root, root + semis], beats: 2 }], bpm: 84 },
        autoplay: true
      },
      input: { kind: 'choices' },
      choices: intervalChoiceSet(set, iv),
      answer: iv,
      explain: Theory.intervalLabel(iv) + ' — ' + semis + ' half steps sounding at once: ' + IV_CHAR[iv] + '.',
      antiKey: 'h' + iv
    };
  };

  /* ================= U7 — minor & relative keys ================= */

  GEN['relative-keys'] = function (L) {
    if (L === 3) {
      const key = pick(Theory.MAJOR_KEYS);
      const sig = Theory.keySig(key, 'major');
      const minor = Theory.relativeMinor(key);
      const decoys = Theory.MINOR_KEYS.map(function (k) { return { id: k, label: prettyKey(k) + ' minor' }; });
      const built = buildChoices({ id: minor, label: prettyKey(minor) + ' minor' }, decoys, 4);
      return {
        prompt: 'This key signature — name the ' + b('minor') + ' key.',
        stimulus: { keySigOnly: { clef: pick(['treble', 'bass']), keySig: sig.count } },
        input: { kind: 'choices' },
        choices: built.choices,
        answer: built.answer,
        explain: sigWord(sig.count).charAt(0).toUpperCase() + sigWord(sig.count).slice(1) + ' is ' +
          prettyKey(key) + ' major; the relative minor shares it, a minor 3rd below: ' +
          prettyKey(minor) + ' minor.',
        antiKey: 'sig' + key
      };
    }
    const fromMajor = ri(2) === 0;
    let pool = fromMajor ? Theory.MAJOR_KEYS : Theory.MINOR_KEYS;
    if (L === 1) {
      pool = pool.filter(function (k) {
        return Math.abs(Theory.keySig(k, fromMajor ? 'major' : 'minor').count) <= 2;
      });
    }
    const key = pick(pool);
    if (fromMajor) {
      const minor = Theory.relativeMinor(key);
      const decoys = Theory.MINOR_KEYS.map(function (k) { return { id: k, label: prettyKey(k) + ' minor' }; });
      const built = buildChoices({ id: minor, label: prettyKey(minor) + ' minor' }, decoys, 4);
      return {
        prompt: 'What is the relative minor of ' + b(prettyKey(key) + ' major') + '?',
        input: { kind: 'choices' },
        choices: built.choices,
        answer: built.answer,
        explain: 'Relative keys share a key signature; the minor sits a minor 3rd below its major: ' +
          prettyKey(key) + ' → ' + prettyKey(minor) + ' minor.',
        antiKey: 'M' + key
      };
    }
    const major = Theory.relativeMajor(key);
    const decoys = Theory.MAJOR_KEYS.map(function (k) { return { id: k, label: prettyKey(k) + ' major' }; });
    const built = buildChoices({ id: major, label: prettyKey(major) + ' major' }, decoys, 4);
    return {
      prompt: 'What is the relative major of ' + b(prettyKey(key) + ' minor') + '?',
      input: { kind: 'choices' },
      choices: built.choices,
      answer: built.answer,
      explain: 'Relative keys share a key signature; the major sits a minor 3rd above its minor: ' +
        prettyKey(key) + ' → ' + prettyKey(major) + ' major.',
      antiKey: 'm' + key
    };
  };

  const MM_CHOICES = [{ id: 'maj', label: 'Major' }, { id: 'min', label: 'Minor' }];
  const MM_PATTERNS = [[1, 2, 3, 2, 1], [1, 2, 3, 4, 5], [5, 4, 3, 2, 1], [1, 3, 5, 3, 1], [3, 4, 5, 2, 1]];
  // Harmonic-minor melodies still touch degree 3 — the lesson's "listen for
  // the 3rd" strategy must keep working even when the raised 7th is the flavor.
  const MM_HARM_PATTERNS = [[1, 3, 5, 6, 7, 8], [8, 7, 6, 5, 3, 1], [3, 5, 6, 7, 8, 8]];

  GEN['ear-major-minor'] = function (L) {
    const minor = ri(2) === 0;
    let items, bpm, explain, kind;
    if (L === 1) {
      const T = 48 + ri(25);
      const tonic = Theory.fromMidi(T);
      const midis = Theory.scale(tonic, minor ? 'natural_minor' : 'major').map(Theory.midi);
      items = midis.map(function (m) { return { midi: m, beats: 1 }; });
      bpm = 100;
      kind = 'scale';
      explain = minor
        ? 'The lowered 3rd (and 6th) darken the scale — minor.'
        : 'A bright major 3rd above the tonic — major.';
    } else if (L === 2) {
      const T = 48 + ri(29);
      const midis = Theory.triad(Theory.fromMidi(T), minor ? 'min' : 'maj').map(Theory.midi);
      items = [{ midis: midis, beats: 2 }];
      bpm = 90;
      kind = 'chord';
      explain = minor
        ? 'The middle note sits a minor 3rd (3 half steps) above the root — a dark minor chord.'
        : 'The middle note sits a major 3rd (4 half steps) above the root — a bright major chord.';
    } else {
      const useHarm = L === 4 && minor && ri(2) === 0;
      const T = 50 + ri(21);
      const tonic = Theory.fromMidi(T);
      const type = minor ? (useHarm ? 'harmonic_minor' : 'natural_minor') : 'major';
      const scaleMidis = Theory.scale(tonic, type).map(Theory.midi);
      const pat = pick(useHarm ? MM_HARM_PATTERNS : MM_PATTERNS);
      items = pat.map(function (d, i) {
        return { midi: scaleMidis[d - 1], beats: i === pat.length - 1 ? 2 : 1 };
      });
      bpm = 100;
      kind = 'melody';
      explain = useHarm
        ? 'That exotic wide step is harmonic minor\'s raised 7th — still minor.'
        : (minor
          ? 'The melody leans on a lowered 3rd — minor (darker).'
          : 'The melody outlines a major 3rd above the tonic — major (brighter).');
    }
    return {
      prompt: 'Listen to the ' + kind + '. Is it major or minor?',
      stimulus: { audio: { items: items, bpm: bpm }, autoplay: true },
      input: { kind: 'choices' },
      choices: MM_CHOICES,
      answer: minor ? 'min' : 'maj',
      explain: explain,
      antiKey: (minor ? 'min' : 'maj') + items.length + items[0].beats + (items[0].midi || items[0].midis[0])
    };
  };

  /* ================= U8 — triads & inversions ================= */

  function spellTriadFromMidi(rootMidi, kind) {
    const prefs = shuffle(['sharp', 'flat']);
    for (let i = 0; i < prefs.length; i++) {
      const root = Theory.fromMidi(rootMidi, prefs[i]);
      const notes = Theory.triad(root, kind);
      if (notes.every(function (n) { return Math.abs(n.a) <= 1; })) return { root: root, notes: notes };
    }
    return null;
  }

  const TRIAD_QUAL_POOLS = { 1: ['maj', 'min'], 2: ['maj', 'min'], 3: ['maj', 'min', 'dim'], 4: ['maj', 'min', 'dim', 'aug'] };

  function triadQualityExplain(kind, notes) {
    const names = notes.map(function (n) { return Theory.nameNoOct(n); }).join('–');
    const build = {
      maj: 'a major 3rd, then a minor 3rd on top', min: 'a minor 3rd, then a major 3rd on top',
      dim: 'two minor 3rds', aug: 'two major 3rds'
    }[kind];
    return names + ' stacks ' + build + ' — ' + Theory.chordLabel(kind).toLowerCase() +
      ' (' + CHORD_CHAR[kind] + ').';
  }

  GEN['triad-id'] = function (L) {
    const pool = TRIAD_QUAL_POOLS[L];
    let spelled = null, kind;
    for (let tries = 0; tries < 40 && !spelled; tries++) {
      kind = pick(pool);
      let rootMidi;
      if (L === 1) rootMidi = pick(whiteMidis(60, 71));
      else rootMidi = 60 + ri(12);
      spelled = spellTriadFromMidi(rootMidi, kind);
    }
    if (!spelled) { kind = 'maj'; spelled = { root: Theory.N('C4'), notes: Theory.triad(Theory.N('C4'), 'maj') }; }
    const choicePool = pool.map(function (k) { return { id: k, label: Theory.chordLabel(k) }; });
    return {
      prompt: 'What quality is this triad?',
      stimulus: { staff: { clef: 'treble', notes: spelled.notes.map(function (n) { return sn(n, { dur: 'h' }); }), chord: true } },
      input: { kind: 'choices' },
      choices: choicePool,
      answer: kind,
      explain: triadQualityExplain(kind, spelled.notes),
      antiKey: Theory.ascii(spelled.root) + kind
    };
  };

  GEN['triad-build'] = function (L) {
    let kind, rootMidi, spelled = null;
    for (let tries = 0; tries < 60 && !spelled; tries++) {
      if (L === 1) kind = 'maj';
      else if (L === 2) kind = 'min';
      else if (L === 3) kind = pick(['maj', 'min']);
      else kind = pick(['dim', 'aug']);
      rootMidi = 48 + ri(29);
      if (L <= 2 && !isWhite(rootMidi)) continue;
      spelled = spellTriadFromMidi(rootMidi, kind);
    }
    if (!spelled) { kind = 'maj'; rootMidi = 60; spelled = { root: Theory.N('C4'), notes: Theory.triad(Theory.N('C4'), 'maj') }; }
    const midis = spelled.notes.map(Theory.midi);
    const label = Theory.nameNoOct(spelled.root) + ' ' + Theory.chordLabel(kind).toLowerCase();
    return {
      prompt: 'Build ' + b(label) + ' in root position, starting on the highlighted key.',
      stimulus: { keyboard: { range: ['C3', 'C6'], highlights: [{ midi: rootMidi, cls: 'target' }] } },
      input: { kind: 'keys', count: 3, ordered: false, range: ['C3', 'C6'] },
      answer: midis,
      explain: triadQualityExplain(kind, spelled.notes),
      meta: {
        answerNames: spelled.notes.map(function (n) { return Theory.name(n); }),
        preferAcc: spelled.notes.some(function (n) { return n.a < 0; }) ? 'flat' : 'sharp'
      },
      antiKey: rootMidi + kind
    };
  };

  const INV_CHOICES = [
    { id: 'root', label: 'Root position' },
    { id: 'inv1', label: '1st inversion' },
    { id: 'inv2', label: '2nd inversion' }
  ];
  const INV_IDS = ['root', 'inv1', 'inv2'];

  GEN['inversion-id'] = function (L) {
    let notes = null, inv, rootName, kind;
    for (let tries = 0; tries < 60 && !notes; tries++) {
      if (L === 1) { rootName = pick(['C', 'F', 'G']); kind = 'maj'; }
      else {
        kind = pick(['maj', 'min']);
        rootName = pick(['C', 'D', 'E', 'F', 'G', 'A', 'B', 'Eb', 'F#', 'Bb', 'Ab', 'C#']);
      }
      inv = ri(3);
      const o = pick(L === 3 ? [3, 4] : [4]);
      let root;
      try { root = Theory.N(rootName + o); } catch (e) { continue; }
      const cand = Theory.invert(Theory.triad(root, kind), inv);
      const ok = cand.every(function (n) {
        const m = Theory.midi(n);
        return m >= 57 && m <= 86 && Math.abs(n.a) <= 1;
      });
      if (ok) notes = cand;
    }
    if (!notes) { rootName = 'C'; kind = 'maj'; inv = 1; notes = Theory.invert(Theory.triad(Theory.N('C4'), 'maj'), 1); }
    const explains = {
      root: 'Stacked in 3rds from the bottom — the root is the lowest note: root position.',
      inv1: 'The 3rd is on the bottom and a 4th sits between the top two notes — the root moved to the top: 1st inversion.',
      inv2: 'A 4th sits between the bottom two notes, so the root is the middle note — the 5th is in the bass: 2nd inversion.'
    };
    return {
      prompt: 'This ' + (kind === 'maj' ? 'major' : 'minor') + ' triad is in which position?',
      stimulus: { staff: { clef: 'treble', notes: notes.map(function (n) { return sn(n, { dur: 'h' }); }), chord: true } },
      input: { kind: 'choices' },
      choices: INV_CHOICES,
      answer: INV_IDS[inv],
      explain: explains[INV_IDS[inv]],
      antiKey: rootName + kind + inv
    };
  };

  /* ================= U9 — hearing chords ================= */

  function blockArpItems(midis, includeArp) {
    const items = [{ midis: midis.slice(), beats: 2 }];
    if (includeArp) {
      items.push({ rest: true, beats: 0.5 });
      midis.forEach(function (m) { items.push({ midi: m, beats: 0.5 }); });
    }
    return items;
  }

  GEN['ear-triad'] = function (L) {
    // L1: maj/min; L2: +dim; L3: +aug; L4: all, block chord only
    const pools = { 1: ['maj', 'min'], 2: ['maj', 'min', 'dim'], 3: ['maj', 'min', 'dim', 'aug'], 4: ['maj', 'min', 'dim', 'aug'] };
    const kinds = pools[L];
    const kind = pick(kinds);
    const rootMidi = 48 + ri(25);
    const midis = Theory.triad(Theory.fromMidi(rootMidi), kind).map(Theory.midi);
    return {
      prompt: 'What quality of triad do you hear?',
      stimulus: { audio: { items: blockArpItems(midis, L < 4), bpm: 90 }, autoplay: true },
      input: { kind: 'choices' },
      choices: kinds.map(function (k) { return { id: k, label: Theory.chordLabel(k) }; }),
      answer: kind,
      explain: Theory.chordLabel(kind) + ' — ' + CHORD_CHAR[kind] + '.',
      antiKey: kind + rootMidi % 5
    };
  };

  GEN['ear-inversion'] = function (L) {
    const kind = L >= 2 ? pick(['maj', 'min']) : 'maj';
    const inv = ri(3);
    const rootMidi = 48 + ri(21);
    const midis = Theory.invert(Theory.triad(Theory.fromMidi(rootMidi), kind), inv).map(Theory.midi);
    const explains = {
      root: 'The chord stacks in 3rds from its lowest note — root position (most solid).',
      inv1: 'The bass is the chord\'s 3rd; the wider gap (a 4th) sits on top — 1st inversion.',
      inv2: 'The wider gap (a 4th) is at the bottom, so the bass is the 5th — 2nd inversion.'
    };
    return {
      prompt: 'Is this triad in root position, 1st, or 2nd inversion?',
      stimulus: { audio: { items: blockArpItems(midis, L < 3), bpm: 90 }, autoplay: true },
      input: { kind: 'choices' },
      choices: INV_CHOICES,
      answer: INV_IDS[inv],
      explain: explains[INV_IDS[inv]],
      antiKey: kind + inv
    };
  };

  const SEVENTH_POOLS = { 1: ['dom7', 'maj7', 'min7'], 2: ['dom7', 'maj7', 'min7', 'm7b5'], 3: ['dom7', 'maj7', 'min7', 'm7b5', 'dim7'] };

  GEN['ear-seventh'] = function (L) {
    const kinds = SEVENTH_POOLS[L];
    const kind = pick(kinds);
    const rootMidi = 48 + ri(21);
    const midis = Theory.seventh(Theory.fromMidi(rootMidi), kind).map(Theory.midi);
    return {
      prompt: 'Which seventh chord do you hear?',
      stimulus: { audio: { items: blockArpItems(midis, true), bpm: 90 }, autoplay: true },
      input: { kind: 'choices' },
      choices: kinds.map(function (k) { return { id: k, label: Theory.chordLabel(k) }; }),
      answer: kind,
      explain: Theory.chordLabel(kind) + ' — ' + CHORD_CHAR[kind] + '.',
      antiKey: '7' + kind
    };
  };

  /* ================= U10 — rhythm & meter ================= */

  const RHYTHM_MATH_BANK = {
    1: [
      { q: 'How many quarter notes equal one whole note?', a: '4', d: ['2', '3', '8'], why: 'A whole note lasts 4 beats; a quarter lasts 1 — so four quarters fill it.' },
      { q: 'How many quarter notes equal one half note?', a: '2', d: ['3', '4', '8'], why: 'A half note lasts 2 beats — two quarter notes.' },
      { q: 'How many half notes equal one whole note?', a: '2', d: ['3', '4', '8'], why: 'Each half note is 2 beats; the 4-beat whole note holds two of them.' },
      { q: 'With the quarter note as the beat, how many beats does a half note last?', a: '2', d: ['1', '3', '4'], why: 'A half note is twice a quarter note — 2 beats.' },
      { q: 'With the quarter note as the beat, how many beats does a whole note last?', a: '4', d: ['2', '3', '8'], why: 'A whole note is four quarter notes long — 4 beats.' },
      { q: 'How many eighth notes equal one quarter note?', a: '2', d: ['3', '4', '8'], why: 'Each division halves the value: a quarter splits into two eighths.' }
    ],
    2: [
      { q: 'How many beats does a dotted half note last?', a: '3', d: ['2', '4', '1½'], why: 'A dot adds half the note\'s value: 2 + 1 = 3 beats.' },
      { q: 'A dot after a note adds…', a: 'Half the note\'s value', d: ['Double the note\'s value', 'One beat', 'A quarter of its value'], why: 'The dot always adds half of the note it follows — a dotted half is 2 + 1 = 3 beats.' },
      { q: 'How many quarter notes equal one dotted half note?', a: '3', d: ['2', '4', '6'], why: 'A dotted half lasts 3 beats — three quarter notes.' },
      { q: 'How many beats does a dotted quarter note last?', a: '1½', d: ['1', '2', '2½'], why: 'A quarter (1 beat) plus half its value (½) makes 1½ beats.' },
      { q: 'How many eighth notes equal one dotted quarter note?', a: '3', d: ['2', '4', '6'], why: 'A dotted quarter lasts 1½ beats — three half-beat eighth notes.' }
    ],
    3: [
      { q: 'How many beats fill one bar of 3/4?', a: '3', d: ['2', '4', '6'], why: 'The top number counts beats per bar: three quarter-note beats.' },
      { q: 'How many beats fill one bar of 4/4?', a: '4', d: ['2', '3', '8'], why: 'The top number counts beats per bar: four quarter-note beats.' },
      { q: 'In 4/4, which note value gets one beat?', a: 'Quarter note', d: ['Half note', 'Eighth note', 'Whole note'], why: 'The bottom 4 means the quarter note carries the beat.' },
      { q: 'The top number of a time signature tells you…', a: 'Beats per bar', d: ['Which note gets the beat', 'The tempo', 'How many notes fit in a bar'], why: 'Top = how many beats each bar holds; bottom = which note value gets the beat.' },
      { q: 'The bottom number 4 in 3/4 means…', a: 'The quarter note gets the beat', d: ['Four beats per bar', 'Play four notes per bar', 'The tempo is 4'], why: 'Bottom = the beat unit: 4 stands for the quarter note.' }
    ],
    4: [
      { q: 'A dotted half note equals how many eighth notes?', a: '6', d: ['3', '4', '8'], why: '3 beats × two eighths per beat = six eighth notes.' },
      { q: 'How many eighth notes fill one bar of 4/4?', a: '8', d: ['4', '6', '16'], why: '4 beats × two eighths per beat = eight eighth notes.' },
      { q: 'A half note plus a quarter note lasts as long as…', a: 'A dotted half note', d: ['A whole note', 'A dotted quarter note', 'Three eighth notes'], why: '2 + 1 = 3 beats — exactly a dotted half note.' },
      { q: 'How many sixteenth notes equal one quarter note?', a: '4', d: ['2', '6', '8'], why: 'Each division halves the value: quarter → 2 eighths → 4 sixteenths.' },
      { q: 'A whole note equals a dotted half note plus…', a: 'A quarter note', d: ['A half note', 'An eighth note', 'A dotted quarter note'], why: '4 beats − 3 beats = 1 beat — a quarter note.' }
    ]
  };

  GEN['rhythm-math'] = function (L) {
    const item = pick(RHYTHM_MATH_BANK[L]);
    const built = buildChoices(
      { id: item.a, label: item.a },
      item.d.map(function (x) { return { id: x, label: x }; }),
      Math.min(4, 1 + item.d.length)
    );
    return {
      prompt: item.q,
      input: { kind: 'choices' },
      choices: built.choices,
      answer: built.answer,
      explain: item.why,
      antiKey: item.q
    };
  };

  const RHYTHM_PALETTES = {
    1: ['w', 'h', 'q'],
    2: ['w', 'h', 'q', 'ee'],
    3: ['w', 'h', 'q', 'ee', 'qr', 'hr'],
    4: ['w', 'h', 'q', 'ee', 'qr', 'hr']
  };
  const DICT_PALETTES = {
    1: ['w', 'h', 'q'],
    2: ['w', 'h', 'q', 'ee'],
    3: ['w', 'h', 'q', 'ee', 'qr', 'hr'],
    4: ['w', 'hd', 'h', 'q', 'ee', 'qr', 'hr', 'dqe', 'eqe']
  };

  function genRhythm(palette, bars) {
    let tiles = [];
    for (let i = 0; i < bars; i++) tiles = tiles.concat(genBar(palette, 4, 1));
    return tiles;
  }

  GEN['rhythm-read'] = function (L) {
    const palette = RHYTHM_PALETTES[L];
    const bars = L === 4 ? 2 : 1;
    const answerTiles = genRhythm(palette, bars);
    const sigs = [rhythmSignature(answerTiles)];
    const options = [answerTiles];
    for (let guard = 0; guard < 200 && options.length < 3; guard++) {
      const cand = genRhythm(palette, bars);
      const sig = rhythmSignature(cand);
      if (sigs.indexOf(sig) !== -1) continue;
      sigs.push(sig);
      options.push(cand);
    }
    // deterministic last resort: canonical bars guaranteed to differ in sound
    const stock = [['q', 'q', 'q', 'q'], ['h', 'h'], ['w'], ['h', 'q', 'q'], ['q', 'q', 'h'], ['q', 'h', 'q']];
    for (let s = 0; s < stock.length && options.length < 3; s++) {
      let cand = [];
      for (let i = 0; i < bars; i++) cand = cand.concat(stock[s]);
      const sig = rhythmSignature(cand);
      if (sigs.indexOf(sig) !== -1) continue;
      sigs.push(sig);
      options.push(cand);
    }
    const ids = ['a', 'b', 'c'];
    const choices = shuffle(options.map(function (tiles, i) {
      return { id: ids[i], tiles: tiles };
    }));
    return {
      prompt: bars === 2
        ? 'Listen: four count-in clicks, then a two-bar rhythm. Which line matches?'
        : 'Listen: four count-in clicks, then a one-bar rhythm in 4/4. Which line matches?',
      stimulus: { audio: rhythmAudio(answerTiles, 84), autoplay: true },
      input: { kind: 'choices' },
      choices: choices,
      answer: 'a',
      explain: 'Counting 1-2-3-4: ' + rhythmWords(answerTiles, 4) + '.',
      antiKey: answerTiles.join(',')
    };
  };

  GEN['rhythm-dictation'] = function (L) {
    const palette = DICT_PALETTES[L];
    const tiles = genRhythm(palette, 1);
    return {
      prompt: 'Listen: four count-in clicks, then a one-bar rhythm in 4/4. Build what you hear from the tiles.',
      stimulus: { audio: rhythmAudio(tiles, 80), autoplay: true },
      input: { kind: 'rhythm', beats: 4, bars: 1, tiles: palette },
      answer: tiles.slice(),
      explain: 'Counting 1-2-3-4: ' + rhythmWords(tiles, 4) + '.',
      antiKey: tiles.join(',')
    };
  };

  /* ================= U11 — melodic dictation ================= */

  const EAR_DEGREE_POOLS = { 1: [1, 3, 5], 2: [1, 2, 3, 4, 5], 3: [1, 2, 3, 4, 5, 6, 7, 8], 4: [1, 2, 3, 4, 5, 6, 7, 8] };

  GEN['ear-degree'] = function (L) {
    const key = L === 4 ? pick(Theory.MAJOR_KEYS) : pick(['C', 'G', 'F']);
    const T = tonicMidiFor(key, 49, 67);
    const tonic = noteAt(key, T);
    const scaleNotes = Theory.scale(tonic, 'major');
    const scaleMidis = scaleNotes.map(Theory.midi);
    const deg = pick(EAR_DEGREE_POOLS[L]);
    const noteMidi = scaleMidis[deg - 1];
    const degAnswer = deg === 8 ? 1 : deg;
    const pool = EAR_DEGREE_POOLS[L].filter(function (d) { return d !== 8; });
    const choices = pool.map(function (d) {
      return { id: String(d), label: d + ' (' + SOLFEGE[d - 1] + ')' };
    });
    const items = cadenceItems(T, 'major').concat([{ midi: noteMidi, beats: 1.5 }]);
    const pcName = Theory.nameNoOct(scaleNotes[deg - 1]);
    return {
      prompt: 'A cadence sets up ' + b(prettyKey(key) + ' major') + ', then one note plays. Which scale degree is it?',
      stimulus: { audio: { items: items, bpm: 84 }, autoplay: true },
      input: { kind: 'choices' },
      choices: choices,
      answer: String(degAnswer),
      explain: 'That note was ' + pcName + ' — degree ' + degAnswer + ' (' + SOLFEGE[degAnswer - 1] +
        ')' + (deg === 8 ? ', heard an octave above the tonic' : '') +
        '. Anchor every note against Do, the cadence\'s landing point.',
      antiKey: key + 'deg' + deg
    };
  };

  const DICT_KEYS = { 1: [['C', 'major']], 2: [['C', 'major'], ['G', 'major']], 3: [['C', 'major'], ['G', 'major'], ['F', 'major'], ['D', 'major']], 4: [['C', 'major'], ['G', 'major'], ['F', 'major'], ['D', 'major'], ['A', 'minor']] };

  GEN['melodic-dictation'] = function (L) {
    const kv = pick(DICT_KEYS[L]);
    const key = kv[0], mode = kv[1];
    // Tonic no lower than G3: the melody spans up to tonic+12 and the compare
    // staves are treble, whose ledger room runs out below F3.
    const T = tonicMidiFor(key, 55, 67);
    const tonic = noteAt(key, T);
    const scaleNotes = Theory.scale(tonic, mode === 'minor' ? 'natural_minor' : 'major');
    const scaleMidis = scaleNotes.map(Theory.midi);
    const len = L === 1 ? 3 : L === 2 ? 4 + ri(2) : L === 3 ? 5 + ri(2) : 7 + ri(2);
    const maxIdx = L === 1 ? 4 : 7;
    const triadIdx = [0, 2, 4, 7];
    const idxs = [0];
    let cur = 0;
    for (let i = 1; i < len; i++) {
      let moves;
      if (L === 1) moves = [-1, 1];
      else if (L === 2) moves = [-1, 1, -2, 2];
      else {
        moves = [-1, 1, -2, 2];
        triadIdx.forEach(function (t) {
          const jump = t - cur;
          if (Math.abs(jump) > 2 && jump !== 0) moves.push(jump);
        });
      }
      const legal = moves.filter(function (mv) { return cur + mv >= 0 && cur + mv <= maxIdx; });
      const mv = legal.length ? pick(legal) : (cur > 0 ? -1 : 1);
      cur += mv;
      idxs.push(cur);
    }
    const melodyNotes = idxs.map(function (i) { return scaleNotes[i]; });
    const melodyMidis = idxs.map(function (i) { return scaleMidis[i]; });
    const melodyItems = melodyMidis.map(function (m, i) {
      return { midi: m, beats: i === melodyMidis.length - 1 ? 2 : 1 };
    });
    const items = cadenceItems(T, mode).concat(melodyItems);
    const sig = Theory.keySig(key, mode);
    const modeWord = mode === 'minor' ? ' minor' : ' major';
    const degStr = idxs.map(function (i) { return i === 7 ? '8' : String(i + 1); }).join('–');
    const nameStr = melodyNotes.map(function (n) { return Theory.name(n); }).join(' ');
    return {
      prompt: 'A cadence sets up ' + b(prettyKey(key) + modeWord) + ', then a ' + len +
        '-note melody begins on the tonic, ' + b(Theory.name(tonic)) + '. Play it back in order.',
      stimulus: {
        audio: { items: items, bpm: 80, replayItems: melodyItems, replayLabel: 'Replay melody' },
        autoplay: true
      },
      input: { kind: 'melody', range: ['C3', 'C6'] },
      answer: melodyMidis,
      explain: 'The melody ran degrees ' + degStr + ': ' + nameStr +
        ' — hear each note as a distance from the tonic.',
      meta: {
        answerNotes: melodyNotes.map(function (n) { return sn(n); }),
        clef: 'treble',
        keySig: sig.count,
        melodyItems: melodyItems,
        tonicName: prettyKey(key) + modeWord
      },
      antiKey: key + idxs.join('.')
    };
  };

  /* ================= U12 — diatonic harmony ================= */

  const MINOR_ROMANS = ['i', 'ii°', 'III', 'iv', 'v', 'VI', 'VII'];
  const MINOR_QUALS = ['min', 'dim', 'maj', 'min', 'min', 'maj', 'maj'];
  function minorDiatonic(key) {
    const scaleNotes = Theory.scale(Theory.N(key + '4'), 'natural_minor');
    const out = [];
    for (let i = 0; i < 7; i++) {
      out.push({
        degree: i + 1,
        roman: MINOR_ROMANS[i],
        quality: MINOR_QUALS[i],
        root: scaleNotes[i],
        notes: Theory.triad(scaleNotes[i], MINOR_QUALS[i])
      });
    }
    return out;
  }
  function chordName(entry) {
    const q = { maj: 'major', min: 'minor', dim: 'diminished', aug: 'augmented' }[entry.quality];
    return Theory.nameNoOct(entry.root) + ' ' + q;
  }
  function qualityCaseNote(entry) {
    if (entry.quality === 'maj') return 'major quality → uppercase ' + entry.roman;
    if (entry.quality === 'min') return 'minor quality → lowercase ' + entry.roman;
    return 'diminished quality → lowercase with ° (' + entry.roman + ')';
  }

  GEN['roman-numeral'] = function (L) {
    if (L === 2) {
      let key, entry, triadNotes;
      for (let tries = 0; tries < 40; tries++) {
        key = pick(Theory.MAJOR_KEYS.filter(function (k) { return Math.abs(Theory.keySig(k, 'major').count) <= 4; }));
        const all = Theory.diatonicTriads(key);
        entry = pick(all);
        const base = entry.notes;
        const shift = Theory.midi(base[0]) < 60 ? 1 : 0;
        triadNotes = base.map(function (n) { return { l: n.l, a: n.a, o: n.o + shift }; });
        const ok = triadNotes.every(function (n) {
          const m = Theory.midi(n);
          return m >= 57 && m <= 86;
        });
        if (ok) break;
        triadNotes = null;
      }
      if (!triadNotes) { key = 'C'; entry = Theory.diatonicTriads('C')[0]; triadNotes = entry.notes; }
      const sig = Theory.keySig(key, 'major');
      const decoys = Theory.diatonicTriads(key).filter(function (e) { return e.roman !== entry.roman; })
        .map(function (e) { return { id: e.roman, label: e.roman }; });
      const built = buildChoices({ id: entry.roman, label: entry.roman }, decoys, 4);
      return {
        prompt: 'In ' + b(prettyKey(key) + ' major') + ', which Roman numeral names this chord?',
        stimulus: { staff: { clef: 'treble', keySig: sig.count, notes: triadNotes.map(function (n) { return sn(n, { dur: 'h' }); }), chord: true } },
        input: { kind: 'choices' },
        choices: built.choices,
        answer: built.answer,
        explain: 'The chord is ' + chordName(entry) + ', built on degree ' + entry.degree +
          ' of ' + prettyKey(key) + ' major; ' + qualityCaseNote(entry) + '.',
        antiKey: key + entry.roman
      };
    }
    if (L === 3) {
      const key = pick(Theory.MAJOR_KEYS);
      const all = Theory.diatonicTriads(key);
      const entry = pick(all.slice(1));
      const decoys = all.filter(function (e) { return e.degree !== entry.degree; })
        .map(function (e) { return { id: e.roman, label: chordName(e) }; });
      const built = buildChoices({ id: entry.roman, label: chordName(entry) }, decoys, 4);
      return {
        prompt: 'Which chord is ' + b(entry.roman) + ' in ' + b(prettyKey(key) + ' major') + '?',
        input: { kind: 'choices' },
        choices: built.choices,
        answer: built.answer,
        explain: 'Degree ' + entry.degree + ' of ' + prettyKey(key) + ' major is ' +
          Theory.nameNoOct(entry.root) + '; the diatonic triad there is ' + chordName(entry) + '.',
        antiKey: key + entry.roman
      };
    }
    const minorMode = L === 4;
    const key = minorMode
      ? pick(['A', 'E', 'D', 'G', 'B', 'C'])
      : pick(['C', 'G', 'F', 'D']);
    const all = minorMode ? minorDiatonic(key) : Theory.diatonicTriads(key);
    const entry = pick(all.slice(1));
    const labelOf = function (e) { return e.roman + ' — ' + chordName(e); };
    const decoys = all.filter(function (e) { return e.degree !== entry.degree; })
      .map(function (e) { return { id: e.roman, label: labelOf(e) }; });
    const built = buildChoices({ id: entry.roman, label: labelOf(entry) }, decoys, 4);
    const modeWord = minorMode ? ' minor (natural)' : ' major';
    return {
      prompt: 'In ' + b(prettyKey(key) + modeWord) + ', the chord built on degree ' +
        b(String(entry.degree)) + ' is…',
      input: { kind: 'choices' },
      choices: built.choices,
      answer: built.answer,
      explain: 'Degree ' + entry.degree + ' of ' + prettyKey(key) + modeWord + ' is ' +
        Theory.nameNoOct(entry.root) + ', carrying a ' +
        { maj: 'major', min: 'minor', dim: 'diminished' }[entry.quality] + ' triad; ' +
        qualityCaseNote(entry) + '.',
      antiKey: (minorMode ? 'm' : 'M') + key + entry.degree
    };
  };

  // Compact voicings as semitone offsets from the tonic midi T.
  const CHORD_VOICINGS = {
    major: { I: [0, 4, 7], IV: [0, 5, 9], V: [-1, 2, 7], vi: [0, 4, 9] },
    minor: { i: [0, 3, 7], iv: [0, 5, 8], V: [-1, 2, 7], v: [2, 7, 10], VI: [0, 3, 8], III: [3, 7, 10], VII: [-2, 2, 5] }
  };

  function progressionItems(romans, T, mode, lastBeats) {
    const table = CHORD_VOICINGS[mode];
    return romans.map(function (r, i) {
      const offs = table[r];
      return {
        midis: offs.map(function (o) { return T + o; }),
        beats: (i === romans.length - 1 && lastBeats) ? lastBeats : 1
      };
    });
  }

  const CADENCES = {
    major: { authentic: ['I', 'IV', 'V', 'I'], plagal: ['I', 'IV', 'I'], half: ['I', 'IV', 'V'], deceptive: ['I', 'IV', 'V', 'vi'] },
    minor: { authentic: ['i', 'iv', 'V', 'i'], plagal: ['i', 'iv', 'i'], half: ['i', 'iv', 'V'], deceptive: ['i', 'iv', 'V', 'VI'] }
  };
  const CADENCE_LABELS = {
    authentic: 'Authentic (V → I)',
    plagal: 'Plagal (IV → I)',
    half: 'Half (stops on V)',
    deceptive: 'Deceptive (V → vi)'
  };
  const CADENCE_EXPLAINS = {
    authentic: 'Tension (V) resolved home (I) — the strongest close: an authentic cadence.',
    plagal: 'IV settling gently onto I with no leading-tone pull — the plagal ("Amen") cadence.',
    half: 'The phrase stops on V, hanging unresolved — a half cadence asks a question.',
    deceptive: 'V promised home but landed on vi instead — a deceptive cadence.'
  };

  GEN['ear-cadence'] = function (L) {
    const types = L >= 3 ? ['authentic', 'plagal', 'half', 'deceptive'] : ['authentic', 'plagal', 'half'];
    const type = pick(types);
    const mode = L >= 2 ? pick(['major', 'minor']) : 'major';
    const T = 55 + ri(13);
    const romans = CADENCES[mode][type];
    const items = progressionItems(romans, T, mode, 2);
    return {
      prompt: 'A short progression plays. How does it end?',
      stimulus: { audio: { items: items, bpm: 84 }, autoplay: true },
      input: { kind: 'choices' },
      choices: types.map(function (t) { return { id: t, label: CADENCE_LABELS[t] }; }),
      answer: type,
      explain: CADENCE_EXPLAINS[type],
      antiKey: type + mode
    };
  };

  const PROGRESSIONS = {
    1: { mode: 'major', list: ['I–IV–V–I', 'I–V–IV–I'], decoys: ['I–IV–I–V'] },
    2: { mode: 'major', list: ['I–IV–V–I', 'I–V–vi–IV', 'I–vi–IV–V', 'I–IV–I–V'], decoys: [] },
    3: { mode: 'minor', list: ['i–iv–v–i', 'i–VI–III–VII', 'i–iv–VII–III'], decoys: [] }
  };
  const PROG_EXPLAINS = {
    'I–IV–V–I': 'Home, away, tension, home — the bass walks 1→4→5→1: I–IV–V–I.',
    'I–V–IV–I': 'Tension comes FIRST here (1→5), then relaxes through 4 back home: I–V–IV–I.',
    'I–V–vi–IV': 'The dip to the minor vi after V is the giveaway — the famous pop loop I–V–vi–IV.',
    'I–vi–IV–V': 'Home slides to its relative minor (vi), then builds 4→5 — the doo-wop loop I–vi–IV–V.',
    'I–IV–I–V': 'Away and back (1→4→1), then it parks on the dominant: I–IV–I–V.',
    'i–iv–v–i': 'All three chords stay minor — the plain minor cycle i–iv–v–i.',
    'i–VI–III–VII': 'Minor home, then three bright major chords rising — the pop loop i–VI–III–VII.',
    'i–iv–VII–III': 'Minor home and iv, then the bass falls in 4ths through VII to III: i–iv–VII–III.'
  };

  GEN['ear-progression'] = function (L) {
    const cfg = PROGRESSIONS[L];
    const prog = pick(cfg.list);
    const romans = prog.split('–');
    const T = 55 + ri(13);
    const items = progressionItems(romans, T, cfg.mode, 2);
    const allIds = cfg.list.concat(cfg.decoys);
    return {
      prompt: 'Four chords play' + (cfg.mode === 'minor' ? ' in a minor key' : '') +
        '. Which progression do you hear?',
      stimulus: { audio: { items: items, bpm: 80 }, autoplay: true },
      input: { kind: 'choices' },
      choices: shuffle(allIds.map(function (p) { return { id: p, label: p }; })),
      answer: prog,
      explain: PROG_EXPLAINS[prog],
      antiKey: prog
    };
  };

  /* ================= exports ================= */

  function maxLevel(skillId) {
    const l = LEVELS[skillId];
    if (!l) throw new Error('Unknown skill: ' + skillId);
    return l.length;
  }
  function levelDesc(skillId, level) {
    const l = LEVELS[skillId];
    if (!l) return '';
    return l[Math.max(1, Math.min(level, l.length)) - 1] || '';
  }

  const recentKeys = {};
  function generate(skillId, level) {
    const gen = GEN[skillId];
    if (!gen) throw new Error('Unknown skill: ' + skillId);
    const L = Math.max(1, Math.min(level || 1, maxLevel(skillId)));
    const seen = recentKeys[skillId] || (recentKeys[skillId] = []);
    let q = null;
    for (let i = 0; i < 8; i++) {
      q = gen(L);
      const key = q.antiKey !== undefined ? String(q.antiKey) : JSON.stringify(q.answer);
      if (seen.indexOf(key) === -1 || i === 7) {
        seen.push(key);
        if (seen.length > 3) seen.shift();
        break;
      }
    }
    delete q.antiKey;
    q.skillId = skillId;
    q.level = L;
    return q;
  }

  /* ================= self test ================= */

  const PIANO_LO = 36, PIANO_HI = 96;

  function midiOk(m) { return Number.isInteger(m) && m >= PIANO_LO && m <= PIANO_HI; }
  function rangeMidis(range) {
    return [Theory.midi(Theory.N(range[0])), Theory.midi(Theory.N(range[1]))];
  }
  function validItem(it) {
    if (!it || typeof it !== 'object') return 'item not an object';
    const zeroClick = it.beats === 0 && typeof it.at === 'number' && it.click !== undefined;
    if (zeroClick) {
      if (!(it.at >= 0)) return 'zero-beat click has bad at';
    } else if (typeof it.beats !== 'number' || !(it.beats > 0)) return 'item beats invalid';
    const kinds = ['midi', 'midis', 'rest', 'click'].filter(function (k) { return it[k] !== undefined; });
    if (kinds.length !== 1) return 'item must have exactly one of midi/midis/rest/click';
    if (it.midi !== undefined && !midiOk(it.midi)) return 'item midi out of 36–96: ' + it.midi;
    if (it.midis !== undefined) {
      if (!Array.isArray(it.midis) || !it.midis.length) return 'item midis empty';
      for (let i = 0; i < it.midis.length; i++) {
        if (!midiOk(it.midis[i])) return 'item midis out of 36–96: ' + it.midis[i];
      }
    }
    if (it.click !== undefined && it.click !== 'hi' && it.click !== 'lo') return 'bad click: ' + it.click;
    return null;
  }
  function validStaffNotes(notes) {
    if (!Array.isArray(notes) || !notes.length) return 'staff notes empty';
    for (let i = 0; i < notes.length; i++) {
      const n = notes[i];
      if (!n || LETTER_SEQ.indexOf(n.l) === -1) return 'bad staff letter';
      if (!Number.isInteger(n.a) || n.a < -2 || n.a > 2) return 'bad staff alteration';
      if (!Number.isInteger(n.o)) return 'bad staff octave';
      let m;
      try { m = Theory.midi(n); } catch (e) { return 'unparseable staff note'; }
      if (m < PIANO_LO || m > PIANO_HI) return 'staff note midi out of range: ' + m;
      if (n.dur !== undefined && ['w', 'h', 'q'].indexOf(n.dur) === -1) return 'bad dur: ' + n.dur;
    }
    return null;
  }

  function validate(q) {
    const errs = [];
    const push = function (e) { if (e) errs.push(e); };
    if (typeof q.prompt !== 'string' || !q.prompt.length) push('prompt missing');
    else if (q.prompt.replace(/<\/?b>/g, '').indexOf('<') !== -1) push('prompt has tags besides <b>');
    if (typeof q.explain !== 'string' || !q.explain.length) push('explain missing');
    if (!q.input || typeof q.input.kind !== 'string') { push('input missing'); return errs; }

    const st = q.stimulus || {};
    if (st.staff) push(validStaffNotes(st.staff.notes));
    if (st.keySigOnly) {
      if (['treble', 'bass'].indexOf(st.keySigOnly.clef) === -1) push('bad keySigOnly clef');
      const c = st.keySigOnly.keySig;
      if (!Number.isInteger(c) || c < -7 || c > 7) push('bad keySigOnly count');
    }
    if (st.keyboard) {
      let kr;
      try { kr = rangeMidis(st.keyboard.range); } catch (e) { kr = null; push('bad keyboard range'); }
      (st.keyboard.highlights || []).forEach(function (h) {
        if (!midiOk(h.midi)) push('keyboard highlight midi out of range: ' + h.midi);
        else if (kr && (h.midi < kr[0] || h.midi > kr[1])) push('highlight outside keyboard range: ' + h.midi);
      });
    }
    if (st.audio) {
      if (!Array.isArray(st.audio.items) || !st.audio.items.length) push('audio items empty');
      else st.audio.items.forEach(function (it) { push(validItem(it)); });
      if (st.audio.replayItems) st.audio.replayItems.forEach(function (it) { push(validItem(it)); });
      if (typeof st.audio.bpm !== 'number' || !(st.audio.bpm > 0)) push('bad bpm');
    }

    const kind = q.input.kind;
    if (kind === 'choices') {
      if (!Array.isArray(q.choices)) { push('choices missing'); return errs; }
      // 4 typical; binary questions (e.g. step-id) legitimately use 2
      if (q.choices.length < 2 || q.choices.length > 7) push('choices count ' + q.choices.length + ' outside 2–7');
      const ids = {}; const labels = {};
      let hits = 0;
      q.choices.forEach(function (c) {
        if (!c || typeof c.id !== 'string' || !c.id.length) { push('choice id missing'); return; }
        if (ids[c.id]) push('duplicate choice id: ' + c.id);
        ids[c.id] = true;
        if (c.label !== undefined) {
          if (labels[c.label]) push('duplicate choice label: ' + c.label);
          labels[c.label] = true;
        } else if (c.tiles) {
          const key = c.tiles.join(',');
          if (labels['t:' + key]) push('duplicate tile choice');
          labels['t:' + key] = true;
          c.tiles.forEach(function (t) { if (!TILES[t]) push('bad tile in choice: ' + t); });
        } else if (c.staff) {
          push(validStaffNotes(c.staff.notes));
        } else push('choice has no label/tiles/staff');
        if (c.id === q.answer) hits++;
      });
      if (hits !== 1) push('answer appears in choices ' + hits + ' times');
    } else if (kind === 'key' || kind === 'keys' || kind === 'melody') {
      let r;
      try { r = rangeMidis(q.input.range); } catch (e) { r = null; push('bad input range'); }
      const list = kind === 'key' ? [q.answer] : q.answer;
      if (!Array.isArray(list) && kind !== 'key') push('answer must be array');
      else {
        (kind === 'key' ? [q.answer] : q.answer).forEach(function (m) {
          if (!midiOk(m)) push('answer midi out of 36–96: ' + m);
          else if (r && (m < r[0] || m > r[1])) push('answer midi outside input range: ' + m);
        });
      }
      if (kind === 'keys') {
        if (!Number.isInteger(q.input.count) || q.input.count !== q.answer.length) push('keys count mismatch');
        if (typeof q.input.ordered !== 'boolean') push('keys ordered flag missing');
        if (!q.input.ordered) {
          const seen = {};
          q.answer.forEach(function (m) {
            if (seen[m]) push('unordered keys answer has duplicate midi');
            seen[m] = true;
          });
        }
      }
      if (kind === 'melody') {
        if (!q.meta || !Array.isArray(q.meta.answerNotes)) push('melody meta.answerNotes missing');
        else {
          if (q.meta.answerNotes.length !== q.answer.length) push('answerNotes length mismatch');
          push(validStaffNotes(q.meta.answerNotes));
          q.meta.answerNotes.forEach(function (n, i) {
            try {
              if (Theory.midi(n) !== q.answer[i]) push('answerNotes[' + i + '] midi mismatch');
            } catch (e) { /* reported above */ }
          });
        }
        if (!q.meta || !Array.isArray(q.meta.melodyItems)) push('melody meta.melodyItems missing');
        else q.meta.melodyItems.forEach(function (it) { push(validItem(it)); });
        if (!q.meta || ['treble', 'bass'].indexOf(q.meta.clef) === -1) push('melody meta.clef missing');
        if (!q.meta || !Number.isInteger(q.meta.keySig)) push('melody meta.keySig missing');
      }
    } else if (kind === 'rhythm') {
      if (!Number.isInteger(q.input.beats) || q.input.beats <= 0) push('rhythm beats invalid');
      const bars = q.input.bars || 1;
      if (!Array.isArray(q.input.tiles) || !q.input.tiles.length) push('rhythm palette missing');
      else q.input.tiles.forEach(function (t) { if (!TILES[t]) push('bad palette tile: ' + t); });
      if (!Array.isArray(q.answer) || !q.answer.length) push('rhythm answer missing');
      else {
        let total = 0;
        q.answer.forEach(function (t) {
          if (!TILES[t]) push('bad answer tile: ' + t);
          else {
            total += TILES[t].beats;
            if (q.input.tiles && q.input.tiles.indexOf(t) === -1) push('answer tile not in palette: ' + t);
          }
        });
        if (total !== q.input.beats * bars) push('rhythm answer beats ' + total + ' != ' + q.input.beats * bars);
      }
    } else push('unknown input kind: ' + kind);
    return errs;
  }

  function selfTest() {
    const problems = [];
    const skillIds = Object.keys(GEN);
    const CANON = [
      'kb-find-note', 'kb-name-note',
      'staff-id-treble', 'staff-id-bass', 'staff-to-key',
      'step-id', 'accidental-apply', 'enharmonic-match',
      'scale-build-major', 'keysig-id', 'scale-degree-id',
      'interval-size', 'interval-quality', 'interval-build',
      'ear-interval-mel', 'ear-interval-harm',
      'scale-build-minor', 'relative-keys', 'ear-major-minor',
      'triad-id', 'triad-build', 'inversion-id',
      'ear-triad', 'ear-inversion', 'ear-seventh',
      'rhythm-math', 'rhythm-read', 'rhythm-dictation',
      'ear-degree', 'melodic-dictation',
      'roman-numeral', 'ear-cadence', 'ear-progression'
    ];
    CANON.forEach(function (id) {
      if (!GEN[id]) problems.push('missing canonical skill: ' + id);
    });
    skillIds.forEach(function (id) {
      if (CANON.indexOf(id) === -1) problems.push('non-canonical skill: ' + id);
    });
    skillIds.forEach(function (id) {
      if (!LEVELS[id]) problems.push('no level descriptions for ' + id);
    });
    Object.keys(LEVELS).forEach(function (id) {
      if (!GEN[id]) problems.push('LEVELS lists unknown skill ' + id);
    });
    skillIds.forEach(function (id) {
      for (let L = 1; L <= maxLevel(id); L++) {
        for (let i = 0; i < 60; i++) {
          let q;
          try {
            q = generate(id, L);
          } catch (e) {
            problems.push(id + ' L' + L + ': generate threw: ' + (e && e.message));
            break;
          }
          if (q.skillId !== id || q.level !== L) problems.push(id + ' L' + L + ': skillId/level not set');
          const errs = validate(q);
          for (let k = 0; k < errs.length; k++) problems.push(id + ' L' + L + ': ' + errs[k]);
          if (problems.length > 220) return problems;
        }
      }
    });
    return problems;
  }

  const Exercises = {
    generate: generate,
    maxLevel: maxLevel,
    levelDesc: levelDesc,
    tileItems: tileItems,
    TILES: TILES,
    rhythmSignature: rhythmSignature,
    selfTest: selfTest
  };

  global.Exercises = Exercises;
  if (typeof module !== 'undefined' && module.exports) module.exports = Exercises;
})(typeof window !== 'undefined' ? window : globalThis);
