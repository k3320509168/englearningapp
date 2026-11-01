// 劇情風味選項資料（docs/STORY.md、docs/story-drafts/b1-c2-draft.md）：
// 只替換指定段落中露米（spirit）的一句回應台詞，不影響戰力與主線進度。
// 選項 UI 由 T9 串接，此處僅匯出純資料常數與查詢輔助函式。

export interface StoryChoiceOption {
  id: 'A' | 'B';
  label: string;
  reply: string; // 替換該句露米（spirit）的回應台詞，支援 {name}
}

export interface StoryChoice {
  id: string;
  regionIdx: number;
  storyId: string;
  lineIndex: number; // STORIES[storyId] 中被替換的露米台詞索引（0-based）
  options: [StoryChoiceOption, StoryChoiceOption];
}

export const STORY_CHOICES: readonly StoryChoice[] = [
  // ---------- A2 迷霧森林 ----------
  {
    id: 'a2-1',
    regionIdx: 1,
    storyId: 'map-1-4-intro',
    lineIndex: 3,
    options: [
      { id: 'A', label: '質問魔女的決定', reply: '你保護過這裡的人，可不能因此把別人的命運也關起來。' },
      { id: 'B', label: '先試著理解她', reply: '我知道你怕追兵回來，可我們可以一起想另一條路。' },
    ],
  },

  // ---------- A2+ 碧藍海岸 ----------
  {
    id: 'a2p-1',
    regionIdx: 2,
    storyId: 'map-2-4-clear',
    lineIndex: 2,
    options: [
      { id: 'A', label: '先救被鎖住的海獸', reply: '我也想先救牠！帶上回聲貝，去貝殼沙灘，讓牠重新聽見自己的聲音！' },
      { id: 'B', label: '先讓漁船安全回港', reply: '我懂，你怕大家等不及。但要救那些船，就得先救牠。回聲貝在貝殼沙灘，走！' },
    ],
  },

  // ---------- B1 黃金沙漠 ----------
  {
    id: 'b1-1',
    regionIdx: 3,
    storyId: 'map-3-4-clear',
    lineIndex: 2,
    options: [
      { id: 'A', label: '責備法老只顧石碑不顧活人', reply: '就是說啊！石頭不會餓肚子，外面的商隊跟海獸卻倒大楣了！' },
      { id: 'B', label: '感嘆法老也是怕歷史重演', reply: '被騙過確實很痛啦……但也不能因此把全世界的嘴都封上啊！' },
    ],
  },
  {
    id: 'b1-2',
    regionIdx: 3,
    storyId: 'map-3-5-clear',
    lineIndex: 2,
    options: [
      { id: 'A', label: '正面拆穿他的海市蜃樓', reply: '沒錯！管他幾個分身，真名一唸出來，假的統統站不住腳！' },
      { id: 'B', label: '用商隊重拾信任的證據說服他', reply: '嘿嘿，綠洲和沙暴城就是最好的鐵證，看他還怎麼嘴硬！' },
    ],
  },

  // ---------- B1+ 赤岩峽谷 ----------
  {
    id: 'b1p-1',
    regionIdx: 4,
    storyId: 'map-4-3-clear',
    lineIndex: 1,
    options: [
      { id: 'A', label: '驚訝露米以前是大官', reply: '哼哼，失憶前我可是王城首席記錄官！雖然現在只記得這行字啦！' },
      { id: 'B', label: '擔心露米想起來會難過', reply: '別露出那種表情嘛！不管想起什麼，有你在旁邊我才不怕呢！' },
    ],
  },
  {
    id: 'b1p-2',
    regionIdx: 4,
    storyId: 'map-4-6-clear',
    lineIndex: 0,
    options: [
      { id: 'A', label: '大聲唸出守護者的真名', reply: '氣勢滿分！「GUARDIAN」一響起來，連整片石林都在替我們開路！' },
      { id: 'B', label: '溫柔喚醒石碑上的記憶', reply: '真好聽……「GUARDIAN」的微光暖暖的，龍岩聽見一定不會再痛了。' },
    ],
  },

  // ---------- B2 極光雪嶺 ----------
  {
    id: 'b2-1',
    regionIdx: 5,
    storyId: 'map-5-4-clear',
    lineIndex: 0,
    options: [
      { id: 'A', label: '心疼露米獨自背負這麼多', reply: '嗚……你幹嘛突然這麼溫柔啦！現在有你一起扛，我才不孤單呢！' },
      { id: 'B', label: '誇獎露米當年的機智果斷', reply: '對吧對吧！連我自己都佩服當年的我，連魔王軍都被我騙過了！' },
    ],
  },
  {
    id: 'b2-2',
    regionIdx: 5,
    storyId: 'boss-5-intro',
    lineIndex: 4,
    options: [
      { id: 'A', label: '用連擊的熱度正面破冰', reply: '沒錯！極寒領域才剩幾秒又怎樣，連對下去就能把寒氣全燒光！' },
      { id: 'B', label: '為了不辜負冰龍百年的等待', reply: '嗯！牠一個人守在冰湖底這麼久，我們用最漂亮的真名回答牠！' },
    ],
  },

  // ---------- B2+ 雷鳴高原 ----------
  {
    id: 'b2p-1',
    regionIdx: 6,
    storyId: 'map-6-5-clear',
    lineIndex: 1,
    options: [
      { id: 'A', label: '開心地向各地老朋友打招呼', reply: '喂——大家聽得見嗎！我們跟{name}已經爬到雲端上面囉！' },
      { id: 'B', label: '請各地夥伴放心守好家園', reply: '看到大家平安連線我就放心了！剩下的王城大門，交給我們包辦！' },
    ],
  },
  {
    id: 'b2p-2',
    regionIdx: 6,
    storyId: 'boss-6-intro',
    lineIndex: 3,
    options: [
      { id: 'A', label: '替受傷卻仍護信的小雷鳥抱不平', reply: '連小雷鳥都相信真話能救人，身為統領的你怎麼可以先放棄啦！' },
      { id: 'B', label: '指出切斷溝通只會讓誤會更深', reply: '要是不讓人把話說清楚，當年的遺憾只會永遠卡在雷雲裡啊！' },
    ],
  },

  // ---------- C1 熔岩魔域 ----------
  {
    id: 'c1-1',
    regionIdx: 7,
    storyId: 'map-7-3-clear',
    lineIndex: 1,
    options: [
      { id: 'A', label: '誇讚老鍛匠重燃古爐的手藝', reply: '叮噹作響的聲音超好聽！大師，等打完魔王記得幫我也打個小徽章喔！' },
      { id: 'B', label: '追問炎魔之王為何強迫工匠打黑鐵', reply: '對啊！明明能打出這麼棒的真名武器，炎魔之王幹嘛替王城賣命啊？' },
    ],
  },
  {
    id: 'c1-2',
    regionIdx: 7,
    storyId: 'map-7-6-clear',
    lineIndex: 0,
    options: [
      { id: 'A', label: '向灰燼中發亮的萬千心聲致意', reply: '大家再等一下下喔！我們馬上就把熔爐關掉，帶你們全部回家！' },
      { id: 'B', label: '感嘆真名的力量連業火都燒不滅', reply: '我就說吧！真心的話才燒不死，現在全變成我們的援軍啦！' },
    ],
  },

  // ---------- C2 王城 ----------
  {
    id: 'c2-1',
    regionIdx: 8,
    storyId: 'map-8-6-clear',
    lineIndex: 2,
    options: [
      { id: 'A', label: '笑說還好自己當初從最簡單的字學起', reply: '嘿嘿，你在邊境唸的那句「Hello」超響亮，一秒就把我叫醒啦！' },
      { id: 'B', label: '感謝露米與夥伴一路陪自己練習', reply: '少肉麻啦！是你自己一題題沒放棄，快去鐘塔刻上最後一筆吧！' },
    ],
  },
  {
    id: 'c2-2',
    regionIdx: 8,
    storyId: 'boss-8-intro',
    lineIndex: 4,
    options: [
      { id: 'A', label: '就算會受傷，人類也能靠溝通學會理解', reply: '說得好！全知封印算什麼，用我們連對的真名直接敲醒這座王座！' },
      { id: 'B', label: '把全王國被奪走的名字一口氣討回來', reply: '沒錯！草原到魔域大家的心願都在這了，連對破封，一口氣反擊回去！' },
    ],
  },
];

export const STORY_CHOICES_BY_STORY: Record<string, StoryChoice> = Object.fromEntries(
  STORY_CHOICES.map(choice => [choice.storyId, choice]),
);

export function getStoryChoice(storyId: string, lineIndex?: number): StoryChoice | undefined {
  const choice = STORY_CHOICES_BY_STORY[storyId];
  if (!choice) return undefined;
  return lineIndex === undefined || choice.lineIndex === lineIndex ? choice : undefined;
}
