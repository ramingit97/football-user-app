import { useState, useEffect } from 'react';
import { Form, Input, Select, Slider, InputNumber, message, Tooltip, Modal } from 'antd';
import { SaveOutlined, CopyOutlined, PhoneOutlined, MailOutlined, EditOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useUpdateProfileMutation } from '../../../store/authApi';

const { TextArea } = Input;
const { Option } = Select;

// ── Section header ────────────────────────────────
const Section = ({ label, children }) => (
    <div style={{ marginBottom: 28 }}>
        <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            marginBottom: 18,
        }}>
            <span style={{
                fontSize: 11, fontWeight: 700, letterSpacing: '0.8px',
                textTransform: 'uppercase', color: 'var(--text-tertiary)',
                fontFamily: 'Outfit, sans-serif',
            }}>
                {label}
            </span>
            <div style={{ flex: 1, height: 1, background: 'var(--border-color)' }} />
        </div>
        {children}
    </div>
);

// ── Field label ───────────────────────────────────
const FieldLabel = ({ children }) => (
    <span style={{
        fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)',
        fontFamily: 'Outfit, sans-serif', display: 'block', marginBottom: 6,
    }}>
        {children}
    </span>
);

const ContactField = ({ value, href, icon, copyLabel }) => {
    const [copied, setCopied] = useState(false);
    const copy = (e) => {
        e.preventDefault();
        if (!value) return;
        navigator.clipboard.writeText(value).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1800);
        });
    };
    return (
        <div style={{
            display: 'flex', alignItems: 'center',
            background: 'var(--bg-raised)',
            border: '1px solid var(--border-color)',
            borderRadius: 8, padding: '10px 14px',
            gap: 10, minHeight: 46,
        }}>
            <span style={{ color: 'var(--text-tertiary)', fontSize: 14, flexShrink: 0 }}>{icon}</span>
            {href ? (
                <a href={href} style={{ flex: 1, color: 'var(--text-secondary)', fontSize: 14, fontFamily: 'Outfit, sans-serif', textDecoration: 'none' }}>
                    {value}
                </a>
            ) : (
                <span style={{ flex: 1, color: 'var(--text-tertiary)', fontSize: 14, fontFamily: 'Outfit, sans-serif' }}>—</span>
            )}
            {value && (
                <Tooltip title={copied ? copyLabel : 'Copy'}>
                    <CopyOutlined
                        onClick={copy}
                        style={{ color: copied ? 'var(--green)' : 'var(--text-tertiary)', fontSize: 14, cursor: 'pointer', flexShrink: 0, transition: 'color 0.2s' }}
                    />
                </Tooltip>
            )}
        </div>
    );
};

const COUNTRY_CODES = [
    { code: '+994', flag: '🇦🇿', name: 'AZ' },
    { code: '+90',  flag: '🇹🇷', name: 'TR' },
    { code: '+7',   flag: '🇷🇺', name: 'RU' },
    { code: '+1',   flag: '🇺🇸', name: 'US' },
    { code: '+44',  flag: '🇬🇧', name: 'GB' },
    { code: '+49',  flag: '🇩🇪', name: 'DE' },
    { code: '+33',  flag: '🇫🇷', name: 'FR' },
    { code: '+380', flag: '🇺🇦', name: 'UA' },
];

function parsePhone(fullPhone) {
    if (!fullPhone) return { code: '+994', number: '' };
    for (const c of COUNTRY_CODES) {
        if (fullPhone.startsWith(c.code)) {
            return { code: c.code, number: fullPhone.slice(c.code.length) };
        }
    }
    return { code: '+994', number: fullPhone.replace(/^\+/, '') };
}

