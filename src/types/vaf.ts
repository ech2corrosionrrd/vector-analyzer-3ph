/**
 * Type definitions for VectorAnalyzer 3Ph
 */

// ─── Core Types ─────────────────────────────────────────────────────

/** Connection scheme for current transformers */
export type ConnectionScheme = '3_TS' | '2_TS';

/** Phases involved in 2-TS (Aron) connection */
export type CtPhasePair = 'AC' | 'AB' | 'BC';

/** Meter elements count (3-element 4-wire vs 2-element 3-wire) */
export type MeterElements = 3 | 2;

/** Angle mode for classic analyzer */
export type AngleMode = 'relative' | 'phi';

/** Voltage type */
export type VoltageType = 'phase' | 'line';

/** Energy flow direction */
export type EnergyFlow = 'consumption' | 'generation';

/** Physical models */
export type CtModel = 'TOL' | 'TFZM'; // ТОЛ (Cast), ТФЗМ (Oil tank)
export type VtModel = '3x1ph' | '1x3ph'; // 3xЗНОЛ (Cast 1-ph), НТМІ (Oil 3-ph)

/** Wiring scheme */
export type Scheme = 'star' | 'delta' | 'aron';

/** Phase identifier */
export type Phase = 'A' | 'B' | 'C';

/** Load type */
export type LoadType = 'active' | 'inductive' | 'capacitive' | 'mixed';

/** App section */
export type AppSection = 'classic' | 'vaf';

// ─── Measurement Types ──────────────────────────────────────────────

/** Single phase measurement */
export interface PhaseMeasurement {
  U: number;      // Voltage (V)
  I: number;      // Current (A)
  angleU: number; // Voltage angle (degrees)
  angleI: number; // Current angle (degrees)
  phi: number;    // Angle φ between U and I (degrees)
}

/** All three phases */
export interface Measurements {
  A: PhaseMeasurement;
  B: PhaseMeasurement;
  C: PhaseMeasurement;
}

// ─── VAF Types ──────────────────────────────────────────────────────

/** VAF input: per-phase values */
export interface VafPhaseValues {
  A: number;
  B: number;
  C: number;
}

/** Transformer ratios */
export interface TransformerRatios {
  IPrim: number;
  ISec: number;
  UPrim: number;
  USec: number;
}

/** Rectangular complex number */
export interface ComplexRect {
  re: number;
  im: number;
}

/** Polar complex number */
export interface ComplexPolar {
  mag: number;
  deg: number;
}

/** Current phasors per phase (rectangular) */
export interface PhasePhasorsRect {
  A: ComplexRect;
  B: ComplexRect;
  C: ComplexRect;
}

// ─── Analysis Result Types ──────────────────────────────────────────

/** Verdict code from diagnostics */
export type VerdictCode = 'OK' | 'REV_I' | 'WRONG_U' | 'PHASE_SWAP' | 'MISSING_I' | 'ASYM' | 'HIGH_I0';

/** Verdict metadata for error visualization */
export interface VerdictMeta {
  revPhase?: Phase;
  currentPhase?: Phase;
  voltagePhase?: Phase;
  phaseSwap?: boolean;
  asym?: boolean;
  scheme?: ConnectionScheme;
}

/** Single analysis verdict */
export interface AnalysisVerdict {
  code: VerdictCode;
  message: string;
  meta?: VerdictMeta;
}

/** Wire highlight state */
export type WireState = 'ok' | 'warning' | 'error';

/** Wire highlights for meter connection schematic */
export interface WireHighlights {
  tsCurrent: Record<Phase, WireState>;
  tnVoltage: Record<Phase, WireState>;
  global: 'ok' | 'warning';
}

/** Phase analysis summary */
export interface PhaseAnalysisSummary {
  phaseA: VerdictCode;
  phaseB: VerdictCode;
  phaseC: VerdictCode;
}

// ─── Power Calculation Types ────────────────────────────────────────

/** Single phase power result */
export interface PhasePowerResult {
  P: number;      // Active power (W)
  Q: number;      // Reactive power (var)
  S: number;      // Apparent power (VA)
  cosPhi: number; // Power factor
}

/** Total power results */
export interface TotalPower {
  P: number;
  Q: number;
  S: number;
}

/** Phase sequence */
export type PhaseSequence = 'Direct' | 'Reverse' | 'Unknown';

/** Complete analysis results */
export interface AnalysisResults {
  phaseResults: Record<Phase, PhasePowerResult>;
  total: TotalPower;
  sequence: PhaseSequence;
}

