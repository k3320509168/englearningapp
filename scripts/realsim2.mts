// 真實玩家模擬 v2（全盤平衡第 2 輪，照 ChatGPT 第 1 輪的要求）
// - 養成：budget 實收支出／bare 裸裝／normal 無限資源+3對照／high 無限資源+7對照
// - 重打保留狀態（失敗次數、祝福援助），答錯過的題目再出現時正確率提高（LEARN）
// - 作答時間依題型與難度；技能能量滿就施放
// - 版本：A 現行／B 怪物 0 血立即結算（不強制補題）／C 答錯 combo 保留一半／D B＋C
// budget：GROWTH=budget SEED=7 BUDGET_MAPS_PER_DAY=1；日期/資源來源與配裝輸出JSON
// 用法：PROFILE=good VARIANT=A GROWTH=normal REGIONS=0,4,8 MAPS=30 FINALS=60 LEARN=0.1 npx tsx scripts/realsim2.mts
import fs from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { advanceAnswerTime } from './sim-clock';
import { assertBudget, assertBudgetLedger, budgetMaintenance, budgetReport, simulationClock, snapshotSave } from './sim-budget';
import type { BudgetLedger, BudgetSave } from './sim-budget';
const ROOT = new URL('../src', import.meta.url).pathname;
const { LEVELS, addBank, questionDifficulty, questionSkill } = await import(`${ROOT}/game/QuestionData`);
const { useBattleStore, setBattleRandom } = await import(`${ROOT}/store/battleStore`);
const { useSaveStore, initialSave } = await import(`${ROOT}/store/saveStore`);
// 模擬只靠獨立快照保存；停用localStorage序列化I/O，不改store行為。SIM_PERSIST=1作等價對照。
if (process.env.SIM_PERSIST !== '1') useSaveStore.persist.setOptions({ storage: { getItem: () => null, setItem: () => undefined, removeItem: () => undefined } });
const masteryModule = await import(`${ROOT}/game/mapMastery`);
const { DEFAULT_CHARACTER } = await import(`${ROOT}/game/character`);
const { recommendedLevel, comboMultiplier } = await import(`${ROOT}/game/progression`);
const { regionStageCount, chapterCount, MAP_SIZE } = await import(`${ROOT}/game/stageLayout`);
const { ADVANCE_REQ, nextOptions, xpToNext } = await import(`${ROOT}/game/growth`);
const { EQUIPMENT } = await import(`${ROOT}/game/equipment`);
const { useUiStore } = await import(`${ROOT}/store/uiStore`);
LEVELS.forEach((_: string, i: number) => addBank(i, JSON.parse(fs.readFileSync(`${ROOT}/game/questions/bank/r${i}.json`, 'utf8'))));

