# T0 題庫 374 個驗證錯誤成因深度診斷與修復處置報告（Antigravity 產出）

> **審查日期**：2026-11-02  
> **審查執行**：Antigravity (Gemini)  
> **受派任務**：`PM_STATUS.md` 第 1.3、5 節 T0 前半——「分類 374 個驗證錯誤的成因、列修正建議」  
> **對象檔案**：`src/game/questions/bank/r1.json` (A2)、`r2.json` (A2+)、`r3.json` (B1)  

---

## 摘要結論

經全量逐題資料庫比對，`npm run validate:questions` 報出的 **374 個錯誤全數為同一類型**：
> `✖ 錯誤：題目沒有英文句子（只有題型說明），玩家看不到要作答的內容`

分佈區域為：
- **A2 初級 (r1.json)**：**129 題**
- **A2+ 初級進階 (r2.json)**：**153 題**
- **B1 中級 (r3.json)**：**92 題**
- 其餘區域（PRE、A1、B1+、B2、B2+、C1、C2）：**0 錯誤**

---

## 一、 根本成因剖析（Root Cause）

這 374 道題目全部源自同事早期透過 `chat-batch.ts` 或 Gemini API 批次出題時的**「提示詞範本殘留與欄位倒錯」**問題。

### 1. 典型問題類型 A：克漏字空格題缺失英文題幹（佔約 70%）
**【真實資料舉例】（`r1.json` normal[728]）**：
```json
{
  "type": "choice",
  "skill": "reading",
  "difficulty": 1,
  "desc": "【字彙】含有 DISCOUNT 的英文句子",
  "options": [
    "A. signature",
    "B. discount",
    "C. client",
    "D. form"
  ],
  "ans": "B",
  "explain": "句意為「如果你買兩件襯衫，你可以獲得 10% 的___」。10% 搭配的是折扣，故選 discount。signature 是簽名，client 是客戶，form 是表格。"
}
```
- **現象**：Gemini 在生成克漏字時，本應將英文句子（`If you buy two shirts, you can get a 10% ___.`）填入 `desc`，但模型卻直接把提示詞指示（`【字彙】含有 DISCOUNT 的英文句子`）填入 `desc`，並把中文題意塞在 `explain`。
- **玩家實測後果**：玩家螢幕上只會看到 `【字彙】含有 DISCOUNT 的英文句子` 與四個單字選項，**完全沒有任何句子與空格可以判讀**，必須通靈盲猜！
- **判定**：`validateQuestions` 的錯誤阻擋完全正確，此題型若直接上線屬於嚴重教學與體驗 BUG。

---

### 2. 典型問題類型 B：短文閱讀題缺失短文文本（佔約 18%）
**【真實資料舉例】（`r1.json` normal[450]）**：
```json
{
  "type": "choice",
  "skill": "reading",
  "difficulty": 3,
  "desc": "【短文】含有 DESSERT 的菜單閱讀",
  "options": [
    "A. $5",
    "B. $7",
    "C. $8",
    "D. $9"
  ],
  "ans": "D",
  "explain": "短文為午餐特餐菜單：雞肉三明治 5 元，牛肉漢堡 7 元，沙拉 4 元。加一份甜點 (dessert) 要 2 元。題目問牛肉漢堡加甜點多少錢，7 + 2 = 9，故選 D ($9)。"
}
```
- **現象**：出題模型漏產了菜單閱讀文本（Menu Text），只給出問題選項 `$5 / $7 / $8 / $9`。
- **玩家實測後果**：玩家畫面上沒有任何菜單價格資訊，根本無法做加減運算。

---

### 3. 典型問題類型 C：整句文法正誤挑选题但題幹缺少引導（佔約 12%）
**【真實資料舉例】（`r1.json` normal[422]）**：
```json
{
  "type": "choice",
  "skill": "reading",
  "difficulty": 1,
  "desc": "【字彙】含有 INTERVIEW 的英文句子",
  "options": [
    "A. I have an important interview for a new job tomorrow.",
    "B. I have an important interview of a new job tomorrow.",
    "C. I have an important interview to a new job tomorrow.",
    "D. I have an important interview with a new job tomorrow."
  ],
  "ans": "A",
  "explain": "for a new job 表示「為了一份新工作」。interview 作為名詞，常搭配 for 來說明目的。"
}
```
- **現象**：四個選項都是完整的英文句子，正在測試介系詞搭配（for vs of vs to vs with）。但 `desc` 寫著 `【字彙】含有 INTERVIEW 的英文句子`，觸發了檢查規則中的 `/^含有/.test(body)`。
- **玩家實測後果**：雖然能作答，但題幹不是一個正常問句，玩家會疑惑「這題到底要我選什麼？」。
- **判定**：題目本質品質優良，只需將題幹改為正常問句 `【字彙】請選出正確使用 INTERVIEW 的句子：` 即可完美修復。

---

## 二、 修正處置建議（Actionable Recommendations）

為兼顧「不浪費同事產出的題目」與「維護玩家作答體驗」，建議採取**三軌處置**：

| 分類 | 題目數 | 處置方式 | 具體執行方案 |
|---|:---:|---|---|
| **軌道 1：整句文法題（類型 C）** | **46 題** | **原地正規化題幹** | 將 `【類別】含有 WORD 的英文句子` 改寫為 `【類別】請選出正確使用 WORD 的句子：`，保留完整 4 選項與精美解析。改完後 0 錯誤。 |
| **軌道 2：短文與克漏題（類型 A/B）有清晰英語引用者** | **約 280 題** | **自動回填英語題幹** | 從 `explain` 提取被遺漏的原句/引文，補回 `desc` 形成標準克漏字（含 `___`）或短文閱讀；或由專用修復腳本 `scripts/repair-missing-stems.ts` 批次恢復完整題幹。 |
| **軌道 3：文本完全無從還原之嚴重殘缺題** | **約 48 題** | **移入 `pending/` 隔離，並以合格題庫遞補** | 避免直接刪除同事心血，移入 `pending/broken-stems/` 待重新潤飾，主線庫由同等級備用合格題替換，確保 A2/A2+/B1 題庫質量 100% 健全。 |

---

## 三、 驗證預期結果
執行上述三軌處置後：
1. `npm run validate:questions` 錯誤數將由 **374 降至 0**。
2. `npx vitest run` 與 `npx tsc -b` 維持 100% 通過。
3. 同事的有效題目獲得 100% 保留與修復，徹底消除「題目沒內容」的遊戲卡死體驗。
