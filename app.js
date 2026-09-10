import { textbookUnits, gardenUnits, contentVersion } from './data/catalog.js';
import { writingItems } from './data/writing.js';
import { recognitionItems, recognitionStats, recognitionAudit } from './data/recognition.js';
import { vocabItems } from './data/vocab.js';
import { gardenItems } from './data/gardens.js';
import { MODULES, cardsInSelection, categoriesForModule, combineModuleStats, emptySelection, selectionLabel, unitLessonNumbers } from './js/selection.js';
import { buildSession, isDue, DAILY_TARGET } from './js/session.js';
import { answerHtmlForCard, questionForCard, displaySource } from './js/card-renderer.js';
import { createHandwritingController } from './js/handwriting.js';
import { canRateCard, canRevealAnswer, categoryLabel, needsFirstHandwriting, needsSecondHandwriting } from './js/practice-policy.js';
import { CLIENT_KEY, dateKey, emptyProgress, loadLocalProgress, moduleStats, progressForRating, saveLocalProgress, userStorageKey } from './js/progress.js';

const GOAL = DAILY_TARGET;
const DAILY_TOTAL = GOAL * MODULES.length;
const modulesById = Object.fromEntries(MODULES.map((module) => [module.id, module]));
const cards = [...writingItems, ...recognitionItems, ...vocabItems, ...gardenItems];
const cardsByModule = Object.fromEntries(MODULES.map((module) => [module.id, cards.filter((card) => categoriesForModule(module.id).includes(card.module))]));
const state = {
  user: null,
  cardProgress: {},
  logs: [],
  serverStats: [],
  serverModuleStats: [],
  currentModule: null,
  selection: emptySelection(),
  rangeCandidates: [],
  session: null,
  usedTodayIds: new Set(),
  reverseGarden: false,
  firstHandwriting: null,
  secondHandwriting: null,
};

const $ = (id) => document.getElementById(id);
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));

function getClientId() {
  let id = localStorage.getItem(CLIENT_KEY);
  if (!id) { id = `${crypto.randomUUID?.() || Date.now()}-${crypto.randomUUID?.() || Math.random()}`; localStorage.setItem(CLIENT_KEY, id); }
  return id;
}

function localUserId() { return state.user?.id || 'guest'; }

function readLocal() {
  const local = loadLocalProgress(localUserId(), localStorage, cards);
  state.cardProgress = local.cardProgress;
  state.logs = local.logs;
  state.usedTodayIds = new Set(local.logs.filter((log) => log.date === dateKey()).map((log) => log.cardId));
}

function saveLocal() { saveLocalProgress({ cardProgress: state.cardProgress, logs: state.logs }, localUserId(), localStorage, cards); }

function setMessage(message) {
  const element = $('authMessage');
  if (element) element.textContent = message || '';
}

function setAuthPanelOpen(open) {
  const panel = $('authPanel');
  panel.classList.toggle('hidden', !open);
  $('authBackdrop').classList.toggle('hidden', !open);
  $('accountButton').setAttribute('aria-expanded', String(open));
  panel.setAttribute('aria-hidden', String(!open));
  document.body.classList.toggle('auth-open', open);
  if (open) requestAnimationFrame(() => {
    panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    panel.focus({ preventScroll: true });
  });
}

function toggleAuthPanel() {
  setAuthPanelOpen($('authPanel').classList.contains('hidden'));
}

function localModuleStats() { return moduleStats(state.logs, dateKey()); }

function remoteModuleStats() {
  const result = Object.fromEntries(['writing', 'recognition', 'vocab', 'garden'].map((module) => [module, { completed: 0, remembered: 0 }]));
  for (const row of state.serverModuleStats || []) {
    if (row.date && row.date !== dateKey()) continue;
    const module = row.category || row.module;
    if (!result[module]) continue;
    result[module].completed += Number(row.learned || row.completed || 0);
    result[module].remembered += Number(row.remembered || 0);
  }
  return result;
}

