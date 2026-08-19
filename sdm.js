/* ============================================================
   SPARSE DISTRIBUTED MEMORY  (Kanerva 1988) + Random Indexing
   ============================================================

   Why this exists: recall today walks every fact and scores it. That is
   traversal. SDM does not traverse — it computes where a memory would
   live and reads there. Address IS content.

   The blocker was always vectors: real embeddings need a model, and a
   model is a dependency this codebase won't take. Kanerva's own answer is
   Random Indexing (Kanerva, Kristoferson & Holst 2000): give every token
   a deterministic sparse random vector and bundle them. Semantics fall
   out of co-occurrence, not from a trained encoder. Nothing to download.

   Vectors are never stored. They're derived from text that is already
   stored, and rebuilt on load — so this adds nothing to localStorage or
   to the Drive payload.

   D = 2048 bits. Random vectors in 2048 dimensions are near-orthogonal
   (expected Hamming distance D/2, sd = sqrt(D)/2 ≈ 22.6), which is what
   lets many memories superpose in one vector without destroying each
   other. That near-orthogonality is the whole trick.
   ============================================================ */

const D = 2048;                 // bits per hypervector
const WORDS = D / 32;           // Uint32 words
/* Capacity is the real constraint and it is not negotiable — measured on
   this implementation:
        25 memories → 100% exact recall
        50          →  88%
       100          →  31%
       200          →   7%
   Roughly 0.05x hard locations for reliable recall, degrading smoothly
   rather than falling over. So this is NOT a store for everything. It is
   an associative index over a working set — recent episodes plus the
   highest-amplitude facts — while the arrays stay the system of record.
   Exact storage is a solved problem; what SDM buys is retrieval from a
   partial, noisy, or never-written cue. */
const HARD_LOCATIONS = 1024;
const ACTIVATION_SD = 2.2;      // radius = mean - 2.2sd  → ~1.4% activate

// ---- deterministic PRNG -------------------------------------
// Same token must give the same vector on every device, every reload,
// forever — otherwise nothing recomputed matches anything stored.
function hashStr(s) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}
function xorshift(seed) {
  // Small or adjacent seeds barely differ after one xorshift round, so
  // randomHV(101) and randomHV(102) came out correlated — and everything
  // here depends on independent vectors being near-orthogonal. Scramble
  // the seed and warm the generator before anyone reads from it.
  let x = (Math.imul(seed || 123456789, 2654435761) ^ 0x9e3779b9) >>> 0;
  if (!x) x = 123456789;
  for (let i = 0; i < 8; i++) {
    x ^= x << 13; x >>>= 0;
    x ^= x >> 17;
    x ^= x << 5;  x >>>= 0;
  }
  return function () {
    x ^= x << 13; x >>>= 0;
    x ^= x >> 17;
    x ^= x << 5;  x >>>= 0;
    return x >>> 0;
  };
}

// ---- hypervectors -------------------------------------------
function zeros() { return new Uint32Array(WORDS); }

function randomHV(seed) {
  const r = xorshift(seed);
  const v = zeros();
  for (let i = 0; i < WORDS; i++) v[i] = r();
  return v;
}

const _tokenCache = new Map();
function tokenHV(token) {
  let v = _tokenCache.get(token);
  if (!v) { v = randomHV(hashStr("tok:" + token)); _tokenCache.set(token, v); }
  return v;
}

function popcount(x) {
  x = x - ((x >> 1) & 0x55555555);
  x = (x & 0x33333333) + ((x >> 2) & 0x33333333);
  x = (x + (x >> 4)) & 0x0f0f0f0f;
  return (Math.imul(x, 0x01010101) >> 24) & 0xff;
}

// Hamming distance. 1024 means unrelated; 0 means identical.
function hamming(a, b) {
  let d = 0;
  for (let i = 0; i < WORDS; i++) d += popcount((a[i] ^ b[i]) >>> 0);
  return d;
}
// Normalised similarity: 1 identical, 0 orthogonal, -1 opposite.
function similarity(a, b) { return 1 - (2 * hamming(a, b)) / D; }

