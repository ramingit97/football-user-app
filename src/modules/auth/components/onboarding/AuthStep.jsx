import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { signInWithGoogle } from '../../../../firebase';

const countryCodes = [
    { code: '+994', flag: '🇦🇿' },
    { code: '+90', flag: '🇹🇷' },
    { code: '+7', flag: '🇷🇺' },
];

const AuthStep = ({ formData, updateFormData, onNext, onBack, isLoading, onGoogleAuth }) => {
    const { t } = useTranslation();
    const [countryCode, setCountryCode] = useState('+994');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [authMethod, setAuthMethod] = useState('email'); // 'email' or 'phone'
    const [googleLoading, setGoogleLoading] = useState(false);

    const handleNext = () => {
        // Require email OR phone (one of them)
        if (authMethod === 'email' && !formData.email) {
            setError(t('auth.unifiedLogin.emailRequired'));
            return;
        }
        if (authMethod === 'phone' && !formData.phone) {
            setError(t('auth.unifiedLogin.phoneRequired'));
            return;
        }
        if (!formData.password) {
            setError(t('auth.registration.passwordRequired'));
            return;
        }
        if (formData.password.length < 6) {
            setError(t('auth.onboarding.auth.passwordMinLength'));
            return;
        }
        if (formData.password !== confirmPassword) {
            setError(t('auth.onboarding.auth.passwordMismatch'));
            return;
        }
        setError('');
        onNext();
    };

    const handleGoogleClick = async () => {
        setGoogleLoading(true);
        try {
            const idToken = await signInWithGoogle();
            onGoogleAuth(idToken);
        } catch (error) {
            console.error(error);
            setError('Ошибка входа через Google');
        } finally {
            setGoogleLoading(false);
        }
    };

    const handlePhoneChange = (value) => {
        const cleanPhone = value.startsWith('0') ? value.substring(1) : value;
        updateFormData('phone', `${countryCode}${cleanPhone}`);
    };

    const switchAuthMethod = (method) => {
        setAuthMethod(method);
        setError('');
        // Clear the other field when switching
        if (method === 'email') {
            updateFormData('phone', '');
        } else {
            updateFormData('email', '');
        }
    };

    return (
        <div className="onboarding-step">
            <div className="step-icon-wrapper">
                <span className="step-emoji">🔐</span>
            </div>

            <h1 className="step-title">{t('auth.onboarding.auth.title')}</h1>
            <p className="step-subtitle">
                {t('auth.onboarding.auth.subtitle')}
            </p>

            {/* Auth Method Toggle */}
            <div className="auth-toggle">
                <button
                    className={`toggle-btn ${authMethod === 'email' ? 'active' : ''}`}
                    onClick={() => switchAuthMethod('email')}
                >
                    ✉️ {t('auth.onboarding.auth.emailTab')}
                </button>
                <button
                    className={`toggle-btn ${authMethod === 'phone' ? 'active' : ''}`}
                    onClick={() => switchAuthMethod('phone')}
                >
                    📱 {t('auth.onboarding.auth.phoneTab')}
                </button>
            </div>

            <div className="auth-form">
                {/* Email or Phone based on toggle */}
                {authMethod === 'email' ? (
                    <div className="input-group">
                        <span className="input-icon">✉️</span>
                        <input
                            type="email"
                            placeholder={t('auth.onboarding.auth.emailPlaceholder')}
                            value={formData.email}
                            onChange={(e) => updateFormData('email', e.target.value)}
                            className="auth-field"
                        />
                    </div>
                ) : (
                    <div className="input-group phone-group">
                        <select
                            value={countryCode}
                            onChange={(e) => setCountryCode(e.target.value)}
                            className="country-code-select"
                        >
                            {countryCodes.map(c => (
                                <option key={c.code} value={c.code}>
                                    {c.flag} {c.code}
                                </option>
                            ))}
                        </select>
                        <input
                            type="tel"
                            placeholder={t('auth.onboarding.auth.phonePlaceholder')}
                            value={formData.phone ? formData.phone.replace(countryCode, '') : ''}
                            onChange={(e) => handlePhoneChange(e.target.value)}
                            className="auth-field phone-field"
                        />
                    </div>
                )}

                {/* Password */}
                <div className="input-group">
                    <span className="input-icon">🔒</span>
                    <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder={t('auth.onboarding.auth.passwordHint')}
                        value={formData.password}
                        onChange={(e) => updateFormData('password', e.target.value)}
                        className="auth-field"
                    />
                    <button
                        type="button"
                        className="toggle-password"
                        onClick={() => setShowPassword(!showPassword)}
                    >
                        {showPassword ? '🙈' : '👁️'}
                    </button>
                </div>

                {/* Confirm Password */}
                <div className="input-group">
                    <span className="input-icon">🔒</span>
                    <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder={t('auth.onboarding.auth.confirmPasswordHint')}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="auth-field"
                    />
                    <button
                        type="button"
                        className="toggle-password"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                        {showConfirmPassword ? '🙈' : '👁️'}
                    </button>
                </div>

                {error && (
                    <div className="error-message">
                        ⚠️ {error}
                    </div>
                )}
            </div>

            <div className="auth-actions">
                <button
                    onClick={handleNext}
                    disabled={isLoading}
                    className="submit-btn"
                >
                    {isLoading ? `⏳ ${t('auth.onboarding.auth.creating')}` : `✨ ${t('auth.onboarding.auth.createBtn')}`}
                </button>

                <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 14, margin: '4px 0' }}>
                    — или —
                </div>

                <button
                    onClick={handleGoogleClick}
                    disabled={googleLoading}
                    className="google-auth-btn"
                >
                    {googleLoading ? '⏳ ...' : (
                        <>
                            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" width={22} height={22} />
                            Продолжить через Google
                        </>
                    )}
                </button>

                <button onClick={onBack} className="back-btn">
                    ← {t('common.back')}
                </button>
            </div>

            <style>{`
                .auth-toggle {
                    display: flex;
                    background: rgba(255,255,255,0.05);
                    border-radius: 12px;
                    padding: 4px;
                    margin-bottom: 24px;
                    width: 100%;
                }

                .toggle-btn {
                    flex: 1;
                    padding: 12px;
                    background: transparent;
                    border: none;
                    border-radius: 10px;
                    color: rgba(255,255,255,0.5);
                    font-size: 16px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .toggle-btn.active {
                    background: rgba(82, 196, 26, 0.2);
                    color: #52c41a;
                }

                .toggle-btn:hover:not(.active) {
                    color: white;
                }

                .auth-form {
                    width: 100%;
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }

                .input-group {
                    display: flex;
                    align-items: center;
                    background: rgba(255,255,255,0.08);
                    border: 1px solid rgba(255,255,255,0.15);
                    border-radius: 16px;
                    padding: 0 20px;
                    height: 64px;
                    transition: all 0.2s;
                }

                .input-group:focus-within {
                    border-color: #52c41a;
                    background: rgba(255,255,255,0.1);
                    box-shadow: 0 0 0 3px rgba(82, 196, 26, 0.15);
                }

                .input-icon {
                    font-size: 20px;
                    margin-right: 14px;
                    opacity: 0.7;
                }

                .auth-field {
                    flex: 1;
                    background: transparent;
                    border: none;
                    outline: none;
                    color: white;
                    font-size: 18px;
                    height: 100%;
                    padding: 0;
                }

                .auth-field::placeholder {
                    color: rgba(255,255,255,0.4);
                }

                .toggle-password {
                    background: none;
                    border: none;
                    font-size: 18px;
                    cursor: pointer;
                    padding: 8px;
                    opacity: 0.6;
                    transition: opacity 0.2s;
                }

                .toggle-password:hover {
                    opacity: 1;
                }

                .phone-group {
                    padding-left: 0;
                }

                .country-code-select {
                    background: rgba(255,255,255,0.1);
                    border: none;
                    border-right: 1px solid rgba(255,255,255,0.15);
                    color: white;
                    font-size: 16px;
                    padding: 0 16px;
                    height: 100%;
                    cursor: pointer;
                    border-radius: 16px 0 0 16px;
                    -webkit-appearance: none;
                    appearance: none;
                    min-width: 110px;
                }

                .country-code-select option {
                    background: #1a1a2e;
                    color: white;
                }

                .phone-field {
                    padding-left: 16px;
                }

                .error-message {
                    color: #ff6b6b;
                    text-align: center;
                    font-size: 15px;
                    background: rgba(255, 107, 107, 0.1);
                    padding: 14px 20px;
                    border-radius: 12px;
                    border: 1px solid rgba(255, 107, 107, 0.2);
                }

                .auth-actions {
                    width: 100%;
                    margin-top: 32px;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                .submit-btn {
                    width: 100%;
                    height: 64px;
                    font-size: 20px;
                    font-weight: 700;
                    border-radius: 16px;
                    border: none;
                    cursor: pointer;
                    background: linear-gradient(135deg, #52c41a 0%, #237804 100%);
                    color: white;
                    box-shadow: 0 8px 24px rgba(82, 196, 26, 0.4);
                    transition: all 0.2s;
                }

                .submit-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 12px 32px rgba(82, 196, 26, 0.5);
                }

                .submit-btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                    transform: none;
                }

                .back-btn {
                    width: 100%;
                    height: 48px;
                    font-size: 16px;
                    font-weight: 500;
                    border-radius: 12px;
                    border: 1px solid rgba(255,255,255,0.15);
                    background: transparent;
                    color: rgba(255,255,255,0.6);
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .back-btn:hover {
                    background: rgba(255,255,255,0.05);
                    color: white;
                }

                .google-auth-btn {
                    width: 100%;
                    height: 56px;
                    font-size: 17px;
                    font-weight: 600;
                    border-radius: 16px;
                    border: 1px solid rgba(255,255,255,0.15);
                    background: rgba(255,255,255,0.07);
                    color: white;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 12px;
                    transition: all 0.2s;
                }

                .google-auth-btn:hover {
                    background: rgba(255,255,255,0.12);
                    border-color: rgba(255,255,255,0.3);
                }

                .google-auth-btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }
            `}</style>
        </div>
    );
};

export default AuthStep;