function todayModuleStats() {
  const local = combineModuleStats(localModuleStats());
  const remote = combineModuleStats(remoteModuleStats());
  return Object.fromEntries(MODULES.map((module) => [module.id, {
    completed: Math.max(local[module.id]?.completed || 0, remote[module.id]?.completed || 0),
    remembered: Math.max(local[module.id]?.remembered || 0, remote[module.id]?.remembered || 0),
  }]));
}

function dailyTotal(stats = todayModuleStats()) { return Object.values(stats).reduce((total, item) => total + item.completed, 0); }

function renderModuleCards() {
  const stats = todayModuleStats();
  $('moduleCards').innerHTML = MODULES.map((module, index) => {
    const item = stats[module.id];
    const count = Math.min(GOAL, item.completed);
    return `<button class="module-card" data-module="${module.id}" type="button"><span class="module-icon">${index + 1}</span><h3>${esc(module.label)}</h3><p>${esc(module.description)}</p><span class="module-count"><b>${count} / ${GOAL}</b><small>${item.completed >= GOAL ? '今日已完成' : '选择范围 →'}</small></span></button>`;
  }).join('');
}

function renderModuleProgress() {
  const stats = todayModuleStats();
  const complete = MODULES.filter((module) => stats[module.id].completed >= GOAL).length;
  const total = dailyTotal(stats);
  $('moduleCompleteCount').textContent = `${complete} / ${MODULES.length}`;
  $('overallQuestionCount').textContent = `${Math.min(DAILY_TOTAL, total)} / ${DAILY_TOTAL} 题`;
  $('todayCount').textContent = Math.min(DAILY_TOTAL, total);
  $('todayStudyCount').textContent = Math.min(DAILY_TOTAL, total);
  $('moduleProgressRows').innerHTML = MODULES.map((module) => {
    const item = stats[module.id];
    return `<div class="module-progress-row"><header><span>${esc(module.label)}</span><strong>${Math.min(GOAL, item.completed)} / ${GOAL}</strong></header><div class="mini-progress"><span style="width:${Math.min(100, item.completed / GOAL * 100)}%"></span></div></div>`;
  }).join('');
}

function refreshDashboard() {
  renderModuleCards();
  renderModuleProgress();
  $('dueCount').textContent = cards.filter((card) => isDue(card, state.cardProgress)).length;
  $('learnedCount').textContent = Object.values(state.cardProgress).filter((item) => Number(item.repetitions) >= 3).length;
  $('totalCount').textContent = cards.length;
}

function moduleCardCount(module, selection) { return cardsInSelection(cardsByModule[module] || [], module, selection).length; }

function checkedUnitNumbers() { return [...state.selection.units].sort((a, b) => a - b); }
function checkedLessonNumbers() { return [...state.selection.lessons].sort((a, b) => a - b); }

function renderRangeList() {
  const module = state.currentModule;
  const isGarden = module === 'garden';
  const units = isGarden ? gardenUnits : textbookUnits.map((unit) => unit.number);
  const selection = state.selection;
  $('rangeList').innerHTML = units.map((unitNumber) => {
    const unit = textbookUnits.find((entry) => entry.number === unitNumber);
    const count = moduleCardCount(module, { units: new Set([unitNumber]), lessons: new Set(), categories: selection.categories });
    if (isGarden) {
      const gardenCount = cardsByModule.garden.filter((card) => card.textbookUnit === unitNumber).length;
      return `<details class="unit-range" data-unit-range="${unitNumber}" open><summary><input data-unit-checkbox="${unitNumber}" type="checkbox" ${selection.units.has(unitNumber) ? 'checked' : ''} aria-label="选择第${unitNumber}单元园地" /><span class="unit-name">第${unitNumber}单元·语文园地</span><span class="unit-count">${gardenCount} 题</span></summary><div class="lesson-list"><label class="lesson-option garden-row"><input data-garden-checkbox="${unitNumber}" type="checkbox" ${selection.units.has(unitNumber) ? 'checked' : ''} /><span>整组园地知识点</span><em>${gardenCount} 题</em></label></div></details>`;
    }
    const lessons = unit?.lessons || [];
    return `<details class="unit-range" data-unit-range="${unitNumber}" open><summary><input data-unit-checkbox="${unitNumber}" type="checkbox" ${selection.units.has(unitNumber) ? 'checked' : ''} aria-label="选择第${unitNumber}单元" /><span class="unit-name">${esc(unit?.title || `第${unitNumber}单元`)}</span><span class="unit-count">${count} 题</span></summary><div class="lesson-list">${lessons.map((lesson) => {
      const lessonCount = moduleCardCount(module, { units: new Set(), lessons: new Set([lesson.number]), categories: selection.categories });
      return `<label class="lesson-option"><input data-lesson-checkbox="${lesson.number}" data-parent-unit="${unitNumber}" type="checkbox" ${selection.units.has(unitNumber) || selection.lessons.has(lesson.number) ? 'checked' : ''} /><span>第${lesson.number}课 · ${esc(lesson.title)}</span><small>${lessonCount} 题</small></label>`;
    }).join('')}</div></details>`;
  }).join('');
  syncRangeControls();
}

