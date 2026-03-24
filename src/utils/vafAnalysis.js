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

const PHASES = ['A', 'B', 'C'];

/** Поріг |I₂|/|I₁| за струмами — підозра на зворотну послідовність / переплутані фази. */
export const VAF_PHASE_SWAP_RATIO_THRESHOLD = 0.35;

/**
 * Допуск для вердикту OK по φ (активно-індуктивний режим).
 * У реальних мережах кут часто «плаває» сильніше ±5° — типове поліве значення ±10°.
 */
export const VAF_PHI_OK_TOLERANCE_DEG = 10;

/**
 * Допуск для кута між векторами I_A та I_C у схемі 2 ТС (очікувані орієнтири ~120° або ~60°
 * залежно від полярності / зборки «зірки»).
 */
export const VAF_2TS_IA_IC_ANGLE_TOL_DEG = 22;

/** Кути напруг (еталон прямої послідовності за ТЗ) */
export const VAF_VOLTAGE_ANGLES = { A: 0, B: -120, C: 120 };

const normDeg = (d) => {
  const x = Number(d);
  if (!Number.isFinite(x)) return 0;
  let a = x % 360;
  if (a < 0) a += 360;
  return a;
};

const normSignedDeg = (d) => {
  let a = Number(d);
  if (!Number.isFinite(a)) return 0;
  while (a > 180) a -= 360;
  while (a < -180) a += 360;
  return a;
};

/**
 * @param {{ IPrim: number, ISec: number, UPrim: number, USec: number }} ratios
 */
export const computeTransformationK = (ratios) => {
  const { IPrim, ISec, UPrim, USec } = ratios;
  const ki = ISec > 0 ? IPrim / ISec : 0;
  const ku = USec > 0 ? UPrim / USec : 0;
  return ki * ku;
};

/**
 * Комплексні струми; для 2_ТС I_B = −(I_A + I_C).
 */
export const computeCurrentPhasors = (scheme, Iabc, phiDeg) => {
  const rect = {};
  for (const p of PHASES) {
    const mag = Math.max(0, Number(Iabc[p]) || 0);
    const phi = Number(phiDeg[p]) || 0;
    const uAng = VAF_VOLTAGE_ANGLES[p];
    const iAng = uAng - phi;
    rect[p] = rectFromPolar(mag, iAng);
  }

  if (scheme === '2_TS') {
    const sum = rectAdd(rect.A, rect.C);
    rect.B = { re: -sum.re, im: -sum.im };
  }

  return rect;
};

/**
 * Вектори для VectorDiagram: magnitude, angle (deg), phase, color, ...
 */
