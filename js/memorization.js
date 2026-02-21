/**
 * Memorization Engine - Spaced Repetition System (SRS)
 * Helps users memorize the 99 Names with scientifically-proven intervals
 */

export class MemorizationEngine {
  constructor() {
    // Spaced repetition intervals in days
    this.intervals = [1, 3, 7, 14, 30];

    // Maximum mastery level (level 4 = mastered)
    this.maxLevel = 4;

    // Default: start with 5 new names per session
    this.newNamesPerSession = 5;
  }

  /**
   * Calculate next review date based on difficulty response
   * @param {number} currentLevel - Current mastery level (0-4)
   * @param {string} difficulty - User response: 'forgot', 'hard', 'good', 'easy'
   * @returns {object} - { newLevel, intervalDays, nextReviewDate }
   */
  calculateNextReview(currentLevel, difficulty) {
    let newLevel = currentLevel;
    let intervalDays = 1;

    switch (difficulty) {
      case 'forgot':
        // Reset to beginning
        newLevel = 0;
        intervalDays = this.intervals[0]; // 1 day
        break;

      case 'hard':
        // Stay at current level, review tomorrow
        newLevel = Math.max(0, currentLevel);
        intervalDays = this.intervals[0]; // 1 day
        break;

      case 'good':
        // Move up one level
        newLevel = Math.min(this.maxLevel, currentLevel + 1);
        intervalDays = this.intervals[Math.min(newLevel, this.intervals.length - 1)];
        break;

      case 'easy':
        // Skip ahead one level
        newLevel = Math.min(this.maxLevel, currentLevel + 2);
        intervalDays = this.intervals[Math.min(newLevel, this.intervals.length - 1)];
        break;
    }

    // Calculate next review date
    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + intervalDays);

    return {
      newLevel,
      intervalDays,
      nextReviewDate: nextReviewDate.toISOString().split('T')[0] // YYYY-MM-DD
    };
  }

  /**
   * Determine if a name is due for review today
   * @param {string} nextReviewDate - YYYY-MM-DD format
   * @returns {boolean}
   */
  isDueForReview(nextReviewDate) {
    if (!nextReviewDate) return false;

    const today = new Date().toISOString().split('T')[0];
    return nextReviewDate <= today;
  }

  /**
   * Get review queue for today
   * @param {object} progress - Full progress object with all names
   * @returns {array} - Array of name indices due for review
   */
  getReviewQueue(progress) {
    const queue = [];
    const today = new Date().toISOString().split('T')[0];

    Object.keys(progress.names || {}).forEach(index => {
      const name = progress.names[index];

      // Include if:
      // 1. Name has been started (status !== 'new')
      // 2. Not yet mastered (masteryLevel < maxLevel)
      // 3. Due for review today (nextReview <= today)
      if (
        name.status !== 'new' &&
        name.masteryLevel < this.maxLevel &&
        this.isDueForReview(name.nextReview)
      ) {
        queue.push(parseInt(index));
      }
    });

    return queue;
  }

  /**
   * Get new names to introduce in this session
   * @param {object} progress - Full progress object
   * @param {number} totalNames - Total number of names (99)
   * @param {number} limit - Max new names to introduce (default: 5)
   * @returns {array} - Array of name indices to introduce
   */
  getNewNames(progress, totalNames = 99, limit = null) {
    const maxNew = limit || this.newNamesPerSession;
    const newNames = [];

    for (let i = 1; i <= totalNames; i++) {
      const nameProgress = progress.names?.[i];

      // Include if not yet started
      if (!nameProgress || nameProgress.status === 'new') {
        newNames.push(i);

        if (newNames.length >= maxNew) break;
      }
    }

    return newNames;
  }

  /**
   * Build session queue (mix of review + new)
   * @param {object} progress - Full progress object
   * @param {number} totalNames - Total names available
   * @returns {object} - { queue: [], reviewCount: 0, newCount: 0 }
   */
  buildSessionQueue(progress, totalNames = 99) {
    const reviewQueue = this.getReviewQueue(progress);
    const newQueue = this.getNewNames(progress, totalNames);

    // Mix: reviews first, then new names
    const queue = [...reviewQueue, ...newQueue];

    return {
      queue,
      reviewCount: reviewQueue.length,
      newCount: newQueue.length,
      totalCount: queue.length
    };
  }

  /**
   * Shuffle array (for flashcard randomization)
   * @param {array} array
   * @returns {array} - Shuffled copy
   */
  shuffle(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Get encouragement message based on session performance
   * @param {number} correctCount
   * @param {number} totalCount
   * @returns {string}
   */
  getEncouragementMessage(correctCount, totalCount) {
    const percentage = (correctCount / totalCount) * 100;

    if (percentage === 100) {
      return "Masha'Allah! Perfect session! 🌟";
    } else if (percentage >= 80) {
      return "Excellent work! Keep up the momentum! 💪";
    } else if (percentage >= 60) {
      return "Good progress! You're getting stronger! ✨";
    } else if (percentage >= 40) {
      return "Keep practicing - every review counts! 📚";
    } else {
      return "Don't give up! Consistency is key! 🎯";
    }
  }

  /**
   * Check if name is mastered
   * @param {object} nameProgress
   * @returns {boolean}
   */
  isMastered(nameProgress) {
    return nameProgress?.masteryLevel >= this.maxLevel;
  }

  /**
   * Get interval label for difficulty button
   * @param {string} difficulty
   * @returns {string}
   */
  getIntervalLabel(difficulty) {
    switch (difficulty) {
      case 'forgot': return 'Review tomorrow';
      case 'hard': return '1 day';
      case 'good': return '3 days';
      case 'easy': return '7 days';
      default: return '';
    }
  }
}
