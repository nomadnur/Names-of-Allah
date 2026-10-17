/**
 * Video Gallery Module - Names of Allah PWA
 * Every video, grouped by Name, plus the dhikr videos that only link to situations
 */

export class VideoGallery {
  constructor(dataManager, uiRenderer, container) {
    this.dataManager = dataManager;
    this.uiRenderer = uiRenderer;
    this.container = container;
    this.query = '';
  }

  render() {
    const videos = this.dataManager.videos;
    const names = this.dataManager.getAllNames()
      .filter(name => this.dataManager.getVideosForName(name.index).length);
    const situationOnly = videos.filter(video => !video.names.length);

    this.container.innerHTML = `
      <div class="browse-header">
        <h2>Videos</h2>
        <p class="text-secondary">${videos.length} videos from ${new Set(videos.map(video => video.series)).size} series. ${names.length} Names have at least one.</p>
        <div class="search-wrapper">
          <label for="gallerySearch" class="sr-only">Find a Name</label>
          <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input id="gallerySearch" type="search" placeholder="Find a Name…" autocomplete="off" spellcheck="false" value="${this.query}">
        </div>
      </div>
      <div id="galleryGroups"></div>
    `;

    const groupsEl = this.container.querySelector('#galleryGroups');
    const draw = () => {
      const q = this.query.toLowerCase();
      const shown = names.filter(name => !q ||
        name.transliteration.toLowerCase().includes(q) ||
        name.english_meaning.toLowerCase().includes(q) ||
        name.arabic.includes(this.query));

      groupsEl.innerHTML = `
        ${shown.map(name => this.renderGroup(name)).join('')}
        ${!q && situationOnly.length ? `
          <section class="gallery-group">
            <h3 class="gallery-group-title gallery-group-title-plain">📿 Dhikr for Situations</h3>
            <p class="gallery-group-intro">Morning and evening dhikr lessons linked to a situation, not to one Name.</p>
            ${this.uiRenderer.renderVideoList(situationOnly)}
          </section>
        ` : ''}
        ${shown.length ? '' : '<p class="text-muted">No Name with a video matches your search.</p>'}
      `;
      this.uiRenderer.bindVideoRows(groupsEl);
      groupsEl.querySelectorAll('.gallery-group-title[data-index]').forEach(btn => {
        btn.addEventListener('click', () => this.uiRenderer.showNameDetail(btn.dataset.index));
      });
    };

    const input = this.container.querySelector('#gallerySearch');
    let timer;
    input.addEventListener('input', () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        this.query = input.value.trim();
        draw();
      }, 200);
    });
    draw();
  }

  renderGroup(name) {
    const videos = this.dataManager.getVideosForName(name.index);
    const explanations = videos.filter(video => video.kind === 'explanation');
    const dhikr = videos.filter(video => video.kind === 'dhikr');
    return `
      <section class="gallery-group">
        <button class="gallery-group-title" data-index="${name.index}" aria-label="Open ${name.transliteration}">
          <span class="gallery-group-arabic" lang="ar" dir="rtl">${name.arabic}</span>
          <span class="gallery-group-text">
            <span class="gallery-group-name">${name.transliteration}</span>
            <span class="gallery-group-meaning">${name.english_meaning}</span>
          </span>
          <span class="gallery-group-count">${videos.length} ${videos.length === 1 ? 'video' : 'videos'}</span>
        </button>
        ${this.uiRenderer.renderVideoList(explanations, name.index, { sortByLength: true })}
        ${dhikr.length ? `<p class="gallery-subhead">📿 In dhikr</p>` : ''}
        ${this.uiRenderer.renderVideoList(dhikr, name.index)}
      </section>
    `;
  }
}
