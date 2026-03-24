const PHASE_COL = { A: '#facc15', B: '#22c55e', C: '#ef4444' };

function wireStroke(state, phase) {
  const base = PHASE_COL[phase] ?? '#94a3b8';
  if (state === 'error') return { stroke: '#f87171', width: 3.5, pulse: true };
  if (state === 'warning') return { stroke: '#fbbf24', width: 2.8, pulse: false };
  return { stroke: base, width: 2, pulse: false };
}

function TsBox({ x, y, phase, label, dimmed }) {
  const col = PHASE_COL[phase];
  return (
    <g opacity={dimmed ? 0.35 : 1}>
      <rect
        x={x}
        y={y}
        width={88}
        height={56}
        rx={6}
        fill="#0f172a"
        stroke={dimmed ? '#475569' : col}
        strokeWidth={2}
      />
      <text x={x + 44} y={y + 18} textAnchor="middle" fill="#e2e8f0" fontSize="11" fontWeight="700">
        ТС {phase}
      </text>
      <text x={x + 44} y={y + 34} textAnchor="middle" fill="#94a3b8" fontSize="9">
        Л1·Л2
      </text>
      <text x={x + 44} y={y + 48} textAnchor="middle" fill="#cbd5e1" fontSize="9" fontWeight="600">
        И1·И2
      </text>
      {label ? (
        <text x={x + 44} y={y - 4} textAnchor="middle" fill="#f87171" fontSize="9" fontWeight="700">
          {label}
        </text>
      ) : null}
    </g>
  );
}

function TnBox({ x, y, phase, direct, label }) {
  const col = PHASE_COL[phase];
  if (direct) {
    return (
      <g>
        <rect x={x} y={y} width={72} height={44} rx={5} fill="#0f172a" stroke="#64748b" strokeWidth={1.5} strokeDasharray="4 3" />
        <text x={x + 36} y={y + 20} textAnchor="middle" fill="#94a3b8" fontSize="9">
          0,4 кВ
        </text>
        <text x={x + 36} y={y + 34} textAnchor="middle" fill="#cbd5e1" fontSize="8">
          прямо
        </text>
        {label ? (
          <text x={x + 36} y={y - 4} textAnchor="middle" fill="#38bdf8" fontSize="8">
            {label}
          </text>
        ) : null}
      </g>
    );
  }
  return (
    <g>
      <polygon
        points={`${x},${y + 44} ${x + 36},${y} ${x + 72},${y + 44}`}
        fill="#0f172a"
        stroke={col}
        strokeWidth={2}
      />
      <text x={x + 36} y={y + 38} textAnchor="middle" fill="#e2e8f0" fontSize="10" fontWeight="700">
        ТН {phase}
      </text>
      {label ? (
        <text x={x + 36} y={y - 4} textAnchor="middle" fill="#38bdf8" fontSize="8">
          {label}
        </text>
      ) : null}
    </g>
  );
}

function WirePath({ d, state, phase }) {
  const w = wireStroke(state, phase);
  return (
    <path
      d={d}
      fill="none"
      stroke={w.stroke}
      strokeWidth={w.width}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={w.pulse ? 'meter-wire--pulse' : undefined}
    />
  );
}

function Terminal({ cx, cy, n }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={7} fill="#1e293b" stroke="#64748b" strokeWidth={1.5} />
      <text x={cx} y={cy + 3} textAnchor="middle" fill="#f8fafc" fontSize="9" fontWeight="700">
        {n}
      </text>
    </g>
  );
}

