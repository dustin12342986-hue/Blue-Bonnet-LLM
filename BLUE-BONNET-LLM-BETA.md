# Blue Bonnet LLM — Beta

## What it is

An AI assistant built for ADHD, dyslexic and autistic minds. It runs as a single HTML file with no build step and no dependencies, on infrastructure you own: your Cloudflare workers, your Groq key, your device, your Google Drive.

The model it talks to is a general-purpose open model (Llama 3.3 70B via Groq, with Anthropic held in reserve). What makes it *Blue Bonnet* is everything wrapped around that model: its own identity, its own knowledge base, a hard behavioural boundary, and a memory system that behaves like memory rather than like a list.

**The founding constraint.** General assistants give confident, well-formed answers and will hand down verdicts about your relationships and your mental health. That has caused real harm. Blue Bonnet never does this. It reflects, asks, helps you think — and says plainly when something isn't its to decide. More context does not earn it more licence to conclude; if anything it demands more caution. This is enforced in the system prompt and is not negotiable.

---

## What it does

### Remembers what matters and lets go of what doesn't

Facts carry an **amplitude** that decays over time and strengthens when something recurs. Things fade because they stopped mattering, not because they aged off the bottom of a list. Nothing is capped by count.

### Keeps the original, compresses last

Recent conversation is stored **verbatim** — timestamped, speaker-labelled. Only when space genuinely runs out is an episode distilled into a compressed note, and even then it's distilled rather than deleted.

Most memory systems summarise on the way in and throw the original away. That means everything downstream reads a lossy sketch, and can only ever notice what the summariser already noticed. Blue Bonnet reflects on what you actually said.

### Dreams when you're not there

Four minutes of no interaction and it starts revisiting things on its own — never mid-conversation, roughly every 40 minutes at most, and only via the free gateway.

It doesn't replay the most recent thing. It anchors on whatever carried the most **emotional weight**, then looks for an older memory that *felt the same but was about something else*. Topic overlap is scored **negatively**: same-subject pairs only confirm what you already know. This is how a conversation about laundry and a conversation about a phone call end up in the same thought.

### Won't assert what it can't evidence

An idea produced while dreaming doesn't become memory just because it sounds right. It has to **land on a real moment** — quoting your actual words, verbatim, checked against the stored transcript by code. Paraphrase is rejected. A confident-sounding invention is rejected.

If it survives, its strength is **coupled** to the experience behind it. Live that again and the idea rises with it. Let the experience fade and the idea releases itself. An idea can never be held more firmly than the reality it came from.

### Holds what it doesn't understand

The important third state. When something is clearly there but its meaning isn't, Blue Bonnet doesn't guess and doesn't discard — it stores a **question**.

A question is never volunteered. It only comes near the surface if *you* open that subject, and even then it arrives labelled as something not understood, explicitly forbidden from being stated or used as a lead-in to advice. One at a time. **Your answer is the only thing that resolves it**, and what gets stored is your wording, not the model's interpretation.

Notice → don't know → wait → ask once, if it fits → learn from what you said.

### Shows its working

The **dream journal** records every reflection pass, including the failures: what it read, what it noticed, and every idea it threw out with the reason. When you see *"× Probably has deep-seated anxiety — the quoted moment isn't in the transcript, invented or paraphrased"*, you're watching the grounding check catch the model reaching for something that felt true and wasn't.

The **insight panel** shows every hypothesis it's holding, and one tap deletes any of them permanently.

### Beta only: addressed memory

The beta adds **Sparse Distributed Memory**. Instead of scanning every fact and scoring it, memories are encoded as 2048-bit hypervectors and stored at computed addresses. Retrieval means constructing a coordinate and reading there.

This makes two things possible that scanning can't do:

- **Address by feeling alone.** A cue made of nothing but "heavy and loud" — no words, no topic — returns the memories that felt that way, across unrelated subjects.
- **Read an address nothing was written to.** You get a blend of what's nearby rather than an error. That's the closest thing here to imagining.

