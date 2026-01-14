
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

async function checkSystemTable() {
    console.log('Checking mysql.db readability...');

    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            user: process.env.DB_ROOT_USER || 'root',
            password: process.env.DB_ROOT_PASSWORD || '',
            database: 'mysql'
        });

        try {
            const [rows] = await connection.query('SELECT count(*) as count FROM db');
            console.log('✅ mysql.db is readable. Count:', rows[0].count);
        } catch (e) {
            console.error('❌ Error reading mysql.db:', e.message);
        }

        await connection.end();
    } catch (error) {
        console.error('❌ Connection failed:', error.message);
    }
}

checkSystemTable();
