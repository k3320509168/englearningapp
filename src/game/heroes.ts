import { BODY_NAMES, FACE_NAMES, HAIR_COLORS, HAIR_NAMES, SKIN_TONES, classDef } from './character';
import type { Character, ClassId, Element, Gender } from './character';
import { CLASS_SKILLS, RARITY_POWER } from './progression';
import type { SkillId } from './progression';

// 夥伴英雄：滿編 300 位（N 96 / R 90 / SR 76 / SSR 38，UR 0 原生，UR 全由滿星 SSR 晉升），名字都是英文單字（真名機制的基礎），稀有度對應單字難度。
// 外觀用主角的分層像素系統產生：職業、屬性、性別手動指定，其餘依單字固定亂數決定。
// 取得方式：遊戲內召喚券抽卡（不付費），有保底與累積兌換。

export type HeroId = string;
export type Rarity = 'N' | 'R' | 'SR' | 'SSR' | 'UR';
export const RARITIES: Rarity[] = ['N', 'R', 'SR', 'SSR', 'UR'];

export const RARITY_INFO: Record<Rarity, { color: string; statMult: number; cefr: string }> = {
  N: { color: '#b8bcc8', statMult: 1.0, cefr: 'A1' },
  R: { color: '#5fb3ff', statMult: 1.12, cefr: 'A2' },
  SR: { color: '#c98aff', statMult: 1.25, cefr: 'B1' },
  SSR: { color: '#ffcd4b', statMult: 1.45, cefr: 'B2～C1' },
  UR: { color: '#ff5af0', statMult: 1.65, cefr: 'C1～C2' },
};

export interface HeroDef {
  id: HeroId;          // 英文單字（小寫）
  meaning: string;     // 中文意思
  rarity: Rarity;      // 初始稀有度（升品階後最多再高一階）
  classId: ClassId;
  element: Element;
  look: Pick<Character, 'gender' | 'face' | 'body' | 'skin' | 'hair' | 'hairColor'>;
}

type Entry = [word: string, meaning: string, rarity: Rarity, classId: ClassId, element: Element, gender?: Gender];

