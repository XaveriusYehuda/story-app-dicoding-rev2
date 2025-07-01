import AuthModel from '../../model/utils/login-model.js';

class AllStoryPresenter {
  #view;
  #storyModel;
  #authModel;
  #notificationModel;
  #bookmarkModel; // Tambahkan bookmarkModel

  // Semua dependensi di-inject melalui konstruktor
  constructor({ view, storyModel, authModel, notificationModel, bookmarkModel }) {
    this.#view = view;
    this.#storyModel = storyModel;
    this.#authModel = authModel;
    this.#notificationModel = notificationModel;
    this.#bookmarkModel = bookmarkModel; // Injeksi bookmarkModel
  }

  async initialize() {
    this.#view.bindLogoutButton(this._handleLogout.bind(this));
    this.#view.bindSubscribeButton(this._handleSubscribe.bind(this));
    this.#view.bindUnsubscribeButton(this._handleUnsubscribe.bind(this));
    this.#view.bindBookmarkButton(this._handleBookmarkToggle.bind(this)); // Bind bookmark button
    this.#view.bindBookmarkPageButton(this._handleNavigateToBookmarkPage.bind(this)); // Bind navigation to bookmark page

    await this._loadStories();
    await this._checkSubscriptionStatus();
    this.#view.focusMainContent();
    this.#view.handleSkipLinkAutoFocus();
  }

  _handleLogout(e) {
    e.preventDefault();
    AuthModel.clearAuthData();
    this.#view.redirectToLogin(); // View yang melakukan redirect
  }

  async _loadStories() {
    const token = AuthModel.getToken(); // Dapatkan token dari AuthModel statis
    if (!token) {
      this.#view.displayLoginPrompt();
      return;
    }
    try {
      const result = await this.#storyModel.getAllStories(token, 1, 10, 0);
      if (result.success) {
        // Ambil status bookmark untuk setiap cerita
        const storiesWithBookmarkStatus = await Promise.all(
          result.data.map(async (story) => {
            const isBookmarked = await this.#bookmarkModel.isBookmarked(story.id);
            return { ...story, isBookmarked };
          })
        );
        this.#view.renderStories(storiesWithBookmarkStatus);
      } else {
        console.error('Error fetching stories:', result.error);
        this.#view.displayErrorMessage(result.error);
      }
    } catch (error) {
      console.error('Failed to fetch stories:', error);
      this.#view.displayErrorMessage('Terjadi kesalahan saat mengambil data cerita.');
    }
  }

  async _checkSubscriptionStatus() {
    // Presenter meminta status dari Model, Model yang berinteraksi dengan browser API
    const status = await this.#notificationModel.getSubscriptionStatus();
    if (!status.supported) {
      this.#view.showNotifStatus('Push notification tidak didukung di browser ini.', true);
      this.#view.showSubscribeButton(false);
      return;
    }

    if (status.subscribed) {
      this.#view.showSubscribeButton(true);
      this.#view.showNotifStatus('Anda sudah berlangganan notifikasi.');
    } else {
      this.#view.showSubscribeButton(false);
      this.#view.showNotifStatus('Anda belum berlangganan notifikasi.');
    }
  }

  async _handleSubscribe() {
    this.#view.showNotifStatus('Memproses langganan notifikasi...');
    try {
      const token = AuthModel.getToken();
      if (!token) {
        this.#view.displayErrorMessage('Authentication token is missing. Please log in.');
        this.#view.redirectToLogin();
        return;
      }
      await this.#notificationModel.subscribeUserToPush(token); // Kirim token ke Model
      this.#view.showNotifStatus('Berhasil berlangganan notifikasi!');
      this.#view.showSubscribeButton(true);
    } catch (error) {
      this.#view.showNotifStatus('Gagal berlangganan notifikasi: ' + (error.message || error), true);
      this.#view.showSubscribeButton(false);
    }
  }

  async _handleUnsubscribe() {
    this.#view.showNotifStatus('Memproses berhenti langganan...');
    try {
      const token = AuthModel.getToken();
      if (!token) {
        this.#view.displayErrorMessage('Authentication token is missing. Please log in.');
        this.#view.redirectToLogin();
        return;
      }
      await this.#notificationModel.unsubscribeUserFromPush(token); // Kirim token ke Model
      this.#view.showNotifStatus('Berhasil berhenti langganan notifikasi.');
      this.#view.showSubscribeButton(false);
    } catch (error) {
      this.#view.showNotifStatus('Gagal berhenti langganan: ' + (error.message || error), true);
      this.#view.showSubscribeButton(true);
    }
  }

  async _handleBookmarkToggle(storyId) {
    try {
      const isBookmarked = await this.#bookmarkModel.isBookmarked(storyId);
      if (isBookmarked) {
        await this.#bookmarkModel.deleteBookmark(storyId);
        this.#view.updateBookmarkButton(storyId, false); // Beri tahu View untuk update UI
        this.#view.showMessage('Cerita berhasil dihapus dari favorit.');
      } else {
        // Asumsi Presenter bisa mendapatkan data story dari state-nya atau meminta dari StoryModel jika belum ada
        // Untuk contoh ini, saya akan mengambil cerita dari StoryModel lagi
        // Dalam aplikasi nyata, mungkin Presenter sudah punya daftar cerita yang sedang ditampilkan
        const token = AuthModel.getToken();
        const result = await this.#storyModel.getAllStories(token); // Re-fetch all stories to find the specific one, not ideal for performance.
        const story = result.data.find(s => s.id === storyId);

        if (story) {
          await this.#bookmarkModel.putBookmark(story);
          this.#view.updateBookmarkButton(storyId, true); // Beri tahu View untuk update UI
          this.#view.showMessage('Cerita berhasil ditambahkan ke favorit.');
        } else {
          this.#view.displayErrorMessage('Gagal menemukan cerita untuk ditambahkan ke favorit.');
        }
      }
    } catch (error) {
      this.#view.displayErrorMessage('Gagal mengubah status favorit: ' + (error.message || error));
    }
  }

  _handleNavigateToBookmarkPage() {
    this.#view.redirectToBookmarkPage(); // View yang melakukan redirect
  }
}

export default AllStoryPresenter;