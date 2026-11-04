import fs from 'fs';
import path from 'path';

// 標準單字詞性與繁體中文修復對照表
const WORD_FIXES: Record<string, { pos: string; meaning: string }> = {
  WAKE: { pos: 'v.', meaning: '醒來；喚醒' },
  STUDIES: { pos: 'v.', meaning: '學習；研究' },
  TOMATOES: { pos: 'n.', meaning: '番茄' },
  SHOES: { pos: 'n.', meaning: '鞋子' },
  RUNS: { pos: 'v.', meaning: '跑步；經營' },
  EATS: { pos: 'v.', meaning: '吃' },
  GOES: { pos: 'v.', meaning: '去；前往' },
  PLAYS: { pos: 'v.', meaning: '玩耍；演奏' },
  MUCH: { pos: 'adj.', meaning: '很多；大量' },
  CHEESE: { pos: 'n.', meaning: '起司；乳酪' },
  GETS: { pos: 'v.', meaning: '得到；獲得' },
  SHEEP: { pos: 'n.', meaning: '綿羊' },
  BROWN: { pos: 'adj.', meaning: '棕色的' },
  STUDENTS: { pos: 'n.', meaning: '學生' },
  RENTED: { pos: 'v.', meaning: '租用 (過去式)' },
  QUIETER: { pos: 'adj.', meaning: '更安靜的' },
  DROPPED: { pos: 'v.', meaning: '掉落；下降 (過去式)' },
  FRIENDLIEST: { pos: 'adj.', meaning: '最友善的' },
  STARTED: { pos: 'v.', meaning: '開始 (過去式)' },
  HARDER: { pos: 'adj.', meaning: '更努力的；更艱難的' },
  WON: { pos: 'v.', meaning: '贏得；獲勝 (過去式)' },
  CLEARER: { pos: 'adj.', meaning: '更清晰的' },
  LEFT: { pos: 'v.', meaning: '離開 (過去式)' },
  HEAVIEST: { pos: 'adj.', meaning: '最重的' },
  BECAME: { pos: 'v.', meaning: '成為 (過去式)' },
  STRONGER: { pos: 'adj.', meaning: '更強壯的' },
  BOUGHT: { pos: 'v.', meaning: '購買 (過去式)' },
  GREATEST: { pos: 'adj.', meaning: '最偉大的' },
  OPENED: { pos: 'v.', meaning: '打開 (過去式)' },
  GOT: { pos: 'v.', meaning: '獲得；得到 (過去式)' },
  CHEAPEST: { pos: 'adj.', meaning: '最便宜的' },
  SANG: { pos: 'v.', meaning: '唱歌 (過去式)' },
  LISTENED: { pos: 'v.', meaning: '傾聽 (過去式)' },
  MAKE: { pos: 'v.', meaning: '製造；使得' },
  STOPS: { pos: 'v.', meaning: '停止；阻止' },
  WILDLIFE: { pos: 'n.', meaning: '野生動植物' },
  MODERNIZED: { pos: 'v.', meaning: '使現代化 (過去式)' },
  PRODUCED: { pos: 'v.', meaning: '生產；製造 (過去式)' },
  HINDERED: { pos: 'v.', meaning: '阻礙；妨礙 (過去式)' },
  CONTAINED: { pos: 'v.', meaning: '包含；容納 (過去式)' },
  SOLD: { pos: 'v.', meaning: '出售；賣 (過去式)' },
  WASTED: { pos: 'v.', meaning: '浪費 (過去式)' },
  ARTIFACTS: { pos: 'n.', meaning: '歷史文物；手工藝品' },
  ENDORSEMENTS: { pos: 'n.', meaning: '代言；支持背書' },
  DIVERSIFICATION: { pos: 'n.', meaning: '多樣化；多元經營' },
};

function main() {
  const bankDir = path.resolve('src/game/questions/bank');
  let totalFixed = 0;
  let totalRemoved = 0;

  for (let r = 0; r <= 8; r++) {
    const file = path.join(bankDir, `vocab-r${r}.json`);
    if (!fs.existsSync(file)) continue;

    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    const newData: Record<string, any> = {};

    for (const [k, item] of Object.entries<any>(data)) {
      // 1. 移除純數字、時間、金額或非字母開頭之題幹片段
      if (!/^[A-Za-z]/.test(k) || /^\$?[0-9]/.test(item.word || '')) {
        totalRemoved++;
        continue;
      }

      // 2. 移除長句子選項 (超過 3 個單字且釋義為提示詞洩漏)
      const wordCount = k.split(/\s+/).length;
      const isLeaked = item.meaning && (/繁體中文解說/.test(item.meaning) || /^本題測試/.test(item.meaning) || item.meaning === item.word);
      if (wordCount > 3 && isLeaked) {
        totalRemoved++;
        continue;
      }

      // 3. 針對核心單字替換為標準詞性與釋義
      const upper = k.toUpperCase().trim();
      if (WORD_FIXES[upper]) {
        item.pos = WORD_FIXES[upper].pos;
        item.meaning = WORD_FIXES[upper].meaning;
        totalFixed++;
      } else if (isLeaked) {
        // 其他未能匹配的短語，若仍包含洩漏提示詞且無法確定釋義，予以安全移除，避免垃圾條目進入圖鑑
        totalRemoved++;
        continue;
      }

      newData[k] = item;
    }

    fs.writeFileSync(file, JSON.stringify(newData, null, 2) + '\n', 'utf8');
    console.log(`R${r}: remaining entries = ${Object.keys(newData).length}`);
  }

  console.log(`\n🎉 清洗完成！修復核心單字釋義: ${totalFixed} 筆，剔除垃圾整句/數字條目: ${totalRemoved} 筆`);
}

main();
