import { Modal, Descriptions, Tag, Button, message } from 'antd';
import {
    CalendarOutlined,
    ClockCircleOutlined,
    EnvironmentOutlined,
    TeamOutlined,
    UserOutlined
} from '@ant-design/icons';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useJoinGameMutation } from '../../../store/gamesApi';
import { formatDateLocale } from '../../../utils/dateFormat';

const JoinGameModal = ({ game, visible, onClose, onSuccess }) => {
    const [joinGame, { isLoading }] = useJoinGameMutation();
    const { t, i18n } = useTranslation();

    if (!game) return null;

    const currentUser = JSON.parse(localStorage.getItem('user') || 'null');
    const userAge = currentUser?.age ?? null;
    const gameMinAge = game.minAge ?? null;
    const gameMaxAge = game.maxAge ?? null;

    const ageLabel = gameMinAge
        ? (gameMaxAge ? `${gameMinAge}–${gameMaxAge} лет` : `${gameMinAge}+`)
        : null;

    const hasAgeRestriction = !!gameMinAge;
    const ageMatches = !hasAgeRestriction ||
        (userAge !== null && userAge >= gameMinAge && (!gameMaxAge || userAge <= gameMaxAge));
    const showAgeWarning = hasAgeRestriction && (userAge === null || !ageMatches);

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return formatDateLocale(date, i18n.language, { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' });
    };

    const handleJoin = async () => {
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            if (!user) {
                message.error(t('game.join.mustLogin'));
                return;
            }

            await joinGame({ id: game.id, player: user }).unwrap();
            message.success(t('game.join.success'));
            if (onSuccess) {
                onSuccess();
            }
            onClose();
        } catch (error) {
            message.error(error.data?.message || t('game.join.error'));
        }
    };

    const currentPlayers = game.currentPlayers ?? (Array.isArray(game.players) ? game.players.length : 0);
    const spotsLeft = game.maxPlayers - currentPlayers;

    return (
        <Modal
            title={
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 24 }}>⚽</span>
                    <span>{t('game.join.title')}</span>
                </div>
            }
            open={visible}
            onCancel={onClose}
            footer={null}
            width={500}
            centered
        >
            <div style={{ padding: '16px 0' }}>
                <h2 style={{
                    fontSize: 22,
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    marginBottom: 20
                }}>
                    {game.title}
                </h2>

                <Descriptions
                    column={1}
                    size="small"
                    labelStyle={{ color: 'var(--text-secondary)' }}
                    contentStyle={{ color: 'var(--text-primary)' }}
                >
                    <Descriptions.Item
                        label={
                            <span><CalendarOutlined style={{ marginRight: 8, color: 'var(--primary-color)' }} />{t('game.join.date')}</span>
                        }
                    >
                        {formatDate(game.date)}
                    </Descriptions.Item>

                    <Descriptions.Item
                        label={
                            <span><ClockCircleOutlined style={{ marginRight: 8, color: 'var(--primary-color)' }} />{t('game.join.time')}</span>
                        }
                    >
                        {game.time}
                    </Descriptions.Item>

                    <Descriptions.Item
                        label={
                            <span><EnvironmentOutlined style={{ marginRight: 8, color: 'var(--primary-color)' }} />{t('game.join.place')}</span>
                        }
                    >
                        {game.location}
                    </Descriptions.Item>

                    <Descriptions.Item
                        label={
                            <span><TeamOutlined style={{ marginRight: 8, color: 'var(--primary-color)' }} />{t('game.join.players')}</span>
                        }
                    >
                        <span>
                            <strong style={{ color: 'var(--primary-color)' }}>{currentPlayers}</strong> / {game.maxPlayers}
                            <Tag
                                color={spotsLeft <= 3 ? 'orange' : 'green'}
                                style={{ marginLeft: 12, borderRadius: 20 }}
                            >
                                {t('game.join.spotsLeft', { n: spotsLeft })}
                            </Tag>
                        </span>
                    </Descriptions.Item>

                    <Descriptions.Item
                        label={
                            <span><UserOutlined style={{ marginRight: 8, color: 'var(--primary-color)' }} />{t('game.join.organizer')}</span>
                        }
                    >
                        {game.organizerName || game.organizer}
                    </Descriptions.Item>
                </Descriptions>

                {game.description && (
                    <div style={{
                        marginTop: 20,
                        padding: 16,
                        background: 'rgba(82, 196, 26, 0.05)',
                        borderRadius: 12,
                        border: '1px solid var(--border-color)'
                    }}>
                        <p style={{
                            color: 'var(--text-secondary)',
                            margin: 0,
                            fontSize: 14,
                            lineHeight: 1.6
                        }}>
                            {game.description}
                        </p>
                    </div>
                )}

                {showAgeWarning ? (
                    <div style={{
                        marginTop: 20,
                        padding: 16,
                        background: 'rgba(245,158,11,0.08)',
                        borderRadius: 12,
                        border: '1px solid rgba(245,158,11,0.35)',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                            <span style={{ fontSize: 16 }}>⚠️</span>
                            <span style={{ color: '#f59e0b', fontWeight: 700, fontSize: 13 }}>
                                {t('game.join.ageRestriction')}: {ageLabel}
                            </span>
                        </div>
                        <p style={{ color: '#d97706', margin: 0, fontSize: 13, lineHeight: 1.5 }}>
                            {userAge === null
                                ? t('game.join.ageWarningNoAge', { label: ageLabel })
                                : t('game.join.ageWarningMismatch', { age: userAge, label: ageLabel })
                            }
                        </p>
                    </div>
                ) : (
                    <div style={{
                        marginTop: 20,
                        padding: 16,
                        background: 'rgba(255, 193, 7, 0.1)',
                        borderRadius: 12,
                        border: '1px solid rgba(255, 193, 7, 0.3)'
                    }}>
                        <p style={{ color: '#faad14', margin: 0, fontSize: 13 }}>
                            ⚠️ {t('game.join.warning')}
                        </p>
                    </div>
                )}

                <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
                    <Button
                        onClick={onClose}
                        style={{ flex: 1 }}
                        size="large"
                    >
                        {t('game.join.cancel')}
                    </Button>
                    <Button
                        type="primary"
                        onClick={handleJoin}
                        loading={isLoading}
                        style={{ flex: 2 }}
                        size="large"
                    >
                        {showAgeWarning ? t('game.join.confirm') : t('game.join.confirmOk')}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default JoinGameModal;
