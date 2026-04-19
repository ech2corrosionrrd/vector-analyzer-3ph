import { toPhaseVoltage, degToRad } from '../../utils/calculations';
import type { AngleMode, Measurements, Scheme, VoltageType } from '../../types/vaf';

interface SmithProps {
  measurements: Measurements;
  angleMode: AngleMode;
  scheme: Scheme;
  voltageType: VoltageType;
}

/**
 * Діаграма Сміта — відображає нормований опір Z/Z₀ кожної фази
 * на класичній діаграмі Сміта (коло |Γ| = 1).
 */
export function SmithChartDiagram({ measurements, angleMode, scheme, voltageType }: SmithProps) {
  const cx = 210, cy = 210, R = 160;

  // Z₀ normalization impedance (standard: 50 Ω for RF, but for power we use average Z)
  const phases = (['A', 'B', 'C'] as const).map(ph => {
    const Uphase = toPhaseVoltage(measurements[ph].U, voltageType, scheme);
    const I = Math.max(measurements[ph].I, 1e-9);
    const Z = Uphase / I;
    const phi = angleMode === 'relative'
      ? measurements[ph].angleU - measurements[ph].angleI
      : measurements[ph].phi;
    const rad = degToRad(phi);
    const Rz = Z * Math.cos(rad); // Resistance
    const Xz = Z * Math.sin(rad); // Reactance
    return { id: ph, Z, phi, R: Rz, X: Xz };
  });

  const avgZ = phases.reduce((s, p) => s + p.Z, 0) / 3 || 1;

  // Convert normalized impedance z = r + jx to Smith chart coordinates
  // Γ = (z - 1) / (z + 1) where z = Z/Z₀
  function smithCoords(r: number, x: number): { sx: number; sy: number } {
    const zr = r; // Already normalized
    const zi = x;
    const denom = (zr + 1) ** 2 + zi ** 2;
    const gammaR = ((zr ** 2 - 1) + zi ** 2) / denom;
    const gammaI = (2 * zi) / denom;
    return {
      sx: cx + gammaR * R,
      sy: cy - gammaI * R, // SVG y inverted
    };
  }

  const phaseColors: Record<string, string> = { A: '#facc15', B: '#22c55e', C: '#ef4444' };

  // Constant resistance circles (r = 0, 0.5, 1, 2, 5)
  const rCircles = [0, 0.5, 1, 2, 5];
  // Constant reactance arcs (x = ±0.5, ±1, ±2)
  const xArcs = [0.5, 1, 2];

  // Generate circle path for constant r
  function rCirclePath(r: number): string {
    const center = smithCoords(r, 0);
    // Radius in Smith chart space: R / (r + 1)
    const radius = R / (r + 1);
    return `M ${center.sx - radius},${center.sy} a ${radius},${radius} 0 1,0 ${2 * radius},0 a ${radius},${radius} 0 1,0 ${-2 * radius},0`;
  }

  return (
    <div className="vector-diagram-container bg-slate-900 p-4 sm:p-6 rounded-2xl shadow-2xl overflow-hidden">
      <h3 className="text-sm font-bold text-slate-300 mb-2 text-center">
        Діаграма Сміта — імпеданс мережі (Z = U/I·e<sup>jφ</sup>)
      </h3>
      <svg viewBox="0 0 420 430" className="vector-svg w-full max-w-2xl mx-auto block" style={{ maxHeight: 520 }}>
        <defs>
          <clipPath id="smith-clip">
            <circle cx={cx} cy={cy} r={R} />
          </clipPath>
        </defs>

        {/* Outer circle (|Γ| = 1) */}
        <circle cx={cx} cy={cy} r={R} fill="#0f172a" stroke="#475569" strokeWidth="2" />

        {/* Constant resistance circles */}
        {rCircles.map(r => (
          <path
            key={`r-${r}`}
            d={rCirclePath(r)}
            fill="none"
            stroke="#1e293b"
            strokeWidth="0.7"
            clipPath="url(#smith-clip)"
          />
        ))}

        {/* Constant reactance arcs (top half: +X, bottom half: -X) */}
        {xArcs.map(x => {
          const arcR = R / x;
          const arcCenterPlus = { x: cx + R, y: cy - arcR };
          const arcCenterMinus = { x: cx + R, y: cy + arcR };
          return (
            <g key={`x-${x}`} clipPath="url(#smith-clip)">
              <circle cx={arcCenterPlus.x} cy={arcCenterPlus.y} r={arcR} fill="none" stroke="#1e293b" strokeWidth="0.5" />
              <circle cx={arcCenterMinus.x} cy={arcCenterMinus.y} r={arcR} fill="none" stroke="#1e293b" strokeWidth="0.5" />
            </g>
          );
        })}

        {/* Horizontal axis (real) */}
        <line x1={cx - R} y1={cy} x2={cx + R} y2={cy} stroke="#334155" strokeWidth="0.8" />

        {/* Labels */}
        <text x={cx - R - 14} y={cy + 4} fill="#64748b" fontSize="8">0</text>
        <text x={cx + R + 4} y={cy + 4} fill="#64748b" fontSize="8">∞</text>
        <text x={cx - 3} y={cy + R + 16} fill="#64748b" fontSize="8">-jX</text>
        <text x={cx - 3} y={cy - R - 6} fill="#64748b" fontSize="8">+jX</text>

        {/* r circle labels */}
        {rCircles.map(r => {
          const pos = smithCoords(r, 0);
          return (
            <text key={`rl-${r}`} x={pos.sx} y={cy + 12} fill="#475569" fontSize="7" textAnchor="middle">
              {r}
            </text>
          );
        })}

        {/* Impedance points for each phase */}
        {phases.map(p => {
          const normR = p.R / avgZ;
          const normX = p.X / avgZ;
          const { sx, sy } = smithCoords(normR, normX);

          // Clamp to circle
          const dx = sx - cx, dy = sy - cy;
          const dist = Math.hypot(dx, dy);
          const clampedX = dist > R ? cx + dx * R / dist : sx;
          const clampedY = dist > R ? cy + dy * R / dist : sy;

          return (
            <g key={p.id}>
              <circle
                cx={clampedX} cy={clampedY} r="7"
                fill={phaseColors[p.id]}
                opacity="0.9"
                stroke="#0f172a"
                strokeWidth="2"
                className="vector-line"
              />
              <text
                x={clampedX + 10}
                y={clampedY - 5}
                fill={phaseColors[p.id]}
                fontSize="11"
                fontWeight="700"
              >
                Z{p.id}
              </text>
              <text
                x={clampedX + 10}
                y={clampedY + 8}
                fill={phaseColors[p.id]}
                fontSize="8"
                opacity="0.7"
              >
                {p.R.toFixed(1)}{p.X >= 0 ? '+' : ''}{p.X.toFixed(1)}j Ω
              </text>
            </g>
          );
        })}

        {/* Nature indicator */}
        <text x="20" y="395" fill="#94a3b8" fontSize="9">
          Z₀(норм.) = {avgZ.toFixed(1)} Ом
        </text>
        <text x="20" y="410" fill="#64748b" fontSize="8">
          Верхня півсфера: індуктивний | Нижня: ємнісний
        </text>
        <text x="20" y="423" fill="#64748b" fontSize="8">
          Центр (r=1, x=0): узгоджене навантаження
        </text>
      </svg>
      <p className="text-[11px] text-slate-500 mt-3 leading-relaxed">
        Кожна точка — нормований імпеданс фази Z/Z₀. Верхня півсфера = індуктивний опір (+jX),
        нижня = ємнісний (-jX). Центр кола = ідеальне узгодження (Z = Z₀).
      </p>
    </div>
  );
}
