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
    { speaker: 'spirit', text: '霧的另一邊是碧藍海岸。燈塔熄了，船隻找不到回家的路。' },
  ],
  'region-a2p': [
    { speaker: 'elder', text: '漁夫們說，海怪把燈塔的訊號全吃掉了，現在誰也看不懂航海日誌。' },
    { speaker: 'spirit', text: '這裡的咒語要描述過去和未來：昨天發生了什麼、明天要去哪裡。' },
    { speaker: 'hero', text: '把時間說清楚，燈塔就會重新亮起來吧！' },
  ],
  'clear-a2p': [
    { speaker: 'narrator', text: '燈塔再次點亮，漁船一艘艘平安靠岸。' },
    { speaker: 'spirit', text: '下一站是黃金沙漠。商人們因為說不出話，已經好久無法做生意了。' },
  ],
  'region-2': [
    { speaker: 'spirit', text: '沙漠的商隊需要會談判的人。這裡的咒語更長，也更實用。' },
    { speaker: 'hero', text: '開會、寄信、談價錢……原來這些都是咒語！' },
  ],
  'clear-2': [
    { speaker: 'narrator', text: '商隊重新出發，沙漠的城市恢復了熱鬧。' },
    { speaker: 'villain', text: '……有人在收集咒語？無妨，峽谷的回音會把它們全部扭曲。' },
  ],
  'region-b1p': [
    { speaker: 'spirit', text: '赤岩峽谷的回音會把話語扭曲。只有結構正確的句子，回音才會照實傳回來。' },
    { speaker: 'hero', text: '誰、哪一個、做了什麼……把句子接得完整，回音就騙不了我！' },
  ],
  'clear-b1p': [
    { speaker: 'narrator', text: '峽谷的回音變得清澈，礦工們又能隔著岩壁互相呼喊。' },
    { speaker: 'villain', text: '哼，那就讓雪嶺的冰，把一切凍結吧。' },
  ],
  'region-3': [
    { speaker: 'spirit', text: '極光雪嶺的冰龍守著王國的史書。牠只回應精確的咒語。' },
    { speaker: 'hero', text: '我已經走到這裡了，不會退縮。' },
  ],
  'clear-3': [
    { speaker: 'narrator', text: '冰龍低下了頭，史書上的文字一行行亮了起來。' },
    { speaker: 'spirit', text: '雪嶺之上是雷鳴高原。雷鳥守著通往魔域的唯一道路。' },
  ],
  'region-b2p': [
    { speaker: 'spirit', text: '雷鳥只尊敬能精準表達推測與假設的人：「如果當時……就會……」。' },
    { speaker: 'hero', text: '說出所有的可能性，雷電也擋不住我！' },
  ],
  'clear-b2p': [
    { speaker: 'narrator', text: '雷雲散開，雷鳥展翅為你指路。' },
    { speaker: 'spirit', text: '最後是熔岩魔域……沉默魔王的軍隊就在那裡。' },
  ],
  'region-4': [
    { speaker: 'villain', text: '區區一個旅人，也想用那些咒語對抗我？' },
    { speaker: 'hero', text: '這些咒語是大家的聲音。我會把它們全部帶回來！' },
  ],
  'clear-4': [
    { speaker: 'narrator', text: '熔岩冷卻，魔王軍節節敗退。王城的方向，傳來了久違的鐘聲。' },
    { speaker: 'spirit', text: '{name}，你已經是真正的咒語使了。王城就在眼前，沉默魔王在王座之間等著我們。' },
  ],
  'region-5': [
    { speaker: 'narrator', text: '天空島的另一端，王城靜靜地漂浮在雲上。城裡沒有任何聲音。' },
    { speaker: 'villain', text: '你收集了那麼多咒語……但在絕對的沉默面前，它們不過是噪音。' },
    { speaker: 'hero', text: '我不會再害怕開口了。每一個字，我都會清清楚楚地說出來！' },
    { speaker: 'spirit', text: '這裡的咒語是最高階的語言。相信你一路走來學會的一切！' },
  ],
  'clear-5': [
    { speaker: 'villain', text: '……不可能。這些聲音……竟然壓過了沉默……' },
    { speaker: 'narrator', text: '最後一道咒語響徹王座之間。沉默魔王化成了灰燼，被奪走的語言如流星般回到人們身邊。' },
    { speaker: 'elder', text: '聽！是孩子們的歌聲！市集在叫賣，書店重新開門了！' },
    { speaker: 'spirit', text: '{name}，謝謝你。從今以後，你就是這個王國的「語言守護者」。' },
    { speaker: 'hero', text: '一開始我連一個單字都不敢說……原來，只要一步一步來就做得到。' },
    { speaker: 'narrator', text: '【主線結局】你獲得了稱號「語言守護者」。王國的冒險仍在繼續——新的區域與挑戰，將陸續開放。' },
  ],
  'golden-ending': [
    { speaker: 'narrator', text: '沒有夥伴、沒有裝備、沒有轉職。只憑一路不曾說錯的古代咒語，你站在了沉默魔王面前。' },
    { speaker: 'villain', text: '區區一個初出茅廬的旅人……怎麼可能？' },
    { speaker: 'spirit', text: '因為真正的力量，從來都在語言本身。' },
    { speaker: 'narrator', text: '時空因你的咒語而震動。你跨越了所有試煉，成為傳說中的存在——' },
    { speaker: 'narrator', text: '【特殊結局】你獲得了稱號「掌握古代咒語的超時空勇者」！' },
  ],
};

// 劇情 id 依區域固定：原本六個區域沿用舊 id（存檔裡記錄看過哪些），新增的三區用自己的 id
const REGION_STORY_KEYS = ['0', '1', 'a2p', '2', 'b1p', '3', 'b2p', '4', '5'];
const storyKey = (regionIdx: number) => REGION_STORY_KEYS[regionIdx] ?? String(regionIdx);
export const regionStoryId = (regionIdx: number) => `region-${storyKey(regionIdx)}`;
export const clearStoryId = (regionIdx: number) => `clear-${storyKey(regionIdx)}`;
