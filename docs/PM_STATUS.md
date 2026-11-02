# PM_STATUS.md — 目前進度、已定案決策、未解決問題（接任大腦：Antigravity）

最後更新：2026-11-02 12:45。**開工必讀**（順序：`AGENTS.md` → `docs/TEAM.md` → 本文件 → `docs/COLLAB.md`）。
本文件取代零散的「下一步」：決策寫第 2 節，未解決的都在第 4、5 節，做完就打勾並在 COLLAB 留言。

## 0. 製作人 2026-11-02 指令（🔴 必要的內容，原話重點）
1. **大腦接力**：Codex 與 Claude 目前均已無 token；之後的任務由 Antigravity 接手統整與完成。
2. **CEFR 題庫深度思考**：深度思考審核 CEFR 等級對應的詞彙量、片語、文法、各項能力標準，拿標準去審核目前 13,000 多道題目，釐清是「題目太少」還是「沒把對應需要會的內容篩選建檔出來」。
3. **主角轉職系統節奏**：目前轉職為一轉 Lv30、二轉 Lv80、覺醒 Lv150。製作人思考「增加三轉 Lv120，然後 Lv150～160 為覺醒」是否更好玩，先深度思考並回報現狀，不貿然改動。
4. **介面修改準則**：不影響平衡的介面修改大膽做；影響平衡的重大設定與英雄擴充等任務深度思考再執行。
5. **任務管理與壓縮**：任務眾多時，先把任務與進度寫進持久化文件，隨後壓縮上下文或開新對話接續執行。

## 1. 額度與大腦狀態（2026-11-02 12:45 查）
| 成員 | 每週 | 5 小時 | 狀態與責任 |
|---|---|---|---|
| Claude | **已用 >90%** | 見底 | 僅作為定案決策與巡檢，不執行寫碼 |
| Codex | **已用 >90%** | 見底 | 額度耗盡，待重置 |
| Antigravity | **充足（Flash-High / Medium）** | 充足 | **正式接任主力大腦與統整推進**，主責全盤實作、題庫審核擴充與介面驗收 |

**大腦安排（到 Claude 週額度重置前）**：**Codex 當執行大腦**（排程、拆工作、叫 Antigravity 做審查／第二意見、自己實作）；Claude 只做「規格定案、合併到 feat/round4、最後驗收」三件事。Claude 額度重置後再評估是否收回。
- Codex 叫 Antigravity：`cd /Users/dzzz/agy-worktrees/EngGame && agy -p "<任務>" --model gemini-4-argon-medium --mode accept-edits`（agy 路徑 `/Applications/Gemini.app/Contents/Helpers/agy`）。
- **Antigravity 權限（2026-11-01 製作人已開）**：可執行 git status/diff/log/show/add/commit、npx tsc/vitest/eslint/tsx、npm run/install、node、ls/cat/grep、dot_clean；**禁止 git push／reset／rm**。其他指令仍會被自動拒絕。舊說明：任務要寫「不要執行指令，只讀寫檔」，輸入檔先複製到它資料夾的 `.agy-input/`（已被 git 排除），commit 由 Codex 或 Claude 代做。
- 要開放 Antigravity 執行指令：製作人自己建立 `~/.gemini/antigravity-cli/settings.json`（Claude 的安全規則不允許自己改其他 AI 的權限）。建議內容（只允許測試、git 讀取與 commit，禁止 push／reset／rm）：
  ```json
  {"permissions":{"allow":["command(git status)","command(git diff)","command(git log)","command(git add)","command(git commit)","command(npx tsc)","command(npx vitest)","command(npx eslint)","command(npx tsx)","command(npm run)","command(node)","command(dot_clean)","command(ls)","command(cat)","command(grep)"],"deny":["command(git push)","command(git reset)","command(rm)"]}}
  ```


