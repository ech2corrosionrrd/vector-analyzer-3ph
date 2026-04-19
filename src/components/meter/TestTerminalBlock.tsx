/**
 * ВПК 13 клем: розпіновка 1-U, 2-И1, 3-И2, 4-пром.
 */

import type { Phase } from '../../types/vaf';
import { PHASE_COLORS } from '../../utils/constants';
import {
  METER_PLATE_PAD,
  ikkTerminalLocalX,
  meterPlateOuterWidth,
} from '../../utils/meterTerminalLayout';

interface TestTerminalBlockProps {
  x: number;
  y: number;
  // shunted stores active shunts like "A-23", "A-34", etc.
  shunted: Set<string>;
  openVoltagePhases: Set<Phase>;
  onToggleShunt?: (shuntId: string) => void;
  onToggleVoltage?: (ph: Phase) => void;
  scale?: number;
}

type TerminalKind = 'U' | 'I' | 'N';

interface VpkTermDef {
  id: number;
  fn: string;
  phase: Phase | 'N';
  kind: TerminalKind;
}

const VPK_TERMINALS: VpkTermDef[] = [
  { id: 1, fn: 'U', phase: 'A', kind: 'U' },
  { id: 2, fn: 'И1', phase: 'A', kind: 'I' },
  { id: 3, fn: 'И2', phase: 'A', kind: 'I' },
  { id: 4, fn: 'зап.', phase: 'A', kind: 'I' },
  { id: 5, fn: 'U', phase: 'B', kind: 'U' },
  { id: 6, fn: 'И1', phase: 'B', kind: 'I' },
  { id: 7, fn: 'И2', phase: 'B', kind: 'I' },
  { id: 8, fn: 'зап.', phase: 'B', kind: 'I' },
  { id: 9, fn: 'U', phase: 'C', kind: 'U' },
  { id: 10, fn: 'И1', phase: 'C', kind: 'I' },
  { id: 11, fn: 'И2', phase: 'C', kind: 'I' },
  { id: 12, fn: 'зап.', phase: 'C', kind: 'I' },
  { id: 13, fn: 'N', phase: 'N', kind: 'N' },
];

const COL_W = 40;
const COL_HW = COL_W / 2;

function partitionBetween(a: number, b: number): number {
  return (ikkTerminalLocalX(a) + ikkTerminalLocalX(b)) / 2;
}

