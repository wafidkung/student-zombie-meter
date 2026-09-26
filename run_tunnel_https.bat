@echo off
chcp 65001 > nul
cls
echo ======================================================================
echo    STARTING SECURE HTTPS TUNNEL FOR IPAD / MOBILE CAMERA ACCESS
echo ======================================================================
echo.
echo [INFO] ระบบนี้จะสร้างลิงก์ HTTPS ชั่วคราว เพื่อให้ iPad และมือถือเปิดกล้องได้
echo [INFO] กรุณารัน run_server.bat ในหน้าต่างอื่นก่อนเปิดไฟล์นี้
echo.
echo กำลังเชื่อมต่อท่อส่งสัญญาณ HTTPS...
echo.

npx localtunnel --port 8501

pause