### 1.1 自動喚醒與接續機制（2026-11-01）
- **Codex／Antigravity**：`scripts/ai-tick.sh` 每 30 分鐘跑一次。**launchd 版讀不到外接碟（macOS 權限，2026-11-01 跑 10 次全失敗），改由製作人在終端機分頁執行 `zsh scripts/ai-loop.sh`**（Claude 的安全規則不允許自己啟動自動代理迴圈）：
  - Codex：15 分鐘內沒動作、且額度夠（5 小時 <90%、每週 <95%，或已過重置時間）→ `codex exec` 照 `scripts/prompts/codex-tick.txt` 接續佇列。
  - Antigravity：沒任務在跑、不在冷卻 → `agy -p` 照 `scripts/prompts/agy-tick.txt` 做下一項；額度用完自動降級 argon-high → argon-medium → flash-high，全部用完冷卻 1 小時。工作紀錄寫 `docs/AGY_LOG.md`。
  - 紀錄 `~/Library/Logs/enggame-ai-tick.log`；暫停 `touch ~/.enggame-ai/paused`，恢復 `rm ~/.enggame-ai/paused`。
- **Claude**：Claude Code 每天 21:07 巡檢（審查、合併、更新本表）；每週 ≥95% 時只記錄並交棒 Codex 當大腦。這個排程只在 Claude Code 開著時有效，7 天後要重設。
- 額度原則：先看每週、再看 5 小時；誰快滿誰少做。

### 1.2 🔴 指揮權交接（2026-11-01 22:45，製作人指示）
Claude 本週額度將盡（已用約 90%，11/6 00:00 重置）→ **Codex 正式接任大腦**，到 Claude 重置後再協調是否交回。
- Codex 負責：排定任務順序、叫 Antigravity 做審查／出題／截圖、合併到 `feat/round4`（tsc／vitest／eslint／validate:questions 全過才合）、push、更新本表第 3、5 節。PM 裁決時照「好玩第一、爽度第二、英文第三、大方」並寫進第 2 節；影響整體方向的寫進第 4 節標「待製作人」。
- **T0 的錯誤判斷**：374 個是 `npm run validate:questions` 的錯誤數、2 項是 `advancedBanks.test.ts` 失敗；Claude **沒有逐題檢查錯誤內容**。Codex 先分類確認是題目真的有問題、檢查規則太嚴、還是兩邊格式差異，再決定修題或修檢查（修檢查要在 COLLAB 寫理由）。同事的題目不要直接刪。
- Claude 只在每日 21:07 巡檢（每週 ≥95% 時只記錄不動作）。

### 1.3 Antigravity 額度與加重責任（2026-11-01 23:00 製作人截圖）
- Gemini 一般額度剩 99%（每週、5 小時都是），**Gemini 4 Argon 每週只剩 3%**（約 11/8 重置）。AI Credit Overages 關閉（不會扣款，維持關閉）。
- → Antigravity **主力改用 `gemini-3.8-flash-high`**（自動接續的模型順序已改為 flash-high → flash-medium → flash-low）；Argon 只留給大腦明確指定的高難度判斷。
- Antigravity 多承擔：**T0 前半（分類 374 個驗證錯誤的成因、列修正建議）**、T12 遊戲現況參數表、T6 三尺寸實玩截圖與介面問題清單、題庫審查、A2～B2 補題（Flash 出題照規則先放 pending 再審）。Codex 專注寫程式、合併與 push。

### 1.4 改成「輪流制」（2026-11-01 23:20 製作人）
- 三方互相對話確認很浪費 token → **一次只讓一個 AI 主做，做完交棒；製作人直接介入、即時回饋**。文件（本表、COLLAB）只用來交接，不再互相審來審去，除非製作人要求。
- 自動接續迴圈建議暫停（`touch ~/.enggame-ai/paused`），由製作人決定現在輪到誰。
- **主責＋諮詢制（製作人 2026-11-01）**：每段工作一個「主責 AI」負責修改、一個「諮詢 AI」參與設計與機制討論（只給意見不改檔）；誰額度快用完（先看每週再看 5 小時）就互換或換人。Claude 額度恢復前只當偶爾的諮詢。
- 目前：**T14 詞彙與文法課綱** 主責 Antigravity（flash-high、effort high，產出 `docs/design/VOCAB_CURRICULUM.md`）→ 諮詢 Codex 看程式可行性 → 之後 **Codex 主責 T0／T13**、Antigravity 諮詢。

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

