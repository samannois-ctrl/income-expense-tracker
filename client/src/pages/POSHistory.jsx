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
                                                        <div className="status-badge status-completed mt-sm">{t('posHistory.completed')}</div>
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
                                                            <span>{t('posHistory.subtotal')}</span>
                                                            <span>{formatCurrency(sale.totalAmount)}</span>
                                                        </div>
                                                        <div className="summary-row total">
                                                            <span>{t('posHistory.total')}</span>
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
                            <td colSpan="3" className="p-4 text-right font-bold text-gray-700">{t('posHistory.totalSales')}</td>
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
