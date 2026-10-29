import { Keyboard } from 'lucide-react';

// Must match the key handler in Metronome.jsx
const SHORTCUTS = [
  { keys: ['Space'], action: 'Start / stop' },
  { keys: ['↑'], action: 'Tempo +1' },
  { keys: ['↓'], action: 'Tempo -1' },
  { keys: ['Shift', '↑'], action: 'Tempo +4' },
  { keys: ['Shift', '↓'], action: 'Tempo -4' },
  { keys: ['Alt', '↑'], action: 'Tempo +8' },
  { keys: ['Alt', '↓'], action: 'Tempo -8' },
  { keys: ['←'], action: 'Subdivision -1' },
  { keys: ['→'], action: 'Subdivision +1' },
  { keys: ['T'], action: 'Tap tempo' }
];

// Desktop only: hidden below the xl breakpoint and on touch-first devices
export function ShortcutsPanel() {
  return (
    <aside
      aria-label="Keyboard shortcuts"
      className="hidden xl:block pointer-coarse:hidden w-56 shrink-0 sticky top-6 bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl"
    >
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-3">
        <Keyboard className="w-4 h-4 text-cyan-400" aria-hidden="true" />
        <h2 className="font-bold text-sm text-slate-100">Shortcuts</h2>
      </div>

      <ul className="space-y-2">
        {SHORTCUTS.map(({ keys, action }) => (
          <li key={action} className="flex items-center justify-between gap-2 text-xs">
            <span className="text-slate-300">{action}</span>
            <span className="flex items-center gap-1">
              {keys.map((k) => (
                <kbd
                  key={k}
                  className="min-w-6 px-1.5 py-0.5 text-center text-[11px] font-mono font-bold text-slate-200 bg-slate-950 border border-slate-700 rounded-md"
                >
                  {k}
                </kbd>
              ))}
            </span>
          </li>
        ))}
      </ul>

    </aside>
  );
}
