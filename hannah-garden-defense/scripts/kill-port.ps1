param(
    [Parameter(Mandatory = $false)]
    [int]$Port = 5050
)

$ErrorActionPreference = 'SilentlyContinue'

$pids = @(
    Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue |
        Select-Object -ExpandProperty OwningProcess -Unique
)

if ($pids.Count -eq 0) {
    Write-Host "Port $Port is free."
    exit 0
}

foreach ($procId in $pids) {
    if (-not $procId) { continue }
    Write-Host "Stopping prior server on port $Port (PID $procId)..."
    Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
}

Start-Sleep -Seconds 1
exit 0
