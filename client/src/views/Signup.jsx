import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Logo from '../components/Logo/Logo';
import './Auth.css';

const getPasswordStrength = (pw) => {
    if (!pw) return { level: 0, label: '' };
    let score = 0;
    if (pw.length >= 8) score++;
    if (pw.length >= 12) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;

    if (score <= 2) return { level: 1, label: 'Weak' };
    if (score <= 3) return { level: 2, label: 'Medium' };
    return { level: 3, label: 'Strong' };
};

const Signup = () => {
    const navigate = useNavigate();
    const { signup } = useAuth();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});

    const strength = useMemo(() => getPasswordStrength(password), [password]);
    const strengthClass = strength.level === 1 ? 'weak' : strength.level === 2 ? 'medium' : 'strong';

    const validate = () => {
        const errs = {};
        if (!name.trim()) errs.name = 'Full name is required';
        if (!email.trim()) errs.email = 'Email is required';
        else if (!/^\S+@\S+\.\S+$/.test(email)) errs.email = 'Enter a valid email';
        if (!password) errs.password = 'Password is required';
        else if (password.length < 8) errs.password = 'Must be at least 8 characters';
        if (password !== confirmPassword) errs.confirmPassword = 'Passwords do not match';
        setFieldErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!validate()) return;

        setLoading(true);
        try {
            await signup({ name, email, password });
            navigate('/', { replace: true });
        } catch (err) {
            setError(err.message || 'Signup failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const clearFieldError = (field) => setFieldErrors(p => ({ ...p, [field]: '' }));

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-header">
                    <div className="auth-logo">
                        <Logo size={36} />
                        <span className="auth-logo-text">Chronex</span>
                    </div>
                    <h1 className="auth-title">Create your account</h1>
                    <p className="auth-subtitle">Start syncing your world across timezones</p>
                </div>

                <form className="auth-form" onSubmit={handleSubmit} noValidate>
                    {error && <div className="auth-error-banner">{error}</div>}

                    <div className="auth-field">
                        <label className="auth-label">Full Name</label>
                        <input
                            type="text"
                            className={`auth-input ${fieldErrors.name ? 'has-error' : ''}`}
                            placeholder="John Doe"
                            value={name}
                            onChange={(e) => { setName(e.target.value); clearFieldError('name'); }}
                            autoComplete="name"
                        />
                        {fieldErrors.name && <p className="auth-field-error">{fieldErrors.name}</p>}
                    </div>

                    <div className="auth-field">
                        <label className="auth-label">Email</label>
                        <input
                            type="email"
                            className={`auth-input ${fieldErrors.email ? 'has-error' : ''}`}
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => { setEmail(e.target.value); clearFieldError('email'); }}
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
                                placeholder="Min. 8 characters"
                                value={password}
                                onChange={(e) => { setPassword(e.target.value); clearFieldError('password'); }}
                                autoComplete="new-password"
                            />
                            <button
                                type="button"
                                className="auth-toggle-password"
                                onClick={() => setShowPassword(!showPassword)}
                                tabIndex={-1}
                            >
                                {showPassword ? '🙈' : '👁'}
                            </button>
                        </div>
                        {fieldErrors.password && <p className="auth-field-error">{fieldErrors.password}</p>}
                        {password && (
                            <>
                                <div className="auth-password-strength">
                                    {[1, 2, 3].map((i) => (
                                        <div
                                            key={i}
                                            className={`auth-strength-bar ${i <= strength.level ? `active ${strengthClass}` : ''}`}
                                        />
                                    ))}
                                </div>
                                <span className={`auth-strength-label ${strengthClass}`}>{strength.label}</span>
                            </>
                        )}
                    </div>

                    <div className="auth-field">
                        <label className="auth-label">Confirm Password</label>
                        <input
                            type={showPassword ? 'text' : 'password'}
                            className={`auth-input ${fieldErrors.confirmPassword ? 'has-error' : ''}`}
                            placeholder="Re-enter password"
                            value={confirmPassword}
                            onChange={(e) => { setConfirmPassword(e.target.value); clearFieldError('confirmPassword'); }}
                            autoComplete="new-password"
                        />
                        {fieldErrors.confirmPassword && <p className="auth-field-error">{fieldErrors.confirmPassword}</p>}
                    </div>

                    <button type="submit" className="auth-submit" disabled={loading}>
                        {loading ? <span className="auth-spinner" /> : 'Create Account'}
                    </button>

                    <div className="auth-divider"><span>or</span></div>

                    <p className="auth-footer">
                        Already have an account? <Link to="/login">Sign in</Link>
                    </p>
                </form>
            </div>
        </div>
    );
};

export default Signup;
