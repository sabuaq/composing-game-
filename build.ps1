# Builds the Windows exe files (installer + portable) into the "dist" folder.
# The build runs in %LOCALAPPDATA% so node_modules is not synced by Google Drive.
# Requires Node.js. Usage: powershell -ExecutionPolicy Bypass -File build.ps1
$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$work = Join-Path $env:LOCALAPPDATA 'SakkyokuRenshuGame\build'
New-Item -ItemType Directory -Force $work | Out-Null

# Fresh copy of the app sources (keep node_modules for faster rebuilds)
foreach ($p in @('main.js', 'preload.js', 'scanner.js', 'icon.png', 'renderer', 'dist')) {
  $t = Join-Path $work $p
  if (Test-Path $t) { Remove-Item -Recurse -Force $t }
}
Copy-Item (Join-Path $here 'app\main.js'), (Join-Path $here 'app\preload.js'), (Join-Path $here 'app\scanner.js'), (Join-Path $here 'app\icon.png') $work
Copy-Item -Recurse (Join-Path $here 'app\renderer') $work
Copy-Item (Join-Path $here 'build\package.json') $work -Force

Set-Location $work
npm install --no-audit --no-fund
if ($LASTEXITCODE -ne 0) { throw 'npm install failed' }

# electron-builder needs the winCodeSign tools (rcedit sets the exe icon). Its archive also has
# macOS symlinks, which Windows cannot create without admin rights, so electron-builder's own
# extraction fails. Extract it here once and skip those symlink errors (only Windows files are used).
$wcsVer = 'winCodeSign-2.6.0'
$wcsDir = Join-Path $env:LOCALAPPDATA "electron-builder\Cache\winCodeSign\$wcsVer"
if (-not (Test-Path (Join-Path $wcsDir 'rcedit-x64.exe'))) {
  $wcsZip = Join-Path $env:TEMP "$wcsVer.7z"
  Invoke-WebRequest "https://github.com/electron-userland/electron-builder-binaries/releases/download/$wcsVer/$wcsVer.7z" -OutFile $wcsZip
  New-Item -ItemType Directory -Force $wcsDir | Out-Null
  & (Join-Path $work 'node_modules\7zip-bin\win\x64\7za.exe') x -bd -y $wcsZip "-o$wcsDir" | Out-Null
  if (-not (Test-Path (Join-Path $wcsDir 'rcedit-x64.exe'))) { throw 'winCodeSign extraction failed' }
}

npx electron-builder --win --publish never
if ($LASTEXITCODE -ne 0) { throw 'electron-builder failed' }

$out = Join-Path $here 'dist'
New-Item -ItemType Directory -Force $out | Out-Null
Get-ChildItem (Join-Path $work 'dist') -Filter '*.exe' | Copy-Item -Destination $out -Force
Get-ChildItem $out -Filter '*.exe' | ForEach-Object { '{0}  {1:N1} MB' -f $_.Name, ($_.Length / 1MB) }