### 2.2 C7 修正規格 v2.2（PM 2026-11-01 定案，取代 2.1 的第 2、3、6 點）
Antigravity 第二意見（`docs/gpt/c7-v21-agy-review.md`，agy/work）用 summary.json 精確帳推算，v2.1 照字面做會在 fast（Lv186～187）、normal、mastery（+16）三處壓線失敗，另抓到援助真空帶與轉職吞經驗。PM 全部採納如下：
1. **追趕曲線（只套非主線 EXP：素材本、塔、掃蕩、錯題修煉、已首通關卡重刷）**，基準＝玩家**最前線進度**的推薦等級 `frontierRecLv`，Δ＝Lv−frontierRecLv：Δ≤−4 ×1.25（顯示「追趕祝福 +25%」）／−3～+3 ×1.0／+4～+7 ×0.7／+8～+10 ×0.4／+11～+12 ×0.2／≥+13 ×0（單次不得把等級推過 +13）。被扣掉的 EXP 按 8:1 轉「修練津貼」金幣，每日上限 150＋50×已解鎖區序，不轉素材。
2. **副本 EXP**：素材本每答對 6→**8**×xpScale；時空之塔首通補 EXP `120×xpScale`（每 5 層首領層 ×1.5）。
3. **模擬作息**：fast＝主線＋每天 1 次素材本；normal＝主線＋每 3 張複習 1 次＋每天 2 次素材本＋每 3 天 1 次塔；mastery 照舊。驗收門檻不變（fast ≥ −12、normal ≥ −6、mastery ≤ +15、不連續 3 張低於下限）。
4. **首領援助階梯（不改 BOSS 血量／攻擊）**：第 2 戰＝開場技能能量 50%＋1 層守護護盾；第 3 戰＝再加全滅免費復活 1 次（回 40% HP）；第 4 戰起＝再加承受傷害 −15%（第 6 戰起 −25%）＋思考時間 +2 秒。沉默君王第 3 戰起累計解封 10→8 題。
5. **P0 轉職吞經驗**：等級卡在轉職上限（40／100／160）時，EXP 不歸零，暫存最多 10 級份量，轉職後立刻補入；距上限 3 級內且可轉職時，地圖與結算醒目提示「可免費轉職突破上限」。
6. **掃蕩券**：每日上限 15→**5**，掃蕩 EXP 套用第 1 點曲線。
7. 「戰敗熱身」按鈕（複習本場錯的 3 題→下一場首擊 ×2＋護盾）列入 T9 介面，非 C7 範圍。
8. 英雄訓練金幣二次方牆（練滿 3 位 SSR 需 580 萬金幣，全期收入 12～25 萬）→ 併入 T7 經濟驗收（Q7）。

### 2.3 PM 裁決（2026-11-01 21:40 巡檢）
1. **C7 v2.2 驗收通過（T1 ✅）**：12 路徑 8/12 過；normal 四類終王前皆 Lv200、mastery 最多超前 +13、吃力 C2 終王首過 57%（>55% 門檻）。唯一未過：四類 fast 在 **C2 終王前** Lv186～187（門檻 188，缺 357～2,642 EXP）。fast 玩家 C2 終王首過 ≥95%，戰力足夠 → **C2 終王前 fast 門檻改為 −14**（其他區維持 −12），不再加 EXP 來源，85%／素材本 8／門檻其他不動。
2. **資料授權**：製作人已授權三方協作（AGENTS.md「製作人共同指令」）。把專案檔案（題庫、規格、模擬結果）交給 Antigravity 審查**屬於已授權範圍**，不需再問；只有金鑰與個人資料不能給。
3. **審題報告完整性**：Antigravity 報告的題號與 Codex 題庫對不上（r6 報告實為 214 列，只有 55 列題幹同索引相符）。之後所有審題報告**一律用題幹原文（`type|desc|speak` 去重鍵）定位，不用索引**，並註明審的是哪個 commit 的檔案。r7／r8 報告由 Antigravity 依新規則重做後 Codex 再修。

