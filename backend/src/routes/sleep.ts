import { Router } from 'express';
import { query, execute } from '../db/index.js';
import { z } from 'zod';

export const sleepRouter = Router();

sleepRouter.get('/week', async (req, res) => {
  const userId = req.user?.id || 1;

  const logs = await query(
    `SELECT id, date, bedtime, wake, duration_min, quality, source 
     FROM sleep_logs 
     WHERE user_id = ? 
     ORDER BY date DESC LIMIT 7`,
    [userId]
  );

  let totalDuration = 0;
  let totalQuality = 0;
  for (const l of logs) {
    totalDuration += l.duration_min;
    totalQuality += l.quality;
  }

  const avgDurationMin = logs.length ? Math.round(totalDuration / logs.length) : 450;
  const avgQuality = logs.length ? Math.round((totalQuality / logs.length) * 10) / 10 : 4.0;

  res.json({
    count: logs.length,
    avgDurationHours: Math.round((avgDurationMin / 60) * 10) / 10,
    avgQuality,
    logs,
  });
});

const logSleepSchema = z.object({
  date: z.string().optional(),
  bedtime: z.string(),
  wake: z.string(),
  duration_min: z.number().int().positive(),
  quality: z.number().int().min(1).max(5),
});

sleepRouter.post('/logs', async (req, res) => {
  const userId = req.user?.id || 1;
  const parsed = logSleepSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.format() });
  }

  const { date, bedtime, wake, duration_min, quality } = parsed.data;
  const sleepDate = date || new Date().toISOString().split('T')[0];

  const result = await execute(
    `INSERT INTO sleep_logs (user_id, date, bedtime, wake, duration_min, quality, source)
     VALUES (?, ?, ?, ?, ?, ?, 'manual')
     ON DUPLICATE KEY UPDATE bedtime = VALUES(bedtime), wake = VALUES(wake), duration_min = VALUES(duration_min), quality = VALUES(quality), source = 'manual'`,
    [userId, sleepDate, bedtime, wake, duration_min, quality]
  );

  res.json({
    success: true,
    id: result.insertId,
    date: sleepDate,
    duration_min,
    quality,
  });
});
