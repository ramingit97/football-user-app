import React from 'react';
import { useTranslation } from 'react-i18next';

// Archetype definitions with initial stat mappings (1-10 scale)
const PLAY_STYLES = [
    {
        value: 'speedster',
        labelKey: 'auth.onboarding.playStyle.styles.runner.label',
        descKey: 'auth.onboarding.playStyle.styles.runner.desc',
        icon: '🏃',
        stats: { speed: 8, stamina: 7, attack: 6, defense: 4 },
        color: '#00d4ff'
    },
    {
        value: 'defender',
        labelKey: 'auth.onboarding.playStyle.styles.wall.label',
        descKey: 'auth.onboarding.playStyle.styles.wall.desc',
        icon: '🧱',
        stats: { speed: 5, stamina: 7, attack: 3, defense: 9 },
        color: '#ff6b35'
    },
    {
        value: 'playmaker',
        labelKey: 'auth.onboarding.playStyle.styles.playmaker.label',
        descKey: 'auth.onboarding.playStyle.styles.playmaker.desc',
        icon: '🧠',
        stats: { speed: 5, stamina: 6, attack: 7, defense: 5 },
        color: '#a855f7'
    },
    {
        value: 'finisher',
        labelKey: 'auth.onboarding.playStyle.styles.scorer.label',
        descKey: 'auth.onboarding.playStyle.styles.scorer.desc',
        icon: '⚽',
        stats: { speed: 6, stamina: 5, attack: 9, defense: 2 },
        color: '#f43f5e'
    },
    {
        value: 'allrounder',
        labelKey: 'auth.onboarding.playStyle.styles.allRounder.label',
        descKey: 'auth.onboarding.playStyle.styles.allRounder.desc',
        icon: '🔄',
        stats: { speed: 6, stamina: 6, attack: 6, defense: 6 },
        color: '#52c41a'
    },
];

// Export for use in onboarding submission
export const ARCHETYPE_STATS = PLAY_STYLES.reduce((acc, style) => {
    acc[style.value] = style.stats;
    return acc;
}, {});

const PlayStyleStep = ({ formData, updateFormData, onNext, onBack }) => {
    const { t } = useTranslation();

    const handleSelect = (value) => {
        updateFormData('playStyle', value);
        // Also store the mapped stats for registration
        const style = PLAY_STYLES.find(s => s.value === value);
        if (style) {
            updateFormData('speedRating', style.stats.speed * 10);
            updateFormData('staminaRating', style.stats.stamina * 10);
            updateFormData('attackRating', style.stats.attack * 10);
            updateFormData('defenseRating', style.stats.defense * 10);
        }
        setTimeout(() => onNext(), 400);
    };

    return (
        <div className="onboarding-step">
            <div className="step-icon-wrapper">
                <span className="step-emoji">🎮</span>
            </div>

            <h1 className="step-title">{t('auth.onboarding.playStyle.title')}</h1>
            <p className="step-subtitle">
                {t('auth.onboarding.playStyle.subtitle')}
            </p>

            <div className="playstyle-grid">
                {PLAY_STYLES.map((style) => {
                    const isSelected = formData.playStyle === style.value;
                    return (
                        <div
                            key={style.value}
                            className={`playstyle-card ${isSelected ? 'selected' : ''}`}
                            onClick={() => handleSelect(style.value)}
                            style={{
                                '--card-color': style.color,
                                '--card-glow': `${style.color}33`
                            }}
                        >
                            <div className="playstyle-header">
                                <div className="playstyle-icon">{style.icon}</div>
                                <div className="playstyle-label">{t(style.labelKey)}</div>
                                {isSelected && <div className="playstyle-check">✓</div>}
                            </div>
                            <div className="playstyle-desc">{t(style.descKey)}</div>

                            {/* Mini stat bars */}
                            <div className="playstyle-stats">
                                {Object.entries(style.stats).map(([key, val]) => (
                                    <div key={key} className="mini-stat">
                                        <span className="mini-stat-label">
                                            {key === 'speed' ? 'SPD' : key === 'stamina' ? 'STA' : key === 'attack' ? 'ATK' : 'DEF'}
                                        </span>
                                        <div className="mini-stat-bar">
                                            <div
                                                className="mini-stat-fill"
                                                style={{ width: `${val * 10}%` }}
                                            />
                                        </div>
                                        <span className="mini-stat-val">{val}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="step-actions">
                <button className="btn-secondary" onClick={onBack}>
                    {t('common.back')}
                </button>
                <button
                    className="btn-primary"
                    onClick={onNext}
                    disabled={!formData.playStyle}
                >
                    {t('common.next')}
                </button>
            </div>

            <style>{`
                .playstyle-grid {
                    width: 100%;
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    margin-bottom: 24px;
                }

                .playstyle-card {
                    background: rgba(255,255,255,0.04);
                    border: 1px solid rgba(255,255,255,0.08);
                    border-radius: 16px;
                    padding: 16px;
                    cursor: pointer;
                    transition: all 0.25s ease;
                }

                .playstyle-card:hover {
                    background: rgba(255,255,255,0.08);
                    border-color: var(--card-color);
                    transform: translateY(-2px);
                    box-shadow: 0 6px 24px var(--card-glow);
                }

                .playstyle-card.selected {
                    background: rgba(255,255,255,0.08);
                    border-color: var(--card-color);
                    box-shadow: 0 4px 20px var(--card-glow), inset 0 0 0 1px var(--card-color);
                }

                .playstyle-header {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 6px;
                }

                .playstyle-icon {
                    font-size: 28px;
                    width: 44px;
                    height: 44px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: rgba(255,255,255,0.08);
                    border-radius: 12px;
                }

                .playstyle-label {
                    font-size: 17px;
                    font-weight: 700;
                    color: white;
                    flex: 1;
                }

                .playstyle-check {
                    width: 26px;
                    height: 26px;
                    background: var(--card-color);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-weight: bold;
                    font-size: 13px;
                    animation: scaleIn 0.2s ease;
                }

                @keyframes scaleIn {
                    from { transform: scale(0); }
                    to { transform: scale(1); }
                }

                .playstyle-desc {
                    font-size: 13px;
                    color: rgba(255,255,255,0.45);
                    margin-bottom: 10px;
                    padding-left: 56px;
                }

                .playstyle-stats {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 4px 16px;
                    padding-left: 56px;
                }

                .mini-stat {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }

                .mini-stat-label {
                    font-size: 10px;
                    font-weight: 600;
                    color: rgba(255,255,255,0.35);
                    width: 28px;
                    letter-spacing: 0.5px;
                }

                .mini-stat-bar {
                    flex: 1;
                    height: 4px;
                    background: rgba(255,255,255,0.08);
                    border-radius: 2px;
                    overflow: hidden;
                }

                .mini-stat-fill {
                    height: 100%;
                    background: var(--card-color);
                    border-radius: 2px;
                    transition: width 0.4s ease;
                }

                .mini-stat-val {
                    font-size: 11px;
                    font-weight: 600;
                    color: rgba(255,255,255,0.6);
                    width: 14px;
                    text-align: right;
                }
            `}</style>
        </div>
    );
};

export default PlayStyleStep;
