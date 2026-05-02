import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Spin, Modal, Input, message } from 'antd';
import { useTranslation } from 'react-i18next';
import {
    ArrowLeftOutlined,
    EnvironmentOutlined,
    CalendarOutlined,
    TeamOutlined,
    ClockCircleOutlined,
    PhoneOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    MessageOutlined,
    UserOutlined,
    SendOutlined,
} from '@ant-design/icons';
import {
    useGetLookupQuery,
    useRespondToLookupMutation,
    useUpdateLookupStatusMutation,
    useGetLookupMessagesQuery,
    useSendLookupMessageMutation,
} from '../../store/lookupApi';

const { TextArea } = Input;

const FORMAT_COLORS = {
    '5x5':   { color: '#00e87a', bg: 'rgba(0,232,122,0.1)'  },
    '6x6':   { color: '#4f86f7', bg: 'rgba(79,134,247,0.1)' },
    '7x7':   { color: '#a855f7', bg: 'rgba(168,85,247,0.1)' },
    '8x8':   { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
    '11x11': { color: '#f04438', bg: 'rgba(240,68,56,0.1)'  },
};
const getFmt = (f) => FORMAT_COLORS[f] || FORMAT_COLORS['6x6'];

const useTimeAgo = () => {
    const { t } = useTranslation();
    return (dateStr) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const m = Math.floor(diff / 60000);
        if (m < 1) return t('lookup.timeAgoNow');
        if (m < 60) return t('lookup.timeAgoMin', { n: m });
        const h = Math.floor(m / 60);
        if (h < 24) return t('lookup.timeAgoHour', { n: h });
        return t('lookup.timeAgoDay', { n: Math.floor(h / 24) });
    };
};

