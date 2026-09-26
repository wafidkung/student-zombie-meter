@echo off
chcp 65001 > nul
cls
echo ======================================================================
echo    STARTING PUBLIC HTTPS TUNNEL FOR STUDENT ZOMBIE METER
echo ======================================================================
echo.
echo [INFO] กำลังเปิดท่อสัญญาณ HTTPS ด้วยชื่อโดเมนที่จำง่าย...
echo.
echo 🌐 ลิงก์สำหรับส่งให้อาจารย์และเพื่อนเปิดสแกนหน้า:
echo 👉 https://student-zombie-meter.loca.lt
echo.
echo (หมายเหตุ: รัน run_app_bun.bat ในหน้าต่างอื่นก่อนเปิดไฟล์นี้นะครับ)
echo.

npx localtunnel --port 5173 --subdomain student-zombie-meter

pause
