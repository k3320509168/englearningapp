// 只有 Vite dev 才可使用；不加入正式網站入口。以真實 BattleHUD 顯示題庫 fixture。
import { initialSave, useSaveStore } from '../../src/store/saveStore';
import { useBattleStore } from '../../src/store/battleStore';
import { useUiStore } from '../../src/store/uiStore';
import { DEFAULT_CHARACTER } from '../../src/game/character';
import { ALL_HINTS } from '../../src/game/hints';
import { LEVELS } from '../../src/game/QuestionData';
import { loadBank } from '../../src/game/questions/bank/loader';
import { voiceFallback } from '../../src/game/battle';
import type { Question } from '../../src/game/types';
if (!import.meta.env.DEV) throw new Error('Question QA is only available in development.');
useSaveStore.persist.setOptions({name:'english-rpg-question-qa'});
useSaveStore.setState({...initialSave, character:{...DEFAULT_CHARACTER,name:'題庫 QA'}, tutorialDone:true, prologueDone:true, hintsSeen:ALL_HINTS, unlockedIndex:8, player:{...initialSave.player,level:180}, settings:{...initialSave.settings,showLessons:false,autoSpeak:false,voiceAsSpelling:true,musicVolume:0}});
await import('../../src/main');
const region=document.querySelector<HTMLSelectElement>('#qa-region')!;
const skill=document.querySelector<HTMLSelectElement>('#qa-skill')!;
const status=document.querySelector<HTMLSpanElement>('#qa-status')!;
let list:Question[]=[];
let index=0;
async function show() {
 useBattleStore.getState().exitToMap();
 await new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve())));
 const q=list[index%list.length];
 if(!q)return;
 const r=Number(region.value);
 useUiStore.setState({modal:null,celebrations:[],hintOpen:false,retreatAsk:false});
 useBattleStore.getState().startLevel(LEVELS[r],voiceFallback,0);
 // 凍結題目時間以便量測版面，不模擬玩家速度；計時合理性另由紙上與程式模擬驗收。
 useBattleStore.setState({question:voiceFallback(q),phase:'answering',questionLimit:3_600_000,questionLeft:3_600_000,typed:'',questionSeq:useBattleStore.getState().questionSeq+1});
 status.textContent=`r${r} ${skill.value} ${index%list.length+1}/${list.length}｜原題 difficulty ${q.difficulty}｜版面檢查延長倒數`;
}
document.querySelector<HTMLButtonElement>('#qa-show')!.onclick=async()=>{
 const r=Number(region.value);await loadBank(r);
 const response=await fetch(`/src/game/questions/bank/r${r}.json?raw-qa`);
 const bank=await response.json() as {normal:Question[];boss:Question[]};
 list=[...bank.normal,...bank.boss].filter(q=>q.skill===skill.value).sort((a,b)=>b.desc.length-a.desc.length);
 index=0;show();
};
document.querySelector<HTMLButtonElement>('#qa-next')!.onclick=()=>{index++;show();};
