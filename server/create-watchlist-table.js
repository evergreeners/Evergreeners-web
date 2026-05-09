/**
 * Migration: Create watchlist table for The Eye feature
 * Run with: node server/create-watchlist-table.js
 */
import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const { Client } = pg;

async function migrate() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  console.log('Connected to database');

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS evergreeners.watchlist (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES evergreeners.users(id) ON DELETE CASCADE,
        github_username TEXT NOT NULL,
        display_name TEXT,
        avatar_url TEXT,
        added_at TIMESTAMP DEFAULT NOW(),
        cached_stats JSONB,
        last_refreshed TIMESTAMP,
        CONSTRAINT watchlist_user_id_github_username_unique UNIQUE (user_id, github_username)
      );
    `);
    console.log('✅ watchlist table created (or already exists)');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

migrate();
