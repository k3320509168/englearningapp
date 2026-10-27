import { LEVELS } from './QuestionData';
import { SEGMENT_SIZE } from './lesson';

// 冒險區域：畫面上只顯示主題名稱，不顯示 CEFR 等級，避免讓人覺得關卡數有上限。
// 每個區域是一筆資料（名稱、背景主題、使用哪一份題庫、底下的地圖），之後新增區域只要在這裡加一筆，
// 題庫可以重複使用或混合；未來也可以改成從後端下載區域清單。
//
// 一個區域 50 關，分成 5 張地圖、每張 10 關（最後一關是頭目）。Combo 只在同一張地圖內延續。

export const MAP_SIZE = SEGMENT_SIZE;

export interface RegionDef {
  id: string;     // 存檔用的 key（關卡進度）；目前與題庫 key 相同，保持舊存檔相容
  name: string;   // 顯示名稱
  pool: string;   // 使用的題庫（QUESTION_POOL 的 key）
  theme: number;  // 背景主題（art/backgrounds THEMES 的索引）
  maps: string[]; // 區域內的地圖名稱，依序每張 MAP_SIZE 關
}

const DATA: { name: string; maps: string[] }[] = [
  { name: '翠綠草原', maps: ['新手村', '風車丘', '草原小徑', '河岸渡口', '廢棄哨站'] },
  { name: '迷霧森林', maps: ['迷霧入口', '蘑菇谷', '古橋', '精靈泉', '深林祭壇'] },
  { name: '黃金沙漠', maps: ['綠洲', '商隊之路', '沙暴城', '蠍子巢', '日落神殿'] },
  { name: '極光雪嶺', maps: ['冰原', '極光坡', '冰晶洞', '雪狼原', '冰龍巢穴'] },
  { name: '熔岩魔域', maps: ['火山口', '黑曜石塔', '地底大河', '鍛造之城', '炎之祭壇'] },
  { name: '王城', maps: ['天空島', '時空迴廊', '失落圖書館', '王城外郭', '王座之間'] },
];

export const REGIONS: RegionDef[] = LEVELS.map((pool, i) => ({
  id: pool,
  name: DATA[i]?.name ?? `未知之地 ${i + 1}`,
  pool,
  theme: i,
  maps: DATA[i]?.maps ?? ['第一張地圖', '第二張地圖', '第三張地圖', '第四張地圖', '第五張地圖'],
}));

export const regionOf = (id: string) => REGIONS.find(r => r.id === id) ?? REGIONS[0];
export const regionName = (id: string) => REGIONS.find(r => r.id === id)?.name ?? '';

export const mapIndexOf = (stageIdx: number) => Math.floor(stageIdx / MAP_SIZE);
export const mapName = (regionId: string, stageIdx: number) => regionOf(regionId).maps[mapIndexOf(stageIdx)] ?? '';
export const mapKey = (regionId: string, mapIdx: number) => `${regionId}#${mapIdx}`;
// 地圖內的第幾關，例如「2-3」
export const stageLabel = (stageIdx: number) => `${mapIndexOf(stageIdx) + 1}-${(stageIdx % MAP_SIZE) + 1}`;