export const buildVafDiagramVectors = ({
  scheme,
  Uabc,
  Iabc,
  currentPhasorsRect,
}) => {
  const colors = { A: '#facc15', B: '#22c55e', C: '#ef4444' };
  const v = [];

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
    const polar = polarFromRect(currentPhasorsRect[p].re, currentPhasorsRect[p].im);
    const mag = polar.mag;
    const ang = polar.deg;
    const Im = scheme === '2_TS' && p === 'B' ? null : Math.max(0, Number(Iabc[p]) || 0);
    const caption =
      scheme === '2_TS' && p === 'B'
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

function angleDiffDeg(a, b) {
  return Math.abs(normSignedDeg(a - b));
}

/** Найменший кут між напрямками двох векторів, 0…180°. */
function smallestAngleBetweenDirectionsDeg(degA, degB) {
  const a = normDeg(degA);
  const b = normDeg(degB);
  let d = Math.abs(a - b);
  if (d > 180) d = 360 - d;
  return d;
}

/**
 * @returns {{ code: string, message: string }[]}
 */
export function runVafDiagnostics({
  scheme,
  Iabc,
  phiDeg,
  currentPhasorsRect,
  phiToleranceDeg = VAF_PHI_OK_TOLERANCE_DEG,
  phaseSwapRatioThreshold = VAF_PHASE_SWAP_RATIO_THRESHOLD,
  twoTsIaIcAngleTolDeg = VAF_2TS_IA_IC_ANGLE_TOL_DEG,
}) {
  const phiTol = phiToleranceDeg;
  const out = [];

  const phasesPhi = PHASES.map((p) => {
    const raw = Number(phiDeg[p]);
    return { p, phi: Number.isFinite(raw) ? raw : 0 };
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
    const iPol = polarFromRect(currentPhasorsRect[p].re, currentPhasorsRect[p].im);
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
  const seq = symmetricalVoltageComponents(pa, pb, pc);
  const v1m = seq.V1.mag;
  const v2m = seq.V2.mag;
  const swapRatio = v1m > 1e-9 ? v2m / v1m : v2m > 1e-6 ? 1 : 0;

  let hasPhaseSwap = false;
  if (iMean > 1e-6 && swapRatio > phaseSwapRatioThreshold) {
    hasPhaseSwap = true;
    out.push({
      code: 'PHASE_SWAP',
      message:
        'Помилка: зворотне чергування фаз або переплутані фази (ознака переваги зворотної послідовності за струмами).',
      meta: { phaseSwap: true },
    });
  }

  if (scheme === '3_TS') {
    const ia = Math.max(0, Number(Iabc.A) || 0);
    const ib = Math.max(0, Number(Iabc.B) || 0);
    const ic = Math.max(0, Number(Iabc.C) || 0);
    const mean = (ia + ib + ic) / 3 || 1e-9;
    const spread = (Math.max(ia, ib, ic) - Math.min(ia, ib, ic)) / mean;
    if (spread > 0.45) {
      out.push({
        code: 'ASYM',
        message:
          'Увага: сильна асиметрія струмів. Перевірте навантаження або справність ТС.',
        meta: { asym: true, scheme: '3_TS' },
      });
    }
  } else {
    const iaPol = polarFromRect(currentPhasorsRect.A.re, currentPhasorsRect.A.im);
    const icPol = polarFromRect(currentPhasorsRect.C.re, currentPhasorsRect.C.im);
    const iaMag = iaPol.mag;
    const icMag = icPol.mag;
    if (iaMag >= 0.02 * iMax && icMag >= 0.02 * iMax) {
      const dAc = smallestAngleBetweenDirectionsDeg(iaPol.deg, icPol.deg);
      const distToNom = Math.min(Math.abs(dAc - 120), Math.abs(dAc - 60));
      if (distToNom > twoTsIaIcAngleTolDeg) {
        out.push({
          code: 'ASYM',
          message: `Увага (2 ТС): кут між векторами I_A та I_C ≈ ${dAc.toFixed(0)}° (очікувано близько 120° або 60° залежно від полярності). Можлива помилка збору «зірки» або ТС. Модулі I_A та I_C на 10 кВ часто не збігаються — орієнтуйтеся на кут.`,
          meta: { asym: true, scheme: '2_TS' },
        });
      }
    }
  }

  const allInductive = phasesPhi.every(({ phi }) => {
    const n = normSignedDeg(phi);
    return n >= -phiTol && n <= 90 + phiTol;
  });

  const critical = hasRev || hasWrongU || hasPhaseSwap;
  if (!critical && allInductive) {
    out.push({
      code: 'OK',
      message: 'Підключення вірне. Навантаження активно-індуктивне.',
    });
  }

  const seen = new Set();
  const unique = [];
  for (const f of out) {
    const key = `${f.code}:${f.message}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(f);
  }

  const order = { REV_I: 0, WRONG_U: 1, PHASE_SWAP: 2, ASYM: 3, OK: 4 };
  unique.sort((a, b) => (order[a.code] ?? 9) - (order[b.code] ?? 9));

  return unique;
}

const mergeWireState = (prev, next) => {
  if (prev === 'error' || next === 'error') return 'error';
  if (prev === 'warning' || next === 'warning') return 'warning';
  return 'ok';
};

/**
 * Стан підсвітки проводів для схеми лічильника: струмові гілки ТС та напруги ТН по фазах.
 * @param {{ code: string, message?: string, meta?: object }[]} verdicts
 * @returns {{
 *   tsCurrent: Record<'A'|'B'|'C', 'ok'|'warning'|'error'>,
 *   tnVoltage: Record<'A'|'B'|'C', 'ok'|'warning'|'error'>,
 *   global: 'ok'|'warning'
 * }}
 */
export function buildMeterWireHighlights(verdicts) {
  const ts = { A: 'ok', B: 'ok', C: 'ok' };
  const tv = { A: 'ok', B: 'ok', C: 'ok' };
  let global = 'ok';

  for (const v of verdicts) {
    if (!v || typeof v !== 'object') continue;
    if (v.code === 'REV_I' && v.meta?.revPhase) {
      const ph = v.meta.revPhase;
      if (ts[ph] !== undefined) ts[ph] = mergeWireState(ts[ph], 'error');
    }
    if (v.code === 'WRONG_U' && v.meta?.currentPhase && v.meta?.voltagePhase) {
      const { currentPhase: cp, voltagePhase: vp } = v.meta;
      if (ts[cp] !== undefined) ts[cp] = mergeWireState(ts[cp], 'error');
      if (tv[vp] !== undefined) tv[vp] = mergeWireState(tv[vp], 'error');
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
export function buildPhaseAnalysisSummary(verdicts, wireHighlights) {
  const { tsCurrent, tnVoltage } = wireHighlights;

  const pick = (ph) => {
    if (verdicts.some((v) => v.code === 'REV_I' && v.meta?.revPhase === ph)) return 'REV_I';
    const wuI = verdicts.some(
      (v) => v.code === 'WRONG_U' && v.meta?.currentPhase === ph,
    );
    const wuU = verdicts.some(
      (v) => v.code === 'WRONG_U' && v.meta?.voltagePhase === ph,
    );
    if (wuI || wuU) return 'WRONG_U';
    if (verdicts.some((v) => v.code === 'PHASE_SWAP')) return 'PHASE_SWAP';
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

export function validateDateDdMmYyyy(s) {
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
  ratios,
  Uabc,
  Iabc,
  phiDeg,
  K,
  verdicts,
}) {
  const lines = [
    'Звіт ВАФ-Аналізатор',
    '==================',
    `Об'єкт: ${objectName || '—'}`,
    `Дата: ${dateStr}`,
    `Рівень напруги, кВ: ${voltageLevel}`,
    `Схема ТС: ${scheme === '3_TS' ? '3 ТС (повна)' : '2 ТС (Арон)'}`,
    `ТС: ${ratios.IPrim}/${ratios.ISec} А; ТН: ${ratios.UPrim}/${ratios.USec} В`,
    `K = (Iперв/Iвтор)·(Uперв/Uвтор) = ${K.toFixed(4)}`,
    '',
    'Показники ВАФ:',
    `  U_A=${Uabc.A} В, U_B=${Uabc.B} В, U_C=${Uabc.C} В`,
    `  I_A=${Iabc.A} А, I_B=${Iabc.B} А, I_C=${Iabc.C} А`,
    `  φ_A=${phiDeg.A}°, φ_B=${phiDeg.B}°, φ_C=${phiDeg.C}°`,
    '',
    'Висновок аналізу:',
  ];
  for (const v of verdicts) {
    lines.push(`  [${v.code}] ${v.message}`);
  }
  return lines.join('\n');
}
