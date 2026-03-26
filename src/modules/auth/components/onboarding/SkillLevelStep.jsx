import React from 'react';
import { useTranslation } from 'react-i18next';

const SKILL_LEVELS = [
    { value: 'beginner', labelKey: 'auth.onboarding.skillLevel.levels.beginner.label', descKey: 'auth.onboarding.skillLevel.levels.beginner.desc', icon: '🌱' },
    { value: 'amateur', labelKey: 'auth.onboarding.skillLevel.levels.amateur.label', descKey: 'auth.onboarding.skillLevel.levels.amateur.desc', icon: '⚽' },
    { value: 'pro', labelKey: 'auth.onboarding.skillLevel.levels.pro.label', descKey: 'auth.onboarding.skillLevel.levels.pro.desc', icon: '🏆' },
];

const SkillLevelStep = ({ formData, updateFormData, onNext, onBack }) => {
    const { t } = useTranslation();

    const handleSelect = (value) => {
        updateFormData('skillLevel', value);
        setTimeout(() => onNext(), 300);
    };

    return (
        <div className="onboarding-step">
            <div className="step-icon-wrapper">
                <span className="step-emoji">⭐</span>
            </div>

            <h1 className="step-title">{t('auth.onboarding.skillLevel.title')}</h1>
            <p className="step-subtitle">
                {t('auth.onboarding.skillLevel.subtitle')}
            </p>

            <div className="skill-levels">
                {SKILL_LEVELS.map((level) => (
                    <div
                        key={level.value}
                        className={`skill-card ${formData.skillLevel === level.value ? 'selected' : ''}`}
                        onClick={() => handleSelect(level.value)}
                    >
                        <div className="skill-icon">{level.icon}</div>
                        <div className="skill-info">
                            <div className="skill-label">{t(level.labelKey)}</div>
                            <div className="skill-desc">{t(level.descKey)}</div>
                        </div>
                        {formData.skillLevel === level.value && (
                            <div className="skill-check">✓</div>
                        )}
                    </div>
                ))}
            </div>

            <div className="step-actions">
                <button className="btn-secondary" onClick={onBack}>
                    {t('common.back')}
                </button>
                <button
                    className="btn-primary"
                    onClick={onNext}
                    disabled={!formData.skillLevel}
                >
                    {t('common.next')}
                </button>
            </div>

            <style>{`
                .skill-levels {
                    width: 100%;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    margin-bottom: 24px;
                }

                .skill-card {
                    display: flex;
                    align-items: center;
                    background: rgba(255,255,255,0.05);
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 16px;
                    padding: 20px;
                    cursor: pointer;
                    transition: all 0.2s;
                    position: relative;
                }

                .skill-card:hover {
                    background: rgba(255,255,255,0.1);
                    transform: translateX(4px);
                }

                .skill-card.selected {
                    background: rgba(82, 196, 26, 0.15);
                    border-color: #52c41a;
                    box-shadow: 0 4px 20px rgba(82, 196, 26, 0.15);
                }

                .skill-icon {
                    font-size: 32px;
                    margin-right: 16px;
                    width: 50px;
                    height: 50px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: rgba(255,255,255,0.1);
                    border-radius: 12px;
                }

                .skill-info {
                    flex: 1;
                }

                .skill-label {
                    font-size: 18px;
                    font-weight: 600;
                    color: white;
                    margin-bottom: 4px;
                }

                .skill-desc {
                    font-size: 14px;
                    color: rgba(255,255,255,0.5);
                }

                .skill-check {
                    width: 28px;
                    height: 28px;
                    background: #52c41a;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-weight: bold;
                    font-size: 14px;
                }
            `}</style>
        </div>
    );
};

export default SkillLevelStep;
