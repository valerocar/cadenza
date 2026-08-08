// Headless test for js/notation.js — stubs document/createElementNS,
// records elements + attributes, and asserts staff geometry.
import { createRequire } from 'node:module';

class StubEl {
  constructor(tag) {
    this.tagName = tag;
    this.attrs = {};
    this.children = [];
    this.textContent = '';
    this.parentNode = null;
  }
  setAttribute(k, v) { this.attrs[k] = String(v); }
  getAttribute(k) { return k in this.attrs ? this.attrs[k] : null; }
  appendChild(c) { c.parentNode = this; this.children.push(c); return c; }
  set innerHTML(v) { if (v === '') this.children = []; }
  get innerHTML() { return ''; }
}

globalThis.document = {
  createElementNS(ns, tag) { const e = new StubEl(tag); e.namespaceURI = ns; return e; },
  createElement(tag) { return new StubEl(tag); },
};

const require = createRequire(import.meta.url);
const Notation = require('../js/notation.js');

let passed = 0;
let failed = 0;
function ok(cond, msg) {
  if (cond) { passed++; return; }
  failed++;
  console.error('FAIL: ' + msg);
}
function eq(got, want, msg) {
  if (got === want) { passed++; return; }
  failed++;
  const show = (v) => (v instanceof StubEl ? '<' + v.tagName + '>' : JSON.stringify(v));
  console.error('FAIL: ' + msg + ' (got ' + show(got) + ', want ' + show(want) + ')');
}
function near(got, want, msg) {
  ok(Math.abs(got - want) < 0.02, msg + ' (got ' + got + ', want ~' + want + ')');
}

function all(node, pred, out = []) {
  for (const c of node.children) {
    if (pred(c)) out.push(c);
    all(c, pred, out);
  }
  return out;
}
const num = (e, k) => parseFloat(e.attrs[k]);
const hasClass = (e, c) => ('' + (e.attrs.class || '')).split(/\s+/).includes(c);
const byClass = (svg, c) => all(svg, (e) => hasClass(e, c));

function draw(opts) {
  const host = new StubEl('div');
  const svg = Notation.render(host, opts);
  ok(host.children.length === 1 && host.children[0] === svg, 'render clears host and appends the svg');
  return svg;
}

const S = 12;
const BOTTOM = 96;   // bottom staff line y (staff top = 4S = 48)
const TOP = 48;

// --- staff scaffolding ---
{
  const svg = draw({ clef: 'treble', notes: [{ l: 'E', a: 0, o: 4 }] });
  ok(hasClass(svg, 'notation'), 'svg has class notation');
  ok(/^0 0 [\d.]+ 144$/.test(svg.attrs.viewBox), 'viewBox is 0 0 W 144 (12S tall)');
  const lines = byClass(svg, 'staff-line');
  eq(lines.length, 5, 'five staff lines');
  const ys = lines.map((l) => num(l, 'y1')).sort((a, b) => a - b);
  eq(ys.join(','), '48,60,72,84,96', 'staff lines at S=12 spacing from y=48');
  const w = num(lines[0], 'x2');
  ok(lines.every((l) => num(l, 'x2') === w && num(l, 'x1') === 0), 'staff lines span full width');
  ok(lines.every((l) => l.attrs.stroke === 'currentColor'), 'staff lines use currentColor');
  const clefs = byClass(svg, 'clef');
  eq(clefs.length, 1, 'one clef glyph');
  eq(clefs[0].textContent, '\u{1D11E}', 'treble clef glyph');
  ok(clefs[0].attrs['font-family'].includes('Bravura Text'), 'clef uses the spec font stack');
  eq(num(clefs[0], 'y'), 84, 'treble clef anchored on the G4 line');
}

