// 瀏覽器內建語音（Web Speech API）的薄包裝。之後接 Whisper 備援時，從這裡擴充。
import { duckMusic, holdMusic } from './music';
import { muteSfx } from './sfx';

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

// 發音佇列（2026-10-31，和 ChatGPT 第十輪討論後定案）：
// Mac 的 Chrome 上「打斷正在唸或還沒開始的發音」（speechSynthesis.cancel）會讓整個瀏覽器的發音卡死，
// 要把 Chrome 完全結束才會恢復——玩家答得越快越容易踩到。所以遊戲完全不呼叫 cancel：
// - 上一句還在唸，新的一句先排隊，等唸完再送出；排隊只留最新的一句（舊的還沒輪到就丟掉，不會越積越多）。
// - 每一句都用新的 utterance，唸完之前一直保留參考（被回收的話 Chrome 的事件會不見、佇列跟著卡住）。
// - 收不到「唸完」的通知時，依句子長度估計時間，到了就當作唸完、繼續下一句；完全沒有任何事件才通知畫面。
export interface SpeechLifecycle { onStart: (estimatedDurationMs: number) => void; onEnd: () => void }
interface SpeakRequest { lifecycle?: SpeechLifecycle; text: string; rate: number; volume: number; slow: boolean; voiceName?: string; slowRate: number }
let playing: SpeechSynthesisUtterance | null = null;
let queued: SpeakRequest | null = null;
const keepAlive = new Set<SpeechSynthesisUtterance>();

// 瀏覽器的發音引擎卡死（Mac 的 Chrome 曾發生：speaking 一直是 true，卻永遠不開始唸，同一個瀏覽器的所有分頁都一樣）。
// 偵測到時通知畫面：聽力題改成直接顯示英文，並提示重新整理或重開瀏覽器。成功唸出一句就解除
let jammed = false;
const jamListeners = new Set<(jammed: boolean) => void>();
export const isSpeechJammed = () => jammed;
export function onSpeechJam(fn: (jammed: boolean) => void): () => void {
  jamListeners.add(fn);
  return () => { jamListeners.delete(fn); };
}
function setJammed(value: boolean) {
  if (jammed === value) return;
  jammed = value;
  jamListeners.forEach(fn => fn(value));
}

// 瀏覽器規定頁面被點過之前不能發音（例如一進戰鬥就自動唸題目）：被擋下的那一句，等第一次點擊或按鍵時補唸
let blocked: { replay: () => void; at: number } | null = null;
const BLOCKED_REPLAY_MS = 10_000;
if (typeof window !== 'undefined') {
  const replay = () => {
    const b = blocked;
    blocked = null;
    if (b && Date.now() - b.at < BLOCKED_REPLAY_MS) b.replay();
  };
  window.addEventListener?.('pointerdown', replay, true);
  window.addEventListener?.('keydown', replay, true);
}

// 估計唸完要多久（毫秒）：約每個字元 90ms，語速越慢越久，再加 3 秒緩衝
const estimateMs = (text: string, rate: number) => 3000 + (text.length * 90) / Math.max(0.3, rate);

function play(r: SpeakRequest) {
  const synth = window.speechSynthesis;
  // Chrome（尤其 Mac）的已知問題：語音引擎有時卡在暫停狀態，之後按什麼都不會唸，先恢復
  if (synth.paused) synth.resume();
  const text = speakableText(r.slow ? slowText(r.text) : r.text);
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'en-US';
  const voice = pickVoice(r.slow, r.voiceName);
  if (voice) u.voice = voice;
  u.rate = r.slow ? r.slowRate : r.rate;
  u.volume = r.volume;
  playing = u;
  keepAlive.add(u);
  // 發音時壓低背景音樂，唸完再恢復
  duckMusic(true);
  // Mac Chrome 有時不觸發 onstart，但有在唸：開始、字詞邊界、結束任一個事件都算「有聲音」
  let alive = false;
  const heard = () => { alive = true; setJammed(false); };
  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    r.lifecycle?.onEnd();
    keepAlive.delete(u);
    if (playing !== u) return;
    playing = null;
    if (queued) { const next = queued; queued = null; play(next); }
    else duckMusic(false);
  };
  u.onstart = () => { heard(); r.lifecycle?.onStart((text.length * 90) / Math.max(0.3, u.rate)); };
  u.onboundary = heard;
  u.onend = () => { heard(); finish(); };
  u.onerror = (e: SpeechSynthesisErrorEvent) => {
    // 頁面還沒被點過，瀏覽器不讓發音：等第一次點擊時補唸
    if (e?.error === 'not-allowed') blocked = { replay: () => speak(r.text, r.rate, r.volume, r.slow, r.voiceName, r.slowRate, r.lifecycle), at: Date.now() };
    finish();
  };
  synth.speak(u);
  // 和 main 版一樣：speak 之後 resume（Mac Chrome 引擎停在暫停時需要；沒暫停時沒有作用）
  synth.resume();
  window.setTimeout(() => {
    if (done) return;
    // 一直沒有任何事件：通知畫面（聽力題改顯示英文）。不取消，直接當作唸完，讓下一句可以送出
    if (!alive && !blocked) setJammed(true);
    finish();
  }, estimateMs(text, u.rate));
}

