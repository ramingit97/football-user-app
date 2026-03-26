import React, { useState } from 'react';
import { List, Avatar, Button, Tabs, Input, Empty, Tag, message, Badge } from 'antd';
import { UserOutlined, UserAddOutlined, CheckOutlined, CloseOutlined, SearchOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import {
    useGetFriendsQuery,
    useGetFriendRequestsQuery,
    useRespondToFriendRequestMutation,
    useSendFriendRequestMutation,
    useLazySearchUsersQuery
} from '../../../store/authApi';
import { useNavigate } from 'react-router-dom';

const FriendsList = ({ userId }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { data: friends = [], isLoading: friendsLoading } = useGetFriendsQuery(userId);
    const { data: requests = [], isLoading: requestsLoading } = useGetFriendRequestsQuery(userId);
    const [respondToRequest, { isLoading: responding }] = useRespondToFriendRequestMutation();
    const [sendRequest, { isLoading: sending }] = useSendFriendRequestMutation();
    const [triggerSearch, { data: searchResults, isFetching: searching }] = useLazySearchUsersQuery();

    const handleRespond = async (requestId, status) => {
        try {
            await respondToRequest({ requestId, status }).unwrap();
            message.success(status === 'accepted' ? t('profile.friends.requestAccepted') : t('profile.friends.requestRejected'));
        } catch (error) {
            message.error(t('profile.friends.requestUpdateError'));
        }
    };

    const handleSearch = (value) => {
        if (value.length > 2) {
            triggerSearch({ query: value, limit: 10 });
        }
    };

    const handleAddFriend = async (receiverId) => {
        try {
            await sendRequest({ requesterId: userId, receiverId }).unwrap();
            message.success(t('profile.friends.requestSent'));
        } catch (error) {
            message.error(error.data?.message || t('profile.friends.requestSendError'));
        }
    };

    return (
        <Tabs
            defaultActiveKey="friends"
            items={[
                {
                    key: 'friends',
                    label: t('profile.friends.title', { n: friends.length }),
                    children: (
                        <List
                            loading={friendsLoading}
                            dataSource={friends}
                            renderItem={friend => (
                                <List.Item
                                    actions={[
                                        <Button type="text" onClick={() => navigate(`/profile/${friend.id}`)}>{t('profile.friends.viewProfile')}</Button>
                                    ]}
                                >
                                    <List.Item.Meta
                                        avatar={<Avatar src={friend.avatar} icon={<UserOutlined />} />}
                                        title={friend.name}
                                        description={
                                            <div className="flex gap-2">
                                                <Tag color="blue">{friend.position || t('profile.friends.player')}</Tag>
                                                <Tag color="orange">★ {friend.averageRating?.toFixed(1) || '-'}</Tag>
                                            </div>
                                        }
                                    />
                                </List.Item>
                            )}
                            locale={{ emptyText: <Empty description={t('profile.friends.noFriends')} /> }}
                        />
                    ),
                },
                {
                    key: 'requests',
                    label: <Badge count={requests.length} offset={[10, 0]}>{t('profile.friends.requests')}</Badge>,
                    children: (
                        <List
                            loading={requestsLoading}
                            dataSource={requests}
                            renderItem={req => (
                                <List.Item
                                    actions={[
                                        <Button
                                            type="text"
                                            icon={<CheckOutlined />}
                                            className="text-green-500 hover:text-green-600"
                                            onClick={() => handleRespond(req.id, 'accepted')}
                                            loading={responding}
                                        >
                                            {t('profile.friends.accept')}
                                        </Button>,
                                        <Button
                                            type="text"
                                            danger
                                            icon={<CloseOutlined />}
                                            onClick={() => handleRespond(req.id, 'rejected')}
                                            loading={responding}
                                        >
                                            {t('profile.friends.reject')}
                                        </Button>
                                    ]}
                                >
                                    <List.Item.Meta
                                        avatar={<Avatar src={req.sender?.avatar} icon={<UserOutlined />} />}
                                        title={req.sender?.name}
                                        description={t('profile.friends.wantsToAdd')}
                                    />
                                </List.Item>
                            )}
                            locale={{ emptyText: <Empty description={t('profile.friends.noRequests')} /> }}
                        />
                    ),
                },
                {
                    key: 'search',
                    label: t('profile.friends.searchPlayers'),
                    children: (
                        <div>
                            <Input.Search
                                placeholder={t('profile.friends.searchPlaceholder')}
                                allowClear
                                enterButton={<SearchOutlined />}
                                size="large"
                                onSearch={handleSearch}
                                onChange={e => handleSearch(e.target.value)}
                                className="mb-4"
                            />

                            <List
                                loading={searching}
                                dataSource={searchResults?.users || []}
                                renderItem={user => {
                                    const isSelf = user.id === userId;
                                    const isFriend = friends.some(f => f.id === user.id);

                                    return (
                                        <List.Item
                                            actions={[
                                                isSelf ? <span className="text-gray-400">{t('profile.friends.you')}</span> :
                                                    isFriend ? <Tag color="green">{t('profile.friends.friends')}</Tag> :
                                                        <Button
                                                            type="primary"
                                                            size="small"
                                                            icon={<UserAddOutlined />}
                                                            onClick={() => handleAddFriend(user.id)}
                                                            loading={sending}
                                                        >
                                                            {t('profile.friends.addFriend')}
                                                        </Button>
                                            ]}
                                        >
                                            <List.Item.Meta
                                                avatar={<Avatar src={user.avatar} icon={<UserOutlined />} />}
                                                title={user.name}
                                                description={user.email}
                                            />
                                        </List.Item>
                                    );
                                }}
                                locale={{ emptyText: searchResults ? <Empty description={t('profile.friends.noPlayersFound')} /> : <Empty description={t('profile.friends.searchHint')} /> }}
                            />
                        </div>
                    ),
                },
            ]}
        />
    );
};

export default FriendsList;
