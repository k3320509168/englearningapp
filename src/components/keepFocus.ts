import type React from 'react';

// 按鈕被點擊後不搶走焦點，避免之後按 Enter / 空白鍵又觸發同一顆按鈕
export const keepFocus = (e: React.MouseEvent) => e.preventDefault();
