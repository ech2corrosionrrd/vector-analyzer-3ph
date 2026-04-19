import { useState, type Dispatch, type SetStateAction } from 'react';
import type { AngleMode, Phase, Scheme, VoltageType, Measurements, LoadType } from '../../types/vaf';
import { FREQUENCIES, LOAD_TYPES, PRESETS } from '../../utils/constants';
import { VOLTAGE_LEVELS, VOLTAGE_PRESETS } from '../../utils/ratios';
import { ChevronDown, ChevronUp, Zap } from 'lucide-react';

interface InputFormProps {
  measurements: Measurements;
  setMeasurements: Dispatch<SetStateAction<Measurements>>;
  angleMode: AngleMode;
  setAngleMode: Dispatch<SetStateAction<AngleMode>>;
  scheme: Scheme;
  setScheme: Dispatch<SetStateAction<Scheme>>;
  voltageType: VoltageType;
  setVoltageType: Dispatch<SetStateAction<VoltageType>>;
  frequency: string;
  setFrequency: Dispatch<SetStateAction<string>>;
  loadType: LoadType;
  setLoadType: Dispatch<SetStateAction<LoadType>>;
  voltageLevel: string;
  setVoltageLevel: Dispatch<SetStateAction<string>>;
  IPrim: number;
  setIPrim: (v: number) => void;
  ISec: number;
  setISec: (v: number) => void;
  UPrim: number;
  setUPrim: (v: number) => void;
  USec: number;
  setUSec: (v: number) => void;
  hasNeutral: boolean;
  setHasNeutral: Dispatch<SetStateAction<boolean>>;
}

const PHASES: Array<{ id: Phase; name: string; color: string }> = [
  { id: 'A', name: 'Фаза A', color: 'border-yellow-400' },
  { id: 'B', name: 'Фаза B', color: 'border-green-500' },
  { id: 'C', name: 'Фаза C', color: 'border-red-500' },
];

const BASE_SELECT =
  'bg-slate-700/80 border border-slate-600/60 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all';

const selectClass = (extra = '') => `${BASE_SELECT} ${extra}`.trim();

