/* ============================================================
   Fuji-Haya welcome banner - offline service worker.
   Caches the banner on first visit so it keeps rendering with
   no internet (e.g. a smart TV that drops off the network).
   Only active over http(s); ignored on file:// USB playback,
   where the files are already local.
   ============================================================ */
var CACHE = 'fujihaya-banner-v2';

/* Relative paths: works whether the site is at the domain root
   or under a GitHub Pages project path like /welcome-banner/. */
var ASSETS = ['./', './index.html', './welcome-guest.html', './logo.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE)
      .then(function (c) { return c.addAll(ASSETS); })
      .then(function () { return self.skipWaiting(); })
      .catch(function () { /* a miss here must not block activation */ })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys()
      .then(function (keys) {
        return Promise.all(keys.map(function (k) {
          return k === CACHE ? null : caches.delete(k);
        }));
      })
      .then(function () { return self.clients.claim(); })
  );
});

/* Cache-first: instant paint offline, refreshed in the background
   whenever the network happens to be available. */
self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;

  e.respondWith(
    caches.match(req).then(function (hit) {
      var live = fetch(req).then(function (res) {
        if (res && res.status === 200 && res.type === 'basic') {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copy); });
        }
        return res;
      }).catch(function () {
        /* offline: fall back to whatever is cached, else the page itself */
        return hit || caches.match('./index.html');
      });

      return hit || live;
    })
  );
});
