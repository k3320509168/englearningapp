import { useSaveStore } from '../src/store/saveStore';
import { questionDifficulty, questionSkill } from '../src/game/QuestionData';
import { RUSH_PER_DAY, RUSH_SECONDS, TOWER_FLOORS, TOWER_PASS, TOWER_QUESTIONS, dayIndex, featuredHero, rushQuestions, rushReward, towerQuestions } from '../src/game/modes';
import { localDate } from '../src/game/daily';
import type { Question } from '../src/game/types';
import type { BudgetLedger } from './sim-budget';

// 和主線相同的正確率／反應時間啟發式；不是真人量測，沒有假設每題全對。
const TYPE_MS: Record<string, number> = { listening: 6000, reading: 5000, writing: 9000, speaking: 5000 };
export function simulateSideDay(route: string, day: number, accuracy: number, learn: number, random: () => number,
  wrongSeen: Set<string>, ledger: BudgetLedger) {
  const sv = () => useSaveStore.getState();
  const beforeGold = sv().gold, beforeMaterials = { ...sv().materials };
  const rows: Record<string, unknown>[] = [];
  const trial = (q: Question) => {
    const key = `${q.type}|${q.desc}`;
    const acc = Math.min(.99, Math.max(.3, accuracy - .06 * (questionDifficulty(q) - 1) + (wrongSeen.has(key) ? learn : 0)));
    const correct = random() < acc;
    const base = (TYPE_MS[questionSkill(q)] ?? 6000) + 1500 * (questionDifficulty(q) - 1);
    const ms = correct ? base * (.6 + random() * .8) : base * (.8 + random() * .8);
    return { correct, ms, key };
  };
  const record = (q: Question, correct: boolean, key: string, tower = false) => {
    sv().recordAnswer(q, correct, false, tower);
    if (!correct) wrongSeen.add(key);
  };
  const runs = route === 'normal' ? 2 : route === 'fast' ? 1 : 0;
  for (let run = 0; run < runs; run++) {
    const used = sv().rushDay === new Date().toDateString() ? sv().rushRuns : 0;
    if (used >= RUSH_PER_DAY) break;
    const qs = rushQuestions(sv().codex, sv().unlockedIndex, random);
    sv().startRush();
    let elapsed = 0, answered = 0, correct = 0, combo = 0, best = 0;
    while (qs.length && elapsed < RUSH_SECONDS * 1000) {
      const q = qs[answered % qs.length], a = trial(q);
      if (elapsed + a.ms > RUSH_SECONDS * 1000) break;
      elapsed += a.ms; answered++;
      record(q, a.correct, a.key);
      combo = a.correct ? combo + 1 : 0;
      correct += Number(a.correct); best = Math.max(best, combo);
    }
    const raw = rushReward(correct, best, sv().unlockedIndex);
    const paid = sv().grantRush(raw);
    rows.push({ mode: 'rush', day: localDate(), answered, correct, elapsedMs: RUSH_SECONDS * 1000, rawXp: raw.xp, paid });
  }
  if (route === 'normal' && (day + 1) % 3 === 0 && sv().towerFloor < TOWER_FLOORS) {
    const floor = sv().towerFloor + 1;
    const qs = towerQuestions(floor, random);
    let correct = 0, elapsedMs = 0;
    for (const q of qs) {
      const a = trial(q); correct += Number(a.correct); elapsedMs += a.ms + 2500;
      record(q, a.correct, a.key, true);
    }
    const paid = qs.length === TOWER_QUESTIONS && correct >= TOWER_PASS
      ? sv().clearTowerFloor(floor, featuredHero(sv().heroes, dayIndex())) : null;
    rows.push({ mode: 'tower', day: localDate(), floor, answered: qs.length, correct, elapsedMs, paid });
  }
  ledger.sideGold = (ledger.sideGold ?? 0) + sv().gold - beforeGold;
  for (const [id, value] of Object.entries(sv().materials)) {
    const key = `sideMaterial:${id}`;
    ledger[key] = (ledger[key] ?? 0) + value - (beforeMaterials[id] ?? 0);
  }
  return rows;
}
