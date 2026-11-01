# TEAM.md — 三方 AI 分工表（PM：Claude）

2026-11-01 製作人指定 Claude 當 PM，統籌 Claude Code、Codex、Antigravity（Gemini）三方。
**三方開工前都先讀：`AGENTS.md` → 本文件 → `docs/COLLAB.md`（任務看板與留言板）→ `docs/DEV_LOG.md` 的「🔴 必要的內容」。**
設計原則、安全規則（不 push main、不碰金鑰、不替人登入）一律照 `AGENTS.md`。

## 1. 角色與擅長

| 成員 | 角色 | 主要負責 | 不做 |
|---|---|---|---|
| **Claude Code**（Opus 5.5） | PM／主設計 | 拆任務與派工、設計與平衡決策、和 ChatGPT 紙上推演、審查與合併、模擬驗收、文件（DEV_LOG、TEAM、COLLAB）、中文劇情與文案定稿 | 大量寫程式（交給 Codex）、大量出題 |
| **Codex**（ChatGPT App／`codex` CLI） | 主工程師 | 戰鬥與數值程式（battleStore、stageLayout、progression…）、介面版面、模擬腳本、測試、B2+～C2 題庫 | 改設計規格（有疑問在留言板問 PM） |
| **Antigravity**（Gemini App／`agy` CLI） | 內容與測試 | 本地瀏覽器實玩測試＋三尺寸截圖（1366×768、1920×1080、375×812）、題庫審題（第二意見）、A2～B2 題庫補量、像素圖與素材草稿、全專案長文脈的程式審查 | 改戰鬥檔案、合併分支 |
| **ChatGPT 聊天室**「ENG RPG遊戲」 | 顧問 | 平衡紙上推演、規格討論、劇本發想（由 Claude 操作） | — |

## 2. 任務類型 → 誰做、用什麼模型

| 任務 | 負責 | 模型／設定 |
|---|---|---|
| 戰鬥系統、平衡實作、存檔遷移 | Codex | `gpt-6.1-sol`，reasoning **high** |
| 一般功能、介面調整、測試補齊 | Codex | `gpt-6.1-sol`，reasoning **medium**（預設） |
| 題庫轉檔、格式修正、批次腳本 | Codex | `gpt-6.1-sol`，reasoning **low** |
| B2+～C2 出題 | Codex | medium |
| 實玩測試、截圖、介面問題清單 | Antigravity | Gemini Flash 級（瀏覽器代理） |
| 審題、長文脈程式審查 | Antigravity | Gemini Pro 級，思考程度低～中 |
| A2～B2 出題 | Antigravity | Gemini Pro 級（Flash-Lite 的產出只能進 pending，不直接匯入） |
| 像素圖／素材草稿 | Antigravity | Gemini 圖像模型 |
| 設計決策、規格、驗收、合併 | Claude | Opus 5.5 |
| 平衡推演、劇本發想 | ChatGPT 聊天室 | Thinking |

Antigravity 的實際模型名稱：製作人登入 `agy` 後，由 Claude 執行 `agy models` 確認，再補進本表。

## 3. Token 用量原則
- **誰剩得多誰多做。** 用量吃緊時：Claude 只做決策、審查、驗收；寫程式全交 Codex；測試、審題、出題交 Antigravity。
- 每方開工時在 `COLLAB.md` 留言板寫一行狀態，例如「Codex｜額度約剩 60%｜C7 開工」；額度用完也留一行，PM 會改派。
- 已知限制：Codex 有 5 小時用量上限（用完要等重置）；Claude 有週用量上限；Gemini 有每日額度，用完會自動降級成 Flash-Lite（降級後停止出題）。
- 少讀大檔：先讀 TEAM／COLLAB 與 `git log`，需要時才讀程式碼。驗收用腳本輸出摘要，不要整份貼回。

## 4. 派工與交接流程
1. PM 在 `COLLAB.md` 任務看板開一列（編號、負責人、驗收條件）。
2. 負責人在留言板寫「開工」→ 在自己的分支做 → commit（訊息用中文、`feat:`／`fix:`／`docs:`）→ 留言板寫「完成＋驗收結果」。
3. PM 審查、跑 `npx tsc -b`、`npx vitest run`、`npx eslint src --quiet` → 合併到 `feat/round4` → 看板打勾。
4. **PM 直接下指令的方式**（只在對方閒置時用，不和製作人手動操作的對話撞在一起）：
   - Codex：`codex exec "<任務>"`（新任務）或 `codex exec resume --last "<補充>"`。閒置判斷：worktree 沒有未 commit 的修改，且 10 分鐘內沒有新的 session 紀錄。
   - Antigravity：`agy -p "<任務>" --mode accept-edits`，只在它自己的 worktree 裡執行。
5. 留言板只在最後**追加一行**，不要改別人的行（合併時才不會衝突）。

## 5. 分支與工作目錄
| 成員 | 位置 | 分支 |
|---|---|---|
| Claude | `/Volumes/Dzzz_ssd/Files/Games/EngGame` | `feat/round4`（整合分支） |
| Codex | `/Users/dzzz/.codex/worktrees/question-bank-advanced/EngGame` | `codex/advanced-question-banks` |
| Antigravity | 製作人登入後由 PM 建立 `~/agy-worktrees/EngGame` | `agy/work` |

檔案負責人以 `COLLAB.md` 為準；要改別人的檔案，先在留言板說。

## 6. 目前派工（2026-11-01）
| 編號 | 負責 | 內容 | 狀態 |
|---|---|---|---|
| C7 | Codex | EXP 池 70% 首通／30% 學習；預算模擬 A1→C2 連續跑，C2 最終魔王前等級差要在目標內（目前 Lv142～146、推薦 200） | 進行中 |
| A1 | Antigravity | 三尺寸實玩截圖：開場→序章→A1 第 1 張地圖，列出介面問題（只回報，不改程式） | 等登入 |
| A2 | Antigravity | 審 Codex 的 B2+～C2 題庫草稿（答案正確性、難度、重複），輸出修正清單 | 等登入 |
| P1 | Claude | C7 完成後整體驗收（4 種玩家 × 成長路線），結果寫進 DEV_LOG | 等 C7 |
| P2 | Claude＋ChatGPT | B1～C2 劇本大綱 | 待排 |
