import React from 'react';
import { Slider } from 'antd';
import { useTranslation } from 'react-i18next';

const PhysicalStep = ({ formData, updateFormData, onNext, onBack, onSkip }) => {
    const { t } = useTranslation();

    return (
        <div className="onboarding-step">
            <div className="step-icon-wrapper">
                <span className="step-emoji">📏</span>
            </div>

            <h1 className="step-title">{t('auth.onboarding.physical.title')}</h1>
            <p className="step-subtitle">
                {t('auth.onboarding.physical.subtitle')}
            </p>

            <div style={{
                background: 'rgba(255,255,255,0.03)',
                borderRadius: 24,
                padding: 24,
                marginBottom: 24,
                border: '1px solid rgba(255,255,255,0.05)',
                width: '100%'
            }}>
                <div style={{ marginBottom: 32 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                        <span style={{ color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>{t('auth.onboarding.physical.height')}</span>
                        <span style={{ color: 'white', fontWeight: 700, fontSize: 18 }}>
                            {formData.height || 175} <span style={{ fontSize: 12, opacity: 0.5 }}>{t('auth.onboarding.physical.heightUnit')}</span>
                        </span>
                    </div>
                    <Slider
                        min={140}
                        max={220}
                        value={formData.height || 175}
                        onChange={(value) => updateFormData('height', value)}
                    />
                </div>

                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                        <span style={{ color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>{t('auth.onboarding.physical.weight')}</span>
                        <span style={{ color: 'white', fontWeight: 700, fontSize: 18 }}>
                            {formData.weight || 70} <span style={{ fontSize: 12, opacity: 0.5 }}>{t('auth.onboarding.physical.weightUnit')}</span>
                        </span>
                    </div>
                    <Slider
                        min={40}
                        max={150}
                        value={formData.weight || 70}
                        onChange={(value) => updateFormData('weight', value)}
                    />
                </div>
            </div>

            <div className="step-actions">
                <button className="btn-secondary" onClick={onBack}>
                    {t('common.back')}
                </button>

                <button className="btn-ghost" onClick={onSkip}>
                    {t('common.skip')}
                </button>

                <button className="btn-primary" onClick={onNext}>
                    {t('common.next')}
                </button>
            </div>
        </div>
    );
};

export default PhysicalStep;
