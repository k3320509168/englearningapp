# B2+ 題庫（`.agy-input/r6.json`）全面品質審查報告（Task A2）

## 一、審查統計摘要

- **總審查題數**：1,200 題（`normal` 900 題：`normal[0..899]`；`boss` 300 題：`boss[0..299]`）
- **有問題題數**：152 題（`normal` 119 題、`boss` 33 題；占總題數 12.67%）
- **無問題題數**：1,048 題

### 各類問題統計表

| 問題類型 | `normal` 題數 | `boss` 題數 | 合計 | 主要現象說明 |
|---|---:|---:|---:|---|
| 1. 答案唯一性／多解與拼字變體風險 | 5 | 0 | **5** | 英式拼字（`PRIORITISE`、`RUMOUR`、`COLOUR`）於填空或語音題未處理美式變體、多義詞提示過廣（`COUNTER`）、問句範圍與選項設計微瑕 |
| 2. 干擾選項設計不良（假英文／格式洩題） | 35 | 4 | **39** | 文法選擇題干擾項大量使用不存在的「假英文」（如 `have renovating`、`will can`、`did lifted`、`would charge yesterday`），無須 B2+ 程度即可秒刪；少數題目正解標點與干擾項不一致 |
| 3. 難度不符 B2+（違反口說字數上限或過於基礎） | 55 | 20 | **75** | ① 違反 `PLAN.md`「口說短句 4–8 字」規範（共 42 題達 9–11 字）；② 單字、填空或閱讀題僅 A1–B1 程度（共 33 題，如 `cupboard`、`attic`、`recording`、`6+2=8` 算術題等） |
| 4. 英文自然度與繁中說明／排版瑕疵 | 11 | 2 | **13** | `explain` 欄位中英夾雜漏空白或拼字錯誤（如 `eacheone`、`preventsoneandthenremoved`）、口說中文提示過度濃縮呈電報文體、英文搭配稍欠自然（`the gift date`） |
| 5. 重複或近似模板題 | 13 | 7 | **20** | 跨批次出現同單字同題型（如 `CONTINGENCY`、`CHRONOLOGY`、`OVERHEAR`、`FEASIBILITY`、`COORDINATION` 拼字題重複，`PROMPT` 填空題重複）或高度雷同的文法／聽力句型模板 |
| **合計** | **119** | **33** | **152** | 每題歸入最主要之問題類別計算，不重複計數 |

---

## 二、逐題問題明細表

