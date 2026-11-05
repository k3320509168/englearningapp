import type { Question } from './types';
import { shuffleArray } from './battle';
import { questionSkill } from './QuestionData';
import prologueBank from './questions/bank/r-pre.json';
import diagBank from './questions/bank/diag.json';

// 自適應程度測驗 v1.6（ChatGPT 第十六輪，docs/STAGE_PLAN.md 第 17 節）。
// 層級：0 Pre-A1、1 A1、2 A2、3 A2+、4 B1、5 B1+、6 B2、7 B2+、8 C1、9 C2（區域索引＝層級 − 1）。
// 先用聽讀探測落點（每批 5 題，依答對數升降），找到「最高通過」與「最低未通過」相鄰就停；
// 再用口說、寫作各 4 題確認，任一項低於 3/4 落點降一級。這是遊戲內分級，不是正式 CEFR 認證。

export const PLACEMENT_LEVELS = ['Pre-A1', 'A1', 'A2', 'A2+', 'B1', 'B1+', 'B2', 'B2+', 'C1', 'C2'];
export const PLACEMENT_START = 4;        // 預設從 B1 開始
export const BATCH_SIZE = 5;
export const EXTRA_SIZE = 3;            // 3/5 時同級補 3 題，8 題 ≥ 6 算通過
export const EXTRA_PASS = 6;
export const MAX_BATCHES = 5;
export const MAX_PROBE_QUESTIONS = 28;
export const CONFIRM_SIZE = 4;          // 口說、寫作各 4 題
export const CONFIRM_PASS = 3;
export const TIME_LIMIT_MS = 15 * 60_000;

type DiagQuestion = Question & { level?: string; point?: string };
const levelOf = (name: string) => PLACEMENT_LEVELS.indexOf(name);

// 每個層級的診斷題：Pre-A1 用前置區域題庫，其他用診斷題池（只用在測驗，不和一般關卡共用）
const POOL: Question[][] = PLACEMENT_LEVELS.map(() => []);
POOL[0] = prologueBank.normal as Question[];
for (const q of diagBank as DiagQuestion[]) {
  const lv = levelOf(q.level ?? '');
  if (lv >= 0) POOL[lv].push(q);
}
const isListening = (q: Question) => q.type === 'choice' && questionSkill(q) === 'listening';
const isReading = (q: Question) => q.type === 'choice' && questionSkill(q) === 'reading';

// 有題目可以測的最高層級（題庫還沒補齊的層級不測）
export function maxTestable(pool: Question[][] = POOL): number {
  let top = 0;
  pool.forEach((list, lv) => { if (list.filter(isReading).length >= 3 && list.filter(isListening).length >= 3) top = lv; });
  return top;
}

export interface LevelResult { correct: number; total: number }
export interface PlacementState {
  phase: 'probe' | 'confirm' | 'done';
  level: number;                     // 正在測的層級
  queue: Question[];                 // 這一批還沒答的題目
  batchCorrect: number;
  batchTotal: number;
  extra: boolean;                    // 這一批是不是 3/5 的補題
  batches: number;
  probed: number;                    // 聽讀已經答幾題
  results: Record<number, LevelResult>;
  passed: number[];
  failed: number[];
  used: string[];
  confirm: { speaking: LevelResult; writing: LevelResult };
  speakingVerified: boolean;
  startedAt: number;
  result: number | null;
  confidence: 'ok' | 'low';
  weak: ('speaking' | 'writing')[];
}

const key = (q: Question) => `${q.type}|${q.desc}|${q.speak ?? ''}`;

function take(pool: Question[], n: number, used: Set<string>, rand: () => number): Question[] {
  return shuffleArray(pool.filter(q => !used.has(key(q))), rand).slice(0, n);
}

// 一批聽讀：單數批 3 讀 2 聽、雙數批 2 讀 3 聽（補題 3 題混合）
function probeBatch(level: number, batchNo: number, size: number, used: Set<string>, rand: () => number, pool: Question[][]): Question[] {
  const list = pool[level];
  const reading = size === BATCH_SIZE ? (batchNo % 2 === 0 ? 3 : 2) : 2;
  const r = take(list.filter(isReading), reading, used, rand);
  r.forEach(q => used.add(key(q)));
  const l = take(list.filter(isListening), size - r.length, used, rand);
  // 聽力也要立即記錄，否則後續同級批次可能重出已經回答過的題目。
  l.forEach(q => used.add(key(q)));
  return shuffleArray([...r, ...l], rand);
}

