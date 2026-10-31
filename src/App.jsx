import { ThemeProvider } from './ThemeContext';
import { Metronome } from './components/Metronome';
import { UpdateToast } from './components/UpdateToast';

function App() {
  return (
    <ThemeProvider>
      <Metronome />
      <UpdateToast />
    </ThemeProvider>
  );
}

export default App;