import express from 'express';
import db from '../database.js';
import { authenticateToken as auth } from '../middleware/auth.js';

const router = express.Router();

const generateSaleNumber = () => {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
    const timeStr = now.getTime().toString().slice(-4);
    return `SALE-${dateStr}-${timeStr}`;
};

// Create Sale
// Create or Append Order (Session Management)
router.post('/sales', auth, async (req, res) => {
    const { customerName, paymentMethod, notes, items, tableId, orderType, saleId: providedSaleId } = req.body; // Added saleId (optional)
    const userId = req.user.id;

    if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'Items are required' });
    }

    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        let saleId = providedSaleId;
        let saleResult;

        // 1. Determine Sale ID (Append vs Create)

        // CASE A: Table is provided -> Prioritize Table's Active Session
        if (tableId) {
            const [table] = await connection.query('SELECT current_sale_id, status FROM tables WHERE id = ?', [tableId]);
            if (table && table[0] && table[0].current_sale_id) {
                // Existing Session: Append to it
                saleId = table[0].current_sale_id;
            } else {
                // No Active Session logic flows to creation below
                saleId = null;
            }
        }

        // CASE B: providedSaleId exists (e.g. Appending to specific Take Away order)
        // (Already set saleId = providedSaleId above)

        if (saleId) {
            // --- APPEND MODE ---
            // Fetch current total to update it
            const [currentSale] = await connection.query('SELECT totalAmount FROM sales WHERE id = ?', [saleId]);
            if (!currentSale || currentSale.length === 0) {
                throw new Error("Active order not found");
            }

            let newTotal = Number(currentSale[0].totalAmount);
            const addedTotal = items.reduce((sum, item) => sum + (item.total_price * item.quantity), 0);
            newTotal += addedTotal;

            // Update Sale Total
            await connection.query('UPDATE sales SET totalAmount = ? WHERE id = ?', [newTotal, saleId]);

        } else {
            // --- CREATE MODE ---
            const saleNumber = generateSaleNumber();
            const totalAmount = items.reduce((sum, item) => sum + item.total_price, 0);

            // Determine specific fields
            let insertTableId = null;
            let insertOrderType = orderType || 'take_away';

            if (tableId) {
                insertTableId = tableId;
                insertOrderType = 'dine_in';
            }

            const [res] = await connection.query(
                `INSERT INTO sales (userId, totalAmount, paymentMethod, customerName, paper_order_ref, notes, table_id, order_type, saleDate, status) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), 'open')`,
                [userId, totalAmount, paymentMethod || 'cash', customerName || null, saleNumber, notes || null, insertTableId, insertOrderType]
            );
            saleId = res.insertId;

            // If Table, Link it
            if (tableId) {
                await connection.query('UPDATE tables SET current_sale_id = ?, status = "occupied" WHERE id = ?', [saleId, tableId]);
            }
        }

        // 2. Insert Items (Append)
        for (const item of items) {
            await connection.query(
                `INSERT INTO sale_items (saleId, menu_id, itemName, quantity, base_price, total_price, options_json, notes) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    saleId,
                    item.menu_id,
                    item.itemName,
                    item.quantity,
                    item.base_price, // Stores original base (without options)
                    item.total_price, // FIX: Use pre-calculated line total (unit * qty)
                    JSON.stringify(item.selectedOptions || []),
                    item.notes || null
                ]
            );
        }

        await connection.commit();
        res.json({ success: true, saleId });

    } catch (error) {
        await connection.rollback();
        console.error('Error processing order:', error);
        res.status(500).json({ error: error.message });
    } finally {
        connection.release();
    }
});

// Get Active Take Away Orders
router.get('/active-takeaway', auth, async (req, res) => {
    try {
        const sales = await db.prepare(`
            SELECT id, customerName, paper_order_ref, totalAmount, notes, saleDate, status
            FROM sales 
            WHERE status = 'open' AND order_type = 'take_away'
            ORDER BY saleDate DESC
        `).all();
        res.json({ data: sales });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Pay / Checkout
router.post('/sales/:id/pay', auth, async (req, res) => {
    const saleId = req.params.id;
    const { paymentMethod, cashReceived } = req.body;
    const userId = req.user.id;

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Get Sale Details
        const [sale] = await connection.query('SELECT * FROM sales WHERE id = ?', [saleId]);
        if (!sale || !sale[0]) throw new Error('Sale not found');
        const saleData = sale[0];

        if (saleData.status === 'completed') {
            await connection.rollback();
            return res.json({ success: true, message: 'Already paid' }); // Idempotency
        }

        // 2. Update Sale Status
        await connection.query(
            'UPDATE sales SET status = "completed", paymentMethod = ? WHERE id = ?',
            [paymentMethod || 'cash', saleId]
        );

        // 3. Create Income Transaction
        const [items] = await connection.query('SELECT COUNT(*) as count FROM sale_items WHERE saleId = ?', [saleId]);
        const itemsCount = items[0].count;

        await connection.query(
            `INSERT INTO transactions (userId, type, amount, quantity, category, description, date) 
             VALUES (?, ?, ?, ?, ?, ?, CURDATE())`,
            [
                userId,
                'income',
                saleData.totalAmount, // Use final total
                itemsCount,
                'POS Sales', // Category
                `POS Sale #${saleData.paper_order_ref} ${saleData.table_id ? '(Table ' + saleData.table_id + ')' : ''}`,
            ]
        );

        // 4. Update Table Status (if applicable)
        if (saleData.table_id) {
            await connection.query('UPDATE tables SET status = "paid" WHERE id = ?', [saleData.table_id]);
        }

        await connection.commit();
        res.json({ success: true });

    } catch (error) {
        await connection.rollback();
        res.status(500).json({ error: error.message });
    } finally {
        connection.release();
    }
});

