import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { HandwritingController } from '../js/handwriting.js';
import { answerHtmlForCard, escapeHtml, questionForCard } from '../js/card-renderer.js';
import { canRateCard, canRevealAnswer, categoryLabel, needsFirstHandwriting, needsSecondHandwriting } from '../js/practice-policy.js';

assert.equal(typeof HandwritingController, 'function');
const listeners = new Map();
let canvasRect = { left: 0, top: 0, width: 400, height: 200 };
const context = { setTransform() {}, save() {}, restore() {}, beginPath() {}, moveTo() {}, lineTo() {}, stroke() {}, clearRect() {} };
const canvas = { style: {}, width: 0, height: 0, getContext: () => context, getBoundingClientRect: () => canvasRect, addEventListener: (name, listener) => listeners.set(name, listener), setPointerCapture() {} };
const controls = new Map();
for (const name of ['undo', 'clear', 'eraser', 'done']) controls.set(name, { classList: { toggle() {} }, addEventListener() {} });
const fakeRoot = { querySelector(selector) { if (selector === 'canvas') return canvas; return controls.get(selector.match(/data-handwriting-(\w+)/u)?.[1]) || null; } };
globalThis.window = { devicePixelRatio: 2, addEventListener() {} };
globalThis.ResizeObserver = class { observe() {} };
let doneResult = null;
const controller = new HandwritingController(fakeRoot, { onDone: (result) => { doneResult = result; } });
const pointer = (x, y) => ({ clientX: x, clientY: y, pointerId: 1, pressure: .5, preventDefault() {} });
controller.start(pointer(20, 20)); controller.move(pointer(120, 80)); controller.end(pointer(120, 80)); controller.done();
assert.equal(doneResult.strokes, true);
assert.equal(controller.strokes[0][1].x, 120);
canvasRect = { left: 0, top: 0, width: 200, height: 100 };
controller.resize();
assert.equal(controller.strokes[0][1].x, 60);
controller.clear();
assert.equal(controller.hasStroke(), false);
const writing = { module: 'writing', charPinyin: 'xīn', maskedWord: '（xīn）赏', char: '欣', primaryWord: '欣赏', primaryWordPinyin: 'xīn shǎng', primaryWordMeaning: '喜欢并领略美好事物。', additionalWords: [{ text: '欣喜', pinyin: 'xīn xǐ', meaning: '欢喜。' }] };
assert.match(questionForCard(writing).prompt, /（xīn）赏/u);
assert.match(answerHtmlForCard(writing), /answer-focus character-focus/u);
assert.match(answerHtmlForCard(writing), /answer-word/u);
assert.match(answerHtmlForCard(writing), /answer-word-primary/u);

const recognition = { module: 'recognition', char: '蓑', pinyin: 'suō', group: '蓑衣', groups: ['蓑衣', '雨蓑', '蓑草'], meanings: ['防雨衣物。', '蓑衣。', '一种草。'] };
assert.match(questionForCard(recognition).prompt, /（suō）衣/u);
assert.match(answerHtmlForCard(recognition), /三个组词/u);
assert.equal(categoryLabel(recognition), '识字表');

const vocab = { module: 'vocab', word: '欣赏', pinyin: 'xīn shǎng', meaning: '喜欢并领略。' };
assert.equal(needsFirstHandwriting(vocab), true);
assert.equal(needsSecondHandwriting(vocab), false);
assert.equal(canRevealAnswer(vocab, {}), false);
assert.equal(canRevealAnswer(vocab, { firstWritingDone: true }), true);
assert.equal(canRateCard(vocab, { answerRevealed: true }), true);
assert.equal(needsSecondHandwriting(writing), true);
assert.equal(needsSecondHandwriting(recognition), true);
assert.equal(canRateCard(writing, { answerRevealed: true }), false);
assert.equal(canRateCard(writing, { answerRevealed: true, secondWritingDone: true }), true);

const poem = { module: 'garden', subtype: 'poem', answer: { title: '示例诗', dynasty: '唐', author: '作者', fullText: '第一句\n第二句', explanation: '诗意。', keyWords: [['重点', '解释。']] } };
const poemHtml = answerHtmlForCard(poem);
assert.match(poemHtml, /poem-focus/u);
assert.match(poemHtml, /poem-original/u);
assert.match(poemHtml, /第一句<br \/>第二句/u);
assert.equal(escapeHtml('<img onerror="x">'), '&lt;img onerror=&quot;x&quot;&gt;');

const [appSource, htmlSource, handwritingSource, cssSource] = await Promise.all([
  fs.readFile(new URL('../app.js', import.meta.url), 'utf8'),
  fs.readFile(new URL('../index.html', import.meta.url), 'utf8'),
  fs.readFile(new URL('../js/handwriting.js', import.meta.url), 'utf8'),
  fs.readFile(new URL('../styles.css', import.meta.url), 'utf8'),
]);
assert.match(htmlSource, /id="firstHandwritingCanvas"/u);
assert.match(htmlSource, /id="secondHandwritingCanvas"/u);
assert.doesNotMatch(htmlSource, /handwritingOverlay|secondWritingInput|键盘复写/u);
assert.doesNotMatch(handwritingSource, /requestFullscreen|exitFullscreen|handwriting-open/u);
assert.match(appSource, /state\.firstHandwriting\.clear\(\)/u);
assert.match(appSource, /answerText'\)\.innerHTML = answerHtmlForCard/u);
assert.match(appSource, /event\.code !== 'Space'/u);
assert.match(appSource, /state\.reverseGarden = event\.target\.checked/u);
const ids = [...htmlSource.matchAll(/\sid="([^"]+)"/gu)].map((match) => match[1]);
assert.equal(new Set(ids).size, ids.length, 'HTML ids must be unique');
assert.match(cssSource, /@media \(max-width: 480px\)[\s\S]*\.module-cards, \.dashboard \{ grid-template-columns: minmax\(0, 1fr\); \}/u);
assert.match(cssSource, /\.shell \{ width: calc\(100% - 22px\); max-width: 600px;/u);
assert.doesNotMatch(cssSource, /overflow-x:\s*hidden/u);
console.log('keyboard-handwriting.test: ok');
