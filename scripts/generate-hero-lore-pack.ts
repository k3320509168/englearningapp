import fs from 'node:fs';

// 62 位新英雄的真名資料
const NEW_LORE: Record<string, [string, string, string, string, string, string, string, 'idiom' | 'origin', string, string]> = {
  // N 19位
  hill: [
    'They walked up the green ___ to watch the sunset.',
    '他們走上翠綠的山丘看日落。',
    'hill 的複數形是？', 'hills', 'hilles', 'hillies', 'hillz',
    'idiom', '「over the hill」是什麼意思？', '走下坡；上了年紀',
  ],
  leaf: [
    'A yellow ___ fell from the tall tree.',
    '一片黃葉從高高的樹上掉下來。',
    'leaf 的複數形是？', 'leaves', 'leafs', 'leafes', 'leavs',
    'idiom', '「turn over a new leaf」是什麼意思？', '改過自新；重新開始',
  ],
  lake: [
    'We went for a boat ride on the quiet ___.',
    '我們在安靜的湖上划船。',
    'lake 的複數形是？', 'lakes', 'lakees', 'lakies', 'lakez',
    'idiom', '「jump in the lake」是什麼意思？', '走開；別來煩我',
  ],
  sand: [
    'The children played with ___ on the beach.',
    '孩子們在海灘上玩沙子。',
    'sand 當動詞時常指什麼動作？', '用砂紙打磨', '堆沙堡', '澆水', '游泳',
    'idiom', '「build on sand」是什麼意思？', '基礎不穩固；空中閣樓',
  ],
  wind: [
    'A cold ___ blew through the open window.',
    '一陣冷風穿過敞開的窗戶吹了進來。',
    'wind 的形容詞（起風的、多風的）是？', 'windy', 'windful', 'windish', 'windly',
    'idiom', '「get wind of something」是什麼意思？', '獲悉某事；聽到風聲',
  ],
  wave: [
    'A huge ___ splashed against the sea wall.',
    '一陣巨浪拍打在海堤上。',
    'wave 當動詞除了揮手還可以表示？', '波動、起伏', '潛水', '奔跑', '靜止',
    'idiom', '「make waves」是什麼意思？', '製造混亂；興風作浪',
  ],
  seed: [
    'She planted a flower ___ in the garden pot.',
    '她在花盆裡種下了一粒花種子。',
    'seed 的動詞「播種」進行式是？', 'seeding', 'seedding', 'seedeing', 'seedy',
    'origin', 'seed 源自古日耳曼語，與哪個動詞同源？', 'sow（播種）',
  ],
  grass: [
    'Cows and sheep are grazing on the green ___.',
    '牛和羊正在青草地上吃草。',
    'grass 的形容詞（長滿草的）是？', 'grassy', 'grassful', 'grassish', 'grassly',
    'idiom', '「grass roots」常比喻什麼？', '基層群眾；基層力量',
  ],
  path: [
    'Follow this stone ___ to reach the quiet village.',
    '順著這條石子小徑走，就能到達那個寧靜的村莊。',
    'path 的複數形是？', 'paths', 'pathes', 'pathz', 'pathies',
    'idiom', '「cross paths with someone」是什麼意思？', '與某人不期而遇；偶遇',
  ],
  door: [
    'Please close the front ___ when you leave.',
    '離開時請關上前門。',
    'door 的複數形是？', 'doors', 'doores', 'doorz', 'doories',
    'idiom', '「behind closed doors」是什麼意思？', '秘密進行；閉門會議',
  ],
  ring: [
    'He gave her a silver ___ on their special day.',
    '他在特別的日子送給她一枚銀戒指。',
    'ring 當動詞「響起」的過去式是？', 'rang', 'ringed', 'rung', 'rong',
    'idiom', '「ring a bell」是什麼意思？', '聽起來耳熟；有印象',
  ],
  rope: [
    'The sailor tied the boat securely with a strong ___.',
    '水手用一根結實的繩索把船牢牢繫住。',
    'rope 的複數形是？', 'ropes', 'ropees', 'ropies', 'ropez',
    'idiom', '「learn the ropes」是什麼意思？', '摸索規律；掌握門道',
  ],
  horn: [
    'The guard blew a golden ___ to alert the camp.',
    '衛兵吹響金色號角以警告營地。',
    'horn 的形容詞（角質的）是？', 'horny', 'hornful', 'hornish', 'hornly',
    'idiom', '「blow one\'s own horn」是什麼意思？', '自吹自擂；王婆賣瓜',
  ],
  coin: [
    'He flipped a shiny gold ___ to make the decision.',
    '他擲了一枚發亮的金幣來做決定。',
    'coin 當動詞時最常表示什麼？', '創造（新詞、說法）', '付錢', '儲蓄', '偷竊',
    'idiom', '「two sides of the same coin」是什麼意思？', '同一問題的兩個面向',
  ],
  lamp: [
    'She lit a small oil ___ to read in the dark room.',
    '她在昏暗的房間裡點亮了一盞小油燈來閱讀。',
    'lamp 的複數形是？', 'lamps', 'lampes', 'lampz', 'lampies',
    'idiom', '「smell of the lamp」比喻作品如何？', '刻苦推敲；缺乏靈氣',
  ],
  cup: [
    'He drank a warm ___ of tea by the fireplace.',
    '他在壁爐旁喝了一熱杯茶。',
    'cup 當動詞時常表示手做出什麼動作？', '拱手成杯狀', '拍掌', '揮手', '緊握拳頭',
    'idiom', '「not my cup of tea」是什麼意思？', '不是我喜歡的人事物',
  ],
  nest: [
    'The mother bird built a warm ___ in the high branches.',
    '鳥媽媽在高高的樹枝間築了一個溫暖的鳥巢。',
    'nest 當動詞時是什麼意思？', '築巢、窩著', '飛行', '鳴叫', '覓食',
    'idiom', '「feather one\'s own nest」是什麼意思？', '中飽私囊；謀取私利',
  ],
  pond: [
    'Ducks are swimming smoothly on the clear ___.',
    '鴨子正在清澈的池塘上順暢地游著。',
    'pond 的複數形是？', 'ponds', 'pondes', 'pondz', 'pondies',
    'idiom', '「across the pond」常代指跨過哪裡？', '大西洋（英美之間）',
  ],
  frog: [
    'A green ___ leaped from the lotus leaf into the water.',
    '一隻綠色的青蛙從荷葉上跳進了水裡。',
    'frog 的複數形是？', 'frogs', 'froges', 'frogz', 'froggies',
    'idiom', '「have a frog in one\'s throat」是什麼意思？', '喉嚨沙啞、說不出話',
  ],

  // R 18位
  valley: [
    'The peaceful village is nestled deep in the mountain ___.',
    '那座寧靜的村莊座落在崇山峽谷深處。',
    'valley 的複數形是？', 'valleys', 'vallies', 'valleyes', 'valleyses',
    'origin', 'valley 經由古法語源自拉丁語 vallis，原意是？', '低谷、山谷',
  ],
  stream: [
    'Clear mountain water flows through the rocky ___.',
    '清澈的山水流經多石的小溪。',
    'stream 當動詞在現代數位科技中最常指？', '串流播放（影音）', '過濾', '列印', '儲存',
    'idiom', '「swim against the stream」是什麼意思？', '力排眾議；反潮流而行',
  ],
  desert: [
    'Camels are well suited for traveling across the dry ___.',
    '駱駝非常適合在乾燥的荒漠中長途旅行。',
    'desert 當動詞且發音在第二音節時是什麼意思？', '拋棄、擅離職守', '變甜', '加熱', '灌溉',
    'origin', 'desert 源自拉丁語 desertus，原意是？', '被遺棄的土地',
  ],
  cliff: [
    'They stood at the edge of the high ___ looking at the ocean.',
    '他們站在高高的懸崖邊凝望著大海。',
    'cliff 的複數形是？', 'cliffs', 'cliffes', 'clivs', 'cliffies',
    'idiom', '「cliffhanger」常指什麼樣的結局？', '懸念叢生、未完待續的收尾',
  ],
  feather: [
    'The eagle dropped a majestic white ___ from high above.',
    '老鷹從高空落下一根莊嚴的白色羽毛。',
    'feather 的形容詞（長滿羽毛的、輕盈如羽的）是？', 'feathery', 'featherful', 'featherish', 'featherly',
    'idiom', '「birds of a feather」接續哪句話？', 'flock together（物以類聚）',
  ],
  branch: [
    'The tiny bird perched safely on a slender tree ___.',
    '小鳥安全地停在細細的樹枝上。',
    'branch 的複數形是？', 'branches', 'branchs', 'branchies', 'branchz',
    'idiom', '「hold out an olive branch」是什麼意思？', '伸出橄欖枝；主動求和',
  ],
  harbor: [
    'Many ships found safe shelter in the deep-water ___.',
    '許多船隻在深水港口裡找到了安全的避風港。',
    'harbor 當動詞時最常表示什麼心態？', '心懷（怨恨、希望等）', '啟航', '修船', '造浪',
    'origin', 'harbor 原指軍隊避難之所，來自哪個古德語詞彙？', 'here-beorg（軍隊庇護所）',
  ],
  meadow: [
    'Wildflowers bloom beautifully across the open ___.',
    '野花在遼闊的草甸上美麗地綻放。',
    'meadow 的複數形是？', 'meadows', 'meadowes', 'meadowies', 'meadowz',
    'origin', 'meadow 源自古英語 mæd，原始概念與什麼相關？', '割草與放牧之地',
  ],
  breeze: [
    'A gentle spring ___ made the chimes ring softly.',
    '一陣溫和的春風讓風鈴輕輕作響。',
    'breeze 的形容詞（微風徐徐的）是？', 'breezy', 'breezeful', 'breezish', 'breezly',
    'idiom', '「shoot the breeze」是什麼意思？', '閒扯淡；閒聊',
  ],
  cavern: [
    'The explorers entered the dark ___ with their torches lit.',
    '探險家點著火炬走進了幽暗的巨窟。',
    'cavern 的形容詞（巨大而幽深如窟的）是？', 'cavernous', 'cavernful', 'cavernish', 'cavernly',
    'origin', 'cavern 來自拉丁語 caverna，與哪個詞同根？', 'cavus（中空的）',
  ],
  beacon: [
    'The hilltop lighthouse served as a guiding ___ for ships.',
    '山頂的燈塔成為引導船隻前行的信標。',
    'beacon 的複數形是？', 'beacons', 'beacones', 'beacony', 'beaconz',
    'idiom', '「a beacon of hope」比喻什麼？', '指路明燈；希望的象徵',
  ],
  spear: [
    'The ancient warrior held a sharp bronze ___ in his hand.',
    '古代戰士手中握著一柄鋒利的青銅長矛。',
    'spear 當動詞時是什麼意思？', '刺穿、用矛刺', '拋擲', '折斷', '鍛造',
    'idiom', '「spearhead」當動詞表示什麼？', '帶頭發起、先鋒推進',
  ],
  blade: [
    'The master blacksmith forged a razor-sharp steel ___.',
    '鍛造大師打出了一面吹毛立斷的鋼鐵利刃。',
    'blade 除了刀刃，還可以指哪種常見植物的部位？', '草葉（a blade of grass）', '樹根', '花瓣', '果實',
    'origin', 'blade 源自印歐語系，與哪個意象相關？', '扁平展開的扁面',
  ],
  hammer: [
    'He used a heavy iron ___ to drive the nail in.',
    '他用一把沉重的鐵錘把釘子敲了進去。',
    'hammer 當動詞時引申表示什麼？', '反覆敲定；反覆強調', '逃跑', '修補', '測量',
    'idiom', '「go at it hammer and tongs」是什麼意思？', '全力以赴；激烈爭吵',
  ],
  arrow: [
    'The archer released the wooden ___ straight into the center.',
    '弓箭手將木箭射出，直中靶心。',
    'arrow 的複數形是？', 'arrows', 'arrowes', 'arrowies', 'arrowz',
    'idiom', '「straight as an arrow」比喻人如何？', '為人正直、坦率無欺',
  ],
  echo: [
    'His shout created a distinct ___ across the wide canyon.',
    '他的呼喊在寬闊的峽谷中激起了一陣清晰的回音。',
    'echo 的複數形是？', 'echoes', 'echos', 'echoies', 'echoez',
    'origin', 'echo 來自希臘神話中因多話而被罰只能重複旁人最後一詞的仙女：', '厄科（Echo）',
  ],
  crown: [
    'The newly elected monarch wore a heavy golden ___.',
    '新登基的君主頭戴沉重的金色王冠。',
    'crown 當動詞在賽事或榮譽中常表示？', '為……加冕；榮獲冠軍', '罷免', '批評', '審判',
    'idiom', '「crowning achievement」是什麼意思？', '畢生最卓越的成就',
  ],
  scroll: [
    'The ancient scholar carefully unrolled the sacred parchment ___.',
    '古代學者小心翼翼地攤開了神聖的羊皮卷軸。',
    'scroll 在現代電腦操作中代表什麼動作？', '捲動頁面', '存檔', '刪除', '關閉',
    'origin', 'scroll 早期形式與哪個詞同源？', 'escrove（一條紙片）',
  ],

  // SR 15位
  avalanche: [
    'The sudden loud noise triggered a massive snow ___ on the mountain.',
    '突如其來的巨響引發了山上一場巨大的雪崩。',
    'avalanche 在比喻意義上常表示什麼？', '大量的湧入、鋪天蓋地而來', '微小震顫', '融化', '平息',
    'origin', 'avalanche 源自法語，其詞根與哪個動作相關？', '滑落、墜落',
  ],
  bolt: [
    'A sudden ___ of lightning illuminated the dark stormy sky.',
    '一道突如其來的閃電雷矢照亮了幽暗暴風的天空。',
    'bolt 當動詞且用於動物或人時常指什麼動作？', '突然奔逃、猛衝', '沉睡', '呼喊', '哭泣',
    'idiom', '「a bolt from the blue」是什麼意思？', '晴天霹靂；突發的意外事件',
  ],
  whirlwind: [
    'A dusty ___ swept rapidly across the dry western plains.',
    '一陣捲著塵土的旋風迅速掃過乾燥的西部平原。',
    'whirlwind 在比喻意義上常用來修飾什麼？', '旋風般神速的（行程、戀愛）', '極度緩慢的', '冷靜的', '孤單的',
    'idiom', '「reap the whirlwind」意指承擔何種後果？', '惡果累累；自作自受',
  ],
  meteor: [
    'A blazing ___ streaked across the clear night sky.',
    '一顆燃燒的流星劃過了晴朗的夜空。',
    'meteor 的形容詞（氣象學的、迅速璀璨的）是？', 'meteoric', 'meteorful', 'meteorish', 'meteorly',
    'idiom', '「meteoric rise」常形容何種崛起？', '平步青雲；極為迅速的竄紅',
  ],
  tundra: [
    'Only specialized moss and small shrubs can survive on the frozen ___.',
    '只有特化的苔蘚與小灌木能在冰凍的凍原上生存。',
    'tundra 的氣候特點是？', '嚴寒且樹木稀少', '高溫多雨', '潮濕悶熱', '多風乾燥無冰',
    'origin', 'tundra 源自薩米語（Sámi），原意是？', '無樹的高地',
  ],
  canyon: [
    'The mighty river carved a deep rocky ___ over millions of years.',
    '這條大河在數百萬年間切割出了一條深邃險峻的岩石峽谷。',
    'canyon 的複數形是？', 'canyons', 'canyones', 'canyonies', 'canyonz',
    'origin', 'canyon 源自西班牙語 cañón，原意是？', '管狀通道、裂口',
  ],
  forge: [
    'The blacksmith worked tirelessly in the hot ___ all day.',
    '鐵匠整天在炙熱的鍛爐旁孜孜不倦地工作。',
    'forge 除了鍛造，若在法律文書方面當動詞常指？', '偽造、偽造證件', '買賣', '認證', '銷毀',
    'idiom', '「forge ahead」是什麼意思？', '穩健前進；迎難而上',
  ],
  bastion: [
    'The stone fortress remained a solid ___ of defense against the invaders.',
    '這座石造要塞依然是抵禦入侵者的堅固堡壘。',
    'bastion 在比喻中常指什麼的陣地？', '某種思想、文化或體制的堡壘', '軟肋', '廢墟', '陷阱',
    'origin', 'bastion 源自古意大利語 bastire，原意是？', '建造、修築防禦工事',
  ],
  relic: [
    'The museum displays a holy ___ preserved from the third century.',
    '博物館展出了一件從三世紀完好保存下來的神聖聖物。',
    'relic 的複數形是？', 'relics', 'relices', 'relicies', 'relicz',
    'origin', 'relic 來自拉丁語 reliquiae，原始概念與什麼相關？', '遺留之物、遺跡殘片',
  ],
  zenith: [
    'At noon, the sun reached its absolute ___ directly above us.',
    '正午時分，太陽攀上了正位於我們頭頂的天頂最高點。',
    'zenith 的反義詞（天底、最低谷）是？', 'nadir', 'bottom', 'zero', 'floor',
    'origin', 'zenith 源自阿拉伯語 سمت（samt），原指？', '頭頂正上方的方向',
  ],
  vortex: [
    'The sinking ship was pulled down into the swirling water ___.',
    '沉沒的船隻被拖入了打轉的水流漩渦之中。',
    'vortex 的標準複數形包含？', 'vortices', 'vortexes', 'vorti', 'vortexis',
    'origin', 'vortex 與哪個拉丁語動詞同源？', 'vertere（旋轉、轉向）',
  ],
  sentinel: [
    'The lone ___ stood watch through the cold midnight rain.',
    '孤單的哨兵在冰冷的午夜雨中佇立警戒。',
    'sentinel 的同義詞是？', 'guard', 'worker', 'farmer', 'traveler',
    'origin', 'sentinel 來自意大利語 sentinella，核心意涵是？', '站崗巡邏的警備者',
  ],
  prophet: [
    'The ancient ___ warned the king of the coming disaster.',
    '古代先知警告國王即將降臨的災難。',
    'prophet 的名詞（預言）是？', 'prophecy', 'propheting', 'prophethood', 'prophesying',
    'origin', 'prophet 來自希臘語 prophētēs，字面意義是？', '為神代言者、揭示者',
  ],
  omen: [
    'The sudden solar eclipse was regarded as a dark ___ by the villagers.',
    '突如其來的日蝕被村民視為一種不祥的預兆。',
    'omen 的形容詞（吉凶未卜的、預示的）是？', 'ominous', 'omenful', 'omenish', 'omenly',
    'origin', 'omen 來自拉丁語，原指？', '神諭的預兆言辭',
  ],
  solstice: [
    'The summer ___ marks the longest daylight period of the entire year.',
    '夏至標誌著整年之中白晝最長的一天。',
    'solstice 每一年發生幾次？', '兩次（夏至與冬至）', '一次', '四次', '每個月一次',
    'origin', 'solstice 由 sol（太陽）與 sistere（停止）組成，意指？', '太陽達到極限時彷彿停步',
  ],

  // SSR 6位
  radiance: [
    'Her pure ___ illuminated the dark cavern and brought hope to all.',
    '她純潔的光輝照亮了幽暗的巨窟，為所有人帶來了希望。',
    'radiance 的形容詞（光芒四射的）是？', 'radiant', 'radiancy', 'radiantly', 'radiating',
    'origin', 'radiance 來自拉丁語 radiare，核心是？', '向外發射光線與能量',
  ],
  nemesis: [
    'The corrupt ruler finally met his unmatched ___ in the righteous hero.',
    '那位腐敗的統治者終於在正義的英雄面前迎來了他無法逃脫的天罰剋星。',
    'nemesis 的複數形是？', 'nemeses', 'nemesiss', 'nemesises', 'nemesiez',
    'origin', 'Nemesis 在希臘神話中是掌管什麼的神祇？', '復仇與神聖報應之女神',
  ],
  chivalry: [
    'True ___ demands protecting the weak without expecting any reward.',
    '真正的騎士道要求保護弱者，而不企求任何回報。',
    'chivalry 的形容詞（具紳士風度的、英勇的）是？', 'chivalrous', 'chivalric', 'chivalryful', 'chivalryly',
    'origin', 'chivalry 經由古法語 chevalier，源自？', '騎兵、騎士階級之守則',
  ],
  solitude: [
    'In quiet ___, the ancient archer found her deepest inner focus.',
    '在安寧的孤寂之中，那位古老的弓箭手找到了她內心最深處的專注。',
    'solitude 的形容詞是？', 'solitary', 'solitudeful', 'solitudish', 'solitudely',
    'idiom', '「splendid solitude」形容何種狀態？', '自得其樂的獨處生活',
  ],
  genesis: [
    'The miraculous rainfall marked the new ___ of the barren lands.',
    '那場神奇的甘霖標誌著這片不毛之地的全新創世與復甦。',
    'genesis 的同義名詞是？', 'origin', 'finish', 'destruction', 'delay',
    'origin', 'Genesis 來自希臘語，字面意思是？', '出生、起源、創生',
  ],
  titan: [
    'The ancient stone ___ stepped forward and crushed the dark fortress.',
    '古老的岩石泰坦邁步向前，踏平了黑暗要塞。',
    'titan 的形容詞（巨大的、極為崇高的）是？', 'titanic', 'titanous', 'titanful', 'titanly',
    'origin', 'Titans 在希臘神話中是指？', '奧林帕斯神系之前統治世界的遠古巨神群',
  ],

  // UR 4位
  oblivion: [
    'The dark void absorbed all spoken words into eternal ___.',
    '黑暗虛空將所有說出口的話語吸收進了永恆的湮滅。',
    'oblivion 的形容詞（遺忘的、未察覺的）是？', 'oblivious', 'oblivionful', 'oblivionous', 'oblivionly',
    'origin', 'oblivion 來自拉丁語 oblivisci，原意是？', '忘記、消逝無蹤',
  ],
  infinity: [
    'The universe stretches into breathtaking ___ beyond all imagination.',
    '宇宙向著超乎所有想像的驚人無限延伸而去。',
    'infinity 的形容詞（無限的、無窮盡的）是？', 'infinite', 'infinitive', 'infinitous', 'infinitly',
    'origin', 'infinity 由 in-（否定前綴）加上 finis（邊界、終點）構成，意為？', '沒有邊界之物',
  ],
  eternity: [
    'Their names and courageous deeds will echo through all ___.',
    '他們的名字與英勇事蹟將響徹整個永恆。',
    'eternity 的形容詞（永恆的、不朽的）是？', 'eternal', 'eternous', 'eternly', 'eternative',
    'origin', 'eternity 源自拉丁語 aeternitas，指代？', '無始無終的時間流逝',
  ],
  apocalypse: [
    'The hero stopped the rising darkness before the predicted ___ arrived.',
    '英雄在預言中的毀滅天啟降臨之前，成功遏制了升騰的黑暗。',
    'apocalypse 的形容詞是？', 'apocalyptic', 'apocalypso', 'apocalypseful', 'apocalyptous',
    'origin', 'apocalypse 來自希臘語 apokalyptein，原意是？', '揭開、揭示隱藏之真相',
  ],
};

