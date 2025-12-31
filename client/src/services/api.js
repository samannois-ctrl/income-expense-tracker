import axios from 'axios';
import { API_URL } from '../config/api.js';

const api = axios.create({
    baseURL: API_URL,
});

// Add token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle 401 errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Auth
export const login = (username, password) => api.post('/auth/login', { username, password });
export const register = (data) => api.post('/auth/register', data);
export const getMe = () => api.get('/auth/me');

// Users
export const getUsers = () => api.get('/users');
export const createUser = (data) => api.post('/users', data, { headers: { 'Content-Type': 'multipart/form-data' } });
export const updateUser = (id, data) => api.put(`/users/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
export const deleteUser = (id) => api.delete(`/users/${id}`);

// Transactions
export const getTransactions = (params) => api.get('/transactions', { params });
export const getSummary = (params) => api.get('/transactions/summary', { params });
export const createTransaction = (data) => api.post('/transactions', data);
export const updateTransaction = (id, data) => api.put(`/transactions/${id}`, data);
export const deleteTransaction = (id) => api.delete(`/transactions/${id}`);

export default api;
