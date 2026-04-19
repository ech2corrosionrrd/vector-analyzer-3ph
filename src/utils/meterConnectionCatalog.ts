/**
 * Каталог варіантів обліку: рівні напруги, ТН/без ТН, схеми ТС, тип лічильника.
 * Використовується для підписів, перевірок і швидких шаблонів у ВАФ.
 */

import type { ConnectionScheme, CtPhasePair, MeterElements, VtModel } from '../types/vaf';
import { VOLTAGE_LEVELS, VOLTAGE_PRESETS, type VoltagePreset } from './ratios';

export { VOLTAGE_LEVELS };

/** Чи потрібні трансформатори напруги (ТН) на вторинці лічильника для цього рівня. */
export function voltageUsesVoltageTransformers(voltageLevelKey: string): boolean {
  return voltageLevelKey !== '0.4';
}

export function getVoltagePreset(level: string): VoltagePreset | undefined {
  return VOLTAGE_PRESETS[level];
}

export function getSecondaryPhaseVoltageForMetering(level: string): number {
  return VOLTAGE_PRESETS[level]?.Usec ?? 57.7;
}

export function getVoltageLevelLabelUk(level: string): string {
  return VOLTAGE_LEVELS.find((x) => x.value === level)?.label ?? `${level} кВ`;
}

/** Текст для колонки «Норма» (напруга на клемі U) у таблиці клем. */
export function getExpectedVoltageAtMeterTerminalsUk(voltageLevelKey: string): string {
  const u = getSecondaryPhaseVoltageForMetering(voltageLevelKey);
  if (!voltageUsesVoltageTransformers(voltageLevelKey)) {
    return `≈ ${u.toFixed(1)} В (Uф, вторинка — пряма)`;
  }
  return `≈ ${u.toFixed(1)} В (Uвт. ф. після ТН)`;
}

/** Підпис кола напруги для схем (умовний). */
export function getVoltageCircuitShortLabelUk(voltageLevelKey: string): string {
  if (!voltageUsesVoltageTransformers(voltageLevelKey)) return 'без ТН (пряме Uф)';
  return 'через ТН';
}

export function describeMeteringSetupUk(params: {
  voltageLevel: string;
  scheme: ConnectionScheme;
  ctPhasePair: CtPhasePair;
  vtModel: VtModel;
  meterElements: MeterElements;
  hasNeutral: boolean;
}): string {
  const { voltageLevel, scheme, ctPhasePair, vtModel, meterElements, hasNeutral } = params;
  const lvl = getVoltageLevelLabelUk(voltageLevel);
  let vt: string;
  if (!voltageUsesVoltageTransformers(voltageLevel)) {
    vt = 'напруга пряма (без ТН)';
  } else {
    vt = vtModel === '1x3ph' ? 'ТН 3-ф (НТМІ / НАМІ)' : 'ТН 1-ф × 3 (ЗНОЛ)';
  }
  const ts = scheme === '3_TS' ? '3 ТС' : `2 ТС (фази ${ctPhasePair[0]}–${ctPhasePair[1]})`;
  const el = meterElements === 3 ? '3-ел (4-пров.)' : '2-ел (3-пров.)';
  const wire = hasNeutral ? 'з нулем (4W)' : '3-пров. лінія';
  return `${lvl} · ${vt} · ${ts} · ${el} · ${wire}`;
}

export interface QuickConnectionTemplate {
  id: string;
  label: string;
  description: string;
  voltageLevel: string;
  scheme: ConnectionScheme;
  ctPhasePair: CtPhasePair;
  vtModel: VtModel;
  meterElements: MeterElements;
  hasNeutral: boolean;
}

/**
 * Типові шаблони (не вичерпують усі комбінації — повний набір збирається з селекторів панелі).
 */
export const QUICK_CONNECTION_TEMPLATES: QuickConnectionTemplate[] = [
  {
    id: 'lv-3ts-3el',
    label: '0,4 кВ — 3 ТС, 3-ел, з нулем',
    description: 'Пряме Uф, три трансформатори струму, трифазний 4-провідний лічильник.',
    voltageLevel: '0.4',
    scheme: '3_TS',
    ctPhasePair: 'AC',
    vtModel: '3x1ph',
    meterElements: 3,
    hasNeutral: true,
  },
  {
    id: 'lv-2ts-ac-2el',
    label: '0,4 кВ — 2 ТС (A–C), 2-ел',
    description: 'Схема з двома ТС (Арон), трипровідна лінія, 2-ел лічильник.',
    voltageLevel: '0.4',
    scheme: '2_TS',
    ctPhasePair: 'AC',
    vtModel: '3x1ph',
    meterElements: 2,
    hasNeutral: false,
  },
  {
    id: 'lv-2ts-ab-2el',
    label: '0,4 кВ — 2 ТС (A–B), 2-ел',
    description: 'Дві фази струму A–B, типово для обраної пари ТС.',
    voltageLevel: '0.4',
    scheme: '2_TS',
    ctPhasePair: 'AB',
    vtModel: '3x1ph',
    meterElements: 2,
    hasNeutral: false,
  },
  {
    id: 'lv-2ts-bc-2el',
    label: '0,4 кВ — 2 ТС (B–C), 2-ел',
    description: 'Дві фази струму B–C.',
    voltageLevel: '0.4',
    scheme: '2_TS',
    ctPhasePair: 'BC',
    vtModel: '3x1ph',
    meterElements: 2,
    hasNeutral: false,
  },
  {
    id: 'mv-6-3ts-znol',
    label: '6 кВ — 3 ТС, ЗНОЛ ×3, 3-ел',
    description: 'Три однофазні ТН, три ТС, 3-ел лічильник.',
    voltageLevel: '6',
    scheme: '3_TS',
    ctPhasePair: 'AC',
    vtModel: '3x1ph',
    meterElements: 3,
    hasNeutral: true,
  },
  {
    id: 'mv-6-3ts-ntmi',
    label: '6 кВ — 3 ТС, НТМІ, 3-ел',
    description: 'Один трифазний ТН (НТМІ), три ТС.',
    voltageLevel: '6',
    scheme: '3_TS',
    ctPhasePair: 'AC',
    vtModel: '1x3ph',
    meterElements: 3,
    hasNeutral: true,
  },
  {
    id: 'mv-10-2ts-ac',
    label: '10 кВ — 2 ТС (A–C), ЗНОЛ',
    description: 'ВН з ТН і двома ТС за схемою Арона.',
    voltageLevel: '10',
    scheme: '2_TS',
    ctPhasePair: 'AC',
    vtModel: '3x1ph',
    meterElements: 2,
    hasNeutral: false,
  },
  {
    id: 'mv-35-3ts',
    label: '35 кВ — 3 ТС, ЗНОЛ, 3-ел',
    description: 'Підстанційний рівень, повний трифазний облік.',
    voltageLevel: '35',
    scheme: '3_TS',
    ctPhasePair: 'AC',
    vtModel: '3x1ph',
    meterElements: 3,
    hasNeutral: true,
  },
  {
    id: 'mv-110-3ts-ntmi',
    label: '110 кВ — 3 ТС, НТМІ, 3-ел',
    description: 'ВН облік з трифазним ТН.',
    voltageLevel: '110',
    scheme: '3_TS',
    ctPhasePair: 'AC',
    vtModel: '1x3ph',
    meterElements: 3,
    hasNeutral: true,
  },
];
