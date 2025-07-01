// src/model/utils/bookmark-model.js
import BookmarkModelDatabase from './bookmark-database'; // Menggunakan nama kelas yang baru

class BookmarkModel {
  // Metode ini sekarang hanya mendelegasikan ke BookmarkModelDatabase
  async getAllBookmarks() {
    return BookmarkModelDatabase.getAllBookmarks();
  }

  async deleteBookmark(id) {
    return BookmarkModelDatabase.deleteBookmark(id);
  }

  async isBookmarked(id) { // Tambahkan jika dibutuhkan oleh Presenter lain
    return BookmarkModelDatabase.isBookmarked(id);
  }

  async putBookmark(story) { // Tambahkan jika dibutuhkan oleh Presenter lain
    return BookmarkModelDatabase.putBookmark(story);
  }
}

export default BookmarkModel;