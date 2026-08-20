/* Two accounts of how memories bind. Both ship; data decides. */
import { JSDOM } from "jsdom";
import { readFileSync } from "fs";
const dom = new JSDOM(readFileSync("index.html","utf8"),{runScripts:"dangerously",pretendToBeVisual:true,url:"https://example.com/"});
await new Promise(r=>setTimeout(r,800));
const w=dom.window, B=w.__bb;
let pass=0,fail=0;
const ck=(n,c,d="")=>{c?pass++:fail++;console.log((c?"PASS":"FAIL")+" - "+n+(d?"   ["+d+"]":""));};

console.log("\n-- mode A is the default, nothing changes without asking --");
ck("defaults to affect", B.pairingMode() === "affect", B.pairingMode());
ck("rejects a mode that doesn't exist", B.setPairingMode("banana") === "affect");

console.log("\n-- rarity: common texture carries no signal --");
// "window" in every episode; "burnt" in only two.
const common = ["i looked out the window at work","through the window again","window seat on the bus",
  "the window was open","staring out the window","window shopping downtown"];
common.forEach(t => B.recordEpisode([{role:"user",text:t}]));
B.recordEpisode([{role:"user",text:"the kitchen smelled burnt and i just stood there"}]);
B.recordEpisode([{role:"user",text:"burnt toast again, the smell filled the hallway"}]);
const rarity = B.textureRarity();
const rWindow = rarity("barrier:window"), rBurnt = rarity("smell:burnt");
ck("a word in almost every episode scores ~0", rWindow < 0.4, "window=" + rWindow.toFixed(2));
ck("a word shared by only two scores high", rBurnt > rWindow, "burnt=" + rBurnt.toFixed(2));

console.log("\n-- mode B fires on a distinctive configuration, with no shared feeling --");
B.setPairingMode("texture");
const pair = B.choosePair();
ck("it paired something", !!pair, pair ? "yes" : "none");
ck("it reports which account fired", pair && pair.mode === "texture", pair && pair.mode);
const txt = pair ? [pair.anchor.ep, pair.other.ep].map(e=>e.turns[0].text).join(" || ") : "";
ck("it found the rare pair, not the common one", /burnt/.test(txt), txt.slice(0,70));
ck("neither moment needed to carry charge",
   pair && Math.abs(pair.anchor.aff.valence) < 0.5 && pair.anchor.aff.arousal < 0.5,
   pair ? "v=" + pair.anchor.aff.valence.toFixed(2) + " a=" + pair.anchor.aff.arousal.toFixed(2) : "");

console.log("\n-- ordinary texture does not fire, which is why déjà vu is rare --");
B.memory.episodes = [];
["i looked out the window", "another window, nothing special"].forEach(t =>
  B.recordEpisode([{role:"user",text:t}]));
ck("two mundane window moments do not pair", B.choosePair() === null);

console.log("\n-- the modes disagree, which is the point --");
B.memory.episodes = [];
B.recordEpisode([{role:"user",text:"i am completely overwhelmed and ashamed about the laundry"}]);
B.recordEpisode([{role:"user",text:"anxious and useless about calling the doctor"}]);
B.recordEpisode([{role:"user",text:"cold glass, muffled, watched from behind the boards"}]);
B.recordEpisode([{role:"user",text:"cold glass again, muffled sound through the screen"}]);
B.setPairingMode("affect");
const A = B.choosePair();
B.setPairingMode("texture");
const Bp = B.choosePair();
const first = p => p ? p.anchor.ep.turns[0].text.slice(0,26) : "none";
ck("affect mode picks the charged pair", /overwhelme|anxious/.test(first(A)), first(A));
ck("texture mode picks the configuration pair", /cold glass/.test(first(Bp)), first(Bp));
ck("they chose differently", first(A) !== first(Bp));

console.log("\n-- mode B is told to assume coincidence --");
ck("both modes still refuse same-subject pairs",
   !Bp || !/laundry/.test(Bp.anchor.ep.turns[0].text + Bp.other.ep.turns[0].text)
   || Bp.anchor.ep.id !== Bp.other.ep.id);
ck("the shared words are reported for the journal", Bp && Bp.words && Bp.words.length > 0,
   Bp ? (Bp.words||[]).join(", ") : "");

console.log("\n-- the setting survives a reload --");
B.saveMemory();
// The beta uses its own storage key, so read whichever this build wrote.
const stored = w.localStorage.getItem("bluebonnet-memory-v1")
            || w.localStorage.getItem("bluebonnet-memory-beta") || "";
ck("mode is persisted", /"pairingMode":"texture"/.test(stored), stored ? "found" : "no store");

console.log("\n"+pass+" passed, "+fail+" failed\n");
process.exit(fail?1:0);
