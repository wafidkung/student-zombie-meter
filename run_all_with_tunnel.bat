@echo off
chcp 65001 > nul
cls
echo ======================================================================
echo    🧟 STUDENT ZOMBIE METER - ALL-IN-ONE + CLOUDFLARE PUBLIC TUNNEL
echo    Student ID: 6710210312 | เข้าได้จากทุกที่ทั่วโลก / เน็ตมือถือ 4G/5G
echo ======================================================================
echo.

echo [1/3] กำลังสตาร์ท Python FastAPI AI Engine (Port 7860)...
start "Zombie Meter AI [FastAPI]" cmd /k "cd /d "%~dp0backend_hf" && python -m uvicorn main:app --port 7860 --reload"

echo [2/3] กำลังสตาร์ท Bun SQL Server & Gateway (Port 3000)...
start "Zombie Meter SQL Gateway [Bun]" cmd /k "cd /d "%~dp0" && bun run backend_bun/server.ts"

echo [3/3] กำลังเชื่อมต่อ Cloudflare HTTPS Public Tunnel...
echo.
echo ======================================================================
echo    🌐 กำลังดึงลิงก์ HTTPS จาก Cloudflare...
echo    เมื่อลิงก์ขึ้นมา (รูปแบบ https://....trycloudflare.com)
echo    สามารถก็อปลิงก์ส่งให้เพื่อน หรือเปิดจากมือถือ/เน็ต 4G/5G ได้ทันที!
echo ======================================================================
echo.

"%~dp0cloudflared.exe" tunnel --url http://localhost:3000

pause
