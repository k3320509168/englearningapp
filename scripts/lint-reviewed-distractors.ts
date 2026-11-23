import './loadBanks';
import { QUESTION_POOL, LEVELS } from '../src/game/QuestionData';

// 已修正明顯長度暗示的高階聽力題。只約束已審過的題，舊候選另排審查。
const reviewed: [number, string][] = [
  [6, 'The visitor centre is nearby as the crow flies'],
  [7, 'The process becomes circular when'],
  [7, 'The menu is concise, but'],
  [7, 'The assurance applies to the stated route'],
  [8, 'The narrative withholds the easy comfort'],
  [7, "For all the talk of innovation"],
  [8, "The anomaly may expose"],
  [6, "The confirmation sounded reassuring"],
  [8, "He need not be mendacious"],
  [8, "The review turns the diner"],
  [8, "The critic’s praise is qualified"],
  [7, "The offer restores access"],
  [7, "I would be wary"],
  [8, "The difficulty is not that the distinction"],
  [8, "What is presented as intellectual modesty"],
  [8, "It is not that the meal lacked pleasure"],
  [8, "For all its studied informality"],
  [6, "Seeing fewer birds today"],
  [8, "One can acknowledge the tact of the formulation while noticing that its tact depends on making the other party infer a refusal the speaker declines to own."],
  [7, "The agreement is durable only if the concession is understood as a genuine exchange rather than a favour that one side can withdraw at will."],
  [7, "The remark may have been meant kindly"],
  [8, "I am not imputing bad faith"],
  [8, "It is a peculiar form of responsiveness that requires the customer to translate the problem into a category that omits what made it a problem."],
  [8, "The austerity seems earned rather than affected"],
  [7, "I am wary of celebrating empowerment where the organisation has delegated the consequences but retained all the consequential choices."],
  [7, "The hospitality never felt calculated"],
  [7, "We have a convincing description of one event"],
];
for (const [region, prefix] of reviewed) {
  const pool = QUESTION_POOL[LEVELS[region]];
  const matches = [...pool.normal, ...pool.boss].filter(q => q.speak?.startsWith(prefix));
  const question = matches[0];
  const options = question?.options ?? [];
  const answer = options.find(option => option.startsWith(question.ans + '. '));
  const length = (option: string) => Array.from(option.slice(3)).length;
  const longestDistractor = Math.max(...options.filter(option => option !== answer).map(length));
  if (matches.length !== 1 || options.length !== 4 || !answer || length(answer) > longestDistractor * 1.3) {
    console.error(`已審聽力題的正解長度可能提示答案：${prefix}`);
    process.exitCode = 1;
  }
}
if (!process.exitCode) console.log(`已審 ${reviewed.length} 道聽力題的選項長度檢查通過`);

for (const region of [6, 7, 8]) {
  for (const [deckName, deck] of Object.entries(QUESTION_POOL[LEVELS[region]])) {
    for (const skill of ['reading', 'listening']) {
      const choices = deck.filter(q => q.type === 'choice' && q.skill === skill);
      const totals = [...'ABCD'].map(letter => choices.filter(q => q.ans === letter).length);
      if (choices.length >= 12 && Math.max(...totals) - Math.min(...totals) > 2) {
        console.error(`R${region} ${deckName} ${skill} 正解位置偏斜：${totals.join('/')}`);
        process.exitCode = 1;
      }
    }
  }
}
