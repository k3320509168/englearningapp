// 瀏覽器內建語音（Web Speech API）的薄包裝。之後接 Whisper 備援時，從這裡擴充。
import { duckMusic } from './music';

/* eslint-disable @typescript-eslint/no-explicit-any */
export interface Recognizer {
  start: () => void;
  stop: () => void;
}

export const SLOW_RATE = 0.5;

// macOS 內建很多「趣味語音」（Bubbles、Bad News…）和機器人感很重的舊語音，系統預設甚至可能是它們，
// 用來教發音完全不行，一律排除
const NOVELTY = /albert|bad news|bahh|bells|boing|bubbles|cellos|deranged|good news|hysterical|jester|organ|superstar|trinoids|whisper|wobble|zarvox|junior|ralph|kathy|fred|princess|grandma|grandpa|eddy|flo|reed|rocko|sandy|shelley/i;

// 清晰度排名：越前面越自然。本機語音（Samantha、Microsoft 等）會確實遵守語速，慢速才聽得出差別
const PREFERRED = [
  /samantha/i, /ava/i, /allison/i, /susan/i, /\balex\b/i,                 // macOS／iOS
  /microsoft (aria|jenny|guy|ana).*natural/i, /microsoft (aria|jenny)/i,  // Windows 的自然語音
  /microsoft (zira|david|mark)/i,
  /google us english/i,                                                  // Chrome 線上語音：清楚，但不太理會語速
  /karen|daniel|moira|tessa|serena/i,                                     // 其他英文腔
];

// 這台裝置有沒有英文語音（沒有的話聽力題要改成顯示單字）。
// 語音清單是非同步載入的：清單還是空的時候，最多等 1.5 秒（VOICE_WAIT_MS）；之後還是空的就當作沒有
export const VOICE_WAIT_MS = 1500;
let voicesSettled = false;
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  window.speechSynthesis.addEventListener?.('voiceschanged', () => { voicesSettled = true; });
  window.setTimeout(() => { voicesSettled = true; }, VOICE_WAIT_MS);
}

export function hasEnglishVoice(): boolean {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false;
  const all = window.speechSynthesis.getVoices();
  if (all.length === 0) return !voicesSettled;
  return all.some(v => v.lang.replace('_', '-').toLowerCase().startsWith('en'));
}

export function englishVoices(): SpeechSynthesisVoice[] {
  if (!('speechSynthesis' in window)) return [];
  return window.speechSynthesis.getVoices()
    .filter(v => v.lang.replace('_', '-').toLowerCase().startsWith('en') && !NOVELTY.test(v.name));
}

const rank = (v: SpeechSynthesisVoice) => {
  const i = PREFERRED.findIndex(re => re.test(v.name));
  const us = v.lang.replace('_', '-') === 'en-US' ? 0 : 0.5;
  return (i < 0 ? PREFERRED.length : i) + us;
};

// 不理會語速設定的語音：Chrome 的 Google 線上語音、iPhone／Mac 的高品質語音（Enhanced、Premium、Siri）
// 以及 Windows 的線上自然語音。放慢時改用一般的本機語音，慢速才聽得出差別
const IGNORES_RATE = /google|enhanced|premium|siri|neural|natural|online/i;
export const honorsRate = (v: SpeechSynthesisVoice) => v.localService && !IGNORES_RATE.test(v.name);

