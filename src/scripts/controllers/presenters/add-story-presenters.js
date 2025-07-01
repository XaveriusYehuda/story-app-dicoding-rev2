// src/controllers/presenters/add-story-presenters.js

class AddStoryPagePresenter {
  #view;
  #addStoryModel; // Instance dari AddStoryModel
  #authModel;     // Instance dari AuthModel

  // Variabel untuk menyimpan referensi stream kamera (penting untuk kontrol Presenter)
  _cameraStream = null;

  constructor({ view, addStoryModel, authModel }) {
    if (!view || !addStoryModel || !authModel) {
      throw new Error('View, AddStoryModel, and AuthModel must be provided.');
    }
    this.#view = view;
    this.#addStoryModel = addStoryModel;
    this.#authModel = authModel;
  }

  async initialize() {
    const token = this.#authModel.getToken();
    if (!token) {
      this.#view.displayMessage('You need to login first to share a story', 'error');
      this.#view.hideForm();
      this.#view.redirectToLoginAfterDelay(2000);
      return;
    }

    // Minta Model untuk mendapatkan lokasi awal peta
    const initialLocation = await this.#addStoryModel.getInitialMapLocation();
    // Instruksikan View untuk merender peta dengan lokasi awal dan bind handler Presenter
    this.#view.renderMap(
      initialLocation.lat,
      initialLocation.lon,
      this._handleMapClick.bind(this), // Callback untuk klik peta di View
      this._handleLatLonInputUpdateFromView.bind(this) // Callback untuk perubahan input di View
    );
    // Perbarui nilai input lat/lon di View untuk mencerminkan lokasi awal
    this.#view.setLatLonInput(initialLocation.lat, initialLocation.lon);

    this.#view.bindFormSubmit(this._handleSubmitStory.bind(this));
    this.#view.bindStartCameraButton(this._handleStartCamera.bind(this));
    this.#view.bindCaptureButton(this._handleCapturePhoto.bind(this));
    this.#view.bindCloseCameraButton(this._handleCloseCamera.bind(this));
    this.#view.bindPhotoInputChange(this._handlePhotoInputChange.bind(this));
    this.#view.bindLocationInputChanges(this._handleLatLonInputUpdateFromView.bind(this));

    // Tambahkan event listener untuk mematikan kamera saat user pindah halaman
    this.#view.bindHashChange(this._handleCloseCamera.bind(this));
    this.#view.bindPopState(this._handleCloseCamera.bind(this));
  }

  _handleMapClick(lat, lng) {
    this.#view.updateMapMarker(lat, lng);
    this.#view.setLatLonInput(lat, lng);
    this.#view.setMapView(lat, lng); // Set view juga saat klik peta
  }

  _handleLatLonInputUpdateFromView() {
    const { latInput, lonInput } = this.#view.getElements();
    const lat = parseFloat(latInput.value);
    const lon = parseFloat(lonInput.value);
    if (isNaN(lat) || isNaN(lon)) return;
    this.#view.updateMapMarker(lat, lon);
    this.#view.setMapView(lat, lon);
  }

  async _handleStartCamera() {
    try {
      this._cameraStream = await this.#view.getCameraStream();
      this.#view.showCameraPreview(this._cameraStream);
    } catch (err) {
      this.#view.displayMessage('Unable to access camera: ' + err.message, 'error');
      console.error('Failed to start camera:', err);
    }
  }

  async _handleCapturePhoto() { // Menjadi async
    if (!this._cameraStream) {
      this.#view.displayMessage('No active camera stream.', 'error');
      return;
    }

    const photoFile = await this.#view.capturePhoto(this._cameraStream); // Await hasilnya
    if (photoFile) {
      this.#view.displayPhotoPreview(URL.createObjectURL(photoFile));
      this.#view.stopCameraStream(this._cameraStream);
      this._cameraStream = null;
      this.#view.hideCameraPreview();
    } else {
      this.#view.displayMessage('Failed to capture photo.', 'error');
    }
  }

  _handleCloseCamera() {
    if (this._cameraStream) {
      this.#view.stopCameraStream(this._cameraStream);
      this._cameraStream = null;
    }
    this.#view.hideCameraPreview();
    this.#view.clearPhotoPreview();
  }

  _handlePhotoInputChange(event) {
    const file = event.target.files[0];
    if (file) {
      // Akses static method melalui constructor dari instance model yang di-inject
      if (this.#addStoryModel.constructor.isValidImage(file)) {
        this.#view.displayPhotoPreview(URL.createObjectURL(file));
      } else {
        this.#view.displayMessage('Please upload a valid image (JPEG/PNG/GIF, max 1MB)', 'error');
        this.#view.clearPhotoPreview();
        event.target.value = '';
      }
    } else {
      this.#view.clearPhotoPreview();
    }
  }

  async _handleSubmitStory(e) {
    e.preventDefault();
    this.#view.hideMessage();
    this.#view.disableSubmitButton(true);

    const { descriptionInput, photoInput, latInput, lonInput } = this.#view.getElements();

    const photoFile = photoInput.files[0];

    if (!this.#addStoryModel.constructor.isValidImage(photoFile)) {
      this.#view.displayMessage('Please upload a valid image (JPEG/PNG/GIF, max 1MB)', 'error');
      this.#view.disableSubmitButton(false);
      return;
    }

    const formData = new FormData();
    formData.append('description', descriptionInput.value);
    formData.append('photo', photoFile);

    if (latInput.value && lonInput.value) {
      formData.append('lat', parseFloat(latInput.value));
      formData.append('lon', parseFloat(lonInput.value));
    }

    const token = this.#authModel.getToken();
    if (!token) {
      this.#view.displayMessage('Authentication token is missing. Please log in.', 'error');
      this.#view.redirectToLoginAfterDelay(2000);
      return;
    }

    try {
      const result = await this.#addStoryModel.submitStory(formData, token);

      if (result.success) {
        this.#view.displayMessage('Story submitted successfully!', 'success');
        this.#view.resetForm();
        this.#view.redirectToHome();
      } else {
        this.#view.displayMessage(result.error || 'Failed to submit story', 'error');
      }
    } catch (err) {
      this.#view.displayMessage('An error occurred. Please try again.', 'error');
      console.error(err);
    } finally {
      this.#view.disableSubmitButton(false);
    }
  }
}

export default AddStoryPagePresenter;