function syncRangeControls() {
  const isGarden = state.currentModule === 'garden';
  const units = isGarden ? gardenUnits : textbookUnits.map((unit) => unit.number);
  const selectedCount = units.filter((unit) => state.selection.units.has(unit)).length;
  const all = selectedCount === units.length;
  $('selectAllUnits').checked = all;
  $('selectAllUnits').indeterminate = selectedCount > 0 && !all;
  document.querySelectorAll('[data-character-category]').forEach((input) => {
    input.checked = state.selection.categories?.has(input.dataset.characterCategory) || false;
  });
  for (const unit of units) {
    const unitInput = document.querySelector(`[data-unit-checkbox="${unit}"]`);
    const details = document.querySelector(`[data-unit-range="${unit}"]`);
    if (!unitInput || !details) continue;
    const lessons = [...details.querySelectorAll('[data-lesson-checkbox]')];
    const checkedLessons = lessons.filter((input) => input.checked).length;
    unitInput.checked = state.selection.units.has(unit);
    unitInput.indeterminate = !isGarden && !unitInput.checked && checkedLessons > 0;
  }
  const candidates = cardsInSelection(cards, state.currentModule, state.selection);
  state.rangeCandidates = candidates;
  $('rangeQuestionCount').textContent = `题库 ${candidates.length} 题`;
  $('rangeMaxCount').textContent = candidates.length ? `本轮最多 ${Math.min(GOAL, candidates.length)} 题` : '请选择有题目的范围';
  const noCharacterCategory = state.currentModule === 'characters' && state.selection.categories?.size === 0;
  $('recognitionAudit').classList.toggle('hidden', state.currentModule !== 'characters' || !state.selection.categories?.has('recognition'));
  $('rangeHint').textContent = candidates.length
    ? `${selectionLabel(state.selection, state.currentModule)} · 已选 ${candidates.length} 题；到期卡优先。`
    : noCharacterCategory ? '请至少选择“写字表”或“识字表”。' : '请选择一个或多个单元或课文。';
  $('startModuleButton').disabled = candidates.length === 0;
}

function setAllRange(checked) {
  const isGarden = state.currentModule === 'garden';
  const units = isGarden ? gardenUnits : textbookUnits.map((unit) => unit.number);
  state.selection.units = checked ? new Set(units) : new Set();
  state.selection.lessons = new Set();
  renderRangeList();
}

