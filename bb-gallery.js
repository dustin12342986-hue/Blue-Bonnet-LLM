/**
 * BB GALLERY — the lens picks the painting.
 * =========================================
 *
 * Until now a painting could only be attached to a passage by hand, one at
 * a time, which is documentation rather than retrieval. This is the other
 * thing: measure a body of paintings, and let a texture find whichever one
 * crosses.
 *
 *   your words  ->  sensory texture
 *   a canvas    ->  measured (luminance, saturation, edge density)
 *   both        ->  the same quality vocabulary
 *   ->  the painting that shares the texture, subject subtracted
 *
 * It is anti-similar by construction: a painting has no subject tags here,
 * only measurements, so nothing can match on what it depicts. A canvas
 * reaches a moment because they FEEL alike, never because they are about
 * the same thing.
 *
 *
 * ── NOTHING IS INVENTED ───────────────────────────────────────────────
 *
 * Filenames on Wikimedia are content-addressed by an MD5 of the name, so a
 * URL cannot be guessed reliably \u2014 I got one wrong earlier today and it
 * 400'd. So this ASKS the Commons API what exists and uses the thumbnail
 * URLs it returns. The same rule as quoting Van Gogh from the manuscript
 * page rather than from memory: an invented URL is an invented quote.
 *
 * `origin=*` is what makes the API readable from a browser; without it
 * every request fails CORS.
 *
 *
 * ── PUBLIC DOMAIN ─────────────────────────────────────────────────────
 *
 * Every painter below died more than a century ago, and Wikimedia's
 * position is that a faithful photographic reproduction of a
 * two-dimensional public-domain work is itself public domain. So both
 * layers are clear \u2014 the painting and the photograph of it.
 *
 *
 * ── WHAT IT IS NOT ────────────────────────────────────────────────────
 *
 * It does not see. It computes luminance and calls it brightness. And it
 * measures the SURFACE, not the subject: a funeral painted in bright
 * colours measures bright. Reading grief off a canvas is exactly the
 * confident interpretation this project refuses.
 */

