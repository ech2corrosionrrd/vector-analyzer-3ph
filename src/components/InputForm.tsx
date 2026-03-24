import { FREQUENCIES, LOAD_TYPES, PRESETS } from '../utils/constants';

const InputForm = ({ measurements, setMeasurements, angleMode, setAngleMode, scheme, setScheme, voltageType, setVoltageType, frequency, setFrequency, loadType, setLoadType }) => {
  
  const handleChange = (phase, field, value) => {
    setMeasurements(prev => ({
      ...prev,
      [phase]: {
        ...prev[phase],
        [field]: parseFloat(value) || 0
      }
    }));
  };

  const handlePresetChange = (presetId) => {
    const preset = PRESETS.find(p => p.id === presetId);
    if (preset && preset.measurements) {
      setMeasurements({ ...preset.measurements });
    }
  };

  const phases = [
    { id: 'A', name: 'Фаза A', color: 'border-yellow-400' },
    { id: 'B', name: 'Фаза B', color: 'border-green-500' },
    { id: 'C', name: 'Фаза C', color: 'border-red-500' }
  ];

  return (
    <div className="input-form space-y-6 text-slate-200">
      <div className="flex flex-wrap gap-4 mb-6 bg-slate-800/50 p-4 rounded-xl backdrop-blur-md">
        <div className="flex flex-col gap-2">
          <label className="text-xs uppercase tracking-wider text-slate-400">Режим кутів</label>
          <select 
            className="bg-slate-700 border-none rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 transition-all"
            value={angleMode} 
            onChange={(e) => setAngleMode(e.target.value)}
          >
            <option value="relative">Відносно UA (0°)</option>
            <option value="phi">Кут φ (U-I)</option>
          </select>
        </div>
        
        <div className="flex flex-col gap-2">
          <label className="text-xs uppercase tracking-wider text-slate-400">Тип напруги</label>
          <select 
            className="bg-slate-700 border-none rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 transition-all"
            value={voltageType} 
            onChange={(e) => setVoltageType(e.target.value)}
          >
            <option value="phase">Фазна (Uф)</option>
            <option value="line">Лінійна (Uл)</option>
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs uppercase tracking-wider text-slate-400">Схема</label>
          <select 
            className="bg-slate-700 border-none rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 transition-all"
            value={scheme} 
            onChange={(e) => setScheme(e.target.value)}
          >
            <option value="star">Зірка (Y)</option>
            <option value="delta">Трикутник (Δ)</option>
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs uppercase tracking-wider text-slate-400">Частота</label>
          <select
            className="bg-slate-700 border-none rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 transition-all"
            value={frequency}
            onChange={(e) => setFrequency(e.target.value)}
          >
            {FREQUENCIES.map(f => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs uppercase tracking-wider text-slate-400">Тип навантаження</label>
          <select
            className="bg-slate-700 border-none rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 transition-all"
            value={loadType}
            onChange={(e) => setLoadType(e.target.value)}
          >
            {LOAD_TYPES.map(lt => (
              <option key={lt.value} value={lt.value}>{lt.label}</option>
            ))}
          </select>
        </div>

        {voltageType === 'line' && (
          <p className="w-full text-xs text-slate-500 leading-relaxed">
            Лінійна напруга: для зірки U<sub>ф</sub> = U<sub>л</sub>/√3; для трикутника U<sub>ф</sub> = U<sub>л</sub> (розрахунок P, Q, S — по фазній).
          </p>
        )}
      </div>

      {/* Presets */}
      <div className="flex flex-wrap items-center gap-3 bg-slate-800/30 p-3 rounded-xl">
        <label className="text-xs uppercase tracking-wider text-slate-400 whitespace-nowrap">⚡ Пресети</label>
        <select
          className="bg-slate-700 border-none rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 transition-all flex-1 min-w-[200px]"
          defaultValue="custom"
          onChange={(e) => handlePresetChange(e.target.value)}
        >
          {PRESETS.map(p => (
            <option key={p.id} value={p.id}>{p.label}</option>
          ))}
        </select>
        <p className="w-full text-[11px] text-slate-500">
          Вибір пресету автоматично заповнить всі поля типовими значеннями для обраного сценарію.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {phases.map(phase => (
          <div key={phase.id} className={`phase-card bg-slate-800/40 p-5 rounded-2xl border-l-4 ${phase.color} backdrop-blur-lg shadow-lg`}>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${phase.color.replace('border', 'bg')}`}></span>
              {phase.name}
            </h3>
            
            <div className="space-y-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-400">Напруга (В)</label>
                <input 
                  type="number" 
                  step="0.1"
                  className="bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition-all w-full min-w-0"
                  value={measurements[phase.id].U}
                  onChange={(e) => handleChange(phase.id, 'U', e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-400">Струм (А)</label>
                <input 
                  type="number" 
                  step="0.01"
                  className="bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition-all w-full min-w-0"
                  value={measurements[phase.id].I}
                  onChange={(e) => handleChange(phase.id, 'I', e.target.value)}
                />
              </div>

              {angleMode === 'relative' ? (
                <>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-slate-400">Кут U (°)</label>
                    <input 
                      type="number" 
                      disabled={phase.id === 'A'} // UA fixed at 0
                      className={`bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 outline-none transition-all w-full min-w-0 ${phase.id === 'A' ? 'opacity-50' : 'focus:ring-2 focus:ring-blue-500'}`}
                      value={measurements[phase.id].angleU}
                      onChange={(e) => handleChange(phase.id, 'angleU', e.target.value)}
                      placeholder={phase.id === 'A' ? '0' : ''}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-slate-400">Кут I (°)</label>
                    <input 
                      type="number" 
                      className="bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition-all w-full min-w-0"
                      value={measurements[phase.id].angleI}
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
                    value={measurements[phase.id].phi}
                    onChange={(e) => handleChange(phase.id, 'phi', e.target.value)}
                  />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InputForm;
