import type { Question, VocabEntry, VocabSense } from './types';

// 單字資料：拼寫、填空、語音題共用同一個字的中文與例句。
// key 為大寫單字；題目透過 vocabKey() 對應到這裡。

// 手寫的單字資料；自動生成題目附帶的單字放在 questions/generated-vocab.json，背景非同步載入避免阻塞首屏主包
const BASE_VOCAB: Record<string, VocabEntry> = {
  // ---------- A1 ----------
  BOOK: { pos: 'n.', meaning: '書本', example: 'I read a book every night.', exampleZh: '我每晚讀一本書。' },
  APPLE: { pos: 'n.', meaning: '蘋果', example: 'She eats an apple for breakfast.', exampleZh: '她早餐吃一顆蘋果。' },
  WATER: { pos: 'n.', meaning: '水', example: 'Can I have a glass of water?', exampleZh: '可以給我一杯水嗎？' },
  FRIEND: { pos: 'n.', meaning: '朋友', example: 'My friend works in an office.', exampleZh: '我的朋友在辦公室工作。' },
  SCHOOL: { pos: 'n.', meaning: '學校', example: 'The school is near the station.', exampleZh: '學校在車站附近。' },
  HOUSE: { pos: 'n.', meaning: '房子', example: 'They live in a big house.', exampleZh: '他們住在一間大房子裡。' },
  MONEY: { pos: 'n.', meaning: '錢', example: 'I need some money for the bus.', exampleZh: '我需要一點錢搭公車。' },
  TABLE: { pos: 'n.', meaning: '桌子', example: 'Please put the cups on the table.', exampleZh: '請把杯子放在桌上。' },
  CAT: { pos: 'n.', meaning: '貓', example: 'The cat is sleeping on the sofa.', exampleZh: '貓在沙發上睡覺。' },
  START: { pos: 'v.', meaning: '開始', example: 'The meeting will start at nine.', exampleZh: '會議九點開始。' },
  THANK: { word: 'thank you', pos: 'phr.', meaning: '謝謝', example: 'Thank you for your help.', exampleZh: '謝謝你的幫忙。' },
  MORNING: { word: 'good morning', pos: 'phr.', meaning: '早安', example: 'Good morning, everyone.', exampleZh: '大家早安。' },
  FAMILY: { pos: 'n.', meaning: '家庭；家人', example: 'I have dinner with my family.', exampleZh: '我和家人一起吃晚餐。' },
  WEDNESDAY: { word: 'Wednesday', pos: 'n.', meaning: '星期三', example: 'The report is due on Wednesday.', exampleZh: '報告星期三要交。' },

  // ---------- A2 ----------
  AIRPORT: { pos: 'n.', meaning: '機場', example: 'Please arrive at the airport two hours early.', exampleZh: '請提早兩小時到機場。' },
  TICKET: { pos: 'n.', meaning: '票', example: 'I bought a train ticket online.', exampleZh: '我在網路上買了火車票。' },
  OFFICE: { pos: 'n.', meaning: '辦公室', example: 'Our office is on the fifth floor.', exampleZh: '我們的辦公室在五樓。' },
  WEATHER: { pos: 'n.', meaning: '天氣', example: 'The weather is nice today.', exampleZh: '今天天氣很好。' },
  HOTEL: { pos: 'n.', meaning: '飯店', example: 'The hotel is close to the convention center.', exampleZh: '飯店離會議中心很近。' },
  PRICE: { pos: 'n.', meaning: '價格', example: 'The price includes breakfast.', exampleZh: '價格包含早餐。' },
  MEETING: { pos: 'n.', meaning: '會議', example: 'The meeting has been moved to Friday.', exampleZh: '會議改到星期五。' },
  DESK: { pos: 'n.', meaning: '書桌；辦公桌', example: 'The files are on my desk.', exampleZh: '文件在我桌上。' },
  RESTAURANT: { pos: 'n.', meaning: '餐廳', example: "Let's have lunch at the new restaurant.", exampleZh: '我們去新餐廳吃午餐吧。' },
  RESERVATION: { pos: 'n.', meaning: '預約；訂位', example: "I'd like to make a reservation for two.", exampleZh: '我想訂兩人的位子。' },
  LUGGAGE: { pos: 'n.', meaning: '行李', example: 'Please keep your luggage with you.', exampleZh: '請隨身看管您的行李。' },
  CUSTOMER: { pos: 'n.', meaning: '顧客', example: 'The customer asked for a refund.', exampleZh: '那位顧客要求退款。' },

  // ---------- B1 ----------
  EMPLOYEE: { pos: 'n.', meaning: '員工', example: 'All employees must attend the training.', exampleZh: '所有員工都必須參加培訓。' },
  INVOICE: { pos: 'n.', meaning: '發票；請款單', example: 'Please send the invoice by Friday.', exampleZh: '請在星期五前寄送請款單。' },
  DEADLINE: { pos: 'n.', meaning: '截止期限', example: 'We need to meet the deadline.', exampleZh: '我們必須趕上截止期限。' },
  SUPPLIER: { pos: 'n.', meaning: '供應商', example: 'We found a cheaper supplier.', exampleZh: '我們找到一家更便宜的供應商。' },
  BUDGET: { pos: 'n.', meaning: '預算', example: 'The project is over budget.', exampleZh: '這個專案超出預算了。' },
  SCHEDULE: { pos: 'n.', meaning: '時程表；行程', example: 'Let me check my schedule.', exampleZh: '讓我查一下我的行程。' },
  RECEIPT: { pos: 'n.', meaning: '收據', example: 'Keep the receipt for your records.', exampleZh: '請保留收據以備查。' },
  SALARY: { pos: 'n.', meaning: '薪水', example: 'Her salary was increased this year.', exampleZh: '她今年加薪了。' },
  PROJECT: { pos: 'n.', meaning: '專案', example: 'The project will be finished next month.', exampleZh: '這個專案下個月完成。' },
  PRESENTATION: { pos: 'n.', meaning: '簡報', example: 'He gave a presentation to the clients.', exampleZh: '他向客戶做了簡報。' },
  DEPARTMENT: { pos: 'n.', meaning: '部門', example: 'She works in the sales department.', exampleZh: '她在業務部工作。' },
  ACCOUNTING: { pos: 'n.', meaning: '會計', example: 'Please submit your receipts to accounting.', exampleZh: '請把收據交給會計部。' },
  EQUIPMENT: { pos: 'n.', meaning: '設備', example: 'The new equipment arrived yesterday.', exampleZh: '新設備昨天到了。' },

  // ---------- B2 ----------
  NEGOTIATE: { pos: 'v.', meaning: '談判；協商', example: 'We negotiated a better price with the vendor.', exampleZh: '我們和廠商談到了更好的價格。' },
  REFUND: { pos: 'n./v.', meaning: '退款', example: 'You can get a full refund within 30 days.', exampleZh: '30 天內可以全額退款。' },
  WARRANTY: { pos: 'n.', meaning: '保固', example: 'The laptop comes with a two-year warranty.', exampleZh: '這台筆電有兩年保固。' },
  SHAREHOLDER: { pos: 'n.', meaning: '股東', example: 'The shareholders approved the merger.', exampleZh: '股東們通過了合併案。' },
  REVENUE: { pos: 'n.', meaning: '營收', example: 'Revenue rose by 15 percent this quarter.', exampleZh: '本季營收成長了 15%。' },
  COMPLIANCE: { pos: 'n.', meaning: '遵循（法規）', example: 'All products must be in compliance with safety rules.', exampleZh: '所有產品都必須符合安全規範。' },
  ACQUISITION: { pos: 'n.', meaning: '收購', example: 'The acquisition was completed in March.', exampleZh: '這次收購在三月完成。' },
  INVENTORY: { pos: 'n.', meaning: '庫存', example: 'We check the inventory every month.', exampleZh: '我們每個月盤點庫存。' },
  CONTRACT: { pos: 'n.', meaning: '合約', example: 'Please sign the contract before Monday.', exampleZh: '請在星期一前簽署合約。' },
  EFFICIENCY: { pos: 'n.', meaning: '效率', example: 'The new system improved our efficiency.', exampleZh: '新系統提升了我們的效率。' },
  STRATEGY: { pos: 'n.', meaning: '策略', example: 'We need a new marketing strategy.', exampleZh: '我們需要新的行銷策略。' },
  COMPETITOR: { pos: 'n.', meaning: '競爭對手', example: 'Our main competitor lowered its prices.', exampleZh: '我們的主要競爭對手降價了。' },

  // ---------- C1 ----------
  STAKEHOLDER: { pos: 'n.', meaning: '利害關係人', example: 'We must consult all stakeholders before deciding.', exampleZh: '做決定前必須諮詢所有利害關係人。' },
  STREAMLINE: { pos: 'v.', meaning: '精簡；使合理化', example: 'The company streamlined its approval process.', exampleZh: '公司精簡了審核流程。' },
  FEASIBILITY: { pos: 'n.', meaning: '可行性', example: 'We conducted a feasibility study first.', exampleZh: '我們先做了可行性研究。' },
  UNPRECEDENTED: { pos: 'adj.', meaning: '前所未有的', example: 'Sales reached an unprecedented level.', exampleZh: '銷售額達到前所未有的水準。' },
  CONSENSUS: { pos: 'n.', meaning: '共識', example: 'The team reached a consensus on the budget.', exampleZh: '團隊對預算達成了共識。' },
  CONTINGENCY: { pos: 'n.', meaning: '應變；意外事件', example: 'We have a contingency plan for delays.', exampleZh: '我們有延誤時的應變計畫。' },
  LIABILITY: { pos: 'n.', meaning: '法律責任', example: 'The company accepted liability for the damage.', exampleZh: '公司承擔了損害的法律責任。' },
  METICULOUS: { pos: 'adj.', meaning: '一絲不苟的', example: 'She is meticulous about checking the numbers.', exampleZh: '她核對數字時一絲不苟。' },
  // ---------- C2 ----------
  UBIQUITOUS: { pos: 'adj.', meaning: '無所不在的', example: 'Smartphones have become ubiquitous.', exampleZh: '智慧型手機已經無所不在。' },
  JUXTAPOSE: { pos: 'v.', meaning: '並列對照', example: 'The artist juxtaposes old and new styles.', exampleZh: '這位藝術家把新舊風格並列對照。' },
  ESOTERIC: { pos: 'adj.', meaning: '深奧難懂的', example: 'The lecture was too esoteric for most students.', exampleZh: '這堂課對大多數學生來說太深奧了。' },
  PRAGMATIC: { pos: 'adj.', meaning: '務實的', example: 'We need a pragmatic solution, not a perfect one.', exampleZh: '我們需要務實的解決方案，而不是完美的方案。' },
  CONSCIENTIOUS: { pos: 'adj.', meaning: '盡責的、認真的', example: 'She is a conscientious worker.', exampleZh: '她是一位盡責的員工。' },
  PERFUNCTORY: { pos: 'adj.', meaning: '敷衍的', example: 'He gave a perfunctory answer and left.', exampleZh: '他敷衍地回答後就離開了。' },
  EPHEMERAL: { pos: 'adj.', meaning: '短暫的', example: 'Fame on social media is often ephemeral.', exampleZh: '社群媒體上的名氣通常很短暫。' },
  MAGNANIMOUS: { pos: 'adj.', meaning: '寬宏大量的', example: 'The winner was magnanimous in victory.', exampleZh: '勝利者展現了寬宏大量。' },
  ACQUIESCE: { pos: 'v.', meaning: '默許、勉強同意', example: 'The manager finally acquiesced to our request.', exampleZh: '經理最後默許了我們的請求。' },
  PROLIFERATE: { pos: 'v.', meaning: '激增、擴散', example: 'Online courses have proliferated in recent years.', exampleZh: '近年來線上課程大量激增。' },
  PHENOMENON: { pos: 'n.', meaning: '現象', example: 'The aurora is a natural phenomenon.', exampleZh: '極光是一種自然現象。' },
  HYPOTHESIS: { pos: 'n.', meaning: '假說', example: 'The experiment supported our hypothesis.', exampleZh: '實驗支持了我們的假說。' },
  INDISPENSABLE: { pos: 'adj.', meaning: '不可或缺的', example: 'English is indispensable for this job.', exampleZh: '英文對這份工作來說不可或缺。' },
  SOPHISTICATED: { pos: 'adj.', meaning: '精緻複雜的', example: 'The system uses sophisticated technology.', exampleZh: '這套系統使用精密複雜的技術。' },
  EQUANIMITY: { pos: 'n.', meaning: '沉著、泰然自若', example: 'She faced the crisis with equanimity.', exampleZh: '她泰然自若地面對危機。' },
  INFRASTRUCTURE: { pos: 'n.', meaning: '基礎建設', example: 'The city is investing in its infrastructure.', exampleZh: '這座城市正在投資基礎建設。' },
  SUSTAINABILITY: { pos: 'n.', meaning: '永續性', example: 'Sustainability is part of our business strategy.', exampleZh: '永續是我們商業策略的一部分。' },
  ENTREPRENEUR: { pos: 'n.', meaning: '創業家', example: 'He became a successful entrepreneur at 30.', exampleZh: '他三十歲就成為成功的創業家。' },
  PANDA: { pos: 'n.', meaning: '熊貓；大貓熊', example: "The giant panda is eating bamboo.", exampleZh: '大貓熊正在吃竹子。' },
  'SEE YOU': { pos: 'phr.', meaning: '再見；回頭見', example: "See you tomorrow morning.", exampleZh: '明天早上見。' },
  'GOOD JOB': { pos: 'phr.', meaning: '做得好；太棒了', example: "Good job on finishing the assignment early.", exampleZh: '作業提早完成，做得好！' },
  IAMTOM: { pos: 'phr.', meaning: '我是湯姆', example: "Hello, I am Tom.", exampleZh: '你好，我是湯姆。' },
  TRANSPARENCY: { pos: 'n.', meaning: '透明度', example: 'Investors expect transparency from the board.', exampleZh: '投資人期待董事會保持透明。' },

  // ---------- 核心考綱必備單字 ----------
  PUNCTUAL: { pos: 'adj.', meaning: '準時的', example: "Please be punctual for the meeting.", exampleZh: '開會請準時。' },
  SCANNER: { pos: 'n.', meaning: '掃描器', example: "The scanner is next to the printer.", exampleZh: '掃描器在印表機旁邊。' },
  WHOLESALE: { pos: 'n.', meaning: '批發', example: "We buy at wholesale prices.", exampleZh: '我們用批發價購買。' },
  FRANCHISE: { pos: 'n.', meaning: '加盟店', example: "He owns a coffee franchise.", exampleZh: '他經營一家咖啡加盟店。' },
  PREVALENT: { pos: 'adj.', meaning: '普遍的', example: "This view is prevalent among young people.", exampleZh: '這種看法在年輕人中很普遍。' },
  CANDID: { pos: 'adj.', meaning: '坦白的', example: "Thank you for your candid feedback.", exampleZh: '謝謝你坦白的意見。' },
  COMPLACENT: { pos: 'adj.', meaning: '自滿的', example: "We cannot become complacent.", exampleZh: '我們不能自滿。' },
  CONTEMPLATE: { pos: 'v.', meaning: '仔細考慮', example: "He is contemplating a career change.", exampleZh: '他正在考慮轉換跑道。' },
  DEFER: { pos: 'v.', meaning: '延後', example: "Payment can be deferred.", exampleZh: '付款可以延後。' },
  FORMIDABLE: { pos: 'adj.', meaning: '強大的', example: "They are a formidable competitor.", exampleZh: '他們是強大的競爭對手。' },
  IMPEDE: { pos: 'v.', meaning: '阻礙', example: "Bad weather impeded the work.", exampleZh: '壞天氣阻礙了工作。' },
  RATIFY: { pos: 'v.', meaning: '批准', example: "The agreement was ratified in May.", exampleZh: '協議在五月獲得批准。' },
  SUBSEQUENT: { pos: 'adj.', meaning: '後續的', example: "Subsequent meetings were shorter.", exampleZh: '後續的會議比較短。' },
  DILIGENT: { pos: 'adj.', meaning: '勤奮的', example: "She is a diligent worker.", exampleZh: '她是勤奮的員工。' },
  REITERATE: { pos: 'v.', meaning: '重申', example: "Let me reiterate the main point.", exampleZh: '讓我重申重點。' },
  NEGLIGIBLE: { pos: 'adj.', meaning: '微不足道的', example: "The difference is negligible.", exampleZh: '差異微不足道。' },
  QUINTESSENTIAL: { pos: 'adj.', meaning: '典型的', example: "It is the quintessential English pub.", exampleZh: '這是典型的英式酒吧。' },
  OBFUSCATE: { pos: 'v.', meaning: '使模糊難懂', example: "Don t obfuscate the issue with jargon.", exampleZh: '別用術語把問題弄得難懂。' },
  VERBOSE: { pos: 'adj.', meaning: '冗長的', example: "The report is too verbose.", exampleZh: '這份報告太冗長了。' },
  CAPRICIOUS: { pos: 'adj.', meaning: '反覆無常的', example: "The weather here is capricious.", exampleZh: '這裡的天氣反覆無常。' },
  CANDOR: { pos: 'n.', meaning: '坦率', example: "I appreciate your candor.", exampleZh: '我欣賞你的坦率。' },
  ACUMEN: { pos: 'n.', meaning: '敏銳', example: "She has great business acumen.", exampleZh: '她很有商業頭腦。' },
  DICHOTOMY: { pos: 'n.', meaning: '二分', example: "There is a dichotomy between theory and practice.", exampleZh: '理論與實務之間存在落差。' },
  PANACEA: { pos: 'n.', meaning: '萬靈丹', example: "Technology is not a panacea.", exampleZh: '科技不是萬靈丹。' },
  REPUDIATE: { pos: 'v.', meaning: '否認', example: "He repudiated the accusation.", exampleZh: '他否認了指控。' },
  EXTRAPOLATE: { pos: 'v.', meaning: '推斷', example: "We cannot extrapolate from one case.", exampleZh: '我們不能從單一案例推斷。' },
  EBULLIENT: { pos: 'adj.', meaning: '熱情洋溢的', example: "She was ebullient after the win.", exampleZh: '獲勝後她興高采烈。' },
  PROPENSITY: { pos: 'n.', meaning: '傾向', example: "He has a propensity to exaggerate.", exampleZh: '他有誇大的傾向。' },
  VICARIOUS: { pos: 'adj.', meaning: '間接感受的', example: "I felt a vicarious thrill.", exampleZh: '我感同身受地興奮。' },
  ESCHEW: { pos: 'v.', meaning: '刻意避開', example: "She eschews fast food.", exampleZh: '她刻意不吃速食。' },
  ABERRATION: { pos: 'n.', meaning: '異常', example: "The bad result was an aberration.", exampleZh: '那次糟糕的結果只是異常。' },
  ACRIMONIOUS: { pos: 'adj.', meaning: '尖刻的', example: "They had an acrimonious divorce.", exampleZh: '他們的離婚鬧得很難看。' },
  AMELIORATE: { pos: 'v.', meaning: '改善', example: "Steps were taken to ameliorate the situation.", exampleZh: '已採取措施改善情況。' },
  ANATHEMA: { pos: 'n.', meaning: '深惡痛絕的事物', example: "Waste is anathema to him.", exampleZh: '他對浪費深惡痛絕。' },
  ARCANE: { pos: 'adj.', meaning: '晦澀難懂的', example: "The rules are arcane.", exampleZh: '這些規則晦澀難懂。' },
  BOMBASTIC: { pos: 'adj.', meaning: '誇大其詞的', example: "The speech was bombastic.", exampleZh: '那場演講浮誇不實。' },
  CACOPHONY: { pos: 'n.', meaning: '刺耳的雜音', example: "A cacophony of horns filled the street.", exampleZh: '街上充滿刺耳的喇叭聲。' },
  CANTANKEROUS: { pos: 'adj.', meaning: '脾氣暴躁的', example: "He is a cantankerous old man.", exampleZh: '他是個脾氣暴躁的老人。' },
  CONUNDRUM: { pos: 'n.', meaning: '難題', example: "This is a real conundrum.", exampleZh: '這真是個難題。' },
  DELETERIOUS: { pos: 'adj.', meaning: '有害的', example: "Smoking has deleterious effects.", exampleZh: '吸菸有害健康。' },
  DILETTANTE: { pos: 'n.', meaning: '業餘愛好者', example: "He is a dilettante in art.", exampleZh: '他對藝術只是淺嘗即止。' },
  DISPARATE: { pos: 'adj.', meaning: '迥然不同的', example: "They come from disparate backgrounds.", exampleZh: '他們來自完全不同的背景。' },
  EFFICACIOUS: { pos: 'adj.', meaning: '有效的', example: "The treatment proved efficacious.", exampleZh: '這個療法證明有效。' },
  ENIGMATIC: { pos: 'adj.', meaning: '謎一般的', example: "She gave an enigmatic smile.", exampleZh: '她露出謎一般的微笑。' },
  ERUDITE: { pos: 'adj.', meaning: '博學的', example: "He is an erudite scholar.", exampleZh: '他是一位博學的學者。' },
  FORTUITOUS: { pos: 'adj.', meaning: '偶然的', example: "Our meeting was fortuitous.", exampleZh: '我們的相遇純屬偶然。' },
  GREGARIOUS: { pos: 'adj.', meaning: '愛交際的', example: "She is outgoing and gregarious.", exampleZh: '她外向又愛交際。' },
  IDIOSYNCRASY: { pos: 'n.', meaning: '怪癖', example: "Everyone has their idiosyncrasies.", exampleZh: '每個人都有自己的怪癖。' },
  IMPECCABLE: { pos: 'adj.', meaning: '無瑕的', example: "His manners are impeccable.", exampleZh: '他的禮儀無可挑剔。' },
  LOQUACIOUS: { pos: 'adj.', meaning: '話多的', example: "Our loquacious guide talked all day.", exampleZh: '我們健談的導遊講了一整天。' },
  MALLEABLE: { pos: 'adj.', meaning: '可塑的', example: "Young minds are malleable.", exampleZh: '年輕的心靈很有可塑性。' },
  PERNICIOUS: { pos: 'adj.', meaning: '有害的', example: "Gossip has a pernicious effect.", exampleZh: '八卦有很壞的影響。' },
  QUIXOTIC: { pos: 'adj.', meaning: '不切實際的', example: "It was a quixotic dream.", exampleZh: '那是個不切實際的夢想。' },
  RECALCITRANT: { pos: 'adj.', meaning: '頑抗的', example: "The recalcitrant staff refused to change.", exampleZh: '頑固的員工拒絕改變。' },
  SAGACIOUS: { pos: 'adj.', meaning: '睿智的', example: "She made a sagacious decision.", exampleZh: '她做了一個明智的決定。' },
  SPURIOUS: { pos: 'adj.', meaning: '而非的', example: "That is a spurious argument.", exampleZh: '那是似是而非的論點。' },
  VOCIFEROUS: { pos: 'adj.', meaning: '大聲疾呼的', example: "There was vociferous opposition.", exampleZh: '有人大聲反對。' },
  ZEALOUS: { pos: 'adj.', meaning: '熱心的', example: "She is a zealous supporter.", exampleZh: '她是熱情的支持者。' },
  BENEVOLENT: { pos: 'adj.', meaning: '仁慈的', example: "He was a benevolent leader.", exampleZh: '他是一位仁慈的領袖。' },
  HUBRIS: { pos: 'n.', meaning: '傲慢自大', example: "His hubris led to his downfall.", exampleZh: '他的傲慢導致他垮台。' },
  ASSUAGE: { pos: 'v.', meaning: '緩和', example: "Nothing could assuage her fears.", exampleZh: '什麼都無法減輕她的恐懼。' },
  INSIDIOUS: { pos: 'adj.', meaning: '害的', example: "Stress can have an insidious effect.", exampleZh: '壓力可能悄悄造成傷害。' },
  SYCOPHANT: { pos: 'n.', meaning: '諂媚者', example: "He is surrounded by sycophants.", exampleZh: '他身邊都是馬屁精。' },
  ALACRITY: { pos: 'n.', meaning: '欣然', example: "She accepted the offer with alacrity.", exampleZh: '她欣然接受了邀約。' },
  APLOMB: { pos: 'n.', meaning: '沉著', example: "She handled the crisis with aplomb.", exampleZh: '她沉著地處理了危機。' },
  CAJOLE: { pos: 'v.', meaning: '哄騙', example: "She cajoled him into coming.", exampleZh: '她哄他一起來。' },
  DEBACLE: { pos: 'n.', meaning: '大失敗', example: "The launch was a debacle.", exampleZh: '這次發表是一場大失敗。' },
  INCORRIGIBLE: { pos: 'adj.', meaning: '無可救藥的', example: "He is an incorrigible optimist.", exampleZh: '他是個無可救藥的樂觀主義者。' },
  NEFARIOUS: { pos: 'adj.', meaning: '邪惡的', example: "They uncovered a nefarious plot.", exampleZh: '他們揭發了一個邪惡的陰謀。' },
  PARSIMONIOUS: { pos: 'adj.', meaning: '吝嗇的', example: "He is parsimonious with praise.", exampleZh: '他很吝於稱讚。' },
  VENERABLE: { pos: 'adj.', meaning: '可敬的', example: "The venerable professor retired.", exampleZh: '那位德高望重的教授退休了。' },

};

