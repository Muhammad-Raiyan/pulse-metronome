import { useState } from 'react';

const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

// Numeric input that only commits in-range values while typing and
// clamps (or reverts) on blur, so an empty/invalid field can never reach state.
export function NumberInput({ value, onChange, min, max, className, ...rest }) {
  const [draft, setDraft] = useState(null);

  const handleChange = (e) => {
    const raw = e.target.value;
    setDraft(raw);
    const n = Number(raw);
    if (raw !== '' && Number.isFinite(n) && n >= min && n <= max) {
      onChange(Math.round(n));
    }
  };

  const handleBlur = () => {
    if (draft === null) return;
    const n = Number(draft);
    if (draft !== '' && Number.isFinite(n)) {
      onChange(clamp(Math.round(n), min, max));
    }
    setDraft(null);
  };

  return (
    <input
      type="number"
      min={min}
      max={max}
      value={draft ?? value}
      onChange={handleChange}
      onBlur={handleBlur}
      className={className}
      {...rest}
    />
  );
}
