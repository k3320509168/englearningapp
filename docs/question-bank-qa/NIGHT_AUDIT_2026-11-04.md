# 遊戲夜間驗收問題清單（5383eb8 本輪彙整）

製作人最新指令：專注測試、列問題與改善建議；先不修改程式。背景音樂關閉，保留發音與音效。

**最新結論與完整索引見 [AUDIT_SUMMARY_5383eb8.md](AUDIT_SUMMARY_5383eb8.md)。下文按測試時間追加，早期「尚未完成／工具受阻」描述保留作紀錄，以總結覆蓋表與文末更新為準。32筆編號含確定缺陷、規格衝突與待決建議，不代表32個同等嚴重故障。**

## 測試版本與方法

- 最新基準 `5383eb8`（程式內容上一個 commit `400fb22`），主整合在 `/Volumes/Dzzz_ssd/Files/Games/EngGame`，port5173。
- port5174是 Codex 舊工作副本（英雄88位），**不是最新版**；已透過實際畫面與 Antigravity 桌面原對話確認來源，不把舊版問題混入最新版。
- 另用 `git archive` 的相同基準快照啟動 **port5181**，獨立瀏覽器 origin 保存專用測試角色；不覆寫 port5173 的既有角色。
- 內建預覽一度出現150%縮放／viewport與顯示比例不一致，造成左上角縮小畫面。**該批畫面不作375px手機驗收證據**。改用 Chrome 擴充控制，逐次核對實際 innerWidth、innerHeight、DPR。
- 已以圖片檔 metadata 再驗證 `party-375x812.jpg`、`party-1366x768.jpg`、`party-1920x1080.jpg` 的像素尺寸完全相符。Chrome 為375×812 CSS pixels、DPR1的響應式模擬，**不是實體手機／iOS Safari／觸控鍵盤驗證**。
- 新玩家正常流程已走：創角、序章略過、程度測驗入口、P-1戰前預習、答錯解析、學習卡、重新答題、完成P-1、進P-2後撤退並保留進度。之後十連召喚、滿隊選人、快捷換第2位成功。
- 高階介面用人工建立的合法測試存檔：C2 Lv171、四階轉職、全英雄、測試資源；經正式「讀取備份檔→確認讀取」載入成功。**這類資料只驗介面與功能，不能拿來證明自然養成平衡**。原新手P-2測試存檔已備份。

## 已重現缺陷

| ID | 優先 | 問題 | 重現／證據 | 建議方向 |
|---|---|---|---|---|
| N01 | P1 | 世界王本地StrictMode重複發獎、跳咒文 | 原元件ReactDOM/jsdom測試：五答後6000金幣/4券，對照正常3000/2券；題序1→3→5。見`HANDOFF_AUDIT_5383eb8.md` | state updater不得包含發獎、其他setState等副作用；結算保證一次。production是否同樣發生尚未證實 |
| N02 | P1 | 平衡驗收runner可在九個子程序全部exit1時仍exit0且九列✅ | 隔離故障注入已重現，成績全`-`仍標達標 | 檢查退出碼、缺失值、實際門檻；舊綠勾不能作全面平衡證據 |
| N03 | P2 | 手機英雄常駐操作列橫向溢出、操作目標偏小 | 真正375×812的Chrome，選未上陣SHAMAN；第4位BARD按鈕right383，數值按鈕x389～448，超出375px；modal-body寬357、scrollWidth439，底部出現橫向捲軸。快捷換位鈕高28px | 手機常駐列分兩排、適當換行，姓名省略但保留辨識，確保四個位置及數值都能直接點到；主要觸控目標依既有規格至少48px |
| N04 | P2 | 手機替換模式提示被擠成直排，詳情擠壓列表 | 選隊伍中KNIGHT／SHAMAN，長提示文字在flex列極窄區域逐字折行；`mobile-hero-details-overflow.jpg` | 將模式說明改為整行，取消按鈕獨立列或短句；避免說明固定與其他內容搶窄寬 |
| N05 | P2 | 學習卡遺漏選擇題答對／答錯紀錄 | 新角色bread聽力答錯後點「學這個字」，仍顯示答錯0次；`chrome-mobile-learning-card-375x812.jpg`。`WordStudy.tsx:95`將choice的`q.ans`字母與單字key比對，無法匹配bread | 使用一致的詞彙識別函式與聚合規則，覆蓋choice、fill、spell、voice及片語；不要只比對答案字母 |
| N06 | P2 | 世界王示範發音忽略設定音量 | 原元件所有音量設0，無聲語音recorder仍收到volume1；`WorldBossModal.tsx:145` | 與其他介面共用遵守設定的發音方法 |
| N07 | P2 | 固定配裝模擬只建三次轉職，卻可給Lv200 | `realsim2.mts:102`實測tier3/cap160/Lv200 | setup依合法上限與實際轉職建立；budget重複維護可進四階，**不代表正式遊戲不能到200** |

