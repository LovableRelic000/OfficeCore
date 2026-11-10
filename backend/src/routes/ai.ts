import { Router } from 'express';
import { query, execute } from '../db/index.js';
import { z } from 'zod';
import { aiService, DailyMetricsInput } from '../ai/gemini.js';
import { config } from '../config.js';

export const aiRouter = Router();

aiRouter.get('/summary', async (req, res) => {
  const userId = req.user?.id || 1;
  const date = (req.query.date as string) || new Date().toISOString().split('T')[0];

  const [existing] = await query<{
    date: string;
    metrics_json: any;
    ai_json: any;
    model: string;
    generated_at: string;
  }>(
    `SELECT date, metrics_json, ai_json, model, generated_at 
     FROM daily_summaries 
     WHERE user_id = ? AND date = ? LIMIT 1`,
    [userId, date]
  );

  if (existing) {
    return res.json({
      date: existing.date,
      model: existing.model,
      generated_at: existing.generated_at,
      metrics: typeof existing.metrics_json === 'string' ? JSON.parse(existing.metrics_json) : existing.metrics_json,
      summary: typeof existing.ai_json === 'string' ? JSON.parse(existing.ai_json) : existing.ai_json,
    });
  }

  res.status(404).json({ error: 'No summary generated yet for this date' });
});

const generateSummarySchema = z.object({
  date: z.string().optional(),
  force: z.boolean().default(false),
});

aiRouter.post('/summary', async (req, res) => {
  const userId = req.user?.id || 1;
  const parsed = generateSummarySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.format() });
  }

  const date = parsed.data.date || new Date().toISOString().split('T')[0];
  const force = parsed.data.force;

  if (!force) {
    const [existing] = await query<{
      date: string;
      metrics_json: any;
      ai_json: any;
      model: string;
      generated_at: string;
    }>(
      `SELECT date, metrics_json, ai_json, model, generated_at 
       FROM daily_summaries 
       WHERE user_id = ? AND date = ? LIMIT 1`,
      [userId, date]
    );

    if (existing) {
      return res.json({
        cached: true,
        date: existing.date,
        model: existing.model,
        summary: typeof existing.ai_json === 'string' ? JSON.parse(existing.ai_json) : existing.ai_json,
      });
    }
  }

  // Aggregate today's real metrics from DB
  const focusSessions = await query<{ planned_min: number; quality_score: number }>(
    `SELECT planned_min, quality_score FROM focus_sessions WHERE user_id = ? AND DATE(start_time) = ?`,
    [userId, date]
  );
  const focusTotalMin = focusSessions.reduce((s, f) => s + f.planned_min, 0);
  const focusAvgQuality = focusSessions.length ? Math.round(focusSessions.reduce((s, f) => s + f.quality_score, 0) / focusSessions.length) : 85;

  const postureRows = await query<{ band: string; count: number }>(
    `SELECT band, COUNT(*) as count FROM posture_windows WHERE user_id = ? AND DATE(ts_start) = ? GROUP BY band`,
    [userId, date]
  );
  let gCount = 0, aCount = 0, rCount = 0;
  for (const r of postureRows) {
    if (r.band === 'green') gCount += r.count;
    if (r.band === 'amber') aCount += r.count;
    if (r.band === 'red') rCount += r.count;
  }
  const totalPosture = gCount + aCount + rCount || 1;
  const ergonomicDebt = aCount * 2 + rCount * 4;

  const caffeineLogs = await query<{ mg: number; ts: string }>(
    `SELECT mg, ts FROM caffeine_logs WHERE user_id = ? AND DATE(ts) = ? ORDER BY ts ASC`,
    [userId, date]
  );
  const caffeineTotalMg = caffeineLogs.reduce((s, c) => s + c.mg, 0);

  const [sleep] = await query<{ duration_min: number; quality: number }>(
    `SELECT duration_min, quality FROM sleep_logs WHERE user_id = ? AND date = ? LIMIT 1`,
    [userId, date]
  );

  const [energy] = await query<{ physical: number; mental: number; caffeine_load: number; overall: number }>(
    `SELECT physical, mental, caffeine_load, overall FROM energy_snapshots WHERE user_id = ? AND DATE(ts) = ? ORDER BY ts DESC LIMIT 1`,
    [userId, date]
  );

  const breaks = await query<{ kind: string; outcome: string }>(
    `SELECT kind, outcome FROM break_events WHERE user_id = ? AND DATE(ts) = ?`,
    [userId, date]
  );
  const breaksCompleted = { eye: 0, water: 0, stand: 0 };
  for (const b of breaks) {
    if (b.outcome === 'done') {
      if (b.kind === 'eye') breaksCompleted.eye++;
      if (b.kind === 'water') breaksCompleted.water++;
      if (b.kind === 'stand') breaksCompleted.stand++;
    }
  }

  const metricsInput: DailyMetricsInput = {
    date,
    focusMinutesTotal: focusTotalMin,
    focusBlocksCount: focusSessions.length,
    averageFocusQuality: focusAvgQuality,
    ergonomicDebtMinutes: ergonomicDebt,
    postureBandsPct: {
      green: Math.round((gCount / totalPosture) * 100),
      amber: Math.round((aCount / totalPosture) * 100),
      red: Math.round((rCount / totalPosture) * 100),
    },
    caffeineTotalMg,
    caffeineDrinksCount: caffeineLogs.length,
    caffeineLastIntakeTime: caffeineLogs.length ? caffeineLogs[caffeineLogs.length - 1].ts : undefined,
    sleepDurationMin: sleep?.duration_min,
    sleepQuality: sleep?.quality,
    screenTimeMinutes: 380,
    stressEventsCount: 1,
    breathingSessionsCount: 1,
    breaksCompleted,
    energyScores: {
      physical: energy?.physical || 85,
      mental: energy?.mental || 80,
      caffeineLoad: energy?.caffeine_load || 40,
      overall: energy?.overall || 82,
    },
  };

  const aiResult = await aiService.generateSummary(metricsInput);

  await execute(
    `INSERT INTO daily_summaries (user_id, date, metrics_json, ai_json, model, generated_at)
     VALUES (?, ?, ?, ?, ?, NOW())
     ON DUPLICATE KEY UPDATE metrics_json = VALUES(metrics_json), ai_json = VALUES(ai_json), generated_at = NOW()`,
    [userId, date, JSON.stringify(metricsInput), JSON.stringify(aiResult), config.gemini.model]
  );

  res.json({
    cached: false,
    date,
    model: config.gemini.model,
    summary: aiResult,
    metrics: metricsInput,
  });
});

