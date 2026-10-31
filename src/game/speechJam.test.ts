import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// 模擬一個卡死的發音引擎：speak 之後永遠不觸發 onstart
class FakeUtterance {
  text: string;
  lang = '';
  rate = 1;
  volume = 1;
  voice: unknown = null;
  onstart: (() => void) | null = null;
  onend: (() => void) | null = null;
  onerror: ((e: unknown) => void) | null = null;
  constructor(text: string) { this.text = text; }
}

function fakeSynth(startsSpeaking: boolean) {
  const spoken: FakeUtterance[] = [];
  return {
    spoken,
    speaking: false,
    pending: false,
    paused: false,
    getVoices: () => [],
    speak(u: FakeUtterance) { spoken.push(u); this.speaking = true; if (startsSpeaking) u.onstart?.(); },
    cancel() { this.speaking = false; },
    resume: vi.fn(),
    addEventListener: () => {},
  };
}

describe('speak', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.resetModules();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  async function setup(startsSpeaking: boolean) {
    const synth = fakeSynth(startsSpeaking);
    vi.stubGlobal('window', { speechSynthesis: synth, setTimeout, clearTimeout, addEventListener: () => {} });
    vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance);
    const speech = await import('./speech');
    return { synth, speech };
  }

  it('retries a stuck engine with a new utterance, then reports it as jammed', async () => {
    const { synth, speech } = await setup(false);
    const seen: boolean[] = [];
    speech.onSpeechJam(j => seen.push(j));
    speech.speak('apple');
    expect(synth.spoken).toHaveLength(1);
    vi.advanceTimersByTime(2100);
    expect(synth.spoken).toHaveLength(2);
    expect(synth.spoken[1]).not.toBe(synth.spoken[0]); // 不重複使用被取消的 utterance
    vi.advanceTimersByTime(2000);
    expect(speech.isSpeechJammed()).toBe(true);
    expect(seen).toEqual([true]);
    expect(synth.resume).not.toHaveBeenCalled(); // 沒有暫停就不呼叫 resume
  });

  it('a working engine speaks once and is not jammed', async () => {
    const { synth, speech } = await setup(true);
    speech.speak('apple');
    vi.advanceTimersByTime(5000);
    expect(synth.spoken).toHaveLength(1);
    expect(speech.isSpeechJammed()).toBe(false);
  });
});
