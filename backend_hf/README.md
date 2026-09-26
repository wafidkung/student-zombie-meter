---
title: Student Zombie Meter API
emoji: 🧟
colorFrom: red
colorTo: green
sdk: docker
app_port: 7860
pinned: false
---

# 🔬 Student Zombie Meter — ML Inference API
Production REST API for Biometric Facial Fatigue Screening & Zombie Detection.

### 🚀 Endpoints:
- `POST /api/v1/predict` - Predict fatigue level from numerical biometric vector
- `POST /api/v1/predict_image` - Upload facial image, extract features with OpenCV, and predict
- `GET /health` - Health check & model status
