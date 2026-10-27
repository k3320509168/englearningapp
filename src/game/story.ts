// 主線劇情：失去家園的勇士，靠「古代咒語」（英文）奪回被沉默魔王奪走語言的王國。
// {name} 會換成玩家主角的名字。

export type Speaker = 'narrator' | 'hero' | 'elder' | 'spirit' | 'villain';

export interface StoryLine {
  speaker: Speaker;
  text: string;
}

export const SPEAKERS: Record<Speaker, { name: string; icon: string }> = {
  narrator: { name: '', icon: '📜' },
  hero: { name: '{name}', icon: '' },
  elder: { name: '村長', icon: '👴' },
  spirit: { name: '語言精靈', icon: '🧚' },
  villain: { name: '沉默魔王', icon: '👿' },
};

export const STORIES: Record<string, StoryLine[]> = {
  prologue: [
    { speaker: 'narrator', text: '很久以前，王國的人民用「古代咒語」交談、唱歌、寫下歷史。' },
    { speaker: 'villain', text: '……太吵了。從今天起，這片土地不再需要任何語言。' },
    { speaker: 'narrator', text: '沉默魔王奪走了王國的語言。文字消失、歌聲停止，王國四分五裂。' },
    { speaker: 'spirit', text: '{name}，醒醒！你是唯一還記得古代咒語的人。' },
    { speaker: 'hero', text: '古代咒語……就是「英文」嗎？我其實不太擅長……' },
    { speaker: 'spirit', text: '沒關係！每唸對一個咒語，你就會變得更強。我們一起把王國奪回來吧！' },
  ],
  'region-0': [
    { speaker: 'elder', text: '旅人，這片草原的怪物把村子的招牌、書本都吃掉了。' },
    { speaker: 'spirit', text: '牠們只怕古代咒語。從最簡單的單字開始就好，一個一個來。' },
    { speaker: 'hero', text: '好，先從草原開始！' },
  ],
  'clear-0': [
    { speaker: 'elder', text: '招牌上的字回來了！孩子們又能念故事書了。' },
    { speaker: 'spirit', text: '{name}，前方的森林被濃霧籠罩，聽說那裡藏著失落的歌謠。' },
  ],
  'region-1': [
    { speaker: 'spirit', text: '霧裡傳來的聲音都是破碎的句子，要用正確的文法才能把它們拼回來。' },
    { speaker: 'hero', text: '單字之外，還要會組句子……我試試看！' },
  ],
  'clear-1': [
    { speaker: 'narrator', text: '濃霧散去，森林裡再次響起歌聲。' },
    { speaker: 'spirit', text: '下一站是黃金沙漠。商人們因為說不出話，已經好久無法做生意了。' },
  ],
  'region-2': [
    { speaker: 'spirit', text: '沙漠的商隊需要會談判的人。這裡的咒語更長，也更實用。' },
    { speaker: 'hero', text: '開會、寄信、談價錢……原來這些都是咒語！' },
  ],
  'clear-2': [
    { speaker: 'narrator', text: '商隊重新出發，沙漠的城市恢復了熱鬧。' },
    { speaker: 'villain', text: '……有人在收集咒語？無妨，雪嶺的冰會讓一切凍結。' },
  ],
  'region-3': [
    { speaker: 'spirit', text: '極光雪嶺的冰龍守著王國的史書。牠只回應精確的咒語。' },
    { speaker: 'hero', text: '我已經走到這裡了，不會退縮。' },
  ],
  'clear-3': [
    { speaker: 'narrator', text: '冰龍低下了頭，史書上的文字一行行亮了起來。' },
    { speaker: 'spirit', text: '最後是熔岩魔域……沉默魔王的軍隊就在那裡。' },
  ],
  'region-4': [
    { speaker: 'villain', text: '區區一個旅人，也想用那些咒語對抗我？' },
    { speaker: 'hero', text: '這些咒語是大家的聲音。我會把它們全部帶回來！' },
  ],
  'clear-4': [
    { speaker: 'narrator', text: '熔岩冷卻，魔王軍節節敗退。王城的方向，傳來了久違的鐘聲。' },
    { speaker: 'spirit', text: '{name}，你已經是真正的咒語使了。王城之戰……很快就會到來。' },
    { speaker: 'narrator', text: '（待續：王城與沉默魔王的決戰將在之後的更新登場）' },
  ],
};

export const regionStoryId = (regionIdx: number) => `region-${regionIdx}`;
export const clearStoryId = (regionIdx: number) => `clear-${regionIdx}`;
