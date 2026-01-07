import express from 'express';
import db from '../database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get monthly summary (Income vs Expense)
router.get('/monthly', authenticateToken, async (req, res) => {
    try {
        const { year } = req.query;
        let query = `
            SELECT 
                DATE_FORMAT(date, '%Y-%m') as month,
                type,
                SUM(amount) as total
            FROM transactions 
            WHERE userId = ?
        `;
        const params = [req.user.id];

        if (year) {
            query += ' AND YEAR(date) = ?';
            params.push(year);
        }

        query += ' GROUP BY month, type ORDER BY month ASC';

        const rows = await db.prepare(query).all(...params);

        // Transform data for frontend chart
        // Input: [{month: '2024-01', type: 'income', total: 100}, {month: '2024-01', type: 'expense', total: 50}]
        // Output: [{name: 'Jan 2024', income: 100, expense: 50, rawDate: '2024-01'}]

        const processData = (rows) => {
            const map = new Map();

            rows.forEach(row => {
                const monthKey = row.month;
                if (!map.has(monthKey)) {
                    const dateObj = new Date(monthKey + '-01');
                    const monthName = dateObj.toLocaleString('default', { month: 'short', year: 'numeric' });

                    map.set(monthKey, {
                        name: monthName,
                        income: 0,
                        expense: 0,
                        rawDate: monthKey
                    });
                }

                const entry = map.get(monthKey);
                if (row.type === 'income') {
                    entry.income = Number(row.total);
                } else if (row.type === 'expense') {
                    entry.expense = Number(row.total);
                }
            });

            return Array.from(map.values());
        };

        const result = processData(rows);
        res.json(result);

    } catch (error) {
        console.error('Report error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get daily details for a specific month
router.get('/daily', authenticateToken, async (req, res) => {
    try {
        const { startDate, endDate, category } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({ error: 'Start date and End date are required' });
        }

        let query = `
            SELECT 
                DATE_FORMAT(date, '%Y-%m-%d') as dateStr,
                DAY(date) as day,
                type,
                SUM(amount) as total
            FROM transactions 
            WHERE userId = ? AND date BETWEEN ? AND ?
        `;
        const params = [req.user.id, startDate, endDate];

        if (category && category !== 'all') {
            query += ' AND category = ?';
            params.push(category);
        }

        query += ' GROUP BY dateStr, type ORDER BY dateStr ASC';

        const rows = await db.prepare(query).all(...params);

        // Transform for chart
        const processData = (rows) => {
            const map = new Map();

            rows.forEach(row => {
                const dateKey = row.dateStr;
                if (!map.has(dateKey)) {
                    // Create more descriptive label for range view
                    const dateObj = new Date(dateKey);
                    const label = dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

                    map.set(dateKey, {
                        name: label,
                        day: row.day,
                        income: 0,
                        expense: 0,
                        date: dateKey
                    });
                }

                const entry = map.get(dateKey);
                if (row.type === 'income') {
                    entry.income = Number(row.total);
                } else if (row.type === 'expense') {
                    entry.expense = Number(row.total);
                }
            });

            return Array.from(map.values());
        };

        res.json(processData(rows));

    } catch (error) {
        console.error('Report error:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
