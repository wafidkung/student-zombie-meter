import os
import sys
import io
import time

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

import joblib
import numpy as np
import pandas as pd
from typing import Optional, List, Dict
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from PIL import Image

# Import feature extractor
try:
    from feature_extractor import extract_facial_features
except ImportError:
    from backend_hf.feature_extractor import extract_facial_features

# ======================================================================
# 🚀 INITIALIZE FASTAPI & LOAD MODELS (V1 & V2)
# ======================================================================
app = FastAPI(
    title="Student Zombie Meter - Dual Engine API (V1 Snapshot & V2 Temporal)",
    description="Production Machine Learning Inference API supporting V1 Snapshot & V2 Temporal Multi-class Systems",
    version="2.1.0"
)

# Enable CORS for Vercel and local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")

# 1. Load V1 Artifacts
MODEL_V1_PATH = os.path.join(MODELS_DIR, "best_model.joblib")
SCALER_V1_PATH = os.path.join(MODELS_DIR, "scaler.joblib")
FEATURE_COLS_V1_PATH = os.path.join(MODELS_DIR, "feature_cols.joblib")

print("🔄 Loading V1 Scikit-Learn model artifacts...")
model_v1 = joblib.load(MODEL_V1_PATH)
scaler_v1 = joblib.load(SCALER_V1_PATH)
feature_cols_v1 = joblib.load(FEATURE_COLS_V1_PATH)
print("✅ V1 Model loaded successfully!")

# 2. Load V2 Artifacts (Production Pipeline)
MODEL_V2_PATH = os.path.join(MODELS_DIR, "production_pipeline_v2.joblib")
v2_artifact = None
if os.path.exists(MODEL_V2_PATH):
    try:
        v2_artifact = joblib.load(MODEL_V2_PATH)
        print("✅ V2 Advanced Production Pipeline loaded successfully!")
        print(f"   V2 Algorithm: {v2_artifact['model_name']} (Accuracy: {v2_artifact['benchmark_metrics']['Test Accuracy']*100:.2f}%)")
    except Exception as e:
        print(f"⚠️ Warning loading V2 model: {e}")

# ======================================================================
# 📐 DATA MODELS (PYDANTIC)
# ======================================================================

# V1 Input (Snapshot)
class FeatureInputV1(BaseModel):
    eye_openness: float = Field(..., ge=0.0, le=1.0, description="Eye openness ratio (0-1)")
    eye_aspect_ratio: float = Field(..., ge=0.0, le=1.0, description="Eye Aspect Ratio (EAR)")
    mouth_aspect_ratio: float = Field(..., ge=0.0, le=1.5, description="Mouth Aspect Ratio (MAR)")
    under_eye_darkness_ratio: float = Field(..., ge=0.0, le=2.0, description="Under-eye darkness relative to forehead")
    skin_texture_var: float = Field(..., ge=0.0, le=2.0, description="Laplacian variance of facial skin")
    lighting_condition: str = Field(default="Well-Lit", description="Well-Lit, Dim-Light, Fluorescent")
    time_slot: str = Field(default="Daytime", description="Daytime, Evening, Overnight")

# V2 Input (Temporal Windowing)
class TemporalFeaturesV2Input(BaseModel):
    ear_mean: float = Field(0.28, ge=0.0, le=0.6, description="Average EAR over temporal window")
    ear_std: float = Field(0.04, ge=0.0, le=0.2, description="Standard deviation of EAR")
    perclos_score: float = Field(0.15, ge=0.0, le=1.0, description="Percentage of Eye Closure (0-1)")
    blink_rate_bpm: float = Field(18.0, ge=0.0, le=60.0, description="Blinks per minute")
    yawn_frequency: float = Field(0.5, ge=0.0, le=10.0, description="Yawns per minute")
    head_tilt_deg: float = Field(4.5, ge=0.0, le=60.0, description="Head tilt angle in degrees")
    under_eye_darkness_ratio: float = Field(0.85, ge=0.0, le=2.0, description="Under-eye darkness ratio")
    skin_texture_var: float = Field(0.60, ge=0.0, le=2.0, description="Skin texture variance")

