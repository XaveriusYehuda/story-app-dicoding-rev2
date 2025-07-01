// src/views/detail-story-views.js
import '../../../styles/story-detail.css';
import DetailStoryPagePresenter from '../../controllers/presenters/detail-story-presenters'; // Import Presenter
import DetailStoryModel from '../../model/utils/detail-story-model'; // Import Model
import AuthModel from '../../model/utils/login-model'; // Import AuthModel for injection
import getIdFromRoutes from '../../controllers/routes/url-parser'; // Import getIdFromRoutes

class DetailStoryPageView {
  #presenter;

  getTemplate() {
    return `
      <header>
        <div class="header-content">
          <a href="#/" id="backBtn" class="back-button">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Back to Stories
          </a>
          <div id="userInfo"></div>
        </div>
      </header>

      <main id="storyDetailPageMain">
        <div id="loading" class="loading">Loading story details...</div>
        <div id="error" class="error-message" style="display: none;"></div>

        <section id="storyContainer" class="story-container" style="display: none;">
          <img id="storyImage" class="story-image" src="" alt="Story Image">
          <div class="story-content">
            <div class="story-header">
              <h1 id="storyTitle" class="story-title"></h1>
              <div id="storyDate" class="story-date"></div>
            </div>
            <p id="storyDescription" class="story-description"></p>
            <div id="storyLocation" class="story-location" style="display: none;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              <span id="locationText"></span>
            </div>
            <div id="mapContainer" class="map-container" style="display: none;"></div>
          </div>
        </section>
      </main>
      <footer style="text-align: center; padding: 1.5rem 0; background: #f5f5f5; color: #333; font-size: 1rem;">
        <p>&copy; 2025 Dicoding Story App. All rights reserved.</p>
      </footer>
    `;
  }

  getElements() {
    return {
      loadingElement: document.getElementById('loading'),
      errorElement: document.getElementById('error'),
      storyContainer: document.getElementById('storyContainer'),
      storyImage: document.getElementById('storyImage'),
      storyTitle: document.getElementById('storyTitle'),
      storyDate: document.getElementById('storyDate'),
      storyDescription: document.getElementById('storyDescription'),
      storyLocation: document.getElementById('storyLocation'),
      locationText: document.getElementById('locationText'),
      mapContainer: document.getElementById('mapContainer'),
      userInfo: document.getElementById('userInfo'),
      backButton: document.getElementById('backBtn'), // Gunakan ID untuk tombol back
    };
  }

  bindBackButton(handler) {
    const { backButton } = this.getElements();
    if (backButton) {
      backButton.addEventListener('click', handler);
    }
  }

  showLoading() {
    const { loadingElement, errorElement, storyContainer } = this.getElements();
    if (loadingElement) loadingElement.style.display = 'block';
    if (errorElement) errorElement.style.display = 'none';
    if (storyContainer) storyContainer.style.display = 'none';
  }

  hideLoading() {
    const { loadingElement } = this.getElements();
    if (loadingElement) loadingElement.style.display = 'none';
  }

  showError(message) {
    const { errorElement, storyContainer, loadingElement } = this.getElements(); // Ensure loadingElement is accessed
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.style.display = 'block';
    }
    if (storyContainer) storyContainer.style.display = 'none';
    if (loadingElement) loadingElement.style.display = 'none'; // Ensure loading is hidden when error is shown
  }

  async displayStory(story, userName = '') {
    const {
      storyImage, storyTitle, storyDescription, storyDate,
      storyLocation, locationText, mapContainer, userInfo, storyContainer,
      loadingElement, errorElement
    } = this.getElements();

    // Penanganan jika data tidak valid/null
    if (!story || !story.name || !story.photoUrl) {
      this.showError('Story content could not be loaded. Please try again later.');
      return;
    }

    if (storyImage) {
      storyImage.src = story.photoUrl;
      storyImage.alt = `${story.name}'s story`;
    }
    if (storyTitle) storyTitle.textContent = story.name;
    if (storyDescription) storyDescription.textContent = story.description;

    const date = new Date(story.createdAt);
    if (storyDate) {
      storyDate.textContent = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }

    // Map: panggil presenter untuk handle map jika ada koordinat
    if (story.lat && story.lon) {
      if (storyLocation) storyLocation.style.display = 'flex';
      if (locationText) locationText.textContent = `Lat: ${story.lat.toFixed(4)}, Lon: ${story.lon.toFixed(4)}`;
      if (this.#presenter && this.#presenter.displayMapForStory) {
        await this.#presenter.displayMapForStory(story.lat, story.lon);
      }
    } else {
      if (storyLocation) storyLocation.style.display = 'none';
      if (mapContainer) mapContainer.style.display = 'none';
    }

    if (userName && userInfo) {
      userInfo.textContent = `Hello, ${userName}`;
    } else if (userInfo) {
      userInfo.textContent = '';
    }

    if (storyContainer) storyContainer.style.display = 'block';
    if (loadingElement) loadingElement.style.display = 'none';
    if (errorElement) errorElement.style.display = 'none';
  }
  // initializeMap dihapus, logika map dipindahkan ke model/presenter
  
  // --- Navigation Methods (DOM Interaction) ---
  goBack() {
    window.history.back();
  }

  redirectToLoginAfterDelay(delay) {
    setTimeout(() => {
      window.location.href = '#/login';
    }, delay);
  }

  // Tambahkan metode ini jika belum ada
  redirectToHomeAfterDelay(delay) {
    setTimeout(() => {
      window.location.hash = '#/'; // Atau window.location.href = '/' tergantung router Anda
    }, delay);
  }

  // --- Router Methods ---
  async render() {
    return this.getTemplate();
  }

  

  async afterRender() {
    // Inisialisasi Model dan utilitas di View
    const detailStoryModel = new DetailStoryModel();
    const authModel = AuthModel;
    const urlParser = () => getIdFromRoutes(window.location.href);
    console.log('DEBUG: Story ID =', urlParser());
    console.log('DEBUG (View): Full URL =', window.location.href);
    console.log('DEBUG (View): URL Hash =', window.location.hash);
    console.log('DEBUG (View): Story ID detected in View (before passing) =', urlParser());


    this.#presenter = new DetailStoryPagePresenter({
      view: this,
      detailStoryModel: detailStoryModel,
      authModel: authModel,
      urlParser: urlParser, // kirim fungsi, bukan hasilnya
    });
    // Tambahkan referensi presenter ke view agar bisa dipanggil di displayStory
    if (this.#presenter) this.#presenter.setViewInstance?.(this);
    await this.#presenter.initialize();
  }
}

export default DetailStoryPageView;