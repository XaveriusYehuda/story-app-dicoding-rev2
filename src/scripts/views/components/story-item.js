
const createStoryItemTemplate = (story, isBookmarked = false) => `
  <article class="story-item">
    <img src="${story.photoUrl}" alt="${story.description}" class="story-item__thumbnail" loading="lazy">
    <div class="story-item__content">
      <h3 class="story-item__name">${story.name}</h3>
      <p class="story-item__description">${story.description}</p>
      <p class="story-item__date">${new Date(story.createdAt).toLocaleDateString()}</p>
      ${story.lat && story.lon ? `
        <button class="story-item__view-on-map" data-lat="${story.lat}" data-lon="${story.lon}" onclick="window.location.hash = '#/detail/${story.id}'">Lihat di Peta</button>
      ` : ''}
      <button class="bookmarkBtn" data-id="${story.id}">
        ${isBookmarked ? 'Hapus Bookmark' : 'Simpan Cerita'}
      </button>
    </div>
  </article>
`;

export { createStoryItemTemplate };