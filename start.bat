@echo off
TITLE Autify Server Control
cd /d "%~dp0"

:: Use PowerShell to find the specific Wi-Fi IP (192.168.1.73 in your case)
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
    "Write-Host '      ___         _   _  __      ' -ForegroundColor Cyan; " ^
    "Write-Host '     / _ \ _  _ _| |_(_)/ _|_  _ ' -ForegroundColor Cyan; " ^
    "Write-Host '    | (_) | || |  _| | |  _| || |' -ForegroundColor Cyan; " ^
    "Write-Host '     \___/ \_,_|\__|_|_|_|  \_, |' -ForegroundColor Cyan; " ^
    "Write-Host '                            |__/ ' -ForegroundColor Cyan; " ^
    "Write-Host ' ----------------------------------------' -ForegroundColor Gray; " ^
    "Write-Host '      AUTIFY MUSIC PROTOCOL v1.0.0     ' -ForegroundColor Gray; " ^
    "Write-Host ' ----------------------------------------' -ForegroundColor Gray; " ^
    "$p = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue; " ^
    "if($p){ Write-Host ' [!] Removing old session on 3000...' -ForegroundColor Yellow; Stop-Process -Id $p.OwningProcess -Force }; " ^
    "$ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -match 'Wi-Fi' -and $_.Status -eq 'Up' -and $_.IPAddress -notmatch '^192\.168\.56\.' } | Select-Object -ExpandProperty IPAddress -First 1); " ^
    "if(!$ip){ $ip = (Get-NetIPConfiguration | Where-Object { $_.IPv4DefaultGateway -ne $null } | Select-Object -ExpandProperty IPv4Address -First 1).IPAddress }; " ^
    "Write-Host \" [✓] Network Access: http://$($ip):3000\" -ForegroundColor Green; " ^
    "Write-Host ' [✓] Starting Next.js...' -ForegroundColor Green; "

echo.

call npm run dev

if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERROR] Server failed to start.
    pause
)