N03截圖：`screenshots/ui-audit-resumed-20261104/chrome-mobile-party-replace-overflow-375x812.jpg`。原元件與runner原始證據在`docs/question-bank-qa/handoff-5383eb8/`。

## 待確認風險／設計建議（不能當成已重現bug）

1. **跳級資源補償規格衝突**：`PlacementModal.tsx`明寫前面區域不算通關、不補獎勵；`docs/GAME_STATE.md`卻記錄製作人體驗問題與補資源建議。先測跳級臨時戰力、英雄養成與資源體驗，再決定如何補償，不能自行視為已定案新規格。
2. **學習卡前後導航**：bread卡的上一個／下一個皆disabled。`WordStudy`在首次mount用`useMemo([])`快照VOCAB keys，而VOCAB有背景載入；需確認是否因快照過早或key大小寫造成新增詞彙無法導航。現在只列待深查。
3. **語音品質驗收限制**：已實際觸發正常／慢速發音按鈕，保留其音量；工具沒有提供對電腦實際揚聲器的聽音回饋，因此不把「按鈕能觸發」寫成「真人已聽過、音色正常」。真實麥克風與Safari仍待驗。
4. **新手預習負擔**：P-1開始前出現17張預習卡，雖可略過，可評估先給3～5個本段必要詞，再讓有需要的玩家展開。此為體驗建議，不是故障。
5. **文字與文件過度宣稱**：TASKS全勾選、421 tests、題庫格式全綠均不能推出全流程、全英雄、全題語意或CEFR能力已驗證。

## 英雄與顧問交接核對

已直接操作 Gemini桌面App 原本「EngGame出任務」對話送出要求，讀取回覆並追問未答項；不是只用另一個CLI對話代替。

獨立資料核對與最新版介面一致：**300位，N96／R90／SR76／SSR38／原生UR0**；38位SSR均有`signature`技能與專武；主角5把專武；300位均有HERO_LORE資料。檔案：heroes.ts、progression.ts、weapons.ts、heroLore.ts。這不等於300位全部實戰驗收。

Antigravity明確承認：
- 未逐一實玩38位SSR技能。
- 未逐把實戰驗證43把專武數值。
- 沒有300位真名考驗逐一點擊通關的驗收截圖。
- N01、N02、N06、N07四項問題在交接前均未測。

**已排除過期誤報**：顧問最初稱「跳級永久鎖死專武」；本輪讀碼發現`SummonModal.tsx:51`已有`bossDown.includes(3) || unlockedIndex > 3`。要求更正後，顧問已明確撤回。不得把它再列為最新版確定bug。

桌面原對話紀錄：`screenshots/ui-audit-resumed-20261104/antigravity-handoff-response.txt`。

## 覆蓋進度與接續

- 已核對最新版版本、英雄資料與三尺寸英雄畫面；不是全介面都完成三尺寸。
- 已實玩pre-A1 P-1→P-2接續、答錯→解析→單字卡→重答→攻擊→撤退保留進度。
- 已實測召喚扣10券、十張成果、保底計數0→10、累積10/100、入隊4/4、查看英雄、選待命英雄後換第2位成功。
- 已在另一個IAB新手存檔測到KNIGHT真名用法答對1/5、詞性答錯與重試後選項重新排序；此存檔與5181獨立。
- Chrome備份download事件等待逾時，但實際下載檔案存在並已保存；是工具事件捕捉問題，**不列成遊戲下載失敗**。
- Chrome檔案匯入一開始受擴充功能的檔案網址權限阻擋；製作人已開啟。之後讀取C2存檔預覽與確認載入成功。工具傳檔耗時不能歸咎遊戲UI。
- 下一段：A1～C2每區戰鬥與題型樣本、設定/圖鑑/成長/工坊/劇情回顧、程度測驗/區域試煉、全部副本；分開記錄手機與桌面實作狀況、未完成項，不提前勾全過。

本輪未改遊戲程式、未合併、未push、未部署；報告與證據保存在Codex獨立副本。

## 11/5 凌晨續測補充

