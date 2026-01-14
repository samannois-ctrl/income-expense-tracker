import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '.env') });

async function setupDatabase() {
    console.log('🚀 Starting MySQL Database Setup...\n');

    let connection;

    try {
        // Step 1: Connect to MySQL as root (without database)
        console.log('📡 Connecting to MySQL server...');
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            user: process.env.DB_ROOT_USER || 'root',
            password: process.env.DB_ROOT_PASSWORD || '',
        });
        console.log('✅ Connected to MySQL server successfully!\n');

        // Step 2: Create database
        console.log(`🗄️  Creating database '${process.env.DB_NAME}'...`);
        await connection.query(
            `CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME} 
       CHARACTER SET utf8mb4 
       COLLATE utf8mb4_unicode_ci`
        );
        console.log('✅ Database created successfully!\n');

        // Step 3: Create user
        console.log(`👤 Creating user '${process.env.DB_USER}'...`);

        // Drop user if exists (for re-run)
        try {
            await connection.query(`DROP USER IF EXISTS '${process.env.DB_USER}'@'localhost'`);
        } catch (e) {
            // Ignore error if user doesn't exist
        }

        // Create user
        await connection.query(
            `CREATE USER '${process.env.DB_USER}'@'localhost' 
       IDENTIFIED BY '${process.env.DB_PASSWORD}'`
        );
        console.log('✅ User created successfully!\n');

        // Step 4: Grant privileges
        console.log(`🔑 Granting privileges to '${process.env.DB_USER}'...`);
        try {
            await connection.query(
                `GRANT ALL PRIVILEGES ON ${process.env.DB_NAME}.* 
           TO '${process.env.DB_USER}'@'localhost'`
            );
            await connection.query('FLUSH PRIVILEGES');
            console.log('✅ Privileges granted successfully!\n');
        } catch (grantError) {
            console.error('❌ Error granting privileges:', grantError.message);
            throw grantError;
        }

        // Step 5: Test connection with new user
        console.log('🧪 Testing connection with new user...');
        try {
            const userConnection = await mysql.createConnection({
                host: process.env.DB_HOST,
                port: process.env.DB_PORT,
                user: process.env.DB_USER,
                password: process.env.DB_PASSWORD,
                database: process.env.DB_NAME,
            });
            console.log('✅ User connection test successful!\n');
            await userConnection.end();
        } catch (connError) {
            console.error('❌ User connection test FAILED:', connError.message);
            // Verify if we can still connect as root (sanity check)
            console.log('Sanity check: Root still works?');
            // We are already connected as root in 'connection' var
            const [check] = await connection.query('SELECT 1');
            console.log('Root connection is alive:', !!check);
            throw connError;
        }

        // Step 6: Display summary
        console.log('📋 Database Setup Summary:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`Database:  ${process.env.DB_NAME}`);
        console.log(`User:      ${process.env.DB_USER}`);
        console.log(`Password:  ${process.env.DB_PASSWORD}`);
        console.log(`Host:      ${process.env.DB_HOST}`);
        console.log(`Port:      ${process.env.DB_PORT}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        console.log('✨ Database setup completed successfully!');
        console.log('👉 Next step: Run migrations to create tables\n');

    } catch (error) {
        // Write detailed error to file for debugging
        const fs = await import('fs');
        fs.writeFileSync('setup_error.txt', `Error: ${error.message}\nStack: ${error.stack}\n`);

        console.error('❌ Error during database setup:', error.message);
        console.error('\n💡 Troubleshooting:');
        console.error('   1. Make sure MySQL/MariaDB is running in XAMPP');
        console.error('   2. Check if root password is correct in .env file');
        console.error('   3. Check if port 3306 is correct');
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Run setup
setupDatabase();
