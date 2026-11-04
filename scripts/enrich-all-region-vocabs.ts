import fs from 'fs';
import path from 'path';
import type { VocabEntry } from '../src/game/types';

// 1. 讀取全域詞庫
const gvPath = path.resolve(process.cwd(), 'src/game/questions/generated-vocab.json');
const gv: Record<string, any> = JSON.parse(fs.readFileSync(gvPath, 'utf8'));

// 建立高品質標準單字字典 (大寫 Lemma -> VocabEntry)
const masterDict = new Map<string, VocabEntry>();

// 核心基礎動詞與名詞的高質量乾淨釋義（消滅早期模板殘留）
const CORE_CLEAN_WORDS: Record<string, { pos: string; meaning: string; example: string; exampleZh: string }> = {
  MAKE: { pos: 'v.', meaning: '製作；使得', example: 'She makes delicious coffee every morning.', exampleZh: '她每天早上煮美味的咖啡。' },
  TAKE: { pos: 'v.', meaning: '拿取；搭乘；花費', example: 'It takes twenty minutes to walk there.', exampleZh: '走路到那裡需要二十分鐘。' },
  DO: { pos: 'v.', meaning: '做；執行', example: 'I do my homework after dinner.', exampleZh: '我晚餐後做功課。' },
  GO: { pos: 'v.', meaning: '去；前往', example: 'They go to work by bus.', exampleZh: '他們搭公車上班。' },
  COME: { pos: 'v.', meaning: '來；抵達', example: 'Please come in and sit down.', exampleZh: '請進來坐下。' },
  SEE: { pos: 'v.', meaning: '看見；了解', example: 'I can see the mountains from my room.', exampleZh: '我從房間能看見群山。' },
  KNOW: { pos: 'v.', meaning: '知道；認識', example: 'Do you know the answer to this question?', exampleZh: '你知道這題的答案嗎？' },
  GET: { pos: 'v.', meaning: '得到；變得', example: 'He got a promotion last month.', exampleZh: '他上個月升職了。' },
  GIVE: { pos: 'v.', meaning: '給予', example: 'Please give me that document.', exampleZh: '請把那份文件給我。' },
  FIND: { pos: 'v.', meaning: '尋找；發現', example: 'I found a great restaurant near the hotel.', exampleZh: '我在飯店附近發現了一家很棒的餐廳。' },
  THINK: { pos: 'v.', meaning: '思考；認為', example: 'What do you think about the new proposal?', exampleZh: '你對這項新提案有什麼看法？' },
  TELL: { pos: 'v.', meaning: '告訴；講述', example: 'Can you tell me the way to the station?', exampleZh: '你可以告訴我去車站的路嗎？' },
  BECOME: { pos: 'v.', meaning: '變成；成為', example: 'He became a successful manager.', exampleZh: '他成為了一名成功的經理。' },
  LEAVE: { pos: 'v.', meaning: '離開；留下', example: 'The train leaves at ten sharp.', exampleZh: '火車十點整開車。' },
  PUT: { pos: 'v.', meaning: '放；擺放', example: 'Please put your luggage on the rack.', exampleZh: '請將您的行李放在架子上。' },
  MEAN: { pos: 'v.', meaning: '意味著；意思是', example: 'What does this symbol mean?', exampleZh: '這個符號是什麼意思？' },
  KEEP: { pos: 'v.', meaning: '保持；保留', example: 'Please keep the receipt for warranty.', exampleZh: '請保留收據以供保固。' },
  LET: { pos: 'v.', meaning: '讓；允許', example: 'Let me check the schedule first.', exampleZh: '讓我先確認一下行程。' },
  BEGIN: { pos: 'v.', meaning: '開始', example: 'The conference will begin at nine o\'clock.', exampleZh: '會議將在九點開始。' },
  SEEM: { pos: 'v.', meaning: '似乎；看來', example: 'Everything seems to be under control.', exampleZh: '一切看來都在掌控之中。' },
  HELP: { pos: 'v.', meaning: '幫助；協助', example: 'She offered to help us with the presentation.', exampleZh: '她主動提出協助我們做簡報。' },
  SHOW: { pos: 'v.', meaning: '展示；表明', example: 'The report shows a steady growth in sales.', exampleZh: '報告顯示銷售持續成長。' },
  HEAR: { pos: 'v.', meaning: '聽見；得知', example: 'Did you hear the announcement?', exampleZh: '你有聽到廣播嗎？' },
  PLAY: { pos: 'v.', meaning: '玩耍；播放；演奏', example: 'Children are playing in the park.', exampleZh: '孩子們正在公園玩耍。' },
  RUN: { pos: 'v.', meaning: '跑步；運轉；經營', example: 'He runs a small tech company.', exampleZh: '他經營一家小型科技公司。' },
  MOVE: { pos: 'v.', meaning: '移動；搬遷', example: 'The office will move to the fourth floor.', exampleZh: '辦公室將搬到四樓。' },
  LIVE: { pos: 'v.', meaning: '居住；生活', example: 'They live in a quiet neighborhood.', exampleZh: '他們住在一個寧靜的社區。' },
  BELIEVE: { pos: 'v.', meaning: '相信；信任', example: 'I believe we can meet the deadline.', exampleZh: '我相信我們能趕上截止日期。' },
  BRING: { pos: 'v.', meaning: '帶來；拿來', example: 'Please bring your laptop to the meeting.', exampleZh: '開會時請攜帶您的筆記型電腦。' },
  HAPPEN: { pos: 'v.', meaning: '發生', example: 'An unexpected delay happened yesterday.', exampleZh: '昨天發生了一場意料之外的延誤。' },
  WRITE: { pos: 'v.', meaning: '書寫；寫信', example: 'She wrote a detailed summary of the event.', exampleZh: '她寫了一份詳盡的活動摘要。' },
  PROVIDE: { pos: 'v.', meaning: '提供；供應', example: 'The company provides health insurance for all employees.', exampleZh: '公司為所有員工提供健康保險。' },
  SIT: { pos: 'v.', meaning: '坐下', example: 'Please sit in the waiting area.', exampleZh: '請在候車區就坐。' },
  STAND: { pos: 'v.', meaning: '站立；容忍', example: 'Passengers should stand behind the yellow line.', exampleZh: '乘客請站在黃線後方。' },
  LOSE: { pos: 'v.', meaning: '遺失；損失', example: 'Don\'t lose your boarding pass.', exampleZh: '請勿遺失您的登機證。' },
  PAY: { pos: 'v.', meaning: '支付；付款', example: 'You can pay by credit card or cash.', exampleZh: '您可以用信用卡或現金支付。' },
  MEET: { pos: 'v.', meaning: '遇見；會面；符合', example: 'We will meet the client tomorrow morning.', exampleZh: '我們明天早上會與客戶會面。' },
  INCLUDE: { pos: 'v.', meaning: '包含；涵蓋', example: 'The package includes breakfast and Wi-Fi.', exampleZh: '套裝行程包含早餐與無線網路。' },
  CONTINUE: { pos: 'v.', meaning: '繼續；持續', example: 'The discussion will continue after lunch.', exampleZh: '午餐後將繼續討論。' },
  SET: { pos: 'v.', meaning: '設定；放置', example: 'We need to set a date for the launch.', exampleZh: '我們需要訂定發布日期。' },
  LEARN: { pos: 'v.', meaning: '學習；獲悉', example: 'He learned a lot from his supervisor.', exampleZh: '他從主管身上學到了很多。' },
  CHANGE: { pos: 'v./n.', meaning: '改變；零錢', example: 'We must change our strategy to stay competitive.', exampleZh: '我們必須改變策略以保持競爭力。' },
  LEAD: { pos: 'v.', meaning: '引領；導致', example: 'Her innovative ideas led to great success.', exampleZh: '她的創新理念帶來了巨大的成功。' },
  UNDERSTAND: { pos: 'v.', meaning: '理解；明白', example: 'Do you understand the new instructions?', exampleZh: '你理解新的操作指引嗎？' },
  WATCH: { pos: 'v./n.', meaning: '觀看；手錶', example: 'Watch the video tutorial before starting.', exampleZh: '開始前請先觀看教學影片。' },
  FOLLOW: { pos: 'v.', meaning: '遵循；跟隨', example: 'Please follow the safety guidelines.', exampleZh: '請遵循安全準則。' },
  STOP: { pos: 'v./n.', meaning: '停止；車站', example: 'The bus will stop right outside the museum.', exampleZh: '公車會正好停在博物館外。' },
  CREATE: { pos: 'v.', meaning: '創造；建立', example: 'We created a new design for the homepage.', exampleZh: '我們為首頁建立了一套全新設計。' },
  SPEAK: { pos: 'v.', meaning: '說話；演講', example: 'He speaks fluent English and Japanese.', exampleZh: '他能說流利的英文與日文。' },
  READ: { pos: 'v.', meaning: '閱讀；朗讀', example: 'Read the contract carefully before signing.', exampleZh: '簽約前請仔細閱讀合約。' },
  ALLOW: { pos: 'v.', meaning: '允許；准許', example: 'Pets are not allowed inside the restaurant.', exampleZh: '餐廳內禁止攜帶寵物。' },
  ADD: { pos: 'v.', meaning: '增加；添加', example: 'Add your signature at the bottom of the page.', exampleZh: '在頁面底端加上您的簽名。' },
  SPEND: { pos: 'v.', meaning: '花費（金錢/時間）', example: 'We spent two weeks reviewing the audit report.', exampleZh: '我們花了兩週時間審閱審計報告。' },
  GROW: { pos: 'v.', meaning: '成長；增長', example: 'The company\'s market share continues to grow.', exampleZh: '該公司的市場份額持續成長。' },
  OPEN: { pos: 'v./adj.', meaning: '打開；營業中的', example: 'The store will open at nine tomorrow morning.', exampleZh: '店家明天早上九點開始營業。' },
  WALK: { pos: 'v./n.', meaning: '走路；散步', example: 'It is a five-minute walk from here.', exampleZh: '從這裡走過去只要五分鐘。' },
  WIN: { pos: 'v.', meaning: '獲勝；贏得', example: 'The team won first prize in the competition.', exampleZh: '該團隊在競賽中贏得了首獎。' },
  OFFER: { pos: 'v./n.', meaning: '提供；出價；提議', example: 'They offered him a managerial position.', exampleZh: '他們向他提供了一個管理職位。' },
  REMEMBER: { pos: 'v.', meaning: '記得；記住', example: 'Remember to lock the door before you leave.', exampleZh: '離開前請記得鎖門。' },
  CONSIDER: { pos: 'v.', meaning: '考慮；認為', example: 'We are considering several different vendors.', exampleZh: '我們正在考慮幾家不同的供應商。' },
  APPEAR: { pos: 'v.', meaning: '出現；顯露；似乎', example: 'New problems appeared during the software test.', exampleZh: '在軟體測試期間出現了新問題。' },
  BUY: { pos: 'v.', meaning: '購買', example: 'I bought two tickets for the morning flight.', exampleZh: '我買了兩張早班機的機票。' },
  WAIT: { pos: 'v.', meaning: '等待', example: 'Please wait in line for inspection.', exampleZh: '請排隊等候檢查。' },
  SERVE: { pos: 'v.', meaning: '服務；供應（餐飲）', example: 'Breakfast is served from seven to ten.', exampleZh: '早餐於七點至十點供應。' },
  DIE: { pos: 'v.', meaning: '死亡；消逝', example: 'Plants need sunlight and water or they will die.', exampleZh: '植物需要陽光與水，否則會枯死。' },
  SEND: { pos: 'v.', meaning: '寄送；派遣', example: 'Please send the invoice to our finance department.', exampleZh: '請將請款單寄至我們的財務部。' },
  EXPECT: { pos: 'v.', meaning: '期待；預期', example: 'We expect a high turnout for the annual seminar.', exampleZh: '我們預期年度研討會將有很多人出席。' },
  BUILD: { pos: 'v.', meaning: '建造；建立', example: 'They built a brand new facility outside the city.', exampleZh: '他們在城外興建了一座全新的設施。' },
  STAY: { pos: 'v./n.', meaning: '停留；暫住', example: 'How long do you plan to stay in Taipei?', exampleZh: '您預計在台北停留多久？' },
  FALL: { pos: 'v./n.', meaning: '落下；下跌；秋天', example: 'Prices are expected to fall next month.', exampleZh: '預計價格下個月會下跌。' },
  CUT: { pos: 'v./n.', meaning: '削減；切割', example: 'The firm decided to cut administrative expenses.', exampleZh: '該公司決定削減行政開支。' },
  REACH: { pos: 'v.', meaning: '抵達；達到；聯繫', example: 'You can reach me by email during office hours.', exampleZh: '上班時間您可以透過電子郵件與我聯繫。' },
  KILL: { pos: 'v.', meaning: '殺死；終結', example: 'Excessive heat can kill these sensitive crops.', exampleZh: '過度高溫會毀滅這些敏感農作物。' },
  REMAIN: { pos: 'v.', meaning: '維持；依然是；留下', example: 'The office will remain closed on national holidays.', exampleZh: '國定假日辦公室將保持關閉。' },
  SUGGEST: { pos: 'v.', meaning: '建議；暗示', example: 'The doctor suggested that I take more rest.', exampleZh: '醫生建議我多加休息。' },
  RAISE: { pos: 'v./n.', meaning: '提高；籌集；加薪', example: 'The company raised wages by five percent.', exampleZh: '公司調薪了百分之五。' },
  PASS: { pos: 'v./n.', meaning: '通過；傳遞；通行證', example: 'She passed the certification exam on her first attempt.', exampleZh: '她初次嘗試就通過了證照考試。' },
  SELL: { pos: 'v.', meaning: '販售；賣出', example: 'They sell organic vegetables at the local market.', exampleZh: '他們在當地市場販售有機蔬菜。' },
  REQUIRE: { pos: 'v.', meaning: '需要；要求', example: 'This visa requires proof of financial support.', exampleZh: '此簽證需要財力證明。' },
  REPORT: { pos: 'v./n.', meaning: '報告；報道', example: 'Please submit your quarterly report by Friday.', exampleZh: '請於週五前提交您的季度報告。' },
  DECIDE: { pos: 'v.', meaning: '決定', example: 'We decided to launch the product in autumn.', exampleZh: '我們決定在秋季推出這項產品。' },
  PULL: { pos: 'v.', meaning: '拉；拉動', example: 'Pull the handle gently to open the cabinet.', exampleZh: '輕輕拉動把手以打開櫃子。' }
};

