import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTransactions, deleteTransaction } from '../services/api';
import { useSettings } from '../context/SettingsContext';

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

const History = () => {
    const { t, formatDisplayDate } = useSettings();
    const navigate = useNavigate();
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState({
        startDate: '',
        endDate: '',
        type: 'all',
    });

    useEffect(() => {
        fetchTransactions();
    }, [filter]);

    const fetchTransactions = async () => {
        try {
            setLoading(true);
            const params = {};
            if (filter.startDate) params.startDate = filter.startDate;
            if (filter.endDate) params.endDate = filter.endDate;
            if (filter.type !== 'all') params.type = filter.type;

            const res = await getTransactions(params);
            setTransactions(res.data);
        } catch (error) {
            console.error('Error fetching transactions:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm(t('history.deleteConfirm'))) return;

        try {
            await deleteTransaction(id);
            setTransactions(transactions.filter(t => t.id !== id));
        } catch (error) {
            console.error('Error deleting transaction:', error);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('th-TH', {
            style: 'currency',
            currency: 'THB',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">{t('history.title')}</h1>
                <p className="page-subtitle">{t('history.subtitle')}</p>
            </div>

            <div className="date-filter">
                <input
                    type="date"
                    className="form-input"
                    value={filter.startDate}
                    onChange={(e) => setFilter({ ...filter, startDate: e.target.value })}
                    placeholder={t('history.startDate')}
                />
                <span className="text-muted">{t('history.to')}</span>
                <input
                    type="date"
                    className="form-input"
                    value={filter.endDate}
                    onChange={(e) => setFilter({ ...filter, endDate: e.target.value })}
                    placeholder={t('history.endDate')}
                />
                <select
                    className="form-select"
                    value={filter.type}
                    onChange={(e) => setFilter({ ...filter, type: e.target.value })}
                    style={{ width: 'auto' }}
                >
                    <option value="all">{t('history.allTypes')}</option>
                    <option value="income">{t('entry.income')}</option>
                    <option value="expense">{t('entry.expense')}</option>
                </select>
            </div>

            <div className="card">
                {loading ? (
                    <div className="empty-state">
                        <p>{t('common.loading')}</p>
                    </div>
                ) : transactions.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">📝</div>
                        <p>{t('history.noTransactions')}</p>
                    </div>
                ) : (
                    <div>
                        {transactions.map((tx) => (
                            <div key={tx.id} className="transaction-item">
                                <div className={`transaction-icon ${tx.type}`}>
                                    {categoryIcons[tx.category] || '💵'}
                                </div>
                                <div className="transaction-details">
                                    <div className="transaction-category">
                                        {tx.category.replace('_', ' ')}
                                        {tx.description && <span className="text-muted"> - {tx.description}</span>}
                                    </div>
                                    <div className="transaction-date">{formatDisplayDate(tx.date)}</div>
                                </div>
                                <div className={`transaction-amount ${tx.type === 'income' ? 'text-success' : 'text-danger'}`}>
                                    {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                                </div>
                                <div className="transaction-actions">
                                    <button
                                        className="btn btn-secondary btn-sm"
                                        onClick={() => navigate(`/entry?edit=${tx.id}`)}
                                    >
                                        ✏️
                                    </button>
                                    <button
                                        className="btn btn-danger btn-sm"
                                        onClick={() => handleDelete(tx.id)}
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default History;
