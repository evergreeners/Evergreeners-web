
import postgres from 'postgres';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: './server/.env' });

const sql = postgres(process.env.DATABASE_URL!.replace(/"/g, ''));

async function checkColumns() {
    try {
        const columns = await sql`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_schema = 'evergreeners' 
            AND table_name = 'users';
        `;
        console.log("Columns in evergreeners.users:");
        console.log(columns.map(c => c.column_name));
    } catch (err) {
        console.error(err);
    } finally {
        await sql.end();
    }
}

checkColumns();
