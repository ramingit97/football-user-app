import React, { useState, useEffect } from 'react';
import { List, Button, Avatar, Tag, Space, message, Card, Empty, Spin, Badge, Divider } from 'antd';
import {
    TeamOutlined,
    CheckOutlined,
    CloseOutlined,
    CalendarOutlined,
    EnvironmentOutlined,
    UserOutlined,
    ClockCircleOutlined,
    HistoryOutlined,
    UsergroupAddOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { API_BASE } from '../../../config.js';

const TeamInvitations = ({ user }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [gameInvitations, setGameInvitations] = useState([]);
    const [teamInvitations, setTeamInvitations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [responding, setResponding] = useState(null);

    // Fetch both game and team invitations
    useEffect(() => {
        const fetchInvitations = async () => {
            if (!user?.id) return;

            try {
                // Fetch game invitations
                const gameResponse = await axios.get(`${API_BASE}/api/games/invitations/${user.id}`);
                setGameInvitations(gameResponse.data || []);
            } catch (error) {
                console.error('Failed to fetch game invitations:', error);
            }

            try {
                // Fetch team invitations
                const teamResponse = await axios.get(`${API_BASE}/api/teams/requests/my?userId=${user.id}`);
                setTeamInvitations((teamResponse.data || []).filter(r => r.status === 'invited'));
            } catch (error) {
                console.error('Failed to fetch team invitations:', error);
            }

            setLoading(false);
        };

        fetchInvitations();
    }, [user?.id]);

    // Game invitation handlers
    const handleAcceptGame = async (gameId) => {
        setResponding(gameId);
        try {
            // First accept the invite via API
            await axios.post(`${API_BASE}/api/games/${gameId}/accept-invite`, {
                playerId: user.id
            });

            message.success('Выберите свою позицию на поле!');
            setTimeout(() => {
                navigate(`/games/${gameId}?selectPosition=true`);
            }, 500);
        } catch (error) {
            console.error('Accept invite error:', error);
            message.error(error.response?.data?.message || t('profile.invitations.teamAcceptError'));
        } finally {
            setResponding(null);
        }
    };

    const handleDeclineGame = async (gameId) => {
        setResponding(gameId);
        // TODO: Implement reject invite endpoint if needed
        setGameInvitations(prev => prev.filter(inv => inv.gameId !== gameId));
        message.info(t('profile.invitations.teamRejected'));
        setResponding(null);
    };

    // Team invitation handlers
    const handleAcceptTeam = async (requestId, teamId) => {
        setResponding(requestId);
        try {
            await axios.post(`${API_BASE}/api/teams/requests/${requestId}/respond`, {
                status: 'approved'
            });
            message.success(t('profile.invitations.joinedTeam'));
            setTeamInvitations(prev => prev.filter(inv => inv.id !== requestId));
            setTimeout(() => navigate(`/teams/${teamId}`), 1000);
        } catch (error) {
            message.error(t('profile.invitations.teamAcceptError'));
        } finally {
            setResponding(null);
        }
    };

    const handleDeclineTeam = async (requestId) => {
        setResponding(requestId);
        try {
            await axios.post(`${API_BASE}/api/teams/requests/${requestId}/respond`, {
                status: 'rejected'
            });
            setTeamInvitations(prev => prev.filter(inv => inv.id !== requestId));
            message.info(t('profile.invitations.teamRejected'));
        } catch (error) {
            message.error(t('profile.invitations.teamRejectError'));
        } finally {
            setResponding(null);
        }
    };

    if (loading) {
        return (
            <Card className="glass-card" style={{ textAlign: 'center', padding: 40 }}>
                <Spin size="large" />
            </Card>
        );
    }

    const pendingGameInvites = gameInvitations.filter(inv => inv.inviteStatus === 'pending');
    const totalPending = pendingGameInvites.length + teamInvitations.length;

    if (gameInvitations.length === 0 && teamInvitations.length === 0) {
        return (
            <Card className="glass-card">
                <Empty
                    description={t('profile.invitations.noInvitations')}
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
            </Card>
        );
    }

    return (
        <div>
            {/* Team Invitations */}
            {teamInvitations.length > 0 && (
                <Card
                    className="glass-card"
                    title={
                        <span>
                            <Badge count={teamInvitations.length} offset={[10, 0]}>
                                <UsergroupAddOutlined style={{ marginRight: 8 }} />
                                {t('profile.invitations.teamTitle')}
                            </Badge>
                        </span>
                    }
                    style={{ marginBottom: 16 }}
                >
                    <List
                        itemLayout="horizontal"
                        dataSource={teamInvitations}
                        renderItem={(item) => (
                            <List.Item
                                style={{
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    borderRadius: 12,
                                    padding: 16,
                                    marginBottom: 12
                                }}
                                actions={[
                                    <Button
                                        key="accept"
                                        type="primary"
                                        icon={<CheckOutlined />}
                                        onClick={() => handleAcceptTeam(item.id, item.teamId)}
                                        loading={responding === item.id}
                                        style={{
                                            background: 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)',
                                            border: 'none'
                                        }}
                                    >
                                        {t('profile.invitations.accept')}
                                    </Button>,
                                    <Button
                                        key="decline"
                                        danger
                                        ghost
                                        icon={<CloseOutlined />}
                                        onClick={() => handleDeclineTeam(item.id)}
                                        loading={responding === item.id}
                                    >
                                        {t('profile.invitations.reject')}
                                    </Button>
                                ]}
                            >
                                <List.Item.Meta
                                    avatar={
                                        <Avatar
                                            icon={<TeamOutlined />}
                                            src={item.team?.flag || item.team?.logo}
                                            style={{ backgroundColor: '#1890ff' }}
                                        />
                                    }
                                    title={
                                        <span style={{ fontSize: 16, fontWeight: 600 }}>
                                            {item.team?.name || t('common.team')}
                                        </span>
                                    }
                                    description={
                                        <Space>
                                            <Tag color="gold">{item.team?.rating || 1000} MMR</Tag>
                                            <span>{t('profile.invitations.invitationTitle')}</span>
                                        </Space>
                                    }
                                />
                            </List.Item>
                        )}
                    />
                </Card>
            )}

            {/* Game Invitations */}
            {pendingGameInvites.length > 0 && (
                <Card
                    className="glass-card"
                    title={
                        <span>
                            <Badge count={pendingGameInvites.length} offset={[10, 0]}>
                                <TeamOutlined style={{ marginRight: 8 }} />
                                {t('profile.invitations.gameTitle')}
                            </Badge>
                        </span>
                    }
                    style={{ marginBottom: 16 }}
                >
                    <List
                        itemLayout="vertical"
                        dataSource={pendingGameInvites}
                        renderItem={(item) => (
                            <List.Item
                                style={{
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    borderRadius: 12,
                                    padding: 16,
                                    marginBottom: 12
                                }}
                                actions={[
                                    <Button
                                        key="accept"
                                        type="primary"
                                        icon={<CheckOutlined />}
                                        onClick={() => handleAcceptGame(item.gameId)}
                                        loading={responding === item.gameId}
                                        style={{
                                            background: 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)',
                                            border: 'none'
                                        }}
                                    >
                                        {t('profile.invitations.accept')}
                                    </Button>,
                                    <Button
                                        key="decline"
                                        danger
                                        ghost
                                        icon={<CloseOutlined />}
                                        onClick={() => handleDeclineGame(item.gameId)}
                                        loading={responding === item.gameId}
                                    >
                                        {t('profile.invitations.reject')}
                                    </Button>
                                ]}
                            >
                                <List.Item.Meta
                                    avatar={
                                        <Avatar
                                            icon={<TeamOutlined />}
                                            style={{ backgroundColor: '#1890ff', width: 48, height: 48 }}
                                        />
                                    }
                                    title={
                                        <Space>
                                            <span style={{ fontSize: 16, fontWeight: 600 }}>{item.gameName}</span>
                                            {item.inviteType === 'urgent' && (
                                                <Tag color="orange" style={{ fontSize: 11 }}>🔥 Срочное</Tag>
                                            )}
                                            {item.inviteType === 'smart' && (
                                                <Tag color="purple" style={{ fontSize: 11 }}>⚡ Smart Invite</Tag>
                                            )}
                                        </Space>
                                    }
                                    description={
                                        <Space direction="vertical" size={4}>
                                            <span>
                                                <CalendarOutlined style={{ marginRight: 8 }} />
                                                {new Date(item.date).toLocaleDateString('ru-RU', {
                                                    weekday: 'long', day: 'numeric', month: 'long'
                                                })}
                                            </span>
                                            <span><ClockCircleOutlined style={{ marginRight: 8 }} />{item.time}</span>
                                            <span><EnvironmentOutlined style={{ marginRight: 8 }} />{item.location}</span>
                                            <span><UserOutlined style={{ marginRight: 8 }} />{t('profile.invitations.organizer')} {item.organizerName}</span>
                                            <span><TeamOutlined style={{ marginRight: 8 }} />{t('profile.invitations.players')} {item.playersCount}/{item.maxPlayers}</span>
                                        </Space>
                                    }
                                />
                            </List.Item>
                        )}
                    />
                </Card>
            )}
        </div>
    );
};

export default TeamInvitations;
