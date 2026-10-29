// 敵人攻擊模式系統（取代第四輪初版的「蓄力」）：
// 每隻敵人有一條行動條，隨時間累積，滿了就依自己的出招順序出一招——不管玩家答對還是答錯。
// 答對打中它會讓行動條往後退（答得越快退越多）；答錯它會立刻反擊（原本的規則）。
// A1、A2 新手區行動條很慢（主要還是答錯才反擊）。一般關的 5 隻怪共用一條行動條，一擊倒也不會讓牠們「永遠不出手」。
// 黃金之路沒有行動條（只有答錯會輸）。
export type MonsterKind = 'slime' | 'bat' | 'mushroom' | 'king' | 'ghost' | 'chest' | 'demon';

// 一般關卡輪流出現三種怪物，Boss 是史萊姆王，復仇魔王是幽靈，寶箱關是寶箱怪
export function monsterKindFor(stageIdx: number, isBoss: boolean, isRevenge: boolean, isTreasure = false, isFinal = false): MonsterKind {
  if (isFinal) return 'demon';
  if (isRevenge) return 'ghost';
  if (isTreasure) return 'chest';
  if (isBoss) return 'king';
  return (['slime', 'bat', 'mushroom'] as MonsterKind[])[stageIdx % 3];
}

export type MoveKind = 'single' | 'multi' | 'aoe';

export interface EnemyMove {
  id: string;
  icon: string;
  name: string;
  kind: MoveKind;
  power: number;      // 對每個目標的傷害倍率（乘上 monsterAttack）
  hits?: number;      // 連擊次數（multi）
  drain?: number;     // 回復自己最大生命的比例
  poison?: number;    // 中毒：之後 3 題每題扣最大生命的比例
  slow?: number;      // 減速：下一題少幾毫秒
  weaken?: number;    // 虛弱：接下來 2 題全隊傷害降低的比例
  sapEnergy?: number; // 吸走技能能量（每位目標）
}

export interface EnemyPattern {
  speed: number;      // 行動條集滿要幾秒（A2+ 的基準）
  moves: EnemyMove[]; // 依序循環出招
}

const m = (id: string, icon: string, name: string, kind: MoveKind, power: number, extra: Partial<EnemyMove> = {}): EnemyMove =>
  ({ id, icon, name, kind, power, ...extra });

export const ENEMY_PATTERNS: Partial<Record<MonsterKind, EnemyPattern>> = {
  slime: { speed: 9, moves: [m('tackle', '💥', '撞擊', 'single', 1), m('tackle', '💥', '撞擊', 'single', 1), m('goo', '🟢', '黏液彈', 'single', 0.8, { slow: 3000 })] },
  bat: { speed: 6, moves: [m('bite', '🦷', '吸血咬', 'single', 0.7, { drain: 0.05 }), m('bite', '🦷', '吸血咬', 'single', 0.7, { drain: 0.05 }), m('sonic', '〰️', '超音波', 'aoe', 0.4, { sapEnergy: 1 })] },
  mushroom: { speed: 8, moves: [m('spore', '🍄', '毒孢子', 'single', 0.6, { poison: 0.04 }), m('headbutt', '💥', '頭槌', 'single', 1), m('fog', '☁️', '毒霧', 'aoe', 0.3, { poison: 0.03 })] },
  king: { speed: 8, moves: [m('press', '⬇️', '重壓', 'single', 1.2), m('split', '🫧', '分裂衝撞', 'multi', 0.5, { hits: 3 }), m('quake', '🌋', '震地', 'aoe', 0.6), m('roar', '📢', '怒吼', 'aoe', 0.2, { weaken: 0.3 })] },
  ghost: { speed: 8, moves: [m('curse', '👻', '詛咒', 'single', 1, { weaken: 0.2 }), m('wail', '😱', '哀號', 'aoe', 0.5)] },
  demon: { speed: 7, moves: [m('shadow', '🗡️', '暗影斬', 'single', 1.3), m('silence', '🔇', '靜默波動', 'aoe', 0.5, { sapEnergy: 2 }), m('abyss', '🌑', '深淵連斬', 'multi', 0.5, { hits: 4 })] },
};

