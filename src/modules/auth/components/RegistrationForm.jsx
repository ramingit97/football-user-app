import { useState } from 'react';
import { Form, Input, Button, Checkbox, message, Select, Space } from 'antd';
import {
    UserOutlined,
    MailOutlined,
    PhoneOutlined,
    LockOutlined
} from '@ant-design/icons';
import { useRegisterMutation } from '../../../store/authApi';
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

const RegistrationForm = ({ onSuccess }) => {
    const { t } = useTranslation();
    const [register, { isLoading }] = useRegisterMutation();
    const [form] = Form.useForm();
    const [countryCode, setCountryCode] = useState('+994');

    const onFinish = async (values) => {
        try {
            // Combine country code and phone number
            // Strip leading 0 if present
            const cleanPhone = values.phone.startsWith('0') ? values.phone.substring(1) : values.phone;
            const fullPhone = `${countryCode}${cleanPhone}`;

            const result = await register({
                name: values.name,
                email: values.email,
                phone: fullPhone,
                password: values.password
            }).unwrap();

            localStorage.setItem('token', result.access_token);
            localStorage.setItem('user', JSON.stringify(result.user));

            message.success(t('auth.registration.success'));

            if (onSuccess) {
                onSuccess(result.user);
            }
        } catch (error) {
            message.error(error.data?.message || t('auth.registration.error'));
        }
    };

    const prefixSelector = (
        <Select
            value={countryCode}
            onChange={setCountryCode}
            style={{ width: 100 }}
            dropdownMatchSelectWidth={false}
        >
            {countryCodes.map(c => (
                <Option key={c.code} value={c.code}>
                    <Space>{c.flag} {c.code}</Space>
                </Option>
            ))}
        </Select>
    );

    return (
        <Form
            form={form}
            name="registration"
            onFinish={onFinish}
            layout="vertical"
            requiredMark={false}
            className="form-container"
        >
            <Form.Item
                name="name"
                label={t('auth.registration.nameLabel')}
                rules={[
                    { required: true, message: t('auth.registration.nameRequired') },
                    { min: 2, message: t('auth.registration.nameMinLength') }
                ]}
            >
                <Input
                    prefix={<UserOutlined style={{ color: 'rgba(255,255,255,0.3)' }} />}
                    placeholder={t('auth.registration.namePlaceholder')}
                    size="large"
                />
            </Form.Item>

            <Form.Item
                name="email"
                label="Email"
                rules={[
                    { required: true, message: t('auth.unifiedLogin.emailRequired') },
                    { type: 'email', message: t('auth.unifiedLogin.emailInvalid') }
                ]}
            >
                <Input
                    prefix={<MailOutlined style={{ color: 'rgba(255,255,255,0.3)' }} />}
                    placeholder="example@email.com"
                    size="large"
                />
            </Form.Item>

            <Form.Item
                name="phone"
                label={t('common.phone')}
                rules={[
                    { required: true, message: t('auth.unifiedLogin.phoneRequired') },
                    { pattern: /^[\d\s\-\+\(\)]+$/, message: t('auth.registration.invalidPhone') }
                ]}
            >
                <Input
                    addonBefore={prefixSelector}
                    placeholder="70 123 45 67"
                    size="large"
                />
            </Form.Item>

            <Form.Item
                name="password"
                label={t('common.password')}
                rules={[
                    { required: true, message: t('auth.registration.passwordRequired') },
                    { min: 6, message: t('auth.registration.passwordMinLength') }
                ]}
            >
                <Input.Password
                    prefix={<LockOutlined style={{ color: 'rgba(255,255,255,0.3)' }} />}
                    placeholder={t('auth.registration.passwordPlaceholder')}
                    size="large"
                />
            </Form.Item>

            <Form.Item
                name="confirmPassword"
                label={t('auth.registration.confirmPasswordLabel')}
                dependencies={['password']}
                rules={[
                    { required: true, message: t('auth.registration.confirmPasswordRequired') },
                    ({ getFieldValue }) => ({
                        validator(_, value) {
                            if (!value || getFieldValue('password') === value) {
                                return Promise.resolve();
                            }
                            return Promise.reject(new Error(t('auth.registration.passwordMismatch')));
                        },
                    }),
                ]}
            >
                <Input.Password
                    prefix={<LockOutlined style={{ color: 'rgba(255,255,255,0.3)' }} />}
                    placeholder={t('auth.registration.confirmPasswordPlaceholder')}
                    size="large"
                />
            </Form.Item>

            <Form.Item
                name="agreement"
                valuePropName="checked"
                rules={[
                    {
                        validator: (_, value) =>
                            value ? Promise.resolve() : Promise.reject(new Error(t('auth.registration.agreementRequired'))),
                    },
                ]}
            >
                <Checkbox style={{ color: 'var(--text-secondary)' }}>
                    {t('auth.registration.agreementText')} <a href="#" style={{ color: 'var(--primary-color)' }}>{t('auth.registration.termsLink')}</a>
                </Checkbox>
            </Form.Item>

            <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
                <Button
                    type="primary"
                    htmlType="submit"
                    loading={isLoading}
                    block
                    size="large"
                >
                    {t('auth.registration.submitBtn')}
                </Button>
            </Form.Item>
        </Form>
    );
};

export default RegistrationForm;
