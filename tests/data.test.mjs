import assert from 'node:assert/strict';
import { textbookUnits, gardenUnits, contentVersion } from '../data/catalog.js';
import { writingItems, writingStats } from '../data/writing.js';
import { recognitionItems, recognitionStats, recognitionAudit } from '../data/recognition.js';
import { vocabItems, vocabStats } from '../data/vocab.js';
import { gardenItems } from '../data/gardens.js';

assert.equal(contentVersion, '2026-fall-v1');
assert.equal(textbookUnits.flatMap((unit) => unit.lessons).length, 25);
assert.deepEqual(gardenUnits, [1, 2, 3, 4, 6, 7, 8]);
assert.equal(writingStats.lessonEntries, 221);
assert.equal(writingStats.uniqueCharacters, 220);
assert.equal(writingItems.filter((item) => item.char === '哀').length, 2);
assert.ok(writingItems.every((item) => item.additionalWords.length >= 3 && item.additionalWords.length <= 5));
assert.equal(vocabStats.formalWords, 248);
assert.ok(vocabItems.every((item) => /[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/u.test(item.pinyin)));
assert.equal(recognitionStats.totalPractice, recognitionItems.length);
assert.equal(recognitionStats.reviewPronunciations, 9);
assert.equal(recognitionStats.pdfDeclaredNewCharacters, 200);
assert.equal(recognitionAudit.tableRows, 218);
assert.equal(recognitionAudit.blackRows, 209);
assert.deepEqual(recognitionAudit.duplicateBlackCharacters, ['泣', '咧']);
assert.equal(recognitionAudit.unexplainedDeclaredGap, 7);
assert.equal(new Set(recognitionItems.filter((item) => !item.isReviewPronunciation).map((item) => item.char)).size, recognitionStats.newCharacters);
assert.ok(recognitionItems.every((item) => item.groups.length === 3 && item.meanings.length === 3));
assert.ok(gardenItems.length > 0 && gardenItems.every((item) => item.topic && item.textbookUnit && item.gardenSection && item.subtype && item.stimulus && item.expectedResponse && item.answer));
assert.ok(gardenItems.some((item) => item.answer?.text === '如鱼得水'));
assert.ok(!gardenItems.some((item) => item.answer?.text === '鱼跃龙门'));
for (const item of gardenItems.filter((entry) => entry.subtype === 'poem')) {
  assert.ok(item.answer.fullText && item.answer.dynasty && item.answer.author && item.answer.explanation && item.answer.keyWords.length);
}
console.log('data.test: ok', { writing: writingItems.length, recognition: recognitionItems.length, vocab: vocabItems.length, garden: gardenItems.length });
