import React from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Book,
  CheckCircle2,
  ClipboardList,
  FileText,
  GraduationCap,
  HelpCircle,
  Info,
  Lightbulb,
  Radio,
  RefreshCcw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Target,
  Zap,
} from 'lucide-react';

export type TopicLevel = 'Beginner' | 'Intermediate' | 'Expert';
export type TopicCategory = 'basics' | 'practice' | 'advanced' | 'reference';

export interface LearningTopic {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  level: TopicLevel;
  category: TopicCategory;
  /** Plain-text keywords that can be matched by the search box. */
  keywords: string[];
  content: React.ReactNode;
}

// ─── Reusable primitives ─────────────────────────────────────────────

const SectionTitle = ({ children, accent = 'blue' }: { children: React.ReactNode; accent?: 'blue' | 'amber' | 'emerald' | 'red' | 'purple' }) => {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-500',
    amber: 'bg-amber-500',
    emerald: 'bg-emerald-500',
    red: 'bg-red-500',
    purple: 'bg-purple-500',
  };
  return (
    <h4 className="text-white font-bold text-lg flex items-center gap-3 mt-8 mb-3">
      <span className={`w-1.5 h-6 rounded-full ${colorMap[accent]}`} />
      {children}
    </h4>
  );
};

const Callout = ({
  tone = 'blue',
  icon,
  title,
  children,
}: {
  tone?: 'blue' | 'amber' | 'emerald' | 'red' | 'slate';
  icon?: React.ReactNode;
  title?: React.ReactNode;
  children: React.ReactNode;
}) => {
  const tones: Record<string, string> = {
    blue: 'bg-blue-600/10 border-blue-500/20 text-blue-300',
    amber: 'bg-amber-600/10 border-amber-500/20 text-amber-300',
    emerald: 'bg-emerald-600/10 border-emerald-500/20 text-emerald-300',
    red: 'bg-red-600/10 border-red-500/20 text-red-300',
    slate: 'bg-slate-800/40 border-slate-700/50 text-slate-300',
  };
  return (
    <div className={`p-5 rounded-2xl border ${tones[tone]} space-y-2`}>
      {title ? (
        <h5 className="font-bold text-xs uppercase flex items-center gap-2">
          {icon ?? <Lightbulb size={14} />}
          {title}
        </h5>
      ) : null}
      <div className="text-[12.5px] leading-relaxed text-slate-300">{children}</div>
    </div>
  );
};

const Formula = ({ children, note }: { children: React.ReactNode; note?: React.ReactNode }) => (
  <div className="bg-slate-950 p-6 rounded-2xl border border-blue-900/30 text-center space-y-2">
    <div className="text-2xl sm:text-3xl font-serif text-blue-300">{children}</div>
    {note ? <p className="text-[11px] text-slate-500 italic">{note}</p> : null}
  </div>
);

const DefRow = ({ term, def }: { term: string; def: React.ReactNode }) => (
  <div className="bg-slate-800/20 p-5 rounded-2xl border border-slate-800/60 flex gap-5 hover:bg-slate-800/40 transition-colors">
    <div className="font-black text-xs text-blue-400 uppercase w-32 shrink-0 pt-1 tracking-tight">{term}</div>
    <p className="text-slate-300 text-[12.5px] leading-relaxed">{def}</p>
  </div>
);

const FaultCard = ({
  code,
  title,
  cause,
  indicators,
  fix,
}: {
  code: string;
  title: string;
  cause: string;
  indicators: string[];
  fix: string;
}) => (
  <div className="bg-red-950/15 border border-red-500/20 p-6 rounded-3xl space-y-3">
    <div className="flex items-baseline gap-3 flex-wrap">
      <span className="text-[10px] font-black uppercase tracking-widest text-red-400 bg-red-900/30 px-2 py-0.5 rounded">
        {code}
      </span>
      <h4 className="text-white font-black text-lg">{title}</h4>
    </div>
    <p className="text-slate-400 text-sm leading-relaxed">{cause}</p>
    <div className="grid sm:grid-cols-2 gap-3 pt-1">
      <div className="bg-slate-950/60 rounded-2xl p-4 border border-slate-800">
        <h5 className="text-amber-300 font-bold text-[11px] uppercase mb-2 flex items-center gap-2">
          <AlertTriangle size={12} /> Як побачити
        </h5>
        <ul className="text-[12px] text-slate-400 space-y-1 list-disc pl-4">
          {indicators.map((t, i) => <li key={i}>{t}</li>)}
        </ul>
      </div>
      <div className="bg-slate-950/60 rounded-2xl p-4 border border-slate-800">
        <h5 className="text-emerald-300 font-bold text-[11px] uppercase mb-2 flex items-center gap-2">
          <CheckCircle2 size={12} /> Що робити
        </h5>
        <p className="text-[12px] text-slate-400">{fix}</p>
      </div>
    </div>
  </div>
);

// ─── Topic contents ──────────────────────────────────────────────────

const IntroContent = () => (
  <div className="space-y-6">
    <h3 className="text-3xl font-black text-white tracking-tight flex items-center gap-4">
      <span className="bg-blue-600/20 p-3 rounded-2xl border border-blue-500/30">
        <GraduationCap className="text-blue-400" size={32} />
      </span>
      Ласкаво просимо до Академії
    </h3>
    <p className="text-slate-300 text-lg leading-relaxed">
      Ви тримаєте в руках професійний інструмент аналізу трифазних мереж. Ця Академія
      допоможе вам опанувати «мову», якою говорять векторні діаграми — від базової фізики
      і до тонкощів обліку електроенергії. Усі матеріали працюють офлайн.
    </p>

    <div className="grid md:grid-cols-3 gap-4">
      <div className="bg-slate-800/40 p-5 rounded-2xl border border-slate-700/40">
        <div className="text-blue-400 text-[10px] font-black uppercase tracking-widest">1. Основи</div>
        <p className="text-slate-300 text-sm mt-2">Вектори, RMS, √3, трифазна система, потужність P/Q/S.</p>
      </div>
      <div className="bg-slate-800/40 p-5 rounded-2xl border border-slate-700/40">
        <div className="text-amber-400 text-[10px] font-black uppercase tracking-widest">2. Практика</div>
        <p className="text-slate-300 text-sm mt-2">ТС, ТН, діагностика, помилки фазування, чек-лист на об'єкті.</p>
      </div>
      <div className="bg-slate-800/40 p-5 rounded-2xl border border-slate-700/40">
        <div className="text-purple-400 text-[10px] font-black uppercase tracking-widest">3. Поглиблено</div>
        <p className="text-slate-300 text-sm mt-2">Схема Арона, симетричні складові, гармоніки, режими нейтралі.</p>
      </div>
    </div>

    <SectionTitle>Чому саме вектори?</SectionTitle>
    <p className="text-slate-400 leading-relaxed">
      Струм та напруга в мережі — це синусоїди 50 Гц. Малювати їх «по точках» незручно,
      тому ми переходимо до фазорного подання: кожна синусоїда стає стрілкою, в якої
      є довжина (амплітуда, RMS) і кут (фазовий зсув у часі). Діаграма фазорів — це
      миттєвий «знімок» стану мережі, який легко читати.
    </p>

    <Callout tone="blue" icon={<Lightbulb size={14} />} title="Практична порада">
      Завжди починайте аналіз з напруг. Три вектори Uф мають бути приблизно рівними та
      рівномірно розподіленими (≈120°). Якщо зірка напруг вже «крива» — шукайте проблему
      в ТН, запобіжниках та фазуванні, а вже потім — у струмах.
    </Callout>
  </div>
);

