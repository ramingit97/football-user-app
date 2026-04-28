import React, { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { getCardTier, calculateStats, calculateOverall } from '../utils/fifaUtils';

const KNOWN_POSITIONS = ['GK', 'DEF', 'MID', 'FWD', 'ANY'];

// FUT-style silhouette with center top peak and center bottom notch
// viewBox = 0 0 200 300
const CARD_PATH =
    "M 30 8 L 90 8 L 100 0 L 110 8 L 170 8 " +
    "Q 196 8 198 32 L 198 248 Q 196 278 175 285 " +
    "L 173 290 L 105 297 L 100 302 L 95 297 L 27 290 L 25 285 " +
    "Q 4 278 2 248 L 2 32 Q 4 8 30 8 Z";

const TIER_DEFAULT_COLOR = {
    locked: '#9b9b9b',
    bronze: '#cd7f32',
    silver: '#c4c4c4',
    gold:   '#c79b3e',
};

const SIZE_STYLES = {
    small:  { width: 160, height: 240, fontSize: 10 },
    medium: { width: 220, height: 330, fontSize: 13 },
    large:  { width: 330, height: 495, fontSize: 18 },
};

// Helper: hex → rgba
const hexToRgba = (hex, alpha) => {
    const h = hex.replace('#', '');
    const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
    const r = parseInt(full.slice(0, 2), 16) || 0;
    const g = parseInt(full.slice(2, 4), 16) || 0;
    const b = parseInt(full.slice(4, 6), 16) || 0;
    return `rgba(${r},${g},${b},${alpha})`;
};

const FifaPlayerCard = ({ user, size = 'medium', showStats = true, onClick, accentColor }) => {
    const { t } = useTranslation();
    const uid = useId().replace(/:/g, '');
    const tier = getCardTier(user);
    const stats = calculateStats(user);
    const overall = calculateOverall(stats, user?.position);

    const accent = accentColor || TIER_DEFAULT_COLOR[tier] || TIER_DEFAULT_COLOR.gold;
    const accentSoft   = hexToRgba(accent, 0.18);
    const accentMedium = hexToRgba(accent, 0.55);
    const accentGlow   = hexToRgba(accent, 0.45);

    const { width, height, fontSize } = SIZE_STYLES[size];

    const positionLabels = {
        GK:  t('profile.fifa.positions.GK'),
        DEF: t('profile.fifa.positions.DEF'),
        MID: t('profile.fifa.positions.MID'),
        FWD: t('profile.fifa.positions.FWD'),
        ANY: t('profile.fifa.positions.ANY'),
    };
    const userPos = user?.position && KNOWN_POSITIONS.includes(user.position.toUpperCase())
        ? user.position.toUpperCase() : null;
    const positionLabel = userPos ? positionLabels[userPos] : null;

    const isLocked = tier === 'locked';

    return (
        <div
            className="fifa-card"
            onClick={onClick}
            style={{
                '--card-width':   `${width}px`,
                '--card-height':  `${height}px`,
                '--accent-color': accent,
                '--accent-soft':  accentSoft,
                '--accent-glow':  accentGlow,
                '--font-size':    `${fontSize}px`,
            }}
        >
            <svg className="card-shape" viewBox="0 0 200 305" preserveAspectRatio="none" aria-hidden="true">
                <defs>
                    {/* Marble base */}
                    <linearGradient id={`marble-${uid}`} x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%"   stopColor="#fcfaf6" />
                        <stop offset="55%"  stopColor="#f3ecdc" />
                        <stop offset="100%" stopColor="#e6dcc4" />
                    </linearGradient>
                    {/* Marble veining via subtle noise pattern */}
                    <pattern id={`veins-${uid}`} x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
                        <path d="M 0 20 Q 30 28 60 18 T 80 24" stroke="rgba(0,0,0,0.04)" strokeWidth="0.4" fill="none" />
                        <path d="M 0 50 Q 25 58 55 48 T 80 56" stroke="rgba(0,0,0,0.035)" strokeWidth="0.3" fill="none" />
                        <path d="M 10 70 Q 35 75 65 68 T 80 72" stroke="rgba(0,0,0,0.025)" strokeWidth="0.3" fill="none" />
                    </pattern>
                    {/* Gold brushstroke band — diagonal */}
                    <linearGradient id={`brush1-${uid}`} x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%"   stopColor={accent} stopOpacity="0" />
                        <stop offset="40%"  stopColor={accent} stopOpacity="0.35" />
                        <stop offset="60%"  stopColor={accent} stopOpacity="0.4" />
                        <stop offset="100%" stopColor={accent} stopOpacity="0" />
                    </linearGradient>
                    {/* Splatter */}
                    <pattern id={`splatter-${uid}`} x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
                        <circle cx="8"  cy="10" r="1.0" fill={accent} fillOpacity="0.32" />
                        <circle cx="22" cy="22" r="0.4" fill={accent} fillOpacity="0.24" />
                        <circle cx="40" cy="14" r="0.6" fill={accent} fillOpacity="0.18" />
                        <circle cx="50" cy="40" r="0.8" fill={accent} fillOpacity="0.22" />
                        <circle cx="14" cy="44" r="0.5" fill={accent} fillOpacity="0.2" />
                        <circle cx="34" cy="50" r="0.4" fill={accent} fillOpacity="0.16" />
                    </pattern>
                    {/* Clip path so brush strokes don't overflow */}
                    <clipPath id={`clip-${uid}`}>
                        <path d={CARD_PATH} />
                    </clipPath>
                </defs>

                {/* Marble fill */}
                <path d={CARD_PATH} fill={`url(#marble-${uid})`} />
                {/* Marble veining */}
                <path d={CARD_PATH} fill={`url(#veins-${uid})`} />

                {/* Decorative gold brush strokes inside card */}
                <g clipPath={`url(#clip-${uid})`}>
                    <path d="M -30 90 Q 80 110 230 60" stroke={`url(#brush1-${uid})`} strokeWidth="22" fill="none" opacity="0.6" />
                    <path d="M 130 -10 Q 150 80 90 220" stroke={accent} strokeWidth="2" fill="none" opacity="0.35" />
                    <path d="M 30 200 Q 110 230 230 180" stroke={accent} strokeWidth="1.2" fill="none" opacity="0.3" />
                </g>
                {/* Splatter overlay */}
                <path d={CARD_PATH} fill={`url(#splatter-${uid})`} opacity="0.85" />

                {/* Border stroke */}
                <path d={CARD_PATH} fill="none" stroke={accent} strokeWidth="2.5" strokeLinejoin="round" />
            </svg>

            {isLocked ? (
                <div className="card-content locked-content">
                    <div className="lock-icon">🔒</div>
                    <div className="lock-title">{t('profile.fifa.fillProfile')}</div>
                    <div className="lock-subtitle">{t('profile.fifa.toUnlock')}</div>
                </div>
            ) : (
                <div className="card-content">
                    {/* Top-left: OVR + position + small badge */}
                    <div className="card-corner-tl">
                        <div className="overall">{overall}</div>
                        {positionLabel && (
                            <>
                                <div className="position-text">{positionLabel}</div>
                                <div className="position-underline" />
                            </>
                        )}
                        <div className="position-badge">
                            <svg viewBox="0 0 32 36" width="100%" height="100%">
                                <path d="M 16 2 L 30 8 L 28 22 Q 24 32 16 34 Q 8 32 4 22 L 2 8 Z"
                                    fill="rgba(0,0,0,0.05)" stroke={accent} strokeWidth="1.2" />
                                <circle cx="16" cy="18" r="4" fill={accent} fillOpacity="0.85" />
                            </svg>
                        </div>
                    </div>

                    {/* Player photo */}
                    <div className="player-photo">
                        {user?.avatar ? (
                            <img src={user.avatar} alt={user?.name || ''} draggable={false} />
                        ) : (
                            <svg className="photo-silhouette" viewBox="0 0 80 100" aria-hidden="true">
                                <circle cx="40" cy="30" r="18" fill="currentColor" opacity="0.3" />
                                <path d="M 6 100 Q 6 60 40 60 Q 74 60 74 100 Z" fill="currentColor" opacity="0.3" />
                            </svg>
                        )}
                    </div>

                    {/* Name */}
                    <div className="player-name">
                        {user?.name || t('profile.fifa.playerFallback')}
                    </div>

                    {/* Divider */}
                    <div className="divider" />

                    {/* Stats — 2 columns × 3 rows */}
                    {showStats && (
                        <div className="stats-grid">
                            {[
                                { v: stats.pac, l: 'PAC' },
                                { v: stats.dri, l: 'DRI' },
                                { v: stats.sho, l: 'SHO' },
                                { v: stats.def, l: 'DEF' },
                                { v: stats.pas, l: 'PAS' },
                                { v: stats.phy, l: 'PHY' },
                            ].map(({ v, l }) => (
                                <div className="stat" key={l}>
                                    <span className="stat-value">{v}</span>
                                    <span className="stat-label">{l}</span>
                                </div>
                            ))}
                            <div className="stats-mid-divider" aria-hidden="true" />
                        </div>
                    )}

                    {/* Bottom branding */}
                    <div className="card-brand">★ TOPIN ★</div>
                </div>
            )}

            <style>{`
                .fifa-card {
                    width: var(--card-width);
                    height: var(--card-height);
                    position: relative;
                    cursor: ${onClick ? 'pointer' : 'default'};
                    transition: transform 0.3s ease, filter 0.3s ease;
                    font-family: 'Outfit', 'Inter', sans-serif;
                    isolation: isolate;
                }
                .fifa-card:hover {
                    transform: ${onClick ? 'translateY(-6px) scale(1.02)' : 'none'};
                }
                .fifa-card:hover .card-shape {
                    filter: drop-shadow(0 0 10px var(--accent-glow))
                            drop-shadow(0 8px 24px rgba(0,0,0,0.45));
                }
                .card-shape {
                    position: absolute;
                    inset: 0;
                    width: 100%;
                    height: 100%;
                    filter: drop-shadow(0 6px 18px rgba(0,0,0,0.35));
                    transition: filter 0.3s ease;
                }
                .card-content {
                    position: absolute;
                    inset: 0;
                    z-index: 2;
                }

                /* Top-left cluster */
                .card-corner-tl {
                    position: absolute;
                    top: 6%;
                    left: 9%;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    line-height: 1;
                    z-index: 3;
                }
                .overall {
                    font-size: calc(var(--font-size) * 2.7);
                    font-weight: 900;
                    color: var(--accent-color);
                    line-height: 0.85;
                    letter-spacing: -2px;
                }
                .position-text {
                    margin-top: calc(var(--font-size) * 0.15);
                    font-size: calc(var(--font-size) * 1.3);
                    font-weight: 800;
                    color: var(--accent-color);
                    letter-spacing: 1.5px;
                }
                .position-underline {
                    width: calc(var(--font-size) * 1.4);
                    height: 2px;
                    background: var(--accent-color);
                    margin-top: calc(var(--font-size) * 0.25);
                }
                .position-badge {
                    width: calc(var(--font-size) * 2.2);
                    height: calc(var(--font-size) * 2.4);
                    margin-top: calc(var(--font-size) * 0.6);
                    filter: drop-shadow(0 1px 2px rgba(0,0,0,0.15));
                }

                /* Photo */
                .player-photo {
                    position: absolute;
                    top: 4%;
                    left: 35%;
                    right: 5%;
                    height: 60%;
                    display: flex;
                    align-items: flex-end;
                    justify-content: center;
                    overflow: hidden;
                    z-index: 1;
                }
                .player-photo img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    object-position: center 22%;
                    user-select: none;
                }
                .photo-silhouette {
                    width: 80%;
                    height: 100%;
                    color: var(--accent-color);
                }

                /* Name */
                .player-name {
                    position: absolute;
                    top: 64%;
                    left: 0;
                    right: 0;
                    text-align: center;
                    font-size: calc(var(--font-size) * 1.6);
                    font-weight: 900;
                    color: var(--accent-color);
                    letter-spacing: 2px;
                    text-transform: uppercase;
                    padding: 0 8%;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    z-index: 2;
                }

                /* Divider line */
                .divider {
                    position: absolute;
                    top: 73%;
                    left: 14%;
                    right: 14%;
                    height: 1px;
                    background: linear-gradient(90deg, transparent 0%, var(--accent-color) 50%, transparent 100%);
                    opacity: 0.55;
                    z-index: 2;
                }

                /* Stats — 2 cols × 3 rows */
                .stats-grid {
                    position: absolute;
                    bottom: calc(var(--font-size) * 2.6);
                    left: 12%;
                    right: 12%;
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    grid-template-rows: 1fr 1fr 1fr;
                    grid-auto-flow: row;
                    column-gap: calc(var(--font-size) * 0.8);
                    row-gap: calc(var(--font-size) * 0.4);
                    z-index: 2;
                }
                .stats-mid-divider {
                    position: absolute;
                    top: 8%;
                    bottom: 8%;
                    left: 50%;
                    width: 1px;
                    background: linear-gradient(180deg, transparent 0%, var(--accent-color) 50%, transparent 100%);
                    opacity: 0.45;
                    transform: translateX(-50%);
                }
                .stat {
                    display: flex;
                    align-items: baseline;
                    gap: calc(var(--font-size) * 0.4);
                    line-height: 1;
                }
                .stat-value {
                    font-size: calc(var(--font-size) * 1.38);
                    font-weight: 900;
                    color: var(--accent-color);
                    letter-spacing: -0.5px;
                    min-width: calc(var(--font-size) * 1.6);
                    text-align: right;
                }
                .stat-label {
                    font-size: calc(var(--font-size) * 0.95);
                    font-weight: 700;
                    color: var(--accent-color);
                    letter-spacing: 1.2px;
                }

                /* Branding bottom — kept inside the wide silhouette zone */
                .card-brand {
                    position: absolute;
                    bottom: calc(var(--font-size) * 1.5);
                    left: 0;
                    right: 0;
                    text-align: center;
                    font-size: calc(var(--font-size) * 0.55);
                    font-weight: 700;
                    color: var(--accent-color);
                    opacity: 0.55;
                    letter-spacing: 2px;
                    z-index: 2;
                }

                /* Locked */
                .locked-content {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 100%;
                    text-align: center;
                    color: #888;
                    padding: 0 12%;
                }
                .lock-icon {
                    font-size: calc(var(--font-size) * 4);
                    margin-bottom: calc(var(--font-size) * 0.8);
                    opacity: 0.55;
                }
                .lock-title {
                    font-size: calc(var(--font-size) * 1.1);
                    font-weight: 700;
                    color: #888;
                    margin-bottom: calc(var(--font-size) * 0.3);
                }
                .lock-subtitle {
                    font-size: var(--font-size);
                    color: #777;
                }
            `}</style>
        </div>
    );
};

export default FifaPlayerCard;
