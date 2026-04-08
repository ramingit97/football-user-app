import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal, Form, Input, Select, DatePicker, TimePicker, message, Avatar, Empty } from 'antd';
import {
    PlusOutlined, UserOutlined, ClockCircleOutlined,
    EnvironmentOutlined, TeamOutlined, SendOutlined, DeleteOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { io } from 'socket.io-client';
import dayjs from 'dayjs';
import { useGetProfileQuery } from '../../store/authApi';
import { useGetElanlarQuery, useCreateElanMutation, useToggleInterestMutation, useCancelElanMutation, useGetElanMessagesQuery } from '../../store/elanlarApi';
import { useGetDistrictsQuery, useGetMetroStationsQuery } from '../../store/locationsApi';
import { API_BASE } from '../../config.js';

const { Option } = Select;
const { TextArea } = Input;

const FORMATS = ['5x5', '6x6', '7x7', '8x8', '11x11'];

const socket = io(API_BASE, { transports: ['websocket'], autoConnect: true });

// ── Elan Card ─────────────────────────────────────────
const ElanCard = ({ elan, currentUser, onInterest, onCancel, onOpenChat }) => {
    const { i18n } = useTranslation();
    const navigate = useNavigate();
    const isAz = i18n.language === 'az';
    const isCreator = currentUser?.id === elan.creatorId;
    const isInterested = elan.interested?.some(p => p.id === currentUser?.id);
    const count = elan.interested?.length || 0;

    const formatDate = (d) => {
        const date = dayjs(d);
        return date.format('DD.MM.YYYY');
    };

    return (
        <div style={{
            background: 'var(--bg-card)',
            border: `1px solid ${isCreator ? 'rgba(34,197,94,0.3)' : 'var(--border-color)'}`,
            borderRadius: 16,
            padding: '18px 20px',
            position: 'relative',
            overflow: 'hidden',
            transition: 'transform 0.15s, box-shadow 0.15s',
        }}>
            {/* Accent top bar */}
            <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                background: 'linear-gradient(90deg, #f59e0b, #ef4444)',
                borderRadius: '16px 16px 0 0',
            }} />

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <Avatar src={elan.creatorAvatar} icon={<UserOutlined />} size={38}
                    style={{ border: '2px solid var(--border-color)' }} />
                <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => navigate(`/elanlar/${elan.id}`)}>
                    <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 14 }}>
                        {elan.creatorName}
                        {isCreator && (
                            <span style={{ marginLeft: 6, fontSize: 11, background: 'rgba(34,197,94,0.15)',
                                color: 'var(--green)', padding: '1px 7px', borderRadius: 99, fontWeight: 500 }}>
                                {isAz ? 'Siz' : 'Вы'}
                            </span>
                        )}
                    </div>
                    <div style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>
                        {dayjs(elan.createdAt).fromNow?.() || dayjs(elan.createdAt).format('HH:mm')}
                    </div>
                </div>
                {/* Amber "Elan" badge */}
                <span style={{
                    background: 'rgba(245,158,11,0.15)', color: '#f59e0b',
                    border: '1px solid rgba(245,158,11,0.3)',
                    fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 99,
                    letterSpacing: '0.5px',
                }}>ELAN</span>
            </div>

            {/* Info pills */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                <Pill icon="📅" text={formatDate(elan.date)} />
                <Pill icon="🕐" text={elan.time} />
                {elan.format && <Pill icon="⚽" text={elan.format} />}
                {elan.district && <Pill icon="📍" text={elan.district} />}
                {elan.metro && <Pill icon="🚇" text={elan.metro} />}
            </div>

            {/* Description */}
            {elan.description && (
                <p style={{
                    color: 'var(--text-secondary)', fontSize: 13, margin: '0 0 14px',
                    lineHeight: 1.5, fontStyle: 'italic',
                    borderLeft: '2px solid var(--border-color)', paddingLeft: 10,
                }}>
                    {elan.description}
                </p>
            )}

            {/* Interested avatars */}
            {count > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
                    <div style={{ display: 'flex' }}>
                        {elan.interested.slice(0, 5).map((p, i) => (
                            <Avatar key={p.id} src={p.avatar} icon={<UserOutlined />} size={26}
                                style={{ border: '2px solid var(--bg-card)', marginLeft: i > 0 ? -8 : 0 }} />
                        ))}
                    </div>
                    <span style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>
                        {count} {isAz ? 'nəfər maraqlanır' : `${count === 1 ? 'человек' : 'человек'} заинтересован`}
                    </span>
                </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {!isCreator && currentUser && (
                    <button onClick={() => onInterest(elan)} style={{
                        flex: 1, minWidth: 140,
                        background: isInterested ? 'rgba(34,197,94,0.15)' : 'rgba(34,197,94,0.08)',
                        border: `1px solid ${isInterested ? 'var(--green)' : 'rgba(34,197,94,0.3)'}`,
                        borderRadius: 10, padding: '9px 16px',
                        color: 'var(--green)', fontFamily: 'Outfit, sans-serif',
                        fontWeight: 600, fontSize: 13, cursor: 'pointer',
                        transition: 'all 0.15s',
                    }}>
                        {isInterested ? '✓ ' : ''}{isAz ? 'Mən də istəyirəm' : 'Я тоже хочу'}
                    </button>
                )}
                <button onClick={() => onOpenChat(elan)} style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 10, padding: '9px 14px',
                    color: 'var(--text-secondary)', fontFamily: 'Outfit, sans-serif',
                    fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                }}>
                    💬 {isAz ? 'Söhbət' : 'Чат'}
                </button>
                {isCreator && (
                    <button onClick={() => onCancel(elan.id)} style={{
                        background: 'rgba(239,68,68,0.08)',
                        border: '1px solid rgba(239,68,68,0.3)',
                        borderRadius: 10, padding: '9px 12px',
                        color: '#ef4444', cursor: 'pointer',
                    }}>
                        <DeleteOutlined />
                    </button>
                )}
            </div>
        </div>
    );
};

