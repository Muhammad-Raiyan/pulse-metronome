import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, X } from 'lucide-react';

/**
 * Shows a slim banner at the bottom of the screen when a new service worker
 * has been installed and is waiting. The user can apply the update immediately
 * (reloads the page) or dismiss the banner (the new SW will activate on the
 * next natural reload).
 */
export function UpdateToast() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  if (!needRefresh) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-2.5 rounded-2xl shadow-xl border border-slate-700 bg-slate-900 text-slate-100 text-xs font-semibold"
    >
      <RefreshCw className="w-3.5 h-3.5 text-cyan-400 shrink-0" aria-hidden="true" />
      <span>App updated — reload to apply</span>
      <button
        onClick={() => updateServiceWorker(true)}
        className="px-2.5 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-colors cursor-pointer"
      >
        Reload
      </button>
      <button
        onClick={() => setNeedRefresh(false)}
        aria-label="Dismiss update notification"
        className="p-1 rounded-md text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
