/* bb-intervals.js — THE INTERVAL LENS
 *
 * A separate lens. It shares nothing with the texture lens except a decoded
 * audio waveform. It touches bb-artist-lens.js and every other file ZERO
 * times. If it is wrong or breaks, the texture instrument does not notice.
 *
 * The texture lens reads a signal's REGISTER (low, dark, soft...).
 * This lens reads a signal's FREQUENCY PEAKS and the RATIOS between them,
 * and reports which musical intervals those ratios land nearest.
 *
 * It measures ratios. It does not measure meaning. It answers one honest,
 * falsifiable question: do the dominant frequencies in this signal cluster
 * on small-integer (musical) ratios more than random chance?
 *
 * THE HONEST BOUNDARY, kept in the output:
 *   - The universe does not emit in the 12-note scale. Peaks fall where
 *     physics puts them, mostly between our notes. Charting them on a staff
 *     means ROUNDING to the nearest pitch — a choice we impose. Reported as
 *     nearestPitch ± cents, never hidden.
 *   - Finding musical ratios does NOT mean a signal "makes music." Resonant
 *     systems settle into small-integer ratios; music uses them because our
 *     ears favor them. Both draw from the same well (vibrating-system math).
 *     The intervals are real; the notation and the meaning are ours.
 *
 * The null is wired in from the start. A signal is only called "musical" if
 * its ratios cluster tighter than a random-frequency null over the same
 * band. Orbital-resonance data should beat the null; white noise should not.
 */