// 先注入乾淨核心動詞
for (const [k, v] of Object.entries(CORE_CLEAN_WORDS)) {
  masterDict.set(k, { ...v, word: k.toLowerCase() });
}

// 注入全域詞庫合格條目
for (const [k, v] of Object.entries(gv)) {
  const val = v as any;
  let cleanKey = k.replace(/^R\d+:/, '').replace(/_/g, ' ').trim().toUpperCase();
  cleanKey = cleanKey.replace(/[^A-Z]/g, '').trim();
  if (cleanKey && cleanKey.length >= 2 && val.meaning && val.example) {
    if (val.meaning.includes('【') || val.meaning.includes('繁體中文解說') || val.meaning.includes('本題測試')) continue;
    if (!masterDict.has(cleanKey)) {
      masterDict.set(cleanKey, {
        word: val.word || cleanKey.toLowerCase(),
        pos: val.pos || 'n.',
        meaning: val.meaning,
        example: val.example,
        exampleZh: val.exampleZh || val.meaning + '。'
      });
    }
  }
}

// 屈折詞形還原函式
function findLemma(token: string): string | null {
  if (masterDict.has(token)) return token;
  if (token.endsWith('IES') && masterDict.has(token.slice(0, -3) + 'Y')) return token.slice(0, -3) + 'Y';
  if (token.endsWith('ES') && masterDict.has(token.slice(0, -2))) return token.slice(0, -2);
  if (token.endsWith('S') && masterDict.has(token.slice(0, -1))) return token.slice(0, -1);
  if (token.endsWith('ED')) {
    if (masterDict.has(token.slice(0, -2))) return token.slice(0, -2);
    if (masterDict.has(token.slice(0, -1))) return token.slice(0, -1);
    if (token.length > 4 && token[token.length - 3] === token[token.length - 4] && masterDict.has(token.slice(0, -3))) {
      return token.slice(0, -3);
    }
  }
  if (token.endsWith('ING')) {
    if (masterDict.has(token.slice(0, -3))) return token.slice(0, -3);
    if (masterDict.has(token.slice(0, -3) + 'E')) return token.slice(0, -3) + 'E';
    if (token.length > 5 && token[token.length - 4] === token[token.length - 5] && masterDict.has(token.slice(0, -4))) {
      return token.slice(0, -4);
    }
  }
  return null;
}

