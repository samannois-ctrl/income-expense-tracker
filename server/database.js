import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '.env') });

// Create connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'tracker_user',
  password: process.env.DB_PASSWORD || 'tracker_pass',
  database: process.env.DB_NAME || 'income_expense_tracker',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  dateStrings: true,
  decimalNumbers: true
});

// Initialize database tables
async function initDatabase() {
  const connection = await pool.getConnection();

  try {
    console.log('🚀 Initializing database tables...\n');

    // Create users table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        fullName VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        role VARCHAR(50) DEFAULT 'user',
        status VARCHAR(50) DEFAULT 'active',
        avatar TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_email (email),
        INDEX idx_username (username),
        INDEX idx_role (role),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Users table ready');

    // Create transactions table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        userId INT NOT NULL,
        sale_id INT DEFAULT NULL,
        type VARCHAR(50) NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        quantity INT DEFAULT 1,
        category VARCHAR(255) NOT NULL,
        description TEXT,
        date DATE NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_userId (userId),
        INDEX idx_sale_id (sale_id),
        INDEX idx_type (type),
        INDEX idx_date (date),
        INDEX idx_category (category)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Transactions table ready');

    // Create categories table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        userId INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL,
        isActive TINYINT(1) DEFAULT 1,
        isDefault TINYINT(1) DEFAULT 0,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_userId (userId),
        INDEX idx_type (type),
        INDEX idx_isActive (isActive)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Categories table ready');

    // Create backup_settings table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS backup_settings (
        id INT PRIMARY KEY,
        enabled TINYINT(1) DEFAULT 0,
        schedule_time VARCHAR(10) DEFAULT '00:00',
        retention_days INT DEFAULT 30
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Backup settings table ready');

    // --- NEW ADVANCED POS TABLES (5-Table System) ---

    // 1. Categories (e.g. Noodles, Appetizers, Drinks)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS menu_categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        display_order INT DEFAULT 0,
        is_active TINYINT(1) DEFAULT 1,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_display_order (display_order)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Menu Categories table ready');

    // 2. Menus (e.g. Tom Yum, Clear Soup, Coke)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS menus (
        id INT AUTO_INCREMENT PRIMARY KEY,
        category_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        base_price DECIMAL(10, 2) DEFAULT 0.00,
        image_url TEXT,
        display_order INT DEFAULT 0,
        is_active TINYINT(1) DEFAULT 1,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES menu_categories(id) ON DELETE CASCADE,
        INDEX idx_category_id (category_id),
        INDEX idx_display_order (display_order)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Menus table ready');

    // 3. Option Groups (e.g. Noodle Types, Toppings, Spiciness)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS option_groups (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        selection_type ENUM('single', 'multiple') DEFAULT 'single',
        is_required TINYINT(1) DEFAULT 0,
        display_order INT DEFAULT 0,
        is_active TINYINT(1) DEFAULT 1,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_display_order (display_order)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Option Groups table ready');

    // 4. Options (e.g. Thin Noodle, Pork +60, Extra Spicy)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS options (
        id INT AUTO_INCREMENT PRIMARY KEY,
        group_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        price_adjustment DECIMAL(10, 2) DEFAULT 0.00,
        is_default TINYINT(1) DEFAULT 0,
        display_order INT DEFAULT 0,
        is_available TINYINT(1) DEFAULT 1,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (group_id) REFERENCES option_groups(id) ON DELETE CASCADE,
        INDEX idx_group_id (group_id),
        INDEX idx_display_order (display_order)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Options table ready');

    // 5. Menu Option Config (The Mapper)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS menu_option_config (
        menu_id INT NOT NULL,
        option_group_id INT NOT NULL,
        display_order INT DEFAULT 0,
        is_required TINYINT(1) DEFAULT 1,
        PRIMARY KEY (menu_id, option_group_id),
        FOREIGN KEY (menu_id) REFERENCES menus(id) ON DELETE CASCADE,
        FOREIGN KEY (option_group_id) REFERENCES option_groups(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Menu Option Config table ready');

    // 6. Tables (Customer Tables)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS tables (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(50) NOT NULL,
        is_active TINYINT(1) DEFAULT 1,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tables table ready');

    // Sales Tables
    await connection.query(`
      CREATE TABLE IF NOT EXISTS sales (
        id INT AUTO_INCREMENT PRIMARY KEY,
        userId INT NOT NULL,
        totalAmount DECIMAL(10, 2) NOT NULL,
        paymentMethod VARCHAR(50) DEFAULT 'cash',
        customerName VARCHAR(255),
        paper_order_ref VARCHAR(50),
        table_id INT,
        order_type VARCHAR(20) DEFAULT 'dine_in',
        notes TEXT,
        saleDate DATETIME DEFAULT CURRENT_TIMESTAMP,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_userId (userId),
        INDEX idx_saleDate (saleDate)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Sales table ready');

    await connection.query(`
      CREATE TABLE IF NOT EXISTS sale_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        saleId INT NOT NULL,
        menu_id INT,
        itemName VARCHAR(255) NOT NULL,
        quantity INT NOT NULL,
        base_price DECIMAL(10, 2) NOT NULL,
        total_price DECIMAL(10, 2) NOT NULL,
        options_json TEXT, 
        notes TEXT,
        is_cancelled TINYINT(1) DEFAULT 0,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (saleId) REFERENCES sales(id) ON DELETE CASCADE,
        FOREIGN KEY (menu_id) REFERENCES menus(id) ON DELETE SET NULL,
        INDEX idx_saleId (saleId)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Sale items table ready');

    // MIGRATION: Check if is_cancelled exists, if not add it
    try {
      const [columns] = await connection.query("SHOW COLUMNS FROM sale_items LIKE 'is_cancelled'");
      if (columns.length === 0) {
        console.log('🔄 Migrating sale_items: Adding is_cancelled column...');
        await connection.query("ALTER TABLE sale_items ADD COLUMN is_cancelled TINYINT(1) DEFAULT 0");
        console.log('✅ Migration successful');
      }
    } catch (err) {
      console.error('⚠️ Migration check failed:', err.message);
    }

    // MIGRATION: Check if sale_id exists in transactions
    try {
      const [columns] = await connection.query("SHOW COLUMNS FROM transactions LIKE 'sale_id'");
      if (columns.length === 0) {
        console.log('🔄 Migrating transactions: Adding sale_id column...');
        await connection.query("ALTER TABLE transactions ADD COLUMN sale_id INT DEFAULT NULL");
        await connection.query("ALTER TABLE transactions ADD INDEX idx_sale_id (sale_id)");
        console.log('✅ Migration successful: Added sale_id to transactions');
      }

      // Data Cleanup / Backfill
      // 1. Backfill sale_id for existing POS transactions
      console.log('🔄 Running data cleanup: Backfilling sale_id...');
      await connection.query(`
        UPDATE transactions t 
        JOIN sales s ON t.description LIKE CONCAT('%', s.paper_order_ref, '%')
        SET t.sale_id = s.id 
        WHERE t.sale_id IS NULL AND t.category = 'POS Sales'
      `);

      // 2. Remove transactions for sales that are cancelled
      console.log('🔄 Running data cleanup: Removing cancelled sales from transactions...');
      const [delResult] = await connection.query(`
        DELETE t FROM transactions t
        JOIN sales s ON t.sale_id = s.id
        WHERE s.status = 'cancelled'
      `);
      console.log(`✅ Data cleanup complete: Removed ${delResult.affectedRows} orphaned transactions.`);

    } catch (err) {
      console.error('⚠️ Migration transactions check failed:', err.message);
    }

    console.log('\n✨ All tables initialized successfully!\n');

    // Create default admin if not exists
    await seedDefaultAdmin(connection);

    // Note: We are NOT seeding default income/expense categories here to avoid conflict, 
    // or we can keep the separate 'categories' table for transactions if needed.
    // Wait, the user has 'categories' for income/expense AND for menu.
    // The previous implementation had 'categories' table for transactions.
    // We must ensure we don't assume table name conflict.
    // My previous code kept 'categories' for the transaction logic.
    // BUT now I'm creating 'categories' again?
    // CHECK: The schema above creates 'categories'. Does it conflict with the income/expense one?
    // The previous file had 'categories' table for transactions.
    // I should probably rename the menu categories table to 'menu_categories' to be safe,
    // OR realize that the user asked for "Categories" specifically for menu.
    // Let's look at the file content again to be sure about the transaction categories table name.
    // In the previous step I viewed the file, it had:
    // CREATE TABLE IF NOT EXISTS categories ( ... type VARCHAR(50) ... )
    // This is for Income/Expense.
    // So I MUST rename the new menu categories table to 'menu_categories' to avoid conflict.
    // I will rename it 'menu_categories' in the SQL but expose it as 'Categories' in the UI.

  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  } finally {
    connection.release();
  }
}

// Seed default admin user
async function seedDefaultAdmin(connection) {
  try {
    const [rows] = await connection.query(
      "SELECT id FROM users WHERE email = 'admin@example.com'"
    );

    if (rows.length === 0) {
      const hashedPassword = bcrypt.hashSync('admin123', 10);
      await connection.query(
        `INSERT INTO users (username, email, password, fullName, role, status) 
         VALUES ('admin', 'admin@example.com', ?, 'Administrator', 'admin', 'active')`,
        [hashedPassword]
      );
      console.log('👤 Default admin user created (email: admin@example.com, password: admin123)');
    }
  } catch (error) {
    console.error('⚠️  Error seeding admin:', error.message);
  }
}

// Seed default categories
async function seedDefaultCategories(connection) {
  try {
    const [existingCategories] = await connection.query(
      'SELECT id FROM categories WHERE userId = 1'
    );

    if (existingCategories.length > 0) {
      return; // Already seeded
    }

    const defaultIncomeCategories = [
      'Salary', 'Freelance', 'Investment', 'Gift', 'Other Income'
    ];

    const defaultExpenseCategories = [
      'Food & Dining', 'Transport', 'Shopping', 'Entertainment',
      'Bills & Utilities', 'Health', 'Education', 'Travel', 'Other Expense'
    ];

    // Seed global categories (userId = 1)
    for (const name of defaultIncomeCategories) {
      await connection.query(
        `INSERT INTO categories (userId, name, type, isActive, isDefault) 
         VALUES (1, ?, 'income', 1, 1)`,
        [name]
      );
    }

    for (const name of defaultExpenseCategories) {
      await connection.query(
        `INSERT INTO categories (userId, name, type, isActive, isDefault) 
         VALUES (1, ?, 'expense', 1, 1)`,
        [name]
      );
    }

    console.log('📁 Default categories created');
  } catch (error) {
    console.error('⚠️  Error seeding categories:', error.message);
  }
}

// Wrapper to mimic better-sqlite3 API (for backward compatibility)
class DatabaseWrapper {
  prepare(sql) {
    return {
      run: async (...params) => {
        const connection = await pool.getConnection();
        try {
          const [result] = await connection.query(sql, params);
          return {
            lastInsertRowid: result.insertId || 0,
            changes: result.affectedRows || 0
          };
        } finally {
          connection.release();
        }
      },
      get: async (...params) => {
        const connection = await pool.getConnection();
        try {
          const [rows] = await connection.query(sql, params);
          return rows[0] || undefined;
        } finally {
          connection.release();
        }
      },
      all: async (...params) => {
        const connection = await pool.getConnection();
        try {
          const [rows] = await connection.query(sql, params);
          return rows;
        } finally {
          connection.release();
        }
      }
    };
  }

  async exec(sql) {
    const connection = await pool.getConnection();
    try {
      await connection.query(sql);
    } finally {
      connection.release();
    }
  }

  // Get connection pool (for advanced usage)
  getPool() {
    return pool;
  }

  // Get single connection (for transactions)
  async getConnection() {
    return await pool.getConnection();
  }

  // Helper for backup (returns pool info)
  getDbPath() {
    return `mysql://${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;
  }

  async reloadDatabase() {
    // No-op for MySQL (not needed like SQLite file reload)
    console.log('ℹ️  Database reload not needed for MySQL');
  }

  async createBackup(filename) {
    // This will be handled differently in backup.js
    throw new Error('MySQL backup should use mysqldump - see backup.js');
  }
}

// Initialize database on module load
await initDatabase();

// Export wrapper instance
export default new DatabaseWrapper();
