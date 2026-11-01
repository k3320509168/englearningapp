// 原創第三十一批：地圖、方向與空間理解。判斷所需的規則與線索均在題內。
export const data = {
6: {
reading: [
[1,'【路線】The riverside path is shorter, but it closes at dusk. It is already dark, so we will take the road through the village. Why was that route chosen?','The shorter route is no longer available.|The village road has recently been shortened.|The riverside path leads to a different village.|The walkers want to reach the river before dusk.','路徑黃昏關閉，現在已黑；選村內道路是可用性，不是距離改變。'],
[1,'【字彙】The guide suggests using the clock tower as a landmark when walking back. What should visitors use it for?','Recognising where they are.|Finding out when the tour ends.|Checking the height of nearby buildings.|Deciding which buildings they may enter.','landmark在找路語境是可辨識位置的地標，未要求讀時間或進入塔內。'],
[1,'【文法】By the time we reached the junction, the guide ___ the route twice already.','had checked|has checked|will have checked|is checking','reached為過去參照點，already與twice表示此前已完成兩次，用過去完成式。'],
[1,'【路線】The museum entrance has moved to the courtyard. The map still shows it on the main street. Which information needs updating?','The location of the museum entrance.|The name of the main street.|The position of the museum courtyard.|The opening time of the museum.','搬動的是入口；未說街名、庭院位置或開放時間改變。'],
[1,'【語用】I would not rely on the blue line alone; the pavement markings have faded. What does the speaker recommend?','Using another source to confirm the route.|Choosing whichever pavement looks newest.|Avoiding every street marked in blue.|Waiting for the markings to be repainted.','not rely on ... alone是不要只靠單一線索，沒有要求等重畫或避開所有藍線。'],
[2,'【指涉】The footbridge runs beside the railway bridge, but only the former is open to walkers. Which bridge may walkers use?','The footbridge.|The railway bridge.|Either bridge when no train is approaching.|The bridge closest to their starting point.','former指前述第一者footbridge，不能由火車是否接近自行增加通行條件。'],
[2,'【路線】The app says the station is ten minutes away on foot. The notice beside us says the usual footpath is closed for repairs. What is the sensible conclusion?','The estimate may not allow for the closure.|The station itself is closed for repairs.|The repairs will take about ten minutes.|The app has located a different station.','封閉可能使原步行估時不適用；不是證明車站關閉或定位錯誤。'],
[2,'【語意】The route is straightforward once you have found the right entrance. What qualification is being made?','Finding the entrance may be the tricky part.|Every entrance leads to the same route.|The entrance is marked more clearly than the route.|The route becomes shorter after the first visit.','once條件限定容易的是找到正確入口之後，不保證入口本身好找。'],
[2,'【短文】A map uses a dotted line for a steep path and a solid line for a flatter one. The key explains this distinction. What should a visitor check before choosing?','What the line styles mean.|Whether the dotted line is printed more recently.|Which line has the brighter colour.|Whether the solid line ends at a building.','題內說明線型對應坡度，應讀圖例；沒有提供更新時間或終點差別。'],
[3,'【推論】The campsite is visible from the road, but the entrance is on the far side of the field. What mistake might a visitor make?','Assuming that seeing the site means being near its entrance.|Thinking the road is hidden behind the campsite.|Using the field entrance despite being unable to see the site.|Confusing the campsite with another place mentioned on the map.','可見營地與入口所在面不同，視線上的接近不等於接近可進入的位置。'],
[3,'【語用】The sign is technically correct, but it appears after the turning it tells you to take. What is the criticism?','The information arrives too late to guide the decision.|The sign names a destination on a different road.|The instruction points in the opposite direction.|The sign should give distances rather than directions.','批評資訊出現的時機，不否定文字方向本身或指定改為距離。'],
[3,'【短文】A walker retraces her steps to the last junction she recognises instead of following another unfamiliar lane. What is her strategy?','Returning to a known point before deciding again.|Continuing until an unfamiliar lane becomes recognisable.|Choosing a new route to avoid repeating any ground.|Checking whether the destination has moved since her last visit.','retrace回走，last junction she recognises提供重新定位的已知點。']
],
listening: [
[1,'Keep the river on your left until you reach the old mill.','到舊磨坊之前，讓河一直在你的左邊。|先到河左岸，再回到舊磨坊。|看到舊磨坊後，沿河走向左邊。|走到河邊後，在第一個路口左轉。','on your left說明行進時河的相對位置，until設定終點。'],
[1,'The gate is locked, but there is a public path around the edge of the garden.','門鎖著，但可走花園邊緣的公共小路。|花園小路鎖著，必須由正門穿過。|公共小路穿越花園中央，再通向鎖門。|鎖門旁有人，可以請他帶路穿過花園。','but給出可行替代，around the edge不是穿越中央，也沒提帶路者。'],
[1,'We are on the right street, just at the wrong end of it.','街道找對了，但目前在不對的那一端。|街道走錯了，但目的地就在這個路口。|已到正確街道盡頭，可以停止找路。|街道兩端都能直接進入同一棟建築。','right street與wrong end同時成立，不能把right誤讀成右轉。'],
[1,'The arrow points to the car park, not to the building entrance.','箭頭指停車場，不是建築入口。|箭頭指建築入口，停車場在旁邊。|箭頭指停車場內的建築入口。|箭頭表示停車場和建築入口都在前方。','not to明確排除把箭頭當建築入口指示。'],
[1,'If you pass the bakery, you have gone too far.','若走過麵包店，就表示已超過要找的位置。|先經過麵包店，才會到要找的位置。|麵包店太遠，所以應改找其他目的地。|過了麵包店之後，才需要開始看路牌。','gone too far表示越過目標位置；麵包店是確認走過頭的線索。'],
[2,'The shortcut saves distance, but with all those steps I doubt it saves effort.','近路距離較短，但階梯多，未必省力。|近路比較費時，因此距離應該也較長。|近路雖有階梯，卻已確定更省力。|近路階梯較少，所以較適合搬運行李。','distance與effort分開評估，doubt保留對省力的疑問。'],
[2,'I would check the street name before turning. These two corners look almost the same.','轉彎前先核對街名，因這兩個轉角很相似。|街名已換過，所以只能憑轉角外觀找路。|兩個轉角通向同條街，不必再核對。|應先轉彎，再確認街名是否相同。','before與look almost the same說明先確認文字線索的理由與順序。'],
[2,'It is marked as a through road, although the barrier suggests it no longer is one.','圖上標可穿越，但障礙物顯示現在可能已不能通行。|圖上標道路封閉，障礙物卻表示已重新開放。|障礙物只限制停車，不影響道路通行。|圖上道路與眼前道路有不同名字，因此不是同一條。','no longer is one承接through road；suggests是現場線索而非確定公告。'],
[2,'You can see the platform from here, but we still have to go through the underpass to get onto it.','雖看得到月台，仍須經地下道才能上去。|地下道能看見月台，但不能用來前往月台。|月台在地下道內，沿目前通道直走即可。|目前位置就是月台入口，不必再繞路。','see與get onto分別是看見與實際抵達，underpass仍是必要路線。'],
[3,'The map is not wrong about the distance. It just does not tell you that most of it is uphill.','距離本身沒錯，只是沒標大部分路段都上坡。|距離標示有誤，因上坡會讓實際路程增加。|地圖只畫上坡路段，所以漏掉其他距離。|地圖的坡度標對了，距離卻仍待測量。','not wrong about distance保留距離資訊正確，批評遺漏坡度。'],
[3,'I thought we were lost, but we had simply come out on the other side of the square.','原以為迷路，其實只是從廣場另一側走出來。|確實迷路，所以又回到了廣場原來那側。|差點走錯，但在進入廣場前就察覺了。|已走到另一座廣場，因此不認得出口。','had simply重新解釋原先lost的判斷，other side不是另一座廣場。'],
[3,'Let us use the printed map for the overall route and the signs for the last few turns.','全程方向參考紙本圖，最後幾個轉彎看路牌。|先用路牌規畫全程，再以紙本圖找最後出口。|紙本圖只用來估時間，路牌才提供全程方向。|先比較兩種資訊，之後只選其中一種使用。','overall與last few turns分配不同尺度的資訊用途，非擇一。']
],
voices: [
['landmark','用來辨識位置的地標',1,'n.','The chimney is a useful landmark when you return from the beach.','從海灘回來時，煙囪是實用的地標。'],
['junction','道路交會的路口',1,'n.','Turn left at the junction beyond the bridge.','過橋後在交會路口左轉。'],
['destination','行程的目的地',1,'n.','Our destination is visible, but the path winds around the hill.','目的地看得見，但小路繞著山丘走。'],
['uphill','朝上坡方向的',2,'adj.','The uphill section starts just beyond the cottages.','上坡路段從小屋再過去一點開始。'],
['retrace your steps','循原路回走',2,'phr.','If the lane ends here, we should retrace our steps.','若巷道到這裡就沒了，我們應循原路回走。'],
['The entrance is across the courtyard','入口在庭院另一側。',3],
['Visible does not mean directly accessible','看得見，不代表能直接到達。',3],
['Let us return to that familiar junction','我們先回到那個熟悉的路口。',3]
],
spells: [
['SHORTCUT','n.','比一般路線更近的捷徑','The shortcut crosses a field rather than following the road.','這條捷徑穿越田地，不沿道路走。'],
['APPROXIMATE','adj.','大致的；非精確的','The map gives an approximate walking time.','地圖提供大致的步行時間。'],
['DIVERSION','n.','因原路受阻而安排的改道路線','Follow the signed diversion while the bridge is being repaired.','橋梁維修期間，請循標示的改道路線走。'],
['ORIENTATION','n.','對自身位置與方向的辨識','The first exercise helps visitors develop a sense of orientation.','第一個練習幫助訪客建立位置與方向感。']
],
fills: [
['THOROUGHFARE','n.','供車輛或行人穿行的主要道路','The narrow lane leads onto a busy thoroughfare.','這條窄巷通向一條繁忙的主要道路。'],
['BEARINGS','n. pl.','位置與方向感（常用複數）','She paused at the crossing to get her bearings.','她在交叉口停下來，確認自己的位置與方向。'],
['NAVIGATE','v.','辨認方向並找路前進','She uses street names to navigate through the old town.','她利用街名在老城區辨認方向前進。'],
['VISIBILITY','n.','能見度；可看清的程度','Poor visibility made the distant tower hard to recognise.','能見度差，遠處的塔不容易辨認。']
]
},
7: {
reading: [
[1,'【推論】A campus map enlarges the central buildings and compresses the spaces between them. Its designer calls it a guide to connections, not a scale drawing. What does that distinction explain?','Distances cannot be read directly from the spacing shown.|Only the largest buildings are connected by paths.|The campus itself has become more densely built.|Connections matter only when a visitor remains in the centre.','非比例圖可以保留連接關係，不能直接由圖上間隔推實際距離。'],
[1,'【語用】The route is accessible, provided you approach it from the west. What does the qualification imply?','The approach is relevant to whether the route can be used.|Western visitors are given priority over other visitors.|The route becomes accessible only after sunset.|An accessible approach is necessarily the shortest approach.','provided引入條件；同一設施的不同進入方向可能有不同可用性。'],
[1,'【指涉】The digital map is updated weekly; the wall display, less frequently. It is the latter that visitors tend to consult first. Which source is first consulted?','The wall display.|The weekly update notification.|The digital map.|A separate comparison of both versions.','latter指第二者wall display，更新頻率不決定實際先看哪個。'],
[1,'【文法】Had the closure been indicated at the first junction yesterday, we ___ the unnecessary climb we ended up making.','could have avoided|can have avoided|could avoid|will have avoided','Had引導與過去事實相反的條件，主句could have avoided表示本來可避免已發生的攀爬。'],
[1,'【短文】A station replaces arrows with colour-coded routes. Visitors identify the colours easily but remain unsure where each route begins. What has the change failed to resolve?','Locating the point at which to join a route.|Distinguishing one route colour from another.|Recognising whether the station has several routes.|Remembering the name of the station they entered.','顏色辨識已成功，未解的是各路線起點。'],
[2,'【語意】The map is comprehensive in coverage but selective in detail. Which description preserves that contrast?','It includes the whole area while omitting some local features.|It depicts a small area with every feature drawn precisely.|It uses some areas to stand for places outside its scope.|It provides more local detail as its geographical coverage shrinks.','coverage是涵蓋範圍，selective detail是範圍內資訊有所選擇；未說縮小範圍的動態變化。'],
[2,'【推論】A route marked as direct crosses a courtyard that is open only during office hours. The reviewer recommends qualifying the label. What needs to be made explicit?','When that direct route is available.|How far the courtyard lies from the office.|Who originally chose the word direct.|Whether the courtyard has more than one entrance.','direct並非一定不對，但依賴庭院開放時段，標籤需附可用條件。'],
[2,'【語用】The problem is not a shortage of signs so much as their placement. What response best addresses the diagnosis?','Reviewing where signs meet visitors at decision points.|Adding signs in proportion to each corridor’s length.|Printing the current signs in a larger range of colours.|Counting signs before comparing the lengths of the routes.','not ... so much as將重點移到位置；decision points直接對應需要作路線決定處。'],
[2,'【短文】Residents call the alley Market Lane, although it appears under another name on official maps. A local guide prints both names. What is the guide trying to bridge?','Everyday usage and the formal naming system.|The alley’s current name and a predicted future name.|A pedestrian route and a parallel vehicle route.|Residents’ addresses and visitors’ accommodation details.','兩個名稱對應在地慣用與官方系統，不必推定先後改名。'],
[3,'【推論】After testing the signs with first-time visitors, the designer removes an instruction that staff had considered self-evident. Visitors had interpreted it in two different ways. What explains the removal?','Staff familiarity had concealed ambiguity in the wording.|Visitors had demonstrated that the route itself was closed.|The instruction had become unnecessary after staff training.|Staff had mistaken a temporary sign for a permanent one.','熟悉場地者認為不言自明，新訪客卻有兩種解讀，揭露熟悉度掩蓋的歧義。'],
[3,'【短文】An access map highlights step-free entrances but leaves the connecting paths unmarked. A reviewer notes that an entrance is useful only if a visitor can reach it. What is the underlying criticism?','Isolated features are shown without the usable links between them.|The map makes entrances appear closer to one another than they are.|The map includes entrances that should be reserved for staff.|A step-free entrance cannot be represented on a conventional map.','入口資訊不等於全程可達，批評缺少串接路徑，不是否定無階差入口或地圖形式。'],
[3,'【語用】The revised map is easier to read, though whether it is easier to use remains to be seen. What distinction is preserved?','Visual clarity has improved; practical wayfinding has not yet been established.|Practical wayfinding has improved; the lettering remains too small.|Readers prefer the old map even though they navigate faster with the new one.|The new map is visually clearer because its users already know the route.','easier to read已肯定，whether ... remains to be seen保留實際使用成效未定。']
],
listening: [
[1,'The route is shorter on paper, but that assumes the courtyard gate is open.','紙上路線較短，但前提是庭院門開著。|庭院門開著，因此路線圖才印得比較小。|路線圖尚未確認，所以無法知道庭院門在哪裡。|庭院門會按紙本路線的長度決定開放時間。','assumes指出較短路線所依賴的通行條件，不是地圖尺寸。'],
[1,'We have made the labels clearer without making the underlying layout any less confusing.','標籤變清楚了，但配置本身仍令人困惑。|配置變得較清楚，因此標籤已可移除。|標籤和配置都改善了，只差顏色尚未調整。|標籤較模糊，所以必須靠配置來補救。','without ... any less否定配置困惑程度的改善，同時保留標籤的進步。'],
[1,'The blue route is intended for visitors; staff tend to use the service corridor instead.','藍線為訪客規畫，員工通常改走服務走廊。|藍線只供員工走，訪客應走服務走廊。|員工傾向帶訪客一起走藍線後再進走廊。|服務走廊改開放訪客後，員工才開始走藍線。','intended用途與tend實際習慣分述，未說員工帶路或制度變更。'],
[1,'That marker tells you where the path starts, not whether you are facing the right direction.','標記指出路徑起點，不保證你面向正確方向。|標記能確認面向，卻不能指出路徑起點。|先面向正確方向，標記才會移到路徑起點。|標記同時標示起點與目的地的相對方位。','where與whether區分位置資訊和朝向判斷。'],
[1,'The old street names survive in conversation even where the signs have been replaced.','即使路牌已更換，日常交談仍沿用舊街名。|舊街名只保留在路牌，交談時已改用新名。|交談內容已證明路牌更換並未實際進行。|路牌依居民每次交談時使用的名稱而更換。','survive in conversation說明口語慣用與路牌變動不同步。'],
[2,'I am not questioning the survey. I am questioning whether these are the measurements a walker needs.','不是質疑測量本身，而是這些數據是否符合步行者需求。|測量方法有誤，因此任何步行資訊都不可信。|只要補做測量，就不再需要詢問步行者需求。|步行者已提供全部數據，測量只是確認其正確性。','區分資料可信度和對使用者目的的適切性，未否定測量。'],
[2,'We should not mistake the absence of a line for the absence of a path.','不能因圖上沒畫線，就認定實地沒有路。|圖上若有線，就能確認實地道路目前開放。|圖上沒畫線，反而代表實地路徑特別寬。|實地道路是否存在，可由圖上線條長度判斷。','absence對比地圖表述與實地存在；也不反向保證有線就開放。'],
[2,'The entrance is clearly signed once you are in the courtyard, which is precisely where newcomers struggle to get.','進庭院後入口標示清楚，但新來者恰恰難在先到庭院。|新來者能輕易到庭院，困難只在認出入口文字。|入口標示把訪客帶離庭院，所以應全部移除。|庭院目前不開放，因此標示清不清楚已無差別。','once條件與which補充構成資訊出現太晚的問題。'],
[2,'It is a more legible map, not necessarily a more faithful picture of the distances involved.','地圖更易辨讀，不代表距離呈現更忠實。|距離畫得更準確，但標籤比以前更難辨讀。|由於更易辨讀，距離的準確度也已獲得證實。|地圖只呈現距離，不再提供辨讀所需的標籤。','legible與faithful to distances為不同評價面向，not necessarily不等於距離一定錯。'],
[3,'The alternative route is not an afterthought; it is the only one that works when the lift is out of service.','替代路線並非附帶應付，而是電梯停用時唯一可行路線。|替代路線尚未想好，因此電梯停用就沒有路可走。|替代路線只在電梯運作時可用，停用後須另規畫。|電梯停用只是設計完成後才偶然發現的小問題。','not an afterthought反對把替代路線視為事後附加；its必要性由停梯條件說明。'],
[3,'People are following the signs accurately. The difficulty is that the signs were designed around a route we no longer recommend.','人們正確照標示走；問題是標示仍依已不建議的路線設計。|人們誤讀了標示，因此才走上目前建議的路線。|設計已按新路線更新，但人們還習慣走舊路。|人們依標示走得太慢，所以設計者不再推薦步行。','following accurately排除使用者照做有誤，問題在標示所承接的過時路線。'],
[3,'Calling it intuitive tells us something about the designer’s familiarity with the place, unless newcomers find it intuitive too.','若新來者未有同感，「直覺易懂」可能只反映設計者熟悉場地。|只要設計者熟悉場地，新來者就必定會覺得容易。|新來者若不熟悉場地，就不適合評估設計是否直覺。|設計者應避免熟悉場地，才能證明地圖易懂。','unless要求以新來者經驗檢驗直覺性，指出熟悉度可能混入判斷。']
],
voices: [
['wayfinding','在環境中辨識位置與尋找路線',1,'n.','The hospital tested its wayfinding system with people on their first visit.','醫院找初次到訪者測試辨位導引系統。'],
['legibility','文字或圖示容易辨讀的程度',1,'n.','Improved legibility does not by itself guarantee a useful route.','辨讀性改善本身並不保證路線實用。'],
['disorientation','失去方向感的狀態',1,'n.','Identical corridors can create a sense of disorientation.','看起來相同的走廊可能讓人失去方向感。'],
['unobstructed','沒有被阻擋的',2,'adj.','The plan must preserve an unobstructed route to the exit.','規畫須保留一條通往出口、不受阻擋的路線。'],
['topography','地形的形狀與高低起伏',2,'n.','The map simplifies the topography but retains the steepest slopes.','地圖簡化了地形，但保留最陡的坡段。'],
['Prior familiarity can obscure a sign’s ambiguity','先前的熟悉感可能掩蓋標示的歧義。',3],
['Clarity matters most at the decision point','清楚的資訊在作決定的位置尤其重要。',3],
['Existence does not entail practical accessibility','存在不必然代表實際可達與可用。',3]
],
spells: [
['DEMARCATION','n.','界線的劃分或標示','The demarcation between the public path and the work area is unclear.','公共小路與施工區之間的界線標示不清。'],
['TRAVERSABLE','adj.','可以穿越或通過的','A path shown on the plan may not be traversable after heavy rain.','圖上畫出的路徑，大雨後可能無法通過。'],
['INTERCONNECTED','adj.','彼此相連的','The buildings are interconnected, but the connecting doors close at night.','建築物彼此相連，但相接的門夜間會關閉。'],
['NAVIGABILITY','n.','可供航行或順利穿行的程度','The review distinguishes the map’s visual appeal from the navigability of the site.','審查將地圖的視覺吸引力與場地實際便於穿行的程度分開評估。']
],
fills: [
['OBSCURED','adj.','被遮擋而看不清的','The sign was partly obscured by an open door.','路牌有一部分被打開的門遮住。'],
['AMBIGUOUS','adj.','容許不只一種解讀的','The instruction is ambiguous about which entrance to use.','指示沒有清楚交代該使用哪個入口。'],
['CONTINUITY','n.','連續性；不中斷的銜接','The proposal improves continuity between the riverside paths.','提案改善河岸步道之間不中斷的銜接。'],
['ACCESSIBILITY','n.','可抵達與使用的程度','The assessment considers accessibility along the whole route.','評估考慮整條路線的可達與可用程度。']
]
},
8: {
reading: [
[1,'【論述】An atlas calls a district peripheral. A local reviewer accepts its physical position near the edge of the sheet but objects to the implication that its activities are marginal. What precisely is resisted?','The slide from spatial placement to a judgement of significance.|The use of local activities to establish a geographical centre.|The assumption that different maps must use the same scale.|The claim that the reviewer has located the district inaccurately.','接受圖面邊緣位置，不接受把空間邊緣延伸成活動不重要；測的是peripheral的評價性涵義。'],
[1,'【語用】The map is admirably spare; whether it is spare at the traveller’s expense is another question. How does the second clause qualify the praise?','It asks whether simplification removes information the user needs.|It suggests that printing the map has exceeded the traveller’s budget.|It questions whether travellers appreciate restrained graphic design.|It contrasts the traveller’s preferred route with the designer’s own journey.','at someone’s expense在此是使用者因簡化受損的可能性，不是印刷費。'],
[1,'【論述】A redraw preserves the boundaries but replaces the names. The editor calls the former a technical necessity and the latter a political choice. A critic replies, “Keeping a line is no less a choice than moving it.” What is being challenged?','The framing of continuity as politically unchosen.|The description of renaming as distinct from redrawing.|The accuracy of the coordinates used for the retained line.|The notion that the redraw could retain features of the earlier map.','批評者把保留也視為選擇，反對將沿用既有界線排除於政治取捨之外，不是否定座標或兩種操作可區分。'],
[1,'【論述】Defending a schematic’s equal spacing, the designer says, “Its not being to scale is a convention, not a defect.” Which reply accepts that defence without treating the convention as proof of universal usefulness?','The convention may be legitimate while still misleading users estimating walking time.|If the convention is legitimate, discrepancies in walking distance cease to matter.|The diagram becomes universally useful once its spacing matches the walking distances.|A misleading use of the diagram establishes that the convention itself is defective.','可承認非比例慣例正當，同時保留特定用途不適合的判斷；其餘把慣例正當、實用性或缺陷作過強推論。'],
[1,'【論述】The critic writes, “The map does not invent the barrier; it makes the barrier look like a natural edge.” What is being challenged?','The presentation of an existing division as self-evident.|The claim that the barrier can be physically crossed.|The reliability of the measurements used to locate the barrier.|The assumption that the map depicts every barrier in the area.','區分障礙物存在與它被自然化呈現，批評的是後者，而非測量或可穿越性。'],
[2,'【語用】One could hardly ask for a clearer legend, says the reviewer, before describing symbols used inconsistently across the sheet. What makes the praise pointed?','The key is clear, but the map fails to follow its own key.|The reviewer regards detailed legends as unnecessary for experienced readers.|The symbols are consistent, but their explanations have become too elaborate.|The reviewer prefers a key that allows the reader to improvise meanings.','legend清楚與實際使用不一致形成反差；反諷不等於把legend字面評價全部翻反。'],
[2,'【論述】An essay describes a map as an argument conducted through selection. This does not mean that its measurements are fabricated. Which claim is compatible with both statements?','Accurate measurements can be organised to favour a particular reading.|Selectivity becomes argumentative only when measurements are unreliable.|Readers must choose between accepting the measurements and questioning the framing.|A map’s argument can be identified without considering what it leaves out.','正確數據仍可經取捨與安排形成特定論述，不必假造測量。'],
[2,'【推論】Two routes remain equally prominent on an old map, although one has since become inaccessible. The curator retains both in a historical display. Which judgement best respects the stated purpose?','The unchanged emphasis can document an earlier arrangement rather than guide current travel.|The map should be judged solely by how efficiently it directs present-day visitors.|Retaining both routes implies that the curator disputes the closure.|The historical purpose makes the relative prominence of the routes irrelevant to interpretation.','歷史展示可保留昔日格局，不等於現時導航指引或否認封閉；呈現方式仍可供解讀。'],
[2,'【編輯】A fieldworker writes, “From here the road runs behind the school.” The editor substitutes “from the station” for “from here”, although the notes never locate the writer. Which objection most precisely targets the edit?','It resolves an unspecified viewpoint by importing an unsupported location.|It preserves the viewpoint while making the destination more explicit.|It treats behind as a fixed compass direction while retaining the same stated origin.|It removes the writer’s location while leaving the frame of reference unchanged.','here指涉依賴說話位置；紀錄未定位，編輯卻填入車站，是無證據地確定參照點，不是補明目的地。'],
[3,'【語用】The planner describes the redesign as restoring coherence. A resident replies, “Whose coherence is being restored?” What does the reply put under scrutiny?','The viewpoint that makes the earlier arrangement seem coherent.|Whether the redesign will reproduce the earlier street layout exactly.|Which resident originally proposed using the word coherence.|Whether coherence is a property that can be discussed in planning at all.','Whose要求揭露一致性的評價視角與受益者，不單是復原施工精度。'],
[3,'【論述】A writer says that a street map can be faithful to the network while estranging those whose habitual routes it omits. Which tension is being articulated?','Structural accuracy can coexist with a failure to recognise lived patterns of movement.|A technically accurate network necessarily records every customary route.|Habitual routes are more reliable evidence of distance than surveyed streets.|A map must distort the network in order to represent residents’ experience.','網絡結構準確與對日常實踐缺乏辨認可同時成立，不強迫二選一。'],
[3,'【推論】A diagram removes local names to make its symbols usable across languages. The accompanying essay notes that the names also carry local history. What is the most balanced reading of the choice?','It gains portability by giving up a particular kind of situated meaning.|It preserves local history in a form that no longer requires translation.|It shows that local names had prevented residents from understanding the diagram.|It makes historical interpretation possible by separating names from places.','跨語言通用性與在地歷史意義的取捨由題內明示，不能把便於通用當保留一切。']
],
listening: [
[1,'The line looks inevitable on the page. It took years of negotiation to put it on the ground.','紙上的線彷彿理所當然，實地劃設卻經多年協商。|紙上的線仍未定案，因此地面至今沒有界線。|地面界線早已存在，協商只處理地圖紙張品質。|協商時間長，證明圖上的線也必須畫得較長。','inevitable與negotiation對照圖面自然感和實際形成過程，不聲稱界線未定。'],
[1,'I am less interested in what the map gets wrong than in what it invites us not to notice.','比起明顯錯誤，更關注地圖引導人忽略的事物。|認為忽略細節無關緊要，應只檢查測量錯誤。|想先列出每個錯誤，再決定哪些內容值得觀看。|由於地圖沒有錯誤，研究已不需要再繼續。','less ... than轉移關注到選擇性注意，不是斷言沒有錯。'],
[1,'The diagram is neutral about distance only in the limited sense that it declines to represent it.','所謂對距離中立，只是指它不打算呈現距離。|它對距離的呈現已證實不受任何取捨影響。|它將各段距離平均化，因此實際路程也較平均。|它先測量距離，再以中立標準選出最短路線。','limited sense限制neutral的意義：不呈現不等於客觀呈現得毫無取捨。'],
[1,'Naming the area a gateway tells you where the speaker imagines the important journey begins.','稱該區為門戶，透露說話者認為重要行程從何開始。|門戶這個名稱足以確定當地最早興建的道路。|該區只有一個入口，所以說話者不能採用其他名稱。|行程的重要性可直接由地圖上入口數量推算。','比喻gateway透露敘述者設定的旅程視角，沒有提供道路歷史。'],
[1,'The old names have not vanished; they have been displaced from the official layer.','舊名未消失，只是被移出官方那一層表述。|舊名完全失傳，因此官方不再能查證。|官方保留舊名，其他場合則已停止使用。|舊名因地點搬遷而轉移到另一個實際地區。','not vanished與official layer限定移出的表述系統，不宣稱所有場合絕跡。'],
[2,'To call it an empty space is already to privilege one account of what counts as occupation.','稱它空地，已偏重某種對何謂占用或居用的理解。|稱它空地，只是在轉述一項不涉及定義的測量結果。|空地是否有人使用，與如何定義占用並無關係。|只要提出另一種用語，就能確定每位使用者的身分。','already privilege指出命名已帶入判準，非中性地重述單一量測。'],
[2,'The map’s authority rests partly on the ease with which its choices disappear into its conventions.','地圖部分權威來自取捨融入慣例後不易被察覺。|地圖權威只取決於是否逐一列出製圖者的選擇。|慣例消失後，讀者反而更容易辨認地圖權威。|地圖選擇越難實際執行，使用者就越願意信任它。','choices disappear into conventions指取捨被慣例自然化，partly不等於唯一原因。'],
[2,'We can accept the coordinates without accepting the story their arrangement has been made to tell.','可以接受座標，同時不接受其安排所構成的敘事。|只要接受座標，就應同時接受由它們構成的敘事。|要質疑敘事，首先必須證明每個座標都有錯。|座標既能被安排，實地位置就完全無法查證。','without accepting保留事實資料與組織敘事分層判斷的可能性。'],
[2,'That is not a complaint that the map simplifies. It is a question about whose complications are deemed expendable.','不是反對簡化本身，而是問誰的複雜處境被視為可省略。|是要求停止簡化，將所有人的全部細節都印上。|是認為只要由居民製圖，就不會有資訊取捨。|是詢問誰能付費購買更複雜的地圖版本。','whose complications將焦點移到簡化成本的分配，未要求任何圖都無所不包。'],
[3,'The revision makes the border less conspicuous, which is not quite the same as making it less consequential.','修訂讓邊界不那麼顯眼，不等於它的影響減弱。|邊界變得不顯眼，證明它已不再影響人們通行。|修訂使邊界更重要，因此才刻意畫得較粗。|只要把邊界重新標出，就能消除其所有影響。','conspicuous為視覺顯著，consequential為有實際後果，兩者不等同。'],
[3,'What the visitor experiences as a seamless route may be a succession of thresholds to the people who live along it.','訪客覺得一路順暢，沿線居民卻可能經歷一連串界限或門檻。|訪客與居民對這條路的經驗相同，只是用詞不同。|沿線居民不曾走過此路，所以無法評估通行是否順暢。|路上每一處實體門檻都會同樣阻擋訪客與居民。','may及不同群體經驗對照保留差異，thresholds可指社會性界限，不限實體門檻。'],
[3,'The map offers a view from nowhere, provided we agree not to ask who chose the viewpoint.','只要不追問誰選視角，它就彷彿提供了無立場的觀看。|地圖未採任何視角，所以不必詢問製圖者。|只要知道製圖者的名字，就能證明座標皆錯。|地圖無法辨認出任何地點，因此也沒有觀看方向。','provided帶反諷條件：不問視角的選擇，才維持看似無立場的效果。']
],
voices: [
['cartographic','與地圖繪製或地圖表述有關的',1,'adj.','The essay examines the cartographic choices behind the apparently simple diagram.','文章探討看似簡單的圖示背後有哪些製圖取捨。'],
['contiguous','空間上相接或毗鄰的',1,'adj.','The districts are contiguous, yet their daily routes rarely intersect.','兩區空間相接，但日常活動路線很少交會。'],
['peripheral','位於邊緣或被視為次要的',1,'adj.','A district described as peripheral from one viewpoint may be central from another.','一個視角下被稱為邊緣的地區，換個視角可能居於中心。'],
['deictic','指涉依賴說話者所處語境的',2,'adj.','In the instruction, here is a deictic expression whose reference changes with the speaker’s position.','在這項指示中，here是指涉會隨說話者位置改變的語境指示表達。'],
['schematic','以簡化結構或關係示意的',2,'adj.','The schematic drawing preserves connections rather than geographical scale.','這張示意圖保留連接關係，而不是地理比例。'],
['Cartographic omission need not imply emotional detachment','製圖上的省略，未必表示情感上的疏離。',3],
['Centrality depends on whose perspective we adopt','中心性取決於我們採用誰的視角。',3],
['Accurate coordinates do not confer narrative authority','座標準確，不等於敘述因此具有權威。',3]
],
spells: [
['CARTOGRAPHY','n.','地圖的繪製與製作研究','The exhibition presents cartography as both measurement and interpretation.','展覽把製圖呈現為兼具測量與詮釋的工作。'],
['DELINEATION','n.','界線或輪廓的勾畫與界定','The delineation of the district leaves several shared spaces outside its boundary.','該區的界線劃定把幾處共用空間留在區界之外。'],
['CONSTRUAL','n.','對事物的特定理解或解讀方式','The same line permits a different construal when read beside the residents’ accounts.','同一條線若與居民敘述並讀，可以產生不同解讀。'],
['TERRITORIALITY','n.','與空間占有、控制或領域歸屬有關的行為或觀念','The study examines territoriality in spaces where formal boundaries are absent.','研究探討在沒有正式界線的空間中，與領域占有及控制有關的行為。']
],
fills: [
['CONTIGUITY','n.','空間上的相鄰或接壤','Contiguity alone does not explain how often the two communities interact.','單是空間相鄰，無法說明兩個社群互動的頻率。'],
['PARTIALITY','n.','對某事物的偏愛或偏袒','The curator acknowledged a partiality for orderly diagrams.','策展人承認自己偏愛井然有序的圖示。'],
['CIRCUMSCRIPTION','n.','範圍的限制或界定','The essay questions the circumscription of public space implicit in the new boundary.','文章質疑新界線所隱含的公共空間範圍限縮。'],
['REPRESENTATIONAL','adj.','與如何描繪或呈現事物有關的','The dispute concerns a representational choice rather than an error in the coordinates.','爭議涉及如何呈現的選擇，而非座標錯誤。']
]
}
};
