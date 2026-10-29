import type { Question, QuestionSkill, Stage } from './types';
import { shuffleArray } from './battle';
import generatedPool from './questions/generated.json';
import { BANK } from './questions/bank';

// 九個細分等級。字串同時是存檔的 key（關卡進度、星星），舊的六個不能改名；
// A2+、B1+、B2+ 是第四輪新增，插在原本的等級之間（舊存檔的 unlockedIndex 在 migrateSave 轉換）
export const LEVELS = [
  "A1 入門 (120-224分)", "A2 初級 (225-549分)", "A2+ 初級進階", "B1 中級 (550-784分)", "B1+ 中級進階",
  "B2 中高級 (785-944分)", "B2+ 中高級進階", "C1 高級 (945分以上)", "C2 精通 (母語程度)"
];

// 注意：spell / fill 的 ans 只能是大寫 A-Z（鍵盤輸入限制），choice 的 ans 為 A-D，
// voice 的 ans 為大寫單字（以「辨識結果包含 ans、accept（辨識容錯）或 spellAccept（同義寫法）」判定）。
export type QuestionPool = Record<string, { normal: Question[], boss: Question[] }>;

// 手寫的題庫；自動生成（Gemini → 驗證 → 人工抽查）的題目放在 questions/generated.json，載入時合併
const BASE_POOL: QuestionPool = {
  "A1 入門 (120-224分)": {
    normal: [
      { type: "spell", desc: "請拼出：書本", ans: "BOOK", speak: "book" },
      { type: "spell", desc: "請拼出：蘋果", ans: "APPLE", speak: "apple" },
      { type: "spell", desc: "請拼出：水", ans: "WATER", speak: "water" },
      { type: "spell", desc: "請拼出：朋友", ans: "FRIEND", speak: "friend" },
      { type: "spell", desc: "請拼出：學校", ans: "SCHOOL", speak: "school" },
      { type: "fill", desc: "填空題：H _ U S E (房子)", ans: "O", speak: "house" },
      { type: "fill", desc: "填空題：M O N _ Y (錢)", ans: "E", speak: "money" },
      { type: "fill", desc: "填空題：T A B L _ (桌子)", ans: "E", speak: "table" },
      { type: "fill", desc: "填空題：_ _ T (貓)", ans: "CA", speak: "cat" },
      { type: "choice", desc: "【基礎文法】I ___ a student.", options: ["A. am", "B. is", "C. are", "D. be"], ans: "A", explain: "主詞 I 搭配 be 動詞 am；he / she / it 用 is，you / we / they 用 are。" },
      { type: "choice", desc: "【基礎文法】She ___ two brothers.", options: ["A. have", "B. has", "C. having", "D. is"], ans: "B", explain: "第三人稱單數（he / she / it）的 have 要變成 has。" },
      { type: "choice", desc: "【介系詞】The meeting is ___ Monday.", options: ["A. in", "B. at", "C. on", "D. to"], ans: "C", explain: "星期與日期前用 on；時刻用 at（at 9:00）；月份、年份用 in。" },
      { type: "choice", desc: "【字彙】「早餐」的英文是？", options: ["A. lunch", "B. dinner", "C. snack", "D. breakfast"], ans: "D", explain: "breakfast 早餐、lunch 午餐、dinner 晚餐、snack 點心。" }
    ],
    boss: [
      { type: "voice", desc: "請唸出單字：開始", ans: "START", speak: "start", accept: ["STAR"] },
      { type: "voice", desc: "請唸出單字：謝謝", ans: "THANK", speak: "thank you", spellAccept: ["THANKS", "THANKYOU"] },
      { type: "voice", desc: "請唸出單字：早安", ans: "MORNING", speak: "good morning", spellAccept: ["GOODMORNING"] },
      { type: "voice", desc: "請唸出單字：家庭", ans: "FAMILY", speak: "family" },
      { type: "spell", desc: "【守門試煉】請拼出：星期三", ans: "WEDNESDAY", speak: "Wednesday" }
    ]
  },
  "A2 初級 (225-549分)": {
    normal: [
      { type: "spell", desc: "請拼出：機場", ans: "AIRPORT", speak: "airport" },
      { type: "spell", desc: "請拼出：票", ans: "TICKET", speak: "ticket" },
      { type: "spell", desc: "請拼出：辦公室", ans: "OFFICE", speak: "office" },
      { type: "spell", desc: "請拼出：天氣", ans: "WEATHER", speak: "weather" },
      { type: "fill", desc: "填空題：H O T _ L (飯店)", ans: "E", speak: "hotel" },
      { type: "fill", desc: "填空題：P R _ C E (價格)", ans: "I", speak: "price" },
      { type: "fill", desc: "填空題：M _ _ T I N G (會議)", ans: "EE", speak: "meeting" },
      { type: "fill", desc: "填空題：D E S _ (書桌)", ans: "K", speak: "desk" },
      { type: "choice", desc: "【過去式】We ___ to Tokyo last year.", options: ["A. go", "B. went", "C. gone", "D. going"], ans: "B", explain: "last year 表示過去，用過去式；go 的過去式是不規則變化 went。" },
      { type: "choice", desc: "【比較級】This bag is ___ than that one.", options: ["A. cheap", "B. cheapest", "C. cheaper", "D. more cheap"], ans: "C", explain: "有 than 就用比較級；單音節形容詞加 -er：cheap → cheaper。" },
      { type: "choice", desc: "【疑問詞】___ much does this shirt cost?", options: ["A. How", "B. What", "C. Which", "D. Where"], ans: "A", explain: "詢問價格用 How much；How many 用來問可數名詞的數量。" },
      { type: "choice", desc: "【進行式】Look! The children ___ in the park.", options: ["A. play", "B. plays", "C. played", "D. are playing"], ans: "D", explain: "Look! 表示「此刻正在發生」，用現在進行式 be + V-ing。" }
    ],
    boss: [
      { type: "voice", desc: "請唸出單字：餐廳", ans: "RESTAURANT", speak: "restaurant" },
      { type: "voice", desc: "請唸出單字：預約", ans: "RESERVATION", speak: "reservation" },
      { type: "voice", desc: "請唸出單字：行李", ans: "LUGGAGE", speak: "luggage" },
      { type: "voice", desc: "請唸出單字：顧客", ans: "CUSTOMER", speak: "customer", accept: ["CUSTOMERS"] },
      { type: "choice", desc: "【守門試煉】I have lived here ___ 2015.", options: ["A. for", "B. since", "C. from", "D. during"], ans: "B", explain: "since + 時間點（自從…以來）；for + 一段時間（for ten years）。" }
    ]
  },
  "B1 中級 (550-784分)": {
    normal: [
      { type: "spell", desc: "請拼出：員工", ans: "EMPLOYEE", speak: "employee" },
      { type: "spell", desc: "請拼出：發票", ans: "INVOICE", speak: "invoice" },
      { type: "spell", desc: "請拼出：截止期限", ans: "DEADLINE", speak: "deadline" },
      { type: "spell", desc: "請拼出：供應商", ans: "SUPPLIER", speak: "supplier" },
      { type: "fill", desc: "填空題：B U D G _ T (預算)", ans: "E", speak: "budget" },
      { type: "fill", desc: "填空題：S C H E D _ L E (時程表)", ans: "U", speak: "schedule" },
      { type: "fill", desc: "填空題：R E C E _ P T (收據)", ans: "I", speak: "receipt" },
      { type: "fill", desc: "填空題：S A L _ R Y (薪水)", ans: "A", speak: "salary" },
      { type: "choice", desc: "【多益文法】The manager has ___ it.", options: ["A. approve", "B. approves", "C. approved", "D. approving"], ans: "C", explain: "has / have + 過去分詞 = 現在完成式；approve → approved。" },
      { type: "choice", desc: "【被動語態】The package ___ yesterday.", options: ["A. delivered", "B. was delivered", "C. is delivering", "D. delivers"], ans: "B", explain: "包裹是「被」寄送的，用被動語態 be + 過去分詞；yesterday 表示過去，所以用 was。" },
      { type: "choice", desc: "【關係代名詞】The client ___ called this morning is waiting.", options: ["A. who", "B. which", "C. whose", "D. whom"], ans: "A", explain: "先行詞是人（client），且在子句中當主詞，關係代名詞用 who。" },
      { type: "choice", desc: "【多益字彙】Please refer ___ the attached file for details.", options: ["A. at", "B. to", "C. on", "D. for"], ans: "B", explain: "refer to = 參考、參閱，是多益商務書信的固定用法。" },
      { type: "choice", desc: "【條件句】If it rains tomorrow, we ___ the event.", options: ["A. cancel", "B. canceled", "C. will cancel", "D. would cancel"], ans: "C", explain: "真實條件句：If + 現在式，主要子句用 will + 原形動詞。" }
    ],
    boss: [
      { type: "voice", desc: "請唸出單字：專案", ans: "PROJECT", speak: "project", accept: ["PROTECT"] },
      { type: "voice", desc: "請唸出單字：簡報", ans: "PRESENTATION", speak: "presentation" },
      { type: "voice", desc: "請唸出單字：部門", ans: "DEPARTMENT", speak: "department" },
      { type: "voice", desc: "請唸出單字：會計", ans: "ACCOUNTING", speak: "accounting", accept: ["ACCOUNTANT"] },
      { type: "spell", desc: "【守門試煉】請拼出：設備", ans: "EQUIPMENT", speak: "equipment" }
    ]
  },
  "B2 中高級 (785-944分)": {
    normal: [
      { type: "spell", desc: "請拼出：談判、協商", ans: "NEGOTIATE", speak: "negotiate" },
      { type: "spell", desc: "請拼出：退款", ans: "REFUND", speak: "refund" },
      { type: "spell", desc: "請拼出：保固", ans: "WARRANTY", speak: "warranty" },
      { type: "spell", desc: "請拼出：股東", ans: "SHAREHOLDER", speak: "shareholder" },
      { type: "fill", desc: "填空題：R E V E N _ E (營收)", ans: "U", speak: "revenue" },
      { type: "fill", desc: "填空題：C O M P L _ A N C E (遵循法規)", ans: "I", speak: "compliance" },
      { type: "fill", desc: "填空題：A C Q U _ S I T I O N (收購)", ans: "I", speak: "acquisition" },
      { type: "fill", desc: "填空題：I N V E N T _ R Y (庫存)", ans: "O", speak: "inventory" },
      { type: "choice", desc: "【分詞構句】___ the report, she sent it to the director.", options: ["A. Finish", "B. Finished", "C. Having finished", "D. To finish"], ans: "C", explain: "先完成一個動作再做下一件事，用完成式分詞 Having + 過去分詞。" },
      { type: "choice", desc: "【多益字彙】All expenses must be ___ by the finance team.", options: ["A. reimbursed", "B. resembled", "C. resumed", "D. retired"], ans: "A", explain: "reimburse = 核銷、退還費用。resemble 相似、resume 恢復、retire 退休。" },
      { type: "choice", desc: "【連接詞】___ the delay, the project was completed on budget.", options: ["A. Although", "B. Despite", "C. Because", "D. However"], ans: "B", explain: "Despite 後面接名詞（the delay）；Although 後面要接完整子句。" },
      { type: "choice", desc: "【假設語氣】If I ___ you, I would accept the offer.", options: ["A. am", "B. was being", "C. were", "D. have been"], ans: "C", explain: "與現在事實相反的假設，be 動詞一律用 were。" }
    ],
    boss: [
      { type: "voice", desc: "請唸出單字：合約", ans: "CONTRACT", speak: "contract", accept: ["CONTRACTS"] },
      { type: "voice", desc: "請唸出單字：效率", ans: "EFFICIENCY", speak: "efficiency" },
      { type: "voice", desc: "請唸出單字：策略", ans: "STRATEGY", speak: "strategy" },
      { type: "voice", desc: "請唸出單字：競爭對手", ans: "COMPETITOR", speak: "competitor", accept: ["COMPETITORS"] },
      { type: "choice", desc: "【守門試煉】The new policy will take effect ___ next month.", options: ["A. as of", "B. as for", "C. in case", "D. so that"], ans: "A", explain: "as of = 自…起生效，常用於公告政策或價格的生效日期。" }
    ]
  },
  "C1 高級 (945分以上)": {
    normal: [
      { type: "spell", desc: "請拼出：利害關係人", ans: "STAKEHOLDER", speak: "stakeholder" },
      { type: "spell", desc: "請拼出：（使）合理化、精簡", ans: "STREAMLINE", speak: "streamline" },
      { type: "spell", desc: "請拼出：可行性", ans: "FEASIBILITY", speak: "feasibility" },
      { type: "spell", desc: "請拼出：前所未有的", ans: "UNPRECEDENTED", speak: "unprecedented" },
      { type: "fill", desc: "填空題：C O N S E N S _ S (共識)", ans: "U", speak: "consensus" },
      { type: "fill", desc: "填空題：C O N T I N G E N _ Y (應變、偶發事件)", ans: "C", speak: "contingency" },
      { type: "fill", desc: "填空題：L I A B I L I T _ (法律責任)", ans: "Y", speak: "liability" },
      { type: "fill", desc: "填空題：M E T I C _ L O U S (一絲不苟的)", ans: "U", speak: "meticulous" },
      { type: "choice", desc: "【倒裝句】Not only ___ the target, but they also exceeded it.", options: ["A. they met", "B. did they meet", "C. they did meet", "D. met they"], ans: "B", explain: "Not only 放句首要倒裝：助動詞 did + 主詞 + 原形動詞。" },
      { type: "choice", desc: "【高階字彙】The CEO's remarks were deliberately ___, leaving room for interpretation.", options: ["A. explicit", "B. ambiguous", "C. redundant", "D. obsolete"], ans: "B", explain: "ambiguous 模稜兩可的；explicit 明確的、redundant 多餘的、obsolete 過時的。" },
      { type: "choice", desc: "【假設語氣】Had we known about the issue, we ___ it earlier.", options: ["A. would fix", "B. will have fixed", "C. would have fixed", "D. had fixed"], ans: "C", explain: "Had + 主詞 + 過去分詞 是省略 if 的過去假設，主要子句用 would have + 過去分詞。" },
      { type: "choice", desc: "【虛擬語氣】The board insisted that the plan ___ revised.", options: ["A. be", "B. is", "C. was", "D. will be"], ans: "A", explain: "insist、suggest、require 後面的 that 子句用原形動詞（假設語氣）。" }
    ],
    boss: [
      { type: "voice", desc: "請唸出單字：基礎建設", ans: "INFRASTRUCTURE", speak: "infrastructure" },
      { type: "voice", desc: "請唸出單字：永續性", ans: "SUSTAINABILITY", speak: "sustainability" },
      { type: "voice", desc: "請唸出單字：創業家", ans: "ENTREPRENEUR", speak: "entrepreneur", accept: ["ENTREPRENEURS"] },
      { type: "voice", desc: "請唸出單字：透明度", ans: "TRANSPARENCY", speak: "transparency" },
      { type: "choice", desc: "【最終試煉】Seldom ___ such a dramatic shift in consumer behavior.", options: ["A. we have seen", "B. have we seen", "C. we saw", "D. seen we have"], ans: "B", explain: "否定副詞 Seldom 放句首要倒裝：have + 主詞 + 過去分詞。" }
    ]
  },
  "C2 精通 (母語程度)": {
    normal: [
      { type: "spell", desc: "請拼出：無所不在的", ans: "UBIQUITOUS", speak: "ubiquitous" },
      { type: "spell", desc: "請拼出：並列對照", ans: "JUXTAPOSE", speak: "juxtapose" },
      { type: "spell", desc: "請拼出：深奧難懂的", ans: "ESOTERIC", speak: "esoteric" },
      { type: "spell", desc: "請拼出：務實的", ans: "PRAGMATIC", speak: "pragmatic" },
      { type: "spell", desc: "請拼出：盡責的、認真的", ans: "CONSCIENTIOUS", speak: "conscientious" },
      { type: "spell", desc: "請拼出：敷衍的", ans: "PERFUNCTORY", speak: "perfunctory" },
      { type: "spell", desc: "請拼出：短暫的、轉瞬即逝的", ans: "EPHEMERAL", speak: "ephemeral" },
      { type: "fill", desc: "填空題：M A G N A N _ M O U S (寬宏大量的)", ans: "I", speak: "magnanimous" },
      { type: "fill", desc: "填空題：A C Q U I E S C _ (默許、勉強同意)", ans: "E", speak: "acquiesce" },
      { type: "fill", desc: "填空題：P R O L I F E R _ T E (激增、擴散)", ans: "A", speak: "proliferate" },
      { type: "choice", desc: "【慣用語】Let's not ___ the gun; we haven't got approval yet.", options: ["A. jump", "B. shoot", "C. fire", "D. pull"], ans: "A", explain: "jump the gun 搶先行動、操之過急。" },
      { type: "choice", desc: "【倒裝句】Little ___ that the decision would change everything.", options: ["A. did they know", "B. they knew", "C. knew they", "D. they did know"], ans: "A", explain: "否定意味的 Little 放句首要倒裝：did + 主詞 + 原形動詞。" },
      { type: "choice", desc: "【精準用字】Her argument was so ___ that no one could refute it.", options: ["A. cogent", "B. tenuous", "C. vague", "D. trivial"], ans: "A", explain: "cogent 有說服力的；tenuous 薄弱的、vague 含糊的、trivial 瑣碎的。" },
      { type: "choice", desc: "【假設語氣】It is high time we ___ a decision.", options: ["A. make", "B. made", "C. will make", "D. have made"], ans: "B", explain: "It is (high) time + 主詞 + 過去式，表示「早該做某事了」。" },
      { type: "choice", desc: "【片語動詞】The staff resisted at first, but eventually came ___ to the new policy.", options: ["A. around", "B. across", "C. over", "D. up"], ans: "A", explain: "come around to 逐漸接受（原本反對的想法）。" },
      { type: "choice", desc: "【分詞構句】___ by the results, the team decided to expand the project.", options: ["A. Encouraged", "B. Encouraging", "C. To encourage", "D. Encourage"], ans: "A", explain: "團隊是「被鼓舞」的，用過去分詞 Encouraged 開頭的分詞構句。" },
      { type: "voice", desc: "請唸出單字：現象", ans: "PHENOMENON", speak: "phenomenon" },
      { type: "voice", desc: "請唸出單字：假說", ans: "HYPOTHESIS", speak: "hypothesis" }
    ],
    boss: [
      { type: "voice", desc: "請唸出單字：不可或缺的", ans: "INDISPENSABLE", speak: "indispensable" },
      { type: "voice", desc: "請唸出單字：精緻複雜的", ans: "SOPHISTICATED", speak: "sophisticated" },
      { type: "spell", desc: "請拼出：沉著、泰然自若", ans: "EQUANIMITY", speak: "equanimity" },
      { type: "choice", desc: "【最終咒語】Had it not been for your courage, the kingdom ___ lost forever.", options: ["A. would have been", "B. would be", "C. had been", "D. will be"], ans: "A", explain: "Had it not been for… 是省略 if 的過去假設，主要子句用 would have + 過去分詞。" },
      { type: "choice", desc: "【語感】The silence was ___; no one dared to speak.", options: ["A. deafening", "B. deaf", "C. deafened", "D. deafly"], ans: "A", explain: "deafening silence 震耳欲聾的寂靜，形容令人極度不安的沉默。" }
    ]
  }
};

