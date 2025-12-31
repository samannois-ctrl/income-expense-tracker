import { useState, useEffect } from 'react';
import { getSummary, getTransactions } from '../services/api';
import { useSettings } from '../context/SettingsContext';
import ThaiDatePicker from '../components/ThaiDatePicker';

const categoryIcons = {
    salary: '💰',
    freelance: '💼',
    investment: '📈',
    gift: '🎁',
    other_income: '💵',
    food: '🍔',
    transport: '🚗',
    shopping: '🛍️',
    entertainment: '🎮',
    bills: '📄',
    health: '🏥',
    education: '📚',
    travel: '✈️',
    other_expense: '💸',
};

const Dashboard = () => {
    const [summary, setSummary] = useState({ income: 0, expense: 0, balance: 0 });
    const [transactions, setTransactions] = useState([]);

    // Helper function to format date as YYYY-MM-DD in local timezone
    const formatDateLocal = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const [dateFilter, setDateFilter] = useState(() => {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        return {
            startDate: formatDateLocal(startOfMonth),
            endDate: formatDateLocal(now),
        };
    });
    const [loading, setLoading] = useState(true);
    const [typeFilter, setTypeFilter] = useState('all');

    useEffect(() => {
        fetchData();
    }, [dateFilter]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [summaryRes, transactionsRes] = await Promise.all([
                getSummary(dateFilter),
                getTransactions({ ...dateFilter }),
            ]);
            setSummary(summaryRes.data);
            setTransactions(transactionsRes.data.slice(0, 5)); // Latest 5
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('th-TH', {
            style: 'currency',
            currency: 'THB',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const { formatDisplayDate, t } = useSettings();

    const formatDate = (date) => {
        return formatDisplayDate(date, { short: true });
    };

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">{t('dashboard.title')}</h1>
                <p className="page-subtitle">{t('dashboard.subtitle')}</p>
            </div>

            <div className="date-filter">
                <ThaiDatePicker
                    selected={dateFilter.startDate}
                    onChange={(date) => setDateFilter({ ...dateFilter, startDate: date })}
                    placeholder="Start date"
                />
                <span className="text-muted">{t('common.to')}</span>
                <ThaiDatePicker
                    selected={dateFilter.endDate}
                    onChange={(date) => setDateFilter({ ...dateFilter, endDate: date })}
                    placeholder="End date"
                />
            </div>

            <div className="stats-grid">
                <div className="card">
                    <div className="card-header">
                        <span className="card-title">{t('dashboard.balance')}</span>
                        <div className="card-icon balance">💎</div>
                    </div>
                    <div className="card-value balance">{formatCurrency(summary.balance)}</div>
                </div>

                <div className="card">
                    <div className="card-header">
                        <span className="card-title">{t('dashboard.income')}</span>
                        <div className="card-icon income">📈</div>
                    </div>
                    <div className="card-value income">{formatCurrency(summary.income)}</div>
                </div>

                <div className="card">
                    <div className="card-header">
                        <span className="card-title">{t('dashboard.expense')}</span>
                        <div className="card-icon expense">📉</div>
                    </div>
                    <div className="card-value expense">{formatCurrency(summary.expense)}</div>
                </div>
            </div>

            <div className="card">
                <div className="card-header" style={{ marginBottom: 'var(--spacing-md)' }}>
                    <span className="card-title" style={{ fontSize: '1.1rem', color: 'var(--color-text-primary)' }}>
                        {t('dashboard.recentTransactions')}
                    </span>
                </div>

                {/* Type Filter */}
                <div className="history-type-filter" style={{ marginBottom: 'var(--spacing-md)' }}>
                    <label className={`type-filter-option ${typeFilter === 'all' ? 'active' : ''}`}>
                        <input
                            type="radio"
                            name="dashboardTypeFilter"
                            value="all"
                            checked={typeFilter === 'all'}
                            onChange={(e) => setTypeFilter(e.target.value)}
                        />
                        <span>{t('common.all')}</span>
                    </label>
                    <label className={`type-filter-option income ${typeFilter === 'income' ? 'active' : ''}`}>
                        <input
                            type="radio"
                            name="dashboardTypeFilter"
                            value="income"
                            checked={typeFilter === 'income'}
                            onChange={(e) => setTypeFilter(e.target.value)}
                        />
                        <span>📈 {t('dashboard.income')}</span>
                    </label>
                    <label className={`type-filter-option expense ${typeFilter === 'expense' ? 'active' : ''}`}>
                        <input
                            type="radio"
                            name="dashboardTypeFilter"
                            value="expense"
                            checked={typeFilter === 'expense'}
                            onChange={(e) => setTypeFilter(e.target.value)}
                        />
                        <span>📉 {t('dashboard.expense')}</span>
                    </label>
                </div>

                {loading ? (
                    <div className="empty-state">
                        <p>{t('common.loading')}</p>
                    </div>
                ) : transactions.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">📝</div>
                        <p>{t('dashboard.noTransactions')}</p>
                    </div>
                ) : (
                    <div>
                        {transactions
                            .filter(tx => typeFilter === 'all' || tx.type === typeFilter)
                            .map((tx) => (
                                <div key={tx.id} className="transaction-item">
                                    <div className={`transaction-icon ${tx.type}`}>
                                        {categoryIcons[tx.category] || '💵'}
                                    </div>
                                    <div className="transaction-details">
                                        <div className="transaction-category">{tx.category.replace('_', ' ')}</div>
                                        <div className="transaction-date">{formatDate(tx.date)}</div>
                                    </div>
                                    <div className={`transaction-amount ${tx.type === 'income' ? 'text-success' : 'text-danger'}`}>
                                        {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                                    </div>
                                </div>
                            ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
