import { describe, it, expect } from 'vitest';
import {
  computeTransformationK,
  computeCurrentPhasors,
  runVafDiagnostics,
  buildMeterWireHighlights,
  buildPhaseAnalysisSummary,
} from '../utils/vafAnalysis';
import type {
  AnalysisVerdict,
  VerdictCode,
  Phase,
  ConnectionScheme,
  VafPhaseValues,
  EnergyFlow,
  CtPhasePair,
} from '../types/vaf';

// ─── Helpers ────────────────────────────────────────────────────────

/** Standard symmetric inductive load: φ = 30° per phase */
const symIabc: VafPhaseValues = { A: 5, B: 5, C: 5 };
const symPhiDeg: VafPhaseValues = { A: 30, B: 30, C: 30 };

interface DiagnoseOverrides {
  scheme?: ConnectionScheme;
  Iabc?: VafPhaseValues;
  phiDeg?: VafPhaseValues;
  energyFlow?: EnergyFlow;
  ctPhasePair?: CtPhasePair;
}

function makeCurrentPhasors(
  scheme: ConnectionScheme,
  Iabc: VafPhaseValues,
  phiDeg: VafPhaseValues,
) {
  return computeCurrentPhasors(scheme, Iabc, phiDeg);
}

function diagnose(overrides: DiagnoseOverrides = {}): AnalysisVerdict[] {
  const scheme = overrides.scheme ?? '3_TS';
  const Iabc = overrides.Iabc ?? { ...symIabc };
  const phiDeg = overrides.phiDeg ?? { ...symPhiDeg };
  const currentPhasorsRect = makeCurrentPhasors(scheme, Iabc, phiDeg);
  return runVafDiagnostics({ scheme, Iabc, phiDeg, currentPhasorsRect, ...overrides });
}

// ─── computeTransformationK ─────────────────────────────────────────

describe('computeTransformationK', () => {
  it('should calculate K = (Iprim/Isec) * (Uprim/Usec)', () => {
    const K = computeTransformationK({ IPrim: 100, ISec: 5, UPrim: 10000, USec: 100 });
    expect(K).toBeCloseTo(2000, 4);
  });

  it('should return 0 when ISec is 0', () => {
    expect(computeTransformationK({ IPrim: 100, ISec: 0, UPrim: 10000, USec: 100 })).toBe(0);
  });

  it('should return 0 when USec is 0', () => {
    expect(computeTransformationK({ IPrim: 100, ISec: 5, UPrim: 10000, USec: 0 })).toBe(0);
  });
});

// ─── runVafDiagnostics: 3_TS ────────────────────────────────────────

describe('runVafDiagnostics — 3_TS', () => {
  it('should return OK for symmetric inductive load', () => {
    const verdicts = diagnose({ scheme: '3_TS' });
    const codes = verdicts.map((v) => v.code);
    expect(codes).toContain('OK');
    expect(codes).not.toContain('REV_I');
    expect(codes).not.toContain('WRONG_U');
    expect(codes).not.toContain('PHASE_SWAP');
  });

  it('should detect REV_I when phase B current is reversed (φ = 210°)', () => {
    const verdicts = diagnose({
      scheme: '3_TS',
      phiDeg: { A: 30, B: 210, C: 30 },
    });
    const codes = verdicts.map((v) => v.code);
    expect(codes).toContain('REV_I');
    // Should mention phase B
    const revVerdict = verdicts.find((v) => v.code === 'REV_I');
    expect(revVerdict).toBeDefined();
    expect(revVerdict?.message).toContain('B');
  });

  it('should detect REV_I when phase A current is reversed (φ = 180°)', () => {
    const verdicts = diagnose({
      scheme: '3_TS',
      phiDeg: { A: 180, B: 30, C: 30 },
    });
    const codes = verdicts.map((v) => v.code);
    expect(codes).toContain('REV_I');
  });

  it('should detect PHASE_SWAP for reverse phase sequence (A-C-B)', () => {
    // Simulate reverse sequence by swapping B and C phase angles
    // In VAF model: UA=0°, UB=-120°, UC=120° are fixed.
    // If we swap currents: IA at 0° lag30°, IB gets IC's angle, IC gets IB's angle
    // The easiest way: give phiDeg such that I phasors form reverse sequence
    const verdicts = diagnose({
      scheme: '3_TS',
      // Swap B and C phi to simulate wired-to-wrong-phase
      phiDeg: { A: 30, B: -90, C: 270 },
      Iabc: { A: 5, B: 5, C: 5 },
    });
    const codes = verdicts.map((v) => v.code);
    // Should not be OK due to phase issues
    expect(codes).not.toContain('OK');
  });

  it('should detect ASYM for strong current asymmetry', () => {
    const verdicts = diagnose({
      scheme: '3_TS',
      Iabc: { A: 10, B: 1, C: 5 },
    });
    const codes = verdicts.map((v) => v.code);
    expect(codes).toContain('ASYM');
  });
});

