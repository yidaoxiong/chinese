import assert from 'node:assert/strict';
import { loadLocalProgress, migrateProgressState, moduleStats, progressForRating, userStorageKey, STATE_KEY } from '../js/progress.js';

const storage = new Map([
  [userStorageKey('chinese_card_progress_v2', 'alex'), JSON.stringify({ old: { repetitions: 2, reviewedAt: '2026-09-01T00:00:00Z' } })],
  [userStorageKey('chinese_review_log_v2', 'alex'), JSON.stringify([{ cardId: 'old', category: 'writing', date: '2026-09-01', rating: 'good' }])],
  ['chinese_card_progress_v2', JSON.stringify({ shared: { repetitions: 99 } })],
]);
storage.getItem = storage.get.bind(storage); storage.setItem = storage.set.bind(storage);
const cards = [{ id: 'stable', progressKey: 'stable', legacyIds: ['old'] }];
const local = loadLocalProgress('alex', storage, cards);
assert.deepEqual(local.cardProgress.stable, { repetitions: 2, reviewedAt: '2026-09-01T00:00:00Z' });
assert.equal(local.logs[0].cardId, 'stable');
assert.deepEqual(loadLocalProgress('new-user', storage, cards), { cardProgress: {}, logs: [] });
assert.equal(userStorageKey(STATE_KEY, 'alex'), `chinese_card_progress_v3_alex`);
const next = progressForRating(null, 'good', Date.parse('2026-09-09T00:00:00Z'));
assert.equal(next.repetitions, 1);
assert.ok(next.dueAt);
const stats = moduleStats([{ category: 'writing', date: '2026-09-09', rating: 'good' }, { category: 'garden', date: '2026-09-09', rating: 'again' }], '2026-09-09');
assert.deepEqual(stats.writing, { completed: 1, remembered: 1 });
assert.deepEqual(stats.garden, { completed: 1, remembered: 0 });
const migrated = migrateProgressState({ old: { repetitions: 1 } }, [{ cardId: 'old', category: 'writing', date: '2026-09-01' }], cards);
assert.ok(migrated.cardProgress.stable);
assert.equal(migrated.logs[0].cardId, 'stable');
console.log('progress.test: ok');
