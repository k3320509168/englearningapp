import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

// 最外層的防護：任何畫面出錯時不再整頁白畫面，而是說明狀況並提供備份與重置。
// 這裡刻意不引用遊戲的 store（出錯的可能就是存檔），直接操作 localStorage。
const SAVE_KEY = 'english-rpg-save';

interface State { error: Error | null; confirmReset: boolean; copied: boolean }

export default class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null, confirmReset: false, copied: false };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('遊戲發生錯誤', error, info.componentStack);
  }

  private copySave = () => {
    let raw = '';
    try { raw = localStorage.getItem(SAVE_KEY) ?? ''; } catch { /* 無法讀取 */ }
    void navigator.clipboard?.writeText(raw).then(() => this.setState({ copied: true }));
  };

  private reset = () => {
    try {
      // 重置前把目前的存檔留一份備份，萬一還想救回來
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) localStorage.setItem(`${SAVE_KEY}-before-reset-${Date.now()}`, raw);
      localStorage.removeItem(SAVE_KEY);
    } catch { /* 略過 */ }
    location.reload();
  };

  render() {
    const { error, confirmReset, copied } = this.state;
    if (!error) return this.props.children;
    return (
      <main className="crash">
        <h1>😵 遊戲發生錯誤</h1>
        <p>很抱歉，畫面讀取時出了問題。通常重新整理就會好；如果一直出現，可能是存檔資料有問題。</p>
        <p className="muted crash-detail">{error.message}</p>
        <div className="crash-actions">
          <button className="btn btn-primary" onClick={() => location.reload()}>重新整理</button>
          <button className="btn" onClick={this.copySave}>{copied ? '已複製存檔資料' : '複製存檔資料（備份）'}</button>
          {confirmReset ? (
            <button className="btn btn-danger" onClick={this.reset}>確定重置（會先備份一份）</button>
          ) : (
            <button className="btn btn-ghost" onClick={() => this.setState({ confirmReset: true })}>重置遊戲…</button>
          )}
        </div>
      </main>
    );
  }
}
