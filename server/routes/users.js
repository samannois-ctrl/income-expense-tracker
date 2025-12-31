import express from 'express';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import path from 'path';
import db from '../database.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Configure multer for avatar uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, `avatar-${Date.now()}${path.extname(file.originalname)}`)
});
const upload = multer({ storage });

// Create uploads directory if not exists
import fs from 'fs';
if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');

// Get all users (Admin only)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const users = await db.prepare('SELECT id, username, email, fullName, phone, role, status, avatar, createdAt FROM users').all();
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create user (Admin only)
router.post('/', authenticateToken, requireAdmin, upload.single('avatar'), async (req, res) => {
    try {
        const { username, email, password, fullName, phone, role, status } = req.body;
        const avatar = req.file ? `/uploads/${req.file.filename}` : null;

        if (!username || !email || !password || !fullName) {
            return res.status(400).json({ error: 'Username, email, password, and full name are required' });
        }

        const existingUser = await db.prepare('SELECT id FROM users WHERE email = ? OR username = ?').get(email, username);
        if (existingUser) {
            return res.status(400).json({ error: 'Email or Username already registered' });
        }

        const hashedPassword = bcrypt.hashSync(password, 10);
        const result = await db.prepare(`
      INSERT INTO users (username, email, password, fullName, phone, role, status, avatar) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(username, email, hashedPassword, fullName, phone || null, role || 'user', status || 'active', avatar);

        const user = await db.prepare('SELECT id, username, email, fullName, phone, role, status, avatar, createdAt FROM users WHERE id = ?').get(result.lastInsertRowid);
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update user
router.put('/:id', authenticateToken, upload.single('avatar'), async (req, res) => {
    try {
        const { id } = req.params;
        const { username, fullName, phone, role, status, password } = req.body;

        // Check permissions: admin can update anyone, user can only update themselves
        if (req.user.role !== 'admin' && req.user.id !== parseInt(id)) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const existingUser = await db.prepare('SELECT * FROM users WHERE id = ?').get(id);
        if (!existingUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Check unique username if changing
        if (username && username !== existingUser.username) {
            const duplicate = await db.prepare('SELECT id FROM users WHERE username = ? AND id != ?').get(username, id);
            if (duplicate) {
                return res.status(400).json({ error: 'Username already taken' });
            }
        }

        let updateFields = [];
        let values = [];

        if (username) { updateFields.push('username = ?'); values.push(username); }
        if (fullName) { updateFields.push('fullName = ?'); values.push(fullName); }
        if (phone !== undefined) { updateFields.push('phone = ?'); values.push(phone); }
        if (req.user.role === 'admin' && role) { updateFields.push('role = ?'); values.push(role); }
        if (req.user.role === 'admin' && status) { updateFields.push('status = ?'); values.push(status); }
        if (password) { updateFields.push('password = ?'); values.push(bcrypt.hashSync(password, 10)); }
        if (req.file) { updateFields.push('avatar = ?'); values.push(`/uploads/${req.file.filename}`); }

        if (updateFields.length > 0) {
            values.push(id);
            await db.prepare(`UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`).run(...values);
        }

        const user = await db.prepare('SELECT id, username, email, fullName, phone, role, status, avatar, createdAt FROM users WHERE id = ?').get(id);
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete user (Admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        if (req.user.id === parseInt(id)) {
            return res.status(400).json({ error: 'Cannot delete your own account' });
        }

        // MySQL will cascade delete transactions automatically due to FK constraint
        await db.prepare('DELETE FROM users WHERE id = ?').run(id);

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
