import { Router } from 'express';
import { query, execute } from '../db/index.js';
import { z } from 'zod';

export const breaksRouter = Router();

const recordBreakSchema = z.object({
  kind: z.enum(['eye', 'water', 'stand', 'stretch']),
  outcome: z.enum(['done', 'snoozed', 'dismissed']).default('done'),
  amount_ml: z.number().int().positive().optional(),
  ts: z.string().optional(),
});

breaksRouter.post('/', async (req, res) => {
  const userId = req.user?.id || 1;
  const parsed = recordBreakSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.format() });
  }

  const { kind, outcome, amount_ml, ts } = parsed.data;
  const timestamp = ts ? new Date(ts) : new Date();

  const result = await execute(
    `INSERT INTO break_events (user_id, ts, kind, outcome, amount_ml)
     VALUES (?, ?, ?, ?, ?)`,
    [userId, timestamp, kind, outcome, amount_ml || null]
  );

  res.json({
    success: true,
    id: result.insertId,
    kind,
    outcome,
  });
});

breaksRouter.get('/day', async (req, res) => {
  const userId = req.user?.id || 1;
  const date = (req.query.date as string) || new Date().toISOString().split('T')[0];

  const breaks = await query<{ id: number; ts: string; kind: 'eye' | 'water' | 'stand' | 'stretch'; outcome: string; amount_ml: number }>(
    `SELECT id, ts, kind, outcome, amount_ml 
     FROM break_events 
     WHERE user_id = ? AND DATE(ts) = ? 
     ORDER BY ts ASC`,
    [userId, date]
  );

  const summary = {
    eye: 0,
    water: 0,
    waterTotalMl: 0,
    stand: 0,
    stretch: 0,
  };

  for (const b of breaks) {
    if (b.outcome === 'done') {
      summary[b.kind]++;
      if (b.kind === 'water' && b.amount_ml) {
        summary.waterTotalMl += b.amount_ml;
      }
    }
  }

  res.json({
    date,
    totalCompleted: summary.eye + summary.water + summary.stand + summary.stretch,
    summary,
    breaks,
  });
});
