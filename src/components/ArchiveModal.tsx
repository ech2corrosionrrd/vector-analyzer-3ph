import React from 'react';
import { X, Trash2, FileText, Calendar, Zap, Activity, Download } from 'lucide-react';

interface ArchiveItem {
  id: string; // ISO string or timestamp
  title: string;
  date: string;
  mode: 'classic' | 'vaf';
  data: any;
}

interface ArchiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: ArchiveItem[];
  onLoad: (item: ArchiveItem) => void;
  onDelete: (id: string) => void;
  onExportAll?: () => void;
}

export const ArchiveModal: React.FC<ArchiveModalProps> = ({
  isOpen,
  onClose,
  items,
  onLoad,
  onDelete,
  onExportAll,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden shadow-blue-900/10">
        <header className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600/20 rounded-lg flex items-center justify-center text-blue-400">
              <FileText size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-100">Архів вимірювань</h2>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Ваші збережені записи</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
          >
            <X size={20} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {items.length === 0 ? (
            <div className="py-12 text-center space-y-4">
              <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-600">
                <FileText size={32} />
              </div>
              <div className="space-y-1">
                <p className="text-slate-400 font-medium">Архів порожній</p>
                <p className="text-xs text-slate-600">Натисніть «Зберегти» в аналізаторі, щоб додати запис</p>
              </div>
            </div>
          ) : (
            items.sort((a, b) => b.id.localeCompare(a.id)).map((item) => (
              <div
                key={item.id}
                className="group p-4 bg-slate-800/40 rounded-xl border border-slate-700/50 hover:border-blue-500/50 hover:bg-slate-800/60 transition-all flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    item.mode === 'vaf' ? 'bg-cyan-600/20 text-cyan-400' : 'bg-purple-600/20 text-purple-400'
                  }`}>
                    {item.mode === 'vaf' ? <Activity size={20} /> : <Zap size={20} />}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-slate-200 truncate group-hover:text-white transition-colors">
                      {item.title || 'Без назви'}
                    </h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="flex items-center gap-1 text-[11px] text-slate-500 whitespace-nowrap">
                        <Calendar size={12} /> {item.date}
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                        item.mode === 'vaf' ? 'bg-cyan-900/30 text-cyan-300' : 'bg-purple-900/30 text-purple-300'
                      }`}>
                        {item.mode === 'vaf' ? 'ВАФ' : 'Vector'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => onLoad(item)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-all shadow-lg shadow-blue-900/20"
                  >
                    Завантажити
                  </button>
                  <button
                    onClick={() => onDelete(item.id)}
                    className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                    title="Видалити"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && onExportAll && (
          <footer className="p-4 border-t border-slate-800 bg-slate-900/80">
            <button
              onClick={onExportAll}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all border border-slate-700"
            >
              <Download size={16} /> Експортувати весь архів (JSON)
            </button>
          </footer>
        )}
      </div>
    </div>
  );
};
