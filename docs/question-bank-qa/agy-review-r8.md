# R8（C2）題庫草稿（`.agy-input/r8.json`）內容品質審查報告（T4）

- **審查對象**：`.agy-input/r8.json`
  - **題數盤點說明**：任務說明與 `.agy-input/PLAN.md` 第 30 批進度記載為 `normal` 900 題、`boss` 300 題（共 1,200 題）；實測 `.agy-input/r8.json` 除前 30 批外，末尾已包含第 31 批（地圖／路徑／尺度／地名與空間再現主題，`normal[900..929]` 與 `boss[300..309]`），故檔案實際共有 **`normal` 930 題（`normal[0..929]`）、`boss` 310 題（`boss[0..309]`），總計 1,240 題**。本報告完整涵蓋全部 1,240 題。
- **命題規範依據**：`.agy-input/PLAN.md`（R6=B2+ / R7=C1 / R8=C2 題庫擴充計畫）
- **審查維度**：
  1. 答案是否唯一正確（含英美拼字變體判錯風險、複合詞連字號與撇號辨識風險）
  2. 干擾選項是否也能成立（或是否存在明顯假英文／語法破碎干擾項、前後題洩題）
  3. 難度是否符合 C2（含口說短句是否違反 `PLAN.md` 4–8 字上限、單字或填空是否偏簡單／過短）
  4. 英文是否自然、繁中說明（`desc`、`options`、`explain`）是否正確且無黏字／漏字瑕疵
  5. 重複或近似模板題（含跨批／跨牌組同單字同題型 100% 重複、高度同構語用模板）

---

## 一、審查統計摘要

- **總審查題數**：1,240 題（`normal[0..929]` 共 930 題、`boss[0..309]` 共 310 題）
- **通過且品質良好題數**：約 1,038 題（約 83.7%）
- **檢出問題或建議優化題數**：**202 題次**（其中部分題目同時涉及 2 項問題，如口說超長兼英式拼字／標點、或重複出題兼排版黏字）

### 各類問題統計表

| 問題類型 | `normal` 題數 | `boss` 題數 | 合計 | 主要現象摘要 |
| --- | ---: | ---: | ---: | --- |
| **1. 答案非唯一／拼字與標點判讀風險** | 12 | 4 | **16** | `fill` 強制挖空英式 `-ISE`（如 `normal[449]` `AESTHETICISE`）或採英式 `-OUR`（`normal[597]` `DEMEANOUR`）且無 `spellAccept`；`voice` 的 `ans` 含英式拼法（`JUDGEMENT`, `CANDOUR`, `PATRONISINGLY`, `ROMANTICISED`, `LABOUR`, `CENTRE`）、撇號（`SOMEONE ELSE'S`, `SPEAKER'S`）或移除複合形容詞連字號（`SELF SERVING`, `FACE SAVING`）。 |
| **2. 干擾項瑕疵（假英文／同批洩題）** | 20 | 12 | **32** | 雖 `PLAN.md` 第 201 行載明已移除 C2 文法明顯壞英文干擾項，但閱讀【文法】題仍殘留大量不合基礎助動詞／不定詞規則的「一眼假英文」選項（如 `might to differ`、`would have differ`、`never being have`、`it being has`、`unless of`、`were have`、`would to`、`to have find`）；另有同批前題直接洩漏後題拼字答案。 |
| **3. 難度不符 C2（口說超長／字彙偏易）** | 38 | 19 | **57** | **口說句子題嚴重違反 `PLAN.md`「短句 4–8 字」規定**：共 43 題（`normal` 28 題、`boss` 15 題）達 9～19 字（如 `normal[922]` 高達 19 字、`boss[307]` 達 15 字），Web Speech API 極易斷句失敗；另有 14 題單字／填空過短或僅 B1/B2 難度（如 4 字母 `ARCH`、`PRIVILEGE`、`PROHIBITION`、`IMPROVISATION`）。 |
| **4. 英文自然度與繁中說明／排版瑕疵** | 36 | 16 | **52** | 第 23～31 批（`normal[660..929]`、`boss[220..309]`）之 `explain` 大面積省去中英空白並出現**英文單字誤黏連寫**（如 `nonsequitur`、`couldhardlyhavefailed`、`notboth`、`ownvoice`、`lowprice`、`invokingit`）、漏字（`keep own counsel` 漏 `its`）及第 31 批口說 `desc` 末尾多出句號。 |
| **5. 重複或近似模板題** | 27 | 18 | **45** | 多組單字在同牌組或跨牌組重複出完全相同的 `spell`／`fill`／`voice` 題（如 `DISINGENUOUS`、`MAGNANIMITY`、`SOLICITUDE`、`VERISIMILITUDE`、`PUNCTILIOUS`、`PROVISO`、`SPECIOUS`、`FASTIDIOUS`、`MORDANT`、`EXCULPATORY`、`BATHOS`、`SUPERCILIOUS`），以及語用／論證題過度集中於「表面 X 不等於實質 Y」單一模板。 |
| **合計（題次）** | **133** | **69** | **202** | — |

---

## 二、逐題問題明細表

> 依題號順序排列（先 `normal[0..929]`，後 `boss[0..309]`）。

