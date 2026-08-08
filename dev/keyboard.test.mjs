// Tests for js/keyboard.js using a minimal DOM stub. Run: node dev/keyboard.test.mjs
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

function makeEl(tag) {
  const el = {
    tagName: String(tag).toUpperCase(),
    children: [],
    parentNode: null,
    dataset: {},
    style: {},
    textContent: '',
    _classes: new Set(),
    _listeners: {},
    _attrs: {}
  };
  el.setAttribute = (k, v) => { el._attrs[k] = String(v); };
  el.getAttribute = (k) => (k in el._attrs ? el._attrs[k] : null);
  el.removeAttribute = (k) => { delete el._attrs[k]; };
  el.focus = () => { el._focused = true; };
  Object.defineProperty(el, 'className', {
    get() { return Array.from(el._classes).join(' '); },
    set(v) { el._classes = new Set(String(v).split(/\s+/).filter(Boolean)); }
  });
  Object.defineProperty(el, 'firstChild', {
    get() { return el.children.length ? el.children[0] : null; }
  });
  el.classList = {
    add(...cs) { cs.forEach((c) => el._classes.add(c)); },
    remove(...cs) { cs.forEach((c) => el._classes.delete(c)); },
    contains(c) { return el._classes.has(c); }
  };
  el.appendChild = (child) => {
    child.parentNode = el;
    el.children.push(child);
    return child;
  };
  el.removeChild = (child) => {
    const i = el.children.indexOf(child);
    if (i >= 0) el.children.splice(i, 1);
    child.parentNode = null;
    return child;
  };
  el.addEventListener = (type, fn) => {
    (el._listeners[type] = el._listeners[type] || []).push(fn);
  };
  el.removeEventListener = (type, fn) => {
    const a = el._listeners[type] || [];
    const i = a.indexOf(fn);
    if (i >= 0) a.splice(i, 1);
  };
  el.dispatch = (type, ev) => {
    (el._listeners[type] || []).slice().forEach((fn) => fn(ev));
  };
  return el;
}

globalThis.document = { createElement: makeEl };

const Keyboard = require('../js/keyboard.js');

