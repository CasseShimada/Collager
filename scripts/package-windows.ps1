Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$output = Join-Path $root "dist\Collager"

dotnet publish (Join-Path $root "MeituCollage.csproj") `
  -c Release `
  -r win-x64 `
  --self-contained true `
  -p:PublishSingleFile=false `
  -p:PublishTrimmed=false `
  -p:PublishReadyToRun=false `
  -o $output

Write-Host "Collager packaged at: $output"
Write-Host "Run: $output\Collager.exe"
