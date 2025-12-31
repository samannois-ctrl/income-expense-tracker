import cron from 'node-cron';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import db from './database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let scheduledTask = null;

// Backup directory
const backupDir = path.join(__dirname, 'backups');
if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
}

// Create automatic backup
function createAutoBackup() {
    try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `auto-${timestamp}.sqlite`;
        const backupPath = path.join(backupDir, filename);

        const dbPath = db.getDbPath();
        fs.copyFileSync(dbPath, backupPath);

        console.log(`✅ Auto backup created: ${filename}`);

        // Cleanup old backups
        cleanupOldBackups();
    } catch (error) {
        console.error('❌ Auto backup failed:', error);
    }
}

// Cleanup backups older than retention days
function cleanupOldBackups() {
    try {
        const settings = db.prepare('SELECT retention_days FROM backup_settings WHERE id = 1').get();
        const retentionDays = settings?.retention_days || 30;
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

        const files = fs.readdirSync(backupDir);
        let deletedCount = 0;

        files.forEach(file => {
            if (file.endsWith('.sqlite')) {
                const filePath = path.join(backupDir, file);
                const stats = fs.statSync(filePath);

                if (stats.mtime < cutoffDate) {
                    fs.unlinkSync(filePath);
                    deletedCount++;
                    console.log(`🗑️  Deleted old backup: ${file}`);
                }
            }
        });

        if (deletedCount > 0) {
            console.log(`✅ Cleanup completed: ${deletedCount} old backup(s) deleted`);
        }
    } catch (error) {
        console.error('❌ Cleanup failed:', error);
    }
}

// Start scheduler
export function startScheduler() {
    try {
        const settings = db.prepare('SELECT * FROM backup_settings WHERE id = 1').get();

        if (!settings || !settings.enabled) {
            console.log('⏸️  Scheduled backup is disabled');
            return;
        }

        const [hours, minutes] = settings.schedule_time.split(':');
        const cronExpression = `${minutes} ${hours} * * *`; // Daily at specified time

        if (scheduledTask) {
            scheduledTask.stop();
        }

        scheduledTask = cron.schedule(cronExpression, () => {
            console.log('⏰ Running scheduled backup...');
            createAutoBackup();
        });

        console.log(`✅ Scheduled backup enabled: Daily at ${settings.schedule_time}`);
    } catch (error) {
        console.error('❌ Failed to start scheduler:', error);
    }
}

// Restart scheduler (called when settings change)
export function restartScheduler() {
    if (scheduledTask) {
        scheduledTask.stop();
        scheduledTask = null;
    }
    startScheduler();
}

// Stop scheduler
export function stopScheduler() {
    if (scheduledTask) {
        scheduledTask.stop();
        scheduledTask = null;
        console.log('⏹️  Scheduled backup stopped');
    }
}

export default { startScheduler, restartScheduler, stopScheduler };
