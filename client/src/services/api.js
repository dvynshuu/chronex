import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
    withCredentials: true,
});

// Add a request interceptor for logging/debugging
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('chronex_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;
