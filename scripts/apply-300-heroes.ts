import fs from 'node:fs';
import path from 'node:path';
import { EXPANSION_150_VALID } from './expand-to-300-heroes';
import { LORE_EXPANSION_150 } from './generate-hero-lore-data';

const ROOT = process.cwd();

// 1. 修改 src/game/progression.ts
console.log('1. Updating src/game/progression.ts...');
const progressionPath = path.join(ROOT, 'src/game/progression.ts');
let progressionContent = fs.readFileSync(progressionPath, 'utf8');

const targetSkillType = `  | 'radiance' | 'nemesis' | 'chivalry' | 'solitude' | 'genesis' | 'titan'; // SSR 專屬`;
const newSkillType = `  | 'radiance' | 'nemesis' | 'chivalry' | 'solitude' | 'genesis' | 'titan' // SSR 專屬
  | 'oblivion' | 'infinity' | 'eternity' | 'apocalypse'
  | 'ascendant' | 'celestial' | 'immortal' | 'dominion' | 'seraphim' | 'chronicle'
  | 'transcend' | 'resonance' | 'cataclysm' | 'pantheon' | 'valkyrie' | 'chimera'
  | 'leviathan' | 'behemoth' | 'colossus' | 'archangel' | 'paragon' | 'rhapsody' | 'sovereign';`;

if (!progressionContent.includes(targetSkillType)) {
  throw new Error('targetSkillType not found in progression.ts');
}
progressionContent = progressionContent.replace(targetSkillType, newSkillType);

const targetSkillDef = `  titan: { id: 'titan', icon: '⛰️', name: '泰坦撼地', signature: true, cost: 5, effect: p => ({ charge: r1(1.4 + 1.6 * p), breakShield: 3 }) },
};`;

const newSkillDefs = `  titan: { id: 'titan', icon: '⛰️', name: '泰坦撼地', signature: true, cost: 5, effect: p => ({ charge: r1(1.4 + 1.6 * p), breakShield: 3 }) },
  // ===== 23 位 SSR 英雄專屬技能 =====
  oblivion: { id: 'oblivion', icon: '🌌', name: '湮滅虛空', signature: true, cost: 7, effect: p => ({ charge: r1(2.0 + 1.8 * p), breakShield: 3, timeStage: r(3 * p) }) },
  infinity: { id: 'infinity', icon: '♾️', name: '無極魔道', signature: true, cost: 6, effect: p => ({ combo: r(12 * p), crits: 3, charge: r1(1.2 + 1.5 * p) }) },
  eternity: { id: 'eternity', icon: '⏳', name: '永恆守護', signature: true, cost: 6, opening: true, effect: p => ({ shield: true, heal: r(25 * p), amplify: 2 }) },
  apocalypse: { id: 'apocalypse', icon: '☄️', name: '天啟劫火', signature: true, cost: 6, effect: p => ({ charge: r1(2.2 + 1.8 * p), breakShield: 4 }) },
  ascendant: { id: 'ascendant', icon: '✨', name: '天光飛昇', signature: true, cost: 6, effect: p => ({ timeStage: r(5 * p), amplify: 3, heal: r(20 * p) }) },
  celestial: { id: 'celestial', icon: '🕊️', name: '星穹聖佑', signature: true, cost: 6, effect: p => ({ heal: r(30 * p), shield: true, crits: 2 }) },
  immortal: { id: 'immortal', icon: '🛡️', name: '不朽金身', signature: true, cost: 6, opening: true, effect: p => ({ shield: true, crits: 3, charge: r1(1.5 + 1.5 * p) }) },
  dominion: { id: 'dominion', icon: '👑', name: '霸者王權', signature: true, cost: 6, effect: p => ({ charge: r1(2.0 + 1.8 * p), combo: r(10 * p) }) },
  seraphim: { id: 'seraphim', icon: '🪽', name: '熾天使之翼', signature: true, cost: 7, effect: p => ({ revive: true, heal: r(35 * p), shield: true }) },
  chronicle: { id: 'chronicle', icon: '📜', name: '歲月編年', signature: true, cost: 5, effect: p => ({ timeStage: r(6 * p), combo: r(8 * p), heal: r(18 * p) }) },
  transcend: { id: 'transcend', icon: '🧘', name: '超然頓悟', signature: true, cost: 6, effect: p => ({ amplify: 3, combo: r(15 * p), crits: 2 }) },
  resonance: { id: 'resonance', icon: '🔔', name: '萬籟共鳴', signature: true, cost: 6, effect: p => ({ charge: r1(1.6 + 1.6 * p), crits: 3 }) },
  cataclysm: { id: 'cataclysm', icon: '🌋', name: '地脈浩劫', signature: true, cost: 6, effect: p => ({ breakShield: 4, charge: r1(2.0 + 1.7 * p) }) },
  pantheon: { id: 'pantheon', icon: '🏛️', name: '眾神殿堂', signature: true, cost: 6, opening: true, effect: p => ({ amplify: 3, combo: r(10 * p), shield: true }) },
  valkyrie: { id: 'valkyrie', icon: '🗡️', name: '女武神突擊', signature: true, cost: 6, effect: p => ({ charge: r1(2.2 + 1.8 * p), crits: 2 }) },
  chimera: { id: 'chimera', icon: '🐉', name: '幻獸多重息', signature: true, cost: 6, effect: p => ({ charge: r1(1.8 + 1.8 * p), breakShield: 2, amplify: 2 }) },
  leviathan: { id: 'leviathan', icon: '🌊', name: '深海狂濤', signature: true, cost: 6, effect: p => ({ charge: r1(1.8 + 1.6 * p), shield: true, heal: r(22 * p) }) },
  behemoth: { id: 'behemoth', icon: '🦣', name: '遠古巨獸怒', signature: true, cost: 6, effect: p => ({ charge: r1(2.2 + 1.6 * p), shield: true }) },
  colossus: { id: 'colossus', icon: '🗿', name: '泰坦鐵壁', signature: true, cost: 5, opening: true, effect: p => ({ shield: true, breakShield: 3, heal: r(20 * p) }) },
  archangel: { id: 'archangel', icon: '⚔️', name: '大天使審判', signature: true, cost: 7, effect: p => ({ charge: r1(2.0 + 1.6 * p), heal: r(28 * p), shield: true }) },
  paragon: { id: 'paragon', icon: '💎', name: '純白英靈典範', signature: true, cost: 6, effect: p => ({ crits: 3, combo: r(12 * p), charge: r1(1.4 + 1.4 * p) }) },
  rhapsody: { id: 'rhapsody', icon: '🎶', name: '烈焰狂想', signature: true, cost: 6, effect: p => ({ charge: r1(1.8 + 1.8 * p), timeStage: r(4 * p), amplify: 2 }) },
  sovereign: { id: 'sovereign', icon: '🔱', name: '至尊皇權號令', signature: true, cost: 6, opening: true, effect: p => ({ combo: r(15 * p), amplify: 3, shield: true }) },
};`;