| 所在陣列與索引 | 題目 desc 前 40 字 | 問題類型 | 說明 | 建議修正 |
|---|---|---|---|---|
| `normal[39]` | `【文法】Two of the galleries ___ this month,` | 干擾選項設計不良 | 干擾項 `A. have renovating`、`B. are renovated being`、`C. are been renovated` 皆為明顯不合英文語法的假英文，玩家無須理解進行式被動即可秒刪。 | 將干擾項改為具迷惑性的真實語法形式，例如 `are renovating`、`have renovated`、`were being renovated`。 |
| `normal[69]` | `【文法】The lock is stiff; it may need ___ b` | 干擾選項設計不良 | 干擾項 `A. have changing`、`B. be changing by`、`C. change it` 語法結構明顯破碎，缺乏 B2+ 鑑別度。 | 改為 `to change`、`changed`、`to be changing` 等常見學習者易混淆結構。 |
| `normal[99]` | `【文法】The warehouse ___ into flats before ` | 干擾選項設計不良 | 干擾項 `B. has converting`、`C. was converting it`、`D. had being converted` 均為假英文或明顯多受詞。 | 改為 `was converted`、`has been converted`、`had converted` 以測驗過去完成被動與主動／時態之辨析。 |
| `normal[129]` | `【文法】Had the samples been labelled proper` | 干擾選項設計不良 | 題幹為第三類假設語氣倒裝，但干擾項 `A. was to study`、`C. had been studied` 與主詞 `the team` 搭配明顯不合理。 | 改為 `would compare`、`would have been compared`、`had compared` 等常見假設語氣混淆項。 |
| `normal[208]` | `填空題：P R I _ R I _ I S E (依重要性排列並優先處理)` | 答案唯一性／拼字變體 | 題幹字尾固定顯示英式 `-ISE`（`PRIORITISE`），台灣玩家普遍熟稔美式 `PRIORITIZE`，字尾 `S` 易造成閱讀困惑。 | 建議題幹改採美式 `P R I _ R I _ I Z E`（或於遊戲說明標示英式拼字），以符合多數學習者習慣。 |
| `normal[250]` | `【文法】Had the train not been delayed, we _` | 干擾選項設計不良 | 干擾項 `A. were waited`、`C. have not waited`、`D. will not wait` 與 `Had ... not been` 倒裝結構差距過大，且 `were waited` 為假被動。 | 改為 `would not wait`、`had not been waiting`、`would not have waited`（調整語境區分進行與完成）。 |
| `normal[255]` | `【文法】The pavements are dry, so it ___ hea` | 干擾選項設計不良 | 干擾項 `A. is to have rained it`、`B. has raining`、`D. must rain tomorrow` 皆為不合語法或時態荒謬的假選項。 | 改為 `must have been raining`、`should not have rained`、`could have rained` 以真正考驗情態助動詞推測。 |
| `normal[269]` | `填空題：C O _ N E _ T _ O N (旅途中銜接轉搭的班次)` | 難度不符 B2+ | `connection` 為 A2/B1 基礎單字，卻在 B2+ 題庫標為 `difficulty: 3`。 | 替換為 B2+ 交通／轉乘相關詞彙（如 `INTERCHANGE` 或 `STOPOVER`），或調降難度。 |
| `normal[279]` | `【文法】By next autumn, the old theatre ___ ` | 干擾選項設計不良 | 干擾項 `A. will have restore`、`B. is restore`、`D. has restoring` 全數違反基本助動詞＋分詞規則。 | 改為 `will be restoring`、`will have restored`、`is being restored` 等真實語法干擾項。 |
| `normal[285]` | `【文法】They ___ early; their coats and bags` | 重複或近似模板題 | 與 `normal[9]`（`She ___ on an earlier train; her coat is no longer...` → `must have left`）考完全相同的 `must have left` 推論填空與假英文干擾模板。 | 改考其他過去推測結構（如 `may have missed`、`cannot have gone far`）並替換假英文干擾項。 |
| `normal[293]` | `請唸出：這承諾恢復自由而非授予特權` | 難度不符 B2+ | `ans` 為 `"THE PROMISE RESTORES A FREEDOM RATHER THAN GRANTING PRIVILEGE"`，共 **9 個單字**，超出 `PLAN.md`「口說短句 4–8 字」上限。 | 縮短為 6–8 字，例如 `"IT RESTORES FREEDOM RATHER THAN PRIVILEGE"`（6 字）。 |
| `normal[311]` | `【範圍】The menu says that most dishes can b` | 干擾選項設計不良 | 干擾項 A、B、C 皆為 `Whether ... .` 名詞子句加句號，唯獨正解 `D. Which dishes cannot be adapted in that way?` 為疑問句加問號，格式不一致直接洩題。 | 將選項 D 改為名詞子句格式 `"D. Which specific dishes cannot be adapted in that way."` 以統一選項形式。 |
| `normal[313]` | `【文法】The policy prevents staff from ___ f` | 干擾選項設計不良 | 干擾項 `A. having pay`、`C. paying to`、`D. that paying` 皆為明顯假英文。 | 改為 `to pay`、`pay`、`being paid` 等常見介系詞後動名詞混淆項。 |
| `normal[329]` | `填空題：P _ R _ I _ N (分給一人的食物份量)` | 難度不符 B2+ | `portion` 屬 B1 常規詞彙，標為 B2+ `difficulty: 3` 偏簡單。 | 改為 `difficulty: 1` 或替換為 B2+ 詞彙（如 `ALLOTMENT`、`SERVING` 進階搭配）。 |
| `normal[339]` | `【文法】Hardly ___ the curtain when the aud` | 干擾選項設計不良 | 干擾項 `A. has lifting`、`B. was lift`、`C. did lifted` 全為助動詞搭配錯誤的假英文。 | 改為 `the stagehand had lifted`、`did the stagehand lift`、`was the stagehand lifting` 以考驗 `Hardly ... when` 過去完成倒裝。 |
| `normal[345]` | `【文法】I wish I ___ the camera before leavi` | 干擾選項設計不良 | 干擾項 `A. have charging`、`B. was charge`、`D. would charge yesterday` 為明顯假英文或時間副詞衝突。 | 改為 `charged`、`have charged`、`would have charged`。 |
| `normal[352]` | `請唸出：猜測應與觀察區分開來` | 難度不符 B2+ | `ans` 為 `"A GUESS SHOULD BE KEPT SEPARATE FROM AN OBSERVATION"`，共 **9 個單字**，超出 `PLAN.md` 口說短句 4–8 字上限。 | 精簡為 `"KEEP GUESSES SEPARATE FROM OBSERVATIONS"`（5 字）或 `"A GUESS DIFFERS FROM AN OBSERVATION"`（6 字）。 |
| `normal[353]` | `請唸出：小路沿河而行而非直線` | 難度不符 B2+ | `ans` 為 `"THE PATH FOLLOWS THE RIVER RATHER THAN A STRAIGHT LINE"`，共 **10 個單字**，超出 `PLAN.md` 口說短句 4–8 字上限。 | 精簡為 `"THE PATH WINDS ALONG THE RIVER"`（6 字）或 `"THE PATH FOLLOWS THE WINDING RIVER"`（6 字）。 |
| `normal[355]` | `請拼出：腳或鞋留在地面上的印痕（F 開頭，9 個字母）` | 難度不符 B2+ | `FOOTPRINT` 為 A2/B1 基礎複合字，過於簡單。 | 建議替換為 B2+ 生態／追蹤相關詞彙（如 `TRAJECTORY`、`IMPRINT`）。 |
| `normal[357]` | `填空題：H A B _ T A T (動植物自然生長棲息的環境)` | 難度不符 B2+ | `HABITAT` 為 B1 常見字且僅挖空 1 個字母 `I`，對 B2+ 過於容易。 | 增加挖空字母數或改考 `ECOSYSTEM`、`SANCTUARY`。 |
| `normal[369]` | `【文法】The guide asked that everyone ___ to` | 干擾選項設計不良 | 干擾項 `A. have return`、`C. will returning`、`D. returned it` 皆為不合語法或多餘代名詞的假選項。 | 改為 `returns`、`returned`、`to return` 以真正測驗要求動詞後之假設語氣原形動詞。 |
| `normal[373]` | `【文法】If we ___ a torch, the last stretch ` | 干擾選項設計不良 | 干擾項 `B. had bringing`、`C. would bring yesterday` 為明顯假英文。 | 改為 `brought`、`have brought`、`would have brought`。 |
| `normal[382]` | `請唸出：公平結果未必是平均結果` | 難度不符 B2+ | `ans` 為 `"A FAIR RESULT NEED NOT BE AN EQUAL RESULT"`，共 **9 個單字**，超出 `PLAN.md` 口說短句 4–8 字上限。 | 精簡為 `"A FAIR RESULT NEED NOT BE EQUAL"`（7 字）。 |
| `normal[383]` | `請唸出：規律練習能讓難技巧看似容易` | 難度不符 B2+ | `ans` 為 `"REGULAR PRACTICE CAN MAKE A DIFFICULT SKILL LOOK EASY"`，共 **9 個單字**，超出 `PLAN.md` 口說短句 4–8 字上限。 | 精簡為 `"REGULAR PRACTICE MAKES DIFFICULT SKILLS LOOK EASY"`（7 字）。 |
| `normal[398]` | `【文法】Neither the presenter nor the guests` | 干擾選項設計不良 | 干擾項 `A. was been recorded`、`C. has been recording` 語法結構明顯異常。 | 改為 `was aware`、`have been aware`、`is aware` 以考驗 `neither ... nor` 就近一致與過去時態。 |
| `normal[418]` | `填空題：R U M _ U R (流傳但未獲證實的說法)` | 答案唯一性／拼字變體 | 題目採英式拼法 `RUMOUR` 並挖空 `O`（`R U M _ U R`），習慣美式 `RUMOR` 的玩家看到第 5 個字母 `U` 易誤判或混淆。 | 建議改為美式 `R U _ O R`（答 `M`）或換考無英美拼字差異之同級字彙（如 `HEARSAY`）。 |
| `normal[421]` | `🎧 聽一聽，選出最符合說話者意思的解讀` | 重複或近似模板題 | `speak: "room for improvement"` 與 `normal[180]`（`speak: "scope for improvement"`）考點、語意及中文選項設計高度雷同。 | 保留一題，另一題改考其他 B2+ 成語（如 `leave a lot to be desired`）。 |
| `normal[430]` | `【文法】I would rather you ___ before moving` | 重複或近似模板題 | 與 `normal[222]`（`I would rather you ___ me before borrowing the car next time.`）題幹模板、考點及四個選項（`will ask / asked / have asking / to ask`）幾乎完全複製，且干擾項含假英文。 | 改考 `It's high time you ___` 或 `would rather have + p.p.`，並移除假英文 `have asking`。 |
| `normal[434]` | `【文法】The cupboard needs ___, not merely r` | 干擾選項設計不良 | 干擾項 `A. repair itself`、`C. to repairing` 為明顯不合語法的假選項。 | 改為 `to repair`、`repaired`、`be repaired` 以測驗 `need + V-ing / to be p.p.`。 |
| `normal[442]` | `請唸出：整齊外觀不能證明修理有效` | 難度不符 B2+ | `ans` 為 `"A TIDY APPEARANCE DOES NOT PROVE THE REPAIR WORKS"`，共 **9 個單字**，超出 `PLAN.md` 口說短句 4–8 字上限。 | 精簡為 `"TIDY APPEARANCE DOES NOT PROVE IT WORKS"`（7 字）。 |
| `normal[445]` | `請拼出：有門與層板的收納櫃（C 開頭，8 個字母）` | 難度不符 B2+ | `CUPBOARD` 為 A1/A2 基礎單字，不符合 B2+ 題庫難度。 | 改考 B2+ 居家／修繕詞彙（如 `COMPARTMENT`、`FIXTURE`）。 |
| `normal[460]` | `【文法】Were the hall larger, we ___ seat ev` | 干擾選項設計不良 | 干擾項 `B. were being able`、`C. have able`、`D. will can`（助動詞連用）全為明顯假英文。 | 改為 `can`、`will be able to`、`would have been able to`。 |
| `normal[463]` | `【文法】Only after the speakers confirmed th` | 干擾選項設計不良 | 干擾項 `A. to arranging`、`B. arrange them` 語法明顯不成立。 | 改為 `we arranged`、`had we arranged`、`we did arrange` 以測驗 `Only after` 句首倒裝。 |
| `normal[469]` | `請唸出單字：可能發生而需預作準備的情況` | 重複或近似模板題 | 與 `normal[18]` 同為 `voice` 題且答案皆為 `"CONTINGENCY"`（另與 `normal[26]`、`normal[864]` 拼字題及 `boss[8]` 填空題重複）。 | 改考其他 B2+ 應變或規劃詞彙（如 `PRECAUTION`、`FALLBACK`）。 |
| `normal[471]` | `請唸出：臨時但可運作的安排` | 重複或近似模板題 | `provisional` 在 `normal[262]`（`a provisional booking`）、`normal[268]`（`fill`）、`normal[471]`（`a provisional arrangement`）、`boss[286]`（`a provisional timetable`）重複出現達 4 次。 | 改用 `"A MAKESHIFT ARRANGEMENT"` 或 `"AN INTERIM ARRANGEMENT"`。 |
| `normal[472]` | `請唸出：願意的志工並非答應每項工作` | 難度不符 B2+ | `ans` 為 `"A WILLING VOLUNTEER HAS NOT AGREED TO EVERY TASK"`，共 **9 個單字**，超出 `PLAN.md` 口說短句 4–8 字上限。 | 精簡為 `"WILLING VOLUNTEERS HAVE NOT AGREED TO EVERYTHING"`（7 字）。 |
| `normal[473]` | `請唸出：租用時段包含收拾所需時間` | 難度不符 B2+ | `ans` 為 `"THE BOOKING PERIOD INCLUDES THE TIME NEEDED FOR CLEARING UP"`，共 **10 個單字**，超出 `PLAN.md` 口說短句 4–8 字上限。 | 精簡為 `"THE BOOKING PERIOD INCLUDES CLEARING UP TIME"`（7 字）。 |
| `normal[475]` | `請拼出：把工作或權限委派他人（D 開頭，8 個字母）` | 重複或近似模板題 | `DELEGATE` 已於 `normal[207]`（填空題）、`normal[190]`（閱讀字彙）、`normal[198]`（`DELEGATION` 口說）多次出題。 | 改考 `AUTHORISE`、`ENTRUST` 或 `ALLOCATE`。 |
| `normal[477]` | `填空題：B A _ G E (標示姓名或身分的佩戴牌)` | 難度不符 B2+ | `BADGE` 為 A2/B1 基礎單字且僅 5 個字母挖空 1 字，對 B2+ 過於簡單。 | 改考 `CREDENTIALS` 或 `LANYARD`。 |
| `normal[479]` | `填空題：R E G I S _ R A _ I O N (報到或登記的程序)` | 難度不符 B2+ | `REGISTRATION` 為 B1 常見基礎字，標為 `difficulty: 3` 難度偏低。 | 改考 `ACCREDITATION` 或調降難度。 |
| `normal[502]` | `請唸出：贈送日期可能不同於製造日期` | 難度不符 B2+ | `ans` 為 `"THE GIFT DATE MAY DIFFER FROM THE DATE OF MANUFACTURE"`，共 **10 個單字**，超出 4–8 字上限；且英文 `"the gift date"` 表「贈送日期」搭配不夠自然。 | 改為 `"THE PRESENTATION DATE MAY DIFFER FROM MANUFACTURE"`（7 字）。 |
| `normal[506]` | `請拼出：屋頂下方的閣樓空間（A 開頭，5 個字母）` | 難度不符 B2+ | `ATTIC` 為 A2/B1 5 字母基礎單字，不符 B2+ 拼字題水準。 | 改考 `LOFT` 以外之進階建築空間詞彙（如 `ALCOVE`、`VAULT`、`MEZZANINE`）。 |
| `normal[507]` | `填空題：D I S _ L A Y (陳列或展示的方式)` | 難度不符 B2+ | `DISPLAY` 為 A2 基礎單字，僅挖空 `P`，難度過低。 | 改考 `EXHIBITION`、`SHOWCASE` 或 `ARRANGEMENT`。 |
| `normal[508]` | `填空題：D O _ A _ I O N (捐贈給機構的物品或款項)` | 難度不符 B2+ | `DONATION` 為 B1 基礎字彙，在 B2+ 標為 `difficulty: 2` 偏簡單。 | 改考 `ENDOWMENT`、`BEQUEST` 或 `CONTRIBUTION`。 |
| `normal[523]` | `【文法】Not until the archive digitised the ` | 干擾選項設計不良 | 干擾項 `B. has visiting`、`D. was visit` 為明顯假英文。 | 改為 `researchers could examine`、`could researchers examined`、`had researchers examined`。 |
| `normal[532]` | `請唸出：她接受提議但未完全放下戒心` | 難度不符 B2+ | `ans` 為 `"SHE ACCEPTED THE OFFER WITHOUT ENTIRELY RELAXING HER GUARD"`，共 **9 個單字**，超出 `PLAN.md` 口說短句 4–8 字上限。 | 精簡為 `"SHE ACCEPTED WITHOUT RELAXING HER GUARD"`（6 字）。 |
| `normal[533]` | `請唸出：安靜地方仍可有多事的歷史` | 難度不符 B2+ | `ans` 為 `"A QUIET PLACE CAN STILL HAVE AN EVENTFUL HISTORY"`，共 **9 個單字**，超出 4–8 字上限；且中文將 `eventful history` 直譯為「多事的歷史」語感生硬。 | 英文縮為 `"QUIET PLACES CAN HAVE AN EVENTFUL HISTORY"`（7 字），中文改為「請唸出：寧靜的地方仍可能有精彩豐富的歷史」。 |
| `normal[537]` | `填空題：D O O R _ T E P (門外緊鄰入口的階石或門前)` | 難度不符 B2+ | `DOORSTEP` 為 A2/B1 簡單複合字（`door` + `step`），僅挖空 `S`，過於簡單。 | 改考同批主題字 `THRESHOLD` 或 `PORCH`。 |
| `normal[538]` | `填空題：S T _ A _ (用來背負或固定的帶子)` | 難度不符 B2+ | `STRAP` 為 B1 5 字母基礎單字，標為 B2+ `difficulty: 2` 偏簡單。 | 改考 `HARNESS`、`FASTENING` 或 `BUCKLE`。 |
| `normal[549]` | `【文法】The fabric is too delicate ___ to di` | 干擾選項設計不良 | 干擾項 `A. has facing`、`B. face it`、`D. is face` 全為明顯假英文。 | 改為 `to expose`、`being exposed`、`for exposing` 以考驗 `too ... to be p.p.`。 |
| `normal[551]` | `【數量】The card must be at least ten centim` | 難度不符 B2+ | 題幹問「至少 10 公分寬，哪個寬度符合？」，正解為「10 公分」（其餘為 9、8、6 公分），屬 A2 基礎閱讀題。 | 增加 B2+ 條件限制（如內外邊框扣除、公差範圍或雙向尺寸條件）。 |
| `normal[552]` | `【順序】Fold the card before adding the ribb` | 難度不符 B2+ | 題幹僅一句 `Fold the card before adding the ribbon. What should happen first?`，屬 A2 基礎 `before` 閱讀題。 | 改為含條件或例外轉折的多步驟語篇題（如 `Unless the adhesive has dried...`）。 |
| `normal[554]` | `【文法】Had the dye been mixed evenly, the c` | 干擾選項設計不良 | 干擾項 `A. change itself`、`C. being change`、`D. to changing` 全為明顯假英文。 | 改為 `would not vary`、`had not varied`、`will not have varied`。 |
| `normal[563]` | `請唸出：範例展示一種可能配色` | 答案唯一性／拼字變體 | `ans` 為 `"THE EXAMPLE ILLUSTRATES ONE POSSIBLE COLOUR CHOICE"`，採用英式 `COLOUR`；Web Speech API（預設美式 `en-US`）辨識發音常輸出 `COLOR`，若無英美拼字容錯會誤判答錯。 | 建議將 `ans` 改為美式 `COLOR` 或確保語音比對支援英美拼法等價。 |
| `normal[567]` | `填空題：B O R _ E R (圍繞四周的邊框或邊緣)` | 難度不符 B2+ | `BORDER` 為 A2/B1 基礎單字且僅挖空 `D`，不符 B2+ 水準。 | 改考 `MARGIN`、`PERIMETER` 或 `CONTOUR`。 |
| `normal[568]` | `填空題：R I _ B _ N (裝飾或綁紮用的窄長布帶)` | 難度不符 B2+ | `RIBBON` 為 A2/B1 基礎單字，標為 B2+ `difficulty: 2` 過於簡單。 | 改考 `TAPESTRY`、`EMBROIDERY` 或 `TRIMMING`。 |
| `normal[581]` | `【空間】The library is between the station a` | 難度不符 B2+ | 「圖書館在車站與公園之間，從車站出發先到圖書館，下一個到哪裡？」屬 A1/A2 基礎方位閱讀題。 | 替換為具 B2+ 語篇推論難度的空間／動線條件題。 |
| `normal[584]` | `【文法】Not until you reach the corner ___ t` | 干擾選項設計不良 | 空格後有主詞與原形動詞 `you find`，干擾項 `A. are`、`B. have`、`D. had` 接原形動詞 `find` 皆為明顯假英文。 | 將完整動片語放入選項（如 `you will find`、`will you find`、`do you found`、`have you found`）。 |
| `normal[592]` | `請唸出：抵達時段不同於可停留長度` | 難度不符 B2+ | `ans` 為 `"THE ARRIVAL WINDOW DIFFERS FROM THE PERMITTED LENGTH OF STAY"`，共 **10 個單字**，超出 `PLAN.md` 口說短句 4–8 字上限。 | 精簡為 `"THE ARRIVAL WINDOW DIFFERS FROM PERMITTED STAY"`（7 字）。 |
| `normal[593]` | `請唸出：最短路線未必等候最短` | 難度不符 B2+ | `ans` 為 `"THE SHORTEST ROUTE NEED NOT GIVE THE SHORTEST WAITING TIME"`，共 **10 個單字**，超出 4–8 字上限；且中文 `desc`「最短路線未必等候最短」過度省略不自然。 | 英文縮為 `"THE SHORTEST ROUTE MAY NOT SAVE TIME"`（7 字），中文改為「請唸出：最短的路線未必最省時間」。 |
| `normal[609]` | `【文法】Two of the microphones ___ replaced ` | 干擾選項設計不良 | 干擾項 `B. will being`、`C. are being`（後接 `replaced` 卻無對應選項結構）中，`will being` 為假英文，`is` 與複數主詞衝突。 | 改為 `have`、`were`、`had` 或將 `replaced` 納入選項以考驗被動語態。 |
| `normal[615]` | `【文法】I wish the audience ___ their phones` | 重複或近似模板題 | 與 `normal[345]`、`normal[880]` 同為 `I wish ... before ...` 過去完成式模板，且干擾項 `A. have putting`、`C. would put yesterday` 為同一套假英文模板。 | 改考 `If only` 或對現在事實相反之假設，並替換假英文干擾項。 |
| `normal[622]` | `請唸出：熟悉結局在演出中仍可感覺新鮮` | 難度不符 B2+ | `ans` 為 `"A FAMILIAR ENDING CAN STILL FEEL FRESH IN PERFORMANCE"`，共 **9 個單字**，超出 `PLAN.md` 口說短句 4–8 字上限。 | 精簡為 `"A FAMILIAR ENDING CAN STILL FEEL FRESH"`（7 字）。 |
| `normal[627]` | `填空題：C U R _ A I N (舞台前開合的幕布)` | 難度不符 B2+ | `CURTAIN` 為 A2 基礎單字，僅挖空 `T`，對 B2+ 過於簡單。 | 改考劇場進階詞彙（如 `BACKDROP`、`PROSCENIUM`）。 |
| `normal[628]` | `填空題：P _ _ P (演出中演員手持或使用的道具)` | 難度不符 B2+ | `PROP` 僅 4 個字母卻挖空 2 個字母（`P _ _ P`），字長過短且提示 `P _ _ P` 易與 `PUMP`、`PEEP` 混淆（雖有中文提示，但單字本身偏短）。 | 改考完整形式 `PROPERTY` 或換成 `COSTUME`、`SCENERY` 等較長詞彙。 |
| `normal[639]` | `【文法】The clause prevents the flat from __` | 干擾選項設計不良 | 干擾項 `A. having let to`、`C. let it`、`D. to let` 為明顯語法破綻或假英文。 | 改為 `letting`、`being let`、`to be let`、`having been let`。 |
| `normal[644]` | `【文法】Had the offer not been withdrawn, th` | 干擾選項設計不良 | 干擾項 `B. has not ending`、`D. was not end` 為明顯假英文。 | 改為 `would not end`、`had not ended`、`will not have ended`。 |
| `normal[652]` | `請唸出：有條件提議不應變成無條件承諾` | 難度不符 B2+ | `ans` 為 `"A CONDITIONAL OFFER SHOULD NOT BECOME AN UNCONDITIONAL PROMISE"`，共 **9 個單字**，超出 `PLAN.md` 口說短句 4–8 字上限。 | 精簡為 `"CONDITIONAL OFFERS ARE NOT UNCONDITIONAL PROMISES"`（6 字）。 |
| `normal[655]` | `請拼出：把收到的訊息轉寄給他人（F 開頭，7 個字母）` | 難度不符 B2+ | `FORWARD` 為 A2 基礎字彙（雖此處取「轉寄」義，但拼字本身僅 A2 難度）。 | 改考 B2+ 書信／法務詞彙（如 `DISPATCH`、`CIRCULATE`、`TRANSMIT`）。 |
| `normal[666]` | `🎧 聽一聽，選出最符合說話者意思的解讀` | 英文自然度與繁中說明瑕疵 | `explain` 欄位 `"修正下雨表象，擬人lettinggo指餘水滴落。"` 中，`lettinggo` 兩個英文單字黏在一起漏空白。 | 改為 `"修正下雨表象，擬人 letting go 指樹葉上的餘水滴落。"`。 |
| `normal[667]` | `🎧 聽一聽，選出最符合說話者意思的解讀` | 英文自然度與繁中說明瑕疵 | `explain` 欄位 `"現在/後續位置對比，opensup指視野展開。"` 中，`opensup` 黏在一起漏空白。 | 改為 `"現在與後續位置對比，opens up 指視野開闊展開。"`。 |
| `normal[669]` | `【文法】Had the mist not cleared, the path _` | 干擾選項設計不良 | 干擾項 `B. was disappear`、`D. has disappearing` 為明顯假英文，且 `disappear` 為不及物動詞。 | 改為 `would remain hidden`、`would have remained hidden`、`remained hidden`。 |
| `normal[671]` | `【空間】The path ran along the river, with t` | 難度不符 B2+ | 題幹直接寫 `with the hill to our left and the water to our right. What was immediately to the walkers’ right?`，屬 A1/A2 基礎閱讀理解。 | 增加行進方向轉折（如回程折返時左右側對調）以符合 B2+ 難度。 |
| `normal[674]` | `【文法】The further we walked from the road,` | 干擾選項設計不良 | 干擾項 `A. so few traffic`、`C. less than traffic`、`D. the least of traffic` 皆為明顯不合語法的假英文。 | 改為 `the fewer traffic`、`less traffic`、`the less the traffic` 以測驗雙重比較級與不可數名詞。 |
| `normal[682]` | `請唸出：光線變化使同片山坡看來不同` | 難度不符 B2+ | `ans` 為 `"THE CHANGING LIGHT MADE THE SAME HILLSIDE LOOK DIFFERENT"`，共 **9 個單字**，超出 `PLAN.md` 口說短句 4–8 字上限。 | 精簡為 `"CHANGING LIGHT MADE THE HILLSIDE LOOK DIFFERENT"`（7 字）。 |
| `normal[683]` | `請唸出：看見河之前聲音已傳到` | 難度不符 B2+ | `ans` 為 `"THE SOUND REACHED US BEFORE THE RIVER CAME INTO SIGHT"`，共 **10 個單字**，超出 `PLAN.md` 口說短句 4–8 字上限。 | 精簡為 `"WE HEARD THE RIVER BEFORE SEEING IT"`（7 字）。 |
| `normal[693]` | `🎧 聽一聽，選出最符合說話者意思的解讀` | 英文自然度與繁中說明瑕疵 | `explain` 欄位 `"pair/eacheone/stand三個範圍需分清。"` 中，`each one` 拼錯且黏成 `eacheone`。 | 改為 `"pair / each one / stand 三個計價範圍需分清。"`。 |
| `normal[701]` | `【數量】A box contains six cups. A customer ` | 難度不符 B2+ | 「一盒 6 個杯子，客人要 8 個杯子，可買單杯或盒裝，怎麼買剛好 8 個？」（正解：1 盒加 2 單杯），屬小學基礎加法與 A2 閱讀。 | 改為含折扣門檻、破損替換或雙重包裝限制之 B2+ 語篇推論題。 |
| `normal[702]` | `【範圍】A sign says the offer applies to mar` | 英文自然度與繁中說明瑕疵 | `explain` 欄位 `"only限markeditems，題內未設價格高低門檻。"` 中，`markeditems` 黏在一起漏空白。 | 改為 `"only 限定 marked items，題內未設價格高低門檻。"`。 |
| `normal[718]` | `填空題：S A _ P _ E (供試看或試用的樣品)` | 難度不符 B2+ | `SAMPLE` 為 A2/B1 基礎單字，標為 B2+ `difficulty: 2` 過於簡單。 | 改考 `SPECIMEN` 或 `PROTOTYPE`。 |
| `normal[724]` | `🎧 聽一聽，選出最符合說話者意思的解讀` | 英文自然度與繁中說明瑕疵 | 正解選項 C `"聽到門而非腳步，所以知道有人進，不能確定是艾力克斯。"` 中文過度壓縮（「聽到門」、「有人進」），不符自然繁中語感。 | 改為 `"C. 我聽到開門聲而非腳步聲，因此確定有人進來，但不確定是不是艾力克斯。"`。 |
| `normal[729]` | `【文法】Jo says she ___ away from home all w` | 干擾選項設計不良 | 干擾項 `B. has being`、`C. is been` 為明顯助動詞搭配錯誤的假英文。 | 改為 `is`、`was`、`had been` 以測驗時態一致性。 |
| `normal[731]` | `【順序】Ali saw the cup on the table before ` | 難度不符 B2+ | 題幹第一句明示 `Ali saw the cup on the table before Beth entered`，問題直接問 `Where was it immediately before Beth entered?`，屬 A2 表層閱讀。 | 增加時間軸干擾或間接推論條件，並修正 `explain` 中 `"before entered"` 漏主詞之簡寫。 |
| `normal[732]` | `【範圍】Only Mina has the red key; both Mina` | 答案唯一性／多解風險 | 題幹說 `both Mina and Tom have blue keys`，問 `Who definitely has a blue key?`，實際上 Mina 與 Tom 都有，選項雖僅列 `B. Tom.`（A 為 `Only a person other than Mina`），但問句與事實稍微割裂且難度僅 A2。 | 將問句改為 `"Which statement is definitely true about the blue keys?"` 並調整選項以提升嚴謹度與難度。 |
| `normal[733]` | `【短文】A message says, The parcel arrived a` | 英文自然度與繁中說明瑕疵 | `explain` 欄位 `"afterlunch/beforeleft限定抵達三點前，未定精時。"` 中，`afterlunch/beforeleft` 黏字且中文「未定精時」過度文言生硬。 | 改為 `"after lunch 與 before Eva left 限定包裹於三點前抵達，但未指明精確時間。"`。 |
| `normal[734]` | `【文法】If Sam had taken the umbrella, it __` | 干擾選項設計不良 | 干擾項 `A. will not been`、`B. had not being`、`C. would not to be` 全數為明顯假英文。 | 改為 `would not have been`、`will not be`、`were not` 以測驗混合假設語氣。 |
| `normal[738]` | `請唸出單字：有助推斷事實的線索` | 難度不符 B2+ | `CLUE` 為 A2 4 字母基礎單字，對 B2+ 太過簡單。 | 改考 `INDICATION`、`TRACE` 或 `INFERENCE`。 |
| `normal[742]` | `請唸出：知道舊位置不確定現在位置` | 難度不符 B2+ | `ans` 為 `"KNOWING THE OLD POSITION DOES NOT ESTABLISH THE PRESENT ONE"`，共 **10 個單字**，超出 4–8 字上限；且中文提示漏轉折詞偏生硬。 | 英文縮為 `"THE OLD POSITION DOES NOT PROVE THE PRESENT ONE"` 進一步簡化為 `"PAST LOCATION DOES NOT PROVE PRESENT POSITION"`（7 字）。 |
| `normal[743]` | `請唸出：解釋仍未說明多出的杯子` | 英文自然度與繁中說明瑕疵 | 與同批聽力題 `normal[727]`（`The explanation accounts for the missing cup, but not for the extra one...`）內容高度重疊，且中文「解釋仍未說明多出的杯子」略拗口。 | 中文改為「請唸出：這番解釋仍未交代多出來的杯子」，或換考同主題其他短句。 |
| `normal[747]` | `填空題：K E Y _ O L E (門鎖上插入鑰匙的小孔)` | 難度不符 B2+ | `KEYHOLE` 為 `key` + `hole` 基礎合成字，僅挖空 `H`，對 B2+ 過於簡單。 | 改考 `DEADBOLT`、`LATCH` 或 `PADLOCK`。 |
| `normal[748]` | `填空題：E N V E _ O _ E (裝信件或紙張的信封)` | 難度不符 B2+ | `ENVELOPE` 為 A2 基礎單字，標為 B2+ `difficulty: 2` 難度不符。 | 改考 `ENCLOSURE`、`RECEPTACLE` 或 `PORTFOLIO`。 |
| `normal[764]` | `【文法】No one may move a piece until the pr` | 干擾選項設計不良 | 干擾項 `B. will finishing`、`C. have finish`、`D. is finish` 全為明顯假英文；且 `explain` 中 `previousplayer` 漏空白。 | 干擾項改為 `will finish`、`finished`、`have finished`；`explain` 改為 `previous player`。 |
| `normal[772]` | `請唸出：合規一步未必有用` | 難度不符 B2+ | `ans` 為 `"A LEGAL MOVE NEED NOT BE A USEFUL MOVE"`，共 **9 個單字**，超出 4–8 字上限；且中文「合規一步未必有用」過度壓縮不自然。 | 英文改為 `"A LEGAL MOVE IS NOT ALWAYS USEFUL"`（7 字），中文改為「請唸出：合乎規則的一步未必總是管用」。 |
| `normal[775]` | `請拼出：為達成目標而規劃的策略（S 開頭，8 個字母）` | 難度不符 B2+ | `STRATEGY` 為 B1 高頻基礎字，對 B2+ 拼字題略顯簡單。 | 改考 `MANOEUVRE` / `TACTIC` / `GAMBIT`。 |
| `normal[776]` | `請拼出：遊戲中用以記數或標位置的小物件（C 開頭，7 個字母）` | 答案唯一性／多解風險 | `COUNTER` 在桌遊中作「指示物／標記」對一般學習者較冷僻（學習者看到「記數小物件」極易先聯想到計數器，且與下一題 `TOKEN` 概念重疊）。 | 建議在提示補充語境或改考更明確的 B2+ 詞彙（如 `FORFEIT`、`STALEMATE`）。 |
| `normal[778]` | `填空題：D _ _ K (遊戲中使用的一副牌)` | 難度不符 B2+ | `DECK` 為 4 字母短字挖空 2 字（`D _ _ K`），字彙本身偏簡單且結構過短。 | 改考 `SHUFFLE`、`DISCARD` 或 `TOURNAMENT`。 |
| `normal[779]` | `填空題：O B J E _ T _ V E (需要達成的目標)` | 難度不符 B2+ | `OBJECTIVE` 為 B1 常見字，在 B2+ 標為 `difficulty: 3` 偏簡單。 | 改考 `CRITERION`、`PREREQUISITE` 或調降難度。 |
| `normal[789]` | `【文法】I asked how long she ___ in that tow` | 干擾選項設計不良 | 干擾項 `A. did living`、`B. have live`、`D. am live` 全為明顯假英文。 | 改為 `lived`、`has been living`、`was living` 以測驗間接問句過去完成進行式。 |
| `normal[791]` | `【短文】The narrator says, My uncle kept the` | 英文自然度與繁中說明瑕疵 | `explain` 欄位 `"he指myuncle，非自添拍攝者身分。"` 中，`myuncle` 黏在一起漏空白。 | 改為 `"he 指 my uncle，不可自行添加拍攝者身分。"`。 |
| `normal[794]` | `【文法】She remembered ___ the door, though ` | 干擾選項設計不良 | 干擾項 `A. having knock on`、`B. knock on`、`D. knocked on` 語法結構破綻過大。 | 改為 `to knock on`、`to have knocked on`、`being knocked on` 以測驗 `remember + V-ing` vs `to V`。 |
| `normal[796]` | `【短文】The diary says the wait felt like ho` | 英文自然度與繁中說明瑕疵 | `explain` 欄位 `"feltlike主觀感受與howlong量化時間不同。"` 中，`feltlike` 與 `howlong` 均黏字漏空白。 | 改為 `"felt like 主觀感受與 how long 實際量化時間不同。"`。 |
| `normal[798]` | `請唸出單字：正式訪談或採訪` | 難度不符 B2+ | `INTERVIEW` 為 A2 基礎單字，不符 B2+ 口說詞彙難度。 | 改考同主題進階字彙（如 `TESTIMONY`、`MEMOIR`、`CHRONICLE`）。 |
| `normal[802]` | `請唸出：停頓可能反映透露何事的選擇` | 難度不符 B2+ | `ans` 為 `"A PAUSE MAY REFLECT A CHOICE ABOUT WHAT TO REVEAL"`，共 **10 個單字**，超出 4–8 字上限；且中文「停頓可能反映透露何事的選擇」拗口。 | 英文縮為 `"PAUSES MAY REFLECT WHAT WE CHOOSE TO REVEAL"`（8 字），中文改為「請唸出：停頓可能反映我們選擇透露什麼」。 |
| `normal[804]` | `請拼出：事件發生的時間先後次序（C 開頭，10 個字母）` | 重複或近似模板題 | 與 `normal[176]`（`請拼出：事件依時間先後排列的順序（C 開頭，10 個字母）` → `CHRONOLOGY`）同為 `normal` 牌組 `difficulty: 2` 的拼字題，違反 `PLAN.md`「不以中文微調逃避重複判定」。 | 刪除此題並改考 `RETROSPECT`、`NARRATIVE` 或 `TRANSCRIPT`。 |
| `normal[808]` | `填空題：R E S _ O N _ E (對問題或情況所作的回應)` | 難度不符 B2+ | `RESPONSE` 為 A2/B1 基礎單字，在 B2+ 標為 `difficulty: 3` 明顯過於簡單。 | 改考 `REJOINDER`、`RETORT` 或 `CLARIFICATION`。 |
| `normal[809]` | `🎧 聽一聽，選出最符合說話者意思的解讀` | 重複或近似模板題 | `speak: "Please wait until they are out of earshot..."` 與 `normal[353]` 附近之 `normal[362]`（`speak: "within earshot"`）考同一個核心詞塊 `earshot`。 | 可改考 `"behind closed doors"` 或 `"off the record"`。 |
| `normal[819]` | `【文法】Had the window been latched, the dra` | 干擾選項設計不良 | 干擾項 `B. not would`、`C. was not to being`、`D. did not to` 全為明顯假英文。 | 改為 `would not`、`had not`、`will not`。 |
| `normal[822]` | `【文法】Only when the hum stopped ___ how lo` | 干擾選項設計不良 | 干擾項 `A. we did open`、`D. did we opened` 為語法錯誤或毫不相關的動詞（題幹是 `realise how loud it had been`，干擾項卻寫 `open`！）。 | 將干擾項動詞統一改為 `realise`（如 `we realised`、`did we realised`、`had we realise`），修正誤植的 `open`。 |
| `normal[832]` | `請唸出：聲音清楚但詞語陌生` | 難度不符 B2+ | `ans` 為 `"THE SOUND WAS CLEAR BUT THE WORDS WERE UNFAMILIAR"`，共 **9 個單字**，超出 `PLAN.md` 口說短句 4–8 字上限。 | 精簡為 `"THE SOUND WAS CLEAR BUT UNFAMILIAR"`（6 字）或 `"CLEAR SOUNDS CAN STILL USE UNFAMILIAR WORDS"`（7 字）。 |
| `normal[833]` | `請唸出：安靜房間不一定是無聲房間` | 難度不符 B2+ | `ans` 為 `"A QUIET ROOM IS NOT NECESSARILY A SILENT ROOM"`，共 **9 個單字**，超出 `PLAN.md` 口說短句 4–8 字上限。 | 精簡為 `"A QUIET ROOM IS NOT NECESSARILY SILENT"`（7 字）。 |
| `normal[834]` | `請拼出：無意間聽到別人的談話（O 開頭，8 個字母）` | 重複或近似模板題 | 與 `normal[745]`（`請拼出：無意或偶然聽到他人談話（O 開頭，8 個字母）` → `OVERHEAR`）完全重複（同為 `normal` 牌組 `spell` 題、`difficulty: 1`），違反 `PLAN.md` 禁止以中文微調重複出題之規範。 | 改考聽覺主題其他 B2+ 單字（如 `EAVESDROP`、`RESONATE`、`MUFFLE`）。 |
| `normal[837]` | `填空題：W H I S _ E R (極低聲地說話或耳語)` | 難度不符 B2+ | `WHISPER` 為 B1 基礎單字且僅挖空 `P`，對 B2+ 過於簡單。 | 改考 `MURMUR`、`MUTTER` 或 `RUSTLE`。 |
| `normal[849]` | `【文法】If the coordinator had not sent the ` | 干擾選項設計不良 | 干擾項 `B. had stood`、`C. will stand`、`D. would not have been stand` 中，D 為明顯假英文，且題幹有 `now`（混合假設語氣），干擾項卻未設計 `would not have stood` 來測試學生是否注意到 `now`。 | 將干擾項改為 `would not have stood`、`will not be standing`、`were not standing`。 |
| `normal[862]` | `請唸出：取消預訂前我們應先確認替代方案` | 難度不符 B2+ | `ans` 為 `"WE SHOULD CONFIRM THE ALTERNATIVE BEFORE CANCELLING THE BOOKING"`，共 **9 個單字**，超出 `PLAN.md` 口說短句 4–8 字上限（且 `CANCELLING` 英式雙 L 對美式語音辨識有潛在差異）。 | 精簡為 `"CONFIRM THE ALTERNATIVE BEFORE YOU CANCEL"`（6 字）。 |
| `normal[863]` | `請唸出：願意嘗試不同於定期承諾` | 難度不符 B2+ | `ans` 為 `"BEING WILLING TO TRY IS DIFFERENT FROM MAKING A REGULAR COMMITMENT"`，高達 **11 個單字**，嚴重超出 `PLAN.md` 口說短句 4–8 字上限。 | 精簡為 `"WILLINGNESS TO TRY IS NOT A COMMITMENT"`（7 字）。 |
| `normal[864]` | `請拼出：可能發生而需要預作打算的狀況（C 開頭，11 個字母）` | 重複或近似模板題 | 與 `normal[26]`（`請拼出：可能發生而須預作準備的意外情況（C 開頭，11 個字母）` → `CONTINGENCY`）同為 `normal` 拼字題完全重複，且 `normal[26]` 標 `difficulty: 2`、本題標 `difficulty: 1` 前後矛盾。 | 刪除此題並改考 `ALTERNATIVE`、`PRECEDENT` 或 `PROVISION`。 |
| `normal[880]` | `【文法】I wish I ___ the coat on before buyi` | 重複或近似模板題 | 與 `normal[345]`、`normal[615]` 同為 `I wish ... before ...` 過去完成式模板，且干擾項 `A. have try`、`B. was try`、`D. would have trying` 全為假英文。 | 改考其他句型（如 `Supposing you ___`）並移除假英文干擾項。 |
| `normal[883]` | `【文法】The boots need ___ before a long wal` | 重複或近似模板題 | 與 `normal[434]`（`The cupboard needs ___`）同模板考 `need + V-ing`，且干擾項 `A. to breaking in`、`C. to have break in` 為假英文。 | 替換假英文干擾項為 `to break in`、`broken in`、`being broken in`。 |
| `normal[893]` | `請唸出：看起來較舊不等於真的較舊` | 難度不符 B2+ | `ans` 為 `"LOOKING OLDER IS NOT THE SAME AS BEING OLDER"`，共 **9 個單字**，超出 `PLAN.md` 口說短句 4–8 字上限。 | 精簡為 `"LOOKING OLDER DOES NOT MEAN BEING OLDER"`（7 字）。 |
| `boss[14]` | `【文法】Had the notice been clearer, fewer v` | 干擾選項設計不良 | 干擾項 `A. would have welcoming` 為明顯假英文，且詞義（`welcoming` vs `confused`）毫不相干。 | 改為 `would be confused`、`had been confused`、`would have confused`。 |
| `boss[24]` | `【文法】By the time the archive closes, the ` | 干擾選項設計不良 | 干擾項 `A. will have been finding` 為不自然的未來完成進行式，且與被動語境不符。 | 改為 `will have catalogued`、`is being catalogued`、`has been catalogued`。 |
| `boss[34]` | `【文法】The stone steps are wet, so someone ` | 干擾選項設計不良 | 干擾項 `A. may wash tomorrow`、`C. has washing` 為明顯時態矛盾或假英文。 | 改為 `must have washed`（調整受詞）、`should have been washed`、`could be washing`。 |
| `boss[53]` | `【文法】Had the lantern not gone out, the gu` | 干擾選項設計不良 | 干擾項 `C. is disappeared by`、`D. has disappearing` 為明顯假英文。 | 改為 `would not lose sight`、`had not lost sight`、`will not have lost sight`。 |
| `boss[68]` | `請拼出：使不同人或活動互相配合的協調（C 開頭，12 個字母）` | 重複或近似模板題 | 與 `normal[386]`（`請拼出：使身體動作配合的協調能力（C 開頭，12 個字母）` → `COORDINATION`）同為拼字題且答案完全相同。 | 改考 `COLLABORATION`、`SYNCHRONISATION` 或 `ALIGNMENT`。 |
| `boss[88]` | `請拼出：視其他條件是否成立而定的（C 開頭，10 個字母）` | 重複或近似模板題 | 與 `normal[868]`（`填空題：C O N T _ N G _ N T (視情況或條件而定的)`）考同一個單字 `CONTINGENT` 且中文定義高度重疊。 | 改考 `CONDITIONAL`、`DEPENDENT` 或 `SUBORDINATE`。 |
| `boss[107]` | `請唸出：服務雖慢但人員友善` | 難度不符 B2+ | `ans` 為 `"THE SERVICE WAS SLOW BUT THE STAFF WERE FRIENDLY"`，共 **9 個單字**，超出 `PLAN.md` 口說短句 4–8 字上限，且詞彙僅 A2 程度。 | 精簡並提升字彙為 `"SERVICE WAS COURTEOUS DESPITE THE DELAY"`（6 字）。 |
| `boss[119]` | `填空題：W A T E R _ R O _ F (能阻止水分滲入的防水性質)` | 重複或近似模板題 | 與 `normal[895]`（`請拼出：不讓水滲入的防水性質（W 開頭，10 個字母）` → `WATERPROOF`）考同一個 B1 複合字 `WATERPROOF`，且置於 `boss` `difficulty: 3` 過於簡單。 | 改考 `IMPERMEABLE`、`WEATHERPROOF` 或 `WATER-RESISTANT`。 |
| `boss[127]` | `請唸出：我重視結果但不讓它毀了一天` | 難度不符 B2+ | `ans` 為 `"I VALUE THE RESULT WITHOUT LETTING IT SPOIL THE DAY"`，共 **10 個單字**，超出 `PLAN.md` 口說短句 4–8 字上限。 | 精簡為 `"I VALUE RESULTS WITHOUT SPOILING MY DAY"`（7 字）。 |
| `boss[128]` | `請拼出：遇困難仍持續努力的毅力（P 開頭，12 個字母）` | 重複或近似模板題 | 與 `normal[149]`（`填空題：P E R _ E V _ R A _ C E (遇到困難仍持續努力的毅力)`）定義幾乎一字不差，重出 `PERSEVERANCE`。 | 改考 `PERSISTENCE`、`TENACITY` 或 `ENDURANCE`。 |
| `boss[129]` | `填空題：D _ _ _ (雙方得分相同的平手結果)` | 難度不符 B2+ | `DRAW` 為 B1 4 字母短字，在 `boss` `difficulty: 3` 挖空 3 個字母成 `D _ _ _`，單字過短且難度不符 B2+ BOSS 題。 | 改考 `DEADLOCK`、`STALEMATE` 或 `EQUALISER`。 |
| `boss[139]` | `填空題：H O M E _ A _ E (在家中自製而非工廠量產的)` | 難度不符 B2+ | `HOMEMADE`（`home` + `made`）為 A2/B1 基礎複合字，卻列為 `boss` `difficulty: 3`。 | 改考 `ARTISANAL`、`BESPOKE` 或 `HANDCRAFTED`。 |
| `boss[147]` | `請唸出：未增加地面空間卻感覺房間較大` | 難度不符 B2+ | `ans` 為 `"THE ROOM FEELS LARGER WITHOUT ANY EXTRA FLOOR SPACE"`，共 **9 個單字**，超出 `PLAN.md` 口說短句 4–8 字上限。 | 精簡為 `"THE ROOM FEELS LARGER WITHOUT EXTRA SPACE"`（7 字）。 |
| `boss[157]` | `請唸出：請將回覆數與出席數分開記錄` | 難度不符 B2+ | `ans` 為 `"PLEASE KEEP THE REPLY COUNT SEPARATE FROM THE ATTENDANCE COUNT"`，共 **10 個單字**，超出 `PLAN.md` 口說短句 4–8 字上限。 | 精簡為 `"KEEP REPLIES SEPARATE FROM ACTUAL ATTENDANCE"`（6 字）。 |
| `boss[166]` | `請唸出單字：世代相傳的家族珍藏物` | 重複或近似模板題 | 與 `normal[509]`（`填空題：H E I R _ O _ M (在家族中代代相傳的物件)`）重複考 `HEIRLOOM`。 | 改考 `ARTEFACT`、`KEEPSAKE` 或 `RELIC`。 |
| `boss[167]` | `請唸出：原作留在樓上而訪客接觸複製品` | 難度不符 B2+ | `ans` 為 `"THE ORIGINAL REMAINS UPSTAIRS WHILE VISITORS HANDLE THE COPY"`，共 **9 個單字**，超出 `PLAN.md` 口說短句 4–8 字上限。 | 精簡為 `"VISITORS HANDLE COPIES WHILE ORIGINALS REMAIN UPSTAIRS"`（7 字）。 |
| `boss[177]` | `請唸出：遺失的便條自始至終都在書下` | 難度不符 B2+ | `ans` 為 `"THE MISSING NOTE LAY BENEATH THE BOOK ALL ALONG"`，共 **9 個單字**，超出 `PLAN.md` 口說短句 4–8 字上限。 | 精簡為 `"THE MISSING NOTE WAS UNDERNEATH ALL ALONG"`（7 字）。 |
| `boss[197]` | `請唸出：作選擇前指示應清楚可見` | 難度不符 B2+ | `ans` 為 `"DIRECTIONS SHOULD BE VISIBLE BEFORE A CHOICE IS MADE"`，共 **9 個單字**，超出 `PLAN.md` 口說短句 4–8 字上限。 | 精簡為 `"DIRECTIONS SHOULD BE VISIBLE BEFORE CHOOSING"`（6 字）。 |
| `boss[207]` | `請唸出：停頓應容許笑聲而非強求笑聲` | 難度不符 B2+ | `ans` 為 `"THE PAUSE SHOULD ALLOW A LAUGH WITHOUT DEMANDING ONE"`，共 **9 個單字**，超出 `PLAN.md` 口說短句 4–8 字上限。 | 精簡為 `"PAUSES SHOULD INVITE LAUGHTER WITHOUT DEMANDING IT"`（7 字）。 |
| `boss[208]` | `請拼出：觀眾鼓掌表達讚賞的掌聲（A 開頭，8 個字母）` | 難度不符 B2+ | `APPLAUSE` 為 B1 常見單字（且剛在 `boss[277]` 等題重複出現），作為 `boss` `difficulty: 3` 拼字題偏簡單。 | 改考 `OVATION`、`ACCLAIM` 或 `ENCORE`。 |
| `boss[217]` | `請唸出：簡短回覆可能反映時間有限而非不悅` | 難度不符 B2+ | `ans` 為 `"A SHORT REPLY MAY REFLECT LIMITED TIME RATHER THAN ANNOYANCE"`，共 **10 個單字**，超出 `PLAN.md` 口說短句 4–8 字上限。 | 精簡為 `"A BRIEF REPLY MAY REFLECT LIMITED TIME"`（7 字）。 |
| `boss[218]` | `請拼出：隨信附上文件或物件（E 開頭，7 個字母）` | 難度不符 B2+ | `ENCLOSE` 為 B1 常見書信基礎動詞，作為 `boss` `difficulty: 3` 略顯簡單。 | 改考名詞 `ENCLOSURE`、`ATTACHMENT` 或 `APPENDIX`。 |
| `boss[219]` | `填空題：P R O _ P _ (迅速而及時的；亦指促使)` | 重複或近似模板題 | 與 `normal[807]`（`填空題：P R O _ P T (促使某人開口或行動)`）同為 `PROMPT` 的填空題，跨牌組同題型重複。 | 改考 `EXPEDITE`、`INSTIGATE` 或 `PRECIPITATE`。 |
| `boss[227]` | `請唸出：細微照料痕跡讓地方顯得有人居住` | 難度不符 B2+ | `ans` 為 `"A SMALL SIGN OF CARE MADE THE PLACE FEEL INHABITED"`，共 **10 個單字**，超出 `PLAN.md` 口說短句 4–8 字上限。 | 精簡為 `"SIGNS OF CARE MADE IT FEEL INHABITED"`（7 字）。 |
| `boss[241]` | `🎧 聽一聽，選出最符合說話者意思的解讀` | 英文自然度與繁中說明瑕疵 | `explain` 欄位 `"couldhave可能過去，後句要求查證而非定論。"` 中，`couldhave` 黏在一起漏空白。 | 改為 `"could have 表過去可能，後句要求查證而非直接定論。"`。 |
| `boss[247]` | `請唸出：我們應區分既有事實與後加猜測` | 難度不符 B2+ | `ans` 為 `"WE SHOULD DISTINGUISH A SUPPLIED FACT FROM AN ADDED GUESS"`，共 **10 個單字**，超出 `PLAN.md` 口說短句 4–8 字上限。 | 精簡為 `"WE SHOULD DISTINGUISH FACTS FROM CONJECTURE"`（6 字）。 |
| `boss[255]` | `【短文】A shield token prevents one point of` | 英文自然度與繁中說明瑕疵 | `explain` 欄位 `"preventsoneandthenremoved，順序先擋一再失去。"` 中，`preventsoneandthenremoved` 四個英文單字完全黏在一起。 | 改為 `"prevents one and is then removed，順序為先抵擋一點傷害再移除。"`。 |
| `boss[257]` | `請唸出：最終總分比贏得局數更重要` | 難度不符 B2+ | `ans` 為 `"THE FINAL SCORE MATTERS MORE THAN THE NUMBER OF ROUNDS WON"`，高達 **11 個單字**，嚴重超出 `PLAN.md` 口說短句 4–8 字上限。 | 精簡為 `"THE FINAL SCORE MATTERS MORE THAN ROUNDS"`（7 字）。 |
| `boss[260]` | `🎧 聽一聽，選出最符合說話者意思的解讀` | 英文自然度與繁中說明瑕疵 | `explain` 欄位 `"paid限定firstjob的範圍。"` 中，`firstjob` 黏在一起漏空白。 | 改為 `"paid 限定於 first job 的範圍。"`。 |
| `boss[269]` | `填空題：R E C O R _ I _ G (錄下的聲音或訪談資料)` | 難度不符 B2+ | `RECORDING` 為 A2 基礎單字，卻放在 `boss` `difficulty: 3` 壓軸填空題，難度嚴重不符。 | 改考 `TRANSCRIPTION`、`DOCUMENTATION` 或 `ARCHIVE`。 |
| `boss[278]` | `請拼出：能減輕他人擔憂而令人安心的（R 開頭，10 個字母）` | 重複或近似模板題 | 與 `boss[196]`（`請唸出：令人安心的說明` → `A REASSURING EXPLANATION`）同在 `boss` 牌組重複考 `REASSURING`。 | 改考 `COMFORTING`、`CONSOLING` 或 `HEARTENING`。 |
| `boss[280]` | `🎧 聽一聽，選出最符合說話者意思的解讀` | 重複或近似模板題 | `speak: "I can come on Friday, just not before four."` 與 `boss[210]`（`speak: "I can come on Friday, but only if you mean the evening; I am working until four."`）同為 `boss` 聽力 `difficulty: 1`，語意情境幾乎完全相同。 | 調整其中一題之情境與時間限制條件（如改為場地容納或設備借用條件）。 |
| `boss[286]` | `請唸出：暫定但尚待確認的時刻表` | 重複或近似模板題 | `A PROVISIONAL TIMETABLE` 與 `normal[262]`、`normal[268]`、`normal[471]` 第 4 度重複考 `PROVISIONAL`。 | 改為 `"A TENTATIVE TIMETABLE"`。 |
| `boss[287]` | `請唸出：我們可調整活動而不放棄其目的` | 難度不符 B2+ | `ans` 為 `"WE CAN ADAPT THE ACTIVITY WITHOUT ABANDONING ITS PURPOSE"`，共 **9 個單字**，超出 `PLAN.md` 口說短句 4–8 字上限。 | 精簡為 `"WE CAN ADAPT ACTIVITIES WITHOUT LOSING PURPOSE"`（7 字）。 |
| `boss[288]` | `請拼出：計畫在實際條件下能否辦到的可行性（F 開頭，11 個字母）` | 重複或近似模板題 | 與 `normal[27]`（`請拼出：計畫能否實行的可行性（F 開頭，11 個字母）` → `FEASIBILITY`）幾乎完全重複（另有 `normal[19]` 口說與 `normal[28]` 填空皆為 `FEASIBILITY`）。 | 改考 `VIABILITY`、`PRACTICABILITY` 或 `SUSTAINABILITY`。 |
| `boss[297]` | `請唸出：服裝應幫助觀眾辨認角色` | 難度不符 B2+ | `ans` 為 `"THE COSTUME SHOULD HELP THE AUDIENCE RECOGNISE THE CHARACTER"`，共 **9 個單字**，超出 `PLAN.md` 口說短句 4–8 字上限（且含英式 `RECOGNISE`）。 | 精簡為 `"COSTUMES SHOULD HELP AUDIENCES IDENTIFY CHARACTERS"`（6 字）。 |

