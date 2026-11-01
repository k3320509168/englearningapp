# C7 v2.2 後續專項審查（任務 T2b）：存檔與經驗緩衝／追趕狀態機第二意見

- **審查角色**：Antigravity（Codex 的存檔與狀態機審查同事，後續專項任務 **T2b**）
- **審查性質聲明**：本報告為針對 C7 v2.2「轉職上限暫存 EXP、非主線追趕曲線與存檔狀態機」的**後續專項演算法與邊界審查**，**不宣稱五輪審查已完成**；僅提出資料結構、純函式介面、未決政策辨析與邊界測試第二意見，不修改任何原程式。
- **審查依據**：`.agy-input/c7-v22-growth-review/` 內之 `PM_STATUS.md`（v2.2）、`growth.ts`、`saveStore.ts`（`SAVE_VERSION = 21`）、`experiencePool.ts`、`progression.ts`、`c7-v21-agy-review.md`（原第二意見），並交叉核對 `regions.ts`、`stageLayout.ts`、`modes.ts`、`GrowthModal.tsx`、`notices.ts`。
- **規格邊界守則**：嚴格遵守 PM v2.2 定案規格——**不放寬驗收門檻、不調整 BOSS 血量／攻擊數值、不調整召喚券與英雄訓練金幣成本**。凡規格未明文決定的微政策均誠實單列，不假裝已定案。

---

## 1. 現有程式碼（v21）與 PM v2.2 對接的 6 個致命狀態機陷阱

### 1.1 【重點 3 核心】為何把非主線 `softCap` 直接傳給原 `addXp` 會刪掉已有主線暫存 EXP？
現有 `growth.ts:75-84` 的實作為：
```ts
export function addXp(level: number, xp: number, gained: number, cap = MAX_LEVEL) {
  let lv = level;
  let cur = xp + gained;
  while (lv < cap && cur >= xpToNext(lv)) {
    cur -= xpToNext(lv);
    lv += 1;
  }
  if (lv >= cap) cur = 0; // ⚠️ 致命根源：只要 lv >= cap 就無條件清空既有 cur！
  return { level: lv, xp: cur, levelsGained: lv - level };
}
```
若實作時直覺寫成 `const cap = isMainline ? classCap : Math.min(classCap, frontierRecLv + 13)` 並傳入上述結構（或只在非主線分支保留 `if (lv >= softCap) cur = 0`），會在**三種真實場景**直接摧毀玩家合法累積的經驗並弄壞 `xpLedger` 對帳：

1. **刪掉主線轉職暫存池**：未轉職玩家（`classCap = 40`）在 A2 中段（例如 `stageIdx = 25`，`frontierRecLv = 25`，`softCap = 25 + 13 = 38`）已升至 `Lv 40` 並暫存了 `player.xp = 3,160` 的主線首通 EXP。此時玩家打一場素材本或按一張掃蕩券，`lv (40) >= softCap (38)` 觸發 `cur = 0`，**`3,160` 點不可再生的主線首通暫存 EXP 瞬間歸零**。
2. **刪掉級內正常主線進度條 `xp`**：已一轉玩家（`classCap = 100`）在 `frontierRecLv = 45` 時靠主線升到 `Lv 58`（`Δ = +13`）且持有正常級內主線經驗 `player.xp = 420`。接著打一場素材本（`Δ = +13` 倍率為 `0`），若仍走 `addXp(58, 420, 0, softCap = 58)` 且執行 `cur = 0`，原本的 `420` 級內主線經驗直接蒸發；同時 `saveStore.ts:732` 算出 `accepted = 0 - 420 = -420`，被 `Math.max(0, accepted)` 掩蓋為 `0`，導致 `xpLedger` 累積 `accepted` 與實際角色總經驗永久失衡。
3. **重置路線／跳級後刪掉既有經驗**：當 `resetClassPath()` 或 `verifyPlacement()` 造成 `player.level > classCap` 時，任何後續 `gainXp` 若走 `if (lv >= cap) cur = 0` 都會把原有 `xp` 洗成 `0`。

> **根治原則（單調不減不變量，Monotonicity Invariant）**：
> 定義自 Lv 1 起的累積總經驗函數 $E(\text{level}, \text{xp}) = \sum_{k=1}^{\text{level}-1}\text{xpToNext}(k) + \text{xp}$。任何 `gainXp(n >= 0)` 操作都必須在「總經驗空間」計算**剩餘可容納配額** `availableQuota = Math.max(0, ceilingTotal - E(level, xp))`；當 `availableQuota === 0` 時，**必須原封不動回傳既有 `(level, xp)`**，保證 $E(\text{level}', \text{xp}') \ge E(\text{level}, \text{xp})$ 恆成立。

---

### 1.2 【重刷漏網陷阱】`grantLearningXp` 現況寫死主線來源，重刷已首通關卡會繞過追趕曲線
檢視 `.agy-input/c7-v22-growth-review/saveStore.ts:720-728`：
- `grantLearningXp(region, q, eligible)` 目前未接收關卡是否已首通的資訊，內部固定呼叫 `gainXp(base, 'learningBase')` 與 `gainXp(total - base, 'learningSubsidy')`。
- PM v2.2 第 1 點明定**「已首通關卡重刷」屬於非主線 EXP，必須套用六段追趕曲線與 `frontier + 13` 封頂**。若重刷已首通小關時仍標為 `'learningBase'`／`'learningSubsidy'` 並視為免衰減主線，`normal`（每 3 張複習 1 次）與 `mastery`（刷滿 60～110 題精通）將完全繞過 `+13` 硬封頂，在 A1～C1 直接突破 `rec + 15` 驗收上限。
- 同理，戰鬥勝利後的自選追擊題（`bonusRound`）以及 `grantRush`、`clearTowerFloor`、`sweepMap` 呼叫 `gainXp` 時都必須傳入明確的 `XpSource`，不可漏傳落入語意不明的 `'other'`。

---

