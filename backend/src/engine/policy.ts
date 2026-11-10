/**
 * OfficeCore Notification Policy Engine
 * Evaluates context (focus, meetings, typing flow, frequency limits)
 * and determines whether to deliver, defer, or drop an alert.
 */

export interface AlertRequestInput {
  userId: number;
  type: 'posture' | 'eye_break' | 'water' | 'stand' | 'caffeine_limit' | 'stress';
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  inDeepFocus?: boolean;
  inMeeting?: boolean;
  isTyping?: boolean;
  typingDurationSeconds?: number;
  idleSeconds?: number;
  currentTime?: Date;
  recentAlertsThisHour?: Array<{ type: string; ts: Date | string; outcome: string }>;
  recentAlertsOfSameType?: Array<{ ts: Date | string; outcome: string }>;
  repeatedSnoozeCount?: number;
}

export interface PolicyDecision {
  decision: 'deliver' | 'defer' | 'drop';
  defer_until?: string;
  haptic_pattern: string;
  copy: {
    title: string;
    body: string;
    actionPrimary: string;
    actionSecondary?: string;
  };
  reason: string;
}

const HAPTIC_PATTERNS: Record<string, string> = {
  posture: 'two_short_pulses',
  eye_break: 'long_gentle_pulse',
  water: 'three_light_taps',
  caffeine_limit: 'ascending_pulses',
  stress: 'double_slow_pulse',
  stand: 'medium_double_pulse',
  focus_end: 'long_crescendo_pulse',
  breathing: 'inhale_ascend_exhale_long',
};

const COOLDOWN_MINUTES: Record<string, number> = {
  posture: 20,
  eye_break: 20,
  water: 45,
  stand: 45,
  caffeine_limit: 60,
  stress: 30,
};

const ALERT_COPY: Record<string, { title: string; body: string; primary: string; secondary?: string }> = {
  posture: {
    title: 'Postura de muñeca',
    body: 'Desviación sostenida detectada. Relaja la mano en postura neutral.',
    primary: 'Hecho',
    secondary: 'Posponer',
  },
  eye_break: {
    title: 'Descanso 20-20-20',
    body: 'Mira a 6 metros durante 20 segundos para descansar la vista.',
    primary: 'Iniciar 20s',
    secondary: 'Omitir',
  },
  water: {
    title: 'Hora de hidratarse',
    body: 'Toma un sorbo de agua para mantener tu rendimiento mental.',
    primary: 'Tomé agua',
    secondary: 'Recordar luego',
  },
  stand: {
    title: 'Pausa activa',
    body: 'Llevas más de 50 minutos sentado. Ponte de pie y estírate un momento.',
    primary: 'Listo',
    secondary: '10 min más',
  },
  caffeine_limit: {
    title: 'Hora límite de cafeína',
    body: 'Para proteger tu sueño profundo de hoy, evita consumir más cafeína.',
    primary: 'Entendido',
    secondary: 'Ver curva',
  },
  stress: {
    title: 'Pico de tensión detectado',
    body: 'Tu pulso se elevó en reposo. ¿Deseas hacer 60s de respiración?',
    primary: 'Respirar',
    secondary: 'Más tarde',
  },
};

