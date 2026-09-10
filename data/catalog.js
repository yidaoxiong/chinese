/**
 * 五年级上册教材目录。题库的筛选范围以这里的教材单元/课文为准，
 * 不把“第几条数组元素”当作内容身份。
 */
export const contentVersion = '2026-fall-v2';

export const textbookUnits = [
  { id: 'u1', number: 1, title: '第一单元', lessons: [
    { id: 'l01', number: 1, title: '桂花雨' },
    { id: 'l02', number: 2, title: '落花生' },
    { id: 'l03', number: 3, title: '珍珠鸟' },
  ], garden: 'g1' },
  { id: 'u2', number: 2, title: '第二单元', lessons: [
    { id: 'l04', number: 4, title: '冀中的地道战' },
    { id: 'l05', number: 5, title: '将相和' },
    { id: 'l06', number: 6, title: '什么比猎豹的速度更快' },
    { id: 'l07', number: 7, title: '“诺曼底号”遇难记' },
  ], garden: 'g2' },
  { id: 'u3', number: 3, title: '第三单元', lessons: [
    { id: 'l08', number: 8, title: '猎人海力布' },
    { id: 'l09', number: 9, title: '牛郎织女（一）' },
    { id: 'l10', number: 10, title: '牛郎织女（二）' },
  ], garden: 'g3' },
  { id: 'u4', number: 4, title: '第四单元', lessons: [
    { id: 'l11', number: 11, title: '古诗三首' },
    { id: 'l12', number: 12, title: '少年中国说（节选）' },
    { id: 'l13', number: 13, title: '圆明园的毁灭' },
    { id: 'l14', number: 14, title: '梅兰芳蓄须明志' },
  ], garden: 'g4' },
  { id: 'u5', number: 5, title: '第五单元', lessons: [
    { id: 'l15', number: 15, title: '太阳' },
    { id: 'l16', number: 16, title: '金字塔' },
  ], garden: null },
  { id: 'u6', number: 6, title: '第六单元', lessons: [
    { id: 'l17', number: 17, title: '慈母情深' },
    { id: 'l18', number: 18, title: '父爱之舟' },
    { id: 'l19', number: 19, title: '航天员写给孩子的信' },
  ], garden: 'g6' },
  { id: 'u7', number: 7, title: '第七单元', lessons: [
    { id: 'l20', number: 20, title: '古诗三首' },
    { id: 'l21', number: 21, title: '第一场雪' },
    { id: 'l22', number: 22, title: '白鹭' },
  ], garden: 'g7' },
  { id: 'u8', number: 8, title: '第八单元', lessons: [
    { id: 'l23', number: 23, title: '古人谈读书' },
    { id: 'l24', number: 24, title: '忆读书' },
    { id: 'l25', number: 25, title: '走遍天下书为侣' },
  ], garden: 'g8' },
];

export const gardenUnits = [1, 2, 3, 4, 6, 7, 8];

const unitByNumber = new Map(textbookUnits.map((unit) => [unit.number, unit]));
const lessonByNumber = new Map(textbookUnits.flatMap((unit) => unit.lessons.map((lesson) => [lesson.number, { ...lesson, unit: unit.number }])));

export function normalizeLessonNumber(value) {
  const match = String(value ?? '').match(/(?:第\s*)?(\d+)\s*课/);
  return match ? Number(match[1]) : null;
}

export function unitForLesson(value) {
  const lessonNumber = typeof value === 'number' ? value : normalizeLessonNumber(value);
  const lesson = lessonByNumber.get(lessonNumber);
  if (lesson) return lesson.unit;
  const garden = String(value ?? '').match(/语文园地\s*([一二三四五六七八])/);
  if (garden) return { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8 }[garden[1]] || null;
  return null;
}

export function unitMeta(number) {
  return unitByNumber.get(Number(number)) || null;
}

export function lessonMeta(number) {
  return lessonByNumber.get(Number(number)) || null;
}

export function sourceLabel(unit, lesson = null) {
  const unitNumber = Number(unit);
  if (lesson) return `第${unitNumber}单元·第${Number(lesson)}课`;
  return `第${unitNumber}单元`;
}
