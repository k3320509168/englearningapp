import { describe, expect, it } from 'vitest';
import { MAP_SIZE, PROLOGUE_ELITE, PROLOGUE_KEY, PROLOGUE_MIN, PROLOGUE_STAGES, allowedTypes, gaugeScale, minAnswers, regionStageCount, stageRole, untimedStage } from './stageLayout';
import { LEVELS, generateStages } from './QuestionData';
import { initialSave, migrateSave, useSaveStore } from '../store/saveStore';
import { setBattleRandom, useBattleStore } from '../store/battleStore';
import { DEFAULT_CHARACTER } from './character';

describe('三星關卡 20 小關', () => {
  it('第 5、10 菁英，第 7 寶箱，第 15 小 BOSS，第 20 大 BOSS，最後是區域魔王', () => {
    expect([4, 6, 9, 14, 19].map(i => stageRole(0, i))).toEqual(['elite', 'treasure', 'elite', 'gate', 'boss']);
    expect(stageRole(0, regionStageCount(0) - 1)).toBe('final');
    expect(regionStageCount(0)).toBe(5 * MAP_SIZE + 1);
    expect(regionStageCount(8)).toBe(9 * MAP_SIZE + 1);
    const stages = generateStages(LEVELS[0]);
    expect(stages).toHaveLength(regionStageCount(0));
    expect(stages[14].bossMode && stages[19].bossMode && stages[stages.length - 1].bossMode).toBe(true);
  });

  it('最低答題數：前置區域從 3 題慢慢加到追獵隊長 9 題；A1 第一關就照九區表', () => {
    expect([0, 1, 2, 9].map(i => minAnswers(0, i, PROLOGUE_KEY))).toEqual([3, 4, 5, 9]);
    expect(PROLOGUE_MIN.reduce((a, b) => a + b, 0)).toBe(53);
    expect(minAnswers(0, 0)).toBe(6);
    expect(minAnswers(0, 19)).toBe(16);
    expect(minAnswers(8, regionStageCount(8) - 1)).toBe(40);
  });

  it('前置區域：P-1～P-9 不計時、P-1～P-6 敵人不主動攻擊、題型慢慢開放；A1 是正式規則', () => {
    expect(untimedStage(0, 8, PROLOGUE_KEY)).toBe(true);
    expect(untimedStage(0, 9, PROLOGUE_KEY)).toBe(false);
    expect(untimedStage(0, 0)).toBe(false);
    expect(gaugeScale(0, 5, PROLOGUE_KEY)).toBe(0);
    expect(gaugeScale(0, 6, PROLOGUE_KEY)).toBe(0.3);
    expect(gaugeScale(0, 9, PROLOGUE_KEY)).toBe(0.7);
    expect(gaugeScale(0, 0)).toBe(1);
    expect(allowedTypes(0, 0, PROLOGUE_KEY)).toEqual(['choice']);
    expect(allowedTypes(0, 5, PROLOGUE_KEY)).not.toContain('voice');
    expect(allowedTypes(0, 7, PROLOGUE_KEY)).toBeNull();
    expect(allowedTypes(0, 0)).toBeNull();
    // P-1～P-5 抽出來的題目都是選擇題；P-5 菁英、P-10 追獵隊長（不是區域魔王）
    const stages = generateStages(PROLOGUE_KEY);
    expect(stages).toHaveLength(PROLOGUE_STAGES);
    stages.slice(0, 5).forEach(st => expect(st.questions[0].type).toBe('choice'));
    expect(stages[PROLOGUE_ELITE].kind).toBe('elite');
    expect(stages[9]).toMatchObject({ bossMode: true, kind: 'gate' });
  });

  it('v15 存檔的關卡進度換算到新的 20 小關', () => {
    const m = migrateSave({ levelProgress: { [LEVELS[0]]: 23, [LEVELS[1]]: 49 }, bestStage: { [LEVELS[0]]: 23 } }, 15);
    expect(m.levelProgress[LEVELS[0]]).toBe(2 * MAP_SIZE + 6);
    expect(m.levelProgress[LEVELS[1]]).toBe(regionStageCount(1) - 1);
  });
});

describe('最低答題數在戰鬥中', () => {
  const st = () => useBattleStore.getState();
  const answer = () => {
    const q = st().question!;
    if (q.type === 'choice') st().chooseOption(q.ans);
    else if (q.type === 'voice') st().submitVoice(q.ans);
    else { q.ans.slice(st().typed.length).split('').forEach(c => st().inputLetter(c)); st().submitTyped(); }
  };
  const start = (stage: number) => {
    setBattleRandom(() => 0.99);
    useSaveStore.setState({ ...initialSave, character: DEFAULT_CHARACTER, hintsSeen: ['boss'], settings: { ...initialSave.settings, showLessons: false } });
    st().startLevel(LEVELS[0], undefined, stage);
    if (st().phase === 'lesson') st().startBattle();
  };

  it('一般關把怪打光還不夠題數，就再來一隻', () => {
    start(20); // A1 2-1：一般關最少 6 題、一開始 5 隻
    useBattleStore.setState({ monsterHp: 1, monsterMaxHp: 1 });
    for (let i = 0; i < 5; i++) answer();
    expect(st().phase).toBe('answering');
    expect(st().waves).toBe(6);
    answer();
    expect(st().phase).not.toBe('answering');
    expect(st().stageAnswers).toBe(6);
  });

  it('首領提前被打到 0 血：進入終結連擊，答滿題數才倒下，期間答錯不會被反擊', () => {
    start(14); // 1-15 小 BOSS：最少 12 題
    useBattleStore.setState({ monsterHp: 1 });
    answer();
    expect(st().executing).toBe(true);
    expect(st().monsterHp).toBe(0);
    expect(st().event?.execution).toBe(true);
    const hp = st().playerHp;
    const q = st().question!;
    if (q.type === 'choice') st().chooseOption(['A', 'B', 'C', 'D'].find(l => l !== q.ans)!);
    else { st().inputLetter('Q'); st().submitTyped(); }
    expect(st().playerHp).toBe(hp);
    st().continueAfterFeedback();
    for (let i = 0; i < 30 && st().phase === 'answering'; i++) answer();
    expect(st().stageAnswers).toBeGreaterThanOrEqual(12);
    expect(['summary', 'monsterDown']).toContain(st().phase);
  });
});
