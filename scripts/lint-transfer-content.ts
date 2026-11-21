import { TRANSFER_CHECK_ITEMS } from '../src/game/transferCheckItems';
import { TRANSFER_PRACTICE_ITEMS } from '../src/game/transferPractice';
import { lintTransferContent } from '../src/game/transferContentLint';
const TRANSFER_ITEMS = [...TRANSFER_PRACTICE_ITEMS, ...TRANSFER_CHECK_ITEMS];

const issues = lintTransferContent(TRANSFER_ITEMS);
for (const issue of issues) console.error(issue);
if (issues.length) process.exitCode = 1;
else console.log(`情境題檢查通過（${TRANSFER_ITEMS.length} 題）`);
