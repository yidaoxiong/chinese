export const PROGRESS_VERSION = 3;
export const STATE_KEY = `chinese_card_progress_v${PROGRESS_VERSION}`;
export const LOG_KEY = `chinese_review_log_v${PROGRESS_VERSION}`;
export const CLIENT_KEY = 'chinese_client_id';
export const DAILY_TARGET = 20;

const safeStorage = (storage) => storage || (typeof localStorage !== 'undefined' ? localStorage : null);
export const userStorageKey = (base, userId = 'guest') => `${base}_${userId || 'guest'}`;

function parse(value, defaultValue) { try { return value == null ? defaultValue : JSON.parse(value); } catch { return defaultValue; } }

export function emptyProgress() { return { cardProgress: {}, logs: [] }; }

export function migrateProgressState(rawProgress, rawLogs, cards = []) {
  const aliases = new Map();
  for (const card of cards) for (const alias of [card.id, card.progressKey, ...(card.legacyIds || [])]) if (alias) aliases.set(alias, card.id);
  const cardProgress = {};
  for (const [key, value] of Object.entries(rawProgress || {})) {
    const target = aliases.get(key) || key;
    if (!cardProgress[target] || String(value.reviewedAt || '') > String(cardProgress[target].reviewedAt || '')) cardProgress[target] = value;
  }
  const logs = (Array.isArray(rawLogs) ? rawLogs : []).map((log) => ({ ...log, cardId: aliases.get(log.cardId) || log.cardId })).filter((log) => log.cardId);
  return { cardProgress, logs };
}

export function loadLocalProgress(userId = 'guest', storage = safeStorage(), cards = []) {
  if (!storage) return emptyProgress();
  const currentProgress = parse(storage.getItem(userStorageKey(STATE_KEY, userId)), {});
  const currentLogs = parse(storage.getItem(userStorageKey(LOG_KEY, userId)), []);
  // Migrate only a key scoped to this user. The old unscoped v1/v2 cache was
  // shared between accounts and must never be restored into a user session.
  const legacyProgress = currentProgress && Object.keys(currentProgress).length ? currentProgress : parse(storage.getItem(userStorageKey('chinese_card_progress_v2', userId)), {});
  const legacyLogs = currentLogs?.length ? currentLogs : parse(storage.getItem(userStorageKey('chinese_review_log_v2', userId)), []);
  return migrateProgressState(legacyProgress, legacyLogs, cards);
}

export function saveLocalProgress(state, userId = 'guest', storage = safeStorage(), cards = []) {
  if (!storage) return;
  const migrated = migrateProgressState(state.cardProgress, state.logs, cards);
  storage.setItem(userStorageKey(STATE_KEY, userId), JSON.stringify(migrated.cardProgress));
  storage.setItem(userStorageKey(LOG_KEY, userId), JSON.stringify(migrated.logs.slice(-2000)));
}

export function dateKey(date = new Date(), timeZone = 'Asia/Shanghai') {
  return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}

export function progressForRating(old, rating, now = Date.now()) {
  let repetitions = Number(old?.repetitions || 0);
  let easeFactor = Number(old?.easeFactor ?? old?.ease_factor ?? 2.5);
  let intervalDays = Number(old?.intervalDays ?? old?.interval_days ?? 0);
  if (rating === 'again') { repetitions = 0; intervalDays = 0; easeFactor = Math.max(1.3, easeFactor - .2); }
  else { repetitions += 1; easeFactor = Math.max(1.3, easeFactor + (rating === 'easy' ? .15 : rating === 'hard' ? -.15 : 0)); intervalDays = repetitions === 1 ? (rating === 'hard' ? 1 : rating === 'easy' ? 4 : 2) : Math.max(1, Math.round(intervalDays * easeFactor * (rating === 'hard' ? .75 : rating === 'easy' ? 1.3 : 1))); }
  const delay = rating === 'again' ? 10 * 60 * 1000 : intervalDays * 86400000;
  return { repetitions, easeFactor, intervalDays, dueAt: new Date(now + delay).toISOString(), reviewedAt: new Date(now).toISOString() };
}

export function logsForDate(logs = [], date = dateKey()) { return logs.filter((log) => log.date === date); }

export function moduleStats(logs = [], date = dateKey()) {
  const result = Object.fromEntries(['writing', 'recognition', 'vocab', 'garden'].map((module) => [module, { completed: 0, remembered: 0 }]));
  for (const log of logsForDate(logs, date)) {
    const module = result[log.category]; if (!module) continue;
    module.completed += 1;
    if (log.rating === 'good' || log.rating === 'easy') module.remembered += 1;
  }
  return result;
}

export function rollingDayCount(logs = [], days = 30, now = new Date()) {
  const result = [];
  for (let offset = 0; offset < days; offset += 1) result.push(dateKey(new Date(now.getTime() - offset * 86400000)));
  return result.map((date) => ({ date, count: logsForDate(logs, date).length }));
}