const PhysicsContent = () => (
  <div className="space-y-6">
    <h3 className="text-3xl font-black text-white">Фізика та геометрія векторів</h3>
    <p className="text-slate-300 text-lg leading-relaxed">
      Кожен вектор на діаграмі — це пара чисел (модуль, кут) або (дійсна, уявна частини),
      що описує синусоїду фіксованої частоти.
    </p>

    <SectionTitle>Амплітуда (довжина)</SectionTitle>
    <p className="text-slate-400 leading-relaxed">
      Довжина стрілки пропорційна діючому (RMS) значенню. Для синусоїди
      U<sub>RMS</sub> = U<sub>m</sub> / √2, тобто для побутових 230 В амплітудне значення ≈ 325 В.
    </p>
    <Formula note="U(t) = U_m · sin(ωt + φ)">
      U<sub>RMS</sub> = U<sub>m</sub> / √2
    </Formula>

    <SectionTitle accent="amber">Фаза (кут)</SectionTitle>
    <p className="text-slate-400 leading-relaxed">
      Кут показує, на скільки одна синусоїда «випереджає» або «відстає» від іншої в часі.
      Різниця кутів між U та I однієї фази — це φ (кут навантаження). Саме від φ залежить
      cos φ і співвідношення активної/реактивної потужностей.
    </p>

    <SectionTitle accent="emerald">Запис фазора</SectionTitle>
    <div className="grid md:grid-cols-2 gap-4">
      <Formula>U̅ = U · e<sup>jφ</sup></Formula>
      <Formula>U̅ = U·cos φ + j·U·sin φ</Formula>
    </div>

    <Callout tone="amber" title="Обертання проти годинникової">
      У фізиці вектори обертаються проти годинникової стрілки (математичний додатний
      напрямок). Тому кажучи «фаза B відстає від A на 120°», ми малюємо її на
      <strong> −120°</strong> (або 240°) від фази A.
    </Callout>
  </div>
);

const MathContent = () => (
  <div className="space-y-6">
    <h3 className="text-3xl font-black text-white">Математика мережі та √3</h3>

    <SectionTitle>Від фазної до лінійної напруги</SectionTitle>
    <p className="text-slate-400 leading-relaxed">
      Лінійна напруга — це різниця двох фазних фазорів. Для симетричної системи кут між
      фазними напругами дорівнює 120°, тому модуль різниці завжди дорівнює √3 модуля фази:
    </p>
    <Formula note="Наслідок теореми косинусів при куті 120°">
      U<sub>л</sub> = √3 · U<sub>ф</sub> ≈ 1.732 · U<sub>ф</sub>
    </Formula>

    <div className="grid md:grid-cols-2 gap-4">
      <Callout tone="slate" title="Побутові приклади">
        230 В ↔ 400 В (230·√3 ≈ 398). 6.3 кВ ↔ 10.9 кВ. 10 кВ ↔ 17.3 кВ. У паспорті
        трансформаторів завжди вказують лінійну напругу.
      </Callout>
      <Callout tone="blue" title="Коли це не виконується">
        Перекоси фаз, обрив нейтралі, несиметричне навантаження порушують симетрію.
        Тоді |U<sub>AB</sub>|, |U<sub>BC</sub>|, |U<sub>CA</sub>| стануть різними.
      </Callout>
    </div>

    <SectionTitle accent="amber">Кругові частоти та миттєві значення</SectionTitle>
    <Formula>ω = 2π · f = 2π · 50 ≈ 314 рад/с</Formula>
    <p className="text-slate-400 leading-relaxed">
      За один період (T = 20 мс) фазор робить повний оберт 360°. Тому 1° кута ≈ 55.6 мкс у часі.
    </p>

    <SectionTitle accent="purple">Комплексне подання — коротко</SectionTitle>
    <p className="text-slate-400 leading-relaxed">
      Звичайні числа не «знають» про напрям, а фазори дивляться в різні боки. Комплексне
      число a + jb — це дві координати точки на площині. З ними можна проводити арифметику,
      бо додавання фазорів перетворюється на додавання їх дійсних і уявних частин окремо.
    </p>
  </div>
);

const ThreePhaseContent = () => (
  <div className="space-y-6">
    <h3 className="text-3xl font-black text-white">Трифазна система 101</h3>

    <SectionTitle>Чому саме три фази?</SectionTitle>
    <p className="text-slate-400 leading-relaxed">
      Три синусоїди, зсунуті на 120°, у сумі дають постійну у часі потужність (якщо
      навантаження симетричне). Це усуває пульсацію моменту в двигунах та робить передачу
      енергії дешевшою, ніж однофазна.
    </p>

    <SectionTitle accent="amber">Кольори та маркування (ПУЕ, Україна)</SectionTitle>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {[
        { name: 'Фаза A', sub: 'жовтий', dot: 'bg-yellow-400' },
        { name: 'Фаза B', sub: 'зелений', dot: 'bg-emerald-500' },
        { name: 'Фаза C', sub: 'червоний', dot: 'bg-red-500' },
        { name: 'N (нейтраль)', sub: 'блакитний', dot: 'bg-sky-400' },
      ].map((p) => (
        <div key={p.name} className="bg-slate-800/40 p-4 rounded-2xl border border-slate-700/40 flex items-center gap-3">
          <span className={`w-4 h-4 rounded-full ${p.dot} shadow-lg`} />
          <div>
            <div className="text-sm font-bold text-white">{p.name}</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-widest">{p.sub}</div>
          </div>
        </div>
      ))}
    </div>
    <Callout tone="slate" title="Порівняння з IEC">
      У Європі (IEC 60445) L1/L2/L3 — коричневий/чорний/сірий, PE — жовто-зелений,
      N — блакитний. Додаток використовує український стандарт Ж-З-Ч.
    </Callout>

    <SectionTitle accent="emerald">Чергування фаз</SectionTitle>
    <div className="grid md:grid-cols-2 gap-4">
      <div className="bg-emerald-950/20 p-5 rounded-2xl border border-emerald-500/20">
        <div className="font-black text-emerald-300 mb-1">Пряме (A → B → C)</div>
        <p className="text-[13px] text-slate-300">
          Нормальний режим. Вектори слідують проти годинникової стрілки (у фізичній
          традиції) з кроком 120°. Двигуни обертаються у розрахунковий бік.
        </p>
      </div>
      <div className="bg-red-950/20 p-5 rounded-2xl border border-red-500/20">
        <div className="font-black text-red-300 mb-1">Зворотне (A → C → B)</div>
        <p className="text-[13px] text-slate-300">
          Перепутані дві фази. Двигуни крутитимуться «не в той бік», облік може зменшувати
          значення. На діаграмі фази B і C помінялися місцями.
        </p>
      </div>
    </div>
  </div>
);

