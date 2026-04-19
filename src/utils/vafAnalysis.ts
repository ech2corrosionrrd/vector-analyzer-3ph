/**
 * ВАФ-Аналізатор: опорна система U_A=0°, U_B=-120°, U_C=120°; φ — кут між U та I фази (індуктивне навантаження: I відстає від U).
 * Кут струму: ∠I_n = ∠U_n − φ_n (градуси).
 *
 * Пороги для настройки після тестів «в полі»:
 * - PHASE_SWAP: 0.35 — типовий рубіж між слабкою асиметрією навантаження та реальною помилкою фазування
 *   (чиста перестановка фаз дає |I₂|/|I₁| ≈ 1).
 * - Допуск OK по φ: за замовчуванням ±10° (старі ТН / мале навантаження); при потребі змініть VAF_PHI_OK_TOLERANCE_DEG.
 * - 2 ТС: перевірка кута між I_A та I_C відносно 60°/120° надійніша за порівняння лише модулів струму.
 */

import {
  rectFromPolar,
  rectAdd,
  polarFromRect,
  symmetricalVoltageComponents,
} from './calculations';
import { PHASE_COLORS } from './constants';
import type {
  Phase,
  ConnectionScheme,
  TransformerRatios,
  VafPhaseValues,
  AnalysisVerdict,
  VafPowerResults,
  VerdictCode,
  CtPhasePair,
  DiagramVectorItem,
  VtModel,
  MeterElements,
} from '../types/vaf';
import { describeMeteringSetupUk } from './meterConnectionCatalog';

const PHASES: Phase[] = ['A', 'B', 'C'];

/** Поріг |I₂|/|I₁| за струмами — підозра на зворотну послідовність / переплутані фази. */
export const VAF_PHASE_SWAP_RATIO_THRESHOLD = 0.35;

/** Допуск для вердикту OK по φ (активно-індуктивний режим).
 У реальних мережах кут часто «плаває» сильніше ±5° — типове поліве значення ±10°. */
export const VAF_PHI_OK_TOLERANCE_DEG = 10;

/** Допуск для кута між векторами I_A та I_C у схемі 2 ТС */
export const VAF_2TS_IA_IC_ANGLE_TOL_DEG = 22;

/** Пороги для асиметрії / помилки послідовності фаз (% від I1) */
export const VAF_ASYM_WARNING_THRESHOLD = 0.15;
export const VAF_ASYM_ERROR_THRESHOLD = 0.35;

/** Кути напруг (еталон прямої послідовності за ТЗ) */
export const VAF_VOLTAGE_ANGLES: Record<Phase, number> = { A: 0, B: -120, C: 120 };

const normDeg = (d: number | string): number => {
  const x = Number(d);
  if (!Number.isFinite(x)) return 0;
  let a = x % 360;
  if (a < 0) a += 360;
  return a;
};

const normSignedDeg = (d: number | string): number => {
  let a = Number(d);
  if (!Number.isFinite(a)) return 0;
  while (a > 180) a -= 360;
  while (a < -180) a += 360;
  return a;
};

/**
 * Обчислення загального коефіцієнта трансформації K = Ki * Ku
 */
export const computeTransformationK = (ratios: TransformerRatios): number => {
  const { IPrim, ISec, UPrim, USec } = ratios;
  const ki = ISec > 0 ? IPrim / ISec : 0;
  const ku = USec > 0 ? UPrim / USec : 0;
  return ki * ku;
};

/**
 * Комплексні струми; для 2_ТС I_B = −(I_A + I_C).
 * Якщо увімкнено режим 'generation', вектор струму зміщується на 180°.
 */
