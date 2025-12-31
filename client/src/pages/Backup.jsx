import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../config/api.js';

const Backup = () => {
    const [activeTab, setActiveTab] = useState('manual');
    const [backups, setBackups] = useState([]);
    const [schedule, setSchedule] = useState({
        enabled: false,
        schedule_time: '00:00',
        retention_days: 30
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        fetchBackups();
        fetchSchedule();
    }, []);

    const fetchBackups = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/backup/list`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setBackups(res.data);
        } catch (error) {
            console.error('Error fetching backups:', error);
        }
    };

    const fetchSchedule = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/backup/schedule`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSchedule(res.data);
        } catch (error) {
            console.error('Error fetching schedule:', error);
        }
    };

    const handleDownloadCurrent = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/backup/download`, {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `backup-${new Date().toISOString().replace(/[:.]/g, '-')}.sqlite`);
            document.body.appendChild(link);
            link.click();
            link.remove();

            showMessage('Backup downloaded successfully', 'success');
        } catch (error) {
            showMessage('Failed to download backup', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleRestore = async (e) => {
        if (!confirm('Are you sure you want to restore the database? Current data will be backed up first.')) {
            return;
        }

        const file = e.target.files[0];
        if (!file) return;

        try {
            setLoading(true);
            const formData = new FormData();
            formData.append('backup', file);

            const token = localStorage.getItem('token');
            await axios.post(`${API_URL}/backup/restore`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            showMessage('Database restored successfully. Please refresh the page.', 'success');
            setTimeout(() => window.location.reload(), 2000);
        } catch (error) {
            showMessage('Failed to restore database', 'error');
        } finally {
            setLoading(false);
            e.target.value = '';
        }
    };

    const handleDownloadBackup = async (filename) => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/backup/download/${filename}`, {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            showMessage('Failed to download backup', 'error');
        }
    };

    const handleDeleteBackup = async (filename) => {
        if (!confirm(`Delete backup: ${filename}?`)) return;

        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_URL}/backup/${filename}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            showMessage('Backup deleted successfully', 'success');
            fetchBackups();
        } catch (error) {
            showMessage('Failed to delete backup', 'error');
        }
    };

    const handleSaveSchedule = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            await axios.post(`${API_URL}/backup/schedule`, schedule, {
                headers: { Authorization: `Bearer ${token}` }
            });
            showMessage('Schedule settings saved successfully', 'success');
        } catch (error) {
            showMessage('Failed to save schedule settings', 'error');
        } finally {
            setLoading(false);
        }
    };

    const showMessage = (text, type) => {
        setMessage({ text, type });
        setTimeout(() => setMessage(null), 3000);
    };

    const formatFileSize = (bytes) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleString('th-TH', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Backup & Restore</h1>
                <p className="page-subtitle">Manage database backups and scheduled backups</p>
            </div>

            {message && (
                <div className={`alert alert-${message.type}`} style={{ marginBottom: '1rem' }}>
                    {message.text}
                </div>
            )}

            <div className="tabs">
                <button
                    className={`tab ${activeTab === 'manual' ? 'active' : ''}`}
                    onClick={() => setActiveTab('manual')}
                >
                    Manual Backup
                </button>
                <button
                    className={`tab ${activeTab === 'schedule' ? 'active' : ''}`}
                    onClick={() => setActiveTab('schedule')}
                >
                    Scheduled Backups
                </button>
                <button
                    className={`tab ${activeTab === 'history' ? 'active' : ''}`}
                    onClick={() => setActiveTab('history')}
                >
                    Backup History
                </button>
            </div>

            {activeTab === 'manual' && (
                <div className="card">
                    <div className="card-header">
                        <span className="card-title">Manual Backup & Restore</span>
                    </div>

                    <div style={{ padding: '1.5rem' }}>
                        <div style={{ marginBottom: '2rem' }}>
                            <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem', color: 'var(--color-text-primary)' }}>
                                Download Current Database
                            </h3>
                            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
                                Download a backup of the current database
                            </p>
                            <button
                                className="btn btn-primary"
                                onClick={handleDownloadCurrent}
                                disabled={loading}
                            >
                                {loading ? 'Downloading...' : '📥 Download Backup'}
                            </button>
                        </div>

                        <div>
                            <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem', color: 'var(--color-text-primary)' }}>
                                Restore Database
                            </h3>
                            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
                                Upload a backup file to restore the database
                            </p>
                            <input
                                type="file"
                                accept=".sqlite"
                                onChange={handleRestore}
                                style={{ display: 'none' }}
                                id="restore-input"
                            />
                            <label htmlFor="restore-input" className="btn btn-secondary">
                                📤 Upload & Restore
                            </label>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'schedule' && (
                <div className="card">
                    <div className="card-header">
                        <span className="card-title">Scheduled Backup Settings</span>
                    </div>

                    <div style={{ padding: '1.5rem' }}>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label className="form-label">
                                <input
                                    type="checkbox"
                                    checked={schedule.enabled}
                                    onChange={(e) => setSchedule({ ...schedule, enabled: e.target.checked })}
                                    style={{ marginRight: '0.5rem' }}
                                />
                                Enable automatic daily backups
                            </label>
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label className="form-label">Backup Time</label>
                            <input
                                type="time"
                                className="form-input"
                                value={schedule.schedule_time}
                                onChange={(e) => setSchedule({ ...schedule, schedule_time: e.target.value })}
                                disabled={!schedule.enabled}
                            />
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label className="form-label">Retention Days</label>
                            <input
                                type="number"
                                className="form-input"
                                value={schedule.retention_days}
                                onChange={(e) => setSchedule({ ...schedule, retention_days: parseInt(e.target.value) })}
                                min="1"
                                max="365"
                                disabled={!schedule.enabled}
                            />
                            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginTop: '0.5rem' }}>
                                Backups older than this will be automatically deleted
                            </p>
                        </div>

                        <button
                            className="btn btn-primary"
                            onClick={handleSaveSchedule}
                            disabled={loading}
                        >
                            {loading ? 'Saving...' : '💾 Save Settings'}
                        </button>
                    </div>
                </div>
            )}

            {activeTab === 'history' && (
                <div className="card">
                    <div className="card-header">
                        <span className="card-title">Backup History</span>
                        <button className="btn btn-secondary btn-sm" onClick={fetchBackups}>
                            🔄 Refresh
                        </button>
                    </div>

                    {backups.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state-icon">💾</div>
                            <p>No backups found</p>
                        </div>
                    ) : (
                        <div>
                            {backups.map((backup) => (
                                <div key={backup.filename} className="transaction-item">
                                    <div className="transaction-icon">
                                        {backup.type === 'auto' ? '🤖' : '👤'}
                                    </div>
                                    <div className="transaction-details">
                                        <div className="transaction-category">{backup.filename}</div>
                                        <div className="transaction-date">
                                            {formatDate(backup.created)} • {formatFileSize(backup.size)}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button
                                            className="btn btn-secondary btn-sm"
                                            onClick={() => handleDownloadBackup(backup.filename)}
                                        >
                                            📥
                                        </button>
                                        <button
                                            className="btn btn-danger btn-sm"
                                            onClick={() => handleDeleteBackup(backup.filename)}
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Backup;
