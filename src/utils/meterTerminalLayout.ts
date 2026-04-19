/**
 * Спільна геометрія клемника лічильника (11 клем) та ВПК для вирівнювання проводів.
 */

export const TERM_START_X = 110;
export const METER_TERM_W = 52;
export const METER_TERM_GAP = 4;
export const METER_GROUP_GAP = 14;
/** Відступ пластини як у TerminalBlock (rect x=-PAD, width=W+2*PAD) */
export const METER_PLATE_PAD = 12;

export function mTermLeftX(n: number): number {
  const groupIdx = n <= 3 ? 0 : n <= 6 ? 1 : n <= 9 ? 2 : 3;
  const posInGroup = n <= 9 ? ((n - 1) % 3) : n - 10;
  return (
    TERM_START_X +
    groupIdx * (3 * (METER_TERM_W + METER_TERM_GAP) + METER_GROUP_GAP) +
    posInGroup * (METER_TERM_W + METER_TERM_GAP)
  );
}

export function mTermCenterX(n: number): number {
  return mTermLeftX(n) + METER_TERM_W / 2;
}

/** Ліва межа клеми в координатах групи лічильника (x=0 на translate(TERM_START_X)) */
export function meterTerminalLocalLeftX(n: number): number {
  return mTermLeftX(n) - TERM_START_X;
}

export function meterBlockInnerWidth(): number {
  return (
    3 * (3 * (METER_TERM_W + METER_TERM_GAP) + METER_GROUP_GAP) +
    2 * (METER_TERM_W + METER_TERM_GAP) -
    METER_TERM_GAP
  );
}

export function meterPlateOuterWidth(): number {
  return meterBlockInnerWidth() + 2 * METER_PLATE_PAD;
}

/**
 * Центр клеми ВПК: номери 1…13 зліва направо (як на типовій колодці).
 * На фазу: 1=И1, 2=проміжна, 3=U, 4=И2 (координати строго зростають у межах фази).
 * Провідність до лічильника: И1→кл.1/4/7, U→2/5/8, И2→3/6/9; 13→N.
 */
export function ikkTerminalCenterX(id: number): number {
  const W = meterBlockInnerWidth();
  const count = 13;
  const step = W / (count - 1);
  return TERM_START_X + (id - 1) * step;
}

/** Локальна X всередині групи translate(TERM_START_X, IKK_Y) */
export function ikkTerminalLocalX(id: number): number {
  return ikkTerminalCenterX(id) - TERM_START_X;
}

/** Верх проводки «вторинка → ВПК» (абсолютна Y), під заголовком пластини */
export function ikkWireTopY(ikkY: number): number {
  return ikkY + 72;
}

/** Низ ВПК — після стійок клем (абсолютна Y) */
export function ikkWireBottomY(ikkY: number): number {
  return ikkY + 255;
}
