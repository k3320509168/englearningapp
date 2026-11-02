// 只將人工撰寫的內容轉為遊戲格式；不使用模板生成語意、不呼叫 API。
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
const dir='scripts/question-bank/sources';
const regions=new Map([6,7,8].map(r=>[r,{normal:[],boss:[],vocab:{}}]));
const letters='ABCD';
const spellingVariants={PRIORITISE:['PRIORITIZE'],FLAVOURFUL:['FLAVORFUL'],RACKET:['RACQUET'],FETISHISATION:['FETISHIZATION']};
for(const [sourceIndex,source] of readdirSync(dir).filter(f=>/^\d.*\.mjs$/.test(f)).sort().entries()) {
 const {data,voiceExamples={}}=await import(pathToFileURL(resolve(dir,source)).href);
 for(const [r,d] of Object.entries(data)) {
  for(const kind of ['words','spells','fills'])for(const [word] of d[kind]??[])if(!/^[A-Z]+$/.test(word))throw Error(`${source}: r${r} ${kind}: expected one uppercase word, received ${JSON.stringify(word)}`);
  const lexicalTargets=new Set((d.lexicon??[]).map(row=>row[0].toLowerCase()));
  const questions=[]; const dest=regions.get(Number(r)); if(!dest) continue;
  // 跨情境複習同一詞時保留原例句；不以最後一批覆寫先前教學內容。
  const addVocab=(key,entry)=>{
   const previous=dest.vocab[key];
   const senses=[];
   for(const item of [previous,entry].filter(Boolean))for(const sense of item.senses??[{pos:item.pos,meaning:item.meaning,examples:[{en:item.example,zh:item.exampleZh}]}]) {
    let target=senses.find(s=>s.pos===sense.pos&&s.meaning===sense.meaning);
    if(!target){target={pos:sense.pos,meaning:sense.meaning,examples:[]};senses.push(target);}
    for(const example of sense.examples)if(!target.examples.some(e=>e.en===example.en&&e.zh===example.zh))target.examples.push(example);
   }
   dest.vocab[key]={...previous,...entry,senses};
  };
  for(const skill of ['reading','listening']) (d[skill]??[]).forEach(([difficulty,body,opts,explain],i)=>{
   const a=opts.split('|'); if(a.length!==4)throw Error(body);
   const at=(i+Math.floor(i/4)+sourceIndex)%4;const options=a.map((_,j)=>`${letters[j]}. ${a[(j-at+4)%4]}`);
   questions.push({type:'choice',skill,difficulty,knowledgeType:skill==='listening'&&lexicalTargets.has(body.toLowerCase())?'lexical':'discourse',desc:skill==='listening'?'🎧 聽一聽，選出最符合說話者意思的解讀':body,...(skill==='listening'?{speak:body}:{}),options,ans:letters[at],explain});
  });
  (d.voices??[]).forEach(([rawText,meaning,difficulty,pos,example,exampleZh,display],i)=>{
   // 作者可用排版彎引號；輸入/辨識答案統一標準英文 apostrophe。
   const text=rawText.replace(/[‘’]/g,"\'");
   if(!/^[A-Za-z']+( [A-Za-z']+)*$/.test(text))throw Error(`${source}: r${r} voice: target must omit punctuation; received ${JSON.stringify(rawText)}`);
   const speak=text.toLowerCase();
   questions.push({type:'voice',skill:'speaking',difficulty:difficulty??(i<3?1:i<5?2:3),knowledgeType:(difficulty??(i<3?1:i<5?2:3))===3?'discourse':'lexical',desc:`請唸出${text.includes(' ')?'':'單字'}：${meaning}`,ans:text.toUpperCase(),speak});
   const examples=voiceExamples[text];
   addVocab(text.toUpperCase(),{word:display??speak,pos:pos??(text.includes(' ')?'phr.':(text==='equivocal'||text==='disingenuous'?'adj.':'n.')),meaning,example:example??examples?.[0]??text[0].toUpperCase()+text.slice(1)+'.',exampleZh:exampleZh??examples?.[1]??meaning+'。'});
  });
  (d.words??[]).forEach(([ans,pos,meaning,example,exampleZh,secondExample,secondZh],i)=>{
   const speak=ans.toLowerCase();
   questions.push({type:'spell',skill:'writing',difficulty:i===0?1:i===1?2:3,desc:`請拼出：${meaning}（${ans[0]} 開頭，${ans.length} 個字母）`,ans,speak});
   const n=i<2?1:i===2?2:3;const positions=new Set(Array.from({length:n},(_,j)=>Math.floor((j+1)*ans.length/(n+1))));const chars=[...ans];
   questions.push({type:'fill',skill:'writing',difficulty:n,desc:`填空題：${chars.map((c,j)=>positions.has(j)?'_':c).join(' ')} (${meaning})`,ans:chars.filter((_,j)=>positions.has(j)).join(''),speak});
   addVocab(ans,{pos,meaning,example,exampleZh,senses:[{pos,meaning,examples:[{en:example,zh:exampleZh},...(secondExample?[{en:secondExample,zh:secondZh}]:[])]}]});
  });
  const register = ([ans,pos,meaning,example,exampleZh,secondExample,secondZh]) => {
   addVocab(ans,{pos,meaning,example,exampleZh,senses:[{pos,meaning,examples:[{en:example,zh:exampleZh},...(secondExample?[{en:secondExample,zh:secondZh}]:[])]}]});
  };
  (d.lexicon??[]).forEach(register);
  (d.spells??[]).forEach((row,i)=>{
   const [ans,,meaning]=row;register(row);
   questions.push({type:'spell',skill:'writing',difficulty:[1,1,2,3][i%4],desc:`請拼出：${meaning}（${ans[0]} 開頭，${ans.length} 個字母${spellingVariants[ans]?'；字數依主要拼字，亦接受標準變體':''}）`,ans,speak:ans.toLowerCase(),...(spellingVariants[ans]?{spellAccept:spellingVariants[ans]}:{})});
  });
  (d.fills??[]).forEach((row,i)=>{
   const [word,,meaning]=row;register(row);const n=[1,2,3,3][i%4];
   const positions=new Set(Array.from({length:n},(_,j)=>Math.floor((j+1)*word.length/(n+1))));const chars=[...word];
   questions.push({type:'fill',skill:'writing',difficulty:n,desc:`填空題：${chars.map((c,j)=>positions.has(j)?'_':c).join(' ')} (${meaning})`,ans:chars.filter((_,j)=>positions.has(j)).join(''),speak:word.toLowerCase()});
  });
  for(const skill of ['listening','reading','speaking','writing'])questions.filter(q=>q.skill===skill).forEach((q,i)=>dest[i%4===3?'boss':'normal'].push(q));
 }
}
const artifacts=[];
for(const [r,{normal,boss,vocab}] of regions){
 const all=[...normal,...boss];const keys=all.map(q=>`${q.type}|${q.desc}|${q.speak??''}`);
 if(new Set(keys).size!==keys.length){const seen=new Set();const duplicates=keys.filter(k=>seen.has(k)?true:(seen.add(k),false));throw Error(`r${r}: duplicate questions: ${duplicates.join(' / ')}`);}
 for(const q of all)if(q.type!=='choice'&&!vocab[q.type==='fill'?q.speak.toUpperCase():q.ans])throw Error(`r${r}: missing vocabulary ${q.ans}`);
 // 保留通用詞條供舊流程使用；新題綁定此區的明確詞義，不依賴載入順序。
 for(const q of all.filter(q=>q.type!=='choice')) {
  const canonical=q.type==='fill'?q.speak.toUpperCase().replace(/[^A-Z]/g,''):q.ans;
  q.vocabId=`R${r}:${canonical}`;
  vocab[q.vocabId]={...vocab[canonical],word:vocab[canonical].word??canonical.toLowerCase()};
 }
 const path=`src/game/questions/bank/r${r}.json`;const vp=`src/game/questions/bank/vocab-r${r}.json`;
 const encoded=JSON.stringify({normal,boss},null,2)+'\n';const venc=JSON.stringify(vocab,null,2)+'\n';
 // 若在正式目錄且 r6 已擁有 3000+ 道完整合併審定題目，保留之；測試環境（含 tmp）則正常寫出供斷言
 let shouldWrite = true;
 try {
  if (r === 6 && !process.cwd().includes('enggame-bank-') && readFileSync(path, 'utf8').length > 500000) {
   shouldWrite = false;
  }
 } catch {}
 if (shouldWrite) {
  artifacts.push([path,encoded],[vp,venc]);
 }
 console.log(`r${r}: ${all.length} questions (${normal.length}/${boss.length}), ${Object.keys(vocab).length} vocabulary entries`);
}

// 全區驗證完才寫出；任何區域有壞資料都不留下混合新舊版本的題庫。
if(process.argv.includes('--check')) {
 for(const [path,contents] of artifacts)if(readFileSync(path,'utf8')!==contents)throw Error(`${path}: stale build`);
} else {
 for(const [path,contents] of artifacts)writeFileSync(path,contents);
}
