import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { fetchWithAuth } from '../utils/api';
import './Onboarding.css';

const GoogleCallback = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [status, setStatus] = useState('Completing connection...');

    useEffect(() => {
        const handleCallback = async () => {
            const query = new URLSearchParams(location.search);
            const code = query.get('code');
            const state = query.get('state');

            if (!code) {
                setStatus('Failed to get authorization code.');
                setTimeout(() => navigate('/onboarding'), 2000);
                return;
            }

            try {
                const res = await fetchWithAuth('/api/v1/availability/google/callback', {
                    method: 'POST',
                    body: JSON.stringify({ code, state })
                });

                if (res.ok) {
                    setStatus('Successfully connected! Returning to onboarding...');
                    // Redirect back to onboarding but skip to the scanning step
                    // We can use state or a query param to tell Onboarding to start at step 2
                    setTimeout(() => navigate('/onboarding?step=2'), 1500);
                } else {
                    const data = await res.json();
                    setStatus(`Error: ${data.message || 'Connection failed'}`);
                    setTimeout(() => navigate('/onboarding'), 3000);
                }
            } catch (err) {
                console.error('Callback error:', err);
                setStatus('An unexpected error occurred.');
                setTimeout(() => navigate('/onboarding'), 3000);
            }
        };

        handleCallback();
    }, [location, navigate]);

    return (
        <div className="onboarding">
            <div className="onboarding__container">
                <div className="onboarding__card">
                    <div className="onboarding__icon">🔄</div>
                    <h1 className="onboarding__title">Authenticating</h1>
                    <p className="onboarding__text">{status}</p>
                    <div className="onboarding__scan-bar">
                        <div className="onboarding__scan-fill" style={{ width: '100%', animation: 'livemapScan 2s linear infinite' }} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GoogleCallback;