# Responses
class PredictionV1Response(BaseModel):
    status: str
    engine_version: str = "V1-Snapshot"
    fatigue_score: float
    alertness_score: float
    fatigue_level: str
    prediction_label: int
    badge: str
    summary: str
    recommendations: List[str]
    inference_time_ms: float
    model_name: str
    annotated_image_url: Optional[str] = None
    biometrics_detail: Optional[Dict] = None

class PredictionV2Response(BaseModel):
    status: str
    engine_version: str = "V2-Temporal-Multiclass"
    level_index: int
    level_name: str
    fatigue_score: float
    alertness_score: float
    class_probabilities: Dict[str, float]
    badge: str
    summary: str
    recommendations: List[str]
    inference_time_ms: float
    model_name: str
    benchmark_metrics: Optional[Dict] = None
    annotated_image_url: Optional[str] = None
    biometrics_detail: Optional[Dict] = None

# ======================================================================
# 🩺 DIAGNOSIS HELPERS
# ======================================================================
def get_diagnosis_v1(prediction: int, fatigue_prob: float):
    fatigue_score = round(float(fatigue_prob) * 100, 1)
    alertness_score = round((1.0 - float(fatigue_prob)) * 100, 1)

    if prediction == 0:
        return {
            "fatigue_level": "Alert",
            "badge": "🟢 สดชื่น / ตื่นตัวพร้อมเรียน (Fresh Student)",
            "fatigue_score": fatigue_score,
            "alertness_score": alertness_score,
            "summary": "ระบบประเมินว่าคุณมีความพร้อมในการเรียนรู้ในเกณฑ์ดี สัดส่วนดวงตาเปิดกว้างปกติ",
            "recommendations": [
                "รักษาระดับสมาธิและดื่มน้ำสม่ำเสมอ (จิบน้ำทุก 30 นาที)",
                "รักษาระยะห่างจากหน้าจออย่างน้อย 50-70 เซนติเมตร",
                "ใช้กฎ 20-20-20 พักสายตามองไกล 20 ฟุตทุกๆ 20 นาที"
            ]
        }
    elif fatigue_prob >= 0.75:
        return {
            "fatigue_level": "Zombie",
            "badge": "🔴 ซอมบี้โหมด / ล้าขั้นวิกฤต (Zombie Alert!)",
            "fatigue_score": fatigue_score,
            "alertness_score": alertness_score,
            "summary": "ตรวจพบสัญญาณความเหนื่อยล้าสะสมขั้นรุนแรง มีอัตราการหาวหรือเปลือกตาตกเด่นชัด มีภาวะเสี่ยงต่อการหลับใน",
            "recommendations": [
                "⚠️ ควรงดการอ่านหนังสือหักโหม หรือขับขี่ยานพาหนะทันที",
                "นอนหลับพักผ่อนอย่างน้อย 6-8 ชั่วโมงเพื่อฟื้นฟูสมอง",
                "หากจำเป็นต้องอ่านต่อ ให้งีบหลับสั้นแบบ Power Nap (15-20 นาที)"
            ]
        }
    else:
        return {
            "fatigue_level": "Tired",
            "badge": "🟡 เริ่มล้าสะสม / ควรพักสายตา (Moderate Fatigue)",
            "fatigue_score": fatigue_score,
            "alertness_score": alertness_score,
            "summary": "พบสัญญาณความอ่อนล้าทางสายตาและกล้ามเนื้อใบหน้า ความคล้ำใต้ตาหรือการกะพริบตาเริ่มช้าลง",
            "recommendations": [
                "ลุกขึ้นยืดเหยียดกล้ามเนื้อคอ บ่า ไหล่ 5 นาที",
                "ล้างหน้าด้วยน้ำเย็นเพื่อกระตุ้นการไหลเวียนโลหิต",
                "พักสายตาจากจอดิจิทัลสัก 10-15 นาที"
            ]
        }

