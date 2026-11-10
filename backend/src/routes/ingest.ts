import { Router } from 'express';
import { execute } from '../db/index.js';
import { z } from 'zod';
import { broadcastEnergyUpdate } from '../ws/server.js';

export const ingestRouter = Router();

const watchIngestSchema = z.object({
  batteryPct: z.number().int().min(0).max(100).optional(),
  postureWindows: z.array(z.object({
    ts_start: z.string(),
    duration_s: z.number().int().default(5),
    typing: z.boolean().default(false),
    roll_dev: z.number(),
    pitch_dev: z.number(),
    deviation_deg: z.number(),
    band: z.enum(['green', 'amber', 'red']),
  })).optional(),
  heartSamples: z.array(z.object({
    ts: z.string(),
    bpm: z.number().int(),
    moving: z.boolean().default(false),
  })).optional(),
  environmentSamples: z.array(z.object({
    ts: z.string(),
    noise_db: z.number(),
    lux: z.number(),
  })).optional(),
});

ingestRouter.post('/watch', async (req, res) => {
  const userId = req.user?.id || 1;
  const parsed = watchIngestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.format() });
  }

  const { batteryPct, postureWindows, heartSamples, environmentSamples } = parsed.data;

  if (batteryPct !== undefined && req.user?.deviceId) {
    await execute(`UPDATE devices SET battery_pct = ?, last_seen = NOW() WHERE id = ?`, [batteryPct, req.user.deviceId]);
  }

  if (postureWindows && postureWindows.length > 0) {
    for (const pw of postureWindows) {
      await execute(
        `INSERT INTO posture_windows (user_id, ts_start, duration_s, typing, roll_dev, pitch_dev, deviation_deg, band)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [userId, pw.ts_start, pw.duration_s, pw.typing, pw.roll_dev, pw.pitch_dev, pw.deviation_deg, pw.band]
      );
    }
  }

  if (heartSamples && heartSamples.length > 0) {
    for (const hs of heartSamples) {
      await execute(
        `INSERT INTO heart_samples (user_id, ts, bpm, moving) VALUES (?, ?, ?, ?)`,
        [userId, hs.ts, hs.bpm, hs.moving]
      );
    }
  }

  if (environmentSamples && environmentSamples.length > 0) {
    for (const es of environmentSamples) {
      await execute(
        `INSERT INTO environment_samples (user_id, ts, noise_db, lux) VALUES (?, ?, ?, ?)`,
        [userId, es.ts, es.noise_db, es.lux]
      );
    }
  }

  res.json({
    success: true,
    postureCount: postureWindows?.length || 0,
    heartCount: heartSamples?.length || 0,
    envCount: environmentSamples?.length || 0,
  });
});

const pcIngestSchema = z.object({
  activityWindows: z.array(z.object({
    ts_start: z.string(),
    keystrokes: z.number().int().default(0),
    keystroke_cv: z.number().default(0),
    mouse_events: z.number().int().default(0),
    idle_s: z.number().int().default(0),
    app_category: z.enum(['editor', 'terminal', 'browser', 'meeting', 'chat', 'other']).default('other'),
  })),
});

ingestRouter.post('/pc', async (req, res) => {
  const userId = req.user?.id || 1;
  const parsed = pcIngestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.format() });
  }

  const { activityWindows } = parsed.data;
  for (const aw of activityWindows) {
    await execute(
      `INSERT INTO pc_activity_windows (user_id, ts_start, keystrokes, keystroke_cv, mouse_events, idle_s, app_category)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, aw.ts_start, aw.keystrokes, aw.keystroke_cv, aw.mouse_events, aw.idle_s, aw.app_category]
    );
  }

  res.json({
    success: true,
    activityCount: activityWindows.length,
  });
});
