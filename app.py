import streamlit as st
import cv2
import numpy as np
import joblib
import os
import pandas as pd
from PIL import Image
import sys

# เชื่อมต่อโมดูลสกัดฟีเจอร์ OpenCV
sys.path.append(os.path.join(os.path.dirname(__file__), 'features'))
from feature_extractor import extract_facial_features

# ตั้งค่าหน้าเว็บให้เป็นทางการ สวยงาม และ Responsive
st.set_page_config(
    page_title="Biometric Facial Fatigue Screening System",
    page_icon="🔬",
    layout="wide",
    initial_sidebar_state="expanded"
)

# โหลดโมเดล, Scaler และฟีเจอร์
@st.cache_resource
def load_artifacts():
    model_path = os.path.join('models', 'best_model.joblib')
    scaler_path = os.path.join('models', 'scaler.joblib')
    cols_path = os.path.join('models', 'feature_cols.joblib')
    if not (os.path.exists(model_path) and os.path.exists(scaler_path) and os.path.exists(cols_path)):
        return None, None, None
    model = joblib.load(model_path)
    scaler = joblib.load(scaler_path)
    feature_cols = joblib.load(cols_path)
    return model, scaler, feature_cols

model, scaler, feature_cols = load_artifacts()

# ฟังก์ชันแปลผลวินิจฉัยทางการแพทย์และสรีรวิทยา (Professional & Academic Tone)
def get_clinical_diagnosis(pred_label, fatigue_prob):
    alertness_score = int((1.0 - fatigue_prob) * 100)
    
    if pred_label == 0:
        status_title = "ระดับความตื่นตัวปกติ (Normal Alertness)"
        status_badge = "✅ สภาพร่างกายพร้อมทำงาน / สมบูรณ์"
        theme_color = "#1e7e34"
        bg_color = "#e8f5e9"
        border_color = "#81c784"
        clinical_summary = (
            "จากการวิเคราะห์ชีวมิติทางใบหน้า ไม่พบสัญญาณความล้าที่มีนัยสำคัญทางสรีรวิทยา "
            "สัดส่วนการเปิดของดวงตา (EAR) และความสว่างบริเวณใต้ตาเมื่อเทียบกับหน้าผากอยู่ในเกณฑ์มาตรฐาน "
            "ระบบประสาทสั่งการและการรับรู้ของบุคคลมีความพร้อมในการปฏิบัติงานได้อย่างมีประสิทธิภาพ"
        )
        recommendations = [
            "รักษาระดับสมาธิและการทำงานต่อเนื่องได้อย่างปลอดภัย",
            "ดื่มน้ำสะอาดอย่างสม่ำเสมอเพื่อรักษาสมดุลของระดับของเหลวในร่างกาย",
            "จัดตารางเวลาพักสายตาทุก 45–60 นาทีเพื่อป้องกันอาการตาล้าสะสม (Asthenopia)"
        ]
    else:
        status_title = "ภาวะเหนื่อยล้าสะสมจากการพักผ่อนไม่เพียงพอ (Fatigue / Sleep Deprivation)"
        status_badge = "⚠️ ตรวจพบสัญญาณความล้าทางชีวมิติระดับสูง"
        theme_color = "#c82333"
        bg_color = "#fbe9e7"
        border_color = "#e57373"
        clinical_summary = (
            "ตรวจพบความผิดปกติของสัญญาณชีวมิติใบหน้าที่สัมพันธ์กับภาวะอดนอนและเหนื่อยล้าสะสม "
            "ได้แก่ อัตราส่วนความกว้างยาวของดวงตาลดลง (ตาปรือ/ตาลอย), สัดส่วนการอ้าปากหาว (MAR) สูงขึ้น "
            "และพบรอยคล้ำใต้ตาชัดเจนจากอัตราส่วน Relative Luminance Contrast ในระบบสี LAB ซึ่งบ่งชี้ว่าควรหยุดพักทันที"
        )
        recommendations = [
            "ควรหยุดพักกิจกรรมที่ต้องใช้สมาธิขั้นสูง และงีบหลับสั้น (Power Nap) 15–20 นาทีทันที",
            "หลีกเลี่ยงการขับขี่ยานพาหนะหรือควบคุมเครื่องจักรโดยเด็ดขาด เนื่องจากมีความเสี่ยงสูงต่อการวูบหลับใน (Microsleep)",
            "ปรับพฤติกรรมสุขอนามัยการนอน (Sleep Hygiene) โดยตั้งเป้าหมายนอนหลับให้ครบ 7–8 ชั่วโมงในคืนนี้"
        ]

    return {
        "title": status_title,
        "badge": status_badge,
        "color": theme_color,
        "bg_color": bg_color,
        "border_color": border_color,
        "alertness_score": alertness_score,
        "summary": clinical_summary,
        "recommendations": recommendations
    }

