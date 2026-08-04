import { ensureAuthTables, getSessionUser } from './_auth.js';

const json = (payload, status = 200) => new Response(JSON.stringify(payload), { status, headers: { 'content-type': 'application/json; charset=utf-8' } });
const allowedCategories = new Set(['recite', 'recognition', 'writing', 'vocab']);
const allowedRatings = new Set(['again', 'hard', 'good', 'easy']);

async function ensureProgress(db) {
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS chinese_card_progress (
      user_id TEXT NOT NULL,
      card_id TEXT NOT NULL,
      category TEXT NOT NULL,
      repetitions INTEGER NOT NULL DEFAULT 0,
      ease_factor REAL NOT NULL DEFAULT 2.5,
      interval_days INTEGER NOT NULL DEFAULT 0,
      due_at TEXT NOT NULL,
      reviewed_at TEXT,
      PRIMARY KEY (user_id, card_id)
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS chinese_review_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      card_id TEXT NOT NULL,
      category TEXT NOT NULL,
      rating TEXT NOT NULL,
      study_date TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    db.prepare('CREATE INDEX IF NOT EXISTS chinese_card_progress_due_idx ON chinese_card_progress(user_id, due_at)'),
    db.prepare('CREATE INDEX IF NOT EXISTS chinese_review_log_user_date_idx ON chinese_review_log(user_id, study_date)'),
  ]);
}

export async function onRequestGet({ request, env }) {
  await ensureAuthTables(env.DB); await ensureProgress(env.DB);
  const user = await getSessionUser(request, env.DB);
  if (!user) return json({ error: '请先登录。' }, 401);
  const [{ results: cards }, { results: dailyStats }] = await Promise.all([
    env.DB.prepare('SELECT card_id AS cardId, category, repetitions, ease_factor AS easeFactor, interval_days AS intervalDays, due_at AS dueAt, reviewed_at AS reviewedAt FROM chinese_card_progress WHERE user_id = ?').bind(user.id).all(),
    env.DB.prepare("SELECT study_date AS date, COUNT(*) AS learned, SUM(CASE WHEN rating IN ('good', 'easy') THEN 1 ELSE 0 END) AS remembered, SUM(CASE WHEN category = 'recite' THEN 1 ELSE 0 END) AS recite FROM chinese_review_log WHERE user_id = ? GROUP BY study_date ORDER BY study_date DESC LIMIT 60").bind(user.id).all(),
  ]);
  return json({ cards, dailyStats, now: new Date().toISOString() });
}

export async function onRequestPost({ request, env }) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body.cardId !== 'string' || body.cardId.length < 3 || body.cardId.length > 180 || !allowedCategories.has(body.category) || !/^\d{4}-\d{2}-\d{2}$/.test(body.date) || !allowedRatings.has(body.rating)) return json({ error: '无效复习记录。' }, 400);
  await ensureAuthTables(env.DB); await ensureProgress(env.DB);
  const user = await getSessionUser(request, env.DB); if (!user) return json({ error: '请先登录。' }, 401);
  const old = await env.DB.prepare('SELECT repetitions, ease_factor AS easeFactor, interval_days AS intervalDays FROM chinese_card_progress WHERE user_id = ? AND card_id = ?').bind(user.id, body.cardId).first();
  let repetitions = Number(old?.repetitions || 0); let ease = Number(old?.easeFactor || 2.5); let interval = Number(old?.intervalDays || 0);
  if (body.rating === 'again') { repetitions = 0; interval = 0; ease = Math.max(1.3, ease - .2); }
  else { repetitions += 1; ease = Math.max(1.3, ease + (body.rating === 'easy' ? .15 : body.rating === 'hard' ? -.15 : 0)); interval = repetitions === 1 ? (body.rating === 'hard' ? 1 : body.rating === 'easy' ? 4 : 2) : Math.max(1, Math.round(interval * ease * (body.rating === 'hard' ? .75 : body.rating === 'easy' ? 1.3 : 1))); }
  const dueAt = new Date(Date.now() + (body.rating === 'again' ? 10 * 60 * 1000 : interval * 86400000)).toISOString();
  await dbBatch(env.DB, user.id, body, { repetitions, ease, interval, dueAt });
  const dailyStat = await env.DB.prepare("SELECT COUNT(*) AS learned, SUM(CASE WHEN rating IN ('good', 'easy') THEN 1 ELSE 0 END) AS remembered FROM chinese_review_log WHERE user_id = ? AND study_date = ?").bind(user.id, body.date).first();
  return json({ ok: true, card: { cardId: body.cardId, repetitions, easeFactor: ease, intervalDays: interval, dueAt }, dailyStat });
}

async function dbBatch(db, userId, body, next) {
  await db.batch([
    db.prepare(`INSERT INTO chinese_card_progress (user_id, card_id, category, repetitions, ease_factor, interval_days, due_at, reviewed_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id, card_id) DO UPDATE SET category=excluded.category, repetitions=excluded.repetitions, ease_factor=excluded.ease_factor, interval_days=excluded.interval_days, due_at=excluded.due_at, reviewed_at=excluded.reviewed_at`).bind(userId, body.cardId, body.category, next.repetitions, next.ease, next.interval, next.dueAt, new Date().toISOString()),
    db.prepare('INSERT INTO chinese_review_log (user_id, card_id, category, rating, study_date) VALUES (?, ?, ?, ?, ?)').bind(userId, body.cardId, body.category, body.rating, body.date),
  ]);
}
