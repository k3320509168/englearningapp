#!/bin/zsh
# 安裝三方 AI 自動接續排程（每 30 分鐘執行 scripts/ai-tick.sh）。製作人執行一次即可。
# 解除安裝：launchctl unload ~/Library/LaunchAgents/com.enggame.ai-tick.plist && rm ~/Library/LaunchAgents/com.enggame.ai-tick.plist
# 暫停（不解除安裝）：touch ~/.enggame-ai/paused　恢復：rm ~/.enggame-ai/paused
P=~/Library/LaunchAgents/com.enggame.ai-tick.plist
cat > $P <<'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>Label</key><string>com.enggame.ai-tick</string>
  <key>ProgramArguments</key><array><string>/bin/zsh</string><string>/Volumes/Dzzz_ssd/Files/Games/EngGame/scripts/ai-tick.sh</string></array>
  <key>StartInterval</key><integer>1800</integer>
  <key>StandardErrorPath</key><string>/Users/dzzz/Library/Logs/enggame-ai-tick.err</string>
</dict></plist>
EOF
launchctl unload $P 2>/dev/null
launchctl load $P && echo "✅ 已安裝：每 30 分鐘檢查一次三方 AI 額度並自動接續工作" && echo "紀錄：~/Library/Logs/enggame-ai-tick.log"
