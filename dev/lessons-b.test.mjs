import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const LessonsB = require('../js/lessons-b.js');

const errors = [];
const err = (msg) => errors.push(msg);

const UNIT_IDS = ['u7', 'u8', 'u9', 'u10', 'u11', 'u12'];
const DEMO_KINDS = ['keyboard', 'staff', 'play', 'circle5', 'tiles'];
const HL_CLS = ['target', 'correct', 'wrong', 'accent', 'dim'];
const NOTE_CLS = ['', 'correct', 'wrong', 'muted', 'accent'];
const LABEL_MODES = ['none', 'c', 'white', 'all'];
const TILE_IDS = ['w', 'hd', 'h', 'q', 'ee', 'qr', 'hr', 'dqe', 'eqe'];
const DURS = ['w', 'h', 'q'];
const SEMIS = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

function noteNameToMidi(s) {
  const m = /^([A-G])(#|b)?([0-8])$/.exec(s);
  if (!m) return null;
  return 12 * (Number(m[3]) + 1) + SEMIS[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
}

function checkMidi(m, where) {
  if (!Number.isInteger(m) || m < 36 || m > 96) err(`${where}: midi ${m} out of range 36-96`);
}

function checkAudio(audio, where) {
  if (!audio || typeof audio !== 'object') { err(`${where}: missing audio object`); return; }
  if (typeof audio.bpm !== 'number' || audio.bpm < 40 || audio.bpm > 200) {
    err(`${where}: bpm ${audio.bpm} invalid`);
  }
  if (!Array.isArray(audio.items) || audio.items.length === 0) {
    err(`${where}: audio.items missing/empty`); return;
  }
  audio.items.forEach((it, i) => {
    const w = `${where} item[${i}]`;
    if (typeof it !== 'object' || it === null) { err(`${w}: not an object`); return; }
    if (typeof it.beats !== 'number' || !(it.beats > 0)) err(`${w}: beats ${it.beats} invalid`);
    const kinds = ['midi', 'midis', 'rest', 'click'].filter((k) => k in it);
    if (kinds.length !== 1) { err(`${w}: must have exactly one of midi/midis/rest/click, got [${kinds}]`); return; }
    if ('midi' in it) checkMidi(it.midi, w);
    if ('midis' in it) {
      if (!Array.isArray(it.midis) || it.midis.length === 0) err(`${w}: midis must be non-empty array`);
      else it.midis.forEach((m) => checkMidi(m, w));
    }
    if ('rest' in it && it.rest !== true) err(`${w}: rest must be true`);
    if ('click' in it && it.click !== 'hi' && it.click !== 'lo') err(`${w}: click must be 'hi'|'lo'`);
  });
}

function checkStaff(staff, where) {
  if (!staff || typeof staff !== 'object') { err(`${where}: missing staff object`); return; }
  if (staff.clef !== 'treble' && staff.clef !== 'bass') err(`${where}: bad clef ${staff.clef}`);
  if ('keySig' in staff && (!Number.isInteger(staff.keySig) || staff.keySig < -7 || staff.keySig > 7)) {
    err(`${where}: keySig ${staff.keySig} invalid`);
  }
  if ('gap' in staff && staff.gap !== 'normal' && staff.gap !== 'wide') err(`${where}: bad gap`);
  if ('chord' in staff && typeof staff.chord !== 'boolean') err(`${where}: chord must be boolean`);
  if (!Array.isArray(staff.notes) || staff.notes.length === 0) { err(`${where}: staff.notes missing/empty`); return; }
  staff.notes.forEach((n, i) => {
    const w = `${where} note[${i}]`;
    if (!SEMIS.hasOwnProperty(n.l)) err(`${w}: bad letter ${n.l}`);
    if (!Number.isInteger(n.a) || n.a < -2 || n.a > 2) err(`${w}: bad alteration ${n.a}`);
    if (!Number.isInteger(n.o) || n.o < 0 || n.o > 8) err(`${w}: bad octave ${n.o}`);
    if ('dur' in n && !DURS.includes(n.dur)) err(`${w}: bad dur ${n.dur}`);
    if ('cls' in n && !NOTE_CLS.includes(n.cls)) err(`${w}: bad cls ${n.cls}`);
    if (SEMIS.hasOwnProperty(n.l) && Number.isInteger(n.o)) {
      const m = 12 * (n.o + 1) + SEMIS[n.l] + (n.a || 0);
      if (m < 36 || m > 96) err(`${w}: computed midi ${m} out of 36-96`);
    }
  });
}

function checkDemo(demo, unitId, where) {
  if (!DEMO_KINDS.includes(demo.kind)) { err(`${where}: unknown demo kind ${demo.kind}`); return; }
  if (typeof demo.caption !== 'string' || demo.caption.trim().length < 5) err(`${where}: caption missing/too short`);
  if (demo.kind === 'circle5' && unitId !== 'u7') err(`${where}: circle5 demo only allowed in u7 (of units 7-12)`);
  if (demo.kind === 'tiles') {
    if (unitId !== 'u10') err(`${where}: tiles demo only allowed in u10`);
    if (!Array.isArray(demo.tiles) || demo.tiles.length === 0) err(`${where}: tiles array missing/empty`);
    else demo.tiles.forEach((t) => { if (!TILE_IDS.includes(t)) err(`${where}: unknown tile '${t}'`); });
  }
  if (demo.kind === 'keyboard') {
    if (!Array.isArray(demo.range) || demo.range.length !== 2) err(`${where}: keyboard range must be [lo, hi]`);
    else {
      const lo = noteNameToMidi(demo.range[0]);
      const hi = noteNameToMidi(demo.range[1]);
      if (lo === null || hi === null) err(`${where}: unparseable range ${demo.range}`);
      else if (lo >= hi) err(`${where}: range not ascending`);
      if (Array.isArray(demo.highlights)) {
        demo.highlights.forEach((h, i) => {
          checkMidi(h.midi, `${where} highlight[${i}]`);
          if (lo !== null && hi !== null && (h.midi < lo || h.midi > hi)) {
            err(`${where} highlight[${i}]: midi ${h.midi} outside range`);
          }
          if (!HL_CLS.includes(h.cls)) err(`${where} highlight[${i}]: bad cls ${h.cls}`);
        });
      } else err(`${where}: keyboard demo needs highlights array`);
    }
    if ('labels' in demo && !LABEL_MODES.includes(demo.labels)) err(`${where}: bad labels ${demo.labels}`);
  }
  if (demo.kind === 'staff') checkStaff(demo.staff, where);
  if (demo.kind === 'play') {
    if (typeof demo.label !== 'string' || demo.label.trim().length < 3) err(`${where}: play demo needs label`);
    checkAudio(demo.audio, where);
    if ('staff' in demo) checkStaff(demo.staff, `${where} (play staff)`);
  }
}

const ALLOWED_TAGS = ['p', 'strong', 'em', 'ul', 'li', 'ol', 'span'];

function checkBody(body, where, isFinal) {
  if (typeof body !== 'string' || body.trim().length === 0) { err(`${where}: body missing`); return; }
  const tagRe = /<\/?([a-zA-Z0-9]+)([^>]*)>/g;
  let m;
  const stack = [];
  while ((m = tagRe.exec(body)) !== null) {
    const full = m[0];
    const tag = m[1].toLowerCase();
    const closing = full.startsWith('</');
    if (!ALLOWED_TAGS.includes(tag)) err(`${where}: disallowed tag <${tag}>`);
    if (!closing) {
      if (tag === 'span' && full !== '<span class="note-chip">') {
        err(`${where}: span must be exactly <span class="note-chip">, got ${full}`);
      }
      if (tag !== 'span' && m[2].trim() !== '') err(`${where}: tag <${tag}> must have no attributes`);
      stack.push(tag);
    } else {
      const open = stack.pop();
      if (open !== tag) err(`${where}: mismatched </${tag}> (expected </${open}>)`);
    }
  }
  if (stack.length > 0) err(`${where}: unclosed tags: ${stack.join(',')}`);
  const outside = body.replace(/<p>[\s\S]*?<\/p>/g, '').replace(/<(ul|ol)>[\s\S]*?<\/\1>/g, '').trim();
  if (outside !== '') err(`${where}: content outside <p>/<ul>/<ol> blocks: "${outside.slice(0, 60)}"`);
  const pCount = (body.match(/<p>/g) || []).length;
  if (isFinal) {
    if (pCount !== 1) err(`${where}: 'How to practice' must be exactly 1 paragraph, got ${pCount}`);
  } else if (pCount < 2 || pCount > 4) {
    err(`${where}: expected 2-4 paragraphs, got ${pCount}`);
  }
  if (/<script/i.test(body)) err(`${where}: script tag`);
}

function wordCount(html) {
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return text === '' ? 0 : text.split(' ').length;
}

if (typeof LessonsB !== 'object' || LessonsB === null) {
  err('LessonsB export is not an object');
} else {
  const keys = Object.keys(LessonsB);
  if (keys.join(',') !== UNIT_IDS.join(',')) err(`LessonsB keys must be exactly ${UNIT_IDS.join(',')}, got ${keys.join(',')}`);
}

for (const uid of UNIT_IDS) {
  const unit = LessonsB[uid];
  if (!unit) { err(`${uid}: missing`); continue; }

  if (typeof unit.intro !== 'string' || unit.intro.trim().length < 20) err(`${uid}: intro missing/too short`);
  else {
    if (/</.test(unit.intro)) err(`${uid}: intro must be plain text (no tags)`);
    const sentences = (unit.intro.match(/[.!?]/g) || []).length;
    if (sentences < 1 || sentences > 3) err(`${uid}: intro should be 1-2 sentences`);
  }

  if (!Array.isArray(unit.sections) || unit.sections.length < 3 || unit.sections.length > 5) {
    err(`${uid}: needs 3-5 sections, got ${unit.sections ? unit.sections.length : 'none'}`);
    continue;
  }

  const last = unit.sections[unit.sections.length - 1];
  if (last.title !== 'How to practice') err(`${uid}: final section must be titled exactly 'How to practice'`);
  if ('demo' in last) err(`${uid}: 'How to practice' should not carry a demo`);

  let demoCount = 0;
  let words = wordCount(unit.intro);
  unit.sections.forEach((sec, i) => {
    const where = `${uid} section[${i}] "${sec.title}"`;
    if (typeof sec.title !== 'string' || sec.title.trim().length === 0) err(`${where}: title missing`);
    checkBody(sec.body, where, i === unit.sections.length - 1);
    words += wordCount(sec.body || '');
    if (sec.demo) {
      demoCount += 1;
      checkDemo(sec.demo, uid, `${where} demo`);
    }
  });

  if (demoCount < 2) err(`${uid}: needs at least 2 demos, got ${demoCount}`);
  if (words < 350 || words > 600) err(`${uid}: word count ${words} outside 350-600`);
  else console.log(`${uid}: ${unit.sections.length} sections, ${demoCount} demos, ${words} words`);
}

if (errors.length > 0) {
  console.error(`\nlessons-b: ${errors.length} problem(s):`);
  for (const e of errors) console.error('  - ' + e);
  process.exit(1);
}
console.log('\nlessons-b: all checks passed');
