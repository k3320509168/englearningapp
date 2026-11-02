import fs from 'node:fs';
import path from 'node:path';
import { EXPANSION_150_VALID } from './expand-to-300-heroes';

// 檢查重複
console.log('Validating expansion heroes:', EXPANSION_150_VALID.length);
const ids = new Set(EXPANSION_150_VALID.map(h => h[0]));
if (ids.size !== EXPANSION_150_VALID.length) {
  throw new Error('Duplicate ID in EXPANSION_150_VALID!');
}
for (const h of EXPANSION_150_VALID) {
  if (h[0].length > 10) throw new Error(`Word too long: ${h[0]}`);
  if (!/^[a-z]+$/.test(h[0])) throw new Error(`Invalid characters in word: ${h[0]}`);
}
console.log('All 150 expansion heroes validated successfully!');
