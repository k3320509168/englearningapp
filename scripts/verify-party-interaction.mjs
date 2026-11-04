import { spawn } from 'child_process';
import fs from 'fs';

const OUT_DIR = '/Users/dzzz/.gemini/antigravity/brain/bbad9fb3-182b-436a-8001-12c9e7828cf3';

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function run() {
  const chromeProcess = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
    '--headless=new',
    '--remote-debugging-port=9448',
    '--user-data-dir=/tmp/chrome-party-verify',
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
        const res = await fetch('http://127.0.0.1:9448/json');
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

    // 注入豐富的英雄存檔
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

    // 1. 打開隊伍 Modal
    await send('Runtime.evaluate', {
      expression: `(() => {
        window.__ui?.getState()?.openModal('heroes');
      })()`
    });
    await sleep(1500);

    // 檢查初始狀態
    const initialState = await send('Runtime.evaluate', {
      expression: `(() => {
        const party = window.__save.getState().party;
        const dockedBar = document.querySelector('.hero-docked-bar');
        const partyRow = document.querySelector('.party-row');
        return {
          party,
          hasDockedBar: !!dockedBar,
          dockedBarBottom: dockedBar ? dockedBar.getBoundingClientRect().bottom : null,
          windowHeight: window.innerHeight,
          partySlotsCount: partyRow ? partyRow.children.length : 0
        };
      })()`,
      returnByValue: true
    });
    console.log('初始隊伍與介面狀態:', initialState.result?.value);

    // 2. 測試：點擊下方未上陣英雄 (例如 breeze)
    const selectBreeze = await send('Runtime.evaluate', {
      expression: `(() => {
        const tiles = Array.from(document.querySelectorAll('.hero-tile'));
        const breezeTile = tiles.find(t => t.textContent.includes('BREEZE') || t.textContent.includes('微風'));
        if (breezeTile) {
          breezeTile.click();
          return true;
        }
        return false;
      })()`,
      returnByValue: true
    });
    console.log('點選下方未上陣英雄 Breeze:', selectBreeze.result?.value);
    await sleep(500);

    // 檢查底部操作列是否出現「換至：1位 2位 3位 4位」按鈕
    const dockedActionsAfterSelect = await send('Runtime.evaluate', {
      expression: `(() => {
        const dockedName = document.querySelector('.hero-docked-name')?.textContent;
        const slotBtns = Array.from(document.querySelectorAll('.hero-docked-slot-pill')).map(b => b.textContent.trim());
        return { dockedName, slotBtns };
      })()`,
      returnByValue: true
    });
    console.log('選中英雄後底部操作列狀態:', dockedActionsAfterSelect.result?.value);

    // 3. 測試：點擊底部「2位 VOLCANO」按鈕，替換 2 號位！
    const replaceViaDocked = await send('Runtime.evaluate', {
      expression: `(() => {
        const slotBtns = Array.from(document.querySelectorAll('.hero-docked-slot-pill'));
        const slot2 = slotBtns.find(b => b.textContent.includes('2位'));
        if (slot2) {
          slot2.click();
          return true;
        }
        return false;
      })()`,
      returnByValue: true
    });
    console.log('點擊底部按鈕替換 2 號位:', replaceViaDocked.result?.value);
    await sleep(500);

    const partyAfterReplace = await send('Runtime.evaluate', {
      expression: `window.__save.getState().party`,
      returnByValue: true
    });
    console.log('替換後的出戰隊伍:', partyAfterReplace.result?.value);

    // 4. 測試：點擊出戰隊伍第 3 位 (avalanche) 右上角的紅色「✕」下陣按鈕
    const removeSlot3 = await send('Runtime.evaluate', {
      expression: `(() => {
        const slots = Array.from(document.querySelectorAll('.party-slot'));
        const slot3 = slots[2]; // 第 3 格
        const removeBtn = slot3 ? slot3.querySelector('.party-slot-remove') : null;
        if (removeBtn) {
          removeBtn.click();
          return true;
        }
        return false;
      })()`,
      returnByValue: true
    });
    console.log('點擊第 3 位右上角 ✕ 下陣:', removeSlot3.result?.value);
    await sleep(500);

    const partyAfterRemove = await send('Runtime.evaluate', {
      expression: `window.__save.getState().party`,
      returnByValue: true
    });
    console.log('下陣後的出戰隊伍:', partyAfterRemove.result?.value);

    // 截圖驗收隊伍操作
    const shotParty = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`${OUT_DIR}/mobile-375x812_heroes_interaction_verified.png`, Buffer.from(shotParty.data, 'base64'));
    console.log('Saved mobile-375x812_heroes_interaction_verified.png');

    // 5. 測試單字卡彈窗四個按鈕的排列與尺寸
    await send('Runtime.evaluate', {
      expression: `(() => {
        window.__ui.getState().closeModal();
        window.__ui.getState().openModal('codex');
      })()`
    });
    await sleep(1500);

    // 切換到赤岩峽谷
    await send('Runtime.evaluate', {
      expression: `(() => {
        const tabs = Array.from(document.querySelectorAll('.codex-region-tab'));
        const r4 = tabs.find(t => t.textContent.includes('赤岩'));
        if (r4) r4.click();
      })()`
    });
    await sleep(800);

    // 點擊第一個單字卡彈出 popup
    await send('Runtime.evaluate', {
      expression: `(() => {
        const card = document.querySelector('.codex-card-btn');
        if (card) card.click();
      })()`
    });
    await sleep(1000);

    // 測量 popup 中 4 個按鈕的 rect 與 computed styles
    const popupButtons = await send('Runtime.evaluate', {
      expression: `(() => {
        const mainBtns = Array.from(document.querySelectorAll('.codex-popup-main-btns .btn')).map(b => ({
          text: b.textContent.trim(),
          rect: b.getBoundingClientRect(),
          height: b.offsetHeight,
          width: b.offsetWidth,
          whiteSpace: window.getComputedStyle(b).whiteSpace
        }));
        const navBtns = Array.from(document.querySelectorAll('.codex-popup-nav-btns .btn')).map(b => ({
          text: b.textContent.trim(),
          rect: b.getBoundingClientRect(),
          height: b.offsetHeight,
          width: b.offsetWidth,
          whiteSpace: window.getComputedStyle(b).whiteSpace
        }));
        return { mainBtns, navBtns };
      })()`,
      returnByValue: true
    });
    console.log('單字卡彈窗底部按鈕度量結果:', JSON.stringify(popupButtons.result?.value, null, 2));

    const shotCodex = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`${OUT_DIR}/mobile-375x812_codex_popup_verified_final.png`, Buffer.from(shotCodex.data, 'base64'));
    console.log('Saved mobile-375x812_codex_popup_verified_final.png');

    ws.close();
  } finally {
    chromeProcess.kill();
  }
}

run().catch(console.error);
