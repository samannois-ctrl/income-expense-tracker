import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

console.log('📡 Testing database connection...');
console.log(`   Host: ${process.env.DB_HOST || 'localhost'}`);
console.log(`   User: ${process.env.DB_USER || 'tracker_user'}`);
console.log(`   Database: ${process.env.DB_NAME || 'income_expense_tracker'}`);

async function testConnection() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'tracker_user',
            password: process.env.DB_PASSWORD || 'tracker_pass',
            database: process.env.DB_NAME || 'income_expense_tracker'
        });

        console.log('✅ Connection SUCCESSFUL!');
        await connection.end();
        process.exit(0);
    } catch (error) {
        console.error('❌ Connection FAILED:', error.message);
        process.exit(1);
    }
}

testConnection();