### 1.3 【最前線基準陷阱】`frontierRecLv` 誤讀 `levelProgress` 與全破 `unlockedIndex = 9` 越界
1. **打倒區域魔王後 `levelProgress` 會歸零**：在 `battleStore.ts:837`，玩家擊敗區域最終魔王但尚未解開守門人封印進入下一區時（`unlockedIndex` 仍為 `r`，`bossDown.includes(r)` 為 `true`），程式會執行 `setLevelProgress(levelKey, 0)`。若 `frontierRecLv` 誤用 `levelProgress[regionId]`，玩家在卡守門人回頭刷精通／素材本的瞬間，`frontierRecLv` 會從該區終點（如 A1 的 `20`）暴跌回第 1 關（`5`），`Δ` 憑空暴增 `+15` 直接鎖死所有非主線 EXP！因此**必須取 `bossDown.includes(r) ? lastStage : Math.max(bestStage[regionId] ?? 0, levelProgress[regionId] ?? 0)`**。
2. **C2 通關瞬間 `unlockedIndex` 變為 `9`**：C2（`levelIdx = 8`）無下一區封印，擊敗沉默君王時 `unlockLevel(9)` 會將 `unlockedIndex` 設為 `9`。計算 `frontierRecLv` 與每日修練津貼上限 `150 + 50 * regionOrder` 時，區序必須夾限於 `Math.min(REGIONS.length - 1, Math.max(0, Math.floor(unlockedIndex)))`（即 `0..8`，C2 最高 `550 Gold/日`）。

---

### 1.4 【職業與跳級高於上限】`resetClassPath`、`switchClass`、`verifyPlacement` 的三個深層漏洞
1. **`resetClassPath()` 反覆重置洗出超額緩衝漏洞**：假設未轉職緩衝若只檢查 `xp <= 5,450` 而不看 `level`：玩家升到 `Lv 40` 存滿 `5,450` → 點一轉結算升至 `Lv 50` → 按 `resetClassPath()` 退回 `classCap = 40`（此時 `level = 50`）→ 若允許在 `Lv 50` 再存 `5,450` 再點一轉就會變 `Lv 59`，反覆操作甚至可在未付二轉／覺醒徽章的副職或未達二轉門檻前異常囤積！**解法**：硬上限必須定在總經驗座標 $C(\text{hardCapLv})$（`tier 0` 為 $C(50)$、`tier 1` 為 $C(110)$、`tier 2` 為 $C(170)$、`tier 3` 為 $C(200)$）。當 `level = 45` 重置退回 `cap = 40` 時，最多只能再補到 $C(50) - C(45) = 2,850\text{ EXP}$；當 `level >= 50` 時可用配額為 `0`，既保留既有 `(level, xp)` 不損毀，又徹底封死洗緩衝漏洞。
2. **`switchClass()` 同步與共享上限**：`growth.ts:192` 規定全職業共享最高轉職階數 `bestTier`。從已二轉法師切到未轉職劍士時，`classCap` 仍為 `160`（不可誤用 `player.classPath.length` 的 `40`）；反之若主職未轉職卡在 `Lv 40` 有暫存經驗，切到副職花徽章點亮一轉使 `bestTier` 從 `0` 升為 `1` 時，`advanceClass` 必須立即結算暫存池。
3. **`verifyPlacement()` 舊 `xp` 帶入新等級雙領與對帳缺口**：現有 `saveStore.ts:675` 寫 `player: { ...s.player, level: Math.max(s.player.level, floor) }`，漏將 `xp` 歸零！若玩家在 `Lv 40` 存了 `3,500 EXP` 後通過 B1（`floor = 61`）跳級驗證，會變成 `{ level: 61, xp: 3500 }`，一轉時把 `Lv 40` 的舊經驗拿到 `Lv 61` 再升 5 級。正確規則：比較總經驗 $E(\text{player})$ 與 $C(\text{floor})$——僅當 $E(\text{player}) < C(\text{floor})$ 時更新為 `{ level: floor, xp: 0 }`，並將差額 $C(\text{floor}) - E(\text{player})$ 寫入 `xpLedger['placementXpGrant']`，維持全期帳本恆等。

---

### 1.5 【讀檔遷移陷阱】同版本重整網頁也會跑 `migrateSave`
在 `saveStore.ts:1150`，Zustand `merge` 設定為 `{ ...current, ...migrateSave(persisted, SAVE_VERSION) }`——**玩家每次按 F5 重新整理網頁都會執行 `migrateSave`**！
- 若在 `migrateSave` 第 466 行同步 `classPaths` **之前**就計算 `classCap`，會把已轉職玩家誤判為 `cap = 40`。
- 若玩家在覺醒後合法升至 `Lv 175, xp = 800`，按了 `resetClassPath()`（暫時退回 `cap = 40`）尚未重選路線就按 F5 重整網頁，若讀檔清洗無腦把 `level > hardCapLv` 的 `xp` 清成 `0`，這 `800 EXP` 就會在重整時憑空消失！因此讀檔對 `classCap <= level < MAX_LEVEL` 的合法 `xp` 夾限必須取 `Math.max(xpToNext(level) - 1, C(hardCapLv) - C(level))`。

---

### 1.6 【轉職提示盲點】「距上限 3 級內且可轉職」的主副職判定
PM v2.2 第 5 點要求：「距上限 3 級內且可轉職時，地圖與結算醒目提示『可免費轉職突破上限』。」
- 等級條件應為 `classCap < MAX_LEVEL && player.level >= classCap - 3`（即 `37..40+`、`97..100+`、`157..160+`，含已超上限狀態）。
- 免費可轉職判定不能只看當前選中的 `character.classId`（若當前切在副職且徽章不足會誤判為不可免費轉職）：只要創角主職 `homeClass` 的路線階數 `homeTier = (classPaths[homeClass]?.length ?? 0)` 等於當前 `bestTier`（即推進主職即可提高全域 `classCap`）且 `canAdvance((homeTier + 1) as 1 | 2 | 3, player.level)` 為真，玩家就能 **0 徽章免費切換回主職並轉職突破上限**（或副職本身徽章足夠亦可突破）。

---

## 2. 未定義／需拍板的政策清單（明說不假裝已決定）

以下 5 點在 PM v2.2 條文中存在詮釋空間，請 Codex 實作前確認（表中一併附上最自洽的建議預設值，若 PM 另有裁示僅需改常數開關）：