const PowerContent = () => (
  <div className="space-y-6">
    <h3 className="text-3xl font-black text-white">Потужність: P, Q, S, cos φ</h3>

    <div className="grid md:grid-cols-3 gap-4">
      <Callout tone="emerald" title="Активна P (Вт)">
        Перетворюється на тепло, світло, механічну роботу. Лічильник активної енергії
        (kWh) рахує саме інтеграл P у часі.
      </Callout>
      <Callout tone="blue" title="Реактивна Q (вар)">
        Обмінюється між джерелом та індуктивностями/ємностями для створення магнітних
        чи електричних полів. Не виконує корисної роботи, але «займає» переріз проводів.
      </Callout>
      <Callout tone="amber" title="Повна S (ВА)">
        Геометрична сума P та Q. Це «навантаження» на трансформатор і лінію.
      </Callout>
    </div>

    <SectionTitle>Основні формули</SectionTitle>
    <div className="grid md:grid-cols-2 gap-4">
      <Formula note="Для кожної фази">P = U<sub>ф</sub> · I · cos φ</Formula>
      <Formula note="Для кожної фази">Q = U<sub>ф</sub> · I · sin φ</Formula>
      <Formula>S = U<sub>ф</sub> · I</Formula>
      <Formula>S² = P² + Q²</Formula>
    </div>
    <Formula note="Симетричне трифазне, U_л — лінійна напруга">
      P<sub>3ф</sub> = √3 · U<sub>л</sub> · I · cos φ
    </Formula>

    <SectionTitle accent="amber">Трикутник потужностей</SectionTitle>
    <div className="bg-slate-950 p-6 rounded-2xl flex items-center justify-center border border-slate-800 relative">
      <div className="absolute top-2 right-4 text-[10px] text-slate-600 font-mono italic">tg φ = Q / P</div>
      <svg width="260" height="170" viewBox="0 0 260 170">
        <line x1="20" y1="140" x2="200" y2="140" stroke="#10b981" strokeWidth="4" />
        <line x1="200" y1="140" x2="200" y2="40" stroke="#3b82f6" strokeWidth="4" strokeDasharray="4,3" />
        <line x1="20" y1="140" x2="200" y2="40" stroke="#a855f7" strokeWidth="4" />
        <text x="110" y="158" fill="#10b981" fontSize="12" fontWeight="bold" textAnchor="middle">P, Вт</text>
        <text x="210" y="95" fill="#3b82f6" fontSize="12" fontWeight="bold">Q, вар</text>
        <text x="95" y="80" fill="#a855f7" fontSize="12" fontWeight="bold" transform="rotate(-28, 95, 80)">S, ВА</text>
        <path d="M 60 140 A 20 20 0 0 0 70 125" fill="none" stroke="#cbd5e1" strokeWidth="1.5" />
        <text x="72" y="132" fill="#cbd5e1" fontSize="11" fontStyle="italic">φ</text>
      </svg>
    </div>

    <SectionTitle accent="purple">Знак Q</SectionTitle>
    <div className="grid md:grid-cols-2 gap-4">
      <Callout tone="blue" title="Q &gt; 0 — індуктивний характер">
        Струм відстає від напруги. Типово для двигунів, трансформаторів, дроселів.
      </Callout>
      <Callout tone="amber" title="Q &lt; 0 — ємнісний характер">
        Струм випереджає напругу. Типово для конденсаторних установок, довгих ЛЕП у
        режимі малого навантаження.
      </Callout>
    </div>

    <SectionTitle accent="red">Коефіцієнт потужності</SectionTitle>
    <Formula note="Корисно: cos φ = 0.95 → φ ≈ 18°; cos φ = 0.8 → φ ≈ 37°">
      cos φ = P / S
    </Formula>
  </div>
);

const FaultsContent = () => (
  <div className="space-y-6">
    <h3 className="text-3xl font-black text-white flex items-center gap-3">
      <AlertTriangle className="text-red-500" size={32} /> Бібліотека несправностей
    </h3>
    <p className="text-slate-300 text-lg leading-relaxed">
      Типові помилки підключення обліку та порушення режиму, які зустрічаються на об'єктах.
    </p>

    <div className="space-y-4">
      <FaultCard
        code="REV_I"
        title="Зворотна полярність струмового кола"
        cause="Струмовий вектор фази розвернутий на ~180° відносно своєї напруги. φ ≈ 150–210°."
        indicators={[
          'На діаграмі I однієї фази «дивиться» у бік, протилежний U цієї ж фази',
          'cos φ цієї фази близький до −1',
          'Часто облік «крутиться назад» по одній з фаз',
        ]}
        fix="Поміняти місцями І1/І2 на вторинній обмотці ТС або коректно розшунтувати. При роботі — обов'язково закоротити вторинку ТС."
      />
      <FaultCard
        code="PHASE_SWAP"
        title="Переплутані фази"
        cause="Струмові проводи підключені не до своїх фаз (наприклад, І фази A — на клеми фази B). У розрахунку з'являється сильна зворотна послідовність I₂."
        indicators={[
          'На діаграмі порядок струмових векторів інший, ніж напругових',
          '|I₂| / |I₁| > 50% при видимій симетрії модулів',
          'Cos φ окремих фаз не відповідає типу навантаження (часто негативний)',
        ]}
        fix="Перевірити маркування вторинних жгутів, прозвонити від ТС до клемної колодки лічильника."
      />
      <FaultCard
        code="WRONG_U"
        title="Переплутані фази напруги"
        cause="Навпаки — струми підключені правильно, а напруги на клемі лічильника не відповідають своїм струмам."
        indicators={[
          'Нормальна зірка U, але cos φ «стрибає» — 0.3 на A, 0.9 на C',
          'Видима незначна асиметрія по струму',
          'Лічильник недооблічує',
        ]}
        fix="Виміряти чергування фаз фазоуказівником перед лічильником і відновити відповідність U ↔ I."
      />
      <FaultCard
        code="LOW_U"
        title="Перекіс або обрив напруги"
        cause="Один вектор напруги коротший за інші на 20% і більше, або рівний 0."
        indicators={[
          'Фазна напруга однієї фази < 80% номіналу',
          'Лінійна напруга з цією фазою впала сильніше, ніж фаза-фаза',
          'При обриві — нульовий вектор',
        ]}
        fix="Перевірити запобіжники ТН (вторинні, первинні), якість контакту на шинах клемника напруги."
      />
      <FaultCard
        code="ASYM"
        title="Асиметрія навантаження (перекіс)"
        cause="Струми фаз значно відрізняються (розкид > 30%) навіть при нормальних напругах."
        indicators={[
          'Одна фаза завантажена в рази більше за іншу',
          '|I₂|/|I₁| у межах 15–50%',
          'Ризик перекосу напруг у слабкій мережі',
        ]}
        fix="Перерозподілити однофазні навантаження між фазами. Для промислових ліній — перевірити стан ТС і дроселів."
      />
      <FaultCard
        code="HIGH_I0"
        title="Високий струм нульової послідовності"
        cause="|I₀| > 10% середнього струму. Часто вказує на замикання на землю або сильний перекіс."
        indicators={[
          'У результатах додатку виділяється рядок V₀/I₀',
          'У 6–10 кВ з ізольованою нейтраллю — спрацьовування сигналізації замикання на землю',
          'Нагрів нульового провідника',
        ]}
        fix="Перевірити ізоляцію кабелю, стан захисту від замикань на землю (ЗНЗ), розрядники, ОПН."
      />
      <FaultCard
        code="MISSING_I"
        title="Пропав струм по фазі"
        cause="У фазі фіксується 0 А (або близько до шуму), хоча інші фази під навантаженням."
        indicators={[
          'I_A ≈ 0 при I_B, I_C > номіналу',
          'Вектор струму відсутній на діаграмі',
          'Сильно спотворений розподіл P/Q по фазах',
        ]}
        fix="Перевірити цілісність вторинного кола ТС: поряд з І1/І2, стан клемників і розшуновування. УВАГА: обрив вторинки ТС під навантаженням створює небезпечну перенапругу."
      />
      <FaultCard
        code="SHORT_TS"
        title="Зашунтована вторинка ТС"
        cause="Вимірювальне коло замкнуто (забули зняти шунт після монтажу або замкнуло при випробуванні)."
        indicators={[
          'I на лічильнику дорівнює нулю',
          'Напруга в нормі',
          'Лічильник не враховує енергію',
        ]}
        fix="Зняти шунт. Перевірити положення перемикачів випробувальної клемної коробки (ВКК)."
      />
      <FaultCard
        code="ARON_NEUTRAL"
        title="Схема Арона з витоком на землю"
        cause="У схемі 2-ТС сума струмів нееквівалентна нулю через витоки. Розрахунок Ib = −(Ia + Ic) дає хибне значення."
        indicators={[
          "При 2-ТС з'являється «фіктивний» Ib",
          'Великі похибки обліку при очевидно здорових ТС',
          '|I₀| значне, але фізично не має бути в ізольованій мережі',
        ]}
        fix="Оцінити опір ізоляції кабелю мегомметром. Якщо витоки постійні — мережа не придатна для схеми Арона."
      />
      <FaultCard
        code="VT_DROP"
        title="Падіння напруги на вторинці ТН"
        cause="Довгі/тонкі кабелі від ТН до лічильника, поганий контакт — вимірювана U менша за реальну."
        indicators={[
          'Cos φ — нормальний, але P/Q меншає синхронно на всіх фазах',
          'Навіть при нормальному первинному рівні, Uсек < 100 В',
        ]}
        fix="Перевірити перетин та довжину кабелю (нормується ∆U ≤ 0.25% для класу 0.5), почистити клеми."
      />
      <FaultCard
        code="HARMONICS"
        title="Сильні вищі гармоніки (THD)"
        cause="Нелінійне навантаження (перетворювачі, зварювання, ЧРП) — вектор «чистої» 50 Гц не повністю описує сигнал."
        indicators={[
          'THD_U > 8%, THD_I > 20%',
          'cos φ і K<sub>P</sub> (істинний) значно розходяться',
          'Гудіння трансформатора, нагрів нульового проводу',
        ]}
        fix="Додати фільтри гармонік, активні компенсатори. Лічильники класу точності 0.5 і нижче — перевірити відповідність класу режиму."
      />
    </div>
  </div>
);

