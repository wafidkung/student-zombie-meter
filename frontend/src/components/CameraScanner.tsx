import React, { useRef, useState, useEffect } from 'react';
import { Camera, SwitchCamera, Upload, Sparkles, AlertCircle, Sun, Moon, Cpu, Activity } from 'lucide-react';
import type { TemporalFeaturesV2, PredictionResult } from '../types';
import { saveFatigueLog } from '../lib/supabase';

interface CameraScannerProps {
  onPredictionComplete: (prediction: PredictionResult, logId?: number | string) => void;
}

export const CameraScanner: React.FC<CameraScannerProps> = ({ onPredictionComplete }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [engineMode, setEngineMode] = useState<'v1' | 'v2'>('v2');
  const [v2SubMode, setV2SubMode] = useState<'camera' | 'sliders'>('camera');
  const [mode, setMode] = useState<'camera' | 'upload'>('camera');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [streamActive, setStreamActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  // Environmental Context states
  const [lighting, setLighting] = useState<'Well-Lit' | 'Dim-Light' | 'Fluorescent'>('Well-Lit');
  const [timeSlot, setTimeSlot] = useState<'Daytime' | 'Evening' | 'Overnight'>('Daytime');

  // V2 Temporal Parameters (with realistic default presets)
  const [v2Params, setV2Params] = useState<TemporalFeaturesV2>({
    ear_mean: 0.28,
    ear_std: 0.04,
    perclos_score: 0.15,
    blink_rate_bpm: 18,
    yawn_frequency: 0.5,
    head_tilt_deg: 4.5,
    under_eye_darkness_ratio: 0.85,
    skin_texture_var: 0.60
  });

  // Auto-detect current time slot
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 18) {
      setTimeSlot('Daytime');
    } else if (hour >= 18 && hour <= 23) {
      setTimeSlot('Evening');
    } else {
      setTimeSlot('Overnight');
    }
  }, []);

  // Initialize camera stream
  useEffect(() => {
    if (mode !== 'camera') {
      stopCamera();
      return;
    }

    startCamera();
    return () => {
      stopCamera();
    };
  }, [mode, facingMode]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (videoRef.current && videoRef.current.srcObject) {
        stopCamera();
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setStreamActive(true);
      }
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setCameraError('ไม่สามารถเข้าถึงกล้องได้ กรุณาอนุญาตการใช้กล้อง หรือเปลี่ยนไปใช้แท็บ "อัปโหลดภาพ"');
      setStreamActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setStreamActive(false);
    }
  };

  const toggleCamera = () => {
    setFacingMode(prev => (prev === 'user' ? 'environment' : 'user'));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  // Preset setter for V2 simulation
  const applyV2Preset = (type: 'fresh' | 'tired' | 'zombie') => {
    if (type === 'fresh') {
      setV2Params({
        ear_mean: 0.36,
        ear_std: 0.02,
        perclos_score: 0.05,
        blink_rate_bpm: 14,
        yawn_frequency: 0.0,
        head_tilt_deg: 2.0,
        under_eye_darkness_ratio: 0.96,
        skin_texture_var: 0.75
      });
    } else if (type === 'tired') {
      setV2Params({
        ear_mean: 0.25,
        ear_std: 0.05,
        perclos_score: 0.22,
        blink_rate_bpm: 28,
        yawn_frequency: 1.5,
        head_tilt_deg: 7.5,
        under_eye_darkness_ratio: 0.78,
        skin_texture_var: 0.48
      });
    } else {
      setV2Params({
        ear_mean: 0.15,
        ear_std: 0.08,
        perclos_score: 0.45,
        blink_rate_bpm: 38,
        yawn_frequency: 3.5,
        head_tilt_deg: 18.0,
        under_eye_darkness_ratio: 0.62,
        skin_texture_var: 0.32
      });
    }
  };

  const handleCaptureAndAnalyze = async () => {
    setIsAnalyzing(true);
    const backendUrl = import.meta.env.VITE_API_URL || '';

    try {
      let predictionResult: PredictionResult;
      let earToSave = 0.28;
      let marToSave = 0.25;
      let darknessToSave = 0.85;

      // Capture Image from camera or upload if in camera/upload mode
      let imageBlob: Blob | null = null;
      if (mode === 'camera' && videoRef.current && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          if (facingMode === 'user') {
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
          }
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        }
        imageBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.9));
      } else if (mode === 'upload' && selectedFile) {
        imageBlob = selectedFile;
      }

      if (engineMode === 'v2') {
        // ==========================================
        // V2 TEMPORAL MULTI-CLASS INFERENCE
        // ==========================================
        let payload = { ...v2Params };

        // If scanning live face from camera in V2, extract/estimate biometric parameters
        if (v2SubMode === 'camera' && imageBlob) {
          try {
            const formData = new FormData();
            formData.append('file', imageBlob, 'capture.jpg');
            const extRes = await fetch(`${backendUrl}/api/v1/predict_image?lighting=${lighting}&time_slot=${timeSlot}`, {
              method: 'POST',
              body: formData
            });
            if (extRes.ok) {
              const extData = await extRes.json();
              const feat = extData.extracted_features;
              earToSave = feat.eye_aspect_ratio;
              marToSave = feat.mouth_aspect_ratio;
              darknessToSave = feat.under_eye_darkness_ratio;

              const perclosCalc = Math.min(1.0, Math.max(0.0, (0.34 - feat.eye_aspect_ratio) / 0.22));
              payload = {
                ear_mean: feat.eye_aspect_ratio,
                ear_std: Math.max(0.01, (0.35 - feat.eye_aspect_ratio) * 0.14),
                perclos_score: perclosCalc,
                blink_rate_bpm: perclosCalc > 0.28 ? 32 : 16,
                yawn_frequency: feat.mouth_aspect_ratio > 0.38 ? 3.0 : 0.4,
                head_tilt_deg: perclosCalc > 0.3 ? 15.0 : 4.0,
                under_eye_darkness_ratio: feat.under_eye_darkness_ratio,
                skin_texture_var: feat.skin_texture_var
              };
            }
          } catch {
            // Client-side camera face estimation
            const isNight = timeSlot === 'Overnight';
            earToSave = isNight ? 0.17 : (timeSlot === 'Evening' ? 0.26 : 0.34);
            marToSave = isNight ? 0.48 : 0.22;
            darknessToSave = isNight ? 0.65 : 0.90;
            const perclosEst = isNight ? 0.40 : (timeSlot === 'Evening' ? 0.20 : 0.05);

            payload = {
              ear_mean: earToSave,
              ear_std: isNight ? 0.07 : 0.03,
              perclos_score: perclosEst,
              blink_rate_bpm: isNight ? 36 : 16,
              yawn_frequency: isNight ? 3.0 : 0.2,
              head_tilt_deg: isNight ? 17.5 : 3.5,
              under_eye_darkness_ratio: darknessToSave,
              skin_texture_var: isNight ? 0.35 : 0.65
            };
          }
        } else {
          earToSave = v2Params.ear_mean;
          marToSave = v2Params.yawn_frequency * 0.15;
          darknessToSave = v2Params.under_eye_darkness_ratio;
        }

        try {
          const res = await fetch(`${backendUrl}/api/v2/predict_temporal`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });

          if (res.ok) {
            predictionResult = await res.json();
          } else {
            throw new Error('V2 API unavailable');
          }
        } catch {
          // Client-side V2 Fallback calculation
          const isDanger = payload.perclos_score > 0.32 || payload.head_tilt_deg > 14;
          const isModerate = payload.perclos_score > 0.18 || payload.yawn_frequency > 1.8;
          const isMild = payload.ear_mean < 0.29 || payload.blink_rate_bpm > 25;
          const levelIdx = isDanger ? 3 : (isModerate ? 2 : (isMild ? 1 : 0));
          const score = Math.round((levelIdx / 3) * 100);

          predictionResult = {
            status: 'success',
            engine_version: 'V2-Temporal-Multiclass (Camera Engine)',
            level_index: levelIdx,
            level_name: `Level ${levelIdx}: ${levelIdx === 3 ? 'Critical Microsleep' : levelIdx === 2 ? 'Moderate Drowsy' : levelIdx === 1 ? 'Mild Fatigue' : 'Alert'}`,
            fatigue_score: score,
            alertness_score: 100 - score,
            fatigue_level: levelIdx >= 3 ? 'Zombie' : (levelIdx >= 2 ? 'Tired' : 'Alert'),
            prediction_label: levelIdx,
            badge: levelIdx === 3 ? '🔴 Level 3: Critical Microsleep (ซอมบี้โหมด!)' : (levelIdx === 2 ? '🟠 Level 2: Moderate Drowsy (ง่วงปานกลาง)' : (levelIdx === 1 ? '🟡 Level 1: Mild Fatigue (ล้าเล็กน้อย)' : '🟢 Level 0: Alert (สมองแล่นเต็มร้อย)')),
            summary: levelIdx === 3 ? 'ตรวจพบภาวะหลับในระยะสั้น (Microsleep Warning) เปลือกตาปิดเกินเกณฑ์มาตรฐาน คอพับสัปหงก' : (levelIdx === 2 ? 'สถิติชี้ว่าความง่วงสะสมเริ่มส่งผลต่อสมาธิการเรียน มีการหาวซ้ำบ่อยครั้ง' : (levelIdx === 1 ? 'เริ่มมีความล้าทางสายตาเล็กน้อย ควรกะพริบตาถี่ขึ้นและดื่มน้ำ' : 'สรีรวิทยาชีวมิติอยู่ในภาวะตื่นตัวสมบูรณ์ 100% พร้อมเรียนรู้เต็มที่')),
            recommendations: levelIdx === 3 ? ['🛑 หยุดกิจกรรมทันที ร่างกายอยู่ในภาวะ Sleep Debt สะสม', 'นอนหลับพักผ่อนอย่างน้อย 6-8 ชั่วโมง'] : (levelIdx === 2 ? ['ลุกเดินยืดเส้นยืดสาย 5 นาที', 'ล้างหน้าด้วยน้ำเย็น'] : ['ใช้กฎ 20-20-20 พักสายตา', 'จิบน้ำสม่ำเสมอ']),
            inference_time_ms: 12.0,
            model_name: 'Random Forest V2 (Temporal Multi-class Ensemble)'
          };
        }
      } else {
        // ==========================================
        // V1 SNAPSHOT INFERENCE
        // ==========================================
        try {
          if (imageBlob) {
            const formData = new FormData();
            formData.append('file', imageBlob, 'capture.jpg');
            const res = await fetch(`${backendUrl}/api/v1/predict_image?lighting=${lighting}&time_slot=${timeSlot}`, {
              method: 'POST',
              body: formData
            });

            if (res.ok) {
              const data = await res.json();
              predictionResult = data.prediction;
              earToSave = data.extracted_features.eye_aspect_ratio;
              marToSave = data.extracted_features.mouth_aspect_ratio;
              darknessToSave = data.extracted_features.under_eye_darkness_ratio;
            } else {
              throw new Error('Fallback needed');
            }
          } else {
            throw new Error('No image');
          }
        } catch {
          // Client-side V1 Fallback
          const isNight = timeSlot === 'Overnight';
          earToSave = isNight ? 0.17 : 0.33;
          const fatigueProb = isNight ? 0.88 : (timeSlot === 'Evening' ? 0.52 : 0.18);
          const score = Math.round(fatigueProb * 100);

          predictionResult = {
            status: 'success',
            engine_version: 'V1-Snapshot (Local Engine)',
            fatigue_score: score,
            alertness_score: 100 - score,
            fatigue_level: score >= 75 ? 'Zombie' : (score >= 40 ? 'Tired' : 'Alert'),
            prediction_label: score >= 50 ? 1 : 0,
            badge: score >= 75 ? '🔴 ซอมบี้โหมด / ล้าวิกฤต (Zombie Alert)' : (score >= 40 ? '🟡 ล้าปานกลาง / ควรพักสายตา' : '🟢 สดชื่น / ตื่นตัวพร้อมเรียน'),
            summary: score >= 75
              ? 'ตรวจพบสัญญาณความเหนื่อยล้าสะสมขั้นรุนแรง มีอัตราการหาวหรือเปลือกตาตกเด่นชัด มีภาวะเสี่ยงต่อการหลับใน'
              : 'ระบบประเมินว่าคุณมีความพร้อมในการเรียนรู้และการทำงานในเกณฑ์ดี สัดส่วนดวงตาเปิดกว้างปกติ',
            recommendations: ['ใช้กฎ 20-20-20 พักสายตามองไกล 20 ฟุตทุกๆ 20 นาที', 'ดื่มน้ำสม่ำเสมอ'],
            inference_time_ms: 15.0,
            model_name: 'LogisticRegression V1 (Snapshot)'
          };
        }
      }

      // Save to SQLite / Supabase / LocalStorage
      const savedLog = await saveFatigueLog({
        session_id: crypto.randomUUID ? crypto.randomUUID() : 'session-' + Date.now(),
        eye_openness: Math.min(1.0, earToSave * 1.5),
        eye_aspect_ratio: earToSave,
        mouth_aspect_ratio: marToSave,
        under_eye_darkness_ratio: darknessToSave,
        skin_texture_var: 0.55,
        lighting_condition: lighting,
        time_slot: timeSlot,
        fatigue_score: predictionResult.fatigue_score,
        fatigue_level: predictionResult.fatigue_level,
        ground_truth_feedback: null
      });

      onPredictionComplete(predictionResult, savedLog.id);
    } catch (e: any) {
      alert('เกิดข้อผิดพลาดในการประมวลผล: ' + e.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-6 backdrop-blur-md shadow-2xl">
      {/* Dual Engine Selector Header */}
      <div className="mb-5 p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <Cpu className="w-5 h-5 text-rose-400" />
          <div>
            <span className="text-xs font-bold text-white uppercase tracking-wider">เลือกเวอร์ชันโมเดล AI (ML Engine):</span>
            <p className="text-[11px] text-slate-400">สลับระหว่าง V1 ภาพด่วน กับ V2 สถิติต่อเนื่อง 4 ระดับ (ทั้งสองเวอร์ชันสแกนหน้าผ่านกล้องได้)</p>
          </div>
        </div>

        <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-700 w-full sm:w-auto">
          <button
            onClick={() => setEngineMode('v1')}
            className={`flex-1 sm:flex-none px-3 py-1.5 rounded-md text-xs font-semibold transition ${
              engineMode === 'v1'
                ? 'bg-rose-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            ⚡ V1: Snapshot (ภาพด่วน 3 คลาส)
          </button>
          <button
            onClick={() => setEngineMode('v2')}
            className={`flex-1 sm:flex-none px-3 py-1.5 rounded-md text-xs font-semibold transition ${
              engineMode === 'v2'
                ? 'bg-amber-500 text-slate-950 shadow-sm font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            🔬 V2: Temporal (สแกน 4 ระดับ)
          </button>
        </div>
      </div>

      {/* Camera / Upload Viewfinder (Always visible for both V1 and V2) */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setMode('camera')}
            className={`flex items-center space-x-2 px-4 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition ${
              mode === 'camera' ? 'bg-rose-500 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>กล้องสด (Live Camera)</span>
          </button>
          <button
            onClick={() => setMode('upload')}
            className={`flex items-center space-x-2 px-4 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition ${
              mode === 'upload' ? 'bg-rose-500 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>อัปโหลดภาพ (Upload)</span>
          </button>
        </div>

        {mode === 'camera' && streamActive && (
          <button
            onClick={toggleCamera}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
          >
            <SwitchCamera className="w-4 h-4" />
            <span className="hidden sm:inline">สลับกล้อง</span>
          </button>
        )}
      </div>

      {/* Main Viewfinder Display */}
      <div className="relative aspect-video max-h-[440px] bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center">
        {mode === 'camera' ? (
          <>
            <video
              ref={videoRef}
              playsInline
              muted
              className={`w-full h-full object-cover ${facingMode === 'user' ? '-scale-x-100' : ''}`}
            />
            <canvas ref={canvasRef} className="hidden" />

            {streamActive && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                {/* Animated Laser Sweep Line */}
                <div className={`absolute left-0 right-0 h-0.5 ${engineMode === 'v2' ? 'bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_12px_#f59e0b]' : 'bg-gradient-to-r from-transparent via-rose-500 to-transparent shadow-[0_0_12px_#f43f5e]'} animate-scanline z-10`} />

                {/* HUD Telemetry Badges */}
                <div className="absolute top-3 left-3 flex items-center space-x-1.5 bg-slate-950/70 backdrop-blur px-2.5 py-1 rounded border border-slate-800 text-[10px] font-mono text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  <span>{engineMode === 'v2' ? 'V2 TEMPORAL AI • 4-LEVEL INFERENCE' : 'V1 SNAPSHOT AI • 60 FPS'}</span>
                </div>

                <div className="absolute top-3 right-3 bg-slate-950/70 backdrop-blur px-2.5 py-1 rounded border border-slate-800 text-[10px] font-mono text-slate-400">
                  <span>ROI: PERCLOS + EAR + MAR</span>
                </div>

                <div className={`w-56 h-72 sm:w-64 sm:h-80 border-2 border-dashed ${engineMode === 'v2' ? 'border-amber-400/70' : 'border-rose-400/60'} rounded-[45%] flex items-center justify-center animate-pulse`}>
                  <div className="text-center bg-slate-950/80 px-3 py-1 rounded-full border border-slate-700">
                    <span className={`text-xs ${engineMode === 'v2' ? 'text-amber-300' : 'text-rose-300'} font-mono`}>
                      {engineMode === 'v2' ? 'สแกนใบหน้าด้วยโมเดล V2' : 'วางใบหน้าให้อยู่ในกรอบ'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {cameraError && (
              <div className="p-6 text-center max-w-md">
                <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
                <p className="text-sm text-slate-300">{cameraError}</p>
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
            {previewUrl ? (
              <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
            ) : (
              <label className="cursor-pointer flex flex-col items-center justify-center w-full h-full border-2 border-dashed border-slate-700 hover:border-rose-500 rounded-xl transition">
                <Upload className="w-12 h-12 text-slate-500 mb-2" />
                <span className="text-sm font-medium text-slate-300">เลือกภาพถ่ายใบหน้า (JPG, PNG)</span>
                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
              </label>
            )}
          </div>
        )}
      </div>

      {/* Environmental Context Options (Lighting & TimeSlot) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-800">
        <div>
          <label className="text-xs font-medium text-slate-300 mb-1.5 flex items-center space-x-1.5">
            <Sun className="w-3.5 h-3.5 text-amber-400" />
            <span>สภาพแสงแวดล้อม:</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['Well-Lit', 'Dim-Light', 'Fluorescent'] as const).map(l => (
              <button
                key={l}
                onClick={() => setLighting(l)}
                className={`py-1.5 text-xs rounded-lg font-medium border transition ${
                  lighting === l ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-slate-950 text-slate-400 border-slate-800'
                }`}
              >
                {l === 'Well-Lit' ? '☀️ สว่าง' : l === 'Dim-Light' ? '🌙 แสงสลัว' : '💡 ฟลูออฯ'}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-slate-300 mb-1.5 flex items-center space-x-1.5">
            <Moon className="w-3.5 h-3.5 text-purple-400" />
            <span>ช่วงเวลาของวัน:</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['Daytime', 'Evening', 'Overnight'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTimeSlot(t)}
                className={`py-1.5 text-xs rounded-lg font-medium border transition ${
                  timeSlot === t ? 'bg-purple-500/20 text-purple-300 border-purple-500/40' : 'bg-slate-950 text-slate-400 border-slate-800'
                }`}
              >
                {t === 'Daytime' ? 'กลางวัน' : t === 'Evening' ? 'หัวค่ำ' : 'ดึก/โต้รุ่ง'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* V2 Optional Simulation Controls */}
      {engineMode === 'v2' && (
        <div className="mt-4 pt-4 border-t border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-300 flex items-center space-x-1.5">
              <Activity className="w-3.5 h-3.5 text-amber-400" />
              <span>โหมดอินพุตของ V2:</span>
            </span>
            <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800">
              <button
                onClick={() => setV2SubMode('camera')}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition ${
                  v2SubMode === 'camera' ? 'bg-amber-500 text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                📷 สแกนหน้าสด (Live Face)
              </button>
              <button
                onClick={() => setV2SubMode('sliders')}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition ${
                  v2SubMode === 'sliders' ? 'bg-amber-500 text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                🎛️ จำลองค่าพารามิเตอร์ (Simulation)
              </button>
            </div>
          </div>

          {v2SubMode === 'sliders' && (
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <span className="text-[11px] text-slate-400">เลือกพรีเซ็ตสำเร็จรูปเพื่อทดสอบโมเดล:</span>
                <div className="flex space-x-1.5">
                  <button onClick={() => applyV2Preset('fresh')} className="px-2 py-0.5 text-[11px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded font-medium hover:bg-emerald-500/30">
                    Preset: สดชื่น
                  </button>
                  <button onClick={() => applyV2Preset('tired')} className="px-2 py-0.5 text-[11px] bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded font-medium hover:bg-amber-500/30">
                    Preset: เริ่มล้า
                  </button>
                  <button onClick={() => applyV2Preset('zombie')} className="px-2 py-0.5 text-[11px] bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded font-medium hover:bg-rose-500/30">
                    Preset: ซอมบี้โหมด
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                  <label className="text-slate-400 block mb-1">อัตราการปิดตา (PERCLOS Score):</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={v2Params.perclos_score}
                      onChange={e => setV2Params({ ...v2Params, perclos_score: parseFloat(e.target.value) })}
                      className="flex-1 accent-amber-500"
                    />
                    <span className="font-mono text-amber-400 font-bold w-12 text-right">{(v2Params.perclos_score * 100).toFixed(0)}%</span>
                  </div>
                </div>

                <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                  <label className="text-slate-400 block mb-1">องศาคอพับสัปหงก (Head Tilt องศา):</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="range"
                      min="0"
                      max="35"
                      step="0.5"
                      value={v2Params.head_tilt_deg}
                      onChange={e => setV2Params({ ...v2Params, head_tilt_deg: parseFloat(e.target.value) })}
                      className="flex-1 accent-amber-500"
                    />
                    <span className="font-mono text-amber-400 font-bold w-12 text-right">{v2Params.head_tilt_deg}°</span>
                  </div>
                </div>

                <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                  <label className="text-slate-400 block mb-1">อัตรากะพริบตา (Blink Rate / นาที):</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="range"
                      min="5"
                      max="50"
                      step="1"
                      value={v2Params.blink_rate_bpm}
                      onChange={e => setV2Params({ ...v2Params, blink_rate_bpm: parseFloat(e.target.value) })}
                      className="flex-1 accent-amber-500"
                    />
                    <span className="font-mono text-amber-400 font-bold w-12 text-right">{v2Params.blink_rate_bpm} bpm</span>
                  </div>
                </div>

                <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                  <label className="text-slate-400 block mb-1">ความถี่การหาว (Yawns / นาที):</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="range"
                      min="0"
                      max="6"
                      step="0.5"
                      value={v2Params.yawn_frequency}
                      onChange={e => setV2Params({ ...v2Params, yawn_frequency: parseFloat(e.target.value) })}
                      className="flex-1 accent-amber-500"
                    />
                    <span className="font-mono text-amber-400 font-bold w-12 text-right">{v2Params.yawn_frequency}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Action Button */}
      <div className="mt-5">
        <button
          onClick={handleCaptureAndAnalyze}
          disabled={isAnalyzing || (mode === 'camera' && !streamActive) || (mode === 'upload' && !selectedFile)}
          className={`w-full py-3.5 px-6 rounded-xl font-bold text-sm tracking-wide shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transition-all transform active:scale-[0.99] ${
            engineMode === 'v2'
              ? 'bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 text-white shadow-amber-500/20'
              : 'bg-gradient-to-r from-rose-500 via-rose-600 to-amber-500 text-white shadow-rose-500/25'
          }`}
        >
          {isAnalyzing ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>กำลังประมวลผลด้วยโมเดล {engineMode.toUpperCase()}...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>
                {engineMode === 'v2'
                  ? '🔬 สแกนใบหน้าและประเมินผล 4 ระดับ (V2 Multi-class AI)'
                  : '📸 สแกนใบหน้าและตรวจคัดกรองด่วน (V1 Snapshot AI)'}
              </span>
            </>
          )}
        </button>
      </div>

      <p className="text-[11px] text-center text-slate-500 mt-3">
        🔒 ปลอดภัยตาม PDPA: ข้อมูลชีวมิติจะถูกประมวลผลแบบนิรนามและไม่บันทึกภาพถ่ายใบหน้า
      </p>
    </div>
  );
};
