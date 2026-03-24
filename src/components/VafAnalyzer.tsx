import { useMemo, useState, useCallback, useEffect } from 'react';
import { Activity, ClipboardCopy, Gauge, Zap, RotateCcw } from 'lucide-react';
import VectorDiagram from './VectorDiagram';
import { MeterConnectionSchematic } from './MeterConnectionSchematic';
import { RealisticMeterSchematic } from './RealisticMeterSchematic';
import { VafPowerSection } from './VafPowerSection';
import { VafDiagnosticsSection } from './VafDiagnosticsSection';
import {
  computeTransformationK,
  computeCurrentPhasors,
  buildVafDiagramVectors,
  runVafDiagnostics,
  validateDateDdMmYyyy,
  buildVafTextReport,
  buildMeterWireHighlights,
  buildPhaseAnalysisSummary,
  VAF_PHI_OK_TOLERANCE_DEG,
  VAF_PHASE_SWAP_RATIO_THRESHOLD,
} from '../utils/vafAnalysis';
import { 
  ConnectionScheme, 
  VafPhaseValues, 
  AnalysisVerdict, 
  Phase, 
  TransformerRatios,
  VafPowerResults,
} from '../types/vaf';

const STORAGE_KEY = 'vector_analyzer_vaf_state_v1';

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function todayDdMmYyyy(): string {
  const d = new Date();
  return `${pad2(d.getDate())}.${pad2(d.getMonth() + 1)}.${d.getFullYear()}`;
}

const VOLTAGE_LEVELS = [
  { value: '0.4', label: '0,4' },
  { value: '6-10', label: '6–10' },
  { value: '35', label: '35' },
  { value: '110', label: '110' },
];

const VOLTAGE_PRESETS: Record<string, {
  Usec: number;
  Imeas: number;
  phiTyp: number;
  UPrim: number;
  USec: number;
  IPrim: number;
  ISec: number;
  label: string;
}> = {
  '0.4': {
    Usec: 220,
    Imeas: 3.2,
    phiTyp: 25,
    UPrim: 400,
    USec: 400,
    IPrim: 200,
    ISec: 5,
    label: 'Пряме підкл. (без ТН), Uф=220В, ТС 200/5',
  },
  '6-10': {
    Usec: 57.7,
    Imeas: 2.5,
    phiTyp: 30,
    UPrim: 10000,
    USec: 100,
    IPrim: 300,
    ISec: 5,
    label: 'ТН 10000/100, Uвт.ф=57,7В, ТС 300/5',
  },
  '35': {
    Usec: 57.7,
    Imeas: 2.0,
    phiTyp: 28,
    UPrim: 35000,
    USec: 100,
    IPrim: 600,
    ISec: 5,
    label: 'ТН 35000/100, Uвт.ф=57,7В, ТС 600/5',
  },
  '110': {
    Usec: 57.7,
    Imeas: 1.5,
    phiTyp: 22,
    UPrim: 110000,
    USec: 100,
    IPrim: 1000,
    ISec: 5,
    label: 'ТН 110000/100, Uвт.ф=57,7В, ТС 1000/5',
  },
};