// 題目對應的單字：首屏包含基礎手寫詞庫；各分區題庫載入時透過 addBankVocab 注入，全域詞典則背景非同步載入
export const VOCAB: Record<string, VocabEntry> = { ...BASE_VOCAB };

let generatedVocabPromise: Promise<void> | null = null;
export function loadGeneratedVocab(): Promise<void> {
  if (!generatedVocabPromise) {
    generatedVocabPromise = import('./questions/generated-vocab.json')
      .then(mod => {
        const data = mod.default as Record<string, VocabEntry>;
        for (const [k, v] of Object.entries(data)) {
          if (!VOCAB[k]) VOCAB[k] = v;
        }
      })
      .catch(err => {
        console.warn('Background generated-vocab load error:', err);
        generatedVocabPromise = null;
      });
  }
  return generatedVocabPromise;
}

// 各分區獨立保存的 CEFR 詞庫：供圖鑑與分區學習完整索引
const REGION_VOCABS: Record<number, Record<string, VocabEntry>> = {};

export function setRegionVocab(regionIdx: number, vocab: Record<string, VocabEntry>) {
  REGION_VOCABS[regionIdx] = vocab;
}

export function getRegionVocab(regionIdx: number): Record<string, VocabEntry> | undefined {
  return REGION_VOCABS[regionIdx];
}

