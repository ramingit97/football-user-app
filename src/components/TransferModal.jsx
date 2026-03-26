import React, { useState } from 'react';
import { Modal, InputNumber, Avatar, message, Form, Input, Spin } from 'antd';
import { UserOutlined, ArrowRightOutlined, SearchOutlined, SendOutlined } from '@ant-design/icons';
import { useTransferBalanceMutation, useLazySearchUsersQuery } from '../store/authApi';
import { useTranslation } from 'react-i18next';

const TransferModal = ({ visible, onClose, sender }) => {
    const { t } = useTranslation();
    const [form] = Form.useForm();
    const [transferBalance, { isLoading }] = useTransferBalanceMutation();
    const [searchUsers, { data: searchData, isFetching: searching }] = useLazySearchUsersQuery();

    const [searchTerm, setSearchTerm] = useState('');
    const [recipient, setRecipient] = useState(null);

    const handleClose = () => {
        setRecipient(null);
        setSearchTerm('');
        form.resetFields();
        onClose();
    };

    const handleSearch = (value) => {
        setSearchTerm(value);
        if (value.length >= 2) {
            searchUsers({ query: value, limit: 6 });
        }
    };

    const handleTransfer = async (values) => {
        if (values.amount > sender.balance) {
            message.error(t('profile.transfer.insufficientFunds'));
            return;
        }
        try {
            await transferBalance({
                senderId: sender.id,
                receiverId: recipient.id,
                amount: values.amount,
                note: values.note,
            }).unwrap();
            message.success(t('profile.transfer.success', { amount: values.amount, name: recipient.name }));
            handleClose();
        } catch (error) {
            message.error(error.data?.message || t('profile.transfer.error'));
        }
    };

    const users = (searchData?.users || searchData?.data || searchData || [])
        .filter(u => u.id !== sender?.id);

    const getInitials = (name) => name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';

    return (
        <>
            <Modal
                open={visible}
                onCancel={handleClose}
                footer={null}
                centered
                width={420}
                closable={false}
                styles={{
                    content: {
                        background: 'linear-gradient(145deg, #0f1a13 0%, #0a0f0d 100%)',
                        border: '1px solid rgba(82,196,26,0.15)',
                        borderRadius: 24,
                        padding: 0,
                        overflow: 'hidden',
                        boxShadow: '0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(82,196,26,0.1)',
                    },
                    header: { display: 'none' },
                    body: { padding: 0 },
                    mask: { backdropFilter: 'blur(4px)', background: 'rgba(0,0,0,0.7)' },
                }}
            >
                {/* Header */}
                <div style={{
                    padding: '28px 28px 20px',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    position: 'relative',
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                    }}>
                        <div style={{
                            width: 40, height: 40,
                            borderRadius: 12,
                            background: 'rgba(82,196,26,0.15)',
                            border: '1px solid rgba(82,196,26,0.3)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <SendOutlined style={{ color: '#52c41a', fontSize: 16 }} />
                        </div>
                        <div>
                            <div style={{ color: '#fff', fontWeight: 700, fontSize: 17, lineHeight: 1.2 }}>
                                {t('profile.transfer.title')}
                            </div>
                            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 2 }}>
                                {recipient
                                    ? `${sender?.balance?.toFixed(2)} AZN ${t('profile.stats.balance') || 'доступно'}`
                                    : t('profile.transfer.searchPlaceholder')}
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        style={{
                            position: 'absolute', top: 20, right: 20,
                            background: 'rgba(255,255,255,0.07)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: 8, width: 32, height: 32,
                            cursor: 'pointer', color: 'rgba(255,255,255,0.5)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 14, transition: 'all 0.2s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
                    >
                        ✕
                    </button>
                </div>

                <div style={{ padding: '24px 28px 28px' }}>
                    {!recipient ? (
                        /* ── Step 1: Search ── */
                        <div>
                            {/* Search input */}
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: 10,
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: 14, padding: '10px 16px',
                                transition: 'border-color 0.2s',
                            }}
                                onFocus={e => e.currentTarget.style.borderColor = 'rgba(82,196,26,0.5)'}
                                onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
                            >
                                <SearchOutlined style={{ color: 'rgba(255,255,255,0.3)', fontSize: 16 }} />
                                <input
                                    value={searchTerm}
                                    onChange={e => handleSearch(e.target.value)}
                                    placeholder={t('profile.transfer.searchPlaceholder')}
                                    style={{
                                        flex: 1, background: 'transparent', border: 'none', outline: 'none',
                                        color: '#fff', fontSize: 15,
                                    }}
                                />
                                {searchTerm && (
                                    <button
                                        onClick={() => { setSearchTerm(''); }}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', fontSize: 16, padding: 0 }}
                                    >✕</button>
                                )}
                            </div>

                            {/* Results */}
                            <div style={{ marginTop: 12, minHeight: 80 }}>
                                {searching && (
                                    <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
                                        <Spin />
                                    </div>
                                )}

                                {!searching && searchTerm.length >= 2 && users.length === 0 && (
                                    <div style={{ textAlign: 'center', padding: '24px 0', color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>
                                        Игроки не найдены
                                    </div>
                                )}

                                {!searching && users.map((user) => (
                                    <div
                                        key={user.id}
                                        onClick={() => setRecipient(user)}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 12,
                                            padding: '10px 12px', borderRadius: 12, cursor: 'pointer',
                                            transition: 'background 0.15s', marginBottom: 4,
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(82,196,26,0.08)'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <Avatar
                                            src={user.avatar}
                                            size={44}
                                            style={{ background: 'linear-gradient(135deg, #52c41a, #237804)', flexShrink: 0, fontSize: 16, fontWeight: 700 }}
                                        >
                                            {!user.avatar && getInitials(user.name)}
                                        </Avatar>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ color: '#fff', fontWeight: 600, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {user.name}
                                            </div>
                                            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 1 }}>
                                                {user.phone || user.email}
                                            </div>
                                        </div>
                                        <ArrowRightOutlined style={{ color: 'rgba(82,196,26,0.5)', fontSize: 14 }} />
                                    </div>
                                ))}

                                {!searching && searchTerm.length < 2 && (
                                    <div style={{ textAlign: 'center', padding: '20px 0' }}>
                                        <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
                                        <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>
                                            Введите имя или номер телефона
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        /* ── Step 2: Transfer form ── */
                        <div>
                            {/* Players row */}
                            <div style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                gap: 0, marginBottom: 28,
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.07)',
                                borderRadius: 18, padding: '20px 16px',
                            }}>
                                {/* Sender */}
                                <div style={{ textAlign: 'center', flex: 1 }}>
                                    <Avatar
                                        src={sender?.avatar}
                                        size={60}
                                        style={{ background: 'linear-gradient(135deg, #52c41a, #237804)', fontSize: 20, fontWeight: 700 }}
                                    >
                                        {!sender?.avatar && getInitials(sender?.name)}
                                    </Avatar>
                                    <div style={{ color: '#fff', fontWeight: 700, fontSize: 13, marginTop: 8 }}>
                                        {sender?.name}
                                    </div>
                                    <div style={{
                                        display: 'inline-block', marginTop: 4,
                                        background: 'rgba(82,196,26,0.15)', border: '1px solid rgba(82,196,26,0.3)',
                                        borderRadius: 20, padding: '2px 10px',
                                        color: '#52c41a', fontSize: 11, fontWeight: 600,
                                    }}>
                                        {sender?.balance?.toFixed(2)} ₼
                                    </div>
                                </div>

                                {/* Arrow */}
                                <div style={{
                                    width: 36, height: 36, borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #52c41a, #237804)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    boxShadow: '0 0 16px rgba(82,196,26,0.4)',
                                    flexShrink: 0,
                                }}>
                                    <ArrowRightOutlined style={{ color: '#fff', fontSize: 14 }} />
                                </div>

                                {/* Recipient */}
                                <div style={{ textAlign: 'center', flex: 1 }}>
                                    <Avatar
                                        src={recipient.avatar}
                                        size={60}
                                        style={{ background: 'linear-gradient(135deg, #1890ff, #0050b3)', fontSize: 20, fontWeight: 700 }}
                                    >
                                        {!recipient.avatar && getInitials(recipient.name)}
                                    </Avatar>
                                    <div style={{ color: '#fff', fontWeight: 700, fontSize: 13, marginTop: 8 }}>
                                        {recipient.name}
                                    </div>
                                    <button
                                        onClick={() => setRecipient(null)}
                                        style={{
                                            marginTop: 4, background: 'none', border: 'none',
                                            color: 'rgba(255,255,255,0.35)', fontSize: 11,
                                            cursor: 'pointer', padding: 0, textDecoration: 'underline',
                                        }}
                                    >
                                        {t('profile.transfer.changeRecipient')}
                                    </button>
                                </div>
                            </div>

                            {/* Form */}
                            <Form form={form} layout="vertical" onFinish={handleTransfer} initialValues={{ amount: 1 }}>
                                {/* Amount */}
                                <Form.Item
                                    name="amount"
                                    label={
                                        <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                            {t('profile.transfer.amountLabel')}
                                        </span>
                                    }
                                    rules={[
                                        { required: true, message: t('profile.transfer.amountPlaceholder') },
                                        { type: 'number', min: 0.1, message: t('profile.transfer.minAmount') },
                                    ]}
                                    style={{ marginBottom: 16 }}
                                >
                                    <InputNumber
                                        style={{
                                            width: '100%', height: 56, fontSize: 24, fontWeight: 700,
                                            background: 'rgba(255,255,255,0.05)',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: 14, color: '#52c41a',
                                        }}
                                        prefix={<span style={{ color: '#52c41a', fontWeight: 700, fontSize: 20 }}>₼</span>}
                                        step={0.10}
                                        precision={2}
                                        min={0.1}
                                        max={sender?.balance}
                                        variant="borderless"
                                    />
                                </Form.Item>

                                {/* Note */}
                                <Form.Item
                                    name="note"
                                    label={
                                        <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                            {t('profile.transfer.messageLabel')}
                                        </span>
                                    }
                                    style={{ marginBottom: 20 }}
                                >
                                    <Input
                                        placeholder={t('profile.transfer.messagePlaceholder')}
                                        style={{
                                            background: 'rgba(255,255,255,0.05)',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: 14, color: '#fff', height: 46,
                                        }}
                                        variant="borderless"
                                    />
                                </Form.Item>

                                {/* Submit */}
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    style={{
                                        width: '100%', height: 54, borderRadius: 14, border: 'none',
                                        background: isLoading ? 'rgba(82,196,26,0.4)' : 'linear-gradient(135deg, #52c41a 0%, #237804 100%)',
                                        color: '#fff', fontSize: 16, fontWeight: 700, cursor: isLoading ? 'not-allowed' : 'pointer',
                                        boxShadow: '0 8px 24px rgba(82,196,26,0.3)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                        transition: 'all 0.2s',
                                    }}
                                    onMouseEnter={e => { if (!isLoading) e.currentTarget.style.boxShadow = '0 12px 32px rgba(82,196,26,0.45)'; }}
                                    onMouseLeave={e => e.currentTarget.style.boxShadow = '0 8px 24px rgba(82,196,26,0.3)'}
                                >
                                    {isLoading ? (
                                        <Spin size="small" />
                                    ) : (
                                        <>
                                            <SendOutlined />
                                            {t('profile.transfer.transferBtn')}
                                        </>
                                    )}
                                </button>
                            </Form>
                        </div>
                    )}
                </div>
            </Modal>
        </>
    );
};

export default TransferModal;
