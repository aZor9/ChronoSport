// Enregistre le service worker (mode hors connexion / application installable).
'use strict';

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((e) => console.warn('Service worker non enregistré', e));
  });
}