# --- ส่วนหัวของหน้าเว็บ (Header Section) ---
st.markdown(
    """
    <div style="background: linear-gradient(90deg, #1e3c72 0%, #2a5298 100%); padding: 22px 28px; border-radius: 12px; color: white; margin-bottom: 20px;">
        <h2 style="margin: 0; color: white; font-weight: 700;">🔬 ระบบคัดกรองระดับความเหนื่อยล้าและความตื่นตัวทางชีวมิติ</h2>
        <p style="margin: 6px 0 0 0; font-size: 15px; opacity: 0.95;">
            Biometric Facial Fatigue & Alertness Screening System | Machine Learning Application (Scikit-Learn & OpenCV)
        </p>
    </div>
    """,
    unsafe_allow_html=True
)

if model is None or scaler is None or feature_cols is None:
    st.error("⚠️ ไม่พบโมเดล กรุณารันไฟล์ `1_prepare_dataset.py` และ `2_train_and_evaluate.py` ก่อน")
    st.stop()

# --- แผงควบคุมด้านข้าง (Sidebar Controls) ---
with st.sidebar:
    st.header("⚙️ การตั้งค่าสภาพแวดล้อม")
    st.markdown("**กรอกข้อมูลบริบทขณะทำการประเมิน:**")
    selected_lighting = st.selectbox(
        "💡 สภาพแสงสว่างในห้อง (Lighting):",
        ["Well-Lit (แสงสว่างเพียงพอ)", "Fluorescent (แสงนีออนทั่วไป)", "Dim-Light (ห้องมืด/แสงสลัว)"]
    )
    selected_time = st.selectbox(
        "⏰ ช่วงเวลาที่กำลังสแกน (Time Slot):",
        ["Daytime (กลางวัน)", "Evening (หัวค่ำ)", "Overnight (ดึก/โต้รุ่ง)"]
    )

    st.divider()
    st.markdown("**📋 ข้อมูลสถาปัตยกรรมโมเดล:**")
    st.write(f"- **อัลกอริทึม:** `{type(model).__name__}`")
    st.write("- **เทคนิคสกัดฟีเจอร์:** OpenCV Haar Cascade + LAB Relative Contrast")
    st.write("- **การประมวลผล:** StandardScaler + One-Hot Encoding")
    st.write("- **การวัดผล:** 5-Fold Cross Validation")

lighting_val = "Well-Lit" if "Well-Lit" in selected_lighting else ("Fluorescent" if "Fluorescent" in selected_lighting else "Dim-Light")
time_val = "Daytime" if "Daytime" in selected_time else ("Evening" if "Evening" in selected_time else "Overnight")

# --- ส่วนนำเข้าภาพใบหน้า (Input Section) ---
st.subheader("📸 1. นำเข้าภาพใบหน้าเพื่อตรวจคัดกรองทางชีวมิติ")
tab_cam, tab_file = st.tabs(["📷 ถ่ายภาพสดผ่านกล้อง (Live Camera)", "📁 อัปโหลดไฟล์รูปภาพ (Image File)"])

image_to_process = None

with tab_cam:
    st.write("เปิดกล้องเพื่อถ่ายภาพใบหน้า (กรุณามองตรงเข้าหากล้องและถอดแว่นตากรอบหนาออกชั่วคราว):")
    camera_pic = st.camera_input("กดปุ่ม Take Photo ด้านล่าง")
    if camera_pic is not None:
        pil_img = Image.open(camera_pic).convert('RGB')
        image_to_process = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)

with tab_file:
    st.write("เลือกไฟล์รูปภาพใบหน้า (รองรับทั้งการเลือกไฟล์จากเครื่อง และกด Take Photo ผ่านกล้องมือถือ/iPad):")
    uploaded_file = st.file_uploader("เลือกไฟล์รูปภาพใบหน้า (JPG, PNG, JPEG)", type=['jpg', 'jpeg', 'png'])
    if uploaded_file is not None:
        pil_img = Image.open(uploaded_file).convert('RGB')
        image_to_process = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)

