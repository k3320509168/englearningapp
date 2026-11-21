import type { TransferItem } from './transferPractice';

export const TRANSFER_CHECK_ITEMS: readonly TransferItem[] = [
  { id: 'exhibit', family: 'conditional-consent', role: 'check', context: '展覽手冊',
    source: 'The photographer agreed to let us print the portrait provided the subject approved the caption. The subject replied that the caption was accurate but asked us to omit their workplace before printing. The layout can still be edited this morning.',
    options: ['Send the current layout because the subject confirmed the wording was accurate.', 'Remove the workplace before sending the layout to print.', 'Remove the portrait because the photographer withdrew permission.'],
    answer: 1, explanation: '對方同意印刷前有一項具體要求。可趁排版仍能修改時移除工作地點。' },
  { id: 'workshop', family: 'accessibility-equivalence', role: 'check', context: '工作坊教材',
    source: 'The workshop is moving online. The organiser said live attendance was optional as long as participants could complete the same exercise later. The recording will show the demonstration, but the exercise sheet is only shared in the live chat.',
    options: ['Share the recording alone because attendance is optional.', 'Ask everyone to join live even if they only need the exercise.', 'Share the exercise sheet alongside the recording so absent participants can complete the task.'],
    answer: 2, explanation: '可缺席的前提是事後能完成同一份練習，所以錄影與練習單都需要提供。' },
];
