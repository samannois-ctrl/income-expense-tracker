import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

console.log('🚀 Creating POS tables for MariaDB...\n');

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

async function runMigration() {
    const connection = await pool.getConnection();

    try {
        // Create pos_sales table
        await connection.query(`
      CREATE TABLE IF NOT EXISTS pos_sales (
        id INT AUTO_INCREMENT PRIMARY KEY,
        sale_number VARCHAR(100) UNIQUE NOT NULL,
        sale_date DATETIME NOT NULL,
        total_amount DECIMAL(10, 2) NOT NULL,
        payment_method VARCHAR(50) DEFAULT 'cash',
        paper_order_ref VARCHAR(100),
        notes TEXT,
        transaction_id INT,
        created_by INT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE SET NULL,
        FOREIGN KEY (created_by) REFERENCES users(id),
        INDEX idx_sale_date (sale_date),
        INDEX idx_created_by (created_by)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
        console.log('✅ pos_sales table created');

        // Create pos_sale_items table
        await connection.query(`
      CREATE TABLE IF NOT EXISTS pos_sale_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        sale_id INT NOT NULL,
        category_id INT,
        option_id INT,
        noodle_id INT,
        item_name VARCHAR(255) NOT NULL,
        quantity INT NOT NULL DEFAULT 1,
        unit_price DECIMAL(10, 2) NOT NULL,
        total_price DECIMAL(10, 2) NOT NULL,
        notes TEXT,
        is_custom TINYINT(1) DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sale_id) REFERENCES pos_sales(id) ON DELETE CASCADE,
        FOREIGN KEY (category_id) REFERENCES menu_categories(id) ON DELETE SET NULL,
        FOREIGN KEY (option_id) REFERENCES menu_options(id) ON DELETE SET NULL,
        FOREIGN KEY (noodle_id) REFERENCES noodles(id) ON DELETE SET NULL,
        INDEX idx_sale_id (sale_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
        console.log('✅ pos_sale_items table created');

        console.log('\n✨ POS tables migration completed!');
    } catch (error) {
        console.error('❌ Error creating tables:', error);
        throw error;
    } finally {
        connection.release();
        await pool.end();
    }
}

// Run migration
runMigration().catch(console.error);

