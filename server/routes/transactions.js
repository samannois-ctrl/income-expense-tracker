import express from 'express';
import db from '../database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get all transactions (all users) with user info
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { startDate, endDate, type } = req.query;
        let query = `
            SELECT 
                t.*,
                u.fullName as userName,
                u.email as userEmail
            FROM transactions t
            LEFT JOIN users u ON t.userId = u.id
            WHERE 1=1
        `;
        let params = [];

        if (startDate) {
            query += ' AND t.date >= ?';
            params.push(startDate);
        }
        if (endDate) {
            query += ' AND t.date <= ?';
            params.push(endDate);
        }
        if (type && type !== 'all') {
            query += ' AND t.type = ?';
            params.push(type);
        }

        query += ' ORDER BY t.date DESC, t.createdAt DESC';

        const transactions = await db.prepare(query).all(...params);
        res.json(transactions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get summary (totals)
router.get('/summary', authenticateToken, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let incomeQuery = 'SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = ?';
        let expenseQuery = 'SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = ?';
        let incomeParams = ['income'];
        let expenseParams = ['expense'];

        if (startDate) {
            incomeQuery += ' AND date >= ?';
            expenseQuery += ' AND date >= ?';
            incomeParams.push(startDate);
            expenseParams.push(startDate);
        }
        if (endDate) {
            incomeQuery += ' AND date <= ?';
            expenseQuery += ' AND date <= ?';
            incomeParams.push(endDate);
            expenseParams.push(endDate);
        }

        const incomeResult = await db.prepare(incomeQuery).get(...incomeParams);
        const expenseResult = await db.prepare(expenseQuery).get(...expenseParams);

        const income = incomeResult.total;
        const expense = expenseResult.total;

        res.json({
            income,
            expense,
            balance: income - expense
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create transaction
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { type, amount, quantity, category, description, date } = req.body;

        console.log('📝 CREATE Transaction - Received data:', { type, amount, quantity, category, description, date });

        if (!type || !amount || !category || !date) {
            return res.status(400).json({ error: 'Type, amount, category, and date are required' });
        }

        const finalQuantity = quantity || 1;
        console.log('💾 Saving with quantity:', finalQuantity);

        const result = await db.prepare(`
      INSERT INTO transactions (userId, type, amount, quantity, category, description, date) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(req.user.id, type, amount, finalQuantity, category, description || null, date);

        const transaction = await db.prepare('SELECT * FROM transactions WHERE id = ?').get(result.lastInsertRowid);
        res.json(transaction);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update transaction
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { type, amount, quantity, category, description, date } = req.body;

        const existing = await db.prepare('SELECT * FROM transactions WHERE id = ?').get(id);
        if (!existing) {
            return res.status(404).json({ error: 'Transaction not found' });
        }

        await db.prepare(`
      UPDATE transactions SET type = ?, amount = ?, quantity = ?, category = ?, description = ?, date = ? WHERE id = ?
    `).run(
            type || existing.type,
            amount || existing.amount,
            quantity !== undefined ? quantity : (existing.quantity || 1),
            category || existing.category,
            description !== undefined ? description : existing.description,
            date || existing.date,
            id
        );

        const transaction = await db.prepare('SELECT * FROM transactions WHERE id = ?').get(id);
        res.json(transaction);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete transaction
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        const existing = await db.prepare('SELECT * FROM transactions WHERE id = ?').get(id);
        if (!existing) {
            return res.status(404).json({ error: 'Transaction not found' });
        }

        await db.prepare('DELETE FROM transactions WHERE id = ?').run(id);
        res.json({ message: 'Transaction deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
