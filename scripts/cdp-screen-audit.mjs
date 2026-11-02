import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = path.resolve('screenshots/ui-verify');
fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function run() {
  console.log('🚀 啟動 Vite dev server...');
  const vite = spawn('npx', ['vite', '--port', '5199', '--strictPort'], {
    stdio: 'pipe',
    shell: true,
    env: { ...process.env, PATH: `/opt/homebrew/bin:/usr/local/bin:${process.env.PATH}` },
  });

  // 等待 vite 就緒
  await new Promise((resolve) => {
    vite.stdout.on('data', d => {
      const str = d.toString();
      if (str.includes('Local:') || str.includes('5199')) resolve();
    });
    setTimeout(resolve, 4000);
  });

  console.log('🌐 啟動 Headless Google Chrome (CDP Port: 9333)...');
  const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9333',
    '--user-data-dir=/tmp/chrome-eng-audit',
    '--window-size=1920,1080',
    '--no-first-run',
    '--disable-gpu',
    'about:blank',
  ]);

  await sleep(2500);

  // 獲取 WebSocket URL
  let wsUrl = '';
  for (let i = 0; i < 10; i++) {
    try {
      const res = await fetch('http://127.0.0.1:9333/json');
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
    vite.kill();
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

  console.log('📄 導航至 http://localhost:5199/englearningapp/ ...');
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Page.navigate', { url: 'http://localhost:5199/englearningapp/' });
  await sleep(3500);

  // 檢查 store 是否掛載
  const check = await send('Runtime.evaluate', { expression: 'typeof window.__ui' });
  console.log('Store 狀態:', check.result.value);

  const SIZES = [
    { name: 'mobile-375x812', width: 375, height: 812, mobile: true },
    { name: 'laptop-1366x768', width: 1366, height: 768, mobile: false },
    { name: 'desktop-1920x1080', width: 1920, height: 1080, mobile: false },
  ];

  const MODALS = [
    { id: null, label: 'map' },
    { id: 'codex', label: 'codex' },
    { id: 'heroes', label: 'heroes' },
    { id: 'shop', label: 'shop' },
    { id: 'growth', label: 'growth' },
    { id: 'tower', label: 'tower' },
    { id: 'shardQuiz', label: 'shard-quiz' },
    { id: 'loginReward', label: 'login-reward' },
    { id: 'adventure', label: 'adventure' },
    { id: 'review', label: 'review' },
  ];

  for (const sz of SIZES) {
    console.log(`\n📐 設定尺寸: ${sz.name} (${sz.width}x${sz.height})...`);
    try {
      await send('Emulation.clearDeviceMetricsOverride');
    } catch {
      // 忽略未設置時的清除錯誤
    }
    await sleep(200);
    await send('Emulation.setDeviceMetricsOverride', {
      width: sz.width,
      height: sz.height,
      deviceScaleFactor: 2,
      mobile: sz.mobile,
    });
    await sleep(600);

    for (const m of MODALS) {
      if (m.id === null) {
        await send('Runtime.evaluate', { expression: 'window.__ui?.getState()?.closeModal()' });
      } else {
        await send('Runtime.evaluate', { expression: `window.__ui?.getState()?.openModal("${m.id}")` });
      }
      await sleep(600);

      const shot = await send('Page.captureScreenshot', { format: 'png' });
      const filename = `${sz.name}_${m.label}.png`;
      const filePath = path.join(SCREENSHOT_DIR, filename);
      fs.writeFileSync(filePath, Buffer.from(shot.data, 'base64'));
      console.log(`  📸 截圖完成: ${filename} (${(shot.data.length / 1024).toFixed(1)} KB)`);
    }
  }

  console.log('\n✅ 所有尺寸截圖完成！');
  ws.close();
  chrome.kill();
  vite.kill();
  process.exit(0);
}

run().catch(err => {
  console.error('執行失敗:', err);
  process.exit(1);
});
