# Apply a V4.2 zip into %USERPROFILE%\ResonanceStudio-V4.2 only.
# Never writes into the frozen V4.01 folder (ResonanceStudio).
$ErrorActionPreference = 'Stop'
$root = Join-Path $env:USERPROFILE 'ResonanceStudio-V4.2'
$zip = Get-ChildItem "$env:USERPROFILE\Downloads\ResonanceStudio-V4.2*.zip" -ErrorAction SilentlyContinue |
  Sort-Object LastWriteTime -Descending | Select-Object -First 1
if (-not $zip) {
  $zip = Get-ChildItem "$env:USERPROFILE\Downloads\ailexsi-resonance-studio-suite-v4.2*.zip" -ErrorAction SilentlyContinue |
    Sort-Object LastWriteTime -Descending | Select-Object -First 1
}
if (-not $zip) { throw "Zip not found in Downloads (ResonanceStudio-V4.2*.zip)" }
New-Item -ItemType Directory -Force -Path $root | Out-Null

Get-NetTCPConnection -LocalPort 1421 -State Listen -ErrorAction SilentlyContinue |
  ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
Start-Sleep -Milliseconds 400

$tmp = Join-Path $env:TEMP ("rs-v42-" + [guid]::NewGuid().ToString('N'))
Expand-Archive -Path $zip.FullName -DestinationPath $tmp -Force
$inner = $tmp
foreach ($name in @(
  'ailexsi-resonance-studio-suite-v4.2',
  'ResonanceStudio-V4.2'
)) {
  if (Test-Path (Join-Path $tmp $name)) { $inner = Join-Path $tmp $name; break }
}

Get-ChildItem $inner -Force | Where-Object { $_.Name -notin @('.env', '.git', 'node_modules', 'src-tauri\target') } | ForEach-Object {
  Copy-Item $_.FullName (Join-Path $root $_.Name) -Recurse -Force
}

$viteCache = Join-Path $root 'node_modules\.vite'
if (Test-Path $viteCache) { Remove-Item $viteCache -Recurse -Force -ErrorAction SilentlyContinue }

Set-Location $root
npm install
Write-Host "V4.2 applied → $root. Cut=V. Export=WebCodecs MP4. Logo=Suite V4.2 / 4.2.0"
npm run dev
