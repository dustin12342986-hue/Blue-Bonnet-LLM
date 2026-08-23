/* Did it land? The number only you can supply. */
import { JSDOM } from "jsdom";
import { readFileSync } from "fs";
let pass=0,fail=0;
const ck=(n,c,d="")=>{c?pass++:fail++;console.log((c?"PASS":"FAIL")+" - "+n+(d?"   ["+d+"]":""));};
const HTML = readFileSync("beta-index.html","utf8");
const LENS = readFileSync("bb-artist-lens.js","utf8");

const seed = { facts:[], episodes:[], insights:[], openThreads:[], dreams:[
  { id:"d1", at:1, insights:["something"], pings:[] },
  { id:"d2", at:2, insights:[], pings:[{idea:"x",kept:true}] },
  { id:"d3", at:3, insights:[], pings:[], note:"Nothing came of this one." },
]};
const dom = new JSDOM(HTML,{runScripts:"dangerously",pretendToBeVisual:true,url:"https://example.com/",
  beforeParse(w){ new w.Function(LENS).call(w);
    w.localStorage.setItem("bluebonnet-memory-beta", JSON.stringify(seed)); }});
await new Promise(r=>setTimeout(r,900));
const w = dom.window, d = w.document;

console.log("\n-- the taps appear where there's something to rate --");
d.getElementById("dreamsBtn").click();
const cards = d.querySelectorAll(".dream-card");
ck("all three dreams render", cards.length === 3, cards.length + " cards");
const btnCount = (c) => c.querySelectorAll("button").length;
ck("a dream that produced something gets buttons", btnCount(cards[0]) === 4, btnCount(cards[0]) + " buttons");
ck("so does one with a ping", btnCount(cards[1]) === 4);
ck("a {} dream gets none", btnCount(cards[2]) === 0,
   "nothing to rate \u2014 refusing is the honest majority");

console.log("\n-- both questions are asked, separately --");
const txt = cards[0].textContent;
ck("novelty is asked", /Had you already noticed this\?/.test(txt));
ck("meaning is asked separately", /Did it mean anything\?/.test(txt));

console.log("\n-- tapping records it --");
let rates = w.__bbRates();
ck("nothing rated yet", rates.rated === 0, JSON.stringify(rates.rated));
cards[0].querySelectorAll("button")[1].click();   // noticed: no
ck("the answer persists", JSON.parse(w.localStorage.getItem("bluebonnet-memory-beta"))
   .dreams.find(x=>x.id==="d1").noticed === false);
ck("still not counted until BOTH are answered", w.__bbRates().rated === 0,
   "novelty alone is not a data point");

const again = d.querySelectorAll(".dream-card");
again[0].querySelectorAll("button")[2].click();   // meant: yes
rates = w.__bbRates();
ck("now it counts", rates.rated === 1);
ck("and it is a hit", rates.novelAndMeaningful === 1, JSON.stringify(rates.hitRate));

console.log("\n-- the honest number is computed, not buried --");
const c2 = d.querySelectorAll(".dream-card");
c2[1].querySelectorAll("button")[1].click();      // d2 noticed: no
const c3 = d.querySelectorAll(".dream-card");
c3[1].querySelectorAll("button")[3].click();      // d2 meant: no
rates = w.__bbRates();
ck("novel-but-meaningless is tracked", rates.novelButMeaningless === 1);
ck("and reported as a rate", rates.noiseRate === "50%", rates.noiseRate);
ck("hit rate reflects both", rates.hitRate === "50%", rates.hitRate);
ck("refusals are counted apart", rates.refused === 1, "the {} dream");
ck("produced vs total is visible", rates.produced === 2 && rates.dreams === 3);

console.log("\n-- the reasoning is in the file --");
ck("why the two are separate", /collapsing the two into one/.test(HTML));
ck("why judgement can't wait", /a memory of a hit, not a data point/.test(HTML));
ck("why {} isn't rated", /rating them would only measure the pairing/.test(HTML));

console.log("\n-- nothing else moved --");
ck("boundary intact", /NEVER READ A THIRD PARTY/.test(HTML));
ck("feeling rule intact", /A FEELING IS THE SUBJECT/.test(HTML));
ck("budgets intact", /KB_BUDGET = 9000/.test(HTML) && /TURN_BUDGET_CHARS = 14000/.test(HTML));
ck("the chat prompt is untouched by any of this", !/Had you already noticed/.test(
   w.__bb.systemBlocks("hi").map(b=>b.text).join("\n")));

console.log("\n"+pass+" passed, "+fail+" failed\n");
process.exit(fail?1:0);
