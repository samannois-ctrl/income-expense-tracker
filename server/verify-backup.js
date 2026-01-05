import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import db from './database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const backupDir = path.join(__dirname, 'backups');

console.log('Backup Directory:', backupDir);

if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
}

async function testBackup() {
    try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `manual-test-${timestamp}.sql`;
        const filePath = path.join(backupDir, filename);

        console.log('Creating backup at:', filePath);

        const writeStream = fs.createWriteStream(filePath);

        // Helper to escape values for SQL
        function escapeSqlValue(val) {
            if (val === null) return 'NULL';
            if (typeof val === 'number') return val;
            if (typeof val === 'boolean') return val ? 1 : 0;
            if (val instanceof Date) return "'" + val.toISOString().slice(0, 19).replace('T', ' ') + "'";
            return "'" + String(val).replace(/\\/g, '\\\\').replace(/'/g, "''").replace(/\n/g, '\\n').replace(/\r/g, '\\r') + "'";
        }

        writeStream.write(`-- Backup generated at ${new Date().toISOString()}\n`);

        const tables = await db.prepare('SHOW TABLES').all();
        console.log('Tables found:', tables.length);

        for (const row of tables) {
            const tableName = Object.values(row)[0];
            const createTableResult = await db.prepare(`SHOW CREATE TABLE \`${tableName}\``).get();
            writeStream.write(`DROP TABLE IF EXISTS \`${tableName}\`;\n`);
            writeStream.write(`${createTableResult['Create Table']};\n\n`);
        }

        writeStream.end();

        await new Promise((resolve, reject) => {
            writeStream.on('finish', resolve);
            writeStream.on('error', reject);
        });

        console.log('Backup created successfully.');

        const stats = fs.statSync(filePath);
        console.log('File size:', stats.size);

    } catch (error) {
        console.error('Backup failed:', error);
    }
}

testBackup();