- **N05已補原元件重現**：實際WordStudy在關閉狀態先mount，再載入正式bank，再用正式pre-A1 bread題呼叫recordAnswer(false)，store記錄wrong1但元件顯示wrong0。原始證據`handoff-5383eb8/wordstudy-evidence.json`。
- **N08／P2，導航失效已確認**：同一實測中VOCAB從153筆增至8738筆，BREAD由不存在變存在，學習卡上下詞仍皆disabled。因首次mount的`useMemo([])`鍵值快照未隨背景載入更新，不只是猜測。
- **N09／P2，匯入後每日介面未初始化**：有效測試存檔含daily:null，匯入成功後任務/複習/登入列消失，重新載入後三者出現。`Game.tsx`的ensureDaily在mount執行，但importSave rehydrate後未再初始化。限定此輸入條件，不泛稱所有玩家匯入都壞。前後AX與畫面：`c2-after-import-before-reload*`、`c2-after-reload-375x812.jpg`；重新載入會使Chrome emulation重設，照片比例需另核對，不以未校準圖判跑版。
- **N10／內容P1，高階題混入需外部專業知識的問答**：C2聽力題`speak`只說CMP module suffered from dishing and erosion on copper interconnects，問What failed，答案要求推導copper與oxide選擇性移除率失衡。題幹沒有提供該因果資訊，需額外半導體知識；三個干擾項包含忘記洗膠靴、馬達保險絲、瓶蓋忘蓋等，難以有效區分英文能力。建議增加足夠語境、以精確改述/推論取代專業知識猜謎。**不在此宣稱已驗證CMP技術答案本身的科學正確性**。
- **N11／內容P2，素材本拼寫提示不足與答錯回饋缺口**：實際抽到「請拼出：尖刻易怒而帶刺的」，只有輸入欄，沒有字數或首字母；輸入prickly被判錯，combo歸零後直接跳題，沒有顯示目標字及解析。需核對原題固定答案與可接受同義詞，並在素材本統一保留必要的作答線索；答錯至少提供可回顧答案。題目樣本與來源索引保存於`content-samples-night.json`，不可將此自動視為所有拼寫題都模糊。
- **排除C2預習desk的誤報**：原碼createDecks明確有28%前區螺旋複習，故高區出現基礎詞不必然是載錯題庫。仍可評估是否應按個人弱項選複習詞；此為設計建議。
- **C2已實際進場**：開始天空島、區域與地圖劇情→戰前情報→C2聽力→作答後換下一題，連攜0/4→1/4；SSR SERENITY確認施放後剩餘19.3→27.2秒，設定視窗及撤退確認能暫停計時。手機長選項D在y792～860，812px畫面須捲動才能完整閱讀；列為時間壓力下的體驗建議，不將正常可捲動內容直接當故障。
- **每日素材本已實際跑完60秒**：2題答對、最高2combo，畫面結算286金幣、56EXP、0礦石。曾故意答錯以測combo重設。這是單次流程測試，不是吞吐速度/平衡勝率樣本。
- **黃金之路獎勵文案建議**：副本入口寫「海量召喚券」，實際首通常數GOLDEN_CLEAR_TICKETS=10，詳細規則有寫10；不是沒有發獎的bug，可將入口也改精確數量減少落差。

### 優先新增：專武資源與世界王

**N14／P1，專武券補發標記未持久化，可重複補發。**

- 條件：存檔已打倒B1以及後續至少一個區域魔王，且進入補發流程。
- `saveStore.ts:556`～562依`_weaponBossBackfilled`判斷是否補發，卻沒有在persist的partialize中保存這個欄位。
- 瀏覽器實測：券58張 → 重整顯示78張 → 不做任何存檔動作再重整仍為78張 → 鍛造一次並正常存檔變77張 → 再重整變97張。
- **精確限制：不是純粹連按重新整理就必然一直累加；需要中間有正常持久化動作，才會把多出的券寫回卻遺失補發標記。**
- 另用實際migrateSave與persist.partialize隔離重現：bossDown=[3,4]，券0→補5，持久化缺標記，再讀取→10。證據`handoff-5383eb8/weapon-backfill-evidence.json`。
- 此問題在存檔邏輯，與React StrictMode無關。建議保存補發標記、限制遷移適用版本、驗證正常新版首通不重複補發；舊玩家已合法持有的券不要擅自刪除。
- UI證據：`weapon-tickets-before-reload-58.jpg`、`weapon-tickets-after-reload1-78.txt`、`weapon-tickets-after-reload2-without-save-78.txt`、`weapon-tickets-after-one-forge-77.txt`、`weapon-tickets-after-save-and-reload-97.txt`。

**N15／平衡P1，世界王可連續以畫面明示關鍵詞領取完整獎勵。**

- 原介面輸入placeholder直接給出正確keyword，鍵盤備援只要依序輸入五次即可破100萬HP；重開後仍是相同開頭咒文，無首勝／每日／每週領獎限制。
- 已在Chrome實際連續完成兩次，第二次仍完整發獎：金幣106298→112298，專武券54→58。
- 上述實際增量包含N01的開發StrictMode雙倍發獎。**即使修掉N01，原設計仍是每次完整給3000金幣與2張券，無限重領的平衡風險獨立存在。** 不把開發模式雙倍數字推論為production必現。
- 與商會專武券每週限購2張、其他副本每日次數及正常關卡養成成本形成明顯落差；建議保留可重打與鍵盤備援，但將完整獎勵設為明確的日／週首勝，或另定符合整體經濟的重打獎勵。這是建議，今晚不直接改數值。
- 原始兩輪UI紀錄`worldboss-live-run1.json`、`worldboss-live-run2.json`，前後專武券與金幣紀錄`worldboss-before-run2.txt`、`worldboss-after-run2-before-reload.txt`。

### 其他副本規則與學習體驗

