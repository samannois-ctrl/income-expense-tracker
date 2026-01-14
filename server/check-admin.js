import db from './database.js';

async function checkAdmin() {
    try {
        console.log('Checking for admin user...');
        const user = await db.prepare('SELECT * FROM users WHERE username = ? OR email = ?').get('admin', 'admin@example.com');

        if (user) {
            console.log('Admin user found:');
            console.log('ID:', user.id);
            console.log('Username:', user.username);
            console.log('Email:', user.email);
            console.log('Role:', user.role);
            console.log('Status:', user.status);
            // Don't print full hash but length/prefix to verify it's there
            console.log('Password hash length:', user.password ? user.password.length : 0);
        } else {
            console.log('Admin user NOT found.');
        }
    } catch (err) {
        console.error('Error querying database:', err);
    }
    // db.pool is not directly exposed in wrapper for closing, but script will exit or we can force exit
    process.exit(0);
}

checkAdmin();
