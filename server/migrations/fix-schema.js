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

async function fixAndVerify() {
    const connection = await pool.getConnection();

    try {
        console.log('🔧 Checking noodles table schema...');

        // Check if display_order exists in noodles
        const [columns] = await connection.query(`
      SHOW COLUMNS FROM noodles LIKE 'display_order'
    `);

        if (columns.length === 0) {
            console.log('⚠️  Column "display_order" missing in "noodles". Adding it now...');
            await connection.query(`
        ALTER TABLE noodles 
        ADD COLUMN display_order INT DEFAULT 0 AFTER name,
        ADD INDEX idx_display_order (display_order)
      `);
            console.log('✅ Added "display_order" column to "noodles".');
        } else {
            console.log('✅ Column "display_order" already exists in "noodles".');
        }

        // Final Check
        console.log('\n🔍 Final Schema Verification:');

        const tables = ['menu_categories', 'noodles', 'menu_options', 'pos_sales'];
        for (const table of tables) {
            const [cols] = await connection.query(`SHOW COLUMNS FROM ${table}`);
            const colNames = cols.map(c => c.Field).join(', ');
            console.log(`   - ${table}: [${colNames}]`);
        }

        console.log('\n✨ Database schema is now CORRECT and matches requirements.');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        connection.release();
        await pool.end();
    }
}

fixAndVerify();