| 編號 | 未定義政策議題 | 選項 A（建議預設，最自洽） | 選項 B（替代詮釋） | 影響範圍 |
|---|---|---|---|---|
| **U1** | **轉職上限「最多 10 級份量」精確容量** | **精確後 10 級階梯總和** $\sum_{lv=\text{cap}}^{\text{cap}+9}\text{xpToNext}(lv)$：未轉職 `5,450`、一轉 `11,450`、二轉 `17,450`（存滿轉職**恰好連升 10 級**至 `Lv 50 / 110 / 170, xp = 0`） | 固定近似 `10 * xpToNext(cap)`：`5,000 / 11,000 / 17,000`（存滿轉職只升 9 級至 `Lv 49 / 109 / 169`） | `classBufferMax` 常數與轉職滿池體驗 |
| **U2** | **卡轉職上限（40/100/160）時，非主線 EXP 能否進 10 級暫存池？** | **僅主線 EXP 可進轉職暫存池**（對齊 T2b 重點 1 文字）；非主線容量上限取 $C(\min(\text{classCap}, \text{frontier}+13))$，卡 `classCap` 時非主線 `accepted = 0`、被扣量走 8:1 津貼金幣，既有主線暫存不動 | 主線與非主線共用暫存池，但非主線計算 `Δ` 與 `+13` 硬頂**必須改用含暫存經驗的等效等級 `virtualLevel`**，否則卡 `Lv 40` 時 `Δ` 永遠不衰減 | `applyXpGain` 非主線上限式 |
| **U3** | **單筆跨區間結算方式 & 小額扣減 8:1 轉金幣的零頭處理** | **逐級分段消耗（Piecewise）**處理跨級倍率；8:1 轉金幣設當日零頭池 `xpAllowanceRemainder (0..7)`，避免重刷逐題扣 `2～7 EXP` 時 `floor(x/8) = 0` 把津貼全吞光（換日或達當日上限時零頭歸 0） | 進場等級單一倍率＋`C(frontier+13)` 硬截斷；每筆獨立 `Math.floor(lostXp / 8)` 不留零頭（重刷單題小額扣減將換不到金幣） | `SaveData` 是否多 1 個 `remainder` 數字欄位 |
| **U4** | **哪些被擋下的 EXP 可按 8:1 轉修練津貼金幣？** | 凡屬第 1 點**非主線來源**（`rush / tower / sweep / dojo / replay`）因追趕衰減或非主線上限（含 `Lv 200` 滿級封頂）未入帳之 `rawXp - accepted` 均納入 8:1 津貼並受每日 `150 + 50 * r` 總上限保護，且**不乘商店 `goldMult`**；**主線**因 10 級暫存滿溢或 `Lv 200` 截斷者不轉金幣 | ① 掃蕩 `sweep` 或 `Lv 200` 滿級時不發修練津貼；或 ② 主線溢滿也轉津貼 | `grantAllowanceGold` 來源過濾條件 |
| **U5** | **已首通小關重刷與戰鬥後追擊題（`bonusRound`）的來源歸類** | 戰鬥開局快照 `isReplayStage = !isPrologue && !!firstClearXpClaimed[stageKey]`：首次推進小關（含戰敗重試該未首通小關）為**主線**；已首通小關重刷為**非主線 `'replay'`**（若當下倍率為 `0` 不消耗當日 `learningXpDay`）；`bonusRound` 隨本場 `isReplayStage`（或固定歸 `'replay'`） | `bonusRound` 一律視為非主線 `'replay'`（因首領已倒、`claimStageXp` 已完成） | `battleStore` 呼叫 `grantLearningXp` / `gainXp` 的參數 |

---

## 3. 建議的最小可驗證資料結構與純函式介面

### 3.1 最小存檔資料結構增量（`SAVE_VERSION = 22`）
**不新增 `player.bufferedXp` 獨立欄位**，直接沿用 `player: { level: number; xp: number; classPath: string[] }`：
- 當 `player.level < classCap` 時：`0 <= player.xp < xpToNext(player.level)`（既有 `GrowthModal` 經驗條 `xp / xpToNext(level)` 完全相容，不會超過 100%）。
- 當 `player.level >= classCap` 且 `classCap < MAX_LEVEL` 時：`player.xp` 即為待轉職暫存經驗（`GrowthModal` 可在 `level >= levelCap` 區塊直接顯示 `暫存 EXP {player.xp} / {classBufferMax(levelCap)}`）。

於 `SaveData` 頂層僅新增修練津貼每日狀態（務必同步加入 `initialSave`、`conform`、`partialize`）：
```ts
// SaveData 新增欄位（SAVE_VERSION = 22）
xpAllowanceDay: string;        // 預設 ''，格式同 localDate()（'YYYY-MM-DD'）
xpAllowanceGold: number;       // 預設 0，今日已核發之修練津貼金幣
xpAllowanceRemainder: number;  // 預設 0（0..7），今日非主線扣減 EXP 尚未滿 8 點之餘數（若採 U3-B 可省略）
```

### 3.2 `xpLedger` 嚴格對帳恆等式（供 `sim-budget` 與單元測試斷言）
對每個 `source: XpSource` 記錄：
- `offered:${source}`：呼叫端傳入之原始 `rawXp`（$\ge 0$）。
- `catchupBonus:${source}`：非主線 `Δ <= -4`（`×1.25`）產生之正向加成 $\max(0, \text{accepted} - \text{rawXp})$。
- `accepted:${source}`：實際寫入角色總經驗之增量 $E(\text{after}) - E(\text{before}) \ge 0$。
- `deducted:${source}`：非主線被扣減之原始經驗 $\max(0, \text{rawXp} - \text{accepted})$。
- `overflowMainline:${source}`：主線於 10 級暫存池滿溢或 `Lv 200` 截斷之經驗 $\max(0, \text{rawXp} - \text{accepted})$。
- `allowanceGold:${source}`：實際核發入帳之修練津貼金幣。
- `placementXpGrant`：`verifyPlacement` 免費直升補入之總經驗差額 $\max(0, C(\text{floor}) - E(\text{before}))$。

**全生命週期不變量斷言（誤差恆為 0）**：
1. **總經驗守恆**：
   $$E(\text{initialPlayer}) + \sum_{s} \text{xpLedger}[\text{`accepted:${s}`}] + (\text{xpLedger}[\text{'placementXpGrant'}] ?? 0) \equiv E(\text{save.player})$$
   *（關鍵特性：`advanceClass` 觸發 `settleBufferedXp` 只是將 `(Lv 40, xp = 3160)` 等價重組為 `(Lv 46, xp = 10)`，前後 $E$ 完全相等，故轉職結算不會產生任何虛假 `accepted` 差額！）*
2. **單源收支守恆**：
   - 主線來源：`offered:s === accepted:s + overflowMainline:s`
   - 非主線來源：`offered:s + catchupBonus:s === accepted:s + deducted:s`

---

### 3.3 建議純函式介面與參考演算法（可放於 `growth.ts` 或獨立純模組）