- **N12／機制規格衝突待釐清**：`modes.ts:13`、15、58在素材本／塔一律套voiceFallback，未讀voiceAsSpelling設定。素材本實際將原本voice題WASPISH變成文字拼寫。需釐清這兩個模式是否刻意為純文字快答；若保留，文案與技能統計不得把打字宣稱為真實口說練習，與「口說預設語音」原則的適用範圍也須寫清楚。
- **N13／P2，前兩次素材保底與規格不符**：TASKS第七節與modes.ts註解寫前兩次150金幣＋素材，實際rushReward只有金幣保底，ore=floor(correct/3)。本輪第一次跑完2題答對，結算0礦石。需決定補至少1素材，或更正文案／規格；不自行調平衡。
- 素材本結算與錯題本接通：答錯WASPISH後副本入口顯示待複習1題。
- 時空塔已進第一層，看到5題答對4題通過與當日主角BELL的5碎片、100金幣、2徽章、67基礎EXP規則；尚未完成該層。說明「每5層首領獎勵3倍」應明確是哪些獎勵，因towerReward並非每種資源均×3。

### 瀏覽器接續狀態（11/5）

製作人回覆「有token了繼續」後，原測試分頁的getAXState被瀏覽器安全政策拒絕：URL政策未授權內容讀取，並認定協定不允許，只允許http/https。**停止該瀏覽器動作，不以其他瀏覽器、原生UI、raw CDP或間接執行繞過。** 已請製作人確認實際分頁網址，未要求再改安全設定。等待期間繼續獨立的原始碼、存檔與題目檢查。該拒絕不列為遊戲本身缺陷。

### 11/5 邏輯與內容追加驗證（不替代實機）

- **英雄技能**：實際battleStore對38位SSR各跑菁英與首領場景，共76次施放；含能量消耗、返回答題、治療、復活、護盾、延時與對應增益。加上300位英雄Lv1真名基礎攻血加成及43把專武解鎖/升級攻擊檢查，合計1282個斷言，0失敗。僅驗證列明契約，未驗證所有技能動畫、手機觸控或長期平衡。證據`hero-contract-evidence.json`、原始harness同目錄。
- **真名選擇題結構**：實際trialQuestion對300英雄、五類考驗、50個seed，產生30000個選擇題案例，未找到選項重複或正確答案數不等於1。此結果不代表詞源敘述與教學內容均已人工審過。證據`true-name-choice-evidence.json`。
- **四能力魔王題池**：九區逐一產生聽/讀/說/寫題，questionSkill與所選模式一致，未找到技能分類混入。這不是各模式的語言效度與難度校準已通過。證據`skill-boss-pools-evidence.json`。
- **N11補強：確定的同提示歧義**：1180道B2+～C2素材本可抽的簡單題經實際voiceFallback與checkQuizAnswer檢查，找到r6.normal[1010]與[1597]同顯示「請拼出：補償」，卻分別只接受COMPENSATION（名詞12字母）與COMPENSATE（動詞10字母），互相拒收。這比單一同義詞爭議更明確。建議標詞性、字數或情境，並讓素材本保留必要提示；不要任意把詞性不同的答案全部放寬成對。證據`rush-prompt-collision-evidence.json`。

### N16／P1：試煉途中補滿封印，40題全對仍判失敗

- **條件**：已擊敗該區魔王、封印僅差少量已學知識點；以40題高標準開始。答題會經QuizRunner.recordAnswer更新knowledge，途中剛好達成封印。
- **實際元件重現**：正式5383eb8的GateTrialModal＋QuizRunner＋saveStore，使用已載入的正式A2題庫與接近完成封印的合成存檔，在jsdom作答40題全對；第2題後sealMet變true。結算卻顯示「試煉未通過，答對40/40（需要18題、每種至少4題）」，四項均10/10，unlockedIndex仍1。不宣稱這是瀏覽器實玩，這是原元件整合重現。
- **原因**：GateTrialModal每次render由即時mastery推導strict，沒有鎖定開局規則；sealMet變true後strict=false。trialPassed普通規則要求各項total===6，而這局各項total===10，所以全對也不能過。同一份40題全對score用開局strict規則則true。
- **建議修正**：開局保存attemptStrict／attemptRule／attemptRegion與題目；出題、進度、結算及驗證都使用該局快照，封印進度可繼續更新但不得改該局規則。加上「高標準途中封印完成、全對仍正常解鎖」回歸測試。
- 證據：`handoff-5383eb8/gate-rule-evidence.json`、`gate-audit.test.ts`。mock只替換已完成正式bank載入後的非同步loader，沒有替換評分、題目或存檔邏輯；音訊為靜音測試環境，不動玩家設定。

### 11/5 瀏覽器已恢復與新增實測

製作人提供5181截圖、再明確授權重新連接後，既有Chrome工具讀取與點擊已恢復。音量實際確認：music0%、speech100%、sfx70%。375×812重新set viewport並核對DOM/DPR=1，證據`reconnected-settings-375x812.jpg`。不再把先前工具拒絕當遊戲缺陷。

