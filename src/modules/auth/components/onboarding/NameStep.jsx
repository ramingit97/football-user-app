import React from 'react';
import { Input } from 'antd';
import { useTranslation } from 'react-i18next';

const NameStep = ({ formData, updateFormData, onNext, onBack }) => {
    const { t } = useTranslation();

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && formData.name?.trim().length >= 2) {
            onNext();
        }
    };

    return (
        <div className="onboarding-step">
            <div className="step-icon-wrapper">
                <span className="step-emoji">👋</span>
            </div>

            <h1 className="step-title">{t('auth.onboarding.name.title')}</h1>
            <p className="step-subtitle">
                {t('auth.onboarding.name.subtitle')}
            </p>

            <div className="step-input-wrapper">
                <Input
                    size="large"
                    placeholder={t('auth.onboarding.name.placeholder')}
                    value={formData.name}
                    onChange={(e) => updateFormData('name', e.target.value)}
                    onKeyPress={handleKeyPress}
                    autoFocus
                    style={{
                        height: 64,
                        fontSize: 24,
                        textAlign: 'center',
                        background: 'transparent',
                        border: 'none',
                        color: 'white',
                        fontWeight: 600
                    }}
                    className="premium-input"
                />
            </div>

            <div className="step-actions">
                <button className="btn-secondary" onClick={onBack}>
                    {t('common.back')}
                </button>
                <button
                    className="btn-primary"
                    onClick={onNext}
                    disabled={formData.name?.trim().length < 2}
                >
                    {t('common.next')}
                </button>
            </div>

            <style>{`
                .premium-input::placeholder {
                    color: rgba(255,255,255,0.2);
                }
                .premium-input:focus {
                    box-shadow: none;
                }
            `}</style>
        </div>
    );
};

export default NameStep;
