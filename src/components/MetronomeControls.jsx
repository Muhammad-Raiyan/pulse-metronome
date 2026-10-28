// src/components/MetronomeControls.jsx

import React from 'react';
import { SUBDIVISION_OPTIONS } from '../constants';
import { Play, Square, Timer, Sliders } from 'lucide-react';

export function MetronomeControls({
  isPlaying,
  togglePlay,
  beatsPerBar,
  setBeatsPerBar,
  subdivision,
  setSubdivision,
  startDelayBars,
  setStartDelayBars
}) {
  const beatsOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 12];
  const delayOptions = [0, 1, 2, 4];

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-5 shadow-xl">
      {/* Primary Start / Stop Action Button */}
      <button
        onClick={togglePlay}
        className={`w-full py-4 rounded-2xl font-bold text-base tracking-wide flex items-center justify-center gap-3 transition-all duration-200 shadow-lg cursor-pointer ${
          isPlaying
            ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/25 active:scale-[0.98]'
            : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/25 active:scale-[0.98]'
        }`}
      >
        {isPlaying ? (
          <>
            <Square className="w-5 h-5 fill-current" />
            STOP METRONOME
          </>
        ) : (
          <>
            <Play className="w-5 h-5 fill-current ml-0.5" />
            START METRONOME
          </>
        )}
      </button>

      {/* Beats Per Bar (Time Signature Numerator) */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold text-slate-400 flex items-center gap-1.5">
          <Sliders className="w-3.5 h-3.5 text-cyan-400" />
          Beats Per Measure (Time Signature)
        </label>
        <div className="grid grid-cols-5 gap-1.5">
          {beatsOptions.map((num) => (
            <button
              key={num}
              onClick={() => setBeatsPerBar(num)}
              className={`py-2 text-xs font-mono font-bold rounded-xl border transition-all cursor-pointer ${
                beatsPerBar === num
                  ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 shadow-md shadow-cyan-500/10'
                  : 'bg-slate-950 hover:bg-slate-800 border-slate-800 text-slate-400'
              }`}
            >
              {num}
            </button>
          ))}
        </div>
      </div>

      {/* Subdivision Rate (Converted to Dropdown Select) */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold text-slate-400 flex items-center gap-1.5">
          <Sliders className="w-3.5 h-3.5 text-cyan-400" />
          Subdivision Rate
        </label>
        <select
          value={subdivision}
          onChange={(e) => setSubdivision(Number(e.target.value))}
          className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3.5 py-2.5 text-xs font-mono font-bold text-slate-200 focus:outline-none focus:border-cyan-500 transition-all cursor-pointer"
        >
          {SUBDIVISION_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.value}x — {opt.label.replace(/^\d+x\s*/, '')}
            </option>
          ))}
        </select>
      </div>

      {/* Pre-Roll Count-In Delay */}
      <div className="space-y-2 pt-1 border-t border-slate-800/80">
        <label className="block text-xs font-semibold text-slate-400 flex items-center gap-1.5">
          <Timer className="w-3.5 h-3.5 text-purple-400" />
          Pre-Roll Count-In Delay
        </label>
        <div className="grid grid-cols-4 gap-1.5">
          {delayOptions.map((bars) => (
            <button
              key={bars}
              onClick={() => setStartDelayBars(bars)}
              className={`py-2 text-xs font-mono font-bold rounded-xl border transition-all cursor-pointer ${
                startDelayBars === bars
                  ? 'bg-purple-500/20 border-purple-500 text-purple-300 shadow-md shadow-purple-500/10'
                  : 'bg-slate-950 hover:bg-slate-800 border-slate-800 text-slate-400'
              }`}
            >
              {bars === 0 ? 'Off' : `${bars} ${bars === 1 ? 'Bar' : 'Bars'}`}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}