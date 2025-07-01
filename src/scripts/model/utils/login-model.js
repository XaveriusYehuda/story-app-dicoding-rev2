// src/model/login-model.js
import API_ENDPOINTS from './api-endpoints.js';
import StoryDatabase from './story-database.js'; // Import StoryDatabase
// deleteDB tidak perlu di sini jika StoryDatabase sudah membersihkan semua yang relevan

class AuthModel {
  constructor(baseUrl = API_ENDPOINTS.LOGIN) {
    this.baseUrl = baseUrl;
  }

  static getToken() {
    return localStorage.getItem('authToken');
  }

  static setToken(token) {
    localStorage.setItem('authToken', token);
  }

  static getUserName() { // Menambahkan getter untuk nama pengguna
    return localStorage.getItem('userName');
  }

  static getUserId() { // Menambahkan getter untuk user ID
    return localStorage.getItem('userId');
  }

  // Metode untuk membersihkan cache Service Worker (Model yang bertanggung jawab untuk ini)
  static async _clearServiceWorkerCaches() {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      console.log('Sending message to service worker to clear caches...');
      return new Promise((resolve, reject) => {
        const messageChannel = new MessageChannel();

        messageChannel.port1.onmessage = (event) => {
          if (event.data.status === 'success') {
            console.log('Service worker caches cleared successfully.');
            resolve();
          } else {
            console.error('Failed to clear service worker caches:', event.data.error);
            reject(new Error(event.data.error));
          }
        };

        navigator.serviceWorker.controller.postMessage({ action: 'clearAllCaches' }, [messageChannel.port2]);
      });
    } else {
      console.warn('Service Worker not registered or active. Cannot clear caches.');
      return Promise.resolve();
    }
  }

  // Fungsi untuk menghapus semua data di IndexedDB (Model yang bertanggung jawab)
  static async _clearAllIndexedDBData() {
    console.log('Clearing all data in IndexedDB...');
    try {
      await StoryDatabase.clearStories();
      // Jika ada object store lain selain 'stories' di StoryDatabase, pastikan juga dibersihkan
      console.log('All IndexedDB data (stories) cleared successfully.');
    } catch (error) {
      console.error('Failed to clear IndexedDB data:', error);
      throw error;
    }
  }

  /**
   * Authenticate user with email and password
   * @param {string} email - User's email address
   * @param {string} password - User's password
   * @returns {Promise<Object>} Response object with success status, data, and error
   */
  async login(email, password) { // Ini adalah metode instance, jadi Presenter akan memanggil instance.login
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      return {
        success: true,
        data: {
          message: data.message,
          userId: data.loginResult.userId,
          name: data.loginResult.name,
          token: data.loginResult.token
        },
        error: null
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error.message || 'An error occurred during login'
      };
    }
  }

  /**
   * Validate email format
   * @param {string} email - Email to validate
   * @returns {boolean} True if email is valid
   */
  static isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  /**
   * Store authentication data in localStorage
   * @param {string} token - Authentication token
   * @param {string} userId - User ID
   * @param {string} name - User's name
   */
  static storeAuthData(token, userId, name) { // Tetap statis
    localStorage.setItem('authToken', token);
    localStorage.setItem('userId', userId);
    localStorage.setItem('userName', name);
  }

  /**
   * Check if user is authenticated
   * @returns {boolean} True if authentication token exists
   */
  static isAuthenticated() { // Tetap statis
    return !!localStorage.getItem('authToken');
  }

  /**
   * Clear authentication data and all application data (SW caches, IndexedDB)
   */
  static async clearAuthData() { // Tetap statis, panggil metode statis lainnya
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');

    await AuthModel._clearAllIndexedDBData(); // Panggil metode statis
    await AuthModel._clearServiceWorkerCaches(); // Panggil metode statis
  }
}

export default AuthModel;