def get_diagnosis_v2(level_idx: int, probas: List[float]):
    class_labels = [
        "Level 0: Alert (ตื่นตัวพร้อมเรียน)",
        "Level 1: Mild Fatigue (ล้าเล็กน้อย)",
        "Level 2: Moderate Drowsy (ง่วงปานกลาง)",
        "Level 3: Critical Microsleep (วิกฤตซอมบี้โหมด)"
    ]
    # Continuous score based on weighted expected level
    weighted_score = sum(i * p for i, p in enumerate(probas)) / 3.0 * 100.0
    fatigue_score = round(weighted_score, 1)
    alertness_score = round(100.0 - fatigue_score, 1)

    diagnoses = {
        0: {
            "badge": "🟢 Level 0: Alert (สมองแล่นเต็มร้อย)",
            "summary": "สรีรวิทยาชีวมิติอยู่ในภาวะตื่นตัวสมบูรณ์ ค่า PERCLOS และอัตราการหาวต่ำมาก มีความพร้อมในการอ่านหนังสือสอบ 100%",
            "recs": ["พร้อมลุยงานเต็มที่ จิบน้ำสม่ำเสมอ", "ตั้งเป้าอ่านหนังสือเป็นช่วงๆ แบบ Pomodoro 25 นาที"]
        },
        1: {
            "badge": "🟡 Level 1: Mild Fatigue (เริ่มล้าเล็กน้อย)",
            "summary": "ตรวจพบอัตราการกะพริบตาถี่ขึ้นเล็กน้อย เริ่มมีการสั่นไหวของเปลือกตา (EAR Std เพิ่มขึ้น)",
            "recs": ["พักกะพริบตาช้าๆ 10 ครั้งเพื่อเพิ่มความชุ่มชื้นให้ดวงตา", "ปรับท่านั่งให้หลังตรง ไม่ก้มหน้าใกล้จอเกินไป"]
        },
        2: {
            "badge": "🟠 Level 2: Moderate Drowsy (ง่วงปานกลาง)",
            "summary": "ค่า PERCLOS เกินเกณฑ์มาตรฐาน เริ่มมีการหาวซ้ำ และศีรษะเริ่มเอียง (Head Tilt)",
            "recs": ["ลุกเดินยืดเส้นยืดสาย 5-10 นาที", "ล้างหน้าด้วยน้ำเย็นเพื่อกระตุ้นระบบประสาทซิมพาเทติก"]
        },
        3: {
            "badge": "🔴 Level 3: Critical Microsleep (ซอมบี้ขั้นวิกฤต!)",
            "summary": "ตรวจพบภาวะการหลับในระยะสั้น (Microsleep Warning) เปลือกตาปิดสนิทเกิน 30% ของเวลา และคอพับสัปหงกชัดเจน",
            "recs": ["🛑 หยุดกิจกรรมที่ต้องใช้สมาธิสูงหรือการขับรถทันที", "นอนหลับพักผ่อนทันที ร่างกายอยู่ในภาวะ Sleep Debt สะสม"]
        }
    }

    diag = diagnoses[level_idx]
    return {
        "level_name": class_labels[level_idx],
        "fatigue_score": fatigue_score,
        "alertness_score": alertness_score,
        "badge": diag["badge"],
        "summary": diag["summary"],
        "recommendations": diag["recs"]
    }

# ======================================================================
# 🌐 API ENDPOINTS
# ======================================================================
@app.get("/")
def read_root():
    return {
        "project": "Student Zombie Meter API",
        "author_id": "6710210312",
        "status": "online",
        "engines": {
            "v1": {
                "name": "V1 Instant Snapshot Classifier",
                "endpoint": "POST /api/v1/predict",
                "model": type(model_v1).__name__
            },
            "v2": {
                "name": "V2 Advanced Temporal Multi-class Pipeline",
                "endpoint": "POST /api/v2/predict_temporal",
                "status": "active" if v2_artifact else "offline",
                "model": v2_artifact['model_name'] if v2_artifact else None
            }
        },
        "endpoints": {
            "v1_predict": "POST /api/v1/predict",
            "v1_predict_image": "POST /api/v1/predict_image",
            "v2_predict_temporal": "POST /api/v2/predict_temporal",
            "health": "GET /health"
        }
    }

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "timestamp": time.time(),
        "v1_ready": True,
        "v2_ready": v2_artifact is not None
    }

