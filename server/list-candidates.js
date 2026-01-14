
import db from './database.js';

async function listCandidates() {
    try {
        console.log('--- Searching for transactions to shift ---');
        // Criteria: Records where the stored date is X, but the creation time (UTC) is late (>= 17:00),
        // meaning it was actually early morning X+1 in Thai time.

        const query = `
            SELECT id, date, type, amount, category, description, createdAt 
            FROM transactions 
            WHERE date BETWEEN '2026-01-07' AND '2026-01-10'
            AND HOUR(createdAt) >= 17
            ORDER BY createdAt
        `;

        const rows = await db.prepare(query).all();

        if (rows.length === 0) {
            console.log('No candidates found.');
            return;
        }

        console.table(rows.map(r => {
            const created = new Date(r.createdAt);
            // Shift +7 hours for display
            created.setHours(created.getHours() + 7);
            const thaiDate = created.toISOString().split('T')[0];

            return {
                ID: r.id,
                'Stored Date': r.date,
                'Actual Thai Date': thaiDate,
                'Type': r.type,
                'Amount': r.amount,
                'Desc': r.description
            };
        }));

        console.log(`\nFound ${rows.length} records. usage: node fix-candidates.js`);

    } catch (err) {
        console.error(err);
    }
}

listCandidates();
