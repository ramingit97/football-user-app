import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Spin, Avatar, Tag, Button, Statistic, Row, Col, Typography, Rate, Divider, Modal, Select, Input } from 'antd';
import {
    ArrowLeftOutlined,
    UserOutlined,
    TrophyOutlined,
    TeamOutlined,
    UserAddOutlined,
    CheckOutlined,
    WarningOutlined
} from '@ant-design/icons';
import axios from 'axios';
import { message } from 'antd';
import { useTranslation } from 'react-i18next';
import { API_BASE } from '../../../config.js';
import GameHistory from '../components/GameHistory';
import { useGetProfileQuery, useGetFriendshipStatusQuery, useSendFriendRequestMutation, useRemoveFriendMutation } from '../../../store/authApi';

const { Title, Text } = Typography;

const PublicProfilePage = () => {
    const { t } = useTranslation();
    const { id } = useParams();
    const navigate = useNavigate();
    const [player, setPlayer] = useState(null);
    const [playerGames, setPlayerGames] = useState([]);
    const [loading, setLoading] = useState(true);

    const { data: currentUser } = useGetProfileQuery();
    const { data: friendshipStatus, refetch: refetchFriendship } = useGetFriendshipStatusQuery(
        { userId: currentUser?.id, targetId: id },
        { skip: !currentUser?.id || !id }
    );
    const [sendFriendRequest, { isLoading: isSendingRequest }] = useSendFriendRequestMutation();
    const [removeFriend, { isLoading: isRemoving }] = useRemoveFriendMutation();

    // Report modal
    const [reportModal, setReportModal] = useState(false);
    const [reportType, setReportType] = useState(null);
    const [reportDescription, setReportDescription] = useState('');
    const [reportLoading, setReportLoading] = useState(false);

    const REPORT_TYPES = [
        { value: 'no_show', label: t('profile.public.reportReasons.noShow') },
        { value: 'toxic_behavior', label: t('profile.public.reportReasons.toxic') },
        { value: 'cheating', label: t('profile.public.reportReasons.cheating') },
        { value: 'unsportsmanlike', label: t('profile.public.reportReasons.unsportsmanlike') },
        { value: 'other', label: t('profile.public.reportReasons.other') },
    ];

    const handleSubmitReport = async () => {
        if (!reportType) { message.warning(t('profile.public.reportReasonPlaceholder')); return; }
        setReportLoading(true);
        try {
            await axios.post(`${API_BASE}/api/games/reports`, {
                reporterId: currentUser.id,
                reporterName: currentUser.name,
                reportedUserId: id,
                reportedUserName: player?.name,
                type: reportType,
                description: reportDescription,
            });
            message.success(t('profile.public.reportSuccess'));
            setReportModal(false);
            setReportType(null);
            setReportDescription('');
        } catch {
            message.error(t('profile.public.reportError'));
        } finally {
            setReportLoading(false);
        }
    };

    const handleSendFriendRequest = async () => {
        if (!currentUser?.id) {
            message.warning(t('profile.public.mustLoginForFriend'));
            return;
        }
        try {
            await sendFriendRequest({ requesterId: currentUser.id, receiverId: id }).unwrap();
            message.success(t('profile.public.friendRequestSuccess'));
            refetchFriendship();
        } catch (error) {
            message.error(t('profile.public.friendRequestError'));
        }
    };

    const handleRemoveFriend = async () => {
        try {
            await removeFriend({ userId: currentUser.id, targetId: id }).unwrap();
            message.success(t('profile.public.friendRemoved'));
            refetchFriendship();
        } catch {
            message.error(t('profile.public.friendRemoveError'));
        }
    };

    useEffect(() => {
        const loadPlayerData = async () => {
            try {
                setLoading(true);

                // Load player profile
                const profileRes = await axios.get(`${API_BASE}/api/users/${id}`);
                setPlayer(profileRes.data);

                // Load player's games
                const gamesRes = await axios.get(`${API_BASE}/api/games`);
                const allGames = gamesRes.data || [];
                const filteredGames = allGames.filter(game =>
                    game.players?.some(p => p.id === id) || game.organizerId === id
                );
                setPlayerGames(filteredGames);
            } catch (error) {
                console.error('Failed to load player data:', error);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            loadPlayerData();
        }
    }, [id]);

    if (loading) {
        return (
            <div className="gradient-bg" style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Spin size="large" />
            </div>
        );
    }

    if (!player) {
        return (
            <div className="gradient-bg" style={{ minHeight: '100vh', padding: '24px 16px' }}>
                <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center', color: 'var(--text-primary)' }}>
                    <h2>{t('profile.public.notFound')}</h2>
                    <Button onClick={() => navigate(-1)}>{t('profile.public.back')}</Button>
                </div>
            </div>
        );
    }

    const positionLabels = {
        goalkeeper: `🧤 ${t('positions.goalkeeper')}`,
        defender: `🛡️ ${t('positions.defender')}`,
        midfielder: `⚙️ ${t('positions.midfielder')}`,
        forward: `⚡ ${t('positions.forward')}`,
        any: `🔄 ${t('positions.any')}`
    };

    const skillLabels = {
        beginner: t('profile.public.skillLabels.beginner'),
        amateur: t('profile.public.skillLabels.amateur'),
        intermediate: t('profile.public.skillLabels.intermediate'),
        advanced: t('profile.public.skillLabels.advanced'),
        professional: t('profile.public.skillLabels.professional')
    };

    return (
        <>
        <div className="gradient-bg" style={{ minHeight: '100vh', padding: '24px 16px' }}>
            <div style={{ maxWidth: 1000, margin: '0 auto' }} className="animate-fade-in">
                {/* Back Button */}
                <Button
                    type="text"
                    icon={<ArrowLeftOutlined />}
                    onClick={() => navigate(-1)}
                    style={{ marginBottom: 16, color: 'var(--text-secondary)', paddingLeft: 0 }}
                >
                    {t('profile.public.back')}
                </Button>

                <Row gutter={[24, 24]}>
                    {/* Left Column: Profile Card */}
                    <Col xs={24} md={8}>
                        <Card className="glass-card" style={{ textAlign: 'center' }}>
                            <Avatar
                                size={120}
                                src={player.avatar}
                                icon={<UserOutlined />}
                                style={{
                                    border: '4px solid rgba(255,255,255,0.1)',
                                    boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
                                }}
                            />
                            <div style={{ marginTop: 16 }}>
                                <Title level={3} style={{ color: 'var(--text-primary)', marginBottom: 4 }}>
                                    {player.name || t('common.player')}
                                </Title>

                                {player.position && (
                                    <Tag color="blue" style={{ marginBottom: 8 }}>
                                        {positionLabels[player.position] || player.position}
                                    </Tag>
                                )}

                                {player.skillLevel && (
                                    <Tag color="purple" style={{ marginBottom: 16 }}>
                                        {skillLabels[player.skillLevel] || player.skillLevel}
                                    </Tag>
                                )}

                                {/* Stats Grid */}
                                <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 16, marginBottom: 16 }}>
                                    <Statistic
                                        title={<span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{t('profile.public.rating')}</span>}
                                        value={player.averageRating || 0}
                                        precision={1}
                                        valueStyle={{ color: 'var(--text-primary)', fontSize: 24 }}
                                        prefix={<Rate disabled allowHalf value={player.averageRating || 0} style={{ fontSize: 14, color: '#faad14' }} count={1} />}
                                    />
                                    <Statistic
                                        title={<span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{t('profile.public.games')}</span>}
                                        value={player.gamesPlayed || 0}
                                        valueStyle={{ color: 'var(--text-primary)', fontSize: 24 }}
                                    />
                                </div>

                                {/* Friend + Report Buttons */}
                                {currentUser?.id && currentUser.id !== player.id && (
                                    <div style={{ marginBottom: 16, display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                                        {friendshipStatus?.status === 'accepted' ? (
                                            <Button
                                                danger
                                                loading={isRemoving}
                                                onClick={handleRemoveFriend}
                                            >
                                                {t('profile.public.removeFriend')}
                                            </Button>
                                        ) : friendshipStatus?.status === 'pending' ? (
                                            <Button disabled>{t('profile.public.friendRequestSent')}</Button>
                                        ) : (
                                            <Button
                                                type="primary"
                                                icon={<UserAddOutlined />}
                                                loading={isSendingRequest}
                                                onClick={handleSendFriendRequest}
                                            >
                                                {t('profile.public.addFriend')}
                                            </Button>
                                        )}
                                        <Button
                                            icon={<WarningOutlined />}
                                            danger
                                            onClick={() => setReportModal(true)}
                                        >
                                            {t('profile.public.report')}
                                        </Button>
                                    </div>
                                )}

                                {/* MVP Badge */}
                                {player.manOfTheMatchCount > 0 && (
                                    <div style={{
                                        padding: 12,
                                        background: 'rgba(250, 173, 20, 0.15)',
                                        borderRadius: 8,
                                        marginBottom: 16
                                    }}>
                                        <TrophyOutlined style={{ color: '#faad14', fontSize: 20, marginRight: 8 }} />
                                        <span style={{ fontWeight: 'bold', color: '#faad14' }}>
                                            {t('profile.public.mvpCount', { n: player.manOfTheMatchCount })}
                                        </span>
                                    </div>
                                )}

                                {/* Goals & Assists */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: 12, borderRadius: 8 }}>
                                        <Text style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{t('profile.public.goals')}</Text>
                                        <div style={{ color: 'var(--text-primary)', fontSize: 18, fontWeight: 'bold' }}>
                                            {player.totalGoals || 0}
                                        </div>
                                    </div>
                                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: 12, borderRadius: 8 }}>
                                        <Text style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{t('profile.public.assists')}</Text>
                                        <div style={{ color: 'var(--text-primary)', fontSize: 18, fontWeight: 'bold' }}>
                                            {player.totalAssists || 0}
                                        </div>
                                    </div>
                                </div>

                                {/* Bio */}
                                {player.bio && (
                                    <>
                                        <Divider style={{ borderColor: 'rgba(255,255,255,0.1)' }} />
                                        <Text style={{ color: 'var(--text-secondary)' }}>
                                            {player.bio}
                                        </Text>
                                    </>
                                )}
                            </div>
                        </Card>
                    </Col>

                    {/* Right Column: Game History */}
                    <Col xs={24} md={16}>
                        <Card
                            className="glass-card"
                            title={
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <TeamOutlined style={{ color: 'var(--primary-color)' }} />
                                    <span style={{ color: 'var(--text-primary)' }}>{t('profile.public.gameHistory', { n: playerGames.length })}</span>
                                </div>
                            }
                        >
                            <GameHistory games={playerGames} />
                        </Card>
                    </Col>
                </Row>
            </div>
        </div>

        {/* Report Modal */}
        <Modal
            title={<span><WarningOutlined style={{ color: '#ff4d4f', marginRight: 8 }} />{t('profile.public.reportTitle')}</span>}
            open={reportModal}
            onCancel={() => { setReportModal(false); setReportType(null); setReportDescription(''); }}
            onOk={handleSubmitReport}
            okText={t('profile.public.sendReport')}
            cancelText={t('profile.public.cancelReport')}
            okButtonProps={{ danger: true, loading: reportLoading }}
            width={420}
        >
            <div style={{ marginBottom: 16 }}>
                <div style={{ marginBottom: 8, fontWeight: 500 }}>{t('profile.public.reasonLabel')}</div>
                <Select
                    placeholder={t('profile.public.reportReasonPlaceholder')}
                    style={{ width: '100%' }}
                    size="large"
                    value={reportType}
                    onChange={setReportType}
                    options={REPORT_TYPES}
                />
            </div>
            <div>
                <div style={{ marginBottom: 8, fontWeight: 500 }}>{t('profile.public.descriptionLabel')} <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}></span></div>
                <Input.TextArea
                    rows={3}
                    placeholder={t('profile.public.descriptionPlaceholder')}
                    value={reportDescription}
                    onChange={e => setReportDescription(e.target.value)}
                    maxLength={300}
                    showCount
                />
            </div>
        </Modal>
        </>
    );
};

export default PublicProfilePage;
