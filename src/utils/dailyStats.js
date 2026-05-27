// daily_stats_v2: tracks unique words per day using wordId as key.
//
// Why not migrate from daily_stats_v1?
// v1 stored only aggregate attempt counts (easy/hard/skip totals) with no wordId.
// There is no reliable way to reconstruct which unique words were studied on a given day,
// so migration is not possible. v1 data is silently ignored; streak resets once after deploy.

const KEY = 'daily_stats_v2';

// Use local date parts (not toISOString) to avoid UTC timezone drift
// producing the wrong calendar day for local users.
const todayKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export function loadDailyStats() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveDailyStats(map) {
  try {
    localStorage.setItem(KEY, JSON.stringify(map));
  } catch {
    // localStorage quota exceeded or unavailable — stats not persisted this session
  }
}

// result: 'easy' | 'hard' | 'skip'
// wordId: unique word identifier — upserts so the same word counts only once per day
export function recordDailyResult({ wordId, result }) {
  const map = loadDailyStats();
  const key = todayKey();
  if (!map[key]) map[key] = { words: {} };
  map[key].words[wordId] = result; // overwrites any previous result for this word today
  saveDailyStats(map);
}

function getDayStats(dayData) {
  const entries = Object.values(dayData?.words ?? {});
  const easy = entries.filter(r => r === 'easy').length;
  const hard = entries.filter(r => r === 'hard').length;
  const skip = entries.filter(r => r === 'skip').length;
  return { total: entries.length, easy, hard, skip, correct: easy };
}

export function getTodaySummary(goal = 10) {
  const map = loadDailyStats();
  const stats = getDayStats(map[todayKey()]);
  const accuracy = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
  return {
    attempts: stats.total, // kept as 'attempts' for backward-compat with Dashboard/Flashcard props
    correct: stats.correct,
    easy: stats.easy,
    hard: stats.hard,
    skip: stats.skip,
    goal,
    progressText: `${Math.min(stats.total, goal)}/${goal}`,
    accuracy,
  };
}

export function getRollingAccuracy(days = 7) {
  const map = loadDailyStats();
  const last = Object.keys(map).sort().slice(-days);
  let total = 0, correct = 0;
  for (const k of last) {
    const s = getDayStats(map[k]);
    total += s.total;
    correct += s.correct;
  }
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
  return { accuracy, attempts: total };
}

export function getStreak() {
  const map = loadDailyStats();
  let streak = 0;
  let d = new Date();
  while (true) {
    const key = todayKey(d);
    if (!Object.keys(map[key]?.words ?? {}).length) break;
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}
