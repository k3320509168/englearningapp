import type { Question, QuestionSkill } from './types';
import { LEVELS, QUESTION_POOL, questionDifficulty, questionSkill } from './QuestionData';
import { questionKey, shuffleArray } from './battle';
import { GRAMMAR_STABLE_RATIO, GRAMMAR_TAGS, MIN_GRAMMAR_ITEMS, primaryGrammar } from './grammar';

// 知識點追蹤（和 ChatGPT 第四輪定案，見 docs/STAGE_PLAN.md 第 5、6 節）：
// 記錄的是「知識點」在哪幾天無提示答對，不是某一題答對幾次。
// apple 的聽力題今天答對、明天拼寫題答對、後天口說題答對，三次都算同一個知識點的跨日成功。
// - 已學：至少一次無提示答對。
// - 跨日穩定：三次無提示答對，每次間隔至少 20 小時（同一天答對 10 次也只算一次）。
// 看完正確答案後的重答不算；答錯不扣掉已有的紀錄，只是讓它早點再出現。

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
export const STABLE_GAP = 20 * HOUR;
export const STABLE_WINS = 3;
// 第 1 次答對後隔天（Day 1）、第 2 次後再 2 天（Day 3）、第 3 次後再 4 天（Day 7）；穩定之後 14 天巡一次
const REVIEW_AFTER = [0, STABLE_GAP, 2 * DAY, 4 * DAY, 14 * DAY];
const MAX_WINS = 5;

export interface KnowledgeRecord {
  wins: number[]; // 算數的成功時間（彼此間隔 ≥ 20 小時）
  dueAt: number;  // 下一次該複習的時間
  items?: string[]; // 文法：每次成功是哪一題（穩定要至少 2 道不同的題）
}