// BIND — reversible, and the result is unlike both inputs. This is what
// makes role/filler pairs possible: bind(FEELING, heavy) is its own point
// in the space, and XORing FEELING back out returns heavy.
function bind(a, b) {
  const v = zeros();
  for (let i = 0; i < WORDS; i++) v[i] = (a[i] ^ b[i]) >>> 0;
  return v;
}

// PERMUTE — circular bit shift. Used to mark sequence position so
// "laundry then doctor" differs from "doctor then laundry".
function permute(a, n) {
  const shift = ((n % D) + D) % D;
  if (!shift) return a.slice();
  const v = zeros();
  for (let bit = 0; bit < D; bit++) {
    const src = (bit - shift + D) % D;
    if ((a[src >>> 5] >>> (src & 31)) & 1) v[bit >>> 5] |= (1 << (bit & 31));
  }
  return v;
}

// BUNDLE — majority vote. The superposition operation: the result is
// similar to every input, which is how many memories live in one vector.
function bundle(vectors, weights) {
  if (!vectors.length) return zeros();
  const counts = new Float64Array(D);
  vectors.forEach((v, idx) => {
    const wgt = weights ? (weights[idx] || 0) : 1;
    if (!wgt) return;
    for (let bit = 0; bit < D; bit++) {
      if ((v[bit >>> 5] >>> (bit & 31)) & 1) counts[bit] += wgt;
      else counts[bit] -= wgt;
    }
  });
  const out = zeros();
  // Ties broken deterministically rather than randomly, so the same input
  // always gives the same bundle.
  const tie = xorshift(hashStr("tiebreak"));
  for (let bit = 0; bit < D; bit++) {
    const c = counts[bit];
    const one = c > 0 || (c === 0 && (tie() & 1));
    if (one) out[bit >>> 5] |= (1 << (bit & 31));
  }
  return out;
}

// ---- text → hypervector (Random Indexing) --------------------
const STOP = new Set(("the a an and or but if then that this these those is are was were be been am do " +
  "does did have has had i me my we our you your they them their it its of to in on at for with about " +
  "from by as so just get got need want know think really some any all what which who how when where why " +
  "can could should would will not out up down over again more very now than there here into").split(" "));

