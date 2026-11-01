# R7（C1）題庫草稿品質審查報告

- **審查對象**：`.agy-input/r7.json`
- **命題規範依據**：`.agy-input/PLAN.md`（C1 區規範：高階語用、修辭轉折、長難句結構、隱含態度、學術／制度論證與精準詞彙）
- **審查日期**：2026-11-01
- **審查員**：Antigravity

---

## 一、審查統計摘要

- **總審查題數**：**1,240 題**（`normal` 930 題：`normal[0..929]`；`boss` 310 題：`boss[0..309]`）
  - ⚠️ **題數結構超編提醒**：依 `.agy-input/PLAN.md` 規範，每區應為 `normal` 900 題（30 批 × 30 題）＋ `boss` 300 題（30 批 × 10 題）＝ 1,200 題；但目前 `.agy-input/r7.json` 實際收錄了 **31 批**（多出第 31 批 `normal[900..929]` 與 `boss[300..309]` 共 40 題），匯入正式題庫前需確認是否裁減至 900／300 題或保留。
- **檢出有問題題數**：**139 題**（占總題數 **11.21%**）
  - `normal` 有問題題數：**99 題**（占 `normal` 10.65%）
  - `boss` 有問題題數：**40 題**（占 `boss` 12.90%）
- **完全無問題題數**：**1,101 題**（占總題數 **88.79%**）

### 問題類型統計表（依主要問題歸類，每題僅計入最主要之一類）

| 問題類型 | `normal` 題數 | `boss` 題數 | 合計題數 | 主要現象說明 |
|---|---:|---:|---:|---|
| **1. 答案唯一性／多解風險** | 7 | 4 | **11** | 英美拼字變體（`CANDOUR`/`CANDOR`、`SAVOUR`/`SAVOR`、`CATALOGUE`/`CATALOG`、`ACKNOWLEDGEMENT`/`ACKNOWLEDGMENT`、`IDEALISATION`、`AUTHORISATION`、`GENERALISATION`、`LABOUR`、`DISORIENTATE`/`DISORIENT`、`RECONTEXTUALISE`）未提示或挖空差異字母；連字號複合詞 `SELF-POSSESSION` 拆成空白分詞。 |
| **2. 干擾選項設計不良** | 33 | 2 | **35** | 大量閱讀【文法】／【分詞構句】／【倒裝】題使用違反 A2/B1 基礎語法的「假英文」（如 `had been adjust`、`would adjusting`、`will have reviewing`、`had been review`、`to making`、`are have`、`had we realise` 等）作為干擾項，違反 `PLAN.md`「不可用假英文充數」規範，導致 C1 考生可瞬間秒刪。 |
| **3. 難度不符 C1** | 31 | 16 | **47** | ① **口說短句字數超標（共 40 題）**：違反 `PLAN.md`「口說短句 4–8 字」硬性上限，多達 9～15 個單字（如 `normal[922]`、`normal[923]` 達 14 字，`boss[307]` 達 15 字），極易造成 Web Speech API 截斷或判定失敗；② **填空單字過短或僅 B1/B2 難度（共 7 題）**：如 `HAZE`（4 字母）、`BRIEF`（5 字母）、`DENIAL`、`RESIDENT`、`PRIORITY`、`ANTIQUE`、`DISCOMFORT`。 |
| **4. 英文自然度與繁中說明瑕疵** | 6 | 1 | **7** | ① 後段批次 `explain` 出現嚴重英文單字黏連（如 `comparableprice`、`interchangeableuse`、`hadarrived`、`wouldhavebeen`、`beforenote`、`overridesforoneturn`、`stillformulating`）與中英夾雜（`its必要性`）；② 聽力完整句 `speak` 漏句尾句號（`normal[810]`、`normal[812]`）；③ 中文 `desc` 誤譯（將 `the earlier scene` 譯為「前景」）。 |
| **5. 重複或近似模板題** | 22 | 17 | **39** | ① **同批內高度重複**：Batch 0、Batch 1 同批內連續以 `voice`、`spell`、`fill` 考同一單字（`CORROBORATION`、`EQUIVOCAL`、`PREREQUISITE`、`AMBIVALENCE`、`APPROPRIATION`、`CONCILIATORY`）；② **跨批次或跨牌組完全重複**：如 `CONCILIATORY`、`A TACIT UNDERSTANDING`、`CADENCE`、`RESONANT`、`DISSONANCE`、`MELANCHOLY`、`OBSOLESCENCE`、`CONJECTURE`、`RETROSPECTION`、`REVERBERATION`、`REVOCABLE`、`ORIENTATION`、`INTERMITTENT` 等在同題型重複出現。 |
| **合計** | **99** | **40** | **139** | — |

---

## 二、逐題問題明細表

### （一）`normal` 題庫問題明細（共 99 題）