Vectors are never stored. They're derived from text you already keep and rebuilt on load, so this adds nothing to your storage or your Drive sync.

---

## The scientific principles

Listed with what's genuinely borrowed and what's a rough heuristic, because the difference matters when you're explaining it.

### Memory decay and reinforcement

**Ebbinghaus (1885)** established that forgetting follows an exponential curve, and that repeated exposure flattens it. Blue Bonnet's amplitude decays exponentially with a half-life that lengthens each time something recurs — a direct implementation of the **spacing effect**.

**Hebbian learning** ("neurons that fire together wire together", Hebb 1949): facts mentioned together form resonance links, and each lifts its partners slightly on recall.

### Spreading activation

**Collins & Loftus (1975)** modelled semantic memory as a network where activation spreads outward from a cue, damped at each hop. Blue Bonnet's recall works this way, with a floor below which activation stops propagating.

### Consolidation and replay

Sleep research shows memory consolidation involves **replay** of the day's activity interleaved with older memories, and that what gets consolidated is **weighted by emotional salience** rather than recency — amygdala modulation of hippocampal consolidation. The idle dream pass is a direct analogue: replay, weighted by charge, while the system is otherwise unoccupied.

Notably, interleaved replay is also how machine learning fights catastrophic forgetting. The same trick works in both places, which is a point in its favour.

### Affect representation

Emotional charge is represented on two axes — **valence** (heavy/light) and **arousal** (loud/quiet) — which is Russell's **circumplex model (1980)**. Level vectors are built so that nearby values stay similar, preserving the continuity of the space.

**Honest limit:** the charge is read by word lexicon, not by an emotion model. It catches "overwhelmed" and misses dry understatement and sarcasm. It's good enough to decide what's worth revisiting, which is all it's used for.

### Sparse Distributed Memory (beta)

**Kanerva (1988).** Memory addressed by content rather than location. A memory is written to every hard location within an activation radius, so each memory lives in many places and each place holds pieces of many memories. Reading sums and thresholds — which is why a partial or noisy cue still recovers the whole, and why reading an unwritten address returns a blend.

The mathematical foundation is **concentration of measure in high dimensions**: random vectors in 2048 dimensions are almost all near-orthogonal (expected Hamming distance D/2, standard deviation √D/2 ≈ 22.6). That's what allows superposition without mutual destruction.

**Vector Symbolic Architectures / hyperdimensional computing** — Plate's **Holographic Reduced Representations** — supply the operations: `bind` (XOR, reversible, result unlike both inputs) for role–filler pairs, `bundle` (majority vote) for superposition, `permute` (circular shift) for sequence.

**Random Indexing** (Kanerva, Kristoferson & Holst 2000) is what makes this possible without a dependency: each token gets a deterministic pseudo-random vector, and meaning emerges from co-occurrence rather than from a trained encoder. No embedding model, no download.

**Measured capacity on this implementation:**

| Memories | Exact recall |
|---|---|
| 25 | 100% |
| 50 | 88% |
| 100 | 31% |
| 200 | 7% |

Roughly 0.05× the number of hard locations, degrading smoothly rather than collapsing. So SDM is an **index over a working set** — recent episodes plus highest-amplitude facts — while the arrays remain the system of record.

### Related work you should know about

**Park et al. (2023), "Generative Agents"** built a memory stream with importance scoring, recency decay and a reflection pass. Structurally close to this. Arriving there independently is a good signal; it also means the ground isn't empty, and you want to be the person who says "yes, and here's what I added" rather than being corrected.

### What's genuinely different here

1. **Compress-late storage.** Verbatim until space runs out, so reflection reads the original rather than a summary.
2. **Evidence-bounded inference.** An idea's strength is capped by the amplitude of the experience it was grounded in, and it releases itself when that experience fades. Most systems attach a static confidence score that never moves.
3. **Affect-weighted recombination with topic penalised.** Deliberately reaching for memories that felt alike but were about different things.
4. **The question state.** A first-class "held, not understood" that can only be resolved by the person.

