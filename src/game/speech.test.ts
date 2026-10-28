import { describe, expect, it, vi } from 'vitest';

const voice = (name: string, localService = true, lang = 'en-US') => ({ name, localService, lang, default: false, voiceURI: name }) as SpeechSynthesisVoice;
// iPhone 常見的語音清單：同一個人聲有一般版和高品質版
const IPHONE_VOICES = [voice('Samantha (Enhanced)'), voice('Samantha'), voice('Ava (Premium)'), voice('Bubbles'), voice('Daniel', true, 'en-GB')];
// 記錄每次送進語音引擎的語速
const spoken: { text: string; rate: number }[] = [];
const synth = { getVoices: () => IPHONE_VOICES, speaking: false, pending: false, paused: false, cancel() {}, resume() {}, speak(u: { text: string; rate: number }) { spoken.push({ text: u.text, rate: u.rate }); } };
vi.stubGlobal('window', { speechSynthesis: synth, setTimeout: () => 0, clearTimeout: () => undefined });
vi.stubGlobal('SpeechSynthesisUtterance', class { text: string; rate = 1; volume = 1; lang = ''; voice: unknown = null; onend: unknown; onerror: unknown; constructor(t: string) { this.text = t; } });

const { pickVoice, slowText, honorsRate, speak } = await import('./speech');

describe('慢速發音', () => {
  it('句子在字與字之間加停頓，單字不變', () => {
    expect(slowText('We eat rice with dinner.')).toBe('We, eat, rice, with, dinner.');
    expect(slowText('rice')).toBe('rice');
    expect(slowText('Hello, how are you?')).toBe('Hello, how, are, you?');
  });

  it('高品質語音（Enhanced、Premium、Google）不理會語速，慢速時改用同一個人聲的一般版本', () => {
    expect(honorsRate(voice('Samantha (Enhanced)'))).toBe(false);
    expect(honorsRate(voice('Google US English', false))).toBe(false);
    expect(honorsRate(voice('Samantha'))).toBe(true);
    expect(pickVoice(false)?.name).toBe('Samantha (Enhanced)');
    expect(pickVoice(true)?.name).toBe('Samantha');
    expect(pickVoice(true, 'Ava (Premium)')?.name).toBe('Samantha'); // 沒有一般版的 Ava 時退回最清楚的一般語音
  });

  it('不會挑到趣味語音', () => {
    expect(pickVoice(false)?.name).not.toBe('Bubbles');
    expect(pickVoice(true)?.name).not.toBe('Bubbles');
  });
});

describe('正常語速與慢速語速分開', () => {
  it('調整正常語速不會影響慢速，反之亦然', () => {
    spoken.length = 0;
    speak('rice', 1.2, 1, false, undefined, 0.4);
    speak('rice', 1.2, 1, true, undefined, 0.4);
    speak('rice', 0.7, 1, true, undefined, 0.4);
    expect(spoken.map(x => x.rate)).toEqual([1.2, 0.4, 0.4]);
  });
});
