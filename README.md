# Pulse Metronome ⚡

> **Built with AI Assistance**: Designed and engineered using conversational AI to produce a zero-latency, high-precision Web Audio metronome application.

A zero-lag, production-ready Progressive Web Application (PWA) metronome built for precision practicing, rehearsal, and live performance. Powered by the **Web Audio API** and a **Web Worker lookahead scheduler**, Pulse Metronome delivers sample-accurate note timing that stays steady even when the tab is in the background.

---

## ✨ Features

- 🎯 **Zero-Lag Web Worker Lookahead Scheduler**: A Web Worker drives the scheduling clock, so timer throttling and UI layout work on the main thread are far less likely to throw off the tempo. Notes are scheduled ahead of time on the Web Audio clock.
- 🥁 **Custom Beat Accents**: Click individual beat tiles to cycle accent dynamics (`Accented`, `Normal`, `Soft`, `Muted`).
- ⚡ **Speed & Practice Automation Modes**:
  - **Manual Mode**: Classic fixed tempo control.
  - **Gradual Ramp Up**: Automatically increases BPM by a set increment every $N$ bars up to a defined speed limit cap.
  - **Jog / Sprint Trainer**: Alternate between rest/jog tempos and burst speeds using BPM jumps or subdivision shifts, complete with audio alert chimes.
  - **Inner Clock Mute Trainer**: Alternates between active audio bars and silent bars to test your internal timing.
  - **Multi-Section Song Maps**: Automatically transition tempos, time signatures, and subdivisions on section downbeats.
- 🎵 **Song & Preset Library (`songs.json`)**: Search by title, artist, or album to instantly load multi-tempo song maps with zero cloud hosting costs ($0 deployment).
- 📱 **Mobile-First PWA Support**: Installable on iOS Safari and Android Chrome as a standalone, offline-ready app with native status bar theme blending (`black-translucent`).
- 💡 **Screen Wake Lock**: Keeps your mobile or laptop screen awake while practicing.
- ⌨️ **Keyboard Shortcuts**: Spacebar (Start/Stop), Up/Down arrows ($\pm 1$, Shift $\pm 4$, Alt $\pm 8$), and 'T' for Tap Tempo.

---

## 🛠️ Tech Stack

- **Framework**: React 19 + Vite
- **Styling**: Tailwind CSS v4 (`@tailwindcss/vite`)
- **Icons**: Lucide React
- **Audio Engine**: Web Audio API (`AudioContext`) + Web Worker scheduler (`schedulerWorker.js`)
- **PWA**: `vite-plugin-pwa`
- **Deployment**: GitHub Pages, published by a GitHub Actions workflow

---

## 💻 Local Setup & Development (Windows / macOS / Linux)

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or pnpm

### 1. Clone the Repository
```bash
git clone https://github.com/Muhammad-Raiyan/pulse-metronome.git
cd pulse-metronome
```

### 2. Fixing Line Endings on Windows (`CRLF` vs `LF`)
If you are developing on Windows, Git may default to converting `LF` line endings to `CRLF`, causing linter warnings or build issues. Configure Git to handle line endings correctly:

```powershell
# Set global or repo-level line ending conversion
git config core.autocrlf true
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Run Development Server
```bash
npm run dev
```
Open your browser and navigate to `http://localhost:5173`.

---

## 🎵 Customizing Song Maps (`public/songs.json`)

Song maps are stored in a static JSON file located at `public/songs.json`. You can edit or add new songs directly to this file:

```json
[
  {
    "id": "song-test",
    "title": "Test Suite (Quick Section Switch)",
    "artist": "Metronome Dev",
    "album": "Automation Sandbox",
    "bpm": 120,
    "beatsPerBar": 4,
    "hasSections": true,
    "sections": [
      { "id": 1, "name": "1. Slow Intro (100 BPM)", "bars": 2, "bpm": 100, "beatsPerBar": 4, "subdivision": 1 },
      { "id": 2, "name": "2. Mid Groove (120 BPM - 8ths)", "bars": 2, "bpm": 120, "beatsPerBar": 4, "subdivision": 2 },
      { "id": 3, "name": "3. Speed Burst (160 BPM - 16ths)", "bars": 2, "bpm": 160, "beatsPerBar": 4, "subdivision": 4 },
      { "id": 4, "name": "4. Odd Time Breakdown (130 BPM in 3/4)", "bars": 2, "bpm": 130, "beatsPerBar": 3, "subdivision": 1 }
    ]
  }
]
```

---

## 🚀 Publishing to GitHub Pages

### 1. Verify `vite.config.js` Base Path
Ensure your `vite.config.js` base matches your repository name:

```javascript
export default defineConfig({
  base: '/pulse-metronome/',
  // ... plugins
});
```

### 2. Enable GitHub Pages once in Repo Settings
1. Navigate to `https://github.com/Muhammad-Raiyan/pulse-metronome`.
2. Go to **Settings** $\rightarrow$ **Pages**.
3. Under **Build and deployment**, set **Source** to `GitHub Actions`.

### 3. Push to `main`
The workflow in `.github/workflows/ci.yml` lints, tests and builds the app. If those pass, a second job publishes `dist/` to GitHub Pages. Pull requests run the checks but are never deployed.

Fallback from your own machine (publishes to the `gh-pages` branch, which only works while **Source** is `Deploy from a branch`):

```bash
npm run deploy
```

The app is live at `https://muhammad-raiyan.github.io/pulse-metronome/`.

---

## 📱 Installing the Mobile PWA (iOS & Android)

- **iOS (Safari)**: Open the live site URL, tap the **Share** button $\rightarrow$ tap **Add to Home Screen**.
- **Android (Chrome)**: Open the live site URL, tap the three dots menu $\rightarrow$ tap **Install app / Add to Home Screen**.

---

## 📄 License
MIT License. See [LICENSE](LICENSE) for details.