const AronContent = () => (
  <div className="space-y-6">
    <h3 className="text-3xl font-black text-white flex items-center gap-3">
      <ArrowRight className="text-amber-400" size={32} />
      Схема Арона (2 ТС)
    </h3>
    <p className="text-slate-300 text-lg leading-relaxed">
      Класична схема обліку для 3-провідних мереж без нейтралі (6–35 кВ, а також для
      симетричних промислових навантажень). Використовує лише два ТС замість трьох.
    </p>

    <SectionTitle>Основа — II закон Кірхгофа</SectionTitle>
    <Formula note="Тому достатньо виміряти два — третій обчислюється">
      İ<sub>A</sub> + İ<sub>B</sub> + İ<sub>C</sub> = 0
    </Formula>

    <SectionTitle accent="amber">Як рахує лічильник</SectionTitle>
    <p className="text-slate-400 leading-relaxed">
      Два елементи лічильника бачать добутки U<sub>AB</sub>·I<sub>A</sub> та U<sub>CB</sub>·I<sub>C</sub>.
      У симетричному режимі показ кожного зсунутий на 30° відносно «своєї» фазної потужності,
      але їх сума точно дорівнює трифазній активній потужності.
    </p>
    <Formula>P<sub>3ф</sub> = P<sub>AB</sub> + P<sub>CB</sub></Formula>

    <Callout tone="red" icon={<ShieldAlert size={14} />} title="Коли схема Арона неправильна">
      <ul className="list-disc pl-5 space-y-1 text-[12.5px]">
        <li>Є робочий нульовий провід (4-провідна мережа 0.4 кВ).</li>
        <li>Сильні витоки на землю, замикання на землю.</li>
        <li>Сильна несиметрія та високі гармоніки.</li>
        <li>Несиметричні однофазні навантаження в промисловому 6–10 кВ.</li>
      </ul>
    </Callout>

    <Callout tone="amber" title="Діагностика на практиці">
      У додатку схема <strong>2_TS</strong> припускає, що I<sub>B</sub> = −(I<sub>A</sub> + I<sub>C</sub>).
      Тому навіть якщо ви ввели I<sub>B</sub>, у розрахунку буде використано відновлений фазор.
      Це ідеально для польового ВАФ-контролю правильності підключення в схемі Арона.
    </Callout>
  </div>
);

const InstrumentsContent = () => (
  <div className="space-y-6">
    <h3 className="text-3xl font-black text-white">Вимірювальні трансформатори (ТС, ТН)</h3>
    <p className="text-slate-300 text-lg leading-relaxed">
      Лічильник працює з вторинними «масштабованими» значеннями: зазвичай 5 А (рідше 1 А)
      для струму та 100 В (рідше 100/√3 або 110 В) для напруги.
    </p>

    <SectionTitle>Трансформатор струму (ТС)</SectionTitle>
    <ul className="list-disc pl-6 text-slate-300 text-[13px] space-y-1">
      <li>Коефіцієнт K<sub>T</sub> = I<sub>прим</sub> / I<sub>сек</sub>.</li>
      <li>Полярність: <strong>Л1 → Л2</strong> (первинна), <strong>И1 → И2</strong> (вторинна). Енергія проходить від Л1 до Л2.</li>
      <li>Клас точності для комерційного обліку — 0.2S або 0.5S.</li>
      <li>Номінальна потужність обмотки (ВА) має перевищувати суму навантажень (лічильник + кабель).</li>
    </ul>
    <Callout tone="red" icon={<ShieldAlert size={14} />} title="Безпека роботи з ТС">
      Вторинна обмотка ТС <strong>ніколи не повинна бути розімкненою</strong> під навантаженням —
      це створює небезпечні перенапруги. Перед будь-якими роботами закоротіть вторинку
      штатним шунтом на ВКК.
    </Callout>

    <SectionTitle accent="amber">Трансформатор напруги (ТН)</SectionTitle>
    <ul className="list-disc pl-6 text-slate-300 text-[13px] space-y-1">
      <li>K<sub>V</sub> = U<sub>прим</sub> / U<sub>сек</sub>.</li>
      <li>Вторинна обмотка обов'язково заземлена (одна точка) і захищена запобіжниками з обох боків.</li>
      <li>Обрив запобіжника ТН = зникнення напруги однієї фази на лічильнику → недооблік.</li>
      <li>Типи: НОЛ, НАМИ, ЗНОЛ (3×1-ф), НТМИ (3-ф).</li>
    </ul>

    <SectionTitle accent="emerald">Загальний коефіцієнт обліку</SectionTitle>
    <Formula note="K — це коефіцієнт перетворення показань лічильника у первинні величини">
      K = K<sub>T</sub> · K<sub>V</sub>
    </Formula>
  </div>
);

