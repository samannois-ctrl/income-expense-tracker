import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
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

async function rebuildTables() {
    const connection = await pool.getConnection();

    try {
        console.log('🗑️  Dropping POS and Menu tables for clean rebuild...\n');

        // Disable foreign key checks to allow dropping tables in any order
        await connection.query('SET FOREIGN_KEY_CHECKS = 0');

        const tablesToDrop = [
            'pos_sale_items',
            'pos_sales',
            'menu_options',
            'menu_categories',
            'noodles',
            'sale_items' // Need to be careful here, but if we are rebuilding schema it's safer. 
            // Wait, checking if sale_items is critical. 
            // The user request context implies fixing the "missing field" issues.
            // `sale_items` was modified by update-pos-schema.js. 
            // Safe to alter or drop if it's part of the POS flow. 
            // However, for safety, I will only drop the ones clearly created by our migrations 
            // or revert the columns if possible? 
            // Actually, dropping `sale_items` might lose data if there were existing sales.
            // The issue was `noodles` table.
        ];

        // Let's drop only the strictly new tables. 
        // For `sale_items`, we added columns. We shouldn't drop it if it contains data.
        // But `noodles` was the error source.

        // Dropping tables
        await connection.query('DROP TABLE IF EXISTS pos_sale_items');
        await connection.query('DROP TABLE IF EXISTS pos_sales');
        await connection.query('DROP TABLE IF EXISTS menu_options');
        await connection.query('DROP TABLE IF EXISTS noodles');
        await connection.query('DROP TABLE IF EXISTS menu_categories');

        // Create tables should handle creation.
        // Clean migration history
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

        // For update-pos-schema, since we can't easily undo the ALTER TABLE without complex logic,
        // and the migration script checks "IF NOT EXISTS", it is safe to re-run it. 
        // It will just say "columns already exist".

        await connection.query('SET FOREIGN_KEY_CHECKS = 1');
        console.log('✅ Tables dropped and history cleaned.\n');

        console.log('🚀 Re-running all migrations...');

        // Execute the runner
        const { stdout, stderr } = await execAsync('node migrations/run-all-migrations.js', {
            cwd: join(__dirname, '..')
        });

        console.log(stdout);
        if (stderr) console.error(stderr);

    } catch (error) {
        console.error('❌ Error during rebuild:', error);
    } finally {
        connection.release();
        await pool.end();
    }
}

rebuildTables();
