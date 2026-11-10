import { execute } from '../index.js';
import { runSeed } from './generator.js';

async function resetSeed() {
  console.log('[Seed:Reset] Clearing existing demo user data...');
  await execute(`DELETE FROM users WHERE email = ?`, ['alex.rivera@officecore.internal']);
  console.log('[Seed:Reset] Regenerating fresh 7-day demo dataset...');
  await runSeed();
  console.log('[Seed:Reset] Reset completed in < 1 min!');
}

resetSeed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[Seed:Reset] Error resetting seed:', err);
    process.exit(1);
  });

