import assert from 'node:assert/strict';
import { textbookUnits, gardenUnits, contentVersion, unitForLesson } from '../data/catalog.js';
import { writingItems, writingStats } from '../data/writing.js';
import { recognitionItems, recognitionStats, recognitionAudit } from '../data/recognition.js';
import { vocabItems, vocabStats } from '../data/vocab.js';
import { gardenItems } from '../data/gardens.js';
import { SOURCE_RECOGNITION_ROWS, SOURCE_WRITING_ROWS, SOURCE_VOCAB_ROWS } from '../data/source-tables.js';

const flatten = (rows) => rows.flatMap(([lesson, entries]) => entries.map(([text, pinyin]) => [lesson, text, pinyin]));
const assertUniqueIds = (items, label) => assert.equal(new Set(items.map((item) => item.id)).size, items.length, `${label} IDs must be unique`);
const placeholder = /课文中读到了|结合所在课文语境理解|试着用它说一句完整的话/;

assert.equal(contentVersion, '2026-fall-v2');
assert.equal(textbookUnits.flatMap((unit) => unit.lessons).length, 25);
assert.deepEqual(gardenUnits, [1, 2, 3, 4, 6, 7, 8]);

assert.equal(writingStats.lessonEntries, 220);
assert.equal(writingStats.uniqueCharacters, 220);
assert.equal(vocabStats.formalWords, 213);
assert.equal(recognitionStats.totalPractice, 209);

// Exact attachment inventory: no added cards and no missing cards.
assert.deepEqual(writingItems.map((item) => [item.lesson, item.char, item.pinyin]), flatten(SOURCE_WRITING_ROWS));
assert.deepEqual(recognitionItems.map((item) => [item.lesson, item.char, item.pinyin]), flatten(SOURCE_RECOGNITION_ROWS));
assert.deepEqual(vocabItems.map((item) => [item.lesson, item.word, item.pinyin]), flatten(SOURCE_VOCAB_ROWS));

for (const item of [...writingItems, ...recognitionItems, ...vocabItems]) {
  assert.equal(item.textbookUnit, unitForLesson(item.lesson), `${item.lesson} must stay in its catalog unit`);
}

assert.ok(writingItems.every((item) => item.primaryWord && item.primaryWordPinyin && item.primaryWordMeaning && item.charMeaning));
assert.ok(writingItems.every((item) => item.additionalWords.length <= 5));
assert.ok(writingItems.every((item) => item.additionalWords.every((word) => word.text && word.meaning && !placeholder.test(word.meaning))));
assert.ok(writingItems.every((item) => !placeholder.test(item.primaryWordMeaning) && !placeholder.test(item.charMeaning)));
assert.ok(writingItems.every((item) => item.primaryWord.length <= 1 || item.primaryWordPinyin.trim().split(/\s+/).length >= item.primaryWord.length));

assert.equal(recognitionStats.reviewPronunciations, 9);
assert.equal(recognitionStats.pdfDeclaredNewCharacters, 200);
assert.equal(recognitionAudit.tableRows, 209);
assert.equal(recognitionAudit.blackRows, 200);
assert.equal(recognitionAudit.distinctBlackCharacters, 200);
assert.deepEqual(recognitionAudit.duplicateBlackCharacters, []);
assert.equal(recognitionAudit.unexplainedDeclaredGap, 0);
assert.equal(new Set(recognitionItems.filter((item) => !item.isReviewPronunciation).map((item) => item.char)).size, recognitionStats.newCharacters);
assert.ok(recognitionItems.every((item) => item.groups.length >= 1 && item.groups.length <= 3));
assert.ok(recognitionItems.every((item) => item.meanings.length === item.groups.length && item.meanings.every((meaning) => meaning && !placeholder.test(meaning))));

assert.ok(vocabItems.every((item) => item.meaning && !placeholder.test(item.meaning)));
assert.ok(vocabItems.every((item) => /[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/u.test(item.pinyin)));

assertUniqueIds(writingItems, 'writing');
assertUniqueIds(recognitionItems, 'recognition');
assertUniqueIds(vocabItems, 'vocabulary');

// Garden content is tested independently and remains outside this source replacement.
assert.ok(gardenItems.length > 0 && gardenItems.every((item) => item.topic && item.textbookUnit && item.gardenSection && item.subtype && item.stimulus && item.expectedResponse && item.answer));
assert.ok(gardenItems.some((item) => item.answer?.text === '如鱼得水'));
assert.ok(!gardenItems.some((item) => item.answer?.text === '鱼跃龙门'));
for (const item of gardenItems.filter((entry) => entry.subtype === 'poem')) {
  assert.ok(item.answer.fullText && item.answer.dynasty && item.answer.author && item.answer.explanation && item.answer.keyWords.length);
}

console.log('data.test: ok', { writing: writingItems.length, recognition: recognitionItems.length, vocab: vocabItems.length, garden: gardenItems.length });
