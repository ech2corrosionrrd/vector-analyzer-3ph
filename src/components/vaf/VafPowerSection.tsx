import { Zap, Info } from 'lucide-react';
import type { VafPowerResults, VafPhaseValues, TransformerRatios } from '../../types/vaf';

interface VafPowerSectionProps {
  powerResults: VafPowerResults;
  Uabc: VafPhaseValues;
  ratios: TransformerRatios;
}

export function VafPowerSection({
  powerResults,
  Uabc,
  ratios,
}: VafPowerSectionProps) {
  const { totalPpri, totalQpri, totalSpri, totalPsec, totalQsec, avgCosPhi } = powerResults;
  const { UPrim, USec } = ratios;

  const fmtPower = (v: number, unitBase: string) => {
    const absV = Math.abs(v);
    if (absV >= 1000000) return (v / 1000000).toFixed(3) + ' М' + unitBase;
    if (absV >= 1000) return (v / 1000).toFixed(2) + ' к' + unitBase;
    return v.toFixed(1) + ' ' + unitBase;
  };

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
      <h3 className="text-lg font-semibold mb-4 text-slate-200 flex items-center gap-2">
        <Zap className="text-blue-400" size={20} /> Навантаження (первинні кола)
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800">
          <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Активна (ΣP)</div>
          <div className="text-2xl font-mono font-black text-blue-400">
            {fmtPower(totalPpri, 'Вт')}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            Втор: {totalPsec.toFixed(1)} Вт
          </div>
        </div>
        
        <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800">
          <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Реактивна (ΣQ)</div>
          <div className="text-2xl font-mono font-black text-purple-400">
            {fmtPower(totalQpri, 'вар')}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            {totalQsec >= 0 ? 'Індуктивна' : 'Ємнісна'}
          </div>
        </div>

        <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800">
          <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Повна (ΣS)</div>
          <div className="text-2xl font-mono font-black text-slate-100">
            {fmtPower(totalSpri, 'ВА')}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            S = √(P² + Q²)
          </div>
        </div>

        <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800">
          <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Середній cos φ</div>
          <div className="text-2xl font-mono font-black text-emerald-400">
            {avgCosPhi.toFixed(3)}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            φ ≈ {(Math.acos(Math.min(1, Math.max(0, avgCosPhi))) * 180 / Math.PI).toFixed(0)}°
          </div>
        </div>
      </div>

      <div className="mt-4 p-3 bg-blue-900/10 border border-blue-800/20 rounded-lg">
        <p className="text-xs text-blue-300 flex items-center gap-2">
          <Info size={14} /> 
          Розрахункова первинна напруга: <span className="font-bold">{(Uabc.A * (UPrim/USec) * Math.sqrt(3) / 1000).toFixed(2)} кВ</span> (лінійна)
        </p>
      </div>
    </section>
  );
}
