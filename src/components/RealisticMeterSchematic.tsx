import { useState, useMemo } from 'react';
import { PHASE_COLORS } from '../utils/constants';

import { VafPhaseValues, CtPhasePair, Phase, ConnectionScheme as Scheme, VerdictCode } from '../types/vaf';

type VoltageLevel = '0.4' | '6-10' | '35' | '110';
type ViewMode = 'ACTUAL' | 'EXPECTED';

interface Verdict {
  code: VerdictCode;
  message: string;
  meta?: {
    revPhase?: Phase;
    phaseSwap?: boolean;
    wrongPhase?: Phase;
    asym?: boolean;
  };
}

interface RealisticMeterSchematicProps {
  scheme: Scheme;
  voltage: VoltageLevel;
  verdicts: Verdict[];
  Uabc?: VafPhaseValues;
  Iabc?: VafPhaseValues;
  phiDeg?: VafPhaseValues;
  ctPhasePair?: CtPhasePair;
}

// ─── Constants ──────────────────────────────────────────────────────

const WIRE_COLORS: Record<string, string> = {
  A: PHASE_COLORS.A,    // Yellow
  B: PHASE_COLORS.B,    // Green
  C: PHASE_COLORS.C,    // Red
  N: '#3B82F6',         // Blue
};

// Terminal layout: 11 terminals in a row
// Phase A: 1(И1), 2(U), 3(И2)  |  Phase B: 4(И1), 5(U), 6(И2)  |  Phase C: 7(И1), 8(U), 9(И2)  |  N: 10, 11
const TERM_Y = 510;
const TERM_START_X = 100;
const TERM_GAP = 55;
const TERM_R = 12;

function termX(n: number): number {
  // n is 1-based terminal number
  return TERM_START_X + (n - 1) * TERM_GAP;
}

// Phase bus Y positions
const BUS_Y = 55;
const BUS_X1 = 50;
const BUS_X2 = 750;

// CT zone
const CT_Y = 140;
const CT_W = 70;
const CT_H = 60;

// VT zone
const VT_Y = 260;

// Phase X positions (center of each phase's column)
const PHASE_X: Record<Phase, number> = { A: 200, B: 400, C: 600 };

// ─── Sub-components ─────────────────────────────────────────────────

function PrimaryBus({ phase, y }: { phase: Phase; y: number }) {
  return (
    <line
      x1={BUS_X1} y1={y} x2={BUS_X2} y2={y}
      stroke={WIRE_COLORS[phase]}
      strokeWidth={5}
      strokeLinecap="round"
      opacity={0.85}
    >
      <title>Шина L{phase === 'A' ? '1' : phase === 'B' ? '2' : '3'} ({phase})</title>
    </line>
  );
}

function CTSymbol({ x, y, phase, dimmed, scheme, ctPhasePair, I, phi }: { x: number; y: number; phase: Phase; dimmed?: boolean; scheme: Scheme; ctPhasePair?: CtPhasePair; I?: number; phi?: number }) {
  const col = WIRE_COLORS[phase];
  const isExcluded = scheme === '2_TS' && (
    (ctPhasePair === 'AC' && phase === 'B') ||
    (ctPhasePair === 'AB' && phase === 'C') ||
    (ctPhasePair === 'BC' && phase === 'A')
  );
  const isDimmed = dimmed || isExcluded;
  const opa = isDimmed ? 0.3 : 1;

  return (
    <g opacity={opa}>
      {/* Oval core around the bus line */}
      <ellipse cx={x} cy={y + CT_H / 2} rx={CT_W / 2} ry={CT_H / 2}
        fill="#0f172a" stroke={col} strokeWidth={2} />
      {/* Primary pass-through line */}
      <line x1={x - CT_W / 2 - 8} y1={y + CT_H / 2} x2={x + CT_W / 2 + 8} y2={y + CT_H / 2}
        stroke={col} strokeWidth={3} />
      {/* Labels */}
      <text x={x - CT_W / 2 - 3} y={y + 12} fill="#94a3b8" fontSize="8" textAnchor="end">Л1</text>
      <text x={x + CT_W / 2 + 3} y={y + 12} fill="#94a3b8" fontSize="8" textAnchor="start">Л2</text>
      <text x={x} y={y + CT_H + 14} fill="#cbd5e1" fontSize="9" fontWeight="600" textAnchor="middle">
        ТС {phase}
      </text>
      {/* Secondary terminals */}
      <circle cx={x - 15} cy={y + CT_H + 2} r={3} fill="#64748b" />
      <text x={x - 15} y={y + CT_H + 14} fill="#94a3b8" fontSize="7" textAnchor="middle">И1</text>
      <circle cx={x + 15} cy={y + CT_H + 2} r={3} fill="#64748b" />
      <text x={x + 15} y={y + CT_H + 14} fill="#94a3b8" fontSize="7" textAnchor="middle">И2</text>
      
      {/* Live Data Overlay */}
      {!isDimmed && I !== undefined && (
        <g transform={`translate(${x + 42}, ${y + 25})`}>
          <rect x={0} y={0} width={45} height={24} rx={4} fill="#020617" stroke={col} strokeWidth={1} />
          <text x={22.5} y={10} textAnchor="middle" fill="#f8fafc" fontSize="8" fontWeight="bold">
            {I.toFixed(2)} А
          </text>
          <text x={22.5} y={19} textAnchor="middle" fill="#94a3b8" fontSize="7">
            ∠{phi?.toFixed(0)}°
          </text>
        </g>
      )}

      {isDimmed && (
        <text x={x} y={y + CT_H + 28} fill="#475569" fontSize="8" textAnchor="middle" fontStyle="italic">
          {isExcluded ? '(пропуск)' : '(немає)'}
        </text>
      )}
    </g>
  );
}

