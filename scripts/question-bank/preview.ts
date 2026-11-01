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
 const four=document.querySelector<HTMLSelectElement>('#qa-team')!.value==='4';
 useSaveStore.setState({heroes:four?['knight','cat','book']:['knight'],party:four?['player','knight','cat','book']:['player','knight']});
 useUiStore.setState({modal:null,celebrations:[],hintOpen:false,retreatAsk:false});
 useBattleStore.getState().startLevel(LEVELS[r],voiceFallback,0);
 // 凍結題目時間以便量測版面，不模擬玩家速度；計時合理性另由紙上與程式模擬驗收。
 useBattleStore.setState({question:voiceFallback(q),original:q,phase:'answering',questionLimit:3_600_000,questionLeft:3_600_000,typed:'',questionSeq:useBattleStore.getState().questionSeq+1});
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

// 測試控制採實際 UI 按鈕；不以瀏覽器 evaluate 改動正式存檔或繞過互動。
document.querySelector<HTMLButtonElement>('#qa-map')!.onclick=()=>{
 useBattleStore.getState().exitToMap();
 useUiStore.setState({modal:null,celebrations:[],hintOpen:false,retreatAsk:false});
};
document.querySelector<HTMLButtonElement>('#qa-settings')!.onclick=()=>useUiStore.getState().openModal('settings');
document.querySelector<HTMLButtonElement>('#qa-hide')!.onclick=()=>{
 document.querySelector<HTMLElement>('#qa-controls')!.style.display='none';
 window.scrollTo(0,0);
};
// 工具收起後不保留浮動按鈕，也不增加文件高度；僅本地QA頁有這個快捷鍵。
window.addEventListener('keydown',event=>{
 if(event.key!=='F8'&&!(event.ctrlKey&&event.altKey&&(event.code==='KeyQ'||event.key.toLowerCase()==='q')))return;
 event.preventDefault();
 const controls=document.querySelector<HTMLElement>('#qa-controls')!;
 controls.style.display=controls.style.display==='none'?'flex':'none';
});

// 只校準結算 UI：獨立存檔的首領剩1HP，仍須在遊戲按鈕真正答對才結算。
document.querySelector<HTMLButtonElement>('#qa-boss')!.onclick=async()=>{
 const r=Number(region.value); await loadBank(r);
 useBattleStore.getState().exitToMap();
 await new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve())));
 useUiStore.setState({modal:null,celebrations:[],hintOpen:false,retreatAsk:false});
 useBattleStore.getState().startLevel(LEVELS[r],voiceFallback,19);
 const q=list[index%list.length]??useBattleStore.getState().question;
 const stages=useBattleStore.getState().stages.map((stage,i)=>i===19?{...stage,hp:1}:stage);
 useBattleStore.setState({stages,monsterHp:1,...(q?{question:voiceFallback(q),original:q}:{}),phase:'answering',questionLimit:3_600_000,questionLeft:3_600_000,typed:''});
 status.textContent='版面專用：首領1HP，請真正答對後檢查結算；不作平衡驗收';
};
