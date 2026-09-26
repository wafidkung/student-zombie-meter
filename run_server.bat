@echo off
chcp 65001 > nul
cls
echo ======================================================================
echo    BIOMETRIC FACIAL FATIGUE SCREENING SYSTEM (WEB APPLICATION)
echo ======================================================================
echo.
echo [INFO] กำลังเตรียมความพร้อมระบบ Server ภายในเครื่อง...
echo.

:: ดึง IPv4 ของเครื่องเพื่อความสะดวกในการเปิดจาก iPad หรือโทรศัพท์มือถือ
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address" /c:"IPv4" ^| findstr "192. 10. 172."') do (
    set LOCAL_IP=%%a
)
if defined LOCAL_IP set LOCAL_IP=%LOCAL_IP: =%

echo [✓] วิธีการเปิดใช้งานระบบ:
echo     - เปิดบนคอมพิวเตอร์เครื่องนี้:  http://localhost:8501
echo     - เปิดบน iPad / มือถือ (Wi-Fi):  http://%LOCAL_IP%:8501
echo.
echo [✓] กำลังเปิดเว็บเบราว์เซอร์และสตาร์ท Streamlit Web Server...
echo ======================================================================
echo.

python -m streamlit run app.py --server.port 8501

pause
