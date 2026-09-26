@echo off
chcp 65001 > nul
cls
echo ======================================================================
echo    🧟 STUDENT ZOMBIE METER - ALL-IN-ONE LOCAL STACK (BUN + SQL + AI)
echo    Student ID: 6710210312 | Zero Docker, Native Speed
echo ======================================================================
echo.

:: Detect Local IPv4
set LOCAL_IP=localhost
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address" /c:"IPv4" ^| findstr "192. 10. 172."') do (
    set LOCAL_IP=%%a
)
if defined LOCAL_IP set LOCAL_IP=%LOCAL_IP: =%

echo [1/3] กำลังสตาร์ท Python FastAPI AI Engine (Port 7860)...
start "Zombie Meter AI Engine [FastAPI]" cmd /k "cd /d "%~dp0backend_hf" && python -m uvicorn main:app --port 7860 --reload"

echo [2/3] กำลังสตาร์ท Bun SQL Server & Gateway (Port 3000)...
start "Zombie Meter SQL Gateway [Bun]" cmd /k "cd /d "%~dp0" && bun run backend_bun/server.ts"

echo [3/3] กำลังสตาร์ท Vite React Frontend พร้อม HTTPS Camera (Port 5173)...
echo.
echo ======================================================================
echo    🌐 URL สำหรับเปิดใช้งาน:
echo    - คอมพิวเตอร์เครื่องนี้ (PC):  https://localhost:5173
echo    - อุปกรณ์บน Wi-Fi เดียวกัน:     https://%LOCAL_IP%:5173
echo    - Bun Standalone Production:  http://localhost:3000
echo    - SQLite Database File:        data\fatigue_history.db
echo ======================================================================
echo.

cd /d "%~dp0frontend"
bun run dev --host --open

pause
