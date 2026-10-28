// 背景音樂：用 Web Audio 即時合成的史詩奇幻風格配樂（不需要音檔）。
// 三首曲子：地圖（舒緩）、戰鬥（弦樂＋定音鼓）、頭目（緊張）。
// 音量刻意偏低；播放英文發音時自動壓低，避免干擾聽力。

export type Track = 'map' | 'battle' | 'boss';

interface Song {
  bpm: number;
  chords: number[][];  // 每小節的和弦（MIDI 音高）
  bass: number[];      // 每小節的低音根音
  melody: (number | null)[]; // 每個八分音符一格，null 為休止，循環播放
  pad: { type: OscillatorType; cutoff: number; gain: number };
  arp: boolean;        // 分散和弦
  ostinato: 'none' | 'eighth' | 'sixteenth'; // 低音弦樂的固定音型
  drums: 'none' | 'half' | 'beat';            // 定音鼓
}

const SONGS: Record<Track, Song> = {
  // D 大調，I–V–vi–IV，慢板，豎琴般的分散和弦
  map: {
    bpm: 80,
    chords: [[62, 66, 69], [61, 64, 69], [59, 62, 66], [59, 62, 67]],
    bass: [38, 45, 47, 43],
    melody: [74, null, 76, 78, 76, null, 74, null, 73, null, 76, null, 81, null, null, null,
      78, null, 76, 74, 71, null, null, null, 74, null, 71, null, 69, null, null, null],
    pad: { type: 'sawtooth', cutoff: 900, gain: 0.05 },
    arp: true, ostinato: 'none', drums: 'none',
  },
  // D 小調，i–VI–III–VII，弦樂固定音型＋定音鼓
  battle: {
    bpm: 108,
    chords: [[62, 65, 69], [58, 62, 65], [57, 60, 65], [60, 64, 67]],
    bass: [38, 34, 41, 36],
    melody: [74, null, 77, null, 76, 74, 72, null, 74, null, null, null, 69, null, 72, 74,
      77, null, 79, null, 81, null, 79, 77, 76, null, 72, null, 74, null, null, null],
    pad: { type: 'sawtooth', cutoff: 1300, gain: 0.045 },
    arp: false, ostinato: 'eighth', drums: 'half',
  },
  // C 小調，i–VI–VII–V，十六分音符的急促弦樂
  boss: {
    bpm: 124,
    chords: [[60, 63, 67], [56, 60, 63], [58, 62, 65], [55, 59, 62]],
    bass: [36, 32, 34, 31],
    melody: [72, null, 75, null, 79, null, 78, null, 75, null, 72, null, 71, null, null, null,
      72, 75, 79, 84, 83, null, 79, null, 80, null, 79, null, 77, null, 75, null],
    pad: { type: 'sawtooth', cutoff: 1600, gain: 0.05 },
    arp: false, ostinato: 'sixteenth', drums: 'beat',
  },
};

const freq = (midi: number) => 440 * 2 ** ((midi - 69) / 12);

let audio: AudioContext | null = null;
let musicGain: GainNode | null = null;
let volume = 0.35;
let ducked = false;
let held = false; // 麥克風聆聽中：音樂完全靜音
let current: Track | null = null;
let timer: number | undefined;
let step = 0;
let nextTime = 0;
let songGain: GainNode | null = null;

function ctx(): AudioContext | null {
  if (typeof window === 'undefined' || !('AudioContext' in window)) return null;
  if (!audio) {
    audio = new AudioContext();
    musicGain = audio.createGain();
    musicGain.connect(audio.destination);
    applyVolume();
    // 切到別的 App 或分頁時暫停音樂，回來再繼續（不然手機上會一直在背景播）
    document.addEventListener('visibilitychange', () => {
      if (!audio) return;
      if (document.hidden) void audio.suspend();
      else void audio.resume();
    });
  }
  return audio;
}

function applyVolume() {
  if (!audio || !musicGain) return;
  const target = held ? 0 : volume * (ducked ? 0.3 : 1);
  musicGain.gain.setTargetAtTime(target, audio.currentTime, held ? 0.03 : 0.15);
}

export function setMusicVolume(v: number) {
  volume = v;
  applyVolume();
  if (v <= 0) stopScheduler();
  else if (current && timer === undefined) startScheduler();
}

// 播放英文發音時壓低音樂
export function duckMusic(on: boolean) {
  ducked = on;
  applyVolume();
}

// 語音辨識聆聽時讓音樂完全靜音：Mac 的喇叭就在麥克風旁邊，音樂會被收進去而辨識錯誤
export function holdMusic(on: boolean) {
  held = on;
  applyVolume();
}

