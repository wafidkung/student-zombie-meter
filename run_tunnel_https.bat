@echo off
chcp 65001 > nul
cls
echo ======================================================================
echo    🌐 CLOUDFLARE PUBLIC HTTPS TUNNEL (ข้าม Wi-Fi / เน็ตมือถือ 4G/5G)
echo    Student ID: 6710210312 | Zero Docker, Native Speed
echo ======================================================================
echo.

set "SCRIPT_DIR=%~dp0"
if "%SCRIPT_DIR:~-1%"=="\" set "SCRIPT_DIR=%SCRIPT_DIR:~0,-1%"

:: 1. ตรวจสอบและสตาร์ท Python FastAPI Engine หากยังไม่เปิด
netstat -ano | findstr /r /c:":7860 .*LISTENING" >nul
if %errorlevel% neq 0 (
    echo [1/3] กำลังสตาร์ท Python AI Engine (Port 7860)...
    start "Zombie Meter AI [FastAPI]" /d "%SCRIPT_DIR%\backend_hf" cmd /k "python -m uvicorn main:app --port 7860 --reload"
) else (
    echo [✓] Python AI Engine (Port 7860) กำลังทำงานอยู่แล้ว
)

:: 2. ตรวจสอบและสตาร์ท Bun SQL Server หากยังไม่เปิด
netstat -ano | findstr /r /c:":3000 .*LISTENING" >nul
if %errorlevel% neq 0 (
    echo [2/3] กำลังสตาร์ท Bun SQL Gateway (Port 3000)...
    start "Zombie Meter SQL Gateway [Bun]" /d "%SCRIPT_DIR%" cmd /k "bun run backend_bun/server.ts"
    timeout /t 3 /nobreak >nul
) else (
    echo [✓] Bun SQL Gateway (Port 3000) กำลังทำงานอยู่แล้ว
)

echo.
echo [3/3] กำลังเชื่อมต่อ Cloudflare HTTPS Public Tunnel...
echo.
echo ======================================================================
echo    ⚠️ สำคัญมาก (อย่าเปิดผิดลิงก์):
echo    - ห้ามเปิด 127.0.0.1:20241/metrics (อันนั้นคือหน้าสถิติระบบภายใน)
echo    - ให้รอสักครู่ แล้วสังเกตกรอบที่มีข้อความ:
echo      👉 https://....trycloudflare.com 👈
echo    - นั่นคือลิงก์หน้าเว็บตัวจริง! ก๊อปส่งให้เพื่อนหรือเปิดในมือถือ 4G/5G ได้ทันที
echo ======================================================================
echo.

"%SCRIPT_DIR%\cloudflared.exe" tunnel --url http://127.0.0.1:3000

pause
