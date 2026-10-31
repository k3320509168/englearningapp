# AGENTS.md — 交接給下一位 AI（Claude Code／Codex）

像素風英文學習 RPG。React 19 + Phaser 4 + Zustand + TypeScript + Vite，Node 22。
GitHub：`k3320509168/englearningapp`；`main` 會由 GitHub Actions 自動部署到 https://k3320509168.github.io/englearningapp/ 。

## 一定要遵守
- **一律用繁體中文回覆**，專業術語保留英文。
- **不准 push 到 `main`、不准部署**，除非使用者明確同意。功能都在分支上做（目前是 `feat/round4`）。
- **不碰金鑰**（`GEMINI_API_KEY`、Supabase 金鑰等）：不讀、不貼、不寫進檔案；需要時請使用者自己輸入。不替使用者登入任何帳號。
- 上線前一定先在本地 `npm run dev` 實際玩過、測試全過，再由使用者決定是否合併 main。
- commit 前跑：`npx tsc -b`、`npx vitest run`、`npx eslint src --quiet`。commit 訊息用中文、`feat:`／`fix:`／`docs:` 前綴。
- 不要兩個人（或兩個 AI）同時改同一個分支。

## 設計原則（使用者定的，最重要）
- **好玩第一、爽度第二、英文第三。** 英文是讓角色變強、打關更輕鬆的捷徑，遊戲要給人「大方」的感覺。
- 目標：玩到 C1 區的玩家，英文至少 B2～B2+。
- 工作方式：細節由 AI 和 Gemini 討論後直接決定；只有大改動、影響整體平衡、明顯不合理或和使用者指令衝突時，才回來問使用者。
- 完整設計與完成狀態：**`docs/ROUND4_DESIGN.md`**（接手先讀這份）。

