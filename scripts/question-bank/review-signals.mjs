// 語言審查的排程線索，不是語意正確性或CEFR判定器。絕不自動刪改題目。
import { readdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const outIndex=process.argv.indexOf('--out');
const out=outIndex<0?'/tmp/enggame-question-bank-review-signals.json':process.argv[outIndex+1];
if(!out)throw Error('--out requires a file path');
const summary=[]; const signals=[]; const targets=new Map();
const absolute=/\b(?:always|never|every|all|none|impossible|necessarily)\b|必然|所有|完全|不可能/i;
for(const file of readdirSync('scripts/question-bank/sources').filter(f=>/^\d.*\.mjs$/.test(f)).sort()) {
 const {data}=await import(pathToFileURL(resolve('scripts/question-bank/sources',file)).href);
 for(const [region,d] of Object.entries(data)) {
  for(const skill of ['reading','listening']) {
   const stats={source:file,region:Number(region),skill,count:0,correctLengthRank:[0,0,0,0],longestByThirtyPercent:0,absoluteDistractorItems:0};
   for(const [index,[difficulty,body,encoded]] of (d[skill]??[]).entries()) {
    const options=encoded.split('|');if(options.length!==4)throw Error(`${file}:${region}:${skill}:${index}`);
    const lengths=options.map(s=>[...s].length);
    const rank=lengths.slice(1).filter(n=>n>lengths[0]).length;
    const ratio=lengths[0]/Math.max(...lengths.slice(1));
    const absolutes=options.slice(1).filter(s=>absolute.test(s)).length;
    stats.count++;stats.correctLengthRank[rank]++;
    if(ratio>=1.3)stats.longestByThirtyPercent++;
    if(absolutes)stats.absoluteDistractorItems++;
    if(ratio>=1.3||absolutes>=2)signals.push({source:file,region:Number(region),skill,index:index+1,difficulty,body,options,lengthRatio:Math.round(ratio*100)/100,absoluteDistractors:absolutes});
   }
   summary.push(stats);
  }
  for(const kind of ['voices','words','spells','fills','lexicon'])for(const row of d[kind]??[]) {
   const key=`${region}:${row[0].toUpperCase()}`;
   if(!targets.has(key))targets.set(key,[]);
   targets.get(key).push({source:file,kind,meaning:kind==='voices'?row[1]:row[2]});
  }
 }
}
signals.sort((a,b)=>b.lengthRatio-a.lengthRatio);
const repeatedTargets=[...targets].filter(([,uses])=>new Set(uses.map(u=>u.source)).size>1).map(([key,uses])=>({key,uses}));
const report={notice:'僅供人工排程；長度與絕對詞可能合理。不同中文描述不等於不同義項；不得把本報告當作全量審題通過證據。',summary,signals,repeatedTargets};
writeFileSync(out,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({questions:summary.reduce((n,s)=>n+s.count,0),flaggedItems:signals.length,repeatedTargets:repeatedTargets.length,out}));
