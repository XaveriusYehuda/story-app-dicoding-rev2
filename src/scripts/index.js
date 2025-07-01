// index.js
// CSS imports
import '../styles/styles.css';

import App from './views/app'; // Ini adalah "View" utama Anda atau Router View

// NotificationModel dan NotificationPresenter sekarang akan di-import dan di-inject
// di dalam View yang relevan (misalnya AllStoryView)
// import NotificationModel from './model/utils/notification-model';
// import NotificationPresenter from './controllers/presenters/notification-presenter';


document.addEventListener('DOMContentLoaded', async () => {


  const app = new App({
    content: document.querySelector('#main-content'),
  });

  // Daftarkan Service Worker dan setup notifikasi push
  await setupPushNotification();

  await app.renderPage(); // Render halaman utama

  window.addEventListener('hashchange', async () => {
    await app.renderPage();
  });

});
// Fungsi untuk setup push notification dan service worker
async function setupPushNotification() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('Push notification tidak didukung.');
    return;
  }

  try {
    const registration = await navigator.serviceWorker.register('/story-app-dicoding-rev2/sw.js');
    console.log('Service Worker terdaftar:', registration);

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('Izin notifikasi tidak diberikan');
      return;
    }

    const isSubscribed = await isCurrentPushSubscriptionAvailable(registration);
    console.log(`Status subscription: ${isSubscribed ? 'SUDAH' : 'BELUM'} terdaftar`);
    // Tambahkan logika subscribe jika belum terdaftar, dsb.
  } catch (error) {
    console.error('Gagal setup push notification:', error);
  }
}

// Dummy function, ganti dengan implementasi cek subscription yang sesuai
async function isCurrentPushSubscriptionAvailable(registration) {
  try {
    const subscription = await registration.pushManager.getSubscription();
    return !!subscription;
  } catch (e) {
    return false;
  }
}