// 挑選語音：玩家在設定選過就用那個；否則選清晰度最高的
export function pickVoice(slow: boolean, preferred?: string): SpeechSynthesisVoice | undefined {
  const voices = englishVoices();
  const chosen = preferred ? voices.find(v => v.name === preferred) : undefined;
  const sorted = [...voices].sort((a, b) => rank(a) - rank(b));
  if (slow) {
    if (chosen && honorsRate(chosen)) return chosen;
    // 優先找同一個人聲的一般版本（例如 Samantha (Enhanced) → Samantha），聽起來才一致
    const base = chosen ?? sorted[0];
    const family = base?.name.split(/[\s(]/)[0];
    return voices.find(v => honorsRate(v) && family && v.name.startsWith(family))
      ?? sorted.find(honorsRate) ?? sorted.find(v => v.localService) ?? sorted[0];
  }
  return chosen ?? sorted[0];
}

// 慢速的句子：在字與字之間加停頓（逗號），就算語音引擎不理會語速，聽起來也確實一個字一個字慢慢唸
export function slowText(text: string): string {
  const words = text.trim().split(/\s+/);
  if (words.length < 2) return text;
  return words.map((w, i) => (i < words.length - 1 && !/[,.!?;:]$/.test(w) ? `${w},` : w)).join(' ');
}

// 讓語音引擎唸得自然：「thank you」這種沒有標點的小寫短語，常被唸成拖長的問句語調。
// 首字大寫並補上句點，就會用一般的陳述語調唸出來。
export function speakableText(text: string): string {
  const t = text.trim();
  if (!t) return t;
  const capitalized = t[0].toUpperCase() + t.slice(1);
  return /[.!?]$/.test(capitalized) ? capitalized : `${capitalized}.`;
}

// Chrome 的已知問題：cancel() 後立刻 speak()，開頭常會被吃掉（例如「thank」只剩「ank」）。
// 正在播放時先取消，等一下再唸。
let pending: number | undefined;
// 保留目前的 utterance，避免被回收後播到一半中斷
let current: SpeechSynthesisUtterance | null = null;

// rate：正常語速；slowRate：慢速語速（兩個分開設定，調其中一個不會影響另一個）
export function speak(text: string, rate = 1, volume = 1, slow = false, voiceName?: string, slowRate = SLOW_RATE) {
  if (!('speechSynthesis' in window)) return;
  const synth = window.speechSynthesis;
  const busy = synth.speaking || synth.pending;
  synth.cancel();
  // Chrome（尤其 Mac）的已知問題：語音引擎有時卡在暫停狀態，之後按什麼都不會唸，先恢復
  if (synth.paused) synth.resume();
  window.clearTimeout(pending);
  const utterance = new SpeechSynthesisUtterance(speakableText(slow ? slowText(text) : text));
  utterance.lang = 'en-US';
  const voice = pickVoice(slow, voiceName);
  if (voice) utterance.voice = voice;
  utterance.rate = slow ? slowRate : rate;
  utterance.volume = volume;
  current = utterance;
  // 發音時壓低背景音樂，唸完再恢復
  duckMusic(true);
  utterance.onend = utterance.onerror = () => { if (current === utterance) duckMusic(false); };
  const start = () => {
    if (current !== utterance) return;
    synth.speak(utterance);
    synth.resume();
    // 保險：1.5 秒後還沒開始唸（引擎卡住），重設一次再唸
    window.setTimeout(() => {
      if (current === utterance && !synth.speaking && !synth.pending) { synth.cancel(); synth.speak(utterance); }
    }, 1500);
  };
  if (busy) pending = window.setTimeout(start, 120);
  else start();
}

// 開始錄音前停止發音，避免麥克風把遊戲自己的語音也收進去
export function stopSpeaking() {
  if (!('speechSynthesis' in window)) return;
  window.clearTimeout(pending);
  current = null;
  window.speechSynthesis.cancel();
  duckMusic(false);
}

function getRecognitionCtor(): any {
  return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null;
}

export function isSpeechRecognitionSupported(): boolean {
  return getRecognitionCtor() !== null;
}

export function createRecognizer(handlers: {
  onStart: () => void;
  onResult: (transcripts: string[]) => void; // 辨識結果的所有候選（第一個最可能）
  onError: (error: string) => void;
  onEnd: () => void;
}): Recognizer | null {
  const Ctor = getRecognitionCtor();
  if (!Ctor) return null;
  const recognition = new Ctor();
  recognition.lang = 'en-US';
  recognition.interimResults = false;
  // 多拿幾個候選：發音正確但被辨識成相近的字時，其他候選常常就是正確答案
  recognition.maxAlternatives = 5;
  recognition.onstart = handlers.onStart;
  recognition.onresult = (event: any) => {
    const result = event.results[0];
    const list: string[] = [];
    for (let i = 0; i < result.length; i++) list.push(result[i].transcript);
    handlers.onResult(list);
  };
  recognition.onerror = (event: any) => handlers.onError(event.error);
  recognition.onend = handlers.onEnd;
  return {
    start: () => { stopSpeaking(); try { recognition.start(); } catch { /* 已在錄音中 */ } },
    stop: () => recognition.stop(),
  };
}
