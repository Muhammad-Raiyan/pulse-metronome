import React from 'react';
import { Plus, Minus, Hand } from 'lucide-react';

export function MainDisplay({
  bpm,
  setBpm,
  beatsPerBar,
  activeSubdiv,
  isPlaying,
  activeBeat,
  handleTapTempo
}) {
  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 relative overflow-hidden flex flex-col items-center justify-between min-h-[340px] shadow-2xl">
      {/* Big BPM Display */}
      <div className="text-center my-4">
        <div className="flex items-baseline justify-center gap-2">
          <span className="text-7xl md:text-8xl font-black font-mono tracking-tighter text-slate-100">{bpm}</span>
          <span className="text-slate-400 font-bold text-lg">BPM</span>
        </div>
      </div>

      {/* Main Beat Tile Grid */}
      <div className="w-full space-y-3">
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {Array.from({ length: beatsPerBar }).map((_, i) => {
            const isActive = isPlaying && activeBeat.beat === i;
            return (
              <div
                key={i}
                className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center font-mono font-bold transition-all duration-75 ${
                  isActive
                    ? 'bg-cyan-500 text-slate-950 scale-110 shadow-lg shadow-cyan-500/50'
                    : 'bg-slate-950 border border-slate-800 text-slate-400'
                }`}
              >
                {i + 1}
              </div>
            );
          })}
        </div>

        {/* Yellow Sub-tick Dot Tracker */}
        <div className="flex items-center justify-center gap-2 py-2">
          {activeSubdiv === 1 ? (
            Array.from({ length: beatsPerBar }).map((_, b) => {
              const isSubActive = isPlaying && activeBeat.beat === b;
              return (
                <div
                  key={b}
                  className={`w-3 h-3 rounded-full transition-all duration-75 ${
                    isSubActive
                      ? 'bg-amber-400 scale-125 shadow-md shadow-amber-400/80'
                      : 'bg-slate-800/60'
                  }`}
                />
              );
            })
          ) : (
            Array.from({ length: activeSubdiv }).map((_, s) => {
              const isSubActive = isPlaying && activeBeat.sub === s;
              return (
                <div
                  key={s}
                  className={`w-3 h-3 md:w-4 md:h-4 rounded-full transition-all duration-75 ${
                    isSubActive
                      ? 'bg-amber-400 scale-125 shadow-md shadow-amber-400/80'
                      : 'bg-slate-800'
                  }`}
                />
              );
            })
          )}
        </div>
      </div>

      {/* Slider & Quick Tempo Adjustments */}
      <div className="w-full space-y-3 mt-4">
        <div className="flex items-center gap-3">
          <button onClick={() => setBpm(b => Math.max(30, b - 1))} className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 transition">
            <Minus className="w-5 h-5" />
          </button>
          <input
            type="range" min="30" max="300" value={bpm}
            onChange={(e) => setBpm(Number(e.target.value))}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />
          <button onClick={() => setBpm(b => Math.min(300, b + 1))} className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 transition">
            <Plus className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-1.5">
            <button onClick={() => setBpm(b => Math.max(30, b - 10))} className="px-2.5 py-1 text-xs bg-slate-800 rounded-lg text-slate-300">-10</button>
            <button onClick={() => setBpm(b => Math.max(30, b - 5))} className="px-2.5 py-1 text-xs bg-slate-800 rounded-lg text-slate-300">-5</button>
          </div>
          <button onClick={handleTapTempo} className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-cyan-500/20 text-cyan-400 text-xs font-semibold flex items-center gap-1.5 border border-slate-700">
            <Hand className="w-3.5 h-3.5" /> Tap Tempo
          </button>
          <div className="flex gap-1.5">
            <button onClick={() => setBpm(b => Math.min(300, b + 5))} className="px-2.5 py-1 text-xs bg-slate-800 rounded-lg text-slate-300">+5</button>
            <button onClick={() => setBpm(b => Math.min(300, b + 10))} className="px-2.5 py-1 text-xs bg-slate-800 rounded-lg text-slate-300">+10</button>
          </div>
        </div>
      </div>
    </div>
  );
}