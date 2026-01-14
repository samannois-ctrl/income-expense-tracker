
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

async function testRoot() {
    console.log('Testing Root Connection...');
    console.log(`Host: ${process.env.DB_HOST}`);
    console.log(`Port: ${process.env.DB_PORT}`);
    console.log(`User: ${process.env.DB_ROOT_USER || 'root'}`);

    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            user: process.env.DB_ROOT_USER || 'root',
            password: process.env.DB_ROOT_PASSWORD || '',
        });
        console.log('✅ Connected as root!');

        try {
            const [rows] = await connection.query('SHOW DATABASES');
            console.log('Databases:', rows.map(r => r.Database));
        } catch (e) {
            console.error('❌ Error listing databases:', e.message);
        }

        await connection.end();
    } catch (error) {
        console.error('❌ Root connection failed:', error.message);
    }
}

testRoot();
