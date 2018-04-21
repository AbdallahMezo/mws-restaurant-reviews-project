const cacheName = 'resturants-cache-v4';
const dirsToCache = [
  './',
  '/js/dbhelper.js',
  '/js/main.js',
  '/js/restaurant_info.js',
  '/css/styles.css',
  '/img/1.jpg',
  '/img/2.jpg',
  '/img/3.jpg',
  '/img/4.jpg',
  '/img/5.jpg',
  '/img/6.jpg',
  '/img/7.jpg',
  '/img/8.jpg',
  '/img/9.jpg',
  '/img/10.jpg',
  '/data/restaurants.json',
  'index.html',
  'restaurant.html'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(cacheName)
    .then(cache => {
      return cache.addAll(dirsToCache);
    })
  )
});

self.addEventListener('fetch', function (event) {
  if (event.request.url.includes('restaurant.html?id=')) {
    const strippedurl = event.request.url.split('?')[0];
    event.respondWith(
      caches.match(strippedurl).then(function (response) {
        return response || fetch(event.response);
      })
    );
    return;
  }
  event.respondWith(
    caches.match(event.request).then(function (response) {
      return response || fetch(event.request);
    })
  );
});
