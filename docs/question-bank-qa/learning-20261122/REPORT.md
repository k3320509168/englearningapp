# 2026-11-22 實作與驗收交件

分支：`codex/game-audit-fixes`。程式存檔點：`8ec587c`（雲端）、`19a8cc8`（情境支線／作答證據）。未合 main、未部署；舊 unmerged worktree 未修改。

## 已實作

### 雲端同步

- 既有 `saves` schema 的 user_id 唯一鍵與 updated_at 條件寫入；首次 insert，既有紀錄原子 update，拒絕無條件 upsert。成功後採伺服器回傳版本。
- 遠端先更新／建立會顯示衝突，本地進度保留；選擇期間又變更會重新比對，不覆蓋新版本。
- 每個分頁用自己已觀察的版本，不能借別的分頁共用 metadata 的新時間戳。
- 衝突上傳斷線保留選擇快照及可重試提示；登入下載斷線的立即同步重試 fetch。
- 遠端移除解除過期衝突、保留本地並停自動上傳；玩家再按立即上傳才重建。
- 本批雲端共25項mock契約＋1項真元件錯誤對話測試。沒有使用真金鑰、帳號或遠端資料庫，仍需真Supabase/RLS驗證。

### 真實答題證據首包

QuizRunner實際提交時記錄choice/typed/speech/skipped、原技能、fallback、示範與重播／慢速請求、正誤、blind/review；每題去重，事後示範不回填事前提示。Game層處理匯入、rehydrate及重置清除，測驗未開啟也生效。

這是最多300筆的本機診斷紀錄，不含姓名、輸入、錄音或辨識逐字稿；不隨備份／雲端搬移，不能當成玩家熟練度、自由產出或CEFR。完整LE-01的能力／情境metadata與可攜證據仍待實作。

### 可玩的三節商隊支線

入口：副本與挑戰 → 護送商隊。

1. 讀公告，比較重量與路線，選最快安全路線及理由。
2. 手動聽商人新增貨物消息，更新總重與路線；原公告可回看，字幕可選並保存輔助旗標。
3. 組合立場、理由與可行安排，接受通知延誤／致電客戶兩種合理安排，立即給回饋及例句。

無倒數、無麥克風強制、不自動播音、不新增資源獎勵。節點完成及輔助旗標隨既有主存檔保存，能關閉續接／重載／備份還原／重播；不影響主線。有限分支組卡不是自由說寫評量。

## 驗收證據

- `npx tsc -b` 通過。
- `npx vitest run`：63檔521項通過。
- `npx eslint src --quiet` 及 e2e/config 專屬 ESLint通過。
- `BASE_PATH=/englearningapp/ npm run build` 通過；既有大chunk警告保留。
- 真Chrome headless三尺寸：1366×768、1920×1080、375×812，3/3完整流程通過。從真入口選錯修正、重載續接、字幕、組卡、結局、重播無額外資源，再從塔答題驗證固定作答事件，離開測驗後設定匯入驗證清除診斷及保留故事。
- 三尺寸瀏覽器DOM均無頁面或modal橫向溢出。已目視核對手機選路／結局及1366桌面結局；手機長內容以modal內捲動，不把窄桌面截圖當成手機實機。
- 截圖關閉有限CSS入場動畫以取穩定畫面；操作流程本身使用正常動畫。沒有隱藏選項或裁切修飾版面。
- 初次測試曾因同時啟動兩個runner共用輸出目錄造成trace檔遺失；已分離outputDir並順序重跑3/3通過。初次正式preview資源404為BASE_PATH與build不一致，已修驗收設定並重測；不冒算為遊戲功能通過。

[手機選路](caravan-375x812-read.png)／[手機回應](caravan-375x812-respond.png)／[手機結局](caravan-375x812-complete.png)／[1366桌面結局](caravan-1366x768-complete.png)／[1920桌面結局](caravan-1920x1080-complete.png)。

## 正式包冷載入與受控弱網

兩例皆獨立context、CDP禁快取／阻擋service worker。桌面不限速、CPU1×；窄視窗下行4Mbps／上行1Mbps／100ms latency／CPU4×。所有音量0、autoSpeak=false。

| 條件 | 副本入口可見 | 實點商隊標題可見 | 原生FCP |
|---|---:|---:|---:|
| desktop-local-unthrottled | 0.38 s | 1.19 s | 0.24 s |
| narrow-viewport-controlled-slow | 2.56 s | 3.19 s | 2.47 s |

完整資源與條件：[performance.json](performance.json)。這是本機Vite正式preview、每條件一次，資源encoded/decoded顯示有壓縮；不是未壓縮下載，也不等於部署CDN或真手機。入口與標題是自動化觀察時間，含點擊／觀察延遲；資源量只含觀察時已完成請求，背景預載未必完成。

未設定任意速度門檻，不能由兩個樣本宣稱所有手機效能良好。資源切分／預載策略與長時間掉幀仍可再分析，沒有為消除警告而任意改載入機制。

## 重現

本機已安裝Chrome可指定可執行檔，不接管使用者profile。CI可依Playwright標準安裝其隔離Chromium。

```sh
npm ci
E2E_CHROME_EXECUTABLE='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' npm run test:e2e -- e2e/caravan.spec.ts
BASE_PATH=/englearningapp/ npm run build
E2E_PERF=1 E2E_OUTPUT_DIR=test-results/performance E2E_CHROME_EXECUTABLE='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' npm run test:e2e -- e2e/performance.spec.ts
```

config在效能模式自動啟動BASE_PATH一致的5184正式preview，平常用5183 dev；若既有其他專案服務佔用同埠，先確認服務，不終止未知程序。

## 顧問與未完成範圍

Antigravity（gemini-4-hydrogen-high，plan只讀）多輪反證定位分頁版本、登入重試、衝突刪除死鎖及生命週期遺漏，均已修正並加測；最後複核未再指出明確新bug。其回覆不是實測證據。

仍待：LE-01完整資料整合、LE-03～07新情境家族與隔離檢核、延後遷移／自由產出／玩家成效、其餘全庫逐題語意與每級每模式完整矩陣。真人口音、實機觸控與真帳號雲端另驗。沒有把所有工作標為完成。