export function evaluateAlertPolicy(input: AlertRequestInput): PolicyDecision {
  const priority = input.priority || (input.type === 'caffeine_limit' ? 'high' : 'normal');
  const now = input.currentTime || new Date();
  const alertCopy = ALERT_COPY[input.type] || {
    title: 'Aviso de bienestar',
    body: 'Pausa sugerida para mantener tu rendimiento.',
    primary: 'OK',
  };

  // 1. Check max alerts per hour limit (default 4)
  const deliveredThisHour = (input.recentAlertsThisHour || []).filter(
    (a) => a.outcome === 'delivered' || a.outcome === 'acted'
  ).length;

  if (deliveredThisHour >= 4 && priority !== 'urgent') {
    return {
      decision: 'drop',
      haptic_pattern: HAPTIC_PATTERNS[input.type] || 'two_short_pulses',
      copy: {
        title: alertCopy.title,
        body: alertCopy.body,
        actionPrimary: alertCopy.primary,
        actionSecondary: alertCopy.secondary,
      },
      reason: 'Exceeded maximum alerts per hour threshold (4/h)',
    };
  }

  // 2. Check cooldown for same alert type
  const cooldownMin = COOLDOWN_MINUTES[input.type] || 20;
  if (input.recentAlertsOfSameType && input.recentAlertsOfSameType.length > 0) {
    const lastAlert = input.recentAlertsOfSameType[0];
    const diffMs = now.getTime() - new Date(lastAlert.ts).getTime();
    const diffMin = diffMs / (1000 * 60);
    if (diffMin < cooldownMin && priority !== 'urgent' && priority !== 'high') {
      return {
        decision: 'drop',
        haptic_pattern: HAPTIC_PATTERNS[input.type] || 'two_short_pulses',
        copy: {
          title: alertCopy.title,
          body: alertCopy.body,
          actionPrimary: alertCopy.primary,
          actionSecondary: alertCopy.secondary,
        },
        reason: `Cooldown active for ${input.type} (${Math.round(diffMin)}/${cooldownMin} min)`,
      };
    }
  }

  // 3. Check Deep Focus Mode
  if (input.inDeepFocus) {
    if (priority !== 'high' && priority !== 'urgent') {
      const deferMs = now.getTime() + 15 * 60 * 1000;
      return {
        decision: 'defer',
        defer_until: new Date(deferMs).toISOString(),
        haptic_pattern: HAPTIC_PATTERNS[input.type] || 'two_short_pulses',
        copy: {
          title: alertCopy.title,
          body: alertCopy.body,
          actionPrimary: alertCopy.primary,
          actionSecondary: alertCopy.secondary,
        },
        reason: 'User is in deep focus session; non-urgent alert deferred',
      };
    }
  }

  // 4. Check Meeting Mode
  if (input.inMeeting) {
    if (priority !== 'urgent') {
      const deferMs = now.getTime() + 10 * 60 * 1000;
      return {
        decision: 'defer',
        defer_until: new Date(deferMs).toISOString(),
        haptic_pattern: HAPTIC_PATTERNS[input.type] || 'two_short_pulses',
        copy: {
          title: alertCopy.title,
          body: alertCopy.body,
          actionPrimary: alertCopy.primary,
          actionSecondary: alertCopy.secondary,
        },
        reason: 'User is currently in a scheduled meeting; deferred',
      };
    }
  }

  // 5. Check Natural Break Opportunity
  // If user is actively typing right now without pause, check if we should wait for a natural gap
  if (input.isTyping && (input.idleSeconds ?? 0) < 5 && priority === 'normal') {
    // If they have been typing for a while, defer until a small pause (e.g. 20s pause)
    const deferMs = now.getTime() + 2 * 60 * 1000;
    return {
      decision: 'defer',
      defer_until: new Date(deferMs).toISOString(),
      haptic_pattern: HAPTIC_PATTERNS[input.type] || 'two_short_pulses',
      copy: {
        title: alertCopy.title,
        body: alertCopy.body,
        actionPrimary: alertCopy.primary,
        actionSecondary: alertCopy.secondary,
      },
      reason: 'Active typing keystroke flow detected; waiting for natural micro-pause',
    };
  }

  // 6. Deliver Alert!
  return {
    decision: 'deliver',
    haptic_pattern: HAPTIC_PATTERNS[input.type] || 'two_short_pulses',
    copy: {
      title: alertCopy.title,
      body: alertCopy.body,
      actionPrimary: alertCopy.primary,
      actionSecondary: alertCopy.secondary,
    },
    reason: 'Policy conditions satisfied for immediate delivery',
  };
}
