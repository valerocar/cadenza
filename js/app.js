(function (global) {
  'use strict';

  const doc = global.document;
  const view = doc.getElementById('view');

  /* ---------------- theme ---------------- */

  // A host page (e.g. the artifact viewer) may stamp data-theme before we boot;
  // "auto" defers to that stamp instead of stripping it.
  const hostTheme = doc.documentElement.getAttribute('data-theme');

  function applyTheme() {
    const t = global.Store.settings.theme;
    if (t === 'light' || t === 'dark') {
      doc.documentElement.setAttribute('data-theme', t);
    } else if (hostTheme) {
      doc.documentElement.setAttribute('data-theme', hostTheme);
    } else {
      doc.documentElement.removeAttribute('data-theme');
    }
    const btn = doc.getElementById('theme-btn');
    if (btn) {
      btn.title = 'Theme: ' + t + ' (click to change)';
      btn.setAttribute('aria-label', 'Theme: ' + t + '. Activate to change.');
    }
  }

  function cycleTheme() {
    const order = ['auto', 'light', 'dark'];
    const cur = global.Store.settings.theme;
    const next = order[(order.indexOf(cur) + 1) % order.length];
    global.Store.setSetting('theme', next);
    applyTheme();
  }

  /* ---------------- header ---------------- */

  function refreshHeader() {
    const streakEl = doc.querySelector('#top-streak b');
    const xpEl = doc.querySelector('#top-xp b');
    if (streakEl) streakEl.textContent = global.Store.dayStreak();
    if (xpEl) xpEl.textContent = global.Store.stats.xp;
  }

  /* ---------------- router ---------------- */

  function route() {
    global.Session.destroy();
    if (global.AudioEngine) global.AudioEngine.stop();
    const hash = global.location.hash.replace(/^#/, '') || '/';
    const parts = hash.split('/').filter(Boolean);
    global.scrollTo(0, 0);
    refreshHeader();

    if (parts.length === 0) return renderDashboard();
    if (parts[0] === 'unit' && parts[1]) return renderUnit(parts[1]);
    if (parts[0] === 'lesson' && parts[1]) return renderLesson(parts[1]);
    if (parts[0] === 'practice' && parts[1]) return renderPractice(parts[1]);
    if (parts[0] === 'quiz' && parts[1]) return renderQuiz(parts[1]);
    if (parts[0] === 'review') return renderReview();
    if (parts[0] === 'settings') return renderSettings();
    return renderDashboard();
  }

  /* ---------------- dashboard ---------------- */

  function continueTarget() {
    const units = global.Curriculum.units;
    for (const u of units) {
      if (global.Store.unitUnlocked(u.id) && !global.Store.unit(u.id).quizPassed) return u;
    }
    return null;
  }

  function renderDashboard() {
    const S = global.Store;
    const target = continueTarget();
    const started = S.stats.answered > 0;
    const acc = S.overallAccuracy();

    view.innerHTML = '';
    const hero = global.UI.el(
      '<section class="hero">' +
      '  <h1>' + (started ? 'Welcome back.' : 'Learn music theory, from the very beginning.') + '</h1>' +
      '  <p>' + (started
        ? (target ? 'You\'re on <b>Unit ' + target.n + ': ' + target.title + '</b>. A few minutes of focused practice a day is all it takes.'
                  : 'You\'ve completed every unit. Keep your skills sharp with Daily Review.')
        : 'Notes, the staff, scales, intervals, chords, and real ear training — in twelve small units that each unlock the next. No experience needed.') +
      '  </p>' +
      '  <a class="btn btn-primary btn-lg" href="' +
        (target ? '#/unit/' + target.id : '#/review') + '">' +
        (started ? (target ? 'Continue Unit ' + target.n + ' →' : 'Daily Review →') : 'Start Unit 1 →') +
      '  </a>' +
      '</section>');
    view.appendChild(hero);

    if (started) {
      const statRow = global.UI.el(
        '<div class="stat-row">' +
        stat(S.dayStreak(), 'Day streak') +
        stat(S.stats.xp, 'Points') +
        stat(S.stats.answered, 'Questions answered') +
        stat(acc === null ? '—' : Math.round(acc * 100) + '%', 'Accuracy') +
        '</div>');
      view.appendChild(statRow);
    }

    const done = S.completedUnits().length;
    view.appendChild(global.UI.el('<h2 class="section-title">Your path <span class="muted">' +
      done + ' of ' + global.Curriculum.units.length + ' units complete</span></h2>'));

    const grid = doc.createElement('div');
    grid.className = 'unit-grid';
    global.Curriculum.units.forEach((u) => {
      const unlocked = S.unitUnlocked(u.id);
      const doneU = S.unit(u.id).quizPassed;
      const prog = S.unitProgress(u.id);
      const cls = 'unit-card' + (doneU ? ' is-done' : '') + (!unlocked ? ' is-locked' : '');
      const inner =
        '  <div class="unit-card-top">' +
        '    <span class="unit-medallion">' + u.n + '</span>' +
        '    <div><h3>' + u.title + '</h3></div>' +
        '  </div>' +
        '  <p class="tagline">' + u.tagline + '</p>' +
        '  <div class="unit-meta">' +
        '    <div class="meter"><div class="meter-fill' + (doneU ? ' gold' : '') + '" style="width:' + Math.round(prog * 100) + '%"></div></div>' +
        '    <span>' + u.skills.length + ' skills</span>' +
        '  </div>' +
        (doneU ? '<span class="unit-seal" title="Unit complete">✓</span>' : '') +
        (!unlocked ? '<span class="unit-lock" title="Pass the previous unit\'s quiz to unlock">🔒</span>' : '');
      let card;
      if (unlocked) {
        card = global.UI.el('<a class="' + cls + '" href="#/unit/' + u.id + '">' + inner + '</a>');
      } else {
        card = global.UI.el('<div class="' + cls + '">' + inner + '</div>');
      }
      grid.appendChild(card);
    });
    view.appendChild(grid);

    if (done > 0) {
      view.appendChild(global.UI.el('<h2 class="section-title">Keep it sharp</h2>'));
      view.appendChild(global.UI.el(
        '<a class="skill-row" href="#/review" style="max-width:520px">' +
        '  <span class="skill-icon" style="background:var(--gold-soft);color:var(--gold)">↻</span>' +
        '  <span class="skill-info">' +
        '    <span class="skill-name">Daily Review</span>' +
        '    <span class="skill-sub">A mix of everything you\'ve mastered so far — little and often beats cramming.</span>' +
        '  </span>' +
        '</a>'));
    }
  }

  function stat(value, label) {
    return '<div class="stat-tile"><div class="stat-value">' + value + '</div>' +
      '<div class="stat-label">' + label + '</div></div>';
  }

  /* ---------------- unit page ---------------- */

  function lessonsFor(unitId) {
    const A = global.LessonsA || {};
    const B = global.LessonsB || {};
    return A[unitId] || B[unitId] || null;
  }

  function renderUnit(unitId) {
    const u = global.Curriculum.unitById(unitId);
    if (!u) return renderDashboard();
    const S = global.Store;
    if (!S.unitUnlocked(unitId)) {
      const prev = global.Curriculum.prevUnit(unitId);
      view.innerHTML = '';
      view.appendChild(global.UI.el(
        '<div class="card" style="max-width:520px;margin:40px auto;text-align:center">' +
        '<h2>🔒 Unit ' + u.n + ' is locked</h2>' +
        '<p class="muted">Pass the Unit ' + prev.n + ' mastery quiz to unlock it.</p>' +
        '<a class="btn btn-primary" href="#/unit/' + prev.id + '">Go to Unit ' + prev.n + '</a>' +
        '</div>'));
      return;
    }

    const lesson = lessonsFor(unitId);
    const uq = S.unit(unitId);
    view.innerHTML = '';
    view.appendChild(global.UI.el(
      '<div class="crumbs"><a href="#/">Home</a> <span>›</span> <span>Unit ' + u.n + '</span></div>'));
    view.appendChild(global.UI.el(
      '<div class="unit-head">' +
      '  <div class="kicker">Unit ' + u.n + (uq.quizPassed ? ' · complete ✓' : '') + '</div>' +
      '  <h1>' + u.title + '</h1>' +
      '  <p class="tagline">' + u.tagline + '</p>' +
      '</div>'));

    const cols = doc.createElement('div');
    cols.className = 'unit-columns';

    const left = doc.createElement('div');
    left.style.display = 'flex';
    left.style.flexDirection = 'column';
    left.style.gap = '16px';

    left.appendChild(global.UI.el(
      '<div class="card lesson-card">' +
      '  <h3>📖 Learn</h3>' +
      '  <p class="muted small">' + (lesson && lesson.intro ? lesson.intro : 'Read the short lesson before drilling.') + '</p>' +
      '  <a class="btn btn-soft" href="#/lesson/' + u.id + '">Read the lesson →</a>' +
      '</div>'));

    const quizStatus = uq.quizPassed
      ? 'Passed ✓ · best score ' + uq.bestScore + '/' + u.quiz.n
      : (uq.attempts > 0
        ? 'Best so far: ' + uq.bestScore + '/' + u.quiz.n + ' — you need ' + u.quiz.pass + '.'
        : u.quiz.n + ' mixed questions · score ' + u.quiz.pass + '+ to complete the unit' +
          (global.Curriculum.nextUnit(u.id) ? ' and unlock the next one' : '') + '.');
    left.appendChild(global.UI.el(
      '<div class="card quiz-card">' +
      '  <h3>' + (uq.quizPassed ? '🏅' : '🎓') + ' Mastery Quiz</h3>' +
      '  <p class="quiz-status">' + quizStatus + '</p>' +
      '  <a class="btn ' + (uq.quizPassed ? '' : 'btn-primary') + '" href="#/quiz/' + u.id + '">' +
      (uq.quizPassed ? 'Retake quiz' : 'Start the quiz →') + '</a>' +
      '</div>'));

    const right = doc.createElement('div');
    right.appendChild(global.UI.el('<h3 style="font-size:16px;margin-bottom:10px">Practice drills</h3>'));
    const list = doc.createElement('div');
    list.className = 'skill-list';
    u.skills.forEach((sk) => {
      const maxL = global.Exercises.maxLevel(sk.id);
      const st = S.skill(sk.id);
      const prog = S.skillProgress(sk.id, maxL);
      const acc = S.skillAccuracy(sk.id);
      list.appendChild(global.UI.el(
        '<a class="skill-row kind-' + sk.kind + '" href="#/practice/' + sk.id + '">' +
        '  <span class="skill-icon">' + sk.icon + '</span>' +
        '  <span class="skill-info">' +
        '    <span class="skill-name">' + sk.title + '</span>' +
        '    <span class="skill-sub">Level ' + st.level + ' of ' + maxL +
        (acc !== null ? ' · ' + Math.round(acc * 100) + '% recently' : ' · not started') +
        (sk.kind === 'ear' ? ' · 🎧 listening' : '') + '</span>' +
        '  </span>' +
        '  <span class="meter"><span class="meter-fill" style="display:block;width:' + Math.round(prog * 100) + '%"></span></span>' +
        '</a>'));
    });
    right.appendChild(list);

    cols.appendChild(left);
    cols.appendChild(right);
    view.appendChild(cols);
  }

  /* ---------------- lesson ---------------- */

  function renderLesson(unitId) {
    const u = global.Curriculum.unitById(unitId);
    const lesson = lessonsFor(unitId);
    if (!u || !lesson) return renderUnit(unitId);

    view.innerHTML = '';
    const root = doc.createElement('div');
    root.className = 'lesson';
    root.appendChild(global.UI.el(
      '<div class="crumbs"><a href="#/">Home</a> <span>›</span> <a href="#/unit/' + u.id +
      '">Unit ' + u.n + '</a> <span>›</span> <span>Lesson</span></div>'));
    root.appendChild(global.UI.el(
      '<div class="unit-head"><div class="kicker">Unit ' + u.n + ' · Lesson</div>' +
      '<h1>' + u.title + '</h1>' +
      (lesson.intro ? '<p class="tagline">' + lesson.intro + '</p>' : '') + '</div>'));

    (lesson.sections || []).forEach((sec) => {
      const s = doc.createElement('section');
      s.className = 'lesson-section';
      s.appendChild(global.UI.el('<h2>' + sec.title + '</h2>'));
      const body = doc.createElement('div');
      body.innerHTML = sec.body || '';
      s.appendChild(body);
      if (sec.demo) s.appendChild(renderDemo(sec.demo));
      root.appendChild(s);
    });

    const firstSkill = u.skills[0];
    root.appendChild(global.UI.el(
      '<div class="lesson-nav">' +
      '  <a class="btn" href="#/unit/' + u.id + '">← Back to unit</a>' +
      '  <a class="btn btn-primary" href="#/practice/' + firstSkill.id + '">Start practicing →</a>' +
      '</div>'));
    view.appendChild(root);
  }

  function renderDemo(demo) {
    const box = doc.createElement('div');
    box.className = 'demo';
    try {
      if (demo.kind === 'keyboard') {
        const d = doc.createElement('div');
        d.style.width = '100%';
        d.style.maxWidth = '560px';
        box.appendChild(d);
        const range = demo.range || ['C3', 'C5'];
        const kb = global.Keyboard.create(d, {
          from: range[0], to: range[1],
          interactive: true,
          labels: demo.labels || 'white',
          onPress: (midi) => {
            global.AudioEngine.ensure().then(() => global.AudioEngine.playNote(midi, { dur: 0.8 }));
            kb.press(midi);
          },
        });
        (demo.highlights || []).forEach((h) => kb.highlight(h.midi, h.cls || 'accent'));
      } else if (demo.kind === 'staff') {
        const d = doc.createElement('div');
        box.appendChild(d);
        global.Notation.render(d, demo.staff);
      } else if (demo.kind === 'play') {
        if (demo.staff) {
          const d = doc.createElement('div');
          box.appendChild(d);
          global.Notation.render(d, demo.staff);
        }
        const btn = global.UI.el('<button class="play-btn secondary"><span aria-hidden="true">▶</span> ' +
          (demo.label || 'Play') + '</button>');
        btn.addEventListener('click', () => {
          global.AudioEngine.ensure().then(() => {
            global.AudioEngine.stop();
            btn.classList.add('is-playing');
            global.AudioEngine.playSeq(demo.audio.items, { bpm: demo.audio.bpm || 90 })
              .then(() => btn.classList.remove('is-playing'));
          });
        });
        box.appendChild(btn);
      } else if (demo.kind === 'circle5') {
        box.appendChild(circleOfFifths());
      } else if (demo.kind === 'tiles') {
        box.appendChild(global.UI.tileRow(demo.tiles || []));
      }
    } catch (e) {
      if (global.console) console.error('demo render failed', e);
    }
    if (demo.caption) box.appendChild(global.UI.el('<div class="demo-caption">' + demo.caption + '</div>'));
    return box;
  }

  function circleOfFifths() {
    const majors = ['C', 'G', 'D', 'A', 'E', 'B', 'F♯', 'D♭', 'A♭', 'E♭', 'B♭', 'F'];
    const minors = ['a', 'e', 'b', 'f♯', 'c♯', 'g♯', 'd♯', 'b♭', 'f', 'c', 'g', 'd'];
    const cx = 150, cy = 150;
    let parts = '<circle class="c5-ring" cx="' + cx + '" cy="' + cy + '" r="128" stroke-width="1.5"/>' +
      '<circle class="c5-ring" cx="' + cx + '" cy="' + cy + '" r="82" stroke-width="1"/>';
    for (let i = 0; i < 12; i++) {
      const ang = (i * 30 - 90) * Math.PI / 180;
      const mx = cx + Math.cos(ang) * 105;
      const my = cy + Math.sin(ang) * 105;
      const nx = cx + Math.cos(ang) * 62;
      const ny = cy + Math.sin(ang) * 62;
      parts += '<text class="c5-major" x="' + mx.toFixed(1) + '" y="' + (my + 5).toFixed(1) +
        '" text-anchor="middle">' + majors[i] + '</text>';
      parts += '<text class="c5-minor" x="' + nx.toFixed(1) + '" y="' + (ny + 4).toFixed(1) +
        '" text-anchor="middle">' + minors[i] + '</text>';
    }
    parts += '<text class="c5-hub" x="' + cx + '" y="' + (cy - 2) + '" text-anchor="middle">MAJOR</text>' +
      '<text class="c5-hub" x="' + cx + '" y="' + (cy + 14) + '" text-anchor="middle">minor</text>';
    const wrap = doc.createElement('div');
    wrap.innerHTML = '<svg class="circle5" viewBox="0 0 300 300" width="300" height="300" ' +
      'role="img" aria-label="Circle of fifths">' + parts + '</svg>';
    return wrap;
  }

  /* ---------------- sessions ---------------- */

  function renderPractice(skillId) {
    const ref = global.Curriculum.skillById(skillId);
    if (!ref) return renderDashboard();
    view.innerHTML = '';
    global.Session.start(view, {
      mode: 'practice',
      skillId,
      onExit: () => { global.location.hash = '#/unit/' + ref.unit.id; },
    });
  }

  function renderQuiz(unitId) {
    const u = global.Curriculum.unitById(unitId);
    if (!u || !global.Store.unitUnlocked(unitId)) return renderDashboard();
    view.innerHTML = '';
    global.Session.start(view, {
      mode: 'quiz',
      unitId,
      onExit: () => { global.location.hash = '#/unit/' + unitId; },
    });
  }

  function renderReview() {
    view.innerHTML = '';
    global.Session.start(view, {
      mode: 'review',
      onExit: () => {
        if (global.location.hash === '#/' || global.location.hash === '') route();
        else global.location.hash = '#/';
      },
    });
  }

  /* ---------------- settings ---------------- */

  function renderSettings() {
    const S = global.Store;
    view.innerHTML = '';
    const root = doc.createElement('div');
    root.className = 'settings';
    root.appendChild(global.UI.el('<h1 style="font-size:26px">Settings</h1>'));
    const card = doc.createElement('div');
    card.className = 'card';

    card.appendChild(segRow('Theme', 'Follow the system, or pick one.', 'theme',
      [['auto', 'Auto'], ['light', 'Light'], ['dark', 'Dark']], () => applyTheme()));

    const volRow = global.UI.el(
      '<div class="setting-row">' +
      '  <div class="setting-info"><div class="setting-name">Volume</div>' +
      '  <div class="setting-desc">Playback loudness for ear training.</div></div>' +
      '  <input type="range" min="0" max="1" step="0.05" aria-label="Volume">' +
      '</div>');
    const vol = volRow.querySelector('input');
    vol.value = S.settings.volume;
    vol.addEventListener('input', () => {
      S.setSetting('volume', parseFloat(vol.value));
      if (global.AudioEngine) global.AudioEngine.setVolume(parseFloat(vol.value));
    });
    vol.addEventListener('change', () => {
      if (global.AudioEngine) {
        global.AudioEngine.ensure().then(() => global.AudioEngine.playNote(69, { dur: 0.4 }));
      }
    });
    card.appendChild(volRow);

    card.appendChild(segRow('Key labels', 'Note names shown on the practice piano.', 'labels',
      [['auto', 'Auto'], ['none', 'None'], ['c', 'C only'], ['white', 'White'], ['all', 'All']]));

    card.appendChild(segRow('Autoplay listening questions', 'Play the sound as soon as a question appears.', 'autoplay',
      [[true, 'On'], [false, 'Off']]));

    root.appendChild(card);
    root.appendChild(global.UI.el(
      '<div class="danger-zone">' +
      '  <button class="btn btn-danger" id="reset-btn">Reset all progress</button>' +
      '  <p class="muted small" style="margin-top:8px">Erases levels, streaks, and completed units on this device.</p>' +
      '</div>'));
    root.querySelector('#reset-btn').addEventListener('click', () => {
      if (global.confirm('Really erase all Cadenza progress on this device?')) {
        S.resetAll();
        applyTheme();
        refreshHeader();
        global.location.hash = '#/';
      }
    });
    view.appendChild(root);
  }

  function segRow(name, desc, key, options, after) {
    const S = global.Store;
    const row = global.UI.el(
      '<div class="setting-row">' +
      '  <div class="setting-info"><div class="setting-name">' + name + '</div>' +
      '  <div class="setting-desc">' + desc + '</div></div>' +
      '  <div class="seg" role="group" aria-label="' + name + '"></div>' +
      '</div>');
    const seg = row.querySelector('.seg');
    options.forEach(([val, label]) => {
      const b = doc.createElement('button');
      b.textContent = label;
      const on = S.settings[key] === val;
      if (on) b.classList.add('on');
      b.setAttribute('aria-pressed', String(on));
      b.addEventListener('click', () => {
        S.setSetting(key, val);
        Array.from(seg.children).forEach((c) => {
          c.classList.remove('on');
          c.setAttribute('aria-pressed', 'false');
        });
        b.classList.add('on');
        b.setAttribute('aria-pressed', 'true');
        if (after) after();
      });
      seg.appendChild(b);
    });
    return row;
  }

  /* ---------------- boot ---------------- */

  function init() {
    global.Store.load();
    applyTheme();
    refreshHeader();
    if (global.AudioEngine) global.AudioEngine.setVolume(global.Store.settings.volume);

    doc.getElementById('theme-btn').addEventListener('click', cycleTheme);

    const unlock = () => {
      if (global.AudioEngine) global.AudioEngine.ensure();
      doc.removeEventListener('pointerdown', unlock);
    };
    doc.addEventListener('pointerdown', unlock);

    global.addEventListener('hashchange', route);
    route();
  }

  init();
})(typeof window !== 'undefined' ? window : globalThis);
