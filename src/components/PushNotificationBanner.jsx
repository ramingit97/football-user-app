import React, { useState, useEffect } from 'react';
import { Button, Card, Typography, Space, message } from 'antd';
import { BellOutlined, CloseOutlined, CheckOutlined } from '@ant-design/icons';
import { requestForToken } from '../firebase';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { API_BASE } from '../config.js';

const { Text, Title } = Typography;

const PushNotificationBanner = ({ user }) => {
    const { t } = useTranslation();
    const [visible, setVisible] = useState(false);
    const [permissionStatus, setPermissionStatus] = useState('default');

    useEffect(() => {
        // Check if notifications are supported
        if (!('Notification' in window) || !('serviceWorker' in navigator)) {
            return;
        }

        // Check current permission status
        setPermissionStatus(Notification.permission);

        // Check if user dismissed the banner before
        const dismissed = localStorage.getItem(`push_banner_dismissed_${user?.id}`);

        // Show banner if:
        // 1. Permission is 'default' (not asked yet)
        // 2. User hasn't dismissed the banner
        // 3. User is logged in
        if (Notification.permission === 'default' && !dismissed && user?.id) {
            // Delay showing the banner
            const timer = setTimeout(() => {
                setVisible(true);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [user?.id]);

    const handleEnableNotifications = async () => {
        try {
            const permission = await Notification.requestPermission();
            setPermissionStatus(permission);

            if (permission === 'granted') {
                const token = await requestForToken();
                if (token && user?.id) {
                    // Send token to backend
                    await axios.patch(
                        `${API_BASE}/api/users/${user.id}/fcm-token`,
                        { token }
                    );
                    message.success(t('pwa.push.enabled'));
                }
                setVisible(false);
            } else if (permission === 'denied') {
                message.warning(t('pwa.push.denied'));
                handleDismiss();
            }
        } catch (error) {
            console.error('Error enabling notifications:', error);
            message.error(t('pwa.push.error'));
        }
    };

    const handleDismiss = () => {
        localStorage.setItem(`push_banner_dismissed_${user?.id}`, 'true');
        setVisible(false);
    };

    if (!visible) return null;

    return (
        <div style={{
            position: 'fixed',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            width: '90%',
            maxWidth: 420,
            animation: 'slideUp 0.3s ease-out'
        }}>
            <Card
                style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    border: 'none',
                    borderRadius: 16,
                    boxShadow: '0 8px 32px rgba(102, 126, 234, 0.4)'
                }}
                bodyStyle={{ padding: 20 }}
            >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                    <div style={{
                        background: 'rgba(255,255,255,0.2)',
                        borderRadius: 12,
                        padding: 12,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <BellOutlined style={{ fontSize: 28, color: 'white' }} />
                    </div>

                    <div style={{ flex: 1 }}>
                        <Title level={5} style={{ color: 'white', margin: 0, marginBottom: 4 }}>
                            {t('pwa.push.title')}
                        </Title>
                        <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13 }}>
                            {t('pwa.push.description')}
                        </Text>

                        <Space style={{ marginTop: 12 }}>
                            <Button
                                type="primary"
                                icon={<CheckOutlined />}
                                onClick={handleEnableNotifications}
                                style={{
                                    background: 'white',
                                    color: '#667eea',
                                    border: 'none',
                                    fontWeight: 600
                                }}
                            >
                                {t('pwa.push.enable')}
                            </Button>
                            <Button
                                type="text"
                                onClick={handleDismiss}
                                style={{ color: 'rgba(255,255,255,0.7)' }}
                            >
                                {t('pwa.push.later')}
                            </Button>
                        </Space>
                    </div>

                    <Button
                        type="text"
                        icon={<CloseOutlined />}
                        onClick={handleDismiss}
                        style={{
                            color: 'rgba(255,255,255,0.6)',
                            position: 'absolute',
                            top: 8,
                            right: 8
                        }}
                        size="small"
                    />
                </div>
            </Card>

            <style>{`
                @keyframes slideUp {
                    from {
                        opacity: 0;
                        transform: translateX(-50%) translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(-50%) translateY(0);
                    }
                }
            `}</style>
        </div>
    );
};

export default PushNotificationBanner;
