// src/views/all-story-view.js
import '../../../styles/all-story.css';
import { createStoryItemTemplate } from '../components/story-item.js';
// Import semua model yang dibutuhkan oleh View atau untuk di-inject ke Presenter
import BookmarkModel from '../../model/utils/bookmark-model.js'; // Gunakan fasad BookmarkModel
import AllStoryPresenter from '../../controllers/presenters/all-story-presenters.js';
import StoryModel from '../../model/utils/all-story-model.js'; // Pastikan path benar
import { initDatabase } from '../../model/utils/story-database.js'; // Pastikan path benar
import AuthModel from '../../model/utils/login-model.js'; // Ini AuthModel Anda (dari login-model.js)
import NotificationModel from '../../model/utils/notification-model.js'; // Hapus duplikasi ini

class AllStoryView {
  #presenter;

  getTemplate() {
    return `
      <header>
        <div class="header-content">
        <a href="#mainContent" class="skip-link">Skip to main content</a>
          <a href="#/login" id="logoutBtn" class="back-button">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Logout
          </a>
          <div id="userInfo"></div>
          <button id="subscribeBtn">Subscribe</button>
          <button id="unsubscribeBtn">Unsubscribe</button>
          <div id="notifStatus"></div> </div>
      </header>
      <main id='mainContent' tabindex="-1"> <h1>Story List</h1>
        <h2>Bagikan Ceritamu!</h2>
        <p>Temukan cerita menarik dari pengguna Dicoding.</p>
        <a id="tambahBtn" href="#/add">Tambah Cerita</a>
        <a id="bookmarkPageBtn" href="#/bookmark">Cerita Favorit Anda</a>
        <div id="story-container"></div>
      </main>
      <footer style="text-align: center; padding: 1.5rem 0; background: #f5f5f5; color: #333; font-size: 1rem;">
        <p>&copy; 2025 Dicoding Story App. All rights reserved.</p>
      </footer>
    `;
  }

  getElements() {
    return {
      logoutBtn: document.getElementById('logoutBtn'),
      storyContainer: document.getElementById('story-container'),
      userInfoDiv: document.getElementById('userInfo'),
      mainContent: document.querySelector('#mainContent'),
      skipLink: document.querySelector('.skip-link'),
      subscribeBtn: document.getElementById('subscribeBtn'),
      unsubscribeBtn: document.getElementById('unsubscribeBtn'),
      bookmarkPageBtn: document.getElementById('bookmarkPageBtn'),
      notifStatus: document.getElementById('notifStatus'),
    };
  }

  bindBookmarkPageButton(handler) {
    const { bookmarkPageBtn } = this.getElements();
    if (bookmarkPageBtn) {
      bookmarkPageBtn.addEventListener('click', handler);
    }
  }

  bindSubscribeButton(handler) {
    const { subscribeBtn } = this.getElements();
    if (subscribeBtn) {
      subscribeBtn.addEventListener('click', handler);
    }
  }

  bindUnsubscribeButton(handler) {
    const { unsubscribeBtn } = this.getElements();
    if (unsubscribeBtn) {
      unsubscribeBtn.addEventListener('click', handler);
    }
  }

  showSubscribeButton(isSubscribed) {
    const { subscribeBtn, unsubscribeBtn } = this.getElements();
    if (subscribeBtn && unsubscribeBtn) {
      if (isSubscribed) {
        subscribeBtn.style.display = 'none';
        unsubscribeBtn.style.display = 'inline-block';
      } else {
        subscribeBtn.style.display = 'inline-block';
        unsubscribeBtn.style.display = 'none';
      }
    }
  }

  showNotifStatus(message, isError = false) {
    const { notifStatus } = this.getElements();
    if (notifStatus) {
      notifStatus.textContent = message;
      notifStatus.style.color = isError ? 'red' : 'green';
    }
  }

  bindLogoutButton(handler) {
    const { logoutBtn } = this.getElements();
    if (logoutBtn) {
      logoutBtn.addEventListener('click', handler);
    }
  }

  bindBookmarkButton(handler) {
    this._bookmarkButtonClickHandler = handler;
  }

  // --- Metode untuk Presenter berkomunikasi dengan View tentang Notifikasi ---
  async showNotificationPermissionPrompt() {
    return Notification.requestPermission();
  }

  async getNotificationPermission() {
    return Notification.permission;
  }

  checkNotificationSupport() {
    return {
      supported: 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window
    };
  }

  showNotificationSupportWarning() {
    this.showNotifStatus('Push notification tidak didukung di browser ini.', true);
  }

  showNotificationPermissionDeniedWarning() {
    this.showNotifStatus('Izin notifikasi ditolak. Anda tidak akan menerima push notifikasi.', true);
  }

