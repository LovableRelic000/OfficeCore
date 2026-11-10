import { Router } from 'express';
import { query } from '../db/index.js';

export const devicesRouter = Router();

devicesRouter.get('/', async (req, res) => {
  const userId = req.user?.id || 1;

  const devices = await query(
    `SELECT id, type, name, last_seen, battery_pct, paired_at 
     FROM devices 
     WHERE user_id = ? 
     ORDER BY paired_at ASC`,
    [userId]
  );

  res.json({ devices });
});