// 九區的區域最終魔王：各有專屬招式與出手頻率（配合 bossSkills.ts 的特殊技能）
export const REGION_BOSS_PATTERNS: EnemyPattern[] = [
  { speed: 10, moves: [m('vine', '🌿', '藤鞭', 'single', 1), m('seeds', '🌰', '種子彈', 'multi', 0.5, { hits: 2 }), m('roots', '🪢', '根纏', 'single', 0.8, { slow: 3000 })] },
  { speed: 9, moves: [m('dark', '🌙', '暗影箭', 'single', 1), m('mist', '🌫️', '迷霧咒', 'aoe', 0.4, { weaken: 0.2 }), m('soul', '💜', '吸魂', 'single', 0.8, { drain: 0.05 })] },
  { speed: 9, moves: [m('slap', '🐙', '觸手拍擊', 'single', 1.1), m('whirl', '🌀', '漩渦', 'aoe', 0.5, { sapEnergy: 1 }), m('jet', '💦', '噴水連擊', 'multi', 0.5, { hits: 3 })] },
  { speed: 8, moves: [m('sand', '⏳', '流沙吞噬', 'single', 1.2, { slow: 3000 }), m('cursesand', '🏜️', '詛咒之沙', 'aoe', 0.5, { poison: 0.03 }), m('scepter', '🔱', '權杖連擊', 'multi', 0.6, { hits: 2 })] },
  { speed: 8, moves: [m('fist', '🪨', '岩拳', 'single', 1.3), m('rocks', '☄️', '落石', 'aoe', 0.6), m('rage', '📢', '怒吼', 'aoe', 0.2, { weaken: 0.3 })] },
  { speed: 7.5, moves: [m('frostbreath', '❄️', '冰息', 'aoe', 0.6, { slow: 3000 }), m('claw', '🐾', '冰爪', 'multi', 0.6, { hits: 3 }), m('bite', '🦷', '寒霜之咬', 'single', 1.3)] },
  { speed: 7, moves: [m('bolt', '⚡', '雷擊', 'single', 1.3), m('storm', '🌩️', '雷暴', 'aoe', 0.6, { sapEnergy: 1 }), m('peck', '🪶', '疾風連啄', 'multi', 0.5, { hits: 4 })] },
  { speed: 7, moves: [m('flame', '🔥', '烈焰斬', 'single', 1.4), m('lava', '🌋', '熔岩雨', 'aoe', 0.7, { poison: 0.04 }), m('hellfire', '☀️', '業火', 'single', 1.6)] },
  { speed: 6.5, moves: [m('shadow', '🗡️', '暗影斬', 'single', 1.4), m('silence', '🔇', '靜默波動', 'aoe', 0.6, { sapEnergy: 2 }), m('abyss', '🌑', '深淵連斬', 'multi', 0.6, { hits: 4 }), m('end', '💀', '終焉', 'aoe', 1)] },
];

// 出手頻率：A1、A2 新手區很久才主動攻擊一次（×2.5），A2+ 起 ×1.0、越後面越快（C2 ×0.65）；菁英再快 15%、傷害 +20%
export const NEWBIE_REGIONS = 2;
export function gaugeSeconds(pattern: EnemyPattern, levelIdx: number, elite: boolean): number {
  const region = levelIdx < NEWBIE_REGIONS ? 2.5 : Math.max(0.65, 1 - 0.05 * (levelIdx - NEWBIE_REGIONS));
  return pattern.speed * region * (elite ? 0.85 : 1);
}
export const ELITE_POWER = 1.2;

// 僧侶出手：攻擊之外，全隊回復最大生命的比例（隨技能威力成長）
export const monkHeal = (power: number) => 0.04 + 0.03 * Math.max(0, power - 1);

// 答對打中：行動條往後退；3 秒內答對（快答）退更多
export const STAGGER = 0.15;
export const FAST_STAGGER = 0.3;
export const POISON_TURNS = 3;
export const WEAKEN_TURNS = 2;
// 行動條超過這個比例時，顯示下一招的名稱
export const TELEGRAPH_AT = 0.7;

// 這隻敵人用哪一套攻擊模式：區域最終魔王（有魔王技能）用專屬的，其他依怪物種類
export function patternOf(s: { bossSkill: unknown; levelIdx: number; monsterKind: MonsterKind }): EnemyPattern | undefined {
  return s.bossSkill ? REGION_BOSS_PATTERNS[Math.min(s.levelIdx, REGION_BOSS_PATTERNS.length - 1)] : ENEMY_PATTERNS[s.monsterKind];
}
export const upcomingMove = (s: { bossSkill: unknown; levelIdx: number; monsterKind: MonsterKind; enemyMoveIdx: number }) => {
  const p = patternOf(s);
  return p ? p.moves[s.enemyMoveIdx % p.moves.length] : null;
};
