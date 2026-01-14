
import db from './database.js';

async function analyzeData() {
    try {
        console.log('--- Candidates for Date Correction (UTC 17:00+ = Thai Next Day) ---');

        // Find records where createdAt is late in the UTC day (17:00 - 23:59)
        // This corresponds to 00:00 - 06:59 Thai Time next day.
        const query = `
            SELECT id, date, type, amount, category, description, createdAt 
            FROM transactions 
            WHERE date BETWEEN '2026-01-01' AND '2026-01-12'
            AND HOUR(createdAt) >= 17
            ORDER BY createdAt
        `;

        const rows = await db.prepare(query).all();

        if (rows.length === 0) {
            console.log('No misaligned records found.');
        } else {
            console.table(rows.map(r => {
                const created = new Date(r.createdAt);
                // Manually shift to Thai time display
                created.setHours(created.getHours() + 7);
                const thaiTime = created.toISOString().replace('T', ' ').substring(0, 19);

                return {
                    id: r.id,
                    'Current Date': r.date,
                    'Created (Thai Time)': thaiTime,
                    'Suggested New Date': thaiTime.split(' ')[0],
                    'Category': r.category
                };
            }));
            console.log(`\nFound ${rows.length} records that look like they belong to the next day.`);
        }

    } catch (err) {
        console.error(err);
    }
}

analyzeData();
