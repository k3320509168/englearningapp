// 背景音樂資料（第二十一輪，ChatGPT 作曲）：15 首原創主題＋10 首一般戰鬥變奏，用 Web Audio 即時合成（music.ts 播放）。
// 原始回覆在 docs/gpt/round21-music.ts.txt。
/**
 * 英文 RPG 音樂 v2.1
 *
 * 15 首原創主題：
 * - 世界地圖 ×1
 * - 十區地圖 ×10
 * - 小 BOSS、大 BOSS、區域魔王、沉默君王 ×4
 *
 * 另自動產生 10 個一般戰鬥變奏。
 *
 * 整合方式：
 * 1. 替換 music.ts 的 Track、Song、SONGS 定義。
 * 2. 在 scheduleStep() 修改主旋律音色（三行，見檔案底部）。
 * 3. 其他 Web Audio 排程、音量與語音靜音邏輯保持不變。
 */

export const REGION_MUSIC_IDS = [
  'pre', 'a1', 'a2', 'a2p', 'b1',
  'b1p', 'b2', 'b2p', 'c1', 'c2',
] as const;

export type MusicRegion = (typeof REGION_MUSIC_IDS)[number];

export type Track =
  | 'world'
  | `map-${MusicRegion}`
  | `battle-${MusicRegion}`
  | 'boss-mini'
  | 'boss-big'
  | 'boss-region'
  | 'boss-silent';

export interface Song {
  bpm: number;
  chords: number[][];
  bass: number[];
  melody: (number | null)[];
  pad: {
    type: OscillatorType;
    cutoff: number;
    gain: number;
  };

  // 唯一新增欄位：主旋律可使用不同合成音色。
  lead?: {
    type: OscillatorType;
    cutoff: number;
    gain: number;
  };

  arp: boolean;
  ostinato: 'none' | 'eighth' | 'sixteenth';
  drums: 'none' | 'half' | 'beat';
}

// 每小節 8 格，8 小節共 64 格。
const phrase = (
  ...bars: (number | null)[][]
): (number | null)[] => {
  if (
    bars.length !== 8 ||
    bars.some(bar => bar.length !== 8)
  ) {
    throw new Error(
      '每首曲子需要 8 小節，每小節 8 格旋律',
    );
  }
  return bars.flat();
};

const THEMES: Record<
  Exclude<Track, `battle-${MusicRegion}`>,
  Song
