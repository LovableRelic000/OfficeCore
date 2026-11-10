import { Router } from 'express';
import { query, execute } from '../db/index.js';
import { z } from 'zod';

export const rulesRouter = Router();

rulesRouter.get('/', async (req, res) => {
  const userId = req.user?.id || 1;
  const rules = await query(
    `SELECT type, enabled, intensity, quiet_start, quiet_end, priority, max_per_hour 
     FROM alert_rules 
     WHERE user_id = ?`,
    [userId]
  );

  res.json({ rules });
});

const updateRuleSchema = z.object({
  enabled: z.boolean().optional(),
  intensity: z.enum(['gentle', 'normal', 'strong']).optional(),
  quiet_start: z.string().nullable().optional(),
  quiet_end: z.string().nullable().optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  max_per_hour: z.number().int().min(1).max(10).optional(),
});

rulesRouter.put('/:type', async (req, res) => {
  const userId = req.user?.id || 1;
  const ruleType = req.params.type;
  const parsed = updateRuleSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.format() });
  }

  const { enabled, intensity, quiet_start, quiet_end, priority, max_per_hour } = parsed.data;
  const updates: string[] = [];
  const params: any[] = [];

  if (enabled !== undefined) { updates.push('enabled = ?'); params.push(enabled); }
  if (intensity !== undefined) { updates.push('intensity = ?'); params.push(intensity); }
  if (quiet_start !== undefined) { updates.push('quiet_start = ?'); params.push(quiet_start); }
  if (quiet_end !== undefined) { updates.push('quiet_end = ?'); params.push(quiet_end); }
  if (priority !== undefined) { updates.push('priority = ?'); params.push(priority); }
  if (max_per_hour !== undefined) { updates.push('max_per_hour = ?'); params.push(max_per_hour); }

  if (updates.length > 0) {
    params.push(userId, ruleType);
    await execute(
      `UPDATE alert_rules SET ${updates.join(', ')} WHERE user_id = ? AND type = ?`,
      params
    );
  }

  res.json({ success: true, message: `Rule ${ruleType} updated` });
});
