# 🚀 คู่มือการ Deploy ระบบ Student Zombie Meter (ฟรี 100% ตลอดชีพ)
### สถาปัตยกรรม 3 ชั้น: Vercel (หน้าบ้าน) + Hugging Face (AI Backend) + Supabase (ฐานข้อมูล)
**รหัสนักศึกษา:** 6710210312

---

## 💻 1. วิธีทดสอบรันบนเครื่องของคุณเอง (Local Run)
เพียงดับเบิลคลิกไฟล์:
👉 **`run_app_bun.bat`**
* ระบบจะเปิด **FastAPI Backend** บนพอร์ต `7860` ให้อัตโนมัติ
* ระบบจะเปิด **Bun React Frontend** บนพอร์ต `5173` และเด้งเปิดเบราว์เซอร์ให้ทันที!

---

## 🧠 2. วิธีนำ AI Backend ขึ้น Hugging Face Spaces (ฟรี RAM 16GB)
1. เข้าเว็บ [huggingface.co/spaces](https://huggingface.co/spaces) แล้วล็อกอิน
2. คลิก **"Create new Space"**
   - **Space name:** `student-zombie-meter-api`
   - **License:** `mit`
   - **Select the Space SDK:** เลือก **Docker** (Blank)
   - **Space hardware:** เลือก **CPU basic • 2 vCPU • 16 GB • Free**
3. เมื่อสร้างเสร็จ ให้นำไฟล์ทั้งหมดในโฟลเดอร์ `backend_hf/` บนเครื่องของคุณ อัปโหลดขึ้นไป:
   - `Dockerfile`
   - `main.py`
   - `feature_extractor.py`
   - `requirements.txt`
   - โฟลเดอร์ `models/` (มี `best_model.joblib`, `scaler.joblib`, `feature_cols.joblib`)
4. รอระบบ Build ประมาณ 1 นาที จะได้ Direct API URL เช่น:  
   👉 `https://wafidkung-student-zombie-meter-api.hf.space`

---

## 🗄️ 3. วิธีตั้งค่าฐานข้อมูล Supabase (ฟรี 500MB)
1. เข้าเว็บ [supabase.com](https://supabase.com) แล้วล็อกอิน
2. คลิก **"New Project"** ตั้งชื่อโปรเจกต์ เช่น `zombie-meter-db` และตั้ง Database Password
3. เมื่อสร้างเสร็จ ไปที่เมนูด้านซ้าย **SQL Editor**
4. เปิดไฟล์ [`supabase/schema.sql`](file:///d:/6710210312/final_project_ml/supabase/schema.sql) ในเครื่องของคุณ ก๊อบปี้โค้ดทั้งหมดไปวางใน SQL Editor แล้วกด **"Run"**
5. ไปที่ **Project Settings > API** จะเห็น:
   - `Project URL`
   - `anon public key`
6. นำค่าทั้งสองไปใส่ในไฟล์ `frontend/.env`:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   VITE_API_URL=https://your-hf-space.hf.space
   ```
   *(หมายเหตุ: หากยังไม่ได้ใส่ค่า ระบบหน้าเว็บจะใช้ LocalStorage เป็นระบบสำรองอัตโนมัติ ทำให้ใช้งานและโชว์กราฟได้ทันทีโดยไม่พัง)*

---

## 🌐 4. วิธีนำหน้าเว็บบน Vercel (เปิดกล้องบนมือถือ/iPad ได้ทันที)
1. เข้าเว็บ [vercel.com](https://vercel.com) แล้วล็อกอินด้วย GitHub
2. คลิก **"Add New Project"** เลือก Repository `student-zombie-meter`
3. ในหน้าการตั้งค่าก่อน Deploy:
   - **Root Directory:** คลิก Edit แล้วเลือกโฟลเดอร์ **`frontend`**
   - **Build Command:** `bun run build` (หรือ Vercel ตรวจจับ Vite ให้อัตโนมัติ)
   - **Environment Variables:** ใส่ `VITE_API_URL` และ `VITE_SUPABASE_URL` ที่ได้จากข้อ 2 และ 3
4. คลิก **"Deploy"** รอประมาณ 30 วินาที จะได้ URL เว็บจริง เช่น:  
   👉 `https://student-zombie-meter.vercel.app`
5. นำ URL นี้ไปเปิดบน Safari ใน iPad หรือ Chrome ในสมาร์ตโฟน แล้วสแกนหน้าได้ทันที 60 FPS!
