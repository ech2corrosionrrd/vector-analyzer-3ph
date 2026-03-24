import { describe, it, expect } from 'vitest';
import {
  calculatePhasePower,
  getPhaseSequence,
  toPhaseVoltage,
  degToRad,
  radToDeg,
  normalizeAngleDeg,
  rectFromPolar,
  polarFromRect,
  rectAdd,
  rectSub,
  lineVoltagesFromPhasePhasors,
  symmetricalVoltageComponents,
  calcAsymmetryCoefficients,
  polarToCartesian,
} from '../utils/calculations';

// ─── Basic Math Utilities ───────────────────────────────────────────

describe('degToRad / radToDeg', () => {
  it('should convert 180° to π', () => {
    expect(degToRad(180)).toBeCloseTo(Math.PI, 10);
  });
  it('should convert π to 180°', () => {
    expect(radToDeg(Math.PI)).toBeCloseTo(180, 10);
  });
  it('should be inverse operations', () => {
    expect(radToDeg(degToRad(45))).toBeCloseTo(45, 10);
  });
});

describe('normalizeAngleDeg', () => {
  it('should normalize negative angles to [0, 360)', () => {
    expect(normalizeAngleDeg(-90)).toBeCloseTo(270, 1);
  });
  it('should normalize angles > 360', () => {
    expect(normalizeAngleDeg(400)).toBeCloseTo(40, 1);
  });
  it('should handle NaN gracefully', () => {
    expect(normalizeAngleDeg(NaN)).toBe(0);
  });
});

// ─── Complex Arithmetic ─────────────────────────────────────────────

describe('rectFromPolar / polarFromRect', () => {
  it('should convert 1∠0° to (1, 0)', () => {
    const p = rectFromPolar(1, 0);
    expect(p.re).toBeCloseTo(1, 10);
    expect(p.im).toBeCloseTo(0, 10);
  });

  it('should convert 1∠90° to (0, 1)', () => {
    const p = rectFromPolar(1, 90);
    expect(p.re).toBeCloseTo(0, 10);
    expect(p.im).toBeCloseTo(1, 10);
  });

  it('should roundtrip correctly', () => {
    const r = rectFromPolar(5, 40);
    const p = polarFromRect(r.re, r.im);
    expect(p.mag).toBeCloseTo(5, 8);
    expect(p.deg).toBeCloseTo(40, 8);
  });
});

describe('rectAdd / rectSub', () => {
  it('should add complex numbers', () => {
    const sum = rectAdd({ re: 3, im: 4 }, { re: 1, im: -2 });
    expect(sum.re).toBe(4);
    expect(sum.im).toBe(2);
  });

  it('should subtract complex numbers', () => {
    const diff = rectSub({ re: 5, im: 3 }, { re: 2, im: 1 });
    expect(diff.re).toBe(3);
    expect(diff.im).toBe(2);
  });
});

// ─── toPhaseVoltage ─────────────────────────────────────────────────

describe('toPhaseVoltage', () => {
  it('should return U unchanged for phase type', () => {
    expect(toPhaseVoltage(220, 'phase', 'star')).toBe(220);
    expect(toPhaseVoltage(220, 'phase', 'delta')).toBe(220);
  });

  it('should divide by √3 for line voltage in star', () => {
    expect(toPhaseVoltage(380, 'line', 'star')).toBeCloseTo(380 / Math.sqrt(3), 6);
  });

  it('should return U unchanged for line voltage in delta', () => {
    expect(toPhaseVoltage(380, 'line', 'delta')).toBe(380);
  });
});

// ─── calculatePhasePower ────────────────────────────────────────────

describe('calculatePhasePower', () => {
  it('should calculate correct P, Q, S for purely resistive load (φ=0)', () => {
    const result = calculatePhasePower(220, 10, 0);
    expect(result.P).toBeCloseTo(2200, 2);
    expect(result.Q).toBeCloseTo(0, 2);
    expect(result.S).toBeCloseTo(2200, 2);
    expect(result.cosPhi).toBeCloseTo(1, 10);
  });

  it('should calculate correct P, Q, S for inductive load (φ=30°)', () => {
    const result = calculatePhasePower(220, 10, 30);
    expect(result.P).toBeCloseTo(220 * 10 * Math.cos(degToRad(30)), 2);
    expect(result.Q).toBeCloseTo(220 * 10 * Math.sin(degToRad(30)), 2);
    expect(result.S).toBeCloseTo(2200, 2);
    expect(result.cosPhi).toBeCloseTo(Math.cos(degToRad(30)), 8);
  });

  it('should return negative Q for capacitive load (φ < 0)', () => {
    const result = calculatePhasePower(220, 5, -30);
    expect(result.Q).toBeLessThan(0);
    expect(result.P).toBeGreaterThan(0);
  });

  it('should have S = U * I always', () => {
    const result = calculatePhasePower(100, 7, 45);
    expect(result.S).toBeCloseTo(700, 6);
  });
});

