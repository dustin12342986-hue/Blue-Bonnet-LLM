/**
 * BB MUSIC — public-domain recordings, measured.
 * ==============================================
 *
 * The loop this closes:
 *
 *   a real recording  ->  played in the browser
 *                     ->  measured by BBAudio (spectrum, not metaphor)
 *                     ->  qualities in the artist lens's own vocabulary
 *                     ->  matched against what someone wrote about the
 *                         same texture, in their own words, cited
 *
 * Every step is either a measurement or a quotation. Nothing is invented.
 *
 *
 * ── WHY THE INTERNET ARCHIVE AND NOT MUSOPEN DIRECTLY ──────────────────
 *
 * Musopen holds 2,400+ public-domain compositions and 1,800+ recordings
 * under CC0 and CC BY-SA, which is exactly the right licensing. But
 * downloads sit behind an account and its files come off a CDN whose CORS
 * headers can't be relied on \u2014 and Web Audio cannot analyse audio it isn't
 * allowed to read cross-origin.
 *
 * The Internet Archive mirrors several Musopen collections, permits
 * cross-origin reads, and \u2014 the part that matters most \u2014 publishes a
 * metadata endpoint:
 *
 *     https://archive.org/metadata/{identifier}
 *
 * So the app DISCOVERS the real filenames instead of anyone hardcoding
 * guesses. No invented URLs anywhere in this file. The identifiers below
 * are the only fixed strings, and each one came from a search result
 * rather than from memory.
 *
 *
 * ── LICENSING ──────────────────────────────────────────────────────────
 *
 * Compositions: public domain, all composers here died long ago.
 * Recordings: CC0 or CC BY-SA via Musopen. CC BY-SA wants attribution, so
 * `credit()` returns it and the caller should show it. That is a condition
 * of use, not an optional courtesy.
 *
 *
 * ── WHAT THIS IS NOT ───────────────────────────────────────────────────
 *
 * Measuring a recording is not hearing it. Same wall as everywhere else.
 * What it does mean is that a real piece of music \u2014 not a description of
 * one, not a synthetic test tone \u2014 can enter the crossing.
 */

(function (global) {
  "use strict";

  /* Identifiers taken from search results, not from memory. Each is an
     Internet Archive item holding Musopen public-domain recordings. Add
     more only after confirming the identifier resolves. */
  const COLLECTIONS = [
    { id: "musopen-chopin", composer: "Fr\u00e9d\u00e9ric Chopin",
      note: "The Complete Chopin Collection, Musopen" },
  ];

  const META = "https://archive.org/metadata/";
  const DL = "https://archive.org/download/";

  const AUDIO_RE = /\.(mp3|ogg|flac|wav|m4a)$/i;

  /**
   * tracks(identifier) -> [{ name, url, size, format, composer }]
   *
   * Reads the Archive's own file list. If the identifier is wrong or the
   * item has gone, this returns an empty array rather than guessing at a
   * filename.
   */
  async function tracks(identifier) {
    const res = await fetch(META + encodeURIComponent(identifier));
    if (!res.ok) return [];
    const data = await res.json();
    const files = (data && data.files) || [];
    const found = COLLECTIONS.filter(function (c) { return c.id === identifier; })[0];
    return files
      .filter(function (f) { return f.name && AUDIO_RE.test(f.name); })
      // Prefer mp3: smaller, and every browser decodes it.
      .sort(function (a, b) {
        const am = /\.mp3$/i.test(a.name) ? 0 : 1;
        const bm = /\.mp3$/i.test(b.name) ? 0 : 1;
        return am - bm;
      })
      .map(function (f) {
        return {
          name: String(f.name).replace(AUDIO_RE, "").replace(/[_-]+/g, " ").trim(),
          file: f.name,
          url: DL + identifier + "/" + encodeURIComponent(f.name),
          size: Number(f.size || 0),
          format: f.format || "",
          composer: found ? found.composer : "",
          identifier: identifier,
        };
      });
  }

  function credit(track) {
    const c = COLLECTIONS.filter(function (x) { return x.id === track.identifier; })[0];
    return (track.composer || "Unknown composer") + " \u2014 recording from "
      + (c ? c.note : track.identifier)
      + " (archive.org/details/" + track.identifier + "), public domain / Creative Commons.";
  }

  /**
   * analyse(url, opts) -> { qualities, frames, measurements }
   *
   * Plays a recording (muted by default, so analysing a library does not
   * fill the room) and measures it. Returns the qualities that HELD across
   * the excerpt rather than any single frame \u2014 one frame is ~16ms and says
   * almost nothing about a piece.
   */
  async function analyse(url, opts) {
    opts = opts || {};
    if (typeof global.Audio === "undefined" || typeof BBAudio === "undefined") {
      throw new Error("needs a browser with Web Audio, and bb-audio-lens.js");
    }
    const seconds = opts.seconds || 20;
    const el = new global.Audio();
    // Required for Web Audio to be allowed to read the samples at all.
    el.crossOrigin = "anonymous";
    el.src = url;
    el.muted = opts.muted !== false;
    if (opts.startAt) el.currentTime = opts.startAt;

    const seen = [];
    const all = [];
    let handle = null;

    await new Promise(function (resolve, reject) {
      const done = function () {
        try { if (handle) handle.stop(); } catch (e) {}
        try { el.pause(); } catch (e) {}
        resolve();
      };
      el.onerror = function () {
        // Almost always CORS or a moved file. Say which rather than
        // failing silently.
        reject(new Error("could not read that audio \u2014 the file may have moved, "
          + "or the server may not allow cross-origin reads"));
      };
      el.oncanplay = function () {
        try {
          handle = BBAudio.listen(el, function (m) {
            if (m.qualities && m.qualities.length) seen.push(m.qualities);
            all.push(m);
          }, { fftSize: 2048 });
        } catch (e) { return reject(e); }
        el.play().catch(reject);
        global.setTimeout(done, seconds * 1000);
      };
    });

    // A quality counts if it held across a good share of the excerpt.
    const count = Object.create(null);
    seen.forEach(function (qs) {
      qs.forEach(function (q) { count[q] = (count[q] || 0) + 1; });
    });
    const need = seen.length * (opts.share || 0.35);
    const qualities = Object.keys(count).filter(function (q) { return count[q] >= need; });

    return { qualities: qualities, frames: seen.length, measurements: all.length,
             counts: count };
  }

  /**
   * whatItSharesWith(qualities) -> lens hit
   *
   * The last step: measured sound reaching a written account of the same
   * texture. Returns null when nothing clears the floor, which is correct
   * and common.
   */
  function whatItSharesWith(qualities, aff) {
    if (typeof BBLens === "undefined" || !qualities || !qualities.length) return null;
    return BBLens.lens({ modes: { sound: qualities } },
                       aff || { valence: 0.3, arousal: 0.4 });
  }

  global.BBMusic = {
    COLLECTIONS: COLLECTIONS,
    tracks: tracks,
    credit: credit,
    analyse: analyse,
    whatItSharesWith: whatItSharesWith,
    _AUDIO_RE: AUDIO_RE,
  };
})(typeof window !== "undefined" ? window : globalThis);
