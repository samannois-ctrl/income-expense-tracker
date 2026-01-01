import db from './server/database.js';

async function check() {
    try {
        const rows = await db.prepare('SELECT * FROM transactions LIMIT 5').all();
        console.log('Transaction Sample:', rows);
        if (rows.length > 0) {
            console.log('Type of amount:', typeof rows[0].amount);
            console.log('Value of amount:', rows[0].amount);
        } else {
            console.log('No transactions found.');
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
