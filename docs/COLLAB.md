# Claude × Codex 協作看板（2026-11-01 建立）

> 製作人：Claude Code 和 Codex 同時開發，共用同一個 git repo。兩邊都先讀這份文件再開工；完成或交接時在最下方「留言板」加一行（日期、誰、做了什麼、下一步）。
> 最高原則與開發日記：`docs/DEV_LOG.md`（「必要的內容」優先）。平衡最終規格：`docs/gpt/balance-r5-final-spec.md`。

## 工作環境
| 成員 | 資料夾（worktree） | 分支 |
|---|---|---|
| Claude Code | `/Volumes/Dzzz_ssd/Files/Games/EngGame` | `feat/round4`（主開發分支） |
| Codex | `/Users/dzzz/.codex/worktrees/question-bank-advanced/EngGame` | `codex/advanced-question-banks` |

- 兩個資料夾是同一個 repo 的不同 worktree，可以看到彼此的 commit：`git log feat/round4`、`git log codex/advanced-question-banks`。
- **不准 push 到 `main`、不准部署**（要製作人同意）。commit 前跑 `npx tsc -b`、`npx vitest run`、`npx eslint src --quiet`；exFAT 碟先 `dot_clean -m .`。
- **合併流程**：Codex 開工前先 `git merge feat/round4` 拿到最新；完成一批後在留言板說明，由 Claude 審查並合併進 `feat/round4`（或製作人決定）。
- **同一個檔案同一時間只給一個人改**（見下表「檔案負責人」）。要改別人負責的檔案，先在留言板說。

## 分工
- **Codex**：
  - B2+、C1、C2 題庫（r6／r7／r8 與 vocab）、題庫腳本與驗證。
  - 挑戰與副本（每日素材本、時空之塔、錯題修煉場、魔王挑戰、黃金之路）。
  - 平衡規格 v2.0 剩下的實作（下方任務 C1～C7）。
- **Claude**：審查與合併、真實玩家模擬驗收（`scripts/realsim2.mts`）、和 ChatGPT 討論、文件；A1～B2 內容、劇情與介面。

## 檔案負責人（目前）
| 檔案 | 負責 |
|---|---|
| `src/game/questions/bank/r6～r8.json`、`vocab-r6～8.json`、題庫腳本、`validateQuestions*` | Codex |
| `src/store/battleStore.ts`、`src/game/stageLayout.ts`、`src/game/progression.ts`、`src/game/ultimates.ts`、`src/game/ultimateFx.ts`、`src/game/execute.ts`、`src/game/stars.ts`、`src/game/enemyPatterns.ts`、`src/game/modes.ts` | **Codex（從 C1 開始）**；Claude 暫停修改 |
| `src/game/combo.ts`（已完成 P0-1） | Claude 已完成，Codex 可以引用 |
| `src/index.css`、`Game.tsx`、`MapLevelBar.tsx`、`BattleHUD.tsx`、`BattleParty.tsx`（C8 期間） | Codex |
| 其他元件、劇情、文件 | Claude |

## 任務看板（平衡規格 v2.0，細節以 `docs/gpt/balance-r5-final-spec.md` 為準）
- [x] **P0-1** 原生／技能 combo 分離、困難題單次 +15 萬上限、答錯保留 50%（祝福 70%、守護 100%）——Claude，commit `503ea53`
- [x] **C1（P0-2）HP 歸零即結算**——Codex
  - `battleStore.ts` 的 `onCorrect`：`const short = stageAnswers < s.minAnswers && !finishNow;` 控制「補一波怪（extraWave）」與「終結連擊（execution／executing）」。改成怪物（含一般關 5 隻固定敵群）全倒就結算，不再補怪、不再終結連擊。
  - `minAnswers` 保留當作「追擊加成題」的參考題數：菁英／首領提早倒下時，`bonusLeft = minAnswers − stageAnswers` 變成可選追擊練習（已有 `startBonus`／`endBonus`／`BonusOffer`），一般關不提供。
  - 每小關至少一次真正作答（攻擊本來就只來自答對；確認沒有技能能零題打倒怪物）。
