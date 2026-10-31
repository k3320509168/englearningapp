import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/pixelify-sans/400.css'
import '@fontsource/pixelify-sans/700.css'
import '@fontsource/press-start-2p/400.css'
import './index.css'
import App from './App.tsx'
import ErrorBoundary from './components/ErrorBoundary.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)

// 正式版註冊 service worker：可以安裝到手機桌面、斷線時也能開啟遊戲
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => { void navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`); });
}

// 本機開發：把 store 掛到 window，方便在瀏覽器主控台測試（正式版不會有）
if (import.meta.env.DEV) {
  void Promise.all([import('./store/battleStore'), import('./store/saveStore'), import('./store/uiStore')])
    .then(([b, s, u]) => Object.assign(window, { __battle: b.useBattleStore, __save: s.useSaveStore, __ui: u.useUiStore }));
}
