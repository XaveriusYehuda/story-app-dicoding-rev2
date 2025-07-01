// src/controllers/presenters/login-page-presenters.js
// Tidak ada import langsung untuk AuthModel atau utilitas sleep, akan di-inject.

class LoginPagePresenter {
  #view;
  #authModel; // Ini adalah instance dari AuthModel
  #sleepFunction; // utility function yang di-inject

  constructor({ view, authModel, sleepFunction }) {
    if (!view || !authModel || !sleepFunction) {
      throw new Error('View, AuthModel instance, and sleepFunction must be provided.');
    }
    this.#view = view;
    this.#authModel = authModel;
    this.#sleepFunction = sleepFunction;
  }

  async initialize() {
    this.#view.bindLoginFormSubmit(this._handleLoginSubmit.bind(this));

    // Periksa status otentikasi melalui AuthModel
    if (this.#authModel.constructor.isAuthenticated()) { // Akses metode statis melalui constructor
      this.#view.redirectToHome(); // View yang menangani redirect
    }
  }

  async _handleLoginSubmit(e) {
    e.preventDefault();

    this.#view.hideMessages();

    const { email, password } = this.#view.getLoginFormValues();

    try {
      // Validasi email menggunakan metode statis AuthModel
      if (!this.#authModel.constructor.isValidEmail(email)) { // Akses metode statis melalui constructor
        this.#view.displayMessage('Invalid email format.', 'error');
        return;
      }

      // Gunakan instance authModel untuk login
      const result = await this.#authModel.login(email, password);

      if (result.success) {
        // Gunakan metode statis AuthModel untuk menyimpan data otentikasi
        this.#authModel.constructor.storeAuthData(result.data.token, result.data.userId, result.data.name);

        this.#view.displayMessage(result.data.message, 'success');

        await this.#sleepFunction(1000); // Gunakan injected sleep function
        this.#view.displayMessage('Login successful! Redirecting to home page...', 'success');
        this.#view.redirectToHome(); // View yang menangani redirect
      } else {
        this.#view.displayMessage(result.error || 'Login failed. Please try again.', 'error');
      }
    } catch (error) {
      this.#view.displayMessage('An error occurred. Please check your connection and try again.', 'error');
      console.error('Error:', error);
    }
  }
}

export default LoginPagePresenter;