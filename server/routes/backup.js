import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import db from '../database.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import dotenv from 'dotenv';

const execPromise = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const router = express.Router();

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Backup directory
const backupDir = path.join(__dirname, '..', 'backups');
if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
}

// Create backup using mysqldump
router.post('/create', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `backup-${timestamp}.sql`;
        const filePath = path.join(backupDir, filename);

        // Build mysqldump command
        const dbHost = process.env.DB_HOST || 'localhost';
        const dbPort = process.env.DB_PORT || 3306;
        const dbUser = process.env.DB_ROOT_USER || 'root';
        const dbPassword = process.env.DB_ROOT_PASSWORD || '';
        const dbName = process.env.DB_NAME || 'income_expense_tracker';

        const command = `mysqldump -h ${dbHost} -P ${dbPort} -u ${dbUser} ${dbPassword ? `-p${dbPassword}` : ''} ${dbName} > "${filePath}"`;

        // Execute mysqldump
        await execPromise(command);

        const stats = fs.statSync(filePath);

        res.json({
            success: true,
            message: 'Backup created successfully',
            backup: {
                filename,
                size: stats.size,
                created: stats.mtime
            }
        });
    } catch (error) {
        console.error('Backup error:', error);
        res.status(500).json({ error: error.message });
    }
});

// List all backups
router.get('/list', authenticateToken, requireAdmin, (req, res) => {
    try {
        const files = fs.readdirSync(backupDir)
            .filter(file => file.endsWith('.sql'))
            .map(file => {
                const filePath = path.join(backupDir, file);
                const stats = fs.statSync(filePath);
                return {
                    filename: file,
                    size: stats.size,
                    created: stats.mtime,
                    type: file.startsWith('auto-') ? 'auto' : 'manual'
                };
            })
            .sort((a, b) => b.created - a.created);

        res.json(files);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Download specific backup
router.get('/download/:filename', authenticateToken, requireAdmin, (req, res) => {
    try {
        const { filename } = req.params;
        const filePath = path.join(backupDir, filename);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'Backup file not found' });
        }

        res.download(filePath, filename, (err) => {
            if (err) {
                console.error('Download error:', err);
                res.status(500).json({ error: 'Failed to download backup' });
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete specific backup
router.delete('/:filename', authenticateToken, requireAdmin, (req, res) => {
    try {
        const { filename } = req.params;
        const filePath = path.join(backupDir, filename);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'Backup file not found' });
        }

        fs.unlinkSync(filePath);
        res.json({ message: 'Backup deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get backup schedule settings
router.get('/schedule', authenticateToken, requireAdmin, async (req, res) => {
    try {
        let settings = await db.prepare('SELECT * FROM backup_settings WHERE id = 1').get();

        if (!settings) {
            // Create default settings
            await db.prepare('INSERT INTO backup_settings (id, enabled, schedule_time, retention_days) VALUES (1, 0, ?, 30)')
                .run('00:00');
            settings = { id: 1, enabled: 0, schedule_time: '00:00', retention_days: 30 };
        }

        res.json(settings);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update backup schedule settings
router.post('/schedule', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { enabled, schedule_time, retention_days } = req.body;

        // Check if settings exist
        const existing = await db.prepare('SELECT id FROM backup_settings WHERE id = 1').get();

        if (existing) {
            await db.prepare('UPDATE backup_settings SET enabled = ?, schedule_time = ?, retention_days = ? WHERE id = 1')
                .run(enabled ? 1 : 0, schedule_time, retention_days);
        } else {
            await db.prepare('INSERT INTO backup_settings (id, enabled, schedule_time, retention_days) VALUES (1, ?, ?, ?)')
                .run(enabled ? 1 : 0, schedule_time, retention_days);
        }

        res.json({ message: 'Backup schedule updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
