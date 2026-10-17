/**
 * Situations Module - Names of Allah PWA
 * "Find Your Situation": category -> situation -> relevant Names
 * Data is built from ../situations/*.csv by scripts/build_situations.py
 */

const escapeHtml = (text) => String(text ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

export class SituationsView {
  constructor(dataManager, uiRenderer, container) {
    this.dataManager = dataManager;
    this.uiRenderer = uiRenderer;
    this.container = container;
    this.categories = [];
    this.situations = [];
    this.loaded = false;
  }

  async load() {
    if (this.loaded) return;
    const response = await fetch('./data/situations.json');
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    this.categories = data.categories;
    this.situations = data.situations;
    this.loaded = true;
  }

  async render() {
    try {
      await this.load();
      this.renderCategories();
    } catch (error) {
      console.error('❌ Failed to load situations:', error);
      this.container.innerHTML = '<p class="text-muted">Failed to load situations. Please refresh the page.</p>';
    }
  }

  draftBanner() {
    return `
      <div class="situations-draft-banner" role="note">
        <strong>Demo — draft content.</strong>
        Nothing here is reviewed by scholars yet. The links come from the app's "when to invoke" notes.
      </div>
    `;
  }

  renderCategories() {
    const cards = this.categories.map(cat => {
      const count = this.situations.filter(s => s.category_id === cat.id).length;
      return `
        <button class="situation-category" data-category="${cat.id}">
          <span class="situation-category-title">${escapeHtml(cat.title)}</span>
          <span class="situation-category-covers">${escapeHtml(cat.covers)}</span>
          <span class="situation-category-meta">
            ${count} ${count === 1 ? 'situation' : 'situations'}
            ${cat.on_hold ? '<span class="situation-hold">On hold</span>' : ''}
          </span>
        </button>
      `;
    }).join('');

    this.container.innerHTML = `
      <div class="situations-header">
        <h2>Find Your Situation</h2>
        <p class="text-secondary">What are you going through? Pick the closest category.</p>
      </div>
      ${this.draftBanner()}
      <div class="situation-category-grid">${cards}</div>
    `;

    this.container.querySelectorAll('.situation-category').forEach(btn => {
      btn.addEventListener('click', () => this.renderCategory(btn.dataset.category));
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  renderCategory(categoryId) {
    const cat = this.categories.find(c => c.id === categoryId);
    const items = this.situations.filter(s => s.category_id === categoryId);

    const list = items.length
      ? items.map(s => `
          <li>
            <button class="situation-item" data-situation="${s.id}">
              <span>${escapeHtml(s.title)}</span>
              <span class="situation-item-count">${s.names.length} Names</span>
            </button>
          </li>
        `).join('')
      : '<li class="text-muted">No situations in this category yet.</li>';

    this.container.innerHTML = `
      <button class="btn-text situations-back" data-back="categories">← All categories</button>
      <div class="situations-header">
        <h2>${escapeHtml(cat.title)}</h2>
        <p class="text-secondary">${escapeHtml(cat.covers)}</p>
      </div>
      ${cat.on_hold ? '<div class="situations-draft-banner" role="note"><strong>On hold.</strong> Current-events content needs its own review process before it is published.</div>' : ''}
      <ul class="situation-list">${list}</ul>
    `;

    this.container.querySelector('.situations-back')
      .addEventListener('click', () => this.renderCategories());
    this.container.querySelectorAll('.situation-item').forEach(btn => {
      btn.addEventListener('click', () => this.renderSituation(btn.dataset.situation));
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  renderSituation(situationId) {
    const situation = this.situations.find(s => s.id === situationId);
    const cat = this.categories.find(c => c.id === situation.category_id);

    const videos = this.dataManager.getVideosForSituation(situation.id);

    const cards = situation.names.map(link => {
      const name = this.dataManager.getNameByIndex(link.index);
      if (!name) return '';
      const point = link.the_point
        ? `<p class="situation-point">${escapeHtml(link.the_point)}</p>
           ${link.source ? `<p class="situation-source">Source: ${escapeHtml(link.source)}</p>` : ''}`
        : `<p class="situation-point situation-point-empty">Scholar explanation not added yet.</p>`;
      return `
        <article class="situation-name" data-index="${name.index}">
          <div class="situation-name-head">
            <span class="situation-name-arabic" lang="ar" dir="rtl">${name.arabic}</span>
            <div>
              <h3 class="situation-name-translit">${escapeHtml(name.transliteration)}</h3>
              <p class="situation-name-meaning">${escapeHtml(name.english_meaning)}</p>
            </div>
          </div>
          ${point}
          <p class="situation-basis">
            <span class="situation-link-type ${link.link_type}" title="${link.link_type === 'specific' ? 'The app note for this Name names this situation.' : 'The app note is a general sentence shared by several Names.'}">${link.link_type === 'specific' ? 'Specific link' : 'Weak link'}</span>
            App note: "${escapeHtml(link.dataset_basis)}"
          </p>
          <button class="card-action" aria-label="Explore ${escapeHtml(name.transliteration)}">
            <span>Explore this Name</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>
        </article>
      `;
    }).join('');

    this.container.innerHTML = `
      <button class="btn-text situations-back">← ${escapeHtml(cat.title)}</button>
      <div class="situations-header">
        <p class="situation-eyebrow">${escapeHtml(cat.title)}</p>
        <h2>${escapeHtml(situation.title)}</h2>
        <p class="text-secondary">Names linked to this situation. These are draft links.</p>
      </div>
      ${this.draftBanner()}
      <div class="situation-names">${cards}</div>
      ${videos.length ? `
        <section class="situation-videos">
          <h3 class="situation-videos-title">📿 How to Use This in Your Situation</h3>
          <p class="text-secondary">Morning and evening dhikr lessons. Matched to this situation by their titles.</p>
          ${this.uiRenderer.renderVideoList(videos)}
        </section>
      ` : ''}
    `;
    this.uiRenderer.bindVideoRows(this.container);

    this.container.querySelector('.situations-back')
      .addEventListener('click', () => this.renderCategory(cat.id));
    this.container.querySelectorAll('.situation-name').forEach(card => {
      card.addEventListener('click', () => this.uiRenderer.showNameDetail(card.dataset.index));
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
