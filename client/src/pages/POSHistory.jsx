import { useState, useEffect, Fragment } from 'react';
import { useSettings } from '../context/SettingsContext';
import './POSHistory.css';

const API_URL = 'http://localhost:3001/api';

const POSHistory = () => {
    const { t, language } = useSettings();
    const [sales, setSales] = useState([]);
    const [expandedSale, setExpandedSale] = useState(null);
    const [saleDetails, setSaleDetails] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSales();
    }, []);

    const fetchSales = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/pos/sales`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await res.json();
            setSales(json.data || []);
        } catch (error) {
            console.error('Error fetching sales:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleDetails = async (saleId) => {
        if (expandedSale === saleId) {
            setExpandedSale(null);
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/pos/sales/${saleId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await res.json();
            setSaleDetails(json.items || []);
            setExpandedSale(saleId);
        } catch (error) {
            console.error('Error fetching sale details:', error);
        }
    };

    const handleCancelSale = async (saleId) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/pos/sales/${saleId}/cancel`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                await fetchSales();
                if (expandedSale === saleId) {
                    const resDetails = await fetch(`${API_URL}/pos/sales/${saleId}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const json = await resDetails.json();
                    setSaleDetails(json.items || []);
                }
            }
        } catch (error) {
            console.error('Error cancelling sale:', error);
            alert('Failed to cancel sale');
        }
    };

    const handleUncancelSale = async (saleId) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/pos/sales/${saleId}/uncancel`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                await fetchSales();
                if (expandedSale === saleId) {
                    const resDetails = await fetch(`${API_URL}/pos/sales/${saleId}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const json = await resDetails.json();
                    setSaleDetails(json.items || []);
                }
            }
        } catch (error) {
            console.error('Error restoring sale:', error);
            alert('Failed to restore sale');
        }
    };

    const handleCancelItem = async (saleId, itemId) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/pos/sales/${saleId}/items/${itemId}/cancel`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const resDetails = await fetch(`${API_URL}/pos/sales/${saleId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const json = await resDetails.json();
                setSaleDetails(json.items || []);
                await fetchSales();
            }
        } catch (error) {
            console.error('Error cancelling item:', error);
            alert('Failed to cancel item');
        }
    };

    const handleUncancelItem = async (saleId, itemId) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/pos/sales/${saleId}/items/${itemId}/uncancel`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const resDetails = await fetch(`${API_URL}/pos/sales/${saleId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const json = await resDetails.json();
                setSaleDetails(json.items || []);
                await fetchSales();
            }
        } catch (error) {
            console.error('Error restoring item:', error);
            alert('Failed to restore item');
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('th-TH', {
            style: 'currency',
            currency: 'THB',
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }).format(amount);
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString(language === 'th' ? 'th-TH' : 'en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="main-content flex-center">
                <div className="text-muted">{t('posHistory.loading')}</div>
            </div>
        );
    }

    return (
        <div className="main-content">
            <div className="page-header">
                <h1 className="page-title">{t('posHistory.title')}</h1>
                <div className="page-subtitle">{t('posHistory.subtitle')}</div>
            </div>

            <div className="table-container">
                <table className="table">
                    <thead>
                        <tr>
                            <th style={{ width: '20%' }}>{t('posHistory.time')}</th>
                            <th style={{ width: '25%' }}>{t('posHistory.saleNumber')}</th>
                            <th style={{ width: '15%' }} className="text-center">{t('posHistory.items')}</th>
                            <th style={{ width: '20%' }} className="text-right">{t('posHistory.total')}</th>
                            <th style={{ width: '20%' }} className="text-center">{t('posHistory.actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sales.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="empty-state">
                                    <div className="empty-state-icon">🧾</div>
                                    <div>{t('posHistory.noHistory')}</div>
                                </td>
                            </tr>
                        ) : (
                            sales.map(sale => (
                                <Fragment key={sale.id}>
                                    <tr className={`${expandedSale === sale.id ? 'bg-active' : ''} ${sale.status === 'cancelled' ? 'row-cancelled' : ''}`}>
                                        <td className="text-muted">
                                            {formatDate(sale.saleDate)}
                                            {sale.status === 'cancelled' && <span className="status-badge status-cancelled ml-2">CANCELLED</span>}
                                        </td>
                                        <td>
                                            <span className="font-mono text-sm">{sale.paper_order_ref || '-'}</span>
                                        </td>
                                        <td className="text-center">
                                            <span className="badge badge-secondary">{sale.itemsCount}</span>
                                        </td>
                                        <td className="text-right font-bold">
                                            {sale.status === 'cancelled' ? (
                                                <span style={{ textDecoration: 'line-through', color: '#ef4444' }}>{formatCurrency(sale.totalAmount)}</span>
                                            ) : (
                                                formatCurrency(sale.totalAmount)
                                            )}
                                        </td>
                                        <td className="text-center">
                                            <div className="action-btn-group">
                                                <button
                                                    className={`btn btn-sm ${expandedSale === sale.id ? 'btn-primary' : 'btn-secondary'}`}
                                                    onClick={() => toggleDetails(sale.id)}
                                                >
                                                    {expandedSale === sale.id ? t('posHistory.hide') : t('posHistory.viewDetails')}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                    {expandedSale === sale.id && (
                                        <tr className="history-expanded-row">
                                            <td colSpan="5">
                                                <div className="order-details-card">
                                                    <div className="order-receipt-header">
                                                        <div className="receipt-title">{t('posHistory.orderReceipt')}</div>
                                                        <div className="receipt-id">#{sale.paper_order_ref || sale.id}</div>
                                                        <div className={`status-badge ${sale.status === 'cancelled' ? 'status-cancelled' : 'status-completed'} mt-sm`}>
                                                            {sale.status === 'cancelled' ? 'CANCELLED' : t('posHistory.completed')}
                                                        </div>
                                                    </div>

                                                    <div className="order-items-list">
                                                        {saleDetails.map((item, index) => {
                                                            const options = item.options_json ? JSON.parse(item.options_json) : [];
                                                            const isItemCancelled = item.is_cancelled === 1;
                                                            return (
                                                                <div key={item.id || index} className={`order-item ${isItemCancelled ? 'item-cancelled' : ''}`}>
                                                                    <div className="item-info">
                                                                        <div className="item-name">
                                                                            {item.itemName}
                                                                            {isItemCancelled && <span className="text-red-500 text-xs ml-2">(Cancelled)</span>}
                                                                        </div>
                                                                        {options.length > 0 && (
                                                                            <div className="item-options">
                                                                                {options.map(o => o.name).join(', ')}
                                                                            </div>
                                                                        )}
                                                                        <span className="item-qty">x{item.quantity}</span>
                                                                    </div>
                                                                    <div className="item-price-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                        <div className="item-price" style={{ textDecoration: isItemCancelled ? 'line-through' : 'none', color: isItemCancelled ? '#ef4444' : 'inherit' }}>
                                                                            {formatCurrency(item.total_price)}
                                                                        </div>
                                                                        {sale.status !== 'cancelled' && !isItemCancelled && (
                                                                            <button
                                                                                className="btn-icon-danger btn-sm"
                                                                                onClick={() => handleCancelItem(sale.id, item.id)}
                                                                                title="Cancel Item"
                                                                                style={{ padding: '2px 6px', fontSize: '12px' }}
                                                                            >
                                                                                ❌
                                                                            </button>
                                                                        )}
                                                                        {isItemCancelled && (
                                                                            <button
                                                                                className="btn-icon-secondary btn-sm"
                                                                                onClick={() => handleUncancelItem(sale.id, item.id)}
                                                                                title="Restore Item"
                                                                                style={{ padding: '2px 6px', fontSize: '12px' }}
                                                                            >
                                                                                ↩️
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>

                                                    <div className="receipt-summary">
                                                        <div className="summary-row">
                                                            <span>{t('posHistory.subtotal')}</span>
                                                            <span>{formatCurrency(sale.totalAmount)}</span>
                                                        </div>
                                                        <div className="summary-row total">
                                                            <span>{t('posHistory.total')}</span>
                                                            <span style={{ textDecoration: sale.status === 'cancelled' ? 'line-through' : 'none', color: sale.status === 'cancelled' ? '#ef4444' : 'inherit' }}>
                                                                {formatCurrency(sale.totalAmount)}
                                                            </span>
                                                        </div>
                                                        {sale.status !== 'cancelled' ? (
                                                            <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                                                                <button
                                                                    className="btn btn-danger btn-sm"
                                                                    onClick={() => {
                                                                        if (confirm('Are you sure you want to cancel this entire order?')) {
                                                                            handleCancelSale(sale.id);
                                                                        }
                                                                    }}
                                                                >
                                                                    🚫 Cancel Entire Order
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                                                                <button
                                                                    className="btn btn-secondary btn-sm"
                                                                    onClick={() => handleUncancelSale(sale.id)}
                                                                >
                                                                    ↩️ Restore Order
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </Fragment>
                            ))
                        )}
                    </tbody>
                    <tfoot>
                        <tr className="bg-gray-50 border-t-2 border-gray-200">
                            <td colSpan="3" className="p-4 text-right font-bold text-gray-700">{t('posHistory.totalSales')}</td>
                            <td className="p-4 text-right font-bold text-xl text-green-600">
                                {formatCurrency(sales.reduce((sum, sale) => {
                                    if (sale.status === 'cancelled') return sum;
                                    return sum + Number(sale.totalAmount);
                                }, 0))}
                            </td>
                            <td></td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
};

export default POSHistory;