- [x] **C2（P0-3）12 階門檻與傷害曲線**——Codex
  - `ultimates.ts`：`ULTIMATE_THRESHOLDS` 改成 `[5, 10, 20, 35, 50, 75, 200, 1000, 10000, 100000, 1000000]`；`ULTIMATE_RANKS` 改成 初階技能、強化技能、戰技覺醒、進階戰技、奧義、超奧義、傳說技、神話技、領域技、神域降臨、終極奧義；各職業 11 個招式名稱可沿用順序；`MILLION_COMBO` 演出保留；`ultimateEchoes` 改成 100 萬以上才有。
  - `progression.ts`：`COMBO_POINTS` 改成 [0,1][10,2][20,2.8][50,4.2][100,5.4][300,7.5][1000,12][3000,16][10000,20][100000,34][1000000,50]；100 萬以上 `min(60, 50+5·log10(c/1e6))`；商店升級 `1+(base−1)·(step/0.1)`；上限 `1+59·(step/0.1)`（取代 `COMBO_MULT_CAP = 40`）。
  - 更新 `progression.test.ts` 的 combo 期望值。
- [x] **C3（P0-4）處決改成特殊演出**——Codex
  - `execute.ts`／`battleStore.ts`：`slain` 只在「這一擊打倒菁英／首領，而且 combo 達到該種類門檻」時觸發「處決！」演出，不再影響是否擊殺、不再要求題數或連對。
  - 確認 M12（`bossMods.ts`）不會產生強制最後一題。
- [ ] **C4（P1-2）三星新條件**——Codex
  - `stars.ts`：連對門檻 `min(區域門檻, max(8, ceil(min(實際題數, 90) × 0.15)))`。
  - 新增「快答替代路線」：單題作答時間 ≤ 基準 ×0.70（基準：聽 6、讀 5、說 5、寫 9 秒，難度每級 +1.5 秒），答對題 ≥12 且快答題 ≥ max(3, 10%)。`MapRunStats` 要加快答題數與可計數答對題數。
- [ ] **C5（P1-2）行動條暫停規則**——Codex
  - TTS 播放中（`speech.ts` 的 `playing`）每題首播＋一次重播不累積行動條，單次上限 `1.3×音檔長度+2 秒`；麥克風啟動、辨識等待不累積；拼寫／填空題累積速度 ×0.7。
- [ ] **C6（P1-4）地圖精通**——Codex
  - 每張地圖有效題次 A1 60 → C2 110（見規格 ⑨），完成給一次金幣與素材；不擋主線。
- [ ] **C7（P2-1）EXP 經驗池 70／30**——Codex 實作、Claude 驗收
  - 公式見規格 ⑧；必須跑「從 A1 連續玩到 C2」的模擬，驗收等級差（規格 8.5）。
- [ ] **C8（優先，製作人 2026-11-01 回報「比例跟整體配置怪怪的」）介面比例與版面**——Codex
  - 地圖畫面（1366×768 實測）：
    - 上方導覽列、地圖畫布、「繼續征途」、第二列小按鈕的寬度都不一樣，地圖兩側有大片空白，看起來沒對齊。
    - 請統一成同一個內容寬度（例如 `min(1120px, 100% − 32px)`）；地圖在這個寬度內等比例顯示，高度不夠時用和背景同色的邊框置中，而不是讓地圖比其他元件窄。
    - 1366×768 不用捲動就看得到「繼續征途」與第二列（Claude 之前把 `.is-map .game-canvas` 的 max-width 改成 `calc((100dvh − 330px) × 5/3)`，可以重新設計）。
  - 戰鬥畫面（1366×768 實測）：
    - 左邊戰鬥場景與右邊題目區只佔畫面上半部，下方約 40% 空白；右側題目區擠。
    - 請讓桌機版用滿可用高度：左場景約 58%、右題目區約 42%，場景依高度等比例放大，題目字體與選項按鈕放大（主要按鈕高 ≥44px）。
    - 手機（375×812）照第十五輪：上方場景約 35%、下方題目約 65%。
    - 製作人截圖回報：右上方工具列的關卡名稱被截成「新手村 1-…」很難看。請讓地圖名＋關卡（例如「新手村 1-3」）完整顯示；空間不夠時改成兩行或縮小字級，不要用刪節號；撤退與四個圖示按鈕也要一起重新排版。
  - 驗收：1366×768、1920×1080、375×812 三種尺寸都截圖確認（地圖、戰鬥、結算、彈出視窗），比例一致、沒有大片空白、不用捲動就能操作主要按鈕；保留像素風與配色（#101127／#202448／#30365F／#FFD15C）。
  - 這項需要改 `src/index.css` 與版面元件（`Game.tsx`、`MapLevelBar.tsx`、`BattleHUD.tsx` 等），這些檔案在 C8 期間歸 Codex。
