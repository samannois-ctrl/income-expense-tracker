import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';

const API_URL = 'http://localhost:3001/api';

const Categories = () => {
    const { user } = useAuth();
    const { t } = useSettings();
    const [incomeCategories, setIncomeCategories] = useState([]);
    const [expenseCategories, setExpenseCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newIncomeName, setNewIncomeName] = useState('');
    const [newExpenseName, setNewExpenseName] = useState('');

    // Split status for each section
    const [status, setStatus] = useState({
        income: { error: '', success: '' },
        expense: { error: '', success: '' }
    });

    const [editingId, setEditingId] = useState(null);
    const [editingName, setEditingName] = useState('');
    const [searchIncome, setSearchIncome] = useState('');
    const [searchExpense, setSearchExpense] = useState('');

    useEffect(() => {
        fetchCategories();
    }, []);

    const setStatusMessage = (type, key, message) => {
        setStatus(prev => ({
            ...prev,
            [type]: {
                ...prev[type],
                [key]: message
            }
        }));
    };

    const clearStatus = (type) => {
        setStatus(prev => ({
            ...prev,
            [type]: { error: '', success: '' }
        }));
    };

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');

            const response = await fetch(`${API_URL}/categories`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to load categories');
            }

            const data = await response.json();

            setIncomeCategories(data.filter(cat => cat.type === 'income'));
            setExpenseCategories(data.filter(cat => cat.type === 'expense'));
        } catch (err) {
            console.error('❌ fetchCategories error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddCategory = async (name, type) => {
        clearStatus(type);

        if (!name.trim()) {
            setStatusMessage(type, 'error', t('categories.nameRequired'));
            setTimeout(() => setStatusMessage(type, 'error', ''), 3000);
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/categories`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ name: name.trim(), type })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to add category');
            }

            setStatusMessage(type, 'success', t('categories.addedSuccess', { name }));
            setTimeout(() => setStatusMessage(type, 'success', ''), 3000);

            if (type === 'income') {
                setNewIncomeName('');
            } else {
                setNewExpenseName('');
            }

            fetchCategories();
        } catch (err) {
            setStatusMessage(type, 'error', err.message);
            setTimeout(() => setStatusMessage(type, 'error', ''), 3000);
        }
    };

    const handleToggleActive = async (id, currentStatus, type) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/categories/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ isActive: currentStatus ? 0 : 1 })
            });

            if (!response.ok) {
                throw new Error('Failed to update category');
            }

            fetchCategories();
        } catch (err) {
            setStatusMessage(type, 'error', err.message);
            setTimeout(() => setStatusMessage(type, 'error', ''), 3000);
        }
    };

    const handleDeleteCategory = async (id, name, type) => {
        if (!confirm(t('categories.deleteConfirm', { name }))) {
            return;
        }

        clearStatus(type);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/categories/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to delete category');
            }

            setStatusMessage(type, 'success', t('categories.deletedSuccess', { name }));
            setTimeout(() => setStatusMessage(type, 'success', ''), 3000);
            fetchCategories();
        } catch (err) {
            setStatusMessage(type, 'error', err.message);
            setTimeout(() => setStatusMessage(type, 'error', ''), 5000);
        }
    };

    const handleEditCategory = (id, currentName) => {
        setEditingId(id);
        setEditingName(currentName);
    };

    const handleSaveEdit = async (id, type) => {
        clearStatus(type);

        if (!editingName.trim()) {
            setStatusMessage(type, 'error', t('categories.nameRequired'));
            setTimeout(() => setStatusMessage(type, 'error', ''), 3000);
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/categories/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ name: editingName.trim() })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to update category');
            }

            setStatusMessage(type, 'success', t('categories.updatedSuccess'));
            setTimeout(() => setStatusMessage(type, 'success', ''), 3000);
            setEditingId(null);
            setEditingName('');
            fetchCategories();
        } catch (err) {
            setStatusMessage(type, 'error', err.message);
            setTimeout(() => setStatusMessage(type, 'error', ''), 3000);
        }
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditingName('');
    };

    const CategoryList = ({ categories, type }) => {
        // Filter categories based on search term
        const filteredCategories = categories.filter(cat => {
            const searchTerm = type === 'income' ? searchIncome : searchExpense;
            if (!searchTerm) return true;
            return cat.name.toLowerCase().includes(searchTerm.toLowerCase());
        });

        return (
            <div className="category-list-container">
                {filteredCategories.map(cat => (
                    <div key={cat.id} className={`category-item ${!cat.isActive ? 'inactive' : ''}`}>
                        <div className="category-info">
                            {editingId === cat.id ? (
                                <input
                                    type="text"
                                    className="form-input"
                                    value={editingName}
                                    onChange={(e) => setEditingName(e.target.value)}
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                            handleSaveEdit(cat.id, type);
                                        } else if (e.key === 'Escape') {
                                            handleCancelEdit();
                                        }
                                    }}
                                    autoFocus
                                    style={{ marginBottom: 0 }}
                                />
                            ) : (
                                <>
                                    <span className="category-name">{cat.name}</span>
                                    {cat.transactionCount > 0 && (
                                        <span className="badge badge-info" title={t('categories.cannotDelete', { count: cat.transactionCount })}>
                                            {cat.transactionCount} {t('categories.txn')}
                                        </span>
                                    )}
                                </>
                            )}
                        </div>
                        <div className="category-actions">
                            {editingId === cat.id ? (
                                <>
                                    <button
                                        className="btn btn-success btn-sm"
                                        onClick={() => handleSaveEdit(cat.id, type)}
                                        title={t('common.save')}
                                    >
                                        ✓
                                    </button>
                                    <button
                                        className="btn btn-secondary btn-sm"
                                        onClick={handleCancelEdit}
                                        title={t('common.cancel')}
                                    >
                                        ✕
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        className="btn btn-primary btn-sm"
                                        onClick={() => handleEditCategory(cat.id, cat.name)}
                                        title={t('common.edit')}
                                    >
                                        ✏️
                                    </button>
                                    <label className="toggle-switch">
                                        <input
                                            type="checkbox"
                                            checked={cat.isActive === 1}
                                            onChange={() => handleToggleActive(cat.id, cat.isActive, type)}
                                        />
                                        <span className="toggle-slider"></span>
                                    </label>
                                    {/* Show delete button only if admin AND no transactions */}
                                    {user?.role === 'admin' && cat.transactionCount === 0 && (
                                        <button
                                            className="btn btn-danger btn-sm"
                                            onClick={() => handleDeleteCategory(cat.id, cat.name, type)}
                                            title={t('common.delete')}
                                        >
                                            🗑️
                                        </button>
                                    )}
                                    {/* Show lock icon if admin but has transactions */}
                                    {user?.role === 'admin' && cat.transactionCount > 0 && (
                                        <button
                                            className="btn btn-secondary btn-sm"
                                            disabled
                                            title={t('categories.cannotDelete', { count: cat.transactionCount })}
                                            style={{ opacity: 0.5, cursor: 'not-allowed' }}
                                        >
                                            🔒
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    if (loading) {
        return <div className="loading">{t('common.loading')}</div>;
    }

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">📁 {t('categories.title')}</h1>
                <p className="page-subtitle">{t('categories.subtitle')}</p>
            </div>

            <div className="categories-grid">
                {/* Income Categories */}
                <div className="card">
                    <div className="category-section-header income">
                        <span className="category-icon">📈</span>
                        <h3>{t('categories.incomeCategories')}</h3>
                        <span className="category-count">{incomeCategories.length} {t('categories.count')}</span>
                    </div>

                    {/* Notifications */}
                    {status.income.error && (
                        <div className="error-message" style={{ margin: '1rem 1rem 0 1rem' }}>
                            <span>{status.income.error}</span>
                            <button
                                className="message-close-btn"
                                onClick={() => setStatusMessage('income', 'error', '')}
                                title="Close"
                            >
                                ×
                            </button>
                        </div>
                    )}
                    {status.income.success && (
                        <div className="success-message" style={{ margin: '1rem 1rem 0 1rem' }}>
                            <span>{status.income.success}</span>
                            <button
                                className="message-close-btn"
                                onClick={() => setStatusMessage('income', 'success', '')}
                                title="Close"
                            >
                                ×
                            </button>
                        </div>
                    )}

                    {/* Search input for income */}
                    <div className="search-box" style={{ padding: '1rem', borderBottom: '1px solid #e5e7eb' }}>
                        <input
                            type="text"
                            className="form-input"
                            placeholder={t('categories.searchIncome')}
                            value={searchIncome}
                            onChange={(e) => setSearchIncome(e.target.value)}
                            style={{ marginBottom: 0 }}
                        />
                    </div>

                    {/* Add income category form */}
                    <div className="add-category-form" style={{ padding: '1rem', borderBottom: '1px solid #e5e7eb' }}>
                        <input
                            type="text"
                            className="form-input"
                            placeholder={t('categories.newIncomePlaceholder')}
                            value={newIncomeName}
                            onChange={(e) => setNewIncomeName(e.target.value)}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                    handleAddCategory(newIncomeName, 'income');
                                }
                            }}
                        />
                        <button
                            className="btn btn-success btn-block"
                            onClick={() => handleAddCategory(newIncomeName, 'income')}
                            style={{ marginTop: '0.5rem' }}
                        >
                            {t('categories.addIncomeCategory')}
                        </button>
                    </div>

                    <CategoryList categories={incomeCategories} type="income" />
                </div>

                {/* Expense Categories */}
                <div className="card">
                    <div className="category-section-header expense">
                        <span className="category-icon">📉</span>
                        <h3>{t('categories.expenseCategories')}</h3>
                        <span className="category-count">{expenseCategories.length} {t('categories.count')}</span>
                    </div>

                    {/* Notifications */}
                    {status.expense.error && (
                        <div className="error-message" style={{ margin: '1rem 1rem 0 1rem' }}>
                            <span>{status.expense.error}</span>
                            <button
                                className="message-close-btn"
                                onClick={() => setStatusMessage('expense', 'error', '')}
                                title="Close"
                            >
                                ×
                            </button>
                        </div>
                    )}
                    {status.expense.success && (
                        <div className="success-message" style={{ margin: '1rem 1rem 0 1rem' }}>
                            <span>{status.expense.success}</span>
                            <button
                                className="message-close-btn"
                                onClick={() => setStatusMessage('expense', 'success', '')}
                                title="Close"
                            >
                                ×
                            </button>
                        </div>
                    )}

                    {/* Search input for expense */}
                    <div className="search-box" style={{ padding: '1rem', borderBottom: '1px solid #e5e7eb' }}>
                        <input
                            type="text"
                            className="form-input"
                            placeholder={t('categories.searchExpense')}
                            value={searchExpense}
                            onChange={(e) => setSearchExpense(e.target.value)}
                            style={{ marginBottom: 0 }}
                        />
                    </div>

                    {/* Add expense category form */}
                    <div className="add-category-form" style={{ padding: '1rem', borderBottom: '1px solid #e5e7eb' }}>
                        <input
                            type="text"
                            className="form-input"
                            placeholder={t('categories.newExpensePlaceholder')}
                            value={newExpenseName}
                            onChange={(e) => setNewExpenseName(e.target.value)}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                    handleAddCategory(newExpenseName, 'expense');
                                }
                            }}
                        />
                        <button
                            className="btn btn-danger btn-block"
                            onClick={() => handleAddCategory(newExpenseName, 'expense')}
                            style={{ marginTop: '0.5rem' }}
                        >
                            {t('categories.addExpenseCategory')}
                        </button>
                    </div>

                    <CategoryList categories={expenseCategories} type="expense" />
                </div>
            </div>
        </div>
    );
};

export default Categories;
