// 真實玩家模擬 v2（全盤平衡第 2 輪，照 ChatGPT 第 1 輪的要求）
// - 養成：bare 裸裝／normal 合法的轉職＋鍛造裝備 +3／high 裝備 +7＋SSR 英雄升星
// - 重打保留狀態（失敗次數、祝福援助），答錯過的題目再出現時正確率提高（LEARN）
// - 作答時間依題型與難度；技能能量滿就施放
// - 版本：A 現行／B 怪物 0 血立即結算（不強制補題）／C 答錯 combo 保留一半／D B＋C
// 用法：PROFILE=good VARIANT=A GROWTH=normal REGIONS=0,4,8 MAPS=30 FINALS=60 LEARN=0.1 npx tsx scripts/realsim2.mts
import fs from 'node:fs';
const ROOT = new URL('../src', import.meta.url).pathname;
const { LEVELS, addBank, questionDifficulty, questionSkill } = await import(`${ROOT}/game/QuestionData`);
const { useBattleStore, setBattleRandom } = await import(`${ROOT}/store/battleStore`);
const { useSaveStore, initialSave } = await import(`${ROOT}/store/saveStore`);
const { DEFAULT_CHARACTER } = await import(`${ROOT}/game/character`);
const { recommendedLevel, comboMultiplier } = await import(`${ROOT}/game/progression`);
const { regionStageCount, chapterCount, MAP_SIZE } = await import(`${ROOT}/game/stageLayout`);
const { ADVANCE_REQ, nextOptions } = await import(`${ROOT}/game/growth`);
const { EQUIPMENT } = await import(`${ROOT}/game/equipment`);
const { useUiStore } = await import(`${ROOT}/store/uiStore`);
LEVELS.forEach((_: string, i: number) => addBank(i, JSON.parse(fs.readFileSync(`${ROOT}/game/questions/bank/r${i}.json`, 'utf8'))));

const PROFILES: Record<string, number> = { strong: 0.96, good: 0.9, average: 0.82, struggling: 0.72 };
const PROFILE = process.env.PROFILE ?? 'good';
const BASE = PROFILES[PROFILE];
const VARIANT = process.env.VARIANT ?? 'A';
const GROWTH = process.env.GROWTH ?? 'normal';
const LEARN = Number(process.env.LEARN ?? 0.1);
const MAPS = Number(process.env.MAPS ?? 30);
const FINALS = Number(process.env.FINALS ?? 60);
const REGIONS = (process.env.REGIONS ?? '0,4,8').split(',').map(Number);
const instantKill = VARIANT === 'B' || VARIANT === 'D';
const softCombo = VARIANT === 'C' || VARIANT === 'D';

let seed = Number(process.env.SEED ?? 7);
const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
setBattleRandom(rand);
const st = () => useBattleStore.getState();
const sv = () => useSaveStore.getState();

// ---------- 養成 ----------
function setup(r: number, stage: number) {
  const lv = recommendedLevel(r, stage);
  const high = GROWTH === 'high';
  const party = high ? ['player', 'valor', 'aurora', 'sanctuary'] : ['player', 'mage', 'castle', 'bard'];
  const heroes = high ? ['valor', 'aurora', 'sanctuary', 'knight'] : ['knight', 'mage', 'castle', 'bard'];
  useSaveStore.setState({
    ...initialSave, character: DEFAULT_CHARACTER, heroes, party, player: { level: lv, xp: 0, classPath: [] },
    heroLevel: Object.fromEntries(heroes.map(h => [h, lv])), heroStars: high ? { valor: 2, aurora: 2, sanctuary: 2 } : {},
    hintsSeen: ['boss', 'skill'], tutorialDone: true, prologueDone: true, unlockedIndex: r, settings: { ...initialSave.settings, showLessons: false },
    gold: 1e8, classBadges: 999, materials: { ore: 9999, core: 999, dragon: 999, ...Object.fromEntries(['metal', 'wood', 'water', 'fire', 'earth', 'light', 'dark'].map(e => [`crystal_${e}`, 999])) },
  });
  if (GROWTH === 'bare') return;
  // 轉職：等級到了就走第一條路線
  for (const tier of [1, 2, 3] as const) {
    if (lv < ADVANCE_REQ[tier].level) break;
    const opt = nextOptions(DEFAULT_CHARACTER.classId, sv().player.classPath)[0];
    if (opt) sv().advanceClass(opt.id);
  }
  // 裝備：每個欄位鍛造目前合法的最高稀有度，再強化
  const rarityRank = ['N', 'R', 'SR', 'SSR', 'UR'];
  for (const slot of ['weapon', 'armor', 'accessory']) {
    const ok = EQUIPMENT.filter((d: { slot: string; requires?: { regionsCleared?: number; classTier?: number } }) => d.slot === slot
      && (d.requires?.regionsCleared ?? 0) <= r && (d.requires?.classTier ?? 0) <= sv().player.classPath.length);
    ok.sort((a: { rarity: string }, b: { rarity: string }) => rarityRank.indexOf(b.rarity) - rarityRank.indexOf(a.rarity));
    const def = ok[0];
    if (!def || !sv().forge(def.id)) continue;
    const item = sv().equipment[sv().equipment.length - 1];
    sv().equip(item.uid);
    for (let i = 0; i < (high ? 7 : 3); i++) sv().enhance(item.uid, true, () => 0);
  }
}

