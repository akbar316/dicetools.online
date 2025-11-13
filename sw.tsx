// Removed external 3rd-party importScripts that pulled remote code into the service worker.
// Keeping a minimal, local no-op service worker so the app doesn't rely on remote providers.

// Simple placeholder service worker — extend carefully if you need offline caching.
self.addEventListener('install', (event) => {
    // Activate immediately
    self.skipWaiting();
});
self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

