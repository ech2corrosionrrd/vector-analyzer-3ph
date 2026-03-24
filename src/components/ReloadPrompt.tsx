import React from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { RefreshCw, X } from 'lucide-react'

export function ReloadPrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r: ServiceWorkerRegistration | undefined) {
      console.log('SW Registered: ' + r)
    },
    onRegisterError(error: any) {
      console.log('SW registration error', error)
    },
  })

  const close = () => {
    setOfflineReady(false)
    setNeedRefresh(false)
  }

  if (!offlineReady && !needRefresh) return null

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] w-[90%] max-w-sm animate-zoom-in">
      <div className="bg-slate-950 border border-blue-500/30 p-5 rounded-[2rem] shadow-[0_0_50px_rgba(29,78,216,0.3)] backdrop-blur-2xl flex flex-col gap-4">
        <div className="flex items-start gap-4">
          <div className="bg-blue-600/20 p-3 rounded-2xl border border-blue-500/20 shadow-lg shadow-blue-900/10">
            <RefreshCw className={`text-blue-400 ${needRefresh ? 'animate-spin' : ''}`} size={24} />
          </div>
          <div className="flex-1 pt-1">
            <h4 className="text-white font-black text-sm uppercase tracking-wider">
              {needRefresh ? 'Доступне оновлення' : 'Готовий до офлайну'}
            </h4>
            <p className="text-slate-500 text-[11px] leading-relaxed mt-1">
              {needRefresh 
                ? 'Ми додали нові матеріали до Академії. Оновіть додаток зараз.' 
                : 'Додаток збережено в пам\'яті та готовий до роботи без інтернету.'}
            </p>
          </div>
          <button 
            onClick={close}
            className="p-2 text-slate-600 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
          >
            <X size={18} />
          </button>
        </div>
        
        {needRefresh && (
          <button
            onClick={() => updateServiceWorker(true)}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-3 rounded-2xl transition-all shadow-xl shadow-blue-900/40 active:scale-[0.98] uppercase text-[10px] tracking-widest"
          >
            Оновити зараз
          </button>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes zoomIn {
          from { opacity: 0; transform: scale(0.9) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-zoom-in {
          animation: zoomIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}} />
    </div>
  )
}
