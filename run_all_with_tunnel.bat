@echo off
chcp 65001 > nul
cls
echo ======================================================================
echo    🧟 STUDENT ZOMBIE METER - ALL-IN-ONE + CLOUDFLARE PUBLIC TUNNEL
echo    Student ID: 6710210312 | Zero Docker, Native Speed
echo ======================================================================
echo.

set "SCRIPT_DIR=%~dp0"
if "%SCRIPT_DIR:~-1%"=="\" set "SCRIPT_DIR=%SCRIPT_DIR:~0,-1%"

echo [1/3] กำลังสตาร์ท Python FastAPI AI Engine (Port 7860)...
start "Zombie Meter AI [FastAPI]" /d "%SCRIPT_DIR%\backend_hf" cmd /k "python -m uvicorn main:app --port 7860 --reload"

echo [2/3] กำลังสตาร์ท Bun SQL Server & Gateway (Port 3000)...
start "Zombie Meter SQL Gateway [Bun]" /d "%SCRIPT_DIR%" cmd /k "bun run backend_bun/server.ts"

echo.
echo [3/3] กำลังเชื่อมต่อ Cloudflare HTTPS Public Tunnel...
echo.
echo ======================================================================
echo    ⚠️ สำคัญมาก (อย่าเปิดผิดลิงก์):
echo    - ห้ามเปิด 127.0.0.1:20241/metrics (อันนั้นคือหน้าแสดงค่า Prometheus ภายใน)
echo    - ให้รอ 3 วินาที แล้วสังเกตกรอบที่มีข้อความ:
echo      👉 https://....trycloudflare.com 👈
echo    - นั่นคือลิงก์หน้าเว็บตัวจริง! ก๊อปส่งให้เพื่อนหรือเปิดในมือถือ 4G/5G ได้ทันที
echo ======================================================================
echo.

timeout /t 3 /nobreak >nul

"%SCRIPT_DIR%\cloudflared.exe" tunnel --url http://127.0.0.1:3000

pause
