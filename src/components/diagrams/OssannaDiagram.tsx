import { toPhaseVoltage, degToRad } from '../../utils/calculations';
import type { AngleMode, Measurements, Scheme, VoltageType } from '../../types/vaf';

interface OssannaProps {
  measurements: Measurements;
  angleMode: AngleMode;
  scheme: Scheme;
  voltageType: VoltageType;
}

/**
 * Діаграма Оссана (Circle Diagram) — будує коло струмів на основі реальних даних.
 * Точка на колі визначається вектором Il (струм статора) при поточному навантаженні.
 * Діаметр кола = I₀ (холостий хід) + Iкз (коротке замикання) — наближення.
 */
export function OssannaDiagram({ measurements, angleMode, scheme, voltageType }: OssannaProps) {
  const cx = 210, cy = 170, R = 110;

  // Compute current phasors in Cartesian for each phase
  const phases = (['A', 'B', 'C'] as const).map(ph => {
    const Uphase = toPhaseVoltage(measurements[ph].U, voltageType, scheme);
    const I = measurements[ph].I;
    const phi = angleMode === 'relative'
      ? measurements[ph].angleU - measurements[ph].angleI
      : measurements[ph].phi;
    const rad = degToRad(phi);
    // I cos(φ) = active component, I sin(φ) = reactive component
    return {
      id: ph,
      I,
      Uphase,
      phi,
      Ix: I * Math.cos(rad),  // Active current
      Iy: I * Math.sin(rad),  // Reactive current
    };
  });

  // Normalize: find max current for scaling
  const maxI = Math.max(...phases.map(p => p.I), 1e-9);
  const scale = R * 0.85 / maxI;

  // Colors for each phase
  const phaseColors = { A: '#facc15', B: '#22c55e', C: '#ef4444' };

  return (
    <div className="vector-diagram-container bg-slate-900 p-4 sm:p-6 rounded-2xl shadow-2xl overflow-hidden">
      <h3 className="text-sm font-bold text-slate-300 mb-2 text-center">
        Діаграма Оссана — коло струмів (за реальними вимірами)
      </h3>
      <svg viewBox="0 0 420 360" className="vector-svg w-full max-w-2xl mx-auto block" style={{ maxHeight: 480 }}>
        <defs>
          <marker id="ossa-arrow" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#38bdf8" />
          </marker>
          {phases.map(p => (
            <marker key={`m-${p.id}`} id={`ossa-arrow-${p.id}`} markerWidth="8" markerHeight="5" refX="7" refY="2.5" orient="auto">
              <polygon points="0 0, 8 2.5, 0 5" fill={phaseColors[p.id]} />
            </marker>
          ))}
        </defs>

        {/* Title */}
        <text x={cx} y="18" textAnchor="middle" fill="#94a3b8" fontSize="10" fontStyle="italic">
          Кожна точка — кінець вектора струму фази (Ix — активна, Iy — реактивна)
        </text>

        {/* Circle of currents */}
        <circle cx={cx} cy={cy} r={R} fill="none" stroke="#334155" strokeWidth="1.5" strokeDasharray="6,4" />

        {/* Axes */}
        <line x1={cx - R - 15} y1={cy} x2={cx + R + 15} y2={cy} stroke="#475569" strokeWidth="0.7" strokeDasharray="4,3" />
        <line x1={cx} y1={cy - R - 15} x2={cx} y2={cy + R + 15} stroke="#334155" strokeWidth="0.7" strokeDasharray="3,4" />

        {/* Axis labels */}
        <text x={cx + R + 18} y={cy + 4} fill="#64748b" fontSize="9">I·cos φ (A)</text>
        <text x={cx + 3} y={cy - R - 10} fill="#64748b" fontSize="9">I·sin φ (реакт.)</text>

        {/* Center dot */}
        <circle cx={cx} cy={cy} r="3" fill="#64748b" />

        {/* Phase current vectors */}
        {phases.map(p => {
          const endX = cx + p.Ix * scale;
          const endY = cy - p.Iy * scale; // SVG y inverted
          return (
            <g key={p.id}>
              {/* Vector line */}
              <line
                x1={cx} y1={cy}
                x2={endX} y2={endY}
                stroke={phaseColors[p.id]}
                strokeWidth="2.5"
                markerEnd={`url(#ossa-arrow-${p.id})`}
                className="vector-line"
              />
              {/* Endpoint dot */}
              <circle cx={endX} cy={endY} r="4" fill={phaseColors[p.id]} opacity="0.9" />
              {/* Label */}
              <text
                x={endX + (p.Ix >= 0 ? 8 : -8)}
                y={endY - 8}
                fill={phaseColors[p.id]}
                fontSize="11"
                fontWeight="700"
                textAnchor={p.Ix >= 0 ? 'start' : 'end'}
              >
                I{p.id}
              </text>
              <text
                x={endX + (p.Ix >= 0 ? 8 : -8)}
                y={endY + 5}
                fill={phaseColors[p.id]}
                fontSize="8"
                opacity="0.7"
                textAnchor={p.Ix >= 0 ? 'start' : 'end'}
              >
                {p.I.toFixed(1)}A ∠{p.phi.toFixed(0)}°
              </text>
            </g>
          );
        })}

        {/* Legend */}
        <text x="20" y="310" fill="#94a3b8" fontSize="9">
          U<tspan fontSize="7" dy="2">ф</tspan><tspan dy="-2"> = {phases[0].Uphase.toFixed(0)} В</tspan>
        </text>
        <text x="20" y="325" fill="#94a3b8" fontSize="9">
          I<tspan fontSize="7" dy="2">max</tspan><tspan dy="-2"> = {maxI.toFixed(2)} А</tspan>
        </text>
        <text x="20" y="345" fill="#64748b" fontSize="8">
          Радіус кола ∝ I<tspan fontSize="6" dy="2">max</tspan>
        </text>
      </svg>
      <p className="text-[11px] text-slate-500 mt-3 leading-relaxed">
        Кожен вектор — струм відповідної фази. Активна (cos φ) — горизонтальна проекція, реактивна (sin φ) — вертикальна.
        Чим ближче точки до кола — тим більш збалансоване навантаження.
      </p>
    </div>
  );
}
