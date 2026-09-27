import cv2
import numpy as np

# โหลด Haar Cascades มาตรฐานของ OpenCV
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
eye_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_eye.xml')

def extract_facial_features(image_input):
    """
    ฟังก์ชันสกัดฟีเจอร์ความเหนื่อยล้าทางชีวมิติขั้นสูงด้วย OpenCV
    อิงตามหลักการใน Hands-On Machine Learning และ Designing Machine Learning Systems:
    1. Eye Aspect Ratio (EAR) - ระดับการเปิดของเปลือกตา
    2. Mouth Aspect Ratio (MAR) - ระดับการอ้าปาก/การหาว (Yawning)
    3. Relative Under-Eye Darkness Ratio - ความคล้ำใต้ตาเทียบกับหน้าผาก (CIE L*a*b*)
    4. Skin Texture Variance - ความสดใสของผิวหน้าด้วย Laplacian Variance
    """
    if isinstance(image_input, str):
        img = cv2.imread(image_input)
    else:
        img = image_input.copy()

    if img is None:
        return None, None

    h, w = img.shape[:2]
    max_dim = 800
    if max(h, w) > max_dim:
        scale = max_dim / max(h, w)
        img = cv2.resize(img, (int(w * scale), int(h * scale)))

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    gray_eq = clahe.apply(gray)

    # 1. Face Detection
    faces = face_cascade.detectMultiScale(gray_eq, scaleFactor=1.1, minNeighbors=5, minSize=(100, 100))
    if len(faces) == 0:
        return None, img

    face = max(faces, key=lambda f: f[2] * f[3])
    fx, fy, fw, fh = face

    annotated_img = img.copy()
    # วาดกรอบใบหน้า
    cv2.rectangle(annotated_img, (fx, fy), (fx + fw, fy + fh), (255, 200, 0), 2)

    roi_gray = gray_eq[fy:fy+fh, fx:fx+fw]
    roi_color = img[fy:fy+fh, fx:fx+fw]
    lab_roi = cv2.cvtColor(roi_color, cv2.COLOR_BGR2LAB)
    l_channel = lab_roi[:, :, 0]

    # 2. Eye Detection & Under-Eye Analysis
    upper_face_gray = roi_gray[int(fh * 0.15):int(fh * 0.55), :]
    eyes = eye_cascade.detectMultiScale(upper_face_gray, scaleFactor=1.08, minNeighbors=4, minSize=(25, 25))

    valid_eyes = []
    for (ex, ey, ew, eh) in eyes:
        valid_eyes.append((ex, ey + int(fh * 0.15), ew, eh))

    eye_openness = 0.5
    ear_val = 0.30
    under_eye_darkness_ratio = 1.0

    if len(valid_eyes) >= 1:
        for (ex, ey, ew, eh) in valid_eyes[:2]:
            cv2.rectangle(annotated_img, (fx + ex, fy + ey), (fx + ex + ew, fy + ey + eh), (0, 255, 0), 2)
            ear_val = eh / max(ew, 1)

            # ใต้ตา
            under_y1 = min(ey + eh, fh - 1)
            under_y2 = min(ey + eh + int(eh * 0.7), fh)
            under_x1 = max(0, ex)
            under_x2 = min(ex + ew, fw)

            if under_y2 > under_y1 and under_x2 > under_x1:
                cv2.rectangle(annotated_img, (fx + under_x1, fy + under_y1), (fx + under_x2, fy + under_y2), (0, 0, 255), 1)
                under_eye_bright = np.mean(l_channel[under_y1:under_y2, under_x1:under_x2])
                
                # หน้าผาก
                forehead_bright = np.mean(l_channel[int(fh * 0.05):int(fh * 0.20), int(fw * 0.3):int(fw * 0.7)])
                if forehead_bright > 0:
                    under_eye_darkness_ratio = under_eye_bright / forehead_bright

        eye_openness = min(1.0, max(0.1, ear_val * 1.5))
    else:
        eye_openness = 0.25
        ear_val = 0.20
        under_eye_darkness_ratio = 0.82

    # 3. Mouth Aspect Ratio (MAR) & Yawn Estimation (โซนครึ่งล่างของใบหน้า)
    mouth_zone_y1 = int(fh * 0.65)
    mouth_zone_y2 = int(fh * 0.92)
    mouth_zone_x1 = int(fw * 0.25)
    mouth_zone_x2 = int(fw * 0.75)
    
    cv2.rectangle(annotated_img, (fx + mouth_zone_x1, fy + mouth_zone_y1),
                  (fx + mouth_zone_x2, fy + mouth_zone_y2), (255, 100, 255), 1)
    
    # วัดการอ้าปากผ่าน Contour หรือ Intensity Thresholding ในช่องปาก
    mouth_roi = roi_gray[mouth_zone_y1:mouth_zone_y2, mouth_zone_x1:mouth_zone_x2]
    _, mouth_thresh = cv2.threshold(mouth_roi, 60, 255, cv2.THRESH_BINARY_INV)
    mouth_contours, _ = cv2.findContours(mouth_thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    mar_val = 0.22 # ค่าปกติเมื่อหุบปาก
    if mouth_contours:
        largest_mouth = max(mouth_contours, key=cv2.contourArea)
        mx, my, mw, mh = cv2.boundingRect(largest_mouth)
        if mw > 15 and mh > 10:
            mar_val = min(0.85, mh / max(mw, 1))

    # 4. Skin Texture Variance
    laplacian_var = cv2.Laplacian(roi_gray, cv2.CV_64F).var()
    normalized_texture = min(100.0, laplacian_var) / 100.0

    # Draw HUD Text Annotations
    cv2.putText(annotated_img, "AI BIOMETRIC ANALYSIS | STUDENT ZOMBIE METER", (15, 25), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 255, 200), 2)
    cv2.putText(annotated_img, f"Face ROI: {fw}x{fh} | Texture: {normalized_texture:.2f}", (fx, max(20, fy - 10)), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 200, 0), 1)
    if valid_eyes:
        cv2.putText(annotated_img, f"EAR: {ear_val:.2f} ({'OPEN' if ear_val >= 0.28 else 'DROOPING'})", (fx + valid_eyes[0][0], max(35, fy + valid_eyes[0][1] - 5)), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 255, 0), 1)
    cv2.putText(annotated_img, f"Darkness: {under_eye_darkness_ratio:.2f}", (fx + 5, fy + int(fh * 0.55)), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 140, 255), 1)
    cv2.putText(annotated_img, f"MAR: {mar_val:.2f} ({'YAWN' if mar_val > 0.35 else 'NORMAL'})", (fx + mouth_zone_x1, min(h - 10, fy + mouth_zone_y2 + 18)), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (255, 100, 255), 1)

    features = {
        'eye_openness': float(eye_openness),
        'eye_aspect_ratio': float(ear_val),
        'mouth_aspect_ratio': float(mar_val),
        'under_eye_darkness_ratio': float(under_eye_darkness_ratio),
        'skin_texture_var': float(normalized_texture)
    }

    return features, annotated_img