const chatSchema = z.object({
  message: z.string().min(1),
});

aiRouter.post('/chat', async (req, res) => {
  const userId = req.user?.id || 1;
  const parsed = chatSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.format() });
  }

  const userMessage = parsed.data.message;

  // Save user message
  await execute(
    `INSERT INTO chat_messages (user_id, role, content, ts) VALUES (?, 'user', ?, NOW())`,
    [userId, userMessage]
  );

  // Fetch recent chat history
  const history = await query<{ role: 'user' | 'assistant'; content: string }>(
    `SELECT role, content FROM chat_messages WHERE user_id = ? ORDER BY ts ASC LIMIT 10`,
    [userId]
  );

  // Fetch 7-day compact context
  const weekSummaries = await query(
    `SELECT date, metrics_json FROM daily_summaries WHERE user_id = ? ORDER BY date DESC LIMIT 5`,
    [userId]
  );
  const weekCaffeine = await query(
    `SELECT DATE(ts) as date, TIME(ts) as time, mg, drink_type FROM caffeine_logs WHERE user_id = ? ORDER BY ts DESC LIMIT 10`,
    [userId]
  );
  const weekSleep = await query(
    `SELECT date, duration_min, quality FROM sleep_logs WHERE user_id = ? ORDER BY date DESC LIMIT 7`,
    [userId]
  );

  const contextData = {
    user: 'Alex Rivera',
    todayEnergy: { overall: 82, physical: 84, mental: 80, caffeineLoad: 24 },
    recentSummaries: weekSummaries.map((s) => ({ date: s.date, metrics: typeof s.metrics_json === 'string' ? JSON.parse(s.metrics_json) : s.metrics_json })),
    recentCaffeine: weekCaffeine,
    recentSleep: weekSleep,
  };

  const reply = await aiService.chat(history, userMessage, contextData);

  // Save assistant reply
  await execute(
    `INSERT INTO chat_messages (user_id, role, content, ts) VALUES (?, 'assistant', ?, NOW())`,
    [userId, reply]
  );

  res.json({
    reply,
    model: config.gemini.model,
    timestamp: new Date().toISOString(),
  });
});

aiRouter.get('/chat/history', async (req, res) => {
  const userId = req.user?.id || 1;
  const messages = await query(
    `SELECT id, role, content, ts FROM chat_messages WHERE user_id = ? ORDER BY ts ASC LIMIT 50`,
    [userId]
  );

  res.json({ messages });
});
