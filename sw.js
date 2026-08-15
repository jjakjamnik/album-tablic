/* =========================================================
   ALBUM TABLIC REJESTRACYJNYCH
   SERVICE WORKER
   PWA — WERSJA 1.1
   ========================================================= */

const CACHE_NAME = "album-tablic-v1.1";

const FILES_TO_CACHE = [

    "./",
    "./index.html",

    "./style.css",
    "./stickers.css",
    "./plates.css",

    "./mobile/splash.css",

    "./script.js",
    "./cards.js",
    "./distance.js",

    "./mobile/splash.js",

    "./austria.js",
    "./bialorus.js",
    "./francja.js",
    "./irlandia.js",
    "./polska.js",
    "./niemcy.js",
    "./slowacja.js",
    "./rumunia.js",
    "./szwajcaria.js",
    "./ukraina.js",
    "./wielkabrytania.js",

    "./manifest.json",

    "./icons/favicon.png",
    "./icons/icon-192.png",
    "./icons/icon-512.png"

];


/* =========================================================
   INSTALACJA
   ========================================================= */

self.addEventListener("install", event => {

    event.waitUntil(

        caches.open(CACHE_NAME)
            .then(cache => {

                console.log(
                    "PWA: zapisywanie plików aplikacji."
                );

                return cache.addAll(FILES_TO_CACHE);

            })

    );

    self.skipWaiting();

});


/* =========================================================
   AKTYWACJA
   ========================================================= */

self.addEventListener("activate", event => {

    event.waitUntil(

        caches.keys().then(cacheNames => {

            return Promise.all(

                cacheNames
                    .filter(name => name !== CACHE_NAME)
                    .map(name => caches.delete(name))

            );

        })

    );

    self.clients.claim();

});


/* =========================================================
   OBSŁUGA PLIKÓW
   ========================================================= */

self.addEventListener("fetch", event => {

    /*
       Supabase zostawiamy poza cache.

       Dane naklejek muszą być pobierane
       bezpośrednio z bazy.
    */

    if (
        event.request.url.includes("supabase.co") ||
        event.request.method !== "GET"
    ) {

        return;

    }


    event.respondWith(

        caches.match(event.request)
            .then(cachedResponse => {

                if (cachedResponse) {

                    return cachedResponse;

                }


                return fetch(event.request)
                    .then(networkResponse => {

                        if (
                            networkResponse &&
                            networkResponse.status === 200 &&
                            networkResponse.type === "basic"
                        ) {

                            const responseClone =
                                networkResponse.clone();


                            caches.open(CACHE_NAME)
                                .then(cache => {

                                    cache.put(
                                        event.request,
                                        responseClone
                                    );

                                });

                        }


                        return networkResponse;

                    });

            })

    );

});
