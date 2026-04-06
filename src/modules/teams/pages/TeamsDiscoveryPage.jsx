import { useState, useMemo, useRef } from 'react';
import { Input, Select, Button, Empty, Pagination, Avatar, Modal, Form, message } from 'antd';
import {
    SearchOutlined, TrophyOutlined, TeamOutlined, PlusOutlined,
    UserOutlined
} from '@ant-design/icons';
import { useGetTeamsQuery, useCreateTeamMutation } from '../../../store/teamsApi';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

const { Option } = Select;

const getWinRate = (wins, losses, draws) => {
    const total = (wins || 0) + (losses || 0) + (draws || 0);
    if (total === 0) return null;
    return Math.round(((wins || 0) / total) * 100);
};

const RANK_STYLE = {
    1: { color: '#FFD700', border: 'rgba(255,215,0,0.35)', bg: 'rgba(255,215,0,0.05)', label: '🥇' },
    2: { color: '#C0C0C0', border: 'rgba(192,192,192,0.3)', bg: 'rgba(192,192,192,0.04)', label: '🥈' },
    3: { color: '#CD7F32', border: 'rgba(205,127,50,0.3)',  bg: 'rgba(205,127,50,0.04)',  label: '🥉' },
};

const TeamRow = ({ team, rank, navigate, t }) => {
    const [hovered, setHovered] = useState(false);
    const winRate = getWinRate(team.wins, team.losses, team.draws);
    const memberCount = team.playerIds?.length || 1;
    const rs = RANK_STYLE[rank];
    const winColor = winRate === null ? 'var(--text-tertiary)' : winRate >= 50 ? '#52c41a' : winRate >= 33 ? '#faad14' : '#f04438';
    const totalGames = (team.wins || 0) + (team.losses || 0) + (team.draws || 0);

    return (
        <div
            onClick={() => navigate(`/teams/${team.id}`)}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: 0,
                background: rs ? rs.bg : hovered ? 'var(--bg-raised)' : 'var(--bg-card)',
                border: `1px solid ${rs ? (hovered ? rs.color + '60' : rs.border) : hovered ? 'rgba(255,255,255,0.1)' : 'var(--border-color)'}`,
                borderLeft: rs ? `3px solid ${rs.color}` : `3px solid transparent`,
                borderRadius: 12,
                cursor: 'pointer',
                transition: 'all 0.18s ease',
                transform: hovered ? 'translateX(3px)' : 'translateX(0)',
                boxShadow: hovered && rs ? `0 4px 20px ${rs.color}15` : 'none',
                overflow: 'hidden',
            }}
        >
            {/* Rank number */}
            <div style={{
                width: 52, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '14px 0',
                fontFamily: "'ClashDisplay-Variable','Clash Display',sans-serif",
                fontWeight: 800,
                fontSize: rs ? 18 : 13,
                color: rs ? rs.color : 'var(--text-tertiary)',
            }}>
                {rs ? rs.label : rank}
            </div>

            {/* Avatar */}
            <Avatar
                size={40}
                src={team.logo || team.flag}
                icon={<TeamOutlined />}
                style={{
                    flexShrink: 0,
                    border: rs ? `2px solid ${rs.color}50` : '2px solid rgba(255,255,255,0.08)',
                    background: 'var(--bg-raised)',
                    color: rs ? rs.color : 'var(--text-tertiary)',
                    marginRight: 12,
                }}
            />

            {/* Name + meta */}
            <div style={{ flex: 1, minWidth: 0, padding: '14px 0' }}>
                <div style={{
                    fontFamily: "'ClashDisplay-Variable','Clash Display',sans-serif",
                    fontWeight: 700,
                    fontSize: 14,
                    color: 'var(--text-primary)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    marginBottom: 3,
                }}>
                    {team.name}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'Outfit,sans-serif', display: 'flex', alignItems: 'center', gap: 3 }}>
                        <UserOutlined style={{ fontSize: 10 }} /> {memberCount}
                    </span>
                    {totalGames > 0 && (
                        <>
                            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.12)' }}>·</span>
                            {/* W/D/L mini */}
                            <span style={{ fontSize: 11, fontFamily: 'Outfit,sans-serif', color: 'var(--text-tertiary)' }}>
                                <span style={{ color: '#52c41a', fontWeight: 600 }}>{team.wins || 0}В</span>
                                {' '}
                                <span style={{ color: '#faad14', fontWeight: 600 }}>{team.draws || 0}Н</span>
                                {' '}
                                <span style={{ color: '#f04438', fontWeight: 600 }}>{team.losses || 0}П</span>
                            </span>
                        </>
                    )}
                </div>
            </div>

            {/* Stats */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, padding: '14px 16px 14px 0' }}>

                {/* Win rate bar */}
                {winRate !== null && (
                    <div style={{ width: 54, marginRight: 8 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, fontFamily: "'ClashDisplay-Variable','Clash Display',sans-serif", color: winColor, marginBottom: 3, textAlign: 'right' }}>
                            {winRate}%
                        </div>
                        <div style={{ height: 3, background: 'rgba(255,255,255,0.07)', borderRadius: 2, overflow: 'hidden' }}>
                            <div style={{
                                height: '100%',
                                width: `${winRate}%`,
                                borderRadius: 2,
                                background: winColor,
                                boxShadow: `0 0 6px ${winColor}80`,
                                transition: 'width 0.6s ease',
                            }} />
                        </div>
                    </div>
                )}

                {/* MMR pill */}
                <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    background: 'rgba(250,173,20,0.08)',
                    border: '1px solid rgba(250,173,20,0.2)',
                    borderRadius: 8,
                    padding: '5px 12px',
                    minWidth: 54,
                }}>
                    <div style={{
                        fontFamily: "'ClashDisplay-Variable','Clash Display',sans-serif",
                        fontWeight: 800, fontSize: 15,
                        color: '#faad14', lineHeight: 1,
                    }}>
                        {team.rating || 1000}
                    </div>
                    <div style={{ fontSize: 9, color: 'rgba(250,173,20,0.6)', fontFamily: 'Outfit,sans-serif', fontWeight: 600, marginTop: 2, letterSpacing: '0.5px' }}>
                        MMR
                    </div>
                </div>
            </div>
        </div>
    );
};

