import { Router } from 'express';
import { query, execute } from '../db/index.js';
import { z } from 'zod';
import { broadcastFocusState } from '../ws/server.js';

export const focusRouter = Router();

focusRouter.get('/sessions', async (req, res) => {
  const userId = req.user?.id || 1;
  const from = req.query.from as string || new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
  const to = req.query.to as string || new Date().toISOString().split('T')[0];

  const sessions = await query(
    `SELECT id, start_time, end_time, planned_min, interruptions, quality_score, source, created_at 
     FROM focus_sessions 
     WHERE user_id = ? AND DATE(start_time) BETWEEN ? AND ? 
     ORDER BY start_time DESC`,
    [userId, from, to]
  );

  let totalMinutes = 0;
  for (const s of sessions) {
    if (s.end_time) {
      const diff = (new Date(s.end_time).getTime() - new Date(s.start_time).getTime()) / (60 * 1000);
      totalMinutes += Math.round(diff);
    } else {
      totalMinutes += s.planned_min;
    }
  }

  res.json({
    totalSessions: sessions.length,
    totalMinutes,
    sessions,
  });
});

const startFocusSchema = z.object({
  planned_min: z.number().int().min(5).max(180).default(25),
  source: z.enum(['auto', 'manual']).default('manual'),
});

focusRouter.post('/sessions', async (req, res) => {
  const userId = req.user?.id || 1;
  const parsed = startFocusSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.format() });
  }

  const { planned_min, source } = parsed.data;
  const result = await execute(
    `INSERT INTO focus_sessions (user_id, start_time, planned_min, interruptions, quality_score, source)
     VALUES (?, NOW(), ?, 0, 100, ?)`,
    [userId, planned_min, source]
  );

  const sessionId = result.insertId;
  broadcastFocusState(userId, { state: 'started', sessionId, planned_min, start_time: new Date().toISOString() });

  res.json({
    success: true,
    sessionId,
    planned_min,
  });
});

const patchFocusSchema = z.object({
  end_time: z.string().optional(),
  interruptions: z.number().int().min(0).optional(),
  quality_score: z.number().int().min(0).max(100).optional(),
});

focusRouter.patch('/sessions/:id', async (req, res) => {
  const userId = req.user?.id || 1;
  const sessionId = parseInt(req.params.id, 10);
  const parsed = patchFocusSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.format() });
  }

  const { end_time, interruptions, quality_score } = parsed.data;
  const updates: string[] = [];
  const params: any[] = [];

  if (end_time !== undefined) {
    updates.push('end_time = ?');
    params.push(end_time);
  } else {
    updates.push('end_time = NOW()');
  }

  if (interruptions !== undefined) {
    updates.push('interruptions = ?');
    params.push(interruptions);
  }
  if (quality_score !== undefined) {
    updates.push('quality_score = ?');
    params.push(quality_score);
  }

  params.push(sessionId, userId);
  await execute(`UPDATE focus_sessions SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`, params);

  broadcastFocusState(userId, { state: 'finished', sessionId, end_time: end_time || new Date().toISOString() });

  res.json({ success: true, message: 'Focus session completed' });
});
