# PM_STATUS.md — 目前進度、已定案決策、未解決問題（PM：Claude）

最後更新：2026-11-01。**三方開工前必讀**（順序：`AGENTS.md` → `docs/TEAM.md` → 本文件 → `docs/COLLAB.md`）。
本文件取代零散的「下一步」：決策寫第 2 節，未解決的都在第 4、5 節，做完就打勾並在 COLLAB 留言。

## 0. 製作人 2026-11-01 指令（🔴 必要的內容，原話重點）
1. 跟 GPT（和其他 AI）深度討論的內容都要寫進文件：結論、目前進度、還沒解決的問題與任務。
2. 還沒完成、還沒討論完的任務，交給 Codex 和 Antigravity 多討論、試著解決並完成（兩邊 token 都還多）。
3. Claude 多一個 PM 角色，但擅長的事（含部分 coding）還是要做；依三個 AI 的強項分工。
4. 由一個 AI 當大腦控制另外兩個；三方協調後，可讓適合的 AI 當大腦。
5. **額度快滿的人（先看每週上限，再看 5 小時上限）就多派工給別人**，自行最佳化分工。
6. **所有介面與功能都要同時適配手機與電腦**（驗收用 1366×768、1920×1080、375×812 三尺寸）。
7. 上下文快滿時自己壓縮（Claude `/compact`；Codex、Antigravity 完成任務後若接近極限也要壓縮或開新對話）。
8. 介面、整體平衡、合理性是製作人最重視的事。

## 1. 額度與大腦（2026-11-01 15:10 查）
| 成員 | 每週 | 5 小時 | 判斷 |
|---|---|---|---|
| Claude | **已用 87%**（11/5 23:59 重置） | 10% | 本週只做決策、審查、最後驗收，**不寫大量程式** |
| Codex | 已用 51%（11/4 16:12 重置） | 已用 74%（今天 18:14 重置） | 主力工程；5 小時窗口快滿，先派高價值任務 |
| Antigravity | 未知（Google 每日額度） | — | 審題、審規格、讀文件很快（1,200 題約 8 分鐘）→ 多派 |

**大腦安排（到 Claude 週額度重置前）**：**Codex 當執行大腦**（排程、拆工作、叫 Antigravity 做審查／第二意見、自己實作）；Claude 只做「規格定案、合併到 feat/round4、最後驗收」三件事。Claude 額度重置後再評估是否收回。
- Codex 叫 Antigravity：`cd /Users/dzzz/agy-worktrees/EngGame && agy -p "<任務>" --model gemini-4-argon-medium --mode accept-edits`（agy 路徑 `/Applications/Gemini.app/Contents/Helpers/agy`）。
- **Antigravity 目前不能執行終端機指令**（背景模式會自動拒絕），只能讀寫檔。任務要寫「不要執行指令，只讀寫檔」，輸入檔先複製到它資料夾的 `.agy-input/`（已被 git 排除），commit 由 Codex 或 Claude 代做。
- 要開放 Antigravity 執行指令：製作人自己建立 `~/.gemini/antigravity-cli/settings.json`（Claude 的安全規則不允許自己改其他 AI 的權限）。建議內容（只允許測試、git 讀取與 commit，禁止 push／reset／rm）：
  ```json
  {"permissions":{"allow":["command(git status)","command(git diff)","command(git log)","command(git add)","command(git commit)","command(npx tsc)","command(npx vitest)","command(npx eslint)","command(npx tsx)","command(npm run)","command(node)","command(dot_clean)","command(ls)","command(cat)","command(grep)"],"deny":["command(git push)","command(git reset)","command(rm)"]}}
  ```

