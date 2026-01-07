import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import transactionRoutes from './routes/transactions.js';
import backupRoutes from './routes/backup.js';
import categoryRoutes from './routes/categories.js';
import menuRoutes from './routes/menu.js';
import posRoutes from './routes/pos.js';
import reportRoutes from './routes/reports.js';
import { startScheduler } from './backupScheduler.js';

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/backup', backupRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/pos', posRoutes);
app.use('/api/reports', reportRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);

    // Start backup scheduler
    startScheduler();
});
