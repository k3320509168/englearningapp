import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const OUT_DIR = '/Users/dzzz/.gemini/antigravity/brain/bbad9fb3-182b-436a-8001-12c9e7828cf3/qa-verify';
fs.mkdirSync(OUT_DIR, { recursive: true });

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function run() {
  console.log('🌐 啟動 Headless Google Chrome (CDP Port: 9444)...');
  const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9444',
    '--user-data-dir=/tmp/chrome-eng-verify',
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

  console.log('📄 導航至 http://localhost:5173/englearningapp/ ...');
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Page.navigate', { url: 'http://localhost:5173/englearningapp/' });
  await sleep(3500);

  // 初始化並解鎖一些英雄和關卡，方便檢視圖鑑與隊伍
  await send('Runtime.evaluate', {
    expression: `(() => {
      if (window.__save) {
        const s = window.__save.getState();
        s.prologueDone = true;
        s.unlockedIndex = 4; // 解鎖到赤岩峽谷
        if (!s.heroes.includes('volcano')) s.heroes.push('volcano');
        if (!s.heroes.includes('avalanche')) s.heroes.push('avalanche');
        if (!s.heroes.includes('smoke')) s.heroes.push('smoke');
        if (!s.heroes.includes('titan')) s.heroes.push('titan');
        if (!s.heroes.includes('siren')) s.heroes.push('siren');
      }
    })()`
  });
  await sleep(500);

  const SIZES = [
    { name: 'mobile-375x812', width: 375, height: 812, mobile: true },
    { name: 'laptop-1366x768', width: 1366, height: 768, mobile: false },
    { name: 'desktop-1920x1080', width: 1920, height: 1080, mobile: false },
  ];

  for (const sz of SIZES) {
    console.log(`\n📐 設定尺寸: ${sz.name} (${sz.width}x${sz.height})...`);
    await send('Emulation.setDeviceMetricsOverride', {
      width: sz.width,
      height: sz.height,
      deviceScaleFactor: 2,
      mobile: sz.mobile,
    });
    await sleep(500);

    // 1. 英雄與隊伍 Modal
    await send('Runtime.evaluate', { expression: 'window.__ui?.getState()?.openModal("heroes")' });
    await sleep(800);
    let shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(OUT_DIR, `${sz.name}_heroes_top.png`), Buffer.from(shot.data, 'base64'));
    console.log(`  📸 截圖: ${sz.name}_heroes_top.png`);

    // 測試向下滾動檢視更多角色
    await send('Runtime.evaluate', {
      expression: `(() => {
        const scroller = document.querySelector('.hero-modal-scroll');
        if (scroller) scroller.scrollTop = 350;
      })()`
    });
    await sleep(500);
    shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(OUT_DIR, `${sz.name}_heroes_scrolled.png`), Buffer.from(shot.data, 'base64'));
    console.log(`  📸 截圖: ${sz.name}_heroes_scrolled.png`);

    // 2. 圖鑑 Modal
    await send('Runtime.evaluate', { expression: 'window.__ui?.getState()?.openModal("codex")' });
    await sleep(1000);
    shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(OUT_DIR, `${sz.name}_codex.png`), Buffer.from(shot.data, 'base64'));
    console.log(`  📸 截圖: ${sz.name}_codex.png`);

    // 點擊第一個單字卡片開啟詳情彈窗
    await send('Runtime.evaluate', {
      expression: `(() => {
        const firstCard = document.querySelector('.codex-card');
        if (firstCard) firstCard.click();
      })()`
    });
    await sleep(600);
    shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(OUT_DIR, `${sz.name}_codex_card_popup.png`), Buffer.from(shot.data, 'base64'));
    console.log(`  📸 截圖: ${sz.name}_codex_card_popup.png`);

    // 關閉詳情彈窗
    await send('Runtime.evaluate', {
      expression: `(() => {
        const closeBtn = document.querySelector('.codex-popup-close-btn');
        if (closeBtn) closeBtn.click();
      })()`
    });
    await sleep(300);
  }

  console.log('\n✅ 驗證截圖全數完成！');
  ws.close();
  chrome.kill();
  process.exit(0);
}

run().catch(err => {
  console.error('執行失敗:', err);
  process.exit(1);
});