> = {

  // =========================================
  // 世界地圖｜遠行的誓言
  // D 大調｜92 BPM
  // 明亮、遼闊、帶有出發冒險的希望。
  // =========================================

  world: {
    bpm: 92,
    chords: [
      [62,66,69], [61,64,69],
      [59,62,66], [59,62,67],
      [59,64,67], [61,64,69],
      [59,62,67], [62,66,69],
    ],
    bass: [38,45,47,43,40,45,43,38],
    melody: phrase(
      [74,null,78,81,79,78,76,null],
      [73,null,76,81,78,null,76,null],
      [74,76,78,null,83,81,78,null],
      [79,78,76,74,71,null,74,null],
      [76,null,79,83,81,79,76,null],
      [81,null,78,76,73,76,81,null],
      [79,81,83,null,81,79,76,74],
      [78,null,76,74,74,null,null,null],
    ),
    pad: {
      type: 'sawtooth',
      cutoff: 1050,
      gain: 0.039,
    },
    lead: {
      type: 'triangle',
      cutoff: 2300,
      gain: 0.042,
    },
    arp: true,
    ostinato: 'none',
    drums: 'half',
  },

  // =========================================
  // PRE-A1 失語邊境｜最後的逃亡
  // A 小調｜82 BPM
  // 孤獨、失落；後半旋律逐漸帶出希望。
  // =========================================

  'map-pre': {
    bpm: 82,
    chords: [
      [57,60,64], [57,60,65],
      [55,60,64], [55,59,62],
      [57,60,64], [57,62,65],
      [56,59,64], [57,60,64],
    ],
    bass: [45,41,48,43,45,38,40,45],
    melody: phrase(
      [69,null,null,72,71,null,69,null],
      [72,null,77,null,76,null,72,null],
      [72,74,76,null,74,null,null,null],
      [71,null,74,79,74,null,71,null],
      [72,null,76,79,76,null,72,null],
      [74,77,76,null,74,null,72,null],
      [71,null,68,71,76,null,74,null],
      [72,null,69,null,69,null,null,null],
    ),
    pad: {
      type: 'sine',
      cutoff: 780,
      gain: 0.048,
    },
    lead: {
      type: 'triangle',
      cutoff: 1450,
      gain: 0.033,
    },
    arp: false,
    ostinato: 'none',
    drums: 'none',
  },

  // =========================================
  // A1 翠綠草原｜晨光與風車
  // G 大調｜104 BPM
  // 木笛般的主旋律、明亮跳躍的分解和弦。
  // =========================================

  'map-a1': {
    bpm: 104,
    chords: [
      [55,59,62], [55,60,64],
      [55,59,64], [57,62,66],
      [55,59,62], [55,60,64],
      [57,62,66], [55,59,62],
    ],
    bass: [43,48,40,38,43,48,38,43],
    melody: phrase(
      [74,null,79,81,79,76,74,null],
      [76,79,84,null,83,79,76,null],
      [79,76,74,71,74,null,76,null],
      [78,null,81,78,76,null,74,null],
      [79,81,83,86,83,81,79,null],
      [84,null,83,79,76,79,84,null],
      [81,78,76,74,78,null,81,null],
      [79,76,74,null,74,null,null,null],
    ),
    pad: {
      type: 'triangle',
      cutoff: 1850,
      gain: 0.036,
    },
    lead: {
      type: 'sine',
      cutoff: 2600,
      gain: 0.051,
    },
    arp: true,
    ostinato: 'none',
    drums: 'none',
  },

  // =========================================
  // A2 迷霧森林｜幻影的低語
  // D Dorian 調式｜86 BPM
  // 霧氣、錯覺、神祕，但不完全邪惡。
  // =========================================

  'map-a2': {
    bpm: 86,
    chords: [
      [62,65,69], [59,62,67],
      [60,64,67], [57,60,64],
      [62,65,69], [59,64,67],
      [59,62,67], [62,65,69],
    ],
    bass: [38,43,36,45,38,40,43,38],
    melody: phrase(
      [74,null,77,null,81,null,79,null],
      [83,null,79,74,null,77,null,null],
      [76,79,84,null,83,null,79,null],
      [76,null,72,74,76,null,null,null],
      [77,null,81,84,81,null,77,null],
      [79,76,74,null,71,74,76,null],
      [79,null,83,81,79,null,74,null],
      [77,74,null,74,74,null,null,null],
    ),
    pad: {
      type: 'sine',
      cutoff: 950,
      gain: 0.058,
    },
    lead: {
      type: 'sine',
      cutoff: 1500,
      gain: 0.035,
    },
    arp: true,
    ostinato: 'none',
    drums: 'none',
  },

  // =========================================
  // A2+ 碧藍海岸｜潮汐的回聲
  // B 小調｜96 BPM
  // 波浪般的旋律起伏，通透且略帶悲傷。
  // =========================================

  'map-a2p': {
    bpm: 96,
    chords: [
      [59,62,66], [59,62,67],
      [62,66,69], [61,64,69],
      [59,64,67], [59,62,67],
      [61,64,69], [59,62,66],
    ],
    bass: [47,43,38,45,40,43,45,47],
    melody: phrase(
      [71,null,74,78,76,74,71,null],
      [74,79,81,null,79,74,null,null],
      [78,null,81,86,83,81,78,null],
      [76,null,73,76,81,null,76,null],
      [79,76,74,null,71,74,76,null],
      [79,81,83,81,79,null,74,null],
      [76,null,81,85,83,81,76,null],
      [78,74,71,null,71,null,null,null],
    ),
    pad: {
      type: 'triangle',
      cutoff: 1350,
      gain: 0.045,
    },
    lead: {
      type: 'sine',
      cutoff: 2600,
      gain: 0.048,
    },
    arp: true,
    ostinato: 'none',
    drums: 'none',
  },

  // =========================================
  // B1 黃金沙漠｜埋沒的碑文
  // D Phrygian 調式｜100 BPM
  // 半音摩擦、切分與休止，帶古老神殿感。
  // =========================================

  'map-b1': {
    bpm: 100,
    chords: [
      [62,65,69], [63,67,70],
      [58,62,65], [62,65,69],
      [62,65,69], [63,67,70],
      [58,62,67], [62,65,69],
    ],
    bass: [38,39,46,38,38,39,43,38],
    melody: phrase(
      [74,null,75,77,null,74,72,null],
      [75,79,null,82,79,75,null,null],
      [77,null,82,84,82,77,74,null],
      [75,74,null,72,74,null,null,null],
      [74,75,77,null,81,77,75,null],
      [79,null,82,84,82,null,79,null],
      [82,79,77,75,74,null,72,null],
      [74,null,77,74,74,null,null,null],
    ),
    pad: {
      type: 'sawtooth',
      cutoff: 700,
      gain: 0.033,
    },
    lead: {
      type: 'triangle',
      cutoff: 2250,
      gain: 0.060,
    },
    arp: false,
    ostinato: 'eighth',
    drums: 'half',
  },

  // =========================================
  // B1+ 赤岩峽谷｜破碎的巨岩
  // E Phrygian 調式｜116 BPM
  // 重低音、半音緊張、類似戰鼓的推進感。
  // =========================================

  'map-b1p': {
    bpm: 116,
    chords: [
      [64,67,71], [65,69,72],
      [64,67,71], [67,71,74],
      [69,72,76], [65,69,72],
      [64,67,71], [64,67,71],
    ],
    bass: [40,41,40,43,45,41,40,40],
    melody: phrase(
      [76,null,79,76,77,76,74,null],
      [77,79,81,null,79,77,null,null],
      [76,79,83,81,79,76,74,null],
      [79,null,83,86,83,null,79,null],
      [81,84,88,84,81,79,76,null],
      [77,79,81,77,76,null,74,null],
      [76,77,76,74,71,74,76,null],
      [76,null,79,76,76,null,null,null],
    ),
    pad: {
      type: 'sawtooth',
      cutoff: 1400,
      gain: 0.043,
    },
    lead: {
      type: 'sawtooth',
      cutoff: 1900,
      gain: 0.027,
    },
    arp: false,
    ostinato: 'eighth',
    drums: 'half',
  },

  // =========================================
  // B2 極光雪嶺｜冰封的記憶
  // F# 小調｜78 BPM
  // 寒冷、透明、緩慢，像冰晶折射的聲音。
  // =========================================

  'map-b2': {
    bpm: 78,
    chords: [
      [66,69,73], [62,66,69],
      [61,64,69], [59,64,68],
      [66,69,73], [59,62,66],
      [61,65,68], [66,69,73],
    ],
    bass: [42,38,45,40,42,47,37,42],
    melody: phrase(
      [73,null,null,78,76,null,73,null],
      [74,null,78,81,78,null,null,null],
      [76,null,80,85,80,null,76,null],
      [71,null,76,80,78,null,73,null],
      [73,76,78,null,81,null,78,null],
      [74,null,78,83,81,78,null,null],
      [77,null,80,85,80,77,73,null],
      [73,null,76,73,73,null,null,null],
    ),
    pad: {
      type: 'sine',
      cutoff: 1100,
      gain: 0.052,
    },
    lead: {
      type: 'triangle',
      cutoff: 1250,
      gain: 0.038,
    },
    arp: true,
    ostinato: 'none',
    drums: 'none',
  },

  // =========================================
  // B2+ 雷鳴高原｜天空的怒吼
  // A Mixolydian 調式｜122 BPM
  // 高速、雷霆、具有不穩定的律動。
  // =========================================

  'map-b2p': {
    bpm: 122,
    chords: [
      [61,64,69], [59,62,67],
      [62,66,69], [61,64,69],
      [59,62,66], [59,62,67],
      [62,66,69], [61,64,69],
    ],
    bass: [45,43,38,45,47,43,38,45],
    melody: phrase(
      [81,null,85,88,85,81,79,null],
      [79,83,86,null,83,79,76,null],
      [78,81,86,90,86,null,81,null],
      [85,83,81,79,76,null,81,null],
      [83,86,88,86,83,81,78,null],
      [79,null,83,86,88,86,83,null],
      [90,86,81,78,81,null,85,null],
      [88,85,81,null,81,null,null,null],
    ),
    pad: {
      type: 'sawtooth',
      cutoff: 1650,
      gain: 0.037,
    },
    lead: {
      type: 'square',
      cutoff: 2100,
      gain: 0.018,
    },
    arp: false,
    ostinato: 'eighth',
    drums: 'half',
  },

  // =========================================
  // C1 熔岩魔域｜燃燒的大地
  // C 小調｜114 BPM
  // 沉重、灼熱、有逐漸逼近的威脅。
  // =========================================

  'map-c1': {
    bpm: 114,
    chords: [
      [60,63,67], [56,60,63],
      [58,62,65], [55,59,62],
      [60,63,67], [56,60,65],
      [55,59,62], [60,63,67],
    ],
    bass: [36,44,46,43,36,41,43,36],
    melody: phrase(
      [72,75,79,null,78,75,72,null],
      [75,80,84,80,75,null,72,null],
      [77,null,82,86,82,77,74,null],
      [71,74,79,83,79,null,74,null],
      [72,75,79,84,82,79,75,null],
      [77,80,84,80,77,null,75,null],
      [79,83,86,83,79,74,71,null],
      [72,null,75,72,72,null,null,null],
    ),
    pad: {
      type: 'sawtooth',
      cutoff: 1250,
      gain: 0.045,
    },
    lead: {
      type: 'sawtooth',
      cutoff: 2350,
      gain: 0.026,
    },
    arp: false,
    ostinato: 'eighth',
    drums: 'beat',
  },

  // =========================================
  // C2 王城｜寂靜之幕
  // C# 小調｜88 BPM
  // 冰冷、威嚴、帶不協和感與大量停頓。
  // =========================================

  'map-c2': {
    bpm: 88,
    chords: [
      [61,64,68], [57,61,64],
      [59,64,68], [56,60,63],
      [61,64,68], [57,61,66],
      [56,60,63], [61,64,68],
    ],
    bass: [37,45,40,44,37,42,44,37],
    melody: phrase(
      [73,null,76,null,80,null,76,null],
      [76,null,81,85,81,null,76,null],
      [80,null,83,88,83,null,80,null],
      [84,80,75,null,72,null,null,null],
      [73,null,80,null,85,80,76,null],
      [78,null,81,85,81,null,78,null],
      [84,80,75,72,75,null,80,null],
      [73,null,76,73,73,null,null,null],
    ),
    pad: {
      type: 'sine',
      cutoff: 670,
      gain: 0.066,
    },
    lead: {
      type: 'square',
      cutoff: 1150,
      gain: 0.015,
    },
    arp: false,
    ostinato: 'none',
    drums: 'none',
  },

  // =========================================
  // 小 BOSS｜獵殺警報
  // E 小調｜126 BPM
  // 短促攻擊、緊迫感、連續低音。
  // =========================================

  'boss-mini': {
    bpm: 126,
    chords: [
      [64,67,71], [60,64,67],
      [67,71,74], [62,66,69],
      [64,67,71], [60,64,67],
      [62,66,69], [59,63,66],
    ],
    bass: [40,36,43,38,40,36,38,35],
    melody: phrase(
      [76,null,79,83,79,null,76,null],
      [75,79,84,null,79,75,72,null],
      [79,83,86,83,79,null,76,null],
      [78,null,81,86,81,null,78,null],
      [76,79,83,88,83,79,76,null],
      [84,null,79,75,79,null,84,null],
      [86,81,78,74,78,81,86,null],
      [83,78,75,71,71,null,null,null],
    ),
    pad: {
      type: 'sawtooth',
      cutoff: 1550,
      gain: 0.047,
    },
    lead: {
      type: 'square',
      cutoff: 2500,
      gain: 0.024,
    },
    arp: false,
    ostinato: 'eighth',
    drums: 'beat',
  },

  // =========================================
  // 大 BOSS｜破城戰鼓
  // D 小調｜138 BPM
  // 重型鼓點、連續音群、八度跳進。
  // =========================================

  'boss-big': {
    bpm: 138,
    chords: [
      [62,65,69], [58,62,65],
      [57,60,65], [57,61,64],
      [62,65,69], [58,62,65],
      [58,62,67], [57,61,64],
    ],
    bass: [38,34,41,45,38,34,43,45],
    melody: phrase(
      [74,77,81,86,81,77,74,null],
      [77,null,82,86,82,77,74,null],
      [81,84,89,84,81,77,72,null],
      [73,76,81,85,81,null,76,null],
      [74,77,81,86,89,86,81,null],
      [82,86,89,86,82,null,77,null],
      [79,82,86,89,86,82,79,null],
      [85,81,76,73,74,null,null,null],
    ),
    pad: {
      type: 'sawtooth',
      cutoff: 2050,
      gain: 0.050,
    },
    lead: {
      type: 'sawtooth',
      cutoff: 2850,
      gain: 0.027,
    },
    arp: false,
    ostinato: 'sixteenth',
    drums: 'beat',
  },

  // =========================================
  // 區域魔王｜命運的對決
  // G 小調｜146 BPM
  // 交響式進軍、寬音域旋律、史詩戰鬥。
  // =========================================

  'boss-region': {
    bpm: 146,
    chords: [
      [67,70,74], [63,67,70],
      [58,62,65], [57,60,65],
      [67,70,74], [60,63,67],
      [62,66,69], [67,70,74],
    ],
    bass: [43,39,34,41,43,36,38,43],
    melody: phrase(
      [79,null,82,86,89,86,82,null],
      [87,82,79,75,79,null,82,null],
      [86,89,94,89,86,82,77,null],
      [84,81,77,72,77,81,84,null],
      [79,82,86,91,89,86,82,null],
      [84,87,91,87,84,null,79,null],
      [86,90,93,90,86,81,78,null],
      [86,82,79,null,79,null,null,null],
    ),
    pad: {
      type: 'sawtooth',
      cutoff: 2200,
      gain: 0.052,
    },
    lead: {
      type: 'square',
      cutoff: 2650,
      gain: 0.028,
    },
    arp: false,
    ostinato: 'sixteenth',
    drums: 'beat',
  },

  // =========================================
  // 沉默君王｜萬籟俱寂
  // C 小調｜112 BPM
  // 不靠單純加速：沉重、空白停頓、
  // 十六分音符威脅與不安定的和聲。
  // =========================================

  'boss-silent': {
    bpm: 112,
    chords: [
      [60,63,67], [56,60,63],
      [61,65,68], [55,59,62],
      [60,63,67], [58,62,65],
      [61,65,68], [55,59,62],
    ],
    bass: [36,44,37,43,36,46,37,43],
    melody: phrase(
      [72,null,null,75,79,null,null,null],
      [80,null,75,null,72,null,null,null],
      [73,77,80,null,85,null,80,null],
      [71,null,74,79,83,null,null,null],
      [84,79,75,72,75,79,84,null],
      [82,null,77,74,77,82,null,null],
      [85,80,77,73,77,80,85,null],
      [83,79,74,71,72,null,null,null],
    ),
    pad: {
      type: 'sine',
      cutoff: 890,
      gain: 0.067,
    },
    lead: {
      type: 'sawtooth',
      cutoff: 1500,
      gain: 0.022,
    },
    arp: false,
    ostinato: 'sixteenth',
    drums: 'beat',
  },
};

