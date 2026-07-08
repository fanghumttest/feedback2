import { useState, useEffect, useRef } from "react";
import { dbGet, dbSet, dbDel } from "../firebase";
import logoImg from '../Logo/Logo.png';

// ── 預設題目 ────────────────────────────────────────────────
// Phase 2 — 清信院全功能。每個 Part 用 group 分流（A~F），
// 在 admin「組別通行碼」設定各組通行碼後，測試員只會看到自己那組的 Part。
const DEFAULT_PARTS = [
  // ── 組 A：清信院場景 + 靜坐 ──
  {id:"part1",title:"Part 1",subtitle:"清信院前院與主院",icon:"🏯",group:"A",description:"情境：你從首頁走進「清信院」，先在前院看看，再走進主院（房子裡面）。",sections:[
    {title:"1.1　走進清信院前院",items:[{id:"1.1.1",text:"從首頁點「清信院」後，畫面有一段往前推進的動畫，然後進到前院"},{id:"1.1.2",text:"動畫還在跑的時候，再亂點不會重複觸發、亂跳"},{id:"1.1.3",text:"前院看得到「大樹下的桌子」「房子入口」「一個圓形的儀器（渾天儀）」這幾個地方"},{id:"1.1.4",text:"滑鼠移到這幾個地方，旁邊會跳出名字（手機直接看得到名字）"},{id:"1.1.5",text:"前院的天色會跟著現在的時間不一樣（白天／黃昏／晚上）"}]},
    {title:"1.2　走進主院",items:[{id:"1.2.1",text:"滑鼠移到房子入口，會出現「進入主院」字樣"},{id:"1.2.2",text:"點入口後有往前推進的動畫，然後進到房子裡面"},{id:"1.2.3",text:"主院裡看得到牆上的水墨畫、桌子、還有可以點的地方"},{id:"1.2.4",text:"牆上的水墨畫偶爾會有流動的感覺（不是一直在動）"}]},
    {title:"1.3　主院的三個入口（重要）",note:"主院裡有三樣東西可以打開：牆上畫作（登山進度）、桌上的書（地仙日誌）、還有方寸澄心。",items:[{id:"1.3.1",text:"滑鼠移到牆上畫作的右上角，出現「登山進度」，點了會打開"},{id:"1.3.2",text:"滑鼠移到桌上的書，出現「地仙日誌」，點了會打開"},{id:"1.3.3",text:"看得到「方寸澄心」的位置，點了會打開"},{id:"1.3.4",text:"打開其中一個後，再去打開另一個，前一個會自動關掉（不會兩個一起開著）"},{id:"1.3.5",text:"在打開的視窗外面點一下，視窗會關掉、回到主院"}]},  ]},
  {id:"part2",title:"Part 2",subtitle:"坐下靜坐",icon:"🧘",group:"S",description:"情境：你走到清信院前院左邊的大樹下，想坐下來靜坐休息。\n（提醒：有幾題要坐滿 5 分鐘，請耐心等一下，可以分次測）",sections:[
    {title:"2.1　進入靜坐",items:[{id:"2.1.1",text:"在前院，滑鼠移到左邊大樹的桌子那邊，會出現「坐下靜坐」字樣（手機直接看得到）"},{id:"2.1.2",text:"點「坐下靜坐」後，畫面切換到靜坐畫面"},{id:"2.1.3",text:"畫面正中央有一個大大的圓形計時器，顯示 00:00:00"},{id:"2.1.4",text:"畫面右邊直著寫「靜坐休憩」，下面有「本週 X / 7」的字"}]},
    {title:"2.2　設定要坐多久",note:"畫面下面有三顆加時間的按鈕：+1分鐘、+30分鐘、+60分鐘。",items:[{id:"2.2.1",text:"按一下「+1分鐘」，中間的時間就變成 1 分鐘"},{id:"2.2.2",text:"連續按三下「+1分鐘」，時間變成 3 分鐘"},{id:"2.2.3",text:"按一下「+1分鐘」再按一下「+30分鐘」，時間變成 31 分鐘"},{id:"2.2.4",text:"一直加時間，加到最多 1 小時 59 分 59 秒就不會再增加了"},{id:"2.2.5",text:"正在使用的那顆按鈕會變成金色實心，一眼看得出來"}]},
    {title:"2.3　開始坐、暫停、重來",items:[{id:"2.3.1",text:"按下播放鍵（▶）後，時間開始往下倒數"},{id:"2.3.2",text:"倒數的時候，外圈的圓圈會跟著時間一格一格繞"},{id:"2.3.3",text:"正在倒數時，「重置」鍵是灰色的、按不下去"},{id:"2.3.4",text:"先暫停以後，「重置」鍵才變成可以按"},{id:"2.3.5",text:"按「重置」後，時間回到你剛剛設定的數字（例如剛剛設 6 分鐘就回到 6 分鐘）"}]},
    {title:"2.4　手機放著會不會停（很重要）",note:"這題請用手機測：設定好時間、開始倒數後，把手機螢幕關掉（鎖屏）。",items:[{id:"2.4.1",text:"手機鎖屏放著大約 2～3 分鐘後再打開，計時器的時間還是對的、沒有停住"}]},
    {title:"2.5　坐完之後會不會記錄",note:"「本週 X / 7」代表這禮拜你坐滿幾天。請特別看這個數字有沒有正確變化。",items:[{id:"2.5.1",text:"時間倒數到 0 時會自動停下來，圓圈繞滿一圈會亮一下，但畫面不會自己關掉"},{id:"2.5.2",text:"坐不到 5 分鐘就關掉 → 右邊「本週 X」的數字「不會」增加"},{id:"2.5.3",text:"坐滿 5 分鐘以上才關掉 → 右邊「本週 X」的數字「會」加 1"},{id:"2.5.4",text:"同一天再坐第二次、一樣坐滿 5 分鐘 → 「本週 X」不會再加（一天只算一次）"}]},
  ]},
  // ── 組 B：上品受誡臺 ──
  {id:"part3",title:"Part 3",subtitle:"上品受誡臺（受戒）",icon:"🌟",group:"B",description:"情境：你在清信院前院，點那個圓形的儀器（渾天儀），進入「上品受誡臺」受戒。",sections:[
    {title:"3.1　進入受誡臺",items:[{id:"3.1.1",text:"在前院點圓形的儀器（渾天儀），進入受誡臺畫面"},{id:"3.1.2",text:"畫面是深色的星空背景，有很多星星排成一群一群"},{id:"3.1.3",text:"右邊直著寫「上品受誡臺」"},{id:"3.1.4",text:"畫面可以左右滑動，看到不同的星群（不同的誡律）"},{id:"3.1.5",text:"右下角看得到進度，例如「目前 0/12」"}]},
    {title:"3.2　打開戒條",items:[{id:"3.2.1",text:"點任何一顆星星、或點誡律的標題，右邊會滑出一個面板（手機是跳出整頁視窗）"},{id:"3.2.2",text:"面板裡列出這組誡律的每一條（例如「第一誡者…」）"},{id:"3.2.3",text:"滑鼠移到某一條，那條字會放大、變亮，提示可以點"},{id:"3.2.4",text:"在面板外面點一下，面板會關起來"}]},
    {title:"3.3　受戒（用長按的）",note:"受戒的方式是「長按」那一條戒，按住大約 3 秒。",items:[{id:"3.3.1",text:"按住一條戒不放，那條字會慢慢被染成金黃色"},{id:"3.3.2",text:"按住的時候，對應的星星會輕輕跳動、變亮（手機會震動）"},{id:"3.3.3",text:"按住滿 3 秒後，那條字固定變金黃色 = 受戒完成"},{id:"3.3.4",text:"還沒滿 3 秒就放開手，會取消、字變回原樣"},{id:"3.3.5",text:"受完戒後不能反悔（再按也不會變回去）"},{id:"3.3.6",text:"受戒後，右下角的進度數字會增加（例如 0/12 變成 1/12）"}]},
    {title:"3.4　計分規則（請對照確認）",note:"規則：每一組誡，第一次受戒「不會」加功德，要下個月再回來受第二次才開始加。「根本五誡」永遠不加功德。",items:[{id:"3.4.1",text:"第一次受某一組戒，地仙日誌有紀錄，但功德點數（三千功）沒有增加"},{id:"3.4.2",text:"「根本五誡」這組受戒後，功德點數不會增加"},{id:"3.4.3",text:"受戒後，去地仙日誌看得到當天的受戒紀錄"}]},  ]},
  // ── 組 C：地仙日誌 ──
  {id:"part4",title:"Part 4",subtitle:"地仙日誌",icon:"📖",group:"C",description:"情境：你在主院點桌上那本書，打開「地仙日誌」，看自己的修行紀錄。",sections:[
    {title:"4.1　打開地仙日誌",items:[{id:"4.1.1",text:"在主院點桌上的書，會看到一本書打開的動畫"},{id:"4.1.2",text:"書打開後，看得到目前的修行階段圖片和標題（例如「一轉」）"},{id:"4.1.3",text:"第一頁下面有「累計」資訊：齋、戒、功、課各累積多少"},{id:"4.1.4",text:"標題旁邊有「下載全紀錄」按鈕"}]},
    {title:"4.2　翻頁看紀錄",note:"書的每一個跨頁代表「一個月份」。",items:[{id:"4.2.1",text:"滑鼠移到書的左右邊緣，游標會變成左箭頭／右箭頭"},{id:"4.2.2",text:"點右邊往較新的月份翻，點左邊往較舊的月份翻"},{id:"4.2.3",text:"每一頁上面有顯示年份和月份"},{id:"4.2.4",text:"翻頁有翻書的動畫，動畫還沒翻完時再點不會亂跳"},{id:"4.2.5",text:"翻到最新或最舊的月份時，就不能再往那個方向翻了"}]},
    {title:"4.3　看每天的紀錄",items:[{id:"4.3.1",text:"每天的紀錄是一張卡片，上面有當天日期"},{id:"4.3.2",text:"卡片上有齋／戒／功／課的圖示，做過的是亮的、沒做的是淡淡的"},{id:"4.3.3",text:"如果某天有寫週課（問童子或繪浮生），卡片上看得到前面一小段文字"},{id:"4.3.4",text:"點那段週課文字，會在書上進到「週課內頁」看全文"},{id:"4.3.5",text:"週課內頁可以往下滑，看到完整內容"},{id:"4.3.6",text:"週課內頁有「返回」可以回到紀錄列表"}]},
    {title:"4.4　沒資料 / 下載",items:[{id:"4.4.1",text:"完全還沒有任何紀錄時，會看到「尚未開始」之類的提示，不是空白破圖"},{id:"4.4.2",text:"點「下載全紀錄」可以下載紀錄檔"}]},  ]},
  // ── 組 D：方寸澄心 + 登山進度 ──
  {id:"part5",title:"Part 5",subtitle:"方寸澄心（每週功課）",icon:"✍️",group:"D",description:"情境：你在主院打開「方寸澄心」，這是每週要做一次的功課，從「問童子」或「繪浮生」二選一寫一篇。",sections:[
    {title:"5.1　進入與選擇",items:[{id:"5.1.1",text:"打開方寸澄心後，看到「問童子」和「繪浮生」兩個選項"},{id:"5.1.2",text:"滑鼠移到選項上，選項會左右晃動"},{id:"5.1.3",text:"點其中一個，進入填寫畫面"}]},
    {title:"5.2　填寫",items:[{id:"5.2.1",text:"填寫畫面有對應的圖片（童子或筆刷）和一個打字框"},{id:"5.2.2",text:"打字框最多打 1000 字，旁邊會即時顯示目前字數"},{id:"5.2.3",text:"中文、英文、表情符號都打得進去"},{id:"5.2.4",text:"打到 1000 字後就打不進去了"},{id:"5.2.5",text:"打一打先離開、再打開方寸澄心，剛剛打的字還在（自動存草稿）"}]},
    {title:"5.3　返回與送出",items:[{id:"5.3.1",text:"有「返回」可以回到「問童子／繪浮生」選擇畫面"},{id:"5.3.2",text:"點「提交」後，畫面有一段過場動畫（例如文字化成沙子）"},{id:"5.3.3",text:"過場後出現「本週已完成」的畫面"},{id:"5.3.4",text:"完成畫面停一下會自動關掉、回到主院"},{id:"5.3.5",text:"送出成功後，剛剛的草稿被清掉了"}]},
    {title:"5.4　本週只能交一次",note:"規則：每週交一次，每週一 00:00 重置。",items:[{id:"5.4.1",text:"這週交過以後，再打開方寸澄心，會直接看到「本週已完成」，不會再讓你選題"},{id:"5.4.2",text:"送出後去地仙日誌，看得到這週的週課紀錄"}]},  ]},
  {id:"part6",title:"Part 6",subtitle:"登山進度",icon:"⛰️",group:"D",description:"情境：你在主院點牆上的畫作，打開「登山進度」，看自己修到第幾轉、累積多少功德。",sections:[
    {title:"6.1　打開登山進度",items:[{id:"6.1.1",text:"在主院點牆上畫作右上角，打開「登山進度」"},{id:"6.1.2",text:"看到一張山路圖，上面標著各個關卡（一轉、二轉…十轉）"},{id:"6.1.3",text:"你現在的關卡會比較明顯（會上下輕輕跳動）"},{id:"6.1.4",text:"已經過的關卡和還沒到的關卡看起來不一樣（還沒到的比較暗）"}]},
    {title:"6.2　關卡小選單",note:"每個關卡名字旁可以叫出捷徑小選單。",items:[{id:"6.2.1",text:"滑鼠移到關卡名字附近，會跳出一個小選單（手機是用點的）"},{id:"6.2.2",text:"小選單裡有四個捷徑：齋、戒、日課、週課"},{id:"6.2.3",text:"點「齋」會關掉登山進度、帶你去「坐下靜坐」"},{id:"6.2.4",text:"點「戒」會帶你去「上品受誡臺」"},{id:"6.2.5",text:"點「日課」會帶你去凝輝殿的「唸誦經文」"},{id:"6.2.6",text:"點「週課」會打開「方寸澄心」"},{id:"6.2.7",text:"還沒解鎖的關卡，小選單不會跳出來、也點不動"}]},
    {title:"6.3　海拔高度與下載",items:[{id:"6.3.1",text:"滑鼠在畫面上移動時，右邊會跟著顯示「海拔高度」（用功德換算的）"},{id:"6.3.2",text:"有一個下載按鈕，點了會下載一張寫著你目前功德總數的圖"}]},
    {title:"6.4　關閉",items:[{id:"6.4.1",text:"在視窗外面點一下，會關掉、回到主院"}]},  ]},
  // ── 組 E：導覽與個人功能 + 整體順暢度 ──
  {id:"part7",title:"Part 7",subtitle:"導覽與個人功能",icon:"🧭",group:"E",description:"情境：請你在網站各處走走，試試右下角的導覽鈕、右上角的個人選單，還有一些零碎功能。",sections:[
    {title:"7.1　收納導覽（右下角）",note:"在清信院、凝輝殿等頁面，右下角有一顆浮動按鈕（葫蘆形狀）。",items:[{id:"7.1.1",text:"在清信院，右下角看得到那顆浮動按鈕"},{id:"7.1.2",text:"點它會往上展開一排捷徑圖示，葫蘆會變成金黃色"},{id:"7.1.3",text:"在清信院展開時，看得到「去凝輝殿、Discord、LINE」等捷徑"},{id:"7.1.4",text:"點「Discord / LINE」會另開新分頁"},{id:"7.1.5",text:"在凝輝殿展開時，捷徑會變成「去清信院…」（會依你在哪裡而不同）"},{id:"7.1.6",text:"首頁沒有這顆按鈕"}]},
    {title:"7.2　個人選單（右上角）",items:[{id:"7.2.1",text:"滑鼠移到右上角頭像（手機用點的），會展開個人選單"},{id:"7.2.2",text:"選單裡看得到頭像、姓名、Gmail、清信號、身份"},{id:"7.2.3",text:"可以修改個人資料（姓名、電話、生日、地址）"},{id:"7.2.4",text:"改完之後資料有更新"},{id:"7.2.5",text:"有「錯誤回報」連結，點了會開 Google 表單"},{id:"7.2.6",text:"有「版權說明與隱私政策」連結，點了會另開新分頁"},{id:"7.2.7",text:"有「登出」，點了會回到沒登入的狀態"}]},
    {title:"7.3　音樂與通知",items:[{id:"7.3.1",text:"剛進網站時是沒有聲音的（靜音）"},{id:"7.3.2",text:"點右上角音樂圖示後，背景音樂開始播放"},{id:"7.3.3",text:"再點一次會關掉音樂"},{id:"7.3.4",text:"關掉瀏覽器再回來，音樂的開／關會記得你上次的設定"},{id:"7.3.5",text:"右上角有一個小鳥圖示（通知中心），有通知時會有紅點"}]},
    {title:"7.4　版權頁",items:[{id:"7.4.1",text:"「版權說明與隱私政策」頁面打得開、文字看得清楚"}]},  ]},
  // ── 組 F：後台（只給後台測試員）──
  {id:"part8",title:"Part 8",subtitle:"後台管理",icon:"🔧",group:"F",description:"情境：你有後台帳號。請從後台網址登入，測試會員管理、年費等功能。後台是用 Email + 密碼登入，和前台的 Google 登入不一樣。",sections:[
    {title:"8.1　後台登入",items:[{id:"8.1.1",text:"打得開後台登入頁"},{id:"8.1.2",text:"用正確的 Email 和密碼可以登入成功"},{id:"8.1.3",text:"用不存在的 Email 會被擋下來"},{id:"8.1.4",text:"密碼打錯會有提示"},{id:"8.1.5",text:"登入後看得到左邊選單和主畫面"},{id:"8.1.6",text:"登出後會回到登入頁"}]},
    {title:"8.2　會員管理",items:[{id:"8.2.1",text:"看得到會員清單"},{id:"8.2.2",text:"可以用名字或清信號搜尋會員"},{id:"8.2.3",text:"點一個會員，看得到他的詳細資料"},{id:"8.2.4",text:"前台剛註冊的新會員，這裡找得到"},{id:"8.2.5",text:"可以新增 / 編輯會員資料"},{id:"8.2.6",text:"看得到會員的三千功（功德）紀錄"},{id:"8.2.7",text:"DC（初代清信）會員有正確標記"}]},
    {title:"8.3　身份標籤",items:[{id:"8.3.1",text:"會員的身份標籤正確（小道童／清信／清信弟子等）"},{id:"8.3.2",text:"可以手動調整會員的身份標籤"}]},
    {title:"8.4　升轉審核",note:"有些升轉（四轉、六轉、八轉、九轉）需要後台人工按通過。",items:[{id:"8.4.1",text:"看得到「需要我檢查／待審核」的清單"},{id:"8.4.2",text:"點一筆待審核，會跳出可以「通過／不通過」的視窗"},{id:"8.4.3",text:"按通過後，該會員的升轉狀態有更新"}]},
    {title:"8.5　年費列表",items:[{id:"8.5.1",text:"看得到年費繳納清單"},{id:"8.5.2",text:"看得到每個人的繳費狀態和到期日"},{id:"8.5.3",text:"可以篩選（例如只看未繳費的）"}]},
    {title:"8.6　匯入匯出",items:[{id:"8.6.1",text:"可以把會員資料匯出成 Excel"},{id:"8.6.2",text:"可以用 Excel 匯入會員資料"}]},  ]},
  // ── 組 Z：Phase 1 舊題庫（測試員看不到；管理員用「總通行碼」即可一起看到）──
  {id:"part9",title:"Part 9",subtitle:"（舊）第一次打開網站",icon:"🏔️",group:"Z",description:"【Phase 1 舊題】情境：你剛收到這個網站的連結，第一次打開它。",sections:[{title:"第一次打開網站（還沒登入）",items:[{id:"9.1",text:"網站打開後，有一個 Logo 動畫跑出來（寫著「正在匯聚靈氣」）"},{id:"9.2",text:"Logo 動畫出現時，動畫結束前不能點網站上任何東西"},{id:"9.3",text:"Logo 動畫結束後，看到首頁場景（三棟建築）"},{id:"9.4",text:"畫面順眼、文字清楚"},{id:"9.5",text:"滑鼠移動時畫面微微跟著動（電腦）；手指左右滑動時會動（手機）"},{id:"9.6",text:"看得出來哪幾棟建築可以點、「建築中」不能點"},{id:"9.7",text:"試著點建築，會跳出 Google 登入視窗或提示"},{id:"9.8",text:"右上角看得到「進入道場」圖示與「音樂」圖示"}]}]},
  {id:"part10",title:"Part 10",subtitle:"（舊）註冊 & 繳費",icon:"📝",group:"Z",description:"【Phase 1 舊題】⚠️ 請使用管理方提供的「測試信用卡號」，不會真的扣款。",sections:[
    {title:"10.1　Google 登入",items:[{id:"10.1.1",text:"點「進入道場」跳出 Google 登入視窗"},{id:"10.1.2",text:"選帳號授權後回到方壺山"},{id:"10.1.3",text:"看到歡迎信 + 註冊表單"},{id:"10.1.4",text:"取消授權 → 回未登入首頁"}]},
    {title:"10.2　註冊表單",note:"欄位：姓名、Email、電話、扶引碼/清信號、生日、時辰、地址",items:[{id:"10.2.1",text:"姓名自動帶入"},{id:"10.2.2",text:"Email 唯讀"},{id:"10.2.3",text:"必填/選填欄位清楚"},{id:"10.2.4",text:"時辰有「吉時」選項"},{id:"10.2.5",text:"必填留空有紅字提示"},{id:"10.2.6",text:"歡迎信可捲動"},{id:"10.2.7",text:"隱私政策連結新分頁"}]},
    {title:"10.3　扶引碼驗證",note:"一般新會員看到扶引碼，DC 名單看到清信號。",items:[{id:"10.3.1",text:"有效碼 → 綠勾"},{id:"10.3.2",text:"無效碼 → 紅字"},{id:"10.3.3",text:"格式錯誤被擋"},{id:"10.3.4",text:"驗證不過按鈕灰色"},{id:"10.3.5",text:"驗證過按鈕可按"}]},
    {title:"10.4　繳費",items:[{id:"10.4.1",text:"另開繳費頁"},{id:"10.4.2",text:"繳費成功進首頁"},{id:"10.4.3",text:"身份正確"}]},
    {title:"10.5　中斷繳費",note:"請故意關掉繳費視窗測試。",items:[{id:"10.5.1",text:"中斷 → 小鳥紅點"},{id:"10.5.2",text:"點小鳥 → 通知"},{id:"10.5.3",text:"通知 → 保留已填資料"},{id:"10.5.4",text:"可接續繳費"},{id:"10.5.5",text:"關瀏覽器重進 → 自動彈出"}]},
  ]},
  {id:"part11",title:"Part 11",subtitle:"（舊）登入後首頁",icon:"🏯",group:"Z",description:"【Phase 1 舊題】繳費完成，正式使用網站。",sections:[
    {title:"11.1　建築熱點",items:[{id:"11.1.1",text:"頭像取代進入道場圖示"},{id:"11.1.2",text:"滑鼠移到建築名會放大"},{id:"11.1.3",text:"點清信院有推進動畫"},{id:"11.1.4",text:"凝暉殿同上"},{id:"11.1.5",text:"動畫中不重複觸發"},{id:"11.1.6",text:"建築中不能點"}]},
    {title:"11.2　時段切換",note:"早上 05:00–16:00 / 黃昏 16:00–18:00 / 晚上 18:00–05:00",items:[{id:"11.2.1",text:"白天 = 早上場景"},{id:"11.2.2",text:"傍晚 = 黃昏場景"},{id:"11.2.3",text:"晚上 = 晚上場景"},{id:"11.2.4",text:"切換有淡入淡出"}]},
  ]},
  {id:"part12",title:"Part 12",subtitle:"（舊）個人設定與功能",icon:"⚙️",group:"Z",description:"【Phase 1 舊題】試試各種功能。",sections:[
    {title:"12.1　Logo",items:[{id:"12.1.1",text:"Logo 固定左上"},{id:"12.1.2",text:"點 Logo 回首頁"}]},
    {title:"12.2　個人選單",items:[{id:"12.2.1",text:"電腦滑鼠移過去展開"},{id:"12.2.2",text:"手機點擊展開"},{id:"12.2.3",text:"顯示頭像姓名等"},{id:"12.2.4",text:"可改個人資訊"},{id:"12.2.5",text:"改完同步更新"},{id:"12.2.6",text:"錯誤回報連結"},{id:"12.2.7",text:"版權隱私連結"},{id:"12.2.8",text:"登出按鈕"},{id:"12.2.9",text:"登出後真的登出"}]},
    {title:"12.3　清信弟子專屬（選填）",note:"非清信弟子可跳過。",items:[{id:"12.3.1",text:"看到扶引額度"},{id:"12.3.2",text:"看到邀請碼"},{id:"12.3.3",text:"複製邀請碼"},{id:"12.3.4",text:"非弟子不顯示"}]},
    {title:"12.4　音樂",items:[{id:"12.4.1",text:"預設靜音"},{id:"12.4.2",text:"點擊播放"},{id:"12.4.3",text:"再點靜音"},{id:"12.4.4",text:"偏好記憶"}]},
    {title:"12.5　通知中心",items:[{id:"12.5.1",text:"有通知有紅點"},{id:"12.5.2",text:"無通知無紅點"},{id:"12.5.3",text:"點開通知清單"},{id:"12.5.4",text:"點通知跳對應操作"}]},
    {title:"12.6　Footer",items:[{id:"12.6.1",text:"版權文字正確"}]},
    {title:"12.7　圖片保護",items:[{id:"12.7.1",text:"右鍵被阻擋"},{id:"12.7.2",text:"拖曳無效"}]},
  ]},
  {id:"part13",title:"Part 13",subtitle:"（舊）不同裝置檢查",icon:"📱",group:"Z",description:"【Phase 1 舊題】至少用一種裝置測試。",sections:[
    {title:"13.1　電腦版",items:[{id:"13.1.1",text:"頂部排列正確"},{id:"13.1.2",text:"滑鼠視差"},{id:"13.1.3",text:"滑鼠移過去 + 點擊"},{id:"13.1.4",text:"歡迎信左右捲"}]},
    {title:"13.2　手機版",items:[{id:"13.2.1",text:"頂部排列正確"},{id:"13.2.2",text:"手指視差"},{id:"13.2.3",text:"直接點擊觸發"},{id:"13.2.4",text:"觸擊區域適當"},{id:"13.2.5",text:"歡迎信上下捲"},{id:"13.2.6",text:"表單不裁切"}]},
    {title:"13.3　瀏覽器相容",items:[{id:"13.3.1",text:"Chrome 電腦"},{id:"13.3.2",text:"Safari"},{id:"13.3.3",text:"Edge"},{id:"13.3.4",text:"Firefox"},{id:"13.3.5",text:"Chrome Android"}]},
  ]},
  {id:"part14",title:"Part 14",subtitle:"（舊）身份情境",icon:"👤",group:"Z",description:"【Phase 1 舊題】需要不同身份的測試帳號。沒有可跳過。",sections:[{title:"身份情境測試",items:[{id:"14.1",text:"訪客 → 熱點暗"},{id:"14.2",text:"訪客點 → 登入視窗"},{id:"14.3",text:"未繳費 → 尚未解鎖"},{id:"14.4",text:"年費過期 → 尚未續費"},{id:"14.5",text:"小道童 → 凝暉殿可進"},{id:"14.6",text:"小道童 → 問童子圖示"},{id:"14.7",text:"清信 → 全功能"},{id:"14.8",text:"清信DC → 全功能"},{id:"14.9",text:"清信弟子 → 扶引欄位"},{id:"14.10",text:"過期 → 只顯示續費彈窗"}]}]},
  {id:"part15",title:"Part 15",subtitle:"（舊）後台網站體驗",icon:"🔧",group:"Z",description:"【Phase 1 舊題】需要有後台帳號才能測。",sections:[
    {title:"15.1　後台登入",note:"後台是 Email + 密碼，跟前台 Google 登入不同。",items:[{id:"15.1.1",text:"看到後台登入頁"},{id:"15.1.2",text:"正確帳密登入成功"},{id:"15.1.3",text:"不存在 Email 被擋"},{id:"15.1.4",text:"密碼錯誤"},{id:"15.1.5",text:"密碼格式不符"},{id:"15.1.6",text:"無 Google 登入"},{id:"15.1.7",text:"登出回登入頁"}]},
    {title:"15.2　會員管理",note:"確認前台會員在後台看得到。",items:[{id:"15.2.1",text:"前台新會員出現"},{id:"15.2.2",text:"詳細資料完整"},{id:"15.2.3",text:"DC 標記正確"},{id:"15.2.4",text:"前台改後台同步"}]},
  ]},
  {id:"part16",title:"Part 16",subtitle:"（舊）整體感受",icon:"✨",group:"Z",description:"【Phase 1 舊題】用直覺評價整體體驗。",sections:[
    {title:"16.1　好看嗎",scale:"like",items:[{id:"16.1.1",text:"整體氛圍"},{id:"16.1.2",text:"文字配色"},{id:"16.1.3",text:"動畫效果"},{id:"16.1.4",text:"美術風格"},{id:"16.1.5",text:"圖示設計"}]},
    {title:"16.2　順暢嗎",scale:"speed",items:[{id:"16.2.1",text:"開站速度"},{id:"16.2.2",text:"動畫流暢"},{id:"16.2.3",text:"切換流暢"},{id:"16.2.4",text:"手機順暢"},{id:"16.2.5",text:"表單無延遲"}]},
    {title:"16.3　好用嗎",scale:"easy",items:[{id:"16.3.1",text:"知道該做什麼"},{id:"16.3.2",text:"步驟清楚"},{id:"16.3.3",text:"功能找得到"},{id:"16.3.4",text:"專有名詞懂"},{id:"16.3.5",text:"錯誤訊息懂"}]},
  ]},
];

