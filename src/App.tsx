import { useState, useMemo, useCallback, lazy, Suspense } from 'react';
import { Download, Info, Zap, Loader2, History, Save, BookOpen } from 'lucide-react';

import VectorDiagram from './components/core/VectorDiagram';
import { VafAnalyzer } from './components/vaf/VafAnalyzer';
import InputForm from './components/ui/InputForm';
import ResultsDisplay from './components/ui/ResultsDisplay';
import { PdfExportDocument } from './components/core/PdfExportDocument';
import { RightTriangleDiagram } from './components/diagrams/RightTriangleDiagram';
import { PhasorPolygonDiagram } from './components/diagrams/PhasorPolygonDiagram';
import { OssannaDiagram } from './components/diagrams/OssannaDiagram';
import { SmithChartDiagram } from './components/diagrams/SmithChartDiagram';
import { ArchiveModal } from './components/ui/ArchiveModal';
import { AboutModal } from './components/ui/AboutModal';
import { ReloadPrompt } from './components/ui/ReloadPrompt';
import { ConfirmDialog } from './components/ui/ConfirmDialog';

import { useClassicState } from './hooks/useClassicState';
import { useArchive } from './hooks/useArchive';
import { usePdfExport } from './hooks/usePdfExport';
import { useIsMobile } from './hooks/useIsMobile';

import {
  calculatePhasePower,
  toPhaseVoltage,
  degToRad,
  phasePhiDeg,
  formatScalarForLabel,
  measurementsToPhiDeg,
} from './utils/calculations';
import { buildDiagramVectors } from './utils/diagramVectors';
import { runVafDiagnostics, computeCurrentPhasors } from './utils/vafAnalysis';

import type {
  VafExportData,
  ArchiveItem,
  AppSection,
  LoadType,
  EnergyFlow,
  CtPhasePair,
  CtModel,
  VtModel,
  MeterElements,
  DiagnosticItem,
  AnalysisResults,
  Phase,
  PhaseSequence,
  PhasePowerResult,
} from './types/vaf';

// Lazy-loaded heavy component
const LearningCenter = lazy(() =>
  import('./components/core/LearningCenter').then((m) => ({ default: m.LearningCenter })),
);

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

const DIAGRAM_NOTES: Record<string, string> = {
  combined:
    'Довжини векторів I на крузі зменшені. Підписи: дійсні U, I та кути. U на діаграмі в масштабі Uф; у підписі — введене значення (Uф/Uл).',
  voltage: 'Зіркоподібна (променева) діаграма: фазні напруги Uф з умовної нейтралі — типовий вигляд симетричної зірки (класичні ~120°).',
  current: 'Промені струмів фаз; довжини нормовані до max|I|, підписи — дійсні А та кути.',
  line: 'Лінійні U_AB, U_BC, U_CA як різниця фазорів (модель зірки).',
  power:
    'Сумарні P, Q, S з центру: довжини нормовані до max(|ΣP|,|ΣQ|,ΣS) — порівняльна «променева» форма (поряд із трикутником потужностей).',
  sequence: 'Симетричні складові Фортеск\'ю напруг: V₀, V₁, V₂.',
  polygon:
    'Замкнений багатокутник: фазні напруги послідовно «голова в хвіст». За повної симетрії векторна сума U_A+U_B+U_C → 0 (контур замикається).',
  powerTriangle:
    'Трикутник потужностей для сум по трифазі: катети ΣP та ΣQ, гіпотенуза S′=√(ΣP²+ΣQ²). Сума фазних Sᵢ може трохи відрізнятися при перекосі.',
  voltageTriangle:
    'Трикутник напруг однофазного еквівалента обраної фази: U_R = U·cos φ, U_X = U·sin φ (φ — кут між U та I), гіпотенуза — повна фазна U.',
  impedanceTriangle:
    `Трикутник опорів: R = Z·cos φ, X = Z·sin φ, Z = Uф/I; типовий зв\u2019язок для серійного R–X.`,
  ossanna:
    'Діаграма Оссана: спрощена схема кола струму статора АД. Повна побудова — за схемою заміщення та опором ротора при різних ковзаннях.',
  smith:
    'Фрагмент діаграми Сміта: нормовані опори на лініях передачі / узгодження (РЧ; для силових КЗЛН часто інші номограми).',
};