// --- staff-position math (diatonic, spelling-derived) ---
{
  const svg = draw({ clef: 'treble', notes: [{ l: 'E', a: 0, o: 4 }] });
  const heads = byClass(svg, 'head');
  eq(heads.length, 1, 'one notehead');
  eq(num(heads[0], 'cy'), BOTTOM, 'E4 sits on the bottom treble line');
  ok(hasClass(heads[0], 'note'), 'notehead carries class note');
}
{
  const svg = draw({ clef: 'treble', notes: [{ l: 'F', a: 0, o: 5 }] });
  eq(num(byClass(svg, 'head')[0], 'cy'), TOP, 'F5 sits on the top treble line');
}
{
  const svg = draw({ clef: 'treble', notes: [{ l: 'B', a: 0, o: 4 }] });
  eq(num(byClass(svg, 'head')[0], 'cy'), 72, 'B4 sits on the middle treble line');
}
{
  const svg = draw({ clef: 'bass', notes: [{ l: 'G', a: 0, o: 2 }] });
  eq(byClass(svg, 'clef')[0].textContent, '\u{1D122}', 'bass clef glyph');
  eq(num(byClass(svg, 'head')[0], 'cy'), BOTTOM, 'G2 sits on the bottom bass line');
}
{
  const svg = draw({ clef: 'bass', notes: [{ l: 'D', a: 0, o: 3 }] });
  eq(num(byClass(svg, 'head')[0], 'cy'), 72, 'D3 sits on the middle bass line');
}
{
  // spelling matters: C#4 and Db4 occupy different staff positions
  const sharp = draw({ clef: 'treble', notes: [{ l: 'C', a: 1, o: 4 }] });
  const flat = draw({ clef: 'treble', notes: [{ l: 'D', a: -1, o: 4 }] });
  eq(num(byClass(sharp, 'head')[0], 'cy'), 108, 'C#4 on the C line (one ledger below)');
  eq(num(byClass(flat, 'head')[0], 'cy'), 102, 'Db4 in the D space');
}

// --- ledger lines ---
{
  const svg = draw({ clef: 'treble', notes: [{ l: 'C', a: 0, o: 4 }] });
  const head = byClass(svg, 'head')[0];
  eq(num(head, 'cy'), 108, 'C4 one ledger position below the staff');
  const ledgers = byClass(svg, 'ledger');
  eq(ledgers.length, 1, 'C4 emits exactly one ledger line');
  eq(num(ledgers[0], 'y1'), 108, 'C4 ledger line passes through the notehead');
  ok(num(ledgers[0], 'x1') < num(head, 'cx') - num(head, 'rx'), 'ledger extends left past the head');
  ok(num(ledgers[0], 'x2') > num(head, 'cx') + num(head, 'rx'), 'ledger extends right past the head');
}
{
  const svg = draw({ clef: 'treble', notes: [{ l: 'C', a: 0, o: 6 }] });
  const ys = byClass(svg, 'ledger').map((l) => num(l, 'y1')).sort((a, b) => a - b);
  eq(ys.join(','), '24,36', 'C6 emits ledger lines at positions 10 and 12 above');
}
{
  const svg = draw({ clef: 'treble', notes: [{ l: 'B', a: 0, o: 3 }] });
  const ledgers = byClass(svg, 'ledger');
  eq(ledgers.length, 1, 'B3 (space below first ledger) still gets the C4 ledger');
  eq(num(ledgers[0], 'y1'), 108, 'B3 ledger sits above the note at the C4 line');
}
{
  const svg = draw({ clef: 'treble', notes: [{ l: 'G', a: 0, o: 5 }] });
  eq(byClass(svg, 'ledger').length, 0, 'G5 (space just above staff) needs no ledger');
}

// --- stems ---
{
  const svg = draw({ clef: 'treble', notes: [{ l: 'B', a: 0, o: 4 }] });
  const head = byClass(svg, 'head')[0];
  const stems = byClass(svg, 'stem');
  eq(stems.length, 1, 'B4 quarter has one stem');
  ok(num(stems[0], 'x1') < num(head, 'cx'), 'B4 (middle line) stem on the LEFT side');
  eq(Math.max(num(stems[0], 'y1'), num(stems[0], 'y2')), num(head, 'cy') + 42, 'B4 stem goes DOWN 3.5S');
}
{
  const svg = draw({ clef: 'treble', notes: [{ l: 'A', a: 0, o: 4 }] });
  const head = byClass(svg, 'head')[0];
  const stem = byClass(svg, 'stem')[0];
  ok(num(stem, 'x1') > num(head, 'cx'), 'A4 (below middle) stem on the RIGHT side');
  eq(Math.min(num(stem, 'y1'), num(stem, 'y2')), num(head, 'cy') - 42, 'A4 stem goes UP 3.5S');
}
{
  const svg = draw({ clef: 'bass', notes: [{ l: 'A', a: 0, o: 2 }] });
  const head = byClass(svg, 'head')[0];
  const stem = byClass(svg, 'stem')[0];
  ok(num(stem, 'x1') > num(head, 'cx'), 'A2 in bass (below middle) stem up on the right');
}

