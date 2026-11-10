import { query } from '../index.js';

async function verifySeed() {
  console.log('====================================================');
  console.log('       OfficeCore Seed Verification Report          ');
  console.log('====================================================');

  const [user] = await query<{ id: number; name: string; email: string }>(
    `SELECT id, name, email FROM users WHERE email = ?`,
    ['alex.rivera@officecore.internal']
  );

  if (!user) {
    console.error('FAIL: Demo user Alex Rivera not found in database!');
    process.exit(1);
  }

  console.log(`User: ${user.name} (ID: ${user.id}, Email: ${user.email})`);

  const tables = [
    'devices',
    'sleep_logs',
    'caffeine_logs',
    'focus_sessions',
    'heart_samples',
    'posture_windows',
    'pc_activity_windows',
    'environment_samples',
    'break_events',
    'energy_snapshots',
    'daily_summaries',
    'alert_rules',
  ];

  console.log('\n--- Row Counts per Table ---');
  for (const table of tables) {
    const [row] = await query<{ count: number }>(
      `SELECT COUNT(*) as count FROM ${table} WHERE user_id = ?`,
      [user.id]
    );
    console.log(`- ${table.padEnd(25)}: ${row.count} rows`);
  }

  console.log('\n--- Storyline Validations (Section 6 & 15) ---');

  // Check 1: Sleep of L3 < 6 hours (360 min)
  const [l3Sleep] = await query<{ duration_min: number; quality: number; date: string }>(
    `SELECT duration_min, quality, date FROM sleep_logs 
     WHERE user_id = ? AND duration_min < 360 
     ORDER BY date DESC LIMIT 1`,
    [user.id]
  );
  if (l3Sleep && l3Sleep.duration_min <= 340) {
    console.log(`[PASS] Story L3 Sleep Check: ${l3Sleep.duration_min} min (< 6h) with quality ${l3Sleep.quality}/5 on ${l3Sleep.date}`);
  } else {
    console.error(`[FAIL] Story L3 Sleep Check: expected < 360 min, found:`, l3Sleep);
    process.exit(1);
  }

  // Check 2: Late coffee of L2 after 16:00
  const [l2Coffee] = await query<{ ts: string; mg: number; drink_type: string }>(
    `SELECT ts, mg, drink_type FROM caffeine_logs 
     WHERE user_id = ? AND TIME(ts) >= '16:00:00'
     ORDER BY ts ASC LIMIT 1`,
    [user.id]
  );
  if (l2Coffee) {
    console.log(`[PASS] Story L2 Late Coffee Check: ${l2Coffee.drink_type} (${l2Coffee.mg} mg) at ${l2Coffee.ts} (after 16:00)`);
  } else {
    console.error(`[FAIL] Story L2 Late Coffee Check: expected coffee after 16:00`);
    process.exit(1);
  }

  // Check 3: Highest count of focus blocks in L4 (>= 4 blocks)
  const focusDays = await query<{ day: string; blocks: number }>(
    `SELECT DATE(start_time) as day, COUNT(*) as blocks 
     FROM focus_sessions 
     WHERE user_id = ? 
     GROUP BY DATE(start_time) 
     ORDER BY blocks DESC LIMIT 1`,
    [user.id]
  );
  const bestDay = focusDays[0];
  if (bestDay && bestDay.blocks >= 4) {
    console.log(`[PASS] Story L4 Focus Check: ${bestDay.blocks} focus blocks on best day (${bestDay.day})`);
  } else {
    console.error(`[FAIL] Story L4 Focus Check: expected >= 4 blocks on best day, found:`, bestDay);
    process.exit(1);
  }

  // Check 4: No physical watch posture calibration pre-seeded
  const [calibrations] = await query<{ count: number }>(
    `SELECT COUNT(*) as count FROM calibrations WHERE user_id = ? AND kind = 'posture'`,
    [user.id]
  );
  if (calibrations.count === 0) {
    console.log(`[PASS] Live Posture Calibration Check: 0 pre-seeded calibrations (ready for 30s live calibration)`);
  } else {
    console.warn(`[WARN] Posture calibrations found: ${calibrations.count}`);
  }

  console.log('\n====================================================');
  console.log('       ALL SEED VERIFICATION CHECKS PASSED!        ');
  console.log('====================================================\n');
}

verifySeed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seed verification error:', err);
    process.exit(1);
  });
