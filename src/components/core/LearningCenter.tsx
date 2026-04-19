import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  ChevronRight,
  Search,
  X,
} from 'lucide-react';
import {
  CATEGORY_META,
  LEARNING_TOPICS,
  LEVEL_META,
  type LearningTopic,
  type TopicCategory,
} from './learningTopics';

interface LearningCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

const READ_STORAGE_KEY = 'vector_analyzer_learning_read_v1';

const CATEGORY_ORDER: TopicCategory[] = ['basics', 'practice', 'advanced', 'reference'];

function loadReadIds(): Set<string> {
  try {
    const raw = localStorage.getItem(READ_STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

function saveReadIds(ids: Set<string>) {
  try {
    localStorage.setItem(READ_STORAGE_KEY, JSON.stringify([...ids]));
  } catch {
    /* ignore */
  }
}

export function LearningCenter({ isOpen, onClose }: LearningCenterProps) {
  const [activeId, setActiveId] = useState<string>(LEARNING_TOPICS[0]?.id ?? 'intro');
  const [query, setQuery] = useState('');
  const [readIds, setReadIds] = useState<Set<string>>(() => loadReadIds());
  const contentRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const markRead = useCallback((id: string) => {
    setReadIds((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      saveReadIds(next);
      return next;
    });
  }, []);

  // Mark as read a short moment after topic opens (so navigation without reading does not count)
  useEffect(() => {
    if (!isOpen) return;
    const t = window.setTimeout(() => markRead(activeId), 900);
    return () => window.clearTimeout(t);
  }, [isOpen, activeId, markRead]);

  // Scroll content to top when switching topic
  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [activeId]);

  // Keyboard shortcuts: Esc to close, ←/→ to move between topics, "/" to focus search
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      const tag = (e.target as HTMLElement | null)?.tagName;
      const isEditable = tag === 'INPUT' || tag === 'TEXTAREA';
      if (e.key === '/' && !isEditable) {
        e.preventDefault();
        searchRef.current?.focus();
        return;
      }
      if (isEditable) return;
      const idx = LEARNING_TOPICS.findIndex((t) => t.id === activeId);
      if (idx < 0) return;
      if (e.key === 'ArrowRight' || e.key === 'j' || e.key === 'J') {
        e.preventDefault();
        const next = LEARNING_TOPICS[Math.min(LEARNING_TOPICS.length - 1, idx + 1)];
        if (next) setActiveId(next.id);
      }
      if (e.key === 'ArrowLeft' || e.key === 'k' || e.key === 'K') {
        e.preventDefault();
        const prev = LEARNING_TOPICS[Math.max(0, idx - 1)];
        if (prev) setActiveId(prev.id);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, activeId, onClose]);

  const filtered = useMemo<LearningTopic[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return LEARNING_TOPICS;
    return LEARNING_TOPICS.filter((t) => {
      const hay = [
        t.title,
        t.subtitle,
        ...(t.keywords ?? []),
        CATEGORY_META[t.category].label,
      ].join(' ').toLowerCase();
      return hay.includes(q);
    });
  }, [query]);

  const grouped = useMemo(() => {
    const map = new Map<TopicCategory, LearningTopic[]>();
    CATEGORY_ORDER.forEach((c) => map.set(c, []));
    filtered.forEach((t) => map.get(t.category)?.push(t));
    return map;
  }, [filtered]);

  const currentIdx = LEARNING_TOPICS.findIndex((t) => t.id === activeId);
  const current = LEARNING_TOPICS[currentIdx] ?? LEARNING_TOPICS[0];
  const prev = currentIdx > 0 ? LEARNING_TOPICS[currentIdx - 1] : null;
  const next = currentIdx < LEARNING_TOPICS.length - 1 ? LEARNING_TOPICS[currentIdx + 1] : null;

  const progressPct = Math.round((readIds.size / LEARNING_TOPICS.length) * 100);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center p-2 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="learning-center-title"
    >
      <div className="absolute inset-0 bg-[#020617]/95 backdrop-blur-2xl animate-modal-fade-in" onClick={onClose} />

      <div className="relative bg-[#0b1120] border border-slate-800/60 w-full max-w-6xl h-[94vh] rounded-[2.5rem] shadow-[0_0_120px_rgba(29,78,216,0.15)] flex flex-col md:flex-row overflow-hidden animate-zoom-in">
        {/* ─── Navigation Sidebar ─────────────────────────────── */}
        <aside className="w-full md:w-80 border-b md:border-b-0 md:border-r border-slate-800/60 flex flex-col bg-[#0b1120]/40 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 blur-[100px] -z-10" />

          {/* Sidebar header */}
          <div className="px-6 pt-6 pb-3 flex items-center gap-3">
            <div className="bg-blue-600/10 p-2.5 rounded-2xl border border-blue-500/20">
              <BookOpen className="text-blue-400" size={22} />
            </div>
            <div className="flex flex-col min-w-0">
              <h2 id="learning-center-title" className="text-sm font-black uppercase tracking-widest text-white">
                Академія
              </h2>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">
                Technical Academy
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="px-6 pb-3">
            <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1.5">
              <span>Прогрес</span>
              <span className="text-blue-300">{readIds.size} / {LEARNING_TOPICS.length}</span>
            </div>
            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {/* Search */}
          <div className="px-6 pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
              <input
                ref={searchRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Пошук (натисніть /)"
                aria-label="Пошук по темах"
                className="w-full bg-slate-900/70 border border-slate-700/60 rounded-xl pl-8 pr-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500/40"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  aria-label="Очистити пошук"
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-slate-200"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Topic list */}
          <nav className="flex-1 overflow-y-auto custom-scrollbar px-4 pb-5 space-y-4">
            {CATEGORY_ORDER.map((cat) => {
              const topics = grouped.get(cat) ?? [];
              if (topics.length === 0) return null;
              return (
                <div key={cat}>
                  <p className={`text-[10px] font-black uppercase tracking-widest px-3 pb-2 ${CATEGORY_META[cat].accent}`}>
                    {CATEGORY_META[cat].label}
                  </p>
                  <div className="flex flex-col gap-1">
                    {topics.map((topic) => {
                      const isActive = topic.id === activeId;
                      const isRead = readIds.has(topic.id);
                      return (
                        <button
                          key={topic.id}
                          type="button"
                          onClick={() => setActiveId(topic.id)}
                          className={`group flex items-start gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                            isActive
                              ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40'
                              : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100'
                          }`}
                        >
                          <span className={`${isActive ? 'text-white' : 'text-slate-500 group-hover:text-blue-300'} shrink-0 mt-0.5`}>
                            {topic.icon}
                          </span>
                          <span className="flex-1 min-w-0">
                            <span className="flex items-center gap-2">
                              <span className="text-[13px] font-bold truncate">{topic.title}</span>
                              {isRead && !isActive && (
                                <Check size={12} className="text-emerald-400 shrink-0" aria-label="Прочитано" />
                              )}
                            </span>
                            <span className="flex items-center gap-1.5 mt-0.5">
                              <span className={`w-1.5 h-1.5 rounded-full ${LEVEL_META[topic.level].dot}`} />
                              <span className={`text-[10px] uppercase tracking-wider font-bold ${isActive ? 'text-blue-100' : 'text-slate-600'}`}>
                                {LEVEL_META[topic.level].label}
                              </span>
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div className="px-3 py-6 text-center text-slate-500 text-xs">
                Нічого не знайдено. Спробуйте інший запит.
              </div>
            )}
          </nav>
        </aside>

        {/* ─── Content Area ───────────────────────────────────── */}
        <section className="flex-1 flex flex-col bg-[#0b1120]/20 overflow-hidden relative">
          {/* Header */}
          <header className="flex items-center justify-between px-6 md:px-10 pt-6 pb-4 shrink-0 border-b border-slate-800/40">
            <div className="flex items-center gap-3 min-w-0">
              <span className={`w-2 h-2 rounded-full ${LEVEL_META[current.level].dot}`} />
              <div className="min-w-0">
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                  {CATEGORY_META[current.category].label} • {LEVEL_META[current.level].label}
                </div>
                <h3 className="text-slate-200 font-bold text-sm md:text-base truncate">{current.title}</h3>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => prev && setActiveId(prev.id)}
                disabled={!prev}
                title={prev ? `Попередня: ${prev.title}` : 'Це перша тема'}
                aria-label="Попередня тема"
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/50 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
              >
                <ArrowLeft size={18} />
              </button>
              <button
                type="button"
                onClick={() => next && setActiveId(next.id)}
                disabled={!next}
                title={next ? `Наступна: ${next.title}` : 'Це остання тема'}
                aria-label="Наступна тема"
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/50 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
              >
                <ArrowRight size={18} />
              </button>
              <div className="w-px h-6 bg-slate-800 mx-1" />
              <button
                type="button"
                onClick={onClose}
                aria-label="Закрити Академію"
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all"
              >
                <X size={20} />
              </button>
            </div>
          </header>

          {/* Content */}
          <div
            ref={contentRef}
            className="flex-1 overflow-y-auto px-6 md:px-16 py-8 custom-scrollbar scroll-smooth"
          >
            <article className="max-w-3xl mx-auto text-slate-300 leading-relaxed space-y-2 animate-fade-in">
              {current.content}
            </article>

            {/* Prev / Next footer inside scrollable area */}
            <div className="max-w-3xl mx-auto mt-10 pt-6 border-t border-slate-800/50 grid sm:grid-cols-2 gap-3">
              {prev ? (
                <button
                  type="button"
                  onClick={() => setActiveId(prev.id)}
                  className="group text-left bg-slate-800/30 hover:bg-slate-800/60 border border-slate-700/40 rounded-2xl p-4 transition-all"
                >
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-1">
                    <ArrowLeft size={12} /> Попередня
                  </div>
                  <div className="text-sm font-bold text-slate-200 mt-1 group-hover:text-white truncate">
                    {prev.title}
                  </div>
                </button>
              ) : <div />}
              {next ? (
                <button
                  type="button"
                  onClick={() => setActiveId(next.id)}
                  className="group text-right bg-slate-800/30 hover:bg-slate-800/60 border border-slate-700/40 rounded-2xl p-4 transition-all"
                >
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-1 justify-end">
                    Наступна <ChevronRight size={12} />
                  </div>
                  <div className="text-sm font-bold text-slate-200 mt-1 group-hover:text-white truncate">
                    {next.title}
                  </div>
                </button>
              ) : <div />}
            </div>
          </div>

          {/* Footer meta */}
          <footer className="px-6 md:px-10 py-3 bg-[#0b1120]/80 border-t border-slate-800/40 flex flex-wrap items-center justify-between gap-3 shrink-0 backdrop-blur-md">
            <p className="text-slate-600 text-[10px] font-bold uppercase tracking-widest">
              Прогрес {progressPct}% • Esc — закрити • ← → перехід
            </p>
            <div className="flex gap-1">
              {LEARNING_TOPICS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveId(t.id)}
                  title={t.title}
                  aria-label={t.title}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    t.id === activeId
                      ? 'bg-blue-500 w-8'
                      : readIds.has(t.id)
                        ? 'bg-emerald-500/60 hover:bg-emerald-400 w-2.5'
                        : 'bg-slate-700 hover:bg-slate-500 w-2.5'
                  }`}
                />
              ))}
            </div>
          </footer>
        </section>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .shadow-glow {
          box-shadow: 0 0 15px #fff;
        }
      `}} />
    </div>
  );
}
