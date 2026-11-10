/**
 * OfficeCore Mobile API Client & WebSocket Service
 */

export const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.0.22:3000';
export const DEMO_TOKEN = process.env.EXPO_PUBLIC_DEMO_TOKEN || 'officecore_phone_demo_token_2026';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${DEMO_TOKEN}`,
    ...(options.headers || {}),
  };

  try {
    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
      const errorBody = await res.text();
      throw new Error(`HTTP ${res.status}: ${errorBody}`);
    }
    return (await res.json()) as T;
  } catch (err) {
    console.warn(`[API] Error on ${options.method || 'GET'} ${endpoint}:`, err);
    throw err;
  }
}

export const api = {
  // Me & Settings
  getMe: () => request<any>('/me'),
  updateSettings: (data: any) => request<any>('/me/settings', { method: 'PATCH', body: JSON.stringify(data) }),

  // Energy
  getEnergyNow: () => request<any>('/energy/now'),
  getEnergyDay: (date?: string) => request<any>(`/energy/day${date ? `?date=${date}` : ''}`),

  // Posture
  getPostureDay: (date?: string) => request<any>(`/posture/day${date ? `?date=${date}` : ''}`),
  getPostureWeek: () => request<any>('/posture/week'),
  getPostureCalibration: () => request<any>('/posture/calibration'),
  savePostureCalibration: (data: any) => request<any>('/posture/calibration', { method: 'POST', body: JSON.stringify(data) }),

  // Focus
  getFocusSessions: (from?: string, to?: string) =>
    request<any>(`/focus/sessions?from=${from || ''}&to=${to || ''}`),
  startFocusSession: (planned_min: number = 25) =>
    request<any>('/focus/sessions', { method: 'POST', body: JSON.stringify({ planned_min, source: 'manual' }) }),
  finishFocusSession: (id: number) =>
    request<any>(`/focus/sessions/${id}`, { method: 'PATCH', body: JSON.stringify({ end_time: new Date().toISOString() }) }),

  // Caffeine
  getCaffeineDay: (date?: string) => request<any>(`/caffeine/day${date ? `?date=${date}` : ''}`),
  logCaffeine: (drink_type: string, size: string, mg: number) =>
    request<any>('/caffeine/logs', { method: 'POST', body: JSON.stringify({ drink_type, size, mg }) }),
  deleteCaffeine: (id: number) => request<any>(`/caffeine/logs/${id}`, { method: 'DELETE' }),
  getCaffeineCutoff: () => request<any>('/caffeine/cutoff'),

  // Sleep
  getSleepWeek: () => request<any>('/sleep/week'),
  logSleep: (data: { bedtime: string; wake: string; duration_min: number; quality: number; date?: string }) =>
    request<any>('/sleep/logs', { method: 'POST', body: JSON.stringify(data) }),

  // Wellbeing & Environment
  getStressEvents: (from?: string, to?: string) => request<any>(`/wellbeing/stress?from=${from || ''}&to=${to || ''}`),
  tagStress: (id: number, trigger_tag: string) =>
    request<any>(`/wellbeing/stress/${id}/tag`, { method: 'POST', body: JSON.stringify({ trigger_tag }) }),
  logBreathing: (data: { duration_s: number; pattern: string; hr_before: number; hr_after: number }) =>
    request<any>('/wellbeing/breathing', { method: 'POST', body: JSON.stringify(data) }),
  getEnvironmentDay: (date?: string) => request<any>(`/wellbeing/environment/day${date ? `?date=${date}` : ''}`),

  // Breaks
  getBreaksDay: (date?: string) => request<any>(`/breaks/day${date ? `?date=${date}` : ''}`),
  logBreak: (kind: 'eye' | 'water' | 'stand' | 'stretch', outcome: string = 'done', amount_ml?: number) =>
    request<any>('/breaks', { method: 'POST', body: JSON.stringify({ kind, outcome, amount_ml }) }),

  // Alerts & Rules
  getAlertsDay: (date?: string) => request<any>(`/alerts/day${date ? `?date=${date}` : ''}`),
  requestAlert: (type: string, priority?: string) =>
    request<any>('/alerts/request', { method: 'POST', body: JSON.stringify({ type, priority }) }),
  updateAlertOutcome: (id: number, outcome: string, snooze_min?: number) =>
    request<any>(`/alerts/${id}/outcome`, { method: 'POST', body: JSON.stringify({ outcome, snooze_min }) }),
  getRules: () => request<any>('/rules'),
  updateRule: (type: string, data: any) => request<any>(`/rules/${type}`, { method: 'PUT', body: JSON.stringify(data) }),

  // History & Trends
  getHistoryWeek: () => request<any>('/history/week'),
  getHistoryTrends: (weeks: number = 4) => request<any>(`/history/trends?weeks=${weeks}`),

  // AI Assistant
  getAiSummary: (date?: string) => request<any>(`/ai/summary${date ? `?date=${date}` : ''}`),
  generateAiSummary: (force: boolean = false, date?: string) =>
    request<any>('/ai/summary', { method: 'POST', body: JSON.stringify({ force, date }) }),
  sendAiChat: (message: string) => request<any>('/ai/chat', { method: 'POST', body: JSON.stringify({ message }) }),
  getAiChatHistory: () => request<any>('/ai/chat/history'),

  // Devices & Pairing
  getDevices: () => request<any>('/devices'),
  createPairingCode: () => request<any>('/pairing/code', { method: 'POST' }),

  // Calendar
  syncCalendar: (events: any[]) => request<any>('/calendar/sync', { method: 'POST', body: JSON.stringify({ events }) }),
};

// WebSocket Real-time Manager
type WSCallback = (message: any) => void;
class WebSocketClient {
  private ws: WebSocket | null = null;
  private listeners: WSCallback[] = [];

  connect() {
    const wsUrl = API_BASE.replace(/^http/, 'ws') + `/ws?token=${DEMO_TOKEN}`;
    try {
      this.ws = new WebSocket(wsUrl);
      this.ws.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          this.listeners.forEach((cb) => cb(parsed));
        } catch (e) {}
      };
      this.ws.onclose = () => {
        setTimeout(() => this.connect(), 5000);
      };
    } catch (e) {
      console.warn('[WS] Connection failed:', e);
    }
  }

  subscribe(cb: WSCallback) {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }
}

export const wsClient = new WebSocketClient();