if (!progressionContent.includes(targetSkillDef)) {
  throw new Error('targetSkillDef not found in progression.ts');
}
progressionContent = progressionContent.replace(targetSkillDef, newSkillDefs);
fs.writeFileSync(progressionPath, progressionContent, 'utf8');

// 2. 修改 src/game/weapons.ts
console.log('2. Updating src/game/weapons.ts...');
const weaponsPath = path.join(ROOT, 'src/game/weapons.ts');
let weaponsContent = fs.readFileSync(weaponsPath, 'utf8');

const targetWeaponEnd = `  {
    id: 'wp_tenacity',
    name: '磐岩誓斬重劍',
    icon: '🗡️',
    heroId: 'tenacity',
    desc: '堅定如山岳磐石的重裝誓言大劍。',
    passiveDesc: '全隊生命 +15%，攻擊 +5%',
    passiveMods: { hp: 0.15, atk: 0.05 },
  },
];`;

const newWeapons = `  {
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
];`;

if (!weaponsContent.includes(targetWeaponEnd)) {
  throw new Error('targetWeaponEnd not found in weapons.ts');
}
weaponsContent = weaponsContent.replace(targetWeaponEnd, newWeapons);
fs.writeFileSync(weaponsPath, weaponsContent, 'utf8');

// 3. 修改 src/game/heroes.ts
console.log('3. Updating src/game/heroes.ts...');
const heroesPath = path.join(ROOT, 'src/game/heroes.ts');
let heroesContent = fs.readFileSync(heroesPath, 'utf8');

// (a) 改正頂部說明：滿編 300 位（N 96 / R 90 / SR 76 / SSR 38，UR 0 位）
heroesContent = heroesContent.replace(
  `// 夥伴英雄：150 位（N 48 / R 45 / SR 38 / SSR 15 / UR 4）`,
  `// 夥伴英雄：滿編 300 位（N 96 / R 90 / SR 76 / SSR 38，UR 0 原生，UR 全由滿星 SSR 晉升）`
);

// (b) 修正 ROSTER 尾端原本的 4 位 UR 改為 SSR
const oldUrTarget = `  // ===== UR：C1～C2 高階終極真名（4 位） =====
  ['oblivion', '湮滅', 'UR', 'monk', 'dark', 'male'],
  ['infinity', '無限', 'UR', 'mage', 'light', 'female'],
  ['eternity', '永恆', 'UR', 'swordsman', 'metal', 'female'],
  ['apocalypse', '天啟', 'UR', 'warrior', 'fire', 'male'],
];`;

const newExpansionLines = EXPANSION_150_VALID.map(([word, meaning, rarity, cls, elem, gen]) => {
  return `  ['${word}', '${meaning}', '${rarity}', '${cls}', '${elem}'${gen ? `, '${gen}'` : ''}],`;
}).join('\n');