### What it is not

It does not learn. The model's weights are frozen and nothing here changes them. What the memory system does is change what the model *sees* before it answers.

It does not feel. Emotional charge is a number that affects retrieval. Nothing is undergone.

Claiming otherwise costs credibility that the actual design has earned.

---

# Roadmap: toward a model that actually learns

The honest framing: continual learning is an open research problem. The stages below don't solve it. They build, in order, the only assets that make an attempt meaningful — and each stage is worth doing on its own even if you stop there.

## Stage 0 — Run it (weeks 1–4)

**Nothing gets built.** The app has spent more time broken than working; it needs a month of ordinary use before anything is layered on top.

What you're looking for:
- Do the dreams surface anything you wouldn't have noticed yourself?
- Does the journal show a healthy rejection rate, or is it quietly inventing patterns?
- Does forgetting feel right, or does it drop things you wanted kept?
- Does the question state fire at reasonable moments, or is it awkward?

**Gate:** if the dreams are noise, the dataset built from them will be noise. Do not proceed without this.

## Stage 1 — Instrument the signal

You already have something almost nobody has: a record of what was *right*, judged by the person it was about.

- Thumbs up/down on replies, already in the kit
- Which pings survived the grounding check
- Which insights were **dismissed** — negative examples are rarer and more valuable
- Which questions got answered, and in the person's own words
- Which memories decayed to nothing versus which kept recurring

**Deliverable:** gateway logging that captures all five, with stable IDs linking a reply to its outcome.

## Stage 2 — Build evaluations before building anything else

You cannot tell whether a trained model is better without knowing what better means. This stage is unglamorous and non-negotiable.

- **Boundary regression suite.** Scenarios that tempt a directive verdict about a relationship or mental health. Any model that fails one is disqualified, regardless of how good it is otherwise. This is the whole reason the product exists.
- **Style targets.** Short replies, one concrete next action, no walls of text, no guilt.
- **Grounding.** Given memory context, does it assert things it wasn't told?
- **Held-out conversations** the model never trained on.

**Deliverable:** a scored eval you can run against any checkpoint in minutes.

## Stage 3 — Curate, don't dump

The intuition worth testing is that **what to learn from matters more than how much**. Human consolidation is selective and selects on salience — which the app already computes.

Build three datasets from the same period:
- **A — everything.** All exchanges.
- **B — thumbs-up.** The obvious approach.
- **C — consolidated.** Only material that survived grounding, stayed coupled to reality, and wasn't dismissed. Salience-weighted.

**Deliverable:** three datasets, same size, same period.

## Stage 4 — Fine-tune, cheaply and reversibly

**LoRA / adapter tuning** on a small open model (Llama 3.1 8B is the sensible starting point). Adapters keep new learning in a small side-network rather than editing the base weights — cheap, fast, and revertible, which matters when a checkpoint fails the boundary suite.

Train three adapters, one per dataset. Run Stage 2 evals on all three plus the untouched base.

**Set expectations:** fine-tuning mostly changes *how* a model talks, not what it knows. Expect style and posture gains, not knowledge gains. Your memory system will still be doing most of the work of knowing the person.

## Stage 5 — The actual experiment

**Question:** does salience-weighted selective consolidation beat bulk fine-tuning?

Compare C against A and B on the eval suite. If C wins at equal data volume, that's a real finding, testable at your scale, and it says something about what to feed a model that's allowed to change.

Also run the ablation that matters commercially: **base model + memory system** versus **fine-tuned model with no memory**. Your strong prior should be that memory wins. Knowing by how much tells you where to spend effort.

## Stage 6 — Repeated updating, where it gets hard

Everything above is a one-shot fine-tune. Doing it *repeatedly* on new experience is where **catastrophic forgetting** appears: updating on new material degrades performance on old.

