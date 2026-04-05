import { useState } from 'react';
import { Modal, Button, InputNumber, Avatar, message, Card, Badge, Checkbox } from 'antd';
import { UserOutlined, TrophyOutlined, CheckCircleOutlined, WarningOutlined } from '@ant-design/icons';
import { useSubmitPostGameMutation } from '../../../store/gamesApi';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { API_BASE } from '../../../config.js';

const BADGE_TYPES = [
    { key: 'speed', icon: '⚡', labelKey: 'game.postGame.badges.fastest', color: '#00d4ff' },
    { key: 'defense', icon: '🛡', labelKey: 'game.postGame.badges.wall', color: '#ff6b35' },
    { key: 'stamina', icon: '🔋', labelKey: 'game.postGame.badges.engine', color: '#52c41a' },
    { key: 'attack', icon: '🎯', labelKey: 'game.postGame.badges.technician', color: '#f43f5e' },
];

/**
 * Unified Post-Game Modal
 * For organizer: Step 1 = mark no-shows, Step 2 = stats/mvp/badges
 * For players: just stats/mvp/badges
 */
const PostGameModal = ({ visible, onClose, game, currentUser }) => {
    const { t } = useTranslation();
    const [submitPostGame, { isLoading }] = useSubmitPostGameMutation();
    const [goals, setGoals] = useState(0);
    const [assists, setAssists] = useState(0);
    const [selectedMvp, setSelectedMvp] = useState(null);
    const [badges, setBadges] = useState([]);

    // No-show step (organizer only)
    const [step, setStep] = useState('noshows'); // 'noshows' | 'stats'
    const [noShowIds, setNoShowIds] = useState([]);
    const [submittingNoShows, setSubmittingNoShows] = useState(false);

    if (!game || !currentUser) return null;

    const isOrganizer = game.organizerId === currentUser.id;
    const allPlayers = game.players || [];

    // Determine current user's team
    const playerIndex = allPlayers.findIndex(p => p.id === currentUser.id);
    const myTeam = playerIndex < (game.maxPlayers || 10) / 2 ? 'A' : 'B';
    const teammates = allPlayers.filter((p, idx) => {
        const theirTeam = idx < (game.maxPlayers || 10) / 2 ? 'A' : 'B';
        return theirTeam === myTeam && p.id !== currentUser.id;
    });

    const toggleBadge = (playerId, badgeType) => {
        const existing = badges.findIndex(b => b.playerId === playerId && b.badgeType === badgeType);
        if (existing >= 0) {
            setBadges(badges.filter((_, i) => i !== existing));
        } else {
            if (badges.length >= 2) { message.warning(t('game.postGame.maxBadges')); return; }
            setBadges([...badges, { playerId, badgeType }]);
        }
    };

    const hasBadge = (playerId, badgeType) => badges.some(b => b.playerId === playerId && b.badgeType === badgeType);

    const handleSubmitNoShows = async () => {
        setSubmittingNoShows(true);
        try {
            if (noShowIds.length > 0) {
                const noShowPlayers = allPlayers
                    .filter(p => noShowIds.includes(p.id))
                    .map(p => ({ id: p.id, name: p.name }));
                await axios.post(`${API_BASE}/api/games/${game.id}/report-noshows`, {
                    reportedByUserId: currentUser.id,
                    players: noShowPlayers,
                });
                message.success(t('game.postGame.noShowMarked', { n: noShowIds.length }));
            }
        } catch {
            message.warning(t('game.postGame.noShowError'));
        } finally {
            setSubmittingNoShows(false);
            setStep('stats');
        }
    };

    const handleSubmit = async () => {
        if (!selectedMvp) { message.warning(t('game.postGame.mvpQuestion')); return; }
        try {
            const result = await submitPostGame({
                id: game.id,
                playerId: currentUser.id,
                goals,
                assists,
                mvpVoteId: selectedMvp,
                badges,
            }).unwrap();
            message.success(result.message);
            // Mark as rated so the separate "Оценить" button doesn't appear after game finishes
            localStorage.setItem(`rated_game_${game.id}`, 'true');
            onClose();
        } catch (error) {
            message.error(error.data?.message || t('game.postGame.sendError'));
        }
    };

    const hasSubmitted = game.pendingPlayerStats?.[currentUser.id];

    if (hasSubmitted) {
        return (
            <Modal title={null} open={visible} onCancel={onClose} footer={null} centered width={400}>
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                    <CheckCircleOutlined style={{ fontSize: 64, color: '#52c41a', marginBottom: 20 }} />
                    <h2>{t('game.postGame.statsSubmitted')}</h2>
                    <p style={{ color: 'var(--text-secondary)' }}>{t('game.postGame.waiting')}</p>
                    <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
                        {Object.keys(game.pendingPlayerStats || {}).length} / {allPlayers.length} {t('game.postGame.sent')}
                    </p>
                </div>
            </Modal>
        );
    }

    // ─── Step 1: Organizer marks no-shows ───
    if (isOrganizer && step === 'noshows') {
        const otherPlayers = allPlayers.filter(p => p.id !== currentUser.id);
        return (
            <Modal title={null} open={visible} onCancel={onClose} footer={null} centered width={480}>
                <div style={{ textAlign: 'center', marginBottom: 20 }}>
                    <WarningOutlined style={{ fontSize: 36, color: '#fa8c16', marginBottom: 8 }} />
                    <h2 style={{ margin: 0 }}>{t('game.postGame.noShowTitle')}</h2>
                    <p style={{ color: 'var(--text-secondary)', margin: '8px 0 0' }}>
                        {t('game.postGame.noShowSubtitle')}
                    </p>
                </div>

                <Card size="small" style={{ marginBottom: 20 }}>
                    {otherPlayers.length === 0 ? (
                        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', margin: 0 }}>
                            {t('game.postGame.noOtherPlayers')}
                        </p>
                    ) : (
                        otherPlayers.map(player => (
                            <div
                                key={player.id}
                                onClick={() => {
                                    setNoShowIds(prev =>
                                        prev.includes(player.id)
                                            ? prev.filter(id => id !== player.id)
                                            : [...prev, player.id]
                                    );
                                }}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 12,
                                    padding: '10px 8px',
                                    borderRadius: 8,
                                    cursor: 'pointer',
                                    marginBottom: 4,
                                    background: noShowIds.includes(player.id)
                                        ? 'rgba(250,140,22,0.12)'
                                        : 'transparent',
                                    border: noShowIds.includes(player.id)
                                        ? '1px solid rgba(250,140,22,0.4)'
                                        : '1px solid transparent',
                                    transition: 'all 0.15s',
                                }}
                            >
                                <Checkbox
                                    checked={noShowIds.includes(player.id)}
                                    onChange={() => {}}
                                    style={{ pointerEvents: 'none' }}
                                />
                                <Avatar size={32} src={player.avatar} icon={<UserOutlined />}>
                                    {!player.avatar && player.name?.charAt(0)?.toUpperCase()}
                                </Avatar>
                                <span style={{ fontWeight: noShowIds.includes(player.id) ? 600 : 400 }}>
                                    {player.name || 'Игрок'}
                                </span>
                                {noShowIds.includes(player.id) && (
                                    <span style={{ marginLeft: 'auto', fontSize: 12, color: '#fa8c16' }}>
                                        {t('game.postGame.noShowLabel')}
                                    </span>
                                )}
                            </div>
                        ))
                    )}
                </Card>

                <div style={{ display: 'flex', gap: 12 }}>
                    <Button block onClick={() => setStep('stats')}>
                        {t('game.postGame.allCame')}
                    </Button>
                    <Button
                        type="primary"
                        block
                        onClick={handleSubmitNoShows}
                        loading={submittingNoShows}
                        style={noShowIds.length > 0 ? { background: '#fa8c16', borderColor: '#fa8c16' } : {}}
                    >
                        {noShowIds.length > 0 ? t('game.postGame.markAndContinue', { n: noShowIds.length }) : t('game.postGame.continueBtn')}
                    </Button>
                </div>
            </Modal>
        );
    }

    // ─── Step 2: Stats / MVP / Badges ───
    return (
        <Modal title={null} open={visible} onCancel={onClose} footer={null} centered width="min(500px, 95vw)" style={{ top: 20 }}>
            <div style={{ textAlign: 'center' }}>
                {/* Score */}
                <div style={{
                    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                    borderRadius: 16, padding: '20px 24px', marginBottom: 24
                }}>
                    <div style={{ fontSize: 12, color: '#8b8b8b', marginBottom: 8 }}>{t('game.postGame.finalScore')}</div>
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 20 }}>
                        <span style={{ fontSize: 40, fontWeight: 'bold', color: '#fff' }}>{game.scoreTeamA}</span>
                        <span style={{ fontSize: 24, color: '#666' }}>:</span>
                        <span style={{ fontSize: 40, fontWeight: 'bold', color: '#fff' }}>{game.scoreTeamB}</span>
                    </div>
                </div>

                {/* My Stats */}
                <Card size="small" style={{ marginBottom: 24, textAlign: 'left' }} title={t('game.postGame.yourStats')}>
                    <div style={{ display: 'flex', gap: 24, justifyContent: 'center' }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ marginBottom: 8, fontWeight: 500 }}>⚽ {t('game.postGame.goals')}</div>
                            <InputNumber min={0} max={game.scoreTeamA + game.scoreTeamB} value={goals} onChange={setGoals} size="large" style={{ width: 80 }} />
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ marginBottom: 8, fontWeight: 500 }}>👟 {t('game.postGame.assists')}</div>
                            <InputNumber min={0} max={20} value={assists} onChange={setAssists} size="large" style={{ width: 80 }} />
                        </div>
                    </div>
                </Card>

                {/* MVP Voting */}
                <Card
                    size="small"
                    style={{ marginBottom: 24, textAlign: 'left' }}
                    title={<span><TrophyOutlined style={{ color: '#faad14' }} /> {t('game.postGame.mvpTitle')}</span>}
                >
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
                        gap: 10, justifyItems: 'center'
                    }}>
                        {teammates.map(player => (
                            <div
                                key={player.id}
                                onClick={() => setSelectedMvp(player.id)}
                                style={{
                                    cursor: 'pointer', padding: 12, borderRadius: 12,
                                    border: selectedMvp === player.id ? '3px solid #faad14' : '2px solid transparent',
                                    background: selectedMvp === player.id ? 'rgba(250,173,20,0.1)' : 'rgba(255,255,255,0.03)',
                                    transition: 'all 0.2s', textAlign: 'center', minWidth: 90
                                }}
                            >
                                <Badge count={selectedMvp === player.id ? <TrophyOutlined style={{ color: '#faad14' }} /> : 0} offset={[-5, 5]}>
                                    <Avatar
                                        size={64} src={player.avatar} icon={<UserOutlined />}
                                        style={{
                                            border: selectedMvp === player.id ? '3px solid #faad14' : '2px solid #333',
                                            boxShadow: selectedMvp === player.id ? '0 0 20px rgba(250,173,20,0.3)' : 'none'
                                        }}
                                    >
                                        {!player.avatar && player.name?.charAt(0)?.toUpperCase()}
                                    </Avatar>
                                </Badge>
                                <div style={{
                                    marginTop: 8, fontSize: 12,
                                    fontWeight: selectedMvp === player.id ? 600 : 400,
                                    color: selectedMvp === player.id ? '#faad14' : 'inherit',
                                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 80
                                }}>
                                    {player.name?.split(' ')[0] || t('common.player')}
                                </div>
                            </div>
                        ))}
                    </div>
                    {teammates.length === 0 && (
                        <p style={{ textAlign: 'center', color: 'var(--text-tertiary)' }}>{t('game.postGame.noMvpPlayers')}</p>
                    )}
                </Card>

                {/* Skill Badges */}
                <Card
                    size="small"
                    style={{ marginBottom: 24, textAlign: 'left' }}
                    title={<span>🏅 {t('game.postGame.badgeTitle')} <span style={{ fontSize: 12, color: '#8b8b8b', fontWeight: 400 }}>({badges.length}/2)</span></span>}
                >
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 12 }}>
                        {t('game.postGame.badgeSubtitle')}
                    </div>
                    {teammates.map(player => (
                        <div key={player.id} style={{ marginBottom: 12 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                                <Avatar size={28} src={player.avatar} icon={<UserOutlined />}>
                                    {!player.avatar && player.name?.charAt(0)?.toUpperCase()}
                                </Avatar>
                                <span style={{ fontSize: 13, fontWeight: 500 }}>{player.name?.split(' ')[0] || t('common.player')}</span>
                            </div>
                            <div style={{ display: 'flex', gap: 6, paddingLeft: 38, flexWrap: 'wrap' }}>
                                {BADGE_TYPES.map(badge => {
                                    const active = hasBadge(player.id, badge.key);
                                    const badgeLabel = t(badge.labelKey);
                                    return (
                                        <div
                                            key={badge.key}
                                            onClick={() => toggleBadge(player.id, badge.key)}
                                            title={badgeLabel}
                                            style={{
                                                cursor: 'pointer', padding: '6px 10px', borderRadius: 8, fontSize: 13,
                                                border: active ? `2px solid ${badge.color}` : '1px solid rgba(255,255,255,0.1)',
                                                background: active ? `${badge.color}20` : 'rgba(255,255,255,0.03)',
                                                transition: 'all 0.2s', userSelect: 'none',
                                                display: 'flex', alignItems: 'center', gap: 4
                                            }}
                                        >
                                            <span>{badge.icon}</span>
                                            <span style={{ fontSize: 10, color: active ? badge.color : 'rgba(255,255,255,0.4)', fontWeight: active ? 600 : 400 }}>
                                                {badgeLabel.split(' ').pop()}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                    {teammates.length === 0 && (
                        <p style={{ textAlign: 'center', color: 'var(--text-tertiary)' }}>{t('game.postGame.noTeammates')}</p>
                    )}
                </Card>

                <Button
                    type="primary" size="large" block onClick={handleSubmit}
                    loading={isLoading} disabled={!selectedMvp}
                    style={{ height: 48, fontSize: 16 }}
                >
                    {t('game.postGame.submit')}
                </Button>
            </div>
        </Modal>
    );
};

export default PostGameModal;
