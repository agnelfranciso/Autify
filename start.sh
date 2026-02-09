#!/bin/bash

# Autify Server Start Script
# Version: 2.5.0

# Clear the screen
clear

# Premium ASCII Art Header
echo -e "\033[1;36m"
echo "      ___         _   _  __      "
echo "     / _ \ _  _ _| |_(_)/ _|_  _ "
echo "    | (_) | || |  _| | |  _| || |"
echo "     \___/ \_,_|\__|_|_|_|  \_, |"
echo "                            |__/ "
echo -e "\033[0m"
echo "----------------------------------------"
echo "       AUTIFY MUSIC PROTOCOL v2.5.0     "
echo "----------------------------------------"

# Smart IP Detection: Specifically find the IP for Wi-Fi and ignore virtual host-only adapters (192.168.56.x)
if command -v powershell.exe &> /dev/null; then
    IP_ADDR=$(powershell.exe -NoProfile -Command "\$ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { \$_.InterfaceAlias -match 'Wi-Fi' -and \$_.Status -eq 'Up' -and \$_.IPAddress -notmatch '^192\.168\.56\.' } | Select-Object -ExpandProperty IPAddress -First 1); if(!\$ip){ \$ip = (Get-NetIPConfiguration | Where-Object { \$_.IPv4DefaultGateway -ne \$null } | Select-Object -ExpandProperty IPv4Address -First 1).IPAddress }; \$ip" | tr -d '\r')
else
    # Fallback for Linux/Mac
    IP_ADDR=$(hostname -I | tr ' ' '\n' | grep -E '^(192\.168|10\.|172\.(1[6-9]|2[0-9]|3[01]))' | grep -v '192.168.56' | head -n 1)
fi

IP_ADDR=${IP_ADDR:-"localhost"}

# Kill existing process on port 3000
echo -ne "  [!] Checking port 3000..."
if command -v taskkill.exe &> /dev/null; then
    PID=$(powershell.exe -NoProfile -Command "Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess" | tr -d '\r' | head -n 1)
    if [ ! -z "$PID" ]; then
        echo -e "\r  [!] Existing server found (PID: $PID). Killing..."
        taskkill.exe /F /PID $PID > /dev/null 2>&1
    fi
fi
echo -e "\r  \033[1;32m[✓] Port 3000 cleared.\033[0m"

echo -e "\033[1;32m  [✓] Network detected: $IP_ADDR\033[0m"
echo ""
echo -e "  🚀 \033[1mLOCAL ACCESS:\033[0m  http://localhost:3000"
echo -e "  📱 \033[1mNETWORK ACCESS:\033[0m http://$IP_ADDR:3000"
echo ""
echo "Starting Development Server..."
echo ""

npm run dev

if [ $? -ne 0 ]; then
    echo ""
    echo "[!] Server crashed or stopped."
    read -p "Press enter to exit..."
fi