export function TestTerminalBlock({
  x,
  y,
  shunted,
  openVoltagePhases,
  onToggleShunt,
  onToggleVoltage,
  scale = 1.0,
}: TestTerminalBlockProps) {
  const terminals = VPK_TERMINALS.map((t) => ({
    ...t,
    lx: ikkTerminalLocalX(t.id),
  }));

  const plateW = meterPlateOuterWidth();
  const titleCenterX = -METER_PLATE_PAD + plateW / 2;

  // Visual boundaries between phases
  const partitionLocals = [partitionBetween(4, 5), partitionBetween(8, 9), partitionBetween(12, 13)];

  const getPhaseColor = (ph: Phase | 'N') => (ph === 'N' ? '#3B82F6' : PHASE_COLORS[ph]);

  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`}>
      <defs>
        <linearGradient id="vpk-rail-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1E293B" />
          <stop offset="100%" stopColor="#0F172A" />
        </linearGradient>
        <filter id="shunt-glow">
          <feGaussianBlur stdDeviation="3" result="glow" />
          <feComposite in="SourceGraphic" in2="glow" operator="over" />
        </filter>
      </defs>

      <rect
        x={-METER_PLATE_PAD}
        y={20}
        width={plateW}
        height={320}
        rx={12}
        fill="url(#vpk-rail-grad)"
        stroke="#334155"
        strokeWidth={2}
      />

      <text
        x={titleCenterX}
        y={44}
        textAnchor="middle"
        fill="#94A3B8"
        fontSize="12"
        fontWeight="700"
        fontFamily="system-ui, sans-serif"
      >
        ВПК — 13-контактна випробувальна колодка
      </text>
      <text
        x={titleCenterX}
        y={58}
        textAnchor="middle"
        fill="#64748B"
        fontSize="10"
        fontFamily="system-ui, sans-serif"
      >
        Контакти на фазу: 1-U, 2-И1, 3-И2, 4-зап.
      </text>

      {/* Row partition markers */}
      {partitionLocals.map((xl, i) => (
        <line
          key={i}
          x1={xl}
          y1={68}
          x2={xl}
          y2={305}
          stroke="#334155"
          strokeWidth={1.5}
          strokeDasharray="4,4"
        />
      ))}

      {terminals.map((t) => {
        const pColor = getPhaseColor(t.phase);
        const isOpen = t.kind === 'U' && openVoltagePhases.has(t.phase as Phase);
        const isN = t.kind === 'N';

        return (
          <g key={t.id} transform={`translate(${t.lx}, 0)`}>
            <rect
              x={-COL_HW}
              y={72}
              width={COL_W}
              height={230}
              fill="#0F172A"
              rx={4}
              stroke="#334155"
              strokeWidth={1}
            />
            {/* Phase identifier at the top */}
            {!isN && <rect x={-COL_HW + 2} y={74} width={COL_W - 4} height={5} rx={1} fill={pColor} opacity={0.75} />}

            {/* Voltage Disconnector (for U terminals) */}
            <g transform="translate(0, 110)">
              <circle r={11} fill="#1E293B" stroke={isOpen ? '#EF4444' : pColor} strokeWidth={2} />
              <line x1="-5" y1="0" x2="5" y2="0" stroke="#475569" strokeWidth={2} transform="rotate(-45)" />
              {t.kind === 'U' && (
                <circle r={4} fill={isOpen ? '#EF4444' : '#22C55E'} cy={-18} />
              )}
              {t.kind === 'U' && (
                <rect x={-15} y={-30} width={30} height={50} fill="transparent" className="cursor-pointer" onClick={() => onToggleVoltage?.(t.phase as Phase)} />
              )}
            </g>

            {/* Screw / Terminal Marker */}
            <g transform="translate(0, 240)">
               <circle r={8} fill="#2D3748" stroke="#4a5568" strokeWidth={2} />
               <path d="M-4,0 L4,0 M0,-4 L0,4" stroke="#718096" strokeWidth={1} />
            </g>

            <text
              y="322"
              textAnchor="middle"
              fill="#E2E8F0"
              fontSize="14"
              fontWeight="900"
              fontFamily="system-ui, sans-serif"
            >
              {t.id}
            </text>
            <text
              y="94"
              textAnchor="middle"
              fill="#CBD5E1"
              fontSize={t.fn === 'зап.' ? 9 : 10}
              fontWeight="800"
              fontFamily="system-ui, sans-serif"
            >
              {t.fn}
            </text>
          </g>
        );
      })}

      {/* SHUNTS LOGIC per Phase */}
      {(['A', 'B', 'C'] as Phase[]).map((ph) => {
        const [, i1, i2, p] = ph === 'A' ? [1, 2, 3, 4] : ph === 'B' ? [5, 6, 7, 8] : [9, 10, 11, 12];
        const x1 = ikkTerminalLocalX(i1);
        const x2 = ikkTerminalLocalX(i2);
        const x3 = ikkTerminalLocalX(p);

        const is23 = shunted.has(`${ph}-23`);
        const is34 = shunted.has(`${ph}-34`);

        return (
          <g key={`shunts-${ph}`}>
            {/* Shunt between 2 (И1) and 3 (И2) */}
            <g className="cursor-pointer" onClick={() => onToggleShunt?.(`${ph}-23`)}>
               {is23 ? (
                 <path d={`M ${x1} 160 L ${x2} 160`} stroke="#F59E0B" strokeWidth={10} fill="none" filter="url(#shunt-glow)" />
               ) : (
                 <path d={`M ${x1} 150 L ${x1} 170 L ${x2} 170 L ${x2} 150`} stroke="#475569" strokeWidth={1.5} strokeDasharray="3,2" fill="none" />
               )}
               <rect x={x1 - 15} y={140} width={x2 - x1 + 30} height={40} fill="transparent" />
            </g>

            {/* Shunt between 3 (И2) and 4 (пром) */}
            <g className="cursor-pointer" onClick={() => onToggleShunt?.(`${ph}-34`)}>
               {is34 ? (
                 <path d={`M ${x2} 190 L ${x3} 190`} stroke="#F59E0B" strokeWidth={10} fill="none" filter="url(#shunt-glow)" />
               ) : (
                 <path d={`M ${x2} 180 L ${x2} 200 L ${x3} 200 L ${x3} 180`} stroke="#475569" strokeWidth={1.5} strokeDasharray="3,2" fill="none" />
               )}
               <rect x={x2 - 15} y={170} width={x3 - x2 + 30} height={40} fill="transparent" />
            </g>
          </g>
        );
      })}
    </g>
  );
}