const newRosterEnd = `  // ===== 原生 SSR：高階終極真名（4 位，原標 UR 撥亂反正為 SSR） =====
  ['oblivion', '湮滅', 'SSR', 'monk', 'dark', 'male'],
  ['infinity', '無限', 'SSR', 'mage', 'light', 'female'],
  ['eternity', '永恆', 'SSR', 'swordsman', 'metal', 'female'],
  ['apocalypse', '天啟', 'SSR', 'warrior', 'fire', 'male'],

  // ===== 第二批擴充滿編英雄（150 位：N 48, R 45, SR 38, SSR 19） =====
${newExpansionLines}
];`;

if (!heroesContent.includes(oldUrTarget)) {
  throw new Error('oldUrTarget not found in heroes.ts');
}
heroesContent = heroesContent.replace(oldUrTarget, newRosterEnd);

// (c) 更新 SIGNATURE 映射：填入 38 位 SSR 英雄
const oldSignatureTarget = `const SIGNATURE: Record<HeroId, SkillId> = {
  phoenix: 'rebirth', eclipse: 'eclipse', tempest: 'storm', sanctuary: 'sanctum',
  valor: 'valor', serenity: 'calm', labyrinth: 'maze', aurora: 'aurora',
  tenacity: 'tenacity',
  radiance: 'radiance', nemesis: 'nemesis', chivalry: 'chivalry',
  solitude: 'solitude', genesis: 'genesis', titan: 'titan',
};`;

const newSignature = `const SIGNATURE: Record<HeroId, SkillId> = {
  phoenix: 'rebirth', eclipse: 'eclipse', tempest: 'storm', sanctuary: 'sanctum',
  valor: 'valor', serenity: 'calm', labyrinth: 'maze', aurora: 'aurora',
  tenacity: 'tenacity',
  radiance: 'radiance', nemesis: 'nemesis', chivalry: 'chivalry',
  solitude: 'solitude', genesis: 'genesis', titan: 'titan',
  oblivion: 'oblivion', infinity: 'infinity', eternity: 'eternity', apocalypse: 'apocalypse',
  ascendant: 'ascendant', celestial: 'celestial', immortal: 'immortal', dominion: 'dominion',
  seraphim: 'seraphim', chronicle: 'chronicle', transcend: 'transcend', resonance: 'resonance',
  cataclysm: 'cataclysm', pantheon: 'pantheon', valkyrie: 'valkyrie', chimera: 'chimera',
  leviathan: 'leviathan', behemoth: 'behemoth', colossus: 'colossus', archangel: 'archangel',
  paragon: 'paragon', rhapsody: 'rhapsody', sovereign: 'sovereign',
};`;

if (!heroesContent.includes(oldSignatureTarget)) {
  throw new Error('oldSignatureTarget not found in heroes.ts');
}
heroesContent = heroesContent.replace(oldSignatureTarget, newSignature);
fs.writeFileSync(heroesPath, heroesContent, 'utf8');

// 4. 修改 src/game/heroLore.ts
console.log('4. Updating src/game/heroLore.ts...');
const heroLorePath = path.join(ROOT, 'src/game/heroLore.ts');
let heroLoreContent = fs.readFileSync(heroLorePath, 'utf8');

const targetLoreEnd = `  apocalypse: ['The ancient prophecy spoke of a terrible fire ___.', '遠古預言提到了一場可怕的烈火天啟大災難。', 'apocalypse 的形容詞（啟示錄般的、災難性的）是？', 'apocalyptic', 'apocalypic', 'apocalypsish', 'apocalypful', 'origin', 'apocalypse 來自希臘文 apokalyptein，原意是？', '揭開面紗；揭露'],
};`;

const newLoreLines = Object.entries(LORE_EXPANSION_150).map(([id, row]) => {
  const [usageEn, usageZh, formQ, formA, w1, w2, w3, loreType, loreQ, loreA] = row;
  const esc = (s: string) => s.replace(/'/g, "\\'");
  return `  ${id}: ['${esc(usageEn)}', '${esc(usageZh)}', '${esc(formQ)}', '${esc(formA)}', '${esc(w1)}', '${esc(w2)}', '${esc(w3)}', '${loreType}', '${esc(loreQ)}', '${esc(loreA)}'],`;
}).join('\n');

const newLoreEnd = `  apocalypse: ['The ancient prophecy spoke of a terrible fire ___.', '遠古預言提到了一場可怕的烈火天啟大災難。', 'apocalypse 的形容詞（啟示錄般的、災難性的）是？', 'apocalyptic', 'apocalypic', 'apocalypsish', 'apocalypful', 'origin', 'apocalypse 來自希臘文 apokalyptein，原意是？', '揭開面紗；揭露'],

  // ===== 第二批擴充英雄真名題組（150 位） =====
${newLoreLines}
};`;

if (!heroLoreContent.includes(targetLoreEnd)) {
  throw new Error('targetLoreEnd not found in heroLore.ts');
}
heroLoreContent = heroLoreContent.replace(targetLoreEnd, newLoreEnd);
fs.writeFileSync(heroLorePath, heroLoreContent, 'utf8');

console.log('Core files updated successfully!');
