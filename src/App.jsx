import React, { useState, useMemo } from 'react';
import { Download, Share2, Info, Moon, Sun, Zap } from 'lucide-react';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';

import VectorDiagram from './components/VectorDiagram';
import InputForm from './components/InputForm';
import ResultsDisplay from './components/ResultsDisplay';
import { calculatePhasePower, getPhaseSequence } from './utils/calculations';

const App = () => {
  const [angleMode, setAngleMode] = useState('relative'); // 'relative' or 'phi'
  const [scheme, setScheme] = useState('star');
  const [voltageType, setVoltageType] = useState('phase');
  
  const [measurements, setMeasurements] = useState({
    A: { U: 220, I: 5, angleU: 0, angleI: 330, phi: 30 },
    B: { U: 220, I: 5, angleU: 240, angleI: 210, phi: 30 },
    C: { U: 220, I: 5, angleU: 120, angleI: 90, phi: 30 }
  });

  // Derived results
  const results = useMemo(() => {
    try {
      const phaseResults = {};
      let totalP = 0, totalQ = 0, totalS = 0;

      ['A', 'B', 'C'].forEach(p => {
        let phiValue = 0;
        if (angleMode === 'relative') {
          phiValue = measurements[p].angleU - measurements[p].angleI;
        } else {
          phiValue = measurements[p].phi;
        }
        
        const res = calculatePhasePower(measurements[p].U, measurements[p].I, phiValue);
        phaseResults[p] = res;
        totalP += res.P;
        totalQ += res.Q;
        totalS += res.S;
      });

      const sequence = getPhaseSequence(
        measurements.A.angleU, 
        measurements.B.angleU, 
        measurements.C.angleU
      );

      return { 
        phaseResults, 
        total: { P: totalP, Q: totalQ, S: totalS }, 
        sequence 
      };
    } catch (e) {
      console.error("Calculation error:", e);
      return { phaseResults: { A: {P:0,Q:0,S:0,cosPhi:1}, B: {P:0,Q:0,S:0,cosPhi:1}, C: {P:0,Q:0,S:0,cosPhi:1} }, total: {P:0,Q:0,S:0}, sequence: 'Unknown' };
    }
  }, [measurements, angleMode]);

  // Diagnostics
  const diagnostics = useMemo(() => {
    const diags = [];

    // Check polarity (angle approx 180)
    ['A', 'B', 'C'].forEach(p => {
      const phi = angleMode === 'relative' ? (measurements[p].angleU - measurements[p].angleI) : measurements[p].phi;
      const normalizedPhi = ((phi % 360) + 360) % 360;
      if (Math.abs(normalizedPhi - 180) < 20) {
        diags.push({
          phase: p,
          severity: 'error',
          title: `Перевернута полярність струму (Фаза ${p})`,
          message: 'Трансформатор струму підключено навпаки або переплутані проводи вторинної обмотки.'
        });
      }
    });

    // Check sequence
    if (results.sequence === 'Reverse') {
      diags.push({
        severity: 'warning',
        title: 'Зворотна послідовність фаз (A-C-B)',
        message: 'Увага: Двигуни у цій мережі будуть обертатися у зворотному напрямку.'
      });
    }

    // Check angle imbalance (B and C relative to A)
    const norm = (a) => ((a % 360) + 360) % 360;
    const diffAB = norm(measurements.B.angleU - measurements.A.angleU);
    const diffAC = norm(measurements.C.angleU - measurements.A.angleU);
    
    if (Math.abs(diffAB - 240) > 15 || Math.abs(diffAC - 120) > 15) {
      diags.push({
        severity: 'error',
        title: 'Перекіс напруги або помилка фазування',
        message: 'Кути між фазними напругами суттєво відхиляються від 120°.'
      });
    }

    return diags;
  }, [measurements, results, angleMode]);

  // Prepare vectors for diagram
  const vectors = useMemo(() => {
    const v = [];
    const colors = { A: '#facc15', B: '#22c55e', C: '#ef4444' };

    ['A', 'B', 'C'].forEach(p => {
      // Voltage
      v.push({
        phase: p,
        magnitude: measurements[p].U,
        angle: measurements[p].angleU,
        color: colors[p],
        strokeWidth: 3,
        isDashed: false,
        label: `U${p}`
      });

      // Current (scaled for visibility)
      const currentScale = measurements[p].I > 0 ? (measurements[p].U / measurements[p].I) * 0.5 : 40;
      const angleI = angleMode === 'relative' ? measurements[p].angleI : measurements[p].angleU - measurements[p].phi;
      
      v.push({
        phase: p,
        magnitude: measurements[p].I * currentScale, 
        angle: angleI,
        color: colors[p],
        strokeWidth: 2,
        isDashed: true,
        label: `I${p}`
      });
    });

    return v;
  }, [measurements, angleMode]);

  const exportPDF = async () => {
    const element = document.getElementById('main-report');
    if (!element) return;
    
    try {
      const dataUrl = await toPng(element, { 
        backgroundColor: '#020617',
        cacheBust: true,
        filter: (node) => {
          return !node.hasAttribute || !node.hasAttribute('data-export-ignore');
        }
      });
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(dataUrl);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save('VectorAnalyzer_Report.pdf');
    } catch (e) {
      console.error("PDF Export error:", e);
      alert("Не вдалося згенерувати PDF. Будь ласка, спробуйте ще раз.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-500/30">
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/20">
              <Zap className="text-white" fill="white" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight uppercase">VectorAnalyzer <span className="text-blue-500">3Ph</span></h1>
              <p className="text-[10px] text-slate-500 font-semibold tracking-widest uppercase">Professional Power Diagnostics</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={exportPDF}
              data-export-ignore
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-all active:scale-95 cursor-pointer"
            >
              <Download size={16} /> Експорт PDF
            </button>
            <button 
              data-export-ignore
              className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 cursor-pointer"
            >
              <Share2 size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8" id="main-report">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Side: Inputs */}
          <div className="lg:col-span-12 xl:col-span-7 space-y-8">
            <section className="animate-fade-in">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Info className="text-blue-500" size={24} /> Параметри мережі
                </h2>
              </div>
              <InputForm 
                measurements={measurements} 
                setMeasurements={setMeasurements}
                angleMode={angleMode}
                setAngleMode={setAngleMode}
                scheme={scheme}
                setScheme={setScheme}
                voltageType={voltageType}
                setVoltageType={setVoltageType}
              />
            </section>

            <section className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Zap className="text-yellow-500" size={24} /> Результати аналізу
              </h2>
              <ResultsDisplay results={results} diagnostics={diagnostics} />
            </section>
          </div>

          {/* Right Side: Diagram */}
          <div className="lg:col-span-12 xl:col-span-5">
            <div className="sticky top-24 animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Info className="text-purple-500" size={24} /> Векторна діаграма
              </h2>
              <VectorDiagram vectors={vectors} />
              
              <div className="mt-6 p-4 bg-slate-800/30 rounded-xl border border-slate-800 text-sm text-slate-400">
                <p className="flex items-start gap-2 italic">
                  <Info size={16} className="mt-0.5 flex-shrink-0" />
                  Примітка: Вектори струму (пунктир) масштабовані для кращої видимості. Товсті лінії — вектори напруг.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="mt-20 border-t border-slate-900 bg-slate-950 p-8 text-center text-slate-600">
        <p className="text-sm">VectorAnalyzer 3Ph © 2026 • Розроблено для трифазних мереж України</p>
      </footer>
    </div>
  );
};

export default App;
