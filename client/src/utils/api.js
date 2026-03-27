/**
 * Standardized fetch wrapper that automatically includes the JWT token from localStorage.
 */
export const fetchWithAuth = async (url, options = {}) => {
    const token = localStorage.getItem('chronex_token');
    
    const headers = {
        ...options.headers,
        ...(token ? { Authorization: `Bearer ${token}` } : {})
    };

    // Auto-set Content-Type to JSON if sending a body and none provided
    if (options.body && !(options.body instanceof FormData) && !headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(url, {
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
