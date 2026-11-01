#!/bin/zsh
# 三方 AI 自動接續（每 30 分鐘執行一次）。
# 執行方式：在 Claude Code 終端機分頁跑 scripts/ai-loop.sh（launchd 讀不到外接碟，已不用）
# - Codex：閒置 15 分鐘以上、額度還夠（或已過重置時間）→ 用 codex exec 接續 PM_STATUS 佇列
# - Antigravity：沒有任務在跑、不在冷卻中 → 用 agy -p 接續佇列；額度用完自動降級模型，全部用完冷卻 1 小時
# - Claude 由 Claude Code 自己的排程喚醒，不在這裡處理
# 紀錄：~/Library/Logs/enggame-ai-tick.log；停用：launchctl unload ~/Library/LaunchAgents/com.enggame.ai-tick.plist
export PATH=/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin:/usr/sbin:/sbin
MAIN=/Volumes/Dzzz_ssd/Files/Games/EngGame
CODEX_WT=/Users/dzzz/.codex/worktrees/question-bank-advanced/EngGame
AGY_WT=/Users/dzzz/agy-worktrees/EngGame
CODEX=/Applications/ChatGPT.app/Contents/Resources/codex-cli/bin/codex
AGY=/Applications/Gemini.app/Contents/Helpers/agy
STATE=$HOME/.enggame-ai
LOG=$HOME/Library/Logs/enggame-ai-tick.log
mkdir -p $STATE
now=$(date +%s)
log() { echo "$(date '+%m-%d %H:%M') $*" >> $LOG; }

[ -d $MAIN ] || { log "外接碟未掛載，略過"; exit 0; }
[ -f $STATE/paused ] && { log "已暫停（$STATE/paused），略過"; exit 0; }

# ---------- Codex ----------
codex_tick() {
  pgrep -f 'codex-cli/bin/codex exec' >/dev/null && { log "Codex：exec 執行中，略過"; return; }
  recent=$(find ~/.codex/sessions -name '*.jsonl' -mmin -15 2>/dev/null | wc -l | tr -d ' ')
  [ "$recent" -gt 0 ] && { log "Codex：15 分鐘內有動作（App 或 exec 工作中），略過"; return; }
  f=$(ls -t ~/.codex/sessions/*/*/*/*.jsonl 2>/dev/null | head -1)
  rl=$(grep -o '"primary":{"used_percent":[0-9.]*,"window_minutes":[0-9]*,"resets_at":[0-9]*},"secondary":{"used_percent":[0-9.]*,"window_minutes":[0-9]*,"resets_at":[0-9]*' "$f" | tail -1)
  if [ -n "$rl" ]; then
    p=${$(echo $rl | sed -E 's/.*"primary":\{"used_percent":([0-9]+).*/\1/'):-0}
    pr=$(echo $rl | sed -E 's/.*"primary".*"resets_at":([0-9]+)\},"secondary".*/\1/')
    s=${$(echo $rl | sed -E 's/.*"secondary":\{"used_percent":([0-9]+).*/\1/'):-0}
    sr=$(echo $rl | sed -E 's/.*"secondary".*"resets_at":([0-9]+)$/\1/')
    if [ "$s" -ge 95 ] && [ "$now" -lt "$sr" ]; then log "Codex：每週已用 $s%，等 $(date -r $sr '+%m-%d %H:%M') 重置"; return; fi
    if [ "$p" -ge 90 ] && [ "$now" -lt "$pr" ]; then log "Codex：5 小時已用 $p%，等 $(date -r $pr '+%H:%M') 重置"; return; fi
  fi
  log "Codex：喚醒接續佇列"
  ( cd $CODEX_WT && $CODEX exec -s workspace-write --add-dir $AGY_WT --add-dir $MAIN/.git "$(cat $MAIN/scripts/prompts/codex-tick.txt)" >> $STATE/codex-last.log 2>&1; log "Codex：本輪結束（exit $?）" ) &
}

# ---------- Antigravity ----------
agy_tick() {
  pgrep -f 'Helpers/agy -[pi]' >/dev/null && { log "Antigravity：任務執行中，略過"; return; }
  cd=$(cat $STATE/agy-cooldown 2>/dev/null || echo 0)
  [ "$now" -lt "$cd" ] && { log "Antigravity：額度冷卻到 $(date -r $cd '+%H:%M')"; return; }
  # 先同步 PM 最新文件
  git -C $AGY_WT merge -q --no-edit feat/round4 >/dev/null 2>&1 || git -C $AGY_WT merge --abort >/dev/null 2>&1
  log "Antigravity：喚醒接續佇列"
  (
    cd $AGY_WT
    for m in gemini-4-argon-high gemini-4-argon-medium gemini-3.8-flash-high; do
      out=$($AGY -p "$(cat $MAIN/scripts/prompts/agy-tick.txt)

（本次使用模型：$m）" --model $m --mode accept-edits 2>&1)
      echo "=== $(date) $m ===\n$out" >> $STATE/agy-last.log
      if echo "$out" | grep -qiE 'quota|exhausted|rate.?limit|429|usage limit'; then log "Antigravity：$m 額度用完，降級"; continue; fi
      log "Antigravity：本輪結束（$m）"; exit 0
    done
    echo $(( $(date +%s) + 3600 )) > $STATE/agy-cooldown; log "Antigravity：全部模型額度用完，冷卻 1 小時"
  ) &
}

codex_tick
agy_tick
wait
