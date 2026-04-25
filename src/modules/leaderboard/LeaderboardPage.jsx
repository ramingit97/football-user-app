import { useState, useEffect } from 'react';
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

const MEDAL_COLOR  = ['#f59e0b', '#9ca3af', '#cd7c4a'];
const MEDAL_GLOW   = ['rgba(245,158,11,0.35)', 'rgba(156,163,175,0.2)', 'rgba(205,124,74,0.2)'];
const PODIUM_SHIFT = [0, 40, 56]; // translateY — #1 highest, #2 medium, #3 lowest

/* ── Top-3 podium card ───────────────────────────────────────────────────── */
const TopCard = ({ player, rank, valueKey, valueLabel, color, navigate }) => {
    const { t } = useTranslation();
    const value    = Number(player[valueKey] || 0);
    const isFirst  = rank === 0;
    const medal    = ['🥇','🥈','🥉'][rank];
    const avatarSz = [84, 64, 56][rank];
    const mColor   = MEDAL_COLOR[rank];

    return (
        <div
            onClick={() => navigate(`/player/${player.playerId}`)}
            style={{
                flex: 1, minWidth: 0,
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
                padding: isFirst ? '32px 16px 24px' : '22px 12px 18px',
                borderRadius: 20,
                border: `1.5px solid ${mColor}55`,
                background: `linear-gradient(170deg, ${mColor}18 0%, ${mColor}06 60%, transparent 100%)`,
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
                position: 'relative', overflow: 'hidden',
                boxShadow: `0 8px 40px ${MEDAL_GLOW[rank]}, 0 0 0 1px ${mColor}18`,
                transform: `translateY(${PODIUM_SHIFT[rank]}px)`,
                order: rank === 1 ? -1 : rank === 0 ? 0 : 1,
            }}
            onMouseEnter={e => {
                e.currentTarget.style.transform = `translateY(${PODIUM_SHIFT[rank] - 8}px)`;
                e.currentTarget.style.boxShadow = `0 20px 60px ${MEDAL_GLOW[rank]}, 0 0 0 1px ${mColor}35`;
            }}
            onMouseLeave={e => {
                e.currentTarget.style.transform = `translateY(${PODIUM_SHIFT[rank]}px)`;
                e.currentTarget.style.boxShadow = `0 8px 40px ${MEDAL_GLOW[rank]}, 0 0 0 1px ${mColor}18`;
            }}
        >
            {/* Background glow orb */}
            <div style={{
                position: 'absolute', top: -30, left: '50%', transform: 'translateX(-50%)',
                width: 160, height: 160, borderRadius: '50%',
                background: `radial-gradient(circle, ${mColor}22 0%, transparent 70%)`,
                pointerEvents: 'none',
            }} />

            {/* Medal badge top-right */}
            <div style={{
                position: 'absolute', top: 12, right: 12,
                background: `${mColor}22`, border: `1px solid ${mColor}55`,
                borderRadius: 20, padding: '3px 10px',
                fontWeight: 800, fontSize: 11, color: mColor, letterSpacing: 0.5,
            }}>
                {medal} #{rank + 1}
            </div>

            {/* Crown for #1 */}
            {isFirst && (
                <div style={{
                    position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)',
                    fontSize: 22, lineHeight: 1, zIndex: 2,
                    filter: 'drop-shadow(0 0 8px rgba(245,158,11,0.8))',
                }}>👑</div>
            )}

            {/* Avatar with glow halo */}
            <div style={{ position: 'relative', marginTop: isFirst ? 16 : 4 }}>
                <div style={{
                    position: 'absolute', inset: -8, borderRadius: '50%',
                    background: `radial-gradient(circle, ${mColor}45 0%, transparent 70%)`,
                    filter: 'blur(8px)',
                }} />
                <div style={{
                    width: avatarSz, height: avatarSz, borderRadius: '50%', overflow: 'hidden',
                    border: `3px solid ${mColor}`,
                    boxShadow: `0 0 24px ${mColor}70, 0 0 48px ${mColor}25`,
                    background: 'var(--bg-raised)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    position: 'relative', zIndex: 1,
                    fontSize: isFirst ? 28 : 20, fontWeight: 900, color: mColor,
                }}>
                    {player.avatar
                        ? <img src={player.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : (player.name?.[0] || '?').toUpperCase()
                    }
                </div>
            </div>

            {/* Name */}
            <div style={{
                fontFamily: "'ClashDisplay-Variable','Clash Display',sans-serif",
                fontWeight: 700, fontSize: isFirst ? 15 : 13,
                color: 'var(--text-primary)', textAlign: 'center',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%',
                position: 'relative', zIndex: 1,
            }}>
                {player.name}
            </div>

            {/* Value */}
            <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
                <div style={{
                    fontFamily: "'ClashDisplay-Variable','Clash Display',sans-serif",
                    fontWeight: 900, fontSize: isFirst ? 48 : 34,
                    color: mColor, lineHeight: 1, letterSpacing: '-2px',
                    textShadow: `0 0 24px ${mColor}80`,
                }}>
                    {value}
                </div>
                <div style={{ fontFamily: 'Outfit,sans-serif', fontSize: 11, color: 'var(--text-tertiary)', marginTop: 3 }}>
                    {valueLabel}
                </div>
            </div>

            {player.games && (
                <div style={{
                    fontFamily: 'Outfit,sans-serif', fontSize: 11, color: mColor,
                    background: `${mColor}14`, border: `1px solid ${mColor}30`,
                    padding: '2px 12px', borderRadius: 99,
                    position: 'relative', zIndex: 1,
                }}>
                    {t('nav.leaderboardPage.games', { count: player.games })}
                </div>
            )}
        </div>
    );
};