const PROFILES: Record<string, number> = { strong: 0.96, good: 0.9, average: 0.82, struggling: 0.72 };
const PROFILE = process.env.PROFILE ?? 'good';
const ROUTE = process.env.ROUTE ?? 'fast';
if (!['fast', 'normal', 'mastery'].includes(ROUTE)) throw new Error('ROUTE must be fast, normal or mastery');
const BASE = PROFILES[PROFILE];
const VARIANT = process.env.VARIANT ?? 'A';
const GROWTH = process.env.GROWTH ?? 'normal';
const isBudget = GROWTH === 'budget';
const mapsPerDay = Number(process.env.BUDGET_MAPS_PER_DAY ?? 1);
if (!Number.isInteger(mapsPerDay) || mapsPerDay < 1) throw new Error('BUDGET_MAPS_PER_DAY must be a positive integer');
const budgetClock = isBudget ? simulationClock() : null;
const budgetEpoch = budgetClock?.now() ?? 0;
if (budgetClock) process.once('exit', () => budgetClock.restore());
let preparingBudget = false, budgetMapsCompleted = 0, budgetReviewDays = 0;
let budgetLedger: BudgetLedger = {};
const budgetSnapshots = new Map<string, { save: BudgetSave; wrong: string[]; at: number; ledger: BudgetLedger }>();
const budgetPath: unknown[] = [];
let budgetStop: string | null = null;
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
  if (isBudget) {
    if (!preparingBudget) {
      const snap = budgetSnapshots.get(`${r}:${stage}`);
      if (!snap) throw new Error(`Unreached budget checkpoint r${r}:${stage}`);
      useSaveStore.setState(structuredClone(snap.save));
      wrongSeen.clear(); snap.wrong.forEach(key => wrongSeen.add(key));
      budgetClock!.set(snap.at); budgetLedger = { ...snap.ledger };
      return;
    }
    budgetClock!.set(budgetEpoch + (Math.floor(budgetMapsCompleted / mapsPerDay) + budgetReviewDays) * 86400000);
    budgetMaintenance(rand, budgetLedger);
    if (!budgetSnapshots.has(`${r}:${stage}`)) budgetSnapshots.set(`${r}:${stage}`, { save: snapshotSave(), wrong: [...wrongSeen], at: budgetClock!.now(), ledger: { ...budgetLedger } });
    budgetPath.push({ region: r, stage, date: new Date().toISOString(), xpLedger: { ...sv().xpLedger }, ...budgetReport(budgetLedger) });
    return;
  }
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
function answerBody() {
  if (st().modChoice) st().chooseModSkill(st().modChoice![0]);
  const idx = st().party.findIndex((p: { hp: number; energy: number; energyMax: number }) => p.hp > 0 && p.energy >= p.energyMax);
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
  advanceAnswerTime(st, ms);
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

function answer() {
  if (!isBudget) return answerBody();
  const before = { gold: sv().gold, materials: { ...sv().materials } };
  try { answerBody(); } finally {
    const gold = sv().gold - before.gold;
    budgetLedger.mainlineGold = (budgetLedger.mainlineGold ?? 0) + gold;
    inc('mainlineGold', gold);
    for (const [id, n] of Object.entries(sv().materials)) {
      const key = `mainlineMaterial:${id}`;
      budgetLedger[key] = (budgetLedger[key] ?? 0) + Number(n) - (before.materials[id] ?? 0);
    }
    assertBudget();
  }
}

// 方案 B：每一關開始時把最低題數歸零（怪物 0 血就結算、一般關不再補怪）
let lastStage = -1;
function onStage() { if (instantKill && st().stageIdx !== lastStage) { lastStage = st().stageIdx; useBattleStore.setState({ minAnswers: 0 }); } }

const totalXp = (player: { level: number; xp: number }) => {
  let total = player.xp;
  for (let lv = 1; lv < player.level; lv++) total += xpToNext(lv);
  return total;
};
function run(r: number, from: number, to: number) {
  setup(r, from); useUiStore.setState({ celebrations: [] }); st().startLevel(LEVELS[r], undefined, from); lastStage = -1;
  const tries: Record<number, number> = {}; const cleared: Record<number, number> = {};
  const xp0 = totalXp(sv().player); const gold0 = sv().gold;
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
      if (isBudget) budgetMaintenance(rand, budgetLedger);
      // 重打：保留存檔（養成、失敗次數與援助都在），從同一關開始
      st().startLevel(LEVELS[r], undefined, s.stageIdx); lastStage = -1;
    } else if (['monsterDown', 'summary', 'levelClear'].includes(s.phase)) {
      cleared[s.stageIdx] = tries[s.stageIdx] ?? 1;
      if (s.stageIdx >= to || s.phase === 'levelClear') break;
      s.nextStage();
    }
  }
  if (isBudget) {
    budgetMaintenance(rand, budgetLedger); assertBudgetLedger(budgetLedger);
    const acceptedXp = Object.entries(sv().xpLedger).filter(([key]) => key.startsWith('accepted:')).reduce((sum, [, n]) => sum + Number(n), 0);
    if (Math.abs(acceptedXp - (totalXp(sv().player) - totalXp({ level: 5, xp: 0 }))) > 1e-6) throw new Error('XP ledger does not reconcile with actual player growth');
  }
  inc('xp', totalXp(sv().player) - xp0); inc('gold', sv().gold - gold0);
  return cleared;
}