const ProfileForm = ({ initialData = {} }) => {
    const { t } = useTranslation();
    const [form] = Form.useForm();
    const [updateProfile, { isLoading }] = useUpdateProfileMutation();
    const [isDirty, setIsDirty] = useState(false);

    // Phone state
    const parsed = parsePhone(initialData.phone);
    const [countryCode, setCountryCode] = useState(parsed.code);
    const [phoneNumber, setPhoneNumber] = useState(parsed.number);

    // Email state
    const isPhoneEmail = initialData.email?.includes('@phone.auth');
    const [localEmail, setLocalEmail] = useState(isPhoneEmail ? '' : (initialData.email || ''));

    const positions = [
        { value: 'goalkeeper', label: t('positions.goalkeeper'), emoji: '🧤' },
        { value: 'defender',   label: t('positions.defender'),   emoji: '🛡️' },
        { value: 'midfielder', label: t('positions.midfielder'), emoji: '⚙️' },
        { value: 'forward',    label: t('positions.forward'),    emoji: '⚡' },
        { value: 'any',        label: t('positions.any'),        emoji: '🔄' },
    ];

    const skillLevels = [
        { value: 'beginner',     label: t('skillLevel.beginner') },
        { value: 'amateur',      label: t('skillLevel.amateur') },
        { value: 'intermediate', label: t('skillLevel.intermediate') },
        { value: 'advanced',     label: t('skillLevel.advanced') },
        { value: 'professional', label: t('skillLevel.professional') },
    ];

    useEffect(() => {
        if (initialData) {
            form.setFieldsValue(initialData);
            const p = parsePhone(initialData.phone);
            setCountryCode(p.code);
            setPhoneNumber(p.number);
            setLocalEmail(initialData.email?.includes('@phone.auth') ? '' : (initialData.email || ''));
        }
    }, [initialData, form]);

    const onFinish = async (values) => {
        const fullPhone = phoneNumber.trim() ? `${countryCode}${phoneNumber.trim().replace(/^0/, '')}` : undefined;
        const emailVal = localEmail.trim() || undefined;

        // Warn if phone changed
        const oldPhone = initialData.phone;
        if (fullPhone && fullPhone !== oldPhone) {
            const confirmed = await new Promise(res =>
                Modal.confirm({
                    title: 'Nömrəni dəyişmək istəyirsiniz?',
                    content: `${oldPhone || '—'} → ${fullPhone}`,
                    okText: 'Bəli', cancelText: 'Xeyr',
                    onOk: () => res(true), onCancel: () => res(false),
                })
            );
            if (!confirmed) return;
        }

        try {
            const payload = { ...values };
            if (fullPhone) payload.phone = fullPhone;
            if (emailVal && !isPhoneEmail) payload.email = emailVal;
            await updateProfile(payload).unwrap();
            message.success(t('profile.edit.saveSuccess'));
            setIsDirty(false);
        } catch (error) {
            message.error(error.data?.message || t('profile.edit.saveError'));
        }
    };

    return (
        <Form
            form={form}
            onFinish={onFinish}
            onValuesChange={() => setIsDirty(true)}
            layout="vertical"
            requiredMark={false}
            initialValues={initialData}
        >
            {/* ── Header ── */}
            <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '20px 24px',
                borderBottom: '1px solid var(--border-color)',
                marginBottom: 28,
            }}>
                <span style={{
                    fontFamily: "'ClashDisplay-Variable', 'Clash Display', sans-serif", fontWeight: 700,
                    fontSize: 17, color: 'var(--text-primary)',
                }}>
                    {t('profile.edit.title')}
                </span>
                <button
                    type="submit"
                    disabled={!isDirty || isLoading}
                    style={{
                        background: isDirty ? 'var(--green)' : 'var(--bg-raised)',
                        border: 'none', borderRadius: 8,
                        padding: '8px 20px',
                        color: isDirty ? '#060c18' : 'var(--text-tertiary)',
                        fontWeight: 700, fontSize: 13,
                        fontFamily: 'Outfit, sans-serif',
                        cursor: isDirty ? 'pointer' : 'default',
                        display: 'flex', alignItems: 'center', gap: 6,
                        transition: 'all 0.2s',
                        opacity: isLoading ? 0.7 : 1,
                    }}
                    onClick={() => form.submit()}
                >
                    <SaveOutlined />
                    {isLoading ? '...' : t('profile.edit.save')}
                </button>
            </div>

            <div style={{ padding: '0 24px 24px' }}>

                {/* ── Basic info ── */}
                <Section label={t('profile.edit.basicInfo')}>
                    <div style={{ marginBottom: 16 }}>
                        <FieldLabel>{t('profile.edit.nameLabel')}</FieldLabel>
                        <Form.Item name="name" rules={[{ required: true, message: t('profile.edit.nameRequired') }]} style={{ marginBottom: 0 }}>
                            <Input placeholder={t('profile.edit.namePlaceholder')} size="large" />
                        </Form.Item>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
                        {/* Phone with country code */}
                        <div>
                            <FieldLabel>{t('profile.edit.phoneLabel')}</FieldLabel>
                            <div style={{ display: 'flex', gap: 0 }}>
                                <Select
                                    value={countryCode}
                                    onChange={(v) => { setCountryCode(v); setIsDirty(true); }}
                                    size="large"
                                    style={{ width: 110, flexShrink: 0 }}
                                    popupMatchSelectWidth={false}
                                >
                                    {COUNTRY_CODES.map(c => (
                                        <Option key={c.code} value={c.code}>
                                            {c.flag} {c.code}
                                        </Option>
                                    ))}
                                </Select>
                                <Input
                                    prefix={<PhoneOutlined style={{ color: 'var(--text-tertiary)' }} />}
                                    value={phoneNumber}
                                    onChange={e => { setPhoneNumber(e.target.value); setIsDirty(true); }}
                                    size="large"
                                    placeholder="501234567"
                                    style={{ flex: 1, borderLeft: 'none', borderRadius: '0 8px 8px 0' }}
                                />
                            </div>
                            <span style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4, display: 'block' }}>
                                Dəyişdikdə yenidən yoxlanılacaq
                            </span>
                        </div>

                        {/* Email */}
                        <div>
                            <FieldLabel>{t('profile.edit.emailLabel')}</FieldLabel>
                            {isPhoneEmail ? (
                                <Input
                                    prefix={<MailOutlined style={{ color: 'var(--text-tertiary)' }} />}
                                    value={localEmail}
                                    onChange={e => { setLocalEmail(e.target.value); setIsDirty(true); }}
                                    size="large"
                                    placeholder="email@example.com"
                                    type="email"
                                />
                            ) : (
                                <Input
                                    prefix={<MailOutlined style={{ color: 'var(--text-tertiary)' }} />}
                                    value={localEmail}
                                    onChange={e => { setLocalEmail(e.target.value); setIsDirty(true); }}
                                    size="large"
                                    type="email"
                                />
                            )}
                        </div>
                    </div>

                    <div>
                        <FieldLabel>{t('profile.edit.bioLabel')}</FieldLabel>
                        <Form.Item name="bio" style={{ marginBottom: 0 }}>
                            <TextArea placeholder={t('profile.edit.bioPlaceholder')}
                                rows={3} maxLength={300} showCount />
                        </Form.Item>
                    </div>
                </Section>

                {/* ── Personal data ── */}
                <Section label={t('profile.edit.personalData')}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 16 }}>
                        <div>
                            <FieldLabel>{t('profile.edit.ageLabel')}</FieldLabel>
                            <Form.Item name="age" style={{ marginBottom: 0 }}>
                                <InputNumber min={14} max={70} style={{ width: '100%' }} size="large" />
                            </Form.Item>
                        </div>
                        <div>
                            <FieldLabel>{t('profile.edit.heightLabel')}</FieldLabel>
                            <Form.Item name="height" style={{ marginBottom: 0 }}>
                                <InputNumber min={100} max={250} style={{ width: '100%' }} size="large" />
                            </Form.Item>
                        </div>
                        <div>
                            <FieldLabel>{t('profile.edit.weightLabel')}</FieldLabel>
                            <Form.Item name="weight" style={{ marginBottom: 0 }}>
                                <InputNumber min={30} max={150} style={{ width: '100%' }} size="large" />
                            </Form.Item>
                        </div>
                    </div>

                    <div>
                        <FieldLabel>{t('profile.edit.districtLabel')}</FieldLabel>
                        <Form.Item name="city" style={{ marginBottom: 0 }}>
                            <Select placeholder={t('profile.edit.districtPlaceholder')} size="large">
                                <Option value="nasimi">{t('districts.nasimi')}</Option>
                                <Option value="sabail">{t('districts.sabail')}</Option>
                                <Option value="yasamal">{t('districts.yasamal')}</Option>
                                <Option value="nizami">{t('districts.nizami')}</Option>
                                <Option value="binagadi">{t('districts.binagadi')}</Option>
                                <Option value="sabunchu">{t('districts.sabunchu')}</Option>
                                <Option value="surakhani">{t('districts.surakhani')}</Option>
                                <Option value="khazar">{t('districts.khazar')}</Option>
                                <Option value="pirallahi">{t('districts.pirallahi')}</Option>
                                <Option value="garadagh">{t('districts.garadagh')}</Option>
                                <Option value="absheron">{t('districts.absheron')}</Option>
                            </Select>
                        </Form.Item>
                    </div>
                </Section>

                {/* ── Game params ── */}
                <Section label={t('profile.edit.gameParams')}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
                        <div>
                            <FieldLabel>{t('profile.edit.positionLabel')}</FieldLabel>
                            <Form.Item name="position" style={{ marginBottom: 0 }}>
                                <Select placeholder={t('profile.edit.positionPlaceholder')} size="large">
                                    {positions.map(pos => (
                                        <Option key={pos.value} value={pos.value}>{pos.emoji} {pos.label}</Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </div>
                        <div>
                            <FieldLabel>{t('profile.edit.skillLabel')}</FieldLabel>
                            <Form.Item name="skillLevel" style={{ marginBottom: 0 }}>
                                <Select placeholder={t('profile.edit.skillPlaceholder')} size="large">
                                    {skillLevels.map(l => (
                                        <Option key={l.value} value={l.value}>{l.label}</Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
                        <div>
                            <FieldLabel>{t('profile.edit.footLabel')}</FieldLabel>
                            <Form.Item name="preferredFoot" style={{ marginBottom: 0 }}>
                                <Select placeholder={t('profile.edit.footPlaceholder')} size="large">
                                    <Option value="right">{t('foot.right')}</Option>
                                    <Option value="left">{t('foot.left')}</Option>
                                    <Option value="both">{t('foot.both')}</Option>
                                </Select>
                            </Form.Item>
                        </div>
                        <div>
                            <FieldLabel>{t('profile.edit.shirtNumberLabel')}</FieldLabel>
                            <Form.Item name="shirtNumber" style={{ marginBottom: 0 }}>
                                <InputNumber min={1} max={99} style={{ width: '100%' }} size="large" />
                            </Form.Item>
                        </div>
                    </div>

                    <div>
                        <FieldLabel>{t('profile.edit.physicalLabel')}</FieldLabel>
                        <Form.Item name="physicalLevel" style={{ marginBottom: 0 }}>
                            <Slider marks={{
                                0:   t('profile.edit.physicalBeginning'),
                                50:  t('profile.edit.physicalMiddle'),
                                100: t('profile.edit.physicalAthlete'),
                            }} />
                        </Form.Item>
                    </div>
                </Section>

                {/* ── Preferences ── */}
                <Section label={t('profile.edit.preferences')}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
                        <div>
                            <FieldLabel>{t('profile.edit.daysLabel')}</FieldLabel>
                            <Form.Item name="preferredDays" style={{ marginBottom: 0 }}>
                                <Select mode="multiple" placeholder={t('profile.edit.daysPlaceholder')} size="large">
                                    <Option value="monday">{t('days.monday')}</Option>
                                    <Option value="tuesday">{t('days.tuesday')}</Option>
                                    <Option value="wednesday">{t('days.wednesday')}</Option>
                                    <Option value="thursday">{t('days.thursday')}</Option>
                                    <Option value="friday">{t('days.friday')}</Option>
                                    <Option value="saturday">{t('days.saturday')}</Option>
                                    <Option value="sunday">{t('days.sunday')}</Option>
                                </Select>
                            </Form.Item>
                        </div>
                        <div>
                            <FieldLabel>{t('profile.edit.timeLabel')}</FieldLabel>
                            <Form.Item name="preferredTime" style={{ marginBottom: 0 }}>
                                <Select mode="multiple" placeholder={t('profile.edit.timePlaceholder')} size="large">
                                    <Option value="morning">{t('timeOfDay.morning')}</Option>
                                    <Option value="afternoon">{t('timeOfDay.afternoon')}</Option>
                                    <Option value="evening">{t('timeOfDay.evening')}</Option>
                                </Select>
                            </Form.Item>
                        </div>
                    </div>

                    <div>
                        <FieldLabel>{t('profile.edit.notificationsLabel')}</FieldLabel>
                        <Form.Item name="notifications" style={{ marginBottom: 0 }}>
                            <Select size="large">
                                <Option value={true}>{t('profile.edit.notificationsOn')}</Option>
                                <Option value={false}>{t('profile.edit.notificationsOff')}</Option>
                            </Select>
                        </Form.Item>
                    </div>
                </Section>

            </div>
        </Form>
    );
};

export default ProfileForm;
