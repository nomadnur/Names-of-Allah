export class ProgressDashboard {
  constructor(progressTracker, dataManager, uiRenderer) {
    this.progressTracker = progressTracker;
    this.dataManager = dataManager;
    this.uiRenderer = uiRenderer;
  }

  render() {
    const stats = this.progressTracker.getStats();
    const allNames = this.dataManager.getAllNames();
    const dueNames = this.#getDueNames();

    this.#renderStats(stats);
    this.#renderProgressBar(stats);
    this.#renderDotGrid(allNames);
    this.#renderReviewQueue(dueNames);
  }

  #renderStats(stats) {
    const statMastered = document.getElementById('statMastered');
    const statLearning = document.getElementById('statLearning');
    const statNew = document.getElementById('statNew');
    const statStreak = document.getElementById('statStreak');
    const statCompletion = document.getElementById('statCompletion');
    const streakCard = document.querySelector('.stat-streak');

    if (!statMastered || !statLearning || !statNew || !statStreak || !statCompletion) {
      return;
    }

    statMastered.textContent = stats.totalMastered;
    statLearning.textContent = stats.totalLearned;
    statNew.textContent = stats.notStarted;
    statStreak.textContent = stats.currentStreak;
    statCompletion.textContent = `${stats.completionPercentage}%`;

    if (streakCard) {
      if (stats.currentStreak > 0) {
        streakCard.classList.add('has-streak');
      } else {
        streakCard.classList.remove('has-streak');
      }
    }
  }

  #renderProgressBar(stats) {
    const journeySubtext = document.getElementById('journeySubtext');
    const progressTrack = document.getElementById('progressTrack');
    const progressFillBar = document.getElementById('progressFillBar');
    const progressPercentageLabel = document.getElementById('progressPercentageLabel');

    if (!journeySubtext || !progressTrack || !progressFillBar || !progressPercentageLabel) {
      return;
    }

    journeySubtext.textContent = `${stats.totalMastered} of 99 names mastered`;
    progressPercentageLabel.textContent = `${stats.completionPercentage}% of 99 names mastered`;
    progressTrack.setAttribute('aria-valuenow', String(stats.completionPercentage));
    // Reset width without transition, force reflow, then let CSS transition play
    progressFillBar.style.transition = 'none';
    progressFillBar.style.width = '0%';
    progressFillBar.getBoundingClientRect(); // force synchronous reflow
    progressFillBar.style.transition = '';
    progressFillBar.style.width = `${stats.completionPercentage}%`;
  }

  #renderDotGrid(allNames) {
    const dotGrid = document.getElementById('dotGrid');
    if (!dotGrid) return;

    dotGrid.innerHTML = '';
    dotGrid.setAttribute('role', 'list');
    dotGrid.setAttribute('aria-label', '99 Names progress grid');

    for (let index = 1; index <= 99; index++) {
      const status = this.#getDotStatus(index);
      const name = allNames.find((item) => item.index === index);

      const li = document.createElement('li');
      li.style.listStyle = 'none';
      li.style.padding = '0';
      li.style.margin = '0';
      li.style.display = 'contents';

      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = `name-dot dot-${status}`;
      dot.dataset.index = String(index);
      dot.setAttribute(
        'aria-label',
        name ? `${name.transliteration} - ${status}` : `Name ${index} - ${status}`
      );
      dot.title = name
        ? `${name.transliteration} (${name.english_meaning})`
        : `Name ${index}`;

      dot.addEventListener('click', () => {
        this.uiRenderer.showNameDetail(index);
      });

      li.appendChild(dot);
      dotGrid.appendChild(li);
    }
  }

  #renderReviewQueue(dueNames) {
    const reviewQueueList = document.getElementById('reviewQueueList');
    const reviewQueueSubtext = document.getElementById('reviewQueueSubtext');
    const reviewQueueActions = document.getElementById('reviewQueueActions');

    if (!reviewQueueList || !reviewQueueSubtext || !reviewQueueActions) {
      return;
    }

    reviewQueueList.innerHTML = '';
    reviewQueueActions.innerHTML = '';

    if (dueNames.length === 0) {
      reviewQueueSubtext.textContent = 'Names due for review today';
      reviewQueueList.innerHTML = `
        <div class="queue-empty">
          <div class="queue-empty-icon">✓</div>
          <p class="queue-empty-title">All caught up!</p>
          <p class="queue-empty-text">Come back tomorrow for your next review.</p>
        </div>
      `;
      return;
    }

    reviewQueueSubtext.textContent = `${dueNames.length} names due for review`;

    dueNames.forEach((name) => {
      const dueLabel = this.#formatDueDate(name.progress.nextReview);
      const dueClass = dueLabel === 'Due today' ? 'due-today' : 'due-overdue';

      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'review-queue-card';
      card.setAttribute(
        'aria-label',
        `Review ${name.transliteration}, ${dueLabel.toLowerCase()}`
      );
      card.innerHTML = `
        <div class="review-queue-arabic" lang="ar" dir="rtl">${name.arabic}</div>
        <div class="review-queue-name">
          <div class="review-queue-transliteration">${name.transliteration}</div>
          <div class="review-queue-meaning">${name.english_meaning}</div>
        </div>
        <div class="review-queue-due ${dueClass}">${dueLabel}</div>
      `;

      card.addEventListener('click', () => {
        this.uiRenderer.showNameDetail(name.index);
      });

      reviewQueueList.appendChild(card);
    });

    const startReviewBtn = document.createElement('button');
    startReviewBtn.type = 'button';
    startReviewBtn.className = 'btn btn-primary btn-start-review';
    startReviewBtn.textContent = 'Start Review Session →';
    startReviewBtn.addEventListener('click', () => {
      const memorizeLink = document.querySelector('.nav-link[data-view="memorize"]');
      if (memorizeLink instanceof HTMLElement) {
        memorizeLink.click();
      }
    });

    reviewQueueActions.appendChild(startReviewBtn);
  }

  #getDueNames() {
    const today = new Date().toISOString().split('T')[0];

    return this.dataManager
      .getAllNames()
      .map((name) => {
        const progress = this.progressTracker.progress.names[name.index] || {
          status: 'new',
          nextReview: null,
        };
        return { ...name, progress };
      })
      .filter(
        (name) =>
          name.progress.status === 'learning' &&
          name.progress.nextReview &&
          name.progress.nextReview <= today
      )
      .sort((a, b) => a.progress.nextReview.localeCompare(b.progress.nextReview))
      .slice(0, 5);
  }

  #getDotStatus(index) {
    const progress = this.progressTracker.progress.names[index];
    return progress?.status || 'new';
  }

  #formatDueDate(dateStr) {
    const today = new Date().toISOString().split('T')[0];
    const diff = Math.floor((Date.parse(today) - Date.parse(dateStr)) / 86400000);

    if (diff === 0) return 'Due today';
    if (diff === 1) return '1 day overdue';
    if (diff > 1) return `${diff} days overdue`;
    return 'Upcoming';
  }
}
