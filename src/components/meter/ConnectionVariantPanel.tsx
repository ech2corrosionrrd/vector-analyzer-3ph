/**
 * Панель вибору варіантів підключення лічильника (рівень напруги, ТС, ТН, тип ЛМ).
 */

import type {
  ConnectionScheme,
  CtPhasePair,
  EnergyFlow,
  MeterElements,
  TransformerRatios,
  VtModel,
} from '../../types/vaf';
import {
  VOLTAGE_LEVELS,
  QUICK_CONNECTION_TEMPLATES,
  describeMeteringSetupUk,
  voltageUsesVoltageTransformers,
  getVoltagePreset,
} from '../../utils/meterConnectionCatalog';

interface ConnectionVariantPanelProps {
  voltageLevel: string;
  onVoltageLevelChange: (level: string, ratios: TransformerRatios) => void;
  scheme: ConnectionScheme;
  onSchemeChange: (s: ConnectionScheme) => void;
  ctPhasePair: CtPhasePair;
  onCtPhasePairChange: (p: CtPhasePair) => void;
  vtModel: VtModel;
  onVtModelChange: (v: VtModel) => void;
  meterElements: MeterElements;
  onMeterElementsChange: (m: MeterElements) => void;
  hasNeutral: boolean;
  onHasNeutralChange: (v: boolean) => void;
  energyFlow: EnergyFlow;
  onEnergyFlowChange: (e: EnergyFlow) => void;
}

export function ConnectionVariantPanel({
  voltageLevel,
  onVoltageLevelChange,
  scheme,
  onSchemeChange,
  ctPhasePair,
  onCtPhasePairChange,
  vtModel,
  onVtModelChange,
  meterElements,
  onMeterElementsChange,
  hasNeutral,
  onHasNeutralChange,
  energyFlow,
  onEnergyFlowChange,
}: ConnectionVariantPanelProps) {
  const summary = describeMeteringSetupUk({
    voltageLevel,
    scheme,
    ctPhasePair,
    vtModel,
    meterElements,
    hasNeutral,
  });
  const showVt = voltageUsesVoltageTransformers(voltageLevel);
  const isTwoTs = scheme === '2_TS';
  const selectCls =
    'bg-slate-900 border border-slate-700 hover:border-slate-600 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 rounded-lg px-2 py-2 text-xs text-slate-200 transition-colors';

  const applyTemplate = (id: string) => {
    const t = QUICK_CONNECTION_TEMPLATES.find((x) => x.id === id);
    if (!t) return;
    const preset = getVoltagePreset(t.voltageLevel);
    if (!preset) return;
    onVoltageLevelChange(t.voltageLevel, {
      IPrim: preset.IPrim,
      ISec: preset.ISec,
      UPrim: preset.UPrim,
      USec: preset.USec,
    });
    onSchemeChange(t.scheme);
    onCtPhasePairChange(t.ctPhasePair);
    onVtModelChange(t.vtModel);
    onMeterElementsChange(t.meterElements);
    onHasNeutralChange(t.hasNeutral);
  };

  return (
    <div className="rounded-2xl border border-slate-800/80 bg-slate-950/40 p-4 space-y-4">
      <div className="flex flex-col gap-1">
        <h4 className="text-[10px] uppercase tracking-widest font-black text-slate-500">Варіанти підключення лічильника</h4>
        <p className="text-[11px] text-slate-400 leading-snug border-l-2 border-cyan-500/50 pl-2">{summary}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-[10px] uppercase font-bold text-slate-500">Рівень напруги</span>
          <select
            className={selectCls}
            value={voltageLevel}
            onChange={(e) => {
              const level = e.target.value;
              const preset = getVoltagePreset(level);
              if (!preset) return;
              onVoltageLevelChange(level, {
                IPrim: preset.IPrim,
                ISec: preset.ISec,
                UPrim: preset.UPrim,
                USec: preset.USec,
              });
            }}
          >
            {VOLTAGE_LEVELS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-[10px] uppercase font-bold text-slate-500">Схема ТС</span>
          <select
            className={selectCls}
            value={scheme}
            onChange={(e) => onSchemeChange(e.target.value as ConnectionScheme)}
          >
            <option value="3_TS">3 трансформатори струму (3 ТС)</option>
            <option value="2_TS">2 трансформатори струму (2 ТС, Арона)</option>
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-[10px] uppercase font-bold text-slate-500">Пара фаз для 2 ТС</span>
          <select
            className={`${selectCls} disabled:opacity-40 disabled:cursor-not-allowed`}
            value={ctPhasePair}
            disabled={!isTwoTs}
            onChange={(e) => onCtPhasePairChange(e.target.value as CtPhasePair)}
          >
            <option value="AC">A – C</option>
            <option value="AB">A – B</option>
            <option value="BC">B – C</option>
          </select>
        </label>

        <div className="flex flex-col gap-1">
          <span className="text-[10px] uppercase font-bold text-slate-500">Коло напруги (ТН)</span>
          {!showVt ? (
            <div className="bg-slate-900/80 border border-slate-700 rounded-lg px-2 py-2 text-xs text-slate-400">
              Пряме підключення Uф (без ТН)
            </div>
          ) : (
            <select
              className={selectCls}
              value={vtModel}
              onChange={(e) => onVtModelChange(e.target.value as VtModel)}
            >
              <option value="3x1ph">ЗНОЛ — 3× однофазні ТН</option>
              <option value="1x3ph">НТМІ / НАМІ — один 3-ф ТН</option>
            </select>
          )}
        </div>

        <label className="flex flex-col gap-1">
          <span className="text-[10px] uppercase font-bold text-slate-500">Тип лічильника</span>
          <select
            className={selectCls}
            value={meterElements}
            onChange={(e) => onMeterElementsChange(Number(e.target.value) as MeterElements)}
          >
            <option value={3}>3 елементи (4-провідна схема)</option>
            <option value={2}>2 елементи (3-провідна схема)</option>
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-[10px] uppercase font-bold text-slate-500">Нейтраль (N)</span>
          <select
            className={selectCls}
            value={hasNeutral ? 'yes' : 'no'}
            onChange={(e) => onHasNeutralChange(e.target.value === 'yes')}
          >
            <option value="yes">Є (4-провідний облік)</option>
            <option value="no">Немає (3-провідна лінія)</option>
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-[10px] uppercase font-bold text-slate-500">Напрям енергії</span>
          <select
            className={selectCls}
            value={energyFlow}
            onChange={(e) => onEnergyFlowChange(e.target.value as EnergyFlow)}
          >
            <option value="consumption">Споживання</option>
            <option value="generation">Віддача (генерація)</option>
          </select>
        </label>
      </div>

      <div className="space-y-2">
        <span className="text-[10px] uppercase font-bold text-slate-500">Швидкі шаблони</span>
        <div className="flex flex-wrap gap-2">
          {QUICK_CONNECTION_TEMPLATES.map((t) => (
            <button
              key={t.id}
              type="button"
              title={t.description}
              onClick={() => applyTemplate(t.id)}
              className="px-2 py-1.5 rounded-lg text-[10px] font-semibold border border-slate-700 bg-slate-900/80 text-slate-300 hover:border-cyan-600/50 hover:text-cyan-200 transition-colors max-w-full text-left"
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