// 第四輪：牛奶、書、吟遊詩人、蠟燭、和諧、燈籠、聖域、寧靜改為僧侶（補血與增益）
const ROSTER: Entry[] = [
  // N（A1 單字）
  ['knight', '騎士', 'N', 'swordsman', 'light', 'male'],
  ['apple', '蘋果', 'N', 'swordsman', 'wood'],
  ['bread', '麵包', 'N', 'warrior', 'earth'],
  ['cat', '貓', 'N', 'archer', 'dark', 'female'],
  ['dog', '狗', 'N', 'warrior', 'earth', 'male'],
  ['sun', '太陽', 'N', 'mage', 'fire', 'male'],
  ['moon', '月亮', 'N', 'mage', 'dark', 'female'],
  ['tree', '樹', 'N', 'warrior', 'wood'],
  ['fish', '魚', 'N', 'archer', 'water'],
  ['bird', '鳥', 'N', 'archer', 'wood', 'female'],
  ['book', '書', 'N', 'monk', 'light'],
  ['milk', '牛奶', 'N', 'monk', 'light', 'female'],
  ['star', '星星', 'N', 'mage', 'light', 'female'],
  ['rain', '雨', 'N', 'archer', 'water', 'female'],
  ['rose', '玫瑰', 'N', 'swordsman', 'wood', 'female'],
  ['egg', '蛋', 'N', 'warrior', 'metal'],
  // R（A2 單字）
  ['archer', '弓箭手', 'R', 'archer', 'wood', 'male'],
  ['mage', '法師', 'R', 'mage', 'fire', 'female'],
  ['bard', '吟遊詩人', 'R', 'monk', 'water', 'male'],
  ['river', '河流', 'R', 'swordsman', 'water'],
  ['forest', '森林', 'R', 'archer', 'wood'],
  ['island', '島嶼', 'R', 'warrior', 'water'],
  ['castle', '城堡', 'R', 'warrior', 'metal'],
  ['garden', '花園', 'R', 'mage', 'wood', 'female'],
  ['winter', '冬天', 'R', 'swordsman', 'water', 'female'],
  ['shadow', '影子', 'R', 'archer', 'dark'],
  ['silver', '白銀', 'R', 'swordsman', 'metal'],
  ['hunter', '獵人', 'R', 'archer', 'earth', 'male'],
  ['candle', '蠟燭', 'R', 'monk', 'fire'],
  ['ocean', '海洋', 'R', 'mage', 'water'],
  // SR（B1 單字）
  ['dragon', '龍', 'SR', 'warrior', 'fire', 'male'],
  ['thunder', '雷霆', 'SR', 'swordsman', 'metal'],
  ['crystal', '水晶', 'SR', 'mage', 'light', 'female'],
  ['warrior', '戰士', 'SR', 'warrior', 'earth'],
  ['journey', '旅程', 'SR', 'archer', 'wood'],
  ['courage', '勇氣', 'SR', 'swordsman', 'fire'],
  ['harmony', '和諧', 'SR', 'monk', 'water', 'female'],
  ['volcano', '火山', 'SR', 'warrior', 'fire'],
  ['glacier', '冰河', 'SR', 'archer', 'water'],
  ['compass', '羅盤', 'SR', 'archer', 'metal'],
  ['lantern', '燈籠', 'SR', 'monk', 'light'],
  ['guardian', '守護者', 'SR', 'warrior', 'light'],
  // SSR（B2～C1 單字）
  ['phoenix', '鳳凰', 'SSR', 'mage', 'fire', 'female'],
  ['eclipse', '日蝕', 'SSR', 'swordsman', 'dark'],
  ['tempest', '暴風', 'SSR', 'archer', 'water'],
  ['sanctuary', '聖域', 'SSR', 'monk', 'light', 'female'],
  ['valor', '英勇', 'SSR', 'warrior', 'metal', 'male'],
  ['serenity', '寧靜', 'SSR', 'monk', 'water', 'female'],
  ['labyrinth', '迷宮', 'SSR', 'archer', 'earth'],
  ['aurora', '極光', 'SSR', 'mage', 'light', 'female'],


  // ==========================================
  // 英雄擴充第一批（ChatGPT 第二十二輪）：38 位
  // N 13 / R 13 / SR 11 / SSR 1
  // 不與原本 50 位重複；UR 的 oblivion（湮滅）先保留，等限定取得方式設計好再加入
  // ==========================================

  // ===== N：A1 基礎單字（13 位） =====

  ['rock', '岩石', 'N', 'swordsman', 'earth', 'male'],
  ['sword', '劍', 'N', 'swordsman', 'metal', 'male'],
  ['night', '夜晚', 'N', 'swordsman', 'dark', 'female'],

  ['snow', '雪', 'N', 'mage', 'water', 'female'],
  ['cloud', '雲', 'N', 'mage', 'light', 'female'],
  ['fire', '火', 'N', 'mage', 'fire', 'male'],

  ['bear', '熊', 'N', 'warrior', 'wood', 'male'],
  ['wolf', '狼', 'N', 'warrior', 'dark', 'male'],

  ['fox', '狐狸', 'N', 'archer', 'dark', 'female'],
  ['light', '光', 'N', 'archer', 'light', 'female'],

  ['flower', '花', 'N', 'monk', 'wood', 'female'],
  ['bell', '鈴鐺', 'N', 'monk', 'metal', 'female'],
  ['smile', '微笑', 'N', 'monk', 'light', 'female'],

  // ===== R：A2 常用單字（13 位） =====

  ['bridge', '橋', 'R', 'swordsman', 'earth', 'male'],
  ['iron', '鐵', 'R', 'swordsman', 'metal', 'male'],
  ['smoke', '煙', 'R', 'swordsman', 'dark', 'female'],

  ['mirror', '鏡子', 'R', 'mage', 'metal', 'female'],
  ['cave', '洞穴', 'R', 'mage', 'earth', 'female'],
  ['spark', '火花', 'R', 'mage', 'fire', 'male'],

  ['ash', '灰燼', 'R', 'warrior', 'dark', 'male'],
  ['torch', '火炬', 'R', 'warrior', 'fire', 'male'],

  ['sunrise', '日出', 'R', 'archer', 'light', 'female'],
  ['flame', '火焰', 'R', 'archer', 'fire', 'female'],

  ['root', '樹根', 'R', 'monk', 'wood', 'male'],
  ['moss', '苔蘚', 'R', 'monk', 'wood', 'female'],
  ['shield', '盾牌', 'R', 'monk', 'metal', 'male'],

  // ===== SR：B1～B2 進階單字（11 位） =====

  ['rift', '裂隙', 'SR', 'swordsman', 'dark', 'male'],
  ['tremor', '震動', 'SR', 'swordsman', 'earth', 'male'],

  ['alloy', '合金', 'SR', 'mage', 'metal', 'female'],
  ['drought', '乾旱', 'SR', 'mage', 'earth', 'female'],
  ['inferno', '烈焰', 'SR', 'mage', 'fire', 'male'],

  ['midnight', '午夜', 'SR', 'warrior', 'dark', 'female'],
  ['fortress', '要塞', 'SR', 'warrior', 'earth', 'male'],
  ['fury', '狂怒', 'SR', 'warrior', 'fire', 'male'],

  ['phantom', '幻影', 'SR', 'archer', 'dark', 'female'],

  ['bloom', '綻放', 'SR', 'monk', 'wood', 'female'],
  ['anchor', '船錨', 'SR', 'monk', 'metal', 'male'],

  // ===== SSR：B2～C1 抽象真名（1 位） =====

  ['tenacity', '堅韌', 'SSR', 'swordsman', 'earth', 'female'],

  // ==========================================
  // 英雄擴充第二批（滿編 150 位目標）：62 位
  // N 19 位（累計 48）
  // R 18 位（累計 45）
  // SR 15 位（累計 38）
  // SSR 6 位（累計 15）
  // UR 4 位（累計 4）
  // 總計 150 位，已核對無任何重複單字
  // ==========================================

  // ===== N：A1 基礎單字（19 位） =====
  ['hill', '山丘', 'N', 'warrior', 'earth', 'male'],
  ['leaf', '樹葉', 'N', 'archer', 'wood', 'female'],
  ['lake', '湖泊', 'N', 'mage', 'water', 'female'],
  ['sand', '沙子', 'N', 'warrior', 'earth', 'male'],
  ['wind', '微風', 'N', 'archer', 'water', 'female'],
  ['wave', '波浪', 'N', 'swordsman', 'water', 'male'],
  ['seed', '種子', 'N', 'monk', 'wood', 'female'],
  ['grass', '青草', 'N', 'monk', 'wood', 'female'],
  ['path', '小徑', 'N', 'archer', 'earth', 'male'],
  ['door', '大門', 'N', 'warrior', 'metal', 'male'],
  ['ring', '戒指', 'N', 'mage', 'light', 'female'],
  ['rope', '繩索', 'N', 'swordsman', 'wood', 'male'],
  ['horn', '號角', 'N', 'warrior', 'metal', 'male'],
  ['coin', '硬幣', 'N', 'swordsman', 'metal', 'male'],
  ['lamp', '油燈', 'N', 'monk', 'fire', 'female'],
  ['cup', '茶杯', 'N', 'monk', 'light', 'female'],
  ['nest', '鳥巢', 'N', 'monk', 'wood', 'female'],
  ['pond', '池塘', 'N', 'mage', 'water', 'female'],
  ['frog', '青蛙', 'N', 'archer', 'water', 'male'],

  // ===== R：A2 常用單字（18 位） =====
  ['valley', '山谷', 'R', 'archer', 'earth', 'female'],
  ['stream', '小溪', 'R', 'swordsman', 'water', 'female'],
  ['desert', '荒漠', 'R', 'warrior', 'earth', 'male'],
  ['cliff', '懸崖', 'R', 'swordsman', 'earth', 'male'],
  ['feather', '羽毛', 'R', 'archer', 'light', 'female'],
  ['branch', '樹枝', 'R', 'monk', 'wood', 'male'],
  ['harbor', '港口', 'R', 'warrior', 'water', 'male'],
  ['meadow', '草甸', 'R', 'monk', 'wood', 'female'],
  ['breeze', '和風', 'R', 'mage', 'water', 'female'],
  ['cavern', '巨窟', 'R', 'warrior', 'dark', 'male'],
  ['beacon', '燈塔', 'R', 'monk', 'light', 'male'],
  ['spear', '長矛', 'R', 'swordsman', 'metal', 'male'],
  ['blade', '利刃', 'R', 'swordsman', 'metal', 'female'],
  ['hammer', '鐵錘', 'R', 'warrior', 'metal', 'male'],
  ['arrow', '箭矢', 'R', 'archer', 'metal', 'female'],
  ['echo', '回音', 'R', 'mage', 'dark', 'female'],
  ['crown', '王冠', 'R', 'mage', 'light', 'male'],
  ['scroll', '卷軸', 'R', 'monk', 'light', 'female'],

  // ===== SR：B1～B2 進階單字（15 位） =====
  ['avalanche', '雪崩', 'SR', 'warrior', 'water', 'male'],
  ['bolt', '雷矢', 'SR', 'swordsman', 'light', 'male'],
  ['whirlwind', '旋風', 'SR', 'archer', 'water', 'female'],
  ['meteor', '流星', 'SR', 'mage', 'fire', 'male'],
  ['tundra', '凍原', 'SR', 'warrior', 'water', 'male'],
  ['canyon', '峽谷', 'SR', 'swordsman', 'earth', 'male'],
  ['forge', '鍛爐', 'SR', 'warrior', 'fire', 'male'],
  ['bastion', '堡壘', 'SR', 'warrior', 'metal', 'male'],
  ['relic', '聖物', 'SR', 'monk', 'light', 'female'],
  ['zenith', '頂點', 'SR', 'archer', 'light', 'female'],
  ['vortex', '漩渦', 'SR', 'mage', 'dark', 'male'],
  ['sentinel', '哨兵', 'SR', 'archer', 'metal', 'male'],
  ['prophet', '先知', 'SR', 'monk', 'light', 'female'],
  ['omen', '預兆', 'SR', 'mage', 'dark', 'female'],
  ['solstice', '至點', 'SR', 'swordsman', 'fire', 'female'],

  // ===== SSR：B2～C1 抽象真名（6 位，累計 15 位） =====
  ['radiance', '光輝', 'SSR', 'mage', 'light', 'female'],
  ['nemesis', '天罰', 'SSR', 'swordsman', 'dark', 'male'],
  ['chivalry', '騎士道', 'SSR', 'warrior', 'metal', 'male'],
  ['solitude', '孤寂', 'SSR', 'archer', 'water', 'female'],
  ['genesis', '創世', 'SSR', 'monk', 'wood', 'female'],
  ['titan', '泰坦', 'SSR', 'warrior', 'earth', 'male'],

  // ===== 原生 SSR：高階終極真名（4 位，原標 UR 撥亂反正為 SSR） =====
  ['oblivion', '湮滅', 'SSR', 'monk', 'dark', 'male'],
  ['infinity', '無限', 'SSR', 'mage', 'light', 'female'],
  ['eternity', '永恆', 'SSR', 'swordsman', 'metal', 'female'],
  ['apocalypse', '天啟', 'SSR', 'warrior', 'fire', 'male'],

  // ===== 第二批擴充滿編英雄（150 位：N 48, R 45, SR 38, SSR 19） =====
  ['clay', '黏土', 'N', 'warrior', 'earth', 'male'],
  ['dust', '塵埃', 'N', 'mage', 'earth', 'male'],
  ['silk', '絲綢', 'N', 'monk', 'wood', 'female'],
  ['wool', '羊毛', 'N', 'monk', 'earth', 'female'],
  ['corn', '穀物', 'N', 'monk', 'earth', 'male'],
  ['rice', '稻米', 'N', 'monk', 'water', 'female'],
  ['herb', '草藥', 'N', 'monk', 'wood', 'female'],
  ['salt', '岩鹽', 'N', 'swordsman', 'metal', 'male'],
  ['soup', '熱湯', 'N', 'monk', 'fire', 'female'],
  ['cake', '甜點', 'N', 'mage', 'light', 'female'],
  ['pear', '甜梨', 'N', 'archer', 'wood', 'female'],
  ['plum', '紫李', 'N', 'archer', 'wood', 'female'],
  ['duck', '野鴨', 'N', 'archer', 'water', 'female'],
  ['goat', '山羊', 'N', 'warrior', 'earth', 'male'],
  ['hare', '野兔', 'N', 'archer', 'wood', 'female'],
  ['hawk', '獵鷹', 'N', 'archer', 'metal', 'male'],
  ['lamb', '羔羊', 'N', 'monk', 'light', 'female'],
  ['mole', '鼴鼠', 'N', 'warrior', 'earth', 'male'],
  ['mule', '騾子', 'N', 'warrior', 'earth', 'male'],
  ['seal', '海豹', 'N', 'swordsman', 'water', 'male'],
  ['swan', '天鵝', 'N', 'mage', 'light', 'female'],
  ['toad', '蟾蜍', 'N', 'mage', 'dark', 'male'],
  ['crow', '烏鴉', 'N', 'mage', 'dark', 'male'],
  ['deer', '靈鹿', 'N', 'archer', 'wood', 'female'],
  ['dove', '白鴿', 'N', 'monk', 'light', 'female'],
  ['gold', '黃金', 'N', 'swordsman', 'metal', 'male'],
  ['flag', '戰旗', 'N', 'swordsman', 'fire', 'male'],
  ['pipe', '長笛', 'N', 'monk', 'wood', 'female'],
  ['sail', '風帆', 'N', 'archer', 'water', 'male'],
  ['ship', '戰船', 'N', 'warrior', 'water', 'male'],
  ['tool', '工匠', 'N', 'warrior', 'metal', 'male'],
  ['wall', '石牆', 'N', 'warrior', 'earth', 'male'],
  ['well', '古井', 'N', 'monk', 'water', 'female'],
  ['wing', '羽翼', 'N', 'archer', 'light', 'female'],
  ['bark', '樹皮', 'N', 'warrior', 'wood', 'male'],
  ['vine', '藤蔓', 'N', 'archer', 'wood', 'female'],
  ['lock', '鎖具', 'N', 'swordsman', 'metal', 'male'],
  ['mask', '假面', 'N', 'archer', 'dark', 'male'],
  ['gate', '城門', 'N', 'warrior', 'metal', 'male'],
  ['cart', '貨車', 'N', 'warrior', 'wood', 'male'],
  ['boat', '扁舟', 'N', 'swordsman', 'water', 'female'],
  ['tent', '帳篷', 'N', 'archer', 'earth', 'male'],
  ['drum', '戰鼓', 'N', 'warrior', 'earth', 'male'],
  ['mint', '薄荷', 'N', 'monk', 'wood', 'female'],
  ['zinc', '白鋅', 'N', 'swordsman', 'metal', 'male'],
  ['lead', '鉛碇', 'N', 'warrior', 'metal', 'male'],
  ['coal', '石炭', 'N', 'warrior', 'fire', 'male'],
  ['lime', '石灰', 'N', 'mage', 'earth', 'male'],
  ['canal', '運河', 'R', 'swordsman', 'water', 'male'],
  ['creek', '小溪', 'R', 'archer', 'water', 'female'],
  ['crest', '羽冠', 'R', 'swordsman', 'light', 'male'],
  ['grove', '樹叢', 'R', 'monk', 'wood', 'female'],
  ['haven', '避風港', 'R', 'monk', 'water', 'female'],
  ['lance', '騎槍', 'R', 'swordsman', 'metal', 'male'],
  ['lodge', '木屋', 'R', 'warrior', 'wood', 'male'],
  ['manor', '莊園', 'R', 'swordsman', 'earth', 'female'],
  ['oasis', '綠洲', 'R', 'monk', 'water', 'female'],
  ['ridge', '山脊', 'R', 'warrior', 'earth', 'male'],
  ['vault', '金庫', 'R', 'warrior', 'metal', 'male'],
  ['wharf', '碼頭', 'R', 'archer', 'water', 'male'],
  ['anvil', '鐵砧', 'R', 'warrior', 'metal', 'male'],
  ['domain', '領地', 'R', 'swordsman', 'earth', 'male'],
  ['fathom', '深索', 'R', 'mage', 'water', 'female'],
  ['islet', '小島', 'R', 'monk', 'water', 'female'],
  ['lagoon', '潟湖', 'R', 'mage', 'water', 'female'],
  ['outpost', '前哨', 'R', 'archer', 'metal', 'male'],
  ['pillar', '石柱', 'R', 'warrior', 'earth', 'male'],
  ['quarry', '採石場', 'R', 'warrior', 'earth', 'male'],
  ['rampart', '壁壘', 'R', 'warrior', 'metal', 'male'],
  ['ravine', '峽谷', 'R', 'archer', 'earth', 'female'],
  ['redoubt', '防壘', 'R', 'warrior', 'earth', 'male'],
  ['refuge', '庇護所', 'R', 'monk', 'light', 'female'],
  ['sanctum', '聖所', 'R', 'monk', 'light', 'female'],
  ['spire', '尖塔', 'R', 'mage', 'light', 'female'],
  ['strata', '地層', 'R', 'warrior', 'earth', 'male'],
  ['trench', '戰壕', 'R', 'warrior', 'earth', 'male'],
  ['fawn', '幼鹿', 'R', 'monk', 'wood', 'female'],
  ['geyser', '噴泉', 'R', 'mage', 'water', 'male'],
  ['timber', '巨木', 'R', 'warrior', 'wood', 'male'],
  ['harpoon', '魚叉', 'R', 'archer', 'water', 'male'],
  ['chalice', '聖杯', 'R', 'monk', 'light', 'female'],
  ['censer', '香爐', 'R', 'monk', 'fire', 'female'],
  ['banner', '旌旗', 'R', 'swordsman', 'light', 'male'],
  ['shrine', '神龕', 'R', 'monk', 'wood', 'female'],
  ['summit', '頂峰', 'R', 'warrior', 'earth', 'male'],
  ['delta', '三角洲', 'R', 'mage', 'water', 'female'],
  ['dune', '沙丘', 'R', 'archer', 'earth', 'female'],
  ['glade', '空地', 'R', 'archer', 'wood', 'female'],
  ['gully', '雨溝', 'R', 'archer', 'earth', 'male'],
  ['crag', '峭壁岩', 'R', 'warrior', 'earth', 'male'],
  ['steppe', '大草原', 'R', 'archer', 'earth', 'female'],
  ['tide', '潮汐', 'R', 'swordsman', 'water', 'male'],
  ['hail', '冰雹', 'R', 'mage', 'water', 'male'],
  ['cavalier', '騎士', 'SR', 'swordsman', 'metal', 'male'],
  ['crusader', '十字軍', 'SR', 'swordsman', 'light', 'male'],
  ['defender', '防衛者', 'SR', 'warrior', 'metal', 'male'],
  ['emperor', '帝皇', 'SR', 'swordsman', 'metal', 'male'],
  ['herald', '使節', 'SR', 'monk', 'light', 'female'],
  ['ironclad', '鐵甲', 'SR', 'warrior', 'metal', 'male'],
  ['justicar', '審判官', 'SR', 'swordsman', 'light', 'male'],
  ['marshal', '元帥', 'SR', 'swordsman', 'fire', 'male'],
  ['monarch', '君主', 'SR', 'swordsman', 'light', 'female'],
  ['paladin', '聖騎士', 'SR', 'swordsman', 'light', 'male'],
  ['pioneer', '先驅', 'SR', 'archer', 'wood', 'female'],
  ['templar', '聖殿騎士', 'SR', 'swordsman', 'light', 'male'],
  ['warlord', '督軍', 'SR', 'warrior', 'fire', 'male'],
  ['champion', '冠軍', 'SR', 'swordsman', 'metal', 'male'],
  ['avenger', '復仇者', 'SR', 'swordsman', 'dark', 'male'],
  ['wanderer', '流浪者', 'SR', 'archer', 'wood', 'male'],
  ['seeker', '探索者', 'SR', 'archer', 'light', 'female'],
  ['stalker', '潛行者', 'SR', 'archer', 'dark', 'female'],
  ['strider', '遊俠', 'SR', 'archer', 'wood', 'male'],
  ['striker', '突擊手', 'SR', 'swordsman', 'fire', 'male'],
  ['tracker', '追蹤者', 'SR', 'archer', 'earth', 'male'],
  ['vanquish', '克敵者', 'SR', 'swordsman', 'metal', 'male'],
  ['voyager', '航海家', 'SR', 'archer', 'water', 'female'],
  ['corsair', '海盜', 'SR', 'swordsman', 'water', 'male'],
  ['dragoon', '龍騎兵', 'SR', 'warrior', 'fire', 'male'],
  ['duelist', '決鬥者', 'SR', 'swordsman', 'metal', 'male'],
  ['enchanter', '附魔師', 'SR', 'mage', 'light', 'female'],
  ['invoker', '祈求者', 'SR', 'mage', 'fire', 'male'],
  ['overseer', '監督者', 'SR', 'warrior', 'metal', 'male'],
  ['prodigy', '奇才', 'SR', 'mage', 'light', 'female'],
  ['ranger', '巡林客', 'SR', 'archer', 'wood', 'female'],
  ['reaper', '死神', 'SR', 'mage', 'dark', 'male'],
  ['scout', '斥候', 'SR', 'archer', 'wood', 'male'],
  ['shaman', '薩滿', 'SR', 'monk', 'earth', 'male'],
  ['sorcerer', '術士', 'SR', 'mage', 'dark', 'male'],
  ['warden', '典獄官', 'SR', 'warrior', 'earth', 'male'],
  ['zealot', '狂熱者', 'SR', 'swordsman', 'fire', 'male'],
  ['mystic', '秘術師', 'SR', 'mage', 'light', 'female'],
  ['ascendant', '飛昇', 'SSR', 'mage', 'light', 'female'],
  ['celestial', '天界', 'SSR', 'monk', 'light', 'female'],
  ['immortal', '不朽', 'SSR', 'swordsman', 'metal', 'male'],
  ['dominion', '主權', 'SSR', 'warrior', 'fire', 'male'],
  ['seraphim', '熾天使', 'SSR', 'monk', 'light', 'female'],
  ['chronicle', '編年史', 'SSR', 'mage', 'water', 'female'],
  ['transcend', '超然', 'SSR', 'monk', 'light', 'female'],
  ['resonance', '共鳴', 'SSR', 'mage', 'wood', 'female'],
  ['cataclysm', '大災變', 'SSR', 'warrior', 'earth', 'male'],
  ['pantheon', '萬神殿', 'SSR', 'swordsman', 'light', 'male'],
  ['valkyrie', '女武神', 'SSR', 'swordsman', 'metal', 'female'],
  ['chimera', '奇美拉', 'SSR', 'mage', 'fire', 'female'],
  ['leviathan', '利維坦', 'SSR', 'warrior', 'water', 'male'],
  ['behemoth', '巨獸', 'SSR', 'warrior', 'earth', 'male'],
  ['colossus', '巨神像', 'SSR', 'warrior', 'metal', 'male'],
  ['archangel', '大天使', 'SSR', 'monk', 'light', 'male'],
  ['paragon', '典範', 'SSR', 'swordsman', 'metal', 'male'],
  ['rhapsody', '狂想曲', 'SSR', 'mage', 'fire', 'female'],
  ['sovereign', '至尊', 'SSR', 'swordsman', 'light', 'male'],
];

