/**
 * BB CORPUS BUILDER — turning the shelf into a library.
 * =====================================================
 *
 * The curated corpus is thirty-four passages, hand-sourced one at a time.
 * That is too few to be a far end and too selected to be fair: everything
 * in it was chosen for being sensory, so it beat random prose on every loud
 * texture and one Berlioz passage kept winning.
 *
 * The answer is not to handicap it. It is to make it large.
 *
 *
 * ── WHY THIS RUNS IN THE BROWSER ──────────────────────────────────────
 *
 * Wikisource is reachable from a page and not from the build sandbox, so
 * the harvest happens where the access is. It runs for as long as you let
 * it, keeps what clears the bar, and hands back a file.
 *
 *
 * ── WHAT IT KEEPS ─────────────────────────────────────────────────────
 *
 * Not everything public domain. A statute is public domain and has no
 * sensation in it. A passage is kept when it carries real perceptual
 * weight, judged the same way the lens judges it:
 *
 *   THREE AXES OR MORE. One is a coincidence. The Jefferson letter that
 *   crossed on a single abstract "bright" is exactly what this excludes.
 *
 *   DENSITY. Sensory words as a proportion of the whole, so a long
 *   administrative paragraph with one vivid clause does not qualify.
 *
 *   NOT MENTION. The lens already separates a passage that IS soft from
 *   one discussing softness; the same rule applies at harvest.
 *
 * Every kept passage carries its source and a link, because a corpus
 * without citations is worth nothing.
 *
 *
 * ── HOW TO RUN IT ─────────────────────────────────────────────────────
 *
 *   await BBCorpusBuilder.harvest({ minutes: 20 })   // go and do something else
 *   BBCorpusBuilder.count()                          // how many so far
 *   BBCorpusBuilder.download()                       // writes bb-corpus-live.js
 *
 * Then upload that file alongside the others and it loads as corpus.
 */

