/**
 * BB TEXTS — the corpus stops being a list.
 * =========================================
 *
 * Twenty-nine hand-sourced passages was never the design, it was what one
 * person could verify by hand. Wikisource holds millions of public-domain
 * texts with a real API, so the lens can reach any of it: letters,
 * journals, criticism, memoirs, anyone whose copyright has run out.
 *
 * The same shape as the gallery. That one stopped being three painters and
 * became "search Commons". This one stops being seven writers.
 *
 *
 * ── WHAT IS KEPT FROM THE CURATED CORPUS ──────────────────────────────
 *
 * The rule that made the hand-built entries worth having: only the actual
 * words, never paraphrase, always cited. Live retrieval satisfies it \\u2014
 * Wikisource returns the text itself and the page it came from, so a match
 * carries a real quotation and a real source.
 *
 * What it does NOT carry is a fresh translation. The curated entries hold
 * Van Gogh's French with an English rendering made from it. A live pull
 * gets whatever language the page is in. So English-language sources are
 * used here, and the curated entries remain the place where a translation
 * has been made deliberately.
 *
 *
 * ── WHAT IS LOST, AND IT IS REAL ──────────────────────────────────────
 *
 * Verification. Every curated entry was checked against a manuscript page
 * or corroborated across sources, and carries a `sourcing` field saying
 * which. A live pull is only as good as the page, and Wikisource pages
 * vary. So live results are marked `sourcing: "live"` and the curated
 * corpus is searched first. Unverified material should lose to verified
 * material, not silently replace it.
 */