```ts
export type XpSource =
  | 'firstClear'
  | 'learningBase'
  | 'learningSubsidy'
  | 'prologue'
  | 'rush'
  | 'tower'
  | 'sweep'
  | 'dojo'
  | 'replay'
  | 'other';

export const CLASS_BUFFER_LEVELS = 10;
export const NON_MAINLINE_MAX_AHEAD = 13;
export const XP_ALLOWANCE_DIVISOR = 8;

export function isMainlineXpSource(source: XpSource): boolean {
  return source === 'firstClear' || source === 'learningBase' || source === 'learningSubsidy' || source === 'prologue';
}

// Lv 1 (xp=0) 升到 Lv level (xp=0) 的精確累積經驗：(level - 1) * (100 + 5 * level)
export function cumulativeXpAtLevel(level: number): number {
  const lv = Math.max(1, Math.floor(level));
  return (lv - 1) * (100 + 5 * lv);
}

export function totalPlayerXp(level: number, xp: number): number {
  return cumulativeXpAtLevel(level) + Math.max(0, Math.floor(xp));
}

// 轉職上限（40 -> 5,450；100 -> 11,450；160 -> 17,450；200 -> 0）
export function classBufferMax(classCap: number): number {
  if (classCap >= MAX_LEVEL) return 0;
  const top = Math.min(MAX_LEVEL, classCap + CLASS_BUFFER_LEVELS);
  return cumulativeXpAtLevel(top) - cumulativeXpAtLevel(classCap);
}

// 共享最高轉職上限（防禦髒資料：只計算合法節點、階數夾在 0..3）
export function effectivePlayerCap(
  classPaths: Record<string, string[]>,
  activeClassId: ClassId | null | undefined,
  activePath: string[],
): number {
  const merged = activeClassId ? { ...classPaths, [activeClassId]: activePath } : { ...classPaths, __active: activePath };
  const validLen = (p: unknown) => (Array.isArray(p) ? Math.min(3, p.filter(id => typeof id === 'string' && !!classNode(id)).length) : 0);
  const tier = Math.max(0, ...Object.values(merged).map(validLen));
  return playerLevelCap(tier);
}

// 玩家最前線推薦等級（保護 bossDown 後 levelProgress 歸 0 與全破 unlockedIndex = 9）
export function frontierRecommendedLevel(input: {
  unlockedIndex: number;
  bestStage: Record<string, number>;
  levelProgress: Record<string, number>;
  bossDown: number[];
  regionIds: readonly string[]; // REGIONS.map(r => r.id)
}): number {
  if (input.unlockedIndex >= input.regionIds.length) return MAX_LEVEL;
  const r = Math.max(0, Math.floor(input.unlockedIndex));
  const id = input.regionIds[r];
  const last = regionStageCount(r) - 1;
  const rawStage = input.bossDown.includes(r)
    ? last
    : Math.max(input.bestStage[id] ?? 0, input.levelProgress[id] ?? 0);
  return recommendedLevel(r, Math.min(last, Math.max(0, Math.floor(rawStage))));
}

// PM v2.2 六段非主線追趕倍率
export function catchUpMultiplier(delta: number): number {
  if (delta <= -4) return 1.25;
  if (delta <= 3) return 1.0;
  if (delta <= 7) return 0.7;
  if (delta <= 10) return 0.4;
  if (delta <= 12) return 0.2;
  return 0;
}

export interface XpGainInput {
  level: number;
  xp: number;
  rawXp: number;
  source: XpSource;
  classCap: number;       // 40 | 100 | 160 | 200
  frontierRecLv: number;  // 5..200
}

export interface XpGainResult {
  level: number;
  xp: number;
  levelsGained: number;
  rawXp: number;
  acceptedXp: number;
  catchupBonusXp: number;     // 非主線 Δ <= -4 多給的部分
  deductedXp: number;         // 非主線被扣掉的部分（送入 8:1 修練津貼計算）
  overflowMainlineXp: number; // 主線因 10 級暫存滿或 Lv200 溢出的部分
}

export function applyXpGain(input: XpGainInput): XpGainResult {
  const startLv = Math.min(MAX_LEVEL, Math.max(1, Math.floor(input.level)));
  const startXp = startLv >= MAX_LEVEL ? 0 : Math.max(0, Math.floor(input.xp));
  const raw = Number.isFinite(input.rawXp) ? Math.max(0, Math.floor(input.rawXp)) : 0;
  const beforeTotal = totalPlayerXp(startLv, startXp);

  if (isMainlineXpSource(input.source)) {
    const hardCapLv = input.classCap < MAX_LEVEL ? Math.min(MAX_LEVEL, input.classCap + CLASS_BUFFER_LEVELS) : MAX_LEVEL;
    const ceilingTotal = cumulativeXpAtLevel(hardCapLv);
    const quota = Math.max(0, ceilingTotal - beforeTotal);
    const accepted = Math.min(raw, quota);
    const overflowMainlineXp = raw - accepted;
    if (accepted === 0) {
      return { level: startLv, xp: startXp, levelsGained: 0, rawXp: raw, acceptedXp: 0, catchupBonusXp: 0, deductedXp: 0, overflowMainlineXp };
    }
    let lv = startLv;
    let cur = startXp + accepted;
    while (lv < input.classCap && cur >= xpToNext(lv)) {
      cur -= xpToNext(lv);
      lv += 1;
    }
    if (lv >= MAX_LEVEL) cur = 0;
    return {
      level: lv,
      xp: cur,
      levelsGained: lv - startLv,
      rawXp: raw,
      acceptedXp: accepted,
      catchupBonusXp: 0,
      deductedXp: 0,
      overflowMainlineXp,
    };
  }

  // 非主線分支（預設採 U2-A：上限取 min(classCap, frontierRecLv + 13, MAX_LEVEL)，絕不覆寫既有 startXp）
  const nonMainlineCapLv = Math.max(1, Math.min(input.classCap, input.frontierRecLv + NON_MAINLINE_MAX_AHEAD, MAX_LEVEL));
  const ceilingTotal = cumulativeXpAtLevel(nonMainlineCapLv);

  if (raw === 0 || startLv >= nonMainlineCapLv || beforeTotal >= ceilingTotal) {
    return {
      level: startLv,
      xp: startXp, // ✅ 既有主線暫存或級內 xp 原封不動！
      levelsGained: 0,
      rawXp: raw,
      acceptedXp: 0,
      catchupBonusXp: 0,
      deductedXp: raw,
      overflowMainlineXp: 0,
    };
  }

  let lv = startLv;
  let cur = startXp;
  let remRaw = raw;
  while (lv < nonMainlineCapLv && remRaw > 1e-9) {
    const mult = catchUpMultiplier(lv - input.frontierRecLv);
    if (mult <= 0) break;
    const gap = xpToNext(lv) - cur;
    const potential = Math.round(remRaw * mult);
    if (potential < gap) {
      cur += potential;
      remRaw = 0;
      break;
    }
    remRaw = Math.max(0, remRaw - gap / mult);
    cur = 0;
    lv += 1;
  }
  if (lv >= MAX_LEVEL) cur = 0;

  const afterTotal = totalPlayerXp(lv, cur);
  const acceptedXp = Math.max(0, afterTotal - beforeTotal);
  return {
    level: lv,
    xp: cur,
    levelsGained: lv - startLv,
    rawXp: raw,
    acceptedXp,
    catchupBonusXp: Math.max(0, acceptedXp - raw),
    deductedXp: Math.max(0, raw - acceptedXp),
    overflowMainlineXp: 0,
  };
}

// 轉職突破上限時立即結算暫存經驗（不改變總經驗 E，除非夾限異常超額舊檔）
export function settleBufferedXp(level: number, xp: number, newClassCap: number): { level: number; xp: number; levelsGained: number } {
  let lv = Math.min(MAX_LEVEL, Math.max(1, Math.floor(level)));
  let cur = lv >= MAX_LEVEL ? 0 : Math.max(0, Math.floor(xp));
  const startLv = lv;
  while (lv < newClassCap && cur >= xpToNext(lv)) {
    cur -= xpToNext(lv);
    lv += 1;
  }
  if (lv >= MAX_LEVEL) {
    lv = MAX_LEVEL;
    cur = 0;
  } else if (lv >= newClassCap) {
    const newHardCapLv = Math.min(MAX_LEVEL, newClassCap + CLASS_BUFFER_LEVELS);
    const maxValidXp = Math.max(xpToNext(lv) - 1, cumulativeXpAtLevel(newHardCapLv) - cumulativeXpAtLevel(lv));
    cur = Math.min(cur, maxValidXp);
  }
  return { level: lv, xp: cur, levelsGained: lv - startLv };
}

// 讀檔遷移正規化：與 settleBufferedXp 相同邏輯，安全處理 F5 重整、舊版溢滿與損毀超額值
export const normalizePlayerProgress = settleBufferedXp;

// 每日修練津貼金幣計算（8 EXP = 1 Gold，每日上限 150 + 50 * 區序，不乘商店 goldMult）
export function dailyAllowanceCap(unlockedIndex: number, regionCount = 9): number {
  const idx = Math.min(regionCount - 1, Math.max(0, Math.floor(unlockedIndex)));
  return 150 + 50 * idx;
}

export function settleAllowanceGold(input: {
  deductedXp: number;
  today: string;
  allowanceDay: string;
  allowanceGold: number;
  allowanceRemainder: number;
  unlockedIndex: number;
}): { goldGranted: number; nextDay: string; nextGold: number; nextRemainder: number } {
  const cap = dailyAllowanceCap(input.unlockedIndex);
  const sameDay = input.allowanceDay === input.today;
  const usedGold = sameDay ? Math.max(0, Math.floor(input.allowanceGold)) : 0;
  const prevRem = sameDay ? Math.min(XP_ALLOWANCE_DIVISOR - 1, Math.max(0, Math.floor(input.allowanceRemainder))) : 0;
  const deducted = Math.max(0, Math.floor(input.deductedXp));

  if (deducted === 0 || usedGold >= cap) {
    return {
      goldGranted: 0,
      nextDay: input.today,
      nextGold: Math.min(cap, usedGold),
      nextRemainder: usedGold >= cap ? 0 : prevRem,
    };
  }
  const pool = prevRem + deducted;
  const rawGold = Math.floor(pool / XP_ALLOWANCE_DIVISOR);
  const room = cap - usedGold;
  const goldGranted = Math.min(rawGold, room);
  const nextGold = usedGold + goldGranted;
  const nextRemainder = nextGold >= cap ? 0 : pool % XP_ALLOWANCE_DIVISOR;
  return { goldGranted, nextDay: input.today, nextGold, nextRemainder };
}

// 距上限 3 級內且可免費轉職突破上限提示判定
export function shouldWarnFreeAdvance(input: {
  level: number;
  classCap: number;
  homeClass: ClassId | null;
  activeClass: ClassId | null;
  activePath: string[];
  classPaths: Record<string, string[]>;
}): boolean {
  if (!input.activeClass || input.classCap >= MAX_LEVEL || input.level < input.classCap - 3) return false;
  const home = input.homeClass ?? input.activeClass;
  const merged = { ...input.classPaths, [input.activeClass]: input.activePath };
  const homeTier = Math.min(3, (merged[home] ?? []).length);
  if (homeTier >= 3) return false;
  const nextTier = (homeTier + 1) as 1 | 2 | 3;
  // 只有當主職往下一階轉職能提高（或解除）當前全域 classCap 時才提示免費突破
  return playerLevelCap(nextTier) > input.classCap && canAdvance(nextTier, input.level);
}
```