| 所在陣列與索引 | 題目 `desc` 前 40 字 | 問題類型 | 說明 | 建議修正 |
|---|---|---|---|---|
| `normal[24]` | `請拼出：支持某說法或證詞的佐證（C 開頭，13 個字母）` | 5. 重複或近似模板題 | 與同批前 6 題 `normal[18]`（`voice`：`CORROBORATION`）考完全相同的單字，同批內先唸再拼造成直接洩題。 | 改考其他 C1 佐證／核實類名詞，如 `SUBSTANTIATION`（S 開頭，14 個字母）或 `VERIFICATION`。 |
| `normal[25]` | `填空題：C O R _ O B _ R A _ I O N (支持某說法的佐證)` | 5. 重複或近似模板題 | 與同批 `normal[18]`（`voice`）、`normal[24]`（`spell`）三度重複考 `CORROBORATION`，且 `desc` 與 `normal[24]` 幾乎相同。 | 改考其他 C1 學術名詞填空，如 `V E R _ S I _ I L I _ U D E`（`VERISIMILITUDE`，逼真性）。 |
| `normal[26]` | `請拼出：含糊而可作多種解讀的（E 開頭，9 個字母）` | 5. 重複或近似模板題 | 與同批 `normal[19]`（`voice`：`EQUIVOCAL`）及同主題 `boss[8]`（`fill`：`EQUIVOCAL`）三度重複同一單字。 | 改考 `AMBIGUOUS` 以外之 C1 近義詞，如 `ENIGMATIC`（E 開頭，9 個字母，高深莫測的）。 |
| `normal[28]` | `填空題：P R E _ E Q _ I S _ T E (某事發生前必備的先決條件)` | 5. 重複或近似模板題 | 與緊鄰上一題 `normal[27]`（`spell`：`PREREQUISITE`）連續兩題考完全相同的單字，且中文釋義一模一樣。 | 改考同主題 C1 名詞填空，如 `S T _ P U _ A T _ O N`（`STIPULATION`，契約或協議中的明文規定，ans `"I L I"`）。 |
| `normal[41]` | `【分詞構句】___ in considerable detail, the it` | 2. 干擾選項設計不良 | 干擾項 `B. Being plan`（be + 原形動詞）與 `C. Had been planning`（無主詞卻用過去完成進行式有限動詞）為明顯不合基礎文法的假英文。 | 將 B 改為 `Having planned`（主動完成分詞，測試主被動判斷）、C 改為 `Planning`（現在分詞干擾）。 |
| `normal[42]` | `【倒裝】No sooner ___ the revised opening ho` | 2. 干擾選項設計不良 | 干擾項 `A. has the shop announcing` 與 `B. did the shop announced` 為助動詞後接錯誤動詞形態的假英文，違反 `PLAN.md` 規範。 | 將 A 改為 `did the shop announce`（考 `No sooner` 搭配過去完成式 vs 一般過去式的時態差異）、B 改為 `the shop had announced`（未倒裝干擾）。 |
| `normal[54]` | `請拼出：對同一事物同時抱持矛盾感受的狀態（A 開頭，11 個字母）` | 5. 重複或近似模板題 | 與同批 `normal[48]`（`voice`：`AMBIVALENCE`）及下一題 `normal[55]`（`fill`：`AMBIVALENCE`）三度重複考同一單字。 | 改考其他 C1 心理狀態名詞，如 `EQUANIMITY`（E 開頭，10 個字母，平靜鎮定）。 |
| `normal[55]` | `填空題：A M B _ V A _ E _ C E (同時抱持矛盾感受的狀態)` | 5. 重複或近似模板題 | 與同批 `normal[48]`（`voice`）、`normal[54]`（`spell`）三度重複考 `AMBIVALENCE`。 | 改考 `D I S _ N C _ A N T _ E N T`（`DISENCHANTMENT`，幻滅／不再抱持幻想，ans `"E H M"`）。 |
| `normal[56]` | `請拼出：未經充分顧及脈絡而挪用他人文化或成果的行為（A 開頭，13 個字母）` | 5. 重複或近似模板題 | 與同批 `normal[49]`（`voice`：`APPROPRIATION`）及 `boss[18]`（`fill`：`APPROPRIATION`）三度重複考同一單字。 | 改考 `EXPROPRIATION`（E 開頭，13 個字母，徵用／剝奪）或 `MISAPPROPRIATION`。 |
| `normal[58]` | `填空題：C O N _ I L _ A T _ R Y (意在緩和對立、促進和解` | 5. 重複或近似模板題 | 與緊鄰上一題 `normal[57]`（`spell`：`CONCILIATORY`）連續兩題考同一單字且中文釋義完全相同。 | 改考 `M A G _ A N _ M O _ S`（`MAGNANIMOUS`，寬宏大量的，ans `"N I U"`）。 |
| `normal[70]` | `【分詞構句】___ of its original context, the r` | 2. 干擾選項設計不良 | 干擾項 `B. Having stripping` 與 `C. To have stripping`（`have` 後接現在分詞 `-ing`）屬於不存在的英文語法結構（假英文）。 | 將 B 改為 `Having stripped`（主動完成分詞）、C 改為 `Stripping`（主動現在分詞），聚焦主被動語態辨析。 |
| `normal[132]` | `【分詞構句】___ to reproduce a familiar proced` | 2. 干擾選項設計不良 | 干擾項 `A. Having training` 為假英文，`D. Have trained` 為無主詞原形動詞片語，不具 C1 鑑別度。 | 將 A 改為 `Having trained`（主動完成分詞）、D 改為 `Training`（主動現在分詞）。 |
| `normal[162]` | `【分詞構句】___ against the cheerful dialogue,` | 2. 干擾選項設計不良 | 干擾項 `A. Having set it` 多出受詞 `it` 造成雙受詞錯誤，`B. It sets` 無連接詞直接串接兩子句（comma splice）。 | 將 A 改為 `Having set`（主動完成分詞）、B 改為 `Setting`（主動現在分詞），測試主詞 `the sombre score` 與 `set` 的被動關係。 |
| `normal[192]` | `【分詞構句】___ on an assumption neither side ` | 2. 干擾選項設計不良 | 干擾項 `B. Have built` 與 `C. Having building` 為明顯假英文，C1 玩家無需理解句意即可刪去。 | 將 B 改為 `Having built`（主動完成分詞）、C 改為 `Building`（主動現在分詞）。 |
| `normal[210]` | `🎧 聽一聽，選出最符合說話者意思的解讀` | 4. 英文自然度與繁中說明瑕疵 | `explain` 欄位 `"misgiving 是不安疑慮，不是misgiving字面錯送禮。"` 中英夾雜未留空白，且「不是misgiving字面錯送禮」（拆字 `mis-giving`）表述生硬不自然。 | 改為 `"misgiving 指內心的疑慮或不安，而非字面拆解的『送錯禮物』。"`。 |
| `normal[221]` | `【文法】Had she been told about the change, ` | 2. 干擾選項設計不良 | 干擾項 `A. had been adjust`、`C. would adjusting`、`D. will have adjust` 全數為違反基礎助動詞規則的假英文，四選一中僅 `B. would have adjusted` 合乎基本英文語法。 | 將干擾項改為真實語法形式：`A. would adjust`、`C. had adjusted`、`D. will have adjusted`，真正測驗與過去事實相反的倒裝條件句時態搭配。 |
| `normal[238]` | `填空題：C A _ D _ U R (坦率表達真實看法的特性)` | 1. 答案唯一性／多解風險 | 採用英式拼法 `CANDOUR`（`ans: "NO"`），美式標準拼法為 `CANDOR`（無 `U`）；題幹直接印出 `U` 對習慣美式拼字的台灣學習者易生混淆。 | 建議改考英美拼法一致之同義 C1 單字 `F R _ N K _ E S S`（`FRANKNESS`）或 `F O R T H _ I G H T _ E S S`（`FORTHRIGHTNESS`），或於括號加註 `（英式拼法）`。 |
| `normal[251]` | `【文法】Only after the discrepancy was point` | 2. 干擾選項設計不良 | 干擾項 `A. had explained the agent why`（助動詞與過去分詞連搬）與 `B. the agent did explained why`（`did + explained`）為假英文。 | 將 A 改為 `had the agent explain why`、B 改為 `the agent explained why`（未倒裝之真實子句）。 |
| `normal[252]` | `【分詞構句】___ without the accompanying condi` | 2. 干擾選項設計不良 | 干擾項 `A. To have read it`（多代名詞 `it`）與 `D. Having reading`（`Having + V-ing` 假英文）設計不良。 | 將 A 改為 `Having read`、D 改為 `Reading`，測試 `the headline` 被閱讀的語態。 |
| `normal[281]` | `【倒裝】Only when the villagers challenged t` | 2. 干擾選項設計不良 | 干擾項 `B. had admitted the steward` 與 `C. the steward did admitted`（`did + V-ed`）為明顯假英文。 | 將 B 改為 `had the steward admit`、C 改為 `the steward had admitted`（未倒裝干擾）。 |
| `normal[282]` | `【分詞構句】___ as a temporary safeguard, the ` | 2. 干擾選項設計不良 | 干擾項 `A. Had introducing`（假英文）與 `B. Having introduced it`（多出 `it`）違反干擾項自然度原則。 | 將 A 改為 `Having introduced`、B 改為 `Introducing`。 |
| `normal[319]` | `請唸出單字：某物的來歷、出處或流傳紀錄` | 5. 重複或近似模板題 | 與 `normal[60]`（`listening`：`provenance`）重複考同一核心單字 `PROVENANCE`。 | 改考 `LINEAGE` 或 `GENEALOGY`（血統／源流）。 |
| `normal[323]` | `請唸出：個人情感依附不能決定品質判斷` | 3. 難度不符 C1 | `ans` `"PERSONAL ATTACHMENT DOES NOT SETTLE A JUDGEMENT OF QUALITY"` 含 **9 個單字**，超過 `PLAN.md` 口說短句 4–8 字上限；且 `JUDGEMENT` 採英式拼法（美式 `JUDGMENT` 語音辨識常不一致）。 | 縮減至 7 字並避開拼字變體，例如 `"ATTACHMENT DOES NOT SETTLE QUESTIONS OF QUALITY"`。 |
| `normal[328]` | `填空題：S A _ O _ R (慢慢品味而充分享受)` | 1. 答案唯一性／多解風險 | 採用英式拼法 `SAVOUR`（`ans: "VU"`），挖空處正好包含英美差異字母 `U`（美式拼法為 `SAVOR`），會導致美式拼法玩家無法作答。 | 改考英美拼法一致的 C1 品味／鑑賞動詞 `R E _ I _ H`（`RELISH`，ans `"LS"`）或於題幹明確標註 `（英式拼法）`。 |
| `normal[349]` | `請唸出單字：支持某說法的獨立佐證` | 5. 重複或近似模板題 | `ans: "CORROBORATION"` 與 `normal[18]`（同為 `normal` 牌組 `voice` 題 `CORROBORATION`）、`normal[24]`、`normal[25]`、`normal[333]` 第五度重複！ | 改考 `ATTESTATION`（證言／證實）或 `AUTHENTICATION`。 |
| `normal[353]` | `請唸出：表面邊界可能只反映觀察者看過哪裡` | 3. 難度不符 C1 | `ans` `"THE APPARENT BOUNDARY MAY REFLECT WHERE OBSERVERS HAVE LOOKED"` 含 **9 個單字**，超過 `PLAN.md` 口說短句 4–8 字上限。 | 精簡為 7 字：`"APPARENT BOUNDARIES MAY REFLECT WHERE OBSERVERS LOOKED"`。 |
| `normal[357]` | `填空題：R E S I _ E N T (在某地長期居住或常駐的)` | 3. 難度不符 C1 | `RESIDENT` 為 B1/B2 基礎單字，且僅挖空 1 個字母 `D`，不符 C1 詞彙難度。 | 改考 C1 同主題詞彙，如 `S E D _ N T _ R Y`（`SEDENTARY`，定居的／久坐的，ans `"EA"`）。 |
| `normal[372]` | `【文法】He insisted on ___ as a beginner rat` | 2. 干擾選項設計不良 | 干擾項 `A. having treat`、`C. treating him`、`D. be treated` 皆違反基礎語法（假英文或介系詞後接原形），毫無 C1 鑑別度。 | 將干擾項改為 `A. treating`、`C. to be treated`、`D. having treated`。 |
| `normal[383]` | `請唸出：好的決定仍可能帶來不幸結果` | 3. 難度不符 C1 | `ans` `"A GOOD DECISION CAN STILL HAVE AN UNFORTUNATE OUTCOME"` 含 **9 個單字**，超過 `PLAN.md` 口說短句 4–8 字上限。 | 精簡為 7 字：`"SOUND DECISIONS CAN STILL PRODUCE UNFORTUNATE OUTCOMES"`。 |
| `normal[390]` | `🎧 聽一聽，選出最符合說話者意思的解讀` | 5. 重複或近似模板題 | `speak: "a qualified endorsement"` 與 `normal[20]`（`voice`：`A QUALIFIED ENDORSEMENT`）考完全相同的片語與釋義。 | 改考 `"a lukewarm reception"`（反應冷淡／不熱烈的接待）或 `"a guarded response"`。 |
| `normal[400]` | `【文法】The editor requested that the qualif` | 2. 干擾選項設計不良 | 干擾項 `A. is retain`、`B. had retaining`、`D. was retaining` 全為假英文或主動進行式，無法有效測驗要求動詞 `requested that` 的假設語氣。 | 改為真實干擾項：`A. is retained`、`B. was retained`、`D. be retaining`。 |
| `normal[402]` | `【文法】The reporter denied ___ the quotatio` | 2. 干擾選項設計不良 | 干擾項 `A. had taken`（無主詞有限動詞）與 `B. have taking`（假英文）設計粗糙。 | 改為 `A. to have taken`、`B. to take`、`D. having been taken`。 |
| `normal[410]` | `請唸出：不言而喻的默契` | 5. 重複或近似模板題 | `ans: "A TACIT UNDERSTANDING"` 與 `normal[230]`（`請唸出：彼此心照不宣的默契`，`ans: "A TACIT UNDERSTANDING"`）同牌組同題型完全重複！ | 改考 `"AN UNSPOKEN CONSENSUS"`（不言而喻的共識）。 |
| `normal[412]` | `請唸出：否認針對簽名而非授權` | 1. 答案唯一性／多解風險 | `ans` `"THE DENIAL ADDRESSES THE SIGNATURE RATHER THAN THE AUTHORISATION"` 含英式拼法 `AUTHORISATION`（美式語音辨識多輸出 `AUTHORIZATION`），且長達 **9 個單字**超過 4–8 字上限。 | 縮短為 7 字並改用英美同形詞：`"THE DENIAL CONCERNS SIGNATURES RATHER THAN AUTHORITY"`。 |
| `normal[417]` | `填空題：D E N _ A L (聲稱某事不屬實或與己無關的否認)` | 3. 難度不符 C1 | `DENIAL` 為 B2 基礎 6 字母單字且僅挖空 `I`，與同批 `normal[402]`、`normal[412]` 重複度高且過於簡單。 | 改考 C1 近義詞 `R E P _ D I _ T I O N`（`REPUDIATION`，否認／駁斥，ans `"UA"`）。 |
| `normal[442]` | `請唸出：實際彈性取決於使用者真能改什麼` | 3. 難度不符 C1 | `ans` `"PRACTICAL FLEXIBILITY DEPENDS ON WHAT USERS CAN ACTUALLY CHANGE"` 含 **9 個單字**，超過 `PLAN.md` 口說短句 4–8 字上限。 | 精簡為 8 字：`"PRACTICAL FLEXIBILITY DEPENDS ON WHAT USERS CAN CHANGE"`。 |
| `normal[460]` | `【文法】The organiser proposed ___ the final` | 2. 干擾選項設計不良 | 干擾項 `B. to making`、`C. make it`、`D. that making` 皆為不合語法的假英文結構，且 `propose + V-ing` 僅 B1/B2 難度。 | 改為 `B. to make`、`C. having made`、`D. to be making`（或改考 `proposed that the final session be made optional`）。 |
| `normal[462]` | `【文法】Had the availability survey been cir` | 2. 干擾選項設計不良 | 干擾項 `C. had avoiding`（假英文）與 `D. might avoid yesterday`（時態與時間副詞矛盾）破綻過大。 | 將 C 改為 `might avoid`、D 改為 `would avoid`。 |
| `normal[472]` | `請唸出：相同簡報未必讓人準備好不同角色` | 3. 難度不符 C1 | `ans` `"IDENTICAL BRIEFINGS MAY NOT PREPARE PEOPLE FOR DIFFERENT ROLES"` 含 **9 個單字**，超過 `PLAN.md` 口說短句 4–8 字上限。 | 精簡為 8 字：`"IDENTICAL BRIEFINGS CANNOT PREPARE PEOPLE FOR DIFFERENT ROLES"`。 |
| `normal[473]` | `請唸出：救援成功不等於證明原計畫正確` | 3. 難度不符 C1 | `ans` `"A SUCCESSFUL RESCUE DOES NOT VINDICATE THE ORIGINAL PLAN"` 含 **9 個單字**，超過 `PLAN.md` 口說短句 4–8 字上限。 | 精簡為 7 字：`"SUCCESSFUL RESCUES DO NOT VINDICATE ORIGINAL PLANS"`。 |
| `normal[477]` | `填空題：B R _ E F (對任務目的與要求的指示)` | 3. 難度不符 C1 | `BRIEF` 僅 5 個字母且僅挖空 1 字 `I`，遠低於 C1 拼寫難度要求。 | 改考 C1 同主題詞彙 `D I R _ C T _ V E`（`DIRECTIVE`，指令／指示，ans `"EI"`）。 |
| `normal[479]` | `填空題：A C K _ O W L _ D G E _ E N T (對協助或貢` | 1. 答案唯一性／多解風險 | 採用英式拼法 `ACKNOWLEDGEMENT`（含 `G E M`），美式常見拼法為 `ACKNOWLEDGMENT`（省去中間 `E`）；雖本題 `E` 已印在題幹上，仍易讓美式拼字學習者對字形產生疑惑。 | 建議於括號註明 `（英式拼法）` 或改考 `C O M M _ N D _ T _ O N`（`COMMENDATION`，表彰／嘉獎，ans `"EAI"`）。 |
| `normal[490]` | `【文法】The portrait is thought ___ before t` | 2. 干擾選項設計不良 | 干擾項 `A. that it painted`、`C. to have painting`、`D. having been paint` 全為假英文，四選一僅 `B. to have been painted` 合乎基本語法。 | 將干擾項改為真實不定詞結構：`A. to be painted`、`C. to have painted`、`D. being painted`。 |
| `normal[500]` | `請唸出：事後回看時的理想化` | 1. 答案唯一性／多解風險 | `ans` `"A RETROSPECTIVE IDEALISATION"` 採英式 `-ISATION`，瀏覽器語音辨識（預設 `en-US`）極易轉寫為美式 `"A RETROSPECTIVE IDEALIZATION"` 導致誤判。 | 改為英美拼法一致之片語，如 `"A RETROSPECTIVE RECONSTRUCTION"`（事後回看的重構）。 |
| `normal[502]` | `請唸出：真誠記憶也可能隨時間改變重點` | 3. 難度不符 C1 | `ans` `"A SINCERE MEMORY MAY CHANGE ITS EMPHASIS OVER TIME"` 含 **9 個單字**，超過 `PLAN.md` 口說短句 4–8 字上限。 | 精簡為 8 字：`"SINCERE MEMORIES MAY CHANGE THEIR EMPHASIS OVER TIME"`。 |
| `normal[507]` | `填空題：C A T A _ O G U E (有系統列舉收藏或項目的目錄)` | 1. 答案唯一性／多解風險 | 題幹採用英式拼法 `CATALOGUE`（美式為 `CATALOG`），且僅挖空 `L` 過於簡單。 | 改考英美拼法一致且具 C1 難度之詞彙 `R E P _ R T _ R Y`（`REPERTORY`）或 `I N V _ N T _ R Y`（`INVENTORY`）。 |
| `normal[529]` | `請唸出：面對情況仍鎮定自持的能力` | 1. 答案唯一性／多解風險 | `ans` `"SELF POSSESSION"` 在標準英文詞典中為連字號複合詞 `self-possession`，且僅 2 字既非單一單字（未標「請唸出單字」）亦未達 4–8 字短句規範。 | 改為單字題 `"COMPOSURE"` 或 `"EQUANIMITY"`，或擴充為 4 字名詞片語 `"REMARKABLE SELF POSSESSION UNDER PRESSURE"`。 |
| `normal[532]` | `請唸出：有禮回應未必等於內心信服` | 3. 難度不符 C1 | `ans` `"A COURTEOUS RESPONSE NEED NOT AMOUNT TO INWARD CONVICTION"` 含 **9 個單字**，超過 `PLAN.md` 口說短句 4–8 字上限。 | 精簡為 7 字：`"COURTEOUS RESPONSES NEED NOT IMPLY INWARD CONVICTION"`。 |
| `normal[533]` | `請唸出：敘事者把自己的主動寫成勉強介入` | 3. 難度不符 C1 | `ans` `"THE NARRATOR PRESENTS HIS OWN INITIATIVE AS RELUCTANT INVOLVEMENT"` 含 **9 個單字**，超過 `PLAN.md` 口說短句 4–8 字上限。 | 精簡為 7 字：`"HE PRESENTS HIS INITIATIVE AS RELUCTANT INVOLVEMENT"`。 |
| `normal[550]` | `【文法】The result will depend on how accura` | 2. 干擾選項設計不良 | 干擾項 `A. is`、`B. have`、`C. being` 與複數主詞 `measurements` 及過去分詞 `taken` 搭配時破綻過大，僅 B1 被動語態難度。 | 升級為 C1 名詞子句／倒裝或改干擾項為 `were`、`had been`、`will have been` 等時態辨析。 |
| `normal[552]` | `【文法】The pattern is designed so that eith` | 2. 干擾選項設計不良 | 空格後接原形動詞 `serve`，干擾項 `A. are`、`B. have`、`C. were` 接原形動詞皆為明顯假英文，僅 `D. can` 可接原形。 | 將題幹 `serve` 納入選項變化，例如 `A. are serving`、`B. have served`、`C. were serving`、`D. can serve`（或考 `either ... serves` 主詞動詞一致）。 |
| `normal[562]` | `請唸出：精確不保證參照點本身正確` | 3. 難度不符 C1 | `ans` `"PRECISION DOES NOT GUARANTEE THAT THE REFERENCE POINT IS CORRECT"` 長達 **10 個單字**，超過 `PLAN.md` 口說短句 4–8 字上限。 | 精簡為 7 字：`"PRECISION DOES NOT GUARANTEE A CORRECT REFERENCE"`。 |
| `normal[563]` | `請唸出：示意圖不必規定固定停止次數` | 3. 難度不符 C1 | `ans` `"AN ILLUSTRATION NEED NOT SPECIFY A FIXED STOPPING COUNT"` 含 **9 個單字**，超過 `PLAN.md` 口說短句 4–8 字上限。 | 精簡為 7 字：`"ILLUSTRATIONS NEED NOT SPECIFY FIXED STOPPING COUNTS"`。 |
| `normal[580]` | `【文法】The information should be placed whe` | 2. 干擾選項設計不良 | 干擾項 `B. having`、`C. are have`、`D. had being` 全為明顯假英文，不符 C1 命題水準。 | 改為真實動詞形態干擾項：`B. had`、`C. are having`、`D. will have had`。 |
| `normal[582]` | `【文法】Not until visitors reach the junctio` | 2. 干擾選項設計不良 | 干擾項 `C. becomes the sign does` 與 `D. the sign does becomes` 為荒謬假英文，僅 A/B 具干擾作用。 | 將 C 改為 `did the sign become`（時態干擾）、D 改為 `has the sign become`。 |
| `normal[592]` | `請唸出：物理上能進入不保證感覺受歡迎` | 3. 難度不符 C1 | `ans` `"PHYSICAL ENTRY DOES NOT GUARANTEE A SENSE OF WELCOME"` 含 **9 個單字**，超過 `PLAN.md` 口說短句 4–8 字上限。 | 精簡為 6 字：`"PHYSICAL ACCESS DOES NOT GUARANTEE WELCOME"`。 |
| `normal[593]` | `請唸出：同一路線可對不同使用者造成不同負擔` | 3. 難度不符 C1 | `ans` `"THE SAME ROUTE CAN IMPOSE DIFFERENT DEMANDS ON DIFFERENT USERS"` 長達 **10 個單字**，超過 `PLAN.md` 口說短句 4–8 字上限。 | 精簡為 8 字：`"IDENTICAL ROUTES CAN IMPOSE DIFFERENT DEMANDS ON USERS"`。 |
| `normal[618]` | `請唸出單字：細微但重要的意義或語氣差別` | 5. 重複或近似模板題 | `ans: "NUANCE"` 與 `normal[177]`（`fill`：`NUANCE`）及 `boss[203]`（`reading`：`A nuance is ___.`）三度重複考同一單字。 | 改考 `SUBTLETY` 或 `INFLECTION`。 |
| `normal[627]` | `填空題：S U _ T E _ T (話語表面下未明說的潛台詞)` | 5. 重複或近似模板題 | `ans: "BX"`（`SUBTEXT`）與 `normal[150]`（`listening`：`subtext`）重複考同一核心單字與釋義。 | 改考 `U N D _ R C U _ R E N T`（`UNDERCURRENT`，潛流／暗流，ans `"ER"`）。 |
| `normal[640]` | `【文法】I would appreciate ___ informed if t` | 2. 干擾選項設計不良 | 干擾項 `A. be`、`B. been` 在及物動詞 `appreciate` 後屬於明顯假英文，且難度僅 B2。 | 將 A 改為 `to be`、B 改為 `having`、C 改為 `to have been`。 |
| `normal[642]` | `【文法】If convenient, I ___ grateful if you` | 2. 干擾選項設計不良 | 干擾項 `A. am been` 與 `B. will having` 為完全違反基礎英文文法的假英文。 | 改為 `A. will be`、`B. had been`、`C. would have been`。 |
| `normal[653]` | `請唸出：溫暖結語不必解決實際問題` | 3. 難度不符 C1 | `ans` `"A WARM CLOSING NEED NOT SETTLE A PRACTICAL QUESTION"` 含 **9 個單字**，超過 `PLAN.md` 口說短句 4–8 字上限。 | 精簡為 7 字：`"WARM CLOSINGS NEED NOT SETTLE PRACTICAL QUESTIONS"`。 |
| `normal[654]` | `請拼出：意在緩和不滿或促進和解的（C 開頭，12 個字母）` | 5. 重複或近似模板題 | `ans: "CONCILIATORY"` 與 `normal[57]`（同為 `normal` 牌組 `spell` 題：`CONCILIATORY`）及 `normal[58]`（`fill`）**完全重複**！ | 改考 `PROPITIATORY`（P 開頭，12 個字母，意在撫慰或討好的）或 `APPEASING`。 |
| `normal[670]` | `【文法】The valley lay below us, its cottage` | 2. 干擾選項設計不良 | 干擾項 `C. were reduce`（`be + 原形`）為明顯假英文。 | 將 C 改為 `were reduced`（測試無連接詞時獨立分詞構句 `reduced` vs 有限動詞 `were reduced` 的差異）。 |
| `normal[672]` | `【文法】Only after the wind dropped ___ how ` | 2. 干擾選項設計不良 | 干擾項 `B. had realised we` 與 `C. we did realised` 為明顯假英文。 | 將 B 改為 `had we realised`（過去完成倒裝干擾）、C 改為 `we had realised`。 |
| `normal[687]` | `填空題：H A _ E (使遠景不清楚的薄霧或濛氣)` | 3. 難度不符 C1 | `HAZE` 僅 4 個字母且僅挖空 `Z`，遠低於 C1 拼寫與詞彙要求。 | 改考 C1 視覺／大氣現象詞彙，如 `L U M _ N E S _ E N C E`（`LUMINESCENCE`）或 `O P _ C I _ Y`（`OPACITY`）。 |
| `normal[699]` | `【語意】The two bags are comparable in price` | 4. 英文自然度與繁中說明瑕疵 | `explain` 欄位 `"comparableprice與interchangeableuse兩種比較尺度不同。"` 出現嚴重英文單字黏連（`comparableprice`、`interchangeableuse`）且中英未留空白。 | 改為 `"comparable in price（價格相近）與 interchangeable in use（用途可互換）屬於兩種不同的比較尺度。"`。 |
| `normal[700]` | `【文法】The assistant suggested ___ the smal` | 2. 干擾選項設計不良 | 干擾項 `B. to trying`、`C. try it`、`D. that trying` 全為假英文，且 `suggest + V-ing` 僅 B1 難度。 | 改考 C1 假設語氣或將干擾項改為 `B. to try`、`C. having tried`、`D. to be trying`。 |
| `normal[713]` | `請唸出：備件只有合於相關版本才有用` | 3. 難度不符 C1 | `ans` `"A SPARE IS USEFUL ONLY WHEN IT FITS THE RELEVANT VERSION"` 長達 **11 個單字**，嚴重超過 `PLAN.md` 口說短句 4–8 字上限。 | 精簡為 8 字：`"SPARES ARE USEFUL ONLY WHEN THEY FIT VERSIONS"` 或 `"A SPARE HELPS ONLY IF IT FITS"`（7 字）。 |
| `normal[730]` | `【文法】The note suggests that whoever left ` | 2. 干擾選項設計不良 | 干擾項 `A. intend yesterday`（複數原形動詞搭配單數 `whoever` 與 `yesterday`）為粗糙假英文，且 `explain` `"left過去，intend內容為當時打算故用intended。"` 中英黏連。 | 將 A 改為 `has intended` 或 `would intend`，並修正 `explain` 空白與表述。 |
| `normal[732]` | `【文法】Had the note arrived before the parc` | 2. 干擾選項設計不良 | 干擾項 `A. would to be`、`C. will have being`、`D. had been to` 全為假英文；且 `explain` `"過去反事實hadarrived對wouldhavebeen。"` 英文單字完全黏連（`hadarrived`、`wouldhavebeen`）。 | 將干擾項改為 `A. would be`、`C. will have been`、`D. had been`，並將 `explain` 改為 `"與過去事實相反的倒裝條件句：Had ... arrived 搭配主句 would have been。"`。 |
| `normal[737]` | `【短文】The witness says she knew the lock w` | 4. 英文自然度與繁中說明瑕疵 | `explain` 欄位 `"焦點在beforenote知識來源時序，不是否認最終知道。"` 出現英文單字黏連（`beforenote`）且語句生硬。 | 改為 `"焦點在於看到字條前（before she saw the note）就已知情的時序與來源，而非否認她最終知道此事。"`。 |
| `normal[742]` | `請唸出：更正一項細節不必撤回整份說法` | 3. 難度不符 C1 | `ans` `"A CORRECTED DETAIL NEED NOT WITHDRAW THE ENTIRE ACCOUNT"` 含 **9 個單字**，超過 `PLAN.md` 口說短句 4–8 字上限。 | 精簡為 7 字：`"CORRECTING ONE DETAIL NEED NOT INVALIDATE ACCOUNTS"`。 |
| `normal[749]` | `填空題：P R _ O _ I _ Y (在時間或重要性上居先的地位)` | 3. 難度不符 C1 | `PRIORITY` 為 B1/B2 常見基礎詞彙，不符 C1 `difficulty: 3` 定位。 | 改考 C1 近義詞 `P R E _ E D _ N _ E`（`PRECEDENCE`，優先地位，ans `"CEC"`）。 |
| `normal[762]` | `【文法】Either the cards or the rulebook ___` | 2. 干擾選項設計不良 | 干擾項 `A. are being`、`B. be`、`D. have` 語法破碎，且 `either ... or ...` 就近一致僅 B1/B2 基礎文法。 | 將干擾項改為 `A. are`、`B. were`、`D. have been`（若題幹補充現在語境標記），或提升為 C1 複雜主詞一致句型。 |
| `normal[763]` | `【範圍】The special card overrides the norma` | 4. 英文自然度與繁中說明瑕疵 | `explain` 欄位 `"overridesforoneturn優先僅本輪，非永久刪除。"` 將四個英文單字完全黏連成 `"overridesforoneturn"`。 | 改為 `"overrides ... for one turn only 表示僅在該回合優先適用，並非永久廢除原本的出牌順序。"`。 |
| `normal[772]` | `請唸出：戰術撤退不必放棄整體策略` | 3. 難度不符 C1 | `ans` `"A TACTICAL RETREAT NEED NOT ABANDON THE BROADER STRATEGY"` 含 **9 個單字**，超過 `PLAN.md` 口說短句 4–8 字上限。 | 精簡為 7 字：`"TACTICAL RETREATS NEED NOT ABANDON BROADER STRATEGIES"`。 |
| `normal[773]` | `請唸出：例外適用一步而非持有期間全程` | 3. 難度不符 C1 | `ans` `"THE EXCEPTION APPLIES TO ONE MOVE RATHER THAN CONTINUOUS POSSESSION"` 長達 **10 個單字**，超過 `PLAN.md` 口說短句 4–8 字上限。 | 精簡為 8 字：`"EXCEPTIONS APPLY TO SINGLE MOVES NOT CONTINUOUS POSSESSION"`。 |
| `normal[790]` | `【文法】The interviewer avoided ___ a prefer` | 2. 干擾選項設計不良 | 干擾項 `A. to suggesting`、`C. that suggesting` 為假英文，且 `avoid + V-ing` 屬於 A2/B1 初級文法，不符 C1 難度。 | 建議改考 C1 句型（如 `scrupulously refrained from ___` 搭配完成動名詞或複雜補語），並移除假英文干擾項。 |
| `normal[792]` | `【文法】The account includes events ___ sign` | 2. 干擾選項設計不良 | 干擾項 `A. which their` 與 `C. that of` 在關係子句開頭明顯不合語法。 | 將 A 改為 `of which`、C 改為 `that`、D 改為 `whom`，測驗所有格關係代名詞 `whose` 與 `of which the` 的結構區別。 |
| `normal[802]` | `請唸出：流暢故事可能反映多年重述` | 3. 難度不符 C1 | `ans` `"A FLUENT STORY MAY REFLECT YEARS OF REPEATED TELLING"` 含 **9 個單字**，超過 `PLAN.md` 口說短句 4–8 字上限。 | 精簡為 7 字：`"FLUENT STORIES MAY REFLECT YEARS OF RETELLING"`。 |
| `normal[803]` | `請唸出：對順序有把握不代表對年份有把握` | 3. 難度不符 C1 | `ans` `"CONFIDENCE IN SEQUENCE NEED NOT IMPLY CONFIDENCE IN DATES"` 含 **9 個單字**，超過 `PLAN.md` 口說短句 4–8 字上限。 | 精簡為 7 字：`"CONFIDENCE IN SEQUENCE NEVER GUARANTEES ACCURATE DATES"`。 |
| `normal[810]` | `🎧 聽一聽，選出最符合說話者意思的解讀` | 5. 重複或近似模板題 | `speak: "Her answer was preceded by a pregnant pause"` 與 `normal[511]`（`speak: "a pregnant pause"`）考完全相同的核心片語與語意，且完整句結尾漏句點 `.`。 | 改考其他聲音／停頓修辭片語（如 `"Her reply trailed off into an awkward silence."`）並補上句點。 |
| `normal[812]` | `🎧 聽一聽，選出最符合說話者意思的解讀` | 5. 重複或近似模板題 | `speak: "The ending gains its force from an understated delivery"` 與 `normal[600]`（`speak: "an understated delivery"`）考相同核心片語，且完整句結尾漏句點 `.`。 | 改考 `"The closing line lands all the harder for being spoken barely above a whisper."` 並補上句點。 |
| `normal[817]` | `🎧 聽一聽，選出最符合說話者意思的解讀` | 4. 英文自然度與繁中說明瑕疵 | `explain` 欄位 `"not…endorsement否定將沉默等同支持，stillformulating說明沉默原因。"` 出現英文黏字 `"stillformulating"` 且中英未留空白。 | 改為 `"not ... an endorsement 否定將沉默等同於支持，still formulating a reply 則說明沉默是因為仍在構思回應。"`。 |
| `normal[821]` | `【文法】Not until the ventilation stopped __` | 2. 干擾選項設計不良 | 干擾項 `A. we did realised`（`did + V-ed`）與 `D. had we realise`（`had + 原形`）為明顯假英文。 | 將 A 改為 `we had realised`（未倒裝）、D 改為 `had we realised`（過去完成倒裝干擾）。 |
| `normal[829]` | `請唸出單字：說話時聲音升降與節奏的起伏` | 5. 重複或近似模板題 | `ans: "CADENCE"` 與 `normal[619]`（同為 `normal` 牌組 `voice` 題：`CADENCE`）**完全重複**！ | 改考 `"TIMBRE"`（音色／嗓音特質）或 `"SONORITY"`（共鳴／宏亮）。 |
| `normal[832]` | `請唸出：聽得見的遲疑不必然代表缺乏信念` | 3. 難度不符 C1 | `ans` `"AUDIBLE HESITATION NEED NOT INDICATE A LACK OF CONVICTION"` 含 **9 個單字**，超過 `PLAN.md` 口說短句 4–8 字上限。 | 精簡為 7 字：`"AUDIBLE HESITATION NEED NOT INDICATE WEAK CONVICTION"`。 |
| `normal[833]` | `請唸出：刪去重疊發言可能遮蔽討論互動` | 3. 難度不符 C1 | `ans` `"REMOVING OVERLAP CAN OBSCURE THE DYNAMICS OF A DISCUSSION"` 含 **9 個單字**，超過 `PLAN.md` 口說短句 4–8 字上限。 | 精簡為 7 字：`"REMOVING OVERLAP CAN OBSCURE DISCUSSION DYNAMICS"`。 |
| `normal[834]` | `請拼出：聲音深沉響亮且有共鳴的（R 開頭，8 個字母）` | 5. 重複或近似模板題 | `ans: "RESONANT"` 與 `normal[625]`（同為 `normal` 牌組 `spell` 題：`RESONANT`）**完全重複**！ | 改考 `"SONOROUS"`（S 開頭，8 個字母，聲音渾厚宏亮的）。 |
| `normal[835]` | `請拼出：不和諧或彼此衝突的狀態（D 開頭，10 個字母）` | 5. 重複或近似模板題 | `ans: "DISSONANCE"` 與 `normal[176]`（同為 `normal` 牌組 `spell` 題：`DISSONANCE`）**完全重複**！ | 改考 `"CACOPHONY"`（C 開頭，9 個字母，刺耳雜音）或 `"DISCORDANCE"`（D 開頭，11 個字母）。 |
| `normal[854]` | `【文法】We agreed to the trial on the unders` | 2. 干擾選項設計不良 | 干擾項 `A. will have reviewing`、`B. had been review`、`C. would reviewing` **三個干擾項全數為明顯假英文**，四選一僅 `D. would be reviewed` 合乎基礎英文文法！ | 將干擾項改為真實語法結構：`A. will be reviewed`、`B. had been reviewed`、`C. would review`。 |
| `normal[863]` | `請唸出：試行必須容許改變方向的可能` | 3. 難度不符 C1 | `ans` `"A TRIAL MUST ALLOW THE POSSIBILITY OF CHANGING COURSE"` 含 **9 個單字**，超過 `PLAN.md` 口說短句 4–8 字上限。 | 精簡為 7 字：`"TRIALS MUST ALLOW THE POSSIBILITY OF REVISION"`。 |
| `normal[888]` | `請唸出單字：不容易引人注意的` | 5. 重複或近似模板題 | `ans: "INCONSPICUOUS"` 與 `normal[535]`（`spell`：`INCONSPICUOUS`）、同批 `normal[879]`（`reading`：`An inconspicuous outfit...`）及 `boss[173]` 四度重複。 | 改考 `"SELF-EFFACING"` 或 `"UNOBTRUSIVE"` 以外之 C1 低調詞彙如 `"SUBDUED"`。 |
| `normal[892]` | `請唸出：制服未必揭示穿戴者內心的效忠` | 3. 難度不符 C1 | `ans` `"A UNIFORM NEED NOT REVEAL THE WEARER'S PRIVATE ALLEGIANCE"` 含 **9 個單字**（且含所有格撇號 `WEARER'S`），超過 `PLAN.md` 口說短句 4–8 字上限。 | 精簡為 7 字並避開撇號：`"UNIFORMS NEED NOT REVEAL PRIVATE ALLEGIANCE"`。 |
| `normal[896]` | `請拼出：與周圍情境不協調而顯得突兀的（I 開頭，11 個字母）` | 5. 重複或近似模板題 | `ans: "INCONGRUOUS"` 與 `normal[229]`（`voice`：`INCONGRUOUS`）重複考同一單字。 | 改考 `"DISCORDANT"`（D 開頭，10 個字母，不協調的）或 `"JARRING"`。 |
| `normal[907]` | `🎧 聽一聽，選出最符合說話者意思的解讀` | 4. 英文自然度與繁中說明瑕疵 | `explain` 欄位 `"not an afterthought反對把替代路線視為事後附加；its必要性由停梯條件說明。"` 將中文「它的必要性」寫成中英夾雜的 `"its必要性"`。 | 改為 `"not an afterthought 反對把替代路線視為事後附加的想法；其必要性由電梯停用時的條件加以說明。"`。 |
| `normal[922]` | `請唸出：這張圖預設了新來者不應被要求具備的熟悉程度。` | 3. 難度不符 C1 | `ans` `"THE MAP ASSUMES A LEVEL OF FAMILIARITY THAT NEWCOMERS CANNOT BE EXPECTED TO HAVE"` 高達 **14 個單字**，嚴重違反 `PLAN.md` 口說短句 4–8 字上限；且 `desc` 結尾多了句號 `。` 與全庫體例不一。 | 精簡為 7 字並移除 `desc` 句尾句號：`"THE MAP ASSUMES UNREASONABLE FAMILIARITY FROM NEWCOMERS"`。 |
| `normal[923]` | `請唸出：若清楚的標籤出現在決定路線之後，用處就很有限。` | 3. 難度不符 C1 | `ans` `"A CLEAR LABEL IS OF LITTLE USE IF IT APPEARS AFTER THE DECISION POINT"` 高達 **14 個單字**，嚴重違反 `PLAN.md` 口說短句 4–8 字上限；且 `desc` 結尾多了句號 `。`。 | 精簡為 8 字並移除 `desc` 句尾句號：`"CLEAR LABELS HELP LITTLE AFTER THE DECISION POINT"`。 |

