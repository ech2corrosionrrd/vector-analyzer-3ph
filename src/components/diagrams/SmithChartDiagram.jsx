/**
 * Спрощений фрагмент діаграми Сміта (імпеданс / узгодження ліній передачі).
 */
export function SmithChartDiagram() {
  return (
    <div className="vector-diagram-container bg-slate-900 p-6 rounded-2xl shadow-2xl overflow-hidden">
      <h3 className="text-sm font-bold text-slate-300 mb-2 text-center">Діаграма Сміта — фрагмент</h3>
      <svg viewBox="0 0 400 380" className="vector-svg w-full max-w-2xl mx-auto block" style={{ maxHeight: 520 }}>
        <text x="200" y="20" textAnchor="middle" fill="#94a3b8" fontSize="10" fontStyle="italic">
          Коло |Γ|=const та дуги опору R=const (нормовані до Z₀)
        </text>
        {/* |Γ|=1 circle (outer) */}
        <circle cx="200" cy="200" r="150" fill="none" stroke="#475569" strokeWidth="2" />
        {/* R circles */}
        <circle cx="350" cy="200" r="150" fill="none" stroke="#64748b" strokeWidth="1" opacity="0.9" />
        <circle cx="275" cy="200" r="75" fill="none" stroke="#64748b" strokeWidth="1" opacity="0.85" />
        <circle cx="230" cy="200" r="120" fill="none" stroke="#64748b" strokeWidth="1" opacity="0.75" />
        {/* Reactance arcs (simplified) */}
        <path
          d="M 200 50 A 150 150 0 0 1 350 200"
          fill="none"
          stroke="#8b5cf6"
          strokeWidth="1"
          opacity="0.7"
        />
        <path
          d="M 200 350 A 150 150 0 0 1 50 200"
          fill="none"
          stroke="#8b5cf6"
          strokeWidth="1"
          opacity="0.7"
        />
        <line x1="50" y1="200" x2="350" y2="200" stroke="#334155" strokeWidth="1" />
        <line x1="200" y1="50" x2="200" y2="350" stroke="#334155" strokeWidth="1" />
        <circle cx="200" cy="200" r="3" fill="#f97316" />
        <text x="208" y="198" fill="#cbd5e1" fontSize="10">
          1 + j0
        </text>
        <text x="15" y="355" fill="#94a3b8" fontSize="10">
          Рух по лінії передачі → по колу |Γ| до узгодження
        </text>
      </svg>
      <p className="text-[11px] text-slate-500 mt-3 leading-relaxed">
        Повна діаграма Сміта містить сімейства перетинних кіл; використовується у РЧ/НВЧ для зчитування Z, Γ та
        довжин ліній. Для трифазних КЗЛН часто застосовують окремі інструменти.
      </p>
    </div>
  );
}
