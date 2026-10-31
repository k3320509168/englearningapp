import type { QuestionSkill } from './types';

// BOSS 機制模組 M01～M12（第八輪 ChatGPT 定案，見 docs/STAGE_PLAN.md 第 11 節）。
// 九區魔王原本的專屬技能（bossSkills.ts）保留；小 BOSS、大 BOSS、區域魔王另外掛 1～3 個模組。
// 規則：每個模組每場最多觸發 1 次；每場最多 1 個強制連答（M01）；一題答錯只結算最重的一個模組懲罰；
// BOSS 提前 0 血（終結連擊）後，還沒處理完的模組全部取消，不再觸發新的。
// M12 終結處決是所有首領共通的：終結連擊的最後一題要答對才處決（見 battleStore）。

export type ModId = 'M01' | 'M02' | 'M03' | 'M04' | 'M05' | 'M06' | 'M07' | 'M08' | 'M09' | 'M10' | 'M11';
export type ModPhase = 'idle' | 'active' | 'done' | 'over';

export interface ModDef { id: ModId; icon: string; name: string; trigger: string; counter: string }

export const MOD_DEFS: Record<ModId, ModDef> = {
  M01: { id: 'M01', icon: '🔒', name: '連答鎖', trigger: '登場', counter: '連續答對才能打破鎖（鎖住時傷害只剩 30%）' },
  M02: { id: 'M02', icon: '☠️', name: '詛咒', trigger: '第 3 題', counter: '答對 2 題指定題型就能淨化（詛咒中攻擊 −20%）' },
  M03: { id: 'M03', icon: '👥', name: '召喚軍團', trigger: '血量 70%', counter: '答對 2 題擊退援軍（答錯會被援軍追打）' },
  M04: { id: 'M04', icon: '😡', name: '狂暴', trigger: '血量 40%', counter: '接下來 4 題答對 3 題就能壓制（狂暴時出手變快）' },
  M05: { id: 'M05', icon: '🪞', name: '題型反射', trigger: '血量 60%', counter: '選一種題型，答對 1 題就把攻擊反射回去' },
  M06: { id: 'M06', icon: '⏱️', name: '限時追擊', trigger: '第 5 題', counter: '3 題內有 2 題快速答對就能打斷蓄力' },
  M07: { id: 'M07', icon: '🎯', name: '弱點揭露', trigger: '登場', counter: '答對 1 題指定考點，揭露弱點（失敗沒有懲罰）' },
  M08: { id: 'M08', icon: '🔮', name: '符文連鎖', trigger: '血量 60%', counter: '依序答對三道符文題（答錯會被符文灼傷）' },
  M09: { id: 'M09', icon: '🧛', name: '吸血', trigger: '第一次答錯', counter: '答對 3 題斬斷吸血（答錯時首領回血）' },
  M10: { id: 'M10', icon: '👻', name: '分身幻影', trigger: '血量 50%', counter: '答對 2 題聽力或閱讀，看穿真身' },
  M11: { id: 'M11', icon: '🔇', name: '技能封印', trigger: '登場', counter: '答對 3 題指定題型解封（最多封 3 題）' },
};

// 一個模組在這場戰鬥中的狀態
export interface ModState {
  id: ModId;
  phase: ModPhase;
  progress: number;      // 破解進度
  need: number;          // 破解需要的數量
  left: number;          // 限時模組剩幾題（0 = 不限）
  resets: number;        // M01：被答錯打斷幾次
  skill?: QuestionSkill; // 指定題型（M02、M05、M10、M11；M08 是目前這一道符文）
  tag?: string;          // M07：指定的文法考點
  runes?: QuestionSkill[]; // M08：三道符文的題型
  healed?: number;       // M09：已經回了多少（最大生命的比例）
}

// ---------- 分配表（依區域；1-15／1-20 依三星關卡輪替） ----------
const GATE: ModId[][] = [['M07'], ['M02'], ['M10'], ['M04'], ['M09'], ['M05', 'M07'], ['M08', 'M11'], ['M01', 'M04'], ['M05', 'M10']];
const BOSS: ModId[][] = [['M03'], ['M08'], ['M01', 'M07'], ['M06', 'M07'], ['M02', 'M08'], ['M10', 'M06'], ['M02', 'M09'], ['M09', 'M03'], ['M01', 'M11', 'M08']];
const FINAL: ModId[][] = [['M07'], ['M02'], ['M03', 'M08'], ['M10', 'M01'], ['M04', 'M03'], ['M06', 'M05'], ['M05', 'M08', 'M11'], ['M04', 'M09', 'M06'], ['M11', 'M03']];

