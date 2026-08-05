/*
===========================================
 UNIVERSAL PWA SERVICE WORKER
 Versão 1.0
===========================================
*/

const CACHE_NAME = "universal-pwa-cache";

/*
===========================================
 Instala imediatamente
===========================================
*/

self.addEventListener("install", () => {

    self.skipWaiting();

});

/*
===========================================
 Assume controle imediatamente
===========================================
*/

self.addEventListener("activate", event => {

    event.waitUntil((async () => {

        const keys = await caches.keys();

        await Promise.all(

            keys.map(key => {

                if (key !== CACHE_NAME) {

                    return caches.delete(key);

                }

            })

        );

        await self.clients.claim();

    })());

});

/*
===========================================
 Fetch
===========================================
*/

self.addEventListener("fetch", event => {

    if (event.request.method !== "GET")
        return;

    if (!event.request.url.startsWith("http"))
        return;

    const url = new URL(event.request.url);

    /*
    ==============================
    HTML
    Network First
    ==============================
    */

    if (
        event.request.mode === "navigate" ||
        url.pathname.endsWith(".html")
    ) {

        event.respondWith(networkFirst(event.request));
        return;

    }

    /*
    ==============================
    JSON
    Network First
    ==============================
    */

    if (url.pathname.endsWith(".json")) {

        event.respondWith(networkFirst(event.request));
        return;

    }

    /*
    ==============================
    Imagens
    Cache First
    ==============================
    */

    if (

        url.pathname.match(/\.(png|jpg|jpeg|gif|svg|webp|ico)$/i)

    ) {

        event.respondWith(cacheFirst(event.request));
        return;

    }

    /*
    ==============================
    Fontes
    Cache First
    ==============================
    */

    if (

        url.pathname.match(/\.(woff|woff2|ttf|otf)$/i)

    ) {

        event.respondWith(cacheFirst(event.request));
        return;

    }

    /*
    ==============================
    CSS / JS
    Stale While Revalidate
    ==============================
    */

    if (

        url.pathname.endsWith(".css") ||

        url.pathname.endsWith(".js")

    ) {

        event.respondWith(staleWhileRevalidate(event.request));
        return;

    }

});

/*
===========================================
 Network First
===========================================
*/

async function networkFirst(request){

    try{

        const response = await fetch(request);

        if(response.ok){

            const cache = await caches.open(CACHE_NAME);

            cache.put(request,response.clone());

        }

        return response;

    }

    catch{

        const cache = await caches.match(request);

        return cache || Response.error();

    }

}

/*
===========================================
 Cache First
===========================================
*/

async function cacheFirst(request){

    const cache = await caches.match(request);

    if(cache)
        return cache;

    const response = await fetch(request);

    if(response.ok){

        const c = await caches.open(CACHE_NAME);

        c.put(request,response.clone());

    }

    return response;

}

/*
===========================================
 Stale While Revalidate
===========================================
*/

async function staleWhileRevalidate(request){

    const cache = await caches.match(request);

    const network = fetch(request)

    .then(async response=>{

        if(response.ok){

            const c = await caches.open(CACHE_NAME);

            c.put(request,response.clone());

        }

        return response;

    });

    return cache || network;

}