function selectModule(moduleId) {
  if (!modulesById[moduleId]) return;
  state.currentModule = moduleId;
  const units = moduleId === 'garden' ? gardenUnits : textbookUnits.map((unit) => unit.number);
  state.selection = { units: new Set(units), lessons: new Set(), categories: new Set(categoriesForModule(moduleId)) };
  $('rangeTitle').textContent = `${modulesById[moduleId].label} · 选择范围`;
  $('rangeDescription').textContent = `${modulesById[moduleId].description}。可以选整个单元，也可以只选单篇课文。`;
  const audit = $('recognitionAudit');
  $('characterCategoryControl').classList.toggle('hidden', moduleId !== 'characters');
  if (moduleId === 'characters') {
    audit.textContent = `附件识字表共 ${recognitionStats.tableRows} 条：${recognitionAudit.pdfDeclaredNewCharacters} 个新字，另有 ${recognitionStats.reviewPronunciations} 条复习或多音字；已按附件逐条保留。`;
    audit.classList.remove('hidden');
  } else audit.classList.add('hidden');
  $('reverseGardenControl').classList.toggle('hidden', moduleId !== 'garden');
  $('rangePanel').classList.remove('hidden');
  $('studyPanel').classList.add('hidden');
  renderRangeList();
  $('rangePanel').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function goHome() {
  state.session = null;
  state.currentModule = null;
  $('rangePanel').classList.add('hidden');
  $('studyPanel').classList.add('hidden');
  refreshDashboard();
  $('home').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function selectedOrder() { return document.querySelector('[name="card-order"]:checked')?.value || 'random'; }

function showNotice(message) {
  $('rangeHint').textContent = message;
  $('rangeHint').classList.add('notice');
}

function startModule(isExtra = false) {
  const candidates = cardsInSelection(cards, state.currentModule, state.selection);
  state.rangeCandidates = candidates;
  if (!candidates.length) { showNotice('当前范围没有可练习的题目，请重新选择。'); return; }
  const session = buildSession({ candidates, progress: state.cardProgress, usedTodayIds: state.usedTodayIds, target: GOAL, order: selectedOrder(), isExtra });
  if (!session.cards.length) { showNotice('当前范围的题目今天都已练过；请选择其他范围，或明天再来。'); return; }
  state.session = session;
  session.cards.forEach((card) => state.usedTodayIds.add(card.id));
  $('rangePanel').classList.add('hidden');
  $('studyPanel').classList.remove('hidden');
  $('card').classList.remove('hidden');
  $('completeState').classList.add('hidden');
  showCurrentCard();
  $('studyPanel').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function setRatingsEnabled(enabled) {
  document.querySelectorAll('.ratings button').forEach((button) => { button.disabled = !enabled; });
}

function handwritingReadyForRating() {
  const session = state.session;
  return canRateCard(session?.card, session);
}

function syncHandwritingStatus() {
  const session = state.session;
  if (!session?.card) return;
  const hasFirst = needsFirstHandwriting(session.card);
  if (hasFirst) $('firstWritingStatus').textContent = session.firstWritingDone ? '书写已完成，可以翻面核对。' : '请在画板中书写，再点“完成书写”。';
  if (needsSecondHandwriting(session.card)) $('secondWritingStatus').textContent = session.secondWritingDone ? '第二次书写已完成，可以自评。' : '请在第二块画板中复写，再点“完成复写”。';
  $('showAnswerButton').disabled = hasFirst && !session.firstWritingDone;
  setRatingsEnabled(Boolean(session.answerRevealed && handwritingReadyForRating()));
}

function showCurrentCard() {
  const session = state.session;
  const card = session?.cards[session.index];
  if (!card) return;
  session.card = card;
  session.answerRevealed = false;
  session.firstWritingDone = false;
  session.secondWritingDone = false;
  state.firstHandwriting.clear();
  state.secondHandwriting.clear();
  session.reverse = card.module === 'garden' && card.subtype === 'literacy' && state.reverseGarden && Math.random() < .5;
  const question = questionForCard(card, { reverse: session.reverse });
  const total = session.cards.length;
  $('studyCount').textContent = `${session.isExtra ? '加练' : '本轮'}第 ${session.index + 1} / ${total} 题`;
  $('studyStatus').textContent = session.isExtra ? '额外复习' : '本轮专注';
  $('studyProgressBar').style.width = `${session.index / total * 100}%`;
  $('cardModule').textContent = categoryLabel(card);
  $('cardUnit').textContent = `第${card.textbookUnit || '—'}单元`;
  $('cardTopic').textContent = card.topic || card.gardenSection || '教材练习';
  $('cardSource').textContent = displaySource(card);
  $('cardTitle').textContent = question.title;
  $('questionText').textContent = question.prompt;
  $('answerText').innerHTML = answerHtmlForCard(card, { reverse: session.reverse });
  $('answerReveal').classList.add('hidden');
  $('practiceCompare').classList.remove('has-answer');
  $('showAnswerButton').classList.remove('hidden');
  $('firstWritingBlock').classList.toggle('hidden', !needsFirstHandwriting(card));
  $('secondWritingBlock').classList.toggle('hidden', !needsSecondHandwriting(card));
  $('firstWritingLabel').textContent = card.module === 'vocab' ? '先在这里写出词语' : '先在这里写出目标字';
  $('secondWritingGuide').textContent = '再写一次';
  setRatingsEnabled(false);
  syncHandwritingStatus();
  requestAnimationFrame(() => state.firstHandwriting.resize());
}

function revealAnswer() {
  const session = state.session;
  if (!session) return;
  if (!canRevealAnswer(session.card, session)) {
    $('firstWritingStatus').textContent = '请先在本页画板完成书写。';
    return;
  }
  session.answerRevealed = true;
  $('answerReveal').classList.remove('hidden');
  $('practiceCompare').classList.add('has-answer');
  $('showAnswerButton').classList.add('hidden');
  syncHandwritingStatus();
  requestAnimationFrame(() => state.secondHandwriting.resize());
}

function handwritingChanged(phase) {
  const session = state.session;
  if (!session || !needsFirstHandwriting(session.card)) return;
  if (phase === 'first') session.firstWritingDone = false;
  if (phase === 'second') session.secondWritingDone = false;
  syncHandwritingStatus();
}

function handwritingDone(phase, { strokes }) {
  const session = state.session;
  if (!session || !needsFirstHandwriting(session.card)) return;
  if (phase === 'first') session.firstWritingDone = Boolean(strokes);
  if (phase === 'second' && needsSecondHandwriting(session.card)) session.secondWritingDone = Boolean(strokes);
  syncHandwritingStatus();
}

async function recordReview(card, rating) {
  const next = progressForRating(state.cardProgress[card.id], rating);
  state.cardProgress[card.id] = next;
  state.logs.push({ cardId: card.id, category: card.module, date: dateKey(), rating });
  saveLocal();
  if (!state.user) return;
  try {
    const response = await fetch('/api/progress', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ cardId: card.id, category: card.module, date: dateKey(), rating }) });
    if (!response.ok) throw new Error('同步暂时失败，已保存在本机。');
    setMessage('复习记录已同步。');
  } catch (error) {
    setMessage(error.message || '同步暂时失败，已保存在本机。');
  }
}

