import { Router } from 'express';
import { execute } from '../db/index.js';
import { z } from 'zod';
import crypto from 'crypto';

export const calendarRouter = Router();

const calendarSyncSchema = z.object({
  events: z.array(z.object({
    start_time: z.string(),
    end_time: z.string(),
    is_meeting: z.boolean().default(true),
    title: z.string().optional(),
    title_hash: z.string().optional(),
  })),
});

calendarRouter.post('/sync', async (req, res) => {
  const userId = req.user?.id || 1;
  const parsed = calendarSyncSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.format() });
  }

  const { events } = parsed.data;
  let synced = 0;

  for (const ev of events) {
    const hash = ev.title_hash || (ev.title ? crypto.createHash('sha256').update(ev.title).digest('hex').substring(0, 32) : 'meeting_anonymous');
    await execute(
      `INSERT INTO calendar_events (user_id, start_time, end_time, title_hash, is_meeting)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, new Date(ev.start_time), new Date(ev.end_time), hash, ev.is_meeting]
    );
    synced++;
  }

  res.json({
    success: true,
    eventsSynced: synced,
  });
});

