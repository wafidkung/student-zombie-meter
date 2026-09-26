import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { CameraScanner } from './components/CameraScanner';
import { ZombieGauge } from './components/ZombieGauge';
import { CircadianDashboard } from './components/CircadianDashboard';
import { AboutProject } from './components/AboutProject';
import type { PredictionResult } from './types';
import { ShieldCheck, Heart } from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'scanner' | 'analytics' | 'about'>('scanner');
  const [currentPrediction, setCurrentPrediction] = useState<PredictionResult | null>(null);
  const [currentLogId, setCurrentLogId] = useState<number | string | undefined>(undefined);

  const handlePredictionComplete = (pred: PredictionResult, logId?: number | string) => {
    setCurrentPrediction(pred);
    setCurrentLogId(logId);
  };

  const handleReset = () => {
    setCurrentPrediction(null);
    setCurrentLogId(undefined);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-rose-500 selection:text-white">
      {/* Navbar */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'scanner' && (
          <div className="max-w-4xl mx-auto space-y-6">
            {!currentPrediction ? (
              <CameraScanner onPredictionComplete={handlePredictionComplete} />
            ) : (
              <ZombieGauge
                prediction={currentPrediction}
                logId={currentLogId}
                onReset={handleReset}
              />
            )}
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <CircadianDashboard />
          </div>
        )}

        {activeTab === 'about' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <AboutProject />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950/60 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>โครงงานรายวิชา Machine Learning Application (100 คะแนนเต็ม)</span>
          </div>
          <div className="flex items-center space-x-1">
            <span>พัฒนาโดย</span>
            <span className="font-mono text-rose-400 font-semibold">นายวรัญญู เอมะ (6710210312)</span>
            <span className="text-slate-600">•</span>
            <span>Made with</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 inline fill-rose-500" />
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
