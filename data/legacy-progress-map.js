import { gardenItems } from './gardens.js';
import { recognitionItems } from './recognition.js';
import { vocabItems } from './vocab.js';
import { writingItems } from './writing.js';

export const currentCards = [...writingItems, ...recognitionItems, ...vocabItems, ...gardenItems];
export const legacyProgressMap = new Map();

for (const card of currentCards) {
  for (const alias of [card.id, card.progressKey, ...(card.legacyIds || [])]) {
    if (alias && !legacyProgressMap.has(alias)) legacyProgressMap.set(alias, card.id);
  }
}

export function currentCardId(value) {
  return legacyProgressMap.get(value) || value;
}

export function migrateProgressEntries(entries = {}) {
  return Object.fromEntries(Object.entries(entries).map(([key, value]) => [currentCardId(key), value]));
}
