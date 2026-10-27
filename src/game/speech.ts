// 瀏覽器內建語音（Web Speech API）的薄包裝。之後接 Whisper 備援時，從這裡擴充。

/* eslint-disable @typescript-eslint/no-explicit-any */
export interface Recognizer {
  start: () => void;
  stop: () => void;
}

export const SLOW_RATE = 0.5;

// 挑選英文語音。慢速時優先用本機語音：Chrome 的線上語音（Google US English）
// 幾乎不理會語速設定，放慢後聽起來跟原速差不多。
function pickVoice(slow: boolean): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices().filter(v => v.lang.replace('_', '-').startsWith('en'));
  const us = voices.filter(v => v.lang.replace('_', '-') === 'en-US');
  const pool = us.length ? us : voices;
  if (slow) return pool.find(v => v.localService) ?? pool[0];
  return pool.find(v => v.default) ?? pool[0];
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

export function speak(text: string, rate = 1, volume = 1, slow = false) {
  if (!('speechSynthesis' in window)) return;
  const synth = window.speechSynthesis;
  const busy = synth.speaking || synth.pending;
  synth.cancel();
  window.clearTimeout(pending);
  const utterance = new SpeechSynthesisUtterance(speakableText(text));
  utterance.lang = 'en-US';
  const voice = pickVoice(slow);
  if (voice) utterance.voice = voice;
  utterance.rate = slow ? SLOW_RATE : rate;
  utterance.volume = volume;
  current = utterance;
  const start = () => { if (current === utterance) synth.speak(utterance); };
  if (busy) pending = window.setTimeout(start, 120);
  else start();
}

function getRecognitionCtor(): any {
  return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null;
}

export function isSpeechRecognitionSupported(): boolean {
  return getRecognitionCtor() !== null;
}

export function createRecognizer(handlers: {
  onStart: () => void;
  onResult: (transcript: string) => void;
  onError: (error: string) => void;
  onEnd: () => void;
}): Recognizer | null {
  const Ctor = getRecognitionCtor();
  if (!Ctor) return null;
  const recognition = new Ctor();
  recognition.lang = 'en-US';
  recognition.interimResults = false;
  recognition.onstart = handlers.onStart;
  recognition.onresult = (event: any) => handlers.onResult(event.results[0][0].transcript);
  recognition.onerror = (event: any) => handlers.onError(event.error);
  recognition.onend = handlers.onEnd;
  return {
    start: () => { try { recognition.start(); } catch { /* 已在錄音中 */ } },
    stop: () => recognition.stop(),
  };
}
