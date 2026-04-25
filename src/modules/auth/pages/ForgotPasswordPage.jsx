import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, message } from 'antd';
import { MailOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const ForgotPasswordPage = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [form] = Form.useForm();

    const handleSubmit = async ({ email }) => {
        setLoading(true);
        try {
            await axios.post(`${API_BASE}/api/auth/forgot-password`, { email });
            setSent(true);
        } catch {
            message.error(t('auth.forgotPasswordPage.sendError'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card glass-card animate-fade-in">
                <div className="auth-header">
                    <img
                        src="/logo.png"
                        alt="logo"
                        style={{ width: 120, height: 'auto', objectFit: 'contain', marginBottom: 8, filter: 'brightness(0) invert(1)' }}
                    />
                    <h1 className="auth-title">{t('auth.forgotPasswordPage.title')}</h1>
                    <p className="auth-subtitle">
                        {sent
                            ? t('auth.forgotPasswordPage.subtitleSent')
                            : t('auth.forgotPasswordPage.subtitle')}
                    </p>
                </div>

                {!sent ? (
                    <Form form={form} onFinish={handleSubmit} layout="vertical" style={{ marginTop: 24 }}>
                        <Form.Item
                            name="email"
                            rules={[
                                { required: true, message: t('auth.forgotPasswordPage.emailRequired') },
                                { type: 'email', message: t('auth.forgotPasswordPage.emailInvalid') },
                            ]}
                        >
                            <Input
                                prefix={<MailOutlined style={{ color: 'var(--text-tertiary)' }} />}
                                placeholder="Email"
                                size="large"
                                style={{ borderRadius: 10 }}
                            />
                        </Form.Item>

                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={loading}
                            block
                            size="large"
                            style={{ borderRadius: 10, marginTop: 8 }}
                        >
                            {t('auth.forgotPasswordPage.sendBtn')}
                        </Button>
                    </Form>
                ) : (
                    <div style={{ textAlign: 'center', padding: '24px 0' }}>
                        <div style={{ fontSize: 48, marginBottom: 16 }}>📧</div>
                        <p style={{ color: 'var(--text-secondary)' }}>
                            {t('auth.forgotPasswordPage.successText')}
                        </p>
                        <p style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>
                            {t('auth.forgotPasswordPage.noEmail')}
                        </p>
                    </div>
                )}

                <div style={{ textAlign: 'center', marginTop: 24 }}>
                    <a
                        href="#"
                        onClick={(e) => { e.preventDefault(); navigate('/login'); }}
                        style={{ color: 'var(--text-tertiary)', fontSize: 14, display: 'inline-flex', alignItems: 'center', gap: 6 }}
                    >
                        <ArrowLeftOutlined /> {t('auth.forgotPasswordPage.backToLogin')}
                    </a>
                </div>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;
