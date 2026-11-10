import fs from 'fs';
import path from 'path';
import { execute, query, hashToken } from '../index.js';
import { calculateEnergy } from '../../engine/energy.js';
import { calculateCurrentCaffeine, calculateCaffeineCutoff } from '../../engine/caffeine.js';

export const DEMO_TOKENS = {
  watch: 'officecore_watch_demo_token_2026',
  phone: 'officecore_phone_demo_token_2026',
  pc: 'officecore_pc_demo_token_2026',
};

// Deterministic pseudo-random number generator (Mulberry32)
function createRng(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export async function runSeed() {
  console.log('[Seed] Starting deterministic seed for Alex Rivera...');
  const rng = createRng(20261110);

  // 1. Upsert Demo User
  await execute(`DELETE FROM users WHERE email = ?`, ['alex.rivera@officecore.internal']);
  const userResult = await execute(
    `INSERT INTO users (name, email, timezone, work_start, work_end, bedtime, caffeine_limit_mg, caffeine_half_life_h, settings_json)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      'Alex Rivera',
      'alex.rivera@officecore.internal',
      'America/Mexico_City',
      '09:00:00',
      '18:00:00',
      '23:30:00',
      400,
      5.0,
      JSON.stringify({
        hapticIntensity: 'normal',
        dndDuringFocus: true,
        quietHoursEnabled: true,
        quietStart: '22:00:00',
        quietEnd: '08:00:00',
      }),
    ]
  );
  const userId = userResult.insertId;

  // 2. Devices and Tokens
  await execute(`DELETE FROM devices WHERE user_id = ?`, [userId]);
  await execute(
    `INSERT INTO devices (user_id, type, name, token_hash, last_seen, battery_pct, paired_at)
     VALUES 
      (?, 'watch', 'Galaxy Watch4 Classic', ?, NOW(), 84, NOW()),
      (?, 'phone', 'Galaxy S25 Ultra', ?, NOW(), 91, NOW()),
      (?, 'pc', 'Laptop Dev Windows 11', ?, NOW(), 100, NOW())`,
    [
      userId,
      hashToken(DEMO_TOKENS.watch),
      userId,
      hashToken(DEMO_TOKENS.phone),
      userId,
      hashToken(DEMO_TOKENS.pc),
    ]
  );

  // Write demo tokens to disk
  const tokenFilePaths = [
    path.resolve(__dirname, '../../../.demo-tokens.json'),
    path.resolve(__dirname, '../../../../.demo-tokens.json'),
  ];
  for (const fp of tokenFilePaths) {
    fs.writeFileSync(fp, JSON.stringify(DEMO_TOKENS, null, 2), 'utf8');
  }
  console.log('[Seed] Demo tokens provisioned and saved to .demo-tokens.json');

  // 3. Alert Rules
  await execute(`DELETE FROM alert_rules WHERE user_id = ?`, [userId]);
  const defaultRules = [
    ['posture', 1, 'normal', '22:00:00', '08:00:00', 'normal', 4],
    ['eye_break', 1, 'gentle', '22:00:00', '08:00:00', 'normal', 3],
    ['water', 1, 'gentle', '22:00:00', '08:00:00', 'low', 2],
    ['stand', 1, 'normal', '22:00:00', '08:00:00', 'normal', 2],
    ['caffeine_limit', 1, 'strong', '22:00:00', '08:00:00', 'high', 2],
    ['stress', 1, 'normal', '22:00:00', '08:00:00', 'normal', 3],
  ];
  for (const r of defaultRules) {
    await execute(
      `INSERT INTO alert_rules (user_id, type, enabled, intensity, quiet_start, quiet_end, priority, max_per_hour)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, ...r]
    );
  }

  // 4. Generate 7 Days of History ending today
  // We establish 5 weekday stories: L1, L2, L3, L4, L5 (today).
  const today = new Date();
  const dayMs = 24 * 60 * 60 * 1000;

  // Find the last 7 dates
  const days: { date: Date; dateStr: string; storyKey: string }[] = [];
  let weekdayCounter = 5; // L5 (today) down to L1
  for (let i = 0; i < 7; i++) {
    const d = new Date(today.getTime() - i * dayMs);
    const dayOfWeek = d.getDay(); // 0 = Sun, 6 = Sat
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const dateStr = d.toISOString().split('T')[0];
    let storyKey = 'weekend';
    if (!isWeekend) {
      storyKey = `L${weekdayCounter}`;
      weekdayCounter--;
    }
    days.unshift({ date: d, dateStr, storyKey });
  }

  console.log('[Seed] Generating days:', days.map((d) => `${d.dateStr} (${d.storyKey})`).join(', '));

  for (const dayInfo of days) {
    const { date, dateStr, storyKey } = dayInfo;
    const isToday = storyKey === 'L5';
    const isWeekend = storyKey === 'weekend';

    const baseYear = date.getUTCFullYear();
    const baseMonth = date.getUTCMonth();
    const baseDay = date.getUTCDate();

    function makeDateTime(hour: number, minute: number, second: number = 0): Date {
      return new Date(Date.UTC(baseYear, baseMonth, baseDay, hour, minute, second));
    }

    // A. Sleep Log
    let bedtimeHour = 23;
    let bedtimeMin = 30 + Math.floor(rng() * 15);
    let wakeHour = 7;
    let wakeMin = 15 + Math.floor(rng() * 20);
    let durationMin = 465;
    let quality = 4;

    if (storyKey === 'L2') {
      quality = 4;
      durationMin = 460;
    } else if (storyKey === 'L3') {
      // Slept poorly after late coffee on L2!
      durationMin = 340; // 5h 40min!
      quality = 2;
      wakeHour = 6;
      wakeMin = 40;
    } else if (storyKey === 'L4') {
      // Best day
      durationMin = 490;
      quality = 5;
    }

    const prevDate = new Date(date.getTime() - dayMs);
    const prevBedtime = new Date(Date.UTC(prevDate.getUTCFullYear(), prevDate.getUTCMonth(), prevDate.getUTCDate(), bedtimeHour, bedtimeMin));
    const currentWake = makeDateTime(wakeHour, wakeMin);

    await execute(
      `INSERT INTO sleep_logs (user_id, date, bedtime, wake, duration_min, quality, source)
       VALUES (?, ?, ?, ?, ?, ?, 'seed')`,
      [userId, dateStr, prevBedtime, currentWake, durationMin, quality]
    );

    // B. Caffeine Logs
    const dayCaffeine: { ts: Date; mg: number; drink_type: string; size: string }[] = [];
    if (storyKey === 'L1') {
      dayCaffeine.push({ ts: makeDateTime(9, 15), mg: 95, drink_type: 'Café americano', size: 'Mediano' });
      dayCaffeine.push({ ts: makeDateTime(13, 45), mg: 65, drink_type: 'Espresso', size: 'Sencillo' });
    } else if (storyKey === 'L2') {
      // Late coffee story: late Americano at 16:10!
      dayCaffeine.push({ ts: makeDateTime(9, 10), mg: 95, drink_type: 'Café americano', size: 'Mediano' });
      dayCaffeine.push({ ts: makeDateTime(16, 10), mg: 95, drink_type: 'Café americano', size: 'Mediano' });
    } else if (storyKey === 'L3') {
      // 3 coffees after bad sleep
      dayCaffeine.push({ ts: makeDateTime(8, 45), mg: 120, drink_type: 'Café americano', size: 'Grande' });
      dayCaffeine.push({ ts: makeDateTime(13, 15), mg: 95, drink_type: 'Café americano', size: 'Mediano' });
      dayCaffeine.push({ ts: makeDateTime(16, 0), mg: 65, drink_type: 'Espresso', size: 'Sencillo' });
    } else if (storyKey === 'L4') {
      // Best day: single morning coffee
      dayCaffeine.push({ ts: makeDateTime(9, 0), mg: 95, drink_type: 'Café americano', size: 'Mediano' });
    } else if (storyKey === 'L5') {
      // Today: morning coffee
      dayCaffeine.push({ ts: makeDateTime(9, 15), mg: 95, drink_type: 'Café americano', size: 'Mediano' });
    } else if (isWeekend) {
      dayCaffeine.push({ ts: makeDateTime(10, 30), mg: 95, drink_type: 'Café americano', size: 'Mediano' });
    }

    for (const c of dayCaffeine) {
      await execute(
        `INSERT INTO caffeine_logs (user_id, ts, drink_type, size, mg)
         VALUES (?, ?, ?, ?, ?)`,
        [userId, c.ts, c.drink_type, c.size, c.mg]
      );
    }

    // C. Focus Sessions & Meetings
    const focusBlocks: { start: Date; end: Date; planned: number; interruptions: number; quality: number }[] = [];
    if (storyKey === 'L1') {
      // Heavy meetings (~4h)
      await execute(
        `INSERT INTO calendar_events (user_id, start_time, end_time, title_hash, is_meeting) VALUES
         (?, ?, ?, 'hash_daily_sync', 1),
         (?, ?, ?, 'hash_arch_review', 1),
         (?, ?, ?, 'hash_client_sync', 1)`,
        [
          userId, makeDateTime(10, 0), makeDateTime(11, 30),
          userId, makeDateTime(13, 0), makeDateTime(14, 0),
          userId, makeDateTime(15, 30), makeDateTime(17, 0),
        ]
      );
      focusBlocks.push({ start: makeDateTime(11, 45), end: makeDateTime(12, 40), planned: 55, interruptions: 3, quality: 78 });
      focusBlocks.push({ start: makeDateTime(14, 15), end: makeDateTime(15, 10), planned: 55, interruptions: 2, quality: 82 });
    } else if (storyKey === 'L2') {
      focusBlocks.push({ start: makeDateTime(9, 45), end: makeDateTime(10, 45), planned: 60, interruptions: 2, quality: 84 });
      focusBlocks.push({ start: makeDateTime(11, 15), end: makeDateTime(12, 10), planned: 55, interruptions: 1, quality: 88 });
      focusBlocks.push({ start: makeDateTime(14, 0), end: makeDateTime(15, 0), planned: 60, interruptions: 3, quality: 80 });
    } else if (storyKey === 'L3') {
      // Fragmented focus after poor sleep
      focusBlocks.push({ start: makeDateTime(9, 30), end: makeDateTime(10, 0), planned: 30, interruptions: 5, quality: 62 });
      focusBlocks.push({ start: makeDateTime(10, 45), end: makeDateTime(11, 20), planned: 35, interruptions: 4, quality: 65 });
      focusBlocks.push({ start: makeDateTime(14, 30), end: makeDateTime(15, 10), planned: 40, interruptions: 6, quality: 58 });
    } else if (storyKey === 'L4') {
      // Best day: 4 focus blocks of >= 50 min
      focusBlocks.push({ start: makeDateTime(9, 30), end: makeDateTime(10, 25), planned: 55, interruptions: 0, quality: 96 });
      focusBlocks.push({ start: makeDateTime(10, 45), end: makeDateTime(11, 40), planned: 55, interruptions: 1, quality: 94 });
      focusBlocks.push({ start: makeDateTime(13, 30), end: makeDateTime(14, 25), planned: 55, interruptions: 0, quality: 97 });
      focusBlocks.push({ start: makeDateTime(15, 0), end: makeDateTime(16, 0), planned: 60, interruptions: 1, quality: 93 });
    } else if (storyKey === 'L5') {
      // Today: partial morning focus
      focusBlocks.push({ start: makeDateTime(9, 45), end: makeDateTime(10, 40), planned: 55, interruptions: 1, quality: 92 });
      focusBlocks.push({ start: makeDateTime(11, 10), end: makeDateTime(12, 0), planned: 50, interruptions: 2, quality: 88 });
    } else if (isWeekend) {
      focusBlocks.push({ start: makeDateTime(11, 0), end: makeDateTime(11, 35), planned: 35, interruptions: 0, quality: 90 });
    }

    for (const fb of focusBlocks) {
      await execute(
        `INSERT INTO focus_sessions (user_id, start_time, end_time, planned_min, interruptions, quality_score, source)
         VALUES (?, ?, ?, ?, ?, ?, 'manual')`,
        [userId, fb.start, fb.end, fb.planned, fb.interruptions, fb.quality]
      );
    }

    // D. Stress & Breathing Sessions
    if (storyKey === 'L1') {
      // 2 breathing sessions after meetings + 3 stress spikes
      await execute(
        `INSERT INTO stress_events (user_id, ts, peak_bpm, baseline_bpm, trigger_tag, tagged_at) VALUES
         (?, ?, 108, 72, 'Reunión', ?),
         (?, ?, 104, 73, 'Mensaje', ?),
         (?, ?, 112, 74, 'Reunión', ?)`,
        [
          userId, makeDateTime(11, 15), makeDateTime(11, 25),
          userId, makeDateTime(14, 45), makeDateTime(14, 50),
          userId, makeDateTime(16, 45), makeDateTime(16, 55),
        ]
      );
      await execute(
        `INSERT INTO breathing_sessions (user_id, start_time, duration_s, pattern, hr_before, hr_after) VALUES
         (?, ?, 90, '4-7-8', 104, 76),
         (?, ?, 75, '4-7-8', 98, 74)`,
        [
          userId, makeDateTime(11, 35),
          userId, makeDateTime(17, 5),
        ]
      );
    } else if (storyKey === 'L3') {
      await execute(
        `INSERT INTO stress_events (user_id, ts, peak_bpm, baseline_bpm, trigger_tag, tagged_at) VALUES
         (?, ?, 99, 75, 'Código/bug', ?)`,
        [userId, makeDateTime(15, 20), makeDateTime(15, 30)]
      );
    }

    // E. Breaks & Alerts
    const breakEvents = [
      { ts: makeDateTime(10, 30), kind: 'eye', outcome: 'done' },
      { ts: makeDateTime(11, 15), kind: 'water', outcome: 'done', amount_ml: 250 },
      { ts: makeDateTime(12, 30), kind: 'stand', outcome: 'done' },
      { ts: makeDateTime(14, 45), kind: 'water', outcome: 'done', amount_ml: 200 },
      { ts: makeDateTime(16, 15), kind: 'eye', outcome: 'snoozed' },
    ];
    for (const b of breakEvents) {
      await execute(
        `INSERT INTO break_events (user_id, ts, kind, outcome, amount_ml)
         VALUES (?, ?, ?, ?, ?)`,
        [userId, b.ts, b.kind, b.outcome, b.amount_ml || null]
      );
    }

    // F. Hourly Heart Samples, Posture, and PC Activity (9:00 to 18:00 or current hour)
    const endHour = isToday ? Math.min(18, Math.max(10, today.getUTCHours())) : 18;
    let accumulatedAmberMin = 0;
    let accumulatedRedMin = 0;

    for (let hour = 9; hour < endHour; hour++) {
      for (let min = 0; min < 60; min += 2) {
        const sampleTs = makeDateTime(hour, min);

        // Heart sample
        let bpm = 70 + Math.floor(rng() * 12);
        if (storyKey === 'L1' && (hour === 11 || hour === 16)) bpm += 22; // Meeting stress
        if (storyKey === 'L3') bpm += 6; // Post-sleep deficit
        await execute(
          `INSERT INTO heart_samples (user_id, ts, bpm, moving) VALUES (?, ?, ?, ?)`,
          [userId, sampleTs, bpm, rng() > 0.85]
        );

        // Posture window
        let roll = (rng() - 0.5) * 14;
        let pitch = (rng() - 0.5) * 12;
        let band: 'green' | 'amber' | 'red' = 'green';

        if (storyKey === 'L3' && hour >= 14) {
          // Ergonomic debt high in afternoon of L3
          pitch += 18 + rng() * 12;
          band = pitch > 25 ? 'red' : 'amber';
          if (band === 'red') accumulatedRedMin += 2;
          else accumulatedAmberMin += 2;
        } else if (storyKey === 'L4') {
          // Excellent posture
          band = 'green';
        } else {
          const r = rng();
          if (r > 0.88) {
            band = 'amber';
            accumulatedAmberMin += 2;
          }
        }

        const dev = Math.sqrt(roll * roll + pitch * pitch);
        await execute(
          `INSERT INTO posture_windows (user_id, ts_start, duration_s, typing, roll_dev, pitch_dev, deviation_deg, band)
           VALUES (?, ?, 120, ?, ?, ?, ?, ?)`,
          [userId, sampleTs, rng() > 0.3, Math.round(roll * 10) / 10, Math.round(pitch * 10) / 10, Math.round(dev * 10) / 10, band]
        );

        // PC Activity window
        let appCategory: 'editor' | 'terminal' | 'browser' | 'meeting' | 'chat' | 'other' = 'editor';
        if (storyKey === 'L1' && (hour === 10 || hour === 13 || hour === 16)) {
          appCategory = 'meeting';
        } else if (storyKey === 'L3') {
          appCategory = rng() > 0.4 ? 'editor' : 'chat';
        } else {
          appCategory = rng() > 0.25 ? 'editor' : 'browser';
        }

        await execute(
          `INSERT INTO pc_activity_windows (user_id, ts_start, keystrokes, keystroke_cv, mouse_events, idle_s, app_category)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            userId,
            sampleTs,
            Math.floor(rng() * 140 + 20),
            Math.round(rng() * 0.4 * 100) / 100,
            Math.floor(rng() * 45 + 5),
            Math.floor(rng() * 25),
            appCategory,
          ]
        );
      }

      // Environment sample every 10 min
      for (let min = 0; min < 60; min += 10) {
        const envTs = makeDateTime(hour, min);
        const noise = Math.round((45 + rng() * 18) * 10) / 10;
        const lux = Math.round(300 + rng() * 220);
        await execute(
          `INSERT INTO environment_samples (user_id, ts, noise_db, lux)
           VALUES (?, ?, ?, ?)`,
          [userId, envTs, noise, lux]
        );
      }
    }

    // G. Energy Snapshots (every 30 min from 9:00 to endHour)
    for (let hour = 9; hour < endHour; hour++) {
      for (let min of [0, 30]) {
        const snapTs = makeDateTime(hour, min);
        const debtMin = accumulatedAmberMin * 1 + accumulatedRedMin * 2;
        const energyResult = calculateEnergy({
          ergonomicDebtMin: Math.min(60, debtMin),
          sedentaryMinutesWithoutBreak: 30,
          screenTimeMinutesWithoutEyeRest: 20,
          standBreaksCount: hour >= 13 ? 2 : 1,
          stretchCount: hour >= 15 ? 1 : 0,
          focusMinutesToday: (hour - 9) * 25,
          meetingMinutesToday: storyKey === 'L1' ? (hour - 9) * 20 : 0,
          stressEventsCount: storyKey === 'L1' ? 2 : 0,
          breathingSessionsCompleted: storyKey === 'L1' ? 2 : 0,
          currentCaffeineMg: calculateCurrentCaffeine(dayCaffeine, snapTs),
          caffeineLimitMg: 400,
        });

        await execute(
          `INSERT INTO energy_snapshots (user_id, ts, physical, mental, caffeine_load, overall)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [userId, snapTs, energyResult.physical, energyResult.mental, energyResult.caffeineLoad, energyResult.overall]
        );
      }
    }

    // H. Daily AI Summary for past weekdays
    if (!isToday && !isWeekend) {
      let aiSummaryJson = {
        resumen: `Jornada ${storyKey} completada con balance general de actividad e interacción.`,
        lo_que_fue_bien: 'Buen cumplimiento de tiempos y pausas activas.',
        a_mejorar: 'Monitorear la postura de la mano en horarios de mayor fatiga.',
        sugerencia_manana: 'Recuerda calibrar la muñeca e hidratarte temprano.',
      };

      if (storyKey === 'L2') {
        aiSummaryJson = {
          resumen: 'Jornada productiva con 3 bloques de foco, pero con un café americano registrado a las 16:10.',
          lo_que_fue_bien: 'Lograste 175 minutos de foco profundo en el editor con ritmo fluido.',
          a_mejorar: 'El consumo tardío de cafeína (16:10) afectará la latencia del sueño esta noche.',
          sugerencia_manana: 'Adelanta la última taza antes de las 14:30 para asegurar descanso reparador.',
        };
      } else if (storyKey === 'L3') {
        aiSummaryJson = {
          resumen: 'Día desafiante tras dormir 5 h 40 min; la fatiga incrementó la deuda ergonómica por la tarde.',
          lo_que_fue_bien: 'Pese al cansancio, realizaste 3 pausas para hidratarte.',
          a_mejorar: 'Se acumularon más de 38 minutos en postura forzada (bandas ámbar y roja) después de las 14:00.',
          sugerencia_manana: 'Descansa temprano hoy y procura mantener los antebrazos alineados con el teclado.',
        };
      } else if (storyKey === 'L4') {
        aiSummaryJson = {
          resumen: '¡Excelente día! Tu mejor desempeño semanal con 4 bloques de foco profundo y postura neutral.',
          lo_que_fue_bien: 'Más del 88% del tiempo de tecleo en banda verde y un solo café matutino.',
          a_mejorar: 'Mantén esta misma rutina y no olvides la pausa activa a media tarde.',
          sugerencia_manana: 'Replica el horario matutino de concentración de hoy para tu proyecto actual.',
        };
      }

      const metricsJson = {
        storyKey,
        caffeineMg: dayCaffeine.reduce((acc, c) => acc + c.mg, 0),
        sleepMin: durationMin,
        focusBlocksCount: focusBlocks.length,
        ergonomicDebtMin: accumulatedAmberMin + accumulatedRedMin * 2,
      };

      await execute(
        `INSERT INTO daily_summaries (user_id, date, metrics_json, ai_json, model, generated_at)
         VALUES (?, ?, ?, ?, 'gemini-3.8-flash', NOW())
         ON DUPLICATE KEY UPDATE metrics_json = VALUES(metrics_json), ai_json = VALUES(ai_json)`,
        [userId, dateStr, JSON.stringify(metricsJson), JSON.stringify(aiSummaryJson)]
      );
    }
  }

  console.log('[Seed] Seed completed successfully for Alex Rivera!');
}

