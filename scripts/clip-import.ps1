# 把剪貼簿裡的 Gemini 出題 JSON 存到題庫備份資料夾，再匯入題庫（chat-batch.ts import）。
#   powershell -File scripts/clip-import.ps1 -Level 0 -Skill listening
param(
  [int]$Level = 0,
  [string]$Skill = 'writing',
  [string]$Archive = 'D:\Game_q_storege'
)
$text = Get-Clipboard -Raw
if (-not $text -or -not $text.TrimStart().StartsWith('{')) { Write-Output '剪貼簿裡沒有 JSON'; exit 1 }
$file = Join-Path $Archive ("L{0}-{1}-{2}.json" -f $Level, $Skill, (Get-Date -Format 'yyyyMMdd-HHmmss'))
[IO.File]::WriteAllText($file, $text, (New-Object Text.UTF8Encoding $false))
Set-Clipboard -Value ' '  # 清掉，避免下一批重複匯入同一份
Set-Location (Join-Path $PSScriptRoot '..')
npx tsx scripts/chat-batch.ts import --level $Level --skill $Skill --file $file 2>&1 | Select-Object -First 4