export function mergePools(base: QuestionPool, extra: Partial<QuestionPool>): QuestionPool {
  const merged: QuestionPool = {};
  for (const key of new Set([...Object.keys(base), ...Object.keys(extra)])) {
    merged[key] = {
      normal: [...(base[key]?.normal ?? []), ...(extra[key]?.normal ?? [])],
      boss: [...(base[key]?.boss ?? []), ...(extra[key]?.boss ?? [])],
    };
  }
  return merged;
}

const BANK_POOL: QuestionPool = Object.fromEntries(LEVELS.map((level, i) => [level, BANK[i] ?? { normal: [], boss: [] }]));
export const QUESTION_POOL: QuestionPool = mergePools(mergePools(BASE_POOL, generatedPool as Partial<QuestionPool>), BANK_POOL);

// 題目在區域內的難度：CEFR 題庫有標註；舊題目用題型與單字長度推斷
export function questionDifficulty(q: Question): 1 | 2 | 3 {
  if (q.difficulty) return q.difficulty;
  if (q.type === 'choice') return 2;
  const word = (q.speak ?? q.ans).replace(/[^A-Za-z]/g, '');
  if (word.length <= 5) return 1;
  return word.length <= 8 ? 2 : 3;
}

// 題目的聽說讀寫分類：CEFR 題庫有標註；舊題目依題型推斷
export function questionSkill(q: Question): QuestionSkill {
  if (q.skill) return q.skill;
  if (q.type === 'voice') return 'speaking';
  if (q.type === 'choice') return q.desc.startsWith('🎧') ? 'listening' : 'reading';
  return 'writing';
}