export const computeCurrentPhasors = (
  scheme: ConnectionScheme,
  Iabc: VafPhaseValues,
  phiDeg: VafPhaseValues,
  ctPhasePair: CtPhasePair = 'AC',
  energyFlow: 'consumption' | 'generation' = 'consumption'
): Record<Phase, { re: number; im: number }> => {
  const rect = {} as Record<Phase, { re: number; im: number }>;
  for (const p of PHASES) {
    const mag = Math.max(0, Number(Iabc[p]) || 0);
    const phi = Number(phiDeg[p]) || 0;
    const uAng = VAF_VOLTAGE_ANGLES[p];
    let iAng = uAng - phi;
    if (energyFlow === 'generation') {
      iAng += 180;
    }
    rect[p] = rectFromPolar(mag, iAng);
  }

  if (scheme === '2_TS') {
    if (ctPhasePair === 'AC') {
      const sum = rectAdd(rect.A, rect.C);
      rect.B = { re: -sum.re, im: -sum.im };
    } else if (ctPhasePair === 'AB') {
      const sum = rectAdd(rect.A, rect.B);
      rect.C = { re: -sum.re, im: -sum.im };
    } else if (ctPhasePair === 'BC') {
      const sum = rectAdd(rect.B, rect.C);
      rect.A = { re: -sum.re, im: -sum.im };
    }
  }

  return rect;
};

/**
 * Вектори для VectorDiagram: magnitude, angle (deg), phase, color, ...
 */
export const buildVafDiagramVectors = ({
  scheme,
  ctPhasePair = 'AC',
  Uabc,
  Iabc,
  currentPhasorsRect,
}: {
  scheme: ConnectionScheme;
  ctPhasePair?: CtPhasePair;
  Uabc: VafPhaseValues;
  Iabc: VafPhaseValues;
  currentPhasorsRect: Record<Phase, { re: number; im: number }>;
}): DiagramVectorItem[] => {
  const colors = PHASE_COLORS;
  const v: DiagramVectorItem[] = [];

  for (const p of PHASES) {
    const Um = Math.max(0, Number(Uabc[p]) || 0);
    const ang = VAF_VOLTAGE_ANGLES[p];
    v.push({
      phase: p,
      magnitude: Um,
      angle: ang,
      color: colors[p],
      strokeWidth: 3,
      isDashed: false,
      label: `U${p}`,
      caption: `${Um.toFixed(2)} В ∠${ang}°`,
    });
  }

  for (const p of PHASES) {
    const rect = currentPhasorsRect[p];
    const polar = polarFromRect(rect.re, rect.im);
    const mag = polar.mag;
    const ang = polar.deg;
    const Im =
      scheme === '2_TS' &&
      ((ctPhasePair === 'AC' && p === 'B') ||
        (ctPhasePair === 'AB' && p === 'C') ||
        (ctPhasePair === 'BC' && p === 'A'))
        ? null
        : Math.max(0, Number(Iabc[p]) || 0);

    const isCalculated =
      scheme === '2_TS' &&
      ((ctPhasePair === 'AC' && p === 'B') ||
        (ctPhasePair === 'AB' && p === 'C') ||
        (ctPhasePair === 'BC' && p === 'A'));

    const caption = isCalculated
      ? `розрах. ∠${ang.toFixed(1)}° (2 ТС)`
      : `${(Im ?? mag).toFixed(2)} А ∠${ang.toFixed(1)}°`;
    v.push({
      phase: p,
      magnitude: mag,
      angle: ang,
      color: colors[p],
      strokeWidth: 2,
      isDashed: true,
      label: `I${p}`,
      caption,
    });
  }

  return v;
};

function angleDiffDeg(a: number, b: number): number {
  return Math.abs(normSignedDeg(a - b));
}

/** Найменший кут між напрямками двох векторів, 0…180°. */
function smallestAngleBetweenDirectionsDeg(degA: number, degB: number): number {
  const a = normDeg(degA);
  const b = normDeg(degB);
  let d = Math.abs(a - b);
  if (d > 180) d = 360 - d;
  return d;
}

/**
 * Основна діагностика
 */