---

## 4. 九個具體輸入輸出實算範例（數字全數驗算，可直接作單元測試）

> **基礎查表公式**：$\text{xpToNext}(L) = 100 + 10L$；累積經驗 $C(L) = (L - 1)(100 + 5L)$。
> 常用基準點：$C(5)=500$、$C(15)=2,450$、$C(18)=3,230$、$C(38)=10,730$、$C(39)=11,210$、$C(40)=11,700$、$C(45)=14,300$、$C(46)=14,850$、$C(50)=17,150$、$C(81)=40,400$、$C(100)=59,400$、$C(110)=70,850$、$C(199)=216,810$、$C(200)=218,900$。

---

### 【例 1】主線跨級撞上 `Lv 40` 轉職上限 → 寫入暫存池 → 一轉立即結算連升 6 級
- **輸入（步驟 1A：主線入帳）**：
  - 狀態：未轉職法師（`homeClass = 'mage'`, `classPath = []`, `classPaths = {}` → `classCap = 40`, `classBufferMax(40) = 5,450`, $C(50) = 17,150$）。
  - `player = { level: 39, xp: 450 }`（`xpToNext(39) = 490`，$E_{\text{before}} = 11,210 + 450 = 11,660$）。
  - 呼叫：`applyXpGain({ level: 39, xp: 450, rawXp: 3200, source: 'firstClear', classCap: 40, frontierRecLv: 38 })`。
