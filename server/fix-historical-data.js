
import db from './database.js';

async function fixData() {
    try {
        console.log('🔄 SCRIPT START: Fixing Historical Data...');

        // 1. Snapshot Misaligned Data
        // Look for records where createdAt hour is >= 17 (5 PM UTC = 12 AM Thai)
        // AND the stored date equals the DATE(createdAt)
        // This implies they were stored with UTC date, but belong to Next Day Thai

        const checkQuery = `
            SELECT id, date, createdAt, type, amount 
            FROM transactions 
            WHERE date BETWEEN '2026-01-01' AND '2026-01-11'
            AND HOUR(createdAt) >= 17
        `;

        const rows = await db.prepare(checkQuery).all();
        console.log(`Found ${rows.length} records to fix (Late night UTC):`);
        if (rows.length === 0) {
            console.log('No records found matching the criteria.');
            return;
        }

        console.table(rows.map(r => ({ ...r, 'New Date': 'Next Day' })));

        // 2. Update Data
        // Add 1 day to 'date' for these records
        const updateQuery = `
            UPDATE transactions 
            SET date = DATE_ADD(date, INTERVAL 1 DAY)
            WHERE id IN (${rows.map(r => r.id).join(',')})
        `;

        const result = await db.prepare(updateQuery).run();
        console.log(`✅ Updated ${result.changes} records.`);
        console.log('Historical data corrected.');

    } catch (err) {
        console.error('❌ Error:', err);
    }
}

fixData();