// --- durations ---
{
  const svg = draw({ clef: 'treble', notes: [{ l: 'G', a: 0, o: 4, dur: 'w' }] });
  eq(byClass(svg, 'stem').length, 0, 'whole note has no stem');
  const head = byClass(svg, 'head')[0];
  eq(num(head, 'rx'), 10.2, 'whole notehead is wider (0.85S)');
  eq(head.attrs.fill, 'none', 'whole notehead hollow');
}
{
  const svg = draw({ clef: 'treble', notes: [{ l: 'G', a: 0, o: 4, dur: 'h' }] });
  const head = byClass(svg, 'head')[0];
  eq(head.attrs.fill, 'none', 'half notehead hollow');
  eq(head.attrs.stroke, 'currentColor', 'half notehead outlined in currentColor');
  eq(byClass(svg, 'stem').length, 1, 'half note has a stem');
  eq(num(head, 'rx'), 8.16, 'half notehead rx = 0.68S');
}
{
  const svg = draw({ clef: 'treble', notes: [{ l: 'G', a: 0, o: 4 }] });
  const head = byClass(svg, 'head')[0];
  eq(head.attrs.fill, 'currentColor', 'quarter notehead filled');
  ok(head.attrs.transform.startsWith('rotate(-20'), 'notehead rotated -20deg');
}

// --- key signatures ---
{
  const svg = draw({ clef: 'treble', keySig: 3, notes: [] });
  const sig = byClass(svg, 'keysig');
  eq(sig.length, 3, 'A major shows 3 sharps');
  ok(sig.every((t) => t.textContent === '♯'), 'sharp glyphs used');
  const xs = sig.map((t) => num(t, 'x'));
  ok(xs[0] < xs[1] && xs[1] < xs[2], 'key signature glyphs ordered left to right');
  const clefX = num(byClass(svg, 'clef')[0], 'x');
  ok(xs[0] > clefX, 'key signature sits right of the clef');
  eq(sig.map((t) => num(t, 'y')).join(','), '48,66,42', 'treble sharps at F5 C5 G5');
}
{
  const svg = draw({ clef: 'treble', keySig: -4, notes: [] });
  const sig = byClass(svg, 'keysig');
  eq(sig.length, 4, 'Ab major shows 4 flats');
  ok(sig.every((t) => t.textContent === '♭'), 'flat glyphs used');
  eq(sig.map((t) => num(t, 'y')).join(','), '72,54,78,60', 'treble flats at B4 E5 A4 D5');
}
{
  const svg = draw({ clef: 'bass', keySig: 2, notes: [] });
  const sig = byClass(svg, 'keysig');
  eq(sig.map((t) => num(t, 'y')).join(','), '60,78', 'bass sharps at F3 C3 (standard positions)');
}
{
  const svg = draw({ clef: 'bass', keySig: -2, notes: [] });
  const sig = byClass(svg, 'keysig');
  eq(sig.map((t) => num(t, 'y')).join(','), '84,66', 'bass flats at B2 E3 (standard positions)');
}
{
  const svg = draw({ clef: 'treble', keySig: 7, notes: [] });
  eq(byClass(svg, 'keysig').length, 7, 'C# major shows all 7 sharps');
}

