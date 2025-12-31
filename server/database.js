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
  dateStrings: true
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
        type VARCHAR(50) NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        quantity INT DEFAULT 1,
        category VARCHAR(255) NOT NULL,
        description TEXT,
        date DATE NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_userId (userId),
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

    // Create menu categories table (for POS)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS menu_categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        display_order INT DEFAULT 0,
        is_active TINYINT(1) DEFAULT 1,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_name (name),
        INDEX idx_display_order (display_order)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Menu categories table ready');

    // Create menu options table (for POS)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS menu_options (
        id INT AUTO_INCREMENT PRIMARY KEY,
        category_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        display_order INT DEFAULT 0,
        is_active TINYINT(1) DEFAULT 1,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES menu_categories(id) ON DELETE CASCADE,
        INDEX idx_category (category_id),
        INDEX idx_name (name),
        INDEX idx_display_order (display_order)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Menu options table ready');

    // Create noodles table (for POS) - renamed from noodle_types for consistency
    await connection.query(`
      CREATE TABLE IF NOT EXISTS noodles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        display_order INT DEFAULT 0,
        is_active TINYINT(1) DEFAULT 1,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_name (name),
        INDEX idx_display_order (display_order)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Noodles table ready');

    // Create sales table (for POS)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS sales (
        id INT AUTO_INCREMENT PRIMARY KEY,
        userId INT NOT NULL,
        totalAmount DECIMAL(10, 2) NOT NULL,
        paymentMethod VARCHAR(50) DEFAULT 'cash',
        customerName VARCHAR(255),
        notes TEXT,
        saleDate DATETIME DEFAULT CURRENT_TIMESTAMP,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_userId (userId),
        INDEX idx_saleDate (saleDate)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Sales table ready');

    // Create sale_items table (for POS)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS sale_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        saleId INT NOT NULL,
        itemName VARCHAR(255) NOT NULL,
        quantity INT NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        category_id INT,
        option_id INT,
        noodle_id INT,
        is_custom TINYINT(1) DEFAULT 0,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (saleId) REFERENCES sales(id) ON DELETE CASCADE,
        FOREIGN KEY (category_id) REFERENCES menu_categories(id) ON DELETE SET NULL,
        FOREIGN KEY (option_id) REFERENCES menu_options(id) ON DELETE SET NULL,
        FOREIGN KEY (noodle_id) REFERENCES noodles(id) ON DELETE SET NULL,
        INDEX idx_saleId (saleId)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Sale items table ready');

    console.log('\n✨ All tables initialized successfully!\n');

    // Create default admin if not exists
    await seedDefaultAdmin(connection);

    // Seed default categories
    await seedDefaultCategories(connection);

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
