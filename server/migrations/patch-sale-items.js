import db from '../database.js';

async function migrate() {
    console.log('🔄 Starting migration to patch sale_items table...');
    const pool = db.getPool();
    const connection = await pool.getConnection();

    try {
        const columnsToCheck = [
            { name: 'menu_id', def: 'INT', after: 'saleId', fk: 'ADD FOREIGN KEY (menu_id) REFERENCES menus(id) ON DELETE SET NULL' },
            { name: 'base_price', def: 'DECIMAL(10, 2) NOT NULL DEFAULT 0.00', after: 'quantity' },
            { name: 'total_price', def: 'DECIMAL(10, 2) NOT NULL DEFAULT 0.00', after: 'base_price' },
            { name: 'options_json', def: 'TEXT', after: 'total_price' },
            { name: 'notes', def: 'TEXT', after: 'options_json' }
        ];

        for (const col of columnsToCheck) {
            const [rows] = await connection.query(`SHOW COLUMNS FROM sale_items LIKE '${col.name}'`);
            if (rows.length === 0) {
                console.log(`⚠️  Column '${col.name}' missing. Adding...`);
                let sql = `ALTER TABLE sale_items ADD COLUMN ${col.name} ${col.def}`;
                if (col.after) sql += ` AFTER ${col.after}`;
                if (col.fk) sql += `, ${col.fk}`;

                await connection.query(sql);
                console.log(`✅ Column '${col.name}' added.`);
            } else {
                console.log(`ℹ️  Column '${col.name}' already exists.`);
            }
        }

        console.log('✨ sale_items table patch completed.');

    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        connection.release();
        process.exit();
    }
}

migrate();
