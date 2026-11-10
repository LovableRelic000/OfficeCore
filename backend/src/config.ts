import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '12345',
    database: process.env.DB_NAME || 'officecore',
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
    model: process.env.GEMINI_MODEL || 'gemini-3.8-flash',
  },
  timezone: process.env.DEMO_TIMEZONE || 'America/Mexico_City',
};

