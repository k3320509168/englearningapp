import { EXPANSION_150_VALID } from './expand-to-300-heroes';
import { LORE_EXPANSION_150 } from './generate-hero-lore-data';

console.log('Validating expansion lore count:', Object.keys(LORE_EXPANSION_150).length);
if (Object.keys(LORE_EXPANSION_150).length !== 150) {
  throw new Error(`Expected 150 lore entries, got ${Object.keys(LORE_EXPANSION_150).length}`);
}

for (const [id] of EXPANSION_150_VALID) {
  const row = LORE_EXPANSION_150[id];
  if (!row) {
    throw new Error(`Missing lore entry for hero: ${id}`);
  }
  const [usageEn, usageZh, formQ, formA, w1, w2, w3, loreType, loreQ, loreA] = row;
  if (!usageEn.includes('___')) {
    throw new Error(`usageEn does not contain '___' for ${id}`);
  }
  const formOptions = new Set([formA, w1, w2, w3]);
  if (formOptions.size !== 4) {
    throw new Error(`form options not unique for ${id}: ${JSON.stringify([formA, w1, w2, w3])}`);
  }
  if (loreType !== 'idiom' && loreType !== 'origin') {
    throw new Error(`invalid loreType for ${id}: ${loreType}`);
  }
  if (!loreQ || !loreA) {
    throw new Error(`empty loreQ or loreA for ${id}`);
  }
}

console.log('All 150 expansion hero lore entries are 100% VALID and PERFECT!');