export function VafAnalyzer() {
  // Persistence Loading
  const savedState = useMemo(() => {
    try {
      const item = localStorage.getItem(STORAGE_KEY);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  }, []);

  const [objectName, setObjectName] = useState(savedState?.objectName ?? '');
  const [dateStr, setDateStr] = useState(todayDdMmYyyy());
  const [voltageLevel, setVoltageLevel] = useState(savedState?.voltageLevel ?? '0.4');
  const [scheme, setScheme] = useState<ConnectionScheme>(savedState?.scheme ?? '3_TS');
  const [IPrim, setIPrim] = useState(savedState?.IPrim ?? 200);
  const [ISec, setISec] = useState(savedState?.ISec ?? 5);
  const [UPrim, setUPrim] = useState(savedState?.UPrim ?? 400);
  const [USec, setUSec] = useState(savedState?.USec ?? 400);
  const [Uabc, setUabc] = useState<VafPhaseValues>(savedState?.Uabc ?? { A: 220, B: 220, C: 220 });
  const [Iabc, setIabc] = useState<VafPhaseValues>(savedState?.Iabc ?? { A: 3.2, B: 3.2, C: 3.2 });
  const [phiDeg, setPhiDeg] = useState<VafPhaseValues>(savedState?.phiDeg ?? { A: 25, B: 25, C: 25 });
  const [copyHint, setCopyHint] = useState('');

  // Persistence Saving
  useEffect(() => {
    const state = { objectName, voltageLevel, scheme, IPrim, ISec, UPrim, USec, Uabc, Iabc, phiDeg };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [objectName, voltageLevel, scheme, IPrim, ISec, UPrim, USec, Uabc, Iabc, phiDeg]);

  const handleVoltageLevelChange = (newLevel: string) => {
    setVoltageLevel(newLevel);
    const preset = VOLTAGE_PRESETS[newLevel];
    if (preset) {
      const u = parseFloat(preset.Usec.toFixed(1));
      const i = preset.Imeas;
      setUabc({ A: u, B: u, C: u });
      setIabc({ A: i, B: i, C: i });
      setPhiDeg({ A: preset.phiTyp, B: preset.phiTyp, C: preset.phiTyp });
      setUPrim(preset.UPrim);
      setUSec(preset.USec);
      setIPrim(preset.IPrim);
      setISec(preset.ISec);
    }
  };

  const resetToDefaults = () => {
    if (window.confirm('Скинути всі внесені дані до початкових значень?')) {
      const d = VOLTAGE_PRESETS['0.4'];
      setObjectName('');
      setVoltageLevel('0.4');
      setScheme('3_TS');
      setIPrim(d.IPrim);
      setISec(d.ISec);
      setUPrim(d.UPrim);
      setUSec(d.USec);
      setUabc({ A: d.Usec, B: d.Usec, C: d.Usec });
      setIabc({ A: d.Imeas, B: d.Imeas, C: d.Imeas });
      setPhiDeg({ A: d.phiTyp, B: d.phiTyp, C: d.phiTyp });
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const ratios: TransformerRatios = useMemo(
    () => ({ IPrim, ISec, UPrim, USec }),
    [IPrim, ISec, UPrim, USec],
  );

  const K = useMemo(() => computeTransformationK(ratios), [ratios]);

  const currentPhasorsRect = useMemo(
    () => computeCurrentPhasors(scheme, Iabc, phiDeg),
    [scheme, Iabc, phiDeg],
  );

  const powerResults: VafPowerResults = useMemo(() => {
    const Ki = ISec > 0 ? IPrim / ISec : 0;
    const Ku = USec > 0 ? UPrim / USec : 0;
    const Ktotal = Ki * Ku;
    const phases = {} as Record<Phase, any>;
    let totalPsec = 0, totalQsec = 0;

    (['A', 'B', 'C'] as const).forEach(p => {
      const U = Uabc[p];
      const I = Iabc[p];
      const phi = phiDeg[p];
      const rad = (phi * Math.PI) / 180;
      const cosPhi = Math.cos(rad);
      const sinPhi = Math.sin(rad);
      const P = U * I * cosPhi;
      const Q = (scheme === '2_TS' && p === 'B') ? 0 : U * I * sinPhi;
      const S = (scheme === '2_TS' && p === 'B') ? 0 : U * I;
      phases[p] = { P, Q, S, cosPhi, Ppri: P * Ktotal, Qpri: Q * Ktotal, Spri: S * Ktotal };
      totalPsec += P;
      if (scheme !== '2_TS' || p !== 'B') totalQsec += Q;
    });

    const totalSsec = Math.hypot(totalPsec, totalQsec);
    const totalPpri = totalPsec * Ktotal;
    const totalQpri = totalQsec * Ktotal;
    const totalSpri = totalSsec * Ktotal;
    const avgCosPhi = totalSsec > 1e-6 ? Math.abs(totalPsec / totalSsec) : 1;
    return { phases, totalPsec, totalQsec, totalSsec, totalPpri, totalQpri, totalSpri, avgCosPhi, Ktotal };
  }, [Uabc, Iabc, phiDeg, IPrim, ISec, UPrim, USec, scheme]);

  const vectors = useMemo(
    () => buildVafDiagramVectors({ scheme, Uabc, Iabc, currentPhasorsRect }),
    [scheme, Uabc, Iabc, currentPhasorsRect],
  );

  const verdicts: AnalysisVerdict[] = useMemo(
    () => runVafDiagnostics({ scheme, Iabc, phiDeg, currentPhasorsRect }),
    [scheme, Iabc, phiDeg, currentPhasorsRect],
  );

  const wireHighlights = useMemo(() => buildMeterWireHighlights(verdicts), [verdicts]);
  const phaseAnalysis = useMemo(() => buildPhaseAnalysisSummary(verdicts, wireHighlights), [verdicts, wireHighlights]);
  const dateValidation = useMemo(() => validateDateDdMmYyyy(dateStr), [dateStr]);

  const reportText = useMemo(
    () => buildVafTextReport({
      objectName, dateStr: dateValidation.ok ? (dateValidation.value as string) : dateStr,
      voltageLevel, scheme, ratios, Uabc, Iabc, phiDeg, K, verdicts, power: powerResults,
    }),
    [objectName, dateStr, dateValidation, voltageLevel, scheme, ratios, Uabc, Iabc, phiDeg, K, verdicts, powerResults],
  );

  const copyReport = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(reportText);
      setCopyHint('Скопійовано');
      setTimeout(() => setCopyHint(''), 2000);
    } catch {
      setCopyHint('Помилка копіювання');
      setTimeout(() => setCopyHint(''), 2000);
    }
  }, [reportText]);

  const setPhaseField = (obj: VafPhaseValues, setObj: React.Dispatch<React.SetStateAction<VafPhaseValues>>, phase: Phase, value: string) => {
    const n = parseFloat(value);
    setObj({ ...obj, [phase]: Number.isFinite(n) ? n : 0 });
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 relative">
        <button 
          onClick={resetToDefaults}
          className="absolute top-6 right-6 p-2 text-slate-500 hover:text-red-400 transition-colors"
          title="Скинути до стандартних значень"
        >
          <RotateCcw size={18} />
        </button>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-slate-100">
          <Gauge className="text-cyan-400" size={22} />
          ВАФ-Аналізатор — конфігурація
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-xs uppercase tracking-wide text-slate-500">Об&apos;єкт</span>
            <input type="text" value={objectName} onChange={(e) => setObjectName(e.target.value)} className="mt-1 w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm" placeholder="Назва об'єкта / ПС" />
          </label>
          <label className="block">
            <span className="text-xs uppercase tracking-wide text-slate-500">Дата (ДД.ММ.РРРР)</span>
            <input type="text" value={dateStr} onChange={(e) => setDateStr(e.target.value)} className={`mt-1 w-full rounded-lg bg-slate-950 border px-3 py-2 text-sm font-mono ${dateValidation.ok ? 'border-slate-700' : 'border-red-500/60'}`} placeholder="24.03.2026" />
            {!dateValidation.ok && <span className="text-xs text-red-400 mt-1 block">{dateValidation.error}</span>}
          </label>
          <label className="block">
            <span className="text-xs uppercase tracking-wide text-slate-500">Рівень напруги, кВ</span>
            <select value={voltageLevel} onChange={(e) => handleVoltageLevelChange(e.target.value)} className="mt-1 w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm">
              {VOLTAGE_LEVELS.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
            </select>
            {VOLTAGE_PRESETS[voltageLevel] && (
              <p className="text-[11px] text-cyan-400/70 mt-1">⚡ {VOLTAGE_PRESETS[voltageLevel].label}</p>
            )}
          </label>
          <div className="block">
            <span className="text-xs uppercase tracking-wide text-slate-500">Схема ТС</span>
            <div className="mt-1 flex flex-wrap gap-2">
              <button type="button" onClick={() => setScheme('3_TS')} className={`px-3 py-2 rounded-lg text-sm font-semibold border transition-all ${scheme === '3_TS' ? 'bg-cyan-600 border-cyan-500 text-white' : 'bg-slate-800 border-slate-600 text-slate-300'}`}>3 ТС</button>
              <button type="button" onClick={() => setScheme('2_TS')} className={`px-3 py-2 rounded-lg text-sm font-semibold border transition-all ${scheme === '2_TS' ? 'bg-cyan-600 border-cyan-500 text-white' : 'bg-slate-800 border-slate-600 text-slate-300'}`}>2 ТС (Арон)</button>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[{ label: 'Iперв (А)', val: IPrim, set: setIPrim }, { label: 'Iвтор (А)', val: ISec, set: setISec }, { label: 'Uперв (В)', val: UPrim, set: setUPrim }, { label: 'Uвтор (В)', val: USec, set: setUSec }].map((item) => (
            <label key={item.label} className="block text-[10px] sm:text-xs">
              <span className="text-slate-500">{item.label}</span>
              <input type="number" min={0} step="any" value={item.val} onChange={(e) => item.set(parseFloat(e.target.value) || 0)} className="mt-1 w-full rounded-lg bg-slate-950 border border-slate-700 px-2 py-1.5 text-sm" />
            </label>
          ))}
        </div>
        <p className="mt-3 text-sm text-cyan-300/90 font-mono">K = {K.toFixed(4)}</p>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
        <h3 className="text-lg font-semibold mb-4 text-slate-200">Показники ВАФ (вторинні кола)</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse min-w-[320px]">
            <thead>
              <tr className="text-slate-500 text-left">
                <th className="py-2 pr-2">Фаза</th><th className="py-2 pr-2">U, В</th><th className="py-2 pr-2">I, А</th><th className="py-2 pr-2">φ, °</th>
              </tr>
            </thead>
            <tbody>
              {(['A', 'B', 'C'] as Phase[]).map((ph) => (
                <tr key={ph} className="border-t border-slate-800">
                  <td className={`py-2 pr-2 font-bold ${ph === 'A' ? 'text-yellow-400' : ph === 'B' ? 'text-green-400' : 'text-red-400'}`}>{ph}</td>
                  <td className="py-2 pr-2"><input type="number" min={0} step="any" value={Uabc[ph]} onChange={(e) => setPhaseField(Uabc, setUabc, ph, e.target.value)} className="w-full rounded bg-slate-950 border border-slate-700 px-2 py-1" /></td>
                  <td className="py-2 pr-2"><input type="number" min={0} step="any" value={Iabc[ph]} onChange={(e) => setPhaseField(Iabc, setIabc, ph, e.target.value)} className="w-full rounded bg-slate-950 border border-slate-700 px-2 py-1" /></td>
                  <td className="py-2 pr-2"><input type="number" step="any" value={phiDeg[ph]} onChange={(e) => setPhaseField(phiDeg, setPhiDeg, ph, e.target.value)} className="w-full rounded bg-slate-950 border border-slate-700 px-2 py-1" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <VafPowerSection powerResults={powerResults} Uabc={Uabc} ratios={ratios} />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
        <div className="min-w-0">
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2"><Activity className="text-purple-400" size={20} /> Векторна діаграма</h3>
          <VectorDiagram vectors={vectors} size={840} />
        </div>
        <div className="min-w-0 space-y-6">
          <RealisticMeterSchematic scheme={scheme} voltage={voltageLevel as any} verdicts={verdicts} />
          <MeterConnectionSchematic connectionScheme={scheme} voltageLevel={voltageLevel} wireHighlights={wireHighlights} phaseSummary={phaseAnalysis} />
        </div>
      </div>

      <VafDiagnosticsSection verdicts={verdicts} reportText={reportText} copyReport={copyReport} copyHint={copyHint} />
    </div>
  );
}

export default VafAnalyzer;
