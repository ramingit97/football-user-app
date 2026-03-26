import { useState } from 'react';
import { Tabs, Form, Input, Button, message, Modal, Select, Space, Radio } from 'antd';
import { PhoneOutlined, UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { auth } from '../../../firebase';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../../../store/store';
import { useLoginMutation, useLoginWithPhoneMutation } from '../../../store/authApi';
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
    const [activeTab, setActiveTab] = useState('phone');
    const [loginMode, setLoginMode] = useState('phone'); // 'phone' or 'username'

    // Phone login state
    const [countryCode, setCountryCode] = useState('+994');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [confirmationResult, setConfirmationResult] = useState(null);
    const [phoneLoading, setPhoneLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Email/Username login
    const [login, { isLoading: emailLoading }] = useLoginMutation();
    const [loginWithPhone] = useLoginWithPhoneMutation();
    const dispatch = useDispatch();

    // Phone login logic
    const onCaptchVerify = () => {
        if (!window.recaptchaVerifier) {
            window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
                'size': 'invisible',
                'callback': () => { },
                'expired-callback': () => { }
            });
        }
    };

    const onPhoneSubmit = () => {
        if (!phoneNumber) {
            message.error(t('auth.unifiedLogin.phoneRequired'));
            return;
        }

        setPhoneLoading(true);
        onCaptchVerify();

        const appVerifier = window.recaptchaVerifier;
        const cleanPhone = phoneNumber.startsWith('0') ? phoneNumber.substring(1) : phoneNumber;
        const formattedPhone = `${countryCode}${cleanPhone}`;

        signInWithPhoneNumber(auth, formattedPhone, appVerifier)
            .then((confirmationResult) => {
                window.confirmationResult = confirmationResult;
                setConfirmationResult(confirmationResult);
                setPhoneLoading(false);
                setIsModalOpen(true);
                message.success(t('auth.unifiedLogin.codeSent'));
            }).catch((error) => {
                console.error("Firebase Auth Error:", error);
                setPhoneLoading(false);
                if (error.code === 'auth/invalid-phone-number') {
                    message.error(t('auth.unifiedLogin.invalidPhone'));
                } else if (error.code === 'auth/too-many-requests') {
                    message.error(t('auth.unifiedLogin.tooManyAttempts'));
                } else {
                    message.error(`${t('auth.unifiedLogin.smsSendError')} ${error.message}`);
                }
            });
    };

    const verifyOtp = async () => {
        setPhoneLoading(true);
        try {
            const result = await confirmationResult.confirm(verificationCode);
            const user = result.user;
            const idToken = await user.getIdToken();

            const response = await loginWithPhone(idToken).unwrap();

            if (response) {
                dispatch(setCredentials({
                    user: response.user,
                    token: response.access_token
                }));
                localStorage.setItem('token', response.access_token);
                localStorage.setItem('user', JSON.stringify(response.user));
                message.success(t('auth.unifiedLogin.successLogin'));
                onSuccess();
            }
        } catch (error) {
            console.error(error);
            if (error.code === 'auth/invalid-verification-code') {
                message.error(t('auth.unifiedLogin.wrongCode'));
            } else {
                message.error(t('auth.unifiedLogin.codeVerifyError'));
            }
        } finally {
            setPhoneLoading(false);
            setIsModalOpen(false);
        }
    };

    // Email/Username login logic
    const onCredentialsSubmit = async (values) => {
        try {
            const result = await login(values).unwrap();
            localStorage.setItem('token', result.access_token);
            localStorage.setItem('user', JSON.stringify(result.user));
            message.success(t('auth.unifiedLogin.loginSuccess'));
            onSuccess();
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
                    📱 {t('auth.unifiedLogin.phoneUsername')}
                </span>
            ),
            children: (
                <div style={{ marginTop: '24px' }}>
                    <Radio.Group
                        value={loginMode}
                        onChange={(e) => setLoginMode(e.target.value)}
                        style={{
                            marginBottom: '24px',
                            display: 'flex',
                            gap: '12px',
                            width: '100%'
                        }}
                        buttonStyle="solid"
                    >
                        <Radio.Button value="phone" style={{ flex: 1, textAlign: 'center', height: '48px', lineHeight: '48px', fontSize: '16px' }}>
                            📱 {t('auth.unifiedLogin.phone')}
                        </Radio.Button>
                        <Radio.Button value="username" style={{ flex: 1, textAlign: 'center', height: '48px', lineHeight: '48px', fontSize: '16px' }}>
                            👤 {t('auth.unifiedLogin.username')}
                        </Radio.Button>
                    </Radio.Group>

                    {loginMode === 'phone' ? (
                        <>
                            <div id="recaptcha-container"></div>
                            <Form layout="vertical">
                                <Form.Item>
                                    <div className="phone-input-wrapper">
                                        <Input
                                            addonBefore={prefixSelector}
                                            placeholder="70 123 45 67"
                                            value={phoneNumber}
                                            onChange={(e) => setPhoneNumber(e.target.value)}
                                            className="phone-input"
                                            size="large"
                                        />
                                    </div>
                                </Form.Item>
                                <button
                                    type="button"
                                    className="submit-btn"
                                    onClick={onPhoneSubmit}
                                    disabled={phoneLoading}
                                >
                                    {phoneLoading ? `⏳ ${t('auth.unifiedLogin.sending')}` : `🚀 ${t('auth.unifiedLogin.sendCode')}`}
                                </button>
                            </Form>
                        </>
                    ) : (
                        <Form
                            layout="vertical"
                            onFinish={onCredentialsSubmit}
                        >
                            <Form.Item
                                name="username"
                                rules={[{ required: true, message: t('auth.unifiedLogin.usernamePlaceholder') }]}
                            >
                                <div className="input-group">
                                    <span className="input-icon">👤</span>
                                    <Input
                                        placeholder={t('auth.unifiedLogin.username')}
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

                            <button type="submit" className="submit-btn" disabled={emailLoading}>
                                {emailLoading ? `⏳ ${t('auth.unifiedLogin.signingIn')}` : `🚀 ${t('auth.unifiedLogin.signIn')}`}
                            </button>
                        </Form>
                    )}
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
                    <Form
                        layout="vertical"
                        onFinish={onCredentialsSubmit}
                    >
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

                        <button type="submit" className="submit-btn" disabled={emailLoading}>
                            {emailLoading ? `⏳ ${t('auth.unifiedLogin.signingIn')}` : `🚀 ${t('auth.unifiedLogin.signIn')}`}
                        </button>
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

            <Modal
                title={t('auth.unifiedLogin.enterCode')}
                open={isModalOpen}
                onOk={verifyOtp}
                onCancel={() => setIsModalOpen(false)}
                confirmLoading={phoneLoading}
                okText={t('auth.unifiedLogin.confirm')}
                cancelText={t('auth.unifiedLogin.cancel')}
            >
                <div style={{ textAlign: 'center', marginBottom: 10 }}>
                    <p>{t('auth.unifiedLogin.codeSentTo', { code: countryCode, phone: phoneNumber })}</p>
                    <p style={{ fontSize: 12, color: '#888' }}>
                        {t('auth.unifiedLogin.testCode')}
                    </p>
                </div>
                <Input
                    placeholder="123456"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    maxLength={6}
                    style={{ textAlign: 'center', fontSize: '24px', letterSpacing: '8px' }}
                />
            </Modal>

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

                .ant-radio-button-wrapper {
                    background: rgba(255,255,255,0.05) !important;
                    border-color: rgba(255,255,255,0.15) !important;
                    color: var(--text-secondary) !important;
                    transition: all 0.3s ease !important;
                }

                .ant-radio-button-wrapper:hover {
                    color: var(--primary-color) !important;
                    border-color: var(--primary-color) !important;
                }

                .ant-radio-button-wrapper-checked {
                    background: var(--primary-color) !important;
                    border-color: var(--primary-color) !important;
                    color: white !important;
                }

                .ant-radio-button-wrapper-checked:hover {
                    background: var(--primary-hover) !important;
                    border-color: var(--primary-hover) !important;
                }

                .ant-radio-button-wrapper::before {
                    display: none !important;
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
            `}</style>
        </>
    );
};

export default UnifiedLoginForm;
