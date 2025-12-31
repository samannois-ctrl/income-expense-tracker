import { useState, useEffect } from 'react';
import { useSettings } from '../context/SettingsContext';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { DraggableRow } from '../components/DraggableRow';

const API_URL = 'http://localhost:3001/api';

const MenuManagement = () => {
    const { t } = useSettings();
    const [activeTab, setActiveTab] = useState('categories'); // categories, options, noodles

    // Categories state
    const [categories, setCategories] = useState([]);
    const [newCategory, setNewCategory] = useState({ name: '', display_order: 0 });
    const [editingCategory, setEditingCategory] = useState(null);

    // Options state
    const [selectedCategoryId, setSelectedCategoryId] = useState(null);
    const [options, setOptions] = useState([]);
    const [newOption, setNewOption] = useState({ name: '', price: '', display_order: 0 });
    const [editingOption, setEditingOption] = useState(null);

    // Noodles state
    const [noodles, setNoodles] = useState([]);
    const [newNoodle, setNewNoodle] = useState({ name: '', display_order: 0 });
    const [editingNoodle, setEditingNoodle] = useState(null);

    // Drag and drop sensors
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        fetchCategories();
        fetchNoodles();
    }, []);

    useEffect(() => {
        if (selectedCategoryId) {
            fetchOptions(selectedCategoryId);
        }
    }, [selectedCategoryId]);

    // ============================================
    // Categories Functions
    // ============================================
    const fetchCategories = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/menu/categories`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            setCategories(data.data || []);
            if (data.data && data.data.length > 0 && !selectedCategoryId) {
                setSelectedCategoryId(data.data[0].id);
            }
            // Auto-set next display order
            if (data.data && data.data.length > 0) {
                const maxOrder = Math.max(...data.data.map(c => c.display_order || 0));
                setNewCategory({ name: '', display_order: maxOrder + 1 });
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const handleAddCategory = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await fetch(`${API_URL}/menu/categories`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newCategory)
            });
            fetchCategories(); // Will auto-update display_order
        } catch (error) {
            console.error('Error adding category:', error);
        }
    };

    const handleUpdateCategory = async (id) => {
        try {
            const token = localStorage.getItem('token');
            await fetch(`${API_URL}/menu/categories/${id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(editingCategory)
            });
            setEditingCategory(null);
            fetchCategories();
        } catch (error) {
            console.error('Error updating category:', error);
        }
    };

    const handleDeleteCategory = async (id) => {
        if (!confirm('ลบประเภทนี้? (ตัวเลือกทั้งหมดในประเภทนี้จะถูกลบด้วย)')) return;
        try {
            const token = localStorage.getItem('token');
            await fetch(`${API_URL}/menu/categories/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchCategories();
        } catch (error) {
            console.error('Error deleting category:', error);
        }
    };

    // ============================================
    // Options Functions
    // ============================================
    const fetchOptions = async (categoryId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/menu/options?category_id=${categoryId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            setOptions(data.data || []);
            // Auto-set next display order
            if (data.data && data.data.length > 0) {
                const maxOrder = Math.max(...data.data.map(o => o.display_order || 0));
                setNewOption({ name: '', price: '', display_order: maxOrder + 1 });
            } else {
                setNewOption({ name: '', price: '', display_order: 0 });
            }
        } catch (error) {
            console.error('Error fetching options:', error);
        }
    };

    const handleAddOption = async (e) => {
        e.preventDefault();
        if (!selectedCategoryId) {
            alert('กรุณาเลือกประเภทก่อน');
            return;
        }
        try {
            const token = localStorage.getItem('token');
            await fetch(`${API_URL}/menu/options`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...newOption,
                    category_id: selectedCategoryId,
                    price: parseFloat(newOption.price)
                })
            });
            fetchOptions(selectedCategoryId); // Will auto-update display_order
        } catch (error) {
            console.error('Error adding option:', error);
        }
    };

    const handleUpdateOption = async (id) => {
        try {
            const token = localStorage.getItem('token');
            await fetch(`${API_URL}/menu/options/${id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...editingOption,
                    price: parseFloat(editingOption.price)
                })
            });
            setEditingOption(null);
            fetchOptions(selectedCategoryId);
        } catch (error) {
            console.error('Error updating option:', error);
        }
    };

    const handleDeleteOption = async (id) => {
        if (!confirm('ลบตัวเลือกนี้?')) return;
        try {
            const token = localStorage.getItem('token');
            await fetch(`${API_URL}/menu/options/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchOptions(selectedCategoryId);
        } catch (error) {
            console.error('Error deleting option:', error);
        }
    };

    // ============================================
    // Noodles Functions
    // ============================================
    const fetchNoodles = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/menu/noodle-types`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            setNoodles(data.data || []);
            // Auto-set next display order
            if (data.data && data.data.length > 0) {
                const maxOrder = Math.max(...data.data.map(n => n.display_order || 0));
                setNewNoodle({ name: '', display_order: maxOrder + 1 });
            }
        } catch (error) {
            console.error('Error fetching noodles:', error);
        }
    };

    const handleAddNoodle = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await fetch(`${API_URL}/menu/noodle-types`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newNoodle)
            });
            fetchNoodles(); // Will auto-update display_order
        } catch (error) {
            console.error('Error adding noodle:', error);
        }
    };

    const handleUpdateNoodle = async (id) => {
        try {
            const token = localStorage.getItem('token');
            await fetch(`${API_URL}/menu/noodle-types/${id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(editingNoodle)
            });
            setEditingNoodle(null);
            fetchNoodles();
        } catch (error) {
            console.error('Error updating noodle:', error);
        }
    };

    const handleDeleteNoodle = async (id) => {
        if (!confirm('ลบประเภทเส้นนี้?')) return;
        try {
            const token = localStorage.getItem('token');
            await fetch(`${API_URL}/menu/noodle-types/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchNoodles();
        } catch (error) {
            console.error('Error deleting noodle:', error);
        }
    };

    // ============================================
    // Drag and Drop Handlers
    // ============================================
    const handleDragEndCategories = async (event) => {
        const { active, over } = event;

        if (!over || active.id === over.id) return;

        const oldIndex = categories.findIndex(c => c.id === active.id);
        const newIndex = categories.findIndex(c => c.id === over.id);

        const newCategories = arrayMove(categories, oldIndex, newIndex);
        setCategories(newCategories);

        // Update display_order for all categories (start from 1)
        try {
            const token = localStorage.getItem('token');
            await Promise.all(
                newCategories.map((cat, index) =>
                    fetch(`${API_URL}/menu/categories/${cat.id}`, {
                        method: 'PUT',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ ...cat, display_order: index + 1 })
                    })
                )
            );
            // Refresh to show updated orders
            fetchCategories();
        } catch (error) {
            console.error('Error updating category order:', error);
        }
    };

    const handleDragEndOptions = async (event) => {
        const { active, over } = event;

        if (!over || active.id === over.id) return;

        const oldIndex = options.findIndex(o => o.id === active.id);
        const newIndex = options.findIndex(o => o.id === over.id);

        const newOptions = arrayMove(options, oldIndex, newIndex);
        setOptions(newOptions);

        // Update display_order for all options (start from 1)
        try {
            const token = localStorage.getItem('token');
            await Promise.all(
                newOptions.map((opt, index) =>
                    fetch(`${API_URL}/menu/options/${opt.id}`, {
                        method: 'PUT',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ ...opt, display_order: index + 1 })
                    })
                )
            );
            // Refresh to show updated orders
            fetchOptions(selectedCategoryId);
        } catch (error) {
            console.error('Error updating option order:', error);
        }
    };

    const handleDragEndNoodles = async (event) => {
        const { active, over } = event;

        if (!over || active.id === over.id) return;

        const oldIndex = noodles.findIndex(n => n.id === active.id);
        const newIndex = noodles.findIndex(n => n.id === over.id);

        const newNoodles = arrayMove(noodles, oldIndex, newIndex);
        setNoodles(newNoodles);

        // Update display_order for all noodles (start from 1)
        try {
            const token = localStorage.getItem('token');
            await Promise.all(
                newNoodles.map((noodle, index) =>
                    fetch(`${API_URL}/menu/noodle-types/${noodle.id}`, {
                        method: 'PUT',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ ...noodle, display_order: index + 1 })
                    })
                )
            );
            // Refresh to show updated orders
            fetchNoodles();
        } catch (error) {
            console.error('Error updating noodle order:', error);
        }
    };

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">🍜 จัดการรายการอาหาร</h1>
                <p className="page-subtitle">เพิ่ม แก้ไข และจัดการเมนูอาหาร</p>
            </div>

            {/* Tabs */}
            <div className="card" style={{ marginBottom: 'var(--spacing-md)' }}>
                <div style={{ display: 'flex', gap: 'var(--spacing-sm)', borderBottom: '1px solid var(--border-color)', paddingBottom: 'var(--spacing-md)' }}>
                    <button
                        className={`btn ${activeTab === 'categories' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setActiveTab('categories')}
                    >
                        📁 ประเภทก๋วยเตี๋ยว
                    </button>
                    <button
                        className={`btn ${activeTab === 'options' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setActiveTab('options')}
                    >
                        💰 ตัวเลือกและราคา
                    </button>
                    <button
                        className={`btn ${activeTab === 'noodles' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setActiveTab('noodles')}
                    >
                        🍝 ประเภทเส้น
                    </button>
                </div>
            </div>

            {/* Categories Tab */}
            {activeTab === 'categories' && (
                <div className="card">
                    <h2>ประเภทก๋วยเตี๋ยว</h2>
                    <form onSubmit={handleAddCategory} style={{ marginBottom: 'var(--spacing-lg)' }}>
                        <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="ชื่อประเภท (เช่น ต้มยำ)"
                                value={newCategory.name}
                                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                                required
                                style={{ flex: 1 }}
                            />
                            <input
                                type="text"
                                className="form-input"
                                placeholder="ลำดับ"
                                value={newCategory.display_order}
                                readOnly
                                style={{ width: '100px', backgroundColor: 'var(--color-bg-secondary)', cursor: 'not-allowed' }}
                            />
                            <button type="submit" className="btn btn-success">+ เพิ่ม</button>
                        </div>
                    </form>

                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEndCategories}
                    >
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th style={{ width: '30px' }}></th>
                                        <th>ลำดับ</th>
                                        <th>ชื่อประเภท</th>
                                        <th style={{ width: '150px' }}>จัดการ</th>
                                    </tr>
                                </thead>
                                <SortableContext
                                    items={categories.map(c => c.id)}
                                    strategy={verticalListSortingStrategy}
                                >
                                    <tbody>
                                        {categories.map((cat) => (
                                            <DraggableRow key={cat.id} id={cat.id}>
                                                <td>
                                                    {editingCategory?.id === cat.id ? (
                                                        <input
                                                            type="number"
                                                            className="form-input"
                                                            value={editingCategory.display_order}
                                                            onChange={(e) => setEditingCategory({ ...editingCategory, display_order: parseInt(e.target.value) || 0 })}
                                                            style={{ width: '80px' }}
                                                        />
                                                    ) : cat.display_order}
                                                </td>
                                                <td>
                                                    {editingCategory?.id === cat.id ? (
                                                        <input
                                                            type="text"
                                                            className="form-input"
                                                            value={editingCategory.name}
                                                            onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                                                        />
                                                    ) : cat.name}
                                                </td>
                                                <td>
                                                    {editingCategory?.id === cat.id ? (
                                                        <div style={{ display: 'flex', gap: '4px' }}>
                                                            <button className="btn btn-success btn-sm" onClick={() => handleUpdateCategory(cat.id)}>
                                                                ✓ บันทึก
                                                            </button>
                                                            <button className="btn btn-secondary btn-sm" onClick={() => setEditingCategory(null)}>
                                                                ✕ ยกเลิก
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div style={{ display: 'flex', gap: '4px' }}>
                                                            <button className="btn btn-primary btn-sm" onClick={() => setEditingCategory(cat)}>
                                                                ✏️ แก้ไข
                                                            </button>
                                                            <button className="btn btn-danger btn-sm" onClick={() => handleDeleteCategory(cat.id)}>
                                                                🗑️ ลบ
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                            </DraggableRow>
                                        ))}
                                    </tbody>
                                </SortableContext>
                            </table>
                        </div>
                    </DndContext>
                </div>
            )}

            {/* Options Tab */}
            {activeTab === 'options' && (
                <div className="card">
                    <h2>ตัวเลือกและราคา</h2>

                    {/* Category Selector */}
                    <div style={{ marginBottom: 'var(--spacing-md)' }}>
                        <label className="form-label">เลือกประเภท:</label>
                        <select
                            className="form-select"
                            value={selectedCategoryId || ''}
                            onChange={(e) => setSelectedCategoryId(parseInt(e.target.value))}
                        >
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                    </div>

                    <form onSubmit={handleAddOption} style={{ marginBottom: 'var(--spacing-lg)' }}>
                        <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="ชื่อตัวเลือก (เช่น หมูนุ่ม)"
                                value={newOption.name}
                                onChange={(e) => setNewOption({ ...newOption, name: e.target.value })}
                                required
                                style={{ flex: 1 }}
                            />
                            <input
                                type="number"
                                className="form-input"
                                placeholder="ราคา"
                                step="0.01"
                                value={newOption.price}
                                onChange={(e) => setNewOption({ ...newOption, price: e.target.value })}
                                required
                                style={{ width: '120px' }}
                            />
                            <input
                                type="text"
                                className="form-input"
                                placeholder="ลำดับ"
                                value={newOption.display_order}
                                readOnly
                                style={{ width: '100px', backgroundColor: 'var(--color-bg-secondary)', cursor: 'not-allowed' }}
                            />
                            <button type="submit" className="btn btn-success">+ เพิ่ม</button>
                        </div>
                    </form>

                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEndOptions}
                    >
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th style={{ width: '30px' }}></th>
                                        <th>ลำดับ</th>
                                        <th>ชื่อตัวเลือก</th>
                                        <th>ราคา (฿)</th>
                                        <th style={{ width: '150px' }}>จัดการ</th>
                                    </tr>
                                </thead>
                                <SortableContext
                                    items={options.map(o => o.id)}
                                    strategy={verticalListSortingStrategy}
                                >
                                    <tbody>
                                        {options.map((opt) => (
                                            <DraggableRow key={opt.id} id={opt.id}>
                                                <td>
                                                    {editingOption?.id === opt.id ? (
                                                        <input
                                                            type="number"
                                                            className="form-input"
                                                            value={editingOption.display_order}
                                                            onChange={(e) => setEditingOption({ ...editingOption, display_order: parseInt(e.target.value) || 0 })}
                                                            style={{ width: '80px' }}
                                                        />
                                                    ) : opt.display_order}
                                                </td>
                                                <td>
                                                    {editingOption?.id === opt.id ? (
                                                        <input
                                                            type="text"
                                                            className="form-input"
                                                            value={editingOption.name}
                                                            onChange={(e) => setEditingOption({ ...editingOption, name: e.target.value })}
                                                        />
                                                    ) : opt.name}
                                                </td>
                                                <td>
                                                    {editingOption?.id === opt.id ? (
                                                        <input
                                                            type="number"
                                                            className="form-input"
                                                            step="0.01"
                                                            value={editingOption.price}
                                                            onChange={(e) => setEditingOption({ ...editingOption, price: e.target.value })}
                                                            style={{ width: '120px' }}
                                                        />
                                                    ) : opt.price.toFixed(2)}
                                                </td>
                                                <td>
                                                    {editingOption?.id === opt.id ? (
                                                        <div style={{ display: 'flex', gap: '4px' }}>
                                                            <button className="btn btn-success btn-sm" onClick={() => handleUpdateOption(opt.id)}>
                                                                ✓ บันทึก
                                                            </button>
                                                            <button className="btn btn-secondary btn-sm" onClick={() => setEditingOption(null)}>
                                                                ✕ ยกเลิก
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div style={{ display: 'flex', gap: '4px' }}>
                                                            <button className="btn btn-primary btn-sm" onClick={() => setEditingOption(opt)}>
                                                                ✏️ แก้ไข
                                                            </button>
                                                            <button className="btn btn-danger btn-sm" onClick={() => handleDeleteOption(opt.id)}>
                                                                🗑️ ลบ
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                            </DraggableRow>
                                        ))}
                                    </tbody>
                                </SortableContext>
                            </table>
                        </div>
                    </DndContext>
                </div>
            )}

            {/* Noodles Tab */}
            {activeTab === 'noodles' && (
                <div className="card">
                    <h2>ประเภทเส้น</h2>
                    <form onSubmit={handleAddNoodle} style={{ marginBottom: 'var(--spacing-lg)' }}>
                        <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="ชื่อประเภทเส้น (เช่น เส้นเล็ก)"
                                value={newNoodle.name}
                                onChange={(e) => setNewNoodle({ ...newNoodle, name: e.target.value })}
                                required
                                style={{ flex: 1 }}
                            />
                            <input
                                type="text"
                                className="form-input"
                                placeholder="ลำดับ"
                                value={newNoodle.display_order}
                                readOnly
                                style={{ width: '100px', backgroundColor: 'var(--color-bg-secondary)', cursor: 'not-allowed' }}
                            />
                            <button type="submit" className="btn btn-success">+ เพิ่ม</button>
                        </div>
                    </form>

                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEndNoodles}
                    >
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th style={{ width: '30px' }}></th>
                                        <th>ลำดับ</th>
                                        <th>ชื่อประเภทเส้น</th>
                                        <th style={{ width: '150px' }}>จัดการ</th>
                                    </tr>
                                </thead>
                                <SortableContext
                                    items={noodles.map(n => n.id)}
                                    strategy={verticalListSortingStrategy}
                                >
                                    <tbody>
                                        {noodles.map((noodle) => (
                                            <DraggableRow key={noodle.id} id={noodle.id}>
                                                <td>
                                                    {editingNoodle?.id === noodle.id ? (
                                                        <input
                                                            type="number"
                                                            className="form-input"
                                                            value={editingNoodle.display_order}
                                                            onChange={(e) => setEditingNoodle({ ...editingNoodle, display_order: parseInt(e.target.value) || 0 })}
                                                            style={{ width: '80px' }}
                                                        />
                                                    ) : noodle.display_order}
                                                </td>
                                                <td>
                                                    {editingNoodle?.id === noodle.id ? (
                                                        <input
                                                            type="text"
                                                            className="form-input"
                                                            value={editingNoodle.name}
                                                            onChange={(e) => setEditingNoodle({ ...editingNoodle, name: e.target.value })}
                                                        />
                                                    ) : noodle.name}
                                                </td>
                                                <td>
                                                    {editingNoodle?.id === noodle.id ? (
                                                        <div style={{ display: 'flex', gap: '4px' }}>
                                                            <button className="btn btn-success btn-sm" onClick={() => handleUpdateNoodle(noodle.id)}>
                                                                ✓ บันทึก
                                                            </button>
                                                            <button className="btn btn-secondary btn-sm" onClick={() => setEditingNoodle(null)}>
                                                                ✕ ยกเลิก
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div style={{ display: 'flex', gap: '4px' }}>
                                                            <button className="btn btn-primary btn-sm" onClick={() => setEditingNoodle(noodle)}>
                                                                ✏️ แก้ไข
                                                            </button>
                                                            <button className="btn btn-danger btn-sm" onClick={() => handleDeleteNoodle(noodle.id)}>
                                                                🗑️ ลบ
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                            </DraggableRow>
                                        ))}
                                    </tbody>
                                </SortableContext>
                            </table>
                        </div>
                    </DndContext>
                </div>
            )}
        </div>
    );
};

export default MenuManagement;