// ─── getPhaseSequence ───────────────────────────────────────────────

describe('getPhaseSequence', () => {
  it('should detect Direct sequence (A=0, B=240, C=120)', () => {
    expect(getPhaseSequence(0, 240, 120)).toBe('Direct');
  });

  it('should detect Reverse sequence (A=0, B=120, C=240)', () => {
    expect(getPhaseSequence(0, 120, 240)).toBe('Reverse');
  });

  it('should return Unknown for non-standard angles', () => {
    expect(getPhaseSequence(0, 0, 0)).toBe('Unknown');
  });

  it('should handle slight deviations within tolerance (±10°)', () => {
    expect(getPhaseSequence(0, 245, 118)).toBe('Direct');
  });
});

// ─── lineVoltagesFromPhasePhasors ───────────────────────────────────

describe('lineVoltagesFromPhasePhasors', () => {
  it('should compute line voltages from symmetric phase voltages', () => {
    const uA = { mag: 220, deg: 0 };
    const uB = { mag: 220, deg: 240 };
    const uC = { mag: 220, deg: 120 };
    const line = lineVoltagesFromPhasePhasors(uA, uB, uC);

    // Line voltage magnitude = Uphase * √3 for symmetric
    expect(line.AB.mag).toBeCloseTo(220 * Math.sqrt(3), 1);
    expect(line.BC.mag).toBeCloseTo(220 * Math.sqrt(3), 1);
    expect(line.CA.mag).toBeCloseTo(220 * Math.sqrt(3), 1);
  });
});

// ─── symmetricalVoltageComponents ───────────────────────────────────

describe('symmetricalVoltageComponents', () => {
  it('should have V0 ≈ 0, V2 ≈ 0 for perfectly symmetric voltages', () => {
    const uA = { mag: 220, deg: 0 };
    const uB = { mag: 220, deg: 240 };
    const uC = { mag: 220, deg: 120 };
    const sym = symmetricalVoltageComponents(uA, uB, uC);

    expect(sym.V0.mag).toBeCloseTo(0, 4);
    expect(sym.V1.mag).toBeCloseTo(220, 2);
    expect(sym.V2.mag).toBeCloseTo(0, 4);
  });

  it('should detect asymmetry in unequal voltages', () => {
    const uA = { mag: 230, deg: 0 };
    const uB = { mag: 210, deg: 240 };
    const uC = { mag: 220, deg: 120 };
    const sym = symmetricalVoltageComponents(uA, uB, uC);

    expect(sym.V1.mag).toBeGreaterThan(0);
    expect(sym.V2.mag).toBeGreaterThan(0); // Asymmetry → nonzero V2
  });
});

// ─── calcAsymmetryCoefficients (ГОСТ 32144-2013) ────────────────────

describe('calcAsymmetryCoefficients', () => {
  it('should return K2 ≈ 0% and K0 ≈ 0% for symmetric system', () => {
    const uA = { mag: 220, deg: 0 };
    const uB = { mag: 220, deg: 240 };
    const uC = { mag: 220, deg: 120 };
    const sym = symmetricalVoltageComponents(uA, uB, uC);
    const asym = calcAsymmetryCoefficients(sym);

    expect(asym.K2pct).toBeCloseTo(0, 2);
    expect(asym.K0pct).toBeCloseTo(0, 2);
    expect(asym.K2ok).toBe(true);
  });

  it('should detect K2 > 2% for significantly unequal voltages', () => {
    const uA = { mag: 250, deg: 0 };
    const uB = { mag: 190, deg: 240 };
    const uC = { mag: 220, deg: 120 };
    const sym = symmetricalVoltageComponents(uA, uB, uC);
    const asym = calcAsymmetryCoefficients(sym);

    expect(asym.K2pct).toBeGreaterThan(2);
    expect(asym.K2ok).toBe(false);
  });

  it('should always have K2 and K0 non-negative', () => {
    const sym = symmetricalVoltageComponents(
      { mag: 100, deg: 0 },
      { mag: 80, deg: 250 },
      { mag: 110, deg: 110 },
    );
    const asym = calcAsymmetryCoefficients(sym);
    expect(asym.K2).toBeGreaterThanOrEqual(0);
    expect(asym.K0).toBeGreaterThanOrEqual(0);
  });
});

// ─── polarToCartesian ───────────────────────────────────────────────

describe('polarToCartesian', () => {
  it('should place 0° to the right', () => {
    const p = polarToCartesian(100, 0, 200, 200);
    expect(p.x).toBeCloseTo(300, 4);
    expect(p.y).toBeCloseTo(200, 4);
  });

  it('should place 90° upward (negative y in SVG)', () => {
    const p = polarToCartesian(100, 90, 200, 200);
    expect(p.x).toBeCloseTo(200, 4);
    expect(p.y).toBeCloseTo(100, 4);
  });
});
