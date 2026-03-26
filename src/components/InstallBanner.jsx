import React, { useState } from 'react';
import { message } from 'antd';
import useIsPwaInstalled from '../hooks/useIsPwaInstalled';
import { useTranslation } from 'react-i18next';

/**
 * Banner prompting users to install the PWA for a bonus
 * Shows install instructions and handles bonus claim
 */
const InstallBanner = ({ user, onBonusClaim }) => {
    const { t } = useTranslation();
    const { isPwaInstalled, isLoading } = useIsPwaInstalled();
    const [claiming, setClaiming] = useState(false);
    const [dismissed, setDismissed] = useState(false);

    // Don't show if already dismissed, loading, or bonus already claimed
    if (dismissed || isLoading || user?.installBonusReceived) {
        return null;
    }

    const handleClaimBonus = async () => {
        if (!isPwaInstalled) {
            message.info(t('pwa.install.notInstalled'));
            return;
        }

        setClaiming(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/users/${user.id}/bonus/install`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();
            if (data.success) {
                message.success(data.message);
                onBonusClaim?.();
            } else {
                message.warning(data.message);
            }
        } catch (error) {
            message.error(t('pwa.install.bonusError'));
        } finally {
            setClaiming(false);
        }
    };

    // If already installed as PWA, show claim button
    if (isPwaInstalled) {
        return (
            <div className="install-banner installed">
                <div className="banner-content">
                    <span className="banner-icon">🎉</span>
                    <div className="banner-text">
                        <div className="banner-title">{t('pwa.install.installed')}</div>
                        <div className="banner-subtitle">{t('pwa.install.installedBonus')}</div>
                    </div>
                </div>
                <button
                    className="claim-btn"
                    onClick={handleClaimBonus}
                    disabled={claiming}
                >
                    {claiming ? '⏳' : `🎁 ${t('pwa.install.getBonusBtn')}`}
                </button>

                <style>{bannerStyles}</style>
            </div>
        );
    }

    // Show install instructions
    return (
        <div className="install-banner">
            <div className="banner-content">
                <span className="banner-icon">📲</span>
                <div className="banner-text">
                    <div className="banner-title">{t('pwa.install.addToScreen')}</div>
                    <div className="banner-subtitle">
                        {t('pwa.install.iosInstructions')}
                    </div>
                </div>
            </div>
            <button
                className="dismiss-btn"
                onClick={() => setDismissed(true)}
            >
                ✕
            </button>

            <style>{bannerStyles}</style>
        </div>
    );
};

const bannerStyles = `
    .install-banner {
        display: flex;
        align-items: center;
        justify-content: space-between;
        background: linear-gradient(135deg, rgba(82, 196, 26, 0.15) 0%, rgba(82, 196, 26, 0.05) 100%);
        border: 1px solid rgba(82, 196, 26, 0.3);
        border-radius: 16px;
        padding: 16px 20px;
        margin-bottom: 16px;
        animation: slideIn 0.3s ease;
    }

    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateY(-10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    .install-banner.installed {
        background: linear-gradient(135deg, rgba(250, 173, 20, 0.2) 0%, rgba(250, 173, 20, 0.05) 100%);
        border-color: rgba(250, 173, 20, 0.4);
    }

    .banner-content {
        display: flex;
        align-items: center;
        gap: 14px;
    }

    .banner-icon {
        font-size: 28px;
    }

    .banner-text {
        display: flex;
        flex-direction: column;
    }

    .banner-title {
        font-size: 15px;
        font-weight: 600;
        color: white;
    }

    .banner-subtitle {
        font-size: 13px;
        color: rgba(255, 255, 255, 0.6);
        margin-top: 2px;
    }

    .claim-btn {
        background: linear-gradient(135deg, #52c41a 0%, #237804 100%);
        border: none;
        border-radius: 10px;
        padding: 10px 16px;
        color: white;
        font-weight: 600;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.2s;
        white-space: nowrap;
    }

    .claim-btn:hover {
        transform: scale(1.05);
        box-shadow: 0 4px 12px rgba(82, 196, 26, 0.4);
    }

    .claim-btn:disabled {
        opacity: 0.7;
        cursor: not-allowed;
        transform: none;
    }

    .dismiss-btn {
        background: transparent;
        border: none;
        color: rgba(255, 255, 255, 0.4);
        font-size: 18px;
        cursor: pointer;
        padding: 8px;
        transition: color 0.2s;
    }

    .dismiss-btn:hover {
        color: rgba(255, 255, 255, 0.7);
    }
`;

export default InstallBanner;
