const text = (value) => value == null ? '' : String(value);

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

export function questionForCard(card, { reverse = false } = {}) {
  if (card.module === 'writing') return {
    title: '写字表 · 看拼音写字',
    prompt: `生字拼音：${card.charPinyin}\n组词提示：${card.maskedWord}\n\n请写出这个生字。`,
    answer: `生字：${card.char}\n拼音：${card.charPinyin}\n组词：${card.primaryWord}（${card.primaryWordPinyin}）\n词义：${card.primaryWordMeaning}\n另外的组词：\n${(card.additionalWords || []).map((word) => `${word.text}${word.pinyin ? `（${word.pinyin}）` : ''}：${word.meaning}`).join('\n')}\n\n${card.rewriteInstruction}`,
  };
  if (card.module === 'recognition') return {
    title: `识字表 · ${card.isReviewPronunciation ? '多音字复习' : '生字认读'}`,
    prompt: `生字：${card.char}\n请写出拼音，并用它组词。`,
    answer: `生字：${card.char}\n本课读音：${card.pinyin}\n组词与词义：\n${(card.groups || []).map((word, index) => `${word}${card.meanings?.[index] ? `：${card.meanings[index]}` : ''}`).join('\n')}${card.isReviewPronunciation ? '\n（本题是识字表中的复习/多音字条目。）' : ''}`,
  };
  if (card.module === 'vocab') return {
    title: '词语表 · 拼音写词',
    prompt: `词语拼音：${card.pinyin}\n\n请写出对应的汉字词语。`,
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

export function cardMeta(card) {
  return { module: card.module, topic: card.topic || '', unit: card.textbookUnit, source: displaySource(card), subtype: card.subtype || '' };
}
