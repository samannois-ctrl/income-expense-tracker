import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
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

async function dropTables() {
    const connection = await pool.getConnection();

    try {
        console.log('🗑️  Dropping POS and Menu tables...');

        await connection.query('SET FOREIGN_KEY_CHECKS = 0');

        const tables = [
            'pos_sale_items',
            'pos_sales',
            'menu_options',
            'noodles',
            'menu_categories',
            // 'sale_items' // Keeping safe, but if needed uncomment
        ];

        for (const table of tables) {
            await connection.query(`DROP TABLE IF EXISTS ${table}`);
            console.log(`   - Dropped ${table}`);
        }

        console.log('🧹 Cleaning migration history...');
        await connection.query(`
      DELETE FROM migration_history 
      WHERE migration_name IN (
        'add-menu-tables', 
        'add-pos-tables', 
        'seed-menu-data',
        'update-pos-schema'
      )
    `);

        await connection.query('SET FOREIGN_KEY_CHECKS = 1');
        console.log('✨ Tables dropped and history cleaned successfully.');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        connection.release();
        await pool.end();
    }
}

dropTables();