function prepareBudgetPath() {
  preparingBudget = true;
  useSaveStore.setState({ ...structuredClone(initialSave), character: DEFAULT_CHARACTER,
    player: { ...initialSave.player, level: 5 }, tutorialDone: true, prologueDone: true,
    settings: { ...initialSave.settings, showLessons: false } });
  wrongSeen.clear(); budgetLedger = { initialGold: sv().gold, ...Object.fromEntries(Object.entries(sv().materials).map(([id, n]) => [`initialMaterial:${id}`, n])) };
  const maxRegion = Math.max(...REGIONS);
  for (let r = 0; r <= maxRegion; r++) {
    for (let chapter = 0; chapter < chapterCount(r); chapter++) {
      const from = chapter * MAP_SIZE, to = from + MAP_SIZE - 1;
      const cleared = run(r, from, to);
      if (!cleared[to]) { budgetStop = `r${r} map${chapter + 1}, player Lv${sv().player.level}`; preparingBudget = false; return; }
      budgetMapsCompleted++;
      if (process.env.SIM_PROGRESS === '1') console.log(`[path] ${PROFILE}/${ROUTE} r${r} map${chapter + 1} Lv${sv().player.level}`);
      const mapKey = `${LEVELS[r]}#${chapter}`;
      const { masteryReady } = masteryModule;
      // 正常路線每第三張做一次可選整圖複習；精通路線最多額外六次，缺題如實保留未完成。
      const reviewLimit = ROUTE === 'mastery' ? 6 : ROUTE === 'normal' && budgetMapsCompleted % 3 === 0 ? 1 : 0;
      for (let review = 0; review < reviewLimit && (ROUTE !== 'mastery' || !masteryReady(r, sv().mapMastery[mapKey])); review++) {
        const reviewClear = run(r, from, to);
        budgetReviewDays++;
        if (!reviewClear[to]) break;
      }
      const beforeGold = sv().gold, beforeMaterials = { ...sv().materials };
      if (sv().claimMapMastery(r, chapter)) {
        budgetLedger.masteryGold = (budgetLedger.masteryGold ?? 0) + sv().gold - beforeGold;
        for (const [id, value] of Object.entries(sv().materials)) {
          const key = `masteryMaterial:${id}`;
          budgetLedger[key] = (budgetLedger[key] ?? 0) + Number(value) - (beforeMaterials[id] ?? 0);
        }
      }
      assertBudgetLedger(budgetLedger);
      budgetPath.push({ region: r, stage: to, checkpoint: 'afterMap', recommended: recommendedLevel(r, to), delta: sv().player.level - recommendedLevel(r, to), xpLedger: { ...sv().xpLedger }, mastery: sv().mapMastery[mapKey], ...budgetReport(budgetLedger), elapsedModelMs: m.ms ?? 0, submitted: m.answers ?? 0 });
    }
    const last = regionStageCount(r) - 1;
    const cleared = run(r, last, last);
    if (!cleared[last]) { budgetStop = `r${r} final, player Lv${sv().player.level}`; preparingBudget = false; return; }
    budgetPath.push({ region: r, stage: last, checkpoint: 'afterFinal', recommended: recommendedLevel(r, last), delta: sv().player.level - recommendedLevel(r, last), xpLedger: { ...sv().xpLedger }, ...budgetReport(budgetLedger) });
    // 經濟模型條件：魔王已倒且守門人驗證完成；只開路，不發等級或金幣。
    sv().unlockLevel(Math.min(8, r + 1));
  }
  preparingBudget = false;
}
if (isBudget) {
  prepareBudgetPath();
  const file = process.env.BUDGET_OUT ?? join(tmpdir(), 'enggame-question-qa', `budget-${PROFILE}.json`);
  fs.mkdirSync(dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify({ profile: PROFILE, route: ROUTE, pathMetrics: { ...m }, reviewDays: budgetReviewDays, xpLedger: sv().xpLedger, nominalAccuracy: BASE, seed: Number(process.env.SEED ?? 7), clockStepMs: 50, maps: MAPS, finals: FINALS, regions: REGIONS, policy: 'affordable-equipment-now, ordinary-plus3, balanced-hero-training, no-UR-savings-reserve', mapsPerDay, completedMaps: budgetMapsCompleted,
    stopped: budgetStop, path: budgetPath, final: budgetReport(budgetLedger) }, null, 2));
  console.log(`[budget-path] checkpoints=${budgetSnapshots.size}, completedMaps=${budgetMapsCompleted}, stopped=${budgetStop ?? 'none'}, report=${file}`);
}