(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.BBIntervals = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  /* Just-intonation intervals within an octave, as ratios. These are the
     small-integer ratios physical resonance and human music both favor. */
  const JUST = [
    { name: "unison",        ratio: 1 / 1 },
    { name: "minor second",  ratio: 16 / 15 },
    { name: "major second",  ratio: 9 / 8 },
    { name: "minor third",   ratio: 6 / 5 },
    { name: "major third",   ratio: 5 / 4 },
    { name: "perfect fourth", ratio: 4 / 3 },
    { name: "tritone",       ratio: 45 / 32 },
    { name: "perfect fifth", ratio: 3 / 2 },
    { name: "minor sixth",   ratio: 8 / 5 },
    { name: "major sixth",   ratio: 5 / 3 },
    { name: "minor seventh", ratio: 9 / 5 },
    { name: "major seventh", ratio: 15 / 8 },
    { name: "octave",        ratio: 2 / 1 },
  ];

  const PITCHES = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
  const A4 = 440;

  function cents(r) { return 1200 * Math.log2(r); }

  /* Fold a ratio into a single octave, 1..2, so 3:1 reads as 3:2 an octave
     up. Interval identity lives within the octave. */
  function foldToOctave(r) {
    let x = r;
    while (x >= 2) x /= 2;
    while (x < 1) x *= 2;
    return x;
  }

  /* Nearest just interval to a folded ratio, with the error in cents. */
  function nearestInterval(r) {
    const folded = foldToOctave(r);
    let best = null;
    JUST.forEach(function (iv) {
      const off = Math.abs(cents(folded) - cents(iv.ratio));
      if (!best || off < best.centsOff) best = { name: iv.name, ratio: iv.ratio, centsOff: off };
    });
    return best;
  }

  /* Nearest equal-tempered pitch to a frequency, with cents offset. */
  function nearestPitch(freq) {
    if (freq <= 0) return { pitch: null, octave: null, centsOff: 0 };
    const semis = 12 * Math.log2(freq / A4);          // relative to A4
    const nearest = Math.round(semis);
    const off = (semis - nearest) * 100;              // cents
    // A4 is MIDI 69; map to pitch class + octave
    const midi = 69 + nearest;
    const pc = ((midi % 12) + 12) % 12;
    const oct = Math.floor(midi / 12) - 1;
    return { pitch: PITCHES[pc], octave: oct, centsOff: Math.round(off) };
  }

  /* -------- spectrum -------- */

  /* Naive DFT magnitude over a window. Fine for finding a handful of dominant
     peaks in a short signal; no external FFT dependency, keeps the lens
     self-contained. For long signals, downsample first (done in read()). */
  function magnitudeSpectrum(x, sampleRate) {
    const N = x.length;
    const half = Math.floor(N / 2);
    const mag = new Float64Array(half);
    // Hann window to reduce leakage.
    const w = new Float64Array(N);
    for (let n = 0; n < N; n++) w[n] = 0.5 - 0.5 * Math.cos((2 * Math.PI * n) / (N - 1));
    for (let k = 0; k < half; k++) {
      let re = 0, im = 0;
      const c = (2 * Math.PI * k) / N;
      for (let n = 0; n < N; n++) {
        const s = x[n] * w[n];
        re += s * Math.cos(c * n);
        im -= s * Math.sin(c * n);
      }
      mag[k] = Math.sqrt(re * re + im * im);
    }
    return { mag: mag, binHz: sampleRate / N };
  }

  /* Prominence-thresholded local maxima → the dominant peaks. */
  function findPeaks(mag, binHz, maxPeaks) {
    const peaks = [];
    let mean = 0;
    for (let i = 0; i < mag.length; i++) mean += mag[i];
    mean /= mag.length || 1;
    const floor = mean * 2.0;                          // noise floor
    for (let i = 2; i < mag.length - 2; i++) {
      if (mag[i] > floor &&
          mag[i] > mag[i - 1] && mag[i] > mag[i + 1] &&
          mag[i] >= mag[i - 2] && mag[i] >= mag[i + 2]) {
        peaks.push({ freq: i * binHz, magnitude: mag[i] });
      }
    }
    peaks.sort(function (a, b) { return b.magnitude - a.magnitude; });
    return peaks.slice(0, maxPeaks || 6);
  }

  /* -------- ratios -------- */

  function ratiosOf(peaks) {
    const sorted = peaks.slice().sort(function (a, b) { return a.freq - b.freq; });
    const out = [];
    for (let i = 0; i < sorted.length; i++) {
      for (let j = i + 1; j < sorted.length; j++) {
        const lo = sorted[i].freq, hi = sorted[j].freq;
        if (lo <= 0) continue;
        const r = hi / lo;
        const iv = nearestInterval(r);
        out.push({ a: hi, b: lo, ratio: r, nearestInterval: iv.name,
                   centsOff: Math.round(iv.centsOff) });
      }
    }
    return out;
  }

  /* -------- the musicality score, with the null baked in -------- */

  /* How tightly a set of ratios sits on just intervals: mean absolute cents
     error, turned into a 0..1 where tighter = higher. */
  function tightness(ratios) {
    if (!ratios.length) return 0;
    let sum = 0;
    ratios.forEach(function (r) { sum += Math.abs(r.centsOff); });
    const meanOff = sum / ratios.length;
    // 0 cents off -> 1.0 ; 50 cents off (a quartertone, maximally ambiguous) -> 0
    return Math.max(0, 1 - meanOff / 50);
  }

  /* THE NULL. Draw the same number of peaks at random frequencies over the
     same band, many times, and see how tightly THOSE sit on just intervals
     by chance. The real signal is only "musical" insofar as it beats this. */
  function nullTightness(peaks, trials) {
    const freqs = peaks.map(function (p) { return p.freq; });
    const lo = Math.min.apply(null, freqs);
    const hi = Math.max.apply(null, freqs);
    const n = peaks.length;
    let sum = 0;
    const T = trials || 400;
    for (let t = 0; t < T; t++) {
      const rp = [];
      for (let i = 0; i < n; i++) rp.push({ freq: lo + Math.random() * (hi - lo) });
      sum += tightness(ratiosOf(rp));
    }
    return sum / T;
  }

  /* -------- the public read -------- */

  /**
   * read(samples, sampleRate, opts) -> {
   *   peaks, ratios, musicality, beatsNull, staff, note
   * }
   * Pure function of the samples. Returns numbers only. No text crossing,
   * no meaning, no interpretation. Never called by the texture pipeline.
   */
  function read(samples, sampleRate, opts) {
    opts = opts || {};
    const maxPeaks = opts.maxPeaks || 6;

    // Downsample long signals to a workable window for the naive DFT.
    const target = opts.window || 4096;
    let x = samples, sr = sampleRate;
    if (samples.length > target) {
      const step = Math.floor(samples.length / target);
      const ds = new Float64Array(target);
      for (let i = 0; i < target; i++) ds[i] = samples[i * step] || 0;
      x = ds;
      sr = sampleRate / step;
    }

    const spec = magnitudeSpectrum(x, sr);
    const peaks = findPeaks(spec.mag, spec.binHz, maxPeaks);

    if (peaks.length < 2) {
      return { peaks: peaks, ratios: [], musicality: 0, beatsNull: 0,
               staff: peaks.map(function (p) {
                 const np = nearestPitch(p.freq);
                 return { freq: p.freq, nearestPitch: np.pitch, octave: np.octave,
                          centsOff: np.centsOff };
               }),
               note: "fewer than two peaks — no ratios to read" };
    }

    const ratios = ratiosOf(peaks);
    const real = tightness(ratios);
    const nul = nullTightness(peaks, opts.nullTrials || 400);
    // musicality: how far the real signal beats the random null, 0..1
    const beatsNull = Math.max(0, real - nul);
    const musicality = Math.max(0, Math.min(1, beatsNull / Math.max(0.001, 1 - nul)));

    const staff = peaks.slice().sort(function (a, b) { return a.freq - b.freq; })
      .map(function (p) {
        const np = nearestPitch(p.freq);
        return { freq: Math.round(p.freq * 100) / 100,
                 nearestPitch: np.pitch, octave: np.octave, centsOff: np.centsOff };
      });

    return {
      peaks: peaks.map(function (p) {
        return { freq: Math.round(p.freq * 100) / 100, magnitude: p.magnitude };
      }),
      ratios: ratios,
      real: Math.round(real * 1000) / 1000,
      nullBaseline: Math.round(nul * 1000) / 1000,
      beatsNull: Math.round(beatsNull * 1000) / 1000,
      musicality: Math.round(musicality * 1000) / 1000,
      staff: staff,
      note: musicality > 0.15
        ? "ratios cluster on musical intervals TIGHTER than a random null"
        : "ratios do NOT beat a random null — not musical beyond chance",
      caveat: "Frequencies are rounded to nearest pitch (± cents shown). "
        + "Musical ratios reflect shared resonance math, not intention or design."
    };
  }

  /* -------- live: its OWN capture, touching nothing -------- */

  /* listen(onReading, opts) opens its OWN microphone stream, gathers a
     window of samples, runs read(), and calls onReading with the result.
     Repeats until stop() is called. It shares no state with the audio lens
     or the app \u2014 its own getUserMedia, its own AudioContext, its own buffer.
     If it fails, nothing else notices. */
  function listen(onReading, opts) {
    opts = opts || {};
    if (typeof navigator === "undefined" || !navigator.mediaDevices) {
      throw new Error("no microphone in this environment");
    }
    const windowSec = opts.windowSec || 3;      // seconds per reading
    let ctx, source, proc, stream, buf = [], stopped = false;

    navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false }
    }).then(function (s) {
      if (stopped) { s.getTracks().forEach(function (t) { t.stop(); }); return; }
      stream = s;
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      source = ctx.createMediaStreamSource(stream);
      proc = ctx.createScriptProcessor(4096, 1, 1);
      const need = Math.floor(ctx.sampleRate * windowSec);
      source.connect(proc);
      proc.connect(ctx.destination);
      proc.onaudioprocess = function (e) {
        if (stopped) return;
        const chunk = e.inputBuffer.getChannelData(0);
        for (let i = 0; i < chunk.length; i++) buf.push(chunk[i]);
        if (buf.length >= need) {
          const samples = Float64Array.from(buf.slice(0, need));
          buf = [];
          try { onReading(read(samples, ctx.sampleRate, opts)); } catch (err) {}
        }
      };
    }).catch(function (err) {
      try { onReading({ error: String(err && err.message || err) }); } catch (e) {}
    });

    return {
      stop: function () {
        stopped = true;
        try { if (proc) proc.disconnect(); } catch (e) {}
        try { if (source) source.disconnect(); } catch (e) {}
        try { if (ctx) ctx.close(); } catch (e) {}
        try { if (stream) stream.getTracks().forEach(function (t) { t.stop(); }); } catch (e) {}
      }
    };
  }

  /* listenToTab(onReading, opts) is the same as listen() but captures a
     browser TAB's audio instead of the microphone \u2014 its own
     getDisplayMedia, its own context, sharing nothing. Play a signal in
     another tab (a song, a cosmic-signal wav on a page) and read its
     intervals directly, no mic, no room noise. */
  function listenToTab(onReading, opts) {
    opts = opts || {};
    if (typeof navigator === "undefined" || !navigator.mediaDevices
        || !navigator.mediaDevices.getDisplayMedia) {
      throw new Error("tab capture not available in this environment");
    }
    const windowSec = opts.windowSec || 3;
    let ctx, source, proc, stream, buf = [], stopped = false;

    navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
      .then(function (s) {
        if (stopped) { s.getTracks().forEach(function (t) { t.stop(); }); return; }
        // drop the video track; keep only the tab's audio
        s.getVideoTracks().forEach(function (t) { t.stop(); });
        const audio = new MediaStream(s.getAudioTracks());
        if (!audio.getAudioTracks().length) {
          try { onReading({ error: "no tab audio \u2014 tick 'share tab audio'" }); } catch (e) {}
          return;
        }
        stream = s;
        ctx = new (window.AudioContext || window.webkitAudioContext)();
        source = ctx.createMediaStreamSource(audio);
        proc = ctx.createScriptProcessor(4096, 1, 1);
        const need = Math.floor(ctx.sampleRate * windowSec);
        source.connect(proc);
        proc.connect(ctx.destination);
        proc.onaudioprocess = function (e) {
          if (stopped) return;
          const chunk = e.inputBuffer.getChannelData(0);
          for (let i = 0; i < chunk.length; i++) buf.push(chunk[i]);
          if (buf.length >= need) {
            const samples = Float64Array.from(buf.slice(0, need));
            buf = [];
            try { onReading(read(samples, ctx.sampleRate, opts)); } catch (err) {}
          }
        };
      }).catch(function (err) {
        try { onReading({ error: String(err && err.message || err) }); } catch (e) {}
      });

    return {
      stop: function () {
        stopped = true;
        try { if (proc) proc.disconnect(); } catch (e) {}
        try { if (source) source.disconnect(); } catch (e) {}
        try { if (ctx) ctx.close(); } catch (e) {}
        try { if (stream) stream.getTracks().forEach(function (t) { t.stop(); }); } catch (e) {}
      }
    };
  }

  return {
    read: read,
    listen: listen,
    listenToTab: listenToTab,
    nearestInterval: nearestInterval,
    nearestPitch: nearestPitch,
    JUST: JUST,
  };
});
