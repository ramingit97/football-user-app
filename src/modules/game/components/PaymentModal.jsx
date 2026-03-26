import React, { useState } from 'react';
import { Modal, Button, Typography, Result, message, Space } from 'antd';
import { WalletOutlined, CheckCircleOutlined, WarningOutlined, PlusCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useProcessPaymentMutation } from '../../../store/paymentsApi';
import { useNavigate } from 'react-router-dom';

const { Text } = Typography;

const PaymentModal = ({ visible, onCancel, onSuccess, game, user }) => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [processPayment, { isLoading }] = useProcessPaymentMutation();
    const [paymentStatus, setPaymentStatus] = useState('initial'); // initial, processing, success, error

    // DYNAMIC PRICING: Use slotPrice if set, otherwise use game price, fallback to 1.00
    const gamePrice = game?.slotPrice > 0
        ? Number(game.slotPrice)
        : (game?.price > 0 ? Number(game.price) : 1.00);

    const handlePay = async () => {
        if (!user) return;
        if ((user.balance || 0) < gamePrice) {
            message.error(t('game.payment.insufficientFunds'));
            return;
        }

        // NOTE: We do NOT call processPayment here!
        // The backend joinGame endpoint handles the actual payment.
        // This modal is only a confirmation UI that checks balance.
        setPaymentStatus('success');

        // Wait a moment before closing/proceeding
        setTimeout(() => {
            onSuccess();
        }, 1000);
    };

    const handleTopUp = () => {
        onCancel(); // Close modal
        navigate('/profile'); // Go to profile to top up
    };

    const renderContent = () => {
        if (paymentStatus === 'success') {
            return (
                <Result
                    status="success"
                    title={t('game.payment.success')}
                    subTitle={t('game.payment.charged', { n: gamePrice.toFixed(2) })}
                    icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                />
            );
        }

        if (paymentStatus === 'error') {
            return (
                <Result
                    status="error"
                    title={t('game.payment.error')}
                    subTitle={t('game.payment.failedCharge')}
                    extra={[
                        <Button type="primary" key="retry" onClick={handlePay}>
                            {t('game.payment.retry')}
                        </Button>,
                        <Button key="cancel" onClick={onCancel}>
                            {t('game.payment.cancel')}
                        </Button>,
                    ]}
                />
            );
        }

        const balance = user?.balance || 0;
        const sufficientFunds = balance >= gamePrice;
        const deficit = gamePrice - balance;

        return (
            <div style={{ textAlign: 'center' }}>
                {/* Price Display */}
                <div style={{
                    background: sufficientFunds
                        ? 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)'
                        : 'linear-gradient(135deg, #ff4d4f 0%, #cf1322 100%)',
                    padding: 24,
                    borderRadius: 12,
                    marginBottom: 24,
                    color: 'white'
                }}>
                    <div style={{ opacity: 0.9, fontSize: 14, marginBottom: 4 }}>{t('game.payment.pricePerSlot')}</div>
                    <div style={{ fontSize: 42, fontWeight: 'bold' }}>{gamePrice.toFixed(2)} AZN</div>
                </div>

                {/* Balance Info */}
                <div style={{
                    marginBottom: 24,
                    textAlign: 'left',
                    background: 'rgba(0,0,0,0.02)',
                    padding: 16,
                    borderRadius: 8,
                    border: `1px solid ${sufficientFunds ? '#52c41a' : '#ff4d4f'}20`
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <Text type="secondary">{t('game.payment.yourBalance')}</Text>
                        <Text strong style={{ fontSize: 20, color: sufficientFunds ? '#52c41a' : '#ff4d4f' }}>
                            {balance.toFixed(2)} AZN
                        </Text>
                    </div>

                    {!sufficientFunds && (
                        <>
                            <div style={{
                                color: '#ff4d4f',
                                fontSize: 13,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                                marginBottom: 12
                            }}>
                                <WarningOutlined /> {t('game.payment.shortage', { n: deficit.toFixed(2) })}
                            </div>
                            <Button
                                type="primary"
                                icon={<PlusCircleOutlined />}
                                onClick={handleTopUp}
                                block
                                style={{
                                    background: 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)',
                                    border: 'none'
                                }}
                            >
                                {t('game.payment.topUp')}
                            </Button>
                        </>
                    )}
                </div>

                {/* Pay Button */}
                {sufficientFunds && (
                    <Button
                        type="primary"
                        size="large"
                        block
                        icon={<WalletOutlined />}
                        onClick={handlePay}
                        loading={isLoading || paymentStatus === 'processing'}
                        style={{ height: 48, fontSize: 18 }}
                    >
                        {t('game.payment.payFromWallet')}
                    </Button>
                )}

                {/* Game Info */}
                <div style={{ marginTop: 16, color: '#888', fontSize: 12 }}>
                    📍 {game?.location || 'Стадион'} • 🕐 {game?.time || '20:00'}
                </div>
            </div>
        );
    };

    return (
        <Modal
            open={visible}
            onCancel={onCancel}
            footer={null}
            centered
            width={400}
            destroyOnClose
            title={<span style={{ fontSize: 18 }}>💳 {t('game.payment.title')}</span>}
        >
            {renderContent()}
        </Modal>
    );
};

export default PaymentModal;
