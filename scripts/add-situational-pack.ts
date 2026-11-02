import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import type { Question } from '../src/game/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface SituationalQuestionSpec {
  region: 'r0' | 'r1' | 'r2' | 'r3' | 'r4' | 'r5';
  kind: 'normal' | 'boss';
  question: Question;
  vocab: { word: string; zh: string; sentence: string };
}

// 實用生活高頻交際情境包（涵蓋食衣住行、商務、求醫、旅遊全維度）
const SITUATIONAL_PACK: SituationalQuestionSpec[] = [
  // === 【點餐與外送 Dining & Delivery】 (A1 - r0 / A2 - r1) ===
  {
    region: 'r0', kind: 'normal',
    question: {
      type: 'choice', skill: 'listening', difficulty: 1,
      desc: '🎧 【餐廳點水】請聽服務生詢問並選出正確回應：',
      speak: 'Still or sparkling water for the table?',
      ans: 'A',
      options: ['A. Still water, please.', 'B. I have three tables.', 'C. The water is hot.', 'D. Yes, I am hungry.'],
      explain: '服務生詢問要「常溫水還是氣泡水？」（Still or sparkling water），最適當的回答是「請給我們常溫水」（Still water, please）。'
    },
    vocab: { word: 'SPARKLING', zh: '氣泡的', sentence: 'Would you prefer still or sparkling water?' }
  },
  {
    region: 'r0', kind: 'normal',
    question: {
      type: 'spell', skill: 'writing', difficulty: 1,
      desc: '【餐飲單字】用餐時盛裝食物的「餐盤／盤子」（5個字母）：',
      ans: 'PLATE',
    },
    vocab: { word: 'PLATE', zh: '盤子／餐盤', sentence: 'Please pass me that clean plate.' }
  },
  {
    region: 'r1', kind: 'normal',
    question: {
      type: 'choice', skill: 'listening', difficulty: 1,
      desc: '🎧 【外送點餐】請聽店員的詢問並選出正確回應：',
      speak: 'Would you like that for dine-in or takeout?',
      ans: 'B',
      options: ['A. Yes, I like food.', 'B. For takeout, please.', 'C. I am cooking.', 'D. At five o\'clock.'],
      explain: '店員詢問「你要內用還是外帶？」（dine-in or takeout），最適當的回應為「外帶，謝謝」（For takeout, please）。'
    },
    vocab: { word: 'TAKEOUT', zh: '外帶', sentence: 'I ordered takeout for dinner.' }
  },
  {
    region: 'r1', kind: 'normal',
    question: {
      type: 'choice', skill: 'reading', difficulty: 1,
      desc: '【咖啡廳告示】Notice: Please inform the barista if you have any milk allergies. We offer oat and soy milk upon request.\nQ: What should customers do if they cannot drink dairy milk?',
      ans: 'C',
      options: ['A. Bring their own drinks', 'B. Pay extra cash only', 'C. Ask for oat or soy milk', 'D. Leave the cafe immediately'],
      explain: '告示說明如有牛奶過敏請告知咖啡師，店內提供燕麥奶與豆奶（offer oat and soy milk upon request），因此選項 C 正確。'
    },
    vocab: { word: 'BARISTA', zh: '咖啡師', sentence: 'The barista prepared my morning coffee.' }
  },
  {
    region: 'r1', kind: 'normal',
    question: {
      type: 'voice', skill: 'speaking', difficulty: 1,
      desc: '【口說點餐】請唸出向店員點餐的常用禮貌句：「Could I get an iced latte, please?」',
      speak: 'Could I get an iced latte please',
      ans: 'COULD I GET AN ICED LATTE PLEASE',
    },
    vocab: { word: 'COULD I GET AN ICED LATTE PLEASE', zh: '我可以點一杯冰拿鐵嗎？', sentence: 'Could I get an iced latte, please?' }
  },
  {
    region: 'r1', kind: 'normal',
    question: {
      type: 'spell', skill: 'writing', difficulty: 1,
      desc: '【生活單字】用餐結束後向服務生索取「帳單」（4個字母）：',
      ans: 'BILL',
    },
    vocab: { word: 'BILL', zh: '帳單', sentence: 'Could we have the bill, please?' }
  },
  {
    region: 'r1', kind: 'normal',
    question: {
      type: 'choice', skill: 'reading', difficulty: 1,
      desc: 'Customer: "Could you put the salad dressing on the side?"\nWaiter: "Certainly, we will put it in a separate cup."\nQ: What does "on the side" mean here?',
      ans: 'A',
      options: ['A. Served in a separate container', 'B. Added on top of the plate', 'C. Mixed with hot soup', 'D. Cancelled completely'],
      explain: '「on the side」在餐飲情境意為「分開裝／附在旁邊」，不直接淋在沙拉上。'
    },
    vocab: { word: 'DRESSING', zh: '沙拉醬', sentence: 'Please put the salad dressing on the side.' }
  },
  {
    region: 'r1', kind: 'normal',
    question: {
      type: 'voice', skill: 'speaking', difficulty: 1,
      desc: '【口語結帳】請唸出用餐後請求買單的日常用語：「Check, please.」',
      speak: 'Check please',
      ans: 'CHECK PLEASE',
    },
    vocab: { word: 'CHECK PLEASE', zh: '請買單結帳', sentence: 'Check, please.' }
  },
  {
    region: 'r1', kind: 'normal',
    question: {
      type: 'choice', skill: 'listening', difficulty: 1,
      desc: '🎧 【餐飲廣播】請聽取叫號廣播並選出號碼：',
      speak: 'Order number forty-seven is ready for pickup at the counter.',
      ans: 'C',
      options: ['A. Order 27', 'B. Order 37', 'C. Order 47', 'D. Order 57'],
      explain: '語音播放「Order number forty-seven is ready for pickup」，47 號餐點已可至櫃檯領取。'
    },
    vocab: { word: 'COUNTER', zh: '櫃檯', sentence: 'Pick up your drink at the counter.' }
  },
  {
    region: 'r1', kind: 'normal',
    question: {
      type: 'spell', skill: 'writing', difficulty: 1,
      desc: '【生活單字】用餐客滿時需在候位區「等待」（4個字母）：',
      ans: 'WAIT',
    },
    vocab: { word: 'WAIT', zh: '等待', sentence: 'You will need to wait for ten minutes.' }
  },

  // === 【交通與問路 Transit & Navigation】 (A2 - r1 / A2+ - r2) ===
  {
    region: 'r1', kind: 'normal',
    question: {
      type: 'choice', skill: 'listening', difficulty: 1,
      desc: '🎧 【地鐵詢問】請聽乘客的問路並選出合適解答：',
      speak: 'Excuse me, does this train go to the international airport?',
      ans: 'A',
      options: ['A. Yes, it goes directly there.', 'B. I have two tickets.', 'C. It is raining outside.', 'D. The airport is closed.'],
      explain: '乘客詢問「請問這班列車有到國際機場嗎？」，最適當的回覆是「有，它直達那裡」（Yes, it goes directly there）。'
    },
    vocab: { word: 'DIRECTLY', zh: '直達地', sentence: 'This train goes directly to the city center.' }
  },
  {
    region: 'r1', kind: 'normal',
    question: {
      type: 'choice', skill: 'reading', difficulty: 1,
      desc: '【捷運轉乘指引】Transit Guide: Passengers traveling to the Museum Station should transfer to the Blue Line at Central Station.\nQ: What should passengers do at Central Station?',
      ans: 'D',
      options: ['A. Buy a new luggage', 'B. Take a taxi outside', 'C. Wait until tomorrow', 'D. Switch to the Blue Line'],
      explain: '文中指出前往博物館站的乘客應於中央車站轉乘藍線（transfer to the Blue Line），switch to 等於 transfer。'
    },
    vocab: { word: 'TRANSFER', zh: '轉乘', sentence: 'Transfer to the Blue Line at the next station.' }
  },
  {
    region: 'r1', kind: 'normal',
    question: {
      type: 'voice', skill: 'speaking', difficulty: 1,
      desc: '【問路交際】請唸出詢問洗手間位置的禮貌用語：「Excuse me, where is the nearest restroom?」',
      speak: 'Excuse me where is the nearest restroom',
      ans: 'EXCUSE ME WHERE IS THE NEAREST RESTROOM',
    },
    vocab: { word: 'EXCUSE ME WHERE IS THE NEAREST RESTROOM', zh: '請問最近的洗手間在哪裡？', sentence: 'Excuse me, where is the nearest restroom?' }
  },
  {
    region: 'r1', kind: 'normal',
    question: {
      type: 'spell', skill: 'writing', difficulty: 1,
      desc: '【生活單字】火車或捷運的「月台」（8個字母）：',
      ans: 'PLATFORM',
    },
    vocab: { word: 'PLATFORM', zh: '月台', sentence: 'The train is arriving at platform three.' }
  },
  {
    region: 'r2', kind: 'normal',
    question: {
      type: 'choice', skill: 'listening', difficulty: 2,
      desc: '🎧 【機場廣播】請聽取登機門變更廣播並回答問題：',
      speak: 'Attention passengers on Flight 204 to Tokyo: the departure gate has been changed from Gate B4 to Gate C12.',
      ans: 'C',
      options: ['A. Gate B4', 'B. Gate B12', 'C. Gate C12', 'D. Gate C4'],
      explain: '廣播說明登機門已由 B4 更改為 C12（changed from Gate B4 to Gate C12）。'
    },
    vocab: { word: 'DEPARTURE', zh: '出發／登機', sentence: 'Check the screen for your departure gate.' }
  },
  {
    region: 'r2', kind: 'normal',
    question: {
      type: 'choice', skill: 'reading', difficulty: 2,
      desc: 'Tourist: "Is the art museum within walking distance from here?"\nLocal: "Yes, it is only a five-minute walk straight down this avenue."\nQ: What does the local imply?',
      ans: 'B',
      options: ['A. You must take a bus.', 'B. The museum is very close.', 'C. The museum is already closed.', 'D. You need to rent a bicycle.'],
      explain: '五分鐘步行路程（five-minute walk）代表距離非常近（within walking distance）。'
    },
    vocab: { word: 'AVENUE', zh: '大道／林蔭道', sentence: 'Walk straight down this avenue.' }
  },
  {
    region: 'r2', kind: 'normal',
    question: {
      type: 'voice', skill: 'speaking', difficulty: 2,
      desc: '【飯店退房】請唸出退房並請求寄放行李的句子：「Could I leave my luggage here until this afternoon?」',
      speak: 'Could I leave my luggage here until this afternoon',
      ans: 'COULD I LEAVE MY LUGGAGE HERE UNTIL THIS AFTERNOON',
    },
    vocab: { word: 'COULD I LEAVE MY LUGGAGE HERE UNTIL THIS AFTERNOON', zh: '我可以寄放行李到今天下午嗎？', sentence: 'Could I leave my luggage here until this afternoon?' }
  },
  {
    region: 'r2', kind: 'normal',
    question: {
      type: 'spell', skill: 'writing', difficulty: 2,
      desc: '【旅遊單字】搭乘大眾運輸的「票價」（4個字母）：',
      ans: 'FARE',
    },
    vocab: { word: 'FARE', zh: '票價', sentence: 'How much is the bus fare?' }
  },

  // === 【租屋與居家生活 Housing & Maintenance】 (A2+ - r2 / B1 - r3) ===
  {
    region: 'r2', kind: 'normal',
    question: {
      type: 'choice', skill: 'listening', difficulty: 2,
      desc: '🎧 【租屋問題】請聽房客的留言並選出主要問題：',
      speak: 'Hello landlord, there is a water leak under the kitchen sink. Could you please send a plumber today?',
      ans: 'A',
      options: ['A. The sink is leaking water.', 'B. The kitchen light is broken.', 'C. The rent is overdue.', 'D. The keys are lost.'],
      explain: '房客提到「there is a water leak under the kitchen sink」（水槽底下漏水），需要水電工修理。'
    },
    vocab: { word: 'PLUMBER', zh: '水電工／水管工', sentence: 'Call a plumber to fix the leak.' }
  },
  {
    region: 'r2', kind: 'normal',
    question: {
      type: 'choice', skill: 'reading', difficulty: 2,
      desc: 'Apartment Listing: "$1,200/month. Utilities included: water and trash removal. Tenant pays electricity and Wi-Fi."\nQ: Which bill does the tenant have to pay separately?',
      ans: 'C',
      options: ['A. Water', 'B. Trash disposal', 'C. Electricity', 'D. Parking fee only'],
      explain: '招租資訊註明「Tenant pays electricity and Wi-Fi」（房客需自行負擔電費與網路），水費與垃圾費已包含在內。'
    },
    vocab: { word: 'UTILITIES', zh: '水電瓦斯公用事業費', sentence: 'The rent includes all basic utilities.' }
  },
  {
    region: 'r2', kind: 'normal',
    question: {
      type: 'voice', skill: 'speaking', difficulty: 2,
      desc: '【生活會話】請唸出向房東確認租約的句子：「Does the monthly rent include internet?」',
      speak: 'Does the monthly rent include internet',
      ans: 'DOES THE MONTHLY RENT INCLUDE INTERNET',
    },
    vocab: { word: 'DOES THE MONTHLY RENT INCLUDE INTERNET', zh: '每月租金有包含網路嗎？', sentence: 'Does the monthly rent include internet?' }
  },
  {
    region: 'r2', kind: 'normal',
    question: {
      type: 'spell', skill: 'writing', difficulty: 2,
      desc: '【生活單字】房屋租賃的「租約／租約合約」（5個字母）：',
      ans: 'LEASE',
    },
    vocab: { word: 'LEASE', zh: '租約', sentence: 'We signed a one-year lease.' }
  },
  {
    region: 'r3', kind: 'normal',
    question: {
      type: 'choice', skill: 'listening', difficulty: 2,
      desc: '🎧 【修繕通知】請聽大樓管委會廣播並選出停水時間：',
      speak: 'Notice to all residents: the water supply will be temporarily shut off tomorrow between 9 AM and 1 PM for maintenance.',
      ans: 'B',
      options: ['A. From 8 AM to 12 PM', 'B. From 9 AM to 1 PM', 'C. From 1 PM to 5 PM', 'D. All day tomorrow'],
      explain: '廣播明確指出停水時段為「between 9 AM and 1 PM」（上午9點至下午1點）。'
    },
    vocab: { word: 'MAINTENANCE', zh: '維護／保養', sentence: 'The elevator is closed for maintenance.' }
  },
  {
    region: 'r3', kind: 'normal',
    question: {
      type: 'choice', skill: 'reading', difficulty: 2,
      desc: 'Email to Landlord: "Dear Mr. Davis, the heating system in unit 302 stopped functioning last night. The temperature inside has dropped below 15 degrees. We appreciate your immediate assistance."\nQ: Why is the tenant urgent?',
      ans: 'A',
      options: ['A. The apartment has no heat in cold weather.', 'B. The rent was paid to the wrong account.', 'C. The tenant wants to move out today.', 'D. The neighbors are making loud noise.'],
      explain: '房客表示暖氣系統停止運作（heating system stopped functioning），室內溫度已降至 15 度以下，亟需暖氣修復。'
    },
    vocab: { word: 'HEATING', zh: '暖氣設施', sentence: 'Turn on the heating during winter.' }
  },
  {
    region: 'r3', kind: 'normal',
    question: {
      type: 'voice', skill: 'speaking', difficulty: 2,
      desc: '【租約洽詢】請唸出欲續約的商務租屋句：「I would like to renew my rental contract for another year.」',
      speak: 'I would like to renew my rental contract for another year',
      ans: 'I WOULD LIKE TO RENEW MY RENTAL CONTRACT FOR ANOTHER YEAR',
    },
    vocab: { word: 'I WOULD LIKE TO RENEW MY RENTAL CONTRACT FOR ANOTHER YEAR', zh: '我想續簽一年的租約。', sentence: 'I would like to renew my rental contract for another year.' }
  },
  {
    region: 'r3', kind: 'normal',
    question: {
      type: 'spell', skill: 'writing', difficulty: 2,
      desc: '【生活單字】租屋簽約時支付的「押金／保證金」（7個字母）：',
      ans: 'DEPOSIT',
    },
    vocab: { word: 'DEPOSIT', zh: '押金／保證金', sentence: 'The landlord required a two-month deposit.' }
  },

  // === 【職場與遠距會議 Workplace & Remote Communication】 (B1 - r3 / B1+ - r4) ===
  {
    region: 'r3', kind: 'normal',
    question: {
      type: 'choice', skill: 'listening', difficulty: 2,
      desc: '🎧 【視訊會議】請聽會議主持人的提醒並回答情境：',
      speak: 'David, we cannot hear you right now. I think you are speaking on mute.',
      ans: 'D',
      options: ['A. David left the office.', 'B. David\'s webcam is turned off.', 'C. The meeting has ended.', 'D. David forgot to unmute his microphone.'],
      explain: '主持人提到「speaking on mute」，代表戴維忘記解除麥克風靜音（forgot to unmute）。'
    },
    vocab: { word: 'MUTE', zh: '靜音', sentence: 'Please unmute your microphone to speak.' }
  },
  {
    region: 'r3', kind: 'normal',
    question: {
      type: 'choice', skill: 'reading', difficulty: 2,
      desc: 'Slack Message: "Hey team, let\'s wrap up our discussion by 3:30 so everyone has time to review the client feedback before the sprint ends."\nQ: What does the phrase "wrap up" mean?',
      ans: 'B',
      options: ['A. Put in a gift box', 'B. Finish or conclude', 'C. Postpone until next week', 'D. Start an argument'],
      explain: '「wrap up」在商務溝通中是非常高頻的片語，意為「結束／收尾」（finish or conclude）。'
    },
    vocab: { word: 'WRAP', zh: '結束／收尾(wrap up)', sentence: 'Let us wrap up today\'s discussion.' }
  },
  {
    region: 'r3', kind: 'normal',
    question: {
      type: 'voice', skill: 'speaking', difficulty: 2,
      desc: '【商務會話】請唸出視訊會議共享螢幕的實用語：「Let me share my screen to show the quarterly results.」',
      speak: 'Let me share my screen to show the quarterly results',
      ans: 'LET ME SHARE MY SCREEN TO SHOW THE QUARTERLY RESULTS',
    },
    vocab: { word: 'LET ME SHARE MY SCREEN TO SHOW THE QUARTERLY RESULTS', zh: '讓我共享螢幕展示季度成果。', sentence: 'Let me share my screen to show the quarterly results.' }
  },
  {
    region: 'r3', kind: 'normal',
    question: {
      type: 'spell', skill: 'writing', difficulty: 2,
      desc: '【職場單字】專案任務的最後「截止日期」（8個字母）：',
      ans: 'DEADLINE',
    },
    vocab: { word: 'DEADLINE', zh: '截止日期', sentence: 'We must submit the proposal before the deadline.' }
  },
  {
    region: 'r4', kind: 'normal',
    question: {
      type: 'choice', skill: 'reading', difficulty: 2,
      desc: 'Project Memo: "We are currently running behind schedule on the backend development. We need to allocate additional resources to meet our launch milestone."\nQ: What is the main problem stated in the memo?',
      ans: 'B',
      options: ['A. The budget was stolen.', 'B. The project is delayed.', 'C. The office is closing down.', 'D. The backend code was deleted.'],
      explain: '「running behind schedule」意為進度落後／延遲（is delayed），需增派人手趕上時程。'
    },
    vocab: { word: 'ALLOCATE', zh: '分配／撥給', sentence: 'Allocate additional resources to the project.' }
  },
  {
    region: 'r4', kind: 'normal',
    question: {
      type: 'choice', skill: 'listening', difficulty: 2,
      desc: '🎧 【商務行程】請聽專案經理留言並確認電話會議時間：',
      speak: 'Could we push back our conference call by half an hour to three thirty?',
      ans: 'C',
      options: ['A. Cancel the call completely', 'B. Move it forward to two thirty', 'C. Delay the call to three thirty', 'D. Meet in person at three'],
      explain: '「push back... by half an hour to three thirty」意為將通話延後 30 分鐘至 3:30（Delay the call）。'
    },
    vocab: { word: 'CONFERENCE', zh: '大型會議／電話會議', sentence: 'We will join the conference call at three thirty.' }
  },
  {
    region: 'r4', kind: 'normal',
    question: {
      type: 'voice', skill: 'speaking', difficulty: 2,
      desc: '【職場應對】請唸出向上級提出替代方案的俐落句：「I came up with an alternative solution for the bug.」',
      speak: 'I came up with an alternative solution for the bug',
      ans: 'I CAME UP WITH AN ALTERNATIVE SOLUTION FOR THE BUG',
    },
    vocab: { word: 'I CAME UP WITH AN ALTERNATIVE SOLUTION FOR THE BUG', zh: '我想出了解決該漏洞的替代方案。', sentence: 'I came up with an alternative solution for the bug.' }
  },
  {
    region: 'r4', kind: 'normal',
    question: {
      type: 'spell', skill: 'writing', difficulty: 2,
      desc: '【商務單字】雙方簽署的正式商業「合約」（8個字母）：',
      ans: 'CONTRACT',
    },
    vocab: { word: 'CONTRACT', zh: '合約', sentence: 'Both parties agreed to sign the contract.' }
  },

  // === 【醫療與藥局 Medical & Pharmacy】 (A2 - r1 / A2+ - r2 / B1 - r3 / B2 - r5) ===
  {
    region: 'r1', kind: 'normal',
    question: {
      type: 'choice', skill: 'listening', difficulty: 1,
      desc: '🎧 【藥局指引】請聽藥師的醫囑並選出服用方式：',
      speak: 'Take one pill twice a day after meals with a glass of water.',
      ans: 'A',
      options: ['A. 2 pills daily, after eating', 'B. 1 pill daily, before sleeping', 'C. 3 pills with juice', 'D. Only when you have a headache'],
      explain: '藥師說「Take one pill twice a day after meals」（一天兩次、每次一顆、飯後服用），等於一天兩顆且在用餐後服用。'
    },
    vocab: { word: 'PILL', zh: '藥丸／藥片', sentence: 'Take this pill after breakfast.' }
  },
  {
    region: 'r1', kind: 'normal',
    question: {
      type: 'choice', skill: 'reading', difficulty: 1,
      desc: 'Medicine Label: "Warning: May cause drowsiness. Avoid driving or operating machinery after taking this medication."\nQ: What should you NOT do after taking this medicine?',
      ans: 'C',
      options: ['A. Drink water', 'B. Sleep in bed', 'C. Drive a car', 'D. Stay at home'],
      explain: '警語標註「Avoid driving... after taking this medication」（服用本藥後避免開車），因此不可開車（Drive a car）。'
    },
    vocab: { word: 'MEDICATION', zh: '藥物', sentence: 'Take your medication on time.' }
  },
  {
    region: 'r1', kind: 'normal',
    question: {
      type: 'voice', skill: 'speaking', difficulty: 1,
      desc: '【求醫問診】請唸出向醫師描述症狀的日常句：「I have had a sore throat since yesterday.」',
      speak: 'I have had a sore throat since yesterday',
      ans: 'I HAVE HAD A SORE THROAT SINCE YESTERDAY',
    },
    vocab: { word: 'I HAVE HAD A SORE THROAT SINCE YESTERDAY', zh: '我從昨天起就喉嚨痛。', sentence: 'I have had a sore throat since yesterday.' }
  },
  {
    region: 'r1', kind: 'normal',
    question: {
      type: 'spell', skill: 'writing', difficulty: 1,
      desc: '【醫療單字】身體發熱發燙的「發燒」（5個字母）：',
      ans: 'FEVER',
    },
    vocab: { word: 'FEVER', zh: '發燒', sentence: 'She had a high fever last night.' }
  },
  {
    region: 'r2', kind: 'normal',
    question: {
      type: 'choice', skill: 'listening', difficulty: 2,
      desc: '🎧 【診所預約】請聽診所櫃檯的回覆並回答看診時間：',
      speak: 'Doctor Harris has an opening this Thursday at quarter past two in the afternoon.',
      ans: 'B',
      options: ['A. Thursday at 2:00 PM', 'B. Thursday at 2:15 PM', 'C. Thursday at 2:45 PM', 'D. Friday morning at 9:00 AM'],
      explain: '「quarter past two」即為 2 點 15 分（2:15 PM）。'
    },
    vocab: { word: 'QUARTER', zh: '一刻鐘／十五分鐘', sentence: 'The appointment is at a quarter past two.' }
  },
  {
    region: 'r2', kind: 'normal',
    question: {
      type: 'choice', skill: 'reading', difficulty: 2,
      desc: 'Clinic FAQ: "Do I need a prescription to purchase allergy relief tablets?"\nAnswer: "No, mild antihistamines are available over the counter."\nQ: What does "over the counter" mean?',
      ans: 'A',
      options: ['A. Available without a doctor\'s prescription', 'B. Sold only in hospital emergency rooms', 'C. Free of charge for all citizens', 'D. Delivered only through postal mail'],
      explain: '「over the counter」(OTC) 為成藥情境專用語，指「無需醫師處方籤即可於櫃檯購買」。'
    },
    vocab: { word: 'PRESCRIPTION', zh: '處方箋', sentence: 'You need a prescription for antibiotics.' }
  },
  {
    region: 'r2', kind: 'normal',
    question: {
      type: 'voice', skill: 'speaking', difficulty: 2,
      desc: '【藥房詢問】請唸出向藥師詢問副作用的實用語：「Does this medicine have any side effects?」',
      speak: 'Does this medicine have any side effects',
      ans: 'DOES THIS MEDICINE HAVE ANY SIDE EFFECTS',
    },
    vocab: { word: 'DOES THIS MEDICINE HAVE ANY SIDE EFFECTS', zh: '這款藥會有任何副作用嗎？', sentence: 'Does this medicine have any side effects?' }
  },
  {
    region: 'r2', kind: 'normal',
    question: {
      type: 'spell', skill: 'writing', difficulty: 2,
      desc: '【生活單字】生病時應多喝水並充分「休息」（4個字母）：',
      ans: 'REST',
    },
    vocab: { word: 'REST', zh: '休息', sentence: 'Get plenty of rest to recover quickly.' }
  },
  {
    region: 'r5', kind: 'normal',
    question: {
      type: 'choice', skill: 'reading', difficulty: 3,
      desc: 'Health Advisory: "Clinical trials indicate that sedentary lifestyles significantly heighten the risk of chronic cardiovascular diseases. Moderate aerobic exercise is recommended to mitigate these risks."\nQ: What does "mitigate" mean in the advisory?',
      ans: 'A',
      options: ['A. To reduce or lessen', 'B. To diagnose quickly', 'C. To celebrate openly', 'D. To increase dramatically'],
      explain: '「mitigate」在醫學與公衛指「減輕／緩解（風險或傷害）」（to reduce or lessen）。'
    },
    vocab: { word: 'MITIGATE', zh: '緩解／減輕', sentence: 'Exercise helps mitigate heart disease risk.' }
  },
  {
    region: 'r5', kind: 'normal',
    question: {
      type: 'voice', skill: 'speaking', difficulty: 3,
      desc: '【高階交際】請唸出向外國同事闡述風險緩解策略的商務句：「We must implement robust safety measures to mitigate potential risks.」',
      speak: 'We must implement robust safety measures to mitigate potential risks',
      ans: 'WE MUST IMPLEMENT ROBUST SAFETY MEASURES TO MITIGATE POTENTIAL RISKS',
    },
    vocab: { word: 'WE MUST IMPLEMENT ROBUST SAFETY MEASURES TO MITIGATE POTENTIAL RISKS', zh: '我們必須實施穩健的安全措施以降低潛在風險。', sentence: 'We must implement robust safety measures to mitigate potential risks.' }
  },
  {
    region: 'r5', kind: 'normal',
    question: {
      type: 'spell', skill: 'writing', difficulty: 3,
      desc: '【高階字彙】長期不變的、慢性的「疾病」（7個字母）：',
      ans: 'CHRONIC',
    },
    vocab: { word: 'CHRONIC', zh: '慢性的', sentence: 'He suffered from chronic back pain.' }
  },
];

