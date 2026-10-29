// 區域最終魔王的特殊技能（和 Gemini 討論定案，見 docs/ROUND4_DESIGN.md 第 4 節）。
// 每隔 every 題發動一次；每招都有用英文或隊伍搭配破解的方法，讓魔王戰不只是答題。

export type BossSkillId = 'regrow' | 'blind' | 'tsunami' | 'mirage' | 'quake' | 'frost' | 'static' | 'bomb' | 'seal';

export interface BossSkillDef {
  id: BossSkillId;
  boss: string;     // 魔王名稱
  icon: string;
  name: string;
  every: number;    // 每幾題發動一次（static、seal 是被動，常駐生效）
  desc: string;     // 進場時說明效果
  counter: string;  // 破解方法
}

// 依區域順序：A1 草原 … C2 王城
export const BOSS_SKILLS: BossSkillDef[] = [
  { id: 'regrow', boss: '巨型樹精', icon: '🌳', name: '瘋狂生長', every: 3, desc: '每 3 題回復 10% 生命', counter: '維持 5 combo 以上就能點燃樹精，讓它無法回血' },
  { id: 'blind', boss: '幻影魔女', icon: '🌫️', name: '視覺剝奪', every: 4, desc: '迷霧遮住下一題的題目文字，只能用聽的', counter: '聽懂並答對，魔女破防：下一擊傷害 ×2' },
  { id: 'tsunami', boss: '深海巨獸', icon: '🌊', name: '海嘯沖刷', every: 4, desc: '沖走全隊的技能能量', counter: '有護盾時海嘯會被擋下' },
  { id: 'mirage', boss: '流沙法老', icon: '🏜️', name: '海市蜃樓', every: 4, desc: '召喚分身，接下來 2 題答錯會受到雙倍傷害', counter: '連續答對 2 題看破分身' },
  { id: 'quake', boss: '狂暴龍岩', icon: '🪨', name: '大地碎裂', every: 4, desc: '震飛一名隊員，接下來 2 題不能出手', counter: '觸發連攜攻擊可以把隊友拉回來' },
  { id: 'frost', boss: '冰霜巨龍', icon: '❄️', name: '極寒領域', every: 5, desc: '接下來 3 題的答題時間只剩 8 秒', counter: 'combo 20 以上的熱能可以抵消寒氣' },
  { id: 'static', boss: '雷暴獅鷲', icon: '⚡', name: '靜電標記', every: 0, desc: '連續答錯時，受到的傷害一次比一次高', counter: '答對就清除靜電；帶補師撐住' },
  { id: 'bomb', boss: '炎魔之王', icon: '💣', name: '灰燼炸彈', every: 5, desc: '倒數 3 題，期間答錯一題炸彈就會爆炸傷害全隊', counter: '3 題全對可以把炸彈反丟回去（下一擊 ×3）' },
  { id: 'seal', boss: '沉默君王', icon: '🔇', name: '全知封印', every: 0, desc: '封印全隊的技能', counter: '達到 50 combo 解除封印並進入 Fever（下一擊 ×2）' },
];

export const bossSkillFor = (levelIdx: number): BossSkillDef => BOSS_SKILLS[Math.min(Math.max(0, levelIdx), BOSS_SKILLS.length - 1)];

// 數值
export const REGROW_HEAL = 0.1;
export const REGROW_BLOCK_COMBO = 5;
export const FROST_LIMIT = 8_000;
export const FROST_QUESTIONS = 3;
export const FROST_BLOCK_COMBO = 20;
export const MIRAGE_QUESTIONS = 2;
export const QUAKE_QUESTIONS = 2;
export const STATIC_STEP = 0.7;   // 每多一次連續答錯，受到的傷害 +70%
export const BOMB_QUESTIONS = 3;
export const BOMB_DAMAGE = 0.3;   // 爆炸：全隊各扣最大生命 30%
export const SEAL_BREAK_COMBO = 50;

// ---------- 守門頭目與菁英怪的共用技能（每隻抽一招，依關卡固定） ----------
export type FoeSkillId = 'timeThief' | 'hardShell' | 'berserkFoe' | 'refraction' | 'vampire';

export interface FoeSkillDef { id: FoeSkillId; icon: string; name: string; desc: string }

export const FOE_SKILLS: FoeSkillDef[] = [
  { id: 'timeThief', icon: '⏳', name: '時光小偷', desc: '每題答題時間少 5 秒' },
  { id: 'hardShell', icon: '🐚', name: '硬化護甲', desc: '只有暴擊或屬性剋制才打得痛（其他攻擊只剩 30%）' },
  { id: 'berserkFoe', icon: '😡', name: '狂暴化', desc: '生命低於 30% 後，答錯會受到三倍反擊' },
  { id: 'refraction', icon: '🔮', name: '屬性折射', desc: '對三種屬性免疫（只受 20% 傷害），換其他屬性的隊員出手' },
  { id: 'vampire', icon: '🧛', name: '吸血鬼', desc: '每次攻擊隊員都會回復 5% 生命' },
];

// 菁英與守門頭目在第 5、10、15… 關（index 4、9、14…），依「第幾隻」輪替技能
export const foeSkillFor = (stageIdx: number) => FOE_SKILLS[Math.floor(stageIdx / 5) % FOE_SKILLS.length];

export const TIME_THIEF_MS = 5_000;
export const HARD_SHELL_DAMAGE = 0.3;
export const BERSERK_FOE_MULT = 3;
export const REFRACTION_DAMAGE = 0.2;
export const VAMPIRE_HEAL = 0.05;
// 屬性折射免疫的三個屬性（依關卡固定）
const ELEMENT_LIST = ['metal', 'wood', 'water', 'fire', 'earth', 'light', 'dark'] as const;
export const refractionImmune = (stageIdx: number) => [0, 2, 4].map(k => ELEMENT_LIST[(stageIdx + k) % ELEMENT_LIST.length]);