Established mitigations, none of them complete:
- **Replay / rehearsal** — interleave old examples with new. The same trick sleep appears to use.
- **Elastic Weight Consolidation** (Kirkpatrick et al. 2017) — penalise changes to weights that mattered for previous tasks.
- **Adapter isolation** — a new adapter per period, composed at inference rather than merged.

**Underneath sits the stability–plasticity dilemma:** plastic enough to learn from one conversation is unstable enough to be corrupted by one bad conversation. Every known fix is a compromise.

## Stage 7 — Verification, which nobody has solved

A model that changes cannot be tested the way a frozen one can. There is no accepted method for proving a self-updating model hasn't quietly become worse or unsafe.

For a product used by people who are already struggling to trust their own read on a situation, this is not a footnote. **The minimum bar: no checkpoint ships without passing the full boundary suite, and rollback is one action.**

## Running throughout — consent and governance

Training on a real person's conversations, including material about their mental health and relationships, requires **explicit, specific, revocable consent** — not a line in a privacy policy. If this ever covers more than one user:

- Opt-in per person, with a plain-language explanation of what's retained and for what
- The ability to withdraw, and to have their contribution removed from future training sets
- Never train on anything the person dismissed — a dismissal is a withdrawal of consent for that item
- Consider whether a model trained on one person's material should ever serve another

## What this does and doesn't get you

**Does:** a model whose voice and restraint are shaped by real use with the people it's for; evidence about whether selective consolidation beats bulk; a dataset nobody else has.

**Doesn't:** solve catastrophic forgetting, or produce a model that learns from a single conversation the way a person does. That remains open, and anyone claiming otherwise is selling something.

The realistic prize is a genuinely better product and one publishable finding. That's a lot. It's also not the same as the breakthrough, and being precise about which you're claiming is what makes the rest of it credible.


---

## Status — beta rebuilt onto the current app

The beta now carries everything from the main line plus the SDM index:
sensory signature, learned rules, held-questions, time awareness, entangled
pings, evidence-bounded inference — with dream pairing addressed through SDM
by feeling, falling back to a scan if the index is unavailable.

Suites against the beta build: memory 24/24 · sensory 16/16 · rules 17/17 ·
questions 20/20 · time 16/16 · ping 15/15 · sdm 19/19 · beta 15/18.

### Fixed: order-destroying text encoding

`encodeText` permuted each token by its position in the sentence (`i % 3`).
Encoding word order that way is a legitimate hyperdimensional technique and
completely wrong for retrieval: the same word landed on a different vector
depending on where it fell, so "laundry" in a query never matched "laundry" in
a memory.

Measured before the fix: similarity between two texts sharing three words was
**0.001** — indistinguishable from noise, and the reason content retrieval
returned arbitrary results. After removing the positional permutation, the
correct memory ranks at **1.000** against **0.499** for the next.

### Open: feeling-addressed retrieval ranks wrongly

Reading by feeling still returns the wrong order. Measured, with a warm cue
(valence 0.8, arousal 0.4):

| Similarity | Memory |
|---:|---|
| 0.774 | "completely overwhelmed by the laundry" (negative) |
| 0.737 | "putting off calling the doctor… anxious and ashamed" (negative) |
| 0.562 | "more laundry, the washing machine cycle" (neutral) |
| 0.387 | "bin collection moved to Thursday" (neutral) |
| 0.367 | "finally finished the taxes and I feel proud" (**positive — should be first**) |

The ranking is close to inverted. Two candidate causes, neither confirmed:

1. `levelVectors` flips bits chosen at random **with replacement**, so a bit
   flipped at one step can be flipped back at a later one. That degrades the
   monotonic distance between adjacent levels the scheme depends on.
2. `nearest()` ranks the read result against whole memory vectors, which are
   dominated by their content component. A feeling-only cue is then scored
   largely against content noise.

Not yet isolated. Written down rather than quietly passed.