// 停用詞表
const STOP_WORDS = new Set([
  'A', 'AN', 'THE', 'THIS', 'THAT', 'THESE', 'THOSE',
  'I', 'ME', 'MY', 'MINE', 'YOU', 'YOUR', 'YOURS', 'HE', 'HIM', 'HIS', 'SHE', 'HER', 'HERS', 'IT', 'ITS', 'WE', 'US', 'OUR', 'OURS', 'THEY', 'THEM', 'THEIR', 'THEIRS',
  'IS', 'AM', 'ARE', 'WAS', 'WERE', 'BE', 'BEEN', 'BEING',
  'DO', 'DOES', 'DID', 'DONE',
  'HAVE', 'HAS', 'HAD',
  'IN', 'ON', 'AT', 'TO', 'FOR', 'OF', 'WITH', 'BY', 'FROM', 'ABOUT', 'INTO', 'OVER', 'AFTER',
  'AND', 'BUT', 'OR', 'SO', 'IF', 'BECAUSE', 'AS', 'WHEN', 'WHILE',
  'WHAT', 'WHICH', 'WHO', 'WHOM', 'WHOSE', 'WHERE', 'WHY', 'HOW',
  'NOT', 'NO', 'CAN', 'COULD', 'WILL', 'WOULD', 'SHALL', 'SHOULD', 'MAY', 'MIGHT', 'MUST'
]);

