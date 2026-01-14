import mysql from 'mysql2/promise';

async function fixPermissions() {
    console.log('Attempting to fix permissions...');
    const connection = await mysql.createConnection({
        host: 'localhost',
        port: 3306,
        user: 'root',
        password: ''
    });

    try {
        console.log('Connected as root.');
        await connection.query("GRANT ALL PRIVILEGES ON income_expense_tracker.* TO 'tracker_user'@'localhost'");
        console.log('Granted privileges.');

        await connection.query("FLUSH PRIVILEGES");
        console.log('Flushed privileges. Done.');
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await connection.end();
    }
}

fixPermissions();
