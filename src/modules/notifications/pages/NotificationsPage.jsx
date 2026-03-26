import { useNavigate } from 'react-router-dom';
import { Button, Avatar, Empty, Spin } from 'antd';
import {
    BellOutlined, CheckCircleOutlined, CloseCircleOutlined,
    TrophyOutlined, TeamOutlined, WalletOutlined,
    BarChartOutlined, UserAddOutlined, CheckOutlined,
    StarOutlined, ExclamationCircleOutlined,
} from '@ant-design/icons';
import { useGetMyNotificationsQuery, useMarkAsReadMutation, useMarkAllAsReadMutation } from '../../../store/notificationsApi';
import { useGetProfileQuery } from '../../../store/authApi';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import 'dayjs/locale/ru';
import 'dayjs/locale/az';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

/* ─── Navigation mapping ────────────────────────────────────────── */
const getTarget = (notification) => {
    const meta = notification.metadata || {};
    switch (notification.type) {
        case 'GAME_INVITE':       return meta.gameId ? `/games/${meta.gameId}` : '/profile';
        case 'INVITE_ACCEPTED':   return meta.gameId ? `/games/${meta.gameId}` : null;
        case 'PAYMENT_SUCCESS':   return meta.gameId ? `/games/${meta.gameId}` : null;
        case 'GAME_CANCELED':     return '/games';
        case 'GAME_CANCELLED':    return '/games';
        case 'PENALTY':           return meta.gameId ? `/games/${meta.gameId}` : '/games';
        case 'CLAIM_STATS':       return meta.gameId ? `/games/${meta.gameId}` : null;
        case 'STATS_CLAIMED':     return meta.gameId ? `/games/${meta.gameId}` : null;
        case 'GAME_COMPLETED':    return meta.gameId ? `/games/${meta.gameId}` : null;
        case 'RATE_PLAYERS':      return meta.gameId ? `/games/${meta.gameId}` : null;
        case 'TEAM_INVITE':       return meta.teamId ? `/teams/${meta.teamId}` : '/profile';
        case 'TEAM_JOIN_REQUEST': return meta.teamId ? `/teams/${meta.teamId}` : null;
        case 'BOOKING_CONFIRMED': return meta.gameId ? `/games/${meta.gameId}` : null;
        default:                  return null;
    }
};

/* ─── Icon + color config ───────────────────────────────────────── */
const TYPE_CONFIG = {
    GAME_INVITE:       { icon: <BellOutlined />,              color: '#faad14', bg: 'rgba(250,173,20,0.12)',   label: 'Приглашение' },
    INVITE_ACCEPTED:   { icon: <UserAddOutlined />,            color: '#00e87a', bg: 'rgba(0,232,122,0.1)',    label: 'Принято' },
    PAYMENT_SUCCESS:   { icon: <WalletOutlined />,             color: '#00e87a', bg: 'rgba(0,232,122,0.1)',    label: 'Оплата' },
    GAME_CANCELED:     { icon: <CheckCircleOutlined />,        color: '#1890ff', bg: 'rgba(24,144,255,0.1)',   label: 'Возврат' },
    GAME_CANCELLED:    { icon: <CloseCircleOutlined />,        color: '#ff4d4f', bg: 'rgba(255,77,79,0.1)',    label: 'Отмена' },
    PENALTY:           { icon: <ExclamationCircleOutlined />,  color: '#ff4d4f', bg: 'rgba(255,77,79,0.1)',    label: 'Штраф' },
    CLAIM_STATS:       { icon: <BarChartOutlined />,           color: '#a855f7', bg: 'rgba(168,85,247,0.1)',   label: 'Статистика' },
    STATS_CLAIMED:     { icon: <BarChartOutlined />,           color: '#a855f7', bg: 'rgba(168,85,247,0.1)',   label: 'Статистика' },
    GAME_COMPLETED:    { icon: <StarOutlined />,               color: '#faad14', bg: 'rgba(250,173,20,0.12)',  label: 'Завершено' },
    RATE_PLAYERS:      { icon: <StarOutlined />,               color: '#a855f7', bg: 'rgba(168,85,247,0.1)',   label: 'Оценка' },
    TEAM_INVITE:       { icon: <TeamOutlined />,               color: '#1890ff', bg: 'rgba(24,144,255,0.1)',   label: 'Команда' },
    TEAM_JOIN_REQUEST: { icon: <UserAddOutlined />,            color: '#1890ff', bg: 'rgba(24,144,255,0.1)',   label: 'Запрос' },
    BOOKING_CONFIRMED: { icon: <CheckCircleOutlined />,        color: '#00e87a', bg: 'rgba(0,232,122,0.1)',    label: 'Бронь' },
};

const getConfig = (type) => TYPE_CONFIG[type] || {
    icon: <BellOutlined />, color: '#8c8c8c', bg: 'rgba(140,140,140,0.1)', label: 'Уведомление',
};