(function (global) {
  "use strict";

  const API = "https://commons.wikimedia.org/w/api.php";

  /* Categories confirmed to exist on Commons. Add only after checking \u2014 a
     wrong category name returns an empty list, which looks like "no
     paintings matched" and is a quiet lie. */
  /* Search terms, not categories.

     The first version asked for the FILES in a painter's category. That
     returned nothing: "Category:Paintings by Vincent van Gogh in the Van
     Gogh Museum" holds fourteen SUBCATEGORIES and no files of its own, so
     gcmtype=file matched zero. An empty catalogue looks exactly like "no
     painting crossed" and the gallery could never work \u2014 a quiet failure
     of precisely the kind this project keeps finding.

     Commons search over the File namespace does not care how categories
     are nested, so it survives a curator reorganising things. */
  const PAINTERS = [
    { key: "vangogh",  name: "Vincent van Gogh", died: 1890,
      search: "Van Gogh painting oil canvas" },
    { key: "delacroix", name: "Eug\u00e8ne Delacroix", died: 1863,
      search: "Delacroix painting oil canvas" },
    { key: "monet", name: "Claude Monet", died: 1926,
      search: "Claude Monet painting oil canvas" },
  ];

  function painters() {
    return PAINTERS.map(function (p) {
      return { key: p.key, name: p.name, died: p.died, category: p.category };
    });
  }

  /**
   * catalogue(key, limit) -> [{ title, url, page }]
   * Asks Commons what is actually in the category. Never constructs a URL.
   */
  async function catalogue(key, limit) {
    if (cache[key]) return cache[key];
    const p = PAINTERS.filter(function (x) { return x.key === key; })[0];
    if (!p) throw new Error("unknown painter: " + key);

    const url = API
      + "?action=query&format=json&origin=*"
      + "&generator=search"
      + "&gsrsearch=" + encodeURIComponent(p.search)
      + "&gsrnamespace=6"                       // File: namespace only
      + "&gsrlimit=" + (limit || 30)
      + "&prop=imageinfo&iiprop=url&iiurlwidth=480";

    const res = await fetch(url);
    if (!res.ok) throw new Error("Commons API " + res.status);
    const data = await res.json();
    const pages = (data.query && data.query.pages) || {};

    const list = Object.keys(pages).map(function (id) {
      const pg = pages[id];
      const info = (pg.imageinfo && pg.imageinfo[0]) || {};
      return {
        title: String(pg.title || "").replace(/^File:/, "").replace(/\.[a-z]+$/i, "")
          .replace(/_/g, " "),
        url: info.thumburl || null,
        page: info.descriptionurl || null,
        painter: p.name,
      };
    }).filter(function (x) { return x.url && /\.(jpg|jpeg|png)/i.test(x.url); });

    // An empty list is a failure, not an answer. Saying so beats caching
    // nothing and reporting "no painting crossed" forever after.
    if (!list.length) throw new Error("Commons returned no images for " + key);

    cache[key] = list;
    return list;
  }

  /**
   * measureAll(key, n) — measures up to n canvases and caches the results.
   * Failures are skipped rather than thrown: one unreachable image should
   * not empty the gallery.
   */
  async function measureAll(key, n) {
    if (typeof global.BBVision === "undefined") throw new Error("BBVision not loaded");
    const list = await catalogue(key);
    const take = list.slice(0, n || 24);
    const out = [];
    for (let i = 0; i < take.length; i++) {
      const item = take[i];
      if (measured[item.url]) { out.push(measured[item.url]); continue; }
      try {
        const m = await global.BBVision.fromURL(item.url, 384);
        if (!m || !m.qualities.length) continue;
        const rec = Object.assign({}, item, m);
        measured[item.url] = rec;
        out.push(rec);
      } catch (e) { /* skip */ }
    }
    return out;
  }

  /**
   * pickFor(sig, aff, key) -> { painting, shared } | null
   *
   * The retrieval. Scores each measured canvas against the texture using
   * the artist lens's own comparison, so a painting competes on exactly
   * the same terms as a written passage.
   *
   * Returns null when nothing crosses \u2014 which is the common case and the
   * correct one. A gallery that always has an answer is decoration.
   */
  async function pickFor(sig, aff, key, opts) {
    opts = opts || {};
    const gallery = await measureAll(key || "vangogh", opts.n || 16);
    if (!gallery.length) return null;

    const mine = (sig && sig.modes) ? sig.modes : {};
    const flat = [];
    Object.keys(mine).forEach(function (m) { flat.push.apply(flat, mine[m] || []); });
    if (typeof global.BBLens !== "undefined") {
      // Fold in cross-modal qualities so "high", "rough" etc. can carry.
      flat.push.apply(flat, global.BBLens.qualitiesOf(mine));
    }
    if (!flat.length) return null;

    let best = null;
    gallery.forEach(function (g) {
      const shared = g.qualities.filter(function (q) { return flat.indexOf(q) !== -1; });
      if (!shared.length) return;
      // More shared qualities is a stronger crossing. Deliberately simple:
      // a weighting invented now would be a fourth guessed threshold.
      const score = shared.length;
      if (!best || score > best.score) best = { painting: g, shared: shared, score: score };
    });
    return best;
  }

  function stats() {
    return {
      painters: PAINTERS.length,
      cached: Object.keys(cache).reduce(function (n, k) { return n + cache[k].length; }, 0),
      measured: Object.keys(measured).length,
    };
  }

  global.BBGallery = {
    painters: painters,
    catalogue: catalogue,
    measureAll: measureAll,
    pickFor: pickFor,
    stats: stats,
    API: API,
    _painters: PAINTERS,
  };
})(typeof window !== "undefined" ? window : globalThis);
