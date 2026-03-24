import { useMemo } from 'react';
import { degToRad, toPhaseVoltage, formatScalarForLabel, formatAngleForLabel } from '../../utils/calculations';

const colors = { A: '#facc15', B: '#22c55e', C: '#ef4444' };

/** Замкнений ланцюг фазних напруг «голова в хвіст»: U_A + U_B + U_C. За симетрії векторна сума → 0. */
export function PhasorPolygonDiagram({ measurements, scheme, voltageType, size = 720 }) {
  const { segments, closure, view } = useMemo(() => {
    const phases = ['A', 'B', 'C'];
    let x = 0;
    let y = 0;
    const pts = [{ x: 0, y: 0 }];
    const segs = [];

    const mags = phases.map((p) => toPhaseVoltage(measurements[p].U, voltageType, scheme));
    const maxU = Math.max(...mags, 1e-6);
    const scale = 220 / maxU;

    phases.forEach((p, i) => {
      const U = mags[i];
      const ang = measurements[p].angleU;
      const rad = degToRad(ang);
      const dx = U * scale * Math.cos(rad);
      const dy = -U * scale * Math.sin(rad);
      x += dx;
      y += dy;
      pts.push({ x, y, phase: p, U, ang });
      segs.push({
        from: pts[i],
        to: pts[i + 1],
        phase: p,
        color: colors[p],
        U,
        ang,
      });
    });

    const closure = Math.hypot(x, y);

    const xs = pts.map((p) => p.x);
    const ys = pts.map((p) => p.y);
    const minX = Math.min(...xs, 0) - 50;
    const maxX = Math.max(...xs, 0) + 50;
    const minY = Math.min(...ys, 0) - 50;
    const maxY = Math.max(...ys, 0) + 50;
    const w = maxX - minX;
    const h = maxY - minY;
    const pad = 40;
    const vbW = w + pad * 2;
    const vbH = h + pad * 2;
    const ox = -minX + pad;
    const oy = -minY + pad;

    return { segments: segs, closure, view: { vbW, vbH, ox, oy } };
  }, [measurements, scheme, voltageType]);

  const { vbW, vbH, ox, oy } = view;

  return (
    <div className="vector-diagram-container bg-slate-900 p-6 rounded-2xl shadow-2xl overflow-hidden">
      <svg
        width="100%"
        viewBox={`0 0 ${vbW} ${vbH}`}
        className="vector-svg w-full max-w-none mx-auto block"
        style={{ maxHeight: Math.min(size, 900) }}
      >
        <defs>
          {['A', 'B', 'C'].map((p) => (
            <marker
              key={p}
              id={`poly-arrow-${p}`}
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill={colors[p]} />
            </marker>
          ))}
        </defs>
        {segments.map((s, i) => {
          const x1 = s.from.x + ox;
          const y1 = s.from.y + oy;
          const x2 = s.to.x + ox;
          const y2 = s.to.y + oy;
          const mx = (x1 + x2) / 2;
          const my = (y1 + y2) / 2;
          return (
            <g key={i}>
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={s.color}
                strokeWidth={3}
                markerEnd={`url(#poly-arrow-${s.phase})`}
              />
              <text x={mx + 8} y={my} fill={s.color} fontSize="11" fontWeight="700">
                U{s.phase}
              </text>
              <text x={mx + 8} y={my + 14} fill="#cbd5e1" fontSize="9">
                {formatScalarForLabel(s.U)} В, ∠{formatAngleForLabel(s.ang)}°
              </text>
            </g>
          );
        })}
        <circle cx={ox} cy={oy} r={5} fill="#6b7280" />
        <text x={ox + 10} y={oy + 4} fill="#94a3b8" fontSize="10">
          старт
        </text>
        <text x={8} y={vbH - 12} fill="#94a3b8" fontSize="10">
          Нев’язка (замикання): {formatScalarForLabel(closure)} ум. од. — близько 0 якщо фазна симетрія
        </text>
      </svg>
    </div>
  );
}
