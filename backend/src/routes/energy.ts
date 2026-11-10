import { Router } from 'express';
import { query } from '../db/index.js';
import { calculateEnergy } from '../engine/energy.js';
import { calculateCurrentCaffeine, calculateCaffeineCutoff } from '../engine/caffeine.js';

export const energyRouter = Router();

energyRouter.get('/now', async (req, res) => {
  const userId = req.user?.id || 1;

  // 1. Check latest pre-calculated snapshot
  const [latestSnap] = await query(
    `SELECT physical, mental, caffeine_load, overall, ts 
     FROM energy_snapshots 
     WHERE user_id = ? 
     ORDER BY ts DESC LIMIT 1`,
    [userId]
  );

  // 2. Fetch today's caffeine logs for real-time caffeine decay
  const caffeineLogs = await query<{ ts: string; mg: number }>(
    `SELECT ts, mg FROM caffeine_logs WHERE user_id = ? AND DATE(ts) = CURDATE() ORDER BY ts ASC`,
    [userId]
  );

  const [user] = await query<{ caffeine_limit_mg: number; caffeine_half_life_h: number; bedtime: string }>(
    `SELECT caffeine_limit_mg, caffeine_half_life_h, bedtime FROM users WHERE id = ? LIMIT 1`,
    [userId]
  );

  const limitMg = user?.caffeine_limit_mg || 400;
  const halfLife = user?.caffeine_half_life_h || 5.0;
  const bedtime = user?.bedtime?.substring(0, 5) || '23:30';

  const currentCaffeineMg = calculateCurrentCaffeine(caffeineLogs, new Date(), halfLife);
  const cutoffInfo = calculateCaffeineCutoff(bedtime, halfLife);

  let physical = latestSnap ? latestSnap.physical : 85;
  let mental = latestSnap ? latestSnap.mental : 80;
  let caffeineLoad = Math.round((currentCaffeineMg / limitMg) * 100);
  let overall = latestSnap ? latestSnap.overall : Math.round(physical * 0.4 + mental * 0.45 + (100 - caffeineLoad) * 0.15);

  res.json({
    physical,
    mental,
    caffeineLoad,
    overall,
    currentCaffeineMg,
    caffeineLimitMg: limitMg,
    cutoffTime: cutoffInfo.cutoffTime,
    cutoffAdjustedForSleep: cutoffInfo.adjustedForSleep,
    lastUpdated: latestSnap?.ts || new Date().toISOString(),
  });
});

energyRouter.get('/day', async (req, res) => {
  const userId = req.user?.id || 1;
  const date = (req.query.date as string) || new Date().toISOString().split('T')[0];

  const snapshots = await query(
    `SELECT ts, physical, mental, caffeine_load, overall 
     FROM energy_snapshots 
     WHERE user_id = ? AND DATE(ts) = ? 
     ORDER BY ts ASC`,
    [userId, date]
  );

  res.json({
    date,
    count: snapshots.length,
    snapshots,
  });
});
