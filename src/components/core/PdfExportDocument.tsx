import type { CSSProperties, ReactNode } from 'react';
import type {
  AngleMode,
  AnalysisResults,
  AppSection,
  DiagnosticItem,
  Measurements,
  Scheme,
  VafExportData,
  VoltageType,
} from '../../types/vaf';

interface PdfExportDocumentProps {
  mode?: AppSection;
  measurements: Measurements;
  angleMode: AngleMode;
  scheme: Scheme;
  voltageType: VoltageType;
  results: AnalysisResults;
  diagnostics: DiagnosticItem[];
  diagramMode: string;
  diagramModeLabel: string;
  diagramNote?: string;
  trianglePhase?: string;
  vafData?: VafExportData;
  forCapture?: boolean;
  children: ReactNode;
}

/**
 * Вміст звіту для PDF: таблиці + діаграма в слоті.
 */
export function PdfExportDocument({
  mode = 'classic',
  measurements,
  angleMode,
  scheme,
  voltageType,
  results,
  diagnostics: _diagnostics,
  diagramMode: _diagramMode,
  diagramModeLabel: _diagramModeLabel,
  diagramNote: _diagramNote,
  trianglePhase: _trianglePhase,
  vafData,
  forCapture = false,
  children,
}: PdfExportDocumentProps) {
  const cell = 'border border-slate-300 px-2 py-1.5 text-left';
  const th = `${cell} bg-slate-100 font-semibold text-xs text-slate-700`;

  const basePaper: CSSProperties = {
    width: '210mm',
    maxWidth: 'calc(100vw - 24px)',
    padding: '10mm 15mm',
    fontFamily: 'system-ui, "Segoe UI", sans-serif',
    fontSize: '13px',
    lineHeight: 1.45,
    boxSizing: 'border-box',
  };

  const hiddenStyle: CSSProperties = {
    ...basePaper,
    position: 'fixed',
    left: '-12000px',
    top: 0,
    zIndex: -1,
    pointerEvents: 'none',
    opacity: 0,
    visibility: 'hidden',
  };

  const capturePaperStyle: CSSProperties = {
    ...basePaper,
    maxHeight: 'none',
    overflow: 'visible',
    boxShadow: '0 25px 50px rgba(0, 0, 0, 0.35)',
  };

  const paperClassName = 'bg-white text-slate-900 pdf-export-document';

  const renderClassicBody = () => {
    const schemeUa =
      scheme === 'star' ? 'Зірка (Y)' : scheme === 'aron' ? '2 ТС (Арон)' : 'Трикутник (Δ)';
    const vtUa = voltageType === 'line' ? 'Лінійна (Uл)' : 'Фазна (Uф)';
    const modeUa = angleMode === 'relative' ? 'Кути U та I (відносно)' : 'Кут φ (U–I)';
    const seqUa = results.sequence === 'Direct' ? 'Пряме (A-B-C)' : results.sequence === 'Reverse' ? 'Зворотне (A-C-B)' : 'Невизначено';
    const phases: Array<'A' | 'B' | 'C'> = ['A', 'B', 'C'];
    const { phaseResults, total } = results;

    return (
      <>
        <section className="mb-5">
          <h2 className="text-base font-bold m-0 mb-2 border-b border-slate-200 pb-1">Налаштування</h2>
          <table className="w-full border-collapse text-sm">
            <tbody>
              <tr>
                <td className={cell}>Схема</td><td className={cell}>{schemeUa}</td>
                <td className={cell}>Тип напруги</td><td className={cell}>{vtUa}</td>
              </tr>
              <tr>
                <td className={cell}>Режим кутів</td><td className={cell} colSpan={3}>{modeUa}</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section className="mb-5">
          <h2 className="text-base font-bold m-0 mb-2 border-b border-slate-200 pb-1">Виміряні та розраховані величини</h2>
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr>
                <th className={th}>Фаза</th><th className={th}>U, В</th><th className={th}>I, А</th>
                <th className={th}>{angleMode === 'relative' ? 'Кут U/I, °' : 'φ, °'}</th>
                <th className={th}>cos φ</th><th className={th}>P, Вт</th><th className={th}>Q, вар</th>
              </tr>
            </thead>
            <tbody>
              {phases.map((p) => (
                <tr key={p}>
                  <td className={cell}>{p}</td>
                  <td className={cell}>{measurements[p].U}</td>
                  <td className={cell}>{measurements[p].I}</td>
                  <td className={cell}>{angleMode === 'relative' ? `${measurements[p].angleU}/${measurements[p].angleI}` : measurements[p].phi}</td>
                  <td className={cell}>{phaseResults[p].cosPhi.toFixed(3)}</td>
                  <td className={cell}>{phaseResults[p].P.toFixed(1)}</td>
                  <td className={cell}>{phaseResults[p].Q.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-3 p-2 bg-slate-50 border border-slate-200 rounded text-xs flex justify-between">
            <span><strong>ΣP:</strong> {(total.P / 1000).toFixed(3)} кВт</span>
            <span><strong>ΣQ:</strong> {(total.Q / 1000).toFixed(3)} квар</span>
            <span><strong>Чергування:</strong> {seqUa}</span>
          </div>
        </section>
      </>
    );
  };

  const renderVafBody = () => {
    if (!vafData) return <p>Дані ВАФ відсутні</p>;
    const { 
      objectName, feeder, meterType, meterNumber, transformerTs, transformerTn,
      dateStr, voltageLevel, scheme, ctPhasePair, Uabc, Iabc, phiDeg, K, verdicts, power 
    } = vafData;
    const { totalPpri, totalQpri, totalSpri, avgCosPhi } = power;

    return (
      <>
        <section className="mb-5">
          <h2 className="text-base font-bold m-0 mb-2 border-b border-slate-200 pb-1">Інформація про об&apos;єкт</h2>
          <table className="w-full border-collapse text-sm">
            <tbody>
              <tr>
                <td className={cell}>Об&apos;єкт</td><td className={cell}><strong>{objectName || '—'}</strong></td>
                <td className={cell}>Приєднання</td><td className={cell}>{feeder || '—'}</td>
              </tr>
              <tr>
                <td className={cell}>Лічильник</td><td className={cell}>{meterType || '—'} (№{meterNumber || '—'})</td>
                <td className={cell}>Дата</td><td className={cell}>{dateStr}</td>
              </tr>
              <tr>
                <td className={cell}>ТС</td><td className={cell}>{transformerTs || '—'}</td>
                <td className={cell}>ТН</td><td className={cell}>{transformerTn || '—'}</td>
              </tr>
              <tr>
                <td className={cell}>Напруга</td><td className={cell}>{voltageLevel} кВ</td>
                <td className={cell}>Схема ТС</td><td className={cell}>{scheme === '3_TS' ? '3 ТС' : `2 ТС (${ctPhasePair ? ctPhasePair.split('').join('-') : 'А-С'})`}</td>
              </tr>
              <tr>
                <td className={cell}>Коеф. K</td><td className={cell} colSpan={3}>{K.toFixed(4)}</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section className="mb-5">
          <h2 className="text-base font-bold m-0 mb-2 border-b border-slate-200 pb-1">Результати вимірювань та навантаження</h2>
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr>
                <th className={th}>Фаза</th><th className={th}>U, В</th><th className={th}>I, А</th><th className={th}>φ, °</th>
                <th className={th}>cos φ</th><th className={th}>P (втор), Вт</th><th className={th}>P (перв), кВт</th>
              </tr>
            </thead>
            <tbody>
              {(['A', 'B', 'C'] as const).map(p => (
                <tr key={p}>
                  <td className={cell}>{p}</td>
                  <td className={cell}>{Uabc[p]}</td>
                  <td className={cell}>{Iabc[p]}</td>
                  <td className={cell}>{phiDeg[p]}</td>
                  <td className={cell}>{power.phases[p].cosPhi.toFixed(3)}</td>
                  <td className={cell}>{power.phases[p].P.toFixed(1)}</td>
                  <td className={cell}>{(power.phases[p].Ppri / 1000).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 border border-slate-200 rounded">
              <strong>ΣP (перв):</strong> {(totalPpri / 1000000).toFixed(3)} МВт<br/>
              <strong>ΣQ (перв):</strong> {(totalQpri / 1000000).toFixed(3)} Мвар
            </div>
            <div className="p-2 border border-slate-200 rounded">
              <strong>ΣS (перв):</strong> {(totalSpri / 1000000).toFixed(3)} МВА<br/>
              <strong>Середній cos φ:</strong> {avgCosPhi.toFixed(3)}
            </div>
          </div>
        </section>

        <section className="mb-5">
          <h2 className="text-base font-bold m-0 mb-2 border-b border-slate-200 pb-1">Діагностика та вердикти</h2>
          <div className="space-y-1">
            {verdicts.map((v, i) => (
              <div key={i} className="text-xs p-2 border-l-4 border-slate-300 bg-slate-50 italic">
                <strong>[{v.code}]</strong> {v.message}
              </div>
            ))}
          </div>
        </section>
      </>
    );
  };

  const reportInner = (
    <div className="relative">
      <header className="border-b-2 border-slate-800 pb-3 mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-black tracking-tighter m-0 uppercase flex items-center gap-2">
            VectorAnalyzer <span className="text-slate-500 font-light">3Ph</span>
          </h1>
          <p className="text-slate-500 text-[10px] uppercase tracking-widest font-bold m-0 mt-1">Звіт за результатами аналізу</p>
        </div>
        <p className="text-slate-400 text-xs m-0 font-mono">
          {new Date().toLocaleDateString('uk-UA')} {new Date().toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </header>

      {mode === 'vaf' ? renderVafBody() : renderClassicBody()}

      <section className="mt-6 border border-slate-200 rounded-xl p-4 bg-slate-50/50">
        <h2 className="text-base font-bold m-0 mb-4 text-slate-800 text-center uppercase tracking-wide">Візуалізація</h2>
        <div className="flex justify-center items-center">
          <div className="transform scale-[0.85] origin-center">
            {children}
          </div>
        </div>
      </section>

      <footer className="mt-8 pt-4 border-t border-slate-200 text-[9px] text-slate-400 text-center">
        Документ згенеровано автоматично • VectorAnalyzer 3Ph v1.4.0
      </footer>
    </div>
  );

  if (forCapture) {
    return (
      <div
        className="fixed inset-0 z-[99999] flex items-center justify-center overflow-auto p-3 bg-slate-950/75 backdrop-blur-sm"
        style={{ pointerEvents: 'auto' }}
      >
        <div id="pdf-report-export" className={paperClassName} style={capturePaperStyle}>
          {reportInner}
        </div>
      </div>
    );
  }

  return (
    <div id="pdf-report-export" className={paperClassName} style={hiddenStyle}>
      {reportInner}
    </div>
  );
}
