import React from 'react';
import { Play, Square } from 'lucide-react';

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
  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-4">
      <button
        onClick={togglePlay}
        className={`w-full py-4 rounded-2xl font-extrabold text-lg flex items-center justify-center gap-2 shadow-lg transition active:scale-95 ${
          isPlaying ? 'bg-rose-500 hover:bg-rose-400 text-slate-950' : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950'
        }`}
      >
        {isPlaying ? <Square className="w-5 h-5" /> : <Play className="w-5 h-5" />}
        <span>{isPlaying ? 'STOP METRONOME' : 'START METRONOME'}</span>
      </button>

      <div className="grid grid-cols-3 gap-3">
        {/* Time Signature */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-2.5">
          <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Time Signature</label>
          <select 
            value={beatsPerBar} 
            onChange={(e) => setBeatsPerBar(Number(e.target.value))} 
            className="bg-slate-950 text-slate-100 text-sm font-semibold w-full focus:outline-none cursor-pointer"
          >
            <option value="2" className="bg-slate-900 text-slate-100">2/4</option>
            <option value="3" className="bg-slate-900 text-slate-100">3/4</option>
            <option value="4" className="bg-slate-900 text-slate-100">4/4</option>
            <option value="5" className="bg-slate-900 text-slate-100">5/4</option>
            <option value="6" className="bg-slate-900 text-slate-100">6/8</option>
          </select>
        </div>

        {/* Subdivision */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-2.5">
          <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Subdivision</label>
          <select 
            value={subdivision} 
            onChange={(e) => setSubdivision(Number(e.target.value))} 
            className="bg-slate-950 text-slate-100 text-sm font-semibold w-full focus:outline-none cursor-pointer"
          >
            <option value="1" className="bg-slate-900 text-slate-100">Quarter Notes</option>
            <option value="2" className="bg-slate-900 text-slate-100">Eighth Notes</option>
            <option value="3" className="bg-slate-900 text-slate-100">Triplets</option>
            <option value="4" className="bg-slate-900 text-slate-100">Sixteenth Notes</option>
            <option value="5" className="bg-slate-900 text-slate-100">Quintuplets</option>
            <option value="6" className="bg-slate-900 text-slate-100">Sextuplets</option>
          </select>
        </div>

        {/* Start Delay / Count-In */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-2.5">
          <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Start Delay (Bars)</label>
          <input 
            type="number" 
            min="0" 
            max="16" 
            value={startDelayBars} 
            onChange={(e) => setStartDelayBars(Number(e.target.value))} 
            className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-sm font-semibold text-slate-100 w-full focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
}