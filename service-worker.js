const CACHE_NAME = 'sonic-counting-game-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/styles.css',
  '/script.js',
  '/uploads/Sonic_the_Hedgehog.png',
  'https://fonts.googleapis.com/css2?family=Varela+Round&display=swap',
  'https://assets.mixkit.co/sfx/preview/mixkit-magical-tone-notification-2334.mp3',
  'https://assets.mixkit.co/sfx/preview/mixkit-wrong-answer-buzz-941.mp3',
  'https://assets.mixkit.co/sfx/preview/mixkit-win-bells-and-voices-1277.mp3',
  'https://assets.mixkit.co/sfx/preview/mixkit-fast-rocket-whoosh-1714.mp3'
];

// התקנת Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

// פעיל כאשר מנסים לגשת לרשת
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // מוצא את הקובץ במטמון
        if (response) {
          return response;
        }
        
        // אם לא במטמון, מנסה להביא מהשרת
        return fetch(event.request)
          .then(response => {
            // אם התגובה אינה תקינה, לא שומר במטמון
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // משכפל את התגובה כי הגוף יכול להשתמש פעם אחת בלבד
            const responseToCache = response.clone();
            
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
              
            return response;
          });
      })
  );
});

// מעדכן את המטמון
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            // מוחק מטמונים ישנים
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
}); 