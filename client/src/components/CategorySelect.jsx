import { useState, useRef, useEffect } from 'react';

import { API_URL } from '../config/api';

const CategorySelect = ({
    value,
    onChange,
    categories,
    type = 'expense', // 'income' or 'expense'
    onCategoryAdded, // Callback when new category is added
    placeholder = "Select or add category",
    required = false
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddNew, setShowAddNew] = useState(false);
    const containerRef = useRef(null);
    const inputRef = useRef(null);

    // Sort categories alphabetically and filter by search term
    const filteredCategories = [...categories]
        .sort((a, b) => a.label.localeCompare(b.label, 'th'))
        .filter(cat => cat.label.toLowerCase().includes(searchTerm.toLowerCase()));

    // Check if search term matches any existing category
    const exactMatch = categories.some(
        cat => cat.label.toLowerCase() === searchTerm.toLowerCase()
    );

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
                setSearchTerm('');
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (category) => {
        onChange(category.value);
        setSearchTerm('');
        setIsOpen(false);
    };

    const handleAddNew = async () => {
        if (searchTerm.trim() && !exactMatch) {
            try {
                const token = localStorage.getItem('token');

                const response = await fetch(`${API_URL}/categories`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        name: searchTerm.trim(),
                        type: type
                    })
                });

                if (response.ok) {
                    const newValue = searchTerm.trim().toLowerCase().replace(/\s+/g, '_');
                    onChange(newValue);
                    setSearchTerm('');
                    setIsOpen(false);

                    // Call callback to refresh categories
                    if (onCategoryAdded) {
                        onCategoryAdded();
                    }
                } else {
                    console.error('Failed to add category');
                }
            } catch (error) {
                console.error('Error adding category:', error);
            }
        }
    };

    const handleInputChange = (e) => {
        setSearchTerm(e.target.value);
        if (!isOpen) setIsOpen(true);
    };

    const handleInputFocus = () => {
        setIsOpen(true);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (filteredCategories.length > 0) {
                handleSelect(filteredCategories[0]);
            } else if (searchTerm.trim() && !exactMatch) {
                handleAddNew();
            }
        }
        if (e.key === 'Escape') {
            setIsOpen(false);
            setSearchTerm('');
        }
    };

    const selectedCategory = categories.find(cat => cat.value === value);
    const displayValue = isOpen ? searchTerm : (selectedCategory?.label || '');

    return (
        <div className="category-select" ref={containerRef}>
            <input
                ref={inputRef}
                type="text"
                className="form-input category-input"
                placeholder={placeholder}
                value={displayValue}
                onChange={handleInputChange}
                onFocus={handleInputFocus}
                onKeyDown={handleKeyDown}
                required={required && !value}
            />
            {/* Hidden input for form validation */}
            <input type="hidden" value={value} required={required} />

            {isOpen && (
                <div className="category-dropdown">
                    {filteredCategories.length > 0 ? (
                        <ul className="category-list">
                            {filteredCategories.map((cat) => (
                                <li
                                    key={cat.value}
                                    className={`category-item ${value === cat.value ? 'selected' : ''}`}
                                    onClick={() => handleSelect(cat)}
                                >
                                    {cat.label}
                                </li>
                            ))}
                        </ul>
                    ) : null}

                    {/* Add new category option */}
                    {searchTerm.trim() && !exactMatch && (
                        <div className="category-add-new" onClick={handleAddNew}>
                            <span className="add-icon">+</span>
                            <span>Add "{searchTerm.trim()}"</span>
                        </div>
                    )}

                    {filteredCategories.length === 0 && !searchTerm.trim() && (
                        <div className="category-empty">
                            Type to search or add new category
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default CategorySelect;