export function startPlacement(start = PLACEMENT_START, opts: { voice?: boolean; rand?: () => number; now?: number; pool?: Question[][] } = {}): PlacementState {
  const rand = opts.rand ?? Math.random;
  const pool = opts.pool ?? POOL;
  const level = Math.min(Math.max(0, start), maxTestable(pool));
  const used = new Set<string>();
  const queue = probeBatch(level, 0, BATCH_SIZE, used, rand, pool);
  return {
    phase: 'probe', level, queue, batchCorrect: 0, batchTotal: 0, extra: false, batches: 0, probed: 0,
    results: {}, passed: [], failed: [], used: [...used, ...queue.map(key)],
    confirm: { speaking: { correct: 0, total: 0 }, writing: { correct: 0, total: 0 } },
    speakingVerified: opts.voice ?? true, startedAt: opts.now ?? Date.now(), result: null, confidence: 'ok', weak: [],
  };
}

export const currentQuestion = (s: PlacementState): Question | null => s.queue[0] ?? null;

// 最高通過與最低未通過之間還沒測的層級（沒有就停）
function bounds(s: PlacementState, top: number) {
  const hi = s.passed.length ? Math.max(...s.passed) : -1;
  const above = s.failed.filter(l => l > hi);
  const lo = above.length ? Math.min(...above) : top + 1;
  return { hi, lo };
}

export function answerPlacement(s: PlacementState, correct: boolean, opts: { rand?: () => number; now?: number; pool?: Question[][] } = {}): PlacementState {
  const rand = opts.rand ?? Math.random;
  const pool = opts.pool ?? POOL;
  const now = opts.now ?? Date.now();
  const q = s.queue[0];
  if (!q || s.phase === 'done') return s;
  let next: PlacementState = { ...s, queue: s.queue.slice(1) };
  if (s.phase === 'confirm') {
    const skill = q.type === 'voice' ? 'speaking' : 'writing';
    const r = next.confirm[skill];
    next.confirm = { ...next.confirm, [skill]: { correct: r.correct + (correct ? 1 : 0), total: r.total + 1 } };
    return next.queue.length && now - s.startedAt < TIME_LIMIT_MS ? next : finish(next);
  }
  next = { ...next, batchCorrect: s.batchCorrect + (correct ? 1 : 0), batchTotal: s.batchTotal + 1, probed: s.probed + 1 };
  if (next.queue.length > 0) return next;
  return afterBatch(next, rand, pool, now);
}

function afterBatch(s: PlacementState, rand: () => number, pool: Question[][], now: number): PlacementState {
  const top = maxTestable(pool);
  const prev = s.results[s.level] ?? { correct: 0, total: 0 };
  const results = { ...s.results, [s.level]: { correct: prev.correct + s.batchCorrect, total: prev.total + s.batchTotal } };
  let next: PlacementState = { ...s, results, batches: s.batches + (s.extra ? 0 : 1), batchCorrect: 0, batchTotal: 0 };
  const used = new Set(s.used);
  let step = 0;
  let decided = true;
  if (s.extra) {
    // 補題後看這一級累計 8 題
    if (results[s.level].correct >= EXTRA_PASS) { next.passed = [...s.passed, s.level]; step = 1; } else { next.failed = [...s.failed, s.level]; step = -1; }
  } else if (s.batchCorrect === BATCH_SIZE) { next.passed = [...s.passed, s.level]; step = 2; }
  else if (s.batchCorrect === 4) { next.passed = [...s.passed, s.level]; step = 1; }
  else if (s.batchCorrect === 3) decided = false;
  else if (s.batchCorrect === 2) { next.failed = [...s.failed, s.level]; step = -1; }
  else { next.failed = [...s.failed, s.level]; step = -2; }

  const outOfTime = now - s.startedAt >= TIME_LIMIT_MS;
  if (!decided) {
    const extra = probeBatch(s.level, next.batches, EXTRA_SIZE, used, rand, pool);
    if (extra.length && next.probed + extra.length <= MAX_PROBE_QUESTIONS && !outOfTime) {
      return { ...next, extra: true, queue: extra, used: [...used] };
    }
    // 沒題目或沒時間補：當作沒通過，結果標記為不確定
    next = { ...next, failed: [...next.failed, s.level], confidence: 'low' };
    step = -1;
  }
  next.extra = false;
  const { hi, lo } = bounds(next, top);
  const settled = lo === hi + 1 || hi >= top || lo <= 0;
  if (settled) return toConfirm(next, rand, pool);
  if (next.batches >= MAX_BATCHES || next.probed + BATCH_SIZE > MAX_PROBE_QUESTIONS || outOfTime) {
    return toConfirm({ ...next, confidence: 'low' }, rand, pool);
  }
  // 下一批：依答對數升降，但只在「最高通過」與「最低未通過」之間找
  let level = Math.min(Math.max(s.level + step, hi + 1), lo - 1);
  level = Math.min(Math.max(0, level), top);
  const queue = probeBatch(level, next.batches, BATCH_SIZE, used, rand, pool);
  if (queue.length === 0) return toConfirm({ ...next, confidence: 'low' }, rand, pool);
  return { ...next, level, queue, used: [...used] };
}

