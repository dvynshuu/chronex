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
        const refreshToken = localStorage.getItem('chronex_refresh_token');
        if (refreshToken) {
            try {
                const refreshRes = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ refreshToken })
                });

                if (refreshRes.ok) {
                    const data = await refreshRes.json();
                    localStorage.setItem('chronex_token', data.accessToken);
                    localStorage.setItem('chronex_refresh_token', data.refreshToken);
                    
                    // Retry with new token
                    const retryHeaders = {
                        ...headers,
                        Authorization: `Bearer ${data.accessToken}`
                    };
                    return await fetch(`${API_BASE_URL}${url}`, {
                        ...options,
                        headers: retryHeaders
                    });
                }
            } catch (err) {
                console.error('Refresh failed:', err);
            }
        }
        
        // If refresh fails or no token, clear and possibly redirect
        localStorage.removeItem('chronex_token');
        localStorage.removeItem('chronex_refresh_token');
        window.dispatchEvent(new Event('chronex:logout'));
    }

    return response;
};

export default fetchWithAuth;
