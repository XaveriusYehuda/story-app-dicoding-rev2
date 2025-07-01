// src/controllers/presenters/bookmark-presenter.js
// Tidak ada import BookmarkModel di sini, akan di-inject

class BookmarkPresenter {
  #view;
  #bookmarkModel; // Gunakan nama yang lebih spesifik untuk model bookmark

  // Model sekarang di-inject
  constructor({ view, bookmarkModel }) {
    if (!view || !bookmarkModel) {
      throw new Error('View and BookmarkModel must be provided.');
    }
    this.#view = view;
    this.#bookmarkModel = bookmarkModel;
  }

  async initialize() {
    await this._loadBookmarks();
    // Presenter meminta View untuk mengikat tombol kembali,
    // dan View akan memanggil metode redirect pada dirinya sendiri.
    this.#view.bindBackButton(this._handleBackButtonClick.bind(this));
    this.#view.bindRemoveBookmarkButton(this._handleRemoveBookmark.bind(this)); // Bind handler untuk menghapus bookmark
    this.#view.focusMainContent();
  }

  async _loadBookmarks() {
    try {
      const stories = await this.#bookmarkModel.getAllBookmarks();
      this.#view.renderStories(stories);
    } catch (e) {
      this.#view.showErrorMessage('Gagal memuat cerita favorit.'); // Gunakan metode error View
      console.error('Error loading bookmarks:', e);
    }
  }

  _handleBackButtonClick() {
    this.#view.goBackToAllStories(); // View yang menangani navigasi
  }

  async _handleRemoveBookmark(storyId) {
    try {
      await this.#bookmarkModel.deleteBookmark(storyId);
      this.#view.removeStoryElement(storyId); // Beri tahu View untuk menghapus elemen UI
      this.#view.showMessage('Cerita berhasil dihapus dari favorit.'); // Beri tahu View untuk menampilkan pesan
      // Setelah menghapus, mungkin perlu memeriksa apakah daftar kosong
      const remainingStories = await this.#bookmarkModel.getAllBookmarks();
      if (remainingStories.length === 0) {
        this.#view.displayEmptyBookmarkMessage();
      }
    } catch (error) {
      this.#view.showErrorMessage('Gagal menghapus cerita dari favorit: ' + (error.message || error));
      console.error('Error removing bookmark:', error);
    }
  }
}

export default BookmarkPresenter;