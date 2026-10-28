// 音效：全部用 Web Audio 即時合成（8-bit 風格），不需要音檔。
// 瀏覽器要求使用者互動後才能播放聲音；第一次點擊或按鍵後自動啟用。

let audio: AudioContext | null = null;
let master: GainNode | null = null;
let volume = 0.7;

function ctx(): AudioContext | null {
  if (typeof window === 'undefined' || !('AudioContext' in window)) return null;
  if (!audio) {
    audio = new AudioContext();
    master = audio.createGain();
    master.gain.value = volume;
    master.connect(audio.destination);
  }
  if (audio.state === 'suspended') void audio.resume();
  return audio;
}

export function setSfxVolume(v: number) {
  volume = v;
  if (master) master.gain.value = v;
}

interface ToneOpts {
  type?: OscillatorType;
  freq: number;
  to?: number;
  dur: number;
  gain?: number;
  delay?: number;
}

function tone({ type = 'square', freq, to, dur, gain = 0.2, delay = 0 }: ToneOpts) {
  const ac = ctx();
  if (!ac || !master || volume <= 0) return;
  const t0 = ac.currentTime + delay;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (to) osc.frequency.exponentialRampToValueAtTime(Math.max(20, to), t0 + dur);
  g.gain.setValueAtTime(gain, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(master);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

let noiseBuffer: AudioBuffer | null = null;

interface NoiseOpts {
  dur: number;
  gain?: number;
  from?: number;
  to?: number;
  delay?: number;
  type?: BiquadFilterType;
}

function noise({ dur, gain = 0.25, from = 4000, to = 300, delay = 0, type = 'lowpass' }: NoiseOpts) {
  const ac = ctx();
  if (!ac || !master || volume <= 0) return;
  if (!noiseBuffer) {
    noiseBuffer = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  const t0 = ac.currentTime + delay;
  const src = ac.createBufferSource();
  src.buffer = noiseBuffer;
  const filter = ac.createBiquadFilter();
  filter.type = type;
  filter.frequency.setValueAtTime(from, t0);
  filter.frequency.exponentialRampToValueAtTime(Math.max(40, to), t0 + dur);
  const g = ac.createGain();
  g.gain.setValueAtTime(gain, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(filter).connect(g).connect(master);
  src.start(t0);
  src.stop(t0 + dur + 0.02);
}

export const sfx = {
  // 打對一個字母：短促、音高隨進度上升，越打越有「蓄力」感
  key(progress: number) {
    tone({ freq: 520 + progress * 600, dur: 0.05, gain: 0.08 });
  },
  slash() {
    noise({ dur: 0.14, gain: 0.3, from: 9000, to: 1200, type: 'highpass' });
    tone({ type: 'sawtooth', freq: 900, to: 220, dur: 0.1, gain: 0.08 });
  },
  // pitch：combo 越高打擊音越高（每 combo 升半音，最多一個八度）
  hit(power = 1, pitch = 1) {
    noise({ dur: 0.18 + power * 0.08, gain: 0.35, from: 2500 * pitch, to: 120 });
    tone({ freq: 200 * pitch, to: 50, dur: 0.16, gain: 0.25 });
  },
  crit(pitch = 1) {
    this.hit(1.4, pitch);
    tone({ type: 'square', freq: 1400, to: 2200, dur: 0.12, gain: 0.12, delay: 0.02 });
    tone({ type: 'triangle', freq: 90, to: 40, dur: 0.35, gain: 0.35 });
  },
  kill() {
    noise({ dur: 0.5, gain: 0.35, from: 3000, to: 60 });
    [523, 659, 784, 1047].forEach((f, i) => tone({ freq: f, dur: 0.09, gain: 0.1, delay: 0.08 + i * 0.06 }));
  },
  hurt() {
    tone({ type: 'sawtooth', freq: 260, to: 70, dur: 0.28, gain: 0.22 });
    noise({ dur: 0.2, gain: 0.25, from: 1500, to: 100 });
  },
  wrong() {
    tone({ type: 'square', freq: 180, dur: 0.09, gain: 0.12 });
    tone({ type: 'square', freq: 140, dur: 0.14, gain: 0.12, delay: 0.09 });
  },
  // 蓄力釋放：衝刺前的短促上滑音，越高的 combo 越長越亮
  release(tier: number) {
    tone({ type: 'sawtooth', freq: 220, to: 880 + tier * 220, dur: 0.12 + tier * 0.02, gain: 0.07 });
    if (tier >= 2) noise({ dur: 0.15, gain: 0.12, from: 6000, to: 12000, type: 'bandpass' });
  },
  // 高 combo 命中時疊上的和弦：等級越高音越多（大三和弦往上疊）
  comboChord(tier: number, pitch = 1) {
    if (tier <= 0) return;
    const notes = [1, 1.26, 1.5, 2, 2.52].slice(0, Math.min(5, tier + 1));
    notes.forEach((r, i) => tone({ type: 'triangle', freq: 523 * pitch * r, dur: 0.22, gain: 0.07, delay: 0.03 + i * 0.025 }));
    if (tier >= 3) tone({ type: 'sine', freq: 2093 * pitch, to: 3136 * pitch, dur: 0.4, gain: 0.05, delay: 0.1 });
  },
  thunder() {
    noise({ dur: 0.45, gain: 0.3, from: 5000, to: 80 });
    tone({ type: 'square', freq: 70, to: 35, dur: 0.4, gain: 0.18 });
  },
  coin() {
    tone({ freq: 988, dur: 0.06, gain: 0.1 });
    tone({ freq: 1319, dur: 0.12, gain: 0.1, delay: 0.06 });
  },
  combo(level: number) {
    const base = 440 * Math.pow(2, Math.min(level, 12) / 12);
    tone({ type: 'triangle', freq: base, dur: 0.08, gain: 0.15 });
    tone({ type: 'triangle', freq: base * 1.5, dur: 0.12, gain: 0.15, delay: 0.07 });
  },
  boss() {
    tone({ type: 'sawtooth', freq: 55, to: 45, dur: 1.2, gain: 0.3 });
    tone({ type: 'square', freq: 110, to: 82, dur: 0.9, gain: 0.12, delay: 0.1 });
    noise({ dur: 1, gain: 0.15, from: 400, to: 60 });
  },
  heal() {
    [523, 659, 784, 1047].forEach((f, i) => tone({ type: 'triangle', freq: f, dur: 0.12, gain: 0.12, delay: i * 0.07 }));
  },
  shield() {
    tone({ type: 'sine', freq: 600, to: 1400, dur: 0.3, gain: 0.18 });
    tone({ type: 'square', freq: 1200, dur: 0.08, gain: 0.06, delay: 0.25 });
  },
  victory() {
    [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone({ freq: f, dur: i === 5 ? 0.4 : 0.12, gain: 0.12, delay: i * 0.11 }));
  },
  click() {
    tone({ freq: 700, dur: 0.03, gain: 0.06 });
  },
};
