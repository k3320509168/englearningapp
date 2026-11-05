import type { ClassId } from './character';
import type { HeroId } from './heroes';
import type { Mods } from './growth';
import { combineMods } from './growth';

// 專武系統（STAGE_PLAN.md 第 15 節、TASKS.md 第 3 節）：
// SSR 英雄專武 8 把（完成真名考驗或真名鍛爐取得）
// 主角職業專武 5 把（二轉/鍛造或真名鍛爐取得）
// 效果：基礎攻擊 +7%，強化 5 級每級 +1.6%（滿級 +15%），附加專屬特色被動。

export interface WeaponDef {
  id: string;
  name: string;
  icon: string;
  heroId?: HeroId;       // 專屬英雄（SSR 英雄）
  classId?: ClassId;     // 專屬主角職業
  desc: string;
  passiveDesc: string;
  passiveMods: Partial<Mods>;
}

export const SSR_HERO_WEAPONS: WeaponDef[] = [
  {
    id: 'wp_phoenix',
    name: '不死火鳥之羽杖',
    icon: '🔥',
    heroId: 'phoenix',
    desc: '蘊含不滅涅槃之火的神聖法杖。',
    passiveDesc: '剋制相剋傷害 +25%，攻擊額外 +5%',
    passiveMods: { elementBonus: 0.25, atk: 0.05 },
  },
  {
    id: 'wp_eclipse',
    name: '日蝕月隕之刃',
    icon: '🗡️',
    heroId: 'eclipse',
    desc: '交織著日月交替幽邃之力的雙極刃。',
    passiveDesc: '暴擊率 +6%，暴擊傷害 +35%',
    passiveMods: { crit: 0.06, critDmg: 0.35 },
  },
  {
    id: 'wp_tempest',
    name: '暴風怒濤之弓',
    icon: '🏹',
    heroId: 'tempest',
    desc: '呼嘯著狂風撕裂雷雲的獵風戰弓。',
    passiveDesc: '第一擊傷害 +80%，每題答題時間 +1.5 秒',
    passiveMods: { firstHit: 0.8, timeMs: 1500 },
  },
  {
    id: 'wp_sanctuary',
    name: '神聖庇護聖盾',
    icon: '🛡️',
    heroId: 'sanctuary',
    desc: '散發著純淨聖光護佑全隊的誓約之盾。',
    passiveDesc: '全隊生命 +15%，每 5 combo 獲得一次神聖守護',
    passiveMods: { hp: 0.15, guardEvery: 5 },
  },
  {
    id: 'wp_valor',
    name: '英勇破陣戰斧',
    icon: '🪓',
    heroId: 'valor',
    desc: '唯有心懷絕對勇氣者方能揮舞的不屈戰斧。',
    passiveDesc: '攻擊 +8%，隊伍瀕死時傷害狂飆 +40%',
    passiveMods: { atk: 0.08, lowHp: 0.4 },
  },
  {
    id: 'wp_serenity',
    name: '寧靜祥和權杖',
    icon: '✨',
    heroId: 'serenity',
    desc: '撫平一切躁動與不安的治癒之杖。',
    passiveDesc: '全隊答題思考時間 +2.5 秒，生命 +10%',
    passiveMods: { timeMs: 2500, hp: 0.1 },
  },
  {
    id: 'wp_labyrinth',
    name: '迷宮幻境短弓',
    icon: '🎯',
    heroId: 'labyrinth',
    desc: '如同一望無際迷陣般令人難以捉摸的機關弓。',
    passiveDesc: '暴擊率 +12%，暴擊傷害 +25%',
    passiveMods: { crit: 0.12, critDmg: 0.25 },
  },
  {
    id: 'wp_aurora',
    name: '極光極晝神杖',
    icon: '🔮',
    heroId: 'aurora',
    desc: '折射極地絢爛天光的神聖晶石法杖。',
    passiveDesc: '攻擊 +8%，相剋傷害 +25%',
    passiveMods: { atk: 0.08, elementBonus: 0.25 },
  },
  {
    id: 'wp_radiance',
    name: '晨曦裁決聖杖',
    icon: '☀️',
    heroId: 'radiance',
    desc: '沐浴在黎明破曉初光中的神聖裁決法杖。',
    passiveDesc: '光屬性傷害 +30%，思考時間 +2 秒',
    passiveMods: { elementBonus: 0.3, timeMs: 2000 },
  },
  {
    id: 'wp_nemesis',
    name: '幽冥天罰魔刃',
    icon: '⚔️',
    heroId: 'nemesis',
    desc: '宣告冥界宿命審判的漆黑魔刃。',
    passiveDesc: '暴擊傷害 +40%，攻擊 +6%',
    passiveMods: { critDmg: 0.4, atk: 0.06 },
  },
  {
    id: 'wp_chivalry',
    name: '榮耀騎士長槍',
    icon: '🔱',
    heroId: 'chivalry',
    desc: '銘刻騎士八大美德的百戰重長槍。',
    passiveDesc: '全隊生命 +12%，每 4 combo 獲得守護',
    passiveMods: { hp: 0.12, guardEvery: 4 },
  },
  {
    id: 'wp_solitude',
    name: '霜月孤影獵弓',
    icon: '🏹',
    heroId: 'solitude',
    desc: '伴隨長夜孤獨寒風的寂滅長弓。',
    passiveDesc: '首擊傷害 +90%，暴擊率 +8%',
    passiveMods: { firstHit: 0.9, crit: 0.08 },
  },
  {
    id: 'wp_genesis',
    name: '生命創世寶典',
    icon: '📖',
    heroId: 'genesis',
    desc: '記錄萬物起源生生不息法則的翠綠聖典。',
    passiveDesc: '全隊思考時間 +3 秒，生命 +15%',
    passiveMods: { timeMs: 3000, hp: 0.15 },
  },
  {
    id: 'wp_titan',
    name: '崩山泰坦巨錘',
    icon: '🔨',
    heroId: 'titan',
    desc: '沉重如遠古泰坦巨神心臟的碎地巨錘。',
    passiveDesc: '攻擊 +10%，首擊傷害 +60%',
    passiveMods: { atk: 0.1, firstHit: 0.6 },
  },
  {
    id: 'wp_tenacity',
    name: '磐岩誓斬重劍',
    icon: '🗡️',
    heroId: 'tenacity',
    desc: '堅定如山岳磐石的重裝誓言大劍。',
    passiveDesc: '全隊生命 +15%，攻擊 +5%',
    passiveMods: { hp: 0.15, atk: 0.05 },
  },
  // ===== 23 把 SSR 專屬神兵 =====
  {
    id: 'wp_oblivion',
    name: '湮滅虛空聖杯',
    icon: '🏆',
    heroId: 'oblivion',
    desc: '蘊含吞噬一切物質與虛無的暗黑聖杯。',
    passiveDesc: '暗屬性傷害 +35%，思考時間 +2 秒',
    passiveMods: { elementBonus: 0.35, timeMs: 2000 },
  },
  {
    id: 'wp_infinity',
    name: '無極星軌法杖',
    icon: '🔮',
    heroId: 'infinity',
    desc: '連通無窮次元魔能核心的永恆星杖。',
    passiveDesc: '暴擊率 +10%，攻擊 +8%',
    passiveMods: { crit: 0.1, atk: 0.08 },
  },
  {
    id: 'wp_eternity',
    name: '永恆不滅誓刃',
    icon: '⚔️',
    heroId: 'eternity',
    desc: '千錘百煉、歷經歲月長河洗禮的神聖誓約劍。',
    passiveDesc: '全隊生命 +15%，每 5 combo 獲得守護',
    passiveMods: { hp: 0.15, guardEvery: 5 },
  },
  {
    id: 'wp_apocalypse',
    name: '天啟焦土戰斧',
    icon: '🪓',
    heroId: 'apocalypse',
    desc: '降下末日劫火、撕裂大地的毀滅重斧。',
    passiveDesc: '首擊傷害 +80%，攻擊 +10%',
    passiveMods: { firstHit: 0.8, atk: 0.1 },
  },
  {
    id: 'wp_ascendant',
    name: '天光飛昇羽杖',
    icon: '✨',
    heroId: 'ascendant',
    desc: '沐浴在天光飛昇之輝中的神聖結晶羽杖。',
    passiveDesc: '思考時間 +3 秒，相剋傷害 +25%',
    passiveMods: { timeMs: 3000, elementBonus: 0.25 },
  },
  {
    id: 'wp_celestial',
    name: '星穹天界聖典',
    icon: '📖',
    heroId: 'celestial',
    desc: '記錄著群星運轉與天界秩序的聖光之書。',
    passiveDesc: '全隊生命 +15%，思考時間 +2 秒',
    passiveMods: { hp: 0.15, timeMs: 2000 },
  },
  {
    id: 'wp_immortal',
    name: '不朽金身神劍',
    icon: '🗡️',
    heroId: 'immortal',
    desc: '不朽不滅、散發黃金耀芒的永生古劍。',
    passiveDesc: '暴擊傷害 +35%，攻擊 +7%',
    passiveMods: { critDmg: 0.35, atk: 0.07 },
  },
  {
    id: 'wp_dominion',
    name: '霸者主權戰戟',
    icon: '🔱',
    heroId: 'dominion',
    desc: '號令萬軍、象徵至高王權的灼炎重戟。',
    passiveDesc: '首擊傷害 +75%，攻擊 +9%',
    passiveMods: { firstHit: 0.75, atk: 0.09 },
  },
  {
    id: 'wp_seraphim',
    name: '熾天使之聖翼',
    icon: '🪽',
    heroId: 'seraphim',
    desc: '熾天使熾烈羽翼化作的神聖救贖權杖。',
    passiveDesc: '全隊生命 +18%，思考時間 +2 秒',
    passiveMods: { hp: 0.18, timeMs: 2000 },
  },
  {
    id: 'wp_chronicle',
    name: '時光編年古卷',
    icon: '📜',
    heroId: 'chronicle',
    desc: '記錄世界起承轉合的時光之流水晶卷軸。',
    passiveDesc: '思考時間 +4 秒，攻擊 +6%',
    passiveMods: { timeMs: 4000, atk: 0.06 },
  },
  {
    id: 'wp_transcend',
    name: '超然靈悟法輪',
    icon: '☸️',
    heroId: 'transcend',
    desc: '洞悉宇宙真諦、超脫凡俗的靈悟聖器。',
    passiveDesc: '光屬性傷害 +28%，全隊生命 +10%',
    passiveMods: { elementBonus: 0.28, hp: 0.1 },
  },
  {
    id: 'wp_resonance',
    name: '萬籟共鳴音叉',
    icon: '🔔',
    heroId: 'resonance',
    desc: '與自然萬物靈魂同頻共振的翠綠音叉。',
    passiveDesc: '暴擊率 +12%，暴擊傷害 +30%',
    passiveMods: { crit: 0.12, critDmg: 0.3 },
  },
  {
    id: 'wp_cataclysm',
    name: '地脈浩劫碎星錘',
    icon: '🔨',
    heroId: 'cataclysm',
    desc: '引動地脈板塊劇烈震盪的大災變巨錘。',
    passiveDesc: '攻擊 +12%，相剋傷害 +20%',
    passiveMods: { atk: 0.12, elementBonus: 0.2 },
  },
  {
    id: 'wp_pantheon',
    name: '萬神聖輝重劍',
    icon: '⚔️',
    heroId: 'pantheon',
    desc: '凝聚諸神榮耀意志的純白聖輝闊劍。',
    passiveDesc: '攻擊 +9%，暴擊率 +8%',
    passiveMods: { atk: 0.09, crit: 0.08 },
  },
  {
    id: 'wp_valkyrie',
    name: '女武神誓約長槍',
    icon: '🔱',
    heroId: 'valkyrie',
    desc: '引領英靈勇士無畏衝鋒的女武神貫虹長槍。',
    passiveDesc: '暴擊傷害 +45%，攻擊 +6%',
    passiveMods: { critDmg: 0.45, atk: 0.06 },
  },
  {
    id: 'wp_chimera',
    name: '幻獸奇美拉魔杖',
    icon: '🪄',
    heroId: 'chimera',
    desc: '封印多重遠古幻獸咆哮之力的烈焰法杖。',
    passiveDesc: '火屬性傷害 +35%，攻擊 +6%',
    passiveMods: { elementBonus: 0.35, atk: 0.06 },
  },
  {
    id: 'wp_leviathan',
    name: '深海利維坦巨戟',
    icon: '🔱',
    heroId: 'leviathan',
    desc: '激盪千層怒濤、席捲深淵的海皇神戟。',
    passiveDesc: '全隊生命 +15%，首擊傷害 +60%',
    passiveMods: { hp: 0.15, firstHit: 0.6 },
  },
  {
    id: 'wp_behemoth',
    name: '遠古巨獸堅岩甲',
    icon: '🛡️',
    heroId: 'behemoth',
    desc: '以遠古大地巨獸堅韌骨甲鍛造的無敵重盾。',
    passiveDesc: '全隊生命 +20%，攻擊 +5%',
    passiveMods: { hp: 0.2, atk: 0.05 },
  },
  {
    id: 'wp_colossus',
    name: '鋼鐵巨神重盾',
    icon: '🛡️',
    heroId: 'colossus',
    desc: '巍峨如遠古鋼鐵泰坦身軀的不可撼動巨壁。',
    passiveDesc: '全隊生命 +18%，每 4 combo 獲得守護',
    passiveMods: { hp: 0.18, guardEvery: 4 },
  },
  {
    id: 'wp_archangel',
    name: '大天使裁決聖杖',
    icon: '🌟',
    heroId: 'archangel',
    desc: '執掌天界至高天罰與救贖的大天使長聖杖。',
    passiveDesc: '光屬性傷害 +30%，全隊生命 +12%',
    passiveMods: { elementBonus: 0.3, hp: 0.12 },
  },
  {
    id: 'wp_paragon',
    name: '純白典範之劍',
    icon: '🗡️',
    heroId: 'paragon',
    desc: '象徵騎士最高榮譽與道德典範的無暇長劍。',
    passiveDesc: '暴擊率 +10%，攻擊 +8%',
    passiveMods: { crit: 0.1, atk: 0.08 },
  },
  {
    id: 'wp_rhapsody',
    name: '狂想烈焰晶琴',
    icon: '🎻',
    heroId: 'rhapsody',
    desc: '奏響熾烈狂想曲、召喚熔岩火雨的奇幻魔琴。',
    passiveDesc: '暴擊傷害 +40%，思考時間 +2.5 秒',
    passiveMods: { critDmg: 0.4, timeMs: 2500 },
  },
  {
    id: 'wp_sovereign',
    name: '至尊皇權御劍',
    icon: '👑',
    heroId: 'sovereign',
    desc: '象徵大一統至高王權、號令天下的帝王聖劍。',
    passiveDesc: '攻擊 +12%，暴擊率 +6%',
    passiveMods: { atk: 0.12, crit: 0.06 },
  },
];

