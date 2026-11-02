import fs from 'node:fs';
import path from 'node:path';
import { LORE_EXPANSION_150 } from './generate-hero-lore-data';

const ROOT = process.cwd();
const heroLorePath = path.join(ROOT, 'src/game/heroLore.ts');
let content = fs.readFileSync(heroLorePath, 'utf8');

const target = `  apocalypse: [
    "The hero stopped the rising darkness before the predicted ___ arrived.",
    "英雄在預言中的毀滅天啟降臨之前，成功遏制了升騰的黑暗。",
    "apocalypse 的形容詞是？",
    "apocalyptic", "apocalypso", "apocalypseful", "apocalyptous",
    "origin",
    "apocalypse 來自希臘語 apokalyptein，原意是？",
    "揭開、揭示隱藏之真相",
  ],
};`;

const newLoreLines = Object.entries(LORE_EXPANSION_150).map(([id, row]) => {
  const [usageEn, usageZh, formQ, formA, w1, w2, w3, loreType, loreQ, loreA] = row;
  const esc = (s: string) => s.replace(/'/g, "\\'");
  return `  ${id}: ['${esc(usageEn)}', '${esc(usageZh)}', '${esc(formQ)}', '${esc(formA)}', '${esc(w1)}', '${esc(w2)}', '${esc(w3)}', '${loreType}', '${esc(loreQ)}', '${esc(loreA)}'],`;
}).join('\n');

const replacement = `  apocalypse: [
    "The hero stopped the rising darkness before the predicted ___ arrived.",
    "英雄在預言中的毀滅天啟降臨之前，成功遏制了升騰的黑暗。",
    "apocalypse 的形容詞是？",
    "apocalyptic", "apocalypso", "apocalypseful", "apocalyptous",
    "origin",
    "apocalypse 來自希臘語 apokalyptein，原意是？",
    "揭開、揭示隱藏之真相",
  ],

  // ===== 第二批擴充英雄真名題組（150 位） =====
${newLoreLines}
};`;

if (!content.includes(target)) {
  throw new Error('target apocalypse block not found in heroLore.ts');
}
content = content.replace(target, replacement);
fs.writeFileSync(heroLorePath, content, 'utf8');
console.log('heroLore.ts successfully updated with 150 expansion entries!');
