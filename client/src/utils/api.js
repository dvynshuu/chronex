/**
 * Standardized fetch wrapper that automatically includes the JWT token from localStorage.
 */
const API_BASE_URL = import.meta.env.MODE === 'development' ? '' : (import.meta.env.VITE_API_URL || '');

export const fetchWithAuth = async (url, options = {}) => {
    // ... rest of logic
    const token = localStorage.getItem('chronex_token');
    
    const headers = {
        ...options.headers,
        ...(token ? { Authorization: `Bearer ${token}` } : {})
    };

    if (options.body && !(options.body instanceof FormData) && !headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${API_BASE_URL}${url}`, {
        ...options,
        headers
    });

    if (response.status === 401) {
        // Optional: Trigger global logout or redirect to login
        // localStorage.removeItem('chronex_token');
        // window.location.href = '/login';
    }

    return response;
};

export default fetchWithAuth;
