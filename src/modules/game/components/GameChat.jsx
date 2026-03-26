import React, { useState, useEffect, useRef } from 'react';
import { Input, Button, List, Avatar, Card, Empty } from 'antd';
import { SendOutlined, UserOutlined } from '@ant-design/icons';
import { io } from 'socket.io-client';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { API_BASE } from '../../../config.js';

const GameChat = ({ gameId, currentUser }) => {
    const { t } = useTranslation();
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [socket, setSocket] = useState(null);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        // Load initial messages
        const fetchMessages = async () => {
            try {
                const response = await axios.get(`${API_BASE}/api/games/${gameId}/chat`);
                setMessages(response.data);
            } catch (error) {
                console.error('Failed to load chat messages', error);
            }
        };

        fetchMessages();

        // Connect to socket
        const newSocket = io(import.meta.env.VITE_API_BASE || window.location.origin, {
            transports: ['websocket'],
        });
        setSocket(newSocket);

        newSocket.emit('joinGameChat', gameId);

        newSocket.on('newMessage', (message) => {
            setMessages((prev) => [...prev, message]);
        });

        return () => newSocket.close();
    }, [gameId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = () => {
        if (!inputValue.trim() || !socket) return;

        const messageData = {
            gameId,
            userId: currentUser.id,
            userName: currentUser.name,
            userAvatar: currentUser.avatar,
            message: inputValue,
            createdAt: new Date().toISOString()
        };

        socket.emit('sendMessage', messageData);
        setInputValue('');
    };

    return (
        <Card
            title={t('game.chat.title')}
            className="glass-card"
            style={{ height: 500, display: 'flex', flexDirection: 'column' }}
            bodyStyle={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}
        >
            <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
                {messages.length === 0 ? (
                    <Empty description={t('game.chat.noMessages')} image={Empty.PRESENTED_IMAGE_SIMPLE} />
                ) : (
                    <List
                        dataSource={messages}
                        split={false}
                        renderItem={(msg) => {
                            const isMyMessage = msg.userId === currentUser.id;
                            return (
                                <List.Item style={{
                                    justifyContent: isMyMessage ? 'flex-end' : 'flex-start',
                                    padding: '4px 0',
                                    border: 'none'
                                }}>
                                    <div style={{
                                        display: 'flex',
                                        flexDirection: isMyMessage ? 'row-reverse' : 'row',
                                        alignItems: 'flex-end',
                                        maxWidth: '80%',
                                        gap: 8
                                    }}>
                                        {!isMyMessage && (
                                            <Avatar size="small" src={msg.userAvatar} icon={<UserOutlined />} />
                                        )}
                                        <div style={{
                                            background: isMyMessage ? '#1890ff' : '#f0f2f5',
                                            color: isMyMessage ? 'white' : 'rgba(0, 0, 0, 0.85)',
                                            padding: '8px 12px',
                                            borderRadius: 16,
                                            borderBottomRightRadius: isMyMessage ? 4 : 16,
                                            borderBottomLeftRadius: !isMyMessage ? 4 : 16,
                                        }}>
                                            {!isMyMessage && (
                                                <div style={{ fontSize: 10, color: 'rgba(0,0,0,0.45)', marginBottom: 2 }}>
                                                    {msg.userName}
                                                </div>
                                            )}
                                            <div>{msg.message}</div>
                                        </div>
                                    </div>
                                </List.Item>
                            );
                        }}
                    />
                )}
                <div ref={messagesEndRef} />
            </div>
            <div style={{ padding: 16, borderTop: '1px solid #f0f0f0', display: 'flex', gap: 8 }}>
                <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onPressEnter={handleSendMessage}
                    placeholder={t('game.chat.inputPlaceholder')}
                />
                <Button type="primary" icon={<SendOutlined />} onClick={handleSendMessage} />
            </div>
        </Card>
    );
};

export default GameChat;
