// 主線劇情：失去家園的勇士，靠「古代咒語」（英文）奪回被沉默君王奪走語言的王國。
// {name} 會換成玩家主角的名字。

export type Speaker = 'narrator' | 'hero' | 'elder' | 'spirit' | 'villain' | 'smith' | 'pathfinder' | 'ferryman' | 'courier' | 'treeheart' | 'hunter'
  | 'forestkeeper' | 'forestchild' | 'mistwitch' | 'foe'
  | 'lightkeeper' | 'fisher' | 'diver' | 'seabeast'
  | 'caravan' | 'scribe' | 'pharaoh'
  | 'scout' | 'foreman' | 'dragonrock'
  | 'ranger' | 'chronicler' | 'icedragon'
  | 'signaler' | 'skykeeper' | 'griffin'
  | 'emberknight' | 'forgemaster' | 'flamelord'
  | 'royalguard';

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
  villain: { name: '沉默君王', icon: '👑' },
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
  // A2+ 碧藍海岸（ChatGPT 第十九輪）
  lightkeeper: { name: '燈塔守望人', icon: '🏮' },
  fisher: { name: '漁夫阿海', icon: '⚓' },
  diver: { name: '潛水員小嵐', icon: '🤿' },
  seabeast: { name: '深海巨獸', icon: '🐋' },
  // B1 黃金沙漠
  caravan: { name: '商隊領袖莎拉', icon: '🐪' },
  scribe: { name: '古碑學者阿努', icon: '📜' },
  pharaoh: { name: '流沙法老', icon: '👑' },
  // B1+ 赤岩峽谷
  scout: { name: '峽谷斥候琳恩', icon: '🦅' },
  foreman: { name: '礦工頭領巴洛', icon: '⛏️' },
  dragonrock: { name: '狂暴龍岩', icon: '🪨' },
  // B2 極光雪嶺
  ranger: { name: '雪原巡守雷克', icon: '🐺' },
  chronicler: { name: '守書學徒艾琳', icon: '❄️' },
  icedragon: { name: '冰霜巨龍', icon: '🐉' },
  // B2+ 雷鳴高原
  signaler: { name: '通信兵諾亞', icon: '⚡' },
  skykeeper: { name: '馴鳥師薇拉', icon: '🪶' },
  griffin: { name: '雷暴獅鷲', icon: '🦅' },
  // C1 熔岩魔域
  emberknight: { name: '灰燼騎士凱恩', icon: '🛡️' },
  forgemaster: { name: '老鍛匠赫菲', icon: '🔨' },
  flamelord: { name: '炎魔之王', icon: '🔥' },
  // C2 王城
  royalguard: { name: '無聲禁衛長', icon: '⚔️' },
  // 第 15 關小 BOSS、第 20 關大 BOSS 登場台詞的說話者
  foe: { name: '頭目', icon: '👹' },
};

