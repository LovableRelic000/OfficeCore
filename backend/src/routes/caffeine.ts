import { Router } from 'express';
import { query, execute } from '../db/index.js';
import { z } from 'zod';
import { calculateCurrentCaffeine, calculateCaffeineCutoff } from '../engine/caffeine.js';
import { broadcastEnergyUpdate } from '../ws/server.js';

export const caffeineRouter = Router();

caffeineRouter.get('/day', async (req, res) => {
  const userId = req.user?.id || 1;
  const date = (req.query.date as string) || new Date().toISOString().split('T')[0];

  const logs = await query<{ id: number; ts: string; drink_type: string; size: string; mg: number }>(
    `SELECT id, ts, drink_type, size, mg 
     FROM caffeine_logs 
     WHERE user_id = ? AND DATE(ts) = ? 
     ORDER BY ts ASC`,
    [userId, date]
  );

  const [user] = await query<{ caffeine_limit_mg: number; caffeine_half_life_h: number; bedtime: string }>(
    `SELECT caffeine_limit_mg, caffeine_half_life_h, bedtime FROM users WHERE id = ? LIMIT 1`,
    [userId]
  );

  const limitMg = user?.caffeine_limit_mg || 400;
  const halfLife = user?.caffeine_half_life_h || 5.0;
  const bedtime = user?.bedtime?.substring(0, 5) || '23:30';

  // Check previous night sleep quality to adjust cutoff
  const [prevSleep] = await query<{ duration_min: number; quality: number }>(
    `SELECT duration_min, quality FROM sleep_logs 
     WHERE user_id = ? AND date < ? 
     ORDER BY date DESC LIMIT 1`,
    [userId, date]
  );

  const poorSleep = prevSleep ? (prevSleep.duration_min < 360 || prevSleep.quality <= 2) : false;
  const cutoff = calculateCaffeineCutoff(bedtime, halfLife, 30.0, 95.0, poorSleep);
  const currentMg = calculateCurrentCaffeine(logs, new Date(), halfLife);
  const totalIntakeMg = logs.reduce((sum, l) => sum + l.mg, 0);

  // Compute 24-hour decay curve data points (every 30 min)
  const curvePoints: Array<{ time: string; mg: number }> = [];
  const [bYear, bMonth, bDay] = date.split('-').map(Number);
  for (let h = 7; h <= 24; h++) {
    for (let m of [0, 30]) {
      const pointDate = new Date(Date.UTC(bYear, bMonth - 1, bDay, h, m));
      const mgAtPoint = calculateCurrentCaffeine(logs, pointDate, halfLife);
      const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      curvePoints.push({ time: timeStr, mg: mgAtPoint });
    }
  }

  res.json({
    date,
    currentMg,
    totalIntakeMg,
    limitMg,
    loadPct: Math.round((currentMg / limitMg) * 100),
    cutoffTime: cutoff.cutoffTime,
    cutoffAdjustedForSleep: cutoff.adjustedForSleep,
    logs,
    curve: curvePoints,
  });
});

const logCaffeineSchema = z.object({
  drink_type: z.string().min(1),
  size: z.string().default('Mediano'),
  mg: z.number().int().positive(),
  ts: z.string().optional(),
});

caffeineRouter.post('/logs', async (req, res) => {
  const userId = req.user?.id || 1;
  const parsed = logCaffeineSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.format() });
  }

  const { drink_type, size, mg, ts } = parsed.data;
  const timestamp = ts ? new Date(ts) : new Date();

  const result = await execute(
    `INSERT INTO caffeine_logs (user_id, ts, drink_type, size, mg)
     VALUES (?, ?, ?, ?, ?)`,
    [userId, timestamp, drink_type, size, mg]
  );

  broadcastEnergyUpdate(userId, { event: 'caffeine_logged', mg, drink_type });

  res.json({
    success: true,
    id: result.insertId,
    drink_type,
    mg,
  });
});

caffeineRouter.delete('/logs/:id', async (req, res) => {
  const userId = req.user?.id || 1;
  const logId = parseInt(req.params.id, 10);

  await execute(`DELETE FROM caffeine_logs WHERE id = ? AND user_id = ?`, [logId, userId]);
  res.json({ success: true, message: 'Log deleted' });
});

caffeineRouter.get('/cutoff', async (req, res) => {
  const userId = req.user?.id || 1;
  const [user] = await query<{ bedtime: string; caffeine_half_life_h: number }>(
    `SELECT bedtime, caffeine_half_life_h FROM users WHERE id = ? LIMIT 1`,
    [userId]
  );

  const bedtime = user?.bedtime?.substring(0, 5) || '23:30';
  const halfLife = user?.caffeine_half_life_h || 5.0;

  const [prevSleep] = await query<{ duration_min: number; quality: number }>(
    `SELECT duration_min, quality FROM sleep_logs 
     WHERE user_id = ? 
     ORDER BY date DESC LIMIT 1`,
    [userId]
  );

  const poorSleep = prevSleep ? (prevSleep.duration_min < 360 || prevSleep.quality <= 2) : false;
  const cutoff = calculateCaffeineCutoff(bedtime, halfLife, 30.0, 95.0, poorSleep);

  res.json({
    bedtime,
    cutoffTime: cutoff.cutoffTime,
    adjustedForPoorSleep: cutoff.adjustedForSleep,
  });
});

