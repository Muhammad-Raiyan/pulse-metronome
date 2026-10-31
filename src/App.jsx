import { ThemeProvider } from './ThemeContext';
import { Metronome } from './components/Metronome';

function App() {
  return (
    <ThemeProvider>
      <Metronome />
    </ThemeProvider>
  );
}

export default App;