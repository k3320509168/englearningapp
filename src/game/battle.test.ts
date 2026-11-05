import { describe, expect, it } from 'vitest';
import type { Question } from './types';
import { isVoiceFragment, questionAudio,
  applyLetter, checkChoice, checkVoice, isLenientStage,
  questionHint, sentenceMatchRatio, shuffleChoice, speedMultiplier,
} from './battle';

const choiceQ: Question = { type: 'choice', desc: 'I ___ a student.', options: ['A. am', 'B. is', 'C. are', 'D. be'], ans: 'A' };

describe('shuffleChoice', () => {
  it('keeps the correct answer text attached to the new answer letter', () => {
    for (let seed = 0; seed < 20; seed++) {
      let s = seed;
      const random = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
      const shuffled = shuffleChoice(choiceQ, random);
      const correct = shuffled.options!.find(o => o.startsWith(shuffled.ans + '.'));
      expect(correct).toBe(`${shuffled.ans}. am`);
      expect(shuffled.options!.map(o => o[0])).toEqual(['A', 'B', 'C', 'D']);
    }
  });

  it('leaves non-choice questions untouched', () => {
    const q: Question = { type: 'spell', desc: '請拼出：書本', ans: 'BOOK' };
    expect(shuffleChoice(q)).toBe(q);
  });
});

describe('applyLetter', () => {
  const q: Question = { type: 'spell', desc: '請拼出：書本', ans: 'BOOK' };
  it('lets the player type freely up to the answer length (judged only on submit)', () => {
    // 自由輸入、不當場判定；最多打到答案的長度
    expect(applyLetter(q, '', 'b')).toBe('B');
    expect(applyLetter(q, 'BO', 'X')).toBe('BOX');
    expect(applyLetter(q, 'BOOK', 'S')).toBe('BOOK');
  });
});

describe('checkChoice', () => {
  it('is case-insensitive', () => {
    expect(checkChoice(choiceQ, 'a')).toBe(true);
    expect(checkChoice(choiceQ, 'B')).toBe(false);
  });
});

describe('voice', () => {
  it('matches single words as whole words, including accept list', () => {
    const q: Question = { type: 'voice', desc: '', ans: 'START', accept: ['STAR'] };
    expect(checkVoice(q, 'start')).toBe(true);
    expect(checkVoice(q, 'a star')).toBe(true);
    expect(checkVoice(q, 'restart')).toBe(false);
  });

  it('長單字容許電腦麥克風常見的誤聽：差兩個字母、或被拆成幾個詞', () => {
    const q: Question = { type: 'voice', desc: '請唸出單字：直升機', ans: 'HELICOPTER', speak: 'helicopter' };
    expect(checkVoice(q, 'Helicopter')).toBe(true);
    expect(checkVoice(q, 'hellicopter')).toBe(true);
    expect(checkVoice(q, 'a helicopters')).toBe(true);
    expect(checkVoice(q, 'heli copter')).toBe(true);
    expect(checkVoice(q, 'helly copter')).toBe(true);
    expect(checkVoice(q, 'apple')).toBe(false);
    expect(checkVoice(q, 'hello')).toBe(false);
    expect(checkVoice({ type: 'voice', desc: '', ans: 'APPLE' }, 'apply')).toBe(false);
  });

  it('passes sentences at 80% of words in order', () => {
    const q: Question = { type: 'voice', desc: '', ans: 'PLEASE SEND ME THE REPORT TODAY' };
    expect(sentenceMatchRatio(q.ans, 'please send me the report today')).toBe(1);
    expect(checkVoice(q, 'please send me a report today')).toBe(true); // 5/6 ≈ 83%
    expect(checkVoice(q, 'please send report')).toBe(false); // 3/6
  });

  it('treats contractions from speech recognition as the full form', () => {
    expect(checkVoice({ type: 'voice', desc: '', ans: 'I AM AN ENGINEER' }, "I'm an engineer")).toBe(true);
    expect(checkVoice({ type: 'voice', desc: '', ans: 'DO NOT WORRY ABOUT IT' }, 'don’t worry about it')).toBe(true);
    expect(checkVoice({ type: 'voice', desc: '', ans: 'LET US GO SWIMMING' }, "let's go swimming")).toBe(true);
  });

  it('R2回歸：反義前綴保護（INCONSPICUOUS 唸成 conspicuous 絕不能算對）', () => {
    const q: Question = { type: 'voice', desc: '請唸出單字：不顯眼的', ans: 'INCONSPICUOUS', speak: 'inconspicuous' };
    expect(checkVoice(q, 'inconspicuous')).toBe(true);
    expect(checkVoice(q, 'inconspicous')).toBe(true); // 合理微小發音誤差容錯仍生效
    expect(checkVoice(q, 'conspicuous')).toBe(false); // 缺少反義前綴 IN-，意思相反，必須判定失敗！
  });

  it('R2回歸：關鍵否定詞保護（漏唸 NOT 導致整句意思顛倒，絕不能算對）', () => {
    const q1: Question = {
      type: 'voice',
      desc: '',
      ans: 'COMPARABLE PRICES DO NOT ESTABLISH INTERCHANGEABLE FUNCTIONS',
      speak: 'Comparable prices do not establish interchangeable functions',
    };
    // 完整唸出包含 NOT：通過
    expect(checkVoice(q1, 'comparable prices do not establish interchangeable functions')).toBe(true);
    // 漏唸 NOT：即使單字匹配率達 6/7 (85.7%)，也必須判定失敗！
    expect(checkVoice(q1, 'comparable prices do establish interchangeable functions')).toBe(false);

    const q2: Question = {
      type: 'voice',
      desc: '',
      ans: 'SINCERE MOTIVES DO NOT BY THEMSELVES VINDICATE OUTCOMES',
      speak: 'Sincere motives do not by themselves vindicate outcomes',
    };
    expect(checkVoice(q2, 'sincere motives do not by themselves vindicate outcomes')).toBe(true);
    expect(checkVoice(q2, 'sincere motives do by themselves vindicate outcomes')).toBe(false);
  });
});