// 依單字產生固定的亂數（每次開遊戲外觀都一樣）
function seeded(word: string): () => number {
  let h = 2166136261;
  for (const ch of word) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507) ^ Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

export const HEROES: HeroDef[] = ROSTER.map(([id, meaning, rarity, classId, element, gender]) => {
  const rand = seeded(id);
  const pick = (n: number) => Math.floor(rand() * n);
  return {
    id, meaning, rarity, classId, element,
    look: {
      gender: gender ?? (rand() < 0.5 ? 'male' : 'female'),
      face: pick(FACE_NAMES.length), body: pick(BODY_NAMES.length), skin: pick(SKIN_TONES.length),
      hair: pick(HAIR_NAMES.length), hairColor: pick(HAIR_COLORS.length),
    },
  };
});

const BY_ID = new Map(HEROES.map(h => [h.id, h]));
export const heroDef = (id: HeroId): HeroDef => BY_ID.get(id) ?? HEROES[0];
export const isHeroId = (id: string) => BY_ID.has(id);

// 稱號，例如「蘋果劍士」；名字本身就是職業時（ARCHER 弓箭手）不重複
export function heroTitle(h: HeroDef): string {
  const cls = classDef(h.classId).name;
  return h.meaning === cls ? cls : `${h.meaning}${cls}`;
}
export const heroWord = (h: HeroDef) => h.id.toUpperCase();
// SSR 英雄的專屬技
const SIGNATURE: Record<HeroId, SkillId> = {
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
};

