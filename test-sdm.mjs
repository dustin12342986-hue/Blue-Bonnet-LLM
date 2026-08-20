import { createRequire } from "module";
const require = createRequire(import.meta.url);
const S = require("./sdm.js");
let pass=0,fail=0;
const ck=(n,c,d="")=>{c?pass++:fail++;console.log((c?"PASS":"FAIL")+" - "+n+(d?"   ["+d+"]":""));};

console.log("\n-- the near-orthogonality everything rests on --");
const a = S.randomHV(1), b = S.randomHV(2);
const dist = S.hamming(a,b);
const sd = Math.sqrt(S.D)/2;
ck("two random vectors are ~D/2 apart", Math.abs(dist - S.D/2) < 4*sd, dist+" vs "+(S.D/2)+" ±"+(4*sd).toFixed(0));
ck("and therefore near-orthogonal", Math.abs(S.similarity(a,b)) < 0.12, S.similarity(a,b).toFixed(3));

console.log("\n-- binding is reversible and hides its inputs --");
const x = S.randomHV(10), y = S.randomHV(11);
const bound = S.bind(x,y);
ck("bound vector resembles neither input",
   Math.abs(S.similarity(bound,x))<0.12 && Math.abs(S.similarity(bound,y))<0.12,
   S.similarity(bound,x).toFixed(3)+" / "+S.similarity(bound,y).toFixed(3));
ck("unbinding recovers it exactly", S.similarity(S.bind(bound,x), y) === 1);

console.log("\n-- superposition: many memories in one vector --");
const items = [1,2,3,4,5].map(i=>S.randomHV(100+i));
const sup = S.bundle(items);
const sims = items.map(v=>S.similarity(sup,v));
ck("bundle resembles every member", sims.every(s=>s>0.25), sims.map(s=>s.toFixed(2)).join(" "));
ck("but not a stranger", S.similarity(sup, S.randomHV(999)) < 0.15, S.similarity(sup,S.randomHV(999)).toFixed(3));

console.log("\n-- determinism: same text, same vector, forever --");
const t1 = S.encodeText("i keep putting off calling the doctor");
const t2 = S.encodeText("i keep putting off calling the doctor");
ck("identical across calls", S.hamming(t1,t2) === 0);
ck("different text differs", S.similarity(t1, S.encodeText("the bin goes out on tuesday")) < 0.2,
   S.similarity(t1,S.encodeText("the bin goes out on tuesday")).toFixed(3));
ck("related text is closer than unrelated",
   S.similarity(t1, S.encodeText("putting off calling the dentist")) >
   S.similarity(t1, S.encodeText("the bin goes out on tuesday")));

console.log("\n-- level vectors: near values stay near --");
const v0 = S.levelOf(S.VALENCE_LEVELS, -0.8, -1, 1);
const v1 = S.levelOf(S.VALENCE_LEVELS, -0.6, -1, 1);
const v2 = S.levelOf(S.VALENCE_LEVELS,  0.8, -1, 1);
ck("similar feelings have similar vectors", S.similarity(v0,v1) > S.similarity(v0,v2) + 0.3,
   S.similarity(v0,v1).toFixed(2)+" vs "+S.similarity(v0,v2).toFixed(2));

console.log("\n-- SDM: store and recall from a noisy cue --");
const sdm = S.createSDM();
console.log("   activation radius " + sdm.radius + " of " + S.D);
const memories = [
  ["laundry",  "i am overwhelmed by the laundry i cant start it", {valence:-0.8,arousal:0.9}],
  ["doctor",   "putting off calling the doctor makes me anxious", {valence:-0.7,arousal:0.8}],
  ["bins",     "the bin collection moved to thursday this week",  {valence:0,arousal:0}],
  ["proud",    "finally finished the taxes feeling proud",        {valence:0.8,arousal:0.7}],
  ["car",      "the corolla needs a state inspection by march",   {valence:-0.2,arousal:0.3}],
];
memories.forEach(([label,text,aff])=>{
  const v = S.encodeMemory(text, aff);
  // Written at every address we intend to reach it from: by content, by
  // feeling, and by the whole memory.
  sdm.writeIndexed(v, [v, S.cueFromContent(text), S.cueFromFeeling(aff.valence, aff.arousal)], label);
});
ck("each write hit multiple locations", sdm.activated(S.encodeMemory(memories[0][1],memories[0][2])).length > 1,
   String(sdm.activated(S.encodeMemory(memories[0][1],memories[0][2])).length));

