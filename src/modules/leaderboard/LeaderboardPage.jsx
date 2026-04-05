import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Spin, Avatar } from 'antd';
import { ArrowLeftOutlined, TrophyOutlined } from '@ant-design/icons';
import { useGetLeaderboardQuery } from '../../store/gamesApi';

const SECTIONS = [
    { key: 'topScorers', sectionKey: 'scorers', labelKey: 'goals',   icon: '⚽', valueKey: 'goals',     color: '#00e87a', bg: 'rgba(0,232,122,0.08)',  border: 'rgba(0,232,122,0.2)'  },
    { key: 'topAssists', sectionKey: 'assists',  labelKey: 'assists', icon: '🎯', valueKey: 'assists',   color: '#3b82f6', bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.2)' },
    { key: 'topMvp',     sectionKey: 'mvp',      labelKey: 'mvp',     icon: '👑', valueKey: 'mvp_count', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)' },
];

const MEDAL_COLOR = ['#f59e0b', '#9ca3af', '#cd7c4a'];
const MEDAL_GLOW  = ['rgba(245,158,11,0.25)', 'rgba(156,163,175,0.15)', 'rgba(205,124,74,0.15)'];

/* ── Top-3 card ─────────────────────────────────────────────────────────── */
const TopCard = ({ player, rank, valueKey, valueLabel, color, navigate }) => {
    const { t } = useTranslation();
    const value = Number(player[valueKey] || 0);
    const isFirst = rank === 0;

    return (
        <div
            onClick={() => navigate(`/player/${player.playerId}`)}
            style={{
                flex: 1, minWidth: 0,
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
                padding: isFirst ? '20px 12px 18px' : '16px 10px 14px',
                borderRadius: 16,
                border: `1.5px solid ${isFirst ? color : 'var(--border-color)'}`,
                background: isFirst
                    ? `linear-gradient(160deg, ${color}18 0%, ${color}06 100%)`
                    : 'var(--bg-surface)',
                cursor: 'pointer',
                transition: 'transform 0.15s, box-shadow 0.15s',
                position: 'relative',
                boxShadow: isFirst ? `0 4px 24px ${MEDAL_GLOW[0]}` : 'none',
                order: rank === 1 ? -1 : rank === 0 ? 0 : 1,
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 8px 28px ${MEDAL_GLOW[rank]}`; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = isFirst ? `0 4px 24px ${MEDAL_GLOW[0]}` : 'none'; }}
        >
            <div style={{
                position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)',
                background: MEDAL_COLOR[rank], color: '#fff',
                borderRadius: 20, padding: '2px 10px',
                fontFamily: 'Outfit,sans-serif', fontWeight: 800, fontSize: 11,
                letterSpacing: 0.5, whiteSpace: 'nowrap',
                boxShadow: `0 2px 8px ${MEDAL_GLOW[rank]}`,
            }}>
                {rank === 0 ? '🥇 #1' : rank === 1 ? '🥈 #2' : '🥉 #3'}
            </div>

            <Avatar
                src={player.avatar} size={isFirst ? 72 : 58}
                style={{
                    border: `3px solid ${MEDAL_COLOR[rank]}`,
                    background: 'var(--bg-raised)', color, fontWeight: 800,
                    fontSize: isFirst ? 22 : 18, marginTop: 6, display: 'block',
                }}
            >
                {!player.avatar && (player.name?.[0] || '?').toUpperCase()}
            </Avatar>

            <div style={{
                fontFamily: "'ClashDisplay-Variable','Clash Display',sans-serif",
                fontWeight: 700, fontSize: isFirst ? 14 : 12,
                color: 'var(--text-primary)', textAlign: 'center',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%',
            }}>
                {player.name}
            </div>

            <div style={{ textAlign: 'center' }}>
                <div style={{
                    fontFamily: "'ClashDisplay-Variable','Clash Display',sans-serif",
                    fontWeight: 900, fontSize: isFirst ? 32 : 26, color, lineHeight: 1,
                }}>
                    {value}
                </div>
                <div style={{ fontFamily: 'Outfit,sans-serif', fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>
                    {valueLabel}
                </div>
            </div>

            {player.games && (
                <div style={{ fontFamily: 'Outfit,sans-serif', fontSize: 11, color: 'var(--text-tertiary)' }}>
                    {t('nav.leaderboardPage.games', { count: player.games })}
                </div>
            )}
        </div>
    );
};

/* ── Compact row (#4–10) ─────────────────────────────────────────────────── */
const CompactRow = ({ player, rank, valueKey, valueLabel, color, navigate }) => {
    const { t } = useTranslation();
    const value = Number(player[valueKey] || 0);

    return (
        <div
            onClick={() => navigate(`/player/${player.playerId}`)}
            style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '11px 16px', borderRadius: 12,
                border: '1px solid var(--border-color)', marginBottom: 6,
                cursor: 'pointer', transition: 'background 0.12s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-raised)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
            <div style={{
                width: 26, textAlign: 'center', flexShrink: 0,
                fontFamily: 'Outfit,sans-serif', fontWeight: 700, fontSize: 13,
                color: 'var(--text-tertiary)',
            }}>
                #{rank + 1}
            </div>

            <Avatar
                src={player.avatar} size={40}
                style={{ flexShrink: 0, border: '2px solid var(--border-color)', background: 'var(--bg-raised)', color, fontWeight: 700 }}
            >
                {!player.avatar && (player.name?.[0] || '?').toUpperCase()}
            </Avatar>

            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                    fontFamily: "'ClashDisplay-Variable','Clash Display',sans-serif",
                    fontWeight: 700, fontSize: 14, color: 'var(--text-primary)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                    {player.name}
                </div>
                {player.games && (
                    <div style={{ fontFamily: 'Outfit,sans-serif', fontSize: 11, color: 'var(--text-tertiary)' }}>
                        {t('nav.leaderboardPage.games', { count: player.games })}
                    </div>
                )}
            </div>

            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <span style={{
                    fontFamily: "'ClashDisplay-Variable','Clash Display',sans-serif",
                    fontWeight: 800, fontSize: 20, color,
                }}>
                    {value}
                </span>
                <span style={{ fontFamily: 'Outfit,sans-serif', fontSize: 11, color: 'var(--text-tertiary)', marginLeft: 4 }}>
                    {valueLabel}
                </span>
            </div>
        </div>
    );
};

/* ── Section ─────────────────────────────────────────────────────────────── */
const Section = ({ section, rows, navigate }) => {
    const { t } = useTranslation();
    const { sectionKey, labelKey, icon, valueKey, color, bg, border } = section;
    const label = t(`nav.leaderboardPage.sections.${sectionKey}`);
    const valueLabel = t(`nav.leaderboardPage.labels.${labelKey}`);
    const top3 = rows.slice(0, 3);
    const rest = rows.slice(3);

    return (
        <div style={{ marginBottom: 40 }}>
            <div style={{
                display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20,
                padding: '12px 18px', borderRadius: 14,
                background: bg, border: `1px solid ${border}`,
            }}>
                <span style={{ fontSize: 22 }}>{icon}</span>
                <div>
                    <div style={{
                        fontFamily: "'ClashDisplay-Variable','Clash Display',sans-serif",
                        fontWeight: 800, fontSize: 18, color: 'var(--text-primary)',
                    }}>
                        {label}
                    </div>
                    <div style={{ fontFamily: 'Outfit,sans-serif', fontSize: 12, color: 'var(--text-tertiary)' }}>
                        {t('nav.leaderboardPage.topPlayers', { count: rows.length })}
                    </div>
                </div>
            </div>

            {top3.length > 0 && (
                <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'flex-end' }}>
                    {top3.map((player, i) => (
                        <TopCard
                            key={player.playerId}
                            player={player} rank={i}
                            valueKey={valueKey} valueLabel={valueLabel}
                            color={color} navigate={navigate}
                        />
                    ))}
                </div>
            )}

            {rest.map((player, i) => (
                <CompactRow
                    key={player.playerId}
                    player={player} rank={i + 3}
                    valueKey={valueKey} valueLabel={valueLabel}
                    color={color} navigate={navigate}
                />
            ))}
        </div>
    );
};

/* ── Page ────────────────────────────────────────────────────────────────── */
const LeaderboardPage = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { data, isLoading } = useGetLeaderboardQuery();

    return (
        <div style={{ minHeight: '100vh', padding: '32px 20px 100px' }}>
            <button
                onClick={() => navigate('/games')}
                style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--text-tertiary)', fontSize: 13,
                    fontFamily: 'Outfit,sans-serif', marginBottom: 24, padding: 0,
                }}
            >
                <ArrowLeftOutlined style={{ fontSize: 12 }} /> {t('nav.leaderboardPage.back')}
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                <TrophyOutlined style={{ fontSize: 28, color: '#f59e0b' }} />
                <h1 style={{
                    fontFamily: "'ClashDisplay-Variable','Clash Display',sans-serif",
                    fontWeight: 900, fontSize: 28, color: 'var(--text-primary)',
                    margin: 0, letterSpacing: '-0.5px',
                }}>
                    {t('nav.leaderboardPage.title')}
                </h1>
            </div>
            <p style={{ fontFamily: 'Outfit,sans-serif', fontSize: 14, color: 'var(--text-tertiary)', margin: '0 0 32px' }}>
                {t('nav.leaderboardPage.subtitle')}
            </p>

            {isLoading ? (
                <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>
            ) : !data ? (
                <div style={{ textAlign: 'center', padding: 80, color: 'var(--text-tertiary)', fontFamily: 'Outfit,sans-serif' }}>
                    {t('nav.leaderboardPage.empty')}
                </div>
            ) : (
                <div className="leaderboard-grid">
                    {SECTIONS.map(section => (
                        <div key={section.key} style={{ flex: 1, minWidth: 0 }}>
                            <Section
                                section={section}
                                rows={data[section.key] || []}
                                navigate={navigate}
                            />
                        </div>
                    ))}
                </div>
                <style>{`
                    .leaderboard-grid {
                        display: flex;
                        gap: 16px;
                        align-items: flex-start;
                    }
                    @media (max-width: 767px) {
                        .leaderboard-grid {
                            flex-direction: column;
                        }
                    }
                `}</style>
            )}
        </div>
    );
};

export default LeaderboardPage;
