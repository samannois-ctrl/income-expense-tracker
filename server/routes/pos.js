import express from 'express';
import db from '../database.js';
import { authenticateToken as auth } from '../middleware/auth.js';

const router = express.Router();

// Helper function to generate unique sale number
const generateSaleNumber = () => {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
    const timeStr = now.getTime().toString().slice(-4);
    return `SALE-${dateStr}-${timeStr}`;
};

// Create new sale and auto-create income transaction
router.post('/sales', auth, async (req, res) => {
    const { customerName, paymentMethod, notes, items } = req.body;
    const userId = req.user.id;

    // Validate input
    if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'Items are required' });
    }

    // Calculate total amount from items
    const totalAmount = items.reduce((sum, item) => {
        return sum + (item.quantity * item.price);
    }, 0);

    // Get connection for transaction
    const connection = await db.getConnection();

    try {
        // Start transaction
        await connection.beginTransaction();

        // 1. Create income transaction first
        const [txResult] = await connection.query(
            `INSERT INTO transactions (userId, type, amount, quantity, category, description, date) 
             VALUES (?, ?, ?, ?, ?, ?, CURDATE())`,
            [
                userId,
                'income',
                totalAmount,
                items.length,
                'POS Sales',
                `POS Sale: ${items.length} item(s)${customerName ? ' - ' + customerName : ''}`,
            ]
        );

        const transactionId = txResult.insertId;

        // 2. Create POS sale
        // 2. Create POS sale
        const saleNumber = generateSaleNumber();
        const [saleResult] = await connection.query(
            `INSERT INTO pos_sales (sale_number, total_amount, payment_method, notes, transaction_id, created_by, sale_date) 
             VALUES (?, ?, ?, ?, ?, ?, NOW())`,
            [
                saleNumber,
                totalAmount,
                paymentMethod || 'cash',
                notes || (customerName ? `Customer: ${customerName}` : null),
                transactionId,
                userId
            ]
        );

        const saleId = saleResult.insertId;

        // 3. Create sale items
        for (const item of items) {
            await connection.query(
                `INSERT INTO pos_sale_items (sale_id, category_id, option_id, noodle_id, item_name, quantity, unit_price, total_price, notes, is_custom) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    saleId,
                    item.category_id || null,
                    item.option_id || null,
                    item.noodle_id || null,
                    item.itemName,
                    item.quantity,
                    item.price,
                    (item.price * item.quantity),
                    item.notes || null,
                    item.is_custom || 0
                ]
            );
        }

        // Commit transaction
        await connection.commit();

        res.json({
            success: true,
            sale: {
                id: saleId,
                totalAmount,
                transactionId
            }
        });

    } catch (error) {
        // Rollback on error
        await connection.rollback();
        console.error('Error creating sale:', error);
        res.status(500).json({ error: error.message });
    } finally {
        connection.release();
    }
});

// Get all sales with optional filters
router.get('/sales', auth, async (req, res) => {
    try {
        const { start_date, end_date, user_id } = req.query;

        let query = `
            SELECT 
                s.*,
                u.fullName as userName,
                COUNT(si.id) as itemsCount
            FROM pos_sales s
            LEFT JOIN users u ON s.created_by = u.id
            LEFT JOIN pos_sale_items si ON s.id = si.sale_id
            WHERE 1=1
        `;

        const params = [];

        if (start_date) {
            query += ' AND DATE(s.sale_date) >= ?';
            params.push(start_date);
        }

        if (end_date) {
            query += ' AND DATE(s.sale_date) <= ?';
            params.push(end_date);
        }

        if (user_id) {
            query += ' AND s.created_by = ?';
            params.push(user_id);
        }

        query += ' GROUP BY s.id ORDER BY s.sale_date DESC, s.created_at DESC';

        const sales = await db.prepare(query).all(...params);
        res.json({ data: sales });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get sale detail with items
router.get('/sales/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;

        // Get sale info
        const sale = await db.prepare(`
            SELECT s.*, u.fullName as userName
            FROM pos_sales s
            LEFT JOIN users u ON s.created_by = u.id
            WHERE s.id = ?
        `).get(id);

        if (!sale) {
            return res.status(404).json({ error: 'Sale not found' });
        }

        // Get sale items
        const items = await db.prepare(`
            SELECT si.*, 
                   mc.name as categoryName,
                   mo.name as optionName,
                   n.name as noodleName
            FROM pos_sale_items si
            LEFT JOIN menu_categories mc ON si.category_id = mc.id
            LEFT JOIN menu_options mo ON si.option_id = mo.id
            LEFT JOIN noodles n ON si.noodle_id = n.id
            WHERE si.sale_id = ?
        `).all(id);

        res.json({
            sale,
            items
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete sale
router.delete('/sales/:id', auth, async (req, res) => {
    const { id } = req.params;
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        // Delete sale (items will be deleted by CASCADE)
        const [result] = await connection.query('DELETE FROM pos_sales WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'Sale not found' });
        }

        await connection.commit();
        res.json({ success: true, message: 'Sale deleted successfully' });

    } catch (error) {
        await connection.rollback();
        res.status(500).json({ error: error.message });
    } finally {
        connection.release();
    }
});

export default router;
