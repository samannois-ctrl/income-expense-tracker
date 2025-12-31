import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

console.log('🔍 Checking table schemas in database...\n');

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

async function checkSchema() {
    const connection = await pool.getConnection();

    try {
        // Check menu_categories
        console.log('═══════════════════════════════════════════════════════════');
        console.log('📋 TABLE: menu_categories');
        console.log('═══════════════════════════════════════════════════════════\n');

        const [menuCatColumns] = await connection.query(`
      SELECT 
        COLUMN_NAME,
        COLUMN_TYPE,
        IS_NULLABLE,
        COLUMN_DEFAULT,
        COLUMN_KEY,
        EXTRA
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'menu_categories'
      ORDER BY ORDINAL_POSITION
    `, [process.env.DB_NAME || 'income_expense_tracker']);

        if (menuCatColumns.length === 0) {
            console.log('❌ Table menu_categories NOT FOUND!\n');
        } else {
            menuCatColumns.forEach((col, idx) => {
                console.log(`${idx + 1}. ${col.COLUMN_NAME}`);
                console.log(`   Type: ${col.COLUMN_TYPE}`);
                console.log(`   Nullable: ${col.IS_NULLABLE}`);
                console.log(`   Default: ${col.COLUMN_DEFAULT || 'NULL'}`);
                console.log(`   Key: ${col.COLUMN_KEY || 'None'}`);
                console.log(`   Extra: ${col.EXTRA || 'None'}`);
                console.log('');
            });
        }

        // Check noodles
        console.log('═══════════════════════════════════════════════════════════');
        console.log('🍜 TABLE: noodles');
        console.log('═══════════════════════════════════════════════════════════\n');

        const [noodleColumns] = await connection.query(`
      SELECT 
        COLUMN_NAME,
        COLUMN_TYPE,
        IS_NULLABLE,
        COLUMN_DEFAULT,
        COLUMN_KEY,
        EXTRA
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'noodles'
      ORDER BY ORDINAL_POSITION
    `, [process.env.DB_NAME || 'income_expense_tracker']);

        if (noodleColumns.length === 0) {
            console.log('❌ Table noodles NOT FOUND!\n');
        } else {
            noodleColumns.forEach((col, idx) => {
                console.log(`${idx + 1}. ${col.COLUMN_NAME}`);
                console.log(`   Type: ${col.COLUMN_TYPE}`);
                console.log(`   Nullable: ${col.IS_NULLABLE}`);
                console.log(`   Default: ${col.COLUMN_DEFAULT || 'NULL'}`);
                console.log(`   Key: ${col.COLUMN_KEY || 'None'}`);
                console.log(`   Extra: ${col.EXTRA || 'None'}`);
                console.log('');
            });
        }

        // Check menu_options for comparison
        console.log('═══════════════════════════════════════════════════════════');
        console.log('📝 TABLE: menu_options');
        console.log('═══════════════════════════════════════════════════════════\n');

        const [menuOptColumns] = await connection.query(`
      SELECT 
        COLUMN_NAME,
        COLUMN_TYPE,
        IS_NULLABLE,
        COLUMN_DEFAULT,
        COLUMN_KEY,
        EXTRA
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'menu_options'
      ORDER BY ORDINAL_POSITION
    `, [process.env.DB_NAME || 'income_expense_tracker']);

        if (menuOptColumns.length === 0) {
            console.log('❌ Table menu_options NOT FOUND!\n');
        } else {
            menuOptColumns.forEach((col, idx) => {
                console.log(`${idx + 1}. ${col.COLUMN_NAME}`);
                console.log(`   Type: ${col.COLUMN_TYPE}`);
                console.log(`   Nullable: ${col.IS_NULLABLE}`);
                console.log(`   Default: ${col.COLUMN_DEFAULT || 'NULL'}`);
                console.log(`   Key: ${col.COLUMN_KEY || 'None'}`);
                console.log(`   Extra: ${col.EXTRA || 'None'}`);
                console.log('');
            });
        }

        console.log('═══════════════════════════════════════════════════════════\n');

    } catch (error) {
        console.error('❌ Error checking schema:', error.message);
        throw error;
    } finally {
        connection.release();
        await pool.end();
    }
}

checkSchema().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
