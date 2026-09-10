const FIRST_HANDWRITING = new Set(['writing', 'recognition', 'vocab']);
const SECOND_HANDWRITING = new Set(['writing', 'recognition']);

export function needsFirstHandwriting(card) {
  return FIRST_HANDWRITING.has(card?.module);
}

export function needsSecondHandwriting(card) {
  return SECOND_HANDWRITING.has(card?.module);
}

export function canRevealAnswer(card, session = {}) {
  return !needsFirstHandwriting(card) || Boolean(session.firstWritingDone);
}

export function canRateCard(card, session = {}) {
  return Boolean(session.answerRevealed) && (!needsSecondHandwriting(card) || Boolean(session.secondWritingDone));
}

export function categoryLabel(card) {
  return ({ writing: '写字表', recognition: '识字表', vocab: '词语表', garden: '语文园地' })[card?.module] || card?.module || '模块';
}
