import { sentenceMatchRatio } from './battle';

// 世界王突襲（語音詠唱破盾模式）
// 玩家在限時 60 秒內面對世界王「天穹暴君・法夫納」，必須連續成功朗讀神聖古咒打破其 1,000,000 HP 核心護盾！
export interface ChantSpell {
  id: string;
  en: string;
  zh: string;
  speak: string;
  keyword: string; // 拼寫備援關鍵詞
}

export const WORLD_BOSS_HP = 1_000_000;
export const WORLD_BOSS_TIME = 60;
export const DAMAGE_PER_CHANT = 150_000;
export const COMBO_BONUS_DAMAGE = 300_000;

export const CHANT_SPELLS: ChantSpell[] = [
  { id: 'c01', en: 'By the sacred flame of truth, consume all darkness!', zh: '以此真理之神聖烈焰，吞噬一切黑暗！', speak: 'by the sacred flame of truth consume all darkness', keyword: 'SACRED' },
  { id: 'c02', en: 'Awaken, guardians of the light, and strike down the tyrant!', zh: '覺醒吧光輝之守護者，擊倒眼前的暴君！', speak: 'awaken guardians of the light and strike down the tyrant', keyword: 'GUARDIANS' },
  { id: 'c03', en: 'Rise from the ashes of eternity, burn with unyielding fury!', zh: '自永恆的灰燼中重生，燃燒不屈的狂怒！', speak: 'rise from the ashes of eternity burn with unyielding fury', keyword: 'ETERNITY' },
  { id: 'c04', en: 'Through storms and shadows, our resolve remains unbroken!', zh: '縱歷風暴與陰影，吾等信念堅不可摧！', speak: 'through storms and shadows our resolve remains unbroken', keyword: 'RESOLVE' },
  { id: 'c05', en: 'Hear the ancient oath of dragons, shatter the crystalline seal!', zh: '傾聽巨龍遠古之誓約，粉碎晶石封印！', speak: 'hear the ancient oath of dragons shatter the crystalline seal', keyword: 'DRAGONS' },
  { id: 'c06', en: 'We stand united beneath the stars, fearless and free!', zh: '吾等團結於群星之下，無畏且自由！', speak: 'we stand united beneath the stars fearless and free', keyword: 'UNITED' },
  { id: 'c07', en: 'Let the divine thunder strike the heart of chaos!', zh: '讓神聖雷霆直擊混沌核心！', speak: 'let the divine thunder strike the heart of chaos', keyword: 'THUNDER' },
  { id: 'c08', en: 'Shine forever, beacon of wisdom and glorious hope!', zh: '永恆閃耀吧，智慧與榮耀希望的燈塔！', speak: 'shine forever beacon of wisdom and glorious hope', keyword: 'WISDOM' },
  { id: 'c09', en: 'Unleash the tempest of righteous justice upon this world!', zh: '在此世間釋放正義的狂怒風暴！', speak: 'unleash the tempest of righteous justice upon this world', keyword: 'TEMPEST' },
  { id: 'c10', en: 'With every breath, we forge a new destiny of light!', zh: '以每一口呼吸，鑄造光明的嶄新命運！', speak: 'with every breath we forge a new destiny of light', keyword: 'DESTINY' },
  { id: 'c11', en: 'Break through the silence, sing the song of victory!', zh: '衝破沉寂，奏響無上勝利之歌！', speak: 'break through the silence sing the song of victory', keyword: 'VICTORY' },
  { id: 'c12', en: 'The dawn has come to banish the longest night!', zh: '破曉已至，驅散最漫長的永夜！', speak: 'the dawn has come to banish the longest night', keyword: 'DAWN' },
  { id: 'c13', en: 'Stand firm like mountains against the crushing tides!', zh: '如山岳般屹立，傲迎狂暴驚濤！', speak: 'stand firm like mountains against the crushing tides', keyword: 'MOUNTAINS' },
  { id: 'c14', en: 'May holy grace restore the land from sorrow!', zh: '願神聖恩典撫平這片大地的哀傷！', speak: 'may holy grace restore the land from sorrow', keyword: 'GRACE' },
  { id: 'c15', en: 'Cast aside your doubts and embrace the sacred power!', zh: '拋開所有懷疑，擁抱這神聖之力！', speak: 'cast aside your doubts and embrace the sacred power', keyword: 'POWER' },
  { id: 'c16', en: 'Courage alone can pierce the veil of ancient dread!', zh: '唯有勇氣能穿透遠古恐懼的遮蔽！', speak: 'courage alone can pierce the veil of ancient dread', keyword: 'COURAGE' },
  { id: 'c17', en: 'Let justice roll down like a mighty river!', zh: '願正義滔滔如狂湧的江河奔流！', speak: 'let justice roll down like a mighty river', keyword: 'JUSTICE' },
  { id: 'c18', en: 'The blade of truth shall never falter nor break!', zh: '真理之刃永不動搖，亦永不折斷！', speak: 'the blade of truth shall never falter nor break', keyword: 'TRUTH' },
  { id: 'c19', en: 'From the deepest valleys, we rise to the highest peaks!', zh: '從最深的幽谷，吾等攀上無上之巔！', speak: 'from the deepest valleys we rise to the highest peaks', keyword: 'PEAKS' },
  { id: 'c20', en: 'Embrace the dawn and awaken the slumbering titan!', zh: '擁抱黎明，喚醒沉睡中的泰坦神靈！', speak: 'embrace the dawn and awaken the slumbering titan', keyword: 'TITAN' },
  { id: 'c21', en: 'Gather the celestial starlight to pierce the void!', zh: '匯聚天界星芒，刺破無盡虛空！', speak: 'gather the celestial starlight to pierce the void', keyword: 'STARLIGHT' },
  { id: 'c22', en: 'The sovereign realm shall endure for ten thousand years!', zh: '至尊之界定將綿延萬世永存！', speak: 'the sovereign realm shall endure for ten thousand years', keyword: 'SOVEREIGN' },
  { id: 'c23', en: 'Let pure melody heal every wounded brave warrior!', zh: '以純淨旋律撫慰每位浴血受創的勇士！', speak: 'let pure melody heal every wounded brave warrior', keyword: 'MELODY' },
  { id: 'c24', en: 'Strike down the dragon with the spear of heavens!', zh: '手持蒼穹之長矛，擊墜惡龍！', speak: 'strike down the dragon with the spear of heavens', keyword: 'HEAVENS' },
  { id: 'c25', en: 'Our bond of brotherhood shines brighter than gold!', zh: '吾等兄弟誓盟之輝比黃金更璀璨！', speak: 'our bond of brotherhood shines brighter than gold', keyword: 'BROTHERHOOD' },
  { id: 'c26', en: 'Ignite the beacon on the forgotten mountain ridge!', zh: '在被遺忘的山脊上點燃神聖烽火！', speak: 'ignite the beacon on the forgotten mountain ridge', keyword: 'BEACON' },
  { id: 'c27', en: 'The path of virtue leads through fire and stone!', zh: '美德之路必當浴火踏石而行！', speak: 'the path of virtue leads through fire and stone', keyword: 'VIRTUE' },
  { id: 'c28', en: 'Summon the ancestral spirits of the northern wind!', zh: '召喚北境狂風中的遠古先靈！', speak: 'summon the ancestral spirits of the northern wind', keyword: 'ANCESTRAL' },
  { id: 'c29', en: 'Shatter the chains of despair and claim your freedom!', zh: '砸碎絕望之鎖鏈，奪回屬於你的自由！', speak: 'shatter the chains of despair and claim your freedom', keyword: 'FREEDOM' },
  { id: 'c30', en: 'A pure heart fearlessly conquers all wicked foes!', zh: '一顆赤誠之心，無懼降伏一切邪祟！', speak: 'a pure heart fearlessly conquers all wicked foes', keyword: 'HEART' },
  { id: 'c31', en: 'Look upon the vast horizon where our journey begins!', zh: '凝視遼闊地平線，吾等征程始於此處！', speak: 'look upon the vast horizon where our journey begins', keyword: 'HORIZON' },
  { id: 'c32', en: 'No mortal wall can stay the unstoppable tide of valor!', zh: '任何凡人之牆皆無法阻擋英勇之怒潮！', speak: 'no mortal wall can stay the unstoppable tide of valor', keyword: 'VALOR' },
  { id: 'c33', en: 'Unseal the ancient scripture of forgotten cosmic lore!', zh: '解開封存遠古宇宙法則之聖典！', speak: 'unseal the ancient scripture of forgotten cosmic lore', keyword: 'SCRIPTURE' },
  { id: 'c34', en: 'Fly high above the storm on wings of blazing flame!', zh: '張開熾焰羽翼，傲然翔於狂暴風暴之上！', speak: 'fly high above the storm on wings of blazing flame', keyword: 'BLAZING' },
  { id: 'c35', en: 'The eternal guardian shall never leave this sacred gate!', zh: '永恆守衛永不退讓此座神聖之門！', speak: 'the eternal guardian shall never leave this sacred gate', keyword: 'GUARDIAN' },
  { id: 'c36', en: 'Sing the rhapsody of the immortal stars tonight!', zh: '在今夜，唱響這首不朽繁星的壯麗狂想曲！', speak: 'sing the rhapsody of the immortal stars tonight', keyword: 'RHAPSODY' },
  { id: 'c37', en: 'Draw the bowstring tight and release the arrow of destiny!', zh: '拉滿弓弦，釋放這支命運裁決之箭！', speak: 'draw the bowstring tight and release the arrow of destiny', keyword: 'BOWSTRING' },
  { id: 'c38', en: 'The earth shakes beneath the marching boots of heroes!', zh: '大地在群雄鏗鏘的行軍鐵蹄下劇烈震顫！', speak: 'the earth shakes beneath the marching boots of heroes', keyword: 'HEROES' },
  { id: 'c39', en: 'Let every voice become a thunderous anthem of praise!', zh: '讓每一個聲音匯成震天動地的讚頌聖歌！', speak: 'let every voice become a thunderous anthem of praise', keyword: 'ANTHEM' },
  { id: 'c40', en: 'With patience and honor, we rebuild what was destroyed!', zh: '懷抱堅韌與榮譽，重建一切殘破毀滅之地！', speak: 'with patience and honor we rebuild what was destroyed', keyword: 'PATIENCE' },
  { id: 'c41', en: 'The luminous sword reflects the twilight of fallen gods!', zh: '璀璨聖劍倒映出諸神黃昏的落幕殘陽！', speak: 'the luminous sword reflects the twilight of fallen gods', keyword: 'LUMINOUS' },
  { id: 'c42', en: 'Behold the magnificent palace crafted from solid gold!', zh: '看哪，這座由純金精工雕琢的宏偉宮殿！', speak: 'behold the magnificent palace crafted from solid gold', keyword: 'PALACE' },
  { id: 'c43', en: 'Whisper the secret incantation to still the violent sea!', zh: '低吟古老咒語，平息狂暴的海潮風浪！', speak: 'whisper the secret incantation to still the violent sea', keyword: 'INCANTATION' },
  { id: 'c44', en: 'Every trial makes our spirit stronger than forged steel!', zh: '每一次考驗，皆讓靈魂淬鍊得比鋼鐵更堅毅！', speak: 'every trial makes our spirit stronger than forged steel', keyword: 'STEEL' },
  { id: 'c45', en: 'May the evergreen leaves bring healing to the world!', zh: '願常青樹之綠葉為人間帶來祥和治癒！', speak: 'may the evergreen leaves bring healing to the world', keyword: 'EVERGREEN' },
  { id: 'c46', en: 'The chimera roars into the fiery red cavern depths!', zh: '奇美拉幻獸在赤紅熔岩巨窟深處發出咆哮！', speak: 'the chimera roars into the fiery red cavern depths', keyword: 'CHIMERA' },
  { id: 'c47', en: 'We carry the hopes of generations upon our shoulders!', zh: '吾等雙肩承載著千百代人的崇高期盼！', speak: 'we carry the hopes of generations upon our shoulders', keyword: 'HOPES' },
  { id: 'c48', en: 'Sound the battle horn across the sleeping kingdom!', zh: '讓號角聲響徹整座沉睡中的王國荒原！', speak: 'sound the battle horn across the sleeping kingdom', keyword: 'HORN' },
  { id: 'c49', en: 'The radiant crown belongs to the champion of virtue!', zh: '璀璨皇冠終將歸於堅守美德的真正的冠軍！', speak: 'the radiant crown belongs to the champion of virtue', keyword: 'CROWN' },
  { id: 'c50', en: 'Together we write the final chapter of legendary peace!', zh: '吾等齊心，共同譜寫傳奇和平的最終樂章！', speak: 'together we write the final chapter of legendary peace', keyword: 'PEACE' },
];

export function checkChant(target: ChantSpell, heard: string | string[]): boolean {
  const heardList = Array.isArray(heard) ? heard : [heard];
  const targetWords = target.en.toUpperCase().replace(/[^A-Z\s]/g, '').trim();
  for (const h of heardList) {
    const heardClean = h.toUpperCase().replace(/[^A-Z\s]/g, '').trim();
    if (!heardClean) continue;
    // 句子比對：達到 75% 相似度即算成功朗讀
    if (sentenceMatchRatio(targetWords, heardClean) >= 0.75) return true;
    // 備援比對：如果說出了關鍵詞或整句的一半以上關鍵部分
    if (heardClean.includes(target.keyword) && heardClean.split(/\s+/).length >= 3) return true;
  }
  return false;
}
