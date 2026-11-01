// 原創第二十六批：虛構桌遊與策略對話；規則自足，不需熟悉任何真實遊戲。
export const data={
6:{
reading:[
[1,'【文法】Each player ___ two cards at the beginning of a round.','receives|receive|have received|are receiving','each player單數，用receives。'],
[1,'【字彙】A move described as optional is one a player ___.','may choose to make or omit|must make before every other move|may make only after losing|has already made without noticing','optional可選，不指定勝負或必先做。'],
[1,'【規則】A token moves one space forward unless the space ahead is occupied. It is occupied now. What follows?','The stated condition for moving forward is not met.|The token must move two spaces forward instead.|The other token is automatically removed.|The token moves backwards to the starting space.','unless被占據為例外，未另授跳格/擊退/倒退。'],
[1,'【語用】Could we go through one practice round before keeping score? What is proposed?','Trying the rules before starting the scored game.|Counting the practice round as the final result.|Replacing the scoring rules with a different game.|Ending the game before anyone has taken a turn.','before keeping score設定先練不記正式分。'],
[1,'【順序】Draw a card, reveal it, and then move your piece. Which action immediately precedes moving?','Revealing the card.|Drawing a second card.|Returning the piece to the start.|Hiding the card again.','三步明示，move前一步reveal。'],
[2,'【短文】A card lets its owner choose another player to draw one card. Lee chooses Jo and then draws the card himself. What has Lee misread?','The chosen player is the one who draws.|The owner must give away the card permanently.|The choice must be made by the youngest player.|The card applies only after the game has ended.','choose another player to draw指被選者執行draw。'],
[2,'【文法】You cannot move the piece until the previous player ___ their turn.','has finished|will finishing|have finish|is finish','until未來時間子句現在完成式；previousplayer單數。'],
[2,'【語意】The score carries over to the next round. What happens?','The next round begins with the existing score retained.|The next round begins with everyone’s score reset to zero.|The score is given to the player sitting next to its owner.|The round ends before any score can be recorded.','carry over延續保留，不是轉交鄰座。'],
[2,'【規則】A player may exchange two blue tokens for one red token. Jo has four blue tokens and no red tokens. She makes this exchange twice. What does she have from those exchanges?','Two red tokens and no blue tokens left.|Four red tokens and two blue tokens left.|One red token and two blue tokens left.|Two blue tokens and no red tokens.','每次消二藍換一紅，兩次耗四藍得二紅。'],
[3,'【語用】I can see why that move is tempting, but it leaves the gate unguarded. What is being raised?','A drawback of an otherwise attractive choice.|A claim that the move is prohibited by the written rules.|A guarantee that the opponent will choose a particular response.|A proposal to remove the gate from the board.','承認吸引力並指出代價，不另造規則禁令。'],
[3,'【短文】The winner is the player with the most points after five rounds, not the player who wins the most rounds. A player wins three rounds but has fewer total points. What follows?','Winning more rounds does not make that player the overall winner.|Winning three rounds automatically replaces the total-points rule.|The remaining rounds must be replayed until totals are equal.|The player receives an extra point for every round already won.','依明示總分勝利條件，不加勝場紅利。'],
[3,'【規則】A shield prevents one attack and is then removed. A player with one shield faces two separate attacks in order. What does the shield itself do?','It blocks the first attack but not the second.|It blocks both attacks because they occur in the same turn.|It blocks only the second attack after ignoring the first.|It remains in place until the player chooses to discard it.','preventsoneandthenremoved，順序先擋一再失去。']
],
listening:[
[1,'back to square one','回到起點而得重新開始|直接升到最後一格|只有一人可用的方形棋盤|把所有格子合成同一個','慣用指進度歸原點，不必真有格盤。'],
[1,'play it safe','採較少風險的做法|保證每次都能獲勝|不讓任何其他人參與|只在遊戲結束後作決定','play safe著重避險，不等於保證結果。'],
[1,'take a chance','冒一次風險試試|把別人每次機會都取消|依既定結果重複動作|等到不確定性完全消失','take chance接受不確定而行動。'],
[1,'The card says you may move again, not that you have to.','卡說可再移動，不是必須再移。|卡要求立即再移，而且不能放棄。|再移只在前一步非法時才適用。|說話者要求取消卡片上的選擇。','may許可不同於義務。'],
[1,'Are we counting the bonus now? No, at the end of the round, after everyone has played.','獎勵輪末大家都出完後才算，不是現在。|獎勵在輪首每人出牌前先算。|只有還沒出過的人可以現在領獎。|獎勵已取消，輪末只計基本分。','No修正計算時點，未改取消獎勵。'],
[2,'You can trade with me if you like, though I would wait to see what the next card offers.','可和我換，但我會先看下一張提供什麼。|說話者已正式拒絕任何交易。|下一張必定更好，所以現在交換違規。|只要對方喜歡，交易就已自動完成。','提供許可加策略建議，非規則要求或確知下卡。'],
[2,'I saved the token for later, which would have been sensible if there had been another round.','我留代幣到後面用，若還有下一輪才算明智。|代幣已在下一輪成功使用，所以決策有效。|說話者確定每次留代幣都一定錯。|下一輪已取消只因代幣被保留。','反事實條件暗示沒下輪，保留資源未派用場。'],
[2,'The move is legal; I am only asking whether it gets you closer to the goal.','這步合規，我只問是否更接近目標。|這步已違規，所以不能討論策略。|只要合規就已保證有助勝利。|說話者在要求改掉正式目標。','規則合法與策略有效分開。'],
[2,'The pieces look identical, but the symbol underneath tells you which team each belongs to.','棋子外表相同，底下符號才示各屬哪隊。|每隊外表不同，不需查看底部。|棋子因看似同樣已被規定不分隊。|符號只在盒上，棋子本身沒有辨識資訊。','初看外形與隱藏標記不同，非完全無法分辨。'],
[3,'We were cooperating until we realised the instructions said share information, not share the final score.','原本合作，後來發現規則是分享資訊不是共享最終分數。|規則已要求共享分數，資訊則禁止交流。|兩人已證實合作無論何時都違反規則。|說話者明說資訊與分數在遊戲中定義相同。','可分享的對象範圍不同，不必合作本身非法。'],
[3,'I would not call it a bad move just because the next card made it fail; we did not know that card was coming.','不能只因下張卡讓它失敗就說壞決策，當時不知道會來哪張。|事後失敗已充分證明當時選擇必定不合理。|說話者在落卡前已確知卡面而仍故意選錯。|任何不知道下一卡的選擇都自動算最佳策略。','依當時資訊與結果區分，不保證決策原本必最佳。'],
[3,'The rules reward finishing quickly, but not so much that it is worth ignoring every side objective.','規則獎快完，但未高到值得忽略所有支線目標。|速度分已高到任何支線都必無用。|規則完全不獎速度，只計支線完成數。|說話者已確認每個玩家每回合都必選同路。','not so much限制速度收益，非否定其存在。']
],
voices:[
['wildcard','可依規則代表其他牌或角色的萬用牌',1,'n.','The wildcard can stand for either colour.','萬用牌可代表任一色。'],
['setback','使進展受阻或倒退的挫折',1,'n.','The lost turn was a small setback.','失去回合是小挫折。'],
['an optional extra move','可自行選擇的額外一步',1,'phr.','The card grants an optional extra move.','卡給可選額外一步。'],
['a shared objective','大家共同要達成的目標',2,'phr.','The team pursues a shared objective.','隊伍追共同目標。'],
['a guarded entrance','有人或防禦物守住的入口',2,'phr.','The blue piece protects a guarded entrance.','藍棋子保護有防守入口。'],
['A legal move need not be a useful move','合規一步未必有用',3],
['The shield blocks one attack before disappearing','護盾消失前擋一次攻擊',3],
['The final score matters more than the number of rounds won','總分比贏輪數重要',3]
],
spells:[
['STRATEGY','n.','為達成長期目標安排的行動方式','The strategy depends on saving tokens.','策略依賴保留代幣。'],
['COUNTER','n.','遊戲中用以記數或標位置的小物件','Place a counter on the chosen square.','選定格放一枚標記。'],
['FORFEIT','v.','依規則失去某機會或權利','You forfeit the bonus if you pass.','若選跳過便失去獎勵。'],
['ACCUMULATE','v.','逐漸收集而增加數量','Players accumulate points across rounds.','玩家跨輪累積分數。']
],
fills:[
['TOKEN','n.','遊戲中表示資源位置等的代幣或棋片','Exchange two blue tokens for one red token.','兩藍代幣換一紅。'],
['DECK','n.','供遊戲使用的一副牌','Return the card to the deck.','把牌放回牌堆。'],
['OBJECTIVE','n.','希望達成的目標','The objective is stated before play begins.','開始前說明目標。'],
['COOPERATIVE','adj.','由各方互相協助達成共同目標的','The game is cooperative rather than competitive.','遊戲屬合作而非競爭。']
],
lexicon:[
['BACK TO SQUARE ONE','phr.','回到起點而得重新開始','The setback sent us back to square one.','挫折讓我們重回起點。'],
['PLAY IT SAFE','phr.','採較少風險的做法','We can play it safe and keep the shield.','可保守留下盾。'],
['TAKE A CHANCE','phr.','冒一次風險試試','She chose to take a chance on the next card.','她選擇賭下一卡。']
]
},
7:{
reading:[
[1,'【語意】The advantage is cumulative rather than immediate. What is suggested?','It builds through repeated gains over time.|It appears in full before the first move.|It disappears whenever another gain is made.|It belongs only to the first player who notices it.','cumulative為逐漸累積，不是立刻全部拿到。'],
[1,'【文法】The rule requires that each player ___ the same information before choosing.','receive|receives|receiving|to receive','requires that後虛擬式原形receive。'],
[1,'【語用】The player says, I am happy to lose on my own mistakes, less happy to lose on a rule nobody mentioned. What is challenged?','The completeness of the explanation before play.|The possibility that the player could make a mistake.|The use of winning and losing as part of a game.|The right of other players to follow stated rules.','區分自身選擇失誤與未告知規則的資訊公平性。'],
[1,'【字彙】A countermove is ___.','an action responding strategically to another action|a token removed because its colour has faded|a move made before the game’s rules are explained|an accidental action that has no effect on play','countermove反制回應，不是桌面counter棋片之移動而已。'],
[1,'【文法】Either the cards or the rulebook ___ missing from the box.','is|have|are being|be','either...or近主詞rulebook單數，is missing。'],
[2,'【規則】A general rule limits movement to two spaces. A special card explicitly overrides that limit for one turn. What happens during that turn?','The special permission takes priority over the general limit.|The general rule makes the special card unusable.|The limit is permanently removed for every player.|The player must move exactly two spaces before reading the card.','overridesforoneturn優先僅本輪，非永久刪除。'],
[2,'【語意】The retreat is tactical rather than an admission that the overall plan has failed. What is implied?','A local withdrawal may support a broader aim.|Every withdrawn piece has been removed from the game permanently.|The player has abandoned every future attempt to score.|The plan’s success is guaranteed by retreating now.','局部退讓服務整體策略的可能，不承諾必勝。'],
[2,'【短文】A game gives players unequal starting resources but different targets intended to balance the challenge. A reviewer asks whether the targets actually compensate. What is under examination?','The relation between initial advantages and the demands of winning.|Whether unequal resources must look identical in shape and colour.|The assumption that every player should draw the same card every turn.|Whether the reviewer has memorised every possible game sequence.','起資源不等與勝利難度是否補償需實際評估，不預定平衡。'],
[2,'【範圍】An unused bonus may be carried forward unless the player changes teams. A player changes teams. What can no longer be assumed?','That the unused bonus will carry forward.|That the player has ever earned a bonus.|That teams are allowed under the rules.|That the previous round had ended.','unless例外已觸發，不能再以一般規則保留。'],
[3,'【短文】A player calls a move irrational after it fails. Before the move, all available information favoured it, and the failure depended on a hidden draw. What should an evaluation distinguish?','Decision quality under available information from the realised outcome.|A hidden draw from any event that could affect the game.|The player’s score from the number printed on the instruction sheet.|Any uncertain choice from a choice that can be evaluated at all.','不以事後揭隱卡定當下必非理性。'],
[3,'【語用】A rule is clear once the organiser explains which meaning of bank it uses. What remains a design issue?','Whether the written rule supplies that distinction without the organiser.|Whether the organiser has ever used the same word in conversation.|Whether every player has visited a financial institution.|Whether all words with multiple meanings must be banned from games.','現場補充可消歧不代表文檔本身自足。'],
[3,'【短文】A team’s strategy depends on a promise another team can revoke without penalty. The promise has been sincere so far. What vulnerability remains?','The plan relies on cooperation that the rules do not secure.|Past sincerity proves that future withdrawal is impossible.|A revocable promise cannot ever be made sincerely.|The plan requires both teams to have identical scores.','意圖真誠與制度約束穩定性不同。']
],
listening:[
[1,'a calculated risk','考慮利弊後接受的風險|已由公式保證絕不失敗的決定|完全不看資訊的隨機動作|因計分錯誤才產生的額外回合','calculated經考量，不等於無風險。'],
[1,'a tactical retreat','為整體目的作的局部撤退|直接宣布放棄整場比賽|只因棋盤不平而滑動棋子|正式取消所有移動規則','tactical retreat可能服務計畫，非必認輸。'],
[1,'a cumulative score','跨數次逐步累加的分數|每輪全部歸零的分數|只計最後一張牌的面值|所有人都必相同的起始分','cumulative累積，不是各輪重置。'],
[1,'The exception applies to the next move, not to every move you make while holding the card.','例外只適用下一步，不是持卡期間每步。|例外持卡期間一直有效，沒有次數限制。|卡不影響任何一步，只改最後分數。|例外已追溯到玩家先前全部行動。','next單一行動與持有狀態期間不同。'],
[1,'We have reached a deadlock, though the rules offer a way to restart without beginning the whole game again.','我們陷僵局，但規則可重啟局面而不重玩整局。|僵局已使規則取消，必須換另一遊戲。|重新開始一定包括把總分和全部進度歸零。|說話者確認目前仍有很多正常可選步驟。','局部重啟不同全部重來。'],
[2,'The strategy is robust to a bad draw, not immune to every possible sequence of bad draws.','策略可承受一次壞抽，不代表對所有連續壞抽免疫。|策略只要有一次壞抽就已確定完全失效。|所有可能抽牌順序都已測試且必勝。|說話者認為抽牌順序與任何策略無關。','robust的承受範圍不能無限外推。'],
[2,'The tiebreaker decides who wins when scores are equal; it does not add points to make the scores unequal.','同分決勝規則決定勝者，不是加分把同分改成不同。|決勝規則一定先替勝者加一分。|只要有決勝規則，遊戲就不可能同分。|決勝只在所有人同時放棄時適用。','排序決勝與改寫分數不同。'],
[2,'I would call it an exploit of the wording rather than a strategy the examples appear designed to encourage.','我會稱利用措辭漏洞，而非示例看來鼓勵的策略。|這是示例已明示必須採取的唯一策略。|說話者已證實該行動被明文禁止。|只要能從文字讀出，就已等於設計者明確鼓勵。','文字可容與設計意圖推測不同，非直接定違規。'],
[2,'The move keeps our options open at the cost of giving the other team time to do the same.','這步保留我方選項，代價是讓對方也有時間如此。|這步保我方彈性且同時完全剝奪對方選項。|對方因得時間就已確定會作同一選擇。|說話者只在計算每個玩家讀說明所需時間。','策略取捨兩面，不保證對方後續行為。'],
[3,'The alliance is useful precisely because the goals overlap without being identical, so neither team should forget where the overlap ends.','聯盟有用在目標部分重疊但不完全同，需記清交集界線。|兩隊目標完全同，所以無需再確認任何分歧。|目標毫無重疊已使聯盟必定永遠無用。|說話者要求兩隊從此合併分數與勝利條件。','局部共同利基不等於整體永久一致。'],
[3,'A rule that permits negotiation does not tell us that every agreement negotiated will remain enforceable after the teams separate.','准許協商，不等於團隊分開後每項協議仍可被規則強制執行。|只要協商過，規則已保證所有承諾永久有效。|團隊分開已使先前任何協商從未發生。|說話者確認遊戲明文禁止所有隊伍談話。','許可協商與承諾後續約束不同，限虛構遊戲。'],
[3,'The extra move is valuable only if taking it does not trigger the penalty that makes stopping the better option.','額外步有價值的前提是不觸發讓停手更好的處罰。|只要可多走，觸發任何處罰都不影響價值。|說話者已明說每次多走都一定被處罰。|停手在此被定義為立即取消整局勝利資格。','需比較條件代價，非多一步無條件好。']
],
voices:[
['stalemate','各方無法再取得進展的僵局',1,'n.','The game has reached a stalemate.','遊戲到僵局。'],
['tiebreaker','同分時用以決定勝負的規則或賽段',1,'n.','The tiebreaker uses the number of unused cards.','同分決勝用未用牌數。'],
['an asymmetric objective','與對方不完全相同的目標',1,'phr.','Each team has an asymmetric objective in this scenario.','此情境各隊目標不對稱。'],
['a provisional alliance','仍可能改變的暫時聯盟',2,'phr.','They formed a provisional alliance.','他們暫結聯盟。'],
['a reversible move','能依規則恢復原狀的一步',2,'phr.','Only a reversible move is allowed during practice.','練習只准可回復的一步。'],
['A tactical retreat need not abandon the broader strategy','戰術撤退不必放棄整體策略',3],
['The exception applies to one move rather than continuous possession','例外適用一步而非持有期間',3],
['A sincere promise may remain revocable under the rules','真誠承諾依規則仍可能可撤回',3]
],
spells:[
['TACTICAL','adj.','服務具體局部目標的戰術性的','The withdrawal is tactical.','撤退屬戰術安排。'],
['COUNTERMOVE','n.','回應對方行動以反制的一步','The card allows a countermove.','卡允許反制一步。'],
['CUMULATIVE','adj.','逐次增加而累積的','The final ranking uses a cumulative score.','總排名用累積分。'],
['OVERRIDE','v.','使一般規則在特定情況讓位的凌駕','The card can override the normal limit.','卡可凌駕通常限制。']
],
fills:[
['DEADLOCK','n.','因互相牽制而無進展的僵局','A special rule resolves the deadlock.','特殊規則解僵局。'],
['INCREMENTAL','adj.','透過一小步一小步逐漸進行的','The advantage comes from incremental gains.','優勢來自逐步小收益。'],
['PRECEDENCE','n.','在規則或順序上優先適用的地位','The special card takes precedence.','特殊卡優先適用。'],
['ALLOCATION','n.','把資源分派給不同用途或對象的安排','The allocation of tokens affects strategy.','代幣分配影響策略。']
],
lexicon:[
['A CALCULATED RISK','phr.','考慮利弊後接受的風險','The move is a calculated risk.','此步為算過的冒險。'],
['A TACTICAL RETREAT','phr.','為整體目的作的局部撤退','The player chooses a tactical retreat.','玩家選擇戰術撤退。'],
['A CUMULATIVE SCORE','phr.','跨數次逐步累加的分數','The board records a cumulative score.','板記累積分。']
]
},
8:{
reading:[
[1,'【語意】The ruling is retrospective in its effect: it changes how an earlier move is scored. What is affected?','The assessment of an action already taken.|Only the wording used for future instructions.|The player’s knowledge before the earlier action occurred.|The physical order in which the earlier cards were drawn.','retrospective效力在先前一步的計分，非改真實過去順序。'],
[1,'【文法】The rule allows the move, ___ it does not require.','which|that|whose|what','非限定關係子句which作require受詞，it指rule。'],
[1,'【語用】The organiser calls the rule self-evident after spending ten minutes explaining which exceptions count as exceptions. What invites irony?','The explanation’s burden sits uneasily with the claim of obviousness.|The organiser has refused to give any explanation of the rule.|Every exception has been deleted from the written rule before play.|The length of an explanation establishes that its content is false.','自明聲稱與大量解例外有張力，非長就假。'],
[1,'【字彙】To adjudicate a dispute is to ___.','make an authoritative decision about the contested issue|repeat both positions without reaching any judgement|postpone the issue until no participants remain|change the subject so that no dispute is mentioned','adjudicate裁決，遊戲情境非實際法律服務。'],
[1,'【範圍】The absence of a prohibition makes a move permissible under this game’s stated default, not obligatory. What follows?','The player may choose the move but need not take it.|The player must take the move whenever it becomes possible.|The move remains forbidden until a second rule requires it.|The player must change the default before making any choice.','題內給default未禁可做，仍非必做。'],
[2,'【規則】A later rule expressly supersedes an earlier scoring rule, but only for team matches. An individual match is being played. What remains applicable on the stated facts?','The earlier scoring rule for that individual match.|The later scoring rule for every kind of match.|Neither rule, because supersession always removes all previous text.|A new score agreed after seeing which player would benefit.','supersedes範圍限團體，不能外推個人賽。'],
[2,'【語意】The decision is discretionary but not therefore arbitrary. What distinction matters?','Judgement can have reasons even when a rule leaves room for it.|Any decision not mechanically fixed must lack a rational basis.|A discretionary decision is one that cannot affect the outcome.|An arbitrary decision is always the only option allowed by a rule.','裁量非必恣意，理由可約束未機械化處。'],
[2,'【文法】So narrow is the exception that invoking it ___ alter the ordinary rule.','does not materially|do not material|not materially does|have not materially','invokingit動名詞單數，does not +原形alter。'],
[2,'【指涉】The objection concerns changing the rule after the move, not the content of the rule as a possible rule for future games. Which response addresses it?','Keep the earlier scoring basis for this move and discuss a revision before future play.|Show that the revised rule would make future games more interesting.|Repeat the new rule more loudly so all players hear it.|Explain that the organiser personally prefers the new outcome.','程序溯及爭點需保留行動時基準，非只辯新內容更好。'],
[3,'【短文】A game rewards cooperation but reveals a private bonus for betrayal only after players have made binding promises. A critic asks whether surprise has displaced meaningful choice. What is questioned?','Whether players had the information needed to understand the commitments they made.|Whether private information can ever be part of a well-designed game.|Whether every promise in a game must remain enforceable outside it.|Whether betrayal should always score fewer points than cooperation.','批評知情時點與承諾而非一概禁隱資訊。'],
[3,'【語用】The organiser says the decision is final, then offers that finality as evidence that the decision must be correct. What is conflated?','Authority to end a dispute with the merits of its resolution.|A temporary ruling with the absence of any ruling.|The number of players with the number of disputed moves.|A player’s right to ask a question with a duty to agree.','終局權限不等於判斷實質正確性。'],
[3,'【短文】A rule gives the losing player the right to define what counts as losing. It is described as a safeguard against unfair defeat. What needs scrutiny?','Whether control over the classification empties the scoring constraint of force.|Whether any safeguard can be described without using a negative word.|Whether the losing player has received fewer tokens than the winner.|Whether defining a term always requires agreement outside the game.','控制輸的定義可掏空規則拘束，非單純詞彙爭議。']
],
listening:[
[1,'an adjudicative decision','對爭議作權威裁決的決定|只為引起討論而未表立場的提問|隨機抽牌後的每個自動結果|未曾涉及任何爭點的私人筆記','adjudicative關裁決，非純討論。'],
[1,'a retroactive exception','對先前已做行動生效的例外|只對未來新遊戲才適用的規則|因未到輪次而尚不能看的卡片|永遠無法影響任何計分的裝飾','retroactive回溯適用，未評其一定公平。'],
[1,'a permissive default','未另限制時原則上允許的預設|未另說明時一律禁止的預設|每次必須由旁觀者強迫執行的指令|只能在最後一回合使用的獎勵','permissive允許，default原則設定，非義務。'],
[1,'The rule makes the promise binding, though only within the scoring system, not as a claim about anyone’s character outside the game.','承諾只在計分系統有拘束，不等於判斷場外人格。|計分系統已被用來正式決定每位玩家場外人格。|規則沒有任何約束，所以承諾完全不影響計分。|說話者認為玩家一旦承諾便無權再問規則。','遊戲內機制與真人人格評價界線明示。'],
[1,'The exception is available to either player, but not to both in the same round.','任一方可用例外，但同輪不能雙方都用。|例外必須同輪雙方一起使用才生效。|只有先加入遊戲的那人有資格用。|兩人同時用時會自動加倍獎勵。','either與notboth形成互斥單次資格。'],
[2,'The ruling may be sensible as a rule for next time without being fair as a rule invented after this move.','裁決作下次規則可能合理，作本次行動後新規則卻未必公平。|新規則內容合理已保證回溯用到任何過去都公平。|說話者確認新規則無論何時都毫無道理。|規則既能改，下次就不需在開始前告知。','實質可取與溯及適切性不同，may保留。'],
[2,'The game leaves room for interpretation, which need not mean it leaves the result to whoever argues most loudly.','遊戲留解釋空間，不等於結果應由最大聲者決定。|只要有解釋空間，就沒有任何可用判準。|每個解釋都必須相同，否則遊戲立即停止。|說話者主張音量才是正式計分方式。','裁量空間可有理由標準，非聲勢支配。'],
[2,'The safeguard protects the option to decline an alliance; it does not protect the player from every strategic consequence of declining.','保障可拒結盟，非保障拒絕後沒有任何策略後果。|拒絕結盟後所有對手都必須停止正常行動。|選項保障意味拒絕者自動獲得最高分。|說話者確認玩家根本沒有拒絕結盟的權利。','可拒與免所有策略代價不同，限遊戲規則。'],
[2,'What looks like an exception to the limit may instead be an instruction about when the limit is measured.','看似限制例外，也可能是在說何時計量限制。|限制已被正式永久取消，所以不需計量。|例外與計量時點在規則裡已被定義為相同詞。|說話者確認每次計量都一定發生在行動前。','不同解讀須讀範圍/時點，may非定案。'],
[3,'The rule’s symmetry is formal: each player has the same permission, but only one currently has the resources needed to exercise it.','規則形式對稱，兩方同准，但目前只有一方有資源行使。|兩人資源已完全同等，所以許可的實用性也同。|只要資源不同，兩人的文字許可就必定不同。|說話者要求取消資源系統以避免任何選擇。','形式許可對稱不代表當下行使能力相同，不預定必不公。'],
[3,'A victory condition that can be redefined whenever it is met risks turning an achievable goal into an indefinitely receding one.','每達成都重定勝利條件，可能使目標無限後移。|勝利條件從未改動，只因玩家尚未得足分。|目標可達已證明不論如何改條件都公平。|說話者認為遊戲只要有目標就不該設任何挑戰。','風險來自移動門檻而非挑戰本身。'],
[3,'The question is not whether the move is ingenious, but whether its ingenuity depends on treating a missing definition as permission to invent a convenient one after the fact.','問題非這步巧不巧，而是是否靠事後替缺漏定義挑有利解。|巧妙已保證定義在行動前寫得完整清楚。|說話者反對玩家依明確定義設計任何策略。|只要某詞沒定義，就必定只准採最不利自己的解讀。','創意與利用事後定義權區分，不禁止所有巧思。']
],
voices:[
['adjudication','對爭議作權威判定的程序',1,'n.','The game provides a method of adjudication.','遊戲提供裁決方式。'],
['forfeiture','依條件而失去權利或資源的結果',1,'n.','The rule specifies forfeiture of the bonus.','規則明定獎勵喪失。'],
['a retroactively imposed condition','事後回溯加上的條件',1,'phr.','The players objected to a retroactively imposed condition.','玩家反對事後回溯條件。'],
['a discretionary but reasoned judgement','有裁量空間卻仍有理由的判斷',2,'phr.','The dispute requires a discretionary but reasoned judgement.','爭議需有理由的裁量判斷。'],
['a formally symmetric permission','形式上對稱的許可',2,'phr.','The card gives a formally symmetric permission.','卡給形式對稱許可。'],
['Finality of a ruling does not establish its correctness','裁決終局性不證成其正確',3],
['An achievable goal should not recede whenever it is reached','可達目標不應每達成就後退',3],
['A shared permission may require resources only one player possesses','共同許可可能需僅一方有的資源',3]
],
spells:[
['ADJUDICATE','v.','對爭議作具權威的裁定','The organiser will adjudicate the disputed move.','主辦者會裁定爭議一步。'],
['SUPERSEDE','v.','取代先前規則或安排而優先適用','The special rule does not supersede every general rule.','特殊規則非取代全部一般規則。'],
['RETROACTIVITY','n.','對先前行動或事件回溯生效的性質','The objection concerns retroactivity.','反對關乎回溯生效。'],
['ARBITRARINESS','n.','缺乏一致理由而恣意決定的性質','The explanation should reduce arbitrariness.','解釋應減少恣意。']
],
fills:[
['PERMISSIBILITY','n.','依規則被允許的性質','The dispute concerns the move’s permissibility.','爭議關乎此步可否被允。'],
['PROHIBITION','n.','明確禁止某行為的規定','The text contains no prohibition on trading.','文字沒有禁止交易。'],
['REVERSIBILITY','n.','能恢復先前狀態的性質','The card changes the move’s reversibility.','卡改變此步可回復性。'],
['ENFORCEABILITY','n.','某約定可由規則要求履行的程度','The game distinguishes promises by enforceability.','遊戲依可要求履行程度區分承諾。']
],
lexicon:[
['AN ADJUDICATIVE DECISION','phr.','對爭議作權威裁決的決定','The final step requires an adjudicative decision.','最後需作裁決決定。'],
['A RETROACTIVE EXCEPTION','phr.','對先前已做行動生效的例外','The new card creates a retroactive exception.','新卡創回溯例外。'],
['A PERMISSIVE DEFAULT','phr.','未另限制時原則上允許的預設','The rulebook adopts a permissive default.','規則書採原則允許設定。']
]
}
};