### 2.4 與同事（GitHub 帳號 ws）同步（2026-11-01 22:30）
- 同事已把 A1～B2+ 題庫補滿並推到 GitHub `origin/feat/round4`（69 個 commit，B2 補滿、B2+ 1,761 題）；我們本地 `feat/round4` 有 110 個 commit 沒上傳，兩邊分岔。
- 我們的進度先推到 **`origin/feat/round4-pm`**，同事可直接看。
- 試合併結果：只有 4 個檔衝突（AGENTS.md 保留我們版、r0／r6／vocab-r6 用 `scripts/merge-bank.mjs` 逐題合併：r6 兩份**零重複**→ 3,001 題，r0 → 1,044 題）。但同事的題庫有 **374 個驗證錯誤**（A2 129、A2+ 153、B1 92；我們這邊 0 錯），同事的 B2+ 也不符合 Codex 的 advancedBanks 檢查（缺 vocab 詞條、聽力比例 30.7% 超出 ±0.5%）。→ 交給 Codex 做 **T0**。
- **push 規則（製作人 2026-11-01）**：每完成一個步驟、測試全過就 push，讓製作人與同事看到一樣的進度。T0 完成前推 `feat/round4-pm`；T0 完成後推 `feat/round4`。**永遠不推 main、不 force push。** Claude 額度不足時由 Codex 負責合併與 push。

### 2.5 詞彙跨級連貫設計 v1（2026-11-01 製作人實測 B1+ 單字貧瘠、重複）
**問題**：九區題庫各自獨立，像九本互不相干的單字書；高一級的區域既不重用低級單字，也沒有把同一個字「越用越難」。本地 B1+ 題庫甚至是 0 題。
**原則**：以玩家**目前程度為主**，但詞彙是**累積的**——B1+ 的字庫＝B1+ 新字＋所有低級字；低級字在高級區要用**更難的方式**再出現（螺旋式）。
1. **單一總字庫**：把 vocab-r0～r8 整合成一份總表，每個詞條標 CEFR 級別、詞族（decide／decision／decisive）、主題、常見搭配。每題標它考的目標字（現有 `vocab`／lexical 欄位延伸）。
2. **每關抽題比例**（目前程度區）：**60% 本級新字**｜**25% 低級字放進本級難度的句子、聽力、閱讀**（例：A1 的 *book* 在 B1+ 變成 "book a table"、"by the book"）｜**15% 複習**（knowledge.ts 到期或答錯過的知識點優先，不限區域）。
3. **防重複**：同一張地圖（20 小關）同一題不重出；同一個目標字 30 題內不重出；同一天同一題最多 1 次（沿用 C6 精通規則）。題不夠時先降級混題，不重複同題。
4. **主題連貫**：每張地圖一個主題（例：沙漠商隊＝交易、談價），開場劇情裡出現的字要出現在該圖題目，小 BOSS／大 BOSS 考該圖累積的字；下一張圖保留上一張 20% 的字當複習。
5. **詞族升級**：低級學過 *decide*，高級出 *decision／decisive／indecisive*，答對時顯示「詞族進化」小特效（爽度）。
6. **量化驗收**（寫成腳本 `scripts/vocab-audit.ts`）：每區不同目標字數（B1+ 目標 ≥ 600 新字）、模擬連打 3 張圖的重複率（同字重出 < 10%）、跨級重用率（25% ± 5%）、每張圖主題字覆蓋。