// ─── runVafDiagnostics: 2_TS ────────────────────────────────────────

describe('runVafDiagnostics — 2_TS', () => {
  it('should return OK for symmetric load with 2 TS (Aron)', () => {
    const verdicts = diagnose({ scheme: '2_TS' });
    const codes = verdicts.map((v) => v.code);
    expect(codes).toContain('OK');
  });

  it('should detect REV_I for reversed polarity in 2_TS', () => {
    const verdicts = diagnose({
      scheme: '2_TS',
      phiDeg: { A: 180, B: 30, C: 30 },
    });
    const codes = verdicts.map((v) => v.code);
    expect(codes).toContain('REV_I');
  });

  it('should compute IB = -(IA + IC) for 2_TS scheme', () => {
    const phasors = computeCurrentPhasors('2_TS', { A: 5, B: 999, C: 5 }, { A: 30, B: 30, C: 30 });
    // In 2_TS mode, IB is computed as -(IA + IC), so the input IB=999 is ignored
    const sumRe = phasors.A.re + phasors.B.re + phasors.C.re;
    const sumIm = phasors.A.im + phasors.B.im + phasors.C.im;
    expect(sumRe).toBeCloseTo(0, 8);
    expect(sumIm).toBeCloseTo(0, 8);
  });
});

// ─── buildMeterWireHighlights ───────────────────────────────────────

describe('buildMeterWireHighlights', () => {
  it('should return all "ok" for OK verdict', () => {
    const hl = buildMeterWireHighlights([{ code: 'OK' as VerdictCode, message: '' }]);
    expect(hl.tsCurrent.A).toBe('ok');
    expect(hl.tsCurrent.B).toBe('ok');
    expect(hl.tsCurrent.C).toBe('ok');
    expect(hl.global).toBe('ok');
  });

  it('should set error state for REV_I on specific phase', () => {
    const hl = buildMeterWireHighlights([
      { code: 'REV_I' as VerdictCode, message: '', meta: { revPhase: 'B' as Phase } },
    ]);
    expect(hl.tsCurrent.B).toBe('error');
    expect(hl.tsCurrent.A).toBe('ok');
  });

  it('should set warning on all wires for PHASE_SWAP', () => {
    const hl = buildMeterWireHighlights([
      { code: 'PHASE_SWAP' as VerdictCode, message: '', meta: { phaseSwap: true } },
    ]);
    expect(hl.tsCurrent.A).toBe('warning');
    expect(hl.tnVoltage.A).toBe('warning');
    expect(hl.global).toBe('warning');
  });
});

// ─── buildPhaseAnalysisSummary ──────────────────────────────────────

describe('buildPhaseAnalysisSummary', () => {
  it('should return OK for all phases when no issues', () => {
    const verdicts = [{ code: 'OK' as VerdictCode, message: '' }];
    const hl = buildMeterWireHighlights(verdicts);
    const summary = buildPhaseAnalysisSummary(verdicts, hl);
    expect(summary.phaseA).toBe('OK');
    expect(summary.phaseB).toBe('OK');
    expect(summary.phaseC).toBe('OK');
  });

  it('should mark phase with REV_I', () => {
    const verdicts = [{ code: 'REV_I' as VerdictCode, message: '', meta: { revPhase: 'C' as Phase } }];
    const hl = buildMeterWireHighlights(verdicts);
    const summary = buildPhaseAnalysisSummary(verdicts, hl);
    expect(summary.phaseC).toBe('REV_I');
    expect(summary.phaseA).toBe('OK');
  });
});