// 英雄的技能：SSR 用專屬技，其他依名字固定分到職業技能池的其中一種（同職業的英雄技能不一定一樣）
export function heroSkill(h: HeroDef): SkillId {
  if (SIGNATURE[h.id]) return SIGNATURE[h.id];
  const pool = CLASS_SKILLS[h.classId];
  let n = 0;
  for (const ch of h.id) n = (n * 31 + ch.charCodeAt(0)) >>> 0;
  return pool[n % pool.length];
}

// 技能威力看目前的稀有度（升品階後變強）
export const heroSkillPower = (h: HeroDef, tier: number) => RARITY_POWER[currentRarity(h, tier)];

// 目前的稀有度：升過品階就高一階
export function currentRarity(h: HeroDef, tier: number): Rarity {
  return RARITIES[Math.min(RARITIES.indexOf(h.rarity) + (tier > 0 ? 1 : 0), RARITIES.length - 1)];
}

export function heroStats(h: HeroDef, tier = 0, stars = 0) {
  const cls = classDef(h.classId).stats;
  const mult = RARITY_INFO[currentRarity(h, tier)].statMult * (1 + STAR_BONUS * stars);
  return { hp: cls.hp * mult, atk: cls.atk * mult, crit: cls.crit };
}

// 給像素繪圖用的角色資料
export function heroCharacter(h: HeroDef): Character {
  return { name: heroWord(h), classId: h.classId, element: h.element, ...h.look };
}

