import { createRequire } from "module";
const require = createRequire(import.meta.url);
const S = require("./sdm.js");
const mem = [
  ["laundry","i am completely overwhelmed by the laundry and i cant make myself start it",{valence:-0.8,arousal:0.9}],
  ["bins","the bin collection moved to thursday this week no big deal",{valence:0,arousal:0}],
  ["doctor","putting off calling the doctor again it makes me anxious and ashamed",{valence:-0.7,arousal:0.8}],
  ["taxes","finally finished the taxes and i feel proud of that",{valence:0.8,arousal:0.7}],
  ["laundry2","more laundry the washing machine cycle takes fifty minutes",{valence:0,arousal:0}],
];
for (const sdMult of [2.2, 1.8, 1.4, 1.0]) {
  // rebuild with a different radius by monkey-patching
  const store = S.createSDM();
  const r = Math.floor(S.D/2 - sdMult*(Math.sqrt(S.D)/2));
  store.radiusOverride = r;
  // emulate: re-implement activation with new radius
  const act = (addr) => store.addresses.map((a,i)=>[i,S.hamming(a,addr)]).filter(x=>x[1]<=r).map(x=>x[0]);
  const counters = store.counters;
  const write=(addr,data)=>{ act(addr).forEach(loc=>{ const base=loc*S.D;
    for(let b=0;b<S.D;b++){ const one=(data[b>>>5]>>>(b&31))&1; counters[base+b]+= one?1:-1; } }); };
  const read=(addr)=>{ const hits=act(addr); const sums=new Float64Array(S.D);
    hits.forEach(loc=>{const base=loc*S.D; for(let b=0;b<S.D;b++) sums[b]+=counters[base+b];});
    const out=new Uint32Array(S.D/32); for(let b=0;b<S.D;b++) if(sums[b]>0) out[b>>>5]|=(1<<(b&31));
    return {out, n:hits.length}; };
  const labels=[];
  mem.forEach(([l,t,a])=>{ const v=S.encodeMemory(t,a);
    [v,S.cueFromContent(t),S.cueFromFeeling(a.valence,a.arousal)].forEach(ad=>write(ad,v));
    labels.push({l,v}); });
  const rd = read(S.cueFromFeeling(-0.8,0.9));
  const rank = labels.map(x=>({l:x.l,s:S.similarity(x.v,rd.out)})).sort((a,b)=>b.s-a.s);
  console.log(`sd=${sdMult} radius=${r} locs=${rd.n} → ` + rank.map(x=>x.l+":"+x.s.toFixed(2)).join(" "));
}
