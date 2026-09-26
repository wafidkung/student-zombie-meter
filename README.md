# 🔬 Biometric Facial Fatigue Screening System (Student Zombie Meter)
### ระบบตรวจคัดกรองความเหนื่อยล้าสะสมทางใบหน้าด้วยเทคนิคคอมพิวเตอร์วิทัศน์และการเรียนรู้ของเครื่อง
**โครงงานรายวิชา:** Machine Learning Application (100 คะแนนเต็ม)  
**รหัสนักศึกษา:** 6710210312

---

## 🚀 วิธีการรันระบบบนเครื่อง (One-Click Start)

### วิธีที่ 1: ดับเบิลคลิกไฟล์สคริปต์ (ง่ายที่สุด)
- ดับเบิลคลิกที่ไฟล์ **`run_server.bat`** บน Windows
- ระบบจะเปิดเบราว์เซอร์และสตาร์ท Server บนพอร์ต 8501 ให้อัตโนมัติทันที

### วิธีที่ 2: รันผ่าน Terminal / PowerShell
```bash
# ติดตั้งไลบรารี (หากยังไม่ได้ติดตั้ง)
pip install -r requirements.txt

# สตาร์ท Web Server
streamlit run app.py
```

---

## 📱 วิธีการเปิดใช้งานบน iPad หรือ โทรศัพท์มือถือ

1. **เปิดผ่าน Wi-Fi วงเดียวกัน (แนะนำที่สุด):**
   - ให้คอมพิวเตอร์และ iPad ต่อ Wi-Fi เดียวกัน
   - เปิด Safari บน iPad แล้วพิมพ์ URL ตามที่แสดงในหน้าต่าง `run_server.bat` เช่น:  
     👉 `http://<IP_เครื่องคอม>:8501`
   - ในหน้าเว็บ ให้เลือกแท็บ **"📁 อัปโหลดไฟล์รูปภาพ"** จากนั้นแตะที่ช่องอัปโหลด แล้วเลือก **"ถ่ายภาพ (Take Photo)"** เพื่อใช้กล้องไอแพดสแกนใบหน้าได้ทันที 100%!

2. **เปิดผ่านท่อส่ง HTTPS ปลอดภัย (Optional):**
   - ดับเบิลคลิกที่ไฟล์ **`run_tunnel_https.bat`** (ต้องติดตั้ง Node.js/npx บนเครื่อง)
   - จะได้ลิงก์ HTTPS นำไปเปิดบน iPad เพื่อเปิดฟังก์ชัน Live Camera WebRTC ได้ทันที

---

## 📂 โครงสร้างของโปรเจกต์
- `app.py`: ซอร์สโค้ดหน้าเว็บแอปพลิเคชัน (Streamlit) ดีไซน์ทางการตามมาตรฐานการแพทย์และสรีรวิทยา
- `1_prepare_dataset.py`: สคริปต์สร้างชุดข้อมูลชีวมิติ 7 ฟีเจอร์ (5 ตัวเลขชีวมิติ + 2 บริบทเชิงหมวดหมู่) พร้อมจำลอง Missing/Duplicates สำหรับการทำ Data Cleaning
- `2_train_and_evaluate.py`: สคริปต์ Preprocessing ครบวงจร (Imputation, Deduplication, One-Hot Encoding, Feature Selection, Scaling), Hyperparameter Tuning (GridSearchCV 5-Fold) และประเมินผล 3 โมเดล
- `features/feature_extractor.py`: โมดูล OpenCV สกัดสัดส่วนดวงตา (EAR), การหาว (MAR), ความคล้ำใต้ตา (LAB Relative Contrast) และผิวหน้า
- `data/fatigue_features.csv`: ชุดข้อมูล 1,500 ตัวอย่าง (พร้อม 10 Missing Values และ 5 Duplicates เพื่อสาธิต Data Cleaning)
- `models/`: เก็บโมเดล Scikit-Learn (`best_model.joblib`), Scaler, กราฟ Confusion Matrix และกราฟ Feature Importance
- `student_zombie_meter_colab.ipynb`: ไฟล์ Google Colab Notebook ฉบับสมบูรณ์ (รันได้ตั้งแต่โหลดข้อมูลจนถึงประเมินผลโมเดล)
- `FINAL_REPORT_THAI.md`: เล่มรายงานฉบับสมบูรณ์ 10 หน้าตามเกณฑ์อาจารย์ 100 คะแนน
- `run_server.bat`: สคริปต์ดับเบิลคลิกรัน Server ในเครื่องทันที
- `run_tunnel_https.bat`: สคริปต์สร้างท่อ HTTPS ชั่วคราวสำหรับ iPad (ต้องมี Node.js)
