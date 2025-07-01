// src/model/detail-story-model.js

// Asumsi API_ENDPOINTS sudah didefinisikan di tempat lain, contoh:
// import API_ENDPOINTS from './api-endpoints.js';


class DetailStoryModel {
  constructor(baseUrl = 'https://story-api.dicoding.dev/v1') {
    this.baseUrl = baseUrl;
  }

  async getStoryDetail(token, storyId) {
    try {
      const response = await fetch(`${this.baseUrl}/stories/${storyId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (!response.ok) {
        console.warn('Network fetch for story detail failed, attempting to get from IndexedDB.');
        const cachedStory = await StoryDatabase.getStoryDetail(storyId);
        if (cachedStory) {
          return {
            success: true,
            data: cachedStory,
            error: null,
            source: 'indexeddb_fallback',
          };
        }
        throw new Error(data.message || 'Failed to fetch story detail from network or cache.');
      }
      if (data.story) {
        return {
          success: true,
          data: data.story,
          error: null,
          source: 'network',
        };
      } else {
        throw new Error('API response does not contain a "story" object.');
      }
    } catch (error) {
      console.error('Error fetching story detail:', error);
      console.warn('Network request for story detail failed, trying to retrieve from IndexedDB.');
      try {
        const cachedStory = await StoryDatabase.getStoryDetail(storyId);
        if (cachedStory) {
          return {
            success: true,
            data: cachedStory,
            error: null,
            source: 'indexeddb',
          };
        } else {
          return {
            success: false,
            data: null,
            error: error.message || 'An error occurred and no cached detail data available.',
            source: 'no_detail_data_available',
          };
        }
      } catch (dbError) {
        console.error('Error retrieving from IndexedDB:', dbError);
        return {
          success: false,
          data: null,
          error: `Network error and IndexedDB retrieval failed: ${error.message || dbError.message}`,
          source: 'fetch_and_indexeddb_detail_failed',
        };
      }
    }
  }

  // Tambahkan method untuk handle map API
  async displayMap(mapContainer, lat, lon) {
    if (!mapContainer || !window.L) {
      console.warn('Leaflet or container missing.');
      return;
    }
    // Bersihkan map lama jika ada
    mapContainer.innerHTML = '';
    mapContainer.style.display = 'block';
    mapContainer.innerHTML = `<div id="map" style="height: 400px; width: 100%; position: relative;"></div>`;
    const userLocation = [lat, lon];
    const map = window.L.map('map', {
      center: userLocation,
      zoom: 15,
      zoomControl: false,
    });
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      minZoom: 5,
      maxZoom: 18,
    }).addTo(map);
    const marker = window.L.marker(map.getCenter()).addTo(map);
    marker.bindPopup(`Location of the story:<br>Lat: ${lat.toFixed(4)}<br>Lon: ${lon.toFixed(4)}`).openPopup();
    setTimeout(() => {
      map.invalidateSize();
      map.setView(userLocation);
    }, 200);
    const popup = window.L.popup();
    map.on('click', (e) => {
      popup
        .setLatLng(e.latlng)
        .setContent(`You clicked at Lat: ${e.latlng.lat.toFixed(4)}, Lon: ${e.latlng.lng.toFixed(4)}`)
        .openOn(map);
    });
    // Simpan instance map jika perlu untuk dihancurkan nanti
    // this._mapInstance = map;
  }
}

export default DetailStoryModel;