  showGenericNotificationError(message) {
    this.showNotifStatus(`Terjadi kesalahan notifikasi: ${message}`, true);
  }

  async renderStories(stories) {
    const { storyContainer } = this.getElements();
    if (storyContainer) {
      storyContainer.innerHTML = '';
      for (const story of stories) {
        const storyEl = document.createElement('div');
        storyEl.classList.add('story');
        // createStoryItemTemplate sekarang akan menyertakan data-id pada link/tombol detail
        storyEl.innerHTML += createStoryItemTemplate(story, story.isBookmarked);
        storyContainer.appendChild(storyEl);
      }
      this._bindBookmarkButtonsToElements(); // Ini sudah ada untuk bookmark
      // Tidak perlu bind khusus untuk "View Details / Map" jika router yang menanganinya
    }
  }

  updateBookmarkButton(storyId, isBookmarked) {
    const button = document.querySelector(`.bookmarkBtn[data-id="${storyId}"]`);
    if (button) {
      button.textContent = isBookmarked ? 'Hapus Bookmark' : 'Simpan Cerita';
    }
  }

  _bindBookmarkButtonsToElements() {
    const { storyContainer } = this.getElements();
    if (!storyContainer || !this._bookmarkButtonClickHandler) return;

    const buttons = storyContainer.querySelectorAll('.bookmarkBtn');
    buttons.forEach((btn) => {
      // Lebih baik hapus listener yang spesifik daripada semua
      if (btn._bookmarkListener) {
        btn.removeEventListener('click', btn._bookmarkListener);
      }
      const newListener = (e) => {
        const id = btn.getAttribute('data-id');
        this._bookmarkButtonClickHandler(id);
      };
      btn.addEventListener('click', newListener);
      btn._bookmarkListener = newListener; // Simpan referensi listener
    });
  }

  handleSkipLinkAutoFocus() {
    const { skipLink } = this.getElements();
    if (!skipLink) return;

    function checkScroll() {
      if (window.scrollY === 0) {
        skipLink.style.top = '80px';
        skipLink.style.left = '50px';
        skipLink.tabIndex = 0;
        skipLink.focus();
      } else {
        skipLink.style.top = '-100px';
        skipLink.tabIndex = -1;
        skipLink.blur();
      }
    }

    window.addEventListener('scroll', checkScroll);
    window.addEventListener('load', checkScroll);
  }

  displayLoginPrompt() {
    const { storyContainer } = this.getElements();
    if (storyContainer) {
      storyContainer.innerHTML = `<p>Anda harus <a href="#/login">login</a> terlebih dahulu untuk melihat daftar cerita.</p>`;
    }
  }

  displayErrorMessage(message) {
    const { storyContainer } = this.getElements();
    if (storyContainer) {
      storyContainer.innerHTML = `<p>Error: ${message}</p>`;
    }
  }

  showMessage(message) {
    alert(message);
  }

  focusMainContent() {
    const { mainContent, skipLink } = this.getElements();
    if (!mainContent || !skipLink) return;

    if (!skipLink._focusHandlerAdded) {
      skipLink.addEventListener('click', function (event) {
        event.preventDefault();
        skipLink.blur();
        const firstButton = mainContent.querySelector('.story-item__view-on-map');
        if (firstButton) {
          firstButton.focus();
        } else {
          mainContent.focus();
        }
        mainContent.scrollIntoView();
      });
      skipLink._focusHandlerAdded = true;
    }
  }

  redirectToLogin() {
    window.location.hash = '#/login';
  }

  redirectToBookmarkPage() {
    window.location.hash = '#/bookmark';
  }

  async render() {
    return this.getTemplate();
  }

  async afterRender() {
    // Inisialisasi semua Model di sini (sebagai instance jika mereka memiliki metode instance)
    const storyModel = new StoryModel();
    const authModel = new AuthModel(); // Inisialisasi sebagai instance karena login() adalah metode instance
    const notificationModel = new NotificationModel(); // Inisialisasi sebagai instance
    const bookmarkModel = new BookmarkModel(); // Inisialisasi sebagai instance

    await initDatabase().catch(err => {
      console.error('Failed to initialize database:', err);
    });

    // Injeksi semua model ke Presenter melalui konstruktor
    this.#presenter = new AllStoryPresenter({
      view: this,
      storyModel: storyModel,
      authModel: authModel,
      notificationModel: notificationModel,
      bookmarkModel: bookmarkModel,
    });
    await this.#presenter.initialize(); // Initialize akan memuat cerita dan memeriksa status notifikasi
  }
}

export default AllStoryView;