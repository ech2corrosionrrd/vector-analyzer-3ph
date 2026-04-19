/**
 * TerminalBlock — SVG DIN-Rail клемна колодка лічильника
 */

import { PHASE_COLORS } from '../../utils/constants';
import {
  METER_PLATE_PAD,
  METER_TERM_GAP,
  METER_TERM_W,
  meterBlockInnerWidth,
  meterTerminalLocalLeftX,
} from '../../utils/meterTerminalLayout';
import type { Phase, VafPhaseValues, ConnectionScheme, CtPhasePair, MeterElements } from '../../types/vaf';

type TermStatus = 'ok' | 'warning' | 'error' | 'idle';

export interface TerminalBlockProps {
  Uabc?: VafPhaseValues;
  Iabc?: VafPhaseValues;
  phiDeg?: VafPhaseValues;
  highlights: Record<number, TermStatus>;
  scheme: ConnectionScheme;
  ctPhasePair?: CtPhasePair;
  meterElements?: MeterElements;
  x?: number;
  y?: number;
  onTerminalClick?: (n: number) => void;
  selectedTerminal?: number | null;
  scale?: number;
}

interface TermInfo {
  n: number;
  fn: string;
  phase: Phase | 'N';
  role: 'current_in' | 'current_out' | 'voltage' | 'neutral';
}

const TERMINALS_3PH: TermInfo[] = [
  { n: 1,  fn: 'И1', phase: 'A', role: 'current_in'  },
  { n: 2,  fn: 'U',  phase: 'A', role: 'voltage'      },
  { n: 3,  fn: 'И2', phase: 'A', role: 'current_out'  },
  { n: 4,  fn: 'И1', phase: 'B', role: 'current_in'   },
  { n: 5,  fn: 'U',  phase: 'B', role: 'voltage'      },
  { n: 6,  fn: 'И2', phase: 'B', role: 'current_out'  },
  { n: 7,  fn: 'И1', phase: 'C', role: 'current_in'   },
  { n: 8,  fn: 'U',  phase: 'C', role: 'voltage'      },
  { n: 9,  fn: 'И2', phase: 'C', role: 'current_out'  },
  { n: 10, fn: 'N',  phase: 'N', role: 'neutral'       },
  { n: 11, fn: 'N',  phase: 'N', role: 'neutral'       },
];

// Layout for 2-element 3-wire meters (e.g. SL7000 3-wire)
const TERMINALS_2PH: TermInfo[] = [
  { n: 1,  fn: 'И1', phase: 'A', role: 'current_in'  },
  { n: 2,  fn: 'U',  phase: 'A', role: 'voltage'      },
  { n: 3,  fn: 'И2', phase: 'A', role: 'current_out'  },
  { n: 4,  fn: 'U',  phase: 'B', role: 'voltage'      }, // Reference
  { n: 5,  fn: 'U',  phase: 'C', role: 'voltage'      },
  { n: 6,  fn: 'И1', phase: 'C', role: 'current_in'   },
  { n: 7,  fn: 'И2', phase: 'C', role: 'current_out'  },
  { n: 8,  fn: 'N',  phase: 'N', role: 'neutral'       },
];

const TERM_W = METER_TERM_W;
const TERM_H = 100;

const statusColor: Record<TermStatus, string> = {
  ok:      '#22c55e',
  warning: '#f59e0b',
  error:   '#ef4444',
  idle:    '#475569',
};

function terminalX(n: number): number {
  return meterTerminalLocalLeftX(n);
}

function phaseColor(phase: Phase | 'N'): string {
  if (phase === 'N') return '#3b82f6';
  return PHASE_COLORS[phase] ?? '#94a3b8';
}

function getLiveValue(t: TermInfo, Uabc?: VafPhaseValues, Iabc?: VafPhaseValues): string | null {
  if (!Uabc && !Iabc) return null;
  if (t.phase === 'N') return null;
  if ((t.role === 'current_in' || t.role === 'current_out') && Iabc) {
    const v = Iabc[t.phase as Phase];
    return v != null ? `${v.toFixed(2)}А` : null;
  }
  if (t.role === 'voltage' && Uabc) {
    const v = Uabc[t.phase as Phase];
    return v != null ? `${v.toFixed(1)}В` : null;
  }
  return null;
}

