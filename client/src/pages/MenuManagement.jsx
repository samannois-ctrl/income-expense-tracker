import { useState, useEffect, useRef } from 'react';
import { useSettings } from '../context/SettingsContext';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { API_URL } from '../config/api';

// --- Inline Edit Component ---
const InlineEdit = ({ value, onSave, label, type = 'text', suffix = '' }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(value);
    const inputRef = useRef(null);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    useEffect(() => {
        setEditValue(value);
    }, [value]);

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            save();
        } else if (e.key === 'Escape') {
            cancel();
        }
    };

    const save = () => {
        if (editValue !== value) {
            onSave(editValue);
        }
        setIsEditing(false);
    };

    const cancel = () => {
        setEditValue(value);
        setIsEditing(false);
    };

    if (isEditing) {
        return (
            <input
                ref={inputRef}
                type={type}
                className="form-input"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={save}
                onKeyDown={handleKeyDown}
                style={{
                    margin: 0,
                    padding: '2px 6px',
                    fontSize: 'inherit',
                    fontWeight: 'inherit',
                    width: type === 'number' ? '80px' : '100%',
                    minWidth: '50px'
                }}
            />
        );
    }

    return (
        <span
            onClick={() => setIsEditing(true)}
            style={{
                cursor: 'pointer',
                borderBottom: '1px dashed #ccc',
                paddingBottom: '1px',
                display: 'inline-block',
                minWidth: '20px'
            }}
            title={`Click to edit ${label}`}
        >
            {value}
            {suffix}
        </span>
    );
};

// --- Sortable Item Component ---
const SortableItem = ({ id, children, disabled }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id, disabled });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        position: 'relative',
        zIndex: isDragging ? 1000 : 'auto',
    };

    // Pass attributes and listeners to children if it's a function
    if (typeof children === 'function') {
        return (
            <div ref={setNodeRef} style={style}>
                {children({ attributes, listeners, isDragging })}
            </div>
        );
    }

    return <div ref={setNodeRef} style={style} {...attributes} {...listeners}>{children}</div>;
};