// ---------- 召喚（抽卡） ----------
export const SUMMON_RATES: { rarity: Rarity; weight: number }[] = [
  { rarity: 'SSR', weight: 3 },
  { rarity: 'SR', weight: 12 },
  { rarity: 'R', weight: 35 },
  { rarity: 'N', weight: 50 },
];
export const PITY_SSR = 50;        // 第 50 抽內必出 SSR
export const SPARK_COST = 100;     // 每抽累積 1 點，100 點任選一位 SSR
export const TEN_PULL = 10;        // 十連至少一位 SR 以上
export const STARTER_TICKETS = 10;
export const TICKET_GOLD_PRICE = 200;

// 重複抽到：轉成該英雄的碎片；碎片＋金幣可以升一個品階
export const DUPLICATE_SHARDS: Record<Rarity, number> = { N: 5, R: 8, SR: 15, SSR: 30, UR: 30 };
export const TIER_UP_SHARDS: Record<Rarity, number> = { N: 20, R: 30, SR: 45, SSR: 150, UR: 0 };

// SSR 升星（第四輪，和 Gemini 討論）：一星～四星各要 20／40／80／100 片，四星後再用 150 片升 UR（共 390 片）。
// 每顆星：生命與攻擊 +8%。碎片不夠時可以用「願望碎片」（每日碎片英文題取得，任何英雄都能用）補。
export const STAR_COSTS = [20, 40, 80, 100];
export const MAX_STARS = STAR_COSTS.length;
export const STAR_BONUS = 0.08;
export const STAR_GOLD = (stars: number) => 500 * (stars + 1);
export const TIER_UP_GOLD: Record<Rarity, number> = { N: 200, R: 400, SR: 800, SSR: 1500, UR: 0 };