export function TerminalBlock({
  Uabc, Iabc,
  highlights,
  meterElements = 3,
  x = 0,
  y = 0,
  onTerminalClick,
  selectedTerminal,
  scale = 1.0,
}: TerminalBlockProps) {
  const terminals = meterElements === 2 ? TERMINALS_2PH : TERMINALS_3PH;
  const W = terminals === TERMINALS_3PH ? meterBlockInnerWidth() : (TERM_W + METER_TERM_GAP) * terminals.length + 20;
  const platePad = METER_PLATE_PAD;

  const isExcluded = (_t: TermInfo): boolean => false;

  return (
    <g transform={`translate(${x},${y}) scale(${scale})`}>
      <defs>
        <linearGradient id="tb-rail-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1e293b" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>
      </defs>

      {/* Background rail plate */}
      <rect x={-platePad} y={-35} width={W + 2 * platePad} height={TERM_H + 55}
        rx={10} fill="url(#tb-rail-grad)"
        stroke="#334155" strokeWidth={2} />
      <text x={W / 2} y={-45} textAnchor="middle" fill="#475569" fontSize="14" fontWeight="900" letterSpacing="4">
        КЛЕМНА КОЛОДКА ЛІЧИЛЬНИКА ({meterElements}-ЕЛ)
      </text>

      {/* DIN rail bar */}
      <rect x={-(platePad - 8)} y={TERM_H + 6} width={W + 2 * (platePad - 8)} height={8}
        rx={2} fill="#1e293b" stroke="#475569" strokeWidth={1} />

      {/* Terminals */}
      {terminals.map(t => {
        // For 3-element we use the standard helper, for 2-element we place them linearly
        const tx = terminals === TERMINALS_3PH ? terminalX(t.n) : (t.n - 1) * (TERM_W + METER_TERM_GAP);
        const status = highlights[t.n] ?? 'idle';
        const excl = isExcluded(t);
        const sColor = excl ? '#334155' : statusColor[status];
        const pColor = excl ? '#334155' : phaseColor(t.phase);
        const liveVal = getLiveValue(t, Uabc, Iabc);
        const isSelected = selectedTerminal === t.n;

        return (
          <g key={t.n} transform={`translate(${tx}, 0)`}
            style={{ cursor: onTerminalClick ? 'pointer' : 'default' }}
            onClick={() => onTerminalClick?.(t.n)}>

            {/* Terminal housing */}
            <rect x={0} y={0} width={TERM_W} height={TERM_H}
              rx={3}
              fill={isSelected ? '#1e3a5f' : '#0f172a'}
              stroke={isSelected ? '#3b82f6' : sColor}
              strokeWidth={isSelected ? 2 : 1.5}
              opacity={excl ? 0.4 : 1}
            />

            {/* Phase color stripe at top */}
            <rect x={2} y={2} width={TERM_W - 4} height={5}
              rx={1} fill={pColor} opacity={excl ? 0.2 : 0.7} />

            {/* Function label */}
            <text x={TERM_W / 2} y={24} textAnchor="middle"
              fill={excl ? '#475569' : '#f8fafc'} fontSize="11" fontWeight="900">
              {t.fn}
            </text>

            <text x={TERM_W / 2} y={35} textAnchor="middle" fill="#64748B" fontSize="8" fontWeight="bold">
               {t.phase === 'N' ? '' : t.phase}
            </text>

            {/* Screw head */}
            <circle cx={TERM_W / 2} cy={55} r={12}
              fill="#1e293b"
              stroke={excl ? '#334155' : pColor}
              strokeWidth={1.5}
            />
            <line x1={TERM_W / 2 - 6} y1={55} x2={TERM_W / 2 + 6} y2={55}
              stroke="#475569" strokeWidth={2} />

            {/* Live value badge */}
            {liveVal && !excl && (
              <g>
                <rect x={4} y={75} width={TERM_W - 8} height={16}
                  rx={4} fill="#020617" stroke={pColor} strokeWidth={1.5} opacity={1} />
                <text x={TERM_W / 2} y={87} textAnchor="middle"
                  fill="#f8fafc" fontSize="10" fontWeight="900">
                  {liveVal}
                </text>
              </g>
            )}

            {/* Terminal number */}
            <text x={TERM_W / 2} y={TERM_H - 6} textAnchor="middle"
              fill={excl ? '#334155' : '#64748b'} fontSize="11" fontWeight="900">
              {t.n}
            </text>
          </g>
        );
      })}
    </g>
  );
}
