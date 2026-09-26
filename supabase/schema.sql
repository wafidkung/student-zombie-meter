-- ======================================================================
-- 🗄️ SUPABASE SQL SCHEMA: Student Zombie Meter (Biometric Fatigue Logs)
-- โครงสร้างฐานข้อมูลสำหรับเก็บข้อมูลชีวมิติและวิเคราะห์นาฬิกาชีวิต (Circadian Rhythm)
-- ======================================================================

-- 1. สร้างตารางหลักสำหรับเก็บประวัติการตรวจวัด (Anonymized Data)
CREATE TABLE IF NOT EXISTS public.fatigue_logs (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    session_id UUID NOT NULL,
    
    -- ฟีเจอร์ชีวมิติที่สกัดได้จากใบหน้า (Biometric Numerical Features)
    eye_openness FLOAT,
    eye_aspect_ratio FLOAT NOT NULL,
    mouth_aspect_ratio FLOAT NOT NULL,
    under_eye_darkness_ratio FLOAT NOT NULL,
    skin_texture_var FLOAT,
    
    -- ปัจจัยแวดล้อมและช่วงเวลา (Environmental Context)
    lighting_condition VARCHAR(50) DEFAULT 'Well-Lit',
    time_slot VARCHAR(50) NOT NULL, -- 'Daytime', 'Evening', 'Overnight'
    
    -- ผลลัพธ์การประเมินจากโมเดล ML (Prediction Output)
    fatigue_score FLOAT NOT NULL, -- 0.0 ถึง 100.0%
    fatigue_level VARCHAR(50) NOT NULL, -- 'Alert', 'Tired', 'Zombie'
    
    -- ข้อมูลยืนยันจากมนุษย์ (Ground Truth จาก Human-in-the-Loop Feedback)
    ground_truth_feedback VARCHAR(50), -- 'Accurate', 'False_Positive', 'Too_Low'
    user_notes TEXT
);

-- 2. สร้าง Indexes เพื่อให้การคิวรี่กราฟสถิติความเร็วสูง (High Performance Querying)
CREATE INDEX IF NOT EXISTS idx_fatigue_logs_created_at ON public.fatigue_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_fatigue_logs_time_slot ON public.fatigue_logs(time_slot);
CREATE INDEX IF NOT EXISTS idx_fatigue_logs_fatigue_level ON public.fatigue_logs(fatigue_level);

-- 3. ตั้งค่าความปลอดภัยระดับแถว (Row Level Security - RLS)
ALTER TABLE public.fatigue_logs ENABLE ROW LEVEL SECURITY;

-- อนุญาตให้เว็บหน้าบ้าน (Anonymous User) บันทึกผลการสแกนได้
CREATE POLICY "Allow anonymous insert fatigue logs" 
ON public.fatigue_logs FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

-- อนุญาตให้อ่านข้อมูลสรุปสำหรับทำกราฟ Circadian Dashboard ได้
CREATE POLICY "Allow public read for analytics" 
ON public.fatigue_logs FOR SELECT 
TO anon, authenticated
USING (true);

-- 4. ชุดข้อมูลเริ่มต้นตัวอย่าง (Seed Data) เพื่อให้แดชบอร์ดมีกราฟแสดงผลสวยงามทันที
INSERT INTO public.fatigue_logs 
(session_id, eye_openness, eye_aspect_ratio, mouth_aspect_ratio, under_eye_darkness_ratio, skin_texture_var, lighting_condition, time_slot, fatigue_score, fatigue_level, ground_truth_feedback, created_at)
VALUES 
(gen_random_uuid(), 0.78, 0.35, 0.18, 0.95, 0.65, 'Well-Lit', 'Daytime', 15.5, 'Alert', 'Accurate', NOW() - INTERVAL '6 hours'),
(gen_random_uuid(), 0.72, 0.33, 0.20, 0.92, 0.60, 'Well-Lit', 'Daytime', 24.0, 'Alert', 'Accurate', NOW() - INTERVAL '5 hours'),
(gen_random_uuid(), 0.52, 0.25, 0.30, 0.82, 0.48, 'Fluorescent', 'Evening', 48.5, 'Tired', 'Accurate', NOW() - INTERVAL '3 hours'),
(gen_random_uuid(), 0.45, 0.21, 0.38, 0.75, 0.42, 'Dim-Light', 'Evening', 62.0, 'Tired', 'Accurate', NOW() - INTERVAL '2 hours'),
(gen_random_uuid(), 0.22, 0.14, 0.48, 0.65, 0.31, 'Dim-Light', 'Overnight', 88.5, 'Zombie', 'Accurate', NOW() - INTERVAL '1 hour'),
(gen_random_uuid(), 0.18, 0.12, 0.55, 0.60, 0.28, 'Dim-Light', 'Overnight', 94.0, 'Zombie', 'Accurate', NOW());
