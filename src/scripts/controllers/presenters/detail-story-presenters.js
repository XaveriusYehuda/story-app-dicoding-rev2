// src/controllers/presenters/detail-story-presenters.js

class DetailStoryPagePresenter {
  #view;
  #detailStoryModel;
  #authModel;
  #urlParser;
  #viewInstance; // Untuk akses view jika perlu

  constructor({ view, detailStoryModel, authModel, urlParser }) {
    if (!view || !detailStoryModel || !authModel || !urlParser) {
      throw new Error('View, DetailStoryModel, AuthModel, and urlParser must be provided.');
    }
    this.#view = view;
    this.#detailStoryModel = detailStoryModel;
    this.#authModel = authModel;
    this.#urlParser = urlParser;
  }

  setViewInstance(viewInstance) {
    this.#viewInstance = viewInstance;
  }

  async initialize() {
    this.#view.bindBackButton(this._handleBackButtonClick.bind(this));
    await this._loadStoryDetail();
  }

  _handleBackButtonClick(e) {
    e.preventDefault();
    this.#view.goBack();
  }

  async _loadStoryDetail() {
    // Perbaikan: pastikan id bisa diakses baik dari urlParser maupun dari hash
    let storyId = '';
    try {
      storyId = this.#urlParser?.() || '';
      console.log('DEBUG (Presenter): Story ID obtained from urlParser =', storyId);
      if (!storyId) {
        console.log('DEBUG (Presenter): Story ID is empty after urlParser execution.');
      }
    } catch (e) {
      console.error('DEBUG (Presenter): Error calling urlParser:', e);
      storyId = '';
    }
    console.log('DEBUG: Story ID obtained =', storyId);

    this.#view.showLoading();

    if (!storyId) {
      this.#view.hideLoading();
      this.#view.showError('Story ID is missing in the URL. Cannot load details.');
      if (this.#view.redirectToHomeAfterDelay) {
        this.#view.redirectToHomeAfterDelay(2000);
      }
      return;
    }

    const token = this.#authModel.getToken();
    if (!token) {
      this.#view.hideLoading();
      this.#view.showError('Please login first to view story details.');
      this.#view.redirectToLoginAfterDelay(2000);
      return;
    }

    try {
      const result = await this.#detailStoryModel.getStoryDetail(token, storyId);
      this.#view.hideLoading();
      if (result.success) {
        setTimeout(() => {
          this.#view.displayStory(result.data, this.#authModel.getUserName());
        }, 500);
      } else {
        this.#view.showError(result.error || 'Failed to load story details. Story might not exist.');
      }
    } catch (error) {
      console.error('Error fetching story detail:', error);
      this.#view.hideLoading();
      this.#view.showError('An unexpected error occurred while fetching story details.');
    }
  }

  // Pindahkan logika map ke presenter, dan delegasikan ke model
  async displayMapForStory(lat, lon) {
    if (!this.#detailStoryModel || !this.#viewInstance) return;
    const { mapContainer } = this.#viewInstance.getElements();
    if (!mapContainer) return;
    // Panggil model untuk inisialisasi map
    await this.#detailStoryModel.displayMap(mapContainer, lat, lon);
  }
}

export default DetailStoryPagePresenter;