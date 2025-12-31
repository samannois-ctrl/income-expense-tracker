import initSqlJs from 'sql.js';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dbPath = join(__dirname, 'database.sqlite');

async function checkLastRecord() {
    const SQL = await initSqlJs();

    if (!fs.existsSync(dbPath)) {
        console.log('❌ ไม่พบไฟล์ database.sqlite');
        return;
    }

    const buffer = fs.readFileSync(dbPath);
    const db = new SQL.Database(buffer);

    console.log('🔍 ดึง Transaction Record ล่าสุด');
    console.log('================================================\n');

    // Query record ล่าสุด
    const result = db.exec(`
    SELECT id, type, amount, quantity, category, description, date, createdAt 
    FROM transactions 
    ORDER BY createdAt DESC 
    LIMIT 1
  `);

    if (result && result.length > 0 && result[0].values.length > 0) {
        const columns = result[0].columns;
        const values = result[0].values[0];
        const record = {};
        columns.forEach((col, idx) => {
            record[col] = values[idx];
        });

        console.log('✅ Transaction Record ล่าสุด:');
        console.log('─────────────────────────────────────');
        console.log(`   ID: ${record.id}`);
        console.log(`   Type: ${record.type}`);
        console.log(`   Amount: ${record.amount}`);
        console.log(`   🎯 Quantity: ${record.quantity}`);
        console.log(`   Category: ${record.category}`);
        console.log(`   Description: ${record.description || '(ไม่มี)'}`);
        console.log(`   Date: ${record.date}`);
        console.log(`   Created: ${record.createdAt}`);
        console.log('─────────────────────────────────────');
    } else {
        console.log('❌ ไม่พบ transactions ในฐานข้อมูล');
    }

    db.close();
}

checkLastRecord().catch(console.error);
