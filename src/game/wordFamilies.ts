// 常用英語詞族（Word Families）資料庫與進化檢測
// 用於實作「詞族升級」：玩家學過根詞後，在較高階或衍生詞作答對時，
// 觸發「🌟 詞族進化！」微特效，提升學習成就感與爽度。

import type { Question } from './types';

export interface WordFamily {
  root: string;
  meaning: string;
  derivatives: string[];
}

export interface WordEvolutionResult {
  root: string;
  evolved: string;
  meaning: string;
}

export const WORD_FAMILIES: Record<string, WordFamily> = {
  act: { root: 'act', meaning: '行動；扮演', derivatives: ['action', 'active', 'actively', 'activity', 'actor', 'react', 'reaction'] },
  agree: { root: 'agree', meaning: '同意', derivatives: ['agreement', 'disagree', 'disagreement'] },
  apply: { root: 'apply', meaning: '申請；應用', derivatives: ['application', 'applicant', 'applicable'] },
  beauty: { root: 'beauty', meaning: '美麗', derivatives: ['beautiful', 'beautifully'] },
  believe: { root: 'believe', meaning: '相信', derivatives: ['belief', 'believable', 'unbelievable'] },
  care: { root: 'care', meaning: '關心；小心', derivatives: ['careful', 'carefully', 'careless', 'carelessness'] },
  clear: { root: 'clear', meaning: '清楚', derivatives: ['clearly', 'clarify', 'clarity'] },
  comfort: { root: 'comfort', meaning: '舒適', derivatives: ['comfortable', 'uncomfortable', 'comfortably'] },
  compete: { root: 'compete', meaning: '競爭', derivatives: ['competition', 'competitive', 'competitor'] },
  create: { root: 'create', meaning: '創造', derivatives: ['creative', 'creatively', 'creation', 'creativity', 'creator'] },
  danger: { root: 'danger', meaning: '危險', derivatives: ['dangerous', 'dangerously'] },
  decide: { root: 'decide', meaning: '決定', derivatives: ['decision', 'decisive', 'indecisive', 'decisively'] },
  depend: { root: 'depend', meaning: '依賴', derivatives: ['dependent', 'independent', 'independence', 'dependence'] },
  differ: { root: 'differ', meaning: '不同', derivatives: ['different', 'difference', 'differently'] },
  direct: { root: 'direct', meaning: '指導；直接', derivatives: ['direction', 'director', 'directly'] },
  educate: { root: 'educate', meaning: '教育', derivatives: ['education', 'educational', 'educator'] },
  employ: { root: 'employ', meaning: '雇用', derivatives: ['employment', 'unemployment', 'employee', 'employer'] },
  enjoy: { root: 'enjoy', meaning: '享受', derivatives: ['enjoyable', 'enjoyment'] },
  excite: { root: 'excite', meaning: '興奮', derivatives: ['excitement', 'exciting', 'excited'] },
  fail: { root: 'fail', meaning: '失敗', derivatives: ['failure'] },
  friend: { root: 'friend', meaning: '朋友', derivatives: ['friendly', 'friendship'] },
  grow: { root: 'grow', meaning: '成長', derivatives: ['growth'] },
  happy: { root: 'happy', meaning: '快樂', derivatives: ['happiness', 'happily', 'unhappy'] },
  harm: { root: 'harm', meaning: '傷害', derivatives: ['harmful', 'harmless'] },
  help: { root: 'help', meaning: '幫助', derivatives: ['helpful', 'helpless'] },
  hope: { root: 'hope', meaning: '希望', derivatives: ['hopeful', 'hopeless'] },
  imagine: { root: 'imagine', meaning: '想像', derivatives: ['imagination', 'imaginative', 'imaginary'] },
  inform: { root: 'inform', meaning: '通知', derivatives: ['information', 'informative'] },
  inspire: { root: 'inspire', meaning: '啟發', derivatives: ['inspiration', 'inspiring', 'inspirational'] },
  invent: { root: 'invent', meaning: '發明', derivatives: ['invention', 'inventor'] },
  lead: { root: 'lead', meaning: '引領', derivatives: ['leader', 'leadership'] },
  locate: { root: 'locate', meaning: '定位', derivatives: ['location'] },
  manage: { root: 'manage', meaning: '管理', derivatives: ['manager', 'management'] },
  motivate: { root: 'motivate', meaning: '激勵', derivatives: ['motivation', 'motivational'] },
  move: { root: 'move', meaning: '移動', derivatives: ['movement'] },
  nation: { root: 'nation', meaning: '國家', derivatives: ['national', 'international', 'nationality'] },
  operate: { root: 'operate', meaning: '操作；營運', derivatives: ['operation', 'operator'] },
  organize: { root: 'organize', meaning: '組織', derivatives: ['organization', 'organizer'] },
  pain: { root: 'pain', meaning: '痛苦', derivatives: ['painful', 'painless'] },
  patient: { root: 'patient', meaning: '耐心', derivatives: ['patience', 'impatient'] },
  peace: { root: 'peace', meaning: '和平', derivatives: ['peaceful', 'peacefully'] },
  perform: { root: 'perform', meaning: '表演；執行', derivatives: ['performance', 'performer'] },
  pollute: { root: 'pollute', meaning: '污染', derivatives: ['pollution', 'pollutant'] },
  power: { root: 'power', meaning: '力量', derivatives: ['powerful', 'powerfully', 'powerless'] },
  protect: { root: 'protect', meaning: '保護', derivatives: ['protection', 'protective', 'protector'] },
  real: { root: 'real', meaning: '真實', derivatives: ['reality', 'realize', 'really'] },
  safe: { root: 'safe', meaning: '安全', derivatives: ['safety', 'safely'] },
  satisfy: { root: 'satisfy', meaning: '滿意', derivatives: ['satisfaction', 'satisfactory', 'dissatisfied'] },
  science: { root: 'science', meaning: '科學', derivatives: ['scientific', 'scientist'] },
  succeed: { root: 'succeed', meaning: '成功', derivatives: ['success', 'successful', 'successfully'] },
  suggest: { root: 'suggest', meaning: '建議', derivatives: ['suggestion'] },
  taste: { root: 'taste', meaning: '品味；味道', derivatives: ['tasty', 'tasteful'] },
  use: { root: 'use', meaning: '使用', derivatives: ['useful', 'useless', 'user'] },
  value: { root: 'value', meaning: '價值', derivatives: ['valuable', 'invaluable'] },
};