const TeamsDiscoveryPage = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const reduxUser = useSelector(state => state.auth?.user);
    const currentUser = reduxUser || (() => { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } })();

    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('rating');
    const [page, setPage] = useState(1);
    const pageSize = 20;

    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [form] = Form.useForm();

    const { data, isLoading, isFetching } = useGetTeamsQuery({
        page,
        limit: pageSize,
        sortBy,
        sortOrder: 'DESC',
    });

    const [createTeam, { isLoading: creating }] = useCreateTeamMutation();

    const allTeams = data?.teams || [];
    const total = data?.total || 0;

    const teams = useMemo(() => {
        if (!searchQuery.trim()) return allTeams;
        const q = searchQuery.toLowerCase();
        return allTeams.filter(t => t.name?.toLowerCase().includes(q));
    }, [allTeams, searchQuery]);

    const handlePageChange = (p) => {
        setPage(p);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCreateTeam = async () => {
        try {
            const values = await form.validateFields();
            await createTeam({ name: values.name, captainId: currentUser?.id }).unwrap();
            message.success(t('profile.teams.createSuccess'));
            form.resetFields();
            setCreateModalOpen(false);
        } catch (err) {
            if (err?.errorFields) return;
            message.error(t('profile.teams.createError'));
        }
    };

    const loading = isLoading || isFetching;

    return (
        <div style={{ minHeight: '100vh', padding: '28px 20px' }}>
            <style>{`
                @keyframes shimmer {
                    0%, 100% { opacity: 0.3; }
                    50% { opacity: 0.6; }
                }
            `}</style>

            <div style={{ maxWidth: 1200, margin: '0 auto' }} className="animate-fade-in">

                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, gap: 12 }}>
                    <div>
                        <h1 style={{
                            fontFamily: "'ClashDisplay-Variable', 'Clash Display', sans-serif",
                            fontSize: 30,
                            fontWeight: 800,
                            color: 'var(--text-primary)',
                            margin: '0 0 4px',
                            letterSpacing: '-0.5px',
                        }}>
                            {t('teams.discovery.title')}
                        </h1>
                        <p style={{ color: 'var(--text-tertiary)', margin: 0, fontSize: 14 }}>
                            {loading ? t('common.loading') : t('teams.discovery.totalTeams', { n: total })}
                        </p>
                    </div>
                    {currentUser && (
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() => setCreateModalOpen(true)}
                            style={{
                                background: 'var(--green)',
                                border: 'none',
                                color: '#000',
                                fontWeight: 600,
                                flexShrink: 0,
                            }}
                        >
                            {t('profile.teams.createTeam')}
                        </Button>
                    )}
                </div>

                {/* Search + Sort */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
                    <Input
                        prefix={<SearchOutlined style={{ color: 'var(--text-tertiary)' }} />}
                        placeholder={t('teams.discovery.subtitle')}
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        allowClear
                        size="large"
                        style={{ flex: 1, minWidth: 200 }}
                    />
                    <Select
                        value={sortBy}
                        onChange={v => { setSortBy(v); setPage(1); }}
                        size="large"
                        style={{ minWidth: 160 }}
                    >
                        <Option value="rating">{t('teams.discovery.sortByRating')}</Option>
                        <Option value="gamesPlayed">{t('teams.discovery.sortByGames')}</Option>
                        <Option value="wins">{t('teams.discovery.sortByWins')}</Option>
                        <Option value="name">{t('teams.discovery.sortByName')}</Option>
                    </Select>
                </div>

                {/* Content */}
                {loading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {Array.from({ length: 12 }).map((_, i) => (
                            <div key={i} style={{
                                height: 62,
                                borderRadius: 12,
                                background: 'var(--bg-card)',
                                animation: 'shimmer 1.5s ease-in-out infinite',
                                animationDelay: `${i * 0.05}s`,
                            }} />
                        ))}
                    </div>
                ) : teams.length === 0 ? (
                    <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={
                            <span style={{ color: 'var(--text-tertiary)' }}>
                                {t('teams.discovery.noTeams')}
                            </span>
                        }
                        style={{ padding: 60 }}
                    />
                ) : (
                    <>
                        <div style={{
                            marginBottom: 10,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                        }}>
                            <span style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>
                                {t('teams.discovery.found', { n: teams.length })}
                            </span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {teams.map((team, idx) => (
                                <TeamRow
                                    key={team.id}
                                    team={team}
                                    rank={(page - 1) * pageSize + idx + 1}
                                    navigate={navigate}
                                    t={t}
                                />
                            ))}
                        </div>

                        {total > pageSize && (
                            <div style={{ marginTop: 40, display: 'flex', justifyContent: 'center' }}>
                                <Pagination
                                    current={page}
                                    total={total}
                                    pageSize={pageSize}
                                    onChange={handlePageChange}
                                    showSizeChanger={false}
                                />
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Create team modal */}
            <Modal
                title={
                    <span style={{ fontFamily: "'ClashDisplay-Variable', 'Clash Display', sans-serif", fontWeight: 700 }}>
                        {t('profile.teams.createTitle')}
                    </span>
                }
                open={createModalOpen}
                onCancel={() => { setCreateModalOpen(false); form.resetFields(); }}
                onOk={handleCreateTeam}
                okText={t('profile.teams.createBtn2')}
                confirmLoading={creating}
                okButtonProps={{ style: { background: 'var(--green)', border: 'none', color: '#000', fontWeight: 600 } }}
            >
                <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
                    <Form.Item
                        name="name"
                        label={t('profile.teams.nameLabel')}
                        rules={[{ required: true, message: t('profile.teams.namePlaceholder') }]}
                    >
                        <Input
                            placeholder={t('profile.teams.nameExample')}
                            size="large"
                        />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default TeamsDiscoveryPage;
