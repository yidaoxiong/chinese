const text = (value) => value == null ? '' : String(value);

export const escapeHtml = (value) => text(value).replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[char]));

const lines = (value) => escapeHtml(value).replace(/\n/g, '<br />');

export function displaySource(card) {
  if (typeof card.source === 'string') return card.source;
  if (card.module === 'garden') return `${card.gardenSection || '语文园地'} · 第${card.textbookUnit}单元`;
  if (card.lessonNumber) return `第${card.lessonNumber}课`;
  return '五年级上册';
}

export function displayAnswer(answer) {
  if (typeof answer === 'string') return answer;
  if (!answer || typeof answer !== 'object') return text(answer);
  if (answer.fullText) return [answer.title, `[${answer.dynasty}] ${answer.author}`, answer.fullText, answer.explanation, ...(answer.keyWords || []).map(([word, meaning]) => `${word}：${meaning}`)].join('\n');
  if (answer.text && answer.meaning) return `${answer.text}\n词义：${answer.meaning}`;
  return Object.entries(answer).map(([key, value]) => `${key}：${typeof value === 'object' ? JSON.stringify(value) : value}`).join('\n');
}

function maskedRecognitionWord(card) {
  const word = card.group || card.groups?.[0] || '';
  const index = word.indexOf(card.char);
  if (index < 0) return `（${card.pinyin}）`;
  return `${word.slice(0, index)}（${card.pinyin}）${word.slice(index + card.char.length)}`;
}

export function questionForCard(card, { reverse = false } = {}) {
  if (card.module === 'writing') return {
    title: '写字表 · 看拼音写字',
    prompt: `生字拼音：${card.charPinyin}\n组词提示：${card.maskedWord}\n\n请在下方写出这个生字。`,
    answer: `生字：${card.char}\n拼音：${card.charPinyin}\n组词：${card.primaryWord}（${card.primaryWordPinyin}）\n词义：${card.primaryWordMeaning}\n另外的组词：\n${(card.additionalWords || []).map((word) => `${word.text}${word.pinyin ? `（${word.pinyin}）` : ''}：${word.meaning}`).join('\n')}`,
  };
  if (card.module === 'recognition') return {
    title: `识字表 · ${card.isReviewPronunciation ? '多音字复习' : '看拼音写字'}`,
    prompt: `生字拼音：${card.pinyin}\n组词提示：${maskedRecognitionWord(card)}\n\n请在下方写出这个生字。`,
    answer: `生字：${card.char}\n本课读音：${card.pinyin}\n组词与词义：\n${(card.groups || []).map((word, index) => `${word}${card.meanings?.[index] ? `：${card.meanings[index]}` : ''}`).join('\n')}${card.isReviewPronunciation ? '\n（本题是识字表中的复习/多音字条目。）' : ''}`,
  };
  if (card.module === 'vocab') return {
    title: '词语表 · 拼音写词',
    prompt: `词语拼音：${card.pinyin}\n\n请在下方写出对应的汉字词语。`,
    answer: `词语：${card.word}\n拼音：${card.pinyin}${card.meaning ? `\n词义：${card.meaning}` : ''}`,
  };
  if (card.module === 'garden') {
    const answer = card.answer;
    if (card.subtype === 'poem') return { title: `语文园地 · 古诗词 · ${answer.title}`, prompt: card.stimulus, answer: displayAnswer(answer) };
    if (card.subtype === 'quote') return { title: `语文园地 · 名人名言 · ${card.topic}`, prompt: card.stimulus, answer: text(answer) };
    if (card.subtype === 'literacy' && reverse) return { title: `语文园地 · 识字加油站 · ${card.topic}`, prompt: `词义提示：${answer.meaning}\n\n请说出这个${card.isIdiom === false ? '词语' : '成语'}。`, answer: `${answer.text}\n拼音：${card.pinyin}\n词义：${answer.meaning}` };
    if (card.subtype === 'literacy') return { title: `语文园地 · 识字加油站 · ${card.topic}`, prompt: card.stimulus, answer: `${answer.text}\n拼音：${card.pinyin}\n词义：${answer.meaning}` };
    if (card.subtype === 'accum_word') return { title: `语文园地 · 日积月累 · ${card.topic}`, prompt: card.stimulus, answer: `${answer.text}\n拼音：${card.pinyin}\n词义：${answer.meaning}` };
    return { title: `语文园地 · 词句段运用 · ${card.topic}`, prompt: card.stimulus, answer: `${answer.text}\n${answer.meaning}` };
  }
  return { title: card.title || '语文练习', prompt: card.prompt || '', answer: card.answer || '' };
}

