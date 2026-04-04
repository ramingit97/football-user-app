import { useState, useRef, useEffect } from 'react';
import { Input, Spin, Empty } from 'antd';
import { SendOutlined, CustomerServiceOutlined, CheckCircleFilled } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useGetMyTicketsQuery, useCreateTicketMutation } from '../../../store/supportApi';

const { TextArea } = Input;

const SupportChat = ({ user }) => {
    const { t } = useTranslation();
    const [text, setText] = useState('');
    const bottomRef = useRef(null);

    const { data: tickets = [], isLoading, refetch } = useGetMyTicketsQuery(user?.id, { skip: !user?.id, pollingInterval: 15000 });
    const [createTicket, { isLoading: isSending }] = useCreateTicketMutation();

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [tickets]);

    const handleSend = async () => {
        const msg = text.trim();
        if (!msg || isSending) return;
        try {
            await createTicket({
                userId: user.id,
                userName: user.name || 'İstifadəçi',
                userEmail: user.email || '',
                message: msg,
            }).unwrap();
            setText('');
        } catch {}
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
    };

    if (isLoading) return (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
            <Spin />
        </div>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '60vh', minHeight: 400 }}>

            {/* Header */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '16px 20px',
                borderBottom: '1px solid var(--border-color)',
                background: 'var(--bg-raised)',
                borderRadius: '12px 12px 0 0',
            }}>
                <div style={{
                    width: 40, height: 40, borderRadius: '50%',
                    background: 'rgba(0,232,122,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--green)', fontSize: 18, flexShrink: 0,
                    border: '2px solid rgba(0,232,122,0.3)',
                }}>
                    <CustomerServiceOutlined />
                </div>
                <div>
                    <div style={{ fontFamily: "'ClashDisplay-Variable', 'Clash Display', sans-serif", fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>
                        {t('support.title')}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
                        <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#00e87a' }} />
                        <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{t('support.online')}</span>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div style={{
                flex: 1, overflowY: 'auto', padding: '20px 16px',
                display: 'flex', flexDirection: 'column', gap: 16,
            }}>
                {/* Welcome message */}
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
                    <div style={{
                        width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                        background: 'rgba(0,232,122,0.15)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'var(--green)', fontSize: 13,
                    }}>
                        <CustomerServiceOutlined />
                    </div>
                    <div style={{
                        background: 'var(--bg-raised)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '16px 16px 16px 4px',
                        padding: '10px 14px', maxWidth: '75%',
                    }}>
                        <div style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.5 }}>
                            {t('support.welcomeMsg')}
                        </div>
                    </div>
                </div>

                {tickets.length === 0 && (
                    <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13, padding: '20px 0' }}>
                        {t('support.noMessages')}
                    </div>
                )}

                {tickets.map(ticket => (
                    <div key={ticket.id} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {/* User message — skip for system notifications (empty message) */}
                        {ticket.message && (
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <div style={{
                                background: 'var(--green)',
                                borderRadius: '16px 16px 4px 16px',
                                padding: '10px 14px', maxWidth: '75%',
                            }}>
                                <div style={{ fontSize: 14, color: '#060c18', lineHeight: 1.5 }}>
                                    {ticket.message}
                                </div>
                                <div style={{ fontSize: 11, color: 'rgba(6,12,24,0.5)', marginTop: 4, textAlign: 'right', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                                    {new Date(ticket.createdAt).toLocaleTimeString('az', { hour: '2-digit', minute: '2-digit' })}
                                    {ticket.status === 'replied'
                                        ? <CheckCircleFilled style={{ color: 'rgba(6,12,24,0.6)' }} />
                                        : <span style={{ opacity: 0.5 }}>✓</span>
                                    }
                                </div>
                            </div>
                        </div>
                        )}

                        {/* Support reply */}
                        {ticket.reply && (
                            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
                                <div style={{
                                    width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                                    background: 'rgba(0,232,122,0.15)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: 'var(--green)', fontSize: 13,
                                }}>
                                    <CustomerServiceOutlined />
                                </div>
                                <div style={{
                                    background: 'var(--bg-raised)',
                                    border: '1px solid rgba(0,232,122,0.2)',
                                    borderRadius: '16px 16px 16px 4px',
                                    padding: '10px 14px', maxWidth: '75%',
                                }}>
                                    <div style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.5 }}>
                                        {ticket.reply}
                                    </div>
                                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>
                                        {new Date(ticket.updatedAt).toLocaleTimeString('az', { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
                <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div style={{
                padding: '12px 16px',
                borderTop: '1px solid var(--border-color)',
                background: 'var(--bg-raised)',
                borderRadius: '0 0 12px 12px',
                display: 'flex', gap: 10, alignItems: 'flex-end',
            }}>
                <TextArea
                    value={text}
                    onChange={e => setText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={t('support.inputPlaceholder')}
                    autoSize={{ minRows: 1, maxRows: 4 }}
                    style={{
                        flex: 1, background: 'var(--bg-card)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 12, color: 'var(--text-primary)',
                        resize: 'none', fontSize: 14,
                    }}
                    disabled={isSending}
                />
                <button
                    onClick={handleSend}
                    disabled={!text.trim() || isSending}
                    style={{
                        width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
                        background: text.trim() && !isSending ? 'var(--green)' : 'var(--bg-card)',
                        border: '1px solid var(--border-color)',
                        color: text.trim() && !isSending ? '#060c18' : 'var(--text-tertiary)',
                        cursor: text.trim() && !isSending ? 'pointer' : 'default',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 16, transition: 'all 0.15s',
                    }}
                >
                    {isSending ? <Spin size="small" /> : <SendOutlined />}
                </button>
            </div>
        </div>
    );
};

export default SupportChat;
