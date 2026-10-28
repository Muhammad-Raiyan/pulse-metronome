# 🥁 Pulse Metronome

A zero-lag, high-precision web metronome engineered for musicians, drum practice, and tempo training. Built and generated with AI assistance using React, Vite, Tailwind CSS v4, the Web Audio API, and a dedicated Web Worker lookahead scheduler.

---

## ⚡ Key Features

- **Zero-Lag Web Audio Architecture:** Powered by a Web Worker lookahead scheduler running on a separate background thread for rock-solid timing accuracy.
- **Customizable Beat Accents:** Click individual beat tiles (**1, 2, 3, 4...**) to cycle through accent levels:
  - `Accented` (High pitch, loud click)
  - `Normal` (Standard pitch & volume)
  - `Soft` (Low pitch, quiet click)
  - `Muted` (Silent beat tile)
- **4 Advanced Automation & Training Modes:**
  1. **Manual:** Standard constant click.
  2. **Ramp Up (Gradual Acceleration):** Automatically increases BPM by $+X$ every $Y$ bars up to a target speed cap.
  3. **Jog / Sprint Trainer:** Alternates between a comfortable base tempo and a high-intensity burst phase based on BPM jumps or subdivision density bursts.
  4. **Mute Trainer (Inner Clock Tester):** Alternates between audible bars and silent bars to test and train internal timing.
- **Start Delay (Count-In Pre-Roll):** Configurable $X$-bar count-in delay featuring a distinct, high-pitched pre-roll tone before the workout begins.
- **Visual & Audio Speed Limit Cap Alerts:** Distinct chime and glowing banner badges when reaching maximum BPM targets or transitioning into sprint phases.
- **PWA & Mobile Ready:** Fully installable as a standalone app on iOS, Android, and Windows with offline caching and Web Screen Wake Lock support to keep screens active during practice.
- **Hands-Free Keyboard Shortcuts:**
  - `Spacebar`: Toggle Start / Stop
  - `Up Arrow` / `Down Arrow`: $\pm 1$ BPM
  - `Shift + Up` / `Shift + Down`: $\pm 4$ BPM
  - `Alt + Up` / `Alt + Down`: $\pm 8$ BPM
  - `T`: Tap Tempo

---

## 🛠️ Tech Stack & AI Disclosure

- **AI Co-Creator:** Built collaboratively using Google Gemini
- **Framework:** [React 18 / 19](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
- **Audio Engine:** Web Audio API (`AudioContext`, `OscillatorNode`, `GainNode`)
- **Background Timer:** Dedicated Web Worker (`schedulerWorker.js`)
- **PWA Integration:** `vite-plugin-pwa`
- **Icons:** `lucide-react`

---

## 🚀 Getting Started

### Prerequisites

Ensure you have [Node.js](https://nodejs.org/) installed on your system.

### Local Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/YOUR_USERNAME/pulse-metronome.git
   cd pulse-metronome
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the local development server:
   ```bash
   npm run dev
   ```

4. Open your browser at `http://localhost:5173` to test the app.

---

## 📦 Production Build & Deployment

### Build Locally

To build the static production bundle with PWA service worker generation:

```bash
npm run build
```

The output will be placed in the `dist/` directory.

### Deploying to Vercel ($0 Free Hosting)

1. Push your repository to GitHub.
2. Sign in to [Vercel](https://vercel.com) using your GitHub account.
3. Import your `pulse-metronome` repository.
4. Vercel will automatically detect Vite (`npm run build` outputting to `dist`).
5. Click **Deploy**. Your app will be live on HTTPS with PWA support!

---

## 📱 PWA Installation Instructions

- **iOS (iPhone/iPad):** Open your live site URL in Safari $\rightarrow$ Tap **Share** $\rightarrow$ Select **Add to Home Screen**.
- **Windows / macOS (Chrome or Edge):** Open the live site URL $\rightarrow$ Click the **Install** button on the right side of the URL bar.

---

## 📄 License

MIT License. Free to modify, adapt, and distribute.