/**
 * Calculation utilities for VectorAnalyzer 3Ph
 */

export const degToRad = (deg) => (deg * Math.PI) / 180;
export const radToDeg = (rad) => (rad * 180) / Math.PI;

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
  // SVG coordinates: y is down, so we use -sin for up if 0 deg is right
  // But usually in electrical diagrams 0 is UP (90 deg in standard math) or 0 is RIGHT.
  // The user specified: 0, 90, 180, 270 axes.
  // Let's assume 0 is UP (A phase usually at 12 o'clock in many diagrams, but user said UA=0).
  // If UA = 0 is 0 degrees (RIGHT), then:
  return {
    x: centerX + radius * Math.cos(angleRad),
    y: centerY - radius * Math.sin(angleRad)
  };
};
