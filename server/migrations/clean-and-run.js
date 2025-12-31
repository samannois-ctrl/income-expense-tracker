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

async function runCleanAndMigrate() {
    const connection = await pool.getConnection();

    try {
        console.log('🧹 Cleaning migration history for rebuild...');
        // Only delete history for the tables we know were dropped
        await connection.query(`
      DELETE FROM migration_history 
      WHERE migration_name IN (
        'add-menu-tables', 
        'add-pos-tables', 
        'seed-menu-data',
        'update-pos-schema'
      )
    `);
        console.log('✅ History cleaned.');

        console.log('\n🚀 Starting fresh migration...');
        // Run the main migration runner
        const { stdout, stderr } = await execAsync('node migrations/run-all-migrations.js', {
            cwd: join(__dirname, '..')
        });

        console.log(stdout);
        if (stderr) console.error(stderr);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        connection.release();
        await pool.end();
    }
}

runCleanAndMigrate();
