import React, { useState } from 'react';
import type { PredictionResult } from '../types';
import { updateLogFeedback } from '../lib/supabase';
import { CheckCircle2, AlertTriangle, Skull, ThumbsUp, ThumbsDown, Sparkles, Clock, Check } from 'lucide-react';

interface ZombieGaugeProps {
  prediction: PredictionResult;
  logId?: number | string;
  onReset: () => void;
}

export const ZombieGauge: React.FC<ZombieGaugeProps> = ({ prediction, logId, onReset }) => {
  const [feedbackSent, setFeedbackSent] = useState<string | null>(null);

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

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl backdrop-blur-md">
      <div className="text-center mb-6">
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
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
        </div>
      </div>

      {/* Human-in-the-Loop Feedback Section */}
      <div className="mt-8 pt-6 border-t border-slate-800">
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

      <div className="mt-6 flex justify-center">
        <button
          onClick={onReset}
          className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-sm transition shadow-lg"
        >
          🔄 ตรวจวัดใหม่อีกครั้ง (Scan Again)
        </button>
      </div>
    </div>
  );
};
