import API_ENDPOINTS from './api-endpoints.js';

class AddStoryModel {
  /**
   * Add OpenStreetMap tile layer to a Leaflet map instance
   * @param {object} L - The Leaflet global object (window.L)
   * @param {object} mapInstance - The Leaflet map instance
   */
  static addDefaultTileLayer(L, mapInstance) {
    if (!L || !mapInstance) return;
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>',
      minZoom: 5,
      maxZoom: 18,
    }).addTo(mapInstance);
  }
  // --- All DOM/Leaflet logic removed. Only API and pure logic remain in model. ---
  constructor(baseUrl = API_ENDPOINTS.ADD_STORY || 'https://story-api.dicoding.dev/v1/stories') {
    this.baseUrl = baseUrl;
  }

  /**
   * Submit a new story
   * @param {FormData} formData - Form data containing description, photo, and optional coordinates
   * @param {string} token - Authentication token
   * @returns {Promise<Object>} - Response from the API
   */
  async submitStory(formData, token) {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json(); // Langsung parse JSON karena kita cek response.ok

      if (!response.ok) { // Cek response.ok sebelum menganggap sukses
        throw new Error(data.message || 'Failed to submit story');
      }

      return {
        success: true,
        data,
        error: null,
      };
    } catch (error) {
      console.error('Error submitting story:', error);
      return {
        success: false,
        data: null,
        error: error.message || 'An error occurred while submitting the story',
      };
    }
  }

  /**
   * Validate image file
   * @param {File} file - Image file to validate
   * @returns {boolean} - True if file is valid
   */
  static isValidImage(file) {
    if (!file) return false;

    const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
    const maxSize = 1 * 1024 * 1024; // 1MB

    return validTypes.includes(file.type) && file.size <= maxSize;
  }

  /**
   * Initialize map and get current geolocation
   * This method now contains Leaflet and Geolocation interaction logic.
   * @returns {Promise<{lat: number, lon: number}>} - Promise resolves with current lat/lon
   */
  async getInitialMapLocation() {
    return new Promise((resolve, reject) => {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            console.log(`Geolocation success: Lat ${latitude}, Lon ${longitude}`); //
            resolve({ lat: latitude, lon: longitude });
          },
          (error) => {
            console.error('Error getting current position:', error); //
            // Fallback to a default location (Semarang) if geolocation fails or denied
            console.warn('Geolocation failed, defaulting to Semarang coordinates.'); //
            resolve({ lat: -7.12, lon: 110.4225 });
          },
          { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 } // Opsi untuk geolokasi
        );
      } else {
        console.warn('Geolocation is not supported by this browser. Defaulting to Semarang coordinates.'); //
        // Fallback to a default location if geolocation is not supported
        resolve({ lat: -7.12, lon: 110.4225 });
      }
    });
  }
}

export default AddStoryModel;