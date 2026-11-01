// 結構與運作檢查，不宣稱能以程式證明題目語意或 CEFR 效度。
import { readFileSync, writeFileSync } from 'node:fs';
import '../loadBanks';
import type { Question, VocabEntry } from '../../src/game/types';
import { LEVELS, QUESTION_POOL, createDecks, questionDifficulty, questionSkill } from '../../src/game/QuestionData';
import { checkChoice, checkTypedAnswer, checkVoice, shuffleChoice, voiceFallback } from '../../src/game/battle';
import { validateQuestion, questionKey } from '../../src/game/validateQuestions';
import { knowledgeKey, trialQuestions, completeTrial, TRIAL_SKILLS } from '../../src/game/knowledge';
import { regionStageCount } from '../../src/game/stageLayout';
import { startPlacement, answerPlacement, currentQuestion, PLACEMENT_LEVELS } from '../../src/game/placementTest';
import { createGoldenDecks, generateGoldenStages } from '../../src/game/golden';
import { BANK_TARGETS, skillTarget } from '../../src/game/questionPipeline';
const read=<T>(p:string):T=>JSON.parse(readFileSync(p,'utf8')) as T;
const words=(s:string)=>(s.match(/[A-Za-z]+(?:['’][A-Za-z]+)?/g)??[]).length;
const rng=(seed:number)=>()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};
const assert=(ok:unknown,message:string)=>{if(!ok)throw new Error(message);};
const report:{[key:string]:unknown}={date:'2026-11-01',status:'draft',limits:['Format and oracle simulations do not establish semantic correctness or CEFR proficiency.','Reading speed assumptions are planning inputs, not measured learner performance.'],regions:[],placement:[],golden:{}};
const regions:unknown[]=[];
let assertions=0;
for(const r of [6,7,8]) {
 const b=read<{normal:Question[];boss:Question[]}>(`src/game/questions/bank/r${r}.json`);
 const v=read<Record<string,VocabEntry>>(`src/game/questions/bank/vocab-r${r}.json`);
 const all=[...b.normal,...b.boss];const issues=all.flatMap((q,i)=>validateQuestion(q,`r${r}[${i}]`));
 assert(!issues.some(i=>i.level==='error'),`r${r}: structural errors`);
 assert(new Set(all.map(questionKey)).size===all.length,`r${r}: duplicate keys`);
 for(const q of all) {
  if(q.type==='choice')for(const seed of [1,2,3,4,5,6,7,8]) {
   const original=q.options!['ABCD'.indexOf(q.ans)].slice(3);const shuffled=shuffleChoice(q,rng(seed));
   assert(shuffled.options!['ABCD'.indexOf(shuffled.ans)].slice(3)===original,'shuffle changed correct text');
   for(const l of 'ABCD'){assert(checkChoice(shuffled,l)===(l===shuffled.ans),'choice judgement mismatch');assertions++;}
  }
  else {
   const typed=voiceFallback(q);assert(checkTypedAnswer(typed,typed.ans),'correct typed input rejected');
   assert(!checkTypedAnswer(typed,typed.ans+'Z'),'incorrect typed input accepted');assertions+=2;
   if(q.type==='voice'){assert(checkVoice(q,q.speak!),'spoken oracle rejected');assert(!checkVoice(q,'banana bicycle telephone'),'unrelated transcript accepted');assertions+=2;}
  }
 }
 const quotas=Object.fromEntries(TRIAL_SKILLS.map(s=>[s,{count:all.filter(q=>q.skill===s).length,target:skillTarget(r,s)}]));
 const lexical=new Set(all.filter(q=>knowledgeKey(q).startsWith('w:')).map(knowledgeKey));
 const drawStats:unknown[]=[];
 for(const position of [0,Math.floor(regionStageCount(r)/2),regionStageCount(r)-1]) {
  const decks=createDecks(LEVELS[r],rng(r*1000+position));const counts:Record<string,number>={};let legacy=0;
  for(let i=0;i<1000;i++){const q=i%8===7?decks.boss(position):decks.normal(position);assert(!!q,'empty draw');assertions++;counts[`${questionSkill(q)}:d${questionDifficulty(q)}`]=(counts[`${questionSkill(q)}:d${questionDifficulty(q)}`]??0)+1;if(!q.skill)legacy++;}
  drawStats.push({stage:position,draws:1000,legacy,distribution:counts});
 }
 for(let seed=0;seed<100;seed++) {
  const qs=trialQuestions(r,()=>false,rng(seed));assert(qs.length===24,`r${r}: short trial ${qs.length}`);assert(completeTrial(qs),`r${r}: incomplete or duplicate trial`);
  for(const skill of TRIAL_SKILLS)assert(qs.filter(q=>questionSkill(q)===skill).length===6,`r${r}: wrong trial skill quota`);
  assertions+=6;
 }
 const reading=all.filter(q=>q.skill==='reading').map(q=>({key:questionKey(q),words:words(q.desc+' '+q.options!.join(' '))}));
 regions.push({region:r,questions:all.length,target:BANK_TARGETS[r],normal:b.normal.length,boss:b.boss.length,quotas,lexicalPoints:lexical.size,dictionaryRecords:Object.keys(v).length,unscopedVocabEntries:Object.keys(v).filter(k=>!/^R[0-8]:/.test(k)).length,scopedAliases:Object.keys(v).filter(k=>/^R[0-8]:/.test(k)).length,issues,reading:{maxWords:Math.max(...reading.map(q=>q.words)),over20SecondsAt180Wpm:reading.filter(q=>q.words/3+3>20).length,over20SecondsAt240Wpm:reading.filter(q=>q.words/4+3>20).length},drawStats});
 for(const deck of [b.normal,b.boss])for(const skill of ['listening','reading']) {
  const choices=deck.filter(q=>q.type==='choice'&&q.skill===skill);
  const positions=[... 'ABCD'].map(l=>choices.filter(q=>q.ans===l).length);
  if(choices.length>=12)assert(Math.max(...positions)-Math.min(...positions)<=2,`r${r}: answer positions clustered`);
 }
 if(process.argv.includes('--complete')){
  assert(all.length===BANK_TARGETS[r],`r${r}: not complete`);
  for(const skill of TRIAL_SKILLS)assert(all.filter(q=>q.skill===skill).length===skillTarget(r,skill),`r${r}: wrong final skill quota`);
  assert(all.filter(q=>q.type==='spell').length===all.filter(q=>q.type==='fill').length,`r${r}: writing split`);
 }
}
report.regions=regions;
const placement:unknown[]=[];
for(const ability of [0,1,2,3,4,5,6,7,8,9]) {
 const outcomes:Record<string,number>={};let duplicates=0,maxAnswers=0,unfinished=0;
 for(let seed=1;seed<=100;seed++) {
  const rand=rng(seed*100+ability);let s=startPlacement(4,{rand,now:0});let steps=0;const seen=new Set<string>();
  while(s.phase!=='done'&&steps<100){const q=currentQuestion(s);if(!q){unfinished++;break;}const k=questionKey(q);if(seen.has(k))duplicates++;seen.add(k);const named=(q as Question&{level?:string}).level;const level=named?PLACEMENT_LEVELS.indexOf(named):s.phase==='confirm'?Math.max(0,...s.passed):s.level;const probability=level<=ability?0.94:Math.max(0.25,0.6-(level-ability)*0.13);s=answerPlacement(s,rand()<probability,{rand,now:steps*10_000});steps++;}
  maxAnswers=Math.max(maxAnswers,steps);outcomes[String(s.result)]=(outcomes[String(s.result)]??0)+1;if(s.phase!=='done')unfinished++;
 }
 placement.push({assumedAbility:ability,runs:100,outcomes,duplicates,maxAnswers,unfinished});assert(unfinished===0,'placement failed to terminate');assert(duplicates===0,'placement repeated question');assertions+=2;
}
report.placement=placement;
const golden=generateGoldenStages(createGoldenDecks());assert(golden.length===45,'golden count');assert(golden.every(s=>s.questions.every(Boolean)),'empty golden stage');
report.golden={stages:golden.length,regions:LEVELS.length,finalKind:golden.at(-1)?.kind};
report.assertions=assertions;
const out=process.argv.indexOf('--out');if(out>=0)writeFileSync(process.argv[out+1],JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({draft:true,questions:regions.map(x=>(x as {questions:number}).questions),assertions,placementRuns:1000,goldenStages:golden.length}));