async function rateCurrent(rating) {
  const session = state.session;
  if (!session || !canRateCard(session.card, session)) return;
  document.querySelectorAll('.ratings button').forEach((button) => { button.disabled = true; });
  await recordReview(session.card, rating);
  session.index += 1;
  if (session.index >= session.cards.length) finishStudy(); else showCurrentCard();
  refreshDashboard();
}

function finishStudy() {
  const session = state.session;
  const completed = session?.cards.length || 0;
  $('card').classList.add('hidden');
  $('completeState').classList.remove('hidden');
  $('studyProgressBar').style.width = '100%';
  $('completeTitle').textContent = session?.isExtra ? '本轮加练完成！' : `${modulesById[state.currentModule]?.label || '本模块'}本轮完成！`;
  $('completeMessage').textContent = `本轮完成 ${completed} 题。${completed < GOAL ? `当前范围只有 ${completed} 题，已按实际数量出题。` : '需要的话，可以选择其他范围继续练习。'}`;
  refreshDashboard();
}

function closeStudy() {
  state.session = null;
  $('studyPanel').classList.add('hidden');
  $('rangePanel').classList.remove('hidden');
  renderRangeList();
  refreshDashboard();
  $('rangePanel').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function encodeBytes(bytes) { let binary = ''; bytes.forEach((byte) => { binary += String.fromCharCode(byte); }); return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', ''); }
function newSalt() { const bytes = new Uint8Array(16); crypto.getRandomValues(bytes); return encodeBytes(bytes); }
async function passwordProof(password, salt) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const raw = atob(salt.replaceAll('-', '+').replaceAll('_', '/') + '='.repeat((4 - salt.length % 4) % 4));
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: Uint8Array.from(raw, (char) => char.charCodeAt(0)), iterations: 210000 }, key, 256);
  return encodeBytes(new Uint8Array(bits));
}

