import React from 'react';
import { useTranslation } from 'react-i18next';
import { getCardTier, calculateStats, calculateOverall } from '../utils/fifaUtils';

const KNOWN_POSITIONS = ['GK', 'DEF', 'MID', 'FWD', 'ANY'];

const FifaPlayerCard = ({ user, size = 'medium', showStats = true, onClick }) => {
    const { t } = useTranslation();
    const tier = getCardTier(user);
    const stats = calculateStats(user);
    const overall = calculateOverall(stats, user?.position);

    const tierColors = {
        locked: {
            primary:   '#3a3a3a',
            secondary: '#1f1f1f',
            accent:    '#666',
            ink:       '#bbb',
            glow:      'rgba(100, 100, 100, 0.25)',
        },
        bronze: {
            primary:   '#e29a5b',
            secondary: '#7a3d1a',
            accent:    '#fcd6a4',
            ink:       '#2a1505',
            glow:      'rgba(205, 127, 50, 0.45)',
        },
        silver: {
            primary:   '#e8e8e8',
            secondary: '#9a9a9a',
            accent:    '#ffffff',
            ink:       '#1a1a1a',
            glow:      'rgba(192, 192, 192, 0.55)',
        },
        gold: {
            primary:   '#ffe066',
            secondary: '#c79a18',
            accent:    '#fff7c2',
            ink:       '#1a1305',
            glow:      'rgba(255, 215, 0, 0.55)',
        },
    };

    const c = tierColors[tier];

    const sizeStyles = {
        small:  { width: 140, height: 220, fontSize: 10 },
        medium: { width: 200, height: 300, fontSize: 12 },
        large:  { width: 280, height: 420, fontSize: 16 },
    };
    const { width, height, fontSize } = sizeStyles[size];

    const positionLabels = {
        GK:  t('profile.fifa.positions.GK'),
        DEF: t('profile.fifa.positions.DEF'),
        MID: t('profile.fifa.positions.MID'),
        FWD: t('profile.fifa.positions.FWD'),
        ANY: t('profile.fifa.positions.ANY'),
    };
    const userPos = user?.position && KNOWN_POSITIONS.includes(user.position.toUpperCase())
        ? user.position.toUpperCase()
        : null;
    const positionLabel = userPos ? positionLabels[userPos] : null;

    return (
        <div
            className="fifa-card"
            onClick={onClick}
            style={{
                '--card-width':       `${width}px`,
                '--card-height':      `${height}px`,
                '--primary-color':    c.primary,
                '--secondary-color':  c.secondary,
                '--accent-color':     c.accent,
                '--ink-color':        c.ink,
                '--glow-color':       c.glow,
                '--font-size':        `${fontSize}px`,
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
                    {/* Decorative background */}
                    <div className="card-shine" />
                    <div className="card-pattern" />

                    {/* Header: OVR + position */}
                    <div className="card-header">
                        <div className="overall-block">
                            <div className="overall">{overall}</div>
                            <div className="overall-label">OVR</div>
                        </div>
                        {positionLabel && (
                            <div className="position">{positionLabel}</div>
                        )}
                    </div>

                    {/* Tier indicator */}
                    <div className="tier-badge" aria-hidden="true">
                        {tier === 'gold'   && '🏆'}
                        {tier === 'silver' && '🥈'}
                        {tier === 'bronze' && '🥉'}
                    </div>

                    {/* Player photo */}
                    <div className="player-photo-ring">
                        <div className="player-photo">
                            {user?.avatar ? (
                                <img src={user.avatar} alt={user.name} />
                            ) : (
                                <div className="photo-placeholder">⚽</div>
                            )}
                        </div>
                    </div>

                    {/* Name */}
                    <div className="player-name">
                        {user?.name || t('profile.fifa.playerFallback')}
                    </div>

                    <div className="divider" />

                    {/* Stats */}
                    {showStats && (
                        <div className="stats-grid">
                            {[
                                { v: stats.pac, l: 'PAC', k: 'pac' },
                                { v: stats.sho, l: 'SHO', k: 'sho' },
                                { v: stats.pas, l: 'PAS', k: 'pas' },
                                { v: stats.dri, l: 'DRI', k: 'dri' },
                                { v: stats.def, l: 'DEF', k: 'def' },
                                { v: stats.phy, l: 'PHY', k: 'phy' },
                            ].map(({ v, l, k }) => {
                                const full = t(`profile.fifa.stats.${k}`);
                                return (
                                    <div className="stat" key={l} title={full}>
                                        <span className="stat-value">{v}</span>
                                        <span className="stat-label">{l}</span>
                                        <span className="stat-full">{full}</span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </>
            )}

            <style>{`
                .fifa-card {
                    width: var(--card-width);
                    height: var(--card-height);
                    position: relative;
                    border-radius: 18px;
                    background:
                        radial-gradient(circle at 30% 20%, color-mix(in srgb, var(--accent-color) 40%, transparent) 0%, transparent 55%),
                        linear-gradient(160deg, var(--primary-color) 0%, var(--secondary-color) 100%);
                    box-shadow:
                        0 12px 32px var(--glow-color),
                        inset 0 1px 0 rgba(255, 255, 255, 0.35),
                        inset 0 0 0 1px rgba(255, 255, 255, 0.12);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    padding: calc(var(--font-size) * 0.9);
                    cursor: ${onClick ? 'pointer' : 'default'};
                    transition: transform 0.25s ease, box-shadow 0.25s ease;
                    overflow: hidden;
                    font-family: 'Outfit', 'Inter', -apple-system, sans-serif;
                    isolation: isolate;
                }
                .fifa-card:hover {
                    transform: ${onClick ? 'translateY(-4px) scale(1.02)' : 'none'};
                    box-shadow: ${onClick ? '0 16px 40px var(--glow-color)' : '0 12px 32px var(--glow-color)'};
                }

                .card-shine {
                    position: absolute; inset: 0;
                    background:
                        linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.18) 45%, transparent 60%),
                        linear-gradient(180deg, rgba(255,255,255,0.18) 0%, transparent 35%);
                    pointer-events: none;
                    mix-blend-mode: overlay;
                    z-index: 0;
                }
                .card-pattern {
                    position: absolute; inset: 0;
                    background-image:
                        radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px);
                    background-size: 14px 14px;
                    background-position: 0 0;
                    opacity: 0.4;
                    pointer-events: none;
                    z-index: 0;
                }

                .locked-overlay {
                    display: flex; flex-direction: column;
                    align-items: center; justify-content: center;
                    height: 100%; text-align: center; color: #888;
                }
                .lock-icon { font-size: calc(var(--font-size) * 4); margin-bottom: 10px; }
                .lock-text { font-size: calc(var(--font-size) * 1.2); font-weight: 600; color: #aaa; }
                .lock-subtext { font-size: var(--font-size); color: #777; margin-top: 4px; }

                .card-header {
                    position: absolute;
                    top: calc(var(--font-size) * 0.9);
                    left: calc(var(--font-size) * 1.0);
                    z-index: 2;
                    display: flex; flex-direction: column; align-items: center;
                    line-height: 1;
                }
                .overall-block {
                    display: flex; flex-direction: column; align-items: center; gap: 2px;
                }
                .overall {
                    font-size: calc(var(--font-size) * 2.6);
                    font-weight: 900;
                    color: var(--ink-color);
                    letter-spacing: -1px;
                    line-height: 0.95;
                    text-shadow: 0 1px 1px rgba(255,255,255,0.35);
                }
                .overall-label {
                    font-size: calc(var(--font-size) * 0.7);
                    font-weight: 700;
                    letter-spacing: 1.5px;
                    color: var(--ink-color);
                    opacity: 0.65;
                    text-transform: uppercase;
                }
                .position {
                    margin-top: calc(var(--font-size) * 0.45);
                    padding: 2px 8px;
                    border-radius: 999px;
                    background: rgba(0, 0, 0, 0.18);
                    font-size: calc(var(--font-size) * 0.85);
                    font-weight: 800;
                    color: var(--ink-color);
                    letter-spacing: 1px;
                    text-transform: uppercase;
                }

                .tier-badge {
                    position: absolute;
                    top: calc(var(--font-size) * 0.9);
                    right: calc(var(--font-size) * 1.0);
                    font-size: calc(var(--font-size) * 1.6);
                    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.35));
                    z-index: 2;
                }

                .player-photo-ring {
                    margin-top: calc(var(--font-size) * 2.2);
                    width: calc(var(--card-width) * 0.58);
                    height: calc(var(--card-width) * 0.58);
                    border-radius: 50%;
                    padding: 3px;
                    background: linear-gradient(180deg, var(--accent-color) 0%, var(--secondary-color) 100%);
                    box-shadow: 0 6px 14px rgba(0,0,0,0.25);
                    position: relative;
                    z-index: 2;
                }
                .player-photo {
                    width: 100%; height: 100%;
                    border-radius: 50%;
                    overflow: hidden;
                    background: rgba(0, 0, 0, 0.35);
                    display: flex; align-items: center; justify-content: center;
                }
                .player-photo img { width: 100%; height: 100%; object-fit: cover; }
                .photo-placeholder { font-size: calc(var(--font-size) * 3); }

                .player-name {
                    margin-top: calc(var(--font-size) * 0.85);
                    font-size: calc(var(--font-size) * 1.25);
                    font-weight: 800;
                    color: var(--ink-color);
                    letter-spacing: 0.4px;
                    text-shadow: 0 1px 1px rgba(255,255,255,0.35);
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    max-width: 90%;
                    text-align: center;
                    text-transform: uppercase;
                    position: relative;
                    z-index: 2;
                }

                .divider {
                    width: 70%;
                    height: 1px;
                    margin-top: calc(var(--font-size) * 0.6);
                    background: linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.25) 50%, transparent 100%);
                    position: relative;
                    z-index: 2;
                }

                .stats-grid {
                    margin-top: auto;
                    width: 88%;
                    padding: calc(var(--font-size) * 0.65) calc(var(--font-size) * 0.4);
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    grid-auto-rows: minmax(0, 1fr);
                    gap: calc(var(--font-size) * 0.4) 0;
                    background: rgba(0, 0, 0, 0.18);
                    border-radius: 12px;
                    box-shadow: inset 0 0 0 1px rgba(255,255,255,0.08);
                    position: relative;
                    z-index: 2;
                }
                .stat {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    line-height: 1.05;
                    border-right: 1px solid rgba(0,0,0,0.12);
                }
                .stat:nth-child(3n) { border-right: none; }
                .stat-value {
                    font-size: calc(var(--font-size) * 1.4);
                    font-weight: 900;
                    color: var(--ink-color);
                    letter-spacing: -0.3px;
                }
                .stat-label {
                    font-size: calc(var(--font-size) * 0.75);
                    font-weight: 700;
                    color: var(--ink-color);
                    opacity: 0.75;
                    letter-spacing: 1px;
                    margin-top: 2px;
                }
                .stat-full {
                    font-size: calc(var(--font-size) * 0.62);
                    font-weight: 600;
                    color: var(--ink-color);
                    opacity: 0.55;
                    letter-spacing: 0.2px;
                    margin-top: 1px;
                    white-space: nowrap;
                    max-width: 100%;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
            `}</style>
        </div>
    );
};

export default FifaPlayerCard;