export function MeterConnectionSchematic({ connectionScheme, voltageLevel, wireHighlights, phaseSummary }) {
  const is3 = connectionScheme === '3_TS';
  const direct04 = voltageLevel === '0.4';
  const hl = wireHighlights;

  let vtLabel = `${voltageLevel} кВ`;
  if (voltageLevel === '0.4') vtLabel = 'без ТН (пряме)';
  else if (voltageLevel === '10' || voltageLevel === '6-10') vtLabel = '6–10 кВ';

  const meterTitle = 'Лічильник (умовні клеми 1–11)';

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 overflow-x-auto">
      <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
        <h4 className="text-sm font-semibold text-slate-200">Схема підключення</h4>
        <span className="text-xs text-slate-500">
          {is3 ? '3 ТС + 3 ТН' : '2 ТС + 2 ТН (Арон)'} · {vtLabel}
        </span>
      </div>
      {phaseSummary ? (
        <p className="text-[11px] text-slate-500 mb-2 font-mono">
          Фази: A={phaseSummary.phaseA} · B={phaseSummary.phaseB} · C={phaseSummary.phaseC}
        </p>
      ) : null}

      <svg viewBox="0 0 620 420" className="w-full h-auto min-w-[520px] max-h-[420px]" aria-hidden>
        <text x={310} y={22} textAnchor="middle" fill="#94a3b8" fontSize="11" fontWeight="600">
          {meterTitle}
        </text>

        {/* Метр: корпус */}
        <rect x={248} y={36} width={360} height={330} rx={10} fill="#020617" stroke="#334155" strokeWidth={2} />

        {/* Ряд A — клеми 1,2,3 */}
        <Terminal cx={280} cy={72} n="1" />
        <Terminal cx={310} cy={72} n="2" />
        <Terminal cx={340} cy={72} n="3" />
        <text x={310} y={58} textAnchor="middle" fill="#facc15" fontSize="10" fontWeight="700">
          ф. A
        </text>

        {/* Ряд B — 4,5,6 */}
        <Terminal cx={280} cy={168} n="4" />
        <Terminal cx={310} cy={168} n="5" />
        <Terminal cx={340} cy={168} n="6" />
        <text x={310} y={154} textAnchor="middle" fill="#22c55e" fontSize="10" fontWeight="700">
          ф. B
        </text>

        {/* Ряд C — 7,8,9 */}
        <Terminal cx={280} cy={264} n="7" />
        <Terminal cx={310} cy={264} n="8" />
        <Terminal cx={340} cy={264} n="9" />
        <text x={310} y={250} textAnchor="middle" fill="#ef4444" fontSize="10" fontWeight="700">
          ф. C
        </text>

        {/* N 10,11 */}
        <Terminal cx={290} cy={348} n="10" />
        <Terminal cx={320} cy={348} n="11" />
        <text x={305} y={334} textAnchor="middle" fill="#94a3b8" fontSize="10" fontWeight="600">
          N
        </text>

        {/* Ліва частина: ТС / ТН ф. A */}
        <>
          <TsBox x={12} y={44} phase="A" />
          <TnBox x={118} y={50} phase="A" direct={direct04} label={is3 ? undefined : 'U AB'} />
          <WirePath
            d="M 56 100 L 56 115 L 200 115 L 200 72 L 280 72"
            state={hl.tsCurrent.A}
            phase="A"
          />
          <WirePath
            d="M 100 100 L 100 128 L 220 128 L 220 72 L 280 72"
            state={hl.tsCurrent.A}
            phase="A"
          />
          <WirePath d="M 154 94 L 154 72 L 310 72" state={hl.tnVoltage.A} phase="A" />
        </>

        {/* Ф. B */}
        {is3 ? (
          <>
            <TsBox x={12} y={140} phase="B" />
            <TnBox x={118} y={146} phase="B" direct={direct04} />
            <WirePath
              d="M 56 196 L 56 210 L 200 210 L 200 168 L 280 168"
              state={hl.tsCurrent.B}
              phase="B"
            />
            <WirePath
              d="M 100 196 L 100 222 L 220 222 L 220 168 L 280 168"
              state={hl.tsCurrent.B}
              phase="B"
            />
            <WirePath d="M 154 190 L 154 168 L 310 168" state={hl.tnVoltage.B} phase="B" />
          </>
        ) : (
          <>
            <TsBox x={12} y={140} phase="B" label="немає ТС" dimmed />
            <TnBox x={118} y={146} phase="B" direct={direct04} label="спільна U" />
            <text x={200} y={200} textAnchor="middle" fill="#64748b" fontSize="9" fontStyle="italic">
              кл. 4–6: без струму
            </text>
            <WirePath
              d="M 154 190 L 154 168 L 310 168"
              state={hl.tnVoltage.B}
              phase="B"
            />
            <WirePath
              d="M 154 190 L 154 120 L 400 120 L 400 72 L 340 72"
              state={hl.tnVoltage.B}
              phase="B"
            />
            <WirePath
              d="M 154 190 L 154 120 L 400 120 L 400 264 L 340 264"
              state={hl.tnVoltage.B}
              phase="B"
            />
          </>
        )}

        {/* Ф. C */}
        {is3 ? (
          <>
            <TsBox x={12} y={236} phase="C" />
            <TnBox x={118} y={242} phase="C" direct={direct04} />
            <WirePath
              d="M 56 292 L 56 306 L 200 306 L 200 264 L 280 264"
              state={hl.tsCurrent.C}
              phase="C"
            />
            <WirePath
              d="M 100 292 L 100 318 L 220 318 L 220 264 L 280 264"
              state={hl.tsCurrent.C}
              phase="C"
            />
            <WirePath d="M 154 286 L 154 264 L 310 264" state={hl.tnVoltage.C} phase="C" />
          </>
        ) : (
          <>
            <TsBox x={12} y={236} phase="C" />
            <TnBox x={118} y={242} phase="C" direct={direct04} label="U CB" />
            <WirePath
              d="M 56 292 L 56 306 L 200 306 L 200 264 L 280 264"
              state={hl.tsCurrent.C}
              phase="C"
            />
            <WirePath
              d="M 100 292 L 100 318 L 220 318 L 220 264 L 280 264"
              state={hl.tsCurrent.C}
              phase="C"
            />
            <WirePath d="M 154 286 L 154 264 L 310 264" state={hl.tnVoltage.C} phase="C" />
          </>
        )}

        {/* Нуль (лише 3 ТС) */}
        {is3 ? (
          <WirePath d="M 80 380 L 248 380 L 290 348" state="ok" phase="B" />
        ) : (
          <text x={400} y={400} textAnchor="middle" fill="#64748b" fontSize="9" fontStyle="italic">
            3-провідна лінія: нейтраль на схемі не показана
          </text>
        )}

        <text x={430} y={400} textAnchor="start" fill="#64748b" fontSize="8">
          Умовні позначення: Л1·Л2 — первинна ТС; И1·И2 — вторинна ТС
        </text>
      </svg>

      <ul className="mt-3 text-[11px] text-slate-500 space-y-1 list-disc list-inside">
        <li>
          <span className="text-emerald-400/90">OK / фаза</span> — норма;{' '}
          <span className="text-red-400">червоний</span> — помилка (REV_I / WRONG_U);{' '}
          <span className="text-amber-400">жовтий</span> — попередження (PHASE_SWAP / ASYM).
        </li>
        {!is3 ? (
          <li>Схема 2 ТС: струм ф. B відсутній; напруга U_B подається на клеми вимірювальних елементів (2 та 8).</li>
        ) : null}
      </ul>
    </div>
  );
}

export default MeterConnectionSchematic;
