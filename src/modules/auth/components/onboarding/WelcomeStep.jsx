import React from 'react';
import { useTranslation } from 'react-i18next';

const WelcomeStep = ({ onNext }) => {
    const { t } = useTranslation();

    return (
        <div className="onboarding-step welcome-step">
            <div className="welcome-icon">
                <span className="ball-emoji">⚽</span>
            </div>

            <h1 className="welcome-title">
                {t('auth.onboarding.welcome.title')}
            </h1>

            <p className="welcome-subtitle">
                {t('auth.onboarding.welcome.subtitle')}
            </p>

            <button className="start-btn" onClick={onNext}>
                🚀 {t('auth.onboarding.welcome.startBtn')}
            </button>

            <style>{`
                .welcome-step {
                    justify-content: center;
                    min-height: 80vh;
                }

                .welcome-icon {
                    width: 140px;
                    height: 140px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-bottom: 40px;
                    background: rgba(255,255,255,0.03);
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 50%;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                }

                .ball-emoji {
                    font-size: 72px;
                    animation: bounce 2s ease-in-out infinite;
                }

                @keyframes bounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-12px); }
                }

                .welcome-title {
                    font-size: 42px;
                    font-weight: 800;
                    margin: 0 0 20px;
                    background: linear-gradient(180deg, #ffffff 0%, rgba(255,255,255,0.7) 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    text-align: center;
                }

                .welcome-subtitle {
                    font-size: 18px;
                    color: rgba(255, 255, 255, 0.6);
                    text-align: center;
                    margin: 0 0 48px;
                    line-height: 1.6;
                    max-width: 340px;
                }

                .start-btn {
                    width: 100%;
                    max-width: 320px;
                    height: 72px;
                    font-size: 24px;
                    font-weight: 700;
                    border-radius: 20px;
                    border: none;
                    cursor: pointer;
                    background: linear-gradient(135deg, #52c41a 0%, #237804 100%);
                    color: white;
                    box-shadow: 0 12px 36px rgba(82, 196, 26, 0.45);
                    transition: all 0.25s ease;
                    letter-spacing: 0.5px;
                }

                .start-btn:hover {
                    transform: translateY(-3px) scale(1.02);
                    box-shadow: 0 16px 48px rgba(82, 196, 26, 0.55);
                }

                .start-btn:active {
                    transform: translateY(0) scale(1);
                }
            `}</style>
        </div>
    );
};

export default WelcomeStep;
