Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$payload = Join-Path $root "dist\Collager-win-x64.zip"
$installerOutput = Join-Path $root "dist\installer"
$installerFile = Join-Path $installerOutput "Collager-Setup.exe"
$finalInstaller = Join-Path $root "dist\Collager-Setup.exe"

if (-not (Test-Path -LiteralPath $payload)) {
  & (Join-Path $PSScriptRoot "package-windows.ps1")
}

if (Test-Path -LiteralPath $installerOutput) {
  Remove-Item -LiteralPath $installerOutput -Recurse -Force
}

dotnet publish (Join-Path $root "Installer\CollagerInstaller.csproj") `
  -c Release `
  -r win-x64 `
  --self-contained true `
  -p:PublishSingleFile=true `
  -p:PublishTrimmed=false `
  -p:PublishReadyToRun=false `
  -p:PayloadZip="$payload" `
  -o $installerOutput

if ($LASTEXITCODE -ne 0) {
  exit $LASTEXITCODE
}

Copy-Item -LiteralPath $installerFile -Destination $finalInstaller -Force

Write-Host "Collager installer created at: $finalInstaller"
