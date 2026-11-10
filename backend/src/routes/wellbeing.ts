import { Router } from 'express';
import { query, execute } from '../db/index.js';
import { z } from 'zod';

export const wellbeingRouter = Router();

wellbeingRouter.get('/stress', async (req, res) => {
  const userId = req.user?.id || 1;
  const from = req.query.from as string || new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
  const to = req.query.to as string || new Date().toISOString().split('T')[0];

  const events = await query(
    `SELECT id, ts, peak_bpm, baseline_bpm, trigger_tag, tagged_at, created_at 
     FROM stress_events 
     WHERE user_id = ? AND DATE(ts) BETWEEN ? AND ? 
     ORDER BY ts DESC`,
    [userId, from, to]
  );

  const triggersSummary: Record<string, number> = {};
  for (const e of events) {
    const tag = e.trigger_tag || 'Sin clasificar';
    triggersSummary[tag] = (triggersSummary[tag] || 0) + 1;
  }

  res.json({
    totalEvents: events.length,
    triggersSummary,
    events,
  });
});

const tagStressSchema = z.object({
  trigger_tag: z.enum(['Reunión', 'Mensaje', 'Código/bug', 'Tráfico', 'Otro']),
});

wellbeingRouter.post('/stress/:id/tag', async (req, res) => {
  const userId = req.user?.id || 1;
  const eventId = parseInt(req.params.id, 10);
  const parsed = tagStressSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.format() });
  }

  await execute(
    `UPDATE stress_events SET trigger_tag = ?, tagged_at = NOW() WHERE id = ? AND user_id = ?`,
    [parsed.data.trigger_tag, eventId, userId]
  );

  res.json({ success: true, message: 'Stress event tagged successfully' });
});

const breathingSchema = z.object({
  duration_s: z.number().int().min(30).max(300),
  pattern: z.string().default('4-7-8'),
  hr_before: z.number().int(),
  hr_after: z.number().int(),
  start_time: z.string().optional(),
});

wellbeingRouter.post('/breathing', async (req, res) => {
  const userId = req.user?.id || 1;
  const parsed = breathingSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.format() });
  }

  const { duration_s, pattern, hr_before, hr_after, start_time } = parsed.data;
  const startTime = start_time ? new Date(start_time) : new Date();

  const result = await execute(
    `INSERT INTO breathing_sessions (user_id, start_time, duration_s, pattern, hr_before, hr_after)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [userId, startTime, duration_s, pattern, hr_before, hr_after]
  );

  res.json({
    success: true,
    id: result.insertId,
    hr_reduction: hr_before - hr_after,
  });
});

wellbeingRouter.get('/environment/day', async (req, res) => {
  const userId = req.user?.id || 1;
  const date = (req.query.date as string) || new Date().toISOString().split('T')[0];

  const samples = await query(
    `SELECT ts, noise_db, lux 
     FROM environment_samples 
     WHERE user_id = ? AND DATE(ts) = ? 
     ORDER BY ts ASC`,
    [userId, date]
  );

  let totalNoise = 0;
  let totalLux = 0;
  for (const s of samples) {
    totalNoise += s.noise_db;
    totalLux += s.lux;
  }

  const avgNoise = samples.length ? Math.round((totalNoise / samples.length) * 10) / 10 : 48.0;
  const avgLux = samples.length ? Math.round(totalLux / samples.length) : 380;

  res.json({
    date,
    count: samples.length,
    avgNoiseDb: avgNoise,
    avgLux: avgLux,
    samples,
  });
});
