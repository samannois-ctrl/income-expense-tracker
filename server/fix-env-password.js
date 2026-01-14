
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.join(__dirname, '.env');

try {
    let content = fs.readFileSync(envPath, 'utf8');

    // Explicitly set empty password
    if (content.includes('DB_PASSWORD=')) {
        content = content.replace(/DB_PASSWORD=.*/g, 'DB_PASSWORD=');
    } else {
        content += '\nDB_PASSWORD=';
    }

    fs.writeFileSync(envPath, content);
    console.log('✅ .env updated: Password set to empty.');

} catch (error) {
    console.error('❌ Error updating .env:', error.message);
}
