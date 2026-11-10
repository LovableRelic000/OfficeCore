import http from 'http';
import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import { config } from './config.js';
import { authMiddleware } from './middleware/auth.js';
import { setupWebSocketServer } from './ws/server.js';

// Route imports
import { healthRouter } from './routes/health.js';
import { meRouter } from './routes/me.js';
import { energyRouter } from './routes/energy.js';
import { ingestRouter } from './routes/ingest.js';
import { postureRouter } from './routes/posture.js';
import { focusRouter } from './routes/focus.js';
import { caffeineRouter } from './routes/caffeine.js';
import { sleepRouter } from './routes/sleep.js';
import { wellbeingRouter } from './routes/wellbeing.js';
import { breaksRouter } from './routes/breaks.js';
import { alertsRouter } from './routes/alerts.js';
import { rulesRouter } from './routes/rules.js';
import { historyRouter } from './routes/history.js';
import { aiRouter } from './routes/ai.js';
import { pairingRouter } from './routes/pairing.js';
import { devicesRouter } from './routes/devices.js';
import { calendarRouter } from './routes/calendar.js';

const app = express();

// Middlewares
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '5mb' }));

// Health check (unauthenticated)
app.use('/health', healthRouter);

// Authenticated routes
app.use(authMiddleware);
app.use('/me', meRouter);
app.use('/energy', energyRouter);
app.use('/ingest', ingestRouter);
app.use('/posture', postureRouter);
app.use('/focus', focusRouter);
app.use('/caffeine', caffeineRouter);
app.use('/sleep', sleepRouter);
app.use('/wellbeing', wellbeingRouter);
app.use('/breaks', breaksRouter);
app.use('/alerts', alertsRouter);
app.use('/rules', rulesRouter);
app.use('/history', historyRouter);
app.use('/ai', aiRouter);
app.use('/pairing', pairingRouter);
app.use('/devices', devicesRouter);
app.use('/calendar', calendarRouter);

const server = http.createServer(app);

// WebSocket server setup
const wss = new WebSocketServer({ server, path: '/ws' });
setupWebSocketServer(wss);

server.listen(config.port, '0.0.0.0', () => {
  console.log(`====================================================`);
  console.log(`  OfficeCore Backend listening on 0.0.0.0:${config.port}`);
  console.log(`  WebSocket Server available on ws://0.0.0.0:${config.port}/ws`);
  console.log(`  AI Model: ${config.gemini.model}`);
  console.log(`====================================================`);
});