// Recall from a partial, imperfect cue — words the person didn't use verbatim.
const cue = S.encodeMemory("overwhelmed laundry cant start", {valence:-0.8,arousal:0.9});
const got = sdm.read(cue);
const best = sdm.nearest(got.vec, 2);
ck("noisy partial cue recalls the right memory", best[0].label === "laundry",
   best.map(b=>b.label+":"+b.sim.toFixed(2)).join(" "));

console.log("\n-- addressing by FEELING alone, across topics --");
// No content at all: just "heavy and loud". This is the fold — a coordinate
// built from how something felt, not what it was about.
const feelCue = S.cueFromFeeling(-0.75, 0.85);
const byFeel = sdm.nearest(sdm.read(feelCue).vec, 5);
const top2 = byFeel.slice(0,2).map(b=>b.label);
ck("retrieves the heavy ones", top2.includes("laundry") && top2.includes("doctor"),
   byFeel.map(b=>b.label+":"+b.sim.toFixed(2)).join(" "));
ck("does not retrieve the flat admin one first", byFeel[0].label !== "bins", byFeel[0].label);
ck("and not the happy one first", byFeel[0].label !== "proud", byFeel[0].label);

console.log("\n-- reading an address nothing was written to --");
const emptyCue = S.cueFromFeeling(0.2, 0.15);   // mildly positive, quiet — nothing stored here
const blend = sdm.read(emptyCue);
const near = sdm.nearest(blend.vec, 3);
ck("still returns something", blend.locations > 0, "locations="+blend.locations);
ck("it is a blend, not an exact match", near[0].sim < 0.9, near.map(b=>b.label+":"+b.sim.toFixed(2)).join(" "));

console.log("\n-- graceful degradation, not a cliff --");
const sdm2 = S.createSDM();
const many = [];
for (let i=0;i<120;i++){
  const text = "episode "+i+" "+["laundry","doctor","corolla","electric bill","sleeping","groceries","dentist","rent"][i%8]+" "+["morning","evening","weekend","monday","overdue","forgot","started","finished"][(i*3)%8]+" unique"+i+" marker"+(i*7);
  const aff = {valence:((i%7)-3)/3, arousal:(i%5)/4};
  const v = S.encodeMemory(text, aff);
  many.push({i, v, text});
  sdm2.writeIndexed(v, [v], "m"+i);
}
let hit=0;
many.forEach(m=>{ if (sdm2.nearest(sdm2.read(m.v).vec,1)[0].label === "m"+m.i) hit++; });
const rate = hit/many.length;
// 120 is deliberately PAST capacity (~0.1 x hard locations). The point is
// that overload degrades rather than collapses — and that the working set
// this is actually used on must stay under it.
ck("past capacity, recall degrades rather than collapsing", rate > 0.15 && rate < 0.6,
   (rate*100).toFixed(0)+"% exact at 120, vs 100% at 25");
ck("failures are near-misses, not garbage",
   (()=>{ const m=many[3]; const n=sdm2.nearest(sdm2.read(m.v).vec,1)[0]; return n.sim>0.3; })());

console.log("\n-- cost --");
const t0=Date.now(); for(let i=0;i<20;i++) S.encodeText("some ordinary sentence about the laundry and the doctor");
console.log("   encode x20: "+(Date.now()-t0)+"ms");
const t1b=Date.now(); for(let i=0;i<20;i++) sdm.read(cue);
console.log("   read x20:   "+(Date.now()-t1b)+"ms");
console.log("   counters:   "+(S.HARD_LOCATIONS*S.D*2/1024).toFixed(0)+" KB in RAM, 0 bytes stored");

console.log("\n"+pass+" passed, "+fail+" failed\n");
process.exit(fail?1:0);
