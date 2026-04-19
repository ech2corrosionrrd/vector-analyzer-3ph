/**
 * Calculation utilities for VectorAnalyzer 3Ph
 */

import type { AngleMode, Measurements, Phase, Scheme, VoltageType, VafPhaseValues } from '../types/vaf';

const SQRT3 = Math.sqrt(3);

export interface ComplexRect {
  re: number;
  im: number;
}

export interface ComplexPolar {
  mag: number;
  deg: number;
}

export interface LineVoltages {
  AB: ComplexPolar;
  BC: ComplexPolar;
  CA: ComplexPolar;
}

export interface SymmetricalComponents {
  V0: ComplexPolar;
  V1: ComplexPolar;
  V2: ComplexPolar;
}

export interface PhasePowerResult {
  P: number;
  Q: number;
  S: number;
  cosPhi: number;
}

export interface AsymmetryCoefficients {
  K2: number;
  K0: number;
  K2pct: number;
  K0pct: number;
  K2ok: boolean;
}

/**
 * Переводить введену напругу у фазну для розрахунку P, Q, S.
 * Фазна (Uф): значення без змін.
 * Лінійна (Uл): зірка — Uф = Uл/√3; трикутник — Uф = Uл (Uл дорівнює фазній між фазами).
 */
export const toPhaseVoltage = (U: number, voltageType: VoltageType, scheme: Scheme): number => {
  if (voltageType !== 'line') return U;
  return scheme === 'star' ? U / SQRT3 : U;
};

export const degToRad = (deg: number): number => (deg * Math.PI) / 180;
export const radToDeg = (rad: number): number => (rad * 180) / Math.PI;

/** Кут у градусах у діапазоні [0; 360) для підписів */
export const normalizeAngleDeg = (deg: number): number => {
  const d = Number(deg);
  if (!Number.isFinite(d)) return 0;
  return Math.round((((d % 360) + 360) % 360) * 10) / 10;
};

export const formatScalarForLabel = (value: number): string => {
  const v = Number(value);
  if (!Number.isFinite(v)) return '0';
  if (Math.abs(v - Math.round(v)) < 1e-6) return String(Math.round(v));
  return String(Math.round(v * 100) / 100);
};

export const formatAngleForLabel = (deg: number): string => {
  const n = normalizeAngleDeg(deg);
  return Math.abs(n - Math.round(n)) < 1e-6 ? String(Math.round(n)) : String(n);
};

/** Кут φ (U−I) для фази p, градуси */
export const phasePhiDeg = (
  measurements: Record<Phase, { angleU: number; angleI: number; phi: number }>,
  angleMode: AngleMode,
  p: Phase,
): number => {
  if (angleMode === 'relative') {
    return measurements[p].angleU - measurements[p].angleI;
  }
  return measurements[p].phi;
};

/** Ефективний φ (U−I) по всіх фазах — узгоджено з режимом «відносні кути» / «φ». */
export const measurementsToPhiDeg = (measurements: Measurements, angleMode: AngleMode): VafPhaseValues => ({
  A: phasePhiDeg(measurements, angleMode, 'A'),
  B: phasePhiDeg(measurements, angleMode, 'B'),
  C: phasePhiDeg(measurements, angleMode, 'C'),
});

/** Фазор у прямокутних координатах (дійсна, уявна), кут як у polarToCartesian: від +X проти годинникової. */
export const rectFromPolar = (mag: number, deg: number): ComplexRect => {
  const r = degToRad(deg);
  const m = Number(mag);
  if (!Number.isFinite(m)) return { re: 0, im: 0 };
  return { re: m * Math.cos(r), im: m * Math.sin(r) };
};

export const polarFromRect = (re: number, im: number): ComplexPolar => {
  const mag = Math.hypot(re, im);
  const deg = radToDeg(Math.atan2(im, re));
  return { mag, deg };
};

export const rectSub = (a: ComplexRect, b: ComplexRect): ComplexRect => ({ re: a.re - b.re, im: a.im - b.im });

export const rectAdd = (a: ComplexRect, b: ComplexRect): ComplexRect => ({ re: a.re + b.re, im: a.im + b.im });

const cmul = (a: ComplexRect, b: ComplexRect): ComplexRect => ({
  re: a.re * b.re - a.im * b.im,
  im: a.re * b.im + a.im * b.re,
});

const cscale = (s: number, p: ComplexRect): ComplexRect => ({ re: s * p.re, im: s * p.im });

