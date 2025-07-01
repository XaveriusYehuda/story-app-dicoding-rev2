// src/views/add-story-view.js
import '../../../styles/add-story.css';
import AddStoryPagePresenter from '../../controllers/presenters/add-story-presenters';
import AddStoryModel from '../../model/utils/add-story-model'; // Import AddStoryModel (class)
import AuthModel from '../../model/utils/login-model'; // Import AuthModel (class/utility)

class AddStoryPageView {
  #presenter;
  _mapInstance = null;
  _markerInstance = null;

  getTemplate() {
    return `
      <header>
        <div class="header-content">
          <a href="#/" class="back-button">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Back to Stories
          </a>
          <div id="userInfo"></div>
        </div>
      </header>

      <main id="addStoryMain" class="story-container">
        <h1>Share Your Story</h1>
        <form id="storyForm" enctype="multipart/form-data">
          <section class="form-group">
            <label for="description">Story Description</label>
            <textarea id="description" name="description" rows="4" required></textarea>
          </section>

          <section class="form-group">
            <label>Take a Photo or Upload</label>
            <div class="camera-section">
              <video id="cameraPreview" autoplay playsinline style="display: none; width: 100%; max-height: 250px;"></video>
              <button type="button" id="startCameraBtn" class="captureBtn">Start Camera</button>
              <button type="button" id="captureBtn" class="captureBtn" disabled>Capture</button>
              <button type="button" id="closeBtn" class="captureBtn" style="display: none;">Close Camera</button>
              <canvas id="snapshotCanvas" style="display: none;"></canvas>
            </div>

            <div id="fileUploadSection" class="form-group">
              <label for="photo">Or Upload Photo (Max 1MB)</label>
              <input type="file" id="photo" name="photo" accept="image/*">
              <div class="file-hint">Accepted formats: JPEG, PNG, GIF</div>
              <img id="photo-preview" style="max-width: 100%; margin-top: 10px; display: none;" />
            </div>
          </section>

          <section class="location-group">
            <h2>Location (Optional)</h2>
            <div class="form-row">
              <div class="form-group half-width">
                <label for="lat">Latitude</label>
                <input type="number" id="lat" name="lat" step="any" placeholder="e.g., -6.2088">
              </div>
              <div class="form-group half-width">
                <label for="lon">Longitude</label>
                <input type="number" id="lon" name="lon" step="any" placeholder="e.g., 106.8456">
              </div>
            </div>
            <div class="map-container" style="margin-top: 10px; margin-bottom: 10px; margin-right: 10px; margin-left: 10px;">
              <div id="map-picker"></div>
            </div>
          </section>

          <button type="submit" id="submitBtn">Submit Story</button>
        </form>

        <section id="message" class="message"></section>
      </main>

      <footer style="text-align: center; padding: 1.5rem 0; background: #f5f5f5; color: #333; font-size: 1rem;">
        <p>&copy; 2025 Dicoding Story App. All rights reserved.</p>
      </footer>
    `;
  }

  getElements() {
    return {
      storyForm: document.getElementById('storyForm'),
      descriptionInput: document.getElementById('description'),
      photoInput: document.getElementById('photo'),
      latInput: document.getElementById('lat'),
      lonInput: document.getElementById('lon'),
      messageDiv: document.getElementById('message'),
      submitBtn: document.getElementById('submitBtn'),
      mapPicker: document.getElementById('map-picker'),
      cameraPreview: document.getElementById('cameraPreview'),
      startCameraBtn: document.getElementById('startCameraBtn'),
      captureBtn: document.getElementById('captureBtn'),
      closeBtn: document.getElementById('closeBtn'),
      snapshotCanvas: document.getElementById('snapshotCanvas'),
      photoPreview: document.getElementById('photo-preview'),
      fileUploadSection: document.getElementById('fileUploadSection'),
    };
  }

  // --- DOM Interaction Methods ---

  bindFormSubmit(handler) {
    const { storyForm } = this.getElements();
    if (storyForm) {
      storyForm.addEventListener('submit', handler);
    }
  }

  bindStartCameraButton(handler) {
    const { startCameraBtn } = this.getElements();
    if (startCameraBtn) {
      startCameraBtn.addEventListener('click', handler);
    }
  }