const diagramModeLabelLookup = (mode: string): string => {
  for (const g of DIAGRAM_GROUPS) {
    const m = g.modes.find((x) => x.id === mode);
    if (m) return m.label;
  }
  return mode;
};

interface ConfirmState {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
}

const CONFIRM_CLOSED: ConfirmState = {
  isOpen: false,
  title: '',
  message: '',
  onConfirm: () => {},
};

const App = () => {
  const [appSection, setAppSection] = useState<AppSection>('classic');
  const [vafDataForExport, setVafDataForExport] = useState<VafExportData | null>(null);
  const [vafKey, setVafKey] = useState(0);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isLearningOpen, setIsLearningOpen] = useState(false);
  const [confirm, setConfirm] = useState<ConfirmState>(CONFIRM_CLOSED);

  const isMobile = useIsMobile();

  // Classic state hook
  const classic = useClassicState();
  const {
    angleMode, setAngleMode,
    scheme, setScheme,
    voltageType, setVoltageType,
    diagramMode, setDiagramMode,
    frequency, setFrequency,
    loadType, setLoadType,
    measurements, setMeasurements,
    voltageLevel, setVoltageLevel,
    IPrim, setIPrim,
    ISec, setISec,
    UPrim, setUPrim,
    USec, setUSec,
    hasNeutral, setHasNeutral,
    trianglePhase, setTrianglePhase,
    restoreState: restoreClassicState,
  } = classic;

  // Metadata state for VAF / Schematic (Unified Measurement)
  const [objectName, setObjectName] = useState('');
  const [feeder, setFeeder] = useState('');
  const [meterType, setMeterType] = useState('');
  const [meterNumber, setMeterNumber] = useState('');
  const [transformerTs, setTransformerTs] = useState('');
  const [transformerTn, setTransformerTn] = useState('');
  const [dateStr, setDateStr] = useState(new Date().toLocaleDateString('uk-UA'));
  const [energyFlow, setEnergyFlow] = useState<EnergyFlow>('consumption');
  const [ctPhasePair, setCtPhasePair] = useState<CtPhasePair>('AC');
  const [ctModel, setCtModel] = useState<CtModel>('TOL');
  const [vtModel, setVtModel] = useState<VtModel>('3x1ph');
  const [meterElements, setMeterElements] = useState<MeterElements>(3);

  // Archive hook
  const {
    archiveItems,
    isArchiveOpen,
    setIsArchiveOpen,
    saveHint,
    handleSaveToArchive,
    handleLoadFromArchive,
    handleDeleteFromArchive,
    handleExportArchive,
  } = useArchive();

  // PDF export hook
  const { pdfCaptureOpen, pdfBusy, exportPDF } = usePdfExport(appSection, vafDataForExport);

  // Confirm dialog helpers
  const openConfirm = useCallback((cfg: Omit<ConfirmState, 'isOpen'>) => {
    setConfirm({ ...cfg, isOpen: true });
  }, []);
  const closeConfirm = useCallback(() => setConfirm(CONFIRM_CLOSED), []);

  // Derived results
  const results = useMemo<AnalysisResults>(() => {
    try {
      const phaseResults: Record<Phase, PhasePowerResult> = {
        A: { P: 0, Q: 0, S: 0, cosPhi: 1 },
        B: { P: 0, Q: 0, S: 0, cosPhi: 1 },
        C: { P: 0, Q: 0, S: 0, cosPhi: 1 },
      };
      let totalP = 0, totalQ = 0, totalS = 0;

      (['A', 'B', 'C'] as const).forEach((p) => {
        const phiValue = angleMode === 'relative'
          ? measurements[p].angleU - measurements[p].angleI
          : measurements[p].phi;
        const Uphase = toPhaseVoltage(measurements[p].U, voltageType, scheme);
        const res = calculatePhasePower(Uphase, measurements[p].I, phiValue);
        phaseResults[p] = res;
        totalP += res.P;
        totalQ += res.Q;
        totalS += res.S;
      });

      const diffAB = ((measurements.B.angleU - measurements.A.angleU) % 360 + 360) % 360;
      const sequence: PhaseSequence = diffAB > 180 && diffAB < 300 ? 'Direct' : 'Reverse';

      return { phaseResults, total: { P: totalP, Q: totalQ, S: totalS }, sequence };
    } catch (e) {
      console.error('Calculation error:', e);
      return {
        phaseResults: {
          A: { P: 0, Q: 0, S: 0, cosPhi: 1 },
          B: { P: 0, Q: 0, S: 0, cosPhi: 1 },
          C: { P: 0, Q: 0, S: 0, cosPhi: 1 },
        },
        total: { P: 0, Q: 0, S: 0 },
        sequence: 'Unknown',
      };
    }
  }, [measurements, angleMode, scheme, voltageType]);

  // Diagnostics Integration
  const diagnostics = useMemo<DiagnosticItem[]>(() => {
    const diags: DiagnosticItem[] = [];

    const phiEffective = measurementsToPhiDeg(measurements, angleMode);

    const currentPhasorsRect = computeCurrentPhasors(
      scheme === 'aron' ? '2_TS' : '3_TS',
      { A: measurements.A.I, B: measurements.B.I, C: measurements.C.I },
      phiEffective,
      ctPhasePair,
      energyFlow
    );
    
    const vafVerdicts = runVafDiagnostics({
      scheme: scheme === 'aron' ? '2_TS' : '3_TS',
      Iabc: { A: measurements.A.I, B: measurements.B.I, C: measurements.C.I },
      phiDeg: phiEffective,
      currentPhasorsRect,
      energyFlow,
      ctPhasePair,
    });

    vafVerdicts.forEach(v => {
      if (v.code !== 'OK') {
        diags.push({
          phase: v.meta?.revPhase || v.meta?.currentPhase,
          severity: v.code === 'REV_I' || v.code === 'PHASE_SWAP' || v.code === 'WRONG_U' ? 'error' : 'warning',
          title: v.message.split('.')[0] + '.',
          message: v.message,
        });
      }
    });

    return diags;
  }, [measurements, angleMode, scheme, ctPhasePair, energyFlow]);

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

  const renderDiagram = (vectorSize = 960, isVaf = false) => {
    if (isVaf) {
      return <VectorDiagram vectors={vafDataForExport?.vectors || []} size={vectorSize} />;
    }
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
          subNote={`Сума фазних Sᵢ = ${formatScalarForLabel(results.total.S)} В·А.`}
        />
      );
    }
    if (diagramMode === 'voltageTriangle') {
      const p = trianglePhase as 'A' | 'B' | 'C';
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
          subNote="U_R — активна складова напруги; U_X — реактивна."
        />
      );
    }
    if (diagramMode === 'impedanceTriangle') {
      const p = trianglePhase as 'A' | 'B' | 'C';
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
          subNote={`Z = Uф/I.`}
        />
      );
    }
    if (diagramMode === 'ossanna') {
      return <OssannaDiagram measurements={measurements} angleMode={angleMode} scheme={scheme} voltageType={voltageType} />;
    }
    if (diagramMode === 'smith') {
      return <SmithChartDiagram measurements={measurements} angleMode={angleMode} scheme={scheme} voltageType={voltageType} />;
    }
    return <VectorDiagram vectors={vectors} size={vectorSize} />;
  };

  const onLoadFromArchive = useCallback(
    (item: ArchiveItem) => {
      openConfirm({
        title: 'Завантажити запис?',
        message: `Завантажити дані «${item.title}»? Поточні зміни буде втрачено.`,
        confirmLabel: 'Завантажити',
        onConfirm: () => {
          closeConfirm();
          const d = item.data;
          setObjectName(d.objectName ?? '');
          setFeeder(d.feeder ?? '');
          setMeterType(d.meterType ?? '');
          setMeterNumber(d.meterNumber ?? '');
          setTransformerTs(d.transformerTs ?? '');
          setTransformerTn(d.transformerTn ?? '');
          setDateStr(d.dateStr ?? '');
          setEnergyFlow(d.energyFlow ?? 'consumption');
          setCtModel(d.ctModel ?? 'TOL');
          setVtModel(d.vtModel ?? '3x1ph');
          setMeterElements(d.meterElements ?? 3);
          setCtPhasePair(d.ctPhasePair ?? 'AC');

          restoreClassicState({
            angleMode: d.angleMode,
            scheme: d.scheme === '2_TS' ? 'aron' : 'star',
            voltageType: d.voltageType,
            diagramMode: d.diagramMode,
            frequency: d.frequency,
            loadType: d.loadType,
            measurements: d.measurements,
            voltageLevel: d.voltageLevel,
            IPrim: d.ratios.IPrim,
            ISec: d.ratios.ISec,
            UPrim: d.ratios.UPrim,
            USec: d.ratios.USec,
            hasNeutral: d.hasNeutral,
          });
          setVafKey((prev) => prev + 1);
        },
      });
    },
    [openConfirm, closeConfirm, restoreClassicState],
  );

  const onDeleteFromArchive = useCallback(
    (id: string) => {
      openConfirm({
        title: 'Видалити запис?',
        message: 'Цю дію неможливо скасувати.',
        confirmLabel: 'Видалити',
        danger: true,
        onConfirm: () => {
          handleDeleteFromArchive(id, closeConfirm);
        },
      });
    },
    [openConfirm, closeConfirm, handleDeleteFromArchive],
  );

  const onSaveToArchive = useCallback(() => {
    handleSaveToArchive({
      data: {
        objectName, feeder, meterType, meterNumber, transformerTs, transformerTn, dateStr,
        voltageLevel, hasNeutral, scheme: scheme === 'aron' ? '2_TS' : '3_TS',
        ratios: { IPrim, ISec, UPrim, USec },
        angleMode, voltageType, diagramMode, frequency, loadType: loadType as LoadType,
        energyFlow, ctModel, vtModel, ctPhasePair, meterElements,
        measurements,
      },
    });
  }, [
    handleSaveToArchive, objectName, feeder, meterType, meterNumber, transformerTs, transformerTn, dateStr,
    voltageLevel, hasNeutral, scheme, IPrim, ISec, UPrim, USec,
    angleMode, voltageType, diagramMode, frequency, loadType, energyFlow, ctModel, vtModel, ctPhasePair,
    meterElements,
    measurements,
  ]);

  const renderDiagramModeSelector = () => {
    if (isMobile) {
      return (
        <div className="mb-4" data-export-ignore>
          <label className="text-xs uppercase tracking-wider text-slate-500 mb-1.5 font-semibold block">
            Тип діаграми
          </label>
          <select
            value={diagramMode}
            onChange={(e) => setDiagramMode(e.target.value as typeof diagramMode)}
            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-200 focus:ring-2 focus:ring-purple-500 transition-all"
          >
            {DIAGRAM_GROUPS.map((group) => (
              <optgroup key={group.title} label={group.title}>
                {group.modes.map((m) => (
                  <option key={m.id} value={m.id}>{m.label}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
      );
    }

    return (
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
                  onClick={() => setDiagramMode(m.id as typeof diagramMode)}
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
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-500/30">
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-screen-2xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/20 flex-shrink-0">
              <Zap className="text-white" fill="white" size={24} />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-black tracking-tight uppercase truncate">VectorAnalyzer <span className="text-blue-500">3Ph</span></h1>
              <p className="text-[10px] text-slate-500 font-semibold tracking-widest uppercase hidden sm:block">Professional Power Diagnostics</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <button
              type="button"
              onClick={() => setIsLearningOpen(true)}
              className="hidden md:flex items-center gap-2 bg-blue-600/10 text-blue-400 border border-blue-500/20 px-3 py-2 rounded-lg text-xs font-bold hover:bg-blue-600/20 transition-all"
              title="Академія (Навчання)"
            >
              <BookOpen size={16} />
              <span className="hidden lg:inline">Академія</span>
            </button>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setIsArchiveOpen(true)}
                className="p-2 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-lg transition-all"
                title="Архів"
              >
                <History size={20} />
              </button>
              <div className="relative">
                <button
                  type="button"
                  onClick={onSaveToArchive}
                  className="p-2 text-slate-400 hover:text-green-400 hover:bg-slate-800 rounded-lg transition-all"
                  title="Зберегти в архів"
                >
                  <Save size={20} />
                </button>
                {saveHint && (
                  <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-green-600 text-white text-[10px] px-2 py-1 rounded shadow-lg animate-bounce whitespace-nowrap z-[60]">
                    {saveHint}
                  </span>
                )}
              </div>
            </div>

            <div className="flex rounded-lg border border-slate-700 overflow-hidden">
              <button
                type="button"
                onClick={() => setAppSection('classic')}
                className={`px-2 sm:px-3 py-2 text-xs font-bold transition-colors ${
                  appSection === 'classic'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                }`}
              >
                {isMobile ? 'ВА' : 'Векторна діаграма'}
              </button>
              <button
                type="button"
                onClick={() => setAppSection('vaf')}
                className={`px-2 sm:px-3 py-2 text-xs font-bold transition-colors ${
                  appSection === 'vaf'
                    ? 'bg-cyan-600 text-white'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                }`}
              >
                {isMobile ? 'ВАФ' : 'Схема та Звіт'}
              </button>
            </div>

            <button
              type="button"
              onClick={exportPDF}
              data-export-ignore
              className="flex items-center gap-1 sm:gap-2 bg-slate-800 hover:bg-slate-700 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all active:scale-95 cursor-pointer border border-slate-600 shadow-sm"
            >
              {pdfBusy
                ? <><Loader2 size={16} className="animate-spin" /> <span className="hidden sm:inline">Генерація…</span></>
                : <><Download size={16} /> <span className="hidden sm:inline">Експорт</span> PDF</>}
            </button>
            <button
              type="button"
              onClick={() => setIsAboutOpen(true)}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
              title="Про програму"
            >
              <Info size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-screen-2xl mx-auto px-3 sm:px-4 py-4 sm:py-8 w-full" id="main-report">
        {appSection === 'vaf' ? (
          <VafAnalyzer 
            key={vafKey} 
            onExportDataChange={setVafDataForExport} 
            linkedMeasurements={measurements}
            angleMode={angleMode}
            linkedScheme={scheme === 'aron' ? '2_TS' : '3_TS'}
            voltageLevel={voltageLevel}
            ratios={{ IPrim, ISec, UPrim, USec }}
            hasNeutral={hasNeutral}
            
            // Pass shared metadata
            objectName={objectName} setObjectName={setObjectName}
            feeder={feeder} setFeeder={setFeeder}
            meterType={meterType} setMeterType={setMeterType}
            meterNumber={meterNumber} setMeterNumber={setMeterNumber}
            transformerTs={transformerTs} setTransformerTs={setTransformerTs}
            transformerTn={transformerTn} setTransformerTn={setTransformerTn}
            dateStr={dateStr} setDateStr={setDateStr}
            energyFlow={energyFlow} setEnergyFlow={setEnergyFlow}
            ctPhasePair={ctPhasePair} setCtPhasePair={setCtPhasePair}
            ctModel={ctModel} setCtModel={setCtModel}
            vtModel={vtModel} setVtModel={setVtModel}
            meterElements={meterElements} setMeterElements={setMeterElements}

            onLinkedChange={(newMeas, newScheme, newVolts, newRatios, newHasN) => {
              if (newMeas) setMeasurements(newMeas);
              if (newScheme) setScheme(newScheme === '2_TS' ? 'aron' : 'star');
              if (newVolts) setVoltageLevel(newVolts);
              if (newRatios) {
                setIPrim(newRatios.IPrim);
                setISec(newRatios.ISec);
                setUPrim(newRatios.UPrim);
                setUSec(newRatios.USec);
              }
              if (newHasN !== undefined) setHasNeutral(newHasN);
            }}
          />
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 sm:gap-8">
            <div className="xl:col-span-5 space-y-6 sm:space-y-8 min-w-0">
              <section className="animate-fade-in">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
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
                  frequency={frequency}
                  setFrequency={setFrequency}
                  loadType={loadType}
                  setLoadType={setLoadType}
                  voltageLevel={voltageLevel}
                  setVoltageLevel={setVoltageLevel}
                  IPrim={IPrim}
                  setIPrim={setIPrim}
                  ISec={ISec}
                  setISec={setISec}
                  UPrim={UPrim}
                  setUPrim={setUPrim}
                  USec={USec}
                  setUSec={setUSec}
                  hasNeutral={hasNeutral}
                  setHasNeutral={setHasNeutral}
                />
              </section>

              <section className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
                <h2 className="text-xl sm:text-2xl font-bold mb-4 flex items-center gap-2">
                  <Zap className="text-yellow-500" size={24} /> Результати аналізу
                </h2>
                <ResultsDisplay results={results} diagnostics={diagnostics} measurements={measurements} scheme={scheme} voltageType={voltageType} />
              </section>
            </div>

            <div className="xl:col-span-7 min-w-0 w-full">
              <div className="sticky top-24 animate-fade-in w-full min-w-0" style={{ animationDelay: '0.2s' }}>
                <h2 className="text-xl sm:text-2xl font-bold mb-3 flex items-center gap-2">
                  <Info className="text-purple-500" size={24} /> Векторні діаграми
                </h2>
                {renderDiagramModeSelector()}
                {(diagramMode === 'voltageTriangle' || diagramMode === 'impedanceTriangle') && (
                  <div className="flex flex-wrap items-center gap-2 mb-3" data-export-ignore>
                    <span className="text-xs text-slate-500">Фаза трикутника:</span>
                    {(['A', 'B', 'C'] as const).map((ph) => (
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
                {renderDiagram(isMobile ? 640 : 960)}

                <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-slate-800/30 rounded-xl border border-slate-800 text-sm text-slate-400">
                  <p className="flex items-start gap-2 italic text-xs sm:text-sm">
                    <Info size={16} className="mt-0.5 flex-shrink-0" />
                    {DIAGRAM_NOTES[diagramMode]}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="mt-12 sm:mt-20 border-t border-slate-900 bg-slate-950 p-6 sm:p-8 text-center text-slate-600">
        <p className="text-xs sm:text-sm">VectorAnalyzer 3Ph © 2026 • Розроблено для трифазних мереж України</p>
      </footer>

      <PdfExportDocument
        mode={appSection}
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
        vafData={vafDataForExport ?? undefined}
      >
        {renderDiagram(580, appSection === 'vaf')}
      </PdfExportDocument>

      <ArchiveModal
        isOpen={isArchiveOpen}
        onClose={() => setIsArchiveOpen(false)}
        items={archiveItems}
        onLoad={(item) => handleLoadFromArchive(item as ArchiveItem, onLoadFromArchive)}
        onDelete={onDeleteFromArchive}
        onExportAll={handleExportArchive}
      />
      <AboutModal
        isOpen={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
      />
      <Suspense fallback={null}>
        {isLearningOpen && (
          <LearningCenter
            isOpen={isLearningOpen}
            onClose={() => setIsLearningOpen(false)}
          />
        )}
      </Suspense>
      <ReloadPrompt />

      <ConfirmDialog
        isOpen={confirm.isOpen}
        title={confirm.title}
        message={confirm.message}
        confirmLabel={confirm.confirmLabel}
        danger={confirm.danger}
        onConfirm={confirm.onConfirm}
        onCancel={closeConfirm}
      />
    </div>
  );
};

export default App;