// --- accidental display logic ---
{
  const svg = draw({ clef: 'treble', notes: [{ l: 'B', a: -1, o: 4 }] });
  const accs = byClass(svg, 'acc');
  eq(accs.length, 1, 'Bb4 with no key signature draws a flat');
  eq(accs[0].textContent, '♭', 'flat glyph');
  const head = byClass(svg, 'head')[0];
  ok(num(accs[0], 'x') < num(head, 'cx') - num(head, 'rx'), 'accidental sits left of the head');
  eq(num(accs[0], 'y'), num(head, 'cy'), 'accidental vertically on the note position');
}
{
  const svg = draw({ clef: 'treble', keySig: 2, notes: [{ l: 'F', a: 1, o: 5 }] });
  eq(byClass(svg, 'acc').length, 0, 'F#5 under D major: key signature covers it, no glyph');
}
{
  const svg = draw({ clef: 'treble', keySig: 2, notes: [{ l: 'F', a: 0, o: 5 }] });
  const accs = byClass(svg, 'acc');
  eq(accs.length, 1, 'F natural under D major needs a natural sign');
  eq(accs[0].textContent, '♮', 'natural glyph');
}
{
  const svg = draw({ clef: 'treble', keySig: -3, notes: [{ l: 'E', a: -1, o: 5 }] });
  eq(byClass(svg, 'acc').length, 0, 'Eb under Eb major covered by key signature');
}
{
  const svg = draw({ clef: 'treble', notes: [{ l: 'C', a: 1, o: 5, noAcc: true }] });
  eq(byClass(svg, 'acc').length, 0, 'noAcc suppresses the accidental');
}
{
  const svg = draw({ clef: 'treble', notes: [{ l: 'G', a: 0, o: 4 }] });
  eq(byClass(svg, 'acc').length, 0, 'natural note with no key signature draws nothing');
}
{
  const svg = draw({ clef: 'treble', notes: [{ l: 'F', a: 2, o: 4 }] });
  eq(byClass(svg, 'acc')[0].textContent, '\u{1D12A}', 'double sharp glyph for a=2');
}

// --- state classes ---
{
  const svg = draw({ clef: 'treble', notes: [{ l: 'A', a: 1, o: 4, cls: 'correct' }] });
  const head = byClass(svg, 'head')[0];
  const stem = byClass(svg, 'stem')[0];
  const acc = byClass(svg, 'acc')[0];
  ok(hasClass(head, 'note') && hasClass(head, 'correct'), 'notehead gets note + cls');
  ok(hasClass(stem, 'note') && hasClass(stem, 'correct'), 'stem gets note + cls');
  ok(hasClass(acc, 'note') && hasClass(acc, 'correct'), 'accidental gets note + cls');
  ok(!('style' in head.attrs), 'no inline style on notehead (currentColor only)');
}

// --- sequence spacing ---
{
  const seq = [{ l: 'C', a: 0, o: 5 }, { l: 'D', a: 0, o: 5 }];
  const normal = draw({ clef: 'treble', notes: seq, gap: 'normal' });
  const wide = draw({ clef: 'treble', notes: seq, gap: 'wide' });
  const dx = (svg) => {
    const xs = byClass(svg, 'head').map((h) => num(h, 'cx'));
    return xs[1] - xs[0];
  };
  near(dx(normal), 54, 'normal gap advances 4.5S between notes');
  near(dx(wide), 78, 'wide gap advances 6.5S');
}

