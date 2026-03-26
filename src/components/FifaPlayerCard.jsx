import React from 'react';
import { useTranslation } from 'react-i18next';
import { getCardTier, calculateStats, calculateOverall } from '../utils/fifaUtils';

const FifaPlayerCard = ({ user, size = 'medium', showStats = true, onClick }) => {
    const { t } = useTranslation();
    const tier = getCardTier(user);
    const stats = calculateStats(user);
    const overall = calculateOverall(stats, user?.position);

    const tierColors = {
        locked: {
            primary: '#3a3a3a',
            secondary: '#2a2a2a',
            accent: '#555',
            glow: 'rgba(100, 100, 100, 0.3)'
        },
        bronze: {
            primary: '#cd7f32',
            secondary: '#8b4513',
            accent: '#daa06d',
            glow: 'rgba(205, 127, 50, 0.4)'
        },
        silver: {
            primary: '#c0c0c0',
            secondary: '#a8a8a8',
            accent: '#e8e8e8',
            glow: 'rgba(192, 192, 192, 0.5)'
        },
        gold: {
            primary: '#ffd700',
            secondary: '#daa520',
            accent: '#ffed4a',
            glow: 'rgba(255, 215, 0, 0.5)'
        }
    };

    const colors = tierColors[tier];

    const sizeStyles = {
        small: { width: 140, height: 200, fontSize: 10 },
        medium: { width: 200, height: 280, fontSize: 12 },
        large: { width: 280, height: 400, fontSize: 16 }
    };

    const { width, height, fontSize } = sizeStyles[size];

    const positionLabels = {
        'GK': t('profile.fifa.positions.GK'),
        'DEF': t('profile.fifa.positions.DEF'),
        'MID': t('profile.fifa.positions.MID'),
        'FWD': t('profile.fifa.positions.FWD'),
        'ANY': t('profile.fifa.positions.ANY'),
    };

    return (
        <div
            className="fifa-card"
            onClick={onClick}
            style={{
                '--card-width': `${width}px`,
                '--card-height': `${height}px`,
                '--primary-color': colors.primary,
                '--secondary-color': colors.secondary,
                '--accent-color': colors.accent,
                '--glow-color': colors.glow,
                '--font-size': `${fontSize}px`
            }}
        >
            {tier === 'locked' ? (
                <div className="locked-overlay">
                    <div className="lock-icon">🔒</div>
                    <div className="lock-text">{t('profile.fifa.fillProfile')}</div>
                    <div className="lock-subtext">{t('profile.fifa.toUnlock')}</div>
                </div>
            ) : (
                <>
                    {/* Card Header: Overall + Position */}
                    <div className="card-header">
                        <div className="overall">{overall}</div>
                        <div className="position">{positionLabels[user?.position] || t('profile.fifa.positions.default')}</div>
                    </div>

                    {/* Player Photo */}
                    <div className="player-photo">
                        {user?.avatar ? (
                            <img src={user.avatar} alt={user.name} />
                        ) : (
                            <div className="photo-placeholder">⚽</div>
                        )}
                    </div>

                    {/* Player Name */}
                    <div className="player-name">
                        {user?.name || t('profile.fifa.playerFallback')}
                    </div>

                    {/* Stats Grid */}
                    {showStats && (
                        <div className="stats-grid">
                            <div className="stat">
                                <span className="stat-value">{stats.pac}</span>
                                <span className="stat-label">PAC</span>
                            </div>
                            <div className="stat">
                                <span className="stat-value">{stats.sho}</span>
                                <span className="stat-label">SHO</span>
                            </div>
                            <div className="stat">
                                <span className="stat-value">{stats.pas}</span>
                                <span className="stat-label">PAS</span>
                            </div>
                            <div className="stat">
                                <span className="stat-value">{stats.dri}</span>
                                <span className="stat-label">DRI</span>
                            </div>
                            <div className="stat">
                                <span className="stat-value">{stats.def}</span>
                                <span className="stat-label">DEF</span>
                            </div>
                            <div className="stat">
                                <span className="stat-value">{stats.phy}</span>
                                <span className="stat-label">PHY</span>
                            </div>
                        </div>
                    )}

                    {/* Tier Badge */}
                    <div className="tier-badge">
                        {tier === 'gold' && '🏆'}
                        {tier === 'silver' && '🥈'}
                        {tier === 'bronze' && '🥉'}
                    </div>
                </>
            )}

            <style>{`
                .fifa-card {
                    width: var(--card-width);
                    height: var(--card-height);
                    position: relative;
                    border-radius: 16px;
                    background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
                    box-shadow: 
                        0 4px 20px var(--glow-color),
                        inset 0 1px 1px rgba(255,255,255,0.3);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    padding: calc(var(--font-size) * 0.8);
                    cursor: ${onClick ? 'pointer' : 'default'};
                    transition: all 0.3s ease;
                    overflow: hidden;
                    font-family: 'Inter', -apple-system, sans-serif;
                }
                
                .fifa-card:hover {
                    transform: ${onClick ? 'translateY(-4px) scale(1.02)' : 'none'};
                    box-shadow: ${onClick ? '0 8px 30px var(--glow-color)' : '0 4px 20px var(--glow-color)'};
                }
                
                .fifa-card::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: 
                        linear-gradient(180deg, rgba(255,255,255,0.2) 0%, transparent 40%),
                        radial-gradient(ellipse at top, rgba(255,255,255,0.15) 0%, transparent 60%);
                    pointer-events: none;
                }
                
                .locked-overlay {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 100%;
                    text-align: center;
                    color: #888;
                }
                
                .lock-icon {
                    font-size: calc(var(--font-size) * 4);
                    margin-bottom: 10px;
                }
                
                .lock-text {
                    font-size: calc(var(--font-size) * 1.2);
                    font-weight: 600;
                    color: #aaa;
                }
                
                .lock-subtext {
                    font-size: var(--font-size);
                    color: #777;
                    margin-top: 4px;
                }
                
                .card-header {
                    position: absolute;
                    top: calc(var(--font-size) * 0.8);
                    left: calc(var(--font-size) * 0.8);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    z-index: 1;
                }
                
                .overall {
                    font-size: calc(var(--font-size) * 2.5);
                    font-weight: 800;
                    color: #1a1a2e;
                    text-shadow: 0 1px 2px rgba(255,255,255,0.5);
                    line-height: 1;
                }
                
                .position {
                    font-size: calc(var(--font-size) * 1.1);
                    font-weight: 700;
                    color: #1a1a2e;
                    text-shadow: 0 1px 1px rgba(255,255,255,0.3);
                }
                
                .player-photo {
                    width: calc(var(--card-width) * 0.55);
                    height: calc(var(--card-width) * 0.55);
                    border-radius: 50%;
                    overflow: hidden;
                    border: 3px solid var(--accent-color);
                    background: rgba(0,0,0,0.2);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-top: calc(var(--font-size) * 2);
                    position: relative;
                    z-index: 1;
                }
                
                .player-photo img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
                
                .photo-placeholder {
                    font-size: calc(var(--font-size) * 3);
                }
                
                .player-name {
                    font-size: calc(var(--font-size) * 1.3);
                    font-weight: 700;
                    color: #1a1a2e;
                    margin-top: calc(var(--font-size) * 0.6);
                    text-align: center;
                    text-shadow: 0 1px 1px rgba(255,255,255,0.4);
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    max-width: 90%;
                    position: relative;
                    z-index: 1;
                }
                
                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: calc(var(--font-size) * 0.5);
                    margin-top: auto;
                    padding: calc(var(--font-size) * 0.5);
                    background: rgba(0,0,0,0.15);
                    border-radius: 8px;
                    width: 90%;
                    position: relative;
                    z-index: 1;
                }
                
                .stat {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                }
                
                .stat-value {
                    font-size: calc(var(--font-size) * 1.4);
                    font-weight: 800;
                    color: #1a1a2e;
                }
                
                .stat-label {
                    font-size: calc(var(--font-size) * 0.8);
                    font-weight: 600;
                    color: rgba(26, 26, 46, 0.7);
                }
                
                .tier-badge {
                    position: absolute;
                    top: calc(var(--font-size) * 0.6);
                    right: calc(var(--font-size) * 0.6);
                    font-size: calc(var(--font-size) * 1.5);
                }
            `}</style>
        </div>
    );
};

export default FifaPlayerCard;