export type ModRole = 'gate' | 'boss' | 'final';

// 這隻首領帶哪些模組。第 1 張三星關卡照表；之後的關卡從「到這一區為止出現過的模組」輪替，
// 同一張地圖的第 15、20 關不重複，每場最多一個 M01
export function modsFor(levelIdx: number, chapter: number, role: ModRole): ModId[] {
  const r = Math.min(Math.max(0, levelIdx), GATE.length - 1);
  if (role === 'final') return FINAL[r];
  const base = (role === 'gate' ? GATE : BOSS)[r];
  if (chapter === 0) return base;
  const pool = [...new Set([...GATE.slice(0, r + 1), ...BOSS.slice(0, r + 1)].flat())];
  const n = base.length;
  const start = (chapter * (n + 1) + (role === 'boss' ? n : 0)) % pool.length;
  const picked: ModId[] = [];
  for (let i = 0; picked.length < Math.min(n, pool.length) && i < pool.length; i++) {
    const id = pool[(start + i) % pool.length];
    if (id === 'M01' && picked.includes('M01')) continue;
    picked.push(id);
  }
  // 同一張地圖的小 BOSS 和大 BOSS 不要完全一樣
  if (role === 'boss' && picked.join() === modsFor(levelIdx, chapter, 'gate').join() && pool.length > n) {
    picked[picked.length - 1] = pool[(start + n) % pool.length];
  }
  return picked;
}

// 區域分級：低區 A1／A2、中區 A2+～B1+、高區 B2～C2
export const modTier = (levelIdx: number) => (levelIdx <= 1 ? 0 : levelIdx <= 4 ? 1 : 2);
export const LOCK_STREAK = [3, 4, 5];
export const LOCK_RESETS = 2;         // M01 被打斷 2 次後改成累計答對 3 題
export const LOCK_DAMAGE = 0.3;
export const CURSE_DAMAGE = 0.8;
export const BERSERK_GAUGE = 1.3;
export const VAMPIRE_STEP = 0.03;
export const VAMPIRE_CAP = 0.12;
// M06 快速答對的時限（毫秒，依題型；口說、拼字比較慢）
export const CHASE_FAST_MS: Record<string, number> = { choice: 6000, spell: 12000, fill: 12000, voice: 10000 };

// 戰鬥環境：這場有哪些題型、指定考點可以用
export interface ModContext {
  skills: QuestionSkill[];   // 這個區域題庫有的題型
  grammarTags: string[];     // 這個區域有題目的文法考點（M07 用）
  rand: () => number;
}

const pick = <T,>(list: T[], rand: () => number) => list[Math.floor(rand() * list.length)];

function activate(m: ModState, levelIdx: number, ctx: ModContext): ModState {
  const base: ModState = { ...m, phase: 'active', progress: 0, left: 0, resets: 0 };
  const has = (s: QuestionSkill) => ctx.skills.includes(s);
  switch (m.id) {
    case 'M01': return { ...base, need: LOCK_STREAK[modTier(levelIdx)] };
    case 'M02': return { ...base, need: 2, left: 3, skill: pick(ctx.skills.filter(s => s !== 'speaking'), ctx.rand) ?? ctx.skills[0] };
    case 'M03': return { ...base, need: 2 };
    case 'M04': return { ...base, need: 3, left: 4 };
    case 'M05': return { ...base, need: 1 }; // 題型由玩家選（skill 選好之前不算進度）
    case 'M06': return { ...base, need: 2, left: 3 };
    case 'M07': {
      const tag = ctx.grammarTags.length ? pick(ctx.grammarTags, ctx.rand) : undefined;
      return { ...base, need: 1, tag, skill: tag ? undefined : (has('reading') ? 'reading' : ctx.skills[0]) };
    }
    case 'M08': {
      const runes = (['reading', 'writing', 'speaking'] as QuestionSkill[]).map(s => (has(s) ? s : has('listening') ? 'listening' : ctx.skills[0]));
      return { ...base, need: 3, runes, skill: runes[0] };
    }
    case 'M09': return { ...base, need: 3, healed: 0 };
    case 'M10': return { ...base, need: 2, skill: has('listening') ? 'listening' : 'reading' };
    case 'M11': return { ...base, need: 3, left: 3, skill: has('writing') ? 'writing' : ctx.skills[0] };
  }
}

