import { useMemo, useState, useCallback } from 'react';
import { Activity, ClipboardCopy, Gauge, ShieldAlert, BarChart3, Zap, Info } from 'lucide-react';
import VectorDiagram from './VectorDiagram';
import { MeterConnectionSchematic } from './MeterConnectionSchematic';
import { RealisticMeterSchematic } from './RealisticMeterSchematic';
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
  VerdictCode
} from '../types/vaf';

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

/** Стандартні значення вторинних кіл для кожного рівня напруги */
const VOLTAGE_PRESETS: Record<string, {
  Usec: number;       // Вторинна напруга фази (В)
  Imeas: number;      // Реальний вторинний струм (А) — типове навантаження
  phiTyp: number;     // Типовий cosφ для даного рівня
  UPrim: number;      // Первинна напруга ТН (В)
  USec: number;       // Вторинна напруга ТН (В)
  IPrim: number;      // Первинний струм ТС (А)
  ISec: number;       // Номінальний вторинний струм ТС (А)
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

const verdictStyles: Record<string, string> = {
  OK: 'border-emerald-500/40 bg-emerald-950/40 text-emerald-200',
  REV_I: 'border-red-500/50 bg-red-950/30 text-red-200',
  WRONG_U: 'border-red-500/50 bg-red-950/30 text-red-200',
  PHASE_SWAP: 'border-amber-500/50 bg-amber-950/30 text-amber-200',
  ASYM: 'border-amber-500/50 bg-amber-950/30 text-amber-200',
};

export function VafAnalyzer() {
  const [objectName, setObjectName] = useState('');
  const [dateStr, setDateStr] = useState(todayDdMmYyyy());
  const [voltageLevel, setVoltageLevel] = useState('0.4');
  const [scheme, setScheme] = useState<ConnectionScheme>('3_TS');
  const [IPrim, setIPrim] = useState(200);
  const [ISec, setISec] = useState(5);
  const [UPrim, setUPrim] = useState(400);
  const [USec, setUSec] = useState(400);
  const [Uabc, setUabc] = useState<VafPhaseValues>(() => ({ A: 220, B: 220, C: 220 }));
  const [Iabc, setIabc] = useState<VafPhaseValues>(() => ({ A: 3.2, B: 3.2, C: 3.2 }));
  const [phiDeg, setPhiDeg] = useState<VafPhaseValues>(() => ({ A: 25, B: 25, C: 25 }));
  const [copyHint, setCopyHint] = useState('');

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

  const ratios: TransformerRatios = useMemo(
    () => ({ IPrim, ISec, UPrim, USec }),
    [IPrim, ISec, UPrim, USec],
  );

  const K = useMemo(() => computeTransformationK(ratios), [ratios]);

  const currentPhasorsRect = useMemo(
    () => computeCurrentPhasors(scheme, Iabc, phiDeg),
    [scheme, Iabc, phiDeg],
  );

  /** Розрахунок потужності (вторинна та первинна) */
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

      phases[p] = {
        P, Q, S, cosPhi,
        Ppri: P * Ktotal,
        Qpri: Q * Ktotal,
        Spri: S * Ktotal
      };

      totalPsec += P;
      if (scheme !== '2_TS' || p !== 'B') {
        totalQsec += Q;
      }
    });

    const totalSsec = Math.hypot(totalPsec, totalQsec);
    const totalPpri = totalPsec * Ktotal;
    const totalQpri = totalQsec * Ktotal;
    const totalSpri = totalSsec * Ktotal;
    const avgCosPhi = totalSsec > 1e-6 ? Math.abs(totalPsec / totalSsec) : 1;

    return { phases, totalPsec, totalQsec, totalSsec, totalPpri, totalQpri, totalSpri, avgCosPhi, Ktotal };
  }, [Uabc, Iabc, phiDeg, IPrim, ISec, UPrim, USec, scheme]);

  const vectors = useMemo(
    () =>
      buildVafDiagramVectors({
        scheme,
        Uabc,
        Iabc,
        currentPhasorsRect,
      }),
    [scheme, Uabc, Iabc, currentPhasorsRect],
  );

  const verdicts: AnalysisVerdict[] = useMemo(
    () =>
      runVafDiagnostics({
        scheme,
        Iabc,
        phiDeg,
        currentPhasorsRect,
      }),
    [scheme, Iabc, phiDeg, currentPhasorsRect],
  );

  const wireHighlights = useMemo(() => buildMeterWireHighlights(verdicts), [verdicts]);

  const phaseAnalysis = useMemo(
    () => buildPhaseAnalysisSummary(verdicts, wireHighlights),
    [verdicts, wireHighlights],
  );

  const dateValidation = useMemo(() => validateDateDdMmYyyy(dateStr), [dateStr]);

  const reportText = useMemo(
    () =>
      buildVafTextReport({
        objectName,
        dateStr: dateValidation.ok ? (dateValidation.value as string) : dateStr,
        voltageLevel,
        scheme,
        ratios,
        Uabc,
        Iabc,
        phiDeg,
        K,
        verdicts,
        power: powerResults,
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

  const setPhaseField = (
    obj: VafPhaseValues, 
    setObj: React.Dispatch<React.SetStateAction<VafPhaseValues>>, 
    phase: Phase, 
    value: string
  ) => {
    const n = parseFloat(value);
    setObj({ ...obj, [phase]: Number.isFinite(n) ? n : 0 });
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-slate-100">
          <Gauge className="text-cyan-400" size={22} />
          ВАФ-Аналізатор — конфігурація
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-xs uppercase tracking-wide text-slate-500">Об&apos;єкт</span>
            <input
              type="text"
              value={objectName}
              onChange={(e) => setObjectName(e.target.value)}
              className="mt-1 w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm"
              placeholder="Назва об'єкта / ПС"
            />
          </label>
          <label className="block">
            <span className="text-xs uppercase tracking-wide text-slate-500">Дата (ДД.ММ.РРРР)</span>
            <input
              type="text"
              value={dateStr}
              onChange={(e) => setDateStr(e.target.value)}
              className={`mt-1 w-full rounded-lg bg-slate-950 border px-3 py-2 text-sm font-mono ${
                dateValidation.ok ? 'border-slate-700' : 'border-red-500/60'
              }`}
              placeholder="24.03.2026"
            />
            {!dateValidation.ok ? (
              <span className="text-xs text-red-400 mt-1 block">{dateValidation.error}</span>
            ) : null}
          </label>
          <label className="block">
            <span className="text-xs uppercase tracking-wide text-slate-500">Рівень напруги, кВ</span>
            <select
              value={voltageLevel}
              onChange={(e) => handleVoltageLevelChange(e.target.value)}
              className="mt-1 w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm"
            >
              {VOLTAGE_LEVELS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            {VOLTAGE_PRESETS[voltageLevel] && (
              <p className="text-[11px] text-cyan-400/70 mt-1">
                ⚡ {VOLTAGE_PRESETS[voltageLevel].label}
              </p>
            )}
          </label>
          <div className="block">
            <span className="text-xs uppercase tracking-wide text-slate-500">Схема ТС</span>
            <div className="mt-1 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setScheme('3_TS')}
                className={`px-3 py-2 rounded-lg text-sm font-semibold border transition-all ${
                  scheme === '3_TS'
                    ? 'bg-cyan-600 border-cyan-500 text-white'
                    : 'bg-slate-800 border-slate-600 text-slate-300'
                }`}
              >
                3 ТС
              </button>
              <button
                type="button"
                onClick={() => setScheme('2_TS')}
                className={`px-3 py-2 rounded-lg text-sm font-semibold border transition-all ${
                  scheme === '2_TS'
                    ? 'bg-cyan-600 border-cyan-500 text-white'
                    : 'bg-slate-800 border-slate-600 text-slate-300'
                }`}
              >
                2 ТС (Арон)
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              U<sub>A</sub>(0°), U<sub>B</sub>(−120°), U<sub>C</sub>(120°). Для 2 ТС:{' '}
              <span className="font-mono text-slate-400">I_B = −(I_A + I_C)</span> на діаграмі.
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Iперв (А)', val: IPrim, set: setIPrim },
            { label: 'Iвтор (А)', val: ISec, set: setISec },
            { label: 'Uперв (В)', val: UPrim, set: setUPrim },
            { label: 'Uвтор (В)', val: USec, set: setUSec },
          ].map((item) => (
            <label key={item.label} className="block">
              <span className="text-xs text-slate-500">{item.label}</span>
              <input
                type="number"
                min={0}
                step="any"
                value={item.val}
                onChange={(e) => item.set(parseFloat(e.target.value) || 0)}
                className="mt-1 w-full rounded-lg bg-slate-950 border border-slate-700 px-2 py-1.5 text-sm"
              />
            </label>
          ))}
        </div>
        <p className="mt-3 text-sm text-cyan-300/90 font-mono">
          K = (Iперв/Iвтор)·(Uперв/Uвтор) = {K.toFixed(4)}
        </p>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
        <h3 className="text-lg font-semibold mb-4 text-slate-200">Показники ВАФ (вторинні кола)</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-slate-500 text-left">
                <th className="py-2 pr-2">Фаза</th>
                <th className="py-2 pr-2">U, В</th>
                <th className="py-2 pr-2">I, А</th>
                <th className="py-2 pr-2">φ, °</th>
              </tr>
            </thead>
            <tbody>
              {(['A', 'B', 'C'] as Phase[]).map((ph) => (
                <tr key={ph} className="border-t border-slate-800">
                  <td
                    className={`py-2 pr-2 font-bold text-slate-200 ${
                      ph === 'A' ? 'text-yellow-400' : ph === 'B' ? 'text-green-400' : 'text-red-400'
                    }`}
                  >
                    {ph}
                  </td>
                  <td className="py-2 pr-2">
                    <input
                      type="number"
                      min={0}
                      step="any"
                      value={Uabc[ph]}
                      onChange={(e) => setPhaseField(Uabc, setUabc, ph, e.target.value)}
                      className="w-full sm:w-24 rounded bg-slate-950 border border-slate-700 px-2 py-1"
                    />
                  </td>
                  <td className="py-2 pr-2">
                    <input
                      type="number"
                      min={0}
                      step="any"
                      value={Iabc[ph]}
                      onChange={(e) => setPhaseField(Iabc, setIabc, ph, e.target.value)}
                      className="w-full sm:w-24 rounded bg-slate-950 border border-slate-700 px-2 py-1"
                    />
                  </td>
                  <td className="py-2 pr-2">
                    <input
                      type="number"
                      step="any"
                      value={phiDeg[ph]}
                      onChange={(e) => setPhaseField(phiDeg, setPhiDeg, ph, e.target.value)}
                      className="w-full sm:w-24 rounded bg-slate-950 border border-slate-700 px-2 py-1"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-slate-500 mt-3">
          φ — кут між напругою та струмом фази; індуктивне навантаження: I відстає від U (∠I = ∠U − φ).
          Допуск для вердикту OK: ±{VAF_PHI_OK_TOLERANCE_DEG}°; поріг PHASE_SWAP: |I₂|/|I₁|{' '}
          {'>'} {VAF_PHASE_SWAP_RATIO_THRESHOLD}.
        </p>
      </section>

      {/* РОЗДІЛ: НАВАНТАЖЕННЯ (ПЕРВИННІ КОЛА) */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
        <h3 className="text-lg font-semibold mb-4 text-slate-200 flex items-center gap-2">
          <Zap className="text-blue-400" size={20} /> Навантаження (первинні кола)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800">
            <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Активна (ΣP)</div>
            <div className="text-2xl font-mono font-black text-blue-400">
              {Math.abs(powerResults.totalPpri) > 1000000 
                ? (powerResults.totalPpri / 1000000).toFixed(3) + ' МВт'
                : (powerResults.totalPpri / 1000).toFixed(2) + ' кВт'}
            </div>
            <div className="text-[10px] text-slate-500 mt-1">
              Втор: {powerResults.totalPsec.toFixed(1)} Вт
            </div>
          </div>
          
          <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800">
            <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Реактивна (ΣQ)</div>
            <div className="text-2xl font-mono font-black text-purple-400">
              {Math.abs(powerResults.totalQpri) > 1000000 
                ? (powerResults.totalQpri / 1000000).toFixed(3) + ' Мвар'
                : (powerResults.totalQpri / 1000).toFixed(2) + ' квар'}
            </div>
            <div className="text-[10px] text-slate-500 mt-1">
              {powerResults.totalQsec >= 0 ? 'Індуктивна' : 'Ємнісна'}
            </div>
          </div>

          <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800">
            <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Повна (ΣS)</div>
            <div className="text-2xl font-mono font-black text-slate-100">
              {Math.abs(powerResults.totalSpri) > 1000000 
                ? (powerResults.totalSpri / 1000000).toFixed(3) + ' МВА'
                : (powerResults.totalSpri / 1000).toFixed(2) + ' кВА'}
            </div>
            <div className="text-[10px] text-slate-500 mt-1">
              S = √(P² + Q²)
            </div>
          </div>

          <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800">
            <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Середній cos φ</div>
            <div className="text-2xl font-mono font-black text-emerald-400">
              {powerResults.avgCosPhi.toFixed(3)}
            </div>
            <div className="text-[10px] text-slate-500 mt-1">
              φ ≈ {(Math.acos(Math.min(1, powerResults.avgCosPhi)) * 180 / Math.PI).toFixed(0)}°
            </div>
          </div>
        </div>

        <div className="mt-4 p-3 bg-blue-900/10 border border-blue-800/20 rounded-lg">
          <p className="text-xs text-blue-300 flex items-center gap-2">
            <Info size={14} /> 
            Розрахункова первинна напруга: <span className="font-bold">{(Uabc.A * (UPrim/USec) * Math.sqrt(3) / 1000).toFixed(2)} кВ</span> (лінійна)
          </p>
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
        <div className="min-w-0">
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Activity className="text-purple-400" size={20} />
            Векторна діаграма
          </h3>
          <VectorDiagram vectors={vectors} size={840} />
        </div>
        <div className="min-w-0 space-y-6">
          <RealisticMeterSchematic
            scheme={scheme}
            voltage={voltageLevel as any}
            verdicts={verdicts}
          />
          <MeterConnectionSchematic
            connectionScheme={scheme}
            voltageLevel={voltageLevel}
            wireHighlights={wireHighlights}
            phaseSummary={phaseAnalysis}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
        <h3 className="text-lg font-semibold mb-4">Висновок аналізу</h3>
        <div className="space-y-2">
          {verdicts.map((v, i) => (
            <div
              key={`${v.code}-${i}`}
              className={`rounded-xl border px-4 py-3 text-sm ${verdictStyles[v.code as VerdictCode] ?? 'border-slate-700 bg-slate-900/50'}`}
            >
              <span className="font-mono text-xs opacity-80">{v.code}</span>
              <p className="mt-1">{v.message}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={copyReport}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 px-4 py-2 text-sm font-medium transition-all"
          >
            <ClipboardCopy size={16} />
            Текстовий звіт у буфер
          </button>
          {copyHint ? <span className="text-sm text-emerald-400">{copyHint}</span> : null}
        </div>
        <p className="text-xs text-slate-500 mt-2 max-w-md">
          Текстовий звіт у буфері зручно вставляти в Viber, Telegram або лист керівнику без додаткового форматування.
        </p>

        <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/80 p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Попередній перегляд звіту</p>
          <pre className="text-xs text-slate-400 whitespace-pre-wrap font-mono max-h-64 overflow-y-auto">
            {reportText}
          </pre>
        </div>
      </div>
    </div>
  );
}

export default VafAnalyzer;
