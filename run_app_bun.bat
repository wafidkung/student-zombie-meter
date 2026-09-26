@echo off
chcp 65001 > nul
cls
echo ======================================================================
echo    STARTING STUDENT ZOMBIE METER (FASTAPI BACKEND + BUN FRONTEND)
echo ======================================================================
echo.
echo [1/2] กำลังเริ่ม FastAPI AI Inference Server (Port 7860)...
start "Zombie Meter API" cmd /k "cd /d "%~dp0backend_hf" && python -m uvicorn main:app --port 7860 --reload"

echo [2/2] กำลังเริ่ม Bun React Frontend (Port 5173)...
cd /d "%~dp0frontend"
bun run dev --host --open

pause