const STARTS: ModId[] = ['M01', 'M07', 'M11'];
export const modCast = (m: ModState, text: string) => `${MOD_DEFS[m.id].icon} ${MOD_DEFS[m.id].name}：${text}`;

// 開場：登場就發動的模組（M01、M07、M11）
export function startMods(ids: ModId[], levelIdx: number, ctx: ModContext): { mods: ModState[]; casts: string[] } {
  const casts: string[] = [];
  const mods = ids.map(id => {
    const idle: ModState = { id, phase: 'idle', progress: 0, need: 0, left: 0, resets: 0 };
    if (!STARTS.includes(id)) return idle;
    const m = activate(idle, levelIdx, ctx);
    casts.push(modCast(m, describe(m)));
    return m;
  });
  return { mods, casts };
}

const SKILL_NAME: Record<QuestionSkill, string> = { listening: '聽力', reading: '閱讀', speaking: '口說', writing: '拼寫' };
export const skillName = (s: QuestionSkill) => SKILL_NAME[s];

function describe(m: ModState, tagName: (id: string) => string = id => id): string {
  switch (m.id) {
    case 'M01': return `連續答對 ${m.need} 題才能打破（鎖住時傷害只剩 30%）`;
    case 'M02': return `攻擊 −20%！答對 2 題${skillName(m.skill!)}題淨化`;
    case 'M03': return '援軍出現！答對 2 題擊退，答錯會被追打';
    case 'M04': return '首領狂暴，出手變快！4 題內答對 3 題壓制它';
    case 'M05': return '選一種題型，答對就把攻擊反射回去';
    case 'M06': return '首領開始蓄力！3 題內快速答對 2 題打斷它';
    case 'M07': return m.tag ? `弱點是「${tagName(m.tag)}」，答對就揭露弱點` : `答對 1 題${skillName(m.skill!)}題揭露弱點`;
    case 'M08': return `依序答對 ${m.runes!.map(skillName).join(' → ')} 三道符文`;
    case 'M09': return '答錯時首領會吸血回復！答對 3 題斬斷';
    case 'M10': return `分身出現！答對 2 題${skillName(m.skill!)}題看穿真身`;
    case 'M11': return `技能被封印！答對 3 題${skillName(m.skill!)}題解封（最多 3 題）`;
  }
}
export const describeMod = describe;

// 這一題的作答
export interface ModAnswer {
  correct: boolean;
  skill: QuestionSkill;
  grammar: string | null; // 這題的主要文法考點
  fast: boolean;          // 在 M06 的時限內答對
  streak: number;         // 答完這題後的真實連對數
}
// 戰況（作答之後）
export interface ModBattle { hpRatio: number; answers: number; executing: boolean; levelIdx: number }

// 作答後的效果，由 battleStore 套用
export interface ModEffects {
  penalty: number;       // 答錯時額外受到的傷害（被攻擊隊員最大生命的比例，只取最重的一個）
  charge: number;        // 下一擊倍率（1 = 沒有）
  partyHeal: number;     // 全隊回血比例
  bossHeal: number;      // 首領回血比例
  casts: string[];
  choice: QuestionSkill[] | null; // M05：請玩家選題型
}

const matches = (m: ModState, a: ModAnswer) =>
  m.tag ? a.grammar === m.tag : !m.skill || a.skill === m.skill;

