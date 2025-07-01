// src/views/bookmark-view.js
import '../../../styles/all-story.css';
import { createStoryItemTemplate } from '../components/story-item';
// Import BookmarkModel yang akan di-inject ke Presenter
import BookmarkModel from '../../model/utils/bookmark-model';
import BookmarkPresenter from '../../controllers/presenters/bookmark-presenter'; // Import Presenter

class BookmarkView {
  #presenter; // Deklarasi field pribadi

  getTemplate() {
    return `
      <header>
        <a href="#bookmarkMain" class="skip-link">Skip to main content</a>
        <div class="header-content">
          <a href="#/" id="backBtn" class="back-button">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Kembali
          </a>
        </div>
      </header>
      <main id='bookmarkMain' tabindex="-1"> <h1>Cerita Favorit Anda</h1>
        <p>Kumpulan cerita yang telah Anda simpan.</p>
        <div id="notifStatus" style="margin-bottom: 1rem;"></div> <div id="bookmark-story-container"></div>
      </main>
      <footer style="text-align: center; padding: 1.5rem 0; background: #f5f5f5; color: #333; font-size: 1rem;">
        <p>&copy; 2025 Dicoding Story App. All rights reserved.</p>
      </footer>
    `;
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

  getElements() {
    return {
      backBtn: document.getElementById('backBtn'),
      storyContainer: document.getElementById('bookmark-story-container'),
      skipLink: document.querySelector('.skip-link'),
      mainContent: document.getElementById('bookmarkMain'), // Pastikan ini mengarah ke elemen main
      notifStatus: document.getElementById('notifStatus'), // Ambil elemen notifStatus
    };
  }

  bindBackButton(handler) {
    const { backBtn } = this.getElements();
    if (backBtn) {
      // Pastikan handler tidak dipicu dua kali jika sudah ada.
      // Ini penting jika view dirender ulang tanpa instance baru.
      // Untuk kesederhanaan, saya menggunakan addEventListener langsung,
      // tapi dalam router yang lebih kompleks, Anda mungkin perlu cleanup.
      backBtn.addEventListener('click', handler);
    }
  }

  // Metode untuk mengikat tombol hapus bookmark
  bindRemoveBookmarkButton(handler) {
    this._removeBookmarkHandler = handler; // Simpan handler dari Presenter
  }

  showNotifStatus(message, isError = false) {
    const { notifStatus } = this.getElements();
    if (notifStatus) {
      notifStatus.textContent = message;
      notifStatus.style.color = isError ? 'red' : 'green';
    }
  }

  // Metode untuk menampilkan pesan sukses
  showMessage(message) {
    alert(message); // Bisa diganti dengan toast atau notifikasi lain
  }

  // Metode untuk menampilkan pesan error
  showErrorMessage(message) {
    alert(`Error: ${message}`); // Bisa diganti dengan toast atau notifikasi lain
  }

  async renderStories(stories) {
    const { storyContainer } = this.getElements();
    if (storyContainer) {
      storyContainer.innerHTML = '';
      if (!stories || stories.length === 0) {
        this.displayEmptyBookmarkMessage();
        return;
      }
      for (const story of stories) {
        const storyEl = document.createElement('div');
        storyEl.classList.add('story');
        storyEl.setAttribute('data-story-id', story.id); // Tambahkan data attribute untuk ID
        storyEl.innerHTML += createStoryItemTemplate(story, true); // true karena ini halaman bookmark
        storyContainer.appendChild(storyEl);
      }
      this._bindRemoveBookmarkButtonsToElements(); // Panggil metode internal untuk mengikat event
    }
  }

  displayEmptyBookmarkMessage() {
    const { storyContainer } = this.getElements();
    if (storyContainer) {
      storyContainer.innerHTML = '<p>Belum ada cerita yang disimpan.</p>';
    }
  }

  // Metode internal untuk mengikat event listener setelah elemen dirender
  _bindRemoveBookmarkButtonsToElements() {
    const { storyContainer } = this.getElements();
    if (!storyContainer || !this._removeBookmarkHandler) return;

    const buttons = storyContainer.querySelectorAll('.bookmarkBtn');
    buttons.forEach((btn) => {
      // Penting: Hapus listener lama jika elemen mungkin dirender ulang
      btn.removeEventListener('click', this._lastRemoveBookmarkListener);
      const newListener = (e) => {
        const id = btn.getAttribute('data-id');
        this._removeBookmarkHandler(id); // Panggil handler dari Presenter
      };
      btn.addEventListener('click', newListener);
      this._lastRemoveBookmarkListener = newListener; // Simpan referensi listener untuk penghapusan di masa mendatang
    });
  }

  // Metode untuk menghapus elemen cerita dari DOM
  removeStoryElement(storyId) {
    const { storyContainer } = this.getElements();
    if (storyContainer) {
      const storyElement = storyContainer.querySelector(`.story[data-story-id="${storyId}"]`);
      if (storyElement) {
        storyElement.remove();
      }
    }
  }

  focusMainContent() {
    const { mainContent, skipLink } = this.getElements();
    if (!mainContent || !skipLink) return;
    if (!skipLink._focusHandlerAdded) {
      skipLink.addEventListener('click', function (event) {
        event.preventDefault();
        skipLink.blur();
        mainContent.focus();
        mainContent.scrollIntoView();
      });
      skipLink._focusHandlerAdded = true;
    }
  }

  // Metode untuk View melakukan redirect ke halaman all stories
  goBackToAllStories() {
    window.location.hash = '#/';
  }

  async render() {
    return this.getTemplate();
  }

  async afterRender() {
    // Inisialisasi BookmarkModel
    const bookmarkModel = new BookmarkModel();

    // Inisialisasi Presenter dan inject View dan Model
    this.#presenter = new BookmarkPresenter({
      view: this,
      bookmarkModel: bookmarkModel, // Inject model ke presenter
    });
    await this.#presenter.initialize();
    // Aktifkan skip link autofocus seperti di all-story-view
    this.handleSkipLinkAutoFocus();
  }
}

export default BookmarkView;