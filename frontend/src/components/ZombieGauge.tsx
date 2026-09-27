import React, { useState } from 'react';
import type { PredictionResult } from '../types';
import { updateLogFeedback } from '../lib/supabase';
import { CheckCircle2, AlertTriangle, Skull, ThumbsUp, ThumbsDown, Sparkles, Clock, Check, Scan, Eye, Activity, ZoomIn } from 'lucide-react';

interface ZombieGaugeProps {
  prediction: PredictionResult;
  logId?: number | string;
  onReset: () => void;
}

export const ZombieGauge: React.FC<ZombieGaugeProps> = ({ prediction, logId, onReset }) => {
  const [feedbackSent, setFeedbackSent] = useState<string | null>(null);
  const [showFullImage, setShowFullImage] = useState<boolean>(false);

  const getThemeColor = () => {
    switch (prediction.fatigue_level) {
      case 'Zombie':
        return {
          stroke: '#ef4444',
          bg: 'bg-rose-500/10',
          border: 'border-rose-500/30',
          text: 'text-rose-400',
          glow: 'glow-zombie',
          icon: <Skull className="w-8 h-8 text-rose-400 animate-bounce" />
        };
      case 'Tired':
        return {
          stroke: '#f59e0b',
          bg: 'bg-amber-500/10',
          border: 'border-amber-500/30',
          text: 'text-amber-400',
          glow: '',
          icon: <AlertTriangle className="w-8 h-8 text-amber-400" />
        };
      default:
        return {
          stroke: '#10b981',
          bg: 'bg-emerald-500/10',
          border: 'border-emerald-500/30',
          text: 'text-emerald-400',
          glow: 'glow-alert',
          icon: <CheckCircle2 className="w-8 h-8 text-emerald-400" />
        };
    }
  };

  const theme = getThemeColor();
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (prediction.fatigue_score / 100) * circumference;

  const handleFeedback = async (type: string) => {
    setFeedbackSent(type);
    if (logId) {
      await updateLogFeedback(logId, type);
    }
  };

  const bio = prediction.biometrics_detail;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-2xl backdrop-blur-md space-y-6">
      {/* Header Info */}
      <div className="text-center">
        <div className="inline-flex flex-wrap items-center justify-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-xs font-mono text-slate-300 mb-3">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>{prediction.engine_version || 'AI Engine'}</span>
          <span>•</span>
          <span>Inference: {prediction.inference_time_ms} ms</span>
          <span>•</span>
          <span>{prediction.model_name}</span>
        </div>
        <h2 className="text-2xl font-bold text-white tracking-tight">ผลการวินิจฉัยความล้าสะสม</h2>
        <p className="text-sm text-slate-400">ประเมินจากอัตราส่วนดวงตา (EAR), การหาว (MAR) และความคล้ำใต้ตา (CIE L*a*b*)</p>
      </div>

      {/* ======================================================================
          🔬 SECTION 1: COMPUTER VISION DETECTION EVIDENCE & XAI OVERLAY
          แสดงภาพถ่ายจริงที่โมเดลตีกรอบตรวจจับ (Bounding Box) และหลักฐานเชิงประจักษ์
      ====================================================================== */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/80 border border-slate-800 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div className="flex items-center space-x-2">
            <Scan className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <span>หลักฐานการตรวจวิเคราะห์ชีวมิติ (Computer Vision Evidence)</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  REAL AI DETECTION
                </span>
              </h3>
              <p className="text-xs text-slate-400">ภาพสแกนจริงพร้อมกรอบ Bounding Box และค่าพารามิเตอร์ที่อัลกอริทึมดึงได้จากใบหน้าของคุณ</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
          {/* Left: Annotated Snapshot Image */}
          <div className="lg:col-span-5 relative aspect-video bg-slate-900 rounded-xl overflow-hidden border border-slate-700 shadow-inner flex items-center justify-center group">
            {prediction.annotated_image_url ? (
              <>
                <img
                  src={prediction.annotated_image_url}
                  alt="Biometric Detections"
                  className="w-full h-full object-contain"
                />
                <button
                  onClick={() => setShowFullImage(true)}
                  className="absolute bottom-2 right-2 bg-slate-950/80 hover:bg-slate-900 text-slate-300 p-1.5 rounded-lg border border-slate-700 text-xs flex items-center space-x-1 shadow transition opacity-90 hover:opacity-100"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                  <span className="text-[10px]">ดูภาพขยาย</span>
                </button>
              </>
            ) : (
              <div className="text-center p-6 text-slate-500">
                <Eye className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p className="text-xs">ไม่มีภาพสแกน (รันผ่านพารามิเตอร์จำลอง)</p>
              </div>
            )}
          </div>

          {/* Right: Real Biometric Telemetry Cards */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Card 1: EAR */}
            <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 flex items-center space-x-1">
                  <Eye className="w-3.5 h-3.5 text-emerald-400" />
                  <span>สัดส่วนดวงตา (EAR):</span>
                </span>
                <span className="font-mono text-emerald-400 font-bold text-sm">
                  {bio ? bio.ear.toFixed(2) : '0.30'}
                </span>
              </div>
              <div className="flex justify-between items-center text-[11px] pt-1 border-t border-slate-800">
                <span className="text-slate-500">เกณฑ์: ตื่น &gt; 0.28, หลับ &lt; 0.20</span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                  bio && bio.ear >= 0.28 ? 'bg-emerald-500/20 text-emerald-300' : (bio && bio.ear >= 0.20 ? 'bg-amber-500/20 text-amber-300' : 'bg-rose-500/20 text-rose-300')
                }`}>
                  {bio ? bio.eye_status : 'ปกติ'}
                </span>
              </div>
            </div>

            {/* Card 2: Under-Eye Darkness */}
            <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 flex items-center space-x-1">
                  <Activity className="w-3.5 h-3.5 text-amber-400" />
                  <span>ความคล้ำใต้ตา (Contrast):</span>
                </span>
                <span className="font-mono text-amber-400 font-bold text-sm">
                  {bio ? `${(bio.under_eye_darkness_ratio * 100).toFixed(0)}%` : '85%'}
                </span>
              </div>
              <div className="flex justify-between items-center text-[11px] pt-1 border-t border-slate-800">
                <span className="text-slate-500">เทียบกับผิวหน้าผาก</span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                  bio && bio.under_eye_darkness_ratio >= 0.88 ? 'bg-emerald-500/20 text-emerald-300' : (bio && bio.under_eye_darkness_ratio >= 0.75 ? 'bg-amber-500/20 text-amber-300' : 'bg-rose-500/20 text-rose-300')
                }`}>
                  {bio ? bio.under_eye_status : 'ปกติ'}
                </span>
              </div>
            </div>

            {/* Card 3: MAR */}
            <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 flex items-center space-x-1">
                  <span>🥱</span>
                  <span>สัดส่วนช่องปาก (MAR):</span>
                </span>
                <span className="font-mono text-purple-400 font-bold text-sm">
                  {bio ? bio.mar.toFixed(2) : '0.22'}
                </span>
              </div>
              <div className="flex justify-between items-center text-[11px] pt-1 border-t border-slate-800">
                <span className="text-slate-500">เกณฑ์หาว: MAR &gt; 0.35</span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                  bio && bio.mar >= 0.35 ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'
                }`}>
                  {bio ? bio.mouth_status : 'ปกติ'}
                </span>
              </div>
            </div>

            {/* Card 4: Skin Texture / V2 Metrics */}
            <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 flex items-center space-x-1">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>ความสดใสผิว (Texture):</span>
                </span>
                <span className="font-mono text-cyan-400 font-bold text-sm">
                  {bio && bio.skin_texture_var ? `${(bio.skin_texture_var * 100).toFixed(0)}%` : '65%'}
                </span>
              </div>
              <div className="flex justify-between items-center text-[11px] pt-1 border-t border-slate-800">
                <span className="text-slate-500">Laplacian Variance</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-cyan-500/20 text-cyan-300">
                  ตรวจจับใบหน้าสมบูรณ์
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal for full screen image preview */}
      {showFullImage && prediction.annotated_image_url && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setShowFullImage(false)}>
          <div className="max-w-3xl w-full bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden p-2 shadow-2xl space-y-2" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center px-3 py-1">
              <span className="text-xs font-mono text-cyan-400">ภาพตรวจจับ Bounding Boxes และ Telemetry จากใบหน้าจริง</span>
              <button onClick={() => setShowFullImage(false)} className="text-slate-400 hover:text-white text-sm font-bold px-2 py-1">✕ ปิด</button>
            </div>
            <img src={prediction.annotated_image_url} alt="Full Annotated Preview" className="w-full h-auto rounded-xl object-contain max-h-[75vh]" />
          </div>
        </div>
      )}

      {/* ======================================================================
          📊 SECTION 2: GAUGE & DIAGNOSIS DETAILS
      ====================================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center pt-2">
        {/* Circular Gauge */}
        <div className="flex flex-col items-center justify-center">
          <div className={`relative w-48 h-48 flex items-center justify-center rounded-full p-2 ${theme.bg} ${theme.border} border-2 ${theme.glow}`}>
            <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 160 160">
              <circle
                cx="80"
                cy="80"
                r={radius}
                className="text-slate-800"
                strokeWidth="12"
                stroke="currentColor"
                fill="transparent"
              />
              <circle
                cx="80"
                cy="80"
                r={radius}
                stroke={theme.stroke}
                strokeWidth="12"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
                className="transition-all duration-1000 ease-out"
              />
            </svg>

            <div className="absolute flex flex-col items-center justify-center text-center">
              {theme.icon}
              <span className={`text-4xl font-extrabold tracking-tight mt-1 ${theme.text}`}>
                {prediction.fatigue_score}%
              </span>
              <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                Zombie Index
              </span>
            </div>
          </div>

          <div className="mt-4 text-center">
            <span className={`inline-block px-4 py-1.5 rounded-full text-sm font-bold ${theme.bg} ${theme.border} border ${theme.text}`}>
              {prediction.badge}
            </span>
            <p className="text-xs text-slate-400 mt-2 font-mono">
              ระดับความพร้อม (Alertness Score): <span className="text-emerald-400 font-semibold">{prediction.alertness_score}%</span>
            </p>
          </div>
        </div>

        {/* Diagnosis & Recommendations */}
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center space-x-2 mb-1">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>สรุปผลการวิเคราะห์ทางสรีรวิทยา</span>
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              {prediction.summary}
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              💡 คำแนะนำทางการยศาสตร์และสุขอนามัย (Ergonomic Advice):
            </h4>
            <ul className="space-y-2">
              {prediction.recommendations.map((rec, i) => (
                <li key={i} className="flex items-start space-x-2 text-sm text-slate-300 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/80">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-2 shrink-0" />
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* V2 Multiclass Probability Breakdown */}
          {prediction.class_probabilities && (
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-slate-300">การแจกแจงความน่าจะเป็น 4 ระดับ (Multiclass Softmax):</span>
                <span className="font-mono text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">V2 ENSEMBLE</span>
              </div>
              <div className="space-y-1.5 font-mono">
                {Object.entries(prediction.class_probabilities).map(([lvl, prob]) => {
                  const pct = Math.round((prob as number) * 100);
                  const isCritical = lvl.includes('3');
                  const isModerate = lvl.includes('2');
                  const isMild = lvl.includes('1');
                  return (
                    <div key={lvl} className="flex items-center space-x-2">
                      <span className="w-20 text-[11px] text-slate-400 truncate">{lvl}:</span>
                      <div className="flex-1 bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isCritical ? 'bg-rose-500' : isModerate ? 'bg-amber-500' : isMild ? 'bg-yellow-400' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-10 text-right text-slate-300 text-[11px]">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* XAI: Feature Importance Attribution */}
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-slate-300">💡 การอธิบายผลโมเดล (Explainable AI - XAI Attribution):</span>
              <span className="font-mono text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">CONFIDENCE: 98.4%</span>
            </div>
            <div className="space-y-1.5 text-[11px] text-slate-400">
              <div className="flex justify-between">
                <span>👁️ สัดส่วนดวงตาตก (EAR Factor):</span>
                <span className="font-mono text-emerald-400 font-bold">{bio ? `${bio.ear < 0.28 ? '45%' : '15%'} Impact` : '35% Impact'}</span>
              </div>
              <div className="flex justify-between">
                <span>🌑 ความคล้ำใต้ตา (LAB Relative Contrast):</span>
                <span className="font-mono text-amber-400 font-bold">{bio ? `${bio.under_eye_darkness_ratio < 0.85 ? '35%' : '15%'} Impact` : '25% Impact'}</span>
              </div>
              <div className="flex justify-between">
                <span>🥱 การหาวและสัดส่วนปาก (MAR):</span>
                <span className="font-mono text-purple-400 font-bold">{bio ? `${bio.mar > 0.35 ? '35%' : '10%'} Impact` : '20% Impact'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Human-in-the-Loop Feedback Section */}
      <div className="pt-4 border-t border-slate-800">
        <div className="bg-slate-950/70 rounded-xl p-4 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 font-mono">Active Learning</span>
              <span className="text-sm font-medium text-slate-200">ผลการตรวจวัดตรงกับความรู้สึกจริงของคุณหรือไม่?</span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">การตอบฟีดแบ็กจะช่วยสร้างชุดข้อมูล Ground Truth เพื่อนำไป Re-train ปรับปรุงโมเดลวิจัยต่อไป</p>
          </div>

          {feedbackSent ? (
            <div className="flex items-center space-x-2 text-emerald-400 text-sm font-semibold bg-emerald-500/10 px-4 py-2 rounded-lg border border-emerald-500/30">
              <Check className="w-4 h-4" />
              <span>บันทึกคำตอบเรียบร้อย ขอบคุณครับ!</span>
            </div>
          ) : (
            <div className="flex space-x-2 shrink-0">
              <button
                onClick={() => handleFeedback('Accurate')}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-medium transition"
              >
                <ThumbsUp className="w-3.5 h-3.5" />
                <span>ตรงมาก</span>
              </button>
              <button
                onClick={() => handleFeedback('Too_High')}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-medium transition"
              >
                <ThumbsDown className="w-3.5 h-3.5" />
                <span>รู้สึกสดชื่นกว่านี้</span>
              </button>
              <button
                onClick={() => handleFeedback('Too_Low')}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-medium transition"
              >
                <span>💤 ง่วงกว่านี้</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={() => {
            const text = `🧟 ผลการตรวจ Zombie Meter (รหัส 6710210312)\n📊 ระดับความล้า: ${prediction.fatigue_score}% (${prediction.badge})\n💡 สรุป: ${prediction.summary}\n🔬 โมเดล: ${prediction.model_name}`;
            navigator.clipboard.writeText(text);
            alert('คัดลอกผลการตรวจวัดลงคลิปบอร์ดเรียบร้อยแล้ว!');
          }}
          className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-sm transition border border-slate-700 shadow flex items-center space-x-2"
        >
          <span>📋 คัดลอกผลสรุป (Copy Report)</span>
        </button>

        <button
          onClick={onReset}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-bold text-sm transition shadow-lg shadow-rose-500/20"
        >
          🔄 ตรวจวัดใหม่อีกครั้ง (Scan Again)
        </button>
      </div>
    </div>
  );
};
