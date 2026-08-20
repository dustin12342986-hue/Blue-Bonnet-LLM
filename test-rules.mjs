/* A pattern noticed in a dream becomes a rule that changes behaviour. */
import { JSDOM } from "jsdom";
import { readFileSync } from "fs";
const dom = new JSDOM(readFileSync("index.html","utf8"),{runScripts:"dangerously",pretendToBeVisual:true,url:"https://example.com/"});
await new Promise(r=>setTimeout(r,800));
const w=dom.window, B=w.__bb;
let pass=0,fail=0;
const ck=(n,c,d="")=>{c?pass++:fail++;console.log((c?"PASS":"FAIL")+" - "+n+(d?"   ["+d+"]":""));};

const RAW = "user: i put off anything where i cant tell when its finished";
B.observeFacts(["Laundry stalls out","Putting off calling the doctor"]);

console.log("\n-- an observation is not yet a rule --");
const ping = B.recordPing({
  idea: "Break tasks with no visible end into a first step that has one",
  moment: "i put off anything where i cant tell when its finished",
  threads: ["Laundry stalls out","Putting off calling the doctor"],
}, RAW);
ck("ping recorded", !!ping);
ck("not promoted on first notice", B.liveRules().length === 0, String(B.liveRules().length));
ck("and does not change behaviour yet", B.rulesContext() === "");

console.log("\n-- reality has to keep confirming it --");
B.observeFacts(["Laundry stalls out"]);
ck("one reinforcement is not enough", B.liveRules().length === 0, String(B.liveRules().length));
B.observeFacts(["Putting off calling the doctor"]);
B.observeFacts(["Laundry stalls out"]);
B.observeFacts(["Putting off calling the doctor"]);
const learned = B.liveRules();
ck("promoted once it kept holding true", learned.length === 1, String(learned.length));
ck("it is the pattern from the dream", /first step that has one/.test(learned[0].text), learned[0].text);

console.log("\n-- now it changes what Blue Bonnet does --");
const ctx = B.rulesContext();
ck("enters the prompt as an instruction", /WHAT YOU'VE LEARNED WORKS/.test(ctx));
ck("framed as changing the answer, not as a fact", /they change how you answer/.test(ctx));
ck("told to apply it silently", /Apply them silently/.test(ctx));
ck("told never to announce it learned something", /Never announce that you have learned/.test(ctx));
const full = B.buildMemoryContext("help me with the laundry");
ck("reaches the real system prompt", /WHAT YOU'VE LEARNED WORKS/.test(full));

console.log("\n-- a rule cannot outlive what it came from --");
const before = B.liveRules().length;
B.memory.facts = B.memory.facts.filter(f => !/Laundry|doctor/.test(f.text));
B.pruneRules();
ck("retires when the reality behind it is gone", B.liveRules().length < before,
   before + " -> " + B.liveRules().length);
ck("retired, not deleted", B.memory.rules.length === 1 && B.memory.rules[0].retired === true);
ck("and stops changing behaviour", B.rulesContext() === "");

console.log("\n-- dismissal kills the rule too --");
B.observeFacts(["Laundry stalls out","Putting off calling the doctor"]);
const p2 = B.recordPing({ idea: "Offer a visible finish line before anything else",
  moment: "i put off anything where i cant tell when its finished",
  threads: ["Laundry stalls out"] }, RAW);
for (let i=0;i<4;i++) B.observeFacts(["Laundry stalls out"]);
ck("second rule learned", B.liveRules().some(r=>/visible finish line/.test(r.text)),
   B.liveRules().map(r=>r.text.slice(0,30)).join(" | "));
p2.dismissed = true;
B.pruneRules();
ck("dismissing the insight retires its rule", !B.liveRules().some(r=>/visible finish line/.test(r.text)));

console.log("\n-- bounded --");
ck("never more than 8 rules", B.liveRules().length <= 8, String(B.liveRules().length));

console.log("\n"+pass+" passed, "+fail+" failed\n");
process.exit(fail?1:0);