function wordRow(word, meaning = '', pinyin = '') {
  return `<div class="answer-word-row"><strong class="answer-word">${escapeHtml(word)}</strong><span>${pinyin ? `<em>${escapeHtml(pinyin)}</em>` : ''}${meaning ? escapeHtml(meaning) : ''}</span></div>`;
}

export function answerHtmlForCard(card, { reverse = false } = {}) {
  if (card.module === 'writing') {
    const additional = (card.additionalWords || []).map((word) => wordRow(word.text, word.meaning, word.pinyin)).join('');
    return `<div class="answer-focus character-focus" aria-label="目标生字">${escapeHtml(card.char)}</div><dl class="answer-facts"><div><dt>拼音</dt><dd>${escapeHtml(card.charPinyin)}</dd></div><div><dt>组词</dt><dd><strong class="answer-word answer-word-primary">${escapeHtml(card.primaryWord)}</strong>${card.primaryWordPinyin ? ` <small>${escapeHtml(card.primaryWordPinyin)}</small>` : ''}</dd></div><div><dt>词义</dt><dd>${escapeHtml(card.primaryWordMeaning)}</dd></div></dl><h3 class="answer-section-title">更多组词</h3><div class="answer-words">${additional}</div>`;
  }
  if (card.module === 'recognition') {
    const groups = (card.groups || []).map((word, index) => wordRow(word, card.meanings?.[index] || '')).join('');
    return `<div class="answer-focus character-focus" aria-label="目标生字">${escapeHtml(card.char)}</div><dl class="answer-facts"><div><dt>本课读音</dt><dd>${escapeHtml(card.pinyin)}</dd></div></dl><h3 class="answer-section-title">三个组词</h3><div class="answer-words">${groups}</div>${card.isReviewPronunciation ? '<p class="answer-note">本题是识字表中的复习／多音字条目。</p>' : ''}`;
  }
  if (card.module === 'vocab') return `<div class="answer-focus word-focus" aria-label="目标词语">${escapeHtml(card.word)}</div><dl class="answer-facts"><div><dt>拼音</dt><dd>${escapeHtml(card.pinyin)}</dd></div>${card.meaning ? `<div><dt>词义</dt><dd>${escapeHtml(card.meaning)}</dd></div>` : ''}</dl>`;
  if (card.module === 'garden' && card.subtype === 'poem') {
    const answer = card.answer || {};
    const keyWords = (answer.keyWords || []).map(([word, meaning]) => wordRow(word, meaning)).join('');
    return `<div class="poem-focus"><h3>${escapeHtml(answer.title)}</h3><p class="poem-author">${escapeHtml(answer.dynasty ? `[${answer.dynasty}] ` : '')}${escapeHtml(answer.author)}</p><div class="poem-original">${lines(answer.fullText)}</div></div>${answer.explanation ? `<section class="answer-explanation"><h3>诗意</h3><p>${lines(answer.explanation)}</p></section>` : ''}${keyWords ? `<h3 class="answer-section-title">重点词语</h3><div class="answer-words">${keyWords}</div>` : ''}`;
  }
  if (card.module === 'garden') {
    const answer = card.answer;
    if (answer && typeof answer === 'object' && answer.text) return `<div class="answer-focus word-focus">${escapeHtml(answer.text)}</div>${card.pinyin ? `<p class="answer-pinyin">${escapeHtml(card.pinyin)}</p>` : ''}${answer.meaning ? `<p class="answer-meaning">${escapeHtml(answer.meaning)}</p>` : ''}`;
  }
  return `<div class="answer-plain">${lines(questionForCard(card, { reverse }).answer)}</div>`;
}

export function cardMeta(card) {
  return { module: card.module, topic: card.topic || '', unit: card.textbookUnit, source: displaySource(card), subtype: card.subtype || '' };
}
