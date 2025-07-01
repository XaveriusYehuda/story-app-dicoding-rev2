// src/model/utils/bookmark-database.js (Misalnya: BookmarkModel.js)
// Ini adalah model yang berinteraksi dengan IndexedDB
const DATABASE_NAME = 'story-app-db';
const DATABASE_VERSION = 3;
const OBJECT_STORE_NAME = 'bookmarks';

class BookmarkModel {
  static _database = null;

  static async _openDatabase() {
    if (this._database) {
      return this._database;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        db.createObjectStore(OBJECT_STORE_NAME, { keyPath: 'id' });
      };

      request.onsuccess = (event) => {
        this._database = event.target.result;
        resolve(this._database);
      };

      request.onerror = (event) => {
        console.error('Failed to open IndexedDB:', event.target.error);
        reject(event.target.error);
      };
    });
  }

  static async putBookmark(story) {
    const db = await this._openDatabase();
    const transaction = db.transaction(OBJECT_STORE_NAME, 'readwrite');
    const objectStore = transaction.objectStore(OBJECT_STORE_NAME);
    return new Promise((resolve, reject) => {
      const request = objectStore.put(story);
      request.onsuccess = () => resolve();
      request.onerror = (event) => reject(event.target.error);
    });
  }

  static async deleteBookmark(id) {
    const db = await this._openDatabase();
    const transaction = db.transaction(OBJECT_STORE_NAME, 'readwrite');
    const objectStore = transaction.objectStore(OBJECT_STORE_NAME);
    return new Promise((resolve, reject) => {
      const request = objectStore.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = (event) => reject(event.target.error);
    });
  }

  static async isBookmarked(id) {
    const db = await this._openDatabase();
    const transaction = db.transaction(OBJECT_STORE_NAME, 'readonly');
    const objectStore = transaction.objectStore(OBJECT_STORE_NAME);
    return new Promise((resolve, reject) => {
      const request = objectStore.get(id);
      request.onsuccess = () => resolve(!!request.result);
      request.onerror = (event) => reject(event.target.error);
    });
  }

  static async getAllBookmarks() {
    const db = await this._openDatabase();
    const transaction = db.transaction(OBJECT_STORE_NAME, 'readonly');
    const objectStore = transaction.objectStore(OBJECT_STORE_NAME);
    return new Promise((resolve, reject) => {
      const request = objectStore.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = (event) => reject(event.target.error);
    });
  }
}

export default BookmarkModel;