export const PROTAGONIST_WEAPONS: WeaponDef[] = [
  {
    id: 'wp_swordsman',
    name: '誓約聖劍・艾爾德',
    icon: '🗡️',
    classId: 'swordsman',
    desc: '凝聚勇者堅定誓言的光輝聖劍。',
    passiveDesc: '攻擊 +8%，每 4 combo 獲得一次守護',
    passiveMods: { atk: 0.08, guardEvery: 4 },
  },
  {
    id: 'wp_warrior',
    name: '滅世戰斧・巴薩卡',
    icon: '🪓',
    classId: 'warrior',
    desc: '粉碎一切阻礙的狂暴破城巨斧。',
    passiveDesc: '生命 +15%，瀕死傷害爆發 +45%',
    passiveMods: { hp: 0.15, lowHp: 0.45 },
  },
  {
    id: 'wp_archer',
    name: '天穹逐影弓・伊卡洛',
    icon: '🏹',
    classId: 'archer',
    desc: '直指天際無影無形的逐風長弓。',
    passiveDesc: '暴擊率 +10%，首擊傷害 +100%',
    passiveMods: { crit: 0.1, firstHit: 1.0 },
  },
  {
    id: 'wp_mage',
    name: '深淵星象法杖・克羅諾',
    icon: '🔮',
    classId: 'mage',
    desc: '刻劃著星體軌跡與時間禁忌的魔導法杖。',
    passiveDesc: '答題時間 +2 秒，屬性相剋傷害 +25%',
    passiveMods: { timeMs: 2000, elementBonus: 0.25 },
  },
  {
    id: 'wp_monk',
    name: '晨曦庇護聖杯・歐若拉',
    icon: '✨',
    classId: 'monk',
    desc: '盛滿黎明純潔甘露的奇蹟之杯。',
    passiveDesc: '全隊思考時間 +2 秒，生命 +10%，每 5 combo 守護一次',
    passiveMods: { timeMs: 2000, hp: 0.1, guardEvery: 5 },
  },
];

