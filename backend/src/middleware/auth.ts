import { Request, Response, NextFunction } from 'express';
import { query, execute, hashToken } from '../db/index.js';

export interface AuthenticatedUser {
  id: number;
  name: string;
  email: string;
  deviceId: number;
  deviceType: 'watch' | 'phone' | 'pc';
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  // Allow health endpoint without token
  if (req.path === '/health') {
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // For local demo convenience if no header provided, fallback to demo user
    const [demoDevice] = await query<{ id: number; user_id: number; type: 'watch' | 'phone' | 'pc'; name: string; email: string }>(
      `SELECT d.id, d.user_id, d.type, u.name, u.email 
       FROM devices d 
       JOIN users u ON d.user_id = u.id 
       WHERE u.email = ? LIMIT 1`,
      ['alex.rivera@officecore.internal']
    );

    if (demoDevice) {
      req.user = {
        id: demoDevice.user_id,
        name: demoDevice.name,
        email: demoDevice.email,
        deviceId: demoDevice.id,
        deviceType: demoDevice.type,
      };
      return next();
    }

    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  const token = authHeader.substring(7).trim();
  const tokenHash = hashToken(token);

  try {
    const [device] = await query<{ id: number; user_id: number; type: 'watch' | 'phone' | 'pc'; name: string; email: string }>(
      `SELECT d.id, d.user_id, d.type, u.name, u.email
       FROM devices d
       JOIN users u ON d.user_id = u.id
       WHERE d.token_hash = ? LIMIT 1`,
      [tokenHash]
    );

    if (!device) {
      return res.status(401).json({ error: 'Invalid device token' });
    }

    // Update last_seen asynchronously
    execute(`UPDATE devices SET last_seen = NOW() WHERE id = ?`, [device.id]).catch(() => {});

    req.user = {
      id: device.user_id,
      name: device.name,
      email: device.email,
      deviceId: device.id,
      deviceType: device.type,
    };

    next();
  } catch (err) {
    console.error('[AuthMiddleware] Error:', err);
    res.status(500).json({ error: 'Internal auth validation error' });
  }
}
