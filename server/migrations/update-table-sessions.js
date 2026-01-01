import db from '../database.js';

async function runMigration() {
    console.log("Running Table Session Migration...");

    try {
        const connection = await db.getConnection();

        try {
            // 1. Update 'sales' table: Add 'status'
            console.log("Updating 'sales' table...");
            try {
                await connection.query(`
                    ALTER TABLE sales 
                    ADD COLUMN status ENUM('open', 'completed', 'cancelled') DEFAULT 'open' AFTER order_type
                `);
                console.log("  - Added 'status' column to sales.");
            } catch (e) {
                if (e.code === 'ER_DUP_FIELDNAME') {
                    console.log("  - 'status' column already exists in sales.");
                } else {
                    throw e;
                }
            }

            // 2. Update 'tables' table: Add 'status' and 'current_sale_id'
            console.log("Updating 'tables' table...");
            try {
                await connection.query(`
                    ALTER TABLE tables 
                    ADD COLUMN status ENUM('available', 'occupied', 'paid') DEFAULT 'available' AFTER is_active,
                    ADD COLUMN current_sale_id INT NULL AFTER status
                `);
                console.log("  - Added 'status' and 'current_sale_id' to tables.");
            } catch (e) {
                if (e.code === 'ER_DUP_FIELDNAME') {
                    console.log("  - Columns already exist in tables.");
                } else {
                    throw e;
                }
            }

            console.log("Migration completed successfully.");
            process.exit(0);

        } finally {
            connection.release();
        }

    } catch (error) {
        console.error("Migration failed:", error);
        process.exit(1);
    }
}

runMigration();