const MetersContent = () => (
  <div className="space-y-6">
    <h3 className="text-3xl font-black text-white">Лічильники та точність</h3>

    <SectionTitle>Класи точності</SectionTitle>
    <ul className="list-disc pl-6 text-slate-300 text-[13px] space-y-1">
      <li><strong>0.2S / 0.5S</strong> — для обліку від ТС/ТН на межі балансової належності.</li>
      <li><strong>1.0 / 2.0</strong> — побутові та технічні потреби.</li>
      <li>«S» означає розширений діапазон вимірювання струму від 1% I<sub>ном</sub>.</li>
    </ul>

    <SectionTitle accent="amber">Типи лічильників у додатку</SectionTitle>
    <div className="grid md:grid-cols-2 gap-4">
      <Callout tone="slate" title="3-елементний (4-провідний)">
        Три окремі струмові/напружні пари, підходить для мереж з нейтраллю. У додатку —
        режим «3_TS», 11 клем з N/N.
      </Callout>
      <Callout tone="slate" title="2-елементний (3-провідний)">
        Для схеми Арона. Має 8 клем: A (І1/U/І2), U фази B, C (U/І1/І2), N. У додатку —
        режим «2_TS» при виборі 2 ТС.
      </Callout>
    </div>

    <SectionTitle accent="red">Перевірка на об'єкті</SectionTitle>
    <ul className="list-disc pl-6 text-slate-300 text-[13px] space-y-1">
      <li>Порівняти показники лічильника з незалежним ВАФ (додаток — саме такий інструмент).</li>
      <li>Звірити дату перевірки (наклейка/пломба).</li>
      <li>Зняти вектори і зберегти у архіві перед випробуванням.</li>
      <li>Після випробування — вивести обхід шунтів і перевірити діаграму ще раз.</li>
    </ul>
  </div>
);

const SafetyContent = () => (
  <div className="space-y-6">
    <h3 className="text-3xl font-black text-white flex items-center gap-3">
      <ShieldCheck className="text-emerald-400" size={32} /> Техніка безпеки
    </h3>
    <Callout tone="red" icon={<ShieldAlert size={14} />} title="Критично важливо">
      Усі роботи зі з'єднань у вторинних колах ТС, ТН та на клемній колодці лічильника
      виконуються відповідно до ПБЕЕС. Це професійний інструмент, а не «навчальна гра».
    </Callout>

    <SectionTitle>Золоті правила</SectionTitle>
    <ul className="list-disc pl-6 text-slate-300 text-[13px] space-y-1.5">
      <li>Перед роботою у вторинці ТС — завжди закоротити шунтом.</li>
      <li>Вторинні кола ТН захищати запобіжниками. Не знімати земляний провід.</li>
      <li>Не допускати короткого замикання у вторинці ТН.</li>
      <li>Використовувати ЗІЗ: діелектричні рукавички, інструмент з ізоляцією 1000 В.</li>
      <li>Роботи виконувати лише за нарядом-допуском або розпорядженням.</li>
      <li>Тримати дистанцію до струмоведучих частин (див. ПУЕ таблиця мінімальних відстаней).</li>
    </ul>

    <SectionTitle accent="amber">Перед включенням після робіт</SectionTitle>
    <ul className="list-disc pl-6 text-slate-300 text-[13px] space-y-1.5">
      <li>Зняти всі тимчасові шунти й закоротки.</li>
      <li>Візуально перевірити маркування кабелів І1/І2 та U.</li>
      <li>Звірити схему Арон/3-ТС відповідно до об'єкта.</li>
      <li>Перший знімок вектора — у цьому додатку, для архіву.</li>
    </ul>
  </div>
);

const QualityContent = () => (
  <div className="space-y-6">
    <h3 className="text-3xl font-black text-white">Якість електроенергії (ГОСТ 32144-2013)</h3>
    <p className="text-slate-300 text-lg leading-relaxed">
      Нормована якість електроенергії — це не лише напруга 230 В, а ще й форма
      хвилі, симетрія і стабільність частоти.
    </p>

    <SectionTitle>Ключові показники</SectionTitle>
    <div className="space-y-3">
      <DefRow term="U відхилення" def="Від номіналу допускається ±10% тривало і ±5% — у межах 95% часу тижня." />
      <DefRow term="Частота" def="49.8–50.2 Гц тривало, 49.5–50.5 Гц — у межах 100% часу тижня." />
      <DefRow term="K₂ (коеф. зворотної послідовності)" def={<>Має бути &le; 2% тривало, &le; 4% — у межах 5% часу.</>} />
      <DefRow term="K₀ (коеф. нульової послідовності)" def="Для 4-провідних мереж ≤ 2% тривало (для деяких режимів — 4%)." />
      <DefRow term="THD_U" def="Сумарний коефіцієнт гармонік напруги ≤ 8%." />
      <DefRow term="Провали та перенапруги" def="Класифікуються за тривалістю та глибиною (UIE/IEC 61000-4-30)." />
    </div>

    <Callout tone="blue" title="У додатку">
      У розділі «Результати аналізу» рядок «Показники якості» відображає K₂ та K₀
      з автоматичною перевіркою норм 2%/5%. Це спрощує складання актів перевірки якості.
    </Callout>
  </div>
);

const SymmCompContent = () => (
  <div className="space-y-6">
    <h3 className="text-3xl font-black text-white">Симетричні складові (Фортескью)</h3>
    <p className="text-slate-300 text-lg leading-relaxed">
      Будь-яку несиметричну систему з трьох фазорів можна розкласти на три симетричні:
      прямої, зворотної та нульової послідовностей. Це фундамент розрахунків коротких
      замикань і релейного захисту.
    </p>

    <Formula>a = e<sup>j120°</sup></Formula>
    <div className="grid md:grid-cols-3 gap-3">
      <Formula note="Прямої (симетричне поле)">V₁ = ⅓(V<sub>A</sub> + a·V<sub>B</sub> + a²·V<sub>C</sub>)</Formula>
      <Formula note="Зворотної">V₂ = ⅓(V<sub>A</sub> + a²·V<sub>B</sub> + a·V<sub>C</sub>)</Formula>
      <Formula note="Нульової">V₀ = ⅓(V<sub>A</sub> + V<sub>B</sub> + V<sub>C</sub>)</Formula>
    </div>

    <SectionTitle accent="amber">Фізичний зміст</SectionTitle>
    <div className="grid md:grid-cols-3 gap-3">
      <Callout tone="emerald" title="V₁ — пряма">
        Нормальна симетрична система. Має створювати обертальне поле у двигуні.
      </Callout>
      <Callout tone="red" title="V₂ — зворотна">
        Створює поле, що обертається у протилежний бік. Нагріває ротор, викликає вібрацію.
      </Callout>
      <Callout tone="amber" title="V₀ — нульова">
        Синфазні у всіх трьох фазах. Замикається через нейтраль / землю. Ознака замикання на землю.
      </Callout>
    </div>

    <Callout tone="blue" title="У додатку">
      На діаграмі «Складові 0–1–2» ви бачите модулі V₀/V₁/V₂ після нормування. У секції
      «Якість» автоматично рахуються K₂ = |V₂|/|V₁| і K₀ = |V₀|/|V₁|.
    </Callout>
  </div>
);

