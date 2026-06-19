Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$output = Join-Path $root "dist\Collager"
$zip = Join-Path $root "dist\Collager-win-x64.zip"

if (Test-Path -LiteralPath $output) {
  Remove-Item -LiteralPath $output -Recurse -Force
}

if (Test-Path -LiteralPath $zip) {
  Remove-Item -LiteralPath $zip -Force
}

dotnet publish (Join-Path $root "MeituCollage.csproj") `
  -c Release `
  -r win-x64 `
  --self-contained true `
  -p:PublishSingleFile=false `
  -p:PublishTrimmed=false `
  -p:PublishReadyToRun=false `
  -o $output

Compress-Archive -Path (Join-Path $output "*") -DestinationPath $zip -Force

Write-Host "Collager packaged at: $output"
Write-Host "Run: $output\Collager.exe"
Write-Host "Release asset: $zip"
