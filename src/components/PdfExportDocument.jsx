/**
 * Вміст звіту для PDF: таблиці + діаграма в слоті.
 * У звичайному стані схований; під час export (forCapture) показується
 * центрована панель шириною 210 mm (A4) — інакше html-to-image часто дає
 * порожній знімок для елементів поза видимістю / з opacity 0.
 */
export function PdfExportDocument({
  measurements,
  angleMode,
  scheme,
  voltageType,
  results,
  diagnostics,
  diagramMode,
  diagramModeLabel,
  diagramNote,
  trianglePhase,
  forCapture = false,
  children,
}) {
  const schemeUa = scheme === 'star' ? 'Зірка (Y)' : 'Трикутник (Δ)';
  const vtUa = voltageType === 'line' ? 'Лінійна (Uл)' : 'Фазна (Uф)';
  const modeUa =
    angleMode === 'relative' ? 'Кути U та I (відносно)' : 'Кут φ (U–I)';

  const seqUa =
    results.sequence === 'Direct'
      ? 'Пряме (A-B-C)'
      : results.sequence === 'Reverse'
        ? 'Зворотне (A-C-B)'
        : 'Невизначено';

  const phases = ['A', 'B', 'C'];
  const { phaseResults, total } = results;

  const cell = 'border border-slate-300 px-2 py-1.5 text-left';
  const th = `${cell} bg-slate-100 font-semibold text-xs`;

  const basePaper = {
    width: '210mm',
    maxWidth: 'calc(100vw - 24px)',
    padding: '10mm 12mm',
    fontFamily: 'system-ui, "Segoe UI", sans-serif',
    fontSize: '13px',
    lineHeight: 1.45,
    boxSizing: 'border-box',
  };

  const hiddenStyle = {
    ...basePaper,
    position: 'fixed',
    left: '-12000px',
    top: 0,
    zIndex: -1,
    pointerEvents: 'none',
    opacity: 0,
    visibility: 'hidden',
  };

  /** Без transform — інакше html-to-image / canvas часто дають порожній растр. */
  const capturePaperStyle = {
    ...basePaper,
    maxHeight: '95vh',
    overflowY: 'auto',
    boxShadow: '0 25px 50px rgba(0, 0, 0, 0.35)',
  };

  const paperClassName = 'bg-white text-slate-900 pdf-export-document';

  const reportInner = (
    <>
      <header className="border-b-2 border-slate-800 pb-3 mb-4">
        <h1 className="text-2xl font-bold tracking-tight m-0">VectorAnalyzer 3Ph — аналітичний звіт</h1>
        <p className="text-slate-500 text-sm m-0 mt-2">
          {new Date().toLocaleString('uk-UA', {
            dateStyle: 'long',
            timeStyle: 'short',
          })}
        </p>
      </header>

      <section className="mb-5">
        <h2 className="text-base font-bold m-0 mb-2 text-slate-800">Налаштування</h2>
        <table className="w-full border-collapse text-sm">
          <tbody>
            <tr>
              <td className={cell}>Схема</td>
              <td className={cell}>{schemeUa}</td>
              <td className={cell}>Тип напруги</td>
              <td className={cell}>{vtUa}</td>
            </tr>
            <tr>
              <td className={cell}>Режим кутів</td>
              <td className={cell} colSpan={3}>
                {modeUa}
              </td>
            </tr>
            {(diagramMode === 'voltageTriangle' || diagramMode === 'impedanceTriangle') && (
              <tr>
                <td className={cell}>Фаза трикутника</td>
                <td className={cell} colSpan={3}>
                  {trianglePhase}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <section className="mb-5">
        <h2 className="text-base font-bold m-0 mb-2 text-slate-800">Виміряні величини</h2>
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr>
              <th className={th}>Фаза</th>
              <th className={th}>U, В</th>
              <th className={th}>I, А</th>
              {angleMode === 'relative' ? (
                <>
                  <th className={th}>Кут U, °</th>
                  <th className={th}>Кут I, °</th>
                </>
              ) : (
                <th className={th}>φ (U–I), °</th>
              )}
            </tr>
          </thead>
          <tbody>
            {phases.map((p) => (
              <tr key={p}>
                <td className={cell}>{p}</td>
                <td className={cell}>{measurements[p].U}</td>
                <td className={cell}>{measurements[p].I}</td>
                {angleMode === 'relative' ? (
                  <>
                    <td className={cell}>{measurements[p].angleU}</td>
                    <td className={cell}>{measurements[p].angleI}</td>
                  </>
                ) : (
                  <td className={cell}>{measurements[p].phi}</td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="mb-5">
        <h2 className="text-base font-bold m-0 mb-2 text-slate-800">Результати розрахунку</h2>
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr>
              <th className={th}>Фаза</th>
              <th className={th}>cos φ</th>
              <th className={th}>P, Вт</th>
              <th className={th}>Q, вар</th>
              <th className={th}>S, В·А</th>
            </tr>
          </thead>
          <tbody>
            {phases.map((p) => {
              const r = phaseResults[p];
              return (
                <tr key={p}>
                  <td className={cell}>{p}</td>
                  <td className={cell}>{r.cosPhi.toFixed(3)}</td>
                  <td className={cell}>{r.P.toFixed(1)}</td>
                  <td className={cell}>{r.Q.toFixed(1)}</td>
                  <td className={cell}>{r.S.toFixed(1)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <table className="w-full border-collapse text-sm mt-3">
          <tbody>
            <tr>
              <td className={cell} colSpan={2}>
                <strong>Сумарна P:</strong> {(total.P / 1000).toFixed(3)} кВт
              </td>
              <td className={cell} colSpan={2}>
                <strong>Сумарна Q:</strong> {(total.Q / 1000).toFixed(3)} квар
              </td>
              <td className={cell}>
                <strong>Сумарна S:</strong> {(total.S / 1000).toFixed(3)} кВА
              </td>
            </tr>
            <tr>
              <td className={cell} colSpan={5}>
                <strong>Чергування фаз:</strong> {seqUa}
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="mb-5">
        <h2 className="text-base font-bold m-0 mb-2 text-slate-800">Діагностика</h2>
        {diagnostics.length === 0 ? (
          <p className="text-sm text-green-800 m-0">Зауваг не виявлено.</p>
        ) : (
          <ul className="m-0 pl-5 text-sm space-y-2">
            {diagnostics.map((d, i) => (
              <li key={i} className={d.severity === 'error' ? 'text-red-800' : 'text-amber-900'}>
                <strong>{d.title}.</strong> {d.message}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-6 pt-4 border-t-2 border-slate-300">
        <h2 className="text-base font-bold m-0 mb-1 text-slate-800">Векторна діаграма</h2>
        <p className="text-xs text-slate-600 m-0 mb-3">
          <strong>Тип:</strong> {diagramModeLabel}.{diagramNote ? ` ${diagramNote}` : ''}
        </p>
        <div className="rounded-xl bg-slate-100 border border-slate-200 p-3 flex justify-center items-center overflow-hidden">
          {children}
        </div>
      </section>

      <footer className="mt-6 pt-3 border-t border-slate-200 text-[10px] text-slate-500">
        VectorAnalyzer 3Ph • Документ згенеровано автоматично з введених параметрів.
      </footer>
    </>
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
