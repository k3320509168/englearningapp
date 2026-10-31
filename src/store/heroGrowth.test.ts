import { describe, expect, it } from 'vitest';
import { initialSave, useSaveStore } from './saveStore';

describe('英雄養成（第十二輪）', () => {
  it('一鍵訓練：金幣夠就一直升，最高到主角等級', () => {
    useSaveStore.setState({ ...initialSave, heroes: ['knight'], heroLevel: { knight: 1 }, player: { level: 5, xp: 0, classPath: [] }, gold: 100_000 });
    expect(useSaveStore.getState().trainHeroMax('knight')).toBe(4);
    expect(useSaveStore.getState().heroLevel.knight).toBe(5);
    expect(useSaveStore.getState().trainHeroMax('knight')).toBe(0);
  });
});