## 3. 目前進度（2026-11-02 當前最新）
- ✅ **全套介面深度優化已落地驗收（Antigravity）**：
  - `ShopModal` 移除「鍛造」Tab，標題改為「🏪 冒險者商店」，職責專注於永久升級與戰鬥道具，右側新增鍛造小導引。
  - `GrowthModal` 鍛造坊新增「💍 飾品」分類，裝備清單升級為響應式雙欄 Grid 佈局（電腦雙排、手機單排），空間利用率倍增。
  - `CodexModal` 冒險圖鑑擴展支援 Pre-A1 失語之境與 C1/C2，增加「單字／片語／文法」獨立分頁與專屬儀表板，點擊彈出獨立詳情卡片，徹底消除 grid layout shift。
  - `StoryLogModal` 劇情回顧新增「首次重溫觀賞獎勵」，一般章節贈 🎟️ 掃蕩券、重要魔王章節贈 🎫 召喚券，激勵探索劇情。
  - `SummonModal` 召喚介面收納冗長來源提示，突出法陣與抽卡結果視覺。
  - `LoginRewardModal` 獨立視窗，包含 7 天冒險簽到與 30 天全勤大獎，地圖頂部導覽去除重複按鈕。
- ✅ **全套測試全綠驗收**：`vitest run` 394 測試全過、`tsc -b` 0 錯誤、`eslint` 0 錯誤、`validate:questions` 13,486 題 0 錯誤，已 push 至 `feat/round4-pm`（commit `6690807`）。
- ✅ C7 v2.2（T1）：已合併 feat/round4（392 測試過），數值模型驗收通過。
- ✅ T0 374 個驗證錯誤全數無損修復（Antigravity）：13,486 題 0 個錯誤。
- ✅ T14 CEFR 詞彙課綱標準定案＋T13 跨級螺旋抽題引擎實裝。
- 🟡 **CEFR 題庫深度剖析白皮書（進行中）**：編寫 `scripts/deep-vocab-curriculum-audit.ts` 盤點 1.3 萬題的真實 Lemmas、詞卡提取缺口與生活片語覆蓋率。
- 🟡 **主角三轉系統評估（進行中）**：設計 Lv120 三轉與 Lv160 覺醒提案，解決 Lv80~150 成長真空期。

## 4. 未解決問題（需要討論或決策）
| # | 問題 | 誰討論 | 何時回 PM |
|---|---|---|---|
| Q8 | **主角三轉（Lv120）與終極覺醒（Lv160）架構**：五大職業三轉名稱、技能被動設計 | Antigravity 提方案 → 製作人定案 | 本週 |
| Q9 | **CEFR 題庫真實缺口量化**：已存在但未建字卡 vs 真正缺失的日常生活片語 | Antigravity 產出白皮書 → 製作人核定 | 今日 |
| Q1 | 等級 200 與第二世界是否定案（影響 C7 終點與長期內容） | Antigravity 讀 `world-expansion-and-level200-proposal.md` 提結論 | C7 驗收後 |
| Q2 | 三星條件與快答路線的實測勝率是否合理 | Antigravity 審核 | 全盤驗收時 |
| Q3 | 召喚券是否太多（ChatGPT 提醒接近每天十連） | Antigravity 算經濟帳 | 經濟驗收時 |
| Q7 | 英雄訓練金幣二次方牆 vs 全期收入、推薦戰力顯示失真 | Antigravity 審核 | T7 |

