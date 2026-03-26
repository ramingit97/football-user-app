import { List, Card, Tag, DatePicker, Empty } from 'antd';
import { CalendarOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

const GameHistory = ({ games }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [filterDate, setFilterDate] = useState(null);

    const filteredGames = games.filter(game => {
        if (!filterDate) return true;
        const gameDate = new Date(game.date).toDateString();
        const filterDateStr = filterDate.toDate().toDateString();
        return gameDate === filterDateStr;
    });

    const getStatusColor = (status) => {
        switch (status) {
            case 'finished': return 'blue';
            case 'cancelled': return 'red';
            case 'full': return 'orange';
            default: return 'green';
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'finished': return t('profile.history.statusFinished');
            case 'cancelled': return t('profile.history.statusCancelled');
            case 'full': return t('profile.history.statusFull');
            default: return t('profile.history.statusOpen');
        }
    };

    return (
        <Card
            className="glass-card"
            title={t('profile.history.title')}
            extra={<DatePicker onChange={setFilterDate} placeholder={t('profile.history.dateFilter')} />}
            style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-color)' }}
        >
            {filteredGames.length > 0 ? (
                <List
                    itemLayout="horizontal"
                    dataSource={filteredGames}
                    pagination={{
                        pageSize: 5,
                        showSizeChanger: false,
                        position: 'bottom',
                        align: 'center'
                    }}
                    renderItem={(game) => (
                        <List.Item
                            style={{ cursor: 'pointer', borderBottom: '1px solid var(--border-color)' }}
                            onClick={() => navigate(`/games/${game.id}`)}
                            actions={[
                                <Tag color={getStatusColor(game.status)} key="status">
                                    {getStatusLabel(game.status)}
                                </Tag>
                            ]}
                        >
                            <List.Item.Meta
                                title={<span style={{ color: 'var(--text-primary)' }}>{game.title}</span>}
                                description={
                                    <div style={{ display: 'flex', gap: 16, color: 'var(--text-secondary)' }}>
                                        <span><CalendarOutlined /> {new Date(game.date).toLocaleDateString()}</span>
                                        <span><EnvironmentOutlined /> {game.location}</span>
                                        {game.status === 'finished' && (
                                            <span style={{ fontWeight: 'bold', color: 'var(--primary-color)' }}>
                                                {game.scoreTeamA} : {game.scoreTeamB}
                                            </span>
                                        )}
                                        {game.mvpId && (
                                            <Tag color="gold" style={{ marginLeft: 8 }}>
                                                MVP: {game.players?.find(p => p.id === game.mvpId)?.name || 'Unknown'}
                                            </Tag>
                                        )}
                                    </div>
                                }
                            />
                        </List.Item>
                    )}
                />
            ) : (
                <Empty description={<span style={{ color: 'var(--text-secondary)' }}>{t('profile.history.noGames')}</span>} />
            )}
        </Card>
    );
};

export default GameHistory;