/* ─── Build title/message from type + metadata ─────────────────── */
const buildNotifText = (item, t) => {
    const m = item.metadata || {};
    const type = item.type;
    const title = t(`notifications.titles.${type}`, { defaultValue: item.title || type });

    let message;
    const fmt = (iso) => iso ? new Date(iso).toLocaleDateString() : '';

    switch (type) {
        case 'INVITE_ACCEPTED':
            message = t('notifications.messages.INVITE_ACCEPTED', { playerName: m.playerName, playerCount: m.playerCount, maxPlayers: m.maxPlayers });
            break;
        case 'PAYMENT_SUCCESS':
            message = t('notifications.messages.PAYMENT_SUCCESS', { amount: m.amount });
            break;
        case 'BOOKING_CONFIRMED':
            message = t('notifications.messages.BOOKING_CONFIRMED', { date: fmt(m.date), time: m.time, playerCount: m.playerCount });
            break;
        case 'RATE_PLAYERS':
            if (m.mvpAName && m.mvpBName) {
                message = t('notifications.messages.RATE_PLAYERS_MVP', { mvpAName: m.mvpAName, mvpBName: m.mvpBName });
            } else if (m.scoreTeamA !== undefined) {
                message = t('notifications.messages.RATE_PLAYERS_SCORE', { scoreTeamA: m.scoreTeamA, scoreTeamB: m.scoreTeamB });
            } else {
                message = t('notifications.messages.RATE_PLAYERS');
            }
            break;
        case 'GAME_CANCELED':
            message = t('notifications.messages.GAME_CANCELED');
            break;
        case 'PENALTY':
            message = t('notifications.messages.PENALTY');
            break;
        case 'PLAYER_LEFT':
            message = t('notifications.messages.PLAYER_LEFT', { playerCount: m.playerCount, minPlayers: m.minPlayers });
            break;
        case 'BOOKING_CANCELLED':
            message = t('notifications.messages.BOOKING_CANCELLED', { date: fmt(m.date) });
            break;
        case 'GAME_CANCELLED':
            message = t('notifications.messages.GAME_CANCELLED');
            break;
        case 'GAME_INVITE':
            message = t('notifications.messages.GAME_INVITE', { date: fmt(m.date), time: m.time });
            break;
        case 'CLAIM_STATS':
            message = t('notifications.messages.CLAIM_STATS', { scoreTeamA: m.scoreTeamA, scoreTeamB: m.scoreTeamB });
            break;
        case 'STATS_CLAIMED':
            message = t('notifications.messages.STATS_CLAIMED', { playerName: m.playerName, goals: m.goals, assists: m.assists });
            break;
        default:
            message = item.message || '';
    }

    return { title, message };
};

/* ─── Group notifications by date ──────────────────────────────── */
const groupByDate = (notifications, t) => {
    const groups = {};
    const today = dayjs().startOf('day');
    const yesterday = today.subtract(1, 'day');

    for (const n of notifications) {
        const d = dayjs(n.createdAt);
        let key;
        if (d.isAfter(today)) key = t('notifications.today');
        else if (d.isAfter(yesterday)) key = t('notifications.yesterday');
        else key = d.format('D MMMM YYYY');

        if (!groups[key]) groups[key] = [];
        groups[key].push(n);
    }
    return groups;
};

