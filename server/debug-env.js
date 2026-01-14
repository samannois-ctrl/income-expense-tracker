
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

console.log('--- Env Loader Debug ---');
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASSWORD length:', process.env.DB_PASSWORD ? process.env.DB_PASSWORD.length : 0);
console.log('DB_PASSWORD is empty string?', process.env.DB_PASSWORD === '');
console.log('DB_PASSWORD is undefined?', process.env.DB_PASSWORD === undefined);
console.log('DB_ROOT_PASSWORD:', process.env.DB_ROOT_PASSWORD);
