/* bb-affect-null.js — a SEPARATE, read-only control for the crossing.
 *
 * It never touches the crossing. It reads the same corpus and the same
 * scorers the crossing already exposes (BBLens._textureScore,
 * BBLens._affectScore) and asks one question:
 *
 *   Do the texture matches differ from what MOOD ALONE would pick?
 *
 * If texture and affect pick the same passages, texture is just a proxy for
 * mood, and the crossings carry nothing beyond affect. If they pick different
 * passages, texture is carrying information beyond mood. That is the first
 * half of the claim that texture carries a situation, not just a feeling.
 *
 * This is the same discipline the interval lens already uses: a verdict is
 * only worth believing against a null. The crossing had no null. This is it.
 *
 * What it does NOT do: it does not judge whether the texture matches fit the
 * music's SITUATION. That is a semantic question and needs a blind human read.
 * This only separates texture from mood. It also changes no matching code.
 */
(function (g) {
  function idOf(e) { return e.id || e.cite || e.text; }

  function summarize(r) {
    return {
      source: r.e.source || r.e.artist || "",
      texture: Math.round(r.texture * 1000) / 1000,
      affect: Math.round(r.affect * 1000) / 1000,
      text: String(r.e.text || "").slice(0, 90),
    };
  }

  // sig  { modes: {...}, text }   the music's signature, as the crossing uses
  // aff  { valence, arousal }     the music's affect
  // opts { k, affectOf }          k = list size; affectOf = text->affect fn
  function compare(sig, aff, opts) {
    opts = opts || {};
    var k = opts.k || 8;
    var L = g.BBLens;
    if (!L || !L.corpus || !L._textureScore || !L._affectScore) return null;

    // the app's real text->affect function; the stored corpus affect is a
    // constant placeholder, so derive it from each passage's own words.
    var affectOf = opts.affectOf || (g.__bb && g.__bb.affectOf) || null;

    var rows = L.corpus.map(function (e) {
      var t = L._textureScore(sig, e);
      var eAff = affectOf ? affectOf(e.text || "") : (e.aff || { valence: 0, arousal: 0 });
      var a = L._affectScore(aff, { aff: eAff });
      return { e: e, texture: (t && t.score) || 0, affect: a };
    });

    var byTexture = rows.slice().sort(function (x, y) { return y.texture - x.texture; }).slice(0, k);
    var byAffect  = rows.slice().sort(function (x, y) { return y.affect - x.affect; }).slice(0, k);

    var tset = {};
    byTexture.forEach(function (r) { tset[idOf(r.e)] = true; });
    var shared = byAffect.filter(function (r) { return tset[idOf(r.e)]; }).length;
    var overlap = k ? shared / k : 0;

    return {
      k: k,
      overlap: Math.round(overlap * 1000) / 1000,       // 1 = texture just reproduces mood
      divergence: Math.round((1 - overlap) * 1000) / 1000,
      textureTop: byTexture.map(summarize),
      affectTop: byAffect.map(summarize),
      verdict: overlap >= 0.75
        ? "texture picks almost the same passages as mood alone — little beyond affect here"
        : overlap <= 0.25
          ? "texture picks different passages than mood alone — it carries information beyond affect"
          : "texture and mood overlap partway — some of the match is affect, some is beyond it",
      caveat: "Separates texture from mood only. It does NOT judge whether the "
        + "texture matches fit the music's situation; that needs a blind human read. "
        + "Affect is derived per passage with affectOf, since the corpus stores a placeholder.",
    };
  }

  g.BBAffectNull = { compare: compare };
})(typeof window !== "undefined" ? window : globalThis);
