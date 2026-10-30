import { Plus, Copy, Trash2, ChevronUp, ChevronDown, FilePlus2 } from 'lucide-react';
import { NumberInput } from './NumberInput';
import { Select } from './Select';
import { MIN_BPM, MAX_BPM, SUBDIVISION_OPTIONS } from '../constants';
import {
  MAX_STEP_BARS, MAX_METER,
  updateStep, addStep, duplicateStep, removeStep, moveStep,
} from '../sequence';

const METERS = Array.from({ length: MAX_METER }, (_, i) => i + 1);
const COLUMNS = 'grid grid-cols-[1.25rem_3rem_3.5rem_minmax(0,1fr)_minmax(0,1fr)_6.5rem] gap-1.5 items-center';
const FIELD =
  'w-full bg-slate-950 border border-slate-800 rounded-lg px-1.5 py-1 text-xs font-mono font-bold text-slate-200 focus:outline-none focus:border-purple-500 disabled:opacity-50';
const SELECT = `${FIELD} pr-6 pl-1.5`;

function IconButton({ label, onClick, disabled, children }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="p-1 rounded-md text-slate-400 hover:text-slate-100 hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed cursor-pointer"
    >
      {children}
    </button>
  );
}

function ActionButton({ onClick, Icon, children }) {
  return (
    <button
      onClick={onClick}
      className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-bold text-slate-200 hover:border-purple-500/50 hover:text-purple-300 transition-colors cursor-pointer"
    >
      <Icon className="w-3.5 h-3.5" aria-hidden="true" />
      {children}
    </button>
  );
}

// Song-tab tools: start a new sequence and edit the steps of the loaded song. The list is locked while playing so a step can't change under the audio.
export function SequenceEditor({ activeSongMap, currentSectionIndex, unitsElapsed, isDelayPhase, isPlaying, onNew, onChange }) {
  const editable = Boolean(activeSongMap?.editable);
  const steps = activeSongMap?.sections ?? [];
  const totalBars = steps.reduce((sum, s) => sum + s.bars, 0);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
      <ActionButton onClick={onNew} Icon={FilePlus2}>New sequence</ActionButton>

      {editable && (
        <>
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-bold text-sm text-slate-100 truncate pr-2">{activeSongMap.title}</span>
            <span className="font-mono text-slate-400 shrink-0">{steps.length} steps · {totalBars} bars</span>
          </div>

          {steps.length > 0 && (
            <div className={`${COLUMNS} px-1.5 text-[11px] text-slate-400`} aria-hidden="true">
              <span>#</span><span>Bars</span><span>BPM</span><span>Meter</span><span>Subdiv</span><span />
            </div>
          )}

          <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1">
            {steps.map((step, i) => {
              const n = i + 1;
              const isCurrent = isPlaying && i === currentSectionIndex;
              // Fill grows one bar at a time and matches the banner's "Bar x/y"; none during the count-in
              const progress = isCurrent && !isDelayPhase ? Math.min(1, (unitsElapsed + 1) / step.bars) : 0;
              return (
                <div
                  key={step.id}
                  className={`${COLUMNS} relative isolate overflow-hidden p-1.5 rounded-xl border ${
                    isCurrent ? 'bg-purple-500/10 border-purple-500/50' : 'bg-slate-950/60 border-slate-800/60'
                  }`}
                >
                  {isCurrent && (
                    <div
                      role="progressbar"
                      aria-label={`Step ${n} progress`}
                      aria-valuemin={0}
                      aria-valuemax={step.bars}
                      aria-valuenow={Math.round(progress * step.bars)}
                      className="absolute inset-y-0 left-0 -z-10 bg-purple-500/30 transition-[width] duration-300 ease-out"
                      style={{ width: `${progress * 100}%` }}
                    />
                  )}
                  <span className="text-[11px] font-mono text-slate-400">{n}</span>
                  <NumberInput
                    min={1} max={MAX_STEP_BARS} value={step.bars} disabled={isPlaying}
                    onChange={(v) => onChange(updateStep(steps, i, 'bars', v))}
                    aria-label={`Step ${n} bars`} className={FIELD}
                  />
                  <NumberInput
                    min={MIN_BPM} max={MAX_BPM} value={step.bpm} disabled={isPlaying}
                    onChange={(v) => onChange(updateStep(steps, i, 'bpm', v))}
                    aria-label={`Step ${n} BPM`} className={FIELD}
                  />
                  <Select
                    aria-label={`Step ${n} beats per bar`} value={step.beatsPerBar} disabled={isPlaying}
                    onChange={(e) => onChange(updateStep(steps, i, 'beatsPerBar', Number(e.target.value)))}
                    className={SELECT}
                  >
                    {METERS.map((m) => <option key={m} value={m}>{m}/4</option>)}
                  </Select>
                  <Select
                    aria-label={`Step ${n} subdivision`} value={step.subdivision} disabled={isPlaying}
                    onChange={(e) => onChange(updateStep(steps, i, 'subdivision', Number(e.target.value)))}
                    className={SELECT}
                  >
                    {SUBDIVISION_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.value}x</option>
                    ))}
                  </Select>
                  <div className="flex items-center justify-end">
                    <IconButton label={`Move step ${n} up`} disabled={isPlaying || i === 0} onClick={() => onChange(moveStep(steps, i, -1))}>
                      <ChevronUp className="w-3.5 h-3.5" />
                    </IconButton>
                    <IconButton label={`Move step ${n} down`} disabled={isPlaying || i === steps.length - 1} onClick={() => onChange(moveStep(steps, i, 1))}>
                      <ChevronDown className="w-3.5 h-3.5" />
                    </IconButton>
                    <IconButton label={`Duplicate step ${n}`} disabled={isPlaying} onClick={() => onChange(duplicateStep(steps, i))}>
                      <Copy className="w-3.5 h-3.5" />
                    </IconButton>
                    <IconButton label={`Remove step ${n}`} disabled={isPlaying} onClick={() => onChange(removeStep(steps, i))}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </IconButton>
                  </div>
                </div>
              );
            })}
          </div>

          {steps.length === 0 && (
            <p className="text-[11px] text-slate-400 text-center py-2">No steps yet. Add one below.</p>
          )}

          <button
            onClick={() => onChange(addStep(steps))}
            disabled={isPlaying}
            className="w-full inline-flex items-center justify-center gap-1.5 py-2 rounded-xl border border-dashed border-slate-700 text-[11px] font-bold text-slate-300 hover:border-purple-500/50 hover:text-purple-300 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" /> Add step
          </button>
          {isPlaying && <p className="text-[11px] text-slate-400 text-center">Stop playback to edit steps.</p>}
        </>
      )}
    </div>
  );
}
