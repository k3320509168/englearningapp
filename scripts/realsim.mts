// 真實玩家模擬：正確率隨題目難度、BOSS 困難題、地圖後段下降；統計破關率、重打、被題數卡住、combo 與傷害倍率、處決
import fs from 'node:fs';
const ROOT = '/Volumes/Dzzz_ssd/Files/Games/EngGame/src';
const { LEVELS, addBank, questionDifficulty } = await import(`${ROOT}/game/QuestionData`);
const { useBattleStore, setBattleRandom } = await import(`${ROOT}/store/battleStore`);
const { useSaveStore, initialSave } = await import(`${ROOT}/store/saveStore`);
const { DEFAULT_CHARACTER } = await import(`${ROOT}/game/character`);
const { recommendedLevel, comboMultiplier } = await import(`${ROOT}/game/progression`);
const { regionStageCount, chapterCount, MAP_SIZE } = await import(`${ROOT}/game/stageLayout`);
const { useUiStore } = await import(`${ROOT}/store/uiStore`);
LEVELS.forEach((_: string, i: number) => addBank(i, JSON.parse(fs.readFileSync(`${ROOT}/game/questions/bank/r${i}.json`, 'utf8'))));
let seed = Number(process.env.SEED ?? 7);
const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
setBattleRandom(rand);
const st = () => useBattleStore.getState();
const PROFILES: Record<string, number> = { strong: 0.96, good: 0.9, average: 0.82, struggling: 0.72 };
function setup(r: number, stage: number) {
  const lv = recommendedLevel(r, stage);
  useSaveStore.setState({ ...initialSave, character: DEFAULT_CHARACTER, heroes: ['knight', 'mage', 'castle', 'bard'], party: ['player', 'mage', 'castle', 'bard'], player: { level: lv, xp: 0, classPath: [] },
    heroLevel: { knight: lv, mage: lv, castle: lv, bard: lv }, hintsSeen: ['boss', 'skill'], tutorialDone: true, unlockedIndex: r, settings: { ...initialSave.settings, showLessons: false } });
}
let m: Record<string, number> = {};
const inc = (k: string, v = 1) => { m[k] = (m[k] ?? 0) + v; };
function answer(base: number) {
  if (st().modChoice) st().chooseModSkill(st().modChoice![0]);
  const s0 = st();
  const q = s0.question!;
  const inMap = (s0.stageIdx % MAP_SIZE) / MAP_SIZE;
  const acc = Math.max(0.3, base - 0.06 * (questionDifficulty(q) - 1) - (s0.isBossQuestion ? 0.05 : 0) - 0.04 * inMap);
  const ok = rand() < acc;
  st().tick(ok ? (rand() < 0.5 ? 3000 : 7000) : (rand() < 0.15 ? 21000 : 8000));
  if (st().phase !== 'answering') { inc('timeout'); return; }
  inc('answers');
  if (s0.executing && !s0.bonusRound) inc('stuckAnswers'); // 怪物已 0 血還被題數卡住
  if (ok) {
    if (q.type === 'choice') st().chooseOption(q.ans);
    else if (q.type === 'voice') st().submitVoice(q.ans);
    else { q.ans.slice(st().typed.length).split('').forEach((c: string) => st().inputLetter(c)); st().submitTyped(); }
    const e = st().event;
    if (e?.slain) inc('slain');
    inc('comboSum', st().combo); inc('comboN');
  } else if (q.type === 'choice') st().chooseOption(['A', 'B', 'C', 'D'].find(l => l !== q.ans)!);
  else if (q.type === 'voice') st().submitVoice('zzzz');
  else { st().inputLetter('Q'); st().submitTyped(); }
}
function run(r: number, from: number, to: number, base: number) {
  setup(r, from); useUiStore.setState({ celebrations: [] }); st().startLevel(LEVELS[r], undefined, from);
  const first: Record<number, boolean> = {}; const tries: Record<number, number> = {};
  for (let i = 0; i < 8000; i++) {
    useUiStore.setState({ celebrations: [] });
    const s = st();
    if (s.phase === 'lesson') s.startBattle();
    else if (s.phase === 'answering') answer(base);
    else if (s.phase === 'feedback') s.continueAfterFeedback();
    else if (s.phase === 'casting') s.cancelSkill();
    else if (s.phase === 'gameOver') {
      first[s.stageIdx] ??= false; tries[s.stageIdx] = (tries[s.stageIdx] ?? 1) + 1; inc('fails');
      if (tries[s.stageIdx] > 8) { inc('stuck'); return { first, tries }; }
      setup(r, s.stageIdx); st().startLevel(LEVELS[r], undefined, s.stageIdx);
    } else if (s.phase === 'monsterDown' || s.phase === 'summary' || s.phase === 'levelClear') {
      first[s.stageIdx] ??= true; inc('maxCombo', 0); m.maxCombo = Math.max(m.maxCombo, s.maxCombo);
      if (s.stageIdx >= to || s.phase === 'levelClear') return { first, tries };
      s.nextStage();
    }
  }
  return { first, tries };
}
const regions = (process.env.REGIONS ?? '0,2,4,6,8').split(',').map(Number);
for (const name of (process.env.PROFILES ?? 'strong,good,average,struggling').split(',')) {
  const base = PROFILES[name];
  console.log(`== ${name}（基準正確率 ${Math.round(base * 100)}%，難度、困難題、地圖後段會再下降）`);
  for (const r of regions) {
    m = { maxCombo: 0 };
    const agg: Record<string, { w: number; n: number; t: number }> = {};
    const add = (k: string, ok: boolean, t: number) => { const e = (agg[k] ??= { w: 0, n: 0, t: 0 }); e.n++; e.w += +ok; e.t += t; };
    for (const c of [0, chapterCount(r) - 1]) for (let k = 0; k < 2; k++) {
      const res = run(r, c * MAP_SIZE, c * MAP_SIZE + 19, base);
      for (const [stage, kind] of [[c * MAP_SIZE + 4, 'elite'], [c * MAP_SIZE + 14, 'gate'], [c * MAP_SIZE + 19, 'boss']] as const) if (stage in res.first) add(kind, res.first[stage], res.tries[stage] ?? 1);
      Object.entries(res.first).filter(([s]) => ![4, 9, 14, 19].includes(+s % MAP_SIZE)).forEach(([s, ok]) => add('normal', ok, res.tries[+s] ?? 1));
    }
    for (let k = 0; k < 3; k++) { const last = regionStageCount(r) - 1; const res = run(r, last, last, base); add("final", res.first[last] ?? false, res.tries[last] ?? (res.first[last] ? 1 : 9)); }
    const pct = (k: string) => agg[k] ? `${k} ${Math.round(100 * agg[k].w / agg[k].n)}%/${(agg[k].t / agg[k].n).toFixed(1)}次` : '';
    const avgCombo = m.comboN ? m.comboSum / m.comboN : 0;
    console.log(`r${r} ${['normal', 'elite', 'gate', 'boss', 'final'].map(pct).join(' ')} | 作答${m.answers} 失敗${m.fails ?? 0} 卡關${m.stuck ?? 0} 被題數卡住${Math.round(100 * (m.stuckAnswers ?? 0) / m.answers)}% 處決${m.slain ?? 0} 平均combo${Math.round(avgCombo)}（×${comboMultiplier(avgCombo).toFixed(1)}） 最高combo${m.maxCombo}`);
  }
}