function VTSymbol({ x, y, phase, direct, label, U }: { x: number; y: number; phase: Phase; direct: boolean; label?: string; U?: number }) {
  const col = WIRE_COLORS[phase];

  if (direct) {
    return (
      <g>
        <rect x={x - 30} y={y} width={60} height={40} rx={5}
          fill="#0f172a" stroke="#475569" strokeWidth={1.5} strokeDasharray="4 3" />
        <text x={x} y={y + 17} textAnchor="middle" fill="#94a3b8" fontSize="8">0,4 кВ</text>
        <text x={x} y={y + 30} textAnchor="middle" fill="#64748b" fontSize="7">прямо</text>
      </g>
    );
  }

  return (
    <g>
      {/* Transformer winding symbol */}
      <polygon
        points={`${x - 30},${y + 40} ${x},${y} ${x + 30},${y + 40}`}
        fill="#0f172a" stroke={col} strokeWidth={2}
      />
      <text x={x} y={y + 34} textAnchor="middle" fill="#e2e8f0" fontSize="9" fontWeight="700">
        ТН {phase}
      </text>
      {label && (
        <text x={x} y={y - 5} textAnchor="middle" fill="#38bdf8" fontSize="8">{label}</text>
      )}

      {/* Live Voltage Data */}
      {U !== undefined && (
        <g transform={`translate(${x + 36}, ${y + 5})`}>
          <rect x={0} y={0} width={40} height={14} rx={3} fill="#020617" stroke={col} strokeWidth={1} />
          <text x={20} y={10} textAnchor="middle" fill="#f8fafc" fontSize="8" fontWeight="bold">
            {U.toFixed(1)} В
          </text>
        </g>
      )}
    </g>
  );
}

function Terminal({ cx: x, cy: y, n, highlight, val }: { cx: number; cy: number; n: number; highlight?: string; val?: string }) {
  const borderCol = highlight === 'error' ? '#ef4444'
    : highlight === 'warning' ? '#f59e0b'
    : '#64748b';
  const bgCol = highlight === 'error' ? '#1c1917' : '#1e293b';

  return (
    <g>
      <circle cx={x} cy={y} r={TERM_R} fill={bgCol} stroke={borderCol} strokeWidth={highlight ? 2.5 : 1.5} />
      {/* Screw cross */}
      <line x1={x - 4} y1={y - 4} x2={x + 4} y2={y + 4} stroke="#475569" strokeWidth={1} />
      <line x1={x + 4} y1={y - 4} x2={x - 4} y2={y + 4} stroke="#475569" strokeWidth={1} />
      
      {/* Dynamic Value Tooltip (Bubble) */}
      {val && (
        <g transform={`translate(${x - 20}, ${y - 32})`}>
          <rect x={0} y={0} width={40} height={14} rx={3} fill="#020617" stroke={borderCol} strokeWidth={1} opacity={0.9} />
          <text x={20} y={9.5} textAnchor="middle" fill="#f1f5f9" fontSize="7" fontWeight="bold">
            {val}
          </text>
        </g>
      )}

      <text x={x} y={y + TERM_R + 13} textAnchor="middle" fill="#94a3b8" fontSize="9" fontWeight="600">
        {n}
      </text>
      <title>Клема {n} {val ? `: ${val}` : ''}</title>
    </g>
  );
}

