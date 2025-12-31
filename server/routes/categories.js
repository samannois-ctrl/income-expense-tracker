import express from 'express';
import db from '../database.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Get all categories (global - shared by all users)
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { type } = req.query; // 'income', 'expense', or undefined for all

        // Get global categories (userId = 1)
        let sql = 'SELECT * FROM categories WHERE userId = 1';
        const params = [];

        if (type) {
            sql += ' AND type = ?';
            params.push(type);
        }

        sql += ' ORDER BY isDefault DESC, name ASC';

        const categories = await db.prepare(sql).all(...params);

        // Add transaction count for each category (from ALL users)
        const categoriesWithCount = await Promise.all(categories.map(async cat => {
            const count = await db.prepare(
                'SELECT COUNT(*) as count FROM transactions WHERE category = ?'
            ).get(cat.name);

            return {
                ...cat,
                transactionCount: count?.count || 0
            };
        }));

        res.json(categoriesWithCount);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create new category (global - admin only)
router.post('/', authenticateToken, async (req, res) => {
    try {
        let { name, type } = req.body;

        if (!name || !type) {
            return res.status(400).json({ error: 'Name and type are required' });
        }

        // Trim whitespace from name
        name = name.trim();

        if (!name) {
            return res.status(400).json({ error: 'Category name cannot be empty' });
        }

        if (type !== 'income' && type !== 'expense') {
            return res.status(400).json({ error: 'Type must be either income or expense' });
        }

        // Check if category already exists (case-insensitive)
        const existing = await db.prepare(
            'SELECT id FROM categories WHERE userId = 1 AND LOWER(name) = LOWER(?) AND type = ?'
        ).get(name, type);

        if (existing) {
            return res.status(400).json({ error: 'Category already exists' });
        }

        // Create as global category (userId = 1)
        const result = await db.prepare(`
            INSERT INTO categories (userId, name, type, isActive, isDefault) 
            VALUES (1, ?, ?, 1, 0)
        `).run(name, type);

        const category = await db.prepare('SELECT * FROM categories WHERE id = ?').get(result.lastInsertRowid);
        res.json(category);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update category (name or active status) - global
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, isActive } = req.body;

        // Check if category exists in global categories
        const category = await db.prepare('SELECT * FROM categories WHERE id = ? AND userId = 1').get(id);

        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }

        // Build update query dynamically
        const updates = [];
        const params = [];

        if (name !== undefined) {
            updates.push('name = ?');
            params.push(name);
        }

        if (isActive !== undefined) {
            updates.push('isActive = ?');
            params.push(isActive ? 1 : 0);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        params.push(id);
        await db.prepare(`UPDATE categories SET ${updates.join(', ')} WHERE id = ?`).run(...params);

        const updated = await db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete category (global - admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        // Check if category exists in global categories
        const category = await db.prepare('SELECT * FROM categories WHERE id = ? AND userId = 1').get(id);

        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }

        // Check if category has transactions from ANY user
        const transactionCount = await db.prepare(
            'SELECT COUNT(*) as count FROM transactions WHERE category = ?'
        ).get(category.name);

        if (transactionCount.count > 0) {
            return res.status(400).json({
                error: `Cannot delete category "${category.name}" because it has ${transactionCount.count} transaction(s). Please delete or reassign those transactions first.`,
                transactionCount: transactionCount.count
            });
        }

        await db.prepare('DELETE FROM categories WHERE id = ?').run(id);
        res.json({ message: 'Category deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
