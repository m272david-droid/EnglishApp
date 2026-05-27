/**
 * LocalStorage utilities for persisting user progress
 * v2.0.0 — sparse SRS format: only stores touched words keyed by id
 */

const STORAGE_KEY = 'english_vocab_app_data';
const STORAGE_VERSION = '2.0.0';

/**
 * Save words data to localStorage (sparse — only words with exposure > 0)
 * @param {Array} words - Array of word objects
 */
export const saveWordsToStorage = (words) => {
  try {
    const srsMap = {};
    words.forEach(w => {
      if ((w.exposure || 0) > 0) {
        srsMap[w.id] = {
          exposure: w.exposure,
          level: w.level,
          interval: w.interval,
          lastReviewed: w.lastReviewed,
          dueDate: w.dueDate,
          consecutiveCorrect: w.consecutiveCorrect,
          needsReview: w.needsReview,
        };
      }
    });
    const data = {
      version: STORAGE_VERSION,
      srsMap,
      lastSaved: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
};

/**
 * Load SRS data from localStorage
 * @returns {Object|null} - Sparse map { [wordId]: srsFields } or null if not found / wrong version
 */
export const loadWordsFromStorage = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const data = JSON.parse(stored);

    // Version mismatch (including old v1 full-words format) → discard, fresh start
    if (data?.version !== STORAGE_VERSION) return null;

    return data.srsMap ?? null;
  } catch (error) {
    console.error('Error loading from localStorage:', error);
    return null;
  }
};

/**
 * Clear all stored data
 */
export const clearStorage = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing localStorage:', error);
  }
};

/**
 * Get storage statistics
 * @returns {Object} - Statistics about stored data
 */
export const getStorageStats = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return { exists: false };

    const data = JSON.parse(stored);
    return {
      exists: true,
      version: data.version,
      lastSaved: data.lastSaved,
      wordCount: data.srsMap ? Object.keys(data.srsMap).length : 0,
    };
  } catch (error) {
    return { exists: false, error: error.message };
  }
};
