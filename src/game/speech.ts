// 瀏覽器內建語音（Web Speech API）的薄包裝。之後接 Whisper 備援時，從這裡擴充。

/* eslint-disable @typescript-eslint/no-explicit-any */
export interface Recognizer {
  start: () => void;
  stop: () => void;
}

export function speak(text: string, rate = 1, volume = 1) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.rate = rate;
  utterance.volume = volume;
  window.speechSynthesis.speak(utterance);
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
