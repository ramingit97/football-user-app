import { useNavigate } from 'react-router-dom';
import {
    CalendarOutlined,
    EnvironmentOutlined,
    TeamOutlined,
    ClockCircleOutlined,
    UserOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

const FORMAT_COLORS = {
    '5x5':   { color: '#00e87a', bg: 'rgba(0,232,122,0.12)' },
    '6x6':   { color: '#4f86f7', bg: 'rgba(79,134,247,0.12)' },
    '7x7':   { color: '#a855f7', bg: 'rgba(168,85,247,0.12)' },
    '8x8':   { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
    '11x11': { color: '#f04438', bg: 'rgba(240,68,56,0.12)' },
};
const getFormatCfg = (fmt) => FORMAT_COLORS[fmt] || { color: '#00e87a', bg: 'rgba(0,232,122,0.12)' };

const GameCard = ({ game, onJoin }) => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const currentUser = JSON.parse(localStorage.getItem('user') || 'null');
    const isParticipant = currentUser && Array.isArray(game.players) && game.players.some(p => p.id === currentUser.id);
    const currentPlayers = game.players?.length || 0;
    const maxPlayers = game.maxPlayers || 0;
    const isFull = game.status === 'full' || currentPlayers >= maxPlayers;
    const spotsLeft = maxPlayers - currentPlayers;
    const progressPercent = maxPlayers > 0 ? (currentPlayers / maxPlayers) * 100 : 0;
    const fmt = getFormatCfg(game.format);

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', weekday: 'short' });
    };

    const handleViewDetails = (e) => {
        e.stopPropagation();
        navigate(`/games/${game.id}`);
    };

    const spotColor = isFull ? '#f04438' : spotsLeft <= 3 ? '#f59e0b' : '#00e87a';
    const spotBg   = isFull ? 'rgba(240,68,56,0.1)' : spotsLeft <= 3 ? 'rgba(245,158,11,0.1)' : 'rgba(0,232,122,0.08)';

    return (
        <div
            className="game-card glass-card"
            onClick={handleViewDetails}
            style={{ cursor: 'pointer', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
        >
            {/* Цветная полоска по формату */}
            <div style={{ height: 4, background: `linear-gradient(90deg, ${fmt.color}, ${fmt.color}88)`, boxShadow: `0 0 12px ${fmt.color}50` }} />

            <div style={{ padding: '14px 16px 16px', flex: 1, display: 'flex', flexDirection: 'column' }}>

                {/* Заголовок + бейджи */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10, gap: 8 }}>
                    <h3 style={{
                        fontFamily: 'Syne, sans-serif',
                        fontWeight: 700,
                        fontSize: 15,
                        color: 'var(--text-primary)',
                        margin: 0,
                        lineHeight: 1.3,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        flex: 1,
                        minWidth: 0,
                    }}>
                        {game.title || `${game.format} — ${game.location}`}
                    </h3>
                    <span style={{
                        background: fmt.bg,
                        color: fmt.color,
                        padding: '3px 8px',
                        borderRadius: 6,
                        fontSize: 11,
                        fontWeight: 700,
                        fontFamily: 'Syne, sans-serif',
                        letterSpacing: '0.3px',
                        flexShrink: 0,
                    }}>
                        {game.format}
                    </span>
                </div>

                {/* Дата + время + место */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-secondary)', fontSize: 13 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <CalendarOutlined style={{ color: 'var(--text-tertiary)', fontSize: 11 }} />
                            {formatDate(game.date)}
                        </span>
                        <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--text-tertiary)', flexShrink: 0 }} />
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <ClockCircleOutlined style={{ color: 'var(--text-tertiary)', fontSize: 11 }} />
                            {game.time}
                        </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-tertiary)', fontSize: 13 }}>
                        <EnvironmentOutlined style={{ fontSize: 11 }} />
                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {game.location}
                        </span>
                    </div>
                </div>

                {/* Цена + свободных мест */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{
                        fontFamily: 'Syne, sans-serif',
                        fontWeight: 800,
                        fontSize: 18,
                        color: game.price === 0 ? '#00e87a' : 'var(--text-primary)',
                    }}>
                        {game.price === 0 ? t('game.card.free') : `${game.price} ₼`}
                    </span>
                    <span style={{
                        background: spotBg,
                        color: spotColor,
                        padding: '3px 10px',
                        borderRadius: 20,
                        fontSize: 11,
                        fontWeight: 600,
                        border: `1px solid ${spotColor}30`,
                    }}>
                        {isFull ? t('game.card.noSpots') : t('game.card.spotsLeft', { n: spotsLeft })}
                    </span>
                </div>

                {/* Прогресс игроков */}
                <div style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                        <TeamOutlined style={{ color: 'var(--text-tertiary)', fontSize: 11 }} />
                        <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                            <strong style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{currentPlayers}</strong>
                            {' / '}{maxPlayers} {t('game.card.players')}
                        </span>
                        {(game.organizerName || game.organizer) && (
                            <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-tertiary)', fontSize: 11 }}>
                                <UserOutlined style={{ fontSize: 10 }} />
                                {game.organizerName || game.organizer}
                            </span>
                        )}
                    </div>
                    <div style={{ height: 5, background: 'var(--bg-raised)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{
                            height: '100%',
                            width: `${progressPercent}%`,
                            background: isFull ? '#f04438' : spotsLeft <= 3 ? '#f59e0b' : `linear-gradient(90deg, var(--green), #00c868)`,
                            borderRadius: 3,
                            transition: 'width 0.4s ease',
                        }} />
                    </div>
                </div>

                {/* Кнопки */}
                <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
                    <button
                        onClick={handleViewDetails}
                        style={{
                            flex: '0 0 auto',
                            height: 36,
                            padding: '0 16px',
                            background: 'transparent',
                            border: '1px solid var(--border-color)',
                            borderRadius: 8,
                            color: 'var(--text-secondary)',
                            fontSize: 13,
                            fontFamily: 'Outfit, sans-serif',
                            fontWeight: 500,
                            cursor: 'pointer',
                            transition: 'border-color 0.15s, color 0.15s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--green-border)'; e.currentTarget.style.color = 'var(--green)'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                    >
                        {t('game.card.details')}
                    </button>
                    <button
                        disabled={isFull || isParticipant}
                        onClick={(e) => { e.stopPropagation(); if (!isParticipant) onJoin && onJoin(game); }}
                        style={{
                            flex: 1,
                            height: 36,
                            background: isParticipant ? 'rgba(0,232,122,0.1)' : isFull ? 'var(--bg-raised)' : 'var(--green)',
                            border: isParticipant ? '1px solid rgba(0,232,122,0.3)' : 'none',
                            borderRadius: 8,
                            color: isParticipant ? 'var(--green)' : isFull ? 'var(--text-tertiary)' : '#060c18',
                            fontSize: 13,
                            fontFamily: 'Outfit, sans-serif',
                            fontWeight: 700,
                            cursor: isFull || isParticipant ? 'default' : 'pointer',
                            transition: 'opacity 0.15s',
                        }}
                        onMouseEnter={e => { if (!isFull && !isParticipant) e.currentTarget.style.opacity = '0.88'; }}
                        onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
                    >
                        {isParticipant ? '✓ ' + t('game.card.joined') : isFull ? t('game.card.full') : t('game.card.join')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GameCard;
