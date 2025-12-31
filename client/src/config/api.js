// API Configuration
const getApiUrl = () => {
    // ถ้าเป็น production (ผ่าน Cloudflare Tunnel)
    if (window.location.hostname.includes('trycloudflare.com') ||
        window.location.hostname !== 'localhost') {
        // ใช้ relative path เพื่อให้ผ่าน proxy
        return '/api';
    }
    // Development - ใช้ localhost
    return 'http://localhost:3001/api';
};

const getBaseUrl = () => {
    if (window.location.hostname.includes('trycloudflare.com') ||
        window.location.hostname !== 'localhost') {
        return '';
    }
    return 'http://localhost:3001';
};

export const API_URL = getApiUrl();
export const BASE_URL = getBaseUrl();
