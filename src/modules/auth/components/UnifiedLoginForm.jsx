import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, Form, Input, message, Select, Space } from 'antd';
import { signInWithGoogle } from '../../../firebase';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../../../store/store';
import { useLoginMutation, useLoginWithGoogleMutation } from '../../../store/authApi';
import { useTranslation } from 'react-i18next';

const { Option } = Select;

const countryCodes = [
    { code: '+994', country: 'Azerbaijan', flag: '🇦🇿' },
    { code: '+90', country: 'Turkey', flag: '🇹🇷' },
    { code: '+7', country: 'Russia', flag: '🇷🇺' },
    { code: '+1', country: 'USA', flag: '🇺🇸' },
    { code: '+44', country: 'UK', flag: '🇬🇧' },
    { code: '+995', country: 'Georgia', flag: '🇬🇪' },
    { code: '+380', country: 'Ukraine', flag: '🇺🇦' },
];

const UnifiedLoginForm = ({ onSuccess }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('phone');
    const [countryCode, setCountryCode] = useState('+994');

    const [login, { isLoading }] = useLoginMutation();
    const [loginWithGoogle] = useLoginWithGoogleMutation();
    const [googleLoading, setGoogleLoading] = useState(false);
    const dispatch = useDispatch();

    const handleSuccess = (response) => {
        dispatch(setCredentials({ user: response.user, token: response.access_token }));
        localStorage.setItem('token', response.access_token);
        localStorage.setItem('user', JSON.stringify(response.user));
        message.success(t('auth.unifiedLogin.successLogin'));
        onSuccess();
    };

    const onGoogleSubmit = async () => {
        setGoogleLoading(true);
        try {
            const idToken = await signInWithGoogle();
            const response = await loginWithGoogle(idToken).unwrap();
            handleSuccess(response);
        } catch (error) {
            console.error(error);
            message.error(t('auth.unifiedLogin.loginError'));
        } finally {
            setGoogleLoading(false);
        }
    };

    const onPhoneSubmit = async (values) => {
        try {
            const response = await login({ phone: `${countryCode}${values.phone}`, password: values.password }).unwrap();
            handleSuccess(response);
        } catch (error) {
            message.error(error.data?.message || t('auth.unifiedLogin.loginError'));
        }
    };

    const onEmailSubmit = async (values) => {
        try {
            const response = await login({ email: values.email, password: values.password }).unwrap();
            handleSuccess(response);
        } catch (error) {
            message.error(error.data?.message || t('auth.unifiedLogin.loginError'));
        }
    };

    const prefixSelector = (
        <Select
            value={countryCode}
            onChange={setCountryCode}
            style={{ width: 110 }}
            dropdownMatchSelectWidth={false}
            bordered={false}
        >
            {countryCodes.map(c => (
                <Option key={c.code} value={c.code}>
                    <Space>{c.flag} {c.code}</Space>
                </Option>
            ))}
        </Select>
    );

    const tabItems = [
        {
            key: 'phone',
            label: (
                <span style={{ fontSize: '16px', fontWeight: 500 }}>
                    📱 {t('auth.unifiedLogin.phone')}
                </span>
            ),
            children: (
                <div style={{ marginTop: '24px' }}>
                    <Form layout="vertical" onFinish={onPhoneSubmit}>
                        <Form.Item
                            name="phone"
                            rules={[{ required: true, message: t('auth.unifiedLogin.phoneRequired') }]}
                        >
                            <div className="phone-input-wrapper">
                                <Input
                                    addonBefore={prefixSelector}
                                    placeholder="70 123 45 67"
                                    className="phone-input"
                                    size="large"
                                />
                            </div>
                        </Form.Item>

                        <Form.Item
                            name="password"
                            rules={[{ required: true, message: t('auth.unifiedLogin.passwordPlaceholder') }]}
                        >
                            <div className="input-group">
                                <span className="input-icon">🔒</span>
                                <Input.Password
                                    placeholder={t('auth.unifiedLogin.passwordLabel')}
                                    bordered={false}
                                    className="auth-field-input"
                                    iconRender={visible => (visible ? '🙈' : '👁️')}
                                    size="large"
                                />
                            </div>
                        </Form.Item>

                        <button type="submit" className="submit-btn" disabled={isLoading}>
                            {isLoading ? `⏳ ${t('auth.unifiedLogin.signingIn')}` : `🚀 ${t('auth.unifiedLogin.signIn')}`}
                        </button>
                        <div style={{ textAlign: 'center', marginTop: 12 }}>
                            <a
                                href="#"
                                onClick={(e) => { e.preventDefault(); navigate('/forgot-password'); }}
                                style={{ color: 'var(--text-tertiary)', fontSize: 13 }}
                            >
                                Забыл пароль?
                            </a>
                        </div>
                    </Form>
                </div>
            ),
        },
        {
            key: 'email',
            label: (
                <span style={{ fontSize: '16px', fontWeight: 500 }}>
                    ✉️ {t('auth.unifiedLogin.emailLabel')}
                </span>
            ),
            children: (
                <div style={{ marginTop: '24px' }}>
                    <Form layout="vertical" onFinish={onEmailSubmit}>
                        <Form.Item
                            name="email"
                            rules={[
                                { required: true, message: t('auth.unifiedLogin.emailRequired') },
                                { type: 'email', message: t('auth.unifiedLogin.emailInvalid') }
                            ]}
                        >
                            <div className="input-group">
                                <span className="input-icon">✉️</span>
                                <Input
                                    placeholder={t('auth.unifiedLogin.emailLabel')}
                                    bordered={false}
                                    className="auth-field-input"
                                    size="large"
                                />
                            </div>
                        </Form.Item>

                        <Form.Item
                            name="password"
                            rules={[{ required: true, message: t('auth.unifiedLogin.passwordPlaceholder') }]}
                        >
                            <div className="input-group">
                                <span className="input-icon">🔒</span>
                                <Input.Password
                                    placeholder={t('auth.unifiedLogin.passwordLabel')}
                                    bordered={false}
                                    className="auth-field-input"
                                    iconRender={visible => (visible ? '🙈' : '👁️')}
                                    size="large"
                                />
                            </div>
                        </Form.Item>

                        <button type="submit" className="submit-btn" disabled={isLoading}>
                            {isLoading ? `⏳ ${t('auth.unifiedLogin.signingIn')}` : `🚀 ${t('auth.unifiedLogin.signIn')}`}
                        </button>
                        <div style={{ textAlign: 'center', marginTop: 12 }}>
                            <a
                                href="#"
                                onClick={(e) => { e.preventDefault(); navigate('/forgot-password'); }}
                                style={{ color: 'var(--text-tertiary)', fontSize: 13 }}
                            >
                                Забыл пароль?
                            </a>
                        </div>
                    </Form>
                </div>
            ),
        },
    ];

    return (
        <>
            <Tabs
                activeKey={activeTab}
                onChange={setActiveTab}
                items={tabItems}
                centered
                className="login-tabs"
            />

            <div style={{ margin: '16px 0 8px', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>
                — или —
            </div>

            <button
                className="google-btn"
                onClick={onGoogleSubmit}
                disabled={googleLoading}
            >
                {googleLoading ? '⏳ ...' : (
                    <>
                        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" width={22} height={22} />
                        Войти через Google
                    </>
                )}
            </button>

            <style>{`
                .login-tabs .ant-tabs-nav {
                    margin-bottom: 0 !important;
                }

                .login-tabs .ant-tabs-tab {
                    padding: 16px 24px !important;
                    color: var(--text-tertiary) !important;
                    transition: all 0.3s ease !important;
                }

                .login-tabs .ant-tabs-tab:hover {
                    color: var(--primary-color) !important;
                }

                .login-tabs .ant-tabs-tab-active {
                    color: var(--primary-color) !important;
                }

                .login-tabs .ant-tabs-ink-bar {
                    background: linear-gradient(90deg, var(--primary-color), var(--primary-hover)) !important;
                    height: 3px !important;
                    border-radius: 3px !important;
                }

                .input-group {
                    display: flex;
                    align-items: center;
                    background: rgba(255,255,255,0.08);
                    border: 1px solid rgba(255,255,255,0.15);
                    border-radius: 16px;
                    padding: 0 20px;
                    height: 60px;
                    transition: all 0.3s ease;
                    width: 100%;
                    margin-bottom: 16px;
                }

                .input-group:focus-within {
                    border-color: #52c41a;
                    background: rgba(255,255,255,0.1);
                    box-shadow: 0 0 0 3px rgba(82, 196, 26, 0.15);
                    transform: translateY(-2px);
                }

                .input-icon {
                    font-size: 22px;
                    margin-right: 14px;
                    opacity: 0.7;
                    min-width: 26px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                /* Reset ALL ant-design input styles inside .input-group to prevent double borders */
                .input-group .ant-input,
                .input-group .ant-input-password,
                .input-group .ant-input-affix-wrapper {
                    background: transparent !important;
                    border: none !important;
                    border-radius: 0 !important;
                    box-shadow: none !important;
                    color: white !important;
                    font-size: 17px !important;
                    height: 100% !important;
                    padding: 0 !important;
                }

                .input-group .ant-input-affix-wrapper:focus,
                .input-group .ant-input-affix-wrapper-focused,
                .input-group .ant-input:focus {
                    border: none !important;
                    box-shadow: none !important;
                }

                .input-group .ant-input-password input {
                    background: transparent !important;
                    color: white !important;
                    font-size: 17px !important;
                }

                .auth-field-input {
                    background: transparent !important;
                    color: white !important;
                    font-size: 17px !important;
                    flex: 1;
                    height: 100% !important;
                    padding: 0 !important;
                    box-shadow: none !important;
                    border: none !important;
                }

                .input-group .ant-input::placeholder,
                .input-group .ant-input-password input::placeholder {
                    color: rgba(255,255,255,0.4) !important;
                }

                .input-group .ant-input-password-icon {
                    color: rgba(255,255,255,0.5) !important;
                    font-size: 18px !important;
                }

                .input-group .ant-input-password-icon:hover {
                    color: white !important;
                }

                /* Phone input specific styles */
                .phone-input-wrapper {
                    margin-bottom: 16px;
                }

                .phone-input {
                    background: rgba(255,255,255,0.08) !important;
                    border: 1px solid rgba(255,255,255,0.15) !important;
                    border-radius: 16px !important;
                    height: 60px !important;
                    transition: all 0.3s ease !important;
                }

                .phone-input:focus,
                .phone-input:focus-within {
                    border-color: #52c41a !important;
                    background: rgba(255,255,255,0.1) !important;
                    box-shadow: 0 0 0 3px rgba(82, 196, 26, 0.15) !important;
                    transform: translateY(-2px);
                }

                .phone-input .ant-input {
                    background: transparent !important;
                    border: none !important;
                    color: white !important;
                    font-size: 17px !important;
                    height: 100% !important;
                }

                .phone-input .ant-input::placeholder {
                    color: rgba(255,255,255,0.4) !important;
                }

                .phone-input .ant-input-group-addon {
                    background: transparent !important;
                    border: none !important;
                    padding: 0 0 0 16px !important;
                }

                .phone-input .ant-select-selector {
                    background: transparent !important;
                    border: none !important;
                    color: white !important;
                    height: 100% !important;
                    padding: 0 !important;
                }

                .phone-input .ant-select-selection-item {
                    color: white !important;
                    line-height: 60px !important;
                }

                .phone-input .ant-select-arrow {
                    color: rgba(255,255,255,0.5) !important;
                }

                .submit-btn {
                    width: 100%;
                    height: 64px;
                    font-size: 20px;
                    font-weight: 700;
                    border-radius: 16px;
                    border: none;
                    cursor: pointer;
                    background: linear-gradient(135deg, #52c41a 0%, #237804 100%);
                    color: white;
                    box-shadow: 0 8px 24px rgba(82, 196, 26, 0.4);
                    transition: all 0.3s ease;
                    margin-top: 10px;
                }

                .submit-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 12px 32px rgba(82, 196, 26, 0.5);
                }

                .submit-btn:active {
                    transform: translateY(0px);
                }

                .submit-btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                    transform: none;
                }

                .ant-form-item {
                    margin-bottom: 0 !important;
                }

                .ant-form-item-explain-error {
                    color: #ff4d4f !important;
                    font-size: 13px !important;
                    margin-top: 4px !important;
                    margin-left: 16px !important;
                }

                .google-btn {
                    width: 100%;
                    height: 56px;
                    font-size: 17px;
                    font-weight: 600;
                    border-radius: 16px;
                    border: 1px solid rgba(255,255,255,0.15);
                    background: rgba(255,255,255,0.07);
                    color: white;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 12px;
                    transition: all 0.2s;
                }

                .google-btn:hover {
                    background: rgba(255,255,255,0.12);
                    border-color: rgba(255,255,255,0.3);
                }

                .google-btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }
            `}</style>
        </>
    );
};

export default UnifiedLoginForm;