export function runVafDiagnostics({
  scheme,
  Iabc,
  phiDeg,
  currentPhasorsRect,
  phiToleranceDeg = VAF_PHI_OK_TOLERANCE_DEG,
  asymWarningRatioThreshold = VAF_ASYM_WARNING_THRESHOLD,
  phaseSwapRatioThreshold = VAF_ASYM_ERROR_THRESHOLD,
  twoTsIaIcAngleTolDeg = VAF_2TS_IA_IC_ANGLE_TOL_DEG,
  ctPhasePair = 'AC',
  energyFlow = 'consumption',
}: {
  scheme: ConnectionScheme;
  Iabc: VafPhaseValues;
  phiDeg: VafPhaseValues;
  currentPhasorsRect: Record<Phase, { re: number; im: number }>;
  phiToleranceDeg?: number;
  asymWarningRatioThreshold?: number;
  phaseSwapRatioThreshold?: number;
  twoTsIaIcAngleTolDeg?: number;
  ctPhasePair?: CtPhasePair;
  energyFlow?: 'consumption' | 'generation';
}): AnalysisVerdict[] {
  const out: AnalysisVerdict[] = [];

  const phasesPhi = PHASES.map((p) => {
    let raw = Number(phiDeg[p]);
    if (!Number.isFinite(raw)) raw = 0;
    if (energyFlow === 'generation') {
      raw = raw > 0 ? raw - 180 : raw + 180;
    }
    return { p, phi: raw };
  });

  let hasRev = false;
  for (const { p, phi } of phasesPhi) {
    const nd = normDeg(phi);
    if (Math.abs(nd - 180) <= 30) {
      hasRev = true;
      out.push({
        code: 'REV_I',
        message: `Помилка: переполюсовка ТС фази ${p}. Перевірте клеми И1–И2.`,
        meta: { revPhase: p },
      });
    }
  }

  const iMags = PHASES.map((p) => polarFromRect(currentPhasorsRect[p].re, currentPhasorsRect[p].im).mag);
  const iMax = Math.max(...iMags, 1e-9);

  let hasWrongU = false;
  for (const p of PHASES) {
    const iRect = currentPhasorsRect[p];
    const iPol = polarFromRect(iRect.re, iRect.im);
    
    // In 2-TS mode, we don't flag Phase B current-voltage mismatch 
    // unless there is actually a measured current there.
    if (scheme === '2_TS' && p === 'B' && (Iabc.B || 0) < 0.05) continue;
    
    if (iPol.mag < 0.02 * iMax) continue;
    for (const q of PHASES) {
      if (p === q) continue;
      const uAng = VAF_VOLTAGE_ANGLES[q];
      if (angleDiffDeg(iPol.deg, uAng) <= 10) {
        hasWrongU = true;
        out.push({
          code: 'WRONG_U',
          message: `Помилка: невідповідність фаз U та I. Струм ${p} збігається за напрямком з напругою іншої фази (U${q}).`,
          meta: { currentPhase: p, voltagePhase: q },
        });
      }
    }
  }

  const pa = polarFromRect(currentPhasorsRect.A.re, currentPhasorsRect.A.im);
  const pb = polarFromRect(currentPhasorsRect.B.re, currentPhasorsRect.B.im);
  const pc = polarFromRect(currentPhasorsRect.C.re, currentPhasorsRect.C.im);
  const iMean = (pa.mag + pb.mag + pc.mag) / 3;
  
  const seq = symmetricalVoltageComponents(
    { mag: pa.mag, deg: pa.deg },
    { mag: pb.mag, deg: pb.deg },
    { mag: pc.mag, deg: pc.deg },
  );
  
  const v1m = seq.V1.mag;
  const v2m = seq.V2.mag;
  const swapRatio = v1m > 1e-9 ? v2m / v1m : v2m > 1e-6 ? 1 : 0;

  let hasPhaseSwap = false;
  if (iMean > 1e-6) {
    if (swapRatio > phaseSwapRatioThreshold) {
      hasPhaseSwap = true;
      out.push({
        code: 'PHASE_SWAP',
        message: 'Критична помилка: зворотне чергування фаз або переплутані фази (перевага зворотної послідовності струмів).',
        meta: { phaseSwap: true },
      });
    } else if (swapRatio > asymWarningRatioThreshold) {
      out.push({
        code: 'ASYM',
        message: 'Попередження: значна асиметрія або перекіс фаз (|I₂|/|I₁| > 15%).',
        meta: { asym: true, scheme: '3_TS' },
      });
    }
  }

  // Zero-sequence current (I0) check
  if (scheme === '3_TS' && iMean > 1e-6) {
    const i0m = seq.V0.mag;
    const i0ratio = i0m / iMean;
    if (i0ratio > 0.1) {
      out.push({
        code: 'HIGH_I0',
        message: `Попередження: високий струм нульової послідовності I₀ = ${i0m.toFixed(2)} А (${(i0ratio * 100).toFixed(1)}%). Можливе замикання на землю або радикальний перекіс.`,
        meta: { asym: true },
      });
    }
  }

  if (scheme === '3_TS') {
    const ia = Math.max(0, Number(Iabc.A) || 0);
    const ib = Math.max(0, Number(Iabc.B) || 0);
    const ic = Math.max(0, Number(Iabc.C) || 0);
    const mean = (ia + ib + ic) / 3 || 1e-9;
    const spread = (Math.max(ia, ib, ic) - Math.min(ia, ib, ic)) / mean;
    if (spread > 0.65) { // Increased threshold for high load spread
      out.push({
        code: 'ASYM',
        message:
          'Увага: сильна асиметрія навантаження (струми фаз значно відрізняються). Перевірте справність ТС або баланс мережі.',
        meta: { asym: true, scheme: '3_TS' },
      });
    }
  } else {
    // Check angle between the two measured CTs
    const p1 = ctPhasePair[0] as Phase;
    const p2 = ctPhasePair[1] as Phase;
    const ph1 = polarFromRect(currentPhasorsRect[p1].re, currentPhasorsRect[p1].im);
    const ph2 = polarFromRect(currentPhasorsRect[p2].re, currentPhasorsRect[p2].im);
    
    if (ph1.mag >= 0.02 * iMax && ph2.mag >= 0.02 * iMax) {
      const delta = smallestAngleBetweenDirectionsDeg(ph1.deg, ph2.deg);
      const distToNom = Math.min(Math.abs(delta - 120), Math.abs(delta - 60));
      if (distToNom > twoTsIaIcAngleTolDeg) {
        out.push({
          code: 'ASYM',
          message: `Увага (2 ТС): кут між векторами I_${p1} та I_${p2} ≈ ${delta.toFixed(0)}° (очікувано близько 120° або 60° залежно від полярності). Можлива помилка збору «зірки» або ТС.`,
          meta: { asym: true, scheme: '2_TS' },
        });
      }
    }
  }

  const allInductive = phasesPhi.every(({ phi }) => {
    const n = normSignedDeg(phi);
    return n >= -phiToleranceDeg && n <= 90 + phiToleranceDeg;
  });

  const critical = hasRev || hasWrongU || hasPhaseSwap;
  if (!critical && allInductive) {
    out.push({
      code: 'OK',
      message: 'Підключення вірне. Навантаження активно-індуктивне.',
    });
  }

  const seen = new Set<string>();
  const unique: AnalysisVerdict[] = [];
  for (const f of out) {
    const key = `${f.code}:${f.message}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(f);
  }

  const order: Record<string, number> = { REV_I: 0, WRONG_U: 1, PHASE_SWAP: 2, HIGH_I0: 3, ASYM: 4, OK: 5 };
  unique.sort((a, b) => (order[a.code] ?? 9) - (order[b.code] ?? 9));

  return unique;
}

const mergeWireState = (prev: string, next: string): 'ok' | 'warning' | 'error' => {
  if (prev === 'error' || next === 'error') return 'error';
  if (prev === 'warning' || next === 'warning') return 'warning';
  return 'ok';
};

/**
 * Стан підсвітки проводів для схеми лічильника: струмові гілки ТС та напруги ТН по фазах.
 */
export function buildMeterWireHighlights(verdicts: AnalysisVerdict[]) {
  const ts = { A: 'ok', B: 'ok', C: 'ok' } as Record<Phase, 'ok' | 'warning' | 'error'>;
  const tv = { A: 'ok', B: 'ok', C: 'ok' } as Record<Phase, 'ok' | 'warning' | 'error'>;
  let global: 'ok' | 'warning' = 'ok';

  for (const v of verdicts) {
    if (!v || typeof v !== 'object') continue;
    if (v.code === 'REV_I' && v.meta?.revPhase) {
      const ph = v.meta.revPhase;
      ts[ph] = mergeWireState(ts[ph], 'error');
    }
    if (v.code === 'WRONG_U' && v.meta?.currentPhase && v.meta?.voltagePhase) {
      const { currentPhase: cp, voltagePhase: vp } = v.meta;
      ts[cp] = mergeWireState(ts[cp], 'error');
      tv[vp] = mergeWireState(tv[vp], 'error');
    }
    if (v.code === 'PHASE_SWAP') {
      global = 'warning';
      for (const ph of PHASES) {
        ts[ph] = mergeWireState(ts[ph], 'warning');
        tv[ph] = mergeWireState(tv[ph], 'warning');
      }
    }
    if (v.code === 'ASYM' && v.meta?.asym) {
      if (v.meta.scheme === '2_TS') {
        ts.A = mergeWireState(ts.A, 'warning');
        ts.C = mergeWireState(ts.C, 'warning');
      } else {
        for (const ph of PHASES) ts[ph] = mergeWireState(ts[ph], 'warning');
      }
    }
  }

  return { tsCurrent: ts, tnVoltage: tv, global };
}

/**
 * Підсумок по фазах для звітів і схеми (phaseA / phaseB / phaseC).
 */
export function buildPhaseAnalysisSummary(
  verdicts: AnalysisVerdict[], 
  wireHighlights: { tsCurrent: Record<Phase, string>, tnVoltage: Record<Phase, string> }
) {
  const { tsCurrent, tnVoltage } = wireHighlights;

  const pick = (ph: Phase): VerdictCode => {
    if (verdicts.some((v) => v.code === 'REV_I' && v.meta?.revPhase === ph)) return 'REV_I';
    const wuI = verdicts.some(
      (v) => v.code === 'WRONG_U' && v.meta?.currentPhase === ph,
    );
    const wuU = verdicts.some(
      (v) => v.code === 'WRONG_U' && v.meta?.voltagePhase === ph,
    );
    if (wuI || wuU) return 'WRONG_U';
    if (verdicts.some((v) => v.code === 'PHASE_SWAP')) return 'PHASE_SWAP';
    if (verdicts.some((v) => v.code === 'HIGH_I0' || v.code === 'ASYM')) return 'ASYM';
    if (tsCurrent[ph] === 'warning' || tnVoltage[ph] === 'warning') {
      if (verdicts.some((v) => v.code === 'ASYM')) return 'ASYM';
    }
    return 'OK';
  };

  return {
    phaseA: pick('A'),
    phaseB: pick('B'),
    phaseC: pick('C'),
  };
}

export function validateDateDdMmYyyy(s: string) {
  const m = String(s).trim().match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (!m) return { ok: false, error: 'Формат дати: ДД.ММ.РРРР' };
  const d = Number(m[1]);
  const mo = Number(m[2]);
  const y = Number(m[3]);
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return { ok: false, error: 'Некоректна дата' };
  const dt = new Date(y, mo - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) {
    return { ok: false, error: 'Некоректна дата' };
  }
  return { ok: true, value: `${String(d).padStart(2, '0')}.${String(mo).padStart(2, '0')}.${y}` };
}

export function buildVafTextReport({
  objectName,
  dateStr,
  voltageLevel,
  scheme,
  energyFlow,
  ratios,
  Uabc,
  Iabc,
  phiDeg,
  K,
  verdicts,
  power,
  hasNeutral,
  ctPhasePair = 'AC',
  vtModel = '3x1ph',
  meterElements = 3,
}: {
  objectName: string;
  dateStr: string;
  voltageLevel: string;
  hasNeutral: boolean;
  scheme: ConnectionScheme;
  energyFlow: 'consumption' | 'generation';
  ratios: TransformerRatios;
  Uabc: VafPhaseValues;
  Iabc: VafPhaseValues;
  phiDeg: VafPhaseValues;
  K: number;
  verdicts: AnalysisVerdict[];
  power: VafPowerResults;
  ctPhasePair?: CtPhasePair;
  vtModel?: VtModel;
  meterElements?: MeterElements;
}) {
  const { totalPpri, totalQpri, totalSpri, avgCosPhi } = power || {};
  
  const fmtP = (v: number) => {
    if (Math.abs(v) > 1000000) return (v / 1000000).toFixed(3) + ' МВт';
    return (v / 1000).toFixed(2) + ' кВт';
  };
  const fmtQ = (v: number) => {
    if (Math.abs(v) > 1000000) return (v / 1000000).toFixed(3) + ' Мвар';
    return (v / 1000).toFixed(2) + ' квар';
  };
  const fmtS = (v: number) => {
    if (Math.abs(v) > 1000000) return (v / 1000000).toFixed(3) + ' МВА';
    return (v / 1000).toFixed(2) + ' кВА';
  };

  const lines = [
    'Звіт ВАФ-Аналізатор',
    '==================',
    `Об'єкт: ${objectName || '—'}`,
    `Дата: ${dateStr}`,
    `Рівень напруги, кВ: ${voltageLevel}`,
    `Система: ${hasNeutral ? '4-провідна (з нулем)' : '3-провідна (без нуля)'}`,
    `Схема ТС: ${scheme === '3_TS' ? '3 ТС (повна)' : `2 ТС (Арон, пари фаз ${ctPhasePair[0]}–${ctPhasePair[1]})`}`,
    `Варіант підключення: ${describeMeteringSetupUk({ voltageLevel, scheme, ctPhasePair, vtModel, meterElements, hasNeutral })}`,
    `Напрямок енергії: ${energyFlow === 'generation' ? 'Генерація' : 'Споживання'}`,
    `ТС: ${ratios.IPrim}/${ratios.ISec} А; ТН: ${ratios.UPrim}/${ratios.USec} В`,
    `K = (Iперв/Iвтор)·(Uперв/Uвтор) = ${K.toFixed(4)}`,
    '',
    'Показники ВАФ (вторинні):',
    `  U_A=${Uabc.A} В, U_B=${Uabc.B} В, U_C=${Uabc.C} В`,
    `  I_A=${Iabc.A} А, I_B=${Iabc.B} А, I_C=${Iabc.C} А`,
    `  φ_A=${phiDeg.A}°, φ_B=${phiDeg.B}°, φ_C=${phiDeg.C}°`,
    '',
    'Навантаження (первинне):',
    `  ΣP = ${fmtP(totalPpri || 0)}`,
    `  ΣQ = ${fmtQ(totalQpri || 0)} (${(totalQpri || 0) >= 0 ? 'інд' : 'ємн'})`,
    `  ΣS = ${fmtS(totalSpri || 0)}`,
    `  cos φ = ${(avgCosPhi || 1).toFixed(3)}`,
    '',
    'Висновок аналізу:',
  ];
  for (const v of verdicts) {
    lines.push(`  [${v.code}] ${v.message}`);
  }
  return lines.join('\n');
}
