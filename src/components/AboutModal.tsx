import React from 'react';
import { X, Info, Smartphone, Monitor, CheckCircle2, Zap, RefreshCw } from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AboutModal({ isOpen, onClose }: AboutModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity animate-fade-in"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative bg-slate-900 border border-slate-700/50 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-zoom-in">
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900/50">
          <h2 className="text-xl font-bold text-white flex items-center gap-3">
            <div className="bg-blue-600/20 p-2 rounded-xl border border-blue-500/30">
              <Zap className="text-blue-400" size={20} />
            </div>
            Про VectorAnalyzer 3Ph
          </h2>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-all"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 md:p-8 overflow-y-auto max-h-[70vh] custom-scrollbar space-y-8">
          {/* App Info */}
          <section>
            <p className="text-slate-300 leading-relaxed">
              <strong>VectorAnalyzer 3Ph</strong> — це професійний інструмент для побудови та аналізу векторних діаграм трифазних електричних мереж. 
              Розроблено спеціально для фахівців енергетичного сектору України для роботи в польових умовах.
            </p>
          </section>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              "Класичні векторні діаграми",
              "Повний аналіз ВАФ (P, Q, S, cos φ)",
              "Автоматична діагностика лічильників",
              "Архівування та експорт результатів"
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-2 text-slate-400 text-sm bg-slate-800/40 p-3 rounded-xl border border-slate-800/50">
                <CheckCircle2 className="text-green-500 shrink-0" size={16} />
                {feature}
              </div>
            ))}
          </div>

          <hr className="border-slate-800" />

          {/* Installation Section */}
          <section className="space-y-4">
            <h3 className="text-white font-bold flex items-center gap-2">
              <Smartphone className="text-blue-400" size={18} />
              Встановлення програми (PWA)
            </h3>
            <p className="text-slate-400 text-sm">
              Цей додаток працює офлайн. Встановіть його на свій пристрій як звичайну програму:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-800/40 p-4 rounded-2xl border border-slate-700/30">
                <h4 className="text-blue-400 text-xs font-bold uppercase tracking-wider mb-2">Android / Chrome</h4>
                <p className="text-slate-300 text-xs leading-relaxed">
                  Натисніть на іконку <span className="text-white font-bold">«три крапки» ⋮</span> в браузері та оберіть 
                  <span className="text-blue-400"> «Встановити додаток»</span>.
                </p>
              </div>
              <div className="bg-slate-800/40 p-4 rounded-2xl border border-slate-700/30">
                <h4 className="text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">iOS / Safari</h4>
                <p className="text-slate-300 text-xs leading-relaxed">
                  Натисніть кнопку <span className="text-white font-bold">«Поділитися» ⎋</span> та оберіть 
                  <span className="text-amber-400"> «Додати на початковий екран»</span>.
                </p>
              </div>
            </div>

            <div className="bg-amber-600/10 p-4 rounded-2xl border border-amber-500/20 flex items-start gap-4">
              <RefreshCw className="text-amber-400 shrink-0 mt-1" size={20} />
              <div className="flex-1">
                <h4 className="text-white text-sm font-bold mb-1">Не бачите оновлень?</h4>
                <p className="text-slate-400 text-xs mb-3">
                  Якщо ви знаєте, що вийшла нова версія, але вона не з'являється — очистіть локальний кеш.
                </p>
                <button 
                  onClick={() => {
                    if (confirm('Це оновить всі файли програми. Продовжити?')) {
                      window.location.reload();
                      if (navigator.serviceWorker) {
                        navigator.serviceWorker.getRegistrations().then(registrations => {
                          for (let registration of registrations) { registration.unregister(); }
                        });
                      }
                    }
                  }}
                  className="bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all border border-amber-500/20"
                >
                  Очистити кеш та оновити
                </button>
              </div>
            </div>
          </section>
        </div>

        <div className="p-6 bg-slate-950/50 border-t border-slate-800 text-center">
          <p className="text-slate-500 text-xs">VectorAnalyzer 3Ph v1.4.0 • 2026.03</p>
          <p className="text-slate-600 text-[10px] mt-1 italic">Зроблено з повагою до праці енергетиків України</p>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes zoomIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-zoom-in {
          animation: zoomIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out forwards;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #334155;
          border-radius: 10px;
        }
      `}} />
    </div>
  );
}
