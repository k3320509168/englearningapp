import { LEVELS } from './QuestionData';

// 冒險區域：畫面上只顯示主題名稱，不顯示 CEFR 等級，避免讓人覺得關卡數有上限。
// 每個區域是一筆資料（名稱、背景主題、使用哪一份題庫），之後新增區域只要在這裡加一筆，
// 題庫可以重複使用或混合；未來也可以改成從後端下載區域清單。

export interface RegionDef {
  id: string;     // 存檔用的 key（關卡進度）；目前與題庫 key 相同，保持舊存檔相容
  name: string;   // 顯示名稱
  pool: string;   // 使用的題庫（QUESTION_POOL 的 key）
  theme: number;  // 背景主題（art/backgrounds THEMES 的索引）
}

const NAMES = ['翠綠草原', '迷霧森林', '黃金沙漠', '極光雪嶺', '熔岩魔域'];

export const REGIONS: RegionDef[] = LEVELS.map((pool, i) => ({ id: pool, name: NAMES[i] ?? `未知之地 ${i + 1}`, pool, theme: i }));

export const regionName = (id: string) => REGIONS.find(r => r.id === id)?.name ?? '';
