# A1～B2+ 題庫審查報告（同事分支 ws，2026-11-01）

審查對象：`feat/round4` commit `2659087` 的 `r0`～`r6.json`（共 8,852 題）。題目一律以題幹原文（`type|desc|speak`）定位，不用索引。
方法：
1. **本地全量自動檢查**：PM 分支的 `validateQuestion`、解說異常字、選項長度、近似重複、敏感字。
2. **Gemini 3.1 Pro 分層抽樣**：每區每項技能隨機抽 40 題（seed 20261101），7 區共 1,120 題。請它模擬「程度剛好等於該區的台灣學習者」作答，估計實際 CEFR、答對機率 p、常用度（1～3），並標出錯誤、模稜兩可、爭議、洩題與難度不符。
3. **標記題複審**：含敏感字或解說異常的 145 題另外送審。

限制：p 與 CEFR 是模型估計，不是真人作答資料；抽樣誤差約 ±7%（每區 160 題）。

## 一、總表（抽樣）

| 區域 | 平均 p | 符合該區 | 偏簡單 | 偏難 | 主要問題 |
|---|---:|---:|---:|---:|---|
| A1 | 87 | 82% | — | 18%（全為 A2） | 很好；少數旅遊字（boarding pass、schedule） |
| A2 | 82 | 66% | 13% | 22%（B1 14%） | 寫作／口說混入 B1 單字（receipt、monument、architect、landlord） |
| A2+ | 82 | 41% | **49%** | 10% | **整體太簡單**：聽力、口說大量 A1／A2 短句；反而有 B1 職場字（lease、evaluate） |
| B1 | 85 | 74% | 11% | 16% | 最穩；4 題正確選項明顯較長（洩題） |
| B1+ | 82 | 60% | 28% | 12% | 口說偏 B1；寫作有 itinerary、fascinating 等難拼字 |
| B2 | 82 | **95%** | 2% | 3% | 最準；2 題時態兩解、1 題混合假設語氣時態錯 |
| B2+ | 76 | 41% | 42% | 18%（C1） | **兩極化**：閱讀／聽力混入 C1 字與倒裝句；寫作拼字混入 A2 字（schedule、confirm） |

常用度：抽樣 1,120 題中沒有任何一題被評為「很少用」（use＝1），A1～B1 幾乎全是日常高頻用語。
爭議：145 題含敏感字（Taiwan、police、political、blood、election…），**0 題被判定有爭議**。

## 二、必修（確定是壞題）

1. **378 題閱讀題沒有題幹**（A1 4、A2 129、A2+ 153、B1 92）：desc 只有「含有 X 的英文句子」，玩家看不到句子。其中一部分的選項本身就是完整句子，可以改寫成「選出正確的句子」救回；選項只有單字的必須重寫題幹或刪除。PM 分支 T0 已在處理。
2. **B1+ 聽力「I was browsing the online store when I saw the discount code.」**：解說是 AI 自言自語（「為符合順序…Wait…」），答案 C 正確，解說要重寫。
3. **A1「there is/are」題**（desc：【生活文法】含有 there is/are 的英文句子）：選項是 They／Their／There／These，正解應為 C（There），但答案標成 D（These），解說也自相矛盾。和第 1 點一起處理。
4. **B2 混合假設語氣**：Gemini 指出時態錯置，應為 had communicated（見附表 B2 G 列）。
5. **A1「Elephant.」聽力**：解說把「大象」誤打成「大家」。

## 三、建議調整（影響好玩與爽度）