- **實算與輸出（步驟 1A）**：
  - `quota = 17,150 - 11,660 = 5,490 >= 3,200` → `acceptedXp = 3,200`，`overflowMainlineXp = 0`。
  - 先扣 `490 - 450 = 40` 升上 `Lv 40`，剩餘 `3,200 - 40 = 3,160` 留存於 `player.xp`。
  - 回傳：`{ level: 40, xp: 3160, levelsGained: 1, acceptedXp: 3200, deductedXp: 0, overflowMainlineXp: 0 }`（$E_{\text{mid}} = 11,700 + 3,160 = 14,860$；同時 `shouldWarnFreeAdvance` 回傳 `true`）。
  - 帳本：`offered:firstClear += 3200`, `accepted:firstClear += 3200`。
- **輸入與輸出（步驟 1B：執行免費一轉 `advanceClass('elementalist')`）**：
  - `newClassCap = 100`；呼叫 `settleBufferedXp(40, 3160, 100)`。
  - 依序扣除 `xpToNext(40..45) = 500 + 510 + 520 + 530 + 540 + 550 = 3,150`，剩餘 `3,160 - 3,150 = 10 < xpToNext(46) = 560`。
  - 回傳：`{ level: 46, xp: 10, levelsGained: 6 }`，觸發 `trackDaily('levelup', 6)`。
  - 對帳檢核：$E(46, 10) = 14,850 + 10 = \mathbf{14,860} \equiv E(40, 3160)$，**誤差 0，帳本不重複加計 `accepted`**。

---

### 【例 2】已有主線暫存 `3,160 EXP` 時打非主線素材本（`frontier + 13 < 40` 絕不刪掉主線暫存！）
- **輸入**：
  - 承例 1A 尚未轉職：`player = { level: 40, xp: 3160, classPath: [] }`，`classCap = 40`，$E_{\text{before}} = 14,860$。
  - `unlockedIndex = 1`（A2），最前線 `stageIdx = 25` → `frontierRecLv = 21 + Math.floor((25 / 101) * 19) = 25`，故 **`nonMainlineCapLv = min(40, 25 + 13, 200) = 38 < 40`**（$C(38) = 10,730$）。
  - 今日津貼狀態：`today = '2026-11-01'`, `allowanceDay = '2026-11-01'`, `allowanceGold = 0`, `allowanceRemainder = 0`, `gold = 500`。
  - 呼叫：A2 素材本答對 10 題，`rawXp = Math.round(10 * 8 * 1.3) = 104`, `source = 'rush'`。
- **實算與輸出**：
  - 因 `startLv (40) >= nonMainlineCapLv (38)` 且 `beforeTotal (14,860) >= ceilingTotal (10,730)`，非主線直接短路保護：
  - `applyXpGain` 回傳：`{ level: 40, xp: 3160, levelsGained: 0, rawXp: 104, acceptedXp: 0, catchupBonusXp: 0, deductedXp: 104, overflowMainlineXp: 0 }`——**原有 `3,160` 主線暫存 EXP 毫髮無傷**！
  - `settleAllowanceGold`：A2 每日上限 `150 + 50 * 1 = 200 Gold`；`104 / 8 = 13 Gold`（餘 `0`），實發 `goldGranted = 13` → `gold = 513`, `xpAllowanceGold = 13`, `xpAllowanceRemainder = 0`。
  - 帳本：`offered:rush += 104`, `accepted:rush += 0`, `deducted:rush += 104`, `allowanceGold:rush += 13`。

---

### 【例 3】主線暫存池達 10 級上限（`5,450 EXP`）滿溢時的截斷與對帳
- **輸入**：
  - 未轉職 `classCap = 40`, `hardCapLv = 50`（$C(50) = 17,150$），`player = { level: 40, xp: 5200 }`（$E_{\text{before}} = 11,700 + 5,200 = 16,900$，距 `5,450` 滿池剩 `250 EXP`）。
  - 呼叫：`applyXpGain({ level: 40, xp: 5200, rawXp: 600, source: 'firstClear', classCap: 40, frontierRecLv: 38 })`。
- **實算與輸出**：
  - `quota = 17,150 - 16,900 = 250` → `acceptedXp = min(600, 250) = 250`，`overflowMainlineXp = 600 - 250 = 350`。
  - 回傳：`{ level: 40, xp: 5450, levelsGained: 0, rawXp: 600, acceptedXp: 250, catchupBonusXp: 0, deductedXp: 0, overflowMainlineXp: 350 }`。
  - 帳本：`offered:firstClear += 600`, `accepted:firstClear += 250`, `overflowMainline:firstClear += 350`（主線滿池溢出不發修練津貼金幣；後續若點一轉，`settleBufferedXp(40, 5450, 100)` 精準回傳 `{ level: 50, xp: 0, levelsGained: 10 }`）。

---

### 【例 4】非主線落後追趕祝福（`×1.25`）與超前單筆跨三段倍率鎖死 `frontier + 13`＋每日津貼封頂
- **子例 4A（落後追趕祝福 `Δ <= -4`）**：
  - 輸入：二轉 `classCap = 160`，B2（`unlockedIndex = 5`, `frontierRecLv = 120`），`player = { level: 115, xp: 1000 }`（`xpToNext(115) = 1,250`，`Δ = -5`），首通塔第 18 層 `rawXp = Math.round(120 * 2.3) = 276`, `source = 'tower'`。
  - 實算：
    - `Lv 115`（`Δ = -5, mult = 1.25`）缺 `250 EXP`，消耗 `250 / 1.25 = 200 rawXp` 升上 `Lv 116, xp = 0`；
    - 剩餘 `76 rawXp` 在 `Lv 116`（`Δ = -4, mult = 1.25`）折算 `Math.round(76 * 1.25) = 95 EXP`。
  - 輸出：`{ level: 116, xp: 95, levelsGained: 1, rawXp: 276, acceptedXp: 345, catchupBonusXp: 69, deductedXp: 0, overflowMainlineXp: 0 }`；`goldGranted = 0`。