const Pill = ({ icon, text }) => (
    <span style={{
        background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)',
        borderRadius: 99, padding: '3px 10px', fontSize: 12,
        color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4,
    }}>
        {icon} {text}
    </span>
);

// ── Chat Modal ────────────────────────────────────────
const ChatModal = ({ elan, currentUser, open, onClose }) => {
    const { i18n } = useTranslation();
    const isAz = i18n.language === 'az';
    const { data: messages = [], refetch } = useGetElanMessagesQuery(elan?.id, { skip: !elan?.id });
    const [text, setText] = useState('');
    const bottomRef = useRef(null);

    useEffect(() => {
        if (!elan?.id) return;
        socket.emit('elan_join', { elanId: elan.id });
        socket.on('elan_message', () => refetch());
        return () => {
            socket.emit('elan_leave', { elanId: elan.id });
            socket.off('elan_message');
        };
    }, [elan?.id]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = () => {
        if (!text.trim() || !currentUser) return;
        socket.emit('elan_message', {
            elanId: elan.id,
            userId: currentUser.id,
            userName: currentUser.name,
            userAvatar: currentUser.avatar,
            message: text.trim(),
        });
        setText('');
    };

    return (
        <Modal
            open={open}
            onCancel={onClose}
            footer={null}
            title={
                <span style={{ color: 'var(--text-primary)' }}>
                    💬 {isAz ? 'Söhbət' : 'Чат'} — {elan?.creatorName}
                </span>
            }
            width={480}
            styles={{ content: { background: 'var(--bg-card)', border: '1px solid var(--border-color)' } }}
        >
            {/* Messages */}
            <div style={{ height: 320, overflowY: 'auto', padding: '8px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {messages.length === 0 && (
                    <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', marginTop: 80, fontSize: 13 }}>
                        {isAz ? 'Hələ mesaj yoxdur' : 'Сообщений пока нет'}
                    </div>
                )}
                {messages.map(msg => {
                    const isMe = msg.userId === currentUser?.id;
                    return (
                        <div key={msg.id} style={{ display: 'flex', gap: 8, justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                            {!isMe && <Avatar src={msg.userAvatar} icon={<UserOutlined />} size={28} />}
                            <div style={{ maxWidth: '72%' }}>
                                {!isMe && <div style={{ color: 'var(--text-tertiary)', fontSize: 11, marginBottom: 2 }}>{msg.userName}</div>}
                                <div style={{
                                    background: isMe ? 'var(--green)' : 'rgba(255,255,255,0.07)',
                                    color: isMe ? '#060c18' : 'var(--text-primary)',
                                    borderRadius: isMe ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                                    padding: '8px 12px', fontSize: 13,
                                }}>
                                    {msg.message}
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div ref={bottomRef} />
            </div>

            {/* Input */}
            {currentUser ? (
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                    <Input
                        value={text}
                        onChange={e => setText(e.target.value)}
                        onPressEnter={handleSend}
                        placeholder={isAz ? 'Mesaj yaz...' : 'Написать сообщение...'}
                        style={{ borderRadius: 10 }}
                    />
                    <button onClick={handleSend} style={{
                        background: 'var(--green)', border: 'none', borderRadius: 10,
                        padding: '0 16px', cursor: 'pointer', color: '#060c18',
                    }}>
                        <SendOutlined />
                    </button>
                </div>
            ) : (
                <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', marginTop: 12, fontSize: 13 }}>
                    {isAz ? 'Mesaj göndərmək üçün daxil olun' : 'Войдите чтобы писать в чат'}
                </div>
            )}
        </Modal>
    );
};

// ── Main Page ─────────────────────────────────────────
const ElanlarPage = () => {
    const { t, i18n } = useTranslation();
    const isAz = i18n.language === 'az';
    const navigate = useNavigate();
    const { data: currentUser } = useGetProfileQuery();
    const { data: elanlar = [], refetch } = useGetElanlarQuery();
    const { data: districts = [] } = useGetDistrictsQuery();
    const { data: metros = [] } = useGetMetroStationsQuery();

    const [createElan] = useCreateElanMutation();
    const [toggleInterest] = useToggleInterestMutation();
    const [cancelElan] = useCancelElanMutation();

    const [createModal, setCreateModal] = useState(false);
    const [chatElan, setChatElan] = useState(null);
    const [form] = Form.useForm();
    const [creating, setCreating] = useState(false);

    const handleCreate = async (values) => {
        if (!currentUser) { message.warning(isAz ? 'Daxil olun' : 'Войдите в аккаунт'); return; }
        const times = values.times || [];
        if (times.length === 0) { message.warning(isAz ? 'Ən azı 1 saat seçin' : 'Выберите хотя бы 1 время'); return; }
        setCreating(true);
        try {
            const timeOptions = times; // already strings from Select
            await createElan({
                creatorId: currentUser.id,
                creatorName: currentUser.name,
                creatorAvatar: currentUser.avatar,
                date: values.date.format('YYYY-MM-DD'),
                time: timeOptions[0],
                timeOptions,
                format: values.format,
                district: values.district,
                metro: values.metro,
                description: values.description,
            }).unwrap();
            message.success(isAz ? 'Elan yerləşdirildi!' : 'Объявление размещено!');
            setCreateModal(false);
            form.resetFields();
        } catch {
            message.error(isAz ? 'Xəta baş verdi' : 'Ошибка');
        } finally {
            setCreating(false);
        }
    };

    const handleInterest = async (elan) => {
        if (!currentUser) { message.warning(isAz ? 'Daxil olun' : 'Войдите в аккаунт'); return; }
        await toggleInterest({ id: elan.id, userId: currentUser.id, name: currentUser.name, avatar: currentUser.avatar });
    };

    const handleCancel = async (id) => {
        if (!currentUser) return;
        await cancelElan({ id, userId: currentUser.id });
        message.success(isAz ? 'Elan silindi' : 'Объявление удалено');
    };

    return (
        <div style={{ minHeight: '100vh', paddingBottom: 48 }}>
            <style>{`
                @media (max-width: 767px) {
                    .elanlar-grid { grid-template-columns: 1fr !important; }
                }
            `}</style>

            <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>

                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                    <div>
                        <h1 style={{
                            margin: 0, fontFamily: "'ClashDisplay-Variable', sans-serif",
                            fontWeight: 800, fontSize: 28, color: 'var(--text-primary)',
                        }}>
                            📋 Elanlar
                        </h1>
                        <p style={{ margin: '4px 0 0', color: 'var(--text-tertiary)', fontSize: 13 }}>
                            {isAz ? 'Oynamaq istəyənlər' : 'Хотят сыграть'}
                        </p>
                    </div>
                    <button onClick={() => currentUser ? setCreateModal(true) : navigate('/login')} style={{
                        background: 'var(--green)', color: '#060c18', border: 'none',
                        borderRadius: 12, padding: '11px 20px',
                        fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 14,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                        boxShadow: '0 4px 20px rgba(34,197,94,0.3)',
                    }}>
                        <PlusOutlined /> {isAz ? 'Elan ver' : 'Разместить'}
                    </button>
                </div>

                {/* Grid */}
                {elanlar.length === 0 ? (
                    <div style={{
                        textAlign: 'center', padding: '80px 24px',
                        background: 'var(--bg-card)', borderRadius: 16,
                        border: '1px solid var(--border-color)',
                    }}>
                        <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: 16, marginBottom: 8 }}>
                            {isAz ? 'Hələ elan yoxdur' : 'Объявлений пока нет'}
                        </div>
                        <div style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>
                            {isAz ? 'İlk elanı sən ver!' : 'Будь первым!'}
                        </div>
                    </div>
                ) : (
                    <div className="elanlar-grid" style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                        gap: 16,
                    }}>
                        {elanlar.map(elan => (
                            <ElanCard
                                key={elan.id}
                                elan={elan}
                                currentUser={currentUser}
                                onInterest={handleInterest}
                                onCancel={handleCancel}
                                onOpenChat={setChatElan}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Create Modal */}
            <Modal
                open={createModal}
                onCancel={() => { setCreateModal(false); form.resetFields(); }}
                footer={null}
                title={<span style={{ color: 'var(--text-primary)' }}>📋 {isAz ? 'Yeni elan' : 'Новое объявление'}</span>}
                width={480}
                styles={{ content: { background: 'var(--bg-card)', border: '1px solid var(--border-color)' } }}
            >
                <Form form={form} layout="vertical" onFinish={handleCreate} style={{ marginTop: 16 }}>
                    <Form.Item
                        label={<span style={{ color: 'var(--text-secondary)' }}>📅 {isAz ? 'Tarix' : 'Дата'}</span>}
                        name="date"
                        rules={[{ required: true, message: isAz ? 'Tarix seçin' : 'Выберите дату' }]}
                    >
                        <DatePicker style={{ width: '100%', borderRadius: 10 }} format="DD.MM.YYYY" disabledDate={d => d && d < dayjs().startOf('day')} />
                    </Form.Item>

                    <Form.Item
                        label={<span style={{ color: 'var(--text-secondary)' }}>🕐 {isAz ? 'Saat variantları (maks. 3)' : 'Варианты времени (макс. 3)'}</span>}
                        name="times"
                        rules={[{ required: true, message: isAz ? 'Ən azı 1 saat seçin' : 'Выберите хотя бы 1 время' }]}
                        extra={<span style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>
                            {isAz ? 'Bir neçə variant seçsəniz oyunçular səs verəcək' : 'Несколько вариантов — игроки проголосуют'}
                        </span>}
                    >
                        <Select
                            mode="multiple"
                            maxCount={3}
                            placeholder={isAz ? 'Saat seçin' : 'Выберите время'}
                            style={{ width: '100%' }}
                            options={['18:00','18:30','19:00','19:30','20:00','20:30','21:00','21:30','22:00','22:30'].map(t => ({
                                value: t, label: t
                            }))}
                            filterOption={false}
                        />
                    </Form.Item>

                    <Form.Item
                        label={<span style={{ color: 'var(--text-secondary)' }}>⚽ {isAz ? 'Format' : 'Формат'}</span>}
                        name="format"
                    >
                        <Select placeholder={isAz ? 'Seçin (istəyə görə)' : 'Выберите (необязательно)'} allowClear style={{ borderRadius: 10 }}>
                            {FORMATS.map(f => <Option key={f} value={f}>{f}</Option>)}
                        </Select>
                    </Form.Item>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <Form.Item
                            label={<span style={{ color: 'var(--text-secondary)' }}>📍 {isAz ? 'Rayon' : 'Район'}</span>}
                            name="district"
                        >
                            <Select placeholder={isAz ? 'İstəyə görə' : 'Необязательно'} allowClear showSearch>
                                {districts.map(d => <Option key={d.id} value={d.name}>{d.name}</Option>)}
                            </Select>
                        </Form.Item>
                        <Form.Item
                            label={<span style={{ color: 'var(--text-secondary)' }}>🚇 Metro</span>}
                            name="metro"
                        >
                            <Select placeholder={isAz ? 'İstəyə görə' : 'Необязательно'} allowClear showSearch>
                                {metros.map(m => <Option key={m.id} value={m.name}>{m.name}</Option>)}
                            </Select>
                        </Form.Item>
                    </div>

                    <Form.Item
                        label={<span style={{ color: 'var(--text-secondary)' }}>📝 {isAz ? 'Qeyd' : 'Заметка'}</span>}
                        name="description"
                    >
                        <TextArea
                            rows={3}
                            placeholder={isAz ? 'Məs: Müdafiəçi lazımdır, 18+ yaş...' : 'Напр: нужен вратарь, уровень любительский...'}
                            maxLength={200}
                            showCount
                            style={{ borderRadius: 10 }}
                        />
                    </Form.Item>

                    <button type="submit" disabled={creating} style={{
                        width: '100%', background: 'var(--green)', color: '#060c18',
                        border: 'none', borderRadius: 12, padding: '12px 0',
                        fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 15,
                        cursor: creating ? 'not-allowed' : 'pointer',
                        opacity: creating ? 0.7 : 1,
                    }}>
                        {creating ? '...' : (isAz ? 'Elan ver' : 'Разместить')}
                    </button>
                </Form>
            </Modal>

            {/* Chat Modal */}
            {chatElan && (
                <ChatModal
                    elan={chatElan}
                    currentUser={currentUser}
                    open={!!chatElan}
                    onClose={() => setChatElan(null)}
                />
            )}
        </div>
    );
};

export default ElanlarPage;
