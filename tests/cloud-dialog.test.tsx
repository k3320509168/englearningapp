// @vitest-environment jsdom
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { expect, it } from 'vitest';
import { CloudConflict } from '../src/components/CloudSave';
import { useCloudStore } from '../src/cloud/cloudSave';

it('衝突上傳斷線後，對話保留兩份摘要與明確重試訊息', async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  document.body.innerHTML = '<div id="root"></div>';
  const root = createRoot(document.getElementById('root')!);
  useCloudStore.setState({ status: 'error', error: 'offline', conflict: {
    local: { name: '本地勇者', level: 10, regions: 1, gold: 100 },
    cloud: { name: '雲端勇者', level: 12, regions: 2, gold: 900 },
    snapshot: { data: { state: { gold: 900 }, version: 26 }, updatedAt: 'remote' },
  } });
  try {
    await act(async () => root.render(<CloudConflict />));
    expect(document.querySelector('[role="alert"]')?.textContent).toContain('offline');
    expect(document.querySelector('[role="alert"]')?.textContent).toContain('重試選擇');
    const options = [...document.querySelectorAll<HTMLButtonElement>('.conflict-card')];
    expect(options).toHaveLength(2);
    expect(options.every(b => !b.disabled)).toBe(true);
    expect(document.body.textContent).toContain('本地勇者');
    expect(document.body.textContent).toContain('雲端勇者');
  } finally {
    await act(async () => root.unmount());
    useCloudStore.setState({ conflict: null, error: '' });
  }
});
