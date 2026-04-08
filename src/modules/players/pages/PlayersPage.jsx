import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Input, Select, Slider, Button, Empty, Collapse, Pagination, Avatar
} from 'antd';
import {
    SearchOutlined, FilterOutlined, StarFilled, UserOutlined
} from '@ant-design/icons';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { API_BASE } from '../../../config.js';

const { Option } = Select;

const POSITION_CONFIG = {
    goalkeeper: { label: 'GK', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
    defender:   { label: 'DEF', color: '#4f86f7', bg: 'rgba(79,134,247,0.12)' },
    midfielder: { label: 'MID', color: '#a855f7', bg: 'rgba(168,85,247,0.12)' },
    forward:    { label: 'FWD', color: '#f04438', bg: 'rgba(240,68,56,0.12)' },
    any:        { label: 'ANY', color: '#00e87a', bg: 'rgba(0,232,122,0.12)' },
};

const getPositionCfg = (pos) => POSITION_CONFIG[pos] || POSITION_CONFIG.any;

const PlayerRow = ({ player, rank, navigate, t }) => {
    const pos = getPositionCfg(player.position);

    return (
        <div
            onClick={() => navigate(`/player/${player.id}`)}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '11px 16px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: 12,
                cursor: 'pointer',
                transition: 'border-color 0.15s, background 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.background = 'var(--bg-raised)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.background = 'var(--bg-card)'; }}
        >
            {/* Rank */}
            <div style={{
                width: 28, textAlign: 'center', flexShrink: 0,
                fontFamily: "'ClashDisplay-Variable', 'Clash Display', sans-serif", fontWeight: 800, fontSize: 13,
                color: rank <= 3 ? '#faad14' : 'var(--text-tertiary)',
            }}>
                {rank <= 3 ? ['🥇','🥈','🥉'][rank - 1] : rank}
            </div>

            {/* Avatar */}
            <Avatar
                size={40}
                src={player.avatar}
                icon={<UserOutlined />}
                style={{ border: `2px solid ${pos.color}50`, flexShrink: 0, background: 'var(--bg-raised)', color: pos.color }}
            >
                {!player.avatar && player.name?.charAt(0)?.toUpperCase()}
            </Avatar>

            {/* Name + position */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                    fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: 14,
                    color: 'var(--text-primary)', whiteSpace: 'nowrap',
                    overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                    {player.name || t('players.playerFallback')}
                </div>
                {player.position && player.position !== 'any' && (
                    <span style={{
                        fontSize: 10, fontWeight: 700, letterSpacing: '0.5px',
                        color: pos.color, fontFamily: 'Outfit, sans-serif',
                    }}>
                        {pos.label}
                    </span>
                )}
            </div>

            {/* Stats */}
            <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexShrink: 0 }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', fontFamily: "'ClashDisplay-Variable', 'Clash Display', sans-serif" }}>
                        {player.gamesPlayed || 0}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>{t('players.stat.games') || 'игр'}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#f04438', fontFamily: "'ClashDisplay-Variable', 'Clash Display', sans-serif" }}>
                        {player.totalGoals || 0}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>⚽</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#faad14', fontFamily: "'ClashDisplay-Variable', 'Clash Display', sans-serif" }}>
                        {player.averageRating > 0 ? player.averageRating.toFixed(1) : '—'}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>★</div>
                </div>
            </div>
        </div>
    );
};

