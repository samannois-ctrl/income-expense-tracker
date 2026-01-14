
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.join(__dirname, '.env');

try {
    let content = fs.readFileSync(envPath, 'utf8');

    // Replace DB_USER
    if (content.includes('DB_USER=')) {
        content = content.replace(/DB_USER=.*/g, 'DB_USER=root');
    } else {
        content += '\nDB_USER=root';
    }

    // Replace DB_PASSWORD
    // We assume root has no password based on previous test-root.js success
    // If DB_ROOT_PASSWORD exists in env, we should use that, but for now let's set it empty as per test-root.js
    if (content.includes('DB_PASSWORD=')) {
        content = content.replace(/DB_PASSWORD=.*/g, 'DB_PASSWORD=');
    } else {
        content += '\nDB_PASSWORD=';
    }

    fs.writeFileSync(envPath, content);
    console.log('✅ .env updated successfully to use root user.');

} catch (error) {
    console.error('❌ Error updating .env:', error.message);
}