const HarmonicsContent = () => (
  <div className="space-y-6">
    <h3 className="text-3xl font-black text-white">Гармоніки та THD</h3>
    <p className="text-slate-300 text-lg leading-relaxed">
      Реальні сигнали в мережі рідко бувають ідеальними синусоїдами. Нелінійні
      споживачі (випрямлячі, ЧРП, імпульсні БЖ) створюють вищі гармоніки.
    </p>

    <SectionTitle>Сумарний коефіцієнт THD</SectionTitle>
    <Formula note="h — номер гармоніки, V_h — амплітуда гармоніки">
      THD = √(Σ<sub>h=2..N</sub> V<sub>h</sub>²) / V<sub>1</sub>
    </Formula>

    <SectionTitle accent="amber">Типові гармоніки</SectionTitle>
    <div className="grid sm:grid-cols-2 gap-3">
      <DefRow term="3-я (150 Гц)" def="Переважає у однофазних нелінійних навантаженнях. Кратна 3 — замикається в нулі." />
      <DefRow term="5-я (250 Гц)" def="Типова для 6-пульсних випрямлячів. Має зворотну послідовність — «гальмує» двигуни." />
      <DefRow term="7-я (350 Гц)" def="Також випрямлячі. Пряма послідовність — частково компенсує 5-у." />
      <DefRow term="11, 13" def="12-пульсні перетворювачі на потужних об'єктах." />
    </div>

    <Callout tone="red" title="Наслідки">
      Перегрів трансформаторів, небезпечне зростання струму в нулі (кратні 3-й), швидке
      старіння ізоляції конденсаторів, спрацьовування РЗА, збільшення втрат у кабелях.
    </Callout>

    <Callout tone="blue" title="Як бачити у ВАФ">
      Звичайний ВАФ показує лише 1-у гармоніку. Щоб виміряти THD, потрібен аналізатор
      якості електроенергії (наприклад Fluke 435/437, Hioki PQ3100).
    </Callout>
  </div>
);

const NeutralModesContent = () => (
  <div className="space-y-6">
    <h3 className="text-3xl font-black text-white">Режими нейтралі</h3>
    <p className="text-slate-300 text-lg leading-relaxed">
      Від режиму нейтралі залежить, як мережа поводиться при замиканні на землю — і які
      струми побачить ваш ВАФ.
    </p>

    <div className="grid md:grid-cols-2 gap-4">
      <div className="bg-slate-800/30 p-5 rounded-2xl border border-slate-700/40 space-y-2">
        <h4 className="text-emerald-300 font-bold">Глухозаземлена (0.4 кВ, 110/220 кВ)</h4>
        <p className="text-[13px] text-slate-300">
          Нейтраль напряму з'єднана з землею. При замиканні на землю — великі струми КЗ,
          швидке вимкнення захистом. Дозволена схема 3-ТС + N.
        </p>
      </div>
      <div className="bg-slate-800/30 p-5 rounded-2xl border border-slate-700/40 space-y-2">
        <h4 className="text-amber-300 font-bold">Ізольована (6–35 кВ, старі мережі)</h4>
        <p className="text-[13px] text-slate-300">
          Нейтраль не заземлена. При замиканні на землю — малі ємнісні струми, живлення
          зберігається. Потребує контролю ізоляції. Сприятлива для схеми Арона.
        </p>
      </div>
      <div className="bg-slate-800/30 p-5 rounded-2xl border border-slate-700/40 space-y-2">
        <h4 className="text-blue-300 font-bold">Компенсована (через ДГР)</h4>
        <p className="text-[13px] text-slate-300">
          Нейтраль через дугогасний реактор (котушка Петерсена). ДГР компенсує
          ємнісний струм замикання на землю, зменшуючи перенапруги.
        </p>
      </div>
      <div className="bg-slate-800/30 p-5 rounded-2xl border border-slate-700/40 space-y-2">
        <h4 className="text-red-300 font-bold">Через малий опір (R)</h4>
        <p className="text-[13px] text-slate-300">
          Нейтраль через резистор (10–40 Ом). Обмежує струм замикання і дозволяє надійну
          роботу захистів. Сучасний підхід для 10–20 кВ.
        </p>
      </div>
    </div>
  </div>
);

const ChecklistContent = () => (
  <div className="space-y-6">
    <h3 className="text-3xl font-black text-white flex items-center gap-3">
      <ClipboardList className="text-blue-400" size={32} /> Чек-лист польової перевірки
    </h3>

    <SectionTitle>Перед виїздом</SectionTitle>
    <ul className="list-disc pl-6 text-slate-300 text-[13px] space-y-1.5">
      <li>Перевірити наряд/розпорядження, наявність ЗІЗ, ключів, пломбіратора.</li>
      <li>Мати при собі: клещі струмовимірювальні, фазоуказівник, мегомметр, мультиметр.</li>
      <li>Відкрити архів попередніх замірів на цьому об'єкті (розділ «Архів»).</li>
    </ul>

    <SectionTitle accent="amber">На об'єкті</SectionTitle>
    <ol className="list-decimal pl-6 text-slate-300 text-[13px] space-y-1.5">
      <li>Зняти загальний вигляд клемної коробки лічильника (фото).</li>
      <li>Виміряти U<sub>AB</sub>, U<sub>BC</sub>, U<sub>CA</sub> на клемах лічильника.</li>
      <li>Фазоуказівником перевірити чергування фаз безпосередньо біля лічильника.</li>
      <li>Зняти струми I<sub>A</sub>, I<sub>B</sub>, I<sub>C</sub> клещами на вторинці ТС.</li>
      <li>Ввести всі дані у додаток; одразу переглянути діаграму та діагностику.</li>
      <li>Перевірити напрямок потоків потужності (споживання/віддача).</li>
      <li>Зберегти запис у архів (об'єкт, фідер, дата, тип лічильника).</li>
      <li>Згенерувати PDF-звіт для акту.</li>
    </ol>

    <SectionTitle accent="emerald">Після робіт</SectionTitle>
    <ul className="list-disc pl-6 text-slate-300 text-[13px] space-y-1.5">
      <li>Переконатися, що шунти зняті, кришки клемних коробок опломбовані.</li>
      <li>Зробити контрольний зняток ВАФ через 5–10 хв під навантаженням.</li>
      <li>Підписати акт на місці (з відповідальним за експлуатацію).</li>
    </ul>
  </div>
);

const ProTipsContent = () => (
  <div className="space-y-6">
    <h3 className="text-3xl font-black text-white flex items-center gap-3">
      <Sparkles className="text-amber-400" size={32} /> Лайфхаки інженера
    </h3>

    <div className="space-y-3">
      <Callout tone="blue" title="Аналіз у 3 кроки">
        1) Переконайтеся, що зірка U симетрична. 2) Перевірте, чи I відповідає U по фазах
        (правильний «слідство»). 3) Лише потім оцінюйте cos φ та потужності.
      </Callout>
      <Callout tone="amber" title="Швидкий тест Арона">
        У схемі 2-ТС: якщо cos φ_A ≈ cos φ_C і вони майже рівні − 30° від реального — схема
        працює. Якщо один «стоїть», а інший «крутиться» — прозвоніть ТС.
      </Callout>
      <Callout tone="emerald" title="Тепловий контроль">
        Перед роботою зі з'єднаннями пройдіть тепловізором по клемах. Нагріта клема
        часто видає погане з'єднання до того, як ВАФ його «побачить».
      </Callout>
      <Callout tone="blue" title="Збереження досвіду">
        Називайте записи в архіві осмислено: <em>ПС-Східна • фід-12 • після ремонту ТС-A</em>.
        Це зекономить години при повторних перевірках.
      </Callout>
      <Callout tone="red" title="Що робити при сумніві">
        Якщо діаграма виглядає «дивно», а поле показує нормальні напруги — перевірте
        ланцюги напруги (запобіжники ТН) ПЕРШ ніж копатись у струмах.
      </Callout>
    </div>
  </div>
);

