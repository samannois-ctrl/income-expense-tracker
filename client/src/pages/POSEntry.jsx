import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';

const API_URL = 'http://localhost:3001/api';

const POSEntry = () => {
    const { t } = useSettings();
    const navigate = useNavigate();

    // Menu data
    const [categories, setCategories] = useState([]);
    const [options, setOptions] = useState([]);
    const [noodles, setNoodles] = useState([]);

    // Selection state
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedOption, setSelectedOption] = useState(null);
    const [selectedNoodle, setSelectedNoodle] = useState(null);
    const [notes, setNotes] = useState('');

    // Cart state
    const [cart, setCart] = useState([]);
    const [orderNumber, setOrderNumber] = useState('');

    useEffect(() => {
        fetchMenuData();
        generateOrderNumber();
    }, []);

    useEffect(() => {
        if (selectedCategory) {
            fetchOptions(selectedCategory.id);
        }
    }, [selectedCategory]);

    const generateOrderNumber = () => {
        const now = new Date();
        const num = `ORD${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
        setOrderNumber(num);
    };

    const fetchMenuData = async () => {
        try {
            const token = localStorage.getItem('token');

            // Fetch categories
            const catRes = await fetch(`${API_URL}/menu/categories`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const catData = await catRes.json();
            setCategories(catData.data || []);
            if (catData.data && catData.data.length > 0) {
                setSelectedCategory(catData.data[0]);
            }

            // Fetch noodles
            const noodleRes = await fetch(`${API_URL}/menu/noodle-types`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const noodleData = await noodleRes.json();
            setNoodles(noodleData.data || []);
            if (noodleData.data && noodleData.data.length > 0) {
                setSelectedNoodle(noodleData.data[0]);
            }
        } catch (error) {
            console.error('Error fetching menu data:', error);
        }
    };

    const fetchOptions = async (categoryId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/menu/options?category_id=${categoryId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            setOptions(data.data || []);
            if (data.data && data.data.length > 0) {
                setSelectedOption(data.data[0]);
            }
        } catch (error) {
            console.error('Error fetching options:', error);
        }
    };

    const handleAddToCart = () => {
        if (!selectedCategory || !selectedOption || !selectedNoodle) {
            alert('กรุณาเลือกข้อมูลให้ครบ');
            return;
        }

        const item = {
            id: Date.now(),
            category: selectedCategory.name,
            option: selectedOption.name,
            noodle: selectedNoodle.name,
            price: selectedOption.price,
            quantity: 1,
            notes: notes,
            category_id: selectedCategory.id,
            option_id: selectedOption.id,
            noodle_id: selectedNoodle.id
        };

        setCart([...cart, item]);
        setNotes('');
    };

    const handleRemoveFromCart = (itemId) => {
        setCart(cart.filter(item => item.id !== itemId));
    };

    const handleQuantityChange = (itemId, newQuantity) => {
        if (newQuantity < 1) return;
        setCart(cart.map(item =>
            item.id === itemId ? { ...item, quantity: newQuantity } : item
        ));
    };

    const calculateTotal = () => {
        return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    };

    const handleSubmitOrder = async () => {
        if (cart.length === 0) {
            alert('กรุณาเพิ่มรายการในออเดอร์');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const orderData = {
                sale_date: new Date().toISOString().split('T')[0],
                payment_method: 'cash',
                paper_order_ref: orderNumber,
                notes: `Order ${orderNumber}`,
                items: cart.map(item => ({
                    category_id: item.category_id,
                    option_id: item.option_id,
                    noodle_id: item.noodle_id,
                    item_name: `${item.category} ${item.option} ${item.noodle}`,
                    quantity: item.quantity,
                    unit_price: item.price,
                    notes: item.notes
                }))
            };

            const response = await fetch(`${API_URL}/pos/sales`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(orderData)
            });

            if (response.ok) {
                alert('บันทึกการขายสำเร็จ!');
                setCart([]);
                generateOrderNumber();
            } else {
                alert('เกิดข้อผิดพลาดในการบันทึก');
            }
        } catch (error) {
            console.error('Error submitting order:', error);
            alert('เกิดข้อผิดพลาดในการบันทึก');
        }
    };

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">🍜 บันทึกการขาย</h1>
                <p className="page-subtitle">เลขที่ออเดอร์: {orderNumber}</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-lg)' }}>
                {/* Left side - Menu Selection */}
                <div className="card">
                    <h2>เลือกเมนู</h2>

                    {/* Categories */}
                    <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                        <label className="form-label">ประเภท:</label>
                        <div style={{ display: 'flex', gap: 'var(--spacing-sm)', flexWrap: 'wrap' }}>
                            {categories.map(cat => (
                                <button
                                    key={cat.id}
                                    className={`btn ${selectedCategory?.id === cat.id ? 'btn-primary' : 'btn-secondary'}`}
                                    onClick={() => setSelectedCategory(cat)}
                                >
                                    {cat.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Options */}
                    <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                        <label className="form-label">ตัวเลือก:</label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 'var(--spacing-sm)' }}>
                            {options.map(opt => (
                                <button
                                    key={opt.id}
                                    className={`btn ${selectedOption?.id === opt.id ? 'btn-success' : 'btn-secondary'}`}
                                    onClick={() => setSelectedOption(opt)}
                                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 'var(--spacing-md)' }}
                                >
                                    <div>{opt.name}</div>
                                    <div style={{ fontSize: '0.9rem', fontWeight: 'bold', marginTop: '4px' }}>{opt.price}฿</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Noodles */}
                    <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                        <label className="form-label">ประเภทเส้น:</label>
                        <div style={{ display: 'flex', gap: 'var(--spacing-sm)', flexWrap: 'wrap' }}>
                            {noodles.map(noodle => (
                                <button
                                    key={noodle.id}
                                    className={`btn ${selectedNoodle?.id === noodle.id ? 'btn-primary' : 'btn-secondary'}`}
                                    onClick={() => setSelectedNoodle(noodle)}
                                >
                                    {noodle.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Notes */}
                    <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                        <label className="form-label">หมายเหตุ:</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="เช่น ไม่ใส่ผัก, พิเศษ..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </div>

                    <button
                        className="btn btn-success"
                        onClick={handleAddToCart}
                        style={{ width: '100%' }}
                    >
                        ➕ เพิ่มในออเดอร์
                    </button>
                </div>

                {/* Right side - Cart */}
                <div className="card">
                    <h2>รายการออเดอร์</h2>

                    {cart.length === 0 ? (
                        <p style={{ textAlign: 'center', color: 'var(--color-text-secondary)', padding: 'var(--spacing-xl)' }}>
                            ยังไม่มีรายการ
                        </p>
                    ) : (
                        <>
                            <div style={{ maxHeight: '400px', overflowY: 'auto', marginBottom: 'var(--spacing-lg)' }}>
                                {cart.map((item, index) => (
                                    <div
                                        key={item.id}
                                        style={{
                                            padding: 'var(--spacing-md)',
                                            borderBottom: '1px solid var(--border-color)',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}
                                    >
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 'bold' }}>
                                                {index + 1}. {item.category} {item.option}
                                            </div>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                                                {item.noodle}
                                                {item.notes && ` (${item.notes})`}
                                            </div>
                                            <div style={{ fontSize: '0.9rem', color: 'var(--color-accent-green)', marginTop: '4px' }}>
                                                {item.price}฿ × <input
                                                    type="number"
                                                    min="1"
                                                    value={item.quantity}
                                                    onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 1)}
                                                    style={{ width: '60px', display: 'inline', marginLeft: '4px', marginRight: '4px' }}
                                                    className="form-input"
                                                /> = {item.price * item.quantity}฿
                                            </div>
                                        </div>
                                        <button
                                            className="btn btn-danger btn-sm"
                                            onClick={() => handleRemoveFromCart(item.id)}
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <div style={{
                                borderTop: '2px solid var(--border-color)',
                                paddingTop: 'var(--spacing-md)',
                                marginBottom: 'var(--spacing-lg)'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 'bold' }}>
                                    <span>รวมทั้งหมด:</span>
                                    <span style={{ color: 'var(--color-accent-green)' }}>{calculateTotal()}฿</span>
                                </div>
                                <div style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                                    จำนวน {cart.reduce((sum, item) => sum + item.quantity, 0)} รายการ
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => setCart([])}
                                    style={{ flex: 1 }}
                                >
                                    ❌ ล้างออเดอร์
                                </button>
                                <button
                                    className="btn btn-success"
                                    onClick={handleSubmitOrder}
                                    style={{ flex: 2 }}
                                >
                                    ✅ บันทึกการขาย
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default POSEntry;
