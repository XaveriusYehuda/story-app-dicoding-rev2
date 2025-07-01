const API_BASE_URL = 'https://story-api.dicoding.dev/v1'; // [cite: 6]

const API_ENDPOINTS = {
  REGISTER: `${API_BASE_URL}/register`, // [cite: 6]
  LOGIN: `${API_BASE_URL}/login`, // [cite: 6]
  ADD_STORY: `${API_BASE_URL}/stories`, // [cite: 6]
  ADD_STORY_GUEST: `${API_BASE_URL}/stories/guest`, // [cite: 6]
  GET_ALL_STORIES: `${API_BASE_URL}/stories`, // [cite: 6]
  GET_DETAIL_STORY: (id) => `${API_BASE_URL}/stories/${id}`, // [cite: 6]
  SUBSCRIBE_NOTIFICATION: `${API_BASE_URL}/notifications/subscribe`, // [cite: 6]
  UNSUBSCRIBE_NOTIFICATION: `${API_BASE_URL}/notifications/subscribe`, // [cite: 6]
};

export default API_ENDPOINTS;