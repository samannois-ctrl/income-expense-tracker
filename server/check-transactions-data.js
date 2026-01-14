
import db from './database.js';

async function checkTransactions() {
    try {
        console.log('Checking transaction data...');
        const transactions = await db.prepare('SELECT * FROM transactions LIMIT 5').all();
        console.log('Transactions sample:', JSON.stringify(transactions, null, 2));

        if (transactions.length > 0) {
            const first = transactions[0];
            // Check if all required fields are present and not null
            // userId, amount, date, type, category
            if (!first.userId || !first.amount || !first.date || !first.type || !first.category) {
                console.warn('⚠️ Potential missing fields in transactions');
            }
        }
    } catch (e) {
        console.error('❌ Error reading transactions:', e.message);
    }
    process.exit(0);
}

checkTransactions();
