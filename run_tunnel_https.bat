@echo off
chcp 65001 > nul
cls
echo ======================================================================
echo    STARTING DIRECT CLOUDFLARE HTTPS TUNNEL (NO WARNING / NO IP PROMPT)
echo ======================================================================
echo.
echo [INFO] กำลังสร้างท่อส่งสัญญาณ HTTPS ผ่าน Cloudflare Tunnel...
echo [INFO] ลิงก์ที่ได้จะเข้าหน้าเว็บได้ทันที 100%% โดยไม่มีหน้าถาม IP มากวนใจ!
echo.

"%~dp0cloudflared.exe" tunnel --url https://localhost:5173 --no-tls-verify

pause