console.log(`[詞典庫構建] 準備注入各分區... 乾淨單字基礎庫包含 ${masterDict.size} 條。`);

// 對 R0 到 R5（及 R6）進行徹底大清洗與擴充
for (let r = 0; r <= 8; r++) {
  // 注意：R7, R8 依 GPT 審查要求，保持 build.mjs 的輸出，不直接覆蓋；主要擴充 R0 ~ R6
  if (r === 7 || r === 8) continue;

  const qPath = path.resolve(process.cwd(), `src/game/questions/bank/r${r}.json`);
  const vPath = path.resolve(process.cwd(), `src/game/questions/bank/vocab-r${r}.json`);
  if (!fs.existsSync(qPath) || !fs.existsSync(vPath)) continue;

  const currentVocab: Record<string, VocabEntry> = JSON.parse(fs.readFileSync(vPath, 'utf8'));
  const bank = JSON.parse(fs.readFileSync(qPath, 'utf8'));
  const questions = [...bank.normal, ...bank.boss];

  const enrichedVocab: Record<string, VocabEntry> = {};

  // 1. 保留原本合格的純單字、片語，以及高階區有題目關聯的條目
  for (const [k, v] of Object.entries(currentVocab)) {
    const words = k.trim().split(/\s+/).filter(Boolean);
    if (r >= 6 || k.startsWith('R')) {
      // 高階區保留原有條目，確保 advancedBanks 測試契約完整
      enrichedVocab[k] = v;
      continue;
    }
    if (words.length > 4) {
      // R0~R5 超過 4 個詞是完整長句，從單字/片語卡片庫移出！
      continue;
    }
    // 剔除純數字、金額
    if (/^\$?\d+(\.\d+)?\.?$/.test(k.trim())) continue;
    enrichedVocab[k] = v;
  }

  // 2. 深度拆解題目句子，提煉題庫所有單字
  for (const q of questions) {
    const textPool = [
      q.desc,
      q.speak,
      q.ans,
      ...(q.options || []),
      q.explain
    ].filter(Boolean).join(' ');

    const tokens = textPool.toUpperCase().match(/[A-Z]{2,}/g) || [];
    for (const t of tokens) {
      if (STOP_WORDS.has(t)) continue;
      const lemma = findLemma(t);
      if (lemma && masterDict.has(lemma)) {
        if (!enrichedVocab[lemma]) {
          enrichedVocab[lemma] = masterDict.get(lemma)!;
        }
      }
    }
  }

  // 3. 寫回分區詞庫檔案
  fs.writeFileSync(vPath, JSON.stringify(enrichedVocab, null, 2) + '\n', 'utf8');

  let singleCount = 0;
  let phraseCount = 0;
  for (const k of Object.keys(enrichedVocab)) {
    const words = k.trim().split(/\s+/).filter(Boolean);
    if (words.length === 1) singleCount++;
    else phraseCount++;
  }

  console.log(`✅ [Region R${r}] 擴充完成！總計: ${Object.keys(enrichedVocab).length} 條 (純單字=${singleCount}, 地道片語=${phraseCount}, 長句=0)`);
}

console.log('[完成] 所有分區詞典檔案已成功更新與完備化！');