let passed = 0;
let failed = 0;
function ok(cond, msg) {
  if (cond) {
    passed += 1;
  } else {
    failed += 1;
    console.error('FAIL: ' + msg);
  }
}
function eq(actual, expected, msg) {
  ok(Object.is(actual, expected), msg + ' (expected ' + JSON.stringify(expected) + ', got ' + JSON.stringify(actual) + ')');
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function allKeys(kb) {
  const keysEl = kb.el.children.find((c) => c.classList.contains('piano-keys'));
  return keysEl.children.filter((c) => c.classList.contains('piano-key'));
}
function keyByMidi(kb, midi) {
  return allKeys(kb).find((k) => k.dataset.midi === String(midi));
}
function labelSpan(key) {
  return key.children.find((c) => c.classList.contains('piano-key-label'));
}

// --- Structure: C3–C6 ---
const container = makeEl('div');
const pressLog = [];
const kb = Keyboard.create(container, {
  from: 'C3',
  to: 'C6',
  labels: 'none',
  onPress: (m) => pressLog.push(m)
});

ok(container.classList.contains('piano'), 'container gets class piano');
const keysEl = container.children.find((c) => c.classList.contains('piano-keys'));
ok(!!keysEl, 'inner element has class piano-keys');

const keys = allKeys(kb);
const whites = keys.filter((k) => k.classList.contains('white'));
const blacks = keys.filter((k) => k.classList.contains('black'));
eq(whites.length, 22, 'C3-C6 has 22 white keys');
eq(blacks.length, 15, 'C3-C6 has 15 black keys');
eq(keys.length, 37, 'C3-C6 has 37 keys total');

// data-midi values: exactly midis 48..84, each exactly once
const midis = keys.map((k) => parseInt(k.dataset.midi, 10)).sort((a, b) => a - b);
eq(midis.length, 37, 'every key carries data-midi');
let midisContiguous = true;
for (let i = 0; i < midis.length; i += 1) {
  if (midis[i] !== 48 + i) midisContiguous = false;
}
ok(midisContiguous, 'data-midi values are exactly 48..84 with no gaps or dupes');
const WHITE_PC = [0, 2, 4, 5, 7, 9, 11];
ok(
  whites.every((k) => WHITE_PC.includes(parseInt(k.dataset.midi, 10) % 12)),
  'white keys all have white pitch classes'
);
ok(
  blacks.every((k) => !WHITE_PC.includes(parseInt(k.dataset.midi, 10) % 12)),
  'black keys all have black pitch classes'
);
eq(kb.range()[0], 48, 'range() low is C3=48');
eq(kb.range()[1], 84, 'range() high is C6=84');

// White keys carry no positioning styles (they flex); blacks carry only left/width %
ok(
  whites.every((k) => k.style.left === undefined && k.style.width === undefined),
  'white keys have no inline geometry styles'
);
ok(
  blacks.every((k) => /^[\d.]+%$/.test(k.style.left) && /^[\d.]+%$/.test(k.style.width)),
  'black keys have percentage left and width'
);

// Black key positions: strictly increasing, within (0,100), right edge inside span
const sortedBlacks = blacks
  .slice()
  .sort((a, b) => parseInt(a.dataset.midi, 10) - parseInt(b.dataset.midi, 10));
let prevLeft = -1;
let increasing = true;
let inBounds = true;
for (const k of sortedBlacks) {
  const left = parseFloat(k.style.left);
  const width = parseFloat(k.style.width);
  if (!(left > prevLeft)) increasing = false;
  if (!(left > 0 && left < 100 && left + width < 100)) inBounds = false;
  prevLeft = left;
}
ok(increasing, 'black key left percentages strictly increase with midi');
ok(inBounds, 'black key spans lie strictly within (0,100)% of the keyboard');
const blackW = parseFloat(sortedBlacks[0].style.width);
const whiteW = 100 / 22;
ok(Math.abs(blackW - 0.62 * whiteW) < 0.01, 'black key width is ~62% of a white key width');

// --- Labels ---
ok(keys.every((k) => labelSpan(k) && labelSpan(k).textContent === ''), 'labels mode none: all label spans empty');

kb.setLabels('c');
eq(labelSpan(keyByMidi(kb, 60)).textContent, 'C4', 'mode c: C4 key labeled C4');
eq(labelSpan(keyByMidi(kb, 48)).textContent, 'C3', 'mode c: C3 key labeled C3');
eq(labelSpan(keyByMidi(kb, 62)).textContent, '', 'mode c: D4 unlabeled');
eq(labelSpan(keyByMidi(kb, 61)).textContent, '', 'mode c: C#4 unlabeled');

kb.setLabels('white');
eq(labelSpan(keyByMidi(kb, 64)).textContent, 'E4', 'mode white: E4 labeled with octave');
eq(labelSpan(keyByMidi(kb, 83)).textContent, 'B5', 'mode white: B5 labeled with octave');
eq(labelSpan(keyByMidi(kb, 61)).textContent, '', 'mode white: black keys unlabeled');

kb.setLabels('all');
const cSharp4 = labelSpan(keyByMidi(kb, 61)).textContent;
ok(cSharp4 === 'C♯4' || cSharp4 === 'C♯', 'mode all: C#4 labeled C♯4 or C♯ (got ' + JSON.stringify(cSharp4) + ')');
const fSharp3 = labelSpan(keyByMidi(kb, 54)).textContent;
ok(fSharp3 === 'F♯3' || fSharp3 === 'F♯', 'mode all: F#3 uses sharp name');
ok(labelSpan(keyByMidi(kb, 67)).textContent.startsWith('G'), 'mode all: white keys labeled too');

kb.setLabels('bogus');
const stillAll = labelSpan(keyByMidi(kb, 61)).textContent;
ok(stillAll === 'C♯4' || stillAll === 'C♯', 'invalid label mode is ignored');
kb.setLabels('none');

// --- Highlights ---
const k60 = keyByMidi(kb, 60);
kb.highlight(60, 'target');
ok(k60.classList.contains('hl-target'), 'highlight target adds hl-target');
kb.highlight(60, 'correct');
ok(k60.classList.contains('hl-correct') && !k60.classList.contains('hl-target'),
  'second highlight replaces the first');
kb.unhighlight(60);
ok(!k60.classList.contains('hl-correct'), 'unhighlight removes highlight class');

kb.highlight(60, 'wrong');
kb.highlight(64, 'accent');
kb.highlight(67, 'dim');
ok(k60.classList.contains('hl-wrong'), 'hl-wrong applied');
ok(keyByMidi(kb, 64).classList.contains('hl-accent'), 'hl-accent applied');
ok(keyByMidi(kb, 67).classList.contains('hl-dim'), 'hl-dim applied');
kb.clearHighlights();
ok(
  keys.every((k) => ['hl-target', 'hl-correct', 'hl-wrong', 'hl-accent', 'hl-dim']
    .every((c) => !k.classList.contains(c))),
  'clearHighlights removes every highlight class'
);
kb.highlight(60, 'nonsense');
ok(!k60.className.includes('hl-'), 'unknown highlight class is rejected');
kb.highlight(999, 'target'); // out of range: must not throw
ok(true, 'highlight on unknown midi is a no-op');

// --- Pointer interaction ---
let prevented = 0;
const ev = { preventDefault() { prevented += 1; } };
keyByMidi(kb, 61).dispatch('pointerdown', ev);
eq(pressLog.length, 1, 'pointerdown fires onPress once');
eq(pressLog[0], 61, 'onPress receives the midi of the pressed key');
eq(prevented, 1, 'pointerdown calls preventDefault (touch scroll/zoom guard)');
ok(keyByMidi(kb, 61).classList.contains('pressed'), 'pointerdown adds transient pressed class');

kb.setInteractive(false);
keyByMidi(kb, 62).dispatch('pointerdown', { preventDefault() { prevented += 1; } });
eq(pressLog.length, 1, 'setInteractive(false) disables onPress');
eq(prevented, 1, 'non-interactive keyboard does not preventDefault');
kb.setInteractive(true);
keyByMidi(kb, 62).dispatch('pointerdown', { preventDefault() {} });
eq(pressLog.length, 2, 'setInteractive(true) re-enables onPress');

// --- press() timing + timer cleanup on repeated calls ---
kb.press(72, 100);
ok(keyByMidi(kb, 72).classList.contains('pressed'), 'press() adds pressed class');
await sleep(60);
kb.press(72, 100); // must reset the pending timer
await sleep(60); // t=120 past the FIRST timer's deadline
ok(keyByMidi(kb, 72).classList.contains('pressed'),
  'repeated press() cancels the earlier removal timer');
await sleep(80); // t=200, second timer (fires at t=160) has run
ok(!keyByMidi(kb, 72).classList.contains('pressed'), 'pressed class removed after duration');
await sleep(200); // let the pointerdown presses above expire too
ok(!keyByMidi(kb, 61).classList.contains('pressed'), 'pointerdown pressed class is transient');

// --- Range clamping outward to white keys ---
const c2 = makeEl('div');
const kb2 = Keyboard.create(c2, { from: 'C#3', to: 'Eb5' });
eq(kb2.range()[0], 48, 'black from-bound clamps DOWN to white C3');
eq(kb2.range()[1], 76, 'black to-bound clamps UP to white E5');
ok(allKeys(kb2).every((k) => {
  const m = parseInt(k.dataset.midi, 10);
  return m >= 48 && m <= 76;
}), 'clamped keyboard contains only keys within the clamped range');
kb2.destroy();

// --- destroy() ---
const k61 = keyByMidi(kb, 61);
kb.destroy();
ok((k61._listeners.pointerdown || []).length === 0, 'destroy removes pointerdown listeners');
ok(!container.classList.contains('piano'), 'destroy removes piano class from container');
ok(!container.children.some((c) => c.classList.contains('piano-keys')), 'destroy detaches piano-keys element');
const logLen = pressLog.length;
k61.dispatch('pointerdown', { preventDefault() {} });
eq(pressLog.length, logLen, 'no onPress after destroy');

// --- accessibility: roving tabindex + arrow navigation ---
const c3 = makeEl('div');
const pressed3 = [];
const kb3 = Keyboard.create(c3, { from: 'C4', to: 'C5', onPress: (m) => pressed3.push(m) });
const keysEl3 = kb3.el.children.find((c) => c.classList.contains('piano-keys'));
eq(keysEl3.getAttribute('role'), 'group', 'interactive keyboard is a labeled group');
eq(keyByMidi(kb3, 60).getAttribute('tabindex'), '0', 'first key is the roving tab stop');
eq(keyByMidi(kb3, 61).getAttribute('tabindex'), '-1', 'other keys are not tab stops');
eq(keyByMidi(kb3, 61).getAttribute('aria-label'), 'C♯4', 'keys carry note-name aria-labels');
keysEl3.dispatch('keydown', { key: 'ArrowRight', target: keyByMidi(kb3, 60), preventDefault() {} });
eq(keyByMidi(kb3, 61).getAttribute('tabindex'), '0', 'ArrowRight moves the tab stop chromatically');
eq(keyByMidi(kb3, 60).getAttribute('tabindex'), '-1', 'previous key gives up the tab stop');
keysEl3.dispatch('keydown', { key: 'Enter', target: keyByMidi(kb3, 61), preventDefault() {} });
eq(pressed3[pressed3.length - 1], 61, 'Enter plays the focused key');
kb3.setInteractive(false);
eq(keysEl3.getAttribute('role'), 'img', 'non-interactive keyboard reads as one image');
ok(keyByMidi(kb3, 60).getAttribute('tabindex') === null, 'static keys are not focusable');
kb3.destroy();

console.log(passed + ' passed, ' + failed + ' failed');
process.exit(failed === 0 ? 0 : 1);
