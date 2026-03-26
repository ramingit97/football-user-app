import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { Button, Avatar, Tag, Spin, message, Modal, Select, Tabs, Upload } from 'antd';
import {
    UserOutlined, TeamOutlined, TrophyOutlined, ArrowLeftOutlined,
    CheckCircleOutlined, PlusOutlined, CameraOutlined, BarChartOutlined,
    UsergroupAddOutlined, SendOutlined, CrownFilled, CalendarOutlined,
    EnvironmentOutlined, ClockCircleOutlined
} from '@ant-design/icons';
import {
    useGetTeamByIdQuery, useRequestJoinMutation, useLeaveTeamMutation,
    useTransferCaptainMutation, useCreateChallengeMutation,
    useGetChallengesByTeamQuery, useRespondToChallengeMutation,
    useUpdateFlagMutation, useGetMyTeamsQuery
} from '../../../store/teamsApi';
import ChallengeModal from '../components/ChallengeModal';
import { useLazySearchUsersQuery, useGetProfileQuery, useLazyGetUserByIdQuery } from '../../../store/authApi';
import { useInvitePlayerMutation } from '../../../store/gamesApi';
import TeamRequests from '../components/TeamRequests';
import TeamFormationEditor from '../components/TeamFormationEditor';
import TeamGames from '../components/TeamGames';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { API_BASE } from '../../../config.js';

const POSITION_CONFIG = {
    goalkeeper: { label: 'GK', color: '#f59e0b' },
    defender:   { label: 'DEF', color: '#4f86f7' },
    midfielder: { label: 'MID', color: '#a855f7' },
    forward:    { label: 'FWD', color: '#f04438' },
    any:        { label: 'ANY', color: '#00e87a' },
};
const getPos = (pos) => POSITION_CONFIG[pos] || POSITION_CONFIG.any;

/* ─── Stat pill ────────────────────────────────────────────────── */
const StatPill = ({ label, value, color }) => (
    <div style={{ textAlign: 'center' }}>
        <div style={{
            fontSize: 22, fontWeight: 800, fontFamily: 'Syne, sans-serif',
            color: color || 'var(--text-primary)', lineHeight: 1.1,
        }}>
            {value}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>{label}</div>
    </div>
);

/* ─── Player roster row ─────────────────────────────────────────── */
const RosterRow = ({ player, isCaptain, isCurrentUser, captainId, onTransfer, isTransferring, navigate }) => {
    const pos = getPos(player.position);
    const isCap = player.id === captainId;

    return (
        <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '10px 14px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 12,
            transition: 'border-color 0.15s',
        }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
        >
            {isCap && (
                <CrownFilled style={{ color: '#faad14', fontSize: 14, flexShrink: 0 }} />
            )}

            <Avatar
                size={38}
                src={player.avatar || player.avatarUrl}
                icon={<UserOutlined />}
                style={{
                    border: `2px solid ${pos.color}50`,
                    background: 'var(--bg-raised)',
                    color: pos.color,
                    flexShrink: 0,
                    cursor: 'pointer',
                }}
                onClick={() => navigate(`/player/${player.id}`)}
            >
                {!player.avatar && !player.avatarUrl && player.name?.charAt(0)?.toUpperCase()}
            </Avatar>

            <div style={{ flex: 1, minWidth: 0 }}>
                <div
                    style={{
                        fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: 14,
                        color: 'var(--text-primary)', cursor: 'pointer',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}
                    onClick={() => navigate(`/player/${player.id}`)}
                >
                    {player.name || player.email || `ID: ${player.id?.substring(0, 8)}`}
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 2 }}>
                    {player.position && (
                        <span style={{
                            fontSize: 10, fontWeight: 700, color: pos.color,
                            fontFamily: 'Outfit, sans-serif', letterSpacing: '0.3px',
                        }}>
                            {pos.label}
                        </span>
                    )}
                    {isCap && (
                        <span style={{ fontSize: 10, color: '#faad14', fontWeight: 600 }}>
                            Капитан
                        </span>
                    )}
                </div>
            </div>

            <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexShrink: 0 }}>
                {player.gamesPlayed > 0 && (
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'Syne, sans-serif' }}>
                            {player.gamesPlayed}
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>игр</div>
                    </div>
                )}
                {player.averageRating > 0 && (
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#faad14', fontFamily: 'Syne, sans-serif' }}>
                            {player.averageRating.toFixed(1)}
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>★</div>
                    </div>
                )}
            </div>

            {isCaptain && !isCap && (
                <Button
                    type="text"
                    size="small"
                    onClick={() => onTransfer(player.id)}
                    loading={isTransferring}
                    style={{ color: 'var(--text-tertiary)', fontSize: 12, flexShrink: 0 }}
                >
                    Назначить
                </Button>
            )}
        </div>
    );
};