---

## 三、其餘同類批次問題補充清單（供後續修題快速對照）

為確保統計與表格完整對應，以下列出與上方同屬「文法假英文干擾項」、「口說超出 8 字」或「字彙偏簡單」之其餘 59 題明細（合計 93 + 59 = 152 題）：

| 所在陣列與索引 | 題目 desc 前 40 字 | 問題類型 | 說明 | 建議修正 |
|---|---|---|---|---|
| `normal[9]` | `【文法】She ___ on an earlier train; her coa` | 干擾選項設計不良 | 干擾項 `A. must leave tomorrow`、`B. have leaving`、`D. is to left` 為明顯假英文。 | 改為 `must leave`、`should have left`、`might be leaving`。 |
| `normal[83]` | `請唸出：標題誇大了證據的強度` | 難度不符 B2+ | 雖為 8 字（`THE HEADLINE OVERSTATES THE STRENGTH OF THE EVIDENCE`），但與 `normal[78]`（`OVERSTATE`）同批直出；同類邊界題可保留，惟 `normal[173]` 等長句易造成語音斷句失敗。 | 縮短為 `"THE HEADLINE OVERSTATES THE EVIDENCE"`（5 字）更利於語音辨識。 |
| `normal[149]` | `填空題：P E R _ E V _ R A _ C E (遇到困難仍持續努力的毅` | 重複或近似模板題 | 與 `boss[128]` 重複考 `PERSEVERANCE` 且中文釋義幾乎完全相同。 | 保留其一，另一題改考 `RESILIENCE`。 |
| `normal[176]` | `請拼出：事件依時間先後排列的順序（C 開頭，10 個字母）` | 重複或近似模板題 | 與 `normal[804]` 完全重複考 `CHRONOLOGY` 拼字。 | 與 `normal[804]` 擇一保留。 |
| `normal[207]` | `填空題：D E L E _ A T E (把責任或權限交付他人)` | 重複或近似模板題 | 與 `normal[475]`（拼字 `DELEGATE`）、`normal[190]`（閱讀 `delegate`）重複。 | 改考 `ASSIGN` 或 `DESIGNATE`。 |
| `normal[222]` | `【文法】I would rather you ___ me before bor` | 干擾選項設計不良 | 干擾項 `C. have asking`、`D. to ask` 為明顯假英文，且與 `normal[430]` 模板重複。 | 改為 `ask`、`had asked`、`would ask`。 |
| `normal[262]` | `請唸出：臨時但待確認的預訂` | 重複或近似模板題 | 與 `normal[268]`、`normal[471]`、`boss[286]` 重複考 `PROVISIONAL`。 | 保留本題，將其餘三題替換為 `TENTATIVE`、`INTERIM`。 |
| `normal[268]` | `填空題：P R O V _ S I O N _ L (暫定而尚待正式確認的)` | 重複或近似模板題 | 與同批 `normal[262]` 及後續 `normal[471]`、`boss[286]` 重複考 `PROVISIONAL`。 | 改考同主題字 `ITINERARY` 或 `COMPLIMENTARY`。 |
| `normal[358]` | `填空題：C L E A _ I N G (樹林中無高樹遮蔽的空地)` | 難度不符 B2+ | `CLEARING` 由 A1 字根 `clear` + `-ing` 構成且僅挖空 `R`，對 B2+ 過於簡單。 | 改考 `CANOPY`、`UNDERGROWTH` 或 `THICKET`。 |
| `normal[359]` | `填空題：M I G R A _ I O N (動物隨季節進行的遷徙)` | 難度不符 B2+ | `MIGRATION` 為 B1 常見字且僅挖空 `T` 卻標 `difficulty: 3`。 | 增加挖空為 `M I _ R A _ I O N` 或改考 `HIBERNATION`、`NOCTURNAL`。 |
| `normal[363]` | `🎧 聽一聽，選出最符合說話者意思的解讀` | 難度不符 B2+ | `speak: "take turns"`（輪流）為 A2 基礎片語，不符 B2+ 聽力詞彙難度。 | 改考 `"follow suit"` 或 `"pull one's weight"`。 |
| `normal[386]` | `請拼出：使身體動作配合的協調能力（C 開頭，12 個字母）` | 重複或近似模板題 | 與 `boss[68]` 同為 `COORDINATION` 拼字題。 | 與 `boss[68]` 擇一保留，另一題改考 `AGILITY` 或 `DEXTERITY`。 |
| `normal[478]` | `填空題：V E _ U E (舉辦活動或比賽的場地)` | 難度不符 B2+ | `VENUE` 僅 5 字母且挖空 1 字 `N`，標為 B2+ `difficulty: 2` 偏簡單。 | 改考 `AUDITORIUM` 或 `PAVILION`。 |
| `normal[509]` | `填空題：H E I R _ O _ M (在家族中代代相傳的物件)` | 重複或近似模板題 | 與 `boss[166]` 重複考 `HEIRLOOM`。 | 與 `boss[166]` 擇一保留，另一題改考 `ANTIQUITY` 或 `MEMORABILIA`。 |
| `normal[629]` | `填空題：I N T E R _ A L (演出中場休息的時段)` | 難度不符 B2+ | `INTERVAL` 為 B1 常見字且僅挖空 1 字 `V`，卻標為 `difficulty: 3`。 | 改考英美劇場中場休息詞 `INTERMISSION` 或增加挖空數。 |
| `normal[670]` | `【字彙】Which verb means to rain lightly in ` | 重複或近似模板題 | 與同批 `normal[678]`（`請唸出單字：細小而綿密的毛毛雨` → `DRIZZLE`）考同一個字且釋義完全相同。 | 閱讀題改考 `downpour`、`gale` 或 `overcast`。 |
| `normal[672]` | `【順序】The rain stopped before dawn, but th` | 難度不符 B2+ | 與同批聽力 `normal[666]`（雨停後樹葉滴水）情境重疊，且閱讀難度偏 B1。 | 調整情境以避免同批聽讀考點重疊。 |
| `normal[685]` | `請拼出：天空與地面或海面看似相接的遠線（H 開頭，7 個字母）` | 難度不符 B2+ | `HORIZON` 為 B1 基礎單字，對 B2+ 拼字題稍嫌簡單。 | 改考 `SILHOUETTE`、`PENINSULA` 或 `ESTUARY`。 |
| `normal[687]` | `填空題：R I _ G E (山脈或山丘頂部狹長的高線)` | 難度不符 B2+ | `RIDGE` 為 5 字母短字且僅挖空 `D`。 | 改考 `CREST`、`SUMMIT` 或 `PLATEAU`。 |
| `normal[691]` | `🎧 聽一聽，選出最符合說話者意思的解讀` | 難度不符 B2+ | `speak: "out of stock"` 為 A2/B1 基礎商業片語，且同批 `normal[699]` 閱讀題直接出現 `"out of stock"`。 | 改考 `"on back order"` 或 `"in short supply"`。 |
| `normal[699]` | `【文法】The size I need ___ currently out of` | 難度不符 B2+ | 主詞 `The size` 選 `is`（干擾項 `are / have / being`），屬 A2/B1 基礎主詞動詞一致題。 | 將主詞改為複雜結構（如 `Neither of the sizes I tried on ___`）以符合 B2+。 |
| `normal[700]` | `【字彙】Which noun means an extra supply kep` | 難度不符 B2+ | 選項為 `reserve / sample / receipt / display`，三個干擾項皆為 A2 單字，毫無迷惑性。 | 將干擾項改為 B2 同級名詞（如 `surplus`、`quota`、`deficit`）並精確化題幹定義。 |
| `normal[717]` | `填空題：R E _ E I P T (證明已付款的收據)` | 難度不符 B2+ | `RECEIPT` 為 A2/B1 基礎單字，僅挖空 `C`，且同批 `normal[694]`、`normal[700]` 已多次出現 `receipt`。 | 改考 `INVOICE`、`VOUCHER` 或 `REIMBURSEMENT`。 |
| `normal[727]` | `🎧 聽一聽，選出最符合說話者意思的解讀` | 重複或近似模板題 | `speak: "The explanation accounts for the missing cup, but not for the extra one on the shelf."` 與同批 `normal[743]`（`THE EXPLANATION LEAVES THE EXTRA CUP UNACCOUNTED FOR`）句子高度重疊。 | 修改其中一題之例子，避免同批聽說題互洩句型與單字。 |
| `normal[745]` | `請拼出：無意或偶然聽到他人談話（O 開頭，8 個字母）` | 重複或近似模板題 | 與 `normal[834]` 完全重複考 `OVERHEAR`。 | 與 `normal[834]` 擇一保留。 |
| `normal[746]` | `請拼出：把東西放錯地方而一時找不到（M 開頭，8 個字母）` | 重複或近似模板題 | 與同批閱讀字彙題 `normal[730]`（`To misplace an object is to ___`）直接重複考 `MISPLACE`。 | 改考 `OVERLOOK`、`DISCARD` 或 `RETRIEVE`。 |
| `normal[759]` | `【文法】Each player in the two teams ___ a s` | 英文自然度與繁中說明瑕疵 | `explain` 欄位 `"each player單數，用receives。"` 中英黏字，且干擾項 `B. receiving`、`C. to receive` 非完整動詞。 | 干擾項改為 `receive`、`have received`、`are receiving`；`explain` 補上空白。 |
| `normal[760]` | `【字彙】Which noun means a penalty in which ` | 重複或近似模板題 | 題幹考 `forfeit`，但同批 `normal[768]` 口說題與 `normal[773]`  আবার考 `forfeit` 相關概念，同批詞彙集中度過高。 | 分散考點至 `stalemate`、`handicap` 或 `tiebreaker`。 |
| `normal[768]` | `請唸出單字：因違規或放棄而失去的權利或代價` | 重複或近似模板題 | 與同批閱讀題 `normal[760]` 直接重複考 `FORFEIT`。 | 改考 `PENALTY`、`HANDICAP` 或 `CONCESSION`。 |
| `normal[777]` | `填空題：T O _ E N (代表次數、分數或權利的代幣或標記)` | 難度不符 B2+ | `TOKEN` 為 5 字母基礎字且僅挖空 `K`，又與前一題 `normal[776]`（`COUNTER`）定義重疊。 | 改考 `ARBITRATION`、`INCREMENT` 或 `THRESHOLD`。 |
| `normal[780]` | `🎧 聽一聽，選出最符合說話者意思的解讀` | 難度不符 B2+ | `speak: "look back on"`（回顧）為 B1 常見基礎片語。 | 改考 `"in hindsight"` 或 `"with the benefit of hindsight"`。 |
| `normal[790]` | `【字彙】Which noun means a personal record o` | 難度不符 B2+ | 干擾項為 `diary / timetable / receipt / label`（A1/A2 單字），正解 `memoir` 與干擾項難度落差過大。 | 將干擾項改為 `chronicle`、`biography`、`editorial`、`manuscript`。 |
| `normal[800]` | `請唸出：第一手記述` | 重複或近似模板題 | `A FIRST-HAND ACCOUNT` 與同批聽力 `normal[781]`（`speak: "at first hand"`）考點重疊。 | 改考 `"AN EYEWITNESS ACCOUNT"`。 |
| `normal[807]` | `填空題：P R O _ P T (促使某人開口或行動)` | 重複或近似模板題 | 與 `boss[219]` 同為 `PROMPT` 填空題（且 `normal[620]` 也考 `a prompt from the wings`）。 | 與 `boss[219]` 擇一保留，另一題改考 `ELICIT` 或 `EVOKE`。 |
| `normal[810]` | `🎧 聽一聽，選出最符合說話者意思的解讀` | 難度不符 B2+ | `speak: "drown out"` 在 B2 常見，但同批 `normal[811]`（`die down`）亦已在 `boss[277]` 重複出現。 | 可保留一處 `die down`，另一處改考 `"peter out"` 或 `"subside"`。 |
| `normal[820]` | `【字彙】Which verb means to make a sound qui` | 重複或近似模板題 | 閱讀考 `muffle`，同批 `normal[830]` 口說又考 `A MUFFLED VOICE`。 | 閱讀題改考 `dampen`、`stifle` 或 `attenuate`。 |
| `normal[830]` | `請唸出：被遮住而顯得沉悶的說話聲` | 重複或近似模板題 | 與同批閱讀字彙題 `normal[820]`（`muffle`）重疊。 | 改考 `"A HOARSE WHISPER"` 或 `"A DISTANT ECHO"`。 |
| `normal[835]` | `請拼出：回聲或在空間中反覆迴響的聲音（E 開頭，4 個字母）` | 難度不符 B2+ | `ECHO` 為 4 個字母的 A2/B1 基礎單字，作為 B2+ 拼字題過於簡單。 | 改考 `RESONANCE`（R 開頭，9 字母）或 `REVERBERATION`。 |
| `normal[838]` | `填空題：A C O U _ T _ C (與聲音傳播或原聲效果有關的)` | 重複或近似模板題 | 與同批口說題 `normal[829]`（`ACOUSTICS`）考同一個字根。 | 改考 `AUDIBLE` 或 `SONOROUS`。 |
| `normal[850]` | `【字彙】Which noun means a person whostands ` | 英文自然度與繁中說明瑕疵 | 題幹 `"Which noun means a person whostands in for someone else?"` 中，`whostands` 兩個英文單字黏在一起漏空白！ | 修正為 `"Which noun means a person who stands in for someone else?"`。 |
| `normal[860]` | `請唸出：最後一刻的替補人選` | 重複或近似模板題 | `A LAST-MINUTE STAND-IN` 與同批聽力 `normal[840]`（`stand in for`）及閱讀 `normal[850]`（`stand-in`）三度重複。 | 改考 `"A TEMPORARY SUBSTITUTE"` 或 `"AN EMERGENCY BACKUP"`。 |
| `normal[866]` | `請拼出：名額或空間已滿而無法再容納的（F 開頭，4 個字母）` | 難度不符 B2+ | 若答案為 4 字母 `FULL`（或同批 `ROTA`），4 字母單字在 B2+ `difficulty: 2` 拼字題明顯不符規格（實際該槽位 `normal[866]` 為 `ROTA`，`normal[867]` 為 `SLOT` 4 字母填空）。 | 將 4 字母短字 `ROTA` / `SLOT` 升級為 `ROSTER`、`SCHEDULE`、`VACANCY`。 |
| `normal[867]` | `填空題：S L _ T (時間表上可安排的一段空檔)` | 難度不符 B2+ | `SLOT` 僅 4 字母挖空 1 字 `O`，對 B2+ 過於簡單。 | 改考 `INTERVAL`、`VACANCY` 或 `TIMETABLE`。 |
| `normal[868]` | `填空題：C O N T _ N G _ N T (視情況或條件而定的)` | 重複或近似模板題 | 與同批 `normal[864]`（`CONTINGENCY`）同字根，且與 `boss[88]`（`CONTINGENT` 拼字）重複。 | 改考 `PROVISIONAL` 以外之 `CONDITIONAL`、`SUBJECT`、`DEPENDENT`。 |
| `normal[879]` | `【文法】Had the lining been stitched more fi` | 干擾選項設計不良 | 干擾項 `A. had not come`、`C. will not come`、`D. did not came` 中，`did not came` 為明顯基礎語法錯誤。 | 改為 `would not come`、`might not come`、`had not been coming`。 |
| `normal[889]` | `請唸出單字：修補衣物破損處的補丁` | 難度不符 B2+ | `PATCH` 為 B1 5 字母基礎單字，且同批 `normal[870]` 聽力才剛考過 `patch up`。 | 改考 `SEAM`、`GARMENT` 或 `UPHOLSTERY`。 |
| `normal[894]` | `請拼出：布料兩片縫合處的接縫（S 開頭，4 個字母）` | 難度不符 B2+ | `SEAM` 為 4 字母短字，作為壓軸批次拼字題偏短。 | 改考 `STITCHING`、`EMBROIDERY` 或 `FABRICATION`。 |
| `normal[895]` | `請拼出：不讓水滲入的防水性質（W 開頭，10 個字母）` | 重複或近似模板題 | 與 `boss[119]`（`WATERPROOF` 填空）重複，且 `water` + `proof` 對 B2+ 偏簡單。 | 與 `boss[119]` 擇一保留，另一題改考 `WATER-REPELLENT` 或 `DURABILITY`。 |
| `normal[897]` | `填空題：C L A _ P (用來扣合固定兩端的扣具)` | 難度不符 B2+ | `CLASP` 5 字母挖空 1 字 `S`，與同批 `BUCKLE`、`LINING` 相比略短。 | 改考 `FASTENER` 或 `GARMENT`。 |
| `boss[8]` | `填空題：C O N T I N G _ N _ Y (偶發事件、應變準備)` | 重複或近似模板題 | 與 `normal[18]`、`normal[26]`、`normal[469]`、`normal[864]` 五度重複考 `CONTINGENCY`。 | 改考 `PRECAUTION`、`COUNTERMEASURE` 或 `MITIGATION`。 |
| `boss[98]` | `請拼出：恢復原本的職位權利或安排（R 開頭，9 個字母）` | 重複或近似模板題 | 與 `normal[295]`（`請拼出：恢復某人原有的職位或權利（R 開頭，9 個字母）` → `REINSTATE`）在 `normal` 與 `boss` 完全重複！ | 改考 `RESTORE`、`REVOKE` 或 `RESCIND`。 |
| `boss[108]` | `請拼出：預先為某人保留座位或房間的預訂（R 開頭，11 個字母）` | 難度不符 B2+ | `RESERVATION` 為 B1 基礎旅遊單字，放在 `boss` `difficulty: 3` 偏簡單，且與 `normal[264]` 重複。 | 改考 `ACCOMMODATION` 或 `ITINERARY`。 |
| `boss[148]` | `請拼出：翻新建築或房間使其恢復良好狀態（R 開頭，10 個字母）` | 重複或近似模板題 | `RENOVATION` 已在 `normal[49]`（填空）、`normal[39]`（閱讀）、`normal[440]`（口說）多次出現。 | 改考 `RESTORATION`、`REFURBISHMENT` 或 `MAINTENANCE`。 |
| `boss[158]` | `請拼出：把工作或責任交由他人代為處理（D 開頭，10 個字母）` | 重複或近似模板題 | `DELEGATION` 已在 `normal[198]`（口說）、`normal[207]`（`DELEGATE` 填空）、`normal[475]`（`DELEGATE` 拼字）多次重複。 | 改考 `ALLOCATION`、`ASSIGNMENT` 或 `AUTHORISATION`。 |
| `boss[168]` | `請拼出：捐贈給博物館或機構的物品或款項（D 開頭，8 個字母）` | 難度不符 B2+ | `DONATION` 為 B1 基礎單字，且與 `normal[508]`（`DONATION` 填空）重複，不符 `boss` `difficulty: 3` 定位。 | 改考 `ACQUISITION`、`ENDOWMENT` 或 `CURATION`。 |
| `boss[196]` | `請唸出：令人安心的說明` | 重複或近似模板題 | 與 `boss[278]`（`REASSURING` 拼字）及 `normal[591]`（`A REASSURING SIGN`）重複考 `REASSURING`。 | 改為 `"A CONVINCING EXPLANATION"` 或 `"A PLAUSIBLE EXPLANATION"`。 |
| `boss[210]` | `🎧 聽一聽，選出最符合說話者意思的解讀` | 重複或近似模板題 | 與 `boss[280]` 同為週五四點前不能來之聽力題，情境高度重複。 | 與 `boss[280]` 擇一修改情境。 |
| `boss[228]` | `請拼出：山脈或屋頂最高處狹長的脊線（R 開頭，5 個字母）` | 難度不符 B2+ | `RIDGE` 為 5 字母單字，與 `normal[687]`（`RIDGE` 填空）重複，且對 `boss` `difficulty: 3` 過短。 | 改考 `PRECIPICE`、`PROMONTORY` 或 `watershed`。 |
| `boss[234]` | `🎧 聽一聽，選出最符合說話者意思的解讀` | 英文自然度與繁中說明瑕疵 | 正解選項 `"D. 有足夠湊四件，前提是不介意有兩件色調略不同。"` 中，「有足夠湊四件」漏賓語，且英文 `two slightly different shades` 指「兩種略微不同的色調」而非必然「只有兩件不同」。 | 改為 `"D. 數量足夠湊成一套四件，前提是你不介意分成兩種略有差異的色調。"`。 |
