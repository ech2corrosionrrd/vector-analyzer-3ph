/**
 * WiringTable — таблиця підключення клем
 * Відображає всі 11 клем з функцією, джерелом, живими даними та статусом
 */

import type { Phase, ConnectionScheme, CtPhasePair, VafPhaseValues } from '../../types/vaf';
import { PHASE_COLORS } from '../../utils/constants';
import { getExpectedVoltageAtMeterTerminalsUk, voltageUsesVoltageTransformers } from '../../utils/meterConnectionCatalog';

type TermStatus = 'ok' | 'warning' | 'error' | 'idle';

interface WiringTableProps {
  scheme: ConnectionScheme;
  ctPhasePair?: CtPhasePair;
  Uabc?: VafPhaseValues;
  Iabc?: VafPhaseValues;
  phiDeg?: VafPhaseValues;
  highlights: Record<number, TermStatus>;
  voltageLevel?: string;
}

interface TermRow {
  n: number;
  fn: string;
  phase: Phase | 'N';
  source: string;
  measured?: string;
  expected?: string;
  status: TermStatus;
}

const statusBadge = (s: TermStatus) => {
  if (s === 'ok')      return <span className="text-emerald-400 font-bold">✓ OK</span>;
  if (s === 'error')   return <span className="text-red-400 font-bold animate-pulse">✗ ERR</span>;
  if (s === 'warning') return <span className="text-amber-400 font-bold">⚠ WARN</span>;
  return <span className="text-slate-500">—</span>;
};

const rowBg = (s: TermStatus) => {
  if (s === 'error')   return 'bg-red-950/30 border-l-2 border-red-500';
  if (s === 'warning') return 'bg-amber-950/20 border-l-2 border-amber-500';
  if (s === 'ok')      return 'border-l-2 border-transparent';
  return 'border-l-2 border-transparent';
};

const phaseTag = (ph: Phase | 'N') => {
  const color =
    ph === 'A' ? PHASE_COLORS.A :
    ph === 'B' ? PHASE_COLORS.B :
    ph === 'C' ? PHASE_COLORS.C : '#3b82f6';
  return (
    <span
      className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold"
      style={{ backgroundColor: `${color}22`, color, border: `1px solid ${color}55` }}
    >
      {ph === 'N' ? 'N' : `Ф.${ph}`}
    </span>
  );
};

