import { Router } from 'express';
import { query, execute, hashToken } from '../db/index.js';
import crypto from 'crypto';
import { z } from 'zod';

export const pairingRouter = Router();

// Mobile app requests a 6-digit pairing code
pairingRouter.post('/code', async (req, res) => {
  const userId = req.user?.id || 1;
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 min expiry

  await execute(
    `INSERT INTO pairing_codes (user_id, code, expires_at) VALUES (?, ?, ?)`,
    [userId, code, expiresAt]
  );

  res.json({
    code,
    expiresAt: expiresAt.toISOString(),
  });
});

const claimCodeSchema = z.object({
  code: z.string().length(6),
  device_name: z.string().default('PC Agent'),
  device_type: z.enum(['pc', 'watch', 'phone']).default('pc'),
});

// PC Agent (or another device) claims the code
pairingRouter.post('/claim', async (req, res) => {
  const parsed = claimCodeSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.format() });
  }

  const { code, device_name, device_type } = parsed.data;

  const [pairing] = await query<{ id: number; user_id: number }>(
    `SELECT id, user_id FROM pairing_codes 
     WHERE code = ? AND expires_at > NOW() AND claimed_by_device_id IS NULL 
     ORDER BY created_at DESC LIMIT 1`,
    [code]
  );

  if (!pairing) {
    return res.status(400).json({ error: 'Código de emparejamiento inválido o expirado' });
  }

  // Generate new device token
  const token = `officecore_${device_type}_${crypto.randomBytes(16).toString('hex')}`;
  const tokenHashed = hashToken(token);

  const deviceResult = await execute(
    `INSERT INTO devices (user_id, type, name, token_hash, last_seen, battery_pct)
     VALUES (?, ?, ?, ?, NOW(), 100)`,
    [pairing.user_id, device_type, device_name, tokenHashed]
  );

  const deviceId = deviceResult.insertId;
  await execute(`UPDATE pairing_codes SET claimed_by_device_id = ? WHERE id = ?`, [deviceId, pairing.id]);

  res.json({
    success: true,
    token,
    deviceId,
    userId: pairing.user_id,
  });
});

