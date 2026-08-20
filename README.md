# Blue Bonnet

A single-file assistant that remembers, for people whose brains don't work the
way software assumes they do.

Live: https://dustin12342986-hue.github.io/Blue-Bonnet/

---

## What it is

One HTML file. No build step, no dependencies, no server of its own. It runs
in a browser, stores everything in `localStorage`, and mirrors to Google Drive
if you connect it. Open the file and it works.

It is built for ADHD, dyslexic and autistic users — people who are handed
tools designed around sustained attention, tidy filing and reliable recall,
and then blamed when those tools don't fit.

## What it is trying to achieve

Most assistants are confidently wrong about people. They forget what you told
them, then state conclusions about your life as if they knew.

Blue Bonnet is built on the opposite instinct: **know more, claim less.**

It holds a great deal about the person using it, and it is structurally
prevented from handing down verdicts. That restraint is not a setting. It is
the reason the project exists.

### The hard boundary

Blue Bonnet does not tell people what their relationships mean, what their
mental health is, or what they should do about either. It reflects, it asks,
it holds what it doesn't understand. It does not conclude.

This is not negotiable and it is not a feature to be balanced against others.
Every suggestion to soften it has been declined.

---

## How the memory works

Six ideas, layered.

### 1. Compress late
Verbatim first. Conversations are kept as they were said, and only distilled
when storage genuinely runs out. Summarising early is cheap and throws away
the exact words — which turn out to be the load-bearing part.

### 2. Evidence-bounded inference
Every idea carries an amplitude. An idea's amplitude is **capped by** the
strength of the facts supporting it, and **decays with** them. Nothing can be
held more firmly than the record justifies. When the evidence fades, the idea
fades with it — automatically, without anyone deciding to forget.

### 3. Affect-weighted, topic-penalised recombination
When idle, Blue Bonnet pairs two memories: it anchors on whatever carried the
most emotional charge, then looks for another moment that **feels similar but
is about something else**. Topical overlap is subtracted, not added.

This is the inversion. Every retrieval system in production rewards
similarity. Similar-feeling / different-subject is where non-obvious
connections live.

### 4. Sensory signature
Valence and arousal are two dials, and two dials can't say *why* two moments
feel alike. Episodes also carry texture: sight, sound, touch, smell, taste —
and **barrier**, a sixth category for the structural feature that kept
recurring: something between the person and what they were reaching for.
Window, glass, boards, screen, across, behind.

Read only from words actually present. An absent sense scores zero, never
negative — nobody is penalised for not describing things. Texture can
strengthen a pairing; it can never create one.

### 5. Entangled pings
An inference from a dream survives only if it quotes words that are verifiably
in the transcript. After that its amplitude is coupled to the facts behind it,
and it releases itself when they fade. Grounding is checked in code, not
requested in a prompt.

### 6. Questions — held, not understood
A third state between confident and silent. Blue Bonnet can hold something it
has noticed and does not understand. It never volunteers these. They surface
only if the person raises that subject themselves, and they are resolved only
by the person's own answer.

### And then: learned rules
A pattern that is grounded, coupled, and reinforced past threshold stops being
an observation and becomes a **rule** — an instruction that changes how Blue
Bonnet answers. Applied silently. Never announced. Retired when the reality
behind it fades.

This is learning at the system level: behaviour changes from experience,
through rules nobody wrote. It is **not** the model learning — the underlying
LLM's weights are untouched. Both halves of that sentence matter.

---

## Where this sits against existing work

**Prior art, and it must be cited:**

| Work | What it established |
|---|---|
| Park et al. 2023, *Generative Agents* (arXiv:2304.03442) | Memory stream, reflection, importance-weighted retrieval |
| Emotional RAG (arXiv:2410.23041) | Emotion-aware retrieval beats semantic-only |
| Kanerva 1988, *Sparse Distributed Memory* | Content-addressable memory at high dimension |
| Koestler 1964 | Bisociation — insight at the intersection of unrelated frames |
| Mednick 1962 | Remote associates; creativity as distant connection |
| Damasio 1994 | Somatic markers — emotion as a tag on experience |
| Russell 1980 | Valence/arousal circumplex |
| Ebbinghaus 1885 | Forgetting curves |

**What does not appear in that literature:**

1. **Compress-late storage** — verbatim held until space forces distillation
2. **Evidence-bounded inference** — strength capped by and decaying with support
3. **Anti-similar retrieval** — affect matched while topic is *penalised*
4. **Held-not-understood** — a question state resolvable only by the person

Item 3 is the sharp one. Prior work combines emotion *with* semantics. None of
it subtracts semantic similarity.

---

## The paper

**Title:** *Different Subject, Same Feeling: Anti-Similar Retrieval for
Surfacing Self-Insight*

**Claim:** Retrieval optimised for *novelty of connection* is a different task
from retrieval optimised for *relevance*, and requires the opposite operation
on topical similarity.

**Method:** score candidate memories as