// 建立衍生詞反查表：derivative -> root
const DERIVATIVE_TO_ROOT: Map<string, { root: string; meaning: string }> = new Map();
for (const [root, fam] of Object.entries(WORD_FAMILIES)) {
  for (const d of fam.derivatives) {
    DERIVATIVE_TO_ROOT.set(d.toLowerCase(), { root, meaning: fam.meaning });
  }
}

/**
 * 從題目資訊檢測是否觸發詞族進化
 * 當玩家答對的單字屬於某個已知詞族的衍生詞時，回傳進化訊息
 */
export function detectWordEvolution(q: Question): WordEvolutionResult | null {
  if (!q) return null;

  // 1. 檢查 ans（填空題、拼寫題、選擇題目標）
  const ansWord = q.ans.trim().toLowerCase().replace(/[^a-z]/g, '');
  if (ansWord && DERIVATIVE_TO_ROOT.has(ansWord)) {
    const match = DERIVATIVE_TO_ROOT.get(ansWord)!;
    return { root: match.root, evolved: ansWord, meaning: match.meaning };
  }

  // 2. 檢查 speak（口說題、聽力題目標單字）
  if (q.speak) {
    const speakWord = q.speak.trim().toLowerCase().replace(/[^a-z]/g, '');
    if (speakWord && DERIVATIVE_TO_ROOT.has(speakWord)) {
      const match = DERIVATIVE_TO_ROOT.get(speakWord)!;
      return { root: match.root, evolved: speakWord, meaning: match.meaning };
    }
  }

  return null;
}
