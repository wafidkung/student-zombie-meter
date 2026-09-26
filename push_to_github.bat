@echo off
chcp 65001 > nul
cls
echo ======================================================================
echo    PUSHING STUDENT ZOMBIE METER PROJECT TO GITHUB
echo ======================================================================
echo.
echo [INFO] กำลังเชื่อมต่อและ Push โค้ดไปยัง:
echo        https://github.com/wafidkung/student-zombie-meter.git
echo.
echo [INFO] กำลังเปิดหน้าต่างยืนยันตัวตน...
echo        - หากมีหน้าต่างเด้งขึ้นมา ให้คลิก "Sign in with your browser"
echo.
cd /d "%~dp0"
git push -u origin main
echo.
if %errorlevel% equ 0 (
    echo ======================================================================
    echo [SUCCESS] Push โค้ดขึ้น GitHub สำเร็จเรียบร้อยแล้ว 100%%!
    echo เข้าดูโปรเจกต์ของคุณได้ที่:
    echo 👉 https://github.com/wafidkung/student-zombie-meter
    echo ======================================================================
) else (
    echo [ERROR] หากติดปัญหา ลองตรวจสอบว่าได้ล็อกอินบัญชี wafidkung บนเบราว์เซอร์แล้วหรือไม่
)
echo.
pause
