import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

// Taken when the module loads, i.e. when the app starts
const APP_START = Date.now();

function formatUptime(ms) {
  const totalMinutes = Math.floor(ms / 60000);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}:${String(m).padStart(2, '0')}`;
}

// Time since the app was opened, as H:MM. Own component so the periodic update
// doesn't re-render the whole metronome.
export function Uptime() {
  const [now, setNow] = useState(Date.now);

  useEffect(() => {
    // Wall-clock based, so it stays right after the device sleeps or the tab is throttled
    const id = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(id);
  }, []);

  return (
    <span className="inline-flex items-center gap-1.5 tabular-nums">
      <Clock className="w-3 h-3" aria-hidden="true" />
      Uptime: {formatUptime(now - APP_START)}
    </span>
  );
}
