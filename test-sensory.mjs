/* Sensory texture as part of the signature. */
import { JSDOM } from "jsdom";
import { readFileSync } from "fs";
const dom = new JSDOM(readFileSync("index.html","utf8"),{runScripts:"dangerously",pretendToBeVisual:true,url:"https://example.com/"});
await new Promise(r=>setTimeout(r,800));
const w=dom.window, B=w.__bb;
let pass=0,fail=0;
const ck=(n,c,d="")=>{c?pass++:fail++;console.log((c?"PASS":"FAIL")+" - "+n+(d?"   ["+d+"]":""));};

console.log("\n-- reading texture only when it's actually there --");
const window_ = B.sensoryOf("i could see her through the window but i couldnt hear her, the glass was cold");
ck("picks up sight", !!window_.modes.sight, JSON.stringify(window_.modes));
ck("picks up sound", !!window_.modes.sound);
ck("picks up touch", !!window_.modes.touch);
ck("picks up the barrier", !!window_.modes.barrier, JSON.stringify(window_.modes.barrier||[]));

const plain = B.sensoryOf("i need to pay the electric bill before the twelfth");
ck("plain admin has no texture", plain.count === 0, String(plain.count));
ck("nothing invented from absence", Object.keys(plain.modes).length === 0);

console.log("\n-- an absent sense is not a mismatch --");
const rich = B.sensoryOf("watching through the glass, everything muffled");
const none = B.sensoryOf("the appointment is on tuesday");
ck("no texture on one side scores zero, not negative", B.sensoryMatch(rich, none).score === 0);
ck("and reports nothing shared", B.sensoryMatch(rich, none).shared.length === 0);

console.log("\n-- matching on texture across different subjects --");
const rinkSide = B.sensoryOf("i watched her from behind the boards, i could see her but not reach her");
const m = B.sensoryMatch(window_, rinkSide);
ck("the two barrier scenes match", m.score > 0, m.score.toFixed(2));
ck("barrier is named as shared", m.shared.indexOf("barrier") !== -1, m.shared.join(", "));

const kitchen = B.sensoryOf("the kitchen smelled burnt and everything was too loud");
const m2 = B.sensoryMatch(window_, kitchen);
ck("a different texture scores lower", m2.score < m.score, m2.score.toFixed(2)+" vs "+m.score.toFixed(2));

console.log("\n-- texture strengthens a pair but cannot create one --");
B.recordEpisode([{role:"user",text:"i am overwhelmed and ashamed, i watched her through the window and couldnt reach her"}]);
B.recordEpisode([{role:"user",text:"the bin collection moved to thursday, no big deal at all"}]);
B.recordEpisode([{role:"user",text:"i felt anxious and useless behind the boards, i could see her through the glass"}]);
B.recordEpisode([{role:"user",text:"more window cleaning, the glass needs doing, cold morning, quite loud outside"}]);
const pair = B.chooseDreamPair();
ck("a pair was chosen", !!pair);
const at = pair && pair.anchor.ep.turns[0].text, ot = pair && pair.other.ep.turns[0].text;
ck("both carried feeling", /overwhelmed|anxious/.test(at||"") && /overwhelmed|anxious/.test(ot||""),
   (at||"").slice(0,30)+" || "+(ot||"").slice(0,30));
ck("shared texture reported", pair && pair.senses && pair.senses.length > 0,
   pair && (pair.senses||[]).join(", "));
ck("the flat window-cleaning episode was NOT picked despite matching texture",
   !/window cleaning/.test(ot||""), (ot||"").slice(0,40));

console.log("\n-- it reaches the journal --");
B.recordDream({readChars:900, felt:"heavy", senses:["barrier","sound"], looked:["a heavy moment"], insights:[], pings:[]});
B.renderDreams();
const panel = w.document.getElementById("dreamList").textContent;
ck("texture shown in the journal", /shared texture: barrier, sound/.test(panel), panel.slice(0,120));

console.log("\n"+pass+" passed, "+fail+" failed\n");
process.exit(fail?1:0);
