import rawData from './model_e_dataset_final_enriched.json';

function normalizeWord(raw) {
  // Multi-tier fallback — every word will always have a non-null definition
  const definition =
    raw.definition ||
    raw.bagrut?.correctDefinitions?.[0] ||
    raw.lemma ||
    raw.display;

  // Hebrew: safely handle both string and object shapes
  const hebrew =
    typeof raw.hebrew === 'object'
      ? raw.hebrew.main
      : raw.hebrew ?? '';

  const hebrewAlternatives =
    typeof raw.hebrew === 'object'
      ? raw.hebrew.alternatives ?? []
      : [];

  return {
    // --- core fields (app-facing) ---
    id: raw.id,                         // string: "b3-0042"
    word: raw.display || raw.lemma,     // display with lemma fallback
    partOfSpeech: raw.partOfSpeech ?? '',
    definition,
    example: raw.example ?? null,
    hebrew,
    band: raw.band,

    // --- SRS defaults (overwritten by storage on load) ---
    exposure: 0,
    level: 0,
    interval: 0,
    lastReviewed: null,
    dueDate: null,
    consecutiveCorrect: 0,
    needsReview: false,

    // --- extra fields preserved for future features ---
    lemma: raw.lemma,
    type: raw.type,
    surfaceForms: raw.surfaceForms ?? [],
    hebrewAlternatives,
    bagrut: raw.bagrut ?? null,
  };
}

export const initialVocabularyData = rawData.map(normalizeWord);

// Helper function to initialize a word with default SRS values
export const initializeWordSRS = (word) => ({
  ...word, // carries lemma, type, bagrut, hebrewAlternatives, surfaceForms, etc.
  exposure: word.exposure ?? 0,
  level: word.level ?? 0,
  interval: word.interval ?? 0,
  lastReviewed: word.lastReviewed ?? null,
  dueDate: word.dueDate ?? null,
  consecutiveCorrect: word.consecutiveCorrect ?? 0,
  needsReview: word.needsReview ?? false,
});
