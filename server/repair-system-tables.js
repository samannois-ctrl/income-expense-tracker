
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

async function repairSystemTables() {
    console.log('🔧 Attempting to repair system tables...');

    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            user: process.env.DB_ROOT_USER || 'root',
            password: process.env.DB_ROOT_PASSWORD || '',
        });
        console.log('✅ Connected as root!');

        console.log('Repairing mysql.db...');
        const [dbResult] = await connection.query('REPAIR TABLE mysql.db');
        console.log('Result:', dbResult);

        console.log('Repairing mysql.user...');
        const [userResult] = await connection.query('REPAIR TABLE mysql.user');
        console.log('Result:', userResult);

        console.log('Repairing mysql.tables_priv...');
        const [tablesPrivResult] = await connection.query('REPAIR TABLE mysql.tables_priv');
        console.log('Result:', tablesPrivResult);

        console.log('Flushing privileges...');
        await connection.query('FLUSH PRIVILEGES');
        console.log('✅ Privileges flushed.');

        await connection.end();
    } catch (error) {
        console.error('❌ Repair failed:', error.message);
    }
}

repairSystemTables();
