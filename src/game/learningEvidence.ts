import type { Question, QuestionSkill } from './types';

// 本機診斷 sidecar，尚未納入遊戲備份／雲端。只記固定答案作答證據，
// 不存錄音、辨識逐字稿、玩家輸入或姓名；不推算自由產出或 CEFR 程度。
export const LEARNING_EVIDENCE_KEY = 'english-rpg-learning-evidence';
export const MAX_LEARNING_EVIDENCE = 300;
export interface LearningEvidence {
  attemptId: string;
  runId: string; // 一次 QuizRunner 流程，不能當作玩家身份
  itemId: string;
  at: number;
  task: 'fixed-answer';
  skill: QuestionSkill; // 題庫分類，並非對應能力已獲驗證
  mode: 'choice' | 'typed' | 'speech' | 'skipped';
  outcome: 'correct' | 'incorrect' | 'unverified';
  source: 'quiz' | 'review' | 'blind';
  voiceFallback: boolean;
  modelAudioRequested: boolean;
  listeningPlaysRequested: number;
  slowAudioRequested: boolean;
  context: 'unknown'; // 舊題沒有經審查的情境家族，不把換選項誤認成遷移
}
export interface EvidenceSnapshot { version: 1; entries: LearningEvidence[] }
export function newEvidenceRunId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
// 僅用來關聯同一道題；不是匿名化保證或安全用途的 hash。
export function evidenceItemId(q: Question): string {
  const text = `${q.type}|${q.desc}|${q.speak ?? ''}`;
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) hash = Math.imul(hash ^ text.charCodeAt(i), 16777619);
  return `item-${(hash >>> 0).toString(16)}`;
}
function validEntry(e: unknown): e is LearningEvidence {
  if (!e || typeof e !== 'object') return false;
  const v = e as LearningEvidence;
  return [v.attemptId, v.runId, v.itemId].every(s => typeof s === 'string' && s.length > 0 && s.length <= 150)
    && Number.isFinite(v.at) && v.at >= 0 && v.task === 'fixed-answer'
    && ['listening', 'reading', 'speaking', 'writing'].includes(v.skill)
    && ['choice', 'typed', 'speech', 'skipped'].includes(v.mode)
    && ['correct', 'incorrect', 'unverified'].includes(v.outcome)
    && (v.mode !== 'skipped' || v.outcome === 'unverified')
    && ['quiz', 'review', 'blind'].includes(v.source)
    && typeof v.voiceFallback === 'boolean' && typeof v.modelAudioRequested === 'boolean'
    && Number.isInteger(v.listeningPlaysRequested) && v.listeningPlaysRequested >= 0 && v.listeningPlaysRequested <= 100
    && typeof v.slowAudioRequested === 'boolean' && v.context === 'unknown';
}
function canonicalEntry(e: LearningEvidence): LearningEvidence {
  // 忽略未知額外欄位，避免把逐字稿／輸入等意外寫入sidecar。
  const { attemptId, runId, itemId, at, task, skill, mode, outcome, source, voiceFallback,
    modelAudioRequested, listeningPlaysRequested, slowAudioRequested, context } = e;
  return { attemptId, runId, itemId, at, task, skill, mode, outcome, source, voiceFallback,
    modelAudioRequested, listeningPlaysRequested, slowAudioRequested, context };
}
export function readLearningEvidence(): EvidenceSnapshot {
  try {
    const value = JSON.parse(localStorage.getItem(LEARNING_EVIDENCE_KEY) ?? 'null');
    // 舊／未知格式不猜測遷移，既有遊戲成績亦不補造本機作答證據。
    if (value?.version !== 1 || !Array.isArray(value.entries)) return { version: 1, entries: [] };
    return { version: 1, entries: value.entries.filter(validEntry).slice(-MAX_LEARNING_EVIDENCE).map(canonicalEntry) };
  } catch { return { version: 1, entries: [] }; }
}
export function recordLearningEvidence(entry: LearningEvidence): boolean {
  if (!validEntry(entry)) return false;
  try {
    const previous = readLearningEvidence();
    if (previous.entries.some(e => e.attemptId === entry.attemptId)) return false;
    localStorage.setItem(LEARNING_EVIDENCE_KEY, JSON.stringify({ version: 1, entries: [...previous.entries, canonicalEntry(entry)].slice(-MAX_LEARNING_EVIDENCE) }));
    return true;
  } catch { return false; } // 空間不足／停用儲存不能阻止遊戲作答
}
export function clearLearningEvidence(): void {
  try { localStorage.removeItem(LEARNING_EVIDENCE_KEY); } catch { /* 不影響主存檔 */ }
}
