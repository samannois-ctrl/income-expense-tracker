import { useState, useEffect } from 'react';
import { useSettings } from '../context/SettingsContext';

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

    return (
        <div className="p-4" style={{ fontFamily: 'Inter, sans-serif' }}>
            <h1 className="text-2xl font-bold mb-6">Sales History</h1>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="p-4 text-left font-semibold text-gray-600">Time</th>
                            <th className="p-4 text-left font-semibold text-gray-600">Sale #</th>
                            <th className="p-4 text-left font-semibold text-gray-600">Items</th>
                            <th className="p-4 text-right font-semibold text-gray-600">Total</th>
                            <th className="p-4 text-center font-semibold text-gray-600">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sales.map(sale => (
                            <>
                                <tr key={sale.id} className="border-b border-gray-100 hover:bg-gray-50">
                                    <td className="p-4 text-gray-600">
                                        {new Date(sale.saleDate).toLocaleString()}
                                    </td>
                                    <td className="p-4 font-mono text-sm text-gray-500">
                                        {sale.paper_order_ref}
                                    </td>
                                    <td className="p-4">
                                        {sale.itemsCount}
                                    </td>
                                    <td className="p-4 text-right font-bold text-gray-900">
                                        {Number(sale.totalAmount).toLocaleString()} ฿
                                    </td>
                                    <td className="p-4 text-center">
                                        <button
                                            className="btn btn-sm"
                                            onClick={() => toggleDetails(sale.id)}
                                            style={{ border: '1px solid #ddd', padding: '4px 12px', borderRadius: '6px' }}
                                        >
                                            {expandedSale === sale.id ? 'Hide' : 'View'}
                                        </button>
                                    </td>
                                </tr>
                                {expandedSale === sale.id && (
                                    <tr className="bg-blue-50">
                                        <td colSpan="5" className="p-4">
                                            <div className="bg-white rounded-lg border border-blue-100 p-4">
                                                <h4 className="font-bold mb-2 text-gray-700">Order Details</h4>
                                                <ul className="space-y-2">
                                                    {saleDetails.map(item => (
                                                        <li key={item.id} className="flex justify-between items-start border-b border-gray-100 pb-2 last:border-0">
                                                            <div>
                                                                <div className="font-semibold text-gray-800">{item.itemName}</div>
                                                                {item.options_json && (
                                                                    <div className="text-sm text-gray-500">
                                                                        {JSON.parse(item.options_json).map(o => o.name).join(', ')}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="text-right">
                                                                <div className="font-bold">{item.total_price} ฿</div>
                                                                <div className="text-xs text-gray-500">Qty: {item.quantity}</div>
                                                            </div>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default POSHistory;
