# Apply LATEST from the V4.2 repo bridge folder. Never writes into V4.01.
$ErrorActionPreference = "Stop"
$Repo = if ($env:AILEXSI_RS) { $env:AILEXSI_RS } else { Join-Path $env:USERPROFILE "ResonanceStudio-V4.2" }
$Target = Join-Path $env:USERPROFILE "ResonanceStudio-V4.2"

Set-Location $Repo
git pull origin main 2>$null

$latestPath = Join-Path $Repo "bridge\LATEST.json"
if (-not (Test-Path $latestPath)) {
  Write-Host "STOP: no bridge/LATEST.json in $Repo" -ForegroundColor Yellow
  return
}

$latest = Get-Content $latestPath -Raw | ConvertFrom-Json
if ($latest.status -ne "ready") {
  Write-Host "STOP: status=$($latest.status)" -ForegroundColor Yellow
  return
}

# path "." / "repo-root" / empty → repo root is the payload (see bridge/LATEST.json)
$pathKey = [string]$latest.path
if ($latest.payload -eq "repo-root" -or $pathKey -eq "" -or $pathKey -eq "." -or $pathKey -eq "repo-root") {
  $payload = $Repo
} else {
  $payload = Join-Path $Repo "bridge" $pathKey "payload"
}
if (-not (Test-Path $payload)) {
  Write-Host "STOP: payload missing $payload" -ForegroundColor Red
  return
}

Write-Host "Applying $($latest.product) $($latest.version) → $Target" -ForegroundColor Cyan
Get-NetTCPConnection -LocalPort 1421 -ErrorAction SilentlyContinue | ForEach-Object {
  Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
}

$exclude = @('.env', '.env.local', '.git', 'node_modules')
if ($latest.exclude) {
  $exclude = @($latest.exclude | ForEach-Object { ($_ -split '[\\/]')[0] })
}
Get-ChildItem $payload -Force | Where-Object {
  $_.Name -notin $exclude
} | ForEach-Object {
  Copy-Item $_.FullName (Join-Path $Target $_.Name) -Recurse -Force
}

Set-Location $Target
npm install
@{ version = $latest.version; appliedAt = (Get-Date).ToString("o") } | ConvertTo-Json | Set-Content .\bridge-state.json
Write-Host "DROP FERTIG $($latest.version)" -ForegroundColor Green
