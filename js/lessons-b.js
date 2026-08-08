(function (global) {
  'use strict';

  const LessonsB = {

    u7: {
      intro: 'Every major scale hides a second home inside it. This unit re-centers the notes you already know to unlock minor keys — and trains your ear to tell major from minor in seconds.',
      sections: [
        {
          title: 'Same notes, new home',
          body:
            '<p>Play every white key from <span class="note-chip">A3</span> up to <span class="note-chip">A4</span>. No sharps, no flats — and yet it doesn’t sound like C major. It sounds shaded, serious. You’ve just played the <strong>natural minor scale</strong>: the same seven notes as a major scale, re-centered on a new home note.</p>' +
            '<p>Re-centering rearranges the steps into whole–half–whole–whole–half–whole–whole, and the crucial change comes early: the third note now sits only three half steps above the tonic. That small, dark third colors everything you hear after it.</p>',
          demo: {
            kind: 'keyboard',
            range: ['C3', 'C6'],
            labels: 'c',
            highlights: [
              { midi: 57, cls: 'target' },
              { midi: 59, cls: 'accent' },
              { midi: 60, cls: 'accent' },
              { midi: 62, cls: 'accent' },
              { midi: 64, cls: 'accent' },
              { midi: 65, cls: 'accent' },
              { midi: 67, cls: 'accent' },
              { midi: 69, cls: 'target' }
            ],
            caption: 'A natural minor: the white keys from A3 to A4 — C major’s notes with a new home.'
          }
        },
        {
          title: 'Three flavors of minor',
          body:
            '<p>Composers often adjust the top of minor. <strong>Harmonic minor</strong> raises the 7th degree a half step — in A minor, <span class="note-chip">G</span> becomes <span class="note-chip">G♯</span> — restoring a leading tone that pulls hungrily up to the tonic.</p>' +
            '<p><strong>Melodic minor</strong>, in its ascending form, raises both the 6th and the 7th (<span class="note-chip">F♯</span> and <span class="note-chip">G♯</span> in A minor) to smooth the climb; descending melodies usually relax back to natural minor. Play the demo and listen for the lift that raised 7th creates.</p>',
          demo: {
            kind: 'play',
            label: '▶ Hear natural, then harmonic minor',
            audio: {
              items: [
                { midi: 57, beats: 0.5 }, { midi: 59, beats: 0.5 }, { midi: 60, beats: 0.5 },
                { midi: 62, beats: 0.5 }, { midi: 64, beats: 0.5 }, { midi: 65, beats: 0.5 },
                { midi: 67, beats: 0.5 }, { midi: 69, beats: 1.5 },
                { rest: true, beats: 1 },
                { midi: 57, beats: 0.5 }, { midi: 59, beats: 0.5 }, { midi: 60, beats: 0.5 },
                { midi: 62, beats: 0.5 }, { midi: 64, beats: 0.5 }, { midi: 65, beats: 0.5 },
                { midi: 68, beats: 0.5 }, { midi: 69, beats: 1.5 }
              ],
              bpm: 100
            },
            caption: 'A natural minor, then A harmonic minor — the G♯ near the top changes the pull.'
          }
        },
        {
          title: 'Relative keys',
          body:
            '<p>A minor and C major use identical notes and share one key signature; only the home note differs. Keys paired this way are <strong>relative keys</strong>. Every major key keeps its <strong>relative minor</strong> on its 6th degree — or, counted the other way, three half steps <em>below</em> the major tonic.</p>' +
            '<p>So E♭ major’s relative is C minor, and G major’s is E minor. On the circle of fifths, each minor key rides inside its major partner: one signature, two homes.</p>',
          demo: {
            kind: 'circle5',
            caption: 'The circle of fifths: each major key shares its signature with the relative minor on its 6th degree.'
          }
        },
        {
          title: 'Hearing major vs minor',
          body:
            '<p>The difference between major and minor lives in the third. A major third above the tonic sounds bright and open; lower it one half step and the color darkens. So when a scale or chord plays, don’t chase individual notes — ask one question first: is the overall color bright or dark?</p>' +
            '<p>Singing helps. <em>Do–re–mi</em> feels sunny in a major key; in minor, that third step sinks noticeably lower.</p>',
          demo: {
            kind: 'play',
            label: '▶ Major chord, then minor',
            audio: {
              items: [
                { midis: [60, 64, 67], beats: 2 },
                { rest: true, beats: 1 },
                { midis: [60, 63, 67], beats: 2 }
              ],
              bpm: 90
            },
            caption: 'C major, then C minor — same root and fifth; only the third moves, and the mood flips.'
          }
        },
        {
          title: 'How to practice',
          body:
            '<p>Build natural minor scales until the step pattern is automatic, then add the harmonic and melodic forms and name the raised degrees out loud. Drill relative keys in both directions until E♭-major-to-C-minor is instant. In the listening drill, answer from the color of the third alone — mastery is calling major or minor before the sound fades.</p>'
        }
      ]
    },

    u8: {
      intro: 'Three notes, stacked in thirds, give music its basic building block. Here you learn to spell every triad in every quality — and to rotate them into inversions without losing track of the root.',
      sections: [
        {
          title: 'Stacking thirds',
          body:
            '<p>Play <span class="note-chip">C4</span>, <span class="note-chip">E4</span>, and <span class="note-chip">G4</span> together and listen to three notes fuse into a single sound. That stack is a <strong>triad</strong>, the fundamental chord of Western music. The bottom note is the <strong>root</strong> and gives the chord its name; above it sit the <strong>third</strong> and the <strong>fifth</strong>.</p>' +
            '<p>On the staff, a root-position triad is a tidy snowman — line–line–line or space–space–space — because each note skips one letter: C, skip D, E, skip F, G.</p>',
          demo: {
            kind: 'staff',
            staff: {
              clef: 'treble',
              chord: true,
              notes: [
                { l: 'C', a: 0, o: 4 },
                { l: 'E', a: 0, o: 4 },
                { l: 'G', a: 0, o: 4 }
              ]
            },
            caption: 'C major in root position: C, E, G — skip a letter, skip a letter.'
          }
        },
        {
          title: 'Four qualities',
          body:
            '<p>Stack different sizes of third and you get the four <strong>qualities</strong>. <strong>Major</strong> is a major third with a minor third on top: C–E–G. <strong>Minor</strong> flips that order: C–E♭–G. <strong>Diminished</strong> stacks two minor thirds: C–E♭–G♭, pinched and tense. <strong>Augmented</strong> stacks two major thirds: C–E–G♯, oddly weightless.</p>' +
            '<p>Check the frame, too: major and minor sit inside a perfect fifth, diminished shrinks to a tritone, augmented stretches a half step wider. Spelling still works by letter-skips in every quality: an E♭ major triad is E♭–G–B♭. Play the demo slowly and let each quality register as a mood before you analyze it.</p>',
          demo: {
            kind: 'play',
            label: '▶ Hear the four qualities',
            audio: {
              items: [
                { midis: [60, 64, 67], beats: 2 },
                { rest: true, beats: 1 },
                { midis: [60, 63, 67], beats: 2 },
                { rest: true, beats: 1 },
                { midis: [60, 63, 66], beats: 2 },
                { rest: true, beats: 1 },
                { midis: [60, 64, 68], beats: 2 }
              ],
              bpm: 90
            },
            caption: 'From C: major, minor, diminished, augmented.'
          }
        },
        {
          title: 'Inversions',
          body:
            '<p>A chord needn’t keep its root on the bottom. Send <span class="note-chip">C4</span> up an octave and E–G–C remains C major — now in <strong>first inversion</strong>, with the third in the bass. Rotate once more to G–C–E and you have <strong>second inversion</strong>, fifth in the bass.</p>' +
            '<p>To name any close-position triad, hunt for the two notes a fourth apart: the upper of those two is always the root. In E–G–C, the fourth is G-to-C, so the root is C on top — first inversion. No fourth anywhere? You’re in root position, snowman intact. On the staff the same clue appears as one visibly wider gap between noteheads, and that gap points at the root.</p>',
          demo: {
            kind: 'play',
            label: '▶ Rotate C major',
            audio: {
              items: [
                { midis: [60, 64, 67], beats: 2 },
                { rest: true, beats: 1 },
                { midis: [64, 67, 72], beats: 2 },
                { rest: true, beats: 1 },
                { midis: [67, 72, 76], beats: 2 }
              ],
              bpm: 90
            },
            caption: 'C major rotated: root position, first inversion, second inversion.'
          }
        },
        {
          title: 'How to practice',
          body:
            '<p>Read staff triads by their letter-skips, then build them on the keyboard from every root the drill offers, saying the quality as you play. For inversions, find the fourth — its top note is your root. Mastery feels like seeing a chord as one shape rather than three notes, a fluency you’ll lean on when we start hearing chords next unit.</p>'
        }
      ]
    },

    u9: {
      intro: 'You can spell chords; now you’ll recognize them blind. The secret is to hear a chord the way you see a color — as one impression, not three separate ingredients.',
      sections: [
        {
          title: 'Bright, dark, tense, strange',
          body:
            '<p>Each triad quality has an emotional fingerprint. <strong>Major</strong> sounds bright and settled, <strong>minor</strong> darker and more inward. <strong>Diminished</strong> is tense and pinched — it seems to want to collapse. <strong>Augmented</strong> is the strange one: built from two equal major thirds, it sounds directionless, because no interval inside it tells your ear where the root is.</p>' +
            '<p>When a chord plays, take in the whole color first, the way you recognize a friend’s voice without analyzing it. The drill plays each chord as a block and then broken — use the broken version to check yourself. Still torn? Zoom in on the third: bright means major, lowered means minor.</p>',
          demo: {
            kind: 'play',
            label: '▶ Major and minor, block then broken',
            audio: {
              items: [
                { midis: [60, 64, 67], beats: 2 },
                { midi: 60, beats: 0.5 }, { midi: 64, beats: 0.5 }, { midi: 67, beats: 0.5 },
                { rest: true, beats: 1.5 },
                { midis: [60, 63, 67], beats: 2 },
                { midi: 60, beats: 0.5 }, { midi: 63, beats: 0.5 }, { midi: 67, beats: 0.5 }
              ],
              bpm: 90
            },
            caption: 'C major, then C minor — each as a block chord, then arpeggiated.'
          }
        },
        {
          title: 'Hearing inversions',
          body:
            '<p>Inversions are a bass-line skill. Root position feels planted, because the lowest note <em>is</em> the chord’s name-tone. Put the third or fifth in the bass and the same chord feels lighter, as if leaning forward onto its next step.</p>' +
            '<p>When the chord breaks into an arpeggio, sing along and find the two notes a fourth apart — the upper one is the root, exactly as on paper. Root in the bass: root position. Root on top: first inversion. Root in the middle: second inversion.</p>',
          demo: {
            kind: 'play',
            label: '▶ One chord, three basses',
            audio: {
              items: [
                { midis: [55, 59, 62], beats: 2 },
                { rest: true, beats: 1 },
                { midis: [59, 62, 67], beats: 2 },
                { rest: true, beats: 1 },
                { midis: [62, 67, 71], beats: 2 }
              ],
              bpm: 90
            },
            caption: 'G major three ways — listen to how each new bass note changes the chord’s balance.'
          }
        },
        {
          title: 'Seventh chords',
          body:
            '<p>Add one more third on top of a triad and you have a <strong>seventh chord</strong> — four notes and a richer palette. Start with three: the <strong>major 7th</strong> (major triad plus a major seventh) glows, soft and jazzy; the <strong>dominant 7th</strong> (major triad plus a <em>minor</em> seventh) is restless and bluesy, itching to resolve; the <strong>minor 7th</strong> (minor triad plus a minor seventh) is mellow and rounded.</p>' +
            '<p>Later the drill adds the <strong>half-diminished 7th</strong> and the <strong>diminished 7th</strong> — both dark and unstable, the fully diminished one tightest of all.</p>',
          demo: {
            kind: 'play',
            label: '▶ Three seventh chords on C',
            audio: {
              items: [
                { midis: [60, 64, 67, 71], beats: 2 },
                { rest: true, beats: 1 },
                { midis: [60, 64, 67, 70], beats: 2 },
                { rest: true, beats: 1 },
                { midis: [60, 63, 67, 70], beats: 2 }
              ],
              bpm: 90
            },
            caption: 'On C: major 7th, dominant 7th, minor 7th.'
          }
        },
        {
          title: 'How to practice',
          body:
            '<p>Run each drill with your eyes closed and answer on first impression — in ear training, your instant guess is usually your best one. When two colors blur (minor versus diminished trips everyone at first), play the pair back to back on the keyboard until the difference feels physical. Mastery is naming quality — and inversion — from a single block chord.</p>'
        }
      ]
    },

    u10: {
      intro: 'Rhythm is the grammar of time. This unit gives you the vocabulary — beats, bars, and note values — then teaches you to read and write a bar of rhythm you’ve only heard.',
      sections: [
        {
          title: 'Beats, bars, and time signatures',
          body:
            '<p>Beneath every piece runs the <strong>beat</strong>, the steady pulse you tap your foot to. Beats group into <strong>bars</strong> (also called measures), and a <strong>time signature</strong> announces the grouping. In <strong>4/4</strong>, each bar holds four beats and the quarter note gets one beat; in <strong>3/4</strong>, each bar holds three. The signature isn’t a fraction — it’s a label: how many beats, and which note value carries them.</p>' +
            '<p>Note values are fractions of that pulse: a <strong>whole note</strong> lasts four beats, a <strong>half note</strong> two, a <strong>quarter note</strong> one, and a pair of beamed <strong>eighth notes</strong> splits one beat in two.</p>',
          demo: {
            kind: 'tiles',
            tiles: ['q', 'q', 'q', 'q'],
            caption: 'One bar of 4/4: four quarter notes, one per beat.'
          }
        },
        {
          title: 'Dots and rests',
          body:
            '<p>A <strong>dot</strong> after a note stretches it by half its own length, so a dotted half lasts 2 + 1 = 3 beats and a dotted quarter lasts a beat and a half. A <strong>rest</strong> is measured silence — a quarter rest occupies exactly one beat of quiet, and you count it as strictly as any note.</p>' +
            '<p>Treat every bar as arithmetic: in 4/4 the values must total exactly four beats. If your tiles add up to three or five, something is misplaced.</p>',
          demo: {
            kind: 'tiles',
            tiles: ['hd', 'qr'],
            caption: 'Dotted half (3 beats) plus quarter rest (1 silent beat) = one full bar of 4/4.'
          }
        },
        {
          title: 'Count out loud',
          body:
            '<p>Count aloud with the pulse — “1, 2, 3, 4” — adding “and” to split beats for eighth notes: “1 and 2 and.” Long notes are held <em>through</em> their counts: a half note starting on beat 3 sounds on “3” and rings through “4.” Tap or conduct while you count; rhythm lives in the body before it lives on the page.</p>' +
            '<p>Every listening drill begins with four clicks of count-in. Use them to lock onto the tempo, and keep counting while the rhythm plays over the continuing click.</p>',
          demo: {
            kind: 'play',
            label: '▶ Count-in, then a rhythm',
            audio: {
              items: [
                { click: 'hi', beats: 1 },
                { click: 'lo', beats: 1 },
                { click: 'lo', beats: 1 },
                { click: 'lo', beats: 1 },
                { midi: 67, beats: 1 },
                { midi: 67, beats: 1 },
                { midi: 67, beats: 2 }
              ],
              bpm: 90
            },
            caption: 'Four count-in clicks, then: quarter, quarter, half — count “1, 2, 3-hold-4.”'
          }
        },
        {
          title: 'How to practice',
          body:
            '<p>In the reading drill, tap each answer choice with a finger while the heard rhythm loops in your memory — the wrong ones will stumble. In dictation, secure the arithmetic first (four beats, always), then place the long notes and fill in the rest. Mastery is catching a bar in one or two listens, with the syncopated figures at the top level feeling like friends, not traps.</p>'
        }
      ]
    },

    u11: {
      intro: 'Writing down a melody you’ve just heard looks like a magic trick. It isn’t — it’s a method: plant the key in your ear, then hear every note as a scale degree.',
      sections: [
        {
          title: 'Degrees, not letters',
          body:
            '<p>Your ear doesn’t register absolute note names; it registers <em>relationships</em>. Once a key is established, each note carries a felt identity — its <strong>scale degree</strong>. Degree 1 (<em>do</em>) is home. Degree 5 (<em>sol</em>) is strong and open. Degree 7 (<em>ti</em>) leans hungrily up toward home, and 2 (<em>re</em>) hovers just above it.</p>' +
            '<p>That’s why every dictation here opens with a <strong>cadence</strong> — a short I–IV–V–I chord progression, then the tonic note alone. It plants “home” firmly in your ear before the first melody note arrives.</p>',
          demo: {
            kind: 'play',
            label: '▶ Hear the home-base cadence',
            audio: {
              items: [
                { midis: [60, 64, 67], beats: 1 },
                { midis: [60, 65, 69], beats: 1 },
                { midis: [59, 62, 67], beats: 1 },
                { midis: [60, 64, 67], beats: 1 },
                { rest: true, beats: 1 },
                { midi: 60, beats: 1 }
              ],
              bpm: 84
            },
            caption: 'The dictation cadence in C major: I–IV–V–I, then the tonic alone. Home planted.'
          }
        },
        {
          title: 'Anchors: 1, 3, 5',
          body:
            '<p>Degrees 1, 3, and 5 — the notes of the tonic chord — are your <strong>anchor tones</strong>. When a mystery note sounds, sing it, hold it, and slide stepwise to the nearest anchor, counting as you go. Land one step above 1? It was 2. One step below 1? That was 7.</p>' +
            '<p>Each anchor has its own gravity: 1 feels like rest, 3 carries the key’s major-or-minor color, 5 feels stable but open, like a held breath. The degree drill trains exactly this reflex, one note at a time.</p>',
          demo: {
            kind: 'play',
            label: '▶ Cadence, then one mystery note',
            audio: {
              items: [
                { midis: [60, 64, 67], beats: 1 },
                { midis: [60, 65, 69], beats: 1 },
                { midis: [59, 62, 67], beats: 1 },
                { midis: [60, 64, 67], beats: 1 },
                { rest: true, beats: 1 },
                { midi: 60, beats: 1 },
                { rest: true, beats: 1 },
                { midi: 64, beats: 1.5 }
              ],
              bpm: 84
            },
            caption: 'After the cadence and tonic, one note sounds. Sing to the nearest anchor — this one is degree 3 (mi).'
          }
        },
        {
          title: 'Taking down a melody',
          body:
            '<p>Take melodies in passes, not note by note. First listen: catch the shape — where it rises, falls, moves by step or by leap. Second listen: pin down degrees, starting from the note you’re given (early melodies begin on the tonic) and checking against your anchors; leaps in these melodies nearly always land on 1, 3, or 5. Then enter the notes and replay to verify.</p>' +
            '<p>Above all, sing. If you can sing the melody in degrees — “1–2–3” for do–re–mi — your fingers already know where to go. One caution: octaves count when you enter notes on the keys, so notice whether a leap crossed above or below your anchor.</p>',
          demo: {
            kind: 'play',
            label: '▶ A complete dictation',
            audio: {
              items: [
                { midis: [60, 64, 67], beats: 1 },
                { midis: [60, 65, 69], beats: 1 },
                { midis: [59, 62, 67], beats: 1 },
                { midis: [60, 64, 67], beats: 1 },
                { rest: true, beats: 1 },
                { midi: 60, beats: 1 },
                { rest: true, beats: 1 },
                { midi: 60, beats: 1 },
                { midi: 62, beats: 1 },
                { midi: 64, beats: 2 }
              ],
              bpm: 84
            },
            caption: 'Cadence, tonic, then a three-note melody: C4, D4, E4 — degrees 1, 2, 3.'
          }
        },
        {
          title: 'How to practice',
          body:
            '<p>Stay with the degree drill until single notes name themselves, then move to full melodies, always singing before you answer. Ration the replay button: two attentive listens beat five careless ones. Mastery is hearing a short melody as a sentence of degrees and writing it down while it still echoes.</p>'
        }
      ]
    },

    u12: {
      intro: 'A key gives you seven chords, and every chord has a job — home, away, or tension. Learn the jobs and you can hear a progression the way you read a sentence, punctuation included.',
      sections: [
        {
          title: 'The seven diatonic chords',
          body:
            '<p>Build a triad on each degree of a major scale, using only the key’s own notes, and you get its seven <strong>diatonic</strong> chords. We label them with <strong>Roman numerals</strong>: uppercase for major, lowercase for minor, a small ° for diminished. In every major key the pattern is identical — I, ii, iii, IV, V, vi, vii°.</p>' +
            '<p>In C major that yields C, D minor, E minor, F, G, A minor, and B diminished. Learn the pattern once and you own it in every key.</p>',
          demo: {
            kind: 'play',
            label: '▶ Climb the chords of C major',
            audio: {
              items: [
                { midis: [60, 64, 67], beats: 1 },
                { midis: [62, 65, 69], beats: 1 },
                { midis: [64, 67, 71], beats: 1 },
                { midis: [65, 69, 72], beats: 1 },
                { midis: [67, 71, 74], beats: 1 },
                { midis: [69, 72, 76], beats: 1 },
                { midis: [71, 74, 77], beats: 1 },
                { midis: [72, 76, 79], beats: 2 }
              ],
              bpm: 84
            },
            caption: 'I, ii, iii, IV, V, vi, vii°, then I again — every chord built from C major’s own notes.'
          }
        },
        {
          title: 'Chord jobs',
          body:
            '<p>Chords cluster into three jobs. <strong>Tonic</strong> chords (I, with vi as its softer stand-in) are home: stable, at rest. <strong>Subdominant</strong> chords (IV and ii) step away from home and set things in motion. <strong>Dominant</strong> chords (V and vii°) carry tension — both contain the leading tone, which aches to rise back to the tonic.</p>' +
            '<p>Most phrases trace the arc home → away → tension → home. Countless four-chord songs are built on exactly this loop; once you hear the arc in the demo, you’ll start hearing it on the radio, too.</p>',
          demo: {
            kind: 'play',
            label: '▶ Home, away, tension, home',
            audio: {
              items: [
                { midis: [60, 64, 67], beats: 1 },
                { midis: [60, 65, 69], beats: 1 },
                { midis: [59, 62, 67], beats: 1 },
                { midis: [60, 64, 67], beats: 2 }
              ],
              bpm: 84
            },
            caption: 'C major: I (home) → IV (away) → V (tension) → I (home).'
          }
        },
        {
          title: 'Cadences',
          body:
            '<p>A <strong>cadence</strong> is how a phrase ends — musical punctuation. The <strong>authentic cadence</strong>, V to I, is a full stop: tension resolving squarely home; the drill plays it as I–IV–V–I. The <strong>plagal cadence</strong>, IV to I, is the gentler “Amen” of hymn singing, played as I–IV–I. The <strong>half cadence</strong> stops <em>on</em> V — I–IV–V — a comma left hanging in mid-air.</p>' +
            '<p>Later the drill adds the <strong>deceptive cadence</strong>: V resolves to vi instead of I. Your ear expects home and gets home’s shadow.</p>',
          demo: {
            kind: 'play',
            label: '▶ A half cadence',
            audio: {
              items: [
                { midis: [60, 64, 67], beats: 1 },
                { midis: [60, 65, 69], beats: 1 },
                { midis: [59, 62, 67], beats: 2 }
              ],
              bpm: 84
            },
            caption: 'I–IV–V and stop: the phrase parks on V and leans, waiting for an answer.'
          }
        },
        {
          title: 'Harmony in minor',
          body:
            '<p>Minor keys deal the same cards in a new order. Building triads on the natural minor scale gives i, ii°, III, iv, v, VI, VII — in A minor: A minor, B diminished, C, D minor, E minor, F, G.</p>' +
            '<p>Notice that v comes out <em>minor</em>; that’s how our drills label it. In much real music, composers raise the 7th degree (harmonic minor) to turn v into a major V with a true leading tone — but the natural-minor pattern is the baseline to memorize.</p>',
          demo: {
            kind: 'play',
            label: '▶ i–iv–v–i in A minor',
            audio: {
              items: [
                { midis: [57, 60, 64], beats: 1 },
                { midis: [57, 62, 65], beats: 1 },
                { midis: [59, 64, 67], beats: 1 },
                { midis: [57, 60, 64], beats: 2 }
              ],
              bpm: 84
            },
            caption: 'A minor: i, iv, the natural-minor v, then home to i.'
          }
        },
        {
          title: 'How to practice',
          body:
            '<p>Drill Roman numerals until “IV of E major” answers itself: count up to the degree, then apply the quality pattern. In the listening drills, track the bass and the ending — did the phrase land home after tension (authentic), settle gently (plagal), or stop and lean (half)? Mastery is hearing a four-chord loop and naming each chord’s job as it goes by.</p>'
        }
      ]
    }
  };

  global.LessonsB = LessonsB;
  if (typeof module !== 'undefined' && module.exports) module.exports = LessonsB;
})(typeof window !== 'undefined' ? window : globalThis);