/* ── Compact row (#4+) ───────────────────────────────────────────────────── */
const CompactRow = ({ player, rank, valueKey, valueLabel, color, navigate }) => {
    const { t } = useTranslation();
    const value = Number(player[valueKey] || 0);

    return (
        <div
            onClick={() => navigate(`/player/${player.playerId}`)}
            style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '12px 16px', borderRadius: 12,
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                marginBottom: 8, cursor: 'pointer',
                transition: 'all 0.15s',
                position: 'relative', overflow: 'hidden',
            }}
            onMouseEnter={e => {
                e.currentTarget.style.borderColor = `${color}45`;
                e.currentTarget.style.background = `${color}08`;
                e.currentTarget.style.transform = 'translateX(4px)';
            }}
            onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--border-color)';
                e.currentTarget.style.background = 'var(--bg-card)';
                e.currentTarget.style.transform = 'translateX(0)';
            }}
        >
            {/* Left accent */}
            <div style={{
                position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
                background: `linear-gradient(180deg, ${color} 0%, ${color}44 100%)`,
                borderRadius: '12px 0 0 12px', opacity: 0.7,
            }} />

            <div style={{
                width: 28, textAlign: 'center', flexShrink: 0, marginLeft: 6,
                fontFamily: "'ClashDisplay-Variable','Clash Display',sans-serif",
                fontWeight: 800, fontSize: 14, color: 'var(--text-tertiary)',
            }}>
                #{rank + 1}
            </div>

            <div style={{
                width: 42, height: 42, borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
                border: `2px solid ${color}55`,
                boxShadow: `0 0 12px ${color}28`,
                background: `${color}15`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, fontWeight: 900, color,
            }}>
                {player.avatar
                    ? <img src={player.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : (player.name?.[0] || '?').toUpperCase()
                }
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                    fontFamily: "'ClashDisplay-Variable','Clash Display',sans-serif",
                    fontWeight: 700, fontSize: 14, color: 'var(--text-primary)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                    {player.name}
                </div>
                {player.games && (
                    <div style={{ fontFamily: 'Outfit,sans-serif', fontSize: 11, color: 'var(--text-tertiary)', marginTop: 1 }}>
                        {t('nav.leaderboardPage.games', { count: player.games })}
                    </div>
                )}
            </div>

            <div style={{
                background: `${color}15`, border: `1px solid ${color}35`,
                borderRadius: 10, padding: '6px 14px',
                textAlign: 'center', flexShrink: 0,
            }}>
                <span style={{
                    fontFamily: "'ClashDisplay-Variable','Clash Display',sans-serif",
                    fontWeight: 900, fontSize: 20, color,
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
    const label      = t(`nav.leaderboardPage.sections.${sectionKey}`);
    const valueLabel = t(`nav.leaderboardPage.labels.${labelKey}`);
    const top3 = rows.slice(0, 3);
    const rest = rows.slice(3);

    return (
        <div style={{ marginBottom: 48 }}>
            {/* Section header */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28,
                padding: '16px 22px', borderRadius: 16,
                background: bg, border: `1px solid ${border}`,
                position: 'relative', overflow: 'hidden',
            }}>
                <div style={{
                    position: 'absolute', right: -20, top: -20,
                    width: 130, height: 130, borderRadius: '50%',
                    background: `radial-gradient(circle, ${color}20 0%, transparent 70%)`,
                    pointerEvents: 'none',
                }} />
                <span style={{ fontSize: 30, flexShrink: 0, filter: `drop-shadow(0 0 8px ${color}80)` }}>{icon}</span>
                <div>
                    <div style={{
                        fontFamily: "'ClashDisplay-Variable','Clash Display',sans-serif",
                        fontWeight: 900, fontSize: 20, color: 'var(--text-primary)',
                        letterSpacing: '-0.3px',
                    }}>
                        {label}
                    </div>
                    <div style={{ fontFamily: 'Outfit,sans-serif', fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>
                        {t('nav.leaderboardPage.topPlayers', { count: rows.length })}
                    </div>
                </div>
            </div>

            {top3.length > 0 && (
                <div style={{ display: 'flex', gap: 10, marginBottom: 28, alignItems: 'flex-end' }}>
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
    const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);

    useEffect(() => {
        const handler = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handler);
        return () => window.removeEventListener('resize', handler);
    }, []);

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
                <div style={{
                    display: 'flex', gap: 16, alignItems: 'flex-start',
                    flexDirection: isMobile ? 'column' : 'row',
                }}>
                    {SECTIONS.map(section => (
                        <div key={section.key} style={{ flex: 1, minWidth: 0, width: '100%' }}>
                            <Section
                                section={section}
                                rows={data[section.key] || []}
                                navigate={navigate}
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default LeaderboardPage;
