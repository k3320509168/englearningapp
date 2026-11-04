import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const OUT_DIR = '/Users/dzzz/.gemini/antigravity/brain/bbad9fb3-182b-436a-8001-12c9e7828cf3';

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function run() {
  console.log('🌐 啟動 Headless Google Chrome (CDP Port: 9444)...');
  const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9444',
    '--user-data-dir=/tmp/chrome-codex-verify',
    '--window-size=1920,1080',
    '--no-first-run',
    '--disable-gpu',
    'about:blank',
  ]);

  await sleep(2500);

  let wsUrl = '';
  for (let i = 0; i < 10; i++) {
    try {
      const res = await fetch('http://127.0.0.1:9444/json');
      const data = await res.json();
      if (data && data[0] && data[0].webSocketDebuggerUrl) {
        wsUrl = data[0].webSocketDebuggerUrl;
        break;
      }
    } catch {
      await sleep(500);
    }
  }

  if (!wsUrl) {
    console.error('❌ 無法連線至 Chrome CDP');
    chrome.kill();
    process.exit(1);
  }

  console.log('🔌 連接 CDP WebSocket:', wsUrl);
  const ws = new WebSocket(wsUrl);

  let idCounter = 1;
  const pending = new Map();

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(msg.error);
      else resolve(msg.result);
    }
  };

  const send = (method, params = {}) => {
    return new Promise((resolve, reject) => {
      const id = idCounter++;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  };

  await new Promise(r => ws.onopen = r);

  console.log('📄 導航至 http://localhost:5173/ ...');
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Page.navigate', { url: 'http://localhost:5173/' });
  await sleep(4000);

  // 設置手機尺寸 375x812
  try { await send('Emulation.clearDeviceMetricsOverride'); } catch {}
  await sleep(200);
  await send('Emulation.setDeviceMetricsOverride', {
    width: 375,
    height: 812,
    deviceScaleFactor: 2,
    mobile: true,
  });
  await sleep(600);

  // 打開圖鑑
  await send('Runtime.evaluate', { expression: 'window.__ui?.getState()?.openModal("codex")' });
  await sleep(1500);

  // 切換到赤岩峽谷
  await send('Runtime.evaluate', {
    expression: `(() => {
      const buttons = Array.from(document.querySelectorAll('.region-tab-btn, button'));
      const btn = buttons.find(b => b.textContent?.includes('赤岩峽谷'));
      if (btn) btn.click();
    })()`
  });
  await sleep(1500);

  // 截圖 1: 赤岩峽谷 - 全部狀態
  const shot1 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(OUT_DIR, 'mobile-375x812_codex_r4_all.png'), Buffer.from(shot1.data, 'base64'));
  console.log(`📸 截圖 1: mobile-375x812_codex_r4_all.png (${(shot1.data.length / 1024).toFixed(1)} KB)`);

  // 點擊「📖 單字」按鈕
  await send('Runtime.evaluate', {
    expression: `(() => {
      const buttons = Array.from(document.querySelectorAll('.filter-btn, button'));
      const btn = buttons.find(b => b.textContent?.includes('單字'));
      if (btn) btn.click();
    })()`
  });
  await sleep(1200);

  // 截圖 2: 赤岩峽谷 - 單字過濾
  const shot2 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(OUT_DIR, 'mobile-375x812_codex_r4_words.png'), Buffer.from(shot2.data, 'base64'));
  console.log(`📸 截圖 2: mobile-375x812_codex_r4_words.png (${(shot2.data.length / 1024).toFixed(1)} KB)`);

  // 點擊第一個單字卡片打開詳情
  await send('Runtime.evaluate', {
    expression: `(() => {
      const cards = Array.from(document.querySelectorAll('.codex-card, .vocab-card'));
      if (cards.length > 0) cards[0].click();
    })()`
  });
  await sleep(1000);

  // 截圖 3: 赤岩峽谷 - 單字卡詳情彈窗
  const shot3 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(OUT_DIR, 'mobile-375x812_codex_r4_card_detail.png'), Buffer.from(shot3.data, 'base64'));
  console.log(`📸 截圖 3: mobile-375x812_codex_r4_card_detail.png (${(shot3.data.length / 1024).toFixed(1)} KB)`);

  // 關閉詳情彈窗，點擊「🧩 片語」
  await send('Runtime.evaluate', {
    expression: `(() => {
      const closeBtn = document.querySelector('.codex-popup-close, .modal-close');
      if (closeBtn) closeBtn.click();
    })()`
  });
  await sleep(500);

  await send('Runtime.evaluate', {
    expression: `(() => {
      const buttons = Array.from(document.querySelectorAll('.filter-btn, button'));
      const btn = buttons.find(b => b.textContent?.includes('片語'));
      if (btn) btn.click();
    })()`
  });
  await sleep(1000);

  // 截圖 4: 赤岩峽谷 - 地道短片語
  const shot4 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(OUT_DIR, 'mobile-375x812_codex_r4_phrases.png'), Buffer.from(shot4.data, 'base64'));
  console.log(`📸 截圖 4: mobile-375x812_codex_r4_phrases.png (${(shot4.data.length / 1024).toFixed(1)} KB)`);

  ws.close();
  chrome.kill();
  console.log('🎉 所有 CDP 截圖驗收完畢！');
}

run().catch(err => {
  console.error('CDP Error:', err);
  process.exit(1);
});
