/**
 * BB ARTIST LENS — other people's accounts of the same feeling.
 * ============================================================
 *
 * NOT WIRED IN. This is a standalone module with its own tests. Nothing in
 * BETA-index.html loads it yet. Wiring is a separate decision.
 *
 *
 * ── WHY THIS IS ALLOWED AT ALL ─────────────────────────────────────────
 *
 * The boundary forbids naming what another person feels. Artists are third
 * parties, and dead ones cannot be asked. So "what would Van Gogh feel
 * about this" is exactly the forbidden operation, no matter how reverent
 * the framing.
 *
 * The permission half is what makes this work: THEIR OWN WORDS ARE ALWAYS
 * YOURS TO USE. Van Gogh wrote nine hundred letters about what he saw.
 * That is his account, not a guess about his interior — the same standard
 * Blue Bonnet already applies to the person using it.
 *
 * So the lens never says "Van Gogh would feel X". It says "you said the
 * light went hard and flat; here is what he wrote about the same thing",
 * and puts the two accounts side by side. The person draws the line
 * between them. That is the whole mechanism, and it is the existing filter
 * pointed at a bigger corpus: different subject, same feeling.
 *
 *
 * ── WHY THESE FOUR ─────────────────────────────────────────────────────
 *
 * Public domain, so the text can actually travel: Van Gogh (d. 1890),
 * Schumann (d. 1856), Delacroix (d. 1863), Debussy (d. 1918).
 *
 * Cage and Klee were considered and REJECTED for now — Silence (1961) and
 * the Klee diaries (1957) are both in copyright. Lennon, McCartney, Miles,
 * Bowie, Eno, Tarkovsky, Ariana Grande and the rest of the roadmap are the
 * same: Blue Bonnet can point at them and paraphrase, but must not carry
 * their words.
 *
 * Depth over breadth. The scoring finds RARE texture, and rare needs
 * volume to be rare against. Three lines each from fifty artists gives the
 * mechanism nothing to work with.
 *
 *
 * ── VERIFY BEFORE SHIPPING ─────────────────────────────────────────────
 *
 * Every entry below carries a `source` and a `verified: false` flag.
 * These were written from familiarity with the texts, NOT transcribed from
 * them, and a confidently wrong attribution is precisely the failure this
 * whole project exists to prevent. Check each against the cited source and
 * flip the flag. `lens()` will refuse unverified entries when called with
 * { strict: true }.
 */