// ===========================================
// 自動產生一般戰鬥編曲
// ===========================================

// 高危險區域使用更密集的鼓。
const AGGRESSIVE_REGIONS = new Set<MusicRegion>([
  'b1p', 'b2p', 'c1', 'c2',
]);

const BATTLE_THEMES = Object.fromEntries(
  REGION_MUSIC_IDS.map(region => {
    const original = THEMES[`map-${region}`];

    const battle: Song = {
      ...original,

      // 同一首曲子加速 12%，最高 138 BPM。
      bpm: Math.min(
        138,
        Math.round(original.bpm * 1.12),
      ),

      // 戰鬥時稍微降低鋪底音量，
      // 增加主旋律存在感。
      pad: {
        ...original.pad,
        gain: original.pad.gain * 0.82,
      },

      lead: original.lead
        ? {
            ...original.lead,
            gain: original.lead.gain * 1.07,
          }
        : undefined,

      // 使用較緊湊的低音弦樂節奏。
      ostinato:
        original.ostinato === 'sixteenth'
          ? 'sixteenth'
          : 'eighth',

      // 危險區域使用每拍鼓聲。
      drums: AGGRESSIVE_REGIONS.has(region)
        ? 'beat'
        : 'half',
    };

    return [`battle-${region}`, battle];
  }),
) as Record<`battle-${MusicRegion}`, Song>;

