/** Pure session helpers.  Keeping this logic independent from the DOM makes the
 * “no duplicate / no cross-range” rules easy to test and keeps extra practice
 * from accidentally changing the normal daily queue. */

export const DAILY_TARGET = 20;

export function isDue(card, progress = {}, now = Date.now()) {
  const item = progress[card.id] || progress[card.progressKey] || null;
  if (!item?.dueAt) return true;
  const due = Date.parse(item.dueAt);
  return !Number.isFinite(due) || due <= now;
}

export function shuffle(list, random = Math.random) {
  const result = [...list];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const next = Math.floor(random() * (index + 1));
    [result[index], result[next]] = [result[next], result[index]];
  }
  return result;
}

export function arrangeCards(list, order = 'random', random = Math.random) {
  return order === 'sequential' ? [...list] : shuffle(list, random);
}

function cardKey(card) { return card.id || card.progressKey; }

/**
 * Build one module queue. `candidates` must already represent the selected
 * unit/lesson range. A Set of IDs used in this app session is accepted so the
 * “再练一轮” button cannot repeat today’s cards until the range is exhausted.
 */
export function buildSession({
  candidates = [], progress = {}, usedTodayIds = new Set(), target = DAILY_TARGET,
  order = 'random', now = Date.now(), random = Math.random, isExtra = false,
} = {}) {
  const available = [];
  const seen = new Set();
  for (const card of candidates) {
    const key = cardKey(card);
    if (!key || seen.has(key) || usedTodayIds.has(key)) continue;
    seen.add(key);
    available.push(card);
  }
  const due = arrangeCards(available.filter((card) => isDue(card, progress, now)), order, random);
  const fresh = arrangeCards(available.filter((card) => !isDue(card, progress, now)), order, random);
  const cards = [...due, ...fresh].slice(0, Math.max(0, Number(target) || 0));
  return {
    cards,
    index: 0,
    startedAt: now,
    isExtra: Boolean(isExtra),
    target: Math.min(Math.max(0, Number(target) || 0), available.length),
    availableCount: available.length,
  };
}

export function sessionQuestionCount(candidates, target = DAILY_TARGET) {
  return Math.min(Math.max(0, Number(target) || 0), candidates.length);
}

export function hasMorePractice(candidates = [], usedTodayIds = new Set()) {
  return candidates.some((card) => !usedTodayIds.has(cardKey(card)));
}
