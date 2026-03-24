import { useState, useMemo } from 'react';
import { flushSync } from 'react-dom';
import { Download, Info, Zap } from 'lucide-react';
import { jsPDF } from 'jspdf';

import { captureReportElementToPngDataUrl } from './utils/captureReportPng';

import VectorDiagram from './components/VectorDiagram';
import { VafAnalyzer } from './components/VafAnalyzer';
import InputForm from './components/InputForm';
import ResultsDisplay from './components/ResultsDisplay';
import { PdfExportDocument } from './components/PdfExportDocument';
import { RightTriangleDiagram } from './components/diagrams/RightTriangleDiagram';
import { PhasorPolygonDiagram } from './components/diagrams/PhasorPolygonDiagram';
import { OssannaDiagram } from './components/diagrams/OssannaDiagram';
import { SmithChartDiagram } from './components/diagrams/SmithChartDiagram';
import {
  calculatePhasePower,
  getPhaseSequence,
  toPhaseVoltage,
  degToRad,
  phasePhiDeg,
  formatScalarForLabel,
} from './utils/calculations';
import { buildDiagramVectors } from './utils/diagramVectors';

const RADIAL_MODES = new Set(['combined', 'voltage', 'current', 'line', 'power', 'sequence']);

const DIAGRAM_GROUPS = [
  {
    title: 'Трифазні: зірка (промені)',
    modes: [
      { id: 'combined', label: 'U та I' },
      { id: 'voltage', label: 'Промені Uф' },
      { id: 'current', label: 'Промені I' },
      { id: 'line', label: 'Лінійні U' },
      { id: 'sequence', label: 'Складові 0–1–2' },
      { id: 'polygon', label: 'Багатокутник ΣUф' },
    ],
  },
  {
    title: 'Трикутники Піфагора (1ф екв.)',
    modes: [
      { id: 'powerTriangle', label: 'P, Q, S (Σ)' },
      { id: 'voltageTriangle', label: 'U_R, U_X, U' },
      { id: 'impedanceTriangle', label: 'R, X, Z' },
    ],
  },
  {
    title: 'Кругові (огляд)',
    modes: [
      { id: 'power', label: 'ΣP,ΣQ,ΣS промені' },
      { id: 'ossanna', label: 'Оссана' },
      { id: 'smith', label: 'Сміт' },
    ],
  },
];

const DIAGRAM_NOTES = {
  combined:
    'Довжини векторів I на крузі зменшені. Підписи: дійсні U, I та кути. U на діаграмі в масштабі Uф; у підписі — введене значення (Uф/Uл).',
  voltage: 'Зіркоподібна (променева) діаграма: фазні напруги Uф з умовної нейтралі — типовий вигляд симетричної зірки (класичні ~120°).',
  current:
    'Промені струмів фаз; довжини нормовані до max|I|, підписи — дійсні А та кути.',
  line: 'Лінійні U_AB, U_BC, U_CA як різниця фазорів (модель зірки).',
  power:
    'Сумарні P, Q, S з центру: довжини нормовані до max(|ΣP|,|ΣQ|,ΣS) — порівняльна «променева» форма (поряд із трикутником потужностей).',
  sequence:
    'Симетричні складові Фортеск\'ю напруг: V₀, V₁, V₂.',
  polygon:
    'Замкнений багатокутник: фазні напруги послідовно «голова в хвіст». За повної симетрії векторна сума U_A+U_B+U_C → 0 (контур замикається).',
  powerTriangle:
    'Трикутник потужностей для сум по трифазі: катети ΣP та ΣQ, гіпотенуза S′=√(ΣP²+ΣQ²). Сума фазних Sᵢ може трохи відрізнятися при перекосі.',
  voltageTriangle:
    'Трикутник напруг однофазного еквівалента обраної фази: U_R = U·cos φ, U_X = U·sin φ (φ — кут між U та I), гіпотенуза — повна фазна U.',
  impedanceTriangle:
    'Трикутник опорів: R = Z·cos φ, X = Z·sin φ, Z = Uф/I; типовий зв’язок для серійного R–X.',
  ossanna:
    'Діаграма Оссана: спрощена схема кола струму статора АД. Повна побудова — за схемою заміщення та опором ротора при різних ковзаннях.',
  smith:
    'Фрагмент діаграми Сміта: нормовані опори на лініях передачі / узгодження (РЧ; для силових КЗЛН часто інші номограми).',
};

