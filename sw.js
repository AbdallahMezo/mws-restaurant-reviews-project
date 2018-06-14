
const sendOfflineRequests = (event) => {
  console.log('== event ==', event);
  self.sendReview();
  self.favoriteRestaurant();
}

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open('resturants-cache-v1')
    .then(cache => {
    console.log('== caches in sw ==', caches);
    console.log('== cache in sw ==', cache);
      cache.addAll([
        'js/dbhelper.js',
        'js/main.js',
        'js/restaurant_info.js',
        'css/styles.css',
        'img/1.jpg',
        'img/2.jpg',
        'img/3.jpg',
        'img/4.jpg',
        'img/5.jpg',
        'img/6.jpg',
        'img/7.jpg',
        'img/8.jpg',
        'img/9.jpg',
        'img/10.jpg',
        'img/icon.png',
        'js/echo.min.js',
        'index.html',
        'restaurant.html',
      ]);
    })
  )
});

self.addEventListener('fetch', function (event) {
  if (event.request.url.includes('restaurant.html?id=')) {
    const strippedurl = event.request.url.split('?')[0];
    console.log('== event ==', event);
    event.respondWith(
      caches.match(strippedurl)
        .then(function (response) {
        return response || fetch(event.response);
      })
    );
    console.log('== caches ==', caches);
    return;
  }
  event.respondWith(
    caches.match(event.request)
      .then(function (response) {
      return response || fetch(event.request);
    })
  );
});

self.addEventListener('sync', function(event) {
  console.log('== event in sync ---', event);
  if (event.tag == 'backgroundSync') {
    console.log('== background syncc ==');
    event.waitUntil(sendOfflineRequests());
  }
});