function buildRows(
  scheme: ConnectionScheme,
  ctPhasePair: CtPhasePair,
  Uabc?: VafPhaseValues,
  Iabc?: VafPhaseValues,
  phiDeg?: VafPhaseValues,
  highlights: Record<number, TermStatus> = {},
  voltageLevel = '10',
): TermRow[] {
  const direct = !voltageUsesVoltageTransformers(voltageLevel);
  const is3 = scheme === '3_TS';

  const isExcluded = (ph: Phase, role: 'I' | 'U') => {
    if (role === 'U') return false;
    if (!is3) {
      return (ctPhasePair === 'AC' && ph === 'B') ||
             (ctPhasePair === 'AB' && ph === 'C') ||
             (ctPhasePair === 'BC' && ph === 'A');
    }
    return false;
  };

  const rows: TermRow[] = [];

  const phases: Phase[] = ['A', 'B', 'C'];
  phases.forEach(ph => {
    const base = ph === 'A' ? 1 : ph === 'B' ? 4 : 7;
    const excl = isExcluded(ph, 'I');
    const tsLabel = `ТС ${ph} → И1`;
    const tsLabelOut = `ТС ${ph} → И2`;
    const tnLabel = direct
      ? `Шина ${ph} (пряме Uф)`
      : `ТН ${ph} → вторинка → U`;

    const phi = phiDeg?.[ph];
    const cosPhi = phi != null ? Math.cos(phi * Math.PI / 180).toFixed(3) : undefined;

    rows.push({
      n: base,
      fn: 'И1',
      phase: ph,
      source: excl ? '(немає ТС — схема 2ТС)' : tsLabel,
      measured: excl ? undefined : (Iabc?.[ph] != null ? `${Iabc[ph].toFixed(3)} А` : undefined),
      expected: excl ? undefined : 'вхід ТС',
      status: excl ? 'idle' : (highlights[base] ?? 'idle'),
    });

    rows.push({
      n: base + 1,
      fn: 'U',
      phase: ph,
      source: tnLabel,
      measured: Uabc?.[ph] != null ? `${Uabc[ph].toFixed(2)} В` : undefined,
      expected: getExpectedVoltageAtMeterTerminalsUk(voltageLevel),
      status: highlights[base + 1] ?? 'idle',
    });

    rows.push({
      n: base + 2,
      fn: 'И2',
      phase: ph,
      source: excl ? '(немає ТС — схема 2ТС)' : tsLabelOut,
      measured: excl ? undefined : (Iabc?.[ph] != null ? cosPhi ? `cosφ=${cosPhi}` : undefined : undefined),
      expected: excl ? undefined : 'вихід ТС',
      status: excl ? 'idle' : (highlights[base + 2] ?? 'idle'),
    });
  });

  rows.push({
    n: 10,
    fn: 'N',
    phase: 'N',
    source: is3 ? 'Нейтраль (зірка И2)' : 'Нейтраль лінії',
    measured: undefined,
    expected: '0 В',
    status: highlights[10] ?? 'idle',
  });

  rows.push({
    n: 11,
    fn: 'N',
    phase: 'N',
    source: 'З\'єднаний з кл.10',
    measured: undefined,
    expected: '0 В',
    status: highlights[11] ?? 'idle',
  });

  return rows;
}

export function WiringTable({
  scheme,
  ctPhasePair = 'AC',
  Uabc,
  Iabc,
  phiDeg,
  highlights,
  voltageLevel = '10',
}: WiringTableProps) {
  const rows = buildRows(scheme, ctPhasePair, Uabc, Iabc, phiDeg, highlights, voltageLevel);

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-800">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="bg-slate-900/80 border-b border-slate-700">
            <th className="px-3 py-2.5 text-left text-slate-400 font-semibold w-8">Кл.</th>
            <th className="px-3 py-2.5 text-left text-slate-400 font-semibold w-12">Функц.</th>
            <th className="px-3 py-2.5 text-left text-slate-400 font-semibold w-16">Фаза</th>
            <th className="px-3 py-2.5 text-left text-slate-400 font-semibold">Джерело</th>
            <th className="px-3 py-2.5 text-left text-slate-400 font-semibold w-28">Виміряно</th>
            <th className="px-3 py-2.5 text-left text-slate-400 font-semibold w-24">Норма</th>
            <th className="px-3 py-2.5 text-left text-slate-400 font-semibold w-20">Стан</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr
              key={row.n}
              className={`border-b border-slate-800/60 hover:bg-slate-800/40 transition-colors ${rowBg(row.status)}`}
            >
              <td className="px-3 py-2 font-mono font-bold text-slate-300">{row.n}</td>
              <td className="px-3 py-2 font-mono text-slate-400">{row.fn}</td>
              <td className="px-3 py-2">{phaseTag(row.phase)}</td>
              <td className="px-3 py-2 text-slate-400 max-w-[180px]">{row.source}</td>
              <td className="px-3 py-2 font-mono font-semibold text-slate-200">
                {row.measured ?? <span className="text-slate-600">—</span>}
              </td>
              <td className="px-3 py-2 font-mono text-slate-500">
                {row.expected ?? <span className="text-slate-700">—</span>}
              </td>
              <td className="px-3 py-2">{statusBadge(row.status)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-[10px] text-slate-600 px-3 py-2 italic">
        И1 — вхід вторинної обмотки ТС; И2 — вихід (нейтраль); U — вторинна обмотка ТН
      </p>
    </div>
  );
}
