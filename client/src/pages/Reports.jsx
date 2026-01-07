import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { API_URL } from '../config/api.js';
import Chart from 'chart.js/auto';
import ThaiDatePicker from '../components/ThaiDatePicker';
import { useSettings } from '../context/SettingsContext';

const Reports = () => {
    const { t } = useSettings();
    const [monthlyData, setMonthlyData] = useState([]);
    const [dailyData, setDailyData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [viewMode, setViewMode] = useState('monthly'); // 'monthly' or 'daily'

    // Date Range State
    const [dateRange, setDateRange] = useState(() => {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        const formatDate = (date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        return {
            startDate: formatDate(startOfMonth),
            endDate: formatDate(endOfMonth)
        };
    });

    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('all');

    const chartRef = useRef(null);
    const chartInstance = useRef(null);

    useEffect(() => {
        fetchCategories();
    }, []);

    useEffect(() => {
        if (viewMode === 'monthly') {
            fetchMonthlyData();
        } else {
            fetchDailyData(dateRange.startDate, dateRange.endDate, selectedCategory);
        }
    }, [viewMode, dateRange, selectedCategory]);

    useEffect(() => {
        // Destroy existing chart if it exists
        if (chartInstance.current) {
            chartInstance.current.destroy();
        }

        // Don't create chart if no data or ref missing
        if (!chartRef.current || (viewMode === 'monthly' && monthlyData.length === 0) || (viewMode === 'daily' && dailyData.length === 0)) {
            return;
        }

        const ctx = chartRef.current.getContext('2d');

        const commonOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top' },
                title: { display: false }
            }
        };

        if (viewMode === 'monthly') {
            chartInstance.current = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: monthlyData.map(d => d.name),
                    datasets: [
                        {
                            label: 'Income',
                            data: monthlyData.map(d => d.income),
                            backgroundColor: 'rgba(16, 185, 129, 0.7)',
                            borderColor: 'rgba(16, 185, 129, 1)',
                            borderWidth: 1,
                        },
                        {
                            label: 'Expense',
                            data: monthlyData.map(d => d.expense),
                            backgroundColor: 'rgba(239, 68, 68, 0.7)',
                            borderColor: 'rgba(239, 68, 68, 1)',
                            borderWidth: 1,
                        },
                    ],
                },
                options: commonOptions
            });
        } else {
            // Daily View - Vertical
            chartInstance.current = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: dailyData.map(d => d.name), // Uses formatted date label from backend
                    datasets: [
                        {
                            label: 'Income',
                            data: dailyData.map(d => d.income),
                            backgroundColor: 'rgba(16, 185, 129, 0.7)',
                            borderColor: 'rgba(16, 185, 129, 1)',
                            borderWidth: 1,
                        },
                        {
                            label: 'Expense',
                            data: dailyData.map(d => d.expense),
                            backgroundColor: 'rgba(239, 68, 68, 0.7)',
                            borderColor: 'rgba(239, 68, 68, 1)',
                            borderWidth: 1,
                        },
                    ],
                },
                options: {
                    ...commonOptions,
                    scales: {
                        x: {
                            title: { display: true, text: 'Date' }
                        },
                        y: {
                            beginAtZero: true,
                            title: { display: true, text: 'Amount (THB)' }
                        }
                    }
                }
            });
        }

        // Cleanup on unmount
        return () => {
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }
        };

    }, [monthlyData, dailyData, viewMode]);

    const fetchCategories = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/categories`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCategories(res.data);
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const fetchMonthlyData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/reports/monthly`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMonthlyData(res.data);
        } catch (error) {
            console.error('Error fetching monthly reports:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchDailyData = async (start, end, category) => {
        if (!start || !end) return;
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            let url = `${API_URL}/reports/daily?startDate=${start}&endDate=${end}`;
            if (category && category !== 'all') {
                url += `&category=${encodeURIComponent(category)}`;
            }

            const res = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setDailyData(res.data);
        } catch (error) {
            console.error('Error fetching daily reports:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCategoryChange = (e) => {
        setSelectedCategory(e.target.value);
    };

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">{t('reports.title')}</h1>
                    <p className="page-subtitle">{t('reports.subtitle')}</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    {viewMode === 'daily' && (
                        <>
                            <select
                                className="form-input"
                                value={selectedCategory}
                                onChange={handleCategoryChange}
                                style={{ width: 'auto' }}
                            >
                                <option value="all">{t('reports.allCategories')}</option>
                                <optgroup label={t('categories.incomeCategories')}>
                                    <option value="POS Sales">POS</option>
                                    {categories.filter(c => c.type === 'income' && c.name !== 'POS Sales').map(cat => (
                                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                                    ))}
                                </optgroup>
                                <optgroup label={t('categories.expenseCategories')}>
                                    {categories.filter(c => c.type === 'expense').map(cat => (
                                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                                    ))}
                                </optgroup>
                            </select>

                            <div className="date-filter" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingTop: '25px' }}>
                                <ThaiDatePicker
                                    selected={dateRange.startDate}
                                    onChange={(date) => setDateRange(prev => ({ ...prev, startDate: date }))}
                                    placeholder={t('reports.startDate')}
                                />
                                <span className="text-muted">-</span>
                                <ThaiDatePicker
                                    selected={dateRange.endDate}
                                    onChange={(date) => setDateRange(prev => ({ ...prev, endDate: date }))}
                                    placeholder={t('reports.endDate')}
                                />
                            </div>
                        </>
                    )}
                    <div className="tabs" style={{ margin: 0 }}>
                        <button
                            className={`tab ${viewMode === 'monthly' ? 'active' : ''}`}
                            onClick={() => setViewMode('monthly')}
                        >
                            {t('reports.monthlyOverview')}
                        </button>
                        <button
                            className={`tab ${viewMode === 'daily' ? 'active' : ''}`}
                            onClick={() => setViewMode('daily')}
                        >
                            {t('reports.dailyBreakdown')}
                        </button>
                    </div>
                </div>
            </div>

            <div className="card" style={{ height: '600px', display: 'flex', flexDirection: 'column' }}>
                <div className="card-header">
                    <span className="card-title">
                        {viewMode === 'monthly' ? t('reports.monthlyComparison') : t('reports.dailyBreakdownTitle', { startDate: dateRange.startDate, endDate: dateRange.endDate })}
                    </span>
                </div>
                <div style={{ flex: 1, padding: '1rem', position: 'relative' }}>
                    {loading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                            {t('common.loading')}
                        </div>
                    ) : (viewMode === 'monthly' ? monthlyData : dailyData).length === 0 ? (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--color-text-secondary)' }}>
                            {t('reports.noData')}
                        </div>
                    ) : (
                        <canvas ref={chartRef}></canvas>
                    )}
                </div>
                <div style={{ padding: '0 1.5rem 1.5rem', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
                    {viewMode === 'monthly'
                        ? t('reports.comparingMonthly')
                        : t('reports.showingDaily', { category: selectedCategory === 'all' ? t('reports.allCategories') : selectedCategory })}
                </div>
            </div>
        </div>
    );
};

export default Reports;
