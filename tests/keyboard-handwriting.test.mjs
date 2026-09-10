import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { HandwritingController } from '../js/handwriting.js';

assert.equal(typeof HandwritingController, 'function');
assert.match((await import('../js/card-renderer.js')).questionForCard({ module: 'writing', charPinyin: 'xīn', maskedWord: '（xīn）赏', char: '欣', primaryWord: '欣赏', primaryWordPinyin: 'xīn shǎng', primaryWordMeaning: '喜欢并领略美好事物。', additionalWords: [], rewriteInstruction: '请再次书写。' }).prompt, /xīn/u);
assert.match((await import('../js/card-renderer.js')).questionForCard({ module: 'garden', subtype: 'literacy', topic: '地域简称', stimulus: 'xiāng cài', answer: { text: '湘菜', meaning: '湖南风味菜肴。' }, pinyin: 'xiāng cài', isIdiom: false }, { reverse: true }).prompt, /湖南风味/u);
const appSource = await fs.readFile(new URL('../app.js', import.meta.url), 'utf8');
assert.match(appSource, /第一次书写：根据题面提示写出生字/u);
assert.doesNotMatch(appSource, /phase === 'first' \? `第一次书写：\$\{state\.session\.card\.char\}`/u);
assert.match(appSource, /state\.reverseGarden = event\.target\.checked/u);
assert.match(appSource, /event\.target\.value\.trim\(\) === state\.session\.card\.char/u);
assert.doesNotMatch(appSource, /writingSecondExplicit/u);
console.log('keyboard-handwriting.test: ok');
