// 修復 T0 題庫 374 個題幹錯誤腳本：npx tsx scripts/fix-t0-questions.ts
import { readFileSync, writeFileSync } from 'node:fs';
import { bankFile } from '../src/game/questions/bank';
import type { Question } from '../src/game/types';

interface BankData {
  normal: Question[];
  boss: Question[];
}

function repairSpecificReadingQuestions(q: Question): Question | null {
  const d = q.desc;
  // r1.json
  if (d.includes('EXERCISE') && d.includes('短文')) {
    return { ...q, desc: '【短文閱讀】"I am working all day, so I go to the gym to EXERCISE at night."\nQ: When does he exercise?' };
  }
  if (d.includes('RULE') && d.includes('告示')) {
    return { ...q, desc: '【短文閱讀】[Notice] "Please do not touch the glass in the exhibition hall."\nQ: What is the rule here?' };
  }
  if (d.includes('MUSEUM') && d.includes('行程')) {
    return { ...q, desc: '【短文閱讀】[Tour Schedule] "Day 2: Visit the national MUSEUM in the morning."\nQ: When do tourists visit the museum?' };
  }
  if (d.includes('COURT') && d.includes('公告')) {
    return { ...q, desc: '【短文閱讀】[School Notice] "The basketball COURT will be closed next week for painting."\nQ: Why will the court be closed?' };
  }
  if (d.includes('USEFUL') && d.includes('部落格')) {
    return { ...q, desc: '【短文閱讀】[Blog] "The new wardrobe is bigger and more USEFUL than my old one, but it was very hard to build!"\nQ: What does the author say about the wardrobe?' };
  }
  if (d.includes('RECEIPT') && d.includes('標誌')) {
    return { ...q, desc: '【短文閱讀】[Store Sign] "Please keep your RECEIPT. We do not give money back if you come back the next day."\nQ: What is true about returns?' };
  }
  if (d.includes('SOFTWARE') && d.includes('日記')) {
    return { ...q, desc: '【短文閱讀】[Diary] "He solved the SOFTWARE problem yesterday when nobody else could."\nQ: What did he do yesterday?' };
  }
  if (d.includes('TOOTHBRUSH') && d.includes('傳單')) {
    return { ...q, desc: '【短文閱讀】[Store Flyer] "Buy one get one free on each TOOTHBRUSH! This offer is only valid with a store MEMBERSHIP card."\nQ: How can customers get the discount?' };
  }
  if (d.includes('DESSERT') && d.includes('菜單')) {
    return { ...q, desc: '【短文閱讀】[Lunch Menu] Chicken Sandwich: $5, Beef Burger: $7, Salad: $4. Add a DESSERT: $2.\nQ: How much is a beef burger with dessert?' };
  }
  // r2.json
  if (d.includes('ATTACHMENT')) {
    return { ...q, desc: '【短文閱讀】[Email] "Please review the ATTACHMENT before our staff gathering."\nQ: What are employees asked to do?' };
  }
  if (d.includes('SALARY') && d.includes('會議紀錄')) {
    return { ...q, desc: '【短文閱讀】[Meeting Notes] "Employees will receive a SALARY increase due to great sales this quarter."\nQ: Why will employees get a raise?' };
  }
  if (d.includes('GUIDE') && d.includes('旅遊指南')) {
    return { ...q, desc: '【短文閱讀】[Visitor Guide] "Do not touch the historical paintings in the museum gallery."\nQ: What is a rule for visitors?' };
  }
  if (d.includes('HISTORICAL') && d.includes('景點介紹')) {
    return { ...q, desc: '【短文閱讀】[City Guide] "The HISTORICAL museum is open Tuesday through Sunday. It is closed on Mondays."\nQ: When can tourists NOT visit?' };
  }
  if (d.includes('PROTEIN')) {
    return { ...q, desc: '【短文閱讀】[Health Tips] "Eat more PROTEIN for energy. Meat and eggs are great sources of daily protein."\nQ: What is recommended for protein?' };
  }
  if (d.includes('WEIGHT')) {
    return { ...q, desc: '【短文閱讀】[Diet Advice] "Fast food can increase your WEIGHT. You should cook at home more often."\nQ: What is advised to avoid weight gain?' };
  }
  if (d.includes('ACCOUNT')) {
    return { ...q, desc: '【短文閱讀】[App Instructions] "To use this app, first create an ACCOUNT with your email."\nQ: What must a new user do first?' };
  }
  if (d.includes('GATHER')) {
    return { ...q, desc: '【短文閱讀】[Community Notice] "We will GATHER in the park on Saturday morning to clean up."\nQ: Where will volunteers meet?' };
  }
  if (d.includes('ORGANIZE') && d.includes('職場郵件')) {
    return { ...q, desc: '【短文閱讀】[Email] "Please ORGANIZE your shared project files so the team can locate them easily."\nQ: Why should files be organized?' };
  }
  if (d.includes('DISCOVER') && d.includes('旅遊指南')) {
    return { ...q, desc: '【短文閱讀】[Travel Guide] "Visit the local markets in the morning to DISCOVER fresh fruits and crafts."\nQ: When should tourists visit the markets?' };
  }
  if (d.includes('ENVIRONMENT') && d.includes('社區公告')) {
    return { ...q, desc: '【短文閱讀】[Green Notice] "Recycle your plastic bottles to protect our local ENVIRONMENT."\nQ: What should residents do to protect the environment?' };
  }
  if (d.includes('FEATURE') && d.includes('App更新')) {
    return { ...q, desc: '【短文閱讀】[App Update] "Turn on the new dark mode FEATURE to protect your eyes at night."\nQ: What is the benefit of the new feature?' };
  }
  if (d.includes('SENSOR')) {
    return { ...q, desc: '【短文閱讀】[Clinic Notice] "Please wear loose clothing so the nurse can place the medical SENSORS easily."\nQ: Why should patients wear loose clothing?' };
  }
  if (d.includes('未來式 be going to 的問句')) {
    return { ...q, desc: '【時態】「Q: ___ attend the company dinner tonight? A: No, I am not.」空格中應填入：' };
  }
  return null;
}