```
score = affect_similarity + λ_s · sensory_match − λ_t · topical_overlap
```

Sweep λ_t from negative (conventional — reward similarity) through zero
(affect-only) to positive (anti-similar). The sweep is the paper.

**Baseline that matters:** affect + semantic similarity, i.e. Emotional RAG.
Beating vanilla RAG proves nothing; that comparison is already won in the
literature.

**Metric:** novelty, not relevance. The question put to participants is *"had
you already noticed this?"* — because a connection you'd already made is
worthless however apt it is.

**The failure rate to report honestly:** the proportion of surfaced
connections that are novel but *meaningless*. Anti-similar retrieval will
produce these. Hiding the rate would be the fastest way to lose the paper.

**Venue:** CHI or CSCW workshop.

### The prediction for a lab

If affective-sensory signature is what enables remote association, then:

> Two events with matched valence and arousal but **mismatched sensory
> texture** will prime more weakly than texture-matched pairs.

A reaction-time study. No neuroimaging required. Falsifiable, cheap, and
runnable in a semester by someone who is not me.

---

## Measured result: capacity of the SDM index

The beta branch implements Kanerva's Sparse Distributed Memory over 2048-bit
hypervectors with Random Indexing — no embedding model, no dependency, vectors
derived from the stored text itself.

Recall accuracy against number of items stored, measured:

| Items stored | Recall |
|---:|---:|
| 25 | 100% |
| 50 | 88% |
| 100 | 31% |
| 200 | 7% |

```
100% |████████████████████  25
 88% |█████████████████     50
 31% |██████                100
  7% |█                     200
     +----------------------------
```

This is the interference curve, and it is the finding. Superposed storage does
not lose one item at a time — past a threshold, everything degrades at once.

**Consequence for the design:** SDM is an *index over a working set*, not a
store. Blue Bonnet keeps the durable record in plain structured storage and
uses SDM to find which parts of it to activate. That is the right role for it,
and the measurement is what established that.

---

## Open direction: branch allocation by signature

Catastrophic forgetting happens because all knowledge shares one set of
weights. Training on B moves the same numbers that encoded A.

Progressive Neural Networks (2016) grow a frozen column per task with dense
lateral connections. It works, and it doesn't scale: growth is unbounded and
the task boundaries are drawn by hand.

**The proposal:** decide allocation from the material rather than by hand.
Branch when a new experience's affective-sensory signature is distant from
every existing branch. Form a **sparse lateral** — a connection, not a merge —
where affect and texture co-occur across otherwise unrelated branches. Nothing
is overwritten; a path is formed.

**Experiment:** small networks, a task sequence, three conditions —
always-merge (the baseline failure), always-branch (Progressive Nets,
unbounded), signature-based. Measure retention against parameter count.
Runs on a laptop or a few dollars of rented GPU.

**What would be proven:** that an allocation criterion derived from the
material beats hand-drawn task boundaries. Not that catastrophic forgetting is
solved — merged branches still overwrite. This is a better decision about when
to accept the cost, not a way around it.

**What remains open:** growth bounds; whether laterals pass activations only
(safe, frozen) or gradients (powerful, damaging); retrieval at scale across a
thousand branches; and the deep one — learning *inside* a branch is still
gradient descent on shared weights. This partitions the problem. It does not
dissolve it.

---

## Files

| File | What it is |
|---|---|
| `index.html` | The app. Everything above, in one file. |
| `beta-index.html` | SDM branch. Rename to `index.html` in the beta repo. |
| `sdm.js` | Sparse Distributed Memory + Random Indexing module |
| `blue-bonnet-kit.js` | Failover routing, attachments, feedback |
| `blue-bonnet-gateway.js` | Cloudflare gateway (Groq/Gemini), streaming |
| `blue-bonnet-app-worker.js` | App proxy worker, streaming |
| `cloudflare-worker.js` | Adulting's proxy |
| `test-*.mjs` | 16 suites |
| `BLUE-BONNET-HANDOFF.md` | Full architecture notes |
| `DEPLOY.md` | Deployment steps |
| `BETA-TESTER-GUIDE.md` | Plain-language guide for testers |
| `BLUE-BONNET-LLM-BETA.md` | Beta science and roadmap |

## Tests

```
memory 24 · episodes 12 · seam 17 · chats 18 · stream 15
brain-first 15 · gateway 16 · ping 15 · dreams 15 · idle-dream 20
questions 20 · time 16 · sensory 16 · rules 17 · sdm 19
```

Beta integration: 12/15 — ranking past the first result is wrong in the
integrated build while correct in the standalone module. Not yet isolated.
Known, open, and written down rather than quietly passed.

---

## A note on what this is not

Blue Bonnet does not train a model. There is no training code in it. It
selects what an existing LLM sees, checks what comes back against the record,
and changes its own behaviour based on patterns that hold. That is a real
feedback loop and it is not the same as training. Anyone describing this
project — to a lawyer, a reviewer, or a user — should keep that line clean.
The honest version is strong enough.
