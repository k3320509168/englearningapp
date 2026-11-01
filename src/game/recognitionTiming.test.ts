import { afterEach, describe, expect, it, vi } from 'vitest';

class FakeRecognition {
  static last: FakeRecognition;
  start = vi.fn(); stop = vi.fn();
  onstart = () => {}; onspeechstart = () => {}; onspeechend = () => {}; onend = () => {};
  constructor() { FakeRecognition.last = this; }
}
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });
async function setup() {
  vi.useFakeTimers(); vi.resetModules();
  vi.stubGlobal('window', { webkitSpeechRecognition: FakeRecognition, setTimeout, clearTimeout, addEventListener: () => {} });
  const { createRecognizer } = await import('./speech');
  const onPhase = vi.fn(), onError = vi.fn();
  const r = createRecognizer({ onPhase, onError, onStart: vi.fn(), onResult: vi.fn(), onEnd: vi.fn() })!;
  return { r, onPhase, onError, engine: FakeRecognition.last };
}
describe('recognition lifecycle', () => {
  it('distinguishes initialization, player speech and processing', async () => {
    const { r, engine, onPhase } = await setup();
    r.start(); expect(onPhase).toHaveBeenLastCalledWith('waiting');
    engine.onstart(); expect(onPhase).toHaveBeenLastCalledWith('speaking');
    engine.onspeechend(); expect(onPhase).toHaveBeenLastCalledWith('waiting');
    engine.onspeechstart(); expect(onPhase).toHaveBeenLastCalledWith('speaking');
    r.stop(); expect(onPhase).toHaveBeenLastCalledWith('idle');
  });
  it('ignores duplicate starts and stops permission results arriving after timeout', async () => {
    const { r, engine, onPhase } = await setup();
    r.start(); r.start(); expect(engine.start).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(10000); onPhase.mockClear();
    engine.onstart(); expect(onPhase).not.toHaveBeenCalledWith('speaking');
    expect(engine.stop).toHaveBeenCalled();
  });
  it('reports a stuck initialization instead of waiting indefinitely', async () => {
    const { r, onError, onPhase } = await setup();
    r.start(); vi.advanceTimersByTime(10000);
    expect(onError).toHaveBeenCalledWith('startup-timeout');
    expect(onPhase).toHaveBeenLastCalledWith('idle');
  });
});