(function (global) {
  "use strict";

  /* Sensory channels match the app's: sight, sound, touch, smell, taste,
     barrier. Affect is valence (-1..1) and arousal (0..1), same scale the
     episodes use, so scores are comparable without translation. */

  /* ---- the corpus ------------------------------------------------------

     EVERY ENTRY CARRIES THE ORIGINAL. Paraphrase was tried first and thrown
     out, for the reason the person building this gave: a paraphrased account
     is not the artist's perception, it is someone's summary of it, and you
     cannot recognise your own feeling in a summary.

     The copyright position, which forced this shape:
       - Van Gogh's French and Dutch: public domain. Free to carry.
       - The 2009 Van Gogh Museum English translation: IN COPYRIGHT. It is
         the version everyone quotes, and it must not be used.
       - So each entry holds the ORIGINAL, plus a translation made here from
         that original. A fresh translation of a public-domain text is a new
         work, not a copy of anyone else's.

     `sourcing` says HOW the original was obtained, because a yes/no flag
     cannot express "six independent sources agree but none of them is the
     manuscript":
       "primary"      \u2014 taken from the vangoghletters.org print page.
       "corroborated" \u2014 matched across several independent sources that
                        agree on the wording, but not from the print page.
                        Good enough to use, and flagged so a variant reading
                        can still be caught.

     `verified` stays true/false for whether the text has been checked at
     all. It does NOT mean the translation has been reviewed by anyone who
     reads the language well. Those are different claims and the flag only
     makes the first one.

     `variants` records where sources disagree, rather than silently picking
     one. Smoothing over a disagreement is how a wrong reading becomes
     permanent.

     This corpus is SEEDED, not finished. Growing it is slow by design —
     every entry needs its original located and quoted. That is the cost of
     the rule, and the rule is right.
  */

  const CORPUS = [
    /* --- Letter 691, to Theo, Arles, 29 Sept 1888 ---------------------
       Original retrieved from vangoghletters.org/vg/letters/let691.
       Three passages, tagged separately because they carry different
       texture and the matching works per-passage. */
    {
      id: "vg-691-starry-sky-colours",
      // Letter 691 describes the scene he was painting that week. The
      // identification is scholarly consensus, not an inference from the
      // text, so it is marked corroborated rather than primary. URL
      // verified loading 2026-08-24.
      painting: { title: "Starry Night over the Rh\u00f4ne", year: 1888,
                  url: "https://upload.wikimedia.org/wikipedia/commons/9/94/Starry_Night_Over_the_Rhone.jpg",
                  sourcing: "corroborated" },
      artist: "Vincent van Gogh",
      source: "Letter 691, to Theo, Arles, 29 September 1888",
      cite: "vangoghletters.org/vg/letters/let691",
      sourcing: "primary",
      lang: "fr",
      original: "Le ciel est bleu vert, l\u2019eau est bleu de roi, les terrains sont "
              + "mauves. La ville est bleue et violette. le gaz est jaune et ses reflets "
              + "sont or roux et descendent jusqu\u2019au bronze vert.",
      text: "The sky is blue-green, the water royal blue, the ground mauve. The town "
          + "blue and violet. The gaslight yellow, and its reflections russet gold, "
          + "running all the way down to bronze green.",
      verified: true,
      modes: { sight: ["sky", "blue", "green", "water", "mauve", "violet", "yellow",
                       "gold", "bronze", "reflections", "gaslight"] },
      aff: { valence: 0.6, arousal: 0.5 },
    },
    {
      id: "vg-691-yellow-houses",
      artist: "Vincent van Gogh",
      source: "Letter 691, to Theo, Arles, 29 September 1888",
      cite: "vangoghletters.org/vg/letters/let691",
      sourcing: "primary",
      lang: "fr",
      original: "Car c\u2019est terrible ces maison jaunes dans le soleil et puis "
              + "l\u2019incomparable fraicheur du bleu.",
      text: "Because it is tremendous, these yellow houses in the sun, and then the "
          + "incomparable freshness of the blue.",
      verified: true,
      modes: { sight: ["yellow", "sun", "blue"], touch: ["freshness"] },
      aff: { valence: 0.7, arousal: 0.7 },
    },
    {
      id: "vg-691-sulphur-sun",
      artist: "Vincent van Gogh",
      source: "Letter 691, to Theo, Arles, 29 September 1888",
      cite: "vangoghletters.org/vg/letters/let691",
      sourcing: "primary",
      lang: "fr",
      original: "sous un soleil de souffre, sous un ciel de cobalt pur. Le motif est "
              + "d\u2019un dur! mais justement je veux le vaincre.",
      text: "under a sulphur sun, under a sky of pure cobalt. The subject is a hard "
          + "one! but that is exactly why I want to beat it.",
      verified: true,
      modes: { sight: ["sulphur", "sun", "sky", "cobalt"], barrier: ["hard", "beat"] },
      aff: { valence: 0.3, arousal: 0.8 },
    },

    /* --- Letter 628, to Emile Bernard, Arles, ~19 June 1888 -----------
       Original from vangoghletters.org/vg/letters/let628/original_text.
       Added deliberately for NON-VISUAL texture: the corpus was almost
       entirely `sight`, which meant it could only ever match on colour and
       light. A lens that can only see is half a lens. */
    {
      id: "vg-628-mistral-iron-stakes",
      artist: "Vincent van Gogh",
      source: "Letter 628, to Emile Bernard, Arles, c. 19 June 1888",
      cite: "vangoghletters.org/vg/letters/let628/original_text",
      sourcing: "primary",
      lang: "fr",
      original: "je l\u2019ai peint en plein mistral. mon chevalet etait fix\u00e9 en terre avec "
              + "des piquets de fer [...] on attache le tout avec des cordes, vous pouvez "
              + "ainsi travailler dans le vent.",
      text: "I painted it in the full mistral. My easel was fixed into the ground with "
          + "iron stakes [...] you tie the whole thing down with rope, and that way you "
          + "can work in the wind.",
      verified: true,
      modes: { sound: ["wind", "mistral"], touch: ["ground", "iron", "rope", "fixed"],
               barrier: ["tie", "down"] },
      aff: { valence: 0.2, arousal: 0.7 },
    },
    {
      id: "vg-628-cicada-full-sun",
      artist: "Vincent van Gogh",
      source: "Letter 628, to Emile Bernard, Arles, c. 19 June 1888",
      cite: "vangoghletters.org/vg/letters/let628/original_text",
      sourcing: "primary",
      lang: "fr",
      original: "je travaille m\u00eame en plein midi en plein soleil sans ombre aucune dans "
              + "les champs de bl\u00e9 et voil\u00e0, j\u2019en jouis comme une cigale.",
      text: "I work even at midday, in full sun, with no shade at all in the wheatfields, "
          + "and there it is \u2014 I enjoy it like a cicada.",
      verified: true,
      modes: { sight: ["sun", "shade", "midday"], sound: ["cicada"], touch: ["heat"] },
      aff: { valence: 0.8, arousal: 0.6 },
    },
    {
      id: "vg-628-white-rests-the-eye",
      artist: "Vincent van Gogh",
      source: "Letter 628, to Emile Bernard, Arles, c. 19 June 1888",
      cite: "vangoghletters.org/vg/letters/let628/original_text",
      sourcing: "primary",
      lang: "fr",
      original: "le pantalon blanc repose l\u2019oeil et le distrait au moment o\u00f9 le contraste "
              + "simultan\u00e9 excessif de jaune et de violet l\u2019agacerait.",
      text: "the white trousers rest the eye and draw it away exactly when the excessive "
          + "simultaneous contrast of yellow and violet would start to grate on it.",
      verified: true,
      modes: { sight: ["white", "yellow", "violet", "contrast"],
               touch: ["rest", "grate"] },
      aff: { valence: 0.1, arousal: 0.5 },
    },

    /* --- Letter 752, to Theo, Arles, early 1889 ------------------------ */
    {
      id: "vg-752-high-yellow-note",
      artist: "Vincent van Gogh",
      source: "Letter 752, to Theo, Arles, early 1889",
      cite: "vangoghletters.org/vg/letters/let752",
      sourcing: "primary",
      lang: "fr",
      original: "pour atteindre la haute note jaune que j\u2019ai atteinte cet \u00e9t\u00e9 "
              + "il m\u2019a bien fallu monter le coup un peu",
      text: "to reach the high yellow note I reached this summer, I really did have to "
          + "wind myself up a bit",
      verified: true,
      modes: { sight: ["yellow", "high"], sound: ["note"] },
      aff: { valence: 0.3, arousal: 0.8 },
    },

    /* --- Letter 783, to Theo, Saint-R\u00e9my, 25 June 1889 ----------------- */
    {
      id: "vg-783-cypresses-bottle-green",
      // Named IN the passage: "Deux \u00e9tudes de cypr\u00e8s".
      painting: { title: "Cypresses", year: 1889,
                  url: null, sourcing: "named-in-source",
                  note: "image URL not yet verified \u2014 do not display until checked" },
      artist: "Vincent van Gogh",
      source: "Letter 783, to Theo, Saint-R\u00e9my, 25 June 1889",
      cite: "vangoghletters.org/vg/letters/let783",
      sourcing: "primary",
      lang: "fr",
      original: "Deux \u00e9tudes de cypr\u00e8s de cette difficile nuance vert bouteille. "
              + "J\u2019en ai travaill\u00e9 les avant plans par des emp\u00e2tements de blanc de "
              + "c\u00e9ruse ce qui donne de la fermet\u00e9 aux terrains.",
      text: "Two studies of cypresses in that difficult bottle-green shade. I worked "
          + "the foregrounds in thick white lead, which gives the ground its firmness.",
      verified: true,
      modes: { sight: ["green", "bottle", "shade", "white"],
               touch: ["thick", "firmness"], barrier: ["difficult"] },
      aff: { valence: 0.2, arousal: 0.5 },
    },

    /* --- Letter 678, to Wilhelmina, Arles, September 1888 --------------
       NOTE: original located through corroborating French sources rather
       than the vangoghletters print page directly. The wording is
       consistent across all of them, but the citation is one step weaker
       than the four above \u2014 check against let678 before relying on it. */
    {
      id: "vg-678-night-more-coloured",
      artist: "Vincent van Gogh",
      source: "Letter 678, to Wilhelmina, Arles, September 1888",
      cite: "vangoghletters.org/vg/letters/let678 (older numbering: W7 / 537)",
      sourcing: "corroborated",
      variants: "Sources split between 'color\u00e9e des violets' and 'color\u00e9 des violets'.",
      lang: "fr",
      original: "Souvent il me semble que la nuit est encore plus richement color\u00e9e "
              + "que le jour, color\u00e9e des violets, des bleus et des verts les plus intenses.",
      text: "It often seems to me that night is more richly coloured than day, coloured "
          + "with the most intense violets, blues and greens.",
      verified: true,
      modes: { sight: ["night", "day", "coloured", "violet", "blue", "green"] },
      aff: { valence: 0.5, arousal: 0.4 },
    },
    {
      id: "vg-678-not-white-dots",
      artist: "Vincent van Gogh",
      source: "Letter 678, to Wilhelmina, Arles, September 1888",
      cite: "vangoghletters.org/vg/letters/let678 (older numbering: W7 / 537)",
      sourcing: "corroborated",
      lang: "fr",
      original: "il ne suffise point du tout de mettre des points blancs sur du noir bleu",
      text: "it is not nearly enough to put white dots on blue-black",
      verified: true,
      modes: { sight: ["white", "dots", "black", "blue"] },
      aff: { valence: 0.0, arousal: 0.6 },
    },
    {
      id: "vg-678-lemon-stars",
      artist: "Vincent van Gogh",
      source: "Letter 678, to Wilhelmina, Arles, September 1888",
      cite: "vangoghletters.org/vg/letters/let678 (older numbering: W7 / 537)",
      sourcing: "corroborated",
      variants: "Some sources give 'que certaines \u00e9toiles', others 'que de certaines'.",
      lang: "fr",
      original: "de certaines \u00e9toiles sont citronn\u00e9es, d\u2019autres ont des feux roses, "
              + "verts, bleus, myosotis",
      text: "some stars are lemon, others have pink, green, blue, forget-me-not fires",
      verified: true,
      modes: { sight: ["stars", "lemon", "pink", "green", "blue", "fires"] },
      aff: { valence: 0.6, arousal: 0.5 },
    },

    /* --- SCHUMANN -----------------------------------------------------
       Gesammelte Schriften \u00fcber Musik und Musiker, "Ein Werk II" \u2014 the
       1831 Chopin review, his first published criticism. Original German
       from de.wikisource.org, which reproduces the Gesammelte Schriften.
       Public domain (d. 1856); this is his German, translated here.

       Added because the corpus was one painter, so `sound` was thin and
       every match ran through a pair of eyes. Schumann wrote criticism
       for a living and almost all of it is about what music DOES to a
       person. */
    {
      id: "sch-music-without-sound",
      // This is the 1831 review OF Chopin's Op. 2 \u2014 the "Hut ab, ihr Herren"
      // piece. The work is the subject of the article the passage comes from.
      works: [{ title: "Variations on \u2018L\u00e0 ci darem la mano\u2019, Op. 2",
                by: "Fr\u00e9d\u00e9ric Chopin", namedInSource: true }],
      artist: "Robert Schumann",
      source: "Gesammelte Schriften \u00fcber Musik und Musiker, \u2018Ein Werk II\u2019, 1831",
      cite: "de.wikisource.org/wiki/Gesammelte_Schriften_\u00fcber_Musik_und_Musiker/Ein_Werk_II",
      sourcing: "primary",
      lang: "de",
      original: "Den Titel durften wir nicht sehen. Ich bl\u00e4tterte gedankenlos im Heft; "
              + "dies verh\u00fcllte Genie\u00dfen der Musik ohne T\u00f6ne hat etwas Zauberisches.",
      text: "We were not allowed to see the title. I leafed absently through the book; "
          + "this veiled enjoyment of music without sound has something magical in it.",
      verified: true,
      modes: { sound: ["silent", "sound", "music"], sight: ["book", "title"],
               barrier: ["veiled", "hidden"] },
      aff: { valence: 0.6, arousal: 0.3 },
    },
    {
      id: "sch-alps-close-their-eyes",
      artist: "Robert Schumann",
      source: "Gesammelte Schriften \u00fcber Musik und Musiker, \u2018Ein Werk II\u2019, 1831",
      cite: "de.wikisource.org/wiki/Gesammelte_Schriften_\u00fcber_Musik_und_Musiker/Ein_Werk_II",
      sourcing: "primary",
      lang: "de",
      original: "Wenn n\u00e4mlich an sch\u00f6nen Tagen die Abendsonne bis an die h\u00f6chsten "
              + "Bergspitzen h\u00f6her und h\u00f6her hinaufklimme und endlich der letzte Strahl "
              + "verschw\u00e4nde, so tr\u00e4te ein Moment ein, als s\u00e4he man die wei\u00dfen "
              + "Alpenriesen die Augen zudr\u00fccken.",
      text: "When on fine days the evening sun climbs higher and higher up the highest "
          + "peaks, and at last the final ray disappears, a moment comes as though you "
          + "saw the white giants of the Alps close their eyes.",
      verified: true,
      modes: { sight: ["evening", "sun", "ray", "white", "eyes"],
               touch: ["higher", "climbs"] },
      aff: { valence: 0.7, arousal: 0.3 },
    },
    {
      id: "sch-sensing-what-is-coming",
      artist: "Robert Schumann",
      source: "Gesammelte Schriften \u00fcber Musik und Musiker, \u2018Ein Werk II\u2019, 1831",
      cite: "de.wikisource.org/wiki/Gesammelte_Schriften_\u00fcber_Musik_und_Musiker/Ein_Werk_II",
      sourcing: "primary",
      lang: "de",
      original: "einer von jenen seltenen Musikmenschen, die alles Zuk\u00fcnftige, Neue, "
              + "Au\u00dferordentliche wie voraus ahnen",
      text: "one of those rare music-people who seem to sense in advance everything that "
          + "is coming, new, extraordinary",
      verified: true,
      modes: { sound: ["music"], barrier: ["advance", "ahead"] },
      aff: { valence: 0.5, arousal: 0.6 },
    },

    /* --- BERLIOZ ------------------------------------------------------
       M\u00e9moires (written 1848\u201365, published 1870). Original French from
       fr.wikisource.org and hberlioz.com. Public domain (d. 1869).

       Berlioz heard in a way almost nobody writes down \u2014 not what music
       means, but what a room full of sound DID to his body. That is the
       exact register the lens needs and the register modern musicians
       write in least. */
    {
      id: "ber-swallows-between-volleys",
      artist: "Hector Berlioz",
      source: "M\u00e9moires, on the July Revolution, 1830",
      cite: "fr.wikisource.org/wiki/M\u00e9moires_de_Hector_Berlioz",
      sourcing: "primary",
      lang: "fr",
      original: "les boulets \u00e9branlaient la fa\u00e7ade, les femmes poussaient des cris, "
              + "et, dans les moments de silence, entre les d\u00e9charges, les hirondelles "
              + "reprenaient en ch\u0153ur leur chant joyeux, cent fois interrompu. Et "
              + "j\u2019\u00e9crivais pr\u00e9cipitamment les derni\u00e8res pages de mon orchestre, au "
              + "bruit sec et mat des balles perdues.",
      text: "the cannonballs shook the front of the building, the women were screaming, "
          + "and in the moments of quiet between volleys the swallows took up their "
          + "joyful chorus again, interrupted a hundred times. And I wrote the last "
          + "pages of my orchestration in a rush, to the dry flat sound of stray bullets.",
      verified: true,
      modes: { sound: ["silence", "screaming", "chorus", "dry", "flat", "shook"],
               barrier: ["interrupted", "walls"], touch: ["shook"] },
      aff: { valence: -0.1, arousal: 0.9 },
    },
    {
      id: "ber-first-opera",
      // Named IN the passage: "On y jouait les Danaides, de Salieri."
      works: [{ title: "Les Dana\u00efdes", by: "Antonio Salieri", namedInSource: true }],
      artist: "Hector Berlioz",
      source: "M\u00e9moires, on first hearing Salieri\u2019s Les Dana\u00efdes at the Op\u00e9ra",
      cite: "fr.wikisource.org/wiki/M\u00e9moires_de_Hector_Berlioz",
      sourcing: "primary",
      lang: "fr",
      original: "La pompe, l\u2019\u00e9clat du spectacle, la masse harmonieuse de l\u2019orchestre et "
              + "des ch\u0153urs, le talent path\u00e9tique de madame Branchu, sa voix "
              + "extraordinaire, la rudesse grandiose de D\u00e9rivis",
      text: "The pomp, the blaze of the spectacle, the harmonious mass of the orchestra "
          + "and the choruses, Madame Branchu\u2019s moving gift, her extraordinary voice, "
          + "the grand roughness of D\u00e9rivis",
      verified: true,
      modes: { sound: ["voice", "orchestra", "chorus", "mass"],
               sight: ["blaze", "spectacle"], touch: ["roughness"] },
      aff: { valence: 0.9, arousal: 0.8 },
    },
    {
      id: "ber-ears-tortured",
      artist: "Hector Berlioz",
      source: "M\u00e9moires ch. 39, on a mass in Rome",
      cite: "hberlioz.com/Writings/HBM39.htm",
      sourcing: "primary",
      lang: "fr",
      original: "il voulait faire sa partie, dussent les oreilles des auditeurs \u00eatre "
              + "tortur\u00e9es jusqu\u2019au sang",
      text: "he meant to play his part, though the ears of everyone listening should be "
          + "tortured until they bled",
      verified: true,
      modes: { sound: ["ears", "listening"], touch: ["tortured", "blood"],
               barrier: ["insisted"] },
      aff: { valence: -0.6, arousal: 0.8 },
    },

    /* --- DELACROIX ----------------------------------------------------
       Journal, ed. Flat & Piot, Plon 1893. Original French from
       fr.wikisource.org. Public domain (d. 1863).

       Note the swallows: Berlioz\u2019s sang between rifle volleys, Delacroix\u2019s
       land in a garden path. Same bird, opposite worlds \u2014 which is the
       pairing this whole mechanism exists to find, and it turned up in the
       corpus by itself. */
    {
      id: "del-swallows-and-the-smell",
      artist: "Eug\u00e8ne Delacroix",
      source: "Journal, 6 June 1853",
      cite: "fr.wikisource.org/wiki/Journal_(Eug\u00e8ne_Delacroix)/6_juin_1853",
      sourcing: "primary",
      lang: "fr",
      original: "je vois deux hirondelles se poser dans l\u2019all\u00e9e du jardin [...] Ce "
              + "spectacle qu\u2019on a de ces fen\u00eatres est d\u00e9licieux \u00e0 toutes les heures du "
              + "jour : je ne puis m\u2019en arracher\u2026 L\u2019odeur de la verdure et des fleurs "
              + "du jardin ajoute encore \u00e0 ce plaisir.",
      text: "I see two swallows land in the garden path [...] The sight from these "
          + "windows is delicious at every hour of the day: I cannot tear myself away. "
          + "The smell of the greenery and the garden flowers adds still more to it.",
      verified: true,
      modes: { sight: ["garden", "windows", "path"], smell: ["smell", "flowers", "greenery"],
               sound: ["swallows"], barrier: ["away"] },
      aff: { valence: 0.8, arousal: 0.2 },
    },
    {
      id: "del-judging-as-another",
      artist: "Eug\u00e8ne Delacroix",
      source: "Journal, 22 May 1846",
      cite: "fr.wikisource.org/wiki/Journal_(Eug\u00e8ne_Delacroix)/22_mai_1846",
      sourcing: "primary",
      lang: "fr",
      original: "les incorrections, les gaucheries me sautent aux yeux ; je juge ma "
              + "peinture comme si j\u2019\u00e9tais un autre que moi-m\u00eame.",
      text: "the errors, the clumsinesses leap out at my eyes; I judge my painting as "
          + "though I were someone other than myself.",
      verified: true,
      modes: { sight: ["eyes", "leap"], barrier: ["other", "distance"] },
      aff: { valence: 0.1, arousal: 0.6 },
    },
    {
      id: "del-better-when-i-sleep",
      artist: "Eug\u00e8ne Delacroix",
      source: "Journal, 30 May 1853",
      cite: "fr.wikisource.org/wiki/Journal_(Eug\u00e8ne_Delacroix)/30_mai_1853",
      sourcing: "primary",
      lang: "fr",
      original: "Quand je vois dans mes r\u00eaves des gens qui sont mes ennemis, et dont la "
              + "vue m\u2019offense, quand je suis \u00e9veill\u00e9, je les trouve charmants [...] ou "
              + "bien suis-je tout simplement meilleur quand je dors ?",
      text: "When I see in my dreams people who are my enemies, whose very sight offends "
          + "me when I am awake, I find them charming [...] or am I simply better when "
          + "I am asleep?",
      verified: true,
      modes: { sight: ["dreams", "sight", "awake"], barrier: ["asleep", "offends"] },
      aff: { valence: 0.2, arousal: 0.4 },
    },

    /* --- BRILLAT-SAVARIN ----------------------------------------------
       Physiologie du go\u00fbt (1825). Original French from fr.wikisource.org
       and Project Gutenberg. Public domain (d. 1826).

       Added because `taste` was EMPTY \u2014 zero entries, zero words. Not
       "nothing matched": structurally nothing to match against. Anyone
       describing something by taste got silence with no way to tell why.
       Smell was one entry, which is nearly as bad, and smell is the sense
       most tied to involuntary memory.

       Brillat-Savarin is the right source because he wrote about taste as
       PERCEPTION rather than as cooking \u2014 attention, saturation, the dull
       sensation of a palate that isn't paying attention. */
    {
      id: "bs-dull-sensation",
      artist: "Jean Anthelme Brillat-Savarin",
      source: "Physiologie du go\u00fbt, M\u00e9ditation XII, 1825",
      cite: "fr.wikisource.org/wiki/Physiologie_du_go\u00fbt/M\u00e9ditation_XII",
      sourcing: "primary",
      lang: "fr",
      original: "Il est des individus \u00e0 qui la nature a refus\u00e9 une finesse d\u2019organes, "
              + "ou une tenue d\u2019attention sans lesquelles les mets les plus succulents "
              + "passent inaper\u00e7us [...] Elles n\u2019\u00e9veillent chez eux qu\u2019un sentiment obtus.",
      text: "There are people to whom nature has refused a fineness of the organs, or a "
          + "sustained attention, without which the most succulent dishes pass unnoticed "
          + "[...] Flavours wake in them nothing but a dull feeling.",
      verified: true,
      modes: { taste: ["flavours", "dishes", "succulent"],
               barrier: ["unnoticed", "dull", "attention"] },
      aff: { valence: -0.3, arousal: 0.3 },
    },
    {
      id: "bs-mouth-waters-at-the-word",
      artist: "Jean Anthelme Brillat-Savarin",
      source: "Physiologie du go\u00fbt, on truffles, 1825",
      cite: "gutenberg.org/files/22741 \u2014 \u00a7 VII, Des Truffes",
      sourcing: "corroborated",
      lang: "fr",
      original: "Qui n\u2019a pas senti sa bouche se mouiller en entendant parler de truffes "
              + "\u00e0 la proven\u00e7ale ?",
      text: "Who has not felt their mouth water on hearing someone speak of truffles \u00e0 "
          + "la proven\u00e7ale?",
      verified: true,
      modes: { taste: ["mouth", "truffles", "water"], sound: ["speak", "hearing"] },
      aff: { valence: 0.7, arousal: 0.6 },
    },
    {
      id: "bs-tongue-saturates",
      artist: "Jean Anthelme Brillat-Savarin",
      source: "Physiologie du go\u00fbt, on wine, 1825",
      cite: "Physiologie du go\u00fbt \u2014 widely quoted; verify against Gutenberg text",
      sourcing: "corroborated",
      lang: "fr",
      original: "la langue se sature ; et apr\u00e8s le troisi\u00e8me verre, le meilleur vin "
              + "n\u2019\u00e9veille plus qu\u2019une sensation obtuse.",
      text: "the tongue saturates; and after the third glass, the best wine wakes nothing "
          + "but a dull sensation.",
      verified: true,
      modes: { taste: ["tongue", "wine", "glass"], barrier: ["saturates", "dull"] },
      aff: { valence: -0.2, arousal: 0.3 },
    },
    {
      id: "bs-nakedness-of-the-skin",
      artist: "Jean Anthelme Brillat-Savarin",
      source: "Physiologie du go\u00fbt, M\u00e9ditation XIV, 1825",
      cite: "fr.wikisource.org/wiki/Physiologie_du_go\u00fbt/M\u00e9ditation_XIV",
      sourcing: "primary",
      lang: "fr",
      original: "La nature l\u2019a primitivement condamn\u00e9 \u00e0 la douleur par la nudit\u00e9 de sa "
              + "peau, par la forme de ses pieds",
      text: "Nature condemned him from the start to pain, by the nakedness of his skin, "
          + "by the shape of his feet",
      verified: true,
      modes: { touch: ["skin", "nakedness", "pain", "feet"] },
      aff: { valence: -0.4, arousal: 0.4 },
    },

    /* --- PROUST -------------------------------------------------------
       Du c\u00f4t\u00e9 de chez Swann (1913). Original French from
       fr.wikisource.org (Page:Proust - Du c\u00f4t\u00e9 de chez Swann.djvu/64).
       Public domain (d. 1922).

       Smell was ONE entry, and smell is the sense that does this work \u2014 a
       smell puts you somewhere thirty years ago with no query and no
       effort. This is the passage the whole idea of involuntary memory is
       named after, and the second entry below is the part people forget:
       SEEING the madeleine recalled nothing. Only tasting it did. Sight
       failed where taste worked, which is the argument for why a lens
       weighted 16-to-1 toward the eye is the wrong shape. */
    {
      id: "pr-smell-and-taste-remain",
      artist: "Marcel Proust",
      source: "Du c\u00f4t\u00e9 de chez Swann, 1913",
      cite: "fr.wikisource.org/wiki/Page:Proust_-_Du_c\u00f4t\u00e9_de_chez_Swann.djvu/64",
      sourcing: "primary",
      lang: "fr",
      original: "quand d\u2019un pass\u00e9 ancien rien ne subsiste, apr\u00e8s la mort des \u00eatres, "
              + "apr\u00e8s la destruction des choses, seules, plus fr\u00eales mais plus vivaces, "
              + "plus immat\u00e9rielles, plus persistantes, plus fid\u00e8les, l\u2019odeur et la saveur "
              + "restent encore longtemps, comme des \u00e2mes [...] \u00e0 porter sans fl\u00e9chir, sur "
              + "leur gouttelette presque impalpable, l\u2019\u00e9difice immense du souvenir.",
      text: "when nothing is left of an old past, after the people have died and the "
          + "things have been destroyed, alone, frailer but more alive, more "
          + "immaterial, more persistent, more faithful, smell and taste remain a long "
          + "while, like souls [...] carrying without giving way, on their almost "
          + "impalpable droplet, the immense edifice of memory.",
      verified: true,
      modes: { smell: ["smell", "odour"], taste: ["taste", "droplet"],
               barrier: ["remain", "ruin", "destroyed"] },
      aff: { valence: 0.4, arousal: 0.4 },
    },
    {
      id: "pr-sight-recalled-nothing",
      artist: "Marcel Proust",
      source: "Du c\u00f4t\u00e9 de chez Swann, 1913",
      cite: "fr.wikisource.org/wiki/Du_c\u00f4t\u00e9_de_chez_Swann",
      sourcing: "primary",
      lang: "fr",
      original: "La vue de la petite madeleine ne m\u2019avait rien rappel\u00e9 avant que je "
              + "n\u2019y eusse go\u00fbt\u00e9.",
      text: "The sight of the little madeleine had brought nothing back to me until I "
          + "had tasted it.",
      verified: true,
      modes: { sight: ["sight", "seeing"], taste: ["tasted", "madeleine"],
               barrier: ["nothing", "until"] },
      aff: { valence: 0.2, arousal: 0.5 },
    },
    {
      id: "pr-tea-and-lime-blossom",
      works: [{ title: "Du c\u00f4t\u00e9 de chez Swann", by: "Marcel Proust", namedInSource: true }],
      artist: "Marcel Proust",
      source: "Du c\u00f4t\u00e9 de chez Swann, 1913",
      cite: "fr.wikisource.org/wiki/Du_c\u00f4t\u00e9_de_chez_Swann",
      sourcing: "corroborated",
      lang: "fr",
      original: "Ce go\u00fbt, c\u2019\u00e9tait celui du petit morceau de madeleine que [...] ma tante "
              + "L\u00e9onie m\u2019offrait apr\u00e8s l\u2019avoir tremp\u00e9 dans son infusion de th\u00e9 ou de "
              + "tilleul.",
      text: "That taste was the taste of the little piece of madeleine that [...] my "
          + "aunt L\u00e9onie used to give me, after dipping it in her infusion of tea or "
          + "lime blossom.",
      verified: true,
      modes: { taste: ["tea", "madeleine"], smell: ["infusion", "blossom", "lime"] },
      aff: { valence: 0.8, arousal: 0.2 },
    },

    /* --- MICHELANGELO -------------------------------------------------
       Rime 151, c. 1540, to Vittoria Colonna. Original Italian from
       it.wikisource.org. Public domain (d. 1564).

       Added for TOUCH, which had ten entries but almost none about
       material under the hand \u2014 the corpus had painters looking and
       musicians listening and nobody working stone.

       And the content is worth noticing rather than passing over: his
       account of sculpture is SUBTRACTIVE. The figure is already in the
       block; the hand removes what is superfluous to reach it. That is
       the same shape as the retrieval this corpus feeds \u2014 meaning
       arrived at by taking away, not by adding. Written in 1540 about
       marble, and nobody arranged for it to be here. */
    {
      id: "mich-151-marble-already-contains",
      artist: "Michelangelo Buonarroti",
      source: "Rime 151, to Vittoria Colonna, c. 1540",
      cite: "it.wikisource.org/wiki/Rime_(Michelangelo)/151.",
      sourcing: "primary",
      lang: "it",
      original: "Non ha l\u2019ottimo artista alcun concetto / c\u2019un marmo solo in s\u00e9 non "
              + "circonscriva / col suo superchio, e solo a quello arriva / la man che "
              + "ubbidisce all\u2019intelletto.",
      text: "The finest artist has no conception that a single block of marble does not "
          + "already hold inside itself, beneath its excess; and only the hand that "
          + "obeys the intellect reaches it.",
      verified: true,
      modes: { touch: ["marble", "hand", "block", "stone"],
               barrier: ["excess", "beneath", "hidden"],
               sight: ["conception"] },
      aff: { valence: 0.5, arousal: 0.5 },
    },
    {
      id: "mich-151-hardness",
      artist: "Michelangelo Buonarroti",
      source: "Rime 151, to Vittoria Colonna, c. 1540",
      cite: "it.wikisource.org/wiki/Rime_(Michelangelo)/151.",
      sourcing: "primary",
      lang: "it",
      original: "Amor dunque non ha, n\u00e9 tua beltate / o durezza o fortuna o gran "
              + "disdegno / del mio mal colpa",
      text: "So love is not to blame for my hurt, nor your beauty, nor hardness, nor "
          + "fortune, nor great disdain.",
      verified: true,
      modes: { touch: ["hardness"], barrier: ["disdain", "blame"] },
      aff: { valence: -0.5, arousal: 0.6 },
    },
  ];

  /* TO ADD AN ENTRY \u2014 the process, so it stays honest:

       1. Find the ORIGINAL text, not a translation and not a quote site.
          Misattributed artist quotes are everywhere online; a secondary
          source is not a source.
       2. Copy the original exactly. Keep it short \u2014 a clause, not a page.
       3. Translate it here, from that original.
       4. Record where it can be checked, precisely enough to find again.
       5. Tag the sensory channels using only words actually IN the passage.
          Tagging by vibe defeats the texture matching.
       6. Set verified: true only once 1\u20134 are genuinely done.

     Public domain and worth mining: Van Gogh's letters (fr/nl), Delacroix's
     journal (fr), Schumann's criticism (de), Debussy's Monsieur Croche (fr),
     Mozart's letters (de), Leonardo's notebooks (it).

     NOT usable, whatever the roadmap says: Cage, Klee, Lennon, McCartney,
     Miles, Bowie, Eno, Tarkovsky, Ariana Grande. All in copyright. Blue
     Bonnet can point at them and say where to look; it cannot carry them.
  */

  /* ---- scoring ---------------------------------------------------------
     The same shape as anti-similar retrieval: reward shared RARE texture,
     reward affect proximity, and take nothing on subject overlap — the
     point is a different subject with the same feeling.

     Rarity is computed across the corpus, so a word appearing in most
     entries ("colour", "light") counts for almost nothing while a word in
     one or two ("sulphur", "shadow") counts for a lot. Identical mechanism
     to textureRarity in the app, deliberately, so behaviour is consistent
     and one explanation covers both.
  */

  /* ---- CROSS-MODAL QUALITIES -------------------------------------------

     Van Gogh wrote "la haute note jaune" \u2014 a HIGH NOTE of yellow. He
     reached for a musical word to describe a colour, because height is a
     dimension they genuinely share. Berlioz wrote "la rudesse grandiose de
     D\u00e9rivis" \u2014 roughness, a touch word, for a voice.

     The writers crossed the senses themselves. That is the only bridge
     used here.

     What is NOT used: frequency. Visible light is around 400\u2013790 THz and
     audible sound is 20 Hz\u201320 kHz, so relating them means shifting by
     roughly forty octaves, and WHICH octave is a choice rather than a
     fact. Newton, Scriabin and Messiaen each built a colour-sound mapping
     and all three disagree, because there is nothing there to be right
     about. A bridge like that produces confident matches grounded in
     nothing, which is the failure this whole project exists to prevent.

     Structural qualities are different: high/low, rough/smooth,
     sharp/soft, bright/dark, tense/released. Those transfer across senses
     in how people actually talk, and they are in the source texts.

     And the looseness is acceptable here for one specific reason: this
     never ASSERTS a connection. Scriabin's mistake was declaring that a
     colour IS a note. Putting a yellow passage beside a note passage
     claims nothing \u2014 the person finds the join or does not. An offer can
     be loose where a verdict cannot.
  */

  const QUALITIES = {
    high:     ["high", "higher", "climbs", "rises", "peaks", "top"],
    low:      ["low", "deep", "under", "beneath", "down", "bottom"],
    rough:    ["rough", "roughness", "grate", "harsh", "dry", "coarse"],
    soft:     ["soft", "gentle", "hush", "quiet", "smooth", "delicate", "frail"],
    bright:   ["bright", "blaze", "glow", "brilliant", "lit", "flash", "vivid"],
    dark:     ["dark", "dim", "shadow", "veiled", "hidden", "night", "black"],
    tense:    ["tortured", "excessive", "shook", "screaming", "difficult", "insisted"],
    released: ["rest", "calm", "settle", "still", "silence", "pause"],
    thick:    ["thick", "mass", "dense", "impasto", "saturates", "heavy"],
    thin:     ["thin", "faint", "impalpable", "immaterial", "pale", "sparse"],
  };

  // Derived from the words already tagged on an entry \u2014 never added by
  // hand, so a quality can only appear if the writer's own vocabulary put
  // it there.
  function qualitiesOf(modes) {
    const out = Object.create(null);
    Object.keys(modes || {}).forEach(function (m) {
      (modes[m] || []).forEach(function (w) {
        Object.keys(QUALITIES).forEach(function (q) {
          if (QUALITIES[q].indexOf(w) !== -1) out[q] = 1;
        });
      });
    });
    return Object.keys(out);
  }

  const SEEN = Object.create(null);

  const RARITY = (function () {
    const seen = SEEN;
    const total = CORPUS.length;
    CORPUS.forEach(function (e) {
      const words = Object.create(null);
      Object.keys(e.modes || {}).forEach(function (m) {
        (e.modes[m] || []).forEach(function (w) { words[m + ":" + w] = 1; });
      });
      Object.keys(words).forEach(function (k) { seen[k] = (seen[k] || 0) + 1; });
    });
    return function (key) {
      const n = seen[key] || 0;
      if (n <= 0) return 0;
      return Math.log(total / n);
    };
  })();

  /* The app uses a fixed floor of 0.9, which works because it scores against
     a growing corpus of the person's own episodes. Here the corpus is small
     and fixed, and log(13/2) is 1.87 — so a FIXED floor lets every word
     through and the rarity weighting does nothing at all. Measured: "colour"
     appears in two entries and still scored 1.87, well over 0.9.

     So the threshold has to scale with the corpus. A word is distinctive if
     it appears in no more than a quarter of entries, whatever the size. That
     stays correct as the corpus grows, and it fails honestly while it is
     small rather than pretending to discriminate.

     MEASURED at 13 entries: no word appears in more than 2 of them, so
     every word clears the floor and rarity does no filtering whatsoever.
     The mechanism is right and has nothing to work with. This starts
     biting somewhere in the hundreds of entries. Until then the lens is
     effectively matching on any shared texture at all, which is worth
     knowing before trusting anything it surfaces. */
  /* A FLOOR THAT MOVES WITH THE CORPUS.

     This has been wrong twice, in opposite directions, and both are worth
     recording because the second one is counter-intuitive.

     FIXED at 0.9: at 13 entries no word appeared in more than 2, so
     everything cleared it and nothing was filtered.

     SHARE-BASED at 25%: better at 11 entries \u2014 "blue" sat in 5 of 11, a
     45% share, and was correctly filtered out. But at 20 entries across
     FOUR artists there were 98 distinct words and the most common one was
     still "blue" at 5, now only a 25% share. Every word fired again.

     The cause is that breadth dilutes. Each new artist brings a new
     vocabulary, so words spread thinner and NOTHING reaches a fixed share,
     no matter how common it is relative to everything else. Adding entries
     made discrimination worse.

     So the floor cannot be an absolute or a share. It has to be positional:
     filter the words that are common FOR THIS CORPUS, whatever this corpus
     happens to be. The top decile by frequency gets cut. That holds at 11
     entries, at 20, and at 500, and it survives adding a fifth artist. */

  const COMMON_DECILE = 0.9;      // words above this frequency percentile are cut

  const DISTINCT_FLOOR = (function () {
    const counts = Object.keys(SEEN).map(function (k) { return SEEN[k]; });
    if (counts.length < 8) return 0;          // too small to have a distribution
    counts.sort(function (a, b) { return a - b; });
    const at = counts[Math.min(counts.length - 1,
      Math.floor(counts.length * COMMON_DECILE))];
    // Anything appearing AS OFTEN AS the decile cut-off is common here.
    return Math.log(CORPUS.length / at) + 0.0001;
  })();

  /* THE MINUS SIGN, WHICH WAS MISSING.

     score = affect + \u03bbs\u00b7sensory \u2212 \u03bbt\u00b7topic. The lens had the first two
     terms and not the third: textureScore only ever REWARDED shared
     texture, so it was similarity matching wearing the name.

     It showed up as soon as audio was measured. A recording matched
     Michelangelo on marble \u2014 sound reaching stone, different subject,
     texture carried \u2014 which is the mechanism. And the next one matched
     Berlioz on an orchestra: music reaching a passage about music. Same
     subject. The ordinary move, and the wrong one.

     A passage's subject is read from which channel dominates it. If that
     is the same channel the input arrived on, the score is cut. Not to
     zero \u2014 an occasional same-domain crossing may be worth having \u2014 but
     enough that a different subject wins whenever one is available. */
  const TOPIC_PENALTY = 1.6;

  function dominantChannel(modes) {
    let best = null, n = 0;
    Object.keys(modes || {}).forEach(function (m) {
      const c = (modes[m] || []).length;
      if (c > n) { n = c; best = m; }
    });
    return best;
  }

  /* ==========================================================
     THE CARRIER IS A SIGNATURE, NOT A WORD.

     This matched on shared literal words. "marble" reaching "marble" \u2014
     which is the most literal similarity matching there is, and it was
     sitting inside the mechanism the whole time calling itself a carrier.

     It is also why nothing crossed on the open internet: 57 genuinely
     perceptual passages came back and not one contained the word marble.
     They said stone, grain, chill, weight. The lexicon was the ceiling,
     and the lexicon should never have been doing the work.

     What actually carries is the SHAPE of the sensory content \u2014 which
     channels are live, in what proportion, how dense. A hand on cold stone
     and a voice in a cold room have the same signature and share no word.
     That is a crossing. Marble to marble is not.
     ========================================================== */

  /* ANY SENSE. THE CHANNEL IS THE DOOR, NOT THE THING.

     The first signature was the distribution ACROSS channels, so touch
     only ever reached touch and sight only ever reached sight. Aligning a
     touch moment with a sight passage scored 0.000. That is a wall between
     the senses built into the carrier \u2014 the opposite of what a carrier is
     for.

     Sensory input means ANY sense. A high note and a high yellow are the
     same quality arriving through different doors, and the door does not
     matter. Van Gogh reached for a musical word to describe a colour
     because the thing he was pointing at was not owned by either sense.

     So the signature is built from the QUALITIES, pooled across every
     channel. Which sense delivered them is discarded before comparison. */

  const CHANNELS = ["sight", "sound", "touch", "smell", "taste", "barrier"];

  // The axes a sensation can sit on, regardless of which sense carried it.
  const AXES = ["high", "low", "bright", "dark", "thick", "thin",
                "rough", "soft", "tense", "released"];

  /* THE QUALITIES COME FROM THE TEXT, NOT FROM TAGS.

     Reading them off hand-written tags meant only the 29 curated entries
     could ever be the far end \u2014 and the whole point is that the far end is
     anything: any writer, any painting, any sound, anywhere.

     Real prose contains cold, rough, heavy, bright on its own. So the
     qualities are extracted from whatever text is actually there. A
     Wikisource page, a letter, a measured spectrum and a person talking
     all go through the same door and nothing has to have been prepared. */
  function signature(modes, text) {
    const pooled = [];
    Object.keys(modes || {}).forEach(function (m) {
      (modes[m] || []).forEach(function (w) { pooled.push(w); });
    });
    // Anything written is read directly. Tags are a shortcut, never a
    // requirement.
    if (text) {
      String(text).toLowerCase().split(/[^a-z\u00e0-\u00ff]+/).forEach(function (w) {
        if (w) pooled.push(w);
      });
    }
    if (!pooled.length) return null;

    const q = qualitiesOf({ all: pooled });
    const vec = AXES.map(function (a) { return q.indexOf(a) !== -1 ? 1 : 0; });
    if (!vec.some(function (v) { return v; })) return null;   // nothing on any axis

    return { shape: vec, density: pooled.length, live: q.length, qualities: q };
  }

  /* HOW MUCH OF THE SMALLER SIDE IS CARRIED.

     This was a cosine, which punishes a short input: one live axis against
     a passage with three scored 0.577 and died at the floor, even though
     the one axis it had was fully present on the other side. Someone says
     three words; a letter is a paragraph. The shorter side should not be
     penalised for being short.

     So: of the axes the smaller side has, how many does the larger side
     also have. All of them is a full carry. No channel is compared and no
     word is compared \u2014 only which axes are live. */
  function signatureMatch(a, b) {
    if (!a || !b) return 0;
    let shared = 0, na = 0, nb = 0;
    for (let i = 0; i < a.shape.length; i++) {
      if (a.shape[i]) na++;
      if (b.shape[i]) nb++;
      if (a.shape[i] && b.shape[i]) shared++;
    }
    const smaller = Math.min(na, nb);
    return smaller ? shared / smaller : 0;
  }

  const SIGNATURE_FLOOR = 0.72;

  function textureScore(sig, entry) {
    let score = 0;
    const shared = [];

    /* TOPIC IS SHARED CONTENT, NOT SHARED CHANNEL.

       This computed "topic" from which channel dominated, so touch reaching
       touch counted as the same subject. But channel is a SENSE and topic
       is what a thing is ABOUT. Marble and a cold room are both touch and
       are not the same subject.

       Worse, it made the two terms fight: the signature carries BY channel
       shape, so anything that carried was scored as same-subject and
       penalised for it.

       The topic signal was sitting there the whole time. Shared literal
       words are subject overlap \u2014 marble reaching marble is two things
       ABOUT stone. That is the term to subtract, and it is the exact thing
       I had been using as the carrier. Backwards, all night.

           score = signature alignment  \u2212  shared-word overlap
                   \u2191 sensory carries      \u2191 topic subtracts            */
    const mineDomain = dominantChannel(sig.modes);
    const theirDomain = dominantChannel(entry.modes);

    /* A shared QUALITY crosses channels: Van Gogh's "high" yellow can reach
       Schumann's "high" peaks even though one is sight and one is not. It
       is worth less than a shared rare word, because it is a looser thing
       \u2014 enough to put two passages side by side, not enough to claim they
       belong together. */
    /* QUALITY NAMES ARE NOT A CARRIER.

       bright matching bright is the input matched to itself. dark to dark,
       soft to soft \u2014 nothing crossed, the same word came back. These are
       the names of the axes, not things that travel along them.

       They can still ADD to a crossing that a real shared word already
       made. They cannot make one on their own. */
    const mine = qualitiesOf(sig.modes);
    const theirs = qualitiesOf(entry.modes);
    let qualityOnly = [];
    mine.forEach(function (q) {
      if (theirs.indexOf(q) === -1) return;
      qualityOnly.push(q);
    });

    Object.keys(sig.modes || {}).forEach(function (m) {
      const mine = sig.modes[m] || [];
      const theirs = (entry.modes && entry.modes[m]) || [];
      mine.forEach(function (w) {
        if (theirs.indexOf(w) === -1) return;
        const r = RARITY(m + ":" + w);
        if (r < DISTINCT_FLOOR) return;   // too common to mean anything
        score += r;
        shared.push(w);
      });
    });
    // Only now, and only if something real crossed first.
    if (shared.length) {
      qualityOnly.forEach(function (q) { score += 0.6; shared.push(q); });
    }

    /* The signature is the carrier. Shared words, if any, are a detail of
       how it happened \u2014 they are reported but they no longer decide. */
    const sigA = signature(sig.modes, sig.text);
    const sigB = signature(entry.modes, entry.text);
    const align = signatureMatch(sigA, sigB);
    if (align < SIGNATURE_FLOOR) return { score: 0, shared: [], sameSubject: false,
                                          overlap: [], align: align,
                                          domains: [mineDomain, theirDomain] };
    score = align * 3;                    // the register carrying, on its own terms

    /* Now subtract topic. Every literal word the two ends share is subject
       overlap, and each one costs. Two passages about the same thing are
       what this exists to avoid, however well their registers align. */
    const theirWords = Object.create(null);
    Object.keys(entry.modes || {}).forEach(function (m) {
      (entry.modes[m] || []).forEach(function (w) { theirWords[w] = 1; });
    });
    /* AN AXIS NAME IS NOT A SUBJECT.

       This counted every shared word as topic overlap \u2014 including the axis
       names themselves. Measured audio has no vocabulary except the axes,
       so its "words" ARE rough, thick, high. A passage that shares those
       is CARRYING, and it was being charged topic cost for it: a perfect
       1.000 crossing scored 0.12 and anything slightly stronger went
       negative. The carrier was being punished for carrying.

       Topic is what a thing is ABOUT \u2014 marble, cypress, truffle. The axes
       are how it feels, and they belong to the other term entirely. */
    const overlap = [];
    Object.keys(sig.modes || {}).forEach(function (m) {
      (sig.modes[m] || []).forEach(function (w) {
        if (AXES.indexOf(w) !== -1) return;              // an axis, not a subject
        if (theirWords[w] && overlap.indexOf(w) === -1) overlap.push(w);
      });
    });
    /* Topic cost is a PROPORTION, not a count.

       Charging per word made two shared words fatal to anything, because
       the carrier maxes at 3 and each word cost 1.6. But one shared word
       out of ten is incidental and half of them is the same subject. What
       matters is how much of the input is accounted for by the overlap. */
    // Counted against SUBJECT words only. A texture made entirely of axes
    // has no subject to overlap with, so it pays nothing.
    let mineCount = 0;
    Object.keys(sig.modes || {}).forEach(function (m) {
      (sig.modes[m] || []).forEach(function (w) {
        if (AXES.indexOf(w) === -1) mineCount++;
      });
    });
    const share = mineCount ? overlap.length / mineCount : 0;
    score -= share * 3 * TOPIC_PENALTY;

    // Same subject when the overlap accounts for most of what was said.
    const sameSubject = share >= 0.5;
    return { score: score, shared: shared, sameSubject: !!sameSubject,
             overlap: overlap, overlapShare: Math.round(share * 100) / 100,
             align: Math.round(align * 1000) / 1000,
             domains: [mineDomain, theirDomain] };
  }

  /* ==========================================================
     THE GEOMETRY, STATED SO IT STOPS BEING REBUILT WRONG.

         event                                    event
            \\                                    /
             sensory input  \u2500\u2500 the carrier \u2500\u2500  sensory input
              \\                                  /
               \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500  MEMORY at the crossing  \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
              /                                  \\
        emotion                                connection
                    \u2191 the PRODUCT, not the input \u2191

     Sensory input is what travels between the two events. Emotion and
     connection are what the crossing PRODUCES. Memory forms where they
     meet.

     This lens had affect as a SELECTION term \u2014 it rewarded passages whose
     feeling already matched the person's. That inverts the geometry: it
     makes emotion an input, so a dark moment retrieves a dark passage and
     the person is handed their own state back, deeper. Regression, not a
     crossing. A mirror that amplifies rather than reflects.

     Affect no longer selects here. The carrier is sensory texture; the
     subject is subtracted; whatever feeling the passage brings is the
     product, and it is allowed to be different from theirs. Michelangelo's
     certainty reaching someone's dark hour is the point, not a mismatch.

     NOTE: dreams still pair on affect. That is the person's OWN memories,
     where "two moments that felt the same" is exactly the claim. This
     applies only to what is offered from outside.
     ========================================================== */

  function affectScore(aff, entry) {
    if (!aff || !entry.aff) return 0;
    const dv = Math.abs((aff.valence || 0) - entry.aff.valence);
    const da = Math.abs((aff.arousal || 0) - entry.aff.arousal);
    // 1 when identical, 0 when maximally far apart.
    return Math.max(0, 1 - (dv / 2 + da) / 2);
  }

  /**
   * lens(sig, aff, opts) — the account most worth putting beside this one.
   *
   * sig   { modes: { sight: [...], sound: [...] } }  from sensoryOf()
   * aff   { valence, arousal }
   * opts  { strict: true }  refuse entries not yet checked against source
   *
   * Returns null when nothing clears the floor. That is the common case and
   * the right one — a lens forced onto every moment is decoration, and the
   * whole discipline here is not producing what the evidence doesn't carry.
   */
  // Below this, rarity is arithmetically meaningless. At one entry every
  // word scores log(1/1) = 0; at thirteen, nothing appeared in more than two
  // entries so everything was equally "rare" and the weighting filtered
  // nothing. Returning null in that state looks identical to "no resonance
  // found", which would be a quiet lie about why. So say which it is.
  // Was 60, which was a guess and the measurement contradicted it. At EIGHT
  // entries the spread is already real: "blue" appears in five of them and
  // scores 0.47, under the 1.39 floor, so it does not trigger; "sulphur"
  // and "lemon" appear in one each and score 2.08, so they do. That is the
  // weighting doing its job. It gets more reliable as the corpus grows, but
  // it is not broken at this size, and gating it off entirely was stopping
  // the thing from being used for no measured reason.
  const MIN_CORPUS = 8;

  function tooSmall() {
    return CORPUS.length < MIN_CORPUS;
  }

  function lens(sig, aff, opts) {
    opts = opts || {};
    // Deliberately NOT silent. A lens that can't work should say so.
    if (tooSmall() && !opts.allowSmallCorpus) return null;
    let best = null;
    CORPUS.forEach(function (e) {
      if (opts.strict && !e.verified) return;
      const t = textureScore(sig || {}, e);
      // The carrier is the signature. Requiring a shared literal word here
      // was the OLD carrier standing guard in front of the new one, and it
      // silently blocked every cross-sense crossing.
      if (t.score <= 0) return;
      // Sensory carries, topic subtracts. Affect is NOT added: emotion is
      // the product of the crossing, not the thing that selects it.
      const total = t.score;
      if (total <= 0) return;          // topic cost outweighed the texture
      if (!best || total > best.total) {
        best = { entry: e, total: total, shared: t.shared, texture: t.score,
                 sameSubject: !!t.sameSubject, overlap: t.overlap || [],
                 overlapShare: t.overlapShare || 0,
                 align: t.align, domains: t.domains };
      }
    });
    return best;
  }

  /* Phrasing is deliberately narrow. It reports what the person said and
     what the artist wrote, and joins them with nothing stronger than "the
     same thing". No claim about the artist's state, no claim about what it
     means for the person. */
  function phrase(hit, theirWords) {
    if (!hit) return null;
    const e = hit.entry;
    // The original is shown, always. If the translation is off, the person
    // can see the words it came from and judge for themselves \u2014 which is the
    // same reason Blue Bonnet keeps raw transcript instead of summaries.
    return "You said " + JSON.stringify(theirWords) + ". "
      + e.artist + " wrote about the same thing: \u201c" + e.text + "\u201d ("
      + e.original + " \u2014 " + e.source + ")";
  }

  /* SUGGESTING SOMETHING TO ACTUALLY GO AND HEAR OR SEE.
     
     The corpus holds writing ABOUT perception, not works \u2014 so on its own
     it has nothing to recommend, and a suggestion from the model rides in
     unguarded with no fact to bound it against. A jazz record named out of
     general knowledge is the one place this whole system's discipline does
     not reach.

     `works` closes that for the narrow case where it can be closed
     honestly: a piece is listed ONLY when the passage itself names it.
     Berlioz writes "On y jouait les Danaides, de Salieri" \u2014 so Les
     Dana\u00efdes is his, not an inference. Nothing is added from outside.

     The chain is then: your texture \u2192 a passage that shares it \u2192 the work
     that passage was actually about \u2192 cited. Nothing invented at any step.

     Titles and attributions are facts, not copyrightable expression, so
     naming a piece is safe even where the recording is not.

     The narrowness is the point and also the cost: it can only ever
     suggest what these few people wrote about. That is a small, dead,
     mostly-European set. Anything wider stays the model's invention. */
  function suggest(sig, aff, opts) {
    const hit = lens(sig, aff, opts);
    if (!hit) return null;
    const e = hit.entry;
    const work = (e.works && e.works.length) ? e.works[0] : null;
    // Only offer a painting we can actually show. A named-but-unverified
    // image is exactly the invented-URL problem in another costume.
    const painting = (e.painting && e.painting.url) ? e.painting : null;
    if (!work && !painting) return null;
    return { work: work, painting: painting, because: e, shared: hit.shared };
  }

  /* ==========================================================
     ONE LENS, EVERY SOURCE.

     lens() only ever searched the 29 curated passages. The live text, the
     paintings, the audio \u2014 all of it sat in separate modules called from
     separate places, so the instrument built to test the algorithm across
     anything it sees or touches was pointed at one shelf.

     anyLens() is the same algorithm with the far end unbounded. Same
     carrier, same subtraction, same floor. Every source competes on
     identical terms and the best crossing wins, wherever it came from.

     Verified material is preferred only when it ties \u2014 never given a
     head start, because that would be the shelf choosing again.
     ========================================================== */

  async function anyLens(sig, aff, opts) {
    opts = opts || {};
    const found = [];

    // 1. what has been checked by hand
    try {
      const c = lens(sig, aff, opts);
      if (c) found.push(Object.assign({}, c, { from: "corpus", verified: true }));
    } catch (e) {}

    // 2. anything written, anywhere in the public domain
    if (!opts.skipTexts && typeof global.BBTexts !== "undefined") {
      try {
        const t = await global.BBTexts.pickFor(sig, opts.query || null,
          { pages: opts.pages || 20 });
        if (t) found.push(Object.assign({}, t, { from: "text", verified: false }));
      } catch (e) {}
    }

    // 3. anything painted
    if (!opts.skipArt && typeof global.BBGallery !== "undefined") {
      try {
        const g = await global.BBGallery.pickFor(sig, aff,
          opts.painter || "oil painting landscape portrait", { n: opts.canvases || 8 });
        if (g && g.painting) {
          const q = g.painting.qualities || [];
          const e = { id: "art-" + String(g.painting.title).slice(0, 20),
                      artist: g.painting.painter, source: g.painting.title,
                      cite: g.painting.page || g.painting.url,
                      text: g.painting.title, modes: { sight: q },
                      aff: null, verified: false, painting: g.painting };
          const t = textureScore(sig, e);
          if (t.score > 0) {
            found.push({ entry: e, total: t.score, shared: t.shared,
                         sameSubject: !!t.sameSubject, align: t.align,
                         domains: t.domains, from: "art", verified: false });
          }
        }
      } catch (e) {}
    }

    if (!found.length) return null;
    found.sort(function (a, b) {
      if (Math.abs(b.total - a.total) > 0.0001) return b.total - a.total;
      return (b.verified ? 1 : 0) - (a.verified ? 1 : 0);   // ties only
    });
    return found[0];
  }

  function stats() {
    return {
      usable: !tooSmall(),
      needs: Math.max(0, MIN_CORPUS - CORPUS.length),
      entries: CORPUS.length,
      artists: CORPUS.map(function (e) { return e.artist; })
        .filter(function (a, i, all) { return all.indexOf(a) === i; }),
      verified: CORPUS.filter(function (e) { return e.verified; }).length,
      primary: CORPUS.filter(function (e) { return e.sourcing === "primary"; }).length,
      corroborated: CORPUS.filter(function (e) { return e.sourcing === "corroborated"; }).length,
      withWorks: CORPUS.filter(function (e) { return e.works && e.works.length; }).length,
      withPaintings: CORPUS.filter(function (e) { return e.painting; }).length,
    };
  }

  global.BBLens = {
    lens: lens,
    anyLens: anyLens,
    phrase: phrase,
    stats: stats,
    corpus: CORPUS,
    suggest: suggest,
    qualitiesOf: qualitiesOf,
    QUALITIES: QUALITIES,
    tooSmall: tooSmall,
    MIN_CORPUS: MIN_CORPUS,
    _rarity: RARITY,
    _textureScore: textureScore,
    _affectScore: affectScore,
    DISTINCT_FLOOR: DISTINCT_FLOOR,
    SIGNATURE_FLOOR: SIGNATURE_FLOOR,
    signature: signature,
    signatureMatch: signatureMatch,
    TOPIC_PENALTY: TOPIC_PENALTY,
    dominantChannel: dominantChannel,
  };
})(typeof window !== "undefined" ? window : globalThis);
