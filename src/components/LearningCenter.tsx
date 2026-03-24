import React, { useState } from 'react';
import { X, BookOpen, ChevronRight, Zap, RefreshCcw, AlertTriangle, ArrowRight, HelpCircle, GraduationCap, Target, Info, Activity, ShieldCheck, FileText, Book, Lightbulb } from 'lucide-react';

interface LearningCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

type TopicId = 'intro' | 'physics' | 'math' | 'threephase' | 'power' | 'faults' | 'aron' | 'glossary' | 'faq';

interface Topic {
  id: TopicId;
  title: string;
  icon: React.ReactNode;
  level: 'Beginner' | 'Intermediate' | 'Expert';
}

const TOPICS: Topic[] = [
  { id: 'intro', title: 'Старт: Що це взагалі таке?', icon: <Target size={18} />, level: 'Beginner' },
  { id: 'physics', title: 'Фізика векторів', icon: <Activity size={18} />, level: 'Beginner' },
  { id: 'math', title: 'Математика мережі (√3)', icon: <FileText size={18} />, level: 'Intermediate' },
  { id: 'threephase', title: 'Трифазна система 101', icon: <RefreshCcw size={18} />, level: 'Beginner' },
  { id: 'power', title: 'Потужність (P, Q, S)', icon: <Zap size={18} />, level: 'Intermediate' },
  { id: 'faults', title: 'Діагностика (10+ випадків)', icon: <AlertTriangle size={18} />, level: 'Intermediate' },
  { id: 'aron', title: 'Спец-схеми (Арон)', icon: <ArrowRight size={18} />, level: 'Expert' },
  { id: 'glossary', title: 'Технічний Глосарій', icon: <Book size={18} />, level: 'Beginner' },
  { id: 'faq', title: 'Часті запитання (FAQ)', icon: <HelpCircle size={18} />, level: 'Beginner' },
];

