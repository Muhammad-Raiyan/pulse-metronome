import React from 'react';
import { Cpu, Zap, Layers, Info } from 'lucide-react';

export function AutomationEngine({
  automationMode,
  setAutomationMode,
  gradualInterval,
  setGradualInterval,
  gradualStep,
  setGradualStep,
  gradualCap,
  setGradualCap,
  sprintType,
  setSprintType,
  jogBpm,
  setJogBpm,
  sprintBpm,
  setSprintBpm,
  jogBars,
  setJogBars,
  sprintBars,
  setSprintBars,
  subdivMetric,
  setSubdivMetric,
  jogSubdiv,
  setJogSubdiv,
  sprintSubdiv,
  setSprintSubdiv,
  jogUnits,
  setJogUnits,
  sprintUnits,
  setSprintUnits
}) {
  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-5">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-cyan-400" />
          <h2 className="font-bold text-sm">Automation Engine</h2>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-2xl border border-slate-800 text-xs font-semibold">
        <button onClick={() => setAutomationMode('manual')} className={`py-2 rounded-xl transition ${automationMode === 'manual' ? 'bg-slate-800 text-cyan-400' : 'text-slate-400'}`}>Manual</button>
        <button onClick={() => setAutomationMode('gradual')} className={`py-2 rounded-xl transition ${automationMode === 'gradual' ? 'bg-slate-800 text-cyan-400' : 'text-slate-400'}`}>Ramp Up</button>
        <button onClick={() => setAutomationMode('jogsprint')} className={`py-2 rounded-xl transition ${automationMode === 'jogsprint' ? 'bg-slate-800 text-cyan-400' : 'text-slate-400'}`}>Jog / Sprint</button>
      </div>

      {automationMode === 'manual' && (
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-slate-400 text-xs leading-relaxed space-y-1">
          <p className="font-semibold text-slate-200 flex items-center gap-1.5"><Info className="w-4 h-4 text-cyan-400" /> Standard Constant Click</p>
          <p>Runs continuously at your configured BPM and subdivision settings without automated shifts.</p>
        </div>
      )}

      {automationMode === 'gradual' && (
        <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Increase Every (Bars)</label>
              <input type="number" value={gradualInterval} onChange={(e) => setGradualInterval(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-sm font-semibold focus:outline-none" />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">BPM Increase (+ Step)</label>
              <input type="number" value={gradualStep} onChange={(e) => setGradualStep(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-sm font-semibold focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Target Max Cap BPM</label>
            <input type="number" value={gradualCap} onChange={(e) => setGradualCap(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-sm font-semibold focus:outline-none" />
          </div>
        </div>
      )}

      {automationMode === 'jogsprint' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-1.5 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
            <button onClick={() => setSprintType('bpm')} className={`py-1.5 rounded-xl text-xs font-semibold ${sprintType === 'bpm' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' : 'text-slate-400'}`}>
              BPM Jump (Bars)
            </button>
            <button onClick={() => setSprintType('subdivision')} className={`py-1.5 rounded-xl text-xs font-semibold ${sprintType === 'subdivision' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'text-slate-400'}`}>
              Subdivision Burst
            </button>
          </div>

          {sprintType === 'bpm' && (
            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <p className="text-[11px] text-cyan-400 font-medium flex items-center gap-1"><Zap className="w-3.5 h-3.5" /> Bar-based variable tempo shifts</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Jog Tempo (BPM)</label>
                  <input type="number" value={jogBpm} onChange={(e) => setJogBpm(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-sm font-semibold" />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Sprint Tempo (BPM)</label>
                  <input type="number" value={sprintBpm} onChange={(e) => setSprintBpm(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-sm font-semibold" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Jog Duration (Bars)</label>
                  <input type="number" value={jogBars} onChange={(e) => setJogBars(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-sm font-semibold" />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Sprint Duration (Bars)</label>
                  <input type="number" value={sprintBars} onChange={(e) => setSprintBars(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-sm font-semibold" />
                </div>
              </div>
            </div>
          )}

          {sprintType === 'subdivision' && (
            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <p className="text-[11px] text-amber-400 font-medium flex items-center gap-1"><Layers className="w-3.5 h-3.5" /> Density burst (Constant BPM)</p>
              <div className="flex items-center justify-between text-xs py-1">
                <span className="text-slate-400">Boundary Trigger</span>
                <div className="flex gap-3">
                  <label className="inline-flex items-center gap-1 text-slate-300 cursor-pointer">
                    <input type="radio" name="subdivMetric" value="bars" checked={subdivMetric === 'bars'} onChange={() => setSubdivMetric('bars')} className="accent-cyan-400" /> Bars
                  </label>
                  <label className="inline-flex items-center gap-1 text-slate-300 cursor-pointer">
                    <input type="radio" name="subdivMetric" value="beats" checked={subdivMetric === 'beats'} onChange={() => setSubdivMetric('beats')} className="accent-cyan-400" /> Beats
                  </label>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Jog Subdivision</label>
                  <select 
                    value={jogSubdiv} 
                    onChange={(e) => setJogSubdiv(Number(e.target.value))} 
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2 py-1.5 text-xs font-semibold text-slate-100 focus:outline-none cursor-pointer"
                  >
                    <option value="1" className="bg-slate-900 text-slate-100">1 - Quarter Notes</option>
                    <option value="2" className="bg-slate-900 text-slate-100">2 - Eighth Notes</option>
                    <option value="3" className="bg-slate-900 text-slate-100">3 - Triplets</option>
                    <option value="4" className="bg-slate-900 text-slate-100">4 - Sixteenth Notes</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Sprint Subdivision</label>
                  <select 
                    value={sprintSubdiv} 
                    onChange={(e) => setSprintSubdiv(Number(e.target.value))} 
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2 py-1.5 text-xs font-semibold text-slate-100 focus:outline-none cursor-pointer"
                  >
                    <option value="2" className="bg-slate-900 text-slate-100">2 - Eighth Notes</option>
                    <option value="3" className="bg-slate-900 text-slate-100">3 - Triplets</option>
                    <option value="4" className="bg-slate-900 text-slate-100">4 - Sixteenth Notes</option>
                    <option value="5" className="bg-slate-900 text-slate-100">5 - Quintuplets</option>
                    <option value="6" className="bg-slate-900 text-slate-100">6 - Sextuplets</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Jog ({subdivMetric})</label>
                  <input type="number" value={jogUnits} onChange={(e) => setJogUnits(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-sm font-semibold" />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Sprint ({subdivMetric})</label>
                  <input type="number" value={sprintUnits} onChange={(e) => setSprintUnits(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-sm font-semibold" />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}