// 作答後：先推進破解進度，再處理限時模組的倒數，最後檢查新的觸發條件
export function afterAnswer(mods: ModState[], a: ModAnswer, b: ModBattle, ctx: ModContext, tagName?: (id: string) => string): { mods: ModState[]; fx: ModEffects } {
  const fx: ModEffects = { penalty: 0, charge: 1, partyHeal: 0, bossHeal: 0, casts: [], choice: null };
  const hit = (pct: number) => { fx.penalty = Math.max(fx.penalty, pct); };
  const reward = (m: ModState, text: string, patch: Partial<ModEffects> = {}) => {
    fx.casts.push(modCast(m, text));
    if (patch.charge) fx.charge = Math.max(fx.charge, patch.charge);
    if (patch.partyHeal) fx.partyHeal = Math.max(fx.partyHeal, patch.partyHeal);
    return { ...m, phase: 'done' as const };
  };
  // 首領已經倒地：還沒處理完的模組全部取消
  if (b.executing) return { mods: mods.map(m => (m.phase === 'active' || m.phase === 'idle' ? { ...m, phase: 'over' as const } : m)), fx };

  let next = mods.map((m): ModState => {
    if (m.phase !== 'active') return m;
    switch (m.id) {
      case 'M01': {
        const cumulative = m.resets >= LOCK_RESETS;
        if (!a.correct) {
          if (cumulative) return m;
          hit(0.05);
          const resets = m.resets + 1;
          if (resets >= LOCK_RESETS) fx.casts.push(modCast(m, '改成累計答對 3 題就能打破'));
          return { ...m, progress: 0, resets, need: resets >= LOCK_RESETS ? 3 : m.need };
        }
        const progress = cumulative ? m.progress + 1 : Math.min(a.streak, m.need);
        return progress >= m.need ? reward({ ...m, progress }, '鎖被打破了！下一擊 ×2', { charge: 2 }) : { ...m, progress };
      }
      case 'M02': {
        const progress = m.progress + (a.correct && matches(m, a) ? 1 : 0);
        return progress >= m.need ? reward({ ...m, progress }, '詛咒淨化！全隊回復 8%', { partyHeal: 0.08 }) : { ...m, progress };
      }
      case 'M03': {
        if (!a.correct) { hit(0.06); return m; }
        const progress = m.progress + 1;
        return progress >= m.need ? reward({ ...m, progress }, '援軍被擊退！下一擊群攻 ×1.5', { charge: 1.5 }) : { ...m, progress };
      }
      case 'M04': {
        const progress = m.progress + (a.correct ? 1 : 0);
        return progress >= m.need ? reward({ ...m, progress }, '狂暴被壓制！下一擊 ×1.5', { charge: 1.5 }) : { ...m, progress };
      }
      case 'M05': {
        if (!m.skill) return m; // 還沒選題型
        if (!matches(m, a)) return m;
        if (!a.correct) { hit(0.08); return m; }
        return reward(m, '攻擊被反射回去！下一擊 ×1.5', { charge: 1.5 });
      }
      case 'M06': {
        const progress = m.progress + (a.correct && a.fast ? 1 : 0);
        return progress >= m.need ? reward({ ...m, progress }, '蓄力被打斷！下一擊 ×2', { charge: 2 }) : { ...m, progress };
      }
      case 'M07':
        return a.correct && matches(m, a) ? reward(m, '弱點揭露！下一擊 ×1.5', { charge: 1.5 }) : m;
      case 'M08': {
        if (!matches(m, a)) return m;
        if (!a.correct) { hit(0.05); return m; }
        const progress = m.progress + 1;
        if (progress >= m.need) return reward({ ...m, progress }, '符文全部點亮，爆炸！下一擊 ×2', { charge: 2 });
        fx.casts.push(modCast(m, `第 ${progress} 道符文點亮，下一道是${skillName(m.runes![progress])}`));
        return { ...m, progress, skill: m.runes![progress] };
      }
      case 'M09': {
        if (!a.correct) {
          const heal = Math.min(VAMPIRE_STEP, VAMPIRE_CAP - (m.healed ?? 0));
          if (heal > 0) fx.bossHeal = heal;
          return { ...m, healed: (m.healed ?? 0) + Math.max(0, heal) };
        }
        const progress = m.progress + 1;
        return progress >= m.need ? reward({ ...m, progress }, '吸血被斬斷！全隊回復 10%', { partyHeal: 0.1 }) : { ...m, progress };
      }
      case 'M10': {
        const counts = a.skill === 'listening' || a.skill === 'reading';
        if (!counts) return m;
        if (!a.correct) { hit(0.06); return m; }
        const progress = m.progress + 1;
        return progress >= m.need ? reward({ ...m, progress }, '看穿真身，分身全滅！下一擊 ×1.5', { charge: 1.5 }) : { ...m, progress };
      }
      case 'M11': {
        const progress = m.progress + (a.correct && matches(m, a) ? 1 : 0);
        return progress >= m.need ? reward({ ...m, progress }, '封印解除！下一擊 ×2', { charge: 2 }) : { ...m, progress };
      }
    }
  });

  // 限時模組：每答一題倒數，時間到就結束（M06 蓄力完成會打出一擊）
  next = next.map(m => {
    if (m.phase !== 'active' || m.left <= 0) return m;
    const left = m.left - 1;
    if (left > 0) return { ...m, left };
    if (m.id === 'M06') { hit(0.12); fx.casts.push(modCast(m, '蓄力完成，重擊！')); }
    else fx.casts.push(modCast(m, m.id === 'M11' ? '封印時間到，技能恢復了' : '效果結束了'));
    return { ...m, left: 0, phase: 'over' };
  });

  // 新的觸發
  next = next.map(m => {
    if (m.phase !== 'idle') return m;
    const fire =
      m.id === 'M02' ? b.answers >= 3
      : m.id === 'M03' ? b.hpRatio <= 0.7
      : m.id === 'M04' ? b.hpRatio <= 0.4
      : m.id === 'M05' || m.id === 'M08' ? b.hpRatio <= 0.6
      : m.id === 'M06' ? b.answers >= 5
      : m.id === 'M09' ? !a.correct
      : m.id === 'M10' ? b.hpRatio <= 0.5
      : false;
    if (!fire) return m;
    const on = activate(m, b.levelIdx, ctx);
    fx.casts.push(modCast(on, describe(on, tagName)));
    if (on.id === 'M05') fx.choice = pickTwo(ctx.skills, ctx.rand);
    return on;
  });
  return { mods: next, fx };
}