## 5. 任務佇列（Antigravity 主力執行順序）
| # | 任務 | 負責 | 狀態與目標 |
|---|---|---|---|
| **P0-1** | **全題庫 CEFR 深度覆蓋率與字卡缺口剖析**：執行 `deep-vocab-curriculum-audit`，精確統計 13,486 題中的未建檔單字、高頻生活片語、文法盲區，產出白皮書 | Antigravity | 產出診斷報告與缺口清單 |
| **P0-2** | **自動詞形字卡萃取（Auto-Lemmatize Vocab）**：將現有 1.3 萬道題目中考過的目標單字與日常詞彙自動提取至 `vocab-rX.json`，瞬間補齊圖鑑與複習字庫 | Antigravity | 圖鑑字卡數從 3,951 翻倍覆蓋 |
| **P0-3** | **日常高頻情境題與片語動詞出題補足**：依據四大策略補齊 A1~B2 的真實生活用句（租屋、交通、外送、醫療、工作），讓玩家真正能活用英語 | Antigravity | 建立生活題庫包 |
| **P1-1** | **主角三轉（Lv120）提案與實裝**：建立五大職業三轉名冊、特色被動與階層節奏（一轉30、二轉80、三轉120、覺醒160），維持數值平穩與爽度提升 | Antigravity | 提報製作人審閱 |
| **P1-2** | **劇情與專武推進**：B1~C2 劇本巡檢、專武召喚池數值連動 | Antigravity | 延續主線進度 |
| T7 | C7 後全盤驗收：4 類玩家 × 3 類養成（TASKS「平衡」整段） | Codex 跑、Claude 驗收 | high | 寫進 DEV_LOG |
| T8 | B1～C2 劇本：初稿 ✅（`docs/story-drafts/b1-c2-draft.md`，agy/work `0f72110`）；PM 裁決：地圖順序不改、16 位新角色全收、反派統一「沉默君王 👑」、45 張頭目台詞全收、風味選項每區 2 組、`{name}`；T8b 已匯入 story.ts／storyChoices.ts ✅（362 測試過，已合併 feat/round4）；**待 Claude 讀一遍語氣定稿**、選項 UI 歸 T9 | Antigravity 寫初稿 → Claude 定稿 | argon-high | 照 `docs/STORY.md` 格式與伏筆 |
| T9 | 調味選項 UI、劇情回顧全頁、工坊合併 | Codex | medium | 三尺寸截圖 |
| T10 | 專武系統（TASKS「專武」整段） | Codex 規格草案＋Antigravity 審 → Claude 定案 → Codex 實作 | high | — |
| T11 | 跳級 7 天回顧、A2 以後文法題標籤 | Codex | medium | — |

規則：一次只有一方改同一分支；改戰鬥檔（COLLAB 檔案負責人表）只有 Codex；合併到 `feat/round4` 只有 Claude；不 push main、不部署。

## Codex執行追加（2026-11-01，第31批後）
- 已讀本表v2.1與共同指令，照T1→T3→T5推進；目前尚未讀到Antigravity的c7-v21-agy-review.md，不視為已完成第二意見。
- 題庫b4cc0f0已增到各1240/共3720草稿，還缺B2+560、C1/C2各760；T3報告為前1200/區的快照，以穩定題幹/原文映射而非沿用變動後陣列索引。
- 核對Antigravity報告時發現新31批九句跟讀也超PLAN 4～8詞，已一併改短，維持原意並更新中文；自審漏抓此限制已記BATCH_031_REVIEW，不宣稱五輪已完成。

- T1實作前細節已整理docs/gpt/c7-v21-codex-implementation-questions.md（追趕參照點、跨倍率門檻、塔/精通目前0 EXP、0倍率兌換、副本真實答題作息等）。先對照正在進行的T2第二意見，不憑空加模擬獎勵或擅改驗收。

- 已收到並讀Antigravity C7第二意見及三區題庫報告；PM v2.2已涵蓋多數實作疑點，T1改依2.2執行。T3/T4後續逐項核實，不採r7「超編應裁減到1200」建議，因正式目標仍2000。第31批九句口說長度已修。

### Codex：T1 v2.2第一步（進行中，未整體驗收）
- 已補八段跨區銜接，九區85%預算合計185640；區域終王推薦對齊各自終點（C2=200），怪物沿用原離散曲線。前後實算12290種配置，等級/HP/攻擊完全相同；369測試、tsc、eslint通過。
- 已依三方分工實際派Antigravity做T2b：轉職上限暫存與frontier+13上限互動的專項紙上審查，gemini-4-argon-high，只讀寫檔、不改原碼/不執行指令。程序工具session=82501，輸入在agy worktree的 `.agy-input/c7-v22-growth-review/`，預期報告 `docs/gpt/c7-v22-xp-buffer-review.md`。正在執行時請勿重複派同一報告。
- 追趕來源/日額津貼、素材本/塔作息、轉職暫存、首領援助及新12路徑/MC仍待完成；不得把這一步當T1完成。

