(function (global) {
  'use strict';

  const units = [
    {
      id: 'u1', n: 1, title: 'The Keyboard & Note Names',
      tagline: 'Learn the geography of the piano — the map for everything ahead.',
      skills: [
        { id: 'kb-find-note', title: 'Find the Key', icon: '⌖', kind: 'build' },
        { id: 'kb-name-note', title: 'Name the Key', icon: 'A', kind: 'visual' },
      ],
    },
    {
      id: 'u2', n: 2, title: 'Reading the Staff',
      tagline: 'Turn written notes into keys under your fingers.',
      skills: [
        { id: 'staff-id-treble', title: 'Treble Clef Notes', icon: '𝄞', kind: 'visual' },
        { id: 'staff-id-bass', title: 'Bass Clef Notes', icon: '𝄢', kind: 'visual' },
        { id: 'staff-to-key', title: 'Staff to Keyboard', icon: '♪', kind: 'build' },
      ],
    },
    {
      id: 'u3', n: 3, title: 'Accidentals & Steps',
      tagline: 'Sharps, flats, and the smallest distances in music.',
      skills: [
        { id: 'step-id', title: 'Half or Whole Step?', icon: '½', kind: 'visual' },
        { id: 'accidental-apply', title: 'Apply Accidentals', icon: '♯', kind: 'build' },
        { id: 'enharmonic-match', title: 'Enharmonic Twins', icon: '♭', kind: 'visual' },
      ],
    },
    {
      id: 'u4', n: 4, title: 'Major Scales & Key Signatures',
      tagline: 'The pattern behind every major key.',
      skills: [
        { id: 'scale-build-major', title: 'Build Major Scales', icon: '𝄚', kind: 'build' },
        { id: 'keysig-id', title: 'Key Signatures', icon: '♯', kind: 'visual' },
        { id: 'scale-degree-id', title: 'Scale Degrees', icon: '5', kind: 'visual' },
      ],
    },
    {
      id: 'u5', n: 5, title: 'Intervals',
      tagline: 'Name the distance between any two notes.',
      skills: [
        { id: 'interval-size', title: 'Interval Size', icon: '↕', kind: 'visual' },
        { id: 'interval-quality', title: 'Interval Quality', icon: 'M3', kind: 'visual' },
        { id: 'interval-build', title: 'Build Intervals', icon: '⌖', kind: 'build' },
      ],
    },
    {
      id: 'u6', n: 6, title: 'Hearing Intervals',
      tagline: 'Train your ear to recognize distances by sound.',
      skills: [
        { id: 'ear-interval-mel', title: 'Melodic Intervals', icon: '♫', kind: 'ear' },
        { id: 'ear-interval-harm', title: 'Harmonic Intervals', icon: '𝄩', kind: 'ear' },
      ],
    },
    {
      id: 'u7', n: 7, title: 'Minor Scales & Relative Keys',
      tagline: 'The darker side of every key signature.',
      skills: [
        { id: 'scale-build-minor', title: 'Build Minor Scales', icon: '𝄚', kind: 'build' },
        { id: 'relative-keys', title: 'Relative Keys', icon: '⇄', kind: 'visual' },
        { id: 'ear-major-minor', title: 'Major or Minor?', icon: '☯', kind: 'ear' },
      ],
    },
    {
      id: 'u8', n: 8, title: 'Triads & Inversions',
      tagline: 'Stack thirds to build the chords behind every song.',
      skills: [
        { id: 'triad-id', title: 'Identify Triads', icon: '≡', kind: 'visual' },
        { id: 'triad-build', title: 'Build Triads', icon: '⌖', kind: 'build' },
        { id: 'inversion-id', title: 'Inversions', icon: '⟳', kind: 'visual' },
      ],
    },
    {
      id: 'u9', n: 9, title: 'Hearing Chords',
      tagline: 'Recognize chord colors: bright, dark, and tense.',
      skills: [
        { id: 'ear-triad', title: 'Triad Quality', icon: '♬', kind: 'ear' },
        { id: 'ear-inversion', title: 'Hear Inversions', icon: '⟳', kind: 'ear' },
        { id: 'ear-seventh', title: 'Seventh Chords', icon: '7', kind: 'ear' },
      ],
    },
    {
      id: 'u10', n: 10, title: 'Rhythm & Meter',
      tagline: 'Read and write the grammar of musical time.',
      skills: [
        { id: 'rhythm-math', title: 'Note Values', icon: '♩', kind: 'visual' },
        { id: 'rhythm-read', title: 'Match the Rhythm', icon: '♪♪', kind: 'ear' },
        { id: 'rhythm-dictation', title: 'Rhythmic Dictation', icon: '✎', kind: 'ear' },
      ],
    },
    {
      id: 'u11', n: 11, title: 'Melodic Dictation',
      tagline: 'Hear a melody. Write it down.',
      skills: [
        { id: 'ear-degree', title: 'Scale Degrees by Ear', icon: '𝄽', kind: 'ear' },
        { id: 'melodic-dictation', title: 'Melodic Dictation', icon: '✎', kind: 'ear' },
      ],
    },
    {
      id: 'u12', n: 12, title: 'Diatonic Harmony',
      tagline: 'Every chord has a job: home, away, tension.',
      skills: [
        { id: 'roman-numeral', title: 'Roman Numerals', icon: 'IV', kind: 'visual' },
        { id: 'ear-cadence', title: 'Cadences', icon: '𝄂', kind: 'ear' },
        { id: 'ear-progression', title: 'Progressions', icon: '→', kind: 'ear' },
      ],
    },
  ];

  units.forEach((u) => { u.quiz = { n: 10, pass: 8 }; });

  const byId = {};
  const skillIndex = {};
  units.forEach((u) => {
    byId[u.id] = u;
    u.skills.forEach((s) => { skillIndex[s.id] = { skill: s, unit: u }; });
  });

  const Curriculum = {
    units,
    unitById(id) { return byId[id] || null; },
    skillById(id) { return skillIndex[id] || null; },
    prevUnit(id) {
      const u = byId[id];
      return u && u.n > 1 ? units[u.n - 2] : null;
    },
    nextUnit(id) {
      const u = byId[id];
      return u && u.n < units.length ? units[u.n] : null;
    },
  };

  global.Curriculum = Curriculum;
  if (typeof module !== 'undefined' && module.exports) module.exports = Curriculum;
})(typeof window !== 'undefined' ? window : globalThis);
