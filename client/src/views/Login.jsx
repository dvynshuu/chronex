import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Logo from '../components/Logo/Logo';
import './Auth.css';

const Login = () => {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [remember, setRemember] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});

    const validate = () => {
        const errs = {};
        if (!email.trim()) errs.email = 'Email is required';
        else if (!/^\S+@\S+\.\S+$/.test(email)) errs.email = 'Enter a valid email';
        if (!password) errs.password = 'Password is required';
        setFieldErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!validate()) return;

        setLoading(true);
        try {
            await login(email, password);
            navigate('/', { replace: true });
        } catch (err) {
            setError(err.message || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-header">
                    <div className="auth-logo">
                        <Logo size={36} />
                        <span className="auth-logo-text">Chronex</span>
                    </div>
                    <h1 className="auth-title">Welcome back</h1>
                    <p className="auth-subtitle">Sign in to your account to continue</p>
                </div>

                <form className="auth-form" onSubmit={handleSubmit} noValidate>
                    {error && <div className="auth-error-banner">{error}</div>}

                    <div className="auth-field">
                        <label className="auth-label">Email</label>
                        <input
                            type="email"
                            className={`auth-input ${fieldErrors.email ? 'has-error' : ''}`}
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => { setEmail(e.target.value); setFieldErrors(p => ({ ...p, email: '' })); }}
                            autoComplete="email"
                        />
                        {fieldErrors.email && <p className="auth-field-error">{fieldErrors.email}</p>}
                    </div>

                    <div className="auth-field">
                        <label className="auth-label">Password</label>
                        <div className="auth-input-wrapper">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                className={`auth-input ${fieldErrors.password ? 'has-error' : ''}`}
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => { setPassword(e.target.value); setFieldErrors(p => ({ ...p, password: '' })); }}
                                autoComplete="current-password"
                            />
                            <button
                                type="button"
                                className="auth-toggle-password"
                                onClick={() => setShowPassword(!showPassword)}
                                tabIndex={-1}
                            >
                                {showPassword ? ' 🫣 ' : '👁'}
                            </button>
                        </div>
                        {fieldErrors.password && <p className="auth-field-error">{fieldErrors.password}</p>}
                    </div>

                    <div className="auth-actions-row">
                        <label className="auth-remember">
                            <input
                                type="checkbox"
                                checked={remember}
                                onChange={(e) => setRemember(e.target.checked)}
                            />
                            Remember me
                        </label>
                        <a href="#" className="auth-forgot">Forgot password?</a>
                    </div>

                    <button type="submit" className="auth-submit" disabled={loading}>
                        {loading ? <span className="auth-spinner" /> : 'Sign In'}
                    </button>

                    <div className="auth-divider"><span>or</span></div>

                    <p className="auth-footer">
                        Don't have an account? <Link to="/signup">Create one</Link>
                    </p>
                </form>
            </div>
        </div>
    );
};

export default Login;