// ---------- 作答 ----------
const wrongSeen = new Set<string>();
let m: Record<string, number> = {};
let combos: number[] = []; let mults: number[] = [];
const inc = (k: string, v = 1) => { m[k] = (m[k] ?? 0) + v; };
const TYPE_MS: Record<string, number> = { listening: 6000, reading: 5000, writing: 9000, speaking: 5000 };
function answer() {
  if (st().modChoice) st().chooseModSkill(st().modChoice![0]);
  const idx = st().party.findIndex(p => p.hp > 0 && p.energy >= p.energyMax);
  if (idx >= 0) { st().requestSkill(idx); if (st().phase === 'casting') { st().confirmSkill(); inc('skills'); } if (st().phase !== 'answering') return; }
  const s0 = st();
  const q = s0.question!;
  const key = `${q.type}|${q.desc}`;
  const inMap = (s0.stageIdx % MAP_SIZE) / MAP_SIZE;
  const acc = Math.min(0.99, Math.max(0.3, BASE - 0.06 * (questionDifficulty(q) - 1) - (s0.isBossQuestion ? 0.05 : 0) - 0.04 * inMap + (wrongSeen.has(key) ? LEARN : 0)));
  const ok = rand() < acc;
  const skill = questionSkill(q);
  const base = (TYPE_MS[skill] ?? 6000) + 1500 * (questionDifficulty(q) - 1);
  const ms = ok ? base * (0.6 + rand() * 0.8) : (rand() < 0.15 ? 21000 : base * (0.8 + rand() * 0.8));
  inc('ms', ms + 2500);
  inc(`n_${skill}`); if (ok) inc(`ok_${skill}`);
  const dead = s0.monsterHp <= 0 && !s0.bonusRound;
  st().tick(ms);
  if (st().phase !== 'answering') { inc('timeouts'); return; }
  inc('answers'); if (dead) { inc('deadAnswers'); inc('deadMs', ms + 2500); }
  const before = s0.combo;
  if (ok) {
    if (q.type === 'choice') st().chooseOption(q.ans);
    else if (q.type === 'voice') st().submitVoice(q.ans);
    else { q.ans.slice(st().typed.length).split('').forEach((c: string) => st().inputLetter(c)); st().submitTyped(); }
    inc('correct');
    const e = st().event;
    if (e?.kind === 'attack' && !dead) { combos.push(st().combo); mults.push(comboMultiplier(st().combo)); }
    if (e?.slain) inc('slain');
    // 答錯後要幾題才重新打出有效攻擊（連續答錯幾題）
    if ((m.sinceWrong ?? -1) > 0) { inc('recoverSum', m.sinceWrong); inc('recoverN'); }
    m.sinceWrong = -1;
  } else {
    wrongSeen.add(key);
    if (q.type === 'choice') st().chooseOption(['A', 'B', 'C', 'D'].find(l => l !== q.ans)!);
    else if (q.type === 'voice') st().submitVoice('zzzz');
    else { st().inputLetter('Q'); st().submitTyped(); }
    if (softCombo && before > 0 && st().combo === 0) useBattleStore.setState({ combo: Math.floor(before * 0.5) });
    m.sinceWrong = (m.sinceWrong ?? -1) > 0 ? m.sinceWrong + 1 : 1;
  }
}

// 方案 B：每一關開始時把最低題數歸零（怪物 0 血就結算、一般關不再補怪）
let lastStage = -1;
function onStage() { if (instantKill && st().stageIdx !== lastStage) { lastStage = st().stageIdx; useBattleStore.setState({ minAnswers: 0 }); } }

