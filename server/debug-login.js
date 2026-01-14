import db from './database.js';
import bcrypt from 'bcryptjs';

async function debugLogin() {
    try {
        console.log('--- Starting Login Debug ---');
        const username = 'admin';

        console.log(`1. Attempting to fetch user '${username}'...`);
        const user = await db.prepare('SELECT * FROM users WHERE username = ?').get(username);

        if (!user) {
            console.log('❌ User not found in DB.');
        } else {
            console.log('✅ User found:', { id: user.id, username: user.username, role: user.role, status: user.status });

            if (user.status !== 'active') {
                console.log('❌ User is not active.');
            }

            // Test password check
            const password = 'admin123';
            console.log('2. Testing password verification...');
            // Check if password hash is valid
            if (!user.password) {
                console.log('❌ User has no password hash!');
            } else {
                try {
                    const match = bcrypt.compareSync(password, user.password);
                    console.log('Password match result:', match);
                } catch (bcryptErr) {
                    console.error('❌ Bcrypt error:', bcryptErr);
                }
            }
        }

        console.log('✅ Login simulation finished without crashing.');

    } catch (err) {
        console.error('❌ CRASHED:', err);
        console.error('Stack:', err.stack);
    } finally {
        process.exit(0);
    }
}

debugLogin();