- 2026-11-01 Codex｜T1/P0轉職暫存：40/100/160銀行上限5450/11450/17450，轉職立即結算；補重設不刪舊銀行/不反覆多存與跳級EXP補差額。377測試/tsc/eslint通過，本地三尺寸地圖/銀行及1366/375實點轉職40→50截圖在screenshots/c7-xp-buffer；結算提示已串，尚待三尺寸戰鬥驗證。T2b argon-high已exit0，原報告與採否理由在docs/gpt/c7-v22-buffer-implementation.md。不採會刪合法舊銀行的夾限建議。T1其餘與題庫續作，未勾整體完成。

- 2026-11-01 Codex｜T1第二批：六段非主線追趕/frontier+13/日額8:1津貼與v22、Rush8/塔首通EXP/每日掃蕩券5已串，重刷載關快照及實得獎勵對帳；389測試/tsc/eslint過。桌機塔實答4/5，無EXP容量時67→津貼8、實入108金幣。實玩另修塔結果層號與片語fallback答案回饋，修後視覺重驗及新12路徑/MC/援助待續。第二意見派工被auto-review拒絕外傳原碼/PM_STATUS，已請製作人明確授權，未繞過/未假稱AGY完成。詳docs/gpt/c7-v22-catchup-implementation.md。

- 2026-11-01 Codex｜T1援助：首領第2戰能量至少50%＋守護、第3戰一次40%全隊復活、第4戰傷害×0.85/思考+2秒、第6戰×0.75；沉默君王第3戰累計解封8題，BOSS HP/攻擊未改。實際答錯/全滅/重打回歸與八題解封通過，392測試/tsc/eslint過。修後塔再實答4/5，通過層號正確，三尺寸結算與英文錯題回饋截圖已補。另將MC隱藏的連敗計數納入獨立快照，防跨樣本援助污染；新版12路徑/MC還沒跑，不宣稱T1驗收。

- 2026-11-01 Codex｜T1模擬作息已接真實抽題、作答正確率/時間模型與store：fast每天1素材本；normal每天2素材本/每3天1塔/每3圖1複習；mastery不新增副本。A1 good/normal smoke完成5圖，16筆副本紀錄、真實4～10題/60秒（非灌滿獎勵）、EXP/金幣/素材帳相符，終點22；這只是A1流程驗證，不是九區驗收。時間仍沿用既有題型/難度啟發式，未宣稱真人速度量測。接著重跑12路徑與獨立MC。

- 2026-11-01 Codex→PM｜T1 v2.2新12路徑+4 MC全部exit0、61圖全達；等級8/12過，四fast僅C2終王前186～187（需188），缺357/544/2642/506 EXP。normal四類均終王前200，mastery最大超前12～13；23033重核斷言。吃力C2終王首過57%（n60）未觸55%調整門檻，不改BOSS。詳docs/gpt/c7-v22-experience-pool-review.md與c7-v22-budget-results。請裁決fast C2容許−14或另定補足來源，未擅改85%/Rush8/門檻，不勾T1。AGY新結果第二審待資料外傳明確授權，先續本地T3。T3核出r6報告214列非宣稱152，且原900/300輸入與現在前段完全相同，僅55同索引題幹相符/11他處/148未對應，不能直接照索引改；詳REVIEW_REPORT_INTEGRITY與逐項triage。

- 2026-11-01 Codex｜T3第一組已核實修16道r6閱讀/文法原始資料，先以報告完整選項重定位再人工核上下文，改善假英文/時態多解/使役與偏好改寫；build可重現、題數仍3720。triage16 resolved/198 pending，非全量五輪完成。86708運作斷言與格式0錯/172既有警告，必要型別/測試/lint另跑；詳R6_REVIEW_REVISION_001.md。C7數據固定在2657570歷史輸入，不把後續換題冒作同一模擬。
