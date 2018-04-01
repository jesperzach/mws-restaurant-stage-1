importScripts('https://storage.googleapis.com/workbox-cdn/releases/3.0.1/workbox-sw.js');

workbox.skipWaiting();
workbox.clientsClaim();

workbox.routing.registerRoute(
  /\.(?:html|js|css)(\?.*)?$/,
  workbox.strategies.staleWhileRevalidate(),
);

workbox.routing.registerRoute(
  /\/data/,
  workbox.strategies.staleWhileRevalidate(),
  'GET'
);

workbox.routing.registerRoute(
  /\.(?:png|gif|jpg|jpeg|svg)$/,
  workbox.strategies.cacheFirst({
    cacheName: 'images',
    plugins: [
      new workbox.expiration.Plugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60
      })
    ]
  })
);

workbox.routing.registerRoute(
  new RegExp('^https://fonts.(?:googleapis|gstatic).com/(.*)'),
  workbox.strategies.cacheFirst(),
);