function run(r: number, from: number, to: number) {
  setup(r, from); useUiStore.setState({ celebrations: [] }); st().startLevel(LEVELS[r], undefined, from); lastStage = -1;
  const tries: Record<number, number> = {}; const cleared: Record<number, number> = {};
  const xp0 = sv().player.xp; const gold0 = sv().gold;
  for (let i = 0; i < 12000; i++) {
    useUiStore.setState({ celebrations: [] });
    onStage();
    const s = st();
    if (s.phase === 'lesson') s.startBattle();
    else if (s.phase === 'answering') answer();
    else if (s.phase === 'feedback') s.continueAfterFeedback();
    else if (s.phase === 'casting') s.cancelSkill();
    else if (s.phase === 'gameOver') {
      tries[s.stageIdx] = (tries[s.stageIdx] ?? 1) + 1; inc('fails');
      if (tries[s.stageIdx] > 8) { inc('stuck'); break; }
      // 重打：保留存檔（養成、失敗次數與援助都在），從同一關開始
      st().startLevel(LEVELS[r], undefined, s.stageIdx); lastStage = -1;
    } else if (['monsterDown', 'summary', 'levelClear'].includes(s.phase)) {
      cleared[s.stageIdx] = tries[s.stageIdx] ?? 1;
      if (s.stageIdx >= to || s.phase === 'levelClear') break;
      s.nextStage();
    }
  }
  inc('xp', sv().player.xp - xp0 + 0); inc('gold', sv().gold - gold0);
  return cleared;
}

const q = (arr: number[], p: number) => { if (!arr.length) return 0; const a = [...arr].sort((x, y) => x - y); return a[Math.min(a.length - 1, Math.floor(p * a.length))]; };
const pct = (x: number) => `${Math.round(x * 100)}%`;
const out: string[] = [];
for (const r of REGIONS) {
  m = {}; combos = []; mults = []; wrongSeen.clear();
  const agg: Record<string, number[]> = {};
  const add = (k: string, t: number) => (agg[k] ??= []).push(t);
  for (let k = 0; k < MAPS; k++) {
    const c = k % chapterCount(r);
    const res = run(r, c * MAP_SIZE, c * MAP_SIZE + 19);
    for (let i = 0; i < 20; i++) {
      const s = c * MAP_SIZE + i; const t = res[s] ?? 9;
      add(i === 19 ? 'boss' : i === 14 ? 'gate' : i === 4 || i === 9 ? 'elite' : 'normal', t);
    }
  }
  const mapStats = { ...m };
  for (let k = 0; k < FINALS; k++) { const last = regionStageCount(r) - 1; const res = run(r, last, last); add('final', res[last] ?? 9); }
  const line = (k: string) => {
    const t = agg[k] ?? [];
    return `${k} 首過${pct(t.filter(x => x === 1).length / t.length)} 平均${(t.reduce((a, b) => a + b, 0) / t.length).toFixed(2)}次 ≤3次${pct(t.filter(x => x <= 3).length / t.length)}(n=${t.length})`;
  };
  const acc = (s: string) => (m[`n_${s}`] ? pct((m[`ok_${s}`] ?? 0) / m[`n_${s}`]) : '-');
  out.push(`[${PROFILE}/${GROWTH}/${VARIANT}] r${r}`);
  out.push('  ' + ['normal', 'elite', 'gate', 'boss', 'final'].map(line).join(' | '));
  out.push(`  實際正確率 ${pct(m.correct / m.answers)}（聽${acc('listening')} 讀${acc('reading')} 說${acc('speaking')} 寫${acc('writing')}）`
    + ` 每張地圖 ${Math.round(mapStats.answers / MAPS)} 題、${Math.round(mapStats.ms / MAPS / 60000)} 分鐘、EXP ${Math.round(mapStats.xp / MAPS)}、金幣 ${Math.round(mapStats.gold / MAPS)}`);
  out.push(`  怪物0血後作答 ${pct((m.deadAnswers ?? 0) / m.answers)}（時間${pct((m.deadMs ?? 0) / m.ms)}） combo 中位${q(combos, 0.5)} P90 ${q(combos, 0.9)} P99 ${q(combos, 0.99)}`
    + ` 每擊倍率 中位×${q(mults, 0.5).toFixed(1)} P90×${q(mults, 0.9).toFixed(1)} 技能${Math.round((m.skills ?? 0) / MAPS)}／圖 處決${m.slain ?? 0} 答錯後恢復${m.recoverN ? (m.recoverSum / m.recoverN).toFixed(1) : '-'}題 失敗${m.fails ?? 0} 卡死${m.stuck ?? 0}`);
}
console.log(out.join('\n'));
