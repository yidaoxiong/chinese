import assert from 'node:assert/strict';
import { arrangeCards, buildSession, isDue, sessionQuestionCount } from '../js/session.js';
import { MODULES, cardsInSelection, categoriesForModule, combineModuleStats } from '../js/selection.js';

const cards = Array.from({ length: 25 }, (_, index) => ({ id: `card-${index + 1}`, module: 'writing', textbookUnit: 1, lessonNumber: index < 10 ? 1 : 2 }));
assert.equal(sessionQuestionCount(cards.slice(0, 1)), 1);
assert.equal(sessionQuestionCount(cards.slice(0, 2)), 2);
assert.equal(sessionQuestionCount(cards.slice(0, 19)), 19);
assert.equal(sessionQuestionCount([]), 0);
assert.equal(cardsInSelection(cards, 'writing', { units: new Set([1]), lessons: new Set() }).length, 25);
assert.equal(cardsInSelection(cards, 'writing', { units: new Set(), lessons: new Set([1]) }).length, 10);
const mixedCards = [cards[0], { id: 'recognition-1', module: 'recognition', textbookUnit: 1, lessonNumber: 1 }, { id: 'vocab-1', module: 'vocab', textbookUnit: 1, lessonNumber: 1 }];
assert.deepEqual(MODULES.map((module) => module.id), ['characters', 'vocab', 'garden']);
assert.deepEqual(categoriesForModule('characters'), ['writing', 'recognition']);
assert.deepEqual(cardsInSelection(mixedCards, 'characters', { units: new Set([1]), lessons: new Set() }).map((card) => card.id), ['card-1', 'recognition-1']);
assert.deepEqual(combineModuleStats({ writing: { completed: 3, remembered: 2 }, recognition: { completed: 4, remembered: 1 } }).characters, { completed: 7, remembered: 3 });
assert.deepEqual(arrangeCards([
  { id: 'r2', module: 'recognition', textbookUnit: 1, lessonNumber: 2 },
  { id: 'r1', module: 'recognition', textbookUnit: 1, lessonNumber: 1 },
  { id: 'w1', module: 'writing', textbookUnit: 1, lessonNumber: 1 },
], 'sequential').map((card) => card.id), ['w1', 'r1', 'r2']);
const due = { repetitions: 1, dueAt: new Date(Date.now() - 1000).toISOString() };
const future = { repetitions: 1, dueAt: new Date(Date.now() + 86400000).toISOString() };
assert.equal(isDue(cards[0], { [cards[0].id]: due }), true);
assert.equal(isDue(cards[1], { [cards[1].id]: future }), false);
const session = buildSession({ candidates: cards, progress: { [cards[0].id]: future }, target: 20, order: 'sequential', usedTodayIds: new Set([cards[1].id]) });
assert.equal(session.cards.length, 20);
assert.equal(new Set(session.cards.map((card) => card.id)).size, 20);
assert.ok(session.cards.every((card) => card.id !== cards[1].id));
assert.equal(session.cards[0].id, cards[2].id);
const exhausted = buildSession({ candidates: cards.slice(0, 2), usedTodayIds: new Set(cards.slice(0, 2).map((card) => card.id)), target: 20 });
assert.equal(exhausted.cards.length, 0);
console.log('session.test: ok');