export interface SummonCounter {
  sinceSsr: number; // 距離上次 SSR 已經抽了幾次
  spark: number;    // 累積點數
}

export interface SummonResult {
  id: HeroId;
  rarity: Rarity;
}

export function rollRarity(rand: () => number): Rarity {
  const total = SUMMON_RATES.reduce((s, r) => s + r.weight, 0);
  let x = rand() * total;
  for (const r of SUMMON_RATES) {
    if (x < r.weight) return r.rarity;
    x -= r.weight;
  }
  return 'N';
}

export function summon(count: number, counter: SummonCounter, rand: () => number = Math.random): { results: SummonResult[]; counter: SummonCounter } {
  let { sinceSsr, spark } = counter;
  const results: SummonResult[] = [];
  for (let i = 0; i < count; i++) {
    let rarity = sinceSsr + 1 >= PITY_SSR ? 'SSR' : rollRarity(rand);
    // 十連的最後一抽：前面都沒有 SR 以上就保證 SR
    const isLastOfTen = count >= TEN_PULL && i === count - 1;
    if (isLastOfTen && (rarity === 'N' || rarity === 'R') && results.every(r => r.rarity === 'N' || r.rarity === 'R')) rarity = 'SR';
    const pool = HEROES.filter(h => h.rarity === rarity);
    const hero = pool[Math.floor(rand() * pool.length)];
    results.push({ id: hero.id, rarity });
    sinceSsr = rarity === 'SSR' ? 0 : sinceSsr + 1;
    spark += 1;
  }
  return { results, counter: { sinceSsr, spark } };
}