- 設定五頁已開啟；正常/慢速試聽按鈕已點擊（工具不能主觀聽辨音質）；特大字切換無水平溢出，已還原標準。重置二次確認出現並取消，未刪存檔。雲端功能因隔離快照沒有Supabase設定未測，不讀金鑰。
- 存檔頁、圖鑑已解鎖列表、裝備頁完成375×812／1366×768／1920×1080截圖，DOM/modal無水平溢出。檔名前綴settings-save／codex-unlocked／equipment-grade1。這不等於所有介面已完成三尺寸。
- 圖鑑Pre-A1到C2全部分區可切換；搜尋cogent、清除搜尋、已解鎖、待複習、卡片詳情→單字卡→Esc回圖鑑已操作。錯題waspish正確顯示wrong1。分區紀錄`codex-region-switches.json`。
- 劇情回顧王城篩選、開場重播、下一句、略過可操作，首重溫發1掃蕩券。略過返回主畫面，想接續重溫另一幕須重新打開回顧：列為導航體驗建議，非資料遺失。八頁說明逐頁閱讀，紀錄`help-pages.json`。
- 成長：魔法師未轉職→元素魔法師扣10徽章→重置退10→切回原劍士覺醒路線保持。Lv171與EXP保留，尚未測所有分支。
- 商店：HP升級扣50、道具藥水扣40並持有5→6；兩把N短劍各扣100/3礦，首件自動裝備；第二件強化+1扣50/1礦，主件升品階消耗副件、背包2→1、攻擊10%→12%。材料退款向下取整，此次1礦×65%為0，不算漏退。
- A1實戰：桌面鍵盤DESK、手機畫面字母鍵RICE均答對；提示卷軸5→4、兩錯誤項disabled；Cold故意答錯後解析正確、SERENITY受21傷，藥水6→5回滿且未超上限；重答選項重排後C寒冷答對、撤退確認與收益保留可操作。
- 時空塔第1層實際答完：WATCH拼寫、EMAIL填AI、Cold/Clock類聽力故意答錯、CLEAN填全字、TENNIS拼寫，4/5通過；結算100金幣/67EXP/5碎片、返回總覽進第2層。結算三尺寸已截圖`tower-floor1-pass-*`。未據此宣稱無盡樓層已全驗證。

### N17／內容P2：圖鑑將不確定詞性當作名詞顯示

