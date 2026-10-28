import type { Question, VocabEntry, VocabSense } from './types';
import generatedVocab from './questions/generated-vocab.json';
import { BANK_VOCAB } from './questions/bank';

// 單字資料：拼寫、填空、語音題共用同一個字的中文與例句。
// key 為大寫單字；題目透過 vocabKey() 對應到這裡。

// 手寫的單字資料；自動生成題目附帶的單字放在 questions/generated-vocab.json，載入時合併
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
  TRANSPARENCY: { pos: 'n.', meaning: '透明度', example: 'Investors expect transparency from the board.', exampleZh: '投資人期待董事會保持透明。' },
};

// 題目對應的單字：拼寫／語音看答案，填空看 speak（答案只是缺的字母），選擇題沒有單一單字
export const VOCAB: Record<string, VocabEntry> = Object.assign({ ...BASE_VOCAB, ...(generatedVocab as Record<string, VocabEntry>) }, ...BANK_VOCAB);

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
  const entry = VOCAB[key];
  return entry ? { ...entry, key, display: entry.word ?? key.toLowerCase() } : null;
};

export function vocabKey(q: Question): string | null {
  if (q.type === 'spell' || q.type === 'voice') return q.ans;
  if (q.type === 'fill') return q.speak ? q.speak.toUpperCase().replace(/[^A-Z]/g, '') : null;
  return null;
}

export function vocabFor(q: Question): (VocabEntry & { key: string; display: string }) | null {
  const key = vocabKey(q);
  const entry = key ? VOCAB[key] : undefined;
  if (!key || !entry) return null;
  return { ...entry, key, display: entry.word ?? key.toLowerCase() };
}
