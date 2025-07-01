// src/controllers/presenters/notification-presenter.js

// Tidak ada import langsung untuk NotificationModel atau DOM API di sini
class NotificationPresenter {
  #view;
  #notificationModel; // Private field untuk model

  constructor({ view, notificationModel }) { // Terima notificationModel sebagai argumen
    if (!view || !notificationModel) {
      throw new Error('View and NotificationModel must be provided.');
    }
    this.#view = view;
    this.#notificationModel = notificationModel; // Inisialisasi model
  }

  async initializeNotifications(token) { // Menerima token dari luar (misalnya AllStoryPresenter)
    const notificationSupport = this.#view.checkNotificationSupport(); // View memeriksa dukungan Notifikasi

    if (!notificationSupport.supported) {
      console.log('Notifications not supported');
      this.#view.showNotificationSupportWarning(); // View menampilkan peringatan
      return;
    }

    try {
      // Periksa izin notifikasi saat ini
      const permission = await this.#view.getNotificationPermission(); // View mendapatkan izin
      console.log('Notification permission:', permission);

      if (permission === 'denied') {
        this.#view.showNotificationPermissionDeniedWarning(); // View menampilkan peringatan
        return;
      }

      // Presenter hanya meminta status langganan dari Model
      const subscriptionStatus = await this.#notificationModel.getSubscriptionStatus(); //
      if (subscriptionStatus.subscribed) {
        console.log('Existing subscription found.');
        // Jika sudah berlangganan, tidak perlu melakukan apa-apa di sini.
        // Jika Anda ingin memastikan langganan valid, Anda bisa menambahkan logika di sini
        // atau mendelegasikannya ke model untuk verifikasi backend.
        // Untuk saat ini, kita anggap Presenter utama (AllStoryPresenter) yang menangani logika subscribe/unsubscribe
        // berdasarkan status ini.
      } else if (permission === 'granted') {
        // Jika izin diberikan tetapi belum berlangganan,
        // Presenter tidak akan otomatis subscribe di sini.
        // Logic subscribe/unsubscribe akan dipicu oleh aksi user di AllStoryPresenter.
        console.log('Permission granted but no active subscription. Waiting for user action.');
      } else if (permission === 'default') {
        // Jika izin default, Presenter bisa meminta View untuk prompt jika diperlukan,
        // tapi sebaiknya dipicu oleh UI (misalnya tombol subscribe).
        console.log('Notification permission is default. User needs to interact to subscribe.');
      }

    } catch (error) {
      console.error('Notification initialization error:', error);
      this.#view.showGenericNotificationError(error.message); // View menampilkan error
    }
  }

  // Metode ini sekarang hanya mendelegasikan ke Model untuk aksi unsubscribe
  async handleUnsubscribeClick(token) { // Menerima token dari presenter utama
    try {
      await this.#notificationModel.unsubscribeUserFromPush(token); // Gunakan model yang di-inject
      return { success: true };
    } catch (error) {
      console.error('Error during unsubscription:', error);
      return { success: false, error: error.message };
    }
  }

  // Metode ini sekarang hanya mendelegasikan ke Model untuk aksi subscribe
  async handleSubscribeClick(token) { // Menerima token dari presenter utama
    try {
      await this.#notificationModel.subscribeUserToPush(token); // Gunakan model yang di-inject
      return { success: true };
    } catch (error) {
      console.error('Error during subscription:', error);
      return { success: false, error: error.message };
    }
  }

  // Metode untuk mendapatkan status langganan dari Model
  async getSubscriptionStatus() {
    return this.#notificationModel.getSubscriptionStatus(); //
  }
}

export default NotificationPresenter;