console.log('正在注入 62 筆真名題組至 src/game/heroLore.ts...');
const path = 'src/game/heroLore.ts';
let content = fs.readFileSync(path, 'utf8');

// 格式化為 Rows 條目
let rowsCode = '\n  // ==========================================\n  // 英雄擴充第二批（62 位新英雄真名題組）\n  // ==========================================\n';
for (const [id, r] of Object.entries(NEW_LORE)) {
  rowsCode += `  ${id}: [\n    ${JSON.stringify(r[0])},\n    ${JSON.stringify(r[1])},\n    ${JSON.stringify(r[2])},\n    ${JSON.stringify(r[3])}, ${JSON.stringify(r[4])}, ${JSON.stringify(r[5])}, ${JSON.stringify(r[6])},\n    ${JSON.stringify(r[7])},\n    ${JSON.stringify(r[8])},\n    ${JSON.stringify(r[9])},\n  ],\n`;
}

// 插入 ROWS 字典結尾之前
const target = 'tenacity: [\n    \'Her remarkable ___ enabled the expedition to continue despite repeated failures and dwindling supplies.\',\n    \'即使屢遭失敗、補給逐漸減少，她驚人的堅韌仍讓探險隊繼續前進。\',\n    \'tenacity 對應的形容詞是？\',\n    \'tenacious\', \'tenacities\', \'tenaciously\', \'tenacitive\',\n    \'origin\',\n    \'tenacity 的字源可追溯至拉丁語 tenere，原始核心概念是？\',\n    \'牢牢抓住、堅持不放\',\n  ],\n};';

const replacement = 'tenacity: [\n    \'Her remarkable ___ enabled the expedition to continue despite repeated failures and dwindling supplies.\',\n    \'即使屢遭失敗、補給逐漸減少，她驚人的堅韌仍讓探險隊繼續前進。\',\n    \'tenacity 對應的形容詞是？\',\n    \'tenacious\', \'tenacities\', \'tenaciously\', \'tenacitive\',\n    \'origin\',\n    \'tenacity 的字源可追溯至拉丁語 tenere，原始核心概念是？\',\n    \'牢牢抓住、堅持不放\',\n  ],' + rowsCode + '};';

if (!content.includes(target)) {
  console.error('找不到 target 字串！');
  process.exit(1);
}

content = content.replace(target, replacement);
fs.writeFileSync(path, content, 'utf8');
console.log('✅ 成功注入 62 筆真名考驗題組！');
