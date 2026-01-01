import express from 'express';
import db from '../database.js';
import { authenticateToken as auth } from '../middleware/auth.js';

const router = express.Router();

// Helper for transaction
const withTransaction = async (callback, res) => {
    const connection = await db.getConnection();
    await connection.beginTransaction();
    try {
        await callback(connection);
        await connection.commit();
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

// ============================================
// 1. Menu Categories (Group of Menus)
// ============================================

router.get('/categories', auth, async (req, res) => {
    try {
        const data = await db.prepare('SELECT * FROM menu_categories ORDER BY display_order ASC').all();
        res.json({ data });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/categories', auth, async (req, res) => {
    try {
        const { name } = req.body;
        const result = await db.prepare('INSERT INTO menu_categories (name) VALUES (?)').run(name);
        res.json({ success: true, id: result.lastInsertRowid });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/categories/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, is_active } = req.body;
        await db.prepare('UPDATE menu_categories SET name = ?, is_active = IFNULL(?, is_active) WHERE id = ?').run(name, is_active, id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/categories/:id', auth, async (req, res) => {
    try {
        await db.prepare('DELETE FROM menu_categories WHERE id = ?').run(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/categories/reorder', auth, async (req, res) => {
    try {
        const { orderedIds } = req.body;
        await withTransaction(async (conn) => {
            for (let i = 0; i < orderedIds.length; i++) {
                await conn.query('UPDATE menu_categories SET display_order = ? WHERE id = ?', [i, orderedIds[i]]);
            }
        });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// ============================================
// 2. Menus
// ============================================

router.get('/menus', auth, async (req, res) => {
    try {
        const data = await db.prepare('SELECT * FROM menus ORDER BY display_order ASC').all();
        res.json({ data });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/menus', auth, async (req, res) => {
    try {
        const { category_id, name, base_price } = req.body;
        const result = await db.prepare('INSERT INTO menus (category_id, name, base_price) VALUES (?, ?, ?)').run(category_id, name, base_price || 0);
        res.json({ success: true, id: result.lastInsertRowid });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/menus/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, base_price, is_active } = req.body;
        await db.prepare('UPDATE menus SET name = ?, base_price = ?, is_active = IFNULL(?, is_active) WHERE id = ?').run(name, base_price, is_active, id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/menus/:id', auth, async (req, res) => {
    try {
        await db.prepare('DELETE FROM menus WHERE id = ?').run(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/menus/reorder', auth, async (req, res) => {
    try {
        const { orderedIds } = req.body;
        await withTransaction(async (conn) => {
            for (let i = 0; i < orderedIds.length; i++) {
                await conn.query('UPDATE menus SET display_order = ? WHERE id = ?', [i, orderedIds[i]]);
            }
        });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// 3. Option Groups (e.g. Noodle Type)
// ============================================

router.get('/option-groups', auth, async (req, res) => {
    try {
        const data = await db.prepare('SELECT * FROM option_groups ORDER BY display_order ASC').all();
        res.json({ data });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/option-groups', auth, async (req, res) => {
    try {
        const { name, selection_type, is_optional } = req.body;
        const result = await db.prepare('INSERT INTO option_groups (name, selection_type, is_optional) VALUES (?, ?, ?)').run(name, selection_type || 'single', is_optional ? 1 : 0);
        res.json({ success: true, id: result.lastInsertRowid });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/option-groups/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, selection_type, is_optional, is_active } = req.body;
        await db.prepare('UPDATE option_groups SET name = ?, selection_type = ?, is_optional = ? WHERE id = ?').run(name, selection_type, is_optional ? 1 : 0, id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/option-groups/:id', auth, async (req, res) => {
    try {
        await db.prepare('DELETE FROM option_groups WHERE id = ?').run(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// 4. Options (e.g. Thin Noodle)
// ============================================

router.get('/options', auth, async (req, res) => {
    try {
        const data = await db.prepare('SELECT * FROM options ORDER BY display_order ASC').all();
        res.json({ data });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/options', auth, async (req, res) => {
    try {
        const { group_id, name, price_adjustment } = req.body;
        const result = await db.prepare('INSERT INTO options (group_id, name, price_adjustment) VALUES (?, ?, ?)').run(group_id, name, price_adjustment || 0);
        res.json({ success: true, id: result.lastInsertRowid });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/options/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, price_adjustment, is_available } = req.body;
        await db.prepare('UPDATE options SET name = ?, price_adjustment = ?, is_available = IFNULL(?, is_available) WHERE id = ?').run(name, price_adjustment, is_available, id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/options/:id', auth, async (req, res) => {
    try {
        await db.prepare('DELETE FROM options WHERE id = ?').run(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// 5. Configuration (Mapping)
// ============================================

// Get config for a menu
router.get('/config/:menuId', auth, async (req, res) => {
    try {
        const { menuId } = req.params;
        const data = await db.prepare(`
            SELECT moc.*, og.name as group_name, og.selection_type 
            FROM menu_option_config moc
            JOIN option_groups og ON moc.option_group_id = og.id
            WHERE moc.menu_id = ?
            ORDER BY moc.display_order ASC
        `).all(menuId);
        res.json({ data });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update config (Toggle a group for a menu)
router.post('/config/toggle', auth, async (req, res) => {
    try {
        const { menu_id, option_group_id, enabled, is_required } = req.body;

        if (enabled) {
            // Get max order
            const last = await db.prepare('SELECT MAX(display_order) as maxOrder FROM menu_option_config WHERE menu_id = ?').get(menu_id);
            const newOrder = (last.maxOrder || 0) + 1;

            await db.prepare('INSERT INTO menu_option_config (menu_id, option_group_id, display_order, is_required) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE is_required = VALUES(is_required)').run(menu_id, option_group_id, newOrder, is_required ? 1 : 0);
        } else {
            await db.prepare('DELETE FROM menu_option_config WHERE menu_id = ? AND option_group_id = ?').run(menu_id, option_group_id);
        }
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Reorder groups within a menu
router.post('/config/reorder', auth, async (req, res) => {
    try {
        const { menu_id, orderedGroupIds } = req.body;
        await withTransaction(async (conn) => {
            for (let i = 0; i < orderedGroupIds.length; i++) {
                await conn.query('UPDATE menu_option_config SET display_order = ? WHERE menu_id = ? AND option_group_id = ?',
                    [i, menu_id, orderedGroupIds[i]]
                );
            }
        });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// POS Data Fetcher
// ============================================
router.get('/pos-data', auth, async (req, res) => {
    try {
        // Fetch all data for offline-capable POS
        const categories = await db.prepare('SELECT * FROM menu_categories WHERE is_active=1 ORDER BY display_order ASC').all();
        const menus = await db.prepare('SELECT * FROM menus WHERE is_active=1 ORDER BY display_order ASC').all();
        const optionGroups = await db.prepare('SELECT * FROM option_groups ORDER BY display_order ASC').all();
        const options = await db.prepare('SELECT * FROM options WHERE is_available=1 ORDER BY display_order ASC').all();
        const configs = await db.prepare('SELECT * FROM menu_option_config ORDER BY display_order ASC').all();

        res.json({
            categories,
            menus,
            optionGroups,
            options,
            configs
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
