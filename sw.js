const CACHE_NAME='film-donusturucu-cache-v12';
const ASSETS=['./','./index.html','./app.js?v=12','./style.css','./manifest.webmanifest','./icon.svg','./worker.js'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil((async()=>{const keys=await caches.keys();await Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)));await self.clients.claim()})()));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;const u=new URL(e.request.url);if(u.origin!==self.location.origin)return;e.respondWith((async()=>{const c=await caches.open(CACHE_NAME);const hit=await c.match(e.request);if(hit)return hit;try{const r=await fetch(e.request);if(r.ok)await c.put(e.request,r.clone());return r}catch(err){return e.request.mode==='navigate'?(await c.match('./index.html')||Response.error()):Response.error()}})())});