// 區域內第幾關可以出到哪個難度：前 1/3 只出 1、中段出到 2、後段全部（50 關一個區域）
export const maxDifficultyAt = (stageIdx: number) => Math.min(3, 1 + Math.floor(stageIdx / 17)) as 1 | 2 | 3;

// 題庫還沒準備好的等級（新增的 A2+／B1+／B2+ 在題庫補齊前）先借用前一個有題目的等級
export function getPool(levelKey: string) {
  const own = QUESTION_POOL[levelKey];
  if (own && own.normal.length && own.boss.length) return own;
  for (let i = LEVELS.indexOf(levelKey) - 1; i >= 0; i--) {
    const prev = QUESTION_POOL[LEVELS[i]];
    if (prev && prev.normal.length && prev.boss.length) return prev;
  }
  return QUESTION_POOL[LEVELS[0]];
}

// 洗牌後依序抽題，抽完自動重新洗牌；戰鬥中怪物還沒倒下時也從這裡繼續抽題。
// 傳入關卡（0 起算）時，越後面的關卡越會出到較難的題目：目前能出的最高難度約佔 6 成，其餘從較簡單的複習
export interface Decks {
  normal: (stageIdx?: number) => Question;
  boss: (stageIdx?: number) => Question;
}

export function createDecks(levelKey: string, rand: () => number = Math.random): Decks {
  const pool = getPool(levelKey);
  const makeDraw = (original: Question[]) => {
    const tiers = ([1, 2, 3] as const).map(d => original.filter(q => questionDifficulty(q) === d));
    const decks: Question[][] = [[], [], [], []]; // 0 = 不分難度
    const take = (i: number, from: Question[]) => {
      if (decks[i].length === 0) decks[i].push(...shuffleArray(from, rand));
      return decks[i].pop()!;
    };
    return (stageIdx?: number) => {
      if (stageIdx === undefined) return take(0, original);
      const max = maxDifficultyAt(stageIdx);
      const allowed = [1, 2, 3].filter(d => d <= max && tiers[d - 1].length > 0);
      if (allowed.length === 0) return take(0, original);
      const top = allowed[allowed.length - 1];
      const d = allowed.length === 1 || rand() < 0.6 ? top : allowed[Math.floor(rand() * (allowed.length - 1))];
      return take(d, tiers[d - 1]);
    };
  };
  return { normal: makeDraw(pool.normal), boss: makeDraw(pool.boss) };
}

