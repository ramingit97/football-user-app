import { useState, useEffect } from 'react';
import { useGetHotGamesQuery } from '../../../store/gamesApi';
import { useTranslation } from 'react-i18next';
import { Button } from 'antd';
import { FireOutlined, ClockCircleOutlined, TeamOutlined, EnvironmentOutlined } from '@ant-design/icons';

const STYLES = `
@keyframes hotPulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(185,28,28,0.4), 0 0 16px rgba(185,28,28,0.2); }
    50%       { box-shadow: 0 0 0 6px rgba(185,28,28,0), 0 0 28px rgba(185,28,28,0.35); }
}
@keyframes badgePulse {
    0%, 100% { transform: scale(1); opacity: 1; }
    50%       { transform: scale(1.08); opacity: 0.85; }
}
@keyframes fireShake {
    0%, 100% { transform: rotate(0deg); }
    25%       { transform: rotate(-8deg); }
    75%       { transform: rotate(8deg); }
}
@keyframes slideInLeft {
    from { opacity: 0; transform: translateX(-20px); }
    to   { opacity: 1; transform: translateX(0); }
}
@keyframes dotBlink {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.2; }
}
.hot-card {
    animation: hotPulse 2s ease-in-out infinite, slideInLeft 0.4s ease both;
}
.hot-badge {
    animation: badgePulse 1.2s ease-in-out infinite;
}
.hot-fire {
    animation: fireShake 0.8s ease-in-out infinite;
    display: inline-block;
}
.hot-dot {
    animation: dotBlink 1s ease-in-out infinite;
}
`;

function useCountdown(gameDate, gameTime) {
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
        const calc = () => {
            if (!gameDate || !gameTime) return;
            const [h, m] = gameTime.split(':').map(Number);
            const target = new Date(gameDate);
            target.setHours(h, m, 0, 0);
            const diff = target - Date.now();
            if (diff <= 0) { setTimeLeft('Скоро'); return; }
            const totalMin = Math.floor(diff / 60000);
            const hours = Math.floor(totalMin / 60);
            const mins = totalMin % 60;
            setTimeLeft(hours > 0 ? `${hours}ч ${mins}м` : `${mins} мин`);
        };
        calc();
        const id = setInterval(calc, 30000);
        return () => clearInterval(id);
    }, [gameDate, gameTime]);

    return timeLeft;
}

function HotGameCard({ game, onJoin, index }) {
    const spotsLeft = (game.maxPlayers || 10) - (game.players?.length || 0);
    const timeLeft = useCountdown(game.date, game.time);
    const isOnlyOne = spotsLeft === 1;

    return (
        <div
            className="hot-card"
            style={{
                minWidth: 300,
                maxWidth: 340,
                flexShrink: 0,
                borderRadius: 16,
                overflow: 'hidden',
                border: '2px solid rgba(185,28,28,0.6)',
                background: 'linear-gradient(145deg, #150808 0%, #1a0a0a 60%, #120808 100%)',
                position: 'relative',
                animationDelay: `${index * 0.1}s`,
                cursor: 'pointer',
            }}
        >
            {/* Top gradient bar */}
            <div style={{
                height: 4,
                background: 'linear-gradient(90deg, #991b1b, #dc2626, #991b1b)',
                backgroundSize: '200% 100%',
            }} />

            {/* НУЖЕН ИГРОК badge */}
            <div
                className="hot-badge"
                style={{
                    position: 'absolute',
                    top: 16,
                    right: 12,
                    background: 'linear-gradient(135deg, #dc2626, #991b1b)',
                    color: '#fff',
                    fontSize: 11,
                    fontWeight: 800,
                    padding: '4px 10px',
                    borderRadius: 20,
                    letterSpacing: 0.5,
                    textTransform: 'uppercase',
                    boxShadow: '0 2px 10px rgba(185,28,28,0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                }}
            >
                <span className="hot-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff', display: 'inline-block' }} />
                {isOnlyOne ? 'Нужен 1 игрок!' : `Нужно ${spotsLeft} игрока`}
            </div>

            <div style={{ padding: '14px 16px 16px' }}>
                {/* Title */}
                <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 12, paddingRight: 100 }}>
                    {game.title || `${game.format} • ${game.location}`}
                </div>

                {/* Info rows */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <ClockCircleOutlined style={{ color: '#ef4444', fontSize: 14 }} />
                        <span style={{ color: '#ef4444', fontWeight: 700, fontSize: 14 }}>
                            Через {timeLeft}
                        </span>
                        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>• {game.time}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <EnvironmentOutlined style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }} />
                        <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>
                            {game.location || game.stadiumName || 'Стадион'}
                        </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <TeamOutlined style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }} />
                        <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>
                            {game.players?.length || 0} / {game.maxPlayers} игроков
                        </span>
                        {/* Player slots visual */}
                        <div style={{ display: 'flex', gap: 3, marginLeft: 4 }}>
                            {Array.from({ length: game.maxPlayers || 10 }).map((_, i) => (
                                <div key={i} style={{
                                    width: 6,
                                    height: 6,
                                    borderRadius: '50%',
                                    background: i < (game.players?.length || 0)
                                        ? '#52c41a'
                                        : 'rgba(185,28,28,0.5)',
                                    flexShrink: 0,
                                }} />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Price + CTA */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ flex: 1 }}>
                        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>Цена: </span>
                        <span style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>
                            {game.pricePerSlot > 0 ? `${game.pricePerSlot} ₼` : 'Бесплатно'}
                        </span>
                    </div>
                    <Button
                        type="primary"
                        danger
                        size="middle"
                        style={{
                            background: 'linear-gradient(135deg, #dc2626, #991b1b)',
                            border: 'none',
                            fontWeight: 700,
                            borderRadius: 10,
                            boxShadow: '0 4px 14px rgba(185,28,28,0.4)',
                            padding: '0 20px',
                        }}
                        onClick={() => onJoin && onJoin(game)}
                    >
                        <span className="hot-fire"><FireOutlined /></span> Записаться
                    </Button>
                </div>
            </div>
        </div>
    );
}

