import React, { useState } from 'react';
import { Modal, List, Avatar, Checkbox, Input, Button, message, Empty, Spin } from 'antd';
import { SearchOutlined, UserAddOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useGetFriendsQuery } from '../../../store/authApi';
import { useSendPrivateInvitesMutation } from '../../../store/gamesApi';
import { useTranslation } from 'react-i18next';

const PrivateInviteModal = ({ visible, onClose, gameId, gameTitle, currentPlayers = [] }) => {
    const { t } = useTranslation();
    const [selectedFriends, setSelectedFriends] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    // Get current user ID
    // In a real app, this should come from a centralized auth context/hook
    const user = JSON.parse(localStorage.getItem('user'));
    const userId = user?.id;

    const { data: friends = [], isLoading } = useGetFriendsQuery(userId, {
        skip: !visible || !userId
    });

    const [sendPrivateInvites, { isLoading: isSending }] = useSendPrivateInvitesMutation();

    // Filter logic
    const filteredFriends = friends.filter(friend => {
        const matchesSearch = friend.name.toLowerCase().includes(searchTerm.toLowerCase());
        // Check if friend is already in the game players list
        const isAlreadyInGame = currentPlayers.some(p => p.id === friend.id);
        return matchesSearch && !isAlreadyInGame;
    });

    const handleToggle = (friendId) => {
        setSelectedFriends(prev => {
            if (prev.includes(friendId)) {
                return prev.filter(id => id !== friendId);
            } else {
                return [...prev, friendId];
            }
        });
    };

    const handleSend = async () => {
        if (selectedFriends.length === 0) return;

        try {
            await sendPrivateInvites({
                id: gameId,
                playerIds: selectedFriends
            }).unwrap();

            message.success(t('game.privateInvite.success', { n: selectedFriends.length }));
            setSelectedFriends([]);
            onClose();
        } catch (error) {
            console.error('Invite error:', error);
            message.error(t('game.privateInvite.error'));
        }
    };

    return (
        <Modal
            title={t('game.privateInvite.title', { title: gameTitle || '' })}
            open={visible}
            onCancel={onClose}
            confirmLoading={isSending}
            onOk={handleSend}
            okText={t('game.privateInvite.sendBtn', { n: selectedFriends.length })}
            okButtonProps={{ disabled: selectedFriends.length === 0 }}
        >
            <Input
                placeholder={t('game.privateInvite.searchPlaceholder')}
                prefix={<SearchOutlined />}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ marginBottom: 16 }}
                allowClear
            />

            {isLoading ? (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                    <Spin />
                </div>
            ) : filteredFriends.length > 0 ? (
                <List
                    itemLayout="horizontal"
                    dataSource={filteredFriends}
                    renderItem={friend => (
                        <List.Item
                            onClick={() => handleToggle(friend.id)}
                            style={{ cursor: 'pointer', padding: '8px 12px', borderRadius: 8, transition: 'background 0.2s' }}
                            className="hover:bg-gray-50"
                        >
                            <List.Item.Meta
                                avatar={<Avatar src={friend.avatar} icon={<UserAddOutlined />} />}
                                title={friend.name}
                                description={friend.position}
                            />
                            <Checkbox
                                checked={selectedFriends.includes(friend.id)}
                                onClick={(e) => e.stopPropagation()}
                                onChange={() => handleToggle(friend.id)}
                            />
                        </List.Item>
                    )}
                    style={{ maxHeight: 300, overflowY: 'auto' }}
                />
            ) : (
                <Empty description={friends.length === 0 ? "У вас пока нет друзей" : "Никого не найдено"} />
            )}

            {selectedFriends.length > 0 && (
                <div style={{ marginTop: 16, textAlign: 'right', color: 'var(--text-secondary)' }}>
                    Выбрано: {selectedFriends.length}
                </div>
            )}
        </Modal>
    );
};

export default PrivateInviteModal;