// 瀏覽器要求使用者互動後才能播放：第一次點擊或按鍵時呼叫
export function unlockMusic() {
  const ac = ctx();
  if (ac?.state === 'suspended' && !document.hidden) void ac.resume();
  if (current && timer === undefined && volume > 0) startScheduler();
}

export function playMusic(track: Track | null) {
  if (track === current) return;
  current = track;
  stopScheduler();
  if (track && volume > 0) startScheduler();
}

function stopScheduler() {
  window.clearInterval(timer);
  timer = undefined;
  // 舊曲子淡出
  if (audio && songGain) {
    const g = songGain;
    g.gain.setTargetAtTime(0, audio.currentTime, 0.3);
    window.setTimeout(() => g.disconnect(), 1500);
    songGain = null;
  }
}

function startScheduler() {
  const ac = ctx();
  if (!ac || !musicGain || ac.state !== 'running' || !current) return;
  songGain = ac.createGain();
  songGain.gain.setValueAtTime(0, ac.currentTime);
  songGain.gain.linearRampToValueAtTime(1, ac.currentTime + 1.5);
  songGain.connect(musicGain);
  step = 0;
  nextTime = ac.currentTime + 0.1;
  // 預先排程 0.2 秒內的音符，避免計時器抖動造成節奏不穩
  timer = window.setInterval(() => {
    if (!audio || !current || !songGain) return;
    const song = SONGS[current];
    const stepDur = 60 / song.bpm / 2; // 八分音符
    while (nextTime < audio.currentTime + 0.2) {
      scheduleStep(song, step, nextTime, stepDur, songGain);
      step++;
      nextTime += stepDur;
    }
  }, 50);
}

function scheduleStep(song: Song, n: number, t: number, dur: number, out: GainNode) {
  const bar = Math.floor(n / 8) % song.chords.length;
  const inBar = n % 8;
  const chord = song.chords[bar];

  // 弦樂鋪底：每小節第一拍
  if (inBar === 0) chord.forEach(m => note(out, t, dur * 8, freq(m), song.pad.type, song.pad.gain, song.pad.cutoff, 0.6, 0.8, 4));
  // 低音
  if (inBar === 0 || inBar === 4) note(out, t, dur * 4, freq(song.bass[bar]), 'triangle', 0.12, 600, 0.05, 0.4);
  // 豎琴分散和弦
  if (song.arp) {
    const m = [...chord, chord[0] + 12][inBar % 4];
    note(out, t, dur * 2, freq(m + 12), 'triangle', 0.035, 3000, 0.01, 0.6);
  }
  // 弦樂固定音型（八分或十六分）
  if (song.ostinato !== 'none') {
    const root = song.bass[bar] + 12;
    note(out, t, dur * 0.8, freq(root), 'sawtooth', 0.03, 900, 0.01, 0.1);
    if (song.ostinato === 'sixteenth') note(out, t + dur / 2, dur * 0.4, freq(root + (inBar % 2 ? 7 : 0)), 'sawtooth', 0.025, 900, 0.01, 0.08);
  }
  // 定音鼓
  if ((song.drums === 'half' && inBar % 4 === 0) || (song.drums === 'beat' && inBar % 2 === 0)) timpani(out, t, inBar === 0 ? 0.35 : 0.22);
  // 主旋律（柔和的方波，像遠方的號角）
  const m = song.melody[n % song.melody.length];
  if (m !== null) note(out, t, dur * 1.8, freq(m), 'square', 0.022, 1800, 0.03, 0.3);
}

function note(out: GainNode, t: number, len: number, f: number, type: OscillatorType, gain: number, cutoff: number, attack: number, release: number, detune = 0) {
  if (!audio) return;
  const osc = audio.createOscillator();
  const filter = audio.createBiquadFilter();
  const g = audio.createGain();
  osc.type = type;
  osc.frequency.value = f;
  osc.detune.value = detune;
  filter.type = 'lowpass';
  filter.frequency.value = cutoff;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(gain, t + attack);
  g.gain.setValueAtTime(gain, t + Math.max(attack, len - release));
  g.gain.linearRampToValueAtTime(0, t + len + release);
  osc.connect(filter).connect(g).connect(out);
  osc.start(t);
  osc.stop(t + len + release + 0.05);
}

function timpani(out: GainNode, t: number, gain: number) {
  if (!audio) return;
  const osc = audio.createOscillator();
  const g = audio.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(110, t);
  osc.frequency.exponentialRampToValueAtTime(55, t + 0.25);
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
  osc.connect(g).connect(out);
  osc.start(t);
  osc.stop(t + 0.55);
}
