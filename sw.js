importScripts('https://storage.googleapis.com/workbox-cdn/releases/3.4.1/workbox-sw.js');

workbox.skipWaiting();
workbox.clientsClaim();

workbox.routing.registerRoute(
  /\/$/,
  workbox.strategies.staleWhileRevalidate(),
);

workbox.routing.registerRoute(
  /\.(?:html|js|json|css)(\?.*)?$/,
  workbox.strategies.staleWhileRevalidate(),
);

workbox.routing.registerRoute(
  new RegExp('^http://localhost:1337/(.*)'),
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