function WirePath({ d, color, pulse, dashed }: { d: string; color: string; pulse?: boolean; dashed?: boolean }) {
  return (
    <path
      d={d}
      fill="none"
      stroke={color}
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray={dashed ? '6,4' : undefined}
      className={pulse ? 'realistic-wire--pulse' : undefined}
    />
  );
}

function GroundSymbol({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <line x1={x} y1={y} x2={x} y2={y + 10} stroke="#64748b" strokeWidth={1.5} />
      <line x1={x - 8} y1={y + 10} x2={x + 8} y2={y + 10} stroke="#64748b" strokeWidth={1.5} />
      <line x1={x - 5} y1={y + 14} x2={x + 5} y2={y + 14} stroke="#64748b" strokeWidth={1} />
      <line x1={x - 2} y1={y + 18} x2={x + 2} y2={y + 18} stroke="#64748b" strokeWidth={0.7} />
    </g>
  );
}

// ─── Correction Overlay Helpers ─────────────────────────────────────

function SwapArrow({ x1, y1, x2, y2, label }: { x1: number; y1: number; x2: number; y2: number; label: string }) {
  const midX = (x1 + x2) / 2;
  const midY = Math.min(y1, y2) - 25;
  const d = `M ${x1},${y1 - TERM_R - 4} Q ${midX},${midY} ${x2},${y2 - TERM_R - 4}`;

  return (
    <g className="correction-overlay">
      <path d={d} fill="none" stroke="#22c55e" strokeWidth={2.5} opacity={0.7}
        markerEnd="url(#correction-arrow)" strokeLinecap="round" />
      <text x={midX} y={midY - 6} textAnchor="middle" fill="#22c55e" fontSize="9" fontWeight="700">
        {label}
      </text>
      <title>{label}</title>
    </g>
  );
}

function ErrorX({ cx: x, cy: y }: { cx: number; cy: number }) {
  return (
    <g>
      <line x1={x - 8} y1={y - 8} x2={x + 8} y2={y + 8} stroke="#ef4444" strokeWidth={3} strokeLinecap="round" />
      <line x1={x + 8} y1={y - 8} x2={x - 8} y2={y + 8} stroke="#ef4444" strokeWidth={3} strokeLinecap="round" />
    </g>
  );
}

function PhaseLed({ x, y, status }: { x: number; y: number; status: 'ok' | 'warning' | 'error' }) {
  const color = status === 'error' ? '#ef4444' : status === 'warning' ? '#f59e0b' : '#22c55e';
  return (
    <g>
      <circle cx={x} cy={y} r={4} fill={color} filter="url(#led-glow)" />
      <circle cx={x} cy={y} r={2} fill="#fff" opacity={0.5} />
    </g>
  );
}

// ─── Main Component ─────────────────────────────────────────────────

