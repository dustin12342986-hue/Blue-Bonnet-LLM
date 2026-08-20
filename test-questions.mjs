/* The third state: held, not understood. */
import { JSDOM } from "jsdom";
import { readFileSync } from "fs";
const dom = new JSDOM(readFileSync("index.html","utf8"),{runScripts:"dangerously",pretendToBeVisual:true,url:"https://example.com/"});
await new Promise(r=>setTimeout(r,800));
const w=dom.window, B=w.__bb;
let pass=0,fail=0;
const ck=(n,c,d="")=>{c?pass++:fail++;console.log((c?"PASS":"FAIL")+" - "+n+(d?"   ["+d+"]":""));};

const RAW = "user: i put off anything where i cant tell when its finished\nuser: i did the dishes fine though, that has an end";

console.log("\n-- a question must be grounded, same as an insight --");
const q = B.recordQuestion({text:"What makes some unfinished tasks feel different from others?",
  moment:"i put off anything where i cant tell when its finished", haystack:RAW});
ck("grounded question is held", !!q, q && q.text.slice(0,40));
const bad = B.recordQuestion({text:"Is this about your childhood?",
  moment:"my mother never let me finish anything", haystack:RAW});
ck("ungrounded question rejected", bad === null);
ck("nothing invented was held", !B.openQuestions().some(x=>/childhood/.test(x.text)));

console.log("\n-- it is never volunteered --");
const unrelated = B.questionContext("what should I make for dinner");
ck("silent on an unrelated subject", unrelated === "", unrelated.slice(0,60));
const idle = B.questionContext("");
ck("silent with no subject at all", idle === "");

console.log("\n-- it surfaces only when they open that subject --");
const onTopic = B.questionContext("i still cant start anything where i dont know when its finished");
ck("appears when they raise it", onTopic.length > 0);
ck("framed as not-knowing", /DON'T UNDERSTAND/.test(onTopic));
ck("explicitly forbidden from asserting it", /Do not state it/.test(onTopic));
ck("told it may only ask, once", /MAY ask/.test(onTopic) && /Never more than one/.test(onTopic));
ck("told not to use it as a lead-in to advice", /Never as a lead-in to advice/.test(onTopic));
ck("only one at a time", (onTopic.match(/^- /gm)||[]).length <= 1);

console.log("\n-- their answer is what resolves it, not the model --");
ck("unresolved until answered", B.openQuestions().length === 1, String(B.openQuestions().length));
const before = B.memory.facts.length;
B.resolveQuestion("What makes some unfinished tasks feel different from others?",
  "dishes have an end i can see, laundry doesnt");
ck("resolved once they answered", B.openQuestions().length === 0);
ck("their words became ordinary memory", B.memory.facts.length > before,
   before+" -> "+B.memory.facts.length);
ck("it was their wording that got stored",
   B.memory.facts.some(f=>/dishes have an end/.test(f.text)));

console.log("\n-- a resolved question doesn't come back --");
const again = B.questionContext("i still cant start anything where i dont know when its finished");
ck("stays closed", again === "", again.slice(0,60));

console.log("\n-- questions never enter context as knowledge --");
const q2 = B.recordQuestion({text:"Why does this one feel different?",
  moment:"i did the dishes fine though, that has an end", haystack:RAW});
ck("second question held", !!q2);
const ctx = B.buildMemoryContext("tell me about the dishes and that has an end");
ck("appears under not-understood, never under what-you-know",
   ctx.indexOf("DON'T UNDERSTAND") > ctx.indexOf("WHAT YOU KNOW"), "order");
ck("not presented as a fact", !/^- Why does this one feel different\?$/m.test(
   ctx.split("SOMETHING YOU DON'T UNDERSTAND")[0]));

console.log("\n-- bounded --");
for (let i=0;i<20;i++) B.recordQuestion({text:"question number "+i+" about things",
  moment:"i put off anything where i cant tell when its finished", haystack:RAW});
ck("capped", B.memory.questions.length <= 12, String(B.memory.questions.length));

console.log("\n"+pass+" passed, "+fail+" failed\n");
process.exit(fail?1:0);
