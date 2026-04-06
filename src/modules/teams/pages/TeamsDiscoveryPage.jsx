import { useState, useMemo } from 'react';
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

const TeamRow = ({ team, rank, navigate, t }) => {
    const winRate = getWinRate(team.wins, team.losses, team.draws);
    const memberCount = team.playerIds?.length || 1;

    return (
        <div
            onClick={() => navigate(`/teams/${team.id}`)}
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
            onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
                e.currentTarget.style.background = 'var(--bg-raised)';
            }}
            onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--border-color)';
                e.currentTarget.style.background = 'var(--bg-card)';
            }}
        >
            {/* Rank */}
            <div style={{
                width: 28, textAlign: 'center', flexShrink: 0,
                fontFamily: "'ClashDisplay-Variable', 'Clash Display', sans-serif", fontWeight: 800, fontSize: 13,
                color: rank <= 3 ? '#faad14' : 'var(--text-tertiary)',
            }}>
                {rank <= 3 ? ['🥇', '🥈', '🥉'][rank - 1] : rank}
            </div>

            {/* Avatar */}
            <Avatar
                size={40}
                src={team.logo || team.flag}
                icon={<TeamOutlined />}
                style={{
                    border: '2px solid rgba(24,144,255,0.4)',
                    flexShrink: 0,
                    background: 'var(--bg-raised)',
                    color: '#1890ff',
                }}
            />

            {/* Name + members */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                    fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: 14,
                    color: 'var(--text-primary)', whiteSpace: 'nowrap',
                    overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                    {team.name}
                </div>
                <span style={{
                    fontSize: 11, color: 'var(--text-tertiary)',
                    fontFamily: 'Outfit, sans-serif',
                }}>
                    <UserOutlined style={{ marginRight: 3 }} />
                    {memberCount}
                </span>
            </div>

            {/* Stats */}
            <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexShrink: 0 }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        fontSize: 13, fontWeight: 700,
                        color: '#faad14', fontFamily: "'ClashDisplay-Variable', 'Clash Display', sans-serif",
                        display: 'flex', alignItems: 'center', gap: 3,
                    }}>
                        <TrophyOutlined style={{ fontSize: 11 }} />
                        {team.rating || 1000}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>MMR</div>
                </div>

                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', fontFamily: "'ClashDisplay-Variable', 'Clash Display', sans-serif" }}>
                        {team.gamesPlayed || 0}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>{t('teams.detail.statsGames')}</div>
                </div>

                {winRate !== null ? (
                    <div style={{ textAlign: 'center' }}>
                        <div style={{
                            fontSize: 13, fontWeight: 700, fontFamily: "'ClashDisplay-Variable', 'Clash Display', sans-serif",
                            color: winRate >= 50 ? '#52c41a' : winRate >= 33 ? '#faad14' : '#f04438',
                        }}>
                            {winRate}%
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>{t('teams.detail.statsWins')}</div>
                    </div>
                ) : (
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-tertiary)', fontFamily: "'ClashDisplay-Variable', 'Clash Display', sans-serif" }}>
                            —
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>{t('teams.detail.statsWins')}</div>
                    </div>
                )}
            </div>
        </div>
    );
};

const TeamsDiscoveryPage = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const currentUser = useSelector(state => state.auth?.user);

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