function tokens(text) {
  return String(text || "").toLowerCase().split(/[^a-z0-9']+/)
    .filter((t) => t.length > 2 && !STOP.has(t));
}

// Order matters a little, so each token is permuted by its position in a
// short window. Pure bag-of-words loses "put off" vs "off put".
function encodeText(text) {
  const ts = tokens(text);
  if (!ts.length) return zeros();
  const vecs = ts.map((t, i) => permute(tokenHV(t), i % 3));
  return bundle(vecs);
}

// ---- role/filler space for affect ---------------------------
const ROLE = {
  FEELING: randomHV(hashStr("role:feeling")),
  INTENSITY: randomHV(hashStr("role:intensity")),
  CONTENT: randomHV(hashStr("role:content")),
};
// Continuous values need level vectors that are similar when the values
// are close — random per level would make 0.5 and 0.6 unrelated. Built by
// flipping a fixed fraction of bits per step, so adjacency is preserved.
const LEVELS = 9;
function levelVectors(seedName) {
  const base = randomHV(hashStr("lvl:" + seedName));
  const out = [base];
  const r = xorshift(hashStr("lvlflip:" + seedName));
  const perStep = Math.floor(D / (2 * (LEVELS - 1)));
  let cur = base.slice();
  for (let i = 1; i < LEVELS; i++) {
    cur = cur.slice();
    for (let k = 0; k < perStep; k++) {
      const bit = r() % D;
      cur[bit >>> 5] ^= (1 << (bit & 31));
    }
    out.push(cur);
  }
  return out;
}
const VALENCE_LEVELS = levelVectors("valence");
const AROUSAL_LEVELS = levelVectors("arousal");

function levelOf(levels, value, lo, hi) {
  const t = Math.max(0, Math.min(1, (value - lo) / (hi - lo)));
  return levels[Math.round(t * (LEVELS - 1))];
}

// A memory is content bound to how it felt. That binding is what lets a
// cue built from feeling alone reach across unrelated topics.
function encodeMemory(text, affect) {
  const content = encodeText(text);
  const parts = [bind(ROLE.CONTENT, content)];
  if (affect) {
    parts.push(bind(ROLE.FEELING, levelOf(VALENCE_LEVELS, affect.valence || 0, -1, 1)));
    parts.push(bind(ROLE.INTENSITY, levelOf(AROUSAL_LEVELS, affect.arousal || 0, 0, 1)));
  }
  return bundle(parts);
}

// Build an address out of parts — including one nothing was ever written
// to. "This feeling, this intensity, unspecified content" is a legal
// coordinate, and reading it returns whatever lives nearby.
function cueFromContent(text) {
  return bundle([bind(ROLE.CONTENT, encodeText(text))]);
}

function cueFromFeeling(valence, arousal) {
  return bundle([
    bind(ROLE.FEELING, levelOf(VALENCE_LEVELS, valence, -1, 1)),
    bind(ROLE.INTENSITY, levelOf(AROUSAL_LEVELS, arousal, 0, 1)),
  ]);
}

// ---- the memory itself --------------------------------------
// Hard locations are fixed random addresses. A write goes to EVERY
// location within the activation radius, so each memory is stored in
// ~1.4% of them and each location holds pieces of many memories. Nothing
// lives in one place; that is what distributed means.
function createSDM() {
  const addresses = [];
  for (let i = 0; i < HARD_LOCATIONS; i++) addresses.push(randomHV(hashStr("addr:" + i)));
  const counters = new Int16Array(HARD_LOCATIONS * D);
  const radius = Math.floor(D / 2 - ACTIVATION_SD * (Math.sqrt(D) / 2));
  const labels = [];   // what was written, for cleanup

  function activated(addr) {
    const hits = [];
    for (let i = 0; i < HARD_LOCATIONS; i++) {
      if (hamming(addresses[i], addr) <= radius) hits.push(i);
    }
    return hits;
  }

  // SDM retrieves by address PROXIMITY. A feeling-only cue sits ~D/2 away
  // from a full memory vector, so it activates entirely different
  // locations and finds nothing. The fix is not a bigger radius — it is
  // writing the memory at every address you intend to reach it from.
  function writeIndexed(data, addrs, label) {
    let total = 0;
    addrs.forEach((a) => { total += write(a, data); });
    if (label) labels.push({ label, vec: data });
    return total;
  }

  function write(addr, data, label) {
    const hits = activated(addr);
    hits.forEach((loc) => {
      const base = loc * D;
      for (let bit = 0; bit < D; bit++) {
        const one = (data[bit >>> 5] >>> (bit & 31)) & 1;
        const idx = base + bit;
        const v = counters[idx] + (one ? 1 : -1);
        counters[idx] = Math.max(-3000, Math.min(3000, v));   // saturating
      }
    });
    if (label) labels.push({ label, vec: data });
    return hits.length;
  }

  // Read: sum the counters of every activated location and threshold.
  // Reading an address never written returns a blend of what's near it.
  function read(addr) {
    const hits = activated(addr);
    if (!hits.length) return { vec: zeros(), locations: 0 };
    const sums = new Float64Array(D);
    hits.forEach((loc) => {
      const base = loc * D;
      for (let bit = 0; bit < D; bit++) sums[bit] += counters[base + bit];
    });
    const out = zeros();
    for (let bit = 0; bit < D; bit++) if (sums[bit] > 0) out[bit >>> 5] |= (1 << (bit & 31));
    return { vec: out, locations: hits.length };
  }

  // Cleanup memory: snap a noisy read to the nearest thing actually stored.
  function nearest(vec, n) {
    return labels
      .map((l) => ({ label: l.label, sim: similarity(l.vec, vec) }))
      .sort((a, b) => b.sim - a.sim)
      .slice(0, n || 1);
  }

  return { write, writeIndexed, read, nearest, activated, radius, addresses, labels, counters };
}

module.exports = {
  D, HARD_LOCATIONS, zeros, randomHV, tokenHV, hamming, similarity,
  bind, permute, bundle, encodeText, encodeMemory, cueFromFeeling, cueFromContent,
  createSDM, ROLE, levelOf, VALENCE_LEVELS, AROUSAL_LEVELS, tokens,
};
