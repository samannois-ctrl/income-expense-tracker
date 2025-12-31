import express from 'express';
import db from '../database.js';
import { authenticateToken as auth } from '../middleware/auth.js';

const router = express.Router();

// ============================================
// Menu Categories Management
// ============================================

// Get all categories
router.get('/categories', auth, async (req, res) => {
    try {
        const categories = await db.prepare('SELECT * FROM menu_categories ORDER BY name').all();
        res.json({ data: categories });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create category
router.post('/categories', auth, async (req, res) => {
    try {
        const { name, price } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Category name is required' });
        }

        const result = await db.prepare(
            'INSERT INTO menu_categories (name) VALUES (?)'
        ).run(name);

        res.json({ success: true, id: result.lastInsertRowid });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update category
router.put('/categories/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;

        const result = await db.prepare(
            'UPDATE menu_categories SET name = ? WHERE id = ?'
        ).run(name, id);

        res.json({ success: true, changes: result.changes });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete category
router.delete('/categories/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await db.prepare('DELETE FROM menu_categories WHERE id = ?').run(id);

        res.json({ success: true, changes: result.changes });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// Menu Options Management
// ============================================

// Get all options
router.get('/options', auth, async (req, res) => {
    try {
        const options = await db.prepare('SELECT * FROM menu_options ORDER BY name').all();
        res.json({ data: options });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create option
router.post('/options', auth, async (req, res) => {
    try {
        const { name, price } = req.body;

        if (!name || price === undefined) {
            return res.status(400).json({ error: 'Option name and price are required' });
        }

        const result = await db.prepare(
            'INSERT INTO menu_options (name, price) VALUES (?, ?)'
        ).run(name, price);

        res.json({ success: true, id: result.lastInsertRowid });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update option
router.put('/options/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, price } = req.body;

        const result = await db.prepare(
            'UPDATE menu_options SET name = ?, price = ? WHERE id = ?'
        ).run(name, price, id);

        res.json({ success: true, changes: result.changes });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete option
router.delete('/options/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await db.prepare('DELETE FROM menu_options WHERE id = ?').run(id);

        res.json({ success: true, changes: result.changes });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// Noodle Types Management
// ============================================

// Get all noodles
router.get('/noodles', auth, async (req, res) => {
    try {
        const noodles = await db.prepare('SELECT * FROM noodles ORDER BY name').all();
        res.json({ data: noodles });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create noodle
router.post('/noodles', auth, async (req, res) => {
    try {
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Noodle name is required' });
        }

        const result = await db.prepare(
            'INSERT INTO noodles (name) VALUES (?)'
        ).run(name);

        res.json({ success: true, id: result.lastInsertRowid });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update noodle
router.put('/noodles/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;

        const result = await db.prepare(
            'UPDATE noodles SET name = ? WHERE id = ?'
        ).run(name, id);

        res.json({ success: true, changes: result.changes });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete noodle
router.delete('/noodles/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await db.prepare('DELETE FROM noodles WHERE id = ?').run(id);

        res.json({ success: true, changes: result.changes });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
