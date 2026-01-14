
import db from './database.js';

async function applyFix() {
    try {
        console.log('🔄 Applying Fix for Jan 8-10 Data...');

        // Update: Add 1 day to date for records created >= 17:00 UTC
        const query = `
            UPDATE transactions 
            SET date = DATE_ADD(date, INTERVAL 1 DAY)
            WHERE date BETWEEN '2026-01-07' AND '2026-01-10'
            AND HOUR(createdAt) >= 17
        `;

        const result = await db.prepare(query).run();
        console.log(`✅ Fixed ${result.changes} records.`);
        console.log('Please verify the reports page.');

    } catch (err) {
        console.error(err);
    }
}

applyFix();