export function LearningCenter({ isOpen, onClose }: LearningCenterProps) {
  const [activeTopic, setActiveTopic] = useState<TopicId>('intro');

  if (!isOpen) return null;

  const renderContent = () => {
    switch (activeTopic) {
      case 'intro':
        return (
          <div className="space-y-10 animate-fade-in pb-10">
            <div className="space-y-6">
              <h3 className="text-3xl font-black text-white tracking-tight flex items-center gap-4">
                <div className="bg-blue-600/20 p-3 rounded-2xl border border-blue-500/30">
                  <GraduationCap className="text-blue-400" size={32} />
                </div>
                Ласкаво просимо до Академії ВАФ
              </h3>
              <p className="text-slate-300 text-xl leading-relaxed font-medium">
                Ви тримаєте в руках не просто калькулятор, а професійний інструмент аналізу. 
                Цей посібник допоможе вам зрозуміти мову, якою «говорять» електричні мережі.
              </p>
            </div>

            <section className="space-y-6">
              <h4 className="text-white font-bold text-lg flex items-center gap-2">
                <div className="w-1.5 h-6 bg-blue-500 rounded-full" />
                Чому ми використовуємо саме вектори?
              </h4>
              <p className="text-slate-400 leading-relaxed">
                Струм і напруга в наших мережах — це **синусоїди**, що змінюються 50 разів на секунду. 
                Якби ми малювали їх графіками, діаграма була б захаращена хвилями, які важко порівнювати. 
                Вектори (фазори) дозволяють перетворити динамічну хвилю на статичну стрілку, що вказує лише на дві речі: 
                **скільки** там енергії (довжина) та **коли** вона досягає свого піку (кут).
              </p>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-blue-600/5 p-10 rounded-[3rem] border border-blue-500/10">
              <div className="space-y-6">
                <h4 className="text-blue-400 font-black text-xl uppercase tracking-tighter">Наочна аналогія</h4>
                <p className="text-slate-300 text-sm leading-relaxed">
                  Будь-яка фаза — це як <strong>педаль велосипеда</strong>. Коли ви крутите педалі, їхня висота постійно змінюється (синусоїда). 
                  Векторна діаграма — це вид збоку на зірочку велосипеда. Вона показує, що педалі розташовані під кутом 120° одна до одної. 
                  Навіть коли ви крутите дуже швидко, **кут між педалями не змінюється**. Саме це ми і фіксуємо.
                </p>
              </div>
              <div className="flex justify-center flex-col items-center gap-4 bg-slate-900/80 p-8 rounded-3xl shadow-inner border border-slate-800">
                <div className="relative w-40 h-40 border-4 border-slate-700/50 rounded-full flex items-center justify-center">
                   <div className="absolute w-1.5 h-16 bg-blue-500 rounded-full origin-bottom -translate-y-8 animate-[spin_3s_linear_infinite]" />
                   <div className="absolute w-1.5 h-12 bg-amber-500 rounded-full origin-bottom -translate-y-6 animate-[spin_3s_linear_infinite]" style={{ animationDelay: '-0.5s' }} />
                   <div className="absolute w-1.5 h-10 bg-emerald-500 rounded-full origin-bottom -translate-y-5 animate-[spin_3s_linear_infinite]" style={{ animationDelay: '-1.2s' }} />
                   <div className="w-3 h-3 bg-white rounded-full z-10 shadow-glow" />
                </div>
                <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest text-center mt-2">Модель обертання фаз (сповільнено)</span>
              </div>
            </div>

            <section className="bg-slate-800/20 p-8 rounded-3xl border border-slate-700/30 space-y-4">
              <h4 className="text-white font-bold flex items-center gap-2 text-sm"><Info size={18} className="text-blue-400" /> Порада для старту</h4>
              <p className="text-slate-400 text-sm leading-relaxed italic">
                "Якщо ви відчуваєте, що діаграма виглядає як хаотичний пучок стрілок — почніть з напруг. 
                Напруги завжди мають утворювати правильну, красиву зірку. Якщо це не так — проблема в підключенні напруги або фазуванні."
              </p>
            </section>
          </div>
        );
      case 'physics':
        return (
          <div className="space-y-10 animate-fade-in pb-10">
            <h3 className="text-3xl font-black text-white">Фізика та геометрія</h3>
            
            <section className="space-y-6 text-slate-300">
              <p className="text-lg leading-relaxed">
                Кожен вектор на екрані — це математична модель реального фізичного процесу.
              </p>
              
              <div className="grid grid-cols-1 gap-6">
                <div className="bg-slate-800/40 p-10 rounded-[2.5rem] border border-slate-700/50 flex flex-col md:flex-row gap-8 items-center">
                  <div className="flex-1 space-y-4">
                    <h4 className="text-white font-black text-xl">1. Амплітуда (Довжина)</h4>
                    <p className="text-slate-400 text-sm leading-relaxed">
                      Це енергетичний потенціал. На діаграмі довжина стрілки пропорційна <strong>діючому значенню</strong> (RMS). 
                    </p>
                    <div className="bg-blue-600/10 p-6 rounded-2xl border border-blue-500/20 space-y-2">
                       <h5 className="text-blue-400 font-bold text-xs uppercase flex items-center gap-2">
                          <Lightbulb size={14} /> Що таке RMS (Діюче значення)?
                       </h5>
                       <p className="text-[11px] text-slate-500 leading-normal">
                          Це ефективне значення змінного струму. Наприклад, якщо ми кажемо "220 Вольт", то амплітудний пік хвилі насправді сягає 311 Вольт. Але ми використовуємо 220, бо саме таку "корисну" роботу (нагрів) виконує цей струм порівняно з постійним. ВАФ завжди показує саме RMS.
                       </p>
                    </div>
                  </div>
                  <div className="w-full md:w-64 bg-slate-950 p-6 rounded-3xl border border-slate-800 flex items-center justify-center">
                    <svg width="160" height="120" viewBox="0 0 160 120">
                      <line x1="20" y1="100" x2="140" y2="40" stroke="#3b82f6" strokeWidth="6" strokeLinecap="round" />
                      <polygon points="135 35, 145 35, 140 45" fill="#60a5fa" transform="rotate(27, 140, 40)" />
                      <text x="70" y="30" fill="#3b82f6" fontSize="10" fontWeight="black" textAnchor="middle">RMS ЗНАЧЕННЯ</text>
                    </svg>
                  </div>
                </div>

                <div className="bg-slate-800/40 p-10 rounded-[2.5rem] border border-slate-700/50 flex flex-col md:flex-row-reverse gap-8 items-center">
                  <div className="flex-1 space-y-4">
                    <h4 className="text-white font-black text-xl">2. Фаза (Кут)</h4>
                    <p className="text-slate-400 text-sm leading-relaxed">
                      Це час. Оскільки все обертається, кут показує, наскільки одна фаза відстає від іншої. 
                    </p>
                    <div className="bg-amber-600/10 p-6 rounded-2xl border border-amber-500/20 space-y-2">
                       <h5 className="text-amber-400 font-bold text-xs uppercase flex items-center gap-2">
                          <Lightbulb size={14} /> Чому 0° — це Фаза А?
                       </h5>
                       <p className="text-[11px] text-slate-500 leading-normal">
                          В електротехніці ми маємо вибрати "якір" — нерухому точку відліку. Ми домовляємося, що в момент, коли ми робимо "фото" діаграми, вектор фази А знаходиться на вершині (0° або 12-та година). Всі інші стрілки (B, C та струми) малюються відносно цієї позиції.
                       </p>
                    </div>
                  </div>
                  <div className="w-full md:w-64 bg-slate-950 p-6 rounded-3xl border border-slate-800 flex items-center justify-center">
                    <svg width="120" height="120" viewBox="0 0 120 120">
                      <circle cx="60" cy="60" r="50" fill="none" stroke="#1e293b" strokeWidth="1" strokeDasharray="4,2" />
                      <line x1="60" y1="60" x2="60" y2="20" stroke="#fbbf24" strokeWidth="4" />
                      <text x="60" y="15" fill="#fbbf24" fontSize="10" textAnchor="middle" fontWeight="black">0° (ФАЗА А)</text>
                    </svg>
                  </div>
                </div>
              </div>
            </section>
          </div>
        );
      case 'math':
        return (
          <div className="space-y-10 animate-fade-in pb-10">
            <h3 className="text-3xl font-black text-white">Математика мережі та √3</h3>
            <p className="text-slate-300 text-lg">Кожне число в таблиці ВАФ має під собою залізну математичну логіку.</p>

            <div className="space-y-8">
              <section className="bg-slate-800/30 p-10 rounded-[2.5rem] border border-slate-800/60 space-y-6">
                <h4 className="text-white font-black text-xl">Зв'язок напруг (Геометрія)</h4>
                <div className="bg-slate-950/50 p-6 rounded-2xl border border-slate-800 space-y-4">
                  <div className="flex gap-4">
                     <div className="w-1 bg-blue-500 rounded-full" />
                     <p className="text-slate-400 text-sm">
                        Якщо ви з'єднаєте кінці двох стрілок напруги (A та B), ви отримаєте <strong>лінійну напругу AB</strong>. Математично це різниця двох фазних векторів.
                     </p>
                  </div>
                  <div className="bg-slate-900 p-8 rounded-3xl text-center space-y-2 border border-blue-500/20">
                    <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Магічне число √3</div>
                    <div className="text-3xl font-serif text-blue-400 italic">U<sub className="text-base font-sans">лін</sub> = U<sub className="text-base font-sans">ф</sub> × 1.732</div>
                    <p className="text-[11px] text-slate-600 italic">Це доведено через теорему косинусів для трикутника з кутом 120°.</p>
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <h4 className="text-white font-bold text-lg flex items-center gap-2">
                  <FileText className="text-slate-500" size={20} />
                  Коротко про комплексні числа
                </h4>
                <div className="bg-slate-800/20 p-8 rounded-3xl border border-slate-700/30 space-y-4">
                   <h5 className="text-white font-bold text-xs uppercase flex items-center gap-2">
                      <Lightbulb size={14} className="text-blue-400" /> Що це таке "чистою" мовою?
                   </h5>
                   <p className="text-slate-400 text-xs leading-relaxed">
                      У звичайній математиці 2 + 2 = 4. Але вектори не можна просто складати, бо вони дивляться в різні боки. 
                      Комплексні числа — це спосіб записати вектор як два числа: <strong>X (право-ліво)</strong> та <strong>Y (вгору-вниз)</strong>. 
                      Це дозволяє комп'ютеру "додавати" вектори, складаючи окремо їхні горизонтальні та вертикальні проекції.
                   </p>
                </div>
              </section>
            </div>
          </div>
        );
      case 'threephase':
        return (
          <div className="space-y-10 animate-fade-in pb-10">
            <h3 className="text-3xl font-black text-white">Стандарти та Маркування</h3>
            <p className="text-slate-300 text-lg">Чому ми використовуємо саме такі кольори та назви?</p>
            
            <div className="bg-slate-800/30 p-10 rounded-[3rem] border border-slate-700/30 space-y-6">
               <h4 className="text-white font-bold flex items-center gap-2">
                  <ShieldCheck size={20} className="text-blue-400" /> Державні стандарти (ПУЕ та ДСТУ)
               </h4>
               <div className="space-y-4 text-slate-400 text-sm leading-relaxed">
                  <p>
                    В Україні всі енергооб'єкти будуються за правилами <strong>ПУЕ (Правила улаштування електроустановок)</strong>. 
                    Саме ПУЕ визначає, що:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-xs">
                     <li><strong>Фаза А</strong> — маркується Жовтим кольором.</li>
                     <li><strong>Фаза B</strong> — маркується Зеленим кольором.</li>
                     <li><strong>Фаза C</strong> — маркується Червоним кольором.</li>
                     <li><strong>N (Нейтраль)</strong> — маркується Блакитним кольором.</li>
                  </ul>
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-[11px] text-slate-500 italic">
                     Примітка: В Європі (IEC) використовуються інші кольори (Коричневий, Чорний, Сірий), але цей аналізатор налаштований на вітчизняний стандарт Ж-З-Ч.
                  </div>
               </div>
            </div>

            <section className="bg-slate-950/50 p-10 rounded-[3rem] border border-slate-800 space-y-8">
               <h4 className="text-white font-black text-xl text-center">Ознаки правильної черговості</h4>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="p-6 bg-slate-900 rounded-2xl border border-slate-800">
                     <h5 className="text-white font-bold mb-2">Пряма послідовність (ABC)</h5>
                     <p className="text-slate-500 text-xs">Вектори йдуть один за одним за годинниковою стрілкою: Жовтий → Зелений → Червоний. Це норма для генераторів та двигунів.</p>
                  </div>
                  <div className="p-6 bg-red-950/10 rounded-2xl border border-red-900/20">
                     <h5 className="text-red-400 font-bold mb-2">Зворотна послідовність (CBA)</h5>
                     <p className="text-slate-500 text-xs text-balance">Порядок: Жовтий → Червоний → Зелений. Це змушує двигуни крутитися в інший бік і може викликати помилку лічильника.</p>
                  </div>
               </div>
            </section>
          </div>
        );
      case 'power':
        return (
          <div className="space-y-10 animate-fade-in pb-10">
            <h3 className="text-3xl font-black text-white">Розрахунок Потужності (P, Q, S)</h3>
            <p className="text-slate-300 text-lg leading-relaxed">
              Лічильник рахує не просто "електрику", а різні типи енергії. Ось як вони взаємодіють.
            </p>

            <div className="space-y-6">
               <div className="bg-emerald-600/5 border border-emerald-500/20 p-8 rounded-[2rem] space-y-4">
                  <h4 className="text-emerald-400 font-black text-xl">Активна потужність (P)</h4>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    Це та енергія, що перетворюється на тепло, світло або корисну механічну роботу. 
                    Вимірюється у <strong>Ваттах (Вт)</strong>. Хліб не спечеться без активної потужності.
                  </p>
               </div>

               <div className="bg-blue-600/5 border border-blue-500/20 p-8 rounded-[2rem] space-y-4">
                  <h4 className="text-blue-400 font-black text-xl">Реактивна потужність (Q)</h4>
                  <p className="text-slate-400 text-sm leading-relaxed mb-4">
                    Це енергія, що "гуляє" між джерелом та споживачем для створення магнітних полів (у двигунах чи трансформаторах). 
                    Вона не гріє чайник, але займає місце в проводах. Вимірюється у <strong>Варах (вар)</strong>.
                  </p>
                  <div className="bg-slate-900 p-4 rounded-xl border border-blue-900/30 space-y-2">
                     <h5 className="text-[10px] text-blue-500 font-black uppercase flex items-center gap-2">
                        <Lightbulb size={12} /> Звідки береться Q?
                     </h5>
                     <p className="text-[11px] text-slate-500 italic">
                        Будь-яка котушка (двигун) запізнює струм. На діаграмі ми бачимо, як стрілка струму "відхиляється" від напруги. Чим більше це відхилення, тим вища реактивна потужність.
                     </p>
                  </div>
               </div>

               <div className="bg-slate-800/20 border border-slate-700/30 p-8 rounded-[2rem] space-y-4">
                  <h4 className="text-white font-black text-xl">Повна потужність (S)</h4>
                  <p className="text-slate-400 text-sm">Геометрична сума P та Q. Вимірюється у <strong>Вольт-амперах (ВА)</strong>.</p>
                  <div className="bg-slate-950 p-6 rounded-2xl flex items-center justify-center border border-slate-800 relative">
                     <div className="absolute top-2 right-4 text-[10px] text-slate-700 font-mono italic">S² = P² + Q²</div>
                     <svg width="120" height="90" viewBox="0 0 120 90">
                        <line x1="10" y1="80" x2="90" y2="80" stroke="#10b981" strokeWidth="4" />
                        <line x1="90" y1="80" x2="90" y2="20" stroke="#3b82f6" strokeWidth="4" />
                        <line x1="10" y1="80" x2="90" y2="20" stroke="#a855f7" strokeWidth="4" strokeDasharray="4,2" />
                        <text x="50" y="88" fill="#10b981" fontSize="10" fontWeight="black" textAnchor="middle">P (АКТИВ)</text>
                        <text x="100" y="55" fill="#3b82f6" fontSize="10" fontWeight="black" transform="rotate(-90, 100, 55)">Q (РЕАКТИВ)</text>
                     </svg>
                  </div>
               </div>
            </div>
          </div>
        );
      case 'faults':
        return (
          <div className="space-y-12 animate-fade-in pb-20">
             <div className="space-y-4">
               <h3 className="text-3xl font-black text-white flex items-center gap-4">
                  <AlertTriangle className="text-red-500" size={36} />
                  Бібліотека несправностей
               </h3>
               <p className="text-slate-300 text-xl">Короткі та зрозумілі пояснення професійних термінів.</p>
             </div>

             <div className="space-y-8">
                <div className="bg-red-950/20 border border-red-500/20 p-10 rounded-[3rem] space-y-6">
                   <h4 className="text-red-400 font-black text-xl">1. [REV_I] — Зворотна полярність</h4>
                   <p className="text-slate-400 text-sm leading-relaxed">
                      Струмова стрілка розвернута рівно на 180° відносно своєї фазної напруги.
                   </p>
                   <div className="bg-slate-950 p-6 rounded-2xl border border-red-900/40 space-y-3">
                      <h5 className="text-white font-bold text-xs uppercase flex items-center gap-2">
                         <Lightbulb size={14} className="text-red-400" /> Чому це стається? (Принцип ТС)
                      </h5>
                      <p className="text-[11px] text-slate-500 leading-normal">
                         Трансформатор струму має полярність: сторони К1 (вхід) та К2 (вихід). Якщо ви переплутали проводи на клемній колодці лічильника (поміняли І1 та І2 місцями), струм для лічильника «потече в інший бік». Це призводить до недообліку енергії.
                      </p>
                   </div>
                </div>

                <div className="bg-slate-800/40 border border-slate-700/50 p-10 rounded-[3rem] space-y-6">
                   <h4 className="text-white font-black text-xl">2. [LOW_U] — Перекіс або обрив напруги</h4>
                   <p className="text-slate-400 text-sm leading-relaxed">
                      Один вектор напруги має довжину менше 80% від інших.
                   </p>
                   <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-3">
                      <h5 className="text-white font-bold text-xs uppercase flex items-center gap-2">
                         <Lightbulb size={14} className="text-blue-400" /> Що перевірити?
                      </h5>
                      <p className="text-[11px] text-slate-500 leading-normal">
                         В першу чергу — високовольтні запобіжники на Трансформаторі Напруги (ТН). Якщо один запобіжник згорів, напруга на фазі зникає, хоча лінія може залишатися під навантаженням.
                      </p>
                   </div>
                </div>
             </div>
          </div>
        );
      case 'aron':
        return (
          <div className="space-y-10 animate-fade-in pb-20">
             <div className="flex items-center gap-4">
                <div className="bg-amber-600/20 p-3 rounded-2xl border border-amber-500/30">
                   <ArrowRight className="text-amber-400" size={32} />
                </div>
                <h3 className="text-3xl font-black text-white">Схема Арона: Фізика 2-х ТС</h3>
             </div>
             
             <section className="space-y-8">
                <p className="text-slate-300 text-lg leading-relaxed">
                   Як ми знаємо струм фази B, якщо на ній немає вимірювального трансформатора?
                </p>

                <div className="bg-blue-600/5 border border-blue-500/20 p-10 rounded-[3rem] space-y-6">
                   <h4 className="text-white font-bold flex items-center gap-2">
                      <Activity size={20} className="text-blue-400" /> II Закон Кірхгофа (Метод вузла)
                   </h4>
                   <p className="text-slate-400 text-sm leading-relaxed">
                      У трифазній мережі без нейтралі сума всіх струмів у будь-який момент часу дорівнює нулю. 
                      Це як три потоки води, що сходяться в одну точку — скільки влилося, стільки ж має вилитися.
                   </p>
                   <div className="bg-slate-950 p-10 rounded-3xl border border-blue-900/30 text-center space-y-4">
                      <div className="text-[10px] text-slate-600 font-black uppercase tracking-widest italic">Математичний закон збереження</div>
                      <div className="text-4xl font-serif text-blue-400">İ<sub className="text-xl">a</sub> + İ<sub className="text-xl">b</sub> + İ<sub className="text-xl">c</sub> = 0</div>
                      <p className="text-slate-500 text-[11px] italic">З цього випливає: İb = -(İa + İc)</p>
                   </div>
                </div>

                <div className="bg-amber-950/10 border border-amber-900/40 p-10 rounded-[3rem] space-y-4">
                   <h4 className="text-amber-400 font-bold uppercase tracking-widest text-xs">Чому ця схема небезпечна для новачків?</h4>
                   <p className="text-slate-400 text-sm leading-relaxed">
                      Схема Арона вимагає, щоб мережа була <strong>ізольованою</strong>. Якщо у вас є витік струму на землю (погана ізоляція), закон Кірхгофа перестає працювати і розрахунковий вектор Ib стає невірним. Аналізатор ВАФ підсвітить це як помилку [ASYM_ARON].
                   </p>
                </div>
             </section>
          </div>
        );
      case 'glossary':
        return (
          <div className="space-y-10 animate-fade-in pb-20">
             <h3 className="text-3xl font-black text-white flex items-center gap-4 uppercase tracking-tighter">
                <Book className="text-blue-400" size={32} />
                Технічний Глосарій
             </h3>

             <div className="grid grid-cols-1 gap-4">
                {[
                  { t: 'ПУЕ', d: 'Правила улаштування електроустановок. Основний нормативний документ енергетика, що визначає всі стандарти безпеки та монтажу.' },
                  { t: 'ГОСТ (ДСТУ)', d: 'Державний стандарт. Набір технічних вимог до точності приладів та методів вимірювань.' },
                  { t: 'RMS (Діюче)', d: 'Ефективне значення змінного струму, яке виконує таку саму корисну роботу, як і постійний струм. Відповідає показу на шкалі приладів.' },
                  { t: 'Фазор (Vector)', d: 'Графічна стрілка, що показує амплітуду та фазовий зсув електричної хвилі.' },
                  { t: 'Кирхгофа закони', d: 'Фундаментальні закони електричних кіл. II закон (щодо струмів) дозволяє нам розраховувати відсутні дані в схемі Арона.' },
                  { t: 'К1 / К2 (И1 / И2)', d: 'Маркування входів та виходів трансформатора струму. Визначає напрямок протікання енергії.' },
                  { t: 'Гармоніки', d: '"Сміття" в мережі. Частоти, що кратні 50 Гц, які виникають від роботи блоків живлення комп\'ютерів та іншої електроніки.' },
                  { t: 'Ізольована нейтраль', d: 'Режим роботи мережі 6-35 кВ, де точка з\'єднання фаз не має прямого зв\'язку з землею.' }
                ].map((item, i) => (
                  <div key={i} className="bg-slate-800/20 p-6 rounded-2xl border border-slate-800/60 flex gap-6 hover:bg-slate-800/40 transition-colors">
                     <div className="font-black text-xs text-blue-500 uppercase w-32 shrink-0 pt-1 tracking-tighter">{item.t}</div>
                     <p className="text-slate-400 text-xs leading-relaxed">{item.d}</p>
                  </div>
                ))}
             </div>
          </div>
        );
      case 'faq':
        return (
          <div className="space-y-10 animate-fade-in pb-20">
             <h3 className="text-3xl font-black text-white">Відповіді на запитання</h3>
             <div className="space-y-4">
                {[
                  { q: "Як користуватися програмою на підстанції без інтернету?", a: "Цей додаток — PWA. Це означає, що після першого відкриття в браузері він зберігається в пам'яті телефону. Натисніть «Додати на головний екран», і ви зможете запускати його навіть у підвалі підстанції без мережі." },
                  { q: "Чому ВАФ показує cos φ = 1.0, а діаграма трохи розвернута?", a: "Це може бути через похибку Трансформаторів Струму або особливості підключення. Також перевірте, чи не включено режим 'Схема Арона', де вектори завжди зміщені на 30°." },
                  { q: "Чи можна додати власні кольори для фаз?", a: "Наразі додаток жорстко налаштований на стандарт ПУЕ (Ж-З-Ч). Це зроблено для запобігання помилок при швидкій діагностиці." }
                ].map((faq, i) => (
                  <div key={i} className="group bg-slate-800/30 p-8 rounded-[2rem] border border-slate-700/20 space-y-4 hover:border-blue-500/30 transition-all">
                    <div className="flex gap-4 text-white font-black text-sm">
                      <div className="w-8 h-8 rounded-full bg-blue-600/10 flex items-center justify-center text-blue-400 shrink-0">?</div>
                      <span className="pt-1.5">{faq.q}</span>
                    </div>
                    <p className="text-slate-500 text-xs leading-relaxed ml-12">{faq.a}</p>
                  </div>
                ))}
             </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-2 sm:p-4">
      <div className="absolute inset-0 bg-[#020617]/95 backdrop-blur-2xl" onClick={onClose} />
      
      <div className="relative bg-[#0b1120] border border-slate-800/60 w-full max-w-6xl h-[94vh] rounded-[3rem] shadow-[0_0_120px_rgba(29,78,216,0.15)] flex flex-col md:flex-row overflow-hidden animate-zoom-in">
        
        {/* Navigation Sidebar */}
        <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-slate-800/60 p-8 flex flex-col bg-[#0b1120]/40 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 blur-[100px] -z-10" />
          
          <div className="flex items-center gap-4 text-blue-400 mb-12 pl-2">
            <div className="bg-blue-600/10 p-3 rounded-2xl border border-blue-500/20 shadow-lg shadow-blue-900/10">
               <BookOpen size={28} />
            </div>
            <div className="flex flex-col">
               <span className="font-black text-sm uppercase tracking-widest text-white">Self-Contained</span>
               <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">TECHNICAL ACADEMY</span>
            </div>
          </div>

          <nav className="flex flex-col gap-1.5 flex-1 overflow-y-auto custom-scrollbar pr-2 pb-6">
            <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest mb-4 px-4">Зміст посібника</p>
            {TOPICS.map((topic) => (
              <button
                key={topic.id}
                onClick={() => setActiveTopic(topic.id)}
                className={`group flex items-center gap-4 px-5 py-4 rounded-[1.25rem] transition-all text-left relative ${
                  activeTopic === topic.id 
                  ? 'bg-blue-600 text-white shadow-2xl shadow-blue-900/50 translate-x-1' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <div className={`${activeTopic === topic.id ? 'text-white' : 'text-slate-600 group-hover:text-blue-400'} transition-colors shrink-0`}>
                   {topic.icon}
                </div>
                <div className="flex flex-col min-w-0">
                   <span className="text-sm font-black truncate">{topic.title}</span>
                   <span className={`text-[9px] font-black uppercase tracking-tighter ${activeTopic === topic.id ? 'text-blue-200 opacity-80' : 'text-slate-700'}`}>
                      {topic.level}
                   </span>
                </div>
              </button>
            ))}
          </nav>

          <div className="pt-6 mt-6 border-t border-slate-800 pb-2">
             <div className="flex items-center gap-4 bg-slate-900/50 p-4 rounded-2xl border border-slate-800/50">
                <div className="w-10 h-10 rounded-xl bg-orange-600/10 flex items-center justify-center text-orange-500">
                   <Lightbulb size={20} />
                </div>
                <div className="flex flex-col max-w-[140px]">
                   <span className="text-[11px] text-slate-300 font-black leading-tight">Без пошукових систем</span>
                   <span className="text-[9px] text-slate-600">Все пояснено всередині</span>
                </div>
             </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col bg-[#0b1120]/20 overflow-hidden relative">
          {/* Header */}
          <div className="flex items-center justify-between p-8 md:p-12 shrink-0 relative z-20">
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                 {[1, 2, 3].map(i => <div key={i} className={`w-1 h-3 rounded-full ${i === 1 ? 'bg-blue-500' : 'bg-blue-500/20'}`} />)}
              </div>
              <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest ml-2">Навчальний модуль: {activeTopic.toUpperCase()}</span>
            </div>
            <button 
              onClick={onClose}
              className="p-4 text-slate-500 hover:text-white hover:bg-slate-800/50 rounded-2xl transition-all"
            >
              <X size={28} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-8 md:px-24 pb-20 custom-scrollbar scroll-smooth relative z-10">
            <div className="max-w-4xl mx-auto">
               {renderContent()}
            </div>
          </div>

          <div className="px-12 py-6 bg-[#0b1120]/80 border-t border-slate-800/40 flex justify-between items-center shrink-0 relative z-20 backdrop-blur-md">
             <p className="text-slate-600 text-[10px] font-black uppercase tracking-widest italic opacity-50">VectorAnalyzer Technical University • ver 2.1 (Self-Contained)</p>
             <div className="flex gap-2.5">
                {TOPICS.map((t, idx) => (
                   <div 
                    key={t.id} 
                    className={`h-1.5 rounded-full transition-all duration-500 ${t.id === activeTopic ? 'bg-blue-500 w-12' : 'bg-slate-800 w-3'}`}
                   />
                ))}
             </div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes zoomIn {
          from { opacity: 0; transform: scale(0.97) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-zoom-in {
          animation: zoomIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-fade-in {
          animation: fadeIn 0.8s ease-out forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(15px); filter: blur(5px); }
          to { opacity: 1; transform: translateY(0); filter: blur(0); }
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #1e293b;
          border-radius: 30px;
        }
        .shadow-glow {
          box-shadow: 0 0 15px #fff;
        }
      `}} />
    </div>
  );
}