// 聽讀落點：最高通過的層級（都沒通過就是 Pre-A1）
const probeResult = (s: PlacementState) => Math.max(0, s.passed.length ? Math.max(...s.passed) : 0);

// 口說、寫作確認：以落點為中心，2 題同級、各 1 題低一級與高一級（沒有題目就用同級）。Pre-A1 不用確認
function toConfirm(s: PlacementState, rand: () => number, pool: Question[][]): PlacementState {
  const at = probeResult(s);
  if (at === 0) return finish({ ...s, phase: 'confirm', queue: [] });
  const used = new Set(s.used);
  const top = maxTestable(pool);
  const pick = (filter: (q: Question) => boolean) => {
    const out: Question[] = [];
    for (const lv of [at, at, Math.max(1, at - 1), Math.min(top, at + 1)]) {
      const q = take(pool[lv].filter(filter), 1, used, rand)[0] ?? take(pool[at].filter(filter), 1, used, rand)[0];
      if (q) { used.add(key(q)); out.push(q); }
    }
    return out;
  };
  const speaking = s.speakingVerified ? pick(q => q.type === 'voice') : [];
  const writing = pick(q => q.type === 'spell' || q.type === 'fill');
  return { ...s, phase: 'confirm', queue: [...speaking, ...writing], used: [...used] };
}

function finish(s: PlacementState): PlacementState {
  let result = probeResult(s);
  const weak: ('speaking' | 'writing')[] = [];
  const incomplete = s.confirm.writing.total < CONFIRM_SIZE || (s.speakingVerified && s.confirm.speaking.total < CONFIRM_SIZE);
  const confidence = incomplete ? 'low' : s.confidence;
  const speakingVerified = s.speakingVerified && s.confirm.speaking.total >= CONFIRM_SIZE;
  const low = (r: LevelResult) => r.total >= CONFIRM_SIZE && r.correct < CONFIRM_PASS;
  if (s.speakingVerified && low(s.confirm.speaking)) weak.push('speaking');
  if (low(s.confirm.writing)) weak.push('writing');
  if (weak.length) result = Math.max(0, result - 1);
  // 資料不足時保守一點：推薦低一級（玩家可以自己選高一級）
  if (confidence === 'low' && result > 0 && !weak.length) result -= 1;
  return { ...s, phase: 'done', queue: [], result, weak, confidence, speakingVerified };
}

// 測驗的題數（介面顯示進度用）
export const answeredCount = (s: PlacementState) => s.probed + s.confirm.speaking.total + s.confirm.writing.total;

// 口說題改用拼寫（或麥克風失敗）：這題不算分，記成「口說未驗證」，不用拼字補口說分數
export function skipSpeaking(s: PlacementState, now = Date.now()): PlacementState {
  // 這一題和之後的口說題都跳過
  const next = { ...s, queue: s.queue.filter(q => q.type !== 'voice'), speakingVerified: false };
  return s.phase === 'confirm' && (next.queue.length === 0 || now - s.startedAt >= TIME_LIMIT_MS) ? finish(next) : next;
}

// 重測：完整測驗每 7 天免費一次
export const RETEST_DAYS = 7;
export const retestWaitMs = (lastAt: number | undefined, now = Date.now()) =>
  (lastAt ? Math.max(0, lastAt + RETEST_DAYS * 86_400_000 - now) : 0);

// 7 天回顧檢查規格（docs/STAGE_PLAN.md 第 17 節 / TASKS T11）：
// 跳級驗證後第 7 天進行 12 題回顧檢查（聽、讀、說、寫各 3 題）
// 總分 >= 9 且每項技能 >= 2 題算通過。
// 若未通過，不降級、不收回等級，推薦弱項練習，24 小時後可再驗證。
export const REVIEW_DAYS = 7;
export const REVIEW_RETRY_HOURS = 24;
export const REVIEW_TOTAL_QUESTIONS = 12;
export const REVIEW_PER_SKILL = 3;
export const REVIEW_PASS_TOTAL = 9;
export const REVIEW_PASS_PER_SKILL = 2;