---

### （二）`boss` 題庫問題明細（共 40 題）

| 所在陣列與索引 | 題目 `desc` 前 40 字 | 問題類型 | 說明 | 建議修正 |
|---|---|---|---|---|
| `boss[3]` | `【文法】___ the potential risks, the team de` | 2. 干擾選項設計不良 | 干擾項 `A. Have assessed`（無主詞原形）、`B. Having been assess`（`been + 原形` 假英文）、`C. Had assessing`（`Had + V-ing` 假英文）全數違反基礎文法，四選一僅 `D. Having assessed` 為真英文。 | 將干擾項改為真實分詞結構：`A. Assessing`、`B. Having been assessed`、`C. Assessed`，測驗主動完成分詞構句與被動分詞之辨析。 |
| `boss[8]` | `填空題：E Q U _ V _ C _ L (含糊而可作多種解讀的)` | 5. 重複或近似模板題 | `ans: "IOA"`（`EQUIVOCAL`）與 `normal[19]`（`voice`）及 `normal[26]`（`spell`）三度重複考同一單字。 | 改考 `O R _ C U _ A R`（`ORACULAR`，晦澀難解／似神諭的，ans `"AL"`）或 `E V _ S _ V E`（`EVASIVE`）。 |
| `boss[18]` | `填空題：A P P R _ P R _ A T _ O N (未充分顧及脈絡而挪` | 5. 重複或近似模板題 | `ans: "OII"`（`APPROPRIATION`）與 `normal[49]`（`voice`）及 `normal[56]`（`spell`）三度重複考同一單字。 | 改考 `U S _ R P _ T _ O N`（`USURPATION`，篡奪／侵占，ans `"UAI"`）。 |
| `boss[66]` | `請唸出：推廣結論的適用界線` | 1. 答案唯一性／多解風險 | `ans` `"THE LIMITS OF GENERALISATION"` 採用英式拼法 `GENERALISATION`，瀏覽器預設美式英語（`en-US`）語音辨識常輸出 `GENERALIZATION` 而造成比對失敗風險。 | 改為英美拼法一致之片語 `"THE LIMITS OF EXTRAPOLATION"` 或 `"THE BOUNDARIES OF GENERAL INFERENCE"`。 |
| `boss[79]` | `填空題：R E _ I C E _ C E (不願輕易多談自身看法的保留)` | 5. 重複或近似模板題 | `ans: "TN"`（`RETICENCE`）與 `normal[528]`（`voice`：`RETICENCE`）重複考同一單字。 | 改考 `T A C _ T U R _ I T Y`（`TACITURNITY`，沉默寡言，ans `"IN"`）。 |
| `boss[109]` | `填空題：R _ M _ T (某職位或機構正式負責的職權範圍)` | 5. 重複或近似模板題 | `ans: "EI"`（`REMIT`）僅 5 個字母，且與 `normal[469]`（`voice`：`REMIT`）重複考同一單字與釋義。 | 改考 `J U R _ S D _ C T _ O N`（`JURISDICTION`，管轄權／職權範圍，ans `"III"`）。 |
| `boss[113]` | `【文法】We need not have carried the heavy g` | 2. 干擾選項設計不良 | 干擾項 `A. was been available`、`B. had available`、`D. has being available` **三個干擾項全為明顯假英文**，四選一僅 `C. was available` 合乎基本英文語法！ | 將干擾項改為真實時態形式：`A. has been available`、`B. would be available`、`D. will be available`。 |
| `boss[117]` | `請唸出：可比紀錄需要注意觀察如何做成` | 3. 難度不符 C1 | `ans` `"COMPARABLE RECORDS REQUIRE ATTENTION TO HOW OBSERVATIONS WERE MADE"` 含 **9 個單字**，超過 `PLAN.md` 口說短句 4–8 字上限。 | 精簡為 7 字：`"COMPARABLE RECORDS REQUIRE CONSISTENT METHODS OF OBSERVATION"`。 |
| `boss[118]` | `請拼出：斷斷續續而非持續不斷的（I 開頭，12 個字母）` | 5. 重複或近似模板題 | `ans: "INTERMITTENT"` 與 `normal[836]`（同為 `spell` 題：`INTERMITTENT`）**完全重複**！ | 改考 `"SPORADIC"`（S 開頭，8 個字母，零星發生的）或 `"FITFUL"`。 |
| `boss[127]` | `請唸出：真正納入取決於邀請與實際可達` | 3. 難度不符 C1 | `ans` `"INCLUSION DEPENDS ON PRACTICAL ACCESS AS WELL AS INVITATION"` 含 **9 個單字**，超過 `PLAN.md` 口說短句 4–8 字上限。 | 精簡為 7 字：`"INCLUSION REQUIRES PRACTICAL ACCESS BEYOND MERE INVITATION"`。 |
| `boss[137]` | `請唸出：真實引文仍可能造成誤導印象` | 3. 難度不符 C1 | `ans` `"A GENUINE QUOTATION MAY STILL CREATE A MISLEADING IMPRESSION"` 含 **9 個單字**，超過 `PLAN.md` 口說短句 4–8 字上限。 | 精簡為 7 字：`"GENUINE QUOTATIONS CAN STILL CREATE MISLEADING IMPRESSIONS"`。 |
| `boss[139]` | `填空題：A M B _ V A _ E N T (對某事同時抱持矛盾感受的)` | 5. 重複或近似模板題 | `ans: "IL"`（`AMBIVALENT`）與 `normal[236]`（`spell`：`AMBIVALENT`）及 `normal[48]`、`normal[54]`、`normal[55]`（`AMBIVALENCE`）高度重複。 | 改考 `E Q U _ V O _ A T I N G` 或 `U N D _ C I _ E D`。 |
| `boss[146]` | `請唸出：較公平的工作分配` | 1. 答案唯一性／多解風險 | `ans` `"AN EQUITABLE DIVISION OF LABOUR"` 採用英式拼法 `LABOUR`，美式語音辨識多輸出 `LABOR`，可能引發字串比對問題。 | 改為英美同形之 `"AN EQUITABLE ALLOCATION OF RESPONSIBILITIES"`。 |
| `boss[147]` | `請唸出：共用空間仍需對個人界線有共識` | 3. 難度不符 C1 | `ans` `"A SHARED SPACE STILL REQUIRES AGREEMENT ABOUT PERSONAL BOUNDARIES"` 含 **9 個單字**，超過 `PLAN.md` 口說短句 4–8 字上限。 | 精簡為 7 字：`"SHARED SPACES STILL REQUIRE CLEAR PERSONAL BOUNDARIES"`。 |
| `boss[169]` | `填空題：A _ T _ Q _ E (因年代而受收藏的古物)` | 3. 難度不符 C1 | `ans: "NIU"`（`ANTIQUE`）為 B1/B2 常見基礎單字，放在 C1 `boss` 牌組且標為 `difficulty: 3` 難度明顯過低。 | 改考同主題 C1 詞彙 `A R T _ F _ C T` 或 `P A L _ M P S _ S T`（`PALIMPSEST`，重寫本／疊壓痕跡）。 |
| `boss[173]` | `【字彙】An inconspicuous figure is someone w` | 5. 重複或近似模板題 | 與 `normal[879]`（`【字彙】An inconspicuous outfit is one that ___.`，正解皆為 `does not readily attract attention`）、`normal[535]`、`normal[888]` 四度重複。 | 改考其他 C1 人物描寫形容詞，如 `An inscrutable figure is someone who ___.`（高深莫測、難以看透表情想法的人）。 |
| `boss[177]` | `請唸出：最後細節改變我們對前景的理解` | 3. 難度不符 C1 | `ans` `"THE FINAL DETAIL CHANGES HOW WE UNDERSTAND THE EARLIER SCENE"` 長達 **10 個單字**，超過 `PLAN.md` 口說短句 4–8 字上限；且中文將 `the earlier scene`（先前一幕）誤譯為「前景」。 | 修正中文為 `請唸出：最後細節改變了對先前場景的理解`，並將英文精簡為 7 字：`"FINAL DETAILS REFRAME THE ENTIRE EARLIER SCENE"`。 |
| `boss[179]` | `填空題：D I _ C O _ F _ R T (身體或心理的不自在)` | 3. 難度不符 C1 | `ans: "SMO"`（`DISCOMFORT`）為 B1/B2 基礎字彙，不符 C1 `boss` `difficulty: 3` 難度。 | 改考 C1 近義詞 `D I S _ U I _ T U _ E`（`DISQUIETUDE`，焦慮不安，ans `"QED"`）或 `M A L _ I _ E`（`MALAISE`）。 |
| `boss[187]` | `請唸出：簡圖可說清結構同時省略細節` | 3. 難度不符 C1 | `ans` `"A SIMPLIFIED DIAGRAM CAN CLARIFY STRUCTURE WHILE OMITTING DETAIL"` 含 **9 個單字**，超過 `PLAN.md` 口說短句 4–8 字上限。 | 精簡為 7 字：`"SIMPLIFIED DIAGRAMS CLARIFY STRUCTURE WHILE OMITTING DETAIL"`。 |
| `boss[189]` | `填空題：C O N _ I G _ R A _ I O N (各部件彼此排列組合` | 5. 重複或近似模板題 | `ans: "FUT"`（`CONFIGURATION`）與 `normal[559]`（`voice`：`CONFIGURATION`）重複考同一單字。 | 改考 `J U X T _ P O S _ T _ O N`（`JUXTAPOSITION`，並置／並列，ans `"AII"`）。 |
| `boss[193]` | `【字彙】A bottleneck in a pedestrian route i` | 5. 重複或近似模板題 | 與 `normal[570]`（`listening`：`a bottleneck`）及 `normal[588]`（`voice`：`BOTTLENECK`）三度重複考 `bottleneck`。 | 改考同主題 C1 空間詞彙如 `concourse`、`thoroughfare` 或 `chokepoint`。 |
| `boss[198]` | `請拼出：使人失去方向感（D 開頭，12 個字母）` | 1. 答案唯一性／多解風險 | `ans: "DISORIENTATE"` 採英式 12 字母拼法（美式與國際通用常拼為 9 字母 `DISORIENT`），雖有提示 12 個字母，仍易使熟悉 `disorient` 的玩家困惑，且與 `normal[919]`（`DISORIENTATION`）同字族重複。 | 建議於 `desc` 補充提示 `（英式 -ate 結尾，D 開頭，12 個字母）`，或改考 `BEWILDERMENT`（B 開頭，12 個字母）。 |
| `boss[199]` | `填空題：O R _ E N _ A T _ O N (相對周遭的位置方向)` | 5. 重複或近似模板題 | `ans: "ITI"`（`ORIENTATION`）與 `normal[598]`（同為 `fill` 填空題：`ORIENTATION`）**完全重複**！ | 改考 `A L _ G N _ E _ T`（`ALIGNMENT`，對準／排列方向，ans `"IMN"`）。 |
| `boss[203]` | `【字彙】A nuance is ___.` | 5. 重複或近似模板題 | 與 `normal[177]`（`fill`：`NUANCE`）及 `normal[618]`（`voice`：`NUANCE`）三度重複考 `nuance`。 | 改考 `An inflection is ___.` 或 `A cadence is ___.` 以外之 C1 語用術語如 `An innuendo is ___.`（暗諷／影射）。 |
| `boss[207]` | `請唸出：同樣字句可因聽者不同改變作用` | 3. 難度不符 C1 | `ans` `"THE SAME WORDS CAN CHANGE FUNCTION WITH DIFFERENT LISTENERS"` 含 **9 個單字**，超過 `PLAN.md` 口說短句 4–8 字上限。 | 精簡為 7 字：`"IDENTICAL WORDS SERVE DIFFERENT FUNCTIONS ACROSS LISTENERS"`。 |
| `boss[214]` | `【指涉】I can send the notes after the meeti` | 4. 英文自然度與繁中說明瑕疵 | `explain` 欄位 `"circulation notes 指傳閱筆記，their 為notes所有格。"` 將 `their circulation` 誤寫成不合英文文法的 `"circulation notes"`，且中英未留空白。 | 改為 `"their circulation 指傳閱那些筆記（the circulation of the notes），故 their 指代前文的 the notes。"`。 |
| `boss[217]` | `請唸出：願意討論不應被轉述為同意` | 3. 難度不符 C1 | `ans` `"WILLINGNESS TO DISCUSS SHOULD NOT BE REPORTED AS CONSENT"` 含 **9 個單字**，超過 `PLAN.md` 口說短句 4–8 字上限。 | 精簡為 7 字：`"WILLINGNESS TO DISCUSS NEVER EQUALS ACTUAL CONSENT"`。 |
| `boss[228]` | `請拼出：帶有沉靜憂傷情緒的（M 開頭，10 個字母）` | 5. 重複或近似模板題 | `ans: "MELANCHOLY"` 與 `normal[686]`（同為 `spell` 題：`MELANCHOLY`）**完全重複**！ | 改考 `"WISTFULNESS"`（W 開頭，11 個字母，惆悵／若有所思的懷念）或 `"PLAINTIVE"`（P 開頭，9 個字母，哀傷的）。 |
| `boss[237]` | `請唸出：相同件數可能掩蓋不同效益` | 3. 難度不符 C1 | `ans` `"AN EQUAL COUNT CAN CONCEAL DIFFERENT KINDS OF BENEFIT"` 含 **9 個單字**，超過 `PLAN.md` 口說短句 4–8 字上限。 | 精簡為 6 字：`"EQUAL COUNTS CAN CONCEAL UNEQUAL BENEFITS"`。 |
| `boss[238]` | `請拼出：逐漸過時而不再適用的狀態或過程（O 開頭，12 個字母）` | 5. 重複或近似模板題 | `ans: "OBSOLESCENCE"` 與 `normal[716]`（同為 `spell` 題：`OBSOLESCENCE`）**完全重複**！ | 改考 `"DEPRECIATION"`（D 開頭，12 個字母，貶值／折舊）或 `"REDUNDANCY"`（R 開頭，10 個字母）。 |
| `boss[248]` | `請拼出：尚未充分證實的推測（C 開頭，10 個字母）` | 5. 重複或近似模板題 | `ans: "CONJECTURE"` 與 `normal[745]`（同為 `spell` 題：`CONJECTURE`）及 `normal[348]`（`voice`：`CONJECTURE`）**完全重複**！ | 改考 `"SUPPOSITION"`（S 開頭，11 個字母，假定／推測）或 `"SURMISE"`（S 開頭，7 個字母）。 |
| `boss[257]` | `請唸出：真誠承諾依規則仍可能可撤回` | 3. 難度不符 C1 | `ans` `"A SINCERE PROMISE MAY REMAIN REVOCABLE UNDER THE RULES"` 含 **9 個單字**，超過 `PLAN.md` 口說短句 4–8 字上限。 | 精簡為 7 字：`"SINCERE PROMISES MAY REMAIN REVOCABLE UNDER RULES"`。 |
| `boss[267]` | `請唸出：編輯可改問題與答案關係` | 3. 難度不符 C1 | `ans` `"EDITORIAL CHANGES CAN ALTER THE RELATION BETWEEN QUESTION AND ANSWER"` 長達 **10 個單字**，超過 `PLAN.md` 口說短句 4–8 字上限。 | 精簡為 7 字：`"EDITING CAN ALTER RELATIONS BETWEEN QUESTIONS AND ANSWERS"`（8 字）或 `"EDITING CAN RESHAPE QUESTION AND ANSWER RELATIONS"`（7 字）。 |
| `boss[268]` | `請拼出：回看並思考過往的行為（R 開頭，13 個字母）` | 5. 重複或近似模板題 | `ans: "RETROSPECTION"` 與 `normal[804]`（同為 `spell` 題：`RETROSPECTION`）**完全重複**！ | 改考 `"REMINISCENCE"`（R 開頭，12 個字母，追憶往事）或 `"INTROSPECTION"`（I 開頭，13 個字母，內省）。 |
| `boss[269]` | `填空題：R E C _ N T E _ T U A _ I S E (把某事放入` | 1. 答案唯一性／多解風險 | 採用英式 `-ISE`（`RECONTEXTUALISE`）且與 `normal[806]`（`spell`：`RECONTEXTUALISE`）重複考同一單字。 | 改考英美拼法一致之 C1 詞彙 `C O N T _ X T U A _ I Z E`（或避開 `-ise/-ize` 改考 `R E I N T _ R P R _ T A T _ O N`，`REINTERPRETATION`，ans `"EEI"`）。 |
| `boss[277]` | `請唸出：看似附帶的聲音可能支配他人的晚上` | 3. 難度不符 C1 | `ans` `"AN APPARENTLY INCIDENTAL SOUND MAY DOMINATE SOMEONE ELSE'S EVENING"` 含 **9 個單字**（且含所有格撇號 `ELSE'S`），超過 `PLAN.md` 口說短句 4–8 字上限。 | 精簡為 7 字並避開撇號：`"APPARENTLY INCIDENTAL SOUNDS CAN DOMINATE ENTIRE EVENINGS"`。 |
| `boss[279]` | `填空題：R E V _ R B _ R A _ I O N (聲音反射後持續的回` | 5. 重複或近似模板題 | `ans: "EET"`（`REVERBERATION`）與 `normal[629]`（同為 `fill` 填空題：`REVERBERATION`，且挖空位置完全相同 `ans: "EET"`）**100% 完全重複**！ | 改考 `A T T _ N U _ T _ O N`（`ATTENUATION`，聲波或強度的衰減，ans `"EAI"`）。 |
| `boss[287]` | `請唸出：關於時間的承諾不等於關於結果的承諾` | 3. 難度不符 C1 | `ans` `"A PROMISE ABOUT TIMING IS NOT A PROMISE ABOUT THE OUTCOME"` 長達 **11 個單字**，超過 `PLAN.md` 口說短句 4–8 字上限。 | 精簡為 7 字：`"PROMISING A TIMETABLE NEVER GUARANTEES THE OUTCOME"`。 |
| `boss[288]` | `請拼出：可以被正式撤回或取消的（R 開頭，9 個字母）` | 5. 重複或近似模板題 | `ans: "REVOCABLE"` 與 `normal[775]`（同為 `spell` 題：`REVOCABLE`）**完全重複**！ | 改考 `"PROVISIONAL"`（P 開頭，11 個字母，暫定的）或 `"RESCINDABLE"`（R 開頭，11 個字母，可廢除的）。 |
| `boss[307]` | `請唸出：我們要區分路線的存在與實際可使用性。` | 3. 難度不符 C1 | `ans` `"WE NEED TO DISTINGUISH A ROUTE THAT EXISTS FROM ONE THAT CAN ACTUALLY BE USED"` 高達 **15 個單字**，嚴重違反 `PLAN.md` 口說短句 4–8 字上限，且 `desc` 結尾多出句號 `。`。 | 精簡為 7 字並移除 `desc` 句尾句號：`"EXISTING ROUTES DIFFER FROM ACTUALLY USABLE ROUTES"`。 |
