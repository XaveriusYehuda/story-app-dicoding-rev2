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

  // Logika inisialisasi notifikasi tidak lagi di sini secara langsung.
  // NotificationPresenter akan diinisialisasi di dalam View yang relevan (misalnya AllStoryView)
  // dan di-inject melalui constructor AllStoryPresenter.
  // const notificationModel = new NotificationModel();
  // const notificationPresenter = new NotificationPresenter({
  //   view: app, // Jika App adalah View global untuk Notifikasi
  //   notificationModel: notificationModel,
  // });
  // await notificationPresenter.initializeNotifications(); // Ini akan dipicu oleh Presenter lain

  await app.renderPage(); // Render halaman utama

  window.addEventListener('hashchange', async () => {
    await app.renderPage();
  });

});