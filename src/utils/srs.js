/**
 * Spaced Repetition System (SRS) - Simplified SM-2 Algorithm
 * Based on the PRD requirements for vocabulary learning
 */

/**
 * Calculate the next review date based on the current level and interval
 * @param {number} level - Current SRS level (starts at 0)
 * @param {number} currentInterval - Current interval in days
 * @returns {number} - New interval in days
 */
export const calculateNextInterval = (level, currentInterval) => {
  if (level === 0) {
    return 1; // First review: tomorrow
  } else if (level === 1) {
    return 3; // Second review: 3 days
  } else if (level === 2) {
    return 7; // Third review: 1 week
  } else if (level === 3) {
    return 14; // Fourth review: 2 weeks
  } else if (level === 4) {
    return 30; // Fifth review: 1 month
  } else {
    // For higher levels, use exponential growth
    return Math.min(currentInterval * 1.5, 90); // Cap at 90 days
  }
};

/**
 * Handle "Easy" response - user knew the word
 * @param {Object} word - Word object with SRS data
 * @returns {Object} - Updated word object
 */
export const handleEasyResponse = (word) => {
  const newLevel = word.level + 1;
  const newInterval = calculateNextInterval(newLevel, word.interval || 0);
  const now = new Date();
  const dueDate = new Date(now);
  dueDate.setDate(dueDate.getDate() + newInterval);

  return {
    ...word,
    level: newLevel,
    interval: newInterval,
    lastReviewed: now.toISOString(),
    dueDate: dueDate.toISOString(),
    exposure: Math.min((word.exposure || 0) + 1, 10), // Cap at 10 exposures
    consecutiveCorrect: (word.consecutiveCorrect || 0) + 1,
  };
};

/**
 * Handle "Hard" response - user needs more practice
 * @param {Object} word - Word object with SRS data
 * @returns {Object} - Updated word object
 */
export const handleHardResponse = (word) => {
  const now = new Date();
  // Reset interval to 0 (show again today or tomorrow)
  const dueDate = new Date(now);
  dueDate.setDate(dueDate.getDate() + 1); // Show again tomorrow

  return {
    ...word,
    level: Math.max(0, word.level - 1), // Decrease level, but not below 0
    interval: 0, // Reset interval
    lastReviewed: now.toISOString(),
    dueDate: dueDate.toISOString(),
    exposure: Math.min((word.exposure || 0) + 1, 10),
    consecutiveCorrect: 0, // Reset consecutive correct count
    needsReview: true, // Mark for review in current session
  };
};

/**
 * Check if a word is due for review
 * @param {Object} word - Word object with SRS data
 * @returns {boolean} - True if word is due for review
 */
export const isWordDue = (word) => {
  if (!word.dueDate) {
    return true; // New word, always due
  }
  
  const now = new Date();
  const dueDate = new Date(word.dueDate);
  
  // Word is due if dueDate is today or in the past
  return dueDate <= now || word.needsReview === true;
};

/**
 * Sort words by priority for session
 * Priority: 1. Words due for review, 2. Words marked as needsReview, 3. New words, 4. Others
 * @param {Array} words - Array of word objects
 * @returns {Array} - Sorted array of words
 */
export const sortWordsByPriority = (words) => {
  return [...words].sort((a, b) => {
    // First: words that need review (marked as needsReview)
    if (a.needsReview && !b.needsReview) return -1;
    if (!a.needsReview && b.needsReview) return 1;
    
    // Second: words that are due
    const aDue = isWordDue(a);
    const bDue = isWordDue(b);
    if (aDue && !bDue) return -1;
    if (!aDue && bDue) return 1;
    
    // Third: new words (no level or level 0)
    const aNew = !a.level || a.level === 0;
    const bNew = !b.level || b.level === 0;
    if (aNew && !bNew) return -1;
    if (!aNew && bNew) return 1;
    
    // Fourth: by due date (earlier first)
    if (a.dueDate && b.dueDate) {
      return new Date(a.dueDate) - new Date(b.dueDate);
    }
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;
    
    // Finally: by ID (string-safe comparison)
    return String(a.id).localeCompare(String(b.id));
  });
};

/**
 * Shuffle an array in place using Fisher-Yates and return a new copy.
 * @param {Array} arr
 * @returns {Array}
 */
const shuffleArray = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

/**
 * Get words for current session using balanced bucket selection.
 *
 * Buckets (in priority order):
 *   review   – needsReview === true (Hard-pressed recently)
 *   due      – overdue by date, not flagged as needsReview
 *   learning – seen before (exposure > 0) but not yet strong (level < 3), not yet due
 *   new      – never reviewed (no dueDate)
 *
 * Target mix for a session: ~60% review+due, ~30% learning, ~10% new.
 * Leftover slots cascade downward; a safety-net pass fills any remaining gap.
 *
 * @param {Array} words - Array of all word objects
 * @param {number} maxWords - Maximum words per session (default: 5)
 * @returns {Array} - Array of words for current session
 */
export const getSessionWords = (words, maxWords = 5) => {
  const now = new Date();

  // 1. Partition into buckets
  const review = shuffleArray(
    words.filter(w => w.needsReview === true)
  );
  const due = words
    .filter(w => !w.needsReview && w.dueDate && new Date(w.dueDate) <= now)
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)); // most overdue first
  const learning = shuffleArray(
    words.filter(w =>
      !w.needsReview &&
      w.dueDate &&
      new Date(w.dueDate) > now &&
      (w.exposure || 0) > 0 &&
      (w.level || 0) < 3
    )
  );
  const newWords = shuffleArray(
    words.filter(w => !w.needsReview && !w.dueDate)
  );

  // 2. Proportional targets
  const tRD       = Math.round(maxWords * 0.6);
  const tLearning = Math.round(maxWords * 0.3);
  const tNew      = maxWords - tRD - tLearning;

  // 3. Fill with cascade fallback
  const rdPool   = [...review, ...due];
  const pickedRD = rdPool.slice(0, tRD);
  let   leftover = tRD - pickedRD.length;

  const pickedL = learning.slice(0, tLearning + leftover);
  leftover      = (tLearning + leftover) - pickedL.length;

  const pickedN = newWords.slice(0, tNew + leftover);

  let session = [...pickedRD, ...pickedL, ...pickedN];

  // 4. Safety net: pad if still short, reusing already-ordered bucket arrays
  if (session.length < maxWords) {
    const usedIds = new Set(session.map(w => w.id));
    const extras  = [...review, ...due, ...learning, ...newWords]
      .filter(w => !usedIds.has(w.id));
    session = [...session, ...extras].slice(0, maxWords);
  }

  return session;
};