// rate：正常語速；slowRate：慢速語速（兩個分開設定，調其中一個不會影響另一個）
// 同一句話在很短的時間內又被要求唸一次（開發模式 React StrictMode 會把效果執行兩次、玩家連點按鈕）：直接忽略
const REPEAT_IGNORE_MS = 400;
let lastRequest = { key: '', at: 0 };

export function speak(text: string, rate = 1, volume = 1, slow = false, voiceName?: string, slowRate = SLOW_RATE, lifecycle?: SpeechLifecycle) {
  if (!('speechSynthesis' in window)) return;
  // 空白或沒有英文字母（例如中文選項）：不送出。英文語音唸不出來，Chrome 也不會觸發任何事件
  if (!/[A-Za-z]/.test(text ?? '')) return;
  const key = `${slow ? 'slow' : 'normal'}|${text}`;
  const now = Date.now();
  if (key === lastRequest.key && now - lastRequest.at < REPEAT_IGNORE_MS) return;
  lastRequest = { key, at: now };
  const request = { text, rate, volume, slow, voiceName, slowRate, lifecycle };
  // 上一句還在唸：排隊（只留最新的一句），不打斷
  if (playing) { queued = request; return; }
  play(request);
}

// 不要再唸排隊中的句子（切換分頁、開始錄音時）。正在唸的那一句讓它唸完，不打斷
export function stopSpeaking() {
  queued = null;
}

// 等目前這一句唸完（最多 maxWait 毫秒）再做事：開始錄音前用，避免麥克風收到遊戲自己的語音
export function whenSilent(fn: () => void, maxWait = 3000) {
  if (!playing) { fn(); return; }
  const until = Date.now() + maxWait;
  const check = () => (!playing || Date.now() >= until ? fn() : window.setTimeout(check, 100));
  window.setTimeout(check, 100);
}

// 語音辨識錯誤的說明（給玩家看）；aborted 是自己停止的，不用顯示
export function recognitionErrorText(err: string): string {
  switch (err) {
    case 'aborted': return '';
    case 'no-speech': return '沒有聽到聲音，再試一次';
    case 'audio-capture': return '麥克風被其他程式或分頁占用（例如視訊會議），關掉後再試一次';
    case 'network': return '連不上語音辨識服務，請檢查網路後再試一次';
    case 'not-allowed': return '請允許瀏覽器使用麥克風';
    case 'service-not-allowed': return '瀏覽器不允許語音辨識服務（Safari 請到系統設定開啟 Siri／聽寫），也可以改用拼寫作答';
    default: return `辨識失敗（${err}），再試一次`;
  }
}

function getRecognitionCtor(): any {
  return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null;
}

export function isSpeechRecognitionSupported(): boolean {
  return getRecognitionCtor() !== null;
}

// 收音：Chrome 電腦版預設「一停頓就結束」，唸長字（helicopter）時常只送出開頭的 "Hel"。
// 改成持續收音、累積所有結果：停下來 SILENCE_MS 沒有新聲音才結束，最長 MAX_LISTEN_MS；
// 一聽到對的答案（accept）就立刻結束、回報答對，不用等停頓
export const SILENCE_MS = 1300;
export const MAX_LISTEN_MS = 7000;

