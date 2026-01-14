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
import multer from 'multer'; const upload = multer({ dest: 'uploads/' });

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

// Helper to escape values for SQL
function escapeSqlValue(val) {
    if (val === null) return 'NULL';
    if (typeof val === 'number') return val;
    if (typeof val === 'boolean') return val ? 1 : 0;
    if (val instanceof Date) return "'" + val.toISOString().slice(0, 19).replace('T', ' ') + "'";
    // Basic escaping
    return "'" + String(val).replace(/\\/g, '\\\\').replace(/'/g, "''").replace(/\n/g, '\\n').replace(/\r/g, '\\r') + "'";
}

// Create backup using native Node.js implementation
router.post('/create', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `backup-${timestamp}.sql`;
        const filePath = path.join(backupDir, filename);

        const writeStream = fs.createWriteStream(filePath);

        // Write Header
        writeStream.write(`-- Backup generated at ${new Date().toISOString()}\n`);
        writeStream.write(`-- Server: MySQL/MariaDB\n\n`);
        writeStream.write(`SET FOREIGN_KEY_CHECKS=0;\n`);
        writeStream.write(`SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";\n`);
        writeStream.write(`START TRANSACTION;\n\n`);

        // Get all tables
        const tables = await db.prepare('SHOW TABLES').all();

        for (const row of tables) {
            const tableName = Object.values(row)[0];

            // Skip backup_settings table or others if needed (optional)

            // Get Table Structure
            const createTableResult = await db.prepare(`SHOW CREATE TABLE \`${tableName}\``).get();
            writeStream.write(`-- Table structure for table \`${tableName}\`\n`);
            writeStream.write(`DROP TABLE IF EXISTS \`${tableName}\`;\n`);
            writeStream.write(`${createTableResult['Create Table']};\n\n`);

            // Get Table Data
            const tableData = await db.prepare(`SELECT * FROM \`${tableName}\``).all();

            if (tableData.length > 0) {
                writeStream.write(`-- Dumping data for table \`${tableName}\`\n`);
                writeStream.write(`INSERT INTO \`${tableName}\` VALUES\n`);

                const values = tableData.map((row, index) => {
                    const rowValues = Object.values(row).map(escapeSqlValue);
                    return `(${rowValues.join(', ')})`;
                });

                writeStream.write(values.join(',\n'));
                writeStream.write(';\n\n');
            }
        }

        writeStream.write(`SET FOREIGN_KEY_CHECKS=1;\n`);
        writeStream.write(`COMMIT;\n`);
        writeStream.end();

        // Wait for stream to finish
        await new Promise((resolve, reject) => {
            writeStream.on('finish', resolve);
            writeStream.on('error', reject);
        });

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
                if (!res.headersSent) {
                    res.status(500).json({ error: `Failed to download backup: ${err.message}` });
                }
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

// Download current database directly (Live Backup)
router.get('/download', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `backup-${timestamp}.sql`;

        // Set headers for download
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Type', 'application/sql');

        // Write Header
        res.write(`-- Backup generated at ${new Date().toISOString()}\n`);
        res.write(`-- Server: MySQL/MariaDB\n\n`);
        res.write(`SET FOREIGN_KEY_CHECKS=0;\n`);
        res.write(`SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";\n`);
        res.write(`START TRANSACTION;\n\n`);

        // Get all tables
        const tables = await db.prepare('SHOW TABLES').all();

        for (const row of tables) {
            const tableName = Object.values(row)[0];

            // Get Table Structure
            const createTableResult = await db.prepare(`SHOW CREATE TABLE \`${tableName}\``).get();
            res.write(`-- Table structure for table \`${tableName}\`\n`);
            res.write(`DROP TABLE IF EXISTS \`${tableName}\`;\n`);
            res.write(`${createTableResult['Create Table']};\n\n`);

            // Get Table Data
            const tableData = await db.prepare(`SELECT * FROM \`${tableName}\``).all();

            if (tableData.length > 0) {
                res.write(`-- Dumping data for table \`${tableName}\`\n`);
                res.write(`INSERT INTO \`${tableName}\` VALUES\n`);

                const values = tableData.map((row) => {
                    const rowValues = Object.values(row).map(escapeSqlValue);
                    return `(${rowValues.join(', ')})`;
                });

                res.write(values.join(',\n'));
                res.write(';\n\n');
            }
        }

        res.write(`SET FOREIGN_KEY_CHECKS=1;\n`);
        res.write(`COMMIT;\n`);
        res.end();
    } catch (error) {
        console.error('Backup download error:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: error.message });
        } else {
            res.end();
        }
    }
});

// Restore database from backup
router.post('/restore', authenticateToken, requireAdmin, upload.single('backup'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No backup file provided' });
        }

        const filePath = req.file.path;
        console.log(`Starting database restore from ${req.file.originalname}...`);

        // Read SQL file
        const sqlContent = fs.readFileSync(filePath, 'utf8');

        // Execute SQL content
        // Note: multipleStatements must be enabled in DB config
        await db.exec(sqlContent);

        // Clean up uploaded file
        fs.unlinkSync(filePath);

        console.log('Database restored successfully');
        res.json({ message: 'Database restored successfully' });

    } catch (error) {
        console.error('Restore error:', error);

        // Cleanup temp file if error
        if (req.file && fs.existsSync(req.file.path)) {
            try { fs.unlinkSync(req.file.path); } catch (e) {
                console.error('Error cleaning up temp file:', e);
            }
        }

        res.status(500).json({ error: `Restore failed: ${error.message}` });
    }
});

export default router;
