// 主線劇情：失去家園的勇士，靠「古代咒語」（英文）奪回被沉默魔王奪走語言的王國。
// {name} 會換成玩家主角的名字。

export type Speaker = 'narrator' | 'hero' | 'elder' | 'spirit' | 'villain' | 'smith' | 'pathfinder' | 'ferryman' | 'courier' | 'treeheart' | 'hunter'
  | 'forestkeeper' | 'forestchild' | 'mistwitch' | 'foe';

export interface StoryLine {
  speaker: Speaker;
  text: string;
}

export const SPEAKERS: Record<Speaker, { name: string; icon: string }> = {
  narrator: { name: '', icon: '📜' },
  hero: { name: '{name}', icon: '' },
  elder: { name: '村長', icon: '👴' },
  // 語言精靈露米（第十四輪世界觀）：王國的「真名記錄者」，活潑、嘴快、愛吐槽
  spirit: { name: '露米', icon: '🧚' },
  villain: { name: '沉默魔王', icon: '👿' },
  smith: { name: '風車工匠', icon: '🔧' },
  pathfinder: { name: '巡路人', icon: '🧭' },
  ferryman: { name: '船夫', icon: '🛶' },
  courier: { name: '送貨青年', icon: '📦' },
  treeheart: { name: '巨樹之心', icon: '🌳' },
  hunter: { name: '追獵隊長', icon: '🗡️' },
  // A2 迷霧森林（ChatGPT 第十八輪）
  forestkeeper: { name: '守林人洛恩', icon: '🌲' },
  forestchild: { name: '森林女孩', icon: '👧' },
  mistwitch: { name: '幻影魔女', icon: '🧙‍♀️' },
  // 第 15 關小 BOSS、第 20 關大 BOSS 登場台詞的說話者
  foe: { name: '頭目', icon: '👹' },
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
  // 區域魔王通關（打倒巨樹之心）：伏筆是迷霧森林的紫斗篷女人
  'clear-0': [
    { speaker: 'treeheart', text: '我……想起來了。我應該替旅人遮風擋雨，而不是將他們困住。' },
    { speaker: 'hero', text: '草原已經安全了。你還記得是誰把黑石放進哨站的嗎？' },
    { speaker: 'treeheart', text: '披著紫色斗篷的女人……從迷霧森林而來。她說，唯有沉默才能讓森林不再受傷。' },
    { speaker: 'spirit', text: '迷霧森林……看來我們下一站有地方去了。' },
  ],
  // ---------- 每張三星地圖的開場與通關（第十四輪，和 ChatGPT 一起寫）----------
  'map-0-0-intro': [
    { speaker: 'hero', text: '總算有村子了。奇怪，大家都站在店門口，怎麼沒人做生意？' },
    { speaker: 'spirit', text: '你看那些招牌，字都沒了。大家知道自己要做什麼，卻想不起來東西叫什麼名字。' },
    { speaker: 'elder', text: '你們是從邊境來的？如果還能讀懂文字，拜託幫幫我們。村裡已經亂成一團了。' },
    { speaker: 'hero', text: '可以。我們先從哪裡開始？' },
  ],
  'map-0-0-clear': [
    { speaker: 'elder', text: '太好了！雜貨店的招牌回來了，大家也終於能看懂自己的貨物。' },
    { speaker: 'spirit', text: '看吧，名字一回來，東西就不會亂成一團了。我就說你有點本事！' },
    { speaker: 'hero', text: '先別誇我。村外那座風車怎麼一動也不動？' },
  ],
  'map-0-1-intro': [
    { speaker: 'smith', text: '我修了三天，風車明明沒壞，卻怎麼也轉不起來。' },
    { speaker: 'spirit', text: '不是風車壞了，是控制風向的古代符文消失了。你看，塔頂那塊石板空空的。' },
    { speaker: 'hero', text: '那我把文字找回來，風車就會動了？' },
    { speaker: 'smith', text: '拜託你了。沒有風車，村裡連麵粉都磨不出來。' },
  ],
  'map-0-1-clear': [
    { speaker: 'smith', text: '動了！真的動了！我都快忘記風吹過葉片是什麼聲音了。' },
    { speaker: 'spirit', text: '不過那股黑霧沒有散，它正往草原小徑流過去。' },
    { speaker: 'hero', text: '看來不只是風車出問題。走，我們去看看源頭在哪。' },
  ],
  'map-0-2-intro': [
    { speaker: 'hero', text: '剛剛那條路是不是自己動了？' },
    { speaker: 'spirit', text: '你沒看錯。這些樹根原本會替迷路的人指路，現在卻把每條路都封死了。' },
    { speaker: 'pathfinder', text: '我弟弟昨天去河岸送貨，到現在還沒回來。拜託你們幫我找找。' },
    { speaker: 'hero', text: '先把路打通。我們會順路去找他。' },
  ],
  'map-0-2-clear': [
    { speaker: 'pathfinder', text: '這是我弟弟留下的背包！他一定已經走到河岸了。' },
    { speaker: 'spirit', text: '而且你看，背包上有一片黑色樹葉。這股力量不是自然長出來的。' },
    { speaker: 'hero', text: '風車的黑霧、會動的樹根……看來有人故意把整片草原封住。' },
  ],
  'map-0-3-intro': [
    { speaker: 'ferryman', text: '你們也要過河？那可不巧。渡船的符文失效了，水流又突然變急，誰都過不去。' },
    { speaker: 'hero', text: '我們在找一個送貨的年輕人，你有看見嗎？' },
    { speaker: 'ferryman', text: '有！他躲在對岸的倉庫裡，暫時沒事。可是那邊還有魔王軍的人。' },
    { speaker: 'spirit', text: '果然。他們不是路過，是在守著通往巨樹的道路。' },
  ],
  'map-0-3-clear': [
    { speaker: 'courier', text: '謝謝你們！我躲在倉庫裡，差點以為回不了家。' },
    { speaker: 'hero', text: '你有看見魔王軍在這裡做什麼嗎？' },
    { speaker: 'courier', text: '他們把一塊刻滿文字的黑石，運進了北邊廢棄的哨站。運走以後，河水就開始不對勁了。' },
    { speaker: 'spirit', text: '黑石……我好像在哪裡見過。走，去哨站確認一下。' },
  ],
  'map-0-4-intro': [
    { speaker: 'hero', text: '這裡不是早就廢棄了嗎？怎麼到處都有新留下的腳印？' },
    { speaker: 'spirit', text: '看那塊黑石！上面的符文不是用來攻擊，而是一直重複同一道命令。' },
    { speaker: 'hero', text: '什麼命令？' },
    { speaker: 'spirit', text: '「不准任何人離開草原。」巨樹恐怕不是自己想攻擊村民的。' },
  ],
  'map-0-4-clear': [
    { speaker: 'spirit', text: '黑石碎了！你看，纏住整座哨站的樹根開始退開了。' },
    { speaker: 'hero', text: '可是最粗的那幾條還在往森林深處伸。我們得找到它們的主人。' },
    { speaker: 'spirit', text: '是巨樹之心。以前它會保護草原，現在卻被命令困在自己的根裡。' },
    { speaker: 'hero', text: '那就去把它叫醒，而不是把它砍倒。' },
  ],
  // 區域魔王登場
  'boss-0-intro': [
    { speaker: 'treeheart', text: '退下……任何人……不得離開……' },
    { speaker: 'spirit', text: '它一直在重複黑石上的命令。連自己原本的聲音都快忘了。' },
    { speaker: 'hero', text: '巨樹！我們不是來傷害你的。草原上的人還在等你回去！' },
    { speaker: 'treeheart', text: '保護……草原……封閉……所有道路！' },
    { speaker: 'spirit', text: '它聽不見了。先打碎那些黑色的根，才能讓真正的巨樹醒過來！' },
  ],
  'region-1': [
    { speaker: 'spirit', text: '霧裡傳來的聲音都是破碎的句子，要用正確的文法才能把它們拼回來。' },
    { speaker: 'hero', text: '單字之外，還要會組句子……我試試看！' },
  ],
  'clear-1': [
    { speaker: 'mistwitch', text: '霧散了……原來我守住的，早就不是大家想過的生活。草原那塊黑石，我會親自向巨樹賠罪。' },
    { speaker: 'hero', text: '先幫大家找回路吧。保護一個地方，不該靠把所有人關起來。' },
    { speaker: 'mistwitch', text: '我從魔王軍那裡聽到消息：碧藍海岸的燈塔熄了，海底還鎖著一頭巨獸。你們得小心。' },
    { speaker: 'spirit', text: '那就去海岸！先把迷路的船帶回家，再查清楚那條鎖鏈。' },
  ],
  // ---------- A2 迷霧森林（ChatGPT 第十八輪）：追查幻象 → 居民受困 → 魔女救人的過去 → 黑石交易 → 面對自己的選擇 ----------
  'map-1-0-intro': [
    { speaker: 'hero', text: '巨樹說的紫斗篷女人，就住在這座森林裡？' },
    { speaker: 'spirit', text: '應該沒錯。但這裡的路標一會兒向左、一會兒向右……霧也太會騙人了吧！' },
    { speaker: 'forestkeeper', text: '別跟著路標走！我是守林人洛恩，連我都被困在入口三天了。' },
    { speaker: 'hero', text: '先找到真正的路。洛恩，跟緊我們。' },
  ],
  'map-1-0-clear': [
    { speaker: 'forestkeeper', text: '出口總算出現了。這片霧以前會藏住村民，現在連村民都走不出去。' },
    { speaker: 'spirit', text: '霧裡有紫色的咒文碎光，和草原那塊黑石的痕跡很像。' },
    { speaker: 'hero', text: '沿著碎光走。它正飄向前面的蘑菇谷。' },
  ],
  'map-1-1-intro': [
    { speaker: 'forestchild', text: '你們有看見我媽媽嗎？她說桌上有熱湯，可我摸到的只有冷石頭。' },
    { speaker: 'hero', text: '連食物也是假的？這樣下去大家會餓壞的。' },
    { speaker: 'spirit', text: '幻象做得太真了，連飢餓的感覺都能暫時騙過。可肚子不會被騙一輩子。' },
    { speaker: 'forestkeeper', text: '谷裡的霧是從古橋吹來的。先讓大家看清楚眼前的東西吧。' },
  ],
  'map-1-1-clear': [
    { speaker: 'forestchild', text: '真的蘑菇回來了！我終於能分出什麼可以吃、什麼只是石頭。' },
    { speaker: 'hero', text: '有人原本想保護你們，卻把日子弄成這樣。' },
    { speaker: 'forestkeeper', text: '古橋那邊還有人被困著。我認得一條近路，快走。' },
  ],
  'map-1-2-intro': [
    { speaker: 'forestkeeper', text: '停！我明明記得橋在右邊，怎麼現在變成兩座了？' },
    { speaker: 'hero', text: '左邊那座沒有倒影。要是有人踩上去，會直接掉進河裡。' },
    { speaker: 'spirit', text: '這是有人刻意畫出的假橋。露出真路之前，誰都別亂走。' },
    { speaker: 'forestchild', text: '對岸有人在叫救命！我們快幫他們！' },
  ],
  'map-1-2-clear': [
    { speaker: 'forestkeeper', text: '人都救上來了。以前魔女用假路騙走魔王軍，從沒想過會害到我們。' },
    { speaker: 'hero', text: '所以她真的救過這裡的人……但幻象為什麼失控？' },
    { speaker: 'spirit', text: '橋下這股泉水帶著舊記憶。去精靈泉，也許能看見她當時做了什麼。' },
  ],
  'map-1-3-intro': [
    { speaker: 'forestchild', text: '水裡有一群黑盔甲的人！還有一位穿紫斗篷的姐姐……' },
    { speaker: 'spirit', text: '那是泉水留下的記憶。魔王軍追進森林時，她用霧把村民藏了起來。' },
    { speaker: 'forestkeeper', text: '我們原本都感謝她。可她說「再躲一晚」，一晚卻變成了好幾年。' },
    { speaker: 'hero', text: '先讓泉水恢復原樣。我想知道後來發生了什麼。' },
  ],
  'map-1-3-clear': [
    { speaker: 'spirit', text: '我看到了！她把一塊黑石交給魔王軍，換他們不再追進森林。' },
    { speaker: 'hero', text: '那塊石頭後來困住了草原的巨樹。她是知道後果還這麼做的嗎？' },
    { speaker: 'forestkeeper', text: '深林祭壇一直在供應迷霧。魔女就在那裡，這次得當面問清楚。' },
  ],
  'map-1-4-intro': [
    { speaker: 'mistwitch', text: '終於找到這裡了？你們一路拆掉我的霧，知道追兵回來會發生什麼嗎？' },
    { speaker: 'hero', text: '我們知道你救過村民。但草原的黑石，也是你送出去的。' },
    { speaker: 'mistwitch', text: '是我送的。我以為只要犧牲幾條路，就能換這座森林平安。' },
    { speaker: 'spirit', text: '可現在孩子認不出家，大家連真正的路都找不到。這樣還算平安嗎？' },
  ],
  'map-1-4-clear': [
    { speaker: 'mistwitch', text: '祭壇被你們停下了。沒有這層霧，王城的追兵遲早會找到這裡。' },
    { speaker: 'hero', text: '那就把真正的路守住，而不是讓所有人永遠迷路。' },
    { speaker: 'mistwitch', text: '你說得倒容易。來我的庭院，讓我看看你能不能做到。' },
    { speaker: 'spirit', text: '她沒打算逃。小心，她在庭院裡藏著最強的幻象。' },
  ],
  'boss-1-intro': [
    { speaker: 'mistwitch', text: '當年如果沒有我的霧，這座森林早就被魔王軍抓得一個人都不剩。' },
    { speaker: 'forestkeeper', text: '我們記得你救過我們，也記得有人被假路困住、差點沒命。' },
    { speaker: 'hero', text: '你可以害怕追兵，但不能替所有人決定一輩子都躲著。' },
    { speaker: 'mistwitch', text: '我把黑石送去草原，是我做的選擇。這份責任，我不會否認。' },
    { speaker: 'spirit', text: '她把真身藏進幻象了！先辨出真正的魔女，才有機會喚醒庭院。' },
    { speaker: 'mistwitch', text: '那就證明給我看吧。沒有迷霧，你們真的能守住這片森林嗎？' },
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

// 第 15 關小 BOSS、第 20 關大 BOSS 第一次登場的一句台詞（ChatGPT 第十八輪起逐區補）
export const BOSS_LINES: Record<string, { mini: string; big: string }> = {
  'map-1-0': { mini: '我是霧中的哨兵！沒有魔女的允許，誰也別想找到出口！', big: '所有路標都聽我的！你們只會走回原點！' },
  'map-1-1': { mini: '別碰我的孢子！只要吸一口，就會忘記自己來做什麼！', big: '這座谷是我編出來的美夢！誰准你們把它叫醒？' },
  'map-1-2': { mini: '我守著這座橋，真路假路都由我說了算！', big: '過橋的人都得留下影子！你們也不例外！' },
  'map-1-3': { mini: '別看泉水！我會讓你看見最不想記起的事！', big: '真相會刺痛人心，不如讓我替你們忘掉！' },
  'map-1-4': { mini: '祭壇的霧不能停！你們想讓追兵找到大家嗎？', big: '只要祭壇還亮著，整座森林就會繼續聽我的命令！' },
};
for (const [map, line] of Object.entries(BOSS_LINES)) {
  STORIES[`${map}-mini`] = [{ speaker: 'foe', text: line.mini }];
  STORIES[`${map}-big`] = [{ speaker: 'foe', text: line.big }];
}

// 劇情 id 依區域固定：原本六個區域沿用舊 id（存檔裡記錄看過哪些），新增的三區用自己的 id
const REGION_STORY_KEYS = ['0', '1', 'a2p', '2', 'b1p', '3', 'b2p', '4', '5'];
const storyKey = (regionIdx: number) => REGION_STORY_KEYS[regionIdx] ?? String(regionIdx);
export const regionStoryId = (regionIdx: number) => `region-${storyKey(regionIdx)}`;
export const clearStoryId = (regionIdx: number) => `clear-${storyKey(regionIdx)}`;

// 每張三星地圖的開場／通關劇情、區域魔王登場劇情的 id（沒有寫劇本的地圖就沒有）
export const mapStoryId = (regionIdx: number, mapIdx: number, part: 'intro' | 'clear' | 'mini' | 'big') => `map-${regionIdx}-${mapIdx}-${part}`;
export const bossStoryId = (regionIdx: number) => `boss-${regionIdx}-intro`;

// 劇情回顧的名稱
export function storyTitle(id: string, regionName: (idx: number) => string, mapName: (regionIdx: number, mapIdx: number) => string): string {
  if (id === 'prologue') return '序章';
  if (id === 'golden-ending') return '黃金之路・結局';
  const map = id.match(/^map-(\d+)-(\d+)-(intro|clear|mini|big)$/);
  if (map) return `${regionName(+map[1])}・${mapName(+map[1], +map[2])}・${{ intro: '開場', clear: '通關', mini: '小 BOSS', big: '大 BOSS' }[map[3]]}`;
  const boss = id.match(/^boss-(\d+)-intro$/);
  if (boss) return `${regionName(+boss[1])}・魔王登場`;
  const [kind, key] = id.split('-');
  const idx = REGION_STORY_KEYS.indexOf(key);
  return `${regionName(idx)}・${kind === 'region' ? '開場' : '通關'}`;
}
