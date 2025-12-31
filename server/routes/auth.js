import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../database.js';
import { authenticateToken, JWT_SECRET } from '../middleware/auth.js';

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
    try {
        const { username, email, password, fullName, phone } = req.body;

        if (!username || !email || !password || !fullName) {
            return res.status(400).json({ error: 'Username, email, password, and full name are required' });
        }

        const existingUser = await db.prepare('SELECT id FROM users WHERE email = ? OR username = ?').get(email, username);
        if (existingUser) {
            return res.status(400).json({ error: 'Email or Username already registered' });
        }

        const hashedPassword = bcrypt.hashSync(password, 10);
        const result = await db.prepare(`
      INSERT INTO users (username, email, password, fullName, phone, role, status) 
      VALUES (?, ?, ?, ?, ?, 'user', 'active')
    `).run(username, email, hashedPassword, fullName, phone || null);

        const user = await db.prepare('SELECT id, email, fullName, role FROM users WHERE id = ?').get(result.lastInsertRowid);
        const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

        res.json({ user, token });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        console.log('Login attempt:', { username }); // Don't log password

        // Find user by username
        const user = await db.prepare('SELECT * FROM users WHERE username = ?').get(username);
        console.log('User found:', user ? { id: user.id, username: user.username, status: user.status } : null);

        if (!user) {
            console.log('User not found');
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        if (user.status !== 'active') {
            console.log('User inactive');
            return res.status(401).json({ error: 'Account is inactive' });
        }

        const passwordMatch = bcrypt.compareSync(password, user.password);
        console.log('Password match:', passwordMatch);

        if (!passwordMatch) {
            console.log('Password mismatch');
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
        const { password: _, ...userWithoutPassword } = user;

        console.log('Login successful');
        res.json({ user: userWithoutPassword, token });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get current user
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const user = await db.prepare('SELECT id, email, fullName, phone, role, status, avatar, createdAt FROM users WHERE id = ?').get(req.user.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
