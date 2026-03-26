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

const JoinGameModal = ({ game, visible, onClose, onSuccess }) => {
    const [joinGame, { isLoading }] = useJoinGameMutation();
    const { t } = useTranslation();

    if (!game) return null;

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        const options = { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' };
        return date.toLocaleDateString('ru-RU', options);
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

    const spotsLeft = game.maxPlayers - game.currentPlayers;

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
                            <strong style={{ color: 'var(--primary-color)' }}>{game.currentPlayers}</strong> / {game.maxPlayers}
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
                        {game.organizer}
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

                <div style={{
                    marginTop: 24,
                    padding: 16,
                    background: 'rgba(255, 193, 7, 0.1)',
                    borderRadius: 12,
                    border: '1px solid rgba(255, 193, 7, 0.3)'
                }}>
                    <p style={{
                        color: '#faad14',
                        margin: 0,
                        fontSize: 13
                    }}>
                        ⚠️ {t('game.join.warning')}
                    </p>
                </div>

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
                        {t('game.join.confirm')}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default JoinGameModal;
