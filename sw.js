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
  new RegExp('^http://localhost:1337/reviews/(.*)'),
  workbox.strategies.networkFirst(),
  'GET'
);

workbox.routing.registerRoute(
  new RegExp('^http://localhost:1337/restaurants/(.*)'),
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

const bgSyncPlugin = new workbox.backgroundSync.Plugin('restaurantQueue', {
  maxRetentionTime: 24 * 60 // Retry for max of 24 Hours
});

workbox.routing.registerRoute(
  new RegExp('^http://localhost:1337/(.*)'),
  workbox.strategies.networkOnly({
    plugins: [bgSyncPlugin]
  }),
  'POST'
);

workbox.routing.registerRoute(
  new RegExp('^http://localhost:1337/(.*)'),
  workbox.strategies.networkOnly({
    plugins: [bgSyncPlugin]
  }),
  'PUT'
);
