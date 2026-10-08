import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import './index.css';

// Global error handlers to capture unhandled promise rejections and transient quota exceptions
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    console.warn('Intercepted unhandled promise rejection safely:', event.reason);
    event.preventDefault();
  });

  window.addEventListener('error', (event) => {
    if (
      event.error?.name === 'QuotaExceededError' || 
      event.message?.includes('quota') || 
      event.message?.includes('ResizeObserver') ||
      !event.message
    ) {
      console.warn('Handled global window error event safely:', event.message || event.error);
      event.preventDefault();
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
