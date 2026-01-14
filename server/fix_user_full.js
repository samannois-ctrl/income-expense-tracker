import mysql from 'mysql2/promise';

async function fixUser() {
    console.log('🔄 Attempting to recreate database user...');

    // Connect as root
    const connection = await mysql.createConnection({
        host: 'localhost',
        port: 3306,
        user: 'root',
        password: ''
    });

    try {
        console.log('✅ Connected as root.');

        // 1. Create Database if not exists
        await connection.query("CREATE DATABASE IF NOT EXISTS income_expense_tracker");
        console.log('✅ Database checked/created.');

        // 2. Drop user if exists to start fresh
        // Note: 'IF EXISTS' prevents error if user is missing
        await connection.query("DROP USER IF EXISTS 'tracker_user'@'localhost'");
        console.log('✅ Old user dropped.');

        // 3. Create user with password
        await connection.query("CREATE USER 'tracker_user'@'localhost' IDENTIFIED BY 'tracker_pass'");
        console.log('✅ User created with password.');

        // 4. Grant privileges
        await connection.query("GRANT ALL PRIVILEGES ON income_expense_tracker.* TO 'tracker_user'@'localhost'");
        console.log('✅ Privileges granted.');

        // 5. Flush
        await connection.query("FLUSH PRIVILEGES");
        console.log('✅ Privileges flushed.');

        console.log('✨ access fix complete!');

    } catch (err) {
        console.error('❌ Error fixing user:', err);
    } finally {
        await connection.end();
    }
}

fixUser();