export const ALL_WEAPONS: WeaponDef[] = [...SSR_HERO_WEAPONS, ...PROTAGONIST_WEAPONS];

export const weaponDef = (id: string): WeaponDef | undefined => ALL_WEAPONS.find(w => w.id === id);

// 專武基礎數值：初始攻擊 +7%，每級 +1.6%，滿級 5 級達 +15%
export const WEAPON_MAX_LEVEL = 5;
export const weaponAtkMultiplier = (level: number) => 0.07 + Math.min(Math.max(0, level), WEAPON_MAX_LEVEL) * 0.016;

// 專武強化所需素材與金幣（碎片 5/10/15/20/30，金幣 500/1000/2000/3500/5000）
export const WEAPON_UPGRADE_COSTS: { shards: number; gold: number }[] = [
  { shards: 5, gold: 500 },
  { shards: 10, gold: 1000 },
  { shards: 15, gold: 2000 },
  { shards: 20, gold: 3500 },
  { shards: 30, gold: 5000 },
];

export function weaponUpgradeCost(currentLevel: number): { shards: number; gold: number } | null {
  if (currentLevel >= WEAPON_MAX_LEVEL) return null;
  return WEAPON_UPGRADE_COSTS[currentLevel] ?? null;
}

// 取得某位英雄對應的專武定義
export function weaponForHero(heroId: string): WeaponDef | undefined {
  return SSR_HERO_WEAPONS.find(w => w.heroId === heroId);
}