(function (global) {
  "use strict";

  const API = "https://en.wikisource.org/w/api.php";

  let cache = Object.create(null);     // query -> [passage]
  let encoded = Object.create(null);   // pageid -> encoded passage

  /* Wikitext to prose. Deliberately blunt: anything that cannot be cleanly
     turned into a sentence is dropped rather than half-cleaned, because a
     passage with markup left in it would be quoted to someone as if the
     writer had written it. */
  function stripWikitext(t) {
    return String(t || "")
      .replace(/<ref[^>]*>[\s\S]*?<\/ref>/gi, " ")
      .replace(/<ref[^>]*\/>/gi, " ")
      .replace(/\{\{[\s\S]*?\}\}/g, " ")          // templates
      .replace(/\[\[(?:File|Image|Category):[^\]]*\]\]/gi, " ")
      .replace(/\[\[[^\]|]*\|([^\]]*)\]\]/g, "$1")  // piped links keep the label
      .replace(/\[\[([^\]]*)\]\]/g, "$1")
      .replace(/<[^>]+>/g, " ")                    // any remaining html
      .replace(/^[=*#:;].*$/gm, " ")               // headings, lists
      .replace(/'{2,}/g, "")                       // bold and italic markup
      .replace(/&[a-z]+;/gi, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  /* Sentences long enough to carry texture, short enough to read. A whole
     page is not a passage; the lens matches on a moment, not a chapter. */
  function passagesFrom(text, title, url) {
    const clean = String(text || "")
      .replace(/\[\d+\]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    const out = [];
    clean.split(/(?<=[.!?])\s+/).forEach(function (sentence) {
      const s = sentence.trim();
      if (s.length < 60 || s.length > 400) return;

      /* Front matter is not writing. A Wikisource page opens with
         publication data, and the first pull for "Walden" returned
         "Walden (1893), Boston and New York: Houghton Mifflin Company."
         \u2014 a real sentence from a real page and completely useless as a
         passage. These are the shapes that give it away. */
      if (/\b(?:published|publisher|copyright|edition|reprinted|vol\.|pp?\.|ISBN)\b/i.test(s)) return;
      if (/\b(?:Company|Press|Sons|Brothers|Publishing|Publishers|Ltd|Inc)\b/.test(s)) return;
      if (/\b1[6-9]\d{2}\b.*[:,].*[A-Z][a-z]+ (?:and|&) [A-Z]/.test(s)) return;
      if (/^[A-Z][a-z]+ \(1[6-9]\d{2}\)/.test(s)) return;
      // A sentence that is mostly capitals or numbers is a heading or an index.
      const words = s.split(/\s+/);
      const caps = words.filter(function (w) { return /^[A-Z]/.test(w); }).length;
      if (caps / words.length > 0.5) return;
      // Prose has verbs and small words. A list of names does not.
      if (!/\b(?:the|a|of|and|is|was|were|to|in|it|that|with|as|for)\b/i.test(s)) return;
      out.push({ text: s, source: title, cite: url, sourcing: "live", lang: "en" });
    });
    return out;
  }

  /* A WIDE PULL, NOT A SUBJECT SEARCH.

     The first version searched Wikisource for the measured qualities \u2014
     "bright soft released". That finds pages ABOUT brightness and then
     asks whether they feel bright, which is similarity retrieval wearing
     the mechanism's clothes. The subject was doing the choosing before the
     lens ever ran.

     The gallery never had this problem: it pulls a wide set of canvases,
     measures all of them, and lets the texture choose. This does the same.
     Random public-domain pages, encoded, and the lens picks with topic
     subtracted. Nothing about the pull is aimed at what the person said.

     Which is the whole point. A passage should arrive because it FEELS
     like the moment, and it cannot do that if it was fetched for being
     about the moment. */
  /* WHERE IT PULLS FROM.

     Random Wikisource is mostly administrative history, statutes and
     biography. A pull of 79 passages yielded 14 with any sensory axis at
     all, and the typical one had a single axis. The curated letters were
     winning not because of a thumb on the scale but because they genuinely
     ARE perceptual writing and a missionary chronicle is not.

     So the pull is aimed at a KIND of writing, never at what the person
     said. Poetry, journals, travel, nature \u2014 forms where sensation is the
     subject. That is the same move the gallery makes by searching for
     paintings rather than searching someone's words: narrow the medium,
     never the meaning. */
  const PERCEPTUAL = [
    "incategory:Poems", "incategory:Nature", "incategory:Travel_literature",
    "incategory:Essays", "incategory:Letters", "incategory:Diaries",
  ];

  async function pull(form, want) {
    const url = API
      + "?action=query&format=json&origin=*"
      + "&generator=search&gsrsearch=" + encodeURIComponent(form)
      + "&gsrnamespace=0&gsrlimit=" + Math.min(want, 20)
      + "&gsrsort=random"
      + "&prop=revisions&rvprop=content&rvslots=main";
    const res = await fetch(url);
    if (!res.ok) throw new Error("Wikisource " + res.status);
    const data = await res.json();
    const pages = (data.query && data.query.pages) || {};
    let all = [];
    Object.keys(pages).forEach(function (id) {
      const pg = pages[id];
      const rev = pg.revisions && pg.revisions[0];
      const slot = rev && rev.slots && rev.slots.main;
      const wikitext = (slot && slot["*"]) || (rev && rev["*"]) || "";
      all = all.concat(passagesFrom(stripWikitext(wikitext), pg.title,
        "https://en.wikisource.org/?curid=" + id));
    });
    return all;
  }

  /* A form that returns nothing must not end the pull.

     wide() picked one form at random, and several of the category names
     were guessed rather than checked. When it drew a dud it returned zero
     passages and the whole thing reported "nothing crossed" \u2014 which looks
     exactly like a genuine refusal and is not one.

     So it tries forms in a shuffled order until one yields, and stops
     guessing that any particular name is right. */
  async function wide(n) {
    const want = n || 10;
    const forms = PERCEPTUAL.slice().sort(function () { return Math.random() - 0.5; });
    for (let i = 0; i < forms.length; i++) {
      try {
        const got = await pull(forms[i], want);
        if (got.length) return got;
      } catch (e) { /* try the next form */ }
    }
    return [];
  }

  /**
   * find(query, limit) -> [{ text, source, cite }]
   * Asks Wikisource what exists. Nothing is constructed.
   */
  async function find(query, limit) {
    const key = String(query || "").trim().toLowerCase();
    if (!key) throw new Error("nothing to search for");
    if (cache[key]) return cache[key];

    /* NOT prop=extracts. Wikisource does not serve the TextExtracts API \u2014
       every page came back with an empty extract, whether or not exintro
       was set, so the module reported "no usable passages" while the
       search itself was working. Raw revision content always exists. */
    const url = API
      + "?action=query&format=json&origin=*"
      + "&generator=search&gsrsearch=" + encodeURIComponent(query)
      + "&gsrlimit=" + (limit || 5)
      + "&prop=revisions&rvprop=content&rvslots=main";

    const res = await fetch(url);
    if (!res.ok) throw new Error("Wikisource " + res.status);
    const data = await res.json();
    const pages = (data.query && data.query.pages) || {};

    let all = [];
    Object.keys(pages).forEach(function (id) {
      const pg = pages[id];
      const rev = pg.revisions && pg.revisions[0];
      const slot = rev && rev.slots && rev.slots.main;
      const wikitext = (slot && slot["*"]) || (rev && rev["*"]) || "";
      const link = "https://en.wikisource.org/?curid=" + id;
      all = all.concat(passagesFrom(stripWikitext(wikitext), pg.title, link));
    });

    // Empty is a failure, not an answer.
    if (!all.length) {
      const pageCount = Object.keys(pages).length;
      throw new Error(pageCount
        ? "found " + pageCount + " page(s) for \u201c" + query + "\u201d but no sentence "
          + "of usable length in them"
        : "Wikisource found nothing for \u201c" + query + "\u201d");
    }
    cache[key] = all;
    return all;
  }

  /**
   * pickFor(sig, query, opts) -> hit | null
   *
   * Encodes each live passage with the app's own sensoryOf, then scores it
   * exactly as a curated entry is scored \\u2014 same texture carrier, same
   * topic subtraction, same floor. A live passage competes on identical
   * terms and wins nothing for being new.
   */
  async function pickFor(sig, query, opts) {
    opts = opts || {};
    if (typeof global.BBLens === "undefined") return null;
    const encode = opts.encode || global.__bbSensoryOf;
    if (typeof encode !== "function") return null;

    /* Wide by default. A query is only used when the person NAMED someone
       \u2014 "something by Thoreau" \u2014 because then the subject is their choice
       rather than the machine matching on it. */
    const passages = (query && String(query).trim())
      ? await find(query, opts.limit || 5)
      : await wide(opts.pages || 12);
    let best = null;

    passages.forEach(function (p) {
      let e = encoded[p.text];
      if (!e) {
        const s = encode(p.text);
        /* No tags is not no signature.

           This skipped any passage whose sensoryOf returned nothing, which
           made sense when tags were the carrier. The signature reads the
           TEXT now, so a passage can sit squarely on an axis while having
           no tagged words at all \u2014 and those were being thrown away before
           anything looked at them. A line measured at 1.000 alignment
           never reached the scoring.

           The floor decides. Not the tags. */
        if (!s) return;
        /* MEASURED ON THE SAME TERMS.

           A live entry had `original` but no `text`, and signature() reads
           the text to find which axes are live. So corpus entries got their
           qualities from their prose and live ones got nothing \u2014 computed
           from sparse tags alone, they could never compete. The shelf was
           winning because the other side was being measured with a
           different instrument. */
        e = Object.assign({}, p, {
          id: "live-" + p.text.slice(0, 24).replace(/\W+/g, "-"),
          artist: p.source,
          text: p.text,              // <- what signature() actually reads
          original: p.text,
          modes: s.modes,
          aff: { valence: 0, arousal: 0.4 },
          verified: false,
        });
        encoded[p.text] = e;
      }
      const t = global.BBLens._textureScore(sig, e);
      /* The same guard the lens had, missed here for an hour.

         Requiring a shared WORD is the old carrier standing in front of
         the new one. A passage aligned at 1.000 with an empty overlap is
         the ideal case \u2014 the axes carried and nothing about the subject
         came along \u2014 and this threw exactly those away.

         The score already accounts for both terms. Nothing else to check. */
      if (t.score <= 0) return;

      /* The density and quality-name bars that used to sit here were built
         for word matching \u2014 they existed because "bright" appearing once in
         a political sentence could carry a whole crossing. The carrier is
         the axis set now, and the topic term subtracts shared words, so
         those bars were solving a problem that no longer exists while
         quietly excluding most live passages. Removed.

         What remains is the same floor everything else clears. */

      if (!best || t.score > best.total) {
        best = { entry: e, total: t.score, shared: t.shared,
                 sameSubject: !!t.sameSubject, live: true };
      }
    });
    return best;
  }

  function stats() {
    return {
      queries: Object.keys(cache).length,
      passages: Object.keys(cache).reduce(function (n, k) { return n + cache[k].length; }, 0),
      encoded: Object.keys(encoded).length,
    };
  }

  global.BBTexts = {
    find: find,
    wide: wide,
    pull: pull,
    PERCEPTUAL: PERCEPTUAL,
    pickFor: pickFor,
    stats: stats,
    passagesFrom: passagesFrom,
    stripWikitext: stripWikitext,
    API: API,
  };
})(typeof window !== "undefined" ? window : globalThis);
