/**
 * Progress Tracker - localStorage persistence for memorization progress
 * Tracks learning status, mastery levels, streaks, and stats
 */

export class ProgressTracker {
  constructor() {
    this.storageKey = 'namesOfAllah_progress';
    this.progress = this.load();
  }

  /**
   * Initialize default progress structure
   * @returns {object}
   */
  getDefaultProgress() {
    return {
      names: {}, // Keyed by name index (1-99)
      stats: {
        totalLearned: 0,      // Names in learning phase
        totalMastered: 0,     // Names at mastery level 4
        currentStreak: 0,     // Consecutive days practiced
        longestStreak: 0,     // Best streak record
        lastPracticeDate: null,
        totalSessions: 0,
        totalReviews: 0
      },
      version: 1
    };
  }

  /**
   * Get default name progress structure
   * @param {number} index - Name index (1-99)
   * @returns {object}
   */
  getDefaultNameProgress(index) {
    return {
      index,
      status: 'new',           // 'new', 'learning', 'mastered'
      masteryLevel: 0,         // 0-4
      lastReviewed: null,      // YYYY-MM-DD
      nextReview: null,        // YYYY-MM-DD
      correctStreak: 0,        // Consecutive correct answers
      totalAttempts: 0,        // Total times reviewed
      totalCorrect: 0,         // Total correct answers
      firstLearned: null,      // YYYY-MM-DD (first exposure)
      masteredDate: null       // YYYY-MM-DD (when reached level 4)
    };
  }

  /**
   * Load progress from localStorage
   * @returns {object}
   */
  load() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Ensure structure is complete
        return {
          ...this.getDefaultProgress(),
          ...parsed,
          stats: {
            ...this.getDefaultProgress().stats,
            ...parsed.stats
          }
        };
      }
    } catch (error) {
      console.error('Failed to load progress:', error);
    }

    return this.getDefaultProgress();
  }

  /**
   * Save progress to localStorage
   * @returns {boolean} - Success
   */
  save() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.progress));
      return true;
    } catch (error) {
      console.error('Failed to save progress:', error);
      return false;
    }
  }

  /**
   * Get progress for a specific name
   * @param {number} index - Name index (1-99)
   * @returns {object}
   */
  getNameProgress(index) {
    if (!this.progress.names[index]) {
      this.progress.names[index] = this.getDefaultNameProgress(index);
    }
    return this.progress.names[index];
  }

  /**
   * Update progress after reviewing a name
   * @param {number} index - Name index
   * @param {object} reviewResult - { newLevel, intervalDays, nextReviewDate }
   * @param {boolean} wasCorrect - Did user remember it?
   */
  updateNameProgress(index, reviewResult, wasCorrect) {
    const nameProgress = this.getNameProgress(index);
    const today = new Date().toISOString().split('T')[0];

    // Update mastery level
    nameProgress.masteryLevel = reviewResult.newLevel;
    nameProgress.lastReviewed = today;
    nameProgress.nextReview = reviewResult.nextReviewDate;
    nameProgress.totalAttempts++;

    // Track correct streak
    if (wasCorrect) {
      nameProgress.correctStreak++;
      nameProgress.totalCorrect++;
    } else {
      nameProgress.correctStreak = 0;
    }

    // Update status
    if (nameProgress.status === 'new') {
      nameProgress.status = 'learning';
      nameProgress.firstLearned = today;
    }

    if (reviewResult.newLevel >= 4 && nameProgress.status !== 'mastered') {
      nameProgress.status = 'mastered';
      nameProgress.masteredDate = today;
    } else if (reviewResult.newLevel < 4) {
      nameProgress.status = 'learning';
    }

    // Save changes
    this.save();
    this.updateGlobalStats();
  }

  /**
   * Recalculate global stats from name progress
   */
  updateGlobalStats() {
    let totalLearned = 0;
    let totalMastered = 0;

    Object.values(this.progress.names).forEach(name => {
      if (name.status === 'learning') totalLearned++;
      if (name.status === 'mastered') totalMastered++;
    });

    this.progress.stats.totalLearned = totalLearned;
    this.progress.stats.totalMastered = totalMastered;

    this.save();
  }

  /**
   * Record a practice session
   * @param {number} reviewCount - Names reviewed
   */
  recordSession(reviewCount) {
    const today = new Date().toISOString().split('T')[0];

    this.progress.stats.totalSessions++;
    this.progress.stats.totalReviews += reviewCount;

    // Update streak
    this.updateStreak(today);

    this.save();
  }

  /**
   * Update practice streak
   * @param {string} today - YYYY-MM-DD
   */
  updateStreak(today) {
    const lastDate = this.progress.stats.lastPracticeDate;

    if (!lastDate) {
      // First practice
      this.progress.stats.currentStreak = 1;
      this.progress.stats.lastPracticeDate = today;
    } else if (lastDate === today) {
      // Already practiced today
      return;
    } else {
      // Check if consecutive
      const last = new Date(lastDate);
      const current = new Date(today);
      const diffDays = Math.floor((current - last) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        // Consecutive day
        this.progress.stats.currentStreak++;
      } else if (diffDays > 1) {
        // Streak broken
        this.progress.stats.currentStreak = 1;
      }

      this.progress.stats.lastPracticeDate = today;

      // Update longest streak
      if (this.progress.stats.currentStreak > this.progress.stats.longestStreak) {
        this.progress.stats.longestStreak = this.progress.stats.currentStreak;
      }
    }
  }

  /**
   * Get overall stats
   * @returns {object}
   */
  getStats() {
    return {
      ...this.progress.stats,
      totalNames: Object.keys(this.progress.names).length,
      notStarted: 99 - Object.keys(this.progress.names).length,
      completionPercentage: Math.round(
        (this.progress.stats.totalMastered / 99) * 100
      )
    };
  }

  /**
   * Reset all progress (with confirmation)
   * @returns {boolean}
   */
  reset() {
    this.progress = this.getDefaultProgress();
    return this.save();
  }

  /**
   * Export progress as JSON (for backup)
   * @returns {string}
   */
  export() {
    return JSON.stringify(this.progress, null, 2);
  }

  /**
   * Import progress from JSON backup
   * @param {string} jsonString
   * @returns {boolean} - Success
   */
  import(jsonString) {
    try {
      const imported = JSON.parse(jsonString);

      // Validate structure
      if (!imported.names || !imported.stats) {
        throw new Error('Invalid progress format');
      }

      this.progress = {
        ...this.getDefaultProgress(),
        ...imported
      };

      return this.save();
    } catch (error) {
      console.error('Failed to import progress:', error);
      return false;
    }
  }

  /**
   * Get names by status
   * @param {string} status - 'new', 'learning', 'mastered'
   * @returns {array} - Array of name indices
   */
  getNamesByStatus(status) {
    return Object.values(this.progress.names)
      .filter(name => name.status === status)
      .map(name => name.index);
  }

  /**
   * Get progress percentage for a name
   * @param {number} index
   * @returns {number} - 0-100
   */
  getNameProgressPercentage(index) {
    const nameProgress = this.getNameProgress(index);
    return (nameProgress.masteryLevel / 4) * 100;
  }
}