- **A2+ 太簡單**：聽力與口說約一半是 A1～A2 程度。建議把最簡單的 A1 題移到 A1／A2 區，A2+ 改補「A2 句型＋生活延伸字」。這也影響「玩到 C1 區要達 B2」的目標：中段難度若沒拉起來，B1 會變成難度斷崖。
- **B2+ 寫作**：拼字題混入 A2 字，閱讀又混入 C1 字。建議把 C1 字（mandate、lucrative、stipulate、meticulous、Scarcely 倒裝…）移到 C1 區或當 Boss 題；拼字題換成 B2+ 字。
- **正確選項明顯較長（看長度就能猜）**：本地檢查各區約 7～12% 的選擇題正確選項比其他選項長 30% 以上，B2+ 高達 24%（255 題）。建議批次請 Gemini 把干擾選項加長到相近長度。
- **答案位置偏 A／B**：不需處理，遊戲出題時會自動洗牌選項。
- **偏難題**：A1～B1+ 各有 5～20% 的單字超出一級（見附表 HARD）。建議不刪題，改標 `difficulty: 3` 或移到 boss，讓它變成「挑戰題」而不是卡關點。

## 四、下一步

1. 等 PM 分支 T0 合併完成，在合併後的 `feat/round4` 上套用第二節的修正。
2. A2+ 與 B2+ 做全量逐題審（這兩區抽樣偏差最大）；A1、B1、B2 抽樣已足夠，只修附表列出的題目。
3. 批次處理「正確選項過長」的題目。

## 附表：抽樣中被標記的題目（EASY 只低一級的不列）
代碼：W 答案錯、AMB 兩解、G 文法不自然、ZH 中文錯、LEAK 洩題、HARD 偏難。p＝該區學習者答對機率估計。

