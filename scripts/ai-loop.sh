#!/bin/zsh
# 在終端機分頁持續執行：每 30 分鐘跑一次 ai-tick.sh，並把結果印在畫面上。Ctrl+C 停止。
while true; do
  zsh /Volumes/Dzzz_ssd/Files/Games/EngGame/scripts/ai-tick.sh
  echo "\n===== $(date '+%m-%d %H:%M') 檢查結果 ====="; tail -4 ~/Library/Logs/enggame-ai-tick.log
  sleep 1800
done
