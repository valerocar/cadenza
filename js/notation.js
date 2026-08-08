(function (global) {
  'use strict';

  const NS = 'http://www.w3.org/2000/svg';
  const S = 12;                     // staff line gap in viewBox units
  const HALF = S / 2;               // one diatonic step
  const STAFF_TOP = 4 * S;          // room for 3 ledger lines + a note above
  const STAFF_BOTTOM = STAFF_TOP + 4 * S;
  const HEIGHT = 12 * S;
  const PX_PER_UNIT = 56 / (4 * S); // default scale renders the staff ~56px tall

  const FONT = "'Bravura Text','Apple Symbols','Noto Music','Segoe UI Symbol',serif";
  const CLEF_GLYPH = { treble: '\u{1D11E}', bass: '\u{1D122}' };
  const ACC_GLYPH = { '-2': '\u{1D12B}', '-1': '♭', '0': '♮', '1': '♯', '2': '\u{1D12A}' };
  const LETTER_STEP = { C: 0, D: 1, E: 2, F: 3, G: 4, A: 5, B: 6 };
  const CLEF_REF = { treble: 4 * 7 + 2, bass: 2 * 7 + 4 };  // bottom line: E4 (treble), G2 (bass)
  const SHARP_ORDER = ['F', 'C', 'G', 'D', 'A', 'E', 'B'];
  const FLAT_ORDER = ['B', 'E', 'A', 'D', 'G', 'C', 'F'];
  // Standard engraving octaves for key-signature glyphs in treble;
  // bass uses the same letters two octaves lower (standard positions).
  const SIG_OCT = { sharp: [5, 5, 5, 5, 4, 5, 4], flat: [4, 5, 4, 5, 4, 5, 4] };

  const ACC_SIZE = 3.1 * S;
  const KEYSIG_ADV = 1.2 * S;
  const ACC_COL = 1.3 * S;
  const LEDGER_EXT = 0.55 * S;
  const STEM_LEN = 3.5 * S;

  function getDoc() {
    if (typeof document !== 'undefined') return document;
    if (global.document) return global.document;
    throw new Error('Notation requires a DOM document');
  }

  function r2(v) { return Math.round(v * 100) / 100; }

  function posOf(letter, octave, clef) {
    return octave * 7 + LETTER_STEP[letter] - CLEF_REF[clef];
  }

  function yOf(pos) { return STAFF_BOTTOM - pos * HALF; }

  function mk(doc, tag, attrs, text) {
    const e = doc.createElementNS(NS, tag);
    for (const k in attrs) {
      if (attrs[k] !== undefined && attrs[k] !== null) e.setAttribute(k, String(attrs[k]));
    }
    if (text !== undefined) e.textContent = text;
    return e;
  }

  function noteClass(role, cls) {
    return 'note ' + role + (cls ? ' ' + cls : '');
  }

  function keyAlter(keySig, letter) {
    if (keySig > 0) return SHARP_ORDER.indexOf(letter) < keySig ? 1 : 0;
    if (keySig < 0) return FLAT_ORDER.indexOf(letter) < -keySig ? -1 : 0;
    return 0;
  }

  function accToDraw(note, keySig) {
    if (note.noAcc) return null;
    const a = note.a | 0;
    if (a === keyAlter(keySig, note.l)) return null;
    return ACC_GLYPH[a];
  }

  function ledgerPositions(pos) {
    const out = [];
    if (pos <= -2) { for (let p = -2; p >= pos; p -= 2) out.push(p); }
    else if (pos >= 10) { for (let p = 10; p <= pos; p += 2) out.push(p); }
    return out;
  }

  function clefEl(doc, clef) {
    // Glyph metrics tuned for the font stack: treble spans ~7.5S centered on
    // the G4 line; bass ~3.4S sitting on the F3 line.
    const treble = clef === 'treble';
    return mk(doc, 'text', {
      x: r2(2.2 * S),
      y: r2(treble ? yOf(2) : yOf(6) + 0.55 * S),
      class: 'clef',
      fill: 'currentColor',
      'font-family': FONT,
      'font-size': r2(treble ? 7.5 * S : 4.6 * S),
      'text-anchor': 'middle',
      'dominant-baseline': 'middle',
    }, CLEF_GLYPH[clef]);
  }

  function accText(doc, glyph, x, y, klass) {
    const attrs = {
      x: r2(x),
      y: r2(y),
      class: klass,
      fill: 'currentColor',
      'font-family': FONT,
      'font-size': r2(ACC_SIZE),
      'text-anchor': 'middle',
      'dominant-baseline': 'middle',
    };
    // Flat glyphs carry their ink low in the em box; nudge up so the bowl
    // centers on the note's line/space.
    if (glyph === ACC_GLYPH[-1] || glyph === ACC_GLYPH[-2]) attrs.dy = r2(-0.22 * S);
    return mk(doc, 'text', attrs, glyph);
  }

  function headEl(doc, cx, cy, dur, cls) {
    const rx = dur === 'w' ? 0.85 * S : 0.68 * S;
    const attrs = {
      cx: r2(cx),
      cy: r2(cy),
      rx: r2(rx),
      ry: r2(0.5 * S),
      class: noteClass('head', cls),
      transform: 'rotate(-20 ' + r2(cx) + ' ' + r2(cy) + ')',
    };
    if (dur === 'w' || dur === 'h') {
      attrs.fill = 'none';
      attrs.stroke = 'currentColor';
      attrs['stroke-width'] = dur === 'w' ? 2.2 : 1.9;
    } else {
      attrs.fill = 'currentColor';
      attrs.stroke = 'none';
    }
    return mk(doc, 'ellipse', attrs);
  }

  function stemEl(doc, x, y1, y2, cls) {
    return mk(doc, 'line', {
      x1: r2(x), y1: r2(y1), x2: r2(x), y2: r2(y2),
      class: noteClass('stem', cls),
      stroke: 'currentColor',
      'stroke-width': 1.4,
      'stroke-linecap': 'round',
    });
  }

  function ledgerEl(doc, x1, x2, y, cls) {
    return mk(doc, 'line', {
      x1: r2(x1), y1: r2(y), x2: r2(x2), y2: r2(y),
      class: noteClass('ledger', cls),
      stroke: 'currentColor',
      'stroke-width': 1.3,
      'stroke-linecap': 'round',
    });
  }

  function sigGlyphs(keySig, clef) {
    if (!keySig) return [];
    const flat = keySig < 0;
    const n = Math.min(7, Math.abs(keySig));
    const letters = flat ? FLAT_ORDER : SHARP_ORDER;
    const octs = flat ? SIG_OCT.flat : SIG_OCT.sharp;
    const drop = clef === 'bass' ? 2 : 0;
    const out = [];
    for (let i = 0; i < n; i++) {
      out.push({
        glyph: flat ? ACC_GLYPH[-1] : ACC_GLYPH[1],
        pos: posOf(letters[i], octs[i] - drop, clef),
      });
    }
    return out;
  }

  function normNote(n, clef, keySig) {
    const dur = (n.dur === 'h' || n.dur === 'w') ? n.dur : 'q';
    return {
      l: n.l,
      a: n.a | 0,
      o: n.o | 0,
      dur: dur,
      cls: n.cls || '',
      noAcc: !!n.noAcc,
      pos: posOf(n.l, n.o | 0, clef),
      rx: dur === 'w' ? 0.85 * S : 0.68 * S,
      acc: accToDraw(n, keySig),
      shift: false,
    };
  }

  function render(container, opts) {
    const doc = getDoc();
    opts = opts || {};
    const clef = opts.clef === 'bass' ? 'bass' : 'treble';
    const keySig = Math.max(-7, Math.min(7, opts.keySig | 0));
    const rawNotes = Array.isArray(opts.notes) ? opts.notes : [];
    const adv = opts.gap === 'wide' ? 6.5 * S : 4.5 * S;
    const scale = (typeof opts.scale === 'number' && opts.scale > 0) ? opts.scale : 1;

    const parts = [];
    parts.push(clefEl(doc, clef));

    const sig = sigGlyphs(keySig, clef);
    let x = 4.4 * S;
    for (const g of sig) {
      parts.push(accText(doc, g.glyph, x, yOf(g.pos), 'keysig'));
      x += KEYSIG_ADV;
    }

    let cursor = x + (sig.length ? 0.8 * S : 0) + 1.2 * S;
    let right = cursor;

    const noteList = rawNotes.map(function (n) { return normNote(n, clef, keySig); });

    if (!opts.chord) {
      let lastCx = null;
      for (const n of noteList) {
        let cx;
        if (lastCx === null) {
          if (n.acc) cursor += 1.6 * S;
          cx = cursor + n.rx;
        } else {
          cx = lastCx + adv + (n.acc ? 1.6 * S : 0);
        }
        lastCx = cx;
        const cy = yOf(n.pos);
        if (n.acc) parts.push(accText(doc, n.acc, cx - n.rx - 1.1 * S, cy, noteClass('acc', n.cls)));
        for (const lp of ledgerPositions(n.pos)) {
          parts.push(ledgerEl(doc, cx - n.rx - LEDGER_EXT, cx + n.rx + LEDGER_EXT, yOf(lp), n.cls));
        }
        parts.push(headEl(doc, cx, cy, n.dur, n.cls));
        if (n.dur !== 'w') {
          if (n.pos < 4) parts.push(stemEl(doc, cx + n.rx - 0.6, cy, cy - STEM_LEN, n.cls));
          else parts.push(stemEl(doc, cx - n.rx + 0.6, cy, cy + STEM_LEN, n.cls));
        }
        right = Math.max(right, cx + n.rx);
      }
    } else if (noteList.length) {
      const sorted = noteList.slice().sort(function (a, b) { return a.pos - b.pos; });
      for (let i = 1; i < sorted.length; i++) {
        if (sorted[i].pos - sorted[i - 1].pos === 1 && !sorted[i - 1].shift) sorted[i].shift = true;
      }
      const accNotes = sorted.filter(function (n) { return n.acc; })
        .sort(function (a, b) { return b.pos - a.pos; });
      const colLast = [];
      for (const n of accNotes) {
        let c = 0;
        while (c < colLast.length && colLast[c] - n.pos < 6) c++;
        n.accCol = c;
        colLast[c] = n.pos;
      }
      const rxMax = sorted.reduce(function (m, n) { return Math.max(m, n.rx); }, 0);
      const baseX = cursor + (colLast.length ? colLast.length * ACC_COL + 0.4 * S : 0) + rxMax;
      for (const n of sorted) {
        n.cx = baseX + (n.shift ? 1.8 * n.rx : 0);
        n.cy = yOf(n.pos);
      }
      for (const n of accNotes) {
        parts.push(accText(doc, n.acc, baseX - rxMax - 0.9 * S - n.accCol * ACC_COL, n.cy, noteClass('acc', n.cls)));
      }
      const minX = Math.min.apply(null, sorted.map(function (n) { return n.cx - n.rx; }));
      const maxX = Math.max.apply(null, sorted.map(function (n) { return n.cx + n.rx; }));
      const ledgers = [];
      for (const n of sorted) {
        for (const lp of ledgerPositions(n.pos)) {
          if (ledgers.indexOf(lp) === -1) ledgers.push(lp);
        }
      }
      for (const lp of ledgers) {
        parts.push(ledgerEl(doc, minX - LEDGER_EXT, maxX + LEDGER_EXT, yOf(lp), ''));
      }
      for (const n of sorted) parts.push(headEl(doc, n.cx, n.cy, n.dur, n.cls));
      if (noteList[0].dur !== 'w') {
        const sameCls = noteList.every(function (n) { return n.cls === noteList[0].cls; });
        const cls = sameCls ? noteList[0].cls : '';
        const avg = sorted.reduce(function (s, n) { return s + n.pos; }, 0) / sorted.length;
        const bot = sorted[0];
        const top = sorted[sorted.length - 1];
        if (avg < 4) parts.push(stemEl(doc, baseX + rxMax - 0.6, bot.cy, top.cy - STEM_LEN, cls));
        else parts.push(stemEl(doc, baseX - rxMax + 0.6, top.cy, bot.cy + STEM_LEN, cls));
      }
      right = Math.max(right, maxX);
    }

    const width = right + (noteList.length ? 2.2 * S : 0.8 * S);

    const svg = mk(doc, 'svg', {
      class: 'notation',
      viewBox: '0 0 ' + r2(width) + ' ' + HEIGHT,
      width: r2(width * PX_PER_UNIT * scale),
      height: r2(HEIGHT * PX_PER_UNIT * scale),
      role: 'img',
      style: 'display:block;margin:0 auto',
    });
    for (let i = 0; i < 5; i++) {
      svg.appendChild(mk(doc, 'line', {
        x1: 0, y1: r2(STAFF_TOP + i * S), x2: r2(width), y2: r2(STAFF_TOP + i * S),
        class: 'staff-line',
        stroke: 'currentColor',
        'stroke-width': 1.1,
        opacity: 0.55,
      }));
    }
    for (const p of parts) svg.appendChild(p);

    container.innerHTML = '';
    container.appendChild(svg);
    return svg;
  }

  function keySigOnly(container, opts) {
    opts = opts || {};
    return render(container, { clef: opts.clef, keySig: opts.keySig, notes: [] });
  }

  const Notation = { render: render, keySigOnly: keySigOnly };

  global.Notation = Notation;
  if (typeof module !== 'undefined' && module.exports) module.exports = Notation;
})(typeof window !== 'undefined' ? window : globalThis);