const Avatar = ({ src, name, size = 36, color }) => (
    <div style={{
        width: size, height: size, borderRadius: '50%',
        background: color ? `${color}20` : 'var(--bg-raised)',
        border: `2px solid ${color ? color + '40' : 'var(--border-color)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.38, fontWeight: 800,
        fontFamily: "'ClashDisplay-Variable','Clash Display',sans-serif",
        color: color || 'var(--text-tertiary)',
        overflow: 'hidden', flexShrink: 0,
    }}>
        {src
            ? <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : (name?.[0] || '?').toUpperCase()
        }
    </div>
);

const LookupDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    const timeAgo = useTimeAgo();
    const dateLocale = i18n.language === 'az' ? 'az-AZ' : 'ru-RU';
    const currentUser = JSON.parse(localStorage.getItem('user') || 'null');

    const { data: lookup, isLoading } = useGetLookupQuery(id);
    const { data: messages = [], refetch: refetchMessages } = useGetLookupMessagesQuery(id);
    const [respond, { isLoading: responding }] = useRespondToLookupMutation();
    const [updateStatus] = useUpdateLookupStatusMutation();
    const [sendMessage, { isLoading: sending }] = useSendLookupMessageMutation();

    const [respondOpen, setRespondOpen] = useState(false);
    const [respondForm, setRespondForm] = useState({ message: '', contactPhone: '', teamName: '' });
    const [chatText, setChatText] = useState('');
    const chatBottomRef = useRef(null);

    // Poll messages every 8s
    useEffect(() => {
        const interval = setInterval(refetchMessages, 8000);
        return () => clearInterval(interval);
    }, [refetchMessages]);

    useEffect(() => {
        chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    if (isLoading) return (
        <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Spin size="large" />
        </div>
    );
    if (!lookup) return null;

    const fmt = getFmt(lookup.format);
    const isCreator = currentUser?.id === lookup.creatorId;
    const hasResponded = (lookup.responses || []).some(r => r.userId === currentUser?.id);
    const isOpen = lookup.status === 'open';

    const handleRespond = async () => {
        if (!currentUser) { navigate('/login?returnTo=/lookup/' + id); return; }
        try {
            await respond({
                id,
                userId: currentUser.id,
                userName: currentUser.name,
                userAvatar: currentUser.avatar || null,
                contactPhone: respondForm.contactPhone || null,
                teamName: respondForm.teamName || null,
                message: respondForm.message || null,
            }).unwrap();
            message.success(t('lookup.detail.respondSuccess'));
            setRespondOpen(false);
            setRespondForm({ message: '', contactPhone: '', teamName: '' });
        } catch (e) {
            message.error(e?.data?.message || 'Ошибка');
        }
    };

    const handleSendMessage = async () => {
        if (!currentUser) { navigate('/login?returnTo=/lookup/' + id); return; }
        const text = chatText.trim();
        if (!text) return;
        setChatText('');
        try {
            await sendMessage({ id, userId: currentUser.id, userName: currentUser.name, userAvatar: currentUser.avatar || null, message: text }).unwrap();
            refetchMessages();
        } catch {
            message.error('Ошибка отправки');
        }
    };

    const inputStyle = {
        background: 'var(--bg-raised)',
        border: '1px solid var(--border-color)',
        borderRadius: 10,
        color: 'var(--text-primary)',
        fontFamily: 'Outfit,sans-serif',
        fontSize: 14,
    };

    return (
        <div style={{ maxWidth: 740, margin: '0 auto', padding: '20px 16px' }}>

            {/* Back */}
            <button
                onClick={() => navigate('/lookup')}
                style={{
                    display: 'inline-flex', alignItems: 'center', gap: 7,
                    background: 'transparent', border: '1px solid var(--border-color)',
                    borderRadius: 10, padding: '7px 14px',
                    color: 'var(--text-secondary)', fontFamily: 'Outfit,sans-serif',
                    fontSize: 13, cursor: 'pointer', marginBottom: 20,
                }}
            >
                <ArrowLeftOutlined /> {t('lookup.detail.back')}
            </button>

            {/* ── MAIN CARD ──────────────────────────────── */}
            <div style={{
                background: 'var(--bg-card)',
                border: `1px solid ${fmt.color}30`,
                borderRadius: 20,
                overflow: 'hidden',
                marginBottom: 16,
            }}>
                {/* Top accent */}
                <div style={{
                    height: 4,
                    background: `linear-gradient(90deg, ${fmt.color}, ${fmt.color}44)`,
                    boxShadow: `0 0 16px ${fmt.color}40`,
                }} />

                <div style={{ padding: '24px 24px 20px' }}>
                    {/* Header */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 20 }}>
                        <Avatar src={lookup.creatorAvatar} name={lookup.creatorName} size={52} color={fmt.color} />
                        <div style={{ flex: 1 }}>
                            <div style={{
                                fontFamily: "'ClashDisplay-Variable','Clash Display',sans-serif",
                                fontWeight: 800, fontSize: 20,
                                color: 'var(--text-primary)', marginBottom: 4,
                            }}>
                                {lookup.teamName || lookup.creatorName}
                                {lookup.teamName && (
                                    <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--text-tertiary)', marginLeft: 10, fontFamily: 'Outfit,sans-serif' }}>
                                        · {lookup.creatorName}
                                    </span>
                                )}
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--text-tertiary)', fontFamily: 'Outfit,sans-serif' }}>
                                {timeAgo(lookup.createdAt)}
                            </div>
                        </div>

                        {/* Status */}
                        <span style={{
                            background: isOpen ? 'rgba(0,232,122,0.1)' : 'var(--bg-raised)',
                            color: isOpen ? '#00e87a' : 'var(--text-tertiary)',
                            padding: '5px 14px', borderRadius: 20,
                            fontSize: 12, fontWeight: 700,
                            fontFamily: 'Outfit,sans-serif',
                            border: isOpen ? '1px solid rgba(0,232,122,0.25)' : '1px solid var(--border-color)',
                            flexShrink: 0,
                        }}>
                            {isOpen ? `● ${t('lookup.statusOpen')}` : lookup.status === 'matched' ? `✓ ${t('lookup.statusMatched')}` : t('lookup.statusCancelled')}
                        </span>
                    </div>

                    {/* Info chips */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9, marginBottom: 20 }}>
                        <span style={{
                            background: fmt.bg, color: fmt.color,
                            padding: '7px 16px', borderRadius: 20,
                            fontSize: 14, fontWeight: 800,
                            fontFamily: "'ClashDisplay-Variable','Clash Display',sans-serif",
                            border: `1px solid ${fmt.color}25`,
                        }}>
                            ⚽ {lookup.format}
                        </span>

                        {lookup.playerCount > 0 && (
                            <span style={{ background: 'var(--bg-raised)', color: 'var(--text-secondary)', padding: '7px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600, border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'Outfit,sans-serif' }}>
                                <TeamOutlined /> {t('lookup.playerCount', { count: lookup.playerCount })}
                            </span>
                        )}

                        {lookup.preferredDate && (
                            <span style={{ background: 'var(--bg-raised)', color: 'var(--text-secondary)', padding: '7px 14px', borderRadius: 20, fontSize: 13, fontWeight: 500, border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'Outfit,sans-serif' }}>
                                <CalendarOutlined style={{ color: fmt.color, opacity: 0.8 }} />
                                {new Date(lookup.preferredDate).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }).replace('/', '.')}
                            </span>
                        )}

                        {lookup.preferredTime && (
                            <span style={{ background: 'var(--bg-raised)', color: 'var(--text-secondary)', padding: '7px 14px', borderRadius: 20, fontSize: 13, fontWeight: 500, border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'Outfit,sans-serif' }}>
                                <ClockCircleOutlined style={{ color: fmt.color, opacity: 0.8 }} />
                                {lookup.preferredTime}
                            </span>
                        )}

                        {lookup.district && (
                            <span style={{ background: 'var(--bg-raised)', color: 'var(--text-secondary)', padding: '7px 14px', borderRadius: 20, fontSize: 13, fontWeight: 500, border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'Outfit,sans-serif' }}>
                                <EnvironmentOutlined style={{ color: fmt.color, opacity: 0.8 }} />
                                {lookup.district}
                            </span>
                        )}
                    </div>

                    {/* Message */}
                    {lookup.message && (
                        <div style={{
                            background: 'var(--bg-raised)',
                            border: '1px solid var(--border-color)',
                            borderRadius: 12, padding: '14px 16px',
                            fontSize: 14, color: 'var(--text-secondary)',
                            fontFamily: 'Outfit,sans-serif', lineHeight: 1.6,
                            marginBottom: 20,
                        }}>
                            {lookup.message}
                        </div>
                    )}

                    {/* Phone contact */}
                    {lookup.contactPhone && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                            <div style={{ fontSize: 12, color: 'var(--text-tertiary)', fontFamily: 'Outfit,sans-serif' }}>
                                {t('lookup.detail.contact')}
                            </div>
                            <a
                                href={`tel:${lookup.contactPhone}`}
                                style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 6,
                                    background: 'var(--bg-raised)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: 20, padding: '5px 14px',
                                    color: 'var(--text-primary)', fontFamily: 'Outfit,sans-serif',
                                    fontSize: 13, fontWeight: 600,
                                    textDecoration: 'none',
                                }}
                            >
                                <PhoneOutlined style={{ fontSize: 11 }} />
                                {lookup.contactPhone}
                            </a>
                        </div>
                    )}

                    {/* CTA */}
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        {!isCreator && isOpen && !hasResponded && (
                            <button
                                onClick={() => { if (!currentUser) { navigate(`/login?returnTo=/lookup/${id}`); return; } setRespondOpen(true); }}
                                style={{
                                    flex: 1, minWidth: 160,
                                    height: 48,
                                    background: fmt.color,
                                    border: 'none', borderRadius: 12,
                                    color: '#060c18',
                                    fontFamily: "'ClashDisplay-Variable','Clash Display',sans-serif",
                                    fontWeight: 800, fontSize: 15,
                                    cursor: 'pointer',
                                    boxShadow: `0 4px 16px ${fmt.color}40`,
                                    transition: 'transform 0.15s',
                                }}
                                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
                                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                            >
                                {currentUser ? t('lookup.detail.respondCta') : t('lookup.detail.loginToRespond')}
                            </button>
                        )}

                        {hasResponded && (
                            <div style={{
                                flex: 1, minWidth: 160,
                                height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                background: 'rgba(0,232,122,0.08)',
                                border: '1px solid rgba(0,232,122,0.2)',
                                borderRadius: 12,
                                color: '#00e87a',
                                fontFamily: 'Outfit,sans-serif', fontWeight: 700, fontSize: 14,
                            }}>
                                <CheckCircleOutlined /> {t('lookup.detail.responded')}
                            </div>
                        )}

                        {isCreator && isOpen && (
                            <>
                                <button
                                    onClick={async () => {
                                        await updateStatus({ id, userId: currentUser.id, status: 'matched' });
                                        message.success(t('lookup.statusMatched'));
                                    }}
                                    style={{
                                        height: 40, padding: '0 18px',
                                        background: 'rgba(0,232,122,0.08)',
                                        border: '1px solid rgba(0,232,122,0.25)',
                                        borderRadius: 10, color: '#00e87a',
                                        fontFamily: 'Outfit,sans-serif', fontWeight: 600, fontSize: 13,
                                        cursor: 'pointer',
                                    }}
                                >
                                    <CheckCircleOutlined /> {t('lookup.detail.foundOpponent')}
                                </button>
                                <button
                                    onClick={async () => {
                                        await updateStatus({ id, userId: currentUser.id, status: 'cancelled' });
                                        message.success(t('lookup.statusCancelled'));
                                    }}
                                    style={{
                                        height: 40, padding: '0 18px',
                                        background: 'rgba(240,68,56,0.06)',
                                        border: '1px solid rgba(240,68,56,0.2)',
                                        borderRadius: 10, color: '#f04438',
                                        fontFamily: 'Outfit,sans-serif', fontWeight: 600, fontSize: 13,
                                        cursor: 'pointer',
                                    }}
                                >
                                    <CloseCircleOutlined /> {t('lookup.detail.cancel')}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* ── RESPONSES ──────────────────────────────── */}
            {(lookup.responses || []).length > 0 && (
                <div style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 16, marginBottom: 16, overflow: 'hidden',
                }}>
                    <div style={{
                        padding: '14px 20px',
                        borderBottom: '1px solid var(--border-color)',
                        display: 'flex', alignItems: 'center', gap: 8,
                    }}>
                        <UserOutlined style={{ color: fmt.color }} />
                        <span style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>
                            {t('lookup.detail.responsesTitle')} · {lookup.responses.length}
                        </span>
                    </div>
                    <div style={{ padding: '12px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {lookup.responses.map((r, i) => (
                            <div key={i} style={{
                                display: 'flex', alignItems: 'flex-start', gap: 12,
                                padding: '12px 14px',
                                background: 'var(--bg-raised)',
                                border: '1px solid var(--border-color)',
                                borderRadius: 12,
                            }}>
                                <Avatar src={r.userAvatar} name={r.userName} size={38} />
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                                        <span style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>
                                            {r.teamName ? `${r.teamName}` : r.userName}
                                        </span>
                                        {r.teamName && (
                                            <span style={{ fontSize: 12, color: 'var(--text-tertiary)', fontFamily: 'Outfit,sans-serif' }}>· {r.userName}</span>
                                        )}
                                        {r.contactPhone && (
                                            <a
                                                href={`tel:${r.contactPhone}`}
                                                style={{ color: 'var(--text-secondary)', fontSize: 12, fontFamily: 'Outfit,sans-serif', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}
                                                onClick={e => e.stopPropagation()}
                                            >
                                                <PhoneOutlined style={{ fontSize: 10 }} />
                                                {r.contactPhone}
                                            </a>
                                        )}
                                        <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'Outfit,sans-serif' }}>
                                            {timeAgo(r.createdAt)}
                                        </span>
                                    </div>
                                    {r.message && (
                                        <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontFamily: 'Outfit,sans-serif' }}>
                                            {r.message}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── CHAT ───────────────────────────────────── */}
            <div style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: 16,
                overflow: 'hidden',
            }}>
                <div style={{
                    padding: '14px 20px',
                    borderBottom: '1px solid var(--border-color)',
                    display: 'flex', alignItems: 'center', gap: 8,
                }}>
                    <MessageOutlined style={{ color: fmt.color }} />
                    <span style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>
                        {t('lookup.detail.chatTitle')}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--text-tertiary)', fontFamily: 'Outfit,sans-serif' }}>
                        · {t('lookup.detail.chatSubtitle')}
                    </span>
                </div>

                {/* Messages */}
                <div style={{
                    minHeight: 180, maxHeight: 320,
                    overflowY: 'auto',
                    padding: '14px 20px',
                    display: 'flex', flexDirection: 'column', gap: 10,
                }}>
                    {messages.length === 0 ? (
                        <div style={{
                            flex: 1, display: 'flex', flexDirection: 'column',
                            alignItems: 'center', justifyContent: 'center',
                            padding: '20px 0', color: 'var(--text-tertiary)',
                            fontFamily: 'Outfit,sans-serif', fontSize: 13,
                        }}>
                            <MessageOutlined style={{ fontSize: 28, marginBottom: 8, opacity: 0.3 }} />
                            {t('lookup.detail.chatEmpty')}
                        </div>
                    ) : messages.map((msg) => {
                        const isOwn = msg.userId === currentUser?.id;
                        return (
                            <div key={msg.id} style={{ display: 'flex', gap: 9, alignItems: 'flex-start', flexDirection: isOwn ? 'row-reverse' : 'row' }}>
                                <Avatar src={msg.userAvatar} name={msg.userName} size={30} />
                                <div style={{ maxWidth: '75%' }}>
                                    {!isOwn && (
                                        <div style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'Outfit,sans-serif', marginBottom: 3, marginLeft: 4 }}>
                                            {msg.userName}
                                        </div>
                                    )}
                                    <div style={{
                                        background: isOwn ? fmt.color : 'var(--bg-raised)',
                                        color: isOwn ? '#060c18' : 'var(--text-primary)',
                                        padding: '9px 13px',
                                        borderRadius: isOwn ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                                        fontSize: 13, fontFamily: 'Outfit,sans-serif',
                                        lineHeight: 1.5,
                                        border: isOwn ? 'none' : '1px solid var(--border-color)',
                                    }}>
                                        {msg.message}
                                    </div>
                                    <div style={{ fontSize: 10, color: 'var(--text-tertiary)', fontFamily: 'Outfit,sans-serif', marginTop: 3, textAlign: isOwn ? 'right' : 'left', paddingLeft: isOwn ? 0 : 4, paddingRight: isOwn ? 4 : 0 }}>
                                        {timeAgo(msg.createdAt)}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={chatBottomRef} />
                </div>

                {/* Input */}
                <div style={{
                    padding: '12px 16px',
                    borderTop: '1px solid var(--border-color)',
                    display: 'flex', gap: 10, alignItems: 'flex-end',
                }}>
                    <TextArea
                        value={chatText}
                        onChange={e => setChatText(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                        placeholder={currentUser ? t('lookup.detail.chatPlaceholder') : t('lookup.detail.chatLogin')}
                        disabled={!currentUser}
                        autoSize={{ minRows: 1, maxRows: 4 }}
                        style={{
                            flex: 1,
                            background: 'var(--bg-raised)',
                            border: '1px solid var(--border-color)',
                            borderRadius: 10, resize: 'none',
                            color: 'var(--text-primary)',
                            fontFamily: 'Outfit,sans-serif', fontSize: 13,
                        }}
                    />
                    <button
                        onClick={handleSendMessage}
                        disabled={!chatText.trim() || sending || !currentUser}
                        style={{
                            width: 40, height: 40, flexShrink: 0,
                            background: chatText.trim() && currentUser ? fmt.color : 'var(--bg-raised)',
                            border: 'none', borderRadius: 10,
                            color: chatText.trim() && currentUser ? '#060c18' : 'var(--text-tertiary)',
                            cursor: chatText.trim() && currentUser ? 'pointer' : 'default',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 16, transition: 'all 0.15s',
                        }}
                    >
                        <SendOutlined />
                    </button>
                </div>
            </div>

            {/* ── RESPOND MODAL ──────────────────────────── */}
            <Modal
                open={respondOpen}
                onCancel={() => setRespondOpen(false)}
                footer={null}
                centered
                width={460}
                styles={{
                    content: { background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 20, padding: 0 },
                    header: { background: 'transparent', borderBottom: '1px solid var(--border-color)', padding: '20px 24px 16px' },
                    mask: { backdropFilter: 'blur(4px)' },
                }}
                title={
                    <span style={{ fontFamily: "'ClashDisplay-Variable','Clash Display',sans-serif", fontWeight: 700, fontSize: 17, color: 'var(--text-primary)' }}>
                        {t('lookup.detail.respondTitle')}
                    </span>
                }
            >
                <div style={{ padding: '20px 24px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div>
                        <label style={{ fontSize: 12, color: 'var(--text-tertiary)', fontFamily: 'Outfit,sans-serif', marginBottom: 6, display: 'block' }}>
                            {t('lookup.detail.respondLabelTeam')}
                        </label>
                        <Input
                            placeholder={t('lookup.detail.respondPlaceholderTeam')}
                            value={respondForm.teamName}
                            onChange={e => setRespondForm(f => ({ ...f, teamName: e.target.value }))}
                            style={{ background: 'var(--bg-raised)', border: '1px solid var(--border-color)', borderRadius: 10, color: 'var(--text-primary)', fontFamily: 'Outfit,sans-serif', height: 42 }}
                        />
                    </div>
                    <div>
                        <label style={{ fontSize: 12, color: 'var(--text-tertiary)', fontFamily: 'Outfit,sans-serif', marginBottom: 6, display: 'block' }}>
                            {t('lookup.detail.respondLabelPhone')}
                        </label>
                        <Input
                            placeholder={t('lookup.detail.respondPlaceholderPhone')}
                            value={respondForm.contactPhone}
                            onChange={e => setRespondForm(f => ({ ...f, contactPhone: e.target.value }))}
                            prefix={<PhoneOutlined style={{ color: 'var(--text-tertiary)' }} />}
                            style={{ background: 'var(--bg-raised)', border: '1px solid var(--border-color)', borderRadius: 10, color: 'var(--text-primary)', fontFamily: 'Outfit,sans-serif', height: 42 }}
                        />
                    </div>
                    <div>
                        <label style={{ fontSize: 12, color: 'var(--text-tertiary)', fontFamily: 'Outfit,sans-serif', marginBottom: 6, display: 'block' }}>
                            {t('lookup.detail.respondLabelMessage')}
                        </label>
                        <TextArea
                            placeholder={t('lookup.detail.respondPlaceholderMessage')}
                            value={respondForm.message}
                            onChange={e => setRespondForm(f => ({ ...f, message: e.target.value }))}
                            rows={3}
                            style={{ background: 'var(--bg-raised)', border: '1px solid var(--border-color)', borderRadius: 10, color: 'var(--text-primary)', fontFamily: 'Outfit,sans-serif', resize: 'none' }}
                        />
                    </div>
                    <button
                        onClick={handleRespond}
                        disabled={responding}
                        style={{
                            width: '100%', height: 48,
                            background: fmt.color,
                            border: 'none', borderRadius: 12,
                            color: '#060c18',
                            fontFamily: "'ClashDisplay-Variable','Clash Display',sans-serif",
                            fontWeight: 800, fontSize: 15,
                            cursor: responding ? 'not-allowed' : 'pointer',
                            opacity: responding ? 0.7 : 1,
                            marginTop: 4,
                        }}
                    >
                        {responding ? t('lookup.detail.respondSubmitting') : t('lookup.detail.respondSubmit')}
                    </button>
                </div>
            </Modal>
        </div>
    );
};

export default LookupDetailPage;