const GlossaryContent = () => (
  <div className="space-y-6">
    <h3 className="text-3xl font-black text-white flex items-center gap-3">
      <Book className="text-blue-400" size={32} /> Глосарій
    </h3>
    <div className="grid grid-cols-1 gap-3">
      {[
        { t: 'ПУЕ', d: 'Правила улаштування електроустановок — основний нормативний документ у галузі енергетики.' },
        { t: 'ПБЕЕС', d: 'Правила безпечної експлуатації електроустановок споживачів.' },
        { t: 'ДСТУ / ГОСТ', d: 'Державні стандарти. Регламентують методи, класи точності, якість електроенергії.' },
        { t: 'ВКК', d: 'Випробувальна клемна коробка. Дозволяє закоротити вторинку ТС та відключити напругу без розриву кола.' },
        { t: 'ВАФ (ВАФ-85, ВАФ-87, тощо)', d: 'Прилад вимірювання векторних величин: модулі U, I, кути, потужність.' },
        { t: 'RMS', d: 'Ефективне (діюче) значення змінного струму або напруги.' },
        { t: 'Фазор', d: 'Комплексне число-стрілка, що описує синусоїду фіксованої частоти.' },
        { t: 'ТС', d: 'Трансформатор струму.' },
        { t: 'ТН', d: 'Трансформатор напруги.' },
        { t: 'ТОЛ / ТОЛ-СЕЩ', d: 'Литі трансформатори струму (сухі, для КРП і КРПЗ).' },
        { t: 'ТФЗМ / НАМИ', d: 'Масляні трансформатори струму / напруги для відкритих розподільних установок.' },
        { t: 'ЗНОЛ', d: 'Однофазний трансформатор напруги 3×1-ф (три ЗНОЛ утворюють 3-ф групу).' },
        { t: 'НТМИ', d: 'Трифазний трансформатор напруги (масляний).' },
        { t: 'К1 / К2 (И1 / И2)', d: 'Маркування полярних вводів/виводів ТС.' },
        { t: 'Схема Арона (2-ТС)', d: 'Облік у 3-провідній мережі без нейтралі з двома ТС.' },
        { t: 'cos φ', d: 'Коефіцієнт потужності, cos кута між U та I.' },
        { t: 'tg φ', d: 'Відношення Q/P. Використовується у технічних умовах на якість компенсації реактиву.' },
        { t: 'THD', d: 'Сумарний коефіцієнт гармонічних спотворень.' },
        { t: 'K₂, K₀', d: 'Коефіцієнти зворотної та нульової послідовностей (відсотки несиметрії).' },
        { t: 'I₀, V₀', d: 'Струм/напруга нульової послідовності. Індикатор замикання на землю.' },
        { t: 'ДГР', d: 'Дугогасний реактор (котушка Петерсена). Заземлення нейтралі через індуктивність.' },
        { t: 'РЗА', d: 'Релейний захист та автоматика.' },
        { t: 'ОПН', d: 'Обмежувач перенапруг нелінійний.' },
        { t: 'ЧРП', d: 'Частотно-регульований привод — джерело гармонік.' },
      ].map((item) => (
        <DefRow key={item.t} term={item.t} def={item.d} />
      ))}
    </div>
  </div>
);

const FaqContent = () => (
  <div className="space-y-6">
    <h3 className="text-3xl font-black text-white flex items-center gap-3">
      <HelpCircle className="text-blue-400" size={32} /> Часті запитання
    </h3>
    <div className="space-y-3">
      {[
        {
          q: 'Програма працює без інтернету?',
          a: 'Так. Це PWA. Після першого відкриття додаток кешується; наступні запуски — повністю офлайн. Можна «встановити» на домашній екран.',
        },
        {
          q: 'Чому показання cos φ у додатку відрізняються від лічильника?',
          a: 'Лічильник усереднює за більший період і враховує всі гармоніки. ВАФ показує «миттєву» картину першої гармоніки. Невелика розбіжність — норма.',
        },
        {
          q: 'У схемі 2-ТС ввів I_B, а додаток все одно рахує по-іншому?',
          a: 'Свідомо. За схемою Арона I_B відновлюється як −(I_A + I_C). Це дозволяє побачити розбіжність між «введеним» і «очікуваним» струмом і виявити витоки.',
        },
        {
          q: 'Як скопіювати діаграму в акт?',
          a: 'Натисніть «Експорт PDF» у хедері — ви отримаєте готовий звіт зі всіма вимірюваннями, діаграмою і діагностикою.',
        },
        {
          q: 'Чи можна поділитися архівом з колегою?',
          a: 'Відкрийте архів і натисніть «Експортувати весь архів (JSON)». Колега імпортує файл до свого додатку (функція у плані).',
        },
        {
          q: 'Чому на діаграмі струм у фазі B виглядає «тихим», а модуль не нульовий?',
          a: 'Найчастіше це занадто мала амплітуда I порівняно з іншими фазами, або шунт на вторинці ТС. Перевірте розділ «Діагностика».',
        },
        {
          q: 'Додаток не замінює лабораторну метрологію?',
          a: 'Саме так. Це професійний польовий інструмент первинного контролю. Лабораторні вимірювання на повіреній апаратурі залишаються еталоном.',
        },
      ].map((faq, i) => (
        <div key={i} className="bg-slate-800/30 p-5 rounded-2xl border border-slate-700/30">
          <div className="flex gap-3 text-white font-bold text-sm">
            <span className="w-7 h-7 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-400 shrink-0">?</span>
            <span className="pt-0.5">{faq.q}</span>
          </div>
          <p className="text-slate-400 text-[13px] leading-relaxed mt-2 ml-10">{faq.a}</p>
        </div>
      ))}
    </div>
  </div>
);

