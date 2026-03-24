/**
 * Calculation utilities for VectorAnalyzer 3Ph
 */

const SQRT3 = Math.sqrt(3);

/**
 * Переводить введену напругу у фазну для розрахунку P, Q, S.
 * Фазна (Uф): значення без змін.
 * Лінійна (Uл): зірка — Uф = Uл/√3; трикутник — Uф = Uл (Uл дорівнює фазній між фазами).
 */
export const toPhaseVoltage = (U, voltageType, scheme) => {
  if (voltageType !== 'line') return U;
  return scheme === 'star' ? U / SQRT3 : U;
};

export const degToRad = (deg) => (deg * Math.PI) / 180;
export const radToDeg = (rad) => (rad * 180) / Math.PI;

/** Кут у градусах у діапазоні [0; 360) для підписів */
export const normalizeAngleDeg = (deg) => {
  const d = Number(deg);
  if (!Number.isFinite(d)) return 0;
  return Math.round((((d % 360) + 360) % 360) * 10) / 10;
};

export const formatScalarForLabel = (value) => {
  const v = Number(value);
  if (!Number.isFinite(v)) return '0';
  if (Math.abs(v - Math.round(v)) < 1e-6) return String(Math.round(v));
  return String(Math.round(v * 100) / 100);
};

export const formatAngleForLabel = (deg) => {
  const n = normalizeAngleDeg(deg);
  return Math.abs(n - Math.round(n)) < 1e-6 ? String(Math.round(n)) : String(n);
};

/** Кут φ (U−I) для фази p, градуси */
export const phasePhiDeg = (measurements, angleMode, p) => {
  if (angleMode === 'relative') {
    return measurements[p].angleU - measurements[p].angleI;
  }
  return measurements[p].phi;
};

/** Фазор у прямокутних координатах (дійсна, уявна), кут як у polarToCartesian: від +X проти годинникової. */
export const rectFromPolar = (mag, deg) => {
  const r = degToRad(deg);
  const m = Number(mag);
  if (!Number.isFinite(m)) return { re: 0, im: 0 };
  return { re: m * Math.cos(r), im: m * Math.sin(r) };
};

export const polarFromRect = (re, im) => {
  const mag = Math.hypot(re, im);
  const deg = radToDeg(Math.atan2(im, re));
  return { mag, deg };
};

export const rectSub = (a, b) => ({ re: a.re - b.re, im: a.im - b.im });

export const rectAdd = (a, b) => ({ re: a.re + b.re, im: a.im + b.im });

const cmul = (a, b) => ({
  re: a.re * b.re - a.im * b.im,
  im: a.re * b.im + a.im * b.re,
});

const cscale = (s, p) => ({ re: s * p.re, im: s * p.im });

/** Лінійні напруги як різниця фазних фазорів: U_AB = U_A − U_B тощо (схема зірка, фазні до нейтралі). */
export const lineVoltagesFromPhasePhasors = (uA, uB, uC) => {
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

/** Симетричні складові Фортеск'ю (напруги): V0, V1, V2. */
export const symmetricalVoltageComponents = (uA, uB, uC) => {
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
 * @param {number} U - Voltage (V)
 * @param {number} I - Current (A)
 * @param {number} phi - Angle between U and I (degrees)
 */
export const calculatePhasePower = (U, I, phi) => {
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
 * @param {number} angleA - Voltage A angle
 * @param {number} angleB - Voltage B angle
 * @param {number} angleC - Voltage C angle
 * @returns {'Direct' | 'Reverse' | 'Unknown'}
 */
export const getPhaseSequence = (angleA, angleB, angleC) => {
  // Normalize angles to 0-360
  const norm = (a) => ((a % 360) + 360) % 360;
  const a = norm(angleA);
  const b = norm(angleB);
  const c = norm(angleC);

  // Expected for Direct (A-B-C): A=0, B=240, C=120 (since B lags A by 120, C lags B by 120)
  // Or A=0, B=Lag 120 (240), C=Lag 240 (120)
  
  // Calculate relative differences
  const diffAB = norm(b - a);
  const diffBC = norm(c - b);

  if (Math.abs(diffAB - 240) < 10 && Math.abs(diffBC - 240) < 10) return 'Direct'; // A -> B(240) -> C(120)
  if (Math.abs(diffAB - 120) < 10 && Math.abs(diffBC - 120) < 10) return 'Reverse'; // A -> B(120) -> C(240)
  
  return 'Unknown';
};

/**
 * Convert polar to cartesian for SVG
 * @param {number} radius 
 * @param {number} angleDeg 
 * @param {number} centerX 
 * @param {number} centerY 
 */
export const polarToCartesian = (radius, angleDeg, centerX, centerY) => {
  const angleRad = degToRad(angleDeg);
  return {
    x: centerX + radius * Math.cos(angleRad),
    y: centerY - radius * Math.sin(angleRad)
  };
};

/**
 * Calculate asymmetry coefficients (ГОСТ 32144-2013).
 * K₂ = |V₂| / |V₁| — reverse sequence coefficient (допуск ≤ 2%)
 * K₀ = |V₀| / |V₁| — zero sequence coefficient
 * @param {{ V0: {mag,deg}, V1: {mag,deg}, V2: {mag,deg} }} sym - symmetrical components
 * @returns {{ K2: number, K0: number, K2pct: number, K0pct: number, K2ok: boolean }}
 */
export const calcAsymmetryCoefficients = (sym) => {
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

