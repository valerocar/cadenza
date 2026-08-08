(function (global) {
  'use strict';

  const Theory = global.Theory;

  /* ================= shared UI helpers ================= */

  const UI = {
    el(html) {
      const t = document.createElement('template');
      t.innerHTML = html.trim();
      return t.content.firstElementChild;
    },

    noteName(midi, prefer) {
      return global.Theory.name(global.Theory.fromMidi(midi, prefer || 'sharp'));
    },

    confetti() {
      const glyphs = ['♪', '♫', '♩', '♬', '✦'];
      const colors = ['var(--accent)', 'var(--gold)', 'var(--ok)'];
      for (let i = 0; i < 26; i++) {
        const s = document.createElement('span');
        s.className = 'confetti-note';
        s.textContent = glyphs[Math.floor(Math.random() * glyphs.length)];
        s.style.left = Math.random() * 100 + 'vw';
        s.style.color = colors[i % colors.length];
        s.style.animationDuration = 1.8 + Math.random() * 1.6 + 's';
        s.style.animationDelay = Math.random() * 0.5 + 's';
        s.style.fontSize = 15 + Math.random() * 14 + 'px';
        document.body.appendChild(s);
        setTimeout(() => s.remove(), 4200);
      }
    },

    /* ---- rhythm tile drawings ---- */

    tileSVG(tileId, height) {
      const H = height || 44;
      const base = 30;
      const parts = [];
      let W = 30;

      const head = (x, hollow, wide) => {
        const rx = wide ? 7.2 : 5.8;
        const ry = wide ? 5 : 4.4;
        return '<ellipse cx="' + x + '" cy="' + base + '" rx="' + rx + '" ry="' + ry + '" ' +
          'transform="rotate(-18 ' + x + ' ' + base + ')" ' +
          (hollow ? 'fill="none" stroke="currentColor" stroke-width="2"' : 'fill="currentColor"') + '/>';
      };
      const stem = (x) => '<line x1="' + (x + 5.4) + '" y1="' + (base - 1.5) + '" x2="' + (x + 5.4) +
        '" y2="' + (base - 21) + '" stroke="currentColor" stroke-width="1.7"/>';
      const dot = (x) => '<circle cx="' + (x + 10.5) + '" cy="' + (base - 3) + '" r="2" fill="currentColor"/>';
      const flag = (x) => {
        const sx = x + 5.4;
        const ty = base - 21;
        return '<path d="M ' + sx + ' ' + ty + ' c 6 3 8 8 5.5 14 c 1.8 -6.5 -0.5 -9.5 -5.5 -11 z" fill="currentColor"/>';
      };
      const beam = (x1, x2) => {
        const y = base - 21;
        return '<polygon points="' + (x1 + 4.6) + ',' + y + ' ' + (x2 + 6.2) + ',' + y + ' ' +
          (x2 + 6.2) + ',' + (y + 3.6) + ' ' + (x1 + 4.6) + ',' + (y + 3.6) + '" fill="currentColor"/>';
      };

      switch (tileId) {
        case 'w':
          W = 40;
          parts.push(head(20, true, true));
          break;
        case 'hd':
          W = 40;
          parts.push(head(13, true), stem(13), dot(13));
          break;
        case 'h':
          W = 32;
          parts.push(head(13, true), stem(13));
          break;
        case 'q':
          W = 26;
          parts.push(head(11, false), stem(11));
          break;
        case 'ee':
          W = 40;
          parts.push(head(11, false), stem(11), head(27, false), stem(27), beam(11, 27));
          break;
        case 'qr':
          W = 26;
          parts.push('<path d="M 10 ' + (base - 20) + ' l 5.5 7 c -3.5 3 -4 5 -1 9 l -4.5 -1.5 ' +
            'c -2.5 2.5 -2 5 0.5 8 c -4.5 -2.5 -5.5 -6 -2.5 -9.5 l 4 1 c -2.8 -3.5 -2.6 -6.5 1 -9 z" ' +
            'fill="currentColor"/>');
          break;
        case 'hr':
          W = 32;
          parts.push('<line x1="6" y1="' + (base - 8) + '" x2="26" y2="' + (base - 8) +
            '" stroke="currentColor" stroke-width="1.4"/>');
          parts.push('<rect x="10" y="' + (base - 13) + '" width="12" height="5" fill="currentColor"/>');
          break;
        case 'dqe':
          W = 48;
          parts.push(head(11, false), stem(11), dot(11));
          parts.push(head(33, false), stem(33), flag(33));
          break;
        case 'eqe':
          W = 58;
          parts.push(head(9, false), stem(9), flag(9));
          parts.push(head(27, false), stem(27));
          parts.push(head(45, false), stem(45), flag(45));
          break;
        default:
          parts.push('<text x="8" y="' + base + '" fill="currentColor">?</text>');
      }
      return '<svg viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H +
        '" aria-hidden="true">' + parts.join('') + '</svg>';
    },

    tileRow(tiles, clsPerTile) {
      const wrap = document.createElement('span');
      wrap.className = 'tile-row';
      tiles.forEach((t, i) => {
        const tile = document.createElement('span');
        tile.className = 'tile' + (clsPerTile && clsPerTile[i] ? ' ' + clsPerTile[i] : '');
        tile.innerHTML = UI.tileSVG(t);
        wrap.appendChild(tile);
      });
      return wrap;
    },
  };

  /* ================= session engine ================= */

  let active = null;

  function clearTimers(S) {
    if (S.autoTimer) { clearTimeout(S.autoTimer); S.autoTimer = null; }
    if (S.autoplayTimer) { clearTimeout(S.autoplayTimer); S.autoplayTimer = null; }
    if (S.checkTimer) { clearTimeout(S.checkTimer); S.checkTimer = null; }
  }

  function destroyActive() {
    if (active) {
      document.removeEventListener('keydown', active.onKeydown);
      clearTimers(active);
      if (global.AudioEngine) global.AudioEngine.stop();
      active = null;
    }
  }

  const Session = {
    start(container, opts) {
      destroyActive();
      const S = {
        mode: opts.mode,
        skillId: opts.skillId || null,
        unitId: opts.unitId || null,
        onExit: opts.onExit || function () {},
        answered: 0,
        correct: 0,
        quizIndex: 0,
        quizScore: 0,
        quizPlan: null,
        replaysLeft: null,
        q: null,
        stage: 'question',
        autoTimer: null,
        keyHandlers: {},
        container,
      };
      active = S;

      if (S.mode === 'quiz') {
        const unit = global.Curriculum.unitById(S.unitId);
        const plan = [];
        const skills = unit.skills.slice();
        for (let i = 0; i < unit.quiz.n; i++) plan.push(skills[i % skills.length].id);
        for (let i = plan.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [plan[i], plan[j]] = [plan[j], plan[i]];
        }
        S.quizPlan = plan;
      }

      S.onKeydown = (e) => onKeydown(S, e);
      document.addEventListener('keydown', S.onKeydown);

      renderShell(S);
      nextQuestion(S);
    },

    destroy: destroyActive,
  };

  function sessionTitle(S) {
    if (S.mode === 'quiz') {
      const u = global.Curriculum.unitById(S.unitId);
      return 'Mastery Quiz · Unit ' + u.n;
    }
    if (S.mode === 'review') return 'Daily Review';
    const ref = global.Curriculum.skillById(S.skillId);
    return ref ? ref.skill.title : S.skillId;
  }

  function renderShell(S) {
    S.container.innerHTML = '';
    const root = UI.el(
      '<div class="session">' +
      '  <div class="session-head">' +
      '    <button class="icon-btn" data-x="close" title="End session" aria-label="End session">✕</button>' +
      '    <div class="session-title"><h2></h2><div class="small sub"></div></div>' +
      '    <div class="head-right"></div>' +
      '  </div>' +
      '  <div class="question-card">' +
      '    <div class="prompt"></div>' +
      '    <div class="stimulus"></div>' +
      '    <div class="answer-area"></div>' +
      '    <div class="feedback-area"></div>' +
      '  </div>' +
      '  <div class="session-foot">' +
      '    <div class="session-stats"></div>' +
      '    <div class="foot-actions"></div>' +
      '  </div>' +
      '</div>');
    root.querySelector('[data-x=close]').addEventListener('click', () => endSession(S));
    root.querySelector('.session-title h2').textContent = sessionTitle(S);
    S.container.appendChild(root);
    S.el = {
      root,
      sub: root.querySelector('.session-title .sub'),
      headRight: root.querySelector('.head-right'),
      card: root.querySelector('.question-card'),
      prompt: root.querySelector('.prompt'),
      stimulus: root.querySelector('.stimulus'),
      answer: root.querySelector('.answer-area'),
      feedback: root.querySelector('.feedback-area'),
      stats: root.querySelector('.session-stats'),
      actions: root.querySelector('.foot-actions'),
    };
  }

  function endSession(S) {
    destroyActive();
    S.onExit({ answered: S.answered, correct: S.correct });
  }

  function updateHead(S) {
    if (S.mode === 'quiz') {
      S.el.sub.textContent = 'Question ' + (S.quizIndex + 1) + ' of ' + S.quizPlan.length;
      S.el.headRight.innerHTML = '<span class="chip chip-accent">' + S.quizScore + ' correct</span>';
    } else {
      const skill = global.Store.skill(S.skillId || S.q.skillId);
      const maxL = global.Exercises.maxLevel(S.q.skillId);
      const desc = global.Exercises.levelDesc(S.q.skillId, S.q.level);
      S.el.sub.textContent = 'Level ' + S.q.level + ' of ' + maxL + (desc ? ' · ' + desc : '');
      let pips = '<span class="streak-pips" title="5 in a row levels you up">';
      for (let i = 0; i < 5; i++) pips += '<span class="pip' + (i < skill.streak ? ' lit' : '') + '"></span>';
      pips += '</span>';
      S.el.headRight.innerHTML = pips;
    }
    S.el.stats.textContent = S.answered
      ? S.answered + ' answered · ' + Math.round((S.correct / S.answered) * 100) + '%'
      : '';
  }

  function pickSkill(S) {
    if (S.mode === 'quiz') return S.quizPlan[S.quizIndex];
    if (S.mode === 'review') {
      const done = global.Store.completedUnits();
      const pool = [];
      done.forEach((u) => u.skills.forEach((s) => pool.push(s.id)));
      if (!pool.length) return null;
      return pool[Math.floor(Math.random() * pool.length)];
    }
    return S.skillId;
  }

  function nextQuestion(S) {
    clearTimers(S);
    S.confirmMs = 0;
    if (global.AudioEngine) global.AudioEngine.stop();

    if (S.mode === 'quiz' && S.quizIndex >= S.quizPlan.length) return showResults(S);

    const skillId = pickSkill(S);
    if (!skillId) {
      S.el.card.innerHTML = '<p class="muted">Complete a unit quiz first — then Daily Review mixes everything you\'ve mastered.</p>';
      return;
    }
    const st = global.Store.skill(skillId);
    const maxL = global.Exercises.maxLevel(skillId);
    // Quizzes gate the next unit, so they never sit below mid-depth: a learner
    // still on Level 1 drills is quizzed at the skill's representative level.
    const floor = S.mode === 'quiz' ? Math.ceil(maxL / 2) : 1;
    const level = Math.max(floor, Math.min(st.level, maxL));

    let q;
    try {
      q = global.Exercises.generate(skillId, level);
    } catch (err) {
      S.el.prompt.innerHTML = 'Hmm, this question failed to load. <button class="btn btn-sm" data-x="skip">Skip</button>';
      S.el.prompt.querySelector('[data-x=skip]').addEventListener('click', () => nextQuestion(S));
      if (global.console) console.error('generate failed', skillId, level, err);
      return;
    }
    S.q = q;
    S.stage = 'question';
    S.replaysLeft = S.mode === 'quiz' ? 4 : null;
    S.keyHandlers = {};

    S.el.feedback.innerHTML = '';
    S.el.actions.innerHTML = '';
    renderStimulus(S);
    renderInput(S);
    updateHead(S);
  }

  /* ---------------- stimulus ---------------- */

  function renderStimulus(S) {
    const q = S.q;
    const box = S.el.stimulus;
    box.innerHTML = '';
    S.el.prompt.innerHTML = q.prompt || '';
    const st = q.stimulus || {};

    if (st.staff) {
      const d = document.createElement('div');
      box.appendChild(d);
      global.Notation.render(d, st.staff);
    }
    if (st.keySigOnly) {
      const d = document.createElement('div');
      box.appendChild(d);
      global.Notation.keySigOnly(d, st.keySigOnly);
    }
    // When the answer is given ON a keyboard, the reference highlight belongs on
    // that same keyboard (renderKeyInput/renderKeysInput apply it) — a second,
    // display-only piano above it would just split the learner's attention.
    const kbInput = q.input && (q.input.kind === 'key' || q.input.kind === 'keys');
    if (st.keyboard && !kbInput) {
      const d = document.createElement('div');
      d.style.width = '100%';
      d.style.maxWidth = '520px';
      box.appendChild(d);
      const range = st.keyboard.range || ['C3', 'C6'];
      const labels = stimulusLabels(S);
      const kb = global.Keyboard.create(d, { from: range[0], to: range[1], interactive: false, labels });
      kb.el.classList.add('is-static');
      (st.keyboard.highlights || []).forEach((h) => kb.highlight(h.midi, h.cls || 'target'));
      S.stimulusKb = kb;
    }
    if (st.audio) {
      const wrap = document.createElement('div');
      wrap.style.display = 'flex';
      wrap.style.flexDirection = 'column';
      wrap.style.alignItems = 'center';
      wrap.style.gap = '6px';
      const btn = UI.el('<button class="play-btn"><span aria-hidden="true">▶</span> Play</button>');
      wrap.appendChild(btn);
      const counter = document.createElement('span');
      counter.className = 'replays-left';
      wrap.appendChild(counter);
      box.appendChild(wrap);
      S.playBtn = btn;
      S.playCounter = counter;
      updateReplayCounter(S);
      btn.addEventListener('click', () => playStimulus(S));

      if (st.replayLabelExtra) { /* reserved */ }

      if (global.Store.settings.autoplay && st.autoplay !== false &&
          global.AudioEngine && global.AudioEngine.isReady()) {
        const qRef = q;
        S.autoplayTimer = setTimeout(() => {
          S.autoplayTimer = null;
          if (active === S && S.q === qRef && S.stage === 'question') playStimulus(S);
        }, 380);
      }
    }
  }

  function updateReplayCounter(S) {
    if (!S.playCounter) return;
    if (S.replaysLeft === null) {
      S.playCounter.textContent = '';
    } else {
      S.playCounter.textContent = S.replaysLeft + (S.replaysLeft === 1 ? ' play left' : ' plays left');
    }
  }

  function playStimulus(S, useReplayItems) {
    const audio = S.q.stimulus && S.q.stimulus.audio;
    if (!audio || !global.AudioEngine) return;
    if (S.replaysLeft !== null) {
      if (S.replaysLeft <= 0) return;
      if (S.stage === 'question') { S.replaysLeft--; updateReplayCounter(S); }
    }
    const items = (useReplayItems && audio.replayItems && audio.replayItems.length)
      ? audio.replayItems : audio.items;
    const btn = S.playBtn;
    global.AudioEngine.ensure().then(() => {
      if (active !== S) return;
      if (btn) btn.classList.add('is-playing');
      global.AudioEngine.stop();
      global.AudioEngine.playSeq(items, { bpm: audio.bpm || 90 }).then(() => {
        if (btn) btn.classList.remove('is-playing');
      });
    });
  }

  /* ---------------- inputs ---------------- */

  function renderInput(S) {
    const kind = S.q.input && S.q.input.kind;
    if (kind === 'choices') renderChoices(S);
    else if (kind === 'key') renderKeyInput(S);
    else if (kind === 'keys') renderKeysInput(S);
    else if (kind === 'melody') renderMelodyInput(S);
    else if (kind === 'rhythm') renderRhythmInput(S);
    else S.el.answer.innerHTML = '<p class="muted">Unsupported question type.</p>';
  }

  function renderChoices(S) {
    const q = S.q;
    const grid = document.createElement('div');
    grid.className = 'choices';
    const hasVisuals = q.choices.some((c) => c.tiles || c.staff);
    if (hasVisuals) grid.classList.add('wide');
    else if (q.choices.length === 2) grid.classList.add('cols-2');

    S.choiceBtns = {};
    q.choices.forEach((c, i) => {
      const btn = document.createElement('button');
      btn.className = 'choice-btn';
      if (i < 9) {
        const hint = document.createElement('span');
        hint.className = 'kbd-hint';
        hint.textContent = String(i + 1);
        hint.setAttribute('aria-hidden', 'true');
        btn.appendChild(hint);
        S.keyHandlers[String(i + 1)] = () => { if (S.stage === 'question') answerChoice(S, c.id); };
      }
      if (c.tiles) {
        btn.appendChild(UI.tileRow(c.tiles));
        btn.setAttribute('aria-label',
          c.tiles.map((t) => global.Exercises.TILES[t].label).join(', '));
      } else if (c.staff) {
        const d = document.createElement('span');
        btn.appendChild(d);
        global.Notation.render(d, Object.assign({ scale: 0.8 }, c.staff));
        try {
          btn.setAttribute('aria-label', 'Notation: ' +
            (c.staff.notes || []).map((n) => global.Theory.name(n)).join(', '));
        } catch (e) { btn.setAttribute('aria-label', 'Notation option ' + (i + 1)); }
      } else {
        const span = document.createElement('span');
        span.innerHTML = c.label;
        btn.appendChild(span);
      }
      btn.addEventListener('click', () => answerChoice(S, c.id));
      grid.appendChild(btn);
      S.choiceBtns[c.id] = btn;
    });
    S.el.answer.innerHTML = '';
    S.el.answer.appendChild(grid);
  }

  function answerChoice(S, id) {
    if (S.stage !== 'question') return;
    const q = S.q;
    const correct = id === q.answer;
    Object.keys(S.choiceBtns).forEach((cid) => {
      const b = S.choiceBtns[cid];
      b.disabled = true;
      // Glyph markers so right/wrong never rides on color alone.
      if (cid === String(q.answer)) {
        b.classList.add('is-correct');
        b.appendChild(UI.el('<span class="choice-mark">✓</span>'));
      } else if (cid === id) {
        b.classList.add('is-wrong');
        b.appendChild(UI.el('<span class="choice-mark">✗</span>'));
      } else b.classList.add('is-faded');
    });
    if (!correct && S.choiceBtns[id]) S.choiceBtns[id].classList.add('shake');
    finishQuestion(S, correct, correctChoiceText(S));
  }

  function correctChoiceText(S) {
    const q = S.q;
    const c = q.choices && q.choices.find((x) => x.id === q.answer);
    if (!c) return '';
    if (c.label) return 'Answer: ' + c.label;
    return 'The correct answer is highlighted.';
  }

  function inputKeyboard(S, range, onPress) {
    const d = document.createElement('div');
    d.style.width = '100%';
    const labelPref = resolveLabels(S);
    const kb = global.Keyboard.create(d, {
      from: range[0], to: range[1],
      interactive: true,
      labels: labelPref,
      onPress: (midi) => {
        if (global.AudioEngine) {
          global.AudioEngine.ensure().then(() => global.AudioEngine.playNote(midi, { dur: 0.7 }));
        }
        onPress(midi);
      },
    });
    S.inputKb = kb;
    return d;
  }

  // Per-skill label policy for the ANSWER keyboard: skills whose whole point is
  // locating or naming keys must not print the answer on them; skills that name
  // an exact target key cap labels at the C anchors.
  const LABEL_POLICY = {
    'kb-find-note': 'none',
    'kb-name-note': 'none',
    'staff-to-key': 'cap-c',
    'accidental-apply': 'cap-c',
  };

  function resolveLabels(S) {
    const setting = global.Store.settings.labels;
    const policy = LABEL_POLICY[S.q.skillId];
    if (policy === 'none') return 'none';
    let mode = setting === 'auto' ? 'c' : setting;
    if (policy === 'cap-c' && (mode === 'white' || mode === 'all')) mode = 'c';
    return mode;
  }

  function stimulusLabels(S) {
    // kb-name-note L2 answers carry octave numbers, so the C keys stay labeled
    // as anchors (targets are never C there); otherwise unlabeled.
    if (S.q.skillId === 'kb-name-note' && S.q.level >= 2) return 'c';
    return 'none';
  }

  function applyStimulusHighlights(S) {
    const st = S.q.stimulus;
    if (st && st.keyboard && st.keyboard.highlights) {
      st.keyboard.highlights.forEach((h) => S.inputKb.highlight(h.midi, h.cls || 'target'));
    }
  }

  function renderKeyInput(S) {
    const q = S.q;
    S.el.answer.innerHTML = '';
    S.el.answer.appendChild(inputKeyboard(S, q.input.range || ['C3', 'C6'], (midi) => {
      if (S.stage !== 'question') return;
      const correct = midi === q.answer;
      S.inputKb.highlight(midi, correct ? 'correct' : 'wrong');
      if (!correct) S.inputKb.highlight(q.answer, 'correct');
      finishQuestion(S, correct, 'Answer: ' + answerNameFor(S, q.answer, 0));
    }));
    applyStimulusHighlights(S);
  }

  function answerPrefer(S) {
    if (S.q.meta && S.q.meta.preferAcc) return S.q.meta.preferAcc;
    const p = (S.q.prompt || '') + ' ' + (S.q.explain || '');
    return p.indexOf('♭') !== -1 ? 'flat' : 'sharp';
  }

  function answerNameFor(S, midi, index) {
    const meta = S.q.meta;
    if (meta && meta.answerNames && meta.answerNames[index]) return meta.answerNames[index];
    return UI.noteName(midi, answerPrefer(S));
  }

  function renderKeysInput(S) {
    const q = S.q;
    const need = q.input.count;
    const picked = [];
    S.el.answer.innerHTML = '';

    const slots = document.createElement('div');
    slots.className = 'slots';
    for (let i = 0; i < need; i++) slots.appendChild(UI.el('<span class="slot">·</span>'));
    S.el.answer.appendChild(slots);

    const kbWrap = inputKeyboard(S, q.input.range || ['C3', 'C6'], (midi) => {
      if (S.stage !== 'question' || picked.length >= need) return;
      if (!q.input.ordered && picked.indexOf(midi) !== -1) return;
      picked.push(midi);
      refresh();
      if (picked.length === need) {
        const qRef = q;
        S.checkTimer = setTimeout(() => {
          S.checkTimer = null;
          if (active === S && S.q === qRef) check();
        }, 420);
      }
    });
    S.el.answer.appendChild(kbWrap);

    const actions = UI.el('<div class="input-actions">' +
      '<button class="btn btn-sm" data-x="undo">← Undo</button>' +
      '<button class="btn btn-sm btn-ghost" data-x="clear">Clear</button>' +
      '</div>');
    actions.querySelector('[data-x=undo]').addEventListener('click', () => {
      if (S.stage !== 'question') return;
      const m = picked.pop();
      if (m !== undefined) S.inputKb.unhighlight(m);
      refresh();
    });
    actions.querySelector('[data-x=clear]').addEventListener('click', () => {
      if (S.stage !== 'question') return;
      picked.length = 0;
      S.inputKb.clearHighlights();
      restoreTargets();
      refresh();
    });
    S.el.answer.appendChild(actions);

    const prefer = answerPrefer(S);
    function refresh() {
      Array.from(slots.children).forEach((sl, i) => {
        if (i < picked.length) {
          sl.className = 'slot filled';
          sl.textContent = UI.noteName(picked[i], prefer);
        } else {
          sl.className = 'slot';
          sl.textContent = '·';
        }
      });
      picked.forEach((m) => S.inputKb.highlight(m, 'accent'));
    }
    function restoreTargets() {
      const st = S.q.stimulus;
      if (st && st.keyboard && st.keyboard.highlights) {
        st.keyboard.highlights.forEach((h) => S.inputKb.highlight(h.midi, h.cls || 'target'));
      }
    }
    restoreTargets();

    function check() {
      if (S.stage !== 'question' || picked.length !== need) return;
      const ans = q.answer.slice();
      let correct;
      if (q.input.ordered) {
        correct = picked.every((m, i) => m === ans[i]);
      } else {
        correct = picked.length === ans.length && ans.every((m) => picked.indexOf(m) !== -1);
      }
      Array.from(slots.children).forEach((sl, i) => {
        const good = q.input.ordered ? picked[i] === ans[i] : ans.indexOf(picked[i]) !== -1;
        sl.classList.remove('filled');
        sl.classList.add(good ? 'ok' : 'bad');
        sl.textContent = (good ? '✓ ' : '✗ ') + sl.textContent;
      });
      S.inputKb.clearHighlights();
      picked.forEach((m, i) => {
        const good = q.input.ordered ? ans[i] === m : ans.indexOf(m) !== -1;
        S.inputKb.highlight(m, good ? 'correct' : 'wrong');
      });
      ans.forEach((m) => { if (picked.indexOf(m) === -1) S.inputKb.highlight(m, 'correct'); });
      if (correct && global.AudioEngine) {
        const confirmItems = ans.map((m) => ({ midi: m, beats: 0.5 }));
        S.confirmMs = global.AudioEngine.seqDuration(confirmItems, 160) * 1000;
        global.AudioEngine.ensure().then(() =>
          global.AudioEngine.playSeq(confirmItems, { bpm: 160 }));
      }
      const names = ans.map((m, i) => answerNameFor(S, m, i)).join(' – ');
      finishQuestion(S, correct, 'Answer: ' + names);
    }
  }

  function renderMelodyInput(S) {
    const q = S.q;
    const need = q.answer.length;
    const picked = [];
    S.el.answer.innerHTML = '';

    const slots = document.createElement('div');
    slots.className = 'slots';
    for (let i = 0; i < need; i++) slots.appendChild(UI.el('<span class="slot">·</span>'));
    S.el.answer.appendChild(slots);

    const kbWrap = inputKeyboard(S, q.input.range || ['C3', 'C6'], (midi) => {
      if (S.stage !== 'question' || picked.length >= need) return;
      picked.push(midi);
      refresh();
    });
    S.el.answer.appendChild(kbWrap);

    const actions = UI.el('<div class="input-actions">' +
      '<button class="btn btn-sm" data-x="undo">← Undo</button>' +
      '<button class="btn btn-sm btn-ghost" data-x="clear">Clear</button>' +
      '<button class="btn btn-sm btn-soft" data-x="replay">↻ Replay melody</button>' +
      '<button class="btn btn-primary" data-x="check" disabled>Check</button>' +
      '</div>');
    const checkBtn = actions.querySelector('[data-x=check]');
    actions.querySelector('[data-x=undo]').addEventListener('click', () => {
      if (S.stage !== 'question') return;
      picked.pop();
      refresh();
    });
    actions.querySelector('[data-x=clear]').addEventListener('click', () => {
      if (S.stage !== 'question') return;
      picked.length = 0;
      refresh();
    });
    actions.querySelector('[data-x=replay]').addEventListener('click', () => playStimulus(S, true));
    checkBtn.addEventListener('click', check);
    S.el.answer.appendChild(actions);
    S.keyHandlers['Enter'] = () => { if (S.stage === 'question' && picked.length === need) check(); };

    const prefer = (q.meta && q.meta.keySig < 0) ? 'flat' : 'sharp';
    function refresh() {
      Array.from(slots.children).forEach((sl, i) => {
        if (i < picked.length) {
          sl.className = 'slot filled';
          sl.textContent = UI.noteName(picked[i], prefer);
        } else {
          sl.className = 'slot';
          sl.textContent = '·';
        }
      });
      checkBtn.disabled = picked.length !== need;
    }

    function check() {
      if (S.stage !== 'question' || picked.length !== need) return;
      const ans = q.answer;
      const correct = picked.every((m, i) => m === ans[i]);
      Array.from(slots.children).forEach((sl, i) => {
        const good = picked[i] === ans[i];
        sl.classList.remove('filled');
        sl.classList.add(good ? 'ok' : 'bad');
        sl.textContent = (good ? '✓ ' : '✗ ') + sl.textContent;
      });
      const extra = buildCompareStaves(q, picked);
      if (correct && global.AudioEngine && q.meta && q.meta.melodyItems) {
        S.confirmMs = global.AudioEngine.seqDuration(q.meta.melodyItems, 100) * 1000;
        global.AudioEngine.ensure().then(() =>
          global.AudioEngine.playSeq(q.meta.melodyItems, { bpm: 100 }));
      }
      finishQuestion(S, correct, correct ? '' : 'Compare your line with the answer below.', extra);
    }
  }

  function buildCompareStaves(q, picked) {
    if (!q.meta || !q.meta.answerNotes) return null;
    const wrap = document.createElement('div');
    wrap.className = 'staff-compare feedback-extra';
    const clef = q.meta.clef || 'treble';
    const keySig = q.meta.keySig || 0;
    const prefer = keySig < 0 ? 'flat' : 'sharp';

    const lbl1 = UI.el('<span class="staff-label">You played</span>');
    const d1 = document.createElement('div');
    const userNotes = picked.map((m, i) => {
      const target = q.answer[i];
      const n = global.Theory.fromMidi(m, prefer);
      return { l: n.l, a: n.a, o: n.o, dur: 'q', cls: m === target ? 'correct' : 'wrong' };
    });
    const lbl2 = UI.el('<span class="staff-label">Answer</span>');
    const d2 = document.createElement('div');
    const ansNotes = q.meta.answerNotes.map((n) => ({ l: n.l, a: n.a, o: n.o, dur: 'q' }));

    wrap.appendChild(lbl1); wrap.appendChild(d1);
    wrap.appendChild(lbl2); wrap.appendChild(d2);
    try {
      global.Notation.render(d1, { clef, keySig, notes: userNotes, scale: 0.85 });
      global.Notation.render(d2, { clef, keySig, notes: ansNotes, scale: 0.85 });
    } catch (e) { /* notation failure shouldn't block feedback */ }
    return wrap;
  }

  function renderRhythmInput(S) {
    const q = S.q;
    const totalBeats = q.input.beats * (q.input.bars || 1);
    const chosen = [];
    S.el.answer.innerHTML = '';

    const track = document.createElement('div');
    track.className = 'rhythm-track';
    S.el.answer.appendChild(track);

    const palette = document.createElement('div');
    palette.className = 'tile-palette';
    const tiles = global.Exercises.TILES;
    (q.input.tiles || Object.keys(tiles)).forEach((tid) => {
      const btn = document.createElement('button');
      btn.className = 'tile-btn';
      btn.innerHTML = '<span class="tile">' + UI.tileSVG(tid) + '</span>' +
        '<span class="tile-beats">' + tiles[tid].beats + (tiles[tid].beats === 1 ? ' beat' : ' beats') + '</span>';
      btn.title = tiles[tid].label;
      btn.addEventListener('click', () => {
        if (S.stage !== 'question') return;
        if (used() + tiles[tid].beats > totalBeats) return;
        chosen.push(tid);
        refresh();
      });
      btn.dataset.tile = tid;
      palette.appendChild(btn);
    });
    S.el.answer.appendChild(palette);

    const actions = UI.el('<div class="input-actions">' +
      '<button class="btn btn-sm" data-x="undo">← Undo</button>' +
      '<button class="btn btn-sm btn-ghost" data-x="clear">Clear</button>' +
      '<button class="btn btn-primary" data-x="check" disabled>Check</button>' +
      '</div>');
    const checkBtn = actions.querySelector('[data-x=check]');
    actions.querySelector('[data-x=undo]').addEventListener('click', () => {
      if (S.stage !== 'question') return;
      chosen.pop();
      refresh();
    });
    actions.querySelector('[data-x=clear]').addEventListener('click', () => {
      if (S.stage !== 'question') return;
      chosen.length = 0;
      refresh();
    });
    checkBtn.addEventListener('click', check);
    S.el.answer.appendChild(actions);
    S.keyHandlers['Enter'] = () => { if (S.stage === 'question' && used() === totalBeats) check(); };

    function used() {
      return chosen.reduce((a, t) => a + tiles[t].beats, 0);
    }

    function refresh() {
      track.innerHTML = '';
      let acc = 0;
      chosen.forEach((t) => {
        const tile = document.createElement('span');
        tile.className = 'tile';
        tile.innerHTML = UI.tileSVG(t);
        track.appendChild(tile);
        acc += tiles[t].beats;
        if (acc % q.input.beats === 0 && acc < totalBeats) {
          track.appendChild(UI.el('<span class="barline"></span>'));
        }
      });
      const left = totalBeats - used();
      if (left > 0) {
        track.appendChild(UI.el('<span class="beats-left">' + left + (left === 1 ? ' beat' : ' beats') + ' left</span>'));
        track.classList.remove('ok');
      } else {
        track.classList.add('ok');
      }
      checkBtn.disabled = used() !== totalBeats;
      Array.from(palette.children).forEach((b) => {
        b.disabled = used() + tiles[b.dataset.tile].beats > totalBeats;
      });
    }
    refresh();

    function check() {
      if (S.stage !== 'question' || used() !== totalBeats) return;
      const ans = q.answer;
      const exact = chosen.length === ans.length && chosen.every((t, i) => t === ans[i]);
      // Two spellings of the same silence (hr vs qr+qr) SOUND identical, so a
      // learner who heard correctly is never marked wrong for the other one.
      const equivalent = !exact &&
        global.Exercises.rhythmSignature(chosen) === global.Exercises.rhythmSignature(ans);
      const correct = exact || equivalent;
      const cls = exact
        ? chosen.map(() => 'ok')
        : (equivalent ? chosen.map(() => 'ok') : chosen.map((t, i) => (t === ans[i] ? 'ok' : 'bad')));
      track.innerHTML = '';
      track.appendChild(UI.tileRow(chosen, cls));
      let extra = null;
      if (!exact) {
        extra = document.createElement('div');
        extra.className = 'feedback-extra staff-compare';
        extra.appendChild(UI.el('<span class="staff-label">' +
          (equivalent ? 'Same sound — usually written' : 'Answer') + '</span>'));
        extra.appendChild(UI.tileRow(ans));
      }
      finishQuestion(S, correct,
        correct ? '' : 'The answer rhythm is shown below.', extra);
    }
  }

  /* ---------------- grading / flow ---------------- */

  function finishQuestion(S, correct, answerText, extraEl) {
    S.stage = 'feedback';
    S.answered++;
    if (correct) S.correct++;

    let levelNote = null;
    if (S.mode === 'quiz') {
      if (correct) S.quizScore++;
    } else {
      const maxL = global.Exercises.maxLevel(S.q.skillId);
      const res = global.Store.recordAnswer(S.q.skillId, correct, maxL);
      if (res.leveledUp) {
        levelNote = { up: true, text: 'Level up! Now Level ' + res.level +
          (global.Exercises.levelDesc(S.q.skillId, res.level) ? ' — ' + global.Exercises.levelDesc(S.q.skillId, res.level) : '') };
      } else if (res.leveledDown) {
        levelNote = { up: false, text: 'Let\'s rebuild — back to Level ' + res.level + ' for a moment.' };
      }
    }

    const fb = document.createElement('div');
    fb.className = 'feedback ' + (correct ? 'ok' : 'bad');
    let head = correct ? '✓ Correct!' : '✗ Not quite.';
    if (!correct && answerText) head += ' ' + answerText;
    fb.innerHTML = '<span>' + head + '</span>';
    if (S.q.explain) {
      fb.appendChild(UI.el('<span class="explain">' + S.q.explain + '</span>'));
    }
    if (extraEl) fb.appendChild(extraEl);
    S.el.feedback.innerHTML = '';
    S.el.feedback.appendChild(fb);

    if (levelNote) {
      S.el.feedback.appendChild(UI.el('<div class="levelup-banner">' +
        (levelNote.up ? '★ ' : '↺ ') + levelNote.text + '</div>'));
      if (levelNote.up) UI.confetti();
    }

    const nextBtn = UI.el('<button class="btn btn-primary btn-lg">' +
      (S.mode === 'quiz' && S.quizIndex + 1 >= S.quizPlan.length ? 'See results' : 'Next') +
      ' <span aria-hidden="true">→</span></button>');
    nextBtn.addEventListener('click', () => advance(S));
    S.el.actions.innerHTML = '';
    S.el.actions.appendChild(nextBtn);
    nextBtn.focus({ preventScroll: true });
    S.keyHandlers = { Enter: () => advance(S), ' ': () => advance(S) };

    updateHead(S);

    if (correct && S.mode !== 'quiz') {
      // Long enough to read the explain line, and never cutting off a
      // confirmation playback (scale/melody replays set confirmMs).
      const delay = Math.max(2600, (S.confirmMs || 0) + 1400);
      S.autoTimer = setTimeout(() => advance(S), delay);
    }
  }

  function advance(S) {
    if (S.stage !== 'feedback') return;
    S.stage = 'question';
    if (S.mode === 'quiz') S.quizIndex++;
    nextQuestion(S);
  }

  function showResults(S) {
    clearTimers(S);
    S.keyHandlers = {};
    S.q = null;
    const unit = global.Curriculum.unitById(S.unitId);
    const passed = S.quizScore >= unit.quiz.pass;
    global.Store.recordQuiz(S.unitId, S.quizScore, S.quizPlan.length, passed);
    const next = global.Curriculum.nextUnit(S.unitId);

    const R = 74;
    const C = 2 * Math.PI * R;
    const frac = S.quizScore / S.quizPlan.length;

    S.container.innerHTML = '';
    const root = UI.el(
      '<div class="results">' +
      '  <div class="score-ring' + (passed ? ' pass' : '') + '">' +
      '    <svg width="168" height="168" viewBox="0 0 168 168">' +
      '      <circle class="ring-bg" cx="84" cy="84" r="' + R + '" fill="none" stroke-width="11"/>' +
      '      <circle class="ring-val" cx="84" cy="84" r="' + R + '" fill="none" stroke-width="11" stroke-linecap="round" ' +
      '        stroke-dasharray="' + C.toFixed(1) + '" stroke-dashoffset="' + C.toFixed(1) + '"/>' +
      '    </svg>' +
      '    <div class="score-num"><b>' + S.quizScore + '/' + S.quizPlan.length + '</b><span>need ' + unit.quiz.pass + ' to pass</span></div>' +
      '  </div>' +
      '  <h2>' + (passed ? 'Unit ' + unit.n + ' complete!' : 'Almost there') + '</h2>' +
      '  <p class="results-msg">' +
      (passed
        ? (next ? 'Beautiful work. <b>Unit ' + next.n + ': ' + next.title + '</b> is now unlocked.'
                : 'You\'ve completed the whole course. Extraordinary work — keep it sharp with Daily Review.')
        : 'You need ' + unit.quiz.pass + ' of ' + S.quizPlan.length + '. Drill the skills below a little more, then try again — you\'re close.') +
      '  </p>' +
      '  <div class="input-actions"></div>' +
      '</div>');
    const actions = root.querySelector('.input-actions');
    const back = UI.el('<button class="btn">Back to unit</button>');
    back.addEventListener('click', () => endSessionTo(S));
    actions.appendChild(back);
    if (passed && next) {
      const go = UI.el('<button class="btn btn-primary btn-lg">Start Unit ' + next.n + ' →</button>');
      go.addEventListener('click', () => { destroyActive(); global.location.hash = '#/unit/' + next.id; });
      actions.appendChild(go);
    } else if (!passed) {
      const retry = UI.el('<button class="btn btn-primary">Retry quiz</button>');
      retry.addEventListener('click', () => {
        Session.start(S.container, { mode: 'quiz', unitId: S.unitId, onExit: S.onExit });
      });
      actions.appendChild(retry);
    }
    S.container.appendChild(root);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        root.querySelector('.ring-val').style.strokeDashoffset = (C * (1 - frac)).toFixed(1);
      });
    });
    if (passed) UI.confetti();
  }

  function endSessionTo(S) {
    destroyActive();
    S.onExit({ answered: S.answered, correct: S.correct });
  }

  function onKeydown(S, e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const tag = (e.target && e.target.tagName) || '';
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    if (e.key === 'r' || e.key === 'R') {
      if (S.q && S.q.stimulus && S.q.stimulus.audio) { e.preventDefault(); playStimulus(S); }
      return;
    }
    const h = S.keyHandlers[e.key];
    if (h) { e.preventDefault(); h(); }
  }

  global.UI = UI;
  global.Session = Session;
  if (typeof module !== 'undefined' && module.exports) module.exports = { Session, UI };
})(typeof window !== 'undefined' ? window : globalThis);
