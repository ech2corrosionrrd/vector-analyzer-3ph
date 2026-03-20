import React, { useMemo } from 'react';
import { polarToCartesian } from '../utils/calculations';

const VectorDiagram = ({ vectors, size = 500 }) => {
  const center = size / 2;
  const padding = 40;
  const radius = center - padding;

  // Find max magnitude for scaling
  const maxMagnitude = useMemo(() => {
    return Math.max(...vectors.map(v => v.magnitude), 0.1);
  }, [vectors]);

  const scale = radius / maxMagnitude;

  // Render axes
  const renderAxes = () => {
    const axes = [0, 90, 180, 270];
    return axes.map(angle => {
      const { x, y } = polarToCartesian(radius, angle, center, center);
      const labelPos = polarToCartesian(radius + 20, angle, center, center);
      return (
        <g key={angle}>
          <line
            x1={center}
            y1={center}
            x2={x}
            y2={y}
            stroke="#4b5563"
            strokeWidth="1"
            strokeDasharray="4,4"
          />
          <text
            x={labelPos.x}
            y={labelPos.y}
            fill="#9ca3af"
            fontSize="12"
            textAnchor="middle"
            alignmentBaseline="middle"
          >
            {angle}°
          </text>
        </g>
      );
    });
  };

  // Render circles
  const renderCircles = () => {
    const counts = [0.25, 0.5, 0.75, 1];
    return counts.map(factor => (
      <circle
        key={factor}
        cx={center}
        cy={center}
        r={radius * factor}
        fill="none"
        stroke="#1f2937"
        strokeWidth="1"
      />
    ));
  };

  return (
    <div className="vector-diagram-container bg-slate-900 p-6 rounded-2xl shadow-2xl overflow-hidden flex items-center justify-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="vector-svg">
        <defs>
          <marker
            id="arrowhead-A"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="#facc15" />
          </marker>
          <marker
            id="arrowhead-B"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="#22c55e" />
          </marker>
          <marker
            id="arrowhead-C"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="#ef4444" />
          </marker>
        </defs>

        {renderCircles()}
        {renderAxes()}

        {/* Gray crosshair */}
        <line x1={0} y1={center} x2={size} y2={center} stroke="#374151" strokeWidth="0.5" />
        <line x1={center} y1={0} x2={center} y2={size} stroke="#374151" strokeWidth="0.5" />

        {vectors.map((vector, i) => {
          const { x, y } = polarToCartesian(vector.magnitude * scale, vector.angle, center, center);
          const markerId = `arrowhead-${vector.phase}`;
          return (
            <g key={i}>
              <line
                x1={center}
                y1={center}
                x2={x}
                y2={y}
                stroke={vector.color}
                strokeWidth={vector.strokeWidth}
                strokeDasharray={vector.isDashed ? '5,5' : 'none'}
                markerEnd={`url(#${markerId})`}
                className="vector-line cursor-pointer transition-all duration-300 hover:stroke-white"
              />
              {/* Optional label */}
              <text
                x={x + 10}
                y={y}
                fill={vector.color}
                fontSize="12"
                fontWeight="bold"
                className="pointer-events-none"
              >
                {vector.label}
              </text>
            </g>
          );
        })}

        <circle cx={center} cy={center} r={4} fill="#6b7280" />
      </svg>
    </div>
  );
};

export default VectorDiagram;
