@echo off
chcp 65001 > nul
cls
echo ======================================================================
echo    STARTING PUBLIC HTTPS TUNNEL FOR STUDENT ZOMBIE METER
echo ======================================================================
echo.
echo [INFO] ระบบจะสร้างลิงก์ HTTPS สาธารณะ เพื่อให้คนอื่น/iPad/มือถือเปิดกล้องได้
echo [INFO] กรุณารัน run_app_bun.bat ในหน้าต่างอื่นก่อนเปิดไฟล์นี้
echo.
echo กำลังเชื่อมต่อท่อส่งสัญญาณ HTTPS สำหรับพอร์ต 5173...
echo.

npx localtunnel --port 5173

pause
