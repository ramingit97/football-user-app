import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Avatar, Spin, message, Modal, Form, Select } from 'antd';
import { ArrowLeftOutlined, UserOutlined, SendOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { io } from 'socket.io-client';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { useGetProfileQuery } from '../../store/authApi';
import {
    useGetElanQuery,
    useCancelElanMutation, useGetElanMessagesQuery,
} from '../../store/elanlarApi';
import { API_BASE } from '../../config.js';
import axios from 'axios';

const socket = io(API_BASE, { transports: ['websocket'], autoConnect: true });

const ElanDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { i18n } = useTranslation();
    const isAz = i18n.language === 'az';

    const { data: currentUser } = useGetProfileQuery();
    const { data: elanData, refetch } = useGetElanQuery(id);
    const { data: messages = [], refetch: refetchMessages } = useGetElanMessagesQuery(id);
    const [elan, setElan] = useState(null);

    const [cancelElan] = useCancelElanMutation();

    const [chatText, setChatText] = useState('');
    const [inviteLoading, setInviteLoading] = useState(false);
    const [convertModal, setConvertModal] = useState(false);
    const [selectedTime, setSelectedTime] = useState(null);
    const [converting, setConverting] = useState(false);
    const bottomRef = useRef(null);

    const isCreator = currentUser?.id === elan?.creatorId;
    const isInterested = elan?.interested?.some(p => p.id === currentUser?.id);
    const myVote = elan?.votes?.find(v => v.userIds?.includes(currentUser?.id))?.time;

    // Sync elan from query
    useEffect(() => { if (elanData) setElan(elanData); }, [elanData]);

    useEffect(() => {
        socket.emit('elan_join', { elanId: id });
        socket.on('elan_message', () => refetchMessages());
        socket.on('elan_updated', (updated) => setElan(updated)); // real-time update
        return () => {
            socket.emit('elan_leave', { elanId: id });
            socket.off('elan_message');
            socket.off('elan_updated');
        };
    }, [id]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = () => {
        if (!chatText.trim() || !currentUser) return;
        socket.emit('elan_message', {
            elanId: id,
            userId: currentUser.id,
            userName: currentUser.name,
            userAvatar: currentUser.avatar,
            message: chatText.trim(),
        });
        setChatText('');
    };

    const handleInterest = () => {
        if (!currentUser) { message.warning(isAz ? 'Daxil olun' : 'Войдите'); return; }
        socket.emit('elan_interest', {
            elanId: id,
            userId: currentUser.id,
            name: currentUser.name,
            avatar: currentUser.avatar,
        });
    };

    const handleVote = (time) => {
        if (!currentUser) { message.warning(isAz ? 'Daxil olun' : 'Войдите'); return; }
        if (!isInterested) { message.warning(isAz ? 'Əvvəlcə "Mən də istəyirəm" düyməsinə basın' : 'Сначала нажмите "Я тоже хочу"'); return; }
        socket.emit('elan_vote', { elanId: id, userId: currentUser.id, time });
    };

    const handleSmartInvite = async () => {
        if (!elan || !currentUser) return;
        setInviteLoading(true);
        try {
            const res = await axios.post(`${API_BASE}/api/elanlar/${elan.id}/smart-invite`, {
                userId: currentUser.id,
            });
            const count = res.data?.invitedCount || 0;
            message.success(isAz ? `${count} oyunçuya dəvət göndərildi!` : `Приглашено ${count} игроков!`);
        } catch {
            message.error(isAz ? 'Xəta baş verdi' : 'Ошибка');
        } finally {
            setInviteLoading(false);
        }
    };

    const handleConvert = async () => {
        if (!selectedTime) { message.warning(isAz ? 'Saat seçin' : 'Выберите время'); return; }
        setConverting(true);
        try {
            // Navigate to create game with pre-filled data
            const params = new URLSearchParams({
                date: elan.date,
                time: selectedTime,
                format: elan.format || '',
                district: elan.district || '',
                elanId: elan.id,
            });
            navigate(`/games/create?${params.toString()}`);
        } finally {
            setConverting(false);
            setConvertModal(false);
        }
    };

    const handleCancel = async () => {
        if (!currentUser) return;
        await cancelElan({ id, userId: currentUser.id });
        message.success(isAz ? 'Elan silindi' : 'Объявление удалено');
        navigate('/elanlar');
    };

    if (!elan) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
            <Spin size="large" />
        </div>
    );

    const totalVotes = elan.votes?.reduce((s, v) => s + (v.userIds?.length || 0), 0) || 0;
    const winningTime = elan.votes?.reduce((a, b) => (a.userIds?.length >= b.userIds?.length ? a : b), { time: elan.time, userIds: [] });

    return (
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '16px', minHeight: '100vh' }}>

            {/* Back */}
            <button onClick={() => navigate('/elanlar')} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--text-secondary)', display: 'flex', alignItems: 'center',
                gap: 6, fontSize: 14, marginBottom: 20, padding: 0,
            }}>
                <ArrowLeftOutlined /> {isAz ? 'Geri' : 'Назад'}
            </button>

            {/* Header card */}
            <div style={{
                background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                borderRadius: 16, padding: 20, marginBottom: 16, position: 'relative', overflow: 'hidden',
            }}>
                <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                    background: 'linear-gradient(90deg, #f59e0b, #ef4444)',
                }} />

                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                    <Avatar src={elan.creatorAvatar} icon={<UserOutlined />} size={48}
                        style={{ border: '2px solid var(--border-color)', cursor: 'pointer' }}
                        onClick={() => navigate(`/player/${elan.creatorId}`)}
                    />
                    <div>
                        <div style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 16 }}>{elan.creatorName}</div>
                        <div style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>{dayjs(elan.createdAt).format('DD.MM.YYYY HH:mm')}</div>
                    </div>
                    <span style={{
                        marginLeft: 'auto', background: 'rgba(245,158,11,0.15)', color: '#f59e0b',
                        border: '1px solid rgba(245,158,11,0.3)', fontSize: 11, fontWeight: 700,
                        padding: '3px 12px', borderRadius: 99,
                    }}>ELAN</span>
                </div>

                {/* Info */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: elan.description ? 14 : 0 }}>
                    {[
                        { icon: '📅', text: dayjs(elan.date).format('DD.MM.YYYY') },
                        elan.format && { icon: '⚽', text: elan.format },
                        elan.district && { icon: '📍', text: elan.district },
                        elan.metro && { icon: '🚇', text: elan.metro },
                    ].filter(Boolean).map((p, i) => (
                        <span key={i} style={{
                            background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)',
                            borderRadius: 99, padding: '4px 12px', fontSize: 13, color: 'var(--text-secondary)',
                        }}>{p.icon} {p.text}</span>
                    ))}
                </div>

                {elan.description && (
                    <p style={{
                        color: 'var(--text-secondary)', fontSize: 13, margin: '14px 0 0',
                        borderLeft: '3px solid #f59e0b', paddingLeft: 12, fontStyle: 'italic',
                    }}>{elan.description}</p>
                )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>

                {/* Голосование за время */}
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 16, padding: 16 }}>
                    <h3 style={{ margin: '0 0 14px', color: 'var(--text-primary)', fontSize: 14, fontWeight: 700 }}>
                        🗳 {isAz ? 'Saat seçimi' : 'Голосование'}
                    </h3>
                    {elan.votes?.length > 0 ? elan.votes.map(v => {
                        const count = v.userIds?.length || 0;
                        const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
                        const isWinning = v.time === winningTime?.time && count > 0;
                        const myChoice = v.time === myVote;
                        return (
                            <div key={v.time} onClick={() => handleVote(v.time)} style={{ marginBottom: 10, cursor: 'pointer' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                    <span style={{ color: myChoice ? 'var(--green)' : 'var(--text-primary)', fontWeight: myChoice ? 700 : 400, fontSize: 14 }}>
                                        {myChoice ? '✓ ' : ''}{v.time}
                                        {isWinning && <span style={{ marginLeft: 6, fontSize: 11, color: '#f59e0b' }}>★</span>}
                                    </span>
                                    <span style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>{count} {isAz ? 'səs' : 'гол.'}</span>
                                </div>
                                <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' }}>
                                    <div style={{
                                        height: '100%', width: `${pct}%`,
                                        background: isWinning ? '#f59e0b' : 'var(--green)',
                                        borderRadius: 99, transition: 'width 0.3s',
                                    }} />
                                </div>
                            </div>
                        );
                    }) : (
                        <p style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>
                            {isAz ? 'Sabit vaxt: ' : 'Время: '}<strong>{elan.time}</strong>
                        </p>
                    )}
                </div>

                {/* Заинтересованные */}
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 16, padding: 16 }}>
                    <h3 style={{ margin: '0 0 14px', color: 'var(--text-primary)', fontSize: 14, fontWeight: 700 }}>
                        👥 {isAz ? 'İstəyənlər' : 'Хотят сыграть'} ({elan.interested?.length || 0})
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 200, overflowY: 'auto' }}>
                        {elan.interested?.length === 0 && (
                            <p style={{ color: 'var(--text-tertiary)', fontSize: 13, margin: 0 }}>
                                {isAz ? 'Hələ yoxdur' : 'Пока никого'}
                            </p>
                        )}
                        {elan.interested?.map(p => (
                            <div key={p.id} onClick={() => navigate(`/player/${p.id}`)}
                                style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                                <Avatar src={p.avatar} icon={<UserOutlined />} size={28} />
                                <span style={{ color: 'var(--text-primary)', fontSize: 13 }}>{p.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
                {!isCreator && currentUser && (
                    <button onClick={handleInterest} style={{
                        flex: 1, minWidth: 160,
                        background: isInterested ? 'rgba(34,197,94,0.15)' : 'rgba(34,197,94,0.08)',
                        border: `1px solid ${isInterested ? 'var(--green)' : 'rgba(34,197,94,0.3)'}`,
                        borderRadius: 12, padding: '11px 16px',
                        color: 'var(--green)', fontFamily: 'Outfit, sans-serif',
                        fontWeight: 700, fontSize: 14, cursor: 'pointer',
                    }}>
                        {isInterested ? '✓ ' : ''}{isAz ? 'Mən də istəyirəm' : 'Я тоже хочу'}
                    </button>
                )}

                {isCreator && (
                    <>
                        <button onClick={() => setConvertModal(true)} style={{
                            flex: 1, minWidth: 160,
                            background: 'var(--green)', border: 'none',
                            borderRadius: 12, padding: '11px 16px',
                            color: '#060c18', fontFamily: 'Outfit, sans-serif',
                            fontWeight: 700, fontSize: 14, cursor: 'pointer',
                        }}>
                            ⚽ {isAz ? 'Oyun yarat' : 'Создать игру'}
                        </button>

                        <button onClick={handleSmartInvite} disabled={inviteLoading} style={{
                            background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.3)',
                            borderRadius: 12, padding: '11px 16px',
                            color: '#a78bfa', fontFamily: 'Outfit, sans-serif',
                            fontWeight: 600, fontSize: 13, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: 6,
                        }}>
                            <ThunderboltOutlined /> {inviteLoading ? '...' : 'Smart Invite'}
                        </button>

                        <button onClick={handleCancel} style={{
                            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)',
                            borderRadius: 12, padding: '11px 14px',
                            color: '#ef4444', cursor: 'pointer', fontSize: 14,
                        }}>🗑</button>
                    </>
                )}
            </div>

            {/* Chat */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 16, overflow: 'hidden' }}>
                <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-color)' }}>
                    <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: 14, fontWeight: 700 }}>
                        💬 {isAz ? 'Söhbət' : 'Чат'}
                    </h3>
                </div>

                <div style={{ height: 300, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {messages.length === 0 && (
                        <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', marginTop: 80, fontSize: 13 }}>
                            {isAz ? 'Hələ mesaj yoxdur. İlk mesajı sən yaz!' : 'Сообщений нет. Напиши первым!'}
                        </div>
                    )}
                    {messages.map(msg => {
                        const isMe = msg.userId === currentUser?.id;
                        return (
                            <div key={msg.id} style={{ display: 'flex', gap: 8, justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                                {!isMe && (
                                    <Avatar src={msg.userAvatar} icon={<UserOutlined />} size={30}
                                        style={{ cursor: 'pointer', flexShrink: 0 }}
                                        onClick={() => navigate(`/player/${msg.userId}`)} />
                                )}
                                <div style={{ maxWidth: '72%' }}>
                                    {!isMe && <div style={{ color: 'var(--text-tertiary)', fontSize: 11, marginBottom: 3 }}>{msg.userName}</div>}
                                    <div style={{
                                        background: isMe ? 'var(--green)' : 'rgba(255,255,255,0.07)',
                                        color: isMe ? '#060c18' : 'var(--text-primary)',
                                        borderRadius: isMe ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                                        padding: '9px 13px', fontSize: 13, lineHeight: 1.4,
                                    }}>
                                        {msg.message}
                                    </div>
                                    <div style={{ color: 'var(--text-tertiary)', fontSize: 10, marginTop: 3, textAlign: isMe ? 'right' : 'left' }}>
                                        {dayjs(msg.createdAt).format('HH:mm')}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={bottomRef} />
                </div>

                {currentUser ? (
                    <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border-color)', display: 'flex', gap: 8 }}>
                        <input
                            value={chatText}
                            onChange={e => setChatText(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                            placeholder={isAz ? 'Mesaj yaz...' : 'Написать сообщение...'}
                            style={{
                                flex: 1, background: 'rgba(255,255,255,0.05)',
                                border: '1px solid var(--border-color)', borderRadius: 10,
                                padding: '9px 14px', color: 'var(--text-primary)',
                                fontSize: 14, fontFamily: 'Outfit, sans-serif', outline: 'none',
                            }}
                        />
                        <button onClick={handleSendMessage} style={{
                            background: 'var(--green)', border: 'none', borderRadius: 10,
                            padding: '0 16px', cursor: 'pointer', color: '#060c18',
                        }}>
                            <SendOutlined />
                        </button>
                    </div>
                ) : (
                    <div style={{ padding: 16, textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>
                        {isAz ? 'Mesaj yazmaq üçün daxil olun' : 'Войдите чтобы написать'}
                    </div>
                )}
            </div>

            {/* Convert Modal */}
            <Modal
                open={convertModal}
                onCancel={() => setConvertModal(false)}
                footer={null}
                title={<span style={{ color: 'var(--text-primary)' }}>⚽ {isAz ? 'Oyun yarat' : 'Создать игру'}</span>}
                styles={{ content: { background: 'var(--bg-card)', border: '1px solid var(--border-color)' } }}
            >
                <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
                    {isAz
                        ? 'Hansı saatı seçirsiniz? Bütün maraqlananlar bildirim alacaq.'
                        : 'Выберите время игры. Все заинтересованные получат уведомление.'}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                    {(elan.votes?.length > 0 ? elan.votes : [{ time: elan.time, userIds: [] }]).map(v => {
                        const count = v.userIds?.length || 0;
                        const isWinning = v.time === winningTime?.time && count > 0;
                        return (
                            <button key={v.time} onClick={() => setSelectedTime(v.time)} style={{
                                background: selectedTime === v.time ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.04)',
                                border: `1px solid ${selectedTime === v.time ? 'var(--green)' : 'var(--border-color)'}`,
                                borderRadius: 10, padding: '12px 16px', cursor: 'pointer',
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
                                <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                                    🕐 {v.time} {isWinning && '★'}
                                </span>
                                <span style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>
                                    {count} {isAz ? 'səs' : 'голосов'}
                                </span>
                            </button>
                        );
                    })}
                </div>
                <button onClick={handleConvert} disabled={!selectedTime || converting} style={{
                    width: '100%', background: selectedTime ? 'var(--green)' : 'rgba(255,255,255,0.05)',
                    border: 'none', borderRadius: 12, padding: '13px',
                    color: selectedTime ? '#060c18' : 'var(--text-tertiary)',
                    fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 15,
                    cursor: selectedTime ? 'pointer' : 'not-allowed',
                }}>
                    {isAz ? 'Oyun yarat →' : 'Создать игру →'}
                </button>
            </Modal>
        </div>
    );
};

export default ElanDetailPage;
