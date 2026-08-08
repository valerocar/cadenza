(function (global) {
  'use strict';

  const WHITE_PC = [0, 2, 4, 5, 7, 9, 11];
  const SHARP_NAMES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
  const LETTER_PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  // Left edge of each black key, in white-key widths, from its preceding white key's left edge.
  const BLACK_OFFSET = { 1: 0.60, 3: 0.73, 6: 0.57, 8: 0.69, 10: 0.77 };
  const BLACK_WIDTH = 0.62;
  const HL_CLASSES = ['hl-target', 'hl-correct', 'hl-wrong', 'hl-accent', 'hl-dim'];
  const LABEL_MODES = ['none', 'c', 'white', 'all'];

  function nameToMidi(name) {
    const m = /^([A-Ga-g])(x|#{1,2}|b{1,2})?(-?\d)$/.exec(String(name).trim());
    if (!m) throw new Error('Keyboard: invalid note name "' + name + '"');
    let alter = 0;
    const acc = m[2] || '';
    if (acc === 'x') alter = 2;
    else if (acc[0] === '#') alter = acc.length;
    else if (acc[0] === 'b') alter = -acc.length;
    return (parseInt(m[3], 10) + 1) * 12 + LETTER_PC[m[1].toUpperCase()] + alter;
  }

  function isWhite(midi) {
    return WHITE_PC.indexOf(midi % 12) !== -1;
  }

  function octaveOf(midi) {
    return Math.floor(midi / 12) - 1;
  }

  function labelFor(midi, mode) {
    const pc = midi % 12;
    const white = isWhite(midi);
    if (mode === 'c') return white && pc === 0 ? 'C' + octaveOf(midi) : '';
    if (mode === 'white') return white ? SHARP_NAMES[pc] + octaveOf(midi) : '';
    if (mode === 'all') return white ? SHARP_NAMES[pc] + octaveOf(midi) : SHARP_NAMES[pc];
    return '';
  }

  function create(el, opts) {
    if (!el) throw new Error('Keyboard.create: container element required');
    const o = opts || {};
    let lo = nameToMidi(o.from || 'C3');
    let hi = nameToMidi(o.to || 'C6');
    if (lo > hi) throw new Error('Keyboard.create: "from" is above "to"');
    while (!isWhite(lo)) lo -= 1;
    while (!isWhite(hi)) hi += 1;

    const state = {
      interactive: o.interactive !== false,
      labels: LABEL_MODES.indexOf(o.labels) !== -1 ? o.labels : 'none',
      onPress: typeof o.onPress === 'function' ? o.onPress : null
    };

    while (el.firstChild) el.removeChild(el.firstChild);
    el.classList.add('piano');
    const keysEl = document.createElement('div');
    keysEl.className = 'piano-keys';

    let whiteCount = 0;
    for (let m = lo; m <= hi; m += 1) {
      if (isWhite(m)) whiteCount += 1;
    }
    const unit = 100 / whiteCount;

    const keys = [];
    const byMidi = new Map();
    const timers = new Map();

    function press(midi, ms) {
      const rec = byMidi.get(midi);
      if (!rec) return;
      const dur = typeof ms === 'number' && ms > 0 ? ms : 180;
      rec.el.classList.add('pressed');
      if (timers.has(midi)) clearTimeout(timers.get(midi));
      timers.set(midi, setTimeout(function () {
        timers.delete(midi);
        rec.el.classList.remove('pressed');
      }, dur));
    }

    function makeHandler(midi) {
      return function (ev) {
        if (!state.interactive) return;
        if (ev && typeof ev.preventDefault === 'function') ev.preventDefault();
        press(midi);
        if (state.onPress) state.onPress(midi);
      };
    }

    function keyName(midi) {
      return SHARP_NAMES[midi % 12] + octaveOf(midi);
    }

    let whiteIndex = -1;
    for (let m = lo; m <= hi; m += 1) {
      const white = isWhite(m);
      if (white) whiteIndex += 1;
      const key = document.createElement('div');
      key.className = 'piano-key ' + (white ? 'white' : 'black');
      key.dataset.midi = String(m);
      if (!white) {
        const left = (whiteIndex + BLACK_OFFSET[m % 12]) * unit;
        key.style.left = left.toFixed(4) + '%';
        key.style.width = (BLACK_WIDTH * unit).toFixed(4) + '%';
      }
      const label = document.createElement('span');
      label.className = 'piano-key-label';
      label.textContent = labelFor(m, state.labels);
      key.appendChild(label);
      const rec = { midi: m, white: white, el: key, labelEl: label, handler: makeHandler(m) };
      key.addEventListener('pointerdown', rec.handler);
      keys.push(rec);
      byMidi.set(m, rec);
    }

    for (let i = 0; i < keys.length; i += 1) {
      if (keys[i].white) keysEl.appendChild(keys[i].el);
    }
    for (let i = 0; i < keys.length; i += 1) {
      if (!keys[i].white) keysEl.appendChild(keys[i].el);
    }
    el.appendChild(keysEl);

    // Keyboard/screen-reader access: roving tabindex over the keys, arrows to
    // move chromatically, Enter/Space to play. Display-only pianos read as one
    // labeled image instead of dozens of dead stops.
    let focusMidi = lo;

    function applyA11y() {
      if (state.interactive) {
        keysEl.setAttribute('role', 'group');
        keysEl.setAttribute('aria-label', 'Piano keyboard, ' + keyName(lo) + ' to ' + keyName(hi) +
          '. Arrow keys move, Enter plays.');
        for (let i = 0; i < keys.length; i += 1) {
          const k = keys[i].el;
          k.setAttribute('role', 'button');
          k.setAttribute('aria-label', keyName(keys[i].midi));
          k.setAttribute('tabindex', keys[i].midi === focusMidi ? '0' : '-1');
        }
      } else {
        keysEl.setAttribute('role', 'img');
        keysEl.setAttribute('aria-label', 'Piano keyboard diagram, ' + keyName(lo) + ' to ' + keyName(hi));
        for (let i = 0; i < keys.length; i += 1) {
          const k = keys[i].el;
          k.removeAttribute('role');
          k.removeAttribute('aria-label');
          k.removeAttribute('tabindex');
        }
      }
    }

    function moveFocus(midi) {
      if (midi < lo || midi > hi) return;
      const prev = byMidi.get(focusMidi);
      if (prev) prev.el.setAttribute('tabindex', '-1');
      focusMidi = midi;
      const rec = byMidi.get(focusMidi);
      if (rec) {
        rec.el.setAttribute('tabindex', '0');
        if (typeof rec.el.focus === 'function') rec.el.focus();
      }
    }

    function onKeysKeydown(ev) {
      if (!state.interactive) return;
      const target = ev.target;
      const midi = target && target.dataset ? parseInt(target.dataset.midi, 10) : NaN;
      if (isNaN(midi)) return;
      const k = ev.key;
      if (k === 'ArrowRight' || k === 'ArrowUp') { ev.preventDefault(); moveFocus(midi + 1); }
      else if (k === 'ArrowLeft' || k === 'ArrowDown') { ev.preventDefault(); moveFocus(midi - 1); }
      else if (k === 'Home') { ev.preventDefault(); moveFocus(lo); }
      else if (k === 'End') { ev.preventDefault(); moveFocus(hi); }
      else if (k === 'Enter' || k === ' ') {
        ev.preventDefault();
        press(midi);
        if (state.onPress) state.onPress(midi);
      }
    }

    keysEl.addEventListener('keydown', onKeysKeydown);
    applyA11y();

    function stripHighlights(keyEl) {
      for (let i = 0; i < HL_CLASSES.length; i += 1) keyEl.classList.remove(HL_CLASSES[i]);
    }

    function highlight(midi, cls) {
      const rec = byMidi.get(midi);
      if (!rec) return;
      stripHighlights(rec.el);
      const full = 'hl-' + cls;
      if (HL_CLASSES.indexOf(full) !== -1) rec.el.classList.add(full);
    }

    function unhighlight(midi) {
      const rec = byMidi.get(midi);
      if (rec) stripHighlights(rec.el);
    }

    function clearHighlights() {
      for (let i = 0; i < keys.length; i += 1) stripHighlights(keys[i].el);
    }

    function setLabels(mode) {
      if (LABEL_MODES.indexOf(mode) === -1) return;
      state.labels = mode;
      for (let i = 0; i < keys.length; i += 1) {
        keys[i].labelEl.textContent = labelFor(keys[i].midi, mode);
      }
    }

    function setInteractive(on) {
      state.interactive = !!on;
      applyA11y();
    }

    function range() {
      return [lo, hi];
    }

    function destroy() {
      timers.forEach(function (t) { clearTimeout(t); });
      timers.clear();
      for (let i = 0; i < keys.length; i += 1) {
        keys[i].el.removeEventListener('pointerdown', keys[i].handler);
      }
      keysEl.removeEventListener('keydown', onKeysKeydown);
      if (keysEl.parentNode === el) el.removeChild(keysEl);
      el.classList.remove('piano');
    }

    return {
      el: el,
      highlight: highlight,
      unhighlight: unhighlight,
      clearHighlights: clearHighlights,
      press: press,
      setLabels: setLabels,
      setInteractive: setInteractive,
      range: range,
      destroy: destroy
    };
  }

  const Keyboard = { create: create };
  global.Keyboard = Keyboard;
  if (typeof module !== 'undefined' && module.exports) module.exports = Keyboard;
})(typeof window !== 'undefined' ? window : globalThis);
