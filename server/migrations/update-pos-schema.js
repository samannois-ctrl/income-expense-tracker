import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

console.log('🚀 Updating POS tables schema for MariaDB...\n');

// Create connection pool
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

async function updateSchema() {
    const connection = await pool.getConnection();

    try {
        // Helper function to check if column exists
        async function columnExists(tableName, columnName) {
            const [rows] = await connection.query(
                `SELECT COUNT(*) as count FROM information_schema.COLUMNS 
         WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
                [process.env.DB_NAME || 'income_expense_tracker', tableName, columnName]
            );
            return rows[0].count > 0;
        }

        // Add menu reference columns to sale_items if they don't exist
        if (!(await columnExists('sale_items', 'category_id'))) {
            await connection.query('ALTER TABLE sale_items ADD COLUMN category_id INT');
            console.log('✅ Added category_id column');
        } else {
            console.log('⚠️  category_id column already exists');
        }

        if (!(await columnExists('sale_items', 'option_id'))) {
            await connection.query('ALTER TABLE sale_items ADD COLUMN option_id INT');
            console.log('✅ Added option_id column');
        } else {
            console.log('⚠️  option_id column already exists');
        }

        if (!(await columnExists('sale_items', 'noodle_id'))) {
            await connection.query('ALTER TABLE sale_items ADD COLUMN noodle_id INT');
            console.log('✅ Added noodle_id column');
        } else {
            console.log('⚠️  noodle_id column already exists');
        }

        if (!(await columnExists('sale_items', 'is_custom'))) {
            await connection.query('ALTER TABLE sale_items ADD COLUMN is_custom TINYINT(1) DEFAULT 0');
            console.log('✅ Added is_custom column');
        } else {
            console.log('⚠️  is_custom column already exists');
        }

        // Add foreign key constraints if they don't exist
        try {
            await connection.query(`
        ALTER TABLE sale_items
        ADD CONSTRAINT fk_sale_items_category FOREIGN KEY (category_id) REFERENCES menu_categories(id) ON DELETE SET NULL
      `);
            console.log('✅ Added foreign key constraint for category_id');
        } catch (e) {
            if (e.code !== 'ER_DUP_KEYNAME') {
                console.log('⚠️  Foreign key constraint for category_id may already exist');
            }
        }

        try {
            await connection.query(`
        ALTER TABLE sale_items
        ADD CONSTRAINT fk_sale_items_option FOREIGN KEY (option_id) REFERENCES menu_options(id) ON DELETE SET NULL
      `);
            console.log('✅ Added foreign key constraint for option_id');
        } catch (e) {
            if (e.code !== 'ER_DUP_KEYNAME') {
                console.log('⚠️  Foreign key constraint for option_id may already exist');
            }
        }

        try {
            await connection.query(`
        ALTER TABLE sale_items
        ADD CONSTRAINT fk_sale_items_noodle FOREIGN KEY (noodle_id) REFERENCES noodles(id) ON DELETE SET NULL
      `);
            console.log('✅ Added foreign key constraint for noodle_id');
        } catch (e) {
            if (e.code !== 'ER_DUP_KEYNAME') {
                console.log('⚠️  Foreign key constraint for noodle_id may already exist');
            }
        }

        console.log('\n✨ POS tables schema updated successfully!\n');
    } catch (error) {
        console.error('❌ Error updating POS tables schema:', error);
        throw error;
    } finally {
        connection.release();
        await pool.end();
    }
}

// Run migration
updateSchema().catch(console.error);
