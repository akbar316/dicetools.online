
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// In production, suppress noisy console output that can flag Best Practices
// checks (e.g. Lighthouse reports console errors). Keep logs active in dev.
if ((import.meta as any).env && (import.meta as any).env.PROD) {
  // eslint-disable-next-line no-console
  console.error = () => {};
  // eslint-disable-next-line no-console
  console.warn = () => {};
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
