# AILEXSI Resonance Studio Suite V4.2 (4.2.0)
#
# THIS IS NOT EXPORT. WebM is NEVER a success path.
# Real export = WebCodecs H.264 + AAC MP4 (closed milestone:
# smooth video + full-strength music). Do not treat a converted
# leftover .webm as a finished render.
#
# Runs only against %USERPROFILE%\ResonanceStudio-V4.2.
# Never writes into the frozen V4.01 folder (ResonanceStudio).

$ErrorActionPreference = "Stop"

$root = Join-Path $env:USERPROFILE "ResonanceStudio-V4.2"
if (-not (Test-Path $root)) {
  Write-Host "STOP: $root not found. Suite V4.2 lives only there — not ResonanceStudio (V4.01)." -ForegroundColor Red
  exit 1
}

$here = (Resolve-Path $PSScriptRoot).Path
$rootFull = (Resolve-Path $root).Path
if ($here -ne $rootFull) {
  Write-Host "STOP: script must live in ResonanceStudio-V4.2 (found $here)" -ForegroundColor Red
  exit 1
}

Write-Host "Suite V4.2 / 4.2.0 — leftover .webm remux only. Not an export success." -ForegroundColor Yellow

$ff = Get-Command ffmpeg -ErrorAction SilentlyContinue
if (-not $ff) {
  Write-Host "ffmpeg fehlt. Install: winget install Gyan.FFmpeg" -ForegroundColor Red
  exit 1
}

$webm = Get-ChildItem $root -Filter "*.webm" -File -ErrorAction SilentlyContinue |
  Sort-Object LastWriteTime -Descending |
  Select-Object -First 1

if (-not $webm) {
  Write-Host "No leftover .webm in $root. That is correct — V4.2 export already writes .mp4." -ForegroundColor Yellow
  exit 1
}

$out = Join-Path $root ($webm.BaseName + ".mp4")
Write-Host "LEGACY remux only (not export): $($webm.Name) → $out" -ForegroundColor Cyan

& ffmpeg -y -i $webm.FullName `
  -c:v libx264 -preset veryfast -crf 23 -pix_fmt yuv420p `
  -c:a aac -b:a 192k -movflags +faststart `
  $out

if (Test-Path $out) {
  Write-Host "Wrote leftover remux (still not an export success): $out" -ForegroundColor Green
  explorer.exe /select,$out
} else {
  Write-Host "ffmpeg fehlgeschlagen" -ForegroundColor Red
  exit 1
}
