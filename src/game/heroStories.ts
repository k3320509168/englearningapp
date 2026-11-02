// 英雄真名傳奇紀事短篇故事（Hero True Name Lore Stories）
// 當英雄完成 5 道真名試煉點亮真名後，解鎖專屬的傳奇短篇故事（中英對照＋英文語音朗讀）。
// 包含 38 位 SSR 英雄專屬短篇故事與通用的神話紀事產生器。

export interface HeroStory {
  heroId: string;
  titleEn: string;
  titleZh: string;
  quote: string;
  storyEn: string;
  storyZh: string;
}

export const HERO_LORE_STORIES: Record<string, HeroStory> = {
  phoenix: {
    heroId: 'phoenix',
    titleEn: 'The Immortal Rebirth of Flame',
    titleZh: '烈焰之不朽涅槃',
    quote: '"From the ashes of despair, the eternal fire will rise anew."',
    storyEn: 'Long ago, before the silence fell across the land, the Phoenix soared across the burning skies. In the ancient tongue, Phoenix represents the immortal soul that can never be extinguished by defeat. When wounded in battle against the primordial darkness, the great bird willingly plunged into the celestial pyre. Emerging with radiant crimson wings, it shattered the curse of eternal cold and gifted warmth to the realm.',
    storyZh: '在沉默降臨這片大地之前，鳳凰曾翱翔於烈火長空。在古老語言中，Phoenix 代表著永不被挫折熄滅的不滅靈魂。在與遠古黑暗的戰役中受傷時，它毅然躍入天界火海，化出璀璨烈焰雙翼重生，擊碎永凍詛咒，將溫暖重歸世間。',
  },
  eclipse: {
    heroId: 'eclipse',
    titleEn: 'The Veil Between Sun and Void',
    titleZh: '日月交界之暗幕',
    quote: '"When light retreats, true shadows guide the blade."',
    storyEn: 'The word Eclipse speaks of celestial alignment and fleeting twilight. Born in the moment the two moons eclipsed the midday sun, this swordsman mastered the art of twilight stepping. Through the dark corridor between dimensions, his blade cuts through magical enchantments before foes can even witness his silhouette.',
    storyZh: 'Eclipse 源自日月相疊、轉瞬即逝的晦暗黎明。在雙月食日的瞬間誕生的劍士，掌握了暮光漫步的秘奧。穿越維度間的幽冥隙縫，他的利刃能在敵人看清其身影前斬斷一切魔法障壁。',
  },
  tempest: {
    heroId: 'tempest',
    titleEn: 'Wrath of the Roaring Gale',
    titleZh: '呼嘯颶風之怒潮',
    quote: '"The tempest cares not for fragile stone; it sweeps all into the vortex."',
    storyEn: 'Derived from ancient mariner tales, Tempest evokes furious storms that stir oceans into frenzy. This agile huntress can read the subtle currents of the stratosphere. With a single release of her tempest bowstring, swirling cyclones converge upon enemy battalions, breaking heavy armor like autumn twigs.',
    storyZh: '源自遠洋水手的古老傳說，Tempest 象徵著掀翻浩瀚汪洋的狂風暴雨。這位敏捷的巡林遊俠能洞悉高空大氣的微弱氣流，每當弓弦鬆開，風暴旋渦匯聚撕裂敵陣重甲，如碎落葉秋木。',
  },
  sanctuary: {
    heroId: 'sanctuary',
    titleEn: 'The Inviolable Haven',
    titleZh: '不可侵犯之神聖庇護',
    quote: '"Within this sacred barrier, malice finds no ground to stand."',
    storyEn: 'Sanctuary represents absolute refuge and spiritual solace. When calamity threatened to swallow the ancient monastery, the guardian priestess knelt in prayer and channeled the divine beacon. A radiant dome of pure starlight enveloped her comrades, granting unwavering endurance against relentless demonic assault.',
    storyZh: 'Sanctuary 代表著神聖的庇護與心靈的歸宿。當浩劫企圖吞噬遠古修道院，守護女祭司虔誠跪祈，召引純白星輝化為不可動搖的結界穹頂，讓同伴在惡魔潮湧的攻勢中屹立不倒。',
  },
  valor: {
    heroId: 'valor',
    titleEn: 'The Unyielding Vanguard',
    titleZh: '永不退縮之先鋒勇魂',
    quote: '"Valor is not the absence of fear, but the triumph over it."',
    storyEn: 'From heroic epics of forgotten kingdoms, Valor honors those who advance when all others flee. Clad in adamantine plate, the champion stood solitary upon the ruined bridge, holding off invading legions until dawn broke. His courage transformed mortal steel into an indestructible symbol of defiance.',
    storyZh: 'Valor 銘刻於消逝王國的英雄史詩中，頌揚在萬眾潰退時挺身迎前的先鋒勇士。身披精鋼厚甲的勇士孤身立於斷橋之上，力戰奔湧軍團直至黎明。他的勇氣將凡俗刀劍淬鍊為抗爭的不朽象徵。',
  },
  oblivion: {
    heroId: 'oblivion',
    titleEn: 'The Whisper of Eternal Void',
    titleZh: '虛無深淵之遺忘長吟',
    quote: '"Names, deeds, and sorrow—all dissolve into the boundless void."',
    storyEn: 'Oblivion embodies the ultimate dissolution of memory and matter. Wandering through the ruins of fallen empires, this enigmatic monk absorbs the chaotic malice of the battlefield. With silent contemplation, he washes away enemy enchantments, returning ancient curses to peaceful nothingness.',
    storyZh: 'Oblivion 象徵著歲月與物質最終的消解。漫步於廢墟遺址的神祕僧侶，能將戰場上的混亂濁氣全然吸收。在無聲冥想之中，他洗滌敵人的詛咒與狂怒，使其歸入祥和虛無。',
  },
  infinity: {
    heroId: 'infinity',
    titleEn: 'The Loom of Limitless Horizons',
    titleZh: '無界時空之無盡織錦',
    quote: '"Beyond the farthest star lies another beginning without end."',
    storyEn: 'Infinity reflects boundlessness without boundary or end. The sorceress discovered the cosmic loom where threads of light weave across parallel dimensions. By tapping into this infinite reservoir, her magical energy flows eternally, overwhelming adversaries with relentless celestial cascades.',
    storyZh: 'Infinity 象徵著超越邊界的無窮無盡。女法師參悟了宇宙織錦之理，連結平行維度的星光涓流。藉由調動這片無盡的奧術靈泉，她的魔力永不枯竭，以漫天星河瀑流壓制強敵。',
  },
  eternity: {
    heroId: 'eternity',
    titleEn: 'The Everlasting Aegis of Steel',
    titleZh: '千古流轉之永恆長刃',
    quote: '"Flesh may wither, but sacred oaths endure throughout eternity."',
    storyEn: 'Eternity signifies the perpetual truth that withstands the tides of time. For five hundred winters, the swordswoman guarded the seal of the ancient dragon beneath frozen peaks. Her blade never dulled, carrying the immortal vow of the fallen knights into every decisive stroke.',
    storyZh: 'Eternity 意指經受歲月沖刷依然恆在的誓言。在極寒冰峰下，女劍士守護著封印達五個世紀之久。她的長刃從未生鏽變鈍，將歷代聖騎士的不朽遺志注入每一道銳利的劍芒之中。',
  },
  apocalypse: {
    heroId: 'apocalypse',
    titleEn: 'The Revelation of Crimson Dawn',
    titleZh: '天啟末世之赤紅破曉',
    quote: '"When the final trumpet sounds, renewal follows the ashes."',
    storyEn: 'Rooted in the ancient concept of revelation, Apocalypse heralds the cataclysmic transition between ages. Wielding twin axes forged from molten meteorite cores, this berserker tears through demonic strongholds like an erupting volcano, clearing the scorched earth for a reborn civilization.',
    storyZh: '源於揭示未來的啟示之音，Apocalypse 預示著舊時代的崩塌與新生之破曉。狂戰士揮舞著由隕石烈焰鍛造的巨斧，如火山噴發般粉碎惡魔巢穴，以浩瀚紅蓮之火為新生文明蕩滌大地。',
  },
  valkyrie: {
    heroId: 'valkyrie',
    titleEn: 'Choosers of the Slain',
    titleZh: '女武神之引導之翼',
    quote: '"Only those with unwavering spirits shall touch the halls of honor."',
    storyEn: 'In northern sagas, Valkyrie guides heroic fallen warriors toward glory. Descending on wings of silver thunder, she surveys the carnage with an eagle eye. Her lance pierces the hearts of despots, inspiring all allies to rise above fear and fight for ultimate liberation.',
    storyZh: '在北境神話中，Valkyrie 是引領榮耀英魂的戰場女神。身著銀雷羽翼降臨戰場，她的長槍精準貫穿暴君甲冑，指引絕境中的同袍克服恐懼，為了最終的自由破陣斬敵。',
  },
  leviathan: {
    heroId: 'leviathan',
    titleEn: 'Ruler of the Abyssal Depths',
    titleZh: '深淵怒潮之巨靈利維坦',
    quote: '"The greatest mountains sink beneath the weight of ocean trenches."',
    storyEn: 'Leviathan commands the primeval abyss where sunlight never reaches. Emerging from tidal maelstroms, this colossal guardian commands the crushing pressure of deep currents. When he strikes the ground, torrential geysers erupt to drown demonic firestorms.',
    storyZh: 'Leviathan 統領著陽光無法觸及的原初深淵。從潮汐旋渦中踏浪而出，這位巨靈執掌深海千丈水壓。雙足踏地之際，澎湃激流噴湧而起，將漫天魔焰頃刻湮滅。',
  },
  genesis: {
    heroId: 'genesis',
    titleEn: 'The Breath of Creation',
    titleZh: '萬物初綻之創世甘霖',
    quote: '"In every barren desert, a single seed dreams of forests."',
    storyEn: 'Genesis marks the profound origin of all life and beauty. Holding a staff carved from the World Tree, this gentle monk breathes vitality into desolated wastelands. Where her footsteps fall, emerald blossoms erupt, cleansing toxic plagues and reviving weary souls.',
    storyZh: 'Genesis 象徵著生命與自然的偉大起源。手握世界樹殘枝雕琢的長杖，僧侶將生命的甘露灑向乾涸荒原。凡她足跡所經之處，青翠繁花紛紛綻放，淨化一切瘟疫與劇毒。',
  },
  radiance: {
    heroId: 'radiance',
    titleEn: 'The Unclouded Sunburst',
    titleZh: '普照四方之曜日光輝',
    quote: '"Darkness cannot survive where true radiance dwells."',
    storyEn: 'Radiance illuminates the darkest dungeons and dispels haunting shadows. Born with golden eyes attuned to astral leylines, the radiant archmage focuses prismatic beams through sacred crystals, obliterating spectral apparitions with blinding clarity.',
    storyZh: 'Radiance 能照亮最幽暗的地下城並驅散所有盤旋陰影。天生擁有洞悉星辰金瞳的大法師，透過神聖水晶匯聚七彩虹光，以熾熱純淨的光輝將怨靈妖物徹底抹除。',
  },
  nemesis: {
    heroId: 'nemesis',
    titleEn: 'The Inescapable Retribution',
    titleZh: '天道循環之因果天罰',
    quote: '"Every injustice leaves a debt that must be paid in full."',
    storyEn: 'Nemesis embodies righteous vengeance against tyrant rulers. Silent as night and relentless as fate, the dark swordsman hunts those who abuse power and slaughter the innocent. His shadowblade leaves no trace except balance restored.',
    storyZh: 'Nemesis 象徵著降臨於暴虐統治者頭頂的因果報應。沉默如夜、冷酷如鐵，夜行劍士追獵所有踐踏弱者的惡徒。利刃過處，不留餘痕，唯留正義與平衡回歸人世。',
  },
};