export const STORIES: Record<string, StoryLine[]> = {
  prologue: [
    { speaker: 'narrator', text: '很久以前，王國的人民用「古代咒語」交談、唱歌、寫下歷史。' },
    { speaker: 'villain', text: '……太吵了。從今天起，這片土地不再需要任何語言。' },
    { speaker: 'narrator', text: '沉默君王奪走了王國的語言。文字消失、歌聲停止，王國四分五裂。' },
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
  // ---------- 前置區域「失語邊境｜最後的逃亡」（第十四、十六輪；docs/STORY.md） ----------
  'pre-intro': [
    { speaker: 'hero', text: '這裡怎麼回事？連酒館的招牌都變白了。' },
    { speaker: 'elder', text: '噓！小聲點。那些黑盔甲的傢伙，正在找還能唸出古代文字的人。' },
    { speaker: 'hero', text: '古代文字？你是說這個……Hello？' },
    { speaker: 'spirit', text: '哇啊！誰把我叫醒的？等等，你居然唸得出來？' },
  ],
  'pre-ally': [
    { speaker: 'spirit', text: '剛才那個字讓追兵的盔甲裂開了！我還以為真名魔法已經失傳了。' },
    { speaker: 'hero', text: '先別管魔法了，後面還有人追！你知道哪裡能逃嗎？' },
    { speaker: 'spirit', text: '知道！往東邊跑，穿過邊境就有一片大草原。至少那裡的空氣比較好聞！' },
  ],
  'pre-boss': [
    { speaker: 'hero', text: '你不是說這條路很安全嗎？前面怎麼還有一座哨站？' },
    { speaker: 'spirit', text: '我上次走這裡的時候，它還是空的！好吧……可能已經過了好幾十年。' },
    { speaker: 'hunter', text: '找到你了。把那隻精靈交出來，跟我們回王城。' },
    { speaker: 'hero', text: '如果我不答應呢？' },
  ],
  'pre-clear': [
    { speaker: 'hunter', text: '不可能……你明明只是個普通人，怎麼能使用真名？' },
    { speaker: 'spirit', text: '普通人才不會在逃命的時候還跟魔王軍頂嘴呢！' },
    { speaker: 'hero', text: '前面那道光就是出口？走吧。我可不想再被追一整晚。' },
    { speaker: 'spirit', text: '翠綠草原！我們終於到了。只是……這裡的樹，好像有點不對勁。' },
  ],
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
  'golden-ending': [
    { speaker: 'narrator', text: '沒有夥伴、沒有裝備、沒有轉職。只憑一路不曾說錯的古代咒語，你站在了沉默魔王面前。' },
    { speaker: 'villain', text: '區區一個初出茅廬的旅人……怎麼可能？' },
    { speaker: 'spirit', text: '因為真正的力量，從來都在語言本身。' },
    { speaker: 'narrator', text: '時空因你的咒語而震動。你跨越了所有試煉，成為傳說中的存在——' },
    { speaker: 'narrator', text: '【特殊結局】你獲得了稱號「掌握古代咒語的超時空勇者」！' },
  ],
  // ---------- A2+ 碧藍海岸（ChatGPT 第十九輪）
  // 主線：失聯漁船 → 燈塔被奪光 → 港口受困
  // → 發現寂靜鎖鏈 → 恢復潮汐神殿
  // → 找回回聲貝 → 解放深海巨獸

  // ===== 第 1 張：珊瑚灣 =====

  'map-2-0-intro': [
    { speaker: 'mistwitch', text: '霧只能送你們到這裡了。海上那片黑影……別急著相信第一眼看到的東西。' },
    { speaker: 'fisher', text: '你們是從森林來的？太好了！我們有三艘船沒回港，燈塔也整晚沒亮！' },
    { speaker: 'hero', text: '海灘上怎麼全是破帆？連珊瑚都變成灰色的了。' },
    { speaker: 'spirit', text: '等等，海底有東西在一下一下發光。那不像燈，倒像有誰正在把光拖走。' },
  ],

  'map-2-0-clear': [
    { speaker: 'fisher', text: '救生浮標找回來了！至少還有機會把落水的人救上岸。' },
    { speaker: 'spirit', text: '那些發光的痕跡一路通向燈塔岬，像是有人在海底拖著一條長長的鎖鏈。' },
    { speaker: 'hero', text: '先去燈塔看看。那些還在海上的人，不能一直等下去。' },
  ],

  // ===== 第 2 張：燈塔岬 =====

  'map-2-1-intro': [
    { speaker: 'lightkeeper', text: '我守這座燈塔三十年了，燈芯沒壞，鏡片也好好的，可光就是照不出去！' },
    { speaker: 'spirit', text: '塔底多了一道黑色符文。每次燈光亮起，符文就把光往海底送。' },
    { speaker: 'hero', text: '所以不是燈塔壞掉，是有人把它的光偷走了？' },
    { speaker: 'lightkeeper', text: '如果你能讓它亮一下就好，哪怕只有幾秒，迷路的船也有機會看見！' },
  ],

  'map-2-1-clear': [
    { speaker: 'lightkeeper', text: '亮了！真的亮了！快看，海上有船在用燈光回應我們！' },
    { speaker: 'fisher', text: '是我們的人！可是船都停在港口外面，好像有什麼東西不讓他們進來。' },
    { speaker: 'spirit', text: '黑色符文只是暫時停下來，光還是會被偷走。我們先去碼頭救人。' },
  ],

  // ===== 第 3 張：漁人碼頭 =====

  'map-2-2-intro': [
    { speaker: 'fisher', text: '船明明快靠岸了，卻突然被往後拉！你看，船底纏著那些黑色鐵鏈！' },
    { speaker: 'diver', text: '我試著下水解開它們，可水底的方向全亂了，連航海圖上的字都在消失。' },
    { speaker: 'hero', text: '先把岸邊的纜繩固定好，別讓船被拖走！' },
    { speaker: 'spirit', text: '退潮時鐵鏈會露出水面。先救人，再順著鐵鏈找它的源頭。' },
  ],

  'map-2-2-clear': [
    { speaker: 'diver', text: '船總算拉回來了！我還在船艙裡找到一本泡爛的航海日誌。' },
    { speaker: 'fisher', text: '最後一頁寫著「海蝕洞，退潮可入」。船長失蹤前一直在調查那裡。' },
    { speaker: 'hero', text: '那些鐵鏈不可能自己長出來。等潮退，我們進洞看看。' },
  ],

  // ===== 第 4 張：海蝕洞 =====

  'map-2-3-intro': [
    { speaker: 'diver', text: '小心腳下！洞裡的水忽然漲、忽然退，鐵鏈還會自己收緊。' },
    { speaker: 'hero', text: '這麼粗的鐵鏈，居然一路穿過整座岩壁……到底在綁什麼？' },
    { speaker: 'spirit', text: '我聽到聲音了。很低、很遠，像有人一直在說「放開我」。' },
    { speaker: 'diver', text: '這裡有條舊水道，通往潮汐神殿！也許那裡有控制鐵鏈的機關。' },
  ],

  'map-2-3-clear': [
    { speaker: 'diver', text: '固定在洞壁上的支鏈解開了！水流終於不再亂衝。' },
    { speaker: 'hero', text: '你們看，水退下去以後，岩壁後面居然露出一整排石階。' },
    { speaker: 'spirit', text: '石階上的符文還會發光。那個求救的聲音，就是從神殿另一邊傳來的。' },
  ],

  // ===== 第 5 張：潮汐神殿 =====

  'map-2-4-intro': [
    { speaker: 'lightkeeper', text: '我爺爺說過，這座神殿以前會傳出海獸的歌聲，提醒船隻哪裡有暗礁。' },
    { speaker: 'spirit', text: '難怪！可碑文被改了，原本的「引導歸航」變成了「封鎖海路」。' },
    { speaker: 'hero', text: '所以那頭巨獸不是在攻擊船隻，是有人利用鎖鏈逼牠這麼做？' },
    { speaker: 'diver', text: '神殿能讓水道恢復正常，但要把歌聲送出去，還缺一枚被沖到貝殼沙灘的回聲貝。' },
  ],

  'map-2-4-clear': [
    { speaker: 'lightkeeper', text: '潮汐鐘響了！好多年沒聽過這個聲音，我還以為它永遠不會再響了。' },
    { speaker: 'diver', text: '水流恢復了！下一次退潮，通往深海裂口的沙路就會露出來。' },
    { speaker: 'spirit', text: '還差最後一個聲音。去貝殼沙灘，把能傳到海底的回聲貝找回來！' },
  ],

  // ===== 第 6 張：貝殼沙灘 =====

  'map-2-5-intro': [
    { speaker: 'fisher', text: '整片沙灘都是貝殼！你們要找的到底是哪一顆？' },
    { speaker: 'hero', text: '等一下……其他貝殼都沒聲音，只有遠處那顆一直跟著海浪震動。' },
    { speaker: 'spirit', text: '就是它！上面刻著殘缺的真名符文。它一直在替海底的巨獸求救。' },
    { speaker: 'lightkeeper', text: '可是魔王軍守住了最後一條沙路。要去深海裂口，就得先打敗那些守衛。' },
  ],

  'map-2-5-clear': [
    { speaker: 'fisher', text: '聽見了嗎？回聲貝真的唱起來了！整片海都在跟著震動！' },
    { speaker: 'spirit', text: '有回應！是海底那頭巨獸！牠聽到我們了！' },
    { speaker: 'hero', text: '沙路已經露出來了。這次我們不只要救漁船，還要把牠一起救出來。' },
  ],

  // ===== 區域魔王：深海裂口／深海巨獸 =====

  'boss-2-intro': [
    { speaker: 'seabeast', text: '離……開……海……不准……通過……' },
    { speaker: 'lightkeeper', text: '不對！我小時候聽過牠唱歌，牠還幫我們避開暗礁。牠以前不是這樣的！' },
    { speaker: 'spirit', text: '看牠身上的鎖鏈！每一節都刻著「封鎖」的命令，連牠的聲音都被奪走了。' },
    { speaker: 'hero', text: '難怪海嘯一直衝過來……鎖鏈正在逼牠攻擊所有靠近的船！' },
    { speaker: 'seabeast', text: '別……靠近……我……控制不了……' },
    { speaker: 'hero', text: '我們不是來傷害你的！撐住，我們會打斷那些鎖鏈！' },
  ],

  // ===== A2+ 區域通關 =====
  // 注意：請替換 STORIES 內既有的 clear-a2p

  'clear-a2p': [
    { speaker: 'seabeast', text: '我……終於聽見自己的聲音了。那些鎖鏈，是王城送來的，封印卻來自黃沙深處。' },
    { speaker: 'lightkeeper', text: '燈塔終於亮了！快看，失聯的漁船正一艘接著一艘回港！' },
    { speaker: 'hero', text: '來自沙漠的封印？誰會把那種東西拿來鎖住海獸？' },
    { speaker: 'spirit', text: '黃金沙漠的流沙法老，守著一座藏滿失落文字的金字塔。也許那裡有答案。' },
  ],

  // ---------- B1 黃金沙漠（regionIdx = 3） ----------
  'region-2': [
    { speaker: 'spirit', text: '熱死我了！這片黃金沙漠連風裡都混著古文字的沙粒！' },
    { speaker: 'hero', text: '深海巨獸說，鎖住牠的封印就來自這片黃沙深處。' },
    { speaker: 'spirit', text: '這裡的真名講究承諾與條理，說清楚才能看穿海市蜃樓！' },
    { speaker: 'hero', text: '走吧，先去前面的綠洲打聽金字塔的下落。' },
  ],
  'map-3-0-intro': [
    { speaker: 'caravan', text: '都別搶！再拔刀相向，這口泉水誰也別想喝！' },
    { speaker: 'hero', text: '發生什麼事了？大家怎麼圍著一口井吵成這樣？' },
    { speaker: 'caravan', text: '井邊的分水盟約碑變白了，沒人記得誰先取水！' },
    { speaker: 'spirit', text: '交給我們！只要喚醒碑上的契約真名，規矩就會回來！' },
  ],
  'map-3-0-clear': [
    { speaker: 'caravan', text: '碑文亮了！各商隊照舊例輪流取水，總算不吵了！' },
    { speaker: 'hero', text: '你們看，井底浮起半塊刻著黃沙王冠的封印石。' },
    { speaker: 'caravan', text: '那是沙暴城的古印！正巧我要押貨進城，一起走吧！' },
  ],
  'map-3-1-intro': [
    { speaker: 'caravan', text: '怪了，貨單上的數量與期限怎麼全變成了亂碼？' },
    { speaker: 'spirit', text: '不只貨單！前面連路牌都被海市蜃樓複製成三個了！' },
    { speaker: 'hero', text: '走錯一步就會陷進沙坑。先把正確的紀錄拼回來！' },
  ],
  'map-3-1-clear': [
    { speaker: 'caravan', text: '好險有你讀出正確路線，整隊駱駝都平安過關了！' },
    { speaker: 'spirit', text: '看怪物掉的通行令，魔王軍剛運走一批空白封印石！' },
    { speaker: 'hero', text: '目的地就寫著沙暴城。我們加快腳步跟上去！' },
  ],
  'map-3-2-intro': [
    { speaker: 'scribe', text: '別關市集啊！城牆上那道禁令根本不是古法老寫的！' },
    { speaker: 'caravan', text: '阿努，怎麼回事？整座沙暴城連買賣都不准做了？' },
    { speaker: 'scribe', text: '有人用海市蜃樓偽造王令，把真正的古碑全搬走了！' },
    { speaker: 'hero', text: '先拆穿假王令，讓大家冷靜下來再問清楚。' },
  ],
  'map-3-2-clear': [
    { speaker: 'scribe', text: '假王令散去了！難得見到還能讀懂古通用語的旅人！' },
    { speaker: 'hero', text: '我們在查海底寂靜鎖鏈上的沙漠封印，你知道來源嗎？' },
    { speaker: 'scribe', text: '那是日落神殿的秘術！走地下古水道能避開沙暴過去！' },
  ],
  'map-3-3-intro': [
    { speaker: 'spirit', text: '嗚哇！這條古水道怎麼到處都是比臉還大的毒蠍子！' },
    { speaker: 'scribe', text: '水道乾涸很久了，岩壁上還留著百年前的盟約壁畫。' },
    { speaker: 'hero', text: '壁畫上……穿黑袍的使者撕毀了盟約，綠洲也跟著枯了？' },
    { speaker: 'spirit', text: '等等，角落那枚封蠟圖案……我頭好痛，好像在哪裡蓋過它！' },
  ],
  'map-3-3-clear': [
    { speaker: 'hero', text: '露米，妳還好嗎？剛才妳看著那枚封蠟發呆了好久。' },
    { speaker: 'spirit', text: '我想起一點點了……那是王城「真名記錄院」的印記！' },
    { speaker: 'scribe', text: '前面就是水道出口，日落神殿已經在望了！' },
  ],
  'map-3-4-intro': [
    { speaker: 'scribe', text: '神殿裡那些祭司，正在把沙漠封印刻進王城的黑鐵！' },
    { speaker: 'hero', text: '所以流沙法老不是被魔王軍抓走，而是在幫他們？' },
    { speaker: 'spirit', text: '祭壇上有一卷密約！打退守衛，我們看看到底寫了什麼！' },
  ],
  'map-3-4-clear': [
    { speaker: 'scribe', text: '密約上寫著……法老主動獻出封印術，換王城不碰金字塔！' },
    { speaker: 'hero', text: '為了保護石碑不被濫用，卻害外面的海獸與商隊受苦？' },
    { speaker: 'spirit', text: '太自私了！去金字塔當面把這筆帳算清楚！' },
  ],
  'map-3-5-intro': [
    { speaker: 'pharaoh', text: '止步吧，異鄉人。再往前，流沙會吞沒一切虛妄之言。' },
    { speaker: 'caravan', text: '那是法老的海市蜃樓！小心，真路藏在假影後面！' },
    { speaker: 'hero', text: '把文字鎖進墳墓不叫守護。我們今天一定要見你一面！' },
  ],
  'map-3-5-clear': [
    { speaker: 'caravan', text: '漂亮！連環海市蜃樓都被你的真名劈開了！' },
    { speaker: 'scribe', text: '金字塔的大門正在打開，真正的流沙法老就在裡面。' },
    { speaker: 'spirit', text: '他的分身術很狡猾，等一下每一句話都要穩穩接住喔！' },
  ],
  'boss-3-intro': [
    { speaker: 'pharaoh', text: '百年前，外人用華麗的誓言騙走水源，讓綠洲化為白骨。' },
    { speaker: 'pharaoh', text: '從那之後本王便明白了——語言留在活人嘴裡，只會生出背叛！' },
    { speaker: 'hero', text: '所以你把古碑鎖進金字塔，還拿封印去鎖住無辜的海獸？' },
    { speaker: 'scribe', text: '陛下！沒有契約與文字，城裡的子民連彼此都不敢相信了！' },
    { speaker: 'spirit', text: '他召出海市蜃樓分身了！連續看破假象，別被他騙倒！' },
    { speaker: 'pharaoh', text: '那就用你們的真名證明，活人的承諾比石碑更可靠吧！' },
  ],
  'clear-2': [
    { speaker: 'pharaoh', text: '分身盡碎……你說出的每個字，竟真的沒有半點動搖。' },
    { speaker: 'pharaoh', text: '本王錯了。把文字鎖進死墓，守住的只是本王自己的恐懼。' },
    { speaker: 'hero', text: '把石碑還給沙漠吧。你知道王城那些黑鐵是從哪運來的嗎？' },
    { speaker: 'pharaoh', text: '北方赤岩峽谷。那裡的山神被鑿去真名，已經徹底狂暴了。' },
  ],

  // ---------- B1+ 赤岩峽谷（regionIdx = 4） ----------
  'region-b1p': [
    { speaker: 'spirit', text: '哇——哇——咦？峽谷的回音怎麼把我的話倒過來唸了！' },
    { speaker: 'hero', text: '岩壁上有干擾符文，話只要說得太零碎，意思就會被扭曲。' },
    { speaker: 'spirit', text: '那就要把「誰、做了什麼」接成完整句子！一步都不能亂喔！' },
  ],
  'map-4-0-intro': [
    { speaker: 'scout', text: '別過來——不對！我是喊「快過來幫忙」啊！' },
    { speaker: 'spirit', text: '看吧，連求救聲都被這座隘口的怪回音改成反話了！' },
    { speaker: 'hero', text: '我聽懂她的求救了。先把圍住她的岩怪清掉！' },
  ],
  'map-4-0-clear': [
    { speaker: 'scout', text: '得救了！我是斥候琳恩，謝謝你們沒被假回音騙走！' },
    { speaker: 'hero', text: '我們要借道峽谷往北走，聽說前面的山路斷了？' },
    { speaker: 'scout', text: '是山神「龍岩」發狂砸斷的。先跟我回鎮上找巴洛大叔吧！' },
  ],
  'map-4-1-intro': [
    { speaker: 'hero', text: '拱門石壁上刻著好多盾牌與名字，和我們召喚的英雄好像！' },
    { speaker: 'spirit', text: '這裡是古代英雄立下「真名契約」的誓言拱門！' },
    { speaker: 'scout', text: '魔王軍最近常來刮掉上面的字母，連風聲聽著都像在哭。' },
    { speaker: 'hero', text: '英雄們借給我們力量，我們絕不能讓他們的名字在這裡消失。' },
  ],
  'map-4-1-clear': [
    { speaker: 'spirit', text: '石壁發光了！身邊的英雄們好像也在跟拱門打招呼呢！' },
    { speaker: 'scout', text: '真神奇，風穿過拱門的聲音終於變回原本的曲調了。' },
    { speaker: 'hero', text: '前面就是礦坑小鎮，去問問龍岩為什麼會突然發狂。' },
  ],
  'map-4-2-intro': [
    { speaker: 'foreman', text: '氣死我了！傳聲銅管一響，底下兄弟全聽成反方向啦！' },
    { speaker: 'scout', text: '巴洛大叔別急，這位旅人能用完整古語壓住亂響！' },
    { speaker: 'foreman', text: '真的？那快幫我對著主礦坑喊話，把兄弟們引出來！' },
  ],
  'map-4-2-clear': [
    { speaker: 'foreman', text: '兄弟們全平安出坑了！旅人，算我巴洛欠你一條命！' },
    { speaker: 'hero', text: '大叔，魔王軍逼你們挖的黑鐵，跟龍岩發狂有關嗎？' },
    { speaker: 'foreman', text: '他們挖光吞聲黑鐵還不夠，竟把龍岩胸口的真名碑鑿碎了！' },
    { speaker: 'spirit', text: '難怪牠會失控！只要找回碑片拼出真名，一定能救牠！' },
  ],
  'map-4-3-intro': [
    { speaker: 'scout', text: '當時爆炸飛散的第一塊名碑，就卡在峭壁的鷹巢旁！' },
    { speaker: 'spirit', text: '好高！往下看腿都軟了……等等，我有翅膀幹嘛怕摔下去？' },
    { speaker: 'hero', text: '別貧嘴了，魔王軍的巡邏隊也在搶那塊石碑，快上！' },
  ],
  'map-4-3-clear': [
    { speaker: 'scout', text: '拿到第一塊殘碑了！你們看，背面還有一行小字。' },
    { speaker: 'spirit', text: '「真名記錄院核定」……這行小字的筆跡，竟然是我自己寫的！' },
    { speaker: 'hero', text: '妳以前真的在王城管過天下真名！另一塊殘碑在哪裡？' },
    { speaker: 'scout', text: '被魔王軍帶去赤焰祭壇了，他們想用火把它融掉！' },
  ],
  'map-4-4-intro': [
    { speaker: 'foreman', text: '看那座黑鐵爐！再晚一步，殘碑就要被燒成鐵水了！' },
    { speaker: 'hero', text: '這些吞聲黑鐵，和碧藍海岸的寂靜鎖鏈是一模一樣的材質。' },
    { speaker: 'spirit', text: '原來鎖鏈的原料就是從這裡搶走的！快把爐火停下來！' },
  ],
  'map-4-4-clear': [
    { speaker: 'foreman', text: '好險趕上了！兩塊殘碑合起來，正好拼出一半的真名！' },
    { speaker: 'hero', text: '剛剛頭目提到「熔岩魔域」，看來那裡才是打造鎖鏈的總工廠。' },
    { speaker: 'scout', text: '地面又在震了！龍岩正往斷崖棧道衝過去，那裡還有人！' },
  ],
  'map-4-5-intro': [
    { speaker: 'foreman', text: '棧道快被震斷了！落石一直砸下來，一個人根本撐不住！' },
    { speaker: 'hero', text: '那就別一個人硬扛！大家互相呼應，有人被震開就立刻拉回來！' },
    { speaker: 'spirit', text: '沒錯！真名契約本來就是把夥伴連在一起的力量，衝啊！' },
  ],
  'map-4-5-clear': [
    { speaker: 'foreman', text: '哈哈！你們剛才那記連攜配合，連落石都被劈成兩半了！' },
    { speaker: 'scout', text: '最後一塊碑片就在前面的石林迷陣，龍岩的吼聲越來越近了。' },
    { speaker: 'hero', text: '撐住啊，龍岩。我們馬上把你的名字帶回去。' },
  ],
  'map-4-6-intro': [
    { speaker: 'spirit', text: '四面八方都是石柱，龍岩的哭喊聲在裡面撞來撞去，好難受……' },
    { speaker: 'hero', text: '牠不是想毀掉峽谷，只是痛得忘記自己該守護什麼了。' },
    { speaker: 'scout', text: '第三塊碑片就在陣心！拼齊之後，就去深淵喚醒牠！' },
  ],
  'map-4-6-clear': [
    { speaker: 'spirit', text: '三塊殘碑拼齊了！是「GUARDIAN」——守護峽谷的誓約之名！' },
    { speaker: 'foreman', text: '深淵的石門震開了，龍岩就在底下槌打岩壁。' },
    { speaker: 'hero', text: '等牠震飛我們時，靠連攜穩住陣腳，把真名喊進牠心口！' },
  ],
  'boss-4-intro': [
    { speaker: 'dragonrock', text: '痛……好痛……胸口空空的……我是誰……全部滾開！' },
    { speaker: 'foreman', text: '山神大人，醒醒啊！我們不是拿鑿子害你的魔王軍！' },
    { speaker: 'spirit', text: '牠痛到什麼都聽不進去，一拳就能把人震飛出去！' },
    { speaker: 'hero', text: '不管被震開幾次，夥伴之間只要連攜出手，就能彼此拉回來！' },
    { speaker: 'dragonrock', text: '別靠近……再靠近……連你們一起砸碎！' },
    { speaker: 'hero', text: '看著這塊石碑！我們這就把你的真名還給你！' },
  ],
  'clear-b1p': [
    { speaker: 'dragonrock', text: '這個聲音……我想起來了。我是守望山嶽與誓言的巨岩。' },
    { speaker: 'foreman', text: '看啊！龍岩把自己的肩膀搭在深淵上，替你們鋪出北上的橋了！' },
    { speaker: 'spirit', text: '我也想起來了！記載寂靜之幕秘密的《萬名總錄》，就在雪嶺！' },
    { speaker: 'hero', text: '極光雪嶺……謝謝你，龍岩。我們繼續往北走！' },
  ],

  // ---------- B2 極光雪嶺（regionIdx = 5） ----------
  'region-3': [
    { speaker: 'hero', text: '好冷！剛才呼出的一口氣，怎麼連聲音都差點結成冰渣？' },
    { speaker: 'spirit', text: '極光雪嶺的寒氣會凍住猶豫的話語，只有精準的真名點得著火！' },
    { speaker: 'hero', text: '為了找回《萬名總錄》和妳的記憶，這點風雪擋不住我們。' },
  ],
  'map-5-0-intro': [
    { speaker: 'ranger', text: '外地人？快退回去，前面連路標都被冰霜巨龍凍封了！' },
    { speaker: 'hero', text: '我們正是來找冰龍與王國史書的。你是這附近的居民？' },
    { speaker: 'ranger', text: '我是巡守雷克。自從冰龍降下寒霧，村裡好多人連往事都忘了！' },
    { speaker: 'spirit', text: '奇怪，冰龍以前明明很溫柔的……先穿過冰原去看看！' },
  ],
  'map-5-0-clear': [
    { speaker: 'ranger', text: '好厲害！你每唸出一句真名，周圍的寒霧就退開一圈！' },
    { speaker: 'spirit', text: '你看天上那道綠光，順著極光坡往上爬，就是通往龍巢的路。' },
    { speaker: 'hero', text: '雷克，帶路吧。我們幫你問清楚冰龍到底在想什麼。' },
  ],
  'map-5-1-intro': [
    { speaker: 'spirit', text: '抬頭看！極光裡面有好多細小的金色字母在流動耶！' },
    { speaker: 'ranger', text: '長輩說，那是以前人們立下的誓言，被凍在天幕裡了。' },
    { speaker: 'hero', text: '但山坡上有魔王軍的腳印——他們也在找那本《萬名總錄》！' },
  ],
  'map-5-1-clear': [
    { speaker: 'ranger', text: '原來魔王軍一直在圍攻雪嶺！難怪冰龍把山路全封死了！' },
    { speaker: 'hero', text: '如果真是為了擋住魔王軍，牠為什麼連村民的記憶也凍住？' },
    { speaker: 'spirit', text: '前面冰晶洞裡有古龍留下的冰碑，進去讀讀看就知道！' },
  ],
  'map-5-2-intro': [
    { speaker: 'hero', text: '整座山洞就像一座透明書庫，冰柱裡封著好多舊書頁！' },
    { speaker: 'spirit', text: '我來讀讀看……「王城大亂，假詔書四起，昔日賢王一夜白頭」？' },
    { speaker: 'ranger', text: '賢王？那不就是後來的沉默君王嗎？他以前竟是好國王？' },
    { speaker: 'hero', text: '冰層裡還有魔王軍的伏兵，先清場再繼續讀！' },
  ],
  'map-5-2-clear': [
    { speaker: 'spirit', text: '後面幾頁被抽走了，只寫著「總錄交予冰龍，非真名者莫開」。' },
    { speaker: 'ranger', text: '穿過外面的雪狼原，就是半山腰的冰龍巢穴！' },
    { speaker: 'hero', text: '去龍巢看看，剩下的書頁一定就在牠手裡。' },
  ],
  'map-5-3-intro': [
    { speaker: 'ranger', text: '小心！狼群被魔王軍的黑冰刺傷，變得敵我不分了！' },
    { speaker: 'hero', text: '別傷牠們性命，用真名震碎牠們身上的黑冰就好！' },
    { speaker: 'spirit', text: '風雪越來越大了，說話千萬別結巴，一口氣連貫唸出來！' },
  ],
  'map-5-3-clear': [
    { speaker: 'ranger', text: '頭狼安靜下來了！牠在蹭你的手，想替我們帶路去龍巢！' },
    { speaker: 'spirit', text: '嘿嘿，看來連雪狼都聽得出誰說的話才有溫度！' },
    { speaker: 'hero', text: '冰龍巢穴就在前面，大家打起精神！' },
  ],
  'map-5-4-intro': [
    { speaker: 'hero', text: '奇怪……整座冰龍巢穴空蕩蕩的，根本沒有龍，只有一面冰鏡？' },
    { speaker: 'spirit', text: '這面冰鏡……啊！裡面映出來的人，怎麼是還沒變小的我？！' },
    { speaker: 'ranger', text: '鏡子裡的精靈抱著一本大書，正在拜託冰龍做什麼事！' },
    { speaker: 'hero', text: '先擊退追進巢穴的魔物，把整段記憶看完！' },
  ],
  'map-5-4-clear': [
    { speaker: 'spirit', text: '全都想起來了……當年是我求冰龍凍住我的記憶，好躲過追兵搜魂！' },
    { speaker: 'hero', text: '難怪追獵隊長一開始就指名要抓妳！那冰龍現在去哪了？' },
    { speaker: 'ranger', text: '鏡子最後照出的是山下的「霜之村」！牠去守著我們村子了！' },
  ],
  'map-5-5-intro': [
    { speaker: 'chronicler', text: '雷克哥！還有露米大人，妳終於回來履行當年的約定了！' },
    { speaker: 'ranger', text: '艾琳！我還以為冰龍害了村子，原來牠一直在村外擋魔王軍？' },
    { speaker: 'chronicler', text: '是啊，為了不讓追兵從村民腦中搜出總錄下落，牠才暫封記憶。' },
    { speaker: 'spirit', text: '可是村外的寒氣失控了！先幫艾琳把攻進村口的魔物擋住！' },
  ],
  'map-5-5-clear': [
    { speaker: 'chronicler', text: '謝謝你們！冰龍大人把《萬名總錄》沉在冰湖底的王座了。' },
    { speaker: 'chronicler', text: '但牠撐了幾十年，心智快被寂靜寒毒吞沒，只認得試煉的規則！' },
    { speaker: 'hero', text: '那就照約定通過牠的試煉，把史書和冰龍一起救回來！' },
  ],
  'map-5-6-intro': [
    { speaker: 'spirit', text: '整座冰湖厚得像水晶一樣，底下那座發光的宮殿就是冰龍王座！' },
    { speaker: 'chronicler', text: '冰龍大人的極寒領域會讓人連思考都結冰，千萬不能停下連擊！' },
    { speaker: 'hero', text: '放心，我們一路練出來的真名，早就熱得能融化堅冰了！' },
  ],
  'map-5-6-clear': [
    { speaker: 'ranger', text: '冰面裂開階梯了！湖底升起了一座巨大的冰晶王座！' },
    { speaker: 'spirit', text: '冰龍就在上面……牠的眼睛被黑冰蓋住一半，正在硬撐著等我們！' },
    { speaker: 'hero', text: '走吧。用最精準、最熾熱的真名，替牠解開這場百年的守望！' },
  ],
  'boss-5-intro': [
    { speaker: 'icedragon', text: '露米……妳終於帶人來了。寒毒已入我骨，我壓不住這場暴雪了。' },
    { speaker: 'spirit', text: '冰龍！對不起讓祢等這麼久，我們這就幫祢把寒毒逼出來！' },
    { speaker: 'icedragon', text: '休談私情！這是妳當年親定的鐵律——畏寒遲疑者，不配翻開總錄！' },
    { speaker: 'hero', text: '我明白。如果連你的極寒都撐不過，我們也救不了王城！' },
    { speaker: 'spirit', text: '極寒領域展開了！時間很短，用連續不斷的真名點燃熱能吧！' },
    { speaker: 'icedragon', text: '來吧，旅人！讓吾看看，你的話語究竟有沒有融化寒冬的份量！' },
  ],
  'clear-3': [
    { speaker: 'icedragon', text: '好一股溫暖的真名之火……百年的寒毒，終於散盡了。' },
    { speaker: 'spirit', text: '《萬名總錄》解封了！上面寫著，寂靜之幕靠高原斷訊與魔域熔爐維持！' },
    { speaker: 'icedragon', text: '沉默君王曾因謊言引發的戰火失去至親，才想抹去世間所有語言。' },
    { speaker: 'hero', text: '先上雷鳴高原重啟通訊，再去熔岩魔域關掉熔爐！謝謝祢，冰龍！' },
  ],

  // ---------- B2+ 雷鳴高原（regionIdx = 6） ----------
  'region-b2p': [
    { speaker: 'spirit', text: '哇啊啊！我的頭髮全豎起來了！這裡連隨便開口都會引來閃電！' },
    { speaker: 'hero', text: '這座雷鳴高原就是王國以前的傳訊中樞，現在全被雷雲封死了。' },
    { speaker: 'spirit', text: '這裡的真名要能推論「如果……就會……」，說得夠嚴謹才不怕落雷！' },
  ],
  'map-6-0-intro': [
    { speaker: 'signaler', text: '趴下！別在空曠處大喊，雷暴獅鷲的巡邏雷會劈下來的！' },
    { speaker: 'hero', text: '好險！謝謝你提醒。你是守在這裡的通信兵？' },
    { speaker: 'signaler', text: '我是諾亞。自從獅鷲奉王城命令封鎖天空，高原已經失聯好幾年了。' },
    { speaker: 'spirit', text: '難怪各地都不知道彼此的消息！先跟諾亞躲進前面的哨塔！' },
  ],
  'map-6-0-clear': [
    { speaker: 'signaler', text: '你們居然能一邊避開靜電、一邊用真名打散雷獸！' },
    { speaker: 'hero', text: '前面那座高塔就是你的駐地嗎？天線好像被黑鐵纏住了。' },
    { speaker: 'signaler', text: '那是風暴哨塔，裡面還堆著全國各地沒送出去的信呢！' },
  ],
  'map-6-1-intro': [
    { speaker: 'hero', text: '滿屋子都是信袋……草原、迷霧森林、碧藍海岸、黃金沙漠都有！' },
    { speaker: 'signaler', text: '是啊，有人報平安、有人求救，卻全被獅鷲攔在這裡發不出去。' },
    { speaker: 'spirit', text: '先把哨塔頂端的共鳴水晶修好，至少讓收訊恢復正常！' },
  ],
  'map-6-1-clear': [
    { speaker: 'signaler', text: '收訊燈亮了！但發訊波還是被東邊的電光石林吸走了。' },
    { speaker: 'hero', text: '雷暴獅鷲為什麼這麼痛恨傳訊？連報平安的家書都不放過？' },
    { speaker: 'signaler', text: '去電光石林看看舊戰場的石碑，你們就會明白牠的心結了。' },
  ],
  'map-6-2-intro': [
    { speaker: 'spirit', text: '這些導雷石柱上刻著戰史……「一封偽造的急報，引兩軍決戰於峽谷」。' },
    { speaker: 'signaler', text: '那場仗死了三千人，連傳信的雷鳥也摔死了大半。' },
    { speaker: 'hero', text: '如果當時有人能查證真偽，悲劇就不會發生……但封鎖天空不是辦法。' },
  ],
  'map-6-2-clear': [
    { speaker: 'spirit', text: '石林的導雷針轉向了，前面傳來鳥鳴聲，好像有人受困！' },
    { speaker: 'signaler', text: '是馴鳥師薇拉的方向！她一直在雷鳥巢保護僅存的信使鳥！' },
    { speaker: 'hero', text: '快過去幫忙，別讓魔王軍傷到她們！' },
  ],
  'map-6-3-intro': [
    { speaker: 'skykeeper', text: '別碰那孩子！牠翅膀都受傷了，你們還想抓牠去王城嗎！' },
    { speaker: 'hero', text: '別怕，我們不是魔王軍。先幫妳把這些鐵網拆掉！' },
    { speaker: 'spirit', text: '你看那隻小雷鳥，爪子裡還死死抓著一個舊信筒耶！' },
  ],
  'map-6-3-clear': [
    { speaker: 'skykeeper', text: '謝謝你們！這信筒裡裝的，是當年大戰時遲到一步的「停戰詔書」。' },
    { speaker: 'hero', text: '原來當年也有人拼命想阻止戰爭，只是被風暴耽誤了。' },
    { speaker: 'skykeeper', text: '只要拆掉天雷祭壇的干擾陣，風車高地就能把各地重新連起來！' },
  ],
  'map-6-4-intro': [
    { speaker: 'signaler', text: '就是這座祭壇！它會把所有傳出去的句子拆得支離破碎！' },
    { speaker: 'spirit', text: '哼哼，這種干擾陣最怕邏輯嚴密的長句了，看我們一題題拆掉它！' },
    { speaker: 'hero', text: '拆掉干擾陣之後，就去風車高地向全國發訊！' },
  ],
  'map-6-4-clear': [
    { speaker: 'signaler', text: '干擾陣停了！天空的雷雲裂開了一道縫！' },
    { speaker: 'skykeeper', text: '雷鳥們也準備好了，快去風車高地轉動共鳴風帆！' },
    { speaker: 'hero', text: '走！讓一路上幫過我們的大家，聽見彼此平安的聲音！' },
  ],
  'map-6-5-intro': [
    { speaker: 'spirit', text: '好壯觀！一整排巨型風車連接著雲端，比草原那座大上十倍！' },
    { speaker: 'signaler', text: '只要注入真名轉動主風車，六大區域的哨站都會同時收到訊號！' },
    { speaker: 'hero', text: '魔王軍的主力追來了。大家守住控制台，我來啟動風車！' },
  ],
  'map-6-5-clear': [
    { speaker: 'signaler', text: '連上了！海岸燈塔、迷霧森林、沙暴城、礦鎮和霜之村全回應了！' },
    { speaker: 'spirit', text: '哇！洛恩、莎拉還有巴洛大叔都在替我們加油耶！好感動喔！' },
    { speaker: 'skykeeper', text: '糟了，雷暴獅鷲發現通訊重啟，親自降下雷牆封住閃電峽了！' },
    { speaker: 'hero', text: '帶上那封停戰詔書，我們去閃電峽會會牠！' },
  ],
  'map-6-6-intro': [
    { speaker: 'griffin', text: '愚蠢的旅人！你們重新接通天際，是想讓戰火的謠言再次蔓延嗎！' },
    { speaker: 'hero', text: '剛才傳遍全國的不是謠言，是各地互相報平安與支援的聲音！' },
    { speaker: 'spirit', text: '牠不肯聽！小心峽谷裡的連鎖靜電，答穩了就能一口氣衝過去！' },
  ],
  'map-6-6-clear': [
    { speaker: 'skykeeper', text: '雷牆破開了！諾亞，我們留在這裡守住全國的通訊線！' },
    { speaker: 'signaler', text: '前面雲海平台直通獅鷲天巢，把那封遲到的信親手交給牠吧！' },
    { speaker: 'hero', text: '包在我們身上。天空本來就該屬於自由飛翔的聲音！' },
  ],
  'map-6-7-intro': [
    { speaker: 'spirit', text: '穿過黑雲了！腳下是一整片金白色的雲海，遠處看得到浮空王城耶！' },
    { speaker: 'hero', text: '王城外圍還罩著一層厚厚的灰幕，那就是「寂靜之幕」吧。' },
    { speaker: 'spirit', text: '對！先贏過天巢裡的雷暴獅鷲，就能找到衝進熔岩魔域的路！' },
  ],
  'map-6-7-clear': [
    { speaker: 'spirit', text: '天巢的大門開了！雷暴獅鷲正展開雙翼等在風暴正中央！' },
    { speaker: 'hero', text: '牠身上的靜電會在我們失誤時越疊越重，一題都不能慌。' },
    { speaker: 'spirit', text: '深呼吸——把我們學會的所有可能性，清清楚楚告訴牠！' },
  ],
  'boss-6-intro': [
    { speaker: 'griffin', text: '當年若沒有烽火傳送假軍令，那三千將士與我的雷鳥何至於死！' },
    { speaker: 'hero', text: '看看這封雷鳥護到最後的信吧——當年也有人拼命想傳遞「停戰」！' },
    { speaker: 'griffin', text: '停戰詔書……？怎麼可能，當年我明明只看見漫天戰報……' },
    { speaker: 'spirit', text: '因為假話跑得快，你就把所有說真話的路也劈斷，這樣太不公平了！' },
    { speaker: 'griffin', text: '住口！若你們的語言真能承受雷霆而不出差錯，就正面接下我的天雷！' },
    { speaker: 'hero', text: '好！我們就用毫無破綻的真名，替這片天空洗刷冤屈！' },
  ],
  'clear-b2p': [
    { speaker: 'griffin', text: '靜電散盡了……原來當年那群孩子拼死想送出的，竟是和平嗎。' },
    { speaker: 'hero', text: '只要人們還能互相確認、彼此傾聽，謠言就沒那麼容易得逞。' },
    { speaker: 'griffin', text: '是我太過武斷了。乘著我的上升氣流走吧，直取地底的熔岩魔域！' },
    { speaker: 'spirit', text: '支撐寂靜之幕的最後一座能源熔爐，就在炎魔之王手裡，出發！' },
  ],

  // ---------- C1 熔岩魔域（regionIdx = 7） ----------
  'region-4': [
    { speaker: 'spirit', text: '好燙好燙！這裡飄的不是普通火山灰，全是被燒焦的字母殘影！' },
    { speaker: 'villain', text: '走到熔爐前了嗎？無妨，你們學會的字句，正好拿來添火。' },
    { speaker: 'hero', text: '不管是黑石還是鎖鏈都出自這裡。今天我們就把這座爐子停下來！' },
  ],
  'map-7-0-intro': [
    { speaker: 'hero', text: '岩漿往上升騰的煙霧裡，好像有無數細小的聲音在嘆氣。' },
    { speaker: 'spirit', text: '那是從全國各地抽走的話語，正順著管道送進地底熔爐當燃料！' },
    { speaker: 'emberknight', text: '站住！……不，你們不是王城督軍，是來關掉熔爐的旅人？' },
    { speaker: 'hero', text: '如果你不想再看著無辜的聲音被燒掉，就告訴我們路怎麼走！' },
  ],
  'map-7-0-clear': [
    { speaker: 'emberknight', text: '好鋒利的真名！我是騎士凱恩，實在看不慣王城拿百姓的記憶燒火。' },
    { speaker: 'spirit', text: '前面那座黑曜石塔一直在冒紫黑色的煙，味道跟草原的黑石好像！' },
    { speaker: 'emberknight', text: '沒錯，那裡就是壓製「命令黑石」的工坊，跟我來！' },
  ],
  'map-7-1-intro': [
    { speaker: 'hero', text: '整座塔裡全是一排排黑石……困住草原巨樹的石頭就是這裡造的！' },
    { speaker: 'spirit', text: '可惡！他們把抽乾聲音後的殘渣壓成黑石，再送去各地控制守護者！' },
    { speaker: 'emberknight', text: '砸毀中央壓石機，各地殘留的黑石就再也收不到魔力了！' },
  ],
  'map-7-1-clear': [
    { speaker: 'spirit', text: '壓石機碎啦！這下幻影魔女和草原的居民再也不用怕黑石作怪了！' },
    { speaker: 'hero', text: '那鎖住深海巨獸的「寂靜鎖鏈」呢？也是在附近打造的嗎？' },
    { speaker: 'emberknight', text: '渡過地底大河就是「鍛造之城」，所有鎖鏈都出自那裡。' },
  ],
  'map-7-2-intro': [
    { speaker: 'spirit', text: '救命啊，連河水都是滾燙的岩漿！船底那些鐵鏈還在往下拽！' },
    { speaker: 'emberknight', text: '這條暗河專門運送赤岩峽谷挖來的吞聲黑鐵！' },
    { speaker: 'hero', text: '穩住渡船！這些複雜的咒文陷阱，看穿弦外之音就能破解！' },
  ],
  'map-7-2-clear': [
    { speaker: 'emberknight', text: '順利靠岸了！前面那座沒有半點打鐵聲的城市，就是鍛造之城。' },
    { speaker: 'hero', text: '打鐵的城市怎麼會沒有聲音？' },
    { speaker: 'spirit', text: '連鐵砧的叮噹聲都被抽走了……我們快進城看看！' },
  ],
  'map-7-3-intro': [
    { speaker: 'forgemaster', text: '別敲了……沒有真名銘文，打出來的全都是死氣沉沉的黑鐵。' },
    { speaker: 'emberknight', text: '赫菲大師，我帶了一位能喚醒高階真名的旅人回來！' },
    { speaker: 'forgemaster', text: '真名？年輕人，你若真能點燃古鍛爐，老夫這把骨頭就陪你賭一把！' },
    { speaker: 'hero', text: '請看好了——真正的語言，連冷卻的爐心都能重新點亮！' },
  ],
  'map-7-3-clear': [
    { speaker: 'forgemaster', text: '聽聽這清脆的錘音！金色的真名火種回來了，好、太好了！' },
    { speaker: 'spirit', text: '大師，炎魔之王為什麼要替沉默君王燒掉全王國的聲音啊？' },
    { speaker: 'forgemaster', text: '唉……去城外的炎之祭壇讀讀誓約碑吧，那是我們全魔域的罪。' },
  ],
  'map-7-4-intro': [
    { speaker: 'forgemaster', text: '舊大戰時，魔域曾替雙方打造神兵，差點把半個王國燒成焦土。' },
    { speaker: 'spirit', text: '碑上寫著……沉默君王饒過鍛造之城，條件是炎魔必須維持寂靜熔爐！' },
    { speaker: 'hero', text: '所以炎魔之王以為替君王燒掉語言，就是在替當年的戰火贖罪？' },
    { speaker: 'forgemaster', text: '他日夜聽著爐裡的哭聲，比誰都痛苦，卻不敢拿全族的命去賭停爐！' },
  ],
  'map-7-4-clear': [
    { speaker: 'hero', text: '用別人的聲音當柴燒，換來的不是贖罪，只是另一場漫長的折磨。' },
    { speaker: 'forgemaster', text: '通往王座的熔岩橋就在前面，老夫這就召集工匠替你們穩住地脈！' },
    { speaker: 'emberknight', text: '我也一起上橋！王城犯下的錯，該由我們親手了結！' },
  ],
  'map-7-5-intro': [
    { speaker: 'emberknight', text: '炎魔親衛隊要炸橋了！而且他們手裡拿的是倒數灰燼彈！' },
    { speaker: 'spirit', text: '別慌！越是倒數緊迫，越要把每一題看準，全對就能反丟回去！' },
    { speaker: 'hero', text: '衝過這座橋，後面就是核心熔爐外圍了！' },
  ],
  'map-7-5-clear': [
    { speaker: 'emberknight', text: '好身手！你們先過橋，後面的追兵交給我擋住！' },
    { speaker: 'hero', text: '凱恩，小心！等寂靜之幕解開，我們在王城見！' },
    { speaker: 'emberknight', text: '一言為定！幫我連王城裡那些不敢開口的同袍也一起救醒吧！' },
  ],
  'map-7-6-intro': [
    { speaker: 'spirit', text: '腳下白茫茫的一整片……全是被燒成灰的書信、歌譜與日記……' },
    { speaker: 'hero', text: '等等，妳看我剛才唸出真名的地方，灰燼裡亮起了金色的字！' },
    { speaker: 'spirit', text: '真的耶！原來真名根本燒不死，只是被壓在寂靜之幕裡面而已！' },
    { speaker: 'hero', text: '只要關掉前面的主熔爐，這些聲音全都能回到主人身邊！' },
  ],
  'map-7-6-clear': [
    { speaker: 'spirit', text: '整片平原都在發亮，好像有成千上萬人在替我們指路！' },
    { speaker: 'forgemaster', text: '穿過最後的火焰迷宮，就是炎魔之王鎮守的主熔爐了！' },
    { speaker: 'hero', text: '我們走，去把這座燒了幾十年的苦牢徹底熄掉！' },
  ],
  'map-7-7-intro': [
    { speaker: 'flamelord', text: '回去吧，旅人！本王的爐火一旦熄滅，王城的怒火將焚盡天地！' },
    { speaker: 'hero', text: '外面的六大區域已經重新連在一起了，沒人會再孤軍奮戰！' },
    { speaker: 'spirit', text: '火牆在變換位置！聽清楚他話裡的破綻，一口氣穿過迷宮！' },
  ],
  'map-7-7-clear': [
    { speaker: 'forgemaster', text: '迷宮破了！主熔爐就在王座背後，炎魔之王已經站起來了！' },
    { speaker: 'spirit', text: '小心他的「灰燼炸彈」，倒數四題全對就能把業火反砸回去！' },
    { speaker: 'hero', text: '準備好了。今天就在這裡，斬斷寂靜之幕最後的能源！' },
  ],
  'boss-7-intro': [
    { speaker: 'flamelord', text: '當年魔域鑄出的刀劍奪走無數性命，這座熔爐便是本王背負的贖罪！' },
    { speaker: 'hero', text: '赫菲大師都告訴我們了。但燒掉百姓的思念與歌聲，根本不是贖罪！' },
    { speaker: 'forgemaster', text: '陛下，停手吧！鍛造之城的工匠，想打的是守護人的真名之器啊！' },
    { speaker: 'flamelord', text: '閉嘴！若你們沒有凌駕君王的實力，停爐只會換來更大的毀滅！' },
    { speaker: 'spirit', text: '他把壓縮的灰燼炸彈丟過來了！穩住四連擊，把火球反轟回去！' },
    { speaker: 'flamelord', text: '接下本王的業火吧！證明你們的語言，比毀滅的火焰更強！' },
  ],
  'clear-4': [
    { speaker: 'flamelord', text: '哈哈哈……好一記反擊！連主熔爐的鎖芯都被你的真名震碎了！' },
    { speaker: 'spirit', text: '快看！千萬道金光從爐心衝上天空，王城外面的寂靜之幕裂開了！' },
    { speaker: 'flamelord', text: '聽……雲端上傳來了王城久違的鐘聲。去吧，去把那個孤獨的國王叫醒！' },
    { speaker: 'hero', text: '下一站就是浮空王城——露米，我們去把全世界的真名帶回來！' },
  ],

  // ---------- C2 王城（regionIdx = 8｜終章收束） ----------
  'region-5': [
    { speaker: 'narrator', text: '雲海之巔，浮空王城靜靜佇立，整座城池聽不見一絲風聲。' },
    { speaker: 'villain', text: '你們竟熄滅了熔爐……但踏入此城，一切字句終將歸於虛無。' },
    { speaker: 'hero', text: '從失語邊境走到這裡，我們帶來的不是噪音，是無數人的心聲。' },
    { speaker: 'spirit', text: '{name}，這是最後一段路了！相信你一路學會的每一個字，走吧！' },
  ],
  'map-8-0-intro': [
    { speaker: 'hero', text: '街道乾乾淨淨，噴泉還在流，卻連一滴水聲都聽不見……' },
    { speaker: 'spirit', text: '這裡離寂靜之幕的核心太近了，連空氣都在排斥聲音。' },
    { speaker: 'hero', text: '你看廣場上的雕像，基座的名字全被削平了。我們一路喚醒過去！' },
  ],
  'map-8-0-clear': [
    { speaker: 'spirit', text: '噴泉發出水聲了！雖然還很小聲，但我們的真名在王城也管用！' },
    { speaker: 'hero', text: '前面那道長廊的光影好像停住了，連落葉都懸在半空中。' },
    { speaker: 'spirit', text: '那是通往內城的「時空迴廊」，失語之災那一天的畫面還卡在那裡。' },
  ],
  'map-8-1-intro': [
    { speaker: 'hero', text: '迴廊裡這些人影……有人正要道歉，有人張著嘴想跟孩子說再見。' },
    { speaker: 'spirit', text: '寂靜之幕降下的那一秒，他們還沒說出口的話全被凍在半空了。' },
    { speaker: 'hero', text: '連道歉與道別都被奪走，這根本不是真正的和平。快打通迴廊！' },
  ],
  'map-8-1-clear': [
    { speaker: 'spirit', text: '殘影化作微光散開了……等打破天幕，那些話一定能傳到對方耳裡。' },
    { speaker: 'hero', text: '迴廊盡頭那棟圓頂建築，門牌上寫著「真名記錄院」？' },
    { speaker: 'spirit', text: '是「失落圖書館」！那就是我以前每天工作的地方！' },
  ],
  'map-8-2-intro': [
    { speaker: 'spirit', text: '嗚……幾萬冊真名典籍，現在翻開來全是一片白紙……' },
    { speaker: 'hero', text: '別難過，妳看最裡面那張首席記錄官的書桌，抽屜還鎖著！' },
    { speaker: 'spirit', text: '那是我的桌子！清掉看守的魔像，裡面一定留著王宮密道的線索！' },
  ],
  'map-8-2-clear': [
    { speaker: 'spirit', text: '找到了！抽屜裡有一把黑銀鑰匙，上面刻著「禁書庫」！' },
    { speaker: 'hero', text: '還有妳當年沒寫完的筆記：「君王並非無情，實為大慟所困」。' },
    { speaker: 'spirit', text: '穿過王城外郭就是王座大殿了，我們直接去找他問個明白！' },
  ],
  'map-8-3-intro': [
    { speaker: 'royalguard', text: '…………！（舉劍橫胸，指向城門外的方向）' },
    { speaker: 'spirit', text: '是以前的王家禁衛長！他的盔甲被刻了緘默紋章，連話都說不出來！' },
    { speaker: 'hero', text: '他眼神沒有殺氣，只是在盡忠職守。我們堂堂正正破開他的紋章！' },
  ],
  'map-8-3-clear': [
    { speaker: 'royalguard', text: '咳……露米大人……？原來世上真的還有人，能重新學會古語。' },
    { speaker: 'hero', text: '禁衛長，我們不是來毀滅王城的，是來解開寂靜之幕的。' },
    { speaker: 'royalguard', text: '陛下……早已不在外殿了。推開前面「王座之間」的門，你們便懂了。' },
  ],
  'map-8-4-intro': [
    { speaker: 'hero', text: '推開大門了……等等，黃金王座上怎麼空無一人？！' },
    { speaker: 'spirit', text: '連王冠都斷成兩半丟在台階上！守在這裡的只有一具寂靜幻影！' },
    { speaker: 'hero', text: '沉默君王放棄了榮華與王位？那他真正的本尊在哪裡？' },
    { speaker: 'spirit', text: '王座後面有一扇鎖住的暗門——鑰匙孔正好對得上「禁書庫」的鑰匙！' },
  ],
  'map-8-4-clear': [
    { speaker: 'hero', text: '殘影散了。原來他奪走天下的聲音後，連自己也關進了深處。' },
    { speaker: 'spirit', text: '鑰匙轉開了！暗門後面就是整座王宮最機密的「禁書庫」！' },
    { speaker: 'hero', text: '走吧，去看看他到底把什麼東西藏在王座背後。' },
  ],
  'map-8-5-intro': [
    { speaker: 'hero', text: '外面的圖書館一片空白，這裡卻鎖滿了沒有抹掉文字的書卷！' },
    { speaker: 'spirit', text: '這些全是……撕毀的盟約、煽動叛亂的假檄文，還有王妹臨終的遺書。' },
    { speaker: 'hero', text: '他把世上最傷人的語言全鎖在自己身邊，天天看著這些維持天幕？' },
    { speaker: 'spirit', text: '難怪他會絕望……但守衛衝過來了，先突圍去前面的鏡之迴廊！' },
  ],
  'map-8-5-clear': [
    { speaker: 'spirit', text: '王妹遺書的最後一行明明寫著：「兄長，別因謊言而憎恨人們的聲音……」' },
    { speaker: 'hero', text: '他只記住了背叛的痛，卻把妹妹最後的願望也一起封死了。' },
    { speaker: 'spirit', text: '前面就是「鏡之迴廊」，沉默君王的聲音正從鏡子裡傳出來！' },
  ],
  'map-8-6-intro': [
    { speaker: 'villain', text: '你既非王族，亦非古代賢者，為何寂靜之幕唯獨封不住你的真名？' },
    { speaker: 'spirit', text: '對喔！我也一直想問，為什麼偏偏只有{name}能唸出古文字？' },
    { speaker: 'hero', text: '我以前根本不會啊。在邊境唸出「Hello」前，我連一個字都不熟。' },
    { speaker: 'spirit', text: '我懂了！天幕只能封住「舊記憶」，封不住「從零重學的心」！' },
  ],
  'map-8-6-clear': [
    { speaker: 'villain', text: '從零學起……？你竟靠著凡人之軀，一個字、一個字把古語重拾至此？' },
    { speaker: 'hero', text: '沒錯！不是因為我是天選之人，而是每一區的人們教會了我這些名字！' },
    { speaker: 'spirit', text: '鏡面後方的「鐘塔」露出來了！先去刻好大鐘銘文，準備敲醒全國！' },
  ],
  'map-8-7-intro': [
    { speaker: 'spirit', text: '這座「萬名大鐘」以前每逢慶典都會響遍九大區域，現在銘文全空了！' },
    { speaker: 'hero', text: '那就把我們從草原、森林、海岸一路學到這裡的真名，重新刻上去！' },
    { speaker: 'spirit', text: '好主意！只要再打倒最深處的君王，大鐘就會把語言送回每個人心裡！' },
  ],
  'map-8-7-clear': [
    { speaker: 'spirit', text: '最後一道真名刻好了！整座大鐘都在嗡嗡共鳴，隨時都能敲響！' },
    { speaker: 'hero', text: '鐘塔底下就是通往「沉默王座」的最後長廊——無聲大廳。' },
    { speaker: 'spirit', text: '握緊武器喔，{name}！就算進去之後聽不見聲音，我也一直在你身邊！' },
  ],
  'map-8-8-intro': [
    { speaker: 'hero', text: '（腳步落下，大廳裡卻沒有半點回音，連風都靜止了。）' },
    { speaker: 'spirit', text: '好強的壓迫感……但在這片絕對黑暗裡，只有你身上的真名在發光！' },
    { speaker: 'hero', text: '因為這一路上每一句話，都是我們親口唸對、親手寫下來的！' },
  ],
  'map-8-8-clear': [
    { speaker: 'spirit', text: '無聲大廳的盡頭亮起白光了，那扇門後面就是「沉默王座」！' },
    { speaker: 'hero', text: '他的「全知封印」一開場就會封住技能，我們得靠自己的真名硬破開它。' },
    { speaker: 'spirit', text: '不管六連擊還是十道真名，我們一定做得到！推開門吧，{name}！' },
  ],
  'boss-8-intro': [
    { speaker: 'villain', text: '看著這片安寧吧。沒有謊言、沒有爭吵，再也不會有人因話語而流淚。' },
    { speaker: 'hero', text: '但也沒有人能說「謝謝」、沒有人能道歉，連思念都被燒成了灰！' },
    { speaker: 'spirit', text: '王妹最後留下的話根本不是要你封鎖世界，你不能再騙自己了！' },
    { speaker: 'villain', text: '……即便語言能帶來溫暖，只要還有傷人的可能，孤便絕不放手！' },
    { speaker: 'spirit', text: '全知封印降下來了！別怕，連續答對真名就能震碎封印、點燃狂熱！' },
    { speaker: 'hero', text: '來吧，沉默君王！聽聽一個普通人一步一步學會的「真名之力」！' },
  ],
  'clear-5': [
    { speaker: 'villain', text: '全知封印……竟被你一字一句親手學來的真名，徹底擊碎了……' },
    { speaker: 'narrator', text: '寂靜之幕化作漫天星雨消散，鐘塔的大鐘轟然鳴響，傳遍九大區域！' },
    { speaker: 'elder', text: '聽啊！市集有人在互喊名字，孩子們在唱歌，招牌上的字全回來了！' },
    { speaker: 'villain', text: '原來……人們找回聲音後說的第一句話，不是爭吵，而是呼喚彼此嗎……' },
    { speaker: 'spirit', text: '{name}，謝謝你！從一句「Hello」走到這，你是真正的「語言守護者」！' },
    { speaker: 'narrator', text: '【主線結局】獲得稱號「語言守護者」！海的彼端，新的冒險正等你啟程。' },
  ],
};

// 第 15 關小 BOSS、第 20 關大 BOSS 第一次登場的一句台詞（ChatGPT 第十八輪起逐區補）
export const BOSS_LINES: Record<string, { mini: string; big: string }> = {
  'map-1-0': { mini: '我是霧中的哨兵！沒有魔女的允許，誰也別想找到出口！', big: '所有路標都聽我的！你們只會走回原點！' },
  'map-1-1': { mini: '別碰我的孢子！只要吸一口，就會忘記自己來做什麼！', big: '這座谷是我編出來的美夢！誰准你們把它叫醒？' },
  'map-1-2': { mini: '我守著這座橋，真路假路都由我說了算！', big: '過橋的人都得留下影子！你們也不例外！' },
  'map-1-3': { mini: '別看泉水！我會讓你看見最不想記起的事！', big: '真相會刺痛人心，不如讓我替你們忘掉！' },
  'map-1-4': { mini: '祭壇的霧不能停！你們想讓追兵找到大家嗎？', big: '只要祭壇還亮著，整座森林就會繼續聽我的命令！' },
  // A1 翠綠草原

  // 新手村
  'map-0-0': {
    mini: '這些招牌上的字全歸我了！想拿回去？先過我這關！',
    big: '只要村民叫不出東西的名字，整條街就會慢慢變成空白！',
  },

  // 風車丘
  'map-0-1': {
    mini: '風車的符文都被我吞了！葉片休想再轉起來！',
    big: '黑霧會壓住每一陣風！這座風車就乖乖停著吧！',
  },

  // 草原小徑
  'map-0-2': {
    mini: '想走這條路？先問問我的樹根答不答應！',
    big: '所有岔路都通向死路！你們會永遠繞在這裡！',
  },

  // 河岸渡口
  'map-0-3': {
    mini: '水流越亂，我就越有力氣！別想把船開過去！',
    big: '通往北邊哨站的路已經封死！誰也不准過河！',
  },

  // 廢棄哨站
  'map-0-4': {
    mini: '奉黑石的命令，所有人都不准靠近哨站！',
    big: '你們毀不了這道命令！巨樹會替我們把整片草原封死！',
  },

  // A2+ 碧藍海岸

  // 珊瑚灣
  'map-2-0': {
    mini: '救生浮標全被我拖下海了！別想把那些人救回來！',
    big: '珊瑚已經枯了，這片海也該跟著安靜下來！',
  },

  // 燈塔岬
  'map-2-1': {
    mini: '我的黑索會勒住每一道光！別想把燈塔點亮！',
    big: '就算你們點起火，光也逃不出我的鎖！',
  },

  // 漁人碼頭
  'map-2-2': {
    mini: '鐵鏈一收，整排漁船都得跟著沉！',
    big: '這座港口就是我的囚籠！海上的人都別想回家！',
  },

  // 海蝕洞
  'map-2-3': {
    mini: '這裡的每一道回聲，我都能用鐵鏈拴住！',
    big: '敢碰鎖鏈的固定點？我就讓海水淹掉整座洞！',
  },

  // 潮汐神殿
  'map-2-4': {
    mini: '那些舊碑文早就沒用了！現在只准寫「封鎖」！',
    big: '潮汐鐘只能聽王城的命令！誰敢把它還給海上的人？',
  },

  // 貝殼沙灘
  'map-2-5': {
    mini: '回聲貝是我的獵物！誰敢喚醒海底那傢伙？',
    big: '通往深海裂口的最後一條路，由我看守！',
  },

  // B1 黃金沙漠
  'map-3-0': {
    mini: '沒有契約，誰拳頭大誰就獨佔綠洲！',
    big: '看著假水坑渴死吧！盟約碑永遠別想亮起來！',
  },
  'map-3-1': {
    mini: '假貨單、假路標，看你們怎麼準時交貨！',
    big: '把貨物和性命都留在這條假路上吧！',
  },
  'map-3-2': {
    mini: '法老有令，城裡不准留半張寫著字的紙！',
    big: '風沙會抹平所有交易，乖乖閉嘴待在城裡吧！',
  },
  'map-3-3': {
    mini: '闖進蠍群的領地，就別想帶著記憶出去！',
    big: '舊時代的背叛早就埋進沙裡了，誰也不准挖出來！',
  },
  'map-3-4': {
    mini: '凡人只會拿文字寫謊言，唯有封存才是潔淨！',
    big: '法老與王城的盟約神聖不可侵犯，退下！',
  },
  'map-3-5': {
    mini: '踏錯一個字就會沉進流沙，你們分得出真假嗎？',
    big: '金字塔只收死去的碑文，不迎活著的旅人！',
  },

  // B1+ 赤岩峽谷
  'map-4-0': {
    mini: '在這座隘口裡，同伴的呼喊只會害你們走錯路！',
    big: '亂響會震碎你們的陣型，誰也別想聽清命令！',
  },
  'map-4-1': {
    mini: '把石壁上的舊名字統統磨平，一個字母都不留！',
    big: '沒有名字的亡魂，休想再回應任何人的召喚！',
  },
  'map-4-2': {
    mini: '傳聲管已經被我堵死了，底下的人自己聽天由命吧！',
    big: '乖乖替王城挖黑鐵，否則整座礦鎮都別想安寧！',
  },
  'map-4-3': {
    mini: '峭壁上的風就是我的刀，摔下去粉身碎骨吧！',
    big: '這塊殘碑歸魔王軍了，山神永遠別想記起自己是誰！',
  },
  'map-4-4': {
    mini: '把石碑丟進爐裡！熔成黑鐵就再也不會發光了！',
    big: '這些黑鐵還要送往熔岩魔域，誰敢耽誤王城的大事！',
  },
  'map-4-5': {
    mini: '棧道一斷，你們所謂的同伴就會一個個掉進深淵！',
    big: '在崩塌的斷崖上，看你們還怎麼並肩作戰！',
  },
  'map-4-6': {
    mini: '石林裡的每一聲怒吼都會讓人迷失，永遠轉不出去！',
    big: '休想把名碑帶進深淵！讓那頭石怪繼續替我們封山吧！',
  },

  // B2 極光雪嶺
  'map-5-0': {
    mini: '在暴風雪裡張嘴，舌頭和咒語都會一起凍僵！',
    big: '雪原不需要外來的聲音，全部留在冰層底下吧！',
  },
  'map-5-1': {
    mini: '奉王城之命，搜出史書，一頁都不准留在世上！',
    big: '在極光底下，連你們的思緒都會慢得像冰河一樣！',
  },
  'map-5-2': {
    mini: '君王的過去輪不到凡人窺探，把冰柱全砸碎！',
    big: '真相只會動搖人心，乖乖被凍進永恆的冰晶裡吧！',
  },
  'map-5-3': {
    mini: '寒風會吹散你們的句子，看誰還聽得見你的號令！',
    big: '連雪狼都逃不出寂靜的寒冬，你們也一樣！',
  },
  'map-5-4': {
    mini: '原來是空巢！那正好，把這面留影冰鏡一併毀掉！',
    big: '真名記錄官的殘影，今天誰也別想帶出這座山洞！',
  },
  'map-5-5': {
    mini: '那頭老龍已經快凍僵了，這座村子今天誰也保不住！',
    big: '把村民和史書一起交出來，省得受這極寒之苦！',
  },
  'map-5-6': {
    mini: '踏上冰湖一步，就讓你們連呼吸都凍成冰雕！',
    big: '湖底的王座是你們的墳場，休想喚醒《萬名總錄》！',
  },

  // B2+ 雷鳴高原
  'map-6-0': {
    mini: '天空已經禁言！敢放出一道聲音，就吃我一記落雷！',
    big: '乖乖留在地上當啞巴吧，誰也別想往雲端送訊號！',
  },
  'map-6-1': {
    mini: '這些廢紙留著只會惹禍，不如一把雷火全燒光！',
    big: '沒有消息就是最安全的消息，把收發機給我砸爛！',
  },
  'map-6-2': {
    mini: '石林記得每一句奪命的假話！閉上你們的嘴！',
    big: '多錯一次，靜電就重一分！看你們能撐到幾時！',
  },
  'map-6-3': {
    mini: '獅鷲大人有令，折斷所有信使鳥的羽翼！',
    big: '天空只需要雷霆的威嚴，不需要替凡人送信的鳥！',
  },
  'map-6-4': {
    mini: '在雜訊與雷鳴裡，你們連一個字都別想聽清！',
    big: '祭壇一響，萬籟俱裂！休想把訊號送出高原！',
  },
  'map-6-5': {
    mini: '卡死風車齒輪！絕不能讓各地的叛軍連成一氣！',
    big: '孤立的人類才會乖乖聽話，誰准你們重啟風車！',
  },
  'map-6-6': {
    mini: '閃電峽每一步都是雷池，踏錯一步就灰飛煙滅！',
    big: '替獅鷲大人攔下他們，別讓那封舊信送上天巢！',
  },
  'map-6-7': {
    mini: '雲海之上只有君王的秩序，容不下凡人的喧嘩！',
    big: '天巢就在眼前，看你們有沒有命踏上最後一階！',
  },

  // C1 熔岩魔域
  'map-7-0': {
    mini: '掉進火山口的字句，連半點回音都別想留下！',
    big: '熱浪會蒸乾你們的勇氣，乖乖化作爐底的灰吧！',
  },
  'map-7-1': {
    mini: '黑石只需要刻一句命令，比人類囉嗦的語言好用多了！',
    big: '凱恩，你竟敢帶外人毀塔！連你一起壓成黑石！',
  },
  'map-7-2': {
    mini: '把船拖進岩漿裡，看你們還怎麼開口唸咒！',
    big: '整條暗河都是鎖鏈的墓場，沉下去吧！',
  },
  'map-7-3': {
    mini: '工匠只需要乖乖打鎖鏈，誰准你們私自點燃古爐！',
    big: '把古鍛爐徹底封死，這座城永遠只准替王城賣命！',
  },
  'map-7-4': {
    mini: '炎魔陛下的苦心不容動搖，休想靠近主熔爐！',
    big: '一旦停爐就會大禍臨頭，你們擔得起這個後果嗎！',
  },
  'map-7-5': {
    mini: '灰燼彈已經點燃，只要答錯一個字就炸斷整座橋！',
    big: '連橋帶人一起葬身火海吧，誰也別想踏進平原！',
  },
  'map-7-6': {
    mini: '已經燒成灰的過去，幹嘛還要把它們叫醒！',
    big: '就算字句還會發光，也逃不出這片灰燼荒原！',
  },
  'map-7-7': {
    mini: '火牆千變萬化，稍微分心就會被燒成焦炭！',
    big: '炎魔王座之前，不容任何凡人帶著語言通過！',
  },

  // C2 王城
  'map-8-0': {
    mini: '踏上天空島者，連呼吸與腳步都得一併交出！',
    big: '看這座沒有爭吵的完美之城，誰准你們帶來雜音！',
  },
  'map-8-1': {
    mini: '停在這一秒就不會再有悲傷，別把時間推往前走！',
    big: '說不出口的話最安全，永遠留在靜止的迴廊裡吧！',
  },
  'map-8-2': {
    mini: '空白的書頁永遠不會寫下謊言，退離書架！',
    big: '記錄官露米，奉君王舊令，將妳連同殘卷一併抹除！',
  },
  'map-8-3': {
    mini: '王城外郭固若金湯，無詔者一步不准踏入！',
    big: '就算你們熄了魔域之火，也休想驚動王座上的陛下！',
  },
  'map-8-4': {
    mini: '空置的王座不需要諫言，退回你們的凡塵去！',
    big: '我是君王留下的王權殘影，誰也別想打開王座後的暗門！',
  },
  'map-8-5': {
    mini: '字字句句皆是刀刃，看過這些罪證，你們還敢要語言嗎！',
    big: '留在禁書庫裡陪葬吧，別把仇恨的火種帶回人間！',
  },
  'map-8-6': {
    mini: '鏡子會照出你的每次猶豫，一個生澀的凡人憑什麼逞強！',
    big: '就算從頭學起又如何？在萬鏡迷陣裡自我懷疑到死吧！',
  },
  'map-8-7': {
    mini: '鐘槌已經鏽死，王城永遠不會再敲響半聲鐘鳴！',
    big: '在最高塔頂把你們擊落，看誰還能替人間報曉！',
  },
  'map-8-8': {
    mini: '此處為萬言終點，連英雄的契約也休想發出半點聲響！',
    big: '退下吧！在絕對的寂靜面前，一切溝通皆是徒勞！',
  },
};
for (const [map, line] of Object.entries(BOSS_LINES)) {
  STORIES[`${map}-mini`] = [{ speaker: 'foe', text: line.mini }];
  STORIES[`${map}-big`] = [{ speaker: 'foe', text: line.big }];
}

// 前置區域：P-1 開場、P-6 第一個同伴、P-10 追獵隊長登場；通關播 pre-clear
export const PROLOGUE_STORY_AT: Record<number, string> = { 0: 'pre-intro', 5: 'pre-ally', 9: 'pre-boss' };
export const PROLOGUE_CLEAR_STORY = 'pre-clear';

// 劇情 id 依區域固定：原本六個區域沿用舊 id（存檔裡記錄看過哪些），新增的三區用自己的 id
const REGION_STORY_KEYS = ['0', '1', 'a2p', '2', 'b1p', '3', 'b2p', '4', '5'];
const storyKey = (regionIdx: number) => REGION_STORY_KEYS[regionIdx] ?? String(regionIdx);
export const regionStoryId = (regionIdx: number) => `region-${storyKey(regionIdx)}`;
export const clearStoryId = (regionIdx: number) => `clear-${storyKey(regionIdx)}`;

// 每張三星地圖的開場／通關劇情、區域魔王登場劇情的 id（沒有寫劇本的地圖就沒有）
export const mapStoryId = (regionIdx: number, mapIdx: number, part: 'intro' | 'clear' | 'mini' | 'big') => `map-${regionIdx}-${mapIdx}-${part}`;
export const bossStoryId = (regionIdx: number) => `boss-${regionIdx}-intro`;

// 劇情回顧的分組：-1 序章與失語邊境、0～8 九區、99 黃金之路
export function storyRegion(id: string): number {
  if (id === 'prologue' || id.startsWith('pre-')) return -1;
  if (id === 'golden-ending') return 99;
  const m = id.match(/^(?:map|boss)-(\d+)-/);
  if (m) return +m[1];
  const idx = REGION_STORY_KEYS.indexOf(id.split('-').slice(1).join('-'));
  return idx >= 0 ? idx : 99;
}

// 劇情回顧的名稱
export function storyTitle(id: string, regionName: (idx: number) => string, mapName: (regionIdx: number, mapIdx: number) => string): string {
  if (id === 'prologue') return '序章';
  const pre = { 'pre-intro': '開場', 'pre-ally': '第一個同伴', 'pre-boss': '追獵隊長', 'pre-clear': '通往草原的光' }[id];
  if (pre) return `失語邊境・${pre}`;
  if (id === 'golden-ending') return '黃金之路・結局';
  const map = id.match(/^map-(\d+)-(\d+)-(intro|clear|mini|big)$/);
  if (map) return `${regionName(+map[1])}・${mapName(+map[1], +map[2])}・${{ intro: '開場', clear: '通關', mini: '小 BOSS', big: '大 BOSS' }[map[3]]}`;
  const boss = id.match(/^boss-(\d+)-intro$/);
  if (boss) return `${regionName(+boss[1])}・魔王登場`;
  const [kind, key] = id.split('-');
  const idx = REGION_STORY_KEYS.indexOf(key);
  return `${regionName(idx)}・${kind === 'region' ? '開場' : '通關'}`;
}
