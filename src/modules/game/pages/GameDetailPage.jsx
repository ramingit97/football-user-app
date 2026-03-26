import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
    Spin,
    Avatar,
    message,
    Modal,
    InputNumber,
    Form,
    Tag,
    Table,
    Drawer,
    Card,
    List,
    Descriptions,
    Divider,
    Button,
    Select,
} from 'antd';
import {
    ArrowLeftOutlined,
    CalendarOutlined,
    ClockCircleOutlined,
    EnvironmentOutlined,
    TeamOutlined,
    UserOutlined,
    CheckCircleOutlined,
    TrophyOutlined,
    StarOutlined,
    LogoutOutlined,
    ThunderboltOutlined,
    ShareAltOutlined,
    FireOutlined,
    DownloadOutlined,
    UserAddOutlined,
    CloseOutlined,
    DownOutlined,
    UpOutlined,
} from '@ant-design/icons';
import { io } from 'socket.io-client';
import { useDispatch } from 'react-redux';
import {
    gamesApi,
    useGetGameByIdQuery,
    useJoinGameMutation,
    useUpdateGameMutation,
    useFinishGameMutation,
    useLeaveGameMutation,
    useSmartInviteMutation,
    useGetGameInvitesQuery,
    useStartFinishGameMutation,
    useClaimStatsMutation,
    useValidateStatsMutation,
    useCastMvpVoteMutation,
    useCompleteGameMutation,
    useBalanceTeamsMutation,
} from '../../../store/gamesApi';
import { useGetProfileQuery } from '../../../store/authApi';
import GameRatingModal from '../components/GameRatingModal';
import PaymentModal from '../components/PaymentModal';
import PowerBalance from '../components/PowerBalance';
import KitSelector from '../components/KitSelector';
import FormationSelector from '../components/FormationSelector';
import axios from 'axios';
import html2canvas from 'html2canvas';
import { API_BASE } from '../../../config.js';
import GameMap from '../components/GameMap';
import UrgentBanner from '../components/UrgentBanner';
import GameChat from '../components/GameChat';
import PostGameModal from '../components/PostGameModal';
import MvpReveal from '../components/MvpReveal';
import PrivateInviteModal from '../components/PrivateInviteModal';
import DualTeamFieldView from '../components/DualTeamFieldView';

// ── Stat pill for hero ───────────────────────────────────────
const InfoPill = ({ icon, label, value, highlight }) => (
    <div style={{
        display: 'flex', flexDirection: 'column', gap: 2,
        padding: '10px 14px',
        background: 'var(--bg-raised)',
        border: '1px solid var(--border-color)',
        borderRadius: 10,
        flex: '1 1 auto', minWidth: 0,
    }}>
        <span style={{ fontSize: 11, color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 4 }}>
            {icon} {label}
        </span>
        <span style={{
            fontSize: 14, fontWeight: 700,
            fontFamily: 'Outfit, sans-serif',
            color: highlight ? 'var(--green)' : 'var(--text-primary)',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
            {value}
        </span>
    </div>
);

// ── Labeled action button (native) ──────────────────────────
const ActionBtn = ({ icon, label, onClick, loading, variant = 'ghost', disabled }) => {
    const styles = {
        ghost: {
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-secondary)',
        },
        purple: {
            background: 'linear-gradient(135deg, #722ed1, #9254de)',
            border: 'none', color: '#fff',
        },
        green: {
            background: 'var(--green)', border: 'none', color: '#060c18',
        },
        danger: {
            background: 'rgba(240,68,56,0.12)',
            border: '1px solid rgba(240,68,56,0.3)',
            color: '#f04438',
        },
        whatsapp: {
            background: 'linear-gradient(135deg, #25D366, #128C7E)',
            border: 'none', color: '#fff',
        },
    };
    return (
        <button
            onClick={onClick}
            disabled={disabled || loading}
            style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 14px',
                borderRadius: 9,
                fontSize: 13,
                fontFamily: 'Outfit, sans-serif',
                fontWeight: 600,
                cursor: disabled || loading ? 'default' : 'pointer',
                opacity: disabled ? 0.5 : 1,
                transition: 'opacity 0.15s',
                whiteSpace: 'nowrap',
                ...styles[variant],
            }}
        >
            {icon} {label}
        </button>
    );
};

