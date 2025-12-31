import { useState, useEffect } from 'react';
import { createTransaction, updateTransaction, getTransactions, deleteTransaction } from '../services/api';

const Entry = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [editingId, setEditingId] = useState(null);
    const [editData, setEditData] = useState({});

    // Income Form
    const [incomeData, setIncomeData] = useState({
        amount: '', category: 'salary', description: '',
    });
    const [incomeLoading, setIncomeLoading] = useState(false);
    const [incomeSuccess, setIncomeSuccess] = useState('');

    // Expense Form
    const [expenseData, setExpenseData] = useState({
        amount: '', category: 'food', description: '',
    });
    const [expenseLoading, setExpenseLoading] = useState(false);
    const [expenseSuccess, setExpenseSuccess] = useState('');

    useEffect(() => {
        fetchTransactions();
    }, []);

    const fetchTransactions = async () => {
        try {
            setLoading(true);
            const res = await getTransactions({});
            setTransactions(res.data);
        } catch (error) {
            console.error('Error fetching transactions:', error);
            alert('Error loading transactions: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleIncomeSubmit = async (e) => {
        e.preventDefault();
        setIncomeLoading(true);
        try {
            await createTransaction({
                type: 'income',
                amount: parseFloat(incomeData.amount),
                category: incomeData.category,
                description: incomeData.description,
                date: selectedDate,
            });
            setIncomeData({ amount: '', category: 'salary', description: '' });
            setIncomeSuccess('Income added!');
            setTimeout(() => setIncomeSuccess(''), 2000);
            fetchTransactions();
        } catch (error) {
            console.error('Error:', error);
            alert('Error adding income: ' + error.message);
        } finally {
            setIncomeLoading(false);
        }
    };

    const handleExpenseSubmit = async (e) => {
        e.preventDefault();
        setExpenseLoading(true);
        try {
            await createTransaction({
                type: 'expense',
                amount: parseFloat(expenseData.amount),
                category: expenseData.category,
                description: expenseData.description,
                date: selectedDate,
            });
            setExpenseData({ amount: '', category: 'food', description: '' });
            setExpenseSuccess('Expense added!');
            setTimeout(() => setExpenseSuccess(''), 2000);
            fetchTransactions();
        } catch (error) {
            console.error('Error:', error);
            alert('Error adding expense: ' + error.message);
        } finally {
            setExpenseLoading(false);
        }
    };

    const handleEdit = (tx) => {
        setEditingId(tx.id);
        setEditData({
            amount: tx.amount,
            category: tx.category,
            description: tx.description || '',
            date: tx.date
        });
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditData({});
    };

    const handleSaveEdit = async (id) => {
        try {
            await updateTransaction(id, {
                amount: parseFloat(editData.amount),
                category: editData.category,
                description: editData.description,
                date: editData.date
            });
            setEditingId(null);
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
            alert('Error deleting: ' + error.message);
        }
    };

    const formatNumber = (amount) => {
        return new Intl.NumberFormat('th-TH').format(amount);
    };

    const filteredTransactions = transactions.filter(tx => tx.date === selectedDate);

    const incomeCategories = [
        { value: 'salary', label: 'Salary' },
        { value: 'freelance', label: 'Freelance' },
        { value: 'investment', label: 'Investment' },
        { value: 'gift', label: 'Gift' },
        { value: 'other_income', label: 'Other' },
    ];

    const expenseCategories = [
        { value: 'food', label: 'Food & Dining' },
        { value: 'transport', label: 'Transport' },
        { value: 'shopping', label: 'Shopping' },
        { value: 'entertainment', label: 'Entertainment' },
        { value: 'bills', label: 'Bills & Utilities' },
        { value: 'health', label: 'Health' },
        { value: 'education', label: 'Education' },
        { value: 'travel', label: 'Travel' },
        { value: 'other_expense', label: 'Other' },
    ];

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Entry</h1>
                <p className="page-subtitle">Add and manage income and expenses</p>
            </div>

            <div className="entry-grid">
                {/* Income Column */}
                <div className="card entry-card">
                    <div className="entry-card-header income">
                        <span className="entry-card-icon">📈</span>
                        <h3>Income</h3>
                    </div>
                    {incomeSuccess && <div className="alert alert-success">{incomeSuccess}</div>}
                    <form onSubmit={handleIncomeSubmit}>
                        <div className="form-group">
                            <label className="form-label">Amount</label>
                            <input
                                type="number"
                                step="0.01"
                                className="form-input"
                                placeholder="0.00"
                                value={incomeData.amount}
                                onChange={(e) => setIncomeData({ ...incomeData, amount: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Category</label>
                            <select
                                className="form-select"
                                value={incomeData.category}
                                onChange={(e) => setIncomeData({ ...incomeData, category: e.target.value })}
                                required
                            >
                                {incomeCategories.map(cat => (
                                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Date</label>
                            <input
                                type="date"
                                className="form-input"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Note (Optional)</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Note"
                                value={incomeData.description}
                                onChange={(e) => setIncomeData({ ...incomeData, description: e.target.value })}
                            />
                        </div>
                        <button type="submit" className="btn btn-success btn-block" disabled={incomeLoading}>
                            {incomeLoading ? 'Adding...' : 'Add Income'}
                        </button>
                    </form>
                </div>

                {/* Expense Column */}
                <div className="card entry-card">
                    <div className="entry-card-header expense">
                        <span className="entry-card-icon">📉</span>
                        <h3>Expense</h3>
                    </div>
                    {expenseSuccess && <div className="alert alert-success">{expenseSuccess}</div>}
                    <form onSubmit={handleExpenseSubmit}>
                        <div className="form-group">
                            <label className="form-label">Amount</label>
                            <input
                                type="number"
                                step="0.01"
                                className="form-input"
                                placeholder="0.00"
                                value={expenseData.amount}
                                onChange={(e) => setExpenseData({ ...expenseData, amount: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Category</label>
                            <select
                                className="form-select"
                                value={expenseData.category}
                                onChange={(e) => setExpenseData({ ...expenseData, category: e.target.value })}
                                required
                            >
                                {expenseCategories.map(cat => (
                                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Date</label>
                            <input
                                type="date"
                                className="form-input"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Note (Optional)</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Note"
                                value={expenseData.description}
                                onChange={(e) => setExpenseData({ ...expenseData, description: e.target.value })}
                            />
                        </div>
                        <button type="submit" className="btn btn-danger btn-block" disabled={expenseLoading}>
                            {expenseLoading ? 'Adding...' : 'Add Expense'}
                        </button>
                    </form>
                </div>

                {/* History Column */}
                <div className="card entry-card history-card">
                    <div className="entry-card-header history">
                        <span className="entry-card-icon">📋</span>
                        <h3>History</h3>
                    </div>
                    <div className="history-filter">
                        <input
                            type="date"
                            className="form-input"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                        />
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
                                <div key={tx.id} className="transaction-item compact" style={{ flexDirection: 'column', gap: '8px' }}>
                                    {editingId === tx.id ? (
                                        // Edit Mode
                                        <div style={{ width: '100%' }}>
                                            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    className="form-input"
                                                    style={{ flex: 1 }}
                                                    value={editData.amount}
                                                    onChange={(e) => setEditData({ ...editData, amount: e.target.value })}
                                                />
                                                <select
                                                    className="form-select"
                                                    style={{ flex: 1 }}
                                                    value={editData.category}
                                                    onChange={(e) => setEditData({ ...editData, category: e.target.value })}
                                                >
                                                    {(tx.type === 'income' ? incomeCategories : expenseCategories).map(cat => (
                                                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                                                <input
                                                    type="date"
                                                    className="form-input"
                                                    style={{ flex: 1 }}
                                                    value={editData.date}
                                                    onChange={(e) => setEditData({ ...editData, date: e.target.value })}
                                                />
                                                <input
                                                    type="text"
                                                    className="form-input"
                                                    style={{ flex: 1 }}
                                                    placeholder="Note"
                                                    value={editData.description}
                                                    onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                                                />
                                            </div>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button className="btn btn-success btn-sm" style={{ flex: 1 }} onClick={() => handleSaveEdit(tx.id)}>
                                                    ✓ Save
                                                </button>
                                                <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={handleCancelEdit}>
                                                    ✕ Cancel
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        // View Mode
                                        <>
                                            <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                                                <div className={`transaction-type-badge ${tx.type}`}>
                                                    {tx.type === 'income' ? '+' : '-'}
                                                </div>
                                                <div className="transaction-details" style={{ flex: 1 }}>
                                                    <div className="transaction-category">{tx.category.replace('_', ' ')}</div>
                                                    <div className="transaction-date">{tx.date}</div>
                                                    {tx.description && <div className="transaction-date" style={{ fontSize: '0.8rem' }}>📝 {tx.description}</div>}
                                                </div>
                                                <div className={`transaction-amount ${tx.type === 'income' ? 'text-success' : 'text-danger'}`}>
                                                    {tx.type === 'income' ? '+' : '-'}{formatNumber(tx.amount)}
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                                                <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => handleEdit(tx)}>
                                                    ✏️ Edit
                                                </button>
                                                <button className="btn btn-danger btn-sm" style={{ flex: 1 }} onClick={() => handleDelete(tx.id)}>
                                                    🗑️ Delete
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Entry;