/* ─── Single notification row ───────────────────────────────────── */
const NotifRow = ({ item, onNavigate, onMarkRead }) => {
    const { t, i18n } = useTranslation();
    const cfg = getConfig(item.type);
    const { title, message } = buildNotifText(item, t);
    dayjs.locale(i18n.language === 'az' ? 'az' : 'ru');
    const target = getTarget(item);
    const clickable = !!target;

    const handleClick = () => {
        if (!item.isRead) onMarkRead(item.id);
        if (target) onNavigate(target);
    };

    return (
        <div
            onClick={clickable ? handleClick : undefined}
            style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 14,
                padding: '14px 16px',
                background: item.isRead ? 'var(--bg-card)' : 'rgba(0,232,122,0.04)',
                border: `1px solid ${item.isRead ? 'var(--border-color)' : 'rgba(0,232,122,0.12)'}`,
                borderRadius: 14,
                cursor: clickable ? 'pointer' : 'default',
                transition: 'border-color 0.15s, background 0.15s',
                position: 'relative',
            }}
            onMouseEnter={e => {
                if (!clickable) return;
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
                e.currentTarget.style.background = 'var(--bg-raised)';
            }}
            onMouseLeave={e => {
                if (!clickable) return;
                e.currentTarget.style.borderColor = item.isRead ? 'var(--border-color)' : 'rgba(0,232,122,0.12)';
                e.currentTarget.style.background = item.isRead ? 'var(--bg-card)' : 'rgba(0,232,122,0.04)';
            }}
        >
            {/* Unread dot */}
            {!item.isRead && (
                <div style={{
                    position: 'absolute', top: 16, right: 16,
                    width: 7, height: 7, borderRadius: '50%',
                    background: 'var(--green)',
                    boxShadow: '0 0 6px rgba(0,232,122,0.6)',
                }} />
            )}

            {/* Icon */}
            <div style={{
                width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                background: cfg.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, color: cfg.color,
            }}>
                {cfg.icon}
            </div>

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0, paddingRight: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                    <span style={{
                        fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: 14,
                        color: 'var(--text-primary)',
                    }}>
                        {title}
                    </span>
                    <span style={{
                        fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 5,
                        background: cfg.bg, color: cfg.color,
                    }}>
                        {t(`notifications.types.${item.type}`, t('notifications.types.default'))}
                    </span>
                </div>
                <div style={{
                    fontSize: 13, color: 'var(--text-secondary)',
                    lineHeight: 1.5,
                }}>
                    {message}
                </div>
                <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                        {dayjs(item.createdAt).fromNow()}
                    </span>
                    {clickable && (
                        <span style={{ fontSize: 11, color: cfg.color, fontWeight: 600 }}>
                            {t('notifications.open')}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

/* ═══════════════════════════════════════════════════════════════════
   MAIN
═══════════════════════════════════════════════════════════════════ */
const NotificationsPage = () => {
    const { t, i18n } = useTranslation();
    dayjs.locale(i18n.language === 'az' ? 'az' : 'ru');
    const navigate = useNavigate();
    const { data: profile } = useGetProfileQuery();
    const { data: notifications, isLoading } = useGetMyNotificationsQuery(profile?.id, {
        skip: !profile?.id,
        pollingInterval: 10000,
    });
    const [markAsRead] = useMarkAsReadMutation();
    const [markAllAsRead] = useMarkAllAsReadMutation();

    const unreadIds = (notifications || []).filter(n => !n.isRead).map(n => n.id);
    const unreadCount = unreadIds.length;
    const groups = groupByDate(notifications || [], t);

    const handleMarkAll = () => {
        if (unreadIds.length > 0) markAllAsRead(unreadIds);
    };

    if (isLoading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Spin size="large" />
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', padding: '28px 16px' }}>
            <style>{`
                @keyframes fadeUp {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>

            <div style={{ maxWidth: 720, margin: '0 auto', animation: 'fadeUp 0.3s ease' }}>

                {/* Header */}
                <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    alignItems: 'flex-start', marginBottom: 28, gap: 12,
                }}>
                    <div>
                        <h1 style={{
                            fontFamily: 'Syne, sans-serif', fontSize: 30, fontWeight: 800,
                            color: 'var(--text-primary)', margin: '0 0 4px',
                            letterSpacing: '-0.5px',
                            display: 'flex', alignItems: 'center', gap: 12,
                        }}>
                            {t('notifications.title')}
                            {unreadCount > 0 && (
                                <span style={{
                                    fontSize: 13, fontWeight: 700,
                                    background: 'var(--green)', color: '#000',
                                    padding: '2px 10px', borderRadius: 20,
                                    fontFamily: 'Outfit, sans-serif',
                                }}>
                                    {unreadCount}
                                </span>
                            )}
                        </h1>
                        <p style={{ color: 'var(--text-tertiary)', margin: 0, fontSize: 14 }}>
                            {(notifications || []).length === 0
                                ? t('notifications.noNotifs')
                                : t('notifications.count', { n: (notifications || []).length })}
                        </p>
                    </div>
                    {unreadCount > 0 && (
                        <Button
                            icon={<CheckOutlined />}
                            onClick={handleMarkAll}
                            style={{
                                background: 'var(--bg-card)',
                                border: '1px solid var(--border-color)',
                                color: 'var(--text-secondary)',
                                fontSize: 13,
                                flexShrink: 0,
                            }}
                        >
                            {t('notifications.markAllRead')}
                        </Button>
                    )}
                </div>

                {/* Content */}
                {(notifications || []).length === 0 ? (
                    <div style={{
                        textAlign: 'center', padding: '80px 20px',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 20,
                    }}>
                        <div style={{
                            width: 64, height: 64, borderRadius: 20,
                            background: 'rgba(140,140,140,0.1)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 16px',
                            fontSize: 28, color: 'var(--text-tertiary)',
                        }}>
                            <BellOutlined />
                        </div>
                        <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
                            {t('notifications.empty')}
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
                            {t('notifications.emptyDesc')}
                        </div>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
                        {Object.entries(groups).map(([dateLabel, items]) => (
                            <div key={dateLabel}>
                                {/* Date label */}
                                <div style={{
                                    fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)',
                                    textTransform: 'uppercase', letterSpacing: '0.8px',
                                    marginBottom: 10,
                                }}>
                                    {dateLabel}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    {items.map(item => (
                                        <NotifRow
                                            key={item.id}
                                            item={item}
                                            onNavigate={navigate}
                                            onMarkRead={(id) => markAsRead(id)}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotificationsPage;