// ─── Topic catalogue ────────────────────────────────────────────────

export const LEARNING_TOPICS: LearningTopic[] = [
  {
    id: 'intro',
    title: 'Старт: Що це все таке?',
    subtitle: 'З чого почати знайомство',
    icon: <Target size={18} />,
    level: 'Beginner',
    category: 'basics',
    keywords: ['вступ', 'огляд', 'start'],
    content: <IntroContent />,
  },
  {
    id: 'physics',
    title: 'Фізика векторів',
    subtitle: 'Амплітуда, фаза, RMS',
    icon: <Activity size={18} />,
    level: 'Beginner',
    category: 'basics',
    keywords: ['rms', 'фазор', 'амплітуда', 'кут'],
    content: <PhysicsContent />,
  },
  {
    id: 'math',
    title: 'Математика мережі та √3',
    subtitle: 'Формули, фазна/лінійна',
    icon: <FileText size={18} />,
    level: 'Intermediate',
    category: 'basics',
    keywords: ['формули', 'квадратний корінь', 'напруга', 'лінійна'],
    content: <MathContent />,
  },
  {
    id: 'threephase',
    title: 'Трифазна система 101',
    subtitle: 'Кольори, чергування, ПУЕ',
    icon: <RefreshCcw size={18} />,
    level: 'Beginner',
    category: 'basics',
    keywords: ['пуе', 'кольори', 'abc', 'чергування'],
    content: <ThreePhaseContent />,
  },
  {
    id: 'power',
    title: 'Потужність (P, Q, S)',
    subtitle: 'Трикутник, cos φ',
    icon: <Zap size={18} />,
    level: 'Intermediate',
    category: 'basics',
    keywords: ['потужність', 'p', 'q', 's', 'cos', 'phi'],
    content: <PowerContent />,
  },
  {
    id: 'faults',
    title: 'Діагностика (11 випадків)',
    subtitle: 'REV_I, LOW_U, ASYM, ...',
    icon: <AlertTriangle size={18} />,
    level: 'Intermediate',
    category: 'practice',
    keywords: ['помилки', 'несправності', 'rev', 'wrong', 'діагностика'],
    content: <FaultsContent />,
  },
  {
    id: 'instruments',
    title: 'ТС та ТН',
    subtitle: 'Клас точності, схеми',
    icon: <Radio size={18} />,
    level: 'Intermediate',
    category: 'practice',
    keywords: ['тс', 'тн', 'трансформатор', 'полярність'],
    content: <InstrumentsContent />,
  },
  {
    id: 'meters',
    title: 'Лічильники та точність',
    subtitle: 'Класи 0.2S / 0.5S',
    icon: <FileText size={18} />,
    level: 'Intermediate',
    category: 'practice',
    keywords: ['лічильник', 'клас', 'облік'],
    content: <MetersContent />,
  },
  {
    id: 'safety',
    title: 'Техніка безпеки',
    subtitle: 'ПБЕЕС, ЗІЗ, наряд',
    icon: <ShieldCheck size={18} />,
    level: 'Beginner',
    category: 'practice',
    keywords: ['безпека', 'тб', 'пбеес', 'наряд', 'шунт'],
    content: <SafetyContent />,
  },
  {
    id: 'checklist',
    title: 'Чек-лист на об\u0027єкті',
    subtitle: 'Крок за кроком',
    icon: <ClipboardList size={18} />,
    level: 'Beginner',
    category: 'practice',
    keywords: ['чек-лист', 'перевірка', 'процедура'],
    content: <ChecklistContent />,
  },
  {
    id: 'aron',
    title: 'Схема Арона (2 ТС)',
    subtitle: 'Фізика 3-провідної мережі',
    icon: <ArrowRight size={18} />,
    level: 'Expert',
    category: 'advanced',
    keywords: ['арон', '2-тс', 'кірхгоф', '3-провід'],
    content: <AronContent />,
  },
  {
    id: 'symm',
    title: 'Симетричні складові',
    subtitle: 'V₀, V₁, V₂ (Фортескью)',
    icon: <Activity size={18} />,
    level: 'Expert',
    category: 'advanced',
    keywords: ['фортеск', 'симетричні', 'послідовність', 'k2', 'k0'],
    content: <SymmCompContent />,
  },
  {
    id: 'harmonics',
    title: 'Гармоніки, THD',
    subtitle: 'Нелінійні навантаження',
    icon: <Activity size={18} />,
    level: 'Expert',
    category: 'advanced',
    keywords: ['гармоніки', 'thd', 'чрп', 'нелінійне'],
    content: <HarmonicsContent />,
  },
  {
    id: 'neutral-modes',
    title: 'Режими нейтралі',
    subtitle: 'Глухо/ізольована/ДГР',
    icon: <ShieldAlert size={18} />,
    level: 'Expert',
    category: 'advanced',
    keywords: ['нейтраль', 'дгр', 'петерсена', 'ізольована'],
    content: <NeutralModesContent />,
  },
  {
    id: 'quality',
    title: 'Якість електроенергії',
    subtitle: 'ГОСТ 32144, K₂, K₀',
    icon: <Info size={18} />,
    level: 'Intermediate',
    category: 'advanced',
    keywords: ['якість', 'гост', '32144', 'норма'],
    content: <QualityContent />,
  },
  {
    id: 'tips',
    title: 'Лайфхаки інженера',
    subtitle: 'Перевірене на практиці',
    icon: <Sparkles size={18} />,
    level: 'Intermediate',
    category: 'practice',
    keywords: ['лайфхак', 'поради', 'практика'],
    content: <ProTipsContent />,
  },
  {
    id: 'glossary',
    title: 'Глосарій',
    subtitle: '24 терміни енергетика',
    icon: <Book size={18} />,
    level: 'Beginner',
    category: 'reference',
    keywords: ['словник', 'глосарій', 'терміни'],
    content: <GlossaryContent />,
  },
  {
    id: 'faq',
    title: 'Часті запитання',
    subtitle: 'FAQ, відповіді',
    icon: <HelpCircle size={18} />,
    level: 'Beginner',
    category: 'reference',
    keywords: ['faq', 'питання', 'відповіді'],
    content: <FaqContent />,
  },
];

export const CATEGORY_META: Record<TopicCategory, { label: string; accent: string }> = {
  basics: { label: 'Основи', accent: 'text-blue-400' },
  practice: { label: 'Практика', accent: 'text-amber-400' },
  advanced: { label: 'Поглиблено', accent: 'text-purple-400' },
  reference: { label: 'Довідка', accent: 'text-emerald-400' },
};

export const LEVEL_META: Record<TopicLevel, { label: string; dot: string }> = {
  Beginner: { label: 'Базовий', dot: 'bg-emerald-500' },
  Intermediate: { label: 'Середній', dot: 'bg-amber-500' },
  Expert: { label: 'Експерт', dot: 'bg-purple-500' },
};