const diagramModeLabelLookup = (mode) => {
  for (const g of DIAGRAM_GROUPS) {
    const m = g.modes.find((x) => x.id === mode);
    if (m) return m.label;
  }
  return mode;
};

const App = () => {
  const [appSection, setAppSection] = useState('classic'); // 'classic' | 'vaf'
  const [angleMode, setAngleMode] = useState('relative'); // 'relative' or 'phi'
  const [scheme, setScheme] = useState('star');
  const [voltageType, setVoltageType] = useState('phase');
  const [diagramMode, setDiagramMode] = useState('combined');
  const [trianglePhase, setTrianglePhase] = useState('A');
  const [pdfCaptureOpen, setPdfCaptureOpen] = useState(false);
  
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

        const Uphase = toPhaseVoltage(measurements[p].U, voltageType, scheme);
        const res = calculatePhasePower(Uphase, measurements[p].I, phiValue);
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
  }, [measurements, angleMode, scheme, voltageType]);

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

  const vectors = useMemo(() => {
    if (!RADIAL_MODES.has(diagramMode)) return [];
    return buildDiagramVectors(diagramMode, {
      measurements,
      angleMode,
      scheme,
      voltageType,
      results,
    });
  }, [diagramMode, measurements, angleMode, scheme, voltageType, results]);

  const renderDiagram = (vectorSize = 960) => {
    if (RADIAL_MODES.has(diagramMode)) {
      return <VectorDiagram vectors={vectors} size={vectorSize} />;
    }
    if (diagramMode === 'polygon') {
      return (
        <PhasorPolygonDiagram
          measurements={measurements}
          scheme={scheme}
          voltageType={voltageType}
          size={Math.min(680, Math.round(vectorSize * 0.95))}
        />
      );
    }
    if (diagramMode === 'powerTriangle') {
      const P = results.total.P;
      const Q = results.total.Q;
      const Sgeom = Math.hypot(P, Q) || 1e-9;
      const phi = (Math.atan2(Q, P) * 180) / Math.PI;
      return (
        <RightTriangleDiagram
          title="Трикутник потужностей (сума по трьох фазах)"
          legH={Math.abs(P)}
          legV={Q}
          hyp={Sgeom}
          valueH={P}
          valueV={Q}
          valueHyp={Sgeom}
          labelH="ΣP"
          labelV="ΣQ"
          labelHyp="S′"
          unitH="Вт"
          unitV="вар"
          unitHyp="В·А"
          phiDeg={phi}
          subNote={`Сума фазних Sᵢ = ${formatScalarForLabel(results.total.S)} В·А. Якщо є перекіс фаз, S′ = √(P²+Q²) не збігається з ΣSᵢ точно.`}
        />
      );
    }
    if (diagramMode === 'voltageTriangle') {
      const p = trianglePhase;
      const Uphase = toPhaseVoltage(measurements[p].U, voltageType, scheme);
      const phi = phasePhiDeg(measurements, angleMode, p);
      const rad = degToRad(phi);
      const UR = Uphase * Math.cos(rad);
      const UX = Uphase * Math.sin(rad);
      return (
        <RightTriangleDiagram
          title={`Трикутник напруг — фаза ${p}`}
          legH={Math.abs(UR)}
          legV={UX}
          hyp={Uphase}
          labelH="U_R"
          labelV="U_X"
          labelHyp="Uф"
          unitH="В"
          unitV="В"
          unitHyp="В"
          phiDeg={phi}
          subNote="U_R — активна (у фазі зі струмом) складова напруги; U_X — реактивна (індуктивна/ємнісна)."
        />
      );
    }
    if (diagramMode === 'impedanceTriangle') {
      const p = trianglePhase;
      const Uphase = toPhaseVoltage(measurements[p].U, voltageType, scheme);
      const I = Math.max(measurements[p].I, 1e-9);
      const Z = Uphase / I;
      const phi = phasePhiDeg(measurements, angleMode, p);
      const rad = degToRad(phi);
      const R = Z * Math.cos(rad);
      const X = Z * Math.sin(rad);
      return (
        <RightTriangleDiagram
          title={`Трикутник опорів — фаза ${p}`}
          legH={Math.abs(R)}
          legV={X}
          hyp={Z}
          labelH="R"
          labelV="X"
          labelHyp="Z"
          unitH="Ом"
          unitV="Ом"
          unitHyp="Ом"
          phiDeg={phi}
          subNote={`Z = Uф/I; φ такий самий, як у трикутнику напруг і потужностей для цієї фази.`}
        />
      );
    }
    if (diagramMode === 'ossanna') {
      return <OssannaDiagram />;
    }
    if (diagramMode === 'smith') {
      return <SmithChartDiagram />;
    }
    return <VectorDiagram vectors={vectors} size={vectorSize} />;
  };

  const exportPDF = async () => {
    if (!document.getElementById('pdf-report-export'))  {
      alert('Не знайдено макету звіту. Спробуйте оновити сторінку.');
      return;
    }

    flushSync(() => setPdfCaptureOpen(true));
    await new Promise((r) =>
      requestAnimationFrame(() =>
        requestAnimationFrame(() => setTimeout(r, 320)),
      ),
    );

    const element = document.getElementById('pdf-report-export');
    if (!element) {
      alert('Макет звіту тимчасово недоступний. Спробуйте ще раз.');
      flushSync(() => setPdfCaptureOpen(false));
      return;
    }

    try {
      const w = element.offsetWidth;
      const h = element.offsetHeight;
      if (!w || !h) {
        throw new Error('Макет звіту має нульовий розмір.');
      }

      const dataUrl = await captureReportElementToPngDataUrl(element);

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const margin = 15;
      const usableW = pageW - 2 * margin;
      const usableH = pageH - 2 * margin;

      const imgProps = pdf.getImageProperties(dataUrl);
      const iw = imgProps.width;
      const ih = imgProps.height;
      if (!iw || !ih || !Number.isFinite(iw) || !Number.isFinite(ih)) {
        throw new Error('Некоректні розміри зображення для PDF.');
      }

      // Масштабуємо так, щоб звіт гарантовано вліз в один A4 (usableW x usableH).
      // Додаємо кліпування на випадок похибок округлення.
      const imgScale = Math.min(usableW / iw, usableH / ih);
      let imgWmm = iw * imgScale;
      let imgHmm = ih * imgScale;

      if (!Number.isFinite(imgWmm) || !Number.isFinite(imgHmm) || imgWmm <= 0 || imgHmm <= 0) {
        throw new Error('Некоректні розміри зображення у PDF (масштаб не вдалося обчислити).');
      }

      if (imgHmm > usableH) {
        imgHmm = usableH;
        imgWmm = (iw * imgHmm) / ih;
      }
      if (imgWmm > usableW) {
        imgWmm = usableW;
        imgHmm = (ih * imgWmm) / iw;
      }

      const imgX = margin + Math.max(0, (usableW - imgWmm) / 2);
      const imgY = margin + Math.max(0, (usableH - imgHmm) / 2);

      pdf.addImage(dataUrl, 'PNG', imgX, imgY, imgWmm, imgHmm);

      pdf.save('VectorAnalyzer_Report.pdf');
    } catch (e) {
      console.error('PDF Export error:', e);
      alert(
        e instanceof Error && e.message
          ? e.message
          : 'Не вдалося згенерувати PDF. Будь ласка, спробуйте ще раз.',
      );
    } finally {
      flushSync(() => setPdfCaptureOpen(false));
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-500/30">
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-screen-2xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/20">
              <Zap className="text-white" fill="white" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight uppercase">VectorAnalyzer <span className="text-blue-500">3Ph</span></h1>
              <p className="text-[10px] text-slate-500 font-semibold tracking-widest uppercase">Professional Power Diagnostics</p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap justify-end">
            <div className="flex rounded-lg border border-slate-700 overflow-hidden">
              <button
                type="button"
                onClick={() => setAppSection('classic')}
                className={`px-3 py-2 text-xs font-semibold transition-colors ${
                  appSection === 'classic'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                }`}
              >
                VectorAnalyzer
              </button>
              <button
                type="button"
                onClick={() => setAppSection('vaf')}
                className={`px-3 py-2 text-xs font-semibold transition-colors ${
                  appSection === 'vaf'
                    ? 'bg-cyan-600 text-white'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                }`}
              >
                ВАФ-Аналізатор
              </button>
            </div>
            {appSection === 'classic' ? (
              <button
                type="button"
                onClick={exportPDF}
                data-export-ignore
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-all active:scale-95 cursor-pointer"
              >
                <Download size={16} /> Експорт PDF
              </button>
            ) : null}
          </div>
        </div>
      </header>

      <main className="max-w-screen-2xl mx-auto px-4 py-8 w-full" id="main-report">
        {appSection === 'vaf' ? (
          <VafAnalyzer />
        ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Side: Inputs */}
          <div className="lg:col-span-12 xl:col-span-4 2xl:col-span-5 space-y-8 min-w-0">
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
          <div className="lg:col-span-12 xl:col-span-8 2xl:col-span-7 min-w-0 w-full">
            <div className="sticky top-24 animate-fade-in w-full min-w-0" style={{ animationDelay: '0.2s' }}>
              <h2 className="text-2xl font-bold mb-3 flex items-center gap-2">
                <Info className="text-purple-500" size={24} /> Векторні діаграми
              </h2>
              <div className="space-y-3 mb-4" data-export-ignore>
                {DIAGRAM_GROUPS.map((group) => (
                  <div key={group.title}>
                    <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1.5 font-semibold">
                      {group.title}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {group.modes.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setDiagramMode(m.id)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                            diagramMode === m.id
                              ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-900/30'
                              : 'bg-slate-800/80 border-slate-600 text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              {(diagramMode === 'voltageTriangle' || diagramMode === 'impedanceTriangle') && (
                <div className="flex flex-wrap items-center gap-2 mb-3" data-export-ignore>
                  <span className="text-xs text-slate-500">Фаза трикутника:</span>
                  {['A', 'B', 'C'].map((ph) => (
                    <button
                      key={ph}
                      type="button"
                      onClick={() => setTrianglePhase(ph)}
                      className={`px-2 py-1 rounded text-xs font-bold border ${
                        trianglePhase === ph
                          ? 'bg-amber-600/30 border-amber-500 text-amber-200'
                          : 'bg-slate-800 border-slate-600 text-slate-400'
                      }`}
                    >
                      {ph}
                    </button>
                  ))}
                </div>
              )}
              {renderDiagram(960)}
              
              <div className="mt-6 p-4 bg-slate-800/30 rounded-xl border border-slate-800 text-sm text-slate-400">
                <p className="flex items-start gap-2 italic">
                  <Info size={16} className="mt-0.5 flex-shrink-0" />
                  {DIAGRAM_NOTES[diagramMode]}
                </p>
              </div>
            </div>
          </div>
        </div>
        )}
      </main>

      <footer className="mt-20 border-t border-slate-900 bg-slate-950 p-8 text-center text-slate-600">
        <p className="text-sm">VectorAnalyzer 3Ph © 2026 • Розроблено для трифазних мереж України</p>
      </footer>

      {appSection === 'classic' ? (
      <PdfExportDocument
        forCapture={pdfCaptureOpen}
        measurements={measurements}
        angleMode={angleMode}
        scheme={scheme}
        voltageType={voltageType}
        results={results}
        diagnostics={diagnostics}
        diagramMode={diagramMode}
        diagramModeLabel={diagramModeLabelLookup(diagramMode)}
        diagramNote={DIAGRAM_NOTES[diagramMode]}
        trianglePhase={trianglePhase}
      >
        {renderDiagram(580)}
      </PdfExportDocument>
      ) : null}
    </div>
  );
};

export default App;
