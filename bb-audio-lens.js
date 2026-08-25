/**
 * BB AUDIO LENS — a measured sense, not a described one.
 * =====================================================
 *
 * NOT WIRED IN. Standalone, with its own tests.
 *
 *
 * ── THE QUESTION THIS ANSWERS ──────────────────────────────────────────
 *
 * Every sense in the corpus so far is a sense someone WROTE ABOUT. Van
 * Gogh's sight, Berlioz's hearing, Proust's smell — all of it arrives as
 * text and gets matched as text. That leaves one thing untested: does the
 * crossing work when a sense arrives as MEASUREMENT rather than as words?
 *
 * Sound is the one that can be measured in a browser with no libraries.
 * The Web Audio API's AnalyserNode gives a real FFT of anything playing.
 * From that spectrum, four features can be computed honestly:
 *
 *   centroid  — where the spectral energy sits. Bright vs dark.
 *   spread    — how wide the energy is. Thick vs thin.
 *   flux      — how fast the spectrum changes frame to frame. Rough vs smooth.
 *   activity  — onset density. Tense vs released.
 *
 * Those four map onto qualities ALREADY in the artist lens, derived from
 * the writers' own words. So a sound and a Van Gogh letter can reach each
 * other through the same vocabulary — not because anyone mapped frequency
 * to colour, but because "bright" is a word both a spectrum and a painter
 * can honestly produce.
 *
 *
 * ── WHAT THIS IS NOT ───────────────────────────────────────────────────
 *
 * This is analysis, not hearing. A centroid of 3 kHz means a sound is
 * bright. Nothing in the computation IS brightness to anything. The same
 * wall as the colour question, and it is not closed here.
 *
 * What it does close is narrower and real: sound stops being a thing
 * described in books and becomes a thing the system can take in directly.
 *
 *
 * ── WHY NOT FREQUENCY-TO-COLOUR ────────────────────────────────────────
 *
 * Still refused, for the same reason as before. Relating 400–790 THz light
 * to 20 Hz–20 kHz sound means choosing an octave shift, and the choice is
 * arbitrary. Newton, Scriabin and Messiaen all built one and all three
 * disagree. Brightness is a shared DESCRIPTION; it is not a shared
 * frequency, and pretending otherwise would be a confident claim grounded
 * in nothing.
 */

