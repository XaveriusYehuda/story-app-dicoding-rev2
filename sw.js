import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { NetworkFirst, CacheFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration'; // Hanya satu kali

// Precache semua aset yang di-generate oleh injectManifest
precacheAndRoute(self.__WB_MANIFEST || []);

// VAPID Public Key Anda
const VAPID_PUBLIC_KEY = 'BCCs2eonMI-6H2ctvFaWg-UYdDv387Vno_bzUzALpB442r2lCnsHmtrx8biyPi_E-1fSGABK_Qs_GlvPoJJqxbk'; //

// Fungsi untuk urlBase64ToUint8Array (diperlukan untuk konversi VAPID key)
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4); //
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/'); //
const rawData = self.atob(base64); // Ganti window.atob dengan self.atob  const outputArray = new Uint8Array(rawData.length); //
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i); //
  }
  return outputArray; //
}

// Event listener untuk push notification
self.addEventListener('push', (event) => {
  console.log('Service worker pushing...');
  let notificationData = {
    title: 'Dicoding Story App',
    options: {
      body: 'Ada notifikasi baru!',
      icon: 'images/logo-dicoding-story-app-196x196.png', // Ganti sesuai path icon Anda
      badge: 'images/logo-dicoding-story-app-48x48.png', // Ganti sesuai path badge Anda
    },
  };

  if (event.data) {
    try {
      const data = event.data.json();
      notificationData.title = data.title || notificationData.title;
      notificationData.options = { ...notificationData.options, ...data.options };
    } catch (e) {
      // Jika parsing gagal, gunakan default
      console.warn('Push event data is not valid JSON:', e);
    }
  }

  event.waitUntil(
    self.registration.showNotification(
      notificationData.title,
      notificationData.options
    )
  );
});

// self.addEventListener('push', (event) => {
//   console.log('Service worker pushing...');
 
//   async function chainPromise() {
//     await self.registration.showNotification('Ada laporan baru untuk Anda!', {
//       body: 'Terjadi kerusakan lampu jalan di Jl. Melati',
//     });
//   }
 
//   event.waitUntil(chainPromise());
// });



// 1. Caching untuk halaman HTML (misalnya index.html)
registerRoute(
  ({ request }) => request.destination === 'document',
  new StaleWhileRevalidate({ // Atau CacheFirst jika halaman jarang berubah
    cacheName: 'html-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 10,
        maxAgeSeconds: 24 * 60 * 60, // 24 jam
      }),
    ],
  })
);

// 2. Caching untuk CSS
registerRoute(
  ({ request }) => request.destination === 'style',
  new StaleWhileRevalidate({
    cacheName: 'css-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 20,
        maxAgeSeconds: 7 * 24 * 60 * 60, // 7 hari
      }),
    ],
  })
);

// 3. Caching untuk JavaScript (aplikasi Anda)
registerRoute(
  ({ request }) => request.destination === 'script',
  new StaleWhileRevalidate({
    cacheName: 'js-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 7 * 24 * 60 * 60,
      }),
    ],
  })
);

// Caching API untuk daftar cerita menggunakan StaleWhileRevalidate
registerRoute(
  ({ url }) => url.href.startsWith('https://story-api.dicoding.dev/v1/stories'), //
  new NetworkFirst({
    cacheName: 'story-api-cache', //
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50, //
        maxAgeSeconds: 24 * 60 * 60, //
      }),
    ],
  })
);



// Caching khusus gambar dari API story (misal: https://story-api.dicoding.dev/v1/xxx.jpg)
registerRoute(
  ({ url }) => 
    url.origin === 'https://story-api.dicoding.dev' &&
    url.pathname.startsWith('/v1/stories/') &&
    url.pathname.match(/\.(jpg|jpeg|png|webp|gif)$/i),
  new CacheFirst({
    cacheName: 'story-api-images-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 60 * 24 * 60 * 60, // 60 hari
      }),
    ],
  })
);


// Caching untuk aset gambar statis aplikasi (icon, badge, dsb)
registerRoute(
  ({ request, url }) => request.destination === 'image',
  new StaleWhileRevalidate({
    cacheName: 'app-images-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60,
      }),
    ],
  })
);

// Caching API untuk detail cerita menggunakan StaleWhileRevalidate
// registerRoute(
//   ({ url }) => url.href.startsWith('https://story-api.dicoding.dev/v1/stories/'), // Perhatikan trailing slash untuk detail
//   new CacheFirst({
//     cacheName: 'story-detail-api-cache', // Nama cache baru untuk detail cerita
//     plugins: [
//       new ExpirationPlugin({
//         maxEntries: 20, // Jumlah maksimum detail cerita yang akan disimpan
//         maxAgeSeconds: 7 * 24 * 60 * 60, // Data detail cerita bisa disimpan lebih lama, misalnya 7 hari
//       }),
//     ],
//   })
// );

registerRoute(
  ({ url }) => url.href.startsWith('https://{s}.tile.openstreetmap.org/'), // Perluas URL agar mencakup semua tile
  new CacheFirst({ // Ubah ke CacheFirst
    cacheName: 'osm-tiles-cache', // Nama cache yang lebih spesifik
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100, // Tiles bisa banyak, tingkatkan
        maxAgeSeconds: 30 * 24 * 60 * 60, // Simpan lebih lama
      }),
    ],
  })
);

registerRoute(
  ({ url }) => url.href.startsWith('http://www.openstreetmap.org/copyright'),
  new CacheFirst({ // Ubah ke CacheFirst
    cacheName: 'osm-copyright-cache', // Nama cache yang lebih spesifik
    plugins: [
      new ExpirationPlugin({
        maxEntries: 1, // Hanya satu entry
        maxAgeSeconds: 30 * 24 * 60 * 60,
      }),
    ],
  })
);

self.addEventListener('message', (event) => {
  if (event.data && event.data.action === 'clearAllCaches') {
    const port = event.ports[0]; // Port untuk membalas pesan

    caches.keys().then(cacheNames => {
      // Filter cache yang ingin Anda hapus
      const cachesToDelete = cacheNames.filter(name =>
        name === 'story-api-cache' ||
        name === 'story-detail-api-cache'
      );

      Promise.all(cachesToDelete.map(name => caches.delete(name)))
        .then(() => {
          console.log('Cache service worker berhasil dikosongkan.');
          if (port) {
            port.postMessage({ status: 'success' }); // Kirim balasan sukses
          }
        })
        .catch(error => {
          console.error('Gagal mengosongkan cache service worker:', error);
          if (port) {
            port.postMessage({ status: 'error', error: error.message }); // Kirim balasan error
          }
        });
    });
  }
});