export function applySituationalPack() {
  const bankDir = path.resolve(__dirname, '../src/game/questions/bank');
  const genVocabPath = path.resolve(__dirname, '../src/game/questions/generated-vocab.json');
  let genVocab: Record<string, { meaning: string; example: string }> = {};
  if (fs.existsSync(genVocabPath)) {
    genVocab = JSON.parse(fs.readFileSync(genVocabPath, 'utf8'));
  }

  const bankFiles: Record<string, { normal: Question[]; boss: Question[] }> = {
    r0: JSON.parse(fs.readFileSync(path.join(bankDir, 'r0.json'), 'utf8')),
    r1: JSON.parse(fs.readFileSync(path.join(bankDir, 'r1.json'), 'utf8')),
    r2: JSON.parse(fs.readFileSync(path.join(bankDir, 'r2.json'), 'utf8')),
    r3: JSON.parse(fs.readFileSync(path.join(bankDir, 'r3.json'), 'utf8')),
    r4: JSON.parse(fs.readFileSync(path.join(bankDir, 'r4.json'), 'utf8')),
    r5: JSON.parse(fs.readFileSync(path.join(bankDir, 'r5.json'), 'utf8')),
  };

  // Clear previous additions of situational pack to allow clean replacement
  for (const [, bank] of Object.entries(bankFiles)) {
    bank.normal = bank.normal.filter(q => !SITUATIONAL_PACK.some(item => item.question.desc === q.desc && item.question.type === q.type));
  }

  let addedCount = 0;
  let newVocabCount = 0;

  for (const item of SITUATIONAL_PACK) {
    const bank = bankFiles[item.region];
    const list = item.kind === 'normal' ? bank.normal : bank.boss;
    list.push(item.question);
    addedCount++;

    if (item.vocab) {
      const k = item.vocab.word.toUpperCase();
      const isSentence = item.vocab.word.includes(' ');
      genVocab[k] = {
        pos: isSentence ? 'phr.' : 'n.',
        meaning: item.vocab.zh,
        example: item.vocab.sentence,
        exampleZh: item.vocab.zh,
      };
      newVocabCount++;
    }
  }

  // Ensure every entry in generated vocab has required VocabEntry fields
  for (const [, v] of Object.entries(genVocab)) {
    const entry = v as { pos?: string; meaning: string; example: string; exampleZh?: string };
    if (!entry.pos) entry.pos = 'n.';
    if (!entry.exampleZh) entry.exampleZh = entry.meaning || '';
  }

  // Write updated bank files
  for (const [r, content] of Object.entries(bankFiles)) {
    fs.writeFileSync(path.join(bankDir, `${r}.json`), JSON.stringify(content, null, 2), 'utf8');
  }

  // Write updated generated vocab
  fs.writeFileSync(genVocabPath, JSON.stringify(genVocab, null, 2), 'utf8');

  console.log(`✅ 成功整合 ${addedCount} 題高頻生活情境真實用句至 r0~r5！`);
  console.log(`📚 同步萃取並新增 ${newVocabCount} 個情境生活單字字典卡片至 generated-vocab.json。`);
}

applySituationalPack();