export function RealisticMeterSchematic({ 
  scheme, 
  voltage, 
  verdicts, 
  Uabc, 
  Iabc, 
  phiDeg, 
  ctPhasePair = 'AC' 
}: RealisticMeterSchematicProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('ACTUAL');

  const is3 = scheme === '3_TS';
  const direct04 = voltage === '0.4';

  // Parse verdicts
  const hasErrors = verdicts.some(v => v.code !== 'OK');
  const revPhases = useMemo(() => {
    const set = new Set<Phase>();
    verdicts.forEach(v => {
      if (v.code === 'REV_I' && v.meta?.revPhase) set.add(v.meta.revPhase);
    });
    return set;
  }, [verdicts]);

  const hasPhaseSwap = verdicts.some(v => v.code === 'PHASE_SWAP');
  const hasWrongU = verdicts.some(v => v.code === 'WRONG_U');

  const showErrors = viewMode === 'ACTUAL' && hasErrors;

  // Terminal highlights
  const termHighlight = (n: number): string | undefined => {
    if (!showErrors) return undefined;
    // Phase A terminals: 1,2,3; B: 4,5,6; C: 7,8,9
    const phaseForTerm: Phase | null =
      n <= 3 ? 'A' : n <= 6 ? 'B' : n <= 9 ? 'C' : null;
    if (!phaseForTerm) return undefined;
    if (revPhases.has(phaseForTerm) && (n === 1 || n === 3 || n === 4 || n === 6 || n === 7 || n === 9)) return 'error';
    if (hasPhaseSwap && (n === 2 || n === 5 || n === 8)) return 'warning';
    return undefined;
  };

  const getTermValue = (n: number): string | undefined => {
    if (!Uabc || !Iabc) return undefined;
    if (scheme === '2_TS') {
      const isExcluded = (ctPhasePair === 'AC' && n >= 4 && n <= 6) ||
                        (ctPhasePair === 'AB' && n >= 7 && n <= 9) ||
                        (ctPhasePair === 'BC' && n >= 1 && n <= 3);
      if (isExcluded) return undefined;
    }
    if (n === 1 || n === 3 || n === 4 || n === 6 || n === 7 || n === 9) {
      const ph: Phase = n <= 3 ? 'A' : n <= 6 ? 'B' : 'C';
      return `${Iabc[ph]?.toFixed(2)}А`;
    }
    if (n === 2 || n === 5 || n === 8) {
      const ph: Phase = n <= 3 ? 'A' : n <= 6 ? 'B' : 'C';
      return `${Uabc[ph]?.toFixed(0)}В`;
    }
    return undefined;
  };

  // ─── Wire Paths ───────────────────────────────────────────────────

  const renderIdealWires = (phase: Phase) => {
    const px = PHASE_X[phase];
    const termBase = phase === 'A' ? 1 : phase === 'B' ? 4 : 7;
    const t1 = termX(termBase);     // И1
    const t2 = termX(termBase + 1); // U
    const t3 = termX(termBase + 2); // И2
    const col = WIRE_COLORS[phase];
    const isDimmedB = !is3 && phase === 'B';

    // CT secondary И1 → terminal (termBase)
    const ctY2 = CT_Y + CT_H + 2;
    const wireI1 = `M ${px - 15},${ctY2} C ${px - 15},${(ctY2 + TERM_Y) / 2} ${t1},${(ctY2 + TERM_Y) / 2} ${t1},${TERM_Y - TERM_R}`;
    const wireI2 = `M ${px + 15},${ctY2} C ${px + 15},${(ctY2 + TERM_Y) / 2 + 20} ${t3},${(ctY2 + TERM_Y) / 2 + 20} ${t3},${TERM_Y - TERM_R}`;

    // VT output → terminal (termBase+1)
    const vtY2 = direct04 ? VT_Y + 40 : VT_Y + 40;
    const wireU = `M ${px},${vtY2} C ${px},${(vtY2 + TERM_Y) / 2 - 10} ${t2},${(vtY2 + TERM_Y) / 2 - 10} ${t2},${TERM_Y - TERM_R}`;

    if (isDimmedB) {
      // 2_TS: phase B has no CT, no current wires. Only voltage wire if applicable.
      return (
        <g key={`wire-${phase}`} opacity={0.35}>
          <WirePath d={wireU} color={col} />
          {/* Jumper between 4-5-6 */}
          <line x1={t1} y1={TERM_Y} x2={t3} y2={TERM_Y} stroke="#475569" strokeWidth={1.5} strokeDasharray="3,3" />
          <text x={(t1 + t3) / 2} y={TERM_Y + 28} fill="#64748b" fontSize="8" textAnchor="middle" fontStyle="italic">
            порожні
          </text>
        </g>
      );
    }

    return (
      <g key={`wire-${phase}`}>
        <WirePath d={wireI1} color={col} />
        <WirePath d={wireI2} color={col} />
        <WirePath d={wireU} color={col} />
      </g>
    );
  };

  const renderErrorWires = (phase: Phase) => {
    const px = PHASE_X[phase];
    const termBase = phase === 'A' ? 1 : phase === 'B' ? 4 : 7;
    const t1 = termX(termBase);
    const t2 = termX(termBase + 1);
    const t3 = termX(termBase + 2);
    const col = WIRE_COLORS[phase];
    const isDimmedB = !is3 && phase === 'B';
    const ctY2 = CT_Y + CT_H + 2;
    const vtY2 = direct04 ? VT_Y + 40 : VT_Y + 40;

    if (isDimmedB) return renderIdealWires(phase);

    const isReversed = revPhases.has(phase);

    if (isReversed) {
      // REV_I: И1 → terminal 3 (instead of 1), И2 → terminal 1 (instead of 3)
      const wireI1_wrong = `M ${px - 15},${ctY2} C ${px - 15},${(ctY2 + TERM_Y) / 2} ${t3},${(ctY2 + TERM_Y) / 2} ${t3},${TERM_Y - TERM_R}`;
      const wireI2_wrong = `M ${px + 15},${ctY2} C ${px + 15},${(ctY2 + TERM_Y) / 2 + 20} ${t1},${(ctY2 + TERM_Y) / 2 + 20} ${t1},${TERM_Y - TERM_R}`;
      const wireU = `M ${px},${vtY2} C ${px},${(vtY2 + TERM_Y) / 2 - 10} ${t2},${(vtY2 + TERM_Y) / 2 - 10} ${t2},${TERM_Y - TERM_R}`;

      return (
        <g key={`wire-err-${phase}`}>
          <WirePath d={wireI1_wrong} color="#ef4444" pulse />
          <WirePath d={wireI2_wrong} color="#ef4444" pulse />
          <WirePath d={wireU} color={col} />
        </g>
      );
    }

    if (hasPhaseSwap) {
      // Phase swap: voltage wires go to wrong terminals
      // Simulate A→C(8), B→A(2), C→B(5)
      const swapTarget = phase === 'A' ? termX(8) : phase === 'B' ? termX(2) : termX(5);
      const wireI1 = `M ${px - 15},${ctY2} C ${px - 15},${(ctY2 + TERM_Y) / 2} ${t1},${(ctY2 + TERM_Y) / 2} ${t1},${TERM_Y - TERM_R}`;
      const wireI2 = `M ${px + 15},${ctY2} C ${px + 15},${(ctY2 + TERM_Y) / 2 + 20} ${t3},${(ctY2 + TERM_Y) / 2 + 20} ${t3},${TERM_Y - TERM_R}`;
      const wireU_wrong = `M ${px},${vtY2} C ${px},${(vtY2 + TERM_Y) / 2 - 10} ${swapTarget},${(vtY2 + TERM_Y) / 2 - 10} ${swapTarget},${TERM_Y - TERM_R}`;

      return (
        <g key={`wire-swap-${phase}`}>
          <WirePath d={wireI1} color={col} />
          <WirePath d={wireI2} color={col} />
          <WirePath d={wireU_wrong} color="#fbbf24" pulse />
        </g>
      );
    }

    // Default (ASYM or other): ideal wiring with warning indicator
    return renderIdealWires(phase);
  };

  // ─── Correction Overlay ───────────────────────────────────────────

  const renderCorrections = () => {
    if (!showErrors) return null;

    const corrections: React.ReactElement[] = [];

    // REV_I corrections
    revPhases.forEach(phase => {
      const termBase = phase === 'A' ? 1 : phase === 'B' ? 4 : 7;
      const t1x = termX(termBase);
      const t3x = termX(termBase + 2);
      corrections.push(
        <SwapArrow
          key={`swap-${phase}`}
          x1={t1x} y1={TERM_Y}
          x2={t3x} y2={TERM_Y}
          label={`Поміняти місцями (${phase})`}
        />
      );
    });

    // PHASE_SWAP corrections
    if (hasPhaseSwap) {
      const phases: Phase[] = ['A', 'B', 'C'];
      phases.forEach(phase => {
        const termBase = phase === 'A' ? 1 : phase === 'B' ? 4 : 7;
        const swapTarget = phase === 'A' ? termX(8) : phase === 'B' ? termX(2) : termX(5);
        const correctTarget = termX(termBase + 1);

        // X on wrong terminal
        corrections.push(
          <ErrorX key={`x-${phase}`} cx={swapTarget} cy={TERM_Y} />
        );

        // Dashed green line from VT to correct terminal
        const px = PHASE_X[phase];
        const vtY2 = direct04 ? VT_Y + 40 : VT_Y + 40;
        corrections.push(
          <WirePath
            key={`correct-${phase}`}
            d={`M ${px},${vtY2} C ${px},${(vtY2 + TERM_Y) / 2 - 10} ${correctTarget},${(vtY2 + TERM_Y) / 2 - 10} ${correctTarget},${TERM_Y - TERM_R}`}
            color="#22c55e"
            dashed
          />
        );
        corrections.push(
          <text key={`label-${phase}`} x={correctTarget} y={TERM_Y - TERM_R - 18}
            textAnchor="middle" fill="#22c55e" fontSize="8" fontWeight="600">
            <title>Фаза {phase} має бути на клемі {termBase + 1}</title>
            ф.{phase} → кл.{termBase + 1}
          </text>
        );
      });
    }

    return <g className="correction-layer">{corrections}</g>;
  };

  // ─── Neutral Wires ────────────────────────────────────────────────

  const renderNeutralWires = () => {
    const t10 = termX(10);
    const t11 = termX(11);
    // И2 grounding star junction
    const groundY = CT_Y + CT_H + 30;
    const groundX = (PHASE_X.A + PHASE_X.C) / 2;

    return (
      <g>
        {/* Ground star from И2 terminals */}
        {is3 ? (
          <>
            {(['A', 'B', 'C'] as const).map(ph => (
              <line key={`gnd-${ph}`}
                x1={PHASE_X[ph] + 15} y1={CT_Y + CT_H + 2}
                x2={groundX} y2={groundY + 10}
                stroke="#475569" strokeWidth={1} strokeDasharray="3,2"
              />
            ))}
            <GroundSymbol x={groundX} y={groundY + 10} />
          </>
        ) : (
          <>
            {(['A', 'C'] as const).map(ph => (
              <line key={`gnd-${ph}`}
                x1={PHASE_X[ph] + 15} y1={CT_Y + CT_H + 2}
                x2={groundX} y2={groundY + 10}
                stroke="#475569" strokeWidth={1} strokeDasharray="3,2"
              />
            ))}
            <GroundSymbol x={groundX} y={groundY + 10} />
          </>
        )}

        {/* Neutral wire to terminals 10/11 */}
        {is3 && (
          <WirePath
            d={`M ${groundX},${groundY + 28} C ${groundX},${(groundY + 28 + TERM_Y) / 2} ${(t10 + t11) / 2},${(groundY + 28 + TERM_Y) / 2} ${(t10 + t11) / 2},${TERM_Y - TERM_R}`}
            color={WIRE_COLORS.N}
          />
        )}

        {/* Internal jumper 10-11 */}
        <line x1={t10} y1={TERM_Y} x2={t11} y2={TERM_Y}
          stroke="#3B82F6" strokeWidth={2} strokeLinecap="round" />
        <text x={(t10 + t11) / 2} y={TERM_Y + 28} fill="#3B82F6" fontSize="8" textAnchor="middle">
          з'єднані
        </text>
      </g>
    );
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 sm:p-6">
      {/* Header + Toggle */}
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div>
          <h4 className="text-sm font-bold text-slate-200">
            Цифровий двійник вузла обліку
          </h4>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {is3 ? '3 ТС + 3 ТН' : '2 ТС + 2 ТН (Арон)'} · {voltage === '0.4' ? '0,4 кВ (без ТН)' : `${voltage} кВ`}
          </p>
        </div>

        {hasErrors && (
          <div className="flex items-center gap-2 bg-slate-900 rounded-lg border border-slate-700 p-1">
            <button
              type="button"
              onClick={() => setViewMode('ACTUAL')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                viewMode === 'ACTUAL'
                  ? 'bg-red-600/80 text-white shadow-lg shadow-red-900/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              🔴 Помилки
            </button>
            <button
              type="button"
              onClick={() => setViewMode('EXPECTED')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                viewMode === 'EXPECTED'
                  ? 'bg-emerald-600/80 text-white shadow-lg shadow-emerald-900/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ✅ Як має бути
            </button>
          </div>
        )}
      </div>

      {/* SVG Schematic */}
      <div className="overflow-x-auto">
        <svg viewBox="0 0 800 600" width="100%" className="w-full h-auto min-w-[360px] sm:min-w-[520px]" style={{ maxHeight: 600 }}>
          <defs>
            <marker id="correction-arrow" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="#22c55e" />
            </marker>
            <filter id="led-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* ─── A. Primary Bus Zone (y ≈ 55) ─── */}
          <text x={30} y={BUS_Y - 12} fill="#64748b" fontSize="9" fontWeight="600">Первинна сторона</text>
          <PrimaryBus phase="A" y={BUS_Y} />
          <PrimaryBus phase="B" y={BUS_Y + 20} />
          <PrimaryBus phase="C" y={BUS_Y + 40} />
          <text x={BUS_X2 + 5} y={BUS_Y + 5} fill={WIRE_COLORS.A} fontSize="9" fontWeight="700">L1</text>
          <text x={BUS_X2 + 5} y={BUS_Y + 25} fill={WIRE_COLORS.B} fontSize="9" fontWeight="700">L2</text>
          <text x={BUS_X2 + 5} y={BUS_Y + 45} fill={WIRE_COLORS.C} fontSize="9" fontWeight="700">L3</text>

          {/* ─── B. CT Zone (y ≈ 140) ─── */}
          <text x={30} y={CT_Y - 8} fill="#64748b" fontSize="9" fontWeight="600">
            Трансформатори струму
          </text>
          {/* Vertical drop from bus to CT */}
          {(['A', 'B', 'C'] as const).map(ph => {
            const busY = BUS_Y + (ph === 'A' ? 0 : ph === 'B' ? 20 : 40);
            return (
              <line key={`drop-${ph}`}
                x1={PHASE_X[ph]} y1={busY} x2={PHASE_X[ph]} y2={CT_Y + CT_H / 2}
                stroke={WIRE_COLORS[ph]} strokeWidth={2.5} opacity={(!is3 && ph === 'B') ? 0.3 : 0.8}
              />
            );
          })}
          <CTSymbol x={PHASE_X.A} y={CT_Y} phase="A" scheme={scheme} ctPhasePair={ctPhasePair} I={Iabc?.A} phi={phiDeg?.A} />
          <CTSymbol x={PHASE_X.B} y={CT_Y} phase="B" scheme={scheme} ctPhasePair={ctPhasePair} I={Iabc?.B} phi={phiDeg?.B} />
          <CTSymbol x={PHASE_X.C} y={CT_Y} phase="C" scheme={scheme} ctPhasePair={ctPhasePair} I={Iabc?.C} phi={phiDeg?.C} />

          {/* ─── VT Zone (y ≈ 260) ─── */}
          {!direct04 && (
            <text x={30} y={VT_Y - 8} fill="#64748b" fontSize="9" fontWeight="600">
              Трансформатори напруги
            </text>
          )}
          {is3 ? (
            <>
              <VTSymbol x={PHASE_X.A} y={VT_Y} phase="A" direct={direct04} U={Uabc?.A} />
              <VTSymbol x={PHASE_X.B} y={VT_Y} phase="B" direct={direct04} U={Uabc?.B} />
              <VTSymbol x={PHASE_X.C} y={VT_Y} phase="C" direct={direct04} U={Uabc?.C} />
            </>
          ) : (
            <>
              <VTSymbol x={PHASE_X.A} y={VT_Y} phase="A" direct={direct04} label="U AB" U={Uabc?.A} />
              <VTSymbol x={PHASE_X.B} y={VT_Y} phase="B" direct={direct04} label="(спільна)" U={Uabc?.B} />
              <VTSymbol x={PHASE_X.C} y={VT_Y} phase="C" direct={direct04} label="U CB" U={Uabc?.C} />
              {/* V-connection lines between VTs */}
              {!direct04 && (
                <>
                  <line x1={PHASE_X.A + 30} y1={VT_Y + 30} x2={PHASE_X.B - 30} y2={VT_Y + 30}
                    stroke="#475569" strokeWidth={1} strokeDasharray="4,3" />
                  <line x1={PHASE_X.B + 30} y1={VT_Y + 30} x2={PHASE_X.C - 30} y2={VT_Y + 30}
                    stroke="#475569" strokeWidth={1} strokeDasharray="4,3" />
                </>
              )}
            </>
          )}

          {/* ─── C. Terminal Block (y ≈ 450-550) ─── */}
          {/* Meter housing */}
          <rect x={termX(1) - 30} y={TERM_Y - 45}
            width={termX(11) - termX(1) + 60} height={100}
            rx={8} fill="#020617" stroke="#334155" strokeWidth={2} />

          {/* Title */}
          <text x={(termX(1) + termX(11)) / 2} y={TERM_Y - 30}
            textAnchor="middle" fill="#94a3b8" fontSize="10" fontWeight="600">
            Клемна колодка лічильника
          </text>

          {/* Phase labels + LEDs */}
          {(['A', 'B', 'C'] as const).map(ph => {
            const termBase = ph === 'A' ? 1 : ph === 'B' ? 4 : 7;
            const x = (termX(termBase) + termX(termBase + 2)) / 2;
            const verdict = verdicts.find(v => v.meta?.revPhase === ph || (v.code === 'PHASE_SWAP' && (ph==='A' || ph==='B' || ph==='C')))?.code || 'OK';
            const status = verdict === 'OK' ? 'ok' : (verdict === 'REV_I' || verdict === 'WRONG_U' ? 'error' : 'warning');
            
            return (
              <g key={`leg-${ph}`}>
                <text x={x} y={TERM_Y - 18} textAnchor="middle" fill={WIRE_COLORS[ph]} fontSize="9" fontWeight="700">
                  Фаза {ph}
                </text>
                <PhaseLed x={x + 28} y={TERM_Y - 21} status={status} />
              </g>
            );
          })}
          <text x={(termX(10) + termX(11)) / 2} y={TERM_Y - 18} textAnchor="middle" fill={WIRE_COLORS.N} fontSize="9" fontWeight="700">
            N
          </text>

          {/* Dividers between phase groups */}
          {[3, 6, 9].map(n => (
            <line key={`div-${n}`}
              x1={(termX(n) + termX(n + 1)) / 2} y1={TERM_Y - 42}
              x2={(termX(n) + termX(n + 1)) / 2} y2={TERM_Y + 42}
              stroke="#334155" strokeWidth={1} strokeDasharray="4,2"
            />
          ))}

          {/* Terminal function labels */}
          {[1, 4, 7].map(n => (
            <text key={`fn-${n}`} x={termX(n)} y={TERM_Y - 4} textAnchor="middle" fill="#475569" fontSize="6">И1</text>
          ))}
          {[2, 5, 8].map(n => (
            <text key={`fn-${n}`} x={termX(n)} y={TERM_Y - 4} textAnchor="middle" fill="#475569" fontSize="6">U</text>
          ))}
          {[3, 6, 9].map(n => (
            <text key={`fn-${n}`} x={termX(n)} y={TERM_Y - 4} textAnchor="middle" fill="#475569" fontSize="6">И2</text>
          ))}

          {/* Terminals */}
          {Array.from({ length: 11 }, (_, i) => i + 1).map(n => (
            <Terminal key={n} cx={termX(n)} cy={TERM_Y} n={n} highlight={termHighlight(n)} val={getTermValue(n)} />
          ))}

          {/* ─── Wires ─── */}
          {(['A', 'B', 'C'] as const).map(ph =>
            showErrors ? renderErrorWires(ph) : renderIdealWires(ph)
          )}

          {/* Neutral */}
          {renderNeutralWires()}

          {/* ─── Correction Overlay ─── */}
          {renderCorrections()}

          {/* Legend */}
          <text x={30} y={590} fill="#475569" fontSize="8">
            И1·И2 — вторинна ТС; U — напруга; Л1·Л2 — первинна ТС
          </text>
        </svg>
      </div>

      {/* Status bar */}
      <div className="mt-3 flex flex-wrap gap-3 text-[11px]">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-0.5 bg-yellow-400 rounded" /> Фаза A
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-0.5 bg-green-400 rounded" /> Фаза B
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-0.5 bg-red-400 rounded" /> Фаза C
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-0.5 bg-blue-400 rounded" /> Нейтраль
        </span>
        {showErrors && (
          <>
            <span className="text-red-400">● — помилка</span>
            <span className="text-emerald-400">⤸ — як виправити</span>
          </>
        )}
      </div>
    </div>
  );
}

export default RealisticMeterSchematic;
