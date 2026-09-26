# 🔬 Student Zombie Meter V2: Real-time Temporal Fatigue Monitor
### ระบบตรวจจับความเหนื่อยล้าสะสมและการหลับในแบบเรียลไทม์ในมิติเวลา (4 ระดับความรุนแรง)

---

## 🌟 จุดเด่นและนวัตกรรมที่พัฒนาเพิ่มขึ้นใน V2

1. **การจำแนกระดับความเหนื่อยล้า 4 ระดับ (Multi-class Fatigue Severity):**
   - **Level 0 (Green): Alert & Fresh** — สภาพร่างกายตื่นตัวปกติ พร้อมทำงาน
   - **Level 1 (Yellow): Mild Fatigue** — เริ่มมีอาการตาล้าสะสม ควรพักสายตา 20 วินาที
   - **Level 2 (Orange): Moderate Drowsiness** — ง่วงนอนชัดเจน หาวบ่อย ตาปรือ ควรดื่มน้ำหรือขยับตัว
   - **Level 3 (Red Flash): Critical Danger / Microsleep** — วิกฤต! ตาปิดค้างเกิน 1.5 วินาที สัปหงก สัญญาณไฟกระพริบเตือนฉุกเฉิน

2. **ฟีเจอร์มิติเวลามาตรฐานสากล (Temporal Features & Dynamic Biometrics):**
   - **PERCLOS (Percentage of Eye Closure):** สัดส่วนเวลาที่ตาปิดในรอบ 60 เฟรม (มาตรฐาน NHTSA สหรัฐฯ)
   - **Blink Rate (BPM):** อัตราการกะพริบตาเฉลี่ยต่อนาที
   - **EAR Dynamics:** ค่าเฉลี่ยและความแปรปรวนของการเปิดเปลือกตา (`ear_mean`, `ear_std`)
   - **Head Tilt Nodding:** ตรวจจับองศาการผงกศีรษะลงมาข้างหน้า (อาการสัปหงก)

3. **Live Heads-Up Display (HUD) Telemetry:**
   - หน้าจอแสดงผลแบบไซเบอร์พังค์/มาตรวัดทางสรีรวิทยา พร้อมเกจวัด PERCLOS แบบเรียลไทม์ และแจ้งเตือนด้วยไฟกะพริบสีแดงเมื่อถึงขั้นวิกฤต

---

## 🚀 วิธีการทดสอบใช้งาน

### วิธีที่ 1: ดับเบิลคลิกไฟล์ Batch
- ดับเบิลคลิกที่ไฟล์ **`run_v2_monitor.bat`** เพื่อเปิดกล้องเว็บแคมและรันหน้าจอ HUD ทันที

### วิธีที่ 2: รันผ่าน Terminal
```bash
# 1. สร้างชุดข้อมูลมิติเวลา 2,000 ตัวอย่าง
python 1_generate_temporal_dataset.py

# 2. เทรนโมเดล Multi-class (Random Forest / SVM / Softmax Regression)
python 2_train_multiclass_model.py

# 3. รันระบบตรวจจับสดผ่านเว็บแคม
python realtime_temporal_monitor.py
```
*(กดปุ่ม `q` หรือ `ESC` ที่หน้าต่างวิดีโอเพื่อปิดโปรแกรม)*

---

## 📂 โครงสร้างโฟลเดอร์ V2
- `1_generate_temporal_dataset.py`: สคริปต์จำลองชุดข้อมูลมิติเวลา 4 คลาส 2,000 แถว
- `2_train_multiclass_model.py`: สคริปต์เทรนโมเดล Multi-class พร้อมวาด 4x4 Confusion Matrix
- `realtime_temporal_monitor.py`: ระบบตรวจจับสดผ่านกล้องหน้าพร้อม HUD แสดงผล
- `run_v2_monitor.bat`: ไฟล์ดับเบิลคลิกเพื่อเปิดกล้องใช้งานทันที
- `data/`: เก็บชุดข้อมูล `temporal_fatigue_multiclass.csv`
- `models/`: เก็บโมเดล `multiclass_model.joblib`, `scaler.joblib`, กราฟ Confusion Matrix 4x4 และ Feature Importance
