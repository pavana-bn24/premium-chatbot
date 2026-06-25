import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ThemeProvider } from './hooks/useTheme.tsx';

ReactDOM.createRoot(document.getElementById('app')!).render(
  <ThemeProvider>
    <App />
  </ThemeProvider>,
);
