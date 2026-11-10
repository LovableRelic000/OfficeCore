import { Router } from 'express';
import { query } from '../db/index.js';

export const historyRouter = Router();

historyRouter.get('/week', async (req, res) => {
  const userId = req.user?.id || 1;

  // 1. Daily summaries
  const summaries = await query<{
    date: string;
    metrics_json: any;
    ai_json: any;
  }>(
    `SELECT date, metrics_json, ai_json 
     FROM daily_summaries 
     WHERE user_id = ? AND date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) 
     ORDER BY date ASC`,
    [userId]
  );

  // 2. Focus totals by day
  const focusByDay = await query<{ day: string; total_min: number; blocks: number }>(
    `SELECT DATE(start_time) as day, SUM(planned_min) as total_min, COUNT(*) as blocks 
     FROM focus_sessions 
     WHERE user_id = ? AND start_time >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) 
     GROUP BY DATE(start_time) 
     ORDER BY day ASC`,
    [userId]
  );

  // 3. Sleep by day
  const sleepByDay = await query<{ date: string; duration_min: number; quality: number }>(
    `SELECT date, duration_min, quality 
     FROM sleep_logs 
     WHERE user_id = ? AND date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) 
     ORDER BY date ASC`,
    [userId]
  );

  // 4. Caffeine intake by day
  const caffeineByDay = await query<{ day: string; total_mg: number; count: number }>(
    `SELECT DATE(ts) as day, SUM(mg) as total_mg, COUNT(*) as count 
     FROM caffeine_logs 
     WHERE user_id = ? AND ts >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) 
     GROUP BY DATE(ts) 
     ORDER BY day ASC`,
    [userId]
  );

  res.json({
    summaries: summaries.map((s) => ({
      date: s.date,
      metrics: typeof s.metrics_json === 'string' ? JSON.parse(s.metrics_json) : s.metrics_json,
      ai: typeof s.ai_json === 'string' ? JSON.parse(s.ai_json) : s.ai_json,
    })),
    focus: focusByDay,
    sleep: sleepByDay,
    caffeine: caffeineByDay,
  });
});

historyRouter.get('/trends', async (req, res) => {
  const userId = req.user?.id || 1;
  const weeks = parseInt(req.query.weeks as string || '4', 10);

  const focusTrends = await query<{ week_num: number; avg_min: number }>(
    `SELECT WEEK(start_time) as week_num, AVG(planned_min) as avg_min 
     FROM focus_sessions 
     WHERE user_id = ? AND start_time >= DATE_SUB(CURDATE(), INTERVAL ? WEEK) 
     GROUP BY WEEK(start_time) 
     ORDER BY week_num ASC`,
    [userId, weeks]
  );

  const sleepTrends = await query<{ week_num: number; avg_sleep_h: number; avg_qual: number }>(
    `SELECT WEEK(date) as week_num, AVG(duration_min)/60 as avg_sleep_h, AVG(quality) as avg_qual 
     FROM sleep_logs 
     WHERE user_id = ? AND date >= DATE_SUB(CURDATE(), INTERVAL ? WEEK) 
     GROUP BY WEEK(date) 
     ORDER BY week_num ASC`,
    [userId, weeks]
  );

  res.json({
    weeksRequested: weeks,
    focusTrends,
    sleepTrends,
  });
});

