import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import { config } from '../config.js';

export async function initDb() {
  console.log('[db:init] Connecting to MySQL server...');
  const connection = await mysql.createConnection({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    multipleStatements: true,
  });

  try {
    const schemaPath = path.resolve(__dirname, '../../../db/schema.sql');
    console.log(`[db:init] Reading schema from: ${schemaPath}`);
    const sql = fs.readFileSync(schemaPath, 'utf8');

    console.log('[db:init] Applying schema...');
    await connection.query(sql);
    console.log('[db:init] Database initialized successfully!');
  } finally {
    await connection.end();
  }
}

if (process.argv[1]?.endsWith('init.ts')) {
  initDb()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[db:init] Error initializing database:', err);
      process.exit(1);
    });
}

