import { Router } from 'express';
import { query, execute } from '../db/index.js';
import { z } from 'zod';
import { broadcastCalibrationCommand } from '../ws/server.js';

export const postureRouter = Router();

postureRouter.get('/day', async (req, res) => {
  const userId = req.user?.id || 1;
  const date = (req.query.date as string) || new Date().toISOString().split('T')[0];

  const windows = await query<{
    ts_start: string;
    duration_s: number;
    typing: number;
    roll_dev: number;
    pitch_dev: number;
    deviation_deg: number;
    band: 'green' | 'amber' | 'red';
  }>(
    `SELECT ts_start, duration_s, typing, roll_dev, pitch_dev, deviation_deg, band 
     FROM posture_windows 
     WHERE user_id = ? AND DATE(ts_start) = ? 
     ORDER BY ts_start ASC`,
    [userId, date]
  );

  let greenCount = 0;
  let amberCount = 0;
  let redCount = 0;

  for (const w of windows) {
    if (w.band === 'green') greenCount++;
    else if (w.band === 'amber') amberCount++;
    else if (w.band === 'red') redCount++;
  }

  const total = windows.length || 1;
  // duration is usually 5s or 120s; estimate minutes in amber/red
  const amberMinutes = Math.round((amberCount * 2 * 10) / 10);
  const redMinutes = Math.round((redCount * 2 * 10) / 10);
  const ergonomicDebt = amberMinutes * 1 + redMinutes * 2;

  res.json({
    date,
    totalWindows: windows.length,
    ergonomicDebtMinutes: ergonomicDebt,
    bands: {
      greenPct: Math.round((greenCount / total) * 100),
      amberPct: Math.round((amberCount / total) * 100),
      redPct: Math.round((redCount / total) * 100),
      amberMinutes,
      redMinutes,
    },
    windows: windows.slice(-50), // return recent 50 for UI chart
  });
});

postureRouter.get('/week', async (req, res) => {
  const userId = req.user?.id || 1;

  const rows = await query<{
    day: string;
    band: 'green' | 'amber' | 'red';
    count: number;
  }>(
    `SELECT DATE(ts_start) as day, band, COUNT(*) as count 
     FROM posture_windows 
     WHERE user_id = ? AND ts_start >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) 
     GROUP BY DATE(ts_start), band 
     ORDER BY day ASC`,
    [userId]
  );

  const daysMap: Record<string, { green: number; amber: number; red: number; debt: number }> = {};
  for (const r of rows) {
    if (!daysMap[r.day]) {
      daysMap[r.day] = { green: 0, amber: 0, red: 0, debt: 0 };
    }
    if (r.band === 'green') daysMap[r.day].green += r.count;
    if (r.band === 'amber') {
      daysMap[r.day].amber += r.count;
      daysMap[r.day].debt += r.count * 2; // ~2 min per window
    }
    if (r.band === 'red') {
      daysMap[r.day].red += r.count;
      daysMap[r.day].debt += r.count * 4;
    }
  }

  const dailyTrends = Object.entries(daysMap).map(([day, val]) => {
    const total = val.green + val.amber + val.red || 1;
    return {
      date: day,
      debtMinutes: val.debt,
      greenPct: Math.round((val.green / total) * 100),
      amberPct: Math.round((val.amber / total) * 100),
      redPct: Math.round((val.red / total) * 100),
    };
  });

  res.json({ dailyTrends });
});

postureRouter.get('/calibration', async (req, res) => {
  const userId = req.user?.id || 1;
  const [calibration] = await query(
    `SELECT kind, data_json, created_at FROM calibrations 
     WHERE user_id = ? AND kind = 'posture' 
     ORDER BY created_at DESC LIMIT 1`,
    [userId]
  );

  res.json({
    calibrated: !!calibration,
    calibration: calibration ? {
      ...calibration,
      data: typeof calibration.data_json === 'string' ? JSON.parse(calibration.data_json) : calibration.data_json,
    } : null,
  });
});

const saveCalibrationSchema = z.object({
  gravity_vector: z.object({
    x: z.number(),
    y: z.number(),
    z: z.number(),
  }),
  roll_ref: z.number(),
  pitch_ref: z.number(),
  duration_s: z.number().default(30),
  samples_count: z.number().default(150),
});

postureRouter.post('/calibration', async (req, res) => {
  const userId = req.user?.id || 1;
  const parsed = saveCalibrationSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.format() });
  }

  await execute(
    `INSERT INTO calibrations (user_id, device_id, kind, data_json)
     VALUES (?, ?, 'posture', ?)`,
    [userId, req.user?.deviceId || null, JSON.stringify(parsed.data)]
  );

  broadcastCalibrationCommand(userId, { action: 'calibration_saved', data: parsed.data });

  res.json({
    success: true,
    message: 'Calibration saved successfully',
  });
});
