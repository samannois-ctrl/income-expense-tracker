import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

console.log('🚀 Running all migrations for MariaDB...\n');

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

// Migration tracking
async function setupMigrationTracking(connection) {
    await connection.query(`
    CREATE TABLE IF NOT EXISTS migration_history (
      id INT AUTO_INCREMENT PRIMARY KEY,
      migration_name VARCHAR(255) UNIQUE NOT NULL,
      executed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      success TINYINT(1) DEFAULT 1,
      error_message TEXT,
      INDEX idx_migration_name (migration_name)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

async function isMigrationExecuted(connection, migrationName) {
    const [rows] = await connection.query(
        'SELECT id FROM migration_history WHERE migration_name = ? AND success = 1',
        [migrationName]
    );
    return rows.length > 0;
}

async function recordMigration(connection, migrationName, success, errorMessage = null) {
    await connection.query(
        `INSERT INTO migration_history (migration_name, success, error_message) 
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE 
     executed_at = CURRENT_TIMESTAMP, 
     success = VALUES(success), 
     error_message = VALUES(error_message)`,
        [migrationName, success, errorMessage]
    );
}

// Individual migration runners
async function runAddMenuTables(connection) {
    console.log('📋 Running: add-menu-tables.js');

    await connection.query(`
    CREATE TABLE IF NOT EXISTS menu_categories (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      display_order INT DEFAULT 0,
      is_active TINYINT(1) DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_display_order (display_order)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

    await connection.query(`
    CREATE TABLE IF NOT EXISTS menu_options (
      id INT AUTO_INCREMENT PRIMARY KEY,
      category_id INT NOT NULL,
      name VARCHAR(255) NOT NULL,
      price DECIMAL(10, 2) NOT NULL,
      display_order INT DEFAULT 0,
      is_active TINYINT(1) DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES menu_categories(id) ON DELETE CASCADE,
      INDEX idx_category (category_id),
      INDEX idx_display_order (display_order)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

    await connection.query(`
    CREATE TABLE IF NOT EXISTS noodles (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      display_order INT DEFAULT 0,
      is_active TINYINT(1) DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_display_order (display_order)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

    console.log('  ✅ Menu tables created');
}

async function runAddPosTables(connection) {
    console.log('📋 Running: add-pos-tables.js');

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

    console.log('  ✅ POS tables created');
}

async function runUpdatePosSchema(connection) {
    console.log('📋 Running: update-pos-schema.js');

    // Helper function to check if column exists
    async function columnExists(tableName, columnName) {
        const [rows] = await connection.query(
            `SELECT COUNT(*) as count FROM information_schema.COLUMNS 
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
            [process.env.DB_NAME || 'income_expense_tracker', tableName, columnName]
        );
        return rows[0].count > 0;
    }

    // Add columns if they don't exist
    if (!(await columnExists('sale_items', 'category_id'))) {
        await connection.query('ALTER TABLE sale_items ADD COLUMN category_id INT');
        console.log('  ✅ Added category_id column');
    }

    if (!(await columnExists('sale_items', 'option_id'))) {
        await connection.query('ALTER TABLE sale_items ADD COLUMN option_id INT');
        console.log('  ✅ Added option_id column');
    }

    if (!(await columnExists('sale_items', 'noodle_id'))) {
        await connection.query('ALTER TABLE sale_items ADD COLUMN noodle_id INT');
        console.log('  ✅ Added noodle_id column');
    }

    if (!(await columnExists('sale_items', 'is_custom'))) {
        await connection.query('ALTER TABLE sale_items ADD COLUMN is_custom TINYINT(1) DEFAULT 0');
        console.log('  ✅ Added is_custom column');
    }

    // Add foreign keys (ignore errors if already exist)
    try {
        await connection.query(`
      ALTER TABLE sale_items
      ADD CONSTRAINT fk_sale_items_category FOREIGN KEY (category_id) 
      REFERENCES menu_categories(id) ON DELETE SET NULL
    `);
        console.log('  ✅ Added foreign key for category_id');
    } catch (e) {
        if (e.code !== 'ER_DUP_KEYNAME' && e.code !== 'ER_FK_DUP_NAME') {
            console.log('  ⚠️  Foreign key for category_id may already exist');
        }
    }

    try {
        await connection.query(`
      ALTER TABLE sale_items
      ADD CONSTRAINT fk_sale_items_option FOREIGN KEY (option_id) 
      REFERENCES menu_options(id) ON DELETE SET NULL
    `);
        console.log('  ✅ Added foreign key for option_id');
    } catch (e) {
        if (e.code !== 'ER_DUP_KEYNAME' && e.code !== 'ER_FK_DUP_NAME') {
            console.log('  ⚠️  Foreign key for option_id may already exist');
        }
    }

    try {
        await connection.query(`
      ALTER TABLE sale_items
      ADD CONSTRAINT fk_sale_items_noodle FOREIGN KEY (noodle_id) 
      REFERENCES noodles(id) ON DELETE SET NULL
    `);
        console.log('  ✅ Added foreign key for noodle_id');
    } catch (e) {
        if (e.code !== 'ER_DUP_KEYNAME' && e.code !== 'ER_FK_DUP_NAME') {
            console.log('  ⚠️  Foreign key for noodle_id may already exist');
        }
    }
}

async function runSeedMenuData(connection) {
    console.log('📋 Running: seed-menu-data.js');

    // Check if data already exists
    const [existingCategories] = await connection.query('SELECT COUNT(*) as count FROM menu_categories');
    if (existingCategories[0].count > 0) {
        console.log('  ⚠️  Menu data already exists, skipping seed...');
        return;
    }

    // Insert Categories
    const categories = [
        { name: 'ต้มยำ', display_order: 1 },
        { name: 'น้ำใส', display_order: 2 },
        { name: 'เย็นตาโฟ', display_order: 3 },
        { name: 'เครื่องดื่ม', display_order: 4 },
        { name: 'อาหารเพิ่ม', display_order: 5 }
    ];

    for (const cat of categories) {
        await connection.query(
            'INSERT INTO menu_categories (name, display_order) VALUES (?, ?)',
            [cat.name, cat.display_order]
        );
    }
    console.log('  ✅ Categories added');

    // Insert Noodle Types
    const noodles = [
        { name: 'เส้นเล็ก', display_order: 1 },
        { name: 'เส้นใหญ่', display_order: 2 },
        { name: 'เส้นหมี่ขาว', display_order: 3 },
        { name: 'เส้นแบะแซ', display_order: 4 },
        { name: 'เส้นแช่แห้ง', display_order: 5 },
        { name: 'บะหมี่เหลือง', display_order: 6 },
        { name: 'วุ้นเส้น', display_order: 7 }
    ];

    for (const noodle of noodles) {
        await connection.query(
            'INSERT INTO noodles (name, display_order) VALUES (?, ?)',
            [noodle.name, noodle.display_order]
        );
    }
    console.log('  ✅ Noodle types added');

    // Get category IDs
    const [tomYumRows] = await connection.query('SELECT id FROM menu_categories WHERE name = ?', ['ต้มยำ']);
    const [namSaiRows] = await connection.query('SELECT id FROM menu_categories WHERE name = ?', ['น้ำใส']);
    const [yenTaFoRows] = await connection.query('SELECT id FROM menu_categories WHERE name = ?', ['เย็นตาโฟ']);
    const [drinksRows] = await connection.query('SELECT id FROM menu_categories WHERE name = ?', ['เครื่องดื่ม']);
    const [extrasRows] = await connection.query('SELECT id FROM menu_categories WHERE name = ?', ['อาหารเพิ่ม']);

    const tomYumId = tomYumRows[0].id;
    const namSaiId = namSaiRows[0].id;
    const yenTaFoId = yenTaFoRows[0].id;
    const drinksId = drinksRows[0].id;
    const extrasId = extrasRows[0].id;

    // Insert Menu Options
    const allOptions = [
        // ต้มยำ
        { category_id: tomYumId, name: 'หมูนุ่ม', price: 70, display_order: 1 },
        { category_id: tomYumId, name: 'หมูแดง', price: 70, display_order: 2 },
        { category_id: tomYumId, name: 'หมูกรอบ', price: 70, display_order: 3 },
        { category_id: tomYumId, name: 'รวมหมู', price: 80, display_order: 4 },
        { category_id: tomYumId, name: 'ทะเล', price: 80, display_order: 5 },
        { category_id: tomYumId, name: 'พิเศษ', price: 80, display_order: 6 },
        // น้ำใส
        { category_id: namSaiId, name: 'หมูนุ่ม', price: 60, display_order: 1 },
        { category_id: namSaiId, name: 'หมูแดง', price: 60, display_order: 2 },
        { category_id: namSaiId, name: 'หมูกรอบ', price: 60, display_order: 3 },
        { category_id: namSaiId, name: 'รวมหมู', price: 70, display_order: 4 },
        { category_id: namSaiId, name: 'ทะเล', price: 70, display_order: 5 },
        { category_id: namSaiId, name: 'พิเศษ', price: 70, display_order: 6 },
        // เย็นตาโฟ
        { category_id: yenTaFoId, name: 'หมูนุ่ม', price: 60, display_order: 1 },
        { category_id: yenTaFoId, name: 'หมูแดง', price: 60, display_order: 2 },
        { category_id: yenTaFoId, name: 'หมูกรอบ', price: 60, display_order: 3 },
        { category_id: yenTaFoId, name: 'รวมหมู', price: 70, display_order: 4 },
        { category_id: yenTaFoId, name: 'ทะเล', price: 70, display_order: 5 },
        { category_id: yenTaFoId, name: 'พิเศษ', price: 70, display_order: 6 },
        // เครื่องดื่ม
        { category_id: drinksId, name: 'น้ำเปล่า', price: 10, display_order: 1 },
        { category_id: drinksId, name: 'โค้ก', price: 15, display_order: 2 },
        { category_id: drinksId, name: 'สไปรท์', price: 15, display_order: 3 },
        { category_id: drinksId, name: 'น้ำส้ม', price: 20, display_order: 4 },
        { category_id: drinksId, name: 'กาแฟร้อน', price: 25, display_order: 5 },
        { category_id: drinksId, name: 'กาแฟเย็น', price: 30, display_order: 6 },
        // อาหารเพิ่ม
        { category_id: extrasId, name: 'ข้าวสวย', price: 10, display_order: 1 },
        { category_id: extrasId, name: 'ลูกชิ้นลอยฟ้า', price: 70, display_order: 2 },
        { category_id: extrasId, name: 'ไข่ต้ม', price: 10, display_order: 3 },
        { category_id: extrasId, name: 'เกี๊ยวซ่า', price: 50, display_order: 4 }
    ];

    for (const opt of allOptions) {
        await connection.query(
            'INSERT INTO menu_options (category_id, name, price, display_order) VALUES (?, ?, ?, ?)',
            [opt.category_id, opt.name, opt.price, opt.display_order]
        );
    }
    console.log('  ✅ Menu options added');
    console.log(`  📊 Summary: ${categories.length} categories, ${noodles.length} noodle types, ${allOptions.length} menu options`);
}

// Main migration runner
async function runAllMigrations() {
    const connection = await pool.getConnection();

    try {
        console.log('🔍 Checking database connection...');
        await connection.ping();
        console.log('✅ Database connected\n');

        // Setup migration tracking
        console.log('📝 Setting up migration tracking...');
        await setupMigrationTracking(connection);
        console.log('✅ Migration tracking ready\n');

        // Define migrations in order
        const migrations = [
            { name: 'add-menu-tables', fn: runAddMenuTables },
            { name: 'add-pos-tables', fn: runAddPosTables },
            { name: 'update-pos-schema', fn: runUpdatePosSchema },
            { name: 'seed-menu-data', fn: runSeedMenuData }
        ];

        // Run each migration
        for (const migration of migrations) {
            try {
                // Check if already executed
                if (await isMigrationExecuted(connection, migration.name)) {
                    console.log(`⏭️  Skipping ${migration.name} (already executed)\n`);
                    continue;
                }

                // Run migration
                await migration.fn(connection);

                // Record success
                await recordMigration(connection, migration.name, 1);
                console.log(`✅ ${migration.name} completed\n`);

            } catch (error) {
                console.error(`❌ Error in ${migration.name}:`, error.message);
                await recordMigration(connection, migration.name, 0, error.message);
                throw error;
            }
        }

        console.log('✨ All migrations completed successfully!\n');

        // Show migration history
        const [history] = await connection.query(
            'SELECT migration_name, executed_at, success FROM migration_history ORDER BY executed_at DESC'
        );
        console.log('📜 Migration History:');
        history.forEach(record => {
            const status = record.success ? '✅' : '❌';
            const date = new Date(record.executed_at).toLocaleString();
            console.log(`  ${status} ${record.migration_name} (${date})`);
        });

    } catch (error) {
        console.error('\n❌ Migration failed:', error);
        throw error;
    } finally {
        connection.release();
        await pool.end();
    }
}

// Run migrations
runAllMigrations().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
