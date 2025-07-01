// src/views/register-page-views.js
import '../../../styles/register-page.css';
import RegisterPagePresenter from '../../controllers/presenters/register-page-presenters'; // Import the Presenter
import AuthApiModel from '../../model/utils/register-model'; // Import the AuthApiModel (registration model)
import AuthModel from '../../model/utils/login-model'; // Import the AuthModel (login model)
import { sleep } from '../../model/utils/show-time'; // Import sleep utility

class RegisterPageView {
  #presenter;

  getTemplate() {
    return `
      <main class="container">
        <h1>Register Account</h1>
        <form id="registrationForm">
          <div class="form-group">
            <label for="username">Full Name</label>
            <input type="text" id="username" name="username" required />
          </div>
          <div class="form-group">
            <label for="email">Email</label>
            <input type="email" id="email" name="email" required />
          </div>
          <div class="form-group">
            <label for="password">Password</label>
            <input type="password" id="password" name="password" required minlength="8" />
            <div class="password-hint">Password must be at least 8 characters</div>
          </div>
          <button type="submit">Register</button>
          <button type="button" id="guestButton" class="guest-button">Continue as Guest</button>
        </form>
        <section id="message" class="message"></section>
      </main>
    `;
  }

  getElements() {
    return {
      registrationForm: document.getElementById('registrationForm'),
      guestButton: document.getElementById('guestButton'),
      messageDiv: document.getElementById('message'),
      usernameInput: document.getElementById('username'),
      emailInput: document.getElementById('email'),
      passwordInput: document.getElementById('password'),
    };
  }

  bindRegisterFormSubmit(handler) {
    const { registrationForm } = this.getElements();
    if (registrationForm) {
      registrationForm.addEventListener('submit', handler);
    }
  }

  bindGuestButtonClick(handler) {
    const { guestButton } = this.getElements();
    if (guestButton) {
      guestButton.addEventListener('click', handler);
    }
  }

  displayMessage(message, type) {
    const { messageDiv } = this.getElements();
    if (messageDiv) {
      messageDiv.textContent = message;
      messageDiv.className = `message ${type}`;
      messageDiv.style.display = 'block';
    }
  }

  hideMessage() {
    const { messageDiv } = this.getElements();
    if (messageDiv) {
      messageDiv.style.display = 'none';
    }
  }

  getRegistrationFormValues() {
    const { usernameInput, emailInput, passwordInput } = this.getElements();
    return {
      name: usernameInput.value,
      email: emailInput.value,
      password: passwordInput.value,
    };
  }

  resetRegistrationForm() {
    const { registrationForm } = this.getElements();
    if (registrationForm) {
      registrationForm.reset();
    }
  }

  // Metode untuk View melakukan redirect ke halaman login
  redirectToLogin() {
    window.location.hash = '#/login';
  }

  // Metode untuk View melakukan redirect ke halaman home
  redirectToHome() {
    window.location.hash = '#/';
  }

  // New render method for router interaction
  async render() {
    return this.getTemplate();
  }

  // New afterRender method for router interaction, where the presenter is initialized
  async afterRender() {
    // Instantiate models and utilities to pass to the presenter
    const registerModelInstance = new AuthApiModel(); // Instantiate AuthApiModel
    const loginModelInstance = new AuthModel();     // Instantiate AuthModel
    const sleepFunction = sleep;                    // Pass the sleep utility function

    this.#presenter = new RegisterPagePresenter({
      view: this,
      registerModel: registerModelInstance,
      loginModel: loginModelInstance,
      sleepFunction: sleepFunction,
    });
    await this.#presenter.initialize();
  }
}

export default RegisterPageView;