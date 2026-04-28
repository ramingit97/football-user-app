import React, { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { getCardTier, calculateStats, calculateOverall } from '../utils/fifaUtils';

const KNOWN_POSITIONS = ['GK', 'DEF', 'MID', 'FWD', 'ANY'];

// FUT-style card silhouette — viewBox 0 0 200 300
const CARD_PATH = "M 28 4 L 172 4 Q 196 4 198 30 L 198 248 Q 196 282 172 290 Q 100 304 28 290 Q 4 282 2 248 L 2 30 Q 4 4 28 4 Z";

const TIER_ACCENTS = {
    locked: { color: '#6b6b6b', glow: 'rgba(140,140,140,0.35)' },
    bronze: { color: '#e29a5b', glow: 'rgba(226,154,91,0.55)'  },
    silver: { color: '#dcdcdc', glow: 'rgba(220,220,220,0.5)'  },
    // Topin brand neon green for top tier, matching reference
    gold:   { color: '#00e87a', glow: 'rgba(0,232,122,0.6)'    },
};

const SIZE_STYLES = {
    small:  { width: 160, height: 240, fontSize: 10 },
    medium: { width: 220, height: 330, fontSize: 13 },
    large:  { width: 290, height: 435, fontSize: 17 },
};

const FifaPlayerCard = ({ user, size = 'medium', showStats = true, onClick }) => {
    const { t } = useTranslation();
    const uid = useId().replace(/:/g, '');
    const tier = getCardTier(user);
    const stats = calculateStats(user);
    const overall = calculateOverall(stats, user?.position);

    const accent = TIER_ACCENTS[tier] || TIER_ACCENTS.locked;
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
                '--accent-color': accent.color,
                '--accent-glow':  accent.glow,
                '--font-size':    `${fontSize}px`,
            }}
        >
            {/* Card silhouette + grunge fill + neon stroke */}
            <svg className="card-shape" viewBox="0 0 200 300" preserveAspectRatio="none" aria-hidden="true">
                <defs>
                    <linearGradient id={`bg-${uid}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%"   stopColor="#0b1d12" />
                        <stop offset="55%"  stopColor="#040c08" />
                        <stop offset="100%" stopColor="#020403" />
                    </linearGradient>
                    <radialGradient id={`splash1-${uid}`} cx="22%" cy="18%" r="55%">
                        <stop offset="0%"   stopColor={accent.color} stopOpacity="0.22" />
                        <stop offset="100%" stopColor={accent.color} stopOpacity="0" />
                    </radialGradient>
                    <radialGradient id={`splash2-${uid}`} cx="82%" cy="78%" r="48%">
                        <stop offset="0%"   stopColor={accent.color} stopOpacity="0.14" />
                        <stop offset="100%" stopColor={accent.color} stopOpacity="0" />
                    </radialGradient>
                    <pattern id={`splatter-${uid}`} x="0" y="0" width="50" height="50" patternUnits="userSpaceOnUse">
                        <circle cx="3"  cy="4"  r="0.7" fill={accent.color} fillOpacity="0.22" />
                        <circle cx="22" cy="14" r="0.4" fill={accent.color} fillOpacity="0.14" />
                        <circle cx="38" cy="6"  r="0.5" fill="#fff"          fillOpacity="0.06" />
                        <circle cx="12" cy="32" r="0.5" fill={accent.color} fillOpacity="0.16" />
                        <circle cx="30" cy="38" r="0.6" fill="#fff"          fillOpacity="0.05" />
                        <circle cx="44" cy="28" r="0.4" fill={accent.color} fillOpacity="0.12" />
                    </pattern>
                </defs>
                <path d={CARD_PATH} fill={`url(#bg-${uid})`} />
                <path d={CARD_PATH} fill={`url(#splash1-${uid})`} />
                <path d={CARD_PATH} fill={`url(#splash2-${uid})`} />
                <path d={CARD_PATH} fill={`url(#splatter-${uid})`} />
                <path d={CARD_PATH} fill="none" stroke={accent.color} strokeWidth="2.2" strokeLinejoin="round" />
            </svg>

            {isLocked ? (
                <div className="card-content locked-content">
                    <div className="lock-icon">🔒</div>
                    <div className="lock-title">{t('profile.fifa.fillProfile')}</div>
                    <div className="lock-subtitle">{t('profile.fifa.toUnlock')}</div>
                </div>
            ) : (
                <div className="card-content">
                    {/* Top-left: OVR + position + ball badge */}
                    <div className="card-corner-tl">
                        <div className="overall">{overall}</div>
                        {positionLabel && <div className="position-text">{positionLabel}</div>}
                        <div className="position-badge"><span>⚽</span></div>
                    </div>

                    {/* Player photo — top-right area */}
                    <div className="player-photo">
                        {user?.avatar ? (
                            <img src={user.avatar} alt={user?.name || ''} draggable={false} />
                        ) : (
                            <svg className="photo-silhouette" viewBox="0 0 80 100" aria-hidden="true">
                                <circle cx="40" cy="28" r="18" fill="currentColor" opacity="0.35" />
                                <path d="M 6 100 Q 6 60 40 60 Q 74 60 74 100 Z" fill="currentColor" opacity="0.35" />
                            </svg>
                        )}
                    </div>

                    {/* Player name */}
                    <div className="player-name">
                        {user?.name || t('profile.fifa.playerFallback')}
                    </div>

                    {/* Divider */}
                    <div className="divider" />

                    {/* Stats grid */}
                    {showStats && (
                        <div className="stats-grid">
                            {[
                                { v: stats.pac, l: 'PAC' },
                                { v: stats.sho, l: 'SHO' },
                                { v: stats.pas, l: 'PAS' },
                                { v: stats.dri, l: 'DRI' },
                                { v: stats.def, l: 'DEF' },
                                { v: stats.phy, l: 'PHY' },
                            ].map(({ v, l }) => (
                                <div className="stat" key={l}>
                                    <span className="stat-value">{v}</span>
                                    <span className="stat-label">{l}</span>
                                </div>
                            ))}
                        </div>
                    )}
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
                    filter: drop-shadow(0 0 8px var(--accent-glow))
                            drop-shadow(0 0 28px var(--accent-glow));
                }

                .card-shape {
                    position: absolute;
                    inset: 0;
                    width: 100%;
                    height: 100%;
                    filter: drop-shadow(0 0 6px var(--accent-glow))
                            drop-shadow(0 0 20px var(--accent-glow));
                    transition: filter 0.3s ease;
                }

                .card-content {
                    position: absolute;
                    inset: 0;
                    z-index: 2;
                }

                /* Top-left cluster: OVR + position abbr + ball badge */
                .card-corner-tl {
                    position: absolute;
                    top: 6%;
                    left: 8%;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    line-height: 1;
                    z-index: 3;
                }
                .overall {
                    font-size: calc(var(--font-size) * 3.0);
                    font-weight: 900;
                    color: var(--accent-color);
                    line-height: 0.85;
                    letter-spacing: -2px;
                    text-shadow: 0 0 14px var(--accent-glow);
                }
                .position-text {
                    margin-top: calc(var(--font-size) * 0.15);
                    font-size: calc(var(--font-size) * 1.1);
                    font-weight: 800;
                    color: var(--accent-color);
                    letter-spacing: 1.4px;
                    text-shadow: 0 0 8px var(--accent-glow);
                }
                .position-badge {
                    width: calc(var(--font-size) * 1.7);
                    height: calc(var(--font-size) * 1.7);
                    border-radius: 50%;
                    border: 1.5px solid var(--accent-color);
                    background: rgba(0, 0, 0, 0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: calc(var(--font-size) * 0.85);
                    margin-top: calc(var(--font-size) * 0.45);
                    box-shadow: 0 0 8px var(--accent-glow);
                }

                /* Player photo */
                .player-photo {
                    position: absolute;
                    top: 4%;
                    left: 30%;
                    right: 6%;
                    height: 60%;
                    display: flex;
                    align-items: flex-end;
                    justify-content: center;
                    overflow: hidden;
                    -webkit-mask-image: linear-gradient(180deg, black 76%, transparent 100%);
                    mask-image: linear-gradient(180deg, black 76%, transparent 100%);
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
                    width: 78%;
                    height: 100%;
                    color: var(--accent-color);
                }

                /* Name */
                .player-name {
                    position: absolute;
                    top: 62%;
                    left: 0;
                    right: 0;
                    text-align: center;
                    font-size: calc(var(--font-size) * 1.45);
                    font-weight: 900;
                    color: #ffffff;
                    letter-spacing: 1.5px;
                    text-transform: uppercase;
                    text-shadow: 0 1px 6px rgba(0, 0, 0, 0.85);
                    padding: 0 8%;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    z-index: 2;
                }

                /* Divider line */
                .divider {
                    position: absolute;
                    top: 71%;
                    left: 18%;
                    right: 18%;
                    height: 1px;
                    background: linear-gradient(90deg, transparent 0%, var(--accent-color) 50%, transparent 100%);
                    opacity: 0.5;
                    z-index: 2;
                }

                /* Stats */
                .stats-grid {
                    position: absolute;
                    bottom: calc(var(--font-size) * 1.4);
                    left: 9%;
                    right: 9%;
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    grid-template-rows: 1fr 1fr;
                    gap: calc(var(--font-size) * 0.55) 0;
                    text-align: center;
                    z-index: 2;
                }
                .stat {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    line-height: 1;
                }
                .stat-value {
                    font-size: calc(var(--font-size) * 1.75);
                    font-weight: 900;
                    color: var(--accent-color);
                    text-shadow: 0 0 8px var(--accent-glow);
                    letter-spacing: -0.5px;
                }
                .stat-label {
                    font-size: calc(var(--font-size) * 0.78);
                    font-weight: 700;
                    color: rgba(255, 255, 255, 0.55);
                    letter-spacing: 1.5px;
                    margin-top: 4px;
                }

                /* Locked state */
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
                    color: #aaa;
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
