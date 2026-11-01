#!/bin/zsh
# 三方 AI 狀態：最新存檔點、是否正在工作、Codex 額度、任務看板最後留言
MAIN=/Volumes/Dzzz_ssd/Files/Games/EngGame
CODEX=/Users/dzzz/.codex/worktrees/question-bank-advanced/EngGame
AGY=/Users/dzzz/agy-worktrees/EngGame

echo "======== Claude（PM／整合，feat/round4）========"
git -C $MAIN log --oneline -3 --format='  %ar｜%s'

echo "\n======== Codex（主工程師，codex/advanced-question-banks）========"
git -C $CODEX log --oneline -3 --format='  %ar｜%s'
n=$(git -C $CODEX status --short | wc -l | tr -d ' ')
recent=$(find ~/.codex/sessions -name '*.jsonl' -mmin -5 2>/dev/null | wc -l | tr -d ' ')
[ "$recent" -gt 0 ] && echo "  狀態：🟢 工作中（5 分鐘內有動作，未存檔修改 $n 個檔）" || echo "  狀態：⚪ 閒置（未存檔修改 $n 個檔）"
f=$(ls -t ~/.codex/sessions/*/*/*/*.jsonl 2>/dev/null | head -1)
if [ -n "$f" ]; then
  rl=$(grep -o '"primary":{"used_percent":[0-9.]*,"window_minutes":[0-9]*,"resets_at":[0-9]*},"secondary":{"used_percent":[0-9.]*' "$f" | tail -1)
  p=$(echo $rl | sed -E 's/.*"primary":\{"used_percent":([0-9.]+).*/\1/')
  s=$(echo $rl | sed -E 's/.*"secondary":\{"used_percent":([0-9.]+).*/\1/')
  [ -n "$rl" ] && echo "  額度：5 小時已用 ${p}%｜每週已用 ${s}%"
fi

echo "\n======== Antigravity（內容／測試，agy/work）========"
git -C $AGY log --oneline -3 --format='  %ar｜%s'
cnt=$(pgrep -f 'Helpers/agy -[pi]' | wc -l | tr -d ' ')
[ "$cnt" -gt 0 ] && echo "  狀態：🟢 工作中（$cnt 個任務）" || echo "  狀態：⚪ 閒置"

echo "\n======== 任務看板最後 3 則留言（docs/COLLAB.md）========"
grep -E '^- 2026' $MAIN/docs/COLLAB.md | tail -3 | cut -c1-160
echo "\n完整任務表：docs/PM_STATUS.md 第 5 節"
