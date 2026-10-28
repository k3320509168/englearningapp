import { describe, expect, it, vi } from 'vitest';

const voice = (name: string, localService = true, lang = 'en-US') => ({ name, localService, lang, default: false, voiceURI: name }) as SpeechSynthesisVoice;
// iPhone 常見的語音清單：同一個人聲有一般版和高品質版
const IPHONE_VOICES = [voice('Samantha (Enhanced)'), voice('Samantha'), voice('Ava (Premium)'), voice('Bubbles'), voice('Daniel', true, 'en-GB')];
vi.stubGlobal('window', { speechSynthesis: { getVoices: () => IPHONE_VOICES } });

const { pickVoice, slowText, honorsRate } = await import('./speech');

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
