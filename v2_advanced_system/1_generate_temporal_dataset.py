import os
import sys
import numpy as np
import pandas as pd

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

def generate_temporal_fatigue_dataset(n_samples_per_class=500, random_state=42):
    """
    สร้างชุดข้อมูลจำลองความเหนื่อยล้าในมิติเวลา (Temporal & Dynamic Biometrics)
    แบ่งเป็น 4 ระดับตามมาตรฐาน Karolinska Sleepiness Scale (KSS):
      - Class 0: Alert & Fresh (ตื่นตัวเต็มที่)
      - Class 1: Mild Fatigue (ตาล้าสะสม/เริ่มเหนื่อย)
      - Class 2: Moderate Drowsiness (ง่วงนอน/เริ่มหาว)
      - Class 3: Critical Danger / Microsleep (หลับใน/อันตรายขั้นวิกฤต)
    """
    np.random.seed(random_state)
    n = n_samples_per_class

    # 1. Class 0: Alert (ตื่นตัวปกติ)
    ear_mean_0 = np.random.normal(0.35, 0.03, n)
    ear_std_0 = np.random.normal(0.04, 0.01, n)
    perclos_0 = np.random.normal(0.05, 0.02, n)          # PERCLOS ต่ำมาก (ตาเปิดแทบตลอดเวลา)
    blink_rate_0 = np.random.normal(16.0, 3.0, n)        # กะพริบตาปกติ 12-20 ครั้ง/นาที
    yawns_0 = np.random.poisson(0.1, n)                  # แทบไม่มีการหาว
    head_tilt_0 = np.random.normal(5.0, 2.5, n)          # ศีรษะตั้งตรง มุมก้มต่ำกว่า 10 องศา
    darkness_0 = np.random.normal(0.97, 0.05, n)
    texture_0 = np.random.normal(0.72, 0.10, n)

    # 2. Class 1: Mild Fatigue (เริ่มล้าสะสม)
    ear_mean_1 = np.random.normal(0.30, 0.04, n)
    ear_std_1 = np.random.normal(0.06, 0.015, n)
    perclos_1 = np.random.normal(0.15, 0.04, n)          # PERCLOS เริ่มขึ้นมาที่ 10-20%
    blink_rate_1 = np.random.normal(26.0, 4.5, n)        # กะพริบตาถี่ขึ้นเพื่อชดเชยอาการตาแห้ง
    yawns_1 = np.random.poisson(1.0, n)
    head_tilt_1 = np.random.normal(10.0, 3.5, n)
    darkness_1 = np.random.normal(0.90, 0.06, n)
    texture_1 = np.random.normal(0.62, 0.11, n)

    # 3. Class 2: Moderate Drowsiness (ง่วงนอนชัดเจน)
    ear_mean_2 = np.random.normal(0.24, 0.04, n)
    ear_std_2 = np.random.normal(0.08, 0.02, n)
    perclos_2 = np.random.normal(0.32, 0.06, n)          # PERCLOS อยู่ที่ 25-40%
    blink_rate_2 = np.random.normal(36.0, 6.0, n)        # กะพริบตาถี่หรือกะพริบนาน
    yawns_2 = np.random.poisson(2.8, n)                  # เริ่มหาวบ่อย
    head_tilt_2 = np.random.normal(18.0, 5.0, n)         # หัวเริ่มเอน/โน้มไปข้างหน้า
    darkness_2 = np.random.normal(0.83, 0.07, n)
    texture_2 = np.random.normal(0.52, 0.12, n)

    # 4. Class 3: Critical Danger / Microsleep (หลับใน / วิกฤต)
    ear_mean_3 = np.random.normal(0.14, 0.04, n)
    ear_std_3 = np.random.normal(0.09, 0.025, n)
    perclos_3 = np.random.normal(0.65, 0.12, n)          # PERCLOS เกิน 50-80% (ตาปิดเป็นเวลานาน)
    blink_rate_3 = np.random.normal(12.0, 4.0, n)        # กะพริบตาน้อยลงเพราะตาแทบจะปิดค้าง
    yawns_3 = np.random.poisson(4.5, n)
    head_tilt_3 = np.random.normal(32.0, 7.0, n)         # สัปหงก ศีรษะทิ่มลงเกิน 25-45 องศา
    darkness_3 = np.random.normal(0.74, 0.08, n)
    texture_3 = np.random.normal(0.42, 0.12, n)

    # รวมข้อมูลทั้ง 4 คลาส
    ear_mean = np.concatenate([ear_mean_0, ear_mean_1, ear_mean_2, ear_mean_3])
    ear_std = np.concatenate([ear_std_0, ear_std_1, ear_std_2, ear_std_3])
    perclos = np.concatenate([perclos_0, perclos_1, perclos_2, perclos_3])
    blink_rate = np.concatenate([blink_rate_0, blink_rate_1, blink_rate_2, blink_rate_3])
    yawns = np.concatenate([yawns_0, yawns_1, yawns_2, yawns_3])
    head_tilt = np.concatenate([head_tilt_0, head_tilt_1, head_tilt_2, head_tilt_3])
    darkness = np.concatenate([darkness_0, darkness_1, darkness_2, darkness_3])
    texture = np.concatenate([texture_0, texture_1, texture_2, texture_3])
    targets = np.array([0]*n + [1]*n + [2]*n + [3]*n)

    df = pd.DataFrame({
        'ear_mean': np.round(np.clip(ear_mean, 0.05, 0.50), 4),
        'ear_std': np.round(np.clip(ear_std, 0.01, 0.20), 4),
        'perclos_score': np.round(np.clip(perclos, 0.0, 1.0), 4),
        'blink_rate_bpm': np.round(np.clip(blink_rate, 4.0, 60.0), 2),
        'yawn_frequency': np.clip(yawns, 0, 10),
        'head_tilt_deg': np.round(np.clip(head_tilt, 0.0, 60.0), 2),
        'under_eye_darkness_ratio': np.round(np.clip(darkness, 0.50, 1.20), 4),
        'skin_texture_var': np.round(np.clip(texture, 0.10, 1.0), 4),
        'target_level': targets
    })

    # สับเปลี่ยนแถว
    df = df.sample(frac=1, random_state=random_state).reset_index(drop=True)

    data_dir = os.path.join(os.path.dirname(__file__), 'data')
    os.makedirs(data_dir, exist_ok=True)
    out_path = os.path.join(data_dir, 'temporal_fatigue_multiclass.csv')
    df.to_csv(out_path, index=False)

    print(f"✅ สร้างชุดข้อมูลสำเร็จ: {out_path}")
    print(f"📦 จำนวนตัวอย่าง: {len(df)} แถว (4 คลาส คลาสละ {n} ตัวอย่าง)")
    print(f"📊 รายการฟีเจอร์มิติเวลา: {list(df.columns[:-1])}")
    return df

if __name__ == '__main__':
    generate_temporal_fatigue_dataset()
