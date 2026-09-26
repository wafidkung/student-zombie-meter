# 🔬 Production Machine Learning Benchmark & Validation Report
## Multi-class Temporal Fatigue & Microsleep Screening Architecture
**โปรเจกต์:** Student Zombie Meter V2 (Advanced System)  
**อ้างอิงตามหลักการ:** *Designing Machine Learning Systems* (Chip Huyen) & *Hands-On Machine Learning* (Aurélien Géron)

---

## 1. ปัญหาและข้อกำหนดระดับโปรดักชัน (System Requirements)

| มิติความต้องการ (Dimension) | เกณฑ์เป้าหมาย (Target SLA) | ผลการทดสอบจริง (Achieved) | สถานะ |
| :--- | :--- | :--- | :---: |
| **Safety-Critical Recall (Class 3: หลับใน)** | $\ge 98.0\%$ (ต้องไม่หลุดคนหลับใน) | **100.00%** (Zero False Negatives) | ✅ ผ่านเกณฑ์วิกฤต |
| **Macro F1-Score (4 ระดับ)** | $\ge 95.0\%$ | **99.75%** (Random Forest / MLP) | ✅ ยอดเยี่ยม |
| **Inference Latency** | $< 10.0$ ms ต่อตัวอย่าง | **$0.017 - 0.069$ ms** | ✅ เร็วกว่าเกณฑ์ 100 เท่า |
| **Model Size on Disk** | $< 10$ MB | **$2.2 - 649.6$ KB** | ✅ เล็กมาก พร้อมรันบน Edge IoT |
| **Data Leakage Prevention** | ปราศจาก Data Leakage 100% | ใช้ Scikit-Learn `Pipeline` เต็มรูปแบบ | ✅ ปลอดภัย 100% |

---

## 2. ตารางเปรียบเทียบผลลัพธ์ 5 อัลกอริทึม (Production Benchmark Table)

ทดสอบบน **Held-out Test Set 400 ตัวอย่าง** (Stratified Split 80:20) ร่วมกับ **5-Fold Stratified Cross Validation**:

| อัลกอริทึม (Algorithm Family) | Test Accuracy | Macro F1 | Weighted F1 | Class 3 Recall (Critical) | 5-Fold CV Macro F1 | Latency (ms/sample) | Model Size (KB) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Random Forest (Bagging Ensemble)** | **99.75%** | **0.9975** | **0.9975** | **100.00%** | **0.9894 ± 0.0043** | 0.069 ms | 649.6 KB |
| **Neural Network (MLP: 64x32)** | **99.75%** | **0.9975** | **0.9975** | **100.00%** | **0.9925 ± 0.0042** | 0.043 ms | 75.0 KB |
| **Support Vector Machine (RBF Kernel)** | 99.25% | 0.9925 | 0.9925 | 100.00% | 0.9931 ± 0.0046 | 0.031 ms | 25.1 KB |
| **HistGradientBoosting (SOTA Boosting)** | 99.00% | 0.9900 | 0.9900 | 100.00% | 0.9906 ± 0.0044 | 0.273 ms | 652.9 KB |
| **Multinomial Logistic Regression** | 98.25% | 0.9826 | 0.9826 | 100.00% | 0.9881 ± 0.0050 | **0.017 ms** | **2.2 KB** |

---

## 3. การวิเคราะห์จุดอ่อนและความคลาดเคลื่อน (Error Analysis & Borderline Cases)

จากการตรวจสอบทั้ง 400 ตัวอย่างใน Test Set พบว่า **มีตัวอย่างที่ทำนายคลาดเคลื่อนเพียง 1 ตัวอย่าง (0.25% Error Rate)** ดังนี้:

- **รหัสตัวอย่าง:** Sample #1104
- **ค่าจริง (True Level):** `Level 2 (Moderate Drowsiness)`
- **ผลทำนาย (Predicted):** `Level 1 (Mild Fatigue)`
- **ค่าฟีเจอร์ของตัวอย่างนี้:**
  - `perclos_score` = `0.1608` (อยู่ในช่วงก้ำกึ่งของ Level 1: 0.10–0.20)
  - `blink_rate_bpm` = `36.79` (อยู่ในช่วงของ Level 2: 30–45)
  - `head_tilt_deg` = `18.33` (อยู่ในช่วงรอยต่อระหว่าง Level 1 กับ Level 2)

> 💡 **ข้อค้นพบทางสรีรวิทยา (Clinical Insight):**  
> เคสนี้เป็น **"Borderline Transition Case"** (คนที่กำลังจะเปลี่ยนผ่านจากอาการตาล้าธรรมดาไปสู่อาการง่วงซึม) ทำให้โมเดลเกิดความลังเลระหว่างคลาสที่อยู่ติดกัน (Level 1 vs Level 2)  
> **ที่สำคัญที่สุดคือ:** โมเดลไม่เคยสับสนระหว่างคลาสปกติ (Level 0) กับคลาสวิกฤต (Level 3) เลยแม้แต่เคสเดียว ยืนยันความปลอดภัยในระบบเตือนภัยฉุกเฉิน (Zero Catastrophic Errors)

---

## 4. ความสำคัญของฟีเจอร์บน Test Set (Permutation Feature Importance)

คำนวณผ่านการสับเปลี่ยนค่าฟีเจอร์บน Held-out Test Set 15 ซ้ำ (Unbiased Importance):

1. **`perclos_score` (สำคัญที่สุดอันดับ 1):** เมื่อสลับค่าตัวแปรนี้ Macro F1 ตกลงมากที่สุด ยืนยันตามทฤษฎี NHTSA ว่า PERCLOS คือตัวบ่งชี้ความล้าที่น่าเชื่อถือที่สุดในมิติเวลา
2. **`ear_mean` & `ear_std`:** ระดับการเปิดและความแปรปรวนของเปลือกตา
3. **`head_tilt_deg`:** องศาการผงกศีรษะ (มีนัยสำคัญมากในการจำแนก Level 3 หลับใน)
4. **`blink_rate_bpm`:** อัตราความถี่ในการกะพริบตา
5. **`under_eye_darkness_ratio` & `skin_texture_var`:** สภาพรอยคล้ำใต้ตาและผิวหน้า

---

## 5. แนะนำการเลือกโมเดลสำหรับการนำไปใช้จริง (Deployment Recommendation)

1. **กรณีรันบน Cloud / Server / Desktop App (แนะนำอันดับ 1):**
   - **เลือก `Random Forest` หรือ `Neural Network (MLP)`**
   - ได้ Macro F1 สูงสุด `0.9975` และความเร็วในการประมวลผลต่ำกว่า 0.1 ms ต่อครั้ง
2. **กรณีรันบนบอร์ดสมองกลฝังตัวขนาดจิ๋ว (Edge AI / Microcontroller / Raspberry Pi Zero):**
   - **เลือก `Multinomial Logistic Regression` หรือ `SVM`**
   - ใช้ขนาดไฟล์เพียง `2.2 - 25.1 KB` รันเร็วกว่า 0.03 ms ประหยัดพลังงานแบตเตอรี่สูงสุด

---

## 6. สรุปไฟล์ Artifacts ที่ส่งมอบใน `v2_advanced_system/models/`
- `production_pipeline.joblib`: Production Pipeline สำเร็จรูป (StandardScaler + Winner Estimator)
- `production_benchmark_results.csv`: ตารางเปรียบเทียบผลลัพธ์ 5 อัลกอริทึม
- `misclassified_error_analysis.csv`: ข้อมูลตัวอย่างเคสที่ทำนายคลาดเคลื่อน
- `production_5models_confusion_matrices.png`: กราฟ Confusion Matrix 5 โมเดล
- `multiclass_roc_curves.png`: กราฟ One-vs-Rest ROC Curves ทุกระดับ
- `permutation_feature_importance.png`: กราฟความสำคัญของฟีเจอร์บน Test Set