// CEFR 題庫的單字資料：分區域載入時加進來（已有的字不覆蓋）
export function addBankVocab(vocab: Record<string, VocabEntry>, regionIdx?: number) {
  if (regionIdx !== undefined) {
    setRegionVocab(regionIdx, vocab);
  }
  for (const [k, v] of Object.entries(vocab)) if (!VOCAB[k]) VOCAB[k] = v;
}

// 單字的所有詞性與例句：有完整資料就用，沒有就用主要意思與例句；主要意思一定排第一個
export function vocabSenses(entry: VocabEntry): VocabSense[] {
  const main: VocabSense = { pos: entry.pos, meaning: entry.meaning, examples: [{ en: entry.example, zh: entry.exampleZh }] };
  if (!entry.senses?.length) return [main];
  const senses = entry.senses.filter(s => s.meaning && s.examples?.length);
  const idx = senses.findIndex(s => s.pos === entry.pos);
  if (idx < 0) return [main, ...senses];
  const first = senses[idx];
  const examples = first.examples.some(e => e.en === entry.example) ? first.examples : [main.examples[0], ...first.examples];
  return [{ ...first, examples }, ...senses.filter((_, i) => i !== idx)];
}

export const vocabByKey = (key: string) => {
  if (!key) return null;
  if (VOCAB[key]) {
    const entry = VOCAB[key];
    return { ...entry, key, display: entry.word ?? key.toLowerCase() };
  }
  const upper = key.toUpperCase().trim();
  if (VOCAB[upper]) {
    const entry = VOCAB[upper];
    return { ...entry, key: upper, display: entry.word ?? key.toLowerCase() };
  }
  const under = upper.replace(/[\s-]+/g, '_');
  if (VOCAB[under]) {
    const entry = VOCAB[under];
    return { ...entry, key: under, display: entry.word ?? key.toLowerCase() };
  }
  const clean = upper.replace(/[^A-Z0-9_]/g, '');
  if (clean && VOCAB[clean]) {
    const entry = VOCAB[clean];
    return { ...entry, key: clean, display: entry.word ?? key.toLowerCase() };
  }
  const lower = key.toLowerCase().trim();
  if (VOCAB[lower]) {
    const entry = VOCAB[lower];
    return { ...entry, key: lower, display: entry.word ?? key.toLowerCase() };
  }
  return null;
};