// --- chord mode ---
{
  const svg = draw({
    clef: 'treble', chord: true,
    notes: [{ l: 'C', a: 0, o: 4 }, { l: 'E', a: 0, o: 4 }, { l: 'G', a: 0, o: 4 }],
  });
  const heads = byClass(svg, 'head');
  eq(heads.length, 3, 'triad renders three heads');
  const xs = heads.map((h) => num(h, 'cx'));
  ok(xs[0] === xs[1] && xs[1] === xs[2], 'stacked thirds share one x');
  eq(byClass(svg, 'stem').length, 1, 'chord shares a single stem');
  const stem = byClass(svg, 'stem')[0];
  ok(num(stem, 'x1') > xs[0], 'C4-E4-G4 chord stems up on the right');
  eq(Math.min(num(stem, 'y1'), num(stem, 'y2')), 84 - 42, 'chord stem extends 3.5S past the top head');
  eq(Math.max(num(stem, 'y1'), num(stem, 'y2')), 108, 'chord stem reaches the bottom head');
  eq(byClass(svg, 'ledger').length, 1, 'chord emits one shared C4 ledger');
}
{
  const svg = draw({
    clef: 'treble', chord: true,
    notes: [{ l: 'C', a: 0, o: 4 }, { l: 'D', a: 0, o: 4 }],
  });
  const heads = byClass(svg, 'head');
  const lower = heads.find((h) => num(h, 'cy') === 108);
  const upper = heads.find((h) => num(h, 'cy') === 102);
  ok(lower && upper, 'second: both heads present at their own positions');
  ok(num(upper, 'cx') > num(lower, 'cx'), 'second: upper note offset to the RIGHT');
  near(num(upper, 'cx') - num(lower, 'cx'), 14.69, 'second offset is ~1.8rx (heads touch)');
}
{
  const svg = draw({
    clef: 'treble', chord: true,
    notes: [{ l: 'C', a: 0, o: 5 }, { l: 'E', a: 0, o: 5 }, { l: 'G', a: 0, o: 5 }],
  });
  const stem = byClass(svg, 'stem')[0];
  const xs = byClass(svg, 'head').map((h) => num(h, 'cx'));
  ok(num(stem, 'x1') < Math.min(...xs), 'high chord stems down on the left');
}
{
  const svg = draw({
    clef: 'treble', chord: true,
    notes: [
      { l: 'F', a: 1, o: 4 }, { l: 'A', a: 1, o: 4 }, { l: 'C', a: 1, o: 5 },
    ],
  });
  const accs = byClass(svg, 'acc');
  eq(accs.length, 3, 'F# major triad draws three sharps');
  const xs = accs.map((a) => num(a, 'x'));
  eq(new Set(xs).size, 3, 'close-stacked accidentals fan into distinct columns');
  const heads = byClass(svg, 'head');
  const minHeadEdge = Math.min(...heads.map((h) => num(h, 'cx') - num(h, 'rx')));
  ok(Math.max(...xs) < minHeadEdge, 'all chord accidentals sit left of the heads');
}
{
  const svg = draw({
    clef: 'treble', chord: true,
    notes: [{ l: 'E', a: 0, o: 4, dur: 'w' }, { l: 'G', a: 0, o: 4, dur: 'w' }],
  });
  eq(byClass(svg, 'stem').length, 0, 'whole-note chord has no stem');
}

// --- keySigOnly ---
{
  const host = new StubEl('div');
  const svg = Notation.keySigOnly(host, { clef: 'treble', keySig: 5 });
  eq(host.children[0], svg, 'keySigOnly appends the svg to the host');
  eq(byClass(svg, 'keysig').length, 5, 'keySigOnly renders 5 sharps for B major');
  eq(byClass(svg, 'head').length, 0, 'keySigOnly renders no notes');
  eq(byClass(svg, 'clef').length, 1, 'keySigOnly renders the clef');
}

// --- sizing ---
{
  const one = draw({ clef: 'treble', notes: [{ l: 'G', a: 0, o: 4 }], scale: 1 });
  const two = draw({ clef: 'treble', notes: [{ l: 'G', a: 0, o: 4 }], scale: 2 });
  eq(num(two, 'width'), 2 * num(one, 'width'), 'scale doubles rendered width');
  eq(num(two, 'height'), 2 * num(one, 'height'), 'scale doubles rendered height');
  eq(one.attrs.viewBox, two.attrs.viewBox, 'viewBox independent of scale');
  eq(num(one, 'height'), 168, 'default height 144 units at 56px staff = 168px');
  const longer = draw({ clef: 'treble', notes: [
    { l: 'C', a: 0, o: 5 }, { l: 'D', a: 0, o: 5 }, { l: 'E', a: 0, o: 5 },
  ] });
  ok(num(longer, 'width') > num(one, 'width'), 'width grows with content');
}

console.log('notation.test: ' + passed + ' passed, ' + failed + ' failed');
process.exit(failed ? 1 : 0);
