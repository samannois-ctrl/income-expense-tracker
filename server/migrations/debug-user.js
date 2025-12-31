import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'tracker_user',
    password: process.env.DB_PASSWORD || 'tracker_pass',
    database: process.env.DB_NAME || 'income_expense_tracker',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

async function checkUser() {
    const connection = await pool.getConnection();

    try {
        console.log('🔍 Checking user records...');
        const [users] = await connection.query('SELECT id, username, email, password, status FROM users');

        console.log('Found users:', users.length);
        users.forEach(u => {
            console.log(`- ID: ${u.id}, Username: "${u.username}", Email: "${u.email}", Status: ${u.status}`);
            // Check if password matches 'admin123'
            const match = bcrypt.compareSync('admin123', u.password);
            console.log(`  Password matches "admin123"? ${match ? 'YES ✅' : 'NO ❌'}`);
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        connection.release();
        await pool.end();
    }
}

checkUser();
