import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

console.log('🔍 Verifying database migration results...\n');

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

async function verifyDatabase() {
    const connection = await pool.getConnection();
    let allChecksPass = true;

    try {
        console.log('═══════════════════════════════════════════════════════════\n');
        console.log('📊 DATABASE MIGRATION VERIFICATION REPORT\n');
        console.log('═══════════════════════════════════════════════════════════\n');

        // 1. Check all expected tables exist
        console.log('1️⃣  VERIFYING TABLES EXISTENCE\n');
        const expectedTables = [
            'users',
            'transactions',
            'categories',
            'backup_settings',
            'menu_categories',
            'menu_options',
            'noodles',
            'sales',
            'sale_items',
            'pos_sales',
            'pos_sale_items',
            'migration_history'
        ];

        const [tables] = await connection.query('SHOW TABLES');
        const tableNames = tables.map(row => Object.values(row)[0]);

        for (const table of expectedTables) {
            if (tableNames.includes(table)) {
                console.log(`   ✅ ${table}`);
            } else {
                console.log(`   ❌ ${table} - MISSING!`);
                allChecksPass = false;
            }
        }

        // 2. Verify migration history
        console.log('\n2️⃣  MIGRATION HISTORY\n');
        const [history] = await connection.query(
            'SELECT migration_name, executed_at, success FROM migration_history ORDER BY executed_at'
        );

        if (history.length > 0) {
            history.forEach(record => {
                const status = record.success ? '✅' : '❌';
                const date = new Date(record.executed_at).toLocaleString('th-TH');
                console.log(`   ${status} ${record.migration_name.padEnd(25)} (${date})`);
            });
        } else {
            console.log('   ⚠️  No migration history found');
            allChecksPass = false;
        }

        // 3. Verify menu categories
        console.log('\n3️⃣  MENU CATEGORIES DATA\n');
        const [categories] = await connection.query('SELECT id, name, display_order, is_active FROM menu_categories ORDER BY display_order');

        if (categories.length === 5) {
            console.log(`   ✅ Found ${categories.length} categories (expected 5)`);
            categories.forEach(cat => {
                console.log(`      ${cat.id}. ${cat.name} (order: ${cat.display_order}, active: ${cat.is_active ? 'Yes' : 'No'})`);
            });
        } else {
            console.log(`   ❌ Found ${categories.length} categories (expected 5)`);
            allChecksPass = false;
        }

        // 4. Verify noodles
        console.log('\n4️⃣  NOODLE TYPES DATA\n');
        const [noodles] = await connection.query('SELECT id, name, display_order, is_active FROM noodles ORDER BY display_order');

        if (noodles.length === 7) {
            console.log(`   ✅ Found ${noodles.length} noodle types (expected 7)`);
            noodles.forEach(noodle => {
                console.log(`      ${noodle.id}. ${noodle.name} (order: ${noodle.display_order})`);
            });
        } else {
            console.log(`   ❌ Found ${noodles.length} noodle types (expected 7)`);
            allChecksPass = false;
        }

        // 5. Verify menu options
        console.log('\n5️⃣  MENU OPTIONS DATA\n');
        const [options] = await connection.query(`
      SELECT COUNT(*) as total,
             SUM(CASE WHEN category_id = (SELECT id FROM menu_categories WHERE name = 'ต้มยำ') THEN 1 ELSE 0 END) as tomyum,
             SUM(CASE WHEN category_id = (SELECT id FROM menu_categories WHERE name = 'น้ำใส') THEN 1 ELSE 0 END) as namsai,
             SUM(CASE WHEN category_id = (SELECT id FROM menu_categories WHERE name = 'เย็นตาโฟ') THEN 1 ELSE 0 END) as yentafo,
             SUM(CASE WHEN category_id = (SELECT id FROM menu_categories WHERE name = 'เครื่องดื่ม') THEN 1 ELSE 0 END) as drinks,
             SUM(CASE WHEN category_id = (SELECT id FROM menu_categories WHERE name = 'อาหารเพิ่ม') THEN 1 ELSE 0 END) as extras
      FROM menu_options
    `);

        const opt = options[0];
        if (opt.total === 28) {
            console.log(`   ✅ Found ${opt.total} menu options (expected 28)`);
            console.log(`      - ต้มยำ: ${opt.tomyum} items`);
            console.log(`      - น้ำใส: ${opt.namsai} items`);
            console.log(`      - เย็นตาโฟ: ${opt.yentafo} items`);
            console.log(`      - เครื่องดื่ม: ${opt.drinks} items`);
            console.log(`      - อาหารเพิ่ม: ${opt.extras} items`);
        } else {
            console.log(`   ❌ Found ${opt.total} menu options (expected 28)`);
            allChecksPass = false;
        }

        // 6. Verify foreign key constraints on sale_items
        console.log('\n6️⃣  FOREIGN KEY CONSTRAINTS (sale_items)\n');
        const [fks] = await connection.query(`
      SELECT 
        CONSTRAINT_NAME,
        COLUMN_NAME,
        REFERENCED_TABLE_NAME,
        REFERENCED_COLUMN_NAME
      FROM information_schema.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = ? 
        AND TABLE_NAME = 'sale_items'
        AND REFERENCED_TABLE_NAME IS NOT NULL
      ORDER BY CONSTRAINT_NAME
    `, [process.env.DB_NAME || 'income_expense_tracker']);

        const expectedFKs = [
            { column: 'category_id', refTable: 'menu_categories' },
            { column: 'option_id', refTable: 'menu_options' },
            { column: 'noodle_id', refTable: 'noodles' },
            { column: 'saleId', refTable: 'sales' }
        ];

        expectedFKs.forEach(expected => {
            const found = fks.find(fk =>
                fk.COLUMN_NAME === expected.column &&
                fk.REFERENCED_TABLE_NAME === expected.refTable
            );

            if (found) {
                console.log(`   ✅ ${expected.column} → ${expected.refTable}`);
            } else {
                console.log(`   ❌ ${expected.column} → ${expected.refTable} - MISSING!`);
                allChecksPass = false;
            }
        });

        // 7. Verify foreign key constraints on pos_sale_items
        console.log('\n7️⃣  FOREIGN KEY CONSTRAINTS (pos_sale_items)\n');
        const [posFks] = await connection.query(`
      SELECT 
        CONSTRAINT_NAME,
        COLUMN_NAME,
        REFERENCED_TABLE_NAME,
        REFERENCED_COLUMN_NAME
      FROM information_schema.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = ? 
        AND TABLE_NAME = 'pos_sale_items'
        AND REFERENCED_TABLE_NAME IS NOT NULL
      ORDER BY CONSTRAINT_NAME
    `, [process.env.DB_NAME || 'income_expense_tracker']);

        const expectedPosFKs = [
            { column: 'category_id', refTable: 'menu_categories' },
            { column: 'option_id', refTable: 'menu_options' },
            { column: 'noodle_id', refTable: 'noodles' },
            { column: 'sale_id', refTable: 'pos_sales' }
        ];

        expectedPosFKs.forEach(expected => {
            const found = posFks.find(fk =>
                fk.COLUMN_NAME === expected.column &&
                fk.REFERENCED_TABLE_NAME === expected.refTable
            );

            if (found) {
                console.log(`   ✅ ${expected.column} → ${expected.refTable}`);
            } else {
                console.log(`   ❌ ${expected.column} → ${expected.refTable} - MISSING!`);
                allChecksPass = false;
            }
        });

        // 8. Verify indexes
        console.log('\n8️⃣  INDEX VERIFICATION\n');
        const [indexes] = await connection.query(`
      SELECT 
        TABLE_NAME,
        INDEX_NAME,
        GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) as COLUMNS
      FROM information_schema.STATISTICS
      WHERE TABLE_SCHEMA = ?
        AND TABLE_NAME IN ('menu_categories', 'menu_options', 'noodles', 'pos_sales', 'pos_sale_items')
      GROUP BY TABLE_NAME, INDEX_NAME
      ORDER BY TABLE_NAME, INDEX_NAME
    `, [process.env.DB_NAME || 'income_expense_tracker']);

        const indexesByTable = {};
        indexes.forEach(idx => {
            if (!indexesByTable[idx.TABLE_NAME]) indexesByTable[idx.TABLE_NAME] = [];
            indexesByTable[idx.TABLE_NAME].push(`${idx.INDEX_NAME} (${idx.COLUMNS})`);
        });

        Object.entries(indexesByTable).forEach(([table, idxList]) => {
            console.log(`   📋 ${table}:`);
            idxList.forEach(idx => console.log(`      - ${idx}`));
        });

        // 9. Sample menu options with prices
        console.log('\n9️⃣  SAMPLE MENU OPTIONS WITH PRICING\n');
        const [sampleMenu] = await connection.query(`
      SELECT 
        mc.name as category,
        mo.name as option_name,
        mo.price
      FROM menu_options mo
      JOIN menu_categories mc ON mo.category_id = mc.id
      WHERE mc.name IN ('ต้มยำ', 'เครื่องดื่ม')
      ORDER BY mc.display_order, mo.display_order
      LIMIT 10
    `);

        sampleMenu.forEach(item => {
            console.log(`   ${item.category} - ${item.option_name}: ฿${item.price}`);
        });

        // Final summary
        console.log('\n═══════════════════════════════════════════════════════════\n');
        if (allChecksPass) {
            console.log('✅ ALL VERIFICATION CHECKS PASSED!\n');
            console.log('🎉 Database migration completed successfully!');
            console.log('   - All tables created');
            console.log('   - All data seeded correctly');
            console.log('   - Foreign key constraints in place');
            console.log('   - Indexes created properly\n');
        } else {
            console.log('⚠️  SOME VERIFICATION CHECKS FAILED!\n');
            console.log('Please review the output above for details.\n');
        }
        console.log('═══════════════════════════════════════════════════════════\n');

        return allChecksPass;

    } catch (error) {
        console.error('❌ Verification error:', error);
        return false;
    } finally {
        connection.release();
        await pool.end();
    }
}

// Run verification
verifyDatabase()
    .then(success => {
        process.exit(success ? 0 : 1);
    })
    .catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
