// app.js
import routes from '../controllers/routes/routes';
import { getActiveRoute } from '../controllers/routes/url-parser';

class App {
  constructor({ content }) {
    this._content = content;
  }

  async renderPage() {
    const token = localStorage.getItem('authToken');
    let url = getActiveRoute();
    console.log(url);

    // Logika pengalihan rute berdasarkan status autentikasi
    if (!url || !routes[url]) {
      url = '/login';
      window.location.hash = '/login';
    }

    if (!token && url !== '/register') {
      url = '/login';
      window.location.hash = '/login';
    }

    if (token && url === '/login') {
      url = '/';
      window.location.hash = '/';
    }

    const page = routes[url] || routes['/login'];

    if (!page) {
      // Fallback untuk halaman 404 jika tidak ada rute yang cocok
      if (document.startViewTransition) {
        document.startViewTransition(async () => {
          this._content.innerHTML = '<h2>404 - Halaman tidak ditemukan</h2>';
        });
      } else {
        this._content.innerHTML = '<h2>404 - Halaman tidak ditemukan</h2>';
      }
      return;
    }

    // Mengintegrasikan View Transitions API
    if (document.startViewTransition) {
      document.startViewTransition(async () => {
        // Lakukan perubahan DOM di dalam callback ini
        this._content.innerHTML = await page.render();
        await page.afterRender();
      });
    } else {
      // Fallback untuk browser yang tidak mendukung View Transitions
      this._content.innerHTML = await page.render();
      await page.afterRender();
    }
  }

   // Metode untuk memeriksa dukungan notifikasi (DOM/Browser API)
  checkNotificationSupport() {
    return {
      supported: 'Notification' in window,
      pushManagerSupported: 'serviceWorker' in navigator && 'PushManager' in window
    };
  }

  // Metode untuk mendapatkan izin notifikasi (DOM/Browser API)
  async getNotificationPermission() {
    if ('Notification' in window) {
      return Notification.permission;
    }
    return 'unsupported';
  }

  // Metode untuk meminta izin notifikasi (DOM/Browser API)
  async showNotificationPermissionPrompt() {
    if ('Notification' in window) {
      return Notification.requestPermission();
    }
    return 'unsupported';
  }

  // Metode untuk menampilkan peringatan dukungan notifikasi (DOM)
  showNotificationSupportWarning() {
    console.warn('Browser does not support notifications.');
    // Anda bisa menampilkan pesan di UI, misalnya:
    // this._content.querySelector('#notificationStatus').textContent = 'Notifications not supported by this browser.';
  }

  // Metode untuk menampilkan peringatan izin ditolak (DOM)
  showNotificationPermissionDeniedWarning() {
    console.warn('Notification permission denied.');
    // Anda bisa menampilkan pesan di UI:
    // this._content.querySelector('#notificationStatus').textContent = 'Notification permission denied.';
  }

  // Metode untuk menampilkan error notifikasi umum (DOM)
  showGenericNotificationError(message) {
    console.error('Notification error:', message);
    // Anda bisa menampilkan pesan di UI:
    // this._content.querySelector('#notificationStatus').textContent = `Notification error: ${message}`;
  }
}

export default App;