const GameDetailPage = () => {
    const { t } = useTranslation();
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { data: game, isLoading, refetch } = useGetGameByIdQuery(id);
    const [joinGame, { isLoading: joining }] = useJoinGameMutation();
    const [finishGame, { isLoading: finishing }] = useFinishGameMutation();
    const [leaveGame, { isLoading: leaving }] = useLeaveGameMutation();
    const [smartInvite, { isLoading: inviting }] = useSmartInviteMutation();
    const { data: userProfile } = useGetProfileQuery();

    const [startFinishGame, { isLoading: startingFinish }] = useStartFinishGameMutation();
    const [claimStats, { isLoading: claimingStats }] = useClaimStatsMutation();
    const [validateStats, { isLoading: validatingStats }] = useValidateStatsMutation();
    const [castMvpVote, { isLoading: castingVote }] = useCastMvpVoteMutation();
    const [completeGame, { isLoading: completingGame }] = useCompleteGameMutation();
    const [balanceTeams, { isLoading: balancing }] = useBalanceTeamsMutation();

    const [smartDraftVisible, setSmartDraftVisible] = useState(false);
    const [draftResult, setDraftResult] = useState({ teamA: [], teamB: [] });
    const [mvpRevealVisible, setMvpRevealVisible] = useState(false);
    const [privateInviteModalVisible, setPrivateInviteModalVisible] = useState(false);
    const [tacticsExpanded, setTacticsExpanded] = useState(false);

    const [invitesDrawerVisible, setInvitesDrawerVisible] = useState(false);
    const { data: invites = [], refetch: refetchInvites } = useGetGameInvitesQuery(id, {
        skip: !invitesDrawerVisible
    });

    const [searchParams, setSearchParams] = useSearchParams();
    const [selectedPosition, setSelectedPosition] = useState(null);
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [isInviteFlow, setIsInviteFlow] = useState(false);
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        if (searchParams.get('selectPosition') === 'true') {
            setIsSelectionMode(true);
            setIsInviteFlow(true);
            searchParams.delete('selectPosition');
            setSearchParams(searchParams, { replace: true });
        }
    }, [searchParams, setSearchParams]);

    const [isFinishModalVisible, setIsFinishModalVisible] = useState(false);
    const [isClaimStatsModalVisible, setIsClaimStatsModalVisible] = useState(false);
    const [isValidateStatsModalVisible, setIsValidateStatsModalVisible] = useState(false);
    const [isMvpVotingModalVisible, setIsMvpVotingModalVisible] = useState(false);
    const [isPostGameModalVisible, setIsPostGameModalVisible] = useState(false);
    const [isRatingModalVisible, setIsRatingModalVisible] = useState(false);
    const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false);
    const [stadiumName, setStadiumName] = useState('');
    const [selectedPlayer, setSelectedPlayer] = useState(null);
    const [fullPlayerData, setFullPlayerData] = useState(null);
    const [playerModalVisible, setPlayerModalVisible] = useState(false);
    const [playerLoading, setPlayerLoading] = useState(false);
    const [finishForm] = Form.useForm();
    const [claimForm] = Form.useForm();
    const [validateForm] = Form.useForm();

    const [formationA, setFormationA] = useState('2-2');
    const [formationB, setFormationB] = useState('2-2');
    const [teamAColor, setTeamAColor] = useState('#ff4d4f');
    const [teamBColor, setTeamBColor] = useState('#1890ff');

    const getDefaultFormation = (format) => {
        switch (format) {
            case '5x5': return '2-2';
            case '6x6': return '2-1-2';
            case '7x7': return '2-3-1';
            case '8x8': return '3-3-1';
            case '11x11': return '4-4-2';
            default: return '2-2';
        }
    };

    useEffect(() => {
        if (game) {
            const defaultFmt = getDefaultFormation(game.format);
            setFormationA(game.formationA || defaultFmt);
            setFormationB(game.formationB || defaultFmt);
            if (game.teamAColor) setTeamAColor(game.teamAColor);
            if (game.teamBColor) setTeamBColor(game.teamBColor);

            if (game.status === 'finished' && game.mvpId) {
                const hasSeen = sessionStorage.getItem(`mvp_reveal_${game.id}`);
                if (!hasSeen) {
                    setMvpRevealVisible(true);
                    sessionStorage.setItem(`mvp_reveal_${game.id}`, 'true');
                }
            }

            const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(game.location);
            const stadiumIdToFetch = isUUID ? game.location : game.stadiumId;
            if (stadiumIdToFetch && /^[0-9a-f]{8}-/i.test(stadiumIdToFetch)) {
                axios.get(`${API_BASE}/api/stadiums/${stadiumIdToFetch}`)
                    .then(res => setStadiumName(res.data.name))
                    .catch(() => {});
            } else {
                setStadiumName(game.location);
            }
        }
    }, [game]);

    useEffect(() => {
        const loadPlayerData = async () => {
            if (selectedPlayer?.id && playerModalVisible) {
                setPlayerLoading(true);
                try {
                    const res = await axios.get(`${API_BASE}/api/users/${selectedPlayer.id}`);
                    setFullPlayerData(res.data);
                } catch {
                    setFullPlayerData(selectedPlayer);
                } finally {
                    setPlayerLoading(false);
                }
            }
        };
        loadPlayerData();
    }, [selectedPlayer, playerModalVisible]);

    const handleFormationChange = async (team, value) => {
        if (team === 'formationA') setFormationA(value);
        if (team === 'formationB') setFormationB(value);
        try {
            await axios.put(`${API_BASE}/api/games/${id}`, { [team]: value });
            message.success(t('game.detail.schemeUpdated'));
            refetch();
        } catch {
            message.error(t('game.detail.schemeError'));
        }
    };

    const handleColorChange = async (team, color) => {
        if (team === 'teamA') setTeamAColor(color);
        if (team === 'teamB') setTeamBColor(color);
        try {
            await axios.put(`${API_BASE}/api/games/${id}`, { [`${team}Color`]: color });
        } catch {}
    };

    const handleToggleUrgent = async () => {
        const turningOn = !game.isUrgent;
        try {
            await axios.put(`${API_BASE}/api/games/${id}/urgent`, { isUrgent: turningOn });
            message.success(turningOn ? t('game.detail.urgentOn') : t('game.detail.urgentOff'));
            refetch();
            // Показываем кому ушли уведомления когда включаем срочно
            if (turningOn) {
                setInvitesDrawerVisible(true);
                setTimeout(() => refetchInvites(), 500);
            }
        } catch {
            message.error(t('game.detail.urgentError'));
        }
    };

    const handleShareLineup = async () => {
        const element = document.getElementById('tactical-board');
        if (element) {
            const canvas = await html2canvas(element);
            const data = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = data;
            link.download = 'match-lineup.png';
            link.click();
        }
    };

    const currentUser = JSON.parse(localStorage.getItem('user'));
    const isOrganizer = currentUser && game && game.organizerId === currentUser.id;
    const isParticipant = currentUser && game && (game.players || []).some(p => p.id === currentUser.id);
    const isFinished = game?.status === 'finished';
    const hasAlreadyRated = game && currentUser && !!localStorage.getItem(`rated_game_${game.id}`);

    useEffect(() => {
        const newSocket = io(import.meta.env.VITE_API_BASE || window.location.origin, { transports: ['websocket'] });
        setSocket(newSocket);
        newSocket.emit('joinGameRoom', id);
        newSocket.on('positionSelected', (data) => {
            if (data.gameId === id) {
                message.info(t('game.detail.playerSelected', { name: data.player.name }));
                refetch();
            }
        });
        return () => newSocket.close();
    }, [id, refetch]);

    const handlePositionClick = (positionName, team) => {
        setSelectedPosition(`${team}-${positionName}`);
    };

    const handleJoinWithPosition = async () => {
        if (!selectedPosition) { message.warning(t('game.detail.positionNotSelected')); return; }
        if (!currentUser) { message.error(t('game.detail.mustLogin')); return; }

        if (isParticipant) {
            const currentPos = game.players.find(p => p.id === currentUser.id)?.position;
            if (!currentPos) {
                try {
                    await joinGame({ id: game.id, player: { ...currentUser, position: selectedPosition } }).unwrap();
                    message.success(t('game.detail.positionSelected'));
                    dispatch(gamesApi.util.updateQueryData('getGameById', id, (draft) => {
                        const p = draft.players.find(pl => pl.id === currentUser.id);
                        if (p) p.position = selectedPosition;
                    }));
                    setIsSelectionMode(false);
                    refetch();
                } catch { message.error(t('game.detail.positionError')); }
                return;
            }
            Modal.confirm({
                title: t('game.detail.changePosition'),
                content: t('game.detail.changePositionConfirm', { from: currentPos, to: selectedPosition }),
                okText: t('game.detail.changePositionOk'),
                cancelText: t('common.cancel'),
                onOk: async () => {
                    try {
                        await joinGame({ id: game.id, player: { ...currentUser, position: selectedPosition } }).unwrap();
                        message.success(t('game.detail.positionUpdated'));
                        dispatch(gamesApi.util.updateQueryData('getGameById', id, (draft) => {
                            const p = draft.players.find(pl => pl.id === currentUser.id);
                            if (p) p.position = selectedPosition;
                        }));
                        setIsSelectionMode(false);
                        refetch();
                    } catch { message.error(t('game.detail.positionChangeError')); }
                }
            });
            return;
        }
        setIsPaymentModalVisible(true);
    };

    const optimisticallyAddPlayer = (position) => {
        dispatch(gamesApi.util.updateQueryData('getGameById', id, (draft) => {
            const alreadyIn = draft.players.some(p => p.id === currentUser.id);
            if (!alreadyIn) {
                draft.players.push({ ...currentUser, position });
                if (draft.players.length >= draft.maxPlayers) draft.status = 'full';
            }
        }));
    };

    const handlePaymentSuccess = async () => {
        const refCode = searchParams.get('ref');
        try {
            await joinGame({
                id: game.id,
                player: { ...currentUser, position: selectedPosition, ...(refCode ? { referredBy: refCode } : {}) }
            }).unwrap();
            message.success(t('game.detail.joinedGame'));
            optimisticallyAddPlayer(selectedPosition);
            setIsSelectionMode(false);
            setIsPaymentModalVisible(false);
            if (socket) socket.emit('selectPosition', { gameId: game.id, positionIndex: selectedPosition, player: currentUser });
            refetch();
        } catch (error) {
            message.error(error.data?.message || t('game.detail.joinError'));
        }
    };

    const handleFinishGame = async (values) => {
        try {
            await startFinishGame({ id: game.id, scoreTeamA: values.scoreTeamA, scoreTeamB: values.scoreTeamB }).unwrap();
            message.success(t('game.finish.scoreSaved'));
            setIsFinishModalVisible(false);
            refetch();
        } catch (error) {
            message.error(error.data?.message || t('game.finish.saveError'));
        }
    };

    const handleClaimStats = async (values) => {
        try {
            await claimStats({ id: game.id, playerId: currentUser.id, goals: values.goals, assists: values.assists }).unwrap();
            message.success(t('game.claimStats.success'));
            setIsClaimStatsModalVisible(false);
            refetch();
        } catch (error) {
            message.error(error.data?.message || t('game.claimStats.error'));
        }
    };

    const handleValidateStats = async () => {
        const stats = validateForm.getFieldsValue();
        const statsArray = Object.entries(stats).map(([playerId, data]) => ({
            playerId, goals: data.goals || 0, assists: data.assists || 0
        }));
        try {
            await validateStats({ id: game.id, organizerId: currentUser.id, stats: statsArray }).unwrap();
            message.success(t('game.validateStats.success'));
            setIsValidateStatsModalVisible(false);
            refetch();
        } catch (error) {
            message.error(error.data?.message || t('game.validateStats.error'));
        }
    };

    const handleMvpVote = async (votedPlayerId) => {
        try {
            await castMvpVote({ id: game.id, voterId: currentUser.id, votedPlayerId }).unwrap();
            message.success(t('game.mvpVoting.success'));
            setIsMvpVotingModalVisible(false);
            refetch();
        } catch (error) {
            message.error(error.data?.message || t('game.mvpVoting.error'));
        }
    };

    const [draftMode, setDraftMode] = useState(false);
    const [previewPlayers, setPreviewPlayers] = useState([]);
    const [updateGame, { isLoading: updating }] = useUpdateGameMutation();

    const handleSmartDraft = () => {
        if (!game.players || game.players.length < 2) return;
        const randomizedPlayers = [...game.players].map(p => ({
            ...p, tempRating: (p.averageRating || 50) + (Math.random() * 20 - 10)
        })).sort((a, b) => b.tempRating - a.tempRating);

        const teamA = [], teamB = [];
        randomizedPlayers.forEach((player, index) => {
            const round = Math.floor(index / 2);
            const isEvenRound = round % 2 === 0;
            const isFirstInPair = index % 2 === 0;
            if ((isEvenRound && isFirstInPair) || (!isEvenRound && !isFirstInPair)) teamA.push(player);
            else teamB.push(player);
        });

        setPreviewPlayers([
            ...teamA.map(p => ({ ...p, team: 'A' })),
            ...teamB.map(p => ({ ...p, team: 'B' }))
        ]);
        setDraftMode(true);
        setSmartDraftVisible(true);
        setTimeout(() => setSmartDraftVisible(false), 2000);
        message.info(t('game.detail.previewDraft'));
    };

    const handleApplyDraft = async () => {
        try {
            const teamA = previewPlayers.filter(p => p.team === 'A');
            const teamB = previewPlayers.filter(p => p.team === 'B');
            await updateGame({
                id: game.id,
                data: { teamA, teamB, players: [...teamA, ...teamB], teamsBalanced: true }
            }).unwrap();
            message.success(t('game.detail.draftSaved'));
            setDraftMode(false); setSmartDraftVisible(false); setPreviewPlayers([]);
        } catch {
            message.error(t('game.detail.draftError'));
        }
    };

    const handleCancelDraft = () => {
        setDraftMode(false); setSmartDraftVisible(false); setPreviewPlayers([]);
        message.info(t('game.detail.draftCancelled'));
    };

    const handleCompleteGame = async () => {
        try {
            await completeGame(game.id).unwrap();
            message.success(t('game.detail.gameCompleted'));
            refetch();
        } catch (error) {
            message.error(error.data?.message || t('game.detail.completeError'));
        }
    };

    const getPlayerTeam = (playerId) => {
        const idx = game?.players?.findIndex(p => p.id === playerId);
        if (idx === -1 || idx === undefined) return null;
        return idx < (game?.maxPlayers || 10) / 2 ? 'A' : 'B';
    };

    const getTeammates = () => {
        if (!game?.players || !currentUser) return [];
        const myTeam = getPlayerTeam(currentUser.id);
        return game.players.filter(p => getPlayerTeam(p.id) === myTeam && p.id !== currentUser.id);
    };

    const hasClaimedStats = game?.pendingPlayerStats && currentUser && game.pendingPlayerStats[currentUser.id];

    const handleLeaveGame = () => {
        Modal.confirm({
            title: t('game.detail.cancelTitle'),
            content: (
                <div>
                    <p>{t('game.detail.cancelConfirm')}</p>
                    <p style={{ color: 'orange', fontSize: 12 }}>{t('game.detail.cancelWarning')}</p>
                </div>
            ),
            okText: t('game.detail.cancelOk'),
            cancelText: t('game.detail.cancelNo'),
            okButtonProps: { danger: true, loading: leaving },
            onOk: async () => {
                try {
                    await leaveGame({ id: game.id, playerId: currentUser.id }).unwrap();
                    message.success(t('game.detail.cancelSuccess'));
                    refetch();
                } catch { message.error(t('game.detail.cancelError')); }
            }
        });
    };

    const handleBalanceTeams = async () => {
        try {
            const result = await balanceTeams(game.id).unwrap();
            setPreviewPlayers([
                ...result.teamA.map(p => ({ ...p, team: 'A' })),
                ...result.teamB.map(p => ({ ...p, team: 'B' }))
            ]);
            setDraftMode(true); setSmartDraftVisible(true);
            setTimeout(() => setSmartDraftVisible(false), 2000);
            message.success(t('game.detail.balanceDistributed'));
        } catch (error) {
            message.error(t('game.detail.balanceError') + ' ' + (error.data?.message || ''));
        }
    };

    const handleSmartInvite = async () => {
        try {
            const result = await smartInvite({ id: game.id, filters: { autoFill: true, limit: 5 } }).unwrap();
            message.success(t('game.detail.smartInviteSent', { n: result.invitedCount }));
            setInvitesDrawerVisible(true);
            // Принудительно обновляем список приглашений (кэш мог быть старым)
            setTimeout(() => refetchInvites(), 300);
        } catch (error) {
            message.error(t('game.detail.smartInviteError') + ' ' + (error.data?.message || error.message || ''));
        }
    };

    const handleShareWhatsApp = () => {
        const gameDate = new Date(game.date);
        const dayName = gameDate.toLocaleDateString('ru-RU', { weekday: 'long' });
        const dateStr = gameDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
        const spotsAvailable = (game.maxPlayers || 0) - (game.players?.length || 0);
        const totalSpots = game.maxPlayers || 12;
        const filled = game.players?.length || 0;
        const pricePerSlot = game.slotPrice > 0 ? Number(game.slotPrice).toFixed(0) : Number(game.price || 1).toFixed(0);
        const baseUrl = window.location.origin + window.location.pathname;
        const refParam = currentUser?.id ? `?ref=${currentUser.id}` : '';
        const gameUrl = `${baseUrl}${refParam}`;

        const urgencyLine = spotsAvailable <= 3 && spotsAvailable > 0
            ? '\n*>>> ОСТАЛОСЬ МАЛО МЕСТ! <<<*\n' : '';

        const shareText = [
            '- - - - - - - - - - - - - -',
            `*ФУТБОЛ ${game.format || '6x6'}*`,
            '- - - - - - - - - - - - - -',
            '',
            `Дата: *${dayName.charAt(0).toUpperCase() + dayName.slice(1)}, ${dateStr}*`,
            `Время: *${game.time || '20:00'}*`,
            `Место: *${game.location || 'Стадион'}*`,
            `Цена: *${pricePerSlot} AZN* / чел`,
            '',
            `Игроков: ${filled} из ${totalSpots} (свободно ${spotsAvailable})`,
            urgencyLine,
            `Записаться:`,
            gameUrl,
            '',
            '_Перешли друзьям - соберём команду!_',
        ].join('\n');

        window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
        message.success(t('game.detail.whatsappOpened'));
    };

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' });
    };

    if (isLoading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Spin size="large" />
            </div>
        );
    }

    if (!game) return null;

    const currentPlayers = game.players?.length || 0;
    const maxPlayers = game.maxPlayers || 0;
    const spotsLeft = maxPlayers - currentPlayers;
    const isFull = game.status === 'full' || (maxPlayers > 0 && currentPlayers >= maxPlayers);
    const progressPct = maxPlayers > 0 ? (currentPlayers / maxPlayers) * 100 : 0;
    const spotColor = isFull ? '#f04438' : spotsLeft <= 3 ? '#f59e0b' : '#00e87a';

    const canJoin = !isParticipant && !isFull && !isFinished;

    return (
        <div style={{ minHeight: '100vh', padding: '28px 20px 80px' }}>
            <div style={{ maxWidth: 780, margin: '0 auto' }}>

                <UrgentBanner game={game} onJoin={canJoin ? () => setIsSelectionMode(true) : null} />

                {/* Back */}
                <button
                    onClick={() => navigate('/games')}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'var(--text-tertiary)', fontSize: 13,
                        fontFamily: 'Outfit, sans-serif', marginBottom: 20, padding: 0,
                    }}
                >
                    <ArrowLeftOutlined style={{ fontSize: 12 }} />
                    {t('game.detail.backToList')}
                </button>

                {/* ── HERO CARD ─────────────────────────────── */}
                <div style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 18,
                    overflow: 'hidden',
                    marginBottom: 16,
                }}>
                    {/* Color stripe by format */}
                    <div style={{
                        height: 5,
                        background: `linear-gradient(90deg, var(--green), var(--green)88)`,
                        boxShadow: '0 0 16px rgba(0,232,122,0.4)',
                    }} />

                    <div style={{ padding: '24px 24px 20px' }}>
                        {/* Title + status */}
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 18 }}>
                            <h1 style={{
                                fontFamily: 'Syne, sans-serif', fontWeight: 800,
                                fontSize: 22, color: 'var(--text-primary)',
                                margin: 0, lineHeight: 1.25, flex: 1, minWidth: 0,
                            }}>
                                {game.title || `${game.format} — ${stadiumName || game.location}`}
                            </h1>
                            <span style={{
                                flexShrink: 0,
                                padding: '4px 12px',
                                borderRadius: 20,
                                fontSize: 12,
                                fontWeight: 700,
                                fontFamily: 'Outfit, sans-serif',
                                background: isFinished
                                    ? 'rgba(79,134,247,0.15)'
                                    : isFull
                                        ? 'rgba(240,68,56,0.12)'
                                        : 'rgba(0,232,122,0.12)',
                                color: isFinished ? '#4f86f7' : isFull ? '#f04438' : '#00e87a',
                                border: `1px solid ${isFinished ? '#4f86f720' : isFull ? '#f0443820' : '#00e87a20'}`,
                            }}>
                                {isFinished
                                    ? t('game.detail.statusFinished')
                                    : isFull
                                        ? t('game.detail.statusFull')
                                        : t('game.detail.spotsLeft', { n: spotsLeft })
                                }
                            </span>
                        </div>

                        {/* Info pills */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                            <InfoPill
                                icon={<CalendarOutlined />}
                                label={t('common.date')}
                                value={formatDate(game.date)}
                            />
                            <InfoPill
                                icon={<ClockCircleOutlined />}
                                label={t('common.time')}
                                value={game.time}
                            />
                            <InfoPill
                                icon={<EnvironmentOutlined />}
                                label={t('common.place')}
                                value={stadiumName || game.location}
                            />
                            <InfoPill
                                icon={<TeamOutlined />}
                                label={t('common.format')}
                                value={game.format}
                            />
                            {(game.price > 0 || game.slotPrice > 0) && (
                                <InfoPill
                                    label={t('game.card.priceLabel') || 'Цена'}
                                    value={`${game.slotPrice || game.price} ₼`}
                                    highlight
                                />
                            )}
                        </div>

                        {/* Players progress */}
                        <div style={{ marginBottom: 20 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                <span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
                                    {t('game.card.players')}
                                </span>
                                <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'Outfit, sans-serif', color: spotColor }}>
                                    {currentPlayers} / {maxPlayers}
                                </span>
                            </div>
                            <div style={{ height: 6, background: 'var(--bg-raised)', borderRadius: 4, overflow: 'hidden' }}>
                                <div style={{
                                    height: '100%',
                                    width: `${progressPct}%`,
                                    background: isFull ? '#f04438' : spotsLeft <= 3 ? '#f59e0b' : 'linear-gradient(90deg, var(--green), #00c868)',
                                    borderRadius: 4,
                                    transition: 'width 0.4s ease',
                                }} />
                            </div>
                        </div>

                        {/* Main CTA */}
                        {!isFinished && (
                            <div style={{ display: 'flex', gap: 10 }}>
                                {canJoin && !isSelectionMode && (
                                    <button
                                        onClick={() => {
                                            setIsSelectionMode(true);
                                            setTacticsExpanded(true);
                                            setTimeout(() => {
                                                document.getElementById('tactics-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                            }, 100);
                                        }}
                                        style={{
                                            flex: 1, height: 46,
                                            background: 'var(--green)', border: 'none', borderRadius: 12,
                                            color: '#060c18', fontFamily: 'Outfit, sans-serif',
                                            fontWeight: 700, fontSize: 15, cursor: 'pointer',
                                            boxShadow: '0 0 24px rgba(0,232,122,0.3)',
                                            transition: 'opacity 0.15s',
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
                                        onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                                    >
                                        {t('game.detail.takePosition')}
                                    </button>
                                )}
                                {isParticipant && !isOrganizer && (
                                    <button
                                        onClick={handleLeaveGame}
                                        style={{
                                            height: 46, padding: '0 20px',
                                            background: 'rgba(240,68,56,0.1)',
                                            border: '1px solid rgba(240,68,56,0.25)',
                                            borderRadius: 12, color: '#f04438',
                                            fontFamily: 'Outfit, sans-serif', fontWeight: 600,
                                            fontSize: 14, cursor: 'pointer',
                                            display: 'flex', alignItems: 'center', gap: 6,
                                        }}
                                    >
                                        <LogoutOutlined style={{ fontSize: 13 }} />
                                        {t('game.detail.cancelRegistration')}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── ACTION BAR ───────────────────────────── */}
                <div style={{
                    display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16,
                    padding: '12px 16px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 12,
                }}>
                    {/* Organizer tools */}
                    {isOrganizer && !isFinished && (
                        <>
                            <ActionBtn
                                icon={<ThunderboltOutlined />}
                                label={t('game.detail.smartInviteTitle')}
                                onClick={handleSmartInvite}
                                loading={inviting}
                                variant="purple"
                            />
                            <ActionBtn
                                icon={<TeamOutlined />}
                                label={t('game.detail.inviteListTitle')}
                                onClick={() => setInvitesDrawerVisible(true)}
                                variant="ghost"
                            />
                            <ActionBtn
                                icon={<FireOutlined />}
                                label={game.isUrgent ? t('game.detail.urgentOff') : t('game.detail.urgentTitle')}
                                onClick={handleToggleUrgent}
                                variant={game.isUrgent ? 'danger' : 'ghost'}
                            />
                        </>
                    )}

                    {/* Post-game organizer actions */}
                    {game.gamePhase === 'active' && isOrganizer && (
                        <ActionBtn
                            icon={<TrophyOutlined />}
                            label={t('game.detail.finish')}
                            onClick={() => setIsFinishModalVisible(true)}
                            variant="danger"
                        />
                    )}
                    {game.gamePhase === 'pending_stats' && isOrganizer && (
                        <ActionBtn
                            icon={<CheckCircleOutlined />}
                            label={t('game.detail.check')}
                            onClick={() => setIsValidateStatsModalVisible(true)}
                            variant="purple"
                        />
                    )}
                    {game.gamePhase === 'voting' && isOrganizer && (
                        <ActionBtn
                            icon={<TrophyOutlined />}
                            label={t('game.detail.finish')}
                            onClick={handleCompleteGame}
                            loading={completingGame}
                            variant="danger"
                        />
                    )}

                    {/* Participant: claim stats */}
                    {game.gamePhase === 'pending_stats' && isParticipant && !hasClaimedStats && (
                        <ActionBtn
                            icon={<TrophyOutlined />}
                            label={t('game.detail.stats')}
                            onClick={() => setIsPostGameModalVisible(true)}
                            variant="purple"
                        />
                    )}
                    {hasClaimedStats && game.gamePhase === 'pending_stats' && (
                        <span style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '8px 14px', borderRadius: 9,
                            background: 'rgba(0,232,122,0.08)',
                            border: '1px solid rgba(0,232,122,0.2)',
                            fontSize: 13, color: '#00e87a',
                            fontFamily: 'Outfit, sans-serif', fontWeight: 600,
                        }}>
                            <CheckCircleOutlined />
                            {t('game.detail.statsSubmitted', { sent: Object.keys(game.pendingPlayerStats || {}).length, total: game.players?.length })}
                        </span>
                    )}

                    {/* MVP vote + rating */}
                    {isFinished && isParticipant && !hasAlreadyRated && (
                        <ActionBtn
                            icon={<StarOutlined />}
                            label={t('game.detail.rate')}
                            onClick={() => setIsRatingModalVisible(true)}
                            variant="ghost"
                        />
                    )}

                    {/* Shared: invite friends, whatsapp */}
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                        {(isOrganizer || isParticipant) && !isFinished && (
                            <ActionBtn
                                icon={<UserAddOutlined />}
                                label={t('game.detail.friends')}
                                onClick={() => setPrivateInviteModalVisible(true)}
                                variant="ghost"
                            />
                        )}
                        <ActionBtn
                            icon={<ShareAltOutlined />}
                            label="WhatsApp"
                            onClick={handleShareWhatsApp}
                            variant="whatsapp"
                        />
                    </div>
                </div>

                {/* ── SCORE BOARD (finished) ────────────────── */}
                {isFinished && (
                    <div style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 16, padding: '24px',
                        marginBottom: 16, textAlign: 'center',
                    }}>
                        <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 10, fontFamily: 'Outfit, sans-serif', textTransform: 'uppercase', letterSpacing: 1 }}>
                            {t('game.detail.scoreBoard')}
                        </div>
                        <div style={{ fontSize: 52, fontWeight: 800, fontFamily: 'Syne, sans-serif', lineHeight: 1 }}>
                            <span style={{ color: teamAColor }}>{game.scoreTeamA ?? 0}</span>
                            <span style={{ margin: '0 18px', color: 'var(--border-color)' }}>:</span>
                            <span style={{ color: teamBColor }}>{game.scoreTeamB ?? 0}</span>
                        </div>
                        {game.mvpId && (
                            <div
                                onClick={() => setMvpRevealVisible(true)}
                                style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 6,
                                    marginTop: 14, padding: '6px 16px',
                                    background: 'rgba(250,173,20,0.12)',
                                    border: '1px solid rgba(250,173,20,0.3)',
                                    borderRadius: 20, cursor: 'pointer',
                                    fontSize: 13, color: '#faad14', fontWeight: 600,
                                    fontFamily: 'Outfit, sans-serif',
                                }}
                            >
                                <StarOutlined />
                                MVP: {game.players?.find(p => p.id === game.mvpId)?.name || t('common.unknown')}
                            </div>
                        )}

                        {game.stats && game.stats.length > 0 && (
                            <div style={{ marginTop: 20, textAlign: 'left' }}>
                                <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1, fontFamily: 'Outfit, sans-serif' }}>
                                    {t('game.detail.matchStats')}
                                </div>
                                <Table
                                    dataSource={game.stats}
                                    rowKey="id"
                                    pagination={false}
                                    size="small"
                                    columns={[
                                        {
                                            title: t('game.detail.playerCol'), key: 'player',
                                            render: (_, record) => {
                                                const player = game.players.find(p => p.id === record.playerId);
                                                return (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                        <Avatar size={28} icon={<UserOutlined />} src={player?.avatar} />
                                                        <span style={{ color: 'var(--text-primary)' }}>{player?.name || t('common.unknown')}</span>
                                                        {record.playerId === game.mvpId && <StarOutlined style={{ color: '#faad14', fontSize: 12 }} />}
                                                    </div>
                                                );
                                            }
                                        },
                                        { title: '⚽', dataIndex: 'goals', key: 'goals', sorter: (a, b) => a.goals - b.goals, width: 60 },
                                        { title: '🎯', dataIndex: 'assists', key: 'assists', sorter: (a, b) => a.assists - b.assists, width: 60 },
                                    ]}
                                />
                            </div>
                        )}
                    </div>
                )}

                {/* ── PLAYERS LIST ──────────────────────────── */}
                <div style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 16, padding: '20px 20px 4px',
                    marginBottom: 16,
                }}>
                    <div style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        marginBottom: 16,
                    }}>
                        <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>
                            {t('game.detail.registeredPlayers', { n: currentPlayers })}
                        </span>
                        <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                            {t('game.detail.organizer')} {game.organizerName || game.organizer}
                        </span>
                    </div>

                    {currentPlayers === 0 ? (
                        <p style={{ color: 'var(--text-tertiary)', fontSize: 13, textAlign: 'center', padding: '16px 0' }}>
                            {t('game.detail.noPlayersYet') || 'Пока никто не записался'}
                        </p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {(game.players || []).map((player, idx) => {
                                const isCurrentUser = currentUser && player.id === currentUser.id;
                                const team = player.position?.startsWith('B-') ? 'B'
                                    : player.position?.startsWith('A-') ? 'A'
                                    : player.team || (idx < maxPlayers / 2 ? 'A' : 'B');
                                return (
                                    <div
                                        key={player.id}
                                        onClick={() => { setSelectedPlayer(player); setPlayerModalVisible(true); }}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 12,
                                            padding: '10px 12px', borderRadius: 10,
                                            cursor: 'pointer',
                                            background: isCurrentUser ? 'rgba(0,232,122,0.06)' : 'transparent',
                                            border: isCurrentUser ? '1px solid rgba(0,232,122,0.15)' : '1px solid transparent',
                                            transition: 'background 0.15s',
                                            marginBottom: 4,
                                        }}
                                        onMouseEnter={e => { if (!isCurrentUser) e.currentTarget.style.background = 'var(--bg-raised)'; }}
                                        onMouseLeave={e => { if (!isCurrentUser) e.currentTarget.style.background = 'transparent'; }}
                                    >
                                        <Avatar
                                            size={36}
                                            src={player.avatar}
                                            icon={<UserOutlined />}
                                            style={{
                                                border: `2px solid ${team === 'A' ? teamAColor : teamBColor}`,
                                                flexShrink: 0,
                                            }}
                                        >
                                            {!player.avatar && player.name?.charAt(0)?.toUpperCase()}
                                        </Avatar>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{
                                                fontWeight: 600, fontSize: 14,
                                                color: isCurrentUser ? 'var(--green)' : 'var(--text-primary)',
                                                fontFamily: 'Outfit, sans-serif',
                                            }}>
                                                {player.name}
                                                {isCurrentUser && <span style={{ fontSize: 11, marginLeft: 6, color: 'var(--green)', opacity: 0.7 }}>({t('common.you') || 'вы'})</span>}
                                            </div>
                                            {player.position && (
                                                <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                                                    {player.position}
                                                </div>
                                            )}
                                        </div>
                                        <span style={{
                                            fontSize: 11, fontWeight: 700,
                                            padding: '2px 8px', borderRadius: 6,
                                            background: team === 'A' ? `${teamAColor}20` : `${teamBColor}20`,
                                            color: team === 'A' ? teamAColor : teamBColor,
                                        }}>
                                            {team === 'A' ? (game.teamAName || t('game.detail.team1')) : (game.teamBName || t('game.detail.team2'))}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* ── GAME INFO ────────────────────────────── */}
                {game.description && (
                    <div style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 16, padding: '20px',
                        marginBottom: 16,
                    }}>
                        <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1, fontFamily: 'Outfit, sans-serif' }}>
                            {t('common.description')}
                        </div>
                        <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: 14, lineHeight: 1.6 }}>
                            {game.description}
                        </p>
                    </div>
                )}

                {/* Map */}
                {game.latitude && game.longitude && (
                    <div style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 16, padding: '20px',
                        marginBottom: 16,
                    }}>
                        <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1, fontFamily: 'Outfit, sans-serif' }}>
                            {t('common.place')}
                        </div>
                        <GameMap latitude={game.latitude} longitude={game.longitude} popupText={stadiumName || game.location} />
                    </div>
                )}

                {/* ── TACTICAL BOARD (collapsible) ─────────── */}
                <div id="tactics-section" style={{
                    background: 'var(--bg-card)',
                    border: `1px solid ${isSelectionMode ? 'rgba(0,232,122,0.4)' : 'var(--border-color)'}`,
                    borderRadius: 16, marginBottom: 16,
                    overflow: 'hidden',
                    transition: 'border-color 0.2s',
                }}>
                    <button
                        onClick={() => setTacticsExpanded(!tacticsExpanded)}
                        style={{
                            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '16px 20px', background: 'none', border: 'none', cursor: 'pointer',
                        }}
                    >
                        <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>
                            {t('game.detail.teamComposition')}
                        </span>
                        <span style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>
                            {tacticsExpanded ? <UpOutlined /> : <DownOutlined />}
                        </span>
                    </button>

                    {tacticsExpanded && (
                        <div style={{ padding: '0 20px 20px' }}>
                            {/* Power Balance — only when players exist */}
                            {currentPlayers > 0 && <PowerBalance players={game.players} />}

                            {isOrganizer && !isFinished && (
                                <>
                                    <KitSelector
                                        teamAColor={teamAColor}
                                        teamBColor={teamBColor}
                                        onColorChange={handleColorChange}
                                        isOrganizer={isOrganizer}
                                    />
                                    <div style={{ marginBottom: 20 }}>
                                        <FormationSelector
                                            formationA={formationA}
                                            formationB={formationB}
                                            onFormationChange={handleFormationChange}
                                            isOrganizer={isOrganizer}
                                            gameFormat={game.format}
                                        />
                                    </div>
                                </>
                            )}

                            {/* Draft controls */}
                            {isOrganizer && !isFinished && (game.players?.length > 1) && (
                                <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                                    {draftMode ? (
                                        <>
                                            <ActionBtn
                                                icon={<FireOutlined />}
                                                label={t('game.detail.smartDraftAgain')}
                                                onClick={handleSmartDraft}
                                                loading={balancing}
                                                variant="ghost"
                                            />
                                            <ActionBtn
                                                icon={<CloseOutlined />}
                                                label={t('common.cancel')}
                                                onClick={handleCancelDraft}
                                                variant="danger"
                                            />
                                            <ActionBtn
                                                icon={<CheckCircleOutlined />}
                                                label={t('common.save')}
                                                onClick={handleApplyDraft}
                                                loading={updating}
                                                variant="green"
                                            />
                                        </>
                                    ) : (
                                        <ActionBtn
                                            icon={<ThunderboltOutlined />}
                                            label={`Smart Draft — ${t('game.detail.balanceDistributed') || 'распределить команды'}`}
                                            onClick={handleSmartDraft}
                                            variant="ghost"
                                        />
                                    )}
                                    <div style={{ marginLeft: 'auto' }}>
                                        <ActionBtn
                                            icon={<DownloadOutlined />}
                                            label={t('game.detail.downloadLineup')}
                                            onClick={handleShareLineup}
                                            variant="ghost"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Selection mode hint */}
                            {isSelectionMode && (
                                <div style={{
                                    marginBottom: 12,
                                    padding: '10px 14px',
                                    background: isInviteFlow ? 'rgba(114,46,209,0.12)' : 'rgba(0,232,122,0.08)',
                                    border: `1px solid ${isInviteFlow ? 'rgba(114,46,209,0.3)' : 'rgba(0,232,122,0.25)'}`,
                                    borderRadius: 10,
                                    fontSize: 13, color: 'var(--text-primary)',
                                    fontFamily: 'Outfit, sans-serif',
                                }}>
                                    {isInviteFlow ? t('game.detail.inviteAccepted') : t('game.detail.selectPositionHint')}
                                </div>
                            )}

                            {/* Tactical field */}
                            <div id="tactical-board">
                                <DualTeamFieldView
                                    players={draftMode ? previewPlayers : (game.players || [])}
                                    teamAName={game.teamAName || t('game.detail.team1')}
                                    teamBName={game.teamBName || t('game.detail.team2')}
                                    teamAColor={teamAColor}
                                    teamBColor={teamBColor}
                                    formationA={formationA}
                                    formationB={formationB}
                                    onPlayerClick={(player) => { setSelectedPlayer(player); setPlayerModalVisible(true); }}
                                    onPositionClick={handlePositionClick}
                                    hideEmptySlots={!isSelectionMode && (isFull || currentPlayers >= maxPlayers)}
                                    gameFormat={game.format}
                                    isSelectionMode={isSelectionMode}
                                    isAnimating={smartDraftVisible}
                                />
                            </div>

                            {/* Confirm position buttons — right under the field */}
                            {isSelectionMode && (
                                <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                                    <button
                                        onClick={() => { setIsSelectionMode(false); setSelectedPosition(null); }}
                                        style={{
                                            height: 44, padding: '0 20px',
                                            background: 'transparent',
                                            border: '1px solid var(--border-color)',
                                            borderRadius: 10, color: 'var(--text-secondary)',
                                            fontFamily: 'Outfit, sans-serif', fontWeight: 600,
                                            fontSize: 14, cursor: 'pointer',
                                        }}
                                    >
                                        {t('common.cancel')}
                                    </button>
                                    <button
                                        onClick={handleJoinWithPosition}
                                        disabled={!selectedPosition || joining}
                                        style={{
                                            flex: 1, height: 44,
                                            background: selectedPosition ? 'var(--green)' : 'var(--bg-raised)',
                                            border: 'none', borderRadius: 10,
                                            color: selectedPosition ? '#060c18' : 'var(--text-tertiary)',
                                            fontFamily: 'Outfit, sans-serif', fontWeight: 700,
                                            fontSize: 14, cursor: selectedPosition ? 'pointer' : 'default',
                                            transition: 'all 0.2s',
                                            boxShadow: selectedPosition ? '0 0 20px rgba(0,232,122,0.25)' : 'none',
                                        }}
                                    >
                                        {selectedPosition
                                            ? t('game.detail.confirmRegistration')
                                            : t('game.detail.selectPositionHint')
                                        }
                                    </button>
                                </div>
                            )}

                            {/* Legend */}
                            <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 16, flexWrap: 'wrap' }}>
                                {[
                                    { color: teamAColor, label: game.teamAName || t('game.detail.team1') },
                                    { color: teamBColor, label: game.teamBName || t('game.detail.team2') },
                                    { color: 'rgba(255,255,255,0.2)', label: t('game.detail.freePosition') },
                                ].map(({ color, label }) => (
                                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <div style={{ width: 12, height: 12, borderRadius: '50%', background: color, flexShrink: 0 }} />
                                        <span style={{ color: 'var(--text-tertiary)', fontSize: 12, fontFamily: 'Outfit, sans-serif' }}>{label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* ── CHAT ─────────────────────────────────── */}
                {isParticipant && (
                    <GameChat gameId={id} currentUser={currentUser} />
                )}
            </div>

            {/* ── MODALS ───────────────────────────────────── */}
            <MvpReveal
                visible={mvpRevealVisible}
                mvpPlayer={game?.players?.find(p => p.id === game.mvpId)}
                onClose={() => setMvpRevealVisible(false)}
            />
            <PrivateInviteModal
                visible={privateInviteModalVisible}
                onClose={() => setPrivateInviteModalVisible(false)}
                gameId={game.id}
                gameTitle={game.title}
                currentPlayers={game.players}
            />

            {/* Finish Game Modal */}
            <Modal
                title={t('game.finish.title')}
                open={isFinishModalVisible}
                onCancel={() => setIsFinishModalVisible(false)}
                footer={null}
                width={400}
            >
                <Form form={finishForm} onFinish={handleFinishGame} layout="vertical">
                    <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: 20 }}>
                        {t('game.finish.hint')}
                    </p>
                    <div style={{ display: 'flex', gap: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
                        <Form.Item name="scoreTeamA" label={t('game.finish.team1')} initialValue={0} rules={[{ required: true }]}>
                            <InputNumber min={0} size="large" />
                        </Form.Item>
                        <span style={{ fontSize: 24, fontWeight: 'bold' }}>:</span>
                        <Form.Item name="scoreTeamB" label={t('game.finish.team2')} initialValue={0} rules={[{ required: true }]}>
                            <InputNumber min={0} size="large" />
                        </Form.Item>
                    </div>
                    <Button type="primary" htmlType="submit" block loading={startingFinish} style={{ marginTop: 16 }}>
                        {t('game.finish.saveScore')}
                    </Button>
                </Form>
            </Modal>

            {/* Claim Stats Modal */}
            <Modal
                title={t('game.claimStats.title')}
                open={isClaimStatsModalVisible}
                onCancel={() => setIsClaimStatsModalVisible(false)}
                footer={null}
                width={350}
            >
                <Form form={claimForm} onFinish={handleClaimStats} layout="vertical">
                    <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: 20 }}>
                        {t('game.claimStats.score')} {game.scoreTeamA} : {game.scoreTeamB}
                    </p>
                    <Form.Item name="goals" label={t('game.claimStats.goalsQuestion')} initialValue={0} rules={[{ required: true }]}>
                        <InputNumber min={0} max={20} size="large" style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item name="assists" label={t('game.claimStats.assistsQuestion')} initialValue={0} rules={[{ required: true }]}>
                        <InputNumber min={0} max={20} size="large" style={{ width: '100%' }} />
                    </Form.Item>
                    <Button type="primary" htmlType="submit" block loading={claimingStats}>
                        {t('game.claimStats.submit')}
                    </Button>
                </Form>
            </Modal>

            {/* Validate Stats Modal */}
            <Modal
                title={t('game.validateStats.title')}
                open={isValidateStatsModalVisible}
                onCancel={() => setIsValidateStatsModalVisible(false)}
                footer={null}
                width={900}
            >
                <div style={{ textAlign: 'center', marginBottom: 20 }}>
                    <div style={{
                        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                        borderRadius: 12, padding: '16px 24px', display: 'inline-block'
                    }}>
                        <span style={{ fontSize: 32, fontWeight: 'bold', color: '#fff' }}>
                            {game.scoreTeamA} : {game.scoreTeamB}
                        </span>
                    </div>
                </div>
                <Form form={validateForm} layout="vertical">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                        <Card title={<span style={{ color: '#ff4d4f' }}>🔴 {t('game.validateStats.teamA')}</span>} size="small" style={{ borderColor: '#ff4d4f' }}>
                            {(game.players || []).filter((_, idx) => idx < (game.maxPlayers || 10) / 2).map(player => {
                                const claimed = game.pendingPlayerStats?.[player.id];
                                return (
                                    <div key={player.id} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, padding: 8, background: 'rgba(255,77,79,0.05)', borderRadius: 8 }}>
                                        <Avatar size={48} src={player.avatar} icon={<UserOutlined />} style={{ border: '2px solid #ff4d4f' }}>
                                            {player.name?.charAt(0)}
                                        </Avatar>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 500 }}>{player.name}</div>
                                            <div style={{ fontSize: 11, color: '#888' }}>
                                                {claimed ? `${t('game.validateStats.claimed')} ⚽${claimed.goals} 👟${claimed.assists}` : t('game.validateStats.notClaimed')}
                                            </div>
                                        </div>
                                        <Form.Item name={[player.id, 'goals']} initialValue={claimed?.goals || 0} style={{ marginBottom: 0, width: 60 }}>
                                            <InputNumber min={0} size="small" placeholder="⚽" style={{ width: 55 }} />
                                        </Form.Item>
                                        <Form.Item name={[player.id, 'assists']} initialValue={claimed?.assists || 0} style={{ marginBottom: 0, width: 60 }}>
                                            <InputNumber min={0} size="small" placeholder="👟" style={{ width: 55 }} />
                                        </Form.Item>
                                    </div>
                                );
                            })}
                        </Card>
                        <Card title={<span style={{ color: '#1890ff' }}>🔵 {t('game.validateStats.teamB')}</span>} size="small" style={{ borderColor: '#1890ff' }}>
                            {(game.players || []).filter((_, idx) => idx >= (game.maxPlayers || 10) / 2).map(player => {
                                const claimed = game.pendingPlayerStats?.[player.id];
                                return (
                                    <div key={player.id} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, padding: 8, background: 'rgba(24,144,255,0.05)', borderRadius: 8 }}>
                                        <Avatar size={48} src={player.avatar} icon={<UserOutlined />} style={{ border: '2px solid #1890ff' }}>
                                            {player.name?.charAt(0)}
                                        </Avatar>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 500 }}>{player.name}</div>
                                            <div style={{ fontSize: 11, color: '#888' }}>
                                                {claimed ? `${t('game.validateStats.claimed')} ⚽${claimed.goals} 👟${claimed.assists}` : t('game.validateStats.notClaimed')}
                                            </div>
                                        </div>
                                        <Form.Item name={[player.id, 'goals']} initialValue={claimed?.goals || 0} style={{ marginBottom: 0, width: 60 }}>
                                            <InputNumber min={0} size="small" placeholder="⚽" style={{ width: 55 }} />
                                        </Form.Item>
                                        <Form.Item name={[player.id, 'assists']} initialValue={claimed?.assists || 0} style={{ marginBottom: 0, width: 60 }}>
                                            <InputNumber min={0} size="small" placeholder="👟" style={{ width: 55 }} />
                                        </Form.Item>
                                    </div>
                                );
                            })}
                        </Card>
                    </div>
                    <Button type="primary" block onClick={handleValidateStats} loading={validatingStats} style={{ marginTop: 24, height: 44 }}>
                        {t('game.validateStats.confirmBtn')}
                    </Button>
                </Form>
            </Modal>

            {/* MVP Voting Modal */}
            <Modal
                title={t('game.mvpVoting.title')}
                open={isMvpVotingModalVisible}
                onCancel={() => setIsMvpVotingModalVisible(false)}
                footer={null}
                width={400}
            >
                <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: 20 }}>
                    {t('game.mvpVoting.hint')}
                </p>
                <List
                    dataSource={getTeammates()}
                    renderItem={(player) => (
                        <List.Item actions={[
                            <Button type="primary" onClick={() => handleMvpVote(player.id)} loading={castingVote}>
                                {t('game.mvpVoting.vote')}
                            </Button>
                        ]}>
                            <List.Item.Meta
                                avatar={<Avatar src={player.avatar} icon={<UserOutlined />} size={48} />}
                                title={player.name}
                                description={player.position?.toUpperCase()}
                            />
                        </List.Item>
                    )}
                />
                {getTeammates().length === 0 && (
                    <p style={{ textAlign: 'center', color: 'var(--text-tertiary)' }}>{t('game.mvpVoting.noPlayers')}</p>
                )}
            </Modal>

            <GameRatingModal
                visible={isRatingModalVisible}
                onClose={() => setIsRatingModalVisible(false)}
                players={game.players || []}
                gameId={game.id}
            />
            <PaymentModal
                visible={isPaymentModalVisible}
                onCancel={() => setIsPaymentModalVisible(false)}
                onSuccess={handlePaymentSuccess}
                game={game}
                user={userProfile || currentUser}
            />
            <PostGameModal
                visible={isPostGameModalVisible}
                onClose={() => setIsPostGameModalVisible(false)}
                game={game}
                currentUser={currentUser}
            />

            {/* Player Profile Modal */}
            <Modal
                title={null}
                open={playerModalVisible}
                onCancel={() => { setPlayerModalVisible(false); setSelectedPlayer(null); setFullPlayerData(null); }}
                footer={null}
                width={400}
                centered
            >
                {playerLoading ? (
                    <div style={{ textAlign: 'center', padding: '40px 0' }}><Spin size="large" /></div>
                ) : fullPlayerData ? (
                    <div style={{ textAlign: 'center', padding: '20px 0' }}>
                        <Avatar
                            size={100}
                            src={fullPlayerData.avatar}
                            icon={<UserOutlined />}
                            style={{ border: '4px solid var(--green)', boxShadow: '0 8px 24px rgba(0,232,122,0.2)', marginBottom: 16 }}
                        >
                            {!fullPlayerData.avatar && fullPlayerData.name?.charAt(0)?.toUpperCase()}
                        </Avatar>
                        <h2 style={{ margin: '0 0 8px 0', fontSize: 22, fontFamily: 'Syne, sans-serif', fontWeight: 800 }}>
                            {fullPlayerData.name || t('common.player')}
                        </h2>
                        {fullPlayerData.position && (
                            <Tag color="blue" style={{ marginBottom: 16 }}>{fullPlayerData.position.toUpperCase()}</Tag>
                        )}
                        <Divider style={{ margin: '16px 0' }} />
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            {[
                                { label: t('common.rating'), value: fullPlayerData.averageRating?.toFixed(1) || '—', color: 'var(--green)' },
                                { label: t('game.detail.gamesPlayed'), value: fullPlayerData.gamesPlayed || 0, color: '#52c41a' },
                                { label: t('game.detail.totalGoals'), value: fullPlayerData.totalGoals || 0, color: '#f04438' },
                                { label: t('game.detail.totalAssists'), value: fullPlayerData.totalAssists || 0, color: '#faad14' },
                            ].map(({ label, value, color }) => (
                                <div key={label} style={{ padding: 12, background: 'var(--bg-raised)', borderRadius: 10 }}>
                                    <div style={{ fontSize: 22, fontWeight: 800, color, fontFamily: 'Syne, sans-serif' }}>{value}</div>
                                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{label}</div>
                                </div>
                            ))}
                        </div>
                        {fullPlayerData.manOfTheMatchCount > 0 && (
                            <div style={{ marginTop: 16, padding: 12, background: 'rgba(250,173,20,0.1)', borderRadius: 10 }}>
                                <span style={{ fontWeight: 700, color: '#faad14' }}>
                                    MVP x{fullPlayerData.manOfTheMatchCount}
                                </span>
                            </div>
                        )}
                        <Button
                            type="primary"
                            style={{ marginTop: 20, width: '100%' }}
                            onClick={() => { navigate(`/player/${fullPlayerData.id}`); setPlayerModalVisible(false); }}
                        >
                            {t('game.detail.goToFullProfile')}
                        </Button>
                    </div>
                ) : null}
            </Modal>

            {/* Invites Drawer */}
            <Drawer
                title={t('game.detail.invitedPlayers')}
                placement="right"
                onClose={() => setInvitesDrawerVisible(false)}
                open={invitesDrawerVisible}
                width={460}
            >
                {/* Статистика приглашений */}
                {invites.length > 0 && (() => {
                    const pending  = invites.filter(i => i.status === 'pending').length;
                    const accepted = invites.filter(i => i.status === 'accepted').length;
                    const declined = invites.filter(i => i.status === 'declined').length;
                    return (
                        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                            {[
                                { label: 'Ожидают', value: pending,  color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
                                { label: 'Приняли', value: accepted, color: '#00e87a', bg: 'rgba(0,232,122,0.1)' },
                                { label: 'Отказали', value: declined, color: '#f04438', bg: 'rgba(240,68,56,0.1)' },
                            ].map(({ label, value, color, bg }) => (
                                <div key={label} style={{
                                    flex: 1, textAlign: 'center', padding: '12px 8px',
                                    background: bg, borderRadius: 10,
                                    border: `1px solid ${color}25`,
                                }}>
                                    <div style={{ fontSize: 22, fontWeight: 800, color, fontFamily: 'Syne, sans-serif' }}>{value}</div>
                                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'Outfit, sans-serif' }}>{label}</div>
                                </div>
                            ))}
                        </div>
                    );
                })()}

                {invites.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-tertiary)', fontSize: 14 }}>
                        Приглашений пока нет. Используй Smart Invite чтобы автоматически найти игроков.
                    </div>
                ) : (
                    <Table
                        dataSource={invites}
                        rowKey="id"
                        pagination={false}
                        size="small"
                        columns={[
                            {
                                title: t('game.detail.playerCol'), key: 'player',
                                render: (_, record) => (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <Avatar size={36} src={record.avatar} icon={<UserOutlined />} />
                                        <div>
                                            <div style={{ fontWeight: 500 }}>{record.name}</div>
                                            {record.inviteType === 'urgent' && (
                                                <div style={{ fontSize: 11, color: '#f59e0b' }}>🔥 Срочное</div>
                                            )}
                                            {record.inviteType === 'smart' && (
                                                <div style={{ fontSize: 11, color: '#9254de' }}>⚡ Smart Invite</div>
                                            )}
                                        </div>
                                    </div>
                                )
                            },
                            {
                                title: t('common.status'), dataIndex: 'status', key: 'status', width: 120,
                                render: (status) => {
                                    const cfg = {
                                        pending:   { color: 'orange', label: t('game.detail.inviteStatus.pending') },
                                        accepted:  { color: 'green',  label: t('game.detail.inviteStatus.accepted') },
                                        declined:  { color: 'red',    label: t('game.detail.inviteStatus.declined') },
                                        slot_taken:{ color: 'default',label: t('game.detail.inviteStatus.slot_taken') },
                                    };
                                    const c = cfg[status] || { color: 'default', label: status };
                                    return <Tag color={c.color}>{c.label}</Tag>;
                                }
                            }
                        ]}
                    />
                )}
            </Drawer>
        </div>
    );
};

export default GameDetailPage;