export function vocabKey(q: Question): string | null {
  if (q.vocabId) {
    if (VOCAB[q.vocabId]) return q.vocabId;
    const clean = q.vocabId.replace(/^R\d+:/, '');
    if (VOCAB[clean]) return clean;
    return q.vocabId;
  }
  if (q.type === 'spell' || q.type === 'voice') {
    if (VOCAB[q.ans]) return q.ans;
    const clean = q.ans.toUpperCase().replace(/[^A-Z0-9_ ]/g, '').trim();
    if (VOCAB[clean]) return clean;
    const under = clean.replace(/\s+/g, '_');
    if (VOCAB[under]) return under;
    // 只有單字或短片語（詞數 <= 4）才回傳 q.ans 作為待補單字 key；長句子語音題教學在 explain 中，避免長句被誤判為單字
    const tokenCount = q.ans.trim().split(/\s+/).filter(Boolean).length;
    if (tokenCount <= 4) return q.ans;
    return null;
  }
  if (q.type === 'fill') {
    if (!q.speak) return null;
    const raw = q.speak.toUpperCase().trim();
    if (VOCAB[raw]) return raw;
    const noSpace = raw.replace(/[^A-Z]/g, '');
    if (VOCAB[noSpace]) return noSpace;
    const under = raw.replace(/[^A-Z0-9_]/g, '_');
    if (VOCAB[under]) return under;
    return noSpace;
  }
  if (q.type === 'choice') {
    if (q.speak) {
      const spk = q.speak.toUpperCase().trim();
      if (VOCAB[spk]) return spk;
      const spkClean = spk.replace(/[.?!]+$/, '').trim();
      if (VOCAB[spkClean]) return spkClean;
      const spkUnder = spkClean.replace(/[^A-Z0-9]/g, '_').replace(/_+/g, '_');
      if (VOCAB[spkUnder]) return spkUnder;
      const spkNoSpace = spkClean.replace(/[^A-Z0-9_]/g, '');
      if (VOCAB[spkNoSpace]) return spkNoSpace;
    }
    if (q.options && q.ans) {
      const letters = ['A', 'B', 'C', 'D'];
      const idx = letters.indexOf(q.ans.trim().toUpperCase());
      if (idx >= 0 && q.options[idx]) {
        const text = q.options[idx].replace(/^[A-D]\.\s*/, '').trim();
        const upper = text.toUpperCase();
        if (VOCAB[upper]) return upper;
        const under = upper.replace(/[^A-Z0-9]/g, '_').replace(/_+/g, '_');
        if (VOCAB[under]) return under;
        const noSpace = upper.replace(/[^A-Z0-9_]/g, '');
        if (VOCAB[noSpace]) return noSpace;
      }
    }
  }
  return null;
}

export function vocabFor(q: Question): (VocabEntry & { key: string; display: string }) | null {
  const key = vocabKey(q);
  const entry = key ? VOCAB[key] : undefined;
  if (!key || !entry) return null;
  return { ...entry, key, display: entry.word ?? key.toLowerCase() };
}