/* ─── Challenge card ────────────────────────────────────────────── */
const ChallengeCard = ({ item, isIncoming, isCaptain, onRespond }) => (
    <div style={{
        padding: '14px 16px',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 12,
        marginBottom: 8,
        display: 'flex', alignItems: 'center', gap: 12,
    }}>
        <div style={{
            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
            background: isIncoming ? 'rgba(250,173,20,0.12)' : 'rgba(24,144,255,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
            <TrophyOutlined style={{ color: isIncoming ? '#faad14' : '#1890ff', fontSize: 16 }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)', marginBottom: 4 }}>
                {isIncoming ? `Вызов от: ${item.challengerName}` : `Вызов команде: ${item.challengedName}`}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-tertiary)', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <span><CalendarOutlined style={{ marginRight: 4 }} />{dayjs(item.date).format('DD.MM.YYYY')}</span>
                <span><ClockCircleOutlined style={{ marginRight: 4 }} />{item.time}</span>
                <span><EnvironmentOutlined style={{ marginRight: 4 }} />{item.location}</span>
            </div>
        </div>
        {isIncoming && isCaptain && item.status === 'pending' ? (
            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <Button
                    size="small" type="primary"
                    style={{ background: 'var(--green)', border: 'none', color: '#000', fontWeight: 600, fontSize: 12 }}
                    onClick={() => onRespond(item.id, 'accepted')}
                >
                    Принять
                </Button>
                <Button size="small" danger ghost style={{ fontSize: 12 }} onClick={() => onRespond(item.id, 'rejected')}>
                    Отклонить
                </Button>
            </div>
        ) : (
            <span style={{
                fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 6,
                background: item.status === 'accepted' ? 'rgba(82,196,26,0.12)' : item.status === 'rejected' ? 'rgba(255,77,79,0.12)' : 'rgba(250,173,20,0.12)',
                color: item.status === 'accepted' ? '#52c41a' : item.status === 'rejected' ? '#ff4d4f' : '#faad14',
                flexShrink: 0,
            }}>
                {item.status === 'accepted' ? 'Принят' : item.status === 'rejected' ? 'Отклонён' : 'Ожидает'}
            </span>
        )}
    </div>
);

/* ═══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════ */
const TeamDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { data: team, isLoading, refetch } = useGetTeamByIdQuery(id);
    const { data: profile } = useGetProfileQuery();
    const { data: myTeams } = useGetMyTeamsQuery(profile?.id, { skip: !profile?.id });
    const [requestJoin, { isLoading: isRequesting }] = useRequestJoinMutation();
    const [invitePlayer, { isLoading: isInviting }] = useInvitePlayerMutation();
    const [transferCaptain, { isLoading: isTransferring }] = useTransferCaptainMutation();
    const [createChallenge, { isLoading: isCreatingChallenge }] = useCreateChallengeMutation();
    const [respondToChallenge] = useRespondToChallengeMutation();
    const [updateFlag] = useUpdateFlagMutation();
    const [searchUsers, { data: searchData, isFetching: isSearching }] = useLazySearchUsersQuery();
    const [getUserById] = useLazyGetUserByIdQuery();
    const { data: challenges, refetch: refetchChallenges } = useGetChallengesByTeamQuery(id, { skip: !id });

    const [isInviteModalVisible, setIsInviteModalVisible] = useState(false);
    const [isChallengeModalVisible, setIsChallengeModalVisible] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [options, setOptions] = useState([]);
    const [selectedTab, setSelectedTab] = useState('info');
    const [flagPreview, setFlagPreview] = useState(null);
    const [flagFile, setFlagFile] = useState(null);
    const [isFlagModalVisible, setIsFlagModalVisible] = useState(false);
    const [isUploadingFlag, setIsUploadingFlag] = useState(false);
    const [players, setPlayers] = useState([]);
    const [selectedChallengerTeam, setSelectedChallengerTeam] = useState(null);

    const currentUser = JSON.parse(localStorage.getItem('user'));
    const isCaptain = currentUser && team && team.captainId === currentUser.id;
    const isMember = currentUser && team && team.playerIds?.includes(currentUser.id);
    const myTeamsAsCaptain = myTeams?.filter(t => t.captainId === currentUser?.id && t.id !== id) || [];
    const canChallenge = currentUser && !isMember && !isCaptain && myTeamsAsCaptain.length > 0;

    useEffect(() => {
        const fetchPlayers = async () => {
            if (team?.playerIds?.length > 0) {
                const results = await Promise.all(
                    team.playerIds.map(pid =>
                        getUserById(pid).unwrap().catch(() => ({ id: pid, name: `Player ${pid.substring(0, 8)}` }))
                    )
                );
                setPlayers(results);
            }
        };
        fetchPlayers();
    }, [team?.playerIds, getUserById]);

    const handleSearch = useMemo(() => {
        let timeout;
        return (value) => {
            if (timeout) clearTimeout(timeout);
            timeout = setTimeout(() => searchUsers({ query: value, page: 1, limit: 10 }), 500);
        };
    }, [searchUsers]);

    useEffect(() => {
        if (searchData?.users) {
            setOptions(searchData.users.map(u => ({ label: u.name || u.email, value: u.id, user: u })));
        }
    }, [searchData]);

    const handleInvite = async () => {
        if (!selectedUserId) return;
        try {
            await invitePlayer({ teamId: team.id, userId: selectedUserId }).unwrap();
            message.success(t('teams.detail.inviteSent'));
            setIsInviteModalVisible(false);
            setSelectedUserId(null);
        } catch (error) {
            message.error(error.data?.message || t('teams.detail.inviteError'));
        }
    };

    const handleSendChallenge = async (values) => {
        try {
            const challengerTeam = selectedChallengerTeam || myTeamsAsCaptain[0];
            if (!challengerTeam) { message.error(t('teams.detail.selectChallengeTeam')); return; }
            await createChallenge({
                ...values,
                challengerTeamId: challengerTeam.id,
                challengedTeamId: team.id,
                challengerName: challengerTeam.name,
                challengedName: team.name,
            }).unwrap();
            message.success(t('teams.detail.challengeSent'));
            setIsChallengeModalVisible(false);
        } catch { message.error(t('teams.detail.challengeError')); }
    };

    const handleRespondChallenge = async (challengeId, status) => {
        try {
            await respondToChallenge({ id: challengeId, status }).unwrap();
            message.success(status === 'accepted' ? t('teams.detail.challengeAccepted') : t('teams.detail.challengeRejected'));
            refetchChallenges();
        } catch { message.error(t('teams.detail.challengeStatusError')); }
    };

    const [leaveTeam, { isLoading: isLeaving }] = useLeaveTeamMutation();

    const handleRequestJoin = async () => {
        try {
            await requestJoin({ teamId: team.id, userId: currentUser.id }).unwrap();
            message.success(t('teams.detail.joinRequestSent'));
            refetch();
        } catch (error) {
            message.error(error.data?.message || t('teams.detail.joinRequestError'));
        }
    };

    const handleLeaveTeam = () => {
        Modal.confirm({
            title: t('teams.detail.leaveTitle'),
            content: t('teams.detail.leaveConfirm'),
            okText: t('teams.detail.leaveOk'),
            cancelText: t('teams.detail.leaveCancel'),
            onOk: async () => {
                try {
                    await leaveTeam({ teamId: team.id, userId: currentUser.id }).unwrap();
                    message.success(t('teams.detail.leaveSuccess'));
                    navigate('/teams');
                } catch (error) {
                    message.error(error.data?.message || t('teams.detail.leaveError'));
                }
            }
        });
    };

    const handleTransferCaptain = (newCaptainId) => {
        Modal.confirm({
            title: t('teams.detail.transferTitle'),
            content: t('teams.detail.transferConfirm'),
            onOk: async () => {
                try {
                    await transferCaptain({ id: team.id, newCaptainId, currentUserId: currentUser.id }).unwrap();
                    message.success(t('teams.detail.captainTransferred'));
                    refetch();
                } catch (error) {
                    message.error(error.data?.message || t('teams.detail.captainTransferError'));
                }
            }
        });
    };

    const handleFlagSelect = (info) => {
        const file = info.file.originFileObj || info.file;
        setFlagFile(file);
        const reader = new FileReader();
        reader.onload = (e) => setFlagPreview(e.target.result);
        reader.readAsDataURL(file);
        setIsFlagModalVisible(true);
    };

    const handleFlagUpload = async () => {
        if (!flagFile) return;
        setIsUploadingFlag(true);
        try {
            const formData = new FormData();
            formData.append('file', flagFile);
            const response = await axios.post(`${API_BASE}/api/files/team/${team.id}`, formData);
            await updateFlag({ teamId: team.id, flagUrl: response.data.url, currentUserId: currentUser.id }).unwrap();
            message.success(t('teams.detail.flagUpdated'));
            setIsFlagModalVisible(false);
            setFlagFile(null);
            setFlagPreview(null);
            refetch();
        } catch { message.error(t('teams.detail.flagError')); }
        finally { setIsUploadingFlag(false); }
    };

    const winRate = team && (team.gamesPlayed || 0) > 0
        ? Math.round(((team.wins || 0) / team.gamesPlayed) * 100) : 0;

    if (isLoading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Spin size="large" />
            </div>
        );
    }
    if (!team) return null;

    const incomingChallenges = challenges?.filter(c => c.challengedTeamId === id) || [];
    const outgoingChallenges = challenges?.filter(c => c.challengerTeamId === id) || [];
    const hasChallenges = (isCaptain || isMember) && challenges?.length > 0;

    /* ─── Tab: Информация ─────────────────────────────────────────── */
    const infoTab = (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Challenges */}
            {hasChallenges && (
                <div>
                    {incomingChallenges.length > 0 && (
                        <div style={{ marginBottom: 12 }}>
                            <div style={{
                                fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)',
                                textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8,
                                display: 'flex', alignItems: 'center', gap: 6,
                            }}>
                                <TrophyOutlined style={{ color: '#faad14' }} />
                                Входящие вызовы ({incomingChallenges.length})
                            </div>
                            {incomingChallenges.map(c => (
                                <ChallengeCard key={c.id} item={c} isIncoming isCaptain={isCaptain} onRespond={handleRespondChallenge} />
                            ))}
                        </div>
                    )}
                    {outgoingChallenges.length > 0 && (
                        <div style={{ marginBottom: 12 }}>
                            <div style={{
                                fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)',
                                textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8,
                                display: 'flex', alignItems: 'center', gap: 6,
                            }}>
                                <SendOutlined style={{ color: '#1890ff' }} />
                                Отправленные вызовы ({outgoingChallenges.length})
                            </div>
                            {outgoingChallenges.map(c => (
                                <ChallengeCard key={c.id} item={c} isIncoming={false} isCaptain={isCaptain} onRespond={handleRespondChallenge} />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {isCaptain && <TeamRequests teamId={team.id} />}

            {/* Roster */}
            <div>
                <div style={{
                    fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)',
                    textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10,
                }}>
                    Состав · {players.length} {players.length === 1 ? 'игрок' : 'игроков'}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {players.map(player => (
                        <RosterRow
                            key={player.id}
                            player={player}
                            isCaptain={isCaptain}
                            isCurrentUser={player.id === currentUser?.id}
                            captainId={team.captainId}
                            onTransfer={handleTransferCaptain}
                            isTransferring={isTransferring}
                            navigate={navigate}
                        />
                    ))}
                </div>
            </div>
        </div>
    );

    /* ─── Tab: Статистика ─────────────────────────────────────────── */
    const statsTab = (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* MMR hero */}
            <div style={{
                padding: '24px 28px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 20,
            }}>
                <div style={{
                    width: 52, height: 52, borderRadius: 14,
                    background: 'rgba(250,173,20,0.12)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                    <TrophyOutlined style={{ fontSize: 24, color: '#faad14' }} />
                </div>
                <div>
                    <div style={{
                        fontFamily: 'Syne, sans-serif', fontSize: 36, fontWeight: 800,
                        color: '#faad14', lineHeight: 1,
                    }}>
                        {(team.rating || 1000).toLocaleString()}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>
                        MMR — командный рейтинг
                    </div>
                </div>
            </div>

            {/* W / D / L */}
            <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10,
            }}>
                {[
                    { label: 'Победы', value: team.wins || 0, color: '#52c41a', bg: 'rgba(82,196,26,0.08)', border: 'rgba(82,196,26,0.2)' },
                    { label: 'Ничьи', value: team.draws || 0, color: '#faad14', bg: 'rgba(250,173,20,0.08)', border: 'rgba(250,173,20,0.2)' },
                    { label: 'Поражения', value: team.losses || 0, color: '#ff4d4f', bg: 'rgba(255,77,79,0.08)', border: 'rgba(255,77,79,0.2)' },
                ].map(s => (
                    <div key={s.label} style={{
                        padding: '20px 16px',
                        background: s.bg,
                        border: `1px solid ${s.border}`,
                        borderRadius: 14,
                        textAlign: 'center',
                    }}>
                        <div style={{
                            fontFamily: 'Syne, sans-serif', fontSize: 32, fontWeight: 800,
                            color: s.color, lineHeight: 1,
                        }}>
                            {s.value}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 6 }}>{s.label}</div>
                    </div>
                ))}
            </div>

            {/* Games + win rate */}
            <div style={{
                padding: '20px 24px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: 16,
            }}>
                <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16,
                }}>
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                        Всего игр:&nbsp;
                        <strong style={{ color: 'var(--text-primary)', fontFamily: 'Syne, sans-serif' }}>
                            {team.gamesPlayed || 0}
                        </strong>
                    </span>
                    <span style={{
                        fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 800,
                        color: winRate >= 50 ? '#52c41a' : winRate >= 33 ? '#faad14' : 'var(--text-secondary)',
                    }}>
                        {winRate}%
                    </span>
                </div>

                {/* Visual bar */}
                {(team.gamesPlayed || 0) > 0 ? (
                    <div style={{
                        height: 8, borderRadius: 4,
                        background: 'var(--bg-raised)',
                        overflow: 'hidden',
                        display: 'flex',
                    }}>
                        {team.wins > 0 && (
                            <div style={{
                                width: `${(team.wins / team.gamesPlayed) * 100}%`,
                                background: '#52c41a', transition: 'width 0.6s',
                            }} />
                        )}
                        {team.draws > 0 && (
                            <div style={{
                                width: `${(team.draws / team.gamesPlayed) * 100}%`,
                                background: '#faad14', transition: 'width 0.6s',
                            }} />
                        )}
                        {team.losses > 0 && (
                            <div style={{
                                width: `${(team.losses / team.gamesPlayed) * 100}%`,
                                background: '#ff4d4f', transition: 'width 0.6s',
                            }} />
                        )}
                    </div>
                ) : (
                    <div style={{ height: 8, borderRadius: 4, background: 'var(--bg-raised)' }} />
                )}
                <div style={{ display: 'flex', gap: 16, marginTop: 10 }}>
                    {[
                        { color: '#52c41a', label: 'Победы' },
                        { color: '#faad14', label: 'Ничьи' },
                        { color: '#ff4d4f', label: 'Поражения' },
                    ].map(l => (
                        <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text-tertiary)' }}>
                            <div style={{ width: 8, height: 8, borderRadius: 2, background: l.color, flexShrink: 0 }} />
                            {l.label}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    const tabItems = [
        {
            key: 'info',
            label: <span><UsergroupAddOutlined /> {t('teams.detail.tabInfo')}</span>,
            children: infoTab,
        },
        {
            key: 'formation',
            label: <span><TeamOutlined /> {t('teams.detail.tabFormation')}</span>,
            children: (
                <TeamFormationEditor
                    team={team}
                    players={players}
                    isCaptain={isCaptain}
                    onRefetch={refetch}
                />
            ),
        },
        {
            key: 'stats',
            label: <span><BarChartOutlined /> {t('teams.detail.tabStats')}</span>,
            children: statsTab,
        },
        {
            key: 'games',
            label: <span><TrophyOutlined /> {t('teams.detail.tabGames')}</span>,
            children: <TeamGames teamId={team.id} />,
        },
    ];

    return (
        <div style={{ minHeight: '100vh', padding: '24px 16px' }}>
            <style>{`
                @keyframes fadeUp {
                    from { opacity: 0; transform: translateY(12px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
            <div style={{ maxWidth: 900, margin: '0 auto', animation: 'fadeUp 0.3s ease' }}>

                {/* Back */}
                <button
                    onClick={() => navigate(-1)}
                    style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'var(--text-tertiary)', fontSize: 13, padding: '0 0 20px',
                        display: 'flex', alignItems: 'center', gap: 6,
                        fontFamily: 'Outfit, sans-serif',
                    }}
                >
                    <ArrowLeftOutlined /> {t('teams.detail.back')}
                </button>

                {/* ── Hero ────────────────────────────────────────────── */}
                <div style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 20,
                    padding: '28px 28px',
                    marginBottom: 24,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 24,
                    flexWrap: 'wrap',
                    position: 'relative',
                    overflow: 'hidden',
                }}>
                    {/* Faint green glow top-right */}
                    <div style={{
                        position: 'absolute', top: -60, right: -60,
                        width: 200, height: 200, borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(0,232,122,0.06) 0%, transparent 70%)',
                        pointerEvents: 'none',
                    }} />

                    {/* Avatar */}
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                        <Avatar
                            size={96}
                            icon={<TeamOutlined />}
                            src={team.flag || team.logo}
                            style={{
                                border: '3px solid rgba(0,232,122,0.25)',
                                background: 'var(--bg-raised)',
                                fontSize: 36,
                                color: 'var(--green)',
                            }}
                        />
                        {isCaptain && (
                            <Upload
                                showUploadList={false}
                                beforeUpload={() => false}
                                onChange={handleFlagSelect}
                                accept="image/*"
                            >
                                <button style={{
                                    position: 'absolute', bottom: 2, right: 2,
                                    width: 26, height: 26, borderRadius: '50%',
                                    background: 'var(--green)', border: 'none',
                                    cursor: 'pointer', display: 'flex',
                                    alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <CameraOutlined style={{ fontSize: 12, color: '#000' }} />
                                </button>
                            </Upload>
                        )}
                    </div>

                    {/* Name + stats */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <h1 style={{
                            fontFamily: 'Syne, sans-serif', fontSize: 28, fontWeight: 800,
                            color: 'var(--text-primary)', margin: '0 0 14px',
                            letterSpacing: '-0.5px',
                        }}>
                            {team.name}
                        </h1>
                        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center' }}>
                            <StatPill label="MMR" value={team.rating || 1000} color="#faad14" />
                            <div style={{ width: 1, height: 28, background: 'var(--border-color)' }} />
                            <StatPill label="игроков" value={team.playerIds?.length || 0} />
                            <div style={{ width: 1, height: 28, background: 'var(--border-color)' }} />
                            <StatPill label="игр" value={team.gamesPlayed || 0} />
                            <div style={{ width: 1, height: 28, background: 'var(--border-color)' }} />
                            <StatPill
                                label="побед"
                                value={`${winRate}%`}
                                color={winRate >= 50 ? '#52c41a' : winRate > 0 ? '#faad14' : 'var(--text-tertiary)'}
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', flexShrink: 0 }}>
                        {isMember && (
                            <span style={{
                                fontSize: 12, fontWeight: 600, padding: '5px 12px', borderRadius: 8,
                                background: 'rgba(0,232,122,0.1)', color: 'var(--green)',
                                border: '1px solid rgba(0,232,122,0.2)',
                            }}>
                                {t('teams.detail.isParticipant')}
                            </span>
                        )}
                        {!isMember && !isCaptain && (
                            <Button
                                icon={<CheckCircleOutlined />}
                                loading={isRequesting}
                                onClick={handleRequestJoin}
                                style={{
                                    background: 'var(--bg-raised)',
                                    border: '1px solid var(--border-color)',
                                    color: 'var(--text-primary)',
                                    fontWeight: 600,
                                }}
                            >
                                {t('teams.detail.join')}
                            </Button>
                        )}
                        {isCaptain && (
                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={() => setIsInviteModalVisible(true)}
                                style={{
                                    background: 'var(--green)', border: 'none',
                                    color: '#000', fontWeight: 700,
                                }}
                            >
                                {t('teams.detail.invite')}
                            </Button>
                        )}
                        {isMember && !isCaptain && (
                            <Button
                                danger ghost
                                loading={isLeaving}
                                onClick={handleLeaveTeam}
                                style={{ fontWeight: 600 }}
                            >
                                {t('teams.detail.leave')}
                            </Button>
                        )}
                        {canChallenge && (
                            <Button
                                icon={<TrophyOutlined />}
                                onClick={() => setIsChallengeModalVisible(true)}
                                style={{
                                    background: 'rgba(250,173,20,0.1)',
                                    border: '1px solid rgba(250,173,20,0.3)',
                                    color: '#faad14',
                                    fontWeight: 600,
                                }}
                            >
                                {t('teams.detail.challenge')}
                            </Button>
                        )}
                    </div>
                </div>

                {/* Tabs */}
                <Tabs
                    activeKey={selectedTab}
                    onChange={setSelectedTab}
                    items={tabItems}
                    className="glass-tabs"
                />

                {/* Invite modal */}
                <Modal
                    title={t('teams.detail.invitePlayer')}
                    open={isInviteModalVisible}
                    onOk={handleInvite}
                    onCancel={() => setIsInviteModalVisible(false)}
                    confirmLoading={isInviting}
                    okText={t('teams.detail.inviteBtn')}
                    cancelText={t('teams.detail.cancelBtn')}
                    okButtonProps={{ style: { background: 'var(--green)', border: 'none', color: '#000', fontWeight: 600 } }}
                >
                    <Select
                        showSearch
                        placeholder={t('teams.detail.searchPlayerPlaceholder')}
                        style={{ width: '100%', marginTop: 8 }}
                        defaultActiveFirstOption={false}
                        filterOption={false}
                        onSearch={handleSearch}
                        onChange={setSelectedUserId}
                        notFoundContent={isSearching ? <Spin size="small" /> : null}
                        options={options}
                        size="large"
                    />
                </Modal>

                <ChallengeModal
                    visible={isChallengeModalVisible}
                    onCancel={() => setIsChallengeModalVisible(false)}
                    onSend={handleSendChallenge}
                    confirmLoading={isCreatingChallenge}
                    challengedTeamName={team.name}
                    challengerTeams={myTeamsAsCaptain}
                    selectedTeam={selectedChallengerTeam}
                    onTeamSelect={setSelectedChallengerTeam}
                />

                <Modal
                    title={t('teams.detail.uploadFlag')}
                    open={isFlagModalVisible}
                    onOk={handleFlagUpload}
                    onCancel={() => { setIsFlagModalVisible(false); setFlagPreview(null); setFlagFile(null); }}
                    confirmLoading={isUploadingFlag}
                    okText={t('teams.detail.saveFlag')}
                    cancelText={t('teams.detail.cancelFlag')}
                    okButtonProps={{ style: { background: 'var(--green)', border: 'none', color: '#000', fontWeight: 600 } }}
                >
                    {flagPreview && (
                        <div style={{ textAlign: 'center', padding: '16px 0' }}>
                            <Avatar size={120} src={flagPreview} icon={<TeamOutlined />} style={{ border: '3px solid rgba(0,232,122,0.3)' }} />
                            <div style={{ marginTop: 12, color: 'var(--text-tertiary)', fontSize: 13 }}>
                                {t('teams.detail.flagPreview')}
                            </div>
                        </div>
                    )}
                </Modal>
            </div>
        </div>
    );
};

export default TeamDetailPage;
