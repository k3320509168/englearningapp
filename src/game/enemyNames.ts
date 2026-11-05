import type { Element } from './character';
import type { MonsterKind } from './enemyPatterns';

export const MONSTER_NAMES: Record<MonsterKind, string> = {
  slime: '史萊姆', bat: '夜蝠', mushroom: '毒菇怪', king: '史萊姆王', ghost: '復仇魔王', chest: '寶箱怪', demon: '沉默魔王',
};

// 屬性怪物的名字前綴，例如「火焰史萊姆」
export const ELEMENT_PREFIX: Record<Element, string> = {
  metal: '鋼鐵', wood: '森林', water: '水靈', fire: '火焰', earth: '岩石', light: '聖光', dark: '暗影',
};

export function monsterName(kind: MonsterKind, el: Element): string {
  return kind === 'ghost' || kind === 'chest' || kind === 'demon' ? MONSTER_NAMES[kind] : `${ELEMENT_PREFIX[el]}${MONSTER_NAMES[kind]}`;
}
