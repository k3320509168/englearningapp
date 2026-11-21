export interface TransferItem {
  id: string;
  family: string;
  role: 'practice' | 'check';
  context: string;
  source: string;
  options: readonly string[];
  answer: number;
  explanation: string;
}

export const TRANSFER_PRACTICE_ITEMS: readonly TransferItem[] = [
  { id: 'library', family: 'room-access', role: 'practice', context: '圖書館讀書會',
    source: 'The reading room is available until 6 p.m., but all visitors under sixteen must be accompanied. Our group includes two fifteen-year-olds. The meeting room downstairs is open until seven and has no age restriction.',
    options: ['Keep the reading room and ask the younger visitors to arrive early.', 'Move the meeting downstairs so every member can attend.', 'Cancel because both rooms close at six.'],
    answer: 1, explanation: '年齡限制而非抵達時間造成問題。樓下會議室沒有年齡限制。' },
  { id: 'performance', family: 'quiet-rehearsal', role: 'practice', context: '排練安排',
    source: 'Two actors can only rehearse before noon. The stage is free all morning, but a class next door needs quiet until eleven. The rehearsal starts with silent blocking and ends with a loud group scene.',
    options: ['Rehearse the loud scene first so everyone can leave early.', 'Move the entire rehearsal to the afternoon.', 'Start with silent blocking and save the loud scene until after eleven.'],
    answer: 2, explanation: '調整順序便能同時符合演員時段和隔壁教室的安靜要求。' },
  { id: 'garden', family: 'shared-water', role: 'practice', context: '社區花園',
    source: 'The garden can use tap water on Tuesdays only. The newly planted seedlings cannot wait until Tuesday. The caretaker has confirmed that the rain barrel is full and may be used any day.',
    options: ['Water the seedlings from the rain barrel today.', 'Water them from the tap today and skip Tuesday.', 'Wait for Tuesday because all watering is restricted.'],
    answer: 0, explanation: '星期二的限制只適用自來水。雨水桶可在任何一天使用。' },

];

export const TRANSFER_DELAY = 7 * 24 * 60 * 60 * 1000;
const PREFIX = 'scenario:transfer:v1:';
export const practiceFlag = (id: string) => `${PREFIX}practice:${id}`;
export const startFlag = (at: number) => `${PREFIX}start:${at}`;
export const checkFlag = (id: string, index: number) => `${PREFIX}check:${id}:${index}`;
export function firstCheckAnswer(seen: readonly string[], item: TransferItem) {
  const flag = seen.find(value => value.startsWith(`${PREFIX}check:${item.id}:`));
  if (!flag) return undefined;
  const index = Number(flag.slice(flag.lastIndexOf(':') + 1));
  return Number.isInteger(index) && index >= 0 && index < item.options.length ? index : undefined;
}
export function transferDueAt(seen: readonly string[]) {
  if (!TRANSFER_PRACTICE_ITEMS.filter(item => item.role === 'practice').every(item => seen.includes(practiceFlag(item.id)))) return null;
  const stamp = seen.find(value => value.startsWith(`${PREFIX}start:`));
  const at = stamp ? Number(stamp.slice(stamp.lastIndexOf(':') + 1)) : NaN;
  return Number.isSafeInteger(at) && at > 0 ? at + TRANSFER_DELAY : null;
}
