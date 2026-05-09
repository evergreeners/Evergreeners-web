import dotenv from 'dotenv'; dotenv.config();
import postgres from 'postgres';

async function migrate() {
  const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require', max: 1 });
  try {
    await sql`
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
      )
    `;
    console.log('✅ watchlist table created (or already exists)');
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

migrate();
