import { useState, useEffect, Fragment } from 'react';
import { useSettings } from '../context/SettingsContext';
import './POSHistory.css';

const API_URL = 'http://localhost:3001/api';

const POSHistory = () => {
    const { t } = useSettings();
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

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('th-TH', {
            style: 'currency',
            currency: 'THB',
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }).format(amount);
    };

    const formatDate = (dateString) => { // Use simple replacement if date-fns not available, or just toLocaleString
        const date = new Date(dateString);
        return date.toLocaleString('th-TH', {
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
                <div className="text-muted">Loading history...</div>
            </div>
        );
    }

    return (
        <div className="main-content">
            <div className="page-header">
                <h1 className="page-title">Sales History</h1>
                <div className="page-subtitle">View and manage your point of sale transactions</div>
            </div>

            <div className="table-container">
                <table className="table">
                    <thead>
                        <tr>
                            <th style={{ width: '20%' }}>Time</th>
                            <th style={{ width: '25%' }}>Sale #</th>
                            <th style={{ width: '15%' }} className="text-center">Items</th>
                            <th style={{ width: '20%' }} className="text-right">Total</th>
                            <th style={{ width: '20%' }} className="text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sales.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="empty-state">
                                    <div className="empty-state-icon">🧾</div>
                                    <div>No sales history found</div>
                                </td>
                            </tr>
                        ) : (
                            sales.map(sale => (
                                <Fragment key={sale.id}>
                                    <tr className={expandedSale === sale.id ? 'bg-active' : ''}>
                                        <td className="text-muted">
                                            {formatDate(sale.saleDate)}
                                        </td>
                                        <td>
                                            <span className="font-mono text-sm">{sale.paper_order_ref || '-'}</span>
                                        </td>
                                        <td className="text-center">
                                            <span className="badge badge-secondary">{sale.itemsCount}</span>
                                        </td>
                                        <td className="text-right font-bold">
                                            {formatCurrency(sale.totalAmount)}
                                        </td>
                                        <td className="text-center">
                                            <div className="action-btn-group">
                                                <button
                                                    className={`btn btn-sm ${expandedSale === sale.id ? 'btn-primary' : 'btn-secondary'}`}
                                                    onClick={() => toggleDetails(sale.id)}
                                                >
                                                    {expandedSale === sale.id ? 'Hide' : 'View Details'}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                    {expandedSale === sale.id && (
                                        <tr className="history-expanded-row">
                                            <td colSpan="5">
                                                <div className="order-details-card">
                                                    <div className="order-receipt-header">
                                                        <div className="receipt-title">Order Receipt</div>
                                                        <div className="receipt-id">#{sale.paper_order_ref || sale.id}</div>
                                                        <div className="status-badge status-completed mt-sm">Completed</div>
                                                    </div>

                                                    <div className="order-items-list">
                                                        {saleDetails.map((item, index) => {
                                                            const options = item.options_json ? JSON.parse(item.options_json) : [];
                                                            return (
                                                                <div key={item.id || index} className="order-item">
                                                                    <div className="item-info">
                                                                        <div className="item-name">{item.itemName}</div>
                                                                        {options.length > 0 && (
                                                                            <div className="item-options">
                                                                                {options.map(o => o.name).join(', ')}
                                                                            </div>
                                                                        )}
                                                                        <span className="item-qty">x{item.quantity}</span>
                                                                    </div>
                                                                    <div className="item-price">
                                                                        {formatCurrency(item.total_price)}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>

                                                    <div className="receipt-summary">
                                                        <div className="summary-row">
                                                            <span>Subtotal</span>
                                                            <span>{formatCurrency(sale.totalAmount)}</span>
                                                        </div>
                                                        <div className="summary-row total">
                                                            <span>Total</span>
                                                            <span>{formatCurrency(sale.totalAmount)}</span>
                                                        </div>
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
                            <td colSpan="3" className="p-4 text-right font-bold text-gray-700">Total Sales:</td>
                            <td className="p-4 text-right font-bold text-xl text-green-600">
                                {formatCurrency(sales.reduce((sum, sale) => sum + Number(sale.totalAmount), 0))}
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
