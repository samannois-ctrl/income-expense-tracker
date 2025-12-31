import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

console.log('🌱 Seeding menu data for MariaDB...\n');

// Create connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'tracker_user',
    password: process.env.DB_PASSWORD || 'tracker_pass',
    database: process.env.DB_NAME || 'income_expense_tracker',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

async function seedMenuData() {
    const connection = await pool.getConnection();

    try {
        // Check if data already exists
        const [existingCategories] = await connection.query('SELECT COUNT(*) as count FROM menu_categories');
        if (existingCategories[0].count > 0) {
            console.log('⚠️  Menu data already exists, skipping seed...');
            return;
        }

        // Insert Categories
        const categories = [
            { name: 'ต้มยำ', display_order: 1 },
            { name: 'น้ำใส', display_order: 2 },
            { name: 'เย็นตาโฟ', display_order: 3 },
            { name: 'เครื่องดื่ม', display_order: 4 },
            { name: 'อาหารเพิ่ม', display_order: 5 }
        ];

        console.log('Adding categories...');
        for (const cat of categories) {
            await connection.query(
                'INSERT INTO menu_categories (name, display_order) VALUES (?, ?)',
                [cat.name, cat.display_order]
            );
        }
        console.log('✅ Categories added');

        // Insert Noodle Types
        const noodles = [
            { name: 'เส้นเล็ก', display_order: 1 },
            { name: 'เส้นใหญ่', display_order: 2 },
            { name: 'เส้นหมี่ขาว', display_order: 3 },
            { name: 'เส้นแบะแซ', display_order: 4 },
            { name: 'เส้นแช่แห้ง', display_order: 5 },
            { name: 'บะหมี่เหลือง', display_order: 6 },
            { name: 'วุ้นเส้น', display_order: 7 }
        ];

        console.log('Adding noodle types...');
        for (const noodle of noodles) {
            await connection.query(
                'INSERT INTO noodles (name, display_order) VALUES (?, ?)',
                [noodle.name, noodle.display_order]
            );
        }
        console.log('✅ Noodle types added');

        // Get category IDs
        const [tomYumRows] = await connection.query('SELECT id FROM menu_categories WHERE name = ?', ['ต้มยำ']);
        const [namSaiRows] = await connection.query('SELECT id FROM menu_categories WHERE name = ?', ['น้ำใส']);
        const [yenTaFoRows] = await connection.query('SELECT id FROM menu_categories WHERE name = ?', ['เย็นตาโฟ']);
        const [drinksRows] = await connection.query('SELECT id FROM menu_categories WHERE name = ?', ['เครื่องดื่ม']);
        const [extrasRows] = await connection.query('SELECT id FROM menu_categories WHERE name = ?', ['อาหารเพิ่ม']);

        const tomYumId = tomYumRows[0].id;
        const namSaiId = namSaiRows[0].id;
        const yenTaFoId = yenTaFoRows[0].id;
        const drinksId = drinksRows[0].id;
        const extrasId = extrasRows[0].id;

        // Insert Menu Options for ต้มยำ
        const tomYumOptions = [
            { category_id: tomYumId, name: 'หมูนุ่ม', price: 70, display_order: 1 },
            { category_id: tomYumId, name: 'หมูแดง', price: 70, display_order: 2 },
            { category_id: tomYumId, name: 'หมูกรอบ', price: 70, display_order: 3 },
            { category_id: tomYumId, name: 'รวมหมู', price: 80, display_order: 4 },
            { category_id: tomYumId, name: 'ทะเล', price: 80, display_order: 5 },
            { category_id: tomYumId, name: 'พิเศษ', price: 80, display_order: 6 }
        ];

        // Insert Menu Options for น้ำใส
        const namSaiOptions = [
            { category_id: namSaiId, name: 'หมูนุ่ม', price: 60, display_order: 1 },
            { category_id: namSaiId, name: 'หมูแดง', price: 60, display_order: 2 },
            { category_id: namSaiId, name: 'หมูกรอบ', price: 60, display_order: 3 },
            { category_id: namSaiId, name: 'รวมหมู', price: 70, display_order: 4 },
            { category_id: namSaiId, name: 'ทะเล', price: 70, display_order: 5 },
            { category_id: namSaiId, name: 'พิเศษ', price: 70, display_order: 6 }
        ];

        // Insert Menu Options for เย็นตาโฟ
        const yenTaFoOptions = [
            { category_id: yenTaFoId, name: 'หมูนุ่ม', price: 60, display_order: 1 },
            { category_id: yenTaFoId, name: 'หมูแดง', price: 60, display_order: 2 },
            { category_id: yenTaFoId, name: 'หมูกรอบ', price: 60, display_order: 3 },
            { category_id: yenTaFoId, name: 'รวมหมู', price: 70, display_order: 4 },
            { category_id: yenTaFoId, name: 'ทะเล', price: 70, display_order: 5 },
            { category_id: yenTaFoId, name: 'พิเศษ', price: 70, display_order: 6 }
        ];

        // Insert Menu Options for เครื่องดื่ม
        const drinkOptions = [
            { category_id: drinksId, name: 'น้ำเปล่า', price: 10, display_order: 1 },
            { category_id: drinksId, name: 'โค้ก', price: 15, display_order: 2 },
            { category_id: drinksId, name: 'สไปรท์', price: 15, display_order: 3 },
            { category_id: drinksId, name: 'น้ำส้ม', price: 20, display_order: 4 },
            { category_id: drinksId, name: 'กาแฟร้อน', price: 25, display_order: 5 },
            { category_id: drinksId, name: 'กาแฟเย็น', price: 30, display_order: 6 }
        ];

        // Insert Menu Options for อาหารเพิ่ม
        const extraOptions = [
            { category_id: extrasId, name: 'ข้าวสวย', price: 10, display_order: 1 },
            { category_id: extrasId, name: 'ลูกชิ้นลอยฟ้า', price: 70, display_order: 2 },
            { category_id: extrasId, name: 'ไข่ต้ม', price: 10, display_order: 3 },
            { category_id: extrasId, name: 'เกี๊ยวซ่า', price: 50, display_order: 4 }
        ];

        console.log('Adding menu options...');
        const allOptions = [...tomYumOptions, ...namSaiOptions, ...yenTaFoOptions, ...drinkOptions, ...extraOptions];

        for (const opt of allOptions) {
            await connection.query(
                'INSERT INTO menu_options (category_id, name, price, display_order) VALUES (?, ?, ?, ?)',
                [opt.category_id, opt.name, opt.price, opt.display_order]
            );
        }
        console.log('✅ Menu options added');

        console.log('\n✨ Menu data seeding completed!');
        console.log(`📊 Summary:
  - ${categories.length} categories
  - ${noodles.length} noodle types
  - ${allOptions.length} menu options
`);
    } catch (error) {
        console.error('❌ Error seeding menu data:', error);
        throw error;
    } finally {
        connection.release();
        await pool.end();
    }
}

// Run seeding
seedMenuData().catch(console.error);