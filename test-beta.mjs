/* Beta: SDM wired in, storage isolated, dreaming addressed not scanned. */
import { JSDOM } from "jsdom";
import { readFileSync } from "fs";
const HTML = readFileSync("beta.html","utf8");
const KIT = readFileSync("blue-bonnet-kit.js","utf8");
const dom = new JSDOM(HTML.replace('<script src="blue-bonnet-kit.js"></script>','<script>'+KIT+'</script>'),
  {runScripts:"dangerously",pretendToBeVisual:true,url:"https://example.com/"});
await new Promise(r=>setTimeout(r,900));
const w=dom.window, B=w.__bb;
let pass=0,fail=0;
const ck=(n,c,d="")=>{c?pass++:fail++;console.log((c?"PASS":"FAIL")+" - "+n+(d?"   ["+d+"]":""));};

console.log("\n-- isolated from the live app --");
ck("beta storage key", w.localStorage.getItem("bluebonnet-memory-v1") === null);
B.observeFacts(["seed"]); B.saveMemory();
ck("writes to its own key", w.localStorage.getItem("bluebonnet-memory-beta") !== null);
ck("live app key untouched", w.localStorage.getItem("bluebonnet-memory-v1") === null);
ck("marked as beta in the header", /BETA/.test(w.document.getElementById("statusText").textContent));

console.log("\n-- the index builds from what's live --");
B.recordEpisode([{role:"user",text:"i am completely overwhelmed by the laundry and i cant make myself start it"}]);
B.recordEpisode([{role:"user",text:"the bin collection moved to thursday this week no big deal"}]);
B.recordEpisode([{role:"user",text:"putting off calling the doctor again it makes me anxious and ashamed"}]);
B.recordEpisode([{role:"user",text:"finally finished the taxes and i feel proud of that"}]);
B.recordEpisode([{role:"user",text:"more laundry the washing machine cycle takes fifty minutes"}]);
const set = B.workingSet();
ck("working set built", set.length >= 5, String(set.length));
ck("stays inside reliable capacity", set.length <= 50, String(set.length));

console.log("\n-- retrieval by feeling, with no words in the cue --");
const heavy = B.sdmRecall(B.cueFromFeeling(-0.8, 0.9), 5);
const top = heavy.slice(0,2).map(h=>h.item.text.slice(0,26));
ck("returns something", heavy.length > 0, String(heavy.length));
ck("the heavy ones come back first",
   heavy.slice(0,2).every(h=>/overwhelmed|anxious/.test(h.item.text)), top.join(" || "));
ck("flat admin is not first", !/bin collection/.test(heavy[0].item.text), heavy[0].item.text.slice(0,30));

const warm = B.sdmRecall(B.cueFromFeeling(0.8, 0.7), 3);
ck("a warm cue returns the warm memory", /proud/.test(warm[0].item.text), warm[0].item.text.slice(0,30));

console.log("\n-- retrieval by content still works --");
const byContent = B.sdmRecall(B.cueFromContent("washing machine laundry cycle"), 3);
ck("content cue finds the laundry ones", /laundry/.test(byContent[0].item.text), byContent[0].item.text.slice(0,34));

console.log("\n-- dreaming now pairs across topics, by feeling --");
B.observeFacts(["Laundry stalls out","Putting off calling the doctor"]);
const pair = B.chooseDreamPair();
ck("a pair was found", !!pair);
const at = pair && pair.anchor.ep.turns[0].text, ot = pair && pair.other.ep.turns[0].text;
ck("both carried weight", /overwhelmed|anxious/.test(at||"") && /overwhelmed|anxious/.test(ot||""),
   (at||"").slice(0,24)+" || "+(ot||"").slice(0,24));
ck("not the same subject twice", !(/laundry/.test(at||"") && /laundry/.test(ot||"")));
ck("the flat episode was left out", !/bin collection/.test(ot||""));

console.log("\n-- it still works if the index fails --");
// createSDM lives inside the closure, so break the index through the only
// surface a caller actually has and confirm dreaming still returns a pair.
const realIndex = B.sdmIndex;
B.sdmIndex = () => { throw new Error("index unavailable"); };
let survived = false;
try { survived = !!B.chooseDreamPair(); } catch (e) { survived = false; }
B.sdmIndex = realIndex;
ck("dreaming falls back to the scan when the index throws", survived);
ck("and the index still works afterwards", B.sdmRecall(B.cueFromFeeling(-0.8,0.9),3).length > 0);

console.log("\n-- cost --");
const t0=Date.now(); B.sdmIndex(); console.log("   index build: "+(Date.now()-t0)+"ms");
const t1=Date.now(); B.sdmRecall(B.cueFromFeeling(-0.8,0.9),5); console.log("   recall:      "+(Date.now()-t1)+"ms");
B.saveMemory();
const stored = w.localStorage.getItem("bluebonnet-memory-beta").length;
ck("vectors add nothing to storage", stored < 60000, stored+" bytes");

console.log("\n"+pass+" passed, "+fail+" failed\n");
process.exit(fail?1:0);
