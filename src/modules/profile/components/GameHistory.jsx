import { Tag, DatePicker, Empty, Pagination } from 'antd';
import { CalendarOutlined, EnvironmentOutlined, TrophyOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

const STATUS_CONFIG = {
    finished:  { color: '#4ade80', bg: 'rgba(74,222,128,0.12)', label: null },
    cancelled: { color: '#f87171', bg: 'rgba(248,113,113,0.12)', label: null },
    full:      { color: '#fb923c', bg: 'rgba(251,146,60,0.12)',  label: null },
    open:      { color: '#60a5fa', bg: 'rgba(96,165,250,0.12)',  label: null },
};

const GameHistory = ({ games }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [filterDate, setFilterDate] = useState(null);
    const [page, setPage] = useState(1);
    const pageSize = 5;

    const getStatusLabel = (status) => {
        switch (status) {
            case 'finished':  return t('profile.history.statusFinished');
            case 'cancelled': return t('profile.history.statusCancelled');
            case 'full':      return t('profile.history.statusFull');
            default:          return t('profile.history.statusOpen');
        }
    };

    const filteredGames = games.filter(game => {
        if (!filterDate) return true;
        return new Date(game.date).toDateString() === filterDate.toDate().toDateString();
    });

    const paged = filteredGames.slice((page - 1) * pageSize, page * pageSize);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {/* ── Header row ── */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '16px 20px',
                borderBottom: '1px solid var(--border-color)',
            }}>
                <span style={{
                    fontFamily: "'ClashDisplay-Variable','Clash Display',sans-serif",
                    fontWeight: 700, fontSize: 15, color: 'var(--text-primary)',
                    whiteSpace: 'nowrap',
                }}>
                    {t('profile.history.title')}
                </span>
                <DatePicker
                    onChange={(d) => { setFilterDate(d); setPage(1); }}
                    placeholder={t('profile.history.dateFilter')}
                    size="small"
                    style={{ maxWidth: 160 }}
                />
            </div>

            {/* ── Game list ── */}
            <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {paged.length > 0 ? paged.map((game) => {
                    const cfg = STATUS_CONFIG[game.status] || STATUS_CONFIG.open;
                    const dateStr = new Date(game.date).toLocaleDateString('az-AZ', { day: '2-digit', month: '2-digit', year: 'numeric' });
                    const hasScore = game.status === 'finished' && (game.scoreTeamA != null || game.scoreTeamB != null);
                    const mvpName = game.mvpId ? game.players?.find(p => p.id === game.mvpId)?.name : null;

                    return (
                        <div
                            key={game.id}
                            onClick={() => navigate(`/games/${game.id}`)}
                            style={{
                                background: 'var(--bg-raised)',
                                border: '1px solid var(--border-color)',
                                borderRadius: 12,
                                padding: '14px 16px',
                                cursor: 'pointer',
                                transition: 'border-color 0.15s',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 8,
                            }}
                            onMouseEnter={e => e.currentTarget.style.borderColor = cfg.color}
                            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
                        >
                            {/* Title + status */}
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                                <span style={{
                                    fontWeight: 700, fontSize: 14,
                                    color: 'var(--text-primary)',
                                    fontFamily: 'Outfit, sans-serif',
                                    lineHeight: 1.3,
                                    flex: 1,
                                }}>
                                    {game.title}
                                </span>
                                <span style={{
                                    fontSize: 11, fontWeight: 600,
                                    color: cfg.color,
                                    background: cfg.bg,
                                    borderRadius: 6,
                                    padding: '3px 8px',
                                    whiteSpace: 'nowrap',
                                    flexShrink: 0,
                                }}>
                                    {getStatusLabel(game.status)}
                                </span>
                            </div>

                            {/* Meta row */}
                            <div style={{
                                display: 'flex', alignItems: 'center',
                                flexWrap: 'wrap', gap: '4px 14px',
                                color: 'var(--text-secondary)', fontSize: 12,
                            }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <CalendarOutlined style={{ fontSize: 11 }} />
                                    {dateStr} {game.time || ''}
                                </span>
                                {game.location && (
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <EnvironmentOutlined style={{ fontSize: 11 }} />
                                        {game.location}
                                    </span>
                                )}
                            </div>

                            {/* Score + MVP row */}
                            {(hasScore || mvpName) && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                                    {hasScore && (
                                        <span style={{
                                            fontFamily: "'ClashDisplay-Variable',sans-serif",
                                            fontWeight: 700, fontSize: 18,
                                            color: 'var(--green)',
                                            letterSpacing: 1,
                                        }}>
                                            {game.scoreTeamA} : {game.scoreTeamB}
                                        </span>
                                    )}
                                    {mvpName && (
                                        <span style={{
                                            display: 'flex', alignItems: 'center', gap: 4,
                                            fontSize: 11, fontWeight: 600,
                                            color: '#f59e0b',
                                            background: 'rgba(245,158,11,0.1)',
                                            borderRadius: 6, padding: '2px 8px',
                                        }}>
                                            <TrophyOutlined style={{ fontSize: 10 }} />
                                            MVP: {mvpName}
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                }) : (
                    <Empty
                        description={<span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{t('profile.history.noGames')}</span>}
                        style={{ padding: '32px 0' }}
                    />
                )}
            </div>

            {/* ── Pagination ── */}
            {filteredGames.length > pageSize && (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 16px 16px' }}>
                    <Pagination
                        current={page}
                        pageSize={pageSize}
                        total={filteredGames.length}
                        onChange={setPage}
                        showSizeChanger={false}
                        size="small"
                    />
                </div>
            )}
        </div>
    );
};

export default GameHistory;
