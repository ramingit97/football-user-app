import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { message } from 'antd';
import { useRegisterMutation, useUpdateProfileMutation, useProcessReferralMutation, useLoginWithGoogleMutation } from '../../../store/authApi';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../../../store/store';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../../../components/LanguageSwitcher';

// Step Components - Simplified: only 3 core questions + auth
import WelcomeStep from './onboarding/WelcomeStep';
import NameStep from './onboarding/NameStep';
import PositionStep from './onboarding/PositionStep';
import PlayStyleStep from './onboarding/PlayStyleStep';
import AuthStep from './onboarding/AuthStep';
import CompletionStep from './onboarding/CompletionStep';

// Progressive Profiling: Only 3 essential questions for onboarding
// Remaining fields (Age, Foot, Physical, Location, Photo) moved to Profile page
const STEPS = [
    { id: 'welcome', component: WelcomeStep, type: 'intro' },
    { id: 'name', component: NameStep, type: 'input', required: true },
    { id: 'position', component: PositionStep, type: 'select', required: true },
    { id: 'playStyle', component: PlayStyleStep, type: 'select', required: true },
    { id: 'auth', component: AuthStep, type: 'auth', required: true },
    { id: 'completion', component: CompletionStep, type: 'completion' }
];

const InteractiveOnboarding = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [register, { isLoading: registering }] = useRegisterMutation();
    const [updateProfile, { isLoading: updating }] = useUpdateProfileMutation();
    const [processReferral] = useProcessReferralMutation();
    const [loginWithGoogle] = useLoginWithGoogleMutation();
    const dispatch = useDispatch();

    const [currentStep, setCurrentStep] = useState(0);
    const [formData, setFormData] = useState({
        name: '',
        age: 25,
        position: '',
        preferredFoot: '',
        height: null,
        weight: null,
        district: '',
        metro: '',
        avatar: null,
        email: '',
        phone: '',
        password: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Сохраняем ref из URL + уведомляем о начале регистрации
    useEffect(() => {
        const refCode = new URLSearchParams(window.location.search).get('ref');
        if (refCode) {
            localStorage.setItem('pendingRef', refCode);
        }
        // Fire-and-forget: notify that someone opened the registration page
        fetch('/api/analytics/registration-started', { method: 'POST' }).catch(() => {});
    }, []);

    const totalSteps = STEPS.filter(s => s.type !== 'feature' && s.type !== 'intro' && s.type !== 'completion').length;
    const currentProgress = STEPS.slice(0, currentStep + 1).filter(s => s.type !== 'feature' && s.type !== 'intro' && s.type !== 'completion').length;

    const updateFormData = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleNext = async () => {
        const step = STEPS[currentStep];

        // Validate required steps
        if (step.required) {
            const validations = {
                name: formData.name?.trim().length >= 2,
                position: !!formData.position,
                playStyle: !!formData.playStyle,
                auth: formData.googleIdToken || ((formData.email || formData.phone) && formData.password && formData.password.length >= 6)
            };

            if (step.id === 'name' && !validations.name) {
                message.warning(t('auth.registration.nameRequired'));
                return;
            }
            if (step.id === 'position' && !validations.position) {
                message.warning(t('auth.registration.positionRequired'));
                return;
            }
            if (step.id === 'playStyle' && !validations.playStyle) {
                message.warning(t('auth.registration.playStyleRequired'));
                return;
            }
        }

        // If auth step, submit registration
        if (step.id === 'auth') {
            await handleSubmitRegistration();
            return;
        }

        // Move to next step
        if (currentStep < STEPS.length - 1) {
            setCurrentStep(currentStep + 1);
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleSkip = () => {
        if (currentStep < STEPS.length - 1) {
            setCurrentStep(currentStep + 1);
        }
    };

    const handleSubmitRegistration = async () => {
        // Allow email OR phone (one required)
        if (!formData.googleIdToken && !formData.email && !formData.phone) {
            message.warning(t('auth.registration.credentialsRequired'));
            return;
        }
        if (!formData.googleIdToken && !formData.password) {
            message.warning(t('auth.registration.passwordRequired'));
            return;
        }

        setIsSubmitting(true);
        try {
            // 1. Register user with email OR phone
            const registerData = {
                name: formData.name,
                password: formData.password,
                ...(formData.email ? { email: formData.email } : { email: `${formData.phone}@phone.auth` }),
                ...(formData.phone ? { phone: formData.phone } : {})
            };

            const result = await register(registerData).unwrap();

            localStorage.setItem('token', result.access_token);
            localStorage.setItem('user', JSON.stringify(result.user));

            // 2. Update profile with position + play style + initial ratings
            await updateProfile({
                position: formData.position,
                playStyle: formData.playStyle,
                speedRating: formData.speedRating || 50,
                staminaRating: formData.staminaRating || 50,
                attackRating: formData.attackRating || 50,
                defenseRating: formData.defenseRating || 50
            }).unwrap();

            // 3. Process referral code — берём из URL или из localStorage (на случай, если URL изменился)
            const refCode = new URLSearchParams(window.location.search).get('ref')
                || localStorage.getItem('pendingRef');
            if (refCode && result.user?.id) {
                try {
                    await processReferral({ userId: result.user.id, referralCode: refCode }).unwrap();
                } catch {
                    // Silently ignore referral errors — registration still succeeded
                }
                localStorage.removeItem('pendingRef');
            }

            // Notify analytics: registration completed
            fetch('/api/analytics/registration-completed', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email || undefined,
                    phone: formData.phone || undefined,
                    position: formData.position,
                    playStyle: formData.playStyle,
                }),
            }).catch(() => {});

            message.success(t('auth.registration.success'));
            setCurrentStep(currentStep + 1); // Go to completion step
        } catch (error) {
            message.error(error.data?.message || t('auth.registration.error'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleGoogleAuth = async (idToken) => {
        setIsSubmitting(true);
        try {
            const result = await loginWithGoogle(idToken).unwrap();

            dispatch(setCredentials({ user: result.user, token: result.access_token }));
            localStorage.setItem('token', result.access_token);
            localStorage.setItem('user', JSON.stringify(result.user));

            // Update profile with onboarding data
            await updateProfile({
                ...(formData.name && !result.user.name ? { name: formData.name } : {}),
                position: formData.position,
                playStyle: formData.playStyle,
                speedRating: formData.speedRating || 50,
                staminaRating: formData.staminaRating || 50,
                attackRating: formData.attackRating || 50,
                defenseRating: formData.defenseRating || 50,
            }).unwrap();

            // Process referral
            const refCode = new URLSearchParams(window.location.search).get('ref')
                || localStorage.getItem('pendingRef');
            if (refCode && result.user?.id) {
                try {
                    await processReferral({ userId: result.user.id, referralCode: refCode }).unwrap();
                } catch {}
                localStorage.removeItem('pendingRef');
            }

            // Notify analytics: registration completed via Google
            fetch('/api/analytics/registration-completed', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: result.user.name || formData.name,
                    email: result.user.email,
                    position: formData.position,
                    playStyle: formData.playStyle,
                }),
            }).catch(() => {});

            message.success(t('auth.registration.success'));
            setCurrentStep(currentStep + 1);
        } catch (error) {
            message.error(error.data?.message || t('auth.registration.error'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleComplete = () => {
        const returnTo = new URLSearchParams(window.location.search).get('returnTo');
        navigate(returnTo || '/games');
    };

    const CurrentStepComponent = STEPS[currentStep].component;
    const stepProps = STEPS[currentStep].props || {};

    return (
        <div className="onboarding-container">
            <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 200 }}>
                <LanguageSwitcher />
            </div>
            <div className="step-wrapper">
                <CurrentStepComponent
                    formData={formData}
                    updateFormData={updateFormData}
                    onNext={handleNext}
                    onBack={handleBack}
                    onSkip={handleSkip}
                    onComplete={handleComplete}
                    isLoading={registering || updating || isSubmitting}
                    currentStep={currentStep}
                    onGoogleAuth={handleGoogleAuth}
                    {...stepProps}
                />
            </div>

            {/* Progress Bar */}
            {STEPS[currentStep].type !== 'intro' && STEPS[currentStep].type !== 'completion' && (
                <div className="onboarding-progress">
                    <div className="progress-track">
                        <div
                            className="progress-fill"
                            style={{ width: `${(currentProgress / totalSteps) * 100}%` }}
                        />
                    </div>
                    <div className="progress-label">
                        {t('auth.registration.stepIndicator', { n: currentProgress, total: totalSteps })}
                    </div>
                </div>
            )}

            <style>{`
                :root {
                    --primary-gradient: linear-gradient(135deg, #52c41a 0%, #389e0d 100%);
                    --glass-bg: rgba(255, 255, 255, 0.05);
                    --glass-border: 1px solid rgba(255, 255, 255, 0.1);
                    --glass-radius: 24px;
                }

                .onboarding-container {
                    min-height: 100vh;
                    display: flex;
                    flex-direction: column;
                    background: #0f1216; /* Dark premium background */
                    background-image: 
                        radial-gradient(at 0% 0%, rgba(82, 196, 26, 0.15) 0px, transparent 50%),
                        radial-gradient(at 100% 100%, rgba(24, 144, 255, 0.1) 0px, transparent 50%);
                    color: white;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
                    overflow: hidden;
                    position: relative;
                }

                .step-wrapper {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 24px;
                    width: 100%;
                    max-width: 500px;
                    margin: 0 auto;
                }

                .onboarding-progress {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    padding: 20px 24px;
                    z-index: 100;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 8px;
                }

                .progress-track {
                    width: 100%;
                    max-width: 320px;
                    height: 4px;
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 2px;
                    overflow: hidden;
                }

                .progress-fill {
                    height: 100%;
                    background: #52c41a;
                    border-radius: 2px;
                    transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                    box-shadow: 0 0 10px rgba(82, 196, 26, 0.5);
                }
                
                .progress-label {
                    font-size: 12px;
                    color: rgba(255,255,255,0.4);
                    font-weight: 500;
                }

                /* ---- Shared Step Styles ---- */

                .onboarding-step {
                    width: 100%;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    animation: fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1);
                }

                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .step-icon-wrapper {
                    width: 80px;
                    height: 80px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-bottom: 24px;
                    background: var(--glass-bg);
                    border-radius: 50%;
                    border: var(--glass-border);
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
                }

                .step-emoji {
                    font-size: 40px;
                }

                .step-title {
                    font-size: 28px;
                    font-weight: 700;
                    margin: 0 0 12px;
                    background: linear-gradient(180deg, #fff 0%, rgba(255,255,255,0.7) 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    text-align: center;
                }

                .step-subtitle {
                    font-size: 16px;
                    color: rgba(255, 255, 255, 0.6);
                    text-align: center;
                    margin: 0 0 32px;
                    line-height: 1.5;
                    max-width: 320px;
                }

                /* ---- Input Styles ---- */
                .step-input-wrapper {
                    width: 100%;
                    background: var(--glass-bg);
                    border: var(--glass-border);
                    border-radius: 16px;
                    padding: 4px;
                    transition: all 0.2s;
                }
                
                .step-input-wrapper:focus-within {
                    border-color: #52c41a;
                    background: rgba(255,255,255,0.08);
                    box-shadow: 0 0 0 2px rgba(82, 196, 26, 0.1);
                }

                /* ---- Card Selection Styles ---- */
                .selection-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 12px;
                    width: 100%;
                    margin-bottom: 24px;
                }

                .selection-card {
                    background: var(--glass-bg);
                    border: var(--glass-border);
                    border-radius: 16px;
                    padding: 20px 16px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    cursor: pointer;
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                    position: relative;
                    overflow: hidden;
                }

                .selection-card:hover {
                    background: rgba(255,255,255,0.1);
                    transform: translateY(-2px);
                }

                .selection-card.selected {
                    background: rgba(82, 196, 26, 0.15);
                    border-color: #52c41a;
                    box-shadow: 0 4px 20px rgba(82, 196, 26, 0.15);
                }

                .card-icon {
                    font-size: 32px;
                    margin-bottom: 8px;
                }

                .card-label {
                    font-size: 14px;
                    font-weight: 500;
                    color: rgba(255,255,255,0.9);
                }

                /* ---- Buttons ---- */
                .step-actions {
                    display: flex;
                    gap: 12px;
                    width: 100%;
                    margin-top: auto;
                    padding-top: 24px;
                }

                .btn-primary, .btn-secondary, .btn-ghost {
                    height: 56px;
                    border-radius: 28px;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                    border: none;
                }

                .btn-primary {
                    flex: 2;
                    background: var(--primary-gradient);
                    color: white;
                    box-shadow: 0 8px 24px rgba(82, 196, 26, 0.3);
                }

                .btn-primary:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 12px 32px rgba(82, 196, 26, 0.4);
                }
                
                .btn-primary:active {
                    transform: translateY(0);
                }

                .btn-primary:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                    transform: none;
                }

                .btn-secondary {
                    flex: 1;
                    background: rgba(255,255,255,0.1);
                    color: white;
                }

                .btn-secondary:hover {
                    background: rgba(255,255,255,0.15);
                }

                .btn-ghost {
                    flex: 1;
                    background: transparent;
                    color: rgba(255,255,255,0.5);
                }

                .btn-ghost:hover {
                    color: white;
                }
                
                /* ---- Ant Design Overrides ---- */
                .ant-slider-rail {
                    background-color: rgba(255, 255, 255, 0.1) !important;
                }
                .ant-slider-track {
                    background-color: #52c41a !important;
                }
                .ant-slider-handle {
                    background-color: #000 !important;
                    border: 2px solid #52c41a !important;
                    box-shadow: 0 0 10px rgba(82, 196, 26, 0.5) !important;
                }
                .ant-slider-handle::after {
                    display: none !important;
                }
                
                /* Select overrides */
                .ant-select-dropdown {
                    background-color: #1f2937 !important;
                    border: 1px solid rgba(255,255,255,0.1) !important;
                }
                .ant-select-item {
                    color: rgba(255,255,255,0.8) !important;
                    border-radius: 8px !important;
                    margin: 4px !important;
                }
                .ant-select-item-option-selected {
                    background-color: rgba(82, 196, 26, 0.2) !important;
                    color: #52c41a !important;
                }
                .ant-select-item-option-active {
                    background-color: rgba(255,255,255,0.1) !important;
                }

            `}</style>
        </div>
    );
};

export default InteractiveOnboarding;