function pickTwo(skills: QuestionSkill[], rand: () => number): QuestionSkill[] {
  const list = [...skills];
  if (list.length <= 2) return list;
  const first = list.splice(Math.floor(rand() * list.length), 1)[0];
  return [first, list[Math.floor(rand() * list.length)]];
}

// M05：玩家選好題型
export const chooseReflect = (mods: ModState[], skill: QuestionSkill) =>
  mods.map(m => (m.id === 'M05' && m.phase === 'active' ? { ...m, skill } : m));

// 進行中的模組對戰鬥的影響
export const isActive = (mods: ModState[], id: ModId) => mods.some(m => m.id === id && m.phase === 'active');
export const modDamageMult = (mods: ModState[]) =>
  (isActive(mods, 'M01') ? LOCK_DAMAGE : 1) * (isActive(mods, 'M02') ? CURSE_DAMAGE : 1);
export const modGaugeMult = (mods: ModState[]) => (isActive(mods, 'M04') ? BERSERK_GAUGE : 1);
export const modSealed = (mods: ModState[]) => isActive(mods, 'M11');

// 下一題想出什麼：指定題型或文法考點（進行中的第一個有指定的模組）
export function modPreference(mods: ModState[]): { skill?: QuestionSkill; tag?: string } | null {
  for (const m of mods) {
    if (m.phase !== 'active') continue;
    if (m.tag) return { tag: m.tag };
    if (m.skill) return { skill: m.skill };
  }
  return null;
}

// 怪物血條下方的狀態文字
export function modStatus(m: ModState): string | null {
  if (m.phase !== 'active') return null;
  const d = MOD_DEFS[m.id];
  const left = m.left > 0 ? `・剩 ${m.left} 題` : '';
  switch (m.id) {
    case 'M01': return `${d.icon} ${m.resets >= LOCK_RESETS ? '累計' : '連對'} ${m.progress}/${m.need}`;
    case 'M05': return m.skill ? `${d.icon} 反射：${skillName(m.skill)}` : `${d.icon} 選題型反射`;
    case 'M07': return `${d.icon} 弱點 0/1`;
    case 'M08': return `${d.icon} 符文 ${m.progress}/3：${skillName(m.skill!)}`;
    default: return `${d.icon} ${d.name}${m.skill ? `（${skillName(m.skill)}）` : ''} ${m.progress}/${m.need}${left}`;
  }
}
