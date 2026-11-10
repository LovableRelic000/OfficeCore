import { Router } from 'express';
import { query } from '../db/index.js';

export const healthRouter = Router();

healthRouter.get('/', async (req, res) => {
  try {
    const [dbRes] = await query<{ one: number }>('SELECT 1 as one');
    res.json({
      status: 'ok',
      database: dbRes?.one === 1 ? 'connected' : 'unhealthy',
      service: 'OfficeCore Backend API',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
    });
  } catch (err: any) {
    res.status(500).json({
      status: 'error',
      database: 'disconnected',
      error: err.message,
      timestamp: new Date().toISOString(),
    });
  }
});

