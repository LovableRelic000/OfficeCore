import { Router } from 'express';
import { query, execute } from '../db/index.js';
import { z } from 'zod';

export const meRouter = Router();

meRouter.get('/', async (req, res) => {
  const userId = req.user?.id || 1;
  const [user] = await query(
    `SELECT id, name, email, timezone, work_start, work_end, bedtime, caffeine_limit_mg, caffeine_half_life_h, settings_json 
     FROM users WHERE id = ? LIMIT 1`,
    [userId]
  );

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({
    ...user,
    settings: typeof user.settings_json === 'string' ? JSON.parse(user.settings_json) : (user.settings_json || {}),
  });
});

const patchSettingsSchema = z.object({
  work_start: z.string().optional(),
  work_end: z.string().optional(),
  bedtime: z.string().optional(),
  caffeine_limit_mg: z.number().int().positive().optional(),
  caffeine_half_life_h: z.number().positive().optional(),
  settings: z.record(z.any()).optional(),
});

meRouter.patch('/settings', async (req, res) => {
  const userId = req.user?.id || 1;
  const parsed = patchSettingsSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.format() });
  }

  const { work_start, work_end, bedtime, caffeine_limit_mg, caffeine_half_life_h, settings } = parsed.data;
  const updates: string[] = [];
  const params: any[] = [];

  if (work_start !== undefined) { updates.push('work_start = ?'); params.push(work_start); }
  if (work_end !== undefined) { updates.push('work_end = ?'); params.push(work_end); }
  if (bedtime !== undefined) { updates.push('bedtime = ?'); params.push(bedtime); }
  if (caffeine_limit_mg !== undefined) { updates.push('caffeine_limit_mg = ?'); params.push(caffeine_limit_mg); }
  if (caffeine_half_life_h !== undefined) { updates.push('caffeine_half_life_h = ?'); params.push(caffeine_half_life_h); }
  if (settings !== undefined) { updates.push('settings_json = ?'); params.push(JSON.stringify(settings)); }

  if (updates.length > 0) {
    params.push(userId);
    await execute(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);
  }

  res.json({ success: true, message: 'Settings updated' });
});
