import React from 'react';
import { Alert, Button, Typography } from 'antd';
import { FireOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

const { Text, Title } = Typography;

const UrgentBanner = ({ game, onJoin }) => {
    const { t } = useTranslation();

    if (!game.isUrgent) return null;

    const spotsLeft = game.maxPlayers - (game.players?.length || 0);
    const gameDate = new Date(`${game.date}T${game.time}`);
    const now = new Date();
    const diffMs = gameDate - now;
    const diffHrs = Math.floor(diffMs / 3600000);
    const diffMins = Math.floor((diffMs % 3600000) / 60000);

    let timeLeftStr = '';
    if (diffMs < 0) {
        timeLeftStr = t('game.urgent.started');
    } else {
        timeLeftStr = t('game.urgent.timeLeft', { h: diffHrs, m: diffMins });
    }

    return (
        <div className="animate-pulse-slow" style={{ marginBottom: 24 }}>
            <div style={{
                background: 'linear-gradient(90deg, #cf1322 0%, #ff4d4f 100%)',
                borderRadius: '12px',
                padding: '16px',
                color: 'white',
                boxShadow: '0 4px 15px rgba(245, 34, 45, 0.4)',
                border: '1px solid #ffa39e'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <FireOutlined style={{ fontSize: 24, color: '#fff566' }} />
                            <Title level={4} style={{ color: 'white', margin: 0 }}>{t('game.urgent.urgentBanner')}</Title>
                        </div>
                        <div style={{ display: 'flex', gap: 16, fontSize: 14 }}>
                            <span>
                                <ClockCircleOutlined /> {timeLeftStr}
                            </span>
                            <span>
                                👥 {t('game.urgent.needed', { n: spotsLeft })}
                            </span>
                        </div>
                    </div>

                    {onJoin && (
                        <Button
                            size="large"
                            type="primary"
                            style={{
                                background: 'white',
                                color: '#cf1322',
                                border: 'none',
                                fontWeight: 'bold',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                            }}
                            onClick={onJoin}
                        >
                            {t('game.urgent.iWillCome')} 🙋
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UrgentBanner;
