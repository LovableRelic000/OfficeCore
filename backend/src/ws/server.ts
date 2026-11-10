import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { query, hashToken } from '../db/index.js';

interface ConnectedClient {
  ws: WebSocket;
  userId: number;
  deviceId: number;
  deviceType: 'watch' | 'phone' | 'pc';
  isAlive: boolean;
}

const clients: ConnectedClient[] = [];

export function setupWebSocketServer(wss: WebSocketServer) {
  wss.on('connection', async (ws: WebSocket, req: IncomingMessage) => {
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    const token = url.searchParams.get('token');

    let userId = 1;
    let deviceId = 1;
    let deviceType: 'watch' | 'phone' | 'pc' = 'phone';

    if (token) {
      const tokenHash = hashToken(token);
      const [device] = await query<{ id: number; user_id: number; type: 'watch' | 'phone' | 'pc' }>(
        `SELECT id, user_id, type FROM devices WHERE token_hash = ? LIMIT 1`,
        [tokenHash]
      );
      if (device) {
        userId = device.user_id;
        deviceId = device.id;
        deviceType = device.type;
      }
    }

    const client: ConnectedClient = {
      ws,
      userId,
      deviceId,
      deviceType,
      isAlive: true,
    };

    clients.push(client);
    console.log(`[WebSocket] Client connected: user=${userId}, device=${deviceType} (${deviceId})`);

    // Send initial connection ack
    ws.send(JSON.stringify({ type: 'connected', userId, deviceType, ts: new Date().toISOString() }));

    ws.on('pong', () => {
      client.isAlive = true;
    });

    ws.on('message', (data: string) => {
      try {
        const parsed = JSON.parse(data.toString());
        if (parsed.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong', ts: new Date().toISOString() }));
        } else if (parsed.type === 'presence') {
          // Client heartbeat/presence
          client.isAlive = true;
        } else if (parsed.type === 'ack') {
          // Alert or event ack
          console.log(`[WebSocket] Ack received from ${deviceType}:`, parsed);
        }
      } catch (e) {
        // ignore non-json messages
      }
    });

    ws.on('close', () => {
      const idx = clients.indexOf(client);
      if (idx !== -1) {
        clients.splice(idx, 1);
        console.log(`[WebSocket] Client disconnected: ${deviceType} (${deviceId})`);
      }
    });
  });

  // Heartbeat interval
  setInterval(() => {
    wss.clients.forEach((ws) => {
      const client = clients.find((c) => c.ws === ws);
      if (client) {
        if (!client.isAlive) {
          ws.terminate();
          return;
        }
        client.isAlive = false;
        ws.ping();
      }
    });
  }, 30000);
}

export function broadcastToUser(userId: number, payload: any) {
  const message = JSON.stringify(payload);
  for (const client of clients) {
    if (client.userId === userId && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(message);
    }
  }
}

export function broadcastEnergyUpdate(userId: number, energy: any) {
  broadcastToUser(userId, { type: 'energy_update', data: energy, ts: new Date().toISOString() });
}

export function broadcastAlert(userId: number, alert: any) {
  broadcastToUser(userId, { type: 'alert', data: alert, ts: new Date().toISOString() });
}

export function broadcastFocusState(userId: number, focus: any) {
  broadcastToUser(userId, { type: 'focus_state', data: focus, ts: new Date().toISOString() });
}

export function broadcastCalibrationCommand(userId: number, command: any) {
  broadcastToUser(userId, { type: 'calibration_command', data: command, ts: new Date().toISOString() });
}