/** Лінійні напруги як різниця фазних фазорів: U_AB = U_A − U_B тощо (схема зірка, фазні до нейтралі). */
export const lineVoltagesFromPhasePhasors = (
  uA: ComplexPolar,
  uB: ComplexPolar,
  uC: ComplexPolar,
): LineVoltages => {
  const a = rectFromPolar(uA.mag, uA.deg);
  const b = rectFromPolar(uB.mag, uB.deg);
  const c = rectFromPolar(uC.mag, uC.deg);
  const ab = rectSub(a, b);
  const bc = rectSub(b, c);
  const ca = rectSub(c, a);
  return {
    AB: polarFromRect(ab.re, ab.im),
    BC: polarFromRect(bc.re, bc.im),
    CA: polarFromRect(ca.re, ca.im),
  };
};

/**
 * Симетричні складові Фортеск'ю (напруги): V0, V1, V2.
 * Приймає фазори у полярній формі {mag, deg}.
 */
export const symmetricalVoltageComponents = (
  uA: ComplexPolar,
  uB: ComplexPolar,
  uC: ComplexPolar,
): SymmetricalComponents => {
  const Va = rectFromPolar(uA.mag, uA.deg);
  const Vb = rectFromPolar(uB.mag, uB.deg);
  const Vc = rectFromPolar(uC.mag, uC.deg);
  const omega = rectFromPolar(1, 120);
  const omega2 = rectFromPolar(1, 240);
  const V0 = cscale(
    1 / 3,
    rectAdd(Va, rectAdd(Vb, Vc)),
  );
  const V1 = cscale(
    1 / 3,
    rectAdd(Va, rectAdd(cmul(omega, Vb), cmul(omega2, Vc))),
  );
  const V2 = cscale(
    1 / 3,
    rectAdd(Va, rectAdd(cmul(omega2, Vb), cmul(omega, Vc))),
  );
  return {
    V0: polarFromRect(V0.re, V0.im),
    V1: polarFromRect(V1.re, V1.im),
    V2: polarFromRect(V2.re, V2.im),
  };
};

/**
 * Calculate power and other metrics for a single phase
 * @param U - Voltage (V)
 * @param I - Current (A)
 * @param phi - Angle between U and I (degrees)
 */
export const calculatePhasePower = (U: number, I: number, phi: number): PhasePowerResult => {
  const phiRad = degToRad(phi);
  const cosPhi = Math.cos(phiRad);
  const sinPhi = Math.sin(phiRad);

  const P = U * I * cosPhi;
  const Q = U * I * sinPhi;
  const S = U * I;

  return { P, Q, S, cosPhi };
};

/**
 * Determine phase sequence
 * @param angleA - Voltage A angle (degrees)
 * @param angleB - Voltage B angle (degrees)
 * @param angleC - Voltage C angle (degrees)
 * @returns 'Direct' | 'Reverse' | 'Unknown'
 */
export const getPhaseSequence = (
  angleA: number,
  angleB: number,
  angleC: number,
): 'Direct' | 'Reverse' | 'Unknown' => {
  // Normalize angles to 0-360
  const norm = (a: number): number => ((a % 360) + 360) % 360;
  const a = norm(angleA);
  const b = norm(angleB);
  const c = norm(angleC);

  // Expected for Direct (A-B-C): A=0, B=240, C=120 (since B lags A by 120, C lags B by 120)
  const diffAB = norm(b - a);
  const diffBC = norm(c - b);

  if (Math.abs(diffAB - 240) < 10 && Math.abs(diffBC - 240) < 10) return 'Direct';
  if (Math.abs(diffAB - 120) < 10 && Math.abs(diffBC - 120) < 10) return 'Reverse';

  return 'Unknown';
};

/**
 * Convert polar to cartesian for SVG
 */
export const polarToCartesian = (
  radius: number,
  angleDeg: number,
  centerX: number,
  centerY: number,
): { x: number; y: number } => {
  const angleRad = degToRad(angleDeg);
  return {
    x: centerX + radius * Math.cos(angleRad),
    y: centerY - radius * Math.sin(angleRad),
  };
};

/**
 * Calculate asymmetry coefficients (ГОСТ 32144-2013).
 * K₂ = |V₂| / |V₁| — reverse sequence coefficient (допуск ≤ 2%)
 * K₀ = |V₀| / |V₁| — zero sequence coefficient
 */
export const calcAsymmetryCoefficients = (sym: SymmetricalComponents): AsymmetryCoefficients => {
  const v1 = sym.V1.mag || 1e-12;
  const K2 = sym.V2.mag / v1;
  const K0 = sym.V0.mag / v1;
  return {
    K2,
    K0,
    K2pct: K2 * 100,
    K0pct: K0 * 100,
    K2ok: K2 <= 0.02, // ГОСТ 32144-2013: допуск 2%
  };
};