// 知識點（第八輪）：
// - w:單字——拼寫、口說、填空、聽單字都算同一個字（列入封印）。
// - g:文法——已審核的文法題依主要考點（例如 g:be_verb，列入封印）。
// - q:其他——句子、對話、短文題每題各自記錄，但不列入封印（不然 100 道句子題就變成 100 個知識點）。
const WORD = /^[A-Za-z][A-Za-z' -]*$/;
export function knowledgeKey(q: Question): string {
  const grammar = primaryGrammar(q);
  if (grammar) return `g:${grammar}`;
  const speak = q.speak?.trim();
  if (q.knowledgeType === 'discourse') return `q:${questionKey(q)}`;
  if (q.knowledgeType === 'lexical') {
    const target = speak || q.ans;
    return `w:${target.toLowerCase().replace(/\s+/g, ' ').trim()}`;
  }
  const word = speak && WORD.test(speak) && speak.split(/\s+/).length <= 3 ? speak
    : (q.type === 'spell' || q.type === 'voice') ? q.ans : null;
  return word ? `w:${word.toLowerCase().replace(/\s+/g, ' ')}` : `q:${questionKey(q)}`;
}

export const isLearned = (r?: KnowledgeRecord) => !!r && r.wins.length > 0;
// 文法要至少 2 道不同的題（避免只背熟同一題）
export const isStable = (r?: KnowledgeRecord) => !!r && r.wins.length >= STABLE_WINS && (!r.items || new Set(r.items).size >= 2);

// 作答後更新知識點；回傳 null 表示沒有變化。crossDay：這次是「跨日成功」（第 2 次以後算數的答對），給封印能量
// item：文法題傳入這一題的 key，記錄成功來自哪些題
export function updateKnowledge(prev: KnowledgeRecord | undefined, correct: boolean, counted: boolean, now: number, item?: string): { rec: KnowledgeRecord; crossDay: boolean } | null {
  const wins = prev?.wins ?? [];
  const last = wins[wins.length - 1];
  if (!correct) {
    if (!prev || !wins.length) return null;
    // 答錯：等可以再算數的時候（離上次成功 20 小時）就排進複習
    return { rec: { ...prev, dueAt: Math.min(prev.dueAt, last + STABLE_GAP) }, crossDay: false };
  }
  // 文法：今天已經算過一次，但換了一道沒成功過的題，也記下來（之後才湊得到 2 道不同的題）
  if (item && prev && last !== undefined && now - last < STABLE_GAP && counted && !(prev.items ?? []).includes(item)) {
    return { rec: { ...prev, items: [...(prev.items ?? []), item].slice(-MAX_WINS) }, crossDay: false };
  }
  if (!counted || (last !== undefined && now - last < STABLE_GAP)) return null;
  const next = [...wins, now].slice(-MAX_WINS);
  const items = item ? [...(prev?.items ?? []), item].slice(-MAX_WINS) : prev?.items;
  return { rec: { wins: next, dueAt: now + REVIEW_AFTER[Math.min(next.length, REVIEW_AFTER.length - 1)], ...(items ? { items } : {}) }, crossDay: next.length >= 2 };
}

// 到期的知識點：越不熟（成功次數越少）越先，一樣熟的看誰先到期
export function dueKnowledge(knowledge: Record<string, KnowledgeRecord>, now: number, limit = 40): string[] {
  return Object.entries(knowledge)
    .filter(([, r]) => r.wins.length > 0 && r.dueAt <= now)
    .sort(([, a], [, b]) => a.wins.length - b.wins.length || a.dueAt - b.dueAt)
    .slice(0, limit)
    .map(([k]) => k);
}

// 一個區域題庫裡的知識點與題目（只看這區自己的題庫；題庫還沒出的區域是空的）
const indexCache = new Map<number, { size: number; index: Map<string, Question[]> }>();
export function regionIndex(levelIdx: number): Map<string, Question[]> {
  const pool = QUESTION_POOL[LEVELS[levelIdx]];
  const all = pool ? [...pool.normal, ...pool.boss] : [];
  const cached = indexCache.get(levelIdx);
  if (cached && cached.size === all.length) return cached.index;
  const index = new Map<string, Question[]>();
  for (const q of all) {
    const k = knowledgeKey(q);
    const list = index.get(k);
    if (list) list.push(q); else index.set(k, [q]);
  }
  indexCache.set(levelIdx, { size: all.length, index });
  return index;
}

// ---------- 守門人封印 ----------
// 單字：A1 已學 360、跨日穩定 300（約 400 個單字的 90%／75%）；之後每區多 40 個已學。題庫比較小時改用題庫的 90%／75%
export function sealTargets(levelIdx: number, poolSize: number) {
  const learn = Math.min(Math.round(poolSize * 0.9), 360 + 40 * levelIdx);
  return { learn, stable: Math.round(learn * 5 / 6) };
}

// 文法：這一區的核心標籤裡，題目夠多（≥ 6 題）的才列入；全部已學、至少 80% 穩定
export interface GrammarProgress { id: string; items: number; learned: boolean; stable: boolean; counted: boolean }

export function regionGrammar(levelIdx: number, knowledge: Record<string, KnowledgeRecord>): GrammarProgress[] {
  const index = regionIndex(levelIdx);
  return (GRAMMAR_TAGS[levelIdx] ?? []).filter(t => t.core).map(t => {
    const r = knowledge[`g:${t.id}`];
    const items = index.get(`g:${t.id}`)?.length ?? 0;
    return { id: t.id, items, learned: isLearned(r), stable: isStable(r), counted: items >= MIN_GRAMMAR_ITEMS };
  });
}

export interface RegionMastery {
  pool: number;          // 這區的單字數
  learned: number;
  stable: number;
  due: number;           // 到期該複習的（單字＋文法）
  learnTarget: number;
  stableTarget: number;
  grammar: GrammarProgress[];
  grammarLearned: number;
  grammarStable: number;
  grammarTotal: number;      // 列入封印的核心文法數
  grammarStableTarget: number;
  sealMet: boolean;
}

export function regionMastery(levelIdx: number, knowledge: Record<string, KnowledgeRecord>, now: number): RegionMastery {
  const index = regionIndex(levelIdx);
  let pool = 0, learned = 0, stable = 0, due = 0;
  for (const k of index.keys()) {
    const r = knowledge[k];
    if (k.startsWith('g:') && isLearned(r) && !isStable(r) && r.dueAt <= now) due++;
    if (!k.startsWith('w:')) continue;
    pool++;
    if (!isLearned(r)) continue;
    learned++;
    if (isStable(r)) stable++;
    else if (r.dueAt <= now) due++;
  }
  const { learn, stable: stableTarget } = sealTargets(levelIdx, pool);
  const grammar = regionGrammar(levelIdx, knowledge);
  const counted = grammar.filter(g => g.counted);
  const grammarLearned = counted.filter(g => g.learned).length;
  const grammarStable = counted.filter(g => g.stable).length;
  const grammarStableTarget = Math.ceil(counted.length * GRAMMAR_STABLE_RATIO);
  return {
    pool, learned, stable, due, learnTarget: learn, stableTarget,
    grammar, grammarLearned, grammarStable, grammarTotal: counted.length, grammarStableTarget,
    sealMet: learned >= learn && stable >= stableTarget && grammarLearned >= counted.length && grammarStable >= grammarStableTarget,
  };
}

// 這個區域要不要守門人封印：最後一區（王城）有主線結局；題庫還沒出的區域先不擋
export const needsSeal = (levelIdx: number) => levelIdx < LEVELS.length - 1 && regionIndex(levelIdx).size > 0;

// ---------- 區域試煉 ----------
// 普通試煉：24 題，聽讀說寫各 6 題；封印完成後開啟，總分 ≥ 18 且每項 ≥ 4。
// 高標準試煉（正式版）：40 題，聽讀說寫各 10 題；封印未完成硬闖或跳級，總分 ≥ 36 且每項 ≥ 8。
// 每種能力由難度 1、2、3 輪流抽取，同段內沒看過的優先，同知識點不重複。
export const TRIAL_SKILLS: QuestionSkill[] = ['listening', 'reading', 'speaking', 'writing'];
export const TRIAL_PER_SKILL = 6;
export const TRIAL_STRICT_PER_SKILL = 10;
export const TRIAL_PASS = { total: 18, each: 4, perSkill: TRIAL_PER_SKILL };
export const TRIAL_STRICT = { total: 36, each: 8, perSkill: TRIAL_STRICT_PER_SKILL };
// 高標準試煉每區 24 小時內最多 2 次：要測真正的能力，不能一直重刷到運氣好（第七輪）
export const STRICT_TRIALS_PER_DAY = 2;
export function strictTrialWait(tries: number[] | undefined, now: number): number {
  const recent = (tries ?? []).filter(t => now - t < DAY);
  return recent.length < STRICT_TRIALS_PER_DAY ? 0 : Math.min(...recent) + DAY - now;
}

export function trialQuestions(
  levelIdx: number,
  seen: (q: Question) => boolean,
  rand: () => number = Math.random,
  strict = false,
): Question[] {
  const index = regionIndex(levelIdx);
  const all = [...index.values()].flat();
  const out: Question[] = [];
  const perSkill = strict ? TRIAL_STRICT.perSkill : TRIAL_PASS.perSkill;
  for (const skill of TRIAL_SKILLS) {
    const list = all.filter(q => questionSkill(q) === skill);
    // 輪流從難度 1、2、3 各拿一題，沒看過的排前面（同一組裡隨機）
    const tiers = ([1, 2, 3] as const).map(d => shuffleArray(list.filter(q => questionDifficulty(q) === d), rand).sort((a, b) => Number(seen(a)) - Number(seen(b))));
    const used = new Set<string>();
    let picked = 0;
    while (picked < perSkill && tiers.some(t => t.length)) {
      for (const tier of tiers) {
        if (picked >= perSkill) break;
        while (tier.length) {
          const q = tier.shift()!;
          const k = knowledgeKey(q);
          if (used.has(k)) continue;
          used.add(k);
          out.push(q);
          picked++;
          break;
        }
      }
    }
  }
  return shuffleArray(out, rand);
}

export type TrialScore = Record<QuestionSkill, { correct: number; total: number }>;
export const emptyTrialScore = (): TrialScore =>
  Object.fromEntries(TRIAL_SKILLS.map(s => [s, { correct: 0, total: 0 }])) as TrialScore;

// 抽題不足時不可把缺少的能力視為已測完，也不以降低門檻替代完整測驗。
export function completeTrial(questions: Question[], strict = false): boolean {
  const perSkill = strict ? TRIAL_STRICT.perSkill : TRIAL_PASS.perSkill;
  return questions.length === TRIAL_SKILLS.length * perSkill
    && TRIAL_SKILLS.every(skill => {
      const group = questions.filter(q => questionSkill(q) === skill);
      return group.length === perSkill
        && new Set(group.map(knowledgeKey)).size === perSkill;
    });
}

export function trialPassed(score: TrialScore, strict: boolean): boolean {
  const rule = strict ? TRIAL_STRICT : TRIAL_PASS;
  if (!TRIAL_SKILLS.every(skill => {
    const item = score[skill];
    return item && item.total === rule.perSkill
      && Number.isInteger(item.correct) && item.correct >= 0 && item.correct <= item.total;
  })) return false;
  return TRIAL_SKILLS.reduce((sum, skill) => sum + score[skill].correct, 0) >= rule.total
    && TRIAL_SKILLS.every(skill => score[skill].correct >= rule.each);
}
