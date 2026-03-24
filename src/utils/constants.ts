/**
 * Shared constants for VectorAnalyzer 3Ph
 */

/** Phase colors used across all diagram components */
export const PHASE_COLORS = {
  A: '#facc15',
  B: '#22c55e',
  C: '#ef4444',
};

/** Power / sequence component colors */
export const COMPONENT_COLORS = {
  P: '#3b82f6',
  Q: '#f97316',
  S: '#a855f7',
  s0: '#94a3b8',
  s1: '#38bdf8',
  s2: '#e879f9',
};

/** Standard network frequencies */
export const FREQUENCIES = [
  { value: '50', label: '50 Гц' },
  { value: '60', label: '60 Гц' },
];

/** Load type options */
export const LOAD_TYPES = [
  { value: 'mixed', label: 'Змішане' },
  { value: 'active', label: 'Активне (R)' },
  { value: 'inductive', label: 'Індуктивне (R-L)' },
  { value: 'capacitive', label: 'Ємнісне (R-C)' },
];

/** Preset configurations for quick scenario setup */
export const PRESETS = [
  {
    id: 'custom',
    label: '— Власні значення —',
    measurements: null,
  },
  {
    id: 'sym220',
    label: 'Симетрична Y 220/380В',
    measurements: {
      A: { U: 220, I: 5, angleU: 0, angleI: 330, phi: 30 },
      B: { U: 220, I: 5, angleU: 240, angleI: 210, phi: 30 },
      C: { U: 220, I: 5, angleU: 120, angleI: 90, phi: 30 },
    },
  },
  {
    id: 'openA',
    label: 'Обрив фази A',
    measurements: {
      A: { U: 0, I: 0, angleU: 0, angleI: 0, phi: 0 },
      B: { U: 220, I: 8, angleU: 240, angleI: 210, phi: 30 },
      C: { U: 220, I: 8, angleU: 120, angleI: 90, phi: 30 },
    },
  },
  {
    id: 'skew',
    label: 'Перекос навантаження',
    measurements: {
      A: { U: 228, I: 12, angleU: 0, angleI: 345, phi: 15 },
      B: { U: 215, I: 3, angleU: 238, angleI: 198, phi: 40 },
      C: { U: 222, I: 7, angleU: 121, angleI: 86, phi: 35 },
    },
  },
  {
    id: 'capacitive',
    label: 'Ємнісний cos φ (КБ)',
    measurements: {
      A: { U: 220, I: 6, angleU: 0, angleI: 25, phi: -25 },
      B: { U: 220, I: 6, angleU: 240, angleI: 265, phi: -25 },
      C: { U: 220, I: 6, angleU: 120, angleI: 145, phi: -25 },
    },
  },
  {
    id: 'revPhaseB',
    label: 'Перекинута полярність ТС (фаза B)',
    measurements: {
      A: { U: 220, I: 5, angleU: 0, angleI: 330, phi: 30 },
      B: { U: 220, I: 5, angleU: 240, angleI: 30, phi: 210 },
      C: { U: 220, I: 5, angleU: 120, angleI: 90, phi: 30 },
    },
  },
];
