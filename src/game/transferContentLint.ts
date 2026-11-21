import { CARAVAN_MANIFEST, CARAVAN_NOTICE, CARAVAN_UPDATE } from './caravanScenario';
import type { TransferItem } from './transferPractice';

const normalize = (value: string) => value.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');

export function lintTransferContent(items: readonly TransferItem[]): string[] {
  const issues: string[] = [];
  for (const role of ['practice', 'check'] as const) {
    const minimum = role === 'practice' ? 3 : 2;
    if (items.filter(item => item.role === role).length < minimum) issues.push(`${role}: at least ${minimum} items required`);
  }
  const seen = new Map([CARAVAN_MANIFEST, CARAVAN_NOTICE, CARAVAN_UPDATE].map(source => ['source:' + normalize(source), 'caravan']));
  for (const item of items) {
    if (!/^[a-z0-9-]+$/.test(item.id)) issues.push(`${item.id}: invalid save ID`);
    for (const field of ['id', 'family', 'context', 'source'] as const) {
      const value = normalize(item[field]);
      const key = `${field}:${value}`;
      const previous = seen.get(key);
      if (!value) issues.push(`${item.id}: missing ${field}`);
      else if (previous !== undefined) issues.push(`${item.id}: repeated ${field} from ${previous}`);
      else seen.set(key, item.id);
    }
    const options = item.options.map(normalize);
    if (options.length < 2 || options.includes('') || new Set(options).size !== options.length) issues.push(`${item.id}: options must be distinct and nonempty`);
    if (!Number.isInteger(item.answer) || item.answer < 0 || item.answer >= options.length) issues.push(`${item.id}: answer must reference an option`);
    if (!item.explanation.trim()) issues.push(`${item.id}: explanation required`);
  }
  return issues;
}