const MenuManagement = () => {
    const { t } = useSettings();
    const [activeTab, setActiveTab] = useState('structure'); // structure, options, config

    // Data
    const [categories, setCategories] = useState([]);
    const [menus, setMenus] = useState([]);
    const [optionGroups, setOptionGroups] = useState([]);
    const [options, setOptions] = useState([]);
    const [configs, setConfigs] = useState([]); // Currently viewed menu configs

    // UI State
    const [selectedMenu, setSelectedMenu] = useState(null); // For Config Tab
    const [loading, setLoading] = useState(false);
    const [activeId, setActiveId] = useState(null); // For DragOverlay

    // Inputs
    const [newCatName, setNewCatName] = useState('');

    // Per-category inputs for creating new menus: { [catId]: { name: '', price: '' } }
    const [newMenuInputs, setNewMenuInputs] = useState({});

    // Option Group Inputs
    const [newGroupName, setNewGroupName] = useState('');
    const [newGroupType, setNewGroupType] = useState('single'); // 'single' | 'multiple'
    const [newGroupOptional, setNewGroupOptional] = useState(false);

    // Per-group inputs for creating new options: { [groupId]: { name: '', price: '' } }
    const [newOptionInputs, setNewOptionInputs] = useState({});

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }), // Require 8px drag to preventing accidental clicks
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const headers = { 'Authorization': `Bearer ${token}` };

            const [c, m, og, o] = await Promise.all([
                fetch(`${API_URL}/menu/categories`, { headers }).then(r => r.json()),
                fetch(`${API_URL}/menu/menus`, { headers }).then(r => r.json()),
                fetch(`${API_URL}/menu/option-groups`, { headers }).then(r => r.json()),
                fetch(`${API_URL}/menu/options`, { headers }).then(r => r.json())
            ]);

            setCategories(c.data.sort((a, b) => a.display_order - b.display_order) || []);
            setMenus(m.data.sort((a, b) => a.display_order - b.display_order) || []);
            setOptionGroups(og.data || []);
            setOptions(o.data || []);
        } finally {
            setLoading(false);
        }
    };

    const fetchMenuConfig = async (menuId) => {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/menu/config/${menuId}`, { headers: { 'Authorization': `Bearer ${token}` } });
        const json = await res.json();
        setConfigs(json.data || []);
    };

    // --- Actions ---

    // Helper to update specific category input
    const updateMenuInput = (catId, field, value) => {
        setNewMenuInputs(prev => ({
            ...prev,
            [catId]: {
                ...prev[catId],
                [field]: value
            }
        }));
    };

    // Helper to update specific option group input
    const updateOptionInput = (groupId, field, value) => {
        setNewOptionInputs(prev => ({
            ...prev,
            [groupId]: {
                ...prev[groupId],
                [field]: value
            }
        }));
    };

    const postData = async (endpoint, body, method = 'POST') => {
        const token = localStorage.getItem('token');
        await fetch(`${API_URL}${endpoint}`, {
            method: method,
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(body)
        });
    };

    // --- Inline Updates ---

    const updateCategory = async (id, name) => {
        await postData(`/menu/categories/${id}`, { name }, 'PUT');
        fetchData();
    };

    const updateMenu = async (id, updates) => {
        // Need to fetch current menu to merge? Or backend handles partials?
        // My backend uses "IFNULL(?, is_active)" style for some fields but expects others.
        // For menu: name = ?, base_price = ?
        // I should send both or existing.
        // Let's find the current menu item to be safe
        const menu = menus.find(m => m.id === id);
        if (!menu) return;

        await postData(`/menu/menus/${id}`, {
            name: updates.name !== undefined ? updates.name : menu.name,
            base_price: updates.base_price !== undefined ? updates.base_price : menu.base_price,
            is_active: menu.is_active
        }, 'PUT');
        fetchData();
    };

    const updateOptionGroup = async (id, name) => {
        const group = optionGroups.find(g => g.id === id);
        if (!group) return;
        await postData(`/menu/option-groups/${id}`, {
            name,
            selection_type: group.selection_type,
            is_optional: group.is_optional // keep existing
        }, 'PUT');
        fetchData();
    };

    const updateOption = async (id, updates) => {
        const opt = options.find(o => o.id === id);
        if (!opt) return;

        await postData(`/menu/options/${id}`, {
            name: updates.name !== undefined ? updates.name : opt.name,
            price_adjustment: updates.price_adjustment !== undefined ? updates.price_adjustment : opt.price_adjustment,
            is_available: opt.is_available
        }, 'PUT');
        fetchData();
    };

    // --- Creation & Deletion ---

    const addCategory = async () => {
        if (!newCatName) return;
        await postData('/menu/categories', { name: newCatName });
        setNewCatName('');
        fetchData();
    };

    const addMenu = async (catId) => {
        const input = newMenuInputs[catId] || {};
        const name = input.name;
        const price = input.price;

        if (!name) return;

        await postData('/menu/menus', { category_id: catId, name: name, base_price: price });

        setNewMenuInputs(prev => ({
            ...prev,
            [catId]: { name: '', price: '' }
        }));

        fetchData();
    };

    const deleteMenu = async (id) => {
        if (!confirm(t('menuManagement.deleteMenuConfirm'))) return;
        await postData(`/menu/menus/${id}`, {}, 'DELETE');
        fetchData();
    };

    const addOptionGroup = async () => {
        if (!newGroupName) return;
        await postData('/menu/option-groups', {
            name: newGroupName,
            selection_type: newGroupType,
            is_optional: newGroupOptional
        });
        setNewGroupName('');
        setNewGroupType('single');
        setNewGroupOptional(false);
        fetchData();
    };

    const addOption = async (groupId) => {
        const input = newOptionInputs[groupId] || {};
        const name = input.name;
        const price = input.price;

        if (!name) return;

        await postData('/menu/options', { group_id: groupId, name: name, price_adjustment: price });

        setNewOptionInputs(prev => ({
            ...prev,
            [groupId]: { name: '', price: '' }
        }));

        fetchData();
    };

    const toggleOptionGroupRequired = async (group) => {
        const newOptionalValue = !group.is_optional;
        await postData(`/menu/option-groups/${group.id}`, {
            name: group.name,
            selection_type: group.selection_type,
            is_optional: newOptionalValue
        }, 'PUT');
        fetchData();
    };

    const toggleOptionGroupSelectionType = async (group) => {
        const newType = group.selection_type === 'single' ? 'multiple' : 'single';
        await postData(`/menu/option-groups/${group.id}`, {
            name: group.name,
            selection_type: newType,
            is_optional: group.is_optional
        }, 'PUT');
        fetchData();
    };

    const deleteOptionGroup = async (id) => {
        if (!confirm(t('menuManagement.confirmDeleteGroup'))) return;
        await postData(`/menu/option-groups/${id}`, {}, 'DELETE');
        fetchData();
    };

    const deleteOption = async (id) => {
        if (!confirm(t('menuManagement.deleteOptionConfirm'))) return;
        await postData(`/menu/options/${id}`, {}, 'DELETE');
        fetchData();
    };

    const toggleConfig = async (groupId, enabled) => {
        if (!selectedMenu) return;
        await postData('/menu/config/toggle', {
            menu_id: selectedMenu.id,
            option_group_id: groupId,
            enabled,
            is_required: true // Default to required or use group default? The backend handles it.
            // Actually the backend endpoint expects { menu_id, option_group_id, enabled, is_required } where is_required defaults to 1 if undefined.
            // For now let's just send enabled.
        });
        fetchMenuConfig(selectedMenu.id);
    };

    // --- Drag and Drop Handlers ---

    const handleDragStart = (event) => {
        setActiveId(event.active.id);
    };

    const handleDragEnd = async (event) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over) return;

        const activeIdStr = String(active.id);
        const overIdStr = String(over.id);

        if (activeIdStr === overIdStr) return;

        if (activeIdStr.startsWith('cat-') && overIdStr.startsWith('cat-')) {
            const oldIndex = categories.findIndex(c => `cat-${c.id}` === activeIdStr);
            const newIndex = categories.findIndex(c => `cat-${c.id}` === overIdStr);

            if (oldIndex !== -1 && newIndex !== -1) {
                const newItems = arrayMove(categories, oldIndex, newIndex);
                setCategories(newItems);
                const orderedIds = newItems.map(c => c.id);
                await postData('/menu/categories/reorder', { orderedIds });
            }
        }
        else if (activeIdStr.startsWith('menu-') && overIdStr.startsWith('menu-')) {
            const oldIndex = menus.findIndex(m => `menu-${m.id}` === activeIdStr);
            const newIndex = menus.findIndex(m => `menu-${m.id}` === overIdStr);

            if (oldIndex !== -1 && newIndex !== -1) {
                if (menus[oldIndex].category_id === menus[newIndex].category_id) {
                    const newItems = arrayMove(menus, oldIndex, newIndex);
                    setMenus(newItems);
                    const orderedIds = newItems.map(m => m.id);
                    await postData('/menu/menus/reorder', { orderedIds });
                }
            }
        }
    };


    // --- Renderers ---

    const renderStructureTab = () => (
        <div>
            <div className="card" style={{ marginBottom: '1rem' }}>
                <h3>{t('menuManagement.createCategory')}</h3>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input className="form-input" value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder={t('menuManagement.categoryNamePlaceholder')} />
                    <button className="btn btn-success" onClick={addCategory}>{t('menuManagement.add')}</button>
                </div>
            </div>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={categories.map(c => `cat-${c.id}`)}
                    strategy={verticalListSortingStrategy}
                >
                    {categories.map(cat => (
                        <SortableItem key={`cat-${cat.id}`} id={`cat-${cat.id}`}>
                            {({ attributes, listeners }) => (
                                <div className="card" style={{ marginBottom: '1rem', borderLeft: '4px solid var(--primary-color)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                                        {/* Handle for Category */}
                                        <span
                                            {...attributes}
                                            {...listeners}
                                            style={{ fontSize: '1.2rem', marginRight: '0.5rem', cursor: 'grab', touchAction: 'none' }}
                                        >
                                            ☰
                                        </span>
                                        <h3 style={{ margin: 0 }}>
                                            <InlineEdit
                                                value={cat.name}
                                                onSave={(val) => updateCategory(cat.id, val)}
                                                label={t('menuManagement.categoryNamePlaceholder')}
                                            />
                                        </h3>
                                    </div>

                                    <div style={{ marginLeft: '1rem' }}>

                                        <SortableContext
                                            items={menus.filter(m => m.category_id === cat.id).map(m => `menu-${m.id}`)}
                                            strategy={verticalListSortingStrategy}
                                        >
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                {menus.filter(m => m.category_id === cat.id).map(menu => (
                                                    <SortableItem key={`menu-${menu.id}`} id={`menu-${menu.id}`}>
                                                        {({ attributes: menuAttrs, listeners: menuListeners }) => (
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', border: '1px solid #eee', borderRadius: '4px', backgroundColor: 'white' }}>
                                                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                                                    {/* Handle for Menu */}
                                                                    <span
                                                                        {...menuAttrs}
                                                                        {...menuListeners}
                                                                        style={{ color: '#ccc', marginRight: '0.5rem', cursor: 'grab', fontSize: '1.2rem', touchAction: 'none' }}
                                                                    >
                                                                        ::
                                                                    </span>
                                                                    <span style={{ fontWeight: '500' }}>
                                                                        <InlineEdit
                                                                            value={menu.name}
                                                                            onSave={(val) => updateMenu(menu.id, { name: val })}
                                                                            label={t('menuManagement.menuNamePlaceholder')}
                                                                        />
                                                                    </span>
                                                                </div>
                                                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                                                    <span>
                                                                        <InlineEdit
                                                                            value={menu.base_price}
                                                                            onSave={(val) => updateMenu(menu.id, { base_price: val })}
                                                                            label={t('menuManagement.pricePlaceholder')}
                                                                            type="number"
                                                                            suffix="฿"
                                                                        />
                                                                    </span>
                                                                    <button
                                                                        className="btn btn-danger btn-sm"
                                                                        style={{ padding: '0 0.5rem' }}
                                                                        onPointerDown={(e) => e.stopPropagation()}
                                                                        onClick={() => deleteMenu(menu.id)}
                                                                    >
                                                                        🗑️
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </SortableItem>
                                                ))}
                                            </div>
                                        </SortableContext>

                                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                                            <input
                                                className="form-input"
                                                value={newMenuInputs[cat.id]?.name || ''}
                                                onChange={e => updateMenuInput(cat.id, 'name', e.target.value)}
                                                placeholder={t('menuManagement.menuNamePlaceholder')}
                                                style={{ marginBottom: 0 }}
                                            />
                                            <input
                                                className="form-input"
                                                type="number"
                                                value={newMenuInputs[cat.id]?.price || ''}
                                                onChange={e => updateMenuInput(cat.id, 'price', e.target.value)}
                                                placeholder={t('menuManagement.pricePlaceholder')}
                                                style={{ width: '80px', marginBottom: 0 }}
                                            />
                                            <button className="btn btn-primary btn-sm" onClick={() => addMenu(cat.id)}>+ {t('menuManagement.menu')}</button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </SortableItem>
                    ))}
                </SortableContext>

                <DragOverlay>
                    {activeId ? (
                        <div style={{ padding: '1rem', border: '1px solid #ccc', backgroundColor: '#fff', opacity: 0.8, borderRadius: '4px' }}>
                            {t('menuManagement.dragging')}
                        </div>
                    ) : null}
                </DragOverlay>

            </DndContext>
        </div>
    );

    const renderOptionsTab = () => (
        <div>
            <div className="card" style={{ marginBottom: '1rem' }}>
                <h3>{t('menuManagement.createOptionGroup')}</h3>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <input
                        className="form-input"
                        value={newGroupName}
                        onChange={e => setNewGroupName(e.target.value)}
                        placeholder={t('menuManagement.groupNamePlaceholder')}
                        style={{ marginBottom: 0, flex: 1, minWidth: '200px' }}
                    />

                    <select
                        className="form-input"
                        value={newGroupType}
                        onChange={e => setNewGroupType(e.target.value)}
                        style={{ marginBottom: 0, width: 'auto' }}
                    >
                        <option value="single">{t('menuManagement.singleSelect')}</option>
                        <option value="multiple">{t('menuManagement.multipleSelect')}</option>
                    </select>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                        <input
                            type="checkbox"
                            checked={newGroupOptional}
                            onChange={e => setNewGroupOptional(e.target.checked)}
                        />
                        {t('menuManagement.optionalQuestion')}
                    </label>

                    <button className="btn btn-success" onClick={addOptionGroup}>{t('menuManagement.add')}</button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                {optionGroups.map(group => (
                    <div key={group.id} className="card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <h4 style={{ marginTop: 0, marginBottom: '0.25rem' }}>
                                    <InlineEdit
                                        value={group.name}
                                        onSave={(val) => updateOptionGroup(group.id, val)}
                                        label={t('menuManagement.groupNamePlaceholder')}
                                    />
                                </h4>
                                <div style={{ fontSize: '0.8rem', color: '#666', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <span
                                        className={`badge ${group.selection_type === 'single' ? 'badge-info' : 'badge-warning'}`}
                                        onClick={() => toggleOptionGroupSelectionType(group)}
                                        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                                        title={t('menuManagement.toggleSelectionType')}
                                    >
                                        {group.selection_type === 'single' ? `🔘 ${t('menuManagement.selectionSingle')}` : `☑️ ${t('menuManagement.selectionMultiple')}`}
                                    </span>

                                    <label style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        cursor: 'pointer',
                                        gap: '8px',
                                        border: !group.is_optional ? '2px solid #d32f2f' : '1px solid #ccc',
                                        padding: '6px 12px',
                                        borderRadius: '20px',
                                        backgroundColor: !group.is_optional ? '#ffebee' : 'white',
                                        transition: 'all 0.2s'
                                    }}>
                                        <input
                                            type="checkbox"
                                            checked={!group.is_optional}
                                            onChange={() => toggleOptionGroupRequired(group)}
                                            style={{ display: 'none' }}
                                        />
                                        <span style={{ fontSize: '1.2rem', display: 'flex', marginRight: '4px' }}>
                                            {!group.is_optional ? '🔴' : '⚪'}
                                        </span>
                                        <span style={{
                                            color: !group.is_optional ? '#d32f2f' : '#888',
                                            fontWeight: !group.is_optional ? 'bold' : 'normal',
                                            textTransform: 'uppercase',
                                            fontSize: '0.85rem'
                                        }}>
                                            {t('menuManagement.required')}
                                        </span>
                                    </label>
                                </div>
                            </div>
                            <button className="btn btn-danger btn-sm" onClick={() => deleteOptionGroup(group.id)}>🗑️</button>
                        </div>

                        <div style={{ margin: '1rem 0', borderTop: '1px solid #eee', paddingTop: '0.5rem' }}>
                            {options.filter(o => o.group_id === group.id).map(opt => (
                                <div key={opt.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', fontSize: '0.9rem' }}>
                                    <span style={{ flex: 1 }}>
                                        <InlineEdit
                                            value={opt.name}
                                            onSave={(val) => updateOption(opt.id, { name: val })}
                                            label={t('menuManagement.optionNamePlaceholder')}
                                        />
                                    </span>
                                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                        <span style={{ color: opt.price_adjustment > 0 ? 'green' : '#999', cursor: 'pointer' }}>
                                            +<InlineEdit
                                                value={opt.price_adjustment}
                                                onSave={(val) => updateOption(opt.id, { price_adjustment: val })}
                                                label={t('menuManagement.pricePlaceholder')}
                                                type="number"
                                            />
                                        </span>
                                        <button className="btn btn-danger btn-sm" style={{ padding: '0 0.5rem' }} onClick={() => deleteOption(opt.id)}>×</button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                            <input
                                className="form-input"
                                value={newOptionInputs[group.id]?.name || ''}
                                onChange={e => updateOptionInput(group.id, 'name', e.target.value)}
                                placeholder={t('menuManagement.optionNamePlaceholder')}
                                style={{ marginBottom: 0, fontSize: '0.9rem' }}
                            />
                            <input
                                className="form-input"
                                type="number"
                                value={newOptionInputs[group.id]?.price || ''}
                                onChange={e => updateOptionInput(group.id, 'price', e.target.value)}
                                placeholder="+Price"
                                style={{ width: '60px', marginBottom: 0, fontSize: '0.9rem' }}
                            />
                            <button className="btn btn-secondary btn-sm" onClick={() => addOption(group.id)}>+</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderConfigTab = () => (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
            {/* Left: Menu Selector */}
            <div className="card">
                <h3>{t('menuManagement.selectMenuToConfig')}</h3>
                {[...menus].sort((a, b) => {
                    const catA = categories.find(c => c.id === a.category_id);
                    const catB = categories.find(c => c.id === b.category_id);

                    const catOrderA = catA ? catA.display_order : 9999;
                    const catOrderB = catB ? catB.display_order : 9999;

                    if (catOrderA !== catOrderB) {
                        return catOrderA - catOrderB;
                    }
                    return a.display_order - b.display_order;
                }).map(menu => (
                    <div
                        key={menu.id}
                        onClick={() => { setSelectedMenu(menu); fetchMenuConfig(menu.id); }}
                        style={{
                            padding: '0.75rem',
                            cursor: 'pointer',
                            backgroundColor: selectedMenu?.id === menu.id ? '#3b82f6' : 'transparent',
                            color: selectedMenu?.id === menu.id ? 'white' : 'inherit',
                            borderRadius: '4px',
                            marginBottom: '0.25rem',
                            borderLeft: selectedMenu?.id === menu.id ? 'none' : '2px solid transparent'
                        }}
                    >
                        <div style={{ fontSize: '0.75rem', opacity: 0.7, marginBottom: '2px' }}>
                            {categories.find(c => c.id === menu.category_id)?.name || t('menuManagement.uncategorized')}
                        </div>
                        <div style={{ fontWeight: '500' }}>{menu.name}</div>
                    </div>
                ))}
            </div>

            {/* Right: Configuration */}
            <div className="card">
                {selectedMenu ? (
                    <>
                        <h2>{t('menuManagement.configuring', { name: selectedMenu.name })}</h2>
                        <p>{t('menuManagement.configInstruction')}</p>

                        <div style={{ display: 'grid', gap: '0.5rem' }}>
                            {optionGroups.map(group => {
                                const config = configs.find(c => c.option_group_id === group.id);
                                const isEnabled = !!config;

                                return (
                                    <div key={group.id} style={{ display: 'flex', alignItems: 'center', padding: '1rem', border: '1px solid #eee', borderRadius: '8px', backgroundColor: isEnabled ? '#f0f9ff' : 'white', justifyContent: 'space-between' }}>
                                        <div style={{ display: 'flex', alignItems: 'center' }}>
                                            <label style={{ marginRight: '1rem', cursor: 'pointer', position: 'relative', display: 'flex', alignItems: 'center' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={isEnabled}
                                                    onChange={(e) => toggleConfig(group.id, e.target.checked)}
                                                    style={{ display: 'none' }}
                                                />
                                                <div style={{
                                                    width: '24px',
                                                    height: '24px',
                                                    border: '2px solid #555',
                                                    borderRadius: '4px',
                                                    backgroundColor: isEnabled ? '#3b82f6' : 'white',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    color: 'white',
                                                    fontSize: '18px',
                                                    fontWeight: 'bold',
                                                    transition: 'all 0.1s'
                                                }}>
                                                    {isEnabled && '✓'}
                                                </div>
                                            </label>
                                            <div>
                                                <span style={{ fontWeight: 'bold', fontSize: '1.1rem', display: 'block' }}>{group.name}</span>
                                                <span style={{ fontSize: '0.85rem', color: '#666' }}>
                                                    {group.selection_type === 'single' ? t('menuManagement.selectionSingle') : t('menuManagement.selectionMultiple')} • {group.is_optional ? t('menuManagement.optional') : t('menuManagement.forced')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#aaa' }}>
                        {t('menuManagement.selectMenuInstruction')}
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div className="page-header">
                <h1 className="page-title">⚙️ {t('menuManagement.advancedTitle')}</h1>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                <button className={`btn ${activeTab === 'structure' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('structure')}>{t('menuManagement.tabStructure')}</button>
                <button className={`btn ${activeTab === 'options' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('options')}>{t('menuManagement.tabOptions')}</button>
                <button className={`btn ${activeTab === 'config' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('config')}>{t('menuManagement.tabConfig')}</button>
            </div>

            {activeTab === 'structure' && renderStructureTab()}
            {activeTab === 'options' && renderOptionsTab()}
            {activeTab === 'config' && renderConfigTab()}
        </div>
    );
};

export default MenuManagement;