# --- V1: Instant Snapshot Prediction ---
@app.post("/api/v1/predict", response_model=PredictionV1Response)
def predict_v1(data: FeatureInputV1):
    start_time = time.time()
    
    input_dict = {
        'eye_openness': data.eye_openness,
        'eye_aspect_ratio': data.eye_aspect_ratio,
        'mouth_aspect_ratio': data.mouth_aspect_ratio,
        'under_eye_darkness_ratio': data.under_eye_darkness_ratio,
        'skin_texture_var': data.skin_texture_var,
        'lighting_condition': data.lighting_condition,
        'time_slot': data.time_slot
    }

    input_df = pd.DataFrame([input_dict])
    input_encoded = pd.get_dummies(input_df, columns=['lighting_condition', 'time_slot'], dtype=float)
    input_full = input_encoded.reindex(columns=feature_cols_v1, fill_value=0.0)
    input_scaled = scaler_v1.transform(input_full)

    pred = int(model_v1.predict(input_scaled)[0])
    fatigue_prob = float(model_v1.predict_proba(input_scaled)[0][1])

    diag = get_diagnosis_v1(pred, fatigue_prob)
    elapsed_ms = round((time.time() - start_time) * 1000, 2)

    return PredictionV1Response(
        status="success",
        engine_version="V1-Snapshot",
        fatigue_score=diag["fatigue_score"],
        alertness_score=diag["alertness_score"],
        fatigue_level=diag["fatigue_level"],
        prediction_label=pred,
        badge=diag["badge"],
        summary=diag["summary"],
        recommendations=diag["recommendations"],
        inference_time_ms=elapsed_ms,
        model_name=type(model_v1).__name__
    )

@app.post("/api/v1/predict_image")
async def predict_from_image(file: UploadFile = File(...), lighting: Optional[str] = "Well-Lit", time_slot: Optional[str] = "Daytime"):
    start_time = time.time()
    
    contents = await file.read()
    try:
        pil_image = Image.open(io.BytesIO(contents)).convert('RGB')
        img_np = np.array(pil_image)
        img_bgr = img_np[:, :, ::-1].copy()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid image format: {str(e)}")

    features, annotated_img = extract_facial_features(img_bgr)
    if features is None:
        raise HTTPException(
            status_code=422,
            detail="ไม่สามารถตรวจพบใบหน้าหรือดวงตาในภาพได้ กรุณาปรับแสงและมองตรงมาที่กล้อง"
        )

    import base64
    import cv2
    annotated_b64 = None
    if annotated_img is not None:
        _, buffer = cv2.imencode('.jpg', annotated_img, [cv2.IMWRITE_JPEG_QUALITY, 85])
        annotated_b64 = f"data:image/jpeg;base64,{base64.b64encode(buffer).decode('utf-8')}"

    feat_input = FeatureInputV1(
        eye_openness=features['eye_openness'],
        eye_aspect_ratio=features['eye_aspect_ratio'],
        mouth_aspect_ratio=features['mouth_aspect_ratio'],
        under_eye_darkness_ratio=features['under_eye_darkness_ratio'],
        skin_texture_var=features['skin_texture_var'],
        lighting_condition=lighting,
        time_slot=time_slot
    )

    pred_res = predict_v1(feat_input)
    pred_res.annotated_image_url = annotated_b64
    pred_res.biometrics_detail = {
        "ear": features['eye_aspect_ratio'],
        "mar": features['mouth_aspect_ratio'],
        "under_eye_darkness_ratio": features['under_eye_darkness_ratio'],
        "skin_texture_var": features['skin_texture_var'],
        "eye_status": "Open (ปกติ)" if features['eye_aspect_ratio'] >= 0.28 else "Drooping (ปรือ/ตก)",
        "mouth_status": "Yawning (กำลังหาว)" if features['mouth_aspect_ratio'] >= 0.35 else "Normal (ปกติ)",
        "under_eye_status": "Severe Dark Bags (คล้ำสะสม)" if features['under_eye_darkness_ratio'] < 0.75 else ("Moderate (เริ่มคล้ำ)" if features['under_eye_darkness_ratio'] < 0.88 else "Fresh (สดใส)")
    }
    elapsed_ms = round((time.time() - start_time) * 1000, 2)

    return {
        "status": "success",
        "extracted_features": features,
        "annotated_image_url": annotated_b64,
        "prediction": pred_res,
        "total_time_ms": elapsed_ms
    }

