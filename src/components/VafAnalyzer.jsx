import { useMemo, useState, useCallback } from 'react';
import { Activity, ClipboardCopy, Gauge } from 'lucide-react';
import VectorDiagram from './VectorDiagram';
import { MeterConnectionSchematic } from './MeterConnectionSchematic';
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

const defaultU = { A: 100, B: 100, C: 100 };
const defaultI = { A: 5, B: 5, C: 5 };
const defaultPhi = { A: 30, B: 30, C: 30 };

function pad2(n) {
  return String(n).padStart(2, '0');
}

function todayDdMmYyyy() {
  const d = new Date();
  return `${pad2(d.getDate())}.${pad2(d.getMonth() + 1)}.${d.getFullYear()}`;
}

const VOLTAGE_LEVELS = [
  { value: '0.4', label: '0,4' },
  { value: '6-10', label: '6–10' },
  { value: '35', label: '35' },
  { value: '110', label: '110' },
];

const verdictStyles = {
  OK: 'border-emerald-500/40 bg-emerald-950/40 text-emerald-200',
  REV_I: 'border-red-500/50 bg-red-950/30 text-red-200',
  WRONG_U: 'border-red-500/50 bg-red-950/30 text-red-200',
  PHASE_SWAP: 'border-amber-500/50 bg-amber-950/30 text-amber-200',
  ASYM: 'border-amber-500/50 bg-amber-950/30 text-amber-200',
};

export function VafAnalyzer() {
  const [objectName, setObjectName] = useState('');
  const [dateStr, setDateStr] = useState(todayDdMmYyyy);
  const [voltageLevel, setVoltageLevel] = useState('0.4');
  const [scheme, setScheme] = useState('3_TS');
  const [IPrim, setIPrim] = useState(100);
  const [ISec, setISec] = useState(5);
  const [UPrim, setUPrim] = useState(10000);
  const [USec, setUSec] = useState(100);
  const [Uabc, setUabc] = useState(() => ({ ...defaultU }));
  const [Iabc, setIabc] = useState(() => ({ ...defaultI }));
  const [phiDeg, setPhiDeg] = useState(() => ({ ...defaultPhi }));
  const [copyHint, setCopyHint] = useState('');

  const ratios = useMemo(
    () => ({ IPrim, ISec, UPrim, USec }),
    [IPrim, ISec, UPrim, USec],
  );

  const K = useMemo(() => computeTransformationK(ratios), [ratios]);

  const currentPhasorsRect = useMemo(
    () => computeCurrentPhasors(scheme, Iabc, phiDeg),
    [scheme, Iabc, phiDeg],
  );

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

  const verdicts = useMemo(
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
        dateStr: dateValidation.ok ? dateValidation.value : dateStr,
        voltageLevel,
        scheme,
        ratios,
        Uabc,
        Iabc,
        phiDeg,
        K,
        verdicts,
      }),
    [objectName, dateStr, dateValidation, voltageLevel, scheme, ratios, Uabc, Iabc, phiDeg, K, verdicts],
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

  const setPhaseField = (obj, setObj, phase, value) => {
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
              onChange={(e) => setVoltageLevel(e.target.value)}
              className="mt-1 w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm"
            >
              {VOLTAGE_LEVELS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
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
            ['Iперв (А)', IPrim, setIPrim],
            ['Iвтор (А)', ISec, setISec],
            ['Uперв (В)', UPrim, setUPrim],
            ['Uвтор (В)', USec, setUSec],
          ].map(([label, val, set]) => (
            <label key={label} className="block">
              <span className="text-xs text-slate-500">{label}</span>
              <input
                type="number"
                min={0}
                step="any"
                value={val}
                onChange={(e) => set(parseFloat(e.target.value) || 0)}
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
              {['A', 'B', 'C'].map((ph) => (
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
                      className="w-24 rounded bg-slate-950 border border-slate-700 px-2 py-1"
                    />
                  </td>
                  <td className="py-2 pr-2">
                    <input
                      type="number"
                      min={0}
                      step="any"
                      value={Iabc[ph]}
                      onChange={(e) => setPhaseField(Iabc, setIabc, ph, e.target.value)}
                      className="w-24 rounded bg-slate-950 border border-slate-700 px-2 py-1"
                    />
                  </td>
                  <td className="py-2 pr-2">
                    <input
                      type="number"
                      step="any"
                      value={phiDeg[ph]}
                      onChange={(e) => setPhaseField(phiDeg, setPhiDeg, ph, e.target.value)}
                      className="w-24 rounded bg-slate-950 border border-slate-700 px-2 py-1"
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

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
        <div className="min-w-0">
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Activity className="text-purple-400" size={20} />
            Векторна діаграма
          </h3>
          <VectorDiagram vectors={vectors} size={840} />
        </div>
        <div className="min-w-0">
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
              className={`rounded-xl border px-4 py-3 text-sm ${verdictStyles[v.code] ?? 'border-slate-700 bg-slate-900/50'}`}
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
