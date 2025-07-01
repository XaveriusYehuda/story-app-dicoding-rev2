// src/model/utils/story-database.js
import { openDB } from 'idb';

const DATABASE_NAME = 'story-app-db';
const DATABASE_VERSION = 3;
const OBJECT_STORE_NAME = 'stories';

export function initDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('stories')) {
        db.createObjectStore('stories', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('bookmarks')) {
        db.createObjectStore('bookmarks', { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve();
    request.onerror = (event) => reject(event.target.error);
  });
}

const StoryDatabase = {
  async open() {
    return openDB(DATABASE_NAME, DATABASE_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(OBJECT_STORE_NAME)) {
          db.createObjectStore(OBJECT_STORE_NAME, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('bookmarks')) {
          db.createObjectStore('bookmarks', { keyPath: 'id' });
        }
      },
    });
  },

  async getStoryDetail(storyId) {
    const db = await this.open();
    return db.get(OBJECT_STORE_NAME, storyId);
  },

  async getAllStories() {
    const db = await this.open();
    return db.getAll(OBJECT_STORE_NAME);
  },

  async putStories(stories) {
    const db = await this.open();
    const tx = db.transaction(OBJECT_STORE_NAME, 'readwrite');
    const store = tx.objectStore(OBJECT_STORE_NAME);
    await Promise.all(stories.map(story => store.put(story)));
    return tx.done;
  },

  async clearStories() {
    const db = await this.open();
    const tx = db.transaction(OBJECT_STORE_NAME, 'readwrite');
    const store = tx.objectStore(OBJECT_STORE_NAME);
    await store.clear();
    return tx.done;
  },
};

export default StoryDatabase;