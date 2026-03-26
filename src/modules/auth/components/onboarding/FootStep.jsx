import React from 'react';
import { useTranslation } from 'react-i18next';

const FOOT_OPTIONS = [
    { value: 'left', labelKey: 'foot.left', icon: '⬅️' },
    { value: 'right', labelKey: 'foot.right', icon: '➡️' },
    { value: 'both', labelKey: 'foot.both', icon: '↔️' },
];

const FootStep = ({ formData, updateFormData, onNext, onBack, onSkip }) => {
    const { t } = useTranslation();

    const handleSelect = (value) => {
        updateFormData('preferredFoot', value);
        setTimeout(() => onNext(), 300);
    };

    return (
        <div className="onboarding-step">
            <div className="step-icon-wrapper">
                <span className="step-emoji">👟</span>
            </div>

            <h1 className="step-title">{t('auth.onboarding.foot.title')}</h1>
            <p className="step-subtitle">
                {t('auth.onboarding.foot.subtitle')}
            </p>

            <div className="selection-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                {FOOT_OPTIONS.map((foot) => (
                    <div
                        key={foot.value}
                        className={`selection-card ${formData.preferredFoot === foot.value ? 'selected' : ''}`}
                        onClick={() => handleSelect(foot.value)}
                        style={{ padding: '24px 8px' }}
                    >
                        <div className="card-icon">{foot.icon}</div>
                        <div className="card-label">{t(foot.labelKey)}</div>
                    </div>
                ))}
            </div>

            <div className="step-actions">
                <button className="btn-secondary" onClick={onBack}>
                    {t('common.back')}
                </button>
                <button className="btn-ghost" onClick={onSkip}>
                    {t('common.skip')}
                </button>
                <button
                    className="btn-primary"
                    onClick={onNext}
                    disabled={!formData.preferredFoot}
                >
                    {t('common.next')}
                </button>
            </div>
        </div>
    );
};

export default FootStep;
