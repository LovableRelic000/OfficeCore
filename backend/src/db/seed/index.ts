import { runSeed } from './generator.js';

runSeed()
  .then(() => {
    console.log('[Seed] Done!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('[Seed] Error during seeding:', err);
    process.exit(1);
  });

