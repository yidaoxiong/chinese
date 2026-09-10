import { gardenUnits, textbookUnits } from '../data/catalog.js';

export const MODULES = [
  { id: 'writing', label: '写字表', description: '看拼音、组词并练习书写' },
  { id: 'recognition', label: '识字表', description: '认读生字、拼音和组词' },
  { id: 'vocab', label: '词语表', description: '根据拼音写词语' },
  { id: 'garden', label: '语文园地', description: '日积月累与词句段运用' },
];

export function emptySelection() {
  return { units: new Set(), lessons: new Set() };
}

export function normalizeSelection(selection = {}) {
  const units = new Set([...selection.units || []].map(Number).filter((number) => number >= 1 && number <= 8));
  const lessons = new Set([...selection.lessons || []].map(Number).filter((number) => number >= 1 && number <= 25));
  return { units, lessons };
}

export function selectedUnitNumbers(selection) {
  return [...normalizeSelection(selection).units].sort((a, b) => a - b);
}

export function selectedLessonNumbers(selection) {
  return [...normalizeSelection(selection).lessons].sort((a, b) => a - b);
}

function cardMatchesModule(card, module) {
  return card.module === module;
}

/** Unit selection includes every lesson in that unit. A checked lesson can be
 * mixed with checked units; a Set avoids duplicate cards. Garden cards are
 * selected by their garden/unit number because they are not lesson rows. */
export function cardInSelection(card, selection = {}, module = card.module) {
  if (!cardMatchesModule(card, module)) return false;
  const normalized = normalizeSelection(selection);
  const unit = Number(card.textbookUnit);
  if (normalized.units.has(unit)) return true;
  if (module === 'garden' && normalized.lessons.has(unit)) return true;
  const lesson = Number(card.lessonNumber);
  return Number.isFinite(lesson) && normalized.lessons.has(lesson);
}

export function cardsInSelection(cards = [], module, selection = {}) {
  const ids = new Set();
  return cards.filter((card) => {
    if (!cardInSelection(card, selection, module) || ids.has(card.id)) return false;
    ids.add(card.id);
    return true;
  });
}

export function selectionFromNumbers({ units = [], lessons = [] } = {}) {
  return normalizeSelection({ units: new Set(units), lessons: new Set(lessons) });
}

export function unitIsChecked(unitNumber, selection = {}) {
  return normalizeSelection(selection).units.has(Number(unitNumber));
}

export function lessonIsChecked(lessonNumber, selection = {}) {
  const normalized = normalizeSelection(selection);
  return normalized.units.has(Number(textbookUnits.find((unit) => unit.lessons.some((lesson) => lesson.number === Number(lessonNumber)))?.number))
    || normalized.lessons.has(Number(lessonNumber));
}

export function unitLessonNumbers(unitNumber) {
  return textbookUnits.find((unit) => unit.number === Number(unitNumber))?.lessons.map((lesson) => lesson.number) || [];
}

export function selectableUnits(module) {
  if (module === 'garden') return gardenUnits;
  return textbookUnits.map((unit) => unit.number);
}

export function selectionLabel(selection = {}, module = '') {
  const normalized = normalizeSelection(selection);
  const units = selectedUnitNumbers(normalized);
  const lessons = selectedLessonNumbers(normalized);
  if (!units.length && !lessons.length) return '未选择范围';
  if (module === 'garden') return units.length ? units.map((unit) => `第${unit}单元园地`).join('、') : lessons.map((unit) => `第${unit}单元园地`).join('、');
  const unitLabel = units.length ? `第${units.join('、')}单元` : '';
  const lessonLabel = lessons.length ? `第${lessons.join('、')}课` : '';
  return [unitLabel, lessonLabel].filter(Boolean).join('、');
}
