import { describe, expect, it } from 'vitest';
import { DAILY_COUNT, applyDailyEvent, dailyDef, pickDaily, refreshDaily } from './daily';
import { SKILL_BOSSES, reachablePool, skillBossQuestions } from './skillBosses';
import { validateQuestion } from './validateQuestions';
import { questionKey } from './battle';
import { initialSave, useSaveStore } from '../store/saveStore';
import { setBattleRandom, useBattleStore } from '../store/battleStore';
import { DEFAULT_CHARACTER } from './character';

describe('daily tasks', () => {
  it('picks the same 3 tasks for a date, never two of the same kind', () => {
    const a = pickDaily('2026-10-28');
    expect(a).toHaveLength(DAILY_COUNT);
    expect(pickDaily('2026-10-28')).toEqual(a);
    const events = a.map(t => dailyDef(t.id)!.event);
    expect(new Set(events).size).toBe(DAILY_COUNT);
  });

  it('counts the login streak across consecutive days and resets after a gap', () => {
    const d1 = refreshDaily(undefined, '2026-10-27');
    const d2 = refreshDaily(d1, '2026-10-28');
    expect(d2.streak).toBe(2);
    expect(refreshDaily(d2, '2026-10-28')).toBe(d2);
    expect(refreshDaily(d2, '2026-10-31').streak).toBe(1);
  });

  it('tracks progress (combo keeps the best) and caps at the goal', () => {
    const state = { date: 'x', streak: 1, tasks: [{ id: 'correct20', progress: 0, claimed: false }, { id: 'combo10', progress: 0, claimed: false }] };
    let s = applyDailyEvent(state, 'correct', 25);
    s = applyDailyEvent(s, 'combo', 7);
    s = applyDailyEvent(s, 'combo', 3);
    expect(s.tasks.map(t => t.progress)).toEqual([20, 7]);
  });

  it('claims rewards once', () => {
    useSaveStore.setState({ ...initialSave, gold: 0 });
    const sv = () => useSaveStore.getState();
    sv().ensureDaily();
    const t = sv().daily!.tasks[0];
    const def = dailyDef(t.id)!;
    expect(sv().claimDaily(t.id)).toBe(false);
    sv().trackDaily(def.event, def.goal);
    expect(sv().claimDaily(t.id)).toBe(true);
    expect(sv().gold).toBe(def.reward.gold);
    expect(sv().claimDaily(t.id)).toBe(false);
  });
});

describe('skill bosses', () => {
  const pool = reachablePool(5);

  it('builds valid questions of a single skill each', () => {
    for (const b of SKILL_BOSSES) {
      const qs = skillBossQuestions(b.id, pool);
      expect(qs.length, b.id).toBeGreaterThan(10);
      qs.forEach(q => expect(validateQuestion(q, b.id).filter(i => i.level === 'error')).toEqual([]));
      const types = new Set(qs.map(q => q.type));
      expect(types.size).toBe(1);
    }
  });

  it('listening questions hide the word, play it, and have unique keys', () => {
    const qs = skillBossQuestions('listening', pool);
    expect(qs.every(q => q.speak && !q.desc.includes(q.speak))).toBe(true);
    expect(new Set(qs.map(questionKey)).size).toBe(qs.length);
  });

  it('defeating a skill boss the first time grants its title and tickets', () => {
    setBattleRandom(() => 0.99);
    useSaveStore.setState({ ...initialSave, character: DEFAULT_CHARACTER, settings: { ...initialSave.settings, showLessons: false } });
    const st = () => useBattleStore.getState();
    st().startSkillBoss('writing');
    expect(st().stages[0].name).toBe('咒文魔王');
    const tickets = useSaveStore.getState().tickets;
    for (let i = 0; i < 300 && st().phase !== 'levelClear'; i++) {
      const q = st().question!;
      expect(q.type).toBe('spell');
      { q.ans.slice(st().typed.length).split('').forEach(c => st().inputLetter(c)); st().submitTyped(); }
    }
    expect(st().phase).toBe('levelClear');
    expect(useSaveStore.getState().titles).toContain('咒文大師');
    expect(useSaveStore.getState().tickets).toBe(tickets + 5);
  });
});

describe('連續登入里程碑', () => {
  it('達到天數才能領，中斷後重新累積可以再領', async () => {
    const { claimableMilestones, nextMilestone } = await import('./daily');
    let d = refreshDaily(undefined, '2026-10-01');
    for (let i = 2; i <= 7; i++) d = refreshDaily(d, `2026-10-0${i}`);
    expect(d.streak).toBe(7);
    expect(claimableMilestones(d).map(m => m.days)).toEqual([3, 7]);
    d = { ...d, milestones: [3, 7] };
    expect(claimableMilestones(d)).toEqual([]);
    expect(refreshDaily(d, '2026-10-08').milestones).toEqual([3, 7]);
    // 中斷一天：天數與里程碑重新開始
    const reset = refreshDaily(d, '2026-10-10');
    expect(reset.streak).toBe(1);
    expect(reset.milestones).toEqual([]);
    expect(nextMilestone(1)?.days).toBe(3);
  });
});

describe('每週任務', () => {
  it('同一週任務固定、週一換新，固定包含上線天數', async () => {
    const { refreshWeekly, weekStart, pickWeekly } = await import('./daily');
    expect(weekStart('2026-10-28')).toBe('2026-10-26'); // 星期三 → 那週的星期一
    expect(weekStart('2026-10-26')).toBe('2026-10-26');
    expect(weekStart('2026-11-01')).toBe('2026-10-26'); // 星期日還是同一週
    const w = refreshWeekly(null, '2026-10-28');
    expect(refreshWeekly(w, '2026-11-01')).toBe(w);
    expect(refreshWeekly(w, '2026-11-02').week).toBe('2026-11-02');
    expect(pickWeekly().map(t => t.id)).toContain('w_days5');
    expect(pickWeekly()).toHaveLength(13);
  });

  it('舊存檔同一週只有 3 項：補上新任務，保留原本的進度', async () => {
    const { refreshWeekly } = await import('./daily');
    const old = { week: '2026-10-26', tasks: [{ id: 'w_days5', progress: 3, claimed: false }, { id: 'w_boss5', progress: 2, claimed: false }] };
    const w = refreshWeekly(old, '2026-10-28');
    expect(w.tasks).toHaveLength(13);
    expect(w.tasks.find(t => t.id === 'w_days5')!.progress).toBe(3);
    expect(refreshWeekly(w, '2026-10-29')).toBe(w);
  });

  it('升級與訓練英雄推進「升級」週任務', () => {
    useSaveStore.setState({ ...initialSave, daily: null, weekly: null });
    useSaveStore.getState().gainXp(100000);
    const tasks = useSaveStore.getState().weekly!.tasks;
    expect(tasks.find(t => t.id === 'w_level5')!.progress).toBe(5);
    expect(tasks.find(t => t.id === 'w_level15')!.progress).toBe(15);
  });

  it('答題同時推進每日與每週任務', () => {
    useSaveStore.setState({ ...initialSave, daily: null, weekly: null });
    useSaveStore.getState().trackDaily('correct', 5);
    const s = useSaveStore.getState();
    expect(s.weekly!.tasks.find(t => t.id === 'w_correct100')!.progress).toBe(5);
    expect(s.weekly!.tasks.find(t => t.id === 'w_days5')!.progress).toBe(1);
  });
});
