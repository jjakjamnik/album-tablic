/* =========================================================
   ALBUM TABLIC REJESTRACYJNYCH
   SERVICE WORKER — PWA
   WERSJA 2.0
   ========================================================= */

const CACHE_NAME = "album-tablic-v4-auth-signup-username";

const APP_SHELL_FILES = [
    "./",
    "./index.html",
    "./album.html",
    "./manifest.json",

    "./style.css",
    "./paper.css",
    "./stickers.css",
    "./plates.css",

    "./script.js",
    "./auth.js",
    "./paper.js",
    "./cards.js",
    "./distance.js",

    "./austria.js",
    "./bialorus.js",
    "./czechy.js",
    "./francja.js",
    "./irlandia.js",
    "./polska.js",
    "./niemcy.js",
    "./slowacja.js",
    "./rumunia.js",
    "./szwajcaria.js",
    "./turcja.js?v=20261126",
    "./ukraina.js",
    "./uzbekistan.js",
    "./wielkabrytania.js",

    "./icons/favicon.png",
    "./icons/icon-192.png",
    "./icons/icon-512.png"
];


/* =========================================================
   INSTALACJA — ZAPIS PODSTAWOWYCH PLIKÓW
   ========================================================= */

self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(APP_SHELL_FILES);
        })
    );

    self.skipWaiting();
});


/* =========================================================
   AKTYWACJA — USUNIĘCIE STARYCH WERSJI CACHE
   ========================================================= */

self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames
                    .filter(name =>
                        name.startsWith("album-tablic-") &&
                        name !== CACHE_NAME
                    )
                    .map(name => caches.delete(name))
            );
        }).then(() => self.clients.claim())
    );
});


/* =========================================================
   SIEĆ I TRYB OFFLINE
   ========================================================= */

self.addEventListener("fetch", event => {
    const request = event.request;

    if (request.method !== "GET") {
        return;
    }

    const requestUrl = new URL(request.url);

    // Supabase, OSRM i pozostałe usługi zewnętrzne
    // zawsze obsługujemy bezpośrednio przez sieć.
    if (requestUrl.origin !== self.location.origin) {
        return;
    }

    event.respondWith((async () => {
        try {
            // Najpierw próbujemy pobrać aktualny plik.
            const networkResponse = await fetch(request);

            if (networkResponse && networkResponse.ok) {
                const cache = await caches.open(CACHE_NAME);
                await cache.put(request, networkResponse.clone());
            }

            return networkResponse;
        } catch (error) {
            // Brak sieci: korzystamy z zapisanej kopii.
            const cachedResponse = await caches.match(request);

            if (cachedResponse) {
                return cachedResponse;
            }

            // Awaryjnie strona startowa dla nawigacji.
            if (request.mode === "navigate") {
                const startPage = await caches.match("./index.html");

                if (startPage) {
                    return startPage;
                }
            }

            return new Response(
                "Brak połączenia z internetem. Otwórz album ponownie, gdy sieć będzie dostępna.",
                {
                    status: 503,
                    statusText: "Offline",
                    headers: { "Content-Type": "text/plain; charset=utf-8" }
                }
            );
        }
    })());
});