async function authRequest(action) {
  const username = $('usernameInput').value.trim();
  const password = $('passwordInput').value;
  if (!username || password.length < 8) { setMessage('请填写账号，并使用至少 8 位密码。'); return; }
  setMessage(action === 'register' ? '正在注册…' : '正在登录…');
  const body = { action, username, clientId: getClientId() };
  if (action === 'register') { const salt = newSalt(); body.passwordSalt = salt; body.passwordProof = await passwordProof(password, salt); }
  else {
    const challengeResponse = await fetch('/api/auth', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'challenge', username }) });
    const challenge = await challengeResponse.json().catch(() => ({}));
    if (!challenge.salt) body.password = password; else body.passwordProof = await passwordProof(password, challenge.salt);
  }
  const response = await fetch('/api/auth', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || '账号服务暂时不可用。');
  state.user = result.user;
  $('accountButton').textContent = state.user.username;
  $('accountName').textContent = state.user.username;
  $('authLoggedOut').classList.add('hidden'); $('authLoggedIn').classList.remove('hidden');
  setMessage('登录成功，正在加载同步记录…');
  await loadProgress();
  refreshDashboard();
}

function mergeProgress(localProgress, remoteCards) {
  const merged = { ...localProgress };
  for (const item of remoteCards || []) {
    const target = cards.find((card) => card.id === item.cardId || card.progressKey === item.cardId || card.legacyIds?.includes(item.cardId));
    if (!target) continue;
    const next = { repetitions: item.repetitions, easeFactor: item.easeFactor, intervalDays: item.intervalDays, dueAt: item.dueAt, reviewedAt: item.reviewedAt };
    const old = merged[target.id];
    if (!old || String(next.reviewedAt || '') >= String(old.reviewedAt || '')) merged[target.id] = next;
  }
  return merged;
}

async function loadProgress() {
  readLocal();
  if (!state.user) { refreshDashboard(); return; }
  try {
    const response = await fetch('/api/progress');
    if (!response.ok) throw new Error('同步记录暂时不可用，继续使用本机记录。');
    const result = await response.json();
    state.cardProgress = mergeProgress(state.cardProgress, result.cards);
    state.serverStats = result.dailyStats || [];
    state.serverModuleStats = result.dailyModuleStats || [];
    saveLocal();
    setMessage('同步记录已加载。');
  } catch (error) {
    setMessage(error.message || '同步记录暂时不可用，已保留本机记录。');
  }
  refreshDashboard();
}

async function initAuth() {
  readLocal();
  try {
    const response = await fetch('/api/auth');
    const result = await response.json();
    if (result.user) { state.user = result.user; $('accountButton').textContent = result.user.username; $('accountName').textContent = result.user.username; $('authLoggedOut').classList.add('hidden'); $('authLoggedIn').classList.remove('hidden'); }
    await loadProgress();
  } catch { refreshDashboard(); }
}

