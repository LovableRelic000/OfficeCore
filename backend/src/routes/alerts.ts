import { Router } from 'express';
import { query, execute } from '../db/index.js';
import { z } from 'zod';
import { evaluateAlertPolicy } from '../engine/policy.js';
import { broadcastAlert } from '../ws/server.js';

export const alertsRouter = Router();

const alertRequestSchema = z.object({
  type: z.enum(['posture', 'eye_break', 'water', 'stand', 'caffeine_limit', 'stress']),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  inDeepFocus: z.boolean().optional(),
  inMeeting: z.boolean().optional(),
  isTyping: z.boolean().optional(),
  typingDurationSeconds: z.number().optional(),
  idleSeconds: z.number().optional(),
});

alertsRouter.post('/request', async (req, res) => {
  const userId = req.user?.id || 1;
  const parsed = alertRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.format() });
  }

  // Fetch recent alerts in past 1 hour for frequency limits
  const recentAlertsThisHour = await query<{ type: string; ts: string; outcome: string }>(
    `SELECT type, ts, outcome FROM alerts 
     WHERE user_id = ? AND ts >= DATE_SUB(NOW(), INTERVAL 1 HOUR) 
     ORDER BY ts DESC`,
    [userId]
  );

  const recentAlertsOfSameType = await query<{ ts: string; outcome: string }>(
    `SELECT ts, outcome FROM alerts 
     WHERE user_id = ? AND type = ? AND ts >= DATE_SUB(NOW(), INTERVAL 2 HOUR) 
     ORDER BY ts DESC`,
    [userId, parsed.data.type]
  );

  const decision = evaluateAlertPolicy({
    userId,
    type: parsed.data.type,
    priority: parsed.data.priority,
    inDeepFocus: parsed.data.inDeepFocus,
    inMeeting: parsed.data.inMeeting,
    isTyping: parsed.data.isTyping,
    typingDurationSeconds: parsed.data.typingDurationSeconds,
    idleSeconds: parsed.data.idleSeconds,
    currentTime: new Date(),
    recentAlertsThisHour,
    recentAlertsOfSameType,
  });

  const alertResult = await execute(
    `INSERT INTO alerts (user_id, ts, type, priority, deferred_until, delivered_to, outcome)
     VALUES (?, NOW(), ?, ?, ?, 'watch', ?)`,
    [
      userId,
      parsed.data.type,
      parsed.data.priority || 'normal',
      decision.defer_until ? new Date(decision.defer_until) : null,
      decision.decision === 'deliver' ? 'delivered' : (decision.decision === 'defer' ? 'deferred' : 'dropped'),
    ]
  );

  const alertId = alertResult.insertId;

  if (decision.decision === 'deliver') {
    broadcastAlert(userId, {
      id: alertId,
      type: parsed.data.type,
      copy: decision.copy,
      haptic_pattern: decision.haptic_pattern,
      ts: new Date().toISOString(),
    });
  }

  res.json({
    ...decision,
    alertId,
  });
});

const alertOutcomeSchema = z.object({
  outcome: z.enum(['delivered', 'deferred', 'dropped', 'snoozed', 'dismissed', 'acted']),
  snooze_min: z.number().int().positive().optional(),
});

alertsRouter.post('/:id/outcome', async (req, res) => {
  const userId = req.user?.id || 1;
  const alertId = parseInt(req.params.id, 10);
  const parsed = alertOutcomeSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.format() });
  }

  const { outcome, snooze_min } = parsed.data;
  await execute(
    `UPDATE alerts SET outcome = ?, snooze_min = ? WHERE id = ? AND user_id = ?`,
    [outcome, snooze_min || null, alertId, userId]
  );

  res.json({ success: true, message: 'Alert outcome updated' });
});

alertsRouter.get('/day', async (req, res) => {
  const userId = req.user?.id || 1;
  const date = (req.query.date as string) || new Date().toISOString().split('T')[0];

  const alerts = await query(
    `SELECT id, ts, type, priority, deferred_until, delivered_to, outcome, snooze_min 
     FROM alerts 
     WHERE user_id = ? AND DATE(ts) = ? 
     ORDER BY ts DESC`,
    [userId, date]
  );

  res.json({
    date,
    count: alerts.length,
    alerts,
  });
});
