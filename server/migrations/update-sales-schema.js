import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

console.log('🚀 Updating Sales Schema & Creating Tables...\n');

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

async function runMigration() {
    const connection = await pool.getConnection();

    try {
        // 1. Create tables table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS tables (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(50) NOT NULL,
                is_active TINYINT(1) DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ Created table: tables (if not exists)');

        // 2. Add columns to sales table
        try {
            await connection.query(`
                ALTER TABLE sales 
                ADD COLUMN paper_order_ref VARCHAR(50) AFTER customerName,
                ADD COLUMN table_id INT NULL AFTER paper_order_ref,
                ADD COLUMN order_type VARCHAR(20) DEFAULT 'dine_in' AFTER table_id
            `);
            console.log('✅ Added columns to sales: paper_order_ref, table_id, order_type');
        } catch (error) {
            if (error.code === 'ER_DUP_FIELDNAME') {
                console.log('ℹ️  Columns already exist in sales table');
            } else {
                throw error;
            }
        }

        // 3. Seed some tables
        const [existing] = await connection.query('SELECT count(*) as count FROM tables');
        if (existing[0].count === 0) {
            await connection.query(`
                INSERT INTO tables (name) VALUES 
                ('Table 1'), ('Table 2'), ('Table 3'), ('Table 4'), ('Table 5')
            `);
            console.log('🌱 Seeded 5 initial tables');
        }

        console.log('\n✨ Database Update Completed!');
    } catch (error) {
        console.error('❌ Error updating schema:', error);
    } finally {
        connection.release();
        await pool.end();
    }
}

runMigration().catch(console.error);