function bindRangeEvents() {
  $('rangeList').addEventListener('change', (event) => {
    const input = event.target;
    if (input.matches('[data-unit-checkbox]')) {
      const unit = Number(input.dataset.unitCheckbox);
      if (input.checked) state.selection.units.add(unit); else state.selection.units.delete(unit);
      if (state.currentModule !== 'garden') for (const lesson of unitLessonNumbers(unit)) state.selection.lessons.delete(lesson);
      renderRangeList();
    } else if (input.matches('[data-garden-checkbox]')) {
      const unit = Number(input.dataset.gardenCheckbox);
      if (input.checked) state.selection.units.add(unit); else state.selection.units.delete(unit);
      renderRangeList();
    } else if (input.matches('[data-lesson-checkbox]')) {
      const lesson = Number(input.dataset.lessonCheckbox);
      if (input.checked) state.selection.lessons.add(lesson); else state.selection.lessons.delete(lesson);
      const unit = Number(input.dataset.parentUnit);
      const lessons = unitLessonNumbers(unit);
      if (state.selection.units.has(unit)) {
        state.selection.units.delete(unit);
        lessons.forEach((number) => state.selection.lessons.add(number));
        if (!input.checked) state.selection.lessons.delete(lesson);
      }
      const checked = lessons.filter((number) => state.selection.lessons.has(number)).length;
      if (checked === lessons.length) { state.selection.units.add(unit); lessons.forEach((number) => state.selection.lessons.delete(number)); }
      else state.selection.units.delete(unit);
      renderRangeList();
    }
  });
}

$('characterCategoryControl').addEventListener('change', (event) => {
  const input = event.target.closest('[data-character-category]');
  if (!input || state.currentModule !== 'characters') return;
  const category = input.dataset.characterCategory;
  if (input.checked) state.selection.categories.add(category); else state.selection.categories.delete(category);
  renderRangeList();
});

document.addEventListener('click', (event) => {
  const moduleCard = event.target.closest('[data-module]');
  if (moduleCard) { selectModule(moduleCard.dataset.module); return; }
  const rating = event.target.closest('[data-rating]');
  if (rating) { void rateCurrent(rating.dataset.rating); return; }
  if (event.target.closest('#showAnswerButton')) { revealAnswer(); return; }
});

$('selectAllUnits').addEventListener('change', (event) => setAllRange(event.target.checked));
$('clearUnits').addEventListener('click', () => setAllRange(false));
$('startModuleButton').addEventListener('click', () => startModule(false));
$('rangeBackButton').addEventListener('click', goHome);
$('studyBackButton').addEventListener('click', closeStudy);
$('completeBackButton').addEventListener('click', goHome);
$('moreModuleButton').addEventListener('click', () => startModule(true));
$('accountButton').addEventListener('click', toggleAuthPanel);
$('closeAuthButton').addEventListener('click', () => setAuthPanelOpen(false));
$('authBackdrop').addEventListener('click', () => setAuthPanelOpen(false));
$('authForm').addEventListener('submit', (event) => { event.preventDefault(); void authRequest('login').catch((error) => setMessage(error.message)); });
$('registerButton').addEventListener('click', () => { void authRequest('register').catch((error) => setMessage(error.message)); });
$('logoutButton').addEventListener('click', async () => {
  try { await fetch('/api/auth', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'logout' }) }); } catch { /* local session still ends */ }
  state.user = null; state.serverStats = []; state.serverModuleStats = [];
  $('accountButton').textContent = '登录 / 注册'; $('authLoggedOut').classList.remove('hidden'); $('authLoggedIn').classList.add('hidden');
  readLocal(); refreshDashboard();
});
$('reverseGarden').addEventListener('change', (event) => { state.reverseGarden = event.target.checked; });
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !$('authPanel').classList.contains('hidden')) {
    setAuthPanelOpen(false);
    return;
  }
  if (event.code !== 'Space' || !state.session || state.session.answerRevealed) return;
  const target = event.target;
  if (target.matches('input, textarea, select, button, a, [contenteditable="true"]')) return;
  event.preventDefault();
  revealAnswer();
});

state.firstHandwriting = createHandwritingController($('firstWritingBlock'), {
  onChange: () => handwritingChanged('first'),
  onDone: (result) => handwritingDone('first', result),
});
state.secondHandwriting = createHandwritingController($('secondWritingBlock'), {
  onChange: () => handwritingChanged('second'),
  onDone: (result) => handwritingDone('second', result),
});
bindRangeEvents();
refreshDashboard();
void initAuth();

export { cards, cardsByModule, state, selectModule, startModule };