| 區域 | 技能 | 代碼 | p | 題目／播放英文 | 答案（非選擇題） | 說明 |
|---|---|---|---:|---|---|---|
| A1 | listening | HARD | 70 | Schedule |  | Schedule對初階稍難，偏A2 |
| A1 | listening | HARD | 75 | Boarding pass |  | Boarding pass偏旅遊情境A2 |
| A1 | listening | ZH | 95 | Elephant. |  | 解說的「大家」應更正為「大象」 |
| A1 | speaking | HARD | 80 | boarding pass | BOARDING PASS | boarding pass屬A2字彙 |
| A2 | listening | G | 80 | I am guessing the answer because the question is too hard. |  | guess 通常不用現在進行式表達正在猜，可改 I have to guess |
| A2 | listening | HARD | 60 | The flight was delayed because it was snowing heavily. |  | was delayed 被動式與過去進行式結合偏 B1 |
| A2 | listening | HARD | 60 | Are you watching the presentation? |  | presentation 對 A2 來說稍難 |
| A2 | listening | HARD | 50 | What was the most terrible situation you faced yesterday? |  | terrible situation, faced, 句型長度偏 B1 |
| A2 | listening | HARD | 50 | The mechanic repaired my car faster than I expected. |  | mechanic, expected 以及子句結構偏 B1 |
| A2 | reading | HARD | 60 | 【時態混合】While I ___ the report, my computer suddenly crashed and I lost my work. |  | While引導過去進行式被過去簡單式中斷為B1常見文法 |
| A2 | reading | HARD | 65 | 【最高級】She is the ___ AUTHOR I have ever met in my life. |  | creative 為 B1 單字 |
| A2 | reading | HARD | 65 | 【短文】關於 SMARTPHONE 的短文閱讀 |  | advanced smartphone 偏 B1 單字與概念 |
| A2 | reading | HARD | 65 | 【比較級】My coffee is ___ than yours. Yours is too sweet. |  | bitter 屬 B1 單字 |
| A2 | speaking | HARD | 60 | hand in | HAND IN | hand in 作為片語動詞偏 B1 |
| A2 | speaking | HARD | 65 | landlord | LANDLORD | landlord 為 B1/B2 單字 |
| A2 | speaking | HARD | 65 | i would like a refund | I WOULD LIKE A REFUND | refund 退款概念與用字偏 B1 |
| A2 | speaking | HARD | 60 | out of stock | OUT OF STOCK | out of stock 片語較偏向 B1 |
| A2 | speaking | HARD | 65 | vacuum | VACUUM | vacuum 對 A2 稍嫌冷僻 |
| A2 | speaking | HARD | 65 | break down | BREAK DOWN | break down (故障) 屬 B1 片語動詞 |
| A2 | writing | HARD | 60 | destination | ION | destination 拼字長且為 B1 程度單字 |
| A2 | writing | HARD | 55 | receipt | PT | receipt 拼字 (ei/ie與p不發音) 對 A2 難度高 |
| A2 | writing | HARD | 60 | presentation | PRESENTATION | presentation 單字較長，偏 B1 |
| A2 | writing | HARD | 60 | scenery | RY | scenery 單字與拼字對 A2 負擔較大 |
| A2 | writing | HARD | 50 | architect | ARCHITECT | architect 職業詞彙與 ch 發音對 A2 太難 |
| A2 | writing | HARD | 55 | monument | NT | monument 對 A2 來說較不常用且難拼 |
| A2 | writing | HARD | 60 | presentation | EAN | presentation 單字偏長 |
| A2 | writing | HARD | 55 | monument | MONUMENT | monument 不屬於 A2 常規字表 |
| A2+ | listening | HARD | 70 | The art gallery is going to host a special exhibition next week. |  | host a special exhibition 偏 B1 |
| A2+ | listening | HARD | 75 | Are you going to apply for the assistant position? |  | apply for the position 較符合 B1 職場情境 |
| A2+ | listening | HARD | 70 | We will evaluate the candidates after the interviews. |  | evaluate the candidates 是 B1/B2 職場用語 |
| A2+ | listening | HARD | 75 | What is your greatest strength? |  | greatest strength 面試情境，偏 B1 |
| A2+ | listening | HARD | 70 | We are going to sign the lease today. |  | sign the lease 的 lease 少見於 A2 |
| A2+ | listening | HARD | 75 | Could you keep an eye on my house while I am away? |  | keep an eye on 屬 B1 慣用語 |
| A2+ | reading | HARD | 70 | 【時態】will 與時間副詞的搭配 |  | as soon as 接現在式表未來偏 B1 |
| A2+ | reading | HARD | 70 | 【單句】We offer free DELIVERY if your total order ___ over $50. |  | 條件句現在式代替未來式偏 B1 |
| A2+ | reading | HARD | 75 | 【單句】The boss asked us to work ___ to finish the important project tonight. |  | work overtime 是 B1 職場單字 |
| A2+ | reading | HARD | 70 | 【短文】Due to an ENGINE problem on the tracks, all northbound trains are suspended until further notice. We apolo |  | suspended until further notice 屬 B1/B2 廣播用語 |
| A2+ | speaking | HARD | 70 | can we reschedule our meeting | CAN WE RESCHEDULE OUR MEETING | reschedule 偏 B1 |
| A2+ | writing | HARD | 70 | bargain | BARGAIN | bargain 偏 B1 |
| A2+ | writing | HARD | 70 | contract | CONTRACT | contract 偏職場 B1 |
| A2+ | writing | HARD | 65 | scenery | EEY | scenery 偏 B1 |
| A2+ | writing | HARD | 70 | afford | FO | afford 偏 B1 |
| A2+ | writing | HARD | 65 | absence | ABSENCE | absence 拼字對 A2 偏難 |
| B1 | listening | LEAK | 80 | Has the historical painting been carefully protected? |  | 選項C過長，容易直接猜中 |
| B1 | listening | G | 80 | The lucky prize has been bought for tonight. |  | has been bought for tonight 略不自然，建議加 's event |
| B1 | listening | HARD | 65 | Have the media rights been bought by the network? |  | media rights, network 對 B1 稍難 |
| B1 | listening | HARD | 70 | His personal wealth has grown significantly this year. |  | wealth 與 significantly 搭配對 B1 偏難 |
| B1 | listening | G | 85 | The neighborhood has been improved a lot. |  | has improved a lot（主動）比被動自然 |
| B1 | listening | LEAK | 85 | If the guide speaks too quietly, what should we do? |  | 選項A過長且直接對應 guide |
| B1 | listening | HARD | 60 | compensation |  | compensation 偏 B2 |
| B1 | reading | LEAK | 80 | 【短文】Shopping Guide: Our store offers a price-match promise. If you find the same item for a lower price elsewh |  | 選項D明顯較長 |
| B1 | reading | LEAK | 80 | 【短文】Distance learning allows you to study from anywhere in the world. However, it requires a lot of self-disci |  | 選項A特別長，缺乏誘答力 |
| B1 | speaking | HARD | 70 | the proposal has been rejected by the committee | THE PROPOSAL HAS BEEN REJECTED BY THE COMMITTEE | proposal 與 committee 對 B1 偏難 |
| B1+ | listening | HARD | 50 | The medication which I took last night made me feel drowsy all morning. |  | drowsy 偏 B2/C1，可改 sleepy |
| B1+ | listening | HARD | 60 | Our area is experiencing a network outage. |  | outage 偏 B2，可改 connection problem |
| B1+ | listening | HARD | 65 | The connection seems unstable, so you are cutting out a bit. |  | cutting out（斷斷續續）進階口語片語，偏 B2 |
| B1+ | listening | HARD | 60 | The monument which honors the soldiers is located downtown. |  | monument 偏 B2 |
| B1+ | listening | HARD | 60 | The merchandise which arrived yesterday was completely damaged. |  | merchandise 偏 B2/C1，可改 products |
| B1+ | reading | LEAK | 80 | 【短文】Café Review: The cozy café, which opened just last week, has already attracted a huge crowd of coffee love |  | 選項 D 與 opened just last week 直接對應 |
| B1+ | reading | HARD | 65 | 【對話】A: Did the company catch the person who leaked the data? 
B: Yes, it was a former employee ___ access had  |  | whose＋revoke access 偏 B2 |
| B1+ | reading | HARD | 60 | 【文法】Many doctors recommend ___ a regular sleep routine for better health. |  | recommend + V-ing 台灣學生易錯 |
| B1+ | reading | LEAK | 90 | 【短文】Welcome Letter: We are thrilled to welcome you. Please do not forget to sign the privacy agreement before  |  | privacy agreement 字面完全出現在題目中 |
| B1+ | writing | HARD | 60 | atmosphere | ATMOSPHERE | atmosphere 拼寫稍難 |
| B1+ | writing | HARD | 60 | attentive | ATTENTIVE | attentive 偏 B2 |
| B1+ | writing | HARD | 65 | shortage | SHORTAGE | shortage 偏 B2 |
| B1+ | writing | HARD | 60 | fascinating | FASCINATING | fascinating 拼寫難 |
| B1+ | writing | HARD | 60 | currency | CURRENCY | currency 偏 B2 |
| B1+ | writing | HARD | 40 | itinerary | IEY | itinerary 為 C1，拼寫太難 |
| B1+ | writing | HARD | 65 | alternative | EAE | alternative 偏 B2 |
| B2 | listening | HARD | 60 | Had the university granted the ethical approval, we would have proceeded with the human trials. |  | 倒裝假設語氣偏 C1 |
| B2 | listening | HARD | 70 | If he hadn't taken the necessary precautions, his consecutive mistakes would have eventually cost him his care |  | consecutive 與文法綜合稍難 |
| B2 | listening | HARD | 70 | She disclosed to the press that the executive board had deliberately concealed the hazardous working condition |  | conceal、hazardous 偏難 |
| B2 | listening | HARD | 70 | I was told that the crisis team had successfully mitigated the environmental hazard before the inspection. |  | mitigate 偏 C1 |
| B2 | reading | AMB | 60 | 【移民與多元文化-間接引語】The sociologist observed that diverse communities ___ more creative solutions to local administr |  | 客觀事實可用現在式(A) |
| B2 | reading | G | 50 | 【短文】Business Case Study: The sudden collapse of the promising tech firm serves as a cautionary tale. Analysts  |  | 與過去相反應為 had communicated（混合條件句時態錯） |
| B2 | reading | HARD | 70 | 【假設語氣】But for the financial support from UNESCO, the ancient city walls ___ completely into ruin during the de |  | But for 假設語氣偏 C1 |
| B2 | reading | AMB | 60 | 【運動科學-對話】A: 「What did the sports nutritionist say about my meal plan?」 B: 「She emphasized that athletes ___ to |  | 營養學事實可保持現在式(B) |
| B2 | reading | LEAK | 85 | 【字彙】Due to the rising sea levels, the government must build stronger physical ___ to protect the low-lying coa |  | 選項全大寫，太明顯 |
| B2+ | listening | HARD | 60 | All pertinent documentation is mandated to be published on the official city portal. |  | mandate 偏 C1 |
| B2+ | listening | HARD | 65 | The exclusive contract must have been extremely lucrative. |  | lucrative 偏 C1 |
| B2+ | listening | HARD | 55 | The underwriter must have detected a high level of risk in his medical history. |  | underwriter 核保員過於專業 |
| B2+ | listening | HARD | 60 | This particular anecdote is meant to be interpreted as a subtle warning. |  | anecdote/subtle 綜合偏 C1 |
| B2+ | listening | HARD | 55 | The primary investigator must have overlooked the subtle statistical anomaly. |  | anomaly 偏 C1 學術字彙 |
| B2+ | reading | HARD | 60 | 【短文】Compliance Memo: All manufacturing branches have been struggling to meet the new emission targets. The old |  | dismantle 與 liquidate 屬 C1 |
| B2+ | reading | HARD | 50 | 【綜合】Corporate Psychology Column: Middle management has been enduring an unprecedented level of scrutiny from b |  | efficacy/paralysis 偏 C1 |
| B2+ | reading | HARD | 55 | 【字彙】To ensure the new vaccine is accessible, the government is trying to remove any bureaucratic ___ that migh |  | impediment 屬 C1 |
| B2+ | reading | HARD | 40 | 【語法結構】Scarcely ___ the new binding clause when the lessee realized it heavily favored the landlord's interests |  | Scarcely 倒裝句型為 C1/C2 |
| B2+ | reading | HARD | 60 | 【綜合】Healthcare Economics: The federal government has been heavily subsidizing the domestic production of essen |  | subsidizing/vulnerability 偏難 |
| B2+ | reading | LEAK | 85 | 【字彙】As a taxpayer, I demand greater ___ regarding how the infrastructure funds are being spent by the city cou |  | plumage 等干擾選項領域差異過大 |
| B2+ | reading | HARD | 50 | 【綜合】The ancient manuscript, which ___ in a forgotten monastery, is currently being authenticated. The monks wh |  | 雙重完成式被動與推測，難度偏高 |
| B2+ | reading | HARD | 45 | 【語法結構】Not only ___ a profound transformation in workplace dynamics, but the hybrid model is also expected to r |  | Not only 倒裝句偏 C1 |
| B2+ | reading | HARD | 55 | 【句子】The CEO's abrupt resignation is widely alleged ___ by a severe disagreement with the board regarding the c |  | 複雜被動完成式與字彙稍難 |
| B2+ | speaking | HARD | 60 | synergy | SYNERGY | synergy 為 C1 商業術語 |
| B2+ | writing | HARD | 60 | stipulate | STIPULATE | stipulate 屬 C1 正式法律用字 |
| B2+ | writing | ZH | 80 | blueprint | BLUEPRINT | blueprint 通常譯為藍圖而非策略規劃 |
| B2+ | writing | HARD | 60 | stipulate | IAE | 同 q121，難度偏高 |
| B2+ | writing | HARD | 60 | solicit | OT | solicit 偏 C1 |
| B2+ | writing | HARD | 60 | pertain | A | pertain 屬 C1 |
| B2+ | writing | HARD | 55 | meticulous | IOS | meticulous 屬 C1 |
| B2+ | writing | HARD | 60 | grievance | IEA | grievance 屬 C1 |