| 題號 | `desc` 前 40 字 | 問題類型 | 說明 | 建議修正 |
| --- | --- | --- | --- | --- |
| `normal[24]` | 請拼出：不坦率而假裝真誠的（D 開頭，12 個字母） | 5. 重複或近似模板題 | 與 `normal[414]` 同為 `normal` 牌組、`difficulty: 1`、`type: "spell"`，且 `ans` 均為 `"DISINGENUOUS"`（100% 同字同題型重複）；另 `normal[18]`（voice）、`normal[25]`（fill）、`boss[133]`（reading）亦考同一單字。 | 保留 `normal[24]`，將 `normal[414]` 改考同主題 C2 詞彙（如 `SANCTIMONIOUS` 或 `DUPLICITOUS`）。 |
| `normal[25]` | 填空題：D I S I N _ E N U O U S (表面誠懇、實則不坦率的 | 5. 重複或近似模板題 | 與同批緊鄰的 `normal[24]`（spell `DISINGENUOUS`）及 `normal[18]`（voice `DISINGENUOUS`）在同一批內連考三次同一單字，造成同批互相洩題。 | 將 `normal[25]` 改為同批其他 C2 核心詞彙之填空（如 `CASUISTRY` 或 ` SOPHISTRY`）。 |
| `normal[55]` | 填空題：M A G N A _ I M I T Y (寬宏大量，尤指得勢時不計較 | 5. 重複或近似模板題 | 與 `normal[477]` 同為 `normal` 牌組、`difficulty: 1`、`type: "fill"`，答案同為 `MAGNANIMITY` 且挖空位置 100% 相同（`M A G N A _ I M I T Y`，`ans: "N"`）；且與同批 `normal[48]`、`normal[54]` 重複。 | 刪除或替換 `normal[477]`（例如改考 `MUNIFICENCE` 或 `FORBEARANCE`）。 |
| `normal[58]` | 填空題：N O N C H A _ A N C E (若無其事、漫不經心的態度) | 5. 重複或近似模板題 | 同批 `normal[50]`（voice `A STUDIED NONCHALANCE`）、`normal[57]`（spell `NONCHALANCE`）、`normal[58]`（fill `NONCHALANCE`）連考三次，且後續 `normal[632]`（listening `a studied nonchalance`）、`normal[648]`（voice `NONCHALANCE`）再次重複。 | 將 `normal[58]` 與 `normal[648]` 替換為未重複之 C2 詞彙（如 `INSOUCIANCE`、`EQUANIMITY`）。 |
| `normal[79]` | 請唸出：不帶私利判斷的表象 | 1. 答案唯一性／拼字判讀風險 | `ans` 為 `"THE APPEARANCE OF DISINTERESTED JUDGEMENT"`，使用英式拼法 `JUDGEMENT`。瀏覽器 Web Speech API 多預設美式英文（`en-US`），會輸出 `"JUDGMENT"`，導致玩家發音正確卻因少一個 `E` 被判錯（同問題亦見 `normal[380]`、`boss[127]`、`boss[256]`）。 | 口說題 `ans` 與 `speak` 統一改為美式拼法 `"JUDGMENT"`，或確認語音比對邏輯已將英美拼字正規化。 |
| `normal[80]` | 請唸出：字面正確並不保證溝通坦誠 | 1. 答案唯一性／拼字判讀風險 | `ans` 為 `"LITERAL ACCURACY DOES NOT GUARANTEE COMMUNICATIVE CANDOUR"`，使用英式拼法 `CANDOUR`。`en-US` 語音辨識會輸出美式 `"CANDOR"`，造成比對失敗（同問題亦見 `normal[410]`）。 | 將口說題 `ans` 與 `speak` 改為 `"CANDOR"`。 |
| `normal[101]` | 【文法】So pervasive ___ that even its criti | 2. 干擾選項設計不良 | 干擾項 `A. the assumption being`（缺限定動詞）與 `D. has the assumption`（助動詞 `has` 後缺過去分詞）屬於基礎文法錯誤的假英文，無須 C2 倒裝知識即可輕易刪去。 | 將 A、D 改為具誘答力之完整結構，如 `A. the assumption is`、`D. was the assumption`。 |
| `normal[176]` | 請拼出：虛構事物看似真實可信的特性（V 開頭，14 個字母） | 5. 重複或近似模板題 | 與 `normal[804]` 同為 `normal` 牌組 `type: "spell"`，且 `ans` 均為 `"VERISIMILITUDE"`（100% 同字同題型重複）；此外 `normal[798]`（voice）與 `boss[263]`（reading）亦考同一單字。 | 保留 `normal[176]`，將 `normal[804]` 改考其他敘事評論 C2 詞彙（如 `DIEGESIS` 或 `INTERTEXTUALITY`）。 |
| `normal[198]` | 請唸出單字：行事言談審慎周全的 | 5. 重複或近似模板題 | 考 `CIRCUMSPECT`，與 `normal[359]`（fill `CIRCUMSPECT`）、`normal[19]`（voice `CIRCUMSPECTION`）、`normal[26]`（spell `CIRCUMSPECTION`）、`boss[8]`（fill `CIRCUMSPECTION`）同詞族重複達 5 次。 | 將 `normal[359]` 或 `boss[8]` 改考 `PRUDENTIAL`、`CHARY` 等近義 C2 詞彙。 |
| `normal[228]` | 請唸出單字：對他人狀況周到而關切的態度 | 5. 重複或近似模板題 | 與 `normal[528]` 同為 `normal` 牌組、`difficulty: 1`、`type: "voice"` 單字題，且 `ans` 均為 `"SOLICITUDE"`（100% 重複）；另 `normal[190]`（reading）與 `normal[206]`（spell）亦考 `SOLICITOUS`。 | 刪除或替換 `normal[528]`（如改考 `DEFERENCE`、`COMPLAISANCE` 或 `ASSIDUITY`）。 |
| `normal[233]` | 請唸出：稱讚掩藏了居高臨下的低期待 | 1. 答案唯一性／拼字判讀風險 | `ans` 為 `"THE COMPLIMENT CONCEALS A PATRONISINGLY LOW EXPECTATION"`，採英式 `-ISINGLY`（`PATRONISINGLY`），`en-US` 語音辨識預設轉寫為 `"PATRONIZINGLY"`，易導致誤判。 | 將 `ans` 與 `speak` 改為美式 `"PATRONIZINGLY"`。 |
| `normal[234]` | 請拼出：對細節要求極高而講究的（F 開頭，10 個字母） | 5. 重複或近似模板題 | 與 `boss[108]` 同為 `type: "spell"` 且 `ans` 均為 `"FASTIDIOUS"`（跨牌組 100% 重複拼字題）；另 `normal[320]` 與 `normal[889]`（voice）亦考 `FASTIDIOUS`。 | 保留 `normal[234]`，將 `boss[108]` 改考 `FINICKY`、`PERSNICKETY` 或 `METICULOUS` 等詞彙。 |
| `normal[239]` | 填空題：P U _ C T _ L I _ U S (對禮節規範或細節嚴謹的) | 5. 重複或近似模板題 | 與 `normal[897]`（`P U N C T _ L I O U S`）同為 `normal` 牌組之 `PUNCTILIOUS` 填空題，且 `normal[386]`（spell `PUNCTILIOUS`）、`normal[231]`（voice）亦重複考同一字。 | 保留 `normal[239]`，將 `normal[897]` 改考第 30 批衣著主題其他 C2 字彙（如 ` HABERDASHERY` 或 `VESTIMENTARY`）。 |
| `normal[267]` | 填空題：P R O _ I S O (附在同意或承諾上的限制條件) | 5. 重複或近似模板題 | 與 `normal[568]`（`P R _ V _ S O`）同為 `normal` 牌組之 `PROVISO` 填空題（同牌組同題型重複），且同批 `normal[240]`（listening）與 `normal[263]`（voice）已出現 `proviso`。 | 保留 `normal[568]`（挖空較合理），將 `normal[267]` 改考 `CODICIL` 或 `CAVEAT`。 |
| `normal[291]` | 請唸出：有利於解釋者自身的解讀 | 1. 答案唯一性／拼字判讀風險 | `ans` 與 `speak` 寫為 `"A SELF SERVING INTERPRETATION"` / `"a self serving interpretation"`，移除了複合形容詞必要的連字號 `self-serving`；若語音引擎轉寫帶連字號且未正規化，或顯示於畫面上，皆不符標準英文拼法（同類問題見 `normal[860]` `face saving`）。 | `speak` 改為標準英文 `"a self-serving interpretation"`，並確保比對忽略連字號差異。 |
| `normal[311]` | 【文法】The dish, albeit ___ with skill, lac | 2. 干擾選項設計不良 | 干擾項 `C. to executing`（介系詞 `to` 或不定詞結構混亂）與 `D. it executed`（連接詞 `albeit` 後直接放無動詞子句或主動過去式）為明顯壞英文。 | 將 C、D 改為語法似合理但語意／時態不合之選項，如 `C. having executed`、`D. being executing`。 |
| `normal[322]` | 請唸出：聲望可能正在做被歸因於品味的工作 | 3. 難度不符 C2（口說超長） | `ans` `"PRESTIGE MAY BE DOING THE WORK ATTRIBUTED TO TASTE"` 共 **9 個單字**，違反 `.agy-input/PLAN.md` 第 21 行「口說短句 4–8 字」上限。 | 精簡為 7–8 字，如 `"PRESTIGE OFTEN MASQUERADES AS REFINED TASTE"`（6 字）。 |
| `normal[323]` | 請唸出：這番解說幾乎不留自發反應的空間 | 3. 難度不符 C2（口說超長） | `ans` `"THE EXPLANATION LEAVES LITTLE ROOM FOR AN UNPRESCRIBED RESPONSE"` 共 **9 個單字**，違反 `PLAN.md` 4–8 字上限，且 `unprescribed` 極易被語音辨識拆字。 | 精簡為 7 字，如 `"THE FRAMING PRECLUDES ANY UNPRESCRIBED RESPONSE"`（6 字）。 |
| `normal[340]` | 【文法】Were the same search conducted at ni | 2. 干擾選項設計不良 | 干擾項 `B. had differing`、`C. might to differ`、`D. would have differ` 三個錯誤選項全為違反基本助動詞規則（`might to`、`would have + 原形`）的明顯假英文，完全失去 C2 條件句時態鑑別度。 | 改為合法動詞形式但時態／假設語氣不合的干擾項，如 `B. will differ`、`C. would have differed`、`D. differed`。 |
| `normal[344]` | 【文法】The inquiry relies on a distinction, | 2. 干擾選項設計不良 | 干擾項 `A. that of`、`B. which of`、`D. of whose` 放進 `the stability ___ the report never examines` 皆造成基礎語法斷裂。 | 改為 `A. which`、`B. whose`、`D. in which` 等真實關係詞干擾項。 |
| `normal[352]` | 請唸出：誠實的觀察者仍可能作出錯誤辨認 | 3. 難度不符 C2（口說超長） | `ans` `"AN HONEST OBSERVER MAY STILL MAKE A MISTAKEN IDENTIFICATION"` 共 **9 個單字**，超過 `PLAN.md` 4–8 字上限。 | 精簡為 7 字：`"HONEST OBSERVERS MAY STILL MISIDENTIFY EVIDENCE"`（6 字）。 |
| `normal[353]` | 請唸出：人為建構的分類不必然是任意的分類 | 3. 難度不符 C2（口說超長） | `ans` `"A CONSTRUCTED CATEGORY NEED NOT BE AN ARBITRARY ONE"` 共 **9 個單字**，超過 `PLAN.md` 4–8 字上限。 | 精簡為 7 字：`"CONSTRUCTED CATEGORIES NEED NOT BE ARBITRARY"`（6 字）。 |
| `normal[380]` | 請唸出：以不偏不倚判斷的姿態呈現 | 1. 答案唯一性／拼字判讀風險 | `ans` 為 `"PRESENTED AS IMPARTIAL JUDGEMENT"`，使用英式拼法 `JUDGEMENT`，美式語音辨識（`JUDGMENT`）易判錯。 | 改為 `"PRESENTED AS IMPARTIAL JUDGMENT"`。 |
| `normal[383]` | 請唸出：平靜接受不必意味著沒有失望 | 3. 難度不符 C2（口說超長） | `ans` `"CALM ACCEPTANCE NEED NOT IMPLY AN ABSENCE OF DISAPPOINTMENT"` 共 **9 個單字**，超過 `PLAN.md` 4–8 字上限。 | 精簡為 6 字：`"CALM ACCEPTANCE NEED NOT PRECLUDE DISAPPOINTMENT"`。 |
| `normal[389]` | 填空題：S P _ C _ O _ S (看似合理卻站不住腳的) | 5. 重複或近似模板題 | 與 `boss[9]`（`填空題：S P _ C _ O _ S (表面看似合理但實際有誤的)`）同為 `difficulty: 3`、`type: "fill"`，且挖空與答案（`EIU`）100% 相同！另 `normal[29]`（spell）亦考 `SPECIOUS`。 | 將 `normal[389]` 改考第 13 批其他 C2 詞彙（如 `FALLACIOUS` 或 `MERETRICIOUS`）。 |
| `normal[400]` | 【文法】Little ___ that her tentative remark | 2. 干擾選項設計不良 | 干擾項 `A. had anticipate she`（`had` 後接原形且語序錯亂）與 `B. she anticipated did`（句尾塞 `did`）為明顯假英文。 | 改為 `A. she had anticipated`、`B. did she anticipated` 或 `had she anticipate` 以外之合法時態干擾項（如 `she would anticipate`）。 |
| `normal[410]` | 請唸出：解除戒心的坦率姿態 | 1. 答案唯一性／拼字判讀風險 | `ans` 為 `"A DISARMING SHOW OF CANDOUR"`，使用英式 `CANDOUR`，`en-US` 語音辨識預設輸出 `CANDOR`。 | 改為 `"A DISARMING SHOW OF CANDOR"`。 |
| `normal[412]` | 請唸出：未表明偏好不必構成中立 | 3. 難度不符 C2（口說超長） | `ans` `"AN ABSENCE OF STATED PREFERENCE NEED NOT CONSTITUTE NEUTRALITY"` 共 **9 個單字**，超過 `PLAN.md` 4–8 字上限。 | 精簡為 6 字：`"UNSTATED PREFERENCES DO NOT CONSTITUTE NEUTRALITY"`。 |
| `normal[414]` | 請拼出：表面誠懇而實則不坦率的（D 開頭，12 個字母） | 5. 重複或近似模板題 | 與 `normal[24]` 完全重複（同為 `normal` 牌組 `difficulty: 1` `spell` `DISINGENUOUS`）。 | 改考第 14 批引述／轉述主題詞彙（如 `APOCRYPHAL` 或 `EXEGETICAL`）。 |
| `normal[417]` | 填空題：T E N D E _ T I O U S (帶有明顯偏見或特定立場意圖 | 5. 重複或近似模板題 | `TENDENTIOUS` 已於 `normal[78]`（voice 單字）、`normal[381]`（voice 詞組）、`normal[390]`（listening）及 `boss[137]`（voice）反覆出現。 | 改考同批其他 C2 字彙（如 `POLEMICAL`）。 |
| `normal[418]` | 填空題：P R E S U _ P O S _ T I O N (話語中未明說卻 | 5. 重複或近似模板題 | `PRESUPPOSITION` 已於 `normal[79]`（voice 單字）、`normal[392]`（listening）、`normal[411]`（voice 詞組）反覆出現，同批 `normal[411]` 直接洩漏 `normal[418]` 拼法。 | 將 `normal[418]` 改考 `IMPLICATURE` 或 `ENTAILMENT`。 |
| `normal[442]` | 請唸出：個人喜好不應偽裝成中立標準 | 3. 難度不符 C2（口說超長） | `ans` `"PERSONAL TASTE SHOULD NOT MASQUERADE AS A NEUTRAL STANDARD"` 共 **9 個單字**，超過 `PLAN.md` 4–8 字上限。 | 精簡為 7 字：`"PERSONAL TASTE SHOULD NOT MASQUERADE AS NEUTRALITY"`。 |
| `normal[449]` | 填空題：A E S _ H E _ I C _ S E (把現實問題轉化為純粹審 | 1. 答案唯一性／拼字判讀風險 | 題幹 `A E S _ H E _ I C _ S E` 強制採用英式字尾 `-ISE`，且第 3 個空格正好挖在 `I`/`Z` 變體位置（`ans: "TTI"`），但未設定 `spellAccept: ["TTZ"]`，對習慣美式拼法 `AESTHETICIZE` 的玩家極易誤判。 | 改挖不涉及英美差異的字母（如 `A E _ T H _ T _ C I Z E`）或補上 `spellAccept: ["TTZ"]`。 |
| `normal[469]` | 請唸出單字：容易引起不公比較與反感的 | 5. 重複或近似模板題 | 考 `INVIDIOUS`，與同批 `normal[452]`（listening `an invidious comparison`）及 `normal[89]`（fill `INVIDIOUS`）重複。 | 改考 `ODIOUS` 或 `PERNICIOUS`。 |
| `normal[470]` | 請唸出：被浪漫化的不對等依賴 | 1. 答案唯一性／拼字判讀風險 | `ans` 為 `"A ROMANTICISED UNEQUAL DEPENDENCE"`，使用英式 `ROMANTICISED`，`en-US` 語音辨識預設輸出 `ROMANTICIZED`。 | 改為美式 `"A ROMANTICIZED UNEQUAL DEPENDENCE"`。 |
| `normal[472]` | 請唸出：形式上的自願不會消除拒絕的社交代價 | 3. 難度不符 C2（口說超長） | `ans` `"FORMAL VOLUNTARINESS DOES NOT ELIMINATE THE SOCIAL COST OF REFUSAL"` 高達 **10 個單字**，違反 `PLAN.md` 4–8 字上限。 | 精簡為 7 字：`"FORMAL CONSENT NEVER ELIMINATES THE COST OF REFUSAL"`。 |
| `normal[473]` | 請唸出：看不見的勞動能支撐毫不費力的好客表象 | 1. 答案唯一性／3. 口說超長 | `ans` `"INVISIBLE LABOUR CAN SUSTAIN AN APPEARANCE OF EFFORTLESS HOSPITALITY"` 共 **9 個單字**（超上限），且含英式拼法 `LABOUR`（`en-US` 辨識為 `LABOR`）。 | 精簡並改美式拼法為 6 字：`"INVISIBLE LABOR SUSTAINS APPARENTLY EFFORTLESS HOSPITALITY"`。 |
| `normal[477]` | 填空題：M A G N A _ I M I T Y (寬大而不計較的氣度) | 5. 重複或近似模板題 | 與 `normal[55]` 100% 重複（同為 `normal` 牌組 `difficulty: 1` `fill`，同挖 `M A G N A _ I M I T Y` 答 `N`）。 | 替換為其他 C2 詞彙（如 `MUNIFICENCE`）。 |
| `normal[490]` | 【文法】The letter is all the more revealing | 2. 干擾選項設計不良 | 干擾項 `A. never being have` 與 `C. having never to be` 為明顯不合英語語法的拼湊假英文。 | 改為 `A. never having`、`C. having never been` 等具文法誘答力之選項。 |
| `normal[502]` | 請唸出：留存下來的物件反映保存取捨的決定 | 3. 難度不符 C2（口說超長） | `ans` `"A SURVIVING OBJECT REFLECTS DECISIONS ABOUT WHAT TO PRESERVE"` 共 **9 個單字**，超過 `PLAN.md` 4–8 字上限。 | 精簡為 7 字：`"SURVIVING OBJECTS REFLECT PRIOR DECISIONS ABOUT PRESERVATION"`。 |
| `normal[528]` | 請唸出單字：對他人處境表現出的周到關切 | 5. 重複或近似模板題 | 與 `normal[228]` 100% 重複（皆為 `normal` 牌組 `difficulty: 1` `voice` 單字題 `SOLICITUDE`）。 | 改考 `CONTRITION` 或 `COMPUNCTION`（契合第 18 批道歉主題）。 |
| `normal[533]` | 請唸出：他表面的謙遜確保稱讚回到自己身上 | 3. 難度不符 C2（口說超長） | `ans` `"HIS APPARENT MODESTY ENSURES THAT THE PRAISE RETURNS TO HIM"` 高達 **10 個單字**，超過 `PLAN.md` 4–8 字上限。 | 精簡為 7 字：`"FALSE MODESTY ENSURES THAT PRAISE RETURNS HOME"`。 |
| `normal[535]` | 請拼出：幽默或評論尖刻帶諷刺意味的（M 開頭，7 個字母） | 5. 重複或近似模板題 | 與同批 `boss[178]` 同為 `type: "spell"` 且 `ans` 同為 `"MORDANT"`（100% 重複拼字題），另 `boss[59]`（fill）與 `normal[170]`（voice）亦考 `MORDANT`。 | 將 `normal[535]` 或 `boss[178]` 改考 `TRENCHANT` 或 `CAUSTIC`。 |
| `normal[536]` | 請拼出：意在安撫怒氣或緩和對立的（P 開頭，9 個字母） | 5. 重複或近似模板題 | 考 `PLACATORY`，與 `boss[69]`（fill `PLACATORY`）及 `normal[191]`（reading `placatory`）重複。 | 改考 `CONCILIATORY` 或 `PROPITIATORY`。 |
| `normal[537]` | 填空題：A R _ H (故作狡黠而帶玩笑意味的) | 3. 難度不符 C2（字長過短） | 雖取 `arch` 之 C2 次要詞義（狡黠俏皮的），但作為填空題僅 4 個字母、挖空 1 字（`A R _ H`），拼字結構過於簡單，且與同批 `boss[173]`（reading `An arch remark`）互見。 | 改將 `arch` 放於閱讀／聽力考語境義，填空題改考 `FACETIOUS` 或 `IRONICAL`。 |
| `normal[538]` | 填空題：T A _ T L _ S S (說話行事缺乏分寸而不顧他人感受的) | 3. 難度不符 C2（字彙偏易） | `TACTLESS` 為 B2 基礎衍生字（`tact` + `-less`），作為 C2 `difficulty: 2` 填空題難度偏低。 | 改考 C2 近義字 `INDELICATE`、`GAUCHE` 或 `MALADROIT`。 |
| `normal[550]` | 【文法】The instruction is no clearer for __ | 2. 干擾選項設計不良 | 干擾項 `B. been`（介系詞 `for` 後直接放過去分詞）與 `C. it being has`（語法完全破碎）為明顯假英文。 | 改為 `B. having repeated`、`C. its repeating` 等具迷惑性之動名詞結構。 |
| `normal[562]` | 請唸出：許可不會因條件成立就變成義務 | 3. 難度不符 C2（口說超長） | `ans` `"PERMISSION DOES NOT BECOME OBLIGATION WHEN ITS CONDITION IS MET"` 高達 **10 個單字**，違反 `PLAN.md` 4–8 字上限。 | 精簡為 6 字：`"CONDITIONAL PERMISSION NEVER ENTAILS MANDATORY ACTION"`。 |
| `normal[563]` | 請唸出：內隱專長可能補足說明書的缺口 | 3. 難度不符 C2（口說超長） | `ans` `"TACIT EXPERTISE MAY COMPENSATE FOR GAPS IN THE INSTRUCTIONS"` 共 **9 個單字**，超過 `PLAN.md` 4–8 字上限。 | 精簡為 7 字：`"TACIT EXPERTISE COMPENSATES FOR INSTRUCTIONAL GAPS"`（6 字）。 |
| `normal[564]` | 請拼出：偏重規定應該如何做的（P 開頭，12 個字母） | 3. 難度不符 C2（字彙偏易） | `PRESCRIPTIVE` 為 B2/C1 常見字，且與同批 `normal[566]`（`ARTICULATE`，B2 常見字）、`normal[569]`（`SUFFICIENCY`，B2 常見衍生字）整體使第 19 批寫作難度偏低。 | 建議將 `normal[566]` `ARTICULATE` 替換為 `CODIFY` 或 `EXPLICATE`，`normal[569]` 替換為 `ADEQUACY` 以外之 C2 詞彙（如 `DETERMINACY`）。 |
| `normal[568]` | 填空題：P R _ V _ S O (協議或說明中附加的條件或限制) | 5. 重複或近似模板題 | 與 `normal[267]` 重複（同為 `normal` 牌組 `fill` `PROVISO`）。 | 若保留本題，請替換 `normal[267]`。 |
| `normal[580]` | 【文法】The difficulty lies not in finding t | 2. 干擾選項設計不良 | 干擾項 `D. what it` 放進 `___ of the identical doors` 形成 `what it of the identical doors`，為明顯不合語法的假英文。 | 將 D 改為 `whichever` 或 `that`。 |
| `normal[584]` | 【文法】So insistently ___ familiarity that | 2. 干擾選項設計不良 | 干擾項 `A. presume does the layout` 與 `B. the layout presumes does` 將助動詞 `does` 塞在動詞後，屬明顯假英文。 | 改為 `A. the layout presumes`、`B. has the layout presumed`。 |
| `normal[593]` | 請唸出：可被找到的替代路線必須對不熟悉者可見 | 3. 難度不符 C2（口說超長） | `ans` `"A DISCOVERABLE ALTERNATIVE MUST BE VISIBLE TO UNFAMILIAR USERS"` 共 **9 個單字**，超過 `PLAN.md` 4–8 字上限。 | 精簡為 7 字：`"ALTERNATIVE ROUTES MUST BE VISIBLE TO NEWCOMERS"`。 |
| `normal[594]` | 請拼出：讓人難以看透或理解的（I 開頭，11 個字母） | 5. 重複或近似模板題 | 考 `INSCRUTABLE`，與同批 `boss[193]`（`【字彙】An inscrutable layout is one that ___.`）同批直接互見洩題。 | 將 `normal[594]` 改考 `LABYRINTHINE` 或 `IMPENETRABLE`。 |
| `normal[595]` | 請拼出：外觀嚴峻而令人卻步的（F 開頭，10 個字母） | 3. 難度不符 C2（字彙偏易） | `FORBIDDING` 為 `forbid` + `-ing` 構成之 B2 常見字，在 C2 `difficulty: 2` 拼字題中偏簡單。 | 改考 `AUSTERE`、`INCLEMENT` 或 `FOREBEARING` 以外之 C2 建築空間形容詞（如 `MONOLITHIC`）。 |
| `normal[597]` | 填空題：D E M E _ N O U R (外在舉止或神態) | 1. 答案唯一性／拼字判讀風險 | 題幹 `D E M E _ N O U R` 採用英式拼法 `-OUR`（美式為 `DEMEANOR`）。雖挖空字母為 `A`，但題幹顯示英式字尾易使習慣美式拼法的玩家困惑。 | 建議題幹統一採美式 `D E M E _ N O R`（`speak: "demeanor"`）。 |
| `normal[610]` | 【文法】The scene is the more unsettling ___ | 2. 干擾選項設計不良 | 干擾項 `A. unless of`、`C. although of`、`D. despite that it` 三個錯誤選項全為英語中不存在的假連接詞組合，毫無 C2 鑑別度。 | 改為語法正確但邏輯或句型不合的連接詞，如 `A. unless`、`C. despite being`、`D. even so`。 |
| `normal[625]` | 請拼出：由崇高莊嚴突降為平庸可笑的效果（B 開頭，6 個字母） | 5. 重複或近似模板題 | 與 `boss[58]` 同為 `type: "spell"` 且 `ans` 均為 `"BATHOS"`（跨牌組 100% 重複拼字題）。 | 將 `normal[625]` 改考戏剧／舞台主題其他 C2 詞彙（如 `SOLILOQUY` 或 `DENOUEMENT`）。 |
| `normal[640]` | 【文法】The paragraph is phrased as though r | 2. 干擾選項設計不良 | 干擾項 `A. would to`、`B. were have`、`D. has being` 全為助動詞胡亂拼湊的假英文（後接 `already been ruled out`）。 | 改為 `A. has`、`B. were`、`D. would be` 等真實助動詞形式。 |
| `normal[648]` | 請唸出單字：漫不經心而若無其事的態度 | 5. 重複或近似模板題 | 考 `NONCHALANCE`，與 `normal[50]`、`normal[57]`、`normal[58]`、`normal[632]` 重複。 | 改考 `INSOUCIANCE` 或 `SANGFROID`。 |
| `normal[652]` | 請唸出：真實的提醒仍可能讓拒絕付出高昂社交代價 | 3. 難度不符 C2（口說超長） | `ans` `"A TRUTHFUL REMINDER MAY STILL MAKE REFUSAL SOCIALLY COSTLY"` 共 **9 個單字**，超過 `PLAN.md` 4–8 字上限。 | 精簡為 7 字：`"TRUTHFUL REMINDERS CAN STILL MAKE REFUSAL COSTLY"`。 |
| `normal[655]` | 請拼出：超越分際而冒昧自專的（P 開頭，12 個字母） | 5. 重複或近似模板題 | 考 `PRESUMPTUOUS`（spell），與同批 `boss[219]`（fill `PRESUMPTUOUS`）在同一批內重複考同一單字拼寫。 | 將 `boss[219]` 改考 `IMPORTUNATE` 或 `OFFICIOUS`。 |
| `normal[660]` | 🎧 聽一聽，選出最符合說話者意思的解讀 | 4. 繁中說明與排版瑕疵 | 第 23 批（`normal[660..677]`）之 `explain` 全面省去中英之間必要的空白（如 `normal[660]` `"sinuous指流暢曲折..."`、`normal[666]` `"方向為immensity到minuteness"`、`normal[669]` `"desolate荒寂與presence存在感可共存"`）。 | 在 `normal[660..677]` 的 `explain` 中補齊中英文間的半形空白，提升解析可讀性。 |
| `normal[670]` | 【文法】The light seemed less to illuminate | 2. 干擾選項設計不良 | 干擾項 `A. disclosing of` 為不合語法之及物動詞＋介系詞誤湊。 | 改為 `A. disclosing` 或 `A. to be disclosed`。 |
| `normal[671]` | 【修辭】The valley kept its own counsel even | 4. 英文自然度与繁中說明瑕疵 | `explain` 寫作 `"keep own counsel不吐露想法的擬人，與旅人命名無關。"`，片語漏掉所有格代名詞 `its/one's`（應為 `keep one's own counsel`），且中英黏字。 | 將 `explain` 修正為 `"keep one's own counsel 為不吐露想法的擬人，與旅人命名無關。"`。 |
| `normal[674]` | 【文法】The stillness was such ___ the small | 2. 干擾選項設計不良 | 干擾項 `A. as if of` 為明顯假英文組合。 | 改為 `A. as if` 或 `A. so that`。 |
| `normal[682]` | 請唸出：開闊遠景不必承諾不同的未來 | 3. 難度不符 C2（口說超長） | `ans` `"AN OPEN PROSPECT NEED NOT PROMISE A DIFFERENT FUTURE"` 共 **9 個單字**，超過 `PLAN.md` 4–8 字上限。 | 精簡為 7 字：`"OPEN PROSPECTS NEED NOT PROMISE DIFFERENT FUTURES"`。 |
| `normal[690]` | 🎧 聽一聽，選出最符合說話者意思的解讀 | 4. 繁中說明與排版瑕疵／5. 重複 | `normal[690]`（listening `fungible goods`）、`normal[699]`（reading ` calls two items fungible`）、`normal[708]`（voice `FUNGIBLE`）在同一批內連考三次 `fungible`，且 `normal[690..707]` 的 `explain` 中英全無空白。 | 減少同批 `fungible` 重複題數，並補齊 `explain` 空白。 |
| `normal[700]` | 【文法】The item is no more useful for ___ d | 2. 干擾選項設計不良 | 干擾項 `B. to have`、`C. been`、`D. it being has` 三個錯誤選項全為介系詞 `for` 後不可能出現的破碎假英文。 | 改為 `B. having described`、`C. being describing`、`D. its describing`。 |
| `normal[712]` | 請唸出：恢復的功能可能被宣傳成慷慨加贈 | 3. 難度不符 C2（口說超長） | `ans` `"A RESTORED FEATURE CAN BE MARKETED AS A GENEROUS EXTRA"` 高達 **10 個單字**，違反 `PLAN.md` 4–8 字上限。 | 精簡為 7 字：`"RESTORED FEATURES ARE OFTEN MARKETED AS EXTRAS"`。 |
| `normal[715]` | 請拼出：無充分理由而多餘的（G 開頭，10 個字母） | 5. 重複或近似模板題 | 考 `GRATUITOUS`（spell），與同批 `normal[691]`（listening `gratuitous embellishment`）及 `boss[233]`（reading `A gratuitous addition`）同批連考三次。 | 將 `normal[715]` 改考 `SUPEREROGATORY` 或 `ADVENTITIOUS`。 |
| `normal[716]` | 請拼出：無法用同一標準直接衡量的（I 開頭，15 個字母） | 5. 重複或近似模板題 | 考 `INCOMMENSURABLE`（spell），與 `boss[39]`（fill `INCOMMENSURABLE`）、`normal[114]`（spell `COMMENSURABLE`）、`boss[238]`（spell `COMMENSURABILITY`）重複。 | 改考 `INCOMPARABLE` 以外之 C2 詞彙（如 `HETEROGENEOUS` 或 `DISPARATE`）。 |
| `normal[720]` | 🎧 聽一聽，選出最符合說話者意思的解讀 | 4. 英文自然度與繁中說明瑕疵 | `explain` 寫作 `"nonsequitur拉丁語指推論不相隨。"`，將兩個獨立拉丁單字 `non sequitur` 誤黏成一個字 `nonsequitur`，且與中文無空白。 | 修正 `explain` 為 `"non sequitur（拉丁語）指推論不相隨。"`。 |
| `normal[730]` | 【文法】The detail is telling in that it pre | 2. 干擾選項設計不良 | 干擾項 `A. has acquired by chance`、`C. had acquiring by chance`、`D. to acquire by chance` 接在情態助動詞 `could reasonably ___` 後皆為基礎助動詞語法錯誤。 | 改為 `A. acquire it by chance`、`C. be acquired by chance`、`D. have been acquiring by chance`。 |
| `normal[736]` | 【短文】An archive contains three undated dr | 4. 繁中說明與排版瑕疵 | `explain` 寫作 `"有唯一早note不等於讀者能辨誰，不擴張為全館無序。"`，中英夾雜且語句過度壓縮破碎（「有唯一早note」不通順）。 | 修正 `explain` 為 `"存在唯一較早的筆記，不等於讀者能辨識是哪一份，亦不能過度外推為全館毫無秩序。"`。 |
| `normal[737]` | 【短文】A narrator notices that the host Top | 4. 英文自然度與繁中說明瑕疵 | `explain` 寫作 `"couldhardlyhavefailed推論近乎必注意，但是否構成拆穿仍留開放。"`，將四個英文單字 `could hardly have failed` 完全黏成一團 `couldhardlyhavefailed`！ | 修正 `explain` 為 `"could hardly have failed 表推論上幾乎必然注意到，但是否構成公開拆穿仍保持開放。"`。 |
| `normal[742]` | 請唸出：有效推論仍取決於前提的地位 | 3. 難度不符 C2（口說超長） | `ans` `"A VALID INFERENCE STILL DEPENDS ON THE STATUS OF ITS PREMISE"` 高達 **11 個單字**，嚴重違反 `PLAN.md` 4–8 字上限。 | 精簡為 7 字：`"VALID INFERENCES STILL DEPEND ON SOUND PREMISES"`。 |
| `normal[744]` | 請拼出：有助於開脫罪責或證明無過的（E 開頭，11 個字母） | 5. 重複或近似模板題 | 與 `boss[28]` 同為 `type: "spell"` 且 `ans` 均為 `"EXCULPATORY"`（100% 重複拼字題），且同批 `normal[722]`（listening）、`normal[729]`（reading）已兩度出現 `exculpatory`（直接洩題）。 | 將 `normal[744]` 改考 `PROBATIVE` 或 `CORROBORATIVE`。 |
| `normal[747]` | 填空題：D E D U _ T I V E (由一般前提推導出必然結論的) | 3. 難度不符 C2（字彙偏易） | `DEDUCTIVE` 為 B2 基礎邏輯詞彙，且僅挖空 1 個字母 `C`，在 C2 區過於簡單。 | 改考 `SYLLOGISTIC` 或 `APODICTIC`。 |
| `normal[753]` | 🎧 聽一聽，選出最符合說話者意思的解讀 | 4. 英文自然度與繁中說明瑕疵 | `explain` 寫作 `"either與notboth形成互斥單次資格。"`，將英文 `not both` 誤黏為 `notboth`，且無空白。 | 修正 `explain` 為 `"either 與 not both 形成互斥的單次資格。"`。 |
| `normal[772]` | 請唸出：裁決的終局性不證明其正確性 | 3. 難度不符 C2（口說超長） | `ans` `"FINALITY OF A RULING DOES NOT ESTABLISH ITS CORRECTNESS"` 共 **9 個單字**，超過 `PLAN.md` 4–8 字上限。 | 精簡為 6 字：`"PROCEDURAL FINALITY NEVER GUARANTEES SUBSTANTIVE CORRECTNESS"`。 |
| `normal[773]` | 請唸出：可達成的目標不應在每次接近時後退 | 3. 難度不符 C2（口說超長） | `ans` `"AN ACHIEVABLE GOAL SHOULD NOT RECEDE WHENEVER IT IS REACHED"` 高達 **10 個單字**，超過 `PLAN.md` 4–8 字上限。 | 精簡為 7 字：`"ACHIEVABLE GOALS SHOULD NOT RECEDE UPON APPROACH"`。 |
| `normal[778]` | 填空題：P R O H _ B I _ I O N (規則中明文不准許某事的禁令 | 3. 難度不符 C2（字彙偏易） | `PROHIBITION` 為 B1/B2 常見名詞，放在 C2 `difficulty: 2` 填空題難度明顯過低。 | 改考 `INTERDICTION` 或 `PROSCRIPTION`。 |
| `normal[790]` | 【文法】The account is no less mediated for | 2. 干擾項瑕疵／4. 說明黏字 | 干擾項 `A. to be`、`B. been`、`C. it has` 接在 `for ___ told` 中全為明顯假英文；且 `explain` 將 `own voice` 誤黏為 `ownvoice`（`"for後動名詞being；ownvoice不代表無中介。"`）。 | 將干擾項改為 `A. being`、`B. having told`、`C. its telling`；並將 `explain` 中之 `ownvoice` 修正為 `own voice`。 |
| `normal[794]` | 【文法】The silence in the transcript may re | 2. 干擾選項設計不良 | 干擾項 `A. to have find`（`have` + 原形 `find`）、`C. finding to`、`D. had found of` 全為明顯假英文，使正確答案 `B. to find in` 不攻自破。 | 改為 `A. to find from`、`C. finding in`、`D. to have found on` 等具介系詞／不定詞辨析價值之選項。 |
| `normal[802]` | 請唸出：熟悉的聲音可能被編排成別人的論點 | 1. 標點判讀風險／3. 口說超長 | `ans` `"A FAMILIAR VOICE CAN BE ARRANGED INTO SOMEONE ELSE'S ARGUMENT"` 高達 **10 個單字**（超上限），且含有撇號 `ELSE'S`（若語音正規化未移除 `'` 易導致比對風險）。 | 精簡並避開所有格撇號，改為 7 字：`"FAMILIAR VOICES CAN SERVE ANOTHER EDITORIAL ARGUMENT"`。 |
| `normal[804]` | 請拼出：作品呈現出看似逼真可信的性質（V 開頭，14 個字母） | 5. 重複或近似模板題 | 與 `normal[176]` 100% 重複（同為 `normal` 牌組 `spell` `VERISIMILITUDE`），且與同批 `normal[798]`（voice `VERISIMILITUDE`）及 `boss[263]`（reading `Verisimilitude`）同批連考三次。 | 替換為其他傳記／訪談主題 C2 字彙（如 `PROSOPOGRAPHY` 或 `VENTRILOQUISM`）。 |
| `normal[807]` | 填空題：A U T O B I O G _ A P H I C A L (與作者 | 3. 難度不符 C2（字彙偏易） | `AUTOBIOGRAPHICAL` 雖長但為 B2 常見透明派生詞，且 16 個字母僅挖空 1 個 `R`（`difficulty: 1`），毫無 C2 挑戰性。 | 改考 `CONFESSIONAL` 或增加挖空深度。 |
| `normal[821]` | 【文法】So insistently ___ beneath the dialo | 2. 干擾選項設計不良 | 干擾項 `A. the hum persisted did` 與 `D. persisted did the hum` 將助動詞與過去式動詞錯置，屬明顯假英文。 | 改為 `A. the hum persisted`、`D. had the hum persisted`。 |
| `normal[824]` | 【文法】Had the pauses been merely accidenta | 2. 干擾選項設計不良 | 干擾項 `B. would not being`（`would` 後直接接 `being`）為明顯假英文。 | 改為 `B. would not have been` 或 `B. were not`。 |
| `normal[851]` | 【文法】The objection, persuasive ___ in iso | 2. 干擾選項設計不良 | 干擾項 `A. as may be it`、`B. despite it may be`、`D. though may it be` 全為明顯語序錯亂或詞性誤用（`despite` + 子句）的假英文。 | 改為 `A. as it is`（與後文語氣比較）、`B. although it be`、`D. however it may be`。 |
| `normal[858]` | 請唸出單字：未經事先排練而即興作出的應對 | 3. 難度不符 C2（字彙偏易） | `IMPROVISATION` 為 B2 常見名詞，放在 C2 區嫌簡單（同批已有 C2 字 `EXTEMPORANEOUS`）。 | 改考 `EXTEMPORIZATION` 或 `AD-LIBBING` 以外之 C2 單字（如 `TEMPORIZATION`）。 |
| `normal[860]` | 請唸出：替人保全面子的改述 | 1. 答案唯一性／拼字判讀風險 | `ans` 與 `speak` 寫為 `"A FACE SAVING REFORMULATION"` / `"a face saving reformulation"`，漏掉複合形容詞連字號 `face-saving`。 | `speak` 補上連字號 `"a face-saving reformulation"`。 |
| `normal[862]` | 請唸出：同意繼續不等於同意繼續意味著什麼 | 3. 難度不符 C2（口說超長） | `ans` `"AGREEMENT TO CONTINUE IS NOT AGREEMENT ON WHAT CONTINUATION ENTAILS"` 高達 **10 個單字**，違反 `PLAN.md` 4–8 字上限。 | 精簡為 7 字：`"CONTINUING TALKS NEVER IMPLIES SUBSTANTIVE CONSENSUS"`（6 字）。 |
| `normal[863]` | 請唸出：圓融改述仍可能讓潛在歧見原封不動 | 3. 難度不符 C2（口說超長） | `ans` `"A TACTFUL REFORMULATION CAN LEAVE THE UNDERLYING DISAGREEMENT INTACT"` 共 **9 個單字**，超過 `PLAN.md` 4–8 字上限。 | 精簡為 7 字：`"TACTFUL REFORMULATIONS MAY LEAVE DISAGREEMENTS INTACT"`（6 字）。 |
| `normal[865]` | 請拼出：說話拐彎抹角而不直接表述（C 開頭，14 個字母） | 5. 重複或近似模板題 | 考 `CIRCUMLOCUTION`（spell），與同批 `boss[289]`（fill `CIRCUMLOCUTION`）同批重複考同一單字拼寫，且 `boss[218]` 已考 `CIRCUMLOCUTORY`。 | 將 `boss[289]` 改考 `TERGIVERSATION` 或 `EQUIVOCATION`。 |
| `normal[866]` | 請拼出：事後追溯到先前時間而生效或套用地（R 開頭，13 個字母） | 4. 繁中說明與排版瑕疵 | `desc`「事後追溯到先前時間而生效或套用地」為湊副詞詞性硬加「地」，中文語感生硬，且 `RETROACTIVE` 已於 `normal[751]` 考過。 | `desc` 改為「以事後回溯至先前時間生效的方式（副詞，R 開頭，13 個字母）」。 |
| `normal[868]` | 填空題：U N Q U A _ I F I _ D (毫無保留而不附帶限制條件的 | 3. 難度不符 C2（字彙偏易） | `UNQUALIFIED` 拼字結構屬 B2 常規字，雖取「毫無保留的」語意，但作為 C2 `difficulty: 2` 填空題拼寫難度偏低。 | 改考 `UNCONDITIONAL` 以外之 C2 詞彙（如 `UNRESERVED` 或 `CATEGORICAL`）。 |
| `normal[892]` | 請唸出：有說服力的外表不保證能直接看穿私人動機 | 3. 難度不符 C2（口說超長） | `ans` `"A CONVINCING SURFACE DOES NOT GRANT DIRECT ACCESS TO A PRIVATE MOTIVE"` 高達 **12 個單字**，嚴重違反 `PLAN.md` 4–8 字上限。 | 精簡為 7 字：`"CONVINCING SURFACES NEVER REVEAL PRIVATE MOTIVES"`（6 字）。 |
| `normal[893]` | 請唸出：歷史細節準確不代表那個選擇原本無可避免 | 3. 難度不符 C2（口說超長） | `ans` `"HISTORICAL ACCURACY DOES NOT ESTABLISH THAT A CHOICE WAS INEVITABLE"` 高達 **10 個單字**，違反 `PLAN.md` 4–8 字上限。 | 精簡為 7 字：`"HISTORICAL ACCURACY NEVER ESTABLISHES INEVITABILITY"`（5 字）。 |
| `normal[895]` | 請拼出：表現出高人一等與輕蔑神態的（S 開頭，12 個字母） | 5. 重複或近似模板題 | 與 `boss[68]` 同為 `type: "spell"` 且 `ans` 均為 `"SUPERCILIOUS"`（100% 重複拼字題），另 `normal[199]` 已考 `SUPERCILIOUSNESS`。 | 將 `normal[895]` 改考 `HAUGHTY`、`DISDAINFUL` 或 `CONTEMPTUOUS`。 |
| `normal[897]` | 填空題：P U N C T _ L I O U S (對禮儀或細節一絲不苟的) | 5. 重複或近似模板題 | 與 `normal[239]` 重複（同為 `normal` 牌組 `fill` `PUNCTILIOUS`），且僅挖 1 個字母 `I`。 | 改考第 30 批衣著外觀主題其他詞彙（如 ` FOPPISH` 或 `DANDIFIED`）。 |
| `normal[922]` | 請唸出：地圖上沒有名字，不等於人們對那個地方沒有依戀。 | 3. 口說超長／4. 格式不一致 | `ans` `"THE ABSENCE OF A NAME ON THE MAP IS NOT EVIDENCE OF AN ABSENCE OF ATTACHMENT TO THE PLACE"` 高達 **19 個單字**！為全題庫最長口說句，嚴重違反 `PLAN.md`「口說短句 4–8 字」上限，實測極易因換氣停頓被判錯；且 `desc` 末尾多出句號「。」，與前 30 批格式不一致。 | 刪除 `desc` 句號，並將句子濃縮為 6–8 字：`"UNMAPPED PLACES STILL COMMAND DEEP LOCAL ATTACHMENT"`（7 字）。 |
| `normal[923]` | 請唸出：什麼顯得邊緣，取決於敘述把中心放在哪裡。 | 1. 拼字風險／3. 口說超長 | `ans` `"WHAT APPEARS PERIPHERAL DEPENDS ON WHERE THE ACCOUNT CHOOSES TO PLACE ITS CENTRE"` 高達 **13 個單字**（超上限），且含英式拼法 `CENTRE`（`en-US` 語音辨識為 `CENTER`），`desc` 末尾亦多出句號。 | 刪除 `desc` 句號，並改為美式 7 字短句：`"PERIPHERALITY DEPENDS ON WHERE ACCOUNTS CENTER ATTENTION"`。 |
| `boss[8]` | 填空題：C I R C U M S _ E C T I O N (採取行動前審慎 | 5. 重複或近似模板題 | 考 `CIRCUMSPECTION`，與第 1 批對應之 `normal[19]`（voice `CIRCUMSPECTION`）、`normal[26]`（spell `CIRCUMSPECTION`）完全同字。 | 改考 `FORETHOUGHT` 或 `DELIBERATION`。 |
| `boss[9]` | 填空題：S P _ C _ O _ S (表面看似合理但實際有誤的) | 5. 重複或近似模板題 | 與 `normal[389]` 100% 重複（同為 `difficulty: 3` `fill` `S P _ C _ O _ S`，`ans: "EIU"`），且與第 1 批 `normal[29]`（spell `SPECIOUS`）同批重複。 | 將 `boss[9]` 改考 `SOPHISTRICAL` 或 `CAPTIOUS`。 |
| `boss[13]` | 【文法】___ that the deadline had already pa | 2. 干擾選項設計不良 | 干擾項 `B. Had made it clear`（無主詞）、`C. Were it make clear`（`Were` + 原形 `make`）、`D. Has it been making clear` 全為明顯假英文。 | 改為 `B. If it were made clear`、`C. Should it be made clear`、`D. Having been made clear`。 |
| `boss[18]` | 填空題：P A T E R _ A L I S M (自認為他人好而限制其自主的 | 5. 重複或近似模板題 | 與第 2 批 `normal[49]`（voice `PATERNALISM`）、`normal[56]`（spell `PATERNALISM`）同批三度考同一單字。 | 改考 `TUTELAGE` 或 `CONDESCENSION`。 |
| `boss[19]` | 填空題：D I _ S _ M _ L E (隱藏真實感受或意圖而故作姿態) | 5. 重複或近似模板題 | 與第 2 批 `normal[59]`（spell `DISSEMBLE`）同批重複考拼寫，且 `boss[279]` 又考 `DISSEMBLING` 填空。 | 將 `boss[19]` 改考 `SIMULATE` 以外之 C2 字彙（如 `EQUIVOCATE`）。 |
| `boss[28]` | 請拼出：用以證明無責任或開脫過錯的（E 開頭，11 個字母） | 5. 重複或近似模板題 | 與 `normal[744]` 同為 `type: "spell"` 且 `ans` 均為 `"EXCULPATORY"`（100% 重複拼字題）。 | 保留 `boss[28]`，替換 `normal[744]`。 |
| `boss[39]` | 填空題：I N C _ M M E _ S U R _ B L E (無法以共同 | 5. 重複或近似模板題 | 考 `INCOMMENSURABLE`，與 `normal[716]`（spell `INCOMMENSURABLE`）及同批 `normal[114]`（spell `COMMENSURABLE`）重複。 | 保留 `boss[39]`，替換 `normal[716]`。 |
| `boss[43]` | 【文法】Were the distinction ___, the appare | 2. 干擾選項設計不良 | 干擾項 `A. to maintaining` 與 `B. been maintained` 接在 `Were the distinction ___` 後為明顯假英文。 | 改為 `A. maintained`（檢驗未來假設 vs 現況假設或搭配）、`B. being maintained`、`C. to maintain`。 |
| `boss[53]` | 【文法】Such is the economy of the scene ___ | 2. 干擾選項設計不良 | 干擾項 `C. as to a` 為明顯不合語法的拼湊詞組。 | 改為 `C. as` 或 `C. so that`。 |
| `boss[58]` | 請拼出：從高昂莊嚴突然落到瑣碎的失調效果（B 開頭，6 個字母） | 5. 重複或近似模板題 | 與 `normal[625]` 同為 `type: "spell"` 且 `ans` 均為 `"BATHOS"`（100% 重複拼字題），且與同批 `normal[162]`（reading `bathetic`）同批出現。 | 保留 `boss[58]`，替換 `normal[625]`。 |
| `boss[59]` | 填空題：M _ R _ A _ T (幽默或評論尖刻而有批判力的) | 5. 重複或近似模板題 | 考 `MORDANT`，與同批 `normal[170]`（voice `A MORDANT OBSERVATION`）以及第 18 批 `normal[535]`（spell `MORDANT`）、`boss[178]`（spell `MORDANT`）四度重複。 | 將 `boss[59]` 改考 `VITRIOLIC` 或 `ACIDULOUS`。 |
| `boss[63]` | 【文法】Be that ___, the unresolved question | 2. 干擾選項設計不良 | 干擾項 `A. that it were`、`C. as it might be it`、`D. whether may` 全為明顯假英文，且與同批 `normal[180]`（listening `be that as it may`）同批直接洩題。 | 更換本題考點（避免與同批 `normal[180]` 互洩），或將干擾項改為合法片語。 |
| `boss[68]` | 請拼出：自認優越而傲慢輕蔑的（S 開頭，12 個字母） | 5. 重複或近似模板題 | 與 `normal[895]` 同為 `type: "spell"` 且 `ans` 均為 `"SUPERCILIOUS"`（100% 重複拼字題），且與同批 `normal[199]`（voice `SUPERCILIOUSNESS`）直接洩題。 | 保留 `boss[68]` 並調整 `normal[199]`／`normal[895]`。 |
| `boss[69]` | 填空題：P L _ C _ T _ R Y (以安撫或平息不滿為目的的) | 5. 重複或近似模板題 | 與同批 `normal[191]`（reading `placatory`）互見，且與 `normal[536]`（spell `PLACATORY`）重複考拼寫。 | 保留 `boss[69]`，替換 `normal[536]`。 |
| `boss[73]` | 【文法】Not for a moment ___ that the invita | 2. 干擾選項設計不良 | 干擾項 `A. had supposed she` 為明顯語序錯亂的假英文。 | 改為 `A. had she suppose` 或 `A. would she supposed` 以外之合法結構（如 `A. she had supposed`）。 |
| `boss[93]` | 【文法】Seldom ___ a promise whose exception | 2. 干擾選項設計不良 | 干擾項 `C. had encountered they` 與 `D. they encountered had` 為明顯語序錯亂的假英文。 | 改為 `C. did they encountered`、`D. have they encounter` 或其他時態（如 `C. they encountered`、`D. would they have encounter` 改為合法時態 `have they encountered`）。 |
| `boss[97]` | 請唸出：忠於字句不能決定是否忠於目的 | 3. 難度不符 C2（口說超長） | `ans` `"FIDELITY TO WORDS DOES NOT SETTLE FIDELITY TO PURPOSE"` 共 **9 個單字**，超過 `PLAN.md` 4–8 字上限，且直接照搬同批 `normal[276]` 聽力題句型。 | 精簡為 7 字：`"VERBAL FIDELITY NEVER GUARANTEES FIDELITY TO PURPOSE"`。 |
| `boss[107]` | 請唸出：單憑新奇不會使料理卓越 | 3. 難度不符 C2（口說超長） | `ans` `"NOVELTY ALONE DOES NOT CONFER DISTINCTION ON A DISH"` 共 **9 個單字**，超過 `PLAN.md` 4–8 字上限。 | 精簡為 6 字：`"NOVELTY ALONE NEVER CONFERS CULINARY DISTINCTION"`。 |
| `boss[108]` | 請拼出：極其講究而不易滿足的（F 開頭，10 個字母） | 5. 重複或近似模板題 | 與 `normal[234]` 100% 重複（同為 `spell` `FASTIDIOUS`），且同批 `normal[320]`（voice `A FASTIDIOUS ATTENTION TO DETAIL`）直接洩題。 | 改考美食評論相關 C2 詞彙（如 `GOURMANDISE` 或 `EPICUREAN`）。 |
| `boss[117]` | 請唸出：表面證實反映搜尋內建的預期 | 3. 難度不符 C2（口說超長） | `ans` `"THE APPARENT CONFIRMATION REFLECTS EXPECTATIONS BUILT INTO THE SEARCH"` 共 **9 個單字**，超過 `PLAN.md` 4–8 字上限。 | 精簡為 6 字：`"APPARENT CONFIRMATION REFLECTS PRECONCEIVED SEARCH EXPECTATIONS"`。 |
| `boss[127]` | 請唸出：相同手法應適用相同判斷標準 | 1. 拼字風險／3. 口說超長 | `ans` `"THE SAME TACTIC SHOULD INVITE THE SAME STANDARD OF JUDGEMENT"` 高達 **10 個單字**（超上限），且使用英式拼法 `JUDGEMENT`（美式 `JUDGMENT`）。 | 精簡並改為美式 7 字：`"IDENTICAL TACTICS WARRANT IDENTICAL STANDARDS OF JUDGMENT"`。 |
| `boss[143]` | 【文法】The policy is least generous to thos | 2. 干擾選項設計不良 | 干擾項 `B. who their`（關係代名詞與所有格疊用）為基礎語法錯誤之假英文。 | 改為 `B. whom` 或 `B. of which`。 |
| `boss[147]` | 請唸出：共同擁有需要的不只是沒有私人物品 | 3. 難度不符 C2（口說超長） | `ans` `"SHARED OWNERSHIP REQUIRES MORE THAN THE ABSENCE OF PERSONAL BELONGINGS"` 高達 **10 個單字**，違反 `PLAN.md` 4–8 字上限。 | 精簡為 7 字：`"GENUINE STEWARDSHIP REQUIRES MORE THAN NONOWNERSHIP"`（6 字）。 |
| `boss[149]` | 填空題：I N T R _ N S _ G E _ T (不願妥協或讓步的) | 5. 重複或近似模板題 | 考 `INTRANSIGENT`，與 `normal[259]`（voice `INTRANSIGENT`）、`normal[27]`（spell `INTRANSIGENCE`）、`normal[28]`（fill `INTRANSIGENCE`）重複。 | 改考 `OBDURATE` 或 `RECALCITRANT`。 |
| `boss[157]` | 請唸出：框架可能限制參與者能有意義貢獻的內容 | 3. 難度不符 C2（口說超長） | `ans` `"A FRAMEWORK MAY CONSTRAIN WHAT PARTICIPANTS CAN MEANINGFULLY CONTRIBUTE"` 共 **9 個單字**，超過 `PLAN.md` 4–8 字上限。 | 精簡為 6 字：`"RIGID FRAMEWORKS CONSTRAIN MEANINGFUL PARTICIPANT CONTRIBUTIONS"`。 |
| `boss[168]` | 請拼出：回顧過往而作的（R 開頭，13 個字母） | 3. 難度不符 C2（字彙偏易） | `RETROSPECTIVE` 為 B2/C1 常見字，作為 C2 `boss` `difficulty: 3` 拼字題難度偏低，且與 `normal[759]`（reading `retrospective`）重複。 | 改考第 17 批紀念物主題 C2 詞彙（如 `ELEGIAC` 或 `MEMORIALIZATION`）。 |
| `boss[169]` | 填空題：C O _ M E _ O R _ T E (以特定行動保存對人或事的紀 | 3. 難度不符 C2／5. 同批重複 | `COMMEMORATE` 為 B2 常用動詞，放在 C2 `boss` `difficulty: 3` 偏易，且同批 `normal[498]` 已考 `COMMEMORATIVE`。 | 改考 `ENSHRINE` 或 `IMMORTALIZE` 以外之 C2 字彙（如 `HALLOW` 或 `APOTHEOSIZE`）。 |
| `boss[177]` | 請唸出：避談主題反使它更難被忽略 | 3. 難度不符 C2（口說超長） | `ans` `"AVOIDING THE SUBJECT MAKES ITS PRESENCE HARDER TO IGNORE"` 共 **9 個單字**，超過 `PLAN.md` 4–8 字上限。 | 精簡為 7 字：`"AVOIDING THE SUBJECT MAKES IT MORE CONSPICUOUS"`。 |
| `boss[178]` | 請拼出：幽默或批評尖銳帶諷刺的（M 開頭，7 個字母） | 5. 重複或近似模板題 | 與同批 `normal[535]` 100% 重複（同批同為 `type: "spell"`、`ans: "MORDANT"`），且 `boss[59]` 已考過 `MORDANT` 填空。 | 改考 `SCATHING`、`INCISIVE` 或 `ACRIMONIOUS`。 |
| `boss[184]` | 【文法】So far from ___ the ambiguity, the a | 2. 干擾選項設計不良 | 干擾項 `B. having resolve`（`having` + 原形動詞 `resolve`）為明顯假英文。 | 改為 `B. having been resolved` 或 `B. being resolved`。 |
| `boss[197]` | 請唸出：放棄嘗試可能揭露成功到訪掩蓋的界限 | 3. 難度不符 C2（口說超長） | `ans` `"ABANDONED ATTEMPTS MAY REVEAL LIMITS THAT SUCCESSFUL VISITS CONCEAL"` 共 **9 個單字**，超過 `PLAN.md` 4–8 字上限。 | 精簡為 7 字：`"ABANDONED ATTEMPTS REVEAL LIMITS SUCCESSFUL VISITS CONCEAL"`。 |
| `boss[198]` | 請拼出：使某觀點或需求獲得優先地位（P 開頭，9 個字母） | 3. 難度不符 C2／2. 同批洩題 | 題幹雖取動詞義，但拼寫單字為 B1/B2 常見字 `PRIVILEGE`，作為 C2 `boss` `difficulty: 3` 拼字題過於簡單；且同批 `boss[190]` 聽力題已出現 `privileged`。 | 改考 `FOREGROUND` 或 `PRIORITIZE` 以外之 C2 詞彙（如 `HEGEMONIZE` 或 `NATURALIZE`）。 |
| `boss[207]` | 請唸出：角色知道更多時重複動作的作用會改變 | 3. 難度不符 C2（口說超長） | `ans` `"A REPEATED GESTURE CHANGES FORCE WHEN THE CHARACTER KNOWS MORE"` 高達 **10 個單字**，違反 `PLAN.md` 4–8 字上限。 | 精簡為 7 字：`"REPEATED GESTURES SHIFT MEANING THROUGH NEW KNOWLEDGE"`。 |
| `boss[208]` | 請拼出：鋪陳期待後不如預期的收尾或轉折（A 開頭，10 個字母） | 2. 同批直接洩題 | 同批前 5 題的 `boss[203]`（`【字彙】An anticlimax is ___.`）已在題幹直接印出單字 `anticlimax` 並在選項 D 給出完整定義，`boss[208]` 再考拼出 `ANTICLIMAX` 形同送分。 | 將 `boss[208]` 改考 `PERIPETEIA` 或 `CATACHRESIS`。 |
| `boss[209]` | 填空題：S E N _ I M E _ T A _ I T Y (過分感傷而偏離 | 2. 同批洩題／3. 難度偏低 | 同批 `boss[201]` 聽力題已出現 `sentimentality`，且 `SENTIMENTALITY` 為 B2 透明衍生字，作為 `boss` `difficulty: 3` 偏簡單。 | 改考 `MAWKISHNESS` 或 `SCHMALTZ`。 |
| `boss[217]` | 請唸出：預設體諒不能代替決策說明 | 3. 難度不符 C2（口說超長） | `ans` `"ASSUMED SYMPATHY CANNOT REPLACE AN EXPLANATION OF THE DECISION"` 共 **9 個單字**，超過 `PLAN.md` 4–8 字上限。 | 精簡為 6 字：`"ASSUMED SYMPATHY NEVER REPLACES CANDID EXPLANATION"`。 |
| `boss[219]` | 填空題：P R E _ U M _ T U _ U S (未有權限或未經同意就冒 | 5. 重複或近似模板題 | 與同批 `normal[655]`（spell `PRESUMPTUOUS`）同批重複考同一單字拼寫。 | 改考 `IMPERTINENT` 或 `OVERWEENING`。 |
| `boss[228]` | 請拼出：使原本熟悉之物顯得陌生的感受或效果（E 開頭，12 個字母） | 2. 同批洩題／3. 衍生字重複 | 同批 `boss[220]`（listening）與 `boss[226]`（voice `AN ESTRANGING CLARITY OF LIGHT`）已兩度出現 `estranging`，直接提示 `ESTRANGEMENT` 字根。 | 改考 `DEFAMILIARIZATION` 或 `ALIENATION`。 |
| `boss[229]` | 填空題：C O N _ E M _ L A _ I V E (帶有安靜沉思意味的 | 5. 重複或近似模板題 | 與同批 `normal[679]`（voice `CONTEMPLATIVE`）重複考同一單字。 | 改考 `MEDITATIVE`、`RUMINATIVE` 或 `COGITATIVE`。 |
| `boss[233]` | 【字彙】A gratuitous addition is one that is | 5. 重複或近似模板題 | 考 `gratuitous`，與同批 `normal[691]`（listening）及 `normal[715]`（spell `GRATUITOUS`）同批連考三次。 | 改考 `SUPERFLUOUS` 或 `OTIOSE`。 |
| `boss[234]` | 【指涉】The review doubts whether the saving | 4. 英文自然度與繁中說明瑕疵 | `explain` 寫作 `"initial lowprice被承認，爭點在後續替換累計。"`，將英文 `low price` 誤黏為 `lowprice` 且與中文無空白。 | 修正 `explain` 為 `"initial low price 被承認，爭點在後續替換的累計成本。"`。 |
| `boss[237]` | 請唸出：真實差異未必回應既有需求 | 3. 難度不符 C2（口說超長） | `ans` `"A REAL DIFFERENCE NEED NOT ANSWER AN EXISTING NEED"` 共 **9 個單字**，超過 `PLAN.md` 4–8 字上限。 | 精簡為 7 字：`"GENUINE DIFFERENCES NEED NOT ADDRESS EXISTING NEEDS"`。 |
| `boss[247]` | 請唸出：敘述者所知未必屬角色 | 3. 難度不符 C2（口說超長） | `ans` `"KNOWLEDGE HELD BY THE NARRATOR NEED NOT BELONG TO THE CHARACTER"` 高達 **11 個單字**，違反 `PLAN.md` 4–8 字上限。 | 精簡為 7 字：`"NARRATORIAL KNOWLEDGE NEED NOT BELONG TO CHARACTERS"`。 |
| `boss[248]` | 請拼出：不能合理否認或爭辯的（I 開頭，16 個字母） | 5. 重複或近似模板題 | 與同批 `normal[739]`（voice `INCONTROVERTIBLE`）同批重複考同一單字。 | 將 `boss[248]` 改考 `IRREFUTABLE` 或 `INDISPUTABLE`。 |
| `boss[249]` | 填空題：I M _ U T _ T _ O N (把通常不利的行為或動機歸給他人 | 2. 同批直接洩題 | 緊鄰的前 3 題 `boss[246]`（voice `AN UNWARRANTED IMPUTATION OF MOTIVE`）直接顯示完整單字 `IMPUTATION`，使 `boss[249]` 填空題失去測驗效果。 | 將 `boss[249]` 改考 `INSINUATION` 或 `ASPERSION`。 |
| `boss[253]` | 【字彙】To adjudicate a dispute is to ___. | 5. 重複或近似模板題 | 與同批 `normal[750]`（listening `adjudicative`）及 `normal[775]`（spell `ADJUDICATE`）同批連考三次。 | 改考 `ARBITRATE` 或 `CONCILIATE`。 |
| `boss[254]` | 【文法】So narrow is the exception that invo | 2. 干擾項瑕疵／4. 說明黏字 | 干擾項 `A. have not materially`、`C. do not material`、`D. not materially does` 為違反主詞動詞一致與詞性的明顯假英文；且 `explain` 將 `invoking it` 誤黏為 `invokingit`（`"invokingit動名詞單數，does not +原形alter。"`）。 | 將干擾項改為 `A. is not materially`、`C. would not materially`（搭配時態辨析）、`D. did not materially`；並修正 `explain` 為 `"invoking it 為動名詞片語作單數主詞，接 does not + 原形動詞 alter。"`。 |
| `boss[256]` | 請唸出：有裁量空間卻仍有理由的判斷 | 1. 答案唯一性／拼字判讀風險 | `ans` 為 `"A DISCRETIONARY BUT REASONED JUDGEMENT"`，使用英式 `JUDGEMENT`，`en-US` 語音辨識預設轉寫為 `JUDGMENT`。 | 改為 `"A DISCRETIONARY BUT REASONED JUDGMENT"`。 |
| `boss[257]` | 請唸出：共同許可可能需僅一方有的資源 | 3. 難度不符 C2（口說超長） | `ans` `"A SHARED PERMISSION MAY REQUIRE RESOURCES ONLY ONE PLAYER POSSESSES"` 高達 **10 個單字**，違反 `PLAN.md` 4–8 字上限。 | 精簡為 7 字：`"SHARED PERMISSIONS MAY REQUIRE UNEQUALLY HELD RESOURCES"`。 |
| `boss[263]` | 【字彙】Verisimilitude is ___. | 5. 重複或近似模板題 | 與同批 `normal[798]`（voice `VERISIMILITUDE`）、`normal[804]`（spell `VERISIMILITUDE`）及第 6 批 `normal[176]`（spell `VERISIMILITUDE`）四度重複。 | 改考 `AUTHENTICITY` 以外之 C2 詞彙（如 `PLAUSIBILITY` 或 `CREDIBILITY` 之進階近義字 `VERIDICALITY`）。 |
| `boss[267]` | 請唸出：保留複雜性不必損說話者尊嚴 | 1. 標點判讀風險 | `ans` `"PRESERVING COMPLEXITY NEED NOT DIMINISH THE SPEAKER'S DIGNITY"` 含有所有格撇號 `SPEAKER'S`，若語音比對未剝除撇號易產生誤判。 | 改為無撇號之對等表達：`"PRESERVING COMPLEXITY NEED NOT DIMINISH PERSONAL DIGNITY"`（7 字）。 |
| `boss[268]` | 請拼出：資訊透過某過程或媒介而被呈現的中介（M 開頭，9 個字母） | 2. 同批洩題／3. 難度偏低 | 同批 `boss[265]`（reading）與 `boss[266]`（voice `A CAREFULLY MEDIATED RECOLLECTION`）已連續出現 `mediated`，且 `MEDIATION` 為 B2/C1 常見字。 | 改考 `REFRACTION` 或 `INTERPOSITION`。 |
| `boss[277]` | 請唸出：最後沉默不給先前使人期待的安心保證 | 3. 難度不符 C2（口說超長） | `ans` `"THE FINAL SILENCE WITHHOLDS THE REASSURANCE WE HAVE BEEN LED TO EXPECT"` 高達 **12 個單字**，嚴重違反 `PLAN.md` 4–8 字上限。 | 精簡為 7 字：`"FINAL SILENCE WITHHOLDS THE EXPECTED EMOTIONAL REASSURANCE"`。 |
| `boss[279]` | 填空題：D I _ S E _ B L _ N G (掩飾真實感受或意圖而裝出別 | 5. 重複或近似模板題 | 考 `DISSEMBLING`，與 `normal[59]`（spell `DISSEMBLE`）及 `boss[19]`（fill `DISSEMBLE`）重複。 | 改考 `SIMULATION` 或 `FEIGNING`。 |
| `boss[287]` | 請唸出：保證原本令人印象深刻，直到限制條件被說明 | 3. 難度不符 C2（口說超長） | `ans` `"THE ASSURANCE WAS IMPRESSIVE UNTIL ITS QUALIFICATIONS WERE MADE EXPLICIT"` 高達 **10 個單字**，違反 `PLAN.md` 4–8 字上限。 | 精簡為 7 字：`"EXPLICIT QUALIFICATIONS QUICKLY UNDERMINED THE IMPRESSIVE ASSURANCE"`。 |
| `boss[288]` | 請拼出：刻意以含糊或迂迴說法避開真話（P 開頭，13 個字母） | 5. 重複或近似模板題 | 考 `PREVARICATION`，與同批 `normal[864]`（spell `PREVARICATE`）在同一批內重複考同字根拼寫。 | 改考 `EQUIVOCATION` 或 `SUBTERFUGE`。 |
| `boss[289]` | 填空題：C I R _ U M L _ C U _ I O N (以冗長迂迴說法 | 5. 重複或近似模板題 | 與同批 `normal[865]`（spell `CIRCUMLOCUTION`）100% 同單字（同批同時考 `CIRCUMLOCUTION` 的 `spell` 與 `fill`！），且 `boss[218]` 已考 `CIRCUMLOCUTORY`。 | 改考 `PERIPHRASIS` 或 `VERBIAGE`。 |
| `boss[293]` | 【字彙】A sartorial choice is a choice conce | 5. 重複或近似模板題 | 與同批 `normal[870]`（listening `sartorial restraint`）及 `normal[894]`（spell `SARTORIAL`）同批連考三次 `sartorial`。 | 改考 `VESTIMENTARY` 或 `HABERDASHERY`。 |
| `boss[297]` | 請唸出：打破慣例也可能形成自己的慣例 | 3. 難度不符 C2（口說超長） | `ans` `"A DEPARTURE FROM CONVENTION CAN DEVELOP CONVENTIONS OF ITS OWN"` 高達 **10 個單字**，違反 `PLAN.md` 4–8 字上限。 | 精簡為 7 字：`"DEPARTURES FROM CONVENTION OFTEN DEVELOP NEW CONVENTIONS"`。 |
| `boss[298]` | 請拼出：為給人某種印象而故作的姿態或行為（A 開頭，11 個字母） | 5. 重複或近似模板題 | 考 `AFFECTATION`，與同批 `normal[871]`（listening `an affectation of simplicity`）及 `normal[888]`（voice `AFFECTATION`）同批連考三次。 | 將 `boss[298]` 改考 `MANNERISM` 或 `ARTIFICIALITY`。 |
| `boss[306]` | 請唸出單字：指涉依賴說話者所處語境的 | 5. 重複／題型結構不一致 | 前 30 批 `boss` 的第 7 題（`+6`，`difficulty: 2`）皆為「請唸出：…」片語題，唯獨 `boss[306]` 變成單字題 `DEICTIC`；且 `DEICTIC` 已於同批 `normal[902]`（listening）與 `normal[929]`（fill `DEICTIC`）連考三次。 | 改為片語題，如 `"A DEICTIC SHIFT IN PERSPECTIVE"`（5 字），或改考 `"AN UNEXAMINED CARTOGRAPHIC CONVENTION"`。 |
| `boss[307]` | 請唸出：我們應區分座標的準確性與敘述所宣稱的權威。 | 3. 口說超長／4. 格式不一致 | `ans` `"WE SHOULD DISTINGUISH THE ACCURACY OF THE COORDINATES FROM THE AUTHORITY CLAIMED FOR THE ACCOUNT"` 高達 **15 個單字**！嚴重違反 `PLAN.md` 4–8 字上限，且 `desc` 末尾多出句號「。」。 | 刪除 `desc` 句號，並濃縮為 7 字短句：`"ACCURATE COORDINATES NEVER GUARANTEE NARRATIVE AUTHORITY"`（6 字）。 |
| `boss[309]` | 填空題：R E P R _ S E N _ A T I _ N A L (與如何 | 3. 難度不符 C2（字彙偏易） | `REPRESENTATIONAL` 為 B2 基礎字 `representation` 加 `-al` 的透明衍生字，作為 C2 最終批次 `boss` `difficulty: 3` 壓軸填空題難度過低。 | 改考 `CARTOGRAPHIC`、`TOPOGRAPHICAL` 或 `CHOROGRAPHIC`。 |

---

## 三、其餘同類批次問題補充清單

1. **第 23～31 批（`normal[660..929]`、`boss[220..309]`）`explain` 欄位系統性中英黏字**：
   - 前 22 批（`normal[0..659]`、`boss[0..219]`）的 `explain` 均維持良好的中英空格排版；但自第 23 批（`normal[660]` / `boss[220]`）起，為壓縮字數，幾乎每題 `explain` 皆省去中英文之間的空白（共計約 90 餘題，例如 `normal[810]` `"plangent常指深沉哀婉而迴響的聲音"`、`normal[820]` `"stentorian形容聲音洪亮有力"`、`boss[270]` `"not…absence否定修辭消失；ceases to announce指其不顯著"`、`boss[280]` `"except揭露beautifully flexible為反諷"`）。
   - 更嚴重的是，在壓縮空白時誤把多個獨立英文單字連寫成錯字：
     - `normal[720]`：`nonsequitur`（應為 `non sequitur`）
     - `normal[737]`：`couldhardlyhavefailed`（應為 `could hardly have failed`）
     - `normal[753]`：`notboth`（應為 `not both`）
     - `normal[790]`：`ownvoice`（應為 `own voice`）
     - `boss[234]`：`lowprice`（應為 `low price`）
     - `boss[254]`：`invokingit`（應為 `invoking it`）
   - **建議修正**：對 `r8.json` 所有 `explain` 執行正規表達式排版修正，先還原上述 6 處英文黏字，再於 `([a-zA-Z])([\u4e00-\u9fff])` 與 `([\u4e00-\u9fff])([a-zA-Z])` 之間補上半形空白。

2. **同批次內部「聽／讀／說／寫」詞彙過度重疊（同批互洩答案）**：
   - 多數批次在設計 30 題 `normal` + 10 題 `boss` 時，將同一個核心單字同時放進該批的聽力／閱讀題幹，又在同批結尾考 `spell` 或 `fill`：
     - 第 1 批：`circumspection`（`normal[19]` voice、`normal[26]` spell、`boss[8]` fill）、`specious`（`normal[29]` spell、`boss[9]` fill）
     - 第 2 批：`magnanimity`（`normal[48]` voice、`normal[54]` spell、`normal[55]` fill）、`nonchalance`（`normal[50]` voice、`normal[57]` spell、`normal[58]` fill）
     - 第 18 批：`mordant`（`normal[535]` spell、`boss[178]` spell）
     - 第 21 批：`anticlimax`（`boss[203]` reading 題幹直接給出、`boss[208]` spell）
     - 第 22 批：`presumptuous`（`normal[655]` spell、`boss[219]` fill）
     - 第 25 批：`imputation`（`boss[246]` voice、`boss[249]` fill）
     - 第 29 批：`circumlocution`（`normal[865]` spell、`boss[289]` fill）、`prevaricate/prevarication`（`normal[864]` spell、`boss[288]` spell）
     - 第 30 批：`sartorial`（`normal[870]` listening、`normal[894]` spell、`boss[293]` reading）、`affectation`（`normal[871]` listening、`normal[888]` voice、`boss[298]` spell）
     - 第 31 批：`deictic`（`normal[902]` listening、`normal[929]` fill、`boss[306]` voice）
   - **建議修正**：同一批次內，若某單字已作為 `spell` 或 `fill` 的答案，應避免在同批的 `reading` 題幹或 `voice` 題直接印出該單字，以免玩家在同一關卡或連續抽題時直接看到拼法。

3. **語用與論證題（`discourse`）修辭句型高度同構**：
   - 全題庫約有超過 150 題聽力與閱讀題採用完全相同的二元對比框架：`"X is not Y, but Z"`、`"To show X is not yet to establish Y"`、`"X does not by itself establish Y"`、`"X may coexist with Y"`（總結為「形式／表面上的禮貌、完整、中立、道歉、彈性，不等於實質上的同意、公平、原諒、解決」）。
   - 雖然單題邏輯嚴密且防堵了「只看長句／只看保留詞（`may`）」的猜題捷徑，但連續作答時語感相當同質。建議未來微調時，可將部分題目改為具體語境中的隱喻辨析、反語層次比較或雙重否定轉折，以豐富 C2 語篇體裁的多樣性。
