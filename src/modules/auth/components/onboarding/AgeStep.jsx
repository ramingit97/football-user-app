import React from 'react';
import { Slider } from 'antd';
import { useTranslation } from 'react-i18next';

const AgeStep = ({ formData, updateFormData, onNext, onBack }) => {
    const { t } = useTranslation();
    const age = formData.age || 25;

    return (
        <div className="onboarding-step">
            <div className="step-icon-wrapper">
                <span className="step-emoji">🎂</span>
            </div>

            <h1 className="step-title">{t('auth.onboarding.age.title')}</h1>
            <p className="step-subtitle">
                {t('auth.onboarding.age.subtitle')}
            </p>

            <div style={{
                background: 'rgba(255,255,255,0.03)',
                borderRadius: 24,
                padding: '40px 24px',
                width: '100%',
                marginBottom: 24,
                border: '1px solid rgba(255,255,255,0.05)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    justifyContent: 'center',
                    marginBottom: 32
                }}>
                    <span style={{
                        fontSize: 80,
                        fontWeight: 800,
                        background: 'linear-gradient(135deg, #52c41a 0%, #a0d911 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        lineHeight: 1
                    }}>
                        {age}
                    </span>
                    <span style={{
                        fontSize: 24,
                        color: 'rgba(255,255,255,0.3)',
                        marginLeft: 12,
                        fontWeight: 500
                    }}>{t('auth.onboarding.age.years')}</span>
                </div>

                <Slider
                    min={14}
                    max={60}
                    value={age}
                    onChange={(value) => updateFormData('age', value)}
                    tooltip={{ open: false }}
                />

                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    color: 'rgba(255,255,255,0.2)',
                    fontSize: 13,
                    marginTop: 12,
                    fontWeight: 500
                }}>
                    <span>14</span>
                    <span>60</span>
                </div>
            </div>

            <div className="step-actions">
                <button className="btn-secondary" onClick={onBack}>
                    {t('common.back')}
                </button>
                <button
                    className="btn-primary"
                    onClick={onNext}
                >
                    {t('common.next')}
                </button>
            </div>
        </div>
    );
};

export default AgeStep;