// ── Storage ─────────────────────────────────────────────────
const safeId = s => s.replace(/[.#$[\]]/g, '_');
const parseVal = r => { if (!r) return null; return typeof r === 'string' ? JSON.parse(r) : r; };

// 把圖片壓成 WebP（不夠舊瀏覽器則回退 JPEG）— 寬 600、品質 0.7
function compressToDataUrl(file, maxW = 600, quality = 0.70) {
  return new Promise(resolve => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxW / img.width);
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      const webp = canvas.toDataURL('image/webp', quality);
      resolve(webp.startsWith('data:image/webp') ? webp : canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
    img.src = url;
  });
}
async function loadQ()        { return parseVal(await dbGet('kv/questions')); }
async function saveQ(d)       { return await dbSet('kv/questions', JSON.stringify(d)); }
async function loadPasscode() { return await dbGet('kv/passcode'); }
async function savePasscode(v){ if(!v||!v.trim()) return await dbDel('kv/passcode'); return await dbSet('kv/passcode', v.trim()); }
async function loadFormStatus() { return parseVal(await dbGet('kv/formStatus')); }
async function saveFormStatus(s) { return await dbSet('kv/formStatus', JSON.stringify(s)); }
async function loadGroupCodes() { return parseVal(await dbGet('kv/groupCodes')); }
async function saveGroupCodes(obj){ const clean={}; Object.entries(obj||{}).forEach(([g,c])=>{ if(c&&String(c).trim()) clean[g]=String(c).trim(); }); if(Object.keys(clean).length===0) return await dbDel('kv/groupCodes'); return await dbSet('kv/groupCodes', JSON.stringify(clean)); }
async function loadAllUsers() { const data=await dbGet('kv/feedbacks'); if(!data) return []; return Object.values(data).map(parseVal); }

const TOTAL=(parts)=>parts.reduce((t,p)=>t+p.sections.reduce((s,sec)=>s+sec.items.length,0),0);
// 依測試員的組別 + 裝置計算他「應該完成的題數」（沒有組別就用全部）
// device：電腦→desktop，手機/平板→mobile；題目沒標 device 或標 both 兩種都算
const USER_TOTAL=(parts,total,u)=>{
  if(!u) return total;
  const dt = u.device==='電腦' ? 'desktop' : (u.device ? 'mobile' : null);
  const gp = parts.filter(p =>
    (!u.group || p.group===u.group) &&
    (!dt || !p.device || p.device==='both' || p.device===dt)
  );
  const n = TOTAL(gp);
  return n || total;
};
// 把秒數轉成「X 分 Y 秒」；沒有資料(舊紀錄)回傳 null
const fmtDur=(s)=>{ if(s==null||s<0) return null; const m=Math.floor(s/60), sec=Math.round(s%60); return m>0?`${m} 分 ${sec} 秒`:`${sec} 秒`; };
function findItemText(parts,id){for(const p of parts)for(const s of p.sections)for(const i of s.items)if(i.id===id)return i.text;return id;}
function findPart(parts,id){for(const p of parts)for(const s of p.sections)for(const i of s.items)if(i.id===id)return p;return null;}
function Ring({progress,size=40,stroke=3.5}){const r=(size-stroke)/2,c=2*Math.PI*r;return(<svg width={size} height={size} style={{transform:"rotate(-90deg)"}}><circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(0,0,0,.08)" strokeWidth={stroke}/><circle cx={size/2} cy={size/2} r={r} fill="none" stroke={progress>=1?"#6B8E4E":"#8B5A2B"} strokeWidth={stroke} strokeDasharray={c} strokeDashoffset={c*(1-progress)} strokeLinecap="round" style={{transition:"stroke-dashoffset .4s"}}/></svg>);}

// 圖片放大燈箱：點縮圖 → 全螢幕放大，可下載、按 Esc 或點背景關閉
function ImgLightbox({ src, onClose }) {
  useEffect(() => {
    const onKey = e => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(20,12,4,.88)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, cursor: "zoom-out" }}>
      <img src={src} alt="" onClick={e => e.stopPropagation()} style={{ maxWidth: "94vw", maxHeight: "88vh", objectFit: "contain", borderRadius: 10, boxShadow: "0 12px 60px rgba(0,0,0,.6)", cursor: "default" }} />
      <div style={{ position: "fixed", top: 18, right: 22, display: "flex", gap: 10 }} onClick={e => e.stopPropagation()}>
        <a href={src} download={`feedback-${Date.now()}.png`} style={{ padding: "9px 18px", borderRadius: 10, background: "rgba(255,255,255,.95)", color: "#5B3A1F", fontSize: 14, fontWeight: 700, textDecoration: "none" }}>⬇ 下載</a>
        <button onClick={onClose} style={{ padding: "9px 16px", borderRadius: 10, background: "rgba(255,255,255,.95)", color: "#5B3A1F", border: "none", cursor: "pointer", fontSize: 16, fontWeight: 700 }}>✕</button>
      </div>
    </div>
  );
}

// ── Passcode Settings ───────────────────────────────────────
function PasscodeSettings() {
  const [code, setCode] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => { loadPasscode().then(c => { setCode(c || ""); setLoaded(true); }); }, []);

  const handleSave = async () => {
    setSaving(true);
    const ok = await savePasscode(code.trim());
    setSaving(false);
    setMsg(ok ? (code.trim() ? "✓ 通行碼已更新，即時生效" : "✓ 通行碼已清除，任何人都可進入") : "儲存失敗");
    setTimeout(() => setMsg(""), 3000);
  };

  const handleClear = async () => {
    setCode("");
    setSaving(true);
    // 刪除 passcode key
    await dbDel('kv/passcode');
    setSaving(false);
    setMsg("✓ 通行碼已清除，測試回饋系統改為開放進入");
    setTimeout(() => setMsg(""), 3000);
  };

  if (!loaded) return null;

  return (
    <div style={{ padding: "18px 20px", borderRadius: 14, background: "rgba(255,255,255,.8)", border: "1px solid rgba(0,0,0,.06)", marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 18 }}>🔑</span>
        <h3 style={{ margin: 0, fontSize: 15, color: "#5B3A1F" }}>通行碼設定</h3>
      </div>
      <p style={{ margin: "0 0 12px", fontSize: 12.5, color: "#9a8a6e", lineHeight: 1.6 }}>
        設定後，測試者必須輸入通行碼才能進入回饋系統。<br />
        留空或清除 = 任何人都可進入。更改後即時生效，已經在填的人不受影響。
      </p>
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <input value={code} onChange={e => setCode(e.target.value)} placeholder="輸入通行碼（留空 = 開放）"
          style={{ flex: 1, minWidth: 200, padding: "9px 14px", borderRadius: 10, border: "1px solid rgba(0,0,0,.12)", fontSize: 14, fontFamily: "monospace", letterSpacing: 1, background: "rgba(255,255,255,.8)", boxSizing: "border-box", outline: "none" }} />
        <button onClick={handleSave} disabled={saving} style={{ padding: "9px 18px", borderRadius: 10, background: "#8B5A2B", color: "#fff", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
          {saving ? "儲存中..." : "💾 儲存"}
        </button>
        {code && <button onClick={handleClear} style={{ padding: "9px 14px", borderRadius: 10, background: "rgba(196,80,40,.1)", color: "#c44028", border: "none", cursor: "pointer", fontSize: 13 }}>清除</button>}
      </div>
      {msg && <p style={{ margin: "8px 0 0", fontSize: 12, color: msg.includes("失敗") ? "#c44028" : "#6B8E4E", fontWeight: 600 }}>{msg}</p>}
      <div style={{ marginTop: 10, padding: "8px 12px", borderRadius: 8, background: code.trim() ? "rgba(107,142,78,.08)" : "rgba(196,144,0,.08)", border: `1px solid ${code.trim() ? "rgba(107,142,78,.15)" : "rgba(196,144,0,.15)"}` }}>
        <span style={{ fontSize: 12, color: code.trim() ? "#6B8E4E" : "#c49000" }}>
          {code.trim() ? `🔒 目前狀態：需要通行碼「${code.trim()}」才能進入` : "🔓 目前狀態：開放進入（任何人都可填寫）"}
        </span>
      </div>
    </div>
  );
}

// 管理員針對單一題目回覆測試員（測試員下次回來會看到）
function ReplyBox({ value, images, onSave }) {
  const [draft, setDraft] = useState(value || "");
  const [imgs, setImgs] = useState(images || []);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  useEffect(() => { setDraft(value || ""); setImgs(images || []); }, [value, images]);

  const handleUpload = async e => {
    const files = Array.from(e.target.files).slice(0, 2 - imgs.length);
    if (!files.length) return;
    e.target.value = '';
    setUploading(true); setSaved(false);
    const dus = [];
    for (const f of files) {
      const du = await compressToDataUrl(f);
      if (du) dus.push(du);
    }
    setImgs([...imgs, ...dus]);
    setUploading(false);
  };
  const removeImg = idx => { setImgs(imgs.filter((_, i) => i !== idx)); setSaved(false); };

  return (
    <div style={{ marginTop: 10, padding: "10px 12px", borderRadius: 8, background: "rgba(107,142,78,.06)", border: "1px solid rgba(107,142,78,.2)" }}>
      <div style={{ fontSize: 11.5, fontWeight: 700, color: "#5a8a3c", marginBottom: 6 }}>📣 回覆測試員（他下次回來會看到）</div>
      <textarea value={draft} onChange={e => { setDraft(e.target.value); setSaved(false); }} placeholder="例：已修正 / 設計如此 / 下版會改…" style={{ width: "100%", padding: 8, borderRadius: 6, fontSize: 13, border: "1px solid rgba(0,0,0,.12)", minHeight: 48, resize: "vertical", fontFamily: "inherit", lineHeight: 1.5, boxSizing: "border-box", outline: "none", background: "rgba(255,255,255,.85)" }} />
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
        {imgs.map((url, i) => (
          <div key={i} style={{ position: "relative" }}>
            <img src={url} alt="" style={{ width: 64, height: 48, objectFit: "cover", borderRadius: 5, border: "1px solid rgba(0,0,0,.1)", display: "block" }} />
            <button onClick={() => removeImg(i)} style={{ position: "absolute", top: -6, right: -6, width: 18, height: 18, borderRadius: 9, background: "#c44028", border: "none", color: "#fff", fontSize: 11, cursor: "pointer", lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}>×</button>
          </div>
        ))}
        {imgs.length < 2 && (
          <label style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "5px 10px", borderRadius: 6, border: "1px dashed rgba(0,0,0,.18)", cursor: "pointer", fontSize: 12, color: "#5a8a3c", background: "rgba(255,255,255,.5)" }}>
            {uploading ? "上傳中..." : "📷 附截圖"}
            <input type="file" accept="image/*" multiple onChange={handleUpload} style={{ display: "none" }} disabled={uploading} />
          </label>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
        <button onClick={async () => { await onSave(draft.trim(), imgs); setSaved(true); setTimeout(() => setSaved(false), 2000); }} style={{ padding: "5px 14px", borderRadius: 8, background: "#6B8E4E", color: "#fff", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>儲存回覆</button>
        {saved && <span style={{ fontSize: 12, color: "#6B8E4E" }}>✓ 已儲存</span>}
      </div>
    </div>
  );
}

// ── Form Open/Close Settings ────────────────────────────────
function FormStatusSettings() {
  const [open, setOpen] = useState(true);
  const [deadline, setDeadline] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  useEffect(() => { loadFormStatus().then(s => { if (s) { setOpen(s.open !== false); setDeadline(s.deadline || ""); } setLoaded(true); }); }, []);
  if (!loaded) return null;
  const effClosed = !open || (deadline && Date.now() >= new Date(deadline).getTime());
  const save = async () => { setSaving(true); const ok = await saveFormStatus({ open, deadline: deadline || null }); setSaving(false); setMsg(ok ? "✓ 已更新，即時生效" : "儲存失敗"); setTimeout(() => setMsg(""), 3000); };
  const tBtn = (active, color) => ({ padding: "7px 18px", borderRadius: 10, border: `2px solid ${active ? color : "rgba(0,0,0,.12)"}`, background: active ? color : "transparent", color: active ? "#fff" : "#6b5830", cursor: "pointer", fontSize: 13, fontWeight: 600 });
  return (
    <div style={{ padding: "18px 20px", borderRadius: 14, background: "rgba(255,255,255,.8)", border: "1px solid rgba(0,0,0,.06)", marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}><span style={{ fontSize: 18 }}>🕐</span><h3 style={{ margin: 0, fontSize: 15, color: "#5B3A1F" }}>填寫開放狀態</h3></div>
      <p style={{ margin: "0 0 12px", fontSize: 12.5, color: "#9a8a6e", lineHeight: 1.6 }}>關閉後，測試員「不能再填寫或送出」，但仍可進來看你的回覆。設了截止時間，時間一到會自動關閉。</p>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        <span style={{ fontSize: 13, color: "#6B4E2E", fontWeight: 600 }}>開放填寫：</span>
        <button onClick={() => setOpen(true)} style={tBtn(open, "#6B8E4E")}>🟢 開放</button>
        <button onClick={() => setOpen(false)} style={tBtn(!open, "#c44028")}>🔴 關閉</button>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        <span style={{ fontSize: 13, color: "#6B4E2E", fontWeight: 600 }}>截止時間（選填）：</span>
        <input type="datetime-local" value={deadline} onChange={e => setDeadline(e.target.value)} style={{ padding: "7px 10px", borderRadius: 8, border: "1px solid rgba(0,0,0,.12)", fontSize: 13, fontFamily: "inherit", outline: "none", background: "rgba(255,255,255,.85)" }} />
        {deadline && <button onClick={() => setDeadline("")} style={{ padding: "6px 12px", borderRadius: 8, background: "rgba(196,80,40,.1)", color: "#c44028", border: "none", cursor: "pointer", fontSize: 12 }}>清除</button>}
      </div>
      <div style={{ padding: "8px 12px", borderRadius: 8, background: effClosed ? "rgba(196,80,40,.08)" : "rgba(107,142,78,.08)", border: `1px solid ${effClosed ? "rgba(196,80,40,.15)" : "rgba(107,142,78,.15)"}`, marginBottom: 12 }}>
        <span style={{ fontSize: 12.5, color: effClosed ? "#c44028" : "#6B8E4E", fontWeight: 600 }}>
          {effClosed ? "🔴 目前：已關閉，測試員無法填寫" : `🟢 目前：開放中${deadline ? `，${new Date(deadline).toLocaleString("zh-TW")} 自動關閉` : ""}`}
        </span>
      </div>
      <button onClick={save} disabled={saving} style={{ padding: "9px 18px", borderRadius: 10, background: "#8B5A2B", color: "#fff", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>{saving ? "儲存中..." : "💾 儲存"}</button>
      {msg && <span style={{ marginLeft: 10, fontSize: 12, color: msg.includes("失敗") ? "#c44028" : "#6B8E4E", fontWeight: 600 }}>{msg}</span>}
    </div>
  );
}

// ── Group Code Settings ─────────────────────────────────────
function GroupCodeSettings({ parts }) {
  const [codes, setCodes] = useState({});
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  // 從題目抓出所有出現過的組別，並列出每組包含哪些 Part
  const groups = {};
  (parts || []).forEach(p => {
    if (!p.group) return;
    if (!groups[p.group]) groups[p.group] = [];
    groups[p.group].push(p.subtitle);
  });
  const groupKeys = Object.keys(groups).sort();

  useEffect(() => { loadGroupCodes().then(c => { setCodes(c || {}); setLoaded(true); }); }, []);

  const handleSave = async () => {
    setSaving(true);
    const ok = await saveGroupCodes(codes);
    setSaving(false);
    setMsg(ok ? "✓ 組別通行碼已更新，即時生效" : "儲存失敗");
    setTimeout(() => setMsg(""), 3000);
  };

  if (!loaded) return null;

  return (
    <div style={{ padding: "18px 20px", borderRadius: 14, background: "rgba(255,255,255,.8)", border: "1px solid rgba(0,0,0,.06)", marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 18 }}>👥</span>
        <h3 style={{ margin: 0, fontSize: 15, color: "#5B3A1F" }}>組別通行碼（每位測試員只看到自己的關卡）</h3>
      </div>
      <p style={{ margin: "0 0 12px", fontSize: 12.5, color: "#9a8a6e", lineHeight: 1.6 }}>
        幫每個「組別」設一組專屬通行碼，測試員輸入後「只會看到」標記為該組的 Part，看不到別組的題目。<br />
        組別是在下方每個 Part 的「組別」欄位設定的（例如填 A、B、C）。上方「總通行碼」可看到全部，留給你自己預覽用。
      </p>
      {groupKeys.length === 0 ? (
        <div style={{ padding: "10px 14px", borderRadius: 8, background: "rgba(196,144,0,.08)", border: "1px solid rgba(196,144,0,.15)", fontSize: 12.5, color: "#c49000" }}>
          目前題目還沒有設定任何組別。請先到下方每個 Part 填寫「組別」欄位（例如 A、B、C），這裡才會出現對應的通行碼設定。
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {groupKeys.map(g => (
            <div key={g} style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", padding: "10px 12px", borderRadius: 10, background: "rgba(0,0,0,.02)", border: "1px solid rgba(0,0,0,.05)" }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#8B5A2B", minWidth: 60 }}>組 {g}</span>
              <div style={{ flex: 1, minWidth: 180, fontSize: 11.5, color: "#9a8a6e" }}>{groups[g].join("、")}</div>
              <input value={codes[g] || ""} onChange={e => setCodes({ ...codes, [g]: e.target.value })} placeholder={`組 ${g} 的通行碼`}
                style={{ width: 200, padding: "8px 12px", borderRadius: 8, border: "1px solid rgba(0,0,0,.12)", fontSize: 13, fontFamily: "monospace", letterSpacing: 1, background: "rgba(255,255,255,.8)", outline: "none" }} />
            </div>
          ))}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button onClick={handleSave} disabled={saving} style={{ padding: "9px 18px", borderRadius: 10, background: "#8B5A2B", color: "#fff", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
              {saving ? "儲存中..." : "💾 儲存組別通行碼"}
            </button>
            {msg && <span style={{ fontSize: 12, color: msg.includes("失敗") ? "#c44028" : "#6B8E4E", fontWeight: 600 }}>{msg}</span>}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Question Editor ─────────────────────────────────────────
function QuestionEditor({parts, onSave}) {
  const [data, setData] = useState(JSON.parse(JSON.stringify(parts)));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [expandedPart, setExpandedPart] = useState(null);
  const [expandedSec, setExpandedSec] = useState(null);
  const dragRef = useRef({ from: null, over: null });

  const handleDragStart = (pi, si, ii) => { dragRef.current.from = { pi, si, ii }; };
  const handleDragOver = (e, ii) => { e.preventDefault(); dragRef.current.over = ii; };
  const handleDrop = (pi, si) => {
    const { from, over } = dragRef.current;
    if (!from || over === null || from.ii === over || from.pi !== pi || from.si !== si) return;
    const d = JSON.parse(JSON.stringify(data));
    const items = d[pi].sections[si].items;
    const [moved] = items.splice(from.ii, 1);
    items.splice(over, 0, moved);
    const prefix = items[0]?.id.split('.').slice(0, -1).join('.');
    items.forEach((item, idx) => { item.id = prefix ? `${prefix}.${idx + 1}` : `${idx + 1}`; });
    setData(d);
    dragRef.current = { from: null, over: null };
  };

  const handleSave = async () => { setSaving(true); const ok = await saveQ(data); setSaving(false); if (ok) { setSaved(true); onSave(data); setTimeout(() => setSaved(false), 2000); } };

  const updatePart = (pi, field, val) => { const d = [...data]; d[pi] = { ...d[pi], [field]: val }; setData(d); };
  const updateSection = (pi, si, field, val) => { const d = JSON.parse(JSON.stringify(data)); d[pi].sections[si][field] = val; setData(d); };
  const updateItem = (pi, si, ii, field, val) => { const d = JSON.parse(JSON.stringify(data)); d[pi].sections[si].items[ii][field] = val; setData(d); };
  const addItem = (pi, si) => { const d = JSON.parse(JSON.stringify(data)); const sec = d[pi].sections[si]; const lastId = sec.items.length > 0 ? sec.items[sec.items.length - 1].id : `${pi + 1}.${si + 1}.0`; const pts = lastId.split('.'); const next = parseInt(pts[pts.length - 1] || 0) + 1; pts[pts.length - 1] = next; sec.items.push({ id: pts.join('.'), text: "" }); setData(d); };
  const removeItem = (pi, si, ii) => { const d = JSON.parse(JSON.stringify(data)); d[pi].sections[si].items.splice(ii, 1); setData(d); };
  const addSection = (pi) => { const d = JSON.parse(JSON.stringify(data)); d[pi].sections.push({ title: "新段落", items: [] }); setData(d); };
  const removeSection = (pi, si) => { const d = JSON.parse(JSON.stringify(data)); d[pi].sections.splice(si, 1); setData(d); };
  const addPart = () => { setData([...data, { id: `part${data.length + 1}`, title: `Part ${data.length + 1}`, subtitle: "新分頁", icon: "📋", group: "", description: "", sections: [{ title: "新段落", items: [] }] }]); };
  const renumberParts = (d) => {
    d.forEach((part, idx) => {
      const newNum = idx + 1;
      const prevNum = parseInt(part.id.replace('part', ''));
      if (prevNum !== newNum) {
        part.id = `part${newNum}`;
        part.title = `Part ${newNum}`;
        part.sections.forEach(sec => {
          sec.items.forEach(item => {
            if (item.id.startsWith(`${prevNum}.`)) {
              item.id = item.id.replace(`${prevNum}.`, `${newNum}.`);
            }
          });
        });
      }
    });
    return d;
  };
  const removePart = (pi) => { const d = JSON.parse(JSON.stringify(data)); d.splice(pi, 1); setData(renumberParts(d)); };
  const movePart = (pi, dir) => { const d = JSON.parse(JSON.stringify(data)); const ni = pi + dir; if (ni < 0 || ni >= d.length) return; [d[pi], d[ni]] = [d[ni], d[pi]]; setData(renumberParts(d)); };

  const inp = { width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid rgba(0,0,0,.1)", fontSize: 13, fontFamily: "inherit", boxSizing: "border-box", outline: "none", background: "rgba(255,255,255,.8)" };
  const btn = (bg, c) => ({ padding: "6px 12px", borderRadius: 8, border: "none", background: bg, color: c, cursor: "pointer", fontSize: 12, fontWeight: 600 });

  return (<div>
    {/* Form Open/Close */}
    <FormStatusSettings />

    {/* Passcode Settings */}
    <PasscodeSettings />

    {/* Group Code Settings */}
    <GroupCodeSettings parts={data} />

    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
      <div><h2 style={{ margin: 0, fontSize: 18, color: "#5B3A1F" }}>📝 編輯測試題目</h2><p style={{ margin: "4px 0 0", fontSize: 12, color: "#9a8a6e" }}>共 {TOTAL(data)} 題 · {data.length} 個 Part</p></div>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        {saved && <span style={{ fontSize: 12, color: "#6B8E4E" }}>✓ 已儲存</span>}
        <button onClick={() => { if (window.confirm("載入 Phase 2（清信院）預設題目？\n這會覆蓋目前編輯區的內容。\n按下後還要再按「儲存題目」才會真正存檔。")) setData(JSON.parse(JSON.stringify(DEFAULT_PARTS))); }} style={btn("rgba(139,90,43,.12)", "#8B5A2B")}>↻ 載入預設(Phase2)</button>
        <button onClick={addPart} style={btn("rgba(107,142,78,.15)", "#6B8E4E")}>+ 新增 Part</button>
        <button onClick={handleSave} disabled={saving} style={btn("#8B5A2B", "#fff")}>{saving ? "儲存中..." : "💾 儲存題目"}</button>
      </div>
    </div>
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {data.map((part, pi) => {
        const isExp = expandedPart === pi;
        return (<div key={pi} style={{ borderRadius: 14, background: "rgba(255,255,255,.75)", border: "1px solid rgba(0,0,0,.06)", overflow: "hidden" }}>
          <div onClick={() => setExpandedPart(isExp ? null : pi)} style={{ padding: "14px 18px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, background: isExp ? "rgba(139,90,43,.06)" : "transparent" }}>
            <span style={{ fontSize: 20 }}>{part.icon}</span>
            <div style={{ flex: 1 }}><span style={{ fontSize: 14, fontWeight: 600, color: "#5B3A1F" }}>{part.subtitle}</span>{part.group && <span style={{ fontSize: 11, color: "#fff", background: "#8B5A2B", padding: "1px 8px", borderRadius: 10, marginLeft: 8, fontWeight: 700 }}>組 {part.group}</span>}<span style={{ fontSize: 11, color: "#a09880", marginLeft: 8 }}>{part.sections.reduce((t, s) => t + s.items.length, 0)} 題</span></div>
            <div style={{ display: "flex", gap: 4 }}>
              <button onClick={e => { e.stopPropagation(); movePart(pi, -1); }} disabled={pi === 0} style={{ ...btn("rgba(0,0,0,.05)", "#6b5830"), opacity: pi === 0 ? .3 : 1 }}>↑</button>
              <button onClick={e => { e.stopPropagation(); movePart(pi, 1); }} disabled={pi === data.length - 1} style={{ ...btn("rgba(0,0,0,.05)", "#6b5830"), opacity: pi === data.length - 1 ? .3 : 1 }}>↓</button>
              <button onClick={e => { e.stopPropagation(); if (confirm(`刪除 ${part.title}？`)) removePart(pi); }} style={btn("rgba(196,80,40,.1)", "#c44028")}>✕</button>
            </div>
            <span style={{ fontSize: 14, color: "#a09880" }}>{isExp ? "▾" : "▸"}</span>
          </div>
          {isExp && (<div style={{ padding: "0 18px 18px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 110px 80px 140px", gap: 8, marginBottom: 12 }}>
              <div><label style={{ fontSize: 11, color: "#9a8a6e" }}>副標題</label><input value={part.subtitle} onChange={e => updatePart(pi, "subtitle", e.target.value)} style={inp} /></div>
              <div><label style={{ fontSize: 11, color: "#9a8a6e" }}>組別（分流用）</label><input value={part.group || ""} onChange={e => updatePart(pi, "group", e.target.value.trim() || undefined)} style={inp} placeholder="如 A / B" /></div>
              <div><label style={{ fontSize: 11, color: "#9a8a6e" }}>圖示</label><input value={part.icon} onChange={e => updatePart(pi, "icon", e.target.value)} style={{ ...inp, width: 80 }} /></div>
              <div><label style={{ fontSize: 11, color: "#9a8a6e" }}>顯示裝置</label><select value={part.device||"both"} onChange={e=>updatePart(pi,"device",e.target.value)} style={{...inp,cursor:"pointer"}}><option value="both">📱💻 全裝置</option><option value="desktop">💻 桌機專用</option><option value="mobile">📱 手機專用</option></select></div>
            </div>
            <div style={{ marginBottom: 12 }}><label style={{ fontSize: 11, color: "#9a8a6e" }}>情境說明</label><textarea value={part.description || ""} onChange={e => updatePart(pi, "description", e.target.value)} style={{ ...inp, minHeight: 50, resize: "vertical" }} /></div>
            {part.sections.map((sec, si) => {
              const sk = `${pi}-${si}`; const se = expandedSec === sk;
              return (<div key={si} style={{ marginBottom: 10, borderRadius: 10, border: "1px solid rgba(0,0,0,.06)", background: "rgba(0,0,0,.015)" }}>
                <div onClick={() => setExpandedSec(se ? null : sk)} style={{ padding: "10px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#6B4E2E", flex: 1 }}>{sec.title} <span style={{ fontWeight: 400, color: "#a09880" }}>({sec.items.length})</span></span>
                  <button onClick={e => { e.stopPropagation(); if (confirm("刪除此段落？")) removeSection(pi, si); }} style={btn("rgba(196,80,40,.08)", "#c44028")}>✕</button>
                  <span style={{ fontSize: 12, color: "#a09880" }}>{se ? "▾" : "▸"}</span>
                </div>
                {se && (<div style={{ padding: "0 14px 14px" }}>
                  <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                    <div style={{ flex: 1 }}><label style={{ fontSize: 11, color: "#9a8a6e" }}>段落標題</label><input value={sec.title} onChange={e => updateSection(pi, si, "title", e.target.value)} style={inp} /></div>
                    <div style={{ flex: 1 }}><label style={{ fontSize: 11, color: "#9a8a6e" }}>評分量表</label><select value={sec.scale || "default"} onChange={e => updateSection(pi, si, "scale", e.target.value === "default" ? undefined : e.target.value)} style={{ ...inp, cursor: "pointer" }}><option value="default">通過 / 不確定 / 不通過</option><option value="like">很好 / 還行 / 怪怪的</option><option value="speed">很順 / 普通 / 有點卡</option><option value="easy">很直覺 / 還 OK / 卡住</option></select></div>
                  </div>
                  <div style={{ marginBottom: 8 }}><label style={{ fontSize: 11, color: "#9a8a6e" }}>備註（選填）</label><input value={sec.note || ""} onChange={e => updateSection(pi, si, "note", e.target.value || undefined)} style={inp} placeholder="給測試者看的補充說明" /></div>
                  {sec.items.map((item, ii) => (
                    <div key={ii} draggable
                      onDragStart={() => handleDragStart(pi, si, ii)}
                      onDragOver={(e) => handleDragOver(e, ii)}
                      onDrop={() => handleDrop(pi, si)}
                      onDragEnd={() => { dragRef.current = { from: null, over: null }; }}
                      style={{ display: "flex", gap: 6, marginBottom: 6, alignItems: "center" }}>
                      <span style={{ cursor: "grab", color: "#c0b8a8", fontSize: 15, userSelect: "none", padding: "0 2px" }}>⠿</span>
                      <input value={item.id} onChange={e => updateItem(pi, si, ii, "id", e.target.value)} style={{ ...inp, width: 60, textAlign: "center", fontFamily: "monospace", fontSize: 12 }} />
                      <input value={item.text} onChange={e => updateItem(pi, si, ii, "text", e.target.value)} style={{ ...inp, flex: 1 }} placeholder="題目內容" />
                      <button onClick={() => removeItem(pi, si, ii)} style={{ ...btn("rgba(196,80,40,.08)", "#c44028"), padding: "4px 8px" }}>✕</button>
                    </div>
                  ))}
                  <button onClick={() => addItem(pi, si)} style={btn("rgba(107,142,78,.1)", "#6B8E4E")}>+ 新增題目</button>
                </div>)}
              </div>);
            })}
            <button onClick={() => addSection(pi)} style={{ ...btn("rgba(107,142,78,.1)", "#6B8E4E"), marginTop: 4 }}>+ 新增段落</button>
          </div>)}
        </div>);
      })}
    </div>
  </div>);
}

// ── Overview ────────────────────────────────────────────────
function Overview({ users, parts, onDelete, onZoom, onReply, onReplyFreeform }) {
  const [sel, setSel] = useState(null); const [showAll, setShowAll] = useState(false); const total = TOTAL(parts);
  const getP = u => { if (!u?.answers) return { done: 0, pct: 0 }; const d = Object.values(u.answers).filter(a => a?.status).length; return { done: d, pct: d / (USER_TOTAL(parts, total, u) || 1) }; };
  // 依清信號統計裝置涵蓋（電腦 / 手機平板 必須「全部作答完」才算測過）
  // 組F 只有桌機版（後台無 RWD），這種組別 mobile 視為 N/A
  const groupsWithMobile = new Set(parts.filter(p => p.device === 'mobile' || p.device === 'both' || !p.device).map(p => p.group).filter(Boolean));
  const cov = {}; users.forEach(u => {
    if (!u?.nickname) return;
    if (!cov[u.nickname]) cov[u.nickname] = { pc: false, mobile: false, needsMobile: false };
    if (u.group && groupsWithMobile.has(u.group)) cov[u.nickname].needsMobile = true;
    const need = USER_TOTAL(parts, total, u);
    const done = u.answers ? Object.values(u.answers).filter(a => a?.status).length : 0;
    if (need <= 0 || done < need) return;
    if (u.device === "電腦") cov[u.nickname].pc = true;
    else if (u.device === "手機" || u.device === "平板") cov[u.nickname].mobile = true;
  });
  return (<div style={{ display: "grid", gridTemplateColumns: sel ? "minmax(240px, 300px) 1fr" : "1fr", gap: 20, alignItems: "start" }}>
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {users.length === 0 ? <div style={{ padding: 40, textAlign: "center", color: "#9a8a6e", background: "rgba(255,255,255,.6)", borderRadius: 14 }}><p style={{ fontSize: 18, marginBottom: 8 }}>📋</p><p style={{ margin: 0 }}>還沒有人填寫。</p></div>
        : users.sort((a, b) => getP(b).pct - getP(a).pct).map(u => {
          const p = getP(u); const act = sel?.odName === u.odName;
          const wc = u.answers ? Object.values(u.answers).filter(a => a?.status === "weird").length : 0;
          const cc = u.answers ? Object.values(u.answers).filter(a => a?.status === "confused").length : 0;
          return (<div key={u.odName || u.nickname} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button onClick={() => setSel(act ? null : u)} style={{ flex: 1, display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", background: act ? "rgba(139,90,43,.08)" : "rgba(255,255,255,.7)", border: `1.5px solid ${act ? "rgba(139,90,43,.25)" : "rgba(0,0,0,.06)"}`, borderRadius: 14, cursor: "pointer", textAlign: "left" }}>
              <Ring progress={p.pct} /><div style={{ flex: 1 }}><div style={{ fontSize: 15, fontWeight: 600, color: "#5B3A1F" }}>{u.nickname || "匿名"}</div><div style={{ fontSize: 12, color: "#9a8a6e", marginTop: 2 }}>{[u.device, u.browser, u.group ? `組${u.group}` : null, fmtDur(u.activeSec) ? `🕒${fmtDur(u.activeSec)}` : null, u.role].filter(Boolean).join(" · ")}</div>{(() => { const c = cov[u.nickname]; if (!c) return null; const done = c.pc && (!c.needsMobile || c.mobile); const label = done ? (c.needsMobile ? "✅ 電腦＋行動 都測了" : "✅ 後台已測完") : `⚠ 還差 ${!c.pc ? "電腦" : "手機/平板"}`; return <div style={{ fontSize: 11, marginTop: 3, fontWeight: 600, color: done ? "#6B8E4E" : "#c49000" }}>{label}</div>; })()}</div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}><div style={{ fontSize: 16, fontWeight: 700, color: p.pct >= 1 ? "#6B8E4E" : "#a09880" }}>{Math.round(p.pct * 100)}%</div><div style={{ display: "flex", gap: 6, fontSize: 11 }}>{cc > 0 && <span style={{ color: "#a05520", fontWeight: 700 }}>❌ {cc}</span>}</div></div>
            </button>
            <button onClick={() => { if(window.confirm(`確定刪除「${u.nickname}」的填寫資料？`)) { if(sel?.odName===u.odName) setSel(null); onDelete(u.odName); } }} style={{ padding: "10px 12px", borderRadius: 10, background: "rgba(196,80,40,.1)", border: "1px solid rgba(196,80,40,.15)", color: "#c44028", cursor: "pointer", fontSize: 13, flexShrink: 0 }}>🗑</button>
          </div>);
        })}
    </div>
    {sel && (<div style={{ position: "sticky", top: 80, maxHeight: "calc(100vh - 100px)", overflowY: "auto", padding: "22px 26px", borderRadius: 16, background: "rgba(255,255,255,.85)", border: "1px solid rgba(0,0,0,.08)", boxShadow: "0 4px 24px rgba(91,58,31,.06)" }}>
      <h3 style={{ margin: "0 0 6px", fontSize: 19, color: "#5B3A1F" }}>{sel.nickname}</h3>
      <p style={{ fontSize: 13, color: "#9a8a6e", margin: "0 0 12px" }}>{[sel.device, sel.browser, sel.group ? `組${sel.group}` : null, sel.role].filter(Boolean).join(" · ")}{sel.updatedAt && ` · ${new Date(sel.updatedAt).toLocaleString("zh-TW")}`}</p>
      {fmtDur(sel.activeSec) && <div style={{ marginBottom: 14 }}><span style={{ fontSize: 13, fontWeight: 700, color: "#5B3A1F", background: "rgba(139,90,43,.12)", padding: "5px 14px", borderRadius: 20 }}>🕒 實際操作時間：{fmtDur(sel.activeSec)}</span></div>}
      {/* 統計 + 切換：只看問題 / 全部作答 */}
      {(() => {
        const ans = sel.answers || {};
        const okN = Object.values(ans).filter(x => x?.status === "ok").length;
        const wN = Object.values(ans).filter(x => x?.status === "weird").length;
        const cN = Object.values(ans).filter(x => x?.status === "confused").length;
        return (<div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
          <span style={{ fontSize: 13, color: "#5a8a3c", fontWeight: 700 }}>✅ 通過 {okN}</span>
          <span style={{ fontSize: 13, color: "#a05520", fontWeight: 700 }}>❌ 不通過 {cN}</span>
          <button onClick={() => setShowAll(s => !s)} style={{ marginLeft: "auto", padding: "7px 16px", borderRadius: 20, border: "1px solid rgba(139,90,43,.3)", background: showAll ? "#8B5A2B" : "transparent", color: showAll ? "#fff" : "#8B5A2B", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>{showAll ? "目前：全部作答" : "目前：只看問題"}</button>
        </div>);
      })()}
      {sel.answers && Object.entries(sel.answers).filter(([, a]) => showAll ? a?.status : a?.status === "confused").map(([id, a]) => {
        const part = findPart(parts, id);
        const meta = a.status === "confused" ? { bg: "rgba(160,85,32,.05)", bd: "rgba(160,85,32,.18)", chip: "#a05520", label: "❌ 不通過" }
          : a.status === "weird" ? { bg: "rgba(196,144,0,.05)", bd: "rgba(196,144,0,.18)", chip: "#c49000", label: "🟡 還行" }
          : { bg: "rgba(107,142,78,.05)", bd: "rgba(107,142,78,.18)", chip: "#5a8a3c", label: "✅ 通過" };
        return (
        <div key={id} style={{ padding: "14px 16px", borderRadius: 12, marginBottom: 12, background: meta.bg, border: `1px solid ${meta.bd}` }}>
          {/* 大分類 + 編號 + 狀態 */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
            {part && <span style={{ fontSize: 11.5, fontWeight: 700, color: "#8B5A2B", background: "rgba(139,90,43,.1)", padding: "3px 11px", borderRadius: 20 }}>{part.icon} {part.subtitle}</span>}
            <span style={{ fontSize: 11.5, fontFamily: "monospace", color: "#9a8a6e" }}>#{id}</span>
            <span style={{ marginLeft: "auto", fontSize: 11.5, fontWeight: 700, color: "#fff", background: meta.chip, padding: "3px 11px", borderRadius: 20, whiteSpace: "nowrap" }}>{meta.label}</span>
          </div>
          {/* 題目 */}
          <div style={{ fontSize: 14.5, lineHeight: 1.65, color: "#3d3225", fontWeight: 500 }}>{findItemText(parts, id)}</div>
          {/* 測試員留言 */}
          {a.comment && <div style={{ marginTop: 10, padding: "10px 13px", borderRadius: 8, background: "rgba(255,255,255,.75)", borderLeft: "3px solid #C89B7B" }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: "#8B5A2B", marginBottom: 4 }}>💬 測試員留言</div>
            <div style={{ fontSize: 14, lineHeight: 1.65, color: "#5b4a30", whiteSpace: "pre-wrap" }}>{a.comment}</div>
          </div>}
          {/* 附圖 */}
          {a.images?.length > 0 && <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>{a.images.map((url, i) => <img key={i} src={url} alt="" onClick={() => onZoom && onZoom(url)} style={{ width: 130, height: 98, objectFit: "cover", borderRadius: 8, border: "1px solid rgba(0,0,0,.12)", cursor: "zoom-in", display: "block" }} />)}</div>}
          {/* 管理員回覆 */}
          <ReplyBox value={a.reply} images={a.replyImages} onSave={async (text, images) => { await onReply(sel.odName, id, text, images); setSel(s => ({ ...s, answers: { ...s.answers, [id]: { ...(s.answers?.[id] || {}), reply: text, replyImages: images } } })); }} />
        </div>
        );
      })}
      {sel.freeform && Object.entries(sel.freeform).filter(([, v]) => v).map(([k, v]) => {
        const fr = sel.freeformReplies?.[k] || {};
        return (
          <div key={k} style={{ marginTop: 16, padding: "12px 14px", borderRadius: 10, background: "rgba(255,255,255,.5)", border: "1px solid rgba(0,0,0,.06)" }}>
            <div style={{ fontSize: 12, color: "#9a8a6e", fontWeight: 600 }}>💬 自由回饋（{k}）</div>
            <p style={{ margin: "4px 0 0", fontSize: 13.5, lineHeight: 1.65, color: "#3d3225", whiteSpace: "pre-wrap" }}>{v}</p>
            <ReplyBox value={fr.text} images={fr.images} onSave={async (text, images) => { await onReplyFreeform(sel.odName, k, text, images); setSel(s => ({ ...s, freeformReplies: { ...(s.freeformReplies || {}), [k]: { text, images } } })); }} />
          </div>
        );
      })}
    </div>)}
  </div>);
}

// ── Hotspots ─────────────────────────────────────────────────
function Hotspots({ users, parts }) {
  const issues = {}; for (const u of users) { if (!u?.answers) continue; for (const [id, a] of Object.entries(u.answers)) { if (a?.status === "confused") { if (!issues[id]) issues[id] = { weird: 0, confused: 0, total: 0, comments: [] }; issues[id][a.status]++; issues[id].total++; if (a.comment) issues[id].comments.push({ user: u.nickname, comment: a.comment }); } } }
  const sorted = Object.entries(issues).sort((a, b) => b[1].total - a[1].total);
  if (sorted.length === 0) return <div style={{ padding: 40, textAlign: "center", color: "#9a8a6e", background: "rgba(255,255,255,.6)", borderRadius: 14 }}>目前沒有問題項目。</div>;
  return (<div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
    {sorted.map(([id, d], idx) => { const sev = d.total / users.length; const part = findPart(parts, id); return (
      <div key={id} style={{ padding: "14px 18px", borderRadius: 12, background: "rgba(255,255,255,.75)", border: `1px solid ${sev > .5 ? "rgba(196,80,40,.15)" : "rgba(0,0,0,.06)"}` }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#fff", minWidth: 24, height: 24, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", background: sev > .5 ? "#c44028" : sev > .3 ? "#c49000" : "#a09880" }}>{idx + 1}</span>
          <span style={{ fontSize: 12, fontFamily: "monospace", color: "#9a8a6e", minWidth: 38, paddingTop: 2 }}>{id}</span>
          <div style={{ flex: 1 }}><span style={{ fontSize: 13, color: "#3d3225" }}>{findItemText(parts, id)}</span>{part && <span style={{ fontSize: 11, color: "#b8ad9c", marginLeft: 6 }}>({part.subtitle})</span>}</div>
          <div style={{ display: "flex", gap: 8, whiteSpace: "nowrap" }}>{d.weird > 0 && <span style={{ fontSize: 13, color: "#c49000", fontWeight: 600 }}>😕{d.weird}</span>}{d.confused > 0 && <span style={{ fontSize: 13, color: "#a05520", fontWeight: 600 }}>❓{d.confused}</span>}<span style={{ fontSize: 11, color: "#fff", padding: "2px 8px", borderRadius: 10, background: sev > .5 ? "#c44028" : "#a09880", fontWeight: 600 }}>{d.total}/{users.length}</span></div>
        </div>
        {d.comments.length > 0 && <div style={{ marginTop: 8, paddingLeft: 72 }}>{d.comments.map((c, i) => <div key={i} style={{ fontSize: 12, color: "#6b5830", marginBottom: 3 }}><strong style={{ color: "#8B5A2B" }}>{c.user}</strong>：{c.comment}</div>)}</div>}
      </div>); })}
  </div>);
}

// ── Comments ─────────────────────────────────────────────────
function Comments({ users, parts, onZoom }) {
  const freeforms = users.filter(u => u.freeform && Object.values(u.freeform).some(v => v))
    .map(u => ({ u, entries: Object.entries(u.freeform).filter(([, v]) => v) }));

  const inline = [];
  for (const u of users) {
    if (!u.answers) continue;
    for (const [id, a] of Object.entries(u.answers)) {
      if (a?.comment || a?.images?.length) inline.push({ u, id, comment: a.comment, status: a.status, text: findItemText(parts, id), images: a.images||[] });
    }
  }

  if (freeforms.length === 0 && inline.length === 0) {
    return (<div style={{ padding: 40, textAlign: "center", color: "#9a8a6e", background: "rgba(255,255,255,.6)", borderRadius: 14 }}><p style={{ fontSize: 18, marginBottom: 8 }}>💬</p><p style={{ margin: 0 }}>還沒有任何留言。</p></div>);
  }

  return (<div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
    {freeforms.length > 0 && (<div>
      <h3 style={{ margin: "0 0 12px", fontSize: 15, color: "#5B3A1F" }}>📝 自由回饋</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {freeforms.map(({ u, entries }) => (
          <div key={u.odName} style={{ padding: "16px 18px", borderRadius: 14, background: "rgba(255,255,255,.75)", border: "1px solid rgba(0,0,0,.06)" }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#5B3A1F", marginBottom: 10 }}>
              {u.nickname || "匿名"}
              <span style={{ fontSize: 11, color: "#9a8a6e", fontWeight: 400, marginLeft: 8 }}>{[u.device, u.browser, u.group ? `組${u.group}` : null, u.role].filter(Boolean).join(" · ")}</span>
            </div>
            {entries.map(([k, v]) => (
              <div key={k} style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 12, color: "#9a8a6e", fontWeight: 600, marginBottom: 3 }}>{k}</div>
                <p style={{ margin: 0, fontSize: 13, color: "#3d3225", whiteSpace: "pre-wrap", lineHeight: 1.7 }}>{v}</p>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>)}
    {inline.length > 0 && (<div>
      <h3 style={{ margin: "0 0 12px", fontSize: 15, color: "#5B3A1F" }}>💬 題目留言（{inline.length}）</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {inline.map((c, i) => (
          <div key={i} style={{ padding: "12px 16px", borderRadius: 12, background: "rgba(255,255,255,.75)", border: "1px solid rgba(0,0,0,.06)" }}>
            <div style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontFamily: "monospace", color: "#9a8a6e", minWidth: 38 }}>{c.id}</span>
              <span style={{ flex: 1, fontSize: 12.5, color: "#3d3225" }}>{c.text}</span>
              <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 8, background: c.status === "confused" ? "rgba(160,85,32,.08)" : "rgba(196,144,0,.08)", color: c.status === "confused" ? "#a05520" : "#c49000", whiteSpace: "nowrap" }}>
                {c.status === "confused" ? "❌不通過" : "🤔不確定"}
              </span>
            </div>
            <div style={{ paddingLeft: 46 }}>
              <span style={{ fontSize: 12, color: "#8B5A2B", fontWeight: 600 }}>{c.u.nickname || "匿名"}</span>
              {c.comment && <span style={{ fontSize: 12, color: "#6b5830", fontStyle: "italic" }}>：「{c.comment}」</span>}
              {c.images?.length > 0 && (
                <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                  {c.images.map((url, i) => (
                    <img key={i} src={url} alt="" onClick={() => onZoom && onZoom(url)} style={{ width: 120, height: 90, objectFit: "cover", borderRadius: 8, border: "1px solid rgba(0,0,0,.12)", cursor: "zoom-in", display: "block" }} />
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>)}
  </div>);
}

// ── Main Dashboard ──────────────────────────────────────────
export default function Dashboard() {
  const [parts, setParts] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("overview");
  const [zoomSrc, setZoomSrc] = useState(null);   // 圖片放大燈箱

  const init = async () => { setLoading(true); let q = await loadQ(); if (!q) { q = DEFAULT_PARTS; await saveQ(q); } setParts(q); setUsers(await loadAllUsers()); setLoading(false); };
  useEffect(() => { document.title = "方壺山兌換Dashboard"; }, []);
  useEffect(() => { init(); }, []);

  const deleteUser = async (uid) => {
    await dbDel(`kv/feedbacks/${safeId(uid)}`);
    setUsers(prev => prev.filter(u => u.odName !== uid));
  };

  const replyTo = async (uid, itemId, text, images) => {
    const imgs = images || [];
    // 先 re-fetch DB 最新狀態，避免覆蓋掉測試員同時的填寫
    const fresh = parseVal(await dbGet(`kv/feedbacks/${safeId(uid)}`)) || users.find(x => x.odName === uid) || {};
    const updated = {
      ...fresh,
      answers: {
        ...(fresh.answers || {}),
        [itemId]: { ...(fresh.answers?.[itemId] || {}), reply: text, replyImages: imgs },
      },
    };
    await dbSet(`kv/feedbacks/${safeId(uid)}`, JSON.stringify(updated));
    setUsers(prev => prev.map(x => x.odName === uid ? updated : x));
  };

  // 針對「自由回饋」的回覆：寫到獨立欄位 freeformReplies[key]，不動原 freeform 文字
  const replyToFreeform = async (uid, key, text, images) => {
    const imgs = images || [];
    const fresh = parseVal(await dbGet(`kv/feedbacks/${safeId(uid)}`)) || users.find(x => x.odName === uid) || {};
    const updated = {
      ...fresh,
      freeformReplies: { ...(fresh.freeformReplies || {}), [key]: { text, images: imgs } },
    };
    await dbSet(`kv/feedbacks/${safeId(uid)}`, JSON.stringify(updated));
    setUsers(prev => prev.map(x => x.odName === uid ? updated : x));
  };

  const exportCSV = () => {
    if (!parts || users.length === 0) return;
    const all = parts.flatMap(p => p.sections.flatMap(s => s.items.map(i => ({ ...i, part: p.subtitle }))));
    let csv = "\uFEFF測試員資訊\n測試員,裝置,瀏覽器,組別,實際操作時間,最後更新\n";
    for (const u of users) { csv += `"${u.nickname || ""}","${u.device || ""}","${u.browser || ""}","${u.group || ""}","${fmtDur(u.activeSec) || ""}","${u.updatedAt ? new Date(u.updatedAt).toLocaleString("zh-TW") : ""}"\n`; }
    csv += "\n逐題結果\n";
    csv += "#,Part,題目," + users.map(u => `"${u.nickname}"`).join(",") + ",問題數\n";
    for (const item of all) { let wc = 0; const row = [item.id, `"${item.part}"`, `"${item.text}"`]; for (const u of users) { const a = u.answers?.[item.id]; if (a?.status === "confused") wc++; row.push(`"${[a?.status || "", a?.comment && `留言:${a.comment}`, a?.reply && `回覆:${a.reply}`].filter(Boolean).join(" | ").replace(/"/g, '""')}"`); } row.push(wc); csv += row.join(",") + "\n"; }
    csv += "\n\n自由回饋\n"; for (const u of users) { if (!u.freeform) continue; csv += `\n"${u.nickname}"\n`; for (const [k, v] of Object.entries(u.freeform)) { if (v) csv += `"${k}","${v.replace(/"/g, '""')}"\n`; } }
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" })); a.download = `feedback-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
  };

  if (loading) return (<div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(160deg,#f7f0e3,#ede3d0,#e6d8c1)" }}><div style={{ textAlign: "center", color: "#9a8a6e" }}><img src={logoImg} alt="Logo" style={{ width: 56, height: 56, objectFit: "contain", display: "block", margin: "0 auto 12px" }} />載入中...</div></div>);

  const total = parts ? TOTAL(parts) : 0;
  const avgPct = users.length > 0 ? Math.round(users.reduce((t, u) => t + (u.answers ? Object.values(u.answers).filter(a => a?.status).length / (USER_TOTAL(parts, total, u) || 1) : 0), 0) / users.length * 100) : 0;
  const issueSet = new Set(); users.forEach(u => u.answers && Object.entries(u.answers).forEach(([id, a]) => { if (a?.status === "confused") issueSet.add(id); }));
  const commentCount = users.reduce((t, u) => t + (u.answers ? Object.values(u.answers).filter(a => a?.comment).length : 0) + (u.freeform ? Object.values(u.freeform).filter(v => v).length : 0), 0);

  return (<div style={{ minHeight: "100vh", background: "linear-gradient(160deg,#f7f0e3,#ede3d0,#e6d8c1)", fontFamily: "'Noto Sans TC',-apple-system,sans-serif" }}>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;600;700&family=Noto+Serif+TC:wght@700&display=swap" rel="stylesheet" />
    {zoomSrc && <ImgLightbox src={zoomSrc} onClose={() => setZoomSrc(null)} />}
    <header style={{ position: "sticky", top: 0, zIndex: 100, padding: "14px 20px", background: "rgba(91,58,31,.95)", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
      <img src={logoImg} alt="Logo" style={{ width: 28, height: 28, objectFit: "contain" }} /><h1 style={{ margin: 0, fontSize: 18, color: "#fff", fontFamily: "'Noto Serif TC', serif", flex: 1 }}>方壺山道場 — 管理儀表板</h1>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={init} style={{ padding: "7px 14px", borderRadius: 8, background: "rgba(255,255,255,.15)", color: "#fff", border: "1px solid rgba(255,255,255,.2)", cursor: "pointer", fontSize: 12 }}>🔄 重新整理</button>
        <button onClick={exportCSV} disabled={users.length === 0} style={{ padding: "7px 14px", borderRadius: 8, background: users.length > 0 ? "#6B8E4E" : "rgba(255,255,255,.1)", color: "#fff", border: "none", cursor: users.length > 0 ? "pointer" : "default", fontSize: 12 }}>📥 匯出 CSV</button>
      </div>
    </header>
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 16px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14, marginBottom: 28 }}>
        {[{ l: "測試者", v: users.length, c: "#5B3A1F" }, { l: "平均完成率", v: users.length > 0 ? `${avgPct}%` : "—", c: "#6B8E4E" }, { l: "問題項目", v: issueSet.size, c: "#c49000" }, { l: "留言數", v: commentCount, c: "#a05520" }, { l: "題目總數", v: total, c: "#8B5A2B" }].map(s => (
          <div key={s.l} style={{ padding: "18px 16px", borderRadius: 14, background: "rgba(255,255,255,.8)", border: "1px solid rgba(0,0,0,.06)", textAlign: "center" }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: s.c }}>{s.v}</div><div style={{ fontSize: 12, color: "#9a8a6e", marginTop: 4 }}>{s.l}</div></div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: "1px solid rgba(0,0,0,.08)" }}>
        {[{ id: "overview", label: "👥 測試者總覽" }, { id: "hotspots", label: "🔥 問題熱點" }, { id: "editor", label: "📝 編輯題目" }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: "10px 18px", border: "none", cursor: "pointer", background: tab === t.id ? "rgba(139,90,43,.1)" : "transparent", borderBottom: tab === t.id ? "3px solid #8B5A2B" : "3px solid transparent", fontSize: 14, fontWeight: tab === t.id ? 700 : 400, color: tab === t.id ? "#5B3A1F" : "#9a8a6e", borderRadius: "8px 8px 0 0" }}>{t.label}</button>
        ))}
      </div>
      {tab === "overview" && parts && <Overview users={users} parts={parts} onDelete={deleteUser} onZoom={setZoomSrc} onReply={replyTo} onReplyFreeform={replyToFreeform} />}
      {tab === "hotspots" && parts && <Hotspots users={users} parts={parts} />}
      {tab === "editor" && parts && <QuestionEditor parts={parts} onSave={d => setParts(d)} />}
    </div>
  </div>);
}
