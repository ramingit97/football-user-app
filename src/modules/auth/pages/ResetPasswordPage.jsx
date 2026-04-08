import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Form, Input, Button, message } from 'antd';
import { LockOutlined, CheckCircleOutlined } from '@ant-design/icons';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const ResetPasswordPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);
    const [form] = Form.useForm();

    useEffect(() => {
        if (!token) navigate('/login', { replace: true });
    }, [token, navigate]);

    const handleSubmit = async ({ password }) => {
        setLoading(true);
        try {
            await axios.post(`${API_BASE}/api/auth/reset-password`, { token, password });
            setDone(true);
        } catch (err) {
            const msg = err?.response?.data?.message || 'Ссылка недействительна или истекла';
            message.error(msg);
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
                    <h1 className="auth-title">Новый пароль</h1>
                    <p className="auth-subtitle">
                        {done ? 'Пароль успешно изменён!' : 'Придумайте новый пароль для вашего аккаунта.'}
                    </p>
                </div>

                {!done ? (
                    <Form form={form} onFinish={handleSubmit} layout="vertical" style={{ marginTop: 24 }}>
                        <Form.Item
                            name="password"
                            rules={[
                                { required: true, message: 'Введите новый пароль' },
                                { min: 6, message: 'Минимум 6 символов' },
                            ]}
                        >
                            <Input.Password
                                prefix={<LockOutlined style={{ color: 'var(--text-tertiary)' }} />}
                                placeholder="Новый пароль"
                                size="large"
                                style={{ borderRadius: 10 }}
                            />
                        </Form.Item>

                        <Form.Item
                            name="confirm"
                            dependencies={['password']}
                            rules={[
                                { required: true, message: 'Подтвердите пароль' },
                                ({ getFieldValue }) => ({
                                    validator(_, value) {
                                        if (!value || getFieldValue('password') === value) return Promise.resolve();
                                        return Promise.reject('Пароли не совпадают');
                                    },
                                }),
                            ]}
                        >
                            <Input.Password
                                prefix={<LockOutlined style={{ color: 'var(--text-tertiary)' }} />}
                                placeholder="Подтвердите пароль"
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
                            Сохранить пароль
                        </Button>
                    </Form>
                ) : (
                    <div style={{ textAlign: 'center', padding: '24px 0' }}>
                        <CheckCircleOutlined style={{ fontSize: 48, color: 'var(--green)', marginBottom: 16 }} />
                        <p style={{ color: 'var(--text-secondary)' }}>Теперь вы можете войти с новым паролем.</p>
                        <Button
                            type="primary"
                            size="large"
                            block
                            style={{ borderRadius: 10, marginTop: 16 }}
                            onClick={() => navigate('/login')}
                        >
                            Войти
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ResetPasswordPage;
