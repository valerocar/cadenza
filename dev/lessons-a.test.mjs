import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

const Theory = require('../js/theory.js');
const LessonsA = require('../js/lessons-a.js');

const problems = [];
const fail = (msg) => problems.push(msg);

const UNIT_IDS = ['u1', 'u2', 'u3', 'u4', 'u5', 'u6'];
const ALLOWED_TAGS = new Set(['p', 'strong', 'em', 'ul', 'li', 'ol', 'span']);
const HL_CLASSES = new Set(['target', 'correct', 'wrong', 'accent', 'dim']);
const LABEL_MODES = new Set(['white', 'c', 'all']);
const DURS = new Set(['w', 'h', 'q']);
const LETTERS = new Set(['A', 'B', 'C', 'D', 'E', 'F', 'G']);

function noteToAscii(n) {
  const acc = n.a > 0 ? '#'.repeat(n.a) : 'b'.repeat(-n.a);
  return n.l + acc + n.o;
}

function checkStaffOpts(staff, where) {
  if (!staff || typeof staff !== 'object') { fail(`${where}: staff config missing`); return; }
  if (staff.clef !== 'treble' && staff.clef !== 'bass') fail(`${where}: bad clef ${staff.clef}`);
  if ('keySig' in staff) {
    if (!Number.isInteger(staff.keySig) || staff.keySig < -7 || staff.keySig > 7) {
      fail(`${where}: keySig out of range: ${staff.keySig}`);
    }
  }
  if (!Array.isArray(staff.notes) || staff.notes.length === 0) {
    fail(`${where}: staff.notes must be a non-empty array`);
    return;
  }
  staff.notes.forEach((n, i) => {
    const w = `${where} note[${i}]`;
    if (!LETTERS.has(n.l)) { fail(`${w}: bad letter ${n.l}`); return; }
    const a = n.a === undefined ? 0 : n.a;
    if (!Number.isInteger(a) || a < -2 || a > 2) { fail(`${w}: bad alteration ${n.a}`); return; }
    if (!Number.isInteger(n.o)) { fail(`${w}: bad octave ${n.o}`); return; }
    let midi;
    try {
      midi = Theory.midi(Theory.N(noteToAscii({ l: n.l, a: a, o: n.o })));
    } catch (e) {
      fail(`${w}: Theory cannot parse ${noteToAscii({ l: n.l, a: a, o: n.o })}: ${e.message}`);
      return;
    }
    if (midi < 21 || midi > 108) fail(`${w}: midi ${midi} outside piano range`);
    if ('dur' in n && !DURS.has(n.dur)) fail(`${w}: bad dur ${n.dur}`);
  });
  if ('chord' in staff && typeof staff.chord !== 'boolean') fail(`${where}: chord must be boolean`);
  if ('gap' in staff && staff.gap !== 'normal' && staff.gap !== 'wide') fail(`${where}: bad gap ${staff.gap}`);
}

function checkAudio(audio, where) {
  if (!audio || typeof audio !== 'object') { fail(`${where}: audio config missing`); return; }
  if (typeof audio.bpm !== 'number' || audio.bpm < 40 || audio.bpm > 200) fail(`${where}: bad bpm ${audio.bpm}`);
  if (!Array.isArray(audio.items) || audio.items.length === 0) {
    fail(`${where}: audio.items must be a non-empty array`);
    return;
  }
  audio.items.forEach((it, i) => {
    const w = `${where} item[${i}]`;
    if (typeof it.beats !== 'number' || !(it.beats > 0)) fail(`${w}: bad beats ${it.beats}`);
    const shapes = ['midi' in it, 'midis' in it, it.rest === true, 'click' in it].filter(Boolean);
    if (shapes.length !== 1) { fail(`${w}: must match exactly one item shape`); return; }
    if ('midi' in it) {
      if (!Number.isInteger(it.midi) || it.midi < 36 || it.midi > 96) fail(`${w}: midi ${it.midi} outside 36-96`);
    } else if ('midis' in it) {
      if (!Array.isArray(it.midis) || it.midis.length === 0) fail(`${w}: midis must be non-empty array`);
      else it.midis.forEach((m) => {
        if (!Number.isInteger(m) || m < 36 || m > 96) fail(`${w}: chord midi ${m} outside 36-96`);
      });
    } else if ('click' in it) {
      if (it.click !== 'hi' && it.click !== 'lo') fail(`${w}: bad click ${it.click}`);
    }
  });
}

function checkKeyboardDemo(demo, where) {
  if (!Array.isArray(demo.range) || demo.range.length !== 2) { fail(`${where}: bad range`); return; }
  let lo, hi;
  try {
    lo = Theory.midi(Theory.N(demo.range[0]));
    hi = Theory.midi(Theory.N(demo.range[1]));
  } catch (e) {
    fail(`${where}: unparseable range [${demo.range}]: ${e.message}`);
    return;
  }
  if (!(lo < hi)) fail(`${where}: range not ascending`);
  if (lo < 36 || hi > 96) fail(`${where}: range outside midi 36-96`);
  if (!Array.isArray(demo.highlights) || demo.highlights.length === 0) {
    fail(`${where}: highlights must be a non-empty array`);
    return;
  }
  demo.highlights.forEach((h, i) => {
    if (!Number.isInteger(h.midi) || h.midi < lo || h.midi > hi) {
      fail(`${where} highlight[${i}]: midi ${h.midi} outside range ${lo}-${hi}`);
    }
    if (!HL_CLASSES.has(h.cls)) fail(`${where} highlight[${i}]: bad cls ${h.cls}`);
  });
  if ('labels' in demo && !LABEL_MODES.has(demo.labels)) fail(`${where}: bad labels ${demo.labels}`);
}

