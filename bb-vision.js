/**
 * BB VISION — a painting, measured.
 * =================================
 *
 * The exact parallel of the audio lens. Sound arrives as a spectrum and
 * yields brightness, thickness, roughness, tension. An image arrives as
 * pixels and yields the same four, computed differently:
 *
 *   luminance      -> bright / dark
 *   saturation     -> thick / thin
 *   edge density   -> rough / soft
 *   contrast range -> tense / released
 *
 * Same vocabulary the writers used, so a painting and a letter can reach
 * each other without anyone mapping wavelength to anything.
 *
 *
 * ── WHY THIS ONE MATTERS MORE THAN THE OTHERS ─────────────────────────
 *
 * Every other corpus entry is a writer describing perception. This is the
 * first case where the THING ITSELF is available alongside the description
 * of it. Van Gogh wrote about a sulphur sun under a cobalt sky, and that
 * painting is public domain and downloadable.
 *
 * So for the first time the measurement can be checked against the
 * measurer. If the canvas measures bright and warm and thickly saturated,
 * and the painter's own letter says sulphur and cobalt, those agree — and
 * that agreement is evidence the quality vocabulary means something rather
 * than being a convenient set of words.
 *
 * If they disagree, that is worth more. It would mean the mapping from
 * measurement to word is wrong, and no amount of internal consistency
 * would have shown it.
 *
 *
 * ── WHAT IT IS NOT ────────────────────────────────────────────────────
 *
 * It does not see. Mean luminance of 0.7 means an image is bright; nothing
 * in the computation is brightness to anything. Same wall as sound, same
 * place, unmoved.
 *
 * And it measures the SURFACE, not the subject. A painting of a funeral in
 * bright colours measures bright. That is a real limit and it is the
 * correct behaviour: reading grief off a canvas would be exactly the kind
 * of confident interpretation this project exists to refuse.
 */

(function (global) {
  "use strict";

  /* ---- pure measurement over RGBA ------------------------------------
     Takes { data, width, height } as ImageData provides, so it can be
     tested without a browser. Sampling every Nth pixel keeps a 4000px
     painting from costing a second of work for no gain in accuracy. */

  function stats(img, step) {
    const d = img.data, w = img.width, h = img.height;
    step = step || Math.max(1, Math.floor(Math.sqrt((w * h) / 20000)));
    let n = 0, lSum = 0, lSq = 0, sSum = 0, warm = 0;
    let lMin = 1, lMax = 0;

    for (let y = 0; y < h; y += step) {
      for (let x = 0; x < w; x += step) {
        const i = (y * w + x) * 4;
        const r = d[i] / 255, g = d[i + 1] / 255, b = d[i + 2] / 255;
        // Rec. 709 luma — the standard perceptual weighting, not a mean of
        // channels, because green reads far brighter than blue at equal value.
        const l = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
        const sat = mx ? (mx - mn) / mx : 0;
        lSum += l; lSq += l * l; sSum += sat;
        if (l < lMin) lMin = l;
        if (l > lMax) lMax = l;
        // Warmth as red-vs-blue balance. A description of the image, not a
        // claim about colour temperature in kelvin.
        warm += (r - b);
        n++;
      }
    }
    if (!n) return null;
    const lMean = lSum / n;
    return {
      samples: n,
      luminance: lMean,
      contrast: Math.sqrt(Math.max(0, lSq / n - lMean * lMean)),  // sd of luma
      range: lMax - lMin,
      saturation: sSum / n,
      warmth: warm / n,
    };
  }

  /* Edge density: how much the image changes pixel to pixel. A smooth
     gradient is near zero; visible brushwork or fine detail is high. This
     is the visual counterpart of spectral flux in the audio lens. */
  function edgeDensity(img, step) {
    const d = img.data, w = img.width, h = img.height;
    step = step || Math.max(1, Math.floor(Math.sqrt((w * h) / 20000)));
    let n = 0, sum = 0;
    const lum = (i) => (0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]) / 255;
    for (let y = step; y < h - step; y += step) {
      for (let x = step; x < w - step; x += step) {
        const i = (y * w + x) * 4;
        const dx = Math.abs(lum(i) - lum((y * w + x + step) * 4));
        const dy = Math.abs(lum(i) - lum(((y + step) * w + x) * 4));
        sum += dx + dy;
        n++;
      }
    }
    return n ? sum / n : 0;
  }

  /* ---- thresholds -----------------------------------------------------
     Guesses, and flagged as such. Three thresholds in this project have
     already been wrong and every one was caught by measurement rather than
     by thinking harder, so these are a starting point to be tuned against
     real paintings whose painters described them. */
  const T = {
    bright:     0.62,
    dark:       0.30,
    thickSat:   0.45,
    thinSat:    0.18,
    roughEdge:  0.075,
    softEdge:   0.022,
    tenseRange: 0.80,
    releasedSd: 0.11,
  };

  /**
   * qualitiesOfImage(imageData) -> ["bright","thick",...]
   * The same vocabulary the artist lens derives from writers' words.
   */
  function qualitiesOfImage(img) {
    const s = stats(img);
    if (!s) return [];
    const e = edgeDensity(img);
    const out = [];

    if (s.luminance >= T.bright) out.push("bright");
    else if (s.luminance <= T.dark) out.push("dark");

    if (s.saturation >= T.thickSat) out.push("thick");
    else if (s.saturation <= T.thinSat) out.push("thin");

    if (e >= T.roughEdge) out.push("rough");
    else if (e <= T.softEdge) out.push("soft");

    if (s.range >= T.tenseRange && s.contrast >= 0.2) out.push("tense");
    else if (s.contrast <= T.releasedSd) out.push("released");

    // High and low as vertical position of the bright mass would need
    // region analysis; not claimed here rather than guessed at.
    return out;
  }

  function measureImage(img) {
    const s = stats(img);
    if (!s) return null;
    return Object.assign({}, s, {
      edgeDensity: edgeDensity(img),
      qualities: qualitiesOfImage(img),
    });
  }

  /* ---- loading, browser only ------------------------------------------
     Everything above is pure, so the maths is checkable without a canvas. */
  function fromURL(url, maxSide) {
    return new Promise(function (resolve, reject) {
      if (typeof global.Image === "undefined" || typeof global.document === "undefined") {
        return reject(new Error("no canvas in this environment"));
      }
      const im = new global.Image();
      im.crossOrigin = "anonymous";   // without it the canvas is tainted and
                                       // getImageData throws
      im.onload = function () {
        const side = maxSide || 512;
        const scale = Math.min(1, side / Math.max(im.width, im.height));
        const c = global.document.createElement("canvas");
        c.width = Math.max(1, Math.round(im.width * scale));
        c.height = Math.max(1, Math.round(im.height * scale));
        const ctx = c.getContext("2d");
        ctx.drawImage(im, 0, 0, c.width, c.height);
        try {
          resolve(measureImage(ctx.getImageData(0, 0, c.width, c.height)));
        } catch (e) { reject(e); }
      };
      im.onerror = function () { reject(new Error("could not load that image")); };
      im.src = url;
    });
  }

  global.BBVision = {
    qualitiesOfImage: qualitiesOfImage,
    measureImage: measureImage,
    fromURL: fromURL,
    THRESHOLDS: T,
    _stats: stats,
    _edgeDensity: edgeDensity,
  };
})(typeof window !== "undefined" ? window : globalThis);
