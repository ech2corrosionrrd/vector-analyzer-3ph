import { describe, it, expect } from 'vitest';
import {
  voltageUsesVoltageTransformers,
  getSecondaryPhaseVoltageForMetering,
  describeMeteringSetupUk,
  QUICK_CONNECTION_TEMPLATES,
} from '../utils/meterConnectionCatalog';

describe('meterConnectionCatalog', () => {
  it('0.4 kV has no voltage transformers in model', () => {
    expect(voltageUsesVoltageTransformers('0.4')).toBe(false);
  });

  it('HV levels use VT in model', () => {
    expect(voltageUsesVoltageTransformers('6')).toBe(true);
    expect(voltageUsesVoltageTransformers('110')).toBe(true);
  });

  it('secondary phase voltage matches presets', () => {
    expect(getSecondaryPhaseVoltageForMetering('0.4')).toBeCloseTo(220, 3);
    expect(getSecondaryPhaseVoltageForMetering('10')).toBeCloseTo(57.7, 3);
  });

  it('describeMeteringSetupUk includes key parts', () => {
    const s = describeMeteringSetupUk({
      voltageLevel: '0.4',
      scheme: '3_TS',
      ctPhasePair: 'AC',
      vtModel: '3x1ph',
      meterElements: 3,
      hasNeutral: true,
    });
    expect(s).toContain('0,4');
    expect(s).toContain('пряма');
  });

  it('quick templates cover major combinations', () => {
    expect(QUICK_CONNECTION_TEMPLATES.length).toBeGreaterThanOrEqual(8);
    const ids = new Set(QUICK_CONNECTION_TEMPLATES.map((t) => t.id));
    expect(ids.has('lv-3ts-3el')).toBe(true);
    expect(ids.has('mv-110-3ts-ntmi')).toBe(true);
  });
});