- **子例 4B（超前單筆跨多級撞上 `frontier + 13` 硬頂＋津貼觸頂）**：
  - 輸入：A1 第 1 關（`unlockedIndex = 0`, 津貼上限 `150 Gold`, `frontierRecLv = 5`, `nonMainlineCapLv = 5 + 13 = 18`），未轉職 `classCap = 40`，`player = { level: 15, xp: 220 }`（`xpToNext(15) = 250`，$E_{\text{before}} = 2,670$），今日已領津貼 `allowanceGold = 142`, `allowanceRemainder = 0`, `gold = 300`。傳入大額測試 `rawXp = 3000`, `source = 'replay'`。
  - 實算：
    - `Lv 15 → 16`（`Δ = +10, mult = 0.4`）：缺 `30 EXP`，耗 `30 / 0.4 = 75 rawXp`（剩 `2,925`）；
    - `Lv 16 → 17`（`Δ = +11, mult = 0.2`）：缺 `260 EXP`，耗 `260 / 0.2 = 1,300 rawXp`（剩 `1,625`）；
    - `Lv 17 → 18`（`Δ = +12, mult = 0.2`）：缺 `270 EXP`，耗 `270 / 0.2 = 1,350 rawXp`（剩 `275`）；
    - 抵達 `Lv 18 === nonMainlineCapLv` 迴圈終止，剩餘 `275 rawXp` 倍率 `0`。
    - `acceptedXp = 30 + 260 + 270 = 560`（$E(18, 0) - E(15, 220) = 3,230 - 2,670 = 560$），`deductedXp = 3,000 - 560 = 2,440`。
    - 津貼折算：`floor(2,440 / 8) = 305 Gold`，受當日剩餘額度 `150 - 142 = 8 Gold` 封頂，實發 **`8 Gold`**。
  - 輸出：`player = { level: 18, xp: 0 }`（精準停在 `frontier + 13` 且 `xp = 0`），`levelsGained = 3`；`gold = 308`, `xpAllowanceGold = 150`, `xpAllowanceRemainder = 0`；帳本 `offered:replay += 3000`, `accepted:replay += 560`, `deducted:replay += 2440`, `allowanceGold:replay += 8`。

---

### 【例 5】`resetClassPath()` 重設轉職路線後 `level > classCap` 的雙情境保護
- **輸入**：主職法師已一轉 `player = { level: 45, xp: 230, classPath: ['elementalist'] }`（$E_{\text{before}} = 14,300 + 230 = 14,530$），其他職業未轉職。
- **步驟 5A（呼叫 `resetClassPath()`）**：
  - `classPath = []`, `classPaths.mage = []` → `newClassCap = 40`（`hardCapLv = 50`, $C(50) = 17,150$）。
  - 輸出：`player` 保持 **`{ level: 45, xp: 230, classPath: [] }`**（絕不降級、絕不清零 `xp`）。
- **步驟 5B（未重選分支前獲得主線 `rawXp = 3000, source = 'firstClear'`）**：
  - `quota = 17,150 - 14,530 = 2,620` → `acceptedXp = 2,620`, `overflowMainlineXp = 380`；因 `lv (45) >= classCap (40)` 不升級，`xp` 增至 `230 + 2,620 = 2,850`。
  - 輸出：`{ level: 45, xp: 2850, levelsGained: 0 }`（$E = 17,150 = C(50)$）。
- **步驟 5C（重選一轉分支 `advanceClass('chronomancer')`，`newClassCap = 100`）**：
  - `settleBufferedXp(45, 2850, 100)` 扣除 `xpToNext(45..49) = 550 + 560 + 570 + 580 + 590 = 2,850` → 輸出 **`{ level: 50, xp: 0, levelsGained: 5 }`**（防堵了「重置再存 10 級跳上 Lv 55」的漏洞）。
- **補充邊界 5D（若在 `Lv 52, xp = 400` 按 `resetClassPath()`）**：$E(52, 400) = 18,760 > C(50)$，重選前獲得 `500` 主線 EXP 時 `quota = 0, acceptedXp = 0`，原 `{ level: 52, xp: 400 }` 完整保留。

---

### 【例 6】`switchClass()` 切換職業與跨職徽章轉職結算
- **子例 6A（二轉法師切到未轉職劍士，不誤鎖共享上限）**：
  - 狀態：`classPaths = { mage: ['elementalist', 'archmage'] }`, `player = { level: 95, xp: 600, classPath: ['elementalist', 'archmage'] }`（`xpToNext(95) = 1,050`）。
  - 執行 `switchClass('swordsman')` 後：`player.classPath = []`，但 `effectivePlayerCap` 讀出 `bestTier = 2` → **`classCap = 160`**。
  - 再領主線 `rawXp = 500`：`600 + 500 = 1,100 >= 1,050` → 正常升至 **`{ level: 96, xp: 50, levelsGained: 1 }`**。
- **子例 6B（主職未轉職卡 `Lv 40, xp = 2060`，切到劍士花 10 徽章一轉突破共享上限）**：
  - 狀態：`homeClass = 'mage'`, `character.classId = 'swordsman'`, `classBadges = 15`, `player = { level: 40, xp: 2060, classPath: [] }`, `classPaths = { mage: [], swordsman: [] }`（`classCap = 40`）。
  - 執行 `advanceClass('squire')`：扣 `10` 徽章（剩 `5`），`classPaths.swordsman = ['squire']` → `newClassCap = 100`；立即呼叫 `settleBufferedXp(40, 2060, 100)`，扣除 `500 + 510 + 520 + 530 = 2,060` → 輸出 **`{ level: 44, xp: 0, classPath: ['squire'] }`**（`levelsGained = 4`）。

---

### 【例 7】`verifyPlacement()` 跳級補等級防雙領與雙門檻夾限保護
- **子例 7A（程度測驗跳級驗證補等級）**：
  - 輸入：未轉職玩家 `player = { level: 12, xp: 180, classPath: [] }`（$E_{\text{before}} = C(12) + 180 = 11 \times 160 + 180 = 1,940$），`placement = { level: 5, region: 4, verified: false, ... }`（B1+ 起始推薦等級 `floor = REGION_LEVELS[4][0] = 81`，$C(81) = 40,400$）。
  - 執行 `verifyPlacement(4)`：因 $1,940 < 40,400$，`player` 更新為 **`{ level: 81, xp: 0, classPath: [] }`**（**舊 `xp: 180` 必須清為 `0`**，不可帶到 `Lv 81`），並記錄 `xpLedger.placementXpGrant += 40,400 - 1,940 = 38,460`（對帳：$1,940 + 38,460 = 40,400 \equiv E(81, 0)$）。此時 `classCap = 40 < 81`，`shouldWarnFreeAdvance` 回傳 `true`。
