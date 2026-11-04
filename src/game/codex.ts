import { getPool, LEVELS } from './QuestionData';
import { vocabFor, vocabKey, vocabByKey, getRegionVocab } from './vocab';
import { completedSentence, questionAudio, questionKey } from './battle';
import { masteryStars } from './progression';
import type { Question } from './types';

// 圖鑑＝冒險圖鑑：將題庫 15,000+ 題整理成「單字」、「片語」與「文法」收藏，同一個字的不同題型合併計算熟練度

export interface CodexStats {
  correct: number;
  wrong: number;
}

export interface CodexItem {
  id: string;
  kind: 'word' | 'phrase' | 'grammar';
  title: string;
  subtitle: string;
  pos: string;
  example: string;
  audio: string;
  correct: number;
  wrong: number;
  seen: boolean;
  stars: number;
  needsReview: boolean;
  vocabKey?: string;
}

function grammarTitle(q: Question): string {
  const sentence = completedSentence(q);
  if (sentence) return sentence;
  return q.options?.find(o => o.startsWith(`${q.ans}.`))?.replace(/^[A-D]\.\s*/, '') ?? q.desc;
}

function guessPos(w: string): string {
  const lower = w.toLowerCase().trim();
  if (lower.includes(' ') || lower.includes('-')) return 'phr.';
  if (['i', 'you', 'he', 'she', 'we', 'they', 'it', 'this', 'that', 'these', 'those', 'who', 'what', 'which', 'my', 'your', 'his', 'her', 'our', 'their', 'its'].includes(lower)) return 'pron.';
  if (['in', 'on', 'at', 'by', 'for', 'with', 'about', 'between', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'to', 'from', 'up', 'down', 'over', 'under'].includes(lower)) return 'prep.';
  if (['and', 'but', 'or', 'so', 'because', 'although', 'though', 'while', 'if', 'unless', 'since'].includes(lower)) return 'conj.';
  if (['can', 'could', 'may', 'might', 'must', 'shall', 'should', 'will', 'would'].includes(lower)) return 'v.aux.';
  if (lower.endsWith('tion') || lower.endsWith('ment') || lower.endsWith('ness') || lower.endsWith('ity') || lower.endsWith('ship') || lower.endsWith('ance') || lower.endsWith('ence') || lower.endsWith('ism') || lower.endsWith('ist') || lower.endsWith('er') || lower.endsWith('or')) return 'n.';
  if (lower.endsWith('able') || lower.endsWith('ible') || lower.endsWith('ous') || lower.endsWith('ive') || lower.endsWith('ful') || lower.endsWith('less') || lower.endsWith('al') || lower.endsWith('ic') || lower.endsWith('ary')) return 'adj.';
  if (lower.endsWith('ly')) return 'adv.';
  if (lower.endsWith('ize') || lower.endsWith('ise') || lower.endsWith('ate') || lower.endsWith('ify') || lower.endsWith('ed') || lower.endsWith('ing')) return 'v.';
  return 'n.';
}

