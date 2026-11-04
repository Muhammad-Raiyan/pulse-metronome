import { useState, useEffect } from 'react';
import { Timer } from 'lucide-react';

const pad = (n) => String(n).padStart(2, '0');

function formatElapsed(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

// Counts up while the metronome plays. Stopping freezes the time; the next start begins from 0.
// Kept in its own component so the per-second updates don't re-render the whole metronome.
// Polls faster than 1s so the display flips on time, but only whole seconds are stored,
// so React skips the renders where nothing changed.
export function SessionTimer({ isPlaying }) {
  const [elapsed, setElapsed] = useState(0);
  const [wasPlaying, setWasPlaying] = useState(false);

  // Reset when a new run starts (adjusting state during render, not in an effect)
  if (isPlaying !== wasPlaying) {
    setWasPlaying(isPlaying);
    if (isPlaying) setElapsed(0);
  }

  useEffect(() => {
    if (!isPlaying) return;
    const startedAt = performance.now();
    const id = setInterval(() => setElapsed(Math.floor((performance.now() - startedAt) / 1000)), 250);
    return () => clearInterval(id);
  }, [isPlaying]);

  return (
    <div
      role="timer"
      aria-label="Practice time"
      className={`inline-flex items-center gap-1.5 font-mono text-sm tabular-nums ${isPlaying ? 'text-cyan-400' : 'text-slate-400'}`}
    >
      <Timer className="w-3.5 h-3.5" aria-hidden="true" />
      {formatElapsed(elapsed)}
    </div>
  );
}
