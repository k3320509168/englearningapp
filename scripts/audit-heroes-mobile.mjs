import { spawn } from 'child_process';
import fs from 'fs';

const OUT_DIR = '/Users/dzzz/.gemini/antigravity/brain/bbad9fb3-182b-436a-8001-12c9e7828cf3';

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function run() {
  const chromeProcess = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
    '--headless=new',
    '--remote-debugging-port=9447',
    '--user-data-dir=/tmp/chrome-heroes-full',
    '--window-size=1920,1080',
    '--no-first-run',
    '--disable-gpu',
    'about:blank'
  ]);

  await sleep(2000);

  try {
    let wsUrl = '';
    for (let i = 0; i < 10; i++) {
      try {
        const res = await fetch('http://127.0.0.1:9447/json');
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
      console.error('Cannot connect to Chrome');
      return;
    }

    const ws = new WebSocket(wsUrl);
    let id = 1;
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

    const send = (method, params = {}) => new Promise((resolve, reject) => {
      const msgId = id++;
      pending.set(msgId, { resolve, reject });
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });

    await new Promise(r => ws.onopen = r);

    await send('Page.enable');
    await send('Runtime.enable');
    await send('Page.navigate', { url: 'http://localhost:5173/' });
    await sleep(3500);

    // 模擬使用者完整存檔狀態（4 位上陣英雄，多位擁有英雄）
    await send('Runtime.evaluate', {
      expression: `(() => {
        const s = window.__save?.getState();
        if (s) {
          s.heroes = ['volcano', 'avalanche', 'smoke', 'breeze', 'spark', 'frost', 'leaf', 'titan', 'echo', 'blaze'];
          s.party = ['player', 'volcano', 'avalanche', 'smoke'];
        }
      })()`
    });

    // 設置手機尺寸 375x812
    try { await send('Emulation.clearDeviceMetricsOverride'); } catch {}
    await sleep(200);
    await send('Emulation.setDeviceMetricsOverride', {
      width: 375,
      height: 812,
      deviceScaleFactor: 2,
      mobile: true,
      hasTouch: true
    });
    await sleep(600);

    // 打開隊伍 Modal
    await send('Runtime.evaluate', {
      expression: `(() => {
        window.__ui?.getState()?.openModal('heroes');
      })()`
    });
    await sleep(1500);

    // 截圖 1: 隊伍 Modal 初始狀態
    const shot1 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`${OUT_DIR}/mobile-375x812_heroes_full_view.png`, Buffer.from(shot1.data, 'base64'));
    console.log('Saved mobile-375x812_heroes_full_view.png');

    // 測試向下滾動
    const scrollResult = await send('Runtime.evaluate', {
      expression: `(() => {
        const scrollArea = document.querySelector('.hero-modal-scroll');
        if (!scrollArea) return { error: 'No scrollArea' };
        const initialTop = scrollArea.scrollTop;
        scrollArea.scrollTop = 300;
        return {
          initialTop,
          afterScrollTop: scrollArea.scrollTop,
          scrollHeight: scrollArea.scrollHeight,
          clientHeight: scrollArea.clientHeight
        };
      })()`,
      returnByValue: true
    });
    console.log('Scroll test result:', scrollResult.result?.value);

    // 截圖 2: 隊伍 Modal 滾動後
    const shot2 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`${OUT_DIR}/mobile-375x812_heroes_scrolled.png`, Buffer.from(shot2.data, 'base64'));
    console.log('Saved mobile-375x812_heroes_scrolled.png');

    // 關閉 heroes，打開 codex
    await send('Runtime.evaluate', {
      expression: `(() => {
        window.__ui?.getState()?.closeModal();
        window.__ui?.getState()?.openModal('codex');
      })()`
    });
    await sleep(1500);

    // 切換到赤岩峽谷 (R4)
    await send('Runtime.evaluate', {
      expression: `(() => {
        const regionBtns = Array.from(document.querySelectorAll('.codex-region-tab'));
        const r4 = regionBtns.find(b => b.textContent.includes('赤岩'));
        if (r4) r4.click();
      })()`
    });
    await sleep(800);

    // 點擊第一個單字卡彈出 popup
    await send('Runtime.evaluate', {
      expression: `(() => {
        const card = document.querySelector('.codex-card');
        if (card) card.click();
      })()`
    });
    await sleep(1000);

    // 截圖 3: Codex Popup (包含【發音】、【單字卡】、【上一張】、【下一張】按鈕)
    const shot3 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`${OUT_DIR}/mobile-375x812_codex_popup_verified.png`, Buffer.from(shot3.data, 'base64'));
    console.log('Saved mobile-375x812_codex_popup_verified.png');

    ws.close();
  } finally {
    chromeProcess.kill();
  }
}

run().catch(console.error);
