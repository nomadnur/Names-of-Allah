/**
 * Session Controller - Manages flashcard sessions
 * Coordinates between MemorizationEngine, ProgressTracker, and UI
 */

import { MemorizationEngine } from './memorization.js';
import { ProgressTracker } from './progress.js';

export class SessionController {
  constructor(dataManager) {
    this.dataManager = dataManager;
    this.engine = new MemorizationEngine();
    this.progress = new ProgressTracker();

    this.currentSession = null;
    this.currentCardIndex = 0;
    this.isFlipped = false;
    this.processingAssessment = false; // Prevent double-clicks

    this.initializeElements();
    this.attachEventListeners();
  }

  /**
   * Initialize DOM element references
   */
  initializeElements() {
    this.elements = {
      // Session Start
      sessionStart: document.getElementById('sessionStart'),
      reviewCount: document.getElementById('reviewCount'),
      newCount: document.getElementById('newCount'),
      startSessionBtn: document.getElementById('startSessionBtn'),

      // Flashcard Session
      flashcardSession: document.getElementById('flashcardSession'),
      progressText: document.getElementById('progressText'),
      progressFill: document.getElementById('progressFill'),
      flashcard: document.getElementById('flashcard'),
      flashcardContainer: document.getElementById('flashcardContainer'),
      cardArabic: document.getElementById('cardArabic'),
      cardTransliteration: document.getElementById('cardTransliteration'),
      cardMeaning: document.getElementById('cardMeaning'),
      cardContext: document.getElementById('cardContext'),
      assessmentButtons: document.getElementById('assessmentButtons'),

      // Session Summary
      sessionSummary: document.getElementById('sessionSummary'),
      summaryCorrect: document.getElementById('summaryCorrect'),
      summaryStreak: document.getElementById('summaryStreak'),
      summaryMessage: document.getElementById('summaryMessage'),
      reviewAgainBtn: document.getElementById('reviewAgainBtn'),
      doneBtn: document.getElementById('doneBtn'),

      // Empty State
      emptyState: document.getElementById('emptyState'),
      backToBrowseBtn: document.getElementById('backToBrowseBtn')
    };
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // Start session
    this.elements.startSessionBtn.addEventListener('click', () => this.startSession());

    // Flashcard flip (bind to card only to avoid accidental flips from container taps)
    this.elements.flashcard.addEventListener('click', (event) => {
      event.preventDefault();
      this.flipCard();
    });

    // Assessment buttons
    this.elements.assessmentButtons.addEventListener('click', (e) => {
      const btn = e.target.closest('.assessment-btn');
      if (btn) {
        const difficulty = btn.dataset.difficulty;
        this.handleAssessment(difficulty);
      }
    });

    // Summary actions
    this.elements.reviewAgainBtn.addEventListener('click', () => this.startSession());
    this.elements.doneBtn.addEventListener('click', () => this.showStartScreen());
    this.elements.backToBrowseBtn.addEventListener('click', () => {
      // Switch to browse view (handled by main app)
      window.location.hash = '#browse';
    });
  }

  /**
   * Initialize session (show start screen with stats)
   */
  init() {
    const sessionData = this.refreshSessionCounts();

    // Show appropriate screen
    if (sessionData.totalCount === 0) {
      this.showEmptyState();
    } else {
      this.showStartScreen();
    }
  }

  /**
   * Show session start screen
   */
  showStartScreen() {
    const sessionData = this.refreshSessionCounts();
    if (sessionData.totalCount === 0) {
      this.showEmptyState();
      return;
    }

    this.elements.sessionStart.classList.remove('hidden');
    this.elements.flashcardSession.classList.add('hidden');
    this.elements.sessionSummary.classList.add('hidden');
    this.elements.emptyState.classList.add('hidden');
  }

  /**
   * Show empty state (all caught up)
   */
  showEmptyState() {
    this.elements.sessionStart.classList.add('hidden');
    this.elements.flashcardSession.classList.add('hidden');
    this.elements.sessionSummary.classList.add('hidden');
    this.elements.emptyState.classList.remove('hidden');
  }

  /**
   * Set the interval text under each assessment button for one Name
   * @param {number} nameIndex
   */
  updateIntervalLabels(nameIndex) {
    const level = this.progress.getNameProgress(nameIndex)?.masteryLevel || 0;
    this.elements.assessmentButtons.querySelectorAll('.assessment-btn').forEach(btn => {
      const { intervalDays } = this.engine.calculateNextReview(level, btn.dataset.difficulty);
      const when = intervalDays === 1 ? 'Tomorrow' : `In ${intervalDays} days`;
      btn.querySelector('.interval').textContent = btn.dataset.difficulty === 'forgot' ? `${when}, start over` : when;
    });
  }

  /**
   * Start a new session
   */
  startSession() {
    this.processingAssessment = false;

    // Build session queue
    const sessionData = this.engine.buildSessionQueue(
      this.progress.progress,
      this.dataManager.getAllNames().length
    );

    if (sessionData.totalCount === 0) {
      this.showEmptyState();
      return;
    }

    // Initialize session state
    this.currentSession = {
      queue: sessionData.queue,
      currentIndex: 0,
      totalCards: sessionData.totalCount,
      results: [] // Track performance for summary
    };

    // Show flashcard session
    this.elements.sessionStart.classList.add('hidden');
    this.elements.flashcardSession.classList.remove('hidden');
    this.elements.sessionSummary.classList.add('hidden');

    // Load first card
    this.loadCard(0);
  }

