import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';
import './POSEntry.css';

import { API_URL } from '../config/api';

const POSEntry = () => {
    const { t } = useSettings();

    // Master Data
    const [categories, setCategories] = useState([]);
    const [menus, setMenus] = useState([]);
    const [optionGroups, setOptionGroups] = useState([]);
    const [options, setOptions] = useState([]);
    const [configs, setConfigs] = useState([]);

    // Tables & Order Type
    // Tables & Order Type
    const location = useLocation();
    const isQuickSaleMode = location.pathname === '/sales-record';

    // Tables & Order Type
    const [tables, setTables] = useState([]);
    const [selectedTable, setSelectedTable] = useState(null); // Table ID
    const [orderType, setOrderType] = useState('dine_in'); // 'dine_in' | 'take_away' | 'quick_sale'

    // Initialize/Reset Mode based on URL
    useEffect(() => {
        if (isQuickSaleMode) {
            setOrderType('quick_sale');
            setSelectedTable(null);
            setSelectedSaleId(null);
            setIsNewTakeAwayMode(false);
            setExistingItems([]);
            setExistingTotal(0);
        } else {
            setOrderType('dine_in'); // Default back to dine_in when leaving
        }
    }, [isQuickSaleMode]);

    // Take Away State
    const [activeTakeaways, setActiveTakeaways] = useState([]);
    const [selectedSaleId, setSelectedSaleId] = useState(null); // For appending to existing Take Away
    const [isNewTakeAwayMode, setIsNewTakeAwayMode] = useState(false);
    const [customerDetails, setCustomerDetails] = useState({ name: '', phone: '' });
    const [showNewOrderModal, setShowNewOrderModal] = useState(false);

    // Selection State
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedMenu, setSelectedMenu] = useState(null); // When set, Modal opens

    // The "Building" Order Item
    const [currentSelections, setCurrentSelections] = useState({});

    // Cart (New Items to be sent - Per Table or Sale)
    const [cartsByTable, setCartsByTable] = useState({});

    // Derive current cart based on selection
    let currentCartKey = 'none';
    if (orderType === 'dine_in' && selectedTable) {
        currentCartKey = `table-${selectedTable}`;
    } else if (orderType === 'take_away') {
        if (selectedSaleId) currentCartKey = `sale-${selectedSaleId}`; // Existing Order
        else if (isNewTakeAwayMode) currentCartKey = `take-away-new`;   // New Order
    } else if (orderType === 'quick_sale') {
        currentCartKey = 'quick-sale-cart';
    }

    const cart = (currentCartKey !== 'none' && cartsByTable[currentCartKey]) ? cartsByTable[currentCartKey] : [];

    const updateCurrentCart = (newCartOrFunc) => {
        if (currentCartKey === 'none') return;

        setCartsByTable(prev => {
            const current = prev[currentCartKey] || [];
            const newVal = typeof newCartOrFunc === 'function' ? newCartOrFunc(current) : newCartOrFunc;
            return { ...prev, [currentCartKey]: newVal };
        });
    };

    // Existing Session Data (for display)
    const [existingItems, setExistingItems] = useState([]);
    const [existingTotal, setExistingTotal] = useState(0);
    const [lastOrderSaleId, setLastOrderSaleId] = useState(null); // To track Take Away orders

    const [isProcessing, setIsProcessing] = useState(false);

    // ... (keep fetchTables) ...

    // ...

    const fetchTables = async () => {
        const token = localStorage.getItem('token');
        try {
            const resTables = await fetch(`${API_URL}/pos/tables`, { headers: { 'Authorization': `Bearer ${token}` } });
            const jsonTables = await resTables.json();
            setTables(jsonTables.data || []);
        } catch (e) {
            console.error("Error fetching tables", e);
        }
    };

    const fetchActiveTakeaways = async () => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_URL}/pos/active-takeaway`, { headers: { 'Authorization': `Bearer ${token}` } });
            const json = await res.json();
            setActiveTakeaways(json.data || []);
        } catch (e) {
            console.error("Error fetching active takeaways", e);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            const token = localStorage.getItem('token');
            const headers = { 'Authorization': `Bearer ${token}` };

            // Fetch POS Data
            const resPos = await fetch(`${API_URL}/menu/pos-data`, { headers });
            const jsonPos = await resPos.json();

            setCategories(jsonPos.categories || []);
            setMenus(jsonPos.menus || []);
            setOptionGroups(jsonPos.optionGroups || []);
            setOptions(jsonPos.options || []);
            setConfigs(jsonPos.configs || []);
            if (jsonPos.categories?.length > 0) setSelectedCategory(jsonPos.categories[0]);

            await fetchTables();
        };
        fetchData();
    }, []);

    // When Table Selected, fetch active session items if any
    // When mode changes, refresh data
    useEffect(() => {
        if (orderType === 'dine_in') {
            fetchTables();
            setSelectedSaleId(null);
            setIsNewTakeAwayMode(false);
        } else {
            fetchActiveTakeaways();
            setSelectedTable(null);
        }
    }, [orderType]);

    // When Selection Changes (Table or Sale), fetch details
    useEffect(() => {
        // Dine In Logic
        if (orderType === 'dine_in') {
            if (!selectedTable) {
                setExistingItems([]);
                setExistingTotal(0);
                return;
            }
            const activeTable = tables.find(t => t.id === selectedTable);
            if (activeTable && activeTable.current_sale_id) {
                fetchSaleDetails(activeTable.current_sale_id);
            } else {
                setExistingItems([]);
                setExistingTotal(0);
            }
        }
        // Take Away Logic
        else if (orderType === 'take_away') {
            if (selectedSaleId) {
                fetchSaleDetails(selectedSaleId);
            } else {
                setExistingItems([]);
                setExistingTotal(0);
                // If New Mode, we start empty (handled by cart)
            }
        }
        // Quick Sale Logic
        else if (orderType === 'quick_sale') {
            // Started empty, waiting for cart items
        }
    }, [selectedTable, tables, orderType, selectedSaleId]);

    const fetchSaleDetails = async (saleId) => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_URL}/pos/sales/${saleId}`, { headers: { 'Authorization': `Bearer ${token}` } });
            const json = await res.json();
            if (json.items) {
                setExistingItems(json.items);
                setExistingTotal(json.sale.totalAmount);
            }
        } catch (e) {
            console.error("Error fetching sale details", e);
        }
    };

    // Helper: Filtered Lists
    const currentMenus = selectedCategory ? menus.filter(m => m.category_id === selectedCategory.id) : [];

    const activeGroups = selectedMenu ? configs
        .filter(c => c.menu_id === selectedMenu.id)
        .sort((a, b) => a.display_order - b.display_order)
        .map(c => optionGroups.find(og => og.id === c.option_group_id))
        .filter(Boolean)
        : [];

    // --- Logic ---

    const [isTakeAway, setIsTakeAway] = useState(false);

    const handleMenuClick = (menu) => {
        setSelectedMenu(menu);
        setIsTakeAway(orderType === 'take_away'); // Auto set takeaway if valid

        // --- Smart Defaults ---
        const newSelections = {};
        const menuConfigs = configs
            .filter(c => c.menu_id === menu.id)
            .sort((a, b) => a.display_order - b.display_order)
            .map(c => optionGroups.find(og => og.id === c.option_group_id))
            .filter(Boolean);

        menuConfigs.forEach(group => {
            const groupOptions = options.filter(o => o.group_id === group.id);
            const defaultOption = groupOptions.find(o => o.name.includes('เล็ก') || o.name.includes('ธรรมดา'));

            if (defaultOption) {
                if (group.selection_type === 'multiple') {
                    newSelections[group.id] = { [defaultOption.id]: true };
                } else {
                    newSelections[group.id] = defaultOption.id;
                }
            }
        });
        setCurrentSelections(newSelections);
    };

    const toggleTakeAway = () => {
        const newState = !isTakeAway;
        setIsTakeAway(newState);

        if (newState) {
            activeGroups.forEach(group => {
                const groupOptions = options.filter(o => o.group_id === group.id);
                const separateSoupOpt = groupOptions.find(o => o.name.includes('แยกน้ำ'));
                if (separateSoupOpt) {
                    setCurrentSelections(prev => {
                        if (group.selection_type === 'multiple') {
                            return { ...prev, [group.id]: { ...(prev[group.id] || {}), [separateSoupOpt.id]: true } };
                        } else {
                            return { ...prev, [group.id]: separateSoupOpt.id };
                        }
                    });
                }
            });
        }
    };

    const handleSelectOption = (groupId, optionId, type) => {
        setCurrentSelections(prev => {
            if (type === 'multiple') {
                const groupState = prev[groupId] || {};
                return { ...prev, [groupId]: { ...groupState, [optionId]: !groupState[optionId] } };
            } else {
                return { ...prev, [groupId]: optionId };
            }
        });
    };

    const calculateCurrentPrice = () => {
        if (!selectedMenu) return 0;
        let total = Number(selectedMenu.base_price);
        activeGroups.forEach(group => {
            const selection = currentSelections[group.id];
            if (!selection) return;
            if (group.selection_type === 'multiple') {
                Object.keys(selection).forEach(optId => {
                    if (selection[optId]) {
                        const opt = options.find(o => o.id === Number(optId));
                        if (opt) total += Number(opt.price_adjustment);
                    }
                });
            } else {
                const opt = options.find(o => o.id === selection);
                if (opt) total += Number(opt.price_adjustment);
            }
        });
        return total;
    };

    const addToCart = () => {
        if (!selectedMenu) return;
        if (currentCartKey === 'none') {
            if (orderType !== 'quick_sale') {
                alert(t('pos.selectTableAlert'));
                return;
            }
            // Should be covered by logic above, but fallback
            currentCartKey = 'quick-sale-cart';
        }

        const selectedOptNames = [];
        const rawOptions = [];

        if (isTakeAway) selectedOptNames.push(t('pos.takeAwayItem'));

        activeGroups.forEach(group => {
            const selection = currentSelections[group.id];
            if (!selection) return;

            if (group.selection_type === 'multiple') {
                Object.keys(selection).forEach(optId => {
                    if (selection[optId]) {
                        const opt = options.find(o => o.id === Number(optId));
                        if (opt) {
                            selectedOptNames.push(opt.name);
                            rawOptions.push({ groupId: group.id, optionId: opt.id, name: opt.name, price: opt.price_adjustment });
                        }
                    }
                });
            } else {
                const opt = options.find(o => o.id === selection);
                if (opt) {
                    selectedOptNames.push(opt.name);
                    rawOptions.push({ groupId: group.id, optionId: opt.id, name: opt.name, price: opt.price_adjustment });
                }
            }
        });

        const newItemSignature = JSON.stringify({
            m: selectedMenu.id,
            o: rawOptions.sort((a, b) => a.optionId - b.optionId).map(o => o.optionId),
            t: isTakeAway
        });

        const existingItemIndex = cart.findIndex(item => {
            const existingSignature = JSON.stringify({
                m: item.menu_id,
                o: item.selectedOptions.sort((a, b) => a.optionId - b.optionId).map(o => o.optionId),
                t: item.isTakeAway || false
            });
            return existingSignature === newItemSignature;
        });

        if (existingItemIndex > -1) {
            const newCart = [...cart];
            newCart[existingItemIndex].quantity += 1;
            updateCurrentCart(newCart);
        } else {
            const item = {
                id: Date.now(),
                menu_id: selectedMenu.id,
                itemName: `${selectedMenu.name} ${selectedOptNames.length > 0 ? '(' + selectedOptNames.join(', ') + ')' : ''}`,
                base_price: selectedMenu.base_price,
                unit_price: calculateCurrentPrice(),
                quantity: 1,
                selectedOptions: rawOptions,
                isTakeAway: isTakeAway
            };
            updateCurrentCart([...cart, item]);
        }
        setSelectedMenu(null);
    };

    const updateQuantity = (itemId, delta) => {
        updateCurrentCart(prev => prev.map(item => {
            if (item.id === itemId) {
                const newQ = item.quantity + delta;
                return newQ > 0 ? { ...item, quantity: newQ } : item;
            }
            return item;
        }));
    };

    const setQuantityMultiplier = (itemId, factor) => {
        updateCurrentCart(prev => prev.map(item => {
            if (item.id === itemId) {
                return { ...item, quantity: item.quantity * factor };
            }
            return item;
        }));
    };

    const removeFromCart = (itemId) => {
        updateCurrentCart(prev => prev.filter(item => item.id !== itemId));
    };

    const handleAddTable = async () => {
        const name = prompt(t('pos.enterTableName'));
        if (!name) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/pos/tables`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ name })
            });
            const json = await res.json();
            if (json.success) {
                fetchTables();
            } else {
                alert(json.error || "Failed to add table");
            }
        } catch (e) {
            console.error(e);
            alert("Failed to add table: " + e.message);
        }
    };

    // --- Take Away Handlers ---

    const handleNewTakeAway = () => {
        setCustomerDetails({ name: '', phone: '' });
        setShowNewOrderModal(true);
    };

    const confirmNewTakeAway = () => {
        if (!customerDetails.name) {
            alert(t('pos.customerNameRequired'));
            return;
        }
        setShowNewOrderModal(false);
        setIsNewTakeAwayMode(true);
        setSelectedSaleId(null);
        setSelectedTable(null);
        setExistingItems([]);
        setExistingTotal(0);
    };

    const handleSelectTakeAway = (sale) => {
        setIsNewTakeAwayMode(false);
        setSelectedSaleId(sale.id);
        setCustomerDetails({ name: sale.customerName, phone: sale.notes || '' });
    };

    const handleBackToTakeAwayList = () => {
        setIsNewTakeAwayMode(false);
        setSelectedSaleId(null);
        setCustomerDetails({ name: '', phone: '' });
        fetchActiveTakeaways();
    };

    // --- Action Handlers ---

    // 1. Send Order (Create/Append Session)
    const sendOrder = async () => {
        if (cart.length === 0) return;
        setIsProcessing(true);
        try {
            const token = localStorage.getItem('token');
            const itemsWithTotal = cart.map(i => ({
                ...i,
                // Ensure we pass both unit_price and total_price (line total)
                total_price: i.unit_price * i.quantity
            }));

            const res = await fetch(`${API_URL}/pos/sales`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    items: itemsWithTotal,
                    tableId: selectedTable,
                    orderType: orderType,
                    // Take Away Fields
                    customerName: customerDetails.name,
                    notes: customerDetails.phone, // Using notes field for phone
                    saleId: selectedSaleId // If appending
                })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to submit order');
            }

            // Success
            alert(t('pos.orderSent'));
            updateCurrentCart([]); // Clear cart for CURRENT TABLE/MODE

            if (orderType === 'dine_in') {
                await fetchTables(); // Refresh table status
            } else {
                await fetchActiveTakeaways(); // Refresh list
                setIsNewTakeAwayMode(false); // Exit new mode
                // If it was new, we might want to auto-select the created one?
                // For simplicity, return to list or stay on the same sale?
                // Data returns saleId.
                if (data.saleId) setSelectedSaleId(data.saleId);
            }

            // Re-fetch existing items to show them in "Previous Orders"
            if (data.saleId) {
                setLastOrderSaleId(data.saleId); // Track for Payment (especially Take Away)
                fetchSaleDetails(data.saleId);
            }

        } catch (error) {
            console.error('Error submitting order', error);
            alert(error.message || 'Failed to submit order');
        } finally {
            setIsProcessing(false);
        }
    };

    // Quick Sale: Save = Create Sale + Immediate Pay (Exact Amount)
    const handleQuickSave = async () => {
        if (cart.length === 0) {
            alert(t('pos.alertEmptyOrder'));
            return;
        }

        setIsProcessing(true);
        try {
            const token = localStorage.getItem('token');
            const itemsWithTotal = cart.map(i => ({
                ...i,
                total_price: i.unit_price * i.quantity
            }));

            // Calculate Total explicitly
            const totalAmount = itemsWithTotal.reduce((sum, i) => sum + i.total_price, 0);

            // 1. Create Sale (Quick Sale type)
            const res = await fetch(`${API_URL}/pos/sales`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    items: itemsWithTotal,
                    orderType: 'quick_sale',
                    customerName: 'Quick Sale',
                    paymentMethod: 'cash'
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to create sale');

            // 2. Immediate Payment with Exact Amount
            const payRes = await fetch(`${API_URL}/pos/sales/${data.saleId}/pay`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    paymentMethod: 'cash',
                    cashReceived: totalAmount // Exact amount always
                })
            });

            if (!payRes.ok) throw new Error('Payment failed');

            // 3. Cleanup & Reset
            // No alert needed per request for speed, just reset.
            updateCurrentCart([]);
            setSelectedSaleId(null);
            setLastOrderSaleId(null);
            setExistingItems([]);
            setExistingTotal(0);

        } catch (error) {
            console.error('Error in Quick Save', error);
            alert(error.message);
        } finally {
            setIsProcessing(false);
        }
    };

    // 2. Check Bill (Fetch Total logic handled in UI, just open modal)
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [cashReceived, setCashReceived] = useState('');

    // Calculate final grand total (Existing + Cart)
    // Actually, "Check Bill" usually assumes all orders are sent.
    // If cart has items, we should warn? Or auto-send?
    // Let's assume user must "Send Order" first.
    // Or we include cart in calculation but don't save?
    // User Guide: "Send Order" then "Check Bill".

    const grandTotal = existingTotal; // Only paid for what's in DB
    const change = cashReceived ? Number(cashReceived) - grandTotal : 0;

    const handleCheckBill = () => {
        if (cart.length > 0) {
            if (!confirm(t('pos.discardCartConfirm'))) return;
        }
        setShowPaymentModal(true);
    };

    const confirmPayment = async () => {
        setIsProcessing(true);
        try {
            const token = localStorage.getItem('token');
            const activeTable = tables.find(t => t.id === selectedTable);
            // Use table's sale ID OR the specifically selected Sale ID (Take Away)
            const saleIdToPay = activeTable?.current_sale_id || selectedSaleId;

            if (!saleIdToPay) {
                alert(t('pos.noActiveOrder'));
                return;
            }

            const res = await fetch(`${API_URL}/pos/sales/${saleIdToPay}/pay`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    paymentMethod: 'cash',
                    cashReceived: cashReceived
                })
            });

            if (!res.ok) throw new Error('Payment failed');

            alert(t('pos.paymentSuccess'));
            setShowPaymentModal(false);
            setCashReceived('');
            setLastOrderSaleId(null); // Clear tracked ID
            setExistingItems([]); // Clear display
            setExistingTotal(0);

            if (orderType === 'dine_in') {
                await fetchTables();
            } else {
                setSelectedSaleId(null);
                await fetchActiveTakeaways();
            }
        } catch (e) {
            console.error(e);
            alert("Payment Error");
        } finally {
            setIsProcessing(false);
        }

        // Clean up specific for Quick Sale
        if (orderType === 'quick_sale') {
            setSelectedSaleId(null);
            setLastOrderSaleId(null);
            setExistingItems([]);
            setExistingTotal(0);
            updateCurrentCart([]); // Ensure empty
        }
    };

    const handleClearTable = async () => {
        if (!confirm(t('pos.clearTableConfirm'))) return;
        try {
            const token = localStorage.getItem('token');
            await fetch(`${API_URL}/pos/tables/${selectedTable}/clear`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setSelectedTable(null);
            fetchTables();
        } catch (e) {
            alert("Error clearing table");
        }
    };

    // Move Table Logic
    const [showMoveModal, setShowMoveModal] = useState(false);
    const [targetTableId, setTargetTableId] = useState('');

    const handleMoveTable = async () => {
        if (!targetTableId) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/pos/tables/${selectedTable}/move`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ targetTableId })
            });
            const data = await res.json();
            if (data.success) {
                alert(t('pos.tableMoved'));
                setShowMoveModal(false);
                setTargetTableId('');
                setSelectedTable(Number(targetTableId)); // Switch view to new table
                fetchTables();
            } else {
                alert(data.error || "Failed to move table");
            }
        } catch (e) {
            console.error(e);
            alert("Error moving table");
        }
    };



    // UI Helpers
    const getTableColor = (table) => {
        if (table.id === selectedTable) return '#eff6ff'; // Selected (Light Blue)
        if (table.status === 'occupied') return '#fee2e2'; // Occupied (Light Red)
        if (table.status === 'paid') return '#fef3c7'; // Paid/Billing (Light Amber)
        return 'white'; // Available
    };

    const getTableBorder = (table) => {
        if (table.id === selectedTable) return '2px solid #2563eb';
        if (table.status === 'occupied') return '2px solid #ef4444';
        if (table.status === 'paid') return '2px solid #d97706';
        return '1px solid #d1d5db';
    };

    const currentTableStatus = tables.find(t => t.id === selectedTable)?.status || 'available';

    return (
        <div className="pos-container">
            {/* LEFT: Menu Selection */}
            <div className="pos-left-panel">

                {/* TOP BAR: Service Type */}
                <div style={{ marginBottom: '1rem', backgroundColor: 'white', padding: '1rem', borderRadius: '16px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <span style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#374151' }}>Order Type:</span>
                        {isQuickSaleMode ? (
                            <div style={{ padding: '0.5rem 1.5rem', borderRadius: '10px', backgroundColor: '#e0f2fe', color: '#0369a1', fontWeight: 'bold', border: '1px solid #bae6fd', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                ⚡ {t('pos.quickSale')}
                            </div>
                        ) : (
                            <div style={{ display: 'flex', backgroundColor: '#f3f4f6', borderRadius: '12px', padding: '4px' }}>
                                <button
                                    onClick={() => { setOrderType('dine_in'); }}
                                    style={{
                                        padding: '0.5rem 1.5rem', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 'bold',
                                        backgroundColor: orderType === 'dine_in' ? 'white' : 'transparent',
                                        color: orderType === 'dine_in' ? '#2563eb' : '#6b7280',
                                        boxShadow: orderType === 'dine_in' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    🍽️ {t('pos.dineIn')}
                                </button>
                                <button
                                    onClick={() => { setOrderType('take_away'); setSelectedTable(null); }}
                                    style={{
                                        padding: '0.5rem 1.5rem', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 'bold',
                                        backgroundColor: orderType === 'take_away' ? 'white' : 'transparent',
                                        color: orderType === 'take_away' ? '#d97706' : '#6b7280',
                                        boxShadow: orderType === 'take_away' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    🥡 {t('pos.takeaway')}
                                </button>
                                <button
                                    onClick={() => {
                                        setOrderType('quick_sale');
                                        setSelectedTable(null);
                                        setSelectedSaleId(null);
                                        setExistingItems([]);
                                        setExistingTotal(0);
                                    }}
                                    style={{
                                        padding: '0.5rem 1.5rem', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 'bold',
                                        backgroundColor: orderType === 'quick_sale' ? 'white' : 'transparent',
                                        color: orderType === 'quick_sale' ? '#0369a1' : '#6b7280',
                                        boxShadow: orderType === 'quick_sale' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                                        transition: 'all 0.2s',
                                        display: 'flex', alignItems: 'center', gap: '0.25rem'
                                    }}
                                >
                                    ⚡ {t('pos.quickSale')}
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* TABLE SECTION (Start New Row) */}
                {orderType === 'dine_in' && (
                    <div style={{ marginBottom: '1.5rem', backgroundColor: 'white', padding: '1rem', borderRadius: '16px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <span style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#374151' }}>Select Table:</span>
                            <button
                                onClick={handleAddTable}
                                style={{
                                    padding: '0.5rem 1rem', borderRadius: '8px', border: '1px dashed #9ca3af', backgroundColor: 'white',
                                    display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: '#6b7280', transition: 'all 0.2s'
                                }}
                            >
                                + {t('pos.addTable')}
                            </button>
                        </div>

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
                            gap: '0.8rem'
                        }}>
                            {tables.map(table => (
                                <button
                                    key={table.id}
                                    onClick={() => setSelectedTable(table.id)}
                                    style={{
                                        padding: '1rem 0.5rem',
                                        borderRadius: '12px',
                                        border: getTableBorder(table),
                                        backgroundColor: getTableColor(table),
                                        color: '#374151',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        minHeight: '80px',
                                        boxShadow: selectedTable === table.id ? '0 4px 6px -1px rgba(37, 99, 235, 0.2)' : 'none',
                                        transition: 'all 0.1s'
                                    }}
                                >
                                    <span style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>
                                        {table.status === 'occupied' ? '🔴' : (table.status === 'paid' ? '🟡' : '⚪')}
                                    </span>
                                    <span style={{ fontWeight: 'bold', fontSize: '1rem' }}>{table.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* TAKE AWAY SECTION (List) */}
                {orderType === 'take_away' && !selectedSaleId && !isNewTakeAwayMode && (
                    <div style={{ marginBottom: '1.5rem', backgroundColor: 'white', padding: '1rem', borderRadius: '16px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <span style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#374151' }}>Active Orders:</span>
                            <button
                                onClick={handleNewTakeAway}
                                style={{
                                    padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', backgroundColor: '#d97706',
                                    display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'white', fontWeight: 'bold',
                                    boxShadow: '0 2px 4px rgba(217, 119, 6, 0.3)'
                                }}
                            >
                                + {t('pos.newOrder')}
                            </button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.8rem' }}>
                            {/* Active Take Aways */}
                            {activeTakeaways.map(sale => (
                                <button
                                    key={sale.id}
                                    onClick={() => handleSelectTakeAway(sale)}
                                    style={{
                                        padding: '1rem',
                                        borderRadius: '12px',
                                        border: '1px solid #e5e7eb',
                                        backgroundColor: 'white',
                                        color: '#374151',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'flex-start',
                                        textAlign: 'left',
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '4px' }}>
                                        <span style={{ fontWeight: 'bold', color: '#d97706' }}>#{sale.paper_order_ref.split('-')[2] || 'REF'}</span>
                                        <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>{new Date(sale.saleDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    <div style={{ fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '4px' }}>{sale.customerName || 'Unknown'}</div>
                                    <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>
                                        {sale.notes ? `📞 ${sale.notes}` : 'No Phone'}
                                    </div>
                                    <div style={{ marginTop: 'auto', paddingTop: '8px', width: '100%', borderTop: '1px dashed #e5e7eb', textAlign: 'right', fontWeight: 'bold', color: '#059669' }}>
                                        {Number(sale.totalAmount).toLocaleString()} ฿
                                    </div>
                                </button>
                            ))}

                            {activeTakeaways.length === 0 && (
                                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '2rem', color: '#9ca3af', fontStyle: 'italic' }}>
                                    {t('pos.noActiveTakeaway')}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* TAKE AWAY ORDER HEADER (When Active) */}
                {orderType === 'take_away' && (selectedSaleId || isNewTakeAwayMode) && (
                    <div style={{ marginBottom: '1.5rem', backgroundColor: '#fffbeb', padding: '1rem', borderRadius: '16px', border: '1px solid #fcd34d', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <div style={{ fontSize: '0.85rem', color: '#92400e', fontWeight: 'bold', textTransform: 'uppercase' }}>{t('pos.currentOrder')}</div>
                            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#78350f' }}>
                                {customerDetails.name} {customerDetails.phone && <span style={{ fontSize: '0.9rem', fontWeight: 'normal' }}>({customerDetails.phone})</span>}
                            </div>
                        </div>
                        <button
                            onClick={handleBackToTakeAwayList}
                            style={{ padding: '0.5rem 1rem', backgroundColor: 'white', border: '1px solid #fcd34d', borderRadius: '8px', color: '#92400e', cursor: 'pointer', fontWeight: 'bold' }}
                        >
                            ← {t('pos.backToList')}
                        </button>
                    </div>
                )}
                <div style={{ display: 'flex', gap: '0.8rem', marginBottom: '1.5rem', flexWrap: 'nowrap', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            className={`btn`}
                            onClick={() => setSelectedCategory(cat)}
                            style={{
                                minWidth: '120px',
                                padding: '1rem',
                                borderRadius: '12px',
                                backgroundColor: selectedCategory?.id === cat.id ? '#3b82f6' : 'white',
                                color: selectedCategory?.id === cat.id ? 'white' : '#4b5563',
                                border: 'none',
                                boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                                fontWeight: '600',
                                fontSize: '1rem',
                                flexShrink: 0
                            }}
                        >
                            {cat.name}
                        </button>
                    ))}
                </div>

                {/* Menus Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1rem', paddingBottom: '2rem' }}>
                    {currentMenus.map(menu => (
                        <button
                            key={menu.id}
                            style={{
                                height: '140px',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                backgroundColor: 'white',
                                border: 'none',
                                borderRadius: '16px',
                                padding: '1.25rem',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
                                cursor: 'pointer',
                                transition: 'transform 0.1s',
                            }}
                            onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
                            onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                            onClick={() => handleMenuClick(menu)}
                        >
                            <span style={{ fontSize: '1.25rem', fontWeight: 'bold', textAlign: 'center', color: '#1f2937' }}>{menu.name}</span>
                            <span style={{
                                color: '#059669',
                                fontWeight: '800',
                                fontSize: '1.2rem',
                                backgroundColor: '#ecfdf5',
                                padding: '4px 12px',
                                borderRadius: '20px'
                            }}>{menu.base_price} ฿</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* RIGHT: Cart & Order Status */}
            <div className="pos-right-panel">

                {/* Header with Table Info */}
                <div style={{ padding: '1rem', borderBottom: '1px solid #e5e7eb', backgroundColor: '#f9fafb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#111827' }}>
                        {selectedTable ? tables.find(t => t.id === selectedTable)?.name || 'Order' : 'Select Table'}
                    </h2>
                    {selectedTable && (
                        <span style={{ fontWeight: 'bold', color: '#6b7280' }}>
                            #{selectedTable}
                        </span>
                    )}
                    {selectedSaleId && (
                        <span style={{ fontWeight: 'bold', color: '#d97706' }}>
                            Take Away
                        </span>
                    )}
                    {orderType === 'quick_sale' && (
                        <span style={{ fontWeight: 'bold', color: '#2563eb' }}>
                            🛒 Sale-Record
                        </span>
                    )}
                </div>

                <div className="pos-order-content">

                    {/* EXISTING ORDERS (Read Only) */}
                    {existingItems.length > 0 && (
                        <div style={{ opacity: 0.8 }}>
                            <div style={{ fontSize: '0.9rem', color: '#6b7280', fontWeight: 'bold', marginBottom: '0.5rem', borderBottom: '1px dashed #ccc', paddingBottom: '4px' }}>
                                {t('pos.sentToKitchen')}
                            </div>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem' }}>
                                <thead>
                                    <tr style={{ color: '#6b7280', borderBottom: '1px solid #e5e7eb', fontSize: '0.85rem' }}>
                                        <th style={{ padding: '0.5rem', textAlign: 'center' }}>{t('pos.qty')}</th>
                                        <th style={{ padding: '0.5rem', textAlign: 'left' }}>{t('pos.item')}</th>
                                        <th style={{ padding: '0.5rem', textAlign: 'right' }}>{t('pos.total')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {existingItems.map((item, index) => (
                                        <tr key={'exist-' + index} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                            <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center', fontWeight: 'bold', color: '#374151' }}>{item.quantity}</td>
                                            <td style={{ padding: '0.75rem 0.5rem', color: '#374151' }}>
                                                <div>{item.itemName}</div>
                                                <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>{JSON.parse(item.options_json || '[]').map(o => o.name).join(', ')}</div>
                                            </td>
                                            <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', fontWeight: 'bold' }}>{item.total_price * item.quantity}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* NEW ORDERS (Cart) */}
                    {(cart.length > 0 || existingItems.length === 0) && (
                        <div>
                            {cart.length > 0 && (
                                <div style={{ fontSize: '0.9rem', color: '#059669', fontWeight: 'bold', marginBottom: '0.5rem', borderBottom: '1px dashed #059669', paddingBottom: '4px', marginTop: '1rem' }}>
                                    NEW ORDER
                                </div>
                            )}
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ color: '#6b7280', borderBottom: '1px solid #e5e7eb', fontSize: '0.85rem' }}>
                                        <th style={{ padding: '0.5rem', textAlign: 'center', width: '50px' }}>{t('pos.qty')}</th>
                                        <th style={{ padding: '0.5rem', textAlign: 'left' }}>{t('pos.item')}</th>
                                        <th style={{ padding: '0.5rem', textAlign: 'right', width: '70px' }}>{t('pos.total')}</th>
                                        <th style={{ padding: '0.5rem', width: '40px' }}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {cart.map((item, index) => (
                                        <tr key={'cart-' + index} style={{ borderBottom: '1px solid #f3f4f6', backgroundColor: '#fdfbf7' }}>
                                            <td style={{ padding: '0.5rem', verticalAlign: 'top' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                                    <button onClick={() => updateQuantity(item.id, 1)} className="btn btn-sm" style={{ padding: '0 6px', fontSize: '12px', borderRadius: '4px', border: '1px solid #ccc' }}>+</button>
                                                    <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{item.quantity}</span>
                                                    <button onClick={() => updateQuantity(item.id, -1)} className="btn btn-sm" style={{ padding: '0 6px', fontSize: '12px', borderRadius: '4px', border: '1px solid #ccc' }}>-</button>
                                                </div>
                                            </td>
                                            <td style={{ padding: '0.75rem 0.5rem', verticalAlign: 'top' }}>
                                                <div style={{ fontWeight: 'bold', color: '#111827' }}>{item.itemName}</div>
                                                <div style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '4px' }}>{item.itemOptions}</div>
                                                {/* Fast Multipliers */}
                                                <div style={{ display: 'flex', gap: '4px' }}>
                                                    <button onClick={() => setQuantityMultiplier(item.id, 2)} style={{ fontSize: '0.7rem', padding: '2px 6px', backgroundColor: '#e0f2fe', color: '#0369a1', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>x2</button>
                                                    <button onClick={() => setQuantityMultiplier(item.id, 3)} style={{ fontSize: '0.7rem', padding: '2px 6px', backgroundColor: '#e0f2fe', color: '#0369a1', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>x3</button>
                                                </div>
                                            </td>
                                            <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', fontWeight: 'bold', verticalAlign: 'top' }}>
                                                {item.unit_price * item.quantity}
                                            </td>
                                            <td style={{ padding: '0.75rem 0', verticalAlign: 'top', textAlign: 'center' }}>
                                                <button
                                                    onClick={() => removeFromCart(item.id)}
                                                    style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1.2rem' }}
                                                >
                                                    ×
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {cart.length === 0 && existingItems.length === 0 && (
                                        <tr>
                                            <td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>
                                                {t('pos.cartEmpty')}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <div style={{ padding: '1.5rem', backgroundColor: '#fff', borderTop: '1px solid #e5e7eb' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: '800', color: '#111827' }}>
                        <span>{t('pos.tableTotal')}:</span>
                        <span>{(existingTotal + cart.reduce((s, i) => s + (i.unit_price * i.quantity), 0)).toLocaleString()} ฿</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: orderType === 'quick_sale' ? '1fr' : '1fr 1fr', gap: '1rem' }}>
                        {orderType === 'quick_sale' ? (
                            <button
                                className="btn btn-primary btn-lg btn-block"
                                onClick={handleQuickSave}
                                disabled={cart.length === 0 || isProcessing}
                                style={{ height: '64px', fontSize: '1.5rem', borderRadius: '16px', fontWeight: 'bold', backgroundColor: '#2563eb', color: 'white' }}
                            >
                                💾 บันทึก
                            </button>
                        ) : currentTableStatus === 'paid' ? (
                            <>
                                <button
                                    className="btn btn-danger btn-lg btn-block"
                                    onClick={handleClearTable}
                                    style={{ height: '64px', fontSize: '1.2rem', borderRadius: '16px', fontWeight: 'bold' }}
                                >
                                    🧹 {t('pos.clearTable')}
                                </button>
                                <button
                                    className="btn btn-secondary btn-lg btn-block"
                                    onClick={() => setShowMoveModal(true)}
                                    style={{ height: '64px', fontSize: '1.2rem', borderRadius: '16px', fontWeight: 'bold' }}
                                >
                                    ↔ {t('pos.moveTable')}
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    className="btn btn-warning btn-lg btn-block"
                                    onClick={handleCheckBill}
                                    disabled={existingItems.length === 0 && cart.length === 0}
                                    style={{ height: '64px', fontSize: '1.2rem', borderRadius: '16px', fontWeight: 'bold', color: '#78350f', backgroundColor: '#fcd34d' }}
                                >
                                    💰 {t('pos.checkBill')}
                                </button>
                                <button
                                    className="btn btn-success btn-lg btn-block"
                                    onClick={sendOrder}
                                    disabled={cart.length === 0 || isProcessing}
                                    style={{ height: '64px', fontSize: '1.2rem', borderRadius: '16px', fontWeight: 'bold' }}
                                >
                                    ✅ {t('pos.sendOrder')}
                                </button>
                                {selectedTable && tables.find(t => t.id === selectedTable)?.status === 'occupied' && (
                                    <button
                                        className="btn btn-secondary btn-lg btn-block"
                                        onClick={() => setShowMoveModal(true)}
                                        style={{ height: '48px', fontSize: '1rem', borderRadius: '12px', fontWeight: 'bold', gridColumn: 'span 2', marginTop: '-0.5rem' }}
                                    >
                                        ↔ {t('pos.moveTable')}
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal: New Take Away Customer */}
            {
                showNewOrderModal && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                    }}>
                        <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '16px', width: '90%', maxWidth: '400px' }}>
                            <h2 style={{ marginTop: 0, marginBottom: '1.5rem' }}>🥡 {t('pos.newTakeAwayOrder')}</h2>

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>{t('pos.customerName')}</label>
                                <input
                                    autoFocus
                                    type="text"
                                    value={customerDetails.name}
                                    onChange={e => setCustomerDetails({ ...customerDetails, name: e.target.value })}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '1rem' }}
                                    placeholder="e.g. John"
                                />
                            </div>

                            <div style={{ marginBottom: '2rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>{t('pos.phoneNumber')}</label>
                                <input
                                    type="tel"
                                    value={customerDetails.phone}
                                    onChange={e => setCustomerDetails({ ...customerDetails, phone: e.target.value })}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '1rem' }}
                                    placeholder="e.g. 081-234-5678"
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button
                                    onClick={() => setShowNewOrderModal(false)}
                                    style={{ flex: 1, padding: '1rem', borderRadius: '12px', border: '1px solid #d1d5db', backgroundColor: 'white', cursor: 'pointer', fontWeight: 'bold' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmNewTakeAway}
                                    style={{ flex: 1, padding: '1rem', borderRadius: '12px', border: 'none', backgroundColor: '#d97706', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}
                                >
                                    {t('pos.startOrder')}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* MODAL: Option Selection */}
            {
                selectedMenu && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
                        display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
                    }}>
                        <div className="card" style={{ width: '700px', maxHeight: '90vh', overflowY: 'auto', padding: '0', borderRadius: '24px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
                            {/* Header */}
                            <div style={{ padding: '2rem', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff' }}>
                                <div>
                                    <h2 style={{ margin: 0, fontSize: '2rem', color: '#111827' }}>{selectedMenu.name}</h2>
                                    <span style={{ color: '#059669', fontSize: '1.25rem', fontWeight: '600' }}>{selectedMenu.base_price} ฿</span>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <button
                                        className="btn"
                                        onClick={toggleTakeAway}
                                        style={{
                                            padding: '0.5rem 1rem',
                                            borderRadius: '20px',
                                            border: isTakeAway ? '2px solid #d97706' : '1px solid #ccc',
                                            backgroundColor: isTakeAway ? '#fffbeb' : 'white',
                                            color: isTakeAway ? '#d97706' : '#666',
                                            fontWeight: 'bold',
                                            marginRight: '1rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem'
                                        }}
                                    >
                                        {isTakeAway ? `🥡 ${t('pos.takeaway')}` : `🍽️ ${t('pos.dineIn')}`}
                                    </button>

                                    <button
                                        className="btn"
                                        onClick={() => setSelectedMenu(null)}
                                        style={{ width: '40px', height: '40px', borderRadius: '50%', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>

                            {/* Options Body */}
                            <div style={{ padding: '2rem' }}>
                                {activeGroups.length === 0 && <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: '1.2rem' }}>{t('pos.noOptions')}</p>}

                                {activeGroups.map(group => (
                                    <div key={group.id} style={{ marginBottom: '2.5rem' }}>
                                        <h3 style={{ marginBottom: '1rem', marginTop: 0, display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '1.4rem' }}>
                                            {group.name}
                                            <span style={{ fontSize: '0.9rem', fontWeight: 'normal', backgroundColor: '#f3f4f6', color: '#6b7280', padding: '4px 12px', borderRadius: '20px' }}>
                                                {group.selection_type === 'single' ? t('pos.pick1') : t('pos.pickAny')}
                                            </span>
                                            {group.is_optional === 0 && (
                                                <span style={{ fontSize: '0.9rem', color: '#dc2626', backgroundColor: '#fee2e2', padding: '4px 12px', borderRadius: '20px' }}>
                                                    {t('menuManagement.required')}
                                                </span>
                                            )}
                                        </h3>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '1rem' }}>
                                            {options.filter(o => o.group_id === group.id).map(opt => {
                                                const isSelected = group.selection_type === 'multiple'
                                                    ? (currentSelections[group.id]?.[opt.id])
                                                    : (currentSelections[group.id] === opt.id);

                                                return (
                                                    <button
                                                        key={opt.id}
                                                        onClick={() => handleSelectOption(group.id, opt.id, group.selection_type)}
                                                        style={{
                                                            padding: '1rem',
                                                            borderRadius: '16px',
                                                            border: isSelected ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                                                            backgroundColor: isSelected ? '#eff6ff' : 'white',
                                                            color: isSelected ? '#1d4ed8' : '#374151',
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            flexDirection: 'column',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            height: '100px',
                                                            transition: 'all 0.1s'
                                                        }}
                                                    >
                                                        <div style={{ fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '0.25rem' }}>{opt.name}</div>
                                                        <div style={{ fontSize: '0.9rem', color: isSelected ? '#2563eb' : '#6b7280' }}>
                                                            {opt.price_adjustment > 0 ? `+${opt.price_adjustment}฿` : t('pos.free')}
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Footer */}
                            <div style={{ padding: '1.5rem', borderTop: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
                                <button
                                    className="btn btn-primary btn-lg btn-block"
                                    style={{ height: '70px', fontSize: '1.5rem', borderRadius: '16px', fontWeight: 'bold', boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.3)' }}
                                    onClick={addToCart}
                                >
                                    {t('pos.addToOrder')} — {calculateCurrentPrice()} ฿
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* MODAL: Payment / Check Bill */}
            {
                showPaymentModal && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
                        display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100
                    }}>
                        <div className="payment-modal-wrapper">

                            {/* Header */}
                            <div className="payment-modal-header">
                                <div>
                                    <h2 style={{ fontSize: '2rem', margin: 0, color: '#111827', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span>💸 {t('pos.payment')}</span>
                                    </h2>
                                    <div style={{ fontSize: '1.1rem', color: '#6b7280', marginTop: '0.25rem' }}>
                                        {orderType === 'dine_in'
                                            ? `Table #${selectedTable}`
                                            : `Take Away • ${customerDetails.name} ${customerDetails.phone ? '(' + customerDetails.phone + ')' : ''}`
                                        }
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowPaymentModal(false)}
                                    style={{ background: 'transparent', border: 'none', fontSize: '2rem', cursor: 'pointer', color: '#9ca3af' }}
                                >
                                    ×
                                </button>
                            </div>

                            <div className="payment-modal-content">

                                {/* LEFT: Order Summary */}
                                <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                                    <h3 style={{ marginTop: 0, color: '#374151' }}>{t('pos.orderSummary')}</h3>
                                    <div style={{ flex: 1, overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '1rem' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                            <thead>
                                                <tr style={{ borderBottom: '1px solid #e5e7eb', color: '#6b7280', textAlign: 'left' }}>
                                                    <th style={{ paddingBottom: '0.5rem', width: '40px' }}>Qty</th>
                                                    <th style={{ paddingBottom: '0.5rem' }}>Item</th>
                                                    <th style={{ paddingBottom: '0.5rem', textAlign: 'right' }}>Total</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {[...existingItems, ...cart].map((item, idx) => (
                                                    <tr key={idx} style={{ borderBottom: '1px dashed #f3f4f6' }}>
                                                        <td style={{ padding: '0.75rem 0', fontWeight: 'bold', color: '#374151' }}>{item.quantity}</td>
                                                        <td style={{ padding: '0.75rem 0.5rem' }}>
                                                            <div style={{ color: '#111827' }}>{item.itemName}</div>
                                                            <div style={{ fontSize: '0.85rem', color: '#9ca3af' }}>
                                                                {item.options_json
                                                                    ? JSON.parse(item.options_json).map(o => o.name).join(', ')
                                                                    : (item.itemOptions || '')}
                                                            </div>
                                                        </td>
                                                        <td style={{ padding: '0.75rem 0', textAlign: 'right', fontWeight: 'bold' }}>
                                                            {((item.total_price || (item.unit_price * item.quantity))).toLocaleString()}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* RIGHT: Payment Controls */}
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <div style={{ backgroundColor: '#f9fafb', padding: '1.5rem', borderRadius: '16px', flex: 1, display: 'flex', flexDirection: 'column' }}>

                                        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                                            <div style={{ fontSize: '0.9rem', color: '#6b7280', textTransform: 'uppercase', fontWeight: 'bold' }}>{t('pos.totalAmount')}</div>
                                            <div style={{ fontSize: '3.5rem', fontWeight: '800', color: '#111827', lineHeight: 1 }}>
                                                {grandTotal.toLocaleString()} <span style={{ fontSize: '1.5rem', color: '#9ca3af' }}>฿</span>
                                            </div>
                                        </div>

                                        <div style={{ marginBottom: 'auto' }}>
                                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '1.1rem', color: '#374151' }}>{t('pos.cashReceived')}</label>
                                            <div style={{ position: 'relative' }}>
                                                <input
                                                    type="number"
                                                    autoFocus
                                                    value={cashReceived}
                                                    onChange={e => setCashReceived(e.target.value)}
                                                    onFocus={e => e.target.select()}
                                                    onClick={e => e.target.select()}
                                                    onKeyDown={e => {
                                                        if (e.key === 'Enter') confirmPayment();
                                                    }}
                                                    style={{
                                                        width: '100%', padding: '1rem', paddingRight: '3rem', fontSize: '2rem',
                                                        border: '2px solid #2563eb', borderRadius: '12px',
                                                        outline: 'none', textAlign: 'right', fontWeight: 'bold', color: '#2563eb', backgroundColor: 'white'
                                                    }}
                                                    placeholder="0"
                                                />
                                                <span style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', fontSize: '1.5rem', color: '#9ca3af', fontWeight: 'bold' }}>฿</span>
                                            </div>

                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    {[100, 200, 300, 400].map(amt => (
                                                        <button
                                                            key={amt}
                                                            onClick={() => setCashReceived(String(amt))}
                                                            style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid #d1d5db', background: 'white', cursor: 'pointer', fontWeight: 'bold', color: '#4b5563', fontSize: '1.25rem' }}
                                                        >
                                                            {amt}
                                                        </button>
                                                    ))}
                                                </div>
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    {[500, 1000, 2000].map(amt => (
                                                        <button
                                                            key={amt}
                                                            onClick={() => setCashReceived(String(amt))}
                                                            style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid #d1d5db', background: 'white', cursor: 'pointer', fontWeight: 'bold', color: '#4b5563', fontSize: '1.25rem' }}
                                                        >
                                                            {amt}
                                                        </button>
                                                    ))}
                                                    <button
                                                        onClick={() => setCashReceived(String(grandTotal))}
                                                        style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid #2563eb', background: '#eff6ff', cursor: 'pointer', fontWeight: 'bold', color: '#2563eb', fontSize: '1.25rem' }}
                                                    >
                                                        {t('pos.exact')}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2rem', paddingTop: '1.5rem', borderTop: '2px dashed #e5e7eb' }}>
                                            <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#4b5563' }}>{t('pos.change')}</span>
                                            <span style={{ fontSize: '2rem', fontWeight: 'bold', color: change < 0 ? '#ef4444' : '#059669' }}>
                                                {change.toLocaleString()} ฿
                                            </span>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                                        <button
                                            className="btn btn-secondary"
                                            onClick={() => setShowPaymentModal(false)}
                                            style={{ flex: 1, height: '60px', borderRadius: '16px', fontSize: '1.2rem' }}
                                        >
                                            {t('common.cancel')}
                                        </button>
                                        <button
                                            className="btn btn-primary"
                                            onClick={confirmPayment}
                                            style={{ flex: 2, height: '60px', borderRadius: '16px', fontSize: '1.2rem', fontWeight: 'bold', boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.4)' }}
                                        >
                                            {t('pos.confirmPayment')}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
            {/* MODAL: Move Table */}
            {
                showMoveModal && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
                        display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1200
                    }}>
                        <div style={{ backgroundColor: '#fff', borderRadius: '24px', padding: '2rem', width: '500px', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
                            <h2 style={{ fontSize: '2rem', marginBottom: '1.5rem', color: '#111827' }}>{t('pos.moveTable')}</h2>
                            <p style={{ marginBottom: '1.5rem', color: '#666' }}>{t('pos.moveTableInstruction')}</p>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '1rem', maxHeight: '400px', overflowY: 'auto', padding: '1rem', border: '1px solid #eee', borderRadius: '12px', marginBottom: '2rem' }}>
                                {tables.filter(t => t.status === 'available' || t.status === 'paid').map(t => (
                                    <button
                                        key={t.id}
                                        onClick={() => setTargetTableId(t.id)}
                                        disabled={t.status !== 'available'}
                                        style={{
                                            padding: '1rem',
                                            borderRadius: '12px',
                                            border: targetTableId === t.id ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                                            backgroundColor: targetTableId === t.id ? '#eff6ff' : (t.status === 'available' ? 'white' : '#f3f4f6'),
                                            color: targetTableId === t.id ? '#1d4ed8' : '#374151',
                                            cursor: t.status === 'available' ? 'pointer' : 'not-allowed',
                                            opacity: t.status === 'available' ? 1 : 0.5
                                        }}
                                    >
                                        <div style={{ fontWeight: 'bold' }}>{t.name}</div>
                                    </button>
                                ))}
                            </div>

                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => { setShowMoveModal(false); setTargetTableId(''); }}
                                    style={{ flex: 1, height: '50px', borderRadius: '12px', fontSize: '1.1rem' }}
                                >
                                    {t('common.cancel')}
                                </button>
                                <button
                                    className="btn btn-primary"
                                    onClick={handleMoveTable}
                                    disabled={!targetTableId}
                                    style={{ flex: 1, height: '50px', borderRadius: '12px', fontSize: '1.1rem', fontWeight: 'bold' }}
                                >
                                    {t('pos.confirmMove')}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default POSEntry;