/** VAF Power calc for one phase (Secondary & Primary) */
export interface VafPhasePower {
  P: number;      // Secondary Active (W)
  Q: number;      // Secondary Reactive (var)
  S: number;      // Secondary Apparent (VA)
  cosPhi: number;
  Ppri: number;   // Primary Active (W)
  Qpri: number;   // Primary Reactive (var)
  Spri: number;   // Primary Apparent (VA)
}

/** Complete VAF Power results including totals and ratios */
export interface VafPowerResults {
  phases: Record<Phase, VafPhasePower>;
  totalPsec: number;
  totalQsec: number;
  totalSsec: number;
  totalPpri: number;
  totalQpri: number;
  totalSpri: number;
  avgCosPhi: number;
  Ktotal: number;
}

// ─── Asymmetry Types ────────────────────────────────────────────────

/** Symmetrical voltage components (Fortescue) */
export interface SymmetricalComponents {
  V0: ComplexPolar;
  V1: ComplexPolar;
  V2: ComplexPolar;
}

/** Asymmetry coefficients (ГОСТ 32144-2013) */
export interface AsymmetryCoefficients {
  K2: number;      // Reverse sequence ratio
  K0: number;      // Zero sequence ratio
  K2pct: number;   // K2 in percent
  K0pct: number;   // K0 in percent
  K2ok: boolean;   // Within 2% limit
}

// ─── Diagram Types ──────────────────────────────────────────────────

/** Diagram mode identifiers */
export type DiagramMode =
  | 'combined' | 'voltage' | 'current' | 'line' | 'power' | 'sequence'
  | 'polygon' | 'powerTriangle' | 'voltageTriangle' | 'impedanceTriangle'
  | 'ossanna' | 'smith';

/** Vector for VectorDiagram component */
export interface DiagramVector {
  phase: string;
  magnitude: number;
  angle: number;
  color: string;
  strokeWidth: number;
  isDashed: boolean;
  label: string;
  caption?: string;
}

/** Diagnostic item for classic analyzer */
export interface DiagnosticItem {
  phase?: Phase;
  severity: 'error' | 'warning';
  title: string;
  message: string;
}

// ─── Preset Type ────────────────────────────────────────────────────

/** Preset configuration */
export interface Preset {
  id: string;
  label: string;
  measurements: Measurements | null;
}

// ─── Archive Types ───────────────────────────────────────────────────

/** A single item in the archive */
export interface ArchiveItem {
  id: string;
  title: string;
  date: string;
  data: UnifiedMeasurement;
}

/** Unified data structure for combined record (Vector + VAF) */
export interface UnifiedMeasurement {
  // Metadata (Report info)
  objectName: string;
  feeder: string;
  meterType: string;
  meterNumber: string;
  transformerTs: string;
  transformerTn: string;
  dateStr: string;

  // Physical Model
  voltageLevel: string;
  hasNeutral: boolean;
  scheme: ConnectionScheme;
  ratios: TransformerRatios;

  // Settings
  angleMode: AngleMode;
  voltageType: VoltageType;
  diagramMode: DiagramMode;
  frequency: string;
  loadType: LoadType;
  energyFlow: EnergyFlow;
  ctModel: CtModel;
  vtModel: VtModel;
  ctPhasePair: CtPhasePair;
  meterElements: MeterElements;

  // Measurements
  measurements: Measurements;
}

/** Classic mode data stored in the archive */
export interface ClassicArchiveData {
  angleMode: AngleMode;
  scheme: Scheme;
  voltageType: VoltageType;
  diagramMode: DiagramMode;
  frequency: string;
  loadType: LoadType;
  measurements: Measurements;
  voltageLevel: string;
  IPrim: number;
  ISec: number;
  UPrim: number;
  USec: number;
  hasNeutral: boolean;
}

// ─── VAF Export Data ─────────────────────────────────────────────────

/** Typed diagram vector item */
export interface DiagramVectorItem {
  phase: string;
  magnitude: number;
  angle: number;
  color: string;
  strokeWidth: number;
  isDashed: boolean;
  label: string;
  caption?: string;
}

/** Full data exported from VafAnalyzer for PDF and archive */
export interface VafExportData {
  objectName: string;
  feeder: string;
  meterType: string;
  meterNumber: string;
  transformerTs: string;
  transformerTn: string;
  dateStr: string;
  voltageLevel: string;
  hasNeutral: boolean;
  scheme: ConnectionScheme;
  energyFlow: EnergyFlow;
  ctPhasePair: CtPhasePair;
  ctModel?: CtModel;
  vtModel?: VtModel;
  meterElements?: MeterElements;
  ratios: TransformerRatios;
  Uabc: VafPhaseValues;
  Iabc: VafPhaseValues;
  phiDeg: VafPhaseValues;
  K: number;
  verdicts: AnalysisVerdict[];
  power: VafPowerResults;
  vectors?: DiagramVectorItem[];
}
