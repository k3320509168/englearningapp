import { describe, expect, it } from 'vitest';
import {
  BODY_NAMES, CLASSES, DEFAULT_CHARACTER, DEFAULT_NAME, ELEMENTS, FACE_NAMES, HAIR_NAMES, NAME_MAX_LENGTH,
  cleanName, elementMultiplier, elementRelation, normalizeCharacter, randomCharacter,
} from './character';
import type { Character } from './character';
import { AVATAR_H, AVATAR_W, composeAvatar } from './art/avatar';
import { migrateSave } from '../store/saveStore';

describe('屬性相剋', () => {
  it('五行相剋 ×1.5，被剋 ×0.75，無關 ×1', () => {
    expect(elementMultiplier('water', 'fire')).toBe(1.5);
    expect(elementMultiplier('fire', 'water')).toBe(0.75);
    expect(elementMultiplier('metal', 'water')).toBe(1);
    expect(elementMultiplier('fire', 'fire')).toBe(1);
  });

  it('光暗互剋：雙方打對方都是 ×1.5', () => {
    expect(elementMultiplier('light', 'dark')).toBe(1.5);
    expect(elementMultiplier('dark', 'light')).toBe(1.5);
  });

  it('五行每個屬性剛好剋一個、被一個剋', () => {
    const five = ['metal', 'wood', 'water', 'fire', 'earth'] as const;
    for (const a of five) {
      expect(five.filter(d => elementMultiplier(a, d) === 1.5)).toHaveLength(1);
      expect(five.filter(d => elementMultiplier(a, d) === 0.75)).toHaveLength(1);
    }
  });

  it('說明文字', () => {
    expect(elementRelation('water')).toBe('剋 火｜被 土 剋');
    expect(elementRelation('light')).toBe('與 暗 互剋');
  });
});

describe('名字與存檔修正', () => {
  it('空白名字用預設名，過長截斷', () => {
    expect(cleanName('   ')).toBe(DEFAULT_NAME);
    expect(cleanName('  阿明 ')).toBe('阿明');
    expect([...cleanName('一二三四五六七八九十十一')]).toHaveLength(NAME_MAX_LENGTH);
  });

  it('超出範圍的選項改回預設，不會當掉', () => {
    const c = normalizeCharacter({ ...DEFAULT_CHARACTER, hair: 99, face: -1, classId: 'ninja' as never });
    expect(c?.hair).toBe(0);
    expect(c?.face).toBe(0);
    expect(c?.classId).toBe(DEFAULT_CHARACTER.classId);
    expect(normalizeCharacter(null)).toBeNull();
  });

  it('舊存檔（v5）升級後沒有主角，需要建立', () => {
    expect(migrateSave({ gold: 50 }, 5).character).toBeNull();
    expect(migrateSave({ gold: 50 }, 5).gold).toBe(50);
  });

  it('隨機角色都是合法選項', () => {
    let seed = 1;
    const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 50; i++) {
      const c = randomCharacter(rand);
      expect(normalizeCharacter(c)).toEqual(c);
    }
  });
});

describe('主角像素圖', () => {
  it('所有外觀組合都畫得出來，大小固定、每個顏色都有定義', () => {
    const check = (c: Character) => {
      for (const frame of ['idle', 'attack'] as const) {
        const { rows, palette } = composeAvatar(c, frame);
        expect(rows).toHaveLength(AVATAR_H);
        rows.forEach(r => expect(r).toHaveLength(AVATAR_W));
        const used = new Set(rows.join('').replace(/\./g, ''));
        used.forEach(ch => expect(palette[ch], `${ch} 沒有顏色`).toBeTruthy());
      }
    };
    for (const cls of CLASSES) for (const gender of ['male', 'female'] as const) {
      for (let hair = 0; hair < HAIR_NAMES.length; hair++) check({ ...DEFAULT_CHARACTER, classId: cls.id, gender, hair });
      for (let face = 0; face < FACE_NAMES.length; face++) check({ ...DEFAULT_CHARACTER, classId: cls.id, gender, face });
      for (let body = 0; body < BODY_NAMES.length; body++) check({ ...DEFAULT_CHARACTER, classId: cls.id, gender, body });
    }
    ELEMENTS.forEach(e => check({ ...DEFAULT_CHARACTER, element: e.id }));
  }, 30_000); // 會畫出數百種組合，較慢

  it('不同髮型畫出來不一樣', () => {
    const shapes = new Set(HAIR_NAMES.map((_, hair) => composeAvatar({ ...DEFAULT_CHARACTER, hair }, 'idle').rows.join('\n')));
    expect(shapes.size).toBe(HAIR_NAMES.length);
  });
});
