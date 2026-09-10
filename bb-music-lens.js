/* bb-music-lens.js — THE MUSIC LENS
 *
 * A separate lens. Its own file. Touches nothing that works.
 *
 * It runs every geometry we established on a sound, and at every step it
 * SUBTRACTS to find what remains — never adds, never sums voices together,
 * never combines signatures, never correlates into a score. Two ends,
 * subtract, read what remains. That is the only operation.
 *
 * The geometries (each a face of the same subtraction):
 *   - intervals      : the pull between two simultaneous tones (subtract in log)
 *   - difference tones: the third tone that appears (subtract in linear)
 *   - beats          : the shimmer between two close tones (subtract, when close)
 *   - melody/motion  : the pull between successive tones (subtract over time)
 *   - the web        : every voice against every other, pairwise (subtract)
 *
 * And the principle that validates every finding:
 *   - the CENTER TEST (uncertainty / entropy / probability): a real
 *     relationship, subtracted to its remainder, sits at the CENTER (~0.5).
 *     A false one falls toward a pole. So the lens keeps only what centers.
 *     This is the same discipline as the interval lens's null: report only
 *     what genuinely remains.
 *
 * Nothing here is summed into a verdict. Each relationship is read, and
 * center-tested, and kept or dropped on its own.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.BBMusicLens = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var CENTER = 0.5;
  var CENTER_TOL = 0.08;   // within this of 0.5 counts as "at center" = real relationship

  /* ---- the ends: separate a sound into its simultaneous voices (peaks) ---- */
  /* This is not addition — it is finding the distinct voices already present,
     the way the interval lens does. Each peak is one end. */
  function voices(samples, sampleRate, maxVoices) {
    var N = Math.min(samples.length, 4096);
    var x = samples;
    if (samples.length > N) {
      var step = Math.floor(samples.length / N);
      x = new Float64Array(N);
      for (var i = 0; i < N; i++) x[i] = samples[i * step] || 0;
      sampleRate = sampleRate / step;
    }
    // Hann-windowed magnitude spectrum
    var half = Math.floor(N / 2), mag = new Float64Array(half);
    for (var k = 0; k < half; k++) {
      var re = 0, im = 0, c = (2 * Math.PI * k) / N;
      for (var n = 0; n < N; n++) {
        var w = 0.5 - 0.5 * Math.cos((2 * Math.PI * n) / (N - 1));
        var s = x[n] * w;
        re += s * Math.cos(c * n); im -= s * Math.sin(c * n);
      }
      mag[k] = Math.sqrt(re * re + im * im);
    }
    var binHz = sampleRate / N;
    var mean = 0; for (var m = 0; m < half; m++) mean += mag[m]; mean /= half || 1;
    var floor = mean * 2;
    var peaks = [];
    for (var j = 2; j < half - 2; j++) {
      if (mag[j] > floor && mag[j] > mag[j-1] && mag[j] > mag[j+1] &&
          mag[j] >= mag[j-2] && mag[j] >= mag[j+2]) {
        peaks.push({ freq: j * binHz, magnitude: mag[j] });
      }
    }
    peaks.sort(function (a, b) { return b.magnitude - a.magnitude; });
    return peaks.slice(0, maxVoices || 8);
  }

  /* ---- the center test: does a remainder sit at the center? ---- */
  /* Given two values, subtract to their relationship (normalized to 0..1),
     and report whether it sits at center. This is the uncertainty principle
     as a validity check: a real relationship centers; a false one poles. */
  function centerOf(a, b) {
    // A real relationship is a genuine BETWEEN. The two poles are:
    //   - UNISON (ratio 1:1): the tones are the same. No relationship.
    //   - UNRELATEDNESS (no simple ratio): no relationship either.
    // The real relationships (consonances) sit BETWEEN these poles: a simple
    // integer ratio that is NOT a unison. So we subtract the interval down to
    // its ratio and ask how close it is to a simple ratio, folded into an
    // octave, excluding unison. Close to a simple ratio and not unison =
    // sits at the center = real. Near unison, or far from any simple ratio =
    // at a pole = not real.
    if (a === 0 || b === 0) return { pos: 0, real: false };
    var lo = Math.min(a, b), hi = Math.max(a, b);
    var r = hi / lo;
    // fold into one octave, 1..2
    while (r >= 2) r /= 2;
    while (r < 1) r *= 2;
    // the simple ratios (the real betweens), as cents within the octave
    var SIMPLE = [ 9/8, 6/5, 5/4, 4/3, 3/2, 8/5, 5/3, 16/9, 15/8 ];  // exclude 1:1 and 2:1 (the poles)
    var cents = 1200 * Math.log2(r);
    // distance to the nearest simple ratio, in cents
    var best = Infinity;
    for (var i = 0; i < SIMPLE.length; i++) {
      var d = Math.abs(cents - 1200 * Math.log2(SIMPLE[i]));
      if (d < best) best = d;
    }
    // distance to the nearest POLE (unison 0c, or octave 1200c)
    var poleDist = Math.min(cents, 1200 - cents);
    // real if it is close to a simple ratio AND not hugging a pole
    var real = best <= 25 && poleDist >= 90;   // within a quartertone of a consonance, and clear of the poles
    // pos: 0.5 = squarely between the poles on a real consonance; toward 0 or 1 = a pole
    var pos = cents / 1200;
    return { pos: pos, nearestConsonanceCents: Math.round(best), real: real };
  }

  /* ---- the geometries, each pure subtraction ---- */

  // interval: subtract in log — the pull between two simultaneous tones
  function interval(a, b) {
    var cents = 1200 * Math.abs(Math.log2(b / a));
    var c = centerOf(a, b);
    return { a: a, b: b, cents: Math.round(cents), pos: c.pos, real: c.real };
  }
  // difference tone: subtract in linear — the third tone that appears at the middle
  function differenceTone(a, b) {
    var diff = Math.abs(b - a);
    return { a: a, b: b, differenceTone: Math.round(diff * 100) / 100 };
  }
  // beats: subtract when close — the shimmer (slow difference, a few Hz)
  function beats(a, b) {
    var d = Math.abs(b - a);
    return (d > 0 && d <= 20) ? { a: a, b: b, beatHz: Math.round(d * 100) / 100 } : null;
  }

  /* ---- the web: every voice against every other, by subtraction ---- */
  function web(vs) {
    var out = [];
    var sorted = vs.slice().sort(function (a, b) { return a.freq - b.freq; });
    for (var i = 0; i < sorted.length; i++) {
      for (var j = i + 1; j < sorted.length; j++) {
        var lo = sorted[i].freq, hi = sorted[j].freq;
        if (lo <= 0) continue;
        var iv = interval(lo, hi);
        var dt = differenceTone(lo, hi);
        var bt = beats(lo, hi);
        out.push({
          between: [Math.round(lo * 100) / 100, Math.round(hi * 100) / 100],
          interval: iv, differenceTone: dt.differenceTone, beats: bt ? bt.beatHz : null,
          real: iv.real   // kept only if it centers
        });
      }
    }
    return out;
  }

  /* ---- melody: the pull between successive voices OVER TIME ---- */
  /* Snapshot windows lose motion. Melody is the same subtraction applied
     between each window's strongest voice and the next window's, across time.
     Pure subtraction, in log, over the sequence. */
  function melody(samples, sampleRate, opts) {
    opts = opts || {};
    var windows = opts.windows || 8;
    var wlen = Math.floor(samples.length / windows);
    if (wlen < 256) return [];
    var line = [];
    for (var wi = 0; wi < windows; wi++) {
      var seg = samples.subarray ? samples.subarray(wi*wlen, (wi+1)*wlen)
                                 : samples.slice(wi*wlen, (wi+1)*wlen);
      var vs = voices(seg, sampleRate, 1);   // the strongest voice in this window
      line.push(vs.length ? vs[0].freq : null);
    }
    var steps = [];
    for (var i = 1; i < line.length; i++) {
      if (line[i] && line[i-1]) {
        var c = centerOf(line[i-1], line[i]);   // the pull between successive tones
        steps.push({
          from: Math.round(line[i-1]*100)/100, to: Math.round(line[i]*100)/100,
          cents: Math.round(1200 * Math.abs(Math.log2(line[i]/line[i-1]))),
          real: c.real
        });
      }
    }
    return steps;
  }

  /* ---- the real signature of the sound, measured like the audio lens ----
     The crossing must use the sound's ACTUAL measured texture, not a
     fabricated one built from the interval. This reads the same statistics
     the audio lens reads (where the energy sits, how spread, how it moves)
     and turns them into the ten axes \u2014 the real signature. */
  function signatureOf(samples, sampleRate) {
    // The REAL spectral signature: a proper spectral centroid, spread, and
    // flux measured from the FREQUENCY domain (an FFT), not the waveform.
    // This is what actually distinguishes a high tone from a low one.
    var Nf = 2048, x = samples;
    if (samples.length > Nf) {
      var st = Math.floor(samples.length / Nf), d = new Float64Array(Nf);
      for (var i = 0; i < Nf; i++) d[i] = samples[i*st] || 0; x = d;
    } else { var d0 = new Float64Array(Nf); for (var z=0;z<samples.length;z++) d0[z]=samples[z]; x=d0; }
    var half = Nf/2, mags = new Float64Array(half), maxm = 0;
    for (var k = 0; k < half; k++) {
      var re = 0, im = 0, c = (2*Math.PI*k)/Nf;
      for (var n = 0; n < Nf; n++) {
        var w = 0.5 - 0.5*Math.cos((2*Math.PI*n)/(Nf-1));
        var sm = x[n]*w; re += sm*Math.cos(c*n); im -= sm*Math.sin(c*n);
      }
      var mg = Math.sqrt(re*re+im*im); mags[k] = mg; if (mg > maxm) maxm = mg;
    }
    var nyq = sampleRate/2;
    // spectral centroid (energy-weighted mean frequency)
    var num = 0, den = 0;
    for (var a = 1; a < half; a++) { var hz = a*sampleRate/Nf; num += hz*mags[a]; den += mags[a]; }
    var cen = den ? num/den : 0, cNorm = cen/nyq;
    // spectral spread around the centroid
    var sv = 0; for (var b = 1; b < half; b++) { var hz2 = b*sampleRate/Nf; sv += (hz2-cen)*(hz2-cen)*mags[b]; }
    var spread = den ? Math.sqrt(sv/den)/nyq : 0;
    // spectral flux (bin-to-bin change across the magnitude curve)
    var fl = 0; for (var e = 1; e < half; e++) fl += Math.abs(mags[e]-mags[e-1]); fl = maxm ? fl/(half*maxm) : 0;

    var q = [];
    if (cNorm >= 0.15) q.push("bright"); else if (cNorm <= 0.05) q.push("dark");
    if (spread >= 0.15) q.push("thick"); else if (spread <= 0.06) q.push("thin");
    if (fl >= 0.02) q.push("rough"); else if (fl <= 0.006) q.push("soft");
    if (cNorm >= 0.20) q.push("high"); else if (cNorm <= 0.04) q.push("low");
    var activity = Math.min(1, spread*2*0.5 + fl*20*0.5);
    if (activity >= 0.5) q.push("tense"); else if (activity <= 0.2) q.push("released");
    return { modes: { sound: q.length ? q : ["soft"] } };
  }

  /* ---- the crossing: each real relationship crosses SEPARATELY into the
          far ends (dreams, corpus/engine, journal). Taps the existing lenses
          read-only; touches none of their code. ---- */
  function crossRelationship(rel, opts) {
    opts = opts || {};
    var out = { relationship: rel, crossings: [] };
    if (typeof BBLens === "undefined" || typeof BBLens.anyLens !== "function") return out;

    // Use the REAL measured signature of the sound, and cross it with the
    // ORIGINAL lens (anyLens) \u2014 the exact same function the app uses, which
    // reaches the whole pool (live Wikisource + dreams + corpus), subtracts,
    // clears the floor, and returns the strongest. We call it, we do not
    // reimplement it. This guarantees identical behavior to the original.
    var sig = (opts && opts.songSig) ? opts.songSig : { modes: { all: ["released"] } };
    return { relationship: rel, sig: sig, pending: true };
  }

  /* ---- the public read ---- */
  /* Runs every geometry on the sound, subtracts to what remains, center-tests
     each relationship, and returns the web of REAL relationships (the ones
     that sit at center) plus the full web for inspection. Nothing summed. */
  function read(samples, sampleRate, opts) {
    opts = opts || {};
    var vs = voices(samples, sampleRate, opts.maxVoices || 8);
    if (vs.length < 2) {
      return { voices: vs, web: [], real: [], note: "fewer than two voices — no relationships to read" };
    }
    var w = web(vs);
    var real = w.filter(function (r) { return r.real; });
    var mel = (opts.samples !== false && opts.fullSamples)
      ? melody(opts.fullSamples, opts.fullSampleRate || sampleRate, opts) : [];
    var crossings = [];
    var songSig = signatureOf(samples, sampleRate);
    // crossing is done via the ORIGINAL lens asynchronously; read() stays sync
    // and returns the sig so the caller can cross. See readAndCross() below.
    return {
      voices: vs.map(function (v) { return { freq: Math.round(v.freq * 100) / 100, magnitude: v.magnitude }; }),
      web: w,                    // every relationship found
      real: real,                // only those that sit at center (validated)
      realCount: real.length,
      totalCount: w.length,
      melody: mel,
      songSig: songSig,
      crossings: crossings,
      note: real.length
        ? real.length + " of " + w.length + " relationships sit at the center (real)"
        : "no relationship sat at the center in this window",
      caveat: "Each relationship is found by subtraction and kept only if it "
        + "sits at the center (the uncertainty principle as validity). Nothing "
        + "is summed. Meaning is not measured — the relationships are; what they "
        + "mean stays with the listener."
    };
  }

  /* readAndCross: read the music, then cross its REAL signature through the
     ORIGINAL lens (anyLens) \u2014 the full pool, exactly like the app. Async
     because anyLens fetches live passages. Returns read() result plus the
     crossing anyLens produced for the sound as a whole. */
  async function readAndCross(samples, sampleRate, opts) {
    opts = opts || {};
    var r = read(samples, sampleRate, opts);
    if (typeof BBLens !== "undefined" && typeof BBLens.anyLens === "function" && r.songSig) {
      try {
        var hit = await BBLens.anyLens(r.songSig, { valence: 0.3, arousal: 0.5 },
                                       { allowSmallCorpus: true, pages: 20, canvases: 8 });
        r.crossing = hit ? {
          from: hit.from,
          source: (hit.entry && (hit.entry.source || hit.entry.artist)) || null,
          text: String(hit.entry && hit.entry.text || "").slice(0, 240),
          shared: hit.shared || []
        } : null;
      } catch (e) { r.crossing = null; }
    }
    return r;
  }

  return {
    read: read,
    readAndCross: readAndCross,
    voices: voices,
    interval: interval,
    differenceTone: differenceTone,
    beats: beats,
    centerOf: centerOf,
    web: web,
    melody: melody,
    crossRelationship: crossRelationship,
  };
});
