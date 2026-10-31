import { LEVELS } from './QuestionData';

// 冒險區域：畫面上只顯示主題名稱，不顯示 CEFR 等級，避免讓人覺得關卡數有上限。
// 每個區域是一筆資料（名稱、背景主題、使用哪一份題庫、底下的地圖），之後新增區域只要在這裡加一筆，
// 題庫可以重複使用或混合；未來也可以改成從後端下載區域清單。
//
// 每個區域有數張「三星關卡」（地圖），每張 20 小關：第 5、10 關菁英、第 7 關寶箱、第 15 關小 BOSS、第 20 關大 BOSS；
// 區域最後另有一場獨立的區域最終魔王（最後一張「地圖」只有 1 關）。關卡數依各區要練的題量決定（docs/STAGE_PLAN.md）。
// Combo 只在同一張地圖內延續。

export { MAP_SIZE, REGION_CHAPTERS, chapterCount, regionStageCount, stageInMap } from './stageLayout';
import { MAP_SIZE, chapterCount, regionStageCount } from './stageLayout';

export interface RegionDef {
  id: string;     // 存檔用的 key（關卡進度）；目前與題庫 key 相同，保持舊存檔相容
  name: string;   // 顯示名稱
  pool: string;   // 使用的題庫（QUESTION_POOL 的 key）
  theme: number;  // 背景主題（art/backgrounds THEMES 的索引）
  maps: string[]; // 區域內的地圖名稱，依序每張 MAP_SIZE 關；最後一個是區域最終魔王
}

// 每區 9 個地圖名稱（依該區關卡數取前幾個）＋最後的魔王之地
const DATA: { name: string; maps: string[]; boss: string }[] = [
  { name: '翠綠草原', maps: ['新手村', '風車丘', '草原小徑', '河岸渡口', '廢棄哨站', '花田', '牧場', '古井', '老樹下'], boss: '巨樹之心' },
  { name: '迷霧森林', maps: ['迷霧入口', '蘑菇谷', '古橋', '精靈泉', '深林祭壇', '藤蔓迷宮', '螢火湖', '倒木林', '霧之谷'], boss: '魔女的庭院' },
  { name: '碧藍海岸', maps: ['珊瑚灣', '燈塔岬', '漁人碼頭', '海蝕洞', '潮汐神殿', '貝殼沙灘', '沉船灣', '海鳥崖', '鹽田'], boss: '深海裂口' },
  { name: '黃金沙漠', maps: ['綠洲', '商隊之路', '沙暴城', '蠍子巢', '日落神殿', '流沙地', '駱駝市集', '石柱林', '月牙泉'], boss: '法老金字塔' },
  { name: '赤岩峽谷', maps: ['紅岩隘口', '風蝕拱門', '礦坑小鎮', '鷹巢峭壁', '赤焰祭壇', '斷崖棧道', '石林迷陣', '溫泉谷', '巨岩門'], boss: '龍岩深淵' },
  { name: '極光雪嶺', maps: ['冰原', '極光坡', '冰晶洞', '雪狼原', '冰龍巢穴', '霜之村', '冰湖', '雪崩道', '星光峰'], boss: '冰龍王座' },
  { name: '雷鳴高原', maps: ['雷雲草原', '風暴哨塔', '電光石林', '雷鳥巢', '天雷祭壇', '風車高地', '閃電峽', '雲海平台', '雷鳴之門'], boss: '獅鷲天巢' },
  { name: '熔岩魔域', maps: ['火山口', '黑曜石塔', '地底大河', '鍛造之城', '炎之祭壇', '熔岩橋', '灰燼平原', '火焰迷宮', '魔域邊境'], boss: '炎魔王座' },
  { name: '王城', maps: ['天空島', '時空迴廊', '失落圖書館', '王城外郭', '王座之間', '禁書庫', '鏡之迴廊', '鐘塔', '無聲大廳'], boss: '沉默王座' },
];

export const REGIONS: RegionDef[] = LEVELS.map((pool, i) => ({
  id: pool,
  name: DATA[i]?.name ?? `未知之地 ${i + 1}`,
  pool,
  theme: i,
  maps: [...(DATA[i]?.maps ?? []).slice(0, chapterCount(i)), DATA[i]?.boss ?? '最終決戰'],
}));

export const regionOf = (id: string) => REGIONS.find(r => r.id === id) ?? REGIONS[0];
export const regionName = (id: string) => REGIONS.find(r => r.id === id)?.name ?? '';

export const mapIndexOf = (stageIdx: number) => Math.floor(stageIdx / MAP_SIZE);
export const mapName = (regionId: string, stageIdx: number) => regionOf(regionId).maps[mapIndexOf(stageIdx)] ?? '';
export const mapKey = (regionId: string, mapIdx: number) => `${regionId}#${mapIdx}`;
// 地圖內的第幾關，例如「2-3」；區域最終魔王顯示「魔王」
export const stageLabel = (stageIdx: number, levelIdx?: number) =>
  levelIdx !== undefined && stageIdx >= regionStageCount(levelIdx) - 1 ? '魔王' : `${mapIndexOf(stageIdx) + 1}-${(stageIdx % MAP_SIZE) + 1}`;