function checkBodyHtml(body, where) {
  if (typeof body !== 'string' || body.trim() === '') { fail(`${where}: empty body`); return; }
  if (!/^<p>/.test(body.trim())) fail(`${where}: body copy must start inside <p>`);
  const tagRe = /<\/?([a-zA-Z0-9]+)((?:\s[^<>]*)?)>/g;
  let m;
  let sawTag = false;
  while ((m = tagRe.exec(body)) !== null) {
    sawTag = true;
    const tag = m[1].toLowerCase();
    if (!ALLOWED_TAGS.has(tag)) fail(`${where}: disallowed tag <${tag}>`);
    if (tag === 'span' && !m[0].startsWith('</')) {
      if (!/class="note-chip"/.test(m[0])) fail(`${where}: <span> must have class="note-chip"`);
    }
  }
  if (!sawTag) fail(`${where}: body has no HTML tags`);
  const stripped = body.replace(/<[^>]+>/g, '');
  if (/[<>]/.test(stripped)) fail(`${where}: stray angle bracket in body`);
}

function words(html) {
  return html.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
}

const keys = Object.keys(LessonsA);
for (const id of UNIT_IDS) if (!keys.includes(id)) fail(`missing unit ${id}`);
for (const k of keys) if (!UNIT_IDS.includes(k)) fail(`unexpected key ${k} in LessonsA`);

const counts = {};

for (const uid of UNIT_IDS) {
  const unit = LessonsA[uid];
  if (!unit) continue;
  if (typeof unit.intro !== 'string' || unit.intro.trim() === '') fail(`${uid}: missing intro`);
  else if (/[<>]/.test(unit.intro)) fail(`${uid}: intro must be plain text`);

  if (!Array.isArray(unit.sections)) { fail(`${uid}: sections missing`); continue; }
  if (unit.sections.length < 3 || unit.sections.length > 6) {
    fail(`${uid}: ${unit.sections.length} sections (need 3-6)`);
  }

  let demoCount = 0;
  let wordCount = words(unit.intro || '');

  unit.sections.forEach((sec, si) => {
    const where = `${uid} section[${si}] "${sec.title}"`;
    if (typeof sec.title !== 'string' || sec.title.trim() === '') fail(`${uid} section[${si}]: missing title`);
    checkBodyHtml(sec.body, where);
    wordCount += words(sec.body || '');

    if (sec.demo !== undefined) {
      demoCount++;
      const d = sec.demo;
      const dw = `${where} demo`;
      if (typeof d.caption !== 'string' || d.caption.trim() === '') fail(`${dw}: missing caption`);
      else wordCount += words(d.caption);
      switch (d.kind) {
        case 'keyboard':
          checkKeyboardDemo(d, dw);
          break;
        case 'staff':
          checkStaffOpts(d.staff, dw);
          break;
        case 'play':
          if (typeof d.label !== 'string' || d.label.trim() === '') fail(`${dw}: play demo needs a label`);
          checkAudio(d.audio, dw);
          if (d.staff !== undefined) checkStaffOpts(d.staff, `${dw} (side staff)`);
          break;
        case 'circle5':
          if (uid !== 'u4') fail(`${dw}: circle5 only allowed in u4 for LessonsA`);
          break;
        default:
          fail(`${dw}: disallowed demo kind ${d.kind}`);
      }
    }
  });

  if (demoCount < 2) fail(`${uid}: only ${demoCount} demos (need >= 2)`);

  const last = unit.sections[unit.sections.length - 1];
  if (!last || last.title !== 'How to practice') fail(`${uid}: final section must be titled 'How to practice'`);
  if (last && last.demo !== undefined) {
    // allowed by schema, but flag if final practice section had no body
  }

  counts[uid] = wordCount;
  if (wordCount < 300 || wordCount > 700) fail(`${uid}: word count ${wordCount} outside 300-700`);
}

if (!LessonsA.u4 || !LessonsA.u4.sections.some((s) => s.demo && s.demo.kind === 'circle5')) {
  fail('u4 must include a circle5 demo');
}

// Spot-checks: demo note data agrees with the theory the copy claims.
try {
  const dMajor = Theory.scale(Theory.N('D4'), 'major').map((n) => Theory.midi(n));
  const demoItems = LessonsA.u4.sections[1].demo.audio.items.map((it) => it.midi);
  if (JSON.stringify(dMajor) !== JSON.stringify(demoItems)) {
    fail(`u4 D major demo midis [${demoItems}] != Theory.scale D major [${dMajor}]`);
  }
  const ks = Theory.keySig('D', 'major');
  if (ks.count !== 2) fail(`Theory says D major has ${ks.count} sharps; lesson claims 2`);
  const m3 = Theory.intervalSemitones('m3');
  const M3 = Theory.intervalSemitones('M3');
  if (m3 !== 3 || M3 !== 4) fail('interval semitone spot-check failed (m3=3, M3=4)');
  const tri = Theory.interval(Theory.N('F4'), Theory.N('B4'));
  if (!tri || tri.name !== 'A4') fail(`F4-B4 should be A4, Theory says ${tri && tri.name}`);
} catch (e) {
  fail(`theory spot-check threw: ${e.message}`);
}

console.log('word counts:', counts);
if (problems.length) {
  console.error(`FAIL: ${problems.length} problem(s)`);
  for (const p of problems) console.error('  - ' + p);
  process.exit(1);
}
console.log('lessons-a: all checks passed');