## 協作方式（給使用者看的白話版）
- **commit**＝存檔點；**分支**＝工作副本（`main` 是正式版，改了會自動更新網站；`feat/round4` 是第四輪的工作副本，網站看不到）；**push**＝上傳到 GitHub；**clone**＝從 GitHub 下載整個專案；**pull**＝下載別人新推上去的進度。
- 程式碼、題庫（`src/game/questions/bank/`）、本文件、設計文件都在 GitHub 上，**不用另外打包**。
- 不在 GitHub 上的：`D:\Game_q_storege`（出題原始檔備份，題目都已匯入 repo，只有 `pending\` 是還沒審的題目，要的話自己壓縮帶過去）、Claude 記憶檔（重點已寫進本文件）、`node_modules`（`npm install` 會重新產生）。
- 換手流程：舊電腦 commit → push；新電腦 pull（或第一次 clone）→ 做事 → commit → push。**同一時間只讓一台電腦／一個人改同一個分支。**

## 新電腦設定（Mac）
1. 安裝 Homebrew（https://brew.sh），再到「終端機」執行：
   ```
   brew install node@22 git
   ```
   （或用 https://nodejs.org 下載 Node 22 LTS 安裝檔。）
2. 下載專案並安裝套件：
   ```
   cd ~
   git clone https://github.com/k3320509168/englearningapp.git
   cd englearningapp
   git checkout feat/round4
   npm install
   ```
   第一次 push 時 GitHub 會要求登入：建議裝 GitHub Desktop 或 `brew install gh` 再 `gh auth login`，由使用者自己登入。
3. 確認能跑：`npx vitest run`（應該全過）、`npm run dev`，瀏覽器開 http://localhost:5173/englearningapp/ 。
4. 安裝 Claude 桌面 App（或 `npm install -g @anthropic-ai/claude-code`），登入帳號，打開 `englearningapp` 資料夾，第一句說：「讀 AGENTS.md 和 docs/ROUND4_DESIGN.md，接著做下一步」。
5. 要繼續用 Gemini 出題：Chrome 安裝 Claude in Chrome 擴充功能、登入 Gemini，並在 Chrome 設定允許 `gemini.google.com` 自動下載多個檔案。
6. 之後每次開工前先 `git pull`，收工前 commit 並 push。

Mac 相容性：遊戲本身、測試、`chat-batch.ts`、`review-batch.ts` 都是跨平台（下載資料夾自動用 `~/Downloads`）。差別只有：
- `scripts/clip-import.ps1` 是 Windows PowerShell 專用，Mac 不用它（用 `chat-batch.ts import` 就好）。
- 文件裡的 `D:/Game_q_storege` 在 Mac 換成自己的資料夾，例如 `--archive ~/Game_q_storege`。

## 常用指令
```
npm install
npm run dev                  # 本地預覽 http://localhost:5173/englearningapp/
npx tsc -b                   # 型別檢查
npx vitest run               # 測試（目前 211 個全過）
npx eslint src --quiet
npm run validate:questions   # 題庫格式檢查
```

## 程式地圖
| 位置 | 內容 |
|---|---|
| `src/store/saveStore.ts` | 存檔（Zustand persist，`SAVE_VERSION` 15）。新欄位要加進 `partialize`；`migrateSave` 用 `conform` 補預設值 |
| `src/store/battleStore.ts` | 戰鬥邏輯：答題、傷害、combo、首領破甲、魔王技能、天賦、連攜技、波次、**敵人行動條** |
| `src/store/uiStore.ts` | 視窗（`ModalName`） |
| `src/game/MainScene.ts`、`MapScene.ts` | Phaser 場景，訂閱 store 變化做動畫 |
| `src/game/enemyPatterns.ts` | **敵人攻擊模式（行動條）**：各怪物招式、九區魔王 `REGION_BOSS_PATTERNS`、出手頻率、僧侶回血 `monkHeal` |
| `src/game/progression.ts` | 數值：怪物血量／攻擊、首領 combo 門檻、祝福、推薦等級與戰力 |
| `src/game/bossSkills.ts` | 九區魔王特殊技能＋菁英／守門頭目共用技能池 |
| `src/game/talents.ts`、`synergy.ts` | 被動天賦、連攜技 `FINISHERS` |
| `src/game/ultimates.ts`、`ultimateFx.ts` | Combo 大招（20／50／100／300／1000）與特效 |
| `src/game/modes.ts` | 每日素材本、英雄時空之塔 |
| `src/game/art/sprites.ts` | 像素圖（`monsterKindFor` 從 enemyPatterns 重新匯出） |
| `src/components/*Modal.tsx` | 介面：`ShardQuizModal`（每日碎片題）、`HolyForgeModal`（神聖鍛造）、`RushModal`、`TowerModal` 等 |
| `src/game/questions/bank/r0..r8.json`、`vocab-r0..8.json` | CEFR 題庫（九區：A1、A2、A2+、B1、B1+、B2、B2+、C1、C2） |
| `src/game/questions/bank/loader.ts` | 題庫分區背景載入（`import.meta.glob('./r[0-9].json')`，不要改成 `r*`，會吃到審題紀錄） |
| `scripts/chat-batch.ts` | Gemini 聊天室出題：產生提示詞、匯入下載的 JSON（壞 JSON 整批拒收） |
| `scripts/review-batch.ts` | 審題：匯出、套用修正 |
| `scripts/generate-questions.ts`、`gemini-check.ts` | 用 Gemini API 出題（免費額度每模型每天 20 次，失敗也算） |
| `scripts/loadBanks.ts` | Node 腳本讀題庫用 |
| `D:\Game_q_storege\` | 出題原始檔備份（不在 repo；題目本身已匯入 repo）。`pending\` 是 Flash-Lite 產的，**還沒審，不要直接匯入** |

題目去重鍵：`type|desc|speak`。

## 目前進度（2026-10-29）
**已完成（`feat/round4`）**：九區、首領連擊破甲、魔王祝福／女神的祝福、九區魔王技能、僧侶職業、9 種天賦、5 種連攜技、Combo 大招、等級上限（主角 100／英雄 80）、敵人等級與推薦戰力、碎片升星、神聖鍛造、每日碎片題、每日素材本、英雄時空之塔、錯題修煉場與掃蕩券、題庫分區載入。

**已 commit**：「蓄力」系統整個換成「敵人攻擊模式系統（行動條）」：
- 行動條隨時間累積，滿了就依該怪物的出招順序出一招（單體、連擊、全體、吸血、中毒、減速、虛弱、吸能量），快滿時顯示「⚠ 下一招」。
- 答對打中讓行動條退 0.15，3 秒內快答退 0.3；答錯照舊立刻反擊。
- A1、A2 很慢（×2.5，主要還是答錯才反擊）；A2+ ×1.0，往後越快，C2 ×0.65；菁英快 15%、傷害 ×1.2。
- 一般關 5 隻怪共用一條行動條；寶箱怪不攻擊；**黃金之路沒有行動條**（只有答錯會輸，可一路打到底）。
- 九區最終魔王有專屬招式與頻率；僧侶出手時全隊回血。

**題庫進度**（目標每區 1000～2000 題，聽 30%／讀 30%／說 20%／寫 20%）：
- A1：聽 245/300、說 202/200、讀 211/300、寫 266/200
- A2：聽 199/300、說 46/200、讀 146/300、寫 145/200（2026-10-31）
- A2+～C2：0。已審 160 題。

## 下一步（照順序）
1. 請 Gemini（Pro）審查整套敵我攻擊機制，調數值：出手頻率、傷害、僧侶治療量、技能使用率、緊張感但不會一下就輸。改完跑測試並本地實玩。
2. 繼續出題、審題；處理 `D:\Game_q_storege\pending`。
3. 下一輪：無盡之塔、世界王突襲（語音詠唱）、英雄真名短篇故事、錯誤選項動態抽換。

## Gemini 聊天室出題流程（需要 Claude in Chrome；Codex 做不到，要人工或改用付費 API）
- 第一則：`npx tsx scripts/chat-batch.ts prompt --level L --skill S --count 50 --out <暫存>/p.txt`，在 Gemini 頁面插入隱藏 `<input type=file id=__up>` 上傳該檔、讀出文字貼進輸入框送出（要確認對話數真的增加）。
- 後續同一對話送「再出 N 題…」；超過 4～5 批就開新對話。若 Gemini 回「我只是個語言模型…幫不上忙」，那個對話就卡住了，直接開新對話、把完整提示詞加一行「本批主題：…」再送。
- 只有自己 tab group 裡的分頁能操作；使用者手動開的分頁看不到，可從 Gemini 側邊欄的對話網址開。
- 收題：Chrome 每次頁面載入只放行一次下載 → 重新整理 → 捲到 code-block → 真實點擊下載鈕 → `npx tsx scripts/chat-batch.ts import --level L --skill S --download --archive D:/Game_q_storege`。
- JS 點擊下載、剪貼簿、表單送出、跳轉到 localhost 都會被擋（跳 localhost 會讓分頁卡死）。
- 審題：`review-batch.ts export` → 合併提示詞與題目上傳給 Pro → 存結果 → `apply`；套用前確認修正沒改壞答案位置。
- 模型：用 Pro、思考程度「低」。額度用完 Gemini 會自動降成 Flash-Lite，要停止，Flash-Lite 的產出只放 `pending`。
- Chrome 下載設定要允許 `gemini.google.com` 自動下載多個檔案。