// Move Table
router.post('/tables/:id/move', auth, async (req, res) => {
    const sourceTableId = req.params.id;
    const { targetTableId } = req.body;

    if (!targetTableId) return res.status(400).json({ error: 'Target table ID is required' });

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Validate Source Table (Must have active sale)
        const [sourceTable] = await connection.query('SELECT current_sale_id FROM tables WHERE id = ?', [sourceTableId]);
        if (!sourceTable || !sourceTable[0] || !sourceTable[0].current_sale_id) {
            throw new Error('Source table has no active order');
        }
        const saleId = sourceTable[0].current_sale_id;

        // 2. Validate Target Table (Must be available)
        const [targetTable] = await connection.query('SELECT status, current_sale_id FROM tables WHERE id = ?', [targetTableId]);
        if (!targetTable || !targetTable[0]) {
            throw new Error('Target table not found');
        }

        // Strict check: Target must be empty (no active sale)
        if (targetTable[0].current_sale_id) {
            throw new Error('Target table is already occupied');
        }

        // 3. Move Sale
        // Update Target Table
        await connection.query('UPDATE tables SET current_sale_id = ?, status = "occupied" WHERE id = ?', [saleId, targetTableId]);

        // Update Sale Record
        await connection.query('UPDATE sales SET table_id = ? WHERE id = ?', [targetTableId, saleId]);

        // Clear Source Table
        await connection.query('UPDATE tables SET current_sale_id = NULL, status = "available" WHERE id = ?', [sourceTableId]);

        await connection.commit();
        res.json({ success: true });

    } catch (error) {
        await connection.rollback();
        console.error('Error moving table:', error);
        res.status(500).json({ error: error.message });
    } finally {
        connection.release();
    }
});

// Clear Table
router.post('/tables/:id/clear', auth, async (req, res) => {
    const tableId = req.params.id;
    try {
        // Use db.prepare().run() for simple updates via Wrapper
        await db.prepare('UPDATE tables SET current_sale_id = NULL, status = "available" WHERE id = ?').run(tableId);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// Get Sales
router.get('/sales', auth, async (req, res) => {
    try {
        const { start_date, end_date } = req.query;
        let query = `
            SELECT s.*, u.fullName as userName, t.name as tableName, COUNT(si.id) as itemsCount
            FROM sales s
            LEFT JOIN users u ON s.userId = u.id
            LEFT JOIN sale_items si ON s.id = si.saleId
            LEFT JOIN tables t ON s.table_id = t.id
            WHERE 1=1
        `;
        const params = [];

        if (start_date) { query += ' AND DATE(s.saleDate) >= ?'; params.push(start_date); }
        if (end_date) { query += ' AND DATE(s.saleDate) <= ?'; params.push(end_date); }

        query += ' GROUP BY s.id ORDER BY s.saleDate DESC';

        // Use db.prepare().all() for SELECT via Wrapper
        const sales = await db.prepare(query).all(...params);
        res.json({ data: sales });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get Sale Detail
router.get('/sales/:id', auth, async (req, res) => {
    try {
        // Use db.prepare().get() for Single Row via Wrapper
        const sale = await db.prepare(`
            SELECT s.*, t.name as tableName 
            FROM sales s 
            LEFT JOIN tables t ON s.table_id = t.id 
            WHERE s.id = ?
        `).get(req.params.id);

        if (!sale) return res.status(404).json({ error: 'Sale not found' });

        const items = await db.prepare('SELECT * FROM sale_items WHERE saleId = ?').all(req.params.id);

        res.json({ sale, items });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- Table Management ---

// Get Tables
router.get('/tables', auth, async (req, res) => {
    try {
        // Use db.prepare().all() via Wrapper
        const tables = await db.prepare('SELECT * FROM tables WHERE is_active=1 ORDER BY id ASC').all();
        res.json({ data: tables });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create Table
router.post('/tables', auth, async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) return res.status(400).json({ error: 'Table name is required' });

        // Use db.prepare().run() for Insert via Wrapper
        const result = await db.prepare('INSERT INTO tables (name, is_active, status) VALUES (?, 1, "available")').run(name);

        // Note: db.prepare().run() returns { lastInsertRowid, changes }
        res.json({ success: true, id: result.lastInsertRowid });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
