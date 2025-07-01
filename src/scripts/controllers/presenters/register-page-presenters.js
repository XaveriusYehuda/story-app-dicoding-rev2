// src/controllers/presenters/register-page-presenters.js
// Tidak ada import langsung untuk AuthApiModel, AuthModel, atau sleep, mereka akan di-inject.

class RegisterPagePresenter {
  #view;
  #registerModel; // Ini akan menjadi instance dari AuthApiModel
  #loginModel;    // Ini akan menjadi instance dari AuthModel (dari login-model.js)
  #sleepFunction;

  constructor({ view, registerModel, loginModel, sleepFunction }) {
    if (!view || !registerModel || !loginModel || !sleepFunction) {
      throw new Error('View, registerModel, loginModel, and sleepFunction must be provided.');
    }
    this.#view = view;
    this.#registerModel = registerModel; // Instance AuthApiModel di-inject
    this.#loginModel = loginModel;       // Instance AuthModel di-inject
    this.#sleepFunction = sleepFunction;
  }

  async initialize() {
    this.#view.bindRegisterFormSubmit(this._handleRegistrationSubmit.bind(this));
    this.#view.bindGuestButtonClick(this._handleGuestAccountCreation.bind(this));
  }

  async _handleRegistrationSubmit(e) {
    e.preventDefault();

    this.#view.hideMessage();

    const { name, email, password } = this.#view.getRegistrationFormValues();

    // Validasi menggunakan metode statis dari AuthApiModel (melalui instance-nya)
    const isEmailValid = this.#registerModel.constructor.isValidEmail(email); //
    const isPasswordValid = this.#registerModel.constructor.isValidPassword(password); //

    if (!isEmailValid) {
      this.#view.displayMessage('Invalid email format.', 'error');
      return;
    }
    if (!isPasswordValid) {
      this.#view.displayMessage('Password must be at least 8 characters.', 'error'); //
      return;
    }

    try {
      // Gunakan instance registerModel yang di-inject untuk registrasi
      const result = await this.#registerModel.register({ name, email, password }); //

      console.log("Result presenter:", result);
      if (!result.success) {
        this.#view.displayMessage(result.error || 'Registration failed. Please try again.', 'error');
        return;
      } else {
        this.#view.displayMessage('Registration successful! Please check your email to verify your account.', 'success');
        this.#view.resetRegistrationForm();
        await this.#sleepFunction(500);
        this.#view.redirectToLogin(); // View yang menangani redirect
      }
    } catch (error) {
      this.#view.displayMessage('An error occurred. Please check your connection and try again.', 'error');
      console.error('Error:', error);
    }
  }

  async _handleGuestAccountCreation() {
    try {
      const guestName = `Guest_${Math.random().toString(36).substring(2, 8)}`;
      const guestEmail = `${guestName.toLowerCase()}.${Math.random().toString(36).substring(2, 8)}@gmail.com`;
      const guestPassword = Math.random().toString(36).substring(2, 10);

      // Gunakan instance registerModel yang di-inject untuk registrasi guest
      const result = await this.#registerModel.register({ //
        name: guestName,
        email: guestEmail,
        password: guestPassword
      });

      if (!result.success) {
        this.#view.displayMessage('Failed to create guest account. Please try again.', 'error');
        return;
      } else {
        this.#view.displayMessage('Guest account created successfully!', 'success');

        // Simpan data guest di AuthModel (atau model khusus guest jika ada)
        // Di sini kita akan menggunakan AuthModel (login-model) untuk menyimpan data guest sementara
        this.#loginModel.storeGuestSession(guestEmail, guestPassword); // Panggil metode baru di AuthModel (login-model)

        const getGuestData = this.#loginModel.getGuestSession(); // Dapatkan data guest dari AuthModel

        if (!getGuestData) {
          this.#view.displayMessage('Failed to retrieve guest session data.', 'error');
          return;
        }
        
        // Gunakan instance loginModel yang di-inject untuk login
        const loginResult = await this.#loginModel.login(getGuestData.email, getGuestData.password); //

        if (loginResult.success) {
          // Gunakan metode statis loginModel untuk menyimpan data otentikasi
          this.#loginModel.constructor.storeAuthData(loginResult.data.token, loginResult.data.userId, loginResult.data.name); //

          await this.#sleepFunction(2000);
          this.#view.redirectToHome(); // View yang menangani redirect
        } else {
          this.#view.displayMessage('Failed to log in with guest account.', 'error');
        }
      }
    } catch (error) {
      this.#view.displayMessage('Error creating guest account.', 'error');
      console.error('Guest account error:', error);
    }
  }
}

export default RegisterPagePresenter;