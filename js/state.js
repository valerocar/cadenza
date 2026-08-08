(function (global) {
  'use strict';

  const KEY = 'cadenza.v1';

  const defaults = () => ({
    skills: {},
    units: {},
    settings: { theme: 'auto', volume: 0.8, labels: 'auto', autoplay: true },
    stats: { xp: 0, answered: 0, correct: 0, days: [], bestStreak: 0 },
  });

  let data = defaults();

  function num(v, def, lo, hi) {
    if (typeof v !== 'number' || !isFinite(v)) return def;
    return Math.max(lo, Math.min(hi, Math.round(v)));
  }

  function sanitize(parsed) {
    const d = defaults();
    if (!parsed || typeof parsed !== 'object') return d;

    if (parsed.skills && typeof parsed.skills === 'object') {
      Object.keys(parsed.skills).forEach((id) => {
        const s = parsed.skills[id];
        if (!s || typeof s !== 'object') return;
        d.skills[id] = {
          level: num(s.level, 1, 1, 9),
          streak: num(s.streak, 0, 0, 99),
          misses: num(s.misses, 0, 0, 99),
          attempts: num(s.attempts, 0, 0, 1e7),
          correct: num(s.correct, 0, 0, 1e7),
          recent: Array.isArray(s.recent) ? s.recent.slice(-20).map((x) => (x ? 1 : 0)) : [],
        };
      });
    }
    if (parsed.units && typeof parsed.units === 'object') {
      Object.keys(parsed.units).forEach((id) => {
        const u = parsed.units[id];
        if (!u || typeof u !== 'object') return;
        d.units[id] = {
          quizPassed: !!u.quizPassed,
          bestScore: num(u.bestScore, 0, 0, 100),
          attempts: num(u.attempts, 0, 0, 1e6),
        };
      });
    }
    const st = parsed.settings || {};
    if (st.theme === 'light' || st.theme === 'dark') d.settings.theme = st.theme;
    if (typeof st.volume === 'number' && isFinite(st.volume)) {
      d.settings.volume = Math.max(0, Math.min(1, st.volume));
    }
    if (['auto', 'none', 'c', 'white', 'all'].indexOf(st.labels) !== -1) d.settings.labels = st.labels;
    if (typeof st.autoplay === 'boolean') d.settings.autoplay = st.autoplay;

    const sp = parsed.stats || {};
    d.stats.xp = num(sp.xp, 0, 0, 1e9);
    d.stats.answered = num(sp.answered, 0, 0, 1e9);
    d.stats.correct = num(sp.correct, 0, 0, 1e9);
    d.stats.bestStreak = num(sp.bestStreak, 0, 0, 1e6);
    if (Array.isArray(sp.days)) {
      d.stats.days = sp.days.filter((x) => typeof x === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(x)).slice(-400);
    }
    return d;
  }

  function load() {
    try {
      const raw = global.localStorage && global.localStorage.getItem(KEY);
      if (raw) data = sanitize(JSON.parse(raw));
    } catch (e) { data = defaults(); }
  }

  function save() {
    try {
      if (global.localStorage) global.localStorage.setItem(KEY, JSON.stringify(data));
    } catch (e) { /* storage unavailable (private mode) — keep in memory */ }
  }

  function today() {
    const d = new Date();
    const p = (x) => String(x).padStart(2, '0');
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
  }

  function skill(id) {
    if (!data.skills[id]) {
      data.skills[id] = { level: 1, streak: 0, misses: 0, attempts: 0, correct: 0, recent: [] };
    }
    return data.skills[id];
  }

  function unit(id) {
    if (!data.units[id]) data.units[id] = { quizPassed: false, bestScore: 0, attempts: 0 };
    return data.units[id];
  }

  function markToday() {
    const t = today();
    if (!data.stats.days.includes(t)) {
      data.stats.days.push(t);
      if (data.stats.days.length > 400) data.stats.days = data.stats.days.slice(-400);
    }
  }

  function dayStreak() {
    const days = new Set(data.stats.days);
    if (days.size === 0) return 0;
    let streak = 0;
    const d = new Date();
    const p = (x) => String(x).padStart(2, '0');
    const fmt = (dd) => dd.getFullYear() + '-' + p(dd.getMonth() + 1) + '-' + p(dd.getDate());
    if (!days.has(fmt(d))) d.setDate(d.getDate() - 1);
    while (days.has(fmt(d))) {
      streak++;
      d.setDate(d.getDate() - 1);
    }
    return streak;
  }

  const Store = {
    load,
    save,

    // ---- skills / leveling ----
    skill(id) { return skill(id); },

    recordAnswer(skillId, isCorrect, maxLevel) {
      const s = skill(skillId);
      s.attempts++;
      data.stats.answered++;
      markToday();
      let leveledUp = false;
      let leveledDown = false;
      if (isCorrect) {
        s.correct++;
        data.stats.correct++;
        s.streak++;
        s.misses = 0;
        data.stats.xp += 10 + 2 * s.level;
        if (s.streak > data.stats.bestStreak) data.stats.bestStreak = s.streak;
        if (s.streak >= 5 && s.level < maxLevel) {
          s.level++;
          s.streak = 0;
          leveledUp = true;
        }
      } else {
        s.streak = 0;
        s.misses++;
        if (s.misses >= 3 && s.level > 1) {
          s.level--;
          s.misses = 0;
          leveledDown = true;
        }
      }
      s.recent.push(isCorrect ? 1 : 0);
      if (s.recent.length > 20) s.recent = s.recent.slice(-20);
      save();
      return { leveledUp, leveledDown, level: s.level, streak: s.streak };
    },

    skillProgress(id, maxLevel) {
      const s = skill(id);
      const withinLevel = Math.min(s.streak, 5) / 5;
      return Math.min(1, ((s.level - 1) + withinLevel) / maxLevel);
    },

    skillAccuracy(id) {
      const s = skill(id);
      if (!s.recent.length) return null;
      return s.recent.reduce((a, b) => a + b, 0) / s.recent.length;
    },

    // ---- units / unlocking ----
    unit(id) { return unit(id); },

    unitUnlocked(unitId) {
      const u = global.Curriculum.unitById(unitId);
      if (!u) return false;
      if (u.n === 1) return true;
      const prev = global.Curriculum.units[u.n - 2];
      return unit(prev.id).quizPassed;
    },

    recordQuiz(unitId, score, n, passed) {
      const u = unit(unitId);
      u.attempts++;
      if (score > u.bestScore) u.bestScore = score;
      if (passed && !u.quizPassed) {
        u.quizPassed = true;
        data.stats.xp += 100;
      }
      markToday();
      save();
    },

    unitProgress(unitId) {
      const u = global.Curriculum.unitById(unitId);
      if (!u) return 0;
      const ex = global.Exercises;
      let sum = 0;
      u.skills.forEach((s) => {
        sum += Store.skillProgress(s.id, ex ? ex.maxLevel(s.id) : 4);
      });
      const drills = sum / u.skills.length;
      return unit(unitId).quizPassed ? 1 : Math.min(0.95, drills);
    },

    // ---- settings / stats ----
    get settings() { return data.settings; },
    setSetting(k, v) { data.settings[k] = v; save(); },

    get stats() { return data.stats; },
    dayStreak,

    overallAccuracy() {
      if (!data.stats.answered) return null;
      return data.stats.correct / data.stats.answered;
    },

    completedUnits() {
      return global.Curriculum.units.filter((u) => unit(u.id).quizPassed);
    },

    resetAll() {
      data = defaults();
      save();
    },
  };

  global.Store = Store;
  if (typeof module !== 'undefined' && module.exports) module.exports = Store;
})(typeof window !== 'undefined' ? window : globalThis);
