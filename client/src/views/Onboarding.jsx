import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { fetchWithAuth } from '../utils/api';
import './Onboarding.css';

const steps = [
    {
        id: 'welcome',
        title: 'Welcome to Chronex',
        subtitle: 'The Coordination Engine for high-performance teams.',
        content: 'We’re here to fix one thing: the high cost of fragmented time. Let’s reclaim your team’s focus.',
        icon: '⚡'
    },
    {
        id: 'calendar',
        title: 'Connect your Work Graph',
        subtitle: 'The magic starts with data.',
        content: 'Sync your calendar to let Chronex analyze meeting pain, focus fragmentation, and timezone equity across your organization.',
        icon: '📅',
        action: 'Connect Google Calendar'
    },
    {
        id: 'scanning',
        title: 'Analyzing your Flow...',
        subtitle: 'Scanning next 72 hours of team coordination.',
        content: 'Our engine is identifying fragmentation, sleep disruption risks, and timezone imbalances.',
        icon: '🔍',
        isAutoProgress: true
    },
    {
        id: 'result',
        title: 'Foundations Set',
        subtitle: 'Analysis Complete.',
        content: 'We found 4.2 hours of focus time we can recover for you this week by optimizing 3 meetings.',
        icon: '✨'
    }
];

const Onboarding = () => {
    const navigate = useNavigate();
    const location = useLocation();
    
    // Check if we returned from OAuth with a specific step
    const query = new URLSearchParams(location.search);
    const initialStep = parseInt(query.get('step')) || 0;

    const [currentStep, setCurrentStep] = useState(initialStep);
    const [isConnecting, setIsConnecting] = useState(false);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        if (currentStep < steps.length && steps[currentStep].isAutoProgress) {
            const timer = setInterval(() => {
                setProgress(prev => {
                    if (prev >= 100) {
                        clearInterval(timer);
                        setTimeout(() => {
                            if (currentStep < steps.length - 1) {
                                setCurrentStep(prevStep => prevStep + 1);
                            }
                        }, 500);
                        return 100;
                    }
                    return prev + 2;
                });
            }, 50);
            return () => clearInterval(timer);
        }
    }, [currentStep]);

    const handleNext = async () => {
        if (currentStep === 1) {
            setIsConnecting(true);
            try {
                const res = await fetchWithAuth('/api/v1/availability/google/url');
                const data = await res.json();
                
                if (data.url) {
                    // Redirect to Google
                    window.location.href = data.url;
                } else {
                    throw new Error('Could not get auth URL');
                }
            } catch (err) {
                console.error('Google Auth Error:', err);
                setIsConnecting(false);
                // Fallback to simulation if OAuth fails (e.g. no .env vars)
                setCurrentStep(prev => prev + 1);
            }
            return;
        }

        if (currentStep >= steps.length - 1) {
            try {
                await fetchWithAuth('/api/v1/users/me', {
                    method: 'PATCH',
                    body: JSON.stringify({ onboarded: true, calendarConnected: true })
                });
                navigate('/');
            } catch (err) {
                console.error('Failed to complete onboarding:', err);
                navigate('/');
            }
            return;
        }

        setCurrentStep(prev => prev + 1);
    };

    const step = steps[currentStep] || steps[steps.length - 1];

    return (
        <div className="onboarding">
            <div className="onboarding__background">
                <div className="onboarding__glow onboarding__glow--1" />
                <div className="onboarding__glow onboarding__glow--2" />
            </div>

            <div className="onboarding__container">
                <div className="onboarding__progress-bar">
                    {steps.map((_, i) => (
                        <div 
                            key={i} 
                            className={`onboarding__progress-dot ${i <= currentStep ? 'active' : ''}`}
                        />
                    ))}
                </div>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentStep}
                        className="onboarding__card"
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.95 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                    >
                        <div className="onboarding__icon">{step?.icon}</div>
                        <h1 className="onboarding__title">{step?.title}</h1>
                        <h2 className="onboarding__subtitle">{step?.subtitle}</h2>
                        <p className="onboarding__text">{step?.content}</p>

                        {step?.id === 'scanning' && (
                            <div className="onboarding__scan-bar">
                                <motion.div 
                                    className="onboarding__scan-fill"
                                    style={{ width: `${progress}%` }}
                                />
                                <span className="onboarding__scan-label">{progress}% Optimized</span>
                            </div>
                        )}

                        <div className="onboarding__actions">
                            {step?.id !== 'scanning' && (
                                <button 
                                    className={`onboarding__btn ${isConnecting ? 'loading' : ''}`}
                                    onClick={handleNext}
                                    disabled={isConnecting}
                                >
                                    {isConnecting ? 'Establishing Link...' : step?.action || 'Continue'}
                                </button>
                            )}
                        </div>
                    </motion.div>
                </AnimatePresence>

                <div className="onboarding__footer">
                    <span className="onboarding__skip" onClick={() => navigate('/')}>Skip for now</span>
                </div>
            </div>
        </div>
    );
};

export default Onboarding;
