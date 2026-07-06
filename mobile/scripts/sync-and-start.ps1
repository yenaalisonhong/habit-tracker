# Sync, start Expo, and generate a scannable QR code image.
$ErrorActionPreference = 'Stop'

$src = Split-Path $PSScriptRoot -Parent
$dst = Join-Path $env:LOCALAPPDATA 'habit-tracker-mobile'

Write-Host "Syncing mobile app..."
Write-Host "  from: $src"
Write-Host "  to:   $dst"

New-Item -ItemType Directory -Force -Path $dst | Out-Null
robocopy $src $dst /MIR /XD node_modules .expo .git /NFL /NDL /NJH /NJS | Out-Null
if ($LASTEXITCODE -gt 7) {
    throw "robocopy failed with exit code $LASTEXITCODE"
}

Set-Location $dst

if (-not (Test-Path 'node_modules')) {
    Write-Host 'Installing dependencies (first run)...'
    npm install
}

foreach ($port in 8081, 8082, 8083) {
    Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue |
        ForEach-Object {
            $proc = Get-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue
            if ($proc -and $proc.Name -eq 'node') {
                Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
                Write-Host "Freed port $port"
            }
        }
}

$lanIp = (
    Get-NetIPAddress -AddressFamily IPv4 |
    Where-Object {
        $_.InterfaceAlias -notmatch 'Loopback|vEthernet|WSL|Virtual' -and
        $_.IPAddress -notmatch '^169\.'
    } |
    Select-Object -First 1
).IPAddress

if (-not $lanIp) {
    throw 'Could not detect LAN IP. Connect to Wi-Fi and retry.'
}

$expUrl = "exp://${lanIp}:8081"
$qrPath = Join-Path $dst 'expo-qr.png'

Write-Host ''
Write-Host '=========================================='
Write-Host "Expo URL: $expUrl"
Write-Host '=========================================='
Write-Host ''

$qrApi = "https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=$([uri]::EscapeDataString($expUrl))"
Invoke-WebRequest -Uri $qrApi -OutFile $qrPath
Write-Host "QR saved: $qrPath"
Start-Process $qrPath

Write-Host ''
Write-Host 'Starting Expo (LAN mode, port 8081)...'
Write-Host 'Phone must be on the same Wi-Fi as this PC.'
Write-Host 'In Expo Go: Scan QR or enter URL manually.'
Write-Host ''

npx expo start --lan --clear --port 8081 @args