// 取得主角職業對應的專武定義
export function weaponForClass(classId: ClassId): WeaponDef | undefined {
  return PROTAGONIST_WEAPONS.find(w => w.classId === classId);
}

// 計算專武綜合被動加成
export function weaponCombinedMods(def: WeaponDef, level: number): Mods {
  const atk = weaponAtkMultiplier(level);
  return combineMods(def.passiveMods, { atk });
}

// 專武抽卡掉落
export type WeaponDropKind = 'weapon' | 'rare_mat' | 'shards' | 'mat';

export interface WeaponSummonDrop {
  kind: WeaponDropKind;
  weaponId?: string;
  name: string;
  icon: string;
  amount: number;
  isNew?: boolean;
}

// 專武保底規則：30 抽必中專武、60 點自選專武
export const WEAPON_UNLOCK_REGION = 3; // B1 黃金沙漠
export const WEAPON_PITY_SSR = 30;
export const WEAPON_SPARK_COST = 60;
export const WEAPON_DUPE_SHARDS = 20; // 重複抽到專武轉為 20 個該專武強化碎片
export const WEAPON_TICKET_GOLD_PRICE = 600; // 每週可在工坊/召喚以金幣購買專武券
export const WEAPON_TICKET_BUY_WEEKLY = 2; // 每週限購 2 張