## 2. 已定案決策（和 ChatGPT「ENG RPG遊戲」討論的結論）
完整原文都在 `docs/gpt/`，這裡只列結論與出處。
| 主題 | 結論 | 出處 |
|---|---|---|
| 關卡結構 | 每張地圖 20 小關（15 小 BOSS、20 大 BOSS）＋區域魔王；各區 5～9 張，共 61 張 | `docs/STAGE_PLAN.md`、第 1～8 輪 |
| BOSS 機制 | M01～M12 模組 | `STAGE_PLAN.md` 第 11 節（第 8 輪） |
| 全盤平衡 v2.0 | Combo 原生／技能分離、Bonus ×1/2/3/5/10、單次上限 15 萬、答錯保留 50%；HP 歸零立即結算；12 階技能；三星＝無倒地＋正確率 ≥85%＋連對或快答；行動條聽力暫停、寫作 ×0.7；EXP 70% 首通／30% 學習；地圖精通 | `docs/gpt/balance-r1～r4.md` → **`balance-r5-final-spec.md`**（第五輪定案） |
| C9 預算模型 | 預算成長模擬，C2 終王前 Lv142～146（C7 前的舊結果，已作廢） | `docs/gpt/c9-budget-model.md` |
| Combo 12 階＋七屬性特效、處決、轉職 Lv30/80/150、BOSS 音樂 | 已實作 | `docs/gpt/round21.md`、`STAGE_PLAN.md` 第 18 節 |
| 英雄 150 位、真名短篇 | 第一批名單與故事已收 | `docs/gpt/round22-*.ts.txt` |
| 等級 200 與第二世界 | 提案，**未定案** | `docs/gpt/world-expansion-and-level200-proposal.md` |
| 劇情 | 前置區＋A1～A2+ 劇本完成；B1～C2 未寫 | `docs/STORY.md` |

### 2.1 C7 經驗池修正規格 v2.1（PM 2026-11-01 定案）
Codex 的 C7 實測（`docs/gpt/c7-experience-pool-review.md`）：主線 85% 預算只到 Lv180～192，缺 39,687.5 EXP（其中 6,927.5 是跨區銜接漏算）；勝率已足（C2 終王首過：強 95%、好 93%、一般 90%、吃力 60%）。v2.0 的 EXP 本來就標「需實測驗收」，PM 依此定案：
1. **補跨區銜接**：區間改成「上一區終點 → 本區終點」，漏算的 8 段銜接升級算進主線預算。
2. **85% 主線不變；另外 15% 由副本提供，但用「追趕機制」**：每日素材本、時空之塔、地圖精通、錯題修煉等非主線 EXP，玩家等級 ≤ 目前區推薦等級時全額；超過推薦 +5 級起 ×0.3；超過 +15 級為 0（改給金幣／素材）。重刷主線地圖套用同樣規則。→ 落後的人追得上，刷的人不會超前太多（解 TASKS「副本經驗不能讓玩家超過推薦太多」）。
3. **模擬加入標準副本作息**：fast＝每天 1 次素材本；normal＝每天 2 次素材本＋每 3 天 1 次塔；mastery 照舊。
4. **驗收標準**：區域終王前等級，fast ≥ 推薦 −12、normal ≥ 推薦 −6、mastery ≤ 推薦 +15；且不得連續 3 張地圖低於下限。
5. `recommendedLevel` 最終魔王統一為 **200**（目前程式回 199）。
6. **BOSS 數值先不動**。修完重跑 r0/r4/r8 MC；吃力玩家 C2 終王首過低於 55% 才再調援助（不調 BOSS 血量）。
7. 交付前由 Antigravity（`gemini-4-argon-high`）讀規格與結果做第二意見紙上審查；有重大異議寫進 COLLAB，PM 裁決。

## 3. 目前進度（2026-11-01）
- ✅ 已合併 feat/round4：v2.0 的 C1～C6（Combo、結算、三星快答、語音生命週期、行動條、地圖精通，存檔 v20）。
- 🟡 C7：程式交付（Codex `1acb617`，存檔 v21），**平衡未過** → 照 2.1 修正中。
- 🟡 C8 版面：規劃在 `docs/question-bank-qa/C8_LAYOUT.md`（Codex worktree），未完成。
- 🟡 B2+～C2 題庫：Codex 草稿 r6/r7/r8 各 1,200 題（目標 1,800／2,000／2,000）。Antigravity 審 r6：**152 題有問題（12.7%）**，報告 `docs/question-bank-qa/agy-review-r6.md`（agy/work）；r7、r8 待審。
- ✅ 三方分工：`docs/TEAM.md`；Antigravity worktree `/Users/dzzz/agy-worktrees/EngGame`（`agy/work`）。

