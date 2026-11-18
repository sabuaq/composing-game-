# Electron (the app runtime) is installed into LocalAppData, not into Google Drive,
# so that thousands of node_modules files are not synced.
$rt = Join-Path $env:LOCALAPPDATA 'SakkyokuRenshuGame\runtime'
New-Item -ItemType Directory -Force $rt | Out-Null
Set-Location $rt
if (-not (Test-Path package.json)) { '{"name":"runtime","private":true}' | Out-File -Encoding ascii package.json }
npm install electron --no-audit --no-fund
if (-not (Test-Path 'node_modules\electron\dist\electron.exe')) { node node_modules\electron\install.js }
if (Test-Path 'node_modules\electron\dist\electron.exe') { Write-Host 'OK: setup finished' } else { Write-Host 'NG: electron.exe not found'; Read-Host 'Press Enter' }