# --- V2: Advanced Temporal Multi-class Prediction ---
@app.post("/api/v2/predict_temporal", response_model=PredictionV2Response)
def predict_v2_temporal(data: TemporalFeaturesV2Input):
    if not v2_artifact:
        raise HTTPException(status_code=503, detail="V2 Model pipeline not initialized on server.")

    start_time = time.time()
    pipeline = v2_artifact['pipeline']
    feature_cols = v2_artifact['feature_cols']

    input_df = pd.DataFrame([{
        'ear_mean': data.ear_mean,
        'ear_std': data.ear_std,
        'perclos_score': data.perclos_score,
        'blink_rate_bpm': data.blink_rate_bpm,
        'yawn_frequency': data.yawn_frequency,
        'head_tilt_deg': data.head_tilt_deg,
        'under_eye_darkness_ratio': data.under_eye_darkness_ratio,
        'skin_texture_var': data.skin_texture_var
    }])[feature_cols]

    level_pred = int(pipeline.predict(input_df)[0])
    probas = pipeline.predict_proba(input_df)[0].tolist()

    class_proba_dict = {
        f"Level_{i}": round(p, 4) for i, p in enumerate(probas)
    }

    diag = get_diagnosis_v2(level_pred, probas)
    elapsed_ms = round((time.time() - start_time) * 1000, 3)

    return PredictionV2Response(
        status="success",
        engine_version="V2-Temporal-Multiclass",
        level_index=level_pred,
        level_name=diag["level_name"],
        fatigue_score=diag["fatigue_score"],
        alertness_score=diag["alertness_score"],
        class_probabilities=class_proba_dict,
        badge=diag["badge"],
        summary=diag["summary"],
        recommendations=diag["recommendations"],
        inference_time_ms=elapsed_ms,
        model_name=v2_artifact['model_name'],
        benchmark_metrics=v2_artifact.get('benchmark_metrics')
    )

# ======================================================================
# 🗄️ SQLITE DATABASE LOGGING (INTEROPERABLE WITH BUN SQLITE)
# ======================================================================
import sqlite3

DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data", "fatigue_history.db"))

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

class FatigueLogCreate(BaseModel):
    session_id: str
    eye_openness: Optional[float] = 0.5
    eye_aspect_ratio: float
    mouth_aspect_ratio: float
    under_eye_darkness_ratio: float
    skin_texture_var: Optional[float] = 0.5
    lighting_condition: Optional[str] = "Well-Lit"
    time_slot: str
    fatigue_score: float
    fatigue_level: str
    ground_truth_feedback: Optional[str] = None
    user_notes: Optional[str] = None

class FeedbackUpdate(BaseModel):
    ground_truth_feedback: str
    user_notes: Optional[str] = None

@app.get("/api/v1/logs")
def get_logs(limit: int = 100):
    try:
        if not os.path.exists(DB_PATH):
            return []
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM fatigue_logs ORDER BY created_at DESC LIMIT ?", (limit,))
            return [dict(r) for r in cursor.fetchall()]
    except Exception as e:
        return []

@app.post("/api/v1/logs")
def create_log(log: FatigueLogCreate):
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO fatigue_logs (
                    session_id, eye_openness, eye_aspect_ratio, mouth_aspect_ratio,
                    under_eye_darkness_ratio, skin_texture_var, lighting_condition,
                    time_slot, fatigue_score, fatigue_level, ground_truth_feedback, user_notes, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', 'localtime'))
            """, (
                log.session_id, log.eye_openness, log.eye_aspect_ratio, log.mouth_aspect_ratio,
                log.under_eye_darkness_ratio, log.skin_texture_var, log.lighting_condition,
                log.time_slot, log.fatigue_score, log.fatigue_level, log.ground_truth_feedback, log.user_notes
            ))
            conn.commit()
            new_id = cursor.lastrowid
            cursor.execute("SELECT * FROM fatigue_logs WHERE id = ?", (new_id,))
            row = cursor.fetchone()
            return dict(row) if row else {"id": new_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/v1/logs/{log_id}/feedback")
@app.post("/api/v1/logs/{log_id}/feedback")
def update_feedback(log_id: int, feedback: FeedbackUpdate):
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                UPDATE fatigue_logs
                SET ground_truth_feedback = ?, user_notes = COALESCE(?, user_notes)
                WHERE id = ?
            """, (feedback.ground_truth_feedback, feedback.user_notes, log_id))
            conn.commit()
            return {"status": "success", "updated_id": log_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=7860)

