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
};

export const HERO_LORE: Record<string, HeroLore> = Object.fromEntries(Object.entries(ROWS).map(([id, r]) => [id, {
  usage: { en: r[0], zh: r[1] },
  form: { q: r[2], answer: r[3], wrong: [r[4], r[5], r[6]] },
  lore: { type: r[7], q: r[8], answer: r[9] },
}]));
