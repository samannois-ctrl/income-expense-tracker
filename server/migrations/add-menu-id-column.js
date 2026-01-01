import db from '../database.js';

async function migrate() {
    console.log('🔄 Starting migration to add menu_id to sale_items...');
    const pool = db.getPool();
    const connection = await pool.getConnection();

    try {
        // Check if column exists
        const [columns] = await connection.query("SHOW COLUMNS FROM sale_items LIKE 'menu_id'");

        if (columns.length === 0) {
            console.log('⚠️  Column menu_id does not exist. Adding it now...');
            await connection.query(`
        ALTER TABLE sale_items 
        ADD COLUMN menu_id INT AFTER saleId,
        ADD FOREIGN KEY (menu_id) REFERENCES menus(id) ON DELETE SET NULL
      `);
            console.log('✅ Column menu_id added successfully.');
        } else {
            console.log('ℹ️  Column menu_id already exists.');
        }

    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        connection.release();
        process.exit();
    }
}

migrate();
