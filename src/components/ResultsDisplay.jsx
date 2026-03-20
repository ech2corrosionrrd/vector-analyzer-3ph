import { AlertCircle, CheckCircle, Zap, ShieldAlert } from 'lucide-react';

const ResultsDisplay = ({ results, diagnostics }) => {
  const { phaseResults, total, sequence } = results;

  const phases = [
    { id: 'A', name: 'Фаза A', color: 'text-yellow-400' },
    { id: 'B', name: 'Фаза B', color: 'text-green-500' },
    { id: 'C', name: 'Фаза C', color: 'text-red-500' }
  ];

  return (
    <div className="results-display space-y-6 text-slate-200">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {phases.map(p => {
          const res = phaseResults[p.id];
          return (
            <div key={p.id} className="bg-slate-800/40 p-5 rounded-2xl backdrop-blur-lg border border-slate-700/50 shadow-xl">
              <h3 className={`text-lg font-bold mb-4 ${p.color}`}>{p.name}</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">cos φ:</span>
                  <span className="font-mono font-bold">{res.cosPhi.toFixed(3)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">P (Вт):</span>
                  <span className="font-mono">{res.P.toFixed(1)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Q (Вар):</span>
                  <span className="font-mono">{res.Q.toFixed(1)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">S (ВА):</span>
                  <span className="font-mono">{res.S.toFixed(1)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Summary Card */}
        <div className="bg-slate-800/60 p-6 rounded-2xl border-2 border-slate-700 shadow-2xl">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Zap className="text-blue-400" /> Підсумкові показники
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-slate-900/50 rounded-xl">
              <div className="text-xs text-slate-500 uppercase">Сумарна P (кВт)</div>
              <div className="text-2xl font-mono font-bold text-blue-400">{(total.P / 1000).toFixed(2)}</div>
            </div>
            <div className="p-3 bg-slate-900/50 rounded-xl">
              <div className="text-xs text-slate-500 uppercase">Сумарна S (кВА)</div>
              <div className="text-2xl font-mono font-bold text-purple-400">{(total.S / 1000).toFixed(2)}</div>
            </div>
            <div className="p-3 bg-slate-900/50 rounded-xl col-span-2">
              <div className="text-xs text-slate-500 uppercase">Чергування фаз</div>
              <div className={`text-lg font-bold flex items-center gap-2 ${sequence === 'Direct' ? 'text-green-400' : 'text-orange-400'}`}>
                {sequence === 'Direct' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                {sequence === 'Direct' ? 'Пряме (A-B-C)' : sequence === 'Reverse' ? 'Зворотне (A-C-B)' : 'Невизначено'}
              </div>
            </div>
          </div>
        </div>

        {/* Diagnostics Card */}
        <div className="bg-slate-800/60 p-6 rounded-2xl border-2 border-slate-700 shadow-2xl">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <ShieldAlert className="text-red-400" /> Діагностика помилок
          </h3>
          <div className="space-y-3">
            {diagnostics.length === 0 ? (
              <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 flex items-center gap-3">
                <CheckCircle size={20} />
                <span>Помилок не виявлено. Підключення в нормі.</span>
              </div>
            ) : (
              diagnostics.map((diag, i) => (
                <div key={i} className={`p-4 rounded-xl border flex items-start gap-3 ${diag.severity === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-orange-500/10 border-orange-500/30 text-orange-400'}`}>
                  <AlertCircle size={20} className="mt-1 flex-shrink-0" />
                  <div>
                    <div className="font-bold">{diag.title}</div>
                    <div className="text-sm opacity-80">{diag.message}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsDisplay;