## 4. 未解決問題（需要討論或決策）
| # | 問題 | 誰討論 | 何時回 PM |
|---|---|---|---|
| Q1 | 等級 200 與第二世界是否定案（影響 C7 終點與長期內容） | Codex＋Antigravity 讀 `world-expansion-and-level200-proposal.md` 提結論 | C7 驗收後 |
| Q2 | 三星條件與快答路線的實測勝率是否合理 | Codex 模擬、Antigravity 審 | C7 後全盤驗收時 |
| Q3 | 召喚券是否太多（ChatGPT 提醒接近每天十連） | Codex 算經濟帳、Antigravity 第二意見 | 經濟驗收時 |
| Q4 | 主角與英雄同等投入，主角強 10～15% 是否成立 | Codex 模擬 | 全盤驗收時 |
| Q5 | C5 語音：TTS 沒有精確音長，故障上限用字數估 | 需真人裝置實測（製作人） | 實玩時 |
| Q6 | 題庫只能證明「認得」，不能證明 C1/C2 自由表達；能力聲明要保守 | Antigravity 審文案 | 題庫完成時 |

## 5. 任務佇列（照順序；負責人／模型）
| # | 任務 | 負責 | 模型 | 驗收 |
|---|---|---|---|---|
| T1 | C7 照 2.1 修正＋重跑 12 路徑與 MC | Codex | gpt-6.1-sol high | 第 2.1 節第 4 點；tsc/vitest/eslint |
| T2 | C7 修正規格與結果第二意見（**進行中** 15:20 派出；先審規格，Codex 實作後再審結果） | Antigravity | gemini-4-argon-high | 寫 `docs/gpt/c7-v21-agy-review.md` |
| T3 | 修 r6 的 152 題（報告：`/Users/dzzz/agy-worktrees/EngGame/docs/question-bank-qa/agy-review-r6.md`，agy/work `d8d8690`） | Codex | low～medium | 每題對照 agy-review-r6.md 處理或寫不改理由 |
| T4 | 審 r7（C1）、r8（C2）（**進行中** 15:20 派出） | Antigravity | argon-medium | 同 r6 格式 |
| T5 | 補題到目標量（r6 +600、r7/r8 各 +800），A2～B2 缺口由 Antigravity 出題 | Codex（B2+～C2）／Antigravity（A2～B2） | medium | 去重鍵 `type|desc|speak`、聽讀說寫 30/30/20/20 |
| T6 | C8 手機／電腦版面（TASKS「介面」P0、P1） | Codex | medium | **三尺寸截圖**，Antigravity 對照截圖審 |
| T7 | C7 後全盤驗收：4 類玩家 × 3 類養成（TASKS「平衡」整段） | Codex 跑、Claude 驗收 | high | 寫進 DEV_LOG |
| T8 | B1～C2 劇本（每張地圖開場／通關、區域魔王登場） | Antigravity 寫初稿 → Claude 定稿 | argon-high | 照 `docs/STORY.md` 格式與伏筆 |
| T9 | 調味選項 UI、劇情回顧全頁、工坊合併 | Codex | medium | 三尺寸截圖 |
| T10 | 專武系統（TASKS「專武」整段） | Codex 規格草案＋Antigravity 審 → Claude 定案 → Codex 實作 | high | — |
| T11 | 跳級 7 天回顧、A2 以後文法題標籤 | Codex | medium | — |

規則：一次只有一方改同一分支；改戰鬥檔（COLLAB 檔案負責人表）只有 Codex；合併到 `feat/round4` 只有 Claude；不 push main、不部署。

## Codex執行追加（2026-11-01，第31批後）
- 已讀本表v2.1與共同指令，照T1→T3→T5推進；目前尚未讀到Antigravity的c7-v21-agy-review.md，不視為已完成第二意見。
- 題庫b4cc0f0已增到各1240/共3720草稿，還缺B2+560、C1/C2各760；T3報告為前1200/區的快照，以穩定題幹/原文映射而非沿用變動後陣列索引。
- 核對Antigravity報告時發現新31批九句跟讀也超PLAN 4～8詞，已一併改短，維持原意並更新中文；自審漏抓此限制已記BATCH_031_REVIEW，不宣稱五輪已完成。
