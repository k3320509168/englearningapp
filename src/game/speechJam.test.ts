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
  onboundary: (() => void) | null = null;
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

  // 完全不 cancel（Mac Chrome 打斷發音會讓整個瀏覽器卡死）；一直沒有任何事件，等估計的時間到才通知畫面
  it('never cancels or re-sends; reports silence only after the estimated speaking time', async () => {
    const { synth, speech } = await setup(false);
    const cancel = vi.spyOn(synth, 'cancel');
    const seen: boolean[] = [];
    speech.onSpeechJam(j => seen.push(j));
    speech.speak('Whose bag is this?');
    expect(synth.resume).toHaveBeenCalled();
    vi.advanceTimersByTime(3000);
    expect(speech.isSpeechJammed()).toBe(false);
    speech.speak('Next question.');
    expect(synth.spoken).toHaveLength(1); // 排隊，不打斷
    vi.advanceTimersByTime(3000);
    expect(cancel).not.toHaveBeenCalled();
    expect(speech.isSpeechJammed()).toBe(true);
    expect(seen).toEqual([true]);
    expect(synth.spoken).toHaveLength(2); // 估計時間到，當作唸完，送出下一句
  });

  it('a boundary or end event counts as speaking even without onstart', async () => {
    const { synth, speech } = await setup(false);
    speech.speak('Whose bag is this?');
    synth.spoken[0].onboundary?.();
    vi.advanceTimersByTime(9000);
    expect(speech.isSpeechJammed()).toBe(false);
  });

  it('the same sentence asked twice right away is spoken once, without cancelling the first', async () => {
    const { synth, speech } = await setup(false);
    const cancel = vi.spyOn(synth, 'cancel');
    speech.speak('Whose bag is this?');
    speech.speak('Whose bag is this?');
    vi.advanceTimersByTime(300);
    expect(synth.spoken).toHaveLength(1);
    expect(cancel).not.toHaveBeenCalled();
  });

  it('empty text or text without English letters is never sent to the engine', async () => {
    const { synth, speech } = await setup(false);
    speech.speak('');
    speech.speak('辦公室');
    vi.advanceTimersByTime(300);
    expect(synth.spoken).toHaveLength(0);
  });

  it('a working engine speaks once and is not jammed', async () => {
    const { synth, speech } = await setup(true);
    speech.speak('apple');
    vi.advanceTimersByTime(5000);
    expect(synth.spoken).toHaveLength(1);
    expect(speech.isSpeechJammed()).toBe(false);
  });
});
