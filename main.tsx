import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

if (typeof window !== 'undefined') {
  // Prevent benign websocket/HMR connection warnings from triggering unhandled rejection overlays
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    if (reason) {
      const reasonStr = typeof reason === 'string' ? reason : (reason.message || '');
      if (
        reasonStr.includes('WebSocket') || 
        reasonStr.includes('websocket') || 
        reasonStr.includes('ws://') || 
        reasonStr.includes('wss://')
      ) {
        event.preventDefault();
        event.stopPropagation();
      }
    }
  });

  window.addEventListener('error', (event) => {
    const message = event.message || '';
    if (
      message.includes('WebSocket') || 
      message.includes('websocket') || 
      message.includes('ws://') || 
      message.includes('wss://')
    ) {
      event.preventDefault();
      event.stopPropagation();
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