(function (global) {
  "use strict";

  const API = "https://en.wikisource.org/w/api.php";

  /* Forms where sensation is the subject. Not a restriction on WHO — any
     writer in any of these is fair game. */
  /* Art, not journals. The conduit carries between made things; a track
     against a trade column has one strong end and one weak one. Poetry
     first, because it is the densest sensory writing there is. */
  const FORMS = [
    "incategory:Poems", "incategory:Poetry", "incategory:Sonnets",
    "incategory:Ballads", "incategory:Elegies", "incategory:Odes",
    "incategory:Lyric_poetry", "incategory:Narrative_poetry",
    "incategory:Novels", "incategory:Short_stories", "incategory:Fairy_tales",
    "incategory:Ghost_stories", "incategory:Sea_stories",
    "incategory:Romances", "incategory:Fables", "incategory:Myths",
  ];

  const NOT_ART = new RegExp(
    "\\b(magazine|periodical|journal|gazette|bulletin|annual report|"
    + "proceedings|transactions|almanac|directory|catalogue|encyclop|"
    + "dictionary|handbook|manual|digest|business|commerce|statistics|"
    + "census|hansard|congressional|patent|advertis|obituar)\\b", "i");
  const CONCURRENCY = 20;
  /* Three axes was the bar for "sensory". It is too low for "exceptional",
     which is what the far end has to be \u2014 it let a business column and a
     magazine piece through. Four, and denser. */
  const MIN_AXES = 4;
  const MIN_DENSITY = 0.08;    // sensory words as a share of the passage

  let kept = Object.create(null);   // text -> entry, deduped
  let seenPages = Object.create(null);
  let running = false;
  let stats = { pages: 0, passages: 0, kept: 0 };

  function words(t) {
    return String(t || "").toLowerCase().split(/[^a-z\u00c0-\u024f]+/).filter(Boolean);
  }

  /* Wikitext to prose. Anything that cannot be cleanly turned into a
     sentence is dropped rather than half-cleaned \u2014 a passage with markup
     left in it would be quoted to someone as if the writer wrote it. */
  function strip(t) {
    return String(t || "")
      .replace(/<ref[^>]*>[\s\S]*?<\/ref>/gi, " ")
      .replace(/<ref[^>]*\/>/gi, " ")
      .replace(/\{\{[\s\S]*?\}\}/g, " ")
      .replace(/\[\[(?:File|Image|Category):[^\]]*\]\]/gi, " ")
      .replace(/\[\[[^\]|]*\|([^\]]*)\]\]/g, "$1")
      .replace(/\[\[([^\]]*)\]\]/g, "$1")
      .replace(/<[^>]+>/g, " ")
      .replace(/^[=*#:;].*$/gm, " ")
      .replace(/'{2,}/g, "")
      .replace(/&[a-z]+;/gi, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function sentences(text, title, url) {
    const out = [];
    String(text).split(/(?<=[.!?])\s+/).forEach(function (raw) {
      const s = raw.trim();
      if (s.length < 80 || s.length > 400) return;

      // Front matter is not writing.
      if (/\b(published|publisher|copyright|edition|reprinted|vol\.|pp?\.|ISBN)\b/i.test(s)) return;
      if (/\b(Company|Press|Sons|Brothers|Publishing|Ltd|Inc)\b/.test(s)) return;
      const w = s.split(/\s+/);
      const caps = w.filter(function (x) { return /^[A-Z]/.test(x); }).length;
      if (caps / w.length > 0.5) return;
      if (!/\b(the|a|of|and|is|was|were|to|in|it|that|with|as|for)\b/i.test(s)) return;

      out.push({ text: s, source: title, cite: url });
    });
    return out;
  }

  /* The same bar the lens applies, applied at harvest so the corpus is
     made of passages that could actually carry. */
  function qualifies(passage) {
    if (typeof global.BBLens === "undefined" || !global.BBLens.signature) return null;
    const sig = global.BBLens.signature({}, passage.text);
    if (!sig) return null;
    if (sig.qualities.length < MIN_AXES) return null;

    const n = words(passage.text).length;
    if (!n) return null;
    // Density measured on the axes, not on raw word count.
    if (sig.qualities.length / Math.sqrt(n) < MIN_DENSITY) return null;

    return sig.qualities;
  }

  async function pull(form, limit) {
    const url = API
      + "?action=query&format=json&origin=*"
      + "&generator=search&gsrsearch=" + encodeURIComponent(form)
      + "&gsrnamespace=0&gsrlimit=" + (limit || 20)
      + "&gsrsort=random"
      + "&prop=revisions&rvprop=content&rvslots=main";
    const res = await fetch(url);
    if (!res.ok) throw new Error("Wikisource " + res.status);
    const data = await res.json();
    const pages = (data.query && data.query.pages) || {};
    let out = [];
    Object.keys(pages).forEach(function (id) {
      if (seenPages[id]) return;
      seenPages[id] = 1;
      stats.pages++;
      const pg = pages[id];
      if (NOT_ART.test(String(pg.title || ""))) return;
      const rev = pg.revisions && pg.revisions[0];
      const slot = rev && rev.slots && rev.slots.main;
      const wt = (slot && slot["*"]) || (rev && rev["*"]) || "";
      out = out.concat(sentences(strip(wt), pg.title,
        "https://en.wikisource.org/?curid=" + id));
    });
    return out;
  }

  /**
   * harvest({ minutes, onProgress }) — runs until the time is up.
   * Safe to leave alone; it paces itself and backs off on a rate limit.
   */
  async function harvest(opts) {
    opts = opts || {};
    if (running) return count();
    running = true;
    const until = Date.now() + (opts.minutes || 10) * 60000;

    while (running && Date.now() < until) {
      const forms = FORMS.slice().sort(function () { return Math.random() - 0.5; });
      const jobs = [];
      for (let i = 0; i < CONCURRENCY; i++) jobs.push(pull(forms[i % forms.length], 20));

      let limited = false;
      const settled = await Promise.allSettled(jobs);
      settled.forEach(function (r) {
        if (r.status === "rejected") {
          if (/429|rate/i.test(String(r.reason && r.reason.message))) limited = true;
          return;
        }
        (r.value || []).forEach(function (p) {
          stats.passages++;
          if (kept[p.text]) return;
          const axes = qualifies(p);
          if (!axes) return;
          kept[p.text] = { text: p.text, source: p.source, cite: p.cite, axes: axes };
          stats.kept++;
        });
      });

      if (opts.onProgress) { try { opts.onProgress(count()); } catch (e) {} }
      // Paced deliberately. Hammering the archive would be rude and would
      // get the harvest cut off before it finished.
      await new Promise(function (r) { setTimeout(r, limited ? 60000 : 2500); });
    }

    running = false;
    return count();
  }

  function stop() { running = false; }
  function count() {
    return { kept: stats.kept, passages: stats.passages, pages: stats.pages,
             running: running };
  }
  function entries() { return Object.keys(kept).map(function (k) { return kept[k]; }); }

  /* Written as a loadable file rather than JSON, so it drops in beside the
     other modules with no wiring. Every entry keeps its source and link. */
  function toFile() {
    const list = entries();
    const body = list.map(function (e, i) {
      return "  {\n"
        + "    id: \"live-" + i + "\",\n"
        + "    artist: " + JSON.stringify(e.source) + ",\n"
        + "    source: " + JSON.stringify(e.source) + ",\n"
        + "    cite: " + JSON.stringify(e.cite) + ",\n"
        + "    sourcing: \"harvested\",\n"
        + "    lang: \"en\",\n"
        + "    text: " + JSON.stringify(e.text) + ",\n"
        + "    original: " + JSON.stringify(e.text) + ",\n"
        + "    verified: false,\n"
        + "    modes: { sight: " + JSON.stringify(e.axes) + " },\n"
        + "    aff: { valence: 0, arousal: 0.4 },\n"
        + "  }";
    }).join(",\n");

    return "/* bb-corpus-live.js \u2014 harvested from Wikisource.\n"
      + " *\n"
      + " * " + list.length + " passages, each carrying at least " + MIN_AXES
      + " sensory axes.\n"
      + " * Every one keeps its source and a link. Marked `sourcing: harvested`\n"
      + " * and `verified: false`, because nobody read these by hand \u2014 they\n"
      + " * cleared a measurement, which is not the same as being checked.\n"
      + " */\n"
      + "(function (g) {\n"
      + "  g.BB_CORPUS_LIVE = [\n" + body + "\n  ];\n"
      + "})(typeof window !== \"undefined\" ? window : globalThis);\n";
  }

  function download() {
    const blob = new Blob([toFile()], { type: "text/javascript" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "bb-corpus-live.js";
    a.click();
    return count();
  }

  global.BBCorpusBuilder = {
    harvest: harvest,
    stop: stop,
    count: count,
    entries: entries,
    toFile: toFile,
    download: download,
    MIN_AXES: MIN_AXES,
    FORMS: FORMS,
  };
})(typeof window !== "undefined" ? window : globalThis);