const HotGamesSection = ({ onJoin, fullPage = false }) => {
    const { t } = useTranslation();
    const { data: hotGames = [], isLoading } = useGetHotGamesQuery();

    if (isLoading) return null;

    const urgentGames = Array.isArray(hotGames)
        ? hotGames.filter(g => {
            const spotsLeft = (g.maxPlayers || 0) - (g.players?.length || 0);
            return spotsLeft >= 1 && spotsLeft <= 3 && g.status === 'open';
        })
        : [];

    if (!fullPage && urgentGames.length === 0) return null;

    // Full page mode (inside tab)
    if (fullPage) {
        return (
            <>
                <style>{STYLES}</style>
                {urgentGames.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '80px 20px' }}>
                        <div style={{ fontSize: 64, marginBottom: 16 }}>🔥</div>
                        <div style={{ fontSize: 20, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>
                            Нет горящих игр
                        </div>
                        <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>
                            Горящие игры появятся когда останется 1-2 места
                        </div>
                    </div>
                ) : (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                        gap: 16,
                    }}>
                        {urgentGames.map((game, i) => (
                            <HotGameCard key={game.id} game={game} onJoin={onJoin} index={i} />
                        ))}
                    </div>
                )}
            </>
        );
    }

    // Compact mode (horizontal scroll above game list)
    return (
        <>
            <style>{STYLES}</style>
            <div style={{ marginBottom: 32 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <span className="hot-fire" style={{ fontSize: 24 }}>🔥</span>
                    <span style={{
                        fontSize: 20,
                        fontWeight: 800,
                        background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                    }}>
                        {t('game.hot.title')}
                    </span>
                    <div style={{
                        background: 'rgba(255,77,79,0.15)',
                        border: '1px solid rgba(255,77,79,0.3)',
                        borderRadius: 20,
                        padding: '2px 10px',
                        fontSize: 12,
                        color: '#ef4444',
                        fontWeight: 600,
                    }}>
                        {urgentGames.length}
                    </div>
                </div>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, margin: '0 0 14px' }}>
                    {t('game.hot.subtitle')}
                </p>
                <div style={{
                    display: 'flex',
                    gap: 14,
                    overflowX: 'auto',
                    paddingBottom: 10,
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                    WebkitOverflowScrolling: 'touch',
                }}>
                    {urgentGames.map((game, i) => (
                        <HotGameCard key={game.id} game={game} onJoin={onJoin} index={i} />
                    ))}
                </div>
                <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', marginTop: 24 }} />
            </div>
        </>
    );
};

export default HotGamesSection;