export interface SkillScore { correct: number; total: number }
export type ReviewSkill = 'reading' | 'listening' | 'speaking' | 'writing';

export interface PlacementReviewState {
  level: number;
  queue: Question[];
  currentIdx: number;
  scores: Record<ReviewSkill, SkillScore>;
  speakingVerified: boolean;
  done: boolean;
  passed: boolean;
  weak: ReviewSkill[];
}

export function isPlacementReviewDue(
  placement: { level?: number; region?: number; verified?: boolean; at: number; verifiedAt?: number; lastReviewAt?: number; reviewPassed?: boolean } | null,
  now = Date.now(),
): boolean {
  if (!placement || !placement.verified || placement.reviewPassed) return false;
  if (placement.lastReviewAt) {
    return now - placement.lastReviewAt >= REVIEW_RETRY_HOURS * 3600_000;
  }
  const baseTime = placement.verifiedAt ?? placement.at;
  return now - baseTime >= REVIEW_DAYS * 86_400_000;
}

export function startPlacementReview(
  placement: { level: number; speakingVerified?: boolean },
  opts: { voice?: boolean; rand?: () => number; pool?: Question[][] } = {},
): PlacementReviewState {
  const rand = opts.rand ?? Math.random;
  const pool = opts.pool ?? POOL;
  const level = Math.min(Math.max(0, placement.level), maxTestable(pool));
  const list = pool[level];
  const voice = opts.voice ?? placement.speakingVerified ?? true;
  const used = new Set<string>();

  const r = take(list.filter(isReading), REVIEW_PER_SKILL, used, rand);
  r.forEach(q => used.add(key(q)));
  const l = take(list.filter(isListening), REVIEW_PER_SKILL, used, rand);
  l.forEach(q => used.add(key(q)));
  const s = voice ? take(list.filter(q => q.type === 'voice'), REVIEW_PER_SKILL, used, rand) : [];
  s.forEach(q => used.add(key(q)));
  const w = take(list.filter(q => q.type === 'spell' || q.type === 'fill'), REVIEW_PER_SKILL, used, rand);
  w.forEach(q => used.add(key(q)));

  // 口說未啟用或題量不足時，以寫作題補足總數
  if (s.length < REVIEW_PER_SKILL) {
    const extraW = take(list.filter(q => q.type === 'spell' || q.type === 'fill'), REVIEW_PER_SKILL - s.length, used, rand);
    extraW.forEach(q => used.add(key(q)));
    w.push(...extraW);
  }

  const queue = shuffleArray([...r, ...l, ...s, ...w], rand);

  return {
    level,
    queue,
    currentIdx: 0,
    scores: {
      reading: { correct: 0, total: 0 },
      listening: { correct: 0, total: 0 },
      speaking: { correct: 0, total: 0 },
      writing: { correct: 0, total: 0 },
    },
    speakingVerified: voice && s.length > 0,
    done: queue.length === 0,
    passed: false,
    weak: [],
  };
}

export function currentReviewQuestion(state: PlacementReviewState): Question | null {
  return state.queue[state.currentIdx] ?? null;
}

export function answerPlacementReview(
  state: PlacementReviewState,
  correct: boolean,
): PlacementReviewState {
  if (state.done || state.currentIdx >= state.queue.length) return state;
  const q = state.queue[state.currentIdx];
  const skill: ReviewSkill = q.type === 'voice'
    ? 'speaking'
    : q.type === 'spell' || q.type === 'fill'
      ? 'writing'
      : isListening(q)
        ? 'listening'
        : 'reading';

  const prevScore = state.scores[skill];
  const scores = {
    ...state.scores,
    [skill]: { correct: prevScore.correct + (correct ? 1 : 0), total: prevScore.total + 1 },
  };

  const nextIdx = state.currentIdx + 1;
  const done = nextIdx >= state.queue.length;

  if (!done) {
    return { ...state, currentIdx: nextIdx, scores };
  }

  const totalCorrect = Object.values(scores).reduce((acc, s) => acc + s.correct, 0);
  const weak: ReviewSkill[] = (Object.entries(scores) as [ReviewSkill, SkillScore][])
    .filter(([, s]) => s.total > 0 && s.correct < REVIEW_PASS_PER_SKILL)
    .map(([sk]) => sk);

  const passed = totalCorrect >= REVIEW_PASS_TOTAL && weak.length === 0;

  return {
    ...state,
    currentIdx: nextIdx,
    scores,
    done: true,
    passed,
    weak,
  };
}
