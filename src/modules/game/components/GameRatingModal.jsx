import { Modal, List, Rate, Input, Button, Avatar, message, Select } from 'antd';
import { UserOutlined, StarOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSubmitRatingMutation } from '../../../store/authApi';

const GameRatingModal = ({ visible, onClose, players, gameId }) => {
    const { t } = useTranslation();
    const [submitRating, { isLoading }] = useSubmitRatingMutation();
    const [ratings, setRatings] = useState({});
    const currentUser = JSON.parse(localStorage.getItem('user'));

    // Filter out current user
    const playersToRate = players.filter(p => p.id !== currentUser?.id);

    const handleRateChange = (playerId, type, value) => {
        setRatings(prev => ({
            ...prev,
            [playerId]: {
                ...prev[playerId],
                [type]: value
            }
        }));
    };

    const [mvpVote, setMvpVote] = useState(null);

    const handleSubmitAll = async () => {
        const ratingsToSend = [];

        for (const player of playersToRate) {
            const ratingData = ratings[player.id];
            // Skip if no rating given at all
            if (!ratingData) continue;

            // If partially rated, warn
            if (!ratingData.skill || !ratingData.behavior) {
                message.warning(t('game.rating.validationError', { name: player.name }));
                return;
            }

            ratingsToSend.push({
                ratedUserId: player.id,
                skillRating: ratingData.skill,
                behaviorRating: ratingData.behavior,
                comment: ratingData.comment
            });
        }

        if (ratingsToSend.length === 0 && !mvpVote) {
            message.warning(t('game.rating.noVoteError'));
            return;
        }

        try {
            await submitRating({
                gameId,
                ratings: ratingsToSend,
                mvpVoteUserId: mvpVote
            }).unwrap();

            message.success(t('game.rating.success'));
            localStorage.setItem(`rated_game_${gameId}`, 'true');
            onClose();
            setRatings({});
            setMvpVote(null);
        } catch (error) {
            console.error(error);
            message.error(error.data?.message || t('game.rating.error'));
        }
    };

    return (
        <Modal
            title={t('game.rating.title')}
            open={visible}
            onCancel={onClose}
            width={600}
            footer={[
                <Button key="cancel" onClick={onClose}>
                    {t('game.rating.cancel')}
                </Button>,
                <Button
                    key="submit"
                    type="primary"
                    onClick={handleSubmitAll}
                    loading={isLoading}
                >
                    {t('game.rating.rateAll')}
                </Button>
            ]}
        >
            <div style={{ marginBottom: 24, padding: 16, background: '#fffbe6', borderRadius: 8, border: '1px solid #ffe58f' }}>
                <h4 style={{ margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <StarOutlined style={{ color: '#faad14' }} />
                    <span style={{ color: '#faad14' }}>{t('game.rating.mvpTitle')}</span>
                </h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span>{t('game.rating.mvpQuestion')}</span>
                    <Select
                        style={{ width: 250 }}
                        placeholder={t('game.rating.mvpSelect')}
                        onChange={(val) => setMvpVote(val)}
                        value={mvpVote}
                    >
                        {playersToRate.map(p => (
                            <Select.Option key={p.id} value={p.id}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Avatar size="small" src={p.avatar} icon={<UserOutlined />} />
                                    {p.name}
                                </div>
                            </Select.Option>
                        ))}
                    </Select>
                </div>
            </div>

            <List
                itemLayout="horizontal"
                dataSource={playersToRate}
                renderItem={(player) => (
                    <List.Item>

                        <List.Item.Meta
                            avatar={<Avatar icon={<UserOutlined />} src={player.avatar} />}
                            title={player.name}
                            description={
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <span>{t('game.rating.skill')}</span>
                                        <Rate
                                            value={ratings[player.id]?.skill || 0}
                                            onChange={(val) => handleRateChange(player.id, 'skill', val)}
                                        />
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <span>{t('game.rating.behavior')}</span>
                                        <Rate
                                            value={ratings[player.id]?.behavior || 0}
                                            onChange={(val) => handleRateChange(player.id, 'behavior', val)}
                                        />
                                    </div>
                                </div>
                            }
                        />
                    </List.Item>
                )}
            />
        </Modal>
    );
};

export default GameRatingModal;
