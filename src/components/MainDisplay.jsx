import { Plus, Minus, Hand, VolumeX } from 'lucide-react';
import { ACCENT_TYPES, ACCENT_LABELS, clampBpm } from '../constants';

// Quick tempo steps, nearest to the middle first
const QUICK_STEPS = [4, 8, 12, 16];
const QUICK_BTN = 'flex-1 sm:flex-none min-w-0 sm:px-3 px-0 py-1 text-[13px] leading-[18px] bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition';

export function MainDisplay({
  bpm,
  setBpm,
  beatsPerBar,
  activeSubdiv,
  isPlaying,
  activeBeat,
  handleTapTempo,
  beatAccents,
  toggleBeatAccent
}) {
  return (
    <div className="w-full flex-1 flex flex-col items-center justify-between">
      {/* Big BPM Display */}
      <div className="text-center my-4">
        <div className="flex items-baseline justify-center gap-2">
          <span className="text-7xl md:text-8xl font-black font-mono tracking-tighter text-slate-100">{bpm}</span>
          <span className="text-slate-400 font-bold text-lg">BPM</span>
        </div>
      </div>

      {/* Main Beat Tile Grid with Clickable Accents */}
      <div className="w-full space-y-3">
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {Array.from({ length: beatsPerBar }).map((_, i) => {
            const isActive = isPlaying && activeBeat.beat === i;
            const accentType = beatAccents[i] !== undefined ? beatAccents[i] : (i === 0 ? ACCENT_TYPES.ACCENT : ACCENT_TYPES.NORMAL);

            let accentStyles = 'bg-slate-950 border-slate-800 text-slate-400';
            if (accentType === ACCENT_TYPES.ACCENT) { // Accented
              accentStyles = 'border-2 border-cyan-400 text-cyan-300 font-black shadow-md shadow-cyan-500/20';
            } else if (accentType === ACCENT_TYPES.NORMAL) { // Normal
              accentStyles = 'bg-slate-950 border border-slate-800 text-slate-300';
            } else if (accentType === ACCENT_TYPES.SOFT) { // Soft
              accentStyles = 'bg-slate-950/50 border border-slate-800/60 text-slate-400 scale-95';
            } else if (accentType === ACCENT_TYPES.MUTED) { // Muted
              accentStyles = 'bg-slate-950/30 border border-rose-900/40 text-rose-400 scale-90';
            }

            if (isActive && accentType !== ACCENT_TYPES.MUTED) {
              accentStyles = 'bg-cyan-500 text-slate-950 scale-110 shadow-lg shadow-cyan-500/50 font-black';
            }

            return (
              <button
                key={i}
                onClick={() => toggleBeatAccent(i)}
                title="Click to cycle: Accented -> Normal -> Soft -> Muted"
                aria-label={`Beat ${i + 1}: ${ACCENT_LABELS[accentType]}. Click to change accent`}
                className={`w-11 h-11 md:w-13 md:h-13 rounded-xl flex flex-col items-center justify-center font-mono transition-all duration-75 cursor-pointer relative ${accentStyles}`}
              >
                <span>{i + 1}</span>
                {accentType === ACCENT_TYPES.MUTED && <VolumeX className="w-3 h-3 text-rose-500 absolute bottom-1" />}
              </button>
            );
          })}
        </div>

        {/* Yellow Sub-tick Dot Tracker */}
        <div className="flex items-center justify-center gap-2 py-2">
          {Array.from({ length: activeSubdiv }).map((_, s) => {
            const isSubActive = isPlaying && activeBeat.sub === s;
            return (
              <div
                key={s} aria-hidden="true"
                className={`w-3 h-3 md:w-4 md:h-4 rounded-full transition-all duration-75 ${
                  isSubActive
                    ? 'bg-amber-400 scale-125 shadow-md shadow-amber-400/80'
                    : 'bg-slate-800'
                }`}
              />
            );
          })}
        </div>
      </div>

      {/* Slider & Quick Tempo Adjustments */}
      <div className="w-full space-y-3 mt-4">
        <div className="flex items-center gap-3">
          <button onClick={() => setBpm(b => Math.max(30, b - 1))} aria-label="Decrease BPM by 1" className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 transition">
            <Minus className="w-5 h-5" />
          </button>
          <input
            type="range" min="30" max="300" value={bpm} aria-label="Tempo in BPM"
            onChange={(e) => setBpm(Number(e.target.value))}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />
          <button onClick={() => setBpm(b => Math.min(300, b + 1))} aria-label="Increase BPM by 1" className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 transition">
            <Plus className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-1 sm:flex-none gap-1 sm:gap-1.5 order-1">
            {[...QUICK_STEPS].reverse().map((n) => (
              <button key={n} onClick={() => setBpm((b) => clampBpm(b - n))} aria-label={`Decrease BPM by ${n}`} className={QUICK_BTN}>-{n}</button>
            ))}
          </div>
          <button onClick={handleTapTempo} className="order-3 w-full sm:w-auto sm:order-2 px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-cyan-500/20 text-cyan-400 text-xs font-semibold flex items-center justify-center gap-1.5 border border-slate-700">
            <Hand className="w-3.5 h-3.5" /> Tap Tempo
          </button>
          <div className="flex flex-1 sm:flex-none gap-1 sm:gap-1.5 order-2 sm:order-3">
            {QUICK_STEPS.map((n) => (
              <button key={n} onClick={() => setBpm((b) => clampBpm(b + n))} aria-label={`Increase BPM by ${n}`} className={QUICK_BTN}>+{n}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}