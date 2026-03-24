import React from 'react';
import { ClipboardCopy } from 'lucide-react';
import { AnalysisVerdict, VerdictCode } from '../types/vaf';

interface VafDiagnosticsSectionProps {
  verdicts: AnalysisVerdict[];
  reportText: string;
  copyReport: () => void;
  copyHint: string;
}

const verdictStyles: Record<VerdictCode, string> = {
  OK: 'border-emerald-500/40 bg-emerald-950/40 text-emerald-200',
  REV_I: 'border-red-500/50 bg-red-950/30 text-red-200',
  WRONG_U: 'border-red-500/50 bg-red-950/30 text-red-200',
  PHASE_SWAP: 'border-amber-500/50 bg-amber-950/30 text-amber-200',
  ASYM: 'border-amber-500/50 bg-amber-950/30 text-amber-200',
};

export const VafDiagnosticsSection: React.FC<VafDiagnosticsSectionProps> = ({
  verdicts,
  reportText,
  copyReport,
  copyHint,
}) => {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
      <h3 className="text-lg font-semibold mb-4 text-slate-100">Висновок аналізу</h3>
      <div className="space-y-2">
        {verdicts.map((v, i) => (
          <div
            key={`${v.code}-${i}`}
            className={`rounded-xl border px-4 py-3 text-sm ${
              verdictStyles[v.code] ?? 'border-slate-700 bg-slate-900/50'
            }`}
          >
            <span className="font-mono text-xs opacity-80">{v.code}</span>
            <p className="mt-1">{v.message}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={copyReport}
          className="inline-flex items-center gap-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 px-4 py-2 text-sm font-medium transition-all"
        >
          <ClipboardCopy size={16} />
          Текстовий звіт у буфер
        </button>
        {copyHint ? <span className="text-sm text-emerald-400">{copyHint}</span> : null}
      </div>
      <p className="text-xs text-slate-500 mt-2 max-w-md">
        Текстовий звіт у буфері зручно вставляти в Viber, Telegram або лист керівнику без додаткового форматування.
      </p>

      <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/80 p-4">
        <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Попередній перегляд звіту</p>
        <pre className="text-xs text-slate-400 whitespace-pre-wrap font-mono max-h-64 overflow-y-auto">
          {reportText}
        </pre>
      </div>
    </div>
  );
};
