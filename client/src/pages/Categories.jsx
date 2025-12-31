import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const API_URL = 'http://localhost:3001/api';

const Categories = () => {
    const { user } = useAuth();
    const [incomeCategories, setIncomeCategories] = useState([]);
    const [expenseCategories, setExpenseCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newIncomeName, setNewIncomeName] = useState('');
    const [newExpenseName, setNewExpenseName] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editingName, setEditingName] = useState('');
    const [searchIncome, setSearchIncome] = useState('');
    const [searchExpense, setSearchExpense] = useState('');

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            console.log('🔑 Token from localStorage (Categories):', token);

            const response = await fetch(`${API_URL}/categories`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            console.log('📦 Categories API Response Status:', response.status);

            if (!response.ok) {
                const errorData = await response.json();
                console.error('❌ Categories API Error:', errorData);
                throw new Error(errorData.error || 'Failed to load categories');
            }

            const data = await response.json();
            console.log('✅ Categories loaded:', data);

            setIncomeCategories(data.filter(cat => cat.type === 'income'));
            setExpenseCategories(data.filter(cat => cat.type === 'expense'));
        } catch (err) {
            console.error('❌ fetchCategories error:', err);
            setError('Failed to load categories');
        } finally {
            setLoading(false);
        }
    };

    const handleAddCategory = async (name, type) => {
        if (!name.trim()) {
            setError('Category name is required');
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

            setSuccess(`Category "${name}" added successfully!`);
            setTimeout(() => setSuccess(''), 3000);

            if (type === 'income') {
                setNewIncomeName('');
            } else {
                setNewExpenseName('');
            }

            fetchCategories();
        } catch (err) {
            setError(err.message);
            setTimeout(() => setError(''), 3000);
        }
    };

    const handleToggleActive = async (id, currentStatus) => {
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
            setError(err.message);
            setTimeout(() => setError(''), 3000);
        }
    };

    const handleDeleteCategory = async (id, name) => {
        if (!confirm(`Are you sure you want to delete "${name}"?`)) {
            return;
        }

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

            setSuccess(`Category "${name}" deleted successfully!`);
            setTimeout(() => setSuccess(''), 3000);
            fetchCategories();
        } catch (err) {
            setError(err.message);
            setTimeout(() => setError(''), 5000); // Longer timeout for detailed messages
        }
    };

    const handleEditCategory = (id, currentName) => {
        setEditingId(id);
        setEditingName(currentName);
    };

    const handleSaveEdit = async (id) => {
        if (!editingName.trim()) {
            setError('Category name cannot be empty');
            setTimeout(() => setError(''), 3000);
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

            setSuccess('Category updated successfully!');
            setTimeout(() => setSuccess(''), 3000);
            setEditingId(null);
            setEditingName('');
            fetchCategories();
        } catch (err) {
            setError(err.message);
            setTimeout(() => setError(''), 3000);
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
                                            handleSaveEdit(cat.id);
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
                                        <span className="badge badge-info" title="Number of transactions using this category">
                                            {cat.transactionCount} txn{cat.transactionCount > 1 ? 's' : ''}
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
                                        onClick={() => handleSaveEdit(cat.id)}
                                        title="Save"
                                    >
                                        ✓
                                    </button>
                                    <button
                                        className="btn btn-secondary btn-sm"
                                        onClick={handleCancelEdit}
                                        title="Cancel"
                                    >
                                        ✕
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        className="btn btn-primary btn-sm"
                                        onClick={() => handleEditCategory(cat.id, cat.name)}
                                        title="Edit name"
                                    >
                                        ✏️
                                    </button>
                                    <label className="toggle-switch">
                                        <input
                                            type="checkbox"
                                            checked={cat.isActive === 1}
                                            onChange={() => handleToggleActive(cat.id, cat.isActive)}
                                        />
                                        <span className="toggle-slider"></span>
                                    </label>
                                    {/* Show delete button only if admin AND no transactions */}
                                    {user?.role === 'admin' && cat.transactionCount === 0 && (
                                        <button
                                            className="btn btn-danger btn-sm"
                                            onClick={() => handleDeleteCategory(cat.id, cat.name)}
                                            title="Delete category"
                                        >
                                            🗑️
                                        </button>
                                    )}
                                    {/* Show lock icon if admin but has transactions */}
                                    {user?.role === 'admin' && cat.transactionCount > 0 && (
                                        <button
                                            className="btn btn-secondary btn-sm"
                                            disabled
                                            title={`Cannot delete: ${cat.transactionCount} transaction(s) using this category`}
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
        return <div className="loading">Loading categories...</div>;
    }

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">📁 Manage Categories</h1>
                <p className="page-subtitle">Add, enable, or disable income and expense categories</p>
            </div>

            <div className="categories-grid">
                {/* Income Categories */}
                <div className="card">
                    <div className="category-section-header income">
                        <span className="category-icon">📈</span>
                        <h3>Income Categories</h3>
                        <span className="category-count">{incomeCategories.length}</span>
                    </div>

                    {/* Notifications */}
                    {error && (
                        <div className="error-message" style={{ margin: '1rem 1rem 0 1rem' }}>
                            <span>{error}</span>
                            <button
                                className="message-close-btn"
                                onClick={() => setError('')}
                                title="Close"
                            >
                                ×
                            </button>
                        </div>
                    )}
                    {success && (
                        <div className="success-message" style={{ margin: '1rem 1rem 0 1rem' }}>
                            <span>{success}</span>
                            <button
                                className="message-close-btn"
                                onClick={() => setSuccess('')}
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
                            placeholder="🔍 ค้นหา income category..."
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
                            placeholder="New income category..."
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
                            + Add Income Category
                        </button>
                    </div>

                    <CategoryList categories={incomeCategories} type="income" />
                </div>

                {/* Expense Categories */}
                <div className="card">
                    <div className="category-section-header expense">
                        <span className="category-icon">📉</span>
                        <h3>Expense Categories</h3>
                        <span className="category-count">{expenseCategories.length}</span>
                    </div>

                    {/* Notifications */}
                    {error && (
                        <div className="error-message" style={{ margin: '1rem 1rem 0 1rem' }}>
                            <span>{error}</span>
                            <button
                                className="message-close-btn"
                                onClick={() => setError('')}
                                title="Close"
                            >
                                ×
                            </button>
                        </div>
                    )}
                    {success && (
                        <div className="success-message" style={{ margin: '1rem 1rem 0 1rem' }}>
                            <span>{success}</span>
                            <button
                                className="message-close-btn"
                                onClick={() => setSuccess('')}
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
                            placeholder="🔍 ค้นหา expense category..."
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
                            placeholder="New expense category..."
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
                            + Add Expense Category
                        </button>
                    </div>

                    <CategoryList categories={expenseCategories} type="expense" />
                </div>
            </div>
        </div>
    );
};

export default Categories;
