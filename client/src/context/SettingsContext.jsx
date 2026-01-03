import { createContext, useContext, useState, useEffect } from 'react';
import thTranslations from '../locales/th.json';
import enTranslations from '../locales/en.json';

const SettingsContext = createContext();

const translations = {
    th: thTranslations,
    en: enTranslations,
};

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};

export const SettingsProvider = ({ children }) => {
    // Load settings from localStorage
    const [dateFormat, setDateFormat] = useState(() => {
        return localStorage.getItem('dateFormat') || 'ce'; // 'ce' = Christian Era, 'be' = Buddhist Era
    });

    const [language, setLanguage] = useState(() => {
        return localStorage.getItem('language') || 'th'; // 'th' = Thai, 'en' = English
    });

    // Save settings to localStorage when changed
    useEffect(() => {
        localStorage.setItem('dateFormat', dateFormat);
    }, [dateFormat]);

    useEffect(() => {
        localStorage.setItem('language', language);
    }, [language]);

    // Translation function
    const t = (key, params = {}) => {
        const keys = key.split('.');
        let value = translations[language];

        for (const k of keys) {
            if (value && value[k]) {
                value = value[k];
            } else {
                // Fallback to key if translation not found
                return key;
            }
        }

        // Handle parameter substitution
        if (typeof value === 'string' && Object.keys(params).length > 0) {
            return value.replace(/\{(\w+)\}/g, (match, key) => {
                return params[key] !== undefined ? params[key] : match;
            });
        }

        return value;
    };

    // Format date based on selected format and language
    const formatDisplayDate = (dateString, options = {}) => {
        const date = new Date(dateString);
        const day = date.getDate();
        const month = date.getMonth();
        let year = date.getFullYear();

        // Convert to Buddhist Era if selected (add 543 years)
        if (dateFormat === 'be') {
            year += 543;
        }

        const monthNamesTh = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
            'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

        const monthNamesEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        const monthNames = language === 'th' ? monthNamesTh : monthNamesEn;

        if (options.short) {
            return `${day} ${monthNames[month]}`;
        }

        if (options.full) {
            const monthFullNamesTh = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
                'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
            const monthFullNamesEn = ['January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'];
            const monthFullNames = language === 'th' ? monthFullNamesTh : monthFullNamesEn;
            return `${day} ${monthFullNames[month]} ${year}`;
        }

        // Default format: DD/MM/YYYY
        const dayStr = String(day).padStart(2, '0');
        const monthStr = String(month + 1).padStart(2, '0');
        return `${dayStr}/${monthStr}/${year}`;
    };

    const value = {
        dateFormat,
        setDateFormat,
        formatDisplayDate,
        isThaiYear: dateFormat === 'be',
        language,
        setLanguage,
        t,
    };

    return (
        <SettingsContext.Provider value={value}>
            {children}
        </SettingsContext.Provider>
    );
};

export default SettingsContext;
