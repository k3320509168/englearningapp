import fs from 'node:fs';
const levels = ['A1','A2','A2+','B1','B1+','B2','B2+','C1','C2'];
const speeds = [120,180,240];
const percentile = (arr,p) => arr.length ? arr[Math.min(arr.length - 1,Math.floor((arr.length - 1)*p))] : 0;
const report = [];
for(let r=0;r<9;r++) {
  const bank=JSON.parse(fs.readFileSync(`src/game/questions/bank/r${r}.json`,'utf8'));
  const readings=[];
  for(const kind of ['normal','boss']) for(const [index,q] of bank[kind].entries()) {
    if(q.type!=='choice'||(q.skill ? q.skill!=='reading' : q.desc.startsWith('🎧')))continue;
    const text=[q.desc,...(q.options??[]).map(o=>o.replace(/^[A-D]\.\s*/,''))].join(' ');
    const words=(text.match(/[A-Za-z]+(?:['’-][A-Za-z]+)*/g)??[]).length;
    readings.push({kind,index,words,desc:q.desc});
  }
  const counts=readings.map(q=>q.words).sort((a,b)=>a-b);
  report.push({region:r,level:levels[r],questions:readings.length,words:{median:percentile(counts,.5),p90:percentile(counts,.9),max:counts.at(-1)??0},scenarios:speeds.map(wpm=>({assumedWpm:wpm,over20seconds:readings.filter(q=>q.words/wpm*60>20).length})),longest:readings.sort((a,b)=>b.words-a.words).slice(0,5)});
}
const result={baseCommit:'81df14d',contentRevision:'reading-load follow-up (same commit as this report)',method:'English words in reading-choice stem plus four options, excluding answer-label letters. 120/180/240 WPM are scenario assumptions, not measured player norms. Excludes Chinese text, numbers, inference, answer entry and audio; not a CEFR-level classifier or proof of actual timeout.',baseSeconds:20,regions:report};
fs.writeFileSync('docs/question-bank-qa/reading-load/report.json',JSON.stringify(result,null,2)+'\n');
console.log(report.map(r=>`${r.level}: n=${r.questions}, median/P90/max=${r.words.median}/${r.words.p90}/${r.words.max}, >20s at 120/180/240 WPM=${r.scenarios.map(s=>s.over20seconds).join('/')}`).join('\n'));