describe('combo timer rules', () => {
  it('rewards fast answers', () => {
    expect(speedMultiplier(3000)).toBe(1.5);
    expect(speedMultiplier(8000)).toBe(1.2);
    expect(speedMultiplier(15_000)).toBe(1);
  });

  it('the first 25 stages are lenient', () => {
    expect(isLenientStage(0)).toBe(true);
    expect(isLenientStage(24)).toBe(true);
    expect(isLenientStage(25)).toBe(false);
  });
});

describe('questionHint', () => {
  it('extracts the Chinese hint from desc', () => {
    expect(questionHint({ type: 'spell', desc: '請拼出：書本', ans: 'BOOK' })).toBe('書本');
    expect(questionHint({ type: 'fill', desc: '填空題：B U D G _ T (預算)', ans: 'E' })).toBe('預算');
    expect(questionHint(choiceQ)).toBe('');
  });
});

describe('口說轉拼寫：辨識容錯不能當成正確拼法（N1）', () => {
  it('全題庫掃描：拼寫時只接受答案與同義寫法', async () => {
    const { LEVELS, getPool } = await import('./QuestionData');
    const { voiceFallback, checkTypedAnswer } = await import('./battle');
    let checked = 0;
    for (const level of LEVELS) {
      const pool = getPool(level);
      for (const q of [...pool.normal, ...pool.boss]) {
        if (q.type !== 'voice') continue;
        const spell = voiceFallback(q);
        if (spell.type !== 'spell') continue;
        checked++;
        expect(checkTypedAnswer(spell, q.ans.replace(/[^A-Z]/g, ''))).toBe(true); // 鍵盤只打得出字母
        for (const heard of q.accept ?? []) {
          if (!(q.spellAccept ?? []).includes(heard)) expect(checkTypedAnswer(spell, heard)).toBe(false);
        }
      }
    }
    expect(checked).toBeGreaterThan(50);
  });

  it('同義寫法在拼寫與口說都接受；誤聽只在口說接受', async () => {
    const { voiceFallback, checkTypedAnswer, checkVoice } = await import('./battle');
    const thank = { type: 'voice', desc: '請唸出單字：謝謝', ans: 'THANK', speak: 'thank you', spellAccept: ['THANKS', 'THANKYOU'] };
    expect(checkTypedAnswer(voiceFallback(thank), 'THANKS')).toBe(true);
    expect(checkVoice(thank, 'thanks')).toBe(true);
    const start = { type: 'voice', desc: '請唸出單字：開始', ans: 'START', speak: 'start', accept: ['STAR'] };
    expect(checkVoice(start, 'star')).toBe(true);
    expect(checkTypedAnswer(voiceFallback(start), 'STAR')).toBe(false);
  });
});

describe('questionAudio：答案要唸的英文', () => {
  it('聽力題唸題目播放的英文，不唸中文選項或空白', () => {
    const word = { type: 'choice', skill: 'listening' as const, desc: '🎧 聽一聽，選出正確的意思', speak: 'Office', options: ['A. 辦公室', 'B. 餐廳', 'C. 機場', 'D. 飯店'], ans: 'A' };
    expect(questionAudio(word)).toBe('Office');
    const reply = { type: 'choice', skill: 'listening' as const, desc: '🎧 聽到這句話，最適合的回應是？', speak: 'Whose bag is this?', options: ['A. It belongs to Mr. Lin.', 'B. x', 'C. y', 'D. z'], ans: 'A' };
    expect(questionAudio(reply)).toBe('Whose bag is this?');
  });

  it('有空格的句子唸完整句子；選項是英文就唸選項；都沒有就不唸', () => {
    expect(questionAudio({ type: 'choice', desc: '【生活文法】She ___ a teacher.', options: ['A. is', 'B. am'], ans: 'A' })).toBe('She is a teacher.');
    expect(questionAudio({ type: 'choice', desc: '早餐的英文是？', options: ['A. breakfast', 'B. lunch'], ans: 'A' })).toBe('breakfast');
    expect(questionAudio({ type: 'choice', desc: '【短文理解】How much?', options: ['A. $120', 'B. $90'], ans: 'A' })).toBe('');
    expect(questionAudio({ type: 'spell', desc: '請拼出：書', ans: 'BOOK', speak: 'book' })).toBe('book');
  });
});

describe('isVoiceFragment：收音被切斷', () => {
  const heli = { type: 'voice', desc: '請唸出單字：直升機', ans: 'HELICOPTER', speak: 'helicopter' };
  it('只聽到開頭一小段算被切斷（免費重唸）；唸成別的字不算', () => {
    expect(isVoiceFragment(heli, ['Hel'])).toBe(true);
    expect(isVoiceFragment(heli, [''])).toBe(true);
    expect(isVoiceFragment(heli, ['apple'])).toBe(false);
    expect(isVoiceFragment(heli, ['helicopter'])).toBe(false);
  });
});

it('口說相近但不同義/反義詞不可由編輯距離放行，正常拼讀容錯保留', () => {
  for (const [target, heard] of [['INCREASE', 'decrease'], ['DECREASE', 'increase'], ['ALTITUDE', 'attitude'], ['ECONOMIC', 'economical']]) {
    expect(checkVoice({ type: 'voice', desc: '請唸出', ans: target }, heard)).toBe(false);
  }
  expect(checkVoice({ type: 'voice', desc: '請唸出', ans: 'HELICOPTER' }, 'hellicopter')).toBe(true);
});
