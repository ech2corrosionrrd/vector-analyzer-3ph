/**
 * Спрощена навчальна схема діаграми Оссана (асинхронний двигун).
 * Повна побудова потребує параметрів ротора/статора та номінального режиму.
 */
export function OssannaDiagram() {
  return (
    <div className="vector-diagram-container bg-slate-900 p-6 rounded-2xl shadow-2xl overflow-hidden">
      <h3 className="text-sm font-bold text-slate-300 mb-2 text-center">Діаграма Оссана (круг струму)</h3>
      <svg viewBox="0 0 420 320" className="vector-svg w-full max-w-2xl mx-auto block" style={{ maxHeight: 480 }}>
        <text x="210" y="22" textAnchor="middle" fill="#94a3b8" fontSize="10" fontStyle="italic">
          Зміна навантаження → кінець вектора струму статора наближається до кола (ККД, момент, ковзання)
        </text>
        <circle cx="210" cy="170" r="110" fill="none" stroke="#64748b" strokeWidth="2" />
        <line x1="100" y1="170" x2="320" y2="170" stroke="#475569" strokeWidth="1" strokeDasharray="5,4" />
        <line x1="210" y1="60" x2="210" y2="280" stroke="#334155" strokeWidth="1" strokeDasharray="3,5" />
        <line x1="210" y1="170" x2="300" y2="120" stroke="#38bdf8" strokeWidth="2.5" markerEnd="url(#ossa-arrow)" />
        <circle cx="210" cy="170" r="4" fill="#94a3b8" />
        <text x="305" y="118" fill="#38bdf8" fontSize="11" fontWeight="700">
          I
        </text>
        <text x="50" y="265" fill="#94a3b8" fontSize="10">
          U = const
        </text>
        <text x="50" y="280" fill="#94a3b8" fontSize="10">
          Холостий хід → КЗ (точки на колі)
        </text>
        <defs>
          <marker id="ossa-arrow" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#38bdf8" />
          </marker>
        </defs>
      </svg>
      <p className="text-[11px] text-slate-500 mt-3 leading-relaxed">
        У повному варіанті коло будується за еквівалентною схемою заміщення АД (R₁, X₁, R₂′, X₂′, Rfe, Xm).
        Тут — принципова ілюстрація геометрії для інженерних курсів.
      </p>
    </div>
  );
}
