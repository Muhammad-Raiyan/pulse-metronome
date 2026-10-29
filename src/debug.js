// Debug mode is opt-in: open the app with ?debug in the URL, or switch it on with the
// "Debug" button in the footer (remembered in localStorage, so it also works in an installed
// PWA, which has no URL bar).
export const DEBUG_ENABLED = (() => {
  try {
    if (typeof location !== 'undefined' && new URLSearchParams(location.search).has('debug')) return true;
    return typeof localStorage !== 'undefined' && localStorage.getItem('pulse-debug') === '1';
  } catch {
    return false;
  }
})();

export function saveDebugPreference(on) {
  try {
    if (on) localStorage.setItem('pulse-debug', '1');
    else localStorage.removeItem('pulse-debug');
  } catch {
    // storage unavailable (private mode): the toggle still works for this session
  }
}
