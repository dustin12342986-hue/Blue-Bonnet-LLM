/* sw.js — a kill switch, not a cache.
 *
 * The previous worker pinned a phone to the 2026-08-25 build and served it
 * through uploads, reloads and cache clears, because a service worker
 * intercepts the request before any of that matters. A 404 on a URL with a
 * query string was the proof: only an intercepting worker does that.
 *
 * Chrome's own guidance for a stuck worker is to deploy a no-op that
 * removes itself. This is that. It caches nothing, serves nothing, and
 * unregisters on activation. The app does not need offline support badly
 * enough to risk this happening again.
 */

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    // Every cache the old worker left, gone.
    const names = await caches.keys();
    await Promise.all(names.map((n) => caches.delete(n)));

    // Then remove itself.
    await self.registration.unregister();

    // And reload whatever it was controlling, so the page comes from the
    // network on the way out rather than one more time from the cache.
    const clients = await self.clients.matchAll({ type: "window" });
    clients.forEach((c) => c.navigate(c.url));
  })());
});

/* No fetch handler. Nothing is intercepted. Every request goes straight to
   the network exactly as it would with no worker at all. */