  bindCaptureButton(handler) {
    const { captureBtn } = this.getElements();
    if (captureBtn) {
      captureBtn.addEventListener('click', handler);
    }
  }

  bindCloseCameraButton(handler) {
    const { closeBtn } = this.getElements();
    if (closeBtn) {
      closeBtn.addEventListener('click', handler);
    }
  }

  bindPhotoInputChange(handler) {
    const { photoInput } = this.getElements();
    if (photoInput) {
      photoInput.addEventListener('change', handler);
    }
  }

  bindLocationInputChanges(handler) {
    const { latInput, lonInput } = this.getElements();
    if (latInput) latInput.addEventListener('change', handler);
    if (lonInput) lonInput.addEventListener('change', handler);
  }

  bindHashChange(handler) {
    window.addEventListener('hashchange', handler);
  }

  bindPopState(handler) {
    window.addEventListener('popstate', handler);
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

  disableSubmitButton(disable) {
    const { submitBtn } = this.getElements();
    if (submitBtn) {
      submitBtn.disabled = disable;
      submitBtn.textContent = disable ? 'Submitting...' : 'Submit Story';
    }
  }

  hideForm() {
    const { storyForm } = this.getElements();
    if (storyForm) {
      storyForm.style.display = 'none';
    }
  }

  // --- Camera/Media Methods (DOM/Web API Interaction) ---

  async getCameraStream() {
    const { cameraPreview, startCameraBtn, captureBtn, closeBtn, fileUploadSection } = this.getElements();
    try {
      // Prioritaskan kamera belakang, jika gagal coba kamera apapun
      const constraints = {
        video: {
          facingMode: 'environment', // Coba kamera belakang dulu
        },
      };
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (e) {
        console.warn('Failed to get environment camera, trying any available video source.', e);
        constraints.video = true; // Coba kamera apapun jika environment gagal
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      }

      cameraPreview.srcObject = stream;
      cameraPreview.style.display = 'block';
      startCameraBtn.style.display = 'none';
      captureBtn.style.display = 'inline-block';
      captureBtn.disabled = false;
      closeBtn.style.display = 'inline-block';
      fileUploadSection.style.display = 'none';
      this.clearPhotoPreview();
      return stream;
    } catch (err) {
      console.error('Error accessing camera:', err);
      // Ensure buttons are reset if camera access fails
      startCameraBtn.style.display = 'inline-block';
      captureBtn.style.display = 'none';
      closeBtn.style.display = 'none';
      fileUploadSection.style.display = 'block'; // Pastikan section upload file kembali terlihat
      throw new Error('Failed to get camera stream: ' + err.message + '. Please ensure your browser has camera access permissions and you are using HTTPS (or localhost).');
    }
  }

  showCameraPreview(stream) {
    const { cameraPreview, captureBtn, closeBtn, startCameraBtn, fileUploadSection } = this.getElements();
    if (cameraPreview && captureBtn && closeBtn && startCameraBtn && fileUploadSection) {
      cameraPreview.srcObject = stream;
      cameraPreview.style.display = 'block';
      captureBtn.disabled = false;
      captureBtn.style.display = 'inline-block';
      startCameraBtn.style.display = 'none';
      closeBtn.style.display = 'inline-block';
      fileUploadSection.style.display = 'none';
    }
  }

  hideCameraPreview() {
    const { cameraPreview, captureBtn, startCameraBtn, closeBtn, fileUploadSection } = this.getElements();
    if (cameraPreview && captureBtn && startCameraBtn && closeBtn && fileUploadSection) {
      cameraPreview.srcObject = null;
      cameraPreview.style.display = 'none';
      captureBtn.disabled = true;
      captureBtn.style.display = 'none';
      startCameraBtn.style.display = 'inline-block';
      closeBtn.style.display = 'none';
      fileUploadSection.style.display = 'block'; // Tampilkan kembali bagian upload file
    }
  }

  stopCameraStream(stream) {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
  }

  async capturePhoto(stream) { // Menjadikan async
    const { snapshotCanvas, cameraPreview, photoInput } = this.getElements();
    if (!stream || !cameraPreview || !snapshotCanvas || !photoInput) return null;

    const context = snapshotCanvas.getContext('2d');
    snapshotCanvas.width = cameraPreview.videoWidth;
    snapshotCanvas.height = cameraPreview.videoHeight;
    context.drawImage(cameraPreview, 0, 0, snapshotCanvas.width, snapshotCanvas.height);

    return new Promise((resolve) => {
      snapshotCanvas.toBlob((blob) => {
        if (blob) {
          const photoFile = new File([blob], `captured_photo_${Date.now()}.jpeg`, { type: 'image/jpeg' });
          const dataTransfer = new DataTransfer();
          dataTransfer.items.add(photoFile);
          photoInput.files = dataTransfer.files;
          resolve(photoFile);
        } else {
          resolve(null);
        }
      }, 'image/jpeg', 0.95);
    });
  }

  clearPhotoPreview() {
    const { photoPreview, photoInput } = this.getElements();
    if (photoPreview) {
      photoPreview.src = '';
      photoPreview.style.display = 'none';
    }
    if (photoInput) {
      photoInput.value = ''; // Reset input file
    }
  }

  displayPhotoPreview(url) {
    const { photoPreview } = this.getElements();
    if (photoPreview) {
      photoPreview.src = url;
      photoPreview.style.display = 'block';
    }
  }

  resetForm() {
    const { storyForm } = this.getElements();
    if (storyForm) {
      storyForm.reset();
    }
    this.clearPhotoPreview(); // Pastikan preview dibersihkan
    this.hideCameraPreview(); // Pastikan kamera ditutup dan elemen disembunyikan
  }

  // --- Map related methods (DOM/Web API Interaction) ---

  renderMap(lat, lon, onMapClickCallback, onLatLonInputChangeCallback) {
    const { mapPicker } = this.getElements();
    if (!window.L || !mapPicker) return;

    if (this._mapInstance) {
      this._mapInstance.remove();
      this._mapInstance = null;
    }
    mapPicker.innerHTML = '';

    mapPicker.style.width = '100%';
    mapPicker.style.height = '400px';
    mapPicker.style.position = 'relative';

    this._mapInstance = window.L.map(mapPicker, {
      zoom: 12,
      center: [lat, lon],
    });

    AddStoryModel.addDefaultTileLayer(window.L, this._mapInstance);

    this._markerInstance = window.L.marker([lat, lon]).addTo(this._mapInstance);
    this._markerInstance.bindPopup(`Lat: ${lat.toFixed(5)}, Lon: ${lon.toFixed(5)}`).openPopup();

    this._mapInstance.on('click', (e) => {
      const { lat: clickedLat, lng: clickedLng } = e.latlng;
      if (typeof onMapClickCallback === 'function') {
        onMapClickCallback(clickedLat, clickedLng);
      }
    });

    onLatLonInputChangeCallback();
  }

  updateMapMarker(lat, lon) {
    if (this._markerInstance && this._mapInstance) {
      const latlng = [lat, lon];
      this._markerInstance.setLatLng(latlng);
      this._markerInstance.bindPopup(`Lat: ${lat.toFixed(5)}, Lon: ${lon.toFixed(5)}`).openPopup();
    }
  }

  setMapView(lat, lon) {
    if (this._mapInstance) {
      this._mapInstance.setView([lat, lon], this._mapInstance.getZoom());
    }
  }

  setLatLonInput(lat, lon) {
    const { latInput, lonInput } = this.getElements();
    if (latInput) latInput.value = lat.toFixed(5);
    if (lonInput) lonInput.value = lon.toFixed(5);
  }

  // --- Navigation Methods (DOM Interaction) ---
  redirectToLoginAfterDelay(delay) {
    setTimeout(() => {
      window.location.href = '#/login';
    }, delay);
  }

  redirectToHome() {
    window.location.href = '#/';
  }

  // --- Router Methods ---
  async render() {
    return this.getTemplate();
  }

  async afterRender() {
    const addStoryModel = new AddStoryModel();
    const authModel = AuthModel;

    this.#presenter = new AddStoryPagePresenter({
      view: this,
      addStoryModel: addStoryModel,
      authModel: authModel,
    });
    await this.#presenter.initialize();
  }
}

export default AddStoryPageView;