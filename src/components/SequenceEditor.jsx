import { Plus, Copy, Trash2, ChevronUp, ChevronDown, FilePlus2, PlayCircle, Repeat } from 'lucide-react';
import { NumberInput } from './NumberInput';
import { Select } from './Select';
import { MIN_BPM, MAX_BPM, SUBDIVISION_OPTIONS, ACCENT_TYPES, ACCENT_LABELS } from '../constants';
import {
  MAX_STEP_BARS, MAX_METER, MAX_REPEATS,
  updateStep, addStep, duplicateStep, removeStep, moveStep,
} from '../sequence';
import { CARD, INPUT } from './styles';

const METERS = Array.from({ length: MAX_METER }, (_, i) => i + 1);
const COLUMNS = 'grid grid-cols-[2.75rem_minmax(0,1fr)_3rem_3rem_3.5rem_minmax(0,1fr)_minmax(0,1fr)_5.5rem] gap-1.5 items-center';
// Sequence editor fields focus-ring uses purple instead of cyan
const FIELD = `${INPUT} px-1.5 focus:border-purple-500`;
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
export function SequenceEditor({ activeSongMap, currentSectionIndex, startSectionIndex, loopSection, repeatElapsed, unitsElapsed, isDelayPhase, isPlaying, onNew, onChange, onSetStart, onSetLoop, onClearStart }) {
  const editable = Boolean(activeSongMap?.editable);
  const steps = activeSongMap?.sections ?? [];
  const totalBars = steps.reduce((sum, s) => sum + s.bars, 0);

  return (
    <div className={`${CARD} space-y-4`}>
      <ActionButton onClick={onNew} Icon={FilePlus2}>New sequence</ActionButton>

      {editable && (
        <>
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-bold text-sm text-slate-100 truncate pr-2">{activeSongMap.title}</span>
            <span className="font-mono text-slate-400 shrink-0">{steps.length} steps · {totalBars} bars</span>
          </div>

          {steps.length > 0 && (
            <div className={`${COLUMNS} px-1.5 text-[11px] text-slate-400`} aria-hidden="true">
              <span></span><span>Name</span><span>Bars</span><span>×</span><span>BPM</span><span>Meter</span><span>Subdiv</span><span />
            </div>
          )}

          {/* Start / loop indicator */}
          {(startSectionIndex > 0 || loopSection) && !isPlaying && (
            <div className="flex items-center gap-2 px-1.5 text-[11px]">
              <span className={`flex items-center gap-1 ${loopSection ? 'text-amber-400' : 'text-emerald-400'}`}>
                {loopSection ? <Repeat className="w-3 h-3" /> : <PlayCircle className="w-3 h-3" />}
                {loopSection ? `Looping section ${startSectionIndex + 1}` : `Starting from section ${startSectionIndex + 1}`}
              </span>
              <button onClick={onClearStart} className="text-slate-500 hover:text-slate-300 underline cursor-pointer">clear</button>
            </div>
          )}

          <div className="sm:max-h-72 sm:overflow-y-auto space-y-1.5 pr-1">
            {steps.map((step, i) => {
              const n = i + 1;
              const isCurrent = isPlaying && i === currentSectionIndex;
              // Progress spans all repeats: each repeat fills 1/repeats of the bar
              const totalPasses = step.repeats ?? 1;
              const progress = isCurrent && !isDelayPhase
                ? Math.min(1, ((repeatElapsed ?? 0) * step.bars + unitsElapsed + 1) / (totalPasses * step.bars))
                : 0;
              const accents = step.beatAccents ?? [0, ...Array(step.beatsPerBar - 1).fill(1)];
              return (
                <div key={step.id} className={`relative isolate overflow-hidden rounded-xl border ${isCurrent ? 'bg-purple-500/10 border-purple-500/50' : 'bg-slate-950/60 border-slate-800/60'}`}>
                  {isCurrent && (
                    <div
                      role="progressbar"
                      aria-label={`Step ${n} progress`}
                      aria-valuemin={0}
                      aria-valuemax={(step.repeats ?? 1) * step.bars}
                      aria-valuenow={Math.round(progress * (step.repeats ?? 1) * step.bars)}
                      className="absolute inset-y-0 left-0 -z-10 bg-purple-500/30 transition-[width] duration-300 ease-out"
                      style={{ width: `${progress * 100}%` }}
                    />
                  )}
                  {/* Main fields row */}
                  <div className={`${COLUMNS} p-1.5`}>
                    {/* Start / loop buttons — left cell */}
                    <div className="flex items-center gap-0.5">
                      <IconButton
                        label={`Start from section ${n}`}
                        disabled={isPlaying}
                        onClick={() => startSectionIndex === i && !loopSection ? onClearStart() : onSetStart(i)}
                      >
                        <PlayCircle className={`w-3.5 h-3.5 ${startSectionIndex === i && !loopSection ? 'text-emerald-400' : ''}`} />
                      </IconButton>
                      <IconButton
                        label={`Loop section ${n}`}
                        disabled={isPlaying}
                        onClick={() => startSectionIndex === i && loopSection ? onClearStart() : onSetLoop(i)}
                      >
                        <Repeat className={`w-3.5 h-3.5 ${startSectionIndex === i && loopSection ? 'text-amber-400' : ''}`} />
                      </IconButton>
                    </div>
                    <input
                      type="text"
                      value={step.name}
                      disabled={isPlaying}
                      onChange={(e) => onChange(updateStep(steps, i, 'name', e.target.value))}
                      aria-label={`Step ${n} name`}
                      placeholder={`Step ${n}`}
                      className={`${FIELD} placeholder:text-slate-600`}
                    />
                    <NumberInput
                      min={1} max={MAX_STEP_BARS} value={step.bars} disabled={isPlaying}
                      onChange={(v) => onChange(updateStep(steps, i, 'bars', v))}
                      aria-label={`Step ${n} bars`} className={FIELD}
                    />
                    <NumberInput
                      min={1} max={MAX_REPEATS} value={step.repeats ?? 1} disabled={isPlaying}
                      onChange={(v) => onChange(updateStep(steps, i, 'repeats', v))}
                      aria-label={`Step ${n} repeats`} className={FIELD}
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
                      {/* Step number — bottom right */}
                      <span className="text-[10px] font-mono text-slate-600 pl-0.5 select-none">{n}</span>
                    </div>
                  </div>
                  {/* Per-step accent strip */}
                  <div className="flex items-center gap-1 px-2 pb-1.5">
                    {accents.map((accent, b) => {
                      const accentColors = [
                        'border-cyan-500 text-cyan-300 bg-cyan-500/10',   // Accented
                        'border-slate-600 text-slate-400 bg-transparent', // Normal
                        'border-slate-700 text-slate-500 bg-transparent opacity-60', // Soft
                        'border-rose-900/60 text-rose-500 bg-transparent opacity-50', // Muted
                      ];
                      return (
                        <button
                          key={b}
                          disabled={isPlaying}
                          onClick={() => {
                            const next = [...accents];
                            next[b] = (accent + 1) % Object.keys(ACCENT_TYPES).length;
                            onChange(updateStep(steps, i, 'beatAccents', next));
                          }}
                          title={`Beat ${b + 1}: ${ACCENT_LABELS[accent]} — click to cycle`}
                          aria-label={`Step ${n} beat ${b + 1} accent: ${ACCENT_LABELS[accent]}`}
                          className={`w-5 h-5 rounded text-[9px] font-mono font-bold border transition-all cursor-pointer disabled:cursor-default ${accentColors[accent]}`}
                        >
                          {b + 1}
                        </button>
                      );
                    })}
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
