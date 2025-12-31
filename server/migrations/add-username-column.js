import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

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

async function migrate() {
    const connection = await pool.getConnection();

    try {
        console.log('🚀 Starting migration: Add username column...');
        await connection.beginTransaction();

        // 1. Check if column exists
        const [columns] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = 'username'
    `, [process.env.DB_NAME || 'income_expense_tracker']);

        if (columns.length > 0) {
            console.log('⚠️  Column "username" already exists. Skipping add column.');
        } else {
            // 2. Add column as nullable first to allow backfilling
            console.log('➕ Adding username column...');
            await connection.query(`
        ALTER TABLE users 
        ADD COLUMN username VARCHAR(50) UNIQUE AFTER id
      `);
            console.log('✅ Column added.');
        }

        // 3. Backfill existing users (if any have null username)
        // Note: If we added it as UNIQUE immediately, it might fail if multiple rows are null or empty.
        // However, in MariaDB, multiple NULLs are allowed in UNIQUE index usually, but let's be safe.
        // Using UPDATE IGNORE or handling duplicates might be needed, but assuming emails are unique, 
        // extracting username from email should be relatively safe for initial population.

        console.log('🔄 Backfilling usernames for existing users...');
        const [users] = await connection.query('SELECT id, email FROM users WHERE username IS NULL');

        if (users.length > 0) {
            for (const user of users) {
                let username = user.email.split('@')[0];
                // Ensure username is unique if simple split collides (rare for email but possible if different domains)
                // Simplistic approach: append id if needed.

                // Try to update
                try {
                    await connection.query('UPDATE users SET username = ? WHERE id = ?', [username, user.id]);
                    console.log(`   updated user ${user.id}: ${username}`);
                } catch (err) {
                    // If duplicate, append id
                    if (err.code === 'ER_DUP_ENTRY') {
                        username = `${username}_${user.id}`;
                        await connection.query('UPDATE users SET username = ? WHERE id = ?', [username, user.id]);
                        console.log(`   updated user ${user.id}: ${username} (duplicate resolved)`);
                    } else {
                        throw err;
                    }
                }
            }
        } else {
            console.log('   No users to backfill.');
        }

        // 4. Modify column to be NOT NULL now that data is populated
        // Only do this if we are sure all have data.
        const [nullUsers] = await connection.query('SELECT count(*) as count FROM users WHERE username IS NULL');
        if (nullUsers[0].count === 0) {
            console.log('🔒 Setting username to NOT NULL...');
            await connection.query('ALTER TABLE users MODIFY COLUMN username VARCHAR(50) NOT NULL');
        }

        // 5. Record migration
        await connection.query(`
      INSERT INTO migration_history (migration_name, success, executed_at) 
      VALUES ('add-username-column', 1, NOW())
      ON DUPLICATE KEY UPDATE executed_at = NOW()
    `);

        await connection.commit();
        console.log('✨ Migration completed successfully!');

    } catch (error) {
        await connection.rollback();
        console.error('❌ Migration failed:', error);
        process.exit(1);
    } finally {
        connection.release();
        await pool.end();
    }
}

migrate();
