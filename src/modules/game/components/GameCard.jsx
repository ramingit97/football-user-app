import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EnvironmentOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { formatDateLocale } from '../../../utils/dateFormat';

const FORMAT_COLORS = {
    '5x5':   { color: '#00e87a', bg: 'rgba(0,232,122,0.1)',  glow: 'rgba(0,232,122,0.18)' },
    '6x6':   { color: '#4f86f7', bg: 'rgba(79,134,247,0.1)', glow: 'rgba(79,134,247,0.18)' },
    '7x7':   { color: '#a855f7', bg: 'rgba(168,85,247,0.1)', glow: 'rgba(168,85,247,0.18)' },
    '8x8':   { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', glow: 'rgba(245,158,11,0.18)' },
    '11x11': { color: '#f04438', bg: 'rgba(240,68,56,0.1)',  glow: 'rgba(240,68,56,0.18)' },
};
const getFmt = (f) => FORMAT_COLORS[f] || FORMAT_COLORS['5x5'];

const GameCard = ({ game, onJoin }) => {
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    const [hovered, setHovered] = useState(false);

    const currentUser = JSON.parse(localStorage.getItem('user') || 'null');
    const isParticipant = currentUser && Array.isArray(game.players) && game.players.some(p => p.id === currentUser.id);
    const players = game.players || [];
    const currentPlayers = players.length;
    const maxPlayers = game.maxPlayers || 0;
    const isFull = game.status === 'full' || currentPlayers >= maxPlayers;
    const spotsLeft = maxPlayers - currentPlayers;
    const progressPercent = maxPlayers > 0 ? Math.min((currentPlayers / maxPlayers) * 100, 100) : 0;
    const fmt = getFmt(game.format);

    const today = new Date(); today.setHours(0,0,0,0);
    const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
    const gameDate = new Date(game.date); gameDate.setHours(0,0,0,0);
    const isToday = gameDate.getTime() === today.getTime();
    const isTomorrow = gameDate.getTime() === tomorrow.getTime();

    const formatDate = (dateStr) => {
        if (isToday) return t('game.card.today');
        if (isTomorrow) return t('game.card.tomorrow');
        return formatDateLocale(new Date(dateStr), i18n.language, { day: 'numeric', month: 'short', weekday: 'short' });
    };

    const visiblePlayers = players.slice(0, 5);
    const hiddenCount = Math.max(0, currentPlayers - 5);
    const emptyToShow = Math.min(Math.max(0, spotsLeft), isFull ? 0 : 4);

    const btnBg = isParticipant
        ? 'rgba(0,232,122,0.08)'
        : isFull
            ? 'var(--bg-raised)'
            : fmt.color;
    const btnColor = isParticipant ? '#00e87a' : isFull ? 'var(--text-tertiary)' : '#060c18';
    const btnBorder = isParticipant ? '1px solid rgba(0,232,122,0.22)' : isFull ? '1px solid var(--border-color)' : 'none';

    return (
        <div
            onClick={() => navigate(`/games/${game.id}`)}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                position: 'relative',
                cursor: 'pointer',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                background: 'var(--bg-card)',
                border: `1px solid ${hovered ? fmt.color + '50' : 'var(--border-color)'}`,
                borderRadius: 16,
                transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
                boxShadow: hovered
                    ? `0 12px 40px rgba(0,0,0,0.5), 0 0 0 1px ${fmt.color}18, inset 0 1px 0 rgba(255,255,255,0.05)`
                    : '0 2px 12px rgba(0,0,0,0.35)',
                transition: 'transform 0.22s ease, border-color 0.22s ease, box-shadow 0.22s ease',
            }}
        >
            {/* Left accent stripe */}
            <div style={{
                position: 'absolute',
                left: 0, top: 0, bottom: 0,
                width: 3,
                background: `linear-gradient(180deg, ${fmt.color} 0%, ${fmt.color}44 100%)`,
                boxShadow: hovered ? `0 0 14px ${fmt.glow}` : 'none',
                transition: 'box-shadow 0.22s ease',
                borderRadius: '16px 0 0 16px',
            }} />

            {/* Subtle corner glow */}
            <div style={{
                position: 'absolute',
                bottom: -40, left: -20,
                width: 180, height: 180,
                borderRadius: '50%',
                background: `radial-gradient(circle, ${fmt.color}07 0%, transparent 70%)`,
                pointerEvents: 'none',
                transition: 'opacity 0.3s',
                opacity: hovered ? 1 : 0.5,
            }} />

            <div style={{ padding: '15px 16px 16px 20px', flex: 1, display: 'flex', flexDirection: 'column' }}>

                {/* Badges row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 11, flexWrap: 'wrap' }}>
                    <span style={{
                        background: fmt.bg,
                        color: fmt.color,
                        padding: '3px 10px',
                        borderRadius: 20,
                        fontSize: 11,
                        fontWeight: 700,
                        fontFamily: "'ClashDisplay-Variable','Clash Display',sans-serif",
                        letterSpacing: '0.4px',
                        border: `1px solid ${fmt.color}22`,
                    }}>
                        ⚽ {game.format}
                    </span>

                    {game.isUrgent && (
                        <span style={{
                            background: 'rgba(240,68,56,0.1)',
                            color: '#f04438',
                            padding: '3px 10px',
                            borderRadius: 20,
                            fontSize: 11,
                            fontWeight: 700,
                            fontFamily: "'ClashDisplay-Variable','Clash Display',sans-serif",
                            border: '1px solid rgba(240,68,56,0.22)',
                            animation: 'gc-pulse 2s ease-in-out infinite',
                        }}>
                            🔥 HOT
                        </span>
                    )}

                    {game.minAge && (
                        <span style={{
                            background: 'rgba(245,158,11,0.08)',
                            color: '#f59e0b',
                            padding: '3px 8px',
                            borderRadius: 20,
                            fontSize: 11,
                            fontWeight: 700,
                            border: '1px solid rgba(245,158,11,0.2)',
                        }}>
                            {game.minAge}+
                        </span>
                    )}

                    {game.minPlayers > 0 && !isFull && (
                        <span style={{
                            background: 'rgba(0,232,122,0.06)',
                            color: '#00e87a',
                            padding: '3px 9px',
                            borderRadius: 20,
                            fontSize: 10,
                            fontWeight: 600,
                            border: '1px solid rgba(0,232,122,0.15)',
                            fontFamily: 'Outfit,sans-serif',
                            whiteSpace: 'nowrap',
                        }}>
                            ✓ {t('game.card.guarantee')}
                        </span>
                    )}

                    {isParticipant && (
                        <span style={{
                            marginLeft: 'auto',
                            background: 'rgba(0,232,122,0.08)',
                            color: '#00e87a',
                            padding: '3px 10px',
                            borderRadius: 20,
                            fontSize: 11,
                            fontWeight: 700,
                            border: '1px solid rgba(0,232,122,0.2)',
                        }}>
                            ✓ {t('game.card.joined')}
                        </span>
                    )}
                </div>

                {/* Title */}
                <h3 style={{
                    fontFamily: "'ClashDisplay-Variable','Clash Display',sans-serif",
                    fontWeight: 700,
                    fontSize: 16,
                    color: 'var(--text-primary)',
                    margin: '0 0 5px',
                    lineHeight: 1.25,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                }}>
                    {game.title || `${game.format} — ${game.location}`}
                </h3>

                {/* Location */}
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    color: 'var(--text-tertiary)', fontSize: 12,
                    marginBottom: 14, fontFamily: 'Outfit,sans-serif',
                }}>
                    <EnvironmentOutlined style={{ fontSize: 11, color: fmt.color, opacity: 0.6 }} />
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {game.location}
                    </span>
                </div>

                {/* Time + Price — hero row */}
                <div style={{
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'space-between',
                    marginBottom: 16,
                    paddingBottom: 14,
                    borderBottom: '1px solid var(--border-color)',
                }}>
                    <div>
                        <div style={{
                            fontFamily: "'ClashDisplay-Variable','Clash Display',sans-serif",
                            fontWeight: 800,
                            fontSize: 30,
                            color: fmt.color,
                            lineHeight: 1,
                            letterSpacing: '-1.5px',
                        }}>
                            {game.time}
                        </div>
                        <div style={{
                            fontSize: 11,
                            color: isToday ? fmt.color : 'var(--text-tertiary)',
                            fontFamily: 'Outfit,sans-serif',
                            marginTop: 4,
                            fontWeight: isToday ? 600 : 400,
                        }}>
                            {formatDate(game.date)}
                        </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                        <div style={{
                            fontFamily: "'ClashDisplay-Variable','Clash Display',sans-serif",
                            fontWeight: 800,
                            fontSize: 22,
                            color: game.price === 0 ? '#00e87a' : 'var(--text-primary)',
                            lineHeight: 1,
                            letterSpacing: '-0.5px',
                        }}>
                            {game.price === 0 ? t('game.card.free') : `${game.price} ₼`}
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--text-tertiary)', fontFamily: 'Outfit,sans-serif', marginTop: 4 }}>
                            за место
                        </div>
                    </div>
                </div>

                {/* Players avatars + progress */}
                <div style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 7 }}>
                        {/* Avatar stack */}
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            {visiblePlayers.map((p, i) => (
                                <div key={p.id || i} style={{
                                    width: 22, height: 22,
                                    borderRadius: '50%',
                                    background: fmt.bg,
                                    border: `2px solid var(--bg-card)`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 9, fontWeight: 800,
                                    color: fmt.color,
                                    fontFamily: "'ClashDisplay-Variable','Clash Display',sans-serif",
                                    marginLeft: i > 0 ? -7 : 0,
                                    zIndex: visiblePlayers.length - i,
                                    position: 'relative',
                                    overflow: 'hidden',
                                    flexShrink: 0,
                                }}>
                                    {p.avatar
                                        ? <img src={p.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        : (p.name?.[0] || '?').toUpperCase()
                                    }
                                </div>
                            ))}
                            {hiddenCount > 0 && (
                                <div style={{
                                    width: 22, height: 22, borderRadius: '50%',
                                    background: 'var(--bg-raised)',
                                    border: '2px solid var(--bg-card)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 8, fontWeight: 700, color: 'var(--text-tertiary)',
                                    marginLeft: -7, zIndex: 0, position: 'relative', flexShrink: 0,
                                }}>
                                    +{hiddenCount}
                                </div>
                            )}
                            {[...Array(emptyToShow)].map((_, i) => (
                                <div key={`e-${i}`} style={{
                                    width: 22, height: 22, borderRadius: '50%',
                                    background: 'transparent',
                                    border: '2px dashed rgba(255,255,255,0.1)',
                                    marginLeft: (currentPlayers === 0 && i === 0) ? 0 : -7,
                                    zIndex: -i, position: 'relative', flexShrink: 0,
                                }} />
                            ))}
                        </div>

                        <span style={{
                            marginLeft: 'auto',
                            fontSize: 12,
                            fontWeight: 700,
                            fontFamily: "'ClashDisplay-Variable','Clash Display',sans-serif",
                            color: isFull ? '#f04438' : spotsLeft <= 3 ? '#f59e0b' : 'var(--text-tertiary)',
                        }}>
                            {isFull ? t('game.card.noSpots') : `${currentPlayers}/${maxPlayers}`}
                        </span>
                    </div>

                    {/* Progress bar */}
                    <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{
                            height: '100%',
                            width: `${progressPercent}%`,
                            borderRadius: 4,
                            background: isFull
                                ? 'linear-gradient(90deg, #f04438, #f04438aa)'
                                : spotsLeft <= 3
                                    ? 'linear-gradient(90deg, #f59e0b, #f59e0baa)'
                                    : `linear-gradient(90deg, ${fmt.color}, ${fmt.color}88)`,
                            boxShadow: `0 0 8px ${fmt.color}50`,
                            transition: 'width 0.5s ease',
                        }} />
                    </div>
                </div>

                {/* CTA */}
                <div style={{ marginTop: 'auto' }}>
                    <button
                        disabled={isFull || isParticipant}
                        onClick={(e) => {
                            e.stopPropagation();
                            if (!isParticipant && !isFull) onJoin?.(game);
                        }}
                        style={{
                            width: '100%',
                            height: 40,
                            background: btnBg,
                            border: btnBorder,
                            borderRadius: 10,
                            color: btnColor,
                            fontSize: 13,
                            fontFamily: 'Outfit,sans-serif',
                            fontWeight: 700,
                            cursor: isFull || isParticipant ? 'default' : 'pointer',
                            transition: 'opacity 0.15s, transform 0.12s',
                            letterSpacing: '0.3px',
                        }}
                        onMouseEnter={e => { if (!isFull && !isParticipant) { e.currentTarget.style.opacity = '0.88'; e.currentTarget.style.transform = 'scale(1.015)'; }}}
                        onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'scale(1)'; }}
                    >
                        {isParticipant
                            ? '✓ ' + t('game.card.joined')
                            : isFull
                                ? t('game.card.full')
                                : t('game.card.join') + ' →'}
                    </button>
                </div>
            </div>

            <style>{`
                @keyframes gc-pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.6; }
                }
            `}</style>
        </div>
    );
};

export default GameCard;
