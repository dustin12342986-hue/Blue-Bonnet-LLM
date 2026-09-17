/* bb-audio-structure-lens.js
 * ---------------------------------------------------------------------------
 * A SEPARATE lens. Does not touch any existing Blue Bonnet code.
 *
 * Purpose: decode a sound down to its real DSP structure (spectral features
 * + a simplified MFCC-style timbre fingerprint + chroma), quantize those
 * continuous numbers into discrete per-mode labels, and emit a signature in
 * the EXACT shape sensoryOf() produces: { modes: { modeName: [labels] }, count }.
 *
 * That signature drops straight into the app's existing sensoryMatch(a, b)
 * with NO change to the scoring math:
 *     score += 0.4 + 0.6 * jaccard(perMode)   averaged over shared modes.
 *
 * Nothing here computes a score itself. It only produces the signature.
 * You feed two of these into your existing sensoryMatch().
 * ---------------------------------------------------------------------------
 */
(function (root) {
  "use strict";

  // ---- small DSP helpers (no external libraries) ----

  // Real-input FFT (Cooley-Tukey, power-of-two). Returns magnitude spectrum.
  function fftMag(samples) {
    let n = 1;
    while (n < samples.length) n <<= 1;              // next power of two
    const re = new Float64Array(n), im = new Float64Array(n);
    for (let i = 0; i < samples.length; i++) re[i] = samples[i];
    // bit reversal
    for (let i = 1, j = 0; i < n; i++) {
      let bit = n >> 1;
      for (; j & bit; bit >>= 1) j ^= bit;
      j ^= bit;
      if (i < j) { const tr = re[i]; re[i] = re[j]; re[j] = tr;
                   const ti = im[i]; im[i] = im[j]; im[j] = ti; }
    }
    for (let len = 2; len <= n; len <<= 1) {
      const ang = -2 * Math.PI / len;
      const wr = Math.cos(ang), wi = Math.sin(ang);
      for (let i = 0; i < n; i += len) {
        let cwr = 1, cwi = 0;
        for (let k = 0; k < len / 2; k++) {
          const a = i + k, b = i + k + len / 2;
          const tr = re[b] * cwr - im[b] * cwi;
          const ti = re[b] * cwi + im[b] * cwr;
          re[b] = re[a] - tr; im[b] = im[a] - ti;
          re[a] += tr; im[a] += ti;
          const ncwr = cwr * wr - cwi * wi;
          cwi = cwr * wi + cwi * wr; cwr = ncwr;
        }
      }
    }
    const half = n >> 1;
    const mag = new Float64Array(half);
    for (let i = 0; i < half; i++) mag[i] = Math.hypot(re[i], im[i]);
    return mag;
  }

  function hann(samples) {
    const N = samples.length, out = new Float64Array(N);
    for (let i = 0; i < N; i++) out[i] = samples[i] * (0.5 - 0.5 * Math.cos(2 * Math.PI * i / (N - 1)));
    return out;
  }

  // ---- feature extraction from a magnitude spectrum ----

  function spectralCentroid(mag, sampleRate, fftSize) {
    let num = 0, den = 0;
    for (let k = 1; k < mag.length; k++) {
      const hz = k * sampleRate / fftSize;
      num += hz * mag[k]; den += mag[k];
    }
    return den ? num / den : 0;                       // Hz
  }

  function spectralSpread(mag, sampleRate, fftSize, centroid) {
    let num = 0, den = 0;
    for (let k = 1; k < mag.length; k++) {
      const hz = k * sampleRate / fftSize;
      num += (hz - centroid) * (hz - centroid) * mag[k]; den += mag[k];
    }
    return den ? Math.sqrt(num / den) : 0;            // Hz
  }

  function spectralFlux(mag, prevMag) {
    if (!prevMag) return 0;
    let flux = 0;
    const n = Math.min(mag.length, prevMag.length);
    for (let k = 0; k < n; k++) {
      const d = mag[k] - prevMag[k];
      if (d > 0) flux += d * d;
    }
    return Math.sqrt(flux);
  }

  function spectralRolloff(mag, sampleRate, fftSize, pct) {
    let total = 0; for (let k = 0; k < mag.length; k++) total += mag[k];
    const target = total * (pct || 0.85);
    let acc = 0;
    for (let k = 0; k < mag.length; k++) {
      acc += mag[k];
      if (acc >= target) return k * sampleRate / fftSize;
    }
    return 0;
  }

  function zeroCrossingRate(samples) {
    let z = 0;
    for (let i = 1; i < samples.length; i++)
      if ((samples[i - 1] < 0 && samples[i] >= 0) || (samples[i - 1] >= 0 && samples[i] < 0)) z++;
    return z / samples.length;
  }

  // Simplified mel-band energies (a coarse MFCC-style timbre fingerprint).
  // Not full MFCCs (no DCT), but real mel-band energy distribution.
  function melBands(mag, sampleRate, fftSize, nBands) {
    nBands = nBands || 8;
    const hzToMel = (hz) => 2595 * Math.log10(1 + hz / 700);
    const melToHz = (m) => 700 * (Math.pow(10, m / 2595) - 1);
    const maxMel = hzToMel(sampleRate / 2);
    const bands = new Float64Array(nBands);
    const edges = [];
    for (let i = 0; i <= nBands; i++) edges.push(melToHz(maxMel * i / nBands));
    for (let k = 0; k < mag.length; k++) {
      const hz = k * sampleRate / fftSize;
      for (let b = 0; b < nBands; b++) {
        if (hz >= edges[b] && hz < edges[b + 1]) { bands[b] += mag[k]; break; }
      }
    }
    const tot = bands.reduce((a, x) => a + x, 0) || 1;
    for (let b = 0; b < nBands; b++) bands[b] /= tot;   // normalized distribution
    return bands;
  }

  // Chroma: fold spectrum onto 12 pitch classes.
  function chroma(mag, sampleRate, fftSize) {
    const c = new Float64Array(12);
    for (let k = 1; k < mag.length; k++) {
      const hz = k * sampleRate / fftSize;
      if (hz < 20) continue;
      const midi = 69 + 12 * Math.log2(hz / 440);
      const pc = ((Math.round(midi) % 12) + 12) % 12;
      c[pc] += mag[k];
    }
    const tot = c.reduce((a, x) => a + x, 0) || 1;
    for (let i = 0; i < 12; i++) c[i] /= tot;
    return c;
  }

  // ---- quantize continuous features into discrete per-mode LABELS ----
  // These labels are what jaccard/sensoryMatch will intersect. Bucketing
  // turns real numbers into the discrete tokens the existing math needs.

  function bucket(value, edges, names) {
    for (let i = 0; i < edges.length; i++) if (value < edges[i]) return names[i];
    return names[names.length - 1];
  }

  /* PUBLIC: analyse raw samples -> signature in sensoryOf() shape.
     samples: Float32Array/Array of PCM in [-1,1]
     sampleRate: e.g. 44100
     Produces { modes: { brightness:[...], width:[...], texture:[...],
                         timbre:[...], harmony:[...] }, count } */
  function signatureOf(samples, sampleRate) {
    sampleRate = sampleRate || 44100;
    // frame the signal; average features across frames for stability
    const FRAME = 2048, HOP = 1024;
    const nyq = sampleRate / 2;
    let prevMag = null;
    const acc = { centroid: [], spread: [], flux: [], rolloff: [], zcr: [] };
    const melAcc = null; let melSum = null, chromaSum = new Float64Array(12), frames = 0;

    for (let start = 0; start + FRAME <= samples.length; start += HOP) {
      const frame = hann(samples.slice(start, start + FRAME));
      const mag = fftMag(frame);
      const cen = spectralCentroid(mag, sampleRate, FRAME);
      acc.centroid.push(cen);
      acc.spread.push(spectralSpread(mag, sampleRate, FRAME, cen));
      acc.flux.push(spectralFlux(mag, prevMag));
      acc.rolloff.push(spectralRolloff(mag, sampleRate, FRAME, 0.85));
      acc.zcr.push(zeroCrossingRate(samples.slice(start, start + FRAME)));
      const mel = melBands(mag, sampleRate, FRAME, 8);
      if (!melSum) melSum = new Float64Array(8);
      for (let b = 0; b < 8; b++) melSum[b] += mel[b];
      const ch = chroma(mag, sampleRate, FRAME);
      for (let i = 0; i < 12; i++) chromaSum[i] += ch[i];
      prevMag = mag; frames++;
    }
    if (!frames) return { modes: {}, count: 0 };

    const mean = (a) => a.reduce((s, x) => s + x, 0) / a.length;
    const centroid = mean(acc.centroid);
    const spread   = mean(acc.spread);
    const flux     = mean(acc.flux);
    const rolloff  = mean(acc.rolloff);
    const zcr      = mean(acc.zcr);
    const mel = Array.from(melSum, (x) => x / frames);
    const chr = Array.from(chromaSum, (x) => x / frames);

    const modes = {};
    let count = 0;
    const add = (mode, label) => { (modes[mode] = modes[mode] || []).push(label); count++; };

    // brightness (spectral centroid, normalized 0..1 of nyquist)
    const cN = centroid / nyq;
    add("brightness", bucket(cN, [0.06, 0.15, 0.30], ["dark", "warm", "bright", "brilliant"]));

    // width (spectral spread)
    const sN = spread / nyq;
    add("width", bucket(sN, [0.08, 0.16, 0.28], ["thin", "focused", "thick", "wide"]));

    // texture (flux + zcr -> smooth vs rough)
    const rough = Math.min(1, flux / (Math.max(...acc.flux) || 1) * 0.5 + zcr * 20 * 0.5);
    add("texture", bucket(rough, [0.2, 0.45, 0.7], ["soft", "smooth", "grainy", "rough"]));

    // rolloff band (how high the energy reaches)
    add("air", bucket(rolloff / nyq, [0.2, 0.4, 0.6], ["low", "mid", "high", "airy"]));

    // timbre: the mel-band distribution -> label the 2-3 strongest bands.
    // This is the "shape" fingerprint; two sounds sharing strong bands share timbre.
    const melRanked = mel.map((v, i) => [v, i]).sort((a, b) => b[0] - a[0]);
    for (let r = 0; r < 3; r++) add("timbre", "mel" + melRanked[r][1]);

    // harmony: strongest pitch classes (chroma) -> label top 3.
    const chrRanked = chr.map((v, i) => [v, i]).sort((a, b) => b[0] - a[0]);
    const PC = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
    for (let r = 0; r < 3; r++) add("harmony", "pc" + PC[chrRanked[r][1]]);

    return { modes: modes, count: count, _raw: { centroid, spread, flux, rolloff, zcr, mel, chroma: chr } };
  }

  /* Capture from a MediaStream (mic or tab) for `seconds`, then analyse.
     Returns a Promise of the signature. Browser only. */
  function listen(stream, seconds) {
    seconds = seconds || 4;
    return new Promise(function (resolve, reject) {
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const src = ctx.createMediaStreamSource(stream);
        const proc = ctx.createScriptProcessor(4096, 1, 1);
        const need = Math.floor(ctx.sampleRate * seconds);
        const buf = [];
        src.connect(proc); proc.connect(ctx.destination);
        proc.onaudioprocess = function (e) {
          const ch = e.inputBuffer.getChannelData(0);
          for (let i = 0; i < ch.length; i++) buf.push(ch[i]);
          if (buf.length >= need) {
            proc.disconnect(); src.disconnect();
            try { ctx.close(); } catch (x) {}
            stream.getTracks().forEach(function (t) { t.stop(); });
            resolve(signatureOf(Float32Array.from(buf.slice(0, need)), ctx.sampleRate));
          }
        };
      } catch (err) { reject(err); }
    });
  }

  /* Analyse an audio File/Blob. Returns a Promise of the signature. */
  function analyseFile(file) {
    return new Promise(function (resolve, reject) {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const r = new FileReader();
      r.onload = function () {
        ctx.decodeAudioData(r.result, function (audio) {
          const data = audio.getChannelData(0);
          resolve(signatureOf(data, audio.sampleRate));
        }, reject);
      };
      r.onerror = reject;
      r.readAsArrayBuffer(file);
    });
  }

  var BUILD = "2026-09-10-understanding4";
  root.BBAudioStructure = {
    BUILD: BUILD,
    signatureOf: signatureOf,   // (Float32Array, sampleRate) -> sensoryOf-shaped signature
    listen: listen,             // (MediaStream, seconds) -> Promise<signature>
    analyseFile: analyseFile,   // (File) -> Promise<signature>
    // raw feature extractors, exposed for testing / other uses:
    _fftMag: fftMag,
    _features: { spectralCentroid, spectralSpread, spectralFlux, spectralRolloff, zeroCrossingRate, melBands, chroma },
  };
})(typeof self !== "undefined" ? self : this);
