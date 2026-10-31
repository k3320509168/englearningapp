// 真名考驗的內容：每位英雄名字（英文單字）的例句、詞性變化、俗語或字源。
// usage：例句中「___」是英雄名字本身（考驗時要打出來），zh 是中文翻譯
// form：詞性／字形變化的選擇題（answer 為正確答案，wrong 為三個錯誤選項）
// lore：俗語（idiom）或字源（origin）；選項的錯誤答案取自其他英雄同類型的答案

export interface HeroLore {
  usage: { en: string; zh: string };
  form: { q: string; answer: string; wrong: [string, string, string] };
  lore: { type: 'idiom' | 'origin'; q: string; answer: string };
}

type Row = [usageEn: string, usageZh: string, formQ: string, formA: string, w1: string, w2: string, w3: string, loreType: 'idiom' | 'origin', loreQ: string, loreA: string];

const ROWS: Record<string, Row> = {
  knight: ['The brave ___ protected the castle.', '勇敢的騎士保護了城堡。', 'knight 的複數形是？', 'knights', 'knightes', 'knightz', 'knighties', 'idiom', '「a knight in shining armor」是什麼意思？', '危難時出手相救的英雄'],
  apple: ['An ___ a day keeps the doctor away.', '一天一蘋果，醫生遠離我。', 'apple 的複數形是？', 'apples', 'applees', 'appless', 'applies', 'idiom', '「the apple of my eye」是什麼意思？', '最珍愛的人；掌上明珠'],
  bread: ['I eat ___ and eggs for breakfast.', '我早餐吃麵包和蛋。', '「兩條麵包」的英文是？', 'two loaves of bread', 'two breads', 'two bread', 'two breades', 'idiom', '「bread and butter」是什麼意思？', '謀生的主要來源'],
  cat: ['My ___ likes to sleep on the sofa.', '我的貓喜歡睡在沙發上。', 'cat 的複數形是？', 'cats', 'cates', 'catz', 'catties', 'idiom', '「let the cat out of the bag」是什麼意思？', '不小心洩漏秘密'],
  dog: ['I walk my ___ every morning.', '我每天早上遛狗。', 'dog 的複數形是？', 'dogs', 'doges', 'dogz', 'dogses', 'idiom', '「Every dog has its day.」是什麼意思？', '人人都有走運的時候'],
  sun: ['The ___ rises in the east.', '太陽從東方升起。', 'sun 的形容詞（晴朗的）是？', 'sunny', 'sunly', 'sunful', 'sunish', 'idiom', '「under the sun」是什麼意思？', '天底下；世界上所有的'],
  moon: ['The ___ is very bright tonight.', '今晚的月亮很亮。', 'moon 的形容詞（有月光的）是？', 'moonlit', 'moonful', 'mooned', 'moonish', 'idiom', '「once in a blue moon」是什麼意思？', '千載難逢；非常罕見'],
  tree: ['There is a big ___ in the park.', '公園裡有一棵大樹。', 'tree 的複數形是？', 'trees', 'treees', 'treeies', 'treez', 'idiom', '「bark up the wrong tree」是什麼意思？', '找錯對象；搞錯方向'],
  fish: ['We had ___ for dinner.', '我們晚餐吃魚。', 'fish 當動詞「釣魚」的進行式是？', 'fishing', 'fishhing', 'fisheing', 'fishying', 'idiom', '「like a fish out of water」是什麼意思？', '如魚離水；渾身不自在'],
  bird: ['A ___ is singing in the tree.', '一隻鳥在樹上唱歌。', 'bird 的複數形是？', 'birds', 'birdes', 'birdz', 'birdses', 'idiom', '「kill two birds with one stone」是什麼意思？', '一石二鳥'],
  book: ['I borrowed a ___ from the library.', '我從圖書館借了一本書。', 'book 當動詞時是什麼意思？', '預訂', '讀書', '寫書', '賣書', 'idiom', '「Don\'t judge a book by its cover.」是什麼意思？', '不要以貌取人'],
  milk: ['Would you like some ___ in your coffee?', '你的咖啡要加牛奶嗎？', 'milk 的形容詞（乳白色的）是？', 'milky', 'milkly', 'milkish', 'milkful', 'idiom', '「cry over spilt milk」是什麼意思？', '為無法挽回的事懊惱'],
  star: ['Look at that bright ___ in the sky!', '看天上那顆亮亮的星星！', 'star 當動詞（主演）的過去式是？', 'starred', 'stared', 'starded', 'stard', 'idiom', '「reach for the stars」是什麼意思？', '追求遠大的目標'],
  rain: ['Take an umbrella; it might ___ later.', '帶把傘，等一下可能會下雨。', 'rain 的形容詞（多雨的）是？', 'rainy', 'rainful', 'rainish', 'rainly', 'idiom', '「rain or shine」是什麼意思？', '無論如何；風雨無阻'],
  rose: ['She received a red ___ on Valentine\'s Day.', '她在情人節收到一朵紅玫瑰。', 'rose 也是哪個動詞的過去式？', 'rise', 'raise', 'rest', 'ride', 'idiom', '「a bed of roses」是什麼意思？', '輕鬆舒適的處境'],
  egg: ['I\'d like a boiled ___, please.', '我想要一顆水煮蛋。', 'egg 的複數形是？', 'eggs', 'egges', 'eggz', 'eggies', 'idiom', '「Don\'t put all your eggs in one basket.」是什麼意思？', '不要孤注一擲'],
  archer: ['The ___ shot an arrow at the target.', '弓箭手朝靶射了一箭。', '「射箭（運動）」的英文是？', 'archery', 'archering', 'archerness', 'archment', 'origin', 'archer 這個字的字根來自？', '拉丁文 arcus（弓）'],
  mage: ['The old ___ cast a powerful spell.', '老法師施了一道強大的咒語。', 'mage 的同義詞（巫師）是？', 'wizard', 'wizzard', 'magee', 'mager', 'origin', 'mage 這個字來自？', '古波斯語 magus（祭司、智者）'],
  bard: ['The ___ sang songs about ancient heroes.', '吟遊詩人唱著古代英雄的歌。', '被稱為「the Bard」的英國劇作家是？', 'Shakespeare', 'Dickens', 'Newton', 'Darwin', 'origin', 'bard 原本是哪種語言的詞？', '古凱爾特語，指吟唱史詩的詩人'],
  river: ['We went swimming in the ___.', '我們去河裡游泳。', 'river 的複數形是？', 'rivers', 'riveres', 'riverz', 'riveries', 'idiom', '「sell someone down the river」是什麼意思？', '出賣、背叛某人'],
  forest: ['Many animals live in the ___.', '許多動物住在森林裡。', '「森林砍伐」的英文是？', 'deforestation', 'disforest', 'unforestry', 'antiforest', 'idiom', '「can\'t see the forest for the trees」是什麼意思？', '見樹不見林'],
  island: ['Taiwan is a beautiful ___.', '台灣是一座美麗的島嶼。', 'island 裡不發音的字母是？', 's', 'i', 'l', 'd', 'idiom', '「No man is an island.」是什麼意思？', '沒有人能完全獨立而活'],
  castle: ['The king lives in a huge ___.', '國王住在一座巨大的城堡裡。', 'castle 裡不發音的字母是？', 't', 'c', 's', 'l', 'idiom', '「build castles in the air」是什麼意思？', '空想；做白日夢'],
  garden: ['My grandmother grows vegetables in her ___.', '奶奶在花園裡種菜。', '「園丁」的英文是？', 'gardener', 'gardenist', 'gardenman', 'gardenor', 'idiom', '「lead someone up the garden path」是什麼意思？', '誤導、欺騙某人'],
  winter: ['It often snows here in ___.', '這裡冬天常下雪。', 'winter 當動詞（過冬）的進行式是？', 'wintering', 'winterring', 'wintring', 'winteing', 'origin', 'winter 在古英文中與哪個字同源？', 'water（濕冷的季節）'],
  shadow: ['The cat is hiding in the ___.', '貓躲在陰影裡。', 'shadow 的形容詞（陰暗的、可疑的）是？', 'shadowy', 'shadowful', 'shadowish', 'shadowly', 'idiom', '「beyond a shadow of a doubt」是什麼意思？', '毫無疑問'],
  silver: ['She wears a ___ necklace.', '她戴著一條銀項鍊。', 'silver 的形容詞（銀色的、銀鈴般的）是？', 'silvery', 'silverish', 'silverful', 'silverly', 'idiom', '「Every cloud has a silver lining.」是什麼意思？', '黑暗中總有一線希望'],
  hunter: ['The ___ followed the deer into the woods.', '獵人跟著鹿走進樹林。', 'hunter 的動詞原形是？', 'hunt', 'hun', 'hunten', 'haunt', 'idiom', '「bargain hunter」是什麼意思？', '喜歡找便宜貨的人'],
  candle: ['She lit a ___ on the birthday cake.', '她點了生日蛋糕上的蠟燭。', 'candle 的複數形是？', 'candles', 'candls', 'candlees', 'candelz', 'idiom', '「burn the candle at both ends」是什麼意思？', '蠟燭兩頭燒；過度勞累'],
  ocean: ['The Pacific is the largest ___ in the world.', '太平洋是世界上最大的海洋。', 'ocean 的形容詞是？', 'oceanic', 'oceanal', 'oceanous', 'oceanish', 'idiom', '「a drop in the ocean」是什麼意思？', '滄海一粟；杯水車薪'],
  dragon: ['The ___ breathed fire on the village.', '龍對村子噴火。', '「蜻蜓」的英文是？', 'dragonfly', 'dragonbird', 'dragonbug', 'flydragon', 'origin', 'dragon 來自希臘文 drakōn，原意是？', '巨大的蛇'],
  thunder: ['We heard ___ after the lightning.', '閃電之後我們聽到雷聲。', 'thunder 的形容詞（轟隆的）是？', 'thunderous', 'thunderful', 'thunderly', 'thunderish', 'idiom', '「steal someone\'s thunder」是什麼意思？', '搶走某人的風頭'],
  crystal: ['The water in the lake is ___ clear.', '湖水清澈如水晶。', 'crystal 的動詞（結晶、具體化）是？', 'crystallize', 'crystalify', 'crystalate', 'encrystal', 'idiom', '「crystal clear」是什麼意思？', '非常清楚、明白'],
  warrior: ['The ___ fought bravely in the battle.', '戰士在戰鬥中英勇作戰。', 'warrior 是從哪個字變來的？', 'war', 'ward', 'warn', 'wear', 'idiom', '「weekend warrior」是什麼意思？', '只有週末才運動或從事興趣的人'],
  journey: ['The ___ from Taipei to Tainan takes two hours by train.', '從台北到台南的旅程搭火車要兩小時。', 'journey 的複數形是？', 'journeys', 'journies', 'journeyes', 'journeis', 'idiom', '「Life is a journey, not a destination.」是什麼意思？', '人生重在過程而非終點'],
  courage: ['It takes ___ to speak English in public.', '在公開場合說英文需要勇氣。', 'courage 的形容詞是？', 'courageous', 'couragious', 'courageful', 'couragy', 'idiom', '「pluck up the courage」是什麼意思？', '鼓起勇氣'],
  harmony: ['The family lives in ___.', '這家人和睦相處。', 'harmony 的形容詞（和睦的）是？', 'harmonious', 'harmonyful', 'harmonal', 'harmonish', 'idiom', '「in harmony with」是什麼意思？', '與…和諧一致'],
  volcano: ['The ___ erupted last night.', '火山昨晚爆發了。', 'volcano 的形容詞是？', 'volcanic', 'volcanous', 'volcanal', 'volcanish', 'origin', 'volcano 這個字來自羅馬神話中的誰？', '火神伏爾坎（Vulcan）'],
  glacier: ['The ___ is melting because of global warming.', '冰河因為全球暖化正在融化。', 'glacier 的形容詞（冰河的、極冷的）是？', 'glacial', 'glacious', 'glacieric', 'glacierly', 'idiom', '「at a glacial pace」是什麼意思？', '慢吞吞地'],
  compass: ['We used a ___ to find north.', '我們用指南針找北方。', 'compass 的複數形是？', 'compasses', 'compasss', 'compassies', 'compassen', 'idiom', '「moral compass」是什麼意思？', '道德準則；是非觀'],
  lantern: ['He carried a ___ through the dark cave.', '他提著燈籠穿過黑暗的洞穴。', '「Lantern Festival」是哪個節日？', '元宵節', '中秋節', '端午節', '清明節', 'origin', 'lantern 來自希臘文 lamptēr，意思是？', '火把、光源'],
  guardian: ['A ___ is a person who protects someone.', '守護者是保護別人的人。', 'guardian 的動詞原形是？', 'guard', 'guarden', 'guardy', 'regard', 'idiom', '「guardian angel」是什麼意思？', '守護天使；保護神'],
  phoenix: ['Like a ___, the city rose again after the fire.', '這座城市像鳳凰一樣在大火後重生。', 'phoenix 的複數形是？', 'phoenixes', 'phoenixs', 'phoenixies', 'phoenixen', 'idiom', '「rise from the ashes like a phoenix」是什麼意思？', '浴火重生'],
  eclipse: ['We watched the solar ___ with special glasses.', '我們戴著特殊眼鏡看日蝕。', 'eclipse 當動詞時是什麼意思？', '使黯然失色；超越', '發光', '旋轉', '融化', 'origin', 'eclipse 來自希臘文 ekleipsis，意思是？', '消失、離開'],
  tempest: ['The ship was lost in the ___.', '船在暴風雨中失蹤了。', 'tempest 的形容詞（狂暴的）是？', 'tempestuous', 'tempestful', 'tempestive', 'tempestous', 'idiom', '「a tempest in a teapot」是什麼意思？', '小題大作'],
  sanctuary: ['The forest is a ___ for wild birds.', '這片森林是野鳥的庇護所。', '和 sanctuary 同字根（神聖）的字是？', 'saint', 'sand', 'sanity', 'center', 'origin', 'sanctuary 來自拉丁文 sanctus，意思是？', '神聖的'],
  valor: ['The soldier was praised for his ___.', '那名士兵因英勇受到讚揚。', 'valor 的形容詞（英勇的）是？', 'valiant', 'valorly', 'valoric', 'valorish', 'idiom', '「Discretion is the better part of valor.」是什麼意思？', '量力而為才是真勇敢'],
  serenity: ['She found ___ in the quiet mountains.', '她在寧靜的山中找到平靜。', 'serenity 的形容詞是？', 'serene', 'serenitious', 'serenous', 'serenful', 'origin', 'serene 來自拉丁文 serenus，原意是？', '晴朗無雲的'],
  labyrinth: ['We got lost in the ___ of narrow streets.', '我們在錯綜複雜的小巷中迷了路。', 'labyrinth 的同義詞是？', 'maze', 'mace', 'mars', 'maize', 'origin', 'labyrinth 的典故是希臘神話中關住誰的迷宮？', '牛頭人米諾陶洛斯'],
  aurora: ['We traveled to Iceland to see the ___.', '我們去冰島看極光。', '「北極光」的英文是？', 'aurora borealis', 'aurora australis', 'aurora major', 'aurora nova', 'origin', 'Aurora 在羅馬神話中是哪位女神？', '黎明女神'],
  // ---------- 英雄擴充第一批（ChatGPT 第二十二輪） ----------

  // ===== N：A1（13 位） =====

  rock: [
    'The ___ is very heavy.',
    '這塊岩石很重。',
    'rock 的複數形是？',
    'rocks', 'rockes', 'rockies', "rock's",
    'idiom',
    '「rock-solid」用來形容承諾或證據，意思是？',
    '非常穩固、可靠',
  ],

  sword: [
    'The ___ is on the table.',
    '那把劍放在桌上。',
    'sword 的複數形是？',
    'swords', 'swordes', 'swordies', "sword's",
    'idiom',
    '「a double-edged sword」比喻什麼？',
    '有利也有弊的雙面刃',
  ],

  night: [
    'The stars come out at ___.',
    '星星在夜晚出現。',
    'night 的複數形是？',
    'nights', 'nightes', 'nighties', "night's",
    'idiom',
    '「call it a night」是什麼意思？',
    '今天到此為止，收工休息',
  ],

  snow: [
    'The ___ is cold.',
    '雪很冰冷。',
    'snow 當動詞時，過去式是？',
    'snowed', 'snowd', 'snown', 'snew',
    'idiom',
    '「snowed under」形容人處於什麼狀態？',
    '忙得不可開交',
  ],

  cloud: [
    'A white ___ is in the sky.',
    '天空中有一朵白雲。',
    'cloud 的複數形是？',
    'clouds', 'cloudes', 'cloudies', "cloud's",
    'idiom',
    '「on cloud nine」表示什麼心情？',
    '欣喜若狂、非常開心',
  ],

  fire: [
    'The ___ is hot.',
    '火很燙。',
    'fire 當動詞時，過去式是？',
    'fired', 'fird', 'fireed', 'firen',
    'idiom',
    '「play with fire」比喻什麼行為？',
    '玩火、冒險招惹危險',
  ],

  bear: [
    'A ___ is sleeping.',
    '有一隻熊正在睡覺。',
    'bear 表示「熊」時，複數形是？',
    'bears', 'beares', 'bearies', 'beers',
    'idiom',
    '「bear hug」是什麼樣的擁抱？',
    '熱情而緊緊的擁抱',
  ],

  wolf: [
    'The ___ runs in the forest.',
    '狼在森林裡奔跑。',
    'wolf 的複數形是？',
    'wolves', 'wolfs', 'wolfes', 'wolvies',
    'idiom',
    '「cry wolf」比喻哪種行為？',
    '謊報危險、亂喊警報',
  ],

  fox: [
    'The ___ has a long tail.',
    '狐狸有一條長尾巴。',
    'fox 的複數形是？',
    'foxes', 'foxs', 'foxies', 'foxen',
    'idiom',
    '「as sly as a fox」形容什麼樣的人？',
    '非常狡猾、精於算計的人',
  ],

  light: [
    'The ___ is bright.',
    '光線很明亮。',
    'light 表示「燈」時，複數形是？',
    'lights', 'lightes', 'lighties', "light's",
    'idiom',
    '「see the light」比喻什麼？',
    '終於理解、恍然大悟',
  ],

  flower: [
    'This ___ is yellow.',
    '這朵花是黃色的。',
    'flower 的複數形是？',
    'flowers', 'floweres', 'floweries', "flower's",
    'idiom',
    '「in full flower」表示什麼？',
    '正值盛開或全盛時期',
  ],

  bell: [
    'The ___ rings at noon.',
    '鈴鐺在中午響起。',
    'bell 的複數形是？',
    'bells', 'belles', 'bellies', "bell's",
    'idiom',
    '「ring a bell」在日常對話中表示什麼？',
    '聽起來耳熟、勾起記憶',
  ],

  smile: [
    'Your ___ makes me happy.',
    '你的微笑讓我很開心。',
    'smile 的複數形是？',
    'smiles', 'smilees', 'smilies', "smile's",
    'idiom',
    '「all smiles」形容什麼狀態？',
    '滿臉笑容、笑逐顏開',
  ],

  // ===== R：A2（13 位） =====

  bridge: [
    'We walked across the ___ after lunch.',
    '午餐後，我們走過那座橋。',
    'bridge 的複數形是？',
    'bridges', 'bridgs', 'bridgees', 'bridgies',
    'idiom',
    '「burn your bridges」比喻什麼？',
    '切斷退路，讓自己無法回頭',
  ],

  iron: [
    'The gate is made of ___.',
    '這扇大門是用鐵製成的。',
    'iron 當動詞時，過去式是？',
    'ironed', 'irond', 'ironing', 'ironen',
    'idiom',
    '「strike while the iron is hot」提醒我們什麼？',
    '把握時機、趁熱打鐵',
  ],

  smoke: [
    'Thick ___ filled the room.',
    '濃煙充滿整個房間。',
    'smoke 當動詞時，過去式是？',
    'smoked', 'smoken', 'smokt', 'smokeed',
    'idiom',
    '「where there is smoke, there is fire」表達什麼看法？',
    '無風不起浪，傳聞可能有其原因',
  ],

  mirror: [
    'She checked her hair in the ___ before leaving.',
    '她出門前照鏡子整理頭髮。',
    'mirror 的複數形是？',
    'mirrors', 'mirrores', 'mirries', "mirror's",
    'idiom',
    '「smoke and mirrors」比喻什麼？',
    '障眼法、用假象掩蓋真相',
  ],

  cave: [
    'They explored a dark ___ near the river.',
    '他們探索河邊一個漆黑的洞穴。',
    'cave 的複數形是？',
    'caves', 'cavees', 'cavies', 'cavens',
    'idiom',
    '「cave in」用來描述爭執時的行為，意思是？',
    '屈服、讓步、不再堅持',
  ],

  spark: [
    'A tiny ___ flew from the campfire.',
    '一點小火星從營火中飛出。',
    'spark 的複數形是？',
    'sparks', 'sparkes', 'sparkies', 'sparken',
    'origin',
    'spark 源自古英語 spearca，最早指什麼？',
    '從火中飛出的火星',
  ],

  ash: [
    'Gray ___ covered the ground after the fire.',
    '火災後，灰色的灰燼覆蓋地面。',
    'ash 表示「灰燼」時，常用的複數形是？',
    'ashes', 'ashs', 'ashies', 'ashen',
    'idiom',
    '「rise from the ashes」比喻什麼？',
    '從毀滅或失敗中重新崛起',
  ],

  torch: [
    'He carried a burning ___ through the tunnel.',
    '他拿著燃燒的火把穿過隧道。',
    'torch 的複數形是？',
    'torches', 'torchs', 'torchies', "torch's",
    'idiom',
    '「pass the torch」比喻什麼？',
    '把責任或使命傳給下一代',
  ],

  sunrise: [
    'We watched the ___ from the hill.',
    '我們在山丘上欣賞日出。',
    'sunrise 的複數形是？',
    'sunrises', 'sunrisies', 'sunrisees', 'sunrisen',
    'origin',
    'sunrise 是由哪兩個英文單字組成？',
    'sun（太陽）和 rise（升起）',
  ],

  flame: [
    'The blue ___ flickered in the wind.',
    '藍色的火焰在風中搖曳。',
    'flame 的複數形是？',
    'flames', 'flams', 'flamees', 'flamies',
    'idiom',
    '「fan the flames」比喻什麼？',
    '火上加油、使衝突更加激烈',
  ],

  root: [
    'A thick ___ grew under the garden wall.',
    '一條粗樹根長到花園牆下。',
    'root 的複數形是？',
    'roots', 'rootes', 'rooties', "root's",
    'idiom',
    '「get to the root of something」表示什麼？',
    '找出事情的根本原因',
  ],

  moss: [
    'Soft ___ grew on the wet stones.',
    '柔軟的苔蘚長在潮濕的石頭上。',
    'moss 的形容詞形式是？',
    'mossy', 'mossed', 'mossful', 'mossish',
    'idiom',
    '「a rolling stone gathers no moss」比喻什麼？',
    '經常變動的人難以累積穩定根基',
  ],

  shield: [
    'The guard lifted his ___ before the attack.',
    '守衛在攻擊來臨前舉起盾牌。',
    'shield 的複數形是？',
    'shields', 'shieldes', 'shieldies', "shield's",
    'origin',
    'shield 源自古英語 scield，原本指什麼？',
    '保護身體、抵擋攻擊的盾牌',
  ],

  // ===== SR：B1～B2（11 位） =====

  rift: [
    'The sudden earthquake opened a deep ___ across the valley.',
    '突如其來的地震在山谷間裂出一道深溝。',
    'rift 的複數形是？',
    'rifts', 'riftes', 'rifties', "rift's",
    'origin',
    'rift 來自斯堪地那維亞語源，原始意思與什麼有關？',
    '撕裂、裂開形成的縫隙',
  ],

  tremor: [
    'A faint ___ passed through the building before the stronger earthquake struck.',
    '強震來臨前，建築物先出現一陣輕微震動。',
    'tremor 的複數形是？',
    'tremors', 'tremores', 'tremories', "tremor's",
    'origin',
    'tremor 源自拉丁語 tremere，意思是什麼？',
    '顫抖、震動',
  ],

  alloy: [
    'The engineers developed a new ___ that combines strength with low weight.',
    '工程師研發了一種兼具強度與輕量化特性的新合金。',
    'alloy 的複數形是？',
    'alloys', 'alloyes', 'alloies', "alloy's",
    'origin',
    'alloy 的字源可追溯到古法語的「結合、組合」，與什麼概念有關？',
    '將不同材料結合在一起',
  ],

  drought: [
    'After months without rain, the prolonged ___ threatened the local water supply.',
    '連續數月沒有降雨，長期乾旱威脅當地供水。',
    'drought 的複數形是？',
    'droughts', 'droughtes', 'droughties', "drought's",
    'origin',
    'drought 的古英語語源與 dry 有關，原本強調什麼？',
    '乾燥、缺乏水分',
  ],

  inferno: [
    'Within minutes, the warehouse had become an ___ that firefighters struggled to contain.',
    '短短幾分鐘，倉庫就化為消防員難以控制的一片火海。',
    'inferno 的常見複數形是？',
    'infernos', 'infernies', 'infernoies', 'inferni',
    'origin',
    'inferno 來自義大利語，原本指什麼地方？',
    '地獄、冥界',
  ],

  midnight: [
    'The last train departed shortly before ___, leaving only a few passengers at the station.',
    '最後一班列車在午夜前不久離站，月台只剩少數乘客。',
    'midnight 的正確拼寫是？',
    'midnight', 'midnite', 'middnight', 'midnigth',
    'origin',
    'midnight 中的 mid- 表示什麼概念？',
    '中間，指夜晚的中間時段',
  ],

  fortress: [
    'The ancient ___ was built on a cliff to withstand repeated attacks.',
    '古老的堡壘建在峭壁上，以抵禦接連不斷的攻擊。',
    'fortress 的複數形是？',
    'fortresses', 'fortresss', 'fortressies', 'fortreses',
    'origin',
    'fortress 的字源可追溯至拉丁語 fortis，意思是？',
    '強壯、堅固',
  ],

  fury: [
    'Her quiet disappointment turned to ___ when she discovered the deception.',
    '發現自己受騙後，她原本平靜的失望轉為暴怒。',
    'fury 對應的形容詞是？',
    'furious', 'furyous', 'furiously', 'furies',
    'origin',
    'fury 源自拉丁語 furia，主要代表哪種情緒？',
    '狂怒、強烈的憤怒',
  ],

  phantom: [
    'Witnesses claimed that a pale ___ appeared in the abandoned theater every winter.',
    '目擊者聲稱，每年冬天廢棄劇院裡都會出現蒼白的幽靈。',
    'phantom 的複數形是？',
    'phantoms', 'phantomes', 'phantomies', "phantom's",
    'origin',
    'phantom 可追溯至希臘語 phantasma，原本指什麼？',
    '幻影、顯現出來的影像',
  ],

  bloom: [
    'The rare orchid produced its first ___ after several years of careful cultivation.',
    '經過數年細心栽培，這株珍稀蘭花終於開出第一朵花。',
    'bloom 當動詞時，過去式是？',
    'bloomed', 'bloomeed', 'bloomt', 'bloomen',
    'idiom',
    '「in full bloom」形容植物處於什麼狀態？',
    '花朵完全盛開',
  ],

  anchor: [
    'The captain ordered the crew to lower the ___ before the storm reached the harbor.',
    '船長命令船員在暴風雨抵達港口前放下船錨。',
    'anchor 的複數形是？',
    'anchors', 'anchores', 'anchories', "anchor's",
    'idiom',
    '航海用語「weigh anchor」表示什麼動作？',
    '起錨，準備開船',
  ],

  // ===== SSR：B2～C1（1 位） =====

  tenacity: [
    'Her remarkable ___ enabled the expedition to continue despite repeated failures and dwindling supplies.',
    '即使屢遭失敗、補給逐漸減少，她驚人的堅韌仍讓探險隊繼續前進。',
    'tenacity 對應的形容詞是？',
    'tenacious', 'tenacities', 'tenaciously', 'tenacitive',
    'origin',
    'tenacity 的字源可追溯至拉丁語 tenere，原始核心概念是？',
    '牢牢抓住、堅持不放',
  ],
};

export const HERO_LORE: Record<string, HeroLore> = Object.fromEntries(Object.entries(ROWS).map(([id, r]) => [id, {
  usage: { en: r[0], zh: r[1] },
  form: { q: r[2], answer: r[3], wrong: [r[4], r[5], r[6]] },
  lore: { type: r[7], q: r[8], answer: r[9] },
}]));
