import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Spin, Avatar } from 'antd';
import { ArrowLeftOutlined, TrophyOutlined } from '@ant-design/icons';
import { useGetLeaderboardQuery } from '../../store/gamesApi';

const TABS = [
    { key: 'topScorers', label: 'Qollar', icon: '⚽', valueKey: 'goals', valueLabel: 'qol' },
    { key: 'topAssists', label: 'Ötürmələr', icon: '🎯', valueKey: 'assists', valueLabel: 'ötürmə' },
    { key: 'topMvp',     label: 'MVP',      icon: '👑', valueKey: 'mvp_count', valueLabel: 'MVP' },
];

const MEDAL = ['🥇', '🥈', '🥉'];

const PlayerRow = ({ player, rank, valueKey, valueLabel, navigate }) => {
    const medal = MEDAL[rank] || null;
    const value = Number(player[valueKey] || 0);
    const isTop3 = rank < 3;

    return (
        <div
            onClick={() => navigate(`/player/${player.playerId}`)}
            style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '14px 18px',
                background: isTop3 ? 'rgba(0,232,122,0.04)' : 'transparent',
                border: `1px solid ${isTop3 ? 'rgba(0,232,122,0.14)' : 'var(--border-color)'}`,
                borderRadius: 12, marginBottom: 8,
                cursor: 'pointer', transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,232,122,0.08)'}
            onMouseLeave={e => e.currentTarget.style.background = isTop3 ? 'rgba(0,232,122,0.04)' : 'transparent'}
        >
            {/* Rank */}
            <div style={{ width: 32, textAlign: 'center', fontSize: isTop3 ? 20 : 13, fontWeight: 700, color: 'var(--text-tertiary)', fontFamily: 'Outfit,sans-serif', flexShrink: 0 }}>
                {medal || `#${rank + 1}`}
            </div>

            {/* Avatar */}
            <Avatar
                src={player.avatar}
                size={40}
                style={{ flexShrink: 0, background: 'var(--bg-raised)', color: 'var(--green)', fontWeight: 700, fontSize: 15 }}
            >
                {!player.avatar && (player.name?.[0] || '?').toUpperCase()}
            </Avatar>

            {/* Name */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "'ClashDisplay-Variable', 'Clash Display', sans-serif", fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {player.name}
                </div>
                <div style={{ fontFamily: 'Outfit,sans-serif', fontSize: 12, color: 'var(--text-tertiary)' }}>
                    {player.games} oyun
                </div>
            </div>

            {/* Value */}
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontFamily: "'ClashDisplay-Variable', 'Clash Display', sans-serif", fontWeight: 800, fontSize: 22, color: isTop3 ? 'var(--green)' : 'var(--text-primary)', lineHeight: 1 }}>
                    {value}
                </div>
                <div style={{ fontFamily: 'Outfit,sans-serif', fontSize: 11, color: 'var(--text-tertiary)' }}>
                    {valueLabel}
                </div>
            </div>
        </div>
    );
};

const LeaderboardPage = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('topScorers');
    const { data, isLoading } = useGetLeaderboardQuery();

    const tab = TABS.find(t => t.key === activeTab);
    const rows = data?.[activeTab] || [];

    return (
        <div style={{ minHeight: '100vh', padding: '32px 20px 80px' }}>
            <div style={{ maxWidth: 640, margin: '0 auto' }}>
                {/* Header */}
                <button
                    onClick={() => navigate('/games')}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', fontSize: 13, fontFamily: 'Outfit,sans-serif', marginBottom: 24, padding: 0 }}
                >
                    <ArrowLeftOutlined style={{ fontSize: 12 }} /> Oyunlara qayıt
                </button>

                <div style={{ marginBottom: 28 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                        <TrophyOutlined style={{ fontSize: 28, color: '#f59e0b' }} />
                        <h1 style={{ fontFamily: "'ClashDisplay-Variable', 'Clash Display', sans-serif", fontWeight: 800, fontSize: 28, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.5px' }}>
                            Liderboard
                        </h1>
                    </div>
                    <p style={{ fontFamily: 'Outfit,sans-serif', fontSize: 14, color: 'var(--text-tertiary)', margin: 0 }}>
                        Bütün oyunlar üzrə ümumi statistika
                    </p>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
                    {TABS.map(t => (
                        <button
                            key={t.key}
                            onClick={() => setActiveTab(t.key)}
                            style={{
                                flex: 1, height: 42, borderRadius: 10, border: `1.5px solid ${activeTab === t.key ? 'var(--green)' : 'var(--border-color)'}`,
                                background: activeTab === t.key ? 'rgba(0,232,122,0.1)' : 'transparent',
                                color: activeTab === t.key ? 'var(--green)' : 'var(--text-secondary)',
                                fontFamily: 'Outfit,sans-serif', fontWeight: 700, fontSize: 13,
                                cursor: 'pointer', transition: 'all 0.15s',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                            }}
                        >
                            <span>{t.icon}</span> {t.label}
                        </button>
                    ))}
                </div>

                {/* List */}
                {isLoading ? (
                    <div style={{ textAlign: 'center', padding: 60 }}><Spin /></div>
                ) : rows.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-tertiary)', fontFamily: 'Outfit,sans-serif' }}>
                        Hələ statistika yoxdur
                    </div>
                ) : (
                    <div>
                        {rows.map((player, i) => (
                            <PlayerRow
                                key={player.playerId}
                                player={player}
                                rank={i}
                                valueKey={tab.valueKey}
                                valueLabel={tab.valueLabel}
                                navigate={navigate}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default LeaderboardPage;
