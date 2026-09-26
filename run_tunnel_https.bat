@echo off
chcp 65001 > nul
cls
echo ======================================================================
echo    🌐 CLOUDFLARE PUBLIC HTTPS TUNNEL (ข้าม Wi-Fi / เน็ตมือถือ 4G/5G)
echo    Student ID: 6710210312 | Zero Docker, Native Speed
echo ======================================================================
echo.

:: 1. ตรวจสอบและสตาร์ท Python FastAPI Engine หากยังไม่เปิด
netstat -ano | findstr /r /c:":7860 .*LISTENING" >nul
if %errorlevel% neq 0 (
    echo [1/3] กำลังสตาร์ท Python AI Engine (Port 7860)...
    start "Zombie Meter AI [FastAPI]" cmd /k "cd /d "%~dp0backend_hf" && python -m uvicorn main:app --port 7860 --reload"
) else (
    echo [✓] Python AI Engine (Port 7860) พร้อมทำงานแล้ว
)

:: 2. ตรวจสอบและสตาร์ท Bun SQL Server หากยังไม่เปิด
netstat -ano | findstr /r /c:":3000 .*LISTENING" >nul
if %errorlevel% neq 0 (
    echo [2/3] กำลังสตาร์ท Bun SQL Gateway (Port 3000)...
    start "Zombie Meter SQL Gateway [Bun]" cmd /k "cd /d "%~dp0" && bun run backend_bun/server.ts"
    timeout /t 3 /nobreak >nul
) else (
    echo [✓] Bun SQL Gateway (Port 3000) พร้อมทำงานแล้ว
)

echo.
echo [3/3] กำลังเชื่อมต่อ Cloudflare HTTPS Public Tunnel...
echo.
echo ======================================================================
echo    🌐 รอสักครู่ สังเกตบรรทัดที่มีข้อความ:
echo    https://....trycloudflare.com
echo.
echo    -> ก็อปลิงก์ดังกล่าวส่งให้เพื่อน หรือเปิดจากมือถือ 4G/5G ได้ทันที!
echo ======================================================================
echo.

"%~dp0cloudflared.exe" tunnel --url http://127.0.0.1:3000

pause
