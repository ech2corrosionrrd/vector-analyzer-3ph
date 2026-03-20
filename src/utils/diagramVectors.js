import {
  toPhaseVoltage,
  formatScalarForLabel,
  formatAngleForLabel,
  lineVoltagesFromPhasePhasors,
  symmetricalVoltageComponents,
} from './calculations';

const colors = { A: '#facc15', B: '#22c55e', C: '#ef4444' };

/**
 * @param {'combined'|'voltage'|'current'|'line'|'power'|'sequence'} kind
 * @param {{ measurements, angleMode, scheme, voltageType, results }} ctx
 */
export function buildDiagramVectors(kind, ctx) {
  const { measurements, angleMode, scheme, voltageType, results } = ctx;
  const v = [];

  const phaseKeys = ['A', 'B', 'C'];

  const pushVoltage = (p) => {
    const Uphase = toPhaseVoltage(measurements[p].U, voltageType, scheme);
    const angleU = measurements[p].angleU;
    const uKind = voltageType === 'line' ? 'Uл' : 'Uф';
    v.push({
      phase: p,
      magnitude: Uphase,
      angle: angleU,
      color: colors[p],
      strokeWidth: 3,
      isDashed: false,
      label: `U${p}`,
      caption: `${formatScalarForLabel(measurements[p].U)} В (${uKind}), ∠${formatAngleForLabel(angleU)}°`,
    });
  };

  const pushCurrent = (p) => {
    const Uphase = toPhaseVoltage(measurements[p].U, voltageType, scheme);
    const currentScale =
      measurements[p].I > 0 ? (Uphase / measurements[p].I) * 0.5 : 40;
    const angleI =
      angleMode === 'relative'
        ? measurements[p].angleI
        : measurements[p].angleU - measurements[p].phi;
    const phiPart =
      angleMode === 'phi'
        ? `, φ=${formatAngleForLabel(measurements[p].phi)}°`
        : '';
    v.push({
      phase: p,
      magnitude: measurements[p].I * currentScale,
      angle: angleI,
      color: colors[p],
      strokeWidth: 2,
      isDashed: true,
      label: `I${p}`,
      caption: `${formatScalarForLabel(measurements[p].I)} А, ∠${formatAngleForLabel(angleI)}°${phiPart}`,
    });
  };

  if (kind === 'combined') {
    phaseKeys.forEach((p) => {
      pushVoltage(p);
      pushCurrent(p);
    });
    return v;
  }

  if (kind === 'voltage') {
    phaseKeys.forEach((p) => pushVoltage(p));
    return v;
  }

  if (kind === 'current') {
    const iMax = Math.max(...phaseKeys.map((p) => measurements[p].I), 1e-6);
    const scaleBase = 1 / iMax;
    phaseKeys.forEach((p) => {
      const angleI =
        angleMode === 'relative'
          ? measurements[p].angleI
          : measurements[p].angleU - measurements[p].phi;
      const phiPart =
        angleMode === 'phi'
          ? `, φ=${formatAngleForLabel(measurements[p].phi)}°`
          : '';
      v.push({
        phase: p,
        magnitude: measurements[p].I * scaleBase,
        angle: angleI,
        color: colors[p],
        strokeWidth: 3,
        isDashed: false,
        label: `I${p}`,
        caption: `${formatScalarForLabel(measurements[p].I)} А, ∠${formatAngleForLabel(angleI)}°${phiPart}`,
      });
    });
    return v;
  }

  if (kind === 'line') {
    const uA = {
      mag: toPhaseVoltage(measurements.A.U, voltageType, scheme),
      deg: measurements.A.angleU,
    };
    const uB = {
      mag: toPhaseVoltage(measurements.B.U, voltageType, scheme),
      deg: measurements.B.angleU,
    };
    const uC = {
      mag: toPhaseVoltage(measurements.C.U, voltageType, scheme),
      deg: measurements.C.angleU,
    };
    const line = lineVoltagesFromPhasePhasors(uA, uB, uC);
    const lineMeta = [
      { key: 'AB', phase: 'A', label: 'U_AB' },
      { key: 'BC', phase: 'B', label: 'U_BC' },
      { key: 'CA', phase: 'C', label: 'U_CA' },
    ];
    lineMeta.forEach(({ key, phase, label }) => {
      const p = line[key];
      v.push({
        phase,
        magnitude: p.mag,
        angle: p.deg,
        color: colors[phase],
        strokeWidth: 3,
        isDashed: false,
        label,
        caption: `${formatScalarForLabel(p.mag)} В, ∠${formatAngleForLabel(p.deg)}°`,
      });
    });
    return v;
  }

  if (kind === 'power') {
    const { P, Q, S } = results.total;
    const phiDeg = radToDegSafe(Math.atan2(Q, P));
    const qMag = Math.abs(Q);
    const maxPQ = Math.max(Math.abs(P), qMag, S, 1e-9);

    v.push({
      phase: 'P',
      magnitude: Math.abs(P) / maxPQ,
      angle: P >= 0 ? 0 : 180,
      color: '#3b82f6',
      strokeWidth: 3,
      isDashed: false,
      label: 'ΣP',
      caption: `${formatScalarForLabel(P / 1000)} кВт, ∠${P >= 0 ? 0 : 180}°`,
    });

    v.push({
      phase: 'Q',
      magnitude: qMag / maxPQ,
      angle: Q >= 0 ? 90 : -90,
      color: '#f97316',
      strokeWidth: 3,
      isDashed: true,
      label: 'ΣQ',
      caption:
        Q >= 0
          ? `${formatScalarForLabel(Q / 1000)} квар, 90° (ін.)`
          : `${formatScalarForLabel(Q / 1000)} квар, −90° (ємн.)`,
    });

    v.push({
      phase: 'S',
      magnitude: S / maxPQ,
      angle: phiDeg,
      color: '#a855f7',
      strokeWidth: 3,
      isDashed: false,
      label: 'ΣS',
      caption: `${formatScalarForLabel(S / 1000)} кВА, ∠${formatAngleForLabel(phiDeg)}°`,
    });

    return v;
  }

  if (kind === 'sequence') {
    const uA = {
      mag: toPhaseVoltage(measurements.A.U, voltageType, scheme),
      deg: measurements.A.angleU,
    };
    const uB = {
      mag: toPhaseVoltage(measurements.B.U, voltageType, scheme),
      deg: measurements.B.angleU,
    };
    const uC = {
      mag: toPhaseVoltage(measurements.C.U, voltageType, scheme),
      deg: measurements.C.angleU,
    };
    const seq = symmetricalVoltageComponents(uA, uB, uC);
    const maxS = Math.max(seq.V0.mag, seq.V1.mag, seq.V2.mag, 1e-9);
    const seqColors = { s0: '#94a3b8', s1: '#38bdf8', s2: '#e879f9' };
    const rows = [
      { id: 's0', polar: seq.V0, label: 'V₀', name: 'нульова' },
      { id: 's1', polar: seq.V1, label: 'V₁', name: 'пряма' },
      { id: 's2', polar: seq.V2, label: 'V₂', name: 'зворотна' },
    ];
    rows.forEach(({ id, polar, label, name }) => {
      v.push({
        phase: id,
        magnitude: polar.mag / maxS,
        angle: polar.deg,
        color: seqColors[id],
        strokeWidth: 3,
        isDashed: false,
        label,
        caption: `${formatScalarForLabel(polar.mag)} В, ∠${formatAngleForLabel(polar.deg)}° (${name})`,
      });
    });
    return v;
  }

  return v;
}

function radToDegSafe(rad) {
  return (rad * 180) / Math.PI;
}
