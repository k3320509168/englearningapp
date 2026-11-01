import { describe, expect, it } from 'vitest';
import { MAIN_TITLE } from './golden';
import { REGIONS, chapterCount } from './regions';
import { BOSS_LINES, SPEAKERS, STORIES, bossStoryId, clearStoryId, mapStoryId, regionStoryId, storyRegion, storyTitle, type Speaker } from './story';
import { STORY_CHOICES, STORY_CHOICES_BY_STORY, getStoryChoice } from './storyChoices';

const NEW_SPEAKERS: Speaker[] = [
  'caravan', 'scribe', 'pharaoh',
  'scout', 'foreman', 'dragonrock',
  'ranger', 'chronicler', 'icedragon',
  'signaler', 'skykeeper', 'griffin',
  'emberknight', 'forgemaster', 'flamelord',
  'royalguard',
];

const cjkCount = (text: string) => (text.replaceAll('{name}', '').match(/[\u4e00-\u9fff]/g) ?? []).length;

describe('story bank (A1–C2)', () => {
  it('unifies villain speaker and prologue naming to 沉默君王', () => {
    expect(SPEAKERS.villain).toEqual({ name: '沉默君王', icon: '👑' });
    const prologueText = STORIES.prologue.map(l => l.text).join('\n');
    expect(prologueText).toContain('沉默君王');
    expect(prologueText).not.toContain('沉默魔王');
  });

  it('registers all 16 new B1–C2 speakers with name and icon', () => {
    expect(NEW_SPEAKERS).toHaveLength(16);
    for (const key of NEW_SPEAKERS) {
      expect(SPEAKERS[key]?.name.length).toBeGreaterThan(0);
      expect(SPEAKERS[key]?.icon.length).toBeGreaterThan(0);
    }
  });

  it('covers region intro/clear, boss intro, map intro/clear, and mini/big boss lines across all 9 regions', () => {
    let b1ToC2Maps = 0;
    REGIONS.forEach((_, r) => {
      const regIntro = STORIES[regionStoryId(r)];
      const regClear = STORIES[clearStoryId(r)];
      const bossIntro = STORIES[bossStoryId(r)];
      expect(regIntro?.length).toBeGreaterThanOrEqual(2);
      expect(regIntro?.length).toBeLessThanOrEqual(4);
      expect(regClear?.length).toBeGreaterThanOrEqual(3);
      expect(regClear?.length).toBeLessThanOrEqual(6);
      expect(bossIntro?.length).toBeGreaterThanOrEqual(4);
      expect(bossIntro?.length).toBeLessThanOrEqual(6);

      const maps = chapterCount(r);
      if (r >= 3) b1ToC2Maps += maps;
      for (let m = 0; m < maps; m++) {
        const intro = STORIES[mapStoryId(r, m, 'intro')];
        const clear = STORIES[mapStoryId(r, m, 'clear')];
        expect(intro?.length, `missing map-${r}-${m}-intro`).toBeGreaterThanOrEqual(2);
        expect(intro?.length, `too long map-${r}-${m}-intro`).toBeLessThanOrEqual(4);
        expect(clear?.length, `missing map-${r}-${m}-clear`).toBeGreaterThanOrEqual(2);
        expect(clear?.length, `too long map-${r}-${m}-clear`).toBeLessThanOrEqual(4);

        const mapKey = `map-${r}-${m}`;
        expect(BOSS_LINES[mapKey]?.mini.length, `missing ${mapKey} mini`).toBeGreaterThan(0);
        expect(BOSS_LINES[mapKey]?.big.length, `missing ${mapKey} big`).toBeGreaterThan(0);
        expect(STORIES[mapStoryId(r, m, 'mini')]).toEqual([{ speaker: 'foe', text: BOSS_LINES[mapKey].mini }]);
        expect(STORIES[mapStoryId(r, m, 'big')]).toEqual([{ speaker: 'foe', text: BOSS_LINES[mapKey].big }]);
      }
    });
    expect(b1ToC2Maps).toBe(45);
    expect(STORIES['clear-5'].some(l => l.text.includes(MAIN_TITLE))).toBe(true);
  });

  it('keeps B1–C2 dialogue concise, uses {name} placeholder, and resolves titles for every story key', () => {
    for (const [id, lines] of Object.entries(STORIES)) {
      expect(lines.length, `empty story ${id}`).toBeGreaterThan(0);
      const r = storyRegion(id);
      const title = storyTitle(id, i => REGIONS[i]?.name ?? '', (ri, m) => REGIONS[ri]?.maps[m] ?? '');
      expect(title.length, `empty title for ${id}`).toBeGreaterThan(0);
      expect(title).not.toContain('undefined');

      for (const line of lines) {
        expect(SPEAKERS[line.speaker], `unknown speaker ${line.speaker} in ${id}`).toBeDefined();
        expect(line.text.trim()).toBe(line.text);
        expect(line.text.length).toBeGreaterThan(0);
        expect(line.text).not.toContain('｛主角｝');
        expect(line.text).not.toContain('{主角}');
        if (r >= 3 && r <= 8) {
          expect(cjkCount(line.text), `line too long in ${id}: ${line.text}`).toBeLessThanOrEqual(28);
        }
      }
    }
  });
});

describe('story flavor choices', () => {
  it('provides 2 choices per region for B1–C2 and targets valid spirit lines without raw placeholders', () => {
    for (let r = 3; r <= 8; r++) {
      expect(STORY_CHOICES.filter(c => c.regionIdx === r)).toHaveLength(2);
    }
    expect(Object.keys(STORY_CHOICES_BY_STORY)).toHaveLength(STORY_CHOICES.length);

    for (const choice of STORY_CHOICES) {
      const lines = STORIES[choice.storyId];
      expect(lines, `missing story ${choice.storyId}`).toBeDefined();
      const target = lines[choice.lineIndex];
      expect(target, `invalid lineIndex ${choice.lineIndex} in ${choice.storyId}`).toBeDefined();
      expect(target.speaker, `choice in ${choice.storyId} must replace spirit line`).toBe('spirit');
      expect(getStoryChoice(choice.storyId, choice.lineIndex)).toEqual(choice);
      expect(getStoryChoice(choice.storyId, choice.lineIndex + 1)).toBeUndefined();

      expect(choice.options.map(o => o.id)).toEqual(['A', 'B']);
      for (const opt of choice.options) {
        expect(opt.label.length).toBeGreaterThan(0);
        expect(opt.reply.length).toBeGreaterThan(0);
        expect(opt.reply).not.toContain('｛主角｝');
        expect(opt.reply).not.toContain('{主角}');
        if (choice.regionIdx >= 3) {
          expect(cjkCount(opt.reply), `reply too long in ${choice.id}: ${opt.reply}`).toBeLessThanOrEqual(28);
        }
      }
    }
  });
});