const q = (arr: number[], p: number) => { if (!arr.length) return 0; const a = [...arr].sort((x, y) => x - y); return a[Math.min(a.length - 1, Math.floor(p * a.length))]; };
const pct = (x: number) => Number.isFinite(x) ? `${Math.round(x * 100)}%` : '未測';
const out: string[] = [];
for (const r of REGIONS) {
  m = {}; combos = []; mults = []; wrongSeen.clear();
  const agg: Record<string, number[]> = {};
  const add = (k: string, t: number) => (agg[k] ??= []).push(t);
  let measuredMaps = 0;
  for (let k = 0; k < MAPS; k++) {
    const c = k % chapterCount(r);
    if (isBudget && !budgetSnapshots.has(`${r}:${c * MAP_SIZE}`)) { inc('unreachedMaps'); continue; }
    measuredMaps++;
    const res = run(r, c * MAP_SIZE, c * MAP_SIZE + 19);
    for (let i = 0; i < 20; i++) {
      const s = c * MAP_SIZE + i; const t = res[s] ?? 9;
      add(i === 19 ? 'boss' : i === 14 ? 'gate' : i === 4 || i === 9 ? 'elite' : 'normal', t);
    }
  }
  const mapStats = { ...m };
  for (let k = 0; k < FINALS; k++) { const last = regionStageCount(r) - 1; if (isBudget && !budgetSnapshots.has(`${r}:${last}`)) { inc('unreachedFinals'); continue; } const res = run(r, last, last); add('final', res[last] ?? 9); }
  const line = (k: string) => {
    const t = agg[k] ?? [];
    if (!t.length) return `${k} 未測（n=0）`;
    return `${k} 首過${pct(t.filter(x => x === 1).length / t.length)} 平均${(t.reduce((a, b) => a + b, 0) / t.length).toFixed(2)}次 ≤3次${pct(t.filter(x => x <= 3).length / t.length)}(n=${t.length})`;
  };
  const acc = (s: string) => (m[`n_${s}`] ? pct((m[`ok_${s}`] ?? 0) / m[`n_${s}`]) : '-');
  out.push(`[${PROFILE}/${GROWTH}/${VARIANT}] r${r}`);
  if (isBudget) out.push(`  budget snapshots=${[...budgetSnapshots.keys()].filter(key => key.startsWith(`${r}:`)).join(',') || 'none'} 未達圖=${m.unreachedMaps ?? 0} 未達魔王=${m.unreachedFinals ?? 0}`);
  out.push('  ' + ['normal', 'elite', 'gate', 'boss', 'final'].map(line).join(' | '));
  if (!m.answers) { out.push(isBudget && [...budgetSnapshots.keys()].some(key => key.startsWith(`${r}:`)) ? '  連續路徑已抵達，此次沒有條件式抽樣樣本；主線成長見budget JSON。' : '  沒有可測樣本；不計通過率、時間或成長。'); continue; }
  out.push(`  實際正確率 ${pct(m.correct / m.answers)}（聽${acc('listening')} 讀${acc('reading')} 說${acc('speaking')} 寫${acc('writing')}）`
    + (measuredMaps ? ` 每張地圖 ${Math.round(mapStats.answers / measuredMaps)} 題、${Math.round(mapStats.ms / measuredMaps / 60000)} 分鐘、EXP ${Math.round(mapStats.xp / measuredMaps)}、金幣淨額 ${Math.round(mapStats.gold / measuredMaps)}${isBudget ? `、主線毛收入 ${Math.round((mapStats.mainlineGold ?? 0) / measuredMaps)}` : ''}` : ' 每張地圖未測（n=0）'));
  out.push(`  怪物0血後作答 ${pct((m.deadAnswers ?? 0) / m.answers)}（時間${pct((m.deadMs ?? 0) / m.ms)}） combo 中位${q(combos, 0.5)} P90 ${q(combos, 0.9)} P99 ${q(combos, 0.99)}`
    + ` 每擊倍率 中位×${q(mults, 0.5).toFixed(1)} P90×${q(mults, 0.9).toFixed(1)} 技能${Math.round((mapStats.skills ?? 0) / Math.max(1, measuredMaps))}／圖 處決${m.slain ?? 0} 答錯後恢復${m.recoverN ? (m.recoverSum / m.recoverN).toFixed(1) : '-'}題 失敗${m.fails ?? 0} 卡死${m.stuck ?? 0}`);
}
console.log(out.join('\n'));
budgetClock?.restore();
