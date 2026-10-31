import type { Question } from './types';

// 文法標籤（第八輪 ChatGPT 定案，見 docs/STAGE_PLAN.md 第 10 節）。
// 題目的 grammar：第一個是主要考點、後面最多 2 個次要；只有 grammarReview 是 approved 的題目才推進文法進度。
// 標籤由 scripts/tag-grammar.ts 依規則自動產生（pending），人工確認後改成 approved。

export interface GrammarTagDef { id: string; name: string; core: boolean }

const t = (id: string, name: string, core = true): GrammarTagDef => ({ id, name, core });

// 依區域（A1、A2）；之後的區域等題庫出來再補
export const GRAMMAR_TAGS: GrammarTagDef[][] = [
  [
    t('be_verb', 'be 動詞（am／is／are）'),
    t('subject_pronouns', '主詞代名詞（I／he／they）'),
    t('possessive_adjectives', '所有格（my／his／her）'),
    t('articles_a_an', '冠詞 a／an'),
    t('present_simple', '一般現在式'),
    t('present_simple_3s', '第三人稱單數 -s'),
    t('present_simple_negation', "否定 don't／doesn't"),
    t('there_is_are', 'there is／there are'),
    t('can_cannot', "can／can't"),
    t('basic_questions', '疑問詞（what／where／how many）'),
    t('demonstratives', '指示詞（this／these）', false),
    t('basic_prepositions', '介系詞（in／on／at）', false),
    t('plural_nouns', '單複數名詞', false),
    t('basic_conjunctions', '連接詞（and／but／so）', false),
  ],
  [
    t('past_simple_regular', '規則過去式'),
    t('past_simple_irregular', '不規則過去式'),
    t('past_simple_questions', "did／didn't"),
    t('present_continuous', '現在進行式'),
    t('future_going_to', 'be going to'),
    t('comparatives', '比較級'),
    t('superlatives', '最高級'),
    t('countable_uncountable', 'much／many／some／any'),
    t('modals_obligation', 'must／have to／should'),
    t('frequency_adverbs', '頻率副詞'),
    t('past_be', 'was／were', false),
    t('time_prepositions', 'before／after／during', false),
    t('infinitives_gerunds', 'want to／like doing', false),
    t('because_when_if', 'because／when／if', false),
  ],
];

export const grammarTagDef = (id: string) => GRAMMAR_TAGS.flat().find(d => d.id === id);
export const grammarName = (id: string) => grammarTagDef(id)?.name ?? id;

// 這題算不算文法題（主要考點，已審核）
export const primaryGrammar = (q: Question): string | null =>
  q.grammarReview === 'approved' && q.grammar?.length ? q.grammar[0] : null;

// 每個標籤至少要有幾題，才列入封印（不足的標籤是題庫缺口）
export const MIN_GRAMMAR_ITEMS = 6;
// 封印：核心文法全部已學、至少 80% 穩定（10 個核心 → 8 個）
export const GRAMMAR_STABLE_RATIO = 0.8;

// ---------- 自動標籤規則 ----------
// 看正確選項（和題目句子、解說）判斷考點。只標選擇題的文法／介系詞／對話題；短文理解與字彙題不標
const words = (s: string) => s.toLowerCase().replace(/[^a-z' ]/g, ' ').split(/\s+/).filter(Boolean);
const optionText = (o: string) => o.replace(/^[A-D]\.\s*/, '').trim();

const PREPOSITIONS = ['in', 'on', 'at', 'under', 'next', 'behind', 'between', 'near', 'from', 'to', 'by', 'for', 'with', 'into', 'above', 'below', 'across', 'in front of'];

export function autoGrammarTags(q: Question): string[] {
  if (q.type !== 'choice' || !q.options) return [];
  const label = q.desc.match(/^【([^】]+)】/)?.[1] ?? '';
  if (!/文法|介系詞|對話/.test(label)) return [];
  const correct = optionText(q.options['ABCD'.indexOf(q.ans)] ?? '');
  const c = correct.toLowerCase();
  const w = words(c);
  const sentence = q.desc.replace(/^【[^】]+】/, '');
  const s = sentence.toLowerCase();
  const explain = q.explain ?? '';
  const others = q.options.map(optionText).map(o => o.toLowerCase()).filter(o => o !== c);
  const tags: string[] = [];
  const add = (id: string) => { if (!tags.includes(id)) tags.push(id); };

  if (/介系詞/.test(label) || (w.length <= 3 && PREPOSITIONS.includes(w[0]) && !/^to [a-z]+$/.test(c))) add('basic_prepositions');
  if (/^there (is|are)\b|^(is|are) there\b|^there$/.test(c) || (/\bthere ___/.test(s) && /^(is|are)$/.test(c))) add('there_is_are');
  if (/\b(can|cannot|can't)\b/.test(c) || /\b(can|cannot|can't) ___/.test(s)) add('can_cannot');
  if (/\b(don't|doesn't|do not|does not)\b/.test(c)) add('present_simple_negation');
  if (/^(am|is|are|isn't|aren't)$/.test(c)) add('be_verb');
  if (/^(my|your|his|her|its|our|their)$/.test(c)) add('possessive_adjectives');
  if (/^(i|you|he|she|it|we|they)$/.test(c)) add('subject_pronouns');
  if (/^(this|that|these|those)$/.test(c)) add('demonstratives');
  if (/^(a|an)$/.test(c)) add('articles_a_an');
  if (/^(what|where|who|when|how|why|which|whose)\b/.test(c)) add('basic_questions');
  if (/^(and|but|so|or|because)$/.test(c)) add('basic_conjunctions');
  // 第三人稱單數：正確答案是加 s 的動詞，選項裡有原形
  const base = (v: string) => v.replace(/ies$/, 'y').replace(/(ch|sh|ss|x|o)es$/, '$1').replace(/s$/, '');
  if (w.length === 1 && /s$/.test(c) && others.some(o => o === base(c) || o === c.replace(/es$/, ''))) add('present_simple_3s');
  else if (w.length === 1 && others.some(o => o === `${c}s` || o === `${c}es` || o === c.replace(/y$/, 'ies')) && /複數|原形|I |you|we|they/i.test(explain + sentence)) add('present_simple');
  if (/^(do|does)$/.test(c)) add('present_simple');
  if (/^has$/.test(c) && others.includes('have')) add('present_simple_3s');
  if (/^have$/.test(c) && others.includes('has')) add('present_simple');
  if (/複數名詞|名詞複數/.test(explain) && tags.length === 0) add('plural_nouns');
  return tags.slice(0, 3);
}
