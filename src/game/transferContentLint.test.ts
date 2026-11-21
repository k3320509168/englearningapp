import { TRANSFER_CHECK_ITEMS } from './transferCheckItems';
import { expect, it } from 'vitest';
import { lintTransferContent } from './transferContentLint';
import { TRANSFER_PRACTICE_ITEMS } from './transferPractice';
const TRANSFER_ITEMS = [...TRANSFER_PRACTICE_ITEMS, ...TRANSFER_CHECK_ITEMS];

it('攔下練習與檢核重用題組、場景與只改標點的素材', () => {
  const practice = TRANSFER_ITEMS[0];
  const check = TRANSFER_ITEMS.find(item => item.role === 'check')!;
  expect(lintTransferContent(TRANSFER_ITEMS)).toEqual([]);
  const issues = lintTransferContent(TRANSFER_ITEMS.map(item => item === check
    ? { ...item, family: practice.family, context: practice.context, source: practice.source.toUpperCase() + '!' }
    : item));
  for (const field of ['family', 'context', 'source']) expect(issues).toContain(`${check.id}: repeated ${field} from ${practice.id}`);
});

it('攔下沒有正解、幾乎一樣的選項與空解釋', () => {
  const item = TRANSFER_ITEMS[0];
  expect(lintTransferContent([{ ...item, answer: 5, options: ['Keep it.', 'keep it!'], explanation: ' ' }, ...TRANSFER_ITEMS.slice(1)])).toEqual([
    'library: options must be distinct and nonempty',
    'library: answer must reference an option',
    'library: explanation required',
  ]);
});
