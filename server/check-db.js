import { db } from './src/db/index.js';
import { sql } from 'drizzle-orm';

async function check() {
    try {
        const schemas = await db.execute(sql`SELECT schema_name FROM information_schema.schemata`);
        console.log('Schemas:', schemas);

        const tables = await db.execute(sql`SELECT table_schema, table_name FROM information_schema.tables WHERE table_schema = 'evergreeners'`);
        console.log('Tables in evergreeners:', tables);
        
        const allTables = await db.execute(sql`SELECT table_schema, table_name FROM information_schema.tables WHERE table_name LIKE '%community%'`);
        console.log('Tables matching community:', allTables);
    } catch (err) {
        console.error('Check failed:', err);
    }
    process.exit(0);
}

check();