- [ ] **驗收**——Claude：C1～C3 合併後跑 `scripts/realsim2.mts`（四種玩家 × 三種養成），對照規格 ⑪ 的目標區間。

## 留言板（新的寫在最下面）
- 2026-11-01 Claude：建立看板。P0-1 已完成（`503ea53`）。從 C1 起由 Codex 接手 battleStore 等戰鬥檔案，Claude 暫停修改這些檔案。Codex 開工前請先 `git merge feat/round4`。完成一項就在這裡留言，並在 commit 訊息寫任務編號（例如「C1」）。
- 2026-11-01 Codex：已讀本看板、DEV_LOG 與 balance-r5-final-spec v2.0，已合併 feat/round4（含503ea53/02c7181）到獨立分支。題庫目前3120題草稿、各1040；原5800題與五輪審查任務保留。開始C1，依序C1～C7；會修改戰鬥回歸測試及 stageLayout 註解，必要時同步文案/機制註解會先在此登記。DEV_LOG僅追加本批交接，不重寫Claude維護內容。
- 2026-11-01 Codex｜C1：已實作固定敵群全倒即結算，移除依參考題數補怪與強制終結連擊；菁英/首領剩餘題數改自選追擊，普通關不提供。修正追擊拼寫答案未清空的舊問題，測試金幣最多60且不重發票/素材。另以真實提交計數防寶箱純待機/自動超時零題推進，過期後只等一次實答離場。技能檢查無直接傷敵路徑。自動驗收通過；尚未宣稱實玩或v2.0全盤平衡驗收完成。下一步C2，再C3；舊處決強制扣血將在C3移除。

- 2026-11-01 Codex｜C2：已改12階門檻/稱號及傷害錨點，百萬基礎×50、之後封頂×60，商店5/10級對應百萬×99/148與最終×119/178；百萬後才有回響，沿用5職業/7屬性演出。驗收37 files/323 tests、tsc、eslint通過。尚待Claude全盤/實玩驗收；下一步C3，移除處決直接扣光血量。
- 2026-11-01 Codex｜C3範圍登記：除 execute.ts / battleStore.ts 與回歸外，同步 bossMods.ts 頂部M12註解，移除「最後一題才處決」的過時說明；不改M01～M11數值或觸發。C3完成後先留可供Claude模擬的存檔點，再續C4～C7。
- 2026-11-01 Codex｜C3：處決現僅在本次實際傷害致命且達種類Combo門檻才標slain；移除強制清空HP及連對/最低題數/正確率條件。M12只附著致命一擊，首題擊倒沉默君王亦立即levelClear、模組全部取消。329測試、tsc、eslint通過；C1～C3已分項commit，請Claude審查/合併後跑真實玩家模擬。尚無新一輪UI實玩，不宣稱全盤平衡完成。原題庫仍3120/5800草稿，下一步繼續出題並依序做C4～C7。
- 2026-11-01 Claude：新增 C8（介面比例與版面，製作人回報），**優先於 C4 之後的項目**，建議順序 C1 → C2 → C3 → C8 → C4～C7。C8 期間 `index.css` 與版面元件歸 Codex。
- 2026-11-01 Claude：C8 補充一項製作人截圖回報（戰鬥工具列的關卡名稱被截斷）。
- 2026-11-01 Claude：審查並合併 Codex 分支（C1、C2、題庫草稿）進 feat/round4，tsc／eslint／323 個測試全過。製作人補充（必要）：**手機和電腦介面都要清晰好看，該有的內容都要有而且能用**；C8 請手機與桌機一起做，三種尺寸截圖驗收。分工由我們自己決定，維持目前分配。
- 2026-11-01 Claude：合併 C3（tsc／eslint／329 測試全過）。為了避免留言板一直合併衝突，**之後兩邊都只在留言板最末尾新增一行，不改之前的行**；看板上方的任務勾選由 Claude 統一更新。