- **子例 7B（極端超額緩衝跨門檻夾限）**：
  - 若異常狀態 `{ level: 40, xp: 60000 }` 點一轉（`newClassCap = 100`, `newHardCapLv = 110`）：`settleBufferedXp(40, 60000, 100)` 消耗 $C(100) - C(40) = 47,700$ 升至 `Lv 100`，剩餘 `12,300` 被夾限至 `classBufferMax(100) = 11,450`，輸出 **`{ level: 100, xp: 11450, levelsGained: 60 }`**，絕不越過二轉上限升上 `Lv 101`。

---

### 【例 8】`Lv 199 → Lv 200`（`MAX_LEVEL` 滿級無暫存池與滿級對帳）
- **輸入**：已覺醒 `classCap = 200`（`classBufferMax(200) = 0`, $C(200) = 218,900$），`unlockedIndex = 8`（C2，每日津貼上限 `550 Gold`），`frontierRecLv = 200`，`player = { level: 199, xp: 1900 }`（`xpToNext(199) = 2,090`，距滿級差 `190 EXP`，$E_{\text{before}} = 218,710$），`xpAllowanceGold = 0`, `gold = 2,000`。
- **步驟 8A（C2 主線首通 `rawXp = 800, source = 'firstClear'`）**：
  - `quota = 218,900 - 218,710 = 190` → `acceptedXp = 190`, `overflowMainlineXp = 610`。
  - 輸出：**`{ level: 200, xp: 0, levelsGained: 1 }`**（`Lv 200` 嚴格 `xp = 0`，絕不暫存 10 級份量）；帳本 `offered:firstClear += 800`, `accepted:firstClear += 190`, `overflowMainline:firstClear += 610`。
- **步驟 8B（`Lv 200` 後打 C2 每日素材本 `rawXp = 336, source = 'rush'`）**：
  - `startLv (200) >= nonMainlineCapLv (200)` → `acceptedXp = 0`, `deductedXp = 336`, `player` 保持 `{ level: 200, xp: 0 }`。
  - 依 U4-A 折算修練津貼：`336 / 8 = 42 Gold <= 550` → `gold = 2,042`, `xpAllowanceGold = 42`；帳本 `offered:rush += 336`, `accepted:rush += 0`, `deducted:rush += 336`, `allowanceGold:rush += 42`。

---

### 【例 9】讀檔遷移 `migrateSave`（v21 → v22 與 F5 同版本重整清洗）三組向量
1. **向量 9A（v22 合法暫存檔按 F5 重整網頁）**：
   - 輸入：`version = 22`, `character = { classId: 'mage', ... }`, `player = { level: 40, xp: 4500, classPath: [] }`, `classPaths = {}`。
   - 輸出：`classCap = 40` → `normalizePlayerProgress(40, 4500, 40)` 原封不動保留 **`{ level: 40, xp: 4500, classPath: [] }`**。
2. **向量 9B（v21 舊檔 `level < classCap` 卻帶溢滿未進位 `xp`）**：
   - 輸入：`version = 21`, `character = { classId: 'mage', ... }`, `player = { level: 35, xp: 1800, classPath: ['elementalist'] }`, `classPaths = {}`。
   - 實算：先同步 `classPaths.mage = ['elementalist']` 得 `classCap = 100`；再扣除 `xpToNext(35..37) = 450 + 460 + 470 = 1,380`，剩 `420 < xpToNext(38) = 480`。
   - 輸出：**`{ level: 38, xp: 420, classPath: ['elementalist'] }`**，且補齊 `xpAllowanceDay: ''`, `xpAllowanceGold: 0`, `xpAllowanceRemainder: 0`。
3. **向量 9C（覺醒 `Lv 175` 重置路線後按 F5 重整 vs 惡意篡改超額檔）**：
   - 輸入 C1（合法高階重置後重整）：`player = { level: 175, xp: 800, classPath: [] }`, `classPaths = { mage: [] }`（`classCap = 40, hardCapLv = 50`）→ `maxValidXp = max(1850 - 1, C(50) - C(175)) = 1849`，`800 <= 1849` → **完整保留 `{ level: 175, xp: 800 }`**！
   - 輸入 C2（損毀／篡改）：`player = { level: 40, xp: 999999, classPath: [] }`, `classCap = 40`, `xpAllowanceGold = -99` → 夾限輸出 **`{ level: 40, xp: 5450 }`**，`xpAllowanceGold = 0`。

---

## 5. 給 Codex 的必寫單元測試斷言清單（Vitest Checklist）

1. **單調不減屬性測試（Property Invariant）**：對隨機合法狀態 `(level, xp, classCap, frontierRecLv)` 與任意 `rawXp >= 0`、任意 `source`，斷言 `totalPlayerXp(res.level, res.xp) >= totalPlayerXp(level, xp)`，且 `res.acceptedXp === totalPlayerXp(res.level, res.xp) - totalPlayerXp(level, xp)`。
2. **主線暫存防誤刪回歸**：構造 `(level = 40, xp = 3160, classCap = 40, frontierRecLv = 25)`，依序呼叫 `rush`、`tower`、`sweep`、`replay`、`dojo`，斷言 `player.xp` 恆等於 `3160`。
3. **非主線 `+13` 硬封頂回歸**：構造 `frontierRecLv = 5`（及 `60`、`187`），連續灌入 `100` 次大額非主線 EXP，斷言 `player.level <= Math.min(classCap, frontierRecLv + 13, 200)`，且達該上限時 `player.xp === 0`（除非進場前已有更高之主線 `xp`）。
4. **重刷已首通小關識別回歸**：首通某小關後再次進入同一小關答題，斷言 `grantLearningXp` 走非主線 `'replay'` 追趕曲線；而未首通小關戰敗重試時仍走主線全額。
5. **全職業與跳級狀態轉移回歸**：涵蓋例 5（`resetClassPath` 在 `Lv 45` 與 `Lv 52`）、例 6（`switchClass` 主副職互切與副職徽章一轉結算）、例 7（`verifyPlacement` 舊 `xp` 清零與 `placementXpGrant` 入帳）。
6. **F5 重整與遷移冪等性回歸**：對上述所有邊界狀態執行 `JSON.parse(JSON.stringify(partialize(state)))` 再餵入 `migrateSave(persisted, SAVE_VERSION)` 連續兩次，斷言輸出與原狀態 `deepEqual`（冪等性 Idempotency）。
7. **全期對帳斷言**：在模擬與 store 整合測試中，斷言 `E(initial) + sum(accepted) + placementXpGrant === E(save.player)` 且每日 `xpAllowanceGold <= 150 + 50 * min(8, unlockedIndex)`。
