# Apply a ResonanceStudio zip into THIS folder (must be the V4.2 tree).
$ErrorActionPreference = "Stop"
$Target = $PSScriptRoot
if ($Target -notmatch 'ResonanceStudio-V4\.2') {
  Write-Host "Refusing to apply: this script lives outside ResonanceStudio-V4.2 ($Target)" -ForegroundColor Red
  exit 1
}
$z = Get-ChildItem "$env:USERPROFILE\Downloads\ResonanceStudio-V*.zip" |
  Sort-Object LastWriteTime -Descending | Select-Object -First 1
if (-not $z) { Write-Host "No ResonanceStudio-V*.zip in Downloads"; exit 1 }
Write-Host "Applying $($z.Name) → $Target"
Get-NetTCPConnection -LocalPort 1421 -ErrorAction SilentlyContinue | ForEach-Object {
  Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
}
$temp = Join-Path $env:TEMP ("rs-" + [guid]::NewGuid().ToString("N").Substring(0, 8))
Expand-Archive $z.FullName $temp -Force
$root = $temp
if (Test-Path "$temp\ailexsi-resonance-studio-suite-v4.2") { $root = "$temp\ailexsi-resonance-studio-suite-v4.2" }
elseif (Test-Path "$temp\ResonanceStudio-V4.2") { $root = "$temp\ResonanceStudio-V4.2" }
Get-ChildItem $root -Force | Where-Object { $_.Name -notin @('.env', '.git', 'node_modules', 'src-tauri\target') } | ForEach-Object {
  Copy-Item $_.FullName (Join-Path $Target $_.Name) -Recurse -Force
}
Set-Location $Target
npm install
Write-Host "Browser: npm run dev | Desktop MP4: npm run tauri:dev (needs Rust + ffmpeg)"
