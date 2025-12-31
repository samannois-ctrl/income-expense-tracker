import initSqlJs from 'sql.js';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dbPath = join(__dirname, 'database.sqlite');

async function addQuantityColumn() {
    console.log('🔧 เริ่มเพิ่ม column quantity ให้ transactions table...\n');

    const SQL = await initSqlJs();

    if (!fs.existsSync(dbPath)) {
        console.log('❌ ไม่พบไฟล์ database.sqlite');
        return;
    }

    const buffer = fs.readFileSync(dbPath);
    const db = new SQL.Database(buffer);

    try {
        // ตรวจสอบว่ามี column quantity อยู่แล้วหรือไม่
        const tableInfo = db.exec('PRAGMA table_info(transactions)');
        const columns = tableInfo[0]?.values.map(row => row[1]) || [];

        if (columns.includes('quantity')) {
            console.log('✅ Column quantity มีอยู่แล้ว ไม่ต้องทำอะไร');
            db.close();
            return;
        }

        console.log('📝 เพิ่ม column quantity ให้ transactions table...');

        // เพิ่ม column quantity
        db.run('ALTER TABLE transactions ADD COLUMN quantity INTEGER DEFAULT 1');

        // บันทึกกลับไปที่ไฟล์
        const data = db.export();
        fs.writeFileSync(dbPath, data);

        console.log('✅ เพิ่ม column quantity สำเร็จ!');
        console.log('✅ ข้อมูลเดิมทั้งหมดถูกรักษาไว้');
        console.log('✅ Quantity ของ records เดิมจะเป็น 1 (ค่า default)');
        console.log('\n🎉 สามารถทดสอบ quantity feature ได้แล้ว!');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        db.close();
    }
}

addQuantityColumn().catch(console.error);