export const SONGS: Record<Track, Song> = {
  ...THEMES,
  ...BATTLE_THEMES,
};

// ===========================================
// 資料驗證
// ===========================================

export function validateMusicData(): void {
  for (const [id, song] of Object.entries(SONGS)) {
    if (
      song.chords.length !== song.bass.length ||
      song.chords.length * 8 !== song.melody.length ||
      song.chords.length < 4 ||
      song.chords.length > 8
    ) {
      throw new Error(
        `曲目 ${id} 的和弦、低音、旋律長度不一致`,
      );
    }

    const notes = [
      ...song.bass,
      ...song.chords.flat(),
      ...song.melody.filter(
        (n): n is number => n !== null,
      ),
    ];

    for (const midi of notes) {
      if (
        !Number.isInteger(midi) ||
        midi < 0 ||
        midi > 127
      ) {
        throw new Error(
          `曲目 ${id} 有非法 MIDI 音高：${midi}`,
        );
      }
    }
  }
}

// 區域索引（0 = A1 … 8 = C2）對應的音樂代號；前置區域是 pre
export const regionMusic = (regionIdx: number): MusicRegion => REGION_MUSIC_IDS[Math.min(REGION_MUSIC_IDS.length - 1, Math.max(0, regionIdx) + 1)];

// ===========================================
// 選曲規則
// ===========================================

export function musicTrackFor(
  region: MusicRegion,
  encounter:
    | 'map'
    | 'normal'
    | 'mini'
    | 'big'
    | 'region',
): Track {
  if (encounter === 'region') {
    return region === 'c2'
      ? 'boss-silent'
      : 'boss-region';
  }

  if (encounter === 'mini') {
    return 'boss-mini';
  }

  if (encounter === 'big') {
    return 'boss-big';
  }

  if (encounter === 'normal') {
    return `battle-${region}`;
  }

  return `map-${region}`;
}

