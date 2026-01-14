
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

async function checkIntegrity() {
    console.log('Checking database integrity as root...');

    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            user: process.env.DB_ROOT_USER || 'root',
            password: process.env.DB_ROOT_PASSWORD || '',
            database: process.env.DB_NAME
        });
        console.log(`✅ Connected to ${process.env.DB_NAME} as root!`);

        const [tables] = await connection.query('SHOW TABLES');
        console.log('Tables:', tables.map(t => Object.values(t)[0]));

        // Try to read from users
        try {
            const [users] = await connection.query('SELECT count(*) as count FROM users');
            console.log('✅ Users table readable. Count:', users[0].count);
        } catch (e) {
            console.error('❌ Error reading users table:', e.message);
        }

        await connection.end();
    } catch (error) {
        console.error('❌ Integrity check failed:', error.message);
    }
}

checkIntegrity();
