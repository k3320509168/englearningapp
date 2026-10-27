import { useBattleStore } from '../store/battleStore';
import { isSpeechRecognitionSupported } from './speech';
import { voiceFallback } from './battle';
import { useSaveStore } from '../store/saveStore';
import { useUiStore } from '../store/uiStore';
import { clearStoryId } from './story';
import { LEVELS } from './QuestionData';
import { GOLDEN_TITLE, MAIN_TITLE } from './golden';

// 從地圖（Phaser 圓點或 React 按鈕）開始關卡的共用入口。
// 場景切換由 MapScene 訂閱 battleStore.active 處理，React 與 Phaser 不必互相呼叫。
// fromStage 未指定時從存檔進度繼續；傳 0 代表從第 1 關重新開始
// 瀏覽器不支援語音辨識，或玩家在設定中選擇暫時不用麥克風，口說題都改成拼寫題
function voiceTransform() {
  const noVoice = !isSpeechRecognitionSupported() || useSaveStore.getState().settings.voiceAsSpelling;
  return noVoice ? voiceFallback : undefined;
}

export function beginGoldenRoad() {
  useBattleStore.getState().startGoldenRoad(voiceTransform());
}

export function beginLevel(levelKey: string, fromStage?: number) {
  useBattleStore.getState().startLevel(levelKey, voiceTransform(), fromStage);
}

// 區域通關：回到世界地圖，第一次通關時播放通關劇情
export function finishRegion(levelIdx: number) {
  useBattleStore.getState().exitToMap();
  // 通關最後一個區域：主線結局，獲得稱號
  if (levelIdx === LEVELS.length - 1) useSaveStore.getState().addTitle(MAIN_TITLE);
  const id = clearStoryId(levelIdx);
  if (!useSaveStore.getState().storySeen.includes(id)) useUiStore.getState().openStory(id);
}

// 黃金之路通關：回到地圖並播放特殊結局（稱號在戰鬥結算時已經給了）
export function finishGoldenRoad() {
  useBattleStore.getState().exitToMap();
  if (useSaveStore.getState().titles.includes(GOLDEN_TITLE)) useUiStore.getState().openStory('golden-ending');
}
