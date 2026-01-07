import { useState, useEffect } from 'react';
import { createTransaction, updateTransaction, getTransactions, deleteTransaction } from '../services/api';
import CategorySelect from '../components/CategorySelect';
import ThaiDatePicker from '../components/ThaiDatePicker';
import Modal from '../components/Modal';
import { useSettings } from '../context/SettingsContext';

const API_URL = 'http://localhost:3001/api';

const Entry = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState(null);
    const [editData, setEditData] = useState({});

    // Shared selected date for all forms and history filter
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    // Type filter for history (all, income, expense)
    const [typeFilter, setTypeFilter] = useState('all');

    // Dynamic category lists from API
    const [incomeCategories, setIncomeCategories] = useState([]);
    const [expenseCategories, setExpenseCategories] = useState([]);

    // Income Form
    const [incomeData, setIncomeData] = useState({
        amount: '', quantity: 1, category: '', description: '',
    });
    const [incomeLoading, setIncomeLoading] = useState(false);
    const [incomeSuccess, setIncomeSuccess] = useState('');

    // Expense Form
    const [expenseData, setExpenseData] = useState({
        amount: '', quantity: 1, category: '', description: '',
    });
    const [expenseLoading, setExpenseLoading] = useState(false);
    const [expenseSuccess, setExpenseSuccess] = useState('');

    const { formatDisplayDate, t } = useSettings();

    // Fetch categories from API
    const fetchCategories = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/categories`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();

                // Filter only active categories and convert to dropdown format
                const activeIncome = data
                    .filter(cat => cat.type === 'income' && cat.isActive === 1)
                    .map(cat => ({ value: cat.name.toLowerCase().replace(/\s+/g, '_'), label: cat.name }));

                const activeExpense = data
                    .filter(cat => cat.type === 'expense' && cat.isActive === 1)
                    .map(cat => ({ value: cat.name.toLowerCase().replace(/\s+/g, '_'), label: cat.name }));

                setIncomeCategories(activeIncome);
                setExpenseCategories(activeExpense);
            }
        } catch (error) {
            console.error('Failed to fetch categories:', error);
        }
    };

    useEffect(() => {
        fetchCategories();
        fetchTransactions();
    }, []);

    const fetchTransactions = async () => {
        try {
            setLoading(true);
            const res = await getTransactions({});
            setTransactions(res.data);
        } catch (error) {
            console.error('Error fetching transactions:', error);
        } finally {
            setLoading(false);
        }
    };

    // Handle shared date change - updates all date fields
    const handleDateChange = (newDate) => {
        setSelectedDate(newDate);
    };

    const handleIncomeSubmit = async (e) => {
        e.preventDefault();
        setIncomeLoading(true);
        try {
            console.log('📤 INCOME Submit - incomeData:', incomeData);
            const transactionData = {
                type: 'income',
                amount: parseFloat(incomeData.amount),
                quantity: parseInt(incomeData.quantity) || 1,
                category: incomeData.category,
                description: incomeData.description,
                date: selectedDate,
            };
            console.log('📤 INCOME Submit - sending data:', transactionData);
            await createTransaction(transactionData);
            setIncomeData({ amount: '', quantity: 1, category: '', description: '' });
            setIncomeSuccess('Income added!');
            setTimeout(() => setIncomeSuccess(''), 2000);
            fetchTransactions();
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setIncomeLoading(false);
        }
    };

    const handleExpenseSubmit = async (e) => {
        e.preventDefault();
        setExpenseLoading(true);
        try {
            console.log('📤 EXPENSE Submit - expenseData:', expenseData);
            const transactionData = {
                type: 'expense',
                amount: parseFloat(expenseData.amount),
                quantity: parseInt(expenseData.quantity) || 1,
                category: expenseData.category,
                description: expenseData.description,
                date: selectedDate,
            };
            console.log('📤 EXPENSE Submit - sending data:', transactionData);
            await createTransaction(transactionData);
            setExpenseData({ amount: '', quantity: 1, category: '', description: '' });
            setExpenseSuccess('Expense added!');
            setTimeout(() => setExpenseSuccess(''), 2000);
            fetchTransactions();
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setExpenseLoading(false);
        }
    };

    const handleEdit = (tx) => {
        setEditingTransaction(tx);
        setEditData({
            amount: tx.amount,
            quantity: tx.quantity || 1,
            category: tx.category,
            description: tx.description || '',
            date: tx.date
        });
        setIsEditModalOpen(true);
    };

    const handleCancelEdit = () => {
        setIsEditModalOpen(false);
        setEditingTransaction(null);
        setEditData({});
    };

    const handleSaveEdit = async () => {
        if (!editingTransaction) return;

        try {
            await updateTransaction(editingTransaction.id, {
                amount: parseFloat(editData.amount),
                quantity: parseInt(editData.quantity) || 1,
                category: editData.category,
                description: editData.description,
                date: editData.date
            });
            setIsEditModalOpen(false);
            setEditingTransaction(null);
            setEditData({});
            fetchTransactions();
        } catch (error) {
            console.error('Error:', error);
            alert('Error updating: ' + error.message);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this transaction?')) return;
        try {
            await deleteTransaction(id);
            setTransactions(transactions.filter(t => t.id !== id));
        } catch (error) {
            console.error('Error:', error);
        }
    };

    // Format number with comma separators
    const formatNumber = (amount) => {
        return new Intl.NumberFormat('th-TH').format(amount);
    };

    // Format input number with commas (for display while typing)
    const formatInputNumber = (value) => {
        if (!value) return '';
        // Remove non-numeric characters except decimal point
        const numericValue = value.toString().replace(/[^0-9.]/g, '');
        // Split by decimal point
        const parts = numericValue.split('.');
        // Format the integer part with commas
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        // Limit decimal to 2 digits
        if (parts[1]) {
            parts[1] = parts[1].substring(0, 2);
        }
        return parts.join('.');
    };

    // Parse formatted input back to number
    const parseInputNumber = (value) => {
        if (!value) return '';
        return value.replace(/,/g, '');
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('th-TH', {
            style: 'currency', currency: 'THB', minimumFractionDigits: 0,
        }).format(amount);
    };

    const formatDate = (date) => {
        return formatDisplayDate(date, { short: true });
    };

    // Filter transactions by selected date and type
    const filteredTransactions = transactions.filter(tx => {
        const txDate = typeof tx.date === 'string' ? tx.date.split('T')[0] : new Date(tx.date).toISOString().split('T')[0];
        const dateMatch = txDate === selectedDate;
        const typeMatch = typeFilter === 'all' || tx.type === typeFilter;
        return dateMatch && typeMatch;
    });

    // Calculate totals for the selected date
    const totalIncome = filteredTransactions
        .filter(tx => tx.type === 'income')
        .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

    const totalExpense = filteredTransactions
        .filter(tx => tx.type === 'expense')
        .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

    const balance = totalIncome - totalExpense;

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">{t('entry.title')}</h1>
                <p className="page-subtitle">{t('entry.subtitle')}</p>
            </div>

            {/* Global Date Selector */}
            <div className="card" style={{ marginBottom: 'var(--spacing-md)', position: 'relative', zIndex: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '1.25rem' }}>📅</span>
                    <label style={{ fontWeight: '600', color: 'var(--color-text-primary)', flex: '0 0 auto' }}>
                        {t('entry.selectDate')}:
                    </label>
                    <div style={{ flex: '1', maxWidth: '300px' }}>
                        <ThaiDatePicker
                            selected={selectedDate}
                            onChange={handleDateChange}
                            placeholder="Select date"
                        />
                    </div>
                </div>
            </div>

            <div className="entry-grid">
                {/* Income Column */}
                <div className="card entry-card">
                    <div className="entry-card-header income">
                        <span className="entry-card-icon">📈</span>
                        <h3>{t('entry.income')}</h3>
                    </div>
                    {incomeSuccess && <div className="success-message">{incomeSuccess}</div>}
                    <form onSubmit={handleIncomeSubmit}>
                        <div className="form-group">
                            <CategorySelect
                                value={incomeData.category}
                                onChange={(value) => setIncomeData({ ...incomeData, category: value })}
                                categories={incomeCategories}
                                type="income"
                                onCategoryAdded={fetchCategories}
                                placeholder="Search or add category"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <input
                                type="tel"
                                pattern="[0-9.,]*"
                                className="form-input"
                                placeholder={t('entry.amount')}
                                value={formatInputNumber(incomeData.amount)}
                                onChange={(e) => setIncomeData({ ...incomeData, amount: parseInputNumber(e.target.value) })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <button
                                    type="button"
                                    className="btn btn-danger btn-sm"
                                    style={{ width: '40px', height: '40px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                    onClick={() => setIncomeData(prev => ({ ...prev, quantity: Math.max(1, (prev.quantity || 1) - 1) }))}
                                >
                                    -
                                </button>
                                <input
                                    type="number"
                                    className="form-input"
                                    placeholder="Qty"
                                    min="1"
                                    style={{ textAlign: 'center' }}
                                    value={incomeData.quantity}
                                    onChange={(e) => setIncomeData({ ...incomeData, quantity: parseInt(e.target.value) || 1 })}
                                    onClick={(e) => e.target.select()}
                                />
                                <button
                                    type="button"
                                    className="btn btn-success btn-sm"
                                    style={{ width: '40px', height: '40px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                    onClick={() => setIncomeData(prev => ({ ...prev, quantity: (prev.quantity || 1) + 1 }))}
                                >
                                    +
                                </button>
                            </div>
                        </div>
                        <div className="form-group">
                            <input
                                type="text"
                                className="form-input"
                                placeholder={t('entry.note')}
                                value={incomeData.description}
                                onChange={(e) => setIncomeData({ ...incomeData, description: e.target.value })}
                            />
                        </div>
                        <button type="submit" className="btn btn-success btn-block" disabled={incomeLoading}>
                            {incomeLoading ? t('entry.adding') : t('entry.addIncome')}
                        </button>
                    </form>
                </div>

                {/* Expense Column */}
                <div className="card entry-card">
                    <div className="entry-card-header expense">
                        <span className="entry-card-icon">📉</span>
                        <h3>{t('entry.expense')}</h3>
                    </div>
                    {expenseSuccess && <div className="success-message">{expenseSuccess}</div>}
                    <form onSubmit={handleExpenseSubmit}>
                        <div className="form-group">
                            <CategorySelect
                                value={expenseData.category}
                                onChange={(value) => setExpenseData({ ...expenseData, category: value })}
                                categories={expenseCategories}
                                type="expense"
                                onCategoryAdded={fetchCategories}
                                placeholder="Search or add category"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <input
                                type="tel"
                                pattern="[0-9.,]*"
                                className="form-input"
                                placeholder={t('entry.amount')}
                                value={formatInputNumber(expenseData.amount)}
                                onChange={(e) => setExpenseData({ ...expenseData, amount: parseInputNumber(e.target.value) })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <button
                                    type="button"
                                    className="btn btn-danger btn-sm"
                                    style={{ width: '40px', height: '40px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                    onClick={() => setExpenseData(prev => ({ ...prev, quantity: Math.max(1, (prev.quantity || 1) - 1) }))}
                                >
                                    -
                                </button>
                                <input
                                    type="number"
                                    className="form-input"
                                    placeholder="Qty"
                                    min="1"
                                    style={{ textAlign: 'center' }}
                                    value={expenseData.quantity}
                                    onChange={(e) => setExpenseData({ ...expenseData, quantity: parseInt(e.target.value) || 1 })}
                                    onClick={(e) => e.target.select()}
                                />
                                <button
                                    type="button"
                                    className="btn btn-success btn-sm"
                                    style={{ width: '40px', height: '40px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                    onClick={() => setExpenseData(prev => ({ ...prev, quantity: (prev.quantity || 1) + 1 }))}
                                >
                                    +
                                </button>
                            </div>
                        </div>
                        <div className="form-group">
                            <input
                                type="text"
                                className="form-input"
                                placeholder={t('entry.note')}
                                value={expenseData.description}
                                onChange={(e) => setExpenseData({ ...expenseData, description: e.target.value })}
                            />
                        </div>
                        <button type="submit" className="btn btn-danger btn-block" disabled={expenseLoading}>
                            {expenseLoading ? t('entry.adding') : t('entry.addExpense')}
                        </button>
                    </form>
                </div>

                {/* History Column */}
                <div className="card entry-card history-card">
                    <div className="entry-card-header history">
                        <span className="entry-card-icon">📋</span>
                        <h3>{t('entry.history')}</h3>
                    </div>
                    {/* Date Filter */}
                    <div className="history-filter">
                        <ThaiDatePicker
                            selected={selectedDate}
                            onChange={handleDateChange}
                            placeholder={t('entry.selectDate')}
                        />
                    </div>
                    {/* Type Filter */}
                    <div className="history-type-filter">
                        <label className={`type-filter-option ${typeFilter === 'all' ? 'active' : ''}`}>
                            <input
                                type="radio"
                                name="typeFilter"
                                value="all"
                                checked={typeFilter === 'all'}
                                onChange={(e) => setTypeFilter(e.target.value)}
                            />
                            <span>{t('common.all')}</span>
                        </label>
                        <label className={`type-filter-option income ${typeFilter === 'income' ? 'active' : ''}`}>
                            <input
                                type="radio"
                                name="typeFilter"
                                value="income"
                                checked={typeFilter === 'income'}
                                onChange={(e) => setTypeFilter(e.target.value)}
                            />
                            <span>📈 {t('entry.income')}</span>
                        </label>
                        <label className={`type-filter-option expense ${typeFilter === 'expense' ? 'active' : ''}`}>
                            <input
                                type="radio"
                                name="typeFilter"
                                value="expense"
                                checked={typeFilter === 'expense'}
                                onChange={(e) => setTypeFilter(e.target.value)}
                            />
                            <span>📉 {t('entry.expense')}</span>
                        </label>
                    </div>
                    <div className="history-list">
                        {loading ? (
                            <div className="empty-state"><p>Loading...</p></div>
                        ) : filteredTransactions.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-state-icon">📝</div>
                                <p>No transactions for this date</p>
                            </div>
                        ) : (
                            filteredTransactions.map((tx) => (
                                <div key={tx.id} className="transaction-item compact">
                                    <div className={`transaction-type-badge ${tx.type}`}>
                                        {tx.type === 'income' ? '+' : '-'}
                                    </div>
                                    <div className="transaction-details">
                                        <div className="transaction-category">{tx.category.replace('_', ' ')}</div>
                                        <div className="transaction-date">
                                            {formatDate(tx.date)}
                                            {tx.userName && <span style={{ marginLeft: '8px', color: 'var(--color-text-tertiary)' }}>({tx.userName})</span>}
                                        </div>
                                        {tx.quantity && tx.quantity > 1 && (
                                            <div style={{
                                                fontSize: '0.75rem',
                                                color: tx.type === 'income' ? 'var(--color-accent-green)' : 'var(--color-accent-red)',
                                                marginTop: '2px'
                                            }}>
                                                {formatNumber(tx.amount)}/{tx.quantity} = {formatNumber(tx.amount / tx.quantity)}
                                            </div>
                                        )}
                                    </div>
                                    <div className={`transaction-amount ${tx.type === 'income' ? 'text-success' : 'text-danger'}`} style={{ marginRight: '12px' }}>
                                        {tx.type === 'income' ? '+' : '-'}{formatNumber(tx.amount)}
                                    </div>
                                    <div style={{ display: 'flex', gap: '4px' }}>
                                        <button
                                            className="btn btn-primary btn-sm"
                                            onClick={() => handleEdit(tx)}
                                            style={{ padding: '4px 8px' }}
                                        >
                                            ✏️
                                        </button>
                                        <button
                                            className="btn btn-danger btn-sm"
                                            onClick={() => handleDelete(tx.id)}
                                            style={{ padding: '4px 8px' }}
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    {/* Totals Section */}
                    <div className="history-totals">
                        <div className="history-total-row">
                            <span className="history-total-label">{t('entry.income')}:</span>
                            <span className="history-total-value text-success">+{formatNumber(totalIncome)}</span>
                        </div>
                        <div className="history-total-row">
                            <span className="history-total-label">{t('entry.expense')}:</span>
                            <span className="history-total-value text-danger">-{formatNumber(totalExpense)}</span>
                        </div>
                        <div className="history-total-row balance">
                            <span className="history-total-label">{t('dashboard.balance')}:</span>
                            <span className={`history-total-value ${balance >= 0 ? 'text-success' : 'text-danger'}`}>
                                {balance >= 0 ? '+' : ''}{formatNumber(balance)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Transaction Modal */}
            <Modal
                isOpen={isEditModalOpen}
                onClose={handleCancelEdit}
                title={editingTransaction?.type === 'income' ? t('entry.editIncome') : t('entry.editExpense')}
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div className="form-group">
                        <label className="form-label">{t('entry.amount')}</label>
                        <input
                            type="text"
                            className="form-input"
                            value={editData.amount ? formatNumber(editData.amount) : ''}
                            onChange={(e) => {
                                const value = e.target.value.replace(/,/g, '');
                                if (value === '' || !isNaN(value)) {
                                    setEditData({ ...editData, amount: value });
                                }
                            }}
                            placeholder="0.00"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">{t('entry.qty')}</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <button
                                type="button"
                                className="btn btn-danger btn-sm"
                                style={{ width: '40px', height: '40px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                onClick={() => setEditData({ ...editData, quantity: Math.max(1, (editData.quantity || 1) - 1) })}
                            >
                                -
                            </button>
                            <input
                                type="number"
                                className="form-input"
                                min="1"
                                style={{ textAlign: 'center' }}
                                value={editData.quantity || 1}
                                onChange={(e) => setEditData({ ...editData, quantity: parseInt(e.target.value) || 1 })}
                                onClick={(e) => e.target.select()}
                                placeholder="1"
                            />
                            <button
                                type="button"
                                className="btn btn-success btn-sm"
                                style={{ width: '40px', height: '40px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                onClick={() => setEditData({ ...editData, quantity: (editData.quantity || 1) + 1 })}
                            >
                                +
                            </button>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">{t('entry.category')}</label>
                        <CategorySelect
                            value={editData.category}
                            onChange={(value) => setEditData({ ...editData, category: value })}
                            categories={editingTransaction?.type === 'income' ? incomeCategories : expenseCategories}
                            type={editingTransaction?.type || 'expense'}
                            onCategoryAdded={fetchCategories}
                            placeholder="Select category"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">{t('entry.date')}</label>
                        <ThaiDatePicker
                            selected={editData.date}
                            onChange={(date) => setEditData({ ...editData, date })}
                            placeholder="Select date"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">{t('entry.note')}</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Add a note..."
                            value={editData.description || ''}
                            onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                        <button
                            className="btn btn-success btn-block"
                            onClick={handleSaveEdit}
                            style={{ flex: 1 }}
                        >
                            ✓ {t('entry.saveChanges')}
                        </button>
                        <button
                            className="btn btn-secondary btn-block"
                            onClick={handleCancelEdit}
                            style={{ flex: 1 }}
                        >
                            ✕ {t('common.cancel')}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Entry;