// 若該英雄未收錄專屬手寫故事，則動態生成符合其單字意境的史詩傳奇
export function getHeroLoreStory(heroId: string, word: string, meaning: string, classId: string): HeroStory {
  if (HERO_LORE_STORIES[heroId]) {
    return HERO_LORE_STORIES[heroId];
  }
  const capWord = word.charAt(0).toUpperCase() + word.slice(1);
  return {
    heroId,
    titleEn: `The True Name Chronicle of ${capWord}`,
    titleZh: `${capWord}（${meaning}）的真名紀事`,
    quote: `"By knowing the name ${capWord}, we awaken the sleeping power within."`,
    storyEn: `Throughout the chronicles of the lost kingdom, the word "${capWord}" carried profound mystical weight, meaning "${meaning}". Blessed with the traits of a renowned ${classId}, this legendary champion demonstrated unwavering resolve across countless battles. When the ancient runes dissolved, their true name was preserved in the celestial archives, granting strength and inspiration to all adventurers who dare to master the spoken tongue.`,
    storyZh: `在失落王國的編年史中，單字「${capWord}」承載著深邃的神秘力量，其本意為「${meaning}」。身為卓越的${classId}，這位傳奇勇士在無數次戰役中展現了堅毅不拔的意志。當遠古符文消散之際，其真名仍深鐫於星空典籍之中，賜予每位敢於探索與朗讀英文真名的冒險者無盡的力量。`,
  };
}
