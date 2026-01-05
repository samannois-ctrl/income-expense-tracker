
import db from './database.js';

async function verifyUsers() {
    try {
        console.log('Verifying users in database...');
        const users = await db.prepare('SELECT id, username, email, role, status FROM users').all();
        console.log('Users found:', users);

        const admin = users.find(u => u.username === 'admin');
        if (admin) {
            console.log('✅ Admin user exists:', admin);
        } else {
            console.error('❌ Admin user NOT found!');
        }
    } catch (error) {
        console.error('❌ Error verifying users:', error);
    } finally {
        // We need to close the pool to exit the script, but database.js doesn't export a close method directly except via pool access.
        // But we can just let it hang or force exit.
        process.exit(0);
    }
}

verifyUsers();