function repairQuestion(q: Question, idx: number, prefix: string): { question: Question; fixed: boolean } {
  if (q.type !== 'choice') return { question: q, fixed: false };

  const specific = repairSpecificReadingQuestions(q);
  if (specific) return { question: specific, fixed: true };

  const body = q.desc.replace(/【[^】]*】/g, '').trim();
  const metaOnly = /^含有/.test(body) || (!q.speak && !q.desc.includes('「') && !/[A-Za-z]{2,}/.test(body));
  if (q.desc.startsWith('🎧') || !metaOnly) {
    return { question: q, fixed: false };
  }

  const tagMatch = q.desc.match(/^【[^】]+】/);
  const tag = tagMatch ? tagMatch[0] : '【字彙】';
  const explain = q.explain || '';

  // 1. 若 explain 包含帶空格 ___ 的完整英文句子
  const enGapMatch = explain.match(/(?:題目|句子)?(?:：|:)?\s*([A-Z][A-Za-z0-9,\s'’"-]+_{2,}[A-Za-z0-9,\s'’"!?.-]+)/);
  if (enGapMatch && enGapMatch[1].includes('___')) {
    const sentence = enGapMatch[1].trim();
    return {
      question: {
        ...q,
        desc: `${tag} ${sentence}`,
      },
      fixed: true,
    };
  }

  // 2. 若四個選項都是完整的英文句子（長度 >= 4 個單字），此題為「選出文法正確的句子」
  const isFullSentences = q.options?.every(o => o.slice(3).trim().split(/\s+/).length >= 4);
  if (isFullSentences) {
    const newDesc = q.desc
      .replace(/含有\s*(.*?)\s*的英文句子/, '請選出正確使用 $1 的句子：')
      .replace(/含有\s*(.*?)\s*的句子/, '請選出正確使用 $1 的句子：')
      .replace(/含有\s*(.*?)\s*的對話/, '請選出正確使用 $1 的句子：')
      .replace(/含有\s*(.*?)\s*的英文對話/, '請選出正確使用 $1 的句子：')
      .replace(/含有\s*(.*?)\s*的短文閱讀/, '請選出正確使用 $1 的句子：')
      .replace(/含有\s*(.*?)\s*的告示閱讀/, '請選出正確使用 $1 的句子：')
      .replace(/含有\s*(.*?)\s*的行程閱讀/, '請選出正確使用 $1 的句子：')
      .replace(/含有\s*(.*?)\s*的日記閱讀/, '請選出正確使用 $1 的句子：')
      .replace(/含有\s*(.*?)\s*的學校公告/, '請選出正確使用 $1 的句子：')
      .replace(/含有\s*(.*?)\s*的部落格閱讀/, '請選出正確使用 $1 的句子：')
      .replace(/含有\s*(.*?)\s*的標誌閱讀/, '請選出正確使用 $1 的句子：')
      .replace(/含有\s*(.*?)\s*的傳單閱讀/, '請選出正確使用 $1 的句子：')
      .replace(/含有\s*(.*?)\s*的廣告閱讀/, '請選出正確使用 $1 的句子：')
      .replace(/含有\s*(.*?)\s*的推論題/, '請選出正確使用 $1 的句子：');
    return {
      question: {
        ...q,
        desc: newDesc.startsWith('【') ? newDesc : `${tag} ${newDesc}`,
      },
      fixed: true,
    };
  }

  // 3. 若 explain 包含帶引號「...」的句意或中文題幹
  const quoteMatch = explain.match(/「([^」]+)」/);
  if (quoteMatch) {
    const quote = quoteMatch[1].trim();
    let promptStem = '';
    if (quote.includes('___')) {
      promptStem = `${tag}「${quote}」空格中應填入：`;
    } else {
      // 提取被測試的單字或語意主旨，避免重名
      const targetWord = q.desc.match(/含有\s*([A-Za-z]+)/)?.[1] || '';
      const uniqueSuffix = targetWord ? ` (${targetWord})` : ` #${idx + 1}`;
      promptStem = `${tag}「${quote}」選出適當的英文單字填入${uniqueSuffix}：`;
    }
    return {
      question: {
        ...q,
        desc: promptStem,
      },
      fixed: true,
    };
  }

  // 4. 若含有時態/情態/語法關鍵字（例如 going to / will / can / must）
  const grammarWordMatch = q.desc.match(/含有\s*(.*?)\s*(?:的句子|的英文句子|的疑問句|的否定形|的條件句|的長句)/);
  if (grammarWordMatch) {
    const target = grammarWordMatch[1].trim();
    const juyiMatch = explain.match(/句意[：:]\s*([^。\n]+)/);
    const uniqueTag = `(${q.options?.[0]?.slice(3)?.trim() || idx})`;
    if (juyiMatch) {
      return {
        question: {
          ...q,
          desc: `${tag}「${juyiMatch[1].trim()}」請選出符合句型「${target}」的適當選項 ${uniqueTag}：`,
        },
        fixed: true,
      };
    }
    return {
      question: {
        ...q,
        desc: `${tag}請選出正確符合句型「${target}」的選項 ${uniqueTag}：`,
      },
      fixed: true,
    };
  }

  // 5. 兜底轉換
  const fallbackTarget = q.desc.match(/含有\s*([A-Za-z0-9\s]+)/)?.[1]?.trim() || `題項${idx + 1}`;
  return {
    question: {
      ...q,
      desc: `${tag}請選出正確符合「${fallbackTarget}」的選項：`,
    },
    fixed: true,
  };
}

let totalFixed = 0;
for (let regionIdx = 1; regionIdx <= 3; regionIdx++) {
  const file = bankFile(regionIdx);
  const data: BankData = JSON.parse(readFileSync(file, 'utf-8'));

  let countInFile = 0;
  data.normal = data.normal.map((q, idx) => {
    const res = repairQuestion(q, idx, `r${regionIdx}-n`);
    if (res.fixed) countInFile++;
    return res.question;
  });
  data.boss = data.boss.map((q, idx) => {
    const res = repairQuestion(q, idx, `r${regionIdx}-b`);
    if (res.fixed) countInFile++;
    return res.question;
  });

  totalFixed += countInFile;
  writeFileSync(file, JSON.stringify(data, null, 2) + '\n', 'utf-8');
  console.log(`Region ${regionIdx} (${file}): 修復了 ${countInFile} 題`);
}

console.log(`\n🎉 總計修復完成：${totalFixed} 題！`);
