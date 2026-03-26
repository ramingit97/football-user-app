import React from 'react';
import { useTranslation } from 'react-i18next';

const FeatureHighlight = ({ icon, title, description, onNext }) => {
    const { t } = useTranslation();

    return (
        <div className="onboarding-step feature-step">
            <div className="feature-card">
                <div className="feature-glow"></div>

                <div className="feature-icon">{icon}</div>

                <h2 className="feature-title">{title}</h2>

                <p className="feature-description">{description}</p>
            </div>

            <button className="feature-btn" onClick={onNext}>
                🔥 {t('auth.onboarding.modal.featureBtn')}
            </button>

            <style>{`
                .feature-step {
                    justify-content: center;
                    min-height: 70vh;
                }

                .feature-card {
                    background: linear-gradient(135deg, rgba(82,196,26,0.12) 0%, rgba(56,158,13,0.04) 100%);
                    border-radius: 32px;
                    padding: 48px 32px;
                    margin-bottom: 40px;
                    border: 1px solid rgba(82, 196, 26, 0.2);
                    box-shadow: 0 24px 64px rgba(0,0,0,0.3);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    text-align: center;
                    position: relative;
                    overflow: hidden;
                    width: 100%;
                    max-width: 400px;
                }

                .feature-glow {
                    position: absolute;
                    top: -60px;
                    right: -60px;
                    width: 180px;
                    height: 180px;
                    background: radial-gradient(circle, rgba(82,196,26,0.25) 0%, transparent 70%);
                    border-radius: 50%;
                    filter: blur(30px);
                    pointer-events: none;
                }

                .feature-icon {
                    font-size: 80px;
                    margin-bottom: 24px;
                    z-index: 1;
                    filter: drop-shadow(0 8px 16px rgba(0,0,0,0.3));
                }

                .feature-title {
                    color: white;
                    font-size: 32px;
                    font-weight: 800;
                    margin: 0 0 16px;
                    line-height: 1.2;
                    z-index: 1;
                }

                .feature-description {
                    color: rgba(255,255,255,0.7);
                    font-size: 17px;
                    margin: 0;
                    line-height: 1.6;
                    z-index: 1;
                    max-width: 300px;
                }

                .feature-btn {
                    width: 100%;
                    max-width: 280px;
                    height: 64px;
                    font-size: 22px;
                    font-weight: 700;
                    border-radius: 18px;
                    border: none;
                    cursor: pointer;
                    background: linear-gradient(135deg, #52c41a 0%, #237804 100%);
                    color: white;
                    box-shadow: 0 10px 32px rgba(82, 196, 26, 0.45);
                    transition: all 0.25s ease;
                }

                .feature-btn:hover {
                    transform: translateY(-3px) scale(1.02);
                    box-shadow: 0 14px 40px rgba(82, 196, 26, 0.55);
                }

                .feature-btn:active {
                    transform: translateY(0) scale(1);
                }
            `}</style>
        </div>
    );
};

export default FeatureHighlight;
