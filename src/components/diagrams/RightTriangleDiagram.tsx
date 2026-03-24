import { formatScalarForLabel, formatAngleForLabel } from '../../utils/calculations';

/**
 * Прямокутний трикутник (гіпотенуза c, катети a по горизонталі, b по вертикалі).
 * b > 0 — катет «вгору» на екрані (індуктивний/лаг), b < 0 — вниз (ємнісний).
 */
interface RightTriangleDiagramProps {
  title?: string;
  legH: number;
  legV: number;
  hyp: number;
  labelH: string;
  labelV: string;
  labelHyp: string;
  unitH?: string;
  unitV?: string;
  unitHyp?: string;
  phiDeg?: number;
  subNote?: string | null;
  valueH?: number;
  valueV?: number;
  valueHyp?: number;
}

export function RightTriangleDiagram({
  title,
  legH,
  legV,
  hyp,
  labelH,
  labelV,
  labelHyp,
  unitH = '',
  unitV = '',
  unitHyp = '',
  phiDeg,
  subNote = null,
  /** Підписи величин (хінт); якщо немає — із legH/legV/hyp */
  valueH,
  valueV,
  valueHyp,
}: RightTriangleDiagramProps) {
  const a = Math.max(Math.abs(legH), 0);
  const b = legV;
  const c = Math.max(Math.abs(hyp), 1e-12);
  const showH = valueH ?? legH;
  const showV = valueV ?? legV;
  const showHyp = valueHyp ?? hyp;
  const maxSide = Math.max(a, Math.abs(b), c, 1e-9);
  const W = 420;
  const pxPerUnit = 300 / maxSide;
  const ax = a * pxPerUnit;
  const bx = Math.abs(b) * pxPerUnit;

  const x0 = 60;
  const yBase = 280;
  const x1 = x0 + ax;
  const yMid = b >= 0 ? yBase - bx : yBase + bx;
  const x2 = x1;
  const y2 = yMid;

  const strokeH = '#3b82f6';
  const strokeV = '#f97316';
  const strokeHyp = '#a855f7';

  return (
    <div className="vector-diagram-container bg-slate-900 p-6 rounded-2xl shadow-2xl overflow-hidden">
      {title ? (
        <h3 className="text-sm font-bold text-slate-300 mb-3 text-center tracking-wide">{title}</h3>
      ) : null}
      <svg
        width="100%"
        viewBox="0 0 440 380"
        className="vector-svg w-full max-w-none mx-auto block"
        style={{ maxHeight: 480 }}
      >
        <text x="190" y="28" textAnchor="middle" fill="#94a3b8" fontSize="11" fontStyle="italic">
          Катети — активна та реактивна складові; гіпотенуза — повна величина (теорема Піфагора)
        </text>

        {/* P / U_R / R leg */}
        <line x1={x0} y1={yBase} x2={x1} y2={yBase} stroke={strokeH} strokeWidth={3} />
        <text
          x={(x0 + x1) / 2}
          y={yBase + 22}
          fill={strokeH}
          fontSize="11"
          fontWeight="700"
          textAnchor="middle"
        >
          {labelH}
        </text>
        <text
          x={(x0 + x1) / 2}
          y={yBase + 36}
          fill="#cbd5e1"
          fontSize="10"
          textAnchor="middle"
        >
          {formatScalarForLabel(showH)} {unitH}
        </text>

        {/* Q / U_X / X leg */}
        <line x1={x1} y1={yBase} x2={x2} y2={y2} stroke={strokeV} strokeWidth={3} strokeDasharray="6,4" />
        <text
          x={x1 + 14}
          y={(yBase + y2) / 2}
          fill={strokeV}
          fontSize="11"
          fontWeight="700"
          dominantBaseline="middle"
        >
          {labelV}
        </text>
        <text
          x={x1 + 14}
          y={(yBase + y2) / 2 + 14}
          fill="#cbd5e1"
          fontSize="10"
          dominantBaseline="middle"
        >
          {formatScalarForLabel(Math.abs(showV))} {unitV}
        </text>

        {/* Hypotenuse S / U / Z */}
        <line x1={x0} y1={yBase} x2={x2} y2={y2} stroke={strokeHyp} strokeWidth={3} />
        <text
          x={(x0 + x2) / 2 - 18}
          y={(yBase + y2) / 2 - 10}
          fill={strokeHyp}
          fontSize="11"
          fontWeight="700"
        >
          {labelHyp}
        </text>
        <text x={(x0 + x2) / 2 - 18} y={(yBase + y2) / 2 + 6} fill="#cbd5e1" fontSize="10">
          {formatScalarForLabel(showHyp)} {unitHyp}
        </text>

        {phiDeg != null && Number.isFinite(phiDeg) ? (
          <text x="12" y="310" fill="#64748b" fontSize="10">
            φ (U–I) = {formatAngleForLabel(phiDeg)}°
          </text>
        ) : null}
        <text x="200" y="310" fill="#64748b" fontSize="9" textAnchor="middle">
          Перевірка: a² + b² ≈ c² (з урахуванням масштабу)
        </text>

        <circle cx={x0} cy={yBase} r={4} fill="#64748b" />
      </svg>
      {subNote ? <p className="text-[10px] text-slate-500 mt-2 px-1 leading-snug">{subNote}</p> : null}
    </div>
  );
}
