import React from 'react';
import { useTranslation } from 'react-i18next';

const POSITIONS = [
    { value: 'GK', labelKey: 'positions.goalkeeper', icon: '🧤' },
    { value: 'DEF', labelKey: 'positions.defender', icon: '🛡️' },
    { value: 'MID', labelKey: 'positions.midfielder', icon: '🎯' },
    { value: 'FWD', labelKey: 'positions.forward', icon: '⚡' },
    { value: 'ANY', labelKey: 'positions.universal', icon: '🔄', fullWidth: true },
];

const PositionStep = ({ formData, updateFormData, onNext, onBack }) => {
    const { t } = useTranslation();

    const handleSelect = (value) => {
        updateFormData('position', value);
        setTimeout(() => onNext(), 300);
    };

    return (
        <div className="onboarding-step">
            <div className="step-icon-wrapper">
                <span className="step-emoji">⚽</span>
            </div>

            <h1 className="step-title">{t('auth.onboarding.position.title')}</h1>
            <p className="step-subtitle">
                {t('auth.onboarding.position.subtitle')}
            </p>

            <div className="selection-grid">
                {POSITIONS.filter(p => !p.fullWidth).map((pos) => (
                    <div
                        key={pos.value}
                        className={`selection-card ${formData.position === pos.value ? 'selected' : ''}`}
                        onClick={() => handleSelect(pos.value)}
                    >
                        <div className="card-icon">{pos.icon}</div>
                        <div className="card-label">{t(pos.labelKey)}</div>
                    </div>
                ))}
            </div>

            {/* Universal - Full width */}
            <div
                className={`selection-card ${formData.position === 'ANY' ? 'selected' : ''}`}
                onClick={() => handleSelect('ANY')}
                style={{ width: '100%', flexDirection: 'row', justifyContent: 'center', gap: 16 }}
            >
                <span style={{ fontSize: 24 }}>🔄</span>
                <span className="card-label">{t('auth.onboarding.position.universalDesc')}</span>
            </div>

            <div className="step-actions">
                <button className="btn-secondary" onClick={onBack}>
                    {t('common.back')}
                </button>
                <button
                    className="btn-primary"
                    onClick={onNext}
                    disabled={!formData.position}
                >
                    {t('common.next')}
                </button>
            </div>
        </div>
    );
};

export default PositionStep;