const InputForm = ({
  measurements,
  setMeasurements,
  angleMode,
  setAngleMode,
  scheme,
  setScheme,
  voltageType,
  setVoltageType,
  frequency,
  setFrequency,
  loadType,
  setLoadType,
  voltageLevel,
  setVoltageLevel,
  IPrim,
  setIPrim,
  ISec,
  setISec,
  UPrim,
  setUPrim,
  USec,
  setUSec,
  hasNeutral,
  setHasNeutral,
}: InputFormProps) => {
  const [ratiosExpanded, setRatiosExpanded] = useState(false);

  const handleChange = (phaseId: Phase, field: keyof Measurements['A'], value: string) => {
    const n = parseFloat(value);
    setMeasurements((prev) => ({
      ...prev,
      [phaseId]: {
        ...prev[phaseId],
        [field]: Number.isFinite(n) ? n : 0,
      },
    }));
  };

  const handlePresetChange = (presetId: string) => {
    const preset = PRESETS.find((p) => p.id === presetId);
    if (preset && preset.measurements) {
      setMeasurements({ ...preset.measurements });
    }
  };

  const handleVoltageLevelChange = (val: string) => {
    setVoltageLevel(val);
    const preset = VOLTAGE_PRESETS[val];
    if (preset) {
      setIPrim(preset.IPrim);
      setISec(preset.ISec);
      setUPrim(preset.UPrim);
      setUSec(preset.USec);
      setHasNeutral(parseFloat(val) < 6);
      if (preset.Usec > 0) {
        setMeasurements(prev => ({
          A: { ...prev.A, U: preset.Usec },
          B: { ...prev.B, U: preset.Usec },
          C: { ...prev.C, U: preset.Usec },
        }));
      }
    }
  };

  return (
    <div className="input-form space-y-6 text-slate-200">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-6 bg-slate-800/50 p-4 rounded-xl backdrop-blur-md">
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] uppercase tracking-wider text-blue-400 font-bold">Рівень напруги</label>
          <select
            className={selectClass('focus:ring-blue-500 border-blue-500/30 font-bold')}
            value={voltageLevel}
            onChange={(e) => handleVoltageLevelChange(e.target.value)}
          >
            {VOLTAGE_LEVELS.map(lvl => (
              <option key={lvl.value} value={lvl.value}>{lvl.label}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Схема ТС</label>
          <select
            className={selectClass()}
            value={scheme}
            onChange={(e) => setScheme(e.target.value as Scheme)}
          >
            <option value="star">3 ТС (Зірка)</option>
            <option value="aron">2 ТС (Арон)</option>
            <option value="delta">Трикутник (Δ)</option>
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Режим кутів</label>
          <select
            className={selectClass()}
            value={angleMode}
            onChange={(e) => setAngleMode(e.target.value as AngleMode)}
          >
            <option value="relative">Відносно UA (0°)</option>
            <option value="phi">Кут φ (U-I)</option>
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Тип напруги</label>
          <select
            className={selectClass()}
            value={voltageType}
            onChange={(e) => setVoltageType(e.target.value as VoltageType)}
          >
            <option value="phase">Фазна (Uф)</option>
            <option value="line">Лінійна (Uл)</option>
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Частота</label>
          <select
            className={selectClass()}
            value={frequency}
            onChange={(e) => setFrequency(e.target.value)}
          >
            {FREQUENCIES.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Тип навантаження</label>
          <select
            className={selectClass()}
            value={loadType}
            onChange={(e) => setLoadType(e.target.value as LoadType)}
          >
            {LOAD_TYPES.map((lt) => (
              <option key={lt.value} value={lt.value}>{lt.label}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5 justify-end pb-1 col-span-2 md:col-span-1">
          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Нейтраль</span>
          <label className="flex items-center gap-2 cursor-pointer group h-[38px]">
            <span className="relative">
              <input
                type="checkbox"
                className="sr-only"
                checked={hasNeutral}
                onChange={(e) => setHasNeutral(e.target.checked)}
              />
              <span className={`block w-10 h-5 rounded-full shadow-inner transition-colors ${hasNeutral ? 'bg-blue-600' : 'bg-slate-600'}`} />
              <span className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${hasNeutral ? 'translate-x-5' : ''}`} />
            </span>
            <span className="text-xs font-semibold text-slate-300 group-hover:text-slate-100 transition-colors">
              {hasNeutral ? 'З нулем (N)' : 'Без нуля'}
            </span>
          </label>
        </div>
      </div>

      <div className="bg-slate-800/30 rounded-xl overflow-hidden border border-slate-700/30">
        <button
          type="button"
          aria-expanded={ratiosExpanded}
          aria-controls="ratios-panel"
          onClick={() => setRatiosExpanded(!ratiosExpanded)}
          className="w-full flex items-center justify-between p-3 hover:bg-slate-700/30 transition-colors text-slate-300"
        >
          <div className="flex items-center gap-2">
            <Zap size={16} className="text-amber-400" />
            <span className="text-xs uppercase tracking-wider font-bold">Коефіцієнти ТС / ТН</span>
            <span className="text-[10px] text-slate-500 ml-2 font-mono">K = {((UPrim / USec) * (IPrim / ISec)).toFixed(2)}</span>
          </div>
          {ratiosExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        
        {ratiosExpanded && (
          <div id="ratios-panel" className="p-4 bg-slate-900/40 grid grid-cols-2 sm:grid-cols-4 gap-3 animate-fade-in">
            {([
              { label: 'U перв. (В)', value: UPrim, set: setUPrim },
              { label: 'U втор. (В)', value: USec, set: setUSec },
              { label: 'I перв. (А)', value: IPrim, set: setIPrim },
              { label: 'I втор. (А)', value: ISec, set: setISec },
            ] as const).map((f) => (
              <div key={f.label} className="flex flex-col gap-1">
                <label className="text-[10px] uppercase text-slate-500 font-semibold">{f.label}</label>
                <input
                  type="number"
                  min={0}
                  value={f.value}
                  onChange={(e) => f.set(Number(e.target.value))}
                  className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 bg-slate-800/30 p-3 rounded-xl border border-slate-700/30">
        <label className="text-[10px] uppercase tracking-wider text-amber-400 whitespace-nowrap font-bold">⚡ Сценарії</label>
        <select
          className={selectClass('flex-1 min-w-[200px] focus:ring-amber-500 border-amber-500/30')}
          defaultValue="custom"
          onChange={(e) => handlePresetChange(e.target.value)}
        >
          {PRESETS.map((p) => (
            <option key={p.id} value={p.id}>{p.label}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PHASES.map((phase) => {
          const m = measurements[phase.id];
          const uInvalid = m.U < 0;
          const iInvalid = m.I < 0;
          return (
            <div key={phase.id} className={`phase-card bg-slate-800/40 p-5 rounded-2xl border-l-4 ${phase.color} backdrop-blur-lg shadow-lg`}>
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${phase.color.replace('border', 'bg')}`} />
                {phase.name}
              </h3>

              <div className="space-y-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-slate-400">Напруга (В)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    className={`bg-slate-900/50 border rounded-lg px-3 py-2 focus:ring-2 outline-none transition-all w-full min-w-0 ${
                      uInvalid ? 'border-red-500 focus:ring-red-500' : 'border-slate-700 focus:ring-blue-500'
                    }`}
                    value={m.U}
                    onChange={(e) => handleChange(phase.id, 'U', e.target.value)}
                  />
                  {uInvalid && <p className="text-xs text-red-400 mt-0.5">⚠ Використайте значення ≥ 0</p>}
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs text-slate-400">Струм (А)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className={`bg-slate-900/50 border rounded-lg px-3 py-2 focus:ring-2 outline-none transition-all w-full min-w-0 ${
                      iInvalid ? 'border-red-500 focus:ring-red-500' : 'border-slate-700 focus:ring-blue-500'
                    }`}
                    value={m.I}
                    onChange={(e) => handleChange(phase.id, 'I', e.target.value)}
                  />
                  {iInvalid && <p className="text-xs text-red-400 mt-0.5">⚠ Використайте значення ≥ 0</p>}
                </div>

                {angleMode === 'relative' ? (
                  <>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-slate-400">Кут U (°)</label>
                      <input
                        type="number"
                        disabled={phase.id === 'A'}
                        className={`bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 outline-none transition-all w-full min-w-0 ${
                          phase.id === 'A' ? 'opacity-50' : 'focus:ring-2 focus:ring-blue-500'
                        }`}
                        value={m.angleU}
                        onChange={(e) => handleChange(phase.id, 'angleU', e.target.value)}
                        placeholder={phase.id === 'A' ? '0' : ''}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-slate-400">Кут I (°)</label>
                      <input
                        type="number"
                        className="bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition-all w-full min-w-0"
                        value={m.angleI}
                        onChange={(e) => handleChange(phase.id, 'angleI', e.target.value)}
                      />
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-slate-400">Кут φ (U-I) (°)</label>
                    <input
                      type="number"
                      className="bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition-all w-full min-w-0"
                      value={m.phi}
                      onChange={(e) => handleChange(phase.id, 'phi', e.target.value)}
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default InputForm;