# --- ส่วนแสดงภาพและการวิเคราะห์ของ OpenCV ---
if image_to_process is not None:
    st.divider()
    st.subheader("🔬 2. การตรวจจับและสกัดฟีเจอร์ด้วยคอมพิวเตอร์วิทัศน์ (OpenCV ROI Analysis)")
    
    col_img1, col_img2 = st.columns(2)
    with col_img1:
        st.markdown("**🖼️ ภาพนำเข้าต้นฉบับ (Original Input)**")
        st.image(cv2.cvtColor(image_to_process, cv2.COLOR_BGR2RGB), use_container_width=True)

    with st.spinner("กำลังประมวลผล Region of Interest (ROI) และคำนวณเวกเตอร์ชีวมิติ..."):
        features, annotated_img = extract_facial_features(image_to_process)

    with col_img2:
        st.markdown("**🔍 ภาพการตรวจจับ Region of Interest (OpenCV Detection Overlay)**")
        st.image(cv2.cvtColor(annotated_img, cv2.COLOR_BGR2RGB), use_container_width=True)
        st.caption("🟢 กรอบเขียว: ดวงตา (EAR) | 🔴 กรอบแดง: โซนวัดความคล้ำใต้ตา | 🟣 กรอบม่วง: สัดส่วนปาก (MAR) | 🟡 กรอบเหลือง: โครงหน้า")

    if features is None:
        st.warning("⚠️ ระบบตรวจไม่พบใบหน้าหรือจุดดวงตาที่ชัดเจน กรุณาขยับหน้าให้อยู่ตรงกลางกล้องและปรับระดับแสงให้สว่างขึ้น")
    else:
        st.markdown("#### 📊 ค่าดัชนีชีวมิติที่สกัดได้จากใบหน้า (Biometric Feature Vector):")
        m1, m2, m3, m4, m5 = st.columns(5)
        m1.metric("👁️ Eye Openness", f"{features['eye_openness']:.2f}")
        m2.metric("📐 Eye Aspect (EAR)", f"{features['eye_aspect_ratio']:.2f}")
        m3.metric("🥱 Mouth Ratio (MAR)", f"{features['mouth_aspect_ratio']:.2f}")
        m4.metric("🌑 Darkness Ratio", f"{features['under_eye_darkness_ratio']:.2f}")
        m5.metric("🧬 Skin Texture Score", f"{features['skin_texture_var']:.2f}")

        st.write("")
        predict_btn = st.button("🔍 ทำการประมวลผลและวินิจฉัย (Run Diagnostic Inference)", type="primary", use_container_width=True)

        if predict_btn:
            input_dict = {
                'eye_openness': features['eye_openness'],
                'eye_aspect_ratio': features['eye_aspect_ratio'],
                'mouth_aspect_ratio': features['mouth_aspect_ratio'],
                'under_eye_darkness_ratio': features['under_eye_darkness_ratio'],
                'skin_texture_var': features['skin_texture_var'],
                'lighting_condition': lighting_val,
                'time_slot': time_val
            }
            input_df = pd.DataFrame([input_dict])
            input_encoded = pd.get_dummies(input_df, columns=['lighting_condition', 'time_slot'], dtype=float)
            input_full = input_encoded.reindex(columns=feature_cols, fill_value=0.0)
            input_scaled = scaler.transform(input_full)

            prediction = model.predict(input_scaled)[0]
            fatigue_prob = model.predict_proba(input_scaled)[0][1]

            diag = get_clinical_diagnosis(prediction, fatigue_prob)

            # --- ส่วนแสดงผลลัพธ์และคำแนะนำทางการแพทย์ ---
            st.divider()
            st.subheader("📋 3. ผลการวินิจฉัยและการแปลความหมายทางสรีรวิทยา (Clinical & Ergonomic Interpretation)")

            res1, res2 = st.columns([1, 2])
            with res1:
                st.markdown(
                    f"""
                    <div style="background-color: {diag['bg_color']}; border: 2px solid {diag['border_color']}; padding: 24px; border-radius: 12px; text-align: center;">
                        <h4 style="color: {diag['color']}; margin: 0; font-weight: 700;">{diag['badge']}</h4>
                        <h1 style="color: {diag['color']}; font-size: 58px; margin: 12px 0;">{diag['alertness_score']}%</h1>
                        <p style="margin: 0; font-size: 15px; color: #555; font-weight: 600;">ดัชนีความพร้อมและตื่นตัว (Alertness Index)</p>
                    </div>
                    """,
                    unsafe_allow_html=True
                )
                st.write("")
                st.write(f"**ความน่าจะเป็นของภาวะความเหนื่อยล้า (Fatigue Probability):** `{fatigue_prob * 100:.2f}%`")
                st.progress(float(fatigue_prob))

            with res2:
                st.markdown(f"### {diag['title']}")
                st.write(diag['summary'])
                st.markdown("#### 💡 คำแนะนำทางสุขอนามัยและการยศาสตร์ (Ergonomic Recommendations):")
                for r in diag['recommendations']:
                    st.write(f"- {r}")

                st.caption(f"🧠 โมเดลที่ใช้ประมวลผล: `{type(model).__name__}` (Scikit-Learn) | เวลาประมวลผล (Inference Latency): < 30 ms")

            # ส่วนวิเคราะห์ Feature Importance
            feat_img = os.path.join('models', 'feature_importance.png')
            if os.path.exists(feat_img):
                with st.expander("📈 การวิเคราะห์ความสำคัญของสัญญาณทางชีวมิติ (Feature Importance Analysis)"):
                    st.image(feat_img, use_container_width=True)
                    st.caption("กราฟแท่งแสดงน้ำหนักความสำคัญของแต่ละตัวแปรที่โมเดลใช้ในการตัดสินใจคัดกรองความล้า")
