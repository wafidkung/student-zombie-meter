import os
import sys
import numpy as np
import pandas as pd

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

def generate_fatigue_dataset(n_samples=1500, random_state=42):
    """
    สร้างชุดข้อมูลจำลองตามเกณฑ์อาจารย์แบบครบทุกมิติ (15 คะแนนเต็ม):
    - Numerical Features: eye_openness, ear, mar, darkness_ratio, skin_texture
    - Categorical Features: lighting_condition, time_slot (สำหรับทำ Encoding)
    - Data Cleaning: มี Missing Values เล็กน้อย และ Duplicate Rows เพื่อโชว์ขั้นตอน Cleaning
    """
    np.random.seed(random_state)
    n_per_class = n_samples // 2

    # 1. ฟีเจอร์ตัวเลขสำหรับกลุ่มสดชื่น (Fresh - Class 0)
    eye_openness_0 = np.random.normal(0.75, 0.12, n_per_class)
    ear_0 = np.random.normal(0.34, 0.05, n_per_class)
    mar_0 = np.random.normal(0.23, 0.05, n_per_class)
    darkness_0 = np.random.normal(0.96, 0.08, n_per_class)
    texture_0 = np.random.normal(0.70, 0.13, n_per_class)
    lighting_0 = np.random.choice(['Well-Lit', 'Fluorescent', 'Dim-Light'], size=n_per_class, p=[0.6, 0.3, 0.1])
    time_0 = np.random.choice(['Daytime', 'Evening', 'Overnight'], size=n_per_class, p=[0.7, 0.25, 0.05])

    # 2. ฟีเจอร์ตัวเลขสำหรับกลุ่มเหนื่อยล้า (Fatigued - Class 1)
    eye_openness_1 = np.random.normal(0.47, 0.13, n_per_class)
    ear_1 = np.random.normal(0.23, 0.05, n_per_class)
    mar_1 = np.random.normal(0.40, 0.14, n_per_class)
    darkness_1 = np.random.normal(0.82, 0.09, n_per_class)
    texture_1 = np.random.normal(0.48, 0.14, n_per_class)
    lighting_1 = np.random.choice(['Well-Lit', 'Fluorescent', 'Dim-Light'], size=n_per_class, p=[0.2, 0.3, 0.5])
    time_1 = np.random.choice(['Daytime', 'Evening', 'Overnight'], size=n_per_class, p=[0.1, 0.3, 0.6])

    # รวมข้อมูล
    eye_openness = np.concatenate([eye_openness_0, eye_openness_1])
    ear = np.concatenate([ear_0, ear_1])
    mar = np.concatenate([mar_0, mar_1])
    darkness = np.concatenate([darkness_0, darkness_1])
    texture = np.concatenate([texture_0, texture_1])
    lighting = np.concatenate([lighting_0, lighting_1])
    time_slot = np.concatenate([time_0, time_1])
    target = np.array([0] * n_per_class + [1] * n_per_class)

    # แทรกความแปรปรวนเชิงอัตวิสัยในโลกจริง (Realistic Noise / Borderline Cases 2%)
    # เช่น บางคนอดนอนแต่เบิกตากว้าง หรือคนปกติที่ตาเล็กแต่กำเนิด
    flip_indices = np.random.choice(n_samples, size=int(n_samples * 0.02), replace=False)
    target[flip_indices] = 1 - target[flip_indices]

    df = pd.DataFrame({
        'eye_openness': np.round(np.clip(eye_openness, 0.1, 1.0), 4),
        'eye_aspect_ratio': np.round(np.clip(ear, 0.08, 0.50), 4),
        'mouth_aspect_ratio': np.round(np.clip(mar, 0.10, 0.85), 4),
        'under_eye_darkness_ratio': np.round(np.clip(darkness, 0.50, 1.15), 4),
        'skin_texture_var': np.round(np.clip(texture, 0.10, 1.0), 4),
        'lighting_condition': lighting,
        'time_slot': time_slot,
        'target': target
    })

    # สุ่มแทรก Missing Values 10 จุด เพื่อโชว์ขั้นตอน Imputation/Cleaning ในรายงาน
    missing_indices = np.random.choice(df.index, size=10, replace=False)
    df.loc[missing_indices, 'skin_texture_var'] = np.nan

    # สุ่มแทรกแถวซ้ำ (Duplicate) 5 แถว เพื่อโชว์ขั้นตอน Deduplication
    duplicate_rows = df.iloc[:5].copy()
    df = pd.concat([df, duplicate_rows], ignore_index=True)

    # สับเปลี่ยนแถวแบบสุ่ม
    df = df.sample(frac=1, random_state=random_state).reset_index(drop=True)

    os.makedirs('data', exist_ok=True)
    csv_path = os.path.join('data', 'fatigue_features.csv')
    df.to_csv(csv_path, index=False)
    print(f"Dataset บันทึกสำเร็จที่: {csv_path}")
    print(f"ขนาดข้อมูล: {len(df)} แถว (รวม Missing 10 จุด และ Duplicate 5 แถว)")

if __name__ == '__main__':
    generate_fatigue_dataset()