export const WEAPON_SUMMON_RATES = [
  { kind: 'weapon', label: '專屬神兵', rate: 5, color: '#ffd15c', icon: '⚔️' },
  { kind: 'rare_mat', label: '稀有素材', rate: 19, color: '#c084fc', icon: '🔮' },
  { kind: 'shards', label: '願望碎片', rate: 28.5, color: '#38bdf8', icon: '✨' },
  { kind: 'mat', label: '強化礦石', rate: 47.5, color: '#94a3b8', icon: '🪨' },
] as const;

export function rollWeaponSummon(
  count: number,
  counter: { sinceSsr: number; spark: number },
  unlockedWeapons: Record<string, { level: number; unlocked: boolean }>,
  rand: () => number = Math.random,
): { drops: WeaponSummonDrop[]; nextCounter: { sinceSsr: number; spark: number } } {
  let sinceSsr = counter.sinceSsr;
  let spark = counter.spark;
  const drops: WeaponSummonDrop[] = [];

  for (let i = 0; i < count; i++) {
    sinceSsr++;
    spark++;
    const hitWeapon = sinceSsr >= WEAPON_PITY_SSR || rand() < 0.05;

    if (hitWeapon) {
      sinceSsr = 0;
      const wpIdx = Math.floor(rand() * ALL_WEAPONS.length);
      const wp = ALL_WEAPONS[wpIdx];
      const isAlreadyUnlocked = !!unlockedWeapons[wp.id]?.unlocked;
      drops.push({
        kind: 'weapon',
        weaponId: wp.id,
        name: wp.name,
        icon: wp.icon,
        amount: 1,
        isNew: !isAlreadyUnlocked,
      });
    } else {
      const r = rand();
      if (r < 0.20) {
        // 基礎機率 95% × 20% = 19% 稀有素材（魔核 1~2 或龍晶 1）
        const isDragon = rand() < 0.35;
        drops.push({
          kind: 'rare_mat',
          name: isDragon ? '龍晶' : '魔核',
          icon: isDragon ? '🐉' : '🔮',
          amount: isDragon ? 1 : (rand() < 0.5 ? 1 : 2),
        });
      } else if (r < 0.50) {
        // 基礎機率 95% × 30% = 28.5% 願望碎片 5~10 片
        const amount = 5 + Math.floor(rand() * 6);
        drops.push({
          kind: 'shards',
          name: '願望碎片',
          icon: '✨',
          amount,
        });
      } else {
        // 基礎機率 95% × 50% = 47.5% 基礎鍛造素材（礦石 5~15）
        const amount = 5 + Math.floor(rand() * 11);
        drops.push({
          kind: 'mat',
          name: '礦石',
          icon: '🪨',
          amount,
        });
      }
    }
  }

  return { drops, nextCounter: { sinceSsr, spark } };
}