(function (global) {
  "use strict";

  /* ---- feature extraction ----------------------------------------------
     Pure functions over a spectrum array, so they can be tested without a
     browser. `bins` is magnitude per frequency bin, 0..255 as AnalyserNode
     produces, and sampleRate/fftSize give the frequency of each bin. */

  function binHz(i, sampleRate, fftSize) {
    return (i * sampleRate) / fftSize;
  }

  // Spectral centroid: the energy-weighted mean frequency. The standard
  // correlate of perceived brightness, and it is a measurement rather than
  // an interpretation.
  function centroid(bins, sampleRate, fftSize) {
    let num = 0, den = 0;
    for (let i = 0; i < bins.length; i++) {
      const m = bins[i];
      if (!m) continue;
      num += binHz(i, sampleRate, fftSize) * m;
      den += m;
    }
    return den ? num / den : 0;
  }

  // How widely energy is spread around the centroid. A pure tone is narrow;
  // a chord or noise is wide.
  function spread(bins, sampleRate, fftSize) {
    const c = centroid(bins, sampleRate, fftSize);
    let num = 0, den = 0;
    for (let i = 0; i < bins.length; i++) {
      const m = bins[i];
      if (!m) continue;
      const d = binHz(i, sampleRate, fftSize) - c;
      num += d * d * m;
      den += m;
    }
    return den ? Math.sqrt(num / den) : 0;
  }

  // How much the spectrum changed since the previous frame. Sustained
  // sound is low; percussive or shifting sound is high.
  function flux(bins, prev) {
    if (!prev || !prev.length) return 0;
    let sum = 0, n = Math.min(bins.length, prev.length);
    for (let i = 0; i < n; i++) {
      const d = bins[i] - prev[i];
      if (d > 0) sum += d;              // half-wave rectified, as is standard
    }
    return n ? sum / n : 0;
  }

  function energy(bins) {
    let s = 0;
    for (let i = 0; i < bins.length; i++) s += bins[i];
    return bins.length ? s / bins.length : 0;
  }

  /* Peak, not mean, decides whether there is sound at all.
     The first version gated on MEAN magnitude across every bin, and the
     tests caught it immediately: a loud pure tone puts energy in about
     eight bins out of a thousand, so its mean is around 1.6 and it read as
     silence. A sine wave at full volume was being treated as nothing.
     Peak magnitude is what actually distinguishes sound from no sound. */
  function peak(bins) {
    let p = 0;
    for (let i = 0; i < bins.length; i++) if (bins[i] > p) p = bins[i];
    return p;
  }

  /* ---- qualities -------------------------------------------------------
     The thresholds below are the weak point and they are stated as such.
     They come from the usual ranges for musical audio, NOT from anything
     measured on this system. Getting a threshold wrong by guessing has
     already happened twice in this project, so these should be treated as
     a starting point to be tuned against real material, not as facts.

     Everything is expressed as a fraction of Nyquist rather than in Hz, so
     the mapping survives a change of sample rate. */

  const T = {
    brightCentroid: 0.22,   // of Nyquist. above this reads bright
    darkCentroid:   0.08,   // below this reads dark
    thickSpread:    0.18,   // wide energy
    thinSpread:     0.06,   // narrow energy
    roughFlux:      6,      // fast spectral change
    smoothFlux:     1.5,    // sustained
    tenseActivity:  0.55,   // combined flux + spread, normalised
    quietPeak:      20,     // peak magnitude below this is silence (0..255)
  };

  /**
   * qualitiesOfSound(frame) — the same vocabulary the artist lens uses.
   *
   * frame = { bins: [..], prev: [..], sampleRate, fftSize }
   *
   * Returns an array like ["bright","thin","smooth"], which can go straight
   * into the lens as a `sound` texture.
   */
  function qualitiesOfSound(frame) {
    const bins = frame.bins || [];
    if (!bins.length) return [];
    const sr = frame.sampleRate || 48000;
    const fft = frame.fftSize || (bins.length * 2);
    const nyq = sr / 2;

    // Silence has no qualities. Saying otherwise would be inventing.
    if (peak(bins) < T.quietPeak) return [];

    const c = centroid(bins, sr, fft) / nyq;
    const s = spread(bins, sr, fft) / nyq;
    const f = flux(bins, frame.prev);

    const out = [];
    if (c >= T.brightCentroid) out.push("bright");
    else if (c <= T.darkCentroid) out.push("dark");

    if (s >= T.thickSpread) out.push("thick");
    else if (s <= T.thinSpread) out.push("thin");

    if (f >= T.roughFlux) out.push("rough");
    else if (f <= T.smoothFlux) out.push("soft");

    // Tension is a combination rather than a single axis: busy AND wide.
    const activity = Math.min(1, (f / 12) * 0.6 + s * 2 * 0.4);
    if (activity >= T.tenseActivity) out.push("tense");
    else if (activity <= 0.2) out.push("released");

    if (c >= 0.35) out.push("high");
    else if (c <= 0.05) out.push("low");

    return out;
  }

  /**
   * measure(frame) — the numbers as well as the words, so a wrong
   * threshold can be spotted rather than just producing a wrong label.
   */
  function measure(frame) {
    const bins = frame.bins || [];
    const sr = frame.sampleRate || 48000;
    const fft = frame.fftSize || (bins.length * 2);
    const nyq = sr / 2;
    return {
      energy: energy(bins),
      peak: peak(bins),
      centroidHz: centroid(bins, sr, fft),
      centroidNorm: centroid(bins, sr, fft) / nyq,
      spreadNorm: spread(bins, sr, fft) / nyq,
      flux: flux(bins, frame.prev),
      qualities: qualitiesOfSound(frame),
    };
  }

  /* ---- live capture ----------------------------------------------------
     Only runs in a browser. Everything above is pure and testable without
     one, which is deliberate: the maths should be checkable even where the
     audio is not. */

  function listen(mediaStreamOrElement, onFrame, opts) {
    opts = opts || {};
    if (typeof global.AudioContext === "undefined") {
      throw new Error("no Web Audio in this environment");
    }
    const ctx = new global.AudioContext();
    const src = mediaStreamOrElement instanceof global.MediaStream
      ? ctx.createMediaStreamSource(mediaStreamOrElement)
      : ctx.createMediaElementSource(mediaStreamOrElement);
    const an = ctx.createAnalyser();
    an.fftSize = opts.fftSize || 2048;
    an.smoothingTimeConstant = 0.6;
    src.connect(an);
    // Pass audio through so listening does not silence playback.
    if (!(mediaStreamOrElement instanceof global.MediaStream)) an.connect(ctx.destination);

    const bins = new Uint8Array(an.frequencyBinCount);
    let prev = null;
    let running = true;

    function tick() {
      if (!running) return;
      an.getByteFrequencyData(bins);
      const frame = { bins: Array.from(bins), prev: prev,
                      sampleRate: ctx.sampleRate, fftSize: an.fftSize };
      onFrame(measure(frame));
      prev = Array.from(bins);
      global.requestAnimationFrame(tick);
    }
    tick();

    return { stop: function () { running = false; try { ctx.close(); } catch (e) {} } };
  }

  /* ---- analysing a recording -------------------------------------------

     The loop this completes: a public-domain recording plays, its spectrum
     is measured, the measured qualities go into the artist lens, and it
     finds the passage that shares them. Sound arriving as sound rather
     than as somebody's description of it.

     Deliberately muted by default. The point is measurement, and a track
     starting unbidden at 2am is not what anyone wants.

     CORS matters: the audio must be served with permissive headers or the
     analyser reads silence. archive.org does; most sites do not. A failure
     is reported rather than returning a confident empty answer, because a
     silent read looks exactly like a quiet piece.
  */
  function analyseUrl(url, opts) {
    opts = opts || {};
    const seconds = opts.seconds || 12;
    return new Promise(function (resolve, reject) {
      if (typeof global.AudioContext === "undefined" || typeof global.Audio === "undefined") {
        return reject(new Error("no Web Audio in this environment"));
      }
      const el = new global.Audio();
      el.crossOrigin = "anonymous";      // required, or the analyser reads zeros
      el.src = url;
      el.muted = opts.audible !== true;
      el.preload = "auto";

      let ctx, an, src, timer, raf;
      const frames = [];
      let prev = null;

      function cleanup() {
        try { if (raf) global.cancelAnimationFrame(raf); } catch (e) {}
        try { if (timer) clearTimeout(timer); } catch (e) {}
        try { el.pause(); } catch (e) {}
        try { if (ctx) ctx.close(); } catch (e) {}
      }

      el.onerror = function () { cleanup(); reject(new Error("could not load audio: " + url)); };

      el.oncanplay = function () {
        try {
          ctx = new global.AudioContext();
          src = ctx.createMediaElementSource(el);
          an = ctx.createAnalyser();
          an.fftSize = opts.fftSize || 2048;
          an.smoothingTimeConstant = 0.5;
          src.connect(an);
          if (opts.audible === true) an.connect(ctx.destination);
        } catch (e) { cleanup(); return reject(e); }

        const bins = new Uint8Array(an.frequencyBinCount);
        function tick() {
          an.getByteFrequencyData(bins);
          const arr = Array.from(bins);
          const m = measure({ bins: arr, prev: prev, sampleRate: ctx.sampleRate, fftSize: an.fftSize });
          if (m.qualities.length) frames.push(m);
          prev = arr;
          raf = global.requestAnimationFrame(tick);
        }

        el.play().then(function () {
          tick();
          timer = setTimeout(function () {
            cleanup();
            if (!frames.length) {
              // Almost always CORS. Saying "quiet piece" here would be a lie.
              return reject(new Error("read only silence \u2014 the audio is probably "
                + "not CORS-accessible, so the analyser saw zeros"));
            }
            resolve(summarise(frames));
          }, seconds * 1000);
        }).catch(function (e) { cleanup(); reject(e); });
      };
    });
  }

  /* One frame is about 16ms and says nothing. What holds across the passage
     is the piece. Same 40% rule the voice texture uses. */
  function summarise(frames) {
    const count = Object.create(null);
    frames.forEach(function (f) {
      f.qualities.forEach(function (q) { count[q] = (count[q] || 0) + 1; });
    });
    const need = frames.length * 0.4;
    const qualities = Object.keys(count).filter(function (q) { return count[q] >= need; });
    const avg = function (k) {
      return frames.reduce(function (a, f) { return a + (f[k] || 0); }, 0) / frames.length;
    };
    return {
      frames: frames.length,
      qualities: qualities,
      centroidHz: Math.round(avg("centroidHz")),
      centroidNorm: avg("centroidNorm"),
      spreadNorm: avg("spreadNorm"),
      flux: avg("flux"),
    };
  }

  /* LISTENING TO WHATEVER IS PLAYING.

     A file input can only reach files. But the lens does not care where
     sound comes from \u2014 it measures a spectrum. Chrome can hand over the
     audio of another tab if the person grants it, so YouTube, a streaming
     service, anything at all becomes measurable.

     Two things this is NOT: it does not record, and nothing is uploaded.
     The stream goes to an AnalyserNode and the only thing kept is four
     numbers per frame. There is no path from here to a copy of the audio,
     which also means no copyright question \u2014 measuring is not copying.

     The person must pick the tab and tick "share tab audio" themselves.
     Browsers require that gesture and it is the right requirement. */
  function listenToTab(onFrame, opts) {
    opts = opts || {};
    if (!global.navigator || !global.navigator.mediaDevices
        || !global.navigator.mediaDevices.getDisplayMedia) {
      return Promise.reject(new Error("this browser cannot capture tab audio"));
    }
    return global.navigator.mediaDevices
      .getDisplayMedia({ video: true, audio: true })
      .then(function (stream) {
        const tracks = stream.getAudioTracks();
        if (!tracks.length) {
          stream.getTracks().forEach(function (t) { t.stop(); });
          throw new Error("no audio was shared \u2014 tick \u2018share tab audio\u2019 when choosing the tab");
        }
        // Video is only requested because Chrome will not offer the audio
        // checkbox without it. It is stopped immediately.
        stream.getVideoTracks().forEach(function (t) { t.stop(); });

        const audioOnly = new global.MediaStream(tracks);
        const handle = listen(audioOnly, onFrame, opts);
        return {
          stop: function () {
            try { handle.stop(); } catch (e) {}
            tracks.forEach(function (t) { try { t.stop(); } catch (e) {} });
          },
        };
      });
  }

  /* RELATIVE TO THE TRACK, NOT TO A NUMBER I CHOSE.

     qualitiesOfSound labels each frame against fixed thresholds, and real
     music sits in the middle of them. A whole song came back as three axes
     \u2014 bright, soft, released \u2014 because thick/thin and high/low never
     tripped. Three axes out of ten is a thin carrier, and it was thin
     because of the numbers, not because of the music.

     Fourth time an absolute threshold has failed on this project. Same fix
     as the rarity floor and the canvas measurements: a passage is bright
     if it is bright FOR THIS TRACK. Every axis then has a chance to speak,
     and what it says is about the material rather than about me.

     Pass the raw frames and get back what actually held across them. */
  function qualitiesOfTrack(frames) {
    if (!frames || frames.length < 8) return [];
    const col = function (f) {
      return frames.map(f).filter(function (v) { return typeof v === "number" && !isNaN(v); })
        .sort(function (a, b) { return a - b; });
    };
    const at = function (arr, p) {
      return arr.length ? arr[Math.floor((arr.length - 1) * p)] : 0;
    };
    const cent = col(function (m) { return m.centroidNorm; });
    const spr  = col(function (m) { return m.spreadNorm; });
    const flx  = col(function (m) { return m.flux; });
    if (!cent.length) return [];

    // A third at each end. The middle of a track is not a quality.
    const b = { cLo: at(cent, 0.33), cHi: at(cent, 0.67),
                sLo: at(spr, 0.33),  sHi: at(spr, 0.67),
                fLo: at(flx, 0.33),  fHi: at(flx, 0.67) };

    /* An axis with no spread has nothing to say. Relative labelling means
       even a flat track has a marginally brighter third, and a steady quiet
       piece came back bright, high and rough on noise alone. If the range
       between the thirds is negligible, the axis stays silent. */
    const flat = function (lo, hi, scale) { return (hi - lo) < scale; };
    const mute = { c: flat(b.cLo, b.cHi, 0.02),
                   s: flat(b.sLo, b.sHi, 0.02),
                   f: flat(b.fLo, b.fHi, 0.5) };

    const count = Object.create(null);
    frames.forEach(function (m) {
      const push = function (q) { count[q] = (count[q] || 0) + 1; };
      if (!mute.c) {
        if (m.centroidNorm >= b.cHi) { push("bright"); push("high"); }
        else if (m.centroidNorm <= b.cLo) { push("dark"); push("low"); }
      }
      if (!mute.s) {
        if (m.spreadNorm >= b.sHi) push("thick");
        else if (m.spreadNorm <= b.sLo) push("thin");
      }
      if (!mute.f) {
        if (m.flux >= b.fHi) { push("rough"); push("tense"); }
        else if (m.flux <= b.fLo) { push("soft"); push("released"); }
      }
    });

    /* Held across a third of the track, and only one side of each pair. A
       track cannot be both bright and dark \u2014 measuring relative to itself
       means both ends trip, so the side that held longer wins and the
       other is dropped. A tie means neither: the track has nothing to say
       on that axis. */
    const need = frames.length * 0.33;
    const held = Object.keys(count).filter(function (q) { return count[q] >= need; });
    const pairs = [["bright","dark"], ["thick","thin"], ["rough","soft"],
                   ["tense","released"], ["high","low"]];
    const out = held.slice();
    pairs.forEach(function (pr) {
      const a = out.indexOf(pr[0]), b = out.indexOf(pr[1]);
      if (a === -1 || b === -1) return;
      const ca = count[pr[0]], cb = count[pr[1]];
      const loser = ca === cb ? null : (ca > cb ? pr[1] : pr[0]);
      if (loser === null) {                       // a tie says nothing
        out.splice(out.indexOf(pr[1]), 1);
        out.splice(out.indexOf(pr[0]), 1);
      } else {
        out.splice(out.indexOf(loser), 1);
      }
    });
    return out;
  }

  global.BBAudio = {
    analyseUrl: analyseUrl,
    summarise: summarise,
    qualitiesOfSound: qualitiesOfSound,
    measure: measure,
    listen: listen,
    listenToTab: listenToTab,
    qualitiesOfTrack: qualitiesOfTrack,
    THRESHOLDS: T,
    _centroid: centroid,
    _spread: spread,
    _flux: flux,
    _energy: energy,
    _peak: peak,
  };
})(typeof window !== "undefined" ? window : globalThis);
