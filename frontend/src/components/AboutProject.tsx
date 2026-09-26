import React from 'react';
import { BookOpen, ExternalLink, Code2, HeartPulse, Sparkles } from 'lucide-react';

export const AboutProject: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 backdrop-blur-md">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center shadow-lg shadow-rose-500/20">
            <HeartPulse className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              ระบบตรวจคัดกรองความเหนื่อยล้าสะสมทางชีวมิติ (Student Zombie Meter)
            </h2>
            <p className="text-xs text-slate-400">
              Biometric Facial Fatigue Screening System using Computer Vision and Machine Learning
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-800 text-xs">
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
            <span className="text-slate-400">โครงงานรายวิชา:</span>
            <p className="font-semibold text-white mt-0.5">Machine Learning Application (100 คะแนนเต็ม)</p>
          </div>
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
            <span className="text-slate-400">รหัสนักศึกษา:</span>
            <p className="font-semibold text-rose-400 font-mono mt-0.5">6710210312</p>
          </div>
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
            <span className="text-slate-400">สถาปัตยกรรมระบบ:</span>
            <p className="font-semibold text-emerald-400 mt-0.5">Vercel (UI) + HuggingFace (AI) + Supabase (DB)</p>
          </div>
        </div>
      </div>

      {/* 4 Biometric Markers */}
      <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 backdrop-blur-md">
        <h3 className="text-base font-bold text-white mb-3 flex items-center space-x-2">
          <BookOpen className="w-5 h-5 text-amber-400" />
          <span>ทฤษฎีชีวมิติและฟีเจอร์การตรวจจับใบหน้า (Biometric Feature Extraction)</span>
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          ระบบสกัด 7 ฟีเจอร์ (5 ตัวเลขชีวมิติ + 2 ปัจจัยแวดล้อม) อ้างอิงตามหลักการสรีรวิทยาและคอมพิวเตอร์วิทัศน์:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="flex items-center space-x-2 mb-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <h4 className="font-bold text-emerald-400">1. Eye Aspect Ratio (EAR)</h4>
            </div>
            <p className="text-slate-300 leading-relaxed">
              อัตราส่วนความกว้างต่อความสูงของเปลือกตาตามสมการ Soukupová and Čech (2016) เมื่อตื่นตัวค่าจะอยู่ที่ ~0.30-0.40 แต่เมื่อเกิดอาการง่วงจะลดฮวบลงต่ำกว่า 0.20
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="flex items-center space-x-2 mb-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-400" />
              <h4 className="font-bold text-purple-400">2. Mouth Aspect Ratio (MAR)</h4>
            </div>
            <p className="text-slate-300 leading-relaxed">
              สัดส่วนการอ้าปากเพื่อตรวจจับพฤติกรรมการหาว (Yawning Detection) ค่าปกติจะต่ำกว่า 0.25 แต่หากเกิดการหาว ค่าจะพุ่งเกิน 0.45 อย่างมีนัยสำคัญ
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="flex items-center space-x-2 mb-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-400" />
              <h4 className="font-bold text-rose-400">3. Under-Eye Darkness Ratio (CIE L*a*b*)</h4>
            </div>
            <p className="text-slate-300 leading-relaxed">
              ความคล้ำใต้ตาเทียบกับความสว่างหน้าผากในระบบสี CIE L*a*b* (Luminance L-channel) เพื่อลดอิทธิพลของสีผิวและสภาพแสงแวดล้อม
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="flex items-center space-x-2 mb-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <h4 className="font-bold text-amber-400">4. Temporal Dynamics & Circadian Rhythm</h4>
            </div>
            <p className="text-slate-300 leading-relaxed">
              การผสานมิติของเวลา (Daytime, Evening, Overnight) และสภาพแสง เพื่อประเมินความล้าสะสมตามนาฬิกาชีวิตจริงของนักศึกษา
            </p>
          </div>
        </div>
      </div>

      {/* External Links */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-950 border border-slate-800">
        <div>
          <span className="text-xs text-slate-400">ซอร์สโค้ดและรายงานวิจัยฉบับสมบูรณ์</span>
          <p className="text-sm font-semibold text-white mt-0.5">เข้าถึง Repository และเปิดรันบน Google Colab ได้ทันที</p>
        </div>

        <div className="flex items-center space-x-3">
          <a
            href="https://github.com/wafidkung/student-zombie-meter"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition"
          >
            <Code2 className="w-4 h-4" />
            <span>GitHub Repository</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </a>

          <a
            href="https://colab.research.google.com/github/wafidkung/student-zombie-meter/blob/main/student_zombie_meter_colab.ipynb"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-semibold border border-amber-500/40 transition"
          >
            <Sparkles className="w-4 h-4" />
            <span>Open in Colab</span>
            <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
          </a>
        </div>
      </div>
    </div>
  );
};
