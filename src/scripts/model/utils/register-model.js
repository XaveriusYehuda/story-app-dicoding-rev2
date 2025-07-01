import API_ENDPOINTS from "./api-endpoints.js"; // This import is allowed for the model

class AuthApiModel {
  constructor(baseUrl = API_ENDPOINTS.REGISTER || 'https://story-api.dicoding.dev/v1/register') {
    this.baseUrl = baseUrl;
  }

  async register({ name, email, password }) {
    try {
      const payload = { name, email, password };
      console.log('Request payload:', payload);

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const text = await response.text();
      console.log('Raw response:', text);
      const data = text ? JSON.parse(text) : {};
      console.log('Data response:', data);

      if (response.ok) {
        return { success: true, data, error: null };
      }
      throw new Error(data.message || 'Registration failed');
    } catch (error) {
      return { success: false, data: null, error: error.message };
    }
  }

  /**
   * Check if an email is valid
   * @param {string} email - Email to validate
   * @returns {boolean} - True if email is valid
   */
  static isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  /**
   * Check if password meets requirements
   * @param {string} password - Password to validate
   * @returns {boolean} - True if password is valid
   */
  static isValidPassword(password) {
    return password.length >= 8;
  }
}

export default AuthApiModel;