export function generateStages(levelKey: string, decks: Decks = createDecks(levelKey)): Stage[] {
  const generatedStages: Stage[] = [];
  for (let i = 1; i <= 50; i++) {
    if (i === 50 && levelKey === LEVELS[LEVELS.length - 1]) {
      // 最後一個區域的終點：沉默魔王
      generatedStages.push({ name: `第 ${i} 關：沉默魔王`, bossMode: true, kind: 'final', questions: [decks.boss(i - 1), decks.boss(i - 1), decks.boss(i - 1)] });
    } else if (i === 50) {
      generatedStages.push({ name: `第 ${i} 關：星球最終試煉`, bossMode: true, questions: [decks.boss(i - 1), decks.boss(i - 1)] });
    } else if (i % 10 === 0) {
      generatedStages.push({ name: `第 ${i} 關：守門菁英`, bossMode: true, questions: [decks.boss(i - 1)] });
    } else if (i % 10 === 5) {
      generatedStages.push({ name: `第 ${i} 關：菁英怪`, bossMode: false, kind: 'elite', questions: [decks.normal(i - 1)] });
    } else if (i % 10 === 7) {
      generatedStages.push({ name: `第 ${i} 關：寶箱怪`, bossMode: false, kind: 'treasure', questions: [decks.normal(i - 1)] });
    } else {
      generatedStages.push({ name: `第 ${i} 關：持續推進`, bossMode: false, questions: [decks.normal(i - 1)] });
    }
  }
  return generatedStages;
}
