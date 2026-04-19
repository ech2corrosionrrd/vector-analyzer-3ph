import { describe, it, expect } from 'vitest';
import { buildDiagramVectors } from '../utils/diagramVectors';
import type { AnalysisResults, Measurements } from '../types/vaf';

// ─── Helpers ────────────────────────────────────────────────────────

const makeMeasurements = (overrides: Partial<Measurements> = {}): Measurements => ({
  A: { U: 220, I: 5, angleU: 0, angleI: 330, phi: 30 },
  B: { U: 220, I: 5, angleU: 240, angleI: 210, phi: 30 },
  C: { U: 220, I: 5, angleU: 120, angleI: 90, phi: 30 },
  ...overrides,
});

const makeResults = (overrides: Partial<AnalysisResults> = {}): AnalysisResults => ({
  phaseResults: {
    A: { P: 100, Q: 50, S: 150, cosPhi: 0.866 },
    B: { P: 100, Q: 50, S: 150, cosPhi: 0.866 },
    C: { P: 100, Q: 50, S: 150, cosPhi: 0.866 },
  },
  total: { P: 300, Q: 150, S: 450 },
  sequence: 'Direct',
  ...overrides,
});

const baseCtx = {
  measurements: makeMeasurements(),
  angleMode: 'relative' as const,
  scheme: 'star' as const,
  voltageType: 'phase' as const,
  results: makeResults(),
};

// ─── Tests ──────────────────────────────────────────────────────────

describe('buildDiagramVectors — combined', () => {
  it('should return 6 vectors (3 voltage + 3 current)', () => {
    const vectors = buildDiagramVectors('combined', baseCtx);
    expect(vectors).toHaveLength(6);
  });

  it('should have 3 solid voltage vectors and 3 dashed current vectors', () => {
    const vectors = buildDiagramVectors('combined', baseCtx);
    const solid = vectors.filter((v) => !v.isDashed);
    const dashed = vectors.filter((v) => v.isDashed);
    expect(solid).toHaveLength(3);
    expect(dashed).toHaveLength(3);
  });

  it('each voltage vector label should start with U', () => {
    const vectors = buildDiagramVectors('combined', baseCtx);
    const voltages = vectors.filter((v) => !v.isDashed);
    voltages.forEach((v) => expect(v.label).toMatch(/^U/));
  });
});

describe('buildDiagramVectors — voltage', () => {
  it('should return exactly 3 vectors', () => {
    const vectors = buildDiagramVectors('voltage', baseCtx);
    expect(vectors).toHaveLength(3);
  });

  it('should use phase angles from measurements', () => {
    const vectors = buildDiagramVectors('voltage', baseCtx);
    const angles = vectors.map((v) => v.angle);
    expect(angles).toContain(0);    // phase A
    expect(angles).toContain(240);  // phase B
    expect(angles).toContain(120);  // phase C
  });
});

describe('buildDiagramVectors — current', () => {
  it('should return 3 normalized current vectors', () => {
    const vectors = buildDiagramVectors('current', baseCtx);
    expect(vectors).toHaveLength(3);
  });

  it('maximum magnitude should be 1 (normalized)', () => {
    const vectors = buildDiagramVectors('current', baseCtx);
    const maxMag = Math.max(...vectors.map((v) => v.magnitude));
    expect(maxMag).toBeCloseTo(1, 5);
  });
});

describe('buildDiagramVectors — line', () => {
  it('should return 3 line voltage vectors (AB, BC, CA)', () => {
    const vectors = buildDiagramVectors('line', baseCtx);
    expect(vectors).toHaveLength(3);
    const labels = vectors.map((v) => v.label);
    expect(labels).toContain('U_AB');
    expect(labels).toContain('U_BC');
    expect(labels).toContain('U_CA');
  });

  it('line voltage magnitude should be ~√3 × phase voltage for star', () => {
    const vectors = buildDiagramVectors('line', baseCtx);
    vectors.forEach((v) => {
      expect(v.magnitude).toBeCloseTo(220 * Math.sqrt(3), 0);
    });
  });
});

describe('buildDiagramVectors — power', () => {
  it('should return 3 vectors: ΣP, ΣQ, ΣS', () => {
    const vectors = buildDiagramVectors('power', baseCtx);
    expect(vectors).toHaveLength(3);
    const labels = vectors.map((v) => v.label);
    expect(labels).toContain('ΣP');
    expect(labels).toContain('ΣQ');
    expect(labels).toContain('ΣS');
  });

  it('ΣP vector should point at 0° for positive P', () => {
    const vectors = buildDiagramVectors('power', baseCtx);
    const pVec = vectors.find((v) => v.label === 'ΣP')!;
    expect(pVec.angle).toBe(0);
  });

  it('ΣQ vector should point at 90° for positive Q', () => {
    const vectors = buildDiagramVectors('power', baseCtx);
    const qVec = vectors.find((v) => v.label === 'ΣQ')!;
    expect(qVec.angle).toBe(90);
  });

  it('ΣQ vector should point at -90° for negative Q (capacitive)', () => {
    const ctx = { ...baseCtx, results: makeResults({ total: { P: 300, Q: -150, S: 450 } }) };
    const vectors = buildDiagramVectors('power', ctx);
    const qVec = vectors.find((v) => v.label === 'ΣQ')!;
    expect(qVec.angle).toBe(-90);
  });
});

describe('buildDiagramVectors — sequence', () => {
  it('should return 3 vectors for symmetric components', () => {
    const vectors = buildDiagramVectors('sequence', baseCtx);
    expect(vectors).toHaveLength(3);
    const labels = vectors.map((v) => v.label);
    expect(labels).toContain('V₀');
    expect(labels).toContain('V₁');
    expect(labels).toContain('V₂');
  });

  it('for perfect symmetry V1 should dominate (V0 and V2 near 0)', () => {
    const vectors = buildDiagramVectors('sequence', baseCtx);
    const v1 = vectors.find((v) => v.label === 'V₁')!;
    const v0 = vectors.find((v) => v.label === 'V₀')!;
    const v2 = vectors.find((v) => v.label === 'V₂')!;
    // V1 = 1.0 (normalized to max), others should be near 0
    expect(v1.magnitude).toBeCloseTo(1, 3);
    expect(v0.magnitude).toBeLessThan(0.01);
    expect(v2.magnitude).toBeLessThan(0.01);
  });
});

describe('buildDiagramVectors — unknown kind', () => {
  it('should return empty array for unknown diagram kind', () => {
    const vectors = buildDiagramVectors('nonexistent_kind', baseCtx);
    expect(vectors).toHaveLength(0);
  });
});