const PlayersPage = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [players, setPlayers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const pageSize = 20;

    const [searchQuery, setSearchQuery] = useState('');
    const [positionFilter, setPositionFilter] = useState(null);
    const [skillFilter, setSkillFilter] = useState(null);
    const [ageRange, setAgeRange] = useState([14, 70]);
    const [minRating, setMinRating] = useState(0);
    const [sortBy, setSortBy] = useState('rating');
    const [debouncedQuery, setDebouncedQuery] = useState('');

    const positionPills = [
        { value: null, label: t('players.positionPills.all') },
        { value: 'goalkeeper', label: t('players.positionPills.goalkeeper') },
        { value: 'defender', label: t('players.positionPills.defender') },
        { value: 'midfielder', label: t('players.positionPills.midfielder') },
        { value: 'forward', label: t('players.positionPills.forward') },
    ];

    const skillLevels = [
        { value: 'beginner', label: t('skillLevel.beginner') },
        { value: 'amateur', label: t('skillLevel.amateur') },
        { value: 'intermediate', label: t('skillLevel.intermediate') },
        { value: 'advanced', label: t('skillLevel.advanced') },
        { value: 'professional', label: t('skillLevel.professional') },
    ];

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const loadPlayers = useCallback(async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            params.append('page', currentPage.toString());
            params.append('limit', pageSize.toString());
            params.append('sortBy', sortBy);
            if (debouncedQuery) params.append('query', debouncedQuery);
            if (positionFilter) params.append('position', positionFilter);
            if (skillFilter) params.append('skillLevel', skillFilter);
            if (ageRange[0] !== 14) params.append('minAge', ageRange[0].toString());
            if (ageRange[1] !== 70) params.append('maxAge', ageRange[1].toString());
            if (minRating > 0) params.append('minRating', minRating.toString());
            const res = await axios.get(`${API_BASE}/api/users/players/search?${params.toString()}`);
            setPlayers(res.data.users || []);
            setTotal(res.data.total || 0);
            setTotalPages(res.data.totalPages || 0);
        } catch (error) {
            console.error('Failed to load players:', error);
        } finally {
            setLoading(false);
        }
    }, [currentPage, debouncedQuery, positionFilter, skillFilter, ageRange, minRating, sortBy]);

    useEffect(() => { loadPlayers(); }, [loadPlayers]);
    useEffect(() => { setCurrentPage(1); }, [debouncedQuery, positionFilter, skillFilter, ageRange, minRating, sortBy]);

    const handlePageChange = (page) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const clearFilters = () => {
        setSearchQuery('');
        setPositionFilter(null);
        setSkillFilter(null);
        setAgeRange([14, 70]);
        setMinRating(0);
        setSortBy('rating');
        setCurrentPage(1);
    };

    const hasActiveFilters = searchQuery || positionFilter || skillFilter || minRating > 0 || ageRange[0] !== 14 || ageRange[1] !== 70;

    return (
        <div style={{ minHeight: '100vh', padding: '28px 20px' }}>
            <style>{`
                @keyframes shimmer {
                    0%, 100% { opacity: 0.3; }
                    50% { opacity: 0.6; }
                }
                .player-card-new:hover {
                    transform: translateY(-4px);
                    border-color: rgba(255,255,255,0.14) !important;
                    box-shadow: 0 12px 32px rgba(0,0,0,0.5) !important;
                }
                .pos-pill-btn {
                    padding: 6px 16px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 13px;
                    font-family: 'Outfit', sans-serif;
                    font-weight: 500;
                    transition: all 0.15s ease;
                    white-space: nowrap;
                    border: 1px solid transparent;
                }
                .pos-pill-btn:hover {
                    background: var(--bg-raised) !important;
                    color: var(--text-secondary) !important;
                }
            `}</style>

            <div style={{ maxWidth: 1200, margin: '0 auto' }} className="animate-fade-in">

                {/* Header */}
                <div style={{ marginBottom: 24 }}>
                    <h1 style={{
                        fontFamily: "'ClashDisplay-Variable', 'Clash Display', sans-serif",
                        fontSize: 30,
                        fontWeight: 800,
                        color: 'var(--text-primary)',
                        margin: '0 0 4px',
                        letterSpacing: '-0.5px',
                    }}>
                        {t('players.title')}
                    </h1>
                    <p style={{ color: 'var(--text-tertiary)', margin: 0, fontSize: 14 }}>
                        {loading ? t('players.loadingCount') : t('players.totalCount', { n: total })}
                    </p>
                </div>

                {/* Search */}
                <Input
                    prefix={<SearchOutlined style={{ color: 'var(--text-tertiary)' }} />}
                    placeholder={t('players.searchPlaceholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    size="large"
                    allowClear
                    style={{ marginBottom: 12 }}
                />

                {/* Position pills */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                    {positionPills.map(pos => {
                        const active = positionFilter === pos.value;
                        const cfg = pos.value ? getPositionCfg(pos.value) : null;
                        return (
                            <button
                                key={pos.value ?? 'all'}
                                className="pos-pill-btn"
                                onClick={() => setPositionFilter(pos.value)}
                                style={{
                                    border: active
                                        ? `1px solid ${cfg ? cfg.color + '60' : 'var(--green-border)'}`
                                        : '1px solid var(--border-color)',
                                    background: active
                                        ? (cfg ? cfg.bg : 'var(--green-dim)')
                                        : 'var(--bg-card)',
                                    color: active
                                        ? (cfg ? cfg.color : 'var(--green)')
                                        : 'var(--text-tertiary)',
                                }}
                            >
                                {pos.label}
                            </button>
                        );
                    })}
                </div>

                {/* Filters row */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
                    <Select
                        placeholder={t('players.skillLevelFilter')}
                        value={skillFilter}
                        onChange={setSkillFilter}
                        allowClear
                        style={{ minWidth: 155 }}
                    >
                        {skillLevels.map(s => (
                            <Option key={s.value} value={s.value}>{s.label}</Option>
                        ))}
                    </Select>

                    <Select
                        value={sortBy}
                        onChange={setSortBy}
                        style={{ minWidth: 150 }}
                    >
                        <Option value="rating">{t('players.sortBy.rating')}</Option>
                        <Option value="games">{t('players.sortBy.games')}</Option>
                        <Option value="goals">{t('players.sortBy.goals')}</Option>
                        <Option value="name">{t('players.sortBy.name')}</Option>
                    </Select>

                    {hasActiveFilters && (
                        <Button type="text" size="small" onClick={clearFilters}
                            style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>
                            {t('players.resetFilters')}
                        </Button>
                    )}
                </div>

                {/* Advanced filters */}
                <Collapse
                    ghost
                    style={{ marginBottom: 24, border: '1px solid var(--border-color)', borderRadius: 10, overflow: 'hidden' }}
                    items={[{
                        key: '1',
                        label: (
                            <span style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>
                                <FilterOutlined style={{ marginRight: 6 }} />
                                {t('players.advancedFilters')}
                            </span>
                        ),
                        children: (
                            <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', padding: '4px 0 8px' }}>
                                <div style={{ flex: 1, minWidth: 200 }}>
                                    <label style={{ color: 'var(--text-secondary)', fontSize: 12, display: 'block', marginBottom: 8 }}>
                                        {t('players.ageRange', { min: ageRange[0], max: ageRange[1] })}
                                    </label>
                                    <Slider range min={14} max={70} value={ageRange} onChange={setAgeRange} />
                                </div>
                                <div style={{ flex: 1, minWidth: 200 }}>
                                    <label style={{ color: 'var(--text-secondary)', fontSize: 12, display: 'block', marginBottom: 8 }}>
                                        {t('players.minRating', { n: minRating })}
                                    </label>
                                    <Slider min={0} max={5} step={0.5} value={minRating} onChange={setMinRating} />
                                </div>
                            </div>
                        )
                    }]}
                />

                {/* Content */}
                {loading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {Array.from({ length: 16 }).map((_, i) => (
                            <div key={i} style={{
                                height: 62,
                                borderRadius: 12,
                                background: 'var(--bg-card)',
                                animation: 'shimmer 1.5s ease-in-out infinite',
                                animationDelay: `${i * 0.05}s`,
                            }} />
                        ))}
                    </div>
                ) : players.length === 0 ? (
                    <Empty description={<span style={{ color: 'var(--text-tertiary)' }}>{t('players.notFound')}</span>} style={{ padding: 60 }} />
                ) : (
                    <>
                        <div style={{
                            marginBottom: 14,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                        }}>
                            <span style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>
                                {t('players.found')} <strong style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{total}</strong>
                            </span>
                            {totalPages > 1 && (
                                <span style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>
                                    {t('players.page', { current: currentPage, total: totalPages })}
                                </span>
                            )}
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {players.map((player, idx) => (
                                <PlayerRow key={player.id} player={player} rank={(currentPage - 1) * pageSize + idx + 1} navigate={navigate} t={t} />
                            ))}
                        </div>

                        {total > pageSize && (
                            <div style={{ marginTop: 40, display: 'flex', justifyContent: 'center' }}>
                                <Pagination
                                    current={currentPage}
                                    total={total}
                                    pageSize={pageSize}
                                    onChange={handlePageChange}
                                    showSizeChanger={false}
                                    showQuickJumper={total > 100}
                                />
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default PlayersPage;
