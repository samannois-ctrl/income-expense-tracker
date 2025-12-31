import { forwardRef } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useSettings } from '../context/SettingsContext';

// Custom input component to show formatted date
const CustomInput = forwardRef(({ value, onClick, placeholder, formattedValue }, ref) => (
    <button
        type="button"
        className="form-input date-picker-input"
        onClick={onClick}
        ref={ref}
    >
        {formattedValue || placeholder || 'Select date'}
    </button>
));

CustomInput.displayName = 'CustomInput';

const ThaiDatePicker = ({
    selected,
    onChange,
    placeholder = 'Select date',
    className = ''
}) => {
    const { dateFormat, formatDisplayDate } = useSettings();

    // Convert string date to Date object if needed
    const selectedDate = selected ? (typeof selected === 'string' ? new Date(selected) : selected) : null;

    // Handle date change - convert to YYYY-MM-DD string format
    const handleChange = (date) => {
        if (date) {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            onChange(`${year}-${month}-${day}`);
        } else {
            onChange('');
        }
    };

    // Get formatted display value
    const getFormattedValue = () => {
        if (!selectedDate) return '';
        return formatDisplayDate(selectedDate);
    };

    // Custom header to show BE year in calendar header
    const renderCustomHeader = ({
        date,
        decreaseMonth,
        increaseMonth,
        prevMonthButtonDisabled,
        nextMonthButtonDisabled,
    }) => {
        const monthNames = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
            'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];

        let year = date.getFullYear();
        if (dateFormat === 'be') {
            year += 543;
        }

        return (
            <div className="date-picker-header">
                <button
                    type="button"
                    onClick={decreaseMonth}
                    disabled={prevMonthButtonDisabled}
                    className="date-picker-nav-btn"
                >
                    ‹
                </button>
                <span className="date-picker-header-title">
                    {monthNames[date.getMonth()]} {year}
                </span>
                <button
                    type="button"
                    onClick={increaseMonth}
                    disabled={nextMonthButtonDisabled}
                    className="date-picker-nav-btn"
                >
                    ›
                </button>
            </div>
        );
    };

    return (
        <div className={`thai-date-picker ${className}`}>
            <DatePicker
                selected={selectedDate}
                onChange={handleChange}
                customInput={<CustomInput formattedValue={getFormattedValue()} placeholder={placeholder} />}
                renderCustomHeader={renderCustomHeader}
                dateFormat="dd/MM/yyyy"
                placeholderText={placeholder}
                popperPlacement="bottom-start"
                showPopperArrow={false}
                popperClassName="datepicker-popper-high-z"
            />
        </div>
    );
};

export default ThaiDatePicker;
