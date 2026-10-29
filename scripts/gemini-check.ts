// 檢查 Gemini API 為什麼出題失敗：金鑰是否有效、帳號能用哪些模型、出一小批題要多久、有沒有撞到額度上限。
//   PowerShell： $env:GEMINI_API_KEY="你的金鑰"; npx tsx scripts/gemini-check.ts
//   可加 GEMINI_MODEL=模型名稱 指定要測的模型（預設 gemini-3.8-flash）
import { buildSkillPrompt, parseBatch } from '../src/game/questionPipeline';

const key = process.env.GEMINI_API_KEY;
if (!key) {
  console.log('缺少 GEMINI_API_KEY：請先在這個終端機設定金鑰再執行');
  process.exit(1);
}
const BASE = 'https://generativelanguage.googleapis.com/v1beta';
const headers = { 'Content-Type': 'application/json', 'x-goog-api-key': key };

// 錯誤說明：把常見的狀態碼翻成白話
function explain(status: number, body: string): string {
  if (status === 400 && /API key not valid/i.test(body)) return '金鑰無效（可能貼錯或已刪除）';
  if (status === 403) return '金鑰沒有權限（專案沒啟用 Generative Language API，或金鑰限制了來源）';
  if (status === 404) return '這個模型名稱不存在或帳號不能用，請從上面的清單挑一個';
  if (status === 429) {
    if (/per.?day|PerDay/i.test(body)) return '超過「每日」額度：今天不能再呼叫，要等明天（太平洋時間午夜）重置，或升級付費';
    if (/per.?minute|PerMinute/i.test(body)) return '超過「每分鐘」額度：呼叫太密集，放慢速度即可';
    return '超過額度上限（細節見下方原始訊息）';
  }
  if (status === 503) return 'Gemini 伺服器忙碌（暫時性，不是你的問題），稍後再試或換模型';
  if (status >= 500) return 'Gemini 伺服器錯誤（暫時性）';
  return '';
}

const list = await fetch(`${BASE}/models?pageSize=200`, { headers });
const listBody = await list.text();
if (!list.ok) {
  console.log(`列出模型失敗：${list.status} ${explain(list.status, listBody)}\n${listBody.slice(0, 800)}`);
  process.exit(1);
}
const models = (JSON.parse(listBody).models as { name: string; supportedGenerationMethods?: string[] }[])
  .filter(m => m.supportedGenerationMethods?.includes('generateContent'))
  .map(m => m.name.replace('models/', ''))
  .filter(n => /gemini/.test(n));
console.log(`金鑰有效。可用的 Gemini 模型（${models.length} 個）：\n  ${models.join('\n  ')}\n`);

const model = process.env.GEMINI_MODEL ?? 'gemini-3.8-flash';
console.log(`用 ${model} 試出 10 題 A1 寫作題…`);
const started = Date.now();
const res = await fetch(`${BASE}/models/${model}:generateContent`, {
  method: 'POST',
  headers,
  body: JSON.stringify({
    contents: [{ role: 'user', parts: [{ text: buildSkillPrompt('A1 入門', 'writing', 10, [], []) }] }],
    generationConfig: { responseMimeType: 'application/json', temperature: 0.8 },
  }),
});
const body = await res.text();
const secs = ((Date.now() - started) / 1000).toFixed(1);
if (!res.ok) {
  console.log(`失敗：${res.status}（${secs} 秒）${explain(res.status, body)}\n原始訊息：\n${body.slice(0, 1500)}`);
  process.exit(1);
}
const data = JSON.parse(body) as { candidates?: { content?: { parts?: { text?: string }[] } }[]; usageMetadata?: Record<string, number> };
const text = data.candidates?.[0]?.content?.parts?.map(p => p.text ?? '').join('') ?? '';
try {
  const batch = parseBatch(text);
  console.log(`成功：${secs} 秒拿到 ${batch.normal.length + batch.boss.length} 題（${JSON.stringify(data.usageMetadata ?? {})}）`);
} catch {
  console.log(`有回應但不是合法 JSON（${secs} 秒）：\n${text.slice(0, 500)}`);
}
