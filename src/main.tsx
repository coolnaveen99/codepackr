import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

const rootElement = document.getElementById('root');
if (rootElement) {
  rootElement.removeAttribute('data-codepackr-prerendered');
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  );
}

// Service Worker disabled after Cloudflare → Vercel migration.
// Old SWs were causing ERR_FAILED / stale shells on org devices that cannot clear cache.
// We only unregister any leftover registrations; we do not register a new SW.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.getRegistrations().then((regs) => {
      regs.forEach((reg) => {
        reg.unregister().catch(() => {});
      });
    }).catch(() => {});
    if ('caches' in window) {
      caches.keys().then((keys) => {
        keys.forEach((key) => {
          caches.delete(key).catch(() => {});
        });
      }).catch(() => {});
    }
  });
}
