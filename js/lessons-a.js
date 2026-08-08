(function (global) {
  'use strict';

  const LessonsA = {

    u1: {
      intro: 'Every piece of music you will ever play lives on this row of keys. In this unit you learn the keyboard’s layout: seven letter names, black-key landmarks, and middle C.',
      sections: [
        {
          title: 'Seven letters, repeating',
          body: '<p>The white keys use just seven letter names — <strong>A B C D E F G</strong> — and then the alphabet starts over. Walk up the keyboard and the names cycle: …F, G, A, B, C… all the way to the top.</p><p>Two keys with the same name sound uncannily alike: play any C, then the next C up, and you hear the same “color” at a greater height. That distance — from one letter to its next repeat — is an <strong>octave</strong>.</p>'
        },
        {
          title: 'Black keys are your landmarks',
          body: '<p>The black keys cluster in alternating groups of <strong>two</strong> and <strong>three</strong>, and those groups are how you find your place without counting from the end of the keyboard. The rule worth memorizing: <strong>C is the white key just left of any two-black-key group</strong>, and <strong>F is just left of any three-black-key group</strong>.</p><p>Find a two-group anywhere, drop to the white key on its left, and you have C. From there the letters walk up one white key at a time — C, D, E, F, G, A, B — and the next C starts the cycle again.</p><p>The black keys borrow their names from their white neighbors. The black key just <em>right</em> of C is <span class="note-chip">C♯</span> (“C sharp” — a small step up from C); the very same key, seen from D, is <span class="note-chip">D♭</span> (“D flat” — a small step down from D). One key, two names — you’ll use both in the drills, and Unit 3 explains why both exist.</p>',
          demo: {
            kind: 'keyboard',
            range: ['C3', 'C6'],
            highlights: [
              { midi: 60, cls: 'target' },
              { midi: 61, cls: 'accent' },
              { midi: 63, cls: 'accent' }
            ],
            caption: 'A two-black-key group, with the C just to its left. This works at every two-group on the keyboard.'
          }
        },
        {
          title: 'Middle C and octave numbers',
          body: '<p>A full piano has eight Cs, so names alone aren’t enough — each note also carries an octave number. <strong>Middle C</strong>, the C nearest the middle of the piano, is <span class="note-chip">C4</span>. The C an octave higher is <span class="note-chip">C5</span>; an octave lower, <span class="note-chip">C3</span>.</p><p>One detail trips everyone up: the number changes at C, not at A. Climbing from <span class="note-chip">A3</span> you reach <span class="note-chip">B3</span>, and the very next white key is <span class="note-chip">C4</span> — a new octave begins there.</p>',
          demo: {
            kind: 'keyboard',
            range: ['C3', 'C6'],
            highlights: [{ midi: 60, cls: 'target' }],
            labels: 'c',
            caption: 'Middle C — C4. Every labeled C starts a new octave number.'
          }
        },
        {
          title: 'Hear the octave',
          body: '<p>Before you drill, listen once with intent. The demo plays four Cs, each an octave apart. Notice how your ear files them as “the same note” even though they clearly rise — that sameness is why the alphabet is allowed to repeat.</p>',
          demo: {
            kind: 'play',
            label: '▶ Hear four Cs',
            audio: {
              items: [
                { midi: 48, beats: 1 },
                { midi: 60, beats: 1 },
                { midi: 72, beats: 1 },
                { midi: 84, beats: 1 }
              ],
              bpm: 72
            },
            caption: 'C3, C4, C5, C6 — same name, same color, different height.'
          }
        },
        {
          title: 'How to practice',
          body: '<p>Drill <em>Find the key</em> until you can land on any named white key in about two seconds, then <em>Name the key</em> to go the other way. Mastery feels like reading a map you’ve walked a hundred times: you stop counting up from C and simply see where <span class="note-chip">D4</span> or <span class="note-chip">A3</span> lives.</p>'
        }
      ]
    },

    u2: {
      intro: 'The staff is a picture of the keyboard turned on its side: the higher a note sits on the page, the higher it sounds. This unit teaches you to read that picture in both clefs.',
      sections: [
        {
          title: 'Five lines, four spaces',
          body: '<p>Written music sits on a <strong>staff</strong>: five horizontal lines with four spaces between them. Every line and every space holds one letter name, and moving from a line to the next space (or a space to the next line) moves you exactly one letter — one white key.</p><p>That is the whole machine: step up the staff, step up the musical alphabet. What the staff can’t tell you by itself is <em>which</em> letters — for that you need a clef.</p>'
        },
        {
          title: 'The treble clef: anchored on G',
          body: '<p>The <strong>treble clef</strong> is an ornate letter G: its inner curl wraps around the second line from the bottom, stamping it <span class="note-chip">G4</span>. Anchor there and count neighbors. The lines, bottom to top, are E, G, B, D, F (<span class="note-chip">E4</span> up to <span class="note-chip">F5</span>), and the spaces spell a handy word: <strong>F–A–C–E</strong>.</p>',
          demo: {
            kind: 'staff',
            staff: {
              clef: 'treble',
              notes: [
                { l: 'E', a: 0, o: 4 },
                { l: 'G', a: 0, o: 4 },
                { l: 'B', a: 0, o: 4 },
                { l: 'D', a: 0, o: 5 },
                { l: 'F', a: 0, o: 5 }
              ],
              gap: 'wide'
            },
            caption: 'The treble lines, bottom to top: E4, G4, B4, D5, F5. The clef’s curl marks the G line.'
          }
        },
        {
          title: 'The bass clef: anchored on F',
          body: '<p>Lower notes use the <strong>bass clef</strong>, a stylized F whose two dots straddle the second line from the top, marking it <span class="note-chip">F3</span>. Its lines, bottom to top, are G, B, D, F, A (<span class="note-chip">G2</span> up to <span class="note-chip">A3</span>), and its spaces are A, C, E, G.</p><p>Don’t treat the two clefs as separate worlds to memorize. Each is the same alphabet ladder with a different anchor: find the clef’s home note, then walk letters up or down from it.</p>',
          demo: {
            kind: 'staff',
            staff: {
              clef: 'bass',
              notes: [
                { l: 'G', a: 0, o: 2 },
                { l: 'B', a: 0, o: 2 },
                { l: 'D', a: 0, o: 3 },
                { l: 'F', a: 0, o: 3 },
                { l: 'A', a: 0, o: 3 }
              ],
              gap: 'wide'
            },
            caption: 'The bass lines, bottom to top: G2, B2, D3, F3, A3. The dots straddle the F line.'
          }
        },
        {
          title: 'Ledger lines and middle C',
          body: '<p>Notes that overflow the staff ride on <strong>ledger lines</strong> — short line fragments stacked above or below it. Middle C is the famous case: it sits one ledger line <em>below</em> the treble staff and one ledger line <em>above</em> the bass staff. Same key, two written addresses — which is exactly how the two staves join into the grand staff that pianists read.</p>',
          demo: {
            kind: 'staff',
            staff: {
              clef: 'treble',
              notes: [{ l: 'C', a: 0, o: 4 }]
            },
            caption: 'Middle C rides its own short ledger line just below the treble staff.'
          }
        },
        {
          title: 'How to practice',
          body: '<p>Run the treble and bass naming drills until each note gets a one-look answer, then <em>Staff to key</em> to wire notation straight to your hands. Mastery feels like reading words instead of letters: you see <span class="note-chip">B4</span> on the page and your finger already knows the place.</p>'
        }
      ]
    },

    u3: {
      intro: 'Between any key and its nearest neighbor lies music’s smallest distance: the half step. This unit gives you that ruler, plus the symbols — sharps and flats — that move notes by it.',
      sections: [
        {
          title: 'The half step',
          body: '<p>Press any key, then the very next key to its right — black or white, whichever is nearer. That tiny distance is a <strong>half step</strong> (also called a semitone), the smallest step Western music uses.</p><p>Usually the nearest neighbor is a black key, but look closely: between E and F, and between B and C, there is no black key at all. Those two pairs of white keys are <strong>natural half steps</strong>. Remember them — every scale you build will pivot around where they fall.</p>',
          demo: {
            kind: 'keyboard',
            range: ['C3', 'C6'],
            highlights: [
              { midi: 64, cls: 'accent' },
              { midi: 65, cls: 'accent' }
            ],
            labels: 'white',
            caption: 'E to F: a half step between two white keys — no black key in between.'
          }
        },
        {
          title: 'Sharps, flats, and naturals',
          body: '<p>A <strong>sharp</strong> (♯) raises a note one half step; a <strong>flat</strong> (♭) lowers it one half step; a <strong>natural</strong> (♮) cancels either one. So the black key just right of C is <span class="note-chip">C♯</span> — and since it also sits just left of D, it is equally <span class="note-chip">D♭</span>.</p><p>One key, two legitimate names. Notes spelled differently that share a key are <strong>enharmonic equivalents</strong>. Which spelling a piece uses isn’t random — it depends on the key and the direction of the line — so learn to read both with equal comfort.</p>',
          demo: {
            kind: 'staff',
            staff: {
              clef: 'treble',
              notes: [
                { l: 'C', a: 1, o: 4 },
                { l: 'D', a: -1, o: 4 }
              ],
              gap: 'wide'
            },
            caption: 'C♯4 and D♭4 on the staff: two spellings, one piano key.'
          }
        },
        {
          title: 'The whole step',
          body: '<p>Two half steps make a <strong>whole step</strong>. On the keyboard a whole step always skips exactly one key: C to D is a whole step (skipping C♯), and E to F♯ is a whole step (skipping F). Watch the traps: E to F and B to C are only half steps, because nothing sits between them.</p><p>Play the demo and listen. The half step sounds tight and leaning, almost tense; the whole step sounds open and settled. These two sounds are the atoms every scale is built from.</p>',
          demo: {
            kind: 'play',
            label: '▶ Half step, then whole step',
            audio: {
              items: [
                { midi: 60, beats: 1 },
                { midi: 61, beats: 1 },
                { rest: true, beats: 1 },
                { midi: 60, beats: 1 },
                { midi: 62, beats: 1 }
              ],
              bpm: 76
            },
            caption: 'C to C♯ (half step), then C to D (whole step). Hear how the whole step relaxes.'
          }
        },
        {
          title: 'How to practice',
          body: '<p>Drill <em>Half or whole?</em> until the E–F and B–C traps can’t catch you, then move to applying accidentals and matching enharmonic spellings. Mastery feels like owning a ruler: shown any two nearby keys, you know the distance instantly — and you can name one key two different ways without blinking.</p>'
        }
      ]
    },

    u4: {
      intro: 'Play the white keys from C to C and you get the major scale — music’s home-base sound. The scale is really a recipe of steps, and this unit teaches you to cook it from any starting note.',
      sections: [
        {
          title: 'The recipe: W–W–H–W–W–W–H',
          body: '<p>Listen to the C major scale climb from <span class="note-chip">C4</span> to <span class="note-chip">C5</span>, then measure each step with last unit’s ruler: whole, whole, <strong>half</strong>, whole, whole, whole, <strong>half</strong>. The half steps land exactly at E–F and B–C — the two white-key pairs with no black key between them.</p><p>That pattern, <strong>W–W–H–W–W–W–H</strong>, is the <strong>major scale</strong>. It isn’t a fact about C; it’s a portable recipe. C major just happens to be the one starting note where the recipe needs no black keys.</p>',
          demo: {
            kind: 'play',
            label: '▶ C major scale',
            audio: {
              items: [
                { midi: 60, beats: 0.5 },
                { midi: 62, beats: 0.5 },
                { midi: 64, beats: 0.5 },
                { midi: 65, beats: 0.5 },
                { midi: 67, beats: 0.5 },
                { midi: 69, beats: 0.5 },
                { midi: 71, beats: 0.5 },
                { midi: 72, beats: 1 }
              ],
              bpm: 84
            },
            caption: 'C4 to C5: whole, whole, half, whole, whole, whole, half.'
          }
        },
        {
          title: 'Moving the recipe: D major',
          body: '<p>Start on D and apply the same pattern: D, E, then a whole step above E must be <span class="note-chip">F♯</span> — plain F would be only a half step. Continue: G, A, B, then <span class="note-chip">C♯</span>, then D. Two sharps, both forced by the recipe.</p><p>Why call it F♯ and not G♭? Because a scale uses <strong>each letter name exactly once</strong>. D major already needs a G of its own, so the third note must be some kind of F. That single rule keeps every scale’s spelling honest.</p>',
          demo: {
            kind: 'play',
            label: '▶ D major scale',
            audio: {
              items: [
                { midi: 62, beats: 0.5 },
                { midi: 64, beats: 0.5 },
                { midi: 66, beats: 0.5 },
                { midi: 67, beats: 0.5 },
                { midi: 69, beats: 0.5 },
                { midi: 71, beats: 0.5 },
                { midi: 73, beats: 0.5 },
                { midi: 74, beats: 1 }
              ],
              bpm: 84
            },
            staff: {
              clef: 'treble',
              keySig: 2,
              notes: [
                { l: 'D', a: 0, o: 4 },
                { l: 'E', a: 0, o: 4 },
                { l: 'F', a: 1, o: 4 },
                { l: 'G', a: 0, o: 4 },
                { l: 'A', a: 0, o: 4 },
                { l: 'B', a: 0, o: 4 },
                { l: 'C', a: 1, o: 5 },
                { l: 'D', a: 0, o: 5 }
              ]
            },
            caption: 'The same recipe from D needs F♯ and C♯ — written once in the key signature, not before every note.'
          }
        },
        {
          title: 'Key signatures: the recipe in shorthand',
          body: '<p>Writing ♯ before every F and C in a D major piece would be clutter. Instead, notation lists the sharps once at the start of each line — the <strong>key signature</strong> — and they apply for the whole piece. Two sharps up front means: this music lives in D major’s world.</p><p>Signatures grow in a fixed order: sharps join as <strong>F–C–G–D–A–E–B</strong>, flats in the reverse order, <strong>B–E–A–D–G–C–F</strong>. Two reading shortcuts: the last sharp sits one half step below the major key’s name, and with two or more flats, the second-to-last flat <em>is</em> the key — three flats (B♭, E♭, A♭) means E♭ major. F major, with its single B♭, you simply remember.</p>'
        },
        {
          title: 'The circle of fifths',
          body: '<p>Arrange the keys in a circle where each clockwise step starts the scale on its fifth note: C, G, D, A, E, B, F♯. Every step adds exactly one sharp. Go counterclockwise instead — C, F, B♭, E♭, A♭, D♭, G♭ — and every step adds one flat. Neighboring keys share six of their seven notes, which is why they feel like family when music moves between them.</p>',
          demo: {
            kind: 'circle5',
            caption: 'Clockwise: up a fifth, add a sharp. Counterclockwise: add a flat. Neighbors share six of seven notes.'
          }
        },
        {
          title: 'Naming the degrees',
          body: '<p>Once a scale is home base, its notes get numbered 1 through 7 — the <strong>scale degrees</strong> — and each number has a classical name that hints at its job: <strong>1 tonic</strong> (home), <strong>2 supertonic</strong> (just above home), <strong>3 mediant</strong> (midway to 5), <strong>4 subdominant</strong>, <strong>5 dominant</strong> (home’s strongest partner), <strong>6 submediant</strong>, and <strong>7 leading tone</strong> — one half step below home, leaning hard into it.</p><p>Degrees are how musicians talk about melody without naming a key: “it starts on 5” is true in every key at once. The two worth knowing cold from day one are the <em>tonic</em> and the <em>dominant</em> — 1 and 5 anchor nearly everything you will hear in this course.</p>'
        },
        {
          title: 'How to practice',
          body: '<p>Build scales on the keyboard until W–W–H–W–W–W–H lives in your fingers, then drill key signatures in both directions. Mastery feels like this: shown three sharps, you answer “A major” before you’ve consciously counted — and building E major feels no harder than C.</p>'
        }
      ]
    },

    u5: {
      intro: 'An interval is the distance between two notes, and every one has a first and last name: a size you get by counting letters, and a quality you get by counting half steps.',
      sections: [
        {
          title: 'Size: count the letters',
          body: '<p>To size up an interval, count letter names from the bottom note to the top one, <strong>including both ends</strong>. C up to E: C, D, E — three letters, so it’s a <strong>3rd</strong>. C up to G spans five letters: a <strong>5th</strong>. Two notes on the same letter and spot make a <strong>unison</strong>; eight letters bring you back to the same name — an <strong>octave</strong>.</p><p>Accidentals never change the size. C to E♭ is still a 3rd — three letters — even though it’s a half step narrower. On the staff, size is visual: line to the very next line (or space to space) is a 3rd, and notes hugging an adjacent line and space are a 2nd.</p>',
          demo: {
            kind: 'staff',
            staff: {
              clef: 'treble',
              notes: [
                { l: 'C', a: 0, o: 4 },
                { l: 'E', a: 0, o: 4 }
              ],
              chord: true
            },
            caption: 'C up to E: three letter names, so a 3rd.'
          }
        },
        {
          title: 'Quality: count the half steps',
          body: '<p>Size is the street; <strong>quality</strong> is the house number. C–E and C–E♭ are both 3rds, but they sound different because they span different numbers of half steps: four for C–E, three for C–E♭. Four half steps make a <strong>major 3rd</strong>, bright and warm; three make a <strong>minor 3rd</strong>, darker and softer.</p><p>Every interval works this way: get the size from the letters, then count half steps to pin down the quality. A major 2nd is 2 half steps and a minor 2nd is 1; a perfect 5th is 7; an octave is 12.</p>',
          demo: {
            kind: 'play',
            label: '▶ Major 3rd, then minor 3rd',
            audio: {
              items: [
                { midis: [60, 64], beats: 2 },
                { rest: true, beats: 1 },
                { midis: [60, 63], beats: 2 }
              ],
              bpm: 80
            },
            caption: 'Four half steps (C–E), then three (C–E♭): major 3rd, then minor 3rd.'
          }
        },
        {
          title: 'Two families: perfect, and major/minor',
          body: '<p>Qualities come in two families. Unisons, 4ths, 5ths, and octaves are the <strong>perfect</strong> intervals — one standard size each: 5, 7, and 12 half steps for the 4th, 5th, and octave. 2nds, 3rds, 6ths, and 7ths each come in a <strong>major</strong> version and a <strong>minor</strong> version one half step smaller.</p><p>Stretch a perfect or major interval by a half step without changing the letters and it becomes <strong>augmented</strong>; shrink a perfect or minor one the same way and it becomes <strong>diminished</strong>. The famous case is the six-half-step gap between the perfect 4th and 5th: the restless <strong>tritone</strong>, spelled either as an augmented 4th or a diminished 5th.</p>',
          demo: {
            kind: 'staff',
            staff: {
              clef: 'treble',
              notes: [
                { l: 'F', a: 0, o: 4 },
                { l: 'B', a: 0, o: 4 }
              ],
              chord: true
            },
            caption: 'F up to B: four letters but six half steps — an augmented 4th, the tritone.'
          }
        },
        {
          title: 'How to practice',
          body: '<p>Drill sizes first — they’re pure letter-counting — then add qualities, then build intervals upward from a given key. Mastery feels mechanical in the best way: see two notes, count letters, count half steps, name the interval. Five seconds, no guessing.</p>'
        }
      ]
    },

    u6: {
      intro: 'You can now build and name intervals on paper. This unit moves them into your ear, using a two-pass strategy: judge the size of the leap first, then its flavor.',
      sections: [
        {
          title: 'Pass one: how far did it jump?',
          body: '<p>When two notes sound, don’t lunge for the exact name. Ask one rough question first: was that jump <strong>small, medium, or large</strong>? 2nds sound like ordinary walking — two notes crowded next to each other. 3rds are a comfortable hop. 4ths and 5ths are a confident leap, and 6ths or wider feel like a real reach for a singer.</p><p>That single judgment shrinks thirteen possibilities down to two or three. Rough first, precise second — that’s the whole trick.</p>',
          demo: {
            kind: 'play',
            label: '▶ Small, medium, large',
            audio: {
              items: [
                { midi: 60, beats: 0.75 },
                { midi: 62, beats: 0.75 },
                { rest: true, beats: 0.5 },
                { midi: 60, beats: 0.75 },
                { midi: 67, beats: 0.75 },
                { rest: true, beats: 0.5 },
                { midi: 60, beats: 0.75 },
                { midi: 72, beats: 1 }
              ],
              bpm: 84
            },
            caption: 'A 2nd, then a 5th, then an octave: a step, a leap, a vault. Catch the size first.'
          }
        },
        {
          title: 'Pass two: what flavor?',
          body: '<p>Once size has narrowed the field, listen for <strong>quality</strong>. Major intervals sound bright and open-hearted; minor ones are darker and more wistful. The perfect intervals — 4th, 5th, octave — have a plain, hollow, open ring, neither happy nor sad. And the tritone refuses to settle: it buzzes with tension and wants to move somewhere.</p><p>Play the demo: same size, two flavors. You’ve heard the difference between major and minor 3rds your whole life — every sad song leans on it — so trust the feeling and attach the name.</p>',
          demo: {
            kind: 'play',
            label: '▶ Bright 3rd, dark 3rd',
            audio: {
              items: [
                { midi: 60, beats: 0.75 },
                { midi: 64, beats: 1 },
                { rest: true, beats: 0.75 },
                { midi: 60, beats: 0.75 },
                { midi: 63, beats: 1 }
              ],
              bpm: 80
            },
            caption: 'C up to E (major 3rd), then C up to E♭ (minor 3rd). Same size, different flavor.'
          }
        },
        {
          title: 'Anchor with the scale you know',
          body: '<p>When two candidates still tie, use your strongest tool: the major scale. Quietly sing from the bottom note up the scale to the top note, counting degrees as you go. The degree you land on is the size — and because the major scale sits at major and perfect intervals above its tonic, do–mi is a major 3rd, do–fa a perfect 4th, do–sol a perfect 5th, do–la a major 6th. Land a half step shy of one of the major degrees and it’s the minor version.</p><p>Song openings you already know make fine backup anchors, but the scale method is better long-term: it works from any note, at any speed, on intervals no song of yours happens to start with.</p>',
          demo: {
            kind: 'play',
            label: '▶ Do up to sol',
            audio: {
              items: [
                { midi: 60, beats: 0.5 },
                { midi: 62, beats: 0.5 },
                { midi: 64, beats: 0.5 },
                { midi: 65, beats: 0.5 },
                { midi: 67, beats: 1 },
                { rest: true, beats: 0.5 },
                { midi: 60, beats: 0.75 },
                { midi: 67, beats: 1.5 }
              ],
              bpm: 92
            },
            caption: 'Walk the scale C–D–E–F–G — five degrees — then hear the bare leap: a perfect 5th.'
          }
        },
        {
          title: 'How to practice',
          body: '<p>Start with melodic intervals — one note after another — from the easy set (2nds, 3rds, 5ths, octaves), then let the drills widen the menu and finally stack the notes together, which is harder because they fuse into one sound. Mastery feels like recognizing a friend’s voice: the answer arrives in a second or two, before you’ve had time to sing anything.</p>'
        }
      ]
    }
  };

  global.LessonsA = LessonsA;
  if (typeof module !== 'undefined' && module.exports) module.exports = LessonsA;
})(typeof window !== 'undefined' ? window : globalThis);
