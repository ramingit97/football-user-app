import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

const POSITION_LABEL_KEYS = {
    'GK': 'positions.goalkeeper',
    'DEF': 'positions.defender',
    'MID': 'positions.midfielder',
    'FWD': 'positions.forward',
    'ANY': 'positions.universal'
};

const POSITION_ICONS = {
    'GK': '🧤',
    'DEF': '🛡️',
    'MID': '⚙️',
    'FWD': '⚡',
    'ANY': '⭐'
};

const CompletionStep = ({ formData, onComplete }) => {
    const { t } = useTranslation();
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setVisible(true), 100);
        return () => clearTimeout(timer);
    }, []);

    const positionIcon = POSITION_ICONS[formData.position] || '⚽';
    const positionLabel = POSITION_LABEL_KEYS[formData.position]
        ? t(POSITION_LABEL_KEYS[formData.position])
        : formData.position;

    return (
        <div className="completion-root">
            {/* Background glow blobs */}
            <div className="blob blob-green" />
            <div className="blob blob-blue" />

            <div className={`completion-content ${visible ? 'visible' : ''}`}>

                {/* Trophy icon with pulse ring */}
                <div className="trophy-wrapper">
                    <div className="trophy-ring" />
                    <div className="trophy-circle">
                        <span className="trophy-emoji">🏆</span>
                    </div>
                </div>

                {/* Texts */}
                <h1 className="completion-title">
                    {t('auth.onboarding.completion.title')}
                </h1>
                <p className="completion-sub">
                    {t('auth.onboarding.completion.subtitle')}
                </p>

                {/* Profile card */}
                <div className="profile-card">
                    {/* Avatar */}
                    <div className="avatar-ring">
                        <div
                            className="avatar"
                            style={formData.avatar
                                ? { backgroundImage: `url(${formData.avatar})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                                : {}
                            }
                        >
                            {!formData.avatar && (
                                <span className="avatar-initial">
                                    {formData.name?.charAt(0)?.toUpperCase()}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="profile-name">{formData.name}</div>

                    <div className="profile-tags">
                        <span className="ptag ptag-green">
                            {positionIcon} {positionLabel}
                        </span>
                        {formData.district && (
                            <span className="ptag ptag-blue">
                                📍 {formData.district}
                            </span>
                        )}
                        {formData.age && (
                            <span className="ptag ptag-ghost">
                                🎂 {formData.age} {t('auth.onboarding.completion.years')}
                            </span>
                        )}
                    </div>
                </div>

                {/* Bonus badge */}
                <div className="bonus-badge">
                    <span className="bonus-icon">🎁</span>
                    <span className="bonus-text">{t('auth.onboarding.completion.bonus')}</span>
                </div>

                {/* CTA button */}
                <button className="cta-btn" onClick={onComplete}>
                    <span className="cta-icon">⚽</span>
                    {t('auth.onboarding.completion.findGameBtn')}
                </button>
            </div>

            <style>{`
                .completion-root {
                    position: relative;
                    width: 100%;
                    min-height: 100%;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    overflow: hidden;
                }

                .blob {
                    position: fixed;
                    border-radius: 50%;
                    filter: blur(80px);
                    pointer-events: none;
                    z-index: 0;
                }
                .blob-green {
                    width: 400px;
                    height: 400px;
                    background: radial-gradient(circle, rgba(82,196,26,0.18) 0%, transparent 70%);
                    top: -100px;
                    left: 50%;
                    transform: translateX(-50%);
                }
                .blob-blue {
                    width: 300px;
                    height: 300px;
                    background: radial-gradient(circle, rgba(24,144,255,0.12) 0%, transparent 70%);
                    bottom: 0;
                    right: -80px;
                }

                .completion-content {
                    position: relative;
                    z-index: 1;
                    width: 100%;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    opacity: 0;
                    transform: translateY(28px);
                    transition: opacity 0.6s cubic-bezier(0.16,1,0.3,1), transform 0.6s cubic-bezier(0.16,1,0.3,1);
                }
                .completion-content.visible {
                    opacity: 1;
                    transform: translateY(0);
                }

                /* Trophy */
                .trophy-wrapper {
                    position: relative;
                    width: 110px;
                    height: 110px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-bottom: 24px;
                }
                .trophy-ring {
                    position: absolute;
                    inset: -8px;
                    border-radius: 50%;
                    border: 2px solid rgba(82,196,26,0.3);
                    animation: pulse-ring 2.4s ease-out infinite;
                }
                @keyframes pulse-ring {
                    0%   { transform: scale(0.92); opacity: 0.7; }
                    60%  { transform: scale(1.1);  opacity: 0; }
                    100% { transform: scale(1.1);  opacity: 0; }
                }
                .trophy-circle {
                    width: 96px;
                    height: 96px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, rgba(82,196,26,0.22) 0%, rgba(56,158,13,0.12) 100%);
                    border: 2px solid rgba(82,196,26,0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 0 40px rgba(82,196,26,0.2), 0 8px 32px rgba(0,0,0,0.3);
                }
                .trophy-emoji {
                    font-size: 48px;
                    animation: trophy-bounce 1.8s ease-in-out infinite;
                }
                @keyframes trophy-bounce {
                    0%, 100% { transform: translateY(0); }
                    50%      { transform: translateY(-6px); }
                }

                /* Texts */
                .completion-title {
                    font-size: 32px;
                    font-weight: 800;
                    margin: 0 0 10px;
                    background: linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.75) 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    text-align: center;
                    letter-spacing: -0.5px;
                }
                .completion-sub {
                    font-size: 15px;
                    color: rgba(255,255,255,0.55);
                    text-align: center;
                    margin: 0 0 28px;
                    line-height: 1.5;
                }

                /* Profile card */
                .profile-card {
                    width: 100%;
                    background: rgba(255,255,255,0.04);
                    border: 1px solid rgba(255,255,255,0.08);
                    border-radius: 24px;
                    padding: 28px 20px 24px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    margin-bottom: 16px;
                    backdrop-filter: blur(12px);
                }

                .avatar-ring {
                    width: 88px;
                    height: 88px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #52c41a, #1890ff);
                    padding: 3px;
                    margin-bottom: 16px;
                    box-shadow: 0 4px 24px rgba(82,196,26,0.25);
                }
                .avatar {
                    width: 100%;
                    height: 100%;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #52c41a 0%, #389e0d 100%);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 2px solid #0f1216;
                }
                .avatar-initial {
                    font-size: 34px;
                    font-weight: 700;
                    color: white;
                }

                .profile-name {
                    font-size: 22px;
                    font-weight: 700;
                    color: white;
                    margin-bottom: 14px;
                }

                .profile-tags {
                    display: flex;
                    gap: 8px;
                    flex-wrap: wrap;
                    justify-content: center;
                }

                .ptag {
                    padding: 5px 14px;
                    border-radius: 20px;
                    font-size: 13px;
                    font-weight: 600;
                }
                .ptag-green {
                    background: rgba(82,196,26,0.15);
                    color: #73d13d;
                    border: 1px solid rgba(82,196,26,0.25);
                }
                .ptag-blue {
                    background: rgba(24,144,255,0.15);
                    color: #69b4ff;
                    border: 1px solid rgba(24,144,255,0.2);
                }
                .ptag-ghost {
                    background: rgba(255,255,255,0.06);
                    color: rgba(255,255,255,0.7);
                    border: 1px solid rgba(255,255,255,0.1);
                }

                /* Bonus badge */
                .bonus-badge {
                    width: 100%;
                    background: linear-gradient(135deg, #531dab 0%, #722ed1 100%);
                    border-radius: 16px;
                    padding: 14px 20px;
                    margin-bottom: 28px;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    box-shadow: 0 6px 24px rgba(114,46,209,0.35);
                }
                .bonus-icon {
                    font-size: 22px;
                    flex-shrink: 0;
                }
                .bonus-text {
                    font-size: 15px;
                    font-weight: 600;
                    color: white;
                }

                /* CTA Button */
                .cta-btn {
                    width: 100%;
                    height: 60px;
                    border-radius: 30px;
                    background: linear-gradient(135deg, #52c41a 0%, #389e0d 100%);
                    border: none;
                    color: white;
                    font-size: 18px;
                    font-weight: 700;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    box-shadow: 0 8px 32px rgba(82,196,26,0.4), 0 2px 8px rgba(0,0,0,0.2);
                    transition: transform 0.18s, box-shadow 0.18s;
                    letter-spacing: 0.2px;
                }
                .cta-btn:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 14px 40px rgba(82,196,26,0.5), 0 4px 12px rgba(0,0,0,0.2);
                }
                .cta-btn:active {
                    transform: translateY(0);
                    box-shadow: 0 4px 16px rgba(82,196,26,0.3);
                }
                .cta-icon {
                    font-size: 22px;
                }
            `}</style>
        </div>
    );
};

export default CompletionStep;