export function createRecognizer(handlers: {
  onStart: () => void;
  onPhase?: (phase: 'waiting' | 'speaking' | 'idle') => void;
  onResult: (transcripts: string[]) => void; // 辨識結果的所有候選（第一個是整段最可能的內容）
  onError: (error: string) => void;
  onEnd: () => void;
  accept?: (transcripts: string[]) => boolean; // 聽到對的答案就提早結束
}): Recognizer | null {
  const Ctor = getRecognitionCtor();
  if (!Ctor) return null;
  const recognition = new Ctor();
  recognition.lang = 'en-US';
  recognition.continuous = true;
  recognition.interimResults = true;
  // 多拿幾個候選：發音正確但被辨識成相近的字時，其他候選常常就是正確答案
  recognition.maxAlternatives = 5;
  // 這一次收音聽到的內容：每一段結果的所有候選
  let segments: string[][] = [];
  let delivered = false;
  let generation = 0;
  let silence: number | undefined;
  let limit: number | undefined;
  let startup: number | undefined;
  const candidates = () => {
    const whole = segments.map(alts => alts[0] ?? '').join(' ').trim();
    return [whole, ...segments.flat()].filter((t, i, all) => t && all.indexOf(t) === i);
  };
  const deliver = () => {
    if (delivered) return;
    const list = candidates();
    if (!list.length) return;
    delivered = true;
    handlers.onResult(list);
  };
  const clearTimers = () => { window.clearTimeout(silence); window.clearTimeout(limit); window.clearTimeout(startup); };
  const finish = () => { clearTimers(); try { recognition.stop(); } catch { /* 已經停了 */ } };
  recognition.onstart = () => {
    window.clearTimeout(startup);
    segments = [];
    delivered = false;
    limit = window.setTimeout(finish, MAX_LISTEN_MS);
    handlers.onPhase?.('speaking');
    handlers.onStart();
  };
  recognition.onspeechstart = () => handlers.onPhase?.('speaking');
  recognition.onspeechend = () => handlers.onPhase?.('waiting');
  recognition.onresult = (event: any) => {
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      const alts: string[] = [];
      for (let k = 0; k < result.length; k++) alts.push(result[k].transcript.trim());
      segments[i] = alts;
    }
    if (handlers.accept?.(candidates())) { deliver(); finish(); return; }
    // 還在講：等停頓夠久才結束
    window.clearTimeout(silence);
    silence = window.setTimeout(finish, SILENCE_MS);
  };
  // 聆聽時背景音樂與音效靜音：Mac 的喇叭就在麥克風旁邊，音樂會一起被收進去，辨識就會錯
  let holding = false;
  const hold = (on: boolean) => {
    if (holding === on) return;
    holding = on;
    holdMusic(on);
    muteSfx(on);
  };
  recognition.onerror = (event: any) => {
    clearTimers();
    hold(false);
    handlers.onPhase?.('idle');
    // 有聽到東西就照常判斷（例如講完之後才逾時）；什麼都沒聽到才回報錯誤
    if (candidates().length && event.error !== 'aborted') deliver();
    else handlers.onError(event.error);
  };
  recognition.onend = () => { clearTimers(); hold(false); handlers.onPhase?.('idle'); deliver(); handlers.onEnd(); };
  return {
    start: () => {
      // 不打斷遊戲正在唸的句子：清掉排隊的，等這一句唸完（最多 3 秒）再開始收音
      const request = ++generation;
      handlers.onPhase?.('waiting');
      window.clearTimeout(startup);
      startup = window.setTimeout(() => {
        generation++;
        clearTimers(); hold(false); delivered = true;
        handlers.onPhase?.('idle');
        try { recognition.stop(); } catch { /* 尚未啟動 */ }
        handlers.onError('audio-capture');
      }, 10_000);
      stopSpeaking();
      whenSilent(() => {
        if (request !== generation) return;
        hold(true);
        try { recognition.start(); } catch { /* 已在錄音中 */ }
      });
    },
    stop: () => { generation++; handlers.onPhase?.('idle'); clearTimers(); hold(false); delivered = true; try { recognition.stop(); } catch { /* 已經停了 */ } },
  };
}