C2搜尋cogent，列表與詳情均顯示n.，例句卻是Her argument was so cogent...，Cambridge將cogent列adjective。亦看到succinct標n.待後續修正。`codex.ts guessPos`對未知單字預設n.，會把推測當正式教學內容；釋義還會直接用整段q.explain（cogent卡混入tenuous/vague/trivial干擾項解析）。建議缺詞性時顯示待補/不標，從經審核詞條補全，釋義與原題解析分欄。UI證據`codex-cogent-375x812.jpg`，來源[Cambridge cogent](https://dictionary.cambridge.org/dictionary/english/cogent)、[Cambridge succinct](https://dictionary.cambridge.org/us/dictionary/english/succinct)。不把全部guessPos結果都判錯，需分批審核。

### N18／介面P2：鍛造捷徑未到指定分頁

裝備空背包的「前往工坊鍛造」先跳雜貨商會；商會「前往成長鍛造坊」卻回成長主角頁，還須手動點鍛造坊。實際UI已重現，功能本身存在，屬入口導向錯誤與繞路。建議明確帶growthTab=forge的入口，裝備空背包直接到一般鍛造分頁。

### N19／手機可讀性P2：戰鬥畫布的敵人資訊過小

真正375×812/DPR1截圖`a1-spelling-mobile-paused.jpg`中，畫布約175px高，烘在畫布上的敵人名稱、HP、ATK與狀態文字只有數像素，難以辨識；字母鍵與答題區則可用。建議將關鍵HP/行動預警做成可讀HTML資訊，或依手機尺寸調整畫布內字體與佈局。此為響應式瀏覽器實測，非實體iOS/Safari驗收。

### 11/5 副本與英雄流程追加

- 時空塔第2層故意0/5→失敗、不升樓層→重新挑戰成功開新一批題；沒有把工具無法聽辨TTS當成聽力能力測驗。
- 錯題修煉場實際8/8；五連對時掃蕩券1→4，8題結算金幣+80。結果文案稱「最高連對」實際讀streak，尚待補有中途答錯的重現。修煉後同批到期錯題仍存在、每日複習任務0，因QuizRunner.recordAnswer的review=false；是否刻意只計主線SRS須釐清，先列機制/文案待決而不直接改。
- C2每日碎片實測3/5→6片願望碎片，前往英雄可操作。第一題mixed conditional、第四題circumspection、第五題droll判定正常。第二題ABSOLUTE PRIORITY RULE被拒，目標doctrine；**原題明確要求聽發音聽寫，目標音訊能消歧，不能只憑輸入rule失敗就斷言判題錯誤**。
- PHOENIX五項真名實際完成：拼寫/用法/複數/俗語/聽寫備援；共15英雄碎片、3召喚券、專武解鎖可見。發音未用真人收音，不能算ASR/真人口說已測。繼續升一星消耗15英雄碎片＋5願望碎片＋500金幣，剩願望1、下星40碎片/1000金幣，畫面能力更新。
- **N03/N04延伸**：展開英雄詳情後捲動錨點保留列表位置，詳情插在列表上方而不在可見範圍。1366桌面量測detail.top=-231、hero-modal-scroll.scrollTop=525，正常往上捲後top=294/scrollTop0可找回。手機還有既有橫向溢出。不是詳情資料消失，應在展開時適當捲入可見區、保留收合返回列表的錨點。部分getScreenshot橋接影像會縮放，可靠照片須每次set viewport並用tab.screenshot；不把工具影像縮放誤報遊戲。

### N21／內容P1：高階片語釋義加入英文原文不存在的細節

C2原r8.normal[1591]口說詞條`biological weapons non proliferation verification`，中文寫「銷毀末日炭疽病毒庫之生物武器不擴散查核」，例句中文還加入聯合國、數十米地下、鐵腕、無害化銷毀等英文未載細節。已在每日碎片以聽寫備援實際抽到。建議釋義回到「生物武器不擴散核查」，例句忠實翻譯，專業術語另作題庫範圍與CEFR效度審查。這不是教學文字的風格偏好，而是對應內容失真；不在此解釋任何生物武器操作。原題及另個法律詞條保存`c2-shard-content-evidence.json`。

### N22／P2：真名上一題的900ms回呼會關掉剛開啟的下一題

實玩迅速完成PHOENIX用法後開詞性題，題目消失、進度仍2/5；排除工具點擊失敗後以實際TrueNameModal整合重現：第一項答對，900ms內開第二項，第二題prompt存在；舊計時器執行後prompt變null。原因onPass的setTimeout(()=>setActive(null),900)不辨識正在進行哪一題。建議同步清除已完成題、或取消舊timer/依題號有條件清除，卸載時亦清理。

證據`truename-race-evidence.json`與`truename-race-audit.test.ts`。harness只mock頭像dataURL以排除Phaser環境依賴，評題、進度、畫面切換與900ms回呼均為原元件；fake timer不代表瀏覽器測速結果。

### N23／介面P2：黃金之路畫布與填補背景使用不同區域

1920×1080黃金之路第一關，實際看到畫布王城夜景、外圍頂部大塊A1藍天與底部棕土；不是C2夜景本身錯誤，MainScene註解明確黃金固定王城。Game.tsx ResizeObserver卻用b.levelIdx（此時0）生成CSS backgroundBackdrop，與MainScene的非normal固定region8不一致。建議統一顯示區域的推導，四能力魔王也一併核對。證據`golden-timeout-summary-1920x1080.jpg`，需同樣驗證375與桌面而非只補一張圖。

### N20／待決：修煉與任務/SRS的適用範圍

錯題修煉場8/8答對後，原8題仍在待複習，每日/每週複習計數仍0。ReviewModal透過QuizRunner時recordAnswer固定review=false，故不會推進mistakes.box/dueAt。日任務文案明寫主線困難題/復仇魔王，這部分不能直接判故障；但「錯題修煉場」「錯題記憶已強化」與持續待複習的預期需要明確說明，或讓修煉也用跨日規則推進SRS而非同日無限刷。此項先列機制待決，不假裝已經有確定修正方案。

### N24／P2：黃金之路沿用一般戰鬥提示，護盾付費卻無法保護

已實測第一關超時即失敗、0金幣0EXP、不改主線等級；再挑戰時用現存護盾5→4（總道具14→13）、護盾圖示出現，但超時仍立即止步。黃金規則本來就禁止超時，故不建議直接放寬；問題是介面依然讓玩家花道具並提示「擋下下一次答錯或超時」，計時列也仍寫「超時只會讓combo中斷」。應在此模式停用不生效道具、清楚解釋模式專屬規則/計時；HP100/100卻倒地的失敗畫面也可改善。證據`golden-shield-timeout-result.txt`、`golden-shield-timeout-375x812.jpg`。

### N25／P1：七天回顧與週重測缺少後期入口

MapLevelBar只有unlockedIndex===0且A1進度<MAP_SIZE才顯示程度測驗；isPlacementReviewDue只在PlacementModal內呼叫，notice/首頁沒有到期入口。以正式MapLevelBar、有效已驗證8天placement、unlockedIndex7渲染，reviewDue=true，但可見按鈕只有主線、召喚提示、副本，沒有程度測驗或7天回顧。製作人規劃的T11不能在正常後期流程觸發，七天重測也同樣找不到入口。建議保留常駐程度/回顧入口，到期提供明確通知與可關閉提醒，不強迫中斷遊戲。原元件證據`placement-review-ui-evidence.json`。

### N26／內容P2：正確答案大小寫成為提示

B2實際題Scientists are currently trying to ___ exactly how the human brain processes artificial visual signals，只有正確COMPREHEND全大寫，錯誤swim/bake/fold小寫且語意極弱，容易只看外觀作答。全題庫掃描「正確選項為單一全大寫字、三錯項均小寫字」找到36候選（B2 35、A2+ 1），非全部都已逐題定罪（縮寫需例外）；至少COMPREHEND已UI確認。統一大小寫並改用語意/搭配上可信的錯項。證據`answer-cue-and-tense-evidence.json`、`b2-uppercase-answer-cue-375x812.jpg`。

### N27／內容P1：缺少時間語境的時態題，合理過去式被判錯

實際在B2+抽到【時態】The express train ___ from PLATFORM 3 at 9:15 AM. 選departed被判錯，答案限定departs；解析才補說「火車時刻表固定行程」。題幹未提供時刻表/未來/每日語境，過去式描述早先班次同樣合理。**原題來源是r2.normal[708]（A2+），在B2+以螺旋複習抽到，不誤標成r6題庫。** 建議明寫According to the timetable...或加every weekday，並改掉仍可成立的過去式干擾項。反向若目標過去式則給Yesterday。原題證據同N26，UI截圖`b2plus-tense-question-*`及回饋紀錄。

### N28／P2：七天回顧無麥克風時僅10題，卻稱12題四能力全達標

以正式diag、startPlacementReview/answerPlacementReview檢查九級×voice有無共18情境：無麥克風時每級都是10題（聽3、讀3、寫4、說0），因每級正式寫作僅4題，補不滿原定6。10題全對passed=true。再用原PlacementModal＋QuizRunner在jsdom完整作答，結果顯示「12題中答對10題，四項能力全數達標」，同畫面口說0/0卻打✘。這是明確自相矛盾，不是要懲罰無麥克風玩家；應依實際題數呈現、保持口說未驗證，區分已驗證項目與待補能力。與N25分開修，入口補回後仍會出現。證據`placement-edge-evidence.json`、`placement-review-ui-evidence.json`及同名harness。

### N29／P1：程度測驗15分鐘截止時，未完成口說/寫作仍給高可信落點

正式題庫全對完成聽讀、進入8題確認後，把第一題作答時間設為15分鐘+1毫秒：answerPlacement立即finish，口說僅1/1、寫作0/0，結果仍C2、confidence=ok、weak=[]、speakingVerified=true。原因finish只在total>=4時才判低分，不處理資料不足。需將未完成確認標為未驗證/資料不足，結果保守提示或允許續測；不要把缺考視為完整通過。此為實際函式邊界重現，未聲稱已在瀏覽器真人等15分鐘。證據`placement-edge-evidence.json`。

### 逐區實玩接續紀錄

- 備份原進度至`advanced-ui-checkpoint.json`後，官方檔案匯入等待異常長（工具回報21824秒），最後才返回r0預覽；未把等待當遊戲卡頓/工作時間。之後只用已匯入情境，不再反覆傳檔。
- 程度測驗已透過真實Chrome點擊完整跑升級路線，25個動作步驟→C2結果、明確口說未驗證；確認進熔岩魔域（C1最高開局限制）。**答案使用正式diag做流程驗收參考，不是人類英語能力/聽辨測試**，步驟`placement-ui-source-assisted-steps.json`，結果三尺寸`placement-c2-speaking-unverified-*`。
- C1：跳級主角存檔Lv5不變，戰鬥主角HP282/英雄HP366等臨時能力可見；雙盲臨床試驗題再現N10專業知識混入，另一題forgiving給完整語境、minor inaccuracies作正解則合理，不能把整區全判壞。預習supremacy卻譯成「超越傳統極限之量子優越性」，中文例句加入跨國/頂級期刊等原文沒有細節，屬N21同類問題，圖`c1-prelesson-supremacy-375x812.jpg`。
- A2：UNIFORM現在進行式判定B正常；A2+：麥克風說明出現→選本題拼寫，不開OS權限→FUTURE正常作答；B1：袋子聽力流程＋REQUEST拼寫；B1+：SOLVE口說轉拼寫＋keep checking文法；B2：較長聽力選項＋COMPREHEND詞彙；B2+：時態歧義已重現。上述六區均已截375×812/1366×768/1920×1080實際戰鬥畫面，檔名前綴a2/a2plus/b1/b1plus/b2/b2plus。每區僅抽樣進場/作答/撤退，不冒稱每一關或全部題目均手玩完成。
- 四能力寫作魔王實際5/5通關，獲5召喚券（103→108）、140金幣/160EXP/素材、稱號可見。其中輸入mixture在UI被答案長度截成MIX，不能誤稱MIxture當同義答案被評分器接受。超時仍可答題、但不加combo符合一般模式規則。
- 每週真名3項任務實際可領，金幣+300、券+2、領取按鈕消失；每日碎片重開按鈕disabled、願望碎片剩1與升星後一致。簽到頁已檢查2天及3/7/14/30天門檻，尚未在真實跨日驗證自動領獎。

### 額外模式全流程契約結果

原store＋正式題庫、答案鍵與合成3秒作答時間（非真人勝率/收音）：黃金之路45關連跑兩次，108/110題完成，首通召喚券+10、重打+0，主角維持Lv1/HP100，best45；全程combo約12.3萬、未見舊10^14爆炸。四領域魔王各跑首通及重打共8局，皆可結算，首通各+5券/重打+0。塔1～120層共600題可建構並用答案鍵判對、逐層獎勵可領、同層重領拒絕。九區普通/高標準試煉各100 seed，共1800批，題型與每技能知識點數均完整；不代表N16途中規則切換已解決。原始證據side-contract-evidence.json/harness。

### N30／P1：口說容錯會將明確反義詞判對

實際checkVoice(INCREASE,「decrease」)=true，反向DECREASE/「increase」亦true；ALTITUDE/「attitude」、ECONOMIC/「economical」也接受。正式題庫有INCREASE/DECREASE口說詞條共2筆，非只是假設不存在的題型。現有反義前綴保護能擋possible/impossible、credible/incredible，這些正向對照通過，但編輯距離容錯未保護非前綴型反義/易混詞。建議對實際詞彙混淆建立保護、清楚要求重唸，不必把所有口說容錯一律關掉。此為辨識文字之後的評分函式測試，**不是麥克風/ASR聲學實測，也不推論每次真實發音均判錯**。證據voice-minimal-pair-evidence.json/harness。

四領域UI：寫作已實際通關；聽力/閱讀/口說均已進場、作答/備援及撤退，聽力和閱讀各有答對換題，閱讀長文weekend live sessions題合理。三者三尺寸截圖listening-boss/reading-boss/speaking-boss；口說沒有開OS麥克風，使用拼寫備援ENIGMA、DIRECTION驗收操作，不能宣稱真人口說過關。入口限制設定不用麥克風時disabled，但戰內仍可拼寫備援，是否授同一口說稱號屬機制取捨，建議保留可玩性並標未驗證。


### N31／P1：抽到的魔核與龍晶不能用於鍛造

實際30抽畫面出現魔核，但鍛造材料列仍為0。原summonWeapons將素材寫入magic_core／dragon_crystal，鍛造與顯示卻讀core／dragon。固定RNG走正式store：連抽3個魔核、1個龍晶，materials為magic_core=3、dragon_crystal=1、core=0、dragon=0，持有100礦石/10000金幣/已解鎖8區仍無法打造傳說聖劍。對照只將core補為3便可打造，排除金幣與進度條件。

修正需統一canonical keys，**並將既有錯誤欄位的合法資源遷移加回core／dragon**，遷移後不能重複累加；不能只改未來抽卡而遺失舊玩家已領素材。證據weapon-material-evidence.json與weapon-material-qa.mts。未改正式程式。

### N32／P2：專武抽卡公布的基礎機率與實作不符

介面WEAPON_SUMMON_RATES列神兵5%、稀有素材15%、願望碎片30%、礦石50%。rollWeaponSummon先以5%判神兵，未中時再抽r，以0.20與0.50分段，**不含硬保底時**實際基礎機率為5%、19%、28.5%、47.5%。這是分段條件的數學結果，不是用少量實抽估機率，也未將硬保底提高的長期期望混入。應由設計決定維持公布數字或現有實際分配，統一機率表與抽取函式，並測邊界；今晚不私自改玩家獎勵。證據同N31。

### 本輪最後補測及收尾

- 整合目錄HEAD再確認仍5383eb8；本輪測試不是舊5174副本。未修改任何正式遊戲程式、未merge/commit/push/deploy。Codex既有unmerged index與先前改動全部保留。
- 普通鍛造見習短劍100金幣/3礦石，裝備自動穿上；普通強化+0→+5五次正確扣750金幣/15礦石。神聖鍛造3/3（含聽力選擇、填空EER、SUBSTANTIVE拼寫）成功+5→+6，97035→96735金幣、121→115礦石、神聖加護與攻擊+18%可見。聽力答案以選項語意作流程判斷，沒有宣稱工具聽過揚聲器。
- 再跑神聖鍛造故意答錯，0/3結果後金幣96735、礦石115、+6與加護均未變；取消挑戰亦未扣款。卸下再裝備正常。證據holy-forge-failure-preserves-resources.json、equipment-unequip-requip-cancel.json，成功圖holy-forge-success-375x812.jpg，已用sips確認375×812。
- 神聖鍛造第二輪又抽到需天文專門知識的Roche limit選擇題，屬N10同類範圍效度問題；本輪不宣稱已驗證其科學定義，也不另重複計號。
- 轉盤原store固定RNG契約：同checkpoint只發一次、無pending不能轉、兩次50金幣後第三次保底1券、pending正確扣完；wheel-contract-evidence.json。**尚未完成轉盤動畫/隱藏再開的三尺寸UI驗收**，不能拿store通過替代。
- 收尾實際設定為背景音樂0%、發音100%、音效70%。已清除臨時viewport override，Chrome恢復自然視窗比例；未將桌面視窗裡的空白邊帶當手機畫面。final-audio-settings-375x812.jpg與final-natural-desktop.jpg。
