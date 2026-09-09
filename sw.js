/* sw.js — network first, always.
 *
 * The previous worker pinned a phone to the 2026-08-25 build and kept
 * serving it after every upload, every reload, and a cache clear. A cached
 * copy that outlives its replacement is worse than no cache at all.
 *
 * So: every request goes to the network first. The cache is only ever a
 * fallback for being offline, and it is rewritten on every successful
 * fetch. There is no path here that can serve a stale page while a newer
 * one exists.
 */

const CACHE = "bb-net-first-v3";

self.addEventListener("install", (e) => {
  // Take over immediately rather than waiting for every tab to close.
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    // Drop every cache the old worker left behind.
    const names = await caches.keys();
    await Promise.all(names.filter((n) => n !== CACHE).map((n) => caches.delete(n)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;

  e.respondWith((async () => {
    try {
      // Network first, and cache-busted so no intermediate can hold a copy.
      const fresh = await fetch(req, { cache: "no-store" });
      if (fresh && fresh.ok) {
        const c = await caches.open(CACHE);
        c.put(req, fresh.clone());
      }
      return fresh;
    } catch (err) {
      // Offline only.
      const hit = await caches.match(req);
      if (hit) return hit;
      throw err;
    }
  })());
});

/* An escape hatch, in case a future worker does the same thing:
   the page can post {type:"nuke"} and every cache is dropped. */
self.addEventListener("message", (e) => {
  if (e.data && e.data.type === "nuke") {
    caches.keys().then((ns) => Promise.all(ns.map((n) => caches.delete(n))))
      .then(() => self.registration.unregister());
  }
});
