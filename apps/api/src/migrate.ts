import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import pg from 'pg';

const { Pool } = pg;
const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL is required');
const pool = new Pool({ connectionString, ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined });
try {
  const sql = await readFile(new URL('../schema.sql', import.meta.url), 'utf8');
  await pool.query(sql);
  console.log('Astroid database schema is up to date.');
} finally {
  await pool.end();
}