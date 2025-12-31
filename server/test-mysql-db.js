import db from './database.js';

console.log('🧪 Testing new MySQL database.js...\n');

async function testDatabase() {
    try {
        // Test 1: Check connection
        console.log('Test 1: Connection test');
        const pool = db.getPool();
        const connection = await pool.getConnection();
        console.log('✅ Connection successful\n');
        connection.release();

        // Test 2: Query users table
        console.log('Test 2: Query users table');
        const users = await db.prepare('SELECT * FROM users').all();
        console.log(`✅ Found ${users.length} user(s)`);
        if (users.length > 0) {
            console.log('   Sample user:', users[0].email);
        }
        console.log('');

        // Test 3: Query categories
        console.log('Test 3: Query categories');
        const categories = await db.prepare('SELECT * FROM categories').all();
        console.log(`✅ Found ${categories.length} categor${categories.length === 1 ? 'y' : 'ies'}`);
        console.log('');

        // Test 4: Check all tables exist
        console.log('Test 4: Check all tables');
        const [tables] = await pool.query('SHOW TABLES');
        console.log(`✅ Found ${tables.length} table(s):`);
        tables.forEach(table => {
            const tableName = Object.values(table)[0];
            console.log(`   - ${tableName}`);
        });
        console.log('');

        console.log('✨ All tests passed! Database is ready.\n');

    } catch (error) {
        console.error('❌ Test failed:', error);
        process.exit(1);
    }
}

testDatabase();