export function codexItems(
  levelKey: string,
  codex: Record<string, CodexStats>,
  mistakes: Record<string, unknown>,
): CodexItem[] {
  const pool = getPool(levelKey);
  const items = new Map<string, CodexItem>();

  for (const q of [...pool.normal, ...pool.boss]) {
    let word = vocabKey(q);
    let v = vocabFor(q);

    // 1. 若選擇題正確選項直接是英文單字/片語（例如 agenda, postpone, implement）
    if (!word && q.type === 'choice' && q.options) {
      const opt = q.options.find(o => o.startsWith(`${q.ans}.`));
      if (opt) {
        const candidate = opt.replace(/^[A-D]\.\s*/, '').trim();
        const candidateClean = candidate.replace(/[^A-Za-z0-9\s-_]/g, '').trim();
        if (/^[A-Za-z\s-_]+$/.test(candidateClean) && candidateClean.length >= 2 && candidateClean.length <= 40) {
          word = candidateClean.toUpperCase();
          const entry = vocabByKey(candidateClean);
          if (entry) v = entry;
        }
      }
    }

    // 2. 若為聽力/口說理解選擇題（q.speak 包含核心英文句子或短語）
    if (!word && q.speak && /^[A-Za-z\s.,!?'"()-]+$/.test(q.speak.trim())) {
      const spk = q.speak.trim();
      const spkTokens = spk.split(/\s+/).filter(Boolean);
      // 只有單字或 2~4 詞短片語才作為 word / phrase
      if (spkTokens.length <= 4) {
        word = spk.toUpperCase();
        const entry = vocabByKey(spk);
        if (entry) v = entry;
      }
    }

    // 分類判定：
    // 若為單一純英文單字（無空格、無連字符、詞性非 phr/sent）➔ word (單字)
    // 若為 2~4 詞之片語短語 ➔ phrase (片語)
    // 超過 4 詞的長句、文法挖空、時態 ➔ grammar (文法與句型)
    const tokenCount = word ? word.trim().split(/\s+/).filter(Boolean).length : 0;
    const isSingleWord = Boolean(
      word &&
      tokenCount === 1 &&
      !word.includes('-') &&
      !v?.pos?.toLowerCase().includes('phr') &&
      !v?.pos?.includes('片語') &&
      !v?.pos?.toLowerCase().includes('sent')
    );
    const isPhrase = Boolean(
      word &&
      !isSingleWord &&
      tokenCount >= 2 &&
      tokenCount <= 4
    );
    const kind: 'word' | 'phrase' | 'grammar' = isSingleWord ? 'word' : (isPhrase ? 'phrase' : 'grammar');
    const id = word && kind !== 'grammar' ? `${kind}:${word}` : `g:${q.desc}`;
    const stats = codex[questionKey(q)];

    // 標題與釋義健全提取
    const title = v?.display || (word ? (isSingleWord ? word.toLowerCase() : word) : grammarTitle(q));
    let subtitle = v?.meaning || q.explain || q.desc || '';
    if (q.type === 'choice' && q.options && (!v?.meaning || v.meaning === title)) {
      const correctOpt = q.options.find(o => o.startsWith(`${q.ans}.`))?.replace(/^[A-D]\.\s*/, '').trim();
      if (correctOpt && /^[\u4e00-\u9fa5\s；，、]+$/.test(correctOpt)) {
        subtitle = correctOpt;
      }
    }

    const item = items.get(id) ?? {
      id,
      kind,
      title,
      subtitle,
      pos: v?.pos ?? (kind === 'phrase' ? 'phr.' : kind === 'grammar' ? 'grammar' : guessPos(title)),
      example: v ? `${v.example}\n${v.exampleZh}` : (q.desc && q.desc !== grammarTitle(q) ? `${completedSentence(q) || q.speak || ''}\n${q.desc}` : (completedSentence(q) || '')),
      audio: v?.display ?? questionAudio(q) ?? title,
      correct: 0,
      wrong: 0,
      seen: false,
      stars: 0,
      needsReview: false,
      vocabKey: v?.key ?? (word || undefined),
    };

    item.correct += stats?.correct ?? 0;
    item.wrong += stats?.wrong ?? 0;
    item.seen ||= stats !== undefined;
    item.needsReview ||= questionKey(q) in mistakes;
    item.stars = masteryStars(item.correct);
    items.set(id, item);
  }

  // 注入該分區的完整 CEFR 詞庫：確保冒險圖鑑完整收錄該區域的所有考綱詞彙
  const regionIdx = LEVELS.indexOf(levelKey);
  if (regionIdx >= 0) {
    const regionVocab = getRegionVocab(regionIdx);
    if (regionVocab) {
      for (const [key, v] of Object.entries(regionVocab)) {
        const upper = key.toUpperCase();
        const tokenCount = upper.trim().split(/\s+/).filter(Boolean).length;
        if (tokenCount > 4) continue; // 排除任何歷史遺留長句
        const isSingleWord = tokenCount === 1 && !upper.includes('-') && !v.pos?.toLowerCase().includes('phr') && !v.pos?.includes('片語');
        const kind: 'word' | 'phrase' = isSingleWord ? 'word' : 'phrase';
        const id = `${kind}:${upper}`;

        if (!items.has(id)) {
          const title = v.word || (isSingleWord ? key.toLowerCase() : key);
          const spellStats = codex[`spell:${upper}`];
          const voiceStats = codex[`voice:${upper}`];
          const correct = (spellStats?.correct ?? 0) + (voiceStats?.correct ?? 0);
          const wrong = (spellStats?.wrong ?? 0) + (voiceStats?.wrong ?? 0);
          const seen = spellStats !== undefined || voiceStats !== undefined;

          const item: CodexItem = {
            id,
            kind,
            title,
            subtitle: v.meaning || '',
            pos: v.pos || (kind === 'phrase' ? 'phr.' : guessPos(title)),
            example: v.example ? `${v.example}\n${v.exampleZh || ''}` : '',
            audio: v.word || title,
            correct,
            wrong,
            seen,
            stars: masteryStars(correct),
            needsReview: (`spell:${upper}` in mistakes) || (`voice:${upper}` in mistakes),
            vocabKey: key,
          };
          items.set(id, item);
        }
      }
    }
  }

  return [...items.values()];
}
