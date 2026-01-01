import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

console.log('🚀 Rebuilding Menu Schema (5 Tables)...\n');

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
    // 1. Drop existing tables if they exist (Reverse order of dependencies)
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');

    const tablesToDrop = [
      'menu_option_config',
      'options',
      'option_groups',
      'menus',
      'menu_categories',
      // Drop old tables from previous attempts to clean up
      'menu_options',
      'noodles'
    ];

    for (const table of tablesToDrop) {
      await connection.query(`DROP TABLE IF EXISTS ${table}`);
      console.log(`🗑️  Dropped table: ${table}`);
    }

    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('-----------------------------------');

    // 2. Create menu_categories
    await connection.query(`
      CREATE TABLE menu_categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        display_order INT DEFAULT 0,
        is_active TINYINT(1) DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Created table: menu_categories');

    // 3. Create menus
    await connection.query(`
      CREATE TABLE menus (
        id INT AUTO_INCREMENT PRIMARY KEY,
        category_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        base_price DECIMAL(10, 2) DEFAULT 0.00,
        display_order INT DEFAULT 0,
        is_active TINYINT(1) DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES menu_categories(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Created table: menus');

    // 4. Create option_groups
    await connection.query(`
      CREATE TABLE option_groups (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        selection_type VARCHAR(20) DEFAULT 'single' COMMENT 'single, multiple',
        is_optional TINYINT(1) DEFAULT 0,
        display_order INT DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Created table: option_groups');

    // 5. Create options
    await connection.query(`
      CREATE TABLE options (
        id INT AUTO_INCREMENT PRIMARY KEY,
        group_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        price_adjustment DECIMAL(10, 2) DEFAULT 0.00,
        is_available TINYINT(1) DEFAULT 1,
        display_order INT DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (group_id) REFERENCES option_groups(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Created table: options');

    // 6. Create menu_option_config
    await connection.query(`
      CREATE TABLE menu_option_config (
        id INT AUTO_INCREMENT PRIMARY KEY,
        menu_id INT NOT NULL,
        option_group_id INT NOT NULL,
        display_order INT DEFAULT 0,
        is_required TINYINT(1) DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (menu_id) REFERENCES menus(id) ON DELETE CASCADE,
        FOREIGN KEY (option_group_id) REFERENCES option_groups(id) ON DELETE CASCADE,
      PRIMARY KEY (id),
        UNIQUE KEY unique_menu_group (menu_id, option_group_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Created table: menu_option_config');

    // 7. Create tables (Customer Tables)
    await connection.query(`
      CREATE TABLE tables (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(50) NOT NULL,
        is_active TINYINT(1) DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Created table: tables');

    // --- Seed Data (Optional but helpful) ---
    console.log('-----------------------------------');
    console.log('🌱 Seeding initial data...');

    // Categories
    const [catResult] = await connection.query(`
      INSERT INTO menu_categories (name, display_order) VALUES 
      ('ก๋วยเตี๋ยว', 1),
      ('อาหารทานเล่น', 2),
      ('เครื่องดื่ม', 3)
    `);
    const noodleCatId = catResult.insertId;

    // Menus
    const [menuResult] = await connection.query(`
      INSERT INTO menus (category_id, name, base_price, display_order) VALUES 
      (?, 'ต้มยำ', 50.00, 1),
      (?, 'น้ำใส', 50.00, 2)
    `, [noodleCatId, noodleCatId]);
    const tomYumId = menuResult.insertId;

    // Option Groups
    const [ogResult1] = await connection.query(`INSERT INTO option_groups (name, selection_type, is_optional) VALUES ('เส้น', 'single', 0)`);
    const noodleGroupId = ogResult1.insertId;

    const [ogResult2] = await connection.query(`INSERT INTO option_groups (name, selection_type, is_optional) VALUES ('ท้อปปิ้ง', 'single', 0)`);
    const toppingGroupId = ogResult2.insertId;

    // Options for "Noodle Type"
    await connection.query(`
      INSERT INTO options (group_id, name, price_adjustment) VALUES 
      (?, 'เส้นเล็ก', 0),
      (?, 'เส้นใหญ่', 0),
      (?, 'บะหมี่', 0)
    `, [noodleGroupId, noodleGroupId, noodleGroupId]);

    // Options for "Topping"
    await connection.query(`
      INSERT INTO options (group_id, name, price_adjustment) VALUES 
      (?, 'หมูนุ่ม', 10),
      (?, 'รวมหมู', 10),
      (?, 'ทะเล', 20)
    `, [toppingGroupId, toppingGroupId, toppingGroupId]);

    // Config Mapping: Tom Yum -> Noodle Type & Topping
    await connection.query(`
      INSERT INTO menu_option_config (menu_id, option_group_id, display_order) VALUES 
      (?, ?, 1),
      (?, ?, 2)
    `, [tomYumId, noodleGroupId, tomYumId, toppingGroupId]);

    console.log('🌱 Seed data inserted');

    console.log('\n✨ Menu Schema Rebuild Completed!');
  } catch (error) {
    console.error('❌ Error rebuilding schema:', error);
    throw error;
  } finally {
    connection.release();
    await pool.end();
  }
}

runMigration().catch(console.error);
