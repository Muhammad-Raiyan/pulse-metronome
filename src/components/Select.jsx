import { ChevronDown } from 'lucide-react';

// Native <select> with the browser arrow replaced by an inset chevron.
// Callers should leave right padding for the chevron (e.g. `pl-2 pr-7`).
export function Select({ className = '', children, ...props }) {
  return (
    <div className="relative">
      <select {...props} className={`appearance-none cursor-pointer ${className}`}>
        {children}
      </select>
      <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
    </div>
  );
}