  /**
   * Load a flashcard
   * @param {number} index - Index in session queue
   */
  loadCard(index) {
    if (index >= this.currentSession.totalCards) {
      this.endSession();
      return;
    }

    this.currentSession.currentIndex = index;
    this.isFlipped = false;

    // Get name data
    const nameIndex = this.currentSession.queue[index];
    const name = this.dataManager.getAllNames().find(n => n.index === nameIndex);

    if (!name) {
      console.error(`Name not found: index ${nameIndex}`);
      return;
    }

    // Update card content
    this.elements.cardArabic.textContent = name.arabic;
    this.elements.cardTransliteration.textContent = name.transliteration;
    this.elements.cardMeaning.textContent = name.english_meaning;
    this.elements.cardContext.textContent = name.when_to_invoke || name.aqeedah_belief?.substring(0, 150) + '...';

    // Show each button's real next review for this Name's current level
    this.updateIntervalLabels(nameIndex);

    // Reset card state
    this.elements.flashcard.classList.remove('flipped');
    this.elements.assessmentButtons.classList.add('hidden');

    // Update progress indicator
    this.updateProgress();
  }

  /**
   * Flip the flashcard
   */
  flipCard() {
    if (!this.currentSession) return;
    if (this.processingAssessment) return;
    if (this.elements.flashcardSession.classList.contains('hidden')) return;
    if (this.isFlipped) return; // Already flipped

    this.isFlipped = true;
    this.elements.flashcard.classList.add('flipped');

    // Show assessment buttons after flip
    setTimeout(() => {
      this.elements.assessmentButtons.classList.remove('hidden');
    }, 300);
  }

  /**
   * Handle user assessment
   * @param {string} difficulty - 'forgot', 'hard', 'good', 'easy'
   */
  handleAssessment(difficulty) {
    // Prevent double-clicks - exit if already processing
    if (this.processingAssessment) {
      return;
    }

    this.processingAssessment = true;

    // Haptic feedback (mobile)
    if (navigator.vibrate) {
      const wasCorrect = ['good', 'easy'].includes(difficulty);
      navigator.vibrate(wasCorrect ? [30] : [40, 30, 40]);
    }

    const nameIndex = this.currentSession.queue[this.currentSession.currentIndex];
    const nameProgress = this.progress.getNameProgress(nameIndex);

    // Calculate next review
    const reviewResult = this.engine.calculateNextReview(
      nameProgress.masteryLevel,
      difficulty
    );

    // Determine if answer was correct
    const wasCorrect = ['good', 'easy'].includes(difficulty);

    // Update progress
    this.progress.updateNameProgress(nameIndex, reviewResult, wasCorrect);

    // Track session result
    this.currentSession.results.push({
      nameIndex,
      difficulty,
      wasCorrect,
      newLevel: reviewResult.newLevel
    });

    console.log(`➡️  Loading next card: ${this.currentSession.currentIndex + 1}`);

    // Hide buttons before loading next card
    this.elements.assessmentButtons.classList.add('hidden');

    // Small delay to show feedback, then load next card
    setTimeout(() => {
      this.processingAssessment = false;
      this.loadCard(this.currentSession.currentIndex + 1);
    }, 200);
  }

  /**
   * Update progress indicator
   */
  updateProgress() {
    const current = this.currentSession.currentIndex + 1;
    const total = this.currentSession.totalCards;

    this.elements.progressText.textContent = `${current} / ${total}`;

    const percentage = (current / total) * 100;
    this.elements.progressFill.style.width = `${percentage}%`;
  }

  /**
   * End session and show summary
   */
  endSession() {
    console.log('🎉 Session ending...', this.currentSession);

    // Calculate stats
    const correctCount = this.currentSession.results.filter(r => r.wasCorrect).length;
    const totalCount = this.currentSession.results.length;

    console.log(`📊 Stats: ${correctCount}/${totalCount} correct`);

    // Record session
    this.progress.recordSession(totalCount);

    // Update summary UI
    this.elements.summaryCorrect.textContent = totalCount;
    this.elements.summaryStreak.textContent = this.progress.progress.stats.currentStreak;
    this.elements.summaryMessage.textContent = this.engine.getEncouragementMessage(
      correctCount,
      totalCount
    );

    console.log('✅ Showing summary screen');

    // Show summary screen
    this.elements.flashcardSession.classList.add('hidden');
    this.elements.sessionSummary.classList.remove('hidden');
  }

  /**
   * Recompute and render current start-screen counters.
   * @returns {{queue:number[],reviewCount:number,newCount:number,totalCount:number}}
   */
  refreshSessionCounts() {
    const sessionData = this.engine.buildSessionQueue(
      this.progress.progress,
      this.dataManager.getAllNames().length
    );

    this.elements.reviewCount.textContent = sessionData.reviewCount;
    this.elements.newCount.textContent = sessionData.newCount;

    return sessionData;
  }

  /**
   * Get current session stats (for debugging)
   */
  getSessionStats() {
    if (!this.currentSession) return null;

    return {
      totalCards: this.currentSession.totalCards,
      currentIndex: this.currentSession.currentIndex,
      results: this.currentSession.results
    };
  }
}
