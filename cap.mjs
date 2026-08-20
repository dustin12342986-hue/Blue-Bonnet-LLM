import { createRequire } from "module";
const require = createRequire(import.meta.url);
const S = require("./sdm.js");
// Where does recall actually break down?
for (const n of [10,25,50,100,200]) {
  const sdm = S.createSDM();
  const mem = [];
  for (let i=0;i<n;i++){
    const text = "episode "+i+" "+["laundry","doctor","corolla","electric bill","sleeping","groceries","dentist","rent"][i%8]+" unique"+i+" marker"+(i*7);
    const v = S.encodeMemory(text, {valence:((i%7)-3)/3, arousal:(i%5)/4});
    mem.push({i,v}); sdm.writeIndexed(v,[v],"m"+i);
  }
  let exact=0, top3=0;
  mem.forEach(m=>{
    const near = sdm.nearest(sdm.read(m.v).vec,3);
    if (near[0].label==="m"+m.i) exact++;
    if (near.some(x=>x.label==="m"+m.i)) top3++;
  });
  console.log(`  ${String(n).padStart(3)} memories → ${(100*exact/n).toFixed(0)}% exact, ${(100*top3/n).toFixed(0)}% in top 3`);
}
