
import db from './database.js';

async function checkData() {
    try {
        const query = `
            SELECT id, date, type, amount, category, description 
            FROM transactions 
            WHERE date BETWEEN '2026-01-01' AND '2026-01-12'
            ORDER BY date, type
        `;
        const rows = await db.prepare(query).all();
        console.log('--- Transactions Jan 1-12 ---');
        console.table(rows);
    } catch (err) {
        console.error(err);
    }
}

checkData();
