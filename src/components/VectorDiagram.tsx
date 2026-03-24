import { useMemo, useState } from 'react';
import { polarToCartesian } from '../utils/calculations';

interface ArrowMarkerProps {
  id: string;
  fill: string;
  mw: number;
  mh: number;
  refX: number;
  refY: number;
}

function ArrowMarker({ id, fill, mw, mh, refX, refY }: ArrowMarkerProps) {
  return (
    <marker id={id} markerWidth={mw} markerHeight={mh} refX={refX} refY={refY} orient="auto">
      <polygon points={`0 0, ${mw} ${refY}, 0 ${mh}`} fill={fill} />
    </marker>
  );
}

interface VectorItem {
  magnitude: number;
  angle: number;
  color: string;
  phase: string;
  label: string;
  caption?: string;
  strokeWidth: number;
  isDashed?: boolean;
}

interface VectorDiagramProps {
  vectors: VectorItem[];
  size?: number;
}

/** Внутрішній розмір viewBox (чим більше — тим чіткіше при масштабі на весь екран). */
const VectorDiagram = ({ vectors, size = 960 }: VectorDiagramProps) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const k = size / 500;
  const center = size / 2;
  const padding = 40 * k;
  const radius = center - padding;

  const fsAxis = Math.max(14, Math.round(12 * k));
  const fsLabel = Math.max(15, Math.round(12 * k));
  const fsCap = Math.max(12, Math.round(10.5 * k));
  const labelR = 20 * k;
  const off = 22 * k;
  const dash = `${Math.max(4, 5 * k)},${Math.max(4, 5 * k)}`;

  const mw = Math.max(11, Math.round(10 * k));
  const mh = Math.max(8, Math.round(7 * k));
  const refX = mw - 1;
  const refY = mh / 2;

  const maxMagnitude = useMemo(() => {
    return Math.max(...vectors.map((v) => v.magnitude), 0.1);
  }, [vectors]);

  const scale = radius / maxMagnitude;

  const renderAxes = () => {
    const axes = [0, 90, 180, 270];
    return axes.map((angle) => {
      const { x, y } = polarToCartesian(radius, angle, center, center);
      const labelPos = polarToCartesian(radius + labelR, angle, center, center);
      return (
        <g key={angle}>
          <line
            x1={center}
            y1={center}
            x2={x}
            y2={y}
            stroke="#4b5563"
            strokeWidth={Math.max(1, k)}
            strokeDasharray={dash}
          />
          <text
            x={labelPos.x}
            y={labelPos.y}
            fill="#9ca3af"
            fontSize={fsAxis}
            textAnchor="middle"
            alignmentBaseline="middle"
          >
            {angle}°
          </text>
        </g>
      );
    });
  };

  const renderCircles = () => {
    const counts = [0.25, 0.5, 0.75, 1];
    return counts.map((factor) => (
      <circle
        key={factor}
        cx={center}
        cy={center}
        r={radius * factor}
        fill="none"
        stroke="#1f2937"
        strokeWidth={Math.max(1, k)}
      />
    ));
  };

  return (
    <div className="vector-diagram-container bg-slate-900 p-4 sm:p-6 rounded-2xl shadow-2xl overflow-hidden w-full min-w-0 flex items-center justify-center">
      <svg
        viewBox={`0 0 ${size} ${size}`}
        preserveAspectRatio="xMidYMid meet"
        className="vector-svg w-full h-auto max-w-none"
        aria-label="Векторна діаграма"
      >
        <defs>
          <ArrowMarker id="arrowhead-A" fill="#facc15" mw={mw} mh={mh} refX={refX} refY={refY} />
          <ArrowMarker id="arrowhead-B" fill="#22c55e" mw={mw} mh={mh} refX={refX} refY={refY} />
          <ArrowMarker id="arrowhead-C" fill="#ef4444" mw={mw} mh={mh} refX={refX} refY={refY} />
          <ArrowMarker id="arrowhead-P" fill="#3b82f6" mw={mw} mh={mh} refX={refX} refY={refY} />
          <ArrowMarker id="arrowhead-Q" fill="#f97316" mw={mw} mh={mh} refX={refX} refY={refY} />
          <ArrowMarker id="arrowhead-S" fill="#a855f7" mw={mw} mh={mh} refX={refX} refY={refY} />
          <ArrowMarker id="arrowhead-s0" fill="#94a3b8" mw={mw} mh={mh} refX={refX} refY={refY} />
          <ArrowMarker id="arrowhead-s1" fill="#38bdf8" mw={mw} mh={mh} refX={refX} refY={refY} />
          <ArrowMarker id="arrowhead-s2" fill="#e879f9" mw={mw} mh={mh} refX={refX} refY={refY} />
        </defs>

        {renderCircles()}
        {renderAxes()}

        <line
          x1={0}
          y1={center}
          x2={size}
          y2={center}
          stroke="#374151"
          strokeWidth={Math.max(0.5, 0.5 * k)}
        />
        <line
          x1={center}
          y1={0}
          x2={center}
          y2={size}
          stroke="#374151"
          strokeWidth={Math.max(0.5, 0.5 * k)}
        />

        {vectors.map((vector, i) => {
          const { x, y } = polarToCartesian(vector.magnitude * scale, vector.angle, center, center);
          const markerId = `arrowhead-${vector.phase}`;
          const isHovered = hoveredIndex === i;
          
          const dx = x - center;
          const dy = y - center;
          const len = Math.hypot(dx, dy) || 1e-6;
          const px = -dy / len;
          const py = dx / len;
          const along = 0.56;
          const bx = center + dx * along;
          const by = center + dy * along;
          const side = vector.isDashed ? -1 : 1;
          const tx = bx + px * off * side;
          const ty = by + py * off * side;
          const sw = Math.max(1.5, vector.strokeWidth * (0.6 + 0.5 * k)) * (isHovered ? 1.4 : 1);

          return (
            <g 
              key={i}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
              className="transition-all duration-300"
            >
              {/* Invisible wider hit area for hover */}
              <line 
                x1={center} y1={center} x2={x} y2={y} 
                stroke="transparent" strokeWidth={24 * k} 
                className="cursor-pointer"
              />
              <line
                x1={center}
                y1={center}
                x2={x}
                y2={y}
                stroke={isHovered ? '#fff' : vector.color}
                strokeWidth={sw}
                strokeDasharray={vector.isDashed ? dash : 'none'}
                markerEnd={`url(#${markerId})`}
                className="vector-line transition-all duration-200"
                style={{ filter: isHovered ? `drop-shadow(0 0 ${6*k}px ${vector.color})` : 'none' }}
              />
              <text
                fill={isHovered ? '#fff' : vector.color}
                className="pointer-events-none select-none transition-all duration-200"
                style={{ 
                  paintOrder: 'stroke fill',
                  transform: isHovered ? `scale(${1.1})` : 'none',
                   transformOrigin: `${tx}px ${ty}px`
                }}
              >
                <tspan
                  x={tx}
                  y={ty}
                  fontSize={isHovered ? fsLabel * 1.1 : fsLabel}
                  fontWeight="700"
                  stroke="#0f172a"
                  strokeWidth={Math.max(0.4, 0.4 * k)}
                >
                  {vector.label}
                </tspan>
                {vector.caption ? (
                  <tspan
                    x={tx}
                    dy={fsCap * 1.15}
                    fontSize={isHovered ? fsCap * 1.1 : fsCap}
                    fontWeight="600"
                    fill={isHovered ? '#fff' : vector.color}
                    opacity={0.95}
                    stroke="#0f172a"
                    strokeWidth={Math.max(0.3, 0.3 * k)}
                  >
                    {vector.caption}
                  </tspan>
                ) : null}
              </text>
            </g>
          );
        })}

        {/* Floating Tooltip inside SVG */}
        {hoveredIndex !== null && vectors[hoveredIndex] && (
          <g className="pointer-events-none transition-opacity duration-300">
            <rect 
              x={20 * k} y={20 * k} width={180 * k} height={70 * k} rx={12 * k} 
              fill="#0f172a" fillOpacity={0.9} stroke={vectors[hoveredIndex].color} strokeWidth={2 * k}
              className="backdrop-blur-md"
            />
            <text x={35 * k} y={45 * k} fill="#fff" fontSize={18 * k} fontWeight="bold">
              {vectors[hoveredIndex].label}
            </text>
            <text x={35 * k} y={72 * k} fill="#94a3b8" fontSize={15 * k} fontWeight="500">
              {vectors[hoveredIndex].magnitude.toFixed(2)} @ {vectors[hoveredIndex].angle.toFixed(1)}°
            </text>
          </g>
        )}

        <circle cx={center} cy={center} r={Math.max(4, 4 * k)} fill="#6b7280" />
      </svg>
    </div>
  );
};

